/**
 * React Query-based Service Types Hook for DreamFactory Admin Interface
 * 
 * This hook replaces the Angular serviceTypesResolver by implementing parallel queries
 * for multiple groups using React Query's useQueries, with TTL configuration 
 * (staleTime: 300s, cacheTime: 900s) for optimal performance.
 * 
 * Supports both filtered group-based requests and unfiltered requests, maintaining
 * the same data fetching logic as the original Angular resolver.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { useQueries, useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ServiceTypeDefinition } from '@/types/services';
import type { ApiListResponse } from '@/types/api';

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

/**
 * Cache configuration per Section 5.2 Schema Discovery Component requirements
 * - staleTime: 300 seconds (5 minutes) - data considered fresh for 5 minutes
 * - cacheTime: 900 seconds (15 minutes) - data kept in cache for 15 minutes
 */
const CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000,  // 300 seconds
  cacheTime: 15 * 60 * 1000, // 900 seconds (React Query v4 compatible)
} as const;

/**
 * Query key factory for service types
 * Ensures consistent cache management across the application
 */
export const serviceTypeQueryKeys = {
  all: ['service-types'] as const,
  lists: () => [...serviceTypeQueryKeys.all, 'list'] as const,
  byGroup: (group: string) => [...serviceTypeQueryKeys.lists(), 'group', group] as const,
  allGroups: (groups: string[]) => [...serviceTypeQueryKeys.lists(), 'groups', groups.sort()] as const,
} as const;

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Service types hook parameters
 */
export interface UseServiceTypesParams {
  /**
   * Optional array of groups to filter service types
   * When provided, parallel queries are executed for each group
   */
  groups?: string[];
  
  /**
   * Whether the query should be enabled
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Additional query options to override defaults
   */
  queryOptions?: {
    staleTime?: number;
    cacheTime?: number;
    refetchOnMount?: boolean;
    refetchOnWindowFocus?: boolean;
    refetchOnReconnect?: boolean;
  };
}

/**
 * Service types hook return type
 */
export interface UseServiceTypesResult {
  /**
   * Array of service type definitions
   */
  data: ServiceTypeDefinition[] | undefined;
  
  /**
   * Loading state - true when any query is loading
   */
  isLoading: boolean;
  
  /**
   * Error state - contains error if any query failed
   */
  error: Error | null;
  
  /**
   * Success state - true when all queries have succeeded
   */
  isSuccess: boolean;
  
  /**
   * Fetching state - true when any query is fetching (including background refetch)
   */
  isFetching: boolean;
  
