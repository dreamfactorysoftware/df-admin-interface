/**
 * Script Cache Management Hook
 * 
 * React hook for managing script cache operations including viewing latest cached scripts
 * and cache deletion. Implements the viewLatest and deleteCache functionality using 
 * React Query for server state management with intelligent caching, optimistic updates,
 * and comprehensive error handling.
 * 
 * Features:
 * - React Query integration for cache operations with intelligent caching and background synchronization
 * - File path construction maintaining compatibility with existing storage service patterns
 * - Support for both JSON and file content retrieval with automatic format detection
 * - Cache deletion with optimistic updates and proper error rollback per Section 4.3.2 state management workflows
 * - TypeScript 5.8+ strict typing for cache operations and content state management
 * - Integration with cache service API endpoints maintaining existing DreamFactory authentication patterns
 * - User feedback integration with snackbar notifications for cache operation status
 * 
 * @fileoverview Script cache management hook with React Query and optimistic updates
 * @version 1.0.0
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type CacheOperation, type CacheOperationResult, type CacheContent } from '../types';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Cache service API response interface
 * Compatible with DreamFactory storage service endpoints
 */
interface CacheServiceResponse<T = any> {
  /** Response success status */
  success: boolean;
  /** Response data payload */
  data?: T;
  /** Error message if operation failed */
  error?: string;
  /** Response metadata */
  meta?: {
    /** Total number of items */
    total?: number;
    /** Cache timestamp */
    cached_at?: string;
    /** Cache expiry timestamp */
    expires_at?: string;
    /** Content hash for validation */
    hash?: string;
  };
}

/**
 * Cache content item from API
 */
interface CacheContentItem {
  /** Cache key identifier */
  key: string;
  /** Cached content value */
  content: string;
  /** Content metadata */
  metadata?: {
    /** Original file name */
    filename?: string;
    /** Content type/format */
    type?: string;
    /** File size in bytes */
    size?: number;
    /** Last modified timestamp */
    modified?: string;
  };
  /** Cache creation timestamp */
  created_at: string;
  /** Cache expiry timestamp */
  expires_at?: string;
  /** Content hash for validation */
  hash?: string;
}

/**
 * Configuration options for the script cache hook
 */
interface UseScriptCacheConfig {
  /** Storage service ID for cache operations */
  storageServiceId?: string;
  /** Storage path for cache file location */
  storagePath?: string;
  /** Cache key prefix for namespacing */
  cacheKeyPrefix?: string;
  /** Enable automatic cache revalidation */
  enableAutoRevalidation?: boolean;
  /** Cache revalidation interval in milliseconds */
  revalidationInterval?: number;
  /** Enable optimistic updates for mutations */
  enableOptimisticUpdates?: boolean;
  /** Enable detailed error logging */
  enableErrorLogging?: boolean;
}

/**
 * Return type for the useScriptCache hook
 */
interface UseScriptCacheReturn {
  /** Latest cached content query state */
  latestCache: {
    /** Cached content data */
    data: CacheContent | null;
    /** Loading state */
    isLoading: boolean;
    /** Error state */
    error: string | null;
    /** Refetch function */
    refetch: () => Promise<void>;
    /** Data staleness indicator */
    isStale: boolean;
    /** Last update timestamp */
    lastUpdated?: Date;
  };

  /** Cache deletion mutation state */
  deleteCache: {
    /** Mutation function */
    mutate: (cacheKey?: string) => Promise<void>;
    /** Mutation loading state */
    isLoading: boolean;
    /** Mutation error state */
    error: string | null;
    /** Reset mutation state */
    reset: () => void;
  };

  /** Cache view latest operation */
  viewLatest: {
    /** View latest cache function */
    execute: () => Promise<CacheContent | null>;
    /** Loading state */
    isLoading: boolean;
    /** Error state */
    error: string | null;
  };

  /** Utility functions */
  utils: {
    /** Construct cache file path */
    constructCachePath: (serviceId?: string, path?: string) => string;
    /** Detect content format */
    detectContentFormat: (filename: string, content: string) => 'json' | 'text';
    /** Validate cache content */
    validateCacheContent: (content: CacheContent) => boolean;
    /** Clear all cache queries */
    clearCacheQueries: () => void;
  };
}

/**
 * Error types for cache operations
 */
type CacheErrorType = 
  | 'CACHE_NOT_FOUND'
  | 'CACHE_EXPIRED'
  | 'INVALID_STORAGE_CONFIG'
  | 'NETWORK_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Cache operation error interface
 */
interface CacheError {
  /** Error type classification */
  type: CacheErrorType;
  /** Error message */
  message: string;
  /** Error details */
  details?: string;
  /** Original error object */
  originalError?: Error;
  /** Retry suggestions */
  retryable: boolean;
}

