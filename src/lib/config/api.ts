/**
 * API endpoint configuration utility for DreamFactory Admin Interface
 * 
 * Migrates Angular URL constants and BASE_URL to Next.js-compatible API client configuration.
 * Provides type-safe endpoint definitions, base URL management, and environment-specific 
 * API routing for both internal DreamFactory APIs and external service integrations.
 * 
 * Supports both client-side fetch calls and server-side API route handlers with proper
 * Next.js deployment patterns including edge functions and serverless environments.
 */

import { env, getDreamFactoryConfig, getServerConfig, envUtils } from './env';

// Type definitions for API endpoint configuration
interface ApiEndpoint {
  readonly path: string;
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly requiresAuth?: boolean;
  readonly timeout?: number;
}

interface ApiConfiguration {
  readonly baseUrl: string;
  readonly basePath: string;
  readonly timeout: number;
  readonly retryAttempts: number;
  readonly retryDelay: number;
}

// Core DreamFactory API endpoint definitions
// Migrated from Angular URLS constant with Next.js compatibility
export const DREAMFACTORY_ENDPOINTS = {
  // System API endpoints (/system/api/v2)
  SYSTEM: {
    // Service management endpoints
    SERVICES: {
      LIST: { path: '/system/api/v2/service', method: 'GET' } as ApiEndpoint,
      CREATE: { path: '/system/api/v2/service', method: 'POST' } as ApiEndpoint,
      UPDATE: { path: '/system/api/v2/service/{id}', method: 'PUT' } as ApiEndpoint,
      DELETE: { path: '/system/api/v2/service/{id}', method: 'DELETE' } as ApiEndpoint,
      GET_BY_ID: { path: '/system/api/v2/service/{id}', method: 'GET' } as ApiEndpoint,
    },
    
    // User and session management
    USER: {
      SESSION: { path: '/system/api/v2/user/session', method: 'POST' } as ApiEndpoint,
      LOGOUT: { path: '/system/api/v2/user/session', method: 'DELETE' } as ApiEndpoint,
      PROFILE: { path: '/system/api/v2/user/profile', method: 'GET' } as ApiEndpoint,
      PASSWORD: { path: '/system/api/v2/user/password', method: 'POST' } as ApiEndpoint,
    },
    
    // Admin management endpoints
    ADMIN: {
      LIST: { path: '/system/api/v2/admin', method: 'GET' } as ApiEndpoint,
      CREATE: { path: '/system/api/v2/admin', method: 'POST' } as ApiEndpoint,
      UPDATE: { path: '/system/api/v2/admin/{id}', method: 'PUT' } as ApiEndpoint,
      DELETE: { path: '/system/api/v2/admin/{id}', method: 'DELETE' } as ApiEndpoint,
    },
    
    // Role and permission management
    ROLE: {
      LIST: { path: '/system/api/v2/role', method: 'GET' } as ApiEndpoint,
      CREATE: { path: '/system/api/v2/role', method: 'POST' } as ApiEndpoint,
      UPDATE: { path: '/system/api/v2/role/{id}', method: 'PUT' } as ApiEndpoint,
      DELETE: { path: '/system/api/v2/role/{id}', method: 'DELETE' } as ApiEndpoint,
    },
    
    // Application management
    APP: {
      LIST: { path: '/system/api/v2/app', method: 'GET' } as ApiEndpoint,
      CREATE: { path: '/system/api/v2/app', method: 'POST' } as ApiEndpoint,
      UPDATE: { path: '/system/api/v2/app/{id}', method: 'PUT' } as ApiEndpoint,
      DELETE: { path: '/system/api/v2/app/{id}', method: 'DELETE' } as ApiEndpoint,
    },
    
    // System configuration
    CONFIG: {
      SYSTEM: { path: '/system/api/v2/config', method: 'GET' } as ApiEndpoint,
      EMAIL_TEMPLATE: { path: '/system/api/v2/email_template', method: 'GET' } as ApiEndpoint,
      CORS: { path: '/system/api/v2/cors', method: 'GET' } as ApiEndpoint,
      CACHE: { path: '/system/api/v2/cache', method: 'GET' } as ApiEndpoint,
    },
    
    // Script and event management
    EVENT_SCRIPT: {
      LIST: { path: '/system/api/v2/event_script', method: 'GET' } as ApiEndpoint,
      CREATE: { path: '/system/api/v2/event_script', method: 'POST' } as ApiEndpoint,
      UPDATE: { path: '/system/api/v2/event_script/{name}', method: 'PUT' } as ApiEndpoint,
      DELETE: { path: '/system/api/v2/event_script/{name}', method: 'DELETE' } as ApiEndpoint,
    },
    
    // File service management
    FILE: {
      LIST: { path: '/system/api/v2/file', method: 'GET' } as ApiEndpoint,
      UPLOAD: { path: '/system/api/v2/file', method: 'POST' } as ApiEndpoint,
      DELETE: { path: '/system/api/v2/file/{path}', method: 'DELETE' } as ApiEndpoint,
    },
    
    // Scheduler management
    SCHEDULER: {
      LIST: { path: '/system/api/v2/scheduler', method: 'GET' } as ApiEndpoint,
      CREATE: { path: '/system/api/v2/scheduler', method: 'POST' } as ApiEndpoint,
      UPDATE: { path: '/system/api/v2/scheduler/{id}', method: 'PUT' } as ApiEndpoint,
      DELETE: { path: '/system/api/v2/scheduler/{id}', method: 'DELETE' } as ApiEndpoint,
    },
  },
  
  // Database API endpoints (/api/v2)
  DATABASE: {
    // Schema discovery endpoints
    SCHEMA: {
      LIST: { path: '/api/v2/{serviceName}/_schema', method: 'GET' } as ApiEndpoint,
      TABLE: { path: '/api/v2/{serviceName}/_schema/{tableName}', method: 'GET' } as ApiEndpoint,
      FIELD: { path: '/api/v2/{serviceName}/_schema/{tableName}/{fieldName}', method: 'GET' } as ApiEndpoint,
      PROCEDURE: { path: '/api/v2/{serviceName}/_proc', method: 'GET' } as ApiEndpoint,
      FUNCTION: { path: '/api/v2/{serviceName}/_func', method: 'GET' } as ApiEndpoint,
    },
    
    // Table management endpoints
    TABLE: {
      LIST: { path: '/api/v2/{serviceName}/_table', method: 'GET' } as ApiEndpoint,
      CREATE: { path: '/api/v2/{serviceName}/_schema/{tableName}', method: 'POST' } as ApiEndpoint,
      UPDATE: { path: '/api/v2/{serviceName}/_schema/{tableName}', method: 'PUT' } as ApiEndpoint,
      DELETE: { path: '/api/v2/{serviceName}/_schema/{tableName}', method: 'DELETE' } as ApiEndpoint,
      DESCRIBE: { path: '/api/v2/{serviceName}/_table/{tableName}', method: 'GET' } as ApiEndpoint,
    },
    
    // Field management endpoints
    FIELD: {
      CREATE: { path: '/api/v2/{serviceName}/_schema/{tableName}/{fieldName}', method: 'POST' } as ApiEndpoint,
      UPDATE: { path: '/api/v2/{serviceName}/_schema/{tableName}/{fieldName}', method: 'PUT' } as ApiEndpoint,
      DELETE: { path: '/api/v2/{serviceName}/_schema/{tableName}/{fieldName}', method: 'DELETE' } as ApiEndpoint,
    },
    
    // Relationship management
    RELATIONSHIP: {
      LIST: { path: '/api/v2/{serviceName}/_schema/{tableName}/_related', method: 'GET' } as ApiEndpoint,
      CREATE: { path: '/api/v2/{serviceName}/_schema/{tableName}/_related', method: 'POST' } as ApiEndpoint,
      DELETE: { path: '/api/v2/{serviceName}/_schema/{tableName}/_related/{relationName}', method: 'DELETE' } as ApiEndpoint,
    },
    
    // Data access endpoints (generated dynamically)
    DATA: {
      GET_RECORDS: { path: '/api/v2/{serviceName}/{tableName}', method: 'GET' } as ApiEndpoint,
      CREATE_RECORDS: { path: '/api/v2/{serviceName}/{tableName}', method: 'POST' } as ApiEndpoint,
      UPDATE_RECORDS: { path: '/api/v2/{serviceName}/{tableName}', method: 'PUT' } as ApiEndpoint,
      PATCH_RECORDS: { path: '/api/v2/{serviceName}/{tableName}', method: 'PATCH' } as ApiEndpoint,
      DELETE_RECORDS: { path: '/api/v2/{serviceName}/{tableName}', method: 'DELETE' } as ApiEndpoint,
      GET_BY_ID: { path: '/api/v2/{serviceName}/{tableName}/{id}', method: 'GET' } as ApiEndpoint,
    },
  },
  
  // Documentation and API testing endpoints
  DOCS: {
    SWAGGER: { path: '/api/v2/_doc/{serviceName}', method: 'GET' } as ApiEndpoint,
    OPENAPI: { path: '/api/v2/_openapi/{serviceName}', method: 'GET' } as ApiEndpoint,
  },
} as const;

