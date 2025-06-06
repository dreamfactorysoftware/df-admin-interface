/**
 * Custom React hook providing CORS configuration management operations including
 * CORS entry creation, updates, deletion, and status monitoring.
 * 
 * Implements SWR and React Query patterns for intelligent caching, optimistic updates,
 * and error recovery with comprehensive loading states and mutation management.
 * Replaces Angular DfBaseCrudService CORS operations with modern React patterns.
 * 
 * @fileoverview CORS operations React hook with SWR/React Query integration
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions 
} from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, type ApiRequestOptions } from '../../../lib/api-client';
import type {
  CorsConfig,
  CorsConfigCreate,
  CorsConfigUpdate,
  CorsConfigQuery,
  CorsConfigListResponse,
  CorsConfigResponse,
  CorsConfigCreateResponse,
  CorsConfigUpdateResponse,
  CorsConfigDeleteResponse,
  CorsOperationStatus,
  HttpMethod,
} from '../../../types/cors';
import {
  validateCorsCreate,
  validateCorsUpdate,
  validateCorsQuery,
  validateCorsToggle,
  validateCorsDelete,
  type CorsConfigCreateForm,
  type CorsConfigUpdateForm,
  type CorsConfigToggleForm,
} from '../../../lib/validations/cors';

// ============================================================================
// Constants and Configuration
// ============================================================================

/**
 * CORS API endpoints
 */
const CORS_ENDPOINTS = {
  BASE: '/api/v2/system/cors',
  BY_ID: (id: number) => `/api/v2/system/cors/${id}`,
} as const;

/**
 * React Query cache keys for CORS operations
 */
const CORS_QUERY_KEYS = {
  ALL: ['cors'] as const,
  LISTS: () => [...CORS_QUERY_KEYS.ALL, 'list'] as const,
  LIST: (query?: CorsConfigQuery) => [...CORS_QUERY_KEYS.LISTS(), query] as const,
  DETAILS: () => [...CORS_QUERY_KEYS.ALL, 'detail'] as const,
  DETAIL: (id: number) => [...CORS_QUERY_KEYS.DETAILS(), id] as const,
} as const;

/**
 * Default query options optimized for CORS operations
 */
const DEFAULT_QUERY_OPTIONS = {
  staleTime: 5 * 60 * 1000, // 5 minutes - CORS configs change infrequently
  cacheTime: 10 * 60 * 1000, // 10 minutes - Keep in cache longer
  refetchOnWindowFocus: false, // Avoid unnecessary refetches
  refetchOnMount: true, // Ensure fresh data on mount
  retry: 3, // Retry failed requests up to 3 times
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
} as const;

/**
 * Mutation options with optimistic updates and rollback
 */
const DEFAULT_MUTATION_OPTIONS = {
  retry: 2, // Retry mutations up to 2 times
  retryDelay: 1000, // 1 second delay between retries
} as const;

// ============================================================================
// Hook Configuration Types
// ============================================================================

/**
 * Configuration options for CORS list queries
 */
export interface UseCorsListOptions extends Omit<UseQueryOptions<CorsConfigListResponse>, 'queryKey' | 'queryFn'> {
  /**
   * Query parameters for filtering and pagination
   */
  query?: CorsConfigQuery;
  /**
   * Additional API request options
   */
  apiOptions?: ApiRequestOptions;
  /**
   * Whether to enable auto-refresh (default: false)
   */
  autoRefresh?: boolean;
  /**
   * Auto-refresh interval in milliseconds (default: 30000)
   */
  refreshInterval?: number;
}

/**
 * Configuration options for CORS detail queries
 */
export interface UseCorsDetailOptions extends Omit<UseQueryOptions<CorsConfigResponse>, 'queryKey' | 'queryFn'> {
  /**
   * Additional API request options
   */
  apiOptions?: ApiRequestOptions;
}

/**
 * Configuration options for CORS mutations
 */
export interface UseCorsMutationOptions<TData = any, TVariables = any> 
  extends Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> {
  /**
   * Whether to enable optimistic updates (default: true)
   */
  optimistic?: boolean;
  /**
   * Additional API request options
   */
  apiOptions?: ApiRequestOptions;
}

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Main CORS operations hook providing comprehensive CORS management functionality
 */
