/**
 * Middleware Types for DreamFactory React/Next.js Admin Interface
 * 
 * Comprehensive TypeScript type definitions for Next.js middleware functionality,
 * including authentication tokens, security permissions, request/response interfaces,
 * and error handling types ensuring type safety across the middleware pipeline.
 * 
 * Key Features:
 * - Next.js 15.1+ middleware integration with edge runtime support
 * - JWT-based authentication with automatic token refresh capabilities
 * - Role-based access control (RBAC) enforcement
 * - Comprehensive request/response transformation types
 * - Enhanced security with audit logging and header management
 * - Compatible with existing DreamFactory API types and patterns
 * - Server-side rendering and edge function optimization
 * 
 * Performance Requirements:
 * - Middleware processing under 100ms
 * - Type-safe error handling and logging
 * - Memory-efficient request context management
 * 
 * @fileoverview Middleware type definitions for authentication and security
 * @version 1.0.0
 * @since Next.js 15.1+ / React 19.0.0
 */

import type { NextRequest, NextResponse } from 'next/server';
import type { 
  MiddlewareAuthContext,
  MiddlewareAuthResult,
  JWTPayload,
  AuthError,
  AuthErrorCode,
  UserSession,
  RolePermission
} from '../types/auth';
import type { 
  UserProfile,
  AdminProfile,
  PermissionContext,
  RBACRule,
  RouteProtection,
  MiddlewareResponse,
  JWTTokenPayload,
  TokenRefreshResult
} from '../types/user';
import type { 
  HttpMethod,
  HttpStatusCode,
  ApiHeaders,
  AuthHeaders,
  ApiErrorResponse
} from '../types/api';

// ============================================================================
// CORE MIDDLEWARE TYPES
// ============================================================================

/**
 * Next.js middleware configuration for authentication and routing
 * Defines which routes require middleware processing and protection levels
 */
export interface MiddlewareConfig {
  /** Route patterns that require middleware processing */
  matcher: MiddlewareMatcher[];
  
  /** Global middleware settings */
  global?: {
    /** Enable request logging */
    enableLogging?: boolean;
    
    /** Enable performance monitoring */
    enableMetrics?: boolean;
    
    /** Enable security headers */
    enableSecurityHeaders?: boolean;
    
    /** Default redirect for unauthenticated requests */
    defaultRedirect?: string;
    
    /** Maximum request processing time in milliseconds */
    timeout?: number;
  };
  
  /** Environment-specific overrides */
  environment?: {
    development?: Partial<MiddlewareConfig['global']>;
    staging?: Partial<MiddlewareConfig['global']>;
    production?: Partial<MiddlewareConfig['global']>;
  };
}

/**
 * Route matching configuration for middleware processing
 * Supports pattern matching, exclusions, and protection levels
 */
export interface MiddlewareMatcher {
  /** Route pattern to match (supports glob patterns) */
  source: string;
  
  /** Whether route requires authentication */
  requiresAuth?: boolean;
  
  /** Required permissions for route access */
  requiredPermissions?: string[];
  
  /** Required roles for route access */
  requiredRoles?: string[];
  
  /** Admin-only route flag */
  adminOnly?: boolean;
  
  /** Allow guest access */
  allowGuests?: boolean;
  
  /** Route exclusions (sub-patterns to exclude) */
  exclude?: string[];
  
  /** Custom redirect URL for this route */
  redirectTo?: string;
  
  /** HTTP methods to apply middleware to */
  methods?: HttpMethod[];
  
  /** Route priority (higher numbers processed first) */
  priority?: number;
  
  /** Additional route metadata */
  metadata?: {
    /** Route description */
    description?: string;
    
    /** Route category */
    category?: string;
    
    /** Rate limiting configuration */
    rateLimit?: RateLimitConfig;
    
    /** Custom security headers */
    securityHeaders?: Record<string, string>;
  };
}

/**
 * Rate limiting configuration for middleware
 */
export interface RateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number;
  
  /** Time window in milliseconds */
  windowMs: number;
  
  /** Key generation strategy */
  keyGenerator?: 'ip' | 'user' | 'session' | ((req: NextRequest) => string);
  
  /** Skip certain requests */
  skip?: (req: NextRequest) => boolean;
  
  /** Custom rate limit exceeded response */
  onLimitReached?: (req: NextRequest) => NextResponse;
}