  /**
   * Refetch function to manually trigger data refresh
   */
  refetch: () => void;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetches service types from DreamFactory API
 * Maintains compatibility with existing backend endpoints
 */
async function fetchServiceTypes(): Promise<ServiceTypeDefinition[]> {
  try {
    const response = await apiClient.get('/system/service_type');
    const listResponse = response as ApiListResponse<ServiceTypeDefinition>;
    return listResponse.resource || [];
  } catch (error) {
    console.error('Failed to fetch service types:', error);
    throw new Error('Failed to fetch service types');
  }
}

/**
 * Fetches service types filtered by group
 * Uses DreamFactory's group filtering capability
 */
async function fetchServiceTypesByGroup(group: string): Promise<ServiceTypeDefinition[]> {
  try {
    const response = await apiClient.get('/system/service_type', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Add group parameter via URL search params since apiClient.get doesn't support params yet
    const url = new URL(`/system/service_type`, window.location.origin);
    url.searchParams.set('group', group);
    
    const groupResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!groupResponse.ok) {
      throw new Error(`Failed to fetch service types for group ${group}: ${groupResponse.statusText}`);
    }
    
    const listResponse = await groupResponse.json() as ApiListResponse<ServiceTypeDefinition>;
    return listResponse.resource || [];
  } catch (error) {
    console.error(`Failed to fetch service types for group ${group}:`, error);
    throw new Error(`Failed to fetch service types for group ${group}`);
  }
}

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * React Query hook for fetching service types with intelligent caching
 * 
 * Replaces the Angular serviceTypesResolver by implementing:
 * - Parallel queries for multiple groups using React Query's useQueries
 * - Single query for unfiltered requests
 * - TTL configuration (staleTime: 300s, cacheTime: 900s)
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * 
 * @param params - Hook parameters including optional groups array
 * @returns Service types data with loading states and error handling
 * 
 * @example
 * ```typescript
 * // Fetch all service types
 * const { data, isLoading, error } = useServiceTypes();
 * 
 * // Fetch service types for specific groups
 * const { data, isLoading, error } = useServiceTypes({
 *   groups: ['Database', 'Remote Service']
 * });
 * 
 * // With custom options
 * const { data, isLoading, error } = useServiceTypes({
 *   groups: ['Database'],
 *   enabled: isAuthenticated,
 *   queryOptions: {
 *     staleTime: 10 * 60 * 1000 // 10 minutes
 *   }
 * });
 * ```
 */
export function useServiceTypes(params: UseServiceTypesParams = {}): UseServiceTypesResult {
  const {
    groups,
    enabled = true,
    queryOptions = {},
  } = params;

  // Merge user options with default cache configuration
  const mergedOptions = {
    ...CACHE_CONFIG,
    ...queryOptions,
    enabled,
    // Performance optimizations per React/Next.js Integration Requirements
    refetchOnMount: queryOptions.refetchOnMount ?? false,
    refetchOnWindowFocus: queryOptions.refetchOnWindowFocus ?? false,
    refetchOnReconnect: queryOptions.refetchOnReconnect ?? true,
  };

  // Use parallel queries for multiple groups (equivalent to Angular's forkJoin)
  const groupQueries = useQueries({
    queries: groups?.map((group) => ({
      queryKey: serviceTypeQueryKeys.byGroup(group),
      queryFn: () => fetchServiceTypesByGroup(group),
      ...mergedOptions,
    })) || [],
  });

  // Use single query for unfiltered request
  const allTypesQuery = useQuery({
    queryKey: serviceTypeQueryKeys.lists(),
    queryFn: fetchServiceTypes,
    ...mergedOptions,
    enabled: enabled && !groups, // Only enabled when no groups specified
  });

  // Handle parallel group queries results
  if (groups && groups.length > 0) {
    const isLoading = groupQueries.some(query => query.isLoading);
    const isFetching = groupQueries.some(query => query.isFetching);
    const isSuccess = groupQueries.every(query => query.isSuccess);
    const error = groupQueries.find(query => query.error)?.error || null;

    // Flatten results from all group queries (equivalent to Angular's map().flat())
    const data = isSuccess 
      ? groupQueries.map(query => query.data || []).flat()
      : undefined;

    const refetch = () => {
      groupQueries.forEach(query => query.refetch());
    };

    return {
      data,
      isLoading,
      error: error as Error | null,
      isSuccess,
      isFetching,
      refetch,
    };
  }

  // Handle single query results
  return {
    data: allTypesQuery.data,
    isLoading: allTypesQuery.isLoading,
    error: allTypesQuery.error as Error | null,
    isSuccess: allTypesQuery.isSuccess,
    isFetching: allTypesQuery.isFetching,
    refetch: allTypesQuery.refetch,
  };
}

// ============================================================================
// QUERY KEY UTILITIES
// ============================================================================

/**
 * Utility function to invalidate service types cache
 * Useful for cache management after mutations
 */
export function invalidateServiceTypesCache(queryClient: any, groups?: string[]) {
  if (groups) {
    groups.forEach(group => {
      queryClient.invalidateQueries({
        queryKey: serviceTypeQueryKeys.byGroup(group),
      });
    });
  } else {
    queryClient.invalidateQueries({
      queryKey: serviceTypeQueryKeys.all,
    });
  }
}

/**
 * Utility function to prefetch service types
 * Useful for optimistic loading before navigation
 */
export async function prefetchServiceTypes(
  queryClient: any, 
  groups?: string[]
): Promise<void> {
  const options = {
    ...CACHE_CONFIG,
    staleTime: 5 * 60 * 1000, // 5 minutes
  };

  if (groups && groups.length > 0) {
    await Promise.all(
      groups.map(group =>
        queryClient.prefetchQuery({
          queryKey: serviceTypeQueryKeys.byGroup(group),
          queryFn: () => fetchServiceTypesByGroup(group),
          ...options,
        })
      )
    );
  } else {
    await queryClient.prefetchQuery({
      queryKey: serviceTypeQueryKeys.lists(),
      queryFn: fetchServiceTypes,
      ...options,
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useServiceTypes;

export type {
  UseServiceTypesParams,
  UseServiceTypesResult,
};

export {
  serviceTypeQueryKeys,
  fetchServiceTypes,
  fetchServiceTypesByGroup,
};