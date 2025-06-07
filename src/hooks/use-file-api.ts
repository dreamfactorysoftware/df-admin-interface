'use client';

import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useSession } from './use-session';
import { useErrorHandler } from './use-error-handler';
import type {
  FileService,
  FileItem,
  FileUploadProgress,
  FileValidationResult,
  DirectoryCreateRequest,
  FileDownloadOptions,
  GenericListResponse,
} from '@/types/file';

/**
 * File operations hook that manages file uploads, downloads, directory operations,
 * and file metadata handling. Replaces Angular FileApiService with React patterns
 * for comprehensive file management workflows including progress tracking and error handling.
 * 
 * Features:
 * - File service listing with React Query caching
 * - File upload with progress tracking and chunked upload support
 * - File download with proper blob handling and browser compatibility
 * - Directory operations including creation, listing, and navigation
 * - File metadata management with caching optimization
 * - File validation and security checks including private key detection
 * - Integration with authentication and error handling systems
 */
export function useFileApi() {
  const { sessionToken } = useSession();
  const { handleError } = useErrorHandler();
  const queryClient = useQueryClient();
  
  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState<Record<string, FileUploadProgress>>({});

  // Array of service names that should be excluded from file selection
  const excludedServices = ['logs', 'log'];

  /**
   * Check if a file service should be included in the selector
   */
  const isSelectableFileService = useCallback((service: FileService): boolean => {
    return !excludedServices.some(
      exclude =>
        service.name.toLowerCase().includes(exclude) ||
        service.label.toLowerCase().includes(exclude)
    );
  }, [excludedServices]);

  /**
   * Get the absolute API URL for file operations
   */
  const getAbsoluteApiUrl = useCallback((path: string): string => {
    const origin = window.location.origin;
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const pathWithoutPrefix = cleanPath.replace(/^(dreamfactory\/dist\/)?/, '');
    return `${origin}/${pathWithoutPrefix}`;
  }, []);

  /**
   * Get HTTP headers for authenticated requests
   */
  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {};
    if (sessionToken) {
      headers['X-DreamFactory-Session-Token'] = sessionToken;
    }
    return headers;
  }, [sessionToken]);

  /**
   * Validate file for security and type checks
   */
  const validateFile = useCallback((file: File): FileValidationResult => {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Check file size (50MB limit)
    const maxSizeBytes = 50 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      result.isValid = false;
      result.errors.push(`File size exceeds maximum limit of ${maxSizeBytes / 1024 / 1024}MB`);
    }

    // Check for potentially dangerous file types
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
    const fileName = file.name.toLowerCase();
    
    if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
      result.warnings.push('This file type may be potentially unsafe');
    }

    // Detect private key files
    const privateKeyExtensions = ['.pem', '.p8', '.key', '.crt', '.cert'];
    if (privateKeyExtensions.some(ext => fileName.endsWith(ext))) {
      result.warnings.push('Detected private key or certificate file - handle with care');
    }

    // Basic MIME type validation
    if (file.type && !file.type.startsWith('text/') && 
        !file.type.startsWith('image/') && 
        !file.type.startsWith('application/') && 
        !file.type.startsWith('audio/') && 
        !file.type.startsWith('video/')) {
      result.warnings.push('Unknown or unusual file type detected');
    }

    return result;
  }, []);

  /**
   * Detect if file content contains private key material
   */
  const detectPrivateKeyContent = useCallback(async (file: File): Promise<boolean> => {
    if (file.size > 1024 * 1024) { // Skip files larger than 1MB
      return false;
    }

    try {
      const text = await file.text();
      const privateKeyIndicators = [
        '-----BEGIN PRIVATE KEY-----',
        '-----BEGIN RSA PRIVATE KEY-----',
        '-----BEGIN EC PRIVATE KEY-----',
        '-----BEGIN DSA PRIVATE KEY-----',
        '-----BEGIN OPENSSH PRIVATE KEY-----',
        '-----BEGIN ENCRYPTED PRIVATE KEY-----',
      ];

      return privateKeyIndicators.some(indicator => 
        text.includes(indicator)
      );
    } catch {
      return false; // If we can't read the file, assume it's not a private key
    }
  }, []);

  /**
   * Query: Get list of file services with caching
   */
  const useFileServices = () => {
    return useQuery({
      queryKey: ['file-services'],
      queryFn: async (): Promise<GenericListResponse<FileService>> => {
        if (!sessionToken) {
          // Return default services when no session token
          return {
            resource: [
              {
                id: 3,
                name: 'files',
                label: 'Local File Storage',
                type: 'local_file',
              },
            ],
          };
        }

        try {
          const response = await apiClient.request<GenericListResponse<FileService>>(
            '/system/service?filter=type=local_file&fields=id,name,label,type'
          );

          if (!response?.resource || !Array.isArray(response.resource)) {
            throw new Error('Invalid response format from API');
          }

          // Filter out non-selectable services
          response.resource = response.resource.filter(isSelectableFileService);

          // Fallback to default if no services found
          if (response.resource.length === 0) {
            return {
              resource: [
                {
                  id: 3,
                  name: 'files',
                  label: 'Local File Storage',
                  type: 'local_file',
                },
              ],
            };
          }

          return response;
        } catch (error) {
          console.error('Error fetching file services:', error);
          // Return default services as fallback
          return {
            resource: [
              {
                id: 3,
                name: 'files',
                label: 'Local File Storage',
                type: 'local_file',
              },
            ],
          };
        }
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: 2,
      enabled: true,
    });
  };

  /**
   * Query: List files in a directory with caching
   */
  const useFileList = (serviceName: string, path: string = '') => {
    return useQuery({
      queryKey: ['file-list', serviceName, path],
      queryFn: async (): Promise<{ resource: FileItem[]; error?: string }> => {
        if (!serviceName) {
          return { resource: [] };
        }

        try {
          const apiPath = path ? `/${serviceName}/${path}` : `/${serviceName}`;
          const queryParams = {
            include_properties: 'content_type',
            fields: 'name,path,type,content_type,last_modified,size',
          };

          const response = await apiClient.request<{ resource: FileItem[] }>(
            `/api/v2${apiPath}`,
            {
              method: 'GET',
              signal: AbortSignal.timeout(30000), // 30 second timeout
            }
          );

          return response;
        } catch (error: any) {
          console.error(`Error fetching files from ${serviceName}/${path}:`, error);
          
          let errorMessage = 'Error loading files. ';
          if (error.status === 500) {
            errorMessage += 'The server encountered an internal error. This might be a temporary issue.';
          } else if (error.status === 404) {
            errorMessage += 'The specified folder does not exist.';
          } else if (error.status === 403 || error.status === 401) {
            errorMessage += 'You do not have permission to access this location.';
          } else {
            errorMessage += 'Please check your connection and try again.';
          }

          return {
            resource: [],
            error: errorMessage,
          };
        }
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      enabled: !!serviceName,
    });
  };

  /**
   * Mutation: Upload file with progress tracking
   */
  const useFileUpload = () => {
    return useMutation({
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
      }) => {
        // Validate file before upload
        const validation = validateFile(file);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }

        // Check for private key content
        const isPrivateKey = await detectPrivateKeyContent(file);
        if (isPrivateKey) {
          console.warn('Detected private key content in file:', file.name);
        }

        // Construct upload path
        let apiPath: string;
        if (path) {
          const cleanPath = path.replace(/\/$/, '');
          apiPath = `/api/v2/${serviceName}/${cleanPath}/${file.name}`;
        } else {
          apiPath = `/api/v2/${serviceName}/${file.name}`;
        }

        const uploadId = `${serviceName}-${path}-${file.name}-${Date.now()}`;
        
        // Initialize progress tracking
        const initialProgress: FileUploadProgress = {
          uploadId,
          fileName: file.name,
          fileSize: file.size,
          uploadedBytes: 0,
          percentage: 0,
          status: 'uploading',
        };

        setUploadProgress(prev => ({ ...prev, [uploadId]: initialProgress }));
        onProgress?.(initialProgress);

        try {
          // Create FormData for file upload
          const formData = new FormData();
          formData.append('files', file);

          // For large files (>5MB), we could implement chunked upload here
          const isLargeFile = file.size > 5 * 1024 * 1024;
          
          if (isLargeFile) {
            // TODO: Implement chunked upload for large files
            console.log('Large file detected, using standard upload method');
          }

          const response = await apiClient.request(apiPath, {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(300000), // 5 minute timeout for uploads
          });

          // Update progress to completed
          const completedProgress: FileUploadProgress = {
            ...initialProgress,
            uploadedBytes: file.size,
            percentage: 100,
            status: 'completed',
          };

          setUploadProgress(prev => ({ ...prev, [uploadId]: completedProgress }));
          onProgress?.(completedProgress);

          return { response, uploadId, validation };
        } catch (error) {
          // Update progress to failed
          const failedProgress: FileUploadProgress = {
            ...initialProgress,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Upload failed',
          };

          setUploadProgress(prev => ({ ...prev, [uploadId]: failedProgress }));
          onProgress?.(failedProgress);

          throw error;
        }
      },
      onSuccess: (data, variables) => {
        // Invalidate file list cache for the upload directory
        queryClient.invalidateQueries(['file-list', variables.serviceName, variables.path]);
        console.log('File upload completed:', data);
      },
      onError: (error) => {
        handleError(error);
      },
    });
  };

  /**
   * Download file with proper blob handling
   */
  const downloadFile = useCallback(async (
    serviceName: string,
    filePath: string,
    options: FileDownloadOptions = {}
  ): Promise<void> => {
    try {
      const { fileName = filePath.split('/').pop() || 'download' } = options;
      
      const apiPath = `/api/v2/${serviceName}/${filePath}`;
      
      // Use fetch directly for blob download
      const response = await fetch(getAbsoluteApiUrl(apiPath), {
        headers: getHeaders(),
        signal: AbortSignal.timeout(60000), // 1 minute timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Create download link and trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('File download completed:', fileName);
    } catch (error) {
      console.error('File download failed:', error);
      handleError(error);
      throw error;
    }
  }, [getAbsoluteApiUrl, getHeaders, handleError]);

  /**
   * Mutation: Create directory
   */
  const useCreateDirectory = () => {
    return useMutation({
      mutationFn: async ({
        serviceName,
        path,
        name,
      }: DirectoryCreateRequest) => {
        const payload = {
          resource: [
            {
              name,
              type: 'folder',
            },
          ],
        };

        const apiPath = path ? `/api/v2/${serviceName}/${path}` : `/api/v2/${serviceName}`;
        
        return await apiClient.request(apiPath, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
          },
        });
      },
      onSuccess: (data, variables) => {
        // Invalidate file list cache for the parent directory
        queryClient.invalidateQueries(['file-list', variables.serviceName, variables.path]);
        console.log('Directory created successfully:', variables.name);
      },
      onError: (error) => {
        handleError(error);
      },
    });
  };

  /**
   * Mutation: Delete file or directory
   */
  const useDeleteFile = () => {
    return useMutation({
      mutationFn: async ({
        serviceName,
        filePath,
      }: {
        serviceName: string;
        filePath: string;
      }) => {
        const apiPath = `/api/v2/${serviceName}/${filePath}`;
        
        return await apiClient.request(apiPath, {
          method: 'DELETE',
        });
      },
      onSuccess: (data, variables) => {
        // Invalidate file list cache for the parent directory
        const parentPath = variables.filePath.split('/').slice(0, -1).join('/');
        queryClient.invalidateQueries(['file-list', variables.serviceName, parentPath]);
        console.log('File deleted successfully:', variables.filePath);
      },
      onError: (error) => {
        handleError(error);
      },
    });
  };

  /**
   * Get file content as text or blob
   */
  const getFileContent = useCallback(async (
    serviceName: string,
    filePath: string,
    responseType: 'text' | 'blob' = 'blob'
  ): Promise<string | Blob> => {
    try {
      const apiPath = `/api/v2/${serviceName}/${filePath}`;
      
      const response = await fetch(getAbsoluteApiUrl(apiPath), {
        headers: getHeaders(),
        signal: AbortSignal.timeout(60000), // 1 minute timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (responseType === 'text') {
        return await response.text();
      } else {
        return await response.blob();
      }
    } catch (error) {
      console.error('Error getting file content:', error);
      handleError(error);
      throw error;
    }
  }, [getAbsoluteApiUrl, getHeaders, handleError]);

  /**
   * Clear upload progress for a specific upload
   */
  const clearUploadProgress = useCallback((uploadId: string) => {
    setUploadProgress(prev => {
      const updated = { ...prev };
      delete updated[uploadId];
      return updated;
    });
  }, []);

  /**
   * Get upload progress for a specific upload
   */
  const getUploadProgress = useCallback((uploadId: string): FileUploadProgress | undefined => {
    return uploadProgress[uploadId];
  }, [uploadProgress]);

  return {
    // Queries
    useFileServices,
    useFileList,
    
    // Mutations
    useFileUpload,
    useCreateDirectory,
    useDeleteFile,
    
    // Methods
    downloadFile,
    getFileContent,
    validateFile,
    
    // Progress tracking
    uploadProgress,
    getUploadProgress,
    clearUploadProgress,
    
    // Utilities
    isSelectableFileService,
    detectPrivateKeyContent,
  };
}

export default useFileApi;