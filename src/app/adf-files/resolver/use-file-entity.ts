/**
 * React Query-based custom hook that fetches individual file entities with intelligent caching 
 * and entity-specific parameters. Replaces the Angular entityResolver by implementing React Query 
 * useQuery with dynamic query keys for entity-based file operations.
 * 
 * Supports path construction with type and entity parameters while providing automatic background 
 * synchronization for real-time updates. Implements TTL configuration optimized for file entity 
 * operations with appropriate cache invalidation strategies.
 * 
 * @fileoverview File entity resolution hook for DreamFactory admin interface
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiGet } from '../../../lib/api-client';
import type { ApiResourceResponse, ApiErrorResponse } from '../../../types/api';

// ============================================================================
// File Entity Types
// ============================================================================

/**
 * File entity interface representing individual files in DreamFactory file services
 * Provides comprehensive metadata for file operations and browser display
 */
export interface FileEntity {
  /** File name including extension */
  name: string;
  
  /** File path relative to service root */
  path: string;
  
  /** File type (file or folder) */
  type: 'file' | 'folder';
  
  /** File size in bytes */
  content_length?: number;
  
  /** Last modified timestamp in ISO 8601 format */
  last_modified?: string;
  
  /** File MIME type */
  content_type?: string;
  
  /** File permissions */
  permissions?: string;
  
  /** Whether file is readable */
  readable?: boolean;
  
  /** Whether file is writable */
  writable?: boolean;
  
  /** Whether file is executable */
  executable?: boolean;
  
  /** File owner */
  owner?: string;
  
  /** File group */
  group?: string;
  
  /** Additional file metadata */
  metadata?: Record<string, any>;
}

/**
 * Hook configuration options for file entity retrieval
 */
export interface UseFileEntityOptions {
  /** Enable/disable the query */
  enabled?: boolean;
  
  /** Success callback */
  onSuccess?: (data: FileEntity) => void;
  
  /** Error callback */
  onError?: (error: ApiErrorResponse) => void;
  
  /** Custom stale time in milliseconds */
  staleTime?: number;
  
  /** Custom cache time in milliseconds */
  cacheTime?: number;
  
  /** Retry configuration */
  retry?: boolean | number;
  
  /** Retry delay configuration */
  retryDelay?: number;
  
  /** Refetch on window focus */
  refetchOnWindowFocus?: boolean;
  
  /** Refetch on reconnect */
  refetchOnReconnect?: boolean;
}

/**
 * Hook parameters for file entity retrieval
 */
export interface UseFileEntityParams {
  /** File service type (e.g., 'files', 'logs') */
  type: string;
  
  /** Entity identifier/path within the service */
  entity: string;
  
  /** Additional hook options */
  options?: UseFileEntityOptions;
}

// ============================================================================
// React Query Hook Implementation
// ============================================================================

/**
 * React Query-based hook for fetching individual file entities.
 * 
 * Replaces the Angular entityResolver by implementing React Query useQuery with 
 * dynamic query keys for entity-based file operations. Provides intelligent caching 
 * with configurable TTL and automatic background synchronization.
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const { data: fileEntity, isLoading, error } = useFileEntity({
 *   type: 'files',
 *   entity: 'documents/report.pdf'
 * });
 * 
 * // With custom options
 * const { data: logFile, isLoading, error } = useFileEntity({
 *   type: 'logs',
 *   entity: 'application.log',
 *   options: {
 *     enabled: !!selectedLogFile,
 *     onSuccess: (data) => console.log('File loaded:', data.name),
 *     onError: (error) => console.error('Failed to load file:', error)
 *   }
 * });
 * ```
 * 
 * @param params - Hook parameters including type, entity, and options
 * @returns React Query result with file entity data and query state
 */
