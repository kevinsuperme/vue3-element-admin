import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import jwt from 'jsonwebtoken';
import User from '../../../src/models/User';
import { auth } from '../../../src/middleware/auth';

// Mock dependencies
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;
  let findByIdSpy: any;

  beforeEach(() => {
    req = {
      headers: {},
      cookies: {},
      user: undefined
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    findByIdSpy = jest.spyOn(User, 'findById' as any);
    jest.clearAllMocks();
  });

  afterEach(() => {
    findByIdSpy.mockRestore();
  });

  describe('Token Validation', () => {
    it('should authenticate user with valid token from header', async () => {
      const mockToken = 'valid-jwt-token';
      const mockDecoded = { userId: 'user123', role: 'user' };
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };

      req.headers.authorization = `Bearer ${mockToken}`

      // Mock jwt.verify
      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      // Mock User.findById
      findByIdSpy.mockResolvedValue(mockUser);

      await auth(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
      expect(findByIdSpy).toHaveBeenCalledWith(mockDecoded.userId);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should authenticate user with valid token from cookie', async () => {
      const mockToken = 'valid-jwt-token';
      const mockDecoded = { userId: 'user123', role: 'user' };
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };

      req.cookies.token = mockToken

      // Mock jwt.verify
      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      // Mock User.findById
      findByIdSpy.mockResolvedValue(mockUser);

      await auth(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
      expect(findByIdSpy).toHaveBeenCalledWith(mockDecoded.userId);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        code: 40100,
        message: '访问令牌缺失'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      const invalidToken = 'invalid-token';
      req.headers.authorization = `Bearer ${invalidToken}`

      // Mock jwt.verify to throw error
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        code: 40100,
        message: '访问令牌无效'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with expired token', async () => {
      const expiredToken = 'expired-token';
      req.headers.authorization = `Bearer ${expiredToken}`

      // Mock jwt.verify to throw token expired error
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        const error: any = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        code: 40100,
        message: '访问令牌已过期'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request when user not found', async () => {
      const mockToken = 'valid-token';
      const mockDecoded = { userId: 'nonexistent-user', role: 'user' };

      req.headers.authorization = `Bearer ${mockToken}`

      // Mock jwt.verify
      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      // Mock User.findById to return null
      findByIdSpy.mockResolvedValue(null);

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        code: 40100,
        message: '用户不存在'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const mockToken = 'valid-token';
      const mockDecoded = { userId: 'user123', role: 'user' };

      req.headers.authorization = `Bearer ${mockToken}`

      // Mock jwt.verify
      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      // Mock User.findById to throw error
      findByIdSpy.mockRejectedValue(new Error('Database error'));

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        code: 50000,
        message: '服务器内部错误'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Role-based Authorization', () => {
    it('should allow access for users with required role', async () => {
      const mockToken = 'valid-token';
      const mockDecoded = { userId: 'admin123', role: 'admin' };
      const mockUser = {
        _id: 'admin123',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      };

      req.headers.authorization = `Bearer ${mockToken}`;
      req.requiredRole = 'admin' // Simulate role requirement

      // Mock jwt.verify
      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      // Mock User.findById
      findByIdSpy.mockResolvedValue(mockUser);

      await auth(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should deny access for users without required role', async () => {
      const mockToken = 'valid-token';
      const mockDecoded = { userId: 'user123', role: 'user' };
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };

      req.headers.authorization = `Bearer ${mockToken}`;
      req.requiredRole = 'admin' // User doesn't have admin role

      // Mock jwt.verify
      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      // Mock User.findById
      findByIdSpy.mockResolvedValue(mockUser);

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        code: 40300,
        message: '权限不足'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Security Features', () => {
    it('should handle malformed authorization header', async () => {
      req.headers.authorization = 'InvalidFormat token';

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        code: 40100,
        message: '访问令牌格式错误'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle missing Bearer prefix', async () => {
      req.headers.authorization = 'valid-token-without-bearer';

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        code: 40100,
        message: '访问令牌格式错误'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should sanitize token input', async () => {
      const maliciousToken = 'token-with-injection<script>alert("xss")</script>';
      req.headers.authorization = `Bearer ${maliciousToken}`

      // Mock jwt.verify to handle the token safely
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token format');
      });

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        code: 40100,
        message: '访问令牌无效'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
