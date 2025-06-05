/**
 * Authentication types adapted for Next.js middleware-based session management and RBAC enforcement.
 * Supports serverless authentication patterns with Next.js runtime secrets integration.
 * 
 * @fileoverview This module provides comprehensive authentication type definitions for:
 * - Next.js middleware-based authentication flows
 * - Server-side session validation and token management
 * - Role-based access control (RBAC) enforcement
 * - Serverless authentication patterns
 * - Next.js runtime secrets integration
 * - Token refresh patterns optimized for serverless functions
 */

import type { GenericSuccessResponse, GenericErrorResponse } from './generic-http';

// =============================================================================
// LOGIN & SESSION MANAGEMENT
// =============================================================================

/**
 * Enhanced login response interface supporting Next.js session patterns.
 * Provides compatibility with both legacy session_token and modern sessionToken patterns.
 */
export interface LoginResponse extends GenericSuccessResponse {
  /** Legacy session token field for backward compatibility */
  session_token?: string;
  /** Modern session token field aligned with Next.js auth patterns */
  sessionToken?: string;
  /** JWT access token for API authentication */
  access_token?: string;
  /** Refresh token for serverless token renewal */
  refresh_token?: string;
  /** Token expiration timestamp (Unix timestamp) */
  expires_at?: number;
  /** Token expiration duration in seconds */
  expires_in?: number;
  /** User profile data embedded in login response */
  user?: SessionUser;
  /** User permissions and roles for RBAC enforcement */
  permissions?: UserPermissions;
  /** Additional metadata for Next.js middleware processing */
  metadata?: SessionMetadata;
  /** Allow additional properties for extensibility */
  [key: string]: any;
}

/**
 * Comprehensive user session data structure for Next.js middleware and React components.
 * Optimized for server-side rendering and client-side hydration patterns.
 */
export interface UserSession {
  /** Unique session identifier */
  id: string;
  /** User profile information */
  user: SessionUser;
  /** Authentication tokens */
  tokens: SessionTokens;
  /** User permissions and roles */
  permissions: UserPermissions;
  /** Session metadata and configuration */
  metadata: SessionMetadata;
  /** Session creation timestamp */
  createdAt: Date;
  /** Last activity timestamp for timeout management */
  lastActivity: Date;
  /** Session expiration timestamp */
  expiresAt: Date;
  /** Whether session is valid and active */
  isValid: boolean;
  /** Whether session requires refresh */
  requiresRefresh: boolean;
}

/**
 * Session user profile data optimized for React component consumption.
 */
export interface SessionUser {
  /** User ID */
  id: number;
  /** User email address */
  email: string;
  /** Display name */
  name?: string;
  /** First name */
  first_name?: string;
  /** Last name */
  last_name?: string;
  /** User role information */
  role?: UserRole;
  /** Avatar URL */
  avatar_url?: string;
  /** Account status */
  is_active: boolean;
  /** Whether user is system administrator */
  is_sys_admin: boolean;
  /** Last login timestamp */
  last_login_date?: string;
  /** Account creation timestamp */
  created_date?: string;
  /** Additional user attributes */
  [key: string]: any;
}

/**
 * Authentication token container for Next.js middleware processing.
 */
export interface SessionTokens {
  /** JWT access token */
  accessToken: string;
  /** Refresh token for token renewal */
  refreshToken?: string;
  /** Token type (typically 'Bearer') */
  tokenType: string;
  /** Access token expiration timestamp */
  accessTokenExpiresAt: Date;
  /** Refresh token expiration timestamp */
  refreshTokenExpiresAt?: Date;
  /** Scopes granted to the tokens */
  scopes?: string[];
}

/**
 * Session metadata for Next.js middleware and server-side processing.
 */