// Next.js API route endpoints (internal to the application)
export const NEXTJS_API_ROUTES = {
  // Server-side API preview endpoints
  PREVIEW: {
    SCHEMA: { path: '/api/preview/schema/{serviceName}', method: 'GET' } as ApiEndpoint,
    OPENAPI: { path: '/api/preview/openapi/{serviceName}', method: 'GET' } as ApiEndpoint,
    TEST_CONNECTION: { path: '/api/preview/test-connection', method: 'POST' } as ApiEndpoint,
  },
  
  // Authentication endpoints handled by Next.js middleware
  AUTH: {
    LOGIN: { path: '/api/auth/login', method: 'POST' } as ApiEndpoint,
    LOGOUT: { path: '/api/auth/logout', method: 'POST' } as ApiEndpoint,
    REFRESH: { path: '/api/auth/refresh', method: 'POST' } as ApiEndpoint,
    VERIFY: { path: '/api/auth/verify', method: 'GET' } as ApiEndpoint,
  },
  
  // Health check and system status
  HEALTH: {
    STATUS: { path: '/api/health', method: 'GET' } as ApiEndpoint,
    READY: { path: '/api/ready', method: 'GET' } as ApiEndpoint,
  },
} as const;

/**
 * Get API configuration based on environment
 * Supports both client-side and server-side contexts with proper Next.js deployment patterns
 */
