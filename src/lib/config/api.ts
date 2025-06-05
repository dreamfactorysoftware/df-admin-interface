/**
 * API Configuration for DreamFactory Admin Interface
 * 
 * Migrates Angular URL constants to Next.js-compatible API client configuration.
 * Provides type-safe endpoint definitions, base URL management, and environment-specific
 * API routing for both internal DreamFactory APIs and external service integrations.
 * 
 * Key Features:
 * - Environment variable integration for deployment flexibility
 * - Support for both client-side fetch calls and server-side API route handlers
 * - Base URL resolution compatible with Next.js deployment patterns
 * - Seamless migration path from Angular URLS constant structure
 * - Integration with SWR/React Query for intelligent caching
 */

// Type definitions for API configuration
export interface ApiConfig {
  baseUrl: string;
  endpoints: Record<string, string>;
  isServer: boolean;
  version: string;
}

export interface RequestConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface EndpointConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requiresAuth?: boolean;
  cache?: boolean;
  timeout?: number;
}

/**
 * Environment-aware base URL resolution
 * Supports Next.js deployment patterns including edge functions and serverless
 */
export function getBaseUrl(): string {
  // Server-side URL resolution
  if (typeof window === 'undefined') {
    // For Next.js API routes and server-side rendering
    return process.env.NEXT_PUBLIC_API_BASE_URL || 
           process.env.API_BASE_URL || 
           'http://localhost:3000/api/v2';
  }

  // Client-side URL resolution
  // Support for Next.js deployment patterns
  const publicApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (publicApiUrl) {
    return publicApiUrl;
  }

  // Fallback to relative URLs for client-side calls
  // This works with Next.js reverse proxy and API routes
  return '/api/v2';
}

/**
 * Dynamic environment-based API URL resolver
 * Handles both internal Next.js API routes and external DreamFactory endpoints
 */
export function resolveApiUrl(endpoint: string, useExternal: boolean = false): string {
  if (useExternal) {
    // External DreamFactory API endpoint
    const externalBaseUrl = process.env.NEXT_PUBLIC_DREAMFACTORY_URL || 
                           process.env.DREAMFACTORY_URL || 
                           'http://localhost:80';
    return `${externalBaseUrl}/api/v2${endpoint}`;
  }

  // Internal Next.js API route
  const baseUrl = getBaseUrl();
  return endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
}

/**
 * Migrated DreamFactory API endpoint constants
 * Maintains compatibility with existing Angular service layer dependencies
 */
export const API_BASE_URL = '/api/v2';

export const API_ENDPOINTS = {
  // External service integrations
  GITHUB_REPO: 'https://api.github.com/repos',
  SUBSCRIPTION_DATA: 'https://updates.dreamfactory.com/check',
  CALENDLY: 'https://assets.calendly.com/assets/external/widget.js',

  // System endpoints
  SYSTEM: `${API_BASE_URL}/system`,
  ENVIRONMENT: `${API_BASE_URL}/system/environment`,
  
  // Authentication endpoints
  USER_SESSION: `${API_BASE_URL}/user/session`,
  ADMIN_SESSION: `${API_BASE_URL}/system/admin/session`,
  USER_PASSWORD: `${API_BASE_URL}/user/password`,
  ADMIN_PASSWORD: `${API_BASE_URL}/system/admin/password`,
  REGISTER: `${API_BASE_URL}/user/register`,
  
  // User management endpoints
  USER_PROFILE: `${API_BASE_URL}/user/profile`,
  ADMIN_PROFILE: `${API_BASE_URL}/system/admin/profile`,
  SYSTEM_ADMIN: `${API_BASE_URL}/system/admin`,
  SYSTEM_USER: `${API_BASE_URL}/system/user`,
  
  // Service management endpoints
  SYSTEM_SERVICE: `${API_BASE_URL}/system/service`,
  SERVICE_TYPE: `${API_BASE_URL}/system/service_type`,
  SERVICE_REPORT: `${API_BASE_URL}/system/service_report`,
  
  // Application endpoints
  APP: `${API_BASE_URL}/system/app`,
  API_DOCS: `${API_BASE_URL}/api_docs`,
  
  // Security and roles endpoints
  ROLES: `${API_BASE_URL}/system/role`,
  LIMITS: `${API_BASE_URL}/system/limit`,
  LIMIT_CACHE: `${API_BASE_URL}/system/limit_cache`,
  
  // System configuration endpoints
  SYSTEM_CORS: `${API_BASE_URL}/system/cors`,
  SYSTEM_CACHE: `${API_BASE_URL}/system/cache`,
  EMAIL_TEMPLATES: `${API_BASE_URL}/system/email_template`,
  LOOKUP_KEYS: `${API_BASE_URL}/system/lookup`,
  
  // Event and script endpoints
  SYSTEM_EVENT: `${API_BASE_URL}/system/event`,
  EVENT_SCRIPT: `${API_BASE_URL}/system/event_script`,
  SCRIPT_TYPE: `${API_BASE_URL}/system/script_type`,
  SCHEDULER: `${API_BASE_URL}/system/scheduler`,
  
  // File management endpoints
  FILES: `${API_BASE_URL}/files`,
  LOGS: `${API_BASE_URL}/logs`,
} as const;

