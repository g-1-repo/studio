/**
 * Performance monitoring template for tracking application performance metrics
 */

export interface PerformanceConfig {
  enabled: boolean
  sampleRate: number
  trackUserInteractions: boolean
  trackNetworkRequests: boolean
  trackResourceLoading: boolean
  trackCustomMetrics: boolean
  maxEntries: number
  bufferSize: number
  reportingInterval: number // milliseconds
  thresholds: {
    slowRequest: number // milliseconds
    slowQuery: number // milliseconds
    highMemoryUsage: number // percentage
    highCpuUsage: number // percentage
  }
}

export interface PerformanceEntry {
  id: string
  timestamp: number
  type: 'navigation' | 'resource' | 'measure' | 'mark' | 'custom'
  name: string
  startTime: number
  duration: number
  metadata?: Record<string, any>
}

export interface RequestPerformance {
  id: string
  method: string
  url: string
  startTime: number
  endTime: number
  duration: number
  status: number
  size?: number
  userAgent?: string
  ip?: string
  userId?: string
}

export interface SystemMetrics {
  timestamp: number
  memory: {
    used: number
    total: number
    percentage: number
  }
  cpu: {
    usage: number
    loadAverage: number[]
  }
  eventLoop: {
    delay: number
    utilization: number
  }
}

export interface PerformanceReport {
  id: string
  timestamp: number
  timeRange: {
    start: number
    end: number
  }
  summary: {
    totalRequests: number
    averageResponseTime: number
    p50ResponseTime: number
    p95ResponseTime: number
    p99ResponseTime: number
    errorRate: number
    throughput: number // requests per second
  }
  slowestRequests: RequestPerformance[]
  systemMetrics: SystemMetrics
  customMetrics: Record<string, number>
}

export interface PerformanceMonitor {
  startTracking(): void
  stopTracking(): void
  recordEntry(entry: PerformanceEntry): void
  recordRequest(request: RequestPerformance): void
  recordCustomMetric(name: string, value: number, metadata?: Record<string, any>): void
  getMetrics(): PerformanceReport
  clearMetrics(): void
}

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  enabled: true,
  sampleRate: 1.0,
  trackUserInteractions: true,
  trackNetworkRequests: true,
  trackResourceLoading: true,
  trackCustomMetrics: true,
  maxEntries: 1000,
  bufferSize: 100,
  reportingInterval: 60000, // 1 minute
  thresholds: {
    slowRequest: 1000, // 1 second
    slowQuery: 500, // 500ms
    highMemoryUsage: 80, // 80%
    highCpuUsage: 80, // 80%
  },
}

export class PerformanceMonitorImpl implements PerformanceMonitor {
  private config: PerformanceConfig
  private entries: PerformanceEntry[] = []
  private requests: RequestPerformance[] = []
  private customMetrics: Map<
    string,
    { value: number; timestamp: number; metadata?: Record<string, any> }
  > = new Map()
  private isTracking = false
  private reportingTimer?: NodeJS.Timeout

  constructor(config: PerformanceConfig) {
    this.config = config
  }

  startTracking(): void {
    if (this.isTracking) return

    this.isTracking = true

    // Start periodic reporting
    if (this.config.reportingInterval > 0) {
      this.reportingTimer = setInterval(() => {
        this.generateReport()
      }, this.config.reportingInterval)
    }

    // Set up performance observers if available
    this.setupPerformanceObservers()
  }

  stopTracking(): void {
    this.isTracking = false

    if (this.reportingTimer) {
      clearInterval(this.reportingTimer)
      this.reportingTimer = undefined
    }
  }

  recordEntry(entry: PerformanceEntry): void {
    if (!this.config.enabled || !this.isTracking) return

    // Apply sampling
    if (Math.random() > this.config.sampleRate) return

    this.entries.push(entry)

    // Maintain buffer size
    if (this.entries.length > this.config.maxEntries) {
      this.entries.shift()
    }
  }

  recordRequest(request: RequestPerformance): void {
    if (!this.config.enabled || !this.isTracking) return

    this.requests.push(request)

    // Check for slow requests
    if (request.duration > this.config.thresholds.slowRequest) {
      console.warn(
        `Slow request detected: ${request.method} ${request.url} took ${request.duration}ms`
      )
    }

    // Maintain buffer size
    if (this.requests.length > this.config.maxEntries) {
      this.requests.shift()
    }
  }

