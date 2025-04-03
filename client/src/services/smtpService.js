const smtpService = {
    saveConfig: async (config) => {
        try {
            return await window.electronAPI.saveSmtpConfig(config);
        } catch (error) {
            console.error('SMTP save error:', error);
            throw error;
        }
    },

    getConfigs: async () => {
        try {
            return await window.electronAPI.getSmtpConfigs();
        } catch (error) {
            console.error('Failed to get SMTP configs:', error);
            throw error;
        }
    }
};

export { smtpService };