/**
 * Core API client for DreamFactory admin interface.
 * 
 * Provides standardized HTTP client functionality with React Query integration,
 * authentication handling, and error management. Replaces Angular HttpClient
 * patterns with modern fetch-based implementations optimized for React 19
 * and Next.js 15.1+.
 * 
 * @fileoverview Core API client implementation
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import type { 
  ApiRequestOptions, 
  ApiResponse, 
  ApiListResponse,
  ApiResourceResponse,
  ApiErrorResponse,
  KeyValuePair 
} from '../types/api';

// ============================================================================
// API Client Constants
// ============================================================================

/**
 * Base URL for DreamFactory API endpoints
 */
export const API_BASE_URL = '/api/v2';

/**
 * System API endpoints
 */
export const API_ENDPOINTS = {
  SYSTEM_APP: `${API_BASE_URL}/system/app`,
  SYSTEM_ADMIN: `${API_BASE_URL}/system/admin`,
  SYSTEM_USER: `${API_BASE_URL}/system/user`,
  SYSTEM_SERVICE: `${API_BASE_URL}/system/service`,
  SYSTEM_ROLE: `${API_BASE_URL}/system/role`,
  USER_SESSION: `${API_BASE_URL}/user/session`,
  ADMIN_SESSION: `${API_BASE_URL}/system/admin/session`,
} as const;

// ============================================================================
// API Client Implementation
// ============================================================================

/**
 * Build URL with query parameters
 */
export function buildApiUrl(endpoint: string, params?: Record<string, any>): string {
  const url = new URL(endpoint, window.location.origin);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  return url.toString();
}

/**
 * Build request headers with authentication and options
 */
export function buildApiHeaders(options: ApiRequestOptions = {}): Record<string, string> {
  const headers: Record<string, string> = {};
  
  // Default headers
  headers['Accept'] = 'application/json';
  headers['Content-Type'] = 'application/json';
  
  // Cache control
  if (options.includeCacheControl !== false) {
    headers['Cache-Control'] = 'no-cache, private';
  }
  
  // Loading indicator
  if (options.showSpinner !== false) {
    headers['show-loading'] = '';
  }
  
  // Notification headers
  if (options.snackbarSuccess) {
    headers['snackbar-success'] = options.snackbarSuccess;
  }
  if (options.snackbarError) {
    headers['snackbar-error'] = options.snackbarError;
  }
  
  // Content type override
  if (options.contentType) {
    headers['Content-Type'] = options.contentType;
  }
  
  // Additional headers
  if (options.additionalHeaders) {
    options.additionalHeaders.forEach((header: KeyValuePair) => {
      headers[header.key] = header.value;
    });
  }
  
  return headers;
}

/**
 * Build query parameters from options
 */
export function buildQueryParams(options: ApiRequestOptions = {}): Record<string, any> {
  const params: Record<string, any> = {};
  
  if (options.filter) params.filter = options.filter;
  if (options.sort) params.sort = options.sort;
  if (options.fields) params.fields = options.fields;
  if (options.related) params.related = options.related;
  if (options.limit !== undefined) params.limit = options.limit;
  if (options.offset !== undefined) params.offset = options.offset;
  if (options.includeCount !== undefined) params.include_count = options.includeCount;
  if (options.refresh) params.refresh = options.refresh;
  
  // Additional parameters
  if (options.additionalParams) {
    options.additionalParams.forEach((param: KeyValuePair) => {
      params[param.key] = param.value;
    });
  }
  
  return params;
}

/**
 * Generic API request function
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions & {
    method?: string;
    body?: any;
  } = {}
): Promise<T> {
  const { method = 'GET', body, ...requestOptions } = options;
  
  const headers = buildApiHeaders(requestOptions);
  const params = buildQueryParams(requestOptions);
  const url = buildApiUrl(endpoint, params);
  
  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };
  
  if (body && method !== 'GET' && method !== 'HEAD') {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  
  if (options.signal) {
    fetchOptions.signal = options.signal;
  }
  
  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      let errorData: ApiErrorResponse;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          success: false,
          error: {
            code: response.status.toString(),
            message: `HTTP ${response.status}: ${response.statusText}`,
            status_code: response.status as any,
          },
        };
      }
      throw new Error(JSON.stringify(errorData));
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}

/**
 * GET request helper
 */
export async function apiGet<T = any>(
  endpoint: string, 
  options: ApiRequestOptions = {}
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<T> {
  return apiRequest<T>(endpoint, { 
    ...options, 
    method: 'POST', 
    body: data 
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<T> {
  return apiRequest<T>(endpoint, { 
    ...options, 
    method: 'PUT', 
    body: data 
  });
}

/**
 * PATCH request helper
 */
export async function apiPatch<T = any>(
  endpoint: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<T> {
  return apiRequest<T>(endpoint, { 
    ...options, 
    method: 'PATCH', 
    body: data 
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  buildApiUrl,
  buildApiHeaders,
  buildQueryParams,
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
};