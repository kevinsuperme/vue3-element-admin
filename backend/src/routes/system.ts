import { Router } from 'express';
import SystemController from '../controllers/systemController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/info', SystemController.getSystemInfo);
router.get('/health', SystemController.healthCheck);
router.get('/routes', SystemController.getRoutesInfo);

router.get('/env', authenticate, authorize(['admin']), SystemController.getEnvInfo);
router.get('/config', authenticate, authorize(['admin']), SystemController.getAppConfig);
router.get('/stats', authenticate, authorize(['admin']), SystemController.getStatistics);
router.post('/restart', authenticate, authorize(['admin']), SystemController.restartApplication);

export const systemRoutes = router;
export default router;
