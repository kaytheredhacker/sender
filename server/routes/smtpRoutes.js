/**
 * SMTP Routes
 * Handles API endpoints for SMTP configuration
 */
const express = require('express');
const { validateSmtpConfig } = require('../utils/smtpUtils');
const { configManager } = require('../utils/configManager');

const router = express.Router();

// Define your routes here

// Change from ES modules export to CommonJS export
module.exports = router;


/**
 * Get all SMTP configurations
 * @route GET /api/smtp/configs
 */
router.get('/configs', async (req, res) => {
  try {
    const configs = await configManager.read();
    
    if (!Array.isArray(configs)) {
      throw new Error('Invalid configuration format');
    }
    
    // Remove sensitive information (passwords)
    const safeConfigs = configs.map(config => ({
      ...config,
      password: '********' // Mask password
    }));
    
    res.json({
      success: true,
      configs: safeConfigs
    });
  } catch (error) {
    alertService.alertError(error, { context: 'GET /api/smtp/configs' });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve configurations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Add or update SMTP configuration
 * @route POST /api/smtp/config
 */
// Rate limiting for SMTP configuration changes
const configRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  currentRequests: 0,
  resetTime: Date.now()
};

router.post('/config', async (req, res) => {
  try {
    // Check rate limit
    if (Date.now() > configRateLimit.resetTime) {
      configRateLimit.currentRequests = 0;
      configRateLimit.resetTime = Date.now() + configRateLimit.windowMs;
    }
    
    if (configRateLimit.currentRequests >= configRateLimit.maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many configuration requests. Please try again later.'
      });
    }
    configRateLimit.currentRequests++;

    const config = req.body;
    
    // Validate configuration
    const validation = validateSmtpConfig(config);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        errors: validation.errors
      });
    }
    
    // Check for duplicate configuration
    const existingConfigs = await configManager.read();
    const isDuplicate = existingConfigs.some(existing => 
      existing.host === config.host && 
      existing.port === config.port && 
      existing.username === config.username
    );
    
    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate SMTP configuration'
      });
    }
    
    // Save configuration
    const result = await configManager.addConfig(config);
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to save configuration');
    }
    
    res.json(result);
  } catch (error) {
    alertService.alertError(error, { 
      context: 'POST /api/smtp/config',
      config: { ...req.body, password: '[REDACTED]' }
    });
    res.status(500).json({
      success: false,
      message: 'Failed to save configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Delete SMTP configuration
 * @route DELETE /api/smtp/config/:name
 */
router.delete('/config/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration name'
      });
    }
    
    const configs = await configManager.read();
    const configExists = configs.some(config => config.name === name);
    
    if (!configExists) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }
    
    const result = await configManager.deleteConfig(name);
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete configuration');
    }
    
    res.json(result);
  } catch (error) {
    alertService.alertError(error, { 
      context: 'DELETE /api/smtp/config',
      configName: req.params.name
    });
    res.status(500).json({
      success: false,
      message: 'Failed to delete configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
