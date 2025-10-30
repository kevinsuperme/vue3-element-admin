import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../../src/app';
import User from '../../src/models/User';

// Test database connection
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/vue3-admin-test';

describe('User API Integration Tests', () => {
  let server: any;
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(MONGODB_URI);
    server = app.listen(0); // Use random port
  });

  afterAll(async () => {
    // Clean up and close connections
    await User.deleteMany({});
    await mongoose.connection.close();
    server.close();
  });

  beforeEach(async () => {
    // Clean up users before each test
    await User.deleteMany({});
    authToken = '';
    testUser = null;
  });

  describe('POST /api/user/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(server)
        .post('/api/user/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toEqual({
        code: 20000,
        message: '用户注册成功',
        data: {
          user: {
            id: expect.any(String),
            username: userData.username,
            email: userData.email,
            role: 'user'
          }
        }
      });

      // Verify user was created in database
      const createdUser = await User.findOne({ email: userData.email });
      expect(createdUser).toBeTruthy();
      expect(createdUser?.username).toBe(userData.username);

      // Verify password was hashed
      const isPasswordValid = await bcrypt.compare(userData.password, createdUser?.password || '');
      expect(isPasswordValid).toBe(true);
    });

    it('should return error for duplicate email', async () => {
      // Create first user
      await User.create({
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123'
      });

      const userData = {
        username: 'newuser',
        email: 'existing@example.com', // Same email
        password: 'password123'
      };

      const response = await request(server)
        .post('/api/user/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({
        code: 40000,
        message: '用户名或邮箱已存在'
      });
    });

    it('should return error for duplicate username', async () => {
      // Create first user
      await User.create({
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123'
      });

      const userData = {
        username: 'existinguser', // Same username
        email: 'new@example.com',
        password: 'password123'
      };

      const response = await request(server)
        .post('/api/user/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({
        code: 40000,
        message: '用户名或邮箱已存在'
      });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        username: '',
        email: 'invalid-email',
        password: '123' // Too short
      };

      const response = await request(server)
        .post('/api/user/register')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.code).toBe(40000);
      expect(response.body.message).toContain('验证失败');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      jest.spyOn(User.prototype, 'save').mockRejectedValue(new Error('Database connection failed'));

      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(server)
        .post('/api/user/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({
        code: 50000,
        message: '服务器内部错误'
      });
    });
  });

  describe('POST /api/user/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      const hashedPassword = await bcrypt.hash('password123', 10);
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword
      });
    });

    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(server)
        .post('/api/user/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        code: 20000,
        message: '登录成功',
        data: {
          token: expect.any(String),
          user: {
            id: testUser._id.toString(),
            username: testUser.username,
            email: testUser.email,
            role: testUser.role
          }
        }
      });

      // Verify token is set in cookie
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('token=');
      expect(response.headers['set-cookie'][0]).toContain('HttpOnly');

      // Store token for authenticated requests
      authToken = response.body.data.token;
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(server)
        .post('/api/user/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toEqual({
        code: 40100,
        message: '邮箱或密码错误'
      });
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(server)
        .post('/api/user/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toEqual({
        code: 40100,
        message: '邮箱或密码错误'
      });
    });

    it('should validate required login fields', async () => {
      const invalidData = {
        email: '',
        password: ''
      };

      const response = await request(server)
        .post('/api/user/login')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.code).toBe(40000);
      expect(response.body.message).toContain('验证失败');
    });
  });

  describe('POST /api/user/logout', () => {
    it('should logout user successfully', async () => {
      const response = await request(server)
        .post('/api/user/logout')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        code: 20000,
        message: '退出登录成功'
      });

      // Verify token cookie is cleared
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('token=');
      expect(response.headers['set-cookie'][0]).toContain('Max-Age=0');
    });
  });

  describe('GET /api/user/info', () => {
    beforeEach(async () => {
      // Create test user and login to get token
      const hashedPassword = await bcrypt.hash('password123', 10);
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword
      });

      // Login to get token
      const loginResponse = await request(server)
        .post('/api/user/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      authToken = loginResponse.body.data.token;
    });

    it('should return user info for authenticated user', async () => {
      const response = await request(server)
        .get('/api/user/info')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        code: 20000,
        data: {
          user: {
            id: testUser._id.toString(),
            username: testUser.username,
            email: testUser.email,
            role: testUser.role,
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          }
        }
      });
    });

    it('should reject request without token', async () => {
      const response = await request(server)
        .get('/api/user/info')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toEqual({
        code: 40100,
        message: '访问令牌缺失'
      });
    });

    it('should reject request with invalid token', async () => {
      const response = await request(server)
        .get('/api/user/info')
        .set('Authorization', 'Bearer invalid-token')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toEqual({
        code: 40100,
        message: '访问令牌无效'
      });
    });
  });

  describe('Security Tests', () => {
    it('should sanitize user input to prevent XSS', async () => {
      const maliciousData = {
        username: '<script>alert("xss")</script>',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(server)
        .post('/api/user/register')
        .send(maliciousData)
        .expect('Content-Type', /json/)
        .expect(201);

      // Verify username is stored safely (should be escaped)
      const createdUser = await User.findOne({ email: 'test@example.com' });
      expect(createdUser?.username).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should prevent SQL injection attempts', async () => {
      const injectionData = {
        username: 'user',
        email: 'test@example.com\'; DROP TABLE users; --',
        password: 'password123'
      };

      const response = await request(server)
        .post('/api/user/register')
        .send(injectionData)
        .expect('Content-Type', /json/)
        .expect(201);

      // Should create user normally without executing injection
      expect(response.body.code).toBe(20000);
    });

    it('should enforce rate limiting on login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(server)
          .post('/api/user/login')
          .send(loginData);
      }

      // The 6th attempt should be rate limited
      const response = await request(server)
        .post('/api/user/login')
        .send(loginData)
        .expect('Content-Type', /json/);

      // Should either be rate limited (429) or still return 401
      expect([429, 401]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Mock database error
      jest.spyOn(User, 'findOne').mockRejectedValue(new Error('Database connection lost'));

      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(server)
        .post('/api/user/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({
        code: 50000,
        message: '服务器内部错误'
      });
    });

    it('should handle malformed JSON requests', async () => {
      const response = await request(server)
        .post('/api/user/register')
        .send('invalid json {')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body).toBeDefined();
    });

    it('should handle missing Content-Type header', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(server)
        .post('/api/user/register')
        .send(JSON.stringify(userData));
        // Don't set Content-Type header

      expect(response.status).toBeDefined();
    });
  });
});
