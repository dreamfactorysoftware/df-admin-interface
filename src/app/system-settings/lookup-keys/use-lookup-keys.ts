/**
 * Lookup Keys Management Hook
 * 
 * Custom React hook providing global lookup keys management operations including
 * CRUD operations, unique name validation, and real-time data synchronization for
 * the system settings interface. Implements TanStack React Query patterns for
 * intelligent caching, optimistic updates, and error recovery with comprehensive
 * loading states and mutation management.
 * 
 * Replaces Angular DfBaseCrudService lookup keys operations with React Query-powered
 * data fetching and mutations, providing cache hit responses under 50ms and API
 * responses under 2 seconds per React/Next.js Integration Requirements.
 * 
 * @fileoverview Global lookup keys management hook with comprehensive CRUD operations
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey
} from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { 
  apiGet, 
  apiPost, 
  apiPut, 
  apiDelete,
  type ApiRequestOptions 
} from '@/lib/api-client';
import { useMutation as useEnhancedMutation } from '@/hooks/useMutation';
import type { 
  ApiResponse,
  ApiListResponse,
  ApiResourceResponse,
  ApiErrorResponse,
  isApiError,
  isApiListResponse
} from '@/types/api';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Lookup key entity structure matching DreamFactory API response
 * Represents global system lookup keys for configuration management
 */
export interface LookupKey {
  /** Unique identifier for the lookup key */
  id?: number;
  /** Unique name identifier for the lookup key */
  name: string;
  /** Value associated with the lookup key */
  value: string;
  /** Whether the lookup key is private (restricted access) */
  private: boolean;
  /** Optional description for the lookup key */
  description?: string;
  /** ISO 8601 timestamp of creation */
  created_date?: string;
  /** ISO 8601 timestamp of last modification */
  last_modified_date?: string;
  /** User ID who created the lookup key */
  created_by_id?: number;
  /** User ID who last modified the lookup key */
  last_modified_by_id?: number;
}

/**
 * Lookup key input data for create and update operations
 * Omits system-generated fields for user input
 */
export interface LookupKeyInput {
  /** Unique name identifier for the lookup key */
  name: string;
  /** Value associated with the lookup key */
  value: string;
  /** Whether the lookup key is private (restricted access) */
  private: boolean;
  /** Optional description for the lookup key */
  description?: string;
}

/**
 * Lookup key update data including ID for modifications
 */
export interface LookupKeyUpdate extends LookupKeyInput {
  /** Required ID for update operations */
  id: number;
}

/**
 * Bulk create request structure for multiple lookup keys
 */
export interface BulkCreateRequest {
  /** Array of lookup key inputs for bulk creation */
  resource: LookupKeyInput[];
}

/**
 * Bulk update request structure for multiple lookup keys
 */
export interface BulkUpdateRequest {
  /** Array of lookup key updates for bulk modification */
  resource: LookupKeyUpdate[];
}

/**
 * Query configuration options for lookup keys fetching
 */
export interface LookupKeysQueryOptions extends Omit<UseQueryOptions<ApiListResponse<LookupKey>>, 'queryKey' | 'queryFn'> {
  /** Filter criteria for lookup keys */
  filter?: string;
  /** Sorting parameters */
  sort?: string;
  /** Field selection for optimization */
  fields?: string;
  /** Include related data */
  related?: string;
  /** Pagination limit */
  limit?: number;
  /** Pagination offset */
  offset?: number;
  /** Include total count in response */
  includeCount?: boolean;
  /** Force refresh from server */
  refresh?: boolean;
}

/**
 * Mutation configuration options for lookup key operations
 */
export interface LookupKeyMutationOptions<TData = any, TVariables = any> extends 
  Omit<UseMutationOptions<TData, ApiErrorResponse, TVariables>, 'mutationFn'> {
  /** Enable optimistic updates */
  enableOptimistic?: boolean;
  /** Custom success message */
  successMessage?: string;
  /** Custom error message */
  errorMessage?: string;
}

/**
 * Validation error structure for unique name constraints
 */
export interface ValidationError {
  /** Field name with validation error */
  field: string;
  /** Validation error message */
  message: string;
  /** Error code for programmatic handling */
  code: string;
}

// ============================================================================
// Constants and Configuration
// ============================================================================

/**
 * API endpoint for global lookup keys management
 */
const LOOKUP_KEYS_ENDPOINT = '/api/v2/system/lookup';

