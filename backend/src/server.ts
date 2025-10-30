import dotenv from 'dotenv';
import { App } from './app';
import logger from './utils/logger';

// 加载环境变量
dotenv.config();

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 创建并启动应用
const app = new App();
app.listen().then(() => {
  logger.info('Application started successfully');
}).catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});
