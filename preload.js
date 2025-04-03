// Preload script using CommonJS syntax
const { contextBridge, ipcRenderer } = require('electron');

// Debug: Log that preload script is running
console.log('Preload script is running');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', Object.freeze({
  saveSmtpConfig: (config) => ipcRenderer.invoke('smtp:save-config', config),
  getSmtpConfigs: () => ipcRenderer.invoke('smtp:get-configs'),  // ✅ Make sure this is present
  testSmtpConfig: (config) => ipcRenderer.invoke('smtp:test-config', config),
  deleteSmtpConfig: (configName) => ipcRenderer.invoke('smtp:delete-config', configName),

  sendEmail: (data) => ipcRenderer.invoke('email:send', data),

  loadTemplate: (templatePath) => ipcRenderer.invoke('template:load', templatePath),
  personalizeTemplate: (data) => ipcRenderer.invoke('template:personalize', data),
  saveTemplate: (data) => {
    console.log('saveTemplate called with data:', data);
    return ipcRenderer.invoke('template:save', data);
  },
  getAllTemplates: () => {
    console.log('getAllTemplates called');
    return ipcRenderer.invoke('template:get-all');
  },
  deleteTemplate: (templateId) => {
    console.log('deleteTemplate called with id:', templateId);
    return ipcRenderer.invoke('template:delete', templateId);
  },
  sendBatchEmails: (data) => {
    console.log('sendBatchEmails called with data:', data);
    return ipcRenderer.invoke('email:send-batch', data);
  }
}));
