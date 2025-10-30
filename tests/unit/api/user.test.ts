/**
 * 用户API模块单元测试
 * @description: 测试用户认证相关API接口
 * @author: Kevin Wan
 * @date: 2025-10-30
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, getInfo, logout, register, refreshToken, changePassword, updateUser } from '@/api/user';
import type { LoginRequest, RegisterRequest, ChangePasswordRequest, UpdateUserRequest } from '@/types/auth';

// Mock request 模块
vi.mock('@/utils/request', () => ({
  default: vi.fn()
}));

// Mock console.error 避免测试输出错误
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('User API Tests', () => {
  let mockRequest: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const requestModule = await import('@/utils/request');
    mockRequest = requestModule.default;
  });

  describe('login', () => {
    it('应该正确发送登录请求', async () => {
      const loginData: LoginRequest = {
        username: 'testuser',
        password: 'password123'
      };

      const mockResponse = {
        success: true,
        message: '登录成功',
        data: {
          user: {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            roles: ['user']
          },
          tokens: {
            accessToken: 'mock_access_token',
            refreshToken: 'mock_refresh_token',
            expiresIn: 604800,
            tokenType: 'Bearer'
          }
        },
        timestamp: new Date().toISOString()
      };

      mockRequest.mockResolvedValue(mockResponse);

      const result = await login(loginData);

      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/auth/login',
        method: 'post',
        data: loginData
      });

      expect(result).toEqual(mockResponse);
    });

    it('应该处理登录失败的情况', async () => {
      const loginData: LoginRequest = {
        username: 'wronguser',
        password: 'wrongpassword'
      };

      const mockError = {
        success: false,
        message: '用户名或密码错误',
        error: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      };

      mockRequest.mockResolvedValue(mockError);

      const result = await login(loginData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('用户名或密码错误');
    });

    it('应该处理网络错误', async () => {
      const loginData: LoginRequest = {
        username: 'testuser',
        password: 'password123'
      };

      mockRequest.mockRejectedValue(new Error('Network Error'));

      await expect(login(loginData)).rejects.toThrow('Network Error');
    });
  });

  describe('getInfo', () => {
    it('应该正确获取用户信息', async () => {
      const mockUserInfo = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['read'],
        avatar: 'avatar.jpg',
        status: 'active' as const,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      };

      const mockResponse = {
        success: true,
        message: '获取成功',
        data: mockUserInfo,
        timestamp: new Date().toISOString()
      };

      mockRequest.mockResolvedValue(mockResponse);

      const result = await getInfo('mock_token');

      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/auth/profile',
        method: 'get',
        params: { token: 'mock_token' }
      });

      expect(result.data).toEqual(mockUserInfo);
    });

    it('应该在没有token时正常调用', async () => {
      const mockResponse = {
        success: true,
        message: '获取成功',
        data: {
          id: '1',
          username: 'testuser'
        },
        timestamp: new Date().toISOString()
      };

      mockRequest.mockResolvedValue(mockResponse);

      const result = await getInfo();

      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/auth/profile',
        method: 'get',
        params: undefined
      });

      expect(result.success).toBe(true);
    });
  });

  describe('logout', () => {
    it('应该正确发送登出请求', async () => {
      const mockResponse = {
        success: true,
        message: '登出成功',
        data: null,
        timestamp: new Date().toISOString()
      };

      mockRequest.mockResolvedValue(mockResponse);

      const result = await logout();

      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/auth/logout',
        method: 'post'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('register', () => {
    it('应该正确发送注册请求', async () => {
      const registerData: RegisterRequest = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };

      const mockResponse = {
        success: true,
        message: '注册成功',
        data: {
          user: {
            id: '2',
            username: 'newuser',
            email: 'newuser@example.com',
            roles: ['user']
          },
          tokens: {
            accessToken: 'new_access_token',
            refreshToken: 'new_refresh_token',
            expiresIn: 604800,
            tokenType: 'Bearer'
          }
        },
        timestamp: new Date().toISOString()
      };

      mockRequest.mockResolvedValue(mockResponse);

      const result = await register(registerData);

      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/auth/register',
        method: 'post',
        data: registerData
      });

      expect(result.success).toBe(true);
      expect(result.data.user.username).toBe('newuser');
    });
  });

  describe('refreshToken', () => {
    it('应该正确刷新令牌', async () => {
      const refreshData = {
        refreshToken: 'mock_refresh_token'
      };

      const mockResponse = {
        success: true,
        message: '令牌刷新成功',
        data: {
          accessToken: 'new_access_token',
          refreshToken: 'new_refresh_token',
          expiresIn: 604800,
          tokenType: 'Bearer'
        },
        timestamp: new Date().toISOString()
      };

      mockRequest.mockResolvedValue(mockResponse);

      const result = await refreshToken(refreshData);

      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/auth/refresh-token',
        method: 'post',
        data: refreshData
      });

      expect(result.data.accessToken).toBe('new_access_token');
    });
  });

  describe('changePassword', () => {
    it('应该正确修改密码', async () => {
      const passwordData: ChangePasswordRequest = {
        oldPassword: 'oldpassword',
        newPassword: 'newpassword',
        confirmPassword: 'newpassword'
      };

      const mockResponse = {
        success: true,
        message: '密码修改成功',
        data: null,
        timestamp: new Date().toISOString()
      };

      mockRequest.mockResolvedValue(mockResponse);

      const result = await changePassword(passwordData);

      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/auth/change-password',
        method: 'put',
        data: passwordData
      });

      expect(result.success).toBe(true);
    });
  });

  describe('updateUser', () => {
    it('应该正确更新用户信息', async () => {
      const updateData: UpdateUserRequest = {
        email: 'updated@example.com',
        phone: '13800138000'
      };

      const mockResponse = {
        success: true,
        message: '更新成功',
        data: {
          id: '1',
          username: 'testuser',
          email: 'updated@example.com',
          phone: '13800138000',
          roles: ['user']
        },
        timestamp: new Date().toISOString()
      };

      mockRequest.mockResolvedValue(mockResponse);

      const result = await updateUser(updateData);

      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/auth/profile',
        method: 'put',
        data: updateData
      });

      expect(result.data.email).toBe('updated@example.com');
    });
  });

  describe('请求方法验证', () => {
    it('login 应该使用 POST 方法', async () => {
      mockRequest.mockResolvedValue({});
      await login({ username: 'test', password: 'test' });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'post'
        })
      );
    });

    it('getInfo 应该使用 GET 方法', async () => {
      mockRequest.mockResolvedValue({});
      await getInfo('token');

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get'
        })
      );
    });

    it('logout 应该使用 POST 方法', async () => {
      mockRequest.mockResolvedValue({});
      await logout();

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'post'
        })
      );
    });

    it('register 应该使用 POST 方法', async () => {
      mockRequest.mockResolvedValue({});
      await register({ username: 'test', email: 'test@example.com', password: 'password123', confirmPassword: 'password123' });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'post'
        })
      );
    });

    it('changePassword 应该使用 PUT 方法', async () => {
      mockRequest.mockResolvedValue({});
      await changePassword({ oldPassword: 'old', newPassword: 'new', confirmPassword: 'new' });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'put'
        })
      );
    });

    it('updateUser 应该使用 PUT 方法', async () => {
      mockRequest.mockResolvedValue({});
      await updateUser({ email: 'test@example.com' });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'put'
        })
      );
    });
  });
});
});