  recordCustomMetric(name: string, value: number, metadata?: Record<string, any>): void {
    if (!this.config.enabled || !this.config.trackCustomMetrics) return

    this.customMetrics.set(name, {
      value,
      timestamp: Date.now(),
      metadata,
    })
  }

  getMetrics(): PerformanceReport {
    const now = Date.now()
    const timeRange = {
      start: Math.min(...this.requests.map(r => r.startTime), now - this.config.reportingInterval),
      end: now,
    }

    // Filter requests within time range
    const recentRequests = this.requests.filter(
      r => r.startTime >= timeRange.start && r.startTime <= timeRange.end
    )

    // Calculate summary statistics
    const durations = recentRequests.map(r => r.duration).sort((a, b) => a - b)
    const errors = recentRequests.filter(r => r.status >= 400)

    const summary = {
      totalRequests: recentRequests.length,
      averageResponseTime:
        durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      p50ResponseTime: this.percentile(durations, 0.5),
      p95ResponseTime: this.percentile(durations, 0.95),
      p99ResponseTime: this.percentile(durations, 0.99),
      errorRate: recentRequests.length > 0 ? errors.length / recentRequests.length : 0,
      throughput: recentRequests.length / ((timeRange.end - timeRange.start) / 1000),
    }

    // Get slowest requests
    const slowestRequests = recentRequests.sort((a, b) => b.duration - a.duration).slice(0, 10)

    // Get system metrics
    const systemMetrics = this.getSystemMetrics()

    // Get custom metrics
    const customMetrics: Record<string, number> = {}
    this.customMetrics.forEach((metric, name) => {
      customMetrics[name] = metric.value
    })

    return {
      id: this.generateId(),
      timestamp: now,
      timeRange,
      summary,
      slowestRequests,
      systemMetrics,
      customMetrics,
    }
  }

  clearMetrics(): void {
    this.entries = []
    this.requests = []
    this.customMetrics.clear()
  }

  private setupPerformanceObservers(): void {
    // This would set up performance observers in a browser environment
    // For Node.js, we'll use process monitoring
    if (typeof process !== 'undefined') {
      this.setupNodePerformanceMonitoring()
    }
  }

  private setupNodePerformanceMonitoring(): void {
    // Monitor event loop delay
    const { monitorEventLoopDelay } = require('node:perf_hooks')
    const histogram = monitorEventLoopDelay({ resolution: 20 })
    histogram.enable()

    setInterval(() => {
      this.recordCustomMetric('eventLoopDelay', histogram.mean / 1000000) // Convert to ms
      this.recordCustomMetric('eventLoopP99', histogram.percentile(99) / 1000000)
    }, 5000)
  }

  private getSystemMetrics(): SystemMetrics {
    const timestamp = Date.now()

    if (typeof process !== 'undefined') {
      const memUsage = process.memoryUsage()
      const cpuUsage = process.cpuUsage()

      return {
        timestamp,
        memory: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        },
        cpu: {
          usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
          loadAverage: require('node:os').loadavg(),
        },
        eventLoop: {
          delay: 0, // Would be populated by event loop monitoring
          utilization: 0,
        },
      }
    }

    // Fallback for non-Node environments
    return {
      timestamp,
      memory: { used: 0, total: 0, percentage: 0 },
      cpu: { usage: 0, loadAverage: [0, 0, 0] },
      eventLoop: { delay: 0, utilization: 0 },
    }
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0
    const index = Math.ceil(values.length * p) - 1
    return values[Math.max(0, Math.min(index, values.length - 1))]
  }

  private generateReport(): void {
    const report = this.getMetrics()

    // Check thresholds and log warnings
    if (report.summary.averageResponseTime > this.config.thresholds.slowRequest) {
      console.warn(`High average response time: ${report.summary.averageResponseTime}ms`)
    }

    if (report.systemMetrics.memory.percentage > this.config.thresholds.highMemoryUsage) {
      console.warn(`High memory usage: ${report.systemMetrics.memory.percentage}%`)
    }

    // Emit report event (could be sent to monitoring service)
    this.emitReport(report)
  }

  private emitReport(report: PerformanceReport): void {
    // In a real implementation, this would send the report to a monitoring service
    console.log('Performance Report:', {
      timestamp: new Date(report.timestamp).toISOString(),
      summary: report.summary,
      slowestRequests: report.slowestRequests.length,
      customMetrics: Object.keys(report.customMetrics).length,
    })
  }

  private generateId(): string {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2) + Date.now().toString(36)
  }
}

