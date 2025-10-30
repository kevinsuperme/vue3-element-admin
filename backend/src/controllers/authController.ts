import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import AuthService from '../services/AuthService';
import User from '../models/User';
import { ApiResponse, PaginatedResponse, LoginRequest, RegisterRequest, ChangePasswordRequest, UpdateUserRequest } from '../types';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';
import { performanceMonitor } from '../utils/performance';

export class AuthController {
  // 用户注册
  static register = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = `register_${startTime}`;

    try {
      const userData: RegisterRequest = req.body;

      logger.info('User registration attempt:', {
        username: userData.username,
        email: userData.email,
        ip: req.ip
      });

      const result = await AuthService.register(userData);

      const duration = Date.now() - startTime;
      logger.info('User registration successful:', {
        username: userData.username,
        duration: `${duration}ms`
      });

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'POST',
        url: '/api/auth/register',
        statusCode: 201,
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

      const response: ApiResponse = {
        success: true,
        message: '注册成功',
        data: {
          user: result.user,
          tokens: result.tokens
        },
        timestamp: new Date()
      };

      res.status(201).json(response);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error('User registration failed:', {
        username: req.body.username,
        email: req.body.email,
        error: errorMessage,
        duration: `${duration}ms`
      });

      // 记录失败的性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'POST',
        url: '/api/auth/register',
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

      throw error;
    }
  });

  // 用户登录
  static login = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = `login_${startTime}`;

    const { username, password }: LoginRequest = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    logger.info('User login attempt:', {
      username,
      ip,
      userAgent,
      requestId
    });

    try {
      const result = await AuthService.login({ username, password, ip, userAgent });

      const duration = Date.now() - startTime;
      logger.info('User login successful:', {
        username,
        duration: `${duration}ms`,
        requestId
      });

      // 设置HTTPOnly Cookie存储令牌指纹（如果存在）
      if (result.tokens.tokenFingerprint) {
        res.cookie('tokenFingerprint', result.tokens.tokenFingerprint, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
        });
      }

      // 记录成功的性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'POST',
        url: '/api/auth/login',
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

      const response: ApiResponse = {
        success: true,
        message: '登录成功',
        data: {
          user: result.user,
          tokens: result.tokens
        },
        timestamp: new Date()
      };

      res.status(200).json(response);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error('User login failed:', {
        username,
        ip,
        error: errorMessage,
        duration: `${duration}ms`,
        requestId
      });

      // 记录失败的性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'POST',
        url: '/api/auth/login',
        statusCode: 401,
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

      throw error;
    }
  });

  // 刷新令牌
  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `refresh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('刷新令牌请求开始', { requestId, ip: req.ip });

    try {
      const { refreshToken } = req.body;
      const tokenFingerprint = req.cookies?.tokenFingerprint;

      if (!refreshToken) {
        logger.warn('刷新令牌为空', { requestId });

        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
        performanceMonitor.recordMetric({
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: 400,
          responseTime: Date.now() - startTime,
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
          message: '刷新令牌不能为空',
          timestamp: new Date()
        });
        return;
      }

      const tokens = await AuthService.refreshToken(refreshToken, tokenFingerprint);

      // 更新令牌指纹Cookie（如果存在新的指纹）
      if (tokens.tokenFingerprint) {
        res.cookie('tokenFingerprint', tokens.tokenFingerprint, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
        });
      }

      logger.info('刷新令牌成功', { requestId, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: 200,
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      const response: ApiResponse = {
        success: true,
        message: '令牌刷新成功',
        data: tokens,
        timestamp: new Date()
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('刷新令牌失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: 401,
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      throw error;
    }
  });

  // 获取当前用户信息
  static getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('获取当前用户信息请求开始', { requestId, userId: req.user!.userId, ip: req.ip });

    try {
      const userId = req.user!.userId;
      const user = await AuthService.getUserInfo(userId);

      if (!user) {
        logger.warn('用户不存在', { requestId, userId });

        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
        performanceMonitor.recordMetric({
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: 404,
          responseTime: Date.now() - startTime,
          memoryUsage: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            rss: memoryUsage.rss,
            external: memoryUsage.external
          },
          cpuUsage: 0,
          timestamp: new Date()
        });

        res.status(404).json({
          success: false,
          message: '用户不存在',
          timestamp: new Date()
        });
        return;
      }

      logger.info('获取用户信息成功', { requestId, userId, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: 200,
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      const response: ApiResponse = {
        success: true,
        message: '获取用户信息成功',
        data: user,
        timestamp: new Date()
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('获取用户信息失败', { requestId, userId: req.user!.userId, error: errorMessage, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: (error as AppError).statusCode || 500,
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      throw error;
    }
  });

  // 更新当前用户信息
  static updateCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `update_user_${startTime}`;

    logger.info('Updating current user:', {
      requestId,
      userId: req.user!.userId,
      updateData: req.body,
      ip: req.ip
    });

    try {
      const userId = req.user!.userId;
      const updateData: UpdateUserRequest = req.body;

      const user = await AuthService.updateUser(userId, updateData);

      if (!user) {
        logger.warn('User not found for update:', {
          requestId,
          userId
        });

        // 记录性能指标 (404错误)
        const duration = Date.now() - startTime;
        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
        performanceMonitor.recordMetric({
          requestId,
          method: 'PUT',
          url: '/api/auth/user',
          statusCode: 404,
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

        res.status(404).json({
          success: false,
          message: '用户不存在',
          timestamp: new Date()
        });
        return;
      }

      const duration = Date.now() - startTime;
      logger.info('User updated successfully:', {
        requestId,
        userId,
        duration: `${duration}ms`
      });

      const response: ApiResponse = {
        success: true,
        message: '更新用户信息成功',
        data: user,
        timestamp: new Date()
      };

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'PUT',
        url: '/api/auth/user',
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

      res.status(200).json(response);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to update user:', {
        requestId,
        userId: req.user!.userId,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`
      });

      // 记录错误性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'PUT',
        url: '/api/auth/user',
        statusCode: 500,
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

      throw error;
    }
  });

  // 修改密码
  static changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `change_password_${startTime}`;

    logger.info('Changing password:', {
      requestId,
      userId: req.user!.userId,
      ip: req.ip
    });

    try {
      const userId = req.user!.userId;
      const passwordData: ChangePasswordRequest = req.body;

      await AuthService.changePassword(userId, passwordData);

      const duration = Date.now() - startTime;
      logger.info('Password changed successfully:', {
        requestId,
        userId,
        duration: `${duration}ms`
      });

      const response: ApiResponse = {
        success: true,
        message: '密码修改成功',
        timestamp: new Date()
      };

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'POST',
        url: '/api/auth/change-password',
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

      res.status(200).json(response);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to change password:', {
        requestId,
        userId: req.user!.userId,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`
      });

      // 记录错误性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'POST',
        url: '/api/auth/change-password',
        statusCode: 500,
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

      throw error;
    }
  });

  // 用户退出登录
  static logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `logout_${startTime}`;

    logger.info('User logout attempt:', {
      requestId,
      userId: req.user?.userId,
      ip: req.ip
    });

    try {
      // 清除令牌指纹Cookie
      res.clearCookie('tokenFingerprint');

      // 这里可以实现令牌黑名单等功能
      // 目前只是返回成功消息

      const duration = Date.now() - startTime;
      logger.info('User logged out successfully:', {
        requestId,
        userId: req.user?.userId,
        duration: `${duration}ms`
      });

      const response: ApiResponse = {
        success: true,
        message: '退出登录成功',
        timestamp: new Date()
      };

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'POST',
        url: '/api/auth/logout',
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

      res.status(200).json(response);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to logout user:', {
        requestId,
        userId: req.user?.userId,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`
      });

      // 记录错误性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'POST',
        url: '/api/auth/logout',
        statusCode: 500,
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

      throw error;
    }
  });
}

