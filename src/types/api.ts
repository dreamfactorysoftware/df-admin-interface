/**
 * Core API types for React/Next.js refactor of DreamFactory Admin Interface
 * 
 * Provides comprehensive type definitions for HTTP request/response patterns,
 * pagination, error handling, authentication, and integration with modern
 * data fetching libraries (SWR/React Query) while maintaining full
 * compatibility with DreamFactory backend APIs.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { z } from 'zod'

// =============================================================================
// HTTP METHOD AND STATUS TYPES
// =============================================================================

/**
 * Standard HTTP methods supported by DreamFactory APIs
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

/**
 * HTTP status codes with semantic groupings for error handling
 */
export type HttpStatusCode = 
  | 200 | 201 | 202 | 204  // Success
  | 400 | 401 | 403 | 404 | 409 | 422  // Client errors
  | 500 | 501 | 502 | 503 | 504  // Server errors

/**
 * Status code categories for React Error Boundary integration
 */
export type StatusCategory = 'success' | 'client_error' | 'server_error' | 'network_error'

// =============================================================================
// GENERIC API RESPONSE STRUCTURES
// =============================================================================

/**
 * Standard success response structure from DreamFactory APIs
 * Maintains compatibility with existing backend while adding React Query support
 */
export interface ApiSuccessResponse {
  success: boolean
}

/**
 * Enhanced error response structure with React Error Boundary integration
 * Supports granular error handling and user-friendly error messages
 */
export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    status_code: HttpStatusCode
    context?: string | {
      error?: Array<ValidationError>
      resource?: Array<ApiErrorResponse>
      details?: Record<string, unknown>
    }
    trace_id?: string  // For distributed tracing
    timestamp?: string  // ISO 8601 timestamp
  }
}

/**
 * Validation error structure for form field-level error handling
 */
export interface ValidationError {
  field: string
  code: string
  message: string
  value?: unknown
}

/**
 * Pagination metadata for list responses
 * Enhanced with React Query infinite loading support
 */
export interface PaginationMeta {
  count: number
  limit: number
  offset: number
  total?: number
  has_more?: boolean  // For infinite scroll
  next_cursor?: string  // For cursor-based pagination
  prev_cursor?: string
}

/**
 * Generic list response structure with enhanced pagination
 * Compatible with SWR/React Query data fetching patterns
 */
export interface ApiListResponse<T> {
  resource: Array<T>
  meta: PaginationMeta
}

/**
 * Generic create response with resource ID
 */
export interface ApiCreateResponse {
  id: number | string
}

/**
 * Generic update response with resource ID
 */
export interface ApiUpdateResponse {
  id: number | string
  updated_at?: string  // ISO 8601 timestamp
}

/**
 * Generic delete response
 */
export interface ApiDeleteResponse extends ApiSuccessResponse {
  id: number | string
  deleted_at?: string  // ISO 8601 timestamp
}

// =============================================================================
// REQUEST CONFIGURATION AND OPTIONS
// =============================================================================

/**
 * Key-value pair structure for dynamic headers and parameters
 */
export interface KeyValuePair {
  key: string
  value: string | number | boolean
}

/**
 * Comprehensive request options supporting all DreamFactory API features
 * Optimized for modern data fetching libraries with performance considerations
 */
export interface ApiRequestOptions {
  // Pagination and data retrieval
  limit?: number
  offset?: number
  cursor?: string  // For cursor-based pagination
  
  // Filtering and sorting
  filter?: string
  sort?: string
  search?: string
  
  // Field selection and relationships
  fields?: string | string[]
  related?: string | string[]
  include_count?: boolean
  include_schema?: boolean
  
  // Caching and performance
  cache_ttl?: number  // Cache time-to-live in seconds
  refresh?: boolean  // Force cache refresh
  stale_while_revalidate?: boolean  // SWR pattern
  
  // Request customization
  headers?: Record<string, string> | KeyValuePair[]
  params?: Record<string, unknown> | KeyValuePair[]
  content_type?: string
  
  // UI/UX options
  show_spinner?: boolean
  snackbar_success?: string
  snackbar_error?: string
  
  // Development and debugging
  debug?: boolean
  trace_requests?: boolean
}

/**
 * Fetch configuration extending native RequestInit for Next.js compatibility
 * Supports both client-side and server-side rendering contexts
 */
