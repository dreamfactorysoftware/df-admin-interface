/**
 * Field Data Fetching Hook for React/Next.js DreamFactory Admin Interface
 * 
 * Custom React hook implementing SWR-based data fetching for individual database
 * field metadata with intelligent caching and automatic revalidation. Provides
 * optimized field data retrieval for the field details form component, supporting
 * both create and edit modes with cache hit responses under 50ms per React/Next.js
 * Integration Requirements.
 * 
 * Key Features:
 * - SWR-powered intelligent caching with TTL configuration (300s/900s)
 * - Automatic background revalidation with retry logic
 * - Type-safe field data fetching with TypeScript interfaces
 * - Cache invalidation patterns for field updates and deletions
 * - Conditional fetching based on field existence and edit mode
 * - Real-time data synchronization with server state management
 * 
 * @fileoverview Field data fetching hook with SWR integration
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import useSWR, { KeyedMutator } from 'swr';
import { useSWRConfig } from 'swr';
import { useMemo, useCallback } from 'react';
import type { 
  DatabaseSchemaFieldType,
  FieldResponse 
} from '../field.types';
import type { 
  ApiErrorResponse,
  ApiRequestOptions 
} from '../../../../types/api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Field data fetching configuration options
 * Provides fine-grained control over data fetching behavior
 */
export interface UseFieldDataOptions extends ApiRequestOptions {
  /** Service name for database connection */
  service?: string;
  /** Table name containing the field */
  table?: string;
  /** Field name to fetch (undefined for create mode) */
  fieldName?: string;
  /** Whether to fetch field data (default: true) */
  enabled?: boolean;
  /** Refresh interval in milliseconds (default: undefined - no auto refresh) */
  refreshInterval?: number;
  /** Revalidate on focus (default: true) */
  revalidateOnFocus?: boolean;
  /** Revalidate on reconnect (default: true) */
  revalidateOnReconnect?: boolean;
  /** Enable background revalidation (default: true) */
  revalidateIfStale?: boolean;
  /** Error retry count (default: 3) */
  errorRetryCount?: number;
  /** Error retry interval in milliseconds (default: 5000) */
  errorRetryInterval?: number;
}

/**
 * Hook return type providing field data and control methods
 */
export interface UseFieldDataResult {
  /** Field data - null for create mode or when loading */
  field: DatabaseSchemaFieldType | null;
  /** Loading state indicator */
  isLoading: boolean;
  /** Error state - null when no error */
  error: ApiErrorResponse | null;
  /** Data validation state - true when data is fresh */
  isValidating: boolean;
  /** Manual revalidation trigger */
  revalidate: () => Promise<DatabaseSchemaFieldType | undefined>;
  /** Mutate field data optimistically */
  mutate: KeyedMutator<FieldResponse>;
  /** Cache key used for this field */
  cacheKey: string | null;
}

/**
 * Field cache configuration with performance optimization
 * Implements intelligent caching per Section 5.2 Component Details
 */
export interface FieldCacheConfig {
  /** Stale time in milliseconds (300 seconds = 5 minutes) */
  staleTime: number;
  /** Cache time in milliseconds (900 seconds = 15 minutes) */
  cacheTime: number;
  /** Dedupe interval in milliseconds (2 seconds) */
  dedupingInterval: number;
  /** Focus revalidation throttle in milliseconds (5 seconds) */
  focusThrottleInterval: number;
}

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

/**
 * Default cache configuration optimized for field metadata
 * Per Section 5.2 Component Details schema metadata caching requirements
 */
const DEFAULT_CACHE_CONFIG: FieldCacheConfig = {
  staleTime: 300_000,      // 5 minutes - fresh data window
  cacheTime: 900_000,      // 15 minutes - cache retention time  
  dedupingInterval: 2_000, // 2 seconds - dedupe identical requests
  focusThrottleInterval: 5_000 // 5 seconds - throttle focus revalidation
};

/**
 * Default fetching options with performance optimization
 */
