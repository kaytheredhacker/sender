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
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.password
    }
  });

  await transporter.verify();
  return transporter;
};

/**
 * Gets the current SMTP configuration based on email count
 * @param {Array} configs - Array of SMTP configuration objects
 * @param {number} emailCount - Number of emails sent
 * @returns {Object} - Current SMTP configuration
 */
export const getCurrentSmtpConfig = (configs, emailCount) => {
  const index = Math.floor(emailCount / 100) % configs.length;
  return configs[index];
};