export interface FetchConfig extends Omit<RequestInit, 'method' | 'body'> {
  method?: HttpMethod
  body?: string | FormData | URLSearchParams
  timeout?: number
  retry_count?: number
  retry_delay?: number
  base_url?: string
  
  // Next.js specific options
  revalidate?: number | false  // ISR revalidation
  tags?: string[]  // Cache tags for invalidation
  server_only?: boolean  // Server components only
}

// =============================================================================
// AUTHENTICATION AND SECURITY
// =============================================================================

/**
 * Authentication request payload for login
 */
export interface AuthLoginRequest {
  username?: string
  email?: string
  password: string
  remember_me?: boolean
  duration?: number  // Session duration in seconds
}

/**
 * Enhanced authentication response with comprehensive session data
 * Supports JWT tokens and Next.js middleware integration
 */
export interface AuthLoginResponse {
  session_token?: string
  sessionToken?: string  // Alternative format
  session_id?: string
  user_id: number | string
  user_email?: string
  user_name?: string
  expires_at?: string  // ISO 8601 timestamp
  refresh_token?: string
  roles?: string[]
  permissions?: string[]
  last_login?: string
  
  // Additional properties for flexibility
  [key: string]: unknown
}

/**
 * Token refresh request
 */
export interface AuthRefreshRequest {
  refresh_token: string
}

/**
 * Authentication headers for API requests
 * Compatible with both client-side and server-side rendering
 */
export interface AuthHeaders {
  'X-DreamFactory-Session-Token'?: string
  'Authorization'?: string  // Bearer token format
  'X-DreamFactory-API-Key'?: string
  'Content-Type'?: string
  'Accept'?: string
}

/**
 * Role-based access control (RBAC) types
 */
export interface UserRole {
  id: number | string
  name: string
  description?: string
  permissions?: Permission[]
}

export interface Permission {
  service: string
  resource: string
  action: string  // GET, POST, PUT, DELETE, etc.
  allow: boolean
  filters?: Record<string, unknown>
}

// =============================================================================
// SWR AND REACT QUERY INTEGRATION
// =============================================================================

/**
 * SWR configuration for consistent data fetching
 * Optimized for DreamFactory API patterns
 */
export interface SWRConfig<T = unknown> {
  refreshInterval?: number
  revalidateOnFocus?: boolean
  revalidateOnReconnect?: boolean
  revalidateIfStale?: boolean
  dedupingInterval?: number
  errorRetryCount?: number
  errorRetryInterval?: number
  loadingTimeout?: number
  suspense?: boolean
  fallbackData?: T
  keepPreviousData?: boolean
}

/**
 * React Query options for server state management
 */
export interface QueryConfig<T = unknown> {
  queryKey: string | string[]
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
  refetchOnMount?: boolean | 'always'
  refetchOnWindowFocus?: boolean | 'always'
  refetchOnReconnect?: boolean | 'always'
  refetchInterval?: number | false
  retry?: boolean | number
  retryDelay?: number
  initialData?: T
  placeholderData?: T
  keepPreviousData?: boolean
  suspense?: boolean
  useErrorBoundary?: boolean
}

/**
 * Mutation configuration for React Query
 */
export interface MutationConfig<TData = unknown, TError = ApiErrorResponse, TVariables = unknown> {
  onMutate?: (variables: TVariables) => Promise<unknown> | unknown
  onSuccess?: (data: TData, variables: TVariables, context: unknown) => Promise<unknown> | unknown
  onError?: (error: TError, variables: TVariables, context: unknown) => Promise<unknown> | unknown
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: unknown) => Promise<unknown> | unknown
  retry?: boolean | number
  retryDelay?: number
  useErrorBoundary?: boolean
}

// =============================================================================
// ERROR HANDLING FOR REACT ERROR BOUNDARIES
// =============================================================================

/**
 * Error boundary compatible error structure
 * Provides comprehensive error context for React Error Boundary components
 */
export interface BoundaryError extends Error {
  name: string
  message: string
  stack?: string
  
  // API-specific error information
  status_code?: HttpStatusCode
  status_category?: StatusCategory
  api_error?: ApiErrorResponse
  request_id?: string
  trace_id?: string
  
