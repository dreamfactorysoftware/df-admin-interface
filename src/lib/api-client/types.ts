/**
 * Comprehensive TypeScript type definitions for API client library
 * 
 * This module provides complete type safety for all API client operations including:
 * - Request configuration with pagination, filtering, sorting, and custom options
 * - Response type definitions for all API interactions
 * - Middleware interfaces for request/response transformation and authentication
 * - Authentication types for JWT tokens, session management, and headers
 * - Error handling types for comprehensive error recovery workflows
 * - File operation types for upload, download, progress tracking, and metadata
 * 
 * Supports React 19/Next.js 15.1 patterns with server-side rendering,
 * concurrent features, and enhanced performance characteristics.
 * 
 * @fileoverview API client type definitions for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

// Import authentication types for session and token management
import type {
  UserSession,
  LoginCredentials,
  LoginResponse,
  AuthError,
  JWTPayload,
  MiddlewareAuthContext,
  MiddlewareAuthResult,
} from '@/types/auth';

// Import comprehensive error handling types
import type {
  AppError,
  NetworkError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ServerError,
  ClientError,
  SystemError,
  ErrorContext,
  RetryConfig,
  CircuitBreakerConfig,
  RecoveryAction,
  UserFriendlyErrorMessage,
} from '@/types/error';

// Import generic HTTP types for compatibility
import type {
  KeyValuePair,
  RequestOptions as LegacyRequestOptions,
} from '@/types/generic-http';

// ============================================================================
// Core API Client Configuration Types
// ============================================================================

/**
 * Primary API client configuration interface
 * Supports both client-side and server-side operation contexts
 */
export interface ApiClientConfig {
  /** Base URL for API requests */
  baseUrl: string;
  /** DreamFactory API key for authentication */
  apiKey: string;
  /** Default timeout for requests in milliseconds */
  timeout: number;
  /** Whether to include credentials in cross-origin requests */
  withCredentials: boolean;
  /** Retry configuration for failed requests */
  retryConfig: RetryConfig;
  /** Circuit breaker configuration for preventing cascade failures */
  circuitBreakerConfig: CircuitBreakerConfig;
  /** Request/response interceptor configurations */
  interceptors: InterceptorConfig[];
  /** Server-side specific configuration */
  serverSide?: ServerSideConfig;
  /** Debug mode for development */
  debug?: boolean;
}

/**
 * Server-side specific configuration for Next.js SSR/ISR contexts
 */
export interface ServerSideConfig {
  /** Enable server-side request processing */
  enabled: boolean;
  /** Cookie name for session token extraction */
  sessionCookieName: string;
  /** Next.js revalidation interval for ISR */
  revalidateInterval: number;
  /** Custom headers for server-side requests */
  serverHeaders: Record<string, string>;
}

/**
 * Request interceptor configuration for middleware pipeline
 */
export interface InterceptorConfig {
  /** Unique identifier for the interceptor */
  id: string;
  /** Interceptor type classification */
  type: 'request' | 'response' | 'error';
  /** Execution priority (lower numbers execute first) */
  priority: number;
  /** Whether interceptor is enabled */
  enabled: boolean;
  /** Interceptor implementation function */
  handler: InterceptorHandler;
}

/**
 * Generic interceptor handler function type
 */
export type InterceptorHandler = 
  | RequestInterceptor
  | ResponseInterceptor
  | ErrorInterceptor;

// ============================================================================
// Request Configuration and Options Types
// ============================================================================

/**
 * Comprehensive request configuration interface
 * Extends native RequestInit with DreamFactory-specific options
 */
export interface ApiRequestConfig extends Omit<RequestInit, 'body'> {
  /** Request URL (relative to baseUrl) */
  url?: string;
  /** HTTP method override */
  method?: HttpMethod;
  /** Request parameters for URL query string */
  params?: RequestParams;
  /** Request body data (automatically serialized) */
  data?: any;
  /** Custom headers for this request */
  headers?: Record<string, string>;
  /** Request timeout override in milliseconds */
  timeout?: number;
  /** Authentication configuration */
  auth?: AuthConfig;
  /** Retry configuration override */
  retry?: Partial<RetryConfig>;
  /** Caching configuration */
  cache?: CacheConfig;
  /** Progress tracking configuration */
  progress?: ProgressConfig;
  /** Additional request metadata */
  metadata?: RequestMetadata;
  /** Abort signal for request cancellation */
  signal?: AbortSignal;
}

/**
 * HTTP methods supported by the API client
 */
