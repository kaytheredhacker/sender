// Example of how to use the logger in your application
const logger = require('./logger');

// Instead of using console.log, use the appropriate log level:
// logger.error() - For errors that need immediate attention
// logger.warn() - For warnings that don't stop the application but should be noted
// logger.info() - For general information about application operation
// logger.debug() - For detailed debugging information (only shown in development)

// Examples:

// For errors (these will go to both error.log and combined.log)
try {
  // Some operation that might fail
  throw new Error('Something went wrong');
} catch (error) {
  logger.error(`Error occurred: ${error.message}`);
  logger.error(`Stack trace: ${error.stack}`);
}

// For warnings
logger.warn('This is a warning message');

// For general information
logger.info('Application started');
logger.info('SMTP configuration loaded');
logger.info('Email sent successfully to recipient@example.com');

// For debugging (only shown in development)
logger.debug('Detailed debugging information');
logger.debug('Template variables:', { user: 'John', email: 'john@example.com' });

// You can also log objects
logger.info('Processing configuration:', { 
  host: 'smtp.example.com',
  port: 587,
  secure: false
});

module.exports = {
  // Example function that uses logging
  sendEmail: (recipient, subject, content) => {
    logger.info(`Sending email to ${recipient} with subject "${subject}"`);
    
    // Your email sending logic here
    
    logger.debug('Email content:', content);
    logger.info(`Email sent successfully to ${recipient}`);
    
    return true;
  }
};
