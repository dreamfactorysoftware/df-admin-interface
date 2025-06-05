/**
 * MSW Utility Functions
 * 
 * Comprehensive utility functions for Mock Service Worker (MSW) that replicate
 * Angular interceptor behavior. Provides case transformation middleware,
 * authentication header validation, and request/response processing helpers
 * for consistent API contract compatibility during the React/Next.js migration.
 */

import { http, HttpResponse, type HttpHandler } from 'msw';
import type { RequestHandler } from 'msw';

// Constants for DreamFactory headers (replicated from Angular constants)
export const SESSION_TOKEN_HEADER = 'X-DreamFactory-Session-Token';
export const API_KEY_HEADER = 'X-DreamFactory-API-Key';
export const LICENSE_KEY_HEADER = 'X-DreamFactory-License-Key';

/**
 * Case Transformation Utilities
 * Replicates the behavior from src/app/shared/utilities/case.ts and case.interceptor.ts
 */

/**
 * Converts snake_case string to camelCase
 * @param str - String in snake_case format
 * @returns String in camelCase format
 */
export const snakeToCamelString = (str: string): string =>
  str.replace(/([-_]\w)/g, g => g[1].toUpperCase());

/**
 * Converts camelCase string to snake_case with special handling for SAML fields
 * @param str - String in camelCase format
 * @returns String in snake_case format
 */
export const camelToSnakeString = (str: string): string => {
  // Special cases for SAML fields (preserved from Angular implementation)
  if (str === 'idpSingleSignOnServiceUrl' || str === 'idp_singleSignOnService_url') {
    return 'idp_singleSignOnService_url';
  }
  if (str === 'idpEntityId' || str === 'idp_entityId') {
    return 'idp_entityId';
  }
  if (str === 'spNameIDFormat' || str === 'sp_nameIDFormat') {
    return 'sp_nameIDFormat';
  }
  if (str === 'spPrivateKey' || str === 'sp_privateKey') {
    return 'sp_privateKey';
  }
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1_$2').toLowerCase();
};

/**
 * Recursively converts object keys from snake_case to camelCase
 * @param obj - Object with snake_case keys
 * @returns Object with camelCase keys
 */
export function mapSnakeToCamel<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(item => mapSnakeToCamel(item)) as unknown as T;
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[snakeToCamelString(key)] = mapSnakeToCamel(
          (obj as Record<string, unknown>)[key]
        );
      }
    }
    return newObj as unknown as T;
  } else {
    return obj;
  }
}

/**
 * Recursively converts object keys from camelCase to snake_case
 * Preserves 'requestBody' field without transformation (from Angular implementation)
 * @param obj - Object with camelCase keys
 * @returns Object with snake_case keys
 */
export function mapCamelToSnake<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(item => mapCamelToSnake(item)) as unknown as T;
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (key === 'requestBody') {
          // Preserve requestBody without transformation (from Angular implementation)
          newObj[key] = (obj as Record<string, unknown>)[key];
        } else {
          newObj[camelToSnakeString(key)] = mapCamelToSnake(
            (obj as Record<string, unknown>)[key]
          );
        }
      }
    }
    return newObj as unknown as T;
  } else {
    return obj;
  }
}

/**
 * Authentication Header Utilities
 * Replicates the behavior from session-token.interceptor.ts
 */

/**
 * Validates DreamFactory API authentication headers
 * @param request - MSW request object
 * @returns Object containing validation status and extracted tokens
 */
export function validateAuthHeaders(request: Request) {
  const apiKey = request.headers.get(API_KEY_HEADER);
  const sessionToken = request.headers.get(SESSION_TOKEN_HEADER);
  const licenseKey = request.headers.get(LICENSE_KEY_HEADER);

  // Check for required API key
  const hasValidApiKey = Boolean(apiKey);
  
  // Session token is optional but when present should be valid format
  const hasSessionToken = Boolean(sessionToken);
  const isSessionTokenValid = !sessionToken || (typeof sessionToken === 'string' && sessionToken.length > 10);

  return {
    isValid: hasValidApiKey && isSessionTokenValid,
    hasApiKey: hasValidApiKey,
    hasSessionToken,
    isSessionTokenValid,
    apiKey,
    sessionToken,
    licenseKey,
    // Helper method to check if this is an authenticated request
    isAuthenticated: hasValidApiKey && hasSessionToken && isSessionTokenValid,
  };
}

