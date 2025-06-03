/**
 * React Query-based App Data Fetching Hook
 * 
 * Custom hook for fetching individual AppType data with intelligent caching
 * and related data loading. Replaces the Angular edit-app.resolver.ts by
 * implementing React Query useQuery with TTL configuration and specialized
 * parameter handling for app ID extraction and role relationship loading.
 * 
 * Features:
 * - Type-safe AppType return with role relationship loading
 * - Intelligent caching with TTL configuration (staleTime: 300s, cacheTime: 900s)
 * - Automatic background revalidation for real-time updates
 * - Comprehensive field selection patterns maintaining backend compatibility
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * - Error handling with React Error Boundary integration
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client'

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { apiClient } from '../../../lib/api-client'
import type { AppType } from '../../../types/apps'
import type { GenericListResponse } from '../../../types/generic-http'

/**
 * Parameters for individual app data fetching
 */
export interface UseAppParams {
  /** App ID for fetching specific app data */
  id: string | number
  /** Additional query parameters for backend API compatibility */
  related?: string
  /** Specific fields to retrieve from the API */
  fields?: string
  /** Enable/disable the query execution */
  enabled?: boolean
}

/**
 * App query configuration with intelligent caching
 */
export interface UseAppOptions extends Omit<UseAppParams, 'id'> {
  /** Additional React Query options */
  queryOptions?: Omit<UseQueryOptions<AppType>, 'queryKey' | 'queryFn'>
}

/**
 * Query key factory for individual app data fetching
 * Ensures proper cache invalidation and deduplication with related data
 */
export const appQueryKeys = {
  all: ['apps'] as const,
  details: () => [...appQueryKeys.all, 'detail'] as const,
  detail: (id: string | number, params: Omit<UseAppParams, 'id'>) => 
    [...appQueryKeys.details(), id, params] as const,
}

/**
 * Default query parameters maintaining Angular resolver compatibility
 * Preserves role relationship loading and comprehensive field selection
 */
const DEFAULT_PARAMS: Required<Omit<UseAppParams, 'id' | 'enabled'>> = {
  related: 'role_by_role_id',
  fields: '*',
}

/**
 * Individual app data fetcher function
 * Builds query parameters and executes API request for single app
 */
const fetchApp = async (params: UseAppParams): Promise<AppType> => {
  const { id, ...queryParams } = params
  const urlParams = new URLSearchParams()

  // Build query parameters for backend API compatibility
  urlParams.append('related', queryParams.related || DEFAULT_PARAMS.related)
  urlParams.append('fields', queryParams.fields || DEFAULT_PARAMS.fields)

  const response = await apiClient.get(`/apps/${id}?${urlParams.toString()}`)
  
  // Handle both direct resource and wrapped response formats
  if (response && typeof response === 'object') {
    // If response has 'resource' property, extract the app data
    if ('resource' in response && Array.isArray(response.resource) && response.resource.length > 0) {
      return response.resource[0] as AppType
    }
    // If response is the app object directly
    if ('id' in response) {
      return response as AppType
    }
  }
  
  throw new Error('Invalid app data received from API')
}

/**
 * React Query-based custom hook for individual app data management
 * 
 * Provides intelligent caching, background synchronization, and type-safe
 * AppType return through TanStack React Query 5.79.2 with specialized
 * parameter handling for app ID extraction and role relationship loading.
 * 
 * @param id - App ID for fetching specific app data
 * @param options - Additional configuration options for query customization
 * @returns React Query result with app data, loading state, and error handling
 * 
 * @example
 * ```typescript
 * // Basic usage with app ID
 * const { data: app, isLoading, error } = useApp('123')
 * 
 * // With custom fields selection
 * const { data: app, isLoading } = useApp('456', {
 *   fields: 'id,name,description,roleByRoleId.*'
 * })
 * 
 * // With disabled query execution (conditional loading)
 * const { data: app, isLoading } = useApp(appId, {
 *   enabled: !!appId && appId !== 'new'
 * })
 * 
 * // With custom query options
 * const { data: app, refetch } = useApp('789', {
 *   queryOptions: {
 *     refetchOnWindowFocus: false,
 *     retry: 3
 *   }
 * })
 * ```
 */
