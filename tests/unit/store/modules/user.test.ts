/**
 * 用户状态管理单元测试
 * @description: 测试用户状态管理的功能
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia, defineStore } from 'pinia';
import { userStore } from '@/store/modules/user';
import * as userApi from '@/api/user';

// Mock API module
vi.mock('@/api/user', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getInfo: vi.fn(),
  refreshToken: vi.fn(),
  register: vi.fn(),
  changePassword: vi.fn(),
  updateUser: vi.fn()
}));

const mockUserApi = vi.mocked(userApi);

// Mock router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn()
};

// Mock Element Plus
const mockElMessage = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn()
};

vi.mock('element-plus', () => ({
  ElMessage: mockElMessage
}));

describe('User Store', () => {
  let store: ReturnType<typeof userStore>;

  beforeEach(() => {
    // 创建新的Pinia实例
    const pinia = createPinia();
    setActivePinia(pinia);
    store = userStore(pinia);

    // 清除所有mock
    vi.clearAllMocks();

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

    // Mock sessionStorage
    const sessionStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true
    });
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
      expect(store.introduction).toBe('');
      expect(store.userInfo).toBeNull();
    });

    it('应该从localStorage恢复token', () => {
      const mockToken = 'mock-token';
      (window.localStorage.getItem as vi.Mock).mockReturnValue(mockToken);

      const newStore = userStore();
      expect(newStore.token).toBe(mockToken);
    });
  });

  describe('登录功能', () => {
    const mockLoginData = {
      username: 'testuser',
      password: 'password123'
    };

    const mockLoginResponse = {
      success: true,
      data: {
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          avatar: 'avatar.jpg',
          roles: ['user'],
          permissions: ['read', 'write']
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token'
        }
      }
    };

    it('应该成功登录', async () => {
      mockUserApi.login.mockResolvedValue(mockLoginResponse);

      await store.login(mockLoginData);

      expect(mockUserApi.login).toHaveBeenCalledWith(mockLoginData);
      expect(store.token).toBe('access-token');
      expect(store.name).toBe('testuser');
      expect(store.avatar).toBe('avatar.jpg');
      expect(store.roles).toEqual(['user']);
      expect(store.permissions).toEqual(['read', 'write']);
      expect(window.localStorage.setItem).toHaveBeenCalledWith('token', 'access-token');
      expect(mockElMessage.success).toHaveBeenCalledWith('登录成功');
    });

    it('应该处理登录失败', async () => {
      const error = new Error('登录失败');
      mockUserApi.login.mockRejectedValue(error);

      await expect(store.login(mockLoginData)).rejects.toThrow('登录失败');
      expect(mockElMessage.error).toHaveBeenCalledWith('登录失败');
    });

    it('应该处理网络错误', async () => {
      const networkError = new Error('Network Error');
      mockUserApi.login.mockRejectedValue(networkError);

      await expect(store.login(mockLoginData)).rejects.toThrow('Network Error');
      expect(mockElMessage.error).toHaveBeenCalledWith('网络错误，请重试');
    });

    it('应该处理无效响应', async () => {
      mockUserApi.login.mockResolvedValue({
        success: false,
        message: '用户名或密码错误'
      });

      await expect(store.login(mockLoginData)).rejects.toThrow();
      expect(mockElMessage.error).toHaveBeenCalledWith('用户名或密码错误');
    });
  });

  describe('登出功能', () => {
    beforeEach(() => {
      // 设置已登录状态
      store.token = 'test-token';
      store.name = 'testuser';
      store.roles = ['user'];
    });

    it('应该成功登出', async () => {
      mockUserApi.logout.mockResolvedValue({ success: true });

      await store.logout();

      expect(mockUserApi.logout).toHaveBeenCalled();
      expect(store.token).toBe('');
      expect(store.name).toBe('');
      expect(store.roles).toEqual([]);
      expect(store.userInfo).toBeNull();
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockElMessage.success).toHaveBeenCalledWith('登出成功');
    });

    it('应该处理登出失败', async () => {
      const error = new Error('登出失败');
      mockUserApi.logout.mockRejectedValue(error);

      await store.logout();

      // 即使API失败，也应该清理本地状态
      expect(store.token).toBe('');
      expect(store.name).toBe('');
      expect(mockElMessage.error).toHaveBeenCalledWith('登出失败');
    });
  });

  describe('获取用户信息', () => {
    const mockUserInfo = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      avatar: 'avatar.jpg',
      roles: ['user'],
      permissions: ['read', 'write'],
      introduction: '这是用户简介'
    };

    it('应该成功获取用户信息', async () => {
      mockUserApi.getInfo.mockResolvedValue({
        success: true,
        data: mockUserInfo
      });

      await store.getInfo();

      expect(mockUserApi.getInfo).toHaveBeenCalled();
      expect(store.name).toBe(mockUserInfo.username);
      expect(store.avatar).toBe(mockUserInfo.avatar);
      expect(store.roles).toEqual(mockUserInfo.roles);
      expect(store.permissions).toEqual(mockUserInfo.permissions);
      expect(store.introduction).toBe(mockUserInfo.introduction);
      expect(store.userInfo).toEqual(mockUserInfo);
    });

    it('应该处理获取信息失败', async () => {
      const error = new Error('获取用户信息失败');
      mockUserApi.getInfo.mockRejectedValue(error);

      await store.getInfo();

      expect(mockElMessage.error).toHaveBeenCalledWith('获取用户信息失败');
    });

    it('应该处理空响应', async () => {
      mockUserApi.getInfo.mockResolvedValue({
        success: false,
        message: 'Token无效'
      });

      await store.getInfo();

      expect(mockElMessage.error).toHaveBeenCalledWith('Token无效');
    });
  });

  describe '修改密码', () => {
    const mockPasswordData = {
      oldPassword: 'oldpassword',
      newPassword: 'newpassword',
      confirmPassword: 'newpassword'
    };

    it('应该成功修改密码', async () => {
      mockUserApi.changePassword.mockResolvedValue({
        success: true,
        message: '密码修改成功'
      });

      await store.changePassword(mockPasswordData);

      expect(mockUserApi.changePassword).toHaveBeenCalledWith(mockPasswordData);
      expect(mockElMessage.success).toHaveBeenCalledWith('密码修改成功');
    });

    it('应该处理修改密码失败', async () => {
      const error = new Error('旧密码不正确');
      mockUserApi.changePassword.mockRejectedValue(error);

      await expect(store.changePassword(mockPasswordData)).rejects.toThrow('旧密码不正确');
      expect(mockElMessage.error).toHaveBeenCalledWith('旧密码不正确');
    });

    it('应该验证密码确认', async () => {
      const invalidPasswordData = {
        oldPassword: 'oldpassword',
        newPassword: 'newpassword',
        confirmPassword: 'different'
      };

      await expect(store.changePassword(invalidPasswordData)).rejects.toThrow('新密码确认不匹配');
      expect(mockElMessage.error).toHaveBeenCalledWith('新密码确认不匹配');
    });
  });

  describe('更新用户信息', () => {
    const mockUpdateData = {
      username: 'newusername',
      email: 'newemail@example.com',
      avatar: 'newavatar.jpg'
    };

    it('应该成功更新用户信息', async () => {
      const updatedUserInfo = {
        ...mockUpdateData,
        roles: ['user'],
        permissions: ['read', 'write']
      };

      mockUserApi.updateUser.mockResolvedValue({
        success: true,
        data: updatedUserInfo
      });

      await store.updateUser(mockUpdateData);

      expect(mockUserApi.updateUser).toHaveBeenCalledWith(mockUpdateData);
      expect(store.name).toBe(mockUpdateData.username);
      expect(store.avatar).toBe(mockUpdateData.avatar);
      expect(mockElMessage.success).toHaveBeenCalledWith('更新成功');
    });

    it('应该处理更新失败', async () => {
      const error = new Error('更新失败');
      mockUserApi.updateUser.mockRejectedValue(error);

      await expect(store.updateUser(mockUpdateData)).rejects.toThrow('更新失败');
      expect(mockElMessage.error).toHaveBeenCalledWith('更新失败');
    });
  });

  describe('Token刷新', () => {
    it('应该成功刷新token', async () => {
      const mockRefreshResponse = {
        success: true,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        }
      };

      mockUserApi.refreshToken.mockResolvedValue(mockRefreshResponse);

      await store.refreshToken();

      expect(mockUserApi.refreshToken).toHaveBeenCalled();
      expect(store.token).toBe('new-access-token');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('token', 'new-access-token');
    });

    it('应该处理刷新失败', async () => {
      const error = new Error('Token已过期');
      mockUserApi.refreshToken.mockRejectedValue(error);

      await store.refreshToken();

      expect(store.token).toBe('');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockElMessage.error).toHaveBeenCalledWith('Token已过期，请重新登录');
    });
  });

  describe('权限检查', () => {
    beforeEach(() => {
      store.roles = ['user', 'admin'];
      store.permissions = ['read', 'write', 'delete'];
    });

    it('应该正确检查角色权限', () => {
      expect(store.hasRole('user')).toBe(true);
      expect(store.hasRole('admin')).toBe(true);
      expect(store.hasRole('superadmin')).toBe(false);
    });

    it('应该正确检查操作权限', () => {
      expect(store.hasPermission('read')).toBe(true);
      expect(store.hasPermission('write')).toBe(true);
      expect(store.hasPermission('delete')).toBe(true);
      expect(store.hasPermission('admin')).toBe(false);
    });

    it('应该正确检查多个角色', () => {
      expect(store.hasAnyRole(['user'])).toBe(true);
      expect(store.hasAnyRole(['admin'])).toBe(true);
      expect(store.hasAnyRole(['superadmin'])).toBe(false);
      expect(store.hasAnyRole(['user', 'superadmin'])).toBe(true);
    });

    it('应该正确检查多个权限', () => {
      expect(store.hasAnyPermission(['read'])).toBe(true);
      expect(store.hasAnyPermission(['admin'])).toBe(false);
      expect(store.hasAnyPermission(['read', 'admin'])).toBe(true);
    });

    it('应该正确检查所有权限', () => {
      expect(store.hasAllPermissions(['read'])).toBe(true);
      expect(store.hasAllPermissions(['read', 'write'])).toBe(true);
      expect(store.hasAllPermissions(['read', 'admin'])).toBe(false);
    });
  });

  describe('边界情况', () => {
    it('应该处理空角色列表', () => {
      store.roles = [];
      expect(store.hasRole('user')).toBe(false);
      expect(store.hasAnyRole(['user', 'admin'])).toBe(false);
    });

    it('应该处理空权限列表', () => {
      store.permissions = [];
      expect(store.hasPermission('read')).toBe(false);
      expect(store.hasAnyPermission(['read', 'write'])).toBe(false);
    });

    it('应该处理null/undefined输入', () => {
      expect(store.hasRole(null as any)).toBe(false);
      expect(store.hasRole(undefined as any)).toBe(false);
      expect(store.hasPermission(null as any)).toBe(false);
      expect(store.hasPermission(undefined as any)).toBe(false);
    });

    it('应该处理空数组输入', () => {
      expect(store.hasAnyRole([])).toBe(false);
      expect(store.hasAnyPermission([])).toBe(false);
      expect(store.hasAllPermissions([])).toBe(true);
    });
  });

  describe('状态持久化', () => {
    it('应该在token变化时更新localStorage', async () => {
      const newToken = 'new-test-token';
      await store.setToken(newToken);

      expect(store.token).toBe(newToken);
      expect(window.localStorage.setItem).toHaveBeenCalledWith('token', newToken);
    });

    it('应该正确重置状态', () => {
      // 设置一些状态
      store.token = 'test-token';
      store.name = 'testuser';
      store.roles = ['user'];
      store.userInfo = { id: '1', username: 'testuser' } as any;

      // 重置状态
      store.resetState();

      expect(store.token).toBe('');
      expect(store.name).toBe('');
      expect(store.roles).toEqual([]);
      expect(store.userInfo).toBeNull();
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });
});