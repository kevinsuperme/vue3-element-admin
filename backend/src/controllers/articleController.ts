import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import Article from '../models/Article';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';
import { performanceMonitor } from '../utils/performance';

export class ArticleController {
  /**
   * 获取文章列表
   */
  static getArticles = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `articles_${startTime}`;

    logger.info('Fetching articles list:', {
      requestId,
      query: req.query,
      ip: req.ip
    });

    const {
      page = 1,
      limit = 10,
      status,
      category,
      author,
      keyword,
      sort = '-publishedAt'
    } = req.query;

    const query: Record<string, unknown> = {};

    // 状态筛选
    if (status) {
      query.status = status;
    }

    // 分类筛选
    if (category) {
      query.category = category;
    }

    // 作者筛选
    if (author) {
      query.author = author;
    }

    // 关键词搜索
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' }},
        { content: { $regex: keyword, $options: 'i' }},
        { summary: { $regex: keyword, $options: 'i' }}
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    try {
      const [articles, total] = await Promise.all([
        Article.find(query)
          .populate('author', 'username email avatar')
          .sort(sort as string)
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Article.countDocuments(query)
      ]);

      const duration = Date.now() - startTime;
      logger.info('Articles list fetched successfully:', {
        requestId,
        total,
        page: Number(page),
        limit: Number(limit),
        duration: `${duration}ms`
      });

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: '/api/articles',
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

      res.json(ApiResponse.success({
        items: articles,
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }));
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to fetch articles list:', {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`
      });

      // 记录错误性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: '/api/articles',
        statusCode: 500,
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

      throw error;
    }
  });

  /**
   * 获取文章详情
   */
  static getArticle = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('获取文章详情请求开始', { requestId, ip: req.ip, articleId: req.query.id });

    try {
      const { id } = req.query;

      if (!id) {
        logger.warn('获取文章详情失败：文章ID不能为空', { requestId, duration: Date.now() - startTime });
        throw new AppError('文章ID不能为空', 400);
      }

      const article = await Article.findById(id)
        .populate('author', 'username email avatar')
        .lean();

      if (!article) {
        logger.warn('获取文章详情失败：文章不存在', { requestId, articleId: id, duration: Date.now() - startTime });

        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
        performanceMonitor.getCurrentCpuUsage().then(cpuUsage => {
          performanceMonitor.recordMetric({
            requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode: 404,
            responseTime: Date.now() - startTime,
            memoryUsage: {
              heapUsed: memoryUsage.heapUsed,
              heapTotal: memoryUsage.heapTotal,
              rss: memoryUsage.rss,
              external: memoryUsage.external
            },
            cpuUsage,
            timestamp: new Date(),
            error: '文章不存在'
          });
        }).catch(error => {
          logger.error('记录性能指标失败', { requestId, error: error instanceof Error ? error.message : String(error) });
        });

        throw new AppError('文章不存在', 404);
      }

      // 增加浏览量
      await Article.incrementViewCount(id as string);

      logger.info('获取文章详情成功', { requestId, articleId: id, title: article.title, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.getCurrentCpuUsage().then(cpuUsage => {
        performanceMonitor.recordMetric({
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: 200,
          responseTime: Date.now() - startTime,
          memoryUsage,
          cpuUsage,
          timestamp: new Date()
        });
      }).catch(error => {
        logger.error('记录性能指标失败', { requestId, error: error instanceof Error ? error.message : String(error) });
      });

      res.json(ApiResponse.success(article));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.error('获取文章详情失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.getCurrentCpuUsage().then(cpuUsage => {
        performanceMonitor.recordMetric({
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: (error as AppError).statusCode || 500,
          responseTime: Date.now() - startTime,
          memoryUsage,
          cpuUsage,
          timestamp: new Date(),
          error: errorMessage
        });
      }).catch(error => {
        logger.error('记录性能指标失败', { requestId, error: error instanceof Error ? error.message : String(error) });
      });

      throw error;
    }
  });

  /**
   * 创建文章
   */
  static createArticle = asyncHandler(async (req: AuthRequest, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `create-article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('创建文章请求开始', { requestId, ip: req.ip, title: req.body.title, author: req.user?.userId });

    try {
      const {
        title,
        content,
        summary,
        category,
        tags,
        coverImage,
        status = 'draft'
      } = req.body;

      if (!title || !content) {
        logger.warn('创建文章失败：标题和内容不能为空', { requestId, duration: Date.now() - startTime });
        throw new AppError('标题和内容不能为空', 400);
      }

      if (!req.user) {
        throw new AppError('用户未认证', 401);
      }

      const article = await Article.create({
        title,
        content,
        summary,
        author: req.user.userId,
        category,
        tags,
        coverImage,
        status
      });

      const populatedArticle = await Article.findById(article._id)
        .populate('author', 'username email avatar')
        .lean();

      logger.info('创建文章成功', { requestId, articleId: article._id, title, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.getCurrentCpuUsage().then(cpuUsage => {
        performanceMonitor.recordMetric({
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: 201,
          responseTime: Date.now() - startTime,
          memoryUsage,
          cpuUsage,
          timestamp: new Date()
        });
      }).catch(error => {
        logger.error('记录性能指标失败', { requestId, error: error instanceof Error ? error.message : String(error) });
      });

      res.json(ApiResponse.success(populatedArticle, '文章创建成功'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.error('创建文章失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.getCurrentCpuUsage().then(cpuUsage => {
        performanceMonitor.recordMetric({
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: (error as AppError).statusCode || 500,
          responseTime: Date.now() - startTime,
          memoryUsage,
          cpuUsage,
          timestamp: new Date(),
          error: errorMessage
        });
      }).catch(error => {
        logger.error('记录性能指标失败', { requestId, error: error instanceof Error ? error.message : String(error) });
      });

      throw error;
    }
  });

  /**
   * 更新文章
   */
  static updateArticle = asyncHandler(async (req: AuthRequest, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `update-article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('更新文章请求开始', { requestId, ip: req.ip, articleId: req.params.id, userId: req.user?.userId });

    try {
      const { id } = req.params;
      const {
        title,
        content,
        summary,
        category,
        tags,
        coverImage,
        status
      } = req.body;

      if (!id) {
        logger.warn('更新文章失败：文章ID不能为空', { requestId, duration: Date.now() - startTime });
        throw new AppError('文章ID不能为空', 400);
      }

      const article = await Article.findById(id);
      if (!article) {
        logger.warn('更新文章失败：文章不存在', { requestId, articleId: id, duration: Date.now() - startTime });

        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
        performanceMonitor.getCurrentCpuUsage().then(cpuUsage => {
          performanceMonitor.recordMetric({
            requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode: 404,
            responseTime: Date.now() - startTime,
            memoryUsage,
            cpuUsage,
            timestamp: new Date(),
            error: '文章不存在'
          });
        }).catch(error => {
          logger.error('记录性能指标失败', { requestId, error: error instanceof Error ? error.message : String(error) });
        });

        throw new AppError('文章不存在', 404);
      }

      // 检查权限：只有作者或管理员可以更新
      if (!req.user) {
        throw new AppError('用户未认证', 401);
      }

      const isAdmin = req.user.roles.includes('admin');
      const isAuthor = article.author.toString() === req.user.userId.toString();

      if (!isAdmin && !isAuthor) {
        logger.warn('更新文章失败：没有权限', { requestId, articleId: id, userId: req.user.userId, duration: Date.now() - startTime });

        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
        performanceMonitor.getCurrentCpuUsage().then(cpuUsage => {
          performanceMonitor.recordMetric({
            requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode: 403,
            responseTime: Date.now() - startTime,
            memoryUsage,
            cpuUsage,
            timestamp: new Date(),
            error: '没有权限更新此文章'
          });
        }).catch(error => {
          logger.error('记录性能指标失败', { requestId, error: error instanceof Error ? error.message : String(error) });
        });

        throw new AppError('没有权限更新此文章', 403);
      }

      // 更新字段
      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (summary !== undefined) updateData.summary = summary;
      if (category !== undefined) updateData.category = category;
      if (tags !== undefined) updateData.tags = tags;
      if (coverImage !== undefined) updateData.coverImage = coverImage;
      if (status !== undefined) updateData.status = status;

      const updatedArticle = await Article.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate('author', 'username email avatar').lean();

      logger.info('更新文章成功', { requestId, articleId: id, title, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.getCurrentCpuUsage().then(cpuUsage => {
        performanceMonitor.recordMetric({
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: 200,
          responseTime: Date.now() - startTime,
          memoryUsage,
          cpuUsage,
          timestamp: new Date()
        });
      }).catch(error => {
        logger.error('记录性能指标失败', { requestId, error: error instanceof Error ? error.message : String(error) });
      });

      res.json(ApiResponse.success(updatedArticle, '文章更新成功'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.error('更新文章失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.getCurrentCpuUsage().then(cpuUsage => {
        performanceMonitor.recordMetric({
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: 500,
          responseTime: Date.now() - startTime,
          memoryUsage,
          cpuUsage,
          timestamp: new Date(),
          error: errorMessage
        });
      }).catch(error => {
        logger.error('记录性能指标失败', { requestId, error: error instanceof Error ? error.message : String(error) });
      });

      throw error;
    }
  });

  /**
   * 删除文章
   */
  static deleteArticle = asyncHandler(async (req: AuthRequest, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `delete-article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('删除文章请求开始', { requestId, ip: req.ip, articleId: req.params.id, userId: req.user?.userId });

    try {
      const { id } = req.params;

      if (!id) {
        logger.warn('删除文章失败：文章ID不能为空', { requestId, duration: Date.now() - startTime });
        throw new AppError('文章ID不能为空', 400);
      }

      const article = await Article.findById(id);
      if (!article) {
        logger.warn('删除文章失败：文章不存在', { requestId, articleId: id, duration: Date.now() - startTime });

        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
        performanceMonitor.getCurrentCpuUsage().then(cpuUsage => {
          performanceMonitor.recordMetric({
            requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode: 404,
            responseTime: Date.now() - startTime,
            memoryUsage,
            cpuUsage,
            timestamp: new Date(),
            error: '文章不存在'
          });
        }).catch(error => {
          logger.error('记录性能指标失败', { requestId, error: error instanceof Error ? error.message : String(error) });
        });

        throw new AppError('文章不存在', 404);
      }

      // 检查权限：只有作者或管理员可以删除
      if (!req.user) {
        throw new AppError('用户未认证', 401);
      }

      const isAdmin = req.user.roles.includes('admin');
      const isAuthor = article.author.toString() === req.user.userId.toString();

      if (!isAdmin && !isAuthor) {
        logger.warn('删除文章失败：没有权限', { requestId, articleId: id, userId: req.user.userId, duration: Date.now() - startTime });

        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
        performanceMonitor.getCurrentCpuUsage().then(cpuUsage => {
          performanceMonitor.recordMetric({
            requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode: 403,
            responseTime: Date.now() - startTime,
            memoryUsage,
            cpuUsage,
            timestamp: new Date(),
            error: '没有权限删除此文章'
          });
        }).catch(error => {
          logger.error('记录性能指标失败', { requestId, error: error instanceof Error ? error.message : String(error) });
        });

        throw new AppError('没有权限删除此文章', 403);
      }

      await Article.findByIdAndDelete(id);

      logger.info('删除文章成功', { requestId, articleId: id, title: article.title, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.getCurrentCpuUsage().then(cpuUsage => {
        performanceMonitor.recordMetric({
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: 200,
          responseTime: Date.now() - startTime,
          memoryUsage,
          cpuUsage,
          timestamp: new Date()
        });
      }).catch(error => {
        logger.error('记录性能指标失败', { requestId, error: error instanceof Error ? error.message : String(error) });
      });

      res.json(ApiResponse.success(null, '文章删除成功'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.error('删除文章失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.getCurrentCpuUsage().then(cpuUsage => {
        performanceMonitor.recordMetric({
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: (error as AppError).statusCode || 500,
          responseTime: Date.now() - startTime,
          memoryUsage,
          cpuUsage,
          timestamp: new Date(),
          error: errorMessage
        });
      }).catch(error => {
        logger.error('记录性能指标失败', { requestId, error: error instanceof Error ? error.message : String(error) });
      });

      throw error;
    }
  });

  /**
   * 获取文章统计
   */
  static getArticleStats = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `article-stats-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('获取文章统计信息请求开始', { requestId, ip: req.ip });

    try {
      const { startDate, endDate } = req.query;

      const matchStage: any = {};
      if (startDate && endDate) {
        matchStage.publishedAt = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }

      const stats = await Article.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$viewCount' },
            totalLikes: { $sum: '$likeCount' },
            totalComments: { $sum: '$commentCount' },
            totalArticles: { $sum: 1 }
          }
        }
      ]);

      const popularArticles = await Article.getPopularArticles(10);

      const result = {
        stats: stats[0] || {
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalArticles: 0
        },
        popularArticles
      };

      logger.info('获取文章统计信息成功', { requestId, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.getCurrentCpuUsage().then(cpuUsage => {
        performanceMonitor.recordMetric({
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: 200,
          responseTime: Date.now() - startTime,
          memoryUsage,
          cpuUsage,
          timestamp: new Date()
        });
      }).catch(error => {
        logger.error('记录性能指标失败', { requestId, error: error instanceof Error ? error.message : String(error) });
      });

      res.json(ApiResponse.success(result));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logger.error('获取文章统计信息失败', { requestId, error: errorMessage, duration: Date.now() - startTime });

      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      performanceMonitor.getCurrentCpuUsage().then(cpuUsage => {
        performanceMonitor.recordMetric({
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: 500,
          responseTime: Date.now() - startTime,
          memoryUsage,
          cpuUsage,
          timestamp: new Date(),
          error: errorMessage
        });
      }).catch(error => {
        logger.error('记录性能指标失败', { requestId, error: error instanceof Error ? error.message : String(error) });
      });

      throw error;
    }
  });
}
