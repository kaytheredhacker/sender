const nodemailer = require('nodemailer');
const fs = require('fs/promises');
const path = require('path');
const { fileURLToPath } = require('url');
const { dirname } = require('path');

// Fix __dirname equivalent for ES modules
console.log(__filename); // This will work without any manual declaration

class EmailSender {
    constructor() {
        this.transporter = null;
        this.smtpConfig = null;
    }

    async init() {
        try {
            const configPath = path.join(__dirname, 'config.json');
            let smtpConfig;
            
            try {
                const configData = await fs.readFile(configPath, 'utf8');
                const config = JSON.parse(configData);
                smtpConfig = config.smtp;
            } catch (error) {
                // Fallback to environment variables if config file doesn't exist
                smtpConfig = {
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT),
                    username: process.env.SMTP_USER,
                    password: process.env.SMTP_PASS
                };
            }

            if (!smtpConfig?.host || !smtpConfig?.username || !smtpConfig?.password) {
                throw new Error('Invalid SMTP configuration');
            }

            this.smtpConfig = smtpConfig;
            this.transporter = nodemailer.createTransport({
                host: smtpConfig.host,
                port: parseInt(smtpConfig.port),
                secure: parseInt(smtpConfig.port) === 465,
                auth: {
                    user: smtpConfig.username,
                    pass: smtpConfig.password
                },
                // Add better error handling and timeout settings
                connectionTimeout: 10000,
                greetingTimeout: 10000,
                socketTimeout: 10000
            });

            await this.transporter.verify();
            console.log('SMTP Connection verified successfully');
        } catch (error) {
            console.error('Failed to initialize SMTP connection:', error);
            throw error;
        }
    }

    async sendEmail(options) {
        if (!this.transporter) {
            await this.init();
        }

        try {
            const mailOptions = {
                from: options.from || `"${this.smtpConfig.username}" <${this.smtpConfig.username}>`,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
                // Add additional email headers for better deliverability
                headers: {
                    'X-Priority': '3',
                    'X-MSMail-Priority': 'Normal',
                    'X-Mailer': 'NodeMailer',
                    'Message-ID': `<${Date.now()}@${this.smtpConfig.host}>`
                }
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', result.messageId);
            return result;
        } catch (error) {
            console.error('Failed to send email:', error);
            throw error;
        }
    }

    async updateConfig(newConfig) {
        try {
            const configPath = path.join(__dirname, 'config.json');
            let config = {};
            
            try {
                const existingConfig = await fs.readFile(configPath, 'utf8');
                config = JSON.parse(existingConfig);
            } catch (error) {
                // Starting with empty config if file doesn't exist
            }

            // Validate new config before saving
            if (!newConfig?.host || !newConfig?.username || !newConfig?.password) {
                throw new Error('Invalid SMTP configuration provided');
            }

            config.smtp = newConfig;
            await fs.writeFile(configPath, JSON.stringify(config, null, 2));
            
            // Reinitialize with new config
            await this.init();
            
            return true;
        } catch (error) {
            console.error('Failed to update SMTP configuration:', error);
            throw error;
        }
    }
}

module.exports = EmailSender;