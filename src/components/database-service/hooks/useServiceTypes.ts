/**
 * Database Service Types Hook
 * 
 * Custom React hook for fetching service types with optional group-based filtering using TanStack React Query.
 * Provides intelligent caching for ServiceType arrays with support for parallel fetching when multiple groups
 * are specified. Implements automatic background revalidation and cache optimization for service type metadata
 * used throughout the database service components.
 * 
 * @fileoverview React Query-powered custom hook converted from Angular serviceTypesResolver
 * @version 1.0.0
 * @since 2024-01-01
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import type { ServiceType, GenericListResponse } from '../types';
import { DATABASE_SERVICE_REACT_QUERY_CONFIG, DATABASE_SERVICE_ENDPOINTS } from '../constants';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Parameters for the useServiceTypes hook
 */
export interface UseServiceTypesParams {
  /**
   * Optional array of service group names to filter by.
   * When provided, fetches service types in parallel for each group.
   * When undefined, fetches all service types.
   */
  groups?: string[];
  
  /**
   * Enable or disable the query.
   * Useful for conditional data fetching.
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Custom stale time override for service type caching.
   * Defaults to configuration value.
   */
  staleTime?: number;
  
  /**
   * Custom cache time override for service type caching.
   * Defaults to configuration value.
   */
  cacheTime?: number;
}

/**
 * Return type for the useServiceTypes hook
 */
export interface UseServiceTypesReturn {
  /**
   * Flattened array of service types from the API response
   */
  serviceTypes: ServiceType[];
  
  /**
   * Loading state indicating if the query is currently fetching
   */
  isLoading: boolean;
  
  /**
   * Error state if the query failed
   */
  error: Error | null;
  
  /**
   * Function to manually refetch the service types
   */
  refetch: () => void;
  
  /**
   * Indicates if the data is stale and being refetched in the background
   */
  isRefetching: boolean;
  
  /**
   * Indicates if this is the first fetch (no cached data available)
   */
  isFetching: boolean;
  
  /**
   * Success state indicating if the query completed successfully
   */
  isSuccess: boolean;
}

// =============================================================================
// API CLIENT FUNCTIONS
// =============================================================================

/**
 * Fetches service types for a specific group from the DreamFactory API
 * 
 * @param group - Service group name to filter by
 * @returns Promise resolving to GenericListResponse<ServiceType>
 */
