import { Router } from 'express';
import { authRoutes, logRoutes, systemRoutes, fileRoutes, vueElementAdminRoutes } from './index';
import { errorHandler } from '../middleware/errorHandler';

const router = Router();

// API根路径
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Vue3 Element Admin Backend API',
    version: '1.0.0',
    timestamp: new Date(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      logs: '/api/logs',
      system: '/api/system',
      files: '/api/files'
    }
  });
});

// 挂载各个模块的路由
router.use('/auth', authRoutes);
router.use('/users', authRoutes); // 用户管理路由使用authRoutes中的/users子路由
router.use('/logs', logRoutes);
router.use('/system', systemRoutes);
router.use('/files', fileRoutes);
// 演示模块兼容路由（与前端示例保持一致）
router.use('/vue-element-admin', vueElementAdminRoutes);

// 404处理
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API 接口不存在',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date()
  });
});

// 错误处理中间件
router.use(errorHandler);

export default router;
