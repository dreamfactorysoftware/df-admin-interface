'use client';

import { useQuery, useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useApi } from '../../../hooks/use-api';
import type { ServiceType } from '../../../types/services';
import type { ApiListResponse } from '../../../types/api';

/**
 * Configuration options for service types query
 */
export interface UseServiceTypesOptions {
  /** Array of service type groups to filter by */
  groups?: string[];
  /** Whether to enable the query (default: true) */
  enabled?: boolean;
  /** Custom stale time in milliseconds (default: 300000 - 5 minutes) */
  staleTime?: number;
  /** Custom cache time in milliseconds (default: 900000 - 15 minutes) */
  cacheTime?: number;
  /** Custom select function to transform data */
  select?: (data: ServiceType[]) => any;
  /** Whether to refetch on window focus (default: false) */
  refetchOnWindowFocus?: boolean;
  /** Background refetch interval in milliseconds */
  refetchInterval?: number;
}

/**
 * React Query-based custom hook that fetches ServiceType entities with intelligent caching.
 * 
 * This hook replaces the Angular serviceTypesResolver by implementing parallel queries for 
 * multiple groups using React Query's useQueries, with TTL configuration for optimal performance.
 * Supports both filtered group-based requests and unfiltered requests, maintaining the same 
 * data fetching logic as the original resolver.
 * 
 * Features:
 * - React Query-powered service management with intelligent caching
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * - TanStack React Query 5.79.2 for complex server-state management
 * - Database Service Management feature F-001 requiring service type enumeration
 * - TTL configuration with staleTime: 300 seconds and cacheTime: 900 seconds
 * - Parallel query execution for multiple groups with automatic data flattening
 * - Support for optional group filtering with React Query select functions
 * 
 * @param options - Configuration options for the service types query
 * @returns Query result with service types data, loading states, and error handling
 * 
 * @example
 * // Basic usage - fetch all service types
 * const { data: serviceTypes, isLoading, error } = useServiceTypes();
 * 
 * @example
 * // Filtered usage - fetch specific groups
 * const { data: databaseServices } = useServiceTypes({ 
 *   groups: ['database', 'cache'] 
 * });
 * 
 * @example
 * // Custom configuration with data transformation
 * const { data: serviceNames } = useServiceTypes({
 *   groups: ['database'],
 *   select: (types) => types.map(type => type.name),
 *   staleTime: 10 * 60 * 1000, // 10 minutes
 * });
 */
