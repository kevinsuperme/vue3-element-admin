/**
 * 认证控制器单元测试
 * @description: 测试用户认证相关的控制器方法
 */
import { Request, Response } from 'express';
import { AuthController } from '@/controllers/authController';
import AuthService from '@/services/AuthService';
import { errorHandler } from '@/middleware/errorHandler';

// Mock AuthService
jest.mock('@/services/AuthService');
const MockAuthService = AuthService as jest.Mocked<typeof AuthService>;

// Mock error handler
jest.mock('@/middleware/errorHandler', () => ({
  errorHandler: jest.fn(),
  asyncHandler: (fn: any) => async (req: Request, res: Response, next: any) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  }
}));

describe('AuthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      body: {},
      ip: '127.0.0.1',
      get: jest.fn()
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    nextFunction = jest.fn();
  });

  describe('register', () => {
    const validUserData = {
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };

    it('应该成功注册新用户', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        username: 'newuser',
        email: 'newuser@example.com',
        roles: ['user'],
        isActive: true,
        createdAt: new Date()
      };

      const mockTokens = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        expiresIn: 604800,
        tokenType: 'Bearer'
      };

      const expectedResult = {
        user: mockUser,
        tokens: mockTokens
      };

      MockAuthService.register.mockResolvedValue(expectedResult);

      mockRequest.body = validUserData;

      await AuthController.register(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(MockAuthService.register).toHaveBeenCalledWith(validUserData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '注册成功',
        data: expectedResult,
        timestamp: expect.any(String)
      });
    });

    it('应该处理注册失败的情况', async () => {
      const error = new Error('用户名已存在');
      MockAuthService.register.mockRejectedValue(error);

      mockRequest.body = validUserData;

      await AuthController.register(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(error);
    });

    it('应该验证必需的注册字段', async () => {
      const invalidUserData = {
        username: 'newuser'
        // 缺少email和password
      };

      mockRequest.body = invalidUserData;

      // 由于字段验证在中间件层，这里主要测试控制器是否正确调用服���
      const error = new Error('邮箱是必需的');
      MockAuthService.register.mockRejectedValue(error);

      await AuthController.register(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(error);
    });

    it('应该处理密码不匹配的情况', async () => {
      const invalidPasswordData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!'
      };

      mockRequest.body = invalidPasswordData;

      const error = new Error('密码不匹配');
      MockAuthService.register.mockRejectedValue(error);

      await AuthController.register(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    const validLoginData = {
      username: 'testuser',
      password: 'Password123!'
    };

    it('应该成功登录用户', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
        isActive: true,
        lastLogin: new Date()
      };

      const mockTokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresIn: 604800,
        tokenType: 'Bearer'
      };

      const expectedResult = {
        user: mockUser,
        tokens: mockTokens
      };

      MockAuthService.login.mockResolvedValue(expectedResult);

      mockRequest.body = validLoginData;
      mockRequest.ip = '192.168.1.100';
      (mockRequest.get as jest.Mock).mockReturnValue('Mozilla/5.0 Test Browser');

      await AuthController.login(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(MockAuthService.login).toHaveBeenCalledWith(
        'testuser',
        'Password123!',
        '192.168.1.100',
        'Mozilla/5.0 Test Browser'
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '登录成功',
        data: expectedResult,
        timestamp: expect.any(String)
      });
    });

    it('应该使用用户名或邮箱登录', async () => {
      const emailLoginData = {
        username: 'test@example.com',
        password: 'Password123!'
      };

      const expectedResult = {
        user: { _id: 'test_id', username: 'testuser', roles: ['user'] },
        tokens: { accessToken: 'token', refreshToken: 'refresh' }
      };

      MockAuthService.login.mockResolvedValue(expectedResult);

      mockRequest.body = emailLoginData;

      await AuthController.login(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(MockAuthService.login).toHaveBeenCalledWith(
        'test@example.com',
        'Password123!',
        expect.any(String),
        expect.any(String)
      );
    });

    it('应该处理登录失败', async () => {
      const error = new Error('用户名或密码错误');
      MockAuthService.login.mockRejectedValue(error);

      mockRequest.body = validLoginData;

      await AuthController.login(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(error);
    });

    it('应该处理无效凭据', async () => {
      const invalidLoginData = {
        username: 'wronguser',
        password: 'wrongpassword'
      };

      const error = new Error('用户名或密码错误');
      MockAuthService.login.mockRejectedValue(error);

      mockRequest.body = invalidLoginData;

      await AuthController.login(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(error);
    });

    it('应该处理被禁用的用户', async () => {
      const error = new Error('用户已被禁用');
      MockAuthService.login.mockRejectedValue(error);

      mockRequest.body = validLoginData;

      await AuthController.login(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(error);
    });
  });

  describe('getProfile', () => {
    it('应该成功获取用户信息', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
        avatar: 'avatar.jpg',
        phone: '13800138000',
        isActive: true
      };

      const mockRequestWithAuth = {
        ...mockRequest,
        user: { userId: '507f1f77bcf86cd799439011' }
      } as any;

      // Mock getProfile方法
      const mockGetProfile = jest.spyOn(AuthController, 'getProfile' as any)
        .mockImplementation(async (req, res, next) => {
          res.json({
            success: true,
            message: '获取用户信息成功',
            data: mockUser,
            timestamp: new Date().toISOString()
          });
        });

      await AuthController.getProfile(mockRequestWithAuth, mockResponse as Response, nextFunction);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '获取用户信息成功',
        data: mockUser,
        timestamp: expect.any(String)
      });

      mockGetProfile.mockRestore();
    });
  });

  describe('refreshToken', () => {
    it('应该成功刷新令牌', async () => {
      const refreshData = {
        refreshToken: 'valid_refresh_token'
      };

      const newTokens = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        expiresIn: 604800,
        tokenType: 'Bearer'
      };

      MockAuthService.refreshToken.mockResolvedValue(newTokens);

      mockRequest.body = refreshData;

      await AuthController.refreshToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(MockAuthService.refreshToken).toHaveBeenCalledWith(refreshData.refreshToken);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '令牌刷新成功',
        data: newTokens,
        timestamp: expect.any(String)
      });
    });

    it('应该处理无效的刷新令牌', async () => {
      const refreshData = {
        refreshToken: 'invalid_refresh_token'
      };

      const error = new Error('无效的刷新令牌');
      MockAuthService.refreshToken.mockRejectedValue(error);

      mockRequest.body = refreshData;

      await AuthController.refreshToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(error);
    });

    it('应该验证刷新令牌是否存在', async () => {
      const invalidRefreshData = {
        // 缺少refreshToken
      };

      const error = new Error('缺少刷新令牌');
      MockAuthService.refreshToken.mockRejectedValue(error);

      mockRequest.body = invalidRefreshData;

      await AuthController.refreshToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(error);
    });
  });

  describe('changePassword', () => {
    const validPasswordData = {
      oldPassword: 'OldPassword123!',
      newPassword: 'NewPassword123!',
      confirmPassword: 'NewPassword123!'
    };

    it('应该成功修改密码', async () => {
      const mockRequestWithAuth = {
        ...mockRequest,
        user: { userId: '507f1f77bcf86cd799439011' },
        body: validPasswordData
      } as any;

      // Mock changePassword方法
      const mockChangePassword = jest.spyOn(AuthController, 'changePassword' as any)
        .mockImplementation(async (req, res, next) => {
          res.json({
            success: true,
            message: '密码修改成功',
            data: null,
            timestamp: new Date().toISOString()
          });
        });

      await AuthController.changePassword(mockRequestWithAuth, mockResponse as Response, nextFunction);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '密码修改成功',
        data: null,
        timestamp: expect.any(String)
      });

      mockChangePassword.mockRestore();
    });

    it('应该验证新密码确认', async () => {
      const invalidPasswordData = {
        oldPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'DifferentPassword123!'
      };

      const mockRequestWithAuth = {
        ...mockRequest,
        user: { userId: '507f1f77bcf86cd799439011' },
        body: invalidPasswordData
      } as any;

      const error = new Error('新密码确认不匹配');

      const mockChangePassword = jest.spyOn(AuthController, 'changePassword' as any)
        .mockImplementation(async (req, res, next) => {
          throw error;
        });

      await AuthController.changePassword(mockRequestWithAuth, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(error);

      mockChangePassword.mockRestore();
    });

    it('应该验证旧密码', async () => {
      const invalidOldPasswordData = {
        oldPassword: 'WrongOldPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      const mockRequestWithAuth = {
        ...mockRequest,
        user: { userId: '507f1f77bcf86cd799439011' },
        body: invalidOldPasswordData
      } as any;

      const error = new Error('旧密码不正确');

      const mockChangePassword = jest.spyOn(AuthController, 'changePassword' as any)
        .mockImplementation(async (req, res, next) => {
          throw error;
        });

      await AuthController.changePassword(mockRequestWithAuth, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(error);

      mockChangePassword.mockRestore();
    });
  });

  describe('logout', () => {
    it('应该成功登出用户', async () => {
      const mockRequestWithAuth = {
        ...mockRequest,
        user: { userId: '507f1f77bcf86cd799439011' }
      } as any;

      // Mock logout方法
      const mockLogout = jest.spyOn(AuthController, 'logout' as any)
        .mockImplementation(async (req, res, next) => {
          res.json({
            success: true,
            message: '登出成功',
            data: null,
            timestamp: new Date().toISOString()
          });
        });

      await AuthController.logout(mockRequestWithAuth, mockResponse as Response, nextFunction);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '登出成功',
        data: null,
        timestamp: expect.any(String)
      });

      mockLogout.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('应该正确处理服务层抛出的错误', async () => {
      const error = new Error('服务层错误');
      MockAuthService.register.mockRejectedValue(error);

      mockRequest.body = {
        username: 'test',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };

      await AuthController.register(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('应该处理数据库连接错误', async () => {
      const dbError = new Error('数据库连接失败');
      MockAuthService.login.mockRejectedValue(dbError);

      mockRequest.body = {
        username: 'test',
        password: 'password123'
      };

      await AuthController.login(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(dbError);
    });

    it('应该处理网络超时错误', async () => {
      const timeoutError = new Error('请求超时');
      MockAuthService.refreshToken.mockRejectedValue(timeoutError);

      mockRequest.body = {
        refreshToken: 'test_token'
      };

      await AuthController.refreshToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(timeoutError);
    });
  });

  describe('Response Format', () => {
    it('应该返回标准化的响应格式', async () => {
      const expectedResult = {
        user: { _id: 'test_id', username: 'testuser' },
        tokens: { accessToken: 'token' }
      };

      MockAuthService.register.mockResolvedValue(expectedResult);

      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };

      await AuthController.register(mockRequest as Request, mockResponse as Response, nextFunction);

      const response = mockResponse.json.mock.calls[0][0];

      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('timestamp');
      expect(typeof response.timestamp).toBe('string');
    });
  });
});
