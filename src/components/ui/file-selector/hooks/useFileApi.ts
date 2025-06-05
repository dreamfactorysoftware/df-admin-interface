/**
 * File API Operations Hook
 * 
 * React hook that provides comprehensive file API operations including service discovery,
 * file listing, upload functionality, directory creation, and file management. Uses React Query
 * for intelligent caching, error handling, and background synchronization with optimistic updates
 * and progress tracking capabilities.
 * 
 * @fileoverview Custom React hook for file API operations with React Query integration
 * @version 1.0.0
 * @migrated_from src/app/shared/services/df-file-api.service.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback, useRef } from 'react';
import { z } from 'zod';
import type { 
  FileApiInfo, 
  FileItem, 
  SelectedFile, 
  FileUploadProgress, 
  FileOperationResult,
  FileError,
  FileErrorType,
  ApiResponse
} from '../types';
import { 
  FileApiInfoSchema, 
  FileItemSchema, 
  SelectedFileSchema,
  FileErrorSchema,
  ApiResponseSchema
} from '../types';

// =============================================================================
// CONSTANTS & CONFIGURATION
// =============================================================================

/**
 * Query keys for React Query cache management
 */
export const FILE_API_QUERY_KEYS = {
  fileServices: ['file-services'] as const,
  fileList: (serviceName: string, path?: string) => ['file-list', serviceName, path] as const,
  fileContent: (serviceName: string, path: string) => ['file-content', serviceName, path] as const,
  fileMetadata: (serviceName: string, path: string) => ['file-metadata', serviceName, path] as const,
} as const;

/**
 * Default cache configuration for file operations
 */
const FILE_API_CACHE_CONFIG = {
  // File services change rarely, cache for 15 minutes
  fileServices: {
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  },
  // File listings may change frequently, cache for 5 minutes
  fileList: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  // File content is stable, cache for 30 minutes
  fileContent: {
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  },
} as const;

/**
 * Services that should be excluded from file selection
 */
const EXCLUDED_SERVICES = ['logs', 'log'] as const;

/**
 * Default file services as fallback
 */
const DEFAULT_FILE_SERVICES: ApiResponse<FileApiInfo[]> = {
  resource: [
    {
      id: 3,
      name: 'files',
      label: 'Local File Storage',
      type: 'local_file',
      active: true,
    },
  ],
  success: true,
};

/**
 * HTTP headers for file operations
 */
const SESSION_TOKEN_HEADER = 'X-DreamFactory-Session-Token';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Schema for file upload response validation
 */
const FileUploadResponseSchema = ApiResponseSchema(
  z.object({
    name: z.string(),
    path: z.string(),
    type: z.string(),
    content_type: z.string().optional(),
    last_modified: z.string().optional(),
    size: z.number().optional(),
  })
);

/**
 * Schema for file listing response validation
 */
const FileListResponseSchema = ApiResponseSchema(z.array(FileItemSchema));

/**
 * Schema for file services response validation
 */
const FileServicesResponseSchema = ApiResponseSchema(z.array(FileApiInfoSchema));

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get the absolute API URL bypassing any baseHref configuration
 */
function getAbsoluteApiUrl(path: string): string {
  const origin = window.location.origin;
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const pathWithoutPrefix = cleanPath.replace(/^(dreamfactory\/dist\/)?/, '');
  return `${origin}/${pathWithoutPrefix}`;
}

/**
 * Check if a file service should be included in the selector
 */
function isSelectableFileService(service: FileApiInfo): boolean {
  return !EXCLUDED_SERVICES.some(
    exclude =>
      service.name.toLowerCase().includes(exclude) ||
      service.label.toLowerCase().includes(exclude)
  );
}

/**
 * Create a file error object with proper typing
 */
function createFileError(
  type: FileErrorType,
  message: string,
  details?: Record<string, any>,
  statusCode?: number
): FileError {
  return {
    type,
    message,
    statusCode,
    details,
    retryable: ['NETWORK_ERROR', 'SERVER_ERROR', 'UNKNOWN_ERROR'].includes(type),
    timestamp: new Date(),
  };
}

/**
 * Handle HTTP errors and convert to FileError
 */
