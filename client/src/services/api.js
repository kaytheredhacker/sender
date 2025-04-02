import axios from 'axios';

// API Configuration with fallback values
const API_CONFIG = {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
    timeout: process.env.REACT_APP_TIMEOUT || 5000,
    headers: {
        'Content-Type': 'application/json'

        
    }
};

// Create axios instance with config
const api = axios.create(API_CONFIG);

// Request interceptor for API calls
api.interceptors.request.use(
    config => {
        // You can add auth headers or other request modifications here
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
api.interceptors.response.use(
    response => response,
    error => {
        // Global error handling
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

const API_URL = 'http://localhost:5001/api/email'; // Corrected API URL


//  // Corrected backend port
const getSmtpConfigs = async () => {
    if (!window.electronAPI) {
      console.error('Electron API is not available');
      return { success: false, message: 'Electron API not loaded' };
    }
    return await window.electronAPI.getSmtpConfigs();
  };
  

export const saveSmtpConfig = async (config) => {
    try {
        const response = await api.post(`${API_URL}/smtp/config`, {
            ...config,
            port: parseInt(config.port, 10),
        });
        return response.data;
    } catch (error) {
        console.error('Failed to save SMTP configuration:', error);
        throw new Error(error.response?.data?.message || 'Failed to save SMTP configuration');
    }
};


export const saveTemplate = async (name, content) => {
    try {
        const response = await api.post(`${API_URL}/email/templates`, { name, content });
        return response.data;
    } catch (error) {
        console.error('Failed to save template:', error);
        throw new Error(error.response?.data?.message || 'Failed to save template');
    }
};

export const deleteTemplate = async (templateId) => {
    try {
        const response = await api.delete(`${API_URL}/email/templates/${templateId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to delete template:', error);
        throw new Error(error.response?.data?.message || 'Failed to delete template');
    }
};

export const getTemplates = async () => {
    try {
        const response = await api.get(`${API_URL}/email/templates`);
        return response.data.templates;
    } catch (error) {
        console.error('Failed to get templates:', error);
        throw new Error(error.response?.data?.message || 'Failed to get templates');
    }
};

export const sendEmails = async ({ recipients, names, subjects, templates, smtpConfigs }) => {
    try {
        const response = await api.post(`${API_URL}/send-email`, { // Fixed API path
            recipients,
            names,
            subjects,
            templates,
            smtpConfigs, // Fixed incorrect parameter name
        });
        return response.data;
    } catch (error) {
        console.error('Failed to send emails:', error);
        throw new Error(error.response?.data?.message || 'Failed to send emails');
    }
};

export const saveLists = async (type, content) => {
    try {
        const response = await api.post(`${API_URL}/email/upload/${type}`, { content });
        return response.data;
    } catch (error) {
        console.error(`Failed to save ${type}:`, error);
        throw new Error(`Failed to save ${type}: ${error.response?.data?.message || error.message}`);
    }
};

export const startCampaign = () => {
    const eventSource = new EventSource(`${API_URL}/email/send`);
    return {
        eventSource,
        subscribe: (callbacks) => {
            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'progress') {
                    callbacks.onProgress?.(data);
                } else if (data.type === 'complete') {
                    callbacks.onComplete?.();
                    eventSource.close();
                } else if (data.type === 'error') {
                    callbacks.onError?.(new Error(data.error));
                    eventSource.close();
                }
            };

            eventSource.onerror = (error) => {
                console.error('EventSource error:', error);
                callbacks.onError?.(new Error('Connection lost'));
                eventSource.close();
            };
        },
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