/**
 * Core API types defining HTTP request/response patterns, generic list responses,
 * pagination metadata, error handling structures, and authentication headers.
 * 
 * Provides foundation for SWR/React Query integration and Next.js API routes 
 * with DreamFactory backend compatibility. Supports TypeScript 5.8+ with 
 * enhanced React 19 compatibility and server component typing.
 * 
 * @fileoverview Core API type definitions for DreamFactory admin interface
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { z } from 'zod';

// ============================================================================
// HTTP Method and Status Types
// ============================================================================

/**
 * Standard HTTP methods supported by DreamFactory APIs
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * HTTP status code categories for error handling
 */
export type HttpStatusCode = 
  | 200 | 201 | 202 | 204  // Success
  | 400 | 401 | 403 | 404 | 409 | 422  // Client errors
  | 500 | 502 | 503 | 504;  // Server errors

// ============================================================================
// Generic API Response Structures
// ============================================================================

/**
 * Base response structure for all DreamFactory API responses
 * Compatible with existing backend response patterns
 */
export interface BaseApiResponse {
  /** Response timestamp in ISO 8601 format */
  timestamp?: string;
  /** Request correlation ID for debugging */
  request_id?: string;
}

/**
 * Standard success response for simple operations
 * Replaces Angular GenericSuccessResponse with enhanced typing
 */
export interface ApiSuccessResponse extends BaseApiResponse {
  success: true;
  message?: string;
}

/**
 * Enhanced error response structure with React Error Boundary integration
 * Provides comprehensive error information for client-side error handling
 */
export interface ApiErrorResponse extends BaseApiResponse {
  success: false;
  error: {
    /** Error code for programmatic handling */
    code: string;
    /** Human-readable error message */
    message: string;
    /** HTTP status code */
    status_code: HttpStatusCode;
    /** Additional error context - supports both string and structured formats */
    context?: string | {
      /** Field-specific errors for form validation */
      errors?: Record<string, string[]>;
      /** Resource-specific errors for bulk operations */
      resource?: ApiErrorResponse[];
      /** Additional metadata */
      [key: string]: any;
    };
    /** Stack trace (development only) */
    stack?: string;
  };
}

/**
 * Pagination metadata for list responses
 * Optimized for React Query infinite queries and virtual scrolling
 */
export interface PaginationMeta {
  /** Total number of items across all pages */
  count: number;
  /** Current page number (0-based) */
  offset: number;
  /** Items per page */
  limit: number;
  /** Whether there are more pages available */
  has_next?: boolean;
  /** Whether there are previous pages */
  has_previous?: boolean;
  /** Total number of pages */
  page_count?: number;
  /** Links for pagination navigation */
  links?: {
    first?: string;
    last?: string;
    next?: string;
    previous?: string;
  };
}

/**
 * Generic list response structure for paginated data
 * Enhanced with React Query compatibility and virtual scrolling support
 */
export interface ApiListResponse<T = any> extends BaseApiResponse {
  /** Array of resources */
  resource: T[];
  /** Pagination and filtering metadata */
  meta: PaginationMeta;
}

/**
 * Single resource response structure
 */
export interface ApiResourceResponse<T = any> extends BaseApiResponse {
  /** Single resource data */
  resource: T;
}

/**
 * Bulk operation response for create/update operations
 */
export interface ApiBulkResponse<T = any> extends BaseApiResponse {
  /** Array of created/updated resources with IDs */
  resource: Array<T & { id: number | string }>;
  /** Operation metadata */
  meta: PaginationMeta & {
    /** Number of successful operations */
    success_count: number;
    /** Number of failed operations */
    error_count: number;
  };
}

// ============================================================================
// Request Configuration and Parameters
// ============================================================================

/**
 * Key-value pair for additional request parameters and headers
 */
export interface KeyValuePair {
  key: string;
  value: any;
}

/**
 * Comprehensive request options for API calls
 * Enhanced with Next.js server component support and React Query integration
 */
