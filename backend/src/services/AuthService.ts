import { User, UserDocument } from '../models';
import { RegisterRequest, UpdateUserRequest, ChangePasswordRequest } from '../types';
import bcrypt from 'bcryptjs';
import JWTService from './JWTService';
import { JWTPayload } from '../types';

export class AuthService {
  // 用户注册
  static async register(userData: RegisterRequest): Promise<{ user: UserDocument; tokens: { accessToken: string; refreshToken: string } }> {
    try {
      // 检查用户名是否已存在
      const existingUser = await User.findOne({ 
        $or: [{ username: userData.username }, { email: userData.email }] 
      });
      
      if (existingUser) {
        throw new Error('用户名或邮箱已存在');
      }

      // 创建新用户
      const user = new User(userData);
      await user.save();

      // 生成JWT令牌
      const payload: JWTPayload = {
        userId: user._id!.toString(),
        username: user.username,
        roles: user.roles,
      };

      const tokens = JWTService.generateTokenPair(payload);

      return { user, tokens };
    } catch (error) {
      throw new Error(`注册失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 用户登录
  static async login(username: string, password: string, ip: string, userAgent: string): Promise<{ user: UserDocument; tokens: { accessToken: string; refreshToken: string } }> {
    try {
      // 查找用户
      const user = await User.findOne({ 
        $or: [{ username }, { email: username.toLowerCase() }],
        isActive: true 
      }).select('+password');

      if (!user) {
        throw new Error('用户不存在或已被禁用');
      }

      // 验证密码
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('密码错误');
      }

      // 更新最后登录时间
      user.lastLogin = new Date();
      await user.save();

      // 记录登录日志
      const { LoginLog } = await import('../models');
      await LoginLog.create({
        userId: user._id,
        ip,
        userAgent,
        success: true,
      });

      // 生成JWT令牌
      const payload: JWTPayload = {
        userId: user._id!.toString(),
        username: user.username,
        roles: user.roles,
      };

      const tokens = JWTService.generateTokenPair(payload);

      return { user, tokens };
    } catch (error) {
      // 记录失败的登录日志
      try {
        const { LoginLog } = await import('../models');
        const user = await User.findOne({ 
          $or: [{ username }, { email: username.toLowerCase() }] 
        });
        
        if (user) {
          await LoginLog.create({
            userId: user._id,
            ip,
            userAgent,
            success: false,
            message: error instanceof Error ? error.message : '登录失败',
          });
        }
      } catch (logError) {
        console.error('记录登录日志失败:', logError);
      }

      throw new Error(`登录失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 刷新令牌
  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = JWTService.verifyToken(refreshToken);
      
      // 验证用户是否仍然存在且活跃
      const user = await User.findById(payload.userId);
      if (!user || !user.isActive) {
        throw new Error('用户不存在或已被禁用');
      }

      // 生成新的令牌对
      const newPayload: JWTPayload = {
        userId: user._id!.toString(),
        username: user.username,
        roles: user.roles,
      };

      return JWTService.generateTokenPair(newPayload);
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
}

export default AuthService;