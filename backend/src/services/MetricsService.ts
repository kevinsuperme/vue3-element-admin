import client from 'prom-client';
import logger from '../utils/logger';
import config from '../config';

interface MetricThreshold {
  value: number;
  operator: '>' | '<' | '>=' | '<=';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

interface AlertRule {
  name: string;
  metric: string;
  threshold: MetricThreshold;
  duration: number; // seconds
  enabled: boolean;
}

class MetricsService {
  private register: client.Registry;
  private httpDuration: client.Histogram<string>;
  private httpRequestTotal: client.Counter<string>;
  private activeConnections: client.Gauge<string>;
  private memoryUsage: client.Gauge<string>;
  private cpuUsage: client.Gauge<string>;
  private cacheHitRate: client.Gauge<string>;
  private databaseConnections: client.Gauge<string>;
  private alertRules: Map<string, AlertRule> = new Map();
  private lastAlerts: Map<string, number> = new Map();

  constructor() {
    // Create a Registry to register the metrics
    this.register = new client.Registry();

    // Add default labels
    this.register.setDefaultLabels({
      app: config.app.name,
      version: config.app.version,
      environment: config.env
    });

    // Enable the collection of default metrics
    client.collectDefaultMetrics({
      register: this.register,
      prefix: `${config.app.name.toLowerCase()}_`,
      labels: {
        app: config.app.name,
        version: config.app.version,
        environment: config.env
      }
    });

    // Initialize custom metrics
    this.initializeMetrics();
    this.initializeAlertRules();
  }

  private initializeMetrics(): void {
    // HTTP request duration histogram
    this.httpDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
    });

