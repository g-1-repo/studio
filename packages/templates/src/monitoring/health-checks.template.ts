/**
 * Health checks template for monitoring system and dependency health
 */

export interface HealthCheckConfig {
  enabled: boolean
  endpoint: string
  timeout: number
  interval?: number
  retries?: number
  dependencies?: HealthDependency[]
  includeSystemInfo?: boolean
  includeMetrics?: boolean
}

export interface HealthDependency {
  name: string
  type: 'database' | 'redis' | 'http' | 'custom'
  url?: string
  timeout?: number
  critical?: boolean
  check: () => Promise<HealthStatus>
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  message?: string
  responseTime?: number
  details?: Record<string, any>
  timestamp: number
}

export interface HealthReport {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: number
  uptime: number
  version?: string
  environment?: string
  dependencies: Record<string, HealthStatus>
  system?: SystemInfo
  metrics?: HealthMetrics
}

export interface SystemInfo {
  memory: {
    used: number
    total: number
    percentage: number
  }
  cpu: {
    usage: number
  }
  disk?: {
    used: number
    total: number
    percentage: number
  }
}

export interface HealthMetrics {
  requestsPerSecond: number
  averageResponseTime: number
  errorRate: number
  activeConnections: number
}

export const DEFAULT_HEALTH_CONFIG: HealthCheckConfig = {
  enabled: true,
  endpoint: '/health',
  timeout: 5000,
  interval: 30000, // 30 seconds
  retries: 3,
  dependencies: [],
  includeSystemInfo: true,
  includeMetrics: false,
}

export class HealthChecker {
  private config: HealthCheckConfig
  private startTime: number
  private lastCheck: HealthReport | null = null
  private checkInterval?: NodeJS.Timeout

  constructor(config: HealthCheckConfig) {
    this.config = config
    this.startTime = Date.now()

    if (config.interval) {
      this.startPeriodicChecks()
    }
  }

  async checkHealth(): Promise<HealthReport> {
    const timestamp = Date.now()
    const uptime = timestamp - this.startTime

    const dependencyResults: Record<string, HealthStatus> = {}
    let overallStatus: HealthReport['status'] = 'healthy'

    // Check all dependencies
    for (const dependency of this.config.dependencies || []) {
      try {
        const result = await this.checkDependency(dependency)
        dependencyResults[dependency.name] = result

        // Determine overall status
        if (result.status === 'unhealthy' && dependency.critical !== false) {
          overallStatus = 'unhealthy'
        } else if (result.status === 'degraded' && overallStatus === 'healthy') {
          overallStatus = 'degraded'
        }
      } catch (error) {
        dependencyResults[dependency.name] = {
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp,
        }

        if (dependency.critical !== false) {
          overallStatus = 'unhealthy'
        }
      }
    }

    const report: HealthReport = {
      status: overallStatus,
      timestamp,
      uptime,
      dependencies: dependencyResults,
    }

    // Add system info if enabled
    if (this.config.includeSystemInfo) {
      report.system = await this.getSystemInfo()
    }

    // Add metrics if enabled
    if (this.config.includeMetrics) {
      report.metrics = await this.getHealthMetrics()
    }

    this.lastCheck = report
    return report
  }

  private async checkDependency(dependency: HealthDependency): Promise<HealthStatus> {
    const start = Date.now()

    try {
      const result = await Promise.race([
        dependency.check(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), dependency.timeout || this.config.timeout)
        ),
      ])

      return {
        ...result,
        responseTime: Date.now() - start,
        timestamp: Date.now(),
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Check failed',
        responseTime: Date.now() - start,
        timestamp: Date.now(),
      }
    }
  }

  private async getSystemInfo(): Promise<SystemInfo> {
    // Note: In a real implementation, you'd use proper system monitoring libraries
    // This is a simplified version for demonstration

    const memoryUsage = process.memoryUsage()

    return {
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      },
      cpu: {
        usage: process.cpuUsage().user / 1000000, // Convert to seconds
      },
    }
  }

  private async getHealthMetrics(): Promise<HealthMetrics> {
    // This would typically integrate with your metrics collector
    return {
      requestsPerSecond: 0,
      averageResponseTime: 0,
      errorRate: 0,
      activeConnections: 0,
    }
  }

  private startPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    this.checkInterval = setInterval(() => {
      this.checkHealth().catch(console.error)
    }, this.config.interval)
  }

  getLastCheck(): HealthReport | null {
    return this.lastCheck
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = undefined
    }
  }
}

