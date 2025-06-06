/**
 * DreamFactory Cache Management Types
 * 
 * Type definitions for cache configuration and management functionality.
 * Maintains compatibility with existing DreamFactory cache APIs while
 * providing enhanced TypeScript support for React components.
 * 
 * @fileoverview Cache management type definitions
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

// ============================================================================
// Core Cache Types
// ============================================================================

/**
 * Cache type configuration definition.
 * Represents a cache store type available in DreamFactory.
 */
export interface CacheType {
  /** Unique identifier for the cache type */
  name: string;
  
  /** Human-readable label for the cache type */
  label: string;
  
  /** Detailed description of the cache type functionality */
  description: string;
  
  /** Technical type identifier for the cache implementation */
  type: string;
}

/**
 * Cache row entry for simplified display purposes.
 * Used in table views and selection components.
 */
export interface CacheRow {
  /** Cache identifier name */
  name: string;
  
  /** Display label for the cache */
  label: string;
}

// ============================================================================
// Cache Service Interfaces
// ============================================================================

/**
 * Cache configuration options for API requests.
 * Extends base request options with cache-specific parameters.
 */
export interface CacheRequestOptions {
  /** Include all fields in response (default behavior) */
  fields?: string;
  
  /** Force refresh of cache data */
  refresh?: boolean;
  
  /** Filter cache entries by specific criteria */
  filter?: string;
  
  /** Sort cache entries by specified field */
  sort?: string;
  
  /** Limit number of cache entries returned */
  limit?: number;
  
  /** Offset for pagination */
  offset?: number;
  
  /** Include total count in response */
  includeCount?: boolean;
}

/**
 * Cache store configuration details.
 * Extended cache information including connection details.
 */
export interface CacheStoreConfig extends CacheType {
  /** Cache store connection configuration */
  config?: Record<string, any>;
  
  /** Cache store status information */
  status?: 'active' | 'inactive' | 'error';
  
  /** Last updated timestamp */
  lastUpdated?: string;
  
  /** Cache size information if available */
  size?: number;
  
  /** Cache hit rate statistics */
  hitRate?: number;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * React Query cache hook return type.
 * Provides type-safe access to cache data and loading states.
 */
export interface UseCacheResult {
  /** Cache entries data */
  data: CacheType[] | undefined;
  
  /** Loading state indicator */
  isLoading: boolean;
  
  /** Error state information */
  error: Error | null;
  
  /** Data staleness indicator */
  isStale: boolean;
  
  /** Manual refetch function */
  refetch: () => Promise<void>;
  
  /** Mutation loading state */
  isMutating: boolean;
}

/**
 * Cache operation mutation options.
 * Configuration for cache creation, update, and deletion operations.
 */
export interface CacheMutationOptions {
  /** Success callback function */
  onSuccess?: (data: any) => void;
  
  /** Error callback function */
  onError?: (error: Error) => void;
  
  /** Optimistic update flag */
  optimistic?: boolean;
  
  /** Invalidate related queries after mutation */
  invalidateQueries?: string[];
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  CacheType,
  CacheRow,
  CacheRequestOptions,
  CacheStoreConfig,
  UseCacheResult,
  CacheMutationOptions,
};