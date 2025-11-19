import type { User } from '../types/index.js';

export const mockUsers: Record<number, User> = {
  1: { id: 1, name: 'John Doe', email: 'john@example.com' },
  2: { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  3: { id: 3, name: 'Alice Johnson', email: 'alice@example.com' },
};

let nextUserId = 4;

/**
 * Get next available user ID
 */
export function getNextUserId(): number {
  return nextUserId++;
}

/**
 * Add a new user to mock data
 */
export function addUser(user: Omit<User, 'id'>): User {
  const id = getNextUserId();
  const newUser: User = { ...user, id };
  mockUsers[id] = newUser;
  return newUser;
}

/**
 * Check if user exists in mock data
 */
export function userExists(userId: number): boolean {
  return userId in mockUsers;
}

/**
 * Get user from mock data
 */
export function getUser(userId: number): User | undefined {
  return mockUsers[userId];
}

