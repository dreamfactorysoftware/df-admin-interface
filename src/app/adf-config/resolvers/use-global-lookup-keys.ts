/**
 * React Query-based custom hook for global lookup key management.
 * 
 * Replaces the Angular DfGlobalLookupKeysResolver by implementing React Query
 * useQuery with intelligent caching and automatic revalidation for global lookup
 * key enumeration in ADF configuration workflows.
 * 
 * Features:
 * - TanStack React Query 5.0.0 for server-state management
 * - Intelligent caching with TTL configuration (staleTime: 300s, cacheTime: 900s)
 * - Cache responses under 50ms for optimal performance
 * - Automatic background revalidation for real-time updates
 * - Type-safe GenericListResponse<LookupKeyType> return type
 * - Error handling and validation per Section 4.2 requirements
 * 
 * @fileoverview Global lookup keys React Query hook
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiGet } from '../../../lib/api-client';
import type { GenericListResponse } from '../../../types/generic-http';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Global lookup key type definition
 * 
 * @interface LookupKeyType
 */
export interface LookupKeyType {
  /** Unique identifier for the lookup key */
  id?: number;
  /** Name of the lookup key */
  name: string;
  /** Value associated with the lookup key */
  value: string;
  /** Whether the lookup key is private */
  private: boolean;
  /** Optional description of the lookup key */
  description?: string;
  /** Creation timestamp */
  created_date?: string;
  /** Last modification timestamp */
  last_modified_date?: string;
  /** ID of user who created the lookup key */
  created_by_id?: number;
  /** ID of user who last modified the lookup key */
  last_modified_by_id?: number;
}

/**
 * API response type for global lookup keys list
 */
export type GlobalLookupKeysResponse = GenericListResponse<LookupKeyType>;

// ============================================================================
// React Query Configuration
// ============================================================================

/**
 * React Query query key for global lookup keys
 */
export const globalLookupKeysQueryKey = ['global-lookup-keys'] as const;

/**
 * API endpoint for global lookup keys
 */
const GLOBAL_LOOKUP_KEYS_ENDPOINT = '/api/v2/system/lookup';

/**
 * React Query cache configuration optimized for global lookup keys
 * 
 * Configuration aligns with React/Next.js Integration Requirements:
 * - Cache hit responses under 50ms
 * - Intelligent caching with background synchronization
 * - TTL configuration for performance optimization
 */
export const globalLookupKeysCacheConfig = {
  /** Cache time: 15 minutes (900s) - data remains in cache for extended periods */
  gcTime: 15 * 60 * 1000,
  /** Stale time: 5 minutes (300s) - data considered fresh for 5 minutes */
  staleTime: 5 * 60 * 1000,
  /** Enable background refetch when component mounts */
  refetchOnMount: true,
  /** Enable background refetch on window focus for real-time updates */
  refetchOnWindowFocus: true,
  /** Retry failed requests up to 3 times with exponential backoff */
  retry: 3,
  /** Retry delay with exponential backoff */
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
} as const;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetches global lookup keys from the DreamFactory API
 * 
 * Implements the same pattern as Angular DfGlobalLookupKeysResolver but with
 * modern fetch-based API client and React Query optimizations.
 * 
 * @returns Promise resolving to global lookup keys response
 * @throws {Error} When API request fails or returns invalid data
 */
export async function fetchGlobalLookupKeys(): Promise<GlobalLookupKeysResponse> {
  try {
    const response = await apiGet<GlobalLookupKeysResponse>(
      GLOBAL_LOOKUP_KEYS_ENDPOINT,
      {
        fields: '*',
        includeCount: true,
        showSpinner: false, // Handled by React Query loading states
        snackbarError: 'Failed to load global lookup keys',
      }
    );

    // Validate response structure for type safety
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response format from global lookup keys API');
    }

    if (!Array.isArray(response.resource)) {
      throw new Error('Invalid resource format in global lookup keys response');
    }

    // Ensure each lookup key has required properties
    response.resource.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        throw new Error(`Invalid lookup key format at index ${index}`);
      }
      
      if (typeof item.name !== 'string' || !item.name.trim()) {
        throw new Error(`Invalid lookup key name at index ${index}`);
      }
      
      if (typeof item.value !== 'string') {
        throw new Error(`Invalid lookup key value at index ${index}`);
      }
      
      if (typeof item.private !== 'boolean') {
        throw new Error(`Invalid lookup key private flag at index ${index}`);
      }
    });

    return response;
  } catch (error) {
    // Enhanced error handling per Section 4.2 requirements
    if (error instanceof Error) {
      throw new Error(`Failed to fetch global lookup keys: ${error.message}`);
    }
    throw new Error('Unknown error occurred while fetching global lookup keys');
  }
}

// ============================================================================
// React Query Hook
// ============================================================================

