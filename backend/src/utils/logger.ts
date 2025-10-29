import winston from 'winston';
import path from 'path';
import config from '../config';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: config.logging.fileMaxSize,
      maxFiles: config.logging.fileMaxFiles,
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: config.logging.fileMaxSize,
      maxFiles: config.logging.fileMaxFiles,
    }),
  ],
});

if (config.env !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

export const errorLogger = (error: any, req: any, res: any, next: any) => {
  logger.error('API Error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next(error);
};

export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('API Request:', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  });
  
  next();
};

export default logger;