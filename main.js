// main.js - Fixed version using ES Modules
import pkg from 'electron';
const { app, BrowserWindow, ipcMain } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import winston from 'winston';
import randomstring from 'randomstring';
import { validateSmtpConfig } from './server/utils/validationUtils.js';
import { getCurrentSmtpConfig } from './server/utils/rotationUtils.js';
import { getCurrentTemplate } from './server/utils/templateUtils.js';
import { sendEmail } from './server/services/emailService.js';

// Convert __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize stores with proper configuration
const store = new Store({
  name: 'smtp-configs',
  encryptionKey: 'your-secure-key',
  clearInvalidConfig: true // Clear the store if the config is invalid
});

const templateStore = new Store({
  name: 'email-templates',
  encryptionKey: 'your-secure-key',
  clearInvalidConfig: true, // Clear the store if the config is invalid
  defaults: {
    templates: [] // Set default value for templates
  }
});

// Debug: Log store initialization
console.log('Stores initialized');
console.log('Template store path:', templateStore.path);

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

// Set development mode based on environment variable or default to production
const isDev = process.env.NODE_ENV === 'development';

// In a standalone EXE, we don't need a separate server
// All functionality is handled through IPC

// Create main window function
const createWindow = () => {
  console.log('Creating main window');

  // Log the preload script path
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Preload script path:', preloadPath);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      webSecurity: true, // Enable web security
      allowRunningInsecureContent: false // Don't allow insecure content
    },
    backgroundColor: '#121212', // Dark background color
    icon: path.join(__dirname, 'assets', 'icon.ico') // Windows icon
  });

  // Register window event handlers
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window finished loading');
  });

  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM is ready');
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Use file protocol with correct path
    const indexPath = path.join(__dirname, 'client', 'build', 'index.html');
    console.log('Loading index.html from:', indexPath);

    // Set the base directory for relative paths
    mainWindow.loadFile(indexPath, {
      baseURLForDataURL: `file://${path.join(__dirname, 'client', 'build')}/`
    });

    // Open DevTools in production for debugging
    mainWindow.webContents.openDevTools();
  }

  return mainWindow;
};

// Ensure logs directory exists before app is ready
(async () => {
  try {
    await fs.mkdir(path.join(app.getPath('userData'), 'logs'), { recursive: true });
  } catch (error) {
    logger.warn('Logs directory may already exist');
  }
})();

// App lifecycle events
app.whenReady().then(() => {
  console.log('App is ready');

  // Initialize template store if needed
  if (!templateStore.has('templates')) {
    console.log('Initializing template store with empty array');
    templateStore.set('templates', []);
  } else {
    console.log('Template store already initialized with:', templateStore.get('templates'));
  }

  createWindow();
});

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

// Log any unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  logger.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  logger.error('Unhandled rejection:', { reason });
});

// IPC Handlers
ipcMain.handle('smtp:save-config', async (event, config) => {
  try {
    // Make sure secure is a boolean
    if (config.secure === 'true' || config.secure === true) {
      config.secure = true;
    } else {
      config.secure = false;
    }

    // Add a name if not provided
    if (!config.name) {
      config.name = `${config.username}@${config.host}`;
    }

    const validation = validateSmtpConfig(config);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed: ' + validation.errors.join(', ')
      };
    }

    // Check for duplicates
    const configs = store.get('smtpConfigs') || [];
    const isDuplicate = configs.some(existingConfig =>
      existingConfig.host === config.host &&
      existingConfig.username === config.username
    );

    if (isDuplicate) {
      return { success: false, message: 'This SMTP configuration already exists' };
    }

    configs.push(config);
    store.set('smtpConfigs', configs);
    return { success: true };
  } catch (error) {
    logger.error('Error saving SMTP config:', error);
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
    // Make sure secure is a boolean
    if (config.secure === 'true' || config.secure === true) {
      config.secure = true;
    } else {
      config.secure = false;
    }

    // Override secure setting based on port for common SMTP providers
    const port = parseInt(config.port, 10);
    if (port === 587) {
      config.secure = false;
      console.log('Port 587 detected, setting secure to false (using STARTTLS)');
    } else if (port === 465) {
      config.secure = true;
      console.log('Port 465 detected, setting secure to true (using SSL/TLS)');
    }

    // Validate the config first
    const validation = validateSmtpConfig(config);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed: ' + validation.errors.join(', ')
      };
    }

    // Create the transporter with proper timeout settings
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: parseInt(config.port, 10),
      secure: config.secure,
      auth: { user: config.username, pass: config.password },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,   // 10 seconds
      socketTimeout: 15000      // 15 seconds
    });

    // Verify the connection
    await transporter.verify();
    return { success: true, message: 'SMTP connection successful!' };
  } catch (error) {
    logger.error('SMTP test failed:', error);
    return {
      success: false,
      message: `SMTP test failed: ${error.message}`
    };
  }
});

