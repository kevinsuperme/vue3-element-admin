import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';

/**
 * 用户测试数据工厂
 */
export class UserTestFactory {
  static create(overrides?: Partial<any>) {
    return {
      _id: new mongoose.Types.ObjectId(),
      username: faker.internet.username(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12, memorable: false, pattern: /[A-Za-z0-9!@#]/ }),
      avatar: faker.image.avatar(),
      roles: ['user'],
      isActive: true,
      lastLogin: faker.date.recent(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  static createAdmin(overrides?: Partial<any>) {
    return this.create({
      roles: ['admin', 'user'],
      ...overrides
    });
  }

  static createMany(count: number, overrides?: Partial<any>) {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}

/**
 * 登录日志测试数据工厂
 */
export class LoginLogTestFactory {
  static create(overrides?: Partial<any>) {
    return {
      _id: new mongoose.Types.ObjectId(),
      username: faker.internet.username(),
      ip: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
      success: true,
      error: null,
      timestamp: faker.date.recent(),
      ...overrides
    };
  }

  static createFailed(overrides?: Partial<any>) {
    return this.create({
      success: false,
      error: 'Invalid credentials',
      ...overrides
    });
  }
}

/**
 * 错误日志测试数据工厂
 */
export class ErrorLogTestFactory {
  static create(overrides?: Partial<any>) {
    return {
      _id: new mongoose.Types.ObjectId(),
      message: faker.lorem.sentence(),
      stack: faker.lorem.paragraphs(3),
      url: faker.internet.url(),
      userAgent: faker.internet.userAgent(),
      ip: faker.internet.ip(),
      userId: faker.string.uuid(),
      timestamp: faker.date.recent(),
      resolved: false,
      ...overrides
    };
  }
}

/**
 * 文件测试数据工厂
 */
export class FileTestFactory {
  static create(overrides?: Partial<any>) {
    return {
      _id: new mongoose.Types.ObjectId(),
      originalName: faker.system.fileName(),
      filename: `${faker.system.fileName()}.jpg`,
      mimetype: 'image/jpeg',
      size: faker.number.int({ min: 1000, max: 5000000 }),
      path: faker.system.filePath(),
      url: faker.internet.url(),
      uploadedBy: new mongoose.Types.ObjectId(),
      isPublic: true,
      tags: [faker.lorem.word(), faker.lorem.word()],
      metadata: {
        width: faker.number.int({ min: 100, max: 1920 }),
        height: faker.number.int({ min: 100, max: 1080 })
      },
      createdAt: faker.date.recent(),
      ...overrides
    };
  }
}

/**
 * 测试辅助函数
 */
export class TestHelpers {
  static generateValidUser() {
    return {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'Test123!@#',
      confirmPassword: 'Test123!@#'
    };
  }

  static generateJWTToken(_userId: string) {
    return {
      accessToken: faker.string.alphanumeric(64),
      refreshToken: faker.string.alphanumeric(64),
      tokenFingerprint: faker.string.uuid()
    };
  }

  static createMockReq(overrides?: Partial<any>) {
    return {
      body: {},
      params: {},
      query: {},
      headers: {},
      ip: faker.internet.ip(),
      method: 'GET',
      originalUrl: faker.internet.url(),
      user: {
        userId: faker.string.uuid(),
        username: faker.internet.username(),
        roles: ['user']
      },
      ...overrides
    };
  }

  static createMockRes() {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
  }
}

export default {
  UserTestFactory,
  LoginLogTestFactory,
  ErrorLogTestFactory,
  FileTestFactory,
  TestHelpers
};
