import { Router, Request, Response } from 'express';
import MetricsService from '../services/MetricsService';
import CacheService from '../services/CacheService';
import logger from '../utils/logger';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

/**
 * Get Prometheus metrics
 * @route GET /metrics
 * @access Public (but you can add authentication if needed)
 */
router.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
  try {
    const metrics = MetricsService.getMetrics();
    res.set('Content-Type', MetricsService.getRegistry().contentType);
    res.send(metrics);
  } catch (error) {
    logger.error('Error generating metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate metrics',
      timestamp: new Date()
    });
  }
}));

/**
 * Get system health status
 * @route GET /health
 * @access Public
 */
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  try {
    const healthStatus = await MetricsService.getHealthStatus();
    const cacheHealth = await CacheService.healthCheck();

    const overallHealth = {
      status: healthStatus.status,
      timestamp: new Date(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      components: {
        metrics: {
          status: 'healthy',
          lastUpdate: new Date()
        },
        cache: cacheHealth,
        database: {
          status: 'connected', // You can add actual DB health check here
          lastCheck: new Date()
        }
      },
      alerts: healthStatus.alerts
    };

    // Determine HTTP status code based on health
    let statusCode = 200;
    if (overallHealth.status === 'critical') {
      statusCode = 503;
    } else if (overallHealth.status === 'warning') {
      statusCode = 200; // Still serve requests but indicate warning
    }

    res.status(statusCode).json({
      success: overallHealth.status !== 'critical',
      data: overallHealth,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      timestamp: new Date()
    });
  }
}));

/**
 * Get detailed system information
 * @route GET /info
 * @access Private (Admin only)
 */
router.get('/info',
  authenticate,
  authorize(['admin']),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const cacheStats = await CacheService.getStats();

      const systemInfo = {
        process: {
          pid: process.pid,
          version: process.version,
          platform: process.platform,
          arch: process.arch,
          uptime: process.uptime(),
          nodeVersion: process.versions.node
        },
        memory: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
          arrayBuffers: memUsage.arrayBuffers
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        network: {
          connections: {
            active: 0, // You can implement actual connection tracking
            total: 0
          }
        },
        cache: cacheStats,
        timestamp: new Date()
      };

      res.json({
        success: true,
        data: systemInfo,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error getting system info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system information',
        timestamp: new Date()
      });
    }
  })
);

/**
 * Get performance metrics summary
 * @route GET /performance
 * @access Private (Admin only)
 */
router.get('/performance',
  authenticate,
  authorize(['admin']),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const metrics = MetricsService.getRegistry().metrics();
      const healthStatus = await MetricsService.getHealthStatus();

      // Parse metrics to extract performance data
      const performanceData = {
        http: {
          requestDuration: extractMetricValue(metrics, 'http_request_duration_seconds'),
          requestTotal: extractMetricValue(metrics, 'http_requests_total'),
          activeConnections: extractMetricValue(metrics, 'active_connections')
        },
        system: {
          memoryUsage: extractMetricValue(metrics, 'memory_usage_bytes'),
          cpuUsage: extractMetricValue(metrics, 'cpu_usage_percent')
        },
        cache: {
          hitRate: extractMetricValue(metrics, 'cache_hit_rate_percent')
        },
        database: {
          connections: extractMetricValue(metrics, 'database_connections')
        },
        alerts: healthStatus.alerts,
        summary: {
          status: healthStatus.status,
          totalAlerts: healthStatus.alerts.length,
          criticalAlerts: healthStatus.alerts.filter((a: any) => a.severity === 'critical').length,
          warningAlerts: healthStatus.alerts.filter((a: any) => a.severity === 'high').length
        }
      };

      res.json({
        success: true,
        data: performanceData,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error getting performance metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get performance metrics',
        timestamp: new Date()
      });
    }
  })
);

/**
 * Get alert rules and status
 * @route GET /alerts
 * @access Private (Admin only)
 */
router.get('/alerts',
  authenticate,
  authorize(['admin']),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const healthStatus = await MetricsService.getHealthStatus();

      res.json({
        success: true,
        data: {
          activeAlerts: healthStatus.alerts,
          totalAlerts: healthStatus.alerts.length,
          severity: {
            critical: healthStatus.alerts.filter((a: any) => a.severity === 'critical').length,
            high: healthStatus.alerts.filter((a: any) => a.severity === 'high').length,
            medium: healthStatus.alerts.filter((a: any) => a.severity === 'medium').length,
            low: healthStatus.alerts.filter((a: any) => a.severity === 'low').length
          },
          lastUpdated: new Date()
        },
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error getting alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get alerts',
        timestamp: new Date()
      });
    }
  })
);

/**
 * Reset metrics (for testing/debugging)
 * @route POST /reset-metrics
 * @access Private (Admin only)
 */
router.post('/reset-metrics',
  authenticate,
  authorize(['admin']),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      MetricsService.resetMetrics();
      MetricsService.clearAlerts();

      logger.info('Metrics reset by admin', {
        userId: (req as any).user?.userId,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Metrics reset successfully',
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error resetting metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset metrics',
        timestamp: new Date()
      });
    }
  })
);

/**
 * Clear cache
 * @route POST /clear-cache
 * @access Private (Admin only)
 */
router.post('/clear-cache',
  authenticate,
  authorize(['admin']),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { prefix } = req.body;

      if (prefix) {
        await CacheService.clearPrefix(prefix);
        logger.info('Cache cleared by admin', {
          prefix,
          userId: (req as any).user?.userId,
          ip: req.ip
        });

        res.json({
          success: true,
          message: `Cache cleared for prefix: ${prefix}`,
          timestamp: new Date()
        });
      } else {
        // Clear all cache (if implemented)
        res.status(400).json({
          success: false,
          message: 'Prefix is required',
          timestamp: new Date()
        });
      }
    } catch (error) {
      logger.error('Error clearing cache:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cache',
        timestamp: new Date()
      });
    }
  })
);

/**
 * Helper function to extract metric values
 */
function extractMetricValue(metricsString: string, metricName: string): any {
  try {
    const lines = metricsString.split('\n');
    const metricLines = lines.filter(line =>
      line.startsWith(metricName) && !line.includes('#')
    );

    if (metricLines.length === 0) {
      return null;
    }

    // Parse simple gauge/counter metrics
    const values = metricLines.map(line => {
      const parts = line.split(' ');
      return {
        labels: parseLabels(parts[0].replace(metricName, '')),
        value: parseFloat(parts[1])
      };
    });

    return values;
  } catch (error) {
    logger.error(`Error extracting metric ${metricName}:`, error);
    return null;
  }
}

/**
 * Helper function to parse Prometheus labels
 */
function parseLabels(labelString: string): Record<string, string> {
  const labels: Record<string, string> = {};

  if (!labelString || !labelString.startsWith('{') || !labelString.endsWith('}')) {
    return labels;
  }

  const content = labelString.slice(1, -1);
  const pairs = content.split(',');

  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value) {
      labels[key.trim()] = value.trim().replace(/"/g, '');
    }
  }

  return labels;
}

export default router;
