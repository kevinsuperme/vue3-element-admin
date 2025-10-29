import mongoose, { Schema, Document, Model } from 'mongoose';
import { ErrorLog } from '../types';

export interface ErrorLogDocument extends Omit<ErrorLog, '_id'>, Document {
  _id: string;
}

interface ErrorLogModel extends Model<ErrorLogDocument> {
  getErrorStats(timeRange?: 'day' | 'week' | 'month'): Promise<any[]>;
  markAsResolved(errorId: string): Promise<ErrorLogDocument | null>;
  markMultipleAsResolved(errorIds: string[]): Promise<number>;
}

const errorLogSchema = new Schema<ErrorLogDocument>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  message: {
    type: String,
    required: [true, '错误信息不能为空'],
    trim: true
  },
  stack: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    required: [true, '错误URL不能为空'],
    trim: true
  },
  method: {
    type: String,
    required: [true, '请求方法不能为空'],
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    uppercase: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  ip: {
    type: String,
    trim: true,
    match: [/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'IP地址格式不正确']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  resolved: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// 静态方法：获取错误统计
errorLogSchema.statics.getErrorStats = async function(timeRange: 'day' | 'week' | 'month' = 'day') {
  const now = new Date();
  let startDate: Date;
  
  switch (timeRange) {
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
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          resolved: '$resolved'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        resolved: {
          $sum: {
            $cond: [{ $eq: ['$_id.resolved', true] }, '$count', 0]
          }
        },
        unresolved: {
          $sum: {
            $cond: [{ $eq: ['$_id.resolved', false] }, '$count', 0]
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

// 静态方法：标记错误为已解决
errorLogSchema.statics.markAsResolved = async function(errorId: string): Promise<ErrorLogDocument | null> {
  return this.findByIdAndUpdate(
    errorId,
    { resolved: true },
    { new: true }
  );
};

// 静态方法：批量标记错误为已解决
errorLogSchema.statics.markMultipleAsResolved = async function(errorIds: string[]): Promise<number> {
  const result = await this.updateMany(
    { _id: { $in: errorIds } },
    { resolved: true }
  );
  return result.modifiedCount;
};

// 索引
errorLogSchema.index({ timestamp: -1 });
errorLogSchema.index({ url: 1, method: 1 });
errorLogSchema.index({ resolved: 1, timestamp: -1 });

export default mongoose.model<ErrorLogDocument, ErrorLogModel>('ErrorLog', errorLogSchema);