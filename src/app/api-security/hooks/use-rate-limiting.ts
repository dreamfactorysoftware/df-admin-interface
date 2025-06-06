/**
 * Custom React hook implementing API rate limiting operations with SWR-based data fetching
 * and intelligent caching. Manages limit configurations, enforcement rules, and paywall
 * integration while providing CRUD operations for rate limit management.
 * 
 * Replaces Angular limits resolver and service patterns with React Query-powered data
 * synchronization and cache management optimized for React 19 and Next.js 15.1+.
 * 
 * @fileoverview Rate limiting operations hook with intelligent caching and paywall integration
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useSWR, { type SWRConfiguration } from 'swr';
import { useCallback, useMemo } from 'react';
import { 
  apiGet, 
  apiPost, 
  apiPut, 
  apiDelete,
  API_BASE_URL 
} from '../../../lib/api-client';
import type { 
  ApiListResponse, 
  ApiResourceResponse, 
  ApiRequestOptions,
  ApiErrorResponse 
} from '../../../types/api';

// ============================================================================
// Rate Limiting Types and Interfaces
// ============================================================================

/**
 * Rate limit type enumeration for different enforcement scopes
 */
export type RateLimitType = 'api' | 'user' | 'role' | 'service' | 'endpoint';

/**
 * Rate limit period enumeration for time-based enforcement
 */
export type RateLimitPeriod = 'minute' | 'hour' | 'day' | '7-day' | '30-day';

/**
 * Rate limit enforcement status
 */
export type RateLimitStatus = 'active' | 'inactive' | 'paused' | 'expired';

/**
 * Core rate limit configuration interface
 * Compatible with existing DreamFactory limits service and Angular resolver patterns
 */
export interface RateLimit {
  /** Unique identifier for the rate limit */
  id: number;
  
  /** Human-readable name for the rate limit */
  name: string;
  
  /** Description of the rate limit purpose */
  description?: string;
  
  /** Type of rate limit (api, user, role, service, endpoint) */
  limit_type: RateLimitType;
  
  /** Maximum number of requests allowed */
  limit_rate: number;
  
  /** Time period for rate limit enforcement */
  limit_period: RateLimitPeriod;
  
  /** Current request counter value */
  limit_counter?: number;
  
  /** Counter reset timestamp */
  counter_reset_at?: string;
  
  /** Rate limit status */
  status: RateLimitStatus;
  
  /** Whether the rate limit is currently active */
  active: boolean;
  
  /** Associated user ID (for user-scoped limits) */
  user_id?: number;
  
  /** Associated service ID (for service-scoped limits) */
  service_id?: number;
  
  /** Associated role ID (for role-scoped limits) */
  role_id?: number;
  
  /** Specific endpoint path (for endpoint-scoped limits) */
  endpoint?: string;
  
  /** HTTP verb for endpoint-scoped limits */
  verb?: string;
  
  /** Creation timestamp */
  created_date: string;
  
  /** Last modification timestamp */
  last_modified_date: string;
  
  /** Created by user ID */
  created_by_id?: number;
  
  /** Last modified by user ID */
  last_modified_by_id?: number;
}

/**
 * Table row data interface for rate limit management tables
 * Compatible with existing Angular table component patterns
 */
export interface RateLimitTableRow {
  id: number;
  name: string;
  limit_type: RateLimitType;
  limit_rate: number;
  limit_period: RateLimitPeriod;
  limit_counter: number;
  status: RateLimitStatus;
  active: boolean;
  user?: { id: number; name: string };
  service?: { id: number; name: string };
  role?: { id: number; name: string };
}

/**
 * Rate limit cache entry for cache invalidation tracking
 */
export interface RateLimitCache {
  id: number;
  limit_id: number;
  cache_key: string;
  cached_value: number;
  expires_at: string;
  created_date: string;
}

/**
 * Create rate limit payload interface
 */
