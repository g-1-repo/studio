/**
 * Metrics monitoring template for API performance tracking
 */

export interface MetricsConfig {
  enabled: boolean
  provider: 'prometheus' | 'datadog' | 'newrelic' | 'cloudwatch' | 'custom'
  endpoint?: string
  apiKey?: string
  namespace?: string
  defaultLabels?: Record<string, string>
  collectInterval?: number
  bufferSize?: number
  flushInterval?: number
}

export interface MetricData {
  name: string
  value: number
  type: 'counter' | 'gauge' | 'histogram' | 'summary'
  labels?: Record<string, string>
  timestamp?: number
}

export interface MetricsCollector {
  increment(name: string, value?: number, labels?: Record<string, string>): void
  gauge(name: string, value: number, labels?: Record<string, string>): void
  histogram(name: string, value: number, labels?: Record<string, string>): void
  timing(name: string, duration: number, labels?: Record<string, string>): void
  flush(): Promise<void>
}

export const DEFAULT_METRICS_CONFIG: MetricsConfig = {
  enabled: true,
  provider: 'prometheus',
  namespace: 'api',
  defaultLabels: {},
  collectInterval: 15000, // 15 seconds
  bufferSize: 1000,
  flushInterval: 30000, // 30 seconds
}

export class PrometheusCollector implements MetricsCollector {
  private metrics: Map<string, MetricData> = new Map()
  private config: MetricsConfig

  constructor(config: MetricsConfig) {
    this.config = config
  }

  increment(name: string, value = 1, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels)
    const existing = this.metrics.get(key)

    this.metrics.set(key, {
      name,
      value: (existing?.value || 0) + value,
      type: 'counter',
      labels: { ...this.config.defaultLabels, ...labels },
      timestamp: Date.now(),
    })
  }

  gauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels)

    this.metrics.set(key, {
      name,
      value,
      type: 'gauge',
      labels: { ...this.config.defaultLabels, ...labels },
      timestamp: Date.now(),
    })
  }

  histogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels)

    this.metrics.set(key, {
      name,
      value,
      type: 'histogram',
      labels: { ...this.config.defaultLabels, ...labels },
      timestamp: Date.now(),
    })
  }

  timing(name: string, duration: number, labels?: Record<string, string>): void {
    this.histogram(`${name}_duration_ms`, duration, labels)
  }

  async flush(): Promise<void> {
    if (this.config.endpoint) {
      const metricsData = Array.from(this.metrics.values())

      try {
        await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
          },
          body: JSON.stringify({ metrics: metricsData }),
        })

        this.metrics.clear()
      } catch (error) {
        console.error('Failed to flush metrics:', error)
      }
    }
  }

  private getMetricKey(name: string, labels?: Record<string, string>): string {
    const labelStr = labels ? JSON.stringify(labels) : ''
    return `${name}:${labelStr}`
  }

  getMetricsText(): string {
    let output = ''

    for (const metric of this.metrics.values()) {
      const labelStr = metric.labels
        ? Object.entries(metric.labels)
            .map(([key, value]) => `${key}="${value}"`)
            .join(',')
        : ''

      const metricName = `${this.config.namespace}_${metric.name}`
      output += `${metricName}${labelStr ? `{${labelStr}}` : ''} ${metric.value}\n`
    }

    return output
  }
}

export class DatadogCollector implements MetricsCollector {
  private config: MetricsConfig
  private buffer: MetricData[] = []

  constructor(config: MetricsConfig) {
    this.config = config
  }

  increment(name: string, value = 1, labels?: Record<string, string>): void {
    this.addMetric(name, value, 'counter', labels)
  }

  gauge(name: string, value: number, labels?: Record<string, string>): void {
    this.addMetric(name, value, 'gauge', labels)
  }

  histogram(name: string, value: number, labels?: Record<string, string>): void {
    this.addMetric(name, value, 'histogram', labels)
  }

  timing(name: string, duration: number, labels?: Record<string, string>): void {
    this.addMetric(`${name}.duration`, duration, 'histogram', labels)
  }

  private addMetric(
    name: string,
    value: number,
    type: MetricData['type'],
    labels?: Record<string, string>
  ): void {
    this.buffer.push({
      name: `${this.config.namespace}.${name}`,
      value,
      type,
      labels: { ...this.config.defaultLabels, ...labels },
      timestamp: Date.now(),
    })

    if (this.buffer.length >= (this.config.bufferSize || 1000)) {
      this.flush()
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0 || !this.config.endpoint) return

    const metrics = this.buffer.splice(0)

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': this.config.apiKey || '',
        },
        body: JSON.stringify({
          series: metrics.map(metric => ({
            metric: metric.name,
            points: [[Math.floor(metric.timestamp! / 1000), metric.value]],
            type: metric.type,
            tags: metric.labels ? Object.entries(metric.labels).map(([k, v]) => `${k}:${v}`) : [],
          })),
        }),
      })
    } catch (error) {
      console.error('Failed to flush Datadog metrics:', error)
      // Re-add metrics to buffer for retry
      this.buffer.unshift(...metrics)
    }
  }
}

