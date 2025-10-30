import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = Router();

// 用户认证相关路由
router.post('/login', AuthController.login);
router.post('/logout', auth, AuthController.logout);
router.get('/info', auth, AuthController.getCurrentUser);
router.put('/profile', auth, AuthController.updateCurrentUser);
router.post('/change-password', auth, AuthController.changePassword);
router.post('/refresh-token', AuthController.refreshToken);

export { router as userRoutes };
