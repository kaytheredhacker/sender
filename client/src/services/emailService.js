import { sendEmails } from './api';

class EmailService {
    constructor() {
        this.smtpConfigIndex = 0;
        this.templateIndex = 0;
        this.nameIndex = 0;
        this.subjectIndex = 0;
        this.emailCount = 0;
        this.successCount = 0;
        this.failureCount = 0;
        this.isSending = false;
    }

    async sendEmailCampaign({
        recipients,
        names,
        subjects,
        templates,
        smtpConfigs,
        onProgress,
        onError
    }) {
        if (this.isSending) {
            throw new Error('Email campaign is already in progress');
        }

        this.isSending = true;
        this.emailCount = 0;
        this.successCount = 0;
        this.failureCount = 0;

        try {
            // Instead of sending emails one by one, send them all in a single batch
            console.log('Sending email campaign with:', {
                recipients: recipients.length,
                names: names.length,
                subjects: subjects.length,
                templates: templates.length,
                smtpConfigs: smtpConfigs.length
            });

            // Send the entire batch at once
            const result = await sendEmails({
                recipients,
                names,
                subjects,
                templates,
                smtpConfigs
            });

            // The progress will be updated by the event listeners in EmailForm.jsx
            // which listen to 'email:sending-status' and 'email:progress' events

            return {
                status: 'complete',
                summary: {
                    successful: this.successCount,
                    failed: this.failureCount,
                    total: this.emailCount
                }
            };

        } catch (error) {
            console.error('Error sending email campaign:', error);
            onError({
                error: error.message
            });
            throw error;
        } finally {
            this.isSending = false;
        }
    }

    async sendSingleEmail({ recipient, name, subject, template, smtpConfig }) {
        try {
            console.log('sendSingleEmail called with smtpConfig:', smtpConfig);

            const result = await sendEmails({
                recipients: [recipient],
                names: [name],
                subjects: [subject],
                templates: [template],
                smtpConfigs: [smtpConfig] // Fix: Pass as array with smtpConfigs key
            });

            return result;
        } catch (error) {
            throw new Error(`Failed to send email to ${recipient}: ${error.message}`);
        }
    }

    reset() {
        this.smtpConfigIndex = 0;
        this.templateIndex = 0;
        this.nameIndex = 0;
        this.subjectIndex = 0;
        this.emailCount = 0;
        this.successCount = 0;
        this.failureCount = 0;
        this.isSending = false;
    }
}

export const emailService = new EmailService();