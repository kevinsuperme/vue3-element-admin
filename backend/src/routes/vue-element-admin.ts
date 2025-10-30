import { Router } from 'express';
import { userRoutes } from './users';
import { articleRoutes } from './articles';
import { roleRoutes } from './roles';
import logRoutes from './logs';
import systemRoutes from './system';
import fileRoutes from './files';

const router = Router();

/**
 * 前端期望的路由结构：
 * /vue-element-admin/user/login - 用户登录
 * /vue-element-admin/user/info - 获取用户信息
 * /vue-element-admin/user/logout - 用户登出
 * /vue-element-admin/article/list - 文章列表
 * /vue-element-admin/article/detail - 文章详情
 * /vue-element-admin/article/create - 创建文章
 * /vue-element-admin/article/update - 更新文章
 * /vue-element-admin/routes - 获取路由
 * /vue-element-admin/roles - 获取角色列表
 * /vue-element-admin/role - 角色管理
 */

// 用户相关路由
router.use('/user', userRoutes);

// 文章相关路由
router.use('/article', articleRoutes);

// 角色和权限路由
router.use('/role', roleRoutes);
router.use('/roles', roleRoutes);
router.use('/routes', roleRoutes);

// 其他系统路由
router.use('/logs', logRoutes);
router.use('/system', systemRoutes);
router.use('/file', fileRoutes);

export { router as vueElementAdminRoutes };
