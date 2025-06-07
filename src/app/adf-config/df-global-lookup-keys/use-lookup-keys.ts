/**
 * Custom React hook for global lookup keys management operations.
 * 
 * Provides comprehensive CRUD operations, unique name validation, and real-time 
 * data synchronization using SWR and React Query patterns. Implements intelligent 
 * caching, optimistic updates, and error recovery with comprehensive loading states 
 * and mutation management.
 * 
 * Replaces Angular DfBaseCrudService lookup keys operations per Section 4.3 
 * state management workflows with React-native patterns optimized for React 19 
 * and Next.js 15.1+.
 * 
 * @fileoverview Global lookup keys management hook
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useCallback, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  type UseQueryOptions,
  type UseMutationOptions 
} from '@tanstack/react-query';
import { z } from 'zod';
import { 
  apiGet, 
  apiPost, 
  apiPut, 
  apiDelete, 
  type ApiListResponse,
  type ApiResourceResponse,
  type ApiRequestOptions 
} from '../../../lib/api-client';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Global lookup key record structure
 */
export interface LookupKey {
  /** Unique identifier */
  id: number;
  /** Lookup key name - must be unique */
  name: string;
  /** Lookup key value */
  value: string;
  /** Optional description */
  description?: string;
  /** Is lookup key active */
  is_active: boolean;
  /** Creation timestamp */
  created_date: string;
  /** Last modified timestamp */
  last_modified_date: string;
  /** Created by user ID */
  created_by_id?: number;
  /** Last modified by user ID */
  last_modified_by_id?: number;
}

/**
 * Create lookup key input data
 */
export interface CreateLookupKeyData {
  name: string;
  value: string;
  description?: string;
  is_active?: boolean;
}

/**
 * Update lookup key input data
 */
export interface UpdateLookupKeyData {
  name?: string;
  value?: string;
  description?: string;
  is_active?: boolean;
}

/**
 * Lookup key query parameters
 */
export interface LookupKeyQueryParams {
  /** Filter by name pattern */
  filter?: string;
  /** Sort order */
  sort?: string;
  /** Fields to include */
  fields?: string;
  /** Number of records per page */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Include total count */
  include_count?: boolean;
  /** Force refresh from server */
  refresh?: boolean;
}

/**
 * Validation schema for lookup key creation/update
 */
export const lookupKeySchema = z.object({
  name: z.string()
    .min(1, 'Lookup key name is required')
    .max(80, 'Lookup key name must be less than 80 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Lookup key name can only contain letters, numbers, underscores, and hyphens'),
  value: z.string()
    .min(1, 'Lookup key value is required')
    .max(4000, 'Lookup key value must be less than 4000 characters'),
  description: z.string()
    .max(255, 'Description must be less than 255 characters')
    .optional(),
  is_active: z.boolean().optional().default(true),
});

/**
 * Hook options configuration
 */
export interface UseLookupKeysOptions {
  /** Enable SWR for real-time synchronization */
  enableSWR?: boolean;
  /** Custom cache time in milliseconds */
  cacheTime?: number;
  /** Custom stale time in milliseconds */
  staleTime?: number;
  /** Enable optimistic updates */
  enableOptimistic?: boolean;
  /** Custom retry configuration */
  retry?: number | ((failureCount: number, error: Error) => boolean);
  /** Initial query parameters */
  initialParams?: LookupKeyQueryParams;
}

// ============================================================================
// API Endpoints
// ============================================================================

const LOOKUP_KEYS_ENDPOINT = '/api/v2/system/lookup_key';

// ============================================================================
// Query Keys
// ============================================================================

const QUERY_KEYS = {
  all: ['lookup-keys'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (params?: LookupKeyQueryParams) => [...QUERY_KEYS.lists(), params] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...QUERY_KEYS.details(), id] as const,
  validation: () => [...QUERY_KEYS.all, 'validation'] as const,
  uniqueName: (name: string) => [...QUERY_KEYS.validation(), 'unique-name', name] as const,
} as const;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch lookup keys with caching optimizations
 */
async function fetchLookupKeys(
  params?: LookupKeyQueryParams,
  options?: ApiRequestOptions
): Promise<ApiListResponse<LookupKey>> {
  const queryParams = {
    ...params,
    // Optimize for cache hit responses under 50ms
    include_count: params?.include_count ?? true,
    fields: params?.fields ?? 'id,name,value,description,is_active,created_date',
  };

  const requestOptions: ApiRequestOptions = {
    ...options,
    // Cache control for intelligent caching
    includeCacheControl: true,
    // Optimize for API responses under 2 seconds
    signal: options?.signal ?? AbortSignal.timeout(2000),
  };

  return apiGet<ApiListResponse<LookupKey>>(LOOKUP_KEYS_ENDPOINT, {
    ...requestOptions,
    ...queryParams,
  });
}

