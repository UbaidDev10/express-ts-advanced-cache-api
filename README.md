# Express.js User Data API with Advanced Caching

A highly efficient Express.js API that serves user data with advanced caching strategies, rate limiting, and asynchronous processing to handle high traffic and improve performance.

## Features

- ✅ **Advanced In-Memory LRU Cache** with 60-second TTL
- ✅ **Cache Statistics** tracking (hits, misses, size, average response time)
- ✅ **Automatic Stale Cache Cleanup** via background task
- ✅ **Request Deduplication** for concurrent requests
- ✅ **Sophisticated Rate Limiting** (10 requests/min, burst 5/10s)
- ✅ **Asynchronous Processing Queue** for database simulation
- ✅ **Prometheus Monitoring** with comprehensive metrics
- ✅ **TypeScript** for type safety and maintainability
- ✅ **Modular Architecture** for clean code organization

## Project Structure

```
express-ts-advanced-cache-api/
├── src/
│   ├── cache/
│   │   └── cacheManager.ts      # LRU cache implementation
│   ├── middleware/
│   │   ├── rateLimiter.ts       # Rate limiting middleware
│   │   └── responseTime.ts      # Response time tracking
│   ├── routes/
│   │   ├── users.ts             # User endpoints
│   │   └── cache.ts             # Cache management endpoints
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── utils/
│   │   ├── asyncQueue.ts       # Async processing queue
│   │   ├── mockData.ts         # Mock user data
│   │   └── metrics.ts          # Prometheus metrics
│   ├── app.ts                   # Express app configuration
│   └── index.ts                 # Application entry point
├── package.json
├── tsconfig.json
├── prometheus.yml
├── PROMETHEUS_GUIDE.md
├── Express_Advanced_Cache_API.postman_collection.json
└── README.md
```

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Prometheus (optional, for monitoring) - Install via `brew install prometheus`

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd express-ts-advanced-cache-api
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Development Mode

Run the application in development mode with hot-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000` by default.

### Production Mode

1. Build the TypeScript code:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

### Running Prometheus

To start Prometheus for monitoring (requires Prometheus to be installed):

```bash
npm run prometheus
```

This will start Prometheus using the `prometheus.yml` configuration file. Prometheus will be available at `http://localhost:9090`.

**Note:** Make sure your Express API is running (`npm run dev`) before starting Prometheus, so it can scrape metrics from `http://localhost:3000/metrics`.

## API Endpoints

### User Endpoints

#### GET /users/:id
Retrieve user data by ID with caching.

**Parameters:**
- `id` (path parameter): User ID (number)

**Response:**
- `200 OK`: User object
  ```json
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
  ```
- `404 Not Found`: User does not exist
  ```json
  {
    "error": "User not found",
    "message": "User with ID 999 does not exist"
  }
  ```
- `400 Bad Request`: Invalid user ID
- `429 Too Many Requests`: Rate limit exceeded

**Example:**
```bash
curl http://localhost:3000/users/1
```

#### POST /users
Create a new user.

**Request Body:**
```json
{
  "name": "Bob Wilson",
  "email": "bob@example.com"
}
```

**Response:**
- `201 Created`: New user object
- `400 Bad Request`: Validation error (missing fields or invalid email)

