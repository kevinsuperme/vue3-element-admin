/**
 * @description: user store 单元测试
 * @author: Kevin Wan
 * @date: 2025-10-30
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import userStore from '@/store/modules/user';

describe('User Store - 用户状态管理测试', () => {
  let store: any;
  let pinia: any;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = userStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      expect(store.token).toBe('');
      expect(store.name).toBe('');
      expect(store.avatar).toBe('');
      expect(store.roles).toEqual([]);
      expect(store.permissions).toEqual([]);
      expect(store.userInfo).toBeNull();
      expect(store.loginLoading).toBe(false);
    });

    it('应该有正确的store ID', () => {
      expect(store.$id).toBe('user');
    });
  });

  describe('Getters', () => {
    beforeEach(() => {
      store.token = 'test-token';
      store.name = 'Test User';
      store.avatar = 'avatar.jpg';
      store.roles = ['admin', 'editor'];
      store.permissions = ['user:read', 'user:write'];
      store.userInfo = {
        id: 1,
        email: 'test@example.com',
        department: 'IT'
      };
    });

    it('isLoggedIn应该正确返回登录状态', () => {
      expect(store.isLoggedIn).toBe(true);

      store.token = '';
      expect(store.isLoggedIn).toBe(false);
    });

    it('isAdmin应该正确判断是否为管理员', () => {
      expect(store.isAdmin).toBe(true);

      store.roles = ['editor'];
      expect(store.isAdmin).toBe(false);

      store.roles = [];
      expect(store.isAdmin).toBe(false);
    });

    it('userDisplayName应该返回显示名称', () => {
      expect(store.userDisplayName).toBe('Test User');

      store.name = '';
      expect(store.userDisplayName).toBe('用户');

      store.userInfo = { id: 1, nickname: 'Nickname' };
      expect(store.userDisplayName).toBe('Nickname');
    });

    it('hasPermission应该正确检查权限', () => {
      expect(store.hasPermission('user:read')).toBe(true);
      expect(store.hasPermission('user:write')).toBe(true);
      expect(store.hasPermission('user:delete')).toBe(false);
      expect(store.hasPermission('')).toBe(false);
    });

    it('hasRole应该正确检查角色', () => {
      expect(store.hasRole('admin')).toBe(true);
      expect(store.hasRole('editor')).toBe(true);
      expect(store.hasRole('user')).toBe(false);
      expect(store.hasRole('')).toBe(false);
    });
  });

  describe('Actions - 登录', () => {
    beforeEach(() => {
      // Mock API calls
      vi.mock('@/api/user', () => ({
        login: vi.fn(),
        getInfo: vi.fn()
      }));
    });

    it('应该成功登录', async () => {
      const mockLoginData = {
        username: 'admin',
        password: '123456'
      };

      const mockLoginResponse = {
        code: 20000,
        data: {
          token: 'test-token-123'
        }
      };

      const mockUserInfo = {
        code: 20000,
        data: {
          name: 'Admin User',
          avatar: 'admin-avatar.jpg',
          roles: ['admin'],
          permissions: ['user:read', 'user:write']
        }
      };

      const { login, getInfo } = await import('@/api/user');
      vi.mocked(login).mockResolvedValue(mockLoginResponse);
      vi.mocked(getInfo).mockResolvedValue(mockUserInfo);

      await store.login(mockLoginData);

      expect(login).toHaveBeenCalledWith(mockLoginData);
      expect(getInfo).toHaveBeenCalledWith('test-token-123');
      expect(store.token).toBe('test-token-123');
      expect(store.name).toBe('Admin User');
      expect(store.avatar).toBe('admin-avatar.jpg');
      expect(store.roles).toEqual(['admin']);
      expect(store.permissions).toEqual(['user:read', 'user:write']);
      expect(store.loginLoading).toBe(false);
    });

    it('应该处理登录失败', async () => {
      const mockLoginData = {
        username: 'wrong',
        password: 'wrong'
      };

      const { login } = await import('@/api/user');
      vi.mocked(login).mockRejectedValue(new Error('登录失败'));

      await expect(store.login(mockLoginData)).rejects.toThrow('登录失败');
      expect(store.token).toBe('');
      expect(store.loginLoading).toBe(false);
    });

    it('应该处理获取用户信息失败', async () => {
      const mockLoginData = {
        username: 'admin',
        password: '123456'
      };

      const mockLoginResponse = {
        code: 20000,
        data: {
          token: 'test-token-123'
        }
      };

      const { login, getInfo } = await import('@/api/user');
      vi.mocked(login).mockResolvedValue(mockLoginResponse);
      vi.mocked(getInfo).mockRejectedValue(new Error('获取用户信息失败'));

      await expect(store.login(mockLoginData)).rejects.toThrow('获取用户信息失败');
      expect(store.token).toBe('');
    });

    it('应该设置加载状态', async () => {
      const mockLoginData = { username: 'admin', password: '123456' };

      const { login } = await import('@/api/user');
      vi.mocked(login).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const loginPromise = store.login(mockLoginData);
      expect(store.loginLoading).toBe(true);

      await loginPromise;
      expect(store.loginLoading).toBe(false);
    });
  });

  describe('Actions - 登出', () => {
    beforeEach(() => {
      // 设置登录状态
      store.token = 'test-token';
      store.name = 'Test User';
      store.roles = ['admin'];
      store.permissions = ['user:read'];

      // Mock API calls
      vi.mock('@/api/user', () => ({
        logout: vi.fn()
      }));
    });

    it('应该成功登出', async () => {
      const { logout } = await import('@/api/user');
      vi.mocked(logout).mockResolvedValue({ code: 20000 });

      await store.logout();

      expect(logout).toHaveBeenCalled();
      expect(store.token).toBe('');
      expect(store.name).toBe('');
      expect(store.roles).toEqual([]);
      expect(store.permissions).toEqual([]);
    });

    it('应该处理登出失败', async () => {
      const { logout } = await import('@/api/user');
      vi.mocked(logout).mockRejectedValue(new Error('登出失败'));

      // 即使登出API失败，也应该清除本地状态
      await store.logout();

      expect(store.token).toBe('');
      expect(store.name).toBe('');
      expect(store.roles).toEqual([]);
    });
  });

  describe('Actions - 获取用户信息', () => {
    beforeEach(() => {
      store.token = 'test-token';
    });

    it('应该成功获取用户信息', async () => {
      const mockUserInfo = {
        code: 20000,
        data: {
          name: 'Test User',
          avatar: 'test-avatar.jpg',
          roles: ['editor'],
          permissions: ['post:read', 'post:write']
        }
      };

      const { getInfo } = await import('@/api/user');
      vi.mocked(getInfo).mockResolvedValue(mockUserInfo);

      await store.getUserInfo();

      expect(getInfo).toHaveBeenCalledWith('test-token');
      expect(store.name).toBe('Test User');
      expect(store.avatar).toBe('test-avatar.jpg');
      expect(store.roles).toEqual(['editor']);
      expect(store.permissions).toEqual(['post:read', 'post:write']);
    });

    it('应该处理获取用户信息失败', async () => {
      const { getInfo } = await import('@/api/user');
      vi.mocked(getInfo).mockRejectedValue(new Error('获取用户信息失败'));

      await expect(store.getUserInfo()).rejects.toThrow('获取用户信息失败');
    });

    it('应该在没有token时不请求用户信息', async () => {
      store.token = '';

      const { getInfo } = await import('@/api/user');
      vi.mocked(getInfo).mockResolvedValue({ data: {}});

      await store.getUserInfo();

      expect(getInfo).not.toHaveBeenCalled();
    });
  });

  describe('Actions - 重置密码', () => {
    it('应该成功重置密码', async () => {
      const resetData = {
        email: 'test@example.com',
        password: 'newpassword',
        code: '123456'
      };

      const mockResponse = { code: 20000, message: '密码重置成功' };

      // Mock API call
      vi.mock('@/api/user', () => ({
        resetPassword: vi.fn().mockResolvedValue(mockResponse)
      }));

      const { resetPassword } = await import('@/api/user');
      vi.mocked(resetPassword).mockResolvedValue(mockResponse);

      const result = await store.resetPassword(resetData);

      expect(resetPassword).toHaveBeenCalledWith(resetData);
      expect(result).toEqual(mockResponse);
    });

    it('应该处理重置密码失败', async () => {
      const resetData = {
        email: 'test@example.com',
        password: 'newpassword',
        code: 'wrong'
      };

      const { resetPassword } = await import('@/api/user');
      vi.mocked(resetPassword).mockRejectedValue(new Error('重置密码失败'));

      await expect(store.resetPassword(resetData)).rejects.toThrow('重置密码失败');
    });
  });

  describe('Actions - 更新用户信息', () => {
    beforeEach(() => {
      store.userInfo = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      };
    });

    it('应该成功更新用户信息', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const mockResponse = {
        code: 20000,
        data: {
          ...store.userInfo,
          ...updateData
        }
      };

      // Mock API call
      vi.mock('@/api/user', () => ({
        updateUserInfo: vi.fn().mockResolvedValue(mockResponse)
      }));

      const { updateUserInfo } = await import('@/api/user');
      vi.mocked(updateUserInfo).mockResolvedValue(mockResponse);

      await store.updateUserInfo(updateData);

      expect(updateUserInfo).toHaveBeenCalledWith(updateData);
      expect(store.userInfo).toEqual(mockResponse.data);
      expect(store.name).toBe('Updated Name');
    });

    it('应该处理更新用户信息失败', async () => {
      const updateData = { name: 'Updated Name' };

      const { updateUserInfo } = await import('@/api/user');
      vi.mocked(updateUserInfo).mockRejectedValue(new Error('更新用户信息失败'));

      await expect(store.updateUserInfo(updateData)).rejects.toThrow('更新用户信息失败');
    });
  });

  describe('Actions - 令牌刷新', () => {
    beforeEach(() => {
      store.token = 'old-token';
    });

    it('应该成功刷新令牌', async () => {
      const mockResponse = {
        code: 20000,
        data: {
          token: 'new-token'
        }
      };

      // Mock API call
      vi.mock('@/api/user', () => ({
        refreshToken: vi.fn().mockResolvedValue(mockResponse)
      }));

      const { refreshToken } = await import('@/api/user');
      vi.mocked(refreshToken).mockResolvedValue(mockResponse);

      await store.refreshToken();

      expect(refreshToken).toHaveBeenCalled();
      expect(store.token).toBe('new-token');
    });

    it('应该处理令牌刷新失败', async () => {
      const { refreshToken } = await import('@/api/user');
      vi.mocked(refreshToken).mockRejectedValue(new Error('令牌刷新失败'));

      await expect(store.refreshToken()).rejects.toThrow('令牌刷新失败');
      expect(store.token).toBe('old-token'); // 失败时不更新token
    });
  });

  describe('Actions - 权限检查', () => {
    beforeEach(() => {
      store.roles = ['admin'];
      store.permissions = ['user:read', 'user:write', 'post:create'];
    });

    it('应该正确检查角色权限', () => {
      expect(store.checkRole('admin')).toBe(true);
      expect(store.checkRole('editor')).toBe(false);
    });

    it('应该正确检查操作权限', () => {
      expect(store.checkPermission('user:read')).toBe(true);
      expect(store.checkPermission('user:write')).toBe(true);
      expect(store.checkPermission('user:delete')).toBe(false);
    });

    it('应该支持通配符权限检查', async () => {
      store.permissions = ['user:*'];

      expect(store.checkPermission('user:read')).toBe(true);
      expect(store.checkPermission('user:write')).toBe(true);
      expect(store.checkPermission('user:delete')).toBe(true);
      expect(store.checkPermission('post:create')).toBe(false);
    });
  });

  describe('状态持久化', () => {
    it('应该将状态保存到localStorage', () => {
      const mockSetItem = vi.fn();
      Object.defineProperty(localStorage, 'setItem', { value: mockSetItem });

      store.token = 'test-token';
      store.name = 'Test User';

      // 模拟保存状态
      store.$persist();

      expect(mockSetItem).toHaveBeenCalled();
    });

    it('应该从localStorage恢复状态', () => {
      const mockGetItem = vi.fn().mockReturnValue(JSON.stringify({
        token: 'saved-token',
        name: 'Saved User',
        roles: ['editor']
      }));

      Object.defineProperty(localStorage, 'getItem', { value: mockGetItem });

      // 模拟恢复状态
      store.$hydrate();

      expect(mockGetItem).toHaveBeenCalled();
      expect(store.token).toBe('saved-token');
      expect(store.name).toBe('Saved User');
      expect(store.roles).toEqual(['editor']);
    });

    it('应该处理localStorage损坏的数据', () => {
      const mockGetItem = vi.fn().mockReturnValue('invalid-json');

      Object.defineProperty(localStorage, 'getItem', { value: mockGetItem });

      // 模拟恢复状态
      store.$hydrate();

      expect(store.token).toBe('');
      expect(store.name).toBe('');
      expect(store.roles).toEqual([]);
    });
  });

  describe('错误处理和边界情况', () => {
    it('应该处理空的登录数据', async () => {
      const { login } = await import('@/api/user');
      vi.mocked(login).mockRejectedValue(new Error('登录数据不能为空'));

      await expect(store.login({} as any)).rejects.toThrow();
    });

    it('应该处理无效的用户信息数据', async () => {
      const mockInvalidResponse = {
        code: 20000,
        data: null
      };

      const { getInfo } = await import('@/api/user');
      vi.mocked(getInfo).mockResolvedValue(mockInvalidResponse);

      await store.getUserInfo();

      expect(store.name).toBe('');
      expect(store.roles).toEqual([]);
    });

    it('应该处理网络错误', async () => {
      const { login } = await import('@/api/user');
      vi.mocked(login).mockRejectedValue(new Error('Network Error'));

      await expect(store.login({ username: 'test', password: 'test' }))
        .rejects.toThrow('Network Error');
    });
  });

  describe('性能测试', () => {
    it('应该快速响应状态变化', () => {
      const startTime = performance.now();

      store.token = 'new-token';
      store.name = 'New User';
      store.roles = ['admin', 'editor'];

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10); // 状态更新应该在10ms内完成
    });

    it('应该快速响应getter计算', () => {
      store.token = 'test-token';
      store.roles = ['admin'];

      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        store.isLoggedIn;
        store.isAdmin;
        store.hasRole('admin');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50); // 1000次getter调用应该在50ms内完成
    });
  });
});
