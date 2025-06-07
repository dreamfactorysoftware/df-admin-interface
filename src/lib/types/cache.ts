/**
 * Client-side caching types adapted for React Query and SWR integration
 * Provides intelligent cache management interfaces for the DreamFactory Admin Interface
 * 
 * This module defines comprehensive cache types supporting:
 * - React Query cache configuration and invalidation
 * - SWR stale-while-revalidate patterns
 * - Optimistic updates and background synchronization
 * - Performance-optimized cache entries for React component rendering
 */

// =====================================================
// Core Cache Configuration Types
// =====================================================

/**
 * Cache time-to-live configuration for different data types
 * Optimized based on data volatility and usage patterns
 */
export interface CacheTimeConfig {
  /** Schema data cache duration (5 minutes) */
  schema: number;
  /** Dynamic data cache duration (1 minute) */
  dynamic: number;
  /** Configuration data cache duration (30 seconds) */
  config: number;
  /** Static data cache duration (10 minutes) */
  static: number;
  /** Session data cache duration (15 minutes) */
  session: number;
}

/**
 * Default cache time configuration values
 * Aligned with performance requirements: cache hit responses under 50ms
 */
export const DEFAULT_CACHE_TIME: CacheTimeConfig = {
  schema: 5 * 60 * 1000,    // 5 minutes
  dynamic: 1 * 60 * 1000,   // 1 minute
  config: 30 * 1000,        // 30 seconds
  static: 10 * 60 * 1000,   // 10 minutes
  session: 15 * 60 * 1000,  // 15 minutes
} as const;

// =====================================================
// SWR Cache Types
// =====================================================

/**
 * SWR configuration interface for stale-while-revalidate patterns
 * Supports real-time configuration synchronization
 */
export interface SWRCacheConfig<TData = any> {
  /** Cache key for data identification */
  key: string | (() => string);
  /** Data fetcher function */
  fetcher?: (key: string) => Promise<TData>;
  /** Revalidation interval in milliseconds */
  refreshInterval?: number;
  /** Revalidate on window focus */
  revalidateOnFocus?: boolean;
  /** Revalidate on network reconnect */
  revalidateOnReconnect?: boolean;
  /** Revalidate on mount */
  revalidateOnMount?: boolean;
  /** Dedupe requests within interval */
  dedupingInterval?: number;
  /** Focus throttle interval */
  focusThrottleInterval?: number;
  /** Load lazy data on demand */
  suspense?: boolean;
  /** Error retry configuration */
  errorRetryCount?: number;
  /** Error retry interval */
  errorRetryInterval?: number;
  /** Should retry on error function */
  shouldRetryOnError?: boolean | ((error: any) => boolean);
  /** Compare function for data equality */
  compare?: (a: TData | undefined, b: TData | undefined) => boolean;
}

/**
 * SWR cache entry with metadata for React component optimization
 */
export interface SWRCacheEntry<TData = any> {
  /** Cached data */
  data?: TData;
  /** Loading state */
  isLoading: boolean;
  /** Validating state (background revalidation) */
  isValidating: boolean;
  /** Error state */
  error?: Error;
  /** Manual revalidation trigger */
  mutate: (data?: TData | Promise<TData> | ((current?: TData) => TData), shouldRevalidate?: boolean) => Promise<TData | undefined>;
  /** Cache key */
  key: string;
  /** Last updated timestamp */
  lastUpdated?: number;
}

/**
 * SWR cache invalidation patterns
 */
export interface SWRInvalidationConfig {
  /** Invalidate specific keys */
  keys?: string[];
  /** Invalidate by key prefix pattern */
  keyPrefixes?: string[];
  /** Invalidate by regex pattern */
  patterns?: RegExp[];
  /** Global cache clear */
  clearAll?: boolean;
  /** Revalidate after invalidation */
  revalidate?: boolean;
}

// =====================================================
// React Query Cache Types
// =====================================================

/**
 * React Query cache configuration for complex server-state management
 * Supports advanced caching, mutations, and optimistic updates
 */
export interface ReactQueryCacheConfig<TData = any, TError = Error, TVariables = void> {
  /** Query key for cache identification */
  queryKey: readonly unknown[];
  /** Query function to fetch data */
  queryFn?: () => Promise<TData>;
  /** Time until data is considered stale */
  staleTime?: number;
  /** Time to keep data in cache */
  cacheTime?: number;
  /** Enable query when condition is met */
  enabled?: boolean;
  /** Retry configuration */
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean);
  /** Retry delay function */
  retryDelay?: number | ((retryAttempt: number, error: TError) => number);
  /** Refetch on window focus */
  refetchOnWindowFocus?: boolean;
  /** Refetch on reconnect */
  refetchOnReconnect?: boolean;
  /** Refetch on mount */
  refetchOnMount?: boolean;
  /** Select specific data from query result */
  select?: (data: TData) => any;
  /** Initial data */
  initialData?: TData;
  /** Initial data updated at timestamp */
  initialDataUpdatedAt?: number;
  /** Placeholder data */
  placeholderData?: TData;
  /** Keep previous data during refetch */
  keepPreviousData?: boolean;
  /** Refetch interval */
  refetchInterval?: number;
  /** Refetch interval in background */
  refetchIntervalInBackground?: boolean;
  /** Network mode */
  networkMode?: 'online' | 'always' | 'offlineFirst';
}