ipcMain.handle('email:send', async (event, { to, fromName, subject, html, config }) => {
  try {
    // Make sure secure is a boolean
    if (config.secure === 'true' || config.secure === true) {
      config.secure = true;
    } else {
      config.secure = false;
    }

    // Override secure setting based on port for common SMTP providers
    const port = parseInt(config.port, 10);
    if (port === 587) {
      config.secure = false;
      console.log('Port 587 detected, setting secure to false (using STARTTLS)');
    } else if (port === 465) {
      config.secure = true;
      console.log('Port 465 detected, setting secure to true (using SSL/TLS)');
    }

    // Create the transporter with proper timeout settings
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: parseInt(config.port, 10),
      secure: config.secure,
      auth: { user: config.username, pass: config.password },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,   // 10 seconds
      socketTimeout: 15000      // 15 seconds
    });

    // Generate a message ID
    const messageId = randomstring.generate({ length: 12, charset: 'alphanumeric' });

    // Send the email
    const result = await transporter.sendMail({
      from: `"${fromName}" <${config.username}>`,
      to,
      subject,
      html,
      messageId: `<${messageId}@${config.host}>`,
      headers: {
        'X-Mailer': 'NodeMailer',
        'X-Priority': '3',
        'X-Spam-Status': 'No, score=0.0',
        'X-Content-Type-Message-Body': '1',
        'Reply-To': config.username,
        'Return-Path': config.username
      }
    });

    return {
      success: true,
      messageId: result.messageId,
      message: `Email sent successfully to ${to}`
    };
  } catch (error) {
    logger.error('Email send failed:', error);
    return {
      success: false,
      message: `Failed to send email: ${error.message}`
    };
  }
});

ipcMain.handle('email:send-batch', async (event, { recipients, templates, smtpConfigs, names, subjects }) => {
  try {
    // Debug: Log the received data
    console.log('email:send-batch received:', {
      recipientsCount: recipients?.length || 0,
      templatesCount: templates?.length || 0,
      smtpConfigsCount: smtpConfigs?.length || 0,
      namesCount: names?.length || 0,
      subjectsCount: subjects?.length || 0
    });

    // Debug: Log the first SMTP config (with password redacted)
    if (smtpConfigs && smtpConfigs.length > 0) {
      const firstConfig = { ...smtpConfigs[0] };
      if (firstConfig.password) {
        firstConfig.password = '********';
      }
      console.log('First SMTP config:', firstConfig);
    }

    // Validate inputs
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return { success: false, message: 'No recipients provided' };
    }

    if (!smtpConfigs || !Array.isArray(smtpConfigs) || smtpConfigs.length === 0) {
      return { success: false, message: 'No SMTP configurations provided' };
    }

    if (!templates || !Array.isArray(templates) || templates.length === 0) {
      return { success: false, message: 'No email templates provided' };
    }

    // Use provided names/subjects or defaults
    const fromNames = names && Array.isArray(names) && names.length > 0 ?
      names : ['Email Sender'];

    const emailSubjects = subjects && Array.isArray(subjects) && subjects.length > 0 ?
      subjects : ['Important Information'];

    let emailCount = 0;
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const recipient of recipients) {
      try {
        // Get current configuration based on rotation
        const currentConfig = getCurrentSmtpConfig(smtpConfigs, emailCount);
        const template = getCurrentTemplate(templates, emailCount);
        const fromName = fromNames[emailCount % fromNames.length];
        const subject = emailSubjects[emailCount % emailSubjects.length];

        // Send the email
        const messageId = await sendEmail(
          currentConfig,
          recipient,
          fromName,
          subject,
          template.content || template.html || template
        );

        results.push({ recipient, messageId, success: true });
        emailCount++;

        // Add a random delay between emails (1-5 seconds)
        const delay = Math.floor(Math.random() * 4000) + 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        // Send progress update
        event.sender.send('email:progress', {
          current: emailCount,
          total: recipients.length,
          success: true,
          recipient
        });
      } catch (error) {
        logger.error(`Failed to send email to ${recipient}:`, error);
        results.push({ recipient, success: false, error: error.message });
        failureCount++;

        // Send progress update
        event.sender.send('email:progress', {
          current: emailCount,
          total: recipients.length,
          success: false,
          recipient,
          error: error.message
        });
      }
    }

    return {
      success: true,
      results,
      stats: {
        total: recipients.length,
        sent: emailCount,
        success: successCount,
        failed: failureCount
      }
    };
  } catch (error) {
    logger.error('Batch email sending failed:', error);
    return { success: false, message: error.message };
  }
});