export function useFileEntity({
  type,
  entity,
  options = {}
}: UseFileEntityParams): UseQueryResult<FileEntity, ApiErrorResponse> {
  const {
    enabled = true,
    onSuccess,
    onError,
    staleTime = 300 * 1000, // 300 seconds (5 minutes) per requirements
    cacheTime = 900 * 1000, // 900 seconds (15 minutes) per requirements
    retry = 3,
    retryDelay = 1000,
    refetchOnWindowFocus = false,
    refetchOnReconnect = true,
  } = options;

  /**
   * Query function that fetches the file entity from DreamFactory API
   * Constructs the path as `${type}/${entity}` to match Angular resolver pattern
   */
  const fetchFileEntity = async (): Promise<FileEntity> => {
    // Construct the API path following the original Angular pattern
    const path = `${type}/${entity}`;
    
    try {
      // Make API request using the standardized API client
      const response = await apiGet<ApiResourceResponse<FileEntity>>(path, {
        // Include cache control for optimal performance
        includeCacheControl: true,
        // Disable loading spinner for background requests
        showSpinner: false,
        // Add request options for file operations
        additionalHeaders: [
          { key: 'Accept', value: 'application/json' },
          { key: 'X-DreamFactory-File-Entity', value: 'true' }
        ]
      });

      // Handle different response formats for backward compatibility
      if ('resource' in response) {
        return response.resource;
      }
      
      // Handle direct resource response
      return response as FileEntity;
    } catch (error) {
      // Transform error for consistent error handling
      if (error instanceof Error) {
        try {
          const errorData = JSON.parse(error.message) as ApiErrorResponse;
          throw errorData;
        } catch {
          // If error message is not JSON, create a structured error
          const structuredError: ApiErrorResponse = {
            success: false,
            error: {
              code: 'FILE_ENTITY_ERROR',
              message: error.message || 'Failed to fetch file entity',
              status_code: 500
            }
          };
          throw structuredError;
        }
      }
      throw error;
    }
  };

  return useQuery({
    // Dynamic query key for entity-specific caching
    queryKey: ['file-entity', type, entity],
    
    // Query function
    queryFn: fetchFileEntity,
    
    // Enable/disable query based on parameters
    enabled: enabled && !!type && !!entity,
    
    // Cache configuration per requirements
    staleTime,
    cacheTime,
    
    // Error handling and retry configuration
    retry,
    retryDelay,
    
    // Background refetch behavior
    refetchOnWindowFocus,
    refetchOnReconnect,
    
    // Refetch on mount if data is stale
    refetchOnMount: true,
    
    // Keep previous data while refetching
    keepPreviousData: true,
    
    // Callbacks
    onSuccess: onSuccess ? (data: FileEntity) => onSuccess(data) : undefined,
    onError: onError ? (error: ApiErrorResponse) => onError(error) : undefined,
    
    // Performance optimization: only refetch if data is older than stale time
    refetchInterval: false,
    
    // Error boundary integration
    useErrorBoundary: false,
    
    // Suspense support for concurrent features
    suspense: false,
    
    // Select function for data transformation (identity function)
    select: (data: FileEntity) => data,
  });
}

// ============================================================================
// Utility Functions and Helpers
// ============================================================================

/**
 * Type guard to check if a file entity represents a file (not a folder)
 */
export function isFile(entity: FileEntity): boolean {
  return entity.type === 'file';
}

/**
 * Type guard to check if a file entity represents a folder
 */
export function isFolder(entity: FileEntity): boolean {
  return entity.type === 'folder';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file extension from file name
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : '';
}

/**
 * Determine if file is likely to be a text file based on extension
 */
export function isTextFile(fileName: string): boolean {
  const textExtensions = [
    'txt', 'log', 'csv', 'json', 'xml', 'html', 'htm', 'css', 'js', 'ts', 
    'jsx', 'tsx', 'md', 'yaml', 'yml', 'sql', 'php', 'py', 'java', 'c', 
    'cpp', 'h', 'hpp', 'cs', 'rb', 'go', 'rs', 'sh', 'bat', 'ps1'
  ];
  
  const extension = getFileExtension(fileName);
  return textExtensions.includes(extension);
}

/**
 * Build query key for manual cache operations
 */
export function buildFileEntityQueryKey(type: string, entity: string): string[] {
  return ['file-entity', type, entity];
}

// ============================================================================
// Default Export
// ============================================================================

export default useFileEntity;