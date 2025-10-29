import { Router } from 'express';
import { AuthController, UserController } from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';
import { 
  validateRegister, 
  validateLogin, 
  validateChangePassword, 
  validateUpdateUser, 
  validatePagination,
  validateObjectId 
} from '../validators';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

// 公开路由 - 认证相关
router.post('/register', validateRegister, AuthController.register);
router.post('/login', validateLogin, AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);

// 需要认证的路由
router.get('/profile', authenticate, AuthController.getCurrentUser);
router.put('/profile', authenticate, validateUpdateUser, AuthController.updateCurrentUser);
router.put('/change-password', authenticate, validateChangePassword, AuthController.changePassword);
router.post('/logout', authenticate, AuthController.logout);

// 用户管理路由 - 需要管理员权限
router.get('/users', authenticate, authorize(['admin']), validatePagination, UserController.getUsers);
router.get('/users/:id', authenticate, authorize(['admin']), validateObjectId, UserController.getUserById);
router.post('/users', authenticate, authorize(['admin']), validateRegister, UserController.createUser);
router.put('/users/:id', authenticate, authorize(['admin']), validateObjectId, validateUpdateUser, UserController.updateUser);
router.delete('/users/:id', authenticate, authorize(['admin']), validateObjectId, UserController.deleteUser);
router.put('/users/:id/reset-password', authenticate, authorize(['admin']), validateObjectId, UserController.resetPassword);

export default router;