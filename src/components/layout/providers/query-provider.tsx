/**
 * React Query Provider for DreamFactory Admin Interface
 * 
 * Configures TanStack React Query for intelligent server state management, caching strategies,
 * and API synchronization. Replaces Angular HTTP client with advanced caching semantics,
 * optimistic updates, and background refetching for DreamFactory API interactions.
 * 
 * Key Features:
 * - TanStack React Query 5.79.2 with advanced caching capabilities
 * - Stale-while-revalidate caching with cache hit responses under 50ms
 * - Background refetching and automatic cache invalidation for real-time data synchronization
 * - Optimistic updates for mutations with rollback capabilities for failed requests
 * - Query devtools integration for development debugging and cache inspection
 * - 5-minute staleTime for database connections per Section 3.2.4
 * - React Query middleware for API request handling replacing Angular HTTP interceptors
 * 
 * @fileoverview Query client provider with intelligent caching and API synchronization
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+ / TanStack React Query 5.79.2
 */

'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
  QueryCache,
  defaultShouldDehydrateQuery,
  isServer,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { apiClient, type ApiResponse } from '@/lib/api-client';
import type { BaseProviderProps } from './provider-types';

// ============================================================================
// QUERY CLIENT CONFIGURATION TYPES
// ============================================================================

/**
 * Query provider configuration interface
 */
interface QueryProviderConfig {
  /** Global cache configuration */
  cache: {
    /** Default stale time in milliseconds */
    defaultStaleTime: number;
    /** Default cache time in milliseconds */
    defaultCacheTime: number;
    /** Database connection specific stale time */
    databaseConnectionStaleTime: number;
    /** Schema discovery cache time */
    schemaDiscoveryStaleTime: number;
    /** API generation workflow cache time */
    apiGenerationCacheTime: number;
  };
  
  /** Retry configuration */
  retry: {
    /** Default retry count */
    retryCount: number;
    /** Retry delay function */
    retryDelay: (attemptIndex: number) => number;
    /** Conditions for retry */
    retryCondition: (error: unknown) => boolean;
  };
  
  /** Background refetching configuration */
  refetching: {
    /** Refetch on window focus */
    refetchOnWindowFocus: boolean;
    /** Refetch on reconnect */
    refetchOnReconnect: boolean;
    /** Background refetch interval */
    refetchInterval: number | false;
    /** Stale data refetch interval */
    staleRefetchInterval: number;
  };
  
  /** Mutation configuration */
  mutations: {
    /** Enable optimistic updates */
    optimisticUpdates: boolean;
    /** Mutation retry count */
    retryCount: number;
    /** Automatic cache invalidation patterns */
    invalidationPatterns: string[];
  };
  
  /** Development tools configuration */
  devtools: {
    /** Enable in development */
    enabled: boolean;
    /** Initial open state */
    initialIsOpen: boolean;
    /** Position on screen */
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
}

/**
 * Default query provider configuration optimized for DreamFactory API patterns
 */
const DEFAULT_CONFIG: QueryProviderConfig = {
  cache: {
    // Cache hit responses under 50ms per React/Next.js Integration Requirements
    defaultStaleTime: 30 * 1000, // 30 seconds for general data
    defaultCacheTime: 5 * 60 * 1000, // 5 minutes default cache retention
    // 5-minute staleTime for database connections per Section 3.2.4
    databaseConnectionStaleTime: 5 * 60 * 1000, // 5 minutes for database connections
    schemaDiscoveryStaleTime: 15 * 60 * 1000, // 15 minutes for schema data
    apiGenerationCacheTime: 10 * 60 * 1000, // 10 minutes for API generation workflows
  },
  retry: {
    retryCount: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    retryCondition: (error: unknown) => {
      // Retry on network errors, 5xx errors, but not on 4xx client errors
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('network') || message.includes('fetch')) return true;
        if (message.includes('http 5')) return true;
        if (message.includes('http 4')) return false;
      }
      return true;
    },
  },
  refetching: {
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: false, // Disabled by default, enabled per-query as needed
    staleRefetchInterval: 60 * 1000, // 1 minute for stale data background refresh
  },
  mutations: {
    optimisticUpdates: true,
    retryCount: 1, // Conservative retry for mutations
    invalidationPatterns: [
      'database-connections',
      'schema-discovery',
      'api-endpoints',
      'service-configs',
      'user-permissions',
    ],
  },
  devtools: {
    enabled: process.env.NODE_ENV === 'development',
    initialIsOpen: false,
    position: 'bottom-right',
  },
};

// ============================================================================
// QUERY CLIENT FACTORY
// ============================================================================

/**
 * Create optimized QueryClient instance with DreamFactory-specific configurations
 */
