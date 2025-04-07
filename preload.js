// Preload script using CommonJS syntax
const { contextBridge, ipcRenderer } = require('electron');

// Debug: Log that preload script is running
console.log('Preload script is running');

// Add a global error handler to catch and log any issues
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
});

// Add a DOM content loaded listener to ensure the page is fully loaded
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');
});

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
  },

  // Cancel email sending
  cancelSendingEmails: () => {
    console.log('cancelSendingEmails called');
    return ipcRenderer.invoke('email:cancel-sending');
  },

  // Event listeners for email sending status
  onSendingStatus: (callback) => {
    ipcRenderer.on('email:sending-status', callback);
  },

  offSendingStatus: (callback) => {
    ipcRenderer.removeListener('email:sending-status', callback);
  },

  // Event listeners for email progress
  onEmailProgress: (callback) => {
    ipcRenderer.on('email:progress', callback);
  },

  offEmailProgress: (callback) => {
    ipcRenderer.removeListener('email:progress', callback);
  },

  // Recipient list management
  saveRecipientList: (data) => {
    console.log('saveRecipientList called with data:', data);
    return ipcRenderer.invoke('recipients:save-list', data);
  },

  getRecipientLists: () => {
    console.log('getRecipientLists called');
    return ipcRenderer.invoke('recipients:get-lists');
  },

  deleteRecipientList: (listName) => {
    console.log('deleteRecipientList called with name:', listName);
    return ipcRenderer.invoke('recipients:delete-list', listName);
  }
}));