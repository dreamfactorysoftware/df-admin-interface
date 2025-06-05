/**
 * Client-side caching types adapted for React Query and SWR integration
 * Provides intelligent cache management interfaces for DreamFactory Admin Interface
 * 
 * Supports:
 * - React Query cache configuration and query invalidation
 * - SWR-compatible cache revalidation and stale-while-revalidate patterns  
 * - Optimistic updates and background synchronization
 * - Performance-optimized cache entry management
 */

/**
 * Core cache type definition maintaining compatibility with existing DreamFactory cache configuration
 * while extending for React Query and SWR integration patterns
 */
export interface CacheType {
  /** Unique cache identifier */
  name: string;
  /** Human-readable cache label for UI display */
  label: string;
  /** Detailed cache description */
  description: string;
  /** Cache implementation type (redis, memory, file, etc.) */
  type: string;
  /** React Query specific cache configuration */
  queryConfig?: ReactQueryCacheConfig;
  /** SWR specific cache configuration */
  swrConfig?: SWRCacheConfig;
}

/**
 * Simplified cache row for table rendering and list displays
 * Optimized for React component rendering performance
 */
export interface CacheRow {
  /** Cache identifier */
  name: string;
  /** Display label */
  label: string;
  /** Current cache status for UI indicators */
  status?: CacheStatus;
  /** Cache hit ratio for performance monitoring */
  hitRatio?: number;
  /** Last access timestamp for cache analytics */
  lastAccessed?: Date;
  /** Cache size in bytes for capacity monitoring */
  size?: number;
}

/**
 * React Query cache configuration interface
 * Supports intelligent caching with background synchronization
 */
export interface ReactQueryCacheConfig {
  /** Time in milliseconds before data is considered stale (default: 0) */
  staleTime?: number;
  /** Time in milliseconds to keep cache in memory after last usage (default: 5 minutes) */
  cacheTime?: number;
  /** Maximum number of retry attempts on query failure (default: 3) */
  retry?: number | boolean | ((failureCount: number, error: Error) => boolean);
  /** Delay between retry attempts in milliseconds */
  retryDelay?: number | ((retryAttempt: number) => number);
  /** Refetch on window focus (default: true) */
  refetchOnWindowFocus?: boolean;
  /** Refetch on network reconnect (default: true) */
  refetchOnReconnect?: boolean;
  /** Refetch on component mount (default: true) */
  refetchOnMount?: boolean | 'always';
  /** Enable background refetching (default: true) */
  backgroundRefetch?: boolean;
  /** Custom equality function for data comparison */
  structuralSharing?: boolean | ((oldData: unknown, newData: unknown) => unknown);
}

/**
 * SWR cache configuration interface
 * Supports stale-while-revalidate patterns with background updates
 */
export interface SWRCacheConfig {
  /** Refresh interval in milliseconds for periodic revalidation */
  refreshInterval?: number;
  /** Revalidate on focus (default: true) */
  revalidateOnFocus?: boolean;
  /** Revalidate on network reconnect (default: true) */
  revalidateOnReconnect?: boolean;
  /** Dedupe identical requests within interval (default: 2000ms) */
  dedupingInterval?: number;
  /** Retry on error (default: true) */
  shouldRetryOnError?: boolean | ((error: Error) => boolean);
  /** Error retry interval in milliseconds */
  errorRetryInterval?: number;
  /** Maximum error retry count */
  errorRetryCount?: number;
  /** Fallback data when loading */
  fallbackData?: unknown;
  /** Keep previous data when key changes */
  keepPreviousData?: boolean;
}

/**
 * Cache entry with metadata for advanced cache management
 * Supports both React Query and SWR cache entry patterns
 */
export interface CacheEntry<TData = unknown> {
  /** Unique cache key */
  key: string | readonly unknown[];
  /** Cached data payload */
  data: TData;
  /** Timestamp when data was cached */
  cachedAt: number;
  /** Timestamp when data becomes stale */
  staleAt?: number;
  /** Timestamp when cache entry expires */
  expiresAt?: number;
  /** Current cache status */
  status: CacheEntryStatus;
  /** Error information if fetch failed */
  error?: Error;
  /** Optimistic update information */
  optimistic?: OptimisticUpdate<TData>;
  /** Background revalidation state */
  backgroundUpdate?: BackgroundUpdateState;
}

/**
 * Cache entry status enumeration
 * Tracks the lifecycle state of cached data
 */
export enum CacheEntryStatus {
  /** Data is fresh and up-to-date */
  FRESH = 'fresh',
  /** Data is stale but still usable */
  STALE = 'stale',
  /** Data is being fetched for the first time */
  LOADING = 'loading',
  /** Background revalidation in progress */
  REVALIDATING = 'revalidating',
  /** Fetch operation failed */
  ERROR = 'error',
  /** Cache entry is invalidated */
  INVALID = 'invalid'
}

/**
 * Overall cache status for monitoring
 */
export enum CacheStatus {
  /** Cache is operational */
  ACTIVE = 'active',
  /** Cache is warming up */
  WARMING = 'warming',
  /** Cache has errors */
  ERROR = 'error',
  /** Cache is disabled */
  DISABLED = 'disabled'
}

/**
 * Optimistic update configuration for React Query mutations
 * Enables immediate UI updates before server confirmation
 */
