import { Router } from 'express';
import { RoleController } from '../controllers/roleController';
import { authenticate } from '../middleware/auth';
const auth = authenticate;

const router = Router();

// 获取角色列表
router.get('/', auth, RoleController.getRoles);

// 获取角色详情
router.get('/:id', auth, RoleController.getRole);

// 创建角色
router.post('/', auth, RoleController.createRole);

// 更新角色
router.put('/:id', auth, RoleController.updateRole);

// 删除角色
router.delete('/:id', auth, RoleController.deleteRole);

// 获取系统路由/权限
router.get('/routes/list', auth, RoleController.getRoutes);

export { router as roleRoutes };