export interface SessionMetadata {
  /** Client IP address */
  ipAddress?: string;
  /** User agent string */
  userAgent?: string;
  /** Session origin (web, mobile, api) */
  origin: 'web' | 'mobile' | 'api';
  /** Device fingerprint for security */
  deviceFingerprint?: string;
  /** Geographic location */
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  /** Session flags */
  flags: {
    /** Whether session requires 2FA verification */
    requiresTwoFactor: boolean;
    /** Whether session is from trusted device */
    isTrustedDevice: boolean;
    /** Whether session has elevated privileges */
    hasElevatedPrivileges: boolean;
  };
}

// =============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC)
// =============================================================================

/**
 * User role information for RBAC enforcement.
 */
export interface UserRole {
  /** Role ID */
  id: number;
  /** Role name */
  name: string;
  /** Role description */
  description?: string;
  /** Whether role is system role */
  is_system: boolean;
  /** Whether role is active */
  is_active: boolean;
  /** Role permissions */
  permissions?: RolePermission[];
}

/**
 * Comprehensive user permissions structure for middleware-based RBAC.
 */
export interface UserPermissions {
  /** Service-specific permissions */
  services: ServicePermissions;
  /** System-level permissions */
  system: SystemPermissions;
  /** API endpoint permissions */
  endpoints: EndpointPermissions;
  /** Role-based permissions */
  roles: string[];
  /** Permission cache metadata */
  cache: PermissionCacheMetadata;
}

/**
 * Service-level permissions for database and API services.
 */
export interface ServicePermissions {
  /** Database service permissions by service ID */
  [serviceId: string]: {
    /** Read access to service */
    read: boolean;
    /** Write access to service */
    write: boolean;
    /** Delete access to service */
    delete: boolean;
    /** Schema discovery access */
    schema: boolean;
    /** Service administration access */
    admin: boolean;
    /** Allowed operations */
    operations: string[];
    /** Table-specific permissions */
    tables?: {
      [tableName: string]: TablePermissions;
    };
  };
}

/**
 * Table-level permissions for granular access control.
 */
export interface TablePermissions {
  /** Read access to table */
  read: boolean;
  /** Write access to table */
  write: boolean;
  /** Delete access to table */
  delete: boolean;
  /** Field-level permissions */
  fields?: {
    [fieldName: string]: FieldPermissions;
  };
}

/**
 * Field-level permissions for maximum granularity.
 */
export interface FieldPermissions {
  /** Read access to field */
  read: boolean;
  /** Write access to field */
  write: boolean;
}

/**
 * System-level administrative permissions.
 */
export interface SystemPermissions {
  /** User management access */
  userManagement: boolean;
  /** Role management access */
  roleManagement: boolean;
  /** Service configuration access */
  serviceConfig: boolean;
  /** System configuration access */
  systemConfig: boolean;
  /** API documentation access */
  apiDocs: boolean;
  /** Script management access */
  scriptManagement: boolean;
  /** File management access */
  fileManagement: boolean;
  /** Backup/restore access */
  backupRestore: boolean;
  /** Audit log access */
  auditLogs: boolean;
}

/**
 * API endpoint permissions for fine-grained access control.
 */
export interface EndpointPermissions {
  /** Allowed HTTP methods by endpoint pattern */
  [endpointPattern: string]: {
    /** Allowed HTTP methods */
    methods: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[];
    /** Rate limit configuration */
    rateLimit?: {
      /** Requests per time window */
      requests: number;
      /** Time window in seconds */
      window: number;
    };
  };
}

/**
 * Role permission definition for middleware validation.
 */
export interface RolePermission {
  /** Permission ID */
  id: number;
  /** Permission name */
  name: string;
  /** Permission description */
  description?: string;
  /** Permission category */
  category: 'service' | 'system' | 'endpoint';
  /** Permission scope */
  scope: string;
  /** Permission action */
  action: string;
  /** Whether permission is active */
  is_active: boolean;
}

/**
 * Permission cache metadata for optimization.
 */
export interface PermissionCacheMetadata {
  /** Cache timestamp */
  cachedAt: Date;
  /** Cache expiration timestamp */
  expiresAt: Date;
  /** Cache version for invalidation */
  version: string;
  /** Whether cache is stale */
  isStale: boolean;
}