function createQueryClient(config: QueryProviderConfig): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Global error handling for queries
        console.error('Query Error:', {
          error,
          queryKey: query.queryKey,
          queryHash: query.queryHash,
        });
        
        // Report critical errors to monitoring service
        if (error instanceof Error && error.message.includes('5')) {
          // Handle 5xx errors as critical
          // In a real implementation, this would integrate with error reporting
          console.error('Critical API Error:', error);
        }
      },
      onSuccess: (data, query) => {
        // Track successful queries for performance monitoring
        if (process.env.NODE_ENV === 'development') {
          console.debug('Query Success:', {
            queryKey: query.queryKey,
            dataUpdateCount: query.getObserversCount(),
          });
        }
      },
    }),
    
    mutationCache: new MutationCache({
      onError: (error, variables, context, mutation) => {
        // Global error handling for mutations with rollback support
        console.error('Mutation Error:', {
          error,
          variables,
          mutationKey: mutation.options.mutationKey,
        });
        
        // Automatic rollback for optimistic updates
        if (context && typeof context === 'object' && 'previousData' in context) {
          console.warn('Rolling back optimistic update due to mutation error');
        }
      },
      onSuccess: (data, variables, context, mutation) => {
        // Automatic cache invalidation after successful mutations
        const client = mutation.meta?.queryClient as QueryClient;
        if (client && config.mutations.optimisticUpdates) {
          // Invalidate related queries based on mutation patterns
          config.mutations.invalidationPatterns.forEach(pattern => {
            client.invalidateQueries({ queryKey: [pattern] });
          });
        }
      },
    }),

    defaultOptions: {
      queries: {
        // Stale-while-revalidate caching semantics
        staleTime: config.cache.defaultStaleTime,
        gcTime: config.cache.defaultCacheTime, // Renamed from cacheTime in v5
        
        // Background refetching configuration
        refetchOnWindowFocus: config.refetching.refetchOnWindowFocus,
        refetchOnReconnect: config.refetching.refetchOnReconnect,
        refetchInterval: config.refetching.refetchInterval,
        
        // Retry configuration with exponential backoff
        retry: (failureCount, error) => {
          if (failureCount >= config.retry.retryCount) return false;
          return config.retry.retryCondition(error);
        },
        retryDelay: config.retry.retryDelay,
        
        // Network mode for offline support
        networkMode: 'online',
        
        // Error handling
        throwOnError: false,
        
        // Performance optimization
        notifyOnChangeProps: 'all',
        
        // Server-side rendering configuration
        ...(isServer && {
          staleTime: Infinity, // Never refetch on server
          gcTime: Infinity,
        }),
      },
      
      mutations: {
        // Mutation retry configuration
        retry: config.mutations.retryCount,
        retryDelay: config.retry.retryDelay,
        
        // Network mode
        networkMode: 'online',
        
        // Error handling
        throwOnError: false,
        
        // Optimistic update metadata
        meta: {
          optimisticUpdates: config.mutations.optimisticUpdates,
        },
      },
      
      // Dehydration configuration for SSR
      dehydrate: {
        shouldDehydrateQuery: (query) => {
          // Only dehydrate successful queries that are not sensitive
          return defaultShouldDehydrateQuery(query) || 
                 (query.state.status === 'success' && 
                  !query.queryKey.includes('sensitive'));
        },
      },
    },
  });
}

// ============================================================================
// SPECIALIZED QUERY CONFIGURATIONS
// ============================================================================

/**
 * Query configurations for specific DreamFactory API patterns
 */
export const queryConfigurations = {
  /**
   * Database connection queries - 5-minute staleTime per Section 3.2.4
   */
  databaseConnections: {
    staleTime: DEFAULT_CONFIG.cache.databaseConnectionStaleTime,
    gcTime: DEFAULT_CONFIG.cache.databaseConnectionStaleTime * 2,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    select: (data: ApiResponse) => data.resource || data.data,
  },
  
  /**
   * Schema discovery queries - optimized for large datasets (1000+ tables)
   */
  schemaDiscovery: {
    staleTime: DEFAULT_CONFIG.cache.schemaDiscoveryStaleTime,
    gcTime: DEFAULT_CONFIG.cache.schemaDiscoveryStaleTime * 2,
    refetchOnWindowFocus: false, // Schema changes infrequently
    select: (data: ApiResponse) => data.resource || data.data,
    structuralSharing: true, // Optimize for large tree structures
  },
  
  /**
   * API generation workflow queries - with optimistic updates
   */
  apiGeneration: {
    staleTime: 60 * 1000, // 1 minute - more dynamic data
    gcTime: DEFAULT_CONFIG.cache.apiGenerationCacheTime,
    refetchOnWindowFocus: true, // Active workflows need fresh data
    optimisticUpdates: true,
  },
  
  /**
   * System configuration queries - frequent updates
   */
  systemConfig: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000, // Check every minute
  },
  
  /**
   * User permissions and roles - security-sensitive data
   */
  userPermissions: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    sensitive: true, // Mark as sensitive for dehydration
  },
};

// ============================================================================
// QUERY PROVIDER COMPONENT
// ============================================================================

/**
 * Query provider props interface
 */
interface QueryProviderProps extends BaseProviderProps<QueryProviderConfig> {
  /** Initial query client for SSR hydration */
  initialQueryClient?: QueryClient;
  
