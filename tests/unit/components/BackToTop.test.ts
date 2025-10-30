/**
 * BackToTop组件单元测试
 * @description: 测试返回顶部组件的功能和性能优化
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import BackToTop from '@/components/BackToTop/index.vue';

// Mock window对象的方法
const mockScrollTo = vi.fn();
const mockGetComputedStyle = vi.fn();
const mockRequestAnimationFrame = vi.fn();
const mockCancelAnimationFrame = vi.fn();

Object.defineProperty(window, 'scrollTo', {
  value: mockScrollTo,
  writable: true
});

Object.defineProperty(window, 'getComputedStyle', {
  value: mockGetComputedStyle,
  writable: true
});

Object.defineProperty(window, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: mockCancelAnimationFrame,
  writable: true
});

Object.defineProperty(window, 'pageYOffset', {
  value: 0,
  writable: true
});

Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now())
  },
  writable: true
});

describe('BackToTop Component', () => {
  let wrapper: any;

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = mount(BackToTop, {
      props: {
        visibilityHeight: 200,
        backPosition: 0
      }
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('初始渲染', () => {
    it('应该正确渲染组件', () => {
      expect(wrapper.find('.back-to-ceiling').exists()).toBe(true);
      expect(wrapper.find('svg').exists()).toBe(true);
    });

    it('应该默认隐藏组件', () => {
      expect(wrapper.vm.visible).toBe(false);
      const element = wrapper.find('.back-to-ceiling');
      expect(element.isVisible()).toBe(false);
    });

    it('应该应用自定义样式', () => {
      const customStyle = {
        right: '100px',
        bottom: '100px',
        width: '50px',
        height: '50px'
      };

      wrapper = mount(BackToTop, {
        props: {
          customStyle
        }
      });

      const element = wrapper.find('.back-to-ceiling');
      expect(element.attributes('style')).toContain('right: 100px');
      expect(element.attributes('style')).toContain('bottom: 100px');
    });
  });

  describe('滚动显示/隐藏', () => {
    it('应该在滚动超过阈值时显示', async () => {
      // 模拟滚动超过阈值
      Object.defineProperty(window, 'pageYOffset', {
        value: 300,
        writable: true
      });

      // 触发滚动事件
      window.dispatchEvent(new Event('scroll'));
      await nextTick();

      expect(wrapper.vm.visible).toBe(true);
    });

    it('应该在滚动未超过阈值时隐藏', async () => {
      // 模拟滚动未超过阈值
      Object.defineProperty(window, 'pageYOffset', {
        value: 100,
        writable: true
      });

      // 触发滚动事件
      window.dispatchEvent(new Event('scroll'));
      await nextTick();

      expect(wrapper.vm.visible).toBe(false);
    });

    it('应该使用防抖处理滚动事件', async () => {
      const scrollSpy = vi.spyOn(wrapper.vm, 'handleScroll');

      // 连续触发多次滚动事件
      for (let i = 0; i < 5; i++) {
        Object.defineProperty(window, 'pageYOffset', {
          value: 300,
          writable: true
        });
        window.dispatchEvent(new Event('scroll'));
      }

      await nextTick();

      // 由于防抖，handleScroll应该只被调用有限次数
      expect(scrollSpy).toHaveBeenCalled();
    });
  });

  describe('点击返回顶部', () => {
    beforeEach(() => {
      // 模拟滚动位置
      Object.defineProperty(window, 'pageYOffset', {
        value: 500,
        writable: true
      });

      // 触发显示
      window.dispatchEvent(new Event('scroll'));
      return nextTick();
    });

    it('应该在点击时触发返回顶部动画', async () => {
      mockRequestAnimationFrame.mockImplementation((callback: any) => {
        callback(0); // 立即执行回调用于测试
        return 1;
      });

      const button = wrapper.find('.back-to-ceiling');
      await button.trigger('click');

      expect(wrapper.vm.isMoving).toBe(true);
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('应该在动画进行时阻止重复点击', async () => {
      mockRequestAnimationFrame.mockImplementation(() => 1); // 返回ID但不执行回调

      wrapper.vm.isMoving = true;
      const button = wrapper.find('.back-to-ceiling');
      await button.trigger('click');

      expect(mockRequestAnimationFrame).not.toHaveBeenCalled();
    });

    it('应该在动画完成时重置状态', async () => {
      let animationCallback: any;
      mockRequestAnimationFrame.mockImplementation((callback) => {
        animationCallback = callback;
        return 1;
      });

      const button = wrapper.find('.back-to-ceiling');
      await button.trigger('click');

      expect(wrapper.vm.isMoving).toBe(true);

      // 执行动画回调
      animationCallback(0);
      animationCallback(516); // 模拟动画完成

      expect(wrapper.vm.isMoving).toBe(false);
    });

    it('应该调用window.scrollTo方法', async () => {
      let animationCallback: any;
      mockRequestAnimationFrame.mockImplementation((callback) => {
        animationCallback = callback;
        return 1;
      });

      const button = wrapper.find('.back-to-ceiling');
      await button.trigger('click');

      // 执行动画回调
      animationCallback(0);

      expect(mockScrollTo).toHaveBeenCalled();
    });
  });

  describe('性能优化', () => {
    it('应该使用passive事件监听器', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      const newWrapper = mount(BackToTop);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      );

      newWrapper.unmount();
      addEventListenerSpy.mockRestore();
    });

    it('应该在组件卸载时清理所有定时器', () => {
      const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame');

      wrapper.vm.scrollTimer = 123;
      wrapper.vm.animationId = 456;

      wrapper.unmount();

      expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(123);
      expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(456);

      cancelAnimationFrameSpy.mockRestore();
    });

    it('应该正确清理旧的定时器', async () => {
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

      // 第一次调用
      mockRequestAnimationFrame.mockReturnValue(1);
      wrapper.vm.handleScroll();

      // 第二次调用应该清理第一次的定时器
      mockRequestAnimationFrame.mockReturnValue(2);
      wrapper.vm.handleScroll();

      expect(cancelSpy).toHaveBeenCalledWith(1);

      cancelSpy.mockRestore();
    });
  });

  describe('缓动函数', () => {
    it('easeInOutQuad应该返回正确的缓动值', () => {
      // 测试前半段
      const result1 = wrapper.vm.easeInOutQuad(125, 100, -100, 500);
      expect(result1).toBeCloseTo(50, 0);

      // 测试后半段
      const result2 = wrapper.vm.easeInOutQuad(375, 100, -100, 500);
      expect(result2).toBeCloseTo(50, 0);

      // 测试边界值
      const result3 = wrapper.vm.easeInOutQuad(0, 100, -100, 500);
      expect(result3).toBe(100);

      const result4 = wrapper.vm.easeInOutQuad(500, 100, -100, 500);
      expect(result4).toBe(0);
    });
  });

  describe('Props验证', () => {
    it('应该接受正确的props', () => {
      const props = {
        visibilityHeight: 300,
        backPosition: 100,
        customStyle: { right: '50px' },
        transitionName: 'fade'
      };

      const testWrapper = mount(BackToTop, { props });

      expect(testWrapper.vm.visibilityHeight).toBe(300);
      expect(testWrapper.vm.backPosition).toBe(100);
      expect(testWrapper.vm.transitionName).toBe('fade');
    });
  });

  describe('边界情况处理', () => {
    it('应该在当前位置等于返回位置时停止动画', async () => {
      Object.defineProperty(window, 'pageYOffset', {
        value: 0,
        writable: true
      });

      wrapper.vm.backPosition = 0;

      let animationCallback: any;
      mockRequestAnimationFrame.mockImplementation((callback) => {
        animationCallback = callback;
        return 1;
      });

      const button = wrapper.find('.back-to-ceiling');
      await button.trigger('click');

      animationCallback(0);

      expect(wrapper.vm.isMoving).toBe(false);
      expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
    });

    it('应该处理自定义返回位置', async () => {
      wrapper.setProps({ backPosition: 100 });

      Object.defineProperty(window, 'pageYOffset', {
        value: 500,
        writable: true
      });

      let animationCallback: any;
      mockRequestAnimationFrame.mockImplementation((callback) => {
        animationCallback = callback;
        return 1;
      });

      const button = wrapper.find('.backToCeiling');
      await button.trigger('click');

      animationCallback(516); // 模拟动画完成

      expect(mockScrollTo).toHaveBeenCalledWith(0, 100);
    });
  });
});