const DEFAULT_OPTIONS: Partial<UseFieldDataOptions> = {
  enabled: true,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  errorRetryCount: 3,
  errorRetryInterval: 5_000
};

/**
 * API endpoint patterns for field data fetching
 */
const FIELD_ENDPOINTS = {
  /** Get specific field metadata */
  getField: (service: string, table: string, field: string) => 
    `/api/v2/${service}/_schema/${table}/${field}`,
  /** Get table fields list (for validation) */
  getTableFields: (service: string, table: string) => 
    `/api/v2/${service}/_schema/${table}`,
} as const;

// ============================================================================
// CACHE KEY GENERATION
// ============================================================================

/**
 * Generates cache keys for field data with consistent formatting
 * Ensures proper cache isolation between different fields
 * 
 * @param service - Database service name
 * @param table - Table name
 * @param fieldName - Field name (undefined for create mode)
 * @returns Cache key string or null if insufficient parameters
 */
function generateFieldCacheKey(
  service?: string, 
  table?: string, 
  fieldName?: string
): string | null {
  // Return null for create mode or missing required parameters
  if (!service || !table || !fieldName) {
    return null;
  }
  
  return `field:${service}:${table}:${fieldName}`;
}

/**
 * Generates related cache keys for invalidation patterns
 * Used to invalidate related data when field is modified
 * 
 * @param service - Database service name  
 * @param table - Table name
 * @returns Array of related cache key patterns
 */
function generateRelatedCacheKeys(service: string, table: string): string[] {
  return [
    `table:${service}:${table}`,           // Table metadata
    `fields:${service}:${table}`,          // Table fields list
    `schema:${service}`,                   // Full schema cache
    `relationships:${service}:${table}`,   // Table relationships
  ];
}

// ============================================================================
// DATA FETCHER FUNCTION
// ============================================================================

/**
 * SWR-compatible data fetcher for field metadata
 * Implements proper error handling and response transformation
 * 
 * @param url - API endpoint URL
 * @returns Promise resolving to field response data
 * @throws ApiErrorResponse on fetch failures
 */
