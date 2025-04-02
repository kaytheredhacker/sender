// SMTPHandler.js
import { useState } from 'react';
import { validateRotationRequirements } from '../utils/validationUtils';
import { encrypt, decrypt } from '../utils/encryptionUtils';

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

const SMTPHandler = () => {
  const [smtpConfig, setSmtpConfig] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkExistingConfig = async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/smtp/configs');
        if (!response.ok) throw new Error('Failed to fetch SMTP configurations');

        const configs = await response.json();
        if (!configs || !configs.length) {
            throw new Error('At least one SMTP configuration is required');
        }

        setSmtpConfig(configs[0]); // Use the first configuration as default
        setIsConfigured(true);
    } catch (error) {
        console.error('Error fetching SMTP configurations:', error);
    } finally {
        setIsLoading(false);
    }
  };

  const saveSmtpConfig = async (config) => {
    setIsLoading(true);
    try {
      validateRotationRequirements(config.smtpConfigs, config.templates, config.names, config.subjects);
      const response = await fetch('/api/smtp-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          host: config.host,
          port: parseInt(config.port),
          secure: config.secure || false,
          auth: {
            user: config.username,
            pass: config.password
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save configuration');
      }

      setSmtpConfig(config);
      setIsConfigured(true);
    } catch (error) {
      console.error('SMTP Config Error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    smtpConfig,
    isConfigured,
    isLoading,
    saveSmtpConfig,
    checkExistingConfig
  };
};

// Example usage
const smtpConfigs = [
    { host: 'smtp.example.com', port: 587, username: 'user', password: 'pass' }
];

try {
    validateRotationRequirements(smtpConfigs, [], [], []);
    console.log('Validation passed');
} catch (error) {
    console.error(error.message);
}

const encryptedPassword = encrypt('password123');
console.log('Encrypted Password:', encryptedPassword);

const decryptedPassword = decrypt(encryptedPassword);
console.log('Decrypted Password:', decryptedPassword);

export default SMTPHandler;