/**
 * Fetch single lookup key by ID
 */
async function fetchLookupKey(
  id: number,
  options?: ApiRequestOptions
): Promise<LookupKey> {
  const requestOptions: ApiRequestOptions = {
    ...options,
    includeCacheControl: true,
    signal: options?.signal ?? AbortSignal.timeout(2000),
  };

  const response = await apiGet<ApiResourceResponse<LookupKey>>(
    `${LOOKUP_KEYS_ENDPOINT}/${id}`,
    requestOptions
  );

  return response.resource;
}

/**
 * Create new lookup key
 */
async function createLookupKey(
  data: CreateLookupKeyData,
  options?: ApiRequestOptions
): Promise<LookupKey> {
  // Validate input data
  const validatedData = lookupKeySchema.parse(data);

  const requestOptions: ApiRequestOptions = {
    ...options,
    signal: options?.signal ?? AbortSignal.timeout(2000),
    snackbarSuccess: options?.snackbarSuccess ?? 'Lookup key created successfully',
    snackbarError: options?.snackbarError ?? 'Failed to create lookup key',
  };

  const response = await apiPost<ApiResourceResponse<LookupKey>>(
    LOOKUP_KEYS_ENDPOINT,
    { resource: validatedData },
    requestOptions
  );

  return response.resource;
}

/**
 * Update existing lookup key
 */
async function updateLookupKey(
  id: number,
  data: UpdateLookupKeyData,
  options?: ApiRequestOptions
): Promise<LookupKey> {
  // Validate input data (partial schema)
  const partialSchema = lookupKeySchema.partial();
  const validatedData = partialSchema.parse(data);

  const requestOptions: ApiRequestOptions = {
    ...options,
    signal: options?.signal ?? AbortSignal.timeout(2000),
    snackbarSuccess: options?.snackbarSuccess ?? 'Lookup key updated successfully',
    snackbarError: options?.snackbarError ?? 'Failed to update lookup key',
  };

  const response = await apiPut<ApiResourceResponse<LookupKey>>(
    `${LOOKUP_KEYS_ENDPOINT}/${id}`,
    { resource: validatedData },
    requestOptions
  );

  return response.resource;
}

/**
 * Delete lookup key
 */
async function deleteLookupKey(
  id: number,
  options?: ApiRequestOptions
): Promise<void> {
  const requestOptions: ApiRequestOptions = {
    ...options,
    signal: options?.signal ?? AbortSignal.timeout(2000),
    snackbarSuccess: options?.snackbarSuccess ?? 'Lookup key deleted successfully',
    snackbarError: options?.snackbarError ?? 'Failed to delete lookup key',
  };

  await apiDelete(`${LOOKUP_KEYS_ENDPOINT}/${id}`, requestOptions);
}

/**
 * Validate unique lookup key name
 */
async function validateUniqueName(
  name: string,
  excludeId?: number,
  options?: ApiRequestOptions
): Promise<boolean> {
  const filter = excludeId 
    ? `name="${name}" AND id!=${excludeId}`
    : `name="${name}"`;

  const requestOptions: ApiRequestOptions = {
    ...options,
    includeCacheControl: true,
    signal: options?.signal ?? AbortSignal.timeout(1000),
  };

  try {
    const response = await apiGet<ApiListResponse<LookupKey>>(
      LOOKUP_KEYS_ENDPOINT,
      {
        ...requestOptions,
        filter,
        fields: 'id',
        limit: 1,
      }
    );

    return response.resource.length === 0;
  } catch (error) {
    // In case of error, assume name is not unique for safety
    return false;
  }
}

// ============================================================================
// Custom Hook Implementation
// ============================================================================

/**
 * Custom React hook for comprehensive lookup keys management
 * 
 * Provides CRUD operations, unique name validation, and real-time data 
 * synchronization with intelligent caching and optimistic updates.
 */