// ============================================================================
// REQUEST/RESPONSE INTERFACES
// ============================================================================

/**
 * Enhanced middleware request context with comprehensive authentication data
 * Extends Next.js request with DreamFactory-specific authentication and session management
 */
export interface MiddlewareRequest extends NextRequest {
  /** Authentication context */
  auth: MiddlewareAuthContext;
  
  /** User session data if authenticated */
  session?: UserSession;
  
  /** Parsed JWT token payload */
  token?: JWTTokenPayload;
  
  /** Request metadata */
  metadata: {
    /** Request start time for performance monitoring */
    startTime: number;
    
    /** Unique request identifier */
    requestId: string;
    
    /** Client IP address */
    clientIp: string;
    
    /** User agent information */
    userAgent: string;
    
    /** Geolocation data (if available) */
    geo?: {
      country?: string;
      region?: string;
      city?: string;
      latitude?: string;
      longitude?: string;
    };
    
    /** Request source */
    source: 'browser' | 'api' | 'webhook' | 'system';
  };
  
  /** Security context */
  security: {
    /** CSRF token validation */
    csrfToken?: string;
    
    /** Request signature (if applicable) */
    signature?: string;
    
    /** Security flags */
    flags: {
      /** Request from secure context */
      isSecure: boolean;
      
      /** Request from trusted source */
      isTrusted: boolean;
      
      /** Rate limit status */
      rateLimited: boolean;
      
      /** Suspicious activity detected */
      suspicious: boolean;
    };
  };
}

/**
 * Comprehensive middleware response interface with enhanced security and logging
 * Provides structured response handling for authentication, authorization, and error scenarios
 */
export interface MiddlewareResponseContext {
  /** Whether to continue request processing */
  continue: boolean;
  
  /** Response to send back to client */
  response?: NextResponse;
  
  /** Redirect URL if applicable */
  redirect?: string;
  
  /** HTTP status code */
  statusCode?: HttpStatusCode;
  
  /** Headers to add/modify */
  headers?: Record<string, string>;
  
  /** Cookies to set/clear */
  cookies?: MiddlewareCookie[];
  
  /** Authentication result */
  auth?: MiddlewareAuthResult;
  
  /** Error information */
  error?: MiddlewareError;
  
  /** Response metadata */
  metadata: {
    /** Processing time in milliseconds */
    processingTime: number;
    
    /** Cache directives */
    cache?: {
      /** Cache control header value */
      control: string;
      
      /** Cache tags for revalidation */
      tags?: string[];
      
      /** Revalidation time */
      revalidate?: number;
    };
    
    /** Security context */
    security?: {
      /** Security headers applied */
      headersApplied: string[];
      
      /** Authentication method used */
      authMethod?: 'jwt' | 'session' | 'api-key' | 'none';
      
      /** Authorization checks performed */
      authorizationChecks: string[];
    };
  };
  
  /** Logging context */
  logging?: MiddlewareLogContext;
}

/**
 * Cookie configuration for middleware cookie management
 */
export interface MiddlewareCookie {
  /** Cookie name */
  name: string;
  
  /** Cookie value */
  value: string;
  
  /** Cookie options */
  options?: {
    /** Cookie expiration */
    maxAge?: number;
    
    /** Cookie expiration date */
    expires?: Date;
    
    /** Cookie domain */
    domain?: string;
    
    /** Cookie path */
    path?: string;
    
    /** Secure flag */
    secure?: boolean;
    
    /** HttpOnly flag */
    httpOnly?: boolean;
    
    /** SameSite policy */
    sameSite?: 'strict' | 'lax' | 'none';
  };
  
  /** Cookie action */
  action: 'set' | 'delete' | 'update';
}

// ============================================================================
// AUTHENTICATION AND TOKEN TYPES
// ============================================================================

/**
 * Token validation context for middleware processing
 * Provides comprehensive token analysis and validation results
 */
export interface TokenValidationContext {
  /** Raw token string */
  rawToken: string;
  
  /** Decoded token payload */
  payload?: JWTTokenPayload;
  
  /** Token validation result */
  isValid: boolean;
  
  /** Token expiration status */
  isExpired: boolean;
  