// Template handlers
ipcMain.handle('template:save', async (event, data) => {
  console.log('template:save handler called with data:', data);
  try {
    // Check if data is properly formatted
    if (!data || typeof data !== 'object') {
      console.error('Invalid data format:', data);
      return { success: false, message: 'Invalid data format' };
    }

    const { name, content } = data;

    if (!name || !content) {
      console.error('Missing required fields:', { name, content });
      return { success: false, message: 'Template name and content are required' };
    }

    const templates = templateStore.get('templates') || [];
    console.log('Current templates:', templates);

    const newTemplate = { id: Date.now(), name, content };
    templates.push(newTemplate);
    templateStore.set('templates', templates);

    console.log('Template saved successfully:', newTemplate);
    return { success: true, template: newTemplate };
  } catch (error) {
    console.error('Failed to save template:', error);
    logger.error('Failed to save template:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('template:get-all', () => {
  console.log('template:get-all handler called');
  try {
    const templates = templateStore.get('templates') || [];
    console.log('Retrieved templates:', templates);
    return { success: true, templates };
  } catch (error) {
    console.error('Failed to get templates:', error);
    logger.error('Failed to get templates:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('template:delete', (event, templateId) => {
  console.log('template:delete handler called with id:', templateId);
  try {
    const templates = templateStore.get('templates') || [];
    console.log('Current templates before delete:', templates);

    const updatedTemplates = templates.filter(template => template.id !== templateId);
    templateStore.set('templates', updatedTemplates);

    console.log('Templates after delete:', updatedTemplates);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete template:', error);
    logger.error('Failed to delete template:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('template:load', async (event, templatePath) => {
  try {
    const content = await fs.readFile(templatePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    logger.error(`Failed to load template from ${templatePath}:`, error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('template:personalize', (event, { template, email }) => {
  try {
    if (!template) return { success: false, message: 'No template provided' };
    if (!email) return { success: false, message: 'No email provided' };

    const [username, domain] = email.split('@');
    const domainName = domain?.split('.')[0] || 'Unknown';
    const toBase64 = (str) => Buffer.from(str).toString('base64');

    const personalized = template
      .replace(/GIRLUSER/g, username || '')
      .replace(/GIRLDOMC/g, domainName.charAt(0).toUpperCase() + domainName.slice(1))
      .replace(/GIRLdomain/g, domainName)
      .replace(/GIRLDOMAIN/g, domain || '')
      .replace(/TECHGIRLEMAIL/g, email)
      .replace(/TECHGIRLEMAIL64/g, toBase64(email))
      .replace(/TECHGIRLRND/g, randomstring.generate({ length: 5, charset: 'alphabetic' }))
      .replace(/TECHGIRLRNDLONG/g, randomstring.generate({ length: 50, charset: 'alphabetic' }));

    return { success: true, content: personalized };
  } catch (error) {
    logger.error('Failed to personalize template:', error);
    return { success: false, message: error.message };
  }
});

// SMTP config deletion handler
ipcMain.handle('smtp:delete-config', (event, configName) => {
  try {
    const configs = store.get('smtpConfigs') || [];
    const updatedConfigs = configs.filter(config => config.name !== configName);
    store.set('smtpConfigs', updatedConfigs);
    return { success: true };
  } catch (error) {
    logger.error('Failed to delete SMTP config:', error);
    return { success: false, message: error.message };
  }
});