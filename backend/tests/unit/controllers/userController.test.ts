import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../../../src/models/User';
import { AuthController } from '../../../src/controllers/authController';
import { AuthRequest } from '../../../src/middleware/auth';

// Mock models and dependencies
jest.mock('../../../src/models/User');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

describe('User Controller', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {},
      headers: {},
      user: undefined
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'user',
        save: jest.fn().mockResolvedValue(true)
      };

      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }

      // Mock User.findOne to return null (user doesn't exist)
      ;(User.findOne as jest.Mock).mockResolvedValue(null)

      // Mock bcrypt.hash
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')

      // Mock User constructor
      ;(User as any).mockImplementation(() => mockUser);

      await AuthController.register(req as Request, res as Response, next);

      expect(User.findOne).toHaveBeenCalledWith({
        $or: [{ email: 'test@example.com' }, { username: 'testuser' }]
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        code: 20000,
        message: '用户注册成功',
        data: {
          user: {
            id: mockUser._id,
            username: mockUser.username,
            email: mockUser.email,
            role: mockUser.role
          }
        }
      });
    });

    it('should return error if user already exists', async () => {
      req.body = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123'
      }

      // Mock User.findOne to return existing user
      ;(User.findOne as jest.Mock).mockResolvedValue({
        username: 'existinguser',
        email: 'existing@example.com'
      });

      await AuthController.register(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        code: 40000,
        message: '用户名或邮箱已存在'
      });
    });

    it('should handle validation errors', async () => {
      req.body = {
        username: '', // Invalid username
        email: 'invalid-email', // Invalid email
        password: '123' // Too short password
      };

      await AuthController.register(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 40000,
          message: expect.stringContaining('验证失败')
        })
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'user',
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      const mockToken = 'jwt-token-123';

      req.body = {
        email: 'test@example.com',
        password: 'password123'
      }

      // Mock User.findOne to return user
      ;(User.findOne as jest.Mock).mockResolvedValue(mockUser)

      // Mock jwt.sign
      ;(jwt.sign as jest.Mock).mockReturnValue(mockToken);

      await AuthController.login(req as Request, res as Response, next);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser._id, role: mockUser.role },
        expect.any(String),
        { expiresIn: '24h' }
      );
      expect(res.cookie).toHaveBeenCalledWith('token', mockToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      expect(res.json).toHaveBeenCalledWith({
        code: 20000,
        message: '登录成功',
        data: {
          token: mockToken,
          user: {
            id: mockUser._id,
            username: mockUser.username,
            email: mockUser.email,
            role: mockUser.role
          }
        }
      });
    });

    it('should return error for invalid credentials', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }

      // Mock User.findOne to return null (user not found)
      ;(User.findOne as jest.Mock).mockResolvedValue(null);

      await AuthController.login(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        code: 40100,
        message: '邮箱或密码错误'
      });
    });

    it('should return error for wrong password', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'user',
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }

      // Mock User.findOne to return user
      ;(User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await AuthController.login(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        code: 40100,
        message: '邮箱或密码错误'
      });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      await AuthController.logout(req as Request, res as Response, next);

      expect(res.clearCookie).toHaveBeenCalledWith('token');
      expect(res.json).toHaveBeenCalledWith({
        code: 20000,
        message: '退出登录成功'
      });
    });
  });

  describe('getUserInfo', () => {
    it('should return user info for authenticated user', async () => {
      const mockUser = {
        userId: 'user123',
        username: 'testuser',
        roles: ['user']
      };

      req.user = mockUser;

      await AuthController.getCurrentUser(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            userId: mockUser.userId,
            username: mockUser.username,
            roles: mockUser.roles
          })
        })
      );
    });

    it('should return error for unauthenticated user', async () => {
      req.user = undefined;

      await AuthController.getCurrentUser(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        code: 40100,
        message: '用户未认证'
      });
    });
  });
});
