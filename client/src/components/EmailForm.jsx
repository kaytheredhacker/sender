import React, { useState } from 'react';
import { emailService } from '../services/emailService';
import SMTPConfig from './SMTPConfig';
import FileUpload from './FileUpload';
import TemplateEditor from './TemplateEditor';
import Progress from './Progress';
import '../styles/EmailForm.css';

const EmailForm = () => {
    const [smtpConfigs, setSmtpConfigs] = useState([]);
    const [recipients, setRecipients] = useState([]);
    const [names, setNames] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [progress, setProgress] = useState({ status: 'idle', message: '' });
    const [error, setError] = useState(null);
    const [errors, setErrors] = useState([]);

    const handleConfigSave = async (configs) => {
        try {
            setSmtpConfigs(Array.isArray(configs) ? configs : [configs]);
            setError(null);
        } catch (err) {
            setError('Failed to save SMTP configuration');
        }
    };

    const handleSendEmails = async () => {
        if (!smtpConfigs.length) {
            setError('Please add at least one SMTP configuration');
            return;
        }

        if (!recipients.length || !names.length || !subjects.length || !templates.length) {
            setError('Please fill in all required fields');
            return;
        }

        setProgress({ status: 'sending', message: 'Starting email campaign...' });
        setError(null);
        setErrors([]);
        emailService.reset();

        try {
            const result = await emailService.sendEmailCampaign({
                recipients,
                names,
                subjects,
                templates,
                smtpConfigs,
                onProgress: (progress) => {
                    setProgress(progress);
                },
                onError: (error) => {
                    setErrors(prev => [...prev, error]);
                }
            });

            setProgress({
                status: 'complete',
                message: `Campaign completed. Successfully sent ${result.summary.successful} emails. Failed: ${result.summary.failed}`
            });
        } catch (err) {
            setError(err.message);
            setProgress({ status: 'error', message: 'Failed to send emails' });
        }
    };

    return (
        <div className="email-form">
            <h2>Email Campaign Manager</h2>

            <div className="smtp-config">
                <h3>SMTP Configuration</h3>
                <SMTPConfig onConfigSave={handleConfigSave} />
            </div>

            <div className="file-upload">
                <h3>Email Lists</h3>
                <FileUpload
                    onRecipientsChange={setRecipients}
                    onNamesChange={setNames}
                    onSubjectsChange={setSubjects}
                />
            </div>

            <div className="template-editor">
                <h3>Email Template</h3>
                <TemplateEditor
                    onTemplateChange={(template) => setTemplates([...templates, template])}
                />
            </div>

            {error && <div className="error-message">{error}</div>}

            {errors.length > 0 && (
                <div className="errors-list">
                    <h4>Failed Emails:</h4>
                    {errors.map((err, index) => (
                        <div key={index} className="error-item">
                            <span>{err.recipient}</span>
                            <span>{err.error}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="progress">
                <h3>Campaign Progress</h3>
                <Progress status={progress.status} message={progress.message} />
            </div>

            <button
                className="send-button"
                onClick={handleSendEmails}
                disabled={progress.status === 'sending'}
            >
                {progress.status === 'sending' ? 'SENDING...' : 'LAUNCH CAMPAIGN'}
            </button>
        </div>
    );
};

export default EmailForm;