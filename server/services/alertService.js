import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs/promises';
import { Mutex } from 'async-mutex';

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
                    filename: path.join(process.env.APPDATA || process.cwd(), 'senderexe', 'logs', 'error-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '10m', // Reduced max size
                    maxFiles: '7d' // Reduced retention period
                }),
                new winston.transports.DailyRotateFile({
                    filename: path.join(process.env.APPDATA || process.cwd(), 'senderexe', 'logs', 'combined-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '10m', // Reduced max size
                    maxFiles: '7d' // Reduced retention period
                })
            ]
        });

        this.historyMutex = new Mutex();
    }

    async init() {
        const logsDir = path.join(process.env.APPDATA || process.cwd(), 'senderexe', 'logs');
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
            const historyPath = path.join(process.env.APPDATA || process.cwd(), 'senderexe', 'logs', 'error-history.json');
            const logEntry = JSON.stringify(errorLog) + '\n';

            // Append the new error log to the file
            await fs.appendFile(historyPath, logEntry);
        } catch (error) {
            console.error('Failed to save error to history:', error);
            throw error; // Propagate the error
        }
    }

    async getErrorHistory() {
        try {
            const historyPath = path.join(process.cwd(), 'logs', 'error-history.json');
            const data = await fs.readFile(historyPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    async clearErrorHistory() {
        try {
            const historyPath = path.join(process.cwd(), 'logs', 'error-history.json');
            await fs.writeFile(historyPath, JSON.stringify([], null, 2));
        } catch (error) {
            console.error('Failed to clear error history:', error);
            throw error; // Propagate the error
        }
    }
}

export const alertService = new AlertService();
alertService.init().catch((error) => {
    console.error('Failed to initialize AlertService:', error);
});