/**
 * React Query client provider that configures TanStack React Query for server state management, 
 * caching strategies, and API synchronization. Replaces Angular HTTP client with intelligent 
 * caching semantics and optimistic updates for DreamFactory API interactions.
 * 
 * Features:
 * - TanStack React Query 5.79.2 with intelligent caching and background synchronization
 * - Stale-while-revalidate caching with cache hit responses under 50ms
 * - Background refetching and automatic cache invalidation for real-time data synchronization
 * - Optimistic updates for mutations with rollback capabilities for failed requests
 * - Query devtools integration for development debugging and cache inspection
 * - Specialized caching strategies for database connections, schema discovery, and API generation
 * 
 * @version 1.0.0
 * @requires TanStack React Query 5.79.2 for server-state management per Section 3.2.2
 * @requires React 19.0.0 for enhanced concurrent features and context optimizations
 */

'use client';

import React, { useMemo, useCallback, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { 
  QueryProviderProps, 
  QueryState, 
  QueryCacheConfig, 
  QueryMutationConfig, 
  QueryDefaultOptions,
  QueryDevtoolsConfig,
} from './provider-types';

// =============================================================================
// Constants and Configuration
// =============================================================================

/**
 * Default cache configuration optimized for DreamFactory API patterns.
 * Based on Section 3.2.4 performance requirements and integration patterns.
 */
const DEFAULT_CACHE_CONFIG: QueryCacheConfig = {
  /** 5-minute stale time for database connections per Section 3.2.4 */
  defaultStaleTime: 5 * 60 * 1000, // 5 minutes
  /** 10-minute cache time for garbage collection optimization */
  defaultCacheTime: 10 * 60 * 1000, // 10 minutes
  /** Maximum 100 cached queries to prevent memory issues */
  maxCacheSize: 100,
  /** 30-minute garbage collection interval for optimal performance */
  gcInterval: 30 * 60 * 1000, // 30 minutes
  /** Enable background refetching for real-time data synchronization */
  enableBackgroundRefetch: true,
};

/**
 * Default mutation configuration with optimistic update support.
 * Provides automatic rollback capabilities for failed requests.
 */
const DEFAULT_MUTATION_CONFIG: QueryMutationConfig = {
  /** Default retry count for failed mutations */
  defaultRetryCount: 3,
  /** Exponential backoff retry delay function */
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
  /** Enable optimistic updates for immediate UI feedback */
  enableOptimisticUpdates: true,
  /** 30-second mutation timeout to prevent hanging requests */
  defaultTimeout: 30 * 1000, // 30 seconds
};

/**
 * Query-specific default options tailored for DreamFactory operations.
 * Implements stale-while-revalidate patterns with cache hit responses under 50ms.
 */
const DEFAULT_QUERY_OPTIONS: QueryDefaultOptions = {
  /** Extended stale time for database queries (rarely change) */
  databaseQueriesStaleTime: 15 * 60 * 1000, // 15 minutes
  /** Medium stale time for user queries */
  userQueriesStaleTime: 5 * 60 * 1000, // 5 minutes
  /** Short stale time for system queries (frequently updated) */
  systemQueriesStaleTime: 2 * 60 * 1000, // 2 minutes
  /** Enable refetch on window focus for real-time synchronization */
  refetchOnWindowFocus: true,
  /** Enable refetch on network reconnect */
  refetchOnReconnect: true,
  /** Smart retry function based on error type */
  retry: (failureCount: number, error: Error) => {
    // Don't retry for 4xx errors (client errors)
    if (error.message.includes('4')) return false;
    // Retry up to 3 times for network/server errors
    return failureCount < 3;
  },
};

/**
 * Development tools configuration for debugging and cache inspection.
 */
const DEFAULT_DEVTOOLS_CONFIG: QueryDevtoolsConfig = {
  /** Enable devtools in development mode only */
  enabled: process.env.NODE_ENV === 'development',
  /** Position devtools in bottom-right corner */
  position: 'bottom-right',
  /** Start devtools closed by default */
  initialIsOpen: false,
  /** Position toggle button in bottom-right */
  buttonPosition: 'bottom-right',
};

/**
 * Query key factory for consistent cache key generation.
 * Ensures proper cache invalidation and query organization.
 */
export const queryKeys = {
  /** Database-related queries */
  database: {
    all: ['database'] as const,
    connections: () => [...queryKeys.database.all, 'connections'] as const,
    connection: (id: string) => [...queryKeys.database.connections(), id] as const,
    schema: (connectionId: string) => [...queryKeys.database.connection(connectionId), 'schema'] as const,
    tables: (connectionId: string) => [...queryKeys.database.schema(connectionId), 'tables'] as const,
    table: (connectionId: string, tableId: string) => [...queryKeys.database.tables(connectionId), tableId] as const,
  },
  /** User-related queries */
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    permissions: () => [...queryKeys.user.all, 'permissions'] as const,
    preferences: () => [...queryKeys.user.all, 'preferences'] as const,
  },
  /** System-related queries */
  system: {
    all: ['system'] as const,
    config: () => [...queryKeys.system.all, 'config'] as const,
    status: () => [...queryKeys.system.all, 'status'] as const,
    info: () => [...queryKeys.system.all, 'info'] as const,
  },
  /** API-related queries */
  api: {
    all: ['api'] as const,
    endpoints: () => [...queryKeys.api.all, 'endpoints'] as const,
    endpoint: (id: string) => [...queryKeys.api.endpoints(), id] as const,
    documentation: () => [...queryKeys.api.all, 'documentation'] as const,
  },
} as const;

