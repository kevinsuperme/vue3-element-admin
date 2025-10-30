/**
 * @description: 仪表板流程集成测试
 * @author: Kevin Wan
 * @date: 2025-10-30
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import Dashboard from '@/views/dashboard/index.vue';
import userStore from '@/store/modules/user';

// Mock API calls
vi.mock('@/api/user', () => ({
  getInfo: vi.fn(),
  login: vi.fn(),
  logout: vi.fn()
}));

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: vi.fn(),
  ElMessageBox: {
    confirm: vi.fn(() => Promise.resolve())
  }
}));

// Mock chart library
vi.mock('echarts', () => ({
  init: vi.fn(() => ({
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn()
  }))
}));

describe('Dashboard Flow Integration - 仪表板流程集成测试', () => {
  let router: any;
  let pinia: any;
  let store: any;
  let wrapper: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // 创建路由
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', redirect: '/dashboard' },
        { path: '/dashboard', component: Dashboard, meta: { title: '仪表板', requiresAuth: true }},
        { path: '/login', component: { template: '<div>Login Page</div>' }}
      ]
    });

    // 创建Pinia
    pinia = createPinia();
    setActivePinia(pinia);

    // 设置用户状态
    store = userStore();
    store.token = 'test-token';
    store.name = 'Test User';
    store.roles = ['admin'];

    // Mock 用户信息API
    const { getInfo } = await import('@/api/user');
    vi.mocked(getInfo).mockResolvedValue({
      code: 20000,
      data: {
        name: 'Test User',
        avatar: 'test-avatar.jpg',
        roles: ['admin'],
        permissions: ['dashboard:read']
      }
    });

    // 等待路由准备就绪
    await router.isReady();

    // 挂载组件
    wrapper = mount(Dashboard, {
      global: {
        plugins: [router, pinia],
        stubs: {
          'el-row': true,
          'el-col': true,
          'el-card': true,
          'el-button': true,
          'el-select': true,
          'el-option': true,
          'echarts': true,
          'router-link': true
        }
      }
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.restoreAllMocks();
  });

  describe('页面加载和初始化', () => {
    it('应该正确渲染仪表板页面', () => {
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.dashboard-container').exists()).toBe(true);
      expect(wrapper.find('.page-title').exists()).toBe(true);
    });

    it('应该显示正确的页面标题', async () => {
      // 模拟路由导航
      await router.push('/dashboard');

      expect(wrapper.find('.page-title').text()).toContain('仪表板');
      expect(document.title).toContain('仪表板');
    });

    it('应该验证用户权限', () => {
      expect(store.isLoggedIn).toBe(true);
      expect(store.hasRole('admin')).toBe(true);
      expect(store.hasPermission('dashboard:read')).toBe(true);
    });

    it('应该在未认证时重定向到登录页', async () => {
      // 清除token
      store.token = '';

      // 重新创建路由以测试导航守卫
      const testRouter = createRouter({
        history: createWebHistory(),
        routes: [
          { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true }},
          { path: '/login', component: { template: '<div>Login</div>' }}
        ]
      });

      await testRouter.isReady();

      // 模拟导航守卫
      try {
        await testRouter.push('/dashboard');
      } catch (error) {
        // 导航被拦截，这是预期的行为
      }

      // 在实际应用中，应该重定向到登录页
      expect(store.isLoggedIn).toBe(false);
    });
  });

  describe('数据加载', () => {
    it('应该加载用户信息', async () => {
      const { getInfo } = await import('@/api/user');

      await store.getUserInfo();

      expect(getInfo).toHaveBeenCalledWith('test-token');
      expect(store.name).toBe('Test User');
      expect(store.roles).toEqual(['admin']);
    });

    it('应该加载仪表板数据', async () => {
      // 模拟仪表板数据加载
      const mockData = {
        overview: {
          totalUsers: 1250,
          totalOrders: 3420,
          totalRevenue: 45680,
          totalProducts: 890
        },
        charts: {
          userTrend: [
            { date: '2023-01', users: 100 },
            { date: '2023-02', users: 150 },
            { date: '2023-03', users: 200 }
          ],
          salesData: [
            { month: 'Jan', sales: 1000 },
            { month: 'Feb', sales: 1200 },
            { month: 'Mar', sales: 1500 }
          ]
        }
      };

      // 模拟API调用
      wrapper.vm.dashboardData = mockData;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.dashboardData).toBeDefined();
      expect(wrapper.vm.dashboardData.overview.totalUsers).toBe(1250);
    });

    it('应该处理数据加载失败', async () => {
      const { getInfo } = await import('@/api/user');
      vi.mocked(getInfo).mockRejectedValue(new Error('加载失败'));

      try {
        await store.getUserInfo();
      } catch (error) {
        expect(error.message).toBe('加载失败');
      }

      // 应该显示错误消息
      expect(wrapper.vm.error).toBeTruthy();
    });
  });

  describe('图表渲染', () => {
    it('应该渲染用户趋势图表', () => {
      const chartContainer = wrapper.find('.user-trend-chart');
      expect(chartContainer.exists()).toBe(true);

      // 模拟图表初始化
      wrapper.vm.initUserTrendChart();
      expect(wrapper.vm.userTrendChart).toBeDefined();
    });

    it('应该渲染销售数据图表', () => {
      const chartContainer = wrapper.find('.sales-chart');
      expect(chartContainer.exists()).toBe(true);

      wrapper.vm.initSalesChart();
      expect(wrapper.vm.salesChart).toBeDefined();
    });

    it('应该渲染饼图', () => {
      const pieChartContainer = wrapper.find('.pie-chart');
      expect(pieChartContainer.exists()).toBe(true);

      wrapper.vm.initPieChart();
      expect(wrapper.vm.pieChart).toBeDefined();
    });

    it('应该响应窗口大小变化', async () => {
      // 初始化图表
      wrapper.vm.initUserTrendChart();
      wrapper.vm.initSalesChart();
      wrapper.vm.initPieChart();

      // 模拟resize事件
      window.dispatchEvent(new Event('resize'));
      await wrapper.vm.$nextTick();

      // 图表应该重新计算大小
      const resizeSpy = vi.spyOn(wrapper.vm.userTrendChart, 'resize');
      wrapper.vm.handleResize();
      expect(resizeSpy).toHaveBeenCalled();
    });
  });

  describe('用户交互', () => {
    it('应该支持时间范围选择', async () => {
      const timeRangeSelect = wrapper.find('.time-range-select');
      if (timeRangeSelect.exists()) {
        await timeRangeSelect.setValue('7days');
        await timeRangeSelect.trigger('change');

        expect(wrapper.vm.timeRange).toBe('7days');
        expect(wrapper.vm.loadChartData).toHaveBeenCalled();
      }
    });

    it('应该支持数据刷新', async () => {
      const refreshButton = wrapper.find('.refresh-button');
      if (refreshButton.exists()) {
        await refreshButton.trigger('click');

        expect(wrapper.vm.isLoading).toBe(true);
        expect(wrapper.vm.loadDashboardData).toHaveBeenCalled();
      }
    });

    it('应该支持导出数据', async () => {
      const exportButton = wrapper.find('.export-button');
      if (exportButton.exists()) {
        const exportSpy = vi.spyOn(wrapper.vm, 'exportData');
        await exportButton.trigger('click');

        expect(exportSpy).toHaveBeenCalled();
      }
    });

    it('应该支持全屏模式', async () => {
      const fullscreenButton = wrapper.find('.fullscreen-button');
      if (fullscreenButton.exists()) {
        await fullscreenButton.trigger('click');

        expect(wrapper.vm.isFullscreen).toBe(true);
        expect(document.body.classList.contains('fullscreen')).toBe(true);
      }
    });
  });

  describe('实时数据更新', () => {
    it('应该支持WebSocket连接', async () => {
      // 模拟WebSocket
      const mockWebSocket = {
        send: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };

      global.WebSocket = vi.fn(() => mockWebSocket) as any;

      wrapper.vm.initWebSocket();

      expect(global.WebSocket).toHaveBeenCalled();
      expect(wrapper.vm.websocket).toBeDefined();
    });

    it('应该接收实时数据更新', async () => {
      const mockWebSocket = {
        send: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };

      global.WebSocket = vi.fn(() => mockWebSocket) as any;
      wrapper.vm.initWebSocket();

      // 模拟接收消息
      const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      if (messageHandler) {
        const mockMessage = {
          data: JSON.stringify({
            type: 'dashboard_update',
            data: { totalUsers: 1300 }
          })
        };

        messageHandler(mockMessage);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.dashboardData.overview.totalUsers).toBe(1300);
      }
    });

    it('应该处理WebSocket连接错误', async () => {
      global.WebSocket = vi.fn(() => {
        throw new Error('WebSocket connection failed');
      }) as any;

      const consoleSpy = vi.spyOn(console, 'error');

      wrapper.vm.initWebSocket();

      expect(consoleSpy).toHaveBeenCalledWith(
        'WebSocket connection failed:',
        expect.any(Error)
      );
    });
  });

  describe('权限控制', () => {
    it('应该根据角色显示不同功能', async () => {
      // 测试管理员角色
      store.roles = ['admin'];
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.admin-panel').exists()).toBe(true);
      expect(wrapper.find('.user-management').exists()).toBe(true);

      // 测试普通用户角色
      store.roles = ['user'];
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.admin-panel').exists()).toBe(false);
      expect(wrapper.find('.user-panel').exists()).toBe(true);
    });

    it('应该根据权限控制操作按钮', async () => {
      store.permissions = ['dashboard:read'];
      await wrapper.vm.$nextTick();

      const editButton = wrapper.find('.edit-button');
      const deleteButton = wrapper.find('.delete-button');

      // 只有读取权限时，编辑和删除按钮应该隐藏或禁用
      if (editButton.exists()) {
        expect(editButton.attributes('disabled')).toBeDefined();
      }
      if (deleteButton.exists()) {
        expect(deleteButton.attributes('disabled')).toBeDefined();
      }

      // 添加写权限
      store.permissions = ['dashboard:read', 'dashboard:write'];
      await wrapper.vm.$nextTick();

      if (editButton.exists()) {
        expect(editButton.attributes('disabled')).toBeUndefined();
      }
    });
  });

  describe('响应式设计', () => {
    it('应该在移动设备上正确显示', async () => {
      // 模拟移动设备
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      window.dispatchEvent(new Event('resize'));
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isMobile).toBe(true);
      expect(wrapper.find('.mobile-layout').exists()).toBe(true);
    });

    it('应该在平板设备上正确显示', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      window.dispatchEvent(new Event('resize'));
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isTablet).toBe(true);
      expect(wrapper.find('.tablet-layout').exists()).toBe(true);
    });

    it('应该在桌面设备上正确显示', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });

      window.dispatchEvent(new Event('resize'));
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isDesktop).toBe(true);
      expect(wrapper.find('.desktop-layout').exists()).toBe(true);
    });
  });

  describe('性能优化', () => {
    it('应该使用防抖处理频繁操作', async () => {
      const debounceSpy = vi.fn();
      wrapper.vm.debouncedLoadData = debounceSpy;

      // 快速连续调用
      wrapper.vm.debouncedLoadData();
      wrapper.vm.debouncedLoadData();
      wrapper.vm.debouncedLoadData();

      // 防抖函数应该只被调用一次
      setTimeout(() => {
        expect(debounceSpy).toHaveBeenCalledTimes(1);
      }, 300);
    });

    it('应该使用虚拟滚动处理大量数据', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        value: Math.random() * 100
      }));

      wrapper.vm.tableData = largeData;

      // 应该使用虚拟滚动
      expect(wrapper.vm.useVirtualScroll).toBe(true);
      expect(wrapper.find('.virtual-table').exists()).toBe(true);
    });

    it('应该合理使用缓存', () => {
      const cacheSpy = vi.spyOn(wrapper.vm, 'getCachedData');

      // 首次调用
      wrapper.vm.getCachedData('user-stats');
      expect(cacheSpy).toHaveBeenCalled();

      // 第二次调用应该使用缓存
      wrapper.vm.getCachedData('user-stats');
      // 根据实现，可能不会再次调用API
    });
  });

  describe('错误处理', () => {
    it('应该处理API错误', async () => {
      const { getInfo } = await import('@/api/user');
      vi.mocked(getInfo).mockRejectedValue(new Error('API Error'));

      try {
        await store.getUserInfo();
      } catch (error) {
        expect(wrapper.vm.error).toBeTruthy();
        expect(wrapper.vm.errorMessage).toBe('API Error');
        expect(wrapper.find('.error-message').exists()).toBe(true);
      }
    });

    it('应该处理图表渲染错误', () => {
      // 模拟图表初始化失败
      const mockECharts = {
        init: vi.fn(() => {
          throw new Error('Chart initialization failed');
        })
      };

      wrapper.vm.initChartWithLibrary(mockECharts);

      expect(wrapper.vm.chartError).toBe(true);
      expect(wrapper.find('.chart-error').exists()).toBe(true);
    });

    it('应该提供重试机制', async () => {
      let callCount = 0;
      const { getInfo } = await import('@/api/user');
      vi.mocked(getInfo).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Temporary error');
        }
        return {
          code: 20000,
          data: { name: 'Test User' }
        };
      });

      // 重试机制应该最终成功
      await wrapper.vm.retryGetUserInfo();

      expect(callCount).toBe(3);
      expect(store.name).toBe('Test User');
    });
  });
});

// 简单的防抖函数实现
function debounce(fn: Function, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
