import { ApiResponse as IApiResponse, PaginatedResponse as IPaginatedResponse } from '../types';

/**
 * 统一API响应格式类
 */
export class ApiResponse<T = unknown> {
  static success<T>(data: T, message: string = '操作成功'): IApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date()
    };
  }

  static error(message: string, statusCode: number = 500, error?: string): IApiResponse<null> {
    return {
      success: false,
      message,
      error: error || message,
      timestamp: new Date()
    };
  }

  static successWithPagination<T>(
    data: T,
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    },
    message: string = '获取列表成功'
  ): IPaginatedResponse<T> {
    return {
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date()
    };
  }

  static created<T>(data: T, message: string = '创建成功'): IApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date()
    };
  }

  static updated<T>(data: T, message: string = '更新成功'): IApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date()
    };
  }

  static deleted(message: string = '删除成功'): IApiResponse<null> {
    return {
      success: true,
      message,
      data: null,
      timestamp: new Date()
    };
  }

  static badRequest(message: string = '请求参数错误'): IApiResponse<null> {
    return {
      success: false,
      message,
      error: message,
      timestamp: new Date()
    };
  }

  static unauthorized(message: string = '未授权访问'): IApiResponse<null> {
    return {
      success: false,
      message,
      error: message,
      timestamp: new Date()
    };
  }

  static forbidden(message: string = '权限不足'): IApiResponse<null> {
    return {
      success: false,
      message,
      error: message,
      timestamp: new Date()
    };
  }

  static notFound(message: string = '资源不存在'): IApiResponse<null> {
    return {
      success: false,
      message,
      error: message,
      timestamp: new Date()
    };
  }

  static conflict(message: string = '资源冲突'): IApiResponse<null> {
    return {
      success: false,
      message,
      error: message,
      timestamp: new Date()
    };
  }

  static serverError(message: string = '服务器内部错误'): IApiResponse<null> {
    return {
      success: false,
      message,
      error: message,
      timestamp: new Date()
    };
  }
}

export default ApiResponse;
