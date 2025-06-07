/**
 * React Hook for Script Cache Management
 * 
 * Provides comprehensive script cache operations including viewing latest cached scripts
 * and cache deletion with optimistic updates. Implements React Query for intelligent
 * server state management, automatic format detection for JSON/file content, and
 * seamless integration with DreamFactory storage services.
 * 
 * Migrated from Angular service-based cache management to React hooks with enhanced
 * performance through SWR caching, error handling with retry strategies, and user
 * feedback integration through snackbar notifications.
 * 
 * @fileoverview Script cache management hook with React Query integration
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { apiClient, type ApiResponse } from '@/lib/api-client';
import { 
  ScriptContent, 
  ScriptType, 
  StorageService,
  extensionToScriptType 
} from '@/components/ui/script-editor/types';
import { ApiErrorResponse } from '@/types/api';

// ============================================================================
// CACHE CONTENT AND OPERATION TYPES
// ============================================================================

/**
 * Cache entry structure for script content with metadata
 */
export interface ScriptCacheEntry {
  /** Unique cache identifier */
  id: string;
  /** Script name */
  name: string;
  /** File path within storage service */
  path: string;
  /** Storage service identifier */
  service_name: string;
  /** Script content or JSON data */
  content: string | Record<string, any>;
  /** Content type detection */
  content_type: 'json' | 'text';
  /** Script type (derived from file extension) */
  script_type: ScriptType;
  /** File size in bytes */
  size: number;
  /** Last modified timestamp */
  last_modified: string;
  /** Cache creation timestamp */
  cached_at: string;
  /** Cache expiry timestamp */
  expires_at?: string;
  /** Content checksum for integrity */
  checksum?: string;
}

/**
 * Cache operation result with comprehensive metadata
 */
export interface CacheOperationResult {
  /** Operation success status */
  success: boolean;
  /** Operation type performed */
  operation: 'view' | 'delete' | 'clear_all';
  /** Affected cache entries */
  affected_entries?: ScriptCacheEntry[];
  /** Operation timestamp */
  timestamp: string;
  /** Error details (if operation failed) */
  error?: string;
  /** Additional operation metadata */
  metadata?: {
    /** Number of entries processed */
    entries_processed: number;
    /** Processing duration in milliseconds */
    duration_ms: number;
    /** Service used for operation */
    service_name?: string;
  };
}

/**
 * Cache query parameters for filtering and pagination
 */
export interface CacheQueryParams {
  /** Storage service filter */
  service_name?: string;
  /** Script type filter */
  script_type?: ScriptType;
  /** Content type filter */
  content_type?: 'json' | 'text';
  /** Name pattern filter */
  name_pattern?: string;
  /** Maximum entries to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Sort order */
  sort?: 'name' | 'last_modified' | 'cached_at' | 'size';
  /** Sort direction */
  order?: 'asc' | 'desc';
  /** Include expired entries */
  include_expired?: boolean;
}

/**
 * Snackbar notification interface for user feedback
 * Since use-snackbar.ts doesn't exist yet, defining the expected interface
 */
interface SnackbarOptions {
  /** Notification message */
  message: string;
  /** Notification type */
  type: 'success' | 'error' | 'warning' | 'info';
  /** Duration in milliseconds */
  duration?: number;
  /** Whether notification can be dismissed */
  dismissible?: boolean;
  /** Action button configuration */
  action?: {
    label: string;
    handler: () => void;
  };
}

/**
 * Mock snackbar hook interface (to be replaced when actual hook exists)
 */
interface UseSnackbarReturn {
  showSnackbar: (options: SnackbarOptions) => void;
  hideSnackbar: () => void;
}

// ============================================================================
// FILE UTILITIES AND PATH CONSTRUCTION
// ============================================================================

/**
 * File path construction utilities for storage service compatibility
 * Maintains compatibility with existing Angular storage service patterns
 */
class FilePathUtils {
  /**
   * Construct full file path combining storage service and relative path
   */
  static constructPath(serviceName: string, relativePath: string): string {
    const cleanServiceName = serviceName.replace(/^\/+|\/+$/g, '');
    const cleanRelativePath = relativePath.replace(/^\/+/, '');
    
    return `${cleanServiceName}/${cleanRelativePath}`;
  }

