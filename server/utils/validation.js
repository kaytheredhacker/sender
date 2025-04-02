import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

export function validateEmailTemplate(template) {
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

export function sanitizeInput(data) {
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