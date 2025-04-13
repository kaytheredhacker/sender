/**
 * Utility functions for Electron integration
 */

// Check if we're running in Electron
export const isElectron = () => {
  return window && window.electronAPI;
};

// Safe wrapper for Electron API calls
export const callElectronAPI = async (apiMethod, ...args) => {
  if (isElectron() && window.electronAPI && typeof window.electronAPI[apiMethod] === 'function') {
    try {
      console.log(`Calling Electron API: ${apiMethod}`, args);
      const result = await window.electronAPI[apiMethod](...args);
      console.log(`Electron API ${apiMethod} result:`, result);
      return result;
    } catch (error) {
      console.error(`Error calling Electron API ${apiMethod}:`, error);
      return {
        success: false,
        message: `Error calling ${apiMethod}: ${error.message}`,
      };
    }
  } else {
    console.warn(`Electron API method '${apiMethod}' not available`);
    // Return a mock response for development
    return {
      success: false,
      message: 'Running in browser mode - Electron API not available',
      mockData: true
    };
  }
};

// Mock data for development
export const getMockData = (type) => {
  switch (type) {
    case 'templates':
      return [
        { id: 1, name: 'Sample Template 1', content: '<h1>Hello {{name}}</h1><p>This is a sample template.</p>' },
        { id: 2, name: 'Sample Template 2', content: '<h1>Welcome!</h1><p>This is another sample template.</p>' }
      ];
    case 'smtpConfigs':
      return [
        { id: 1, host: 'smtp.example.com', port: 587, auth: { user: 'user@example.com' } }
      ];
    default:
      return [];
  }
};