/**
 * Type-safe endpoint keys for enhanced developer experience
 */
export type ApiEndpoint = keyof typeof API_ENDPOINTS;

/**
 * Enhanced endpoint configuration with caching and authentication metadata
 * Optimized for SWR/React Query integration
 */
export const ENDPOINT_CONFIG: Record<ApiEndpoint, EndpointConfig> = {
  // External endpoints - no auth required, no caching
  GITHUB_REPO: { url: API_ENDPOINTS.GITHUB_REPO, requiresAuth: false, cache: true, timeout: 10000 },
  SUBSCRIPTION_DATA: { url: API_ENDPOINTS.SUBSCRIPTION_DATA, requiresAuth: false, cache: true, timeout: 5000 },
  CALENDLY: { url: API_ENDPOINTS.CALENDLY, requiresAuth: false, cache: true, timeout: 10000 },
  
  // System endpoints - require auth, cache appropriately
  SYSTEM: { url: API_ENDPOINTS.SYSTEM, requiresAuth: true, cache: true, timeout: 5000 },
  ENVIRONMENT: { url: API_ENDPOINTS.ENVIRONMENT, requiresAuth: true, cache: true, timeout: 10000 },
  
  // Authentication endpoints - special handling
  USER_SESSION: { url: API_ENDPOINTS.USER_SESSION, requiresAuth: false, cache: false, timeout: 5000 },
  ADMIN_SESSION: { url: API_ENDPOINTS.ADMIN_SESSION, requiresAuth: false, cache: false, timeout: 5000 },
  USER_PASSWORD: { url: API_ENDPOINTS.USER_PASSWORD, method: 'POST', requiresAuth: false, cache: false, timeout: 5000 },
  ADMIN_PASSWORD: { url: API_ENDPOINTS.ADMIN_PASSWORD, method: 'POST', requiresAuth: false, cache: false, timeout: 5000 },
  REGISTER: { url: API_ENDPOINTS.REGISTER, method: 'POST', requiresAuth: false, cache: false, timeout: 5000 },
  
  // User management endpoints
  USER_PROFILE: { url: API_ENDPOINTS.USER_PROFILE, requiresAuth: true, cache: true, timeout: 5000 },
  ADMIN_PROFILE: { url: API_ENDPOINTS.ADMIN_PROFILE, requiresAuth: true, cache: true, timeout: 5000 },
  SYSTEM_ADMIN: { url: API_ENDPOINTS.SYSTEM_ADMIN, requiresAuth: true, cache: true, timeout: 5000 },
  SYSTEM_USER: { url: API_ENDPOINTS.SYSTEM_USER, requiresAuth: true, cache: true, timeout: 5000 },
  
  // Service management endpoints
  SYSTEM_SERVICE: { url: API_ENDPOINTS.SYSTEM_SERVICE, requiresAuth: true, cache: true, timeout: 10000 },
  SERVICE_TYPE: { url: API_ENDPOINTS.SERVICE_TYPE, requiresAuth: true, cache: true, timeout: 10000 },
  SERVICE_REPORT: { url: API_ENDPOINTS.SERVICE_REPORT, requiresAuth: true, cache: true, timeout: 15000 },
  
  // Application endpoints
  APP: { url: API_ENDPOINTS.APP, requiresAuth: true, cache: true, timeout: 5000 },
  API_DOCS: { url: API_ENDPOINTS.API_DOCS, requiresAuth: true, cache: true, timeout: 10000 },
  
  // Security and roles endpoints
  ROLES: { url: API_ENDPOINTS.ROLES, requiresAuth: true, cache: true, timeout: 5000 },
  LIMITS: { url: API_ENDPOINTS.LIMITS, requiresAuth: true, cache: true, timeout: 5000 },
  LIMIT_CACHE: { url: API_ENDPOINTS.LIMIT_CACHE, requiresAuth: true, cache: false, timeout: 5000 },
  
  // System configuration endpoints
  SYSTEM_CORS: { url: API_ENDPOINTS.SYSTEM_CORS, requiresAuth: true, cache: true, timeout: 5000 },
  SYSTEM_CACHE: { url: API_ENDPOINTS.SYSTEM_CACHE, requiresAuth: true, cache: false, timeout: 5000 },
  EMAIL_TEMPLATES: { url: API_ENDPOINTS.EMAIL_TEMPLATES, requiresAuth: true, cache: true, timeout: 5000 },
  LOOKUP_KEYS: { url: API_ENDPOINTS.LOOKUP_KEYS, requiresAuth: true, cache: true, timeout: 5000 },
  
  // Event and script endpoints
  SYSTEM_EVENT: { url: API_ENDPOINTS.SYSTEM_EVENT, requiresAuth: true, cache: true, timeout: 5000 },
  EVENT_SCRIPT: { url: API_ENDPOINTS.EVENT_SCRIPT, requiresAuth: true, cache: true, timeout: 5000 },
  SCRIPT_TYPE: { url: API_ENDPOINTS.SCRIPT_TYPE, requiresAuth: true, cache: true, timeout: 5000 },
  SCHEDULER: { url: API_ENDPOINTS.SCHEDULER, requiresAuth: true, cache: true, timeout: 5000 },
  
  // File management endpoints
  FILES: { url: API_ENDPOINTS.FILES, requiresAuth: true, cache: false, timeout: 30000 },
  LOGS: { url: API_ENDPOINTS.LOGS, requiresAuth: true, cache: false, timeout: 15000 },
};

