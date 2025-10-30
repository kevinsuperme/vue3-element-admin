/**
 * @description: validate.ts 工具函数单元测试
 * @author: Kevin Wan
 * @date: 2025-10-30
 */

import { describe, it, expect } from 'vitest';
import {
  isExternal,
  validUsername,
  validURL,
  validLowerCase,
  validUpperCase,
  validAlphabets,
  validEmail,
  isString,
  isArray
} from '@/utils/validate';

describe('validate.ts - 验证工具函数测试', () => {
  describe('isExternal', () => {
    it('��该正确识别外部链接', () => {
      expect(isExternal('https://www.example.com')).toBe(true);
      expect(isExternal('http://example.com')).toBe(true);
      expect(isExternal('mailto:test@example.com')).toBe(true);
      expect(isExternal('tel:1234567890')).toBe(true);
      expect(isExternal('ftp://files.example.com')).toBe(true);
    });

    it('应该正确识别内部路径', () => {
      expect(isExternal('/dashboard')).toBe(false);
      expect(isExternal('/user/profile')).toBe(false);
      expect(isExternal('relative/path')).toBe(false);
      expect(isExternal('./local')).toBe(false);
      expect(isExternal('../parent')).toBe(false);
    });
  });

  describe('validUsername', () => {
    it('应该验证有效的用户名', () => {
      expect(validUsername('admin')).toBe(true);
      expect(validUsername('editor')).toBe(true);
      expect(validUsername(' admin ')).toBe(true); // 测试trim
    });

    it('应该拒绝无效的用户名', () => {
      expect(validUsername('user')).toBe(false);
      expect(validUsername('test')).toBe(false);
      expect(validUsername('')).toBe(false);
      expect(validUsername('ADMIN')).toBe(false); // 大小写敏感
    });
  });

  describe('validURL', () => {
    it('应该验证有效的URL', () => {
      expect(validURL('https://www.example.com')).toBe(true);
      expect(validURL('http://example.com:8080')).toBe(true);
      expect(validURL('ftp://files.example.com')).toBe(true);
      expect(validURL('https://subdomain.example.co.uk')).toBe(true);
    });

    it('应该拒绝无效的URL', () => {
      expect(validURL('not-a-url')).toBe(false);
      expect(validURL('www.example.com')).toBe(false); // 缺少协议
      expect(validURL('http://')).toBe(false);
      expect(validURL('')).toBe(false);
    });
  });

  describe('validLowerCase', () => {
    it('应该验证小写字母', () => {
      expect(validLowerCase('abc')).toBe(true);
      expect(validLowerCase('hello')).toBe(true);
      expect(validLowerCase('test123')).toBe(false); // 包含数字
    });

    it('应该拒绝非小写字母', () => {
      expect(validLowerCase('ABC')).toBe(false);
      expect(validLowerCase('Hello')).toBe(false);
      expect(validLowerCase('')).toBe(false);
      expect(validLowerCase('123')).toBe(false);
    });
  });

  describe('validUpperCase', () => {
    it('应该验证大写字母', () => {
      expect(validUpperCase('ABC')).toBe(true);
      expect(validUpperCase('HELLO')).toBe(true);
    });

    it('应该拒绝非大写字母', () => {
      expect(validUpperCase('abc')).toBe(false);
      expect(validUpperCase('Hello')).toBe(false);
      expect(validUpperCase('')).toBe(false);
      expect(validUpperCase('123')).toBe(false);
    });
  });

  describe('validAlphabets', () => {
    it('应该验证���母', () => {
      expect(validAlphabets('abc')).toBe(true);
      expect(validAlphabets('ABC')).toBe(true);
      expect(validAlphabets('Hello')).toBe(true);
    });

    it('应该拒绝非字母字符', () => {
      expect(validAlphabets('abc123')).toBe(false);
      expect(validAlphabets('hello-world')).toBe(false);
      expect(validAlphabets('')).toBe(false);
      expect(validAlphabets('123')).toBe(false);
    });
  });

  describe('validEmail', () => {
    it('应该验证有效邮箱地址', () => {
      expect(validEmail('test@example.com')).toBe(true);
      expect(validEmail('user.name@domain.co.uk')).toBe(true);
      expect(validEmail('user+tag@example.org')).toBe(true);
      expect(validEmail('user123@test-domain.com')).toBe(true);
    });

    it('应该拒绝无效邮箱地址', () => {
      expect(validEmail('not-an-email')).toBe(false);
      expect(validEmail('@example.com')).toBe(false);
      expect(validEmail('user@')).toBe(false);
      expect(validEmail('user@domain')).toBe(false); // 缺少顶级域名
      expect(validEmail('')).toBe(false);
    });
  });

  describe('isString', () => {
    it('应该识别字符串', () => {
      expect(isString('hello')).toBe(true);
      expect(isString('')).toBe(true);
      expect(isString(String('test'))).toBe(true);
    });

    it('应该拒绝非字符串', () => {
      expect(isString(123)).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString([])).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
    });
  });

  describe('isArray', () => {
    it('应该识别数组', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(['a', 'b', 'c'])).toBe(true);
      expect(isArray([])).toBe(true);
    });

    it('应该拒绝非数组', () => {
      expect(isArray({})).toBe(false);
      expect(isArray('')).toBe(false);
      expect(isArray(123)).toBe(false);
      expect(isArray(null)).toBe(false);
      expect(isArray(undefined)).toBe(false);
    });
  });
});