export function useCorsOperations() {
  const queryClient = useQueryClient();
  const optimisticUpdatesRef = useRef<Map<string, any>>(new Map());

  // ============================================================================
  // Query Operations
  // ============================================================================

  /**
   * Fetches list of CORS configurations with intelligent caching
   */
  const useCorsList = useCallback((options: UseCorsListOptions = {}) => {
    const { 
      query, 
      apiOptions, 
      autoRefresh = false, 
      refreshInterval = 30000,
      ...queryOptions 
    } = options;

    return useQuery({
      queryKey: CORS_QUERY_KEYS.LIST(query),
      queryFn: async (): Promise<CorsConfigListResponse> => {
        // Validate query parameters
        const validatedQuery = query ? validateCorsQuery(query) : undefined;
        
        // Build API request options
        const requestOptions: ApiRequestOptions = {
          ...apiOptions,
          ...validatedQuery,
          // Ensure cache hit responses under 50ms by using appropriate cache headers
          includeCacheControl: true,
        };

        const response = await apiGet<CorsConfigListResponse>(
          CORS_ENDPOINTS.BASE,
          requestOptions
        );

        return response;
      },
      ...DEFAULT_QUERY_OPTIONS,
      ...queryOptions,
      // Enable auto-refresh if requested
      refetchInterval: autoRefresh ? refreshInterval : false,
      // Keep previous data during refetches for smooth UX
      keepPreviousData: true,
      // Ensure API responses under 2 seconds with timeout
      meta: {
        timeout: 2000,
      },
    });
  }, []);

  /**
   * Fetches a specific CORS configuration by ID
   */
  const useCorsDetail = useCallback((id: number, options: UseCorsDetailOptions = {}) => {
    const { apiOptions, ...queryOptions } = options;

    return useQuery({
      queryKey: CORS_QUERY_KEYS.DETAIL(id),
      queryFn: async (): Promise<CorsConfigResponse> => {
        const requestOptions: ApiRequestOptions = {
          ...apiOptions,
          includeCacheControl: true,
        };

        const response = await apiGet<CorsConfigResponse>(
          CORS_ENDPOINTS.BY_ID(id),
          requestOptions
        );

        return response;
      },
      ...DEFAULT_QUERY_OPTIONS,
      ...queryOptions,
      enabled: !!id && (queryOptions.enabled !== false),
      meta: {
        timeout: 2000,
      },
    });
  }, []);

  // ============================================================================
  // Cache Management Utilities
  // ============================================================================

  /**
   * Invalidates all CORS-related queries
   */
  const invalidateAllCors = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: CORS_QUERY_KEYS.ALL });
  }, [queryClient]);

  /**
   * Updates cached CORS list with new/updated configuration
   */
  const updateCorsListCache = useCallback((config: CorsConfig) => {
    queryClient.setQueriesData<CorsConfigListResponse>(
      { queryKey: CORS_QUERY_KEYS.LISTS() },
      (oldData) => {
        if (!oldData) return oldData;

        const existingIndex = oldData.resource.findIndex(c => c.id === config.id);
        
        if (existingIndex >= 0) {
          // Update existing configuration
          const newResource = [...oldData.resource];
          newResource[existingIndex] = config;
          return { ...oldData, resource: newResource };
        } else {
          // Add new configuration
          return {
            ...oldData,
            resource: [config, ...oldData.resource],
            count: oldData.count ? oldData.count + 1 : oldData.resource.length,
          };
        }
      }
    );
  }, [queryClient]);

  /**
   * Removes CORS configuration from cached lists
   */
  const removeCorsFromCache = useCallback((id: number) => {
    queryClient.setQueriesData<CorsConfigListResponse>(
      { queryKey: CORS_QUERY_KEYS.LISTS() },
      (oldData) => {
        if (!oldData) return oldData;

        const newResource = oldData.resource.filter(c => c.id !== id);
        return {
          ...oldData,
          resource: newResource,
          count: oldData.count ? oldData.count - 1 : newResource.length,
        };
      }
    );

    // Remove detail cache
    queryClient.removeQueries({ queryKey: CORS_QUERY_KEYS.DETAIL(id) });
  }, [queryClient]);

  // ============================================================================
  // Mutation Operations
  // ============================================================================

  /**
   * Creates a new CORS configuration with optimistic updates
   */
  const useCorsCreate = useCallback((options: UseCorsMutationOptions<CorsConfigCreateResponse, CorsConfigCreateForm> = {}) => {
    const { optimistic = true, apiOptions, ...mutationOptions } = options;

    return useMutation({
      mutationFn: async (data: CorsConfigCreateForm): Promise<CorsConfigCreateResponse> => {
        // Validate input data
        const validatedData = validateCorsCreate(data);

        const requestOptions: ApiRequestOptions = {
          ...apiOptions,
          snackbarSuccess: 'CORS configuration created successfully',
          snackbarError: 'Failed to create CORS configuration',
        };

        const response = await apiPost<CorsConfigCreateResponse>(
          CORS_ENDPOINTS.BASE,
          validatedData,
          requestOptions
        );

        return response;
      },
      ...DEFAULT_MUTATION_OPTIONS,
      ...mutationOptions,
      onMutate: async (data) => {
        if (optimistic) {
          // Cancel outgoing refetches to avoid conflicts
          await queryClient.cancelQueries({ queryKey: CORS_QUERY_KEYS.LISTS() });

          // Create optimistic CORS configuration
          const optimisticConfig: CorsConfig = {
            id: Date.now(), // Temporary ID
            ...data,
            createdById: null,
            createdDate: new Date().toISOString(),
            lastModifiedById: null,
            lastModifiedDate: new Date().toISOString(),
          };

          // Store optimistic update for potential rollback
          const rollbackKey = `create-${Date.now()}`;
          optimisticUpdatesRef.current.set(rollbackKey, {
            type: 'create',
            config: optimisticConfig,
          });

          // Optimistically update the cache
          updateCorsListCache(optimisticConfig);

          return { rollbackKey, optimisticConfig };
        }

        return mutationOptions.onMutate?.(data);
      },
      onSuccess: (response, variables, context) => {
        if (optimistic && context?.rollbackKey) {
          // Replace optimistic data with real data
          updateCorsListCache(response.resource);
          
          // Clean up optimistic update reference
          optimisticUpdatesRef.current.delete(context.rollbackKey);
        } else {
          // Update cache with new configuration
          updateCorsListCache(response.resource);
        }

        // Invalidate related queries to ensure consistency
        invalidateAllCors();

        return mutationOptions.onSuccess?.(response, variables, context);
      },
      onError: (error, variables, context) => {
        if (optimistic && context?.rollbackKey) {
          // Rollback optimistic update
          const rollbackData = optimisticUpdatesRef.current.get(context.rollbackKey);
          if (rollbackData?.type === 'create') {
            removeCorsFromCache(rollbackData.config.id);
          }
          
          // Clean up optimistic update reference
          optimisticUpdatesRef.current.delete(context.rollbackKey);
        }

        return mutationOptions.onError?.(error, variables, context);
      },
    });
  }, [queryClient, updateCorsListCache, removeCorsFromCache, invalidateAllCors]);

  /**
   * Updates an existing CORS configuration with optimistic updates
   */
  const useCorsUpdate = useCallback((options: UseCorsMutationOptions<CorsConfigUpdateResponse, CorsConfigUpdateForm> = {}) => {
    const { optimistic = true, apiOptions, ...mutationOptions } = options;

    return useMutation({
      mutationFn: async (data: CorsConfigUpdateForm): Promise<CorsConfigUpdateResponse> => {
        // Validate input data
        const validatedData = validateCorsUpdate(data);

        const requestOptions: ApiRequestOptions = {
          ...apiOptions,
          snackbarSuccess: 'CORS configuration updated successfully',
          snackbarError: 'Failed to update CORS configuration',
        };

        const response = await apiPut<CorsConfigUpdateResponse>(
          CORS_ENDPOINTS.BY_ID(validatedData.id),
          validatedData,
          requestOptions
        );

        return response;
      },
      ...DEFAULT_MUTATION_OPTIONS,
      ...mutationOptions,
      onMutate: async (data) => {
        if (optimistic) {
          // Cancel outgoing refetches
          await queryClient.cancelQueries({ queryKey: CORS_QUERY_KEYS.DETAIL(data.id) });
          await queryClient.cancelQueries({ queryKey: CORS_QUERY_KEYS.LISTS() });

          // Get previous data for rollback
          const previousDetail = queryClient.getQueryData<CorsConfigResponse>(
            CORS_QUERY_KEYS.DETAIL(data.id)
          );

          // Create optimistic update
          if (previousDetail) {
            const optimisticConfig: CorsConfig = {
              ...previousDetail.resource,
              ...data,
              lastModifiedDate: new Date().toISOString(),
            };

            // Store rollback data
            const rollbackKey = `update-${data.id}-${Date.now()}`;
            optimisticUpdatesRef.current.set(rollbackKey, {
              type: 'update',
              previous: previousDetail.resource,
              optimistic: optimisticConfig,
            });

            // Optimistically update caches
            queryClient.setQueryData<CorsConfigResponse>(
              CORS_QUERY_KEYS.DETAIL(data.id),
              { ...previousDetail, resource: optimisticConfig }
            );
            updateCorsListCache(optimisticConfig);

            return { rollbackKey, previousDetail: previousDetail.resource };
          }
        }

        return mutationOptions.onMutate?.(data);
      },
      onSuccess: (response, variables, context) => {
        // Update caches with server response
        queryClient.setQueryData<CorsConfigResponse>(
          CORS_QUERY_KEYS.DETAIL(variables.id),
          response
        );
        updateCorsListCache(response.resource);

        if (optimistic && context?.rollbackKey) {
          // Clean up optimistic update reference
          optimisticUpdatesRef.current.delete(context.rollbackKey);
        }

        // Invalidate related queries
        invalidateAllCors();

        return mutationOptions.onSuccess?.(response, variables, context);
      },
      onError: (error, variables, context) => {
        if (optimistic && context?.rollbackKey) {
          // Rollback optimistic update
          const rollbackData = optimisticUpdatesRef.current.get(context.rollbackKey);
          if (rollbackData?.type === 'update' && rollbackData.previous) {
            queryClient.setQueryData<CorsConfigResponse>(
              CORS_QUERY_KEYS.DETAIL(variables.id),
              { 
                success: true, 
                resource: rollbackData.previous,
                error: null,
                count: 1,
                meta: {} 
              }
            );
            updateCorsListCache(rollbackData.previous);
          }
          
          // Clean up optimistic update reference
          optimisticUpdatesRef.current.delete(context.rollbackKey);
        }

        return mutationOptions.onError?.(error, variables, context);
      },
    });
  }, [queryClient, updateCorsListCache, invalidateAllCors]);

  /**
   * Toggles CORS configuration enabled status with optimistic updates
   */
  const useCorsToggle = useCallback((options: UseCorsMutationOptions<CorsConfigUpdateResponse, CorsConfigToggleForm> = {}) => {
    const { optimistic = true, apiOptions, ...mutationOptions } = options;

    return useMutation({
      mutationFn: async (data: CorsConfigToggleForm): Promise<CorsConfigUpdateResponse> => {
        // Validate input data
        const validatedData = validateCorsToggle(data);

        const requestOptions: ApiRequestOptions = {
          ...apiOptions,
          snackbarSuccess: `CORS configuration ${validatedData.enabled ? 'enabled' : 'disabled'} successfully`,
          snackbarError: 'Failed to update CORS configuration status',
        };

        const response = await apiPut<CorsConfigUpdateResponse>(
          CORS_ENDPOINTS.BY_ID(validatedData.id),
          { enabled: validatedData.enabled },
          requestOptions
        );

        return response;
      },
      ...DEFAULT_MUTATION_OPTIONS,
      ...mutationOptions,
      onMutate: async (data) => {
        if (optimistic) {
          // Cancel outgoing refetches
          await queryClient.cancelQueries({ queryKey: CORS_QUERY_KEYS.DETAIL(data.id) });
          await queryClient.cancelQueries({ queryKey: CORS_QUERY_KEYS.LISTS() });

          // Get previous data for rollback
          const previousDetail = queryClient.getQueryData<CorsConfigResponse>(
            CORS_QUERY_KEYS.DETAIL(data.id)
          );

          if (previousDetail) {
            const optimisticConfig: CorsConfig = {
              ...previousDetail.resource,
              enabled: data.enabled,
              lastModifiedDate: new Date().toISOString(),
            };

            // Store rollback data
            const rollbackKey = `toggle-${data.id}-${Date.now()}`;
            optimisticUpdatesRef.current.set(rollbackKey, {
              type: 'toggle',
              previous: previousDetail.resource,
              optimistic: optimisticConfig,
            });

            // Optimistically update caches
            queryClient.setQueryData<CorsConfigResponse>(
              CORS_QUERY_KEYS.DETAIL(data.id),
              { ...previousDetail, resource: optimisticConfig }
            );
            updateCorsListCache(optimisticConfig);

            return { rollbackKey, previousDetail: previousDetail.resource };
          }
        }

        return mutationOptions.onMutate?.(data);
      },
      onSuccess: (response, variables, context) => {
        // Update caches with server response
        queryClient.setQueryData<CorsConfigResponse>(
          CORS_QUERY_KEYS.DETAIL(variables.id),
          response
        );
        updateCorsListCache(response.resource);

        if (optimistic && context?.rollbackKey) {
          // Clean up optimistic update reference
          optimisticUpdatesRef.current.delete(context.rollbackKey);
        }

        return mutationOptions.onSuccess?.(response, variables, context);
      },
      onError: (error, variables, context) => {
        if (optimistic && context?.rollbackKey) {
          // Rollback optimistic update
          const rollbackData = optimisticUpdatesRef.current.get(context.rollbackKey);
          if (rollbackData?.type === 'toggle' && rollbackData.previous) {
            queryClient.setQueryData<CorsConfigResponse>(
              CORS_QUERY_KEYS.DETAIL(variables.id),
              { 
                success: true, 
                resource: rollbackData.previous,
                error: null,
                count: 1,
                meta: {} 
              }
            );
            updateCorsListCache(rollbackData.previous);
          }
          
          // Clean up optimistic update reference
          optimisticUpdatesRef.current.delete(context.rollbackKey);
        }

        return mutationOptions.onError?.(error, variables, context);
      },
    });
  }, [queryClient, updateCorsListCache]);

  /**
   * Deletes a CORS configuration with optimistic updates
   */
  const useCorsDelete = useCallback((options: UseCorsMutationOptions<CorsConfigDeleteResponse, { id: number }> = {}) => {
    const { optimistic = true, apiOptions, ...mutationOptions } = options;

    return useMutation({
      mutationFn: async (data: { id: number }): Promise<CorsConfigDeleteResponse> => {
        // Validate input data
        const validatedData = validateCorsDelete(data);

        const requestOptions: ApiRequestOptions = {
          ...apiOptions,
          snackbarSuccess: 'CORS configuration deleted successfully',
          snackbarError: 'Failed to delete CORS configuration',
        };

        const response = await apiDelete<CorsConfigDeleteResponse>(
          CORS_ENDPOINTS.BY_ID(validatedData.id),
          requestOptions
        );

        return response;
      },
      ...DEFAULT_MUTATION_OPTIONS,
      ...mutationOptions,
      onMutate: async (data) => {
        if (optimistic) {
          // Cancel outgoing refetches
          await queryClient.cancelQueries({ queryKey: CORS_QUERY_KEYS.DETAIL(data.id) });
          await queryClient.cancelQueries({ queryKey: CORS_QUERY_KEYS.LISTS() });

          // Get previous data for rollback
          const previousDetail = queryClient.getQueryData<CorsConfigResponse>(
            CORS_QUERY_KEYS.DETAIL(data.id)
          );

          // Store rollback data
          const rollbackKey = `delete-${data.id}-${Date.now()}`;
          if (previousDetail) {
            optimisticUpdatesRef.current.set(rollbackKey, {
              type: 'delete',
              previous: previousDetail.resource,
            });
          }

          // Optimistically remove from cache
          removeCorsFromCache(data.id);

          return { rollbackKey, previousDetail: previousDetail?.resource };
        }

        return mutationOptions.onMutate?.(data);
      },
      onSuccess: (response, variables, context) => {
        // Ensure removal from cache
        removeCorsFromCache(variables.id);

        if (optimistic && context?.rollbackKey) {
          // Clean up optimistic update reference
          optimisticUpdatesRef.current.delete(context.rollbackKey);
        }

        // Invalidate related queries
        invalidateAllCors();

        return mutationOptions.onSuccess?.(response, variables, context);
      },
      onError: (error, variables, context) => {
        if (optimistic && context?.rollbackKey) {
          // Rollback optimistic update
          const rollbackData = optimisticUpdatesRef.current.get(context.rollbackKey);
          if (rollbackData?.type === 'delete' && rollbackData.previous) {
            queryClient.setQueryData<CorsConfigResponse>(
              CORS_QUERY_KEYS.DETAIL(variables.id),
              { 
                success: true, 
                resource: rollbackData.previous,
                error: null,
                count: 1,
                meta: {} 
              }
            );
            updateCorsListCache(rollbackData.previous);
          }
          
          // Clean up optimistic update reference
          optimisticUpdatesRef.current.delete(context.rollbackKey);
        }

        return mutationOptions.onError?.(error, variables, context);
      },
    });
  }, [queryClient, removeCorsFromCache, updateCorsListCache, invalidateAllCors]);

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Prefetches CORS configurations list for performance optimization
   */
  const prefetchCorsList = useCallback(async (query?: CorsConfigQuery) => {
    await queryClient.prefetchQuery({
      queryKey: CORS_QUERY_KEYS.LIST(query),
      queryFn: async () => {
        const validatedQuery = query ? validateCorsQuery(query) : undefined;
        return apiGet<CorsConfigListResponse>(CORS_ENDPOINTS.BASE, validatedQuery);
      },
      ...DEFAULT_QUERY_OPTIONS,
    });
  }, [queryClient]);

  /**
   * Prefetches a specific CORS configuration by ID
   */
  const prefetchCorsDetail = useCallback(async (id: number) => {
    await queryClient.prefetchQuery({
      queryKey: CORS_QUERY_KEYS.DETAIL(id),
      queryFn: async () => {
        return apiGet<CorsConfigResponse>(CORS_ENDPOINTS.BY_ID(id));
      },
      ...DEFAULT_QUERY_OPTIONS,
    });
  }, [queryClient]);

  /**
   * Gets cached CORS configuration data without triggering a request
   */
  const getCachedCorsDetail = useCallback((id: number): CorsConfig | undefined => {
    const data = queryClient.getQueryData<CorsConfigResponse>(
      CORS_QUERY_KEYS.DETAIL(id)
    );
    return data?.resource;
  }, [queryClient]);

  /**
   * Gets cached CORS configurations list without triggering a request
   */
  const getCachedCorsList = useCallback((query?: CorsConfigQuery): CorsConfig[] => {
    const data = queryClient.getQueryData<CorsConfigListResponse>(
      CORS_QUERY_KEYS.LIST(query)
    );
    return data?.resource || [];
  }, [queryClient]);

  // ============================================================================
  // Return Hook Interface
  // ============================================================================

  return useMemo(() => ({
    // Query operations
    useCorsList,
    useCorsDetail,

    // Mutation operations
    useCorsCreate,
    useCorsUpdate,
    useCorsToggle,
    useCorsDelete,

    // Cache management
    invalidateAllCors,
    updateCorsListCache,
    removeCorsFromCache,

    // Utility functions
    prefetchCorsList,
    prefetchCorsDetail,
    getCachedCorsDetail,
    getCachedCorsList,

    // Query keys (useful for external cache management)
    queryKeys: CORS_QUERY_KEYS,
  }), [
    useCorsList,
    useCorsDetail,
    useCorsCreate,
    useCorsUpdate,
    useCorsToggle,
    useCorsDelete,
    invalidateAllCors,
    updateCorsListCache,
    removeCorsFromCache,
    prefetchCorsList,
    prefetchCorsDetail,
    getCachedCorsDetail,
    getCachedCorsList,
  ]);
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Simplified hook for fetching CORS configurations list
 */