  /** Token issuer validation */
  isValidIssuer: boolean;
  
  /** Token audience validation */
  isValidAudience: boolean;
  
  /** Token signature validation */
  isValidSignature: boolean;
  
  /** Validation errors */
  errors: TokenValidationError[];
  
  /** Token metadata */
  metadata: {
    /** Token type */
    type: 'access' | 'refresh' | 'api-key';
    
    /** Token algorithm */
    algorithm: string;
    
    /** Token version */
    version?: number;
    
    /** Time until expiration (seconds) */
    expiresIn?: number;
    
    /** Token source */
    source: 'header' | 'cookie' | 'query' | 'body';
  };
}

/**
 * Token validation error details
 */
export interface TokenValidationError {
  /** Error code */
  code: TokenErrorCode;
  
  /** Error message */
  message: string;
  
  /** Error field/claim */
  field?: string;
  
  /** Additional error context */
  context?: any;
}

/**
 * Token error codes for validation failures
 */
export enum TokenErrorCode {
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  EXPIRED = 'EXPIRED',
  NOT_BEFORE = 'NOT_BEFORE',
  INVALID_ISSUER = 'INVALID_ISSUER',
  INVALID_AUDIENCE = 'INVALID_AUDIENCE',
  MISSING_CLAIMS = 'MISSING_CLAIMS',
  INVALID_CLAIMS = 'INVALID_CLAIMS',
  REVOKED = 'REVOKED',
  BLACKLISTED = 'BLACKLISTED',
}

/**
 * Session management context for middleware
 */
export interface SessionManagementContext {
  /** Current session data */
  current?: UserSession;
  
  /** Session validation result */
  isValid: boolean;
  
  /** Session needs refresh */
  needsRefresh: boolean;
  
  /** New session data (after refresh) */
  updated?: UserSession;
  
  /** Session metadata */
  metadata: {
    /** Session source */
    source: 'cookie' | 'header' | 'storage';
    
    /** Session age in milliseconds */
    age: number;
    
    /** Last activity timestamp */
    lastActivity: Date;
    
    /** Session expiration */
    expiresAt: Date;
    
    /** Session device/client info */
    device?: {
      /** Device fingerprint */
      fingerprint?: string;
      
      /** Device type */
      type?: 'desktop' | 'mobile' | 'tablet' | 'api';
      
      /** Operating system */
      os?: string;
      
      /** Browser information */
      browser?: string;
    };
  };
  
  /** Session security flags */
  security: {
    /** Session hijacking risk */
    hijackingRisk: 'low' | 'medium' | 'high';
    
    /** IP address changed */
    ipChanged: boolean;
    
    /** User agent changed */
    userAgentChanged: boolean;
    
    /** Suspicious activity */
    suspiciousActivity: boolean;
  };
}

// ============================================================================
// PERMISSION AND RBAC TYPES
// ============================================================================

/**
 * Permission evaluation context for middleware authorization
 */
export interface PermissionEvaluationContext {
  /** User making the request */
  user: UserProfile | AdminProfile;
  
  /** Requested resource */
  resource: string;
  
  /** Requested action */
  action: string;
  
  /** Request context */
  request: {
    /** HTTP method */
    method: HttpMethod;
    
    /** Request path */
    path: string;
    
    /** Query parameters */
    query: Record<string, string | string[]>;
    
    /** Request headers */
    headers: Record<string, string>;
  };
  
  /** Resource context (if applicable) */
  resourceContext?: {
    /** Resource ID */
    id?: string | number;
    
    /** Resource owner */
    owner?: string | number;
    
    /** Resource metadata */
    metadata?: Record<string, any>;
  };
  
  /** Additional context */
  additionalContext?: Record<string, any>;
}

/**
 * Permission evaluation result from middleware
 */
export interface PermissionEvaluationResult {
  /** Access granted */
  granted: boolean;
  
  /** Reason for decision */
  reason: string;
  
  /** Applied rules */
  appliedRules: RBACRule[];
  
  /** Required permissions */
  requiredPermissions: string[];
  
  /** User permissions */
  userPermissions: string[];
  
  /** Permission gaps */
  missingPermissions: string[];
  
  /** Suggested alternatives */
  alternatives?: string[];
  
