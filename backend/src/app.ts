import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import path from 'path';
import mongoose from 'mongoose';
import config from './config';
import logger, { requestLogger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { sanitizeInput, preventSqlInjection, preventNoScriptInjection } from './middleware/sanitize';
import { performanceMiddleware } from './utils/performance';
import apiRoutes from './routes/api';

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.connectToDatabase();
  }

  private initializeMiddlewares() {
    // 基础安全中间件
    this.app.use(helmet());

    // CORS配置
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // 请求体解析 - 使用安全的大小限制
    this.app.use(express.json({
      limit: `${config.security.maxRequestSize}`,
      type: 'application/json'
    }));
    this.app.use(express.urlencoded({
      extended: true,
      limit: `${config.security.maxRequestSize}`,
      parameterLimit: 1000
    }));

    // 压缩
    this.app.use(compression());

    // MongoDB注入防护
    this.app.use(mongoSanitize());

    // Cookie解析
    this.app.use(cookieParser());

    // 输入数据清理
    this.app.use(sanitizeInput);

    // SQL注入防护
    this.app.use(preventSqlInjection);

    // NoScript注入防护
    this.app.use(preventNoScriptInjection);

    // 请求日志
    this.app.use(requestLogger);

    // 通用限流
    this.app.use('/api/', generalLimiter);

    // 性能监控中间件
    this.app.use(performanceMiddleware);

    // 静态文件服务
    this.app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  }

  private initializeRoutes() {
    // API路由
    this.app.use('/api', apiRoutes);

    // 根路径
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Vue3 Element Admin Backend API Server',
        version: '1.0.0',
        timestamp: new Date(),
        api: {
          documentation: '/api',
          health: '/api/system/health'
        }
      });
    });

    // 404处理
    this.app.use(notFoundHandler);
  }

  private initializeErrorHandling() {
    // 错误处理中间件
    this.app.use(errorHandler);
  }

  private async connectToDatabase() {
    try {
      // Skip database connection in test environment
      if (config.env === 'test') {
        logger.info('Test environment detected, skipping database connection');
        return;
      }

      await mongoose.connect(config.database.uri, {
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        w: 'majority'
      });

      logger.info('MongoDB connected successfully');

      // 初始化数据库
      const DatabaseInit = await import('./utils/database').then(m => m.default);
      await DatabaseInit.init();
      await DatabaseInit.createIndexes();

      // 数据库连接事件监听
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      // 优雅关闭
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      });
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      logger.warn('Server will continue running without database connection');
      // 不退出进程，让服务器继续运行
    }
  }

  public listen(): Promise<void> {
    return new Promise((resolve, reject) => {
      const port = config.port;
      const server = this.app.listen(port, () => {
        logger.info(`Server is running on port ${port}`);
        logger.info(`Environment: ${config.env}`);
        logger.info(`API Documentation: http://localhost:${port}/api`);
        logger.info(`Health Check: http://localhost:${port}/api/system/health`);
        resolve();
      });

      server.on('error', (error) => {
        logger.error('Server startup error:', error);
        reject(error);
      });
    });
  }
}

// 导出 App 类
export { App };

// 导出默认实例供测试使用
const appInstance = new App();
export default appInstance.app;
