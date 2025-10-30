import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';
import config from '../config';
import crypto from 'crypto';
import logger from '../utils/logger';
import { performanceMonitor } from '../utils/performance';

export class JWTService {
  // 生成访问令牌
  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, config.jwt.secret as jwt.Secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: config.app.name,
      audience: 'vue3-admin-app'
    } as jwt.SignOptions);
  }

  // 生成刷新令牌
  static generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, config.jwt.secret as jwt.Secret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: config.app.name,
      audience: 'vue3-admin-app'
    } as jwt.SignOptions);
  }

  // 验证令牌
  static verifyToken(token: string): JWTPayload {
    const startTime = Date.now();
    const requestId = `jwt_verify_${startTime}`;

    try {
      logger.debug('JWT verification started:', { requestId });

      const payload = jwt.verify(token, config.jwt.secret, {
        issuer: config.app.name,
        audience: 'vue3-admin-app'
      }) as JWTPayload;

      const duration = Date.now() - startTime;
      logger.debug('JWT verification completed successfully:', {
        userId: payload.userId,
        duration: `${duration}ms`,
        requestId
      });

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'JWT',
        url: 'jwt/verify',
        statusCode: 200,
        responseTime: duration,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      return payload;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.warn('JWT verification failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`,
        requestId
      });

      // 记录失败的性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'JWT',
        url: 'jwt/verify',
        statusCode: 401,
        responseTime: duration,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token已过期');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token无效');
      }
      throw new Error('Token验证失败');
    }
  }

  // 从请求头中提取令牌
  static extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  // 生成令牌指纹
  static generateTokenFingerprint(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // 生成令牌对
  static generateTokenPair(payload: JWTPayload): {
    accessToken: string;
    refreshToken: string;
    tokenFingerprint?: string;
  } {
    const tokenFingerprint = this.generateTokenFingerprint();

    // 在payload中添加指纹
    const payloadWithFingerprint = {
      ...payload,
      fingerprint: tokenFingerprint
    };

    return {
      accessToken: this.generateAccessToken(payloadWithFingerprint),
      refreshToken: this.generateRefreshToken(payloadWithFingerprint),
      tokenFingerprint
    };
  }

  // 解码令牌（不验证）
  static decodeToken(token: string): JWTPayload | null {
    return jwt.decode(token) as JWTPayload;
  }

  // 从令牌中提取载荷
  static extractPayload(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  // 验证令牌指纹
  static verifyTokenFingerprint(payload: JWTPayload, expectedFingerprint: string): boolean {
    return payload.fingerprint === expectedFingerprint;
  }

  // 检查令牌是否即将过期
  static isTokenExpiringSoon(token: string, thresholdMinutes: number = 15): boolean {
    try {
      const payload = this.extractPayload(token);
      if (!payload || !payload.exp) {
        return false;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - currentTime;

      return timeUntilExpiry > 0 && timeUntilExpiry <= thresholdMinutes * 60;
    } catch (error) {
      return false;
    }
  }
}

export default JWTService;
