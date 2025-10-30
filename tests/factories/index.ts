import { faker } from '@faker-js/faker';

/**
 * 用户数据工厂
 */
export class UserFactory {
  static create(overrides?: Partial<User>): User {
    return {
      _id: faker.datatype.uuid(),
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: faker.internet.password(12, true, /[A-Z]/, 'Aa1!'),
      avatar: faker.internet.avatar(),
      roles: ['user'],
      isActive: true,
      lastLogin: faker.date.recent(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  static createMany(count: number, overrides?: Partial<User>): User[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createAdmin(overrides?: Partial<User>): User {
    return this.create({
      roles: ['admin', 'user'],
      ...overrides
    });
  }
}

/**
 * API响应数据工厂
 */
export class ApiResponseFactory {
  static success<T>(data: T, message?: string) {
    return {
      success: true,
      message: message || '操作成功',
      data,
      code: 200,
      timestamp: new Date().toISOString()
    };
  }

  static error(message: string, code: number = 500, data?: any) {
    return {
      success: false,
      message,
      data,
      code,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 测试数据工厂
 */
export class TestDataFactory {
  static loginRequest(overrides?: Partial<LoginRequest>): LoginRequest {
    return {
      username: faker.internet.userName(),
      password: faker.internet.password(),
      ...overrides
    };
  }

  static registerRequest(overrides?: Partial<RegisterRequest>): RegisterRequest {
    return {
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: faker.internet.password(12, true, /[A-Z]/, 'Aa1!'),
      confirmPassword: faker.internet.password(12, true, /[A-Z]/, 'Aa1!'),
      ...overrides
    };
  }
}

/**
 * 请求工厂
 */
export class RequestFactory {
  static create(method: string, url: string, data?: any) {
    return {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': faker.datatype.uuid()
      },
      body: data ? JSON.stringify(data) : undefined
    };
  }
}

export default {
  UserFactory,
  ApiResponseFactory,
  TestDataFactory,
  RequestFactory
};