/**
 * Creates authentication error responses for invalid headers
 * @param reason - Reason for authentication failure
 * @returns HttpResponse with 401 status and DreamFactory error format
 */
export function createAuthErrorResponse(reason: string) {
  return HttpResponse.json(
    {
      error: {
        code: 401,
        message: `Authentication failed: ${reason}`,
        status_code: 401,
        context: null,
      },
    },
    { status: 401 }
  );
}

/**
 * Request/Response Processing Utilities
 */

/**
 * Processes MSW request body and applies case transformation
 * Replicates the case.interceptor.ts request transformation logic
 * @param request - MSW request object
 * @returns Transformed request body
 */
export async function processRequestBody(request: Request) {
  // Skip transformation for FormData (like file uploads)
  const contentType = request.headers.get('Content-Type') || '';
  if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
    return null; // Let MSW handle FormData naturally
  }

  try {
    const body = await request.json();
    // Transform camelCase to snake_case for API compatibility
    return mapCamelToSnake(body);
  } catch {
    // If body is not JSON, return null
    return null;
  }
}

/**
 * Processes MSW response body and applies case transformation
 * Replicates the case.interceptor.ts response transformation logic
 * @param responseData - Response data to transform
 * @returns Transformed response data
 */
export function processResponseBody<T>(responseData: T): T {
  // Transform snake_case to camelCase for React component compatibility
  return mapSnakeToCamel(responseData);
}

/**
 * Creates a standardized JSON response with case transformation
 * @param data - Response data
 * @param options - Response options (status, headers, etc.)
 * @returns HttpResponse with transformed data
 */
