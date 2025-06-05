/**
 * Generic HTTP Response and Request Types for React Query/SWR Integration
 * 
 * Provides type-safe contracts for REST API interactions using native fetch with intelligent caching.
 * Adapted for React 19/Next.js 15.1 with comprehensive data fetching patterns and error handling.
 * 
 * @fileoverview This module provides comprehensive HTTP type definitions for:
 * - React Query and SWR integration with intelligent caching and synchronization
 * - Native fetch API compatibility with enhanced type safety
 * - React Suspense and error boundary integration
 * - Optimistic updates and background synchronization patterns
 * - Next.js API route compatibility
 * - Error handling optimized for React error boundaries
 */

// =============================================================================
// CORE HTTP RESPONSE INTERFACES
// =============================================================================

/**
 * Base interface for all successful API responses from DreamFactory backend.
 * Provides consistent structure for success responses across all endpoints.
 */
export interface GenericSuccessResponse {
  /** Success status indicator */
  success: boolean;
  /** Response message */
  message?: string;
  /** Response timestamp */
  timestamp?: number;
  /** Request ID for tracing */
  requestId?: string;
  /** Additional metadata */
  meta?: ResponseMetadata;
  /** Allow additional properties for flexibility */
  [key: string]: any;
}

/**
 * Base interface for all error responses from DreamFactory backend.
 * Provides consistent error structure for React error boundary integration.
 */
export interface GenericErrorResponse {
  /** Error status indicator */
  success: false;
  /** Error object containing details */
  error: ApiError;
  /** Response timestamp */
  timestamp?: number;
  /** Request ID for tracing */
  requestId?: string;
  /** Additional error metadata */
  meta?: ErrorMetadata;
  /** Allow additional properties for debugging */
  [key: string]: any;
}

/**
 * Comprehensive API error object for React error boundary handling.
 */
export interface ApiError {
  /** Error code for programmatic handling */
  code: number;
  /** Human-readable error message */
  message: string;
  /** Error type classification */
  type?: ApiErrorType;
  /** Detailed error information */
  details?: ErrorDetails;
  /** Stack trace (development only) */
  stack?: string;
  /** Field-specific validation errors */
  validation?: ValidationErrors;
  /** Recovery suggestions */
  recovery?: ErrorRecovery;
}

/**
 * API error type enumeration for error handling patterns.
 */
export type ApiErrorType =
  | 'validation_error'
  | 'authentication_error'
  | 'authorization_error'
  | 'not_found_error'
  | 'conflict_error'
  | 'rate_limit_error'
  | 'server_error'
  | 'network_error'
  | 'timeout_error'
  | 'parse_error'
  | 'configuration_error';

/**
 * Detailed error information for debugging and logging.
 */
export interface ErrorDetails {
  /** Error source component */
  source?: string;
  /** Error context */
  context?: Record<string, any>;
  /** Related entity information */
  entity?: {
    type: string;
    id?: string | number;
  };
  /** Upstream error information */
  upstream?: {
    service: string;
    error: string;
  };
}

/**
 * Field-specific validation errors for form handling.
 */
export interface ValidationErrors {
  /** Field-level errors */
  [fieldName: string]: string[] | string;
}

/**
 * Error recovery suggestions for user guidance.
 */
export interface ErrorRecovery {
  /** Suggested action */
  action: 'retry' | 'refresh' | 'login' | 'contact_support' | 'navigate';
  /** Action parameters */
  params?: Record<string, any>;
  /** Retry configuration */
  retry?: {
    retryable: boolean;
    delay?: number;
    maxAttempts?: number;
  };
}

/**
 * Response metadata for caching and optimization.
 */
export interface ResponseMetadata {
  /** Response processing duration */
  duration?: number;
  /** Cache information */
  cache?: CacheMetadata;
  /** Rate limiting information */
  rateLimit?: RateLimitMetadata;
  /** API version */
  version?: string;
  /** Server instance identifier */
  server?: string;
}

/**
 * Error metadata for debugging and monitoring.
 */