export type HttpMethod = 
  | 'GET' 
  | 'POST' 
  | 'PUT' 
  | 'PATCH' 
  | 'DELETE' 
  | 'HEAD' 
  | 'OPTIONS';

/**
 * Request parameters interface with DreamFactory query options
 */
export interface RequestParams {
  /** Pagination parameters */
  limit?: number;
  offset?: number;
  /** Filtering parameters */
  filter?: string;
  /** Sorting parameters */
  sort?: string;
  /** Field selection */
  fields?: string;
  /** Related resource inclusion */
  related?: string;
  /** Include count in response */
  includeCount?: boolean;
  /** Include schema information */
  includeSchema?: boolean;
  /** Custom query parameters */
  [key: string]: any;
}

/**
 * Authentication configuration for requests
 */
export interface AuthConfig {
  /** Session token for authenticated requests */
  sessionToken?: string;
  /** API key override */
  apiKey?: string;
  /** Custom authentication headers */
  headers?: Record<string, string>;
  /** Whether to skip authentication for this request */
  skipAuth?: boolean;
}

/**
 * Caching configuration for request optimization
 */
export interface CacheConfig {
  /** Cache key override */
  key?: string;
  /** Cache TTL in milliseconds */
  ttl?: number;
  /** Whether to force fresh data */
  fresh?: boolean;
  /** Whether to use stale data while revalidating */
  staleWhileRevalidate?: boolean;
  /** Cache tags for invalidation */
  tags?: string[];
}

/**
 * Progress tracking configuration for file operations
 */
export interface ProgressConfig {
  /** Whether to track upload/download progress */
  enabled: boolean;
  /** Progress callback function */
  onProgress?: (progress: ProgressEvent) => void;
  /** Progress update interval in milliseconds */
  interval?: number;
}

/**
 * Request metadata for debugging and monitoring
 */
export interface RequestMetadata {
  /** Request correlation ID */
  correlationId?: string;
  /** Feature context */
  feature?: string;
  /** Component context */
  component?: string;
  /** User action that triggered the request */
  userAction?: string;
  /** Custom metadata */
  [key: string]: any;
}

// ============================================================================
// Response Types and Interfaces
// ============================================================================

/**
 * Standard API response wrapper interface
 * Follows DreamFactory response format conventions
 */
export interface ApiResponse<T = any> {
  /** Response data payload */
  data: T;
  /** Response metadata */
  meta?: ResponseMeta;
  /** Response status information */
  status: ResponseStatus;
  /** Response headers */
  headers: Record<string, string>;
  /** Request configuration that generated this response */
  config: ApiRequestConfig;
}

/**
 * Response metadata interface
 */
export interface ResponseMeta {
  /** Total count of available records */
  count?: number;
  /** Pagination information */
  pagination?: PaginationMeta;
  /** Response timing information */
  timing?: TimingMeta;
  /** Cache information */
  cache?: CacheMeta;
  /** Additional metadata */
  [key: string]: any;
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  /** Current page offset */
  offset: number;
  /** Page size limit */
  limit: number;
  /** Total number of records */
  total: number;
  /** Whether there are more pages available */
  hasMore: boolean;
  /** Next page offset */
  nextOffset?: number;
  /** Previous page offset */
  prevOffset?: number;
}

/**
 * Timing metadata for performance monitoring
 */
export interface TimingMeta {
  /** Request start timestamp */
  requestStart: number;
  /** Response received timestamp */
  responseEnd: number;
  /** Total request duration in milliseconds */
  duration: number;
  /** Server processing time */
  serverTime?: number;
}

/**
 * Cache metadata for cache-aware responses
 */
export interface CacheMeta {
  /** Whether response was served from cache */
  hit: boolean;
  /** Cache key used */
  key?: string;
  /** Cache expiration timestamp */
  expires?: number;
  /** Cache tags */
  tags?: string[];
}

/**
 * Response status information
 */
export interface ResponseStatus {
  /** HTTP status code */
  code: number;
  /** HTTP status text */
  text: string;
  /** Whether the request was successful */
  success: boolean;
  /** Server-side processing status */
  serverStatus?: string;
}

/**
 * Specialized response types for common operations
 */
export interface ListResponse<T> extends ApiResponse<T[]> {
  meta: ResponseMeta & {
    pagination: PaginationMeta;
  };
}

export interface CreateResponse<T> extends ApiResponse<T> {
  data: T & {
    id: number | string;
    created_date: string;
  };
}

