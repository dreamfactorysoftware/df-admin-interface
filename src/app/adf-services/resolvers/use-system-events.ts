/**
 * React Query-based custom hook for fetching system event identifiers as a list
 * with intelligent caching and automatic revalidation.
 * 
 * Replaces the Angular systemEventsResolver by implementing React Query useQuery
 * with TTL configuration and specialized list formatting parameters. Provides
 * type-safe GenericListResponse<string> return type while maintaining the original
 * additional parameters for list formatting (as_list: true).
 * 
 * @fileoverview System Events React Query Hook
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { GenericListResponse } from '../../../types/api';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * System event identifier response structure
 * Maintains compatibility with existing DreamFactory API contracts
 */
export interface SystemEvent {
  /** Unique event identifier string */
  id: string;
  /** Human-readable event name */
  name: string;
  /** Event category for grouping */
  category?: string;
  /** Whether the event is active */
  active?: boolean;
}

/**
 * Query options for system events fetching
 * Extends base React Query options with DreamFactory-specific parameters
 */
export interface UseSystemEventsOptions {
  /** Whether to enable the query (default: true) */
  enabled?: boolean;
  /** Custom stale time override (default: 300000ms / 5 minutes) */
  staleTime?: number;
  /** Custom cache time override (default: 900000ms / 15 minutes) */
  cacheTime?: number;
  /** Whether to refetch on window focus (default: false for system data) */
  refetchOnWindowFocus?: boolean;
  /** Whether to refetch on mount (default: true) */
  refetchOnMount?: boolean;
  /** Background refetch interval in milliseconds (default: 30000ms / 30 seconds) */
  refetchInterval?: number;
}

/**
 * System events query result extending React Query result
 * Provides type-safe access to system event data with enhanced error handling
 */
export interface SystemEventsQueryResult extends UseQueryResult<GenericListResponse<string>, Error> {
  /** Convenience accessor for event identifiers array */
  events: string[];
  /** Whether the data is currently being fetched */
  isLoading: boolean;
  /** Whether there was an error fetching the data */
  isError: boolean;
  /** Error information if fetch failed */
  error: Error | null;
  /** Refetch function for manual refresh */
  refetch: () => void;
}

// ============================================================================
// API Client Function
// ============================================================================

/**
 * Fetches system event identifiers from DreamFactory API
 * Maintains compatibility with existing Angular resolver parameters
 * 
 * @returns Promise resolving to GenericListResponse<string> with event identifiers
 * @throws Error if API request fails or returns invalid data
 */
async function fetchSystemEvents(): Promise<GenericListResponse<string>> {
  try {
    // Build API URL with required parameters for list formatting
    const searchParams = new URLSearchParams({
      as_list: 'true', // Maintains backend API compatibility per Section 0.2.6
    });

    // Construct the system events endpoint URL
    // Uses /system/api/v2 for system-level operations per DreamFactory conventions
    const apiUrl = `/system/api/v2/system/event?${searchParams.toString()}`;

    // Execute fetch request with proper error handling
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Session token will be added by middleware or API client interceptor
      },
      // Ensure fresh data for system events when explicitly requested
      cache: 'no-cache',
    });

    // Handle HTTP error responses
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch system events: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    // Parse and validate response data
    const data = await response.json();

    // Validate response structure for GenericListResponse compatibility
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format: expected object');
    }

    if (!Array.isArray(data.resource)) {
      throw new Error('Invalid response format: expected resource array');
    }

    if (!data.meta || typeof data.meta.count !== 'number') {
      throw new Error('Invalid response format: expected meta with count');
    }

    // Return properly typed GenericListResponse
    return {
      resource: data.resource,
      meta: {
        count: data.meta.count,
      },
    } as GenericListResponse<string>;

  } catch (error) {
    // Enhanced error handling with context information
    const enhancedError = error instanceof Error 
      ? error 
      : new Error(`Unknown error fetching system events: ${String(error)}`);
    
    // Log error for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.error('System Events Fetch Error:', {
        error: enhancedError.message,
        stack: enhancedError.stack,
        timestamp: new Date().toISOString(),
      });
    }

    throw enhancedError;
  }
}

// ============================================================================
// React Query Hook Implementation
// ============================================================================

/**
 * React Query-based hook for fetching system event identifiers with intelligent caching
 * 
 * Implements TanStack React Query 5.79.2 for server-state management with TTL configuration
 * and automatic background revalidation for real-time system event updates.
 * 
 * @param options - Optional configuration for query behavior
 * @returns SystemEventsQueryResult with type-safe access to system events data
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const { data, isLoading, error, events } = useSystemEvents();
 * 
 * // With custom options
 * const { data, events, refetch } = useSystemEvents({
 *   enabled: false, // Disable automatic fetching
 *   staleTime: 600000, // 10 minutes
 *   refetchInterval: 60000, // 1 minute
 * });
 * 
 * // Using events directly
 * if (events.length > 0) {
 *   console.log('Available events:', events);
 * }
 * ```
 */