export interface OptimisticUpdate<TData = unknown> {
  /** Previous data before optimistic update */
  previousData: TData;
  /** Optimistically updated data */
  optimisticData: TData;
  /** Timestamp when optimistic update was applied */
  appliedAt: number;
  /** Whether update was confirmed by server */
  confirmed: boolean;
  /** Rollback function if update fails */
  rollback: () => void;
}

/**
 * Background update state for tracking revalidation
 * Supports stale-while-revalidate patterns
 */
export interface BackgroundUpdateState {
  /** Whether background update is in progress */
  isUpdating: boolean;
  /** Timestamp when background update started */
  startedAt?: number;
  /** Update progress (0-1) for long-running operations */
  progress?: number;
  /** Update priority (high for user-triggered, low for automatic) */
  priority: 'high' | 'normal' | 'low';
}

/**
 * Cache invalidation options for precise cache management
 * Supports both React Query and SWR invalidation patterns
 */
export interface CacheInvalidationOptions {
  /** Whether to refetch immediately after invalidation */
  refetch?: boolean;
  /** Whether to invalidate exact match only or pattern-based */
  exact?: boolean;
  /** Predicate function for selective invalidation */
  predicate?: (entry: CacheEntry) => boolean;
  /** Whether to invalidate related/dependent queries */
  invalidateRelated?: boolean;
}

/**
 * Cache mutation context for optimistic updates
 * Provides rollback capabilities for failed mutations
 */
export interface CacheMutationContext<TData = unknown, TVariables = unknown> {
  /** Previous cached data for rollback */
  previousData?: TData;
  /** Optimistic data applied during mutation */
  optimisticData?: TData;
  /** Mutation variables */
  variables: TVariables;
  /** Cache keys affected by mutation */
  affectedKeys: (string | readonly unknown[])[];
}

/**
 * Cache performance metrics for monitoring and optimization
 */
export interface CacheMetrics {
  /** Total cache hits */
  hits: number;
  /** Total cache misses */
  misses: number;
  /** Cache hit ratio (0-1) */
  hitRatio: number;
  /** Average response time for cache hits (ms) */
  avgHitTime: number;
  /** Average response time for cache misses (ms) */
  avgMissTime: number;
  /** Total memory usage in bytes */
  memoryUsage: number;
  /** Number of cache entries */
  entryCount: number;
  /** Cache eviction count */
  evictions: number;
}

/**
 * Global cache configuration for the application
 * Combines React Query and SWR default configurations
 */
export interface GlobalCacheConfig {
  /** Default React Query configuration */
  defaultQueryConfig: ReactQueryCacheConfig;
  /** Default SWR configuration */
  defaultSWRConfig: SWRCacheConfig;
  /** Maximum cache size in bytes */
  maxCacheSize?: number;
  /** Cache garbage collection interval (ms) */
  gcInterval?: number;
  /** Enable cache persistence */
  persistCache?: boolean;
  /** Cache storage key prefix */
  storageKeyPrefix?: string;
}

/**
 * Cache provider type for dependency injection
 * Supports multiple cache implementations
 */
export type CacheProvider = 'react-query' | 'swr' | 'hybrid';

/**
 * Cache key factory function type
 * Generates consistent cache keys for queries
 */
export type CacheKeyFactory<TParams = unknown> = (params: TParams) => string | readonly unknown[];

/**
 * Cache serialization options for persistence
 */
export interface CacheSerializationOptions {
  /** Custom serializer function */
  serialize?: (data: unknown) => string;
  /** Custom deserializer function */
  deserialize?: (data: string) => unknown;
  /** Include metadata in serialization */
  includeMetadata?: boolean;
  /** Compression for large cache entries */
  compress?: boolean;
}

/**
 * Type-safe cache key definitions for DreamFactory entities
 * Provides consistent cache key patterns across the application
 */
export const CACHE_KEYS = {
  /** Database services cache keys */
  SERVICES: {
    LIST: ['services'] as const,
    DETAIL: (id: string) => ['services', id] as const,
    SCHEMA: (serviceId: string) => ['services', serviceId, 'schema'] as const,
    TABLES: (serviceId: string) => ['services', serviceId, 'tables'] as const,
    TABLE_DETAIL: (serviceId: string, tableName: string) => ['services', serviceId, 'tables', tableName] as const,
  },
  /** Database schema cache keys */
  SCHEMA: {
    LIST: ['schema'] as const,
    DATABASE: (serviceId: string) => ['schema', serviceId] as const,
    RELATIONSHIPS: (serviceId: string) => ['schema', serviceId, 'relationships'] as const,
  },
  /** API documentation cache keys */
  API_DOCS: {
    LIST: ['api-docs'] as const,
    SERVICE: (serviceId: string) => ['api-docs', serviceId] as const,
    SPEC: (serviceId: string) => ['api-docs', serviceId, 'spec'] as const,
  },
  /** User management cache keys */
  USERS: {
    LIST: ['users'] as const,
    DETAIL: (id: string) => ['users', id] as const,
    PROFILE: ['users', 'profile'] as const,
  },
  /** System configuration cache keys */
  SYSTEM: {
    CONFIG: ['system', 'config'] as const,
    INFO: ['system', 'info'] as const,
    CACHE: ['system', 'cache'] as const,
  },
} as const;

/**
 * Cache key type extraction utility
 * Extracts the TypeScript type from cache key definitions
 */
export type CacheKey = typeof CACHE_KEYS[keyof typeof CACHE_KEYS];
export type CacheKeyValue = CacheKey extends (...args: any[]) => infer R ? R : CacheKey;