  /** Evaluation metadata */
  metadata: {
    /** Evaluation time in milliseconds */
    evaluationTime: number;
    
    /** Rules checked */
    rulesChecked: number;
    
    /** Cache hit */
    cacheHit: boolean;
    
    /** Evaluation strategy */
    strategy: 'allow' | 'deny' | 'conditional';
  };
}

/**
 * RBAC cache entry for middleware performance optimization
 */
export interface RBACCacheEntry {
  /** Cache key */
  key: string;
  
  /** Permission result */
  result: PermissionEvaluationResult;
  
  /** Cache timestamp */
  timestamp: number;
  
  /** Cache expiration */
  expiresAt: number;
  
  /** Cache metadata */
  metadata: {
    /** User ID */
    userId: number;
    
    /** Session ID */
    sessionId: string;
    
    /** Resource pattern */
    resourcePattern: string;
    
    /** Hit count */
    hitCount: number;
  };
}

// ============================================================================
// ERROR HANDLING AND LOGGING TYPES
// ============================================================================

/**
 * Middleware-specific error interface with comprehensive context
 */
export interface MiddlewareError extends AuthError {
  /** Error source */
  source: 'authentication' | 'authorization' | 'validation' | 'system' | 'network';
  
  /** Error severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  /** Error category */
  category: 'security' | 'performance' | 'configuration' | 'external';
  
  /** Additional error context */
  additionalContext?: {
    /** Request details */
    request?: {
      method: HttpMethod;
      url: string;
      headers: Record<string, string>;
      ip: string;
      userAgent: string;
    };
    
    /** User context */
    user?: {
      id?: number;
      email?: string;
      sessionId?: string;
    };
    
    /** Stack trace */
    stack?: string;
    
    /** Related errors */
    relatedErrors?: MiddlewareError[];
  };
  
  /** Error recovery suggestions */
  recovery?: {
    /** Retry possible */
    canRetry: boolean;
    
    /** Retry delay */
    retryDelay?: number;
    
    /** Alternative actions */
    alternatives: string[];
    
    /** Recovery instructions */
    instructions?: string;
  };
}

/**
 * Comprehensive logging context for middleware operations
 */
export interface MiddlewareLogContext {
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  
  /** Log message */
  message: string;
  
  /** Log category */
  category: 'auth' | 'authz' | 'security' | 'performance' | 'audit' | 'system';
  
  /** Request context */
  request: {
    /** Request ID */
    id: string;
    
    /** HTTP method */
    method: HttpMethod;
    
    /** Request URL */
    url: string;
    
    /** Client IP */
    clientIp: string;
    
    /** User agent */
    userAgent: string;
    
    /** Request size in bytes */
    size?: number;
  };
  
  /** User context */
  user?: {
    /** User ID */
    id?: number;
    
    /** Username */
    username?: string;
    
    /** User email */
    email?: string;
    
    /** Session ID */
    sessionId?: string;
    
    /** User roles */
    roles?: string[];
  };
  
  /** Performance metrics */
  performance: {
    /** Processing time in milliseconds */
    processingTime: number;
    
    /** Memory usage in bytes */
    memoryUsage?: number;
    
    /** CPU usage percentage */
    cpuUsage?: number;
  };
  
  /** Additional log data */
  data?: Record<string, any>;
  
  /** Log tags for filtering */
  tags?: string[];
  
  /** Correlation ID for distributed tracing */
  correlationId?: string;
}

/**
 * Audit log entry for security and compliance tracking
 */
export interface AuditLogEntry {
  /** Event ID */
  id: string;
  
  /** Event timestamp */
  timestamp: Date;
  
  /** Event type */
  eventType: AuditEventType;
  
  /** Event action */
  action: string;
  
  /** Event result */
  result: 'success' | 'failure' | 'partial';
  
  /** User context */
  user?: {
    id?: number;
    username?: string;
    email?: string;
    sessionId?: string;
    ipAddress: string;
  };
  
  /** Resource context */
  resource?: {
    type: string;
    id?: string | number;
    name?: string;
    path?: string;
  };
  
  /** Event details */
  details: Record<string, any>;
  
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  /** Compliance flags */
  compliance?: {
    /** GDPR relevant */
    gdpr?: boolean;
    
    /** SOX relevant */
    sox?: boolean;
    
    /** HIPAA relevant */
    hipaa?: boolean;
    
    /** Custom compliance flags */
    custom?: Record<string, boolean>;
  };
}

