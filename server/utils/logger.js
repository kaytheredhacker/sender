const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for logs
const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// Create the logger
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp(),
    myFormat
  ),
  transports: [
    // Console transport for development
    new transports.Console({
      format: combine(
        format.colorize(),
        timestamp(),
        myFormat
      )
    }),
    
    // File transport with rotation for errors
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // File transport with rotation for all logs
    new transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  ],
  // Don't exit on error
  exitOnError: false
});

// Add a cleanup function to delete logs older than 30 days
const cleanupOldLogs = () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  fs.readdir(logsDir, (err, files) => {
    if (err) {
      logger.error('Error reading logs directory:', err);
      return;
    }
    
    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          logger.error(`Error reading stats for file ${filePath}:`, err);
          return;
        }

        if (stats.isFile() && stats.mtime < thirtyDaysAgo) {
          fs.unlink(filePath, err => {
            if (err) {
              logger.error(`Failed to delete old log file: ${filePath}`, err);
            } else {
              logger.info(`Deleted old log file: ${filePath}`);
            }
          });
        }
      });
    });
  });
};

// Run cleanup once a day and also immediately at startup
setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);
cleanupOldLogs();