/**
 * MSW Utility Functions
 * 
 * Comprehensive utility functions for Mock Service Worker operations including
 * case transformation middleware, authentication header validation, and request/response
 * processing helpers. Replicates Angular interceptor behavior in MSW middleware format.
 * 
 * This module provides:
 * - Case transformation to maintain API contract compatibility (camelCase ↔ snake_case)
 * - Authentication header processing for session management
 * - Request/response transformation utilities for consistent data handling
 * - Query parameter and pagination utilities for CRUD operations
 * - MSW response helpers for standardized API responses
 */

import { HttpResponse } from 'msw';

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

/**
 * DreamFactory API headers for authentication and authorization
 */
export const API_KEY_HEADER = 'X-DreamFactory-API-Key';
export const SESSION_TOKEN_HEADER = 'X-DreamFactory-Session-Token';
export const LICENSE_KEY_HEADER = 'X-DreamFactory-License-Key';

/**
 * Content type headers for API responses
 */
export const CONTENT_TYPE_JSON = 'application/json';
export const CONTENT_TYPE_FORM_DATA = 'multipart/form-data';
export const CONTENT_TYPE_BLOB = 'application/octet-stream';

/**
 * Authentication header validation result
 */
export interface AuthValidationResult {
  isValid: boolean;
  apiKey?: string;
  sessionToken?: string;
  userId?: string;
  userType?: 'user' | 'admin';
  errors: string[];
}

/**
 * Query parameter extraction result
 */
export interface QueryParamsResult {
  limit?: number;
  offset?: number;
  filter?: string;
  order?: string;
  include?: string;
  fields?: string;
  related?: string;
  include_count?: boolean;
  [key: string]: unknown;
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  count?: number;
  limit: number;
  offset: number;
  total?: number;
}

/**
 * Standard DreamFactory API response structure
 */
export interface DreamFactoryResponse<T = unknown> {
  resource?: T[];
  count?: number;
  meta?: PaginationMeta;
}

// ============================================================================
// CASE TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Converts snake_case string to camelCase
 * Handles special cases for DreamFactory SAML and OAuth configurations
 * 
 * @param str - String to transform
 * @returns Transformed camelCase string
 */
export const snakeToCamelString = (str: string): string => {
  // Handle special SAML/OAuth cases that maintain specific formatting
  const specialCases: Record<string, string> = {
    'idp_singleSignOnService_url': 'idpSingleSignOnServiceUrl',
    'idp_entityId': 'idpEntityId',
    'sp_nameIDFormat': 'spNameIDFormat',
    'sp_privateKey': 'spPrivateKey',
  };

  if (specialCases[str]) {
    return specialCases[str];
  }

  return str.replace(/([-_]\w)/g, g => g[1].toUpperCase());
};

/**
 * Converts camelCase string to snake_case
 * Handles special cases for DreamFactory SAML and OAuth configurations
 * 
 * @param str - String to transform
 * @returns Transformed snake_case string
 */
export const camelToSnakeString = (str: string): string => {
  // Handle special SAML/OAuth cases that maintain specific formatting
  const specialCases: Record<string, string> = {
    'idpSingleSignOnServiceUrl': 'idp_singleSignOnService_url',
    'idp_singleSignOnService_url': 'idp_singleSignOnService_url',
    'idpEntityId': 'idp_entityId',
    'idp_entityId': 'idp_entityId',
    'spNameIDFormat': 'sp_nameIDFormat',
    'sp_nameIDFormat': 'sp_nameIDFormat',
    'spPrivateKey': 'sp_privateKey',
    'sp_privateKey': 'sp_privateKey',
  };

  if (specialCases[str]) {
    return specialCases[str];
  }

  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1_$2').toLowerCase();
};

/**
 * Recursively transforms object keys from snake_case to camelCase
 * Preserves arrays and handles nested objects
 * 
 * @param obj - Object to transform
 * @returns Transformed object with camelCase keys
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
  }
  return obj;
}

/**
 * Recursively transforms object keys from camelCase to snake_case
 * Preserves arrays and handles nested objects
 * Special handling for requestBody field which should not be transformed
 * 
 * @param obj - Object to transform
 * @returns Transformed object with snake_case keys
 */
export function mapCamelToSnake<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(item => mapCamelToSnake(item)) as unknown as T;
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Special case: requestBody should not be transformed (OpenAPI spec field)
        if (key === 'requestBody') {
          newObj[key] = (obj as Record<string, unknown>)[key];
        } else {
          newObj[camelToSnakeString(key)] = mapCamelToSnake(
            (obj as Record<string, unknown>)[key]
          );
        }
      }
    }
    return newObj as unknown as T;
  }
  return obj;
}