export interface ErrorMetadata extends ResponseMetadata {
  /** Error tracking ID */
  trackingId?: string;
  /** Error severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Whether error should be reported */
  reportable: boolean;
}

/**
 * Cache metadata for React Query/SWR optimization.
 */
export interface CacheMetadata {
  /** Whether response was served from cache */
  hit: boolean;
  /** Cache key used */
  key?: string;
  /** Cache timestamp */
  timestamp?: number;
  /** Cache TTL in seconds */
  ttl?: number;
  /** Cache tags for invalidation */
  tags?: string[];
}

/**
 * Rate limiting metadata for API consumption monitoring.
 */
export interface RateLimitMetadata {
  /** Request limit per time window */
  limit: number;
  /** Remaining requests in current window */
  remaining: number;
  /** Window reset timestamp */
  reset: number;
  /** Time until next request allowed */
  retryAfter?: number;
}

// =============================================================================
// REQUEST CONFIGURATION INTERFACES
// =============================================================================

/**
 * Enhanced request options supporting React Query/SWR and native fetch patterns.
 * Replaces Angular HttpClient options with modern data fetching configuration.
 */
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  // === FETCH API CONFIGURATION ===
  /** Request body (typed for better TypeScript support) */
  body?: BodyInit | Record<string, any> | any[];
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Base URL for relative requests */
  baseURL?: string;
  /** Request interceptors */
  interceptors?: RequestInterceptors;
  
  // === REACT QUERY INTEGRATION ===
  /** React Query cache configuration */
  reactQuery?: ReactQueryConfig;
  
  // === SWR INTEGRATION ===
  /** SWR revalidation configuration */
  swr?: SWRConfig;
  
  // === RETRY AND ERROR HANDLING ===
  /** Retry configuration */
  retry?: RetryConfig;
  /** Error handling configuration */
  errorHandling?: ErrorHandlingConfig;
  
  // === OPTIMISTIC UPDATES ===
  /** Optimistic update configuration */
  optimistic?: OptimisticUpdateConfig;
  
  // === RESPONSE PROCESSING ===
  /** Response transformation */
  transform?: ResponseTransform;
  /** Response validation */
  validation?: ResponseValidation;
  
  // === AUTHENTICATION ===
  /** Authentication configuration */
  auth?: AuthConfig;
  
  // === METADATA ===
  /** Request metadata */
  metadata?: RequestMetadata;
}

/**
 * React Query specific configuration options.
 */
export interface ReactQueryConfig {
  /** Query key for caching */
  queryKey?: QueryKey;
  /** Time in milliseconds until cached data is considered stale */
  staleTime?: number;
  /** Time in milliseconds until inactive data is garbage collected */
  cacheTime?: number;
  /** Time in milliseconds before query times out */
  queryTimeout?: number;
  /** Retry function or configuration */
  retry?: boolean | number | RetryFunction;
  /** Retry delay function */
  retryDelay?: (attemptIndex: number) => number;
  /** Whether to refetch on window focus */
  refetchOnWindowFocus?: boolean;
  /** Whether to refetch on reconnect */
  refetchOnReconnect?: boolean;
  /** Whether to refetch on mount */
  refetchOnMount?: boolean;
  /** Refetch interval in milliseconds */
  refetchInterval?: number | false;
  /** Whether refetch interval continues in background */
  refetchIntervalInBackground?: boolean;
  /** Whether query is enabled */
  enabled?: boolean;
  /** Data selector function */
  select?: <T>(data: any) => T;
  /** Success callback */
  onSuccess?: (data: any) => void;
  /** Error callback */
  onError?: (error: any) => void;
  /** Settled callback */
  onSettled?: (data?: any, error?: any) => void;
  /** Use error boundary flag */
  useErrorBoundary?: boolean | ((error: any) => boolean);
  /** Suspense mode flag */
  suspense?: boolean;
  /** Keep previous data flag */
  keepPreviousData?: boolean;
  /** Structural sharing flag */
  structuralSharing?: boolean;
  /** Network mode */
  networkMode?: 'online' | 'always' | 'offlineFirst';
}

/**
 * SWR specific configuration options.
 */
