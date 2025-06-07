/**
 * useSystemEvents - Custom React hook for system events data fetching
 * 
 * Migrates from Angular systemEventsResolver to React Query-powered data fetching with
 * intelligent caching for system event identifiers. Provides type-safe access to 
 * GenericListResponse<string> format with as_list parameter configuration for 
 * consistent system event data throughout the application.
 * 
 * @fileoverview React Query hook for fetching system events with optimized caching
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+ / TypeScript 5.8+
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { apiClient } from '../../../lib/api-client';
import { DATABASE_SERVICE_REACT_QUERY_CONFIG } from '../constants';
import type { GenericListResponse } from '../../../types/generic-http';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * System events query options for configuration and caching control
 */
export interface UseSystemEventsOptions {
  /** Enable/disable automatic query execution */
  enabled?: boolean;
  /** Manual cache refresh trigger */
  refresh?: boolean;
  /** Custom stale time override */
  staleTime?: number;
  /** Custom cache time override */
  cacheTime?: number;
  /** Custom error retry count */
  retryCount?: number;
}

/**
 * System events hook return interface with query state and utilities
 */
export interface UseSystemEventsReturn {
  /** Array of system event identifiers */
  events: string[];
  /** Loading state indicator */
  isLoading: boolean;
  /** Error state with detailed information */
  error: Error | null;
  /** Manual refetch function */
  refetch: () => void;
  /** Cache invalidation utility */
  invalidateCache: () => Promise<void>;
  /** Data staleness indicator */
  isStale: boolean;
  /** Background revalidation state */
  isRevalidating: boolean;
  /** Query success state */
  isSuccess: boolean;
  /** Query error state */
  isError: boolean;
}

// =============================================================================
// QUERY KEYS AND CACHE MANAGEMENT
// =============================================================================

/**
 * Centralized query key factory for system events cache management
 * Provides consistent cache keys across the application for optimal invalidation
 */
export const systemEventsQueryKeys = {
  /** Base key for all system events queries */
  all: ['system-events'] as const,
  
  /** System events list query */
  list: () => [...systemEventsQueryKeys.all, 'list'] as const,
  
  /** System events list with specific options */
  listWithOptions: (options?: UseSystemEventsOptions) => [
    ...systemEventsQueryKeys.list(),
    {
      enabled: options?.enabled ?? true,
      refresh: options?.refresh ?? false,
    }
  ] as const,
} as const;

// =============================================================================
// API CLIENT FUNCTIONS
// =============================================================================

/**
 * Fetch system events from the server with as_list parameter configuration
 * Replicates Angular systemEventsResolver functionality with React Query optimization
 * 
 * @returns Promise resolving to GenericListResponse<string> with system event identifiers
 * @throws Error on network failures or API errors
 */
