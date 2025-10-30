import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { getClientIp, isIpInList } from '../utils/ipUtils';
import { AuthRequest } from './auth';
import logger from '../utils/logger';
import { performanceMonitor } from '../utils/performance';

// 通用限流配置
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每15分钟最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    timestamp: new Date()
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return getClientIp(req) || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `rate_limit_${startTime}`;
    const ip = getClientIp(req) || req.ip;

    logger.warn('Rate limit exceeded:', {
      ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      requestId
    });

    // 记录性能指标
    const duration = Date.now() - startTime;
    const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
    performanceMonitor.recordMetric({
      requestId,
      method: req.method,
      url: req.url,
      statusCode: 429,
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

    res.status(429).json({
      success: false,
      message: '请求过于频繁，请稍后再试',
      timestamp: new Date(),
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

// API限流
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 200, // 每15分钟最多200个请求
  message: {
    success: false,
    message: 'API请求过于频繁，请稍后再试',
    timestamp: new Date()
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return getClientIp(req) || req.ip || 'unknown';
  }
});

// 严格限流（用于敏感操作）
export const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 10, // 每5分钟最多10个请求
  message: {
    success: false,
    message: '操作过于频繁，请稍后再试',
    timestamp: new Date()
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return getClientIp(req) || req.ip || 'unknown';
  }
});

// 登录限流
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 每15分钟最多5次登录尝试
  message: {
    success: false,
    message: '登录尝试次数过多，请15分钟后再试',
    timestamp: new Date()
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return getClientIp(req) || req.ip || 'unknown';
  },
  skip: (req: Request) => {
    // 跳过白名单IP
    const ip = getClientIp(req) || req.ip;
    return ip ? isIpInList(ip, process.env.IP_WHITELIST || '') : false;
  },
  handler: (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `login_rate_limit_${startTime}`;
    const ip = getClientIp(req) || req.ip;

    logger.warn('Login rate limit exceeded:', {
      ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      requestId
    });

    // 记录性能指标
    const duration = Date.now() - startTime;
    const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
    performanceMonitor.recordMetric({
      requestId,
      method: req.method,
      url: req.url,
      statusCode: 429,
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

    res.status(429).json({
      success: false,
      message: '登录尝试次数过多，请15分钟后再试',
      timestamp: new Date(),
      code: 'LOGIN_RATE_LIMIT_EXCEEDED'
    });
  }
});

// 文件上传限流
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 20, // 每小时最多20次上传
  message: {
    success: false,
    message: '文件上传过于频繁，请稍后再试',
    timestamp: new Date()
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return getClientIp(req) || req.ip || 'unknown';
  }
});

// IP白名单中间件
export const ipWhitelist = (req: Request, res: Response, next: NextFunction) => {
  const ip = getClientIp(req) || req.ip;
  const whitelist = process.env.IP_WHITELIST || '';

  if (whitelist && ip && !isIpInList(ip, whitelist)) {
    return res.status(403).json({
      success: false,
      message: 'IP地址不在白名单中',
      timestamp: new Date()
    });
  }

  next();
};

// IP黑名单中间件
export const ipBlacklist = (req: Request, res: Response, next: NextFunction) => {
  const ip = getClientIp(req) || req.ip;
  const blacklist = process.env.IP_BLACKLIST || '';

  if (blacklist && ip && isIpInList(ip, blacklist)) {
    return res.status(403).json({
      success: false,
      message: 'IP地址已被封禁',
      timestamp: new Date()
    });
  }

  next();
};

// 请求大小限制中间件
export const requestSizeLimiter = (maxSize: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');

    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        message: `请求体大小超出限制（最大 ${maxSize / 1024 / 1024}MB）`,
        timestamp: new Date()
      });
    }

    next();
  };
};

// 动态限流中间件 - 根据用户角色动态调整限制
export const createDynamicLimiter = (
  baseLimit: number,
  multiplier: number = 1,
  windowMs: number = 15 * 60 * 1000
) => {
  return rateLimit({
    windowMs,
    max: async (req: Request) => {
      const authReq = req as AuthRequest;
      if (authReq.user && authReq.user.roles.includes('admin')) {
        return baseLimit * multiplier * 2; // 管理员2倍限制
      }
      if (authReq.user && authReq.user.roles.includes('premium')) {
        return baseLimit * multiplier; // 高级用户正常倍数
      }
      return baseLimit; // 普通用户基础限制
    },
    message: {
      success: false,
      message: '请求过于频繁，请稍后再试',
      timestamp: new Date()
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      const authReq = req as AuthRequest;
      // 已认证用户使用用户ID作为key，未认证用户使用IP
      return authReq.user?.userId || getClientIp(req) || req.ip || 'unknown';
    }
  });
};

// 智能限流中间件 - 根据请求类型和端点自动调整
export const smartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: (req: Request) => {
    const path = req.path;
    const method = req.method;

    // 登录接口更严格
    if (path.includes('/login') || path.includes('/auth')) {
      return 5;
    }

    // 文件上传接口
    if (path.includes('/upload') || path.includes('/file')) {
      return 20;
    }

    // 查询接口相对宽松
    if (method === 'GET') {
      return 200;
    }

    // 其他POST/PUT/DELETE请求
    return 50;
  },
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    timestamp: new Date()
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const authReq = req as AuthRequest;
    return authReq.user?.userId || getClientIp(req) || req.ip || 'unknown';
  },
  skip: (req: Request) => {
    // 跳过健康检查和静态资源
    const path = req.path;
    return path.includes('/health') || path.includes('/static') || path.includes('/favicon');
  }
});

export default {
  generalLimiter,
  apiLimiter,
  strictLimiter,
  loginLimiter,
  uploadLimiter,
  ipWhitelist,
  ipBlacklist,
  requestSizeLimiter
};
