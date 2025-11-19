import type { Request, Response, NextFunction } from "express";
import { cacheManager } from "../cache/cacheManager.js";
import {
  httpRequestDuration,
  httpRequestTotal,
  httpErrorsTotal,
} from "../utils/metrics.js";

/**
 * Middleware to track response times for cache statistics and Prometheus metrics
 */
export function responseTimeTracker(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const route = req.route?.path || req.path || "unknown";

  // Override res.end to capture response time
  const originalEnd = res.end.bind(res);
  res.end = function (
    chunk?: unknown,
    encoding?: BufferEncoding | (() => void),
    cb?: () => void
  ) {
    const duration = Date.now() - startTime;
    const durationSeconds = duration / 1000;
    const statusCode = res.statusCode.toString();

    // Record for cache statistics
    cacheManager.recordResponseTime(duration);

    // Record Prometheus metrics
    httpRequestDuration
      .labels(req.method, route, statusCode)
      .observe(durationSeconds);
    httpRequestTotal.labels(req.method, route, statusCode).inc();

    // Track errors
    if (res.statusCode >= 400) {
      httpErrorsTotal
        .labels(
          statusCode,
          res.statusCode >= 500 ? "server_error" : "client_error"
        )
        .inc();
    }

    if (typeof encoding === "function") {
      return originalEnd(chunk, encoding);
    }
    if (encoding) {
      return originalEnd(chunk, encoding, cb);
    }
    return originalEnd(chunk, cb);
  };

  next();
}
