/**
 * System Events Custom React Hook
 * 
 * Migrates Angular systemEventsResolver to React Query-powered custom hook for fetching
 * system event identifiers. Implements intelligent caching with background revalidation
 * and provides type-safe access to GenericListResponse<string> format with as_list
 * parameter configuration for consistent system event data throughout the application.
 * 
 * Features:
 * - TanStack React Query integration for system events data fetching
 * - GenericListResponse<string> format support with as_list parameter
 * - Intelligent caching with background revalidation
 * - Error handling and retry strategies aligned with network error recovery patterns
 * - TypeScript 5.8+ compatibility with strict type safety
 * - Integration with database service constants and shared configuration
 * - Query key management for effective cache invalidation
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { DATABASE_SERVICE_REACT_QUERY_CONFIG, DATABASE_SERVICE_ENDPOINTS } from '../constants';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Generic HTTP response wrapper for DreamFactory API responses
 * Maintains compatibility with original Angular implementation
 */
export interface GenericListResponse<T> {
  resource: Array<T>;
  meta: {
    count: number;
  };
}

/**
 * System events query configuration interface
 * Enables customization of query behavior while maintaining defaults
 */
export interface SystemEventsQueryOptions {
  /** Enable or disable the query execution */
  enabled?: boolean;
  /** Override default stale time for system events */
  staleTime?: number;
  /** Override default cache time for system events */
  cacheTime?: number;
  /** Override default retry configuration */
  retry?: number;
  /** Enable background refetching */
  refetchOnWindowFocus?: boolean;
  /** Enable refetching on network reconnection */
  refetchOnReconnect?: boolean;
}

/**
 * System events API request parameters
 * Matches original Angular resolver implementation with as_list parameter
 */
export interface SystemEventsRequestParams {
  /** Force list format response */
  as_list: boolean;
}

// =============================================================================
// QUERY KEY FACTORY
// =============================================================================

/**
 * Query key factory for system events
 * Provides consistent query key generation for effective cache management
 */
const systemEventsKeys = {
  /** Base key for all system events queries */
  all: ['system-events'] as const,
  /** Key for system events list with as_list parameter */
  list: () => [...systemEventsKeys.all, 'list'] as const,
  /** Key for system events with specific parameters */
  listWithParams: (params: SystemEventsRequestParams) => 
    [...systemEventsKeys.list(), params] as const,
} as const;

// =============================================================================
// API CLIENT FUNCTION
// =============================================================================

/**
 * Fetches system events from DreamFactory Events Service
 * Replicates Angular resolver functionality with as_list parameter configuration
 * 
 * @param params - Request parameters including as_list configuration
 * @returns Promise resolving to GenericListResponse<string> with system event identifiers
 * @throws Error with detailed message for network or API failures
 */
const fetchSystemEvents = async (
  params: SystemEventsRequestParams
): Promise<GenericListResponse<string>> => {
  try {
    // Construct API endpoint for system events
    const url = new URL(`${DATABASE_SERVICE_ENDPOINTS.BASE_URL}/system/event`, window.location.origin);
    
    // Add as_list parameter to match original resolver behavior
    if (params.as_list) {
      url.searchParams.set('as_list', 'true');
    }

    // Execute fetch request with proper error handling
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Include credentials for session-based authentication
      credentials: 'include',
    });

    // Handle HTTP error responses
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Failed to fetch system events: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage = `System events fetch failed: ${errorData.error.message}`;
        }
      } catch {
        // Use generic error message if response isn't valid JSON
        errorMessage += ` - ${errorText}`;
      }
      
      throw new Error(errorMessage);
    }

    // Parse and validate response data
    const data = await response.json();
    
    // Ensure response matches expected GenericListResponse format
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format: expected object');
    }
    
    if (!Array.isArray(data.resource)) {
      throw new Error('Invalid response format: resource must be an array');
    }
    
    if (!data.meta || typeof data.meta.count !== 'number') {
      throw new Error('Invalid response format: meta.count must be a number');
    }

    return data as GenericListResponse<string>;
  } catch (error) {
    // Re-throw with enhanced error context for debugging
    if (error instanceof Error) {
      throw new Error(`System events API error: ${error.message}`);
    }
    throw new Error('Unknown error occurred while fetching system events');
  }
};