export function getApiConfiguration(): ApiConfiguration {
  const dreamFactoryConfig = getDreamFactoryConfig();
  
  // Determine base URL based on runtime context
  let baseUrl: string;
  
  if (envUtils.isServer) {
    // Server-side context: use internal URLs when available
    try {
      const serverConfig = getServerConfig();
      baseUrl = serverConfig.internalApiUrl || dreamFactoryConfig.baseUrl;
    } catch {
      // Fallback to client config if server config unavailable
      baseUrl = dreamFactoryConfig.baseUrl;
    }
  } else {
    // Client-side context: use public API URL
    baseUrl = dreamFactoryConfig.baseUrl;
  }
  
  return {
    baseUrl,
    basePath: dreamFactoryConfig.basePath,
    timeout: env.NODE_ENV === 'production' ? 30000 : 10000, // 30s prod, 10s dev
    retryAttempts: 3,
    retryDelay: 1000, // 1 second base delay for exponential backoff
  };
}

/**
 * Build complete URL for an API endpoint with parameter substitution
 * Supports both DreamFactory and Next.js API routes with proper URL construction
 * 
 * @param endpoint - The API endpoint configuration
 * @param params - URL parameters for substitution (e.g., {id: '123'})
 * @param queryParams - Query string parameters
 * @param baseUrl - Optional override for base URL
 */
export function buildApiUrl(
  endpoint: ApiEndpoint,
  params: Record<string, string | number> = {},
  queryParams: Record<string, string | number | boolean> = {},
  baseUrl?: string
): string {
  const config = getApiConfiguration();
  const finalBaseUrl = baseUrl || config.baseUrl;
  
  // Substitute path parameters
  let path = endpoint.path;
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`{${key}}`, String(value));
  }
  
  // Ensure path starts with basePath for DreamFactory endpoints
  if (path.startsWith('/api/v2') || path.startsWith('/system/api/v2')) {
    path = `${config.basePath}${path}`;
  }
  
  // Build complete URL
  const url = new URL(path, finalBaseUrl);
  
  // Add query parameters
  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }
  
  return url.toString();
}

/**
 * Build URL for Next.js API routes (internal application endpoints)
 * Handles client-side and server-side contexts appropriately
 */
export function buildNextjsApiUrl(
  endpoint: ApiEndpoint,
  params: Record<string, string | number> = {},
  queryParams: Record<string, string | number | boolean> = {}
): string {
  // For Next.js API routes, use relative URLs on client and absolute on server
  const baseUrl = envUtils.isClient ? '' : `http://localhost:${process.env.PORT || 3000}`;
  
  let path = endpoint.path;
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`{${key}}`, String(value));
  }
  
  if (baseUrl) {
    const url = new URL(path, baseUrl);
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  } else {
    // Client-side: use relative URL with query params
    const urlSearchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        urlSearchParams.set(key, String(value));
      }
    }
    const queryString = urlSearchParams.toString();
    return queryString ? `${path}?${queryString}` : path;
  }
}

/**
 * Get endpoint configuration by path lookup
 * Useful for middleware and dynamic API handling
 */
export function getEndpointByPath(path: string): ApiEndpoint | null {
  // Flatten all endpoints for lookup
  const allEndpoints: ApiEndpoint[] = [];
  
  function collectEndpoints(obj: any) {
    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object') {
        if ('path' in value && typeof value.path === 'string') {
          allEndpoints.push(value as ApiEndpoint);
        } else {
          collectEndpoints(value);
        }
      }
    }
  }
  
  collectEndpoints(DREAMFACTORY_ENDPOINTS);
  collectEndpoints(NEXTJS_API_ROUTES);
  
  return allEndpoints.find(endpoint => endpoint.path === path) || null;
}

