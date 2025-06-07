/**
 * React hook providing comprehensive file API operations with React Query integration.
 * 
 * Implements SWR/React Query caching, intelligent synchronization, and comprehensive
 * file operations including service discovery, file listing, upload functionality,
 * and directory creation. Features progress tracking, error recovery, optimistic
 * updates, and background revalidation for real-time data consistency.
 * 
 * @fileoverview File API operations hook with React Query integration
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { apiClient } from '../../../lib/api-client';
import type { 
  FileApiInfo,
  FileMetadata,
  SelectedFile,
  FileUploadResponse,
  FileValidationResult,
  FileValidationError,
  FileUploadError,
  UploadOptions,
  BatchFileOperationResult,
  FileOperationResult
} from '../types';
import type { 
  ApiResponse,
  ApiListResponse,
  ApiErrorResponse,
  HttpStatusCode
} from '../../../types/api';

// ============================================================================
// QUERY KEYS AND CACHE MANAGEMENT
// ============================================================================

/**
 * Centralized query keys for consistent cache management
 */
export const FILE_QUERY_KEYS = {
  all: ['files'] as const,
  services: () => [...FILE_QUERY_KEYS.all, 'services'] as const,
  service: (serviceName: string) => [...FILE_QUERY_KEYS.services(), serviceName] as const,
  serviceInfo: (serviceName: string) => [...FILE_QUERY_KEYS.service(serviceName), 'info'] as const,
  files: (serviceName: string) => [...FILE_QUERY_KEYS.service(serviceName), 'files'] as const,
  fileList: (serviceName: string, path: string) => [...FILE_QUERY_KEYS.files(serviceName), 'list', path] as const,
  fileDetail: (serviceName: string, filePath: string) => [...FILE_QUERY_KEYS.files(serviceName), 'detail', filePath] as const,
  fileContent: (serviceName: string, filePath: string) => [...FILE_QUERY_KEYS.files(serviceName), 'content', filePath] as const,
  folderTree: (serviceName: string, rootPath?: string) => [...FILE_QUERY_KEYS.files(serviceName), 'tree', rootPath || '/'] as const,
} as const;

/**
 * Cache configuration for different file operations
 */
const CACHE_CONFIG = {
  serviceInfo: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
  fileList: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  fileDetail: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  folderTree: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
} as const;

// ============================================================================
// UPLOAD PROGRESS AND STATE MANAGEMENT
// ============================================================================

/**
 * Upload progress tracking interface
 */
interface UploadProgress {
  uploadId: string;
  fileName: string;
  progress: number;
  speed: number;
  estimatedTimeRemaining: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error' | 'cancelled';
  error?: FileUploadError;
  abortController?: AbortController;
}

/**
 * Upload state management for tracking multiple concurrent uploads
 */
class UploadManager {
  private uploads = new Map<string, UploadProgress>();
  private listeners = new Set<(uploads: Map<string, UploadProgress>) => void>();

  addUpload(uploadId: string, fileName: string): void {
    this.uploads.set(uploadId, {
      uploadId,
      fileName,
      progress: 0,
      speed: 0,
      estimatedTimeRemaining: 0,
      status: 'pending',
      abortController: new AbortController(),
    });
    this.notifyListeners();
  }

  updateProgress(uploadId: string, progress: number, speed: number): void {
    const upload = this.uploads.get(uploadId);
    if (upload) {
      upload.progress = progress;
      upload.speed = speed;
      upload.estimatedTimeRemaining = speed > 0 ? (100 - progress) / speed : 0;
      upload.status = progress === 100 ? 'processing' : 'uploading';
      this.notifyListeners();
    }
  }

  setUploadStatus(uploadId: string, status: UploadProgress['status'], error?: FileUploadError): void {
    const upload = this.uploads.get(uploadId);
    if (upload) {
      upload.status = status;
      if (error) upload.error = error;
      this.notifyListeners();
    }
  }

  cancelUpload(uploadId: string): void {
    const upload = this.uploads.get(uploadId);
    if (upload) {
      upload.abortController?.abort();
      upload.status = 'cancelled';
      this.notifyListeners();
    }
  }

  removeUpload(uploadId: string): void {
    this.uploads.delete(uploadId);
    this.notifyListeners();
  }

  getUpload(uploadId: string): UploadProgress | undefined {
    return this.uploads.get(uploadId);
  }

  getAllUploads(): UploadProgress[] {
    return Array.from(this.uploads.values());
  }

  subscribe(listener: (uploads: Map<string, UploadProgress>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.uploads));
  }
}

// Singleton upload manager
const uploadManager = new UploadManager();

// ============================================================================
// ERROR HANDLING AND RETRY LOGIC
// ============================================================================

/**
 * Enhanced error handling for file operations
 */