export interface SWRConfig {
  /** Revalidation on focus */
  revalidateOnFocus?: boolean;
  /** Revalidation on reconnect */
  revalidateOnReconnect?: boolean;
  /** Revalidation if stale */
  revalidateIfStale?: boolean;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Refresh when hidden */
  refreshWhenHidden?: boolean;
  /** Refresh when offline */
  refreshWhenOffline?: boolean;
  /** Dedupe interval in milliseconds */
  dedupingInterval?: number;
  /** Focus throttle interval */
  focusThrottleInterval?: number;
  /** Load previous data until new data loaded */
  keepPreviousData?: boolean;
  /** Fallback data */
  fallbackData?: any;
  /** Error retry count */
  errorRetryCount?: number;
  /** Error retry interval */
  errorRetryInterval?: number;
  /** Success callback */
  onSuccess?: (data: any, key: string, config: any) => void;
  /** Error callback */
  onError?: (error: any, key: string, config: any) => void;
  /** Error retry callback */
  onErrorRetry?: (error: any, key: string, config: any, revalidate: any, opts: any) => void;
  /** Loading timeout */
  loadingTimeout?: number;
  /** Compare function for data comparison */
  compare?: (a: any, b: any) => boolean;
  /** Use Suspense */
  suspense?: boolean;
}

/**
 * Retry configuration for failed requests.
 */
export interface RetryConfig {
  /** Whether retries are enabled */
  enabled: boolean;
  /** Maximum number of retry attempts */
  attempts: number;
  /** Initial delay between retries in milliseconds */
  delay: number;
  /** Delay multiplier for exponential backoff */
  multiplier: number;
  /** Maximum delay between retries */
  maxDelay: number;
  /** Jitter to add randomness to delays */
  jitter: boolean;
  /** Conditions that should trigger a retry */
  retryCondition?: (error: ApiError) => boolean;
  /** Callback for retry attempts */
  onRetry?: (attempt: number, error: ApiError) => void;
}

/**
 * Error handling configuration for React error boundaries.
 */
export interface ErrorHandlingConfig {
  /** Whether to use React error boundaries */
  useErrorBoundary?: boolean;
  /** Error boundary fallback component */
  errorBoundaryFallback?: React.ComponentType<any>;
  /** Global error handler */
  onError?: (error: ApiError, context: ErrorContext) => void;
  /** Error transformation function */
  transformError?: (error: any) => ApiError;
  /** Whether to log errors */
  logErrors?: boolean;
  /** Error reporting configuration */
  reporting?: ErrorReportingConfig;
}

/**
 * Error context for debugging and reporting.
 */
export interface ErrorContext {
  /** Request URL */
  url: string;
  /** Request method */
  method: string;
  /** Request body */
  body?: any;
  /** Request headers */
  headers?: Headers;
  /** Request timestamp */
  timestamp: number;
  /** Retry attempt number */
  retryAttempt: number;
  /** User context */
  user?: {
    id?: string;
    email?: string;
  };
}

/**
 * Error reporting configuration.
 */
export interface ErrorReportingConfig {
  /** Whether error reporting is enabled */
  enabled: boolean;
  /** Error reporting service */
  service?: 'sentry' | 'bugsnag' | 'custom';
  /** Error sampling rate */
  sampleRate?: number;
  /** Custom error reporting function */
  reporter?: (error: ApiError, context: ErrorContext) => void;
}

/**
 * Optimistic update configuration for improved UX.
 */
export interface OptimisticUpdateConfig {
  /** Whether optimistic updates are enabled */
  enabled: boolean;
  /** Optimistic data generator */
  data?: (variables: any) => any;
  /** Cache update function */
  updateCache?: (cache: any, variables: any, context: any) => void;
  /** Rollback function for failed updates */
  rollback?: (cache: any, error: ApiError, variables: any, context: any) => void;
  /** Success callback */
  onSuccess?: (data: any, variables: any, context: any) => void;
  /** Error callback */
  onError?: (error: ApiError, variables: any, context: any) => void;
}

/**
 * Response transformation configuration.
 */