// =============================================================================
// NEXT.JS MIDDLEWARE INTEGRATION
// =============================================================================

/**
 * Next.js middleware authentication context for request processing.
 */
export interface MiddlewareAuthContext {
  /** Authenticated user session */
  session: UserSession | null;
  /** Request authentication status */
  isAuthenticated: boolean;
  /** Whether authentication is required for route */
  requiresAuth: boolean;
  /** Required permissions for route access */
  requiredPermissions?: string[];
  /** Route access validation result */
  accessGranted: boolean;
  /** Authentication error if validation failed */
  error?: AuthenticationError;
  /** Middleware processing metadata */
  metadata: MiddlewareMetadata;
}

/**
 * Middleware processing metadata and configuration.
 */
export interface MiddlewareMetadata {
  /** Processing start timestamp */
  startTime: number;
  /** Processing duration in milliseconds */
  duration?: number;
  /** Middleware version */
  version: string;
  /** Processing flags */
  flags: {
    /** Whether token was refreshed */
    tokenRefreshed: boolean;
    /** Whether permissions were cached */
    permissionsCached: boolean;
    /** Whether request was rate limited */
    rateLimited: boolean;
  };
  /** Debug information for development */
  debug?: MiddlewareDebugInfo;
}

/**
 * Middleware debug information for development environments.
 */
export interface MiddlewareDebugInfo {
  /** Route matcher information */
  routeMatching: {
    /** Matched route pattern */
    pattern: string;
    /** Route parameters */
    params: Record<string, string>;
    /** Whether route requires authentication */
    requiresAuth: boolean;
  };
  /** Token validation steps */
  tokenValidation: {
    /** Token extraction source */
    source: 'header' | 'cookie' | 'query';
    /** Token format validation */
    formatValid: boolean;
    /** Token signature validation */
    signatureValid: boolean;
    /** Token expiration check */
    notExpired: boolean;
  };
  /** Permission evaluation */
  permissionEvaluation: {
    /** Required permissions */
    required: string[];
    /** User permissions */
    granted: string[];
    /** Evaluation result */
    result: boolean;
  };
}

// =============================================================================
// TOKEN MANAGEMENT & REFRESH
// =============================================================================

/**
 * Token refresh request payload for serverless functions.
 */
export interface TokenRefreshRequest {
  /** Refresh token */
  refreshToken: string;
  /** Current session ID */
  sessionId?: string;
  /** Client metadata */
  clientMetadata?: {
    /** User agent */
    userAgent?: string;
    /** IP address */
    ipAddress?: string;
    /** Device fingerprint */
    deviceFingerprint?: string;
  };
}

/**
 * Token refresh response from serverless authentication service.
 */
export interface TokenRefreshResponse extends GenericSuccessResponse {
  /** New access token */
  accessToken: string;
  /** New refresh token (if rotated) */
  refreshToken?: string;
  /** Token type */
  tokenType: string;
  /** Access token expiration in seconds */
  expiresIn: number;
  /** Refresh token expiration in seconds */
  refreshExpiresIn?: number;
  /** Updated user permissions */
  permissions?: UserPermissions;
  /** Token refresh metadata */
  metadata: TokenRefreshMetadata;
}

/**
 * Token refresh metadata for audit and optimization.
 */
export interface TokenRefreshMetadata {
  /** Refresh timestamp */
  refreshedAt: Date;
  /** Refresh trigger reason */
  trigger: 'expiration' | 'middleware' | 'manual';
  /** Previous token expiration */
  previousExpiration: Date;
  /** Whether refresh token was rotated */
  tokenRotated: boolean;
  /** Refresh processing duration */
  duration: number;
}

// =============================================================================
// AUTHENTICATION ERRORS & VALIDATION
// =============================================================================

/**
 * Comprehensive authentication error interface for Next.js error handling.
 */