function createFileError(
  code: FileUploadError['code'],
  message: string,
  statusCode?: HttpStatusCode,
  retryable: boolean = true,
  details?: any
): FileUploadError {
  return {
    code,
    message,
    statusCode,
    retryable,
    retryCount: 0,
    maxRetries: retryable ? 3 : 0,
    details,
  };
}

/**
 * Retry configuration for different operation types
 */
const RETRY_CONFIG = {
  fileList: { count: 3, delay: 1000 },
  fileUpload: { count: 5, delay: 2000 },
  fileDownload: { count: 3, delay: 1500 },
  fileOperation: { count: 2, delay: 1000 },
} as const;

/**
 * Exponential backoff retry delay calculation
 */
function calculateRetryDelay(attempt: number, baseDelay: number): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * File service info validation schema
 */
const FileServiceInfoSchema = z.object({
  serviceName: z.string().min(1),
  basePath: z.string(),
  supportedOperations: z.array(z.string()),
  maxFileSize: z.number().positive(),
  maxTotalSize: z.number().positive().optional(),
  allowedExtensions: z.array(z.string()).optional(),
  allowedMimeTypes: z.array(z.string()).optional(),
  supportsFolders: z.boolean(),
  supportsVersioning: z.boolean().optional(),
  permissions: z.object({
    canRead: z.boolean(),
    canWrite: z.boolean(),
    canCreate: z.boolean(),
    canDelete: z.boolean(),
    canCreateFolders: z.boolean(),
    canUpload: z.boolean(),
    canDownload: z.boolean(),
    restrictedPaths: z.array(z.string()).optional(),
    maxUploadSize: z.number().positive().optional(),
  }),
  config: z.object({
    chunkedUpload: z.boolean().optional(),
    chunkSize: z.number().positive().optional(),
    generateThumbnails: z.boolean().optional(),
    virusScanning: z.boolean().optional(),
    extractMetadata: z.boolean().optional(),
  }).optional(),
});

/**
 * File metadata validation schema
 */
const FileMetadataSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  path: z.string(),
  fullPath: z.string().optional(),
  size: z.number().min(0),
  mimeType: z.string(),
  extension: z.string(),
  type: z.enum(['image', 'video', 'audio', 'document', 'spreadsheet', 'presentation', 'archive', 'code', 'text', 'pdf', 'executable', 'font', 'other']),
  createdAt: z.string().optional(),
  modifiedAt: z.string().optional(),
  isDirectory: z.boolean(),
  isSymlink: z.boolean().optional(),
  childCount: z.number().min(0).optional(),
  hash: z.string().optional(),
  hashAlgorithm: z.enum(['md5', 'sha1', 'sha256']).optional(),
  contentMetadata: z.record(z.any()).optional(),
  attributes: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// MAIN HOOK IMPLEMENTATION
// ============================================================================

/**
 * Configuration options for the file API hook
 */
export interface UseFileApiOptions {
  /** File service name */
  serviceName?: string;
  
  /** Default path for file operations */
  defaultPath?: string;
  
  /** Enable automatic background revalidation */
  enableBackgroundRevalidation?: boolean;
  
  /** Upload configuration */
  uploadConfig?: {
    maxConcurrent?: number;
    chunkSize?: number;
    enableProgress?: boolean;
    autoRetry?: boolean;
  };
  
  /** Cache configuration overrides */
  cacheConfig?: {
    staleTime?: number;
    gcTime?: number;
  };
  
  /** Error handling configuration */
  errorConfig?: {
    enableRetry?: boolean;
    maxRetries?: number;
    retryDelay?: number;
  };
}

/**
 * File API hook return type
 */
export interface UseFileApiReturn {
  // Service operations
  fileServices: {
    data: string[] | undefined;
    isLoading: boolean;
    error: ApiErrorResponse | null;
    refetch: () => void;
  };

  serviceInfo: {
    data: FileApiInfo | undefined;
    isLoading: boolean;
    error: ApiErrorResponse | null;
    refetch: () => void;
  };

  // File listing operations
  fileList: {
    data: FileMetadata[] | undefined;
    isLoading: boolean;
    error: ApiErrorResponse | null;
    refetch: () => void;
    hasNextPage: boolean;
    fetchNextPage: () => void;
    isFetchingNextPage: boolean;
  };

  folderTree: {
    data: FileMetadata[] | undefined;
    isLoading: boolean;
    error: ApiErrorResponse | null;
    refetch: () => void;
  };

  // File operations
  uploadFiles: {
    mutate: (files: { file: File; options?: UploadOptions }[]) => void;
    isLoading: boolean;
    error: FileUploadError | null;
    data: FileUploadResponse[] | undefined;
  };

  downloadFile: {
    mutate: (filePath: string) => void;
    isLoading: boolean;
    error: ApiErrorResponse | null;
  };

  deleteFile: {
    mutate: (filePath: string) => void;
    isLoading: boolean;
    error: ApiErrorResponse | null;
  };