export interface UpdateResponse<T> extends ApiResponse<T> {
  data: T & {
    last_modified_date: string;
  };
}

export interface DeleteResponse extends ApiResponse<{ success: boolean }> {
  data: {
    success: boolean;
    deleted_count?: number;
  };
}

export interface BulkResponse<T> extends ApiResponse<T[]> {
  data: T[];
  meta: ResponseMeta & {
    successCount: number;
    errorCount: number;
    errors?: AppError[];
  };
}

// ============================================================================
// Middleware and Interceptor Types
// ============================================================================

/**
 * Request interceptor interface for request transformation
 */
export interface RequestInterceptor {
  /** Unique interceptor identifier */
  id: string;
  /** Transform outgoing request */
  onRequest: (config: ApiRequestConfig) => Promise<ApiRequestConfig> | ApiRequestConfig;
  /** Handle request errors */
  onRequestError?: (error: any) => Promise<any> | any;
}

/**
 * Response interceptor interface for response transformation
 */
export interface ResponseInterceptor {
  /** Unique interceptor identifier */
  id: string;
  /** Transform incoming response */
  onResponse: (response: ApiResponse) => Promise<ApiResponse> | ApiResponse;
  /** Handle response errors */
  onResponseError?: (error: any) => Promise<any> | any;
}

/**
 * Error interceptor interface for comprehensive error handling
 */
export interface ErrorInterceptor {
  /** Unique interceptor identifier */
  id: string;
  /** Handle any error in the request/response cycle */
  onError: (error: AppError, config: ApiRequestConfig) => Promise<AppError | void> | AppError | void;
}

/**
 * Middleware execution context
 */
export interface MiddlewareContext {
  /** Current request configuration */
  request: ApiRequestConfig;
  /** Response if available */
  response?: ApiResponse;
  /** Error if occurred */
  error?: AppError;
  /** Middleware execution state */
  state: MiddlewareState;
  /** Context metadata */
  metadata: Record<string, any>;
}

/**
 * Middleware execution state tracking
 */
export interface MiddlewareState {
  /** Whether request is authenticated */
  authenticated: boolean;
  /** Whether request has been retried */
  retried: boolean;
  /** Retry attempt count */
  retryCount: number;
  /** Whether circuit breaker is open */
  circuitBreakerOpen: boolean;
  /** Execution start time */
  startTime: number;
}

/**
 * Middleware pipeline configuration
 */
export interface MiddlewarePipeline {
  /** Registered interceptors */
  interceptors: InterceptorConfig[];
  /** Add new interceptor */
  use: (interceptor: InterceptorConfig) => void;
  /** Remove interceptor by ID */
  remove: (id: string) => void;
  /** Execute request pipeline */
  executeRequest: (config: ApiRequestConfig) => Promise<ApiRequestConfig>;
  /** Execute response pipeline */
  executeResponse: (response: ApiResponse, config: ApiRequestConfig) => Promise<ApiResponse>;
  /** Execute error pipeline */
  executeError: (error: AppError, config: ApiRequestConfig) => Promise<AppError | void>;
}

// ============================================================================
// Authentication and Session Types
// ============================================================================

/**
 * Session management interface for API client
 */
export interface SessionManager {
  /** Get current session token */
  getToken: () => Promise<string | null>;
  /** Set session token */
  setToken: (token: string) => Promise<void>;
  /** Clear session token */
  clearToken: () => Promise<void>;
  /** Validate current session */
  validateSession: () => Promise<boolean>;
  /** Refresh session token */
  refreshToken: () => Promise<string>;
  /** Get session metadata */
  getSessionMeta: () => Promise<SessionMetadata | null>;
}

/**
 * Session metadata for tracking and validation
 */
export interface SessionMetadata {
  /** Session creation timestamp */
  createdAt: string;
  /** Session expiration timestamp */
  expiresAt: string;
  /** Last activity timestamp */
  lastActivity: string;
  /** User information */
  user: UserSession;
  /** Session capabilities */
  capabilities: string[];
}

/**
 * Authentication provider interface
 */
export interface AuthProvider {
  /** Authenticate with credentials */
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  /** Logout and clear session */
  logout: () => Promise<void>;
  /** Refresh authentication token */
  refresh: () => Promise<LoginResponse>;
  /** Validate current authentication */
  validate: () => Promise<boolean>;
  /** Get current authentication state */
  getState: () => Promise<AuthState>;
}

/**
 * Authentication state interface
 */
