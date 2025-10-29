import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ErrorLog, LoginLog } from '../models';
import { ApiResponse, PaginatedResponse } from '../types';
import { errorHandler, asyncHandler } from '../middleware/errorHandler';

export class LogController {
  // 获取错误日志列表
  static getErrorLogs = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      search = '',
      isResolved,
      startDate,
      endDate,
    } = req.query;

    const query: any = {};
    
    if (search) {
      query.$or = [
        { message: { $regex: search, $options: 'i' } },
        { stack: { $regex: search, $options: 'i' } },
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

    const [logs, total] = await Promise.all([
      ErrorLog.find(query)
        .populate('userId', 'username email')
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit)),
      ErrorLog.countDocuments(query),
    ]);

    const response: PaginatedResponse = {
      success: true,
      message: '获取错误日志列表成功',
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });

  // 获取错误日志统计
  static getErrorLogStats = asyncHandler(async (req: Request, res: Response) => {
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
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });

  // 标记错误日志为已解决
  static markErrorResolved = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isResolved = true } = req.body;

    const log = await ErrorLog.findByIdAndUpdate(
      id,
      { isResolved, resolvedAt: isResolved ? new Date() : null },
      { new: true }
    );

    if (!log) {
      res.status(404).json({
        success: false,
        message: '错误日志不存在',
        timestamp: new Date(),
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: '标记错误日志状态成功',
      data: log,
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });

  // 批量删除错误日志
  static deleteErrorLogs = asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        success: false,
        message: '请提供要删除的错误日志ID列表',
        timestamp: new Date(),
      });
      return;
    }

    const result = await ErrorLog.deleteMany({ _id: { $in: ids } });

    const response: ApiResponse = {
      success: true,
      message: `成功删除 ${result.deletedCount} 条错误日志`,
      data: { deletedCount: result.deletedCount },
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });

  // 清理旧错误日志
  static cleanupErrorLogs = asyncHandler(async (req: Request, res: Response) => {
    const { days = 90 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(days));

    const result = await ErrorLog.deleteMany({
      createdAt: { $lt: cutoffDate },
      isResolved: true,
    });

    const response: ApiResponse = {
      success: true,
      message: `成功清理 ${result.deletedCount} 条旧错误日志`,
      data: { deletedCount: result.deletedCount },
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });
}

export class LoginLogController {
  // 获取登录日志列表
  static getLoginLogs = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      sort = 'loginTime',
      order = 'desc',
      search = '',
      startDate,
      endDate,
    } = req.query;

    const query: any = {};
    
    if (search) {
      query.$or = [
        { ip: { $regex: search, $options: 'i' } },
        { userAgent: { $regex: search, $options: 'i' } },
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
      LoginLog.countDocuments(query),
    ]);

    const response: PaginatedResponse = {
      success: true,
      message: '获取登录日志列表成功',
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });

  // 获取登录统计
  static getLoginStats = asyncHandler(async (req: Request, res: Response) => {
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
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });

  // 获取用户登录历史
  static getUserLoginHistory = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      LoginLog.find({ userId })
        .sort({ loginTime: -1 })
        .skip(skip)
        .limit(Number(limit)),
      LoginLog.countDocuments({ userId }),
    ]);

    const response: PaginatedResponse = {
      success: true,
      message: '获取用户登录历史成功',
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });

  // 删除登录日志
  static deleteLoginLogs = asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        success: false,
        message: '请提供要删除的登录日志ID列表',
        timestamp: new Date(),
      });
      return;
    }

    const result = await LoginLog.deleteMany({ _id: { $in: ids } });

    const response: ApiResponse = {
      success: true,
      message: `成功删除 ${result.deletedCount} 条登录日志`,
      data: { deletedCount: result.deletedCount },
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });

  // 清理旧登录日志
  static cleanupLoginLogs = asyncHandler(async (req: Request, res: Response) => {
    const { days = 180 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(days));

    const result = await LoginLog.deleteMany({
      loginTime: { $lt: cutoffDate },
    });

    const response: ApiResponse = {
      success: true,
      message: `成功清理 ${result.deletedCount} 条旧登录日志`,
      data: { deletedCount: result.deletedCount },
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });
}

export default {
  LogController,
  LoginLogController,
};