export interface ApiRequestOptions {
  /** Show loading spinner (client-side only) */
  showSpinner?: boolean;
  
  /** Filtering parameters */
  filter?: string;
  
  /** Sorting parameters */
  sort?: string;
  
  /** Field selection for response optimization */
  fields?: string;
  
  /** Related resource inclusion */
  related?: string;
  
  /** Maximum number of items to return */
  limit?: number;
  
  /** Number of items to skip (pagination offset) */
  offset?: number;
  
  /** Include total count in response */
  includeCount?: boolean;
  
  /** Success notification message */
  snackbarSuccess?: string;
  
  /** Error notification message */
  snackbarError?: string;
  
  /** Request content type override */
  contentType?: string;
  
  /** Additional query parameters */
  additionalParams?: KeyValuePair[];
  
  /** Additional request headers */
  additionalHeaders?: KeyValuePair[];
  
  /** Include cache control headers */
  includeCacheControl?: boolean;
  
  /** Force refresh (bypass cache) */
  refresh?: boolean;
  
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Abort signal for request cancellation */
  signal?: AbortSignal;
  
  /** Next.js revalidation tags for ISR */
  tags?: string[];
  
  /** Next.js revalidation time for SSG */
  revalidate?: number | false;
}

/**
 * Authentication headers for DreamFactory API requests
 * Supports both session tokens and API keys with Next.js middleware integration
 */
export interface AuthHeaders {
  /** Session token for user authentication */
  'X-DreamFactory-Session-Token'?: string;
  
  /** API key for application authentication */
  'X-DreamFactory-API-Key'?: string;
  
  /** Authorization header for OAuth/JWT */
  'Authorization'?: string;
  
  /** CSRF token for additional security */
  'X-CSRF-Token'?: string;
}

/**
 * Standard request headers with authentication and content type
 */
export interface ApiHeaders extends AuthHeaders {
  /** Content type for request body */
  'Content-Type'?: string;
  
  /** Accept header for response format */
  'Accept'?: string;
  
  /** Cache control directives */
  'Cache-Control'?: string;
  
  /** Request correlation ID */
  'X-Request-ID'?: string;
  
  /** User agent override */
  'User-Agent'?: string;
  
  /** Additional custom headers */
  [key: string]: string | undefined;
}

// ============================================================================
// Request and Response Type Utilities
// ============================================================================

/**
 * Generic API request configuration
 * Optimized for fetch API and React Query mutations
 */
export interface ApiRequest<TData = any> {
  /** HTTP method */
  method: HttpMethod;
  
  /** Request URL (relative or absolute) */
  url: string;
  
  /** Request body data */
  data?: TData;
  
  /** Request headers */
  headers?: ApiHeaders;
  
  /** Request options */
  options?: ApiRequestOptions;
}

/**
 * Generic API response union type for type-safe error handling
 * Compatible with React Error Boundaries and SWR/React Query
 */
export type ApiResponse<T = any> = 
  | (ApiSuccessResponse & { data: T })
  | (ApiResourceResponse<T>)
  | (ApiListResponse<T>)
  | (ApiBulkResponse<T>)
  | ApiErrorResponse;

/**
 * Type guard to check if response is an error
 */
export function isApiError(response: ApiResponse): response is ApiErrorResponse {
  return 'error' in response || ('success' in response && response.success === false);
}

/**
 * Type guard to check if response is a success
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is Exclude<ApiResponse<T>, ApiErrorResponse> {
  return !isApiError(response);
}

/**
 * Type guard to check if response is a list response
 */
export function isApiListResponse<T>(response: ApiResponse<T>): response is ApiListResponse<T> {
  return 'resource' in response && Array.isArray(response.resource) && 'meta' in response;
}

// ============================================================================
// SWR and React Query Integration Types
// ============================================================================

/**
 * SWR configuration options for API endpoints
 * Optimized for DreamFactory API patterns and caching strategies
 */