function handleFileApiError(error: any, operation: string): FileError {
  console.error(`File API error during ${operation}:`, error);

  if (error.status === 401 || error.status === 403) {
    return createFileError(
      'ACCESS_DENIED',
      'You do not have permission to access this resource',
      { operation, originalError: error },
      error.status
    );
  }

  if (error.status === 404) {
    return createFileError(
      'NOT_FOUND',
      'The requested file or directory does not exist',
      { operation, originalError: error },
      error.status
    );
  }

  if (error.status >= 500) {
    return createFileError(
      'SERVER_ERROR',
      'The server encountered an internal error',
      { operation, originalError: error },
      error.status
    );
  }

  if (error.name === 'NetworkError' || !navigator.onLine) {
    return createFileError(
      'NETWORK_ERROR',
      'Network connection error. Please check your internet connection',
      { operation, originalError: error }
    );
  }

  return createFileError(
    'UNKNOWN_ERROR',
    `An unexpected error occurred during ${operation}`,
    { operation, originalError: error },
    error.status
  );
}

// =============================================================================
// CUSTOM HOOK IMPLEMENTATION
// =============================================================================

/**
 * useFileApi Hook
 * 
 * Provides comprehensive file API operations with React Query integration,
 * intelligent caching, error handling, and progress tracking.
 */
