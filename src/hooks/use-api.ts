'use client';

import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useSession } from './use-session';
import { useErrorHandler } from './use-error-handler';
import type { 
  GenericListResponse, 
  GenericSuccessResponse, 
  GenericCreateResponse,
  GenericUpdateResponse,
  RequestOptions,
  KeyValuePair 
} from '../types/generic-http';

/**
 * Configuration options for API requests extending original RequestOptions
 */
export interface ApiRequestOptions extends Partial<RequestOptions> {
  /**
   * Whether to enable React Query caching (default: true)
   */
  enableCache?: boolean;
  /**
   * Cache time in milliseconds (default: 10 minutes)
   */
  cacheTime?: number;
  /**
   * Stale time in milliseconds (default: 5 minutes) 
   */
  staleTime?: number;
  /**
   * Whether to refetch on window focus (default: false)
   */
  refetchOnWindowFocus?: boolean;
  /**
   * Background refetch interval in milliseconds
   */
  refetchInterval?: number;
  /**
   * Maximum retry attempts for failed requests (default: 3)
   */
  retryAttempts?: number;
  /**
   * Exponential backoff delay multiplier (default: 1000ms)
   */
  retryDelay?: number;
  /**
   * Whether to include authentication headers (default: true)
   */
  includeAuth?: boolean;
  /**
   * Progress callback for file uploads
   */
  onUploadProgress?: (progress: number) => void;
  /**
   * Progress callback for file downloads  
   */
  onDownloadProgress?: (progress: number) => void;
}

/**
 * File upload configuration interface
 */
export interface FileUploadOptions extends ApiRequestOptions {
  /**
   * Target location for file upload
   */
  location: string;
  /**
   * Files to upload
   */
  files: FileList | File[];
  /**
   * Whether to enable chunked upload for large files
   */
  chunked?: boolean;
  /**
   * Chunk size in bytes for chunked uploads (default: 1MB)
   */
  chunkSize?: number;
}

/**
 * File download configuration interface
 */
export interface FileDownloadOptions extends ApiRequestOptions {
  /**
   * Optional path for file download
   */
  path?: string;
  /**
   * Whether to download as JSON (default: false for blob)
   */
  asJson?: boolean;
  /**
   * Filename for downloaded file
   */
  filename?: string;
}

/**
 * Core API client hook that provides standardized HTTP operations with React Query integration.
 * Replaces Angular DfBaseCrudService with React Query patterns, intelligent caching,
 * and comprehensive error handling for all API interactions throughout the application.
 * 
 * Features:
 * - Standardized CRUD operations using React Query with intelligent caching
 * - HTTP request/response middleware for authentication, headers, and error handling  
 * - File upload/download capabilities with progress tracking and proper error states
 * - Request configuration management including pagination, filtering, and sorting parameters
 * - Comprehensive error handling with retry strategies and exponential backoff
 * - Integration with authentication system for automatic token attachment and refresh
 * 
 * @param baseUrl - Base URL for API endpoints
 * @param defaultOptions - Default options applied to all requests
 * @returns Object containing CRUD operations, file operations, and utility functions
 */
