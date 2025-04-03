import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
// import fs from 'fs';
import path from 'path';
import randomstring from 'randomstring';
import { fileURLToPath } from 'url';
import { validateRotationRequirements, validateSmtpConfig, validateEmailRequest } from './utils/validationUtils.js';
import { errorHandler } from './utils/errorUtils.js';
import { replacePlaceholders } from './utils/placeholderUtils.js';
import { rotateSmtp } from './utils/rotationUtils.js';
import { configManager } from './utils/configManager.js';
import { validateEmailTemplate } from './utils/validation.js';
import { encryptCredentials, decryptCredentials } from './utils/encryption.js';

// Import routes
import smtpRoutes from './routes/smtpRoutes.js';
import emailRoutes from './routes/emailRoutes.js';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Load environment variables from .env
dotenv.config();

// Import Winston logger from alert service
import { alertService } from './services/alertService.js';

// Logging Utility
const logger = {
    info: (message) => alertService.logger.info(message),
    error: (message, error) => alertService.alertError(error, { context: message }),
    warn: (message) => alertService.logger.warn(message)
};

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Important for cookies/auth
}));

app.use(express.json()); // Parses JSON requests
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data

// Routes (Example)
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Express App Setup
const DEFAULT_PORT = 5001;
const PORT = process.env.SERVER_PORT || DEFAULT_PORT;

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).send('Server is healthy');
});

// SMTP Connection Utility
const smtpUtils = {
    createTransporter: (config) => {
        return nodemailer.createTransport({
            host: config.host,
            port: parseInt(config.port, 10),
            secure: config.secure || false,
            auth: {
                user: config.username,
                pass: config.password
            },
            connectionTimeout: 15000,
            greetingTimeout: 15000
        });
    }
};

// API Routes - use imported route modules
app.use('/api/smtp', smtpRoutes);
app.use('/api/email', emailRoutes);
app.use(cors());

// 🔹 Fetch SMTP Configurations
app.get('/api/smtp/configs', async (req, res) => {
    try {
        const configs = configManager.read();
        res.json(configs.smtpConfigs);
    } catch (error) {
        logger.error(`Error fetching SMTP configurations: ${error.message}`);
        res.status(500).json({ success: false, message: 'Failed to fetch SMTP configurations' });
    }
});

// 🔹 Save SMTP Configuration (Encrypted)
app.post('/api/smtp/config', async (req, res) => {
    try {
        const config = req.body;
        const validation = validateSmtpConfig(config);

        if (!validation.isValid) {
            return res.status(400).json({ success: false, errors: validation.errors });
        }

        const currentConfigs = configManager.read();
        const isDuplicate = currentConfigs.smtpConfigs.some(
            existing => existing.host === config.host && existing.port === config.port && existing.username === config.username && existing.secure === config.secure
        );

        if (isDuplicate) {
            return res.status(400).json({ success: false, message: 'Duplicate SMTP configuration' });
        }

        const encryptedConfig = encryptCredentials(config);
        currentConfigs.smtpConfigs.push(encryptedConfig);

        if (await configManager.write(currentConfigs)) {
            res.json({ success: true, config });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save configuration' });
        }
    } catch (error) {
        logger.error(`Error saving SMTP configuration: ${error.message}`);
        res.status(500).json({ success: false, message: 'Failed to save configuration' });
    }
});

// 🔹 Save Email Templates
const emailTemplates = [];

app.post('/api/email/templates', (req, res) => {
    const { name, content } = req.body;
    if (!name || !content) {
        return res.status(400).json({ success: false, message: 'Template name and content are required' });
    }
    emailTemplates.push({ id: emailTemplates.length + 1, name, content });
    res.json({ success: true, message: 'Template saved successfully' });
});

// 🔹 Get Email Templates
app.get('/api/email/templates', (req, res) => {
    res.json({ success: true, templates: emailTemplates });
});

// 🔹 Delete Email Template
app.delete('/api/email/templates/:id', (req, res) => {
    const templateId = parseInt(req.params.id, 10);
    const index = emailTemplates.findIndex(t => t.id === templateId);
    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Template not found' });
    }
    emailTemplates.splice(index, 1);
    res.json({ success: true, message: 'Template deleted successfully' });
});

// 🔹 Validate and Send Emails
app.post('/api/send-email', async (req, res) => {
    const { smtpConfigs, templates, names, subjects, recipients } = req.body;

    try {
        const emailValidation = validateEmailRequest(req.body);
        if (!emailValidation.isValid) {
            return res.status(400).json({ success: false, errors: emailValidation.errors });
        }

        validateRotationRequirements(smtpConfigs, templates, names, subjects);
        validateEmailTemplate(templates);

        let emailsSent = 0;
        for (const email of recipients) {
            const encryptedSmtpConfig = rotateSmtp(smtpConfigs, emailsSent, 100)[0];
            const smtpConfig = decryptCredentials(encryptedSmtpConfig);

            const personalizedTemplate = replacePlaceholders(templates, email);
            const messageId = randomstring.generate({ length: 12, charset: 'alphanumeric' });
            const transporter = smtpUtils.createTransporter(smtpConfig);

            const mailOptions = {
                from: `"${names}" <${smtpConfig.username}>`,
                to: email,
                subject: subjects,
                html: personalizedTemplate,
                messageId: `<${messageId}@${smtpConfig.host}>`
            };

            await transporter.sendMail(mailOptions);
            emailsSent++;

            const delay = Math.floor(Math.random() * 5000) + 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        res.json({ success: true, message: `${emailsSent} emails sent successfully` });
    } catch (error) {
        logger.error(`Error sending emails: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 🔹 Global Error Handler
app.use(errorHandler);

// 🔹 Server Setup
const startServer = async () => {
    try {
        const server = app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    } catch (error) {
        if (error.code === 'EADDRINUSE') {
            logger.error(`Port ${PORT} is busy, trying ${PORT + 1}`);
            const server = app.listen(PORT + 1);
        }
    }
};

startServer();

export default app;
