import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ErrorLog, LoginLog } from '../models';
import { ApiResponse, PaginatedResponse } from '../types';
import { asyncHandler } from '../middleware/asyncHandler';
import logger from '../utils/logger';
import { performanceMonitor } from '../utils/performance';

export class LogController {
  // 获取错误日志列表
  static getErrorLogs = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `error_logs_${startTime}`;

    logger.info('Fetching error logs:', {
      requestId,
      query: req.query,
      ip: req.ip
    });

    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      search = '',
      isResolved,
      startDate,
      endDate
    } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { message: { $regex: search, $options: 'i' }},
        { stack: { $regex: search, $options: 'i' }}
      ];
    }

    if (isResolved !== undefined) {
      query.isResolved = isResolved === 'true';
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate as string);
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const sortObj: any = {};
    sortObj[sort as string] = order === 'desc' ? -1 : 1;

    try {
      const [logs, total] = await Promise.all([
        ErrorLog.find(query)
          .populate('userId', 'username email')
          .sort(sortObj)
          .skip(skip)
          .limit(Number(limit)),
        ErrorLog.countDocuments(query)
      ]);

      const response: PaginatedResponse = {
        success: true,
        message: '获取错误日志列表成功',
        data: logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        },
        timestamp: new Date()
      };

      const duration = Date.now() - startTime;
      logger.info('Error logs fetched successfully:', {
        requestId,
        page: Number(page),
        limit: Number(limit),
        total,
        duration: `${duration}ms`
      });

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: '/api/logs/error',
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
      logger.error('Failed to fetch error logs:', {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`
      });

      // 记录错误性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: '/api/logs/error',
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

  // 获取错误日志统计
  static getErrorLogStats = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `error_stats_${startTime}`;

    logger.info('Fetching error log stats:', {
      requestId,
      query: req.query,
      ip: req.ip
    });

    try {
      const { period = '7d' } = req.query;

      let timeRange: 'day' | 'week' | 'month' = 'week';
      switch (period) {
        case '1d': timeRange = 'day'; break;
        case '7d': timeRange = 'week'; break;
        case '30d': timeRange = 'month'; break;
        case '90d': timeRange = 'month'; break;
        default: timeRange = 'week';
      }

      const stats = await ErrorLog.getErrorStats(timeRange);

      const response: ApiResponse = {
        success: true,
        message: '获取错误日志统计成功',
        data: stats,
        timestamp: new Date()
      };

      const duration = Date.now() - startTime;
      logger.info('Error log stats fetched successfully:', {
        requestId,
        period,
        duration: `${duration}ms`
      });

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: '/api/logs/error/stats',
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
      logger.error('Failed to fetch error log stats:', {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`
      });

      // 记录错误性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: '/api/logs/error/stats',
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

  // 标记错误日志为已解决
  static markErrorResolved = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `mark_error_${startTime}`;

    logger.info('Marking error log as resolved:', {
      requestId,
      params: req.params,
      body: req.body,
      ip: req.ip
    });

    try {
      const { id } = req.params;
      const { isResolved = true } = req.body;

      const log = await ErrorLog.findByIdAndUpdate(
        id,
        { isResolved, resolvedAt: isResolved ? new Date() : null },
        { new: true }
      );

      if (!log) {
        const duration = Date.now() - startTime;
        logger.warn('Error log not found:', {
          requestId,
          id,
          duration: `${duration}ms`
        });

        // 记录404性能指标
        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
        performanceMonitor.recordMetric({
          requestId,
          method: 'PUT',
          url: `/api/logs/error/${id}/resolve`,
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
          message: '错误日志不存在',
          timestamp: new Date()
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: '标记错误日志状态成功',
        data: log,
        timestamp: new Date()
      };

      const duration = Date.now() - startTime;
      logger.info('Error log marked as resolved successfully:', {
        requestId,
        id,
        isResolved,
        duration: `${duration}ms`
      });

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'PUT',
        url: `/api/logs/error/${id}/resolve`,
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
      logger.error('Failed to mark error log as resolved:', {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`
      });

      // 记录错误性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'PUT',
        url: `/api/logs/error/${req.params.id}/resolve`,
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

  // 批量删除错误日志
  static deleteErrorLogs = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `delete_errors_${startTime}`;

    logger.info('Deleting error logs:', {
      requestId,
      body: req.body,
      ip: req.ip
    });

    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        const duration = Date.now() - startTime;
        logger.warn('Invalid error log IDs provided:', {
          requestId,
          ids,
          duration: `${duration}ms`
        });

        // 记录400性能指标
        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
        performanceMonitor.recordMetric({
          requestId,
          method: 'DELETE',
          url: '/api/logs/error/batch',
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
          message: '请提供要删除的错误日志ID列表',
          timestamp: new Date()
        });
        return;
      }

      const result = await ErrorLog.deleteMany({ _id: { $in: ids }});

      const response: ApiResponse = {
        success: true,
        message: `成功删除 ${result.deletedCount} 条错误日志`,
        data: { deletedCount: result.deletedCount },
        timestamp: new Date()
      };

      const duration = Date.now() - startTime;
      logger.info('Error logs deleted successfully:', {
        requestId,
        deletedCount: result.deletedCount,
        idsCount: ids.length,
        duration: `${duration}ms`
      });

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'DELETE',
        url: '/api/logs/error/batch',
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
      logger.error('Failed to delete error logs:', {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`
      });

      // 记录错误性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'DELETE',
        url: '/api/logs/error/batch',
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

  // 清理旧错误日志
  static cleanupErrorLogs = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `cleanup_errors_${startTime}`;

    logger.info('Cleaning up old error logs:', {
      requestId,
      body: req.body,
      ip: req.ip
    });

    try {
      const { days = 90 } = req.body;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - Number(days));

      const result = await ErrorLog.deleteMany({
        createdAt: { $lt: cutoffDate },
        isResolved: true
      });

      const response: ApiResponse = {
        success: true,
        message: `成功清理 ${result.deletedCount} 条旧错误日志`,
        data: { deletedCount: result.deletedCount },
        timestamp: new Date()
      };

      const duration = Date.now() - startTime;
      logger.info('Old error logs cleaned up successfully:', {
        requestId,
        days,
        deletedCount: result.deletedCount,
        duration: `${duration}ms`
      });

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'POST',
        url: '/api/logs/error/cleanup',
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
      logger.error('Failed to cleanup old error logs:', {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`
      });

      // 记录错误性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'POST',
        url: '/api/logs/error/cleanup',
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

export class LoginLogController {
  // 获取登录日志列表
  static getLoginLogs = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `login_logs_${startTime}`;

    logger.info('Fetching login logs:', {
      requestId,
      query: req.query,
      ip: req.ip
    });

    try {
      const {
        page = 1,
        limit = 10,
        sort = 'loginTime',
        order = 'desc',
        search = '',
        startDate,
        endDate
      } = req.query;

      const query: any = {};

      if (search) {
        query.$or = [
          { ip: { $regex: search, $options: 'i' }},
          { userAgent: { $regex: search, $options: 'i' }}
        ];
      }

      if (startDate || endDate) {
        query.loginTime = {};
        if (startDate) {
          query.loginTime.$gte = new Date(startDate as string);
        }
        if (endDate) {
          query.loginTime.$lte = new Date(endDate as string);
        }
      }

      const skip = (Number(page) - 1) * Number(limit);

      const sortObj: any = {};
      sortObj[sort as string] = order === 'desc' ? -1 : 1;

      const [logs, total] = await Promise.all([
        LoginLog.find(query)
          .populate('userId', 'username email')
          .sort(sortObj)
          .skip(skip)
          .limit(Number(limit)),
        LoginLog.countDocuments(query)
      ]);

      const response: PaginatedResponse = {
        success: true,
        message: '获取登录日志列表成功',
        data: logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        },
        timestamp: new Date()
      };

      const duration = Date.now() - startTime;
      logger.info('Login logs fetched successfully:', {
        requestId,
        page: Number(page),
        limit: Number(limit),
        total,
        duration: `${duration}ms`
      });

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: '/api/logs/login',
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
      logger.error('Failed to fetch login logs:', {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`
      });

      // 记录错误性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: '/api/logs/login',
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

  // 获取登录统计
  static getLoginStats = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `login_stats_${startTime}`;

    logger.info('Fetching login stats:', {
      requestId,
      query: req.query,
      ip: req.ip
    });

    try {
      const { period = '7d' } = req.query;

      let timeRange: 'day' | 'week' | 'month' = 'week';
      switch (period) {
        case '1d': timeRange = 'day'; break;
        case '7d': timeRange = 'week'; break;
        case '30d': timeRange = 'month'; break;
        case '90d': timeRange = 'month'; break;
        default: timeRange = 'week';
      }

      const stats = await LoginLog.getLoginStats(timeRange);

      const response: ApiResponse = {
        success: true,
        message: '获取登录统计成功',
        data: stats,
        timestamp: new Date()
      };

      const duration = Date.now() - startTime;
      logger.info('Login stats fetched successfully:', {
        requestId,
        period,
        duration: `${duration}ms`
      });

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: '/api/logs/login/stats',
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
      logger.error('Failed to fetch login stats:', {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`
      });

      // 记录错误性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: '/api/logs/login/stats',
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

  // 获取用户登录历史
  static getUserLoginHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `user_login_history_${startTime}`;

    logger.info('Fetching user login history:', {
      requestId,
      params: req.params,
      query: req.query,
      ip: req.ip
    });

    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        logger.warn('Invalid user ID provided:', {
          requestId,
          userId: req.params.userId
        });

        const response: ApiResponse = {
          success: false,
          message: '用户ID无效',
          data: null,
          timestamp: new Date()
        };

        // 记录性能指标 (400错误)
        const duration = Date.now() - startTime;
        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
        performanceMonitor.recordMetric({
          requestId,
          method: 'GET',
          url: `/api/logs/login/user/${userId}`,
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

        return res.status(400).json(response);
      }

      const { limit = 10 } = req.query;

      const history = await LoginLog.getUserLoginHistory(String(userId), parseInt(limit as string));

      const response: ApiResponse = {
        success: true,
        message: '获取用户登录历史成功',
        data: history,
        timestamp: new Date()
      };

      const duration = Date.now() - startTime;
      logger.info('User login history fetched successfully:', {
        requestId,
        userId,
        duration: `${duration}ms`
      });

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: `/api/logs/login/user/${userId}`,
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
      logger.error('Failed to fetch user login history:', {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`
      });

      // 记录错误性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: `/api/logs/login/user/${req.params.userId}`,
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

  // 删除登录日志
  static deleteLoginLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `delete_login_logs_${startTime}`;

    logger.info('Deleting login logs:', {
      requestId,
      body: req.body,
      userId: req.user?.userId,
      ip: req.ip
    });

    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        logger.warn('Invalid log IDs provided for deletion:', {
          requestId,
          ids
        });

        const response: ApiResponse = {
          success: false,
          message: '请选择要删除的日志',
          data: null,
          timestamp: new Date()
        };

        // 记录性能指标 (400错误)
        const duration = Date.now() - startTime;
        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
        performanceMonitor.recordMetric({
          requestId,
          method: 'DELETE',
          url: '/api/logs/login',
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

        return res.status(400).json(response);
      }

      const result = await LoginLog.deleteMany({ _id: { $in: ids }});

      const duration = Date.now() - startTime;
      logger.info('Login logs deleted successfully:', {
        requestId,
        deletedCount: result.deletedCount,
        duration: `${duration}ms`
      });

      const response: ApiResponse = {
        success: true,
        message: `成功删除 ${result.deletedCount} 条登录日志`,
        data: { deletedCount: result.deletedCount },
        timestamp: new Date()
      };

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'DELETE',
        url: '/api/logs/login',
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
      logger.error('Failed to delete login logs:', {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`
      });

      // 记录错误性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'DELETE',
        url: '/api/logs/login',
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

  // 清理旧登录日志
  static cleanupLoginLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `cleanup_login_logs_${startTime}`;

    logger.info('Cleaning up login logs:', {
      requestId,
      body: req.body,
      userId: req.user?.userId,
      ip: req.ip
    });

    try {
      const { days = 180 } = req.body;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - Number(days));

      const result = await LoginLog.deleteMany({
        loginTime: { $lt: cutoffDate }
      });

      const duration = Date.now() - startTime;
      logger.info('Login logs cleaned up successfully:', {
        requestId,
        days,
        deletedCount: result.deletedCount,
        duration: `${duration}ms`
      });

      const response: ApiResponse = {
        success: true,
        message: `成功清理 ${result.deletedCount} 条旧登录日志`,
        data: { deletedCount: result.deletedCount },
        timestamp: new Date()
      };

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'DELETE',
        url: '/api/logs/login/cleanup',
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
      logger.error('Failed to cleanup login logs:', {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`
      });

      // 记录错误性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'DELETE',
        url: '/api/logs/login/cleanup',
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

export default {
  LogController,
  LoginLogController
};
