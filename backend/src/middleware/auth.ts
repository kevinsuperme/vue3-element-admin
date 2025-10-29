import { Request, Response, NextFunction } from 'express';
import JWTService from '../services/JWTService';
import { User } from '../models';
import { JWTPayload } from '../types';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// JWT认证中间件
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: '未提供认证令牌',
        timestamp: new Date(),
      });
      return;
    }

    const token = JWTService.extractTokenFromHeader(authHeader);
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: '认证令牌格式错误',
        timestamp: new Date(),
      });
      return;
    }

    try {
      const payload = JWTService.verifyToken(token);
      
      // 验证用户是否仍然存在且活跃
      const user = await User.findById(payload.userId);
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: '用户不存在或已被禁用',
          timestamp: new Date(),
        });
        return;
      }

      req.user = payload;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: '认证令牌无效或已过期',
        timestamp: new Date(),
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '认证过程中发生错误',
      timestamp: new Date(),
    });
  }
};

// 角色授权中间件
export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date(),
      });
      return;
    }

    const hasRole = roles.some(role => req.user!.roles.includes(role));
    
    if (!hasRole) {
      res.status(403).json({
        success: false,
        message: '权限不足',
        timestamp: new Date(),
      });
      return;
    }

    next();
  };
};

// 可选认证中间件（用于获取用户信息但不强制认证）
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = JWTService.extractTokenFromHeader(authHeader);
      
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
    }
    
    next();
  } catch (error) {
    next();
  }
};

export default {
  authenticate,
  authorize,
  optionalAuth,
};