/**
 * Get endpoint configuration with runtime URL resolution
 * Supports both client-side and server-side usage patterns
 */
export function getEndpointConfig(endpoint: ApiEndpoint, useExternal: boolean = false): EndpointConfig {
  const config = ENDPOINT_CONFIG[endpoint];
  return {
    ...config,
    url: resolveApiUrl(config.url.replace(API_BASE_URL, ''), useExternal),
  };
}

/**
 * Environment configuration for different deployment contexts
 */
export const API_CONFIG: ApiConfig = {
  baseUrl: getBaseUrl(),
  endpoints: API_ENDPOINTS,
  isServer: typeof window === 'undefined',
  version: 'v2',
};

/**
 * Default request configuration optimized for DreamFactory API patterns
 */
export const DEFAULT_REQUEST_CONFIG: RequestConfig = {
  timeout: 10000,
  retries: 3,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/**
 * SWR/React Query cache key generators for consistent caching
 */
export function generateCacheKey(endpoint: ApiEndpoint, params?: Record<string, any>): string[] {
  const baseKey = [endpoint];
  
  if (params) {
    // Sort params for consistent cache keys
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);
    
    baseKey.push(JSON.stringify(sortedParams));
  }
  
  return baseKey;
}

/**
 * Get cache configuration for SWR/React Query based on endpoint type
 */
export function getCacheConfig(endpoint: ApiEndpoint) {
  const config = ENDPOINT_CONFIG[endpoint];
  
  if (!config.cache) {
    return {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: true,
    };
  }
  
  // Different cache strategies based on endpoint type
  if (endpoint.includes('SESSION') || endpoint.includes('PASSWORD')) {
    return {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: false,
    };
  }
  
  if (endpoint.includes('SYSTEM') || endpoint.includes('CONFIG')) {
    return {
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      revalidateIfStale: true,
    };
  }
  
  // Default cache strategy for most endpoints
  return {
    refreshInterval: 60000, // 1 minute
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    revalidateIfStale: true,
  };
}

/**
 * Utility function to build complete API URLs with query parameters
 */
export function buildApiUrl(
  endpoint: ApiEndpoint, 
  pathParams?: Record<string, string | number>,
  queryParams?: Record<string, any>,
  useExternal: boolean = false
): string {
  let url = getEndpointConfig(endpoint, useExternal).url;
  
  // Replace path parameters
  if (pathParams) {
    Object.entries(pathParams).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  
  // Add query parameters
  if (queryParams && Object.keys(queryParams).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    url += `?${searchParams.toString()}`;
  }
  
  return url;
}

/**
 * Validate API configuration at runtime
 */
export function validateApiConfig(): boolean {
  try {
    const baseUrl = getBaseUrl();
    
    // Validate base URL format
    if (!baseUrl || (!baseUrl.startsWith('http') && !baseUrl.startsWith('/'))) {
      console.warn('API Configuration: Invalid base URL format:', baseUrl);
      return false;
    }
    
    // Validate all endpoint configurations
    for (const [key, config] of Object.entries(ENDPOINT_CONFIG)) {
      if (!config.url) {
        console.warn(`API Configuration: Missing URL for endpoint ${key}`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('API Configuration validation failed:', error);
    return false;
  }
}

// Export types for use throughout the application
export type {
  ApiConfig,
  RequestConfig,
  EndpointConfig,
  ApiEndpoint,
};

// Export all constants for backward compatibility
export {
  API_BASE_URL as BASE_URL,
  API_ENDPOINTS as URLS,
};