/**
 * Custom React Query hook for global lookup keys management
 * 
 * Replaces Angular DfGlobalLookupKeysResolver with React Query-powered data
 * fetching, intelligent caching, and automatic revalidation. Provides type-safe
 * access to global lookup keys for ADF configuration workflows.
 * 
 * Key Features:
 * - Cache responses under 50ms per React/Next.js Integration Requirements
 * - Automatic background revalidation for real-time lookup key updates
 * - Intelligent caching with TTL configuration (staleTime: 300s, cacheTime: 900s)
 * - Type-safe GenericListResponse<LookupKeyType> return type
 * - Comprehensive error handling and validation
 * 
 * @param options - Optional React Query configuration overrides
 * @returns UseQueryResult with global lookup keys data and state
 * 
 * @example
 * ```tsx
 * function GlobalLookupKeysManager() {
 *   const {
 *     data: lookupKeys,
 *     isLoading,
 *     isError,
 *     error,
 *     refetch
 *   } = useGlobalLookupKeys();
 * 
 *   if (isLoading) return <div>Loading lookup keys...</div>;
 *   if (isError) return <div>Error: {error?.message}</div>;
 * 
 *   return (
 *     <div>
 *       <h2>Global Lookup Keys ({lookupKeys?.meta?.count || 0})</h2>
 *       {lookupKeys?.resource?.map(key => (
 *         <div key={key.id || key.name}>
 *           <strong>{key.name}:</strong> {key.value}
 *           {key.private && <span> (Private)</span>}
 *         </div>
 *       ))}
 *       <button onClick={() => refetch()}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useGlobalLookupKeys(
  options: {
    /** Enable/disable the query */
    enabled?: boolean;
    /** Custom stale time override */
    staleTime?: number;
    /** Custom cache time override */
    gcTime?: number;
    /** Custom refetch interval */
    refetchInterval?: number;
    /** Select function for data transformation */
    select?: (data: GlobalLookupKeysResponse) => any;
  } = {}
): UseQueryResult<GlobalLookupKeysResponse, Error> {
  return useQuery<GlobalLookupKeysResponse, Error>({
    queryKey: globalLookupKeysQueryKey,
    queryFn: fetchGlobalLookupKeys,
    
    // Cache configuration with TTL per requirements
    ...globalLookupKeysCacheConfig,
    
    // Apply user-provided overrides
    enabled: options.enabled,
    staleTime: options.staleTime ?? globalLookupKeysCacheConfig.staleTime,
    gcTime: options.gcTime ?? globalLookupKeysCacheConfig.gcTime,
    refetchInterval: options.refetchInterval,
    select: options.select,
    
    // Error boundary integration for React 19 concurrent features
    throwOnError: false,
    
    // Optimistic updates and suspense integration
    notifyOnChangeProps: ['data', 'error', 'isLoading'],
    
    // Metadata for debugging and monitoring
    meta: {
      component: 'GlobalLookupKeysManager',
      feature: 'adf-config',
      endpoint: GLOBAL_LOOKUP_KEYS_ENDPOINT,
    },
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Utility function to get lookup key value by name
 * 
 * @param lookupKeys - Array of lookup keys from the query result
 * @param name - Name of the lookup key to find
 * @returns The value of the lookup key or undefined if not found
 */
export function getLookupKeyValue(
  lookupKeys: LookupKeyType[] | undefined,
  name: string
): string | undefined {
  if (!lookupKeys || !Array.isArray(lookupKeys)) {
    return undefined;
  }
  
  const key = lookupKeys.find(item => item.name === name);
  return key?.value;
}

/**
 * Utility function to check if a lookup key exists
 * 
 * @param lookupKeys - Array of lookup keys from the query result
 * @param name - Name of the lookup key to check
 * @returns True if the lookup key exists, false otherwise
 */
export function hasLookupKey(
  lookupKeys: LookupKeyType[] | undefined,
  name: string
): boolean {
  if (!lookupKeys || !Array.isArray(lookupKeys)) {
    return false;
  }
  
  return lookupKeys.some(item => item.name === name);
}

/**
 * Utility function to filter lookup keys by private flag
 * 
 * @param lookupKeys - Array of lookup keys from the query result
 * @param includePrivate - Whether to include private keys (default: true)
 * @returns Filtered array of lookup keys
 */
export function filterLookupKeys(
  lookupKeys: LookupKeyType[] | undefined,
  includePrivate: boolean = true
): LookupKeyType[] {
  if (!lookupKeys || !Array.isArray(lookupKeys)) {
    return [];
  }
  
  if (includePrivate) {
    return lookupKeys;
  }
  
  return lookupKeys.filter(item => !item.private);
}

// ============================================================================
// Default Export
// ============================================================================

export default useGlobalLookupKeys;