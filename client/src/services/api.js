// In the standalone app, we use Electron IPC for all API calls
// No HTTP requests are made - everything goes through the main process

// Remove these functions as they're handled by Electron IPC
export const saveSmtpConfig = async (config) => {
    return await window.electronAPI.saveSmtpConfig(config);
};

export const getSmtpConfigs = async () => {
    return await window.electronAPI.getSmtpConfigs();
};

export const saveTemplate = async (name, content) => {
    return await window.electronAPI.saveTemplate({ name, content });
};

export const getTemplates = async () => {
    return await window.electronAPI.getAllTemplates();
};

export const deleteTemplate = async (templateId) => {
    try {
        return await window.electronAPI.deleteTemplate(templateId);
    } catch (error) {
        console.error('Failed to delete template:', error);
        throw new Error(error.message || 'Failed to delete template');
    }
};

export const sendEmails = async ({ recipients, names, subjects, templates, smtpConfigs }) => {
    try {
        return await window.electronAPI.sendBatchEmails({
            recipients,
            names,
            subjects,
            templates,
            smtpConfigs
        });
    } catch (error) {
        console.error('Failed to send emails:', error);
        throw new Error(error.message || 'Failed to send emails');
    }
};

export const saveLists = async (type, content) => {
    try {
        // This would need to be implemented in the main process
        // For now, we'll just return a success response
        return { success: true, message: `${type} saved successfully` };
    } catch (error) {
        console.error(`Failed to save ${type}:`, error);
        throw new Error(`Failed to save ${type}: ${error.message}`);
    }
};

// In a standalone app, we don't use EventSource
// Instead, we use IPC for progress updates
export const startCampaign = () => {
    // This is a simplified version that would need to be implemented
    // with proper IPC communication for progress updates
    return {
        subscribe: (callbacks) => {
            // In a real implementation, we would set up IPC listeners here
            // For now, we'll just simulate progress
            const interval = setInterval(() => {
                callbacks.onProgress?.({
                    status: 'sending',
                    progress: Math.random() * 100
                });
            }, 1000);

            // Cleanup function
            return () => clearInterval(interval);
        }
    };
};

export default {
    getSmtpConfigs,
    saveSmtpConfig,
    saveTemplate,
    deleteTemplate,
    getTemplates,
    sendEmails,
    saveLists,
    startCampaign,
};