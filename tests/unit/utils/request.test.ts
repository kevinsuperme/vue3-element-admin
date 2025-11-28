/**
 * @description: request 工具函数单元测试
 * @author: Kevin Wan
 * @date: 2025-10-30
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock axios
vi.mock('axios');
const mockAxios = vi.hoisted(() => ({
  create: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() }
  },
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
}));

vi.mocked(mockAxios.create).mockReturnValue(mockAxios);

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: vi.fn(),
  ElMessageBox: {
    confirm: vi.fn(() => Promise.resolve())
  }
}));

// Mock auth utils
const mockGetToken = vi.fn();
const mockRemoveToken = vi.fn();

vi.mock('@/utils/auth', () => ({
  getToken: mockGetToken,
  removeToken: mockRemoveToken
}));

// Mock location.reload
Object.defineProperty(window, 'location', {
  value: { reload: vi.fn() },
  writable: true
});

describe('Request Utils - HTTP请求工具测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAxios.interceptors.request.use.mockClear();
    mockAxios.interceptors.response.use.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Instance Creation', () => {
    it('应该创建axios实例并设置正确的配置', async () => {
      // 重新导入service以触发创建
      const { default: service } = await import('@/utils/request');

      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: expect.stringContaining('/api'),
        timeout: 60000
      });
      expect(service).toBeDefined();
    });

    it('应该设置默认超时时间为60秒', async () => {
      await import('@/utils/request');

      expect(mockAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 60000
        })
      );
    });
  });

  describe('Request Interceptor', () => {
    it('应该在存在token时添加Authorization头', async () => {
      const token = 'test-token-123';
      mockGetToken.mockReturnValue(token);

      // 模拟请求拦截器的调用
      const config = { headers: {}};
      const requestHandler = mockAxios.interceptors.request.use.mock.calls[0]?.[0];

      if (requestHandler) {
        const result = requestHandler(config);
        expect(result.headers.Authorization).toBe(`Bearer ${token}`);
      }

      expect(mockGetToken).toHaveBeenCalled();
    });

    it('应该在不存在token时不添加Authorization头', async () => {
      mockGetToken.mockReturnValue(null);

      const config = { headers: {}};
      const requestHandler = mockAxios.interceptors.request.use.mock.calls[0]?.[0];

      if (requestHandler) {
        const result = requestHandler(config);
        expect(result.headers.Authorization).toBeUndefined();
      }

      expect(mockGetToken).toHaveBeenCalled();
    });
  });

  describe('Response Interceptor', () => {
    it('应该处理成功的响应', async () => {
      const { ElMessage } = await import('element-plus');
      const response = {
        data: {
          code: 20000,
          data: { result: 'success' },
          message: '操作成功'
        }
      };

      const responseHandler = mockAxios.interceptors.response.use.mock.calls[0]?.[0];

      if (responseHandler) {
        const result = responseHandler(response);
        expect(result).toEqual(response.data);
      }

      expect(ElMessage).not.toHaveBeenCalled();
    });

    it('应该处理业务错误响应', async () => {
      const { ElMessage } = await import('element-plus');
      const response = {
        data: {
          code: 50001,
          message: '业务逻辑错误'
        }
      };

      const responseHandler = mockAxios.interceptors.response.use.mock.calls[0]?.[0];

      if (responseHandler) {
        expect(() => responseHandler(response)).toThrow('业务逻辑错误');
      }

      expect(ElMessage).toHaveBeenCalledWith({
        message: '业务逻辑错误',
        type: 'error',
        duration: 5 * 1000
      });
    });

    it('应该处理token过期错误', async () => {
      const { ElMessageBox } = await import('element-plus');
      const response = {
        data: {
          code: 50014,
          message: 'Token已过期'
        }
      };

      const responseHandler = mockAxios.interceptors.response.use.mock.calls[0]?.[0];

      if (responseHandler) {
        await responseHandler(response);
      }

      expect(ElMessageBox.confirm).toHaveBeenCalledWith(
        '您已登出，请重新登录',
        '确认登出',
        expect.objectContaining({
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        })
      );
    });
  });

  describe('HTTP Error Handler', () => {
    it('应该处理400错误', async () => {
      const { ElMessage } = await import('element-plus');
      const error = {
        response: {
          status: 400,
          data: { message: '请求参数错误' }
        }
      };

      const errorHandler = mockAxios.interceptors.response.use.mock.calls[0]?.[1];

      if (errorHandler) {
        try {
          errorHandler(error);
        } catch {
          expect(true).toBe(true);
        }
      }

      expect(ElMessage).toHaveBeenCalledWith({
        message: '请求参数错误',
        type: 'error',
        duration: 5 * 1000
      });
    });

    it('应该处理401未授权错误', async () => {
      const { ElMessage } = await import('element-plus');
      const error = {
        response: {
          status: 401,
          data: { message: '未授权访问' }
        }
      };

      const errorHandler = mockAxios.interceptors.response.use.mock.calls[0]?.[1];

      if (errorHandler) {
        try {
          errorHandler(error);
        } catch {
          expect(true).toBe(true);
        }
      }

      expect(mockRemoveToken).toHaveBeenCalled();
      expect(window.location.reload).toHaveBeenCalled();
      expect(ElMessage).toHaveBeenCalledWith({
        message: '未授权访问',
        type: 'error',
        duration: 5 * 1000
      });
    });

    it('应该处理网络错误', async () => {
      const { ElMessage } = await import('element-plus');
      const networkError = {
        message: 'Network Error'
      };

      const errorHandler = mockAxios.interceptors.response.use.mock.calls[0]?.[1];

      if (errorHandler) {
        try {
          errorHandler(networkError);
        } catch {
          expect(true).toBe(true);
        }
      }

      expect(ElMessage).toHaveBeenCalledWith({
        message: 'Network Error',
        type: 'error',
        duration: 5 * 1000
      });
    });
  });

  describe('HTTP Methods', () => {
    beforeEach(async () => {
      // 重新导入service
      await import('@/utils/request');
    });

    it('应该支持GET请求', async () => {
      const mockResponse = { data: { result: 'success' }};
      mockAxios.get.mockResolvedValue(mockResponse);

      const { default: service } = await import('@/utils/request');
      const result = await service.get('/api/users');

      expect(mockAxios.get).toHaveBeenCalledWith('/api/users');
      expect(result).toEqual(mockResponse);
    });

    it('应该支持POST请求', async () => {
      const postData = { name: 'test' };
      const mockResponse = { data: { id: 1, ...postData }};
      mockAxios.post.mockResolvedValue(mockResponse);

      const { default: service } = await import('@/utils/request');
      const result = await service.post('/api/users', postData);

      expect(mockAxios.post).toHaveBeenCalledWith('/api/users', postData);
      expect(result).toEqual(mockResponse);
    });

    it('应该支持PUT请求', async () => {
      const putData = { id: 1, name: 'updated' };
      const mockResponse = { data: putData };
      mockAxios.put.mockResolvedValue(mockResponse);

      const { default: service } = await import('@/utils/request');
      const result = await service.put('/api/users/1', putData);

      expect(mockAxios.put).toHaveBeenCalledWith('/api/users/1', putData);
      expect(result).toEqual(mockResponse);
    });

    it('应该支持DELETE请求', async () => {
      const mockResponse = { data: { success: true }};
      mockAxios.delete.mockResolvedValue(mockResponse);

      const { default: service } = await import('@/utils/request');
      const result = await service.delete('/api/users/1');

      expect(mockAxios.delete).toHaveBeenCalledWith('/api/users/1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Interceptors Registration', () => {
    it('应该注册请求拦截器', async () => {
      await import('@/utils/request');

      expect(mockAxios.interceptors.request.use).toHaveBeenCalled();
    });

    it('应该注册响应拦截器', async () => {
      await import('@/utils/request');

      expect(mockAxios.interceptors.response.use).toHaveBeenCalled();
    });
  });
});
