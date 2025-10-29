import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import path from 'path';
import mongoose from 'mongoose';
import config from './config';
import logger, { requestLogger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
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
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // 请求体解析
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 压缩
    this.app.use(compression());

    // MongoDB注入防护
    this.app.use(mongoSanitize());

    // 请求日志
    this.app.use(requestLogger);

    // 通用限流
    this.app.use('/api/', generalLimiter);

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
          health: '/api/system/health',
        },
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
      await mongoose.connect(config.database.uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      logger.info('MongoDB connected successfully');

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
      process.exit(1);
    }
  }

  public listen() {
    const port = config.port;
    this.app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`API Documentation: http://localhost:${port}/api`);
      logger.info(`Health Check: http://localhost:${port}/api/system/health`);
    });
  }
}

export default App;