  // Component and context information
  component_stack?: string
  error_boundary?: string
  retry_count?: number
  timestamp?: Date
  
  // User-friendly information
  user_message?: string
  recovery_suggestions?: string[]
  contact_support?: boolean
}

/**
 * Error recovery actions for error boundaries
 */
export interface ErrorRecoveryAction {
  label: string
  action: () => void | Promise<void>
  primary?: boolean
}

/**
 * Error boundary context for error reporting and recovery
 */
export interface ErrorBoundaryContext {
  error: BoundaryError
  errorInfo?: {
    componentStack: string
  }
  retry: () => void
  reset: () => void
  recovery_actions?: ErrorRecoveryAction[]
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod schema for HTTP status codes
 */
export const HttpStatusCodeSchema = z.union([
  z.literal(200), z.literal(201), z.literal(202), z.literal(204),
  z.literal(400), z.literal(401), z.literal(403), z.literal(404), z.literal(409), z.literal(422),
  z.literal(500), z.literal(501), z.literal(502), z.literal(503), z.literal(504)
])

/**
 * Zod schema for API error responses
 */
export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    status_code: HttpStatusCodeSchema,
    context: z.union([
      z.string(),
      z.object({
        error: z.array(z.object({
          field: z.string(),
          code: z.string(),
          message: z.string(),
          value: z.unknown().optional()
        })).optional(),
        resource: z.array(z.lazy(() => ApiErrorResponseSchema)).optional(),
        details: z.record(z.unknown()).optional()
      })
    ]).optional(),
    trace_id: z.string().optional(),
    timestamp: z.string().optional()
  })
})

/**
 * Zod schema for pagination metadata
 */
export const PaginationMetaSchema = z.object({
  count: z.number().min(0),
  limit: z.number().min(1),
  offset: z.number().min(0),
  total: z.number().min(0).optional(),
  has_more: z.boolean().optional(),
  next_cursor: z.string().optional(),
  prev_cursor: z.string().optional()
})

/**
 * Zod schema for API request options
 */
export const ApiRequestOptionsSchema = z.object({
  limit: z.number().min(1).max(1000).optional(),
  offset: z.number().min(0).optional(),
  cursor: z.string().optional(),
  filter: z.string().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  fields: z.union([z.string(), z.array(z.string())]).optional(),
  related: z.union([z.string(), z.array(z.string())]).optional(),
  include_count: z.boolean().optional(),
  include_schema: z.boolean().optional(),
  cache_ttl: z.number().min(0).optional(),
  refresh: z.boolean().optional(),
  stale_while_revalidate: z.boolean().optional(),
  headers: z.union([
    z.record(z.string()),
    z.array(z.object({
      key: z.string(),
      value: z.union([z.string(), z.number(), z.boolean()])
    }))
  ]).optional(),
  params: z.union([
    z.record(z.unknown()),
    z.array(z.object({
      key: z.string(),
      value: z.union([z.string(), z.number(), z.boolean()])
    }))
  ]).optional(),
  content_type: z.string().optional(),
  show_spinner: z.boolean().optional(),
  snackbar_success: z.string().optional(),
  snackbar_error: z.string().optional(),
  debug: z.boolean().optional(),
  trace_requests: z.boolean().optional()
})

/**
 * Zod schema for authentication login request
 */
export const AuthLoginRequestSchema = z.object({
  username: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(1),
  remember_me: z.boolean().optional(),
  duration: z.number().min(1).optional()
}).refine(
  (data) => data.username || data.email,
  {
    message: "Either username or email must be provided",
    path: ["username"]
  }
)

/**
 * Zod schema for authentication response
 */
export const AuthLoginResponseSchema = z.object({
  session_token: z.string().optional(),
  sessionToken: z.string().optional(),
  session_id: z.string().optional(),
  user_id: z.union([z.number(), z.string()]),
  user_email: z.string().email().optional(),
  user_name: z.string().optional(),
  expires_at: z.string().optional(),
  refresh_token: z.string().optional(),
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
  last_login: z.string().optional()
}).catchall(z.unknown())

// =============================================================================
// NEXT.JS SPECIFIC TYPES
// =============================================================================

/**
 * Next.js API route handler context
 */