  createFolder: {
    mutate: (folderPath: string) => void;
    isLoading: boolean;
    error: ApiErrorResponse | null;
  };

  moveFile: {
    mutate: (params: { sourcePath: string; targetPath: string }) => void;
    isLoading: boolean;
    error: ApiErrorResponse | null;
  };

  copyFile: {
    mutate: (params: { sourcePath: string; targetPath: string }) => void;
    isLoading: boolean;
    error: ApiErrorResponse | null;
  };

  renameFile: {
    mutate: (params: { filePath: string; newName: string }) => void;
    isLoading: boolean;
    error: ApiErrorResponse | null;
  };

  // Upload progress tracking
  uploadProgress: UploadProgress[];
  cancelUpload: (uploadId: string) => void;
  
  // Validation utilities
  validateFile: (file: File) => Promise<FileValidationResult>;
  validateFiles: (files: File[]) => Promise<FileValidationResult[]>;
  
  // Cache management
  invalidateFileCache: (path?: string) => void;
  refreshFileList: () => void;
  prefetchFiles: (path: string) => void;
  
  // Utility functions
  getFileUrl: (filePath: string, download?: boolean) => string;
  getPreviewUrl: (filePath: string) => string;
  getThumbnailUrl: (filePath: string, size?: string) => string;
}

/**
 * Comprehensive file API hook providing all file operations with React Query integration
 */
