/**
 * TanStack Query Configuration — Optimized Compute
 * 
 * Handles all server/async data fetching separately from local UI state (Zustand).
 * This separation ensures:
 * - UI remains responsive during heavy API calls
 * - Smart caching prevents redundant network requests
 * - Background refetch keeps data fresh without blocking UI
 * - Stale-while-revalidate pattern for instant perceived performance
 */
import { QueryClient } from '@tanstack/react-query';

/**
 * Pre-configured QueryClient with production-optimized defaults:
 * - 5 minute stale time: cached data serves instantly, refetch in background
 * - 30 minute cache time: keeps data in memory to avoid re-fetching
 * - 2 retries with exponential backoff for network resilience
 * - Refetch on reconnect for offline-to-online transitions
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data stays fresh for 5 minutes — prevents redundant requests
        staleTime: 5 * 60 * 1000,
        // Keep unused data in cache for 30 minutes
        gcTime: 30 * 60 * 1000,
        // Retry failed requests twice with exponential backoff
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        // Refetch when app comes back online
        refetchOnReconnect: true,
        // Don't refetch on window focus (mobile doesn't benefit)
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
      },
    },
  });
}

/**
 * Query key factory — centralized key management for cache invalidation
 * Prevents key collisions and enables targeted cache updates
 */
export const queryKeys = {
  // Driver queries
  requests: {
    all: ['requests'] as const,
    waiting: () => [...queryKeys.requests.all, 'waiting'] as const,
    active: () => [...queryKeys.requests.all, 'active'] as const,
    history: () => [...queryKeys.requests.all, 'history'] as const,
  },
  // Driver profile
  driver: {
    all: ['driver'] as const,
    profile: () => [...queryKeys.driver.all, 'profile'] as const,
    earnings: () => [...queryKeys.driver.all, 'earnings'] as const,
  },
  // Customer queries
  customer: {
    all: ['customer'] as const,
    orders: () => [...queryKeys.customer.all, 'orders'] as const,
    activeOrder: () => [...queryKeys.customer.all, 'active-order'] as const,
  },
} as const;
