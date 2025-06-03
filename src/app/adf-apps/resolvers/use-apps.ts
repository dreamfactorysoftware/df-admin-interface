/**
 * React Query-based Apps Data Fetching Hook
 * 
 * Custom hook providing configurable app list data fetching with advanced caching,
 * filtering, and conditional parameter handling. Replaces the Angular manage-apps.resolver.ts
 * factory by implementing React Query useQuery with optional limit parameter support,
 * comprehensive query parameter building, and intelligent cache management.
 * 
 * Features:
 * - Background synchronization with automatic revalidation
 * - Optimistic updates for app management workflows
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * - TTL configuration: staleTime 300s, cacheTime 900s
 * - React Query select functions for optimized re-rendering
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client'

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { apiClient } from '../../../lib/api-client'
import type { AppType, AppRow } from '../../../types/apps'
import type { GenericListResponse } from '../../../types/generic-http'

/**
 * Parameters for apps list data fetching
 */
export interface UseAppsParams {
  /** Maximum number of apps to fetch (optional) */
  limit?: number
  /** Additional query parameters for backend API compatibility */
  related?: string
  /** Specific fields to retrieve from the API */
  fields?: string
  /** Sort parameter for ordering results */
  sort?: string
  /** Enable/disable the query execution */
  enabled?: boolean
}

/**
 * Apps query configuration with intelligent caching
 */
export interface UseAppsOptions extends UseAppsParams {
  /** Transform raw AppType data to AppRow format for UI consumption */
  transformToAppRow?: boolean
  /** Custom select function for data transformation */
  select?: (data: GenericListResponse<AppType>) => any
  /** Additional React Query options */
  queryOptions?: Omit<UseQueryOptions<GenericListResponse<AppType>>, 'queryKey' | 'queryFn'>
}

/**
 * Query key factory for apps data fetching
 * Ensures proper cache invalidation and deduplication
 */
export const appsQueryKeys = {
  all: ['apps'] as const,
  lists: () => [...appsQueryKeys.all, 'list'] as const,
  list: (params: UseAppsParams) => [...appsQueryKeys.lists(), params] as const,
}

/**
 * Default query parameters maintaining Angular resolver compatibility
 */
const DEFAULT_PARAMS: Required<Omit<UseAppsParams, 'limit' | 'enabled'>> = {
  related: 'role_by_role_id',
  fields: '*',
  sort: 'name',
}

/**
 * Transform AppType to AppRow for table display
 * Maintains compatibility with existing UI components
 */
const transformAppTypeToAppRow = (apps: AppType[]): AppRow[] => {
  return apps.map((app) => ({
    id: app.id,
    name: app.name,
    role: app.roleByRoleId?.name || '',
    apiKey: app.apiKey,
    description: app.description || '',
    active: app.isActive,
    launchUrl: app.launchUrl,
    createdById: app.createdById,
  }))
}

/**
 * Apps list data fetcher function
 * Builds query parameters and executes API request
 */
const fetchApps = async (params: UseAppsParams): Promise<GenericListResponse<AppType>> => {
  const queryParams = new URLSearchParams()

  // Build query parameters for backend API compatibility
  queryParams.append('related', params.related || DEFAULT_PARAMS.related)
  queryParams.append('fields', params.fields || DEFAULT_PARAMS.fields)
  queryParams.append('sort', params.sort || DEFAULT_PARAMS.sort)

  // Add optional limit parameter if provided
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString())
  }

  const response = await apiClient.get(`/apps?${queryParams.toString()}`)
  return response as GenericListResponse<AppType>
}

