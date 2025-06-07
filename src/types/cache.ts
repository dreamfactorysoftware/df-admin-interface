/**
 * Cache Type Definitions
 * 
 * TypeScript interfaces for cache management system.
 * Defines the structure for cache entries, operations, and status monitoring.
 */

/**
 * Complete cache entry metadata
 */
export interface CacheType {
  /** Unique cache identifier/name */
  name: string;
  /** Human-readable display label */
  label: string;
  /** Detailed description of cache contents */
  description: string;
  /** Cache type classification */
  type: string;
}

/**
 * Lightweight cache representation for table rows and lists
 */
export interface CacheRow {
  /** Unique cache identifier/name */
  name: string;
  /** Human-readable display label */
  label: string;
}

/**
 * Cache operation status
 */
export interface CacheOperationStatus {
  /** Operation success status */
  success: boolean;
  /** Status message */
  message: string;
  /** Operation timestamp */
  timestamp: Date;
  /** Operation duration in milliseconds */
  duration?: number;
}

/**
 * System cache status information
 */
export interface CacheStatusInfo {
  /** Total system cache size in bytes */
  systemCacheSize: number;
  /** Number of individual service caches */
  serviceCacheCount: number;
  /** Last system flush timestamp */
  lastFlushTime: string | null;
  /** Cache hit ratio percentage */
  hitRatio?: number;
  /** Memory usage percentage */
  memoryUsage?: number;
}

/**
 * Cache configuration settings
 */
export interface CacheConfig {
  /** Enable/disable caching */
  enabled: boolean;
  /** Time-to-live in seconds */
  ttl: number;
  /** Maximum cache size in MB */
  maxSize: number;
  /** Compression enabled */
  compression: boolean;
  /** Auto-refresh interval in seconds */
  autoRefreshInterval?: number;
}

/**
 * Service-specific cache metadata
 */
export interface ServiceCacheInfo extends CacheRow {
  /** Service ID */
  serviceId: string;
  /** Cache size in bytes */
  size: number;
  /** Number of cached entries */
  entryCount: number;
  /** Last accessed timestamp */
  lastAccessed: string;
  /** Cache configuration */
  config?: CacheConfig;
}

/**
 * Cache flush operation payload
 */
export interface CacheFlushPayload {
  /** Target cache name (empty for system-wide) */
  cacheName?: string;
  /** Force flush even if cache is locked */
  force?: boolean;
  /** Confirm destructive operation */
  confirm: boolean;
}

/**
 * Cache statistics
 */
export interface CacheStatistics {
  /** Total cache hits */
  hits: number;
  /** Total cache misses */
  misses: number;
  /** Hit ratio percentage */
  hitRatio: number;
  /** Total requests served */
  totalRequests: number;
  /** Average response time in ms */
  averageResponseTime: number;
  /** Statistics collection period */
  periodStart: string;
  /** Statistics collection end */
  periodEnd: string;
}

/**
 * Cache health check result
 */
export interface CacheHealthCheck {
  /** Overall health status */
  healthy: boolean;
  /** Detailed health metrics */
  metrics: {
    /** Memory usage percentage */
    memoryUsage: number;
    /** Connection status */
    connectionStatus: 'connected' | 'disconnected' | 'error';
    /** Response time in ms */
    responseTime: number;
    /** Error count in last hour */
    errorCount: number;
  };
  /** Health check timestamp */
  timestamp: string;
  /** Recommendations for optimization */
  recommendations?: string[];
}