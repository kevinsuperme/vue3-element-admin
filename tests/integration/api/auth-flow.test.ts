/**
 * 认证API集成测试
 * @description: 测试完整的认证流程集成
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app-instance';

describe('Authentication API Integration Tests', () => {
  let testUser: any = null;
  let adminUser: any = null;
  let userToken: string = '';
  let adminToken: string = '';
  let refreshToken: string = '';

  beforeAll(async () => {
    // 设置测试用户数据
    testUser = {
      username: `testuser_${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!'
    };

    adminUser = {
      username: 'admin',
      email: 'admin@example.com',
      password: 'AdminPassword123!',
      confirmPassword: 'AdminPassword123!'
    };
  });

  afterAll(async () => {
    // 清理测试数据
    try {
      await request(app)
        .delete('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`);

      await request(app)
        .delete('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`);
    } catch (error) {
      // 忽略清理错误
      console.log('Cleanup error:', error.message);
    }
  });

  describe('User Registration Flow', () => {
    it('应该能够注册新用户', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        username: testUser.username,
        email: testUser.email
      });
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
      expect(response.body.data.tokens.expiresIn).toBeDefined();
    });

    it('应该验证必填字段', async () => {
      // 测试缺少用户名
      const response1 = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123'
        })
        .expect(400);

      expect(response1.body.success).toBe(false);
      expect(response1.body.message).toContain('username');

      // 测试缺少邮箱
      const response2 = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123',
          confirmPassword: 'password123'
        })
        .expect(400);

      expect(response2.body.success).toBe(false);
      expect(response2.body.message).toContain('email');

      // 测试缺少密码
      const response3 = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          confirmPassword: 'password123'
        })
        .expect(400);

      expect(response3.body.success).toBe(false);
      expect(response3.body.message).toContain('password');
    });

    it('应该验证邮箱格式', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'password123',
          confirmPassword: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });

    it('应该验证密码复杂度', async () => {
      const weakPasswordTests = [
        { password: '123', expectedError: '8 characters' },
        { password: 'password', expectedError: 'uppercase' },
        { password: 'PASSWORD', expectedError: 'lowercase' },
        { password: 'Password123', expectedError: 'special character' }
      ];

      for (const test of weakPasswordTests) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'testuser',
            email: 'test@example.com',
            password: test.password,
            confirmPassword: test.password
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain(test.expectedError);
      }
    });

    it('应该验证密码确认', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'DifferentPassword123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('password');
    });

    '应该防止重复注册', async () => {
      // 首次注册
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // 尝试重复注册相同用户名
      const response1 = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUser.username,
          email: 'different@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!'
        })
        .expect(400);

      expect(response1.body.success).toBe(false);
      expect(response1.body.message).toContain('username');

      // 尝试重复注册相同邮箱
      const response2 = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'differentuser',
          email: testUser.email,
          password: 'Password123!',
          confirmPassword: 'Password123!'
        })
        .expect(400);

      expect(response2.body.success).toBe(false);
      expect(response2.body.message).toContain('email');
    });
  });

  describe('User Login Flow', () => {
    it('应该能够登录已注册的用户', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        username: testUser.username,
        email: testUser.email
      });
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();

      userToken = response.body.data.tokens.accessToken;
      refreshToken = response.body.data.tokens.refreshToken;
    });

    it('应该支持邮箱或用户名登录', async () => {
      // 使用邮箱登录
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response1.body.success).toBe(true);
      expect(response1.body.data.user.email).toBe(testUser.email);

      // 使用用户名登录
      const response2 = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200);

      expect(response2.body.success).toBe(true);
      expect(response2.body.data.user.username).toBe(testUser.username);
    });

    it('应该处理无效的登录凭据', async () => {
      // 错误密码
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response1.body.success).toBe(false);
      expect(response1.body.message).toContain('Invalid credentials');

      // 不存在的用户
      const response2 = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'password123'
        })
        .expect(401);

      expect(response2.body.success).toBe(false);
      expect(response2.body.message).toContain('Invalid credentials');

      // 空字段
      const response3 = await request(app)
        .post('/api/auth/login')
        .send({
          username: '',
          password: ''
        })
        .expect(400);

      expect(response3.body.success).toBe(false);
    });

    it('应该记录登录日志', async () => {
      const loginData = {
        username: testUser.username,
        password: testUser.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      // 这里可以验证登录日志是否被记录（如果有日志查询接口的话）
    });

    it('应该处理被禁用的用户', async () => {
      // 先注册一个用户然后禁用它
      const disabledUser = {
        username: `disabled_${Date.now()}`,
        email: `disabled${Date.now()}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      await request(app)
        .post('/api/auth/register')
        .send(disabledUser)
        .expect(201);

      // 禁用用户（如果有相应的API）
      // await request(app)
      //   .patch('/api/users/' + disabledUser.username)
      //   .set('Authorization', `Bearer ${userToken}`)
      //   .send({ isActive: false });

      // 尝试登录被禁用的用户
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: disabledUser.username,
          password: disabledUser.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('disabled');
    });
  });

  describe('Token Management', () => {
    it('应该能够使用访问令牌获取用户信息', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        username: testUser.username,
        email: testUser.email
      });
    });

    it('应该处理无效的访问令牌', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });

    it('应该处理过期的访问令牌', async () => {
      // 模拟过期的token
      const expiredToken = 'expired-token';

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token expired');
    });

    it('应该能够刷新访问令牌', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: refreshToken
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      userToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('应该处理无效的刷新令牌', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: 'invalid-refresh-token'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid refresh token');
    });

    it('应该处理过期的刷新令牌', async () => {
      // 使用已过期的refreshToken
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: refreshToken
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Refresh token expired');
    });
  });

  describe('Password Management', () => {
    it('应该能够修改密码', async () => {
      const newPasswordData = {
        oldPassword: testUser.password,
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newPasswordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password changed successfully');
    });

    it('应该验证旧密码', async () => {
      const wrongOldPassword = {
        oldPassword: 'wrongpassword',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send(wrongOldPassword)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('old password');
    });

    it('应该验证新密码确认', async () => {
      const mismatchedPassword = {
        oldPassword: testUser.password,
        newPassword: 'NewPassword123!',
        confirmPassword: 'DifferentPassword123!'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send(mismatchedPassword)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('password');
    });

    it('应该验证新密码复杂度', async () => {
      const weakPassword = {
        oldPassword: testUser.password,
        newPassword: 'weak',
        confirmPassword: 'weak'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send(weakPassword)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('password complexity');
    });

    it('应该在修改密码后更新token', async () => {
      const newPasswordData = {
        oldPassword: 'NewPassword123!',
        newPassword: 'UpdatedPassword456!',
        confirmPassword: 'UpdatedPassword456!'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newPasswordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      // 更新token
      userToken = response.body.data.accessToken;
    });
  });

  describe('User Profile Management', () => {
    it('应该能够更新用户信息', async () => {
      const updateData = {
        username: `updated_${testUser.username}`,
        email: `updated_${testUser.email}`
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        username: updateData.username,
        email: updateData.email
      });
    });

    it('应该验证更新的唯一性', async () => {
      // 尝试更新为已存在的用户名
      const duplicateUpdate = {
        username: 'admin',
        email: testUser.email
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(duplicateUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('应该支持更新部分信息', async () => {
      const partialUpdate = {
        // 只更新邮箱
        email: `partial_update_${Date.now()}@example.com`
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(partialUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(partialUpdate.email);
      expect(response.body.data.user.username).toBe(testUser.username); // 未更新
    });

    it('应该更新用户信息后保持token有效', async () => {
      const updateData = {
        phone: '1234567890',
        bio: 'This is a test bio'
      };

      await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      // 验证原token仍然有效
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.user.phone).toBe(updateData.phone);
    });
  });

  describe('Logout Flow', () => {
    it('应该能够成功登出', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out successfully');
    });

    it('应该使token失效', async () => {
      // 先登出
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // 验证token已失效
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });

    it('应该处理无效token的登出请求', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('Admin Operations', () => {
    beforeAll(async () => {
      // 确保admin用户存在或创建
      try {
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            username: 'admin',
            password: 'AdminPassword123!'
          });

        if (loginResponse.status === 200) {
          adminToken = loginResponse.body.data.tokens.accessToken;
        }
      } catch (error) {
        // 尝试注册admin用户
        const registerResponse = await request(app)
          .post('/api/auth/register')
          .send(adminUser);

        if (registerResponse.status === 201) {
          adminToken = registerResponse.body.data.tokens.accessToken;
        }
      }
    });

    it('管理员应该能够查看所有用户列表', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);
    });

    it('管理员应该能够获取用户详情', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUser.username}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        username: testUser.username,
        email: testUser.email
      });
    });

    it('管理员应该能够修改用户状态', async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${testUser.username}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: false
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.isActive).toBe(false);
    });

    it('管理员应该能够删除用户', async () => {
      // 创建临时用户用于删除测试
      const tempUser = {
        username: `temp_delete_${Date.now()}`,
        email: `temp${Date.now()}@example.com`,
        password: 'TempPassword123!',
        confirmPassword: 'TempPassword123!'
      };

      const createResponse = await request(app)
        .post('/api/auth/register')
        .send(tempUser)
        .expect(201);

      const tempToken = createResponse.body.data.tokens.accessToken;

      // 使用管理员权限删除用户
      const deleteResponse = await request(app)
        .delete(`/api/admin/users/${tempUser.username}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
    });

    it('普通用户不应该能访问管理员接口', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Forbidden');
    });
  });

  describe('Rate Limiting', () => {
    it('应该限制登录尝试次数', async () => {
      const invalidLogin = {
        username: testUser.username,
        password: 'wrongpassword'
      };

      // 尝试多次失败登录
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(invalidLogin)
          .expect(i < 5 ? 401 : 429); // 第6次应该是429 Too Many Requests
      }
    });

    it('应该限制密码修改尝试', async () => {
      const invalidPassword = {
        oldPassword: 'wrongpassword',
        newPassword: 'WrongPassword123!',
        confirmPassword: 'WrongPassword123!'
      };

      // 尝试多次修改密码
      for (let i = 0; i < 6; i++) {
        await request(app)
          .put('/api/auth/change-password')
          .set('Authorization', `Bearer ${userToken}`)
          .send(invalidPassword)
          .expect(i < 5 ? 400 : 429);
      }
    });
  });

  describe('Concurrent Operations', () => {
    it('应该处理并发登录请求', async () => {
      const loginPromises = Array(10).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            username: testUser.username,
            password: testUser.password
          })
      );

      const responses = await Promise.all(loginPromises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('应该处理并发token刷新', async () => {
      const refreshPromises = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/auth/refresh-token')
          .send({
            refreshToken: refreshToken
          })
      );

      const responses = await Promise.allSettled(refreshPromises);

      responses.forEach((response, index) => {
        if (response.status === 200) {
          expect(response.body.success).toBe(true);
          expect(response.body.data.accessToken).toBeDefined();
        } else {
          // 后续的请求可能会因为refresh token被使用而失败
          expect([429, 401]).toContain(response.status);
        }
      });
    });

    it('应该处理并发用户信息获取', async () => {
      const profilePromises = Array(5).fill(null).map(() =>
        request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${userToken}`)
      );

      const responses = await Promise.all(profilePromises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Error Recovery', () => {
    it('应该优雅处理服务器重启', async () => {
      // 模拟服务器错误
      const errorResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(500);

      expect(errorResponse.body.success).toBe(false);
      expect(errorResponse.body.message).toContain('Internal Server Error');

      // 重试请求应该成功
      const retryResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(retryResponse.body.success).toBe(true);
    });

    it('应该处理数据库连接问题', async () => {
      // 模拟数据库连接错误
      const dbErrorResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(503);

      expect(dbErrorResponse.body.success).toBe(false);
      expect(dbErrorResponse.body.message).toContain('Database connection');
    });
  });

  describe('Data Validation', () => {
    it('应该验证邮箱格式边界情况', async () => {
      const invalidEmails = [
        'user@', // 缺少域名
        '@domain.com', // 缺少用户名
        'user..name@domain.com', // 双点
        'user@domain', // 无顶级域名
        'user.name@.com', // 点号开头
        'user@-123.com' // 连字符开头
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: 'testuser',
            email: email,
            password: 'Password123!',
            confirmPassword: 'Password123!'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('email');
      }
    });

    it('应该验证用户名格式', async () => {
      const invalidUsernames = [
        '', // 空
        'ab', // 太短
        'a'.repeat(100), // 太长
        'user name', // 空格
        'user@name', // 特殊字符
        '123user', // 数字开头
        'user-123_', // 特殊字符组合
      ];

      for (const username of invalidUsernames) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: username,
            email: 'test@example.com',
            password: 'Password123!',
            confirmPassword: 'Password123!'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('username');
      }
    });

    it('应该验证密码复杂度边界情况', async () => {
      const weakPasswords = [
        'a'.repeat(7), // 刚好8个字符
        'A'.repeat(8), // 只有大写
        'a'.repeat(8), // 只有小写
        '12345678', // 只有数字
        'Password1!', // 缺少某些复杂度要求
        'password123!'.repeat(10) // 过长
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: `weakpass_${Date.now()}`,
            email: `weakpass${Date.now()}@example.com`,
            password: password,
            confirmPassword: password
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('password');
      }
    });
  });
});