export interface AuthenticationError extends GenericErrorResponse {
  /** Error type classification */
  type: AuthErrorType;
  /** Error details for debugging */
  details?: AuthErrorDetails;
  /** Retry configuration */
  retry?: {
    /** Whether error is retryable */
    retryable: boolean;
    /** Retry delay in milliseconds */
    delay?: number;
    /** Maximum retry attempts */
    maxAttempts?: number;
  };
  /** Recovery suggestions */
  recovery?: {
    /** Suggested action */
    action: 'login' | 'refresh' | 'retry' | 'contact_support';
    /** Recovery URL */
    url?: string;
    /** Additional parameters */
    params?: Record<string, any>;
  };
}

/**
 * Authentication error type enumeration.
 */
export type AuthErrorType =
  | 'invalid_credentials'
  | 'token_expired'
  | 'token_invalid'
  | 'token_missing'
  | 'session_expired'
  | 'session_invalid'
  | 'insufficient_permissions'
  | 'account_disabled'
  | 'account_locked'
  | 'rate_limited'
  | 'server_error'
  | 'network_error'
  | 'configuration_error';

/**
 * Authentication error details for debugging and logging.
 */
export interface AuthErrorDetails {
  /** Error timestamp */
  timestamp: Date;
  /** Request ID for tracing */
  requestId?: string;
  /** User ID if available */
  userId?: number;
  /** Session ID if available */
  sessionId?: string;
  /** Client IP address */
  ipAddress?: string;
  /** Additional context */
  context?: Record<string, any>;
}

// =============================================================================
// NEXT.JS RUNTIME CONFIGURATION
// =============================================================================

/**
 * Next.js runtime authentication configuration for serverless environments.
 */