export interface CreateRateLimitPayload {
  name: string;
  description?: string;
  limit_type: RateLimitType;
  limit_rate: number;
  limit_period: RateLimitPeriod;
  active?: boolean;
  user_id?: number;
  service_id?: number;
  role_id?: number;
  endpoint?: string;
  verb?: string;
}

/**
 * Update rate limit payload interface
 */
export interface UpdateRateLimitPayload extends Partial<CreateRateLimitPayload> {
  id: number;
}

/**
 * Rate limit filter options for list queries
 */
export interface RateLimitFilters {
  limit_type?: RateLimitType;
  status?: RateLimitStatus;
  active?: boolean;
  user_id?: number;
  service_id?: number;
  role_id?: number;
  search?: string;
}

/**
 * Paywall configuration interface
 */
export interface PaywallConfig {
  feature: string;
  active: boolean;
  message?: string;
  upgrade_url?: string;
}

// ============================================================================
// Rate Limiting API Endpoints
// ============================================================================

/**
 * API endpoints for rate limiting operations
 */
export const RATE_LIMIT_ENDPOINTS = {
  LIMITS: `${API_BASE_URL}/system/limit`,
  LIMIT_CACHE: `${API_BASE_URL}/system/limit_cache`,
  PAYWALL: `${API_BASE_URL}/system/environment`,
} as const;

// ============================================================================
// Query Keys for Cache Management
// ============================================================================

/**
 * Standardized query keys for React Query cache management
 * Supports automatic cache invalidation and intelligent synchronization
 */
export const RATE_LIMIT_QUERY_KEYS = {
  /** Base key for all rate limit queries */
  base: ['rate-limits'] as const,
  
  /** All rate limits list */
  list: (filters?: RateLimitFilters) => 
    [...RATE_LIMIT_QUERY_KEYS.base, 'list', filters] as const,
  
  /** Single rate limit by ID */
  detail: (id: number) => 
    [...RATE_LIMIT_QUERY_KEYS.base, 'detail', id] as const,
  
  /** Rate limit cache entries */
  cache: (limitId?: number) => 
    [...RATE_LIMIT_QUERY_KEYS.base, 'cache', limitId] as const,
  
  /** Paywall status for rate limiting feature */
  paywall: () => ['paywall', 'rate-limits'] as const,
  
  /** Rate limit statistics and counters */
  stats: () => [...RATE_LIMIT_QUERY_KEYS.base, 'stats'] as const,
} as const;

// ============================================================================
// API Client Functions
// ============================================================================

/**
 * Fetch rate limits with intelligent filtering and caching
 * Optimized for cache hit responses under 50ms per React/Next.js Integration Requirements
 */
async function fetchRateLimits(
  filters?: RateLimitFilters,
  options?: ApiRequestOptions
): Promise<ApiListResponse<RateLimit>> {
  const queryParams: Record<string, any> = {
    related: 'limit_cache_by_limit_id',
    sort: 'name',
    limit: 1000, // Support databases with 1000+ entries
    include_count: true,
  };

  // Apply filters to query parameters
  if (filters?.limit_type) queryParams.filter = `limit_type="${filters.limit_type}"`;
  if (filters?.status) queryParams.filter = `${queryParams.filter ? queryParams.filter + ' AND ' : ''}status="${filters.status}"`;
  if (filters?.active !== undefined) queryParams.filter = `${queryParams.filter ? queryParams.filter + ' AND ' : ''}active=${filters.active}`;
  if (filters?.user_id) queryParams.filter = `${queryParams.filter ? queryParams.filter + ' AND ' : ''}user_id=${filters.user_id}`;
  if (filters?.service_id) queryParams.filter = `${queryParams.filter ? queryParams.filter + ' AND ' : ''}service_id=${filters.service_id}`;
  if (filters?.role_id) queryParams.filter = `${queryParams.filter ? queryParams.filter + ' AND ' : ''}role_id=${filters.role_id}`;
  if (filters?.search) queryParams.filter = `${queryParams.filter ? queryParams.filter + ' AND ' : ''}(name LIKE "%${filters.search}%" OR description LIKE "%${filters.search}%")`;

  return apiGet<ApiListResponse<RateLimit>>(RATE_LIMIT_ENDPOINTS.LIMITS, {
    ...options,
    ...queryParams,
  });
}

