/**
 * CORS Operations Hook
 * 
 * Custom React hook providing comprehensive CORS configuration management operations
 * including CORS entry creation, updates, deletion, and status monitoring. Implements
 * SWR/React Query patterns for intelligent caching, optimistic updates, and error
 * recovery with comprehensive loading states and mutation management.
 * 
 * Features:
 * - React Query for intelligent caching and synchronization  
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * - API responses under 2 seconds per React/Next.js Integration Requirements
 * - Optimistic updates with rollback per Section 4.1.3 state synchronization error handling
 * - MSW integration for development and testing
 * - Comprehensive error handling and retry logic
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { apiClient } from '../../../lib/api-client';
import type { CorsConfigData, CreateCorsRequest, UpdateCorsRequest, ListCorsResponse, CorsOperationResult } from '../../../types/cors';
import type { GenericListResponse, GenericCreateResponse, GenericUpdateResponse, RequestOptions } from '../../../types/generic-http';

/**
 * CORS Configuration Data Interface
 * Represents a CORS configuration entry with all required fields
 */
interface CorsConfigData {
  id: number;
  path: string;
  description: string;
  enabled: boolean;
  origin: string;
  header: string;
  exposedHeader: string | null;
  maxAge: number;
  method: string[];
  supportsCredentials: boolean;
  createdById: number | null;
  createdDate: string | null;
  lastModifiedById: number | null;
  lastModifiedDate: string | null;
}

/**
 * CORS Request Types
 */
interface CreateCorsRequest {
  resource: Array<Partial<CorsConfigData>>;
}

interface UpdateCorsRequest extends Partial<CorsConfigData> {}

interface ListCorsResponse extends GenericListResponse<CorsConfigData> {}

interface CorsOperationResult {
  success: boolean;
  data?: CorsConfigData;
  error?: string;
}

/**
 * Query Keys for CORS operations
 */
const CORS_QUERY_KEYS = {
  all: ['cors'] as const,
  lists: () => [...CORS_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: string) => [...CORS_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...CORS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...CORS_QUERY_KEYS.details(), id] as const,
} as const;

/**
 * CORS Operations Configuration
 */
const CORS_CONFIG = {
  staleTime: 30000, // 30 seconds - cache fresh for this duration
  cacheTime: 300000, // 5 minutes - keep in cache when component unmounts
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: false,
  refetchOnMount: 'always' as const,
} as const;

/**
 * CORS API endpoints
 */
const CORS_ENDPOINTS = {
  base: '/system/cors',
  detail: (id: number) => `/system/cors/${id}`,
} as const;

/**
 * Hook options interface
 */
interface UseCorsOperationsOptions {
  /**
   * Enable automatic refetching on window focus
   */
  refetchOnFocus?: boolean;
  
  /**
   * Override default stale time (ms)
   */
  staleTime?: number;
  
  /**
   * Enable optimistic updates
   */
  optimisticUpdates?: boolean;
  
  /**
   * Custom error handler
   */
  onError?: (error: Error) => void;
  
  /**
   * Custom success handler
   */
  onSuccess?: (data: any) => void;
}

/**
 * CORS Operations Hook
 * 
 * Provides comprehensive CORS configuration management with intelligent caching,
 * optimistic updates, and error recovery capabilities.
 */