/**
 * Query key factory for lookup keys operations
 * Provides consistent cache key generation for React Query
 */
const lookupKeysKeys = {
  /** Base key for all lookup keys queries */
  all: ['lookup-keys'] as const,
  /** Key for listing lookup keys with optional filters */
  lists: () => [...lookupKeysKeys.all, 'list'] as const,
  /** Key for specific lookup keys list with parameters */
  list: (params?: Record<string, any>) => [...lookupKeysKeys.lists(), params] as const,
  /** Key for individual lookup key details */
  details: () => [...lookupKeysKeys.all, 'detail'] as const,
  /** Key for specific lookup key by ID */
  detail: (id: number) => [...lookupKeysKeys.details(), id] as const,
  /** Key for unique name validation */
  validation: () => [...lookupKeysKeys.all, 'validation'] as const,
  /** Key for specific name validation */
  validateName: (name: string) => [...lookupKeysKeys.validation(), name] as const,
} as const;

/**
 * Default query configuration for optimal performance
 * Ensures cache hit responses under 50ms per requirements
 */
const DEFAULT_QUERY_CONFIG = {
  /** Cache data for 10 minutes */
  gcTime: 10 * 60 * 1000,
  /** Consider data stale after 5 minutes */
  staleTime: 5 * 60 * 1000,
  /** Refetch on window focus for fresh data */
  refetchOnWindowFocus: true,
  /** Refetch on network reconnection */
  refetchOnReconnect: true,
  /** Retry failed requests up to 3 times */
  retry: 3,
  /** Use exponential backoff for retries */
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
} as const;

/**
 * API request options for lookup keys operations
 * Optimized for under 2 seconds response time per requirements
 */
const DEFAULT_API_OPTIONS: ApiRequestOptions = {
  /** Include cache control headers */
  includeCacheControl: true,
  /** Show loading spinner for user feedback */
  showSpinner: true,
  /** Request timeout (2 seconds per requirements) */
  timeout: 2000,
} as const;

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Check if lookup key name is unique among existing keys
 * Provides real-time validation for form inputs
 */
export function useValidateUniqueName() {
  const queryClient = useQueryClient();

  return useCallback(async (name: string, currentId?: number): Promise<boolean> => {
    try {
      // Get cached lookup keys data for validation
      const cachedData = queryClient.getQueryData<ApiListResponse<LookupKey>>(
        lookupKeysKeys.list()
      );

      if (cachedData?.resource) {
        // Check for name conflicts in cached data
        const conflictingKey = cachedData.resource.find(
          key => key.name.toLowerCase() === name.toLowerCase() && key.id !== currentId
        );
        return !conflictingKey;
      }

      // Fallback to server validation if no cached data
      const response = await apiGet<ApiListResponse<LookupKey>>(
        LOOKUP_KEYS_ENDPOINT,
        {
          ...DEFAULT_API_OPTIONS,
          filter: `name="${name}"`,
          fields: 'id,name',
          limit: 1,
        }
      );

      if (isApiError(response)) {
        return true; // Allow on validation error
      }

      if (isApiListResponse(response)) {
        const conflictingKey = response.resource.find(
          key => key.id !== currentId
        );
        return !conflictingKey;
      }

      return true;
    } catch (error) {
      console.warn('Name validation failed:', error);
      return true; // Allow on validation error
    }
  }, [queryClient]);
}

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Comprehensive lookup keys management hook
 * 
 * Provides complete CRUD operations for global lookup keys with intelligent
 * caching, optimistic updates, error handling, and real-time validation.
 * Implements SWR/React Query patterns for performance optimization and
 * user experience enhancement.
 * 
 * @param options Optional configuration for query behavior
 * @returns Object containing query data, mutations, and utility functions
 */
