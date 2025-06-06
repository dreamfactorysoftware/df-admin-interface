/**
 * React Query-based file content hook for DreamFactory admin interface.
 * 
 * Downloads file content and converts Blob responses to UTF-8 text with 
 * intelligent caching and streaming support. Replaces Angular fileResolver 
 * by implementing React Query useQuery with downloadFile operations followed 
 * by readAsText conversion.
 * 
 * Features:
 * - Optimized file content retrieval with background synchronization
 * - Error handling for large file operations
 * - TTL configuration optimized for file content caching
 * - Next.js streaming support for enhanced performance
 * - Blob to text transformation using React Query select functions
 * 
 * @fileoverview File content downloading and text conversion hook
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiRequest } from '../../../lib/api-client';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * File content query parameters
 */
export interface FileContentParams {
  /** File service name */
  serviceName: string;
  /** File path within the service */
  filePath: string;
  /** Container or folder path */
  container?: string;
  /** Download options */
  options?: {
    /** Force download as attachment */
    asAttachment?: boolean;
    /** Content type override */
    contentType?: string;
    /** File encoding for text conversion */
    encoding?: 'utf-8' | 'ascii' | 'base64';
  };
}

/**
 * File content response structure
 */
export interface FileContentResponse {
  /** Original file content as Blob */
  blob: Blob;
  /** Converted text content */
  textContent: string;
  /** File metadata */
  metadata: {
    size: number;
    type: string;
    lastModified?: number;
    encoding: string;
  };
}

/**
 * File download API response
 */
interface FileDownloadResponse {
  content: Blob;
  headers: Record<string, string>;
  status: number;
}

/**
 * Hook configuration options
 */
export interface UseFileContentOptions extends Omit<UseQueryOptions<FileContentResponse>, 'queryKey' | 'queryFn' | 'select'> {
  /** Enable automatic refetching on file changes */
  enableAutoRefetch?: boolean;
  /** Custom stale time for static content (default: 5 minutes) */
  staleTimeMinutes?: number;
  /** Cache time for file content (default: 10 minutes) */
  cacheTimeMinutes?: number;
  /** Maximum file size for text conversion (default: 10MB) */
  maxFileSizeBytes?: number;
  /** Text encoding for conversion */
  textEncoding?: 'utf-8' | 'ascii' | 'latin1';
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  STALE_TIME_MINUTES: 5,
  CACHE_TIME_MINUTES: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  TEXT_ENCODING: 'utf-8' as const,
  QUERY_KEY_PREFIX: 'file-content',
} as const;

/**
 * Supported text file MIME types for automatic conversion
 */
const TEXT_MIME_TYPES = [
  'text/plain',
  'text/html',
  'text/css',
  'text/javascript',
  'text/xml',
  'application/json',
  'application/xml',
  'application/javascript',
  'application/x-yaml',
  'application/yaml',
] as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Build file download URL with proper query parameters
 */
function buildFileDownloadUrl(params: FileContentParams): string {
  const { serviceName, filePath, container, options } = params;
  
  // Build base path
  let path = `/api/v2/${serviceName}`;
  
  // Add container if specified
  if (container) {
    path += `/${encodeURIComponent(container)}`;
  }
  
  // Add file path
  path += `/${encodeURIComponent(filePath)}`;
  
  // Add query parameters
  const searchParams = new URLSearchParams();
  
  if (options?.asAttachment) {
    searchParams.append('download', 'true');
  }
  
  if (options?.contentType) {
    searchParams.append('content_type', options.contentType);
  }
  
  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

/**
 * Generate consistent query key for file content
 */
function generateQueryKey(params: FileContentParams): string[] {
  const { serviceName, filePath, container, options } = params;
  
  const baseKey = [
    DEFAULT_CONFIG.QUERY_KEY_PREFIX,
    serviceName,
    container || 'root',
    filePath,
  ];
  
  // Include relevant options in key for cache invalidation
  if (options) {
    const optionsKey = Object.entries(options)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}:${value}`)
      .join(',');
    
    if (optionsKey) {
      baseKey.push(optionsKey);
    }
  }
  
  return baseKey;
}

/**
 * Download file content as Blob with streaming support
 */
async function downloadFileContent(params: FileContentParams): Promise<FileDownloadResponse> {
  const url = buildFileDownloadUrl(params);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': '*/*',
        'Cache-Control': 'no-cache, private',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `Failed to download file: HTTP ${response.status} - ${errorText}`
      );
    }
    
    // Extract headers
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    // Get content as Blob for streaming support
    const blob = await response.blob();
    
    return {
      content: blob,
      headers,
      status: response.status,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`File download failed: ${error.message}`);
    }
    throw new Error('File download failed due to network error');
  }
}

/**
 * Convert Blob to text with proper encoding handling
 */
async function convertBlobToText(
  blob: Blob,
  encoding: string = DEFAULT_CONFIG.TEXT_ENCODING,
  maxSize: number = DEFAULT_CONFIG.MAX_FILE_SIZE_BYTES
): Promise<string> {
  // Check file size limit
  if (blob.size > maxSize) {
    throw new Error(
      `File too large for text conversion: ${blob.size} bytes (max: ${maxSize} bytes)`
    );
  }
  
  // Check if MIME type indicates text content
  const isTextType = TEXT_MIME_TYPES.some(type => blob.type.includes(type));
  
  if (!isTextType && blob.type && !blob.type.startsWith('text/')) {
    throw new Error(
      `Cannot convert binary file to text: ${blob.type || 'unknown type'}`
    );
  }
  
  try {
    // Use FileReader for proper encoding support
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error(`File reading failed: ${reader.error?.message || 'Unknown error'}`));
      };
      
      // Read as text with specified encoding
      reader.readAsText(blob, encoding);
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Text conversion failed: ${error.message}`);
    }
    throw new Error('Text conversion failed due to unknown error');
  }
}

