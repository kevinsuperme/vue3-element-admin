/**
 * @description: auth 工具函数单元测试
 * @author: Kevin Wan
 * @date: 2025-10-30
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as auth from '@/utils/auth';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock js-cookie
const cookieMock = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn()
};

vi.mock('js-cookie', () => cookieMock);

describe('Auth Utils - 认证工具函数测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    cookieMock.get.mockClear();
    cookieMock.set.mockClear();
    cookieMock.remove.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token Management', () => {
    it('应该从localStorage获取token', () => {
      const token = 'test-token-123';
      localStorageMock.getItem.mockReturnValue(token);

      const result = auth.getToken();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('vue3-element-admin-token');
      expect(result).toBe(token);
    });

    it('应该设置token到localStorage', () => {
      const token = 'new-token-456';
      localStorageMock.setItem.mockImplementation(() => {});

      auth.setToken(token);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('vue3-element-admin-token', token);
    });

    it('应该从localStorage移除token', () => {
      localStorageMock.removeItem.mockImplementation(() => {});

      auth.removeToken();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('vue3-element-admin-token');
    });

    it('当token不存在时应该返回null', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = auth.getToken();

      expect(result).toBeNull();
    });
  });

  describe('Cookie Token Management', () => {
    it('应该从cookie获取token', () => {
      const token = 'cookie-token-789';
      cookieMock.get.mockReturnValue(token);

      const result = auth.getTokenFromCookie();

      expect(cookieMock.get).toHaveBeenCalledWith('vue3-element-admin-token');
      expect(result).toBe(token);
    });

    it('应该设置token到cookie', () => {
      const token = 'new-cookie-token';
      cookieMock.set.mockImplementation(() => {});

      auth.setTokenToCookie(token);

      expect(cookieMock.set).toHaveBeenCalledWith('vue3-element-admin-token', token, expect.any(Object));
    });

    it('应该从cookie移除token', () => {
      cookieMock.remove.mockImplementation(() => {});

      auth.removeTokenFromCookie();

      expect(cookieMock.remove).toHaveBeenCalledWith('vue3-element-admin-token');
    });
  });

  describe('Authentication Status', () => {
    it('应该判断用户是否已登录', () => {
      localStorageMock.getItem.mockReturnValue('valid-token');

      const result = auth.isAuthenticated();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('vue3-element-admin-token');
      expect(result).toBe(true);
    });

    it('当没有token时应该返回false', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = auth.isAuthenticated();

      expect(result).toBe(false);
    });

    it('当token为空字符串时应该返回false', () => {
      localStorageMock.getItem.mockReturnValue('');

      const result = auth.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('User Info Management', () => {
    const mockUserInfo = {
      id: 1,
      name: 'Admin User',
      email: 'admin@example.com',
      roles: ['admin'],
      avatar: 'avatar.jpg'
    };

    it('应该保存用户信息到localStorage', () => {
      localStorageMock.setItem.mockImplementation(() => {});

      auth.setUserInfo(mockUserInfo);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'vue3-element-admin-user',
        JSON.stringify(mockUserInfo)
      );
    });

    it('应该从localStorage获取用户信息', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUserInfo));

      const result = auth.getUserInfo();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('vue3-element-admin-user');
      expect(result).toEqual(mockUserInfo);
    });

    it('应该移除用户信息', () => {
      localStorageMock.removeItem.mockImplementation(() => {});

      auth.removeUserInfo();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('vue3-element-admin-user');
    });

    it('当用户信息不存在时应该返回null', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = auth.getUserInfo();

      expect(result).toBeNull();
    });

    it('应该处理无效的JSON数据', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const result = auth.getUserInfo();

      expect(result).toBeNull();
    });
  });

  describe('Role Management', () => {
    const mockUserInfo = {
      id: 1,
      name: 'Admin User',
      roles: ['admin', 'editor'],
      permissions: ['read', 'write', 'delete']
    };

    it('应该检查用户是否有指定角色', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUserInfo));

      const { hasRole } = auth;

      expect(hasRole('admin')).toBe(true);
      expect(hasRole('editor')).toBe(true);
      expect(hasRole('user')).toBe(false);
    });

    it('应该检查用户是否有指定权限', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUserInfo));

      const { hasPermission } = auth;

      expect(hasPermission('read')).toBe(true);
      expect(hasPermission('write')).toBe(true);
      expect(hasPermission('delete')).toBe(true);
      expect(hasPermission('admin')).toBe(false);
    });

    it('当用户信息不存在时应该返回false', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { hasRole, hasPermission } = auth;

      expect(hasRole('admin')).toBe(false);
      expect(hasPermission('read')).toBe(false);
    });

    it('应该检查用户是否有任意指定角色', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUserInfo));

      const { hasAnyRole } = auth;

      expect(hasAnyRole(['admin', 'superuser'])).toBe(true);
      expect(hasAnyRole(['editor', 'moderator'])).toBe(true);
      expect(hasAnyRole(['user', 'guest'])).toBe(false);
    });

    it('应该检查用户是否有所有指定角色', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUserInfo));

      const { hasAllRoles } = auth;

      expect(hasAllRoles(['admin', 'editor'])).toBe(true);
      expect(hasAllRoles(['admin', 'user'])).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('应该设置会话过期时间', () => {
      const expiresAt = new Date().getTime() + 3600000; // 1小时后过期
      localStorageMock.setItem.mockImplementation(() => {});

      auth.setSessionExpires(expiresAt);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'vue3-element-admin-expires',
        expiresAt.toString()
      );
    });

    it('应该检查会话是否过期', () => {
      const pastTime = new Date().getTime() - 1000; // 1秒前已过期
      localStorageMock.getItem.mockReturnValue(pastTime.toString());

      const result = auth.isSessionExpired();

      expect(result).toBe(true);
    });

    it('当会话未过期时应该返回false', () => {
      const futureTime = new Date().getTime() + 3600000; // 1小时后过期
      localStorageMock.getItem.mockReturnValue(futureTime.toString());

      const result = auth.isSessionExpired();

      expect(result).toBe(false);
    });

    it('当没有过期时间设置时应该返回false', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = auth.isSessionExpired();

      expect(result).toBe(false);
    });
  });

  describe('Authentication Utilities', () => {
    it('应该清除所有认证信息', () => {
      localStorageMock.removeItem.mockImplementation(() => {});
      cookieMock.remove.mockImplementation(() => {});

      auth.clearAuth();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('vue3-element-admin-token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('vue3-element-admin-user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('vue3-element-admin-expires');
      expect(cookieMock.remove).toHaveBeenCalledWith('vue3-element-admin-token');
    });

    it('应该刷新认证信息', () => {
      const newToken = 'refreshed-token';
      const newUserInfo = { id: 1, name: 'Refreshed User' };

      localStorageMock.setItem.mockImplementation(() => {});
      localStorageMock.getItem.mockReturnValue(newToken);

      auth.refreshAuth(newToken, newUserInfo);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('vue3-element-admin-token', newToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'vue3-element-admin-user',
        JSON.stringify(newUserInfo)
      );
    });
  });
});
