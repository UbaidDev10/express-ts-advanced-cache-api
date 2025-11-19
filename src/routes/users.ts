import { Router, type Request, type Response } from 'express';
import { cacheManager } from '../cache/cacheManager.js';
import { asyncQueue } from '../utils/asyncQueue.js';
import { addUser, userExists } from '../utils/mockData.js';
import { cacheHitsTotal, cacheMissesTotal } from '../utils/metrics.js';

const router = Router();

/**
 * GET /users/:id
 * Retrieve user data by ID with caching
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const userIdParam = req.params.id;
  if (!userIdParam) {
    res.status(400).json({
      error: 'Invalid user ID',
      message: 'User ID must be provided',
    });
    return;
  }

  const userId = parseInt(userIdParam, 10);

  if (isNaN(userId)) {
    res.status(400).json({
      error: 'Invalid user ID',
      message: 'User ID must be a valid number',
    });
    return;
  }

  try {
    // Check cache first
    const cachedUser = cacheManager.get(userId);
    if (cachedUser) {
      cacheHitsTotal.inc();
      res.json(cachedUser);
      return;
    }

    cacheMissesTotal.inc();

    // If not in cache, check if it exists in mock data
    if (!userExists(userId)) {
      res.status(404).json({
        error: 'User not found',
        message: `User with ID ${userId} does not exist`,
      });
      return;
    }

    // Use async queue to fetch user (simulates database call)
    const user = await asyncQueue.enqueue(userId);

    // Cache the user data (only if not already cached)
    if (!cacheManager.has(userId)) {
      cacheManager.set(userId, user);
    }

    res.json(user);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(404).json({
      error: 'User not found',
      message: errorMessage,
    });
  }
});

/**
 * POST /users
 * Create a new user
 */
router.post('/', (req: Request, res: Response): void => {
  const { name, email } = req.body;

  // Validation
  if (!name || !email) {
    res.status(400).json({
      error: 'Validation error',
      message: 'Name and email are required',
    });
    return;
  }

  // Validate email format (simple check)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      error: 'Validation error',
      message: 'Invalid email format',
    });
    return;
  }

  try {
    // Add user to mock data
    const newUser = addUser({ name, email });

    // Cache the new user
    cacheManager.set(newUser.id, newUser);

    res.status(201).json(newUser);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
});

export default router;

