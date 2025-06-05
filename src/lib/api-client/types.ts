/**
 * TypeScript type definitions for API client library including request configuration,
 * response types, middleware interfaces, and authentication types.
 * 
 * This module provides comprehensive type safety for all API client operations,
 * ensuring proper TypeScript integration throughout the React/Next.js application
 * while maintaining compatibility with DreamFactory API patterns.
 */

// =============================================================================
// CORE TYPES AND INTERFACES
// =============================================================================

/**
 * Standard HTTP methods supported by the API client
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Content types supported for request bodies
 */
export type ContentType = 
  | 'application/json'
  | 'application/x-www-form-urlencoded'
  | 'multipart/form-data'
  | 'text/plain'
  | 'application/octet-stream';

/**
 * Cache control strategies for request optimization
 */
export type CacheStrategy = 
  | 'no-cache'
  | 'no-store'
  | 'max-age'
  | 'must-revalidate'
  | 'private'
  | 'public';

// =============================================================================
// REQUEST CONFIGURATION TYPES
// =============================================================================

/**
 * Key-value pair interface for additional parameters and headers
 */
export interface KeyValuePair {
  key: string;
  value: string | number | boolean;
}

/**
 * Pagination configuration for list requests
 */
export interface PaginationConfig {
  /** Number of items to return (default: 25) */
  limit?: number;
  /** Number of items to skip (default: 0) */
  offset?: number;
  /** Include total count in response metadata */
  includeCount?: boolean;
}

/**
 * Filtering configuration for data queries
 */
export interface FilterConfig {
  /** SQL-style filter expression */
  filter?: string;
  /** Comma-separated list of fields to include */
  fields?: string;
  /** Comma-separated list of related resources to include */
  related?: string;
  /** Comma-separated list of fields to sort by */
  sort?: string;
}

/**
 * Loading and notification configuration
 */
export interface UIConfig {
  /** Show loading spinner during request */
  showSpinner?: boolean;
  /** Success message to display in snackbar */
  snackbarSuccess?: string;
  /** Error message to display in snackbar */
  snackbarError?: string;
  /** Suppress all notifications */
  suppressNotifications?: boolean;
}

/**
 * Cache control configuration
 */
export interface CacheConfig {
  /** Include cache control headers */
  includeCacheControl?: boolean;
  /** Force refresh, bypassing cache */
  refresh?: boolean;
  /** Cache strategy to apply */
  strategy?: CacheStrategy;
  /** Cache time-to-live in seconds */
  ttl?: number;
}

/**
 * Comprehensive request configuration interface
 * Extends the original RequestOptions with React/Next.js patterns
 */
export interface RequestConfig extends PaginationConfig, FilterConfig, UIConfig, CacheConfig {
  /** HTTP method for the request */
  method?: HttpMethod;
  /** Content type for request body */
  contentType?: ContentType;
  /** Additional query parameters */
  additionalParams?: KeyValuePair[];
  /** Additional HTTP headers */
  additionalHeaders?: KeyValuePair[];
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts on failure */
  retryAttempts?: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay?: number;
  /** AbortController signal for request cancellation */
  signal?: AbortSignal;
}

/**
 * SWR-specific configuration options
 */
export interface SWRConfig {
  /** Revalidate on window focus */
  revalidateOnFocus?: boolean;
  /** Revalidate on network reconnect */
  revalidateOnReconnect?: boolean;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Deduplicate requests with same key */
  dedupingInterval?: number;
  /** Error retry count */
  errorRetryCount?: number;
  /** Keep previous data when key changes */
  keepPreviousData?: boolean;
}

/**
 * React Query specific configuration options
 */
export interface ReactQueryConfig {
  /** Time in milliseconds that the data is considered fresh */
  staleTime?: number;
  /** Time in milliseconds that unused/inactive cache data remains in memory */
  cacheTime?: number;
  /** Enable/disable the query */
  enabled?: boolean;
  /** Retry failed requests */
  retry?: boolean | number | ((failureCount: number, error: unknown) => boolean);
  /** Retry delay function */
  retryDelay?: (retryAttempt: number) => number;
  /** Refetch interval in milliseconds */
  refetchInterval?: number;
  /** Select specific data from query result */
  select?: (data: any) => any;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * Standard success response structure
 */
export interface SuccessResponse {
  success: boolean;
}

/**
 * Error context can be string or complex object
 */
export type ErrorContext = 
  | string 
  | { 
      error: Array<any>; 
      resource: Array<ErrorResponse>; 
    };

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  error: {
    code: string;
    context: ErrorContext;
    message: string;
    status_code: number;
  };
}

/**
 * Pagination metadata
 */
export interface ResponseMeta {
  count: number;
  limit?: number;
  offset?: number;
  total?: number;
}

