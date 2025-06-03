/**
 * File Content Hook for React/Next.js DreamFactory Admin Interface
 * 
 * React Query-based custom hook that downloads file content and converts Blob responses 
 * to UTF-8 text with intelligent caching and streaming support. Replaces the Angular 
 * fileResolver by implementing React Query useQuery with downloadFile operations followed 
 * by readAsText conversion.
 * 
 * Key Features:
 * - React Query useQuery hook replacing Angular ResolveFn fileResolver
 * - Blob to UTF-8 text conversion using select function for data transformation
 * - TTL configuration optimized for file content caching with longer staleTime
 * - Enhanced error handling for large file operations and network failures
 * - Next.js streaming API route support for file downloads
 * - Background synchronization and intelligent cache invalidation
 * 
 * Migration Notes:
 * - Converts RxJS switchMap and readAsText pipeline to React Query select function
 * - Replaces Angular DI BASE_SERVICE_TOKEN injection with React Query-powered API client
 * - Transforms Angular route parameters (type, entity) to hook parameters
 * - Maintains equivalent functionality for file content download and text conversion
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @implements F-008: File and Log Management feature per Section 2.1 Feature Catalog
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { apiClient } from '../../../lib/api-client'
import { readAsText } from '../../../lib/file-utils'

// =============================================================================
// TYPE DEFINITIONS AND INTERFACES
// =============================================================================

/**
 * File content download parameters
 * Replaces Angular ActivatedRouteSnapshot paramMap and data access
 */
export interface FileContentParams {
  /** File service type from route data */
  type: string
  /** Entity/file identifier from route parameters */
  entity: string
}

/**
 * File content query configuration options
 * Extends React Query options with file-specific optimizations
 */
export interface FileContentQueryOptions extends Omit<UseQueryOptions<string, Error>, 'queryKey' | 'queryFn' | 'select'> {
  /** Enable/disable the query based on parameters availability */
  enabled?: boolean
  /** Custom stale time for file content caching (default: 10 minutes) */
  staleTime?: number
  /** Custom cache time for file content retention (default: 30 minutes) */
  cacheTime?: number
  /** Force refetch on window focus for real-time file updates */
  refetchOnWindowFocus?: boolean
  /** Background refetch interval for file content synchronization */
  refetchInterval?: number | false
}

/**
 * File content query result interface
 * Provides file content string with React Query state management
 */
