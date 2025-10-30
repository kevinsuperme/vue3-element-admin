import { Router } from 'express';
import SystemController from '../controllers/systemController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// 系统信息 - 公开路由
router.get('/system/info', SystemController.getSystemInfo);
router.get('/system/health', SystemController.healthCheck);
router.get('/system/routes', SystemController.getRoutesInfo);

// 系统管理 - 需要管理员权限
router.get('/system/env', authenticate, authorize(['admin']), SystemController.getEnvInfo);
router.get('/system/config', authenticate, authorize(['admin']), SystemController.getAppConfig);
router.get('/system/stats', authenticate, authorize(['admin']), SystemController.getStatistics);
router.post('/system/restart', authenticate, authorize(['admin']), SystemController.restartApplication);

export const systemRoutes = router;
export default router;