export function useLookupKeys(options: LookupKeysQueryOptions = {}) {
  const queryClient = useQueryClient();
  const validateUniqueName = useValidateUniqueName();

  // Merge default options with user-provided options
  const queryOptions = useMemo(() => ({
    ...DEFAULT_QUERY_CONFIG,
    ...options,
  }), [options]);

  // Build query parameters for API request
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {};
    if (options.filter) params.filter = options.filter;
    if (options.sort) params.sort = options.sort;
    if (options.fields) params.fields = options.fields;
    if (options.related) params.related = options.related;
    if (options.limit !== undefined) params.limit = options.limit;
    if (options.offset !== undefined) params.offset = options.offset;
    if (options.includeCount !== undefined) params.includeCount = options.includeCount;
    if (options.refresh) params.refresh = options.refresh;
    return params;
  }, [options]);

  // ============================================================================
  // Queries
  // ============================================================================

  /**
   * Main query for fetching lookup keys list
   * Implements intelligent caching with background revalidation
   */
  const lookupKeysQuery = useQuery({
    queryKey: lookupKeysKeys.list(queryParams),
    queryFn: async (): Promise<ApiListResponse<LookupKey>> => {
      const response = await apiGet<ApiListResponse<LookupKey>>(
        LOOKUP_KEYS_ENDPOINT,
        {
          ...DEFAULT_API_OPTIONS,
          ...queryParams,
        }
      );

      if (isApiError(response)) {
        throw new Error(JSON.stringify(response));
      }

      return response as ApiListResponse<LookupKey>;
    },
    ...queryOptions,
  });

  // ============================================================================
  // Create Mutations
  // ============================================================================

  /**
   * Single lookup key creation mutation with optimistic updates
   */
  const createLookupKey = useEnhancedMutation<LookupKey, LookupKeyInput>({
    operation: 'create',
    endpoint: {
      url: LOOKUP_KEYS_ENDPOINT,
      method: 'POST',
    },
    optimistic: {
      enabled: true,
      getOptimisticData: (variables) => ({
        id: Date.now(), // Temporary ID for optimistic update
        ...variables,
        created_date: new Date().toISOString(),
        last_modified_date: new Date().toISOString(),
      } as LookupKey),
      invalidateKeys: [lookupKeysKeys.lists()],
    },
    invalidation: {
      exact: [lookupKeysKeys.lists()],
      refetchActive: true,
    },
    notifications: {
      success: {
        enabled: true,
        title: 'Success',
        message: 'Lookup key created successfully',
        duration: 3000,
      },
      error: {
        enabled: true,
        title: 'Error',
        message: 'Failed to create lookup key',
        duration: 5000,
        includeErrorDetails: true,
      },
    },
    retry: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      initialDelay: 1000,
      maxDelay: 10000,
      shouldRetry: (error, attempt) => {
        return error.error.status_code >= 500 && attempt < 3;
      },
    },
  });

  /**
   * Bulk lookup keys creation mutation for multiple entries
   */
  const createLookupKeys = useEnhancedMutation<LookupKey[], BulkCreateRequest>({
    operation: 'bulk-create',
    endpoint: {
      url: LOOKUP_KEYS_ENDPOINT,
      method: 'POST',
    },
    optimistic: {
      enabled: false, // Disable for bulk operations
    },
    invalidation: {
      exact: [lookupKeysKeys.lists()],
      refetchActive: true,
      refetchInactive: true,
    },
    notifications: {
      success: {
        enabled: true,
        title: 'Success',
        message: 'Lookup keys created successfully',
        duration: 3000,
      },
      error: {
        enabled: true,
        title: 'Error',
        message: 'Failed to create lookup keys',
        duration: 5000,
        includeErrorDetails: true,
      },
    },
    retry: {
      maxAttempts: 1, // Reduce retries for bulk operations
    },
  });

  // ============================================================================
  // Update Mutations
  // ============================================================================

  /**
   * Single lookup key update mutation with optimistic updates
   */
  const updateLookupKey = useEnhancedMutation<LookupKey, LookupKeyUpdate>({
    operation: 'update',
    endpoint: {
      url: `${LOOKUP_KEYS_ENDPOINT}`,
      method: 'PUT',
    },
    optimistic: {
      enabled: true,
      updateHandler: (variables, queryClient) => {
        const queryKey = lookupKeysKeys.list();
        const previousData = queryClient.getQueryData<ApiListResponse<LookupKey>>(queryKey);
        
        if (previousData?.resource) {
          const updatedResource = previousData.resource.map(item =>
            item.id === variables.id 
              ? { ...item, ...variables, last_modified_date: new Date().toISOString() }
              : item
          );
          
          queryClient.setQueryData(queryKey, {
            ...previousData,
            resource: updatedResource,
          });
        }
        
        return previousData;
      },
      invalidateKeys: [lookupKeysKeys.lists()],
    },
    invalidation: {
      exact: [lookupKeysKeys.lists(), lookupKeysKeys.detail(0)], // 0 as wildcard
      refetchActive: true,
    },
    notifications: {
      success: {
        enabled: true,
        title: 'Success',
        message: 'Lookup key updated successfully',
        duration: 3000,
      },
      error: {
        enabled: true,
        title: 'Error',
        message: 'Failed to update lookup key',
        duration: 5000,
        includeErrorDetails: true,
      },
    },
  });

  /**
   * Bulk lookup keys update mutation for multiple entries
   */
  const updateLookupKeys = useEnhancedMutation<LookupKey[], BulkUpdateRequest>({
    operation: 'bulk-update',
    endpoint: {
      url: LOOKUP_KEYS_ENDPOINT,
      method: 'PUT',
    },
    optimistic: {
      enabled: false, // Disable for bulk operations
    },
    invalidation: {
      exact: [lookupKeysKeys.lists()],
      refetchActive: true,
      refetchInactive: true,
    },
    notifications: {
      success: {
        enabled: true,
        title: 'Success',
        message: 'Lookup keys updated successfully',
        duration: 3000,
      },
      error: {
        enabled: true,
        title: 'Error',
        message: 'Failed to update lookup keys',
        duration: 5000,
        includeErrorDetails: true,
      },
    },
    retry: {
      maxAttempts: 1, // Reduce retries for bulk operations
    },
  });

  // ============================================================================
  // Delete Mutations
  // ============================================================================

  /**
   * Single lookup key deletion mutation with optimistic updates
   */
  const deleteLookupKey = useEnhancedMutation<void, { id: number }>({
    operation: 'delete',
    endpoint: {
      url: `${LOOKUP_KEYS_ENDPOINT}`,
      method: 'DELETE',
    },
    optimistic: {
      enabled: true,
      updateHandler: (variables, queryClient) => {
        const queryKey = lookupKeysKeys.list();
        const previousData = queryClient.getQueryData<ApiListResponse<LookupKey>>(queryKey);
        
        if (previousData?.resource) {
          const updatedResource = previousData.resource.filter(
            item => item.id !== variables.id
          );
          
          queryClient.setQueryData(queryKey, {
            ...previousData,
            resource: updatedResource,
            meta: {
              ...previousData.meta,
              count: previousData.meta.count - 1,
            },
          });
        }
        
        return previousData;
      },
      invalidateKeys: [lookupKeysKeys.lists()],
    },
    invalidation: {
      exact: [lookupKeysKeys.lists(), lookupKeysKeys.detail(0)], // 0 as wildcard
      refetchActive: true,
    },
    notifications: {
      success: {
        enabled: true,
        title: 'Success',
        message: 'Lookup key deleted successfully',
        duration: 3000,
      },
      error: {
        enabled: true,
        title: 'Error',
        message: 'Failed to delete lookup key',
        duration: 5000,
        includeErrorDetails: true,
      },
    },
    conflict: {
      strategy: 'queue', // Queue deletes to prevent conflicts
    },
  });

  /**
   * Bulk lookup keys deletion mutation for multiple entries
   */
  const deleteLookupKeys = useEnhancedMutation<void, { ids: number[] }>({
    operation: 'bulk-delete',
    endpoint: {
      url: `${LOOKUP_KEYS_ENDPOINT}`,
      method: 'DELETE',
    },
    optimistic: {
      enabled: false, // Disable for bulk operations
    },
    invalidation: {
      exact: [lookupKeysKeys.lists()],
      refetchActive: true,
      refetchInactive: true,
    },
    notifications: {
      success: {
        enabled: true,
        title: 'Success',
        message: 'Lookup keys deleted successfully',
        duration: 3000,
      },
      error: {
        enabled: true,
        title: 'Error',
        message: 'Failed to delete lookup keys',
        duration: 5000,
        includeErrorDetails: true,
      },
    },
    conflict: {
      strategy: 'queue', // Queue deletes to prevent conflicts
    },
    retry: {
      maxAttempts: 1, // Reduce retries for bulk operations
    },
  });

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Manually refresh lookup keys data
   * Forces immediate cache invalidation and refetch
   */
  const refreshLookupKeys = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: lookupKeysKeys.lists(),
    });
  }, [queryClient]);

  /**
   * Prefetch lookup keys for improved performance
   * Useful for optimistic navigation scenarios
   */
  const prefetchLookupKeys = useCallback(async (params?: Record<string, any>) => {
    await queryClient.prefetchQuery({
      queryKey: lookupKeysKeys.list(params),
      queryFn: async () => {
        const response = await apiGet<ApiListResponse<LookupKey>>(
          LOOKUP_KEYS_ENDPOINT,
          {
            ...DEFAULT_API_OPTIONS,
            ...params,
          }
        );

        if (isApiError(response)) {
          throw new Error(JSON.stringify(response));
        }

        return response as ApiListResponse<LookupKey>;
      },
      ...DEFAULT_QUERY_CONFIG,
    });
  }, [queryClient]);

  /**
   * Get specific lookup key by ID from cache
   * Provides instant access to cached data
   */
  const getLookupKeyById = useCallback((id: number): LookupKey | undefined => {
    const cachedData = queryClient.getQueryData<ApiListResponse<LookupKey>>(
      lookupKeysKeys.list()
    );
    return cachedData?.resource?.find(key => key.id === id);
  }, [queryClient]);

  /**
   * Check if a lookup key name is unique
   * Provides real-time validation for forms
   */
  const isNameUnique = useCallback(async (name: string, currentId?: number): Promise<boolean> => {
    return await validateUniqueName(name, currentId);
  }, [validateUniqueName]);

  /**
   * Get validation errors for a lookup key
   * Provides comprehensive validation feedback
   */
  const getValidationErrors = useCallback((lookupKey: Partial<LookupKeyInput>): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Name validation
    if (!lookupKey.name || lookupKey.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Lookup key name is required',
        code: 'REQUIRED',
      });
    } else if (lookupKey.name.length > 50) {
      errors.push({
        field: 'name',
        message: 'Lookup key name must be less than 50 characters',
        code: 'MAX_LENGTH',
      });
    }

    // Value validation
    if (lookupKey.value !== undefined && lookupKey.value.length > 1000) {
      errors.push({
        field: 'value',
        message: 'Lookup key value must be less than 1000 characters',
        code: 'MAX_LENGTH',
      });
    }

    // Description validation
    if (lookupKey.description && lookupKey.description.length > 255) {
      errors.push({
        field: 'description',
        message: 'Description must be less than 255 characters',
        code: 'MAX_LENGTH',
      });
    }

    return errors;
  }, []);

  // ============================================================================
  // Return Hook Interface
  // ============================================================================

  return useMemo(() => ({
    // Query data and state
    lookupKeys: lookupKeysQuery.data?.resource || [],
    meta: lookupKeysQuery.data?.meta,
    isLoading: lookupKeysQuery.isLoading,
    isError: lookupKeysQuery.isError,
    error: lookupKeysQuery.error,
    isFetching: lookupKeysQuery.isFetching,
    isStale: lookupKeysQuery.isStale,

    // Mutation operations
    mutations: {
      create: createLookupKey,
      createBulk: createLookupKeys,
      update: updateLookupKey,
      updateBulk: updateLookupKeys,
      delete: deleteLookupKey,
      deleteBulk: deleteLookupKeys,
    },

    // Utility functions
    utils: {
      refresh: refreshLookupKeys,
      prefetch: prefetchLookupKeys,
      getById: getLookupKeyById,
      isNameUnique,
      getValidationErrors,
    },

    // Loading states for all mutations
    isCreating: createLookupKey.isPending,
    isCreatingBulk: createLookupKeys.isPending,
    isUpdating: updateLookupKey.isPending,
    isUpdatingBulk: updateLookupKeys.isPending,
    isDeleting: deleteLookupKey.isPending,
    isDeletingBulk: deleteLookupKeys.isPending,

    // Combined loading state for UI feedback
    isMutating: createLookupKey.isPending || 
                createLookupKeys.isPending || 
                updateLookupKey.isPending || 
                updateLookupKeys.isPending || 
                deleteLookupKey.isPending || 
                deleteLookupKeys.isPending,

    // Query client for advanced operations
    queryClient,
  }), [
    lookupKeysQuery,
    createLookupKey,
    createLookupKeys,
    updateLookupKey,
    updateLookupKeys,
    deleteLookupKey,
    deleteLookupKeys,
    refreshLookupKeys,
    prefetchLookupKeys,
    getLookupKeyById,
    isNameUnique,
    getValidationErrors,
    queryClient,
  ]);
}

// ============================================================================
// Type Exports
// ============================================================================

export type {
  LookupKey,
  LookupKeyInput,
  LookupKeyUpdate,
  BulkCreateRequest,
  BulkUpdateRequest,
  LookupKeysQueryOptions,
  LookupKeyMutationOptions,
  ValidationError,
};

// ============================================================================
// Default Export
// ============================================================================

export default useLookupKeys;