/**
 * Generate DreamFactory API headers with authentication
 * Integrates with environment configuration for API keys
 */
export function getDreamFactoryHeaders(
  apiKey?: string,
  sessionToken?: string,
  contentType: string = 'application/json'
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Accept': 'application/json',
  };
  
  // Add API key if provided or available from environment
  const finalApiKey = apiKey || getDreamFactoryConfig().adminApiKey;
  if (finalApiKey) {
    headers['X-DreamFactory-API-Key'] = finalApiKey;
  }
  
  // Add session token for authenticated requests
  if (sessionToken) {
    headers['X-DreamFactory-Session-Token'] = sessionToken;
  }
  
  return headers;
}

/**
 * Environment-specific API configuration
 * Provides different configurations for development, staging, and production
 */
export const environmentSpecificConfig = envUtils.getEnvSpecificConfig({
  development: {
    enableDebugHeaders: true,
    timeout: 5000, // Shorter timeout for dev
    retryAttempts: 1, // Fewer retries for faster feedback
    logRequests: true,
  },
  staging: {
    enableDebugHeaders: true,
    timeout: 15000,
    retryAttempts: 2,
    logRequests: true,
  },
  production: {
    enableDebugHeaders: false,
    timeout: 30000,
    retryAttempts: 3,
    logRequests: false,
  },
});

/**
 * API URL validation utilities
 * Ensures proper URL construction and parameter validation
 */
export const apiUrlValidation = {
  /**
   * Validate that all required parameters are provided for an endpoint
   */
  validateParameters(endpoint: ApiEndpoint, params: Record<string, string | number>): boolean {
    const paramPattern = /{([^}]+)}/g;
    const requiredParams = [];
    let match;
    
    while ((match = paramPattern.exec(endpoint.path)) !== null) {
      requiredParams.push(match[1]);
    }
    
    return requiredParams.every(param => param in params && params[param] !== undefined);
  },
  
  /**
   * Get list of required parameters for an endpoint
   */
  getRequiredParameters(endpoint: ApiEndpoint): string[] {
    const paramPattern = /{([^}]+)}/g;
    const requiredParams = [];
    let match;
    
    while ((match = paramPattern.exec(endpoint.path)) !== null) {
      requiredParams.push(match[1]);
    }
    
    return requiredParams;
  },
  
  /**
   * Validate URL format and accessibility
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Legacy Angular endpoint mapping for migration compatibility
 * Maintains existing endpoint structure while providing modern interface
 */
export const LEGACY_ENDPOINT_MAPPING = {
  // Map old Angular service URLs to new endpoint configurations
  'system/service': DREAMFACTORY_ENDPOINTS.SYSTEM.SERVICES.LIST,
  'system/admin': DREAMFACTORY_ENDPOINTS.SYSTEM.ADMIN.LIST,
  'system/user/session': DREAMFACTORY_ENDPOINTS.SYSTEM.USER.SESSION,
  'system/role': DREAMFACTORY_ENDPOINTS.SYSTEM.ROLE.LIST,
  'system/app': DREAMFACTORY_ENDPOINTS.SYSTEM.APP.LIST,
  'system/config': DREAMFACTORY_ENDPOINTS.SYSTEM.CONFIG.SYSTEM,
  'system/event_script': DREAMFACTORY_ENDPOINTS.SYSTEM.EVENT_SCRIPT.LIST,
  'system/scheduler': DREAMFACTORY_ENDPOINTS.SYSTEM.SCHEDULER.LIST,
} as const;

/**
 * Get legacy endpoint configuration for backward compatibility
 * Helps with gradual migration from Angular patterns
 */
export function getLegacyEndpoint(legacyPath: string): ApiEndpoint | null {
  return LEGACY_ENDPOINT_MAPPING[legacyPath as keyof typeof LEGACY_ENDPOINT_MAPPING] || null;
}

// Export main configuration objects for easy importing
export { DREAMFACTORY_ENDPOINTS as ENDPOINTS, NEXTJS_API_ROUTES as API_ROUTES };

// Default export for convenience
export default {
  endpoints: DREAMFACTORY_ENDPOINTS,
  apiRoutes: NEXTJS_API_ROUTES,
  buildApiUrl,
  buildNextjsApiUrl,
  getApiConfiguration,
  getDreamFactoryHeaders,
  environmentSpecificConfig,
  validation: apiUrlValidation,
};