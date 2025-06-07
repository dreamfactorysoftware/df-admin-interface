/**
 * Generic HTTP Response and Request Types for React Query/SWR Integration
 * 
 * Provides comprehensive type-safe contracts for REST API interactions using native fetch
 * with intelligent caching patterns. Designed for optimal performance with cache hit
 * responses under 50ms and seamless integration with React Suspense and error boundaries.
 * 
 * @fileoverview This module provides generic HTTP types for:
 * - SWR and React Query intelligent caching and synchronization
 * - Native fetch API compatibility with type safety
 * - React Suspense and error boundary integration
 * - Optimistic updates and background synchronization
 * - Performance-optimized request/response patterns
 * - Comprehensive error handling for React applications
 */

// =============================================================================
// CORE RESPONSE INTERFACES
// =============================================================================

/**
 * Standard success response interface for all API operations
 */
export interface GenericSuccessResponse {
  /** Operation success indicator */
  success: boolean;
  /** Optional success message */
  message?: string;
  /** Timestamp of the operation */
  timestamp?: string;
}

/**
 * Comprehensive error response structure supporting React Error Boundaries
 */
export interface GenericErrorResponse {
  /** Error details container */
  error: {
    /** Error code for programmatic handling */
    code: string;
    /** Error context providing additional details */
    context: string | {
      /** Detailed error information */
      error: Array<any>;
      /** Resource-specific error details */
      resource: Array<GenericErrorResponse>;
    };
    /** Human-readable error message */
    message: string;
    /** HTTP status code */
    status_code: number;
    /** Error timestamp */
    timestamp?: string;
    /** Stack trace for development mode */
    stack?: string;
  };
}

/**
 * API error type for React Error Boundary integration
 */
export interface ApiError extends Error {
  /** HTTP status code */
  status?: number;
  /** Error code for categorization */
  code?: string;
  /** Original error response */
  response?: GenericErrorResponse;
  /** Error timestamp */
  timestamp?: string;
  /** Request details for debugging */
  request?: {
    url: string;
    method: string;
    headers?: Record<string, string>;
  };
}

// =============================================================================
// VALIDATION AND FORM ERROR TYPES
// =============================================================================

/**
 * Field-specific validation errors for React Hook Form integration
 */
export interface FieldError {
  /** Field identifier */
  field: string;
  /** Error message */
  message: string;
  /** Error code */
  code: string;
  /** Additional context */
  value?: any;
}

/**
 * Comprehensive validation errors supporting real-time validation under 100ms
 */
export interface ValidationErrors {
  /** Field-specific errors */
  fields: Record<string, FieldError[]>;
  /** General validation errors */
  general: string[];
  /** Error summary */
  summary?: string;
}

// =============================================================================
// LIST AND PAGINATION TYPES
// =============================================================================

/**
 * Metadata for paginated responses
 */
export interface Meta {
  /** Total number of items */
  count: number;
  /** Current page number */
  page?: number;
  /** Items per page */
  pageSize?: number;
  /** Total number of pages */
  totalPages?: number;
  /** Whether there are more items */
  hasMore?: boolean;
}

/**
 * Generic list response with pagination support
 */
export interface GenericListResponse<T> {
  /** Array of resource items */
  resource: Array<T>;
  /** Pagination metadata */
  meta: Meta;
}

/**
 * Paginated response type alias for better readability
 */
export type PaginatedResponse<T> = GenericListResponse<T>;

/**
 * Parameters for list requests with filtering and pagination
 */
export interface ListRequestParams {
  /** Filter expression */
  filter?: string;
  /** Sort specification */
  sort?: string;
  /** Fields to include */
  fields?: string;
  /** Related resources to include */
  related?: string;
  /** Maximum number of items to return */
  limit?: number;
  /** Number of items to skip */
  offset?: number;
  /** Include total count in response */
  includeCount?: boolean;
  /** Search query */
  search?: string;
}

// =============================================================================
// KEY-VALUE PAIR UTILITIES
// =============================================================================

/**
 * Generic key-value pair for flexible parameter passing
 */
export interface KeyValuePair {
  /** Parameter key */
  key: string;
  /** Parameter value of any type */
  value: any;
}