export interface AuthState {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Current user session */
  session: UserSession | null;
  /** Session token */
  token: string | null;
  /** Authentication loading state */
  isLoading: boolean;
  /** Authentication error */
  error: AuthError | null;
}

// ============================================================================
// File Operation Types
// ============================================================================

/**
 * File upload configuration interface
 */
export interface FileUploadConfig {
  /** Target upload URL */
  url?: string;
  /** HTTP method for upload */
  method?: 'POST' | 'PUT';
  /** Form field name for file */
  fieldName?: string;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Accepted file types */
  acceptedTypes?: string[];
  /** Additional form data */
  data?: Record<string, any>;
  /** Upload headers */
  headers?: Record<string, string>;
  /** Chunk size for large file uploads */
  chunkSize?: number;
  /** Whether to enable chunked upload */
  chunked?: boolean;
  /** Progress tracking configuration */
  progress?: ProgressConfig;
}

/**
 * File download configuration interface
 */
export interface FileDownloadConfig {
  /** Download URL */
  url: string;
  /** Target filename */
  filename?: string;
  /** Whether to force download */
  forceDownload?: boolean;
  /** Progress tracking configuration */
  progress?: ProgressConfig;
  /** Custom headers */
  headers?: Record<string, string>;
}

/**
 * File metadata interface
 */
export interface FileMetadata {
  /** File name */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  type: string;
  /** Last modified timestamp */
  lastModified: number;
  /** File hash/checksum */
  hash?: string;
  /** Custom metadata */
  [key: string]: any;
}

/**
 * File upload progress event
 */
export interface FileUploadProgress {
  /** Bytes loaded */
  loaded: number;
  /** Total bytes */
  total: number;
  /** Progress percentage */
  percentage: number;
  /** Upload speed in bytes per second */
  speed?: number;
  /** Estimated time remaining in seconds */
  timeRemaining?: number;
  /** Current chunk information for chunked uploads */
  chunk?: {
    index: number;
    total: number;
    size: number;
  };
}

/**
 * File download progress event
 */
export interface FileDownloadProgress {
  /** Bytes received */
  received: number;
  /** Total bytes (if known) */
  total?: number;
  /** Progress percentage */
  percentage?: number;
  /** Download speed in bytes per second */
  speed?: number;
  /** Estimated time remaining in seconds */
  timeRemaining?: number;
}

/**
 * File operation result interface
 */
export interface FileOperationResult {
  /** Whether operation was successful */
  success: boolean;
  /** File metadata */
  file?: FileMetadata;
  /** Server response data */
  data?: any;
  /** Operation error if failed */
  error?: AppError;
  /** Upload/download URL */
  url?: string;
  /** Operation duration in milliseconds */
  duration?: number;
}

/**
 * File service interface for comprehensive file operations
 */
export interface FileService {
  /** Upload single file */
  upload: (file: File, config?: FileUploadConfig) => Promise<FileOperationResult>;
  /** Upload multiple files */
  uploadMultiple: (files: File[], config?: FileUploadConfig) => Promise<FileOperationResult[]>;
  /** Download file */
  download: (config: FileDownloadConfig) => Promise<FileOperationResult>;
  /** Delete file */
  delete: (fileId: string) => Promise<FileOperationResult>;
  /** Get file metadata */
  getMetadata: (fileId: string) => Promise<FileMetadata>;
  /** List files */
  list: (params?: RequestParams) => Promise<ListResponse<FileMetadata>>;
}

// ============================================================================
// Progress and Event Types
// ============================================================================

/**
 * Generic progress event interface
 */
export interface ProgressEvent {
  /** Event type */
  type: 'upload' | 'download' | 'processing';
  /** Progress state */
  state: 'start' | 'progress' | 'complete' | 'error' | 'abort';
  /** Progress data */
  data: FileUploadProgress | FileDownloadProgress | any;
  /** Event timestamp */
  timestamp: number;
  /** Event metadata */
  metadata?: Record<string, any>;
}

/**
 * Event listener function type
 */
export type ProgressEventListener = (event: ProgressEvent) => void;

/**
 * Event emitter interface for progress tracking
 */
export interface ProgressEventEmitter {
  /** Add event listener */
  on: (event: string, listener: ProgressEventListener) => void;
  /** Remove event listener */
  off: (event: string, listener: ProgressEventListener) => void;
  /** Emit event */
  emit: (event: string, data: ProgressEvent) => void;
  /** Remove all listeners */
  removeAllListeners: () => void;
}

// ============================================================================
// API Client Instance Types
// ============================================================================

