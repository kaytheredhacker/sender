// main.js - Fixed version using ES Modules
import pkg from 'electron';
const { app, BrowserWindow, ipcMain } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import { validateSmtpConfig } from './server/utils/smtpUtils.js';
import winston from 'winston';
import { getCurrentSmtpConfig } from './server/utils/smtpUtils.js';
import { getCurrentTemplate } from './server/utils/templateUtils.js';
import { sendEmail } from './server/services/emailService.js';

// Convert __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize stores
const store = new Store({
  name: 'smtp-configs',
  encryptionKey: 'your-secure-key'
});

const templateStore = new Store({
  name: 'email-templates',
  encryptionKey: 'your-secure-key'
});

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(app.getPath('userData'), 'logs', 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(app.getPath('userData'), 'logs', 'combined.log')
    })
  ]
});

let mainWindow;

const isDev = process.env.NODE_ENV === 'development';
const serverPort = process.env.SERVER_PORT || 5001;

// Create main window function
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')  // ✅ Ensure this path is correct
    },
    
    icon: path.join(__dirname, 'assets', 'icon.ico') // Windows icon
  });

  if (isDev) {
    mainWindow.loadURL(`http://localhost:${serverPort}`);
  } else {
    mainWindow.loadFile('./build/index.html');
  }
}

// Ensure logs directory exists before app is ready
(async () => {
  try {
    await fs.mkdir(path.join(app.getPath('userData'), 'logs'), { recursive: true });
  } catch (error) {
    logger.warn('Logs directory may already exist');
  }
})();

// App lifecycle events
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('smtp:save-config', async (event, config) => {
  try {
    const validation = validateSmtpConfig(config);
    if (!validation.isValid) {
      return { success: false, message: validation.message };
    }

    const configs = store.get('smtpConfigs') || [];
    configs.push(config);
    store.set('smtpConfigs', configs);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('smtp:get-configs', () => {
  try {
    return { success: true, configs: store.get('smtpConfigs') || [] };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('smtp:test-config', async (event, config) => {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.username, pass: config.password }
    });

    await transporter.verify();
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('email:send', async (event, { to, fromName, subject, html, config }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.username, pass: config.password }
    });

    const result = await transporter.sendMail({
      from: `"${fromName}" <${config.username}>`,
      to,
      subject,
      html
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('email:send-batch', async (event, { recipients, templates, smtpConfigs }) => {
  try {
    let emailCount = 0;
    const results = [];

    for (const recipient of recipients) {
      const currentConfig = getCurrentSmtpConfig(smtpConfigs, emailCount);
      const template = getCurrentTemplate(templates, emailCount);
      
      const messageId = await sendEmail(
        currentConfig,
        recipient,
        template.fromName,
        template.subject,
        template.html
      );

      results.push({ recipient, messageId, success: true });
      emailCount++;
    }

    return { success: true, results };
  } catch (error) {
    logger.error('Batch email sending failed:', error);
    return { success: false, message: error.message };
  }
});