export function createMetricsCollector(config: MetricsConfig): MetricsCollector {
  switch (config.provider) {
    case 'prometheus':
      return new PrometheusCollector(config)
    case 'datadog':
      return new DatadogCollector(config)
    default:
      return new PrometheusCollector(config)
  }
}

export function createMetricsMiddleware(config: MetricsConfig = DEFAULT_METRICS_CONFIG) {
  if (!config.enabled) {
    return (_c: any, next: any) => next()
  }

  const collector = createMetricsCollector(config)

  // Auto-flush metrics periodically
  if (config.flushInterval) {
    setInterval(() => {
      collector.flush().catch(console.error)
    }, config.flushInterval)
  }

  return async (c: any, next: any) => {
    const start = Date.now()
    const method = c.req.method
    const path = c.req.path

    // Increment request counter
    collector.increment('http_requests_total', 1, {
      method,
      path,
    })

    try {
      await next()

      const duration = Date.now() - start
      const status = c.res.status.toString()

      // Record response time
      collector.timing('http_request_duration', duration, {
        method,
        path,
        status,
      })

      // Increment response counter by status
      collector.increment('http_responses_total', 1, {
        method,
        path,
        status,
      })
    } catch (error) {
      const duration = Date.now() - start

      // Record error metrics
      collector.increment('http_errors_total', 1, {
        method,
        path,
        error: error instanceof Error ? error.name : 'Unknown',
      })

      collector.timing('http_request_duration', duration, {
        method,
        path,
        status: '500',
      })

      throw error
    }
  }
}

// Predefined metric configurations
export const METRICS_CONFIGS = {
  development: {
    ...DEFAULT_METRICS_CONFIG,
    collectInterval: 5000,
    flushInterval: 10000,
  } as MetricsConfig,

  production: {
    ...DEFAULT_METRICS_CONFIG,
    collectInterval: 30000,
    flushInterval: 60000,
  } as MetricsConfig,

  prometheus: {
    ...DEFAULT_METRICS_CONFIG,
    provider: 'prometheus' as const,
    endpoint: '/metrics',
  } as MetricsConfig,

  datadog: {
    ...DEFAULT_METRICS_CONFIG,
    provider: 'datadog' as const,
    endpoint: 'https://api.datadoghq.com/api/v1/series',
  } as MetricsConfig,
}

// Metrics route for Prometheus scraping
export function createMetricsRoute(collector: MetricsCollector) {
  return (c: any) => {
    if (collector instanceof PrometheusCollector) {
      const metricsText = collector.getMetricsText()
      return c.text(metricsText, 200, {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      })
    }

    return c.json({ error: 'Metrics not available for this collector type' }, 400)
  }
}

// Usage examples
export const METRICS_EXAMPLES = {
  basic: `
import { createMetricsMiddleware, METRICS_CONFIGS } from './metrics.template'

const app = new Hono()

// Add metrics middleware
app.use('*', createMetricsMiddleware(METRICS_CONFIGS.production))

// Your routes...
app.get('/api/users', (c) => {
  return c.json({ users: [] })
})
`,

  withPrometheus: `
import { createMetricsMiddleware, createMetricsRoute, createMetricsCollector, METRICS_CONFIGS } from './metrics.template'

const app = new Hono()
const collector = createMetricsCollector(METRICS_CONFIGS.prometheus)

// Add metrics middleware
app.use('*', createMetricsMiddleware(METRICS_CONFIGS.prometheus))

// Expose metrics endpoint for Prometheus
app.get('/metrics', createMetricsRoute(collector))

// Your API routes...
`,

  customMetrics: `
import { createMetricsCollector, DEFAULT_METRICS_CONFIG } from './metrics.template'

const collector = createMetricsCollector({
  ...DEFAULT_METRICS_CONFIG,
  provider: 'datadog',
  apiKey: process.env.DATADOG_API_KEY,
  namespace: 'myapp',
  defaultLabels: {
    service: 'api',
    environment: process.env.NODE_ENV || 'development',
  },
})

// Custom business metrics
app.post('/api/orders', async (c) => {
  const order = await createOrder()
  
  // Track business metrics
  collector.increment('orders_created_total', 1, {
    product_type: order.type,
    payment_method: order.paymentMethod,
  })
  
  collector.gauge('order_value_usd', order.totalAmount, {
    currency: order.currency,
  })
  
  return c.json(order)
})
`,
}
