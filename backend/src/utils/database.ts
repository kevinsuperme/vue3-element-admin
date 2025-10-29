import mongoose from 'mongoose';
import { User, Role } from '../models';
import config from '../config';
import logger from './logger';

export class DatabaseInit {
  // 初始化数据库
  static async init() {
    try {
      await this.createDefaultRoles();
      await this.createDefaultAdmin();
      logger.info('Database initialization completed');
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  // 创建默认角色
  static async createDefaultRoles() {
    try {
      const defaultRoles = [
        {
          name: 'admin',
          description: '系统管理员，拥有所有权限',
          permissions: [
            'user:read', 'user:write', 'user:delete',
            'role:read', 'role:write', 'role:delete',
            'system:read', 'system:write',
            'log:read', 'log:delete',
            'file:read', 'file:write', 'file:delete'
          ],
          isActive: true
        },
        {
          name: 'editor',
          description: '编辑员，可以管理内容',
          permissions: [
            'user:read',
            'content:read', 'content:write',
            'file:read', 'file:write'
          ],
          isActive: true
        },
        {
          name: 'user',
          description: '普通用户，基础权限',
          permissions: [
            'profile:read', 'profile:write',
            'file:read'
          ],
          isActive: true
        }
      ];

      for (const roleData of defaultRoles) {
        const existingRole = await Role.findOne({ name: roleData.name });
        if (!existingRole) {
          const role = new Role(roleData);
          await role.save();
          logger.info(`Created default role: ${roleData.name}`);
        }
      }
    } catch (error) {
      logger.error('Failed to create default roles:', error);
      throw error;
    }
  }

  // 创建默认管理员用户
  static async createDefaultAdmin() {
    try {
      const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
      const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123456';

      const existingAdmin = await User.findOne({ username: adminUsername });
      if (!existingAdmin) {
        const adminRole = await Role.findOne({ name: 'admin' });
        if (!adminRole) {
          throw new Error('Admin role not found. Please create roles first.');
        }

        const admin = new User({
          username: adminUsername,
          email: adminEmail,
          password: adminPassword,
          roles: ['admin'],
          isActive: true
        });

        await admin.save();
        logger.info(`Created default admin user: ${adminUsername}`);

        // 记录默认管理员信息到日志（生产环境中应该移除）
        logger.warn('Default admin credentials created:', {
          username: adminUsername,
          email: adminEmail,
          password: '[HIDDEN]'
        });
      }
    } catch (error) {
      logger.error('Failed to create default admin:', error);
      throw error;
    }
  }

  // 创建索引
  static async createIndexes() {
    try {
      // 用户集合索引
      await User.createIndexes();

      // 角色集合索引
      await Role.createIndexes();

      logger.info('Database indexes created successfully');
    } catch (error) {
      logger.error('Failed to create database indexes:', error);
      throw error;
    }
  }

  // 数据库健康检查
  static async healthCheck() {
    try {
      const mongoState = mongoose.connection.readyState;
      const mongoStatus: Record<number, string> = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      const health: {
        mongodb: {
          status: string;
          host: string;
          port: number;
          name: string;
          stats?: {
            userCount: number;
            roleCount: number;
          };
        };
      } = {
        mongodb: {
          status: mongoStatus[mongoState] || 'unknown',
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name
        }
      };

      // 执行简单查询测试连接
      if (mongoState === 1) {
        const userCount = await User.countDocuments();
        const roleCount = await Role.countDocuments();
        health.mongodb.stats = {
          userCount,
          roleCount
        };
      }

      return health;
    } catch (error) {
      logger.error('Database health check failed:', error);
      throw error;
    }
  }

  // 清理过期数据
  static async cleanupExpiredData() {
    try {
      const { LoginLog } = await import('../models');

      // 清理90天前的登录日志
      const deletedLogs = await LoginLog.cleanupOldLogs(90);
      logger.info(`Cleaned up ${deletedLogs} expired login logs`);

      return {
        deletedLoginLogs: deletedLogs
      };
    } catch (error) {
      logger.error('Failed to cleanup expired data:', error);
      throw error;
    }
  }

  // 备份数据库（简单导出）
  static async backupData() {
    try {
      const users = await User.find().select('-password').lean();
      const roles = await Role.find().lean();
      const { ErrorLog, LoginLog } = await import('../models');
      const errorLogs = await ErrorLog.find().limit(1000).lean();
      const loginLogs = await LoginLog.find().limit(1000).lean();

      const backupData = {
        timestamp: new Date(),
        users,
        roles,
        errorLogs,
        loginLogs
      };

      logger.info('Database backup completed');
      return backupData;
    } catch (error) {
      logger.error('Database backup failed:', error);
      throw error;
    }
  }
}

export default DatabaseInit;