export function useSystemEvents(
  options: UseSystemEventsOptions = {}
): SystemEventsQueryResult {
  // Destructure options with defaults per React/Next.js Integration Requirements
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes (300 seconds) per requirements
    cacheTime = 15 * 60 * 1000, // 15 minutes (900 seconds) per requirements
    refetchOnWindowFocus = false, // System data doesn't need frequent refocus updates
    refetchOnMount = true,
    refetchInterval = 30 * 1000, // 30 seconds for real-time updates per requirements
  } = options;

  // Initialize React Query with optimized configuration
  const queryResult = useQuery({
    // Unique query key for system events caching
    queryKey: ['system', 'events', 'list'],
    
    // Query function for data fetching
    queryFn: fetchSystemEvents,
    
    // Query configuration per React/Next.js Integration Requirements
    enabled,
    staleTime, // Cache responses under 50ms per requirements
    cacheTime, // TTL configuration per Section 5.2 requirements
    refetchOnWindowFocus,
    refetchOnMount,
    refetchInterval, // Automatic background revalidation per requirements
    
    // Additional optimization settings
    refetchOnReconnect: true, // Refetch when network reconnects
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    
    // Enable suspense for React 19 concurrent features
    suspense: false, // Keep false for backward compatibility
    
    // Error handling configuration
    useErrorBoundary: false, // Handle errors at component level
    
    // Data transformation and validation
    select: (data: GenericListResponse<string>) => {
      // Validate and transform data if needed
      if (!data?.resource || !Array.isArray(data.resource)) {
        throw new Error('Invalid system events data structure');
      }
      
      return data;
    },
    
    // Network mode for offline support
    networkMode: 'online',
    
    // Prevent automatic garbage collection
    cacheTime: cacheTime,
  });

  // Extract convenience properties from query result
  const events = queryResult.data?.resource || [];
  
  // Return enhanced query result with convenience properties
  return {
    ...queryResult,
    events,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
}

// ============================================================================
// Utility Functions and Exports
// ============================================================================

/**
 * Pre-configured system events query key for external cache management
 * Useful for manual cache invalidation or prefetching
 */
export const SYSTEM_EVENTS_QUERY_KEY = ['system', 'events', 'list'] as const;

/**
 * Utility function to prefetch system events data
 * Useful for optimistic loading or cache warming
 * 
 * @param queryClient - TanStack Query Client instance
 * @returns Promise resolving when prefetch completes
 * 
 * @example
 * ```typescript
 * import { useQueryClient } from '@tanstack/react-query';
 * import { prefetchSystemEvents } from './use-system-events';
 * 
 * function Component() {
 *   const queryClient = useQueryClient();
 *   
 *   const handlePrefetch = () => {
 *     prefetchSystemEvents(queryClient);
 *   };
 * }
 * ```
 */
export async function prefetchSystemEvents(queryClient: any): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: SYSTEM_EVENTS_QUERY_KEY,
    queryFn: fetchSystemEvents,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Utility function to invalidate system events cache
 * Useful for forcing fresh data fetch after system configuration changes
 * 
 * @param queryClient - TanStack Query Client instance
 * @returns Promise resolving when invalidation completes
 * 
 * @example
 * ```typescript
 * import { useQueryClient } from '@tanstack/react-query';
 * import { invalidateSystemEvents } from './use-system-events';
 * 
 * function AdminPanel() {
 *   const queryClient = useQueryClient();
 *   
 *   const handleSystemConfigUpdate = async () => {
 *     // Update system configuration...
 *     await invalidateSystemEvents(queryClient);
 *   };
 * }
 * ```
 */
export async function invalidateSystemEvents(queryClient: any): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: SYSTEM_EVENTS_QUERY_KEY,
  });
}

/**
 * Type guard to check if system events data is loaded and valid
 * Provides type-safe access to system events data
 * 
 * @param result - System events query result
 * @returns Type predicate indicating if data is available
 * 
 * @example
 * ```typescript
 * const result = useSystemEvents();
 * 
 * if (isSystemEventsLoaded(result)) {
 *   // TypeScript knows result.data is available and valid
 *   console.log('System events:', result.data.resource);
 * }
 * ```
 */
export function isSystemEventsLoaded(
  result: SystemEventsQueryResult
): result is SystemEventsQueryResult & { data: GenericListResponse<string> } {
  return !result.isLoading && !result.isError && !!result.data;
}

// ============================================================================
// Default Export
// ============================================================================

// Export the hook as default for convenient importing
export default useSystemEvents;