**Example:**
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob Wilson", "email": "bob@example.com"}'
```

### Cache Management Endpoints

#### GET /cache-status
Get cache statistics.

**Response:**
```json
{
  "hits": 150,
  "misses": 25,
  "size": 3,
  "averageResponseTime": 45.23,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Example:**
```bash
curl http://localhost:3000/cache-status
```

#### DELETE /cache
Clear the entire cache.

**Response:**
```json
{
  "message": "Cache cleared successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3000/cache
```

### Utility Endpoints

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### GET /metrics
Prometheus metrics endpoint for monitoring and observability.

**Response:**
Returns Prometheus-formatted metrics including:
- HTTP request duration (histogram)
- HTTP request totals (counter)
- HTTP errors (counter)
- Cache hits/misses (counters)
- Cache size and hit rate (gauges)
- Rate limit hits (counter)
- System metrics (CPU, memory, etc.)

**Example:**
```bash
curl http://localhost:3000/metrics
```

**Note:** This endpoint is designed to be scraped by Prometheus. See `PROMETHEUS_GUIDE.md` for detailed setup instructions.

## Testing with Postman

### Import Postman Collection

A ready-to-use Postman collection is included in the repository:
- **File:** `Express_Advanced_Cache_API.postman_collection.json`

**To import:**
1. Open Postman
2. Click **Import** button
3. Select the file `Express_Advanced_Cache_API.postman_collection.json`
4. The collection will be imported with all endpoints pre-configured
5. Make sure the `baseUrl` variable is set to `http://localhost:3000` (default)

The collection includes:
- All API endpoints with example requests
- Test scripts for automated validation
- Organized folders (User Endpoints, Cache Management, Utility Endpoints, High Traffic Tests)
- Pre-configured variables

### Testing Cache Performance

1. **First Request (Cache Miss):**
   - Make a GET request to `/users/1`
   - Response time: ~200ms (simulated database call)
   - Check cache status: `misses` should increase

2. **Subsequent Requests (Cache Hit):**
   - Make the same GET request to `/users/1` again
   - Response time: <10ms (served from cache)
   - Check cache status: `hits` should increase

3. **Cache Expiration:**
   - Wait 60 seconds
   - Make another request to `/users/1`
   - Cache should have expired, resulting in another cache miss

### Testing Rate Limiting

1. **Normal Traffic:**
   - Make 5 requests within 10 seconds → Should succeed
   - Make 6th request within 10 seconds → Should get 429 error (burst limit)

2. **Sustained Traffic:**
   - Make 10 requests within 1 minute → Should succeed
   - Make 11th request within 1 minute → Should get 429 error (rate limit)

### Testing Concurrent Requests

1. **Request Deduplication:**
   - Send 10 simultaneous requests to `/users/1`
   - Only one database call should be made
   - All 10 requests should receive the same cached result

### Testing High Traffic Scenarios

The Postman collection includes a **High Traffic Tests** folder that contains multiple requests to simulate high traffic scenarios, rate limiting, and concurrent request handling.

**To run multiple requests simultaneously:**

1. In Postman, navigate to the **High Traffic Tests** folder
2. **Right-click** on the folder
3. Select **Run folder** (or **Run collection** if you want to run all requests)
4. In the Collection Runner window, set the **Delay** to **0 seconds** (or leave it at 0)
5. Click **Run High Traffic Tests** (or the Run button)

This will execute all requests in the folder simultaneously (or with minimal delay), allowing you to:
- Test rate limiting behavior under high load
- Observe request deduplication in action
- Monitor cache performance with concurrent requests
- Verify async processing handles multiple requests efficiently

**Note:** Setting the delay to 0 seconds ensures requests are sent as quickly as possible, creating a realistic high-traffic scenario.

### Testing User Creation

1. **Create User:**
   - POST to `/users` with valid data
   - User should be created and cached
   - GET the new user ID to verify

2. **Validation:**
   - POST with missing fields → 400 error
   - POST with invalid email → 400 error

## Implementation Details

### Caching Strategy

The API uses an **LRU (Least Recently Used)** cache with the following characteristics:

- **TTL (Time To Live):** 60 seconds
- **Maximum Size:** 1000 entries
- **Automatic Eviction:** Expired entries are automatically removed
- **Background Cleanup:** Runs every 10 seconds to ensure stale entries are purged

**Cache Flow:**
1. Request arrives for user ID
2. Check cache → If found, return immediately (cache hit)
3. If not found (cache miss), check if user exists in mock data
4. If exists, add to async queue for database simulation
5. Once fetched, cache the result and return to client

### Rate Limiting Implementation

The API implements a **two-tier rate limiting strategy**:

1. **Burst Limiter:** Maximum 5 requests per 10-second window
2. **Main Limiter:** Maximum 10 requests per 60-second window

Both limiters are applied sequentially. If either limit is exceeded, a `429 Too Many Requests` response is returned.

### Asynchronous Processing

The API uses a **simple in-memory queue** to simulate database operations:

- **Database Simulation:** 200ms delay per request
- **Request Deduplication:** Concurrent requests for the same user ID share the same promise
- **Non-Blocking:** Multiple requests can be processed simultaneously without blocking the event loop

**Deduplication Flow:**
1. Request arrives for user ID that's not in cache
2. Check if there's already a pending request for this ID
3. If yes, return the existing promise (deduplication)
4. If no, create new promise and add to queue
5. Once resolved, all waiting requests receive the same result

### Error Handling

- **404 Not Found:** User ID doesn't exist
- **400 Bad Request:** Invalid input (invalid ID, missing fields, invalid email)
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** Unexpected errors

All errors return meaningful JSON responses with error messages.

## Performance Optimizations

1. **Cache-First Strategy:** Always check cache before database
2. **Request Deduplication:** Prevents duplicate database calls
3. **Background Cleanup:** Keeps cache size manageable
4. **Response Time Tracking:** Monitors API performance
5. **Non-Blocking Queue:** Handles concurrent requests efficiently

## Monitoring

### Cache Statistics

The API tracks the following cache metrics:

- **Cache Hits:** Number of requests served from cache
- **Cache Misses:** Number of requests that required database lookup
- **Cache Size:** Current number of cached entries
- **Average Response Time:** Mean response time across all requests

Access these metrics via the `/cache-status` endpoint.

### Prometheus Metrics

The API exposes comprehensive Prometheus metrics at `/metrics` endpoint for production monitoring:

**HTTP Metrics:**
- `http_request_duration_seconds` - Request duration histogram (by method, route, status code)
- `http_requests_total` - Total HTTP requests counter (by method, route, status code)
- `http_errors_total` - HTTP errors counter (by status code, error type)

**Cache Metrics:**
- `cache_hits_total` - Total cache hits counter
- `cache_misses_total` - Total cache misses counter
- `cache_size` - Current cache size gauge
- `cache_hit_rate` - Cache hit rate gauge (0-1)

**Rate Limiting Metrics:**
- `rate_limit_hits_total` - Rate limit hits counter (by limit type: main/burst)

**System Metrics:**
- Default Node.js metrics (CPU, memory, event loop, etc.) via `prom-client`

**Setting up Prometheus:**

1. Install Prometheus (if not already installed):
```bash
brew install prometheus
```

2. Start Prometheus using the npm script:
```bash
npm run prometheus
```

The `prometheus.yml` configuration file is already set up to scrape metrics from `http://localhost:3000/metrics`.

3. Access metrics:
```bash
curl http://localhost:3000/metrics
```

4. Query metrics in Prometheus UI:
   - Open `http://localhost:9090`
   - Use PromQL queries (see `PROMETHEUS_GUIDE.md` for examples)

**Quick Start:**
1. Start your API: `npm run dev` (in one terminal)
2. Start Prometheus: `npm run prometheus` (in another terminal)
3. Open Prometheus UI: `http://localhost:9090`

For detailed Prometheus setup and usage, see `PROMETHEUS_GUIDE.md`.

## Technologies Used

- **Express.js:** Web framework
- **TypeScript:** Type safety
- **lru-cache:** LRU cache implementation
- **express-rate-limit:** Rate limiting middleware
- **prom-client:** Prometheus metrics client
- **cors:** Cross-origin resource sharing
- **body-parser:** Request body parsing



## Additional Notes

- The cache automatically expires entries after 60 seconds
- Rate limiting resets based on sliding windows
- All endpoints are protected by rate limiting
- The API is designed to handle high traffic efficiently
- Mock data is stored in memory and persists for the lifetime of the server

