import type { User } from '../types/index.js';
import type { QueueItem } from '../types/index.js';
import { getUser } from './mockData.js';

/**
 * Simple in-memory queue for async processing
 */
export class AsyncQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private pendingRequests = new Map<number, Promise<User>>();

  /**
   * Simulate database call with 200ms delay
   */
  private async simulateDatabaseCall(userId: number): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = getUser(userId);
        if (user) {
          resolve(user);
        } else {
          reject(new Error(`User with ID ${userId} not found`));
        }
      }, 200);
    });
  }

  /**
   * Process queue items
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) continue;

      try {
        const user = await this.simulateDatabaseCall(item.userId);
        item.resolve(user);
      } catch (error) {
        item.reject(error instanceof Error ? error : new Error('Unknown error'));
      }
    }

    this.processing = false;

    // Process any new items that were added while processing
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }

  /**
   * Add a request to the queue
   * Handles deduplication - if a request for the same user ID is already pending,
   * it returns the same promise
   */
  async enqueue(userId: number): Promise<User> {
    // Check if there's already a pending request for this user ID
    const existingPromise = this.pendingRequests.get(userId);
    if (existingPromise) {
      return existingPromise;
    }

    // Create a new promise for this request
    const promise = new Promise<User>((resolve, reject) => {
      const item: QueueItem = {
        userId,
        resolve: (user: User) => {
          this.pendingRequests.delete(userId);
          resolve(user);
        },
        reject: (error: Error) => {
          this.pendingRequests.delete(userId);
          reject(error);
        },
      };

      this.queue.push(item);
      this.processQueue();
    });

    // Store the promise for deduplication
    this.pendingRequests.set(userId, promise);

    return promise;
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Get number of pending requests
   */
  getPendingRequestsCount(): number {
    return this.pendingRequests.size;
  }
}

// Singleton instance
export const asyncQueue = new AsyncQueue();