export interface ResponseTransform {
  /** Data transformation function */
  data?: (data: any) => any;
  /** Error transformation function */
  error?: (error: any) => ApiError;
  /** Headers transformation function */
  headers?: (headers: Headers) => Record<string, string>;
}

/**
 * Response validation configuration.
 */
export interface ResponseValidation {
  /** Schema validation function */
  schema?: (data: any) => boolean | ValidationResult;
  /** Custom validation function */
  custom?: (response: Response, data: any) => boolean | ValidationResult;
  /** Validation error handler */
  onValidationError?: (error: ValidationError) => void;
}

/**
 * Validation result interface.
 */
export interface ValidationResult {
  /** Validation success flag */
  valid: boolean;
  /** Validation errors */
  errors?: ValidationErrors;
  /** Additional validation metadata */
  metadata?: Record<string, any>;
}

/**
 * Validation error interface.
 */
export interface ValidationError extends Error {
  /** Validation errors */
  errors: ValidationErrors;
  /** Response data that failed validation */
  data: any;
}

/**
 * Authentication configuration for requests.
 */
export interface AuthConfig {
  /** Authentication type */
  type: 'bearer' | 'basic' | 'apikey' | 'custom';
  /** Authentication token */
  token?: string;
  /** API key */
  apiKey?: string;
  /** Basic auth credentials */
  credentials?: {
    username: string;
    password: string;
  };
  /** Custom auth header */
  customHeader?: {
    name: string;
    value: string;
  };
  /** Token refresh configuration */
  refresh?: TokenRefreshConfig;
}

/**
 * Token refresh configuration.
 */
export interface TokenRefreshConfig {
  /** Whether automatic token refresh is enabled */
  enabled: boolean;
  /** Token refresh endpoint */
  endpoint?: string;
  /** Refresh token */
  refreshToken?: string;
  /** Token refresh threshold (seconds before expiry) */
  threshold?: number;
  /** Token refresh function */
  refreshFunction?: () => Promise<string>;
}

/**
 * Request metadata for tracking and debugging.
 */
export interface RequestMetadata {
  /** Request ID for tracing */
  requestId?: string;
  /** Request tags for categorization */
  tags?: string[];
  /** Request priority */
  priority?: 'low' | 'normal' | 'high';
  /** Request timeout override */
  timeout?: number;
  /** Request context */
  context?: Record<string, any>;
}

// =============================================================================
// INTERCEPTOR INTERFACES
// =============================================================================

/**
 * Request interceptors for preprocessing requests.
 */
export interface RequestInterceptors {
  /** Before request interceptors */
  before?: RequestInterceptor[];
  /** After response interceptors */
  after?: ResponseInterceptor[];
  /** Error interceptors */
  error?: ErrorInterceptor[];
}

/**
 * Request interceptor function type.
 */
export type RequestInterceptor = (
  request: RequestOptions
) => RequestOptions | Promise<RequestOptions>;

/**
 * Response interceptor function type.
 */
export type ResponseInterceptor = (
  response: Response,
  request: RequestOptions
) => Response | Promise<Response>;

/**
 * Error interceptor function type.
 */
export type ErrorInterceptor = (
  error: ApiError,
  request: RequestOptions
) => ApiError | Promise<ApiError>;

// =============================================================================
// REACT QUERY SPECIFIC TYPES
// =============================================================================

/**
 * Query key type for React Query.
 */
export type QueryKey = readonly unknown[];

/**
 * Retry function type for React Query.
 */
export type RetryFunction = (
  failureCount: number,
  error: any
) => boolean;

/**
 * Mutation variables type for React Query.
 */
export interface MutationVariables {
  /** HTTP method */
  method: string;
  /** Request URL */
  url: string;
  /** Request body */
  body?: any;
  /** Request options */
  options?: Partial<RequestOptions>;
}

/**
 * Query function type for React Query.
 */
export type QueryFunction<T = any> = (
  context: QueryFunctionContext
) => Promise<T>;

/**
 * Query function context for React Query.
 */