export function useCorsOperations(options: UseCorsOperationsOptions = {}) {
  const queryClient = useQueryClient();
  
  const {
    refetchOnFocus = false,
    staleTime = CORS_CONFIG.staleTime,
    optimisticUpdates = true,
    onError,
    onSuccess,
  } = options;

  /**
   * Fetch all CORS configurations
   * Implements intelligent caching with cache hit responses under 50ms
   */
  const {
    data: corsConfigurations,
    isLoading: isLoadingList,
    isError: isErrorList,
    error: listError,
    refetch: refetchList,
    isFetching: isFetchingList,
  } = useQuery({
    queryKey: CORS_QUERY_KEYS.list(),
    queryFn: async (): Promise<CorsConfigData[]> => {
      try {
        const response = await apiClient.get<ListCorsResponse>(CORS_ENDPOINTS.base, {
          headers: {
            'Cache-Control': 'no-cache, private',
            'show-loading': '',
          },
        });
        
        return response.resource || [];
      } catch (error) {
        console.error('Failed to fetch CORS configurations:', error);
        throw error;
      }
    },
    staleTime,
    gcTime: CORS_CONFIG.cacheTime,
    retry: CORS_CONFIG.retry,
    retryDelay: CORS_CONFIG.retryDelay,
    refetchOnWindowFocus: refetchOnFocus,
    refetchOnMount: CORS_CONFIG.refetchOnMount,
    throwOnError: false,
  });

  /**
   * Fetch single CORS configuration by ID
   */
  const useCorsDetail = useCallback((id: number) => {
    return useQuery({
      queryKey: CORS_QUERY_KEYS.detail(id),
      queryFn: async (): Promise<CorsConfigData> => {
        try {
          const response = await apiClient.get<CorsConfigData>(`${CORS_ENDPOINTS.detail(id)}?fields=*`);
          return response;
        } catch (error) {
          console.error(`Failed to fetch CORS configuration ${id}:`, error);
          throw error;
        }
      },
      enabled: !!id,
      staleTime,
      gcTime: CORS_CONFIG.cacheTime,
      retry: CORS_CONFIG.retry,
      retryDelay: CORS_CONFIG.retryDelay,
      throwOnError: false,
    });
  }, [staleTime]);

  /**
   * Create new CORS configuration
   * Implements optimistic updates with rollback capabilities
   */
  const createCorsMutation = useMutation({
    mutationFn: async (corsData: Partial<CorsConfigData>): Promise<CorsConfigData> => {
      const payload: CreateCorsRequest = {
        resource: [corsData],
      };

      try {
        const response = await apiClient.post<GenericCreateResponse>(
          `${CORS_ENDPOINTS.base}?fields=*`,
          payload
        );
        
        if (!response.resource?.[0]) {
          throw new Error('Invalid response format from server');
        }
        
        return response.resource[0] as CorsConfigData;
      } catch (error: any) {
        console.error('Failed to create CORS configuration:', error);
        const errorMessage = error?.response?.data?.error?.context?.resource?.[0]?.message 
          || error?.response?.data?.error?.message 
          || error?.message 
          || 'Failed to create CORS configuration';
        throw new Error(errorMessage);
      }
    },
    onMutate: async (newCors) => {
      if (!optimisticUpdates) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: CORS_QUERY_KEYS.lists() });

      // Snapshot previous value
      const previousCors = queryClient.getQueryData<CorsConfigData[]>(CORS_QUERY_KEYS.list());

      // Optimistically update the cache
      if (previousCors) {
        const optimisticCors: CorsConfigData = {
          id: Date.now(), // Temporary ID
          path: newCors.path || '',
          description: newCors.description || '',
          enabled: newCors.enabled ?? true,
          origin: newCors.origin || '',
          header: newCors.header || '',
          exposedHeader: newCors.exposedHeader || null,
          maxAge: newCors.maxAge || 0,
          method: newCors.method || [],
          supportsCredentials: newCors.supportsCredentials ?? false,
          createdById: null,
          createdDate: new Date().toISOString(),
          lastModifiedById: null,
          lastModifiedDate: new Date().toISOString(),
        };

        queryClient.setQueryData<CorsConfigData[]>(
          CORS_QUERY_KEYS.list(),
          [...previousCors, optimisticCors]
        );
      }

      return { previousCors };
    },
    onError: (error, newCors, context) => {
      // Rollback on error
      if (context?.previousCors) {
        queryClient.setQueryData(CORS_QUERY_KEYS.list(), context.previousCors);
      }
      
      console.error('Create CORS mutation error:', error);
      onError?.(error as Error);
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: CORS_QUERY_KEYS.lists() });
      onSuccess?.(data);
    },
    onSettled: () => {
      // Always refetch after 3 seconds to ensure consistency
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: CORS_QUERY_KEYS.lists() });
      }, 3000);
    },
  });

  /**
   * Update existing CORS configuration
   * Implements optimistic updates with rollback capabilities
   */
  const updateCorsMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateCorsRequest }): Promise<CorsConfigData> => {
      try {
        const response = await apiClient.post<GenericUpdateResponse>(
          CORS_ENDPOINTS.detail(id),
          data,
          {
            headers: {
              'X-Http-Method': 'PUT',
            },
          }
        );
        
        return response as CorsConfigData;
      } catch (error: any) {
        console.error(`Failed to update CORS configuration ${id}:`, error);
        const errorMessage = error?.response?.data?.error?.message 
          || error?.message 
          || 'Failed to update CORS configuration';
        throw new Error(errorMessage);
      }
    },
    onMutate: async ({ id, data }) => {
      if (!optimisticUpdates) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: CORS_QUERY_KEYS.detail(id) });
      await queryClient.cancelQueries({ queryKey: CORS_QUERY_KEYS.lists() });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData<CorsConfigData>(CORS_QUERY_KEYS.detail(id));
      const previousList = queryClient.getQueryData<CorsConfigData[]>(CORS_QUERY_KEYS.list());

      // Optimistically update detail cache
      if (previousDetail) {
        const optimisticDetail = {
          ...previousDetail,
          ...data,
          lastModifiedDate: new Date().toISOString(),
        };
        queryClient.setQueryData(CORS_QUERY_KEYS.detail(id), optimisticDetail);
      }

      // Optimistically update list cache
      if (previousList) {
        const optimisticList = previousList.map(cors => 
          cors.id === id 
            ? { ...cors, ...data, lastModifiedDate: new Date().toISOString() }
            : cors
        );
        queryClient.setQueryData(CORS_QUERY_KEYS.list(), optimisticList);
      }

      return { previousDetail, previousList };
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(CORS_QUERY_KEYS.detail(id), context.previousDetail);
      }
      if (context?.previousList) {
        queryClient.setQueryData(CORS_QUERY_KEYS.list(), context.previousList);
      }
      
      console.error('Update CORS mutation error:', error);
      onError?.(error as Error);
    },
    onSuccess: (data, { id }) => {
      // Update caches with real data
      queryClient.setQueryData(CORS_QUERY_KEYS.detail(id), data);
      queryClient.invalidateQueries({ queryKey: CORS_QUERY_KEYS.lists() });
      onSuccess?.(data);
    },
  });

  /**
   * Delete CORS configuration
   * Implements optimistic updates with rollback capabilities
   */
  const deleteCorsMutation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      try {
        await apiClient.post(
          `${CORS_ENDPOINTS.detail(id)}?fields=*`,
          null,
          {
            headers: {
              'X-Http-Method': 'DELETE',
            },
          }
        );
      } catch (error: any) {
        console.error(`Failed to delete CORS configuration ${id}:`, error);
        const errorMessage = error?.response?.data?.error?.message 
          || error?.message 
          || 'Failed to delete CORS configuration';
        throw new Error(errorMessage);
      }
    },
    onMutate: async (id) => {
      if (!optimisticUpdates) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: CORS_QUERY_KEYS.lists() });

      // Snapshot previous value
      const previousList = queryClient.getQueryData<CorsConfigData[]>(CORS_QUERY_KEYS.list());

      // Optimistically remove from cache
      if (previousList) {
        const optimisticList = previousList.filter(cors => cors.id !== id);
        queryClient.setQueryData(CORS_QUERY_KEYS.list(), optimisticList);
      }

      return { previousList };
    },
    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousList) {
        queryClient.setQueryData(CORS_QUERY_KEYS.list(), context.previousList);
      }
      
      console.error('Delete CORS mutation error:', error);
      onError?.(error as Error);
    },
    onSuccess: (_, id) => {
      // Remove from detail cache and invalidate list
      queryClient.removeQueries({ queryKey: CORS_QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: CORS_QUERY_KEYS.lists() });
      onSuccess?.(id);
    },
  });

  /**
   * Bulk delete CORS configurations
   */
  const bulkDeleteCorsMutation = useMutation({
    mutationFn: async (ids: number[]): Promise<void> => {
      try {
        await apiClient.post(
          `${CORS_ENDPOINTS.base}?ids=${ids.join(',')}&fields=*`,
          null,
          {
            headers: {
              'X-Http-Method': 'DELETE',
            },
          }
        );
      } catch (error: any) {
        console.error('Failed to bulk delete CORS configurations:', error);
        const errorMessage = error?.response?.data?.error?.message 
          || error?.message 
          || 'Failed to delete CORS configurations';
        throw new Error(errorMessage);
      }
    },
    onMutate: async (ids) => {
      if (!optimisticUpdates) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: CORS_QUERY_KEYS.lists() });

      // Snapshot previous value
      const previousList = queryClient.getQueryData<CorsConfigData[]>(CORS_QUERY_KEYS.list());

      // Optimistically remove from cache
      if (previousList) {
        const optimisticList = previousList.filter(cors => !ids.includes(cors.id));
        queryClient.setQueryData(CORS_QUERY_KEYS.list(), optimisticList);
      }

      return { previousList };
    },
    onError: (error, ids, context) => {
      // Rollback on error
      if (context?.previousList) {
        queryClient.setQueryData(CORS_QUERY_KEYS.list(), context.previousList);
      }
      
      console.error('Bulk delete CORS mutation error:', error);
      onError?.(error as Error);
    },
    onSuccess: (_, ids) => {
      // Remove from detail caches and invalidate list
      ids.forEach(id => {
        queryClient.removeQueries({ queryKey: CORS_QUERY_KEYS.detail(id) });
      });
      queryClient.invalidateQueries({ queryKey: CORS_QUERY_KEYS.lists() });
      onSuccess?.(ids);
    },
  });

  /**
   * Utility functions
   */
  const refreshCorsConfigurations = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: CORS_QUERY_KEYS.lists() });
  }, [queryClient]);

  const getCorsConfigurationFromCache = useCallback((id: number): CorsConfigData | undefined => {
    return queryClient.getQueryData<CorsConfigData>(CORS_QUERY_KEYS.detail(id));
  }, [queryClient]);

  const prefetchCorsConfiguration = useCallback(async (id: number) => {
    return queryClient.prefetchQuery({
      queryKey: CORS_QUERY_KEYS.detail(id),
      queryFn: async (): Promise<CorsConfigData> => {
        const response = await apiClient.get<CorsConfigData>(`${CORS_ENDPOINTS.detail(id)}?fields=*`);
        return response;
      },
      staleTime,
    });
  }, [queryClient, staleTime]);

  /**
   * Computed states for better DX
   */
  const isAnyMutationLoading = useMemo(() => 
    createCorsMutation.isPending || 
    updateCorsMutation.isPending || 
    deleteCorsMutation.isPending ||
    bulkDeleteCorsMutation.isPending
  , [
    createCorsMutation.isPending,
    updateCorsMutation.isPending,
    deleteCorsMutation.isPending,
    bulkDeleteCorsMutation.isPending,
  ]);

  const hasError = useMemo(() => 
    isErrorList || 
    createCorsMutation.isError || 
    updateCorsMutation.isError || 
    deleteCorsMutation.isError ||
    bulkDeleteCorsMutation.isError
  , [
    isErrorList,
    createCorsMutation.isError,
    updateCorsMutation.isError,
    deleteCorsMutation.isError,
    bulkDeleteCorsMutation.isError,
  ]);

  const lastError = useMemo(() => 
    listError || 
    createCorsMutation.error || 
    updateCorsMutation.error || 
    deleteCorsMutation.error ||
    bulkDeleteCorsMutation.error
  , [
    listError,
    createCorsMutation.error,
    updateCorsMutation.error,
    deleteCorsMutation.error,
    bulkDeleteCorsMutation.error,
  ]);

  return {
    // Data
    corsConfigurations: corsConfigurations || [],
    
    // Loading states
    isLoadingList,
    isFetchingList,
    isAnyMutationLoading,
    
    // Error states
    isErrorList,
    hasError,
    lastError,
    
    // Mutations
    createCors: createCorsMutation.mutate,
    updateCors: updateCorsMutation.mutate,
    deleteCors: deleteCorsMutation.mutate,
    bulkDeleteCors: bulkDeleteCorsMutation.mutate,
    
    // Mutation states
    isCreating: createCorsMutation.isPending,
    isUpdating: updateCorsMutation.isPending,
    isDeleting: deleteCorsMutation.isPending,
    isBulkDeleting: bulkDeleteCorsMutation.isPending,
    
    // Mutation results
    createError: createCorsMutation.error,
    updateError: updateCorsMutation.error,
    deleteError: deleteCorsMutation.error,
    bulkDeleteError: bulkDeleteCorsMutation.error,
    
    // Utilities
    refreshCorsConfigurations,
    refetchList,
    getCorsConfigurationFromCache,
    prefetchCorsConfiguration,
    useCorsDetail,
    
    // Query keys for external use
    queryKeys: CORS_QUERY_KEYS,
  };
}

/**
 * Hook for fetching a single CORS configuration
 * Standalone hook for component-level usage
 */
export function useCorsConfiguration(id: number, options: Omit<UseCorsOperationsOptions, 'optimisticUpdates'> = {}) {
  const { staleTime = CORS_CONFIG.staleTime, onError } = options;

  return useQuery({
    queryKey: CORS_QUERY_KEYS.detail(id),
    queryFn: async (): Promise<CorsConfigData> => {
      try {
        const response = await apiClient.get<CorsConfigData>(`${CORS_ENDPOINTS.detail(id)}?fields=*`);
        return response;
      } catch (error) {
        console.error(`Failed to fetch CORS configuration ${id}:`, error);
        onError?.(error as Error);
        throw error;
      }
    },
    enabled: !!id,
    staleTime,
    gcTime: CORS_CONFIG.cacheTime,
    retry: CORS_CONFIG.retry,
    retryDelay: CORS_CONFIG.retryDelay,
    throwOnError: false,
  });
}

export default useCorsOperations;