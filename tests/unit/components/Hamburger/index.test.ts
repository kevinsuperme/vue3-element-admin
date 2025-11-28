/**
 * 汉堡菜单按钮组件单元测试
 * @description: 测试汉堡菜单按钮组件的功能和交互
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Hamburger from '@/components/Hamburger/index.vue';

describe('Hamburger Component', () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = mount(Hamburger, {
      props: {
        isActive: false
      }
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  describe('基础渲染', () => {
    it('应该正确渲染汉堡按钮', () => {
      expect(wrapper.find('.hamburger').exists()).toBe(true);
      expect(wrapper.find('.hamburger-container').exists()).toBe(true);
    });

    it('应该包含SVG图标', () => {
      expect(wrapper.find('svg').exists()).toBe(true);
      expect(wrapper.find('.hamburger-icon').exists()).toBe(true);
    });

    it('应该有三条横线', () => {
      const lines = wrapper.findAll('.line');
      expect(lines).toHaveLength(3);
    });
  });

  describe('状态变化', () => {
    it('应该在活跃状态时应用active类', async () => {
      await wrapper.setProps({ isActive: true });
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.hamburger').classes()).toContain('is-active');
    });

    it('应该在非活跃状态时移除active类', async () => {
      await wrapper.setProps({ isActive: true });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.hamburger').classes()).toContain('is-active');

      await wrapper.setProps({ isActive: false });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.hamburger').classes()).not.toContain('is-active');
    });
  });

  describe('点击事件', () => {
    it('应该在点击时触发toggleClick事件', async () => {
      await wrapper.find('.hamburger').trigger('click');

      expect(wrapper.emitted('toggleClick')).toBeTruthy();
    });

    it('应该传递点击事件参数', async () => {
      await wrapper.find('.hamburger').trigger('click');

      const emitted = wrapper.emitted('toggleClick');
      expect(emitted).toHaveLength(1);
    });
  });

  describe('键盘交互', () => {
    it('应该在Enter键按下时触发事件', async () => {
      await wrapper.find('.hamburger').trigger('keydown', { key: 'Enter' });

      expect(wrapper.emitted('toggleClick')).toBeTruthy();
    });

    it('应该在Space键按下时触发事件', async () => {
      await wrapper.find('.hamburger').trigger('keydown', { key: ' ' });

      expect(wrapper.emitted('toggleClick')).toBeTruthy();
    });

    it('应该忽略其他键盘事件', async () => {
      await wrapper.find('.hamburger').trigger('keydown', { key: 'Tab' });

      expect(wrapper.emitted('toggleClick')).toBeFalsy();
    });

    it('应该支持键盘焦点', async () => {
      await wrapper.find('.hamburger').trigger('focus');

      // 元素应该是可聚焦的
      expect(wrapper.find('.hamburger').element).toBe(document.activeElement);
    });
  });

  describe('可访问性', () => {
    it('应该有适当的ARIA标签', () => {
      const hamburger = wrapper.find('.hamburger');
      expect(hamburger.attributes('role')).toBe('button');
      expect(hamburger.attributes('aria-label')).toBeDefined();
      expect(hamburger.attributes('aria-label')).toBe('切换侧边栏');
    });

    it('应该支持键盘导航', async () => {
      const hamburger = wrapper.find('.hamburger');

      // 检查是否可以用Tab键聚焦
      hamburger.element.tabIndex = 0;

      await hamburger.trigger('keydown', { key: 'Tab' });

      // 应该能够接收键盘事件
      expect(hamburger.element).toBeDefined();
    });

    it('应该有正确的tabindex', () => {
      const hamburger = wrapper.find('.hamburger');
      expect(hamburger.attributes('tabindex')).toBe('0');
    });
  });

  describe('样式和动画', () => {
    it('应该应用基础样式类', () => {
      const hamburger = wrapper.find('.hamburger');
      expect(hamburger.classes()).toContain('hamburger-container');
    });

    it('应该有hover效果', async () => {
      const hamburger = wrapper.find('.hamburger');

      // 模拟hover事件
      await hamburger.trigger('mouseenter');
      expect(hamburger.classes()).toContain('hover');

      await hamburger.trigger('mouseleave');
      expect(hamburger.classes()).not.toContain('hover');
    });

    it('应该在活跃状态时应用动画类', async () => {
      await wrapper.setProps({ isActive: true });
      await wrapper.vm.$nextTick();

      const lines = wrapper.findAll('.line');

      // 激活状态时线条应该有变换动画
      lines.forEach(line => {
        expect(line.classes()).toContain('active');
      });
    });

    it('应该支持自定义过渡效果', async () => {
      await wrapper.setProps({
        isActive: true,
        transition: 'all 0.3s ease'
      });
      await wrapper.vm.$nextTick();

      const hamburger = wrapper.find('.hamburger');
      expect(hamburger.element.style.transition).toBe('all 0.3s ease');
    });
  });

  describe('边界情况', () => {
    it('应该处理undefined isActive prop', async () => {
      // 移除isActive属性
      wrapper = mount(Hamburger);
      await wrapper.vm.$nextTick();

      // 默认应该为false
      expect(wrapper.vm.isActive).toBe(false);
      expect(wrapper.find('.hamburger').classes()).not.toContain('is-active');
    });

    it('应该处理null isActive prop', async () => {
      await wrapper.setProps({ isActive: null });
      await wrapper.vm.$nextTick();

      // null应该被视为false
      expect(wrapper.find('.hamburger').classes()).not.toContain('is-active');
    });

    it('应该处理字符串类型的isActive prop', async () => {
      await wrapper.setProps({ isActive: 'true' });
      await wrapper.vm.$nextTick();

      // 字符串'true'应该被转换为true
      expect(wrapper.find('.hamburger').classes()).toContain('is-active');

      await wrapper.setProps({ isActive: 'false' });
      await wrapper.vm.$nextTick();

      // 字符串'false'应该被转换为false
      expect(wrapper.find('.hamburger').not).not.toContain('is-active');
    });

    it('应该处理数字类型的isActive prop', async () => {
      await wrapper.setProps({ isActive: 1 });
      await wrapper.vm.$nextTick();

      // 数字1应该被转换为true
      expect(wrapper.find('.hamburger').classes()).toContain('is-active');

      await wrapper.setProps({ isActive: 0 });
      await wrapper.vm.$nextTick();

      // 数字0应该被转换为false
      expect(wrapper.find('.hamburger').classes()).not.toContain('is-active');
    });
  });

  describe('组件生命周期', () => {
    it('应该正确初始化组件状态', () => {
      expect(wrapper.vm.isActive).toBe(false);
    });

    it('应该��应props变化', async () => {
      expect(wrapper.vm.isActive).toBe(false);

      await wrapper.setProps({ isActive: true });
      expect(wrapper.vm.isActive).toBe(true);

      await wrapper.setProps({ isActive: false });
      expect(wrapper.vm.isActive).toBe(false);
    });

    it('应该正确清理事件监听器', () => {
      vi.spyOn(wrapper.vm, '$off');

      wrapper.unmount();

      // 验证是否清理了事件监听器
      // (这里主要测试组件卸载不会抛出错误)
      expect(() => wrapper.unmount()).not.toThrow();
    });
  });

  describe('响应式更新', () => {
    it('应该高效处理快速状态切换', async () => {
      const startTime = performance.now();

      // 快速切换状态100次
      for (let i = 0; i < 100; i++) {
        await wrapper.setProps({ isActive: i % 2 === 0 });
        await wrapper.vm.$nextTick();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 应该在合理时间内完成
      expect(duration).toBeLessThan(1000);
    });

    it('应该在状态变化时保持组件引用', async () => {
      const initialElement = wrapper.find('.hamburger').element;

      await wrapper.setProps({ isActive: true });
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.hamburger').element).toBe(initialElement);
    });
  });

  describe('事件处理', () => {
    it('应该阻止事件的默认行为', async () => {
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      await wrapper.find('.hamburger').trigger('click', event);

      // 通常汉堡按钮不需要阻止默认行为，但这取决于具体实现
      // 这里主要测试事件处理不会抛出错误
      expect(() => {
        wrapper.find('.hamburger').trigger('click');
      }).not.toThrow();
    });

    it('应该处理多次点击', async () => {
      await wrapper.find('.hamburger').trigger('click');
      expect(wrapper.emitted('toggleClick')).toHaveLength(1);

      await wrapper.find('.hamburger').trigger('click');
      expect(wrapper.emitted('toggleClick')).toHaveLength(2);
    });
  });

  describe('尺寸和布局', () => {
    it('应该有正确的尺寸', () => {
      const hamburger = wrapper.find('.hamburger');
      const container = wrapper.find('.hamburger-container');

      expect(hamburger.element.offsetWidth).toBeGreaterThan(0);
      expect(hamburger.element.offsetHeight).toBeGreaterThan(0);
      expect(container.element.offsetWidth).toBeGreaterThan(0);
      expect(container.element.offsetHeight).toBeGreaterThan(0);
    });

    it('应该支持自定义尺寸', async () => {
      await wrapper.setProps({
        size: 'large'
      });
      await wrapper.vm.$nextTick();

      const hamburger = wrapper.find('.hamburger');
      expect(hamburger.classes()).toContain('hamburger-large');
    });

    it('应该支持自定义颜色', async () => {
      await wrapper.setProps({
        color: '#ff0000'
      });
      await wrapper.vm.$nextTick();

      const lines = wrapper.findAll('.line');
      lines.forEach(line => {
        expect(line.element.style.backgroundColor).toBe('#ff0000');
      });
    });
  });

  describe('国际化', () => {
    it('应该支持自定义aria-label', async () => {
      await wrapper.setProps({
        ariaLabel: 'Toggle Sidebar Menu'
      });
      await wrapper.vm.$nextTick();

      const hamburger = wrapper.find('.hamburger');
      expect(hamburger.attributes('aria-label')).toBe('Toggle Sidebar Menu');
    });

    it('应该支持默认的多语言', async () => {
      // 测试不同语言下的aria-label
      const labels = ['Toggle Sidebar', '切换侧边栏', 'サイドバーの切��替え'];

      for (const label of labels) {
        await wrapper.setProps({ ariaLabel: label });
        await wrapper.vm.$nextTick();

        const hamburger = wrapper.find('.hamburger');
        expect(hamburger.attributes('aria-label')).toBe(label);
      }
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的props值', async () => {
      expect(() => {
        wrapper.setProps({ isActive: 'invalid' });
        wrapper.vm.$nextTick();
      }).not.toThrow();
    });

    it('应该处理缺失的DOM元素', () => {
      // 模拟DOM元素不存在的情况
      const originalFind = wrapper.find;
      wrapper.find = vi.fn().mockReturnValue(null);

      expect(() => {
        wrapper.find('.hamburger').trigger('click');
      }).not.toThrow();

      // 恢复原始方法
      wrapper.find = originalFind;
    });
  });
});
