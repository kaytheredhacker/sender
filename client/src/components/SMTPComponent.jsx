// SMTPComponent.jsx
import React, { useState, useEffect } from 'react';
import { saveSmtpConfig, getSmtpConfigs, deleteTemplate } from '../services/api';

const SMTPSetup = () => {
    const [smtpConfig, setSmtpConfig] = useState(null);
    const [isConfigured, setIsConfigured] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    
    const [showForm, setShowForm] = useState(true);
    const [formData, setFormData] = useState({
        host: '',
        port: '',
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    
    const checkExistingConfig = async () => {
        setIsLoading(true);
        try {
            const configs = await getSmtpConfigs();
            if (configs && configs.length > 0) {
                setSmtpConfig(configs[0]); // Use the first configuration as default
                setIsConfigured(true);
            }
        } catch (error) {
            console.error('Error fetching SMTP configurations:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        checkExistingConfig();
    }, []);
    
    useEffect(() => {
        setShowForm(!isConfigured);
        if (isConfigured && smtpConfig) {
            setFormData(smtpConfig);
        }
    }, [isConfigured, smtpConfig]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!formData.host?.trim()) {
            setError('Host is required');
            return;
        }
        if (!formData.port?.toString().trim()) {
            setError('Port is required');
            return;
        }
        if (!formData.username?.trim()) {
            setError('Username is required');
            return;
        }
        if (!formData.password?.trim()) {
            setError('Password is required');
            return;
        }
        
        const portNumber = parseInt(formData.port, 10);
        if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
            setError('Invalid port number');
            return;
        }
        
        try {
            const configToSave = {
                ...formData,
                port: portNumber
            };
            await saveSmtpConfig(configToSave);
            setShowForm(false);
            setIsConfigured(true);
            setSmtpConfig(configToSave);
        } catch (error) {
            setError(error.message || 'Failed to save SMTP config');
            console.error('Failed to save SMTP config:', error);
        }
    };
    
    const handleDeleteTemplate = async (templateId) => {
        try {
            await deleteTemplate(templateId);
            alert('Template deleted successfully');
            checkExistingConfig();
        } catch (error) {
            console.error('Failed to delete template:', error);
            setError('Failed to delete template');
        }
    };
    
    const previewTemplate = (template, placeholders) => {
        let preview = template;
        Object.keys(placeholders).forEach((key) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            preview = preview.replace(regex, placeholders[key]);
        });
        return preview;
    };
    
    if (isLoading) return <div>Loading...</div>;
    
    if (!showForm) {
        return (
            <div className="smtp-configured">
                <div className="alert success">
                    SMTP is configured and ready
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="edit-config-btn"
                >
                    Edit Configuration
                </button>
                <div>
                    <h2>Templates</h2>
                    {templates.map((template) => (
                        <div key={template.id} className="template-item">
                            <p>{template.name}</p>
                            <button
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="delete-template-btn"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setSelectedTemplate(template)}
                                className="preview-template-btn"
                            >
                                Preview
                            </button>
                        </div>
                    ))}
                </div>
                {selectedTemplate && (
                    <div>
                        <h2>Template Preview</h2>
                        <div className="template-preview">
                            {previewTemplate(selectedTemplate.content, { name: 'John Doe', email: 'john@example.com' })}
                        </div>
                    </div>
                )}
            </div>
        );
    }
    
    return (
        <div>
            <h2>SMTP Configuration</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit} className="smtp-form">
                <div className="form-group">
                    <label htmlFor="host">SMTP Host</label>
                    <input
                        type="text"
                        id="host"
                        name="host"
                        value={formData.host}
                        onChange={handleChange}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="port">Port</label>
                    <input
                        type="number"
                        id="port"
                        name="port"
                        value={formData.port}
                        onChange={handleChange}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                
                <button type="submit" className="save-config-btn">
                    Save Configuration
                </button>
            </form>
        </div>
    );
};

export default SMTPSetup;