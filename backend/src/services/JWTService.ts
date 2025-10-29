import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';
import config from '../config';

export class JWTService {
  // 生成访问令牌
  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, config.jwt.secret as jwt.Secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }

  // 生成刷新令牌
  static generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, config.jwt.secret as jwt.Secret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);
  }

  // 验证令牌
  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // 从请求头中提取令牌
  static extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  // 生成令牌对
  static generateTokenPair(payload: JWTPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  // 解码令牌（不验证）
  static decodeToken(token: string): JWTPayload | null {
    return jwt.decode(token) as JWTPayload;
  }
}

export default JWTService;