import React, { useState, useEffect } from 'react';
import '../styles/SMTPConfig.css';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaQuestion } from 'react-icons/fa';

const SMTPConfig = ({ onConfigSave }) => {
  const [configs, setConfigs] = useState([]);
  const [error, setError] = useState(null);
  const [newConfig, setNewConfig] = useState({
    name: '',
    host: '',
    port: '',
    username: '',
    password: '',
    secure: false,
    status: 'Not Tested' // New status field
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false); // Control form visibility
  const [editMode, setEditMode] = useState(false); // Track if we're editing
  const [editingConfigName, setEditingConfigName] = useState(null); // Track which config is being edited

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.getSmtpConfigs();
      if (result.success) {
        setConfigs(result.configs);
        // Pass the configs to the parent component
        if (onConfigSave && typeof onConfigSave === 'function') {
          onConfigSave(result.configs);
        }
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to load SMTP configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Prepare the config to save
      const configToSave = {
        ...newConfig,
        status: 'Not Tested' // Always set status to Not Tested when saving
      };

      // If we're in edit mode, we need to delete the old config first
      if (editMode && editingConfigName) {
        await window.electronAPI.deleteSmtpConfig(editingConfigName);
      }

      const result = await window.electronAPI.saveSmtpConfig(configToSave);
      if (result.success) {
        // Load the updated configs
        const configsResult = await window.electronAPI.getSmtpConfigs();
        if (configsResult.success) {
          setConfigs(configsResult.configs);
          // Pass the updated configs to the parent component
          if (onConfigSave && typeof onConfigSave === 'function') {
            onConfigSave(configsResult.configs);
          }
        }

        // Reset the form
        setNewConfig({
          name: '',
          host: '',
          port: '',
          username: '',
          password: '',
          secure: false,
          status: 'Not Tested'
        });
        // Hide the form after successful save
        setShowForm(false);
        setEditMode(false);
        setEditingConfigName(null);
      } else {
        setError(result.message || 'Failed to save configuration');
      }
    } catch (err) {
      setError('Failed to save SMTP configuration: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditConfig = (config) => {
    // Set the form to edit mode
    setEditMode(true);
    setEditingConfigName(config.name);

    // Populate the form with the config data
    setNewConfig({
      ...config,
      // Don't show the actual password, but require it to be re-entered
      password: ''
    });

    // Show the form
    setShowForm(true);
  };

  const handleDeleteConfig = async (name) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await window.electronAPI.deleteSmtpConfig(name);
      if (result.success) {
        // Load the updated configs
        const configsResult = await window.electronAPI.getSmtpConfigs();
        if (configsResult.success) {
          setConfigs(configsResult.configs);
          // Pass the updated configs to the parent component
          if (onConfigSave && typeof onConfigSave === 'function') {
            onConfigSave(configsResult.configs);
          }
        }
      } else {
        setError(result.message || 'Failed to delete configuration');
      }
    } catch (err) {
      setError('Failed to delete SMTP configuration');
    } finally {
      setIsLoading(false);
    }
  };

  // We're keeping this function for manual testing, but it won't be automatically called
  const handleTestConfig = async (config) => {
    setIsLoading(true);
    try {
      // Check if using Gmail with port 587 and secure:true (common mistake)
      if (config.host.includes('gmail.com') && config.port === '587' && config.secure === true) {
        // Automatically fix the configuration
        const fixedConfig = { ...config, secure: false };
        console.log('Fixing Gmail configuration - changing secure from true to false for port 587');

        // Update the config
        const result = await window.electronAPI.testSmtpConfig(fixedConfig);
        if (result.success) {
          // Update the config status to Verified
          const updatedConfigs = configs.map(c => {
            if (c.name === config.name) {
              return { ...fixedConfig, status: 'Verified' };
            }
            return c;
          });
          setConfigs(updatedConfigs);

          // Save the updated status to the store
          const updatedConfig = { ...fixedConfig, status: 'Verified' };
          await window.electronAPI.saveSmtpConfig(updatedConfig);

          // Load the updated configs to pass to the parent component
          const configsResult = await window.electronAPI.getSmtpConfigs();
          if (configsResult.success && onConfigSave && typeof onConfigSave === 'function') {
            onConfigSave(configsResult.configs);
          }

          alert('SMTP configuration test successful! Note: We automatically set secure=false for Gmail port 587.');
        } else {
          setError(`SMTP test failed: ${result.message}`);
        }
      } else {
        // Normal test flow
        const result = await window.electronAPI.testSmtpConfig(config);
        if (result.success) {
          // Update the config status to Verified
          const updatedConfigs = configs.map(c => {
            if (c.name === config.name) {
              return { ...c, status: 'Verified' };
            }
            return c;
          });
          setConfigs(updatedConfigs);

          // Save the updated status to the store
          const updatedConfig = { ...config, status: 'Verified' };
          await window.electronAPI.saveSmtpConfig(updatedConfig);

          // Load the updated configs to pass to the parent component
          const configsResult = await window.electronAPI.getSmtpConfigs();
          if (configsResult.success && onConfigSave && typeof onConfigSave === 'function') {
            onConfigSave(configsResult.configs);
          }

          alert('SMTP configuration test successful!');
        } else {
          // Check for common SMTP errors and provide helpful messages
          if (result.message.includes('WRONG_VERSION_NUMBER')) {
            setError(`SMTP test failed: SSL/TLS configuration error. If using port 587, try setting 'secure' to false. If using port 465, set 'secure' to true.`);
          } else if (result.message.includes('Invalid login')) {
            setError(`SMTP test failed: Invalid username or password. If using Gmail, make sure you've enabled 'Less secure app access' or are using an App Password.`);
          } else {
            setError(`SMTP test failed: ${result.message}`);
          }
        }
      }
    } catch (err) {
      // Check for common SMTP errors in the catch block too
      if (err.message && err.message.includes('WRONG_VERSION_NUMBER')) {
        setError(`SMTP test failed: SSL/TLS configuration error. If using port 587, try setting 'secure' to false. If using port 465, set 'secure' to true.`);
      } else if (err.message && err.message.includes('Invalid login')) {
        setError(`SMTP test failed: Invalid username or password. If using Gmail, make sure you've enabled 'Less secure app access' or are using an App Password.`);
      } else {
        setError('Failed to test SMTP configuration: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to toggle the form visibility
  const toggleForm = () => {
    if (showForm) {
      // If we're hiding the form, reset it
      setNewConfig({
        name: '',
        host: '',
        port: '',
        username: '',
        password: '',
        secure: false,
        status: 'Not Tested'
      });
      setEditMode(false);
      setEditingConfigName(null);
    }
    setShowForm(!showForm);
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  return (
    <div className="config-container">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-btn">✕</button>
        </div>
      )}

      <div className="saved-configs-header">
        <h4>SMTP Configurations</h4>
        <button
          onClick={toggleForm}
          className={`add-smtp-button ${showForm ? 'active' : ''}`}
          title={showForm ? 'Cancel' : 'Add New SMTP Configuration'}
        >
          {showForm ? '✕ Cancel' : <><FaPlus /> Add SMTP</>}
        </button>
      </div>

      {showForm && (
        <div className="config-form-container">
          <form onSubmit={handleSaveConfig} className="config-form">
            <div className="form-group">
              <label htmlFor="name">Configuration Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newConfig.name}
                onChange={handleInputChange}
                placeholder="My SMTP Config"
                required
                readOnly={editMode} // Make name field read-only in edit mode
              />
            </div>

            <div className="form-group">
              <label htmlFor="host">SMTP Host</label>
              <input
                type="text"
                id="host"
                name="host"
                value={newConfig.host}
                onChange={handleInputChange}
                placeholder="smtp.example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="port">Port</label>
              <input
                type="number"
                id="port"
                name="port"
                value={newConfig.port}
                onChange={handleInputChange}
                placeholder="587"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={newConfig.username}
                onChange={handleInputChange}
                placeholder="user@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={newConfig.password}
                onChange={handleInputChange}
                placeholder={editMode ? "Enter new password" : "••••••••"}
                required
              />
            </div>

            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="secure"
                name="secure"
                checked={newConfig.secure}
                onChange={handleInputChange}
              />
              <label htmlFor="secure">Use Secure Connection (SSL/TLS)</label>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-button" disabled={isLoading}>
                {isLoading ? 'SAVING...' : (editMode ? 'UPDATE CONFIGURATION' : 'SAVE CONFIGURATION')}
              </button>
              <button type="button" className="cancel-button" onClick={toggleForm}>
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="saved-configs">
        {configs.length === 0 ? (
          <div className="no-configs">No SMTP configurations saved yet</div>
        ) : (
          <div className="configs-list">
            {configs.map((config) => (
              <div key={config.name} className="config-item">
                <div className="config-status">
                  {config.status === 'Verified' ? (
                    <span className="status verified" title="Verified"><FaCheck /></span>
                  ) : (
                    <span className="status not-tested" title="Not Tested"><FaQuestion /></span>
                  )}
                </div>
                <div className="config-details">
                  <span className="config-name">{config.name}</span>
                  <span className="config-host">{config.host}:{config.port}</span>
                  <span className="config-user">{config.username}</span>
                </div>
                <div className="config-actions">
                  <button
                    onClick={() => handleEditConfig(config)}
                    disabled={isLoading}
                    className="edit-button"
                    title="Edit Configuration"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => handleTestConfig(config)}
                    disabled={isLoading}
                    className="test-button"
                    title="Test Connection"
                  >
                    Test
                  </button>
                  <button
                    onClick={() => handleDeleteConfig(config.name)}
                    disabled={isLoading}
                    className="delete-btn"
                    title="Delete Configuration"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SMTPConfig;