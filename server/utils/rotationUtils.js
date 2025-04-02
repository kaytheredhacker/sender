/**
 * Rotation Utilities
 * Handles rotation of SMTP configurations and templates
 */

/**
 * Gets the current SMTP configuration based on email count
 * Rotates SMTP configs every 100 emails
 * @param {Array} smtpConfigs - Array of SMTP configurations
 * @param {number} emailCount - Current email count
 * @returns {Object} - Current SMTP configuration
 */
export const getCurrentSmtpConfig = (smtpConfigs, emailCount) => {
  if (!smtpConfigs || !Array.isArray(smtpConfigs) || smtpConfigs.length === 0) {
    throw new Error('No SMTP configurations available');
  }
  
  // Rotate SMTP configuration every 100 emails
  const index = Math.floor(emailCount / 100) % smtpConfigs.length;
  return smtpConfigs[index];
};

/**
 * Gets the current template based on email count
 * Rotates templates every 50 emails
 * @param {Array} templates - Array of email templates
 * @param {number} emailCount - Current email count
 * @returns {string} - Current template
 */
export const getCurrentTemplate = (templates, emailCount) => {
  if (!templates || !Array.isArray(templates) || templates.length === 0) {
    throw new Error('No templates available');
  }
  
  // Rotate template every 50 emails
  const index = Math.floor(emailCount / 50) % templates.length;
  return templates[index];
};

/**
 * Rotates SMTP configurations based on a custom strategy
 * @param {Array} configs - Array of SMTP configurations
 * @param {number} currentIndex - Current index
 * @param {number} interval - Rotation interval
 * @returns {Object} - Next SMTP configuration and index
 */
export const rotateSmtp = (configs, currentIndex = 0, interval = 100) => {
  if (!configs || !Array.isArray(configs) || configs.length === 0) {
    throw new Error('No SMTP configurations available');
  }
  
  const nextIndex = (currentIndex + 1) % configs.length;
  return {
    config: configs[nextIndex],
    index: nextIndex
  };
};