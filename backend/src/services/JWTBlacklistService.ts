import logger from '../utils/logger';
import config from '../config';
import { performanceMonitor } from '../utils/performance';

// 动态导入redis，避免在未安装时出错

let createClient: any = null;
try {
  const redis = require('redis');
  createClient = redis.createClient;
} catch (error) {
  logger.warn('Redis not installed, using memory blacklist only');
}

// 内存黑名单（开发环境使用）
class MemoryBlacklist {
  private blacklistedTokens = new Set<string>();
  private tokenExpiry = new Map<string, number>();

  add(token: string, expiryTime: number): void {
    this.blacklistedTokens.add(token);
    this.tokenExpiry.set(token, expiryTime);

    // 设置自动清理
    setTimeout(() => {
      this.remove(token);
    }, expiryTime - Date.now());
  }

  remove(token: string): void {
    this.blacklistedTokens.delete(token);
    this.tokenExpiry.delete(token);
  }

  isBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  clear(): void {
    this.blacklistedTokens.clear();
    this.tokenExpiry.clear();
  }

  // 清理过期令牌
  cleanup(): void {
    const now = Date.now();
    for (const [token, expiry] of this.tokenExpiry.entries()) {
      if (expiry <= now) {
        this.remove(token);
      }
    }
  }
}

class JWTBlacklistService {
  private static instance: JWTBlacklistService;

  private redisClient: any = null;
  private memoryBlacklist: MemoryBlacklist;
  private useRedis = false;

  private constructor() {
    this.memoryBlacklist = new MemoryBlacklist();
    this.initializeRedis();

    // 定期清理内存黑名单
    setInterval(() => {
      this.memoryBlacklist.cleanup();
    }, 5 * 60 * 1000); // 每5分钟清理一次
  }

  public static getInstance(): JWTBlacklistService {
    if (!JWTBlacklistService.instance) {
      JWTBlacklistService.instance = new JWTBlacklistService();
    }
    return JWTBlacklistService.instance;
  }

  private async initializeRedis(): Promise<void> {
    try {
      if (config.redis) {
        this.redisClient = createClient({
          socket: {
            host: config.redis.host,
            port: config.redis.port
          },
          password: config.redis.password
        });

        await this.redisClient.connect();
        this.useRedis = true;
        logger.info('Redis blacklist service connected');
      }
    } catch (error) {
      logger.warn('Redis not available, using memory blacklist:', error);
      this.useRedis = false;
    }
  }

  /**
   * 将令牌加入黑名单
   */
  public async addToBlacklist(token: string, expiryTime: number): Promise<void> {
    const startTime = Date.now();
    const requestId = `blacklist_add_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info('Adding token to blacklist:', {
      requestId,
      tokenPrefix: token.substring(0, 10),
      useRedis: this.useRedis
    });

    try {
      const ttl = Math.ceil((expiryTime - Date.now()) / 1000);

      if (this.useRedis && this.redisClient) {
        await this.redisClient.setEx(`blacklist:${token}`, ttl, '1');
      } else {
        this.memoryBlacklist.add(token, expiryTime);
      }

      logger.info(`Token added to blacklist successfully:`, {
        requestId,
        tokenPrefix: token.substring(0, 10),
        duration: Date.now() - startTime
      });

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'POST',
        url: '/api/auth/blacklist',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to add token to blacklist:', {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });

      // 记录错误性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'POST',
        url: '/api/auth/blacklist',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      throw error;
    }
  }

  /**
   * 检查令牌是否在黑名单中
   */
  public async isBlacklisted(token: string): Promise<boolean> {
    const startTime = Date.now();
    const requestId = `blacklist_check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info('Checking token blacklist status:', {
      requestId,
      tokenPrefix: token.substring(0, 10),
      useRedis: this.useRedis
    });

    try {
      let isBlacklisted = false;

      if (this.useRedis && this.redisClient) {
        const result = await this.redisClient.get(`blacklist:${token}`);
        isBlacklisted = result === '1';
      } else {
        isBlacklisted = this.memoryBlacklist.isBlacklisted(token);
      }

      logger.info('Token blacklist check completed:', {
        requestId,
        tokenPrefix: token.substring(0, 10),
        isBlacklisted,
        duration: Date.now() - startTime
      });

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: '/api/auth/blacklist/check',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      return isBlacklisted;
    } catch (error) {
      logger.error('Failed to check token blacklist status:', {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });

      // 记录错误性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: '/api/auth/blacklist/check',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      return false;
    }
  }

  /**
   * 从黑名单中移除令牌
   */
  public async removeFromBlacklist(token: string): Promise<void> {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.del(`blacklist:${token}`);
      } else {
        this.memoryBlacklist.remove(token);
      }

      logger.info(`Token removed from blacklist: ${token.substring(0, 10)}...`);
    } catch (error) {
      logger.error('Failed to remove token from blacklist:', error);
    }
  }

  /**
   * 清空黑名单
   */
  public async clearBlacklist(): Promise<void> {
    try {
      if (this.useRedis && this.redisClient) {
        const keys = await this.redisClient.keys('blacklist:*');
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      } else {
        this.memoryBlacklist.clear();
      }

      logger.info('Token blacklist cleared');
    } catch (error) {
      logger.error('Failed to clear token blacklist:', error);
    }
  }

  /**
   * 获取黑名单统计信息
   */
  public async getBlacklistStats(): Promise<{ total: number; useRedis: boolean }> {
    try {
      let total = 0;

      if (this.useRedis && this.redisClient) {
        const keys = await this.redisClient.keys('blacklist:*');
        total = keys.length;
      } else {
        // 无法直接获取内存黑名单大小，返回估算值
        total = -1;
      }

      return {
        total,
        useRedis: this.useRedis
      };
    } catch (error) {
      logger.error('Failed to get blacklist stats:', error);
      return { total: 0, useRedis: this.useRedis };
    }
  }

  /**
   * 关闭服务
   */
  public async shutdown(): Promise<void> {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      logger.info('JWT blacklist service shutdown');
    } catch (error) {
      logger.error('Failed to shutdown JWT blacklist service:', error);
    }
  }
}

export default JWTBlacklistService;
