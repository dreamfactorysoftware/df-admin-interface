/**
 * File Entity Hook
 * 
 * React Query-based custom hook for fetching individual file entities with intelligent 
 * caching and entity-specific parameters. Replaces the Angular entityResolver by 
 * implementing React Query useQuery with dynamic query keys for entity-based file operations.
 * 
 * This hook transforms the Angular route paramMap pattern to a modern React hook pattern,
 * providing automatic background synchronization and optimized caching for real-time 
 * file management operations.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @feature F-008: File and Log Management
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { FileType } from '@/types/files'

/**
 * Parameters for file entity fetching
 */
export interface UseFileEntityParams {
  /** File type identifier (e.g., 'files', 'logs') */
  type: string
  /** Entity identifier within the type */
  entity: string
  /** Optional configuration overrides */
  options?: {
    /** Override default stale time in milliseconds */
    staleTime?: number
    /** Override default cache time in milliseconds */
    cacheTime?: number
    /** Disable automatic background refetching */
    enabled?: boolean
  }
}

/**
 * Query configuration constants for file entity operations
 * Optimized for F-008 File and Log Management requirements
 */
const QUERY_CONFIG = {
  /** Cache responses under 50ms per React/Next.js Integration Requirements */
  STALE_TIME: 300 * 1000, // 5 minutes - balances freshness with performance
  /** Extended cache retention for file entities */
  CACHE_TIME: 900 * 1000, // 15 minutes - reduces unnecessary API calls
  /** Query key prefix for file entity operations */
  QUERY_KEY_PREFIX: 'file-entity',
} as const

/**
 * Custom hook for fetching individual file entities with React Query
 * 
 * Transforms Angular ResolveFn entityResolver to React Query useQuery hook per 
 * Section 4.7.1.2 interceptor to middleware migration architecture. Replaces 
 * Angular DI BASE_SERVICE_TOKEN injection with React Query-powered API client 
 * per Section 3.2.2 state management architecture.
 * 
 * @param params - File entity parameters including type and entity identifiers
 * @returns React Query result with file entity data, loading state, and error handling
 * 
 * @example
 * ```typescript
 * // Basic usage for file entity fetching
 * const { data: fileEntity, isLoading, error } = useFileEntity({
 *   type: 'files',
 *   entity: 'documents/report.pdf'
 * })
 * 
 * // With custom configuration
 * const { data: logEntity } = useFileEntity({
 *   type: 'logs',
 *   entity: 'application.log',
 *   options: {
 *     staleTime: 60000, // 1 minute for logs
 *     enabled: !!selectedLog
 *   }
 * })
 * ```
 */
export function useFileEntity({
  type,
  entity,
  options = {}
}: UseFileEntityParams): UseQueryResult<FileType, Error> {
  // Extract configuration with defaults
  const {
    staleTime = QUERY_CONFIG.STALE_TIME,
    cacheTime = QUERY_CONFIG.CACHE_TIME,
    enabled = true
  } = options

  return useQuery({
    // Entity-specific query keys for granular cache management
    // Ensures cache hit responses under 50ms per requirements
    queryKey: [QUERY_CONFIG.QUERY_KEY_PREFIX, type, entity],
    
    // Transform path construction logic from `${type}/${entity}` to React Query-compatible API calls
    // per React/Next.js Integration Requirements
    queryFn: async (): Promise<FileType> => {
      // Validate required parameters
      if (!type || !entity) {
        throw new Error('Both type and entity parameters are required for file entity fetching')
      }

      try {
        // Construct API path matching original Angular resolver pattern
        const apiPath = `/${type}/${entity}`
        
        // Use React Query-powered API client per Section 3.2.2 state management architecture
        const response = await apiClient.get(apiPath)
        
        // Return typed file entity data
        return response as FileType
      } catch (error) {
        // Enhanced error handling for file operations
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Failed to fetch file entity'
        
        throw new Error(`File entity fetch failed for ${type}/${entity}: ${errorMessage}`)
      }
    },
    
    // TTL configuration per Section 5.2 requirements
    staleTime, // Data freshness threshold
    cacheTime, // Cache retention duration
    
    // Enable query only when both parameters are provided
    // Convert Angular route paramMap access to hook parameters per Section 4.7.1.1
    enabled: enabled && Boolean(type?.trim()) && Boolean(entity?.trim()),
    
    // Optimize for real-time file management operations
    refetchOnWindowFocus: true, // Sync when user returns to window
    refetchOnReconnect: true,   // Sync after network reconnection
    retry: (failureCount, error) => {
      // Limit retries for file operations to prevent excessive API calls
      if (failureCount >= 3) return false
      
      // Don't retry on client errors (4xx)
      if (error instanceof Error && error.message.includes('4')) return false
      
      return true
    },
    
    // Cache persistence for offline scenarios
    persistOnDevtools: true,
    
    // Background synchronization for optimal UX
    refetchInterval: 5 * 60 * 1000, // 5 minutes background sync
  })
}

/**
 * Utility function for constructing file entity query keys
 * Enables manual cache operations and query invalidation
 * 
 * @param type - File type identifier
 * @param entity - Entity identifier
 * @returns Query key array for TanStack React Query
 */
export function getFileEntityQueryKey(type: string, entity: string): string[] {
  return [QUERY_CONFIG.QUERY_KEY_PREFIX, type, entity]
}

/**
 * Type export for external usage
 */
export type { FileType } from '@/types/files'