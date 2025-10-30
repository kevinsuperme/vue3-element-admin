/**
 * 前端日志工具
 * 在生产环境中自动禁用console输出
 */

interface LogLevel {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

// 创建安全的日志对象
const createLogger = (): LogLevel => {
  if (isDevelopment) {
    return {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console)
    };
  } else {
    // 生产环境：禁用所有console输出
    return {
      log: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {}
    };
  }
};

const logger = createLogger();

export default logger;
