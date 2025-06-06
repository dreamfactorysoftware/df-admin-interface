/**
 * Custom React Hook for Service Types Data Fetching
 * 
 * Provides intelligent caching and background revalidation for ServiceType arrays
 * with optional group-based filtering using TanStack React Query. Implements 
 * parallel fetching capabilities when multiple groups are specified and maintains
 * backward compatibility with Angular serviceTypesResolver patterns.
 * 
 * @fileoverview Service types fetching hook with React Query integration
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import { useQuery, useQueries, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { ServiceType } from '../types';
import { GenericListResponse } from '../../../types/generic-http';
import { getReactQueryConfig } from '../constants';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Hook configuration options extending React Query configuration
 */
export interface UseServiceTypesOptions {
  /** Array of service type groups to filter by */
  groups?: string[];
  
  /** Enable or disable the query */
  enabled?: boolean;
  
  /** Custom stale time override (default: 5 minutes) */
  staleTime?: number;
  
  /** Custom cache time override (default: 10 minutes) */
  cacheTime?: number;
  
  /** Enable background refetching on window focus */
  refetchOnWindowFocus?: boolean;
  
  /** Enable background refetching on reconnect */
  refetchOnReconnect?: boolean;
  
  /** Retry configuration for failed requests */
  retry?: number | boolean;
  
  /** Custom error retry delay function */
  retryDelay?: (failureCount: number, error: Error) => number;
}

/**
 * Hook return value interface
 */
export interface UseServiceTypesReturn {
  /** Flattened array of service types */
  data: ServiceType[] | undefined;
  
  /** Loading state indicator */
  isLoading: boolean;
  
  /** Error state */
  error: Error | null;
  
  /** Success state indicator */
  isSuccess: boolean;
  
  /** Error state indicator */
  isError: boolean;
  
  /** Data fetching state indicator */
  isFetching: boolean;
  
  /** Stale data indicator */
  isStale: boolean;
  
  /** Background refetching indicator */
  isRefetching: boolean;
  
  /** Manual refetch function */
  refetch: () => Promise<UseQueryResult<ServiceType[], Error>>;
  
  /** Invalidate and refetch the query */
  invalidate: () => Promise<void>;
}

// =============================================================================
// QUERY KEY FACTORIES
// =============================================================================

/**
 * Query key factory for service types queries
 * Provides consistent and hierarchical cache key structure
 */
const serviceTypeQueryKeys = {
  /** Base key for all service type queries */
  all: ['service-types'] as const,
  
  /** All service types without filtering */
  allTypes: () => [...serviceTypeQueryKeys.all, 'all'] as const,
  
  /** Service types filtered by groups */
  byGroups: (groups: string[]) => [...serviceTypeQueryKeys.all, 'groups', ...groups.sort()] as const,
  
  /** Individual group query */
  group: (group: string) => [...serviceTypeQueryKeys.all, 'group', group] as const,
};

// =============================================================================
// API FETCHER FUNCTIONS
// =============================================================================

/**
 * Fetch all service types without filtering
 * 
 * @returns Promise resolving to array of ServiceType objects
 */
const fetchAllServiceTypes = async (): Promise<ServiceType[]> => {
  try {
    const response = await apiClient.get<GenericListResponse<ServiceType>>('/system/service_type');
    
    // Handle both direct resource and nested resource responses
    if (response.resource) {
      return response.resource;
    }
    
    if (response.data?.resource) {
      return response.data.resource;
    }
    
    // Fallback for direct array response
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch service types:', error);
    throw new Error(
      error instanceof Error 
        ? `Service types fetch failed: ${error.message}`
        : 'Failed to fetch service types'
    );
  }
};

/**
 * Fetch service types filtered by a specific group
 * 
 * @param group - Service type group to filter by
 * @returns Promise resolving to array of ServiceType objects for the group
 */
const fetchServiceTypesByGroup = async (group: string): Promise<ServiceType[]> => {
  try {
    const response = await apiClient.get<GenericListResponse<ServiceType>>(
      '/system/service_type',
      {
        headers: {
          'X-Filter': `group="${group}"`,
        },
      }
    );
    
    // Handle both direct resource and nested resource responses
    if (response.resource) {
      return response.resource;
    }
    
    if (response.data?.resource) {
      return response.data.resource;
    }
    
    // Fallback for direct array response
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error(`Failed to fetch service types for group "${group}":`, error);
    throw new Error(
      error instanceof Error 
        ? `Service types fetch failed for group "${group}": ${error.message}`
        : `Failed to fetch service types for group "${group}"`
    );
  }
};

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Custom React hook for fetching service types with intelligent caching
 * 
 * Provides TanStack React Query integration for ServiceType data fetching with
 * support for optional group-based filtering. Implements parallel fetching when
 * multiple groups are specified and maintains compatibility with the original
 * Angular serviceTypesResolver functionality.
 * 
 * @param options - Configuration options for the hook
 * @returns Hook return object with data, loading states, and control functions
 * 
 * @example
 * ```typescript
 * // Fetch all service types
 * const { data: allTypes, isLoading } = useServiceTypes();
 * 
 * // Fetch specific groups with parallel fetching
 * const { data: dbTypes } = useServiceTypes({
 *   groups: ['SQL Databases', 'NoSQL Databases']
 * });
 * 
 * // Custom configuration
 * const { data, refetch } = useServiceTypes({
 *   groups: ['Cloud Databases'],
 *   staleTime: 10 * 60 * 1000, // 10 minutes
 *   enabled: shouldFetch
 * });
 * ```
 */