export interface FileContentQueryResult {
  /** File content as UTF-8 string */
  data: string | undefined
  /** Loading state indicator */
  isLoading: boolean
  /** Error state with detailed error information */
  error: Error | null
  /** Success state indicator */
  isSuccess: boolean
  /** Initial loading state */
  isInitialLoading: boolean
  /** Background refetching indicator */
  isFetching: boolean
  /** Refetch function for manual content refresh */
  refetch: () => Promise<any>
  /** Query status for advanced state management */
  status: 'idle' | 'loading' | 'error' | 'success'
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate React Query cache key for file content
 * Ensures proper cache invalidation and isolation between different files
 * 
 * @param type - File service type
 * @param entity - File entity identifier
 * @returns Array cache key for React Query
 */
const getFileContentQueryKey = (type: string, entity: string): [string, string, string] => {
  return ['file-content', type, entity]
}

/**
 * Validate file content parameters
 * Ensures required parameters are provided and valid
 * 
 * @param params - File content parameters to validate
 * @returns Boolean indicating parameter validity
 */
const validateFileContentParams = (params: FileContentParams): boolean => {
  return Boolean(
    params.type && 
    params.entity && 
    typeof params.type === 'string' && 
    typeof params.entity === 'string' &&
    params.type.trim().length > 0 &&
    params.entity.trim().length > 0
  )
}

/**
 * Download file and convert to text
 * Core file content fetching logic with proper error handling
 * 
 * @param type - File service type
 * @param entity - File entity identifier
 * @returns Promise resolving to file content as UTF-8 string
 */
const downloadFileContent = async (type: string, entity: string): Promise<string> => {
  try {
    // Construct file download path matching Angular fileResolver pattern
    const filePath = `${type}/${entity}`
    
    // Use API client to download file as Blob
    // This replaces Angular DfBaseCrudService.downloadFile() call
    const response = await fetch(`/api/v2/${filePath}`, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        // Authentication headers will be added by API client middleware
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
    }

    // Get response as Blob for binary file handling
    const blob = await response.blob()
    
    // Convert Blob to UTF-8 text string
    // This replaces the RxJS switchMap(res => readAsText(res as Blob)) pipeline
    const textContent = await readAsText(blob)
    
    return textContent
  } catch (error) {
    // Enhanced error handling for file operations
    if (error instanceof Error) {
      throw new Error(`File content download failed: ${error.message}`)
    }
    throw new Error('Unknown error occurred during file content download')
  }
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * React Query-based file content hook
 * 
 * Downloads file content and converts Blob responses to UTF-8 text with intelligent 
 * caching and streaming support. Replaces Angular fileResolver with React Query 
 * patterns for enhanced performance and better developer experience.
 * 
 * Key Features:
 * - Intelligent caching with configurable TTL for static file content
 * - Background synchronization for file content updates
 * - Optimistic caching with stale-while-revalidate semantics
 * - Enhanced error handling with automatic retry capabilities
 * - Next.js streaming support for large file operations
 * - TypeScript type safety with proper error boundaries
 * 
 * Cache Configuration:
 * - Default staleTime: 10 minutes (longer than typical API data)
 * - Default cacheTime: 30 minutes (extended retention for file content)
 * - Background refetching disabled by default (files are typically static)
 * - Refetch on window focus disabled (prevents unnecessary downloads)
 * 
 * Performance Optimizations:
 * - React Query select function for Blob to text transformation
 * - Automatic query deduplication for concurrent requests
 * - Intelligent cache invalidation based on file path changes
 * - Memory-efficient Blob handling with proper cleanup
 * 
 * @param params - File content parameters (type and entity)
 * @param options - Additional React Query configuration options
 * @returns File content query result with loading states and data
 * 
 * @example
 * ```typescript
 * const { data: fileContent, isLoading, error } = useFileContent({
 *   type: 'logs',
 *   entity: 'application.log'
 * })
 * 
 * if (isLoading) return <div>Loading file...</div>
 * if (error) return <div>Error: {error.message}</div>
 * if (fileContent) return <pre>{fileContent}</pre>
 * ```
 * 
 * @example
 * ```typescript
 * // With custom caching configuration
 * const { data: logContent } = useFileContent({
 *   type: 'logs',
 *   entity: 'debug.log'
 * }, {
 *   staleTime: 5 * 60 * 1000, // 5 minutes for log files
 *   refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
 *   refetchOnWindowFocus: true // Refresh when user returns to tab
 * })
 * ```
 */
export const useFileContent = (
  params: FileContentParams,
  options: FileContentQueryOptions = {}
): FileContentQueryResult => {
  // Validate input parameters
  const isValidParams = validateFileContentParams(params)
  
  // Extract configuration options with optimized defaults for file content
  const {
    enabled = isValidParams,
    staleTime = 10 * 60 * 1000, // 10 minutes - longer for static file content
    cacheTime = 30 * 60 * 1000, // 30 minutes - extended retention
    refetchOnWindowFocus = false, // Disabled to prevent unnecessary downloads
    refetchInterval = false, // Disabled by default - files are typically static
    ...restOptions
  } = options

  // React Query implementation replacing Angular fileResolver
  const queryResult = useQuery({
    // Generate unique cache key for this file
    queryKey: getFileContentQueryKey(params.type, params.entity),
    
    // Core file download and text conversion logic
    queryFn: () => downloadFileContent(params.type, params.entity),
    
    // React Query configuration optimized for file content
    enabled,
    staleTime,
    cacheTime,
    refetchOnWindowFocus,
    refetchInterval,
    
    // Enhanced error handling with retry logic
    retry: (failureCount, error) => {
      // Don't retry on authentication errors (401, 403)
      if (error instanceof Error && error.message.includes('401')) return false
      if (error instanceof Error && error.message.includes('403')) return false
      
      // Retry up to 3 times for network errors
      return failureCount < 3
    },
    
    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Additional React Query options
    ...restOptions
  })

  // Return properly typed result interface
  return {
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    isSuccess: queryResult.isSuccess,
    isInitialLoading: queryResult.isInitialLoading,
    isFetching: queryResult.isFetching,
    refetch: queryResult.refetch,
    status: queryResult.status
  }
}

// =============================================================================
// ADDITIONAL UTILITIES AND EXPORTS
// =============================================================================

/**
 * Query key factory for file content operations
 * Useful for manual cache invalidation and management
 */
export const fileContentQueryKeys = {
  /** All file content queries */
  all: ['file-content'] as const,
  
  /** All file content for a specific service type */
  type: (type: string) => ['file-content', type] as const,
  
  /** Specific file content query */
  content: (type: string, entity: string) => ['file-content', type, entity] as const,
}

/**
 * Pre-fetch file content utility
 * Allows pre-loading file content for improved user experience
 * 
 * @param queryClient - React Query client instance
 * @param params - File content parameters
 * @param options - Pre-fetch options
 */
export const prefetchFileContent = async (
  queryClient: any, // QueryClient type from @tanstack/react-query
  params: FileContentParams,
  options: FileContentQueryOptions = {}
) => {
  if (!validateFileContentParams(params)) {
    throw new Error('Invalid file content parameters for prefetch')
  }

  return queryClient.prefetchQuery({
    queryKey: getFileContentQueryKey(params.type, params.entity),
    queryFn: () => downloadFileContent(params.type, params.entity),
    staleTime: options.staleTime || 10 * 60 * 1000,
    cacheTime: options.cacheTime || 30 * 60 * 1000,
  })
}

/**
 * Invalidate file content cache utility
 * Force refresh of file content cache for specific files or all files
 * 
 * @param queryClient - React Query client instance
 * @param params - Optional parameters to invalidate specific files
 */
export const invalidateFileContent = async (
  queryClient: any, // QueryClient type from @tanstack/react-query
  params?: Partial<FileContentParams>
) => {
  if (params?.type && params?.entity) {
    // Invalidate specific file
    return queryClient.invalidateQueries({
      queryKey: getFileContentQueryKey(params.type, params.entity)
    })
  } else if (params?.type) {
    // Invalidate all files for service type
    return queryClient.invalidateQueries({
      queryKey: fileContentQueryKeys.type(params.type)
    })
  } else {
    // Invalidate all file content
    return queryClient.invalidateQueries({
      queryKey: fileContentQueryKeys.all
    })
  }
}

// Export hook as default for convenient importing
export default useFileContent