/**
 * Generic list response with pagination metadata
 */
export interface ListResponse<T> {
  resource: Array<T>;
  meta: ResponseMeta;
}

/**
 * Create operation response
 */
export interface CreateResponse {
  id: number;
  success?: boolean;
}

/**
 * Update operation response
 */
export interface UpdateResponse {
  id: number;
  success?: boolean;
}

/**
 * Delete operation response
 */
export interface DeleteResponse {
  success: boolean;
  id?: number;
}

/**
 * Bulk operation response
 */
export interface BulkResponse<T> {
  created?: T[];
  updated?: T[];
  deleted?: number[];
  errors?: ErrorResponse[];
}

// =============================================================================
// AUTHENTICATION TYPES
// =============================================================================

/**
 * Authentication token structure
 */
export interface AuthToken {
  /** JWT session token */
  sessionToken: string;
  /** Token expiration timestamp */
  expiresAt: number;
  /** Refresh token for automatic renewal */
  refreshToken?: string;
  /** Token type (Bearer, etc.) */
  tokenType?: string;
}

/**
 * API key authentication structure
 */
export interface ApiKey {
  /** API key value */
  key: string;
  /** API key name/identifier */
  name?: string;
  /** Key permissions */
  permissions?: string[];
}

/**
 * Session data structure
 */
export interface SessionData {
  /** User ID */
  userId: number;
  /** Username */
  username: string;
  /** User email */
  email?: string;
  /** User roles */
  roles?: string[];
  /** Session metadata */
  metadata?: Record<string, any>;
  /** Last activity timestamp */
  lastActivity?: number;
}

/**
 * Authentication headers for API requests
 */
export interface AuthHeaders {
  'X-DreamFactory-Session-Token'?: string;
  'X-DreamFactory-API-Key'?: string;
  'X-DreamFactory-License-Key'?: string;
  'Authorization'?: string;
}

/**
 * Complete authentication context
 */
export interface AuthContext {
  /** Current authentication token */
  token?: AuthToken;
  /** API key if using API key auth */
  apiKey?: ApiKey;
  /** Current session data */
  session?: SessionData;
  /** Authentication status */
  isAuthenticated: boolean;
  /** Authentication in progress */
  isAuthenticating: boolean;
  /** Last authentication error */
  error?: string;
}

// =============================================================================
// MIDDLEWARE INTERFACES
// =============================================================================

/**
 * Middleware context passed through the request pipeline
 */
export interface MiddlewareContext {
  /** Request configuration */
  config: RequestConfig;
  /** Authentication context */
  auth: AuthContext;
  /** Request metadata */
  metadata: Record<string, any>;
  /** Start time for performance tracking */
  startTime: number;
}

/**
 * Request middleware function signature
 */
export interface RequestMiddleware {
  (
    url: string,
    config: RequestConfig,
    context: MiddlewareContext
  ): Promise<{ url: string; config: RequestConfig; context: MiddlewareContext }> | 
     { url: string; config: RequestConfig; context: MiddlewareContext };
}

/**
 * Response middleware function signature
 */
export interface ResponseMiddleware {
  (
    response: Response,
    context: MiddlewareContext
  ): Promise<Response> | Response;
}

/**
 * Error middleware function signature
 */
export interface ErrorMiddleware {
  (
    error: Error,
    context: MiddlewareContext
  ): Promise<Error | void> | Error | void;
}

/**
 * Complete middleware stack configuration
 */
export interface MiddlewareStack {
  /** Request middleware functions */
  request: RequestMiddleware[];
  /** Response middleware functions */
  response: ResponseMiddleware[];
  /** Error middleware functions */
  error: ErrorMiddleware[];
}

// =============================================================================
// FILE OPERATION TYPES
// =============================================================================

/**
 * File upload progress information
 */
export interface FileUploadProgress {
  /** Bytes uploaded */
  loaded: number;
  /** Total bytes to upload */
  total: number;
  /** Upload percentage (0-100) */
  percentage: number;
  /** Upload speed in bytes/second */
  rate?: number;
  /** Estimated time remaining in seconds */
  timeRemaining?: number;
}

/**
 * File metadata information
 */
export interface FileMetadata {
  /** File name */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  type: string;
  /** Last modified timestamp */
  lastModified?: number;
  /** File path */
  path?: string;
  /** File permissions */
  permissions?: string;
  /** File hash/checksum */
  hash?: string;
}

/**
 * File upload configuration
 */
export interface FileUploadConfig {
  /** Allow multiple file uploads */
  multiple?: boolean;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Accepted file types */
  accept?: string[];
  /** Upload chunk size for large files */
  chunkSize?: number;
  /** Progress callback function */
  onProgress?: (progress: FileUploadProgress) => void;
  /** Success callback function */
  onSuccess?: (response: any) => void;
  /** Error callback function */
  onError?: (error: Error) => void;
}

