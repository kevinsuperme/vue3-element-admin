import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import logger from '../utils/logger';

// 扩展Error接口以支持额外属性
interface ExtendedError extends Error {
  statusCode?: number;
  code?: number | string;
  errors?: unknown;
  keyValue?: Record<string, unknown>;
}

// 404处理中间件
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
  const response: ApiResponse = {
    success: false,
    message: '资源不存在',
    error: `路径: ${req.originalUrl}, 方法: ${req.method}`,
    timestamp: new Date()
  };

  res.status(404).json(response);
};

// 全局错误处理中间件
export const errorHandler = (err: ExtendedError, req: Request, res: Response, _next: NextFunction): void => {
  let statusCode = 500;
  let message = '服务器内部错误';
  let errors: unknown[] = [];
  let errorCode = 'INTERNAL_ERROR';

  // MongoDB错误处理
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = '数据验证失败';
    errorCode = 'VALIDATION_ERROR';
    errors = Object.values((err.errors as Record<string, { message: string }>) || {}).map((val) => val.message);
  }

  if (err.code === 11000) {
    statusCode = 400;
    message = '数据重复';
    errorCode = 'DUPLICATE_KEY_ERROR';
    const field = Object.keys(err.keyValue || {})[0];
    errors = [`${field} 已存在`];
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = '无效的ID格式';
    errorCode = 'CAST_ERROR';
  }

  // JWT错误处理
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '无效的令牌';
    errorCode = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '令牌已过期';
    errorCode = 'TOKEN_EXPIRED';
  }

  // Multer错误处理
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = '文件大小超出限制';
    errorCode = 'FILE_SIZE_LIMIT';
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    statusCode = 400;
    message = '文件数量超出限制';
    errorCode = 'FILE_COUNT_LIMIT';
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = '意外的文件字段';
    errorCode = 'UNEXPECTED_FILE_FIELD';
  }

  // 自定义错误处理
  if (err.statusCode) {
    statusCode = err.statusCode;
  }

  if (err.message) {
    message = err.message;
  }

  if (err.errors) {
    errors = Array.isArray(err.errors) ? err.errors : [err.errors];
  }

  // 设置错误代码（如果还没有设置）
  if (statusCode >= 500 && errorCode === 'INTERNAL_ERROR') {
    errorCode = 'SERVER_ERROR';
  } else if (statusCode >= 400 && errorCode === 'INTERNAL_ERROR') {
    errorCode = 'CLIENT_ERROR';
  }

  // 记录错误日志
  const errorLog = {
    error: err.message || err,
    stack: err.stack,
    statusCode,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    requestId: (req as Request & { id?: string }).id || 'unknown',
    userId: (req as Request & { user?: { id?: string } }).user?.id || 'anonymous',
    code: errorCode
  };

  // 根据错误级别记录日志
  if (statusCode >= 500) {
    logger.error('Server Error:', errorLog);
  } else if (statusCode >= 400) {
    logger.warn('Client Error:', errorLog);
  } else {
    logger.info('Application Error:', errorLog);
  }

  const response: ApiResponse = {
    success: false,
    message,
    error: errors ? JSON.stringify(errors) : undefined,
    timestamp: new Date(),
    code: errorCode
  };

  res.status(statusCode).json(response);
};