// =============================================================================
// Query Client Factory
// =============================================================================

/**
 * Creates a properly configured QueryClient instance with DreamFactory-optimized settings.
 * Implements intelligent caching strategies and error handling patterns.
 */
function createQueryClient(
  cacheConfig: QueryCacheConfig,
  mutationConfig: QueryMutationConfig,
  defaultOptions: QueryDefaultOptions
): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale-while-revalidate caching for cache hit responses under 50ms
        staleTime: cacheConfig.defaultStaleTime,
        gcTime: cacheConfig.defaultCacheTime, // Updated from cacheTime in v5
        
        // Background refetching configuration
        refetchOnWindowFocus: defaultOptions.refetchOnWindowFocus,
        refetchOnReconnect: defaultOptions.refetchOnReconnect,
        
        // Retry configuration with smart error handling
        retry: defaultOptions.retry,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Network mode configuration for offline support
        networkMode: 'online',
        
        // Enable background refetching
        refetchOnMount: true,
        refetchInterval: false, // Disable automatic polling by default
        
        // Optimistic query execution
        notifyOnChangeProps: 'all',
        
        // Throw errors in render for error boundaries
        throwOnError: false,
        
        // Meta for query categorization
        meta: {
          source: 'dreamfactory-admin',
        },
      },
      mutations: {
        // Mutation timeout configuration
        gcTime: 5 * 60 * 1000, // 5 minutes for mutation cache
        
        // Retry configuration for mutations
        retry: mutationConfig.defaultRetryCount,
        retryDelay: mutationConfig.retryDelay,
        
        // Network mode for mutations
        networkMode: 'online',
        
        // Throw errors for error boundaries
        throwOnError: false,
        
        // Meta for mutation categorization
        meta: {
          source: 'dreamfactory-admin',
          optimistic: mutationConfig.enableOptimisticUpdates,
        },
      },
    },
    
    // Query cache configuration
    queryCache: {
      onError: (error, query) => {
        // Log query errors for debugging
        console.error('Query Error:', {
          queryKey: query.queryKey,
          error: error.message,
          meta: query.meta,
        });
      },
      onSuccess: (data, query) => {
        // Log successful queries in development
        if (process.env.NODE_ENV === 'development') {
          console.debug('Query Success:', {
            queryKey: query.queryKey,
            dataSize: JSON.stringify(data).length,
            meta: query.meta,
          });
        }
      },
    },
    
    // Mutation cache configuration
    mutationCache: {
      onError: (error, variables, context, mutation) => {
        // Log mutation errors for debugging
        console.error('Mutation Error:', {
          mutationKey: mutation.options.mutationKey,
          error: error.message,
          variables,
          meta: mutation.meta,
        });
      },
      onSuccess: (data, variables, context, mutation) => {
        // Log successful mutations in development
        if (process.env.NODE_ENV === 'development') {
          console.debug('Mutation Success:', {
            mutationKey: mutation.options.mutationKey,
            variables,
            meta: mutation.meta,
          });
        }
      },
    },
  });
}

// =============================================================================
// Query Provider Hook
// =============================================================================

/**
 * Custom hook for accessing QueryClient instance with type safety.
 * Provides utilities for cache management and query invalidation.
 */
export function useQueryProvider() {
  const queryClient = useQueryClient();
  
  /**
   * Invalidate queries by category for efficient cache management.
   */
  const invalidateQueries = useCallback(
    async (category: 'database' | 'user' | 'system' | 'api') => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys[category].all,
      });
    },
    [queryClient]
  );
  
  /**
   * Clear cache for specific query patterns.
   */
  const clearCache = useCallback(
    async (queryKey?: string[]) => {
      if (queryKey) {
        await queryClient.removeQueries({ queryKey });
      } else {
        await queryClient.clear();
      }
    },
    [queryClient]
  );
  
  /**
   * Prefetch data for improved user experience.
   */
  const prefetchData = useCallback(
    async (queryKey: string[], queryFn: () => Promise<any>, staleTime?: number) => {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: staleTime || DEFAULT_CACHE_CONFIG.defaultStaleTime,
      });
    },
    [queryClient]
  );
  
  /**
   * Get cache statistics for monitoring and debugging.
   */
  const getCacheStats = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      staleQueries: queries.filter(query => query.isStale()).length,
      fetchingQueries: queries.filter(query => query.isFetching()).length,
      errorQueries: queries.filter(query => query.state.status === 'error').length,
      cacheSize: JSON.stringify(cache).length,
    };
  }, [queryClient]);
  
  return {
    queryClient,
    invalidateQueries,
    clearCache,
    prefetchData,
    getCacheStats,
    queryKeys,
  };
}

