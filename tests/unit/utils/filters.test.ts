/**
 * @description: filters 工具函数单元测试
 * @author: Kevin Wan
 * @date: 2025-10-30
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as filters from '@/utils/filters';

describe('Filters Utils - 过滤器工具函数测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Date Filters', () => {
    it('应该格式化日期', () => {
      const { formatDate } = filters;

      const date = new Date('2023-12-25T10:30:00');
      expect(formatDate(date)).toBe('2023-12-25');
      expect(formatDate(date, 'YYYY-MM-DD HH:mm')).toBe('2023-12-25 10:30');
    });

    it('应该格式化相对时间', () => {
      const { formatRelativeTime } = filters;

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(formatRelativeTime(oneHourAgo)).toBe('1小时前');
      expect(formatRelativeTime(oneDayAgo)).toBe('1天前');
    });

    it('应该处理无效日期', () => {
      const { formatDate, formatRelativeTime } = filters;

      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
      expect(formatDate('invalid')).toBe('');
      expect(formatRelativeTime(null)).toBe('');
      expect(formatRelativeTime('invalid')).toBe('');
    });
  });

  describe('Number Filters', () => {
    it('应该格式化数字', () => {
      const { formatNumber } = filters;

      expect(formatNumber(1234)).toBe('1,234');
      expect(formatNumber(1234567)).toBe('1,234,567');
      expect(formatNumber(1234.567)).toBe('1,234.567');
    });

    it('应该格式化货币', () => {
      const { formatCurrency } = filters;

      expect(formatCurrency(1234.56)).toBe('¥1,234.56');
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
    });

    it('应该格式化百分比', () => {
      const { formatPercent } = filters;

      expect(formatPercent(0.1234)).toBe('12.34%');
      expect(formatPercent(0.1234, 1)).toBe('12.3%');
      expect(formatPercent(0.5)).toBe('50.00%');
    });

    it('应该格式化文件大小', () => {
      const { formatFileSize } = filters;

      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
      expect(formatFileSize(500)).toBe('500.00 B');
    });
  });

  describe('String Filters', () => {
    it('应该截断文本', () => {
      const { truncate } = filters;

      expect(truncate('Hello World', 5)).toBe('Hello...');
      expect(truncate('Hello World', 5, '...')).toBe('Hello...');
      expect(truncate('Hello World', 10)).toBe('Hello World');
    });

    it('应该首字母大写', () => {
      const { capitalize } = require('@/utils/filters');

      expect(capitalize('hello world')).toBe('Hello world');
      expect(capitalize('HELLO WORLD')).toBe('HELLO WORLD');
      expect(capitalize('')).toBe('');
    });

    it('应该标题格式化', () => {
      const { titleCase } = require('@/utils/filters');

      expect(titleCase('hello world')).toBe('Hello World');
      expect(titleCase('hello-world_test')).toBe('Hello World Test');
      expect(titleCase('')).toBe('');
    });

    it('应该转换驼峰命名', () => {
      const { camelCase } = require('@/utils/filters');

      expect(camelCase('hello world')).toBe('helloWorld');
      expect(camelCase('hello-world')).toBe('helloWorld');
      expect(camelCase('hello_world')).toBe('helloWorld');
    });

    it('应该转换短横线命名', () => {
      const { kebabCase } = require('@/utils/filters');

      expect(kebabCase('helloWorld')).toBe('hello-world');
      expect(kebabCase('Hello World')).toBe('hello-world');
      expect(kebabCase('hello_world')).toBe('hello-world');
    });

    it('应该转换下划线命名', () => {
      const { snakeCase } = require('@/utils/filters');

      expect(snakeCase('helloWorld')).toBe('hello_world');
      expect(snakeCase('Hello World')).toBe('hello_world');
      expect(snakeCase('hello-world')).toBe('hello_world');
    });
  });

  describe('Array Filters', () => {
    it('应该去重数组', () => {
      const { unique } = require('@/utils/filters');

      expect(unique([1, 2, 2, 3, 1, 4])).toEqual([1, 2, 3, 4]);
      expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('应该数组排序', () => {
      const { sortBy } = require('@/utils/filters');

      const users = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
        { name: 'Charlie', age: 20 }
      ];

      expect(sortBy(users, 'age')).toEqual([
        { name: 'Charlie', age: 20 },
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 }
      ]);

      expect(sortBy(users, 'name')).toEqual([
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
        { name: 'Charlie', age: 20 }
      ]);
    });

    it('应该数组分组', () => {
      const { groupBy } = require('@/utils/filters');

      const items = [
        { category: 'A', value: 1 },
        { category: 'B', value: 2 },
        { category: 'A', value: 3 }
      ];

      const grouped = groupBy(items, 'category');
      expect(grouped).toEqual({
        A: [
          { category: 'A', value: 1 },
          { category: 'A', value: 3 }
        ],
        B: [{ category: 'B', value: 2 }]
      });
    });
  });

  describe('Object Filters', () => {
    it('应该深度获取对象属性', () => {
      const { get } = require('@/utils/filters');

      const obj = {
        user: {
          profile: {
            name: 'John Doe',
            address: {
              city: 'New York'
            }
          }
        }
      };

      expect(get(obj, 'user.profile.name')).toBe('John Doe');
      expect(get(obj, 'user.profile.address.city')).toBe('New York');
      expect(get(obj, 'user.profile.nonexistent')).toBeUndefined();
      expect(get(obj, 'user.profile.nonexistent', 'default')).toBe('default');
    });

    it('应该选择对象属性', () => {
      const { pick } = require('@/utils/filters');

      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const picked = pick(obj, ['a', 'c']);

      expect(picked).toEqual({ a: 1, c: 3 });
    });

    it('应该排除对象属性', () => {
      const { omit } = require('@/utils/filters');

      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const omitted = omit(obj, ['b', 'd']);

      expect(omitted).toEqual({ a: 1, c: 3 });
    });
  });

  describe('Validation Filters', () => {
    it('应该验证邮箱格式', () => {
      const { isEmail } = require('@/utils/filters');

      expect(isEmail('test@example.com')).toBe(true);
      expect(isEmail('user.name@domain.co.uk')).toBe(true);
      expect(isEmail('invalid-email')).toBe(false);
      expect(isEmail('@example.com')).toBe(false);
    });

    it('应该验证URL格式', () => {
      const { isUrl } = require('@/utils/filters');

      expect(isUrl('https://www.example.com')).toBe(true);
      expect(isUrl('http://example.com')).toBe(true);
      expect(isUrl('ftp://files.example.com')).toBe(true);
      expect(isUrl('not-a-url')).toBe(false);
      expect(isUrl('www.example.com')).toBe(false);
    });

    it('应该验证手机号格式', () => {
      const { isPhone } = require('@/utils/filters');

      expect(isPhone('13812345678')).toBe(true);
      expect(isPhone('15912345678')).toBe(true);
      expect(isPhone('12345678901')).toBe(false);
      expect(isPhone('1381234567')).toBe(false);
    });

    it('应该验证身份证号格式', () => {
      const { isIdCard } = require('@/utils/filters');

      expect(isIdCard('11010119900307234X')).toBe(true);
      expect(isIdCard('11010119900307234')).toBe(false);
      expect(isIdCard('123456789012345678')).toBe(false);
    });
  });

  describe('Color Filters', () => {
    it('应该转换颜色格式', () => {
      const { hexToRgb, rgbToHex } = require('@/utils/filters');

      expect(hexToRgb('#FF0000')).toBe('rgb(255, 0, 0)');
      expect(hexToRgb('#00FF00')).toBe('rgb(0, 255, 0)');
      expect(hexToRgb('#0000FF')).toBe('rgb(0, 0, 255)');

      expect(rgbToHex('rgb(255, 0, 0)')).toBe('#FF0000');
      expect(rgbToHex('rgb(0, 255, 0)')).toBe('#00FF00');
      expect(rgbToHex('rgb(0, 0, 255)')).toBe('#0000FF');
    });

    it('应该调整颜色亮度', () => {
      const { adjustBrightness } = require('@/utils/filters');

      expect(adjustBrightness('#FF0000', 0.5)).toBe('#FF8080');
      expect(adjustBrightness('#0000FF', 0.5)).toBe('#8080FF');
      expect(adjustBrightness('#00FF00', -0.5)).toBe('#008000');
    });
  });

  describe('Data Transformation Filters', () => {
    it('应该转换数据类型', () => {
      const { toNumber, toString, toBoolean } = require('@/utils/filters');

      expect(toNumber('123')).toBe(123);
      expect(toNumber('123.45')).toBe(123.45);
      expect(toNumber('invalid')).toBe(NaN);

      expect(toString(123)).toBe('123');
      expect(toString(null)).toBe('');
      expect(toString(undefined)).toBe('');

      expect(toBoolean('true')).toBe(true);
      expect(toBoolean('false')).toBe(false);
      expect(toBoolean(1)).toBe(true);
      expect(toBoolean(0)).toBe(false);
    });

    it('应该JSON序列化和反序列化', () => {
      const { toJson, fromJson } = require('@/utils/filters');

      const obj = { name: 'John', age: 30 };
      const jsonStr = toJson(obj);

      expect(jsonStr).toBe('{"name":"John","age":30}');
      expect(fromJson(jsonStr)).toEqual(obj);
      expect(fromJson('invalid')).toBeNull();
    });
  });

  describe('Utility Filters', () => {
    it('应该生成随机字符串', () => {
      const { randomString } = require('@/utils/filters');

      const str1 = randomString(10);
      const str2 = randomString(10);

      expect(str1).toHaveLength(10);
      expect(str2).toHaveLength(10);
      expect(str1).not.toBe(str2);
    });

    it('应该生成UUID', () => {
      const { uuid } = require('@/utils/filters');

      const id1 = uuid();
      const id2 = uuid();

      expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(id2).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(id1).not.toBe(id2);
    });

    it('应该防抖函数', async () => {
      const { debounce } = require('@/utils/filters');

      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('应该节流函数', async () => {
      const { throttle } = require('@/utils/filters');

      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);

      await new Promise(resolve => setTimeout(resolve, 150));
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
