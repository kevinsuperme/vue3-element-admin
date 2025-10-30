import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../types';
import logger from '../utils/logger';
import { performanceMonitor } from '../utils/performance';

// 验证错误处理中间件
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || `validation_${startTime}`;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorFields = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : error.type,
      message: error.msg,
      value: 'value' in error ? (error as Record<string, unknown>).value : undefined
    }));

    logger.warn('Validation failed:', {
      url: req.originalUrl,
      method: req.method,
      errors: errorFields,
      requestId
    });

    const response: ApiResponse = {
      success: false,
      message: '验证失败',
      errors: errorFields,
      timestamp: new Date()
    };

    // 记录性能指标
    const duration = Date.now() - startTime;
    const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
    performanceMonitor.recordMetric({
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: 400,
      responseTime: duration,
      memoryUsage: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        rss: memoryUsage.rss,
        external: memoryUsage.external
      },
      cpuUsage: 0,
      timestamp: new Date()
    });

    res.status(400).json(response);
    return;
  }

  // 记录成功验证的性能指标
  const duration = Date.now() - startTime;
  const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
  performanceMonitor.recordMetric({
    requestId,
    method: req.method,
    url: req.originalUrl,
    statusCode: 200,
    responseTime: duration,
    memoryUsage: {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      rss: memoryUsage.rss,
      external: memoryUsage.external
    },
    cpuUsage: 0,
    timestamp: new Date()
  });

  next();
};

export default handleValidationErrors;
