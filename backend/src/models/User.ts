import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import config from '../config';
import { User } from '../types';
import logger from '../utils/logger';

export interface UserDocument extends Omit<User, '_id'>, Document {
  _id: string;

  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAvatar(): string;
  updateLastLogin(): Promise<void>;
}

const userSchema = new Schema<UserDocument>({
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: true,
    trim: true,
    minLength: [3, '用户名长度不能少于3个字符'],
    maxLength: [20, '用户名长度不能超过20个字符'],
    match: [/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线']
  },
  email: {
    type: String,
    required: [true, '邮箱不能为空'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minLength: [6, '密码长度不能少于6个字符'],
    select: false
  },
  avatar: {
    type: String,
    default(this: UserDocument) {
      return this.generateAvatar();
    }
  },
  roles: [{
    type: String,
    default: ['user']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform(_doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// 生成头像URL
userSchema.methods.generateAvatar = function(): string {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(this.email.toLowerCase()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
};

// 密码加密和验证
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    // 密码强度验证
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(this.password)) {
      logger.warn('Password validation failed for user:', {
        username: this.username,
        reason: 'Password does not meet complexity requirements'
      });
      return next(new Error('密码必须包含大小写字母、数字和特殊字符'));
    }

    const salt = await bcrypt.genSalt(config.security.bcryptSaltRounds);
    this.password = await bcrypt.hash(this.password, salt);

    logger.info('Password hashed successfully for user:', {
      username: this.username,
      saltRounds: config.security.bcryptSaltRounds
    });

    next();
  } catch (error) {
    logger.error('Password hashing failed:', {
      username: this.username,
      error
    });
    next(error as Error);
  }
});

// 密码比较
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);

    if (!isMatch) {
      logger.warn('Password comparison failed:', {
        username: this.username,
        reason: 'Password does not match'
      });
    }

    return isMatch;
  } catch (error) {
    logger.error('Password comparison error:', {
      username: this.username,
      error
    });
    return false;
  }
};

// 更新最后登录时间
userSchema.methods.updateLastLogin = async function(): Promise<void> {
  this.lastLogin = new Date();
  await this.save();
};

// 索引
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

export default mongoose.model<UserDocument>('User', userSchema);