/**
 * React Query cache entry with comprehensive state management
 */
export interface ReactQueryCacheEntry<TData = any, TError = Error> {
  /** Cached data */
  data?: TData;
  /** Previous data during refetch */
  previousData?: TData;
  /** Error state */
  error?: TError;
  /** Loading state */
  isLoading: boolean;
  /** Fetching state (includes background fetching) */
  isFetching: boolean;
  /** Stale data indicator */
  isStale: boolean;
  /** Success state */
  isSuccess: boolean;
  /** Error state indicator */
  isError: boolean;
  /** Idle state */
  isIdle: boolean;
  /** Loading error state */
  isLoadingError: boolean;
  /** Refetch error state */
  isRefetchError: boolean;
  /** Data updated at timestamp */
  dataUpdatedAt: number;
  /** Error updated at timestamp */
  errorUpdatedAt: number;
  /** Failure count */
  failureCount: number;
  /** Refetch function */
  refetch: () => Promise<any>;
  /** Remove query from cache */
  remove: () => void;
  /** Query status */
  status: 'idle' | 'loading' | 'error' | 'success';
  /** Fetch status */
  fetchStatus: 'idle' | 'fetching' | 'paused';
}

/**
 * React Query mutation configuration for optimistic updates
 */
export interface ReactQueryMutationConfig<TData = any, TError = Error, TVariables = void, TContext = unknown> {
  /** Mutation function */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Mutation key for cache identification */
  mutationKey?: readonly unknown[];
  /** Optimistic update function */
  onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
  /** Success callback */
  onSuccess?: (data: TData, variables: TVariables, context?: TContext) => Promise<unknown> | void;
  /** Error callback */
  onError?: (error: TError, variables: TVariables, context?: TContext) => Promise<unknown> | void;
  /** Settled callback (success or error) */
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context?: TContext) => Promise<unknown> | void;
  /** Retry configuration */
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean);
  /** Retry delay */
  retryDelay?: number | ((retryAttempt: number, error: TError) => number);
  /** Network mode */
  networkMode?: 'online' | 'always' | 'offlineFirst';
}

/**
 * React Query cache invalidation configuration
 */
export interface ReactQueryInvalidationConfig {
  /** Query keys to invalidate */
  queryKey?: readonly unknown[];
  /** Invalidation type */
  type?: 'active' | 'inactive' | 'all';
  /** Refetch after invalidation */
  refetchType?: 'active' | 'inactive' | 'all' | 'none';
  /** Exact key match */
  exact?: boolean;
  /** Predicate function for selective invalidation */
  predicate?: (query: any) => boolean;
}

// =====================================================
// Background Synchronization Types
// =====================================================

/**
 * Background synchronization configuration
 * Supports automatic data synchronization and conflict resolution
 */
export interface BackgroundSyncConfig {
  /** Enable background synchronization */
  enabled: boolean;
  /** Sync interval in milliseconds */
  interval: number;
  /** Retry failed sync attempts */
  retryFailedSync: boolean;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Sync priority level */
  priority: 'low' | 'normal' | 'high';
  /** Conflict resolution strategy */
  conflictResolution: 'client' | 'server' | 'merge' | 'prompt';
  /** Network conditions for sync */
  networkConditions: {
    /** Sync on WiFi */
    wifi: boolean;
    /** Sync on cellular */
    cellular: boolean;
    /** Minimum connection speed (Mbps) */
    minSpeed?: number;
  };
}

/**
 * Background sync status tracking
 */
export interface BackgroundSyncStatus {
  /** Last sync timestamp */
  lastSync?: number;
  /** Next scheduled sync */
  nextSync?: number;
  /** Sync in progress */
  syncing: boolean;
  /** Pending sync operations */
  pendingOperations: number;
  /** Failed sync operations */
  failedOperations: number;
  /** Sync error details */
  lastError?: {
    timestamp: number;
    error: Error;
    operation: string;
  };
}

// =====================================================
// Optimistic Update Types
// =====================================================

/**
 * Optimistic update configuration
 * Enables immediate UI updates with rollback capabilities
 */
export interface OptimisticUpdateConfig<TData = any, TVariables = any> {
  /** Optimistic update function */
  optimisticUpdate: (currentData: TData | undefined, variables: TVariables) => TData;
  /** Rollback function for failed updates */
  rollback: (previousData: TData | undefined) => TData | undefined;
  /** Conflict resolution on rollback */
  conflictResolution?: (optimisticData: TData, serverData: TData) => TData;
  /** Update timeout before rollback */
  timeout?: number;
  /** Show optimistic state in UI */
  showOptimisticState?: boolean;
}

/**
 * Optimistic update tracking state
 */