const fetchServiceTypesForGroup = async (group: string): Promise<GenericListResponse<ServiceType>> => {
  const url = new URL(DATABASE_SERVICE_ENDPOINTS.SERVICE_TYPE, window.location.origin);
  url.searchParams.set('group', group);
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // TODO: Add authentication headers when auth system is integrated
      // 'X-DreamFactory-Api-Key': apiKey,
      // 'X-DreamFactory-Session-Token': sessionToken,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch service types for group ${group}: ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Fetches all service types from the DreamFactory API
 * 
 * @returns Promise resolving to GenericListResponse<ServiceType>
 */
const fetchAllServiceTypes = async (): Promise<GenericListResponse<ServiceType>> => {
  const url = new URL(DATABASE_SERVICE_ENDPOINTS.SERVICE_TYPE, window.location.origin);
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // TODO: Add authentication headers when auth system is integrated
      // 'X-DreamFactory-Api-Key': apiKey,
      // 'X-DreamFactory-Session-Token': sessionToken,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch service types: ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Fetches service types with optional group filtering and parallel execution
 * 
 * @param groups - Optional array of group names for parallel fetching
 * @returns Promise resolving to flattened ServiceType array
 */
const fetchServiceTypes = async (groups?: string[]): Promise<ServiceType[]> => {
  if (groups && groups.length > 0) {
    // Parallel fetching for multiple groups
    const promises = groups.map(group => fetchServiceTypesForGroup(group));
    const responses = await Promise.all(promises);
    
    // Flatten the responses into a single array
    return responses.flatMap(response => response.resource);
  }
  
  // Fetch all service types when no groups specified
  const response = await fetchAllServiceTypes();
  return response.resource;
};

// =============================================================================
// REACT QUERY CONFIGURATION
// =============================================================================

/**
 * Generates React Query key for service types caching
 * 
 * @param groups - Optional groups array for cache key differentiation
 * @returns Query key array for React Query
 */
const getServiceTypesQueryKey = (groups?: string[]) => {
  if (groups && groups.length > 0) {
    return ['database-service-types', { groups: groups.sort() }] as const;
  }
  return ['database-service-types', 'all'] as const;
};

// =============================================================================
// CUSTOM HOOK IMPLEMENTATION
// =============================================================================

/**
 * Custom React hook for fetching service types with React Query
 * 
 * Converts the Angular serviceTypesResolver to a React Query-powered hook with:
 * - Intelligent caching with configurable stale and cache times
 * - Support for optional groups array parameter with parallel fetching
 * - Automatic background revalidation for consistency
 * - Flattened ServiceType array response matching original resolver behavior
 * - Error boundary integration for graceful failure handling
 * - TypeScript 5.8+ compatibility with strict type safety
 * 
 * @param params - Configuration parameters for the hook
 * @returns Service types data and query state
 * 
 * @example
 * ```typescript
 * // Fetch all service types
 * const { serviceTypes, isLoading, error } = useServiceTypes();
 * 
 * // Fetch specific groups in parallel
 * const { serviceTypes, isLoading } = useServiceTypes({ 
 *   groups: ['Database', 'Big Data'] 
 * });
 * 
 * // Conditional fetching
 * const { serviceTypes } = useServiceTypes({ 
 *   enabled: shouldFetch,
 *   staleTime: 10 * 60 * 1000 // 10 minutes
 * });
 * ```
 */
export const useServiceTypes = (params: UseServiceTypesParams = {}): UseServiceTypesReturn => {
  const {
    groups,
    enabled = true,
    staleTime = DATABASE_SERVICE_REACT_QUERY_CONFIG.queryConfigs.serviceList.staleTime,
    cacheTime = DATABASE_SERVICE_REACT_QUERY_CONFIG.queryConfigs.serviceList.cacheTime,
  } = params;

  const queryKey = getServiceTypesQueryKey(groups);

  const queryResult: UseQueryResult<ServiceType[], Error> = useQuery({
    queryKey,
    queryFn: () => fetchServiceTypes(groups),
    enabled,
    staleTime,
    cacheTime,
    retry: DATABASE_SERVICE_REACT_QUERY_CONFIG.defaultOptions.queries.retry,
    retryDelay: DATABASE_SERVICE_REACT_QUERY_CONFIG.defaultOptions.queries.retryDelay,
    refetchOnWindowFocus: DATABASE_SERVICE_REACT_QUERY_CONFIG.queryConfigs.serviceList.refetchOnWindowFocus,
    refetchOnReconnect: DATABASE_SERVICE_REACT_QUERY_CONFIG.defaultOptions.queries.refetchOnReconnect,
    onError: (error: Error) => {
      console.error('Failed to fetch service types:', error);
      // TODO: Integrate with error reporting service when available
      // errorReportingService.captureError(error, { context: 'useServiceTypes', groups });
    },
  });

  return {
    serviceTypes: queryResult.data ?? [],
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    refetch: queryResult.refetch,
    isRefetching: queryResult.isRefetching,
    isFetching: queryResult.isFetching,
    isSuccess: queryResult.isSuccess,
  };
};

// =============================================================================
// EXPORTED UTILITIES
// =============================================================================

/**
 * Utility function to invalidate service types cache
 * Useful for cache management after service type modifications
 * 
 * @param queryClient - React Query client instance
 * @param groups - Optional groups to invalidate specific cache entries
 */
export const invalidateServiceTypesCache = async (
  queryClient: any, // TODO: Import QueryClient type when available
  groups?: string[]
): Promise<void> => {
  const queryKey = getServiceTypesQueryKey(groups);
  await queryClient.invalidateQueries({ queryKey });
};

/**
 * Utility function to prefetch service types
 * Useful for optimistic loading scenarios
 * 
 * @param queryClient - React Query client instance
 * @param groups - Optional groups to prefetch
 */
export const prefetchServiceTypes = async (
  queryClient: any, // TODO: Import QueryClient type when available
  groups?: string[]
): Promise<void> => {
  const queryKey = getServiceTypesQueryKey(groups);
  
  await queryClient.prefetchQuery({
    queryKey,
    queryFn: () => fetchServiceTypes(groups),
    staleTime: DATABASE_SERVICE_REACT_QUERY_CONFIG.queryConfigs.serviceList.staleTime,
    cacheTime: DATABASE_SERVICE_REACT_QUERY_CONFIG.queryConfigs.serviceList.cacheTime,
  });
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default useServiceTypes;