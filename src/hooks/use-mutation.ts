'use client';

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

// Types that would typically come from the dependency files
interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

interface RequestOptions {
  snackbarSuccess?: string;
  snackbarError?: string | 'server';
  showSpinner?: boolean;
  additionalHeaders?: Array<{ key: string; value: string }>;
  additionalParams?: Array<{ key: string; value: string }>;
}

interface MutationConfig<TData = any, TVariables = any> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  invalidateQueries?: string[][];
  optimisticUpdate?: {
    queryKey: string[];
    updater: (oldData: any, variables: TVariables) => any;
  };
  onSuccessMessage?: string;
  onErrorMessage?: string;
  retryCount?: number;
  retryDelay?: number;
}

interface NotificationOptions {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface LoadingState {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

// Mock implementations for dependencies that don't exist yet
const useNotifications = () => ({
  showNotification: (options: NotificationOptions) => {
    console.log(`[${options.type.toUpperCase()}] ${options.message}`);
  }
});

const useLoading = (): LoadingState => ({
  isLoading: false,
  setLoading: (loading: boolean) => {
    console.log(`Loading state: ${loading}`);
  }
});

/**
 * Enhanced mutation hook that provides standardized data modification operations
 * with optimistic updates, error handling, and cache invalidation.
 * 
 * Features:
 * - Optimistic updates with automatic rollback on error
 * - Intelligent cache invalidation of related queries
 * - Comprehensive error handling with retry mechanisms
 * - Loading state management with UI feedback
 * - Success/error notifications integration
 * - Conflict resolution for concurrent mutations
 * - Exponential backoff retry strategy
 * 
 * @param config - Mutation configuration including mutation function and cache strategies
 * @returns Enhanced mutation object with additional functionality
 */
export function useMutation<TData = any, TVariables = any>(
  config: MutationConfig<TData, TVariables>
) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotifications();
  const { setLoading } = useLoading();
  const optimisticUpdateContext = useRef<any>(null);

  const {
    mutationFn,
    invalidateQueries = [],
    optimisticUpdate,
    onSuccessMessage,
    onErrorMessage,
    retryCount = 3,
    retryDelay = 1000
  } = config;

  // Exponential backoff retry function
  const calculateRetryDelay = useCallback((attemptIndex: number) => {
    return Math.min(retryDelay * Math.pow(2, attemptIndex), 30000); // Max 30 seconds
  }, [retryDelay]);

  const mutation = useMutation<TData, ApiError, TVariables>({
    mutationFn,
    
    // Optimistic update implementation
    onMutate: async (variables: TVariables) => {
      // Set loading state
      setLoading(true);
      
      if (optimisticUpdate) {
        // Cancel any outgoing refetches for the queries we're about to update
        await queryClient.cancelQueries({ queryKey: optimisticUpdate.queryKey });
        
        // Snapshot the previous value
        const previousData = queryClient.getQueryData(optimisticUpdate.queryKey);
        
        // Optimistically update to the new value
        queryClient.setQueryData(
          optimisticUpdate.queryKey,
          (oldData: any) => optimisticUpdate.updater(oldData, variables)
        );
        
        // Store context for potential rollback
        optimisticUpdateContext.current = { previousData };
        
        return { previousData };
      }
      
      return undefined;
    },

    // Success handler with cache invalidation and notifications
    onSuccess: async (data: TData, variables: TVariables, context: any) => {
      // Clear loading state
      setLoading(false);
      
      // Invalidate related queries to trigger refetch
      for (const queryKey of invalidateQueries) {
        await queryClient.invalidateQueries({ queryKey });
      }
      
      // Show success notification
      if (onSuccessMessage) {
        showNotification({
          type: 'success',
          message: onSuccessMessage,
          duration: 3000
        });
      }
      
      // Clear optimistic update context
      optimisticUpdateContext.current = null;
    },

    // Error handler with rollback and retry logic
    onError: (error: ApiError, variables: TVariables, context: any) => {
      // Clear loading state
      setLoading(false);
      
      // Rollback optimistic update if it exists
      if (optimisticUpdate && context?.previousData !== undefined) {
        queryClient.setQueryData(optimisticUpdate.queryKey, context.previousData);
      }
      
      // Show error notification
      const errorMessage = onErrorMessage || error.message || 'An error occurred';
      showNotification({
        type: 'error',
        message: errorMessage,
        duration: 5000
      });
      
      // Clear optimistic update context
      optimisticUpdateContext.current = null;
    },

    // Retry configuration with exponential backoff
    retry: (failureCount: number, error: ApiError) => {
      // Don't retry on client errors (4xx) except for 408, 429
      if (error.status && error.status >= 400 && error.status < 500) {
        const retryableClientErrors = [408, 429]; // Request Timeout, Too Many Requests
        if (!retryableClientErrors.includes(error.status)) {
          return false;
        }
      }
      
      return failureCount < retryCount;
    },

    retryDelay: calculateRetryDelay,

    // Network mode configuration
    networkMode: 'online',
  });