export interface OptimisticUpdateState<TData = any> {
  /** Original data before optimistic update */
  originalData?: TData;
  /** Optimistically updated data */
  optimisticData?: TData;
  /** Update operation identifier */
  operationId: string;
  /** Update timestamp */
  timestamp: number;
  /** Update status */
  status: 'pending' | 'confirmed' | 'failed' | 'rolled-back';
  /** Variables used for the update */
  variables?: any;
}

// =====================================================
// Cache Performance Optimization Types
// =====================================================

/**
 * Cache performance metrics for monitoring and optimization
 */
export interface CachePerformanceMetrics {
  /** Cache hit ratio (0-1) */
  hitRatio: number;
  /** Average response time (ms) */
  avgResponseTime: number;
  /** Cache size in bytes */
  cacheSize: number;
  /** Number of cache entries */
  entryCount: number;
  /** Memory usage percentage */
  memoryUsage: number;
  /** Background revalidation count */
  revalidationCount: number;
  /** Failed request count */
  failureCount: number;
  /** Timestamp of last measurement */
  lastMeasured: number;
}

/**
 * Cache row optimization for React component rendering
 * Minimizes re-renders through selective data exposure
 */
export interface CacheRowOptimization<TData = any> {
  /** Row identifier */
  id: string | number;
  /** Row data */
  data: TData;
  /** Row version for change detection */
  version: number;
  /** Last updated timestamp */
  lastUpdated: number;
  /** Row dependencies for cache invalidation */
  dependencies?: string[];
  /** Computed values cache */
  computed?: Record<string, any>;
  /** Render optimization flags */
  renderOptimization: {
    /** Skip re-render if data unchanged */
    skipUnchanged: boolean;
    /** Shallow comparison for change detection */
    shallowCompare: boolean;
    /** Custom comparison function */
    compareFunction?: (prev: TData, next: TData) => boolean;
  };
}

// =====================================================
// Cache Strategy Types
// =====================================================

/**
 * Cache strategy configuration for different data types
 * Optimizes caching behavior based on data characteristics
 */
export interface CacheStrategy {
  /** Strategy name */
  name: string;
  /** Cache provider (SWR or React Query) */
  provider: 'swr' | 'react-query';
  /** Time-to-live configuration */
  ttl: Partial<CacheTimeConfig>;
  /** Revalidation strategy */
  revalidation: {
    /** Automatic revalidation */
    automatic: boolean;
    /** Revalidation triggers */
    triggers: ('focus' | 'reconnect' | 'mount' | 'interval')[];
    /** Custom revalidation logic */
    customLogic?: () => boolean;
  };
  /** Persistence settings */
  persistence: {
    /** Enable cache persistence */
    enabled: boolean;
    /** Storage type */
    storage: 'localStorage' | 'sessionStorage' | 'indexedDB';
    /** Encryption for sensitive data */
    encrypted?: boolean;
  };
  /** Performance optimization settings */
  optimization: {
    /** Enable background updates */
    backgroundUpdates: boolean;
    /** Debounce rapid updates */
    debounceMs?: number;
    /** Batch multiple updates */
    batchUpdates?: boolean;
    /** Preload related data */
    preload?: string[];
  };
}

// =====================================================
// Type Guards and Utilities
// =====================================================

/**
 * Type guard to check if cache entry is from SWR
 */
export function isSWRCacheEntry<TData>(entry: any): entry is SWRCacheEntry<TData> {
  return entry && typeof entry.mutate === 'function' && typeof entry.key === 'string';
}

/**
 * Type guard to check if cache entry is from React Query
 */
export function isReactQueryCacheEntry<TData>(entry: any): entry is ReactQueryCacheEntry<TData> {
  return entry && typeof entry.refetch === 'function' && 'status' in entry && 'fetchStatus' in entry;
}

/**
 * Cache entry union type for flexible cache handling
 */
export type CacheEntry<TData = any> = SWRCacheEntry<TData> | ReactQueryCacheEntry<TData>;

/**
 * Cache configuration union type
 */
export type CacheConfig<TData = any> = SWRCacheConfig<TData> | ReactQueryCacheConfig<TData>;

/**
 * Cache invalidation union type
 */
export type CacheInvalidation = SWRInvalidationConfig | ReactQueryInvalidationConfig;

// =====================================================
// Default Export
// =====================================================

/**
 * Default cache configuration for the DreamFactory Admin Interface
 * Optimized for database service management and API generation workflows
 */
export const DEFAULT_CACHE_CONFIG: CacheStrategy = {
  name: 'dreamfactory-default',
  provider: 'react-query',
  ttl: DEFAULT_CACHE_TIME,
  revalidation: {
    automatic: true,
    triggers: ['focus', 'reconnect'],
    customLogic: undefined,
  },
  persistence: {
    enabled: true,
    storage: 'sessionStorage',
    encrypted: false,
  },
  optimization: {
    backgroundUpdates: true,
    debounceMs: 300,
    batchUpdates: true,
    preload: [],
  },
} as const;