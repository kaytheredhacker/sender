import express from 'express';
import { createTransporter } from '../utils/smtpUtils.js';
import { configManager } from './utils/configManager.js';


import { replacePlaceholders } from "../utils/placeholderUtils.js";

const router = express.Router();

/**
 * Send an email
 * @route POST /api/email/send
 */
router.post('/send', async (req, res) => {
  try {
    const { configName, to, subject, html, text, placeholders } = req.body;
    
    if (!configName || !to || (!html && !text)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: configName, to, and either html or text'
      });
    }
    
    // Get SMTP configuration
    const configs = await configManager.read();
    const config = configs.find(c => c.name === configName);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: `SMTP configuration "${configName}" not found`
      });
    }
    
    // Create transporter
    const transporter = createTransporter(config);
    
    // Process email content with placeholders
    const processedHtml = html ? replacePlaceholders(html, placeholders || {}) : undefined;
    const processedText = text ? replacePlaceholders(text, placeholders || {}) : undefined;
    const processedSubject = subject ? replacePlaceholders(subject, placeholders || {}) : 'No Subject';
    
    // Send email
    const info = await transporter.sendMail({
      from: config.from || config.user,
      to,
      subject: processedSubject,
      html: processedHtml,
      text: processedText
    });
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to send email: ${error.message}`
    });
  }
});

export default router;