// Common dependency checks
export const DEPENDENCY_CHECKS = {
  database: (connectionString: string): HealthDependency => ({
    name: 'database',
    type: 'database',
    url: connectionString,
    critical: true,
    check: async () => {
      // This would use your actual database client
      try {
        // Example: await db.raw('SELECT 1')
        return {
          status: 'healthy',
          message: 'Database connection successful',
          timestamp: Date.now(),
        }
      } catch (error) {
        return {
          status: 'unhealthy',
          message: `Database connection failed: ${error}`,
          timestamp: Date.now(),
        }
      }
    },
  }),

  redis: (url: string): HealthDependency => ({
    name: 'redis',
    type: 'redis',
    url,
    critical: false,
    check: async () => {
      try {
        // Example: await redis.ping()
        return {
          status: 'healthy',
          message: 'Redis connection successful',
          timestamp: Date.now(),
        }
      } catch (error) {
        return {
          status: 'unhealthy',
          message: `Redis connection failed: ${error}`,
          timestamp: Date.now(),
        }
      }
    },
  }),

  httpService: (name: string, url: string): HealthDependency => ({
    name,
    type: 'http',
    url,
    critical: false,
    check: async () => {
      try {
        const response = await fetch(`${url}/health`, {
          method: 'GET',
          headers: { 'User-Agent': 'HealthChecker/1.0' },
        })

        if (response.ok) {
          return {
            status: 'healthy',
            message: `${name} service is healthy`,
            timestamp: Date.now(),
          }
        } else {
          return {
            status: 'degraded',
            message: `${name} service returned ${response.status}`,
            timestamp: Date.now(),
          }
        }
      } catch (error) {
        return {
          status: 'unhealthy',
          message: `${name} service is unreachable: ${error}`,
          timestamp: Date.now(),
        }
      }
    },
  }),

  custom: (name: string, checkFn: () => Promise<boolean>): HealthDependency => ({
    name,
    type: 'custom',
    critical: false,
    check: async () => {
      try {
        const isHealthy = await checkFn()
        return {
          status: isHealthy ? 'healthy' : 'unhealthy',
          message: `${name} check ${isHealthy ? 'passed' : 'failed'}`,
          timestamp: Date.now(),
        }
      } catch (error) {
        return {
          status: 'unhealthy',
          message: `${name} check error: ${error}`,
          timestamp: Date.now(),
        }
      }
    },
  }),
}

export function createHealthCheckMiddleware(config: HealthCheckConfig = DEFAULT_HEALTH_CONFIG) {
  if (!config.enabled) {
    return (_c: any, next: any) => next()
  }

  const healthChecker = new HealthChecker(config)

  return async (c: any, next: any) => {
    if (c.req.path === config.endpoint) {
      try {
        const report = await healthChecker.checkHealth()
        const statusCode =
          report.status === 'healthy' ? 200 : report.status === 'degraded' ? 200 : 503

        return c.json(report, statusCode)
      } catch (error) {
        return c.json(
          {
            status: 'unhealthy',
            message: 'Health check failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
          },
          503
        )
      }
    }

    return next()
  }
}

// Predefined health check configurations
export const HEALTH_CONFIGS = {
  basic: {
    ...DEFAULT_HEALTH_CONFIG,
    dependencies: [],
  } as HealthCheckConfig,

  withDatabase: {
    ...DEFAULT_HEALTH_CONFIG,
    dependencies: [DEPENDENCY_CHECKS.database(process.env.DATABASE_URL || '')],
  } as HealthCheckConfig,

  comprehensive: {
    ...DEFAULT_HEALTH_CONFIG,
    includeSystemInfo: true,
    includeMetrics: true,
    dependencies: [
      DEPENDENCY_CHECKS.database(process.env.DATABASE_URL || ''),
      DEPENDENCY_CHECKS.redis(process.env.REDIS_URL || ''),
    ],
  } as HealthCheckConfig,

  microservice: {
    ...DEFAULT_HEALTH_CONFIG,
    dependencies: [
      DEPENDENCY_CHECKS.database(process.env.DATABASE_URL || ''),
      DEPENDENCY_CHECKS.httpService('auth-service', process.env.AUTH_SERVICE_URL || ''),
      DEPENDENCY_CHECKS.httpService('user-service', process.env.USER_SERVICE_URL || ''),
    ],
  } as HealthCheckConfig,
}

// Usage examples
export const HEALTH_CHECK_EXAMPLES = {
  basic: `
import { createHealthCheckMiddleware, HEALTH_CONFIGS } from './health-checks.template'

const app = new Hono()

// Add health check middleware
app.use('*', createHealthCheckMiddleware(HEALTH_CONFIGS.basic))

// Health endpoint will be available at /health
`,

  withDependencies: `
import { createHealthCheckMiddleware, DEPENDENCY_CHECKS } from './health-checks.template'

const healthConfig = {
  enabled: true,
  endpoint: '/health',
  timeout: 5000,
  dependencies: [
    DEPENDENCY_CHECKS.database(process.env.DATABASE_URL!),
    DEPENDENCY_CHECKS.redis(process.env.REDIS_URL!),
    DEPENDENCY_CHECKS.httpService('payment-service', 'https://api.payments.com'),
  ],
}

const app = new Hono()
app.use('*', createHealthCheckMiddleware(healthConfig))
`,

  customCheck: `
import { HealthChecker, DEPENDENCY_CHECKS } from './health-checks.template'

const healthChecker = new HealthChecker({
  enabled: true,
  endpoint: '/health',
  timeout: 5000,
  dependencies: [
    DEPENDENCY_CHECKS.custom('queue-processor', async () => {
      // Custom logic to check if queue processor is working
      const queueSize = await getQueueSize()
      return queueSize < 1000 // Healthy if queue size is manageable
    }),
  ],
})

// Manual health check
const report = await healthChecker.checkHealth()
console.log('System health:', report.status)
`,

  readinessProbe: `
import { createHealthCheckMiddleware } from './health-checks.template'

const app = new Hono()

// Liveness probe - basic health check
app.use('*', createHealthCheckMiddleware({
  enabled: true,
  endpoint: '/health/live',
  timeout: 1000,
  dependencies: [], // No dependencies for liveness
}))

// Readiness probe - includes dependencies
app.use('*', createHealthCheckMiddleware({
  enabled: true,
  endpoint: '/health/ready',
  timeout: 5000,
  dependencies: [
    DEPENDENCY_CHECKS.database(process.env.DATABASE_URL!),
  ],
}))
`,
}
