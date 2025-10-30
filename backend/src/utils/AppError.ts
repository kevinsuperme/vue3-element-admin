/**
 * 自定义应用错误类
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string | number;

  constructor(message: string, statusCode: number = 500, code?: string | number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    // 确保堆栈跟踪正确
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 创建验证错误
   */
  static validation(message: string): AppError {
    return new AppError(message, 400, 'VALIDATION_ERROR');
  }

  /**
   * 创建认证错误
   */
  static authentication(message: string = '认证失败'): AppError {
    return new AppError(message, 401, 'AUTHENTICATION_ERROR');
  }

  /**
   * 创建授权错误
   */
  static authorization(message: string = '权限不足'): AppError {
    return new AppError(message, 403, 'AUTHORIZATION_ERROR');
  }

  /**
   * 创建未找到错误
   */
  static notFound(message: string = '资源不存在'): AppError {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  /**
   * 创建冲突错误
   */
  static conflict(message: string = '资源冲突'): AppError {
    return new AppError(message, 409, 'CONFLICT');
  }

  /**
   * 创建服务器错误
   */
  static internal(message: string = '服务器内部错误'): AppError {
    return new AppError(message, 500, 'INTERNAL_ERROR');
  }
}

export default AppError;