export class UserController {
  // 获取用户列表
  static getUsers = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `users-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('获取用户列表请求开始', { requestId, ip: req.ip, query: req.query });

    try {
      const {
        page = 1,
        limit = 10,
        sort = 'createdAt',
        order = 'desc',
        search = '',
        isActive
      } = req.query;

      const query: Record<string, unknown> = {};

      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' }},
          { email: { $regex: search, $options: 'i' }}
        ];
      }

      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      const skip = (Number(page) - 1) * Number(limit);
      const sortObj: Record<string, 1 | -1> = {};
      sortObj[sort as string] = order === 'desc' ? -1 : 1;

      const [users, total] = await Promise.all([
        User.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(Number(limit))
          .select('-password'),
        User.countDocuments(query)
      ]);

      logger.info('获取用户列表成功', {
        requestId,
        duration: Date.now() - startTime,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: 200,
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      const response: PaginatedResponse = {
        success: true,
        message: '获取用户列表成功',
        data: users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        },
        timestamp: new Date()
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('获取用户列表失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: 500,
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      throw error;
    }
  });

  // 获取单个用户
  static getUserById = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('获取单个用户信息请求开始', { requestId, ip: req.ip, userId: req.params.id });

    try {
      const userId = req.params.id;

      if (!userId) {
        logger.warn('获取单个用户信息失败：用户ID不能为空', { requestId, duration: Date.now() - startTime });
        throw new AppError('用户ID不能为空', 400);
      }

      const user = await User.findById(userId).select('-password');

      if (!user) {
        logger.warn('获取单个用户信息失败：用户不存在', { requestId, userId, duration: Date.now() - startTime });

        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
        performanceMonitor.recordMetric({
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: 404,
          responseTime: Date.now() - startTime,
          memoryUsage: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            rss: memoryUsage.rss,
            external: memoryUsage.external
          },
          cpuUsage: 0,
          timestamp: new Date()
        });

        throw new AppError('用户不存在', 404);
      }

      logger.info('获取单个用户信息成功', { requestId, userId, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: 200,
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      const response: ApiResponse = {
        success: true,
        message: '获取用户信息成功',
        data: user,
        timestamp: new Date()
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('获取单个用户信息失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: (error as AppError).statusCode || 500,
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      throw error;
    }
  });

  // 创建用户
  static createUser = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `create-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('创建用户请求开始', { requestId, ip: req.ip, username: req.body.username, email: req.body.email });

