import { Router, type Request, type Response } from "express";
import { cacheManager } from "../cache/cacheManager.js";

const router = Router();

/**
 * DELETE /cache
 * Clear the entire cache
 */
router.delete("/", (_req: Request, res: Response) => {
  cacheManager.clear();
  res.json({
    message: "Cache cleared successfully",
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /cache-status
 * Get cache statistics
 */
export const getCacheStatus = (_req: Request, res: Response): void => {
  const stats = cacheManager.getStats();
  res.json({
    ...stats,
    timestamp: new Date().toISOString(),
  });
};

export default router;
