# Prometheus Monitoring Guide

This guide explains how to use the Prometheus monitoring feature in the Express.js Advanced Cache API.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Accessing Metrics](#accessing-metrics)
3. [Understanding Metrics](#understanding-metrics)
4. [Setting Up Prometheus](#setting-up-prometheus)
5. [Essential PromQL Expressions](#essential-promql-expressions)
6. [Monitoring Best Practices](#monitoring-best-practices)

---

## Quick Start

### Step 1: Start Your API

```bash
npm run dev
```

Your API will be running on `http://localhost:3000` (or your configured PORT).

### Step 2: View Metrics

Open your browser or use curl:

```bash
curl http://localhost:3000/metrics
```

You'll see output like:

```
# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",route="/users/:id",status_code="200",le="0.1"} 5
http_request_duration_seconds_bucket{method="GET",route="/users/:id",status_code="200",le="0.3"} 10
...

# HELP cache_hits_total Total number of cache hits
# TYPE cache_hits_total counter
cache_hits_total 45

# HELP cache_misses_total Total number of cache misses
# TYPE cache_misses_total counter
cache_misses_total 12
...
```

---

## Accessing Metrics

### Method 1: Direct HTTP Request

```bash
# Using curl
curl http://localhost:3000/metrics

# Using browser
# Navigate to: http://localhost:3000/metrics
```

### Method 2: Using Prometheus Server

Prometheus will automatically scrape metrics from your API at regular intervals (e.g., every 15 seconds).

### Method 3: Using PromQL Queries

Once Prometheus is set up, you can query metrics using PromQL (Prometheus Query Language).

---

## Understanding Metrics

### HTTP Metrics

#### `http_request_duration_seconds`
**Type:** Histogram  
**Description:** Time taken to process HTTP requests  
**Labels:**
- `method`: HTTP method (GET, POST, DELETE, etc.)
- `route`: API route path (e.g., `/users/:id`, `/cache-status`)
- `status_code`: HTTP status code (200, 404, 429, etc.)

**What it tells you:**
- How fast your API responds
- Which routes are slow
- Response times by status code

**Example values:**
```
http_request_duration_seconds_bucket{method="GET",route="/users/:id",status_code="200",le="0.1"} 50
```
This means 50 requests to GET `/users/:id` with status 200 took less than 0.1 seconds.

#### `http_requests_total`
**Type:** Counter  
**Description:** Total number of HTTP requests  
**Labels:** Same as above (method, route, status_code)

**What it tells you:**
- Total request volume
- Request distribution by route
- Success vs error rates

**Example:**
```
http_requests_total{method="GET",route="/users/:id",status_code="200"} 150
```
This means 150 successful GET requests to `/users/:id`.

#### `http_errors_total`
**Type:** Counter  
**Description:** Total number of HTTP errors (4xx and 5xx)  
**Labels:**
- `status_code`: Error status code (400, 404, 429, 500, etc.)
- `error_type`: Type of error (`client_error` for 4xx, `server_error` for 5xx)

**What it tells you:**
- Error frequency
- Types of errors occurring
- Error trends over time

---

### Cache Metrics

#### `cache_hits_total`
**Type:** Counter  
**Description:** Total number of cache hits (requests served from cache)

**What it tells you:**
- How effective your cache is
- Cache performance over time

**Example:**
```
cache_hits_total 250
```
This means 250 requests were served from cache.

#### `cache_misses_total`
**Type:** Counter  
**Description:** Total number of cache misses (requests that needed database lookup)

**What it tells you:**
- How often cache fails
- When cache needs to be warmed up

**Example:**
```
cache_misses_total 50
```
This means 50 requests required database lookups.

#### `cache_size`
**Type:** Gauge  
**Description:** Current number of entries in the cache

**What it tells you:**
- Current cache utilization
- Whether cache is full or empty

**Example:**
```
cache_size 15
```
This means there are currently 15 entries in the cache.

#### `cache_hit_rate`
**Type:** Gauge  
**Description:** Cache hit rate as a ratio (0.0 to 1.0)

**What it tells you:**
- Cache effectiveness percentage
- Higher is better (1.0 = 100% hit rate)

**Example:**
```
cache_hit_rate 0.833
```
This means 83.3% of requests are served from cache.

---

### Rate Limiting Metrics

#### `rate_limit_hits_total`
**Type:** Counter  
**Description:** Total number of requests that hit rate limits  
**Labels:**
- `limit_type`: Type of limit (`main` for 10/min, `burst` for 5/10s)

**What it tells you:**
- How often rate limits are triggered
- Which limit is more restrictive
- Traffic patterns

**Example:**
```
rate_limit_hits_total{limit_type="burst"} 25
rate_limit_hits_total{limit_type="main"} 10
```
This means 25 requests hit the burst limit and 10 hit the main limit.

---

### System Metrics

The API also exposes default Node.js metrics via `prom-client`:

- **CPU Usage:** `process_cpu_user_seconds_total`, `process_cpu_system_seconds_total`
- **Memory:** `process_resident_memory_bytes`, `nodejs_heap_size_total_bytes`
- **Event Loop:** `nodejs_eventloop_lag_seconds`
- **Active Handles:** `nodejs_active_handles_total`
- **Active Requests:** `nodejs_active_requests_total`

---

## Setting Up Prometheus

### Step 1: Install Prometheus

**macOS (using Homebrew):**
```bash
brew install prometheus
```


### Step 2: Create Prometheus Configuration

Create a file `prometheus.yml` in your project root or Prometheus directory:

```yaml
global:
  scrape_interval: 15s  # How often to scrape metrics
  evaluation_interval: 15s  # How often to evaluate rules

scrape_configs:
  - job_name: 'express-cache-api'
    scrape_interval: 15s
    metrics_path: '/metrics'
    static_configs:
      - targets: ['localhost:3000']
        labels:
          environment: 'development'
          service: 'cache-api'
```

**Configuration Explanation:**
- `scrape_interval`: How often Prometheus fetches metrics (15 seconds)
- `job_name`: Name for this monitoring job
- `targets`: Where your API is running
- `metrics_path`: The endpoint path (default is `/metrics`)

### Step 3: Start Prometheus

**macOS/Linux:**
```bash
# If installed via Homebrew
prometheus --config.file=prometheus.yml

# If downloaded manually
./prometheus --config.file=prometheus.yml
```


### Step 4: Access Prometheus UI

Open your browser and navigate to:
```
http://localhost:9090
```

### Step 5: Verify Metrics Are Being Scraped

1. In Prometheus UI, go to **Status → Targets**
2. You should see your `express-cache-api` target with status **UP**
3. If status is **DOWN**, check:
   - Is your API running?
   - Is the URL correct in `prometheus.yml`?
   - Can you access `http://localhost:3000/metrics` directly?

### Step 6: Query Your Metrics

1. In Prometheus UI, go to the **Graph** tab
2. Enter a PromQL query in the query box (see [Example Queries](#example-queries) below)
3. Click **Execute** to see the results
4. Switch between **Graph** and **Table** views to visualize or see raw data

---

## Essential PromQL Expressions

This section contains the most important PromQL expressions for monitoring your API.

### Request Metrics

**1. Request Rate (requests per second)**
```promql
rate(http_requests_total[5m])
```

**2. Total Requests (all time)**
```promql
http_requests_total
```

---

### Response Time Metrics

**3. Average Response Time (seconds)**
```promql
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

**4. 95th Percentile Response Time**
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

---

### Error Metrics

**5. Error Rate (errors per second)**
```promql
rate(http_errors_total[5m])
```

**6. Total Errors (all time)**
```promql
http_errors_total
```

---

### Cache Metrics

**7. Cache Hit Rate (percentage)**
```promql
cache_hit_rate * 100
```

**8. Total Cache Hits**
```promql
cache_hits_total
```

**9. Total Cache Misses**
```promql
cache_misses_total
```

**10. Cache Size (current entries)**
```promql
cache_size
```

---

### Rate Limiting Metrics

**11. Rate Limit Hits**
```promql
rate_limit_hits_total
```

---

### System Metrics

**12. Memory Usage (MB)**
```promql
process_resident_memory_bytes / 1024 / 1024
```

**13. CPU Usage (percentage)**
```promql
rate(process_cpu_user_seconds_total[5m]) * 100
```

---

### Time Range Variations

You can change `[5m]` to different time ranges:
- `[1m]` - Last 1 minute
- `[5m]` - Last 5 minutes
- `[15m]` - Last 15 minutes
- `[1h]` - Last 1 hour

---

## Monitoring Best Practices

### 1. Set Up Alerts

Create alert rules in Prometheus to notify you of issues:

**Example Alert Rules (`alerts.yml`):**
```yaml
groups:
  - name: api_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_errors_total[5m]) > 0.1
        for: 5m
        annotations:
          summary: "High error rate detected"
          
      - alert: LowCacheHitRate
        expr: cache_hit_rate < 0.5
        for: 10m
        annotations:
          summary: "Cache hit rate is below 50%"
          
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        annotations:
          summary: "95th percentile response time is above 1 second"
```

Add to `prometheus.yml`:
```yaml
rule_files:
  - 'alerts.yml'
```

### 2. Key Metrics to Monitor

**Critical Metrics:**
- Request rate (traffic volume)
- Error rate (system health)
- Response time (performance)
- Cache hit rate (cache effectiveness)

**Warning Signs:**
- Error rate > 1% → Investigate issues
- Cache hit rate < 50% → Cache may need tuning
- Response time > 1s → Performance degradation
- Rate limit hits increasing → Traffic spike or abuse

### 3. Retention and Storage

- **Prometheus:** Default retention is 15 days
- For longer retention, consider:
  - **Prometheus + Thanos:** Long-term storage
  - **Prometheus + VictoriaMetrics:** Alternative storage backend
  - **Cloud solutions:** AWS CloudWatch, Datadog, New Relic

### 5. Production Considerations

- **Security:** Protect `/metrics` endpoint in production
  ```typescript
  // Add authentication middleware to /metrics route
  app.get("/metrics", authenticate, async (_req, res) => { ... });
  ```

- **Sampling:** For high-traffic APIs, consider sampling metrics

- **Labels:** Be careful with high-cardinality labels (unique values) as they increase storage

### 4. Querying Tips

- Use the **Graph** view in Prometheus UI to visualize metrics over time
- Use the **Table** view to see exact values
- Combine multiple queries to compare metrics
- Use time range selectors to analyze different periods

---

## Troubleshooting

### Metrics Not Appearing

1. **Check API is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check metrics endpoint:**
   ```bash
   curl http://localhost:3000/metrics
   ```

3. **Check Prometheus targets:**
   - Go to `http://localhost:9090/targets`
   - Verify target is UP

4. **Check Prometheus logs:**
   - Look for scrape errors in Prometheus logs

### Prometheus Can't Connect

1. **Check network:**
   - Ensure Prometheus can reach your API
   - Check firewall settings

2. **Check URL:**
   - Verify `targets` in `prometheus.yml` is correct
   - Use `localhost:3000` for local development

### No Data in Queries

1. **Check time range:**
   - Ensure time range includes when metrics were collected
   - Try "Last 5 minutes" or "Last 1 hour" in Prometheus UI

2. **Check query syntax:**
   - Verify PromQL query syntax is correct
   - Start with simple queries like `cache_hit_rate` or `cache_size`

3. **Generate some metrics:**
   - Make some API requests to generate data
   - Wait 15-30 seconds for Prometheus to scrape the new metrics

---

## Quick Reference

### Useful PromQL Functions

- `rate()`: Calculate per-second rate
- `increase()`: Calculate increase over time
- `sum()`: Sum values
- `avg()`: Average values
- `max()`: Maximum value
- `min()`: Minimum value
- `histogram_quantile()`: Calculate quantiles from histograms
- `label_replace()`: Modify labels

### Common Time Ranges

- `[1m]`: Last 1 minute
- `[5m]`: Last 5 minutes
- `[15m]`: Last 15 minutes
- `[1h]`: Last 1 hour
- `[24h]`: Last 24 hours

---

## Next Steps

1. ✅ Set up Prometheus and start scraping metrics
2. ✅ Query metrics using PromQL in Prometheus UI
3. ✅ Set up alerting rules for critical metrics
4. ✅ Monitor cache performance and optimize TTL if needed
5. ✅ Track error rates and investigate anomalies
6. ✅ Analyze response times and optimize slow routes

Happy Monitoring! 🚀

