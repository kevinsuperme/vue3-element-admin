import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import logger from '../utils/logger';

// 404处理中间件
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const response: ApiResponse = {
    success: false,
    message: '资源不存在',
    error: `路径: ${req.originalUrl}, 方法: ${req.method}`,
    timestamp: new Date(),
  };

  res.status(404).json(response);
};

// 全局错误处理中间件
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = '服务器内部错误';
  let errors: any = undefined;

  // MongoDB错误处理
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = '数据验证失败';
    errors = Object.values(err.errors).map((val: any) => val.message);
  }

  if (err.code === 11000) {
    statusCode = 400;
    message = '数据重复';
    const field = Object.keys(err.keyValue)[0];
    errors = [`${field} 已存在`];
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = '无效的ID格式';
  }

  // JWT错误处理
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '无效的令牌';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '令牌已过期';
  }

  // Multer错误处理
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = '文件大小超出限制';
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    statusCode = 400;
    message = '文件数量超出限制';
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = '意外的文件字段';
  }

  // 自定义错误处理
  if (err.statusCode) {
    statusCode = err.statusCode;
  }

  if (err.message) {
    message = err.message;
  }

  if (err.errors) {
    errors = err.errors;
  }

  // 记录错误日志
  logger.error('Error occurred:', {
    error: err.message || err,
    stack: err.stack,
    statusCode,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  const response: ApiResponse = {
    success: false,
    message,
    error: errors ? JSON.stringify(errors) : undefined,
    timestamp: new Date(),
  };

  res.status(statusCode).json(response);
};

// 异步错误处理包装器
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};