export interface SwrOptions<T = any> {
  /** Cache key for the request */
  key: string | null;
  
  /** Fetcher function */
  fetcher?: (url: string) => Promise<T>;
  
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  
  /** Refresh on window focus */
  refreshOnFocus?: boolean;
  
  /** Refresh on network reconnect */
  refreshOnReconnect?: boolean;
  
  /** Dedupe requests with same key */
  dedupingInterval?: number;
  
  /** Error retry count */
  errorRetryCount?: number;
  
  /** Error retry interval */
  errorRetryInterval?: number;
  
  /** Suspend on error */
  suspense?: boolean;
  
  /** Revalidate on mount */
  revalidateOnMount?: boolean;
}

/**
 * React Query configuration for mutations
 * Optimized for DreamFactory CRUD operations with optimistic updates
 */
export interface MutationOptions<TData, TVariables, TError = ApiErrorResponse> {
  /** Mutation function */
  mutationFn: (variables: TVariables) => Promise<TData>;
  
  /** Optimistic update handler */
  onMutate?: (variables: TVariables) => Promise<any> | any;
  
  /** Success handler */
  onSuccess?: (data: TData, variables: TVariables, context: any) => Promise<any> | any;
  
  /** Error handler */
  onError?: (error: TError, variables: TVariables, context: any) => Promise<any> | any;
  
  /** Settlement handler (success or error) */
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: any) => Promise<any> | any;
  
  /** Retry configuration */
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean);
  
  /** Retry delay */
  retryDelay?: number | ((retryAttempt: number) => number);
}

// ============================================================================
// Zod Schema Validation Integration
// ============================================================================

/**
 * Zod schema for API error response validation
 * Provides runtime type checking for error responses
 */
export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    status_code: z.number(),
    context: z.union([
      z.string(),
      z.object({
        errors: z.record(z.array(z.string())).optional(),
        resource: z.array(z.any()).optional(),
      }).passthrough()
    ]).optional(),
    stack: z.string().optional(),
  }),
  timestamp: z.string().optional(),
  request_id: z.string().optional(),
});

/**
 * Zod schema for pagination metadata validation
 */
export const PaginationMetaSchema = z.object({
  count: z.number().int().min(0),
  offset: z.number().int().min(0),
  limit: z.number().int().min(1),
  has_next: z.boolean().optional(),
  has_previous: z.boolean().optional(),
  page_count: z.number().int().min(0).optional(),
  links: z.object({
    first: z.string().optional(),
    last: z.string().optional(),
    next: z.string().optional(),
    previous: z.string().optional(),
  }).optional(),
});

/**
 * Zod schema for list response validation
 */
export const ApiListResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    resource: z.array(itemSchema),
    meta: PaginationMetaSchema,
    timestamp: z.string().optional(),
    request_id: z.string().optional(),
  });

/**
 * Zod schema for single resource response validation
 */
export const ApiResourceResponseSchema = <T extends z.ZodTypeAny>(resourceSchema: T) =>
  z.object({
    resource: resourceSchema,
    timestamp: z.string().optional(),
    request_id: z.string().optional(),
  });

// ============================================================================
// Next.js Server Component Integration
// ============================================================================

/**
 * Server-side fetch options for Next.js API routes and server components
 * Supports ISR, SSG, and SSR patterns with proper caching
 */
export interface ServerFetchOptions extends Omit<ApiRequestOptions, 'showSpinner' | 'snackbarSuccess' | 'snackbarError'> {
  /** Next.js cache behavior */
  cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached';
  
  /** Incremental Static Regeneration interval */
  revalidate?: number | false;
  
  /** Cache tags for revalidation */
  tags?: string[];
  
  /** Server component context */
  context?: {
    /** Request cookies */
    cookies?: Record<string, string>;
    
    /** Request headers */
    headers?: Record<string, string>;
    
    /** Dynamic route parameters */
    params?: Record<string, string | string[]>;
    
    /** Search parameters */
    searchParams?: Record<string, string | string[]>;
  };
}

