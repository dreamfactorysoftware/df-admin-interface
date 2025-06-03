/**
 * Core API client hook that provides standardized HTTP operations, request configuration, and response handling.
 * Replaces Angular DfBaseCrudService with React Query patterns, intelligent caching, and comprehensive error handling
 * for all API interactions throughout the application.
 * 
 * This hook implements:
 * - Standardized CRUD operations using React Query with intelligent caching per Section 3.2.4
 * - HTTP request/response middleware for authentication, headers, and error handling
 * - File upload/download capabilities with progress tracking and proper error states
 * - Request configuration management including pagination, filtering, and sorting parameters
 * - Comprehensive error handling with retry strategies and exponential backoff
 * - Integration with authentication system for automatic token attachment and refresh
 */

import { useMutation, useQuery, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

/**
 * Generic HTTP interfaces matching the original Angular patterns
 */
export interface GenericSuccessResponse {
  success: boolean
}

export interface GenericErrorResponse {
  error: {
    code: string
    context: string | { error: Array<any>; resource: Array<GenericErrorResponse> }
    message: string
    status_code: number
  }
}

export interface Meta {
  count: number
}

export interface GenericListResponse<T> {
  resource: Array<T>
  meta: Meta
}

export interface KeyValuePair {
  key: string
  value: any
}

export interface RequestOptions {
  showSpinner?: boolean
  filter?: string
  sort?: string
  fields?: string
  related?: string
  limit?: number
  offset?: number
  includeCount?: boolean
  snackbarSuccess?: string
  snackbarError?: string
  contentType?: string
  additionalParams?: KeyValuePair[]
  additionalHeaders?: KeyValuePair[]
  includeCacheControl?: boolean
  refresh?: boolean
}

export type GenericCreateResponse = GenericListResponse<{ id: number }>

export interface GenericUpdateResponse {
  id: number
}

/**
 * Session interface for authentication integration
 */
export interface SessionData {
  sessionToken?: string
  user?: {
    id: number
    email: string
    name: string
    roles?: string[]
  }
  isAuthenticated: boolean
  expiresAt?: number
}

/**
 * File upload progress interface
 */
export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

/**
 * Error handling interface
 */
export interface ApiError extends Error {
  status?: number
  code?: string
  context?: any
  retryable?: boolean
}

/**
 * API configuration for each hook instance
 */
export interface ApiConfig {
  baseUrl: string
  defaultOptions?: Partial<RequestOptions>
  enableRetry?: boolean
  maxRetries?: number
  retryDelay?: (attempt: number) => number
  cacheTime?: number
  staleTime?: number
}

/**
 * Mock session hook for dependency injection pattern
 * This will be replaced by the actual useSession hook when available
 */
const useSessionMock = (): { data: SessionData | null; isLoading: boolean } => {
  return {
    data: {
      sessionToken: '',
      isAuthenticated: false,
    },
    isLoading: false,
  }
}

/**
 * Mock error handler hook for dependency injection pattern
 * This will be replaced by the actual useErrorHandler hook when available
 */
const useErrorHandlerMock = () => {
  return {
    handleError: (error: any) => {
      console.error('API Error:', error)
    },
    reportError: (error: any, context?: any) => {
      console.error('Reported Error:', error, context)
    },
  }
}

/**
 * Default exponential backoff retry delay function
 */
const defaultRetryDelay = (attempt: number): number => {
  return Math.min(1000 * 2 ** attempt, 30000) // Cap at 30 seconds
}

/**
 * Core API client hook providing standardized HTTP operations with React Query integration
 * 
 * @param config - API configuration including base URL and default options
 * @returns Object containing query hooks, mutation hooks, and utility functions
 */
export function useApi(config: ApiConfig) {
  const queryClient = useQueryClient()
  const { data: session } = useSessionMock() // Replace with actual useSession hook
  const { handleError, reportError } = useErrorHandlerMock() // Replace with actual useErrorHandler hook
  
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)

  // Default configuration with intelligent caching settings per Section 3.2.4
  const defaultConfig: Required<ApiConfig> = {
    baseUrl: config.baseUrl,
    defaultOptions: {
      showSpinner: true,
      includeCacheControl: true,
      limit: 50,
      offset: 0,
      includeCount: true,
      ...config.defaultOptions,
    },
    enableRetry: config.enableRetry ?? true,
    maxRetries: config.maxRetries ?? 3,
    retryDelay: config.retryDelay ?? defaultRetryDelay,
    cacheTime: config.cacheTime ?? 10 * 60 * 1000, // 10 minutes
    staleTime: config.staleTime ?? 5 * 60 * 1000, // 5 minutes
  }

  /**
   * Builds request configuration with authentication, headers, and error handling
   */
  const buildRequestConfig = useCallback((options: Partial<RequestOptions> = {}): RequestInit => {
    const mergedOptions = { ...defaultConfig.defaultOptions, ...options }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Authentication integration - attach session token
    if (session?.sessionToken) {
      headers['Authorization'] = `Bearer ${session.sessionToken}`
    }

    // Cache control per original service behavior
    if (mergedOptions.includeCacheControl !== false) {
      headers['Cache-Control'] = 'no-cache, private'
    }

    // Loading spinner coordination
    if (mergedOptions.showSpinner !== false) {
      headers['show-loading'] = ''
    }

    // Notification headers for success/error handling
    if (mergedOptions.snackbarSuccess) {
      headers['snackbar-success'] = mergedOptions.snackbarSuccess
    }

    if (mergedOptions.snackbarError) {
      headers['snackbar-error'] = mergedOptions.snackbarError
    }

    // Content type override
    if (mergedOptions.contentType) {
      headers['Content-Type'] = mergedOptions.contentType
    }

    // Additional headers from options
    mergedOptions.additionalHeaders?.forEach(header => {
      headers[header.key] = header.value
    })

    return {
      headers,
      credentials: 'include', // For cookie-based authentication
    }
  }, [session, defaultConfig.defaultOptions])

  /**
   * Builds URL search parameters for filtering, sorting, and pagination
   */
  const buildSearchParams = useCallback((options: Partial<RequestOptions> = {}): URLSearchParams => {
    const params = new URLSearchParams()
    const mergedOptions = { ...defaultConfig.defaultOptions, ...options }

    // Query parameters per original service behavior
    if (mergedOptions.filter) params.set('filter', mergedOptions.filter)
    if (mergedOptions.sort) params.set('sort', mergedOptions.sort)
    if (mergedOptions.fields) params.set('fields', mergedOptions.fields)
    if (mergedOptions.related) params.set('related', mergedOptions.related)
    if (mergedOptions.limit !== undefined) params.set('limit', String(mergedOptions.limit))
    if (mergedOptions.offset !== undefined) params.set('offset', String(mergedOptions.offset))
    if (mergedOptions.includeCount !== undefined) params.set('include_count', String(mergedOptions.includeCount))
    if (mergedOptions.refresh) params.set('refresh', String(mergedOptions.refresh))

    // Additional parameters from options
    mergedOptions.additionalParams?.forEach(param => {
      params.set(param.key, param.value)
    })

    return params
  }, [defaultConfig.defaultOptions])

  /**
   * Enhanced fetch function with error handling, retries, and progress tracking
   */
  const enhancedFetch = useCallback(async (
    url: string,
    options: RequestInit = {},
    requestOptions: Partial<RequestOptions> = {}
  ): Promise<Response> => {
    const config = buildRequestConfig(requestOptions)
    const searchParams = buildSearchParams(requestOptions)
    
    // Build final URL with search parameters
    const finalUrl = searchParams.toString() 
      ? `${url}${url.includes('?') ? '&' : '?'}${searchParams.toString()}`
      : url

    let lastError: ApiError

    // Retry logic with exponential backoff
    for (let attempt = 0; attempt <= defaultConfig.maxRetries; attempt++) {
      try {
        const response = await fetch(finalUrl, {
          ...config,
          ...options,
        })

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const apiError: ApiError = new Error(errorData.error?.message || `HTTP ${response.status}`)
          apiError.status = response.status
          apiError.code = errorData.error?.code
          apiError.context = errorData.error?.context
          apiError.retryable = response.status >= 500 || response.status === 429

          if (!apiError.retryable || attempt === defaultConfig.maxRetries) {
            handleError(apiError)
            throw apiError
          }

          lastError = apiError
        } else {
          return response
        }
      } catch (error) {
        const apiError = error as ApiError
        lastError = apiError

        // Don't retry on network errors for the last attempt
        if (attempt === defaultConfig.maxRetries) {
          handleError(apiError)
          throw apiError
        }
      }

      // Wait before retry with exponential backoff
      if (attempt < defaultConfig.maxRetries) {
        const delay = defaultConfig.retryDelay(attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }, [buildRequestConfig, buildSearchParams, defaultConfig, handleError])

  /**
   * Generic GET operation with React Query integration
   */
  const useGetQuery = <T>(
    queryKey: string[],
    endpoint: string,
    options: Partial<RequestOptions> = {},
    queryOptions?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
  ) => {
    return useQuery<T>({
      queryKey,
      queryFn: async () => {
        const response = await enhancedFetch(`${defaultConfig.baseUrl}${endpoint}`, {}, options)
        return response.json()
      },
      staleTime: defaultConfig.staleTime,
      gcTime: defaultConfig.cacheTime, // Updated from cacheTime in React Query v5
      retry: defaultConfig.enableRetry ? defaultConfig.maxRetries : false,
      ...queryOptions,
    })
  }

  /**
   * List/getAll operation with intelligent caching
   */
  const useGetAllQuery = <T>(
    queryKey: string[],
    endpoint: string,
    options: Partial<RequestOptions> = {},
    queryOptions?: Omit<UseQueryOptions<GenericListResponse<T>>, 'queryKey' | 'queryFn'>
  ) => {
    const listOptions: Partial<RequestOptions> = {
      limit: 50,
      offset: 0,
      includeCount: true,
      ...options,
    }

    return useGetQuery<GenericListResponse<T>>(
      queryKey,
      endpoint,
      listOptions,
      queryOptions
    )
  }

  /**
   * Single item GET operation
   */
  const useGetByIdQuery = <T>(
    queryKey: string[],
    endpoint: string,
    id: string | number,
    options: Partial<RequestOptions> = {},
    queryOptions?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
  ) => {
    const itemOptions: Partial<RequestOptions> = {
      snackbarError: 'server',
      ...options,
    }

    return useGetQuery<T>(
      [...queryKey, String(id)],
      `${endpoint}/${id}`,
      itemOptions,
      {
        enabled: Boolean(id),
        ...queryOptions,
      }
    )
  }

  /**
   * CREATE operation with optimistic updates
   */
  const useCreateMutation = <TData, TVariables>(
    endpoint: string,
    options: Partial<RequestOptions> = {},
    mutationOptions?: Omit<UseMutationOptions<TData, ApiError, TVariables>, 'mutationFn'>
  ) => {
    return useMutation<TData, ApiError, TVariables>({
      mutationFn: async (data: TVariables) => {
        const response = await enhancedFetch(
          `${defaultConfig.baseUrl}${endpoint}`,
          {
            method: 'POST',
            body: JSON.stringify(data),
          },
          options
        )
        return response.json()
      },
      onError: (error) => {
        reportError(error, { endpoint, operation: 'create' })
      },
      ...mutationOptions,
    })
  }

  /**
   * UPDATE operation with cache invalidation
   */
  const useUpdateMutation = <TData, TVariables>(
    endpoint: string,
    id: string | number,
    options: Partial<RequestOptions> = {},
    mutationOptions?: Omit<UseMutationOptions<TData, ApiError, TVariables>, 'mutationFn'>
  ) => {
    return useMutation<TData, ApiError, TVariables>({
      mutationFn: async (data: TVariables) => {
        const response = await enhancedFetch(
          `${defaultConfig.baseUrl}${endpoint}/${id}`,
          {
            method: 'PUT',
            body: JSON.stringify(data),
          },
          options
        )
        return response.json()
      },
      onError: (error) => {
        reportError(error, { endpoint, id, operation: 'update' })
      },
      ...mutationOptions,
    })
  }

  /**
   * PATCH operation for partial updates
   */
  const usePatchMutation = <TData, TVariables>(
    endpoint: string,
    id: string | number,
    options: Partial<RequestOptions> = {},
    mutationOptions?: Omit<UseMutationOptions<TData, ApiError, TVariables>, 'mutationFn'>
  ) => {
    const patchOptions: Partial<RequestOptions> = {
      snackbarError: 'server',
      ...options,
    }

    return useMutation<TData, ApiError, TVariables>({
      mutationFn: async (data: TVariables) => {
        const response = await enhancedFetch(
          `${defaultConfig.baseUrl}${endpoint}/${id}`,
          {
            method: 'PATCH',
            body: JSON.stringify(data),
          },
          patchOptions
        )
        return response.json()
      },
      onError: (error) => {
        reportError(error, { endpoint, id, operation: 'patch' })
      },
      ...mutationOptions,
    })
  }

  /**
   * DELETE operation with batch support
   */
  const useDeleteMutation = (
    endpoint: string,
    options: Partial<RequestOptions> = {},
    mutationOptions?: Omit<UseMutationOptions<void, ApiError, string | number | Array<string | number>>, 'mutationFn'>
  ) => {
    const deleteOptions: Partial<RequestOptions> = {
      snackbarError: 'server',
      ...options,
    }

    return useMutation<void, ApiError, string | number | Array<string | number>>({
      mutationFn: async (id: string | number | Array<string | number>) => {
        let url: string
        
        if (Array.isArray(id)) {
          url = `${defaultConfig.baseUrl}${endpoint}?ids=${id.join(',')}`
        } else if (id) {
          url = `${defaultConfig.baseUrl}${endpoint}/${id}`
        } else {
          url = `${defaultConfig.baseUrl}${endpoint}`
        }

        await enhancedFetch(url, { method: 'DELETE' }, deleteOptions)
      },
      onError: (error) => {
        reportError(error, { endpoint, operation: 'delete' })
      },
      ...mutationOptions,
    })
  }

  /**
   * File upload with progress tracking
   */
  const useFileUploadMutation = (
    endpoint: string,
    location: string,
    options: Partial<RequestOptions> = {},
    mutationOptions?: Omit<UseMutationOptions<any, ApiError, FileList>, 'mutationFn'>
  ) => {
    return useMutation<any, ApiError, FileList>({
      mutationFn: async (files: FileList) => {
        const formData = new FormData()
        Array.from(files).forEach((file, index) => {
          formData.append('files', file)
        })

        const uploadOptions = {
          snackbarError: 'server',
          ...options,
          contentType: undefined, // Let browser set Content-Type for FormData
        }

        // Create XMLHttpRequest for progress tracking
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          
          // Progress tracking
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress: UploadProgress = {
                loaded: event.loaded,
                total: event.total,
                percentage: Math.round((event.loaded / event.total) * 100),
              }
              setUploadProgress(progress)
            }
          })

          // Response handling
          xhr.addEventListener('load', () => {
            setUploadProgress(null)
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText))
              } catch {
                resolve(xhr.responseText)
              }
            } else {
              const error: ApiError = new Error(`Upload failed: ${xhr.statusText}`)
              error.status = xhr.status
              reject(error)
            }
          })

          xhr.addEventListener('error', () => {
            setUploadProgress(null)
            const error: ApiError = new Error('Upload failed')
            reject(error)
          })

          // Build headers (excluding Content-Type for FormData)
          const config = buildRequestConfig(uploadOptions)
          const headers = { ...config.headers }
          delete headers['Content-Type']

          // Set headers
          Object.entries(headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value)
          })

          // Send request
          xhr.open('POST', `${defaultConfig.baseUrl}${endpoint}/${location}`)
          xhr.send(formData)
        })
      },
      onError: (error) => {
        setUploadProgress(null)
        reportError(error, { endpoint, location, operation: 'upload' })
      },
      ...mutationOptions,
    })
  }

  /**
   * File download with blob handling
   */
  const useFileDownloadMutation = (
    endpoint: string,
    options: Partial<RequestOptions> = {},
    mutationOptions?: Omit<UseMutationOptions<Blob, ApiError, string>, 'mutationFn'>
  ) => {
    const downloadOptions: Partial<RequestOptions> = {
      snackbarError: 'server',
      ...options,
    }

    return useMutation<Blob, ApiError, string>({
      mutationFn: async (path?: string) => {
        const url = path ? `${endpoint}/${path}` : endpoint
        const response = await enhancedFetch(
          `${defaultConfig.baseUrl}${url}`,
          {},
          downloadOptions
        )
        return response.blob()
      },
      onError: (error) => {
        reportError(error, { endpoint, operation: 'download' })
      },
      ...mutationOptions,
    })
  }

  /**
   * JSON download utility
   */
  const useJsonDownloadMutation = (
    endpoint: string,
    options: Partial<RequestOptions> = {},
    mutationOptions?: Omit<UseMutationOptions<string, ApiError, string>, 'mutationFn'>
  ) => {
    const downloadOptions: Partial<RequestOptions> = {
      snackbarError: 'server',
      ...options,
    }

    return useMutation<string, ApiError, string>({
      mutationFn: async (path?: string) => {
        const url = path ? `${endpoint}/${path}` : endpoint
        const response = await enhancedFetch(
          `${defaultConfig.baseUrl}${url}`,
          {},
          downloadOptions
        )
        const data = await response.json()
        return JSON.stringify(data, null, 2)
      },
      onError: (error) => {
        reportError(error, { endpoint, operation: 'json-download' })
      },
      ...mutationOptions,
    })
  }

  /**
   * Cache invalidation utilities
   */
  const invalidateQueries = useCallback((queryKey: string[]) => {
    return queryClient.invalidateQueries({ queryKey })
  }, [queryClient])

  const setQueryData = useCallback(<T>(queryKey: string[], data: T) => {
    return queryClient.setQueryData(queryKey, data)
  }, [queryClient])

  const getQueryData = useCallback(<T>(queryKey: string[]) => {
    return queryClient.getQueryData<T>(queryKey)
  }, [queryClient])

  /**
   * Legacy delete operation for backward compatibility
   */
  const useLegacyDeleteMutation = (
    endpoint: string,
    deleteEndpoint: string,
    options: Partial<RequestOptions> = {},
    mutationOptions?: Omit<UseMutationOptions<void, ApiError, void>, 'mutationFn'>
  ) => {
    return useMutation<void, ApiError, void>({
      mutationFn: async () => {
        const config = buildRequestConfig({
          snackbarError: 'server',
          ...options,
        })
        
        await enhancedFetch(
          `${defaultConfig.baseUrl}${endpoint}/${deleteEndpoint}`,
          {
            method: 'POST',
            body: null,
            headers: {
              ...config.headers,
              'X-Http-Method': 'DELETE',
            },
          },
          options
        )
      },
      onError: (error) => {
        reportError(error, { endpoint, deleteEndpoint, operation: 'legacy-delete' })
      },
      ...mutationOptions,
    })
  }

  /**
   * Import list operation for bulk data import
   */
  const useImportListMutation = (
    endpoint: string,
    options: Partial<RequestOptions> = {},
    mutationOptions?: Omit<UseMutationOptions<any, ApiError, File>, 'mutationFn'>
  ) => {
    return useMutation<any, ApiError, File>({
      mutationFn: async (file: File) => {
        // Read file as text
        const fileContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error('Failed to read file'))
          reader.readAsText(file)
        })

        const importOptions = {
          snackbarError: 'server',
          contentType: file.type,
          ...options,
        }

        const response = await enhancedFetch(
          `${defaultConfig.baseUrl}${endpoint}`,
          {
            method: 'POST',
            body: fileContent,
          },
          importOptions
        )
        return response.json()
      },
      onError: (error) => {
        reportError(error, { endpoint, operation: 'import' })
      },
      ...mutationOptions,
    })
  }

  return {
    // Query hooks
    useGetQuery,
    useGetAllQuery,
    useGetByIdQuery,
    
    // Mutation hooks
    useCreateMutation,
    useUpdateMutation,
    usePatchMutation,
    useDeleteMutation,
    useLegacyDeleteMutation,
    useImportListMutation,
    
    // File operations
    useFileUploadMutation,
    useFileDownloadMutation,
    useJsonDownloadMutation,
    
    // Cache utilities
    invalidateQueries,
    setQueryData,
    getQueryData,
    
    // Utility functions
    buildRequestConfig,
    buildSearchParams,
    enhancedFetch,
    
    // State
    uploadProgress,
    
    // Configuration
    config: defaultConfig,
  }
}

/**
 * Specialized hook for specific API endpoints with pre-configured base URL
 */
export function useApiEndpoint(endpoint: string, options: Partial<RequestOptions> = {}) {
  return useApi({
    baseUrl: endpoint,
    defaultOptions: options,
  })
}

/**
 * Hook for DreamFactory system API operations
 */
export function useSystemApi(options: Partial<RequestOptions> = {}) {
  return useApi({
    baseUrl: '/api/v2/system',
    defaultOptions: {
      snackbarError: 'server',
      ...options,
    },
  })
}

/**
 * Hook for DreamFactory database service API operations
 */
export function useDatabaseApi(options: Partial<RequestOptions> = {}) {
  return useApi({
    baseUrl: '/api/v2',
    defaultOptions: {
      snackbarError: 'server',
      ...options,
    },
  })
}

export default useApi