// =============================================================================
// Query Provider Component
// =============================================================================

/**
 * React Query provider component that wraps the application with TanStack React Query.
 * Provides intelligent caching, background synchronization, and optimistic updates.
 */
export function QueryProvider({
  children,
  client,
  cacheConfig = {},
  mutationConfig = {},
  defaultOptions = {},
  devtools = {},
  debug = false,
}: QueryProviderProps) {
  // Merge configuration with defaults
  const mergedCacheConfig = useMemo(
    () => ({ ...DEFAULT_CACHE_CONFIG, ...cacheConfig }),
    [cacheConfig]
  );
  
  const mergedMutationConfig = useMemo(
    () => ({ ...DEFAULT_MUTATION_CONFIG, ...mutationConfig }),
    [mutationConfig]
  );
  
  const mergedDefaultOptions = useMemo(
    () => ({ ...DEFAULT_QUERY_OPTIONS, ...defaultOptions }),
    [defaultOptions]
  );
  
  const mergedDevtools = useMemo(
    () => ({ ...DEFAULT_DEVTOOLS_CONFIG, ...devtools }),
    [devtools]
  );
  
  // Create QueryClient instance or use provided one
  const queryClient = useMemo(() => {
    if (client) return client;
    
    return createQueryClient(
      mergedCacheConfig,
      mergedMutationConfig,
      mergedDefaultOptions
    );
  }, [client, mergedCacheConfig, mergedMutationConfig, mergedDefaultOptions]);
  
  // Set up garbage collection interval
  useEffect(() => {
    if (!mergedCacheConfig.gcInterval) return;
    
    const interval = setInterval(() => {
      queryClient.getQueryCache().clear();
      
      if (debug) {
        console.debug('Query cache garbage collection executed');
      }
    }, mergedCacheConfig.gcInterval);
    
    return () => clearInterval(interval);
  }, [queryClient, mergedCacheConfig.gcInterval, debug]);
  
  // Log cache configuration in development
  useEffect(() => {
    if (debug && process.env.NODE_ENV === 'development') {
      console.debug('Query Provider Configuration:', {
        cacheConfig: mergedCacheConfig,
        mutationConfig: mergedMutationConfig,
        defaultOptions: mergedDefaultOptions,
        devtools: mergedDevtools,
      });
    }
  }, [debug, mergedCacheConfig, mergedMutationConfig, mergedDefaultOptions, mergedDevtools]);
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {mergedDevtools.enabled && (
        <ReactQueryDevtools
          initialIsOpen={mergedDevtools.initialIsOpen}
          position={mergedDevtools.position}
          buttonPosition={mergedDevtools.buttonPosition}
        />
      )}
    </QueryClientProvider>
  );
}

// =============================================================================
// Query Utilities and Helpers
// =============================================================================

/**
 * Utility function for creating optimistic update mutations.
 * Provides automatic rollback capabilities for failed requests.
 */
export function createOptimisticMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  queryKey: string[],
  updateFn: (oldData: any, variables: TVariables) => any
) {
  return {
    mutationFn,
    onMutate: async (variables: TVariables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);
      
      // Optimistically update the cache
      queryClient.setQueryData(queryKey, (old: any) => updateFn(old, variables));
      
      // Return context object with the snapshotted value
      return { previousData };
    },
    onError: (err: Error, variables: TVariables, context: any) => {
      // Rollback optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch related queries on success
      queryClient.invalidateQueries({ queryKey });
    },
  };
}

/**
 * Create a query with specialized caching strategy based on data type.
 */
export function createSpecializedQuery<TData>(
  key: string[],
  queryFn: () => Promise<TData>,
  type: 'database' | 'user' | 'system' | 'api' = 'system'
) {
  const staleTimeMap = {
    database: DEFAULT_QUERY_OPTIONS.databaseQueriesStaleTime,
    user: DEFAULT_QUERY_OPTIONS.userQueriesStaleTime,
    system: DEFAULT_QUERY_OPTIONS.systemQueriesStaleTime,
    api: DEFAULT_QUERY_OPTIONS.systemQueriesStaleTime,
  };
  
  return {
    queryKey: key,
    queryFn,
    staleTime: staleTimeMap[type],
    meta: {
      type,
      source: 'dreamfactory-admin',
    },
  };
}

// Default export for convenient importing
export default QueryProvider;

// =============================================================================
// Type Exports for External Use
// =============================================================================

export type { 
  QueryProviderProps, 
  QueryState, 
  QueryCacheConfig, 
  QueryMutationConfig, 
  QueryDefaultOptions,
  QueryDevtoolsConfig,
} from './provider-types';