async function fetchSystemEvents(): Promise<GenericListResponse<string>> {
  try {
    // Use system/event endpoint with as_list parameter to match original resolver behavior
    const response = await apiClient.get<GenericListResponse<string>>('/system/event', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-cache', // Ensure fresh data for system events
    });

    // Add as_list parameter via query parameters for GenericListResponse format
    const params = new URLSearchParams({
      as_list: 'true',
    });

    const enhancedResponse = await apiClient.get<GenericListResponse<string>>(
      `/system/event?${params.toString()}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    // Validate response structure matches GenericListResponse<string>
    if (!enhancedResponse.resource || !Array.isArray(enhancedResponse.resource)) {
      throw new Error('Invalid system events response format: expected GenericListResponse<string>');
    }

    // Ensure all resource items are strings
    const validatedEvents = enhancedResponse.resource.filter(
      (event): event is string => typeof event === 'string'
    );

    if (validatedEvents.length !== enhancedResponse.resource.length) {
      console.warn('Some system events were filtered out due to invalid type (non-string)');
    }

    return {
      ...enhancedResponse,
      resource: validatedEvents,
    };
  } catch (error) {
    // Enhanced error handling with context
    if (error instanceof Error) {
      throw new Error(`Failed to fetch system events: ${error.message}`);
    }
    throw new Error('Failed to fetch system events: Unknown error occurred');
  }
}

// =============================================================================
// CUSTOM HOOK IMPLEMENTATION
// =============================================================================

/**
 * useSystemEvents - System events data fetching and caching hook
 * 
 * Provides intelligent caching with background revalidation for system event identifiers.
 * Implements the same functionality as Angular systemEventsResolver with enhanced 
 * performance through React Query's intelligent caching and automatic background 
 * synchronization patterns.
 * 
 * Features:
 * - Automatic background revalidation for data consistency
 * - Intelligent caching with configurable stale time
 * - Error handling with exponential backoff retry strategy
 * - Type-safe access to GenericListResponse<string> format
 * - Cache invalidation utilities for external updates
 * - Optimistic loading states and error boundaries
 * 
 * @param options - Query configuration options
 * @returns Hook result with system events data, loading state, and utilities
 * 
 * @example
 * ```typescript
 * // Basic usage with default configuration
 * const { events, isLoading, error } = useSystemEvents();
 * 
 * // With custom options
 * const { events, refetch, invalidateCache } = useSystemEvents({
 *   enabled: true,
 *   staleTime: 10 * 60 * 1000, // 10 minutes
 *   retryCount: 2
 * });
 * 
 * // Manual cache refresh
 * const handleRefresh = () => {
 *   refetch();
 * };
 * ```
 */
export function useSystemEvents(options: UseSystemEventsOptions = {}): UseSystemEventsReturn {
  const queryClient = useQueryClient();
  const { enabled = true, staleTime, cacheTime, retryCount } = options;

  // Memoize query key for optimal cache performance
  const queryKey = useMemo(
    () => systemEventsQueryKeys.listWithOptions(options),
    [options.enabled, options.refresh]
  );

  // Main system events query with intelligent caching configuration
  const {
    data,
    isLoading,
    error,
    refetch,
    isStale,
    isValidating: isRevalidating,
    isSuccess,
    isError,
  } = useQuery({
    queryKey,
    queryFn: fetchSystemEvents,
    enabled,

    // Intelligent caching configuration per Section 3.2.2 state management architecture
    staleTime: staleTime ?? 5 * 60 * 1000, // 5 minutes default stale time
    gcTime: cacheTime ?? 10 * 60 * 1000, // 10 minutes cache retention (was cacheTime in v4)

    // Background synchronization settings per Section 4.4.5 network error recovery
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnReconnect: true, // Refresh on network reconnection
    refetchInterval: 15 * 60 * 1000, // 15 minutes background refresh

    // Error handling with exponential backoff retry strategy
    retry: (failureCount, error) => {
      // Custom retry logic aligned with Section 4.4.5.2 network error recovery patterns
      const maxRetries = retryCount ?? 3;
      
      // Don't retry on 4xx client errors (except 408 timeout)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500 && status !== 408) {
          return false;
        }
      }
      
      // Retry up to maxRetries times for network/server errors
      return failureCount < maxRetries;
    },

    retryDelay: (attemptIndex) => {
      // Exponential backoff with jitter: base delay * 2^attempt + random jitter
      const baseDelay = 1000; // 1 second base
      const exponentialDelay = baseDelay * Math.pow(2, attemptIndex);
      const jitter = Math.random() * 1000; // Up to 1 second jitter
      return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
    },

    // Performance optimization with data selection
    select: useCallback((data: GenericListResponse<string>) => data, []),

    // Enhanced error handling
    throwOnError: false, // Handle errors gracefully in the hook

    // Network mode configuration
    networkMode: 'online', // Only fetch when online

    // Meta information for debugging and monitoring
    meta: {
      component: 'useSystemEvents',
      purpose: 'System events data fetching with intelligent caching',
      migration: 'Angular systemEventsResolver -> React Query',
    },
  });

  // Cache invalidation helper for external cache management
  const invalidateCache = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: systemEventsQueryKeys.all,
      });
    } catch (error) {
      console.error('Failed to invalidate system events cache:', error);
      throw error;
    }
  }, [queryClient]);

  // Manual refetch wrapper with error handling
  const manualRefetch = useCallback(() => {
    try {
      refetch();
    } catch (error) {
      console.error('Failed to refetch system events:', error);
    }
  }, [refetch]);

  // Return hook interface with comprehensive state and utilities
  return {
    events: data?.resource ?? [],
    isLoading,
    error: error as Error | null,
    refetch: manualRefetch,
    invalidateCache,
    isStale,
    isRevalidating,
    isSuccess,
    isError,
  };
}

// =============================================================================
// ADDITIONAL UTILITY HOOKS
// =============================================================================

/**
 * useSystemEventsInvalidation - Hook for external cache invalidation
 * 
 * Provides utilities for invalidating system events cache from external components
 * without direct access to the system events query. Useful for components that
 * modify system configuration and need to refresh event data.
 * 
 * @returns Cache invalidation utilities
 * 
 * @example
 * ```typescript
 * // In a system configuration component
 * const { invalidateSystemEvents, removeSystemEventsCache } = useSystemEventsInvalidation();
 * 
 * const handleConfigUpdate = async () => {
 *   await updateSystemConfig();
 *   await invalidateSystemEvents(); // Refresh events after config change
 * };
 * ```
 */
export function useSystemEventsInvalidation() {
  const queryClient = useQueryClient();

  const invalidateSystemEvents = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: systemEventsQueryKeys.all,
      });
    } catch (error) {
      console.error('Failed to invalidate system events cache:', error);
      throw error;
    }
  }, [queryClient]);

  const invalidateSystemEventsList = useCallback(
    async (options?: UseSystemEventsOptions) => {
      try {
        await queryClient.invalidateQueries({
          queryKey: systemEventsQueryKeys.listWithOptions(options),
        });
      } catch (error) {
        console.error('Failed to invalidate system events list cache:', error);
        throw error;
      }
    },
    [queryClient]
  );

  const removeSystemEventsCache = useCallback(async () => {
    try {
      await queryClient.removeQueries({
        queryKey: systemEventsQueryKeys.all,
      });
    } catch (error) {
      console.error('Failed to remove system events cache:', error);
      throw error;
    }
  }, [queryClient]);

  return {
    invalidateSystemEvents,
    invalidateSystemEventsList,
    removeSystemEventsCache,
  };
}

/**
 * useSystemEventsCache - Hook for programmatic cache management
 * 
 * Provides utilities for reading and manipulating system events cache data
 * for advanced use cases like prefetching, cache warming, and optimistic updates.
 * 
 * @returns Cache management utilities
 * 
 * @example
 * ```typescript
 * // Advanced cache management
 * const { getSystemEventsCache, setSystemEventsCache, prefetchSystemEvents } = useSystemEventsCache();
 * 
 * // Pre-warm cache
 * useEffect(() => {
 *   prefetchSystemEvents();
 * }, [prefetchSystemEvents]);
 * 
 * // Read current cache
 * const cachedEvents = getSystemEventsCache();
 * ```
 */
export function useSystemEventsCache() {
  const queryClient = useQueryClient();

  const getSystemEventsCache = useCallback(
    (options?: UseSystemEventsOptions) => {
      return queryClient.getQueryData<GenericListResponse<string>>(
        systemEventsQueryKeys.listWithOptions(options)
      );
    },
    [queryClient]
  );

  const setSystemEventsCache = useCallback(
    (options: UseSystemEventsOptions, data: GenericListResponse<string>) => {
      queryClient.setQueryData(
        systemEventsQueryKeys.listWithOptions(options),
        data
      );
    },
    [queryClient]
  );

  const prefetchSystemEvents = useCallback(
    async (options: UseSystemEventsOptions = {}) => {
      try {
        await queryClient.prefetchQuery({
          queryKey: systemEventsQueryKeys.listWithOptions(options),
          queryFn: fetchSystemEvents,
          staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes default
        });
      } catch (error) {
        console.error('Failed to prefetch system events:', error);
        throw error;
      }
    },
    [queryClient]
  );

  return {
    getSystemEventsCache,
    setSystemEventsCache,
    prefetchSystemEvents,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useSystemEvents;

// Re-export types for convenience and external usage
export type {
  UseSystemEventsOptions,
  UseSystemEventsReturn,
};

// Export query keys for external cache management
export { systemEventsQueryKeys };

// Export fetchSystemEvents for direct usage if needed
export { fetchSystemEvents };