export function useServiceTypes(options: UseServiceTypesOptions = {}) {
  const {
    groups,
    enabled = true,
    staleTime = 300000, // 5 minutes (300 seconds)
    cacheTime = 900000, // 15 minutes (900 seconds)
    select,
    refetchOnWindowFocus = false,
    refetchInterval,
  } = options;

  // Initialize API client for service type endpoints
  const api = useApi('/api/v2/system');

  // Memoize query keys to prevent unnecessary re-renders
  const queryKeys = useMemo(() => {
    if (groups && groups.length > 0) {
      // Create separate query keys for each group
      return groups.map(group => [
        'service-types',
        'group',
        group,
        { additionalParams: [{ key: 'group', value: group }] }
      ]);
    }
    // Single query key for unfiltered request
    return [['service-types', 'all', {}]];
  }, [groups]);

  // Handle multiple group queries using useQueries for parallel execution
  const groupQueries = useQueries({
    queries: groups && groups.length > 0 ? 
      queryKeys.map((queryKey, index) => ({
        queryKey,
        queryFn: () => api.apiRequest<ApiListResponse<ServiceType>>(
          '/service_type',
          {
            method: 'GET',
            params: {
              group: groups[index]
            }
          },
          {
            snackbarError: 'server',
            includeAuth: true,
          }
        ),
        enabled,
        staleTime,
        cacheTime,
        refetchOnWindowFocus,
        refetchInterval,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      })) : [],
  });

  // Handle single unfiltered query
  const singleQuery = useQuery({
    queryKey: queryKeys[0],
    queryFn: () => api.apiRequest<ApiListResponse<ServiceType>>(
      '/service_type',
      {
        method: 'GET',
      },
      {
        snackbarError: 'server',
        includeAuth: true,
      }
    ),
    enabled: enabled && (!groups || groups.length === 0),
    staleTime,
    cacheTime,
    refetchOnWindowFocus,
    refetchInterval,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Process and flatten results from multiple group queries
  const processedResult = useMemo(() => {
    if (groups && groups.length > 0) {
      // Handle multiple group queries
      const allLoading = groupQueries.some(query => query.isLoading);
      const allErrors = groupQueries.map(query => query.error).filter(Boolean);
      const hasError = allErrors.length > 0;
      
      // Flatten and combine data from all group queries
      const flattenedData = groupQueries
        .map(query => query.data?.resource || [])
        .flat();

      // Apply custom select function if provided
      const selectedData = select ? select(flattenedData) : flattenedData;

      return {
        data: selectedData,
        isLoading: allLoading,
        error: hasError ? allErrors[0] : null,
        isError: hasError,
        isSuccess: !allLoading && !hasError && groupQueries.every(query => query.isSuccess),
        isFetching: groupQueries.some(query => query.isFetching),
        isStale: groupQueries.some(query => query.isStale),
        dataUpdatedAt: Math.max(...groupQueries.map(query => query.dataUpdatedAt || 0)),
        errorUpdatedAt: Math.max(...groupQueries.map(query => query.errorUpdatedAt || 0)),
        refetch: () => Promise.all(groupQueries.map(query => query.refetch())),
        remove: () => groupQueries.forEach(query => query.remove()),
      };
    } else {
      // Handle single unfiltered query
      const selectedData = select && singleQuery.data?.resource ? 
        select(singleQuery.data.resource) : 
        singleQuery.data?.resource;

      return {
        data: selectedData,
        isLoading: singleQuery.isLoading,
        error: singleQuery.error,
        isError: singleQuery.isError,
        isSuccess: singleQuery.isSuccess,
        isFetching: singleQuery.isFetching,
        isStale: singleQuery.isStale,
        dataUpdatedAt: singleQuery.dataUpdatedAt,
        errorUpdatedAt: singleQuery.errorUpdatedAt,
        refetch: singleQuery.refetch,
        remove: singleQuery.remove,
      };
    }
  }, [groups, groupQueries, singleQuery, select]);

  // Additional query metadata for debugging and monitoring
  const queryMetadata = useMemo(() => ({
    // Query configuration
    config: {
      groups,
      enabled,
      staleTime,
      cacheTime,
      hasSelect: !!select,
      refetchOnWindowFocus,
      refetchInterval,
    },
    // Query statistics
    stats: {
      queryCount: groups && groups.length > 0 ? groups.length : 1,
      totalQueries: groups && groups.length > 0 ? groupQueries.length : 1,
      cacheHits: groups && groups.length > 0 ? 
        groupQueries.filter(query => query.status === 'success' && !query.isFetching).length : 
        (singleQuery.status === 'success' && !singleQuery.isFetching ? 1 : 0),
      errors: groups && groups.length > 0 ? 
        groupQueries.filter(query => query.isError).length : 
        (singleQuery.isError ? 1 : 0),
    },
    // Cache status
    cache: {
      isStale: processedResult.isStale,
      lastUpdate: new Date(processedResult.dataUpdatedAt || 0).toISOString(),
      nextRefresh: processedResult.dataUpdatedAt ? 
        new Date(processedResult.dataUpdatedAt + staleTime).toISOString() : null,
    },
  }), [
    groups, enabled, staleTime, cacheTime, select, refetchOnWindowFocus, refetchInterval,
    groupQueries, singleQuery, processedResult.isStale, processedResult.dataUpdatedAt
  ]);

  return {
    ...processedResult,
    // Additional metadata for debugging and monitoring
    _metadata: queryMetadata,
  };
}

/**
 * Factory function to create a pre-configured service types hook for specific groups
 * 
 * @param defaultGroups - Default groups to filter by
 * @param defaultOptions - Default configuration options
 * @returns Configured hook function
 * 
 * @example
 * // Create a specialized hook for database services
 * const useDatabaseServiceTypes = createServiceTypesHook(['database', 'cache']);
 * 
 * // Use the specialized hook
 * const { data: dbTypes } = useDatabaseServiceTypes();
 */
export function createServiceTypesHook(
  defaultGroups?: string[],
  defaultOptions?: Partial<UseServiceTypesOptions>
) {
  return function useSpecializedServiceTypes(options: UseServiceTypesOptions = {}) {
    return useServiceTypes({
      groups: defaultGroups,
      ...defaultOptions,
      ...options,
      // Merge groups if both default and options specify them
      groups: options.groups || defaultGroups,
    });
  };
}

/**
 * Pre-configured hooks for common service type groups
 */

/** Hook for database service types only */
export const useDatabaseServiceTypes = createServiceTypesHook(['database']);

/** Hook for authentication service types only */
export const useAuthServiceTypes = createServiceTypesHook(['oauth', 'ldap', 'saml']);

/** Hook for file service types only */
export const useFileServiceTypes = createServiceTypesHook(['file']);

/** Hook for email service types only */
export const useEmailServiceTypes = createServiceTypesHook(['email']);

/**
 * Type definitions for hook return value
 */
export type UseServiceTypesResult<T = ServiceType[]> = {
  /** Service types data (flattened array from all groups) */
  data: T | undefined;
  /** Whether any query is currently loading */
  isLoading: boolean;
  /** First error encountered from any query */
  error: Error | null;
  /** Whether any query has an error */
  isError: boolean;
  /** Whether all queries are successful */
  isSuccess: boolean;
  /** Whether any query is currently fetching */
  isFetching: boolean;
  /** Whether any query has stale data */
  isStale: boolean;
  /** Timestamp of most recent successful data update */
  dataUpdatedAt: number;
  /** Timestamp of most recent error */
  errorUpdatedAt: number;
  /** Refetch all queries */
  refetch: () => Promise<any>;
  /** Remove all queries from cache */
  remove: () => void;
  /** Query metadata for debugging and monitoring */
  _metadata: {
    config: {
      groups?: string[];
      enabled: boolean;
      staleTime: number;
      cacheTime: number;
      hasSelect: boolean;
      refetchOnWindowFocus: boolean;
      refetchInterval?: number;
    };
    stats: {
      queryCount: number;
      totalQueries: number;
      cacheHits: number;
      errors: number;
    };
    cache: {
      isStale: boolean;
      lastUpdate: string;
      nextRefresh: string | null;
    };
  };
};

/**
 * Default export for convenience
 */
export default useServiceTypes;