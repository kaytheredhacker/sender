import React, { useState, useEffect } from 'react';
import { saveTemplate, getTemplates, deleteTemplate } from '../services/api';
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
            const templates = await getTemplates();
            setSavedTemplates(templates);
        } catch (err) {
            setError('Failed to load templates: ' + err.message);
        }
    };

    const handleSave = async () => {
        if (!templateName.trim()) {
            setError('Please enter a template name');
            return;
        }

        if (!template.trim()) {
            setError('Please enter template content');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            await saveTemplate(templateName, template);
            
            // Create new template object
            const newTemplate = { name: templateName, content: template };
            
            // Add new template and keep only the 4 most recent ones
            setSavedTemplates(prevTemplates => {
                const updatedTemplates = [...prevTemplates, newTemplate];
                return updatedTemplates.slice(-4); // Keep only the 4 most recent templates
            });
            
            setTemplateName('');
            setTemplate('');
            onTemplateChange(template);
        } catch (err) {
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
                await deleteTemplate(templateId);
                await loadTemplates();
            } catch (err) {
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
        <div className="template-editor">
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
                        {showPreview ? 'Edit' : 'Preview'}
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="save-button"
                    >
                        {isSaving ? 'Saving...' : 'Save Template'}
                    </button>
                </div>
            </div>

            <div className="template-content">
                <div className="variables-section">
                    <h3>Available Variables</h3>
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
                        <div 
                            className="preview-content"
                            dangerouslySetInnerHTML={{ __html: template }}
                        />
                    </div>
                ) : (
                    <div className="code-editor">
                        <pre>
                            <code>
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
                            </code>
                        </pre>
                    </div>
                )}
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="saved-templates">
                <h3>Saved Templates</h3>
                <div className="template-list">
                    {savedTemplates.map((t) => (
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
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TemplateEditor;