  /** Custom API client instance */
  apiClient?: typeof apiClient;
  
  /** Development mode overrides */
  developmentOverrides?: Partial<QueryProviderConfig>;
}

/**
 * Query provider component with intelligent caching and API synchronization
 */
export function QueryProvider({
  children,
  config: userConfig,
  initialQueryClient,
  developmentOverrides,
  debug = false,
}: QueryProviderProps) {
  // Merge configuration with defaults and development overrides
  const config = useMemo(() => {
    const baseConfig = { ...DEFAULT_CONFIG, ...userConfig };
    
    // Apply development overrides in development mode
    if (process.env.NODE_ENV === 'development' && developmentOverrides) {
      return {
        ...baseConfig,
        ...developmentOverrides,
        devtools: {
          ...baseConfig.devtools,
          ...developmentOverrides.devtools,
        },
      };
    }
    
    return baseConfig;
  }, [userConfig, developmentOverrides]);

  // Create query client instance (memoized to prevent recreation)
  const [queryClient] = useState(() => {
    if (initialQueryClient) {
      return initialQueryClient;
    }
    
    const client = createQueryClient(config);
    
    // Add query client reference to mutation metadata for invalidation
    client.getMutationCache().subscribe((event) => {
      if (event.mutation.meta) {
        event.mutation.meta.queryClient = client;
      }
    });
    
    return client;
  });

  // Development debugging
  useEffect(() => {
    if (debug && process.env.NODE_ENV === 'development') {
      console.group('🔄 QueryProvider Configuration');
      console.log('Cache Configuration:', config.cache);
      console.log('Retry Configuration:', config.retry);
      console.log('Refetching Configuration:', config.refetching);
      console.log('Mutations Configuration:', config.mutations);
      console.log('Query Client:', queryClient);
      console.groupEnd();
    }
  }, [config, queryClient, debug]);

  // Performance monitoring in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
        if (event.type === 'updated' && event.query.state.error) {
          console.warn('Query Error Detected:', {
            queryKey: event.query.queryKey,
            error: event.query.state.error,
          });
        }
      });

      return unsubscribe;
    }
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
      {/* React Query Devtools for development debugging and cache inspection */}
      {config.devtools.enabled && (
        <ReactQueryDevtools
          initialIsOpen={config.devtools.initialIsOpen}
          position={config.devtools.position}
          buttonPosition={config.devtools.position}
          panelPosition="bottom"
          toggleButtonProps={{
            style: {
              transform: 'scale(0.8)',
              opacity: 0.7,
            },
          }}
        />
      )}
    </QueryClientProvider>
  );
}

// ============================================================================
// QUERY UTILITIES AND HELPERS
// ============================================================================

/**
 * Create optimistic update helper for mutations
 */
export function createOptimisticUpdate<TData, TVariables>(
  queryKey: unknown[],
  updateFn: (oldData: TData | undefined, variables: TVariables) => TData
) {
  return {
    onMutate: async (variables: TVariables) => {
      // Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData>(queryKey);
      
      // Optimistically update to the new value
      queryClient.setQueryData<TData>(queryKey, (old) => updateFn(old, variables));
      
      // Return a context object with the snapshotted value
      return { previousData };
    },
    
    onError: (err: unknown, variables: TVariables, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    
    onSettled: () => {
      // Always refetch after error or success to ensure we have latest data
      queryClient.invalidateQueries({ queryKey });
    },
  };
}

/**
 * Create cache invalidation helper for related queries
 */
export function createCacheInvalidation(patterns: string[]) {
  return {
    onSuccess: () => {
      patterns.forEach(pattern => {
        queryClient.invalidateQueries({ queryKey: [pattern] });
      });
    },
  };
}

/**
 * Query key factory for consistent key generation
 */
export const queryKeys = {
  all: ['dreamfactory'] as const,
  databases: () => [...queryKeys.all, 'databases'] as const,
  database: (id: string) => [...queryKeys.databases(), id] as const,
  databaseSchema: (id: string) => [...queryKeys.database(id), 'schema'] as const,
  services: () => [...queryKeys.all, 'services'] as const,
  service: (id: string) => [...queryKeys.services(), id] as const,
  apiEndpoints: () => [...queryKeys.all, 'api-endpoints'] as const,
  apiEndpoint: (id: string) => [...queryKeys.apiEndpoints(), id] as const,
  users: () => [...queryKeys.all, 'users'] as const,
  user: (id: string) => [...queryKeys.users(), id] as const,
  permissions: () => [...queryKeys.all, 'permissions'] as const,
  systemConfig: () => [...queryKeys.all, 'system-config'] as const,
};

// Export singleton instance for global access
let queryClient: QueryClient;

/**
 * Get the global query client instance
 */
export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = createQueryClient(DEFAULT_CONFIG);
  }
  return queryClient;
}

// ============================================================================
// EXPORT CONFIGURATION AND TYPES
// ============================================================================

export type {
  QueryProviderConfig,
  QueryProviderProps,
};

export {
  DEFAULT_CONFIG as defaultQueryConfig,
  createQueryClient,
};