/**
 * Audit event types for security tracking
 */
export enum AuditEventType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  SESSION_MANAGEMENT = 'session_management',
  DATA_ACCESS = 'data_access',
  CONFIGURATION_CHANGE = 'configuration_change',
  SECURITY_VIOLATION = 'security_violation',
  SYSTEM_EVENT = 'system_event',
  USER_ACTION = 'user_action',
}

// ============================================================================
// API TRANSFORMATION TYPES
// ============================================================================

/**
 * Request transformation context for middleware processing
 */
export interface RequestTransformationContext {
  /** Original request */
  originalRequest: NextRequest;
  
  /** Transformation rules */
  rules: RequestTransformationRule[];
  
  /** Transformation result */
  result: {
    /** Transformed headers */
    headers: Record<string, string>;
    
    /** Transformed URL */
    url?: string;
    
    /** Transformed body */
    body?: any;
    
    /** Applied transformations */
    transformations: string[];
  };
  
  /** Transformation metadata */
  metadata: {
    /** Processing time */
    processingTime: number;
    
    /** Transformation errors */
    errors: TransformationError[];
    
    /** Transformation warnings */
    warnings: string[];
  };
}

/**
 * Request transformation rule definition
 */
export interface RequestTransformationRule {
  /** Rule name */
  name: string;
  
  /** Rule condition */
  condition: (req: NextRequest) => boolean;
  
  /** Header transformations */
  headers?: {
    /** Headers to add */
    add?: Record<string, string>;
    
    /** Headers to remove */
    remove?: string[];
    
    /** Headers to modify */
    modify?: Record<string, (value: string) => string>;
  };
  
  /** URL transformations */
  url?: {
    /** Add query parameters */
    addQuery?: Record<string, string>;
    
    /** Remove query parameters */
    removeQuery?: string[];
    
    /** Modify path */
    modifyPath?: (path: string) => string;
  };
  
  /** Body transformations */
  body?: {
    /** Transform function */
    transform?: (body: any) => any;
    
    /** Validation schema */
    validate?: (body: any) => boolean;
  };
  
  /** Rule priority */
  priority: number;
  
  /** Rule enabled */
  enabled: boolean;
}

/**
 * Transformation error details
 */
export interface TransformationError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Rule that caused error */
  rule: string;
  
  /** Error context */
  context?: any;
}

/**
 * Response transformation context for middleware processing
 */
export interface ResponseTransformationContext {
  /** Original response */
  originalResponse: NextResponse;
  
  /** Transformation rules */
  rules: ResponseTransformationRule[];
  
  /** Transformation result */
  result: {
    /** Transformed headers */
    headers: Record<string, string>;
    
    /** Transformed body */
    body?: any;
    
    /** Transformed status */
    status?: HttpStatusCode;
    
    /** Applied transformations */
    transformations: string[];
  };
  
  /** Transformation metadata */
  metadata: {
    /** Processing time */
    processingTime: number;
    
    /** Transformation errors */
    errors: TransformationError[];
    
    /** Transformation warnings */
    warnings: string[];
  };
}

/**
 * Response transformation rule definition
 */
export interface ResponseTransformationRule {
  /** Rule name */
  name: string;
  
  /** Rule condition */
  condition: (res: NextResponse, req: NextRequest) => boolean;
  
  /** Header transformations */
  headers?: {
    /** Headers to add */
    add?: Record<string, string>;
    
    /** Headers to remove */
    remove?: string[];
    
    /** Headers to modify */
    modify?: Record<string, (value: string) => string>;
  };
  
  /** Body transformations */
  body?: {
    /** Transform function */
    transform?: (body: any) => any;
    
    /** Validation schema */
    validate?: (body: any) => boolean;
  };
  
  /** Status transformations */
  status?: {
    /** Status code mapping */
    map?: Record<number, number>;
    
    /** Conditional status changes */
    conditional?: Array<{
      condition: (res: NextResponse, req: NextRequest) => boolean;
      status: HttpStatusCode;
    }>;
  };
  
  /** Rule priority */
  priority: number;
  
  /** Rule enabled */
  enabled: boolean;
}

