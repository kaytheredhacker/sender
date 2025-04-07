/**
 * Placeholder Utilities
 * Handles replacement of placeholders in email templates
 */
const randomstring = require('randomstring');
const { Buffer } = require('buffer');

/**
 * Replaces placeholders in a template with actual values
 * @param {string} template - Template string with placeholders
 * @param {Object} data - Object containing values for placeholders
 * @returns {string} - Template with placeholders replaced
 */
const replacePlaceholders = (template, data) => {
  if (!template || typeof template !== 'string') {
    return '';
  }

  try {
    const email = data.email || '';
    const [emailUsername, domain] = email.split('@');
    const domainName = domain?.split('.')[0] || 'Unknown';
    const toBase64 = (str) => Buffer.from(str).toString('base64');
    const randomDate = new Date(Date.now() - Math.random() * 10000000000).toISOString();

    let result = template;

    // Replace standard placeholders in the format {{key}}
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(placeholder, value || '');
    });

    // Replace special placeholders
    return result
      .replace(/GIRLUSER/g, emailUsername || '')
      .replace(/GIRLDOMC/g, domainName.charAt(0).toUpperCase() + domainName.slice(1))
      .replace(/GIRLdomain/g, domainName)
      .replace(/GIRLDOMAIN/g, domain || '')
      .replace(/TECHGIRLEMAIL/g, email)
      .replace(/TECHGIRLEMAIL64/g, toBase64(email))
      .replace(/TECHGIRLRND/g, randomstring.generate({ length: 5, charset: 'alphabetic' }))
      .replace(/TECHGIRLRNDLONG/g, randomstring.generate({ length: 50, charset: 'alphabetic' }))
      .replace(/TECHGIRLDATE/g, randomDate)
      .replace(/TECHGIRLIP/g, `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`)
      .replace(/TECHGIRLUA/g, ['Mozilla/5.0', 'Chrome/91.0.4472.124', 'Safari/605.1.15', 'Edge/91.0.864.59'][Math.floor(Math.random() * 4)]);
  } catch (err) {
    console.error(`Error personalizing the template:`, err);
    return template; // Return the original template if an error occurs
  }
};

/**
 * Extracts placeholders from a template
 * @param {string} template - Template string with placeholders
 * @returns {Array<string>} - Array of placeholder keys
 */
const extractPlaceholders = (template) => {
  if (!template || typeof template !== 'string') {
    return [];
  }

  const placeholderRegex = /{{(.*?)}}/g;
  const placeholders = [];
  let match;

  while ((match = placeholderRegex.exec(template)) !== null) {
    placeholders.push(match[1].trim());
  }

  // Return unique placeholders
  return [...new Set(placeholders)];
};

// Export functions using CommonJS syntax
module.exports = {
  replacePlaceholders,
  extractPlaceholders
};