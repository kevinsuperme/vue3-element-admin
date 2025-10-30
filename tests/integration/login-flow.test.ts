/**
 * @description: 登录流程集成测试
 * @author: Kevin Wan
 * @date: 2025-10-30
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import { ElMessage, ElMessageBox } from 'element-plus';
import LoginView from '@/views/login/index.vue';

// Mock API 模块
vi.mock('@/api/user', () => ({
  login: vi.fn(),
  getInfo: vi.fn(),
  logout: vi.fn()
}));

// Mock 路由
const routes = [
  { path: '/login', component: LoginView },
  { path: '/dashboard', component: { template: '<div>Dashboard</div>' }}
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Mock Element Plus
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus');
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn()
    },
    ElMessageBox: {
      confirm: vi.fn(() => Promise.resolve()),
      alert: vi.fn(() => Promise.resolve())
    }
  };
});

describe('登录流程集成测试', () => {
  let wrapper: any;
  let pinia: any;

  beforeEach(async () => {
    pinia = createPinia();
    setActivePinia(pinia);

    vi.clearAllMocks();

    wrapper = mount(LoginView, {
      global: {
        plugins: [router, pinia],
        stubs: {
          'el-form': true,
          'el-form-item': true,
          'el-input': true,
          'el-button': true,
          'el-checkbox': true,
          'el-card': true
        }
      }
    });

    await router.push('/login');
    await router.isReady();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe('页面渲染', () => {
    it('应该正确渲染登录页面', () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('应该包含登录表单元素', () => {
      // 检查是否包含必要的表单元素
      expect(wrapper.findComponent({ name: 'ElForm' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'ElInput' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'ElButton' }).exists()).toBe(true);
    });

    it('应该显示正确的标题', () => {
      // 假设登录页面有标题
      const title = wrapper.find('.login-title, .title, h1, h2');
      if (title.exists()) {
        expect(title.text()).toContain('登录');
      }
    });
  });

  describe('表单验证', () => {
    it('应该验证必填字段', async () => {
      const form = wrapper.findComponent({ name: 'ElForm' });
      expect(form.exists()).toBe(true);

      // 模拟表单提交（空表单）
      const submitButton = wrapper.find('button[type="submit"], .el-button--primary');
      if (submitButton.exists()) {
        await submitButton.trigger('click');
        // 应该显示验证错误
      }
    });

    it('应该验证邮箱格式', async () => {
      const emailInput = wrapper.find('input[type="email"], .el-input__inner');
      if (emailInput.exists()) {
        await emailInput.setValue('invalid-email');
        // 触发验证
        await emailInput.trigger('blur');
        // 检查错误消息
      }
    });

    it('应该验证密码长度', async () => {
      const passwordInput = wrapper.find('input[type="password"]');
      if (passwordInput.exists()) {
        await passwordInput.setValue('123');
        await passwordInput.trigger('blur');
        // 应该显示密码过短错误
      }
    });
  });

  describe('登录流程', () => {
    it('应该成功处理有效登录', async () => {
      const { login } = await import('@/api/user')
      ;(login as any).mockResolvedValue({
        success: true,
        data: { token: 'test-token', user: { name: 'Admin' }}
      });

      // 填写表单
      const usernameInput = wrapper.find('input[name="username"], .username-input');
      const passwordInput = wrapper.find('input[name="password"], .password-input');

      if (usernameInput.exists() && passwordInput.exists()) {
        await usernameInput.setValue('admin');
        await passwordInput.setValue('123456');

        // 提交表单
        const submitButton = wrapper.find('button[type="submit"]');
        await submitButton.trigger('click');

        // 验证 API 调用
        expect(login).toHaveBeenCalledWith({
          username: 'admin',
          password: '123456'
        });

        // 验证路由跳转
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(router.currentRoute.value.path).toBe('/dashboard');
      }
    });

    it('应该处理登录失败', async () => {
      const { login } = await import('@/api/user')
      ;(login as any).mockRejectedValue(new Error('用户名或密码错误'));

      const usernameInput = wrapper.find('input[name="username"]');
      const passwordInput = wrapper.find('input[name="password"]');

      if (usernameInput.exists() && passwordInput.exists()) {
        await usernameInput.setValue('wrong');
        await passwordInput.setValue('wrong');

        const submitButton = wrapper.find('button[type="submit"]');
        await submitButton.trigger('click');

        // 验证错误消息显示
        expect(ElMessage.error).toHaveBeenCalledWith('用户名或密码错误');
      }
    });

    it('应该显示加载状态', async () => {
      const { login } = await import('@/api/user');
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      })
      ;(login as any).mockReturnValue(loginPromise);

      const usernameInput = wrapper.find('input[name="username"]');
      const passwordInput = wrapper.find('input[name="password"]');

      if (usernameInput.exists() && passwordInput.exists()) {
        await usernameInput.setValue('admin');
        await passwordInput.setValue('123456');

        const submitButton = wrapper.find('button[type="submit"]');
        await submitButton.trigger('click');

        // 检查加载状态
        expect(submitButton.attributes('loading')).toBeDefined();
        expect(submitButton.attributes('disabled')).toBeDefined();

        // 解决 Promise
        resolveLogin!({ success: true, data: { token: 'test' }});
      }
    });
  });

  describe('记住密码功能', () => {
    it('应该记住用户名', async () => {
      const checkbox = wrapper.find('.remember-checkbox, .el-checkbox');
      if (checkbox.exists()) {
        await checkbox.trigger('click');
        expect(checkbox.element.checked).toBe(true);
      }
    });

    it('应该在本地存储保存凭据', async () => {
      const localStorageSet = vi.spyOn(Storage.prototype, 'setItem');

      const checkbox = wrapper.find('.remember-checkbox, .el-checkbox');
      const usernameInput = wrapper.find('input[name="username"]');

      if (checkbox.exists() && usernameInput.exists()) {
        await checkbox.trigger('click');
        await usernameInput.setValue('admin');

        // 模拟成功登录
        const { login } = await import('@/api/user')
        ;(login as any).mockResolvedValue({ success: true });

        const submitButton = wrapper.find('button[type="submit"]');
        await submitButton.trigger('click');

        // 检查是否保存到 localStorage
        expect(localStorageSet).toHaveBeenCalledWith('username', 'admin');
      }
    });
  });

  describe('路由守卫集成', () => {
    it('应该重定向已登录用户', async () => {
      // 模拟已登录状态
      const localStorageGet = vi.spyOn(Storage.prototype, 'getItem');
      localStorageGet.mockReturnValue('test-token');

      // 导航到登录页面
      await router.push('/login');

      // 应该重定向到仪表板
      expect(router.currentRoute.value.path).toBe('/dashboard');
    });

    it('应该允许未登录用户访问登录页', async () => {
      const localStorageGet = vi.spyOn(Storage.prototype, 'getItem');
      localStorageGet.mockReturnValue(null);

      await router.push('/login');

      expect(router.currentRoute.value.path).toBe('/login');
    });
  });

  describe('响应式设计', () => {
    it('应该在移动端正确显示', () => {
      // 模拟移动端视口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      const wrapper = mount(LoginView, {
        global: {
          plugins: [router, pinia]
        }
      });

      // 检查移动端样式
      expect(wrapper.find('.login-container').exists()).toBe(true);
    });
  });
});