// =============================================================================
// REACT QUERY CACHE CONFIGURATION
// =============================================================================

/**
 * React Query cache configuration options for intelligent caching
 */
export interface ReactQueryCacheConfig {
  /** Time until data is considered stale (ms) */
  staleTime?: number;
  /** Time until data is removed from cache (ms) */
  cacheTime?: number;
  /** Number of retry attempts on failure */
  retry?: number | boolean;
  /** Retry delay function */
  retryDelay?: (attemptIndex: number) => number;
  /** Whether to refetch on window focus */
  refetchOnWindowFocus?: boolean;
  /** Whether to refetch on reconnect */
  refetchOnReconnect?: boolean;
  /** Refetch interval (ms) */
  refetchInterval?: number;
  /** Whether to refetch interval in background */
  refetchIntervalInBackground?: boolean;
  /** Whether query is enabled */
  enabled?: boolean;
}

/**
 * SWR revalidation configuration options
 */
export interface SWRRevalidationConfig {
  /** Refresh interval (ms) */
  refreshInterval?: number;
  /** Whether to refresh when tab is focused */
  refreshWhenHidden?: boolean;
  /** Whether to refresh when window is focused */
  refreshWhenOffline?: boolean;
  /** Whether to revalidate on focus */
  revalidateOnFocus?: boolean;
  /** Whether to revalidate on reconnect */
  revalidateOnReconnect?: boolean;
  /** Whether to revalidate on mount */
  revalidateOnMount?: boolean;
  /** Whether to revalidate if stale */
  revalidateIfStale?: boolean;
  /** Dedupe interval (ms) */
  dedupingInterval?: number;
  /** Loading timeout (ms) */
  loadingTimeout?: number;
  /** Error retry interval (ms) */
  errorRetryInterval?: number;
  /** Error retry count */
  errorRetryCount?: number;
}

// =============================================================================
// OPTIMISTIC UPDATES AND BACKGROUND SYNC
// =============================================================================

/**
 * Configuration for optimistic updates
 */
export interface OptimisticUpdateConfig<T = any> {
  /** Function to apply optimistic update */
  updateFn: (data: T) => T;
  /** Function to rollback on error */
  rollbackFn?: (data: T) => T;
  /** Whether to show loading state during update */
  showLoading?: boolean;
  /** Timeout for optimistic update (ms) */
  timeout?: number;
}

/**
 * Background synchronization configuration
 */
export interface BackgroundSyncConfig {
  /** Whether background sync is enabled */
  enabled?: boolean;
  /** Sync interval (ms) */
  interval?: number;
  /** Whether to sync when online */
  syncWhenOnline?: boolean;
  /** Whether to sync when focused */
  syncWhenFocused?: boolean;
  /** Maximum sync attempts */
  maxAttempts?: number;
  /** Exponential backoff configuration */
  backoff?: {
    /** Initial delay (ms) */
    initialDelay: number;
    /** Maximum delay (ms) */
    maxDelay: number;
    /** Multiplier for exponential backoff */
    multiplier: number;
  };
}

// =============================================================================
// REQUEST CONFIGURATION INTERFACES
// =============================================================================

/**
 * Comprehensive request options supporting SWR and React Query patterns
 */
export interface RequestOptions extends ListRequestParams {
  // =============================================================================
  // CACHE CONFIGURATION
  // =============================================================================
  
  /** React Query cache configuration */
  reactQuery?: ReactQueryCacheConfig;
  
  /** SWR revalidation configuration */
  swr?: SWRRevalidationConfig;
  
  /** Whether to force refresh cache */
  refresh?: boolean;
  
  /** Include cache control headers */
  includeCacheControl?: boolean;

  // =============================================================================
  // FETCH CONFIGURATION
  // =============================================================================
  
  /** HTTP method override */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  
  /** Request headers */
  headers?: Record<string, string>;
  
  /** Additional headers as key-value pairs */
  additionalHeaders?: KeyValuePair[];
  
  /** Content type override */
  contentType?: string;
  
  /** Request timeout (ms) */
  timeout?: number;
  