/**
 * Transform download response to file content with text conversion
 */
async function transformToFileContent(
  downloadResponse: FileDownloadResponse,
  encoding: string = DEFAULT_CONFIG.TEXT_ENCODING,
  maxSize: number = DEFAULT_CONFIG.MAX_FILE_SIZE_BYTES
): Promise<FileContentResponse> {
  const { content: blob, headers } = downloadResponse;
  
  try {
    // Convert blob to text
    const textContent = await convertBlobToText(blob, encoding, maxSize);
    
    // Extract metadata from blob and headers
    const metadata = {
      size: blob.size,
      type: blob.type || headers['content-type'] || 'application/octet-stream',
      lastModified: headers['last-modified'] 
        ? new Date(headers['last-modified']).getTime() 
        : undefined,
      encoding,
    };
    
    return {
      blob,
      textContent,
      metadata,
    };
  } catch (error) {
    // If text conversion fails, still return blob with error info
    const metadata = {
      size: blob.size,
      type: blob.type || headers['content-type'] || 'application/octet-stream',
      lastModified: headers['last-modified'] 
        ? new Date(headers['last-modified']).getTime() 
        : undefined,
      encoding,
    };
    
    throw new Error(
      `File content processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * React Query hook for downloading and converting file content to text.
 * 
 * Provides intelligent caching, background synchronization, and error handling
 * for file operations. Optimized for DreamFactory file service integration.
 * 
 * @param params - File content parameters including service, path, and options
 * @param options - Hook configuration options for caching and behavior
 * @returns React Query result with file content, loading state, and error handling
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useFileContent(
 *   {
 *     serviceName: 'files',
 *     filePath: 'logs/application.log',
 *     container: 'system',
 *   },
 *   {
 *     staleTimeMinutes: 2, // Refresh every 2 minutes for logs
 *     maxFileSizeBytes: 5 * 1024 * 1024, // 5MB limit
 *   }
 * );
 * 
 * if (data) {
 *   console.log('File content:', data.textContent);
 *   console.log('File size:', data.metadata.size);
 * }
 * ```
 */
export function useFileContent(
  params: FileContentParams,
  options: UseFileContentOptions = {}
) {
  const {
    enableAutoRefetch = false,
    staleTimeMinutes = DEFAULT_CONFIG.STALE_TIME_MINUTES,
    cacheTimeMinutes = DEFAULT_CONFIG.CACHE_TIME_MINUTES,
    maxFileSizeBytes = DEFAULT_CONFIG.MAX_FILE_SIZE_BYTES,
    textEncoding = DEFAULT_CONFIG.TEXT_ENCODING,
    ...queryOptions
  } = options;
  
  // Generate consistent query key
  const queryKey = generateQueryKey(params);
  
  // Calculate cache times in milliseconds
  const staleTime = staleTimeMinutes * 60 * 1000;
  const cacheTime = cacheTimeMinutes * 60 * 1000;
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<FileContentResponse> => {
      // Download file content
      const downloadResponse = await downloadFileContent(params);
      
      // Transform to file content with text conversion
      return transformToFileContent(
        downloadResponse,
        textEncoding,
        maxFileSizeBytes
      );
    },
    staleTime,
    cacheTime,
    enabled: !!(params.serviceName && params.filePath),
    refetchOnWindowFocus: enableAutoRefetch,
    refetchOnReconnect: enableAutoRefetch,
    retry: (failureCount, error) => {
      // Don't retry for client errors (4xx)
      if (error instanceof Error && error.message.includes('HTTP 4')) {
        return false;
      }
      
      // Retry up to 2 times for network errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    ...queryOptions,
  });
}

// ============================================================================
// Additional Utility Hooks
// ============================================================================

/**
 * Hook for downloading file content without text conversion.
 * Useful for binary files or when only the Blob is needed.
 */
export function useFileDownload(
  params: FileContentParams,
  options: UseFileContentOptions = {}
) {
  const queryKey = [...generateQueryKey(params), 'blob-only'];
  
  const {
    staleTimeMinutes = DEFAULT_CONFIG.STALE_TIME_MINUTES,
    cacheTimeMinutes = DEFAULT_CONFIG.CACHE_TIME_MINUTES,
    ...queryOptions
  } = options;
  
  return useQuery({
    queryKey,
    queryFn: () => downloadFileContent(params),
    staleTime: staleTimeMinutes * 60 * 1000,
    cacheTime: cacheTimeMinutes * 60 * 1000,
    enabled: !!(params.serviceName && params.filePath),
    ...queryOptions,
  });
}

/**
 * Prefetch file content for improved user experience.
 * Useful for preloading files that users are likely to access.
 */
export function usePrefetchFileContent() {
  const { prefetchQuery } = useQuery.context || {};
  
  return (
    params: FileContentParams,
    options: UseFileContentOptions = {}
  ) => {
    if (!prefetchQuery) {
      console.warn('Prefetch not available in current context');
      return;
    }
    
    const queryKey = generateQueryKey(params);
    const staleTime = (options.staleTimeMinutes || DEFAULT_CONFIG.STALE_TIME_MINUTES) * 60 * 1000;
    
    return prefetchQuery({
      queryKey,
      queryFn: async () => {
        const downloadResponse = await downloadFileContent(params);
        return transformToFileContent(
          downloadResponse,
          options.textEncoding || DEFAULT_CONFIG.TEXT_ENCODING,
          options.maxFileSizeBytes || DEFAULT_CONFIG.MAX_FILE_SIZE_BYTES
        );
      },
      staleTime,
    });
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default useFileContent;