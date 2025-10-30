import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { performanceMonitor } from '../utils/performance';

// HTML转义函数
const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  return text.replace(/[&<>"'/]/g, (s) => map[s]);
};

// 清理对象中的危险字符
const sanitizeObject = (obj: unknown): unknown => {
  if (typeof obj === 'string') {
    return escapeHtml(obj.trim());
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  if (obj && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject((obj as Record<string, unknown>)[key]);
      }
    }
    return sanitized;
  }
  return obj;
};

// 数据清理中间件
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || `sanitize_${startTime}`;

  try {
    logger.debug('Input sanitization started:', {
      url: req.originalUrl,
      method: req.method,
      requestId
    });

    // 清理请求体
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body) as typeof req.body;
    }

    // 清理查询参数
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query) as typeof req.query;
    }

    // 清理路由参数
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params) as typeof req.params;
    }

    const duration = Date.now() - startTime;
    logger.debug('Input sanitization completed successfully:', {
      url: req.originalUrl,
      method: req.method,
      duration: `${duration}ms`,
      requestId
    });

    // 记录性能指标
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
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Sanitization error:', {
      error,
      url: req.originalUrl,
      method: req.method,
      duration: `${duration}ms`,
      requestId
    });

    // 记录失败的性能指标
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

    res.status(400).json({
      success: false,
      message: '输入数据清理失败',
      timestamp: new Date(),
      code: 'SANITIZATION_ERROR'
    });
  }
};

// 文件路径清理
export const sanitizeFilePath = (filePath: string): string => {
  // 移除路径遍历字符
  let sanitized = filePath.replace(/\.\./g, '');

  // 移除危险的字符
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');

  // 确保路径不以斜杠开头
  sanitized = sanitized.replace(/^\/+/, '');

  return sanitized;
};

// SQL注入防护（基础）
export const preventSqlInjection = (req: Request, res: Response, next: NextFunction) => {
  const sqlKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
    'EXEC', 'UNION', 'WHERE', 'OR', 'AND', 'LIKE', 'IN', 'OUTER', 'JOIN'
  ];

  const checkForSqlInjection = (obj: unknown): boolean => {
    if (typeof obj === 'string') {
      const upperStr = obj.toUpperCase();
      return sqlKeywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        return regex.test(upperStr);
      });
    }
    if (Array.isArray(obj)) {
      return obj.some(item => checkForSqlInjection(item));
    }
    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(value => checkForSqlInjection(value));
    }
    return false;
  };

  // 检查请求体
  if (req.body && checkForSqlInjection(req.body)) {
    logger.warn('Potential SQL injection detected:', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    return res.status(400).json({
      success: false,
      message: '检测到潜在的SQL注入攻击',
      timestamp: new Date(),
      code: 'SQL_INJECTION_DETECTED'
    });
  }

  next();
};

// NoScript防护
export const preventNoScriptInjection = (req: Request, res: Response, next: NextFunction) => {
  const noScriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  const eventHandlerPattern = /\s+(on\w+)\s*=\s*["']?[^"']*["']?/gi;

  const checkForNoScript = (obj: unknown): boolean => {
    if (typeof obj === 'string') {
      return noScriptPattern.test(obj) || eventHandlerPattern.test(obj);
    }
    if (Array.isArray(obj)) {
      return obj.some(item => checkForNoScript(item));
    }
    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(value => checkForNoScript(value));
    }
    return false;
  };

  // 检查请求体
  if (req.body && checkForNoScript(req.body)) {
    logger.warn('Potential NoScript injection detected:', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    return res.status(400).json({
      success: false,
      message: '检测到潜在的脚本注入攻击',
      timestamp: new Date(),
      code: 'SCRIPT_INJECTION_DETECTED'
    });
  }

  next();
};

export default {
  sanitizeInput,
  sanitizeFilePath,
  preventSqlInjection,
  preventNoScriptInjection
};
