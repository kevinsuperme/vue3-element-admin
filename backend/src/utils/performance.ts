import logger from './logger';

// 性能监控指标
export interface PerformanceMetrics {
  requestId: string;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  cpuUsage: number;
  timestamp: Date;
  error?: string; // 可选的错误信息
}

// 性能监控器类
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000;
  private alertThresholds = {
    responseTime: 1000, // 1秒
    memoryUsage: 100 * 1024 * 1024, // 100MB
    cpuUsage: 80 // 80%
  };

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // 记录性能指标
  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // 限制存储的指标数量
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // 检查是否需要发送告警
    this.checkAlerts(metric);
  }

  // 检查告警条件
  private checkAlerts(metric: PerformanceMetrics): void {
    const alerts: string[] = [];

    if (metric.responseTime > this.alertThresholds.responseTime) {
      alerts.push(`响应时间过长: ${metric.responseTime}ms`);
    }

    if (metric.memoryUsage.heapUsed > this.alertThresholds.memoryUsage) {
      alerts.push(`内存使用过高: ${Math.round(metric.memoryUsage.heapUsed / 1024 / 1024)}MB`);
    }

    if (metric.cpuUsage > this.alertThresholds.cpuUsage) {
      alerts.push(`CPU使用过高: ${metric.cpuUsage.toFixed(2)}%`);
    }

    if (alerts.length > 0) {
      logger.warn('Performance alert:', {
        requestId: metric.requestId,
        url: metric.url,
        method: metric.method,
        alerts,
        timestamp: metric.timestamp
      });
    }
  }

  // 获取性能统计
  getStatistics(timeWindow: number = 3600000): { // 默认1小时
    totalRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    memoryUsage: {
      average: number;
      peak: number;
    };
    cpuUsage: {
      average: number;
      peak: number;
    };
  } {
    const now = Date.now();
    const windowStart = now - timeWindow;

    const recentMetrics = this.metrics.filter(m =>
      m.timestamp.getTime() >= windowStart
    );

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        memoryUsage: { average: 0, peak: 0 },
        cpuUsage: { average: 0, peak: 0 }
      };
    }

    const responseTimes = recentMetrics.map(m => m.responseTime).sort((a, b) => a - b);
    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
    const memoryUsages = recentMetrics.map(m => m.memoryUsage.heapUsed);
    const cpuUsages = recentMetrics.map(m => m.cpuUsage);

    return {
      totalRequests: recentMetrics.length,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
      p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
      errorRate: (errorCount / recentMetrics.length) * 100,
      memoryUsage: {
        average: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
        peak: Math.max(...memoryUsages)
      },
      cpuUsage: {
        average: cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length,
        peak: Math.max(...cpuUsages)
      }
    };
  }

  // 获取当前内存使用情况
  getCurrentMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      rss: usage.rss,
      external: usage.external,
      heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024)
    };
  }

  // 获取当前CPU使用情况
  async getCurrentCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const totalUsage = endUsage.user + endUsage.system;
        const cpuUsage = (totalUsage / 1000000) * 100; // 转换为百分比
        resolve(cpuUsage);
      }, 100);
    });
  }

  // 获取当前时间戳（用于性能计时）
  getCurrentTime(): number {
    return Date.now();
  }

  // 生成请求ID
  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 清理旧数据
  cleanup(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24小时前
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff);
    logger.info('Performance metrics cleaned up');
  }
}

// 创建全局性能监控器实例
export const performanceMonitor = PerformanceMonitor.getInstance();

// 性能监控中间件

export const performanceMiddleware = async (req: any, res: any, next: any) => {
  const startTime = Date.now();
  const requestId = req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 记录开始内存使用情况
  const startMemory = performanceMonitor.getCurrentMemoryUsage();

  // 重写res.end方法来捕获响应结束时间
  const originalEnd = res.end;

  res.end = function(chunk: any, encoding: any) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // 获取结束内存使用情况
    const endMemory = performanceMonitor.getCurrentMemoryUsage();

    // 计算内存使用差异
    const memoryUsage = {
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal,
      rss: endMemory.rss,
      external: endMemory.external
    };

    // 异步获取CPU使用情况
    performanceMonitor.getCurrentCpuUsage().then(cpuUsage => {
      const metric: PerformanceMetrics = {
        requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        responseTime,
        memoryUsage,
        cpuUsage,
        timestamp: new Date()
      };

      // 记录性能指标
      performanceMonitor.recordMetric(metric);

      // 记录慢请求
      if (responseTime > 1000) {
        logger.warn('Slow request detected:', {
          requestId,
          method: req.method,
          url: req.url,
          responseTime: `${responseTime}ms`,
          statusCode: res.statusCode
        });
      }
    }).catch(error => {
      logger.error('Error recording performance metric:', error);
    });

    // 调用原始的res.end方法
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// 定期清理性能数据
setInterval(() => {
  performanceMonitor.cleanup();
}, 60 * 60 * 1000); // 每小时清理一次

export default {
  performanceMonitor,
  performanceMiddleware
};
