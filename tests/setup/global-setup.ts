/**
 * @description: 全局测试环境设置
 * @author: Kevin Wan
 * @date: 2025-10-30
 */

import { vi } from 'vitest';

// 全局Mock配置
beforeAll(() => {
  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));

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
      zIndex: '0',
      display: 'block',
      visibility: 'visible',
      width: '100px',
      height: '100px'
    })),
    writable: true
  });

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });

  // Mock URL.createObjectURL and revokeObjectURL
  global.URL.createObjectURL = vi.fn(() => 'mock-url');
  global.URL.revokeObjectURL = vi.fn();

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

  // Mock canvas
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

  // Mock open
  global.open = vi.fn();

  // Mock alert
  global.alert = vi.fn();

  // Mock confirm
  global.confirm = vi.fn(() => true);

  // Mock prompt
  global.prompt = vi.fn(() => '');

  // Mock console methods to avoid test output noise
  const originalConsole = { ...console };
  global.console = {
    ...originalConsole,
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  };

  // Mock navigator
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Test Environment)',
    writable: true
  });

  // Mock WebSocket
  global.WebSocket = vi.fn(() => ({
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 1, // OPEN
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
  }));

  // Mock EventSource
  global.EventSource = vi.fn(() => ({
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 1,
    CONNECTING: 0,
    OPEN: 1,
    CLOSED: 2
  }));

  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn((cb) => {
    return setTimeout(cb, 16); // 60fps
  });

  // Mock cancelAnimationFrame
  global.cancelAnimationFrame = vi.fn();

  // Mock performance.now
  if (!global.performance.now) {
    global.performance = {
      now: vi.fn(() => Date.now())
    };
  }

  // Mock fetch API
  global.fetch = vi.fn();

  // Mock WebSocket constructors
  global.WebSocket = vi.fn() as any;

  // Mock MutationObserver
  global.MutationObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => [])
  }));

  // Mock CSS.supports
  Object.defineProperty(CSS, 'supports', {
    value: vi.fn(),
    writable: true
  });

  // Mock HTMLElement.style
  Object.defineProperty(HTMLElement.prototype, 'style', {
    value: {},
    writable: true
  });

  // Mock classList
  Object.defineProperty(Element.prototype, 'classList', {
    value: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
      toggle: vi.fn(),
      length: 0
    },
    writable: true
  });

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

  // Mock dataset
  Object.defineProperty(HTMLElement.prototype, 'dataset', {
    value: {},
    writable: true
  });

  // Mock window dimensions
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768
  });

  // Mock location
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: ''
    },
    writable: true
  });

  // Mock history
  Object.defineProperty(window, 'history', {
    value: {
      length: 1,
      state: {},
      back: vi.fn(),
      forward: vi.fn(),
      go: vi.fn(),
      pushState: vi.fn(),
      replaceState: vi.fn()
    },
    writable: true
  });

  // Mock localStorage quota
  Object.defineProperty(localStorageMock, 'length', {
    value: 0,
    writable: true
  });

  // Mock localStorage key
  Object.defineProperty(localStorageMock, 'key', {
    value: vi.fn(() => null),
    writable: true
  });

  // Mock Blob
  global.Blob = vi.fn().mockImplementation((content, options) => ({
    size: content ? content.length : 0,
    type: options?.type || '',
    slice: vi.fn(),
    stream: vi.fn(),
    text: vi.fn().mockResolvedValue(''),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
  }));

  // Mock FileReader
  global.FileReader = vi.fn().mockImplementation(() => ({
    readAsDataURL: vi.fn(),
    readAsText: vi.fn(),
    readAsArrayBuffer: vi.fn(),
    readAsBinaryString: vi.fn(),
    result: '',
    error: null,
    onload: null,
    onerror: null,
    onabort: null,
    onloadend: null
  }));

  // Mock FormData
  global.FormData = vi.fn().mockImplementation(() => ({
    append: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
    set: vi.fn(),
    keys: vi.fn(() => []),
    values: vi.fn(() => []),
    entries: vi.fn(() => []),
    forEach: vi.fn(),
    [Symbol.iterator]: vi.fn()
  }));

  // Mock Headers
  global.Headers = vi.fn().mockImplementation(() => ({
    append: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
    set: vi.fn(),
    keys: vi.fn(() => []),
    values: vi.fn(() => []),
    entries: vi.fn(() => []),
    forEach: vi.fn(),
    [Symbol.iterator]: vi.fn()
  }));

  // Mock URLSearchParams
  global.URLSearchParams = vi.fn().mockImplementation(() => ({
    append: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
    set: vi.fn(),
    sort: vi.fn(),
    keys: vi.fn(() => []),
    values: vi.fn(() => []),
    entries: vi.fn(() => []),
    forEach: vi.fn(),
    toString: vi.fn(() => ''),
    [Symbol.iterator]: vi.fn()
  }));
});

// 清理函数
afterAll(() => {
  vi.restoreAllMocks();
});
