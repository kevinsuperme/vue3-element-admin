import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { getClientIp, isIpInList } from '../utils/ipUtils';

// 通用限流配置
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每15分钟最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    timestamp: new Date(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return getClientIp(req) || req.ip || 'unknown';
  },
});

// API限流
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 200, // 每15分钟最多200个请求
  message: {
    success: false,
    message: 'API请求过于频繁，请稍后再试',
    timestamp: new Date(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return getClientIp(req) || req.ip || 'unknown';
  },
});

// 严格限流（用于敏感操作）
export const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 10, // 每5分钟最多10个请求
  message: {
    success: false,
    message: '操作过于频繁，请稍后再试',
    timestamp: new Date(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return getClientIp(req) || req.ip || 'unknown';
  },
});

// 登录限流
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 每15分钟最多5次登录尝试
  message: {
    success: false,
    message: '登录尝试次数过多，请15分钟后再试',
    timestamp: new Date(),
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
});

// 文件上传限流
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 20, // 每小时最多20次上传
  message: {
    success: false,
    message: '文件上传过于频繁，请稍后再试',
    timestamp: new Date(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return getClientIp(req) || req.ip || 'unknown';
  },
});

// IP白名单中间件
export const ipWhitelist = (req: Request, res: Response, next: NextFunction) => {
  const ip = getClientIp(req) || req.ip;
  const whitelist = process.env.IP_WHITELIST || '';
  
  if (whitelist && ip && !isIpInList(ip, whitelist)) {
    return res.status(403).json({
      success: false,
      message: 'IP地址不在白名单中',
      timestamp: new Date(),
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
      timestamp: new Date(),
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
        timestamp: new Date(),
      });
    }
    
    next();
  };
};

export default {
  generalLimiter,
  apiLimiter,
  strictLimiter,
  loginLimiter,
  uploadLimiter,
  ipWhitelist,
  ipBlacklist,
  requestSizeLimiter,
};