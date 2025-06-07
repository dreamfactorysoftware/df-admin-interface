/**
 * Mutation management hook that provides standardized data modification operations
 * with optimistic updates, error handling, and cache invalidation.
 * 
 * Enhances React Query mutations with application-specific patterns for create,
 * update, delete operations across all entities. Replaces Angular DfBaseCrudService
 * with React patterns and comprehensive error handling.
 * 
 * @fileoverview Standardized mutation patterns with optimistic updates and rollback capabilities
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { 
  useMutation, 
  useQueryClient, 
  type UseMutationOptions,
  type QueryKey,
  type InfiniteData
} from '@tanstack/react-query';
import { useCallback, useRef, useMemo } from 'react';
import { 
  ApiResponse, 
  ApiErrorResponse, 
  ApiSuccessResponse,
  ApiListResponse,
  ApiResourceResponse,
  ApiBulkResponse,
  isApiError,
  isApiListResponse,
  type MutationOptions as ApiMutationOptions,
  type HttpMethod,
  type ApiRequestOptions
} from '@/types/api';

// ============================================================================
// Hook Dependencies - Will be implemented by other hooks
// ============================================================================

// Mock interfaces for dependencies that should exist
interface NotificationMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface LoadingState {
  isLoading: boolean;
  loadingCount: number;
}

// Temporary interfaces until actual hooks are available
const useNotifications = () => ({
  addNotification: (notification: NotificationMessage) => {
    console.log('Notification:', notification);
  },
  removeNotification: (id: string) => {
    console.log('Remove notification:', id);
  }
});

const useLoading = () => ({
  isLoading: false,
  loadingCount: 0,
  setLoading: (loading: boolean) => {
    console.log('Loading state:', loading);
  }
});

// API client interface - will be implemented in api-client.ts
interface ApiClient {
  request<T>(config: {
    method: HttpMethod;
    url: string;
    data?: any;
    options?: ApiRequestOptions;
  }): Promise<ApiResponse<T>>;
}

const useApiClient = (): ApiClient => ({
  request: async <T>(config: any): Promise<ApiResponse<T>> => {
    // Temporary implementation
    throw new Error('API client not implemented yet');
  }
});

// ============================================================================
// Mutation Configuration Types
// ============================================================================

/**
 * Standard mutation operation types supported by the DreamFactory system
 */
export type MutationOperation = 'create' | 'update' | 'delete' | 'bulk-create' | 'bulk-update' | 'bulk-delete' | 'patch';

/**
 * Optimistic update strategy configuration
 */
export interface OptimisticUpdateConfig<TData = any, TVariables = any> {
  /** Enable optimistic updates */
  enabled: boolean;
  
  /** Function to generate optimistic data from variables */
  getOptimisticData?: (variables: TVariables) => TData;
  
  /** Query keys to invalidate on optimistic update */
  invalidateKeys?: QueryKey[];
  
  /** Custom optimistic update handler */
  updateHandler?: (variables: TVariables, queryClient: typeof useQueryClient) => Promise<any> | any;
}

/**
 * Cache invalidation strategy configuration
 */
export interface CacheInvalidationConfig {
  /** Query keys to invalidate exactly */
  exact?: QueryKey[];
  
  /** Query key patterns to invalidate (prefix matching) */
  patterns?: QueryKey[];
  
  /** Whether to refetch active queries immediately */
  refetchActive?: boolean;
  
  /** Whether to refetch inactive queries */
  refetchInactive?: boolean;
  
  /** Custom invalidation handler */
  customHandler?: (queryClient: typeof useQueryClient) => Promise<void> | void;
}

/**
 * Retry configuration for failed mutations
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  
  /** Exponential backoff multiplier */
  backoffMultiplier: number;
  
  /** Initial delay in milliseconds */
  initialDelay: number;
  
  /** Maximum delay in milliseconds */
  maxDelay: number;
  
  /** Function to determine if error should trigger retry */
  shouldRetry?: (error: ApiErrorResponse, attempt: number) => boolean;
}

/**
 * Conflict resolution strategy for concurrent mutations
 */
export interface ConflictResolutionConfig<TVariables = any> {
  /** Strategy to handle conflicts */
  strategy: 'queue' | 'cancel-previous' | 'allow-concurrent' | 'merge';
  