  /**
   * Extract service name from full path
   */
  static extractServiceName(fullPath: string): string {
    const parts = fullPath.split('/');
    return parts[0] || '';
  }

  /**
   * Extract relative path from full path
   */
  static extractRelativePath(fullPath: string): string {
    const parts = fullPath.split('/');
    return parts.slice(1).join('/');
  }

  /**
   * Detect content format based on file extension
   */
  static detectContentType(path: string): 'json' | 'text' {
    const extension = path.toLowerCase().split('.').pop();
    return extension === 'json' ? 'json' : 'text';
  }

  /**
   * Determine script type from file extension
   */
  static getScriptType(path: string): ScriptType {
    const extension = `.${path.toLowerCase().split('.').pop()}`;
    return extensionToScriptType[extension] || ScriptType.TEXT;
  }

  /**
   * Validate file path format
   */
  static validatePath(path: string): boolean {
    if (!path || typeof path !== 'string') return false;
    if (path.includes('..') || path.includes('//')) return false;
    if (path.startsWith('/') || path.endsWith('/')) return false;
    return true;
  }

  /**
   * Normalize file path for consistent handling
   */
  static normalizePath(path: string): string {
    return path
      .replace(/\/+/g, '/') // Replace multiple slashes with single
      .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
      .trim();
  }
}

// ============================================================================
// MOCK IMPLEMENTATIONS FOR MISSING DEPENDENCIES
// ============================================================================

/**
 * Mock implementation for use-snackbar hook
 * To be replaced when actual hook is implemented
 */
const useSnackbar = (): UseSnackbarReturn => {
  const showSnackbar = useCallback((options: SnackbarOptions) => {
    // Mock implementation - would normally show actual notification
    console.log(`[Snackbar] ${options.type.toUpperCase()}: ${options.message}`);
  }, []);

  const hideSnackbar = useCallback(() => {
    // Mock implementation
    console.log('[Snackbar] Hide notification');
  }, []);

  return { showSnackbar, hideSnackbar };
};

// ============================================================================
// CACHE QUERY KEYS AND API ENDPOINTS
// ============================================================================

/**
 * React Query cache keys for consistent cache management
 */
export const CACHE_QUERY_KEYS = {
  /** Base key for all script cache queries */
  scripts: ['script-cache'] as const,
  
  /** All cached scripts with optional filters */
  list: (params?: CacheQueryParams) => ['script-cache', 'list', params] as const,
  
  /** Single cache entry by ID */
  detail: (id: string) => ['script-cache', 'detail', id] as const,
  
  /** Cache statistics and metadata */
  stats: () => ['script-cache', 'stats'] as const,
  
  /** Service-specific cache entries */
  byService: (serviceName: string) => ['script-cache', 'service', serviceName] as const,
} as const;

/**
 * DreamFactory API endpoints for cache operations
 */
const CACHE_API_ENDPOINTS = {
  /** List cached scripts */
  list: '/system/cache/script',
  
  /** Get specific cache entry */
  detail: (id: string) => `/system/cache/script/${encodeURIComponent(id)}`,
  
  /** Delete cache entry */
  delete: (id: string) => `/system/cache/script/${encodeURIComponent(id)}`,
  
  /** Clear all cache */
  clear: '/system/cache/script',
  
  /** Cache statistics */
  stats: '/system/cache/script/stats',
} as const;

// ============================================================================
// SCRIPT CACHE HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook options for script cache management configuration
 */
export interface UseScriptCacheOptions {
  /** Initial query parameters */
  initialParams?: CacheQueryParams;
  
  /** Enable real-time updates */
  enableRealTimeUpdates?: boolean;
  
  /** Cache refresh interval in milliseconds */
  refreshInterval?: number;
  
  /** Enable background refetch on window focus */
  refetchOnWindowFocus?: boolean;
  
  /** Enable automatic retry on errors */
  enableRetry?: boolean;
  
  /** Maximum retry attempts */
  maxRetryAttempts?: number;
  
  /** Show success notifications */
  showSuccessNotifications?: boolean;
  
  /** Show error notifications */
  showErrorNotifications?: boolean;
  
  /** Custom error handler */
  onError?: (error: ApiErrorResponse) => void;
  
  /** Custom success handler */
  onSuccess?: (result: CacheOperationResult) => void;
}

/**
 * Return type for useScriptCache hook
 */