export interface NextAuthConfig {
  /** JWT configuration */
  jwt: {
    /** JWT secret key from runtime secrets */
    secret: string;
    /** JWT algorithm */
    algorithm: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';
    /** JWT issuer */
    issuer: string;
    /** JWT audience */
    audience: string;
    /** Access token expiration */
    accessTokenExpiration: number;
    /** Refresh token expiration */
    refreshTokenExpiration: number;
  };
  /** Session configuration */
  session: {
    /** Session timeout in seconds */
    timeout: number;
    /** Session extension threshold */
    extensionThreshold: number;
    /** Maximum session duration */
    maxDuration: number;
    /** Session cleanup interval */
    cleanupInterval: number;
  };
  /** RBAC configuration */
  rbac: {
    /** Permission cache duration */
    permissionCacheDuration: number;
    /** Role hierarchy enabled */
    hierarchyEnabled: boolean;
    /** Default permissions */
    defaultPermissions: string[];
  };
  /** Security configuration */
  security: {
    /** Password policy enforcement */
    passwordPolicy: PasswordPolicy;
    /** Rate limiting configuration */
    rateLimiting: RateLimitConfig;
    /** Two-factor authentication */
    twoFactor: TwoFactorConfig;
  };
  /** Environment-specific settings */
  environment: {
    /** Environment type */
    type: 'development' | 'staging' | 'production';
    /** Debug mode enabled */
    debug: boolean;
    /** Logging level */
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * Password policy configuration for authentication validation.
 */
export interface PasswordPolicy {
  /** Minimum password length */
  minLength: number;
  /** Maximum password length */
  maxLength: number;
  /** Require uppercase characters */
  requireUppercase: boolean;
  /** Require lowercase characters */
  requireLowercase: boolean;
  /** Require numeric characters */
  requireNumbers: boolean;
  /** Require special characters */
  requireSpecialChars: boolean;
  /** Minimum number of character types */
  minCharTypes: number;
  /** Password history length */
  historyLength: number;
  /** Password expiration days */
  expirationDays: number;
}

/**
 * Rate limiting configuration for authentication endpoints.
 */
export interface RateLimitConfig {
  /** Login attempt limits */
  login: {
    /** Attempts per time window */
    attempts: number;
    /** Time window in seconds */
    window: number;
    /** Lockout duration in seconds */
    lockoutDuration: number;
  };
  /** Token refresh limits */
  tokenRefresh: {
    /** Attempts per time window */
    attempts: number;
    /** Time window in seconds */
    window: number;
  };
  /** Password reset limits */
  passwordReset: {
    /** Attempts per time window */
    attempts: number;
    /** Time window in seconds */
    window: number;
  };
}

/**
 * Two-factor authentication configuration.
 */
export interface TwoFactorConfig {
  /** Whether 2FA is enabled */
  enabled: boolean;
  /** Required for admin users */
  requiredForAdmins: boolean;
  /** Supported 2FA methods */
  methods: ('totp' | 'sms' | 'email')[];
  /** TOTP configuration */
  totp: {
    /** Issuer name */
    issuer: string;
    /** Code validity period */
    period: number;
    /** Code length */
    digits: number;
  };
}

// =============================================================================
// AUTHENTICATION HOOKS & UTILITIES
// =============================================================================

/**
 * Authentication state for React components and hooks.
 */
export interface AuthState {
  /** Current user session */
  session: UserSession | null;
  /** Authentication loading state */
  isLoading: boolean;
  /** Authentication error */
  error: AuthenticationError | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether session is being refreshed */
  isRefreshing: boolean;
  /** Last authentication check timestamp */
  lastCheck: Date | null;
}

/**
 * Authentication actions for state management.
 */
export interface AuthActions {
  /** Login with credentials */
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  /** Logout and clear session */
  logout: () => Promise<void>;
  /** Refresh authentication token */
  refreshToken: () => Promise<TokenRefreshResponse>;
  /** Check authentication status */
  checkAuth: () => Promise<boolean>;
  /** Update user permissions */
  updatePermissions: (permissions: UserPermissions) => void;
  /** Clear authentication error */
  clearError: () => void;
}

/**
 * Login credentials interface for authentication.
 */
export interface LoginCredentials {
  /** Email address */
  email: string;
  /** Password */
  password: string;
  /** Remember me flag */
  rememberMe?: boolean;
  /** Two-factor authentication code */
  twoFactorCode?: string;
  /** Device fingerprint */
  deviceFingerprint?: string;
}

// =============================================================================
// PERMISSION CHECKING UTILITIES
// =============================================================================

/**
 * Permission check request for middleware validation.
 */
export interface PermissionCheckRequest {
  /** User permissions */
  permissions: UserPermissions;
  /** Required permission */
  requiredPermission: string;
  /** Resource context */
  resource?: {
    /** Resource type */
    type: 'service' | 'table' | 'field' | 'endpoint';
    /** Resource identifier */
    id: string;
    /** Additional context */
    context?: Record<string, any>;
  };
}

/**
 * Permission check result for access control decisions.
 */
export interface PermissionCheckResult {
  /** Whether access is granted */
  granted: boolean;
  /** Reason for denial if access not granted */
  reason?: string;
  /** Missing permissions */
  missingPermissions?: string[];
  /** Alternative permissions that would grant access */
  alternatives?: string[];
  /** Check metadata */
  metadata: {
    /** Check timestamp */
    timestamp: Date;
    /** Check duration */
    duration: number;
    /** Cache hit status */
    cacheHit: boolean;
  };
}

// =============================================================================
// TYPE GUARDS & VALIDATION
// =============================================================================

/**
 * Type guard to check if a value is a valid UserSession.
 */
export function isUserSession(value: any): value is UserSession {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.user === 'object' &&
    typeof value.tokens === 'object' &&
    typeof value.permissions === 'object' &&
    typeof value.isValid === 'boolean'
  );
}

/**
 * Type guard to check if a value is a valid AuthenticationError.
 */
export function isAuthenticationError(value: any): value is AuthenticationError {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.type === 'string' &&
    typeof value.error === 'object'
  );
}

/**
 * Type guard to check if a value is a valid LoginResponse.
 */
export function isLoginResponse(value: any): value is LoginResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.success === 'boolean' &&
    (typeof value.session_token === 'string' || typeof value.sessionToken === 'string')
  );
}