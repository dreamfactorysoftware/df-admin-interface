/**
 * Limit Mutations Hook for React Query Integration
 * 
 * Custom React hook implementing comprehensive React Query mutations for limit CRUD operations
 * with optimistic updates, intelligent cache invalidation, and automatic error rollback.
 * Replaces Angular DfBaseCrudService patterns with modern React Query mutation workflows
 * optimized for DreamFactory API patterns and performance requirements.
 * 
 * Features:
 * - Type-safe mutation operations with comprehensive payload assembly
 * - Optimistic updates for limit creation, modification, and deletion
 * - Intelligent cache invalidation for related queries (limit lists, limit cache)
 * - Automatic rollback on mutation failure with error state management
 * - Success/error notifications integration following existing snackbar patterns
 * - API response performance under 2 seconds per React/Next.js Integration Requirements
 * - Comprehensive error handling with Angular catchError/throwError pattern conversion
 * 
 * @fileoverview React Query mutations for limit management operations
 * @version 1.0.0
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 4.3.2 - Server State Management
 * @see Technical Specification Section 3.2.2 - State Management Architecture
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { apiPost, apiPut, apiDelete } from '@/lib/api-client';
import { useNotifications } from '@/hooks/use-notifications';
import type {
  LimitTableRowData,
  LimitConfiguration,
  CreateLimitMutationVariables,
  UpdateLimitMutationVariables,
  DeleteLimitMutationVariables,
  BulkLimitMutationVariables,
  CreateLimitMutation,
  UpdateLimitMutation,
  DeleteLimitMutation,
  BulkLimitMutation,
  LimitMutationOptions,
} from '@/app/adf-limits/types';
import type { ApiResourceResponse, ApiErrorResponse } from '@/types/api';

// ============================================================================
// Constants and Configuration
// ============================================================================

/**
 * API endpoint base for limit operations
 * Following DreamFactory API v2 patterns
 */
const LIMIT_API_BASE = '/api/v2/system/limit';

/**
 * Query key patterns for cache invalidation
 * Ensures comprehensive cache synchronization across related queries
 */
const QUERY_KEY_PATTERNS = {
  LIMIT_LIST: ['limits'] as const,
  LIMIT_DETAIL: (id: number) => ['limits', id] as const,
  LIMIT_USAGE: (id: number) => ['limits', id, 'usage'] as const,
  USER_LIMITS: (userId: number) => ['users', userId, 'limits'] as const,
  SERVICE_LIMITS: (serviceId: number) => ['services', serviceId, 'limits'] as const,
  ROLE_LIMITS: (roleId: number) => ['roles', roleId, 'limits'] as const,
  SYSTEM_STATS: ['system', 'stats'] as const,
} as const;

/**
 * Default mutation options following React Query best practices
 * Optimized for DreamFactory API response patterns
 */