    // HTTP request total counter
    this.httpRequestTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });

    // Active connections gauge
    this.activeConnections = new client.Gauge({
      name: 'active_connections',
      help: 'Number of active connections'
    });

    // Memory usage gauge
    this.memoryUsage = new client.Gauge({
      name: 'memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type'] // heapUsed, heapTotal, external, rss
    });

    // CPU usage gauge
    this.cpuUsage = new client.Gauge({
      name: 'cpu_usage_percent',
      help: 'CPU usage percentage'
    });

    // Cache hit rate gauge
    this.cacheHitRate = new client.Gauge({
      name: 'cache_hit_rate_percent',
      help: 'Cache hit rate percentage',
      labelNames: ['cache_type']
    });

    // Database connections gauge
    this.databaseConnections = new client.Gauge({
      name: 'database_connections',
      help: 'Number of database connections',
      labelNames: ['state'] // active, idle, total
    });

    // Register all metrics
    this.register.registerMetric(this.httpDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.activeConnections);
    this.register.registerMetric(this.memoryUsage);
    this.register.registerMetric(this.cpuUsage);
    this.register.registerMetric(this.cacheHitRate);
    this.register.registerMetric(this.databaseConnections);
  }

  private initializeAlertRules(): void {
    // High response time alert
    this.addAlertRule({
      name: 'high_response_time',
      metric: 'http_request_duration_seconds',
      threshold: {
        value: 2.0,
        operator: '>',
        severity: 'high',
        message: 'HTTP response time is above 2 seconds'
      },
      duration: 300, // 5 minutes
      enabled: true
    });

    // High memory usage alert
    this.addAlertRule({
      name: 'high_memory_usage',
      metric: 'memory_usage_bytes',
      threshold: {
        value: 0.8, // 80% of available memory
        operator: '>',
        severity: 'critical',
        message: 'Memory usage is above 80%'
      },
      duration: 180, // 3 minutes
      enabled: true
    });

    // High error rate alert
    this.addAlertRule({
      name: 'high_error_rate',
      metric: 'http_requests_total',
      threshold: {
        value: 0.1, // 10% error rate
        operator: '>',
        severity: 'medium',
        message: 'HTTP error rate is above 10%'
      },
      duration: 600, // 10 minutes
      enabled: true
    });

    // Low cache hit rate alert
    this.addAlertRule({
      name: 'low_cache_hit_rate',
      metric: 'cache_hit_rate_percent',
      threshold: {
        value: 70, // 70% hit rate
        operator: '<',
        severity: 'low',
        message: 'Cache hit rate is below 70%'
      },
      duration: 900, // 15 minutes
      enabled: true
    });
  }

  /**
   * Record HTTP request metrics
   */
  public recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    const labels = {
      method: method.toUpperCase(),
      route: route || 'unknown',
      status_code: statusCode.toString()
    };

    this.httpDuration.observe(labels, duration / 1000); // Convert to seconds
    this.httpRequestTotal.inc(labels);

    // Check for alerts
    this.checkAlerts();
  }

  /**
   * Update active connections count
   */
  public updateActiveConnections(count: number): void {
    this.activeConnections.set(count);
  }

  /**
   * Update memory usage metrics
   */
  public updateMemoryUsage(usage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  }): void {
    this.memoryUsage.set({ type: 'heapUsed' }, usage.heapUsed);
    this.memoryUsage.set({ type: 'heapTotal' }, usage.heapTotal);
    this.memoryUsage.set({ type: 'external' }, usage.external);
    this.memoryUsage.set({ type: 'rss' }, usage.rss);
  }

  /**
   * Update CPU usage
   */
  public updateCpuUsage(percent: number): void {
    this.cpuUsage.set(percent);
  }

  /**
   * Update cache hit rate
   */
  public updateCacheHitRate(cacheType: string, hitRate: number): void {
    this.cacheHitRate.set({ cache_type: cacheType }, hitRate);
  }

  /**
   * Update database connections
   */
  public updateDatabaseConnections(state: string, count: number): void {
    this.databaseConnections.set({ state }, count);
  }

  /**
   * Get metrics for Prometheus
   */
  public getMetrics(): string {
    return this.register.metrics();
  }

  /**
   * Get registry for custom endpoints
   */
  public getRegistry(): client.Registry {
    return this.register;
  }

  /**
   * Add a custom metric
   */
  public addCustomMetric(name: string, helpText: string, type: 'counter' | 'gauge' | 'histogram'): any {
    let metric;

    switch (type) {
      case 'counter':
        metric = new client.Counter({ name, help: helpText });
        break;
      case 'gauge':
        metric = new client.Gauge({ name, help: helpText });
        break;
      case 'histogram':
        metric = new client.Histogram({ name, help: helpText });
        break;
      default:
        throw new Error(`Unsupported metric type: ${type}`);
    }

    this.register.registerMetric(metric);
    return metric;
  }

  /**
   * Add alert rule
   */
  public addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.name, rule);
    logger.info(`Alert rule added: ${rule.name}`, rule);
  }

  /**
   * Remove alert rule
   */
  public removeAlertRule(name: string): void {
    this.alertRules.delete(name);
    logger.info(`Alert rule removed: ${name}`);
  }

  /**
   * Check all alert rules
   */
  private async checkAlerts(): Promise<void> {
    const now = Date.now();

    for (const [name, rule] of this.alertRules) {
      if (!rule.enabled) continue;

      try {
        const shouldAlert = await this.evaluateRule(rule);
        const lastAlert = this.lastAlerts.get(name) || 0;

        if (shouldAlert && (now - lastAlert) > rule.duration * 1000) {
          this.triggerAlert(rule);
          this.lastAlerts.set(name, now);
        }
      } catch (error) {
        logger.error(`Error evaluating alert rule ${name}:`, error);
      }
    }
  }

  /**
   * Evaluate alert rule
   */
  private async evaluateRule(rule: AlertRule): Promise<boolean> {
    const metric = this.register.getSingleMetric(rule.metric);
    if (!metric) return false;

    const asyncMetric = metric as any;
    let value: number;

    try {
      if (asyncMetric.get) {
        const result = await asyncMetric.get();
        value = result.values?.[0]?.value || 0;
      } else {
        // For histograms, calculate average
        const observeResult = await asyncMetric.observe();
        value = observeResult || 0;
      }
    } catch (error) {
      logger.error(`Error getting metric value for ${rule.metric}:`, error);
      return false;
    }

    return this.compareValue(value, rule.threshold);
  }

  /**
   * Compare value with threshold
   */
  private compareValue(value: number, threshold: MetricThreshold): boolean {
    switch (threshold.operator) {
      case '>':
        return value > threshold.value;
      case '<':
        return value < threshold.value;
      case '>=':
        return value >= threshold.value;
      case '<=':
        return value <= threshold.value;
      default:
        return false;
    }
  }

  /**
   * Trigger alert
   */
  private triggerAlert(rule: AlertRule): void {
    const alert = {
      name: rule.name,
      severity: rule.threshold.severity,
      message: rule.threshold.message,
      timestamp: new Date(),
      metric: rule.metric,
      threshold: rule.threshold.value,
      environment: config.env
    };

    // Log the alert
    logger.error('ALERT TRIGGERED:', alert);

    // Here you can add more alert channels:
    // - Send to monitoring system
    // - Send email/SMS
    // - Send to Slack/Teams
    // - Create incident in ticketing system
    this.sendAlert(alert);
  }

  /**
   * Send alert to external systems
   */
  private sendAlert(alert: any): void {
    // For now, just log. In production, implement:
    // - Webhook calls
    // - Email notifications
    // - Slack/Teams integration
    // - PagerDuty integration

    if (process.env.ALERT_WEBHOOK_URL) {
      fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ALERT_WEBHOOK_TOKEN || ''}`
        },
        body: JSON.stringify(alert)
      }).catch(error => {
        logger.error('Failed to send alert webhook:', error);
      });
    }
  }

  /**
   * Get system health status
   */
  public async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    metrics: any;
    alerts: any[];
  }> {
    const metrics = await this.getSystemMetrics();
    const activeAlerts = this.getActiveAlerts();

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Determine overall status
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
    const highAlerts = activeAlerts.filter(a => a.severity === 'high');

    if (criticalAlerts.length > 0) {
      status = 'critical';
    } else if (highAlerts.length > 0 || activeAlerts.length > 3) {
      status = 'warning';
    }

    return {
      status,
      metrics,
      alerts: activeAlerts
    };
  }

  /**
   * Get current system metrics
   */
  private async getSystemMetrics(): Promise<any> {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime(),
      timestamp: new Date()
    };
  }

  /**
   * Get active alerts
   */
  private getActiveAlerts(): any[] {
    const now = Date.now();
    const activeAlerts: any[] = [];

    for (const [name, rule] of this.alertRules) {
      const lastAlert = this.lastAlerts.get(name) || 0;
      const alertAge = now - lastAlert;

      // Consider alerts within the last hour as active
      if (alertAge < 3600000 && alertAge > 0) {
        activeAlerts.push({
          name,
          severity: rule.threshold.severity,
          message: rule.threshold.message,
          lastTriggered: new Date(lastAlert),
          metric: rule.metric
        });
      }
    }

    return activeAlerts;
  }

  /**
   * Reset all metrics
   */
  public resetMetrics(): void {
    this.register.reset();
    logger.info('All metrics reset');
  }

  /**
   * Clear all alerts
   */
  public clearAlerts(): void {
    this.lastAlerts.clear();
    logger.info('All alerts cleared');
  }
}

// Export singleton instance
export default new MetricsService();