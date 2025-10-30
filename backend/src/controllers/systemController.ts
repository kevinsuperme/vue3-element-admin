import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiResponse } from '../types';
import { asyncHandler } from '../middleware';
import logger from '../utils/logger';
import { performanceMonitor } from '../utils/performance';

export class SystemController {
  // 获取系统信息
  static getSystemInfo = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `sys-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('获取系统信息请求开始', { requestId, ip: req.ip });

    try {
      const systemInfo = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
          rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`
        },
        uptime: `${Math.round(process.uptime())} seconds`,
        pid: process.pid,
        env: process.env.NODE_ENV || 'development'
      };

      const response: ApiResponse = {
        success: true,
        message: '获取系统信息成功',
        data: systemInfo,
        timestamp: new Date()
      };

      logger.info('获取系统信息成功', { requestId, duration: Date.now() - startTime });

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

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('获取系统信息失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

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

  // 健康检查
  static healthCheck = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `health-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('健康检查请求开始', { requestId, ip: req.ip });

    try {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: 'connected', // 这里可以添加数据库连接状态检查
        redis: 'connected' // 这里可以添加Redis连接状态检查
      };

      const response: ApiResponse = {
        success: true,
        message: '系统健康状态正常',
        data: healthStatus,
        timestamp: new Date()
      };

      logger.info('健康检查成功', { requestId, duration: Date.now() - startTime });

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

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('健康检查失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

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

  // 获取API路由信息
  static getRoutesInfo = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `get-routes-info-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('获取路由信息请求开始', { requestId, ip: req.ip });

    try {
      const routes: Array<{method: string; path: string; handlers: number}> = [];
      const app = req.app;

      // 定义 Express 路由层的接口
      interface RouteLayer {
        route?: {
          methods: Record<string, boolean>;
          path: string;
          stack: unknown[];
        };
        name?: string;
        handle?: {
          stack: RouteLayer[];
        };
        regexp?: {
          source: string;
        };
      }

      // 遍历所有路由
      const extractRoutes = (stack: RouteLayer[], basePath = '') => {
        stack.forEach((layer) => {
          if (layer.route) {
            const route = layer.route;
            routes.push({
              method: Object.keys(route.methods)[0].toUpperCase(),
              path: basePath + route.path,
              handlers: route.stack.length
            });
          } else if (layer.name === 'router' && layer.handle?.stack && layer.regexp?.source) {
            extractRoutes(layer.handle.stack, basePath + layer.regexp.source.replace('\\', ''));
          } else if (layer.name === 'bound dispatch' && layer.handle?.stack) {
            extractRoutes(layer.handle.stack, basePath);
          }
        });
      };

      if (app._router && app._router.stack) {
        extractRoutes(app._router.stack);
      }

      logger.info('获取路由信息成功', { requestId, routeCount: routes.length, duration: Date.now() - startTime });

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
        message: '获取路由信息成功',
        data: {
          totalRoutes: routes.length,
          routes: routes.sort((a, b) => a.path.localeCompare(b.path))
        },
        timestamp: new Date()
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('获取路由信息失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

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

  // 获取环境变量信息（敏感信息会被过滤）
  static getEnvInfo = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `get-env-info-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('获取环境变量信息请求开始', { requestId, ip: req.ip });

    try {
      const envVars: Record<string, string | undefined> = {};
      const sensitiveKeys = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN', 'PRIVATE', 'DB_URL'];

      Object.keys(process.env).forEach(key => {
        const isSensitive = sensitiveKeys.some(sensitiveKey =>
          key.toUpperCase().includes(sensitiveKey)
        );

        envVars[key] = isSensitive ? '***' : process.env[key];
      });

      logger.info('获取环境变量信息成功', { requestId, envVarCount: Object.keys(envVars).length, duration: Date.now() - startTime });

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
        message: '获取环境变量信息成功',
        data: envVars,
        timestamp: new Date()
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('获取环境变量信息失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

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

  // 获取应用配置信息
  static getAppConfig = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `get-app-config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('获取应用配置信息请求开始', { requestId, ip: req.ip });

    try {
      const config = {
        app: {
          name: process.env.APP_NAME || 'Vue3 Element Admin Backend',
          version: process.env.APP_VERSION || '1.0.0',
          description: process.env.APP_DESCRIPTION || 'Vue3 Element Admin Backend API',
          port: process.env.PORT || 3000,
          nodeEnv: process.env.NODE_ENV || 'development'
        },
        database: {
          type: process.env.DB_TYPE || 'mongodb',
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 27017,
          name: process.env.DB_NAME || 'vue3_admin'
        },
        jwt: {
          accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
          refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
          algorithm: process.env.JWT_ALGORITHM || 'HS256'
        },
        cors: {
          origin: process.env.CORS_ORIGIN || '*',
          credentials: process.env.CORS_CREDENTIALS === 'true'
        },
        rateLimit: {
          windowMs: process.env.RATE_LIMIT_WINDOW || '15 minutes',
          max: process.env.RATE_LIMIT_MAX || '100'
        }
      };

      logger.info('获取应用配置信息成功', { requestId, configSections: Object.keys(config).length, duration: Date.now() - startTime });

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
        message: '获取应用配置信息成功',
        data: config,
        timestamp: new Date()
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('获取应用配置信息失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

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

  // 获取统计信息
  static getStatistics = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `stats-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('获取统计信息请求开始', { requestId, ip: req.ip });

    try {
      const { User, Role, ErrorLog, LoginLog } = await import('../models');

      const [
        totalUsers,
        activeUsers,
        totalRoles,
        totalErrors,
        recentErrors,
        totalLogins,
        recentLogins
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        Role.countDocuments(),
        ErrorLog.countDocuments(),
        ErrorLog.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
        LoginLog.countDocuments(),
        LoginLog.countDocuments({
          loginTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
      ]);

      const stats = {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        roles: {
          total: totalRoles
        },
        errors: {
          total: totalErrors,
          recent: recentErrors
        },
        logins: {
          total: totalLogins,
          recent: recentLogins
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date()
        }
      };

      const response: ApiResponse = {
        success: true,
        message: '获取统计信息成功',
        data: stats,
        timestamp: new Date()
      };

      logger.info('获取统计信息成功', {
        requestId,
        duration: Date.now() - startTime,
        stats: {
          totalUsers,
          activeUsers,
          totalRoles,
          totalErrors,
          recentErrors,
          totalLogins,
          recentLogins
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

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('获取统计信息失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

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

  // 重启应用（需要管理员权限）
  static restartApplication = asyncHandler(async (req: AuthRequest, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `restart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('Application restart requested by admin', { requestId, userId: req.user!.userId });

    const response: ApiResponse = {
      success: true,
      message: '应用将在3秒后重启',
      data: { countdown: 3 },
      timestamp: new Date()
    };

    logger.info('应用重启请求已发送', { requestId, duration: Date.now() - startTime });

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

    res.status(200).json(response);

    // 延迟重启，让响应能够发送完成
    setTimeout(() => {
      logger.info('Restarting application...');
      process.exit(0); // 在生产环境中，应该使用进程管理器来重启应用
    }, 3000);
  });
}

export default SystemController;
