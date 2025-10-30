import { User, UserDocument } from '../models';
import { RegisterRequest, UpdateUserRequest, ChangePasswordRequest, JWTPayload } from '../types';
import JWTService from './JWTService';
import logger from '../utils/logger';
import { performanceMonitor } from '../utils/performance';
import crypto from 'crypto';

export class AuthService {
  // 登录失败记录缓存（使用内存缓存，生产环境建议使用Redis）
  private static loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

  // 清理过期的登录失败记录
  private static cleanupLoginAttempts(): void {
    const now = Date.now();
    const fifteenMinutesAgo = now - 15 * 60 * 1000;

    for (const [key, attempt] of this.loginAttempts.entries()) {
      if (attempt.lastAttempt < fifteenMinutesAgo) {
        this.loginAttempts.delete(key);
      }
    }
  }

  // 检查登录尝试次数
  private static isLoginBlocked(identifier: string): boolean {
    this.cleanupLoginAttempts();
    const attempt = this.loginAttempts.get(identifier);
    return attempt ? attempt.count >= 5 : false;
  }

  // 记录登录失败
  private static recordLoginFailure(identifier: string): void {
    const attempt = this.loginAttempts.get(identifier);
    if (attempt) {
      attempt.count++;
      attempt.lastAttempt = Date.now();
    } else {
      this.loginAttempts.set(identifier, { count: 1, lastAttempt: Date.now() });
    }
  }

