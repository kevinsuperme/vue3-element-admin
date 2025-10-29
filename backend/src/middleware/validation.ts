import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../types';

// 验证错误处理中间件
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      message: '验证失败',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : error.type,
        message: error.msg,
        value: 'value' in error ? (error as any).value : undefined,
      })),
      timestamp: new Date(),
    };
    
    res.status(400).json(response);
    return;
  }
  
  next();
};

export default handleValidationErrors;