/**
 * Main API client interface
 * Provides comprehensive HTTP client functionality with DreamFactory integration
 */
export interface ApiClient {
  /** Client configuration */
  config: ApiClientConfig;
  
  /** Session manager */
  session: SessionManager;
  
  /** Authentication provider */
  auth: AuthProvider;
  
  /** File service */
  files: FileService;
  
  /** Middleware pipeline */
  middleware: MiddlewarePipeline;
  
  /** Make HTTP request with full configuration */
  request: <T = any>(config: ApiRequestConfig) => Promise<ApiResponse<T>>;
  
  /** GET request convenience method */
  get: <T = any>(url: string, config?: Partial<ApiRequestConfig>) => Promise<ApiResponse<T>>;
  
  /** POST request convenience method */
  post: <T = any>(url: string, data?: any, config?: Partial<ApiRequestConfig>) => Promise<ApiResponse<T>>;
  
  /** PUT request convenience method */
  put: <T = any>(url: string, data?: any, config?: Partial<ApiRequestConfig>) => Promise<ApiResponse<T>>;
  
  /** PATCH request convenience method */
  patch: <T = any>(url: string, data?: any, config?: Partial<ApiRequestConfig>) => Promise<ApiResponse<T>>;
  
  /** DELETE request convenience method */
  delete: <T = any>(url: string, config?: Partial<ApiRequestConfig>) => Promise<ApiResponse<T>>;
  
  /** HEAD request convenience method */
  head: (url: string, config?: Partial<ApiRequestConfig>) => Promise<ApiResponse<void>>;
  
  /** OPTIONS request convenience method */
  options: (url: string, config?: Partial<ApiRequestConfig>) => Promise<ApiResponse<void>>;
  
  /** Create new client instance with modified configuration */
  create: (config: Partial<ApiClientConfig>) => ApiClient;
  
  /** Test connection to API */
  testConnection: () => Promise<boolean>;
  
  /** Get client health status */
  getHealth: () => Promise<HealthStatus>;
  
  /** Clean up resources and close connections */
  dispose: () => Promise<void>;
}

/**
 * Health status interface for client monitoring
 */
export interface HealthStatus {
  /** Whether client is healthy */
  healthy: boolean;
  /** Connection status to API */
  connected: boolean;
  /** Authentication status */
  authenticated: boolean;
  /** Circuit breaker status */
  circuitBreakerOpen: boolean;
  /** Active request count */
  activeRequests: number;
  /** Error rate in last minute */
  errorRate: number;
  /** Average response time */
  averageResponseTime: number;
  /** Last health check timestamp */
  lastCheck: string;
}

// ============================================================================
// Factory and Builder Types
// ============================================================================

/**
 * API client factory interface
 */
export interface ApiClientFactory {
  /** Create new client instance */
  create: (config: ApiClientConfig) => ApiClient;
  /** Create client with default configuration */
  createDefault: () => ApiClient;
  /** Create server-side client instance */
  createServerSide: (config?: Partial<ServerSideConfig>) => ApiClient;
  /** Get shared client instance */
  getShared: () => ApiClient;
}

/**
 * Configuration builder interface for fluent API
 */
export interface ConfigBuilder {
  /** Set base URL */
  baseUrl: (url: string) => ConfigBuilder;
  /** Set API key */
  apiKey: (key: string) => ConfigBuilder;
  /** Set timeout */
  timeout: (ms: number) => ConfigBuilder;
  /** Enable debug mode */
  debug: (enabled?: boolean) => ConfigBuilder;
  /** Configure retry behavior */
  retry: (config: Partial<RetryConfig>) => ConfigBuilder;
  /** Add interceptor */
  use: (interceptor: InterceptorConfig) => ConfigBuilder;
  /** Build final configuration */
  build: () => ApiClientConfig;
}

// ============================================================================
// React Integration Types
// ============================================================================

/**
 * React hook configuration for API client integration
 */
export interface UseApiClientConfig {
  /** Client configuration override */
  config?: Partial<ApiClientConfig>;
  /** Whether to create server-side client */
  serverSide?: boolean;
  /** Whether to enable automatic error handling */
  autoError?: boolean;
  /** Whether to enable automatic loading states */
  autoLoading?: boolean;
}

/**
 * React hook return interface
 */
export interface UseApiClientReturn {
  /** API client instance */
  client: ApiClient;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: AppError | null;
  /** Clear error state */
  clearError: () => void;
  /** Refresh client connection */
  refresh: () => Promise<void>;
}

// ============================================================================
// Testing and Development Types
// ============================================================================

