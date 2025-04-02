import React, { useState, useEffect } from 'react';
import '../styles/SMTPConfig.css';

const SMTPConfig = () => {
  const [configs, setConfigs] = useState([]);
  const [error, setError] = useState(null);
  const [newConfig, setNewConfig] = useState({
    name: '',
    host: '',
    port: '',
    username: '',
    password: '',
    secure: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.getSmtpConfigs();
      if (result.success) {
        setConfigs(result.configs);
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
      const result = await window.electronAPI.saveSmtpConfig(newConfig);
      if (result.success) {
        await loadConfigs();
        setNewConfig({
          name: '',
          host: '',
          port: '',
          username: '',
          password: '',
          secure: false
        });
      } else {
        setError(result.message || 'Failed to save configuration');
      }
    } catch (err) {
      setError('Failed to save SMTP configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfig = async (name) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await window.electronAPI.deleteSmtpConfig(name);
      if (result.success) {
        await loadConfigs();
      } else {
        setError(result.message || 'Failed to delete configuration');
      }
    } catch (err) {
      setError('Failed to delete SMTP configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConfig = async (config) => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.testSmtpConfig(config);
      if (result.success) {
        alert('SMTP configuration test successful!');
      } else {
        setError(result.message || 'SMTP test failed');
      }
    } catch (err) {
      setError('Failed to test SMTP configuration');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  return (
    <div className="smtp-config">
      <h2>SMTP Configurations</h2>
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <form onSubmit={handleSaveConfig} className="config-form">
        <div className="form-group">
          <label htmlFor="name">Configuration Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={newConfig.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="host">SMTP Host:</label>
          <input
            type="text"
            id="host"
            name="host"
            value={newConfig.host}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="port">Port:</label>
          <input
            type="number"
            id="port"
            name="port"
            value={newConfig.port}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={newConfig.username}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={newConfig.password}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="secure"
              checked={newConfig.secure}
              onChange={handleInputChange}
            />
            Use Secure Connection (SSL/TLS)
          </label>
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Configuration'}
        </button>
      </form>

      <div className="configs-list">
        <h3>Saved Configurations</h3>
        {configs.map((config) => (
          <div key={config.name} className="config-item">
            <div className="config-details">
              <h4>{config.name}</h4>
              <p>{config.host}:{config.port}</p>
              <p>Username: {config.username}</p>
            </div>
            <div className="config-actions">
              <button
                onClick={() => handleTestConfig(config)}
                disabled={isLoading}
              >
                Test
              </button>
              <button
                onClick={() => handleDeleteConfig(config.name)}
                disabled={isLoading}
                className="delete-btn"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SMTPConfig;