export function useApp(
  id: string | number,
  options: UseAppOptions = {}
): ReturnType<typeof useQuery<AppType, Error>> {
  const {
    related,
    fields,
    enabled,
    queryOptions = {},
  } = options

  // Merge parameters with defaults
  const queryParams: UseAppParams = {
    id,
    related: related || DEFAULT_PARAMS.related,
    fields: fields || DEFAULT_PARAMS.fields,
    enabled,
  }

  return useQuery({
    // Query key for intelligent caching and deduplication
    queryKey: appQueryKeys.detail(id, {
      related: queryParams.related,
      fields: queryParams.fields,
    }),
    
    // Query function with parameter building
    queryFn: () => fetchApp(queryParams),
    
    // Intelligent caching configuration per React/Next.js Integration Requirements
    staleTime: 5 * 60 * 1000, // 300 seconds (5 minutes) - data considered fresh
    gcTime: 15 * 60 * 1000, // 900 seconds (15 minutes) - cache retention time
    
    // Background synchronization for real-time updates
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    
    // Enable/disable query execution
    enabled: queryParams.enabled !== false && !!id && id !== 'new',
    
    // Error handling and retry configuration
    retry: (failureCount, error) => {
      // Don't retry on 404 errors (app not found)
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return false
      }
      // Retry up to 3 times for other errors
      return failureCount < 3
    },
    
    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Additional query options
    ...queryOptions,
  })
}

/**
 * Prefetch function for individual app data
 * Useful for preloading app data before navigation or user interaction
 * 
 * @param queryClient - TanStack Query client instance
 * @param id - App ID for prefetching
 * @param options - Additional configuration options
 * 
 * @example
 * ```typescript
 * import { useQueryClient } from '@tanstack/react-query'
 * 
 * const queryClient = useQueryClient()
 * 
 * // Prefetch app data before navigation
 * await prefetchApp(queryClient, '123')
 * 
 * // Prefetch with custom fields
 * await prefetchApp(queryClient, '456', {
 *   fields: 'id,name,description'
 * })
 * ```
 */
export async function prefetchApp(
  queryClient: any,
  id: string | number,
  options: UseAppOptions = {}
): Promise<void> {
  const queryParams: UseAppParams = {
    id,
    related: options.related || DEFAULT_PARAMS.related,
    fields: options.fields || DEFAULT_PARAMS.fields,
  }

  await queryClient.prefetchQuery({
    queryKey: appQueryKeys.detail(id, {
      related: queryParams.related,
      fields: queryParams.fields,
    }),
    queryFn: () => fetchApp(queryParams),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Invalidate individual app cache
 * Useful for triggering data refetch after mutations or updates
 * 
 * @param queryClient - TanStack Query client instance
 * @param id - Optional app ID for specific cache invalidation
 * 
 * @example
 * ```typescript
 * // Invalidate specific app cache after update
 * await invalidateAppCache(queryClient, '123')
 * 
 * // Invalidate all app detail caches
 * await invalidateAppCache(queryClient)
 * ```
 */
export async function invalidateAppCache(
  queryClient: any,
  id?: string | number
): Promise<void> {
  if (id) {
    // Invalidate specific app detail cache
    await queryClient.invalidateQueries({
      queryKey: appQueryKeys.detail(id, {}),
      exact: false
    })
  } else {
    // Invalidate all app detail caches
    await queryClient.invalidateQueries({
      queryKey: appQueryKeys.details(),
    })
  }
}

/**
 * Remove individual app from cache
 * Useful for immediate cache cleanup after app deletion
 * 
 * @param queryClient - TanStack Query client instance
 * @param id - App ID for cache removal
 * 
 * @example
 * ```typescript
 * // Remove app from cache after deletion
 * removeAppFromCache(queryClient, '123')
 * ```
 */
export function removeAppFromCache(
  queryClient: any,
  id: string | number
): void {
  queryClient.removeQueries({
    queryKey: appQueryKeys.detail(id, {}),
    exact: false
  })
}

/**
 * Update app data in cache (optimistic updates)
 * Useful for immediate UI updates before server confirmation
 * 
 * @param queryClient - TanStack Query client instance
 * @param id - App ID for cache update
 * @param updater - Function to update app data or new app data
 * 
 * @example
 * ```typescript
 * // Optimistic update with function
 * updateAppInCache(queryClient, '123', (oldApp) => ({
 *   ...oldApp,
 *   name: 'Updated App Name'
 * }))
 * 
 * // Direct update with new data
 * updateAppInCache(queryClient, '123', updatedAppData)
 * ```
 */
export function updateAppInCache(
  queryClient: any,
  id: string | number,
  updater: AppType | ((old: AppType | undefined) => AppType | undefined)
): void {
  queryClient.setQueriesData(
    {
      queryKey: appQueryKeys.detail(id, {}),
      exact: false
    },
    updater
  )
}

export default useApp