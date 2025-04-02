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

    const handleConfigSave = (configs) => {
        setSmtpConfigs(configs);
        setError(null);
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
            <h2>Tech-Girl-Nerd V2</h2>
            
            <SMTPConfig onConfigSave={handleConfigSave} />
            
            <FileUpload
                onRecipientsChange={setRecipients}
                onNamesChange={setNames}
                onSubjectsChange={setSubjects}
            />
            
            <TemplateEditor
                onTemplateChange={(template) => setTemplates([...templates, template])}
            />
            
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
            
            <Progress status={progress.status} message={progress.message} />
            
            <button
                className="send-button"
                onClick={handleSendEmails}
                disabled={progress.status === 'sending'}
            >
                {progress.status === 'sending' ? 'Sending...' : 'Send Emails'}
            </button>
        </div>
    );
};

export default EmailForm;