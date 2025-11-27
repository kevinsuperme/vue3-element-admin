import Redis from 'ioredis';
import logger from '../utils/logger';
import config from '../config';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
}

class CacheService {
  private client: Redis | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    if (!config.redis) {
      logger.warn('Redis configuration not found, caching disabled');
      return;
    }

    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          return err.message.includes(targetError);
        },
        retryDelayOnClusterDown: 300
      });

      // Event listeners
      this.client.on('connect', () => {
        logger.info('Redis connected successfully');
        this.connected = true;
        this.reconnectAttempts = 0;
      });

      this.client.on('error', (error) => {
        logger.error('Redis connection error:', error);
        this.connected = false;
      });

      this.client.on('close', () => {
        logger.warn('Redis connection closed');
        this.connected = false;
        this.handleReconnection();
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      // Connect to Redis
      await this.client.connect();
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.connected = false;
    }
  }

  private async handleReconnection(): Promise<void> {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      logger.info(`Attempting to reconnect to Redis (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(async () => {
        try {
          await this.client?.connect();
        } catch (error) {
          logger.error('Redis reconnection failed:', error);
        }
      }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
    } else {
      logger.error('Max Redis reconnection attempts reached');
    }
  }

  public isConnected(): boolean {
    return this.connected && this.client?.status === 'ready';
  }

  /**
   * Set a value in cache
   */
  public async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    if (!this.isConnected()) {
      logger.warn('Redis not connected, skipping cache set operation');
      return;
    }

    try {
      const fullKey = this.buildKey(key, options.prefix);
      const serializedValue = JSON.stringify(value);

      if (options.ttl) {
        await this.client!.setex(fullKey, options.ttl, serializedValue);
      } else {
        await this.client!.set(fullKey, serializedValue);
      }

      logger.debug('Cache set successful:', { key: fullKey, ttl: options.ttl });
    } catch (error) {
      logger.error('Cache set error:', { key, error });
    }
  }

  /**
   * Get a value from cache
   */
  public async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    if (!this.isConnected()) {
      logger.warn('Redis not connected, skipping cache get operation');
      return null;
    }

    try {
      const fullKey = this.buildKey(key, options.prefix);
      const value = await this.client!.get(fullKey);

      if (value === null) {
        logger.debug('Cache miss:', { key: fullKey });
        return null;
      }

      const parsedValue = JSON.parse(value);
      logger.debug('Cache hit:', { key: fullKey });

      return parsedValue;
    } catch (error) {
      logger.error('Cache get error:', { key, error });
      return null;
    }
  }

  /**
   * Delete a key from cache
   */
  public async del(key: string, options: CacheOptions = {}): Promise<void> {
    if (!this.isConnected()) {
      logger.warn('Redis not connected, skipping cache delete operation');
      return;
    }

    try {
      const fullKey = this.buildKey(key, options.prefix);
      await this.client!.del(fullKey);
      logger.debug('Cache delete successful:', { key: fullKey });
    } catch (error) {
      logger.error('Cache delete error:', { key, error });
    }
  }

  /**
   * Check if a key exists in cache
   */
  public async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key, options.prefix);
      const result = await this.client!.exists(fullKey);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', { key, error });
      return false;
    }
  }

  /**
   * Set a value in cache if it doesn't exist
   */
  public async setIfNotExists(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key, options.prefix);
      const serializedValue = JSON.stringify(value);

      const result = await this.client!.set(fullKey, serializedValue, 'EX', options.ttl || 3600, 'NX');

      return result === 'OK';
    } catch (error) {
      logger.error('Cache setIfNotExists error:', { key, error });
      return false;
    }
  }

  /**
   * Increment a numeric value
   */
  public async increment(key: string, amount: number = 1, options: CacheOptions = {}): Promise<number> {
    if (!this.isConnected()) {
      return 0;
    }

    try {
      const fullKey = this.buildKey(key, options.prefix);
      return await this.client!.incrby(fullKey, amount);
    } catch (error) {
      logger.error('Cache increment error:', { key, error });
      return 0;
    }
  }

  /**
   * Set expiration on existing key
   */
  public async expire(key: string, ttl: number, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key, options.prefix);
      const result = await this.client!.expire(fullKey, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Cache expire error:', { key, error });
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  public async ttl(key: string, options: CacheOptions = {}): Promise<number> {
    if (!this.isConnected()) {
      return -1;
    }

    try {
      const fullKey = this.buildKey(key, options.prefix);
      return await this.client!.ttl(fullKey);
    } catch (error) {
      logger.error('Cache TTL error:', { key, error });
      return -1;
    }
  }

  /**
   * Clear all cache with specific prefix
   */
  public async clearPrefix(prefix: string): Promise<void> {
    if (!this.isConnected()) {
      return;
    }

    try {
      const pattern = `${config.cache.prefix}:${prefix}:*`;
      const keys = await this.client!.keys(pattern);

      if (keys.length > 0) {
        await this.client!.del(...keys);
        logger.info(`Cache cleared for prefix: ${prefix}`, { keysDeleted: keys.length });
      }
    } catch (error) {
      logger.error('Cache clear prefix error:', { prefix, error });
    }
  }

  /**
   * Get cache statistics
   */
  public async getStats(): Promise<any> {
    if (!this.isConnected()) {
      return null;
    }

    try {
      const info = await this.client!.info('memory');
      const keyspace = await this.client!.info('keyspace');

      return {
        connected: this.connected,
        memory: info,
        keyspace: keyspace,
        reconnectAttempts: this.reconnectAttempts
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return null;
    }
  }

  /**
   * Build full cache key with prefix
   */
  private buildKey(key: string, customPrefix?: string): string {
    const prefix = customPrefix || config.cache.prefix;
    return `${prefix}:${key}`;
  }

  /**
   * Close Redis connection
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.connected = false;
      logger.info('Redis disconnected');
    }
  }

  /**
   * Health check for Redis
   */
  public async healthCheck(): Promise<{ status: string; latency?: number; error?: string }> {
    if (!this.isConnected()) {
      return { status: 'disconnected', error: 'Redis not connected' };
    }

    try {
      const startTime = Date.now();
      await this.client!.ping();
      const latency = Date.now() - startTime;

      return { status: 'healthy', latency };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export default new CacheService();