export interface UseScriptCacheReturn {
  // ============================================================================
  // CACHE DATA AND STATE
  // ============================================================================
  
  /** Cached script entries */
  cacheEntries: ScriptCacheEntry[];
  
  /** Loading state for cache data */
  isLoading: boolean;
  
  /** Error state */
  error: ApiErrorResponse | null;
  
  /** Whether cache is being refreshed */
  isRefreshing: boolean;
  
  /** Cache statistics */
  cacheStats: {
    total_entries: number;
    total_size: number;
    services_count: number;
    expired_entries: number;
  } | null;
  
  // ============================================================================
  // CACHE OPERATIONS
  // ============================================================================
  
  /** View latest cached scripts with optional filtering */
  viewLatest: (params?: CacheQueryParams) => Promise<ScriptCacheEntry[]>;
  
  /** Delete specific cache entry */
  deleteCache: {
    mutate: (id: string) => void;
    mutateAsync: (id: string) => Promise<CacheOperationResult>;
    isPending: boolean;
    error: ApiErrorResponse | null;
    reset: () => void;
  };
  
  /** Clear all cache entries */
  clearAllCache: {
    mutate: () => void;
    mutateAsync: () => Promise<CacheOperationResult>;
    isPending: boolean;
    error: ApiErrorResponse | null;
    reset: () => void;
  };
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /** Manually refresh cache data */
  refreshCache: () => Promise<void>;
  
  /** Get cache entry by ID */
  getCacheEntry: (id: string) => ScriptCacheEntry | undefined;
  
  /** Get content from cache entry with format detection */
  getContent: (entry: ScriptCacheEntry) => {
    content: string | Record<string, any>;
    type: 'json' | 'text';
    script_type: ScriptType;
  };
  
  /** Validate cache entry integrity */
  validateEntry: (entry: ScriptCacheEntry) => boolean;
  
  /** Get cache entries by service */
  getEntriesByService: (serviceName: string) => ScriptCacheEntry[];
  
  /** Build file path for storage service */
  buildFilePath: (serviceName: string, relativePath: string) => string;
}

/**
 * Custom hook for script cache management
 * 
 * Provides comprehensive cache operations with React Query integration,
 * optimistic updates, error handling, and user feedback. Replaces Angular
 * service-based cache management with modern React patterns.
 */
