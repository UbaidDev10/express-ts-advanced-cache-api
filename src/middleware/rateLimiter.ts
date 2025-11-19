import rateLimit from "express-rate-limit";
import { rateLimitHitsTotal } from "../utils/metrics.js";

/**
 * Rate limiting strategy: Maximum 10 requests per minute
 */
export const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    error: "Too many requests",
    message: "Rate limit exceeded. Maximum 10 requests per minute allowed.",
    retryAfter: "Please try again in a minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    rateLimitHitsTotal.labels("main").inc();
    res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded. Maximum 10 requests per minute allowed.",
      retryAfter: "Please try again in a minute.",
    });
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

/**
 * Burst rate limiter: Maximum 5 requests in 10-second window
 */
export const burstRateLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 5,
  message: {
    error: "Burst rate limit exceeded",
    message:
      "Too many requests in a short time. Maximum 5 requests per 10 seconds allowed.",
    retryAfter: "Please slow down and try again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    rateLimitHitsTotal.labels("burst").inc();
    res.status(429).json({
      error: "Burst rate limit exceeded",
      message:
        "Too many requests in a short time. Maximum 5 requests per 10 seconds allowed.",
      retryAfter: "Please slow down and try again.",
    });
  },
});
