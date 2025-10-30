/**
 * 日志工具单元测试
 * @description: 测试前端日志工具的功能
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import logger from '@/utils/logger';

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

// Store original console
const originalConsole = global.console;

describe('Logger Utility', () => {
  beforeEach(() => {
    // Mock console methods
    global.console = mockConsole;
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original console
    global.console = originalConsole;
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      // Mock development environment
      vi.stubEnv('VITE_ENV', 'development');
      // Re-import logger to pick up new environment
      vi.resetModules();
    });

    it('应该启用所有日志方法', async () => {
      const devLogger = (await import('@/utils/logger')).default;

      devLogger.log('Test log message');
      devLogger.warn('Test warning message');
      devLogger.error('Test error message');
      devLogger.debug('Test debug message');

      expect(mockConsole.log).toHaveBeenCalledWith('Test log message');
      expect(mockConsole.warn).toHaveBeenCalledWith('Test warning message');
      expect(mockConsole.error).toHaveBeenCalledWith('Test error message');
      expect(mockConsole.debug).toHaveBeenCalledWith('Test debug message');
    });

    it('应该支持多个参数', () => {
      const devLogger = (await import('@/utils/logger')).default;

      devLogger.log('Message', { data: 'test' }, 123);

      expect(mockConsole.log).toHaveBeenCalledWith('Message', { data: 'test' }, 123);
    });

    it('应该支持对象和数组参数', () => {
      const devLogger = (await import('@/utils/logger')).default;

      const testData = {
        user: 'test',
        items: [1, 2, 3],
        nested: { value: 'nested' }
      };

      devLogger.log('Complex data:', testData);

      expect(mockConsole.log).toHaveBeenCalledWith('Complex data:', testData);
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      // Mock production environment
      vi.stubEnv('VITE_ENV', 'production');
      vi.resetModules();
    });

    it('应该禁用所有日志方法', async () => {
      const prodLogger = (await import('@/utils/logger')).default;

      prodLogger.log('This should not appear');
      prodLogger.warn('This should not appear');
      prodLogger.error('This should not appear');
      prodLogger.debug('This should not appear');

      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
      expect(mockConsole.debug).not.toHaveBeenCalled();
    });

    it('应该静默处理所有日志调用', () => {
      const prodLogger = (await import('@/utils/logger')).default;

      // 调用日志方法不应该抛出错误
      expect(() => {
        prodLogger.log('Test message');
        prodLogger.warn('Test warning');
        prodLogger.error('Test error');
        prodLogger.debug('Test debug');
      }).not.toThrow();
    });
  });

  describe('Default Behavior', () => {
    it('应该在默认情况下启用日志', () => {
      logger.log('Default log message');
      logger.warn('Default warning message');
      logger.error('Default error message');
      logger.debug('Default debug message');

      expect(mockConsole.log).toHaveBeenCalledWith('Default log message');
      expect(mockConsole.warn).toHaveBeenCalledWith('Default warning message');
      expect(mockConsole.error).toHaveBeenCalledWith('Default error message');
      expect(mockConsole.debug).toHaveBeenCalledWith('Default debug message');
    });
  });

  describe('Error Handling', () => {
    it('应该处理循环引用对象', () => {
      const circularObject: any = { name: 'test' };
      circularObject.self = circularObject;

      expect(() => {
        logger.log('Circular reference:', circularObject);
      }).not.toThrow();
    });

    it('应该处理null和undefined参数', () => {
      expect(() => {
        logger.log(null);
        logger.log(undefined);
        logger.log('Message', null, undefined);
      }).not.toThrow();
    });

    it('应该处理函数参数', () => {
      const testFunction = () => 'test';

      expect(() => {
        logger.log('Function:', testFunction);
      }).not.toThrow();
    });
  });

  describe('性能 Considerations', () => {
    it('应该在高频调用时保持性能', () => {
      const startTime = performance.now();

      // 大量日志调用
      for (let i = 0; i < 1000; i++) {
        logger.log(`Log message ${i}`, { index: i });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 应该在合理时间内完成（小于100ms）
      expect(duration).toBeLessThan(100);
    });

    it('应该避免不必要的字符串拼接', () => {
      const largeObject = {};

      // 创建一个大对象
      for (let i = 0; i < 1000; i++) {
        largeObject[`key${i}`] = `value${i}`.repeat(100);
      }

      const startTime = performance.now();

      logger.log('Large object:', largeObject);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 应该在合理时间内处理大对象
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Edge Cases', () => {
    it('应该处理emoji和特殊字符', () => {
      const specialMessages = [
        '🚀 Rocket launch!',
        '😀 Emoji test',
        '中文测试',
        'Español prueba',
        'Русский тест',
        'العربية اختبار',
        '🔥 Fire and ice ❄️',
        'Math symbols: ∑∏∫∆∇∂'
      ];

      specialMessages.forEach(message => {
        expect(() => {
          logger.log(message);
        }).not.toThrow();
        expect(mockConsole.log).toHaveBeenLastCalledWith(message);
      });
    });

    it('应该处理非常长的消息', () => {
      const longMessage = 'x'.repeat(10000);

      expect(() => {
        logger.log('Long message:', longMessage);
      }).not.toThrow();
    });

    it('应该处理二进制数据', () => {
      const binaryData = new Uint8Array([0xFF, 0xFE, 0xFD, 0xFC]);

      expect(() => {
        logger.log('Binary data:', binaryData);
      }).not.toThrow();
    });
  });
});
