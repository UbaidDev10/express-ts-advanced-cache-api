export interface User {
  id: number;
  name: string;
  email: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  averageResponseTime: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface QueueItem {
  userId: number;
  resolve: (value: User) => void;
  reject: (error: Error) => void;
}