/**
 * File download configuration
 */
export interface FileDownloadConfig {
  /** Download as attachment */
  asAttachment?: boolean;
  /** Custom filename for download */
  filename?: string;
  /** Progress callback function */
  onProgress?: (progress: FileUploadProgress) => void;
}

/**
 * Directory listing item
 */
export interface DirectoryItem {
  /** Item name */
  name: string;
  /** Item type (file or directory) */
  type: 'file' | 'directory';
  /** Item size in bytes (files only) */
  size?: number;
  /** Last modified timestamp */
  lastModified?: number;
  /** Item permissions */
  permissions?: string;
  /** Full path to item */
  path: string;
}

/**
 * Directory listing response
 */
export interface DirectoryListing {
  /** Current directory path */
  path: string;
  /** Directory items */
  items: DirectoryItem[];
  /** Total items count */
  totalCount: number;
  /** Parent directory path */
  parentPath?: string;
}

// =============================================================================
// SPECIALIZED API CLIENT TYPES
// =============================================================================

/**
 * Database connection test result
 */
export interface ConnectionTestResult {
  /** Connection successful */
  success: boolean;
  /** Connection time in milliseconds */
  connectionTime?: number;
  /** Error message if failed */
  error?: string;
  /** Database version information */
  version?: string;
  /** Additional connection metadata */
  metadata?: Record<string, any>;
}

/**
 * Schema discovery result
 */
export interface SchemaDiscoveryResult {
  /** Database tables */
  tables: Array<{
    name: string;
    type: string;
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
      default?: any;
    }>;
  }>;
  /** Discovery metadata */
  metadata: {
    tableCount: number;
    discoveryTime: number;
  };
}

/**
 * API endpoint generation result
 */
export interface EndpointGenerationResult {
  /** Generated endpoints */
  endpoints: Array<{
    path: string;
    method: HttpMethod;
    description: string;
    parameters?: Array<{
      name: string;
      type: string;
      required: boolean;
    }>;
  }>;
  /** OpenAPI specification */
  openApiSpec?: object;
  /** Generation metadata */
  metadata: {
    endpointCount: number;
    generationTime: number;
  };
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Extract the resource type from a ListResponse
 */
export type ExtractResourceType<T> = T extends ListResponse<infer U> ? U : never;

/**
 * Make all properties of a type optional
 */
export type PartialConfig<T> = {
  [P in keyof T]?: T[P];
};

/**
 * Combine multiple configuration interfaces
 */
export type CombinedConfig<T extends Record<string, any>[]> = T extends readonly [
  infer First,
  ...infer Rest
]
  ? First & CombinedConfig<Rest>
  : {};

/**
 * API client error types
 */
export type ApiClientError = 
  | 'NetworkError'
  | 'TimeoutError'
  | 'AuthenticationError'
  | 'AuthorizationError'
  | 'ValidationError'
  | 'ServerError'
  | 'UnknownError';

/**
 * Request context for debugging and monitoring
 */
export interface RequestContext {
  /** Request ID for tracing */
  requestId: string;
  /** Request timestamp */
  timestamp: number;
  /** Request duration in milliseconds */
  duration?: number;
  /** Request retry count */
  retryCount: number;
  /** Request source (component, hook, etc.) */
  source?: string;
}

// =============================================================================
// EXPORT AGGREGATION
// =============================================================================

/**
 * Complete API client configuration combining all config interfaces
 */
export interface ApiClientConfig extends 
  RequestConfig, 
  SWRConfig, 
  ReactQueryConfig, 
  FileUploadConfig {
  /** Base URL for API requests */
  baseUrl: string;
  /** Default authentication headers */
  defaultHeaders?: AuthHeaders;
  /** Global middleware stack */
  middleware?: Partial<MiddlewareStack>;
  /** Default request timeout */
  defaultTimeout?: number;
  /** Enable development mode features */
  developmentMode?: boolean;
}

/**
 * Re-export commonly used types for convenience
 */
export type {
  // Core types
  HttpMethod,
  ContentType,
  CacheStrategy,
  
  // Configuration types
  RequestConfig,
  PaginationConfig,
  FilterConfig,
  UIConfig,
  CacheConfig,
  
  // Response types
  SuccessResponse,
  ErrorResponse,
  ListResponse,
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
  
  // Authentication types
  AuthToken,
  AuthContext,
  AuthHeaders,
  
  // Middleware types
  MiddlewareContext,
  RequestMiddleware,
  ResponseMiddleware,
  ErrorMiddleware,
  
  // File operation types
  FileMetadata,
  FileUploadConfig,
  FileDownloadConfig,
  DirectoryListing,
};