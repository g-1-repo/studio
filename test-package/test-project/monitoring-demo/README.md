# 🔍 Monitoring Templates Demo

This directory contains examples and demos for the API Framework's monitoring templates.

## 📊 What's Available

The monitoring templates provide comprehensive observability for your API:

### 1. **Metrics Monitoring** (`metrics.template.ts`)
- **Prometheus** integration for metrics collection
- **Datadog** support for cloud metrics
- HTTP request/response tracking
- Custom business metrics
- Automatic metric flushing

### 2. **Health Checks** (`health-checks.template.ts`)
- Database connectivity checks
- Redis/cache health monitoring
- External service dependency checks
- System resource monitoring
- Configurable check intervals

### 3. **Error Tracking** (`error-tracking.template.ts`)
- **Sentry** integration for error reporting
- Custom error tracking solutions
- Breadcrumb tracking for debugging
- User context and request details
- Performance impact tracking

### 4. **Performance Monitoring** (`performance.template.ts`)
- Request timing and profiling
- Memory usage tracking
- Database query performance
- Custom performance metrics
- Real-time performance reports

## 🚀 Quick Start

### Run the Demo

```bash
# Navigate to the demo directory
cd monitoring-demo

# Run the simple demo to see all features
bun run simple-demo.ts
```

### Basic Usage in Your App

```typescript
import { Hono } from 'hono'
import { 
  createMetricsMiddleware,
  createHealthCheckMiddleware,
  createErrorTrackingMiddleware,
  createPerformanceMiddleware,
  METRICS_CONFIGS,
  HEALTH_CONFIGS,
  ERROR_TRACKING_CONFIGS,
  PERFORMANCE_CONFIGS
} from '@your-org/api-framework/templates'

const app = new Hono()

// Add monitoring middleware
app.use('*', createMetricsMiddleware(METRICS_CONFIGS.production))
app.use('*', createHealthCheckMiddleware(HEALTH_CONFIGS.withDatabase))
app.use('*', createErrorTrackingMiddleware(ERROR_TRACKING_CONFIGS.production))
app.use('*', createPerformanceMiddleware(PERFORMANCE_CONFIGS.production))

// Add monitoring endpoints
app.get('/metrics', createMetricsRoute(metricsCollector))
app.get('/health', (c) => c.json({ status: 'healthy' }))
```

## 📋 Configuration Options

### Metrics Configurations
- `development` - High frequency collection for debugging
- `production` - Optimized for production workloads
- `prometheus` - Prometheus-specific settings
- `datadog` - Datadog integration settings

### Health Check Configurations
- `basic` - Simple uptime and memory checks
- `withDatabase` - Includes database connectivity
- `comprehensive` - Full dependency monitoring
- `microservice` - Service mesh health checks

### Error Tracking Configurations
- `development` - Verbose logging for debugging
- `production` - Optimized error reporting
- `staging` - Balanced settings for testing
- `minimal` - Lightweight error tracking

### Performance Configurations
- `development` - Detailed performance profiling
- `production` - Essential performance metrics
- `highTraffic` - Optimized for high-load scenarios
- `debugging` - Maximum detail for troubleshooting

## 🔧 Environment Setup

### Required Environment Variables

```bash
# For Sentry error tracking
SENTRY_DSN=your_sentry_dsn_here

# For Datadog metrics
DATADOG_API_KEY=your_datadog_api_key

# For database health checks
DATABASE_URL=your_database_connection_string
REDIS_URL=your_redis_connection_string
```

### Docker Compose for Local Development

```yaml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## 📈 Monitoring Endpoints

Once set up, your API will expose these monitoring endpoints:

- `GET /metrics` - Prometheus metrics (for scraping)
- `GET /health` - Health check status
- `GET /health/detailed` - Detailed dependency status
- `GET /_internal/performance` - Performance metrics dashboard

## 🎯 Best Practices

### 1. **Metrics**
- Use consistent naming conventions
- Add meaningful labels
- Don't over-instrument (avoid high cardinality)
- Set up proper alerting thresholds

### 2. **Health Checks**
- Keep checks lightweight and fast
- Test critical dependencies only
- Set appropriate timeouts
- Use circuit breakers for external services

### 3. **Error Tracking**
- Include relevant context
- Filter out noise (404s, etc.)
- Set up proper alert channels
- Use breadcrumbs for debugging

### 4. **Performance Monitoring**
- Focus on user-facing metrics
- Track business-critical operations
- Set up performance budgets
- Monitor trends, not just snapshots

## 🔍 Troubleshooting

### Common Issues

1. **Metrics not appearing**
   - Check if middleware is properly registered
   - Verify endpoint configuration
   - Ensure metrics collector is initialized

2. **Health checks failing**
   - Verify database/service connectivity
   - Check timeout settings
   - Review dependency configurations

3. **Errors not being tracked**
   - Confirm Sentry DSN is set
   - Check error middleware order
   - Verify error filtering rules

4. **Performance data missing**
   - Ensure performance middleware is active
   - Check sampling rates
   - Verify metric collection intervals

## 📚 Further Reading

- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Sentry Error Tracking Guide](https://docs.sentry.io/)
- [Datadog Metrics Guide](https://docs.datadoghq.com/metrics/)
- [Health Check Patterns](https://microservices.io/patterns/observability/health-check-api.html)

## 🤝 Contributing

Found an issue or want to improve the monitoring templates? 

1. Check the template files in `packages/templates/src/monitoring/`
2. Test your changes with the demo
3. Update documentation as needed
4. Submit a pull request

---

**Happy Monitoring! 📊✨**