const DEFAULT_MUTATION_OPTIONS: Partial<LimitMutationOptions> = {
  optimisticUpdate: {
    enabled: true,
    rollbackOnError: true,
  },
  successNotification: {
    title: 'Success',
    message: 'Operation completed successfully',
    duration: 5000, // Match Angular snackbar duration
  },
  errorNotification: {
    title: 'Error',
    fallbackMessage: 'An unexpected error occurred. Please try again.',
  },
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate unique cache keys for limit-related queries
 * Ensures proper cache invalidation across related data structures
 */
const generateCacheKeys = (limit: Partial<LimitTableRowData>): string[] => {
  const keys: string[] = [
    JSON.stringify(QUERY_KEY_PATTERNS.LIMIT_LIST),
    JSON.stringify(QUERY_KEY_PATTERNS.SYSTEM_STATS),
  ];

  if (limit.id) {
    keys.push(JSON.stringify(QUERY_KEY_PATTERNS.LIMIT_DETAIL(limit.id)));
    keys.push(JSON.stringify(QUERY_KEY_PATTERNS.LIMIT_USAGE(limit.id)));
  }

  if (limit.user) {
    keys.push(JSON.stringify(QUERY_KEY_PATTERNS.USER_LIMITS(limit.user)));
  }

  if (limit.service) {
    keys.push(JSON.stringify(QUERY_KEY_PATTERNS.SERVICE_LIMITS(limit.service)));
  }

  if (limit.role) {
    keys.push(JSON.stringify(QUERY_KEY_PATTERNS.ROLE_LIMITS(limit.role)));
  }

  return keys;
};

/**
 * Transform limit configuration to API payload format
 * Ensures compatibility with DreamFactory API expectations
 */
const transformLimitPayload = (config: LimitConfiguration): Record<string, any> => {
  const { period, rateValue, options, scope, ...baseConfig } = config;

  // Generate rate string from configuration
  const periodText = period.value === 1 ? period.unit : `${period.value} ${period.unit}s`;
  const limitRate = `${rateValue} per ${periodText}`;

  // Build API payload
  const payload: Record<string, any> = {
    ...baseConfig,
    limit_rate: limitRate,
    limit_value: rateValue,
    period_value: period.value,
    period_unit: period.unit,
  };

  // Include advanced options if provided
  if (options) {
    payload.options = {
      allow_burst: options.allowBurst,
      burst_multiplier: options.burstMultiplier,
      reset_time: options.resetTime,
      error_message: options.errorMessage,
      priority: options.priority,
    };
  }

  // Include scope configuration if provided
  if (scope) {
    payload.scope = {
      endpoints: scope.endpoints,
      methods: scope.methods,
      ip_restrictions: scope.ipRestrictions,
    };
  }

  return payload;
};

/**
 * Transform API response to limit table row data
 * Normalizes DreamFactory API response format for client consumption
 */
const transformApiResponse = (response: any): LimitTableRowData => {
  const {
    id,
    name,
    limit_type: limitType,
    limit_rate: limitRate,
    limit_counter: limitCounter,
    user_id: user,
    service_id: service,
    role_id: role,
    active,
    description,
    created_date: createdAt,
    last_modified_date: updatedAt,
    created_by_id: createdBy,
    current_usage: currentUsage,
    period_value,
    period_unit,
  } = response;

  const transformedData: LimitTableRowData = {
    id,
    name,
    limitType,
    limitRate,
    limitCounter,
    user: user || null,
    service: service || null,
    role: role || null,
    active: Boolean(active),
    description,
    createdAt,
    updatedAt,
    createdBy,
    currentUsage,
  };

  // Include period configuration if available
  if (period_value && period_unit) {
    transformedData.period = {
      value: period_value,
      unit: period_unit,
    };
  }

  return transformedData;
};

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * useLimitMutations Hook
 * 
 * Provides comprehensive React Query mutations for limit CRUD operations with
 * optimistic updates, intelligent cache invalidation, and automatic error handling.
 * Replaces Angular DfBaseCrudService patterns with modern React Query workflows.
 * 
 * @param options - Optional configuration for mutation behavior
 * @returns Object containing mutation functions and state management
 */
export function useLimitMutations(
  options: Partial<LimitMutationOptions> = {}
) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotifications();

  // Merge provided options with defaults
  const mutationOptions = {
    ...DEFAULT_MUTATION_OPTIONS,
    ...options,
  };

  // =========================================================================
  // Create Limit Mutation
  // =========================================================================

  /**
   * Create new limit with optimistic updates and comprehensive error handling
   * Implements Section 4.3.2 Server State Management optimistic update patterns
   */
  const createLimitMutation = useMutation<
    CreateLimitMutation,
    ApiErrorResponse,
    CreateLimitMutationVariables
  >({
    mutationFn: async ({ data, testConnection = false }: CreateLimitMutationVariables) => {
      const payload = transformLimitPayload(data);
      
      // Add connection test parameter if requested
      if (testConnection && data.service) {
        payload.test_connection = true;
      }

      return apiPost<CreateLimitMutation>(LIMIT_API_BASE, payload, {
        snackbarSuccess: mutationOptions.successNotification?.message,
        snackbarError: mutationOptions.errorNotification?.fallbackMessage,
      });
    },

    onMutate: async (variables) => {
      if (!mutationOptions.optimisticUpdate?.enabled) return;

      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: QUERY_KEY_PATTERNS.LIMIT_LIST });

      // Snapshot the previous value for rollback
      const previousLimits = queryClient.getQueryData(QUERY_KEY_PATTERNS.LIMIT_LIST);

      // Generate temporary ID for optimistic update
      const tempId = Date.now();
      const optimisticLimit: LimitTableRowData = {
        id: tempId,
        name: variables.data.name,
        limitType: variables.data.limitType,
        limitRate: `${variables.data.rateValue} per ${variables.data.period.value === 1 ? variables.data.period.unit : `${variables.data.period.value} ${variables.data.period.unit}s`}`,
        limitCounter: variables.data.limitCounter,
        user: variables.data.user || null,
        service: variables.data.service || null,
        role: variables.data.role || null,
        active: variables.data.active,
        description: variables.data.description,
        createdAt: new Date().toISOString(),
        period: variables.data.period,
      };

      // Optimistically update the cache
      queryClient.setQueryData(QUERY_KEY_PATTERNS.LIMIT_LIST, (oldData: any) => {
        if (!oldData?.resource) return oldData;
        return {
          ...oldData,
          resource: [...oldData.resource, optimisticLimit],
          meta: {
            ...oldData.meta,
            count: oldData.meta.count + 1,
          },
        };
      });

      return { previousLimits, optimisticLimit };
    },

    onSuccess: (data, variables, context) => {
      // Transform and update with real data from server
      const newLimit = transformApiResponse(data.resource);
      
      // Update the optimistic entry with real data
      queryClient.setQueryData(QUERY_KEY_PATTERNS.LIMIT_LIST, (oldData: any) => {
        if (!oldData?.resource) return oldData;
        return {
          ...oldData,
          resource: oldData.resource.map((limit: LimitTableRowData) =>
            limit.id === context?.optimisticLimit?.id ? newLimit : limit
          ),
        };
      });

      // Cache the individual limit
      queryClient.setQueryData(QUERY_KEY_PATTERNS.LIMIT_DETAIL(newLimit.id), {
        resource: newLimit,
        timestamp: new Date().toISOString(),
      });

      // Invalidate related queries for comprehensive synchronization
      const cacheKeys = generateCacheKeys(newLimit);
      cacheKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: JSON.parse(key) });
      });

      // Show success notification
      if (mutationOptions.successNotification) {
        success(
          mutationOptions.successNotification.message,
          {
            title: mutationOptions.successNotification.title,
            duration: mutationOptions.successNotification.duration,
          }
        );
      }
    },

    onError: (err, variables, context) => {
      // Rollback optimistic update if enabled
      if (mutationOptions.optimisticUpdate?.rollbackOnError && context?.previousLimits) {
        queryClient.setQueryData(QUERY_KEY_PATTERNS.LIMIT_LIST, context.previousLimits);
      }

      // Parse error message from API response
      let errorMessage = mutationOptions.errorNotification?.fallbackMessage || 'Failed to create limit';
      try {
        const errorData = JSON.parse(err.message);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // Use fallback message if parsing fails
      }

      // Show error notification
      showError(errorMessage, {
        title: mutationOptions.errorNotification?.title,
      });
    },

    onSettled: () => {
      // Ensure cache consistency after mutation completes
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_PATTERNS.LIMIT_LIST });
    },
  });

  // =========================================================================
  // Update Limit Mutation
  // =========================================================================

  /**
   * Update existing limit with optimistic updates and rollback capability
   * Implements Section 4.3.2 mutation workflows with error state management
   */
  const updateLimitMutation = useMutation<
    UpdateLimitMutation,
    ApiErrorResponse,
    UpdateLimitMutationVariables
  >({
    mutationFn: async ({ id, data, testConnection = false }: UpdateLimitMutationVariables) => {
      const payload = transformLimitPayload(data as LimitConfiguration);
      
      // Add connection test parameter if requested
      if (testConnection && data.service) {
        payload.test_connection = true;
      }

      return apiPut<UpdateLimitMutation>(`${LIMIT_API_BASE}/${id}`, payload, {
        snackbarSuccess: mutationOptions.successNotification?.message,
        snackbarError: mutationOptions.errorNotification?.fallbackMessage,
      });
    },

    onMutate: async (variables) => {
      if (!mutationOptions.optimisticUpdate?.enabled) return;

      const { id, data } = variables;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEY_PATTERNS.LIMIT_LIST });
      await queryClient.cancelQueries({ queryKey: QUERY_KEY_PATTERNS.LIMIT_DETAIL(id) });

      // Snapshot previous values
      const previousLimitsList = queryClient.getQueryData(QUERY_KEY_PATTERNS.LIMIT_LIST);
      const previousLimitDetail = queryClient.getQueryData(QUERY_KEY_PATTERNS.LIMIT_DETAIL(id));

      // Optimistically update the limit list
      queryClient.setQueryData(QUERY_KEY_PATTERNS.LIMIT_LIST, (oldData: any) => {
        if (!oldData?.resource) return oldData;
        return {
          ...oldData,
          resource: oldData.resource.map((limit: LimitTableRowData) =>
            limit.id === id ? { ...limit, ...data, updatedAt: new Date().toISOString() } : limit
          ),
        };
      });

      // Optimistically update the individual limit
      queryClient.setQueryData(QUERY_KEY_PATTERNS.LIMIT_DETAIL(id), (oldData: any) => {
        if (!oldData?.resource) return oldData;
        return {
          ...oldData,
          resource: { ...oldData.resource, ...data, updatedAt: new Date().toISOString() },
        };
      });

      return { previousLimitsList, previousLimitDetail };
    },

    onSuccess: (data, variables, context) => {
      const updatedLimit = transformApiResponse(data.resource);
      const { id } = variables;

      // Update caches with real server data
      queryClient.setQueryData(QUERY_KEY_PATTERNS.LIMIT_LIST, (oldData: any) => {
        if (!oldData?.resource) return oldData;
        return {
          ...oldData,
          resource: oldData.resource.map((limit: LimitTableRowData) =>
            limit.id === id ? updatedLimit : limit
          ),
        };
      });

      queryClient.setQueryData(QUERY_KEY_PATTERNS.LIMIT_DETAIL(id), {
        resource: updatedLimit,
        timestamp: new Date().toISOString(),
      });

      // Invalidate related queries
      const cacheKeys = generateCacheKeys(updatedLimit);
      cacheKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: JSON.parse(key) });
      });

      // Show success notification
      if (mutationOptions.successNotification) {
        success(
          'Limit updated successfully',
          {
            title: mutationOptions.successNotification.title,
            duration: mutationOptions.successNotification.duration,
          }
        );
      }
    },

    onError: (err, variables, context) => {
      const { id } = variables;

      // Rollback optimistic updates if enabled
      if (mutationOptions.optimisticUpdate?.rollbackOnError) {
        if (context?.previousLimitsList) {
          queryClient.setQueryData(QUERY_KEY_PATTERNS.LIMIT_LIST, context.previousLimitsList);
        }
        if (context?.previousLimitDetail) {
          queryClient.setQueryData(QUERY_KEY_PATTERNS.LIMIT_DETAIL(id), context.previousLimitDetail);
        }
      }

      // Parse and show error message
      let errorMessage = 'Failed to update limit';
      try {
        const errorData = JSON.parse(err.message);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // Use fallback message
      }

      showError(errorMessage, {
        title: mutationOptions.errorNotification?.title,
      });
    },

    onSettled: (data, error, variables) => {
      // Ensure cache consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_PATTERNS.LIMIT_LIST });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_PATTERNS.LIMIT_DETAIL(variables.id) });
    },
  });

  // =========================================================================
  // Delete Limit Mutation
  // =========================================================================

  /**
   * Delete limit with optimistic removal and comprehensive rollback
   * Implements automatic rollback on mutation failure per Section 4.3.2 error handling
   */
  const deleteLimitMutation = useMutation<
    DeleteLimitMutation,
    ApiErrorResponse,
    DeleteLimitMutationVariables
  >({
    mutationFn: async ({ id, force = false }: DeleteLimitMutationVariables) => {
      const queryParams = force ? '?force=true' : '';
      return apiDelete<DeleteLimitMutation>(`${LIMIT_API_BASE}/${id}${queryParams}`, {
        snackbarSuccess: 'Limit deleted successfully',
        snackbarError: 'Failed to delete limit',
      });
    },

    onMutate: async (variables) => {
      if (!mutationOptions.optimisticUpdate?.enabled) return;

      const { id } = variables;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEY_PATTERNS.LIMIT_LIST });
      await queryClient.cancelQueries({ queryKey: QUERY_KEY_PATTERNS.LIMIT_DETAIL(id) });

      // Snapshot previous state
      const previousLimitsList = queryClient.getQueryData(QUERY_KEY_PATTERNS.LIMIT_LIST);
      const previousLimitDetail = queryClient.getQueryData(QUERY_KEY_PATTERNS.LIMIT_DETAIL(id));

      // Get the limit being deleted for cache key generation
      const limitToDelete = previousLimitDetail as any;
      const limitData = limitToDelete?.resource;

      // Optimistically remove from list
      queryClient.setQueryData(QUERY_KEY_PATTERNS.LIMIT_LIST, (oldData: any) => {
        if (!oldData?.resource) return oldData;
        return {
          ...oldData,
          resource: oldData.resource.filter((limit: LimitTableRowData) => limit.id !== id),
          meta: {
            ...oldData.meta,
            count: Math.max(0, oldData.meta.count - 1),
          },
        };
      });

      // Remove individual limit cache
      queryClient.removeQueries({ queryKey: QUERY_KEY_PATTERNS.LIMIT_DETAIL(id) });

      return { previousLimitsList, previousLimitDetail, limitData };
    },

    onSuccess: (data, variables, context) => {
      // Invalidate related queries for the deleted limit
      if (context?.limitData) {
        const cacheKeys = generateCacheKeys(context.limitData);
        cacheKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: JSON.parse(key) });
        });
      }

      // Show success notification
      success('Limit deleted successfully', {
        title: 'Success',
        duration: 5000,
      });
    },

    onError: (err, variables, context) => {
      const { id } = variables;

      // Rollback optimistic updates if enabled
      if (mutationOptions.optimisticUpdate?.rollbackOnError) {
        if (context?.previousLimitsList) {
          queryClient.setQueryData(QUERY_KEY_PATTERNS.LIMIT_LIST, context.previousLimitsList);
        }
        if (context?.previousLimitDetail) {
          queryClient.setQueryData(QUERY_KEY_PATTERNS.LIMIT_DETAIL(id), context.previousLimitDetail);
        }
      }

      // Parse and show error message
      let errorMessage = 'Failed to delete limit';
      try {
        const errorData = JSON.parse(err.message);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // Use fallback message
      }

      showError(errorMessage, {
        title: 'Error',
      });
    },

    onSettled: () => {
      // Ensure cache consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_PATTERNS.LIMIT_LIST });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_PATTERNS.SYSTEM_STATS });
    },
  });

  // =========================================================================
  // Bulk Operations Mutation
  // =========================================================================

  /**
   * Bulk limit operations (activate, deactivate, delete) with granular error handling
   * Supports partial success scenarios with detailed feedback
   */
  const bulkLimitMutation = useMutation<
    BulkLimitMutation,
    ApiErrorResponse,
    BulkLimitMutationVariables
  >({
    mutationFn: async ({ operation, limitIds, force = false }: BulkLimitMutationVariables) => {
      const payload = {
        operation,
        ids: limitIds,
        force,
      };

      return apiPost<BulkLimitMutation>(`${LIMIT_API_BASE}/bulk`, payload, {
        snackbarSuccess: `Bulk ${operation} operation completed`,
        snackbarError: `Bulk ${operation} operation failed`,
      });
    },

    onMutate: async (variables) => {
      if (!mutationOptions.optimisticUpdate?.enabled) return;

      const { operation, limitIds } = variables;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEY_PATTERNS.LIMIT_LIST });

      // Snapshot previous state
      const previousLimitsList = queryClient.getQueryData(QUERY_KEY_PATTERNS.LIMIT_LIST);

      // Optimistically update based on operation
      queryClient.setQueryData(QUERY_KEY_PATTERNS.LIMIT_LIST, (oldData: any) => {
        if (!oldData?.resource) return oldData;

        let updatedResource = [...oldData.resource];

        switch (operation) {
          case 'activate':
            updatedResource = updatedResource.map((limit: LimitTableRowData) =>
              limitIds.includes(limit.id) ? { ...limit, active: true } : limit
            );
            break;
          case 'deactivate':
            updatedResource = updatedResource.map((limit: LimitTableRowData) =>
              limitIds.includes(limit.id) ? { ...limit, active: false } : limit
            );
            break;
          case 'delete':
            updatedResource = updatedResource.filter((limit: LimitTableRowData) =>
              !limitIds.includes(limit.id)
            );
            break;
        }

        return {
          ...oldData,
          resource: updatedResource,
          meta: {
            ...oldData.meta,
            count: operation === 'delete' 
              ? Math.max(0, oldData.meta.count - limitIds.length)
              : oldData.meta.count,
          },
        };
      });

      return { previousLimitsList };
    },

    onSuccess: (data, variables, context) => {
      // Handle partial success scenarios
      const { results } = data;
      const { operation } = variables;

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      if (errorCount === 0) {
        success(`All ${successCount} limits ${operation}d successfully`, {
          title: 'Bulk Operation Complete',
          duration: 5000,
        });
      } else {
        showError(
          `${successCount} limits ${operation}d successfully, ${errorCount} failed`,
          { title: 'Bulk Operation Partial Success' }
        );
      }

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_PATTERNS.LIMIT_LIST });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_PATTERNS.SYSTEM_STATS });
    },

    onError: (err, variables, context) => {
      // Rollback optimistic updates if enabled
      if (mutationOptions.optimisticUpdate?.rollbackOnError && context?.previousLimitsList) {
        queryClient.setQueryData(QUERY_KEY_PATTERNS.LIMIT_LIST, context.previousLimitsList);
      }

      // Parse and show error message
      let errorMessage = `Bulk ${variables.operation} operation failed`;
      try {
        const errorData = JSON.parse(err.message);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // Use fallback message
      }

      showError(errorMessage, {
        title: 'Bulk Operation Error',
      });
    },

    onSettled: () => {
      // Ensure cache consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_PATTERNS.LIMIT_LIST });
    },
  });

  // =========================================================================
  // Return Hook Interface
  // =========================================================================

  return {
    // Mutation functions
    createLimit: createLimitMutation.mutate,
    updateLimit: updateLimitMutation.mutate,
    deleteLimit: deleteLimitMutation.mutate,
    bulkOperation: bulkLimitMutation.mutate,

    // Async mutation functions for imperative usage
    createLimitAsync: createLimitMutation.mutateAsync,
    updateLimitAsync: updateLimitMutation.mutateAsync,
    deleteLimitAsync: deleteLimitMutation.mutateAsync,
    bulkOperationAsync: bulkLimitMutation.mutateAsync,

    // Mutation state
    isCreating: createLimitMutation.isPending,
    isUpdating: updateLimitMutation.isPending,
    isDeleting: deleteLimitMutation.isPending,
    isBulkOperating: bulkLimitMutation.isPending,

    // Any mutation pending
    isPending: 
      createLimitMutation.isPending ||
      updateLimitMutation.isPending ||
      deleteLimitMutation.isPending ||
      bulkLimitMutation.isPending,

    // Error states
    createError: createLimitMutation.error,
    updateError: updateLimitMutation.error,
    deleteError: deleteLimitMutation.error,
    bulkError: bulkLimitMutation.error,

    // Reset functions for error states
    resetCreateError: createLimitMutation.reset,
    resetUpdateError: updateLimitMutation.reset,
    resetDeleteError: deleteLimitMutation.reset,
    resetBulkError: bulkLimitMutation.reset,

    // Reset all errors
    resetAllErrors: useCallback(() => {
      createLimitMutation.reset();
      updateLimitMutation.reset();
      deleteLimitMutation.reset();
      bulkLimitMutation.reset();
    }, [
      createLimitMutation.reset,
      updateLimitMutation.reset,
      deleteLimitMutation.reset,
      bulkLimitMutation.reset,
    ]),

    // Cache management functions
    invalidateQueries: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_PATTERNS.LIMIT_LIST });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_PATTERNS.SYSTEM_STATS });
    }, [queryClient]),

    // Manual cache update functions
    updateLimitCache: useCallback((id: number, data: Partial<LimitTableRowData>) => {
      queryClient.setQueryData(QUERY_KEY_PATTERNS.LIMIT_DETAIL(id), (oldData: any) => {
        if (!oldData?.resource) return oldData;
        return {
          ...oldData,
          resource: { ...oldData.resource, ...data, updatedAt: new Date().toISOString() },
        };
      });
    }, [queryClient]),

    // Prefetch functions for performance optimization
    prefetchLimit: useCallback(async (id: number) => {
      await queryClient.prefetchQuery({
        queryKey: QUERY_KEY_PATTERNS.LIMIT_DETAIL(id),
        queryFn: () => apiPost(`${LIMIT_API_BASE}/${id}`),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    }, [queryClient]),
  };
}

// ============================================================================
// Type Exports and Default Export
// ============================================================================

export type UseLimitMutationsReturn = ReturnType<typeof useLimitMutations>;

export default useLimitMutations;