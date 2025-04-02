contextBridge.exposeInMainWorld('electronAPI', Object.freeze({
  saveSmtpConfig: (config) => ipcRenderer.invoke('smtp:save-config', config),
  getSmtpConfigs: () => ipcRenderer.invoke('smtp:get-configs'),  // ✅ Make sure this is present
  testSmtpConfig: (config) => ipcRenderer.invoke('smtp:test-config', config),
  deleteSmtpConfig: (configName) => ipcRenderer.invoke('smtp:delete-config', configName),

  sendEmail: (data) => ipcRenderer.invoke('email:send', data),
  sendBatchEmails: (data) => ipcRenderer.invoke('email:send-batch', data),

  loadTemplate: (templatePath) => ipcRenderer.invoke('template:load', templatePath),
  personalizeTemplate: (data) => ipcRenderer.invoke('template:personalize', data),
  saveTemplate: (data) => ipcRenderer.invoke('template:save', data),
  getAllTemplates: () => ipcRenderer.invoke('template:get-all')
}));