export interface QueryFunctionContext {
  /** Query key */
  queryKey: QueryKey;
  /** Page parameter for pagination */
  pageParam?: any;
  /** Signal for cancellation */
  signal?: AbortSignal;
  /** Additional metadata */
  meta?: Record<string, any>;
}

/**
 * Mutation function type for React Query.
 */
export type MutationFunction<TData = any, TVariables = any> = (
  variables: TVariables
) => Promise<TData>;

// =============================================================================
// PAGINATION AND FILTERING
// =============================================================================

/**
 * Pagination parameters for list requests.
 */
export interface PaginationParams {
  /** Page number (1-based) */
  page?: number;
  /** Number of items per page */
  limit?: number;
  /** Offset for cursor-based pagination */
  offset?: number;
  /** Cursor for cursor-based pagination */
  cursor?: string;
}

/**
 * Sorting parameters for list requests.
 */
export interface SortParams {
  /** Field to sort by */
  field: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Filtering parameters for list requests.
 */
export interface FilterParams {
  /** Filter field */
  field: string;
  /** Filter operator */
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'nin';
  /** Filter value */
  value: any;
}

/**
 * List request parameters combining pagination, sorting, and filtering.
 */
export interface ListRequestParams {
  /** Pagination parameters */
  pagination?: PaginationParams;
  /** Sorting parameters */
  sort?: SortParams[];
  /** Filtering parameters */
  filter?: FilterParams[];
  /** Search query */
  search?: string;
  /** Additional query parameters */
  [key: string]: any;
}

/**
 * Paginated response wrapper for list endpoints.
 */
export interface PaginatedResponse<T = any> extends GenericSuccessResponse {
  /** Response data array */
  data: T[];
  /** Pagination metadata */
  pagination: PaginationMetadata;
}

/**
 * Pagination metadata for list responses.
 */
export interface PaginationMetadata {
  /** Current page number */
  page: number;
  /** Items per page */
  limit: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Whether there is a previous page */
  hasPrev: boolean;
  /** Next page cursor */
  nextCursor?: string;
  /** Previous page cursor */
  prevCursor?: string;
}

// =============================================================================
// UPLOAD AND DOWNLOAD TYPES
// =============================================================================

/**
 * File upload configuration.
 */
export interface UploadConfig {
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Allowed file types */
  allowedTypes?: string[];
  /** Whether multiple files are allowed */
  multiple?: boolean;
  /** Upload progress callback */
  onProgress?: (progress: UploadProgress) => void;
  /** Upload chunk size for large files */
  chunkSize?: number;
  /** Whether to enable resumable uploads */
  resumable?: boolean;
}

/**
 * Upload progress information.
 */
export interface UploadProgress {
  /** Bytes uploaded */
  loaded: number;
  /** Total bytes */
  total: number;
  /** Upload percentage */
  percentage: number;
  /** Upload speed in bytes per second */
  speed: number;
  /** Estimated time remaining in seconds */
  timeRemaining: number;
}

/**
 * File download configuration.
 */
export interface DownloadConfig {
  /** Download filename */
  filename?: string;
  /** Whether to force download */
  forceDownload?: boolean;
  /** Download progress callback */
  onProgress?: (progress: DownloadProgress) => void;
}

/**
 * Download progress information.
 */
export interface DownloadProgress {
  /** Bytes downloaded */
  loaded: number;
  /** Total bytes */
  total: number;
  /** Download percentage */
  percentage: number;
  /** Download speed in bytes per second */
  speed: number;
  /** Estimated time remaining in seconds */
  timeRemaining: number;
}

// =============================================================================
// WEBSOCKET AND REAL-TIME TYPES
// =============================================================================

/**
 * WebSocket configuration for real-time updates.
 */
export interface WebSocketConfig {
  /** WebSocket URL */
  url: string;
  /** Connection protocols */
  protocols?: string[];
  /** Connection timeout */
  timeout?: number;
  /** Reconnection configuration */
  reconnect?: ReconnectConfig;
  /** Authentication configuration */
  auth?: WebSocketAuthConfig;
  /** Message handlers */
  handlers?: WebSocketHandlers;
}

/**
 * WebSocket reconnection configuration.
 */
export interface ReconnectConfig {
  /** Whether auto-reconnection is enabled */
  enabled: boolean;
  /** Maximum reconnection attempts */
  maxAttempts: number;
  /** Initial delay between attempts */
  delay: number;
  /** Delay multiplier for exponential backoff */
  multiplier: number;
  /** Maximum delay between attempts */
  maxDelay: number;
}

/**
 * WebSocket authentication configuration.
 */
export interface WebSocketAuthConfig {
  /** Authentication token */
  token?: string;
  /** Authentication method */
  method: 'token' | 'query' | 'header';
  /** Token parameter name */
  param?: string;
}

/**
 * WebSocket message handlers.
 */
export interface WebSocketHandlers {
  /** Message received handler */
  onMessage?: (data: any) => void;
  /** Connection opened handler */
  onOpen?: () => void;
  /** Connection closed handler */
  onClose?: (code: number, reason: string) => void;
  /** Connection error handler */
  onError?: (error: Event) => void;
  /** Reconnection attempt handler */
  onReconnect?: (attempt: number) => void;
}

// =============================================================================
// UTILITY TYPES AND TYPE GUARDS
// =============================================================================

/**
 * HTTP method enumeration.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Content type enumeration.
 */
export type ContentType = 
  | 'application/json'
  | 'application/x-www-form-urlencoded'
  | 'multipart/form-data'
  | 'text/plain'
  | 'text/html'
  | 'application/xml'
  | 'application/octet-stream';

/**
 * Response status type.
 */
export type ResponseStatus = 
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'stale'
  | 'refreshing';

/**
 * Type guard to check if response is successful.
 */
export function isSuccessResponse(response: any): response is GenericSuccessResponse {
  return typeof response === 'object' && response !== null && response.success === true;
}

/**
 * Type guard to check if response is an error.
 */
export function isErrorResponse(response: any): response is GenericErrorResponse {
  return typeof response === 'object' && response !== null && response.success === false;
}

/**
 * Type guard to check if error is an API error.
 */
export function isApiError(error: any): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof error.code === 'number' &&
    typeof error.message === 'string'
  );
}