export function createPerformanceMonitor(
  config: PerformanceConfig = DEFAULT_PERFORMANCE_CONFIG
): PerformanceMonitor {
  return new PerformanceMonitorImpl(config)
}

export function createPerformanceMiddleware(
  config: PerformanceConfig = DEFAULT_PERFORMANCE_CONFIG
) {
  if (!config.enabled) {
    return (_c: any, next: any) => next()
  }

  const monitor = createPerformanceMonitor(config)
  monitor.startTracking()

  return async (c: any, next: any) => {
    const startTime = Date.now()
    const requestId = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2) + Date.now().toString(36)

    // Record performance entry for request start
    monitor.recordEntry({
      id: requestId,
      timestamp: startTime,
      type: 'mark',
      name: 'request-start',
      startTime,
      duration: 0,
      metadata: {
        method: c.req.method,
        url: c.req.path,
      },
    })

    try {
      await next()

      const endTime = Date.now()
      const duration = endTime - startTime

      // Record request performance
      monitor.recordRequest({
        id: requestId,
        method: c.req.method,
        url: c.req.path,
        startTime,
        endTime,
        duration,
        status: c.res.status,
        userAgent: c.req.header('user-agent'),
        ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      })

      // Record performance entry for request completion
      monitor.recordEntry({
        id: `${requestId}-end`,
        timestamp: endTime,
        type: 'measure',
        name: 'request-duration',
        startTime,
        duration,
        metadata: {
          method: c.req.method,
          url: c.req.path,
          status: c.res.status,
        },
      })

      // Add performance headers
      c.header('X-Response-Time', `${duration}ms`)
      c.header('X-Request-ID', requestId)
    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime

      // Record failed request
      monitor.recordRequest({
        id: requestId,
        method: c.req.method,
        url: c.req.path,
        startTime,
        endTime,
        duration,
        status: 500,
        userAgent: c.req.header('user-agent'),
        ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      })

      throw error
    }
  }
}

// Predefined performance configurations
export const PERFORMANCE_CONFIGS = {
  development: {
    ...DEFAULT_PERFORMANCE_CONFIG,
    sampleRate: 1.0,
    reportingInterval: 30000, // 30 seconds
    maxEntries: 500,
  } as PerformanceConfig,

  production: {
    ...DEFAULT_PERFORMANCE_CONFIG,
    sampleRate: 0.1, // Sample 10% of requests
    reportingInterval: 300000, // 5 minutes
    maxEntries: 10000,
    thresholds: {
      slowRequest: 2000, // 2 seconds
      slowQuery: 1000, // 1 second
      highMemoryUsage: 85,
      highCpuUsage: 85,
    },
  } as PerformanceConfig,

  highTraffic: {
    ...DEFAULT_PERFORMANCE_CONFIG,
    sampleRate: 0.01, // Sample 1% of requests
    reportingInterval: 600000, // 10 minutes
    maxEntries: 5000,
    bufferSize: 50,
    thresholds: {
      slowRequest: 3000,
      slowQuery: 1500,
      highMemoryUsage: 90,
      highCpuUsage: 90,
    },
  } as PerformanceConfig,

  debugging: {
    ...DEFAULT_PERFORMANCE_CONFIG,
    sampleRate: 1.0,
    reportingInterval: 10000, // 10 seconds
    maxEntries: 100,
    trackUserInteractions: true,
    trackNetworkRequests: true,
    trackResourceLoading: true,
    trackCustomMetrics: true,
  } as PerformanceConfig,
}