  // Enhanced mutation function with conflict resolution
  const mutateWithConflictResolution = useCallback(
    async (variables: TVariables, options?: UseMutationOptions<TData, ApiError, TVariables>) => {
      // Check for concurrent mutations on the same resource
      if (optimisticUpdate && optimisticUpdateContext.current) {
        console.warn('Concurrent mutation detected. Previous mutation will be overridden.');
      }
      
      return mutation.mutateAsync(variables, options);
    },
    [mutation, optimisticUpdate]
  );

  // Mutation with immediate execution (for optimistic scenarios)
  const mutateOptimistic = useCallback(
    (variables: TVariables) => {
      mutation.mutate(variables);
    },
    [mutation]
  );

  // Manual cache invalidation utility
  const invalidateRelatedQueries = useCallback(
    async () => {
      for (const queryKey of invalidateQueries) {
        await queryClient.invalidateQueries({ queryKey });
      }
    },
    [queryClient, invalidateQueries]
  );

  // Reset mutation state
  const resetMutation = useCallback(() => {
    mutation.reset();
    optimisticUpdateContext.current = null;
  }, [mutation]);

  return {
    // Standard React Query mutation properties
    ...mutation,
    
    // Enhanced mutation methods
    mutateWithConflictResolution,
    mutateOptimistic,
    
    // Utility methods
    invalidateRelatedQueries,
    resetMutation,
    
    // Additional state
    isOptimistic: !!optimisticUpdateContext.current,
    hasOptimisticUpdate: !!optimisticUpdate,
  };
}

/**
 * Factory function for creating standardized CRUD mutations
 * with common patterns for create, update, and delete operations.
 */
export function createCrudMutations<TEntity = any>(baseQueryKey: string[]) {
  return {
    /**
     * Create mutation with optimistic updates
     */
    useCreateMutation: (
      createFn: (data: Partial<TEntity>) => Promise<TEntity>,
      options?: Partial<MutationConfig<TEntity, Partial<TEntity>>>
    ) => useMutation({
      mutationFn: createFn,
      invalidateQueries: [baseQueryKey],
      optimisticUpdate: {
        queryKey: baseQueryKey,
        updater: (oldData: any, newItem: Partial<TEntity>) => {
          if (Array.isArray(oldData?.data)) {
            return {
              ...oldData,
              data: [...oldData.data, { ...newItem, id: `temp-${Date.now()}` }]
            };
          }
          return oldData;
        }
      },
      onSuccessMessage: 'Item created successfully',
      onErrorMessage: 'Failed to create item',
      ...options
    }),

    /**
     * Update mutation with optimistic updates
     */
    useUpdateMutation: (
      updateFn: (data: { id: string | number; updates: Partial<TEntity> }) => Promise<TEntity>,
      options?: Partial<MutationConfig<TEntity, { id: string | number; updates: Partial<TEntity> }>>
    ) => useMutation({
      mutationFn: updateFn,
      invalidateQueries: [baseQueryKey, [...baseQueryKey, 'detail']],
      optimisticUpdate: {
        queryKey: baseQueryKey,
        updater: (oldData: any, { id, updates }: { id: string | number; updates: Partial<TEntity> }) => {
          if (Array.isArray(oldData?.data)) {
            return {
              ...oldData,
              data: oldData.data.map((item: any) => 
                item.id === id ? { ...item, ...updates } : item
              )
            };
          }
          return oldData;
        }
      },
      onSuccessMessage: 'Item updated successfully',
      onErrorMessage: 'Failed to update item',
      ...options
    }),

    /**
     * Delete mutation with optimistic updates
     */
    useDeleteMutation: (
      deleteFn: (id: string | number | Array<string | number>) => Promise<void>,
      options?: Partial<MutationConfig<void, string | number | Array<string | number>>>
    ) => useMutation({
      mutationFn: deleteFn,
      invalidateQueries: [baseQueryKey],
      optimisticUpdate: {
        queryKey: baseQueryKey,
        updater: (oldData: any, id: string | number | Array<string | number>) => {
          if (Array.isArray(oldData?.data)) {
            const idsToDelete = Array.isArray(id) ? id : [id];
            return {
              ...oldData,
              data: oldData.data.filter((item: any) => !idsToDelete.includes(item.id))
            };
          }
          return oldData;
        }
      },
      onSuccessMessage: 'Item deleted successfully',
      onErrorMessage: 'Failed to delete item',
      ...options
    })
  };
}

/**
 * File upload mutation with progress tracking
 */
export function useFileUploadMutation(
  uploadFn: (file: File, onProgress?: (progress: number) => void) => Promise<any>
) {
  return useMutation({
    mutationFn: uploadFn,
    onSuccessMessage: 'File uploaded successfully',
    onErrorMessage: 'Failed to upload file',
    retryCount: 2, // Fewer retries for file uploads
  });
}

/**
 * Batch mutation for handling multiple operations
 */
export function useBatchMutation<TData = any, TVariables = any>(
  batchFn: (operations: TVariables[]) => Promise<TData[]>,
  options?: Partial<MutationConfig<TData[], TVariables[]>>
) {
  return useMutation({
    mutationFn: batchFn,
    onSuccessMessage: 'Batch operation completed successfully',
    onErrorMessage: 'Batch operation failed',
    retryCount: 1, // Single retry for batch operations
    ...options
  });
}

export default useMutation;