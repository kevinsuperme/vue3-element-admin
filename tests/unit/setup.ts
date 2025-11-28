/**
 * @description: 单元测试环境设置
 * @author: Kevin Wan
 * @date: 2025-10-30
 */

import { vi, beforeAll, afterEach, afterAll } from 'vitest';
import { config } from '@vue/test-utils';

// 全局测试配置
beforeAll(() => {
  // 设置测试超时时间
  vi.setConfig({ testTimeout: 10000 });

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));

  // Mock getComputedStyle
  Object.defineProperty(window, 'getComputedStyle', {
    value: vi.fn(() => ({
      getPropertyValue: vi.fn(() => ''),
      zIndex: '0'
    }))
  });

  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn(() => 'mock-url');
  global.URL.revokeObjectURL = vi.fn();

  // Mock canvas context
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Array(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({ data: new Array(4) })),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn()
  }));

  // Mock scrollTo
  global.scrollTo = vi.fn();

  // Mock getBoundingClientRect
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 100,
    height: 100,
    top: 0,
    left: 0,
    bottom: 100,
    right: 100,
    x: 0,
    y: 0,
    toJSON: vi.fn()
  }));

  // Mock window.open
  global.open = vi.fn();

  // Mock navigator
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Test Environment)',
    writable: true
  });

  // Mock console 方法以避免测试输出噪音
  const originalConsole = { ...console };
  global.console = {
    ...originalConsole,
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
    info: vi.fn()
  };
});

// 每个测试后清理
afterEach(() => {
  vi.clearAllMocks();
});

// 所有测试后清理
afterAll(() => {
  vi.restoreAllMocks();
});

// Vue Test Utils 全局配置
config.global.mocks = {
  // Mock 国际化
  $t: (key: string, values?: Record<string, any>) => {
    if (values) {
      return key.replace(/\{(\w+)\}/g, (_, match) => values[match] || '');
    }
    return key;
  },
  $tc: (key: string, choice?: number) => key,
  $te: (key: string) => true,
  $d: (date: Date, format?: string) => date.toISOString(),
  $n: (number: number) => number.toString(),

  // Mock 路由
  $router: {
    push: vi.fn(() => Promise.resolve()),
    replace: vi.fn(() => Promise.resolve()),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    currentRoute: {
      value: {
        path: '/',
        name: 'home',
        params: {},
        query: {},
        meta: {}
      }
    }
  },
  $route: {
    path: '/',
    name: 'home',
    params: {},
    query: {},
    meta: {},
    hash: '',
    fullPath: '/',
    matched: []
  },

  // Mock Store
  $store: {
    state: {},
    getters: {},
    dispatch: vi.fn(),
    commit: vi.fn()
  }
};

// 全局组件存根
config.global.stubs = {
  // Element Plus 组件存根
  'el-button': true,
  'el-input': true,
  'el-input-number': true,
  'el-radio': true,
  'el-radio-group': true,
  'el-radio-button': true,
  'el-checkbox': true,
  'el-checkbox-group': true,
  'el-switch': true,
  'el-select': true,
  'el-option': true,
  'el-option-group': true,
  'el-button-group': true,
  'el-table': true,
  'el-table-column': true,
  'el-date-picker': true,
  'el-time-select': true,
  'el-time-picker': true,
  'el-popover': true,
  'el-tooltip': true,
  'el-popconfirm': true,
  'el-breadcrumb': true,
  'el-breadcrumb-item': true,
  'el-page-header': true,
  'el-card': true,
  'el-carousel': true,
  'el-carousel-item': true,
  'el-collapse': true,
  'el-collapse-item': true,
  'el-descriptions': true,
  'el-descriptions-item': true,
  'el-empty': true,
  'el-image': true,
  'el-timeline': true,
  'el-timeline-item': true,
  'el-divider': true,
  'el-calendar': true,
  'el-image-viewer': true,
  'el-backtop': true,
  'el-infinite-scroll': true,
  'el-drawer': true,
  'el-dialog': true,
  'el-tooltip-v2': true,
  'el-tree': true,
  'el-tree-select': true,
  'el-transfer': true,
  'el-cascader': true,
  'el-color-picker': true,
  'el-date-picker-new': true,
  'el-time-picker-new': true,
  'el-statistic': true,
  'el-alert': true,
  'el-message': true,
  'el-notification': true,
  'el-loading': true,
  'el-progress': true,
  'el-row': true,
  'el-col': true,
  'el-container': true,
  'el-header': true,
  'el-aside': true,
  'el-main': true,
  'el-footer': true,
  'el-space': true,
  'el-layout': true,
  'el-form': true,
  'el-form-item': true,
  'el-tabs': true,
  'el-tab-pane': true,
  'el-tag': true,

  'el-menu': true,
  'el-menu-item': true,
  'el-menu-item-group': true,
  'el-submenu': true,
  'el-pagination': true,
  'el-pagination-group': true,
  'el-watermark': true,
  'el-affix': true,
  'el-anchor': true,
  'el-anchor-link': true,
  'el-anchor-item': true,
  'el-anchor-item-new': true,
  'el-anchor-link-new': true,
  'el-anchor-new': true,

  // 第三方组件存根
  'router-link': true,
  'router-view': true,
  'transition': true,
  'transition-group': true,
  'keep-alive': true,
  'teleport': true,
  'suspense': true,
  'component': true,
  'slot': true,
  'portal': true,
  'client-only': true
};

// 全局属性
config.global.provide = {
  // 依赖注入
};

// 错误处理
config.global.errorHandler = (err, instance, info) => {
  console.error('Vue Test Error:', err, info);
};

// 警告处理
config.global.warnHandler = (msg, instance, trace) => {
  console.warn('Vue Test Warning:', msg, trace);
};