  /** Whether to include credentials */
  credentials?: RequestCredentials;
  
  /** Additional URL parameters */
  additionalParams?: KeyValuePair[];

  // =============================================================================
  // ERROR HANDLING AND RETRY
  // =============================================================================
  
  /** Whether to throw on error (for React Error Boundaries) */
  throwOnError?: boolean;
  
  /** Error retry configuration */
  retry?: {
    /** Number of retry attempts */
    attempts: number;
    /** Retry delay (ms) */
    delay: number;
    /** Whether to use exponential backoff */
    exponentialBackoff: boolean;
  };

  // =============================================================================
  // OPTIMISTIC UPDATES
  // =============================================================================
  
  /** Optimistic update configuration */
  optimistic?: OptimisticUpdateConfig;
  
  /** Background synchronization configuration */
  backgroundSync?: BackgroundSyncConfig;

  // =============================================================================
  // PERFORMANCE OPTIMIZATION
  // =============================================================================
  
  /** Whether to enable request deduplication */
  dedupe?: boolean;
  
  /** Request priority for performance optimization */
  priority?: 'high' | 'normal' | 'low';
  
  /** Whether to use streaming response */
  stream?: boolean;
  
  /** Response transformation function */
  transform?: <T>(data: T) => T;
}

// =============================================================================
// AUTHENTICATION AND AUTHORIZATION
// =============================================================================

/**
 * Authentication configuration for API requests
 */
export interface AuthConfig {
  /** Authentication token */
  token?: string;
  
  /** Token type (Bearer, Basic, etc.) */
  tokenType?: string;
  
  /** Whether to include auth headers */
  includeAuth?: boolean;
  
  /** API key for authentication */
  apiKey?: string;
  
  /** Session ID for session-based auth */
  sessionId?: string;
  
  /** Whether to refresh token automatically */
  autoRefresh?: boolean;
}

/**
 * Token refresh configuration
 */
export interface TokenRefreshConfig {
  /** Refresh token endpoint */
  endpoint: string;
  
  /** Token refresh threshold (seconds before expiry) */
  threshold: number;
  
  /** Whether refresh is automatic */
  automatic: boolean;
  
  /** Retry configuration for token refresh */
  retry: {
    attempts: number;
    delay: number;
  };
}

// =============================================================================
// REACT SUSPENSE INTEGRATION
// =============================================================================

/**
 * Resource state for React Suspense integration
 */
export interface SuspenseResource<T> {
  /** Read function for Suspense */
  read: () => T;
  
  /** Whether resource is loading */
  loading: boolean;
  
  /** Error if resource failed to load */
  error?: ApiError;
  
  /** Resource data */
  data?: T;
}

/**
 * Suspense-compatible resource creator function type
 */
export type SuspenseResourceCreator<T> = (
  promiseOrData: Promise<T> | T
) => SuspenseResource<T>;

// =============================================================================
// COMMON RESPONSE TYPES
// =============================================================================

/**
 * Generic create response for resource creation
 */
export type GenericCreateResponse = GenericListResponse<{ id: number | string }>;

/**
 * Generic update response for resource updates
 */
export interface GenericUpdateResponse {
  /** Updated resource ID */
  id: number | string;
  /** Update timestamp */
  updated_at?: string;
  /** Fields that were updated */
  updated_fields?: string[];
}

/**
 * Generic delete response for resource deletion
 */
export interface GenericDeleteResponse extends GenericSuccessResponse {
  /** Deleted resource ID */
  id: number | string;
  /** Delete timestamp */
  deleted_at?: string;
}

// =============================================================================
// TYPE UTILITIES
// =============================================================================

/**
 * Extract data type from a response type
 */
export type ExtractData<T> = T extends GenericListResponse<infer U> 
  ? U 
  : T extends { data: infer U } 
    ? U 
    : T;

/**
 * Make certain fields optional for update operations
 */
export type PartialUpdate<T, K extends keyof T = keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Create payload type from entity type
 */
export type CreatePayload<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;

/**
 * Update payload type from entity type
 */
export type UpdatePayload<T> = PartialUpdate<T, 'id' | 'created_at' | 'updated_at'>;