  /** Custom conflict resolver function */
  resolver?: (current: TVariables, incoming: TVariables) => TVariables;
  
  /** Maximum queue size for queued strategy */
  maxQueueSize?: number;
}

/**
 * Notification configuration for mutation feedback
 */
export interface NotificationConfig {
  /** Success notification settings */
  success?: {
    enabled: boolean;
    title?: string;
    message?: string;
    duration?: number;
  };
  
  /** Error notification settings */
  error?: {
    enabled: boolean;
    title?: string;
    message?: string;
    duration?: number;
    includeErrorDetails?: boolean;
  };
  
  /** Loading notification settings */
  loading?: {
    enabled: boolean;
    message?: string;
  };
}

/**
 * Comprehensive mutation configuration
 */
export interface MutationConfig<TData = any, TVariables = any, TError = ApiErrorResponse> {
  /** Type of mutation operation */
  operation: MutationOperation;
  
  /** API endpoint configuration */
  endpoint: {
    url: string;
    method?: HttpMethod;
  };
  
  /** Optimistic update configuration */
  optimistic?: OptimisticUpdateConfig<TData, TVariables>;
  
  /** Cache invalidation strategy */
  invalidation?: CacheInvalidationConfig;
  
  /** Retry configuration */
  retry?: RetryConfig;
  
  /** Conflict resolution strategy */
  conflict?: ConflictResolutionConfig<TVariables>;
  
  /** Notification configuration */
  notifications?: NotificationConfig;
  
  /** Additional React Query mutation options */
  mutationOptions?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>;
}

/**
 * Mutation context for tracking state and recovery
 */
export interface MutationContext<TData = any> {
  /** Previous query data for rollback */
  previousData?: TData;
  
  /** Optimistic update timestamp */
  optimisticUpdateTime?: number;
  
  /** Invalidated query keys */
  invalidatedKeys?: QueryKey[];
  
  /** Mutation attempt number */
  attemptNumber?: number;
  
  /** Additional context data */
  [key: string]: any;
}

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Default retry configuration with exponential backoff
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  backoffMultiplier: 2,
  initialDelay: 1000,
  maxDelay: 10000,
  shouldRetry: (error: ApiErrorResponse, attempt: number) => {
    // Retry on network errors and 5xx server errors
    const isRetryableError = error.error.status_code >= 500 || 
                           error.error.code === 'NETWORK_ERROR' ||
                           error.error.code === 'TIMEOUT_ERROR';
    return isRetryableError && attempt < 3;
  }
};

/**
 * Default notification configuration
 */
const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  success: {
    enabled: true,
    title: 'Success',
    duration: 3000
  },
  error: {
    enabled: true,
    title: 'Error',
    duration: 5000,
    includeErrorDetails: true
  },
  loading: {
    enabled: true,
    message: 'Processing...'
  }
};

/**
 * Default cache invalidation configuration
 */
