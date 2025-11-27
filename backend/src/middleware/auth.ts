import { Request, Response, NextFunction } from 'express';
import JWTService from '../services/JWTService';
import { User } from '../models';
import { JWTPayload } from '../types';
import mongoose from 'mongoose';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// JWT认证中间件 - 支持X-Token和Authorization头
export const authenticate = async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    // 支持X-Token头和Authorization头
    const xToken = req.headers['x-token'] as string;
    const authHeader = req.headers.authorization;

    let token: string | null = null;

    if (xToken) {
      token = xToken;
    } else if (authHeader) {
      token = JWTService.extractTokenFromHeader(authHeader);
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: '未提供认证令牌',
        timestamp: new Date()
      });
      return;
    }

    try {
      const payload = JWTService.verifyToken(token);

      // 开发旁路：数据库未连接且允许旁路时，跳过数据库校验
      const bypass = process.env.DEV_LOGIN_BYPASS === 'true' && process.env.NODE_ENV !== 'production';
      if (mongoose.connection?.readyState !== 1 && bypass) {
        req.user = payload;
        _next();
        return;
      }

      // 验证用户是否仍然存在且活跃
      const user = await User.findById(payload.userId);
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: '用户不存在或已被禁用',
          timestamp: new Date()
        });
        return;
      }

      req.user = payload;
      _next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: '认证令牌无效或已过期',
        timestamp: new Date()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '认证过程中发生错误',
      timestamp: new Date()
    });
  }
};

// 角色授权中间件
export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, _next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date()
      });
      return;
    }

    const hasRole = roles.some(role => req.user!.roles.includes(role));

    if (!hasRole) {
      res.status(403).json({
        success: false,
        message: '权限不足',
        timestamp: new Date()
      });
      return;
    }

    _next();
  };
};

// 可选认证中间件（用于获取用户信息但不强制认证）
export const optionalAuth = async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    // 支持X-Token头和Authorization头
    const xToken = req.headers['x-token'] as string;
    const authHeader = req.headers.authorization;

    let token: string | null = null;

    if (xToken) {
      token = xToken;
    } else if (authHeader) {
      token = JWTService.extractTokenFromHeader(authHeader);
    }

    if (token) {
      try {
        const payload = JWTService.verifyToken(token);
        const user = await User.findById(payload.userId);

        if (user && user.isActive) {
          req.user = payload;
        }
      } catch (error) {
        // 令牌无效但不阻止请求
      }
    }

    _next();
  } catch (error) {
    _next();
  }
};

// 为了向后兼容，提供一个 auth 对象
export const auth = authenticate;

export default {
  authenticate,
  authorize,
  optionalAuth
};