export function useCorsList(options?: UseCorsListOptions) {
  const { useCorsList } = useCorsOperations();
  return useCorsList(options);
}

/**
 * Simplified hook for fetching a specific CORS configuration
 */
export function useCorsDetail(id: number, options?: UseCorsDetailOptions) {
  const { useCorsDetail } = useCorsOperations();
  return useCorsDetail(id, options);
}

/**
 * Simplified hook for creating CORS configurations
 */
export function useCorsCreate(options?: UseCorsMutationOptions<CorsConfigCreateResponse, CorsConfigCreateForm>) {
  const { useCorsCreate } = useCorsOperations();
  return useCorsCreate(options);
}

/**
 * Simplified hook for updating CORS configurations
 */
export function useCorsUpdate(options?: UseCorsMutationOptions<CorsConfigUpdateResponse, CorsConfigUpdateForm>) {
  const { useCorsUpdate } = useCorsOperations();
  return useCorsUpdate(options);
}

/**
 * Simplified hook for toggling CORS configuration status
 */
export function useCorsToggle(options?: UseCorsMutationOptions<CorsConfigUpdateResponse, CorsConfigToggleForm>) {
  const { useCorsToggle } = useCorsOperations();
  return useCorsToggle(options);
}

/**
 * Simplified hook for deleting CORS configurations
 */
export function useCorsDelete(options?: UseCorsMutationOptions<CorsConfigDeleteResponse, { id: number }>) {
  const { useCorsDelete } = useCorsOperations();
  return useCorsDelete(options);
}

// ============================================================================
// Export default hook and utilities
// ============================================================================

export default useCorsOperations;

/**
 * Export commonly used types for external consumption
 */
export type {
  UseCorsListOptions,
  UseCorsDetailOptions,
  UseCorsMutationOptions,
  CorsConfig,
  CorsConfigCreate,
  CorsConfigUpdate,
  CorsConfigQuery,
  CorsOperationStatus,
  HttpMethod,
};