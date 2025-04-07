const { validateRotationRequirements } = require('../utils/validationUtils.js');
const { encryptCredentials: encrypt, decryptCredentials: decrypt } = require('../utils/encryption.js');
const fs = require('fs').promises;
const path = require('path');

// Config file path
const CONFIG_PATH = path.join(process.cwd(), 'data', 'smtp-configs.json');

// Create a proper Node.js service instead of React hooks
class SMTPHandler {
  constructor() {
    this.smtpConfigs = [];
  }

  async initialize() {
    try {
      await this.loadConfigs();
      if (this.smtpConfigs.length === 0) {
        console.warn('No SMTP configurations found. Please add a new SMTP configuration.');
      }
      return { success: true, message: 'Configs loaded successfully' };
    } catch (error) {
      console.error('Error initializing SMTP handler:', error);
      return { success: false, message: 'Failed to initialize SMTP handler' };
    }
  }

  async loadConfigs() {
    try {
      const dir = path.dirname(CONFIG_PATH);
      await fs.mkdir(dir, { recursive: true });

      const data = await fs.readFile(CONFIG_PATH, 'utf8');
      this.smtpConfigs = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn('SMTP config file does not exist. Initializing with empty config.');
        this.smtpConfigs = [];
        await this.saveConfigsToFile();
      } else if (error instanceof SyntaxError) {
        console.error('Error parsing SMTP config file. The file may be corrupted.');
        this.smtpConfigs = [];
        await this.saveConfigsToFile();
      } else {
        throw error;
      }
    }
  }

  async saveConfigsToFile() {
    const dir = path.dirname(CONFIG_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(CONFIG_PATH, JSON.stringify(this.smtpConfigs, null, 2));
  }

  async getConfigs() {
    await this.loadConfigs();
    return this.smtpConfigs;
  }

  async getConfigsWithDecryptedPasswords() {
    await this.loadConfigs();
    return this.smtpConfigs.map(config => ({
      ...config,
      auth: {
        ...config.auth,
        pass: decrypt(config.auth.pass)
      }
    }));
  }

  async saveConfig(config) {
    try {
      if (!config.host || !config.port || !config.username || !config.password) {
        throw new Error('Missing required SMTP configuration fields');
      }

      const secureConfig = {
        host: config.host,
        port: parseInt(config.port),
        secure: config.secure || false,
        auth: {
          user: config.username,
          pass: encrypt(config.password)
        }
      };

      await this.loadConfigs();
      const existingIndex = this.smtpConfigs.findIndex(c => c.host === config.host && c.auth.user === config.username);

      if (existingIndex >= 0) {
        this.smtpConfigs[existingIndex] = secureConfig;
      } else {
        this.smtpConfigs.push(secureConfig);
      }

      await this.saveConfigsToFile();
      console.log(`SMTP config for ${config.host} saved successfully.`);
      return { success: true, message: 'SMTP configuration saved successfully' };
    } catch (error) {
      console.error('SMTP Config Error:', error);
      throw error;
    }
  }

  validateRotation(smtpConfigs, templates, names, subjects) {
    return validateRotationRequirements(smtpConfigs, templates, names, subjects);
  }
}

module.exports = new SMTPHandler();