import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

// 用户验证规则
export const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度必须在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('密码长度不能少于8个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('密码必须包含大小写字母、数字和特殊字符'),
  body('roles')
    .optional()
    .isArray()
    .withMessage('角色必须是数组')
    .custom((roles) => roles.every((role: string) => typeof role === 'string'))
    .withMessage('角色数组中的每个元素必须是字符串')
];

export const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('用户名不能为空'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
];

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('当前密码不能为空'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('新密码长度不能少于8个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('新密码必须包含大小写字母、数字和特殊字符')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('新密码不能与当前密码相同')
];

// 用户更新验证规则
export const validateUpdateUser = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度必须在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('头像URL格式不正确'),
  body('roles')
    .optional()
    .isArray()
    .withMessage('角色必须是数组')
    .custom((roles) => roles.every((role: string) => typeof role === 'string'))
    .withMessage('角色数组中的每个元素必须是字符串'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('激活状态必须是布尔值')
];

// 分页验证规则
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页条数必须是1-100之间的整数')
    .toInt(),
  query('sort')
    .optional()
    .isString()
    .withMessage('排序字段必须是字符串'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序顺序必须是asc或desc'),
  query('search')
    .optional()
    .isString()
    .withMessage('搜索关键词必须是字符串')
];

// ID参数验证规则
export const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('无效的ID格式')
];

// 角色验证规则
export const validateRole = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('角色名称长度不能超过50个字符'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('角色描述长度不能超过200个字符'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('权限必须是数组')
    .custom((permissions) => permissions.every((perm: string) => typeof perm === 'string'))
    .withMessage('权限数组中的每个元素必须是字符串'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('激活状态必须是布尔值')
];

// 错误日志验证规则
export const validateErrorLog = [
  body('message')
    .trim()
    .isLength({ min: 1 })
    .withMessage('错误信息不能为空'),
  body('stack')
    .optional()
    .isString()
    .withMessage('错误堆栈必须是字符串'),
  body('url')
    .trim()
    .isURL()
    .withMessage('错误URL格式不正确'),
  body('method')
    .trim()
    .isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'])
    .withMessage('请求方法必须是标准HTTP方法之一')
    .toUpperCase(),
  body('userAgent')
    .optional()
    .isString()
    .withMessage('用户代理必须是字符串'),
  body('ip')
    .optional()
    .isIP()
    .withMessage('IP地址格式不正确')
];

// 文件上传验证规则
export const validateFileUpload = [
  body('description')
    .optional()
    .isString()
    .withMessage('文件描述必须是字符串')
    .isLength({ max: 500 })
    .withMessage('文件描述长度不能超过500个字符')
];

// 验证结果处理中间件
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      message: '输入验证失败',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined
      })),
      timestamp: new Date(),
      code: 'VALIDATION_ERROR'
    };
    return res.status(400).json(response);
  }
  next();
};

export default {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateUpdateUser,
  validatePagination,
  validateObjectId,
  validateRole,
  validateErrorLog,
  validateFileUpload,
  handleValidationErrors
};