export interface NextApiContext {
  req: {
    method?: HttpMethod
    headers: Record<string, string | string[]>
    query: Record<string, string | string[]>
    body?: unknown
    cookies: Record<string, string>
  }
  res: {
    status: (code: HttpStatusCode) => void
    json: (data: unknown) => void
    setHeader: (name: string, value: string) => void
    redirect: (url: string) => void
  }
}

/**
 * Server-side rendering data fetching context
 */
export interface SSRContext {
  req: NextApiContext['req']
  res: NextApiContext['res']
  query: Record<string, string | string[]>
  params?: Record<string, string>
  preview?: boolean
  previewData?: unknown
}

/**
 * Static generation context for ISR
 */
export interface StaticContext {
  params?: Record<string, string>
  preview?: boolean
  previewData?: unknown
}

// =============================================================================
// TYPE UTILITIES AND HELPERS
// =============================================================================

/**
 * Extract data type from API list response
 */
export type ExtractListData<T> = T extends ApiListResponse<infer U> ? U : never

/**
 * Extract data type from API response
 */
export type ExtractApiData<T> = T extends { resource: infer U } 
  ? U extends Array<infer V> ? V : U
  : T

/**
 * Create paginated response type
 */
export type PaginatedResponse<T> = ApiListResponse<T>

/**
 * Create API endpoint configuration
 */
export interface ApiEndpoint<TRequest = unknown, TResponse = unknown> {
  method: HttpMethod
  path: string
  request_schema?: z.ZodSchema<TRequest>
  response_schema?: z.ZodSchema<TResponse>
  auth_required?: boolean
  permissions?: string[]
  rate_limit?: {
    requests: number
    window: number  // seconds
  }
}

/**
 * Type-safe API client configuration
 */
export interface ApiClientConfig {
  base_url: string
  default_headers?: Record<string, string>
  timeout?: number
  retry_config?: {
    attempts: number
    delay: number
    backoff_factor?: number
  }
  auth?: {
    type: 'session' | 'bearer' | 'api_key'
    token?: string
    header_name?: string
  }
}

// =============================================================================
// MOCK SERVICE WORKER (MSW) TYPES
// =============================================================================

/**
 * MSW mock response configuration for development
 */
export interface MockResponse<T = unknown> {
  status: HttpStatusCode
  data: T
  delay?: number
  headers?: Record<string, string>
}

/**
 * Mock endpoint handler configuration
 */
export interface MockEndpoint<TRequest = unknown, TResponse = unknown> {
  method: HttpMethod
  path: string
  handler: (req: TRequest) => MockResponse<TResponse> | Promise<MockResponse<TResponse>>
  enabled?: boolean
}

/**
 * Development mock configuration
 */
export interface MockConfig {
  enabled: boolean
  base_url: string
  endpoints: MockEndpoint[]
  default_delay?: number
  error_rate?: number  // 0-1, percentage of requests that should fail
}

// =============================================================================
// EXPORTS FOR EXTERNAL USE
// =============================================================================

export type {
  // Core response types
  ApiSuccessResponse,
  ApiErrorResponse,
  ValidationError,
  PaginationMeta,
  ApiListResponse,
  ApiCreateResponse,
  ApiUpdateResponse,
  ApiDeleteResponse,
  
  // Request configuration
  KeyValuePair,
  ApiRequestOptions,
  FetchConfig,
  
  // Authentication
  AuthLoginRequest,
  AuthLoginResponse,
  AuthRefreshRequest,
  AuthHeaders,
  UserRole,
  Permission,
  
  // Data fetching
  SWRConfig,
  QueryConfig,
  MutationConfig,
  
  // Error handling
  BoundaryError,
  ErrorRecoveryAction,
  ErrorBoundaryContext,
  
  // Next.js integration
  NextApiContext,
  SSRContext,
  StaticContext,
  
  // Utilities
  ExtractListData,
  ExtractApiData,
  PaginatedResponse,
  ApiEndpoint,
  ApiClientConfig,
  
  // Development
  MockResponse,
  MockEndpoint,
  MockConfig
}

export {
  // Validation schemas
  HttpStatusCodeSchema,
  ApiErrorResponseSchema,
  PaginationMetaSchema,
  ApiRequestOptionsSchema,
  AuthLoginRequestSchema,
  AuthLoginResponseSchema
}