const DEFAULT_INVALIDATION_CONFIG: CacheInvalidationConfig = {
  refetchActive: true,
  refetchInactive: false
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate delay for exponential backoff
 */
function calculateRetryDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

/**
 * Extract resource data from different response types
 */
function extractResourceData<T>(response: ApiResponse<T>): T | T[] {
  if (isApiError(response)) {
    throw response;
  }
  
  if (isApiListResponse(response)) {
    return response.resource;
  }
  
  if ('resource' in response) {
    return response.resource;
  }
  
  return response as any;
}

/**
 * Generate mutation key for conflict resolution
 */
function generateMutationKey(operation: MutationOperation, endpoint: string): string {
  return `${operation}:${endpoint}`;
}

// ============================================================================
// Mutation Queue Management
// ============================================================================

/**
 * Mutation queue manager for handling concurrent operations
 */
class MutationQueue<TVariables = any> {
  private queue: Map<string, TVariables[]> = new Map();
  private processing: Set<string> = new Set();

  /**
   * Add mutation to queue
   */
  enqueue(key: string, variables: TVariables, maxSize?: number): boolean {
    const currentQueue = this.queue.get(key) || [];
    
    if (maxSize && currentQueue.length >= maxSize) {
      return false; // Queue is full
    }
    
    this.queue.set(key, [...currentQueue, variables]);
    return true;
  }

  /**
   * Get next mutation from queue
   */
  dequeue(key: string): TVariables | undefined {
    const currentQueue = this.queue.get(key) || [];
    if (currentQueue.length === 0) {
      return undefined;
    }
    
    const [next, ...remaining] = currentQueue;
    this.queue.set(key, remaining);
    return next;
  }

  /**
   * Check if mutation is being processed
   */
  isProcessing(key: string): boolean {
    return this.processing.has(key);
  }

  /**
   * Mark mutation as processing
   */
  setProcessing(key: string, processing: boolean): void {
    if (processing) {
      this.processing.add(key);
    } else {
      this.processing.delete(key);
    }
  }

  /**
   * Clear queue for specific key
   */
  clear(key: string): void {
    this.queue.delete(key);
    this.processing.delete(key);
  }

  /**
   * Get queue size
   */
  size(key: string): number {
    return this.queue.get(key)?.length || 0;
  }
}

// Global mutation queue instance
const mutationQueue = new MutationQueue();

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Enhanced mutation hook with comprehensive features
 * 
 * @param config Mutation configuration with optimistic updates, caching, and error handling
 * @returns Mutation object with enhanced capabilities
 */
export function useMutation<TData = any, TVariables = any, TError = ApiErrorResponse>(
  config: MutationConfig<TData, TVariables, TError>
) {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();
  const { addNotification } = useNotifications();
  const { setLoading } = useLoading();
  
  // Merge configurations with defaults
  const retryConfig = useMemo(() => ({
    ...DEFAULT_RETRY_CONFIG,
    ...config.retry
  }), [config.retry]);
  
  const notificationConfig = useMemo(() => ({
    success: { ...DEFAULT_NOTIFICATION_CONFIG.success, ...config.notifications?.success },
    error: { ...DEFAULT_NOTIFICATION_CONFIG.error, ...config.notifications?.error },
    loading: { ...DEFAULT_NOTIFICATION_CONFIG.loading, ...config.notifications?.loading }
  }), [config.notifications]);
  
  const invalidationConfig = useMemo(() => ({
    ...DEFAULT_INVALIDATION_CONFIG,
    ...config.invalidation
  }), [config.invalidation]);

  // Mutation key for conflict resolution
  const mutationKey = useMemo(() => 
    generateMutationKey(config.operation, config.endpoint.url), 
    [config.operation, config.endpoint.url]
  );

  // Ref to track current attempt for retry logic
  const attemptRef = useRef(0);

  /**
   * Handle cache invalidation after successful mutation
   */
  const handleCacheInvalidation = useCallback(async () => {
    const { exact, patterns, refetchActive, refetchInactive, customHandler } = invalidationConfig;

    try {
      // Handle exact key invalidation
      if (exact?.length) {
        await Promise.all(
          exact.map(key => 
            queryClient.invalidateQueries({ 
              queryKey: key,
              refetchType: refetchActive ? 'active' : 'none'
            })
          )
        );
      }

      // Handle pattern-based invalidation
      if (patterns?.length) {
        await Promise.all(
          patterns.map(pattern => 
            queryClient.invalidateQueries({ 
              predicate: (query) => {
                const queryKey = query.queryKey;
                return pattern.every((segment, index) => 
                  queryKey[index] === segment || segment === '*'
                );
              },
              refetchType: refetchActive ? 'active' : 'none'
            })
          )
        );
      }

      // Handle custom invalidation
      if (customHandler) {
        await customHandler(queryClient);
      }

      // Refetch inactive queries if requested
      if (refetchInactive) {
        await queryClient.refetchQueries({ type: 'inactive' });
      }
    } catch (error) {
      console.error('Cache invalidation failed:', error);
    }
  }, [invalidationConfig, queryClient]);

  /**
   * Handle optimistic updates
   */
  const handleOptimisticUpdate = useCallback(async (variables: TVariables): Promise<MutationContext<TData> | undefined> => {
    if (!config.optimistic?.enabled) {
      return undefined;
    }

    const context: MutationContext<TData> = {
      optimisticUpdateTime: Date.now(),
      invalidatedKeys: []
    };

    try {
      // Cancel outgoing queries for affected data
      if (config.optimistic.invalidateKeys) {
        await Promise.all(
          config.optimistic.invalidateKeys.map(key => 
            queryClient.cancelQueries({ queryKey: key })
          )
        );
        context.invalidatedKeys = config.optimistic.invalidateKeys;
      }

      // Custom optimistic update handler
      if (config.optimistic.updateHandler) {
        context.previousData = await config.optimistic.updateHandler(variables, queryClient);
      } 
      // Default optimistic update for list operations
      else if (config.optimistic.getOptimisticData) {
        const optimisticData = config.optimistic.getOptimisticData(variables);
        
        // Apply optimistic update to relevant queries
        if (config.optimistic.invalidateKeys) {
          config.optimistic.invalidateKeys.forEach(key => {
            const previousData = queryClient.getQueryData(key);
            context.previousData = previousData;
            
            // Handle different response types
            if (config.operation === 'create') {
              if (Array.isArray(previousData)) {
                queryClient.setQueryData(key, [...previousData, optimisticData]);
              } else if (previousData && typeof previousData === 'object' && 'resource' in previousData) {
                const listResponse = previousData as ApiListResponse<any>;
                queryClient.setQueryData(key, {
                  ...listResponse,
                  resource: [...listResponse.resource, optimisticData],
                  meta: {
                    ...listResponse.meta,
                    count: listResponse.meta.count + 1
                  }
                });
              }
            } else if (config.operation === 'update') {
              if (Array.isArray(previousData)) {
                const index = previousData.findIndex((item: any) => 
                  item.id === (variables as any).id
                );
                if (index !== -1) {
                  const newData = [...previousData];
                  newData[index] = { ...newData[index], ...optimisticData };
                  queryClient.setQueryData(key, newData);
                }
              }
            } else if (config.operation === 'delete') {
              if (Array.isArray(previousData)) {
                queryClient.setQueryData(key, 
                  previousData.filter((item: any) => item.id !== (variables as any).id)
                );
              }
            }
          });
        }
      }

      return context;
    } catch (error) {
      console.error('Optimistic update failed:', error);
      return undefined;
    }
  }, [config.optimistic, queryClient]);

  /**
   * Handle optimistic update rollback
   */
  const handleOptimisticRollback = useCallback((context: MutationContext<TData> | undefined) => {
    if (!context || !config.optimistic?.enabled) {
      return;
    }

    try {
      // Restore previous data for invalidated keys
      if (context.invalidatedKeys && context.previousData !== undefined) {
        context.invalidatedKeys.forEach(key => {
          queryClient.setQueryData(key, context.previousData);
        });
      }

      // Refetch to ensure consistency
      if (context.invalidatedKeys) {
        context.invalidatedKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
    } catch (error) {
      console.error('Optimistic rollback failed:', error);
    }
  }, [config.optimistic, queryClient]);

  /**
   * Handle conflict resolution for concurrent mutations
   */
  const handleConflictResolution = useCallback(async (variables: TVariables): Promise<boolean> => {
    if (!config.conflict) {
      return true; // No conflict resolution configured
    }

    const { strategy, maxQueueSize, resolver } = config.conflict;

    switch (strategy) {
      case 'queue':
        if (mutationQueue.isProcessing(mutationKey)) {
          const enqueued = mutationQueue.enqueue(mutationKey, variables, maxQueueSize);
          if (!enqueued) {
            throw new Error('Mutation queue is full. Please try again later.');
          }
          return false; // Don't execute now, queued for later
        }
        mutationQueue.setProcessing(mutationKey, true);
        return true;

      case 'cancel-previous':
        // Cancel any ongoing queries for the same resource
        await queryClient.cancelMutations();
        return true;

      case 'merge':
        // Custom merge logic if resolver is provided
        if (resolver && mutationQueue.size(mutationKey) > 0) {
          const queuedVariables = mutationQueue.dequeue(mutationKey);
          if (queuedVariables) {
            const mergedVariables = resolver(queuedVariables, variables);
            mutationQueue.enqueue(mutationKey, mergedVariables);
            return false;
          }
        }
        return true;

      case 'allow-concurrent':
      default:
        return true;
    }
  }, [config.conflict, mutationKey, queryClient]);

  /**
   * Process queued mutations after completion
   */
  const processQueue = useCallback(async () => {
    if (!config.conflict || config.conflict.strategy !== 'queue') {
      return;
    }

    const nextVariables = mutationQueue.dequeue(mutationKey);
    if (nextVariables) {
      // Execute next mutation in queue
      setTimeout(() => {
        mutation.mutate(nextVariables);
      }, 100); // Small delay to prevent rapid succession
    } else {
      mutationQueue.setProcessing(mutationKey, false);
    }
  }, [config.conflict, mutationKey]);

  /**
   * Main mutation function with retry logic
   */
  const mutationFn = useCallback(async (variables: TVariables): Promise<TData> => {
    attemptRef.current += 1;

    try {
      // Show loading notification
      if (notificationConfig.loading?.enabled) {
        setLoading(true);
      }

      // Make API request
      const response = await apiClient.request<TData>({
        method: config.endpoint.method || 'POST',
        url: config.endpoint.url,
        data: variables,
        options: {
          timeout: 30000, // 30 seconds timeout
          contentType: 'application/json'
        }
      });

      if (isApiError(response)) {
        throw response;
      }

      const data = extractResourceData(response) as TData;
      attemptRef.current = 0; // Reset attempt counter on success
      return data;
    } catch (error) {
      const apiError = error as ApiErrorResponse;
      
      // Check if we should retry
      if (attemptRef.current < retryConfig.maxAttempts && 
          retryConfig.shouldRetry?.(apiError, attemptRef.current)) {
        
        const delay = calculateRetryDelay(attemptRef.current, retryConfig);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Recursive retry
        return mutationFn(variables);
      }
      
      attemptRef.current = 0; // Reset attempt counter on final failure
      throw apiError;
    } finally {
      // Hide loading notification
      if (notificationConfig.loading?.enabled) {
        setLoading(false);
      }
    }
  }, [config.endpoint, apiClient, retryConfig, notificationConfig.loading, setLoading]);

  /**
   * Enhanced React Query mutation with all features
   */
  const mutation = useMutation<TData, TError, TVariables, MutationContext<TData>>({
    mutationFn,
    
    onMutate: async (variables: TVariables) => {
      // Handle conflict resolution
      const shouldProceed = await handleConflictResolution(variables);
      if (!shouldProceed) {
        throw new Error('MUTATION_QUEUED'); // Special error to indicate queuing
      }

      // Handle optimistic updates
      return await handleOptimisticUpdate(variables);
    },

    onSuccess: async (data: TData, variables: TVariables, context: MutationContext<TData> | undefined) => {
      try {
        // Handle cache invalidation
        await handleCacheInvalidation();

        // Show success notification
        if (notificationConfig.success?.enabled) {
          addNotification({
            type: 'success',
            title: notificationConfig.success.title || 'Success',
            message: notificationConfig.success.message || 
                    `${config.operation} operation completed successfully`,
            duration: notificationConfig.success.duration
          });
        }

        // Process queued mutations
        await processQueue();

        // Call custom success handler
        if (config.mutationOptions?.onSuccess) {
          await config.mutationOptions.onSuccess(data, variables, context);
        }
      } catch (error) {
        console.error('Post-success processing failed:', error);
      }
    },

    onError: async (error: TError, variables: TVariables, context: MutationContext<TData> | undefined) => {
      try {
        // Handle optimistic rollback
        handleOptimisticRollback(context);

        // Process queued mutations even on error
        await processQueue();

        // Show error notification (skip if mutation was queued)
        if (error && (error as any).message !== 'MUTATION_QUEUED' && 
            notificationConfig.error?.enabled) {
          const apiError = error as ApiErrorResponse;
          addNotification({
            type: 'error',
            title: notificationConfig.error.title || 'Error',
            message: notificationConfig.error.includeErrorDetails && apiError.error
              ? `${apiError.error.message}${apiError.error.context ? ` (${apiError.error.context})` : ''}`
              : notificationConfig.error.message || 'An error occurred',
            duration: notificationConfig.error.duration
          });
        }

        // Call custom error handler
        if (config.mutationOptions?.onError) {
          await config.mutationOptions.onError(error, variables, context);
        }
      } catch (handlerError) {
        console.error('Error handling failed:', handlerError);
      }
    },

    onSettled: async (data: TData | undefined, error: TError | null, variables: TVariables, context: MutationContext<TData> | undefined) => {
      try {
        // Call custom settled handler
        if (config.mutationOptions?.onSettled) {
          await config.mutationOptions.onSettled(data, error, variables, context);
        }
      } catch (handlerError) {
        console.error('Settlement handling failed:', handlerError);
      }
    },

    // Pass through additional options
    ...config.mutationOptions
  });

  // Enhanced mutation object with additional utilities
  return useMemo(() => ({
    ...mutation,
    
    /**
     * Get current queue size for this mutation
     */
    getQueueSize: () => mutationQueue.size(mutationKey),
    
    /**
     * Clear the mutation queue
     */
    clearQueue: () => mutationQueue.clear(mutationKey),
    
    /**
     * Check if mutation is currently being processed
     */
    isProcessing: () => mutationQueue.isProcessing(mutationKey),
    
    /**
     * Get current retry attempt number
     */
    getCurrentAttempt: () => attemptRef.current,
    
    /**
     * Manually trigger cache invalidation
     */
    invalidateCache: handleCacheInvalidation,
    
    /**
     * Reset mutation state and clear queue
     */
    reset: () => {
      mutation.reset();
      mutationQueue.clear(mutationKey);
      attemptRef.current = 0;
    }
  }), [mutation, mutationKey, handleCacheInvalidation]);
}

// ============================================================================
// Convenience Hooks for Common Operations
// ============================================================================

/**
 * Create mutation hook with standard configuration
 */
export function useCreateMutation<TData = any, TVariables = any>(
  endpoint: string,
  options?: Partial<MutationConfig<TData, TVariables>>
) {
  return useMutation<TData, TVariables>({
    operation: 'create',
    endpoint: { url: endpoint, method: 'POST' },
    optimistic: { enabled: true },
    invalidation: { refetchActive: true },
    notifications: { 
      success: { enabled: true, message: 'Item created successfully' }
    },
    ...options
  });
}

/**
 * Update mutation hook with standard configuration
 */
export function useUpdateMutation<TData = any, TVariables = any>(
  endpoint: string,
  options?: Partial<MutationConfig<TData, TVariables>>
) {
  return useMutation<TData, TVariables>({
    operation: 'update',
    endpoint: { url: endpoint, method: 'PUT' },
    optimistic: { enabled: true },
    invalidation: { refetchActive: true },
    notifications: { 
      success: { enabled: true, message: 'Item updated successfully' }
    },
    ...options
  });
}

/**
 * Delete mutation hook with standard configuration
 */
export function useDeleteMutation<TData = any, TVariables = any>(
  endpoint: string,
  options?: Partial<MutationConfig<TData, TVariables>>
) {
  return useMutation<TData, TVariables>({
    operation: 'delete',
    endpoint: { url: endpoint, method: 'DELETE' },
    optimistic: { enabled: true },
    invalidation: { refetchActive: true },
    notifications: { 
      success: { enabled: true, message: 'Item deleted successfully' }
    },
    conflict: { strategy: 'queue' }, // Queue deletes to prevent conflicts
    ...options
  });
}

/**
 * Bulk operation mutation hook with enhanced configuration
 */
export function useBulkMutation<TData = any, TVariables = any>(
  operation: 'bulk-create' | 'bulk-update' | 'bulk-delete',
  endpoint: string,
  options?: Partial<MutationConfig<TData, TVariables>>
) {
  return useMutation<TData, TVariables>({
    operation,
    endpoint: { url: endpoint, method: 'POST' },
    optimistic: { enabled: false }, // Disable for bulk operations
    invalidation: { refetchActive: true, refetchInactive: true },
    notifications: { 
      success: { enabled: true, message: `Bulk ${operation.replace('bulk-', '')} completed successfully` }
    },
    retry: { maxAttempts: 1 }, // Reduce retries for bulk operations
    ...options
  });
}

// ============================================================================
// Type Exports and Re-exports
// ============================================================================

export type {
  MutationOperation,
  OptimisticUpdateConfig,
  CacheInvalidationConfig,
  RetryConfig,
  ConflictResolutionConfig,
  NotificationConfig,
  MutationConfig,
  MutationContext
};

// Re-export React Query types for convenience
export type {
  UseMutationOptions,
  QueryKey
} from '@tanstack/react-query';