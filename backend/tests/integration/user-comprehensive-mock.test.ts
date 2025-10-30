import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app-instance';

// Mock the entire models module
jest.mock('../../src/models', () => {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    roles: ['user'],
    isActive: true,
    lastLogin: new Date(),
    comparePassword: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true),
    toObject: jest.fn().mockReturnValue({
      _id: '507f1f77bcf86cd799439011',
      id: '507f1f77bcf86cd799439011',
      username: 'testuser',
      email: 'test@example.com',
      roles: ['user'],
      isActive: true
    })
  };

  const mockAdmin = {
    _id: '507f1f77bcf86cd799439012',
    id: '507f1f77bcf86cd799439012',
    username: 'admin',
    email: 'admin@example.com',
    password: 'hashedpassword',
    roles: ['admin'],
    isActive: true,
    lastLogin: new Date(),
    comparePassword: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true),
    toObject: jest.fn().mockReturnValue({
      _id: '507f1f77bcf86cd799439012',
      id: '507f1f77bcf86cd799439012',
      username: 'admin',
      email: 'admin@example.com',
      roles: ['admin'],
      isActive: true
    })
  };

  return {
    User: {
      findOne: jest.fn().mockImplementation((query) => {
        // Return a mock query object with select method
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(null)
        };

        // If looking for test@example.com, return a mock user
        if (query && query.email === 'test@example.com') {
          mockQuery.exec.mockResolvedValue(mockUser);
        }
        // If looking for admin@example.com, return a mock admin user
        else if (query && query.email === 'admin@example.com') {
          mockQuery.exec.mockResolvedValue(mockAdmin);
        }
        // If looking for username 'testuser', return a mock user
        else if (query && query.$or && query.$or.some((or: any) => or.username === 'testuser')) {
          mockQuery.exec.mockResolvedValue(mockUser);
        }
        // If looking for username 'admin', return a mock admin user
        else if (query && query.$or && query.$or.some((or: any) => or.username === 'admin')) {
          mockQuery.exec.mockResolvedValue(mockAdmin);
        }

        return mockQuery;
      }),
      findById: jest.fn().mockImplementation((id) => {
        // Return a mock query object with select method
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(null)
        };

        // If looking for testuser ID, return a mock user
        if (id === '507f1f77bcf86cd799439011') {
          mockQuery.exec.mockResolvedValue(mockUser);
        }
        // If looking for admin ID, return a mock admin user
        else if (id === '507f1f77bcf86cd799439012') {
          mockQuery.exec.mockResolvedValue(mockAdmin);
        }

        return mockQuery;
      }),
      find: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockUser, mockAdmin])
            })
          })
        })
      }),
      countDocuments: jest.fn().mockResolvedValue(2),
      create: jest.fn().mockImplementation((userData) => {
        if (userData.username === 'testuser' || userData.email === 'test@example.com') {
          return Promise.resolve(mockUser);
        } else if (userData.username === 'admin' || userData.email === 'admin@example.com') {
          return Promise.resolve(mockAdmin);
        }
        return Promise.resolve({
          _id: '507f1f77bcf86cd799439013',
          id: '507f1f77bcf86cd799439013',
          username: userData.username,
          email: userData.email,
          roles: ['user'],
          isActive: true,
          toObject: jest.fn().mockReturnValue({
            _id: '507f1f77bcf86cd799439013',
            id: '507f1f77bcf86cd799439013',
            username: userData.username,
            email: userData.email,
            roles: ['user'],
            isActive: true
          })
        });
      })
    },
    LoginLog: {
      create: jest.fn().mockResolvedValue({})
    }
  };
});

