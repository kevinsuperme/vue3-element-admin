import { Request, Response, NextFunction } from 'express';

/**
 * 异步处理器中间件，用于捕获异步函数中的错误
 * @param fn - 异步处理函数
 * @returns 包装后的中间件函数
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next?: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
