import { Request, Response, NextFunction } from 'express';
import CacheService from '../services/CacheService';
import logger from '../utils/logger';

export interface CacheRequest extends Request {
  cacheKey?: string;
  cacheTTL?: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string; // Custom cache key
  condition?: (req: Request) => boolean; // Cache condition
  skipIf?: (req: Request) => boolean; // Skip cache condition
  vary?: string[]; // Vary cache based on request headers
}

/**
 * Response cache middleware
 */
export const responseCache = (options: CacheOptions = {}) => {
  const defaultTTL = options.ttl || 300; // 5 minutes default

  return async (req: CacheRequest, res: Response, next: NextFunction) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check skip condition
    if (options.skipIf && options.skipIf(req)) {
      return next();
    }

    // Check cache condition
    if (options.condition && !options.condition(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = options.key || generateCacheKey(req, options.vary);
    req.cacheKey = cacheKey;
    req.cacheTTL = defaultTTL;

    try {
      // Try to get from cache
      const cachedResponse = await CacheService.get(cacheKey);

      if (cachedResponse) {
        logger.debug('Cache hit:', { key: cacheKey });
        res.set(cachedResponse.headers);
        return res.status(cachedResponse.status).json(cachedResponse.data);
      }

      logger.debug('Cache miss:', { key: cacheKey });

      // Store original res.json and res.status methods
      const originalJson = res.json;
      const originalStatus = res.status;
      let statusCode = 200;
      let responseData: any;
      let responseHeaders: Record<string, string> = {};

      // Override res.json to capture response
      res.json = function(data: any) {
        responseData = data;
        return originalJson.call(this, data);
      };

      // Override res.status to capture status code
      res.status = function(code: number) {
        statusCode = code;
        return originalStatus.call(this, code);
      };

      // Store response headers
      const originalSet = res.set;
      res.set = function(field: string | any, val?: any) {
        if (typeof field === 'object') {
          responseHeaders = { ...responseHeaders, ...field };
        } else {
          responseHeaders[field] = val;
        }
        return originalSet.call(this, field, val);
      };

      // Continue to next middleware
      next();

      // After response is sent, cache it if successful
      res.on('finish', async () => {
        if (statusCode === 200 && responseData && req.cacheKey) {
          const cacheData = {
            status: statusCode,
            headers: responseHeaders,
            data: responseData,
            timestamp: new Date()
          };

          await CacheService.set(req.cacheKey, cacheData, { ttl: req.cacheTTL });
          logger.debug('Response cached:', { key: req.cacheKey, ttl: req.cacheTTL });
        }
      });
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next(); // Continue without caching on error
    }
  };
};

/**
 * Invalidate cache middleware
 */
export const invalidateCache = (patterns: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Continue with the request first
    next();

    // After successful response, invalidate cache
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const patternsArray = Array.isArray(patterns) ? patterns : [patterns];

        for (const pattern of patternsArray) {
          try {
            // Generate dynamic key if pattern contains placeholders
            const key = generateDynamicKey(pattern, req);
            await CacheService.del(key);
            logger.debug('Cache invalidated:', { key });
          } catch (error) {
            logger.error('Cache invalidation error:', { pattern, error });
          }
        }
      }
    });
  };
};

/**
 * Cache invalidation for routes with parameters
 */
export const invalidateByPrefix = (prefix: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    next();

    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await CacheService.clearPrefix(prefix);
          logger.debug('Cache cleared by prefix:', { prefix });
        } catch (error) {
          logger.error('Cache prefix clear error:', { prefix, error });
        }
      }
    });
  };
};

/**
 * User-specific cache middleware
 */
export const userCache = (options: CacheOptions = {}) => {
  return responseCache({
    ...options,
    vary: ['authorization', 'x-token'],
    key: options.key ? (req) => {
      const userId = getUserIdFromRequest(req);
      return `user:${userId}:${options.key}`;
    } : undefined
  });
};

/**
 * Rate limit cache middleware
 */
export const rateLimitCache = (windowMs: number = 900000) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `rate_limit:${getClientIp(req)}:${req.path}`;
    const count = await CacheService.increment(key, 1, { ttl: Math.ceil(windowMs / 1000) });

    res.set({
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': Math.max(0, 100 - count),
      'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
    });

    if (count > 100) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests',
        timestamp: new Date()
      });
    }

    next();
  };
};

/**
 * API response cache with intelligent invalidation
 */
export const smartCache = (options: CacheOptions & {
  tags?: string[];
  version?: string;
} = {}) => {
  return responseCache({
    ...options,
    key: options.key ? (req) => {
      let key = options.key!;
      if (options.version) {
        key += `:v${options.version}`;
      }
      if (options.tags && options.tags.length > 0) {
        key += `:tags:${options.tags.join(',')}`;
      }
      return key;
    } : undefined
  });
};

/**
 * Helper function to generate cache key
 */
function generateCacheKey(req: Request, varyHeaders?: string[]): string {
  const parts = [
    req.method.toLowerCase(),
    req.path,
    req.query ? JSON.stringify(req.query) : ''
  ];

  if (varyHeaders) {
    for (const header of varyHeaders) {
      const value = req.headers[header.toLowerCase()];
      if (value) {
        parts.push(`${header}:${value}`);
      }
    }
  }

  return parts.join(':').replace(/[^a-zA-Z0-9:_-]/g, '_');
}

/**
 * Helper function to generate dynamic cache key
 */
function generateDynamicKey(pattern: string, req: Request): string {
  return pattern
    .replace(':id', req.params.id || '')
    .replace(':userId', getUserIdFromRequest(req) || '')
    .replace(':method', req.method.toLowerCase())
    .replace(':path', req.path)
    .replace(':query', JSON.stringify(req.query));
}

/**
 * Helper function to get user ID from request
 */
function getUserIdFromRequest(req: Request): string | null {
  const authReq = req as any;
  return authReq.user?.userId || null;
}

/**
 * Helper function to get client IP
 */
function getClientIp(req: Request): string {
  return (req as any).ip ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection as any).socket?.remoteAddress ||
         'unknown';
}

export default {
  responseCache,
  invalidateCache,
  invalidateByPrefix,
  userCache,
  rateLimitCache,
  smartCache
};