export function useServiceTypes(options: UseServiceTypesOptions = {}): UseServiceTypesReturn {
  const {
    groups,
    enabled = true,
    staleTime,
    cacheTime,
    refetchOnWindowFocus,
    refetchOnReconnect,
    retry,
    retryDelay,
  } = options;

  // Get default React Query configuration
  const defaultConfig = getReactQueryConfig('serviceConfig');
  
  // Determine if we should use parallel fetching for multiple groups
  const shouldUseParallelFetching = groups && groups.length > 0;

  // =============================================================================
  // SINGLE QUERY (ALL SERVICE TYPES OR NO GROUPS)
  // =============================================================================
  
  const singleQuery = useQuery({
    queryKey: shouldUseParallelFetching ? [] : serviceTypeQueryKeys.allTypes(),
    queryFn: fetchAllServiceTypes,
    enabled: enabled && !shouldUseParallelFetching,
    staleTime: staleTime ?? defaultConfig.staleTime,
    cacheTime: cacheTime ?? defaultConfig.cacheTime,
    refetchOnWindowFocus: refetchOnWindowFocus ?? defaultConfig.refetchOnWindowFocus,
    refetchOnReconnect: refetchOnReconnect ?? defaultConfig.refetchOnReconnect,
    retry: retry ?? 3,
    retryDelay: retryDelay ?? ((attemptIndex: number) => 
      Math.min(1000 * 2 ** attemptIndex, 30000)
    ),
  });

  // =============================================================================
  // PARALLEL QUERIES (MULTIPLE GROUPS)
  // =============================================================================
  
  const parallelQueries = useQueries({
    queries: shouldUseParallelFetching 
      ? groups!.map((group) => ({
          queryKey: serviceTypeQueryKeys.group(group),
          queryFn: () => fetchServiceTypesByGroup(group),
          enabled: enabled,
          staleTime: staleTime ?? defaultConfig.staleTime,
          cacheTime: cacheTime ?? defaultConfig.cacheTime,
          refetchOnWindowFocus: refetchOnWindowFocus ?? defaultConfig.refetchOnWindowFocus,
          refetchOnReconnect: refetchOnReconnect ?? defaultConfig.refetchOnReconnect,
          retry: retry ?? 3,
          retryDelay: retryDelay ?? ((attemptIndex: number) => 
            Math.min(1000 * 2 ** attemptIndex, 30000)
          ),
        }))
      : [],
  });

  // =============================================================================
  // RESULT COMPUTATION AND STATE MANAGEMENT
  // =============================================================================
  
  let data: ServiceType[] | undefined;
  let isLoading: boolean;
  let error: Error | null;
  let isSuccess: boolean;
  let isError: boolean;
  let isFetching: boolean;
  let isStale: boolean;
  let isRefetching: boolean;

  if (shouldUseParallelFetching) {
    // Aggregate results from parallel queries
    isLoading = parallelQueries.some(query => query.isLoading);
    isError = parallelQueries.some(query => query.isError);
    isSuccess = parallelQueries.every(query => query.isSuccess);
    isFetching = parallelQueries.some(query => query.isFetching);
    isStale = parallelQueries.some(query => query.isStale);
    isRefetching = parallelQueries.some(query => query.isRefetching);
    
    // Get first error encountered
    error = parallelQueries.find(query => query.error)?.error ?? null;
    
    // Flatten all successful results into a single array
    if (isSuccess && parallelQueries.length > 0) {
      data = parallelQueries
        .map(query => query.data ?? [])
        .flat()
        .filter((serviceType, index, array) => {
          // Remove duplicates by name (in case same service type appears in multiple groups)
          return array.findIndex(st => st.name === serviceType.name) === index;
        });
    }
  } else {
    // Use single query results
    data = singleQuery.data;
    isLoading = singleQuery.isLoading;
    error = singleQuery.error;
    isSuccess = singleQuery.isSuccess;
    isError = singleQuery.isError;
    isFetching = singleQuery.isFetching;
    isStale = singleQuery.isStale;
    isRefetching = singleQuery.isRefetching;
  }

  // =============================================================================
  // CONTROL FUNCTIONS
  // =============================================================================
  
  /**
   * Manual refetch function that works for both single and parallel queries
   */
  const refetch = async (): Promise<UseQueryResult<ServiceType[], Error>> => {
    if (shouldUseParallelFetching) {
      // Refetch all parallel queries
      await Promise.all(parallelQueries.map(query => query.refetch()));
      
      // Return aggregated result in compatible format
      return {
        data: data ?? [],
        error: error,
        isLoading,
        isSuccess,
        isError,
        isFetching,
        isStale,
        isRefetching,
      } as UseQueryResult<ServiceType[], Error>;
    } else {
      return singleQuery.refetch();
    }
  };

  /**
   * Invalidate and refetch the appropriate queries
   */
  const invalidate = async (): Promise<void> => {
    const { queryClient } = await import('@tanstack/react-query');
    
    if (shouldUseParallelFetching) {
      // Invalidate all group-specific queries
      await Promise.all(
        groups!.map(group => 
          queryClient.invalidateQueries({ 
            queryKey: serviceTypeQueryKeys.group(group) 
          })
        )
      );
    } else {
      // Invalidate the all types query
      await queryClient.invalidateQueries({ 
        queryKey: serviceTypeQueryKeys.allTypes() 
      });
    }
  };

  // =============================================================================
  // RETURN HOOK RESULT
  // =============================================================================
  
  return {
    data,
    isLoading,
    error,
    isSuccess,
    isError,
    isFetching,
    isStale,
    isRefetching,
    refetch,
    invalidate,
  };
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Export query key factory for external cache management
 */
export { serviceTypeQueryKeys };

/**
 * Export fetcher functions for advanced usage
 */
export { fetchAllServiceTypes, fetchServiceTypesByGroup };

/**
 * Type exports for external usage
 */
export type { UseServiceTypesOptions, UseServiceTypesReturn };