/**
 * Fetch single rate limit by ID with cache optimization
 */
async function fetchRateLimit(
  id: number, 
  options?: ApiRequestOptions
): Promise<ApiResourceResponse<RateLimit>> {
  return apiGet<ApiResourceResponse<RateLimit>>(
    `${RATE_LIMIT_ENDPOINTS.LIMITS}/${id}`,
    {
      ...options,
      related: 'limit_cache_by_limit_id',
      fields: '*',
    }
  );
}

/**
 * Create new rate limit with optimistic updates
 */
async function createRateLimit(
  payload: CreateRateLimitPayload,
  options?: ApiRequestOptions
): Promise<ApiResourceResponse<RateLimit>> {
  return apiPost<ApiResourceResponse<RateLimit>>(
    RATE_LIMIT_ENDPOINTS.LIMITS,
    payload,
    {
      ...options,
      snackbarSuccess: 'Rate limit created successfully',
      snackbarError: 'Failed to create rate limit',
    }
  );
}

/**
 * Update existing rate limit with optimistic updates
 */
async function updateRateLimit(
  payload: UpdateRateLimitPayload,
  options?: ApiRequestOptions
): Promise<ApiResourceResponse<RateLimit>> {
  const { id, ...updateData } = payload;
  return apiPut<ApiResourceResponse<RateLimit>>(
    `${RATE_LIMIT_ENDPOINTS.LIMITS}/${id}`,
    updateData,
    {
      ...options,
      snackbarSuccess: 'Rate limit updated successfully',
      snackbarError: 'Failed to update rate limit',
    }
  );
}

/**
 * Delete rate limit with cache invalidation
 */
async function deleteRateLimit(
  id: number,
  options?: ApiRequestOptions
): Promise<void> {
  return apiDelete<void>(`${RATE_LIMIT_ENDPOINTS.LIMITS}/${id}`, {
    ...options,
    snackbarSuccess: 'Rate limit deleted successfully',
    snackbarError: 'Failed to delete rate limit',
  });
}

/**
 * Fetch rate limit cache entries for monitoring
 */
async function fetchRateLimitCache(
  limitId?: number,
  options?: ApiRequestOptions
): Promise<ApiListResponse<RateLimitCache>> {
  const queryParams: Record<string, any> = {
    sort: 'created_date DESC',
    limit: 100,
  };

  if (limitId) {
    queryParams.filter = `limit_id=${limitId}`;
  }

  return apiGet<ApiListResponse<RateLimitCache>>(RATE_LIMIT_ENDPOINTS.LIMIT_CACHE, {
    ...options,
    ...queryParams,
  });
}

/**
 * Check paywall status for rate limiting features
 * Replaces Angular route guard patterns with Next.js middleware integration
 */
async function checkPaywallStatus(
  feature: string = 'limit',
  options?: ApiRequestOptions
): Promise<PaywallConfig> {
  try {
    // Check environment configuration for paywall status
    const response = await apiGet<ApiResourceResponse<any>>(
      RATE_LIMIT_ENDPOINTS.PAYWALL,
      {
        ...options,
        fields: 'df_is_' + feature + '_enabled,paywall_*',
      }
    );

    const config = response.resource;
    const isEnabled = config[`df_is_${feature}_enabled`] !== false;
    
    return {
      feature,
      active: !isEnabled,
      message: config.paywall_message || 'This feature requires an upgrade',
      upgrade_url: config.paywall_upgrade_url,
    };
  } catch (error) {
    // Default to allowing access if paywall check fails
    return {
      feature,
      active: false,
    };
  }
}

