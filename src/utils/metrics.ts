import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from "prom-client";
import { cacheManager } from "../cache/cacheManager.js";

export const register = new Registry();

register.setDefaultLabels({
  app: "express-advanced-cache-api",
});

collectDefaultMetrics({ register });

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

export const httpErrorsTotal = new Counter({
  name: "http_errors_total",
  help: "Total number of HTTP errors",
  labelNames: ["status_code", "error_type"],
  registers: [register],
});

export const cacheHitsTotal = new Counter({
  name: "cache_hits_total",
  help: "Total number of cache hits",
  registers: [register],
});

export const cacheMissesTotal = new Counter({
  name: "cache_misses_total",
  help: "Total number of cache misses",
  registers: [register],
});

export const cacheSize = new Gauge({
  name: "cache_size",
  help: "Current number of entries in cache",
  registers: [register],
});

export const cacheHitRate = new Gauge({
  name: "cache_hit_rate",
  help: "Cache hit rate (hits / (hits + misses))",
  registers: [register],
});

export const rateLimitHitsTotal = new Counter({
  name: "rate_limit_hits_total",
  help: "Total number of requests that hit rate limit",
  labelNames: ["limit_type"],
  registers: [register],
});

let lastCacheStats = {
  hits: 0,
  misses: 0,
};

setInterval(() => {
  const stats = cacheManager.getStats();
  cacheSize.set(stats.size);

  const newHits = stats.hits - lastCacheStats.hits;
  const newMisses = stats.misses - lastCacheStats.misses;

  if (newHits > 0) {
    cacheHitsTotal.inc(newHits);
  }
  if (newMisses > 0) {
    cacheMissesTotal.inc(newMisses);
  }

  const total = stats.hits + stats.misses;
  if (total > 0) {
    cacheHitRate.set(stats.hits / total);
  }

  lastCacheStats = { hits: stats.hits, misses: stats.misses };
}, 5000);

