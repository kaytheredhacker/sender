import React, { useState, useEffect } from 'react';
import { emailService } from '../services/emailService';
import { isElectron, callElectronAPI } from '../utils/electronUtils';
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
    const [isSending, setIsSending] = useState(false);

    // Listen for sending status updates from the main process
    // Track the total emails sent and failed
    const [emailStats, setEmailStats] = useState({ sent: 0, failed: 0, total: 0 });

    useEffect(() => {
        if (!isElectron()) {
            console.log('Running in browser mode - Electron event listeners not available');
            return;
        }

        const handleSendingStatus = (event, data) => {
            console.log('Received sending status:', data);

            if (data.status === 'started') {
                setIsSending(true);
                setEmailStats({ sent: 0, failed: 0, total: data.total });
                setProgress({
                    status: 'sending',
                    message: `Starting email campaign to ${data.total} recipients...`,
                    current: 0,
                    total: data.total
                });
            } else if (data.status === 'completed') {
                setIsSending(false);
                // Update email stats with the values from the server
                setEmailStats(prev => ({ ...prev, sent: data.sent, failed: data.failed }));
                setProgress(prev => ({
                    ...prev,
                    status: 'complete',
                    message: `Email campaign completed. Sent: ${data.sent}, Failed: ${data.failed}`,
                    current: data.sent + data.failed,
                    total: prev.total
                }));
            } else if (data.status === 'cancelled') {
                setIsSending(false);
                setEmailStats(prev => ({ ...prev, sent: data.sent, failed: data.failed }));
                setProgress(prev => ({
                    ...prev,
                    status: 'cancelled',
                    message: `Email campaign cancelled. Sent: ${data.sent}, Failed: ${data.failed}`,
                    current: data.sent + data.failed,
                    total: prev.total
                }));
            } else if (data.status === 'error') {
                setIsSending(false);
                setProgress(prev => ({
                    ...prev,
                    status: 'error',
                    message: `Email campaign failed: ${data.error}`
                }));
                setError(data.error);
            }
        };

        const handleEmailProgress = (event, data) => {
            console.log('Received email progress:', data);

            // Update email stats with the values from the server
            if (data.sent !== undefined && data.failed !== undefined) {
                setEmailStats({
                    sent: data.sent,
                    failed: data.failed,
                    total: data.total
                });
            } else {
                // Fallback to the old way if server doesn't provide counts
                if (data.success) {
                    setEmailStats(prev => ({ ...prev, sent: prev.sent + 1 }));
                } else {
                    setEmailStats(prev => ({ ...prev, failed: prev.failed + 1 }));
                }
            }

            // Add error to the errors list if there is one
            if (!data.success && data.error) {
                setErrors(prev => [...prev, { recipient: data.recipient, error: data.error }]);
            }

            // Update progress without resetting it
            setProgress(prev => ({
                ...prev,
                status: 'sending',
                message: `Sending emails... ${data.current}/${data.total} (${Math.round((data.current/data.total)*100)}%)`,
                current: data.current,
                total: data.total
            }));
        };

        // Add event listeners only if in Electron
        if (window.electronAPI) {
            window.electronAPI.onSendingStatus(handleSendingStatus);
            window.electronAPI.onEmailProgress(handleEmailProgress);

            // Clean up
            return () => {
                window.electronAPI.offSendingStatus(handleSendingStatus);
                window.electronAPI.offEmailProgress(handleEmailProgress);
            };
        }
    }, []);

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
        setIsSending(true);
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

            // The progress will be updated by the event listener
        } catch (err) {
            setError(err.message || 'Failed to send emails');
            setProgress({ status: 'error', message: 'Email campaign failed' });
            setIsSending(false);
        }
    };

    const handleCancelSending = async () => {
        try {
            // Don't change the progress status, just update the message
            setProgress(prevProgress => ({
                ...prevProgress,
                message: prevProgress.message + ' (FORCE STOPPING...)',
            }));

            if (isElectron()) {
                // Call the API to cancel sending
                const result = await callElectronAPI('cancelSendingEmails');
                if (!result.success && !result.mockData) {
                    setError(result.message || 'Failed to cancel email sending');
                }
            }

            // Show a confirmation dialog to the user
            alert('Force stop requested. The application will stop sending emails as soon as possible.');
        } catch (err) {
            setError(err.message || 'Failed to cancel email sending');
        }
    };

    return (
        <div className="email-form">
            <h2>Email Campaign Manager</h2>

            <div className="smtp-config">
                <h3></h3>
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

            <div className="action-buttons">
                <button
                    className="send-button"
                    onClick={handleSendEmails}
                    disabled={isSending || progress.status === 'sending' || progress.status === 'cancelling'}
                >
                    {progress.status === 'sending' ? 'SENDING...' : 'LAUNCH CAMPAIGN'}
                </button>

                <button
                    className="force-quit-button"
                    onClick={handleCancelSending}
                    disabled={!isSending || progress.status === 'cancelling'}
                >
                    {progress.status === 'cancelling' ? 'FORCE STOPPING...' : 'FORCE STOP SENDING'}
                </button>
            </div>
        </div>
    );
};

export default EmailForm;