// Helper functions for performance monitoring
export const PERFORMANCE_HELPERS = {
  // Measure function execution time
  measureFunction: <T extends (...args: any[]) => any>(
    name: string,
    fn: T,
    monitor: PerformanceMonitor
  ): T => {
    return ((...args: Parameters<T>) => {
      const start = Date.now()
      const id = `${name}-${Date.now()}`

      try {
        const result = fn(...args)

        if (result instanceof Promise) {
          return result.finally(() => {
            const duration = Date.now() - start
            monitor.recordEntry({
              id,
              timestamp: start,
              type: 'measure',
              name,
              startTime: start,
              duration,
            })
            monitor.recordCustomMetric(`${name}.duration`, duration)
          })
        } else {
          const duration = Date.now() - start
          monitor.recordEntry({
            id,
            timestamp: start,
            type: 'measure',
            name,
            startTime: start,
            duration,
          })
          monitor.recordCustomMetric(`${name}.duration`, duration)
          return result
        }
      } catch (error) {
        const duration = Date.now() - start
        monitor.recordEntry({
          id,
          timestamp: start,
          type: 'measure',
          name: `${name}.error`,
          startTime: start,
          duration,
          metadata: { error: String(error) },
        })
        throw error
      }
    }) as T
  },

  // Create a performance timer
  createTimer: (name: string, monitor: PerformanceMonitor) => {
    const start = Date.now()
    const id = `${name}-${start}`

    return {
      end: (metadata?: Record<string, any>) => {
        const duration = Date.now() - start
        monitor.recordEntry({
          id,
          timestamp: start,
          type: 'measure',
          name,
          startTime: start,
          duration,
          metadata,
        })
        return duration
      },
    }
  },

  // Monitor database query performance
  monitorQuery: async <T>(
    queryName: string,
    queryFn: () => Promise<T>,
    monitor: PerformanceMonitor
  ): Promise<T> => {
    const timer = PERFORMANCE_HELPERS.createTimer(`db.${queryName}`, monitor)

    try {
      const result = await queryFn()
      const duration = timer.end({ success: true })

      monitor.recordCustomMetric(`db.${queryName}.success`, 1)
      monitor.recordCustomMetric(`db.${queryName}.duration`, duration)

      return result
    } catch (error) {
      const duration = timer.end({ success: false, error: String(error) })

      monitor.recordCustomMetric(`db.${queryName}.error`, 1)
      monitor.recordCustomMetric(`db.${queryName}.duration`, duration)

      throw error
    }
  },
}

// Usage examples
export const PERFORMANCE_EXAMPLES = {
  basic: `
import { createPerformanceMiddleware, PERFORMANCE_CONFIGS } from './performance.template'

const app = new Hono()

// Add performance monitoring middleware
app.use('*', createPerformanceMiddleware(PERFORMANCE_CONFIGS.production))

// Your routes...
app.get('/api/users', (c) => {
  return c.json({ users: [] })
})
`,

  customMetrics: `
import { createPerformanceMonitor, PERFORMANCE_HELPERS } from './performance.template'

const monitor = createPerformanceMonitor({
  enabled: true,
  sampleRate: 1.0,
  reportingInterval: 60000,
})

monitor.startTracking()

// Measure function performance
const fetchUsers = PERFORMANCE_HELPERS.measureFunction(
  'fetchUsers',
  async () => {
    // Database query logic
    return []
  },
  monitor
)

// Monitor database queries
app.get('/api/users', async (c) => {
  const users = await PERFORMANCE_HELPERS.monitorQuery(
    'getUsers',
    () => db.users.findMany(),
    monitor
  )
  
  return c.json(users)
})

// Custom metrics
monitor.recordCustomMetric('active_connections', 42)
monitor.recordCustomMetric('cache_hit_rate', 0.85)
`,

  advancedMonitoring: `
import { 
  createPerformanceMonitor, 
  PERFORMANCE_CONFIGS,
  PERFORMANCE_HELPERS 
} from './performance.template'

const monitor = createPerformanceMonitor(PERFORMANCE_CONFIGS.production)
monitor.startTracking()

// Monitor critical business operations
const processPayment = PERFORMANCE_HELPERS.measureFunction(
  'processPayment',
  async (amount: number, userId: string) => {
    // Payment processing logic
    const timer = PERFORMANCE_HELPERS.createTimer('payment.validation', monitor)
    
    // Validate payment
    await validatePayment(amount, userId)
    timer.end({ amount, userId })
    
    // Process payment
    const result = await PERFORMANCE_HELPERS.monitorQuery(
      'insertPayment',
      () => db.payments.create({ amount, userId }),
      monitor
    )
    
    monitor.recordCustomMetric('payments.processed', 1)
    monitor.recordCustomMetric('payments.amount', amount)
    
    return result
  },
  monitor
)

// Get performance reports
setInterval(() => {
  const report = monitor.getMetrics()
  console.log('Performance Summary:', {
    averageResponseTime: report.summary.averageResponseTime,
    throughput: report.summary.throughput,
    errorRate: report.summary.errorRate,
    memoryUsage: report.systemMetrics.memory.percentage,
  })
}, 60000)
`,
}