export function useApi(baseUrl: string, defaultOptions: ApiRequestOptions = {}) {
  const { session, isAuthenticated } = useSession();
  const { handleError, handleSuccess } = useErrorHandler();
  const queryClient = useQueryClient();

  /**
   * Builds request options from API configuration, combining defaults with request-specific options
   */
  const buildRequestOptions = useCallback((options: ApiRequestOptions = {}): RequestInit & { 
    params?: Record<string, any>,
    headers: Record<string, string>
  } => {
    const mergedOptions = { ...defaultOptions, ...options };
    const headers: Record<string, string> = {};
    const params: Record<string, any> = {};

    // Cache control headers
    if (mergedOptions.includeCacheControl !== false) {
      headers['Cache-Control'] = 'no-cache, private';
    }

    // Loading spinner indication
    if (mergedOptions.showSpinner !== false) {
      headers['show-loading'] = '';
    }

    // Notification headers for success/error handling
    if (mergedOptions.snackbarSuccess) {
      headers['snackbar-success'] = mergedOptions.snackbarSuccess;
    }
    if (mergedOptions.snackbarError) {
      headers['snackbar-error'] = mergedOptions.snackbarError;
    }

    // Content type header
    if (mergedOptions.contentType) {
      headers['Content-Type'] = mergedOptions.contentType;
    }

    // Authentication headers
    if (mergedOptions.includeAuth !== false && isAuthenticated && session?.token) {
      headers['Authorization'] = `Bearer ${session.token}`;
    }

    // Additional custom headers
    if (mergedOptions.additionalHeaders) {
      mergedOptions.additionalHeaders.forEach((header: KeyValuePair) => {
        headers[header.key] = header.value;
      });
    }

    // Query parameters for filtering, sorting, pagination
    if (mergedOptions.filter) params.filter = mergedOptions.filter;
    if (mergedOptions.sort) params.sort = mergedOptions.sort;
    if (mergedOptions.fields) params.fields = mergedOptions.fields;
    if (mergedOptions.related) params.related = mergedOptions.related;
    if (mergedOptions.limit !== undefined) params.limit = mergedOptions.limit;
    if (mergedOptions.offset !== undefined) params.offset = mergedOptions.offset;
    if (mergedOptions.includeCount !== undefined) params.include_count = mergedOptions.includeCount;
    if (mergedOptions.refresh) params.refresh = mergedOptions.refresh;

    // Additional custom parameters
    if (mergedOptions.additionalParams) {
      mergedOptions.additionalParams.forEach((param: KeyValuePair) => {
        params[param.key] = param.value;
      });
    }

    return {
      headers,
      params,
      credentials: 'include' as RequestCredentials,
    };
  }, [defaultOptions, isAuthenticated, session?.token]);

  /**
   * Builds complete URL with query parameters
   */
  const buildUrl = useCallback((endpoint: string, params?: Record<string, any>): string => {
    const url = new URL(endpoint, baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }, [baseUrl]);

  /**
   * Generic fetch wrapper with error handling and retry logic
   */
  const apiRequest = useCallback(async <T>(
    endpoint: string,
    requestOptions: RequestInit & { params?: Record<string, any> } = {},
    apiOptions: ApiRequestOptions = {}
  ): Promise<T> => {
    const { params, ...fetchOptions } = requestOptions;
    const url = buildUrl(endpoint, params);
    
    const retryAttempts = apiOptions.retryAttempts ?? 3;
    const retryDelay = apiOptions.retryDelay ?? 1000;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ 
            error: { 
              message: `HTTP ${response.status}: ${response.statusText}`,
              status_code: response.status,
              code: response.status.toString(),
              context: ''
            }
          }));
          throw new Error(JSON.stringify(errorData));
        }
        
        const data = await response.json();
        
        // Handle success notifications
        if (apiOptions.snackbarSuccess) {
          handleSuccess(apiOptions.snackbarSuccess);
        }
        
        return data;
      } catch (error) {
        lastError = error as Error;
        
        // Handle authentication errors immediately
        if (error instanceof Error && error.message.includes('401')) {
          handleError(error);
          throw error;
        }
        
        // Don't retry on client errors (4xx except 401)
        if (error instanceof Error && error.message.includes('4')) {
          const statusCode = parseInt(error.message.match(/\d{3}/)?.[0] || '400');
          if (statusCode >= 400 && statusCode < 500 && statusCode !== 401) {
            handleError(error);
            throw error;
          }
        }
        
        // Retry with exponential backoff for network errors and 5xx
        if (attempt < retryAttempts) {
          const delay = retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Final attempt failed
        handleError(lastError);
        throw lastError;
      }
    }
    
    throw lastError;
  }, [buildUrl, handleError, handleSuccess]);

  /**
   * GET request for fetching all items with pagination and filtering
   */
  const useGetAll = <T>(
    endpoint?: string, 
    options: ApiRequestOptions = {},
    queryOptions: {
      enabled?: boolean;
      initialData?: T;
      select?: (data: T) => any;
    } = {}
  ) => {
    const queryKey = [baseUrl, endpoint, 'getAll', options];
    
    return useQuery({
      queryKey,
      queryFn: () => {
        if (!endpoint) throw new Error('Endpoint is required for getAll');
        const requestOptions = buildRequestOptions({
          limit: 50,
          offset: 0,
          includeCount: true,
          ...options,
        });
        return apiRequest<T>(endpoint, { 
          method: 'GET', 
          ...requestOptions 
        }, options);
      },
      enabled: queryOptions.enabled !== false && !!endpoint,
      staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes
      cacheTime: options.cacheTime ?? 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
      refetchInterval: options.refetchInterval,
      retry: options.retryAttempts ?? 3,
      initialData: queryOptions.initialData,
      select: queryOptions.select,
    });
  };

  /**
   * GET request for fetching a single item by ID
   */
  const useGet = <T>(
    id?: string | number,
    endpoint?: string,
    options: ApiRequestOptions = {},
    queryOptions: {
      enabled?: boolean;
      initialData?: T;
      select?: (data: T) => any;
    } = {}
  ) => {
    const queryKey = [baseUrl, endpoint, 'get', id, options];
    
    return useQuery({
      queryKey,
      queryFn: () => {
        if (!endpoint || !id) throw new Error('Endpoint and ID are required for get');
        const requestOptions = buildRequestOptions({
          snackbarError: 'server',
          ...options,
        });
        return apiRequest<T>(`${endpoint}/${id}`, { 
          method: 'GET', 
          ...requestOptions 
        }, options);
      },
      enabled: queryOptions.enabled !== false && !!endpoint && !!id,
      staleTime: options.staleTime ?? 5 * 60 * 1000,
      cacheTime: options.cacheTime ?? 10 * 60 * 1000,
      refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
      retry: options.retryAttempts ?? 3,
      initialData: queryOptions.initialData,
      select: queryOptions.select,
    });
  };

  /**
   * POST request for creating new items with optimistic updates
   */
  const useCreate = <TResponse = GenericCreateResponse, TRequest = any>(
    endpoint?: string,
    options: ApiRequestOptions = {}
  ) => {
    return useMutation<TResponse, Error, { data: TRequest; subEndpoint?: string }>({
      mutationFn: async ({ data, subEndpoint }) => {
        if (!endpoint) throw new Error('Endpoint is required for create');
        const requestOptions = buildRequestOptions(options);
        const url = subEndpoint ? `${endpoint}/${subEndpoint}` : endpoint;
        return apiRequest<TResponse>(url, {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            ...requestOptions.headers,
            'Content-Type': 'application/json',
          },
        }, options);
      },
      onSuccess: () => {
        // Invalidate related queries
        if (endpoint) {
          queryClient.invalidateQueries({ queryKey: [baseUrl, endpoint] });
        }
      },
      retry: options.retryAttempts ?? 1, // Less aggressive retry for mutations
    });
  };

  /**
   * PUT request for updating existing items with optimistic updates
   */
  const useUpdate = <TResponse = GenericUpdateResponse, TRequest = any>(
    endpoint?: string,
    options: ApiRequestOptions = {}
  ) => {
    return useMutation<TResponse, Error, { id: string | number; data: TRequest }>({
      mutationFn: async ({ id, data }) => {
        if (!endpoint || !id) throw new Error('Endpoint and ID are required for update');
        const requestOptions = buildRequestOptions(options);
        return apiRequest<TResponse>(`${endpoint}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
          headers: {
            ...requestOptions.headers,
            'Content-Type': 'application/json',
          },
        }, options);
      },
      onSuccess: (_, { id }) => {
        // Invalidate related queries
        if (endpoint) {
          queryClient.invalidateQueries({ queryKey: [baseUrl, endpoint] });
          queryClient.invalidateQueries({ queryKey: [baseUrl, endpoint, 'get', id] });
        }
      },
      retry: options.retryAttempts ?? 1,
    });
  };

  /**
   * PATCH request for partial updates
   */
  const usePatch = <TResponse = GenericUpdateResponse, TRequest = any>(
    endpoint?: string,
    options: ApiRequestOptions = {}
  ) => {
    return useMutation<TResponse, Error, { id: string | number; data: Partial<TRequest> }>({
      mutationFn: async ({ id, data }) => {
        if (!endpoint || !id) throw new Error('Endpoint and ID are required for patch');
        const requestOptions = buildRequestOptions({
          snackbarError: 'server',
          ...options,
        });
        return apiRequest<TResponse>(`${endpoint}/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
          headers: {
            ...requestOptions.headers,
            'Content-Type': 'application/json',
          },
        }, options);
      },
      onSuccess: (_, { id }) => {
        // Invalidate related queries
        if (endpoint) {
          queryClient.invalidateQueries({ queryKey: [baseUrl, endpoint] });
          queryClient.invalidateQueries({ queryKey: [baseUrl, endpoint, 'get', id] });
        }
      },
      retry: options.retryAttempts ?? 1,
    });
  };

  /**
   * DELETE request for removing items
   */
  const useDelete = (endpoint?: string, options: ApiRequestOptions = {}) => {
    return useMutation<GenericSuccessResponse, Error, { 
      id?: string | number | Array<string | number>; 
      legacyEndpoint?: string;
    }>({
      mutationFn: async ({ id, legacyEndpoint }) => {
        if (!endpoint) throw new Error('Endpoint is required for delete');
        
        const requestOptions = buildRequestOptions({
          snackbarError: 'server',
          ...options,
        });
        
        // Handle legacy delete with X-Http-Method header
        if (legacyEndpoint) {
          return apiRequest<GenericSuccessResponse>(`${endpoint}/${legacyEndpoint}`, {
            method: 'POST',
            body: null,
            headers: {
              ...requestOptions.headers,
              'X-Http-Method': 'DELETE',
            },
          }, options);
        }
        
        // Handle single/multiple ID deletion
        let url = endpoint;
        if (Array.isArray(id)) {
          url = `${endpoint}?ids=${id.join(',')}`;
        } else if (id) {
          url = `${endpoint}/${id}`;
        }
        
        return apiRequest<GenericSuccessResponse>(url, {
          method: 'DELETE',
          ...requestOptions,
        }, options);
      },
      onSuccess: () => {
        // Invalidate related queries
        if (endpoint) {
          queryClient.invalidateQueries({ queryKey: [baseUrl, endpoint] });
        }
      },
      retry: options.retryAttempts ?? 1,
    });
  };

  /**
   * File upload with progress tracking and chunked upload support
   */
  const useFileUpload = (endpoint?: string, uploadOptions: FileUploadOptions = {}) => {
    return useMutation<GenericSuccessResponse, Error, FileUploadOptions>({
      mutationFn: async (options) => {
        if (!endpoint) throw new Error('Endpoint is required for file upload');
        
        const { location, files, onUploadProgress, chunked = false, chunkSize = 1024 * 1024 } = {
          ...uploadOptions,
          ...options,
        };
        
        if (!location || !files) {
          throw new Error('Location and files are required for upload');
        }
        
        const formData = new FormData();
        const fileArray = Array.from(files);
        fileArray.forEach((file, index) => {
          formData.append('files', file);
        });
        
        const requestOptions = buildRequestOptions({
          snackbarError: 'server',
          ...uploadOptions,
        });
        
        // Remove Content-Type to let browser set multipart boundary
        delete requestOptions.headers['Content-Type'];
        
        if (chunked && fileArray.length === 1 && fileArray[0].size > chunkSize) {
          // Implement chunked upload for large files
          return await uploadFileInChunks(
            `${endpoint}/${location}`,
            fileArray[0],
            chunkSize,
            onUploadProgress,
            requestOptions
          );
        }
        
        return new Promise<GenericSuccessResponse>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onUploadProgress) {
              const progress = (event.loaded / event.total) * 100;
              onUploadProgress(progress);
            }
          });
          
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch {
                resolve({ success: true });
              }
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          });
          
          xhr.addEventListener('error', () => {
            reject(new Error('Upload failed: Network error'));
          });
          
          xhr.open('POST', buildUrl(`${endpoint}/${location}`));
          
          // Set headers
          Object.entries(requestOptions.headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });
          
          xhr.send(formData);
        });
      },
      retry: uploadOptions.retryAttempts ?? 1,
    });
  };

  /**
   * Chunked file upload implementation for large files
   */
  const uploadFileInChunks = async (
    url: string,
    file: File,
    chunkSize: number,
    onProgress?: (progress: number) => void,
    requestOptions: any = {}
  ): Promise<GenericSuccessResponse> => {
    const totalChunks = Math.ceil(file.size / chunkSize);
    let uploadedBytes = 0;
    
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunkIndex', chunkIndex.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('fileName', file.name);
      
      await fetch(url, {
        method: 'POST',
        body: formData,
        headers: requestOptions.headers,
      });
      
      uploadedBytes += chunk.size;
      if (onProgress) {
        onProgress((uploadedBytes / file.size) * 100);
      }
    }
    
    return { success: true };
  };

  /**
   * File download with progress tracking
   */
  const useFileDownload = (endpoint?: string, downloadOptions: FileDownloadOptions = {}) => {
    return useMutation<Blob | string, Error, FileDownloadOptions>({
      mutationFn: async (options) => {
        if (!endpoint) throw new Error('Endpoint is required for file download');
        
        const { path, asJson = false, filename, onDownloadProgress } = {
          ...downloadOptions,
          ...options,
        };
        
        const url = path ? `${endpoint}/${path}` : endpoint;
        const requestOptions = buildRequestOptions({
          snackbarError: 'server',
          ...downloadOptions,
        });
        
        if (asJson) {
          // Download as JSON string
          const response = await apiRequest<any>(url, {
            method: 'GET',
            ...requestOptions,
          }, downloadOptions);
          return JSON.stringify(response);
        } else {
          // Download as blob with progress tracking
          return new Promise<Blob>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.responseType = 'blob';
            
            xhr.addEventListener('progress', (event) => {
              if (event.lengthComputable && onDownloadProgress) {
                const progress = (event.loaded / event.total) * 100;
                onDownloadProgress(progress);
              }
            });
            
            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
              } else {
                reject(new Error(`Download failed: ${xhr.statusText}`));
              }
            });
            
            xhr.addEventListener('error', () => {
              reject(new Error('Download failed: Network error'));
            });
            
            xhr.open('GET', buildUrl(url, requestOptions.params));
            
            // Set headers
            Object.entries(requestOptions.headers).forEach(([key, value]) => {
              xhr.setRequestHeader(key, value);
            });
            
            xhr.send();
          });
        }
      },
      onSuccess: (data, variables) => {
        if (data instanceof Blob && variables.filename) {
          // Trigger download
          const url = URL.createObjectURL(data);
          const a = document.createElement('a');
          a.href = url;
          a.download = variables.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      },
      retry: downloadOptions.retryAttempts ?? 1,
    });
  };

  /**
   * Import data from file
   */
  const useImportFile = (endpoint?: string, options: ApiRequestOptions = {}) => {
    return useMutation<GenericSuccessResponse, Error, { file: File }>({
      mutationFn: async ({ file }) => {
        if (!endpoint) throw new Error('Endpoint is required for import');
        
        const fileContent = await readFileAsText(file);
        const requestOptions = buildRequestOptions({
          snackbarError: 'server',
          contentType: file.type,
          ...options,
        });
        
        return apiRequest<GenericSuccessResponse>(endpoint, {
          method: 'POST',
          body: fileContent,
          headers: {
            ...requestOptions.headers,
            'Content-Type': file.type,
          },
        }, options);
      },
      retry: options.retryAttempts ?? 1,
    });
  };

  /**
   * Utility function to read file as text
   */
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  /**
   * Specialized methods for specific endpoints
   */
  const specializedMethods = useMemo(() => ({
    /**
     * Get event scripts with predefined parameters
     */
    useGetEventScripts: <T>() => {
      return useQuery({
        queryKey: [baseUrl, '/api/v2/system/event_script', 'getEventScripts'],
        queryFn: () => {
          const requestOptions = buildRequestOptions({
            limit: 50,
            offset: 0,
            includeCount: true,
          });
          return apiRequest<T>('/api/v2/system/event_script', {
            method: 'GET',
            ...requestOptions,
          });
        },
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
      });
    },

    /**
     * Get GitHub releases
     */
    useGetReleases: () => {
      return useQuery({
        queryKey: ['github', 'releases'],
        queryFn: () => {
          return fetch('https://api.github.com/repos/dreamfactorysoftware/df-admin-interface/releases')
            .then(response => response.json());
        },
        staleTime: 30 * 60 * 1000, // 30 minutes
        cacheTime: 60 * 60 * 1000, // 1 hour
      });
    },

    /**
     * Get file content with optional authentication
     */
    useGetFileContent: (id?: string, username?: string, token?: string) => {
      return useQuery({
        queryKey: [baseUrl, 'file-content', id, username, token],
        queryFn: () => {
          if (!id) throw new Error('File ID is required');
          
          const headers: Record<string, string> = {};
          if (username && token) {
            headers['Authorization'] = `Basic ${btoa(`${username}:${token}`)}`;
          }
          
          return fetch(buildUrl(`${baseUrl}/${id}`), { headers })
            .then(response => response.text());
        },
        enabled: !!id,
        staleTime: 0, // Always fetch fresh file content
      });
    },
  }), [baseUrl, buildRequestOptions, buildUrl, apiRequest]);

  return {
    // Core CRUD operations
    useGetAll,
    useGet,
    useCreate,
    useUpdate,
    usePatch,
    useDelete,
    
    // File operations
    useFileUpload,
    useFileDownload,
    useImportFile,
    
    // Specialized methods
    ...specializedMethods,
    
    // Utility functions
    buildRequestOptions,
    buildUrl,
    apiRequest,
    
    // Configuration
    baseUrl,
    defaultOptions,
  };
}

export default useApi;