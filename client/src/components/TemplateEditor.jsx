import React, { useState, useEffect, useCallback } from 'react';
import { isElectron, callElectronAPI, getMockData } from '../utils/electronUtils';
import '../styles/TemplateEditor.css';

const TemplateEditor = ({ onTemplateChange }) => {
    const [template, setTemplate] = useState('');
    const [templateName, setTemplateName] = useState('');
    const [savedTemplates, setSavedTemplates] = useState([]);
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewEmail, setPreviewEmail] = useState('');

    const variables = [
        { name: 'GIRLUSER', description: 'Username part of email' },
        { name: 'GIRLDOMC', description: 'Capitalized domain name' },
        { name: 'GIRLdomain', description: 'Domain name without extension' },
        { name: 'GIRLDOMAIN', description: 'Full domain' },
        { name: 'TECHGIRLEMAIL', description: 'Full email address' },
        { name: 'TECHGIRLEMAIL64', description: 'Base64 encoded email' },
        { name: 'TECHGIRLRND', description: 'Random 5-char string' },
        { name: 'TECHGIRLRNDLONG', description: 'Random 50-char string' }
    ];

    // Function to process template variables for a specific recipient
    const processTemplateForRecipient = (templateContent, email) => {
        if (!templateContent || !email) return templateContent;

        let processedTemplate = templateContent;

        // Extract username and domain parts
        const [username, domain] = email.split('@');

        // Process domain parts if available
        let domainName = '';
        let domainExt = '';

        if (domain) {
            // Handle domains with or without dots
            if (domain.includes('.')) {
                const domainParts = domain.split('.');
                domainName = domainParts[0];
                domainExt = domainParts.slice(1).join('.');
            } else {
                // For domains without dots (like localhost)
                domainName = domain;
            }
        }

        // Generate random strings
        const randomShort = Math.random().toString(36).substring(2, 7);
        const randomLong = Array(50).fill(0).map(() =>
            Math.random().toString(36).charAt(2)).join('');

        // Base64 encode the email
        const emailBase64 = btoa(email);

        // Replace all variables
        processedTemplate = processedTemplate
            .replace(/GIRLUSER/g, username || '')
            .replace(/GIRLDOMC/g, domainName.toUpperCase() || '')
            .replace(/GIRLdomain/g, domainName || '')
            .replace(/GIRLDOMAIN/g, domain || '')
            .replace(/TECHGIRLEMAIL/g, email)
            .replace(/TECHGIRLEMAIL64/g, emailBase64)
            .replace(/TECHGIRLRND/g, randomShort)
            .replace(/TECHGIRLRNDLONG/g, randomLong);

        return processedTemplate;
    };

    const loadTemplates = useCallback(async () => {
        try {
            console.log('Loading templates, in Electron:', isElectron());

            let result;
            if (isElectron()) {
                result = await callElectronAPI('getAllTemplates');
            } else {
                // Mock data for browser development
                result = {
                    success: true,
                    templates: getMockData('templates')
                };
            }

            if (result.success) {
                console.log('Templates loaded:', result.templates);
                setSavedTemplates(result.templates || []);
            } else if (!result.mockData) {
                throw new Error(result.message || 'Failed to load templates');
            }
        } catch (err) {
            console.error('Load templates error:', err);
            setError('Failed to load templates: ' + err.message);
        }
    }, []);

    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    const handleSave = async () => {
        if (!templateName.trim() || !template.trim()) {
            setError('Template name and content are required');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            // Extract variables used in this template
            const usedVariables = variables
                .filter(v => template.includes(v.name))
                .map(v => v.name);

            console.log('Saving template with variables:', usedVariables);

            let result;
            if (isElectron()) {
                // Make sure we're passing the data in the correct format
                const templateData = {
                    name: templateName,
                    content: template,
                    variables: usedVariables // Send variables info to backend
                };

                console.log('Saving template with data:', templateData);
                result = await callElectronAPI('saveTemplate', templateData);
                console.log('Save template result:', result);
            } else {
                // Mock successful save for browser development
                result = {
                    success: true,
                    template: {
                        id: Date.now(),
                        name: templateName,
                        content: template,
                        variables: usedVariables
                    }
                };
            }

            if (result.success) {
                console.log('Template saved successfully:', result.template);
                // Update local state with new template
                setSavedTemplates(prev => {
                    const newTemplates = [...prev, {
                        name: templateName,
                        content: template,
                        id: result.template?.id || Date.now(),
                        variables: usedVariables
                    }];
                    return newTemplates.slice(-4); // Keep only 4 most recent
                });

                setTemplateName('');
                setTemplate('');
                // Pass template, variables, and the processing function
                onTemplateChange(template, usedVariables, processTemplateForRecipient);
            } else if (!result.mockData) {
                throw new Error(result.message || 'Failed to save template');
            }
        } catch (err) {
            console.error('Save template error:', err);
            setError('Failed to save template: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleTemplateSelect = (selectedTemplate) => {
        setTemplate(selectedTemplate.content);
        setTemplateName(selectedTemplate.name);
        // Pass template, variables, and the processing function
        const usedVariables = variables
            .filter(v => selectedTemplate.content.includes(v.name))
            .map(v => v.name);
        onTemplateChange(selectedTemplate.content, usedVariables, processTemplateForRecipient);
    };

    const handleDeleteTemplate = async (e, templateId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this template?')) {
            setIsDeleting(true);
            try {
                if (isElectron()) {
                    const result = await callElectronAPI('deleteTemplate', templateId);
                    if (result.success) {
                        await loadTemplates();
                    } else if (!result.mockData) {
                        throw new Error(result.message || 'Failed to delete template');
                    }
                } else {
                    // Mock successful delete for browser development
                    setSavedTemplates(prev => prev.filter(t => t.id !== templateId));
                }
            } catch (err) {
                console.error('Delete template error:', err);
                setError('Failed to delete template: ' + err.message);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const insertVariable = (variable) => {
        const textarea = document.querySelector('.code-input');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText = template.substring(0, start) + variable + template.substring(end);
        setTemplate(newText);
        onTemplateChange(newText);
        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + variable.length;
        }, 0);
    };

    return (
        <div className="template-input">
            <div className="template-header">
                <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Template Name"
                    className="template-name-input"
                />
                <div className="template-actions">
                    <button
                        className={`preview-button ${showPreview ? 'active' : ''}`}
                        onClick={() => setShowPreview(!showPreview)}
                    >
                        {showPreview ? 'EDIT CODE' : 'PREVIEW'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="save-button"
                    >
                        {isSaving ? 'SAVING...' : 'SAVE TEMPLATE'}
                    </button>
                </div>
            </div>

            <div className="template-content">
                <div className="variables-section">
                    <h4>Email Variables</h4>
                    <div className="variables-grid">
                        {variables.map(({ name, description }) => (
                            <div
                                key={name}
                                className="variable-item"
                                onClick={() => insertVariable(name)}
                                title={description}
                            >
                                {name}
                            </div>
                        ))}
                    </div>
                </div>

                {showPreview ? (
                    <div className="preview-container">
                        <div className="preview-header">
                            <span>Email Preview</span>
                            <input
                                type="text"
                                value={previewEmail}
                                onChange={(e) => setPreviewEmail(e.target.value)}
                                placeholder="Enter email for preview"
                                className="preview-email-input"
                            />
                        </div>
                        <div
                            className="preview-content"
                            dangerouslySetInnerHTML={{
                                __html: processTemplateForRecipient(template, previewEmail)
                            }}
                        />
                    </div>
                ) : (
                    <div className="code-editor">
                        <div className="editor-header">HTML Template</div>
                        <textarea
                            value={template}
                            onChange={(e) => {
                                const newTemplate = e.target.value;
                                setTemplate(newTemplate);
                                // Extract variables used in this template
                                const usedVariables = variables
                                    .filter(v => newTemplate.includes(v.name))
                                    .map(v => v.name);
                                // Pass template, variables, and the processing function
                                onTemplateChange(newTemplate, usedVariables, processTemplateForRecipient);
                            }}
                            spellCheck="false"
                            autoComplete="off"
                            className="code-input"
                            placeholder="Enter your HTML code here..."
                        />
                    </div>
                )}
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="brand-logo-container">
                <div className="brand-logo">TECH-GIRL-NERD</div>
            </div>

            <div className="saved-templates">
                <h4>Saved Templates</h4>
                <div className="template-list">
                    {savedTemplates.length === 0 ? (
                        <div className="no-templates">No templates saved yet</div>
                    ) : (
                        savedTemplates.map((t) => (
                            <div
                                key={t.id}
                                className="template-item"
                                onClick={() => handleTemplateSelect(t)}
                            >
                                <span className="template-name">{t.name}</span>
                                <button
                                    className="delete-template-btn"
                                    onClick={(e) => handleDeleteTemplate(e, t.id)}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? '...' : '×'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

TemplateEditor.defaultProps = {
  onTemplateChange: () => {}, // Default to a no-op function
};

export default TemplateEditor;