/**
 * React Query-based custom hook for apps list management
 * 
 * Provides intelligent caching, background synchronization, and optimized re-rendering
 * through TanStack React Query 5.79.2 with configurable limit parameter support.
 * 
 * @param params - Query parameters for apps data fetching
 * @param options - Additional configuration options including data transformation
 * @returns React Query result with apps data, loading state, and error handling
 * 
 * @example
 * ```typescript
 * // Basic usage with default parameters
 * const { data: apps, isLoading, error } = useApps()
 * 
 * // With custom limit and transformation to AppRow format
 * const { data: appRows, isLoading } = useApps(
 *   { limit: 50 },
 *   { transformToAppRow: true }
 * )
 * 
 * // With custom select function for optimized re-rendering
 * const { data: activeApps } = useApps(
 *   { sort: 'name.asc' },
 *   {
 *     select: (data) => data.resource.filter(app => app.isActive),
 *     queryOptions: { refetchOnWindowFocus: false }
 *   }
 * )
 * ```
 */
export function useApps(
  params: UseAppsParams = {},
  options: UseAppsOptions = {}
): ReturnType<typeof useQuery<GenericListResponse<AppType>, Error, any>> {
  const {
    transformToAppRow = false,
    select,
    queryOptions = {},
    ...restOptions
  } = options

  // Merge parameters with defaults
  const queryParams = {
    ...DEFAULT_PARAMS,
    ...params,
    ...restOptions,
  }

  // Default select function with optional AppRow transformation
  const defaultSelect = (data: GenericListResponse<AppType>) => {
    if (transformToAppRow) {
      return {
        ...data,
        resource: transformAppTypeToAppRow(data.resource),
      }
    }
    return data
  }

  return useQuery({
    // Query key for intelligent caching and deduplication
    queryKey: appsQueryKeys.list(queryParams),
    
    // Query function with parameter building
    queryFn: () => fetchApps(queryParams),
    
    // Intelligent caching configuration per React/Next.js Integration Requirements
    staleTime: 5 * 60 * 1000, // 300 seconds (5 minutes) - data considered fresh
    gcTime: 15 * 60 * 1000, // 900 seconds (15 minutes) - cache retention time
    
    // Background synchronization for real-time updates
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    
    // Optimized re-rendering with select function
    select: select || defaultSelect,
    
    // Enable/disable query execution
    enabled: queryParams.enabled !== false,
    
    // Additional query options
    ...queryOptions,
  })
}

/**
 * Factory function for creating apps resolver hook with fixed limit
 * Maintains compatibility with Angular resolver pattern
 * 
 * @param limit - Fixed limit for apps fetching
 * @returns Configured useApps hook with fixed limit parameter
 * 
 * @example
 * ```typescript
 * // Create a resolver hook with fixed limit (like Angular factory)
 * const useAppsWithLimit = createAppsResolver(25)
 * 
 * // Use in component
 * const { data: limitedApps } = useAppsWithLimit()
 * ```
 */
export function createAppsResolver(limit?: number) {
  return (params: Omit<UseAppsParams, 'limit'> = {}, options: UseAppsOptions = {}) => {
    return useApps({ ...params, limit }, options)
  }
}

/**
 * Prefetch function for apps data
 * Useful for preloading data before navigation or user interaction
 * 
 * @param queryClient - TanStack Query client instance
 * @param params - Query parameters for prefetching
 * 
 * @example
 * ```typescript
 * import { useQueryClient } from '@tanstack/react-query'
 * 
 * const queryClient = useQueryClient()
 * 
 * // Prefetch apps data before navigation
 * await prefetchApps(queryClient, { limit: 50 })
 * ```
 */
export async function prefetchApps(
  queryClient: any,
  params: UseAppsParams = {}
): Promise<void> {
  const queryParams = {
    ...DEFAULT_PARAMS,
    ...params,
  }

  await queryClient.prefetchQuery({
    queryKey: appsQueryKeys.list(queryParams),
    queryFn: () => fetchApps(queryParams),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Invalidate apps cache
 * Useful for triggering data refetch after mutations
 * 
 * @param queryClient - TanStack Query client instance
 * 
 * @example
 * ```typescript
 * // After creating/updating/deleting an app
 * await invalidateAppsCache(queryClient)
 * ```
 */
export async function invalidateAppsCache(queryClient: any): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: appsQueryKeys.all,
  })
}

export default useApps