// ============================================================================
// Main Rate Limiting Hook
// ============================================================================

/**
 * Comprehensive rate limiting operations hook with SWR-based data fetching,
 * intelligent caching, and paywall integration.
 * 
 * Replaces Angular limits resolver and service patterns with React Query-powered
 * data synchronization optimized for React 19 and Next.js 15.1+.
 * 
 * Features:
 * - SWR/React Query for intelligent caching with TTL configuration
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * - Paywall enforcement integration replacing Angular route guard patterns
 * - React Query mutations with optimistic updates
 * - Automatic cache invalidation for related queries
 * - Comprehensive error handling and retry logic
 * 
 * @param options Configuration options for the hook
 * @returns Rate limiting operations and state management
 */
export function useRateLimiting(options: {
  /** Enable automatic data fetching */
  enabled?: boolean;
  /** Initial filters for rate limits list */
  filters?: RateLimitFilters;
  /** Specific rate limit ID to focus on */
  limitId?: number;
  /** Enable paywall checking */
  checkPaywall?: boolean;
} = {}) {
  const {
    enabled = true,
    filters,
    limitId,
    checkPaywall = true,
  } = options;

  const queryClient = useQueryClient();

  // ========================================================================
  // Paywall Status Query with SWR
  // ========================================================================

  /**
   * SWR configuration for paywall status with intelligent caching
   * staleTime: 300 seconds, cacheTime: 900 seconds per Section 5.2 component details
   */
  const swrConfig: SWRConfiguration = {
    refreshInterval: 300000, // 5 minutes
    refreshOnFocus: false,
    refreshOnReconnect: true,
    dedupingInterval: 60000, // 1 minute
    errorRetryCount: 3,
    errorRetryInterval: 2000,
    revalidateOnMount: true,
  };

  /**
   * Paywall status with SWR for real-time synchronization
   * Replaces Angular route guard patterns per Section 4.7 migration strategy
   */
  const {
    data: paywallStatus,
    error: paywallError,
    mutate: refreshPaywall,
    isLoading: isPaywallLoading,
  } = useSWR<PaywallConfig>(
    checkPaywall ? 'paywall-rate-limits' : null,
    () => checkPaywallStatus('limit'),
    swrConfig
  );

  // Check if paywall is blocking access
  const isPaywallActive = paywallStatus?.active ?? false;
  const shouldFetchData = enabled && !isPaywallActive;

  // ========================================================================
  // Rate Limits List Query with React Query
  // ========================================================================

  /**
   * Rate limits list with intelligent caching and conditional fetching
   * Cache hit responses under 50ms per React/Next.js Integration Requirements
   */
  const rateLimitsQuery = useQuery({
    queryKey: RATE_LIMIT_QUERY_KEYS.list(filters),
    queryFn: () => fetchRateLimits(filters),
    enabled: shouldFetchData,
    staleTime: 300000, // 5 minutes (300 seconds)
    gcTime: 900000, // 15 minutes (900 seconds) - was cacheTime in v4
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Retry logic for rate limiting operations per Section 4.2 error handling
      if (failureCount >= 3) return false;
      const errorData = JSON.parse(error.message || '{}') as ApiErrorResponse;
      const statusCode = errorData.error?.status_code;
      
      // Don't retry for client errors (4xx) except 408, 429
      if (statusCode && statusCode >= 400 && statusCode < 500) {
        return statusCode === 408 || statusCode === 429;
      }
      
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // ========================================================================
  // Single Rate Limit Query
  // ========================================================================

  /**
   * Single rate limit query with cache optimization
   */
  const rateLimitQuery = useQuery({
    queryKey: RATE_LIMIT_QUERY_KEYS.detail(limitId!),
    queryFn: () => fetchRateLimit(limitId!),
    enabled: shouldFetchData && !!limitId,
    staleTime: 300000, // 5 minutes
    gcTime: 900000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (failureCount >= 3) return false;
      const errorData = JSON.parse(error.message || '{}') as ApiErrorResponse;
      const statusCode = errorData.error?.status_code;
      return !(statusCode && statusCode >= 400 && statusCode < 500);
    },
  });

  // ========================================================================
  // Rate Limit Cache Query
  // ========================================================================

  /**
   * Rate limit cache monitoring with intelligent caching
   */
  const rateLimitCacheQuery = useQuery({
    queryKey: RATE_LIMIT_QUERY_KEYS.cache(limitId),
    queryFn: () => fetchRateLimitCache(limitId),
    enabled: shouldFetchData,
    staleTime: 60000, // 1 minute for cache data
    gcTime: 300000, // 5 minutes
    refetchInterval: 30000, // Refresh every 30 seconds for monitoring
    retry: 2,
  });

  // ========================================================================
  // Mutation Operations with Optimistic Updates
  // ========================================================================

  /**
   * Create rate limit mutation with optimistic updates
   * React Query mutations per Section 4.3.2 Server State Management
   */
  const createMutation = useMutation({
    mutationFn: createRateLimit,
    onMutate: async (newRateLimit: CreateRateLimitPayload) => {
      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: RATE_LIMIT_QUERY_KEYS.list(filters) });

      // Snapshot previous value for rollback
      const previousRateLimits = queryClient.getQueryData(RATE_LIMIT_QUERY_KEYS.list(filters));

      // Optimistically update with temporary ID
      if (previousRateLimits) {
        const optimisticRateLimit: RateLimit = {
          id: Date.now(), // Temporary ID
          name: newRateLimit.name,
          description: newRateLimit.description,
          limit_type: newRateLimit.limit_type,
          limit_rate: newRateLimit.limit_rate,
          limit_period: newRateLimit.limit_period,
          status: 'active',
          active: newRateLimit.active ?? true,
          user_id: newRateLimit.user_id,
          service_id: newRateLimit.service_id,
          role_id: newRateLimit.role_id,
          endpoint: newRateLimit.endpoint,
          verb: newRateLimit.verb,
          created_date: new Date().toISOString(),
          last_modified_date: new Date().toISOString(),
        };

        queryClient.setQueryData(
          RATE_LIMIT_QUERY_KEYS.list(filters),
          (old: ApiListResponse<RateLimit>) => ({
            ...old,
            resource: [optimisticRateLimit, ...old.resource],
            meta: {
              ...old.meta,
              count: old.meta.count + 1,
            },
          })
        );
      }

      return { previousRateLimits };
    },
    onSuccess: (data) => {
      // Invalidate and refetch rate limits list
      queryClient.invalidateQueries({ queryKey: RATE_LIMIT_QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: RATE_LIMIT_QUERY_KEYS.cache() });
      
      // Set the specific rate limit data
      if (data.resource) {
        queryClient.setQueryData(
          RATE_LIMIT_QUERY_KEYS.detail(data.resource.id),
          data
        );
      }
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousRateLimits) {
        queryClient.setQueryData(
          RATE_LIMIT_QUERY_KEYS.list(filters),
          context.previousRateLimits
        );
      }
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  /**
   * Update rate limit mutation with optimistic updates
   */
  const updateMutation = useMutation({
    mutationFn: updateRateLimit,
    onMutate: async (updatedRateLimit: UpdateRateLimitPayload) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: RATE_LIMIT_QUERY_KEYS.detail(updatedRateLimit.id) });
      await queryClient.cancelQueries({ queryKey: RATE_LIMIT_QUERY_KEYS.list(filters) });

      // Snapshot previous values
      const previousRateLimit = queryClient.getQueryData(
        RATE_LIMIT_QUERY_KEYS.detail(updatedRateLimit.id)
      );
      const previousRateLimits = queryClient.getQueryData(
        RATE_LIMIT_QUERY_KEYS.list(filters)
      );

      // Optimistically update single rate limit
      if (previousRateLimit) {
        const optimisticRateLimit = {
          ...(previousRateLimit as ApiResourceResponse<RateLimit>).resource,
          ...updatedRateLimit,
          last_modified_date: new Date().toISOString(),
        };

        queryClient.setQueryData(
          RATE_LIMIT_QUERY_KEYS.detail(updatedRateLimit.id),
          { resource: optimisticRateLimit }
        );
      }

      // Optimistically update in list
      if (previousRateLimits) {
        queryClient.setQueryData(
          RATE_LIMIT_QUERY_KEYS.list(filters),
          (old: ApiListResponse<RateLimit>) => ({
            ...old,
            resource: old.resource.map(item =>
              item.id === updatedRateLimit.id
                ? { ...item, ...updatedRateLimit, last_modified_date: new Date().toISOString() }
                : item
            ),
          })
        );
      }

      return { previousRateLimit, previousRateLimits };
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: RATE_LIMIT_QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: RATE_LIMIT_QUERY_KEYS.cache(data.resource.id) });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousRateLimit) {
        queryClient.setQueryData(
          RATE_LIMIT_QUERY_KEYS.detail(variables.id),
          context.previousRateLimit
        );
      }
      if (context?.previousRateLimits) {
        queryClient.setQueryData(
          RATE_LIMIT_QUERY_KEYS.list(filters),
          context.previousRateLimits
        );
      }
    },
    retry: 2,
  });

  /**
   * Delete rate limit mutation with automatic cache invalidation
   */
  const deleteMutation = useMutation({
    mutationFn: deleteRateLimit,
    onMutate: async (deletedId: number) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: RATE_LIMIT_QUERY_KEYS.list(filters) });

      // Snapshot previous value
      const previousRateLimits = queryClient.getQueryData(
        RATE_LIMIT_QUERY_KEYS.list(filters)
      );

      // Optimistically remove from list
      if (previousRateLimits) {
        queryClient.setQueryData(
          RATE_LIMIT_QUERY_KEYS.list(filters),
          (old: ApiListResponse<RateLimit>) => ({
            ...old,
            resource: old.resource.filter(item => item.id !== deletedId),
            meta: {
              ...old.meta,
              count: old.meta.count - 1,
            },
          })
        );
      }

      return { previousRateLimits };
    },
    onSuccess: (data, deletedId) => {
      // Remove from cache and invalidate related queries
      queryClient.removeQueries({ queryKey: RATE_LIMIT_QUERY_KEYS.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: RATE_LIMIT_QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: RATE_LIMIT_QUERY_KEYS.cache() });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousRateLimits) {
        queryClient.setQueryData(
          RATE_LIMIT_QUERY_KEYS.list(filters),
          context.previousRateLimits
        );
      }
    },
    retry: 1,
  });

  // ========================================================================
  // Utility Functions and Cache Management
  // ========================================================================

  /**
   * Refresh rate limits list with cache invalidation
   */
  const refreshRateLimits = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: RATE_LIMIT_QUERY_KEYS.list(filters) });
    return rateLimitsQuery.refetch();
  }, [queryClient, filters, rateLimitsQuery]);

  /**
   * Refresh specific rate limit
   */
  const refreshRateLimit = useCallback(async (id: number) => {
    await queryClient.invalidateQueries({ queryKey: RATE_LIMIT_QUERY_KEYS.detail(id) });
    return queryClient.refetchQueries({ queryKey: RATE_LIMIT_QUERY_KEYS.detail(id) });
  }, [queryClient]);

  /**
   * Clear rate limits cache
   */
  const clearCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: RATE_LIMIT_QUERY_KEYS.base });
  }, [queryClient]);

  /**
   * Get cache status and statistics
   */
  const cacheStatus = useMemo(() => {
    const queries = queryClient.getQueryCache().findAll({ queryKey: RATE_LIMIT_QUERY_KEYS.base });
    return {
      totalQueries: queries.length,
      staleQueries: queries.filter(q => q.isStale()).length,
      loadingQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
    };
  }, [queryClient, rateLimitsQuery.dataUpdatedAt, rateLimitQuery.dataUpdatedAt]);

  // ========================================================================
  // Computed State and Error Handling
  // ========================================================================

  /**
   * Comprehensive loading state management
   */
  const isLoading = isPaywallLoading || rateLimitsQuery.isLoading || rateLimitQuery.isLoading;

  /**
   * Error state with comprehensive error handling per Section 4.2
   */
  const error = paywallError || rateLimitsQuery.error || rateLimitQuery.error;

  /**
   * Mutation loading states
   */
  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  /**
   * Formatted table data for UI components
   */
  const tableData = useMemo((): RateLimitTableRow[] => {
    if (!rateLimitsQuery.data?.resource) return [];
    
    return rateLimitsQuery.data.resource.map(limit => ({
      id: limit.id,
      name: limit.name,
      limit_type: limit.limit_type,
      limit_rate: limit.limit_rate,
      limit_period: limit.limit_period,
      limit_counter: limit.limit_counter || 0,
      status: limit.status,
      active: limit.active,
      user: limit.user_id ? { id: limit.user_id, name: `User ${limit.user_id}` } : undefined,
      service: limit.service_id ? { id: limit.service_id, name: `Service ${limit.service_id}` } : undefined,
      role: limit.role_id ? { id: limit.role_id, name: `Role ${limit.role_id}` } : undefined,
    }));
  }, [rateLimitsQuery.data]);

  // ========================================================================
  // Hook Return Interface
  // ========================================================================

  return {
    // Data state
    rateLimits: rateLimitsQuery.data,
    rateLimit: rateLimitQuery.data,
    rateLimitCache: rateLimitCacheQuery.data,
    tableData,
    
    // Paywall integration
    paywallStatus,
    isPaywallActive,
    refreshPaywall,
    
    // Loading states
    isLoading,
    isPaywallLoading,
    isLoadingList: rateLimitsQuery.isLoading,
    isLoadingDetail: rateLimitQuery.isLoading,
    isLoadingCache: rateLimitCacheQuery.isLoading,
    isMutating,
    
    // Error states
    error,
    paywallError,
    listError: rateLimitsQuery.error,
    detailError: rateLimitQuery.error,
    cacheError: rateLimitCacheQuery.error,
    
    // Mutation operations
    createRateLimit: createMutation.mutate,
    updateRateLimit: updateMutation.mutate,
    deleteRateLimit: deleteMutation.mutate,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    
    // Async mutation operations
    createRateLimitAsync: createMutation.mutateAsync,
    updateRateLimitAsync: updateMutation.mutateAsync,
    deleteRateLimitAsync: deleteMutation.mutateAsync,
    
    // Cache management
    refreshRateLimits,
    refreshRateLimit,
    clearCache,
    cacheStatus,
    
    // Query metadata
    lastUpdated: rateLimitsQuery.dataUpdatedAt,
    isStale: rateLimitsQuery.isStale,
    isFetching: rateLimitsQuery.isFetching,
  };
}

// ============================================================================
// Helper Hooks for Specific Use Cases
// ============================================================================

/**
 * Simplified hook for rate limits list only
 */
export function useRateLimitsList(filters?: RateLimitFilters) {
  return useRateLimiting({ filters, checkPaywall: true });
}

/**
 * Hook for managing a specific rate limit
 */
export function useRateLimit(id: number) {
  return useRateLimiting({ limitId: id, checkPaywall: false });
}

/**
 * Hook for paywall status only
 */
export function useRateLimitPaywall() {
  const { paywallStatus, isPaywallActive, refreshPaywall, isPaywallLoading, paywallError } = 
    useRateLimiting({ enabled: false, checkPaywall: true });
  
  return {
    paywallStatus,
    isPaywallActive,
    refreshPaywall,
    isLoading: isPaywallLoading,
    error: paywallError,
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default useRateLimiting;