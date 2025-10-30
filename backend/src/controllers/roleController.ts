import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import Role, { Permission } from '../models/Role';
import User from '../models/User';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';
import { performanceMonitor } from '../utils/performance';

export class RoleController {
  /**
   * 获取角色列表
   */
  static getRoles = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `roles_${startTime}`;

    logger.info('Fetching roles list:', {
      requestId,
      query: req.query,
      ip: req.ip
    });

    const {
      page = 1,
      limit = 10,
      status,
      keyword
    } = req.query;

    const query: Record<string, unknown> = {};

    // 状态筛选
    if (status) {
      query.status = status;
    }

    // 关键词搜索
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' }},
        { code: { $regex: keyword, $options: 'i' }},
        { description: { $regex: keyword, $options: 'i' }}
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    try {
      const [roles, total] = await Promise.all([
        Role.find(query)
          .populate('permissions', 'name code description')
          .sort({ sort: 1, createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Role.countDocuments(query)
      ]);

      const response = ApiResponse.success({
        items: roles,
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      });

      const duration = Date.now() - startTime;
      logger.info('Roles list fetched successfully:', {
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
        url: '/api/roles',
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

      res.json(response);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to fetch roles list:', {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`
      });

      // 记录错误性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: '/api/roles',
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

  /**
   * 获取角色详情
   */
  static getRole = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('获取角色详情请求开始', { requestId, ip: req.ip, roleId: req.params.id });

    try {
      const { id } = req.params;

      if (!id) {
        logger.warn('获取角色详情失败：角色ID不能为空', { requestId, duration: Date.now() - startTime });

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

        throw new AppError('角色ID不能为空', 400);
      }

      const role = await Role.findById(id)
        .populate('permissions', 'name code description module action')
        .lean();

      if (!role) {
        logger.warn('获取角色详情失败：角色不存在', { requestId, roleId: id, duration: Date.now() - startTime });

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

        throw new AppError('角色不存在', 404);
      }

      logger.info('获取角色详情成功', { requestId, roleId: id, roleName: role.name, duration: Date.now() - startTime });

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

      res.json(ApiResponse.success(role));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('获取角色详情失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

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

  /**
   * 创建角色
   */
  static createRole = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `create-role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('创建角色请求开始', { requestId, ip: req.ip, roleName: req.body.name, roleCode: req.body.code });

    try {
      const {
        name,
        code,
        description,
        permissions = [],
        menuIds = [],
        status = 'active',
        sort = 0
      } = req.body;

      if (!name || !code) {
        logger.warn('创建角色失败：角色名称和编码不能为空', { requestId, duration: Date.now() - startTime });

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

        throw new AppError('角色名称和编码不能为空', 400);
      }

      // 检查角色编码是否已存在
      const exists = await Role.checkRoleCodeExists(code);
      if (exists) {
        logger.warn('创建角色失败：角色编码已存在', { requestId, roleCode: code, duration: Date.now() - startTime });

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

        throw new AppError('角色编码已存在', 400);
      }

      const role = await Role.create({
        name,
        code,
        description,
        permissions,
        menuIds,
        status,
        sort
      });

      const populatedRole = await Role.findById(role._id)
        .populate('permissions', 'name code description')
        .lean();

      logger.info('创建角色成功', { requestId, roleId: role._id, roleName: name, roleCode: code, duration: Date.now() - startTime });

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

      res.json(ApiResponse.success(populatedRole, '角色创建成功'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('创建角色失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

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

  /**
   * 更新角色
   */
  static updateRole = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `update-role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('更新角色请求开始', { requestId, ip: req.ip, roleId: req.params.id });

    try {
      const { id } = req.params;
      const {
        name,
        code,
        description,
        permissions,
        menuIds,
        status,
        sort
      } = req.body;

      if (!id) {
        logger.warn('更新角色失败：角色ID不能为空', { requestId, duration: Date.now() - startTime });

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

        throw new AppError('角色ID不能为空', 400);
      }

      const role = await Role.findById(id);
      if (!role) {
        logger.warn('更新角色失败：角色不存在', { requestId, roleId: id, duration: Date.now() - startTime });

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

        throw new AppError('角色不存在', 404);
      }

      // 如果更新编码，检查是否已存在
      if (code && code !== role.code) {
        const exists = await Role.checkRoleCodeExists(code, id);
        if (exists) {
          logger.warn('更新角色失败：角色编码已存在', { requestId, roleCode: code, duration: Date.now() - startTime });

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

          throw new AppError('角色编码已存在', 400);
        }
      }

      // 更新字段
      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (code !== undefined) updateData.code = code;
      if (description !== undefined) updateData.description = description;
      if (permissions !== undefined) updateData.permissions = permissions;
      if (menuIds !== undefined) updateData.menuIds = menuIds;
      if (status !== undefined) updateData.status = status;
      if (sort !== undefined) updateData.sort = sort;

      const updatedRole = await Role.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate('permissions', 'name code description').lean();

      logger.info('更新角色成功', { requestId, roleId: id, roleName: updatedRole?.name, duration: Date.now() - startTime });

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

      res.json(ApiResponse.success(updatedRole, '角色更新成功'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('更新角色失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

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

  /**
   * 删除角色
   */
  static deleteRole = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `delete-role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('删除角色请求开始', { requestId, ip: req.ip, roleId: req.params.id });

    try {
      const { id } = req.params;

      if (!id) {
        logger.warn('删除角色失败：角色ID不能为空', { requestId, duration: Date.now() - startTime });

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

        throw new AppError('角色ID不能为空', 400);
      }

      const role = await Role.findById(id);
      if (!role) {
        logger.warn('删除角色失败：角色不存在', { requestId, roleId: id, duration: Date.now() - startTime });

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

        throw new AppError('角色不存在', 404);
      }

      // 检查是否有用户在使用这个角色
      const userCount = await User.countDocuments({ roleIds: id });
      if (userCount > 0) {
        logger.warn('删除角色失败：角色已被用户使用', { requestId, roleId: id, userCount, duration: Date.now() - startTime });

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

        throw new AppError('该角色已被用户使用，无法删除', 400);
      }

      await Role.findByIdAndDelete(id);

      logger.info('删除角色成功', { requestId, roleId: id, roleName: role.name, duration: Date.now() - startTime });

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

      res.json(ApiResponse.success(null, '角色删除成功'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('删除角色失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

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

  /**
   * 获取所有路由
   */
  static getRoutes = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `get-routes-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('获取路由列表请求开始', { requestId, ip: req.ip });

    try {
      const routes = await Permission.find({})
        .select('name code')
        .lean();

      // 返回权限列表（不是菜单树）
      const permissionList = routes;

      logger.info('获取路由列表成功', { requestId, routeCount: routes.length, duration: Date.now() - startTime });

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

      res.json(ApiResponse.success(permissionList, '获取权限列表成功'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('获取路由列表失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

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

  /**
   * 创建权限
   */
  static createPermission = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `create-permission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('创建权限请求开始', { requestId, ip: req.ip });

    try {
      const {
        name,
        code,
        description,
        module,
        action
      } = req.body;

      if (!name || !code || !module || !action) {
        logger.warn('创建权限失败：权限信息不完整', { requestId, duration: Date.now() - startTime });

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

        throw new AppError('权限信息不完整', 400);
      }

      // 检查权限编码是否已存在
      const exists = await Permission.checkPermissionExists(code);
      if (exists) {
        logger.warn('创建权限失败：权限编码已存在', { requestId, permissionCode: code, duration: Date.now() - startTime });

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

        throw new AppError('权限编码已存在', 400);
      }

      const permission = await Permission.create({
        name,
        code,
        description,
        module,
        action
      });

      logger.info('创建权限成功', { requestId, permissionId: permission._id, permissionName: permission.name, permissionCode: permission.code, duration: Date.now() - startTime });

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

      res.json(ApiResponse.success(permission, '权限创建成功'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('创建权限失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

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
