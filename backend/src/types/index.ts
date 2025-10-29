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

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
  timestamp: Date;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
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
  filters?: Record<string, any>;
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
}