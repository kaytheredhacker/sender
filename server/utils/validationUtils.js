const MAX_SMTP_CONFIGS = 10;
const MAX_TEMPLATES = 10;
const MAX_NAMES = 10;
const MAX_SUBJECTS = 10;

const validateRotationRequirements = (smtpConfigs, templates, names, subjects) => {
    if (!smtpConfigs.length) throw new Error('At least one SMTP configuration is required');
    if (!templates.length) throw new Error('At least one email template is required');
    if (!names.length) throw new Error('At least one sender name is required');
    if (!subjects.length) throw new Error('At least one email subject is required');

    if (smtpConfigs.length > MAX_SMTP_CONFIGS) throw new Error(`Maximum ${MAX_SMTP_CONFIGS} SMTP configurations allowed`);
    if (templates.length > MAX_TEMPLATES) throw new Error(`Maximum ${MAX_TEMPLATES} templates allowed`);
    if (names.length > MAX_NAMES) throw new Error(`Maximum ${MAX_NAMES} names allowed`);
    if (subjects.length > MAX_SUBJECTS) throw new Error(`Maximum ${MAX_SUBJECTS} subjects allowed`);
};

const validateSmtpConfig = (config) => {
    const errors = [];
    if (!config.host) errors.push('Host is required');
    if (!config.port) errors.push('Port is required');
    if (!config.username) errors.push('Username is required');
    if (!config.password) errors.push('Password is required');
    if (typeof config.secure !== 'boolean') errors.push('Secure must be a boolean');

    const portNum = parseInt(config.port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        errors.push('Invalid port number');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

const validateEmailRequest = (request) => {
    const errors = [];
    if (!request.to) errors.push('Recipient email is required');
    if (!request.subject) errors.push('Email subject is required');
    if (!request.body) errors.push('Email body is required');
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

module.exports = {
    validateRotationRequirements,
    validateSmtpConfig,
    validateEmailRequest
};
