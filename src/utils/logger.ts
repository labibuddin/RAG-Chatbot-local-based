import { createLogger, format, transports } from 'winston';
import config from './config';

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

export const logger = createLogger({
  level: config.app.logLevel,
  format: logFormat,
  transports: [
    new transports.Console({
      format: consoleFormat
    })
  ]
});

export default logger;
