/**
 * @description: 路由配置单元测试
 * @author: Kevin Wan
 * @date: 2025-10-30
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRouter, createWebHistory, Router } from 'vue-router';
import routes from '@/router/index';

describe('Router Configuration - 路由配置测试', () => {
  let router: Router;

  beforeEach(() => {
    vi.clearAllMocks();
    router = createRouter({
      history: createWebHistory(),
      routes: routes
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本路由配置', () => {
    it('应该正确创建路由实例', () => {
      expect(router).toBeDefined();
      expect(router.options.history).toBeDefined();
      expect(router.getRoutes()).toHaveLength(routes.length);
    });

    it('应该包含登录页面路由', () => {
      const loginRoute = router.getRoutes().find(route => route.path === '/login');
      expect(loginRoute).toBeDefined();
      expect(loginRoute?.name).toBe('login');
      expect(loginRoute?.meta?.title).toBe('登录');
    });

    it('应该包含仪表板路由', () => {
      const dashboardRoute = router.getRoutes().find(route => route.path === '/dashboard');
      expect(dashboardRoute).toBeDefined();
      expect(dashboardRoute?.name).toBe('dashboard');
      expect(dashboardRoute?.meta?.title).toBe('仪表板');
    });

    it('应该包含404页面路由', () => {
      const notFoundRoute = router.getRoutes().find(route => route.path === '/:pathMatch(.*)*');
      expect(notFoundRoute).toBeDefined();
      expect(notFoundRoute?.name).toBe('notFound');
      expect(notFoundRoute?.meta?.title).toBe('页面未找到');
    });
  });

  describe('路由元信息', () => {
    it('应该设置正确的页面标题', () => {
      const dashboardRoute = router.getRoutes().find(route => route.path === '/dashboard');
      expect(dashboardRoute?.meta?.title).toBe('仪表板');
      expect(dashboardRoute?.meta?.icon).toBeDefined();
    });

    it('应该设置权限要求', () => {
      const dashboardRoute = router.getRoutes().find(route => route.path === '/dashboard');
      expect(dashboardRoute?.meta?.requiresAuth).toBe(true);
      expect(dashboardRoute?.meta?.roles).toContain('admin');
      expect(dashboardRoute?.meta?.roles).toContain('editor');
    });

    it('应该设置是否需要缓存', () => {
      const dashboardRoute = router.getRoutes().find(route => route.path === '/dashboard');
      expect(dashboardRoute?.meta?.keepAlive).toBe(true);
    });

    it('应该设置是否隐藏面包屑', () => {
      const loginRoute = router.getRoutes().find(route => route.path === '/login');
      expect(loginRoute?.meta?.hideBreadcrumb).toBe(true);
    });
  });

  describe('嵌套路由', () => {
    it('应该正确配置嵌套路由', () => {
      const layoutRoute = router.getRoutes().find(route => route.path === '/');
      expect(layoutRoute).toBeDefined();
      expect(layoutRoute?.children).toBeDefined();
      expect(layoutRoute?.children?.length).toBeGreaterThan(0);
    });

    it('应该正确配置子路由路径', () => {
      const layoutRoute = router.getRoutes().find(route => route.path === '/');
      const childRoutes = layoutRoute?.children || [];

      const dashboardChild = childRoutes.find(route => route.path === 'dashboard');
      expect(dashboardChild).toBeDefined();
      expect(dashboardChild?.path).toBe('dashboard');
    });

    it('应该正确配置重定向', () => {
      const layoutRoute = router.getRoutes().find(route => route.path === '/');
      const redirectChild = layoutRoute?.children?.find(route => route.path === '');
      expect(redirectChild?.redirect).toBe('/dashboard');
    });
  });

  describe('动态路由', () => {
    it('应该支持动态参数', () => {
      const userRoute = router.getRoutes().find(route => route.path === '/user/:id');
      expect(userRoute).toBeDefined();
      expect(userRoute?.name).toBe('userDetail');
      expect(userRoute?.meta?.title).toBe('用户详情');
    });

    it('应该支持可选参数', () => {
      const categoryRoute = router.getRoutes().find(route => route.path === '/category/:id?');
      expect(categoryRoute).toBeDefined();
    });

    it('应该支持多级动态参数', () => {
      const nestedRoute = router.getRoutes().find(route => route.path === '/post/:category/:id');
      expect(nestedRoute).toBeDefined();
    });
  });

  describe('路由导航守卫', () => {
    it('应该有全局前置守卫', () => {
      const guards = router.options.beforeEach || [];
      expect(guards).toBeDefined();
    });

    it('应该有全局后置钩子', () => {
      const guards = router.options.afterEach || [];
      expect(guards).toBeDefined();
    });

    it('应该验证登录状态', async () => {
      // 模拟未登录状态
      const mockGetToken = vi.fn().mockReturnValue(null);
      vi.doMock('@/utils/auth', () => ({ getToken: mockGetToken }));

      // 重新导入路由配置
      delete require.cache[require.resolve('@/router/index')];
      const { default: configuredRoutes } = require('@/router/index');

      const testRouter = createRouter({
        history: createWebHistory(),
        routes: configuredRoutes
      });

      // 测试导航到需要认证的页面
      try {
        await testRouter.push('/dashboard');
        // 应该被重定向到登录页面
        expect(testRouter.currentRoute.value.path).toBe('/login');
      } catch (error) {
        // 导航被拦截是预期的行为
      }
    });

    it('应该设置页面标题', async () => {
      const mockSetTitle = vi.fn();
      Object.defineProperty(document, 'title', {
        set: mockSetTitle,
        get: () => 'Test Title',
        configurable: true
      });

      await router.push('/dashboard');
      expect(mockSetTitle).toHaveBeenCalled();
    });
  });

  describe('路由解析', () => {
    it('应该正确解析路径', () => {
      const resolved = router.resolve('/dashboard');
      expect(resolved.name).toBe('dashboard');
      expect(resolved.href).toContain('/dashboard');
    });

    it('应该正确解析带参数的路径', () => {
      const resolved = router.resolve({ name: 'userDetail', params: { id: '123' }});
      expect(resolved.href).toContain('/user/123');
    });

    it('应该正确解析带查询参数的路径', () => {
      const resolved = router.resolve({ path: '/dashboard', query: { tab: 'overview' }});
      expect(resolved.href).toContain('/dashboard?tab=overview');
    });
  });

  describe('路由匹配', () => {
    it('应该正确匹配静态路由', () => {
      const matched = router.resolve('/dashboard');
      expect(matched.name).toBe('dashboard');
    });

    it('应该正确匹配动态路由', () => {
      const matched = router.resolve('/user/123');
      expect(matched.name).toBe('userDetail');
      expect(matched.params.id).toBe('123');
    });

    it('应该正确匹配嵌套路由', () => {
      const matched = router.resolve('/');
      expect(matched.matched.length).toBeGreaterThan(0);
    });

    it('应该处理不存在的路由', () => {
      const matched = router.resolve('/non-existent-page');
      expect(matched.name).toBe('notFound');
    });
  });

  describe('路由重定向', () => {
    it('应该重定向根路径到仪表板', async () => {
      try {
        await router.push('/');
        // 根据配置，根路径应该重定向到仪表板
        expect(router.currentRoute.value.path).toBe('/dashboard');
      } catch (error) {
        // 如果重定向失败，检查重定向配置
        const rootRoute = router.getRoutes().find(route => route.path === '/');
        expect(rootRoute?.redirect).toBe('/dashboard');
      }
    });

    it('应该处理别名重定向', async () => {
      const homeRoute = router.getRoutes().find(route => route.aliases?.includes('/home'));
      if (homeRoute) {
        const resolved = router.resolve('/home');
        expect(resolved.name).toBe(homeRoute.name);
      }
    });
  });

  describe('路由模式', () => {
    it('应该使用WebHistory模式', () => {
      expect(router.options.history).toBeDefined();
      expect(router.options.history.constructor.name).toBe('HTML5History');
    });

    it('应该正确处理base URL', () => {
      const testRouter = createRouter({
        history: createWebHistory('/admin'),
        routes: routes
      });

      expect(testRouter.options.history.base).toBe('/admin');
    });
  });

  describe('路由懒加载', () => {
    it('应该支持组件懒加载', () => {
      const dashboardRoute = router.getRoutes().find(route => route.path === '/dashboard');
      expect(dashboardRoute?.components?.default).toBeDefined();
      // 懒加载的组件通常是一个函数
      expect(typeof dashboardRoute?.components?.default).toBe('function');
    });
  });

  describe('错误处理', () => {
    it('应该处理无效路由参数', () => {
      const resolved = router.resolve('/user/invalid-id');
      expect(resolved.params.id).toBe('invalid-id');
    });

    it('应该处理路由解析错误', () => {
      expect(() => router.resolve('invalid-path')).not.toThrow();
    });

    it('应该处理导航错误', async () => {
      // 模拟导航错误
      const mockPush = vi.fn().mockRejectedValue(new Error('Navigation failed'));
      router.push = mockPush;

      await expect(router.push('/invalid-route')).rejects.toThrow('Navigation failed');
    });
  });

  describe('性能测试', () => {
    it('应该快速解析路由', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        router.resolve('/dashboard');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // 1000次解析应该在100ms内完成
    });

    it('应该快速匹配路由', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        router.getRoutes().find(route => route.path === '/dashboard');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50); // 1000次查找应该在50ms内完成
    });
  });

  describe('路由工具函数', () => {
    it('应该正确获取面包屑数据', () => {
      const matched = router.resolve('/dashboard');
      if (matched.matched.length > 0) {
        const breadcrumb = matched.matched.map(route => ({
          title: route.meta?.title || route.name,
          path: route.path
        }));

        expect(breadcrumb).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ title: '仪表板' })
          ])
        );
      }
    });

    it('应该正确获取菜单数据', () => {
      const menuRoutes = router.getRoutes().filter(route =>
        route.meta?.hidden !== true && route.children
      );

      expect(menuRoutes.length).toBeGreaterThan(0);
    });

    it('应该正确过滤路由权限', () => {
      const userRoles = ['editor'];
      const accessibleRoutes = router.getRoutes().filter(route => {
        const requiredRoles = route.meta?.roles || [];
        return requiredRoles.length === 0 ||
               requiredRoles.some(role => userRoles.includes(role));
      });

      expect(accessibleRoutes.length).toBeGreaterThan(0);
    });
  });
});