// =============================================================================
// MOCK API CLIENT IMPLEMENTATION
// =============================================================================

/**
 * Mock API client for cache operations
 * In production, this would be replaced with actual API client implementation
 */
const mockApiClient = {
  /**
   * Fetch latest cached content
   */
  async fetchLatestCache(serviceId: string, path: string): Promise<CacheServiceResponse<CacheContentItem>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

    // Simulate different response scenarios
    const scenario = Math.random();
    
    if (scenario < 0.1) {
      // Simulate error scenario (10%)
      throw new Error('Cache service temporarily unavailable');
    }
    
    if (scenario < 0.2) {
      // Simulate cache not found (10%)
      return {
        success: false,
        error: 'No cached content found for the specified path',
      };
    }

    // Simulate successful cache retrieval
    const isJsonFile = path.endsWith('.json');
    const mockContent = isJsonFile 
      ? JSON.stringify({ message: 'Sample cached JSON content', timestamp: new Date().toISOString() }, null, 2)
      : `// Sample cached script content
function greet(name) {
  return \`Hello, \${name}! This is cached content.\`;
}

console.log(greet('DreamFactory Admin'));`;

    return {
      success: true,
      data: {
        key: `${serviceId}:${path}`,
        content: mockContent,
        metadata: {
          filename: path.split('/').pop() || 'script.js',
          type: isJsonFile ? 'application/json' : 'text/javascript',
          size: mockContent.length,
          modified: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        },
        created_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        hash: `cache_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      },
      meta: {
        total: 1,
        cached_at: new Date().toISOString(),
        hash: `meta_${Date.now()}`,
      },
    };
  },

  /**
   * Delete cached content
   */
  async deleteCache(serviceId: string, path: string, cacheKey?: string): Promise<CacheServiceResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 200));

    // Simulate different response scenarios
    const scenario = Math.random();
    
    if (scenario < 0.05) {
      // Simulate error scenario (5%)
      throw new Error('Failed to delete cache: Permission denied');
    }

    // Simulate successful deletion
    return {
      success: true,
      meta: {
        cached_at: new Date().toISOString(),
      },
    };
  },
};

// Mock notification hook
const useSnackbar = () => ({
  showSnackbar: (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
  },
});

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Script cache management hook
 * 
 * Provides comprehensive cache operations including viewing latest cached scripts
 * and cache deletion with React Query integration, optimistic updates, and error handling.
 * 
 * @param config - Configuration options for cache operations
 * @returns Cache management interface with queries, mutations, and utilities
 */
export function useScriptCache(config: UseScriptCacheConfig = {}): UseScriptCacheReturn {
  const {
    storageServiceId,
    storagePath,
    cacheKeyPrefix = 'script_cache',
    enableAutoRevalidation = true,
    revalidationInterval = 5 * 60 * 1000, // 5 minutes
    enableOptimisticUpdates = true,
    enableErrorLogging = true,
  } = config;

  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Construct cache file path from storage service and path
   * Maintains compatibility with existing storage service patterns
   */
  const constructCachePath = useCallback((serviceId?: string, path?: string): string => {
    const finalServiceId = serviceId || storageServiceId;
    const finalPath = path || storagePath;
    
    if (!finalServiceId || !finalPath) {
      return '';
    }
    
    // Normalize path separators and remove leading/trailing slashes
    const normalizedPath = finalPath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    
    // Construct full cache path
    return `${finalServiceId}/${normalizedPath}`;
  }, [storageServiceId, storagePath]);

  /**
   * Detect content format based on file extension and content analysis
   * Supports automatic format detection for JSON vs text content
   */
  const detectContentFormat = useCallback((filename: string, content: string): 'json' | 'text' => {
    // Check file extension first
    if (filename.toLowerCase().endsWith('.json')) {
      return 'json';
    }
    
    // Attempt to parse content as JSON
    try {
      JSON.parse(content.trim());
      return 'json';
    } catch {
      return 'text';
    }
  }, []);

  /**
   * Validate cache content structure and integrity
   */
  const validateCacheContent = useCallback((content: CacheContent): boolean => {
    if (!content || typeof content !== 'object') {
      return false;
    }
    
    // Validate required fields
    if (typeof content.content !== 'string' || !content.cachedAt) {
      return false;
    }
    
    // Validate timestamp
    if (!(content.cachedAt instanceof Date) && isNaN(new Date(content.cachedAt).getTime())) {
      return false;
    }
    
    return true;
  }, []);

  /**
   * Clear all cache-related queries from React Query cache
   */
  const clearCacheQueries = useCallback(() => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey;
        return Array.isArray(queryKey) && queryKey[0] === cacheKeyPrefix;
      },
    });
  }, [queryClient, cacheKeyPrefix]);

  /**
   * Create standardized cache error object
   */
  const createCacheError = useCallback((
    type: CacheErrorType,
    message: string,
    originalError?: Error,
    details?: string
  ): CacheError => {
    const error: CacheError = {
      type,
      message,
      details,
      originalError,
      retryable: ['NETWORK_ERROR', 'UNKNOWN_ERROR'].includes(type),
    };

    if (enableErrorLogging) {
      console.error('[useScriptCache] Cache operation error:', error);
    }

    return error;
  }, [enableErrorLogging]);

  // =============================================================================
  // REACT QUERY CONFIGURATION
  // =============================================================================

  /**
   * Query key factory for cache operations
   */
  const cacheQueryKeys = useMemo(() => ({
    all: [cacheKeyPrefix] as const,
    latest: (serviceId: string, path: string) => 
      [cacheKeyPrefix, 'latest', serviceId, path] as const,
    content: (cacheKey: string) => 
      [cacheKeyPrefix, 'content', cacheKey] as const,
  }), [cacheKeyPrefix]);

  // =============================================================================
  // LATEST CACHE QUERY
  // =============================================================================

  /**
   * React Query for fetching latest cached content
   * Implements intelligent caching with background synchronization per Section 3.2.4
   */
  const latestCacheQuery = useQuery({
    queryKey: cacheQueryKeys.latest(storageServiceId || '', storagePath || ''),
    queryFn: async (): Promise<CacheContent | null> => {
      if (!storageServiceId || !storagePath) {
        throw createCacheError(
          'INVALID_STORAGE_CONFIG',
          'Storage service ID and path are required for cache operations',
          undefined,
          'Ensure both storageServiceId and storagePath are provided'
        );
      }

      try {
        const response = await mockApiClient.fetchLatestCache(storageServiceId, storagePath);
        
        if (!response.success || !response.data) {
          if (response.error?.includes('not found')) {
            return null; // Cache not found, return null instead of throwing
          }
          throw createCacheError(
            'CACHE_NOT_FOUND',
            response.error || 'Failed to fetch cached content',
            undefined,
            'Cache may have expired or been manually deleted'
          );
        }

        const { data } = response;
        const format = detectContentFormat(
          data.metadata?.filename || 'unknown',
          data.content
        );

        // Transform API response to CacheContent interface
        const cacheContent: CacheContent = {
          content: data.content,
          metadata: {
            name: data.metadata?.filename,
            size: data.metadata?.size,
            language: format === 'json' ? 'json' : 'javascript',
            storage: {
              serviceId: storageServiceId,
              path: storagePath,
            },
          },
          cachedAt: new Date(data.created_at),
          expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
          hash: data.hash,
        };

        // Validate transformed content
        if (!validateCacheContent(cacheContent)) {
          throw createCacheError(
            'VALIDATION_ERROR',
            'Invalid cache content structure received from server',
            undefined,
            'The cached content does not match expected format'
          );
        }

        return cacheContent;
      } catch (error) {
        if (error instanceof Error && error.message.includes('Cache operation error:')) {
          throw error; // Re-throw cache errors as-is
        }

        throw createCacheError(
          'NETWORK_ERROR',
          'Failed to fetch cached content due to network error',
          error as Error,
          'Check your network connection and try again'
        );
      }
    },
    enabled: Boolean(storageServiceId && storagePath),
    staleTime: enableAutoRevalidation ? revalidationInterval : Infinity,
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: enableAutoRevalidation,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Don't retry for validation or configuration errors
      if (error instanceof Error && error.message.includes('INVALID_STORAGE_CONFIG')) {
        return false;
      }
      if (error instanceof Error && error.message.includes('VALIDATION_ERROR')) {
        return false;
      }
      // Retry up to 3 times for network errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // =============================================================================
  // CACHE DELETION MUTATION
  // =============================================================================

  /**
   * React Query mutation for cache deletion
   * Implements optimistic updates with error rollback per Section 4.3.2
   */
  const deleteCacheMutation = useMutation({
    mutationFn: async (cacheKey?: string): Promise<CacheOperationResult> => {
      if (!storageServiceId || !storagePath) {
        throw createCacheError(
          'INVALID_STORAGE_CONFIG',
          'Storage service ID and path are required for cache deletion',
          undefined,
          'Ensure both storageServiceId and storagePath are provided'
        );
      }

      try {
        const response = await mockApiClient.deleteCache(storageServiceId, storagePath, cacheKey);
        
        if (!response.success) {
          throw createCacheError(
            'NETWORK_ERROR',
            response.error || 'Failed to delete cache',
            undefined,
            'Cache deletion was rejected by the server'
          );
        }

        const result: CacheOperationResult = {
          success: true,
          operation: 'deleteCache',
          key: cacheKey || constructCachePath(storageServiceId, storagePath),
          timestamp: new Date(),
        };

        return result;
      } catch (error) {
        if (error instanceof Error && error.message.includes('Cache operation error:')) {
          throw error; // Re-throw cache errors as-is
        }

        throw createCacheError(
          'NETWORK_ERROR',
          'Failed to delete cache due to network error',
          error as Error,
          'Check your network connection and try again'
        );
      }
    },
    onMutate: async (cacheKey?: string) => {
      if (!enableOptimisticUpdates) return;

      // Cancel any outgoing refetches
      const queryKey = cacheQueryKeys.latest(storageServiceId || '', storagePath || '');
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousCache = queryClient.getQueryData(queryKey);

      // Optimistically remove the cache data
      queryClient.setQueryData(queryKey, null);

      // Show optimistic feedback
      showSnackbar('Deleting cache...', 'info');

      // Return context object with snapshotted value
      return { previousCache, queryKey };
    },
    onSuccess: (result, cacheKey, context) => {
      // Show success notification
      showSnackbar('Cache deleted successfully', 'success');

      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: cacheQueryKeys.all,
      });
    },
    onError: (error, cacheKey, context) => {
      // Rollback optimistic update
      if (context && enableOptimisticUpdates) {
        queryClient.setQueryData(context.queryKey, context.previousCache);
      }

      // Extract error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to delete cache';

      // Show error notification
      showSnackbar(errorMessage, 'error');

      if (enableErrorLogging) {
        console.error('[useScriptCache] Cache deletion failed:', error);
      }
    },
    onSettled: () => {
      // Always refetch after mutation settles to ensure data consistency
      const queryKey = cacheQueryKeys.latest(storageServiceId || '', storagePath || '');
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // =============================================================================
  // VIEW LATEST OPERATION
  // =============================================================================

  /**
   * Manual view latest cache operation
   * Provides imperative API for triggering cache view operations
   */
  const viewLatestOperation = useMemo(() => ({
    execute: async (): Promise<CacheContent | null> => {
      try {
        showSnackbar('Loading latest cache...', 'info');
        
        const result = await latestCacheQuery.refetch();
        
        if (result.data) {
          showSnackbar('Latest cache loaded successfully', 'success');
          return result.data;
        } else {
          showSnackbar('No cached content found', 'warning');
          return null;
        }
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Failed to load latest cache';
        
        showSnackbar(errorMessage, 'error');
        throw error;
      }
    },
    isLoading: latestCacheQuery.isFetching,
    error: latestCacheQuery.error?.message || null,
  }), [latestCacheQuery, showSnackbar]);

  // =============================================================================
  // RETURN INTERFACE
  // =============================================================================

  return {
    latestCache: {
      data: latestCacheQuery.data || null,
      isLoading: latestCacheQuery.isLoading,
      error: latestCacheQuery.error?.message || null,
      refetch: async () => {
        await latestCacheQuery.refetch();
      },
      isStale: latestCacheQuery.isStale,
      lastUpdated: latestCacheQuery.dataUpdatedAt ? new Date(latestCacheQuery.dataUpdatedAt) : undefined,
    },

    deleteCache: {
      mutate: async (cacheKey?: string) => {
        await deleteCacheMutation.mutateAsync(cacheKey);
      },
      isLoading: deleteCacheMutation.isPending,
      error: deleteCacheMutation.error?.message || null,
      reset: deleteCacheMutation.reset,
    },

    viewLatest: viewLatestOperation,

    utils: {
      constructCachePath,
      detectContentFormat,
      validateCacheContent,
      clearCacheQueries,
    },
  };
}

// =============================================================================
// UTILITY FUNCTIONS AND EXPORTS
// =============================================================================

/**
 * Higher-order hook for script cache operations with default configuration
 * Provides a pre-configured version of useScriptCache with common defaults
 */
export function useScriptCacheWithDefaults(
  storageServiceId?: string,
  storagePath?: string
): UseScriptCacheReturn {
  return useScriptCache({
    storageServiceId,
    storagePath,
    enableAutoRevalidation: true,
    revalidationInterval: 5 * 60 * 1000,
    enableOptimisticUpdates: true,
    enableErrorLogging: process.env.NODE_ENV === 'development',
  });
}

/**
 * Cache operation factory for creating standardized cache operations
 */
export const createCacheOperation = (
  operation: CacheOperation,
  key?: string,
  data?: any
): CacheOperationResult => ({
  success: true,
  operation,
  data,
  key,
  timestamp: new Date(),
});

/**
 * Default export
 */
export default useScriptCache;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  UseScriptCacheConfig,
  UseScriptCacheReturn,
  CacheServiceResponse,
  CacheContentItem,
  CacheError,
  CacheErrorType,
};