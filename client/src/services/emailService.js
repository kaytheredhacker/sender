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

        const rotationState = {
            smtpIndex: 0,
            templateIndex: 0,
            nameIndex: 0,
            subjectIndex: 0
        };

        try {
            for (let i = 0; i < recipients.length; i++) {
                const recipient = recipients[i];

                // Rotate SMTP config every 100 emails
                if (this.emailCount % 100 === 0) {
                    rotationState.smtpIndex = (rotationState.smtpIndex + 1) % smtpConfigs.length;
                    onProgress({
                        status: 'sending',
                        message: `Rotating SMTP configuration (${rotationState.smtpIndex + 1}/${smtpConfigs.length})`
                    });
                }

                // Rotate template every 50 emails
                if (this.emailCount % 50 === 0) {
                    rotationState.templateIndex = (rotationState.templateIndex + 1) % templates.length;
                    onProgress({
                        status: 'sending',
                        message: `Rotating email template (${rotationState.templateIndex + 1}/${templates.length})`
                    });
                }

                // Rotate name and subject every 2 successful emails
                if (this.successCount % 2 === 0) {
                    rotationState.nameIndex = (rotationState.nameIndex + 1) % names.length;
                    rotationState.subjectIndex = (rotationState.subjectIndex + 1) % subjects.length;
                    onProgress({
                        status: 'sending',
                        message: `Rotating name and subject (${rotationState.nameIndex + 1}/${names.length})`
                    });
                }

                // Add random delay between emails (1-10 seconds)
                const delay = Math.floor(Math.random() * 9000) + 1000;
                onProgress({
                    status: 'sending',
                    message: `Waiting ${Math.round(delay/1000)} seconds before sending next email...`
                });
                await new Promise(resolve => setTimeout(resolve, delay));

                try {
                    const result = await this.sendSingleEmail({
                        recipient,
                        name: names[rotationState.nameIndex],
                        subject: subjects[rotationState.subjectIndex],
                        template: templates[rotationState.templateIndex],
                        smtpConfig: smtpConfigs[rotationState.smtpIndex]
                    });

                    this.successCount++;
                    this.emailCount++;
                    
                    onProgress({
                        status: 'sending',
                        message: `Sent ${this.successCount} of ${recipients.length} emails (Template: ${rotationState.templateIndex + 1}, SMTP: ${rotationState.smtpIndex + 1})`,
                        current: this.successCount,
                        total: recipients.length
                    });

                } catch (error) {
                    this.failureCount++;
                    this.emailCount++;
                    
                    // Try alternative SMTP config on failure
                    rotationState.smtpIndex = (rotationState.smtpIndex + 1) % smtpConfigs.length;
                    
                    onError({
                        recipient,
                        error: error.message,
                        currentTemplate: rotationState.templateIndex + 1,
                        currentSMTP: rotationState.smtpIndex + 1
                    });
                }
            }

            return {
                status: 'complete',
                summary: {
                    successful: this.successCount,
                    failed: this.failureCount,
                    total: this.emailCount,
                    templatesUsed: rotationState.templateIndex + 1,
                    smtpConfigsUsed: rotationState.smtpIndex + 1
                }
            };

        } finally {
            this.isSending = false;
        }
    }

    async sendSingleEmail({ recipient, name, subject, template, smtpConfig }) {
        try {
            const result = await sendEmails({
                recipients: [recipient],
                names: [name],
                subjects: [subject],
                templates: [template],
                smtpConfig
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