export function useFileApi() {
  const queryClient = useQueryClient();
  const uploadProgressRef = useRef<Map<string, FileUploadProgress>>(new Map());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // =============================================================================
  // AUTHENTICATION HELPERS
  // =============================================================================

  /**
   * Get authentication headers for API requests
   */
  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Get session token from environment or storage
    const token = process.env.NEXT_PUBLIC_SESSION_TOKEN || 
                 (typeof window !== 'undefined' ? localStorage.getItem('df_session_token') : null);

    if (token) {
      headers[SESSION_TOKEN_HEADER] = token;
    }

    return headers;
  }, []);

  /**
   * Get authentication headers for file uploads (without Content-Type)
   */
  const getUploadHeaders = useCallback(() => {
    const headers: Record<string, string> = {};

    const token = process.env.NEXT_PUBLIC_SESSION_TOKEN || 
                 (typeof window !== 'undefined' ? localStorage.getItem('df_session_token') : null);

    if (token) {
      headers[SESSION_TOKEN_HEADER] = token;
    }

    return headers;
  }, []);

  // =============================================================================
  // FILE SERVICES OPERATIONS
  // =============================================================================

  /**
   * Fetch file services from the API
   */
  const fetchFileServices = useCallback(async (): Promise<ApiResponse<FileApiInfo[]>> => {
    try {
      const url = getAbsoluteApiUrl('api/v2/system/service');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
        // Add signal for potential cancellation
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate response structure
      const validatedData = FileServicesResponseSchema.parse(data);
      
      // Filter for file services only and exclude non-selectable services
      if (validatedData.resource) {
        validatedData.resource = validatedData.resource
          .filter(service => service.type === 'local_file' || service.type.includes('file'))
          .filter(isSelectableFileService);
      }

      // If no valid services found, return defaults
      if (!validatedData.resource || validatedData.resource.length === 0) {
        console.warn('No valid file services found, using defaults');
        return DEFAULT_FILE_SERVICES;
      }

      return validatedData;
    } catch (error) {
      console.error('Error fetching file services:', error);
      // Return default services as fallback
      return DEFAULT_FILE_SERVICES;
    }
  }, [getAuthHeaders]);

  /**
   * Query for file services with intelligent caching
   */
  const fileServicesQuery = useQuery({
    queryKey: FILE_API_QUERY_KEYS.fileServices,
    queryFn: fetchFileServices,
    ...FILE_API_CACHE_CONFIG.fileServices,
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as { status: number };
        if (httpError.status === 401 || httpError.status === 403) {
          return false;
        }
      }
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // =============================================================================
  // FILE LISTING OPERATIONS
  // =============================================================================

  /**
   * Fetch file list from a specific service and path
   */
  const fetchFileList = useCallback(async (
    serviceName: string, 
    path: string = ''
  ): Promise<ApiResponse<FileItem[]>> => {
    if (!serviceName) {
      throw createFileError(
        'VALIDATION_ERROR',
        'Service name is required for file listing'
      );
    }

    try {
      const apiPath = path 
        ? `api/v2/${serviceName}/${path}`
        : `api/v2/${serviceName}`;
      
      const url = getAbsoluteApiUrl(apiPath);
      
      const searchParams = new URLSearchParams({
        include_properties: 'content_type',
        fields: 'name,path,type,content_type,last_modified,size',
      });

      const response = await fetch(`${url}?${searchParams}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        signal: AbortSignal.timeout(15000), // 15 second timeout for file listings
      });

      if (!response.ok) {
        throw handleFileApiError({ status: response.status }, 'file listing');
      }

      const data = await response.json();
      
      // Validate response structure
      const validatedData = FileListResponseSchema.parse(data);
      
      return validatedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw createFileError(
          'VALIDATION_ERROR',
          'Invalid file list response format',
          { validationErrors: error.errors }
        );
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw createFileError(
          'NETWORK_ERROR',
          'File listing request timed out'
        );
      }
      
      throw error;
    }
  }, [getAuthHeaders]);

  /**
   * Create a query function for file listings
   */
  const createFileListQuery = useCallback((serviceName: string, path?: string) => ({
    queryKey: FILE_API_QUERY_KEYS.fileList(serviceName, path),
    queryFn: () => fetchFileList(serviceName, path),
    ...FILE_API_CACHE_CONFIG.fileList,
    enabled: !!serviceName,
    retry: (failureCount: number, error: any) => {
      if (error?.type === 'ACCESS_DENIED') return false;
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  }), [fetchFileList]);

  // =============================================================================
  // FILE UPLOAD OPERATIONS
  // =============================================================================

  /**
   * Upload a file with progress tracking and cancellation support
   */
  const uploadFileMutation = useMutation({
    mutationFn: async ({
      serviceName,
      file,
      path = '',
      onProgress,
    }: {
      serviceName: string;
      file: File;
      path?: string;
      onProgress?: (progress: FileUploadProgress) => void;
    }): Promise<SelectedFile> => {
      if (!serviceName || !file) {
        throw createFileError(
          'VALIDATION_ERROR',
          'Service name and file are required for upload'
        );
      }

      // Create unique upload ID for tracking
      const uploadId = `${serviceName}-${path}-${file.name}-${Date.now()}`;
      
      // Create abort controller for cancellation
      const abortController = new AbortController();
      abortControllersRef.current.set(uploadId, abortController);

      try {
        // Construct upload path
        const apiPath = path 
          ? `api/v2/${serviceName}/${path.replace(/\/$/, '')}/${file.name}`
          : `api/v2/${serviceName}/${file.name}`;
        
        const url = getAbsoluteApiUrl(apiPath);

        // Create FormData
        const formData = new FormData();
        formData.append('files', file);

        // Initialize progress tracking
        const progressData: FileUploadProgress = {
          file,
          progress: 0,
          bytesUploaded: 0,
          totalBytes: file.size,
          status: 'pending',
          startTime: new Date(),
        };

        uploadProgressRef.current.set(uploadId, progressData);
        onProgress?.(progressData);

        // Update progress to uploading
        progressData.status = 'uploading';
        progressData.startTime = new Date();
        uploadProgressRef.current.set(uploadId, progressData);
        onProgress?.(progressData);

        // Perform upload with XMLHttpRequest for progress tracking
        const result = await new Promise<any>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          // Progress tracking
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              const speed = event.loaded / ((Date.now() - progressData.startTime!.getTime()) / 1000);
              const timeRemaining = speed > 0 ? (event.total - event.loaded) / speed : undefined;

              const updatedProgress: FileUploadProgress = {
                ...progressData,
                progress,
                bytesUploaded: event.loaded,
                speed,
                timeRemaining,
              };

              uploadProgressRef.current.set(uploadId, updatedProgress);
              onProgress?.(updatedProgress);
            }
          });

          // Handle completion
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (error) {
                reject(createFileError(
                  'VALIDATION_ERROR',
                  'Invalid upload response format'
                ));
              }
            } else {
              reject(handleFileApiError({ status: xhr.status }, 'file upload'));
            }
          });

          // Handle errors
          xhr.addEventListener('error', () => {
            reject(createFileError(
              'NETWORK_ERROR',
              'Network error during file upload'
            ));
          });

          // Handle abort
          xhr.addEventListener('abort', () => {
            reject(createFileError(
              'UPLOAD_FAILED',
              'File upload was cancelled'
            ));
          });

          // Setup abort signal
          abortController.signal.addEventListener('abort', () => {
            xhr.abort();
          });

          // Start upload
          xhr.open('POST', url);
          
          // Add auth headers
          const headers = getUploadHeaders();
          Object.entries(headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });

          xhr.send(formData);
        });

        // Validate upload response
        const validatedResponse = FileUploadResponseSchema.parse(result);

        // Create SelectedFile from upload result
        const selectedFile: SelectedFile = {
          path: validatedResponse.resource?.path || `${path}/${file.name}`,
          relativePath: path ? `${path}/${file.name}` : file.name,
          fileName: file.name,
          name: file.name,
          serviceId: 0, // Will be populated by caller
          serviceName,
          size: file.size,
          contentType: file.type,
          lastModified: new Date().toISOString(),
        };

        // Update progress to completed
        const completedProgress: FileUploadProgress = {
          ...progressData,
          progress: 100,
          bytesUploaded: file.size,
          status: 'completed',
          completionTime: new Date(),
        };

        uploadProgressRef.current.set(uploadId, completedProgress);
        onProgress?.(completedProgress);

        // Clean up after completion
        setTimeout(() => {
          uploadProgressRef.current.delete(uploadId);
          abortControllersRef.current.delete(uploadId);
        }, 5000);

        return selectedFile;

      } catch (error) {
        // Update progress to error state
        const errorProgress: FileUploadProgress = {
          ...uploadProgressRef.current.get(uploadId)!,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
          completionTime: new Date(),
        };

        uploadProgressRef.current.set(uploadId, errorProgress);
        onProgress?.(errorProgress);

        // Clean up
        abortControllersRef.current.delete(uploadId);
        
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries to refresh file listings
      queryClient.invalidateQueries({
        queryKey: FILE_API_QUERY_KEYS.fileList(variables.serviceName, variables.path),
      });
      
      // Also invalidate parent directory listing
      if (variables.path) {
        const parentPath = variables.path.split('/').slice(0, -1).join('/');
        queryClient.invalidateQueries({
          queryKey: FILE_API_QUERY_KEYS.fileList(variables.serviceName, parentPath),
        });
      }
    },
    onError: (error, variables) => {
      console.error('File upload failed:', error);
    },
  });

  // =============================================================================
  // DIRECTORY OPERATIONS
  // =============================================================================

  /**
   * Create a directory
   */
  const createDirectoryMutation = useMutation({
    mutationFn: async ({
      serviceName,
      path,
      name,
    }: {
      serviceName: string;
      path: string;
      name: string;
    }): Promise<void> => {
      if (!serviceName || !name) {
        throw createFileError(
          'VALIDATION_ERROR',
          'Service name and directory name are required'
        );
      }

      try {
        const apiPath = path 
          ? `api/v2/${serviceName}/${path}`
          : `api/v2/${serviceName}`;
        
        const url = getAbsoluteApiUrl(apiPath);

        const payload = {
          resource: [
            {
              name,
              type: 'folder',
            },
          ],
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          throw handleFileApiError({ status: response.status }, 'directory creation');
        }

        // Directory creation successful
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw createFileError(
            'NETWORK_ERROR',
            'Directory creation request timed out'
          );
        }
        
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate file listing for the directory where the folder was created
      queryClient.invalidateQueries({
        queryKey: FILE_API_QUERY_KEYS.fileList(variables.serviceName, variables.path),
      });
    },
  });

  // =============================================================================
  // FILE DELETION OPERATIONS
  // =============================================================================

  /**
   * Delete a file or directory
   */
  const deleteFileMutation = useMutation({
    mutationFn: async ({
      serviceName,
      path,
    }: {
      serviceName: string;
      path: string;
    }): Promise<void> => {
      if (!serviceName || !path) {
        throw createFileError(
          'VALIDATION_ERROR',
          'Service name and file path are required'
        );
      }

      try {
        const apiPath = `api/v2/${serviceName}/${path}`;
        const url = getAbsoluteApiUrl(apiPath);

        const response = await fetch(url, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          throw handleFileApiError({ status: response.status }, 'file deletion');
        }

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw createFileError(
            'NETWORK_ERROR',
            'File deletion request timed out'
          );
        }
        
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate file listing for the parent directory
      const parentPath = variables.path.split('/').slice(0, -1).join('/');
      queryClient.invalidateQueries({
        queryKey: FILE_API_QUERY_KEYS.fileList(variables.serviceName, parentPath),
      });
    },
  });

  // =============================================================================
  // UPLOAD PROGRESS MANAGEMENT
  // =============================================================================

  /**
   * Cancel a file upload
   */
  const cancelUpload = useCallback((uploadId: string) => {
    const abortController = abortControllersRef.current.get(uploadId);
    if (abortController) {
      abortController.abort();
      abortControllersRef.current.delete(uploadId);
      
      // Update progress to cancelled
      const progress = uploadProgressRef.current.get(uploadId);
      if (progress) {
        const cancelledProgress: FileUploadProgress = {
          ...progress,
          status: 'cancelled',
          completionTime: new Date(),
        };
        uploadProgressRef.current.set(uploadId, cancelledProgress);
      }
    }
  }, []);

  /**
   * Get upload progress for a specific upload
   */
  const getUploadProgress = useCallback((uploadId: string): FileUploadProgress | undefined => {
    return uploadProgressRef.current.get(uploadId);
  }, []);

  /**
   * Get all active uploads
   */
  const getActiveUploads = useCallback((): FileUploadProgress[] => {
    return Array.from(uploadProgressRef.current.values())
      .filter(progress => progress.status === 'uploading' || progress.status === 'pending');
  }, []);

  // =============================================================================
  // HOOK RETURN API
  // =============================================================================

  return useMemo(() => ({
    // File Services
    fileServices: fileServicesQuery.data?.resource ?? [],
    isLoadingServices: fileServicesQuery.isLoading,
    servicesError: fileServicesQuery.error,
    refetchServices: fileServicesQuery.refetch,

    // File Listing
    createFileListQuery,
    
    // File Operations
    uploadFile: uploadFileMutation.mutate,
    uploadFileAsync: uploadFileMutation.mutateAsync,
    isUploading: uploadFileMutation.isPending,
    uploadError: uploadFileMutation.error,

    createDirectory: createDirectoryMutation.mutate,
    createDirectoryAsync: createDirectoryMutation.mutateAsync,
    isCreatingDirectory: createDirectoryMutation.isPending,
    createDirectoryError: createDirectoryMutation.error,

    deleteFile: deleteFileMutation.mutate,
    deleteFileAsync: deleteFileMutation.mutateAsync,
    isDeletingFile: deleteFileMutation.isPending,
    deleteFileError: deleteFileMutation.error,

    // Upload Progress Management
    cancelUpload,
    getUploadProgress,
    getActiveUploads,

    // Cache Management
    invalidateFileList: (serviceName: string, path?: string) => {
      queryClient.invalidateQueries({
        queryKey: FILE_API_QUERY_KEYS.fileList(serviceName, path),
      });
    },
    invalidateAllFileLists: () => {
      queryClient.invalidateQueries({
        queryKey: ['file-list'],
      });
    },
    
    // Global loading state
    isLoading: fileServicesQuery.isLoading || 
               uploadFileMutation.isPending || 
               createDirectoryMutation.isPending || 
               deleteFileMutation.isPending,
  }), [
    fileServicesQuery,
    createFileListQuery,
    uploadFileMutation,
    createDirectoryMutation,
    deleteFileMutation,
    cancelUpload,
    getUploadProgress,
    getActiveUploads,
    queryClient,
  ]);
}

// =============================================================================
// ADDITIONAL UTILITY HOOKS
// =============================================================================

/**
 * useFileList Hook
 * 
 * Specialized hook for file listing with automatic query management
 */
export function useFileList(serviceName: string, path?: string) {
  const { createFileListQuery } = useFileApi();
  
  return useQuery(
    serviceName ? createFileListQuery(serviceName, path) : {
      queryKey: ['disabled'],
      queryFn: () => Promise.resolve({ resource: [] }),
      enabled: false,
    }
  );
}

/**
 * useFileUpload Hook
 * 
 * Specialized hook for file uploads with progress tracking
 */
export function useFileUpload() {
  const { uploadFile, uploadFileAsync, isUploading, uploadError } = useFileApi();
  
  return {
    uploadFile,
    uploadFileAsync,
    isUploading,
    uploadError,
  };
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { FileUploadProgress, FileError, FileOperationResult };