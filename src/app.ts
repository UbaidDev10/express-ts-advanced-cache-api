import express, { type Express } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { rateLimiter, burstRateLimiter } from "./middleware/rateLimiter.js";
import { responseTimeTracker } from "./middleware/responseTime.js";
import usersRouter from "./routes/users.js";
import cacheRouter, { getCacheStatus } from "./routes/cache.js";
import { register } from "./utils/metrics.js";

const app: Express = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Response time tracking
app.use(responseTimeTracker);

// Rate limiting - apply burst limiter first, then main limiter
app.use(burstRateLimiter);
app.use(rateLimiter);

// Routes
app.use("/users", usersRouter);
app.use("/cache", cacheRouter);

// GET /cache-status endpoint (as per requirements)
app.get("/cache-status", getCacheStatus);

// Prometheus metrics endpoint
app.get("/metrics", async (_req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    res.status(500).end(errorMessage);
  }
});

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res, _next) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message || "An unexpected error occurred",
    });
  }
);

export default app;
