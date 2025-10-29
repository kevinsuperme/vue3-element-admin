import { Router } from 'express';
import { body, param, query } from 'express-validator';
import fileController from '../controllers/fileController';
import validateRequest from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

// 文件上传路由 - 使用限流器
router.post('/upload/single', authenticate, uploadLimiter, fileController.uploadSingle);
router.post('/upload/multiple', authenticate, uploadLimiter, fileController.uploadMultiple);

// 文件管理路由
router.get('/list', authenticate, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页条数必须是1-100的整数'),
], validateRequest, fileController.getFiles);

router.get('/download/:filename', authenticate, [
  param('filename').notEmpty().withMessage('文件名不能为空'),
], validateRequest, fileController.downloadFile);

router.delete('/delete/:filename', authenticate, [
  param('filename').notEmpty().withMessage('文件名不能为空'),
], validateRequest, fileController.deleteFile);

router.post('/delete/batch', authenticate, [
  body('filenames').isArray({ min: 1 }).withMessage('文件名列表不能为空数组'),
  body('filenames.*').isString().withMessage('文件名必须是字符串'),
], validateRequest, fileController.deleteFiles);

router.get('/stats', authenticate, fileController.getFileStats);

export default router;