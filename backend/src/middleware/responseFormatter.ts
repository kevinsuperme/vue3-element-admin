import { Request, Response, NextFunction } from 'express';

export interface ApiResponse {
  code: number;
  message: string;
  data?: any;
  timestamp: Date;
  path?: string;
  method?: string;
}

export interface PaginatedResponse extends ApiResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * 响应格式化中间件
 * 将后端的响应格式转换为前端期望的格式
 * 前端期望格式: {code: 20000, message: '', data: {}}
 */
export const responseFormatter = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 保存原始的json方法
    const originalJson = res.json;

    // 重写json方法
    res.json = function(body: any): Response {
      let formattedResponse: ApiResponse;

      // 如果已经是标准格式，直接使用
      if (body && typeof body === 'object' && 'code' in body) {
        formattedResponse = body;
      } else {
        // 转换格式
        const code = body?.success === false ? 50000 : 20000;
        formattedResponse = {
          code,
          message: body?.message || (code === 20000 ? '操作成功' : '操作失败'),
          data: body?.data !== undefined ? body.data : body,
          timestamp: new Date(),
          path: req.path,
          method: req.method
        };
      }

      // 设置响应头
      res.setHeader('Content-Type', 'application/json; charset=utf-8');

      // 调用原始的json方法
      return originalJson.call(this, formattedResponse);
    };

    next();
  };
};

/**
 * 错误响应格式化
 */
export const formatErrorResponse = (message: string, code: number = 50000, data?: any): ApiResponse => {
  return {
    code,
    message,
    data,
    timestamp: new Date()
  };
};

/**
 * 成功响应格式化
 */
export const formatSuccessResponse = (message: string = '操作成功', data?: any): ApiResponse => {
  return {
    code: 20000,
    message,
    data,
    timestamp: new Date()
  };
};

/**
 * 分页响应格式化
 */
export const formatPaginatedResponse = (
  data: any[],
  page: number,
  limit: number,
  total: number,
  message: string = '获取列表成功'
): PaginatedResponse => {
  return {
    code: 20000,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    timestamp: new Date()
  };
};
