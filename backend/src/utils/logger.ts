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
      maxFiles: config.logging.fileMaxFiles
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: config.logging.fileMaxSize,
      maxFiles: config.logging.fileMaxFiles
    })
  ]
});

if (config.env !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

import { Request, Response, NextFunction } from 'express';

export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('API Error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next(error);
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);

  // 为请求添加ID

  (req as any).id = requestId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId,
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),

      userId: (req as any).user?.id || 'anonymous'
    };

    if (res.statusCode >= 400) {
      logger.warn('API Request Warning:', logData);
    } else {
      logger.info('API Request:', logData);
    }
  });

  next();
};

export default logger;
