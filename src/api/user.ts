import request from '@/utils/request';

// 用户登录
export function login(data: any) {
  return request({
    url: '/api/auth/login',
    method: 'post',
    data
  });
}

// 获取用户信息
export function getInfo(token: string) {
  return request({
    url: '/api/auth/profile',
    method: 'get',
    params: { token }
  });
}

// 用户登出
export function logout() {
  return request({
    url: '/api/auth/logout',
    method: 'post'
  });
}

// 用户注册
export function register(data: any) {
  return request({
    url: '/api/auth/register',
    method: 'post',
    data
  });
}

// 刷新令牌
export function refreshToken(data: any) {
  return request({
    url: '/api/auth/refresh-token',
    method: 'post',
    data
  });
}

// 修改密码
export function changePassword(data: any) {
  return request({
    url: '/api/auth/change-password',
    method: 'put',
    data
  });
}

// 更新用户信息
export function updateUser(data: any) {
  return request({
    url: '/api/auth/profile',
    method: 'put',
    data
  });
}