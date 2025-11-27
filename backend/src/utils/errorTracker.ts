import { Request, Response, NextFunction } from 'express';
import logger from './logger';
import MetricsService from '../services/MetricsService';
import ErrorLog from '../models/ErrorLog';
import crypto from 'crypto';

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  method?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  timestamp?: Date;
  headers?: Record<string, string>;
  body?: any;
  query?: any;
  params?: any;
}

export interface ErrorSeverity {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 1-100
  category: 'client' | 'server' | 'security' | 'performance' | 'business';
}

export interface TrackedError extends Error {
  code?: string | number;
  severity?: ErrorSeverity;
  context?: ErrorContext;
  fingerprint?: string;
  stack?: string;
  originalError?: Error;
  metadata?: Record<string, any>;
}

class ErrorTracker {
  private errorPatterns: Map<RegExp, ErrorSeverity> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private lastAlerts: Map<string, number> = new Map();
  private enabled: boolean = true;

  constructor() {
    this.initializeErrorPatterns();
  }

  private initializeErrorPatterns(): void {
    // Database errors
    this.errorPatterns.set(/mongodb.*connection.*timeout/i, {
      level: 'high',
      score: 75,
      category: 'server'
    });

    this.errorPatterns.set(/duplicate.*key/i, {
      level: 'medium',
      score: 40,
      category: 'client'
    });

    this.errorPatterns.set(/validation.*failed/i, {
      level: 'low',
      score: 20,
      category: 'client'
    });

    // Security errors
    this.errorPatterns.set(/jwt.*expired|token.*invalid/i, {
      level: 'medium',
      score: 50,
      category: 'security'
    });

    this.errorPatterns.set(/unauthorized|forbidden/i, {
      level: 'medium',
      score: 45,
      category: 'security'
    });

    this.errorPatterns.set(/sql.*injection|xss.*attack/i, {
      level: 'critical',
      score: 95,
      category: 'security'
    });

    // Performance errors
    this.errorPatterns.set(/timeout|timeout.*error/i, {
      level: 'high',
      score: 70,
      category: 'performance'
    });

    this.errorPatterns.set(/memory.*out|heap.*full/i, {
      level: 'critical',
      score: 90,
      category: 'performance'
    });

    // System errors
    this.errorPatterns.set(/enoent.*file.*not.*found/i, {
      level: 'medium',
      score: 50,
      category: 'server'
    });

    this.errorPatterns.set(/econnrefused|network.*error/i, {
      level: 'high',
      score: 65,
      category: 'server'
    });
  }

  /**
   * Track an error with context
   */
  public trackError(error: Error | TrackedError, context?: ErrorContext): string {
    if (!this.enabled) {
      return error.message;
    }

    const trackedError = this.enrichError(error, context);
    const fingerprint = this.generateFingerprint(trackedError);

    // Update error counts
    const count = this.errorCounts.get(fingerprint) || 0;
    this.errorCounts.set(fingerprint, count + 1);

    // Log the error
    this.logError(trackedError, fingerprint, count + 1);

    // Store in database if severe enough
    if (trackedError.severity?.score || 0 >= 40) {
      this.storeError(trackedError, fingerprint, count + 1);
    }

    // Check for alerts
    this.checkErrorAlerts(trackedError, fingerprint, count + 1);

    // Update metrics
    this.updateErrorMetrics(trackedError);

    return fingerprint;
  }

  /**
   * Express middleware for error tracking
   */
  public errorHandler() {
    return (error: Error | TrackedError, req: Request, res: Response, next: NextFunction) => {
      const context = this.extractContext(req);
      const fingerprint = this.trackError(error, context);

      // Add fingerprint to response headers for debugging
      res.set('X-Error-ID', fingerprint);

      // Continue with normal error handling
      next(error);
    };
  }

  /**
   * Enrich error with additional information
   */
  private enrichError(error: Error | TrackedError, context?: ErrorContext): TrackedError {
    const trackedError: TrackedError = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
      originalError: error
    };

    // Add context
    if (context) {
      trackedError.context = context;
    }

    // Determine severity
    if (!trackedError.severity) {
      trackedError.severity = this.determineSeverity(error, context);
    }

    // Add metadata
    trackedError.metadata = {
      timestamp: new Date(),
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };

    return trackedError;
  }

  /**
   * Extract context from Express request
   */
  private extractContext(req: Request): ErrorContext {
    return {
      userId: (req as any).user?.userId,
      requestId: (req as any).id || this.generateRequestId(),
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date(),
      headers: this.sanitizeHeaders(req.headers),
      body: this.sanitizeBody(req.body),
      query: req.query,
      params: req.params
    };
  }

  /**
   * Determine error severity based on pattern matching
   */
  private determineSeverity(error: Error, context?: ErrorContext): ErrorSeverity {
    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack?.toLowerCase() || '';

    // Check against patterns
    for (const [pattern, severity] of this.errorPatterns) {
      if (pattern.test(errorMessage) || pattern.test(errorStack)) {
        return severity;
      }
    }

    // Default severity based on error type
    if (error.name === 'ValidationError') {
      return {
        level: 'low',
        score: 25,
        category: 'client'
      };
    }

    if (error.name === 'CastError' || error.name === 'TypeError') {
      return {
        level: 'medium',
        score: 50,
        category: 'server'
      };
    }

    // Security-related errors
    if (context?.url?.includes('/auth/') || context?.url?.includes('/login')) {
      return {
        level: 'high',
        score: 60,
        category: 'security'
      };
    }

    // Default to medium server error
    return {
      level: 'medium',
      score: 50,
      category: 'server'
    };
  }

  /**
   * Generate fingerprint for error deduplication
   */
  private generateFingerprint(error: TrackedError): string {
    const fingerprintData = {
      name: error.name,
      message: error.message.substring(0, 200), // Limit message length
      stack: error.stack ? this.normalizeStack(error.stack) : '',
      context: {
        method: error.context?.method,
        url: error.context?.url,
        userId: error.context?.userId
      }
    };

    const fingerprintString = JSON.stringify(fingerprintData);
    return crypto.createHash('md5').update(fingerprintString).digest('hex');
  }

  /**
   * Normalize stack trace for better fingerprinting
   */
  private normalizeStack(stack: string): string {
    // Remove file paths and line numbers that change frequently
    return stack
      .split('\n')
      .map(line => line.replace(/:\d+:\d+/g, ':*:*')) // Replace line numbers
      .map(line => line.replace(/\\.*\\/g, '\\*\\')) // Replace file paths
      .join('\n');
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: TrackedError, fingerprint: string, count: number): void {
    const logData = {
      fingerprint,
      count,
      severity: error.severity,
      context: error.context,
      metadata: error.metadata
    };

    switch (error.severity?.level) {
      case 'critical':
        logger.error('CRITICAL ERROR:', error.message, logData);
        break;
      case 'high':
        logger.error('HIGH SEVERITY ERROR:', error.message, logData);
        break;
      case 'medium':
        logger.warn('MEDIUM SEVERITY ERROR:', error.message, logData);
        break;
      case 'low':
        logger.info('LOW SEVERITY ERROR:', error.message, logData);
        break;
      default:
        logger.error('ERROR:', error.message, logData);
    }
  }

  /**
   * Store error in database
   */
  private async storeError(error: TrackedError, fingerprint: string, count: number): Promise<void> {
    try {
      const errorLog = new ErrorLog({
        userId: error.context?.userId,
        message: error.message,
        stack: error.stack,
        url: error.context?.url || '',
        method: error.context?.method || '',
        userAgent: error.context?.userAgent,
        ip: error.context?.ip,
        timestamp: error.context?.timestamp || new Date(),
        resolved: false,
        metadata: {
          fingerprint,
          count,
          severity: error.severity,
          category: error.severity?.category,
          score: error.severity?.score,
          name: error.name,
          code: error.code,
          requestId: error.context?.requestId
        }
      });

      await errorLog.save();
      logger.debug('Error stored in database:', { fingerprint, count });
    } catch (storeError) {
      logger.error('Failed to store error in database:', storeError);
    }
  }

  /**
   * Check if error should trigger alerts
   */
  private checkErrorAlerts(error: TrackedError, fingerprint: string, count: number): void {
    const now = Date.now();
    const lastAlert = this.lastAlerts.get(fingerprint) || 0;

    // Critical errors always alert
    if (error.severity?.level === 'critical') {
      this.triggerAlert(error, fingerprint, count);
      this.lastAlerts.set(fingerprint, now);
      return;
    }

    // High severity errors alert after 3 occurrences
    if (error.severity?.level === 'high' && count >= 3) {
      this.triggerAlert(error, fingerprint, count);
      this.lastAlerts.set(fingerprint, now);
      return;
    }

    // Medium severity errors alert after 10 occurrences or 1 hour
    if (error.severity?.level === 'medium' && (count >= 10 || (now - lastAlert) > 3600000)) {
      this.triggerAlert(error, fingerprint, count);
      this.lastAlerts.set(fingerprint, now);
    }

    // Any error occurring more than 50 times
    if (count >= 50 && (now - lastAlert) > 300000) { // 5 minutes
      this.triggerAlert(error, fingerprint, count);
      this.lastAlerts.set(fingerprint, now);
    }
  }

  /**
   * Trigger error alert
   */
  private triggerAlert(error: TrackedError, fingerprint: string, count: number): void {
    const alert = {
      type: 'error',
      fingerprint,
      name: error.name,
      message: error.message,
      severity: error.severity?.level,
      score: error.severity?.score,
      category: error.severity?.category,
      count,
      context: error.context,
      timestamp: new Date(),
      environment: process.env.NODE_ENV
    };

    logger.error('ERROR ALERT:', alert);

    // Send to external monitoring systems
    this.sendAlert(alert);
  }

  /**
   * Send alert to external systems
   */
  private sendAlert(alert: any): void {
    // Implement webhook integration
    if (process.env.ALERT_WEBHOOK_URL) {
      fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ALERT_WEBHOOK_TOKEN || ''}`
        },
        body: JSON.stringify(alert)
      }).catch(error => {
        logger.error('Failed to send error alert webhook:', error);
      });
    }

    // Update metrics
    MetricsService.addCustomMetric('error_alerts_total', 'Total number of error alerts', 'counter')
      .inc({ severity: alert.severity, category: alert.category });
  }

  /**
   * Update error metrics
   */
  private updateErrorMetrics(error: TrackedError): void {
    const labels = {
      name: error.name,
      severity: error.severity?.level || 'unknown',
      category: error.severity?.category || 'unknown'
    };

    MetricsService.addCustomMetric('errors_total', 'Total number of errors', 'counter')
      .inc(labels);

    if (error.severity?.score) {
      MetricsService.addCustomMetric('error_severity_score', 'Error severity score', 'gauge')
        .set(labels, error.severity.score);
    }
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(headers: any): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = String(value);
      }
    }

    return sanitized;
  }

  /**
   * Sanitize request body to remove sensitive information
   */
  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'creditCard'];
    const sanitized = { ...body };

    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;

      const result: any = Array.isArray(obj) ? [] : {};

      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }

      return result;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return crypto.randomUUID();
  }

  /**
   * Get error statistics
   */
  public async getErrorStats(timeRange: 'hour' | 'day' | 'week' = 'day'): Promise<any> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'hour':
          startDate = new Date(now.getTime() - 3600000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 604800000);
          break;
        default: // day
          startDate = new Date(now.getTime() - 86400000);
      }

      const errors = await ErrorLog.find({
        timestamp: { $gte: startDate }
      });

      const stats = {
        total: errors.length,
        bySeverity: {
          critical: errors.filter(e => e.metadata?.severity === 'critical').length,
          high: errors.filter(e => e.metadata?.severity === 'high').length,
          medium: errors.filter(e => e.metadata?.severity === 'medium').length,
          low: errors.filter(e => e.metadata?.severity === 'low').length
        },
        byCategory: {
          client: errors.filter(e => e.metadata?.category === 'client').length,
          server: errors.filter(e => e.metadata?.category === 'server').length,
          security: errors.filter(e => e.metadata?.category === 'security').length,
          performance: errors.filter(e => e.metadata?.category === 'performance').length,
          business: errors.filter(e => e.metadata?.category === 'business').length
        },
        topErrors: this.getTopErrors(errors),
        timeRange,
        generatedAt: now
      };

      return stats;
    } catch (error) {
      logger.error('Failed to get error stats:', error);
      return null;
    }
  }

  /**
   * Get most frequent errors
   */
  private getTopErrors(errors: any[]): any[] {
    const errorCounts = new Map<string, number>();

    errors.forEach(error => {
      const fingerprint = error.metadata?.fingerprint || error.message;
      const count = errorCounts.get(fingerprint) || 0;
      errorCounts.set(fingerprint, count + 1);
    });

    return Array.from(errorCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));
  }

  /**
   * Enable/disable error tracking
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.info(`Error tracking ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Clear error counts
   */
  public clearCounts(): void {
    this.errorCounts.clear();
    this.lastAlerts.clear();
    logger.info('Error counts cleared');
  }
}

// Export singleton instance
export default new ErrorTracker();