export function useScriptCache(options: UseScriptCacheOptions = {}): UseScriptCacheReturn {
  const {
    initialParams,
    enableRealTimeUpdates = true,
    refreshInterval = 30000, // 30 seconds
    refetchOnWindowFocus = true,
    enableRetry = true,
    maxRetryAttempts = 3,
    showSuccessNotifications = true,
    showErrorNotifications = true,
    onError,
    onSuccess,
  } = options;

  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  // ============================================================================
  // CACHE DATA QUERIES
  // ============================================================================

  /**
   * Main query for cached script entries
   */
  const {
    data: cacheData,
    error: cacheError,
    isLoading,
    isRefetching: isRefreshing,
    refetch: refetchCache,
  } = useQuery({
    queryKey: CACHE_QUERY_KEYS.list(initialParams),
    queryFn: async () => {
      const response = await apiClient.get<{ resource: ScriptCacheEntry[] }>(
        CACHE_API_ENDPOINTS.list,
        {
          headers: initialParams ? { 
            'Content-Type': 'application/json',
            ...Object.entries(initialParams).reduce((acc, [key, value]) => {
              if (value !== undefined) {
                acc[`X-Filter-${key}`] = String(value);
              }
              return acc;
            }, {} as Record<string, string>)
          } : undefined,
        }
      );

      if (!response.resource) {
        throw new Error('Invalid cache data response format');
      }

      return response.resource;
    },
    enabled: true,
    staleTime: 10000, // 10 seconds
    refetchInterval: enableRealTimeUpdates ? refreshInterval : false,
    refetchOnWindowFocus,
    retry: enableRetry ? maxRetryAttempts : false,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Query for cache statistics
   */
  const { data: cacheStats } = useQuery({
    queryKey: CACHE_QUERY_KEYS.stats(),
    queryFn: async () => {
      const response = await apiClient.get<{
        resource: {
          total_entries: number;
          total_size: number;
          services_count: number;
          expired_entries: number;
        }
      }>(CACHE_API_ENDPOINTS.stats);
      
      return response.resource;
    },
    enabled: true,
    staleTime: 60000, // 1 minute
    retry: enableRetry ? 2 : false,
  });

  // ============================================================================
  // CACHE MUTATIONS
  // ============================================================================

  /**
   * Delete cache entry mutation with optimistic updates
   */
  const deleteCacheMutation = useMutation({
    mutationFn: async (id: string): Promise<CacheOperationResult> => {
      const startTime = Date.now();
      
      const response = await apiClient.delete<{ success: boolean; message?: string }>(
        CACHE_API_ENDPOINTS.delete(id)
      );

      return {
        success: true,
        operation: 'delete',
        affected_entries: cacheData?.filter(entry => entry.id === id) || [],
        timestamp: new Date().toISOString(),
        metadata: {
          entries_processed: 1,
          duration_ms: Date.now() - startTime,
        },
      };
    },
    
    // Optimistic update - immediately remove from UI
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: CACHE_QUERY_KEYS.list() });

      // Snapshot the previous value
      const previousCache = queryClient.getQueryData<ScriptCacheEntry[]>(
        CACHE_QUERY_KEYS.list(initialParams)
      );

      // Optimistically update the cache
      if (previousCache) {
        queryClient.setQueryData<ScriptCacheEntry[]>(
          CACHE_QUERY_KEYS.list(initialParams),
          previousCache.filter(entry => entry.id !== id)
        );
      }

      return { previousCache };
    },
    
    // On error, rollback optimistic update
    onError: (error: ApiErrorResponse, id: string, context) => {
      if (context?.previousCache) {
        queryClient.setQueryData(
          CACHE_QUERY_KEYS.list(initialParams),
          context.previousCache
        );
      }

      if (showErrorNotifications) {
        showSnackbar({
          type: 'error',
          message: `Failed to delete cache entry: ${error.error?.message || 'Unknown error'}`,
          duration: 5000,
          dismissible: true,
        });
      }

      onError?.(error);
    },
    
    // On success, show notification and trigger callbacks
    onSuccess: (result: CacheOperationResult) => {
      if (showSuccessNotifications) {
        showSnackbar({
          type: 'success',
          message: 'Cache entry deleted successfully',
          duration: 3000,
          dismissible: true,
        });
      }

      onSuccess?.(result);
    },
    
    // Always refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: CACHE_QUERY_KEYS.stats() });
    },
  });

  /**
   * Clear all cache mutation
   */
  const clearAllCacheMutation = useMutation({
    mutationFn: async (): Promise<CacheOperationResult> => {
      const startTime = Date.now();
      const entriesCount = cacheData?.length || 0;
      
      const response = await apiClient.delete<{ success: boolean; message?: string }>(
        CACHE_API_ENDPOINTS.clear
      );

      return {
        success: true,
        operation: 'clear_all',
        affected_entries: cacheData || [],
        timestamp: new Date().toISOString(),
        metadata: {
          entries_processed: entriesCount,
          duration_ms: Date.now() - startTime,
        },
      };
    },
    
    // Optimistic update - clear all entries
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: CACHE_QUERY_KEYS.list() });

      const previousCache = queryClient.getQueryData<ScriptCacheEntry[]>(
        CACHE_QUERY_KEYS.list(initialParams)
      );

      queryClient.setQueryData<ScriptCacheEntry[]>(
        CACHE_QUERY_KEYS.list(initialParams),
        []
      );

      return { previousCache };
    },
    
    onError: (error: ApiErrorResponse, _, context) => {
      if (context?.previousCache) {
        queryClient.setQueryData(
          CACHE_QUERY_KEYS.list(initialParams),
          context.previousCache
        );
      }

      if (showErrorNotifications) {
        showSnackbar({
          type: 'error',
          message: `Failed to clear cache: ${error.error?.message || 'Unknown error'}`,
          duration: 5000,
          dismissible: true,
        });
      }

      onError?.(error);
    },
    
    onSuccess: (result: CacheOperationResult) => {
      if (showSuccessNotifications) {
        const entriesCount = result.metadata?.entries_processed || 0;
        showSnackbar({
          type: 'success',
          message: `Successfully cleared ${entriesCount} cache entries`,
          duration: 3000,
          dismissible: true,
        });
      }

      onSuccess?.(result);
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_QUERY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: CACHE_QUERY_KEYS.stats() });
    },
  });

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * View latest cached scripts with optional filtering
   */
  const viewLatest = useCallback(async (params?: CacheQueryParams): Promise<ScriptCacheEntry[]> => {
    const response = await apiClient.get<{ resource: ScriptCacheEntry[] }>(
      CACHE_API_ENDPOINTS.list,
      {
        headers: params ? {
          'Content-Type': 'application/json',
          ...Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined) {
              acc[`X-Filter-${key}`] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        } : undefined,
      }
    );

    return response.resource || [];
  }, []);

  /**
   * Manually refresh cache data
   */
  const refreshCache = useCallback(async (): Promise<void> => {
    await refetchCache();
  }, [refetchCache]);

  /**
   * Get cache entry by ID
   */
  const getCacheEntry = useCallback((id: string): ScriptCacheEntry | undefined => {
    return cacheData?.find(entry => entry.id === id);
  }, [cacheData]);

  /**
   * Get content from cache entry with format detection
   */
  const getContent = useCallback((entry: ScriptCacheEntry) => {
    const contentType = FilePathUtils.detectContentType(entry.path);
    const scriptType = FilePathUtils.getScriptType(entry.path);
    
    let content: string | Record<string, any>;
    
    if (contentType === 'json' && typeof entry.content === 'string') {
      try {
        content = JSON.parse(entry.content);
      } catch {
        // Fallback to text if JSON parsing fails
        content = entry.content;
      }
    } else {
      content = entry.content;
    }

    return {
      content,
      type: contentType,
      script_type: scriptType,
    };
  }, []);

  /**
   * Validate cache entry integrity
   */
  const validateEntry = useCallback((entry: ScriptCacheEntry): boolean => {
    if (!entry || !entry.id || !entry.name || !entry.path) {
      return false;
    }

    if (!FilePathUtils.validatePath(entry.path)) {
      return false;
    }

    if (entry.checksum && typeof entry.content === 'string') {
      // In a real implementation, you would verify the checksum
      // For now, just check if content exists
      return entry.content.length > 0;
    }

    return true;
  }, []);

  /**
   * Get cache entries by service
   */
  const getEntriesByService = useCallback((serviceName: string): ScriptCacheEntry[] => {
    return cacheData?.filter(entry => entry.service_name === serviceName) || [];
  }, [cacheData]);

  /**
   * Build file path for storage service
   */
  const buildFilePath = useCallback((serviceName: string, relativePath: string): string => {
    return FilePathUtils.constructPath(serviceName, relativePath);
  }, []);

  // ============================================================================
  // MEMOIZED RETURN VALUES
  // ============================================================================

  const cacheEntries = useMemo(() => cacheData || [], [cacheData]);
  const error = useMemo(() => cacheError as ApiErrorResponse | null, [cacheError]);

  return {
    // Cache data and state
    cacheEntries,
    isLoading,
    error,
    isRefreshing,
    cacheStats: cacheStats || null,
    
    // Cache operations
    viewLatest,
    deleteCache: {
      mutate: deleteCacheMutation.mutate,
      mutateAsync: deleteCacheMutation.mutateAsync,
      isPending: deleteCacheMutation.isPending,
      error: deleteCacheMutation.error as ApiErrorResponse | null,
      reset: deleteCacheMutation.reset,
    },
    clearAllCache: {
      mutate: clearAllCacheMutation.mutate,
      mutateAsync: clearAllCacheMutation.mutateAsync,
      isPending: clearAllCacheMutation.isPending,
      error: clearAllCacheMutation.error as ApiErrorResponse | null,
      reset: clearAllCacheMutation.reset,
    },
    
    // Utility functions
    refreshCache,
    getCacheEntry,
    getContent,
    validateEntry,
    getEntriesByService,
    buildFilePath,
  };
}

// ============================================================================
// EXPORT TYPES AND UTILITIES
// ============================================================================

// Export utility classes and functions
export { FilePathUtils };

// Export interfaces for external use
export type {
  ScriptCacheEntry,
  CacheOperationResult,
  CacheQueryParams,
  UseScriptCacheOptions,
  UseScriptCacheReturn,
  SnackbarOptions,
};

// Export query keys for external cache invalidation
export { CACHE_QUERY_KEYS };

// Default export for convenience
export default useScriptCache;