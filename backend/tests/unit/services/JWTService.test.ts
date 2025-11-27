import { describe, it, expect, beforeEach } from '@jest/globals';
import JWTService from '../../../src/services/JWTService';
import config from '../../../src/config';

// Mock config
jest.mock('../../../src/config', () => ({
  jwt: {
    secret: 'test-secret-key-64-bytes-long-for-testing-only',
    expiresIn: '1h',
    refreshExpiresIn: '7d'
  },
  app: {
    name: 'Test App'
  }
}));

describe('JWTService', () => {
  const mockPayload = {
    userId: '507f1f77bcf86cd799439011',
    username: 'testuser',
    roles: ['user']
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = JWTService.generateAccessToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include correct claims in token', () => {
      const token = JWTService.generateAccessToken(mockPayload);
      const decoded = JWTService.decodeToken(token);

      expect(decoded).toMatchObject(mockPayload);
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
      expect(decoded).toHaveProperty('iss', 'Test App');
      expect(decoded).toHaveProperty('aud', 'vue3-admin-app');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = JWTService.generateRefreshToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token successfully', () => {
      const token = JWTService.generateAccessToken(mockPayload);
      const decoded = JWTService.verifyToken(token);

      expect(decoded).toMatchObject(mockPayload);
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        JWTService.verifyToken(invalidToken);
      }).toThrow('Token无效');
    });

    it('should throw error for expired token', () => {
      // Create an expired token
      const expiredPayload = {
        ...mockPayload,
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };

      const expiredToken = require('jsonwebtoken').sign(
        expiredPayload,
        config.jwt.secret,
        { issuer: config.app.name, audience: 'vue3-admin-app' }
      );

      expect(() => {
        JWTService.verifyToken(expiredToken);
      }).toThrow('Token已过期');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'Bearer valid-token-here';
      const extracted = JWTService.extractTokenFromHeader(token);

      expect(extracted).toBe('valid-token-here');
    });

    it('should return null for invalid header format', () => {
      const invalidToken = 'Basic valid-token-here';
      const extracted = JWTService.extractTokenFromHeader(invalidToken);

      expect(extracted).toBeNull();
    });

    it('should return null for empty header', () => {
      const extracted = JWTService.extractTokenFromHeader('');

      expect(extracted).toBeNull();
    });

    it('should return null for null header', () => {
      const extracted = JWTService.extractTokenFromHeader(null as any);

      expect(extracted).toBeNull();
    });
  });

  describe('generateTokenFingerprint', () => {
    it('should generate a unique fingerprint', () => {
      const fingerprint1 = JWTService.generateTokenFingerprint();
      const fingerprint2 = JWTService.generateTokenFingerprint();

      expect(fingerprint1).toBeDefined();
      expect(fingerprint2).toBeDefined();
      expect(fingerprint1).not.toBe(fingerprint2);
      expect(fingerprint1).toHaveLength(64); // 32 bytes * 2 (hex)
    });
  });

  describe('generateTokenPair', () => {
    it('should generate access and refresh tokens with fingerprint', () => {
      const tokenPair = JWTService.generateTokenPair(mockPayload);

      expect(tokenPair).toHaveProperty('accessToken');
      expect(tokenPair).toHaveProperty('refreshToken');
      expect(tokenPair).toHaveProperty('tokenFingerprint');

      // Verify both tokens contain the fingerprint
      const accessDecoded = JWTService.decodeToken(tokenPair.accessToken);
      const refreshDecoded = JWTService.decodeToken(tokenPair.refreshToken);

      expect(accessDecoded).toHaveProperty('fingerprint', tokenPair.tokenFingerprint);
      expect(refreshDecoded).toHaveProperty('fingerprint', tokenPair.tokenFingerprint);
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = JWTService.generateAccessToken(mockPayload);
      const decoded = JWTService.decodeToken(token);

      expect(decoded).toMatchObject(mockPayload);
    });

    it('should return null for invalid token', () => {
      const decoded = JWTService.decodeToken('invalid-token');

      expect(decoded).toBeNull();
    });
  });

  describe('verifyTokenFingerprint', () => {
    it('should verify matching fingerprints', () => {
      const payload = {
        ...mockPayload,
        fingerprint: 'test-fingerprint'
      };

      const result = JWTService.verifyTokenFingerprint(payload, 'test-fingerprint');

      expect(result).toBe(true);
    });

    it('should reject non-matching fingerprints', () => {
      const payload = {
        ...mockPayload,
        fingerprint: 'test-fingerprint'
      };

      const result = JWTService.verifyTokenFingerprint(payload, 'different-fingerprint');

      expect(result).toBe(false);
    });
  });

  describe('isTokenExpiringSoon', () => {
    it('should detect token expiring soon', () => {
      // Create a token that expires in 10 minutes
      const payload = {
        ...mockPayload,
        exp: Math.floor(Date.now() / 1000) + 600 // 10 minutes from now
      };

      const token = require('jsonwebtoken').sign(
        payload,
        config.jwt.secret,
        { issuer: config.app.name, audience: 'vue3-admin-app' }
      );

      const isExpiring = JWTService.isTokenExpiringSoon(token, 15); // 15 minutes threshold

      expect(isExpiring).toBe(true);
    });

    it('should detect token not expiring soon', () => {
      // Create a token that expires in 30 minutes
      const payload = {
        ...mockPayload,
        exp: Math.floor(Date.now() / 1000) + 1800 // 30 minutes from now
      };

      const token = require('jsonwebtoken').sign(
        payload,
        config.jwt.secret,
        { issuer: config.app.name, audience: 'vue3-admin-app' }
      );

      const isExpiring = JWTService.isTokenExpiringSoon(token, 15); // 15 minutes threshold

      expect(isExpiring).toBe(false);
    });

    it('should handle invalid token gracefully', () => {
      const isExpiring = JWTService.isTokenExpiringSoon('invalid-token');

      expect(isExpiring).toBe(false);
    });
  });
});
