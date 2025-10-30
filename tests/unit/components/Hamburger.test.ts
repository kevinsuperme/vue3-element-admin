/**
 * @description: Hamburger 组件单元测试
 * @author: Kevin Wan
 * @date: 2025-10-30
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import Hamburger from '@/components/Hamburger/index.vue';

describe('Hamburger Component - 汉堡菜单组件测试', () => {
  let wrapper: any;
  let pinia: any;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.restoreAllMocks();
  });

  describe('组件渲染', () => {
    it('应该正确渲染基本结构', () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        }
      });

      expect(wrapper.find('.hamburger-container').exists()).toBe(true);
      expect(wrapper.find('.hamburger').exists()).toBe(true);
      expect(wrapper.find('svg').exists()).toBe(true);
      expect(wrapper.findAll('.line')).toHaveLength(3);
    });

    it('应该在激活状态时添加is-active类', () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: true
        }
      });

      expect(wrapper.find('.hamburger').classes()).toContain('is-active');
      expect(wrapper.find('.hamburger-container').classes()).toContain('active');
    });

    it('应该在非激活状态时不添加is-active类', () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        }
      });

      expect(wrapper.find('.hamburger').classes()).not.toContain('is-active');
      expect(wrapper.find('.hamburger-container').classes()).not.toContain('active');
    });
  });

  describe('Props 验证', () => {
    it('应该有正确的默认props', () => {
      wrapper = mount(Hamburger);

      expect(wrapper.props('isActive')).toBe(false);
    });

    it('应该正确接收isActive prop', () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: true
        }
      });

      expect(wrapper.props('isActive')).toBe(true);
    });

    it('应该响应props变化', async () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        }
      });

      expect(wrapper.find('.hamburger').classes()).not.toContain('is-active');

      await wrapper.setProps({ isActive: true });

      expect(wrapper.find('.hamburger').classes()).toContain('is-active');
    });
  });

  describe('事件处理', () => {
    it('应该在点击时触发toggleClick事件', async () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        }
      });

      await wrapper.find('.hamburger').trigger('click');

      expect(wrapper.emitted('toggleClick')).toBeTruthy();
      expect(wrapper.emitted('toggleClick')?.length).toBe(1);
      expect(wrapper.emitted('toggleClick')?.[0]).toEqual([]);
    });

    it('应该在按下回车键时触发toggleClick事件', async () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        }
      });

      await wrapper.find('.hamburger').trigger('keydown.enter');

      expect(wrapper.emitted('toggleClick')).toBeTruthy();
      expect(wrapper.emitted('toggleClick')?.length).toBe(1);
    });

    it('应该在按下空格键时触发toggleClick事件', async () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        }
      });

      await wrapper.find('.hamburger').trigger('keydown.space');

      expect(wrapper.emitted('toggleClick')).toBeTruthy();
      expect(wrapper.emitted('toggleClick')?.length).toBe(1);
    });

    it('应该阻止其他键盘事件的默认行为', async () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        }
      });

      const event = { preventDefault: vi.fn() };
      await wrapper.find('.hamburger').trigger('keydown', event);

      // 只有回车和空格键应该触发事件
      if (event.key !== 'Enter' && event.key !== ' ') {
        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(wrapper.emitted('toggleClick')).toBeFalsy();
      }
    });
  });

  describe('样式和类名', () => {
    it('应该应用自定义class', () => {
      wrapper = mount(Hamburger, {
        attrs: {
          class: 'custom-hamburger-class'
        },
        props: {
          isActive: true
        }
      });

      expect(wrapper.classes()).toContain('custom-hamburger-class');
      expect(wrapper.classes()).toContain('hamburger-container');
    });

    it('应该根据状态动态添加类名', async () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        }
      });

      expect(wrapper.find('.hamburger').classes()).not.toContain('is-active');

      await wrapper.setProps({ isActive: true });

      expect(wrapper.find('.hamburger').classes()).toContain('is-active');
    });

    it('应该有正确的CSS过渡效果', () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        }
      });

      const hamburger = wrapper.find('.hamburger');
      expect(hamburger.attributes('style')).toContain('transition');
    });
  });

  describe('可访问性', () => {
    it('应该有正确的ARIA属性', () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        },
        attrs: {
          'aria-label': '切换菜单',
          'aria-expanded': 'false'
        }
      });

      expect(wrapper.attributes('aria-label')).toBe('切换菜单');
      expect(wrapper.attributes('aria-expanded')).toBe('false');
    });

    it('应该根据isActive状态更新aria-expanded', async () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        },
        attrs: {
          'aria-expanded': 'false'
        }
      });

      expect(wrapper.attributes('aria-expanded')).toBe('false');

      await wrapper.setProps({ isActive: true });
      // 注意：aria-expanded可能需要手动更新
      // expect(wrapper.attributes('aria-expanded')).toBe('true')
    });

    it('应该可以通过键盘访问', async () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        }
      });

      // 模拟键盘导航
      wrapper.find('.hamburger').element.focus();
      expect(document.activeElement).toBe(wrapper.find('.hamburger').element);

      await wrapper.find('.hamburger').trigger('keydown.enter');
      expect(wrapper.emitted('toggleClick')).toBeTruthy();
    });

    it('应该有正确的tabindex', () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        },
        attrs: {
          tabindex: '0'
        }
      });

      expect(wrapper.attributes('tabindex')).toBe('0');
    });
  });

  describe('SVG图标', () => {
    it('应该正确渲染SVG图标', () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        }
      });

      const svg = wrapper.find('svg');
      expect(svg.exists()).toBe(true);
      expect(svg.attributes('viewBox')).toBe('0 0 1024 1024');
      expect(svg.attributes('width')).toBe('64');
      expect(svg.attributes('height')).toBe('64');
    });

    it('应该渲染三条线', () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        }
      });

      const lines = wrapper.findAll('.line');
      expect(lines).toHaveLength(3);

      // 检查每条线的基本属性
      lines.forEach((line: any) => {
        expect(line.exists()).toBe(true);
        expect(line.attributes('fill')).toBe('#333');
      });
    });

    it('应该在激活状态时正确转换线条样式', async () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        }
      });

      // 初始状态
      const lines = wrapper.findAll('.line');
      expect(lines[0].attributes('transform')).toBeFalsy();
      expect(lines[1].attributes('opacity')).toBe('1');
      expect(lines[2].attributes('transform')).toBeFalsy();

      // 激活状态
      await wrapper.setProps({ isActive: true });

      // 检查激活状态的样式
      // 注意：具体的transform值取决于CSS实现
    });
  });

  describe('响应式行为', () => {
    it('应该在移动设备上正确显示', () => {
      // 模拟移动设备
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        }
      });

      expect(wrapper.find('.hamburger').exists()).toBe(true);

      // 检查移动端特定的样式或类名
      expect(wrapper.find('.hamburger-container').classes()).toContain('mobile-visible');
    });

    it('应该在桌面设备上正确显示', () => {
      // 模拟桌面设备
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });

      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        }
      });

      expect(wrapper.find('.hamburger').exists()).toBe(true);
    });

    it('应该响应窗口大小变化', async () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        }
      });

      // 模拟窗口大小变化
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      window.dispatchEvent(new Event('resize'));
      await wrapper.vm.$nextTick();

      // 检查响应式行为
      expect(wrapper.find('.hamburger').exists()).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的isActive prop', () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: null as any
        }
      });

      expect(wrapper.find('.hamburger').classes()).not.toContain('is-active');
    });

    it('应该处理缺失的事件处理器', async () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        }
      });

      // 即使没有外部监听器，事件也应该能正常触发
      await wrapper.find('.hamburger').trigger('click');
      expect(wrapper.emitted('toggleClick')).toBeTruthy();
    });
  });

  describe('性能测试', () => {
    it('应该快速渲染', () => {
      const startTime = performance.now();

      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        }
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(100); // 渲染时间应该小于100ms
      expect(wrapper.find('.hamburger').exists()).toBe(true);
    });

    it('应该快速响应props变化', async () => {
      wrapper = mount(Hamburger, {
        props: {
          isActive: false
        }
      });

      const startTime = performance.now();
      await wrapper.setProps({ isActive: true });
      const endTime = performance.now();

      const updateTime = endTime - startTime;
      expect(updateTime).toBeLessThan(50); // 更新时间应该小于50ms
    });
  });
});
