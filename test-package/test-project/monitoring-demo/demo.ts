// Note: This demo requires 'hono' to be installed. Run: bun add hono
// For now, we'll create a simplified demo without the Hono server

import {
    createErrorTracker,
    createErrorTrackingMiddleware,
    ERROR_TRACKING_CONFIGS
} from '../../../packages/templates/src/monitoring/error-tracking.template'
import {
    createHealthCheckMiddleware,
    HEALTH_CONFIGS,
    HealthChecker
} from '../../../packages/templates/src/monitoring/health-checks.template'
import {
    createMetricsCollector,
    createMetricsMiddleware,
    METRICS_CONFIGS
} from '../../../packages/templates/src/monitoring/metrics.template'
import {
    createPerformanceMiddleware,
    createPerformanceMonitor,
    PERFORMANCE_CONFIGS
} from '../../../packages/templates/src/monitoring/performance.template'

// Initialize monitoring components with proper configurations
const metricsCollector = createMetricsCollector(METRICS_CONFIGS.prometheus)
const healthChecker = new HealthChecker(HEALTH_CONFIGS.basic)
const errorTracker = createErrorTracker(ERROR_TRACKING_CONFIGS.development)
const performanceMonitor = createPerformanceMonitor(PERFORMANCE_CONFIGS.development)

// Create middleware instances (these would be used with Hono when available)
const metricsMiddleware = createMetricsMiddleware(METRICS_CONFIGS.prometheus)
const healthMiddleware = createHealthCheckMiddleware(HEALTH_CONFIGS.basic)
const errorMiddleware = createErrorTrackingMiddleware(ERROR_TRACKING_CONFIGS.development)
const performanceMiddleware = createPerformanceMiddleware(PERFORMANCE_CONFIGS.development)

console.log('🚀 Monitoring Demo (Standalone)')
console.log('================================')

// Demo functions to showcase monitoring capabilities
async function demoMetrics() {
    console.log('\n📊 METRICS DEMO')
    console.log('================')

    // Record some sample metrics using the correct interface methods
    metricsCollector.increment('api_requests_total', 1, { method: 'GET', endpoint: '/users' })
    metricsCollector.increment('api_requests_total', 1, { method: 'POST', endpoint: '/users' })
    metricsCollector.gauge('active_connections', 42)
    metricsCollector.histogram('request_duration_ms', 150, { endpoint: '/users' })
    metricsCollector.histogram('request_duration_ms', 89, { endpoint: '/health' })

    console.log('✅ Sample metrics recorded')
    console.log('   - API requests: 2')
    console.log('   - Active connections: 42')
    console.log('   - Request durations: 150ms, 89ms')

    // Get metrics in Prometheus format (using PrometheusCollector specific method)
    const prometheusCollector = metricsCollector as any
    if (prometheusCollector.getMetricsText) {
        const metricsText = prometheusCollector.getMetricsText()
        console.log('\n📈 Prometheus Metrics Output:')
        console.log(metricsText.substring(0, 200) + '...')
    } else {
        console.log('\n📈 Metrics recorded successfully')
    }
}

async function demoHealthCheck() {
    console.log('\n🏥 HEALTH CHECK DEMO')
    console.log('====================')

    const health = await healthChecker.checkHealth()
    console.log('✅ Health check completed')
    console.log(`   Status: ${health.status}`)
    console.log(`   Uptime: ${health.uptime}s`)
    console.log(`   Dependencies checked: ${health.dependencies.length}`)

    // Handle optional system property
    if (health.system) {
        console.log(`   Memory usage: ${health.system.memory.percentage.toFixed(1)}%`)
    }
}

async function demoErrorTracking() {
    console.log('\n🔥 ERROR TRACKING DEMO')
    console.log('======================')

    try {
        throw new Error('Demo error for testing')
    } catch (error) {
        errorTracker.captureException(error as Error)
        console.log('✅ Error captured and tracked')
        console.log('   Error type: Error')
        console.log('   Message: Demo error for testing')
    }

    // Capture a message
    errorTracker.captureMessage('Demo info message', 'info')
    console.log('✅ Info message captured')
}

async function demoPerformance() {
    console.log('\n⚡ PERFORMANCE DEMO')
    console.log('==================')

    performanceMonitor.startTracking()

    const startTime = Date.now()

    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100))

    const duration = Date.now() - startTime

    // Record performance metrics
    performanceMonitor.recordCustomMetric('operation_duration', duration, { type: 'demo' })

    console.log('✅ Performance tracking completed')
    console.log(`   Operation duration: ${duration}ms`)

    const metrics = performanceMonitor.getMetrics()
    console.log(`   Slowest requests tracked: ${metrics.slowestRequests?.length || 0}`)
    console.log(`   Memory usage: ${metrics.systemMetrics.memory.percentage.toFixed(1)}%`)

    performanceMonitor.stopTracking()
}

// Run all demos
async function runAllDemos() {
    await demoMetrics()
    await demoHealthCheck()
    await demoErrorTracking()
    await demoPerformance()

    console.log('\n🎉 All monitoring demos completed!')
    console.log('\nTo create a full Hono server demo:')
    console.log('1. Run: bun add hono')
    console.log('2. Uncomment the server code above')
    console.log('3. Start the server with: bun run demo.ts')
}

// Execute demos
runAllDemos().catch(console.error)