import { Router } from 'express';
import { AuthController, UserController } from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';
import {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateUpdateUser,
  validatePagination,
  validateObjectId,
  handleValidationErrors
} from '../validators';

const router = Router();

// 公开路由 - 认证相关
router.post('/register', validateRegister, handleValidationErrors, AuthController.register);
router.post('/login', validateLogin, handleValidationErrors, AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);

// 需要认证的路由
router.get('/profile', authenticate, AuthController.getCurrentUser);
router.put('/profile', authenticate, validateUpdateUser, handleValidationErrors, AuthController.updateCurrentUser);
router.put('/change-password', authenticate, validateChangePassword, handleValidationErrors, AuthController.changePassword);
router.post('/logout', authenticate, AuthController.logout);

// 用户管理路由 - 需要管理员权限
router.get('/users', authenticate, authorize(['admin']), validatePagination, handleValidationErrors, UserController.getUsers);
router.get('/users/:id', authenticate, authorize(['admin']), validateObjectId, handleValidationErrors, UserController.getUserById);
router.post('/users', authenticate, authorize(['admin']), validateRegister, handleValidationErrors, UserController.createUser);
router.put('/users/:id', authenticate, authorize(['admin']), validateObjectId, validateUpdateUser, handleValidationErrors, UserController.updateUser);
router.delete('/users/:id', authenticate, authorize(['admin']), validateObjectId, handleValidationErrors, UserController.deleteUser);
router.put('/users/:id/reset-password', authenticate, authorize(['admin']), validateObjectId, handleValidationErrors, UserController.resetPassword);

export default router;
