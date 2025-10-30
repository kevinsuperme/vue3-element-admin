import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ArticleDocument extends Document {
  _id: string;
  title: string;
  content: string;
  summary?: string;
  author: mongoose.Types.ObjectId;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  category?: string;
  coverImage?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isTop: boolean;
  isFeatured: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArticleModel extends Model<ArticleDocument> {
  incrementViewCount(articleId: string): Promise<ArticleDocument | null>;
  getPopularArticles(limit?: number): Promise<ArticleDocument[]>;
}

const articleSchema = new Schema<ArticleDocument>({
  title: {
    type: String,
    required: [true, '文章标题不能为空'],
    trim: true,
    maxLength: [200, '标题长度不能超过200个字符']
  },
  content: {
    type: String,
    required: [true, '文章内容不能为空']
  },
  summary: {
    type: String,
    trim: true,
    maxLength: [500, '摘要长度不能超过500个字符']
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '文章作者不能为空']
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    trim: true
  },
  coverImage: {
    type: String,
    trim: true
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  likeCount: {
    type: Number,
    default: 0,
    min: 0
  },
  commentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isTop: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// 索引
articleSchema.index({ title: 'text', content: 'text' });
articleSchema.index({ author: 1 });
articleSchema.index({ status: 1 });
articleSchema.index({ category: 1 });
articleSchema.index({ tags: 1 });
articleSchema.index({ publishedAt: -1 });
articleSchema.index({ createdAt: -1 });
articleSchema.index({ isTop: -1, publishedAt: -1 });

// 虚拟字段：作者信息
articleSchema.virtual('authorInfo', {
  ref: 'User',
  localField: 'author',
  foreignField: '_id',
  justOne: true,
  select: 'username email avatar'
});

// 发布前设置发布时间
articleSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// 静态方法：增加浏览量
articleSchema.statics.incrementViewCount = async function(articleId: string) {
  return this.findByIdAndUpdate(
    articleId,
    { $inc: { viewCount: 1 }},
    { new: true }
  );
};

// 静态方法：获取热门文章
articleSchema.statics.getPopularArticles = async function(limit: number = 10) {
  return this.find({ status: 'published' })
    .sort({ viewCount: -1, likeCount: -1 })
    .limit(limit)
    .populate('author', 'username avatar')
    .select('title summary coverImage viewCount likeCount commentCount publishedAt');
};

export default mongoose.model<ArticleDocument, ArticleModel>('Article', articleSchema);