// ============================================================================
// SECURITY HEADER MANAGEMENT TYPES
// ============================================================================

/**
 * Security header configuration for middleware
 */
export interface SecurityHeaderConfig {
  /** Content Security Policy */
  contentSecurityPolicy?: {
    /** CSP directives */
    directives: Record<string, string[]>;
    
    /** Report only mode */
    reportOnly?: boolean;
    
    /** Report URI */
    reportUri?: string;
  };
  
  /** Strict Transport Security */
  strictTransportSecurity?: {
    /** Max age in seconds */
    maxAge: number;
    
    /** Include subdomains */
    includeSubDomains?: boolean;
    
    /** Preload */
    preload?: boolean;
  };
  
  /** X-Frame-Options */
  frameOptions?: 'DENY' | 'SAMEORIGIN' | string;
  
  /** X-Content-Type-Options */
  contentTypeOptions?: 'nosniff';
  
  /** X-XSS-Protection */
  xssProtection?: '1; mode=block' | '0' | string;
  
  /** Referrer Policy */
  referrerPolicy?: 
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
  
  /** Permissions Policy */
  permissionsPolicy?: Record<string, string[]>;
  
  /** Custom security headers */
  custom?: Record<string, string>;
}

/**
 * CORS configuration for middleware
 */
export interface CorsConfig {
  /** Allowed origins */
  allowedOrigins: string[] | '*';
  
  /** Allowed methods */
  allowedMethods: HttpMethod[];
  
  /** Allowed headers */
  allowedHeaders: string[];
  
  /** Exposed headers */
  exposedHeaders?: string[];
  
  /** Allow credentials */
  allowCredentials?: boolean;
  
  /** Max age for preflight cache */
  maxAge?: number;
  
  /** Options success status */
  optionsSuccessStatus?: number;
}

// ============================================================================
// PERFORMANCE MONITORING TYPES
// ============================================================================

/**
 * Middleware performance metrics
 */
export interface MiddlewareMetrics {
  /** Request processing time */
  processingTime: number;
  
  /** Memory usage */
  memoryUsage: {
    /** Heap used in bytes */
    heapUsed: number;
    
    /** Heap total in bytes */
    heapTotal: number;
    
    /** External memory in bytes */
    external: number;
  };
  
  /** Authentication metrics */
  authentication: {
    /** Token validation time */
    tokenValidationTime: number;
    
    /** Session lookup time */
    sessionLookupTime: number;
    
    /** Permission check time */
    permissionCheckTime: number;
  };
  
  /** Cache metrics */
  cache: {
    /** Cache hits */
    hits: number;
    
    /** Cache misses */
    misses: number;
    
    /** Cache hit ratio */
    hitRatio: number;
  };
  
  /** Network metrics */
  network: {
    /** Request size in bytes */
    requestSize: number;
    
    /** Response size in bytes */
    responseSize: number;
    
    /** Network latency in milliseconds */
    latency: number;
  };
}

/**
 * Middleware health check result
 */
export interface MiddlewareHealthCheck {
  /** Overall health status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  
  /** Component health */
  components: {
    /** Authentication service */
    auth: HealthStatus;
    
    /** Permission service */
    permissions: HealthStatus;
    
    /** Session management */
    sessions: HealthStatus;
    
    /** Cache service */
    cache: HealthStatus;
    
    /** Database connectivity */
    database: HealthStatus;
  };
  
  /** Performance indicators */
  performance: {
    /** Average response time */
    averageResponseTime: number;
    
    /** 95th percentile response time */
    p95ResponseTime: number;
    
    /** Error rate */
    errorRate: number;
    
    /** Throughput (requests per second) */
    throughput: number;
  };
  
  /** Health check timestamp */
  timestamp: Date;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Component health status
 */
export interface HealthStatus {
  /** Component status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  
  /** Status message */
  message?: string;
  
  /** Last check time */
  lastCheck: Date;
  
  /** Response time */
  responseTime?: number;
  
  /** Additional details */
  details?: Record<string, any>;
}

// ============================================================================
// UTILITY TYPES AND HELPERS
// ============================================================================

/**
 * Middleware function signature
 */
export type MiddlewareFunction = (
  request: MiddlewareRequest,
  event?: any
) => Promise<MiddlewareResponseContext> | MiddlewareResponseContext;

/**
 * Middleware chain for composing multiple middleware functions
 */
export interface MiddlewareChain {
  /** Middleware functions in execution order */
  middlewares: MiddlewareFunction[];
  
