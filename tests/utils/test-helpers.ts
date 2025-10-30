/**
 * @description: 测试辅助工具函数
 * @author: Kevin Wan
 * @date: 2025-10-30
 */

import { mount, VueWrapper } from '@vue/test-utils';
import { createRouter, createWebHistory, Router } from 'vue-router';
import { createPinia, Pinia } from 'pinia';
import { ComponentPublicInstance } from 'vue';

// 测试组件配置接口
export interface TestComponentOptions {
  router?: boolean
  pinia?: boolean
  stubs?: Record<string, any>
  mocks?: Record<string, any>
  props?: Record<string, any>
  plugins?: any[]
}

// 创建测试路由
export function createTestRouter(routes: any[] = []): Router {
  return createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        component: { template: '<div>Home</div>' }
      },
      ...routes
    ]
  });
}

// 创建测试 Pinia 实例
export function createTestPinia(): Pinia {
  return createPinia();
}

// 创建测试组件包装器
export async function createTestWrapper<T extends ComponentPublicInstance>(
  component: any,
  options: TestComponentOptions = {}
): Promise<VueWrapper<T>> {
  const {
    router: useRouter = true,
    pinia: usePinia = true,
    stubs = {},
    mocks = {},
    props = {},
    plugins = []
  } = options;

  const globalConfig: any = {
    stubs: {
      // 默认存根组件
      'router-link': true,
      'router-view': true,
      'transition': true,
      'transition-group': true,
      ...stubs
    },
    mocks: {
      // 默认 mock 对象
      $t: (key: string) => key,
      $router: {
        push: vi.fn(),
        replace: vi.fn(),
        go: vi.fn(),
        back: vi.fn(),
        forward: vi.fn()
      },
      $route: {
        path: '/',
        params: {},
        query: {},
        meta: {}
      },
      ...mocks
    }
  };

  // 添加插件
  const pluginList = [];

  if (useRouter) {
    const router = createTestRouter();
    pluginList.push(router);
    await router.isReady();
  }

  if (usePinia) {
    pluginList.push(createTestPinia());
  }

  pluginList.push(...plugins);

  globalConfig.plugins = pluginList;

  return mount(component, {
    global: globalConfig,
    props
  });
}

// 等待下一个 tick
export async function nextTick(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
}

// 等待指定时间
export async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

// 模拟用户输入
export async function simulateInput(
  wrapper: VueWrapper,
  selector: string,
  value: string
): Promise<void> {
  const input = wrapper.find(selector);
  if (input.exists()) {
    await input.setValue(value);
    await input.trigger('input');
    await input.trigger('blur');
    await nextTick();
  } else {
    throw new Error(`Input element not found: ${selector}`);
  }
}

// 模拟按钮点击
export async function simulateClick(
  wrapper: VueWrapper,
  selector: string
): Promise<void> {
  const button = wrapper.find(selector);
  if (button.exists()) {
    await button.trigger('click');
    await nextTick();
  } else {
    throw new Error(`Button element not found: ${selector}`);
  }
}

// 模拟表单提交
export async function simulateFormSubmit(
  wrapper: VueWrapper,
  formSelector: string = 'form'
): Promise<void> {
  const form = wrapper.find(formSelector);
  if (form.exists()) {
    await form.trigger('submit');
    await nextTick();
  } else {
    throw new Error(`Form element not found: ${formSelector}`);
  }
}

// 检查元素是否存在
export function expectElementExists(
  wrapper: VueWrapper,
  selector: string
): void {
  const element = wrapper.find(selector);
  if (!element.exists()) {
    throw new Error(`Expected element to exist: ${selector}`);
  }
}

// 检查元素是否不存在
export function expectElementNotExists(
  wrapper: VueWrapper,
  selector: string
): void {
  const element = wrapper.find(selector);
  if (element.exists()) {
    throw new Error(`Expected element not to exist: ${selector}`);
  }
}

// 检查元素文本内容
export function expectElementText(
  wrapper: VueWrapper,
  selector: string,
  expectedText: string | RegExp
): void {
  const element = wrapper.find(selector);
  expectElementExists(wrapper, selector);

  const actualText = element.text();
  if (typeof expectedText === 'string') {
    expect(actualText).toContain(expectedText);
  } else {
    expect(actualText).toMatch(expectedText);
  }
}

// 检查元素属性
export function expectElementAttribute(
  wrapper: VueWrapper,
  selector: string,
  attribute: string,
  expectedValue?: string
): void {
  const element = wrapper.find(selector);
  expectElementExists(wrapper, selector);

  if (expectedValue !== undefined) {
    expect(element.attributes(attribute)).toBe(expectedValue);
  } else {
    expect(element.attributes(attribute)).toBeDefined();
  }
}

// 检查元素 CSS 类
export function expectElementClass(
  wrapper: VueWrapper,
  selector: string,
  expectedClass: string
): void {
  const element = wrapper.find(selector);
  expectElementExists(wrapper, selector);
  expect(element.classes()).toContain(expectedClass);
}

// 创建 Mock API 响应
export function createMockApiResponse<T>(data: T, success = true) {
  return {
    success,
    data,
    message: success ? 'Success' : 'Error',
    code: success ? 200 : 400
  };
}

// 创建 Mock 错误
export function createMockError(message: string, code = 500) {
  const error = new Error(message) as any;
  error.code = code;
  error.response = {
    status: code,
    data: { message }
  };
  return error;
}

// 模拟网络延迟
export async function simulateNetworkDelay(ms: number = 100): Promise<void> {
  await sleep(ms);
}

// 检查控制台调用
export function expectConsoleCall(
  spy: any,
  method: 'log' | 'warn' | 'error' | 'info',
  ...args: any[]
): void {
  expect(spy[method]).toHaveBeenCalledWith(...args);
}

// 清理函数
export function cleanup(wrapper?: VueWrapper): void {
  if (wrapper) {
    wrapper.unmount();
  }
  vi.clearAllMocks();
}

// 常用测试数据
export const TEST_DATA = {
  USER: {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin'
  },
  LOGIN_FORM: {
    username: 'admin',
    password: '123456'
  },
  API_RESPONSES: {
    LOGIN_SUCCESS: {
      success: true,
      data: {
        token: 'test-token',
        user: TEST_DATA.USER
      }
    },
    LOGIN_FAILED: {
      success: false,
      message: 'Invalid credentials'
    }
  }
} as const;

// 测试常量
export const TEST_SELECTORS = {
  FORM: 'form',
  INPUT: 'input',
  BUTTON: 'button',
  SUBMIT_BUTTON: 'button[type="submit"]',
  ERROR_MESSAGE: '.error-message',
  SUCCESS_MESSAGE: '.success-message',
  LOADING_SPINNER: '.loading-spinner'
} as const;

// 性能测试辅助
export function measurePerformance<T>(
  fn: () => T | Promise<T>,
  label: string
): Promise<{ result: T; duration: number }> {
  return new Promise(async (resolve) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    console.log(`${label}: ${duration.toFixed(2)}ms`);
    resolve({ result, duration });
  });
}