/**
 * MSW middleware for case transformation that replicates Angular caseInterceptor behavior
 * Transforms request bodies from camelCase to snake_case and response bodies from snake_case to camelCase
 * Only applies to JSON API endpoints, skips FormData requests
 * 
 * @param request - MSW request object
 * @param requestBody - Parsed request body
 * @returns Object with transformed request body and response transformer function
 */
export function applyCaseTransformation(
  request: Request,
  requestBody: unknown
): {
  transformedRequestBody: unknown;
  transformResponse: (responseBody: unknown) => unknown;
} {
  // Only apply transformation to /api endpoints and non-FormData requests
  const shouldTransform = request.url.includes('/api') && 
    !request.headers.get('content-type')?.includes('multipart/form-data');

  if (!shouldTransform) {
    return {
      transformedRequestBody: requestBody,
      transformResponse: (body: unknown) => body,
    };
  }

  // Transform request body from camelCase to snake_case
  const transformedRequestBody = mapCamelToSnake(requestBody);

  // Return response transformer function
  const transformResponse = (responseBody: unknown) => {
    // Check if response should be transformed (JSON content)
    if (responseBody && typeof responseBody === 'object') {
      return mapSnakeToCamel(responseBody);
    }
    return responseBody;
  };

  return {
    transformedRequestBody,
    transformResponse,
  };
}

// ============================================================================
// AUTHENTICATION UTILITIES
// ============================================================================

/**
 * Validates authentication headers in MSW request
 * Checks for required API key and optional session token
 * 
 * @param request - MSW request object
 * @returns Authentication validation result
 */
export function validateAuthHeaders(request: Request): AuthValidationResult {
  const apiKey = request.headers.get(API_KEY_HEADER);
  const sessionToken = request.headers.get(SESSION_TOKEN_HEADER);
  const errors: string[] = [];

  // API key is always required for DreamFactory API calls
  if (!apiKey) {
    errors.push('Missing API key header');
  }

  // Mock API key validation (in real scenario, this would validate against environment)
  const validApiKey = 'mock-api-key-for-testing';
  if (apiKey && apiKey !== validApiKey) {
    errors.push('Invalid API key');
  }

  let userId: string | undefined;
  let userType: 'user' | 'admin' | undefined;

  // Session token validation (optional for some endpoints)
  if (sessionToken) {
    try {
      // Mock JWT token parsing (in real scenario, this would validate JWT signature)
      const tokenPayload = JSON.parse(atob(sessionToken.split('.')[1] || ''));
      userId = tokenPayload.sub;
      userType = tokenPayload.role?.includes('admin') ? 'admin' : 'user';
    } catch {
      errors.push('Invalid session token format');
    }
  }

  return {
    isValid: errors.length === 0,
    apiKey,
    sessionToken,
    userId,
    userType,
    errors,
  };
}

/**
 * Generates mock session token for testing authentication flows
 * Creates a simple JWT-like structure for development/testing
 * 
 * @param userId - User ID to include in token
 * @param userType - Type of user (user or admin)
 * @param expirationMinutes - Token expiration in minutes (default: 60)
 * @returns Mock JWT token string
 */
export function generateMockSessionToken(
  userId: string,
  userType: 'user' | 'admin' = 'user',
  expirationMinutes: number = 60
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    iat: now,
    exp: now + (expirationMinutes * 60),
    role: userType === 'admin' ? ['admin', 'user'] : ['user'],
    type: userType,
  };

  // Create mock JWT (not cryptographically signed, for testing only)
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const mockSignature = btoa(`mock-signature-${userId}-${now}`);

  return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
}

// ============================================================================
// REQUEST/RESPONSE PROCESSING UTILITIES
// ============================================================================

/**
 * Processes and parses request body based on content type
 * Handles JSON, FormData, and plain text requests
 * 
 * @param request - MSW request object
 * @returns Promise resolving to parsed request body
 */
export async function processRequestBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      return await request.json();
    } else if (contentType.includes('multipart/form-data')) {
      return await request.formData();
    } else if (contentType.includes('text/')) {
      return await request.text();
    } else {
      // Default to JSON parsing for API endpoints
      const text = await request.text();
      return text ? JSON.parse(text) : null;
    }
  } catch (error) {
    // If parsing fails, return null rather than throwing
    console.warn('Failed to parse request body:', error);
    return null;
  }
}

/**
 * Creates standardized JSON response for MSW handlers
 * Applies case transformation and includes proper headers
 * 
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @param headers - Additional headers
 * @returns MSW HttpResponse
 */
export function createJsonResponse(
  data: unknown,
  status: number = 200,
  headers: Record<string, string> = {}
): HttpResponse {
  return HttpResponse.json(data, {
    status,
    headers: {
      'Content-Type': CONTENT_TYPE_JSON,
      ...headers,
    },
  });
}

