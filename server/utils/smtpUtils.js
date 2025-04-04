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

    // Make sure secure is a boolean and correctly set based on port
    let secure = false;
    if (typeof config.secure === 'boolean') {
      secure = config.secure;
    } else if (config.secure === 'true') {
      secure = true;
    }

    // Override secure setting based on port for common SMTP providers
    // Port 587 should always use STARTTLS (secure: false)
    // Port 465 should always use SSL/TLS (secure: true)
    if (port === 587) {
      secure = false;
      console.log('Port 587 detected, setting secure to false (using STARTTLS)');
    } else if (port === 465) {
      secure = true;
      console.log('Port 465 detected, setting secure to true (using SSL/TLS)');
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