export function useLookupKeys(
  params?: LookupKeyQueryParams,
  options: UseLookupKeysOptions = {}
) {
  const {
    enableSWR = true,
    cacheTime = 10 * 60 * 1000, // 10 minutes
    staleTime = 5 * 60 * 1000,  // 5 minutes
    enableOptimistic = true,
    retry = 3,
    initialParams,
  } = options;

  const queryClient = useQueryClient();
  const queryParams = useMemo(() => ({ ...initialParams, ...params }), [initialParams, params]);

  // ============================================================================
  // Data Fetching with React Query (Primary)
  // ============================================================================

  const queryOptions: UseQueryOptions<ApiListResponse<LookupKey>, Error> = {
    queryKey: QUERY_KEYS.list(queryParams),
    queryFn: ({ signal }) => fetchLookupKeys(queryParams, { signal }),
    staleTime,
    gcTime: cacheTime, // Updated from cacheTime in React Query v5
    retry,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  };

  const {
    data: queryData,
    error: queryError,
    isLoading: queryLoading,
    isFetching: queryFetching,
    refetch: queryRefetch,
  } = useQuery(queryOptions);

  // ============================================================================
  // Alternative SWR Implementation for Real-time Sync
  // ============================================================================

  const swrKey = enableSWR ? `lookup-keys-${JSON.stringify(queryParams)}` : null;
  const {
    data: swrData,
    error: swrError,
    isLoading: swrLoading,
    mutate: swrMutate,
  } = useSWR(
    swrKey,
    () => fetchLookupKeys(queryParams),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // 30 seconds
      errorRetryCount: retry,
      errorRetryInterval: 1000,
      // Optimize for cache hit responses under 50ms
      dedupingInterval: 50,
    }
  );

  // Combine data sources (prefer React Query for consistency)
  const data = queryData || swrData;
  const error = queryError || swrError;
  const isLoading = queryLoading || swrLoading;
  const isFetching = queryFetching;

  // ============================================================================
  // Mutation Operations with Optimistic Updates
  // ============================================================================

  /**
   * Create lookup key mutation
   */
  const createMutation = useMutation({
    mutationFn: (data: CreateLookupKeyData) => createLookupKey(data),
    onMutate: async (newLookupKey) => {
      if (!enableOptimistic) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.lists() });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<ApiListResponse<LookupKey>>(
        QUERY_KEYS.list(queryParams)
      );

      // Optimistically update cache
      if (previousData) {
        const optimisticKey: LookupKey = {
          id: Date.now(), // Temporary ID
          name: newLookupKey.name,
          value: newLookupKey.value,
          description: newLookupKey.description || '',
          is_active: newLookupKey.is_active ?? true,
          created_date: new Date().toISOString(),
          last_modified_date: new Date().toISOString(),
        };

        queryClient.setQueryData<ApiListResponse<LookupKey>>(
          QUERY_KEYS.list(queryParams),
          {
            ...previousData,
            resource: [...previousData.resource, optimisticKey],
            meta: {
              ...previousData.meta,
              count: (previousData.meta?.count || 0) + 1,
            },
          }
        );
      }

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousData && enableOptimistic) {
        queryClient.setQueryData(
          QUERY_KEYS.list(queryParams),
          context.previousData
        );
      }
    },
    onSuccess: (newLookupKey) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      
      // Update SWR cache if enabled
      if (enableSWR && swrKey) {
        swrMutate();
      }
    },
  });

  /**
   * Update lookup key mutation
   */
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLookupKeyData }) =>
      updateLookupKey(id, data),
    onMutate: async ({ id, data }) => {
      if (!enableOptimistic) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.lists() });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.detail(id) });

      // Snapshot previous values
      const previousListData = queryClient.getQueryData<ApiListResponse<LookupKey>>(
        QUERY_KEYS.list(queryParams)
      );
      const previousDetailData = queryClient.getQueryData<LookupKey>(
        QUERY_KEYS.detail(id)
      );

      // Optimistically update list cache
      if (previousListData) {
        const updatedResource = previousListData.resource.map(item =>
          item.id === id
            ? {
                ...item,
                ...data,
                last_modified_date: new Date().toISOString(),
              }
            : item
        );

        queryClient.setQueryData<ApiListResponse<LookupKey>>(
          QUERY_KEYS.list(queryParams),
          {
            ...previousListData,
            resource: updatedResource,
          }
        );
      }

      // Optimistically update detail cache
      if (previousDetailData) {
        queryClient.setQueryData<LookupKey>(
          QUERY_KEYS.detail(id),
          {
            ...previousDetailData,
            ...data,
            last_modified_date: new Date().toISOString(),
          }
        );
      }

      return { previousListData, previousDetailData };
    },
    onError: (error, { id }, context) => {
      // Rollback optimistic updates
      if (enableOptimistic && context) {
        if (context.previousListData) {
          queryClient.setQueryData(
            QUERY_KEYS.list(queryParams),
            context.previousListData
          );
        }
        if (context.previousDetailData) {
          queryClient.setQueryData(
            QUERY_KEYS.detail(id),
            context.previousDetailData
          );
        }
      }
    },
    onSuccess: (updatedLookupKey, { id }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
      
      // Update SWR cache if enabled
      if (enableSWR && swrKey) {
        swrMutate();
      }
    },
  });

  /**
   * Delete lookup key mutation
   */
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteLookupKey(id),
    onMutate: async (id) => {
      if (!enableOptimistic) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.lists() });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<ApiListResponse<LookupKey>>(
        QUERY_KEYS.list(queryParams)
      );

      // Optimistically remove from cache
      if (previousData) {
        const filteredResource = previousData.resource.filter(item => item.id !== id);
        
        queryClient.setQueryData<ApiListResponse<LookupKey>>(
          QUERY_KEYS.list(queryParams),
          {
            ...previousData,
            resource: filteredResource,
            meta: {
              ...previousData.meta,
              count: Math.max((previousData.meta?.count || 0) - 1, 0),
            },
          }
        );
      }

      return { previousData };
    },
    onError: (error, id, context) => {
      // Rollback optimistic update
      if (context?.previousData && enableOptimistic) {
        queryClient.setQueryData(
          QUERY_KEYS.list(queryParams),
          context.previousData
        );
      }
    },
    onSuccess: (_, id) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.detail(id) });
      
      // Update SWR cache if enabled
      if (enableSWR && swrKey) {
        swrMutate();
      }
    },
  });

  // ============================================================================
  // Unique Name Validation
  // ============================================================================

  const validateNameMutation = useMutation({
    mutationFn: ({ name, excludeId }: { name: string; excludeId?: number }) =>
      validateUniqueName(name, excludeId),
    gcTime: 30000, // Cache validation results for 30 seconds
  });

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Refresh data from server
   */
  const refresh = useCallback(async () => {
    await Promise.all([
      queryRefetch(),
      enableSWR && swrKey ? swrMutate() : Promise.resolve(),
    ]);
  }, [queryRefetch, enableSWR, swrKey, swrMutate]);

  /**
   * Clear all caches
   */
  const clearCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    if (enableSWR) {
      mutate(() => true, undefined, { revalidate: false });
    }
  }, [queryClient, enableSWR]);

  /**
   * Get lookup key by ID from current data
   */
  const getLookupKeyById = useCallback(
    (id: number): LookupKey | undefined => {
      return data?.resource.find(item => item.id === id);
    },
    [data]
  );

  /**
   * Check if name is unique (with debouncing for real-time validation)
   */
  const checkNameUniqueness = useCallback(
    (name: string, excludeId?: number) => {
      return validateNameMutation.mutateAsync({ name, excludeId });
    },
    [validateNameMutation]
  );

  // ============================================================================
  // Return Hook Interface
  // ============================================================================

  return {
    // Data
    data: data?.resource || [],
    meta: data?.meta,
    total: data?.meta?.count || 0,
    
    // Loading states
    isLoading,
    isFetching,
    isValidating: swrLoading,
    
    // Error states
    error,
    
    // CRUD operations
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    
    // Async CRUD operations
    createAsync: createMutation.mutateAsync,
    updateAsync: updateMutation.mutateAsync,
    deleteAsync: deleteMutation.mutateAsync,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Mutation errors
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    
    // Validation
    checkNameUniqueness,
    isValidatingName: validateNameMutation.isPending,
    nameValidationError: validateNameMutation.error,
    
    // Utilities
    refresh,
    clearCache,
    getLookupKeyById,
    
    // Cache control
    queryClient,
    mutate: swrMutate,
  };
}