export function createJsonResponse<T>(
  data: T,
  options: { status?: number; headers?: Record<string, string> } = {}
) {
  const transformedData = processResponseBody(data);
  
  return HttpResponse.json(transformedData, {
    status: options.status || 200,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * Query Parameter and Pagination Utilities
 */

/**
 * Extracts and parses query parameters from URL
 * @param url - Request URL
 * @returns Object with parsed query parameters
 */
export function extractQueryParams(url: string) {
  const urlObj = new URL(url);
  const params: Record<string, any> = {};

  urlObj.searchParams.forEach((value, key) => {
    // Handle common parameter transformations
    if (key === 'limit' || key === 'offset') {
      params[key] = parseInt(value, 10);
    } else if (key === 'include_count') {
      params[key] = value === 'true';
    } else if (key === 'filter' || key === 'fields' || key === 'order') {
      params[key] = value;
    } else {
      params[key] = value;
    }
  });

  return params;
}

/**
 * Creates paginated response metadata
 * @param totalCount - Total number of items
 * @param limit - Items per page
 * @param offset - Starting offset
 * @returns Pagination metadata object
 */
export function createPaginationMeta(totalCount: number, limit?: number, offset?: number) {
  const actualLimit = limit || totalCount;
  const actualOffset = offset || 0;
  
  return {
    count: Math.min(actualLimit, totalCount - actualOffset),
    limit: actualLimit,
    offset: actualOffset,
    total: totalCount,
    hasMore: (actualOffset + actualLimit) < totalCount,
  };
}

/**
 * Applies pagination to an array of data
 * @param data - Array of data to paginate
 * @param limit - Items per page
 * @param offset - Starting offset
 * @returns Paginated slice of data
 */
export function paginateData<T>(data: T[], limit?: number, offset?: number): T[] {
  const actualOffset = offset || 0;
  const actualLimit = limit || data.length;
  
  return data.slice(actualOffset, actualOffset + actualLimit);
}

/**
 * Applies filtering to data based on query parameters
 * Basic implementation for common DreamFactory filter patterns
 * @param data - Array of data to filter
 * @param filter - Filter string (simplified implementation)
 * @returns Filtered data
 */
export function applyFilter<T>(data: T[], filter?: string): T[] {
  if (!filter) return data;

  // Simple filter implementation - in real usage, this would be more sophisticated
  const lowerFilter = filter.toLowerCase();
  return data.filter(item => {
    if (typeof item === 'object' && item !== null) {
      return Object.values(item).some(value => 
        String(value).toLowerCase().includes(lowerFilter)
      );
    }
    return String(item).toLowerCase().includes(lowerFilter);
  });
}

/**
 * Applies sorting to data based on order parameter
 * @param data - Array of data to sort
 * @param order - Order string (e.g., "name ASC", "created_date DESC")
 * @returns Sorted data
 */
export function applySort<T>(data: T[], order?: string): T[] {
  if (!order) return data;

  const [field, direction = 'ASC'] = order.split(' ');
  const isDesc = direction.toUpperCase() === 'DESC';

  return [...data].sort((a, b) => {
    const aVal = (a as any)[field];
    const bVal = (b as any)[field];

    if (aVal < bVal) return isDesc ? 1 : -1;
    if (aVal > bVal) return isDesc ? -1 : 1;
    return 0;
  });
}

/**
 * MSW Middleware Utilities
 */

/**
 * Creates MSW middleware for case transformation
 * Replicates Angular case.interceptor.ts behavior
 */
export function createCaseTransformMiddleware() {
  return (handler: HttpHandler) => {
    return async (request: Request) => {
      // Only transform requests to /api endpoints
      if (!request.url.includes('/api')) {
        return handler(request);
      }

      // Clone request with transformed body
      let transformedRequest = request;
      if (request.method !== 'GET' && request.method !== 'DELETE') {
        const transformedBody = await processRequestBody(request);
        if (transformedBody !== null) {
          transformedRequest = new Request(request, {
            body: JSON.stringify(transformedBody),
          });
        }
      }

      // Process response
      const response = await handler(transformedRequest);
      
      // Transform response if it's JSON
      const contentType = response.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        try {
          const responseData = await response.json();
          return createJsonResponse(responseData, {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
          });
        } catch {
          // If response is not JSON, return as-is
          return response;
        }
      }

      return response;
    };
  };
}

/**
 * Creates MSW middleware for authentication validation
 * Replicates Angular session-token.interceptor.ts behavior
 */
export function createAuthMiddleware(options: { requireAuth?: boolean } = {}) {
  return (handler: HttpHandler) => {
    return async (request: Request) => {
      // Only validate auth for /api endpoints
      if (!request.url.includes('/api')) {
        return handler(request);
      }

      const authValidation = validateAuthHeaders(request);

      // If authentication is required and not valid, return 401
      if (options.requireAuth && !authValidation.isValid) {
        if (!authValidation.hasApiKey) {
          return createAuthErrorResponse('Missing API key');
        }
        if (!authValidation.isSessionTokenValid) {
          return createAuthErrorResponse('Invalid session token');
        }
      }

      // Add authentication context to request (if needed by handlers)
      const authenticatedRequest = new Request(request, {
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          'x-auth-context': JSON.stringify({
            isAuthenticated: authValidation.isAuthenticated,
            hasApiKey: authValidation.hasApiKey,
            hasSessionToken: authValidation.hasSessionToken,
          }),
        },
      });

      return handler(authenticatedRequest);
    };
  };
}

/**
 * Error Response Utilities
 * Replicates Angular error.interceptor.ts patterns
 */

/**
 * Creates standardized DreamFactory error response
 * @param statusCode - HTTP status code
 * @param message - Error message
 * @param context - Additional error context
 * @returns HttpResponse with DreamFactory error format
 */
export function createErrorResponse(
  statusCode: number,
  message: string,
  context: any = null
) {
  return HttpResponse.json(
    {
      error: {
        code: statusCode,
        message,
        status_code: statusCode,
        context,
      },
    },
    { status: statusCode }
  );
}

/**
 * Creates a 400 Bad Request error response
 */
export function createBadRequestError(message: string, context?: any) {
  return createErrorResponse(400, message, context);
}

/**
 * Creates a 401 Unauthorized error response
 */
export function createUnauthorizedError(message: string = 'Unauthorized access') {
  return createErrorResponse(401, message);
}

/**
 * Creates a 403 Forbidden error response
 */
export function createForbiddenError(message: string = 'Access denied') {
  return createErrorResponse(403, message);
}

/**
 * Creates a 404 Not Found error response
 */
export function createNotFoundError(message: string = 'Resource not found') {
  return createErrorResponse(404, message);
}

/**
 * Creates a 422 Unprocessable Entity error response (validation errors)
 */
export function createValidationError(message: string, validationErrors: any = null) {
  return createErrorResponse(422, message, validationErrors);
}

/**
 * Creates a 500 Internal Server Error response
 */
export function createServerError(message: string = 'Internal server error') {
  return createErrorResponse(500, message);
}

/**
 * URL and Path Utilities
 */

/**
 * Extracts service name from DreamFactory API path
 * @param path - API path (e.g., "/api/v2/mysql/_schema")
 * @returns Service name or null
 */
export function extractServiceName(path: string): string | null {
  const match = path.match(/^\/api\/v2\/([^\/]+)/);
  return match ? match[1] : null;
}

/**
 * Extracts resource path from DreamFactory API path
 * @param path - API path (e.g., "/api/v2/mysql/_schema/users")
 * @returns Resource path or null
 */
export function extractResourcePath(path: string): string | null {
  const match = path.match(/^\/api\/v2\/[^\/]+(.*)$/);
  return match ? match[1] : null;
}

/**
 * Checks if path is a system API endpoint
 * @param path - API path
 * @returns True if system API endpoint
 */
export function isSystemApiPath(path: string): boolean {
  return path.startsWith('/api/v2/system') || path.startsWith('/system/api/v2');
}

/**
 * Checks if path is a service API endpoint
 * @param path - API path
 * @returns True if service API endpoint
 */
export function isServiceApiPath(path: string): boolean {
  return path.startsWith('/api/v2/') && !isSystemApiPath(path);
}

/**
 * Development Utilities
 */

/**
 * Logs MSW request details for debugging
 * @param request - MSW request object
 * @param context - Additional context
 */
export function logRequest(request: Request, context?: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[MSW ${context || 'Request'}]`, {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
    });
  }
}

/**
 * Simulates network delay for realistic testing
 * @param delay - Delay in milliseconds (default: 100-500ms random)
 */
export function simulateNetworkDelay(delay?: number): Promise<void> {
  const actualDelay = delay || Math.random() * 400 + 100; // 100-500ms random delay
  return new Promise(resolve => setTimeout(resolve, actualDelay));
}

/**
 * Type definitions for MSW utilities
 */
export interface AuthContext {
  isAuthenticated: boolean;
  hasApiKey: boolean;
  hasSessionToken: boolean;
  apiKey?: string;
  sessionToken?: string;
  licenseKey?: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  include_count?: boolean;
}

export interface QueryParams extends PaginationParams {
  filter?: string;
  fields?: string;
  order?: string;
  [key: string]: any;
}

export interface DreamFactoryErrorResponse {
  error: {
    code: number;
    message: string;
    status_code: number;
    context: any;
  };
}

/**
 * Export all utilities for easy importing
 */
export default {
  // Case transformation
  snakeToCamelString,
  camelToSnakeString,
  mapSnakeToCamel,
  mapCamelToSnake,
  
  // Authentication
  validateAuthHeaders,
  createAuthErrorResponse,
  
  // Request/Response processing
  processRequestBody,
  processResponseBody,
  createJsonResponse,
  
  // Query and pagination
  extractQueryParams,
  createPaginationMeta,
  paginateData,
  applyFilter,
  applySort,
  
  // Middleware
  createCaseTransformMiddleware,
  createAuthMiddleware,
  
  // Error responses
  createErrorResponse,
  createBadRequestError,
  createUnauthorizedError,
  createForbiddenError,
  createNotFoundError,
  createValidationError,
  createServerError,
  
  // URL utilities
  extractServiceName,
  extractResourcePath,
  isSystemApiPath,
  isServiceApiPath,
  
  // Development utilities
  logRequest,
  simulateNetworkDelay,
};