async function fetchFieldData(url: string): Promise<FieldResponse> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include', // Include session cookies
    });

    // Handle HTTP error responses
    if (!response.ok) {
      const errorData: ApiErrorResponse = await response.json().catch(() => ({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`,
          status_code: response.status as any,
        }
      }));
      
      throw errorData;
    }

    // Parse and validate successful response
    const data: FieldResponse = await response.json();
    
    // Validate response structure
    if (!data.resource) {
      throw {
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'Invalid field data response format',
          status_code: 500,
        }
      } as ApiErrorResponse;
    }

    return data;
  } catch (error) {
    // Re-throw ApiErrorResponse objects as-is
    if (error && typeof error === 'object' && 'error' in error) {
      throw error;
    }
    
    // Transform network/parsing errors to ApiErrorResponse
    throw {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network request failed',
        status_code: 500,
        context: { originalError: error }
      }
    } as ApiErrorResponse;
  }
}

// ============================================================================
// MAIN HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom React hook for fetching individual database field metadata
 * 
 * Implements SWR-based data fetching with intelligent caching and automatic
 * revalidation. Optimized for field details form component with support for
 * both create and edit modes. Cache hit responses under 50ms per React/Next.js
 * Integration Requirements.
 * 
 * Features:
 * - Intelligent caching with configurable TTL (staleTime: 300s, cacheTime: 900s)
 * - Conditional fetching based on field existence and edit mode
 * - Automatic background revalidation with exponential backoff retry logic
 * - Type-safe field data retrieval with comprehensive error handling
 * - Cache invalidation patterns for field updates and deletions
 * - Real-time data synchronization with server state management
 * 
 * @param options - Configuration options for field data fetching
 * @returns Hook result with field data, loading state, and control methods
 * 
 * @example
 * ```tsx
 * // Edit mode - fetch existing field
 * const { field, isLoading, error, revalidate } = useFieldData({
 *   service: 'database',
 *   table: 'users', 
 *   fieldName: 'email',
 *   enabled: true
 * });
 * 
 * // Create mode - no fetching
 * const { field, isLoading } = useFieldData({
 *   service: 'database',
 *   table: 'users',
 *   fieldName: undefined, // Create mode
 *   enabled: false
 * });
 * ```
 */
export function useFieldData(options: UseFieldDataOptions = {}): UseFieldDataResult {
  // Merge options with defaults
  const config = useMemo(() => ({
    ...DEFAULT_OPTIONS,
    ...options
  }), [options]);

  // Generate cache key for this field
  const cacheKey = useMemo(() => 
    generateFieldCacheKey(config.service, config.table, config.fieldName),
    [config.service, config.table, config.fieldName]
  );

  // Generate API endpoint URL
  const apiUrl = useMemo(() => {
    if (!cacheKey || !config.service || !config.table || !config.fieldName) {
      return null;
    }
    return FIELD_ENDPOINTS.getField(config.service, config.table, config.fieldName);
  }, [cacheKey, config.service, config.table, config.fieldName]);

  // SWR configuration with performance optimization
  const swrConfig = useMemo(() => ({
    // Cache configuration per Section 5.2 Component Details
    dedupingInterval: DEFAULT_CACHE_CONFIG.dedupingInterval,
    focusThrottleInterval: DEFAULT_CACHE_CONFIG.focusThrottleInterval,
    
    // Revalidation settings
    revalidateOnFocus: config.revalidateOnFocus,
    revalidateOnReconnect: config.revalidateOnReconnect,
    revalidateIfStale: config.revalidateIfStale,
    refreshInterval: config.refreshInterval,
    
    // Error handling with exponential backoff
    errorRetryCount: config.errorRetryCount,
    errorRetryInterval: config.errorRetryInterval,
    
    // Performance optimization
    shouldRetryOnError: (error: ApiErrorResponse) => {
      // Don't retry on client errors (4xx)
      if (error.error?.status_code && error.error.status_code >= 400 && error.error.status_code < 500) {
        return false;
      }
      return true;
    },
    
    // Error handling callback
    onError: (error: ApiErrorResponse) => {
      console.error('Field data fetch error:', {
        service: config.service,
        table: config.table,
        field: config.fieldName,
        error: error.error
      });
    },
    
    // Success callback for performance monitoring
    onSuccess: (data: FieldResponse) => {
      console.debug('Field data fetch success:', {
        service: config.service,
        table: config.table,
        field: config.fieldName,
        dataSize: JSON.stringify(data).length
      });
    }
  }), [config]);

  // Access SWR global configuration for cache operations
  const { mutate: globalMutate } = useSWRConfig();

  // Execute SWR hook with conditional fetching
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  } = useSWR<FieldResponse, ApiErrorResponse>(
    // Only provide key if fetching is enabled and we have required parameters
    config.enabled && apiUrl ? cacheKey : null,
    // Fetcher function with URL binding
    apiUrl ? () => fetchFieldData(apiUrl) : null,
    swrConfig
  );

  // Manual revalidation function
  const revalidate = useCallback(async (): Promise<DatabaseSchemaFieldType | undefined> => {
    if (!cacheKey || !apiUrl) {
      return undefined;
    }
    
    try {
      const response = await mutate();
      return response?.resource;
    } catch (error) {
      console.error('Manual revalidation failed:', error);
      throw error;
    }
  }, [cacheKey, apiUrl, mutate]);

  // Cache invalidation helper for field mutations
  const invalidateFieldCache = useCallback(async (): Promise<void> => {
    if (!config.service || !config.table) {
      return;
    }

    // Invalidate current field cache
    if (cacheKey) {
      await globalMutate(cacheKey);
    }

    // Invalidate related caches for consistency
    const relatedKeys = generateRelatedCacheKeys(config.service, config.table);
    await Promise.all(
      relatedKeys.map(key => globalMutate(
        (key: string) => key.includes(config.service!) && key.includes(config.table!),
        undefined,
        { revalidate: true }
      ))
    );
  }, [config.service, config.table, cacheKey, globalMutate]);

  // Enhanced mutate function with cache invalidation
  const enhancedMutate: KeyedMutator<FieldResponse> = useCallback(
    async (data, shouldRevalidate = true) => {
      const result = await mutate(data, shouldRevalidate);
      
      // Trigger related cache invalidation on successful mutation
      if (shouldRevalidate) {
        await invalidateFieldCache();
      }
      
      return result;
    },
    [mutate, invalidateFieldCache]
  );

  // Extract field data from response
  const field = useMemo(() => {
    return data?.resource || null;
  }, [data]);

  // Return hook result with comprehensive state and controls
  return {
    field,
    isLoading,
    error,
    isValidating,
    revalidate,
    mutate: enhancedMutate,
    cacheKey
  };
}

// ============================================================================
// UTILITY HOOKS AND HELPERS
// ============================================================================

/**
 * Hook for batch field data operations with cache optimization
 * Useful for table field management and bulk operations
 * 
 * @param service - Database service name
 * @param table - Table name
 * @returns Batch operation helpers
 */
export function useFieldDataBatch(service?: string, table?: string) {
  const { mutate: globalMutate } = useSWRConfig();

  const invalidateAllFields = useCallback(async (): Promise<void> => {
    if (!service || !table) {
      return;
    }

    // Invalidate all field-related caches for the table
    await globalMutate(
      (key: string) => {
        return typeof key === 'string' && (
          key.startsWith(`field:${service}:${table}:`) ||
          key.startsWith(`fields:${service}:${table}`) ||
          key.startsWith(`table:${service}:${table}`)
        );
      },
      undefined,
      { revalidate: true }
    );
  }, [service, table, globalMutate]);

  const preloadField = useCallback(async (fieldName: string): Promise<void> => {
    if (!service || !table) {
      return;
    }

    const url = FIELD_ENDPOINTS.getField(service, table, fieldName);
    const cacheKey = generateFieldCacheKey(service, table, fieldName);
    
    if (cacheKey) {
      // Preload data into cache without triggering component updates
      globalMutate(cacheKey, fetchFieldData(url), { revalidate: false });
    }
  }, [service, table, globalMutate]);

  return {
    invalidateAllFields,
    preloadField
  };
}

/**
 * Hook for field cache statistics and debugging
 * Useful for performance monitoring and development
 * 
 * @param service - Database service name
 * @param table - Table name  
 * @returns Cache statistics and debug helpers
 */
export function useFieldDataCache(service?: string, table?: string) {
  const { cache } = useSWRConfig();

  const getCacheStats = useCallback((): {
    totalFields: number;
    cachedFields: string[];
    staleCacheKeys: string[];
  } => {
    if (!service || !table) {
      return { totalFields: 0, cachedFields: [], staleCacheKeys: [] };
    }

    const fieldPrefix = `field:${service}:${table}:`;
    const cachedFields: string[] = [];
    const staleCacheKeys: string[] = [];

    // Iterate through cache entries
    for (const [key] of cache) {
      if (typeof key === 'string' && key.startsWith(fieldPrefix)) {
        cachedFields.push(key);
        
        // Check if cache entry is stale (simplified check)
        const cacheEntry = cache.get(key);
        if (cacheEntry && Date.now() - (cacheEntry.timestamp || 0) > DEFAULT_CACHE_CONFIG.staleTime) {
          staleCacheKeys.push(key);
        }
      }
    }

    return {
      totalFields: cachedFields.length,
      cachedFields,
      staleCacheKeys
    };
  }, [service, table, cache]);

  const clearFieldCache = useCallback((): void => {
    if (!service || !table) {
      return;
    }

    const fieldPrefix = `field:${service}:${table}:`;
    
    // Remove all field cache entries for the table
    for (const [key] of cache) {
      if (typeof key === 'string' && key.startsWith(fieldPrefix)) {
        cache.delete(key);
      }
    }
  }, [service, table, cache]);

  return {
    getCacheStats,
    clearFieldCache
  };
}

// Export types for external usage
export type {
  UseFieldDataOptions,
  UseFieldDataResult,
  FieldCacheConfig
};