/**
 * Hook for managing a single lookup key by ID
 */
export function useLookupKey(
  id: number,
  options: Omit<UseLookupKeysOptions, 'initialParams'> = {}
) {
  const {
    cacheTime = 10 * 60 * 1000,
    staleTime = 5 * 60 * 1000,
    retry = 3,
  } = options;

  const queryClient = useQueryClient();

  // Fetch single lookup key
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: ({ signal }) => fetchLookupKey(id, { signal }),
    staleTime,
    gcTime: cacheTime,
    retry,
    enabled: Boolean(id),
  });

  // Update mutation for single key
  const updateMutation = useMutation({
    mutationFn: (updateData: UpdateLookupKeyData) => updateLookupKey(id, updateData),
    onSuccess: (updatedKey) => {
      // Update detail cache
      queryClient.setQueryData(QUERY_KEYS.detail(id), updatedKey);
      // Invalidate list cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });

  // Delete mutation for single key
  const deleteMutation = useMutation({
    mutationFn: () => deleteLookupKey(id),
    onSuccess: () => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.detail(id) });
      // Invalidate list cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });

  return {
    // Data
    data,
    
    // Loading states
    isLoading,
    isFetching,
    
    // Error state
    error,
    
    // Operations
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    delete: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
    
    // Mutation states
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Mutation errors
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    
    // Utilities
    refetch,
    queryClient,
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  useLookupKeys,
  useLookupKey,
  validateUniqueName,
  lookupKeySchema,
  QUERY_KEYS,
};