// =============================================================================
// CUSTOM HOOK IMPLEMENTATION
// =============================================================================

/**
 * Custom React hook for fetching system events using TanStack React Query
 * 
 * Migrates Angular systemEventsResolver to React Query-powered implementation
 * with intelligent caching, background revalidation, and comprehensive error handling.
 * 
 * Features:
 * - Automatic caching with configurable stale/cache times
 * - Background revalidation for data consistency
 * - Retry strategies with exponential backoff
 * - TypeScript type safety with GenericListResponse<string>
 * - Integration with database service configuration
 * - Query key management for cache invalidation
 * 
 * @param options - Optional configuration to override default query behavior
 * @returns UseQueryResult with system events data, loading states, and error information
 * 
 * @example
 * ```typescript
 * // Basic usage with default configuration
 * const { data: systemEvents, isLoading, error } = useSystemEvents();
 * 
 * // With custom configuration
 * const { data: systemEvents, isLoading, error, refetch } = useSystemEvents({
 *   enabled: true,
 *   staleTime: 10 * 60 * 1000, // 10 minutes
 *   refetchOnWindowFocus: false,
 * });
 * 
 * // Accessing system events data
 * if (systemEvents?.resource) {
 *   const eventNames = systemEvents.resource; // string[]
 *   const eventCount = systemEvents.meta.count; // number
 * }
 * ```
 */
export const useSystemEvents = (
  options: SystemEventsQueryOptions = {}
): UseQueryResult<GenericListResponse<string>, Error> => {
  // Extract configuration from database service constants
  const defaultConfig = DATABASE_SERVICE_REACT_QUERY_CONFIG.queryConfigs.serviceList;
  
  // Merge user options with intelligent defaults
  const queryOptions = {
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? defaultConfig.staleTime,
    cacheTime: options.cacheTime ?? defaultConfig.cacheTime,
    retry: options.retry ?? DATABASE_SERVICE_REACT_QUERY_CONFIG.defaultOptions.queries.retry,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? defaultConfig.refetchOnWindowFocus,
    refetchOnReconnect: options.refetchOnReconnect ?? DATABASE_SERVICE_REACT_QUERY_CONFIG.defaultOptions.queries.refetchOnReconnect,
    // Enhanced retry configuration with exponential backoff
    retryDelay: DATABASE_SERVICE_REACT_QUERY_CONFIG.defaultOptions.queries.retryDelay,
  };

  // System events request parameters matching original resolver
  const requestParams: SystemEventsRequestParams = {
    as_list: true,
  };

  return useQuery({
    // Generate consistent query key for effective caching
    queryKey: systemEventsKeys.listWithParams(requestParams),
    
    // Query function with error handling and type safety
    queryFn: () => fetchSystemEvents(requestParams),
    
    // Apply configuration options
    enabled: queryOptions.enabled,
    staleTime: queryOptions.staleTime,
    cacheTime: queryOptions.cacheTime,
    retry: queryOptions.retry,
    retryDelay: queryOptions.retryDelay,
    refetchOnWindowFocus: queryOptions.refetchOnWindowFocus,
    refetchOnReconnect: queryOptions.refetchOnReconnect,
    
    // Enhance error handling with structured error information
    onError: (error: Error) => {
      console.error('System events query failed:', {
        message: error.message,
        timestamp: new Date().toISOString(),
        queryKey: systemEventsKeys.listWithParams(requestParams),
        requestParams,
      });
    },
    
    // Optional success callback for debugging and analytics
    onSuccess: (data: GenericListResponse<string>) => {
      console.debug('System events loaded successfully:', {
        eventCount: data.meta.count,
        resourceLength: data.resource.length,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Export query key factory for use in cache invalidation
 * Enables other components to invalidate system events cache when needed
 */
export { systemEventsKeys };

/**
 * Export types for external usage
 */
export type { 
  SystemEventsQueryOptions, 
  SystemEventsRequestParams,
  GenericListResponse 
};

/**
 * Default export for convenient importing
 */
export default useSystemEvents;