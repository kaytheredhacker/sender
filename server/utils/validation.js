const DOMPurify = require('dompurify');  // Replace import with require
const { JSDOM } = require('jsdom');  // Replace import with require

const window = new JSDOM('').window;
const purify = DOMPurify(window);

const validateEmailTemplate = (template) => {
    const required = ['subject', 'body'];
    for (const field of required) {
        if (!template[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
    
    // Sanitize HTML content
    template.body = purify.sanitize(template.body, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href']
    });
    
    return template;
}

const sanitizeInput = (data) => {
    if (typeof data === 'string') {
        return purify.sanitize(data);
    }
    
    if (typeof data === 'object' && data !== null) {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            sanitized[key] = sanitizeInput(value);
        }
        return sanitized;
    }
    
    return data;
}

module.exports = {
    validateEmailTemplate,
    sanitizeInput
};