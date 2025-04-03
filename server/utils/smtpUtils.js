import nodemailer from 'nodemailer';

/**
 * Validates SMTP configuration
 * @param {Object} config - SMTP configuration object
 * @returns {Object} - Validation result with isValid and message
 */
export const validateSmtpConfig = (config) => {
  if (!config.host || !config.port || !config.username || !config.password) {
    return { isValid: false, message: 'All SMTP fields are required' };
  }
  return { isValid: true };
};

/**
 * Creates a nodemailer transporter from config
 * @param {Object} config - SMTP configuration object
 * @returns {Object} - Nodemailer transporter
 */
export const createTransporter = async (config) => {
  try {
    console.log('Creating transporter with config:', {
      host: config.host,
      port: parseInt(config.port, 10),
      secure: config.secure || false,
      username: config.username,
      // Password is redacted for security
    });

    // Make sure port is a number
    const port = parseInt(config.port, 10);
    if (isNaN(port)) {
      throw new Error(`Invalid port: ${config.port}`);
    }

    // Make sure secure is a boolean
    let secure = false;
    if (typeof config.secure === 'boolean') {
      secure = config.secure;
    } else if (config.secure === 'true') {
      secure = true;
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: port,
      secure: secure,
      auth: {
        user: config.username,
        pass: config.password
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000
    });

    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    return transporter;
  } catch (error) {
    console.error('Failed to create transporter:', error);
    throw error;
  }
};

// getCurrentSmtpConfig has been moved to rotationUtils.js