/**
 * Creates DreamFactory-formatted list response with pagination metadata
 * 
 * @param resource - Array of resource items
 * @param pagination - Pagination metadata
 * @param status - HTTP status code
 * @returns MSW HttpResponse with DreamFactory list format
 */
export function createListResponse<T>(
  resource: T[],
  pagination: PaginationMeta,
  status: number = 200
): HttpResponse {
  const response: DreamFactoryResponse<T> = {
    resource,
    count: resource.length,
    meta: pagination,
  };

  // Include total count if available
  if (pagination.total !== undefined) {
    response.count = pagination.total;
  }

  return createJsonResponse(response, status);
}

/**
 * Creates standardized error response
 * 
 * @param message - Error message
 * @param status - HTTP status code
 * @param code - Error code
 * @param context - Additional error context
 * @returns MSW HttpResponse with error format
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  code?: string,
  context?: Record<string, unknown>
): HttpResponse {
  const errorResponse = {
    error: {
      code: code || status.toString(),
      message,
      status_code: status,
      ...(context && { context }),
    },
  };

  return createJsonResponse(errorResponse, status);
}

/**
 * Creates authentication error response (401)
 */
export function createAuthErrorResponse(message: string = 'Authentication required'): HttpResponse {
  return createErrorResponse(message, 401, 'AUTHENTICATION_REQUIRED');
}

/**
 * Creates unauthorized error response (401)
 */
export function createUnauthorizedError(message: string = 'Invalid credentials'): HttpResponse {
  return createErrorResponse(message, 401, 'UNAUTHORIZED');
}

/**
 * Creates forbidden error response (403)
 */
export function createForbiddenError(message: string = 'Access forbidden'): HttpResponse {
  return createErrorResponse(message, 403, 'FORBIDDEN');
}

/**
 * Creates validation error response (422)
 */
export function createValidationError(
  message: string = 'Validation failed',
  fieldErrors?: Record<string, string[]>
): HttpResponse {
  const context = fieldErrors ? { field_errors: fieldErrors } : undefined;
  return createErrorResponse(message, 422, 'VALIDATION_ERROR', context);
}

/**
 * Creates not found error response (404)
 */
export function createNotFoundError(message: string = 'Resource not found'): HttpResponse {
  return createErrorResponse(message, 404, 'NOT_FOUND');
}

/**
 * Creates blob response for file downloads
 */
export function createBlobResponse(
  data: string | Uint8Array,
  contentType: string = CONTENT_TYPE_BLOB,
  filename?: string
): HttpResponse {
  const headers: Record<string, string> = {
    'Content-Type': contentType,
  };

  if (filename) {
    headers['Content-Disposition'] = `attachment; filename="${filename}"`;
  }

  return new HttpResponse(data, {
    status: 200,
    headers,
  });
}

// ============================================================================
// QUERY PARAMETER & PAGINATION UTILITIES
// ============================================================================

/**
 * Extracts and parses query parameters from MSW request URL
 * Handles common DreamFactory API parameters like limit, offset, filter, order
 * 
 * @param request - MSW request object
 * @returns Parsed query parameters
 */
export function extractQueryParams(request: Request): QueryParamsResult {
  const url = new URL(request.url);
  const params: QueryParamsResult = {};

  // Parse standard pagination parameters
  const limit = url.searchParams.get('limit');
  if (limit) {
    params.limit = parseInt(limit, 10);
  }

  const offset = url.searchParams.get('offset');
  if (offset) {
    params.offset = parseInt(offset, 10);
  }

  // Parse boolean parameters
  const includeCount = url.searchParams.get('include_count');
  if (includeCount) {
    params.include_count = includeCount === 'true' || includeCount === '1';
  }

  // Parse string parameters
  const stringParams = ['filter', 'order', 'include', 'fields', 'related'];
  stringParams.forEach(param => {
    const value = url.searchParams.get(param);
    if (value) {
      params[param] = value;
    }
  });

  // Parse all other parameters as strings
  url.searchParams.forEach((value, key) => {
    if (!params.hasOwnProperty(key)) {
      params[key] = value;
    }
  });

  return params;
}

/**
 * Applies pagination to an array of data
 * Returns sliced array and pagination metadata
 * 
 * @param data - Array of data to paginate
 * @param limit - Number of items per page (default: 25)
 * @param offset - Starting offset (default: 0)
 * @returns Object with paginated data and metadata
 */
export function applyPagination<T>(
  data: T[],
  limit: number = 25,
  offset: number = 0
): {
  data: T[];
  meta: PaginationMeta;
} {
  const start = Math.max(0, offset);
  const end = start + Math.max(1, limit);
  const paginatedData = data.slice(start, end);

  return {
    data: paginatedData,
    meta: {
      count: paginatedData.length,
      limit,
      offset: start,
      total: data.length,
    },
  };
}

