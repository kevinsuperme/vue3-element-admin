/**
 * 认证相关类型定义
 */

export interface LoginRequest {
  username: string;
  password: string;
  captcha?: string;
  remember?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  phone?: string;
  realName?: string;
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
  phone?: string;
  realName?: string;
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  avatar?: string;
  phone?: string;
  realName?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface LoginResponse {
  user: UserInfo;
  tokens: TokenResponse;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  code?: number;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  timestamp: string;
  code?: number;
}
