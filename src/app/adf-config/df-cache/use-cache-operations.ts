/**
 * Cache Operations Hook
 * 
 * Custom React hook providing cache management operations including system cache flush,
 * per-service cache clearing, and cache status monitoring. Implements SWR and React Query
 * patterns for intelligent caching, optimistic updates, and error recovery with comprehensive
 * loading states and mutation management.
 * 
 * This hook replaces the Angular DfBaseCrudService cache operations with modern React patterns,
 * providing enhanced performance through intelligent caching, optimistic updates, and
 * automatic error recovery mechanisms.
 * 
 * @fileoverview Cache operations hook for DreamFactory admin interface
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiDelete, apiGet, API_BASE_URL } from '../../../lib/api-client';
import type { 
  CacheEntry, 
  CacheOperationsResult, 
  CacheFlushOptions,
  CacheStatusResponse,
  SystemCacheStats 
} from '../../../types/cache';
import { validateCacheOperation } from '../../../lib/validations/cache';

// ============================================================================
// Constants and Configuration
// ============================================================================

/**
 * Cache API endpoints
 */
const CACHE_ENDPOINTS = {
  SYSTEM_CACHE: `${API_BASE_URL}/system/cache`,
  SERVICE_CACHE: `${API_BASE_URL}/system/cache`,
  CACHE_STATUS: `${API_BASE_URL}/system/cache/status`,
  CACHE_STATS: `${API_BASE_URL}/system/cache/stats`,
} as const;

/**
 * React Query keys for cache operations
 */
export const CACHE_QUERY_KEYS = {
  all: ['cache'] as const,
  status: () => [...CACHE_QUERY_KEYS.all, 'status'] as const,
  stats: () => [...CACHE_QUERY_KEYS.all, 'stats'] as const,
  services: () => [...CACHE_QUERY_KEYS.all, 'services'] as const,
  service: (serviceName: string) => [...CACHE_QUERY_KEYS.services(), serviceName] as const,
} as const;

/**
 * Cache operation retry configuration
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  retryCondition: (error: Error) => {
    // Retry on network errors or 5xx status codes
    const errorString = error.message.toLowerCase();
    return errorString.includes('network') || 
           errorString.includes('timeout') ||
           errorString.includes('500') ||
           errorString.includes('502') ||
           errorString.includes('503') ||
           errorString.includes('504');
  },
} as const;

/**
 * Performance thresholds per React/Next.js Integration Requirements
 */
const PERFORMANCE_THRESHOLDS = {
  CACHE_HIT_MAX_MS: 50,      // Cache hit responses under 50ms
  API_RESPONSE_MAX_MS: 2000, // API responses under 2 seconds
} as const;

// ============================================================================
// Cache Operations Hook Implementation
// ============================================================================

/**
 * Custom React hook providing comprehensive cache management operations.
 * 
 * Features:
 * - System-wide cache flushing with progress tracking
 * - Per-service cache clearing with optimistic updates
 * - Real-time cache status monitoring
 * - Intelligent error handling with automatic retry
 * - Performance monitoring and validation
 * - MSW integration for development and testing
 * 
 * @returns CacheOperationsResult - Complete cache operations interface
 */
export function useCacheOperations(): CacheOperationsResult {
  const queryClient = useQueryClient();
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);
  const [operationStartTime, setOperationStartTime] = useState<number | null>(null);

  // ============================================================================
  // Cache Status and Statistics Queries
  // ============================================================================

  /**
   * Cache status query with intelligent caching and automatic revalidation
   */
  const {
    data: cacheStatus,
    isLoading: isStatusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: CACHE_QUERY_KEYS.status(),
    queryFn: async (): Promise<CacheStatusResponse> => {
      const startTime = performance.now();
      
      try {
        const response = await apiGet<CacheStatusResponse>(CACHE_ENDPOINTS.CACHE_STATUS, {
          // Optimize for cache hit performance
          includeCacheControl: true,
          snackbarError: 'Failed to fetch cache status',
        });
        
        const duration = performance.now() - startTime;
        
        // Validate performance requirements
        if (duration > PERFORMANCE_THRESHOLDS.API_RESPONSE_MAX_MS) {
          console.warn(`Cache status query exceeded performance threshold: ${duration}ms`);
        }
        
        return response;
      } catch (error) {
        console.error('Cache status query failed:', error);
        throw error;
      }
    },
    staleTime: 30000, // 30 seconds - cache status is relatively stable
    gcTime: 300000,   // 5 minutes - keep in memory for performance
    refetchInterval: 60000, // Refresh every minute for real-time monitoring
    retry: (failureCount, error) => {
      return failureCount < RETRY_CONFIG.maxRetries && 
             RETRY_CONFIG.retryCondition(error as Error);
    },
    retryDelay: RETRY_CONFIG.retryDelay,
  });

  /**
   * System cache statistics query for monitoring and analytics
   */
  const {
    data: cacheStats,
    isLoading: isStatsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: CACHE_QUERY_KEYS.stats(),
    queryFn: async (): Promise<SystemCacheStats> => {
      const startTime = performance.now();
      
      try {
        const response = await apiGet<SystemCacheStats>(CACHE_ENDPOINTS.CACHE_STATS, {
          includeCacheControl: true,
          snackbarError: 'Failed to fetch cache statistics',
        });
        
        const duration = performance.now() - startTime;
        
        // Validate cache hit performance requirement
        if (duration <= PERFORMANCE_THRESHOLDS.CACHE_HIT_MAX_MS) {
          console.debug(`Cache stats retrieved in ${duration}ms (cache hit)`);
        } else if (duration > PERFORMANCE_THRESHOLDS.API_RESPONSE_MAX_MS) {
          console.warn(`Cache stats query exceeded performance threshold: ${duration}ms`);
        }
        
        return response;
      } catch (error) {
        console.error('Cache statistics query failed:', error);
        throw error;
      }
    },
    staleTime: 15000, // 15 seconds - stats change more frequently
    gcTime: 300000,   // 5 minutes
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: (failureCount, error) => {
      return failureCount < RETRY_CONFIG.maxRetries && 
             RETRY_CONFIG.retryCondition(error as Error);
    },
    retryDelay: RETRY_CONFIG.retryDelay,
  });

  // ============================================================================
  // System Cache Flush Mutation
  // ============================================================================

  /**
   * System cache flush mutation with optimistic updates and rollback capability
   */
  const flushSystemCacheMutation = useMutation({
    mutationFn: async (options: CacheFlushOptions = {}): Promise<void> => {
      // Validate operation parameters
      const validation = validateCacheOperation({ type: 'system_flush', options });
      if (!validation.isValid) {
        throw new Error(`Cache operation validation failed: ${validation.errors.join(', ')}`);
      }

      const startTime = performance.now();
      setOperationStartTime(startTime);
      
      try {
        await apiDelete<void>(CACHE_ENDPOINTS.SYSTEM_CACHE, {
          snackbarSuccess: options.suppressNotification ? undefined : 'cache.systemCacheFlushed',
          snackbarError: 'cache.systemCacheFlushFailed',
          showSpinner: !options.silent,
          // Add operation timeout to prevent hanging requests
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });
        
        const duration = performance.now() - startTime;
        
        // Log performance metrics
        console.info(`System cache flush completed in ${duration}ms`);
        
        // Validate performance requirements
        if (duration > PERFORMANCE_THRESHOLDS.API_RESPONSE_MAX_MS) {
          console.warn(`System cache flush exceeded performance threshold: ${duration}ms`);
        }
        
      } catch (error) {
        console.error('System cache flush failed:', error);
        throw error;
      } finally {
        setOperationStartTime(null);
      }
    },
    onMutate: async (options) => {
      setIsOperationInProgress(true);
      
      if (!options.silent && !options.suppressNotification) {
        toast.loading('Flushing system cache...', { id: 'system-cache-flush' });
      }
      
      // Cancel any outgoing refetches to prevent optimistic updates from being overwritten
      await queryClient.cancelQueries({ queryKey: CACHE_QUERY_KEYS.all });
      
      // Snapshot the previous cache state for potential rollback
      const previousStatus = queryClient.getQueryData(CACHE_QUERY_KEYS.status());
      const previousStats = queryClient.getQueryData(CACHE_QUERY_KEYS.stats());
      
      // Optimistically update the cache status
      queryClient.setQueryData(CACHE_QUERY_KEYS.status(), (old: CacheStatusResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          systemCacheEnabled: true,
          lastFlushTime: new Date().toISOString(),
          isFlushInProgress: true,
        };
      });
      
      // Optimistically reset cache statistics
      queryClient.setQueryData(CACHE_QUERY_KEYS.stats(), (old: SystemCacheStats | undefined) => {
        if (!old) return old;
        return {
          ...old,
          hitRate: 0,
          totalHits: 0,
          totalMisses: 0,
          totalRequests: 0,
          cacheSize: 0,
          lastClearTime: new Date().toISOString(),
        };
      });
      
      return { previousStatus, previousStats };
    },
    onSuccess: (_, options) => {
      setIsOperationInProgress(false);
      
      if (!options.silent && !options.suppressNotification) {
        toast.success('System cache flushed successfully', { id: 'system-cache-flush' });
      }
      
      // Invalidate and refetch cache-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: CACHE_QUERY_KEYS.all });
      
      // Force refetch of cache status to get updated state
      refetchStatus();
      refetchStats();
    },
    onError: (error, options, context) => {
      setIsOperationInProgress(false);
      
      // Rollback optimistic updates
      if (context?.previousStatus) {
        queryClient.setQueryData(CACHE_QUERY_KEYS.status(), context.previousStatus);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(CACHE_QUERY_KEYS.stats(), context.previousStats);
      }
      
      if (!options.silent && !options.suppressNotification) {
        toast.error('Failed to flush system cache', { id: 'system-cache-flush' });
      }
      
      console.error('System cache flush error:', error);
    },
    retry: (failureCount, error) => {
      return failureCount < RETRY_CONFIG.maxRetries && 
             RETRY_CONFIG.retryCondition(error as Error);
    },
    retryDelay: RETRY_CONFIG.retryDelay,
  });

  // ============================================================================
  // Service Cache Clear Mutation
  // ============================================================================

  /**
   * Per-service cache clear mutation with optimistic updates
   */
  const clearServiceCacheMutation = useMutation({
    mutationFn: async ({ serviceName, options = {} }: { 
      serviceName: string; 
      options?: CacheFlushOptions 
    }): Promise<void> => {
      // Validate operation parameters
      const validation = validateCacheOperation({ 
        type: 'service_clear', 
        serviceName,
        options 
      });
      if (!validation.isValid) {
        throw new Error(`Cache operation validation failed: ${validation.errors.join(', ')}`);
      }

      const startTime = performance.now();
      
      try {
        await apiDelete<void>(`${CACHE_ENDPOINTS.SERVICE_CACHE}/${serviceName}`, {
          snackbarSuccess: options.suppressNotification ? undefined : 'cache.serviceCacheFlushed',
          snackbarError: 'cache.serviceCacheFlushFailed',
          showSpinner: !options.silent,
          // Add operation timeout
          signal: AbortSignal.timeout(15000), // 15 second timeout for service operations
        });
        
        const duration = performance.now() - startTime;
        console.info(`Service cache clear for '${serviceName}' completed in ${duration}ms`);
        
        // Validate performance requirements
        if (duration > PERFORMANCE_THRESHOLDS.API_RESPONSE_MAX_MS) {
          console.warn(`Service cache clear exceeded performance threshold: ${duration}ms`);
        }
        
      } catch (error) {
        console.error(`Service cache clear failed for '${serviceName}':`, error);
        throw error;
      }
    },
    onMutate: async ({ serviceName, options }) => {
      setIsOperationInProgress(true);
      
      if (!options.silent && !options.suppressNotification) {
        toast.loading(`Clearing cache for ${serviceName}...`, { id: `service-cache-${serviceName}` });
      }
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: CACHE_QUERY_KEYS.service(serviceName) });
      
      // Snapshot previous service cache state for rollback
      const previousServiceData = queryClient.getQueryData(CACHE_QUERY_KEYS.service(serviceName));
      
      // Optimistically update service cache state
      queryClient.setQueryData(CACHE_QUERY_KEYS.service(serviceName), (old: CacheEntry | undefined) => {
        if (!old) return old;
        return {
          ...old,
          lastClearTime: new Date().toISOString(),
          isClearInProgress: true,
          hitRate: 0,
          size: 0,
        };
      });
      
      return { previousServiceData, serviceName };
    },
    onSuccess: (_, { serviceName, options }) => {
      setIsOperationInProgress(false);
      
      if (!options.silent && !options.suppressNotification) {
        toast.success(`Cache cleared for ${serviceName}`, { id: `service-cache-${serviceName}` });
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: CACHE_QUERY_KEYS.service(serviceName) });
      queryClient.invalidateQueries({ queryKey: CACHE_QUERY_KEYS.stats() });
      
      // Force refetch to get updated state
      refetchStats();
    },
    onError: (error, { serviceName, options }, context) => {
      setIsOperationInProgress(false);
      
      // Rollback optimistic updates
      if (context?.previousServiceData) {
        queryClient.setQueryData(
          CACHE_QUERY_KEYS.service(serviceName), 
          context.previousServiceData
        );
      }
      
      if (!options.silent && !options.suppressNotification) {
        toast.error(`Failed to clear cache for ${serviceName}`, { 
          id: `service-cache-${serviceName}` 
        });
      }
      
      console.error(`Service cache clear error for '${serviceName}':`, error);
    },
    retry: (failureCount, error) => {
      return failureCount < RETRY_CONFIG.maxRetries && 
             RETRY_CONFIG.retryCondition(error as Error);
    },
    retryDelay: RETRY_CONFIG.retryDelay,
  });

  // ============================================================================
  // Convenience Functions and Performance Monitoring
  // ============================================================================

  /**
   * Flush system cache with enhanced error handling and performance monitoring
   */
  const flushSystemCache = useCallback(async (options: CacheFlushOptions = {}) => {
    try {
      await flushSystemCacheMutation.mutateAsync(options);
    } catch (error) {
      // Enhanced error handling per Section 4.1.3 connection failure recovery workflow
      console.error('System cache flush operation failed:', error);
      
      if (!options.silent && !options.suppressNotification) {
        toast.error('System cache flush failed. Please try again.');
      }
      
      throw error;
    }
  }, [flushSystemCacheMutation]);

  /**
   * Clear service cache with enhanced error handling and performance monitoring
   */
  const clearServiceCache = useCallback(async (serviceName: string, options: CacheFlushOptions = {}) => {
    if (!serviceName?.trim()) {
      throw new Error('Service name is required for cache clearing operation');
    }
    
    try {
      await clearServiceCacheMutation.mutateAsync({ serviceName, options });
    } catch (error) {
      // Enhanced error handling per Section 4.1.3 connection failure recovery workflow
      console.error(`Service cache clear operation failed for '${serviceName}':`, error);
      
      if (!options.silent && !options.suppressNotification) {
        toast.error(`Failed to clear cache for ${serviceName}. Please try again.`);
      }
      
      throw error;
    }
  }, [clearServiceCacheMutation]);

  /**
   * Get current operation duration for progress tracking
   */
  const getCurrentOperationDuration = useCallback((): number | null => {
    if (!operationStartTime) return null;
    return performance.now() - operationStartTime;
  }, [operationStartTime]);

  /**
   * Check if cache operations are performing within acceptable thresholds
   */
  const isPerformanceOptimal = useCallback((): boolean => {
    const duration = getCurrentOperationDuration();
    if (!duration) return true;
    return duration <= PERFORMANCE_THRESHOLDS.API_RESPONSE_MAX_MS;
  }, [getCurrentOperationDuration]);

  // ============================================================================
  // Return Hook Interface
  // ============================================================================

  return {
    // Cache status and statistics
    cacheStatus,
    cacheStats,
    isStatusLoading,
    isStatsLoading,
    statusError: statusError as Error | null,
    statsError: statsError as Error | null,
    
    // Cache operations
    flushSystemCache,
    clearServiceCache,
    
    // Operation state
    isOperationInProgress,
    isSystemFlushInProgress: flushSystemCacheMutation.isPending,
    isServiceClearInProgress: clearServiceCacheMutation.isPending,
    
    // Error states
    systemFlushError: flushSystemCacheMutation.error as Error | null,
    serviceClearError: clearServiceCacheMutation.error as Error | null,
    
    // Performance monitoring
    getCurrentOperationDuration,
    isPerformanceOptimal,
    
    // Manual refetch capabilities
    refetchStatus,
    refetchStats,
    
    // Reset error states
    resetSystemFlushError: flushSystemCacheMutation.reset,
    resetServiceClearError: clearServiceCacheMutation.reset,
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default useCacheOperations;