/**
 * Applies filtering to an array of data based on filter string
 * Supports simple field:value filtering and text search
 * 
 * @param data - Array of data to filter
 * @param filter - Filter string (e.g., "name=test" or "searchterm")
 * @returns Filtered array
 */
export function applyFilter<T extends Record<string, unknown>>(
  data: T[],
  filter?: string
): T[] {
  if (!filter) return data;

  // Check if filter is field:value format
  const fieldValueMatch = filter.match(/^(\w+)[:=](.+)$/);
  if (fieldValueMatch) {
    const [, field, value] = fieldValueMatch;
    return data.filter(item => {
      const fieldValue = String(item[field] || '').toLowerCase();
      return fieldValue.includes(value.toLowerCase());
    });
  }

  // Apply general text search across all string fields
  const searchTerm = filter.toLowerCase();
  return data.filter(item => {
    return Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchTerm)
    );
  });
}

/**
 * Applies sorting to an array of data based on order string
 * Supports ascending and descending order (e.g., "name", "-created_at")
 * 
 * @param data - Array of data to sort
 * @param order - Sort order string
 * @returns Sorted array
 */
export function applySort<T extends Record<string, unknown>>(
  data: T[],
  order?: string
): T[] {
  if (!order) return data;

  // Parse order string: "-field" for descending, "field" for ascending
  const isDescending = order.startsWith('-');
  const field = isDescending ? order.slice(1) : order;

  return [...data].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    // Compare values
    let comparison = 0;
    if (aValue < bValue) comparison = -1;
    else if (aValue > bValue) comparison = 1;

    return isDescending ? -comparison : comparison;
  });
}

// ============================================================================
// UTILITY HELPERS
// ============================================================================

/**
 * Simulates network delay for more realistic testing
 * 
 * @param ms - Delay in milliseconds (default: 100)
 * @returns Promise that resolves after delay
 */
export function simulateNetworkDelay(ms: number = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Logs MSW request details for debugging
 * 
 * @param request - MSW request object
 * @param additional - Additional data to log
 */
export function logRequest(request: Request, additional?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[MSW] ${request.method} ${request.url}`, additional);
  }
}

/**
 * Extracts ID parameter from URL path
 * Handles both single IDs and comma-separated lists
 * 
 * @param url - Request URL
 * @param pathPattern - Path pattern to match (e.g., "/api/v2/system/user/:id")
 * @returns Extracted ID(s)
 */
export function extractIdFromPath(url: string, pathPattern: string): string | string[] | null {
  // Simple ID extraction from URL
  const urlPath = new URL(url).pathname;
  const pathSegments = urlPath.split('/');
  const lastSegment = pathSegments[pathSegments.length - 1];

  // Check if last segment looks like an ID or comma-separated IDs
  if (lastSegment && lastSegment !== '') {
    // Handle comma-separated IDs for bulk operations
    if (lastSegment.includes(',')) {
      return lastSegment.split(',').map(id => id.trim());
    }
    return lastSegment;
  }

  return null;
}

/**
 * Validates required fields in request body
 * 
 * @param body - Request body object
 * @param requiredFields - Array of required field names
 * @returns Validation result with missing fields
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter(field => 
    body[field] === undefined || body[field] === null || body[field] === ''
  );

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Converts FormData to plain object for easier processing
 * 
 * @param formData - FormData object from request
 * @returns Plain object representation
 */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  
  formData.forEach((value, key) => {
    // Handle multiple values for same key
    if (obj[key] !== undefined) {
      if (Array.isArray(obj[key])) {
        (obj[key] as unknown[]).push(value);
      } else {
        obj[key] = [obj[key], value];
      }
    } else {
      obj[key] = value;
    }
  });

  return obj;
}

/**
 * Generates deterministic mock data based on seed
 * Useful for consistent test data generation
 * 
 * @param seed - Seed string for deterministic generation
 * @param template - Template object to populate
 * @returns Generated mock data
 */
export function generateMockData<T extends Record<string, unknown>>(
  seed: string,
  template: T
): T {
  // Simple hash function for deterministic generation
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  const result = { ...template };
  
  // Use hash to generate consistent values
  Object.keys(result).forEach((key, index) => {
    const value = result[key];
    if (typeof value === 'string' && value.includes('{')) {
      // Replace placeholder patterns
      result[key] = value.replace(/\{(\w+)\}/g, (match, placeholder) => {
        const placeholderHash = Math.abs(hash + index);
        switch (placeholder) {
          case 'id':
            return (placeholderHash % 1000 + 1).toString();
          case 'name':
            return `test-${placeholderHash % 100}`;
          case 'email':
            return `user${placeholderHash % 100}@example.com`;
          default:
            return match;
        }
      });
    }
  });

  return result;
}