    try {
      const { username, email, password, role, isActive = true } = req.body;

      if (!username || !email || !password) {
        logger.warn('创建用户失败：用户名、邮箱和密码不能为空', { requestId, duration: Date.now() - startTime });
        throw new AppError('用户名、邮箱和密码不能为空', 400);
      }

      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        logger.warn('创建用户失败：用户名或邮箱已存在', { requestId, username, email, duration: Date.now() - startTime });

        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
        performanceMonitor.recordMetric({
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: 409,
          responseTime: Date.now() - startTime,
          memoryUsage: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            rss: memoryUsage.rss,
            external: memoryUsage.external
          },
          cpuUsage: 0,
          timestamp: new Date()
        });

        throw new AppError('用户名或邮箱已存在', 409);
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        role,
        isActive
      });

      const userResponse = user.toObject();
      // 删除密码字段，使用类型断言避免TypeScript错误
      const { password: _, ...userWithoutPassword } = userResponse;
      const sanitizedUser = userWithoutPassword;

      logger.info('创建用户成功', { requestId, userId: user._id, username, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: 201,
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      const response: ApiResponse = {
        success: true,
        message: '用户创建成功',
        data: sanitizedUser,
        timestamp: new Date()
      };

      res.status(201).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('创建用户失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: (error as AppError).statusCode || 500,
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      throw error;
    }
  });

  // 更新用户
  static updateUser = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `update-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('更新用户信息请求开始', { requestId, ip: req.ip, userId: req.params.id });

    try {
      const { id } = req.params;
      const updateData = req.body as UpdateUserRequest & { password?: string };

      if (!id) {
        logger.warn('更新用户信息失败：用户ID不能为空', { requestId, duration: Date.now() - startTime });
        throw new AppError('用户ID不能为空', 400);
      }

      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 12);
      }

      const user = await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      }).select('-password');

      if (!user) {
        logger.warn('更新用户信息失败：用户不存在', { requestId, userId: id, duration: Date.now() - startTime });

        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
        performanceMonitor.recordMetric({
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: 404,
          responseTime: Date.now() - startTime,
          memoryUsage: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            rss: memoryUsage.rss,
            external: memoryUsage.external
          },
          cpuUsage: 0,
          timestamp: new Date()
        });

        throw new AppError('用户不存在', 404);
      }

      logger.info('更新用户信息成功', { requestId, userId: id, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: 200,
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      const response: ApiResponse = {
        success: true,
        message: '用户更新成功',
        data: user,
        timestamp: new Date()
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('更新用户信息失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: (error as AppError).statusCode || 500,
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      throw error;
    }
  });

  // 删除用户
  static deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `delete-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('删除用户请求开始', { requestId, ip: req.ip, userId: req.params.id });

    try {
      const userId = req.params.id;

      if (!userId) {
        logger.warn('删除用户失败：用户ID不能为空', { requestId, duration: Date.now() - startTime });
        throw new AppError('用户ID不能为空', 400);
      }

      const user = await User.findByIdAndDelete(userId);

      if (!user) {
        logger.warn('删除用户失败：用户不存在', { requestId, userId, duration: Date.now() - startTime });

        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
        performanceMonitor.recordMetric({
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: 404,
          responseTime: Date.now() - startTime,
          memoryUsage: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            rss: memoryUsage.rss,
            external: memoryUsage.external
          },
          cpuUsage: 0,
          timestamp: new Date()
        });

        throw new AppError('用户不存在', 404);
      }

      logger.info('删除用户成功', { requestId, userId, username: user.username, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: 200,
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      const response: ApiResponse = {
        success: true,
        message: '用户删除成功',
        data: null,
        timestamp: new Date()
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('删除用户失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: (error as AppError).statusCode || 500,
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      throw error;
    }
  });

  // 重置用户密码
  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `reset-pwd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('重置用户密码请求开始', { requestId, ip: req.ip, userId: req.params.id });

    try {
      const userId = req.params.id;
      const { password } = req.body;

      if (!userId) {
        logger.warn('重置用户密码失败：用户ID不能为空', { requestId, duration: Date.now() - startTime });
        throw new AppError('用户ID不能为空', 400);
      }

      if (!password) {
        logger.warn('重置用户密码失败：新密码不能为空', { requestId, duration: Date.now() - startTime });
        throw new AppError('新密码不能为空', 400);
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await User.findByIdAndUpdate(
        userId,
        { password: hashedPassword },
        { new: true }
      ).select('-password');

      if (!user) {
        logger.warn('重置用户密码失败：用户不存在', { requestId, userId, duration: Date.now() - startTime });

        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
        performanceMonitor.recordMetric({
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: 404,
          responseTime: Date.now() - startTime,
          memoryUsage: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            rss: memoryUsage.rss,
            external: memoryUsage.external
          },
          cpuUsage: 0,
          timestamp: new Date()
        });

        throw new AppError('用户不存在', 404);
      }

      logger.info('重置用户密码成功', { requestId, userId, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: 200,
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      const response: ApiResponse = {
        success: true,
        message: '密码重置成功',
        data: user,
        timestamp: new Date()
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('重置用户密码失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: (error as AppError).statusCode || 500,
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      throw error;
    }
  });
}

export default {
  AuthController,
  UserController
};
