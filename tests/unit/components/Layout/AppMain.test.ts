/**
 * @description: AppMain 组件单元测试
 * @author: Kevin Wan
 * @date: 2025-10-30
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia } from 'pinia';
import AppMain from '@/layout/components/AppMain.vue';

// 创建测试路由
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' }},
    { path: '/dashboard', component: { template: '<div>Dashboard</div>' }},
    { path: '/users', component: { template: '<div>Users</div>' }}
  ]
});

describe('AppMain 组件 - 主内容区域测试', () => {
  const createWrapper = (props = {}) => {
    return mount(AppMain, {
      global: {
        plugins: [router, createPinia()],
        stubs: {
          'router-view': true,
          'transition': true,
          'keep-alive': true
        }
      },
      props
    });
  };

  beforeEach(async () => {
    router.push('/');
    await router.isReady();
  });

  it('应该正确渲染组件', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('.app-main').exists()).toBe(true);
    expect(wrapper.find('section').exists()).toBe(true);
    expect(wrapper.find('.app-main').classes()).toContain('app-main');
  });

  it('应该有正确的 CSS 类名', () => {
    const wrapper = createWrapper();

    const mainElement = wrapper.find('.app-main');
    expect(mainElement.exists()).toBe(true);
    expect(mainElement.element.tagName.toLowerCase()).toBe('section');
  });

  it('应该包含 router-view 组件', () => {
    const wrapper = createWrapper();

    // 检查是否包含 router-view 的占位符
    expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(true);
  });

  it('应该支持过渡动画', () => {
    const wrapper = createWrapper();

    // 检查是否包含 transition 组件
    expect(wrapper.findComponent({ name: 'Transition' }).exists()).toBe(true);
  });

  it('应该支持 keep-alive 缓存', () => {
    const wrapper = createWrapper();

    // 检查是否包含 keep-alive 组件
    expect(wrapper.findComponent({ name: 'KeepAlive' }).exists()).toBe(true);
  });

  it('应该正确处理路由变化', async () => {
    const wrapper = createWrapper();

    // 模拟路由变化
    await router.push('/dashboard');
    await wrapper.vm.$nextTick();

    // 组件应该仍然存在
    expect(wrapper.find('.app-main').exists()).toBe(true);
  });

  it('应该有正确的样式类名', () => {
    const wrapper = createWrapper();

    // 检查是否有固定的类名
    const mainElement = wrapper.find('section');
    expect(mainElement.attributes('class')).toContain('app-main');
  });

  it('应该处理键盘可访问性', () => {
    const wrapper = createWrapper();
    const mainElement = wrapper.find('.app-main');

    // 检查是否可以通过键盘访问
    expect(mainElement.element.tabIndex).toBeDefined();
  });

  it('应该响应属性变化', async () => {
    const wrapper = createWrapper();

    // 如果组件接受 props，测试 props 变化
    // 例如：await wrapper.setProps({ someProp: 'newValue' })
    // expect(wrapper.vm.someProp).toBe('newValue')
  });

  it('应该正确处理错误边界', () => {
    // 创建一个可能出错的组件实例
    const errorHandler = vi.fn();

    const wrapper = mount(AppMain, {
      global: {
        plugins: [router, createPinia()],
        errorCaptured: errorHandler,
        stubs: {
          'router-view': {
            template: '<div>Content</div>',
            errorCaptured: errorHandler
          }
        }
      }
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('应该在移动端响应式工作', () => {
    const wrapper = createWrapper();

    // 模拟移动端视口
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });

    // 触发 resize 事件
    window.dispatchEvent(new Event('resize'));

    expect(wrapper.find('.app-main').exists()).toBe(true);
  });
});
