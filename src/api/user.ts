import request from '@/utils/request';
import type {
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  UpdateUserRequest,
  RefreshTokenRequest,
  UserInfo,
  LoginResponse,
  TokenResponse,
  ApiResponse
} from '@/types/auth';

/**
 * 用户认证相关API
 */

// 用户登录
export function login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  return request({
    url: '/api/auth/login',
    method: 'post',
    data
  });
}

// 获取用户信息
export function getInfo(token?: string): Promise<ApiResponse<UserInfo>> {
  return request({
    url: '/api/auth/profile',
    method: 'get',
    params: token ? { token } : undefined
  });
}

// 用户登出
export function logout(): Promise<ApiResponse<null>> {
  return request({
    url: '/api/auth/logout',
    method: 'post'
  });
}

// 用户注册
export function register(data: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
  return request({
    url: '/api/auth/register',
    method: 'post',
    data
  });
}

// 刷新令牌
export function refreshToken(data: RefreshTokenRequest): Promise<ApiResponse<TokenResponse>> {
  return request({
    url: '/api/auth/refresh-token',
    method: 'post',
    data
  });
}

// 修改密码
export function changePassword(data: ChangePasswordRequest): Promise<ApiResponse<null>> {
  return request({
    url: '/api/auth/change-password',
    method: 'put',
    data
  });
}

// 更新用户信息
export function updateUser(data: UpdateUserRequest): Promise<ApiResponse<UserInfo>> {
  return request({
    url: '/api/auth/profile',
    method: 'put',
    data
  });
}
