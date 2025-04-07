const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs/promises');
const { Mutex } = require('async-mutex');
const { app } = require('electron'); // Electron's app module for platform-specific paths

class AlertService {
    constructor() {
        this.logger = winston.createLogger({
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.DailyRotateFile({
                    filename: path.join(this.getLogsPath(), 'error-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '10m',
                    maxFiles: '7d'
                }),
                new winston.transports.DailyRotateFile({
                    filename: path.join(this.getLogsPath(), 'combined-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '10m',
                    maxFiles: '7d'
                })
            ]
        });

        this.historyMutex = new Mutex();
    }

    // Get the logs path based on the platform
    getLogsPath() {
        if (app && app.getPath) {
            // For Electron, use the userData path
            return path.join(app.getPath('userData'), 'senderexe', 'logs');
        } else {
            // Fallback for non-Electron environments
            return path.join(process.cwd(), 'senderexe', 'logs');
        }
    }

    async init() {
        const logsDir = this.getLogsPath();
        try {
            await fs.mkdir(logsDir, { recursive: true });
            console.log('Logs directory created successfully.');
        } catch (error) {
            console.error('Failed to create logs directory:', error);
            throw error;
        }
    }

    async alertError(error, context = {}) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            error: {
                message: error?.message || 'Unknown error',
                stack: error?.stack || 'No stack trace available',
                code: error?.code || 'N/A'
            },
            context
        };

        // Log error
        this.logger.error(errorLog);

        // Save to error history
        await this.saveErrorToHistory(errorLog);

        // Emit error event for UI updates if window exists
        if (global.mainWindow) {
            global.mainWindow.webContents.send('error-alert', errorLog);
        }
    }

    async saveErrorToHistory(errorLog) {
        try {
            const historyPath = path.join(this.getLogsPath(), 'error-history.json');
            const logEntry = JSON.stringify(errorLog) + '\n';

            // Append the new error log to the file
            await fs.appendFile(historyPath, logEntry);
        } catch (error) {
            console.error('Failed to save error to history:', error);
            throw error;
        }
    }

    async getErrorHistory() {
        try {
            const historyPath = path.join(this.getLogsPath(), 'error-history.json');
            const data = await fs.readFile(historyPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    async clearErrorHistory() {
        try {
            const historyPath = path.join(this.getLogsPath(), 'error-history.json');
            await fs.writeFile(historyPath, JSON.stringify([], null, 2));
        } catch (error) {
            console.error('Failed to clear error history:', error);
            throw error;
        }
    }
}

// Change from ES modules export to CommonJS export
const alertService = new AlertService();
alertService.init().catch((error) => {
    console.error('Failed to initialize AlertService:', error);
});

module.exports = { alertService };