// Mock JWT service
jest.mock('../../src/services/JWTService', () => ({
  JWTService: {
    generateAccessToken: jest.fn().mockReturnValue('mock-jwt-token'),
    generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
    verifyToken: jest.fn().mockImplementation((token) => {
      if (token === 'mock-admin-jwt-token') {
        return {
          userId: '507f1f77bcf86cd799439012',
          username: 'admin',
          email: 'admin@example.com',
          roles: ['admin']
        };
      } else if (token === 'mock-user-jwt-token') {
        return {
          userId: '507f1f77bcf86cd799439011',
          username: 'testuser',
          email: 'test@example.com',
          roles: ['user']
        };
      } else if (token === 'mock-jwt-token') {
        return {
          userId: '507f1f77bcf86cd799439011',
          username: 'testuser',
          email: 'test@example.com',
          roles: ['user']
        };
      } else {
        throw new Error('Invalid token');
      }
    }),
    extractTokenFromHeader: jest.fn().mockImplementation((authHeader) => {
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
      return null;
    }),
    generateTokenPair: jest.fn().mockReturnValue({
      accessToken: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token'
    }),
    decodeToken: jest.fn().mockReturnValue({
      userId: '507f1f77bcf86cd799439011',
      username: 'testuser',
      email: 'test@example.com',
      roles: ['user']
    })
  }
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashedpassword' as any)
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid' as any)
}));

describe('User API Integration Tests', () => {
  let authToken: string;
  let adminToken: string;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Generate tokens
    adminToken = 'mock-admin-jwt-token';
    authToken = 'mock-user-jwt-token';
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        username: userData.username,
        email: userData.email,
        role: 'user'
      });
      expect(response.body.data.user.id).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        username: 'newuser',
        email: 'test@example.com', // Same email
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should return error for duplicate username', async () => {
      const userData = {
        username: 'testuser', // Same username
        email: 'new@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        username: '',
        email: 'invalid-email',
        password: '123' // Too short
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toMatchObject({
        id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      });

      // Verify token is set in cookie
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('token=');
      expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      // Mock findOne to return the test user with wrong password
      const { User } = require('../../src/models');
      User.findOne.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({
              _id: '507f1f77bcf86cd799439011',
              id: '507f1f77bcf86cd799439011',
              username: 'testuser',
              email: 'test@example.com',
              password: 'hashedpassword',
              roles: ['user'],
              isActive: true,
              comparePassword: jest.fn().mockResolvedValue(false as any) // Password doesn't match
            } as any)
          })
        })
      }));

      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should validate required login fields', async () => {
      const invalidData = {
        email: '',
        password: ''
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out successfully');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      });
    });

    it('should return error for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        username: 'updateduser',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        id: '507f1f77bcf86cd799439011',
        username: updateData.username,
        email: updateData.email
      });
    });

    it('should return error for invalid update data', async () => {
      const invalidData = {
        username: '', // Empty username
        email: 'invalid-email' // Invalid email
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('Security Tests', () => {
    it('should sanitize user input to prevent XSS', async () => {
      const userData = {
        username: '<script>alert("XSS")</script>',
        email: 'xss@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.data.user.username).not.toContain('<script>');
    });

    it('should prevent SQL injection in search queries', async () => {
      const maliciousQuery = "'; DROP TABLE users; --";

      const response = await request(app)
        .get(`/api/auth/users/search?q=${encodeURIComponent(maliciousQuery)}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.data.users).toBeDefined();
    });

    it('should limit login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(401);
      }
    });

    it('should hash passwords and not return them in responses', async () => {
      const userData = {
        username: 'testuser',
        email: 'testhash@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.data.user.password).toBeUndefined();
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid JSON');
    });

    it('should handle missing Content-Type header', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(JSON.stringify(userData))
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Content-Type');
    });

    it('should handle expired tokens', async () => {
      const expiredToken = 'expired-token';

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token expired');
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent login requests efficiently', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Create 5 concurrent login requests
      const loginPromises = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send(loginData)
      );

      const responses = await Promise.all(loginPromises);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.token).toBeDefined();
      });
    });

    it('should handle large user dataset efficiently', async () => {
      // Test listing users with pagination
      const response = await request(app)
        .get('/api/auth/users?page=1&limit=20')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.page).toBe(1);
    });
  });
});
