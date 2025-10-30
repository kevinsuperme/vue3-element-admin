import { Router } from 'express';
import { LogController, LoginLogController } from '../controllers/logController';
import { authenticate, authorize } from '../middleware/auth';
import { validatePagination } from '../validators';

const router = Router();

// 错误日志管理 - 需要管理员权限
router.get('/error-logs', authenticate, authorize(['admin']), validatePagination, LogController.getErrorLogs);
router.get('/error-logs/stats', authenticate, authorize(['admin']), LogController.getErrorLogStats);
router.put('/error-logs/:id/resolve', authenticate, authorize(['admin']), LogController.markErrorResolved);
router.post('/error-logs/batch-delete', authenticate, authorize(['admin']), LogController.deleteErrorLogs);
router.post('/error-logs/cleanup', authenticate, authorize(['admin']), LogController.cleanupErrorLogs);

// 登录日志管理 - 需要管理员权限
router.get('/login-logs', authenticate, authorize(['admin']), validatePagination, LoginLogController.getLoginLogs);
router.get('/login-logs/stats', authenticate, authorize(['admin']), LoginLogController.getLoginStats);
router.get('/login-logs/user/:userId', authenticate, authorize(['admin']), LoginLogController.getUserLoginHistory);
router.post('/login-logs/batch-delete', authenticate, authorize(['admin']), LoginLogController.deleteLoginLogs);
router.post('/login-logs/cleanup', authenticate, authorize(['admin']), LoginLogController.cleanupLoginLogs);

export const logRoutes = router;
export default router;