/**
 * API route handler result for Next.js API routes
 * Supports both success and error responses with proper HTTP status codes
 */
export interface ApiRouteResult<T = any> {
  /** Response data */
  data?: T;
  
  /** Error information */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  
  /** HTTP status code */
  status: HttpStatusCode;
  
  /** Response headers */
  headers?: Record<string, string>;
  
  /** Cookies to set */
  cookies?: Array<{
    name: string;
    value: string;
    options?: {
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: 'strict' | 'lax' | 'none';
      maxAge?: number;
      path?: string;
      domain?: string;
    };
  }>;
}

// ============================================================================
// DreamFactory Specific Types
// ============================================================================

/**
 * DreamFactory service endpoint configuration
 * Used for dynamic API endpoint generation and service management
 */
export interface DreamFactoryEndpoint {
  /** Service name */
  service: string;
  
  /** Resource path */
  resource?: string;
  
  /** Resource ID */
  id?: string | number;
  
  /** API version */
  version?: 'v1' | 'v2';
  
  /** System vs application endpoint */
  type?: 'system' | 'application';
}

/**
 * DreamFactory API URL builder utility type
 */
export interface DreamFactoryUrlBuilder {
  /** Build URL for system endpoints */
  system: (resource: string, id?: string | number) => string;
  
  /** Build URL for application endpoints */
  application: (service: string, resource?: string, id?: string | number) => string;
  
  /** Build URL for service management */
  service: (operation: 'list' | 'create' | 'update' | 'delete', id?: string | number) => string;
  
  /** Build URL for schema operations */
  schema: (service: string, table?: string, operation?: 'describe' | 'create' | 'update' | 'delete') => string;
}

// ============================================================================
// Legacy Compatibility Types
// ============================================================================

/**
 * Legacy compatibility for existing Angular code patterns
 * @deprecated Use ApiErrorResponse instead
 */
export interface GenericErrorResponse {
  error: {
    code: string;
    context: string | { error: Array<any>; resource: Array<GenericErrorResponse> };
    message: string;
    status_code: number;
  };
}

/**
 * Legacy compatibility for existing Angular code patterns
 * @deprecated Use ApiSuccessResponse instead
 */
export interface GenericSuccessResponse {
  success: boolean;
}

/**
 * Legacy compatibility for existing Angular code patterns
 * @deprecated Use ApiListResponse instead
 */
export interface GenericListResponse<T> {
  resource: Array<T>;
  meta: { count: number };
}

/**
 * Legacy compatibility for existing Angular code patterns
 * @deprecated Use ApiBulkResponse instead
 */
export type GenericCreateResponse = GenericListResponse<{ id: number }>;

/**
 * Legacy compatibility for existing Angular code patterns
 * @deprecated Use ApiResourceResponse instead
 */
export interface GenericUpdateResponse {
  id: number;
}

// ============================================================================
// Type Exports for Convenience
// ============================================================================

// Re-export Zod for validation
export { z } from 'zod';

// Export common type aliases
export type ApiError = ApiErrorResponse;
export type ApiSuccess<T = any> = Exclude<ApiResponse<T>, ApiErrorResponse>;
export type ListResponse<T> = ApiListResponse<T>;
export type ResourceResponse<T> = ApiResourceResponse<T>;
export type BulkResponse<T> = ApiBulkResponse<T>;

// Export utility types
export type ExtractResource<T> = T extends ApiListResponse<infer U> 
  ? U 
  : T extends ApiResourceResponse<infer U> 
    ? U 
    : T extends ApiBulkResponse<infer U> 
      ? U 
      : never;

export type ExtractMeta<T> = T extends ApiListResponse<any> 
  ? T['meta'] 
  : T extends ApiBulkResponse<any> 
    ? T['meta'] 
    : never;