  // 用户注册
  static async register(userData: RegisterRequest): Promise<{ user: UserDocument; tokens: { accessToken: string; refreshToken: string } }> {
    const startTime = Date.now();
    const requestId = `auth_register_${startTime}`;

    try {
      logger.info('AuthService register started:', {
        username: userData.username,
        email: userData.email,
        requestId
      });

      // 检查用户名是否已存在
      const existingUser = await User.findOne({
        $or: [{ username: userData.username }, { email: userData.email }]
      });

      if (existingUser) {
        logger.warn('Registration failed - user already exists:', {
          username: userData.username,
          email: userData.email,
          requestId
        });
        throw new Error('用户名或邮箱已存在');
      }

      // 创建新用户
      const user = new User(userData);
      await user.save();

      // 生成JWT令牌
      const payload: JWTPayload = {
        userId: user._id!.toString(),
        username: user.username,
        roles: user.roles
      };

      const tokens = JWTService.generateTokenPair(payload);

      const duration = Date.now() - startTime;
      logger.info('AuthService register completed successfully:', {
        username: userData.username,
        userId: user._id,
        duration: `${duration}ms`,
        requestId
      });

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'SERVICE',
        url: 'auth/register',
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

      return { user, tokens };
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('AuthService register failed:', {
        username: userData.username,
        email: userData.email,
        error,
        duration: `${duration}ms`,
        requestId
      });

      // 记录失败的性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'SERVICE',
        url: 'auth/register',
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

      throw new Error(`注册失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 用户登录
  static async login(loginData: { username: string; password: string; ip?: string; userAgent?: string }): Promise<{ user: UserDocument; tokens: { accessToken: string; refreshToken: string; tokenFingerprint?: string } }> {
    const startTime = Date.now();
    const requestId = `auth_login_${startTime}`;
    const { username, password, ip } = loginData;

    try {
      logger.info('AuthService login started:', {
        username,
        ip,
        requestId
      });

      // 检查登录限制
      if (this.isLoginBlocked(username)) {
        logger.warn('Login blocked due to too many attempts:', {
          username,
          ip,
          requestId
        });
        throw new Error('登录尝试次数过多，请稍后再试');
      }

      // 查找用户
      const user = await User.findOne({
        $or: [{ username }, { email: username }],
        isActive: true
      }).populate('roles');

      if (!user) {
        await this.recordFailedLogin(username);
        logger.warn('Login failed - user not found:', {
          username,
          ip,
          requestId
        });
        throw new Error('用户名或密码错误');
      }

      // 验证密码
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        await this.recordFailedLogin(username);
        logger.warn('Login failed - invalid password:', {
          username,
          userId: user._id,
          ip,
          requestId
        });
        throw new Error('用户名或密码错误');
      }

      // 生成JWT令牌
      const payload: JWTPayload = {
        userId: user._id!.toString(),
        username: user.username,
        roles: user.roles
      };

      const tokens = JWTService.generateTokenPair(payload);

      // 更新最后登录时间
      user.lastLogin = new Date();
      await user.save();

      // 记录成功登录
      this.recordSuccessfulLogin(username);

      const duration = Date.now() - startTime;
      logger.info('AuthService login completed successfully:', {
        username,
        userId: user._id,
        duration: `${duration}ms`,
        requestId
      });

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'SERVICE',
        url: 'auth/login',
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

      return { user, tokens };
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('AuthService login failed:', {
        username,
        ip,
        error,
        duration: `${duration}ms`,
        requestId
      });

      // 记录失败的性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'SERVICE',
        url: 'auth/login',
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

      throw new Error(`登录失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 刷新令牌
  static async refreshToken(refreshToken: string, tokenFingerprint?: string): Promise<{ accessToken: string; refreshToken: string; tokenFingerprint?: string }> {
    try {
      const payload = JWTService.verifyToken(refreshToken);

      // 验证用户是否仍然存在且活跃
      const user = await User.findById(payload.userId);
      if (!user || !user.isActive) {
        throw new Error('用户不存在或已被禁用');
      }

      // 验证令牌指纹（如果提供）
      if (tokenFingerprint) {
        // 这里可以添加令牌指纹验证逻辑
        // 例如检查数据库中存储的指纹是否匹配
      }

      // 生成新的令牌对
      const newPayload: JWTPayload = {
        userId: user._id!.toString(),
        username: user.username,
        roles: user.roles
      };

      // 生成新的指纹
      const newFingerprint = crypto.randomBytes(32).toString('hex');

      const tokens = {
        ...JWTService.generateTokenPair(newPayload),
        tokenFingerprint: newFingerprint
      };

      return tokens;
    } catch (error) {
      throw new Error('令牌刷新失败');
    }
  }

  // 修改密码
  static async changePassword(userId: string, passwordData: ChangePasswordRequest): Promise<void> {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new Error('用户不存在');
      }

      // 验证当前密码
      const isCurrentPasswordValid = await user.comparePassword(passwordData.currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('当前密码错误');
      }

      // 更新密码
      user.password = passwordData.newPassword;
      await user.save();
    } catch (error) {
      throw new Error(`修改密码失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 重置密码（管理员功能）
  static async resetPassword(userId: string, newPassword: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      user.password = newPassword;
      await user.save();
    } catch (error) {
      throw new Error(`重置密码失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 验证用户权限
  static async hasPermission(userId: string, requiredRoles: string[]): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        return false;
      }

      // 检查用户是否有所需角色
      return requiredRoles.some(role => user.roles.includes(role));
    } catch (error) {
      return false;
    }
  }

  // 获取用户信息
  static async getUserInfo(userId: string): Promise<UserDocument | null> {
    return User.findById(userId);
  }

  // 更新用户信息
  static async updateUser(userId: string, updateData: UpdateUserRequest): Promise<UserDocument | null> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );
      return user;
    } catch (error) {
      throw new Error(`更新用户信息失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 清理登录失败记录
  static cleanupExpiredAttempts(): number {
    const beforeCount = this.loginAttempts.size;
    this.cleanupLoginAttempts();
    const afterCount = this.loginAttempts.size;
    return beforeCount - afterCount;
  }

  // 获取登录失败统计
  static getLoginAttemptsStats(): { total: number; blocked: { identifiers: string[] } } {
    const now = Date.now();
    const fifteenMinutesAgo = now - 15 * 60 * 1000;

    const blockedIdentifiers: string[] = [];
    for (const [key, attempt] of this.loginAttempts.entries()) {
      if (attempt.count >= 5 && attempt.lastAttempt > fifteenMinutesAgo) {
        blockedIdentifiers.push(key);
      }
    }

    return {
      total: this.loginAttempts.size,
      blocked: {
        identifiers: blockedIdentifiers
      }
    };
  }

  // 记录登录失败
  static async recordFailedLogin(identifier: string): Promise<void> {
    this.recordLoginFailure(identifier);

    // 记录登录失败日志
    logger.warn('Login attempt failed', {
      identifier,
      timestamp: new Date().toISOString(),
      attempts: this.loginAttempts.get(identifier)?.count || 0
    });
  }

  // 记录成功登录
  static recordSuccessfulLogin(identifier: string): void {
    // 清除该用户的登录失败记录
    this.loginAttempts.delete(identifier);

    // 记录成功登录日志
    logger.info('Login successful', {
      identifier,
      timestamp: new Date().toISOString()
    });
  }
}

export default AuthService;
