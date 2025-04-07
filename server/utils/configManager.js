const Store = require('electron-store');  // Replace import with require
const { encryptCredentials, decryptCredentials } = require('./encryption.js');  // Replace import with require

const store = new Store({
  name: 'smtp-configs',
  encryptionKey: 'your-encryption-key',
  projectName: 'your-project-name'
});

const configManager = {
  async read() {
    const configs = store.get('smtpConfigs') || [];
    return configs.map(config => ({
      ...config,
      password: decryptCredentials(config.password)
    }));
  },

  async addConfig(config) {
    try {
      const configs = store.get('smtpConfigs') || [];
      const encryptedConfig = {
        ...config,
        password: encryptCredentials(config.password)
      };
      
      configs.push(encryptedConfig);
      store.set('smtpConfigs', configs);
      
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  async deleteConfig(name) {
    try {
      const configs = store.get('smtpConfigs') || [];
      const filtered = configs.filter(config => config.name !== name);
      store.set('smtpConfigs', filtered);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

// Export using CommonJS syntax
module.exports = { configManager };