/**
 * Mock API client configuration for testing
 */
export interface MockApiClientConfig {
  /** Whether to enable mocking */
  enabled: boolean;
  /** Mock response delay in milliseconds */
  delay?: number;
  /** Mock response configurations */
  responses: MockResponse[];
  /** Whether to fall through to real API for unmatched requests */
  fallthrough?: boolean;
}

/**
 * Mock response configuration
 */
export interface MockResponse {
  /** Request matcher */
  matcher: RequestMatcher;
  /** Mock response data */
  response: Partial<ApiResponse> | ((config: ApiRequestConfig) => Partial<ApiResponse>);
  /** Response delay override */
  delay?: number;
  /** Whether this mock is enabled */
  enabled?: boolean;
}

/**
 * Request matcher for mock responses
 */
export interface RequestMatcher {
  /** URL pattern to match */
  url?: string | RegExp;
  /** HTTP method to match */
  method?: HttpMethod;
  /** Custom matcher function */
  custom?: (config: ApiRequestConfig) => boolean;
}

// ============================================================================
// Legacy Compatibility Types
// ============================================================================

/**
 * Legacy request options interface for backward compatibility
 * @deprecated Use ApiRequestConfig instead
 */
export interface LegacyRequestOptions extends LegacyRequestOptions {}

/**
 * Legacy response format for Angular migration compatibility
 * @deprecated Use ApiResponse instead
 */
export interface LegacyApiResponse<T = any> {
  /** Response data */
  resource?: T;
  /** Metadata */
  meta?: { count?: number };
  /** Success flag */
  success?: boolean;
  /** Error information */
  error?: {
    code: string;
    message: string;
    status_code: number;
    context?: any;
  };
}

// ============================================================================
// Type Utilities and Exports
// ============================================================================

/**
 * Extract response data type from API response
 */
export type ExtractResponseData<T> = T extends ApiResponse<infer U> ? U : never;

/**
 * Extract list item type from list response
 */
export type ExtractListItem<T> = T extends ListResponse<infer U> ? U : never;

/**
 * Create type-safe request configuration
 */
export type TypedRequestConfig<T = any> = ApiRequestConfig & {
  data?: T;
};

/**
 * Create type-safe response type
 */
export type TypedResponse<T = any> = ApiResponse<T>;

// Export all types for convenient importing
export type {
  // Core configuration
  ApiClientConfig,
  ServerSideConfig,
  InterceptorConfig,
  
  // Request types
  ApiRequestConfig,
  RequestParams,
  AuthConfig,
  CacheConfig,
  ProgressConfig,
  RequestMetadata,
  
  // Response types
  ApiResponse,
  ResponseMeta,
  PaginationMeta,
  TimingMeta,
  CacheMeta,
  ResponseStatus,
  ListResponse,
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
  BulkResponse,
  
  // Middleware types
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  MiddlewareContext,
  MiddlewareState,
  MiddlewarePipeline,
  
  // Authentication types
  SessionManager,
  SessionMetadata,
  AuthProvider,
  AuthState,
  
  // File operation types
  FileUploadConfig,
  FileDownloadConfig,
  FileMetadata,
  FileUploadProgress,
  FileDownloadProgress,
  FileOperationResult,
  FileService,
  
  // Progress and events
  ProgressEvent,
  ProgressEventListener,
  ProgressEventEmitter,
  
  // Client types
  ApiClient,
  HealthStatus,
  ApiClientFactory,
  ConfigBuilder,
  
  // React integration
  UseApiClientConfig,
  UseApiClientReturn,
  
  // Testing types
  MockApiClientConfig,
  MockResponse,
  RequestMatcher,
  
  // Legacy compatibility
  LegacyApiResponse,
  
  // Type utilities
  ExtractResponseData,
  ExtractListItem,
  TypedRequestConfig,
  TypedResponse,
};

// Export common enums and constants
export { HttpMethod };

// Default configuration values
export const DEFAULT_CONFIG: Partial<ApiClientConfig> = {
  timeout: 30000,
  withCredentials: true,
  debug: process.env.NODE_ENV === 'development',
  retryConfig: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    jitter: true,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    retryableNetworkErrors: ['TIMEOUT', 'NETWORK_ERROR', 'ECONNRESET'],
  },
  interceptors: [],
};

export const DEFAULT_SERVER_CONFIG: ServerSideConfig = {
  enabled: true,
  sessionCookieName: 'df-session-token',
  revalidateInterval: 60,
  serverHeaders: {},
};