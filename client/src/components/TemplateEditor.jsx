import React, { useState, useEffect } from 'react';
import '../styles/TemplateEditor.css';

const TemplateEditor = ({ onTemplateChange }) => {
    const [template, setTemplate] = useState('');
    const [templateName, setTemplateName] = useState('');
    const [savedTemplates, setSavedTemplates] = useState([]);
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

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

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            // Debug: Check if window.electronAPI exists
            console.log('Loading templates, window.electronAPI:', window.electronAPI);

            if (window.electronAPI && window.electronAPI.getAllTemplates) {
                const result = await window.electronAPI.getAllTemplates();
                if (result.success) {
                    console.log('Templates loaded:', result.templates);
                    setSavedTemplates(result.templates || []);
                } else {
                    throw new Error(result.message || 'Failed to load templates');
                }
            } else {
                throw new Error('Electron API not available for loading templates');
            }
        } catch (err) {
            console.error('Load templates error:', err);
            setError('Failed to load templates: ' + err.message);
        }
    };

    const handleSave = async () => {
        if (!templateName.trim() || !template.trim()) {
            setError('Template name and content are required');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            // Debug: Check if window.electronAPI exists
            console.log('window.electronAPI:', window.electronAPI);

            // Try direct access to window.electronAPI
            if (window.electronAPI && window.electronAPI.saveTemplate) {
                const result = await window.electronAPI.saveTemplate({
                    name: templateName,
                    content: template
                });

                if (result.success) {
                    // Update local state with new template
                    setSavedTemplates(prev => {
                        const newTemplates = [...prev, { name: templateName, content: template, id: result.template?.id || Date.now() }];
                        return newTemplates.slice(-4); // Keep only 4 most recent
                    });

                    setTemplateName('');
                    setTemplate('');
                    onTemplateChange(template);
                } else {
                    throw new Error(result.message || 'Failed to save template');
                }
            } else {
                throw new Error('Electron API not available. window.electronAPI: ' +
                    (window.electronAPI ? 'exists but saveTemplate is missing' : 'is undefined'));
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
        onTemplateChange(selectedTemplate.content);
    };

    const handleDeleteTemplate = async (e, templateId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this template?')) {
            setIsDeleting(true);
            try {
                if (window.electronAPI && window.electronAPI.deleteTemplate) {
                    const result = await window.electronAPI.deleteTemplate(templateId);
                    if (result.success) {
                        await loadTemplates();
                    } else {
                        throw new Error(result.message || 'Failed to delete template');
                    }
                } else {
                    throw new Error('Electron API not available for deleting templates');
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
                        <div className="preview-header">Email Preview</div>
                        <div
                            className="preview-content"
                            dangerouslySetInnerHTML={{ __html: template }}
                        />
                    </div>
                ) : (
                    <div className="code-editor">
                        <div className="editor-header">HTML Template</div>
                        <textarea
                            value={template}
                            onChange={(e) => {
                                setTemplate(e.target.value);
                                onTemplateChange(e.target.value);
                            }}
                            spellCheck="false"
                            autoComplete="off"
                            className="code-input"
                            placeholder="Enter your HTML template here..."
                        />
                    </div>
                )}
            </div>

            {error && <div className="error-message">{error}</div>}

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

export default TemplateEditor;