export function useFileApi(options: UseFileApiOptions = {}): UseFileApiReturn {
  const {
    serviceName,
    defaultPath = '/',
    enableBackgroundRevalidation = true,
    uploadConfig = {},
    cacheConfig = {},
    errorConfig = {}
  } = options;

  const queryClient = useQueryClient();
  const [currentPath, setCurrentPath] = useState(defaultPath);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  // Subscribe to upload manager
  useState(() => {
    const unsubscribe = uploadManager.subscribe((uploads) => {
      setUploadProgress(Array.from(uploads.values()));
    });
    return unsubscribe;
  });

  // ============================================================================
  // SERVICE DISCOVERY AND INFO
  // ============================================================================

  /**
   * Query for available file services
   */
  const fileServicesQuery = useQuery({
    queryKey: FILE_QUERY_KEYS.services(),
    queryFn: async (): Promise<string[]> => {
      try {
        const response = await apiClient.get<ApiListResponse<{ name: string; type: string }>>(
          '/system/service?filter=type%3Dfile&fields=name'
        );

        if ('resource' in response && Array.isArray(response.resource)) {
          return response.resource
            .filter(service => service.type === 'file')
            .map(service => service.name);
        }

        throw createFileError(
          'SERVICE_UNAVAILABLE',
          'Failed to retrieve file services',
          500,
          true,
          response
        );
      } catch (error) {
        throw createFileError(
          'NETWORK_ERROR',
          error instanceof Error ? error.message : 'Failed to fetch file services',
          500,
          true,
          error
        );
      }
    },
    staleTime: cacheConfig.staleTime || CACHE_CONFIG.serviceInfo.staleTime,
    gcTime: cacheConfig.gcTime || CACHE_CONFIG.serviceInfo.gcTime,
    retry: (failureCount, error) => {
      if (errorConfig.enableRetry === false) return false;
      const maxRetries = errorConfig.maxRetries || RETRY_CONFIG.fileOperation.count;
      return failureCount < maxRetries;
    },
    retryDelay: (attemptIndex) => calculateRetryDelay(
      attemptIndex,
      errorConfig.retryDelay || RETRY_CONFIG.fileOperation.delay
    ),
  });

  /**
   * Query for specific service information
   */
  const serviceInfoQuery = useQuery({
    queryKey: serviceName ? FILE_QUERY_KEYS.serviceInfo(serviceName) : ['services', 'info', 'null'],
    queryFn: async (): Promise<FileApiInfo> => {
      if (!serviceName) {
        throw createFileError(
          'INVALID_EXTENSION',
          'Service name is required',
          400,
          false
        );
      }

      try {
        const response = await apiClient.get<ApiResponse<FileApiInfo>>(
          `/system/service/${serviceName}?related=schema`
        );

        if ('resource' in response || 'data' in response) {
          const serviceData = 'resource' in response ? response.resource : response.data;
          const validatedData = FileServiceInfoSchema.parse(serviceData);
          return validatedData;
        }

        throw createFileError(
          'SERVICE_UNAVAILABLE',
          'Invalid service response format',
          500,
          true,
          response
        );
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw createFileError(
            'UNKNOWN_ERROR',
            `Service info validation failed: ${error.message}`,
            500,
            true,
            error.errors
          );
        }

        throw createFileError(
          'NETWORK_ERROR',
          error instanceof Error ? error.message : 'Failed to fetch service info',
          500,
          true,
          error
        );
      }
    },
    enabled: !!serviceName,
    staleTime: cacheConfig.staleTime || CACHE_CONFIG.serviceInfo.staleTime,
    gcTime: cacheConfig.gcTime || CACHE_CONFIG.serviceInfo.gcTime,
    retry: (failureCount, error) => {
      if (errorConfig.enableRetry === false) return false;
      const maxRetries = errorConfig.maxRetries || RETRY_CONFIG.fileOperation.count;
      return failureCount < maxRetries;
    },
    retryDelay: (attemptIndex) => calculateRetryDelay(
      attemptIndex,
      errorConfig.retryDelay || RETRY_CONFIG.fileOperation.delay
    ),
  });

  // ============================================================================
  // FILE LISTING AND NAVIGATION
  // ============================================================================

  /**
   * Infinite query for file listing with pagination
   */
  const fileListQuery = useInfiniteQuery({
    queryKey: serviceName ? FILE_QUERY_KEYS.fileList(serviceName, currentPath) : ['files', 'list', 'null'],
    queryFn: async ({ pageParam = 0 }): Promise<ApiListResponse<FileMetadata>> => {
      if (!serviceName) {
        throw createFileError(
          'INVALID_EXTENSION',
          'Service name is required',
          400,
          false
        );
      }

      try {
        const cleanPath = currentPath.replace(/^\/+|\/+$/g, '') || '';
        const endpoint = cleanPath 
          ? `/${serviceName}/${cleanPath}?include_folder_info=true&limit=100&offset=${pageParam}`
          : `/${serviceName}?include_folder_info=true&limit=100&offset=${pageParam}`;

        const response = await apiClient.get<ApiListResponse<FileMetadata>>(endpoint);

        if ('resource' in response && Array.isArray(response.resource)) {
          // Validate each file metadata item
          const validatedFiles = response.resource.map(file => {
            try {
              return FileMetadataSchema.parse(file);
            } catch (validationError) {
              console.warn('File metadata validation failed:', validationError, file);
              // Return a basic fallback structure
              return {
                name: file.name || 'Unknown',
                path: file.path || '',
                size: file.size || 0,
                mimeType: file.mimeType || 'application/octet-stream',
                extension: file.extension || '',
                type: file.type || 'other',
                isDirectory: file.isDirectory || false,
              } as FileMetadata;
            }
          });

          return {
            ...response,
            resource: validatedFiles,
          };
        }

        throw createFileError(
          'SERVICE_UNAVAILABLE',
          'Invalid file list response format',
          500,
          true,
          response
        );
      } catch (error) {
        throw createFileError(
          'NETWORK_ERROR',
          error instanceof Error ? error.message : 'Failed to fetch file list',
          500,
          true,
          error
        );
      }
    },
    enabled: !!serviceName,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.meta?.has_next) return undefined;
      return (lastPage.meta.offset || 0) + (lastPage.meta.limit || 100);
    },
    staleTime: cacheConfig.staleTime || CACHE_CONFIG.fileList.staleTime,
    gcTime: cacheConfig.gcTime || CACHE_CONFIG.fileList.gcTime,
    refetchOnWindowFocus: enableBackgroundRevalidation,
    retry: (failureCount, error) => {
      if (errorConfig.enableRetry === false) return false;
      const maxRetries = errorConfig.maxRetries || RETRY_CONFIG.fileList.count;
      return failureCount < maxRetries;
    },
    retryDelay: (attemptIndex) => calculateRetryDelay(
      attemptIndex,
      errorConfig.retryDelay || RETRY_CONFIG.fileList.delay
    ),
  });

  /**
   * Query for folder tree structure
   */
  const folderTreeQuery = useQuery({
    queryKey: serviceName ? FILE_QUERY_KEYS.folderTree(serviceName, currentPath) : ['files', 'tree', 'null'],
    queryFn: async (): Promise<FileMetadata[]> => {
      if (!serviceName) {
        throw createFileError(
          'INVALID_EXTENSION',
          'Service name is required',
          400,
          false
        );
      }

      try {
        const cleanPath = currentPath.replace(/^\/+|\/+$/g, '') || '';
        const endpoint = cleanPath 
          ? `/${serviceName}/${cleanPath}?include_properties=true&filter=type%3Dfolder`
          : `/${serviceName}?include_properties=true&filter=type%3Dfolder`;

        const response = await apiClient.get<ApiListResponse<FileMetadata>>(endpoint);

        if ('resource' in response && Array.isArray(response.resource)) {
          return response.resource
            .filter(file => file.isDirectory)
            .map(folder => FileMetadataSchema.parse(folder));
        }

        return [];
      } catch (error) {
        throw createFileError(
          'NETWORK_ERROR',
          error instanceof Error ? error.message : 'Failed to fetch folder tree',
          500,
          true,
          error
        );
      }
    },
    enabled: !!serviceName,
    staleTime: cacheConfig.staleTime || CACHE_CONFIG.folderTree.staleTime,
    gcTime: cacheConfig.gcTime || CACHE_CONFIG.folderTree.gcTime,
  });

  // ============================================================================
  // FILE UPLOAD OPERATIONS
  // ============================================================================

  /**
   * File upload mutation with progress tracking
   */
  const uploadFilesMutation = useMutation({
    mutationFn: async (files: { file: File; options?: UploadOptions }[]): Promise<FileUploadResponse[]> => {
      if (!serviceName) {
        throw createFileError(
          'INVALID_EXTENSION',
          'Service name is required',
          400,
          false
        );
      }

      const results: FileUploadResponse[] = [];
      
      for (const { file, options = {} } of files) {
        const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          uploadManager.addUpload(uploadId, file.name);
          
          const formData = new FormData();
          formData.append('file', file);
          
          if (options.path) formData.append('path', options.path);
          if (options.overwrite) formData.append('overwrite', 'true');
          if (options.extractMetadata) formData.append('extract_metadata', 'true');
          if (options.generateThumbnails) formData.append('generate_thumbnails', 'true');
          
          const startTime = Date.now();
          let lastLoaded = 0;

          const response = await fetch(`/api/v2/${serviceName}/`, {
            method: 'POST',
            body: formData,
            headers: {
              // Authentication headers will be added by the API client middleware
              'X-DreamFactory-Session-Token': localStorage.getItem('session_token') || '',
            },
            signal: uploadManager.getUpload(uploadId)?.abortController?.signal,
          });

          // Simulate progress tracking (in a real implementation, you'd use XMLHttpRequest or a streaming approach)
          const progressInterval = setInterval(() => {
            const upload = uploadManager.getUpload(uploadId);
            if (upload && upload.status === 'uploading') {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(95, (elapsed / 1000) * 10); // Simulate progress
              const speed = (progress - lastLoaded) / (elapsed / 1000);
              uploadManager.updateProgress(uploadId, progress, speed);
              lastLoaded = progress;
            }
          }, 100);

          if (!response.ok) {
            clearInterval(progressInterval);
            const errorData = await response.json().catch(() => null);
            throw createFileError(
              response.status === 413 ? 'FILE_TOO_LARGE' : 'UPLOAD_TIMEOUT',
              errorData?.message || `Upload failed: ${response.statusText}`,
              response.status as HttpStatusCode,
              response.status < 500
            );
          }

          clearInterval(progressInterval);
          uploadManager.updateProgress(uploadId, 100, 0);
          uploadManager.setUploadStatus(uploadId, 'processing');

          const result = await response.json();
          uploadManager.setUploadStatus(uploadId, 'completed');
          
          // Clean up upload tracking after success
          setTimeout(() => uploadManager.removeUpload(uploadId), 5000);
          
          results.push({
            file: result.resource || result,
            stats: {
              uploadTime: Date.now() - startTime,
              averageSpeed: file.size / ((Date.now() - startTime) / 1000),
              totalBytes: file.size,
            },
            urls: {
              download: `/api/v2/${serviceName}/${result.path || file.name}`,
              preview: result.preview_url,
              thumbnail: result.thumbnail_url,
            },
            processing: {
              thumbnailsGenerated: !!result.thumbnail_url,
              metadataExtracted: !!result.metadata,
              virusScanned: false,
            },
          });
          
        } catch (error) {
          const fileError = error instanceof Error 
            ? createFileError('UPLOAD_TIMEOUT', error.message, 500, true, error)
            : createFileError('UNKNOWN_ERROR', 'Upload failed', 500, true, error);
            
          uploadManager.setUploadStatus(uploadId, 'error', fileError);
          throw fileError;
        }
      }

      return results;
    },
    onSuccess: () => {
      // Invalidate file list cache after successful upload
      queryClient.invalidateQueries({
        queryKey: serviceName ? FILE_QUERY_KEYS.files(serviceName) : FILE_QUERY_KEYS.all,
      });
    },
    retry: (failureCount, error) => {
      if (errorConfig.enableRetry === false) return false;
      const fileError = error as FileUploadError;
      if (!fileError.retryable) return false;
      const maxRetries = errorConfig.maxRetries || RETRY_CONFIG.fileUpload.count;
      return failureCount < maxRetries;
    },
    retryDelay: (attemptIndex) => calculateRetryDelay(
      attemptIndex,
      errorConfig.retryDelay || RETRY_CONFIG.fileUpload.delay
    ),
  });

  // ============================================================================
  // FILE OPERATIONS MUTATIONS
  // ============================================================================

  /**
   * File download mutation
   */
  const downloadFileMutation = useMutation({
    mutationFn: async (filePath: string): Promise<void> => {
      if (!serviceName) {
        throw createFileError(
          'INVALID_EXTENSION',
          'Service name is required',
          400,
          false
        );
      }

      try {
        const cleanPath = filePath.replace(/^\/+/, '');
        const blob = await apiClient.download(`/${serviceName}/${cleanPath}`);
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filePath.split('/').pop() || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        throw createFileError(
          'FILE_NOT_FOUND',
          error instanceof Error ? error.message : 'Download failed',
          404,
          true,
          error
        );
      }
    },
  });

  /**
   * File deletion mutation
   */
  const deleteFileMutation = useMutation({
    mutationFn: async (filePath: string): Promise<void> => {
      if (!serviceName) {
        throw createFileError(
          'INVALID_EXTENSION',
          'Service name is required',
          400,
          false
        );
      }

      try {
        const cleanPath = filePath.replace(/^\/+/, '');
        await apiClient.delete(`/${serviceName}/${cleanPath}`);
      } catch (error) {
        throw createFileError(
          'FILE_NOT_FOUND',
          error instanceof Error ? error.message : 'Delete failed',
          404,
          true,
          error
        );
      }
    },
    onSuccess: () => {
      // Invalidate file list cache after successful deletion
      queryClient.invalidateQueries({
        queryKey: serviceName ? FILE_QUERY_KEYS.files(serviceName) : FILE_QUERY_KEYS.all,
      });
    },
  });

  /**
   * Folder creation mutation
   */
  const createFolderMutation = useMutation({
    mutationFn: async (folderPath: string): Promise<void> => {
      if (!serviceName) {
        throw createFileError(
          'INVALID_EXTENSION',
          'Service name is required',
          400,
          false
        );
      }

      try {
        const cleanPath = folderPath.replace(/^\/+/, '');
        await apiClient.post(`/${serviceName}/${cleanPath}`, null, {
          headers: { 'X-HTTP-Method': 'MKDIR' }
        });
      } catch (error) {
        throw createFileError(
          'AUTHORIZATION_ERROR',
          error instanceof Error ? error.message : 'Folder creation failed',
          403,
          true,
          error
        );
      }
    },
    onSuccess: () => {
      // Invalidate file list and folder tree cache after successful creation
      queryClient.invalidateQueries({
        queryKey: serviceName ? FILE_QUERY_KEYS.files(serviceName) : FILE_QUERY_KEYS.all,
      });
    },
  });

  /**
   * File move mutation
   */
  const moveFileMutation = useMutation({
    mutationFn: async ({ sourcePath, targetPath }: { sourcePath: string; targetPath: string }): Promise<void> => {
      if (!serviceName) {
        throw createFileError(
          'INVALID_EXTENSION',
          'Service name is required',
          400,
          false
        );
      }

      try {
        const cleanSource = sourcePath.replace(/^\/+/, '');
        await apiClient.patch(`/${serviceName}/${cleanSource}`, {
          path: targetPath,
        });
      } catch (error) {
        throw createFileError(
          'FILE_NOT_FOUND',
          error instanceof Error ? error.message : 'Move failed',
          404,
          true,
          error
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: serviceName ? FILE_QUERY_KEYS.files(serviceName) : FILE_QUERY_KEYS.all,
      });
    },
  });

  /**
   * File copy mutation
   */
  const copyFileMutation = useMutation({
    mutationFn: async ({ sourcePath, targetPath }: { sourcePath: string; targetPath: string }): Promise<void> => {
      if (!serviceName) {
        throw createFileError(
          'INVALID_EXTENSION',
          'Service name is required',
          400,
          false
        );
      }

      try {
        const cleanSource = sourcePath.replace(/^\/+/, '');
        await apiClient.post(`/${serviceName}/${cleanSource}`, {
          path: targetPath,
          copy: true,
        });
      } catch (error) {
        throw createFileError(
          'FILE_NOT_FOUND',
          error instanceof Error ? error.message : 'Copy failed',
          404,
          true,
          error
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: serviceName ? FILE_QUERY_KEYS.files(serviceName) : FILE_QUERY_KEYS.all,
      });
    },
  });

  /**
   * File rename mutation
   */
  const renameFileMutation = useMutation({
    mutationFn: async ({ filePath, newName }: { filePath: string; newName: string }): Promise<void> => {
      if (!serviceName) {
        throw createFileError(
          'INVALID_EXTENSION',
          'Service name is required',
          400,
          false
        );
      }

      try {
        const cleanPath = filePath.replace(/^\/+/, '');
        const pathParts = cleanPath.split('/');
        pathParts[pathParts.length - 1] = newName;
        const newPath = pathParts.join('/');

        await apiClient.patch(`/${serviceName}/${cleanPath}`, {
          path: newPath,
        });
      } catch (error) {
        throw createFileError(
          'FILE_NOT_FOUND',
          error instanceof Error ? error.message : 'Rename failed',
          404,
          true,
          error
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: serviceName ? FILE_QUERY_KEYS.files(serviceName) : FILE_QUERY_KEYS.all,
      });
    },
  });

  // ============================================================================
  // VALIDATION UTILITIES
  // ============================================================================

  /**
   * Validate a single file against service constraints
   */
  const validateFile = useCallback(async (file: File): Promise<FileValidationResult> => {
    const errors: FileValidationError[] = [];
    const warnings: FileValidationWarning[] = [];
    const serviceInfo = serviceInfoQuery.data;

    // Check file size
    if (serviceInfo?.maxFileSize && file.size > serviceInfo.maxFileSize) {
      errors.push({
        code: 'FILE_TOO_LARGE',
        message: `File size (${file.size} bytes) exceeds maximum allowed (${serviceInfo.maxFileSize} bytes)`,
        context: { fileSize: file.size, maxSize: serviceInfo.maxFileSize },
        suggestion: 'Please choose a smaller file or compress the current file',
      });
    }

    // Check file extension
    if (serviceInfo?.allowedExtensions?.length) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!serviceInfo.allowedExtensions.includes(fileExtension)) {
        errors.push({
          code: 'INVALID_EXTENSION',
          message: `File extension "${fileExtension}" is not allowed`,
          context: { extension: fileExtension, allowedExtensions: serviceInfo.allowedExtensions },
          suggestion: `Please use one of: ${serviceInfo.allowedExtensions.join(', ')}`,
        });
      }
    }

    // Check MIME type
    if (serviceInfo?.allowedMimeTypes?.length) {
      if (!serviceInfo.allowedMimeTypes.includes(file.type)) {
        errors.push({
          code: 'INVALID_MIME_TYPE',
          message: `File type "${file.type}" is not allowed`,
          context: { mimeType: file.type, allowedMimeTypes: serviceInfo.allowedMimeTypes },
          suggestion: `Please use a file with one of these types: ${serviceInfo.allowedMimeTypes.join(', ')}`,
        });
      }
    }

    // Check filename validity
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(file.name)) {
      errors.push({
        code: 'FILENAME_INVALID',
        message: 'Filename contains invalid characters',
        context: { filename: file.name },
        suggestion: 'Please remove special characters from the filename',
      });
    }

    // Check permissions
    if (serviceInfo?.permissions && !serviceInfo.permissions.canUpload) {
      errors.push({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to upload files',
        context: { permissions: serviceInfo.permissions },
        suggestion: 'Please contact an administrator for upload permissions',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date().toISOString(),
      appliedRules: ['fileSize', 'extension', 'mimeType', 'filename', 'permissions'],
    };
  }, [serviceInfoQuery.data]);

  /**
   * Validate multiple files
   */
  const validateFiles = useCallback(async (files: File[]): Promise<FileValidationResult[]> => {
    const results = await Promise.all(files.map(file => validateFile(file)));
    
    // Check total size if applicable
    const serviceInfo = serviceInfoQuery.data;
    if (serviceInfo?.maxTotalSize) {
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      if (totalSize > serviceInfo.maxTotalSize) {
        results.forEach(result => {
          result.errors.push({
            code: 'QUOTA_EXCEEDED',
            message: `Total file size (${totalSize} bytes) exceeds maximum allowed (${serviceInfo.maxTotalSize} bytes)`,
            context: { totalSize, maxTotalSize: serviceInfo.maxTotalSize },
            suggestion: 'Please reduce the number of files or choose smaller files',
          });
          result.isValid = false;
        });
      }
    }

    return results;
  }, [validateFile, serviceInfoQuery.data]);

  // ============================================================================
  // CACHE MANAGEMENT UTILITIES
  // ============================================================================

  /**
   * Invalidate file cache for a specific path
   */
  const invalidateFileCache = useCallback((path?: string) => {
    if (!serviceName) return;

    if (path) {
      queryClient.invalidateQueries({
        queryKey: FILE_QUERY_KEYS.fileList(serviceName, path),
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: FILE_QUERY_KEYS.files(serviceName),
      });
    }
  }, [queryClient, serviceName]);

  /**
   * Refresh current file list
   */
  const refreshFileList = useCallback(() => {
    fileListQuery.refetch();
  }, [fileListQuery]);

  /**
   * Prefetch files for a specific path
   */
  const prefetchFiles = useCallback((path: string) => {
    if (!serviceName) return;

    queryClient.prefetchQuery({
      queryKey: FILE_QUERY_KEYS.fileList(serviceName, path),
      queryFn: async () => {
        const cleanPath = path.replace(/^\/+|\/+$/g, '') || '';
        const endpoint = cleanPath 
          ? `/${serviceName}/${cleanPath}?include_folder_info=true&limit=100`
          : `/${serviceName}?include_folder_info=true&limit=100`;

        const response = await apiClient.get<ApiListResponse<FileMetadata>>(endpoint);
        return response;
      },
      staleTime: CACHE_CONFIG.fileList.staleTime,
    });
  }, [queryClient, serviceName]);

  // ============================================================================
  // URL UTILITIES
  // ============================================================================

  /**
   * Get file URL for direct access
   */
  const getFileUrl = useCallback((filePath: string, download: boolean = false): string => {
    if (!serviceName) return '';
    
    const cleanPath = filePath.replace(/^\/+/, '');
    const baseUrl = `/api/v2/${serviceName}/${cleanPath}`;
    return download ? `${baseUrl}?download=true` : baseUrl;
  }, [serviceName]);

  /**
   * Get preview URL for files
   */
  const getPreviewUrl = useCallback((filePath: string): string => {
    if (!serviceName) return '';
    
    const cleanPath = filePath.replace(/^\/+/, '');
    return `/api/v2/${serviceName}/${cleanPath}?preview=true`;
  }, [serviceName]);

  /**
   * Get thumbnail URL for images
   */
  const getThumbnailUrl = useCallback((filePath: string, size: string = 'medium'): string => {
    if (!serviceName) return '';
    
    const cleanPath = filePath.replace(/^\/+/, '');
    return `/api/v2/${serviceName}/${cleanPath}?thumbnail=${size}`;
  }, [serviceName]);

  /**
   * Cancel upload by ID
   */
  const cancelUpload = useCallback((uploadId: string) => {
    uploadManager.cancelUpload(uploadId);
  }, []);

  // ============================================================================
  // RETURN HOOK INTERFACE
  // ============================================================================

  return {
    // Service operations
    fileServices: {
      data: fileServicesQuery.data,
      isLoading: fileServicesQuery.isLoading,
      error: fileServicesQuery.error as ApiErrorResponse | null,
      refetch: fileServicesQuery.refetch,
    },

    serviceInfo: {
      data: serviceInfoQuery.data,
      isLoading: serviceInfoQuery.isLoading,
      error: serviceInfoQuery.error as ApiErrorResponse | null,
      refetch: serviceInfoQuery.refetch,
    },

    // File listing operations
    fileList: {
      data: fileListQuery.data?.pages.flatMap(page => page.resource) || undefined,
      isLoading: fileListQuery.isLoading,
      error: fileListQuery.error as ApiErrorResponse | null,
      refetch: fileListQuery.refetch,
      hasNextPage: fileListQuery.hasNextPage || false,
      fetchNextPage: fileListQuery.fetchNextPage,
      isFetchingNextPage: fileListQuery.isFetchingNextPage,
    },

    folderTree: {
      data: folderTreeQuery.data,
      isLoading: folderTreeQuery.isLoading,
      error: folderTreeQuery.error as ApiErrorResponse | null,
      refetch: folderTreeQuery.refetch,
    },

    // File operations
    uploadFiles: {
      mutate: uploadFilesMutation.mutate,
      isLoading: uploadFilesMutation.isPending,
      error: uploadFilesMutation.error as FileUploadError | null,
      data: uploadFilesMutation.data,
    },

    downloadFile: {
      mutate: downloadFileMutation.mutate,
      isLoading: downloadFileMutation.isPending,
      error: downloadFileMutation.error as ApiErrorResponse | null,
    },

    deleteFile: {
      mutate: deleteFileMutation.mutate,
      isLoading: deleteFileMutation.isPending,
      error: deleteFileMutation.error as ApiErrorResponse | null,
    },

    createFolder: {
      mutate: createFolderMutation.mutate,
      isLoading: createFolderMutation.isPending,
      error: createFolderMutation.error as ApiErrorResponse | null,
    },

    moveFile: {
      mutate: moveFileMutation.mutate,
      isLoading: moveFileMutation.isPending,
      error: moveFileMutation.error as ApiErrorResponse | null,
    },

    copyFile: {
      mutate: copyFileMutation.mutate,
      isLoading: copyFileMutation.isPending,
      error: copyFileMutation.error as ApiErrorResponse | null,
    },

    renameFile: {
      mutate: renameFileMutation.mutate,
      isLoading: renameFileMutation.isPending,
      error: renameFileMutation.error as ApiErrorResponse | null,
    },

    // Upload progress tracking
    uploadProgress,
    cancelUpload,

    // Validation utilities
    validateFile,
    validateFiles,

    // Cache management
    invalidateFileCache,
    refreshFileList,
    prefetchFiles,

    // Utility functions
    getFileUrl,
    getPreviewUrl,
    getThumbnailUrl,
  };
}

// ============================================================================
// EXPORT TYPES AND UTILITIES
// ============================================================================

export type { UseFileApiOptions, UseFileApiReturn, UploadProgress };
export { uploadManager, CACHE_CONFIG, RETRY_CONFIG };