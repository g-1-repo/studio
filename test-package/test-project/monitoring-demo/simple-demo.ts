/**
 * Simple monitoring demo showcasing all monitoring templates
 */

import {
  // Error Tracking
  createErrorTracker,
  // Metrics
  createMetricsCollector,
  // Performance
  createPerformanceMonitor,
  ERROR_TRACKING_CONFIGS,
  HEALTH_CONFIGS,
  // Health Checks
  HealthChecker,
  METRICS_CONFIGS,
  PERFORMANCE_CONFIGS
} from '../../../packages/templates/src/monitoring'

// Demo functions for each monitoring feature

async function demoMetrics() {
  console.log('\n📊 METRICS DEMO')
  console.log('===============')

  const metricsCollector = createMetricsCollector(METRICS_CONFIGS.development)

  // Simulate some metrics
  metricsCollector.increment('api_requests_total', 1, { method: 'GET', endpoint: '/users' })
  metricsCollector.increment('api_requests_total', 1, { method: 'POST', endpoint: '/orders' })
  metricsCollector.gauge('active_connections', 42)
  metricsCollector.histogram('request_duration_ms', 150, { endpoint: '/users' })
  metricsCollector.timing('database_query', 25, { table: 'users' })

  console.log('✅ Metrics collected successfully!')
  console.log('   - HTTP requests: 2')
  console.log('   - Active connections: 42')
  console.log('   - Request duration: 150ms')
  console.log('   - Database query time: 25ms')

  // Flush metrics (in real app, this would send to monitoring service)
  try {
    await metricsCollector.flush()
    console.log('✅ Metrics flushed successfully!')
  } catch (error) {
    console.log('ℹ️  Metrics flush skipped (no endpoint configured)')
  }
}

async function demoHealthCheck() {
  console.log('\n🏥 HEALTH CHECK DEMO')
  console.log('====================')

  const healthChecker = new HealthChecker(HEALTH_CONFIGS.basic)

  try {
    const healthReport = await healthChecker.checkHealth()
    console.log('✅ Health check completed!')
    console.log(`   Status: ${healthReport.status}`)
    console.log(`   Uptime: ${Math.round(healthReport.uptime / 1000)}s`)
    console.log(`   Dependencies: ${Object.keys(healthReport.dependencies).length}`)

    if (healthReport.system) {
      console.log(`   Memory usage: ${healthReport.system.memory.percentage.toFixed(1)}%`)
      console.log(`   CPU usage: ${healthReport.system.cpu.usage.toFixed(1)}%`)
    }
  } catch (error) {
    console.log('❌ Health check failed:', error)
  }
}

async function demoErrorTracking() {
  console.log('\n🔥 ERROR TRACKING DEMO')
  console.log('======================')

  const errorTracker = createErrorTracker(ERROR_TRACKING_CONFIGS.development)

  // Set user context
  errorTracker.setUser({
    id: 'demo-user',
    email: 'demo@example.com'
  })

  // Add some breadcrumbs
  errorTracker.addBreadcrumb({
    timestamp: Date.now(),
    type: 'navigation',
    message: 'User navigated to /dashboard'
  })

  errorTracker.addBreadcrumb({
    timestamp: Date.now(),
    type: 'http',
    message: 'API call to /api/users',
    data: { status: 200, duration: 150 }
  })

  try {
    // Simulate an error
    throw new Error('This is a demo error for testing!')
  } catch (error) {
    const eventId = errorTracker.captureException(error as Error, {
      tags: { feature: 'demo', environment: 'test' },
      extra: { demoFlag: true }
    })

    console.log('✅ Error captured successfully!')
    console.log(`   Event ID: ${eventId}`)
    console.log('   User context: demo-user (demo@example.com)')
    console.log('   Breadcrumbs: 2 items')
    console.log('   Tags: feature=demo, environment=test')
  }

  // Capture a message
  const messageId = errorTracker.captureMessage('Demo message logged', 'info', {
    tags: { type: 'demo' }
  })

  console.log('✅ Message captured successfully!')
  console.log(`   Message ID: ${messageId}`)
}

async function demoPerformanceMonitoring() {
  console.log('\n⚡ PERFORMANCE MONITORING DEMO')
  console.log('==============================')

  const performanceMonitor = createPerformanceMonitor(PERFORMANCE_CONFIGS.development)

  // Start tracking
  performanceMonitor.startTracking()

  // Record a custom performance entry
  const startTime = Date.now()

  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 100))

  const endTime = Date.now()
  const duration = endTime - startTime

  // Record the performance entry
  performanceMonitor.recordEntry({
    id: 'demo-operation',
    timestamp: startTime,
    type: 'custom',
    name: 'demo_operation',
    startTime,
    duration,
    metadata: { operation: 'demo' }
  })

  // Record a request performance
  performanceMonitor.recordRequest({
    id: 'demo-request',
    method: 'GET',
    url: '/api/demo',
    startTime,
    endTime,
    duration,
    status: 200,
    size: 1024,
    userAgent: 'Demo/1.0'
  })

  // Record custom metrics
  performanceMonitor.recordCustomMetric('database_calls', 3, { table: 'users' })
  performanceMonitor.recordCustomMetric('cache_hits', 2, { type: 'redis' })

  console.log('✅ Performance monitoring completed!')
  console.log(`   Operation duration: ${duration}ms`)
  console.log('   Custom metrics recorded: 2')
  console.log('   Request performance tracked: 1')

  // Get performance report
  const report = performanceMonitor.getMetrics()
  console.log('✅ Performance report generated!')
  console.log(`   Total requests: ${report.summary.totalRequests}`)
  console.log(`   Average response time: ${report.summary.averageResponseTime.toFixed(2)}ms`)
  console.log(`   Memory usage: ${report.systemMetrics.memory.percentage.toFixed(1)}%`)

  // Stop tracking
  performanceMonitor.stopTracking()
}

// Main demo runner
async function runMonitoringDemo() {
  console.log('🚀 API Framework Monitoring Templates Demo')
  console.log('==========================================')

  try {
    await demoMetrics()
    await demoHealthCheck()
    await demoErrorTracking()
    await demoPerformanceMonitoring()

    console.log('\n🎉 All monitoring demos completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Check out the README.md for detailed usage instructions')
    console.log('2. Explore the template files in packages/templates/src/monitoring/')
    console.log('3. Try integrating these templates into your own API project')

  } catch (error) {
    console.error('\n❌ Demo failed:', error)
  }
}

// Run the demo
runMonitoringDemo()