/**
 * Type guard to check if error is a network error.
 */
export function isNetworkError(error: any): boolean {
  return error instanceof TypeError || error.name === 'NetworkError';
}

/**
 * Type guard to check if error is a timeout error.
 */
export function isTimeoutError(error: any): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

// =============================================================================
// EXPORTS
// =============================================================================

// Export all types for external consumption
export type {
  // Core response types
  GenericSuccessResponse,
  GenericErrorResponse,
  ApiError,
  ErrorDetails,
  ValidationErrors,
  ErrorRecovery,
  ResponseMetadata,
  ErrorMetadata,
  CacheMetadata,
  RateLimitMetadata,
  
  // Request configuration types
  RequestOptions,
  ReactQueryConfig,
  SWRConfig,
  RetryConfig,
  ErrorHandlingConfig,
  ErrorContext,
  ErrorReportingConfig,
  OptimisticUpdateConfig,
  ResponseTransform,
  ResponseValidation,
  ValidationResult,
  ValidationError,
  AuthConfig,
  TokenRefreshConfig,
  RequestMetadata,
  
  // Interceptor types
  RequestInterceptors,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  
  // React Query types
  QueryKey,
  RetryFunction,
  MutationVariables,
  QueryFunction,
  QueryFunctionContext,
  MutationFunction,
  
  // Pagination and filtering types
  PaginationParams,
  SortParams,
  FilterParams,
  ListRequestParams,
  PaginatedResponse,
  PaginationMetadata,
  
  // Upload and download types
  UploadConfig,
  UploadProgress,
  DownloadConfig,
  DownloadProgress,
  
  // WebSocket types
  WebSocketConfig,
  ReconnectConfig,
  WebSocketAuthConfig,
  WebSocketHandlers,
  
  // Utility types
  HttpMethod,
  ContentType,
  ResponseStatus,
  ApiErrorType
};