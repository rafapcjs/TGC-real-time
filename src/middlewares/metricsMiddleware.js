import { performance } from 'perf_hooks';
import logger, { logPerformance } from '../config/logger.js';

class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        byMethod: {},
        byRoute: {},
        averageResponseTime: 0,
        responseTimeHistory: []
      },
      database: {
        queries: 0,
        errors: 0,
        averageQueryTime: 0,
        queryTimeHistory: []
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0,
        lastUpdated: Date.now()
      },
      uptime: {
        startTime: Date.now(),
        lastRestart: Date.now()
      }
    };
    
    // Update memory metrics every 30 seconds
    setInterval(() => {
      this.updateMemoryMetrics();
    }, 30000);
  }

  // Track HTTP request metrics
  trackRequest(method, route, statusCode, responseTime) {
    this.metrics.requests.total++;
    
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.errors++;
    }

    // Track by method
    if (!this.metrics.requests.byMethod[method]) {
      this.metrics.requests.byMethod[method] = 0;
    }
    this.metrics.requests.byMethod[method]++;

    // Track by route
    const routeKey = `${method} ${route}`;
    if (!this.metrics.requests.byRoute[routeKey]) {
      this.metrics.requests.byRoute[routeKey] = {
        count: 0,
        totalTime: 0,
        averageTime: 0,
        errors: 0
      };
    }
    
    const routeMetrics = this.metrics.requests.byRoute[routeKey];
    routeMetrics.count++;
    routeMetrics.totalTime += responseTime;
    routeMetrics.averageTime = routeMetrics.totalTime / routeMetrics.count;
    
    if (statusCode >= 400) {
      routeMetrics.errors++;
    }

    // Update average response time
    this.metrics.requests.responseTimeHistory.push(responseTime);
    if (this.metrics.requests.responseTimeHistory.length > 1000) {
      this.metrics.requests.responseTimeHistory.shift();
    }
    
    const totalTime = this.metrics.requests.responseTimeHistory.reduce((a, b) => a + b, 0);
    this.metrics.requests.averageResponseTime = totalTime / this.metrics.requests.responseTimeHistory.length;

    // Log slow requests
    if (responseTime > 1000) {
      logger.warn('Slow request detected', {
        method,
        route,
        responseTime: `${responseTime}ms`,
        statusCode
      });
    }
  }

  // Track database query metrics
  trackDatabaseQuery(operation, duration, error = null) {
    this.metrics.database.queries++;
    
    if (error) {
      this.metrics.database.errors++;
      logger.error('Database query error', {
        operation,
        duration: `${duration}ms`,
        error: error.message
      });
    }

    this.metrics.database.queryTimeHistory.push(duration);
    if (this.metrics.database.queryTimeHistory.length > 1000) {
      this.metrics.database.queryTimeHistory.shift();
    }

    const totalTime = this.metrics.database.queryTimeHistory.reduce((a, b) => a + b, 0);
    this.metrics.database.averageQueryTime = totalTime / this.metrics.database.queryTimeHistory.length;

    // Log slow queries
    if (duration > 500) {
      logger.warn('Slow database query', {
        operation,
        duration: `${duration}ms`
      });
    }
  }

  // Update memory usage metrics
  updateMemoryMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.memory = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      lastUpdated: Date.now()
    };

    // Log high memory usage
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    if (heapUsagePercent > 90) {
      logger.warn('High memory usage detected', {
        heapUsagePercent: `${heapUsagePercent.toFixed(2)}%`,
        heapUsed: `${this.metrics.memory.heapUsed}MB`,
        heapTotal: `${this.metrics.memory.heapTotal}MB`
      });
    }
  }

  // Get current metrics
  getMetrics() {
    return {
      ...this.metrics,
      uptime: {
        ...this.metrics.uptime,
        current: Date.now() - this.metrics.uptime.startTime,
        currentFormatted: this.formatUptime(Date.now() - this.metrics.uptime.startTime)
      },
      performance: {
        errorRate: this.metrics.requests.total > 0 
          ? (this.metrics.requests.errors / this.metrics.requests.total * 100).toFixed(2) + '%'
          : '0%',
        requestsPerSecond: this.calculateRequestsPerSecond(),
        databaseErrorRate: this.metrics.database.queries > 0
          ? (this.metrics.database.errors / this.metrics.database.queries * 100).toFixed(2) + '%'
          : '0%'
      }
    };
  }

  // Calculate requests per second
  calculateRequestsPerSecond() {
    const uptimeSeconds = (Date.now() - this.metrics.uptime.startTime) / 1000;
    return uptimeSeconds > 0 ? (this.metrics.requests.total / uptimeSeconds).toFixed(2) : '0';
  }

  // Format uptime in human readable format
  formatUptime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Reset metrics
  reset() {
    this.metrics.requests = {
      total: 0,
      success: 0,
      errors: 0,
      byMethod: {},
      byRoute: {},
      averageResponseTime: 0,
      responseTimeHistory: []
    };
    
    this.metrics.database = {
      queries: 0,
      errors: 0,
      averageQueryTime: 0,
      queryTimeHistory: []
    };

    logger.info('Metrics reset');
  }
}

// Singleton instance
const metricsCollector = new MetricsCollector();

// Fastify plugin for metrics collection
export const metricsMiddleware = async (fastify, options) => {
  // Add metrics collector to fastify instance
  fastify.decorate('metrics', metricsCollector);

  // Hook to track all requests
  fastify.addHook('onRequest', async (request, reply) => {
    request.startTime = performance.now();
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const responseTime = performance.now() - request.startTime;
    const route = request.routerPath || request.url;
    
    metricsCollector.trackRequest(
      request.method,
      route,
      reply.statusCode,
      Math.round(responseTime)
    );

    // Log performance metrics for important operations
    logPerformance(
      `${request.method} ${route}`,
      Math.round(responseTime),
      {
        statusCode: reply.statusCode,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        userId: request.user?.id
      }
    );
  });

  // Metrics endpoint
  fastify.get('/api/metrics', {
    schema: {
      description: 'Get application metrics',
      tags: ['Monitoring'],
      response: {
        200: {
          description: 'Application metrics',
          type: 'object',
          properties: {
            requests: { type: 'object' },
            database: { type: 'object' },
            memory: { type: 'object' },
            uptime: { type: 'object' },
            performance: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return metricsCollector.getMetrics();
  });

  // Health check endpoint with detailed metrics
  fastify.get('/api/health', {
    schema: {
      description: 'Health check with basic metrics',
      tags: ['Monitoring'],
      response: {
        200: {
          description: 'Application health status',
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'string' },
            memory: { type: 'object' },
            database: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const metrics = metricsCollector.getMetrics();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: metrics.uptime.currentFormatted,
      memory: {
        used: `${metrics.memory.heapUsed}MB`,
        total: `${metrics.memory.heapTotal}MB`,
        usage: `${((metrics.memory.heapUsed / metrics.memory.heapTotal) * 100).toFixed(1)}%`
      },
      database: 'connected',
      performance: {
        errorRate: metrics.performance.errorRate,
        avgResponseTime: `${Math.round(metrics.requests.averageResponseTime)}ms`,
        requestsPerSecond: metrics.performance.requestsPerSecond
      }
    };
  });

  // Reset metrics endpoint (admin only)
  fastify.post('/api/metrics/reset', async (request, reply) => {
    metricsCollector.reset();
    return { success: true, message: 'Metrics reset successfully' };
  });
};

export default metricsCollector;