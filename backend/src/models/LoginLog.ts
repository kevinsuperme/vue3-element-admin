import mongoose, { Schema, Document, Model } from 'mongoose';
import { LoginLog } from '../types';

export interface LoginLogDocument extends Omit<LoginLog, '_id'>, Document {
  _id: string;
}

interface LoginLogModel extends Model<LoginLogDocument> {

  getLoginStats(_timeRange?: 'day' | 'week' | 'month'): Promise<any[]>;

  getUserLoginHistory(_userId: string, _limit?: number): Promise<LoginLogDocument[]>;

  cleanupOldLogs(_daysToKeep?: number): Promise<number>;
}

const loginLogSchema = new Schema<LoginLogDocument>({
  userId: {
    type: mongoose.Schema.Types.ObjectId as any,
    ref: 'User',
    required: [true, '用户ID不能为空'],
    index: true
  },
  ip: {
    type: String,
    required: [true, 'IP地址不能为空'],
    trim: true,
    match: [/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'IP地址格式不正确']
  },
  userAgent: {
    type: String,
    required: [true, '用户代理不能为空'],
    trim: true
  },
  success: {
    type: Boolean,
    required: true,
    index: true
  },
  message: {
    type: String,
    trim: true,
    maxLength: [500, '消息长度不能超过500个字符']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false,
  toJSON: {
    transform(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// 静态方法：获取登录统计
loginLogSchema.statics.getLoginStats = async function(_timeRange: 'day' | 'week' | 'month' = 'day') {
  const now = new Date();
  let startDate: Date;

  switch (_timeRange) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  const stats = await this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }},
          success: '$success'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        successful: {
          $sum: {
            $cond: [{ $eq: ['$_id.success', true] }, '$count', 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{ $eq: ['$_id.success', false] }, '$count', 0]
          }
        },
        total: { $sum: '$count' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  return stats;
};

// 静态方法：获取用户登录历史
loginLogSchema.statics.getUserLoginHistory = async function(_userId: string, _limit: number = 10) {
  return this.find({ userId: _userId })
    .sort({ timestamp: -1 })
    .limit(_limit)
    .populate('userId', 'username email');
};

// 静态方法：清理旧的登录日志
loginLogSchema.statics.cleanupOldLogs = async function(_daysToKeep: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - _daysToKeep);

  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate }
  });

  return result.deletedCount;
};

// 索引
loginLogSchema.index({ timestamp: -1 });
loginLogSchema.index({ userId: 1, timestamp: -1 });
loginLogSchema.index({ success: 1, timestamp: -1 });

export default mongoose.model<LoginLogDocument, LoginLogModel>('LoginLog', loginLogSchema);