  /** Execute the middleware chain */
  execute: (request: MiddlewareRequest) => Promise<MiddlewareResponseContext>;
  
  /** Add middleware to chain */
  use: (middleware: MiddlewareFunction) => MiddlewareChain;
  
  /** Chain metadata */
  metadata: {
    /** Total middlewares */
    count: number;
    
    /** Execution order */
    order: string[];
  };
}

/**
 * Route cache entry for middleware optimization
 */
export interface RouteCacheEntry {
  /** Route pattern */
  pattern: string;
  
  /** Protection configuration */
  protection: RouteProtection;
  
  /** Cache timestamp */
  timestamp: number;
  
  /** Cache TTL */
  ttl: number;
  
  /** Hit count */
  hitCount: number;
}

/**
 * Middleware context factory for creating request contexts
 */
export interface MiddlewareContextFactory {
  /** Create authentication context */
  createAuthContext: (request: NextRequest) => Promise<MiddlewareAuthContext>;
  
  /** Create session context */
  createSessionContext: (request: NextRequest) => Promise<SessionManagementContext>;
  
  /** Create permission context */
  createPermissionContext: (
    request: NextRequest,
    user: UserProfile
  ) => Promise<PermissionEvaluationContext>;
  
  /** Create logging context */
  createLogContext: (
    request: NextRequest,
    level: MiddlewareLogContext['level'],
    message: string
  ) => MiddlewareLogContext;
}

// ============================================================================
// TYPE EXPORTS AND UTILITIES
// ============================================================================

/**
 * Type guard to check if error is a middleware error
 */
export function isMiddlewareError(error: any): error is MiddlewareError {
  return error && typeof error === 'object' && 'source' in error && 'severity' in error;
}

/**
 * Type guard to check if response requires redirect
 */
export function requiresRedirect(response: MiddlewareResponseContext): boolean {
  return !response.continue && !!response.redirect;
}

/**
 * Type guard to check if token validation failed
 */
export function isTokenValidationFailure(context: TokenValidationContext): boolean {
  return !context.isValid || context.errors.length > 0;
}

/**
 * Type guard to check if permission check failed
 */
export function isPermissionDenied(result: PermissionEvaluationResult): boolean {
  return !result.granted;
}

/**
 * Extract user ID from JWT token payload
 */
export type ExtractUserId<T> = T extends { sub: infer U } ? U : never;

/**
 * Extract permissions from user session
 */
export type ExtractPermissions<T> = T extends { permissions: infer U } ? U : string[];

/**
 * Extract roles from user profile
 */
export type ExtractRoles<T> = T extends { role: infer U } ? U : never;

// Export all middleware types for convenient importing
export type {
  // Core middleware
  MiddlewareConfig,
  MiddlewareMatcher,
  RateLimitConfig,
  
  // Request/Response
  MiddlewareRequest,
  MiddlewareResponseContext,
  MiddlewareCookie,
  
  // Authentication & Tokens
  TokenValidationContext,
  TokenValidationError,
  SessionManagementContext,
  
  // Permissions & RBAC
  PermissionEvaluationContext,
  PermissionEvaluationResult,
  RBACCacheEntry,
  
  // Error Handling & Logging
  MiddlewareError,
  MiddlewareLogContext,
  AuditLogEntry,
  
  // API Transformation
  RequestTransformationContext,
  RequestTransformationRule,
  ResponseTransformationContext,
  ResponseTransformationRule,
  TransformationError,
  
  // Security Headers
  SecurityHeaderConfig,
  CorsConfig,
  
  // Performance & Monitoring
  MiddlewareMetrics,
  MiddlewareHealthCheck,
  HealthStatus,
  
  // Utilities
  MiddlewareFunction,
  MiddlewareChain,
  RouteCacheEntry,
  MiddlewareContextFactory,
};

// Export enums
export {
  TokenErrorCode,
  AuditEventType,
};

// Export type guards and utilities
export {
  isMiddlewareError,
  requiresRedirect,
  isTokenValidationFailure,
  isPermissionDenied,
};