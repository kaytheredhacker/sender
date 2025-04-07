/**
 * File Utilities
 * Handles file operations for email templates and other resources
 */

const fs = require('fs').promises;  // Replace import with require, using fs.promises
const path = require('path');  // Replace import with require
const { Buffer } = require('buffer');  // Replace import with require
const randomstring = require('randomstring');  // Replace import with require


/**
 * Reads file contents from the specified path
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - File contents
 */
const readFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return data;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw new Error(`Failed to read file: ${error.message}`);
  }
};

/**
 * Reads and personalizes an email template for a specific recipient
 * @param {string} letterPath - Path to the email template file
 * @param {string} email - Recipient email address
 * @returns {Promise<string>} - Personalized email content
 */
const readLetter = async (letterPath, email) => {
  try {
    const template = await readFile(letterPath);
    return personalizeTemplate(template, email);
  } catch (error) {
    console.error(`Error reading letter template ${letterPath}:`, error);
    throw new Error(`Failed to read letter template: ${error.message}`);
  }
};

/**
 * Personalizes a template with recipient-specific information
 * @param {string} template - Email template
 * @param {string} email - Recipient email address
 * @returns {string} - Personalized template
 */
const personalizeTemplate = (template, email) => {
  if (!template) return null;

  const [emailUsername, domain] = email.split('@');
  const domainName = domain?.split('.')[0] || 'Unknown';
  const toBase64 = (str) => Buffer.from(str).toString('base64');

  return template
    .replace(/GIRLUSER/g, emailUsername)
    .replace(/GIRLDOMC/g, domainName.charAt(0).toUpperCase() + domainName.slice(1))
    .replace(/GIRLdomain/g, domainName)
    .replace(/GIRLDOMAIN/g, domain)
    .replace(/TECHGIRLEMAIL/g, email)
    .replace(/TECHGIRLEMAIL64/g, toBase64(email))
    .replace(/TECHGIRLRND/g, randomstring.generate({ length: 5, charset: 'alphabetic' }))
    .replace(/TECHGIRLRNDLONG/g, randomstring.generate({ length: 50, charset: 'alphabetic' }));
};

module.exports = {
  readFile,
  readLetter,
  personalizeTemplate
};