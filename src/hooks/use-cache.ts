'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CacheType } from '@/types/cache';

/**
 * Cache Management Hook
 * 
 * Provides React Query-powered cache management operations including
 * system cache flushing, service cache management, and real-time status monitoring.
 * 
 * Features:
 * - System-wide cache flush operations
 * - Per-service cache management
 * - Real-time cache status monitoring with SWR
 * - Optimistic updates and error handling
 * - Automatic revalidation and background refresh
 * 
 * @returns {object} Cache management operations and state
 */
export function useCache() {
  const queryClient = useQueryClient();

  // Cache queries
  const CACHE_QUERY_KEY = ['cache'];
  const CACHE_LIST_QUERY_KEY = ['cache', 'list'];

  /**
   * Fetch cache list with React Query
   */
  const {
    data: cacheList,
    isLoading: isLoadingCacheList,
    error: cacheListError,
    refetch: refetchCacheList
  } = useQuery({
    queryKey: CACHE_LIST_QUERY_KEY,
    queryFn: async (): Promise<CacheType[]> => {
      const response = await apiClient.get('/system/cache');
      return response.data?.resource || [];
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2
  });

  /**
   * System cache flush mutation
   */
  const {
    mutateAsync: flushSystemCache,
    isPending: isFlushingSystemCache,
    error: systemFlushError
  } = useMutation({
    mutationFn: async (): Promise<void> => {
      await apiClient.delete('/system/cache');
    },
    onSuccess: () => {
      // Invalidate all cache-related queries
      queryClient.invalidateQueries({ queryKey: CACHE_QUERY_KEY });
      
      // Show success notification
      console.log('System cache flushed successfully');
    },
    onError: (error) => {
      console.error('Failed to flush system cache:', error);
      throw error;
    }
  });

  /**
   * Service cache flush mutation
   */
  const {
    mutateAsync: flushServiceCache,
    isPending: isFlushingServiceCache,
    error: serviceFlushError
  } = useMutation({
    mutationFn: async (serviceName: string): Promise<void> => {
      await apiClient.delete(`/system/cache/${serviceName}`);
    },
    onSuccess: (_, serviceName) => {
      // Invalidate cache list query
      queryClient.invalidateQueries({ queryKey: CACHE_LIST_QUERY_KEY });
      
      // Show success notification
      console.log(`Service cache flushed successfully for: ${serviceName}`);
    },
    onError: (error) => {
      console.error('Failed to flush service cache:', error);
      throw error;
    }
  });

  /**
   * Cache status monitoring query
   */
  const {
    data: cacheStatus,
    isLoading: isLoadingCacheStatus
  } = useQuery({
    queryKey: ['cache', 'status'],
    queryFn: async (): Promise<{
      systemCacheSize: number;
      serviceCacheCount: number;
      lastFlushTime: string | null;
    }> => {
      const response = await apiClient.get('/system/cache/status');
      return response.data || {
        systemCacheSize: 0,
        serviceCacheCount: 0,
        lastFlushTime: null
      };
    },
    staleTime: 10000, // 10 seconds
    gcTime: 60000, // 1 minute
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1
  });

  /**
   * Prefetch cache data for improved performance
   */
  const prefetchCacheData = async () => {
    await queryClient.prefetchQuery({
      queryKey: CACHE_LIST_QUERY_KEY,
      queryFn: async () => {
        const response = await apiClient.get('/system/cache');
        return response.data?.resource || [];
      }
    });
  };

  /**
   * Clear all cache-related queries
   */
  const clearCacheQueries = () => {
    queryClient.removeQueries({ queryKey: CACHE_QUERY_KEY });
  };

  return {
    // Data
    cacheList: cacheList || [],
    cacheStatus,
    
    // Loading states
    isLoadingCacheList,
    isLoadingCacheStatus,
    isFlushingSystemCache,
    isFlushingServiceCache,
    
    // Error states
    cacheListError,
    systemFlushError,
    serviceFlushError,
    
    // Operations
    flushSystemCache,
    flushServiceCache,
    refetchCacheList,
    prefetchCacheData,
    clearCacheQueries,
    
    // Computed states
    isLoading: isLoadingCacheList || isLoadingCacheStatus,
    hasError: !!(cacheListError || systemFlushError || serviceFlushError)
  };
}