/*
 * @Author: kevinsuperme iphone.com@live.cn
 * @Date: 2025-10-30 15:14:06
 * @LastEditors: kevinsuperme iphone.com@live.cn
 * @LastEditTime: 2025-11-28 01:31:44
 * @FilePath: \vue3-element-admin\backend\src\routes\vue-element-admin.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Router } from 'express';
import { authenticate as auth } from '../middleware/auth';
import { RoleController } from '../controllers/roleController';
import { AuthController } from '../controllers/authController';
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
// 兼容前端示例登录/信息/登出
router.post('/user/login', AuthController.login);
router.get('/user/info', auth, AuthController.getCurrentUser);
router.post('/user/logout', auth, AuthController.logout);

// 文章相关路由
router.use('/article', articleRoutes);

// 角色和权限路由
router.use('/role', roleRoutes);
router.use('/roles', roleRoutes);
// 兼容前端示例：/routes 返回系统可用路由
router.get('/routes', auth, RoleController.getRoutes);

// 其他系统路由
router.use('/logs', logRoutes);
router.use('/system', systemRoutes);
router.use('/file', fileRoutes);

// 示例兼容：远程搜索与交易列表（返回与Mock一致的结构）
router.get('/search/user', auth, (req, res) => {
  const { name = '' } = req.query as { name?: string };
  const users = [
    { name: 'admin', email: 'admin@example.com' },
    { name: 'editor', email: 'editor@example.com' },
    { name: 'visitor', email: 'visitor@example.com' }
  ].filter(u => (name as string).length === 0 || u.name.includes(name as string));

  res.json({ code: 20000, data: users });
});

router.get('/transaction/list', auth, (req, res) => {
  const { page = 1, limit = 20 } = req.query as { page?: string | number; limit?: string | number };
  const total = 50;
  const items = Array.from({ length: Number(limit) }, (_v, i) => ({
    order_no: `NO_${Number(page)}_${i + 1}`,
    timestamp: Date.now() - i * 100000,
    username: 'admin',
    price: Number((Math.random() * 100).toFixed(2)),
    status: ['success', 'pending', 'processing'][i % 3]
  }));
  res.json({ code: 20000, data: { total, items }});
});

export { router as vueElementAdminRoutes };
