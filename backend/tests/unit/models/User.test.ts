import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../../../src/models/User';

describe('User Model', () => {
  let mockUserData: any;

  beforeEach(() => {
    mockUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'user'
    };
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    it('should validate required fields', () => {
      const user = new User({});
      const validationError = user.validateSync();

      expect(validationError?.errors.username).toBeDefined();
      expect(validationError?.errors.email).toBeDefined();
      expect(validationError?.errors.password).toBeDefined();
    });

    it('should validate email format', () => {
      const user = new User({
        ...mockUserData,
        email: 'invalid-email-format'
      });
      const validationError = user.validateSync();

      expect(validationError?.errors.email).toBeDefined();
    });

    it('should validate username length', () => {
      const user = new User({
        ...mockUserData,
        username: 'ab' // Too short
      });
      const validationError = user.validateSync();

      expect(validationError?.errors.username).toBeDefined();
    });

    it('should validate password length', () => {
      const user = new User({
        ...mockUserData,
        password: '123' // Too short
      });
      const validationError = user.validateSync();

      expect(validationError?.errors.password).toBeDefined();
    });

    it('should validate role enum values', () => {
      const user = new User({
        ...mockUserData,
        role: 'invalid-role'
      });
      const validationError = user.validateSync();

      expect(validationError?.errors.role).toBeDefined();
    });

    it('should accept valid user data', () => {
      const user = new User(mockUserData);
      const validationError = user.validateSync();

      expect(validationError).toBeUndefined();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const mockHashedPassword = 'hashedPassword123';
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(mockHashedPassword as never);

      const user = new User(mockUserData);
      await user.save();

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(user.password).toBe(mockHashedPassword);
    });

    it('should not rehash password if not modified', async () => {
      const mockHashedPassword = 'existingHashedPassword';
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('newHash' as never);

      // Simulate existing user
      const user = new User({
        ...mockUserData,
        password: mockHashedPassword
      });

      // Mark password as not modified
      (user.isModified as any) = jest.fn().mockReturnValue(false);

      await user.save();

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(user.password).toBe(mockHashedPassword);
    });
  });

  describe('Password Comparison', () => {
    it('should return true for correct password', async () => {
      const mockHashedPassword = 'hashedPassword123';
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const user = new User({
        ...mockUserData,
        password: mockHashedPassword
      });

      const isMatch = await user.comparePassword('password123');

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockHashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const mockHashedPassword = 'hashedPassword123';
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const user = new User({
        ...mockUserData,
        password: mockHashedPassword
      });

      const isMatch = await user.comparePassword('wrongpassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', mockHashedPassword);
      expect(isMatch).toBe(false);
    });

    it('should handle bcrypt comparison errors', async () => {
      const mockHashedPassword = 'hashedPassword123';
      jest.spyOn(bcrypt, 'compare').mockRejectedValue(new Error('Comparison error') as never);

      const user = new User({
        ...mockUserData,
        password: mockHashedPassword
      });

      await expect(user.comparePassword('password123')).rejects.toThrow('Comparison error');
    });
  });

  describe('JSON Transformation', () => {
    it('should exclude password from JSON output', () => {
      const user = new User({
        ...mockUserData,
        _id: 'user123',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const userJSON = user.toJSON();

      expect(userJSON).not.toHaveProperty('password');
      expect(userJSON).toHaveProperty('username');
      expect(userJSON).toHaveProperty('email');
      expect(userJSON).toHaveProperty('role');
    });

    it('should include all non-sensitive fields in JSON output', () => {
      const user = new User({
        ...mockUserData,
        _id: 'user123',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-15')
      });

      const userJSON = user.toJSON();

      expect(userJSON).toEqual({
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
  });

  describe('Indexes', () => {
    it('should create unique index on email', () => {
      const userSchema = User.schema;
      const emailIndex = userSchema.indexes().find((index: any) => index.email);

      expect(emailIndex).toBeDefined();
    });

    it('should create unique index on username', () => {
      const userSchema = User.schema;
      const usernameIndex = userSchema.indexes().find((index: any) => index.username);

      expect(usernameIndex).toBeDefined();
    });
  });

  describe('Virtual Properties', () => {
    it('should generate correct id virtual property', () => {
      const user = new User({
        ...mockUserData,
        _id: new mongoose.Types.ObjectId()
      });

      expect(user.id).toBe(user._id.toString());
    });
  });

  describe('Timestamps', () => {
    it('should set createdAt and updatedAt on creation', () => {
      const user = new User(mockUserData);

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const user = new User(mockUserData);
      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      user.username = 'updateduser';
      user.markModified('username');

      expect(user.updatedAt!.getTime()).toBeGreaterThan(originalUpdatedAt!.getTime());
    });
  });
});
