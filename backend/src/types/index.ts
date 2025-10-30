export interface User {
  _id?: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  roles: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Role {
  _id?: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Permission {
  _id?: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ErrorLog {
  _id?: string;
  userId?: string;
  message: string;
  stack?: string;
  url: string;
  method: string;
  userAgent?: string;
  ip?: string;
  timestamp: Date;
  resolved: boolean;
}

export interface LoginLog {
  _id?: string;
  userId: string;
  ip: string;
  userAgent: string;
  success: boolean;
  message?: string;
  timestamp: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Array<{
    field: string;
    message: string;
    value?: unknown;
  }>;
  timestamp: Date;
  code?: string; // 错误代码
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface JWTPayload {
  userId: string;
  username: string;
  roles: string[];
  fingerprint?: string; // 令牌指纹
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  roles?: string[];
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  avatar?: string;
  roles?: string[];
  isActive?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}

export interface FileInfo {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
  uploadedAt: Date;
  uploadedBy?: string;
  hash?: string; // 文件哈希值，用于完整性验证
}
