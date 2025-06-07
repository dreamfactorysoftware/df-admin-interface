/**
 * Authentication Types for Next.js Middleware-Based Session Management
 * 
 * Provides comprehensive type definitions for authentication, authorization, and session management
 * optimized for Next.js 15.1+ middleware patterns and serverless environments. Supports RBAC
 * enforcement, server-side validation, and runtime secret management.
 * 
 * @fileoverview This module provides authentication types for:
 * - Next.js middleware-based session validation and token management
 * - Server-side authentication with edge computing optimization
 * - Role-based access control (RBAC) with granular permission enforcement
 * - Serverless function authentication patterns with automatic token refresh
 * - Runtime secret management for secure credential handling
 * - Integration with React Query/SWR for authentication state synchronization
 */

import type {
  GenericSuccessResponse,
  GenericErrorResponse,
  ApiError,
  RequestOptions,
  AuthConfig,
  TokenRefreshConfig,
} from './generic-http';

// =============================================================================
// CORE AUTHENTICATION INTERFACES
// =============================================================================

/**
 * User authentication data structure for DreamFactory API integration.
 * Supports both local and federated authentication patterns.
 */
export interface User {
  /** Unique user identifier */
  id: number | string;
  /** User display name */
  name: string;
  /** User email address */
  email: string;
  /** User's first name */
  firstName?: string;
  /** User's last name */
  lastName?: string;
  /** Phone number */
  phone?: string;
  /** User status */
  isActive: boolean;
  /** Account creation timestamp */
  createdDate?: string;
  /** Last modified timestamp */
  lastModifiedDate?: string;
  /** User's assigned roles */
  roles?: UserRole[];
  /** User preferences and settings */
  preferences?: UserPreferences;
  /** Authentication provider information */
  provider?: AuthProvider;
  /** User metadata */
  metadata?: Record<string, any>;
}

/**
 * Role-based access control (RBAC) role definition.
 * Supports hierarchical permissions and service-level access control.
 */
export interface UserRole {
  /** Unique role identifier */
  id: number | string;
  /** Role name */
  name: string;
  /** Role description */
  description?: string;
  /** Whether role is active */
  isActive: boolean;
  /** Role type classification */
  type: RoleType;
  /** Service-specific permissions */
  serviceAccess?: ServiceAccess[];
  /** System-level permissions */
  systemPermissions?: SystemPermission[];
  /** Role hierarchy level */
  level?: number;
  /** Role metadata */
  metadata?: Record<string, any>;
}

/**
 * Service-level access permissions for API endpoints and resources.
 */
export interface ServiceAccess {
  /** Service identifier */
  serviceId: string | number;
  /** Service name */
  serviceName: string;
  /** Service type (database, file, email, etc.) */
  serviceType: string;
  /** Component-level permissions */
  component?: string;
  /** Allowed HTTP verbs */
  verbs: HttpVerb[];
  /** Request filters for data access control */
  requesters?: string[];
  /** Advanced filters for fine-grained access */
  filters?: AccessFilter[];
  /** Whether access is read-only */
  readOnly?: boolean;
}

/**
 * System-level permissions for administrative functions.
 */
export interface SystemPermission {
  /** Permission identifier */
  id: string;
  /** Permission name */
  name: string;
  /** Permission category */
  category: PermissionCategory;
  /** Whether permission is granted */
  granted: boolean;
  /** Permission constraints */
  constraints?: PermissionConstraint[];
}

/**
 * User preferences and application settings.
 */
export interface UserPreferences {
  /** UI theme preference */
  theme?: 'light' | 'dark' | 'auto';
  /** Language/locale preference */
  locale?: string;
  /** Timezone setting */
  timezone?: string;
  /** Dashboard layout preferences */
  dashboardLayout?: Record<string, any>;
  /** Notification settings */
  notifications?: NotificationSettings;
  /** Accessibility preferences */
  accessibility?: AccessibilitySettings;
}

/**
 * Authentication provider information for federated auth.
 */
export interface AuthProvider {
  /** Provider type */
  type: 'local' | 'ldap' | 'oauth' | 'saml' | 'openid';
  /** Provider name */
  name: string;
  /** Provider-specific metadata */
  metadata?: Record<string, any>;
}

// =============================================================================
// NEXT.JS MIDDLEWARE AUTHENTICATION TYPES
// =============================================================================

/**
 * Next.js middleware-compatible session data structure.
 * Optimized for edge computing and server-side validation.
 */
export interface MiddlewareSession {
  /** Session token (JWT) */
  token: string;
  /** Refresh token for automatic renewal */
  refreshToken?: string;
  /** Token expiration timestamp */
  expiresAt: number;
  /** User information */
  user: User;
  /** Session metadata */
  sessionId: string;
  /** Client information */
  client: ClientInfo;
  /** Security context */
  security: SecurityContext;
  /** Session created timestamp */
  createdAt: number;
  /** Last accessed timestamp */
  lastAccessedAt: number;
  /** Whether session is valid */
  isValid: boolean;
}

/**
 * Client information for session tracking and security.
 */
export interface ClientInfo {
  /** Client IP address */
  ipAddress: string;
  /** User agent string */
  userAgent: string;
  /** Device fingerprint for security */
  deviceFingerprint?: string;
  /** Geographic location (if available) */
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

/**
 * Security context for enhanced session validation.
 */
export interface SecurityContext {
  /** Authentication method used */
  authMethod: AuthMethod;
  /** Multi-factor authentication status */
  mfaVerified?: boolean;
  /** Risk assessment score */
  riskScore?: number;
  /** Security flags */
  flags?: SecurityFlag[];
  /** Last security validation timestamp */
  lastValidatedAt: number;
}

/**
 * Next.js middleware authentication request context.
 * Provides authentication state for route protection and API requests.
 */
export interface MiddlewareAuthContext {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Current session data */
  session?: MiddlewareSession;
  /** User roles for RBAC */
  roles: UserRole[];
  /** Computed permissions for current context */
  permissions: ComputedPermissions;
  /** Authentication error, if any */
  error?: AuthError;
  /** Request metadata */
  request: RequestContext;
}

/**
 * Computed permissions for efficient middleware authorization.
 */
export interface ComputedPermissions {
  /** System-level permissions map */
  system: Map<string, boolean>;
  /** Service-level permissions map */
  services: Map<string, ServicePermissions>;
  /** Route-level access permissions */
  routes: Map<string, boolean>;
  /** API endpoint permissions */
  endpoints: Map<string, EndpointPermissions>;
}

/**
 * Service-specific permissions for granular access control.
 */
export interface ServicePermissions {
  /** Service identifier */
  serviceId: string;
  /** Allowed operations */
  operations: Set<HttpVerb>;
  /** Resource-level access filters */
  filters: AccessFilter[];
  /** Whether service access is read-only */
  readOnly: boolean;
}

/**
 * API endpoint-specific permissions.
 */
export interface EndpointPermissions {
  /** Endpoint path pattern */
  path: string;
  /** Allowed HTTP methods */
  methods: Set<HttpVerb>;
  /** Request parameter constraints */
  parameters?: ParameterConstraint[];
  /** Response data filtering rules */
  responseFilters?: ResponseFilter[];
}

/**
 * Request context for middleware processing.
 */
export interface RequestContext {
  /** Request path */
  path: string;
  /** HTTP method */
  method: string;
  /** Request headers */
  headers: Record<string, string>;
  /** Query parameters */
  query: Record<string, string>;
  /** Request timestamp */
  timestamp: number;
  /** Request identifier for tracing */
  requestId: string;
}

// =============================================================================
// SERVER-SIDE AUTHENTICATION TYPES
// =============================================================================

/**
 * Server-side session validation result.
 * Used by Next.js middleware for authentication decisions.
 */
export interface SessionValidationResult {
  /** Whether session is valid */
  isValid: boolean;
  /** Validation error, if any */
  error?: AuthError;
  /** Updated session data */
  session?: MiddlewareSession;
  /** Whether token was refreshed */
  tokenRefreshed?: boolean;
  /** Actions to perform */
  actions: ValidationAction[];
  /** Validation metadata */
  metadata: ValidationMetadata;
}

/**
 * Actions to perform based on session validation.
 */
export interface ValidationAction {
  /** Action type */
  type: 'redirect' | 'refresh_token' | 'clear_session' | 'update_headers' | 'log_event';
  /** Action parameters */
  params: Record<string, any>;
  /** Action priority */
  priority: number;
}

/**
 * Session validation metadata for monitoring and debugging.
 */
export interface ValidationMetadata {
  /** Validation duration in milliseconds */
  duration: number;
  /** Cache hit status */
  cacheHit: boolean;
  /** Validation timestamp */
  timestamp: number;
  /** Validator version */
  version: string;
  /** Additional context */
  context?: Record<string, any>;
}

/**
 * Server-side authentication provider interface.
 * Supports multiple authentication backends and credential validation.
 */
export interface ServerAuthProvider {
  /** Provider identifier */
  id: string;
  /** Provider name */
  name: string;
  /** Provider type */
  type: AuthProviderType;
  /** Provider configuration */
  config: AuthProviderConfig;
  /** Provider capabilities */
  capabilities: AuthCapability[];
  /** Whether provider is enabled */
  enabled: boolean;
}

/**
 * Authentication provider configuration.
 */
export interface AuthProviderConfig {
  /** Endpoint URLs */
  endpoints: {
    login?: string;
    logout?: string;
    refresh?: string;
    validate?: string;
    userInfo?: string;
  };
  /** Authentication parameters */
  parameters: Record<string, any>;
  /** Security settings */
  security: {
    tokenExpiration: number;
    refreshExpiration: number;
    requireMFA?: boolean;
    passwordPolicy?: PasswordPolicy;
  };
  /** Integration settings */
  integration: {
    timeout: number;
    retries: number;
    cacheDuration: number;
  };
}

// =============================================================================
// SERVERLESS AUTHENTICATION PATTERNS
// =============================================================================

/**
 * Serverless function authentication context.
 * Optimized for AWS Lambda, Vercel Functions, and edge computing environments.
 */
export interface ServerlessAuthContext {
  /** Execution environment */
  environment: ServerlessEnvironment;
  /** Authentication state */
  auth: {
    /** Whether request is authenticated */
    authenticated: boolean;
    /** Session data */
    session?: MiddlewareSession;
    /** API key information */
    apiKey?: ApiKeyInfo;
    /** Service account information */
    serviceAccount?: ServiceAccountInfo;
  };
  /** Request context */
  request: ServerlessRequestContext;
  /** Performance metrics */
  metrics: ServerlessMetrics;
}

/**
 * Serverless execution environment information.
 */
export interface ServerlessEnvironment {
  /** Runtime platform */
  platform: 'vercel' | 'aws-lambda' | 'cloudflare-workers' | 'netlify' | 'azure-functions';
  /** Region identifier */
  region: string;
  /** Function version */
  version: string;
  /** Memory allocation */
  memory: number;
  /** Timeout setting */
  timeout: number;
  /** Environment variables */
  env: Record<string, string>;
}

/**
 * API key information for service-to-service authentication.
 */
export interface ApiKeyInfo {
  /** API key identifier */
  id: string;
  /** Key name/description */
  name: string;
  /** Associated service/application */
  service: string;
  /** Key scope and permissions */
  scope: string[];
  /** Rate limiting information */
  rateLimit?: RateLimitInfo;
  /** Usage statistics */
  usage?: ApiKeyUsage;
}

/**
 * Service account information for automated authentication.
 */
export interface ServiceAccountInfo {
  /** Service account identifier */
  id: string;
  /** Service account name */
  name: string;
  /** Associated service */
  service: string;
  /** Granted permissions */
  permissions: string[];
  /** Service account metadata */
  metadata?: Record<string, any>;
}

/**
 * Serverless function request context.
 */
export interface ServerlessRequestContext {
  /** Function name */
  functionName: string;
  /** Request identifier */
  requestId: string;
  /** Execution trace ID */
  traceId?: string;
  /** Cold start indicator */
  coldStart: boolean;
  /** Request timestamp */
  timestamp: number;
  /** Source IP address */
  sourceIp: string;
}

/**
 * Performance metrics for serverless functions.
 */
export interface ServerlessMetrics {
  /** Function execution duration */
  duration: number;
  /** Memory usage */
  memoryUsed: number;
  /** Billable duration */
  billableDuration: number;
  /** Initialization duration */
  initDuration?: number;
}

// =============================================================================
// RUNTIME SECRETS AND CONFIGURATION
// =============================================================================

/**
 * Next.js runtime secrets configuration for secure authentication.
 * Supports environment-based configuration and dynamic secret loading.
 */
export interface RuntimeSecretsConfig {
  /** JWT signing configuration */
  jwt: {
    /** Secret key for signing */
    secret: string;
    /** Token algorithm */
    algorithm: string;
    /** Token expiration */
    expiresIn: string;
    /** Token issuer */
    issuer: string;
    /** Token audience */
    audience: string;
  };
  /** Database connection secrets */
  database: {
    /** Connection URL */
    url: string;
    /** Connection pool settings */
    pool?: DatabasePoolConfig;
    /** SSL configuration */
    ssl?: DatabaseSSLConfig;
  };
  /** External service API keys */
  apiKeys: {
    /** DreamFactory API key */
    dreamfactory: string;
    /** Third-party service keys */
    services?: Record<string, string>;
  };
  /** Encryption keys */
  encryption: {
    /** Data encryption key */
    dataKey: string;
    /** Session encryption key */
    sessionKey: string;
    /** File encryption key */
    fileKey?: string;
  };
  /** OAuth provider configurations */
  oauth?: Record<string, OAuthProviderConfig>;
}

/**
 * Database connection pool configuration.
 */
export interface DatabasePoolConfig {
  /** Minimum pool size */
  min: number;
  /** Maximum pool size */
  max: number;
  /** Connection timeout */
  connectionTimeout: number;
  /** Idle timeout */
  idleTimeout: number;
}

/**
 * Database SSL configuration.
 */
export interface DatabaseSSLConfig {
  /** Whether SSL is required */
  required: boolean;
  /** SSL certificate */
  cert?: string;
  /** SSL key */
  key?: string;
  /** SSL CA certificate */
  ca?: string;
}

/**
 * OAuth provider configuration for federated authentication.
 */
export interface OAuthProviderConfig {
  /** Client ID */
  clientId: string;
  /** Client secret */
  clientSecret: string;
  /** Authorization URL */
  authUrl: string;
  /** Token URL */
  tokenUrl: string;
  /** Scope */
  scope: string[];
  /** Redirect URI */
  redirectUri: string;
}

/**
 * Environment-based authentication configuration.
 * Supports development, staging, and production environments.
 */
export interface EnvironmentAuthConfig {
  /** Environment name */
  environment: 'development' | 'staging' | 'production';
  /** API base URL */
  apiBaseUrl: string;
  /** Authentication endpoints */
  endpoints: {
    /** Login endpoint */
    login: string;
    /** Logout endpoint */
    logout: string;
    /** Token refresh endpoint */
    refresh: string;
    /** User profile endpoint */
    profile: string;
  };
  /** Security settings */
  security: {
    /** HTTPS enforcement */
    enforceHttps: boolean;
    /** CORS settings */
    cors: CorsConfig;
    /** CSP settings */
    csp: CspConfig;
    /** Rate limiting */
    rateLimit: RateLimitConfig;
  };
  /** Session configuration */
  session: {
    /** Cookie settings */
    cookie: CookieConfig;
    /** Session timeout */
    timeout: number;
    /** Cleanup interval */
    cleanupInterval: number;
  };
}

// =============================================================================
// AUTHENTICATION RESPONSE TYPES
// =============================================================================

/**
 * Login response extending generic HTTP response pattern.
 * Supports Next.js session patterns with server-side optimization.
 */
export interface LoginResponse extends GenericSuccessResponse {
  /** Session token */
  sessionToken: string;
  /** Refresh token */
  refreshToken?: string;
  /** User information */
  user: User;
  /** Session expiration timestamp */
  expiresAt: number;
  /** Session metadata */
  session: {
    /** Session ID */
    id: string;
    /** Session type */
    type: 'web' | 'api' | 'mobile';
    /** Device information */
    device?: DeviceInfo;
  };
  /** Next action for client */
  nextAction?: NextAction;
}

/**
 * Token refresh response for serverless environments.
 */
export interface TokenRefreshResponse extends GenericSuccessResponse {
  /** New session token */
  sessionToken: string;
  /** New refresh token */
  refreshToken?: string;
  /** Token expiration timestamp */
  expiresAt: number;
  /** Refresh metadata */
  refreshMetadata: {
    /** Previous token ID */
    previousTokenId: string;
    /** Refresh timestamp */
    refreshedAt: number;
    /** Refresh reason */
    reason: 'expiration' | 'proactive' | 'security' | 'manual';
  };
}

/**
 * Logout response with cleanup information.
 */
export interface LogoutResponse extends GenericSuccessResponse {
  /** Logout timestamp */
  logoutAt: number;
  /** Session cleanup status */
  cleanup: {
    /** Session cleared */
    sessionCleared: boolean;
    /** Tokens revoked */
    tokensRevoked: boolean;
    /** Cache cleared */
    cacheCleared: boolean;
  };
  /** Redirect URL */
  redirectUrl?: string;
}

/**
 * Authentication error response.
 */
export interface AuthErrorResponse extends GenericErrorResponse {
  /** Authentication-specific error details */
  error: AuthError;
  /** Recovery actions */
  recovery?: {
    /** Available actions */
    actions: RecoveryAction[];
    /** Retry configuration */
    retry?: RetryConfig;
  };
}

// =============================================================================
// ERROR HANDLING AND VALIDATION
// =============================================================================

/**
 * Authentication-specific error interface.
 */
export interface AuthError extends ApiError {
  /** Authentication error type */
  type: AuthErrorType;
  /** Error context */
  context: {
    /** Authentication method attempted */
    authMethod?: AuthMethod;
    /** User identifier (if available) */
    userId?: string;
    /** Session information */
    session?: Partial<MiddlewareSession>;
    /** Request information */
    request?: Partial<RequestContext>;
  };
  /** Security implications */
  security?: {
    /** Whether error should trigger security alerts */
    alertRequired: boolean;
    /** Risk level */
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    /** Recommended actions */
    recommendations: string[];
  };
}

/**
 * Authentication error types for specific error handling.
 */
export type AuthErrorType =
  | 'invalid_credentials'
  | 'account_locked'
  | 'account_disabled'
  | 'session_expired'
  | 'token_invalid'
  | 'token_expired'
  | 'insufficient_permissions'
  | 'mfa_required'
  | 'mfa_invalid'
  | 'rate_limit_exceeded'
  | 'provider_unavailable'
  | 'network_error'
  | 'server_error'
  | 'configuration_error';

/**
 * Recovery actions for authentication errors.
 */
export interface RecoveryAction {
  /** Action type */
  type: 'retry' | 'refresh_token' | 'redirect_login' | 'contact_support' | 'wait';
  /** Action label */
  label: string;
  /** Action parameters */
  params?: Record<string, any>;
  /** Estimated recovery time */
  estimatedTime?: number;
}

// =============================================================================
// SUPPORTING TYPES AND ENUMS
// =============================================================================

/**
 * Role type enumeration for RBAC.
 */
export type RoleType = 'admin' | 'user' | 'service' | 'custom';

/**
 * HTTP verb enumeration for API access control.
 */
export type HttpVerb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Authentication method enumeration.
 */
export type AuthMethod = 'password' | 'mfa' | 'oauth' | 'saml' | 'ldap' | 'api_key' | 'service_account';

/**
 * Permission category enumeration.
 */
export type PermissionCategory = 'system' | 'service' | 'data' | 'file' | 'user' | 'admin';

/**
 * Authentication provider type enumeration.
 */
export type AuthProviderType = 'local' | 'ldap' | 'oauth2' | 'saml' | 'openid' | 'custom';

/**
 * Authentication capability enumeration.
 */
export type AuthCapability = 
  | 'login'
  | 'logout'
  | 'refresh'
  | 'mfa'
  | 'password_reset'
  | 'user_management'
  | 'group_sync'
  | 'attribute_mapping';

/**
 * Security flag enumeration.
 */
export type SecurityFlag = 
  | 'suspicious_activity'
  | 'new_device'
  | 'location_change'
  | 'concurrent_sessions'
  | 'elevated_permissions'
  | 'admin_action';

/**
 * Access filter for fine-grained permissions.
 */
export interface AccessFilter {
  /** Filter field */
  field: string;
  /** Filter operator */
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'nin';
  /** Filter value */
  value: any;
  /** Filter logic */
  logic?: 'and' | 'or';
}

/**
 * Permission constraint for conditional access.
 */
export interface PermissionConstraint {
  /** Constraint type */
  type: 'time' | 'location' | 'device' | 'network' | 'custom';
  /** Constraint parameters */
  params: Record<string, any>;
  /** Whether constraint is enforced */
  enforced: boolean;
}

/**
 * Parameter constraint for API endpoint access.
 */
export interface ParameterConstraint {
  /** Parameter name */
  name: string;
  /** Required values */
  required?: boolean;
  /** Allowed values */
  allowedValues?: any[];
  /** Value pattern */
  pattern?: string;
  /** Validation function */
  validator?: (value: any) => boolean;
}

/**
 * Response filter for data access control.
 */
export interface ResponseFilter {
  /** Field to filter */
  field: string;
  /** Filter action */
  action: 'include' | 'exclude' | 'mask' | 'transform';
  /** Filter conditions */
  conditions?: FilterCondition[];
}

/**
 * Filter condition for response filtering.
 */
export interface FilterCondition {
  /** Condition field */
  field: string;
  /** Condition operator */
  operator: string;
  /** Condition value */
  value: any;
}

/**
 * Notification settings for user preferences.
 */
export interface NotificationSettings {
  /** Email notifications enabled */
  email: boolean;
  /** Push notifications enabled */
  push: boolean;
  /** SMS notifications enabled */
  sms: boolean;
  /** Notification categories */
  categories: {
    /** Security alerts */
    security: boolean;
    /** System updates */
    system: boolean;
    /** API events */
    api: boolean;
    /** Account changes */
    account: boolean;
  };
}

/**
 * Accessibility settings for user preferences.
 */
export interface AccessibilitySettings {
  /** High contrast mode */
  highContrast: boolean;
  /** Font size multiplier */
  fontSize: number;
  /** Screen reader optimization */
  screenReader: boolean;
  /** Keyboard navigation mode */
  keyboardNavigation: boolean;
  /** Reduced motion preference */
  reducedMotion: boolean;
}

/**
 * Device information for session tracking.
 */
export interface DeviceInfo {
  /** Device type */
  type: 'desktop' | 'mobile' | 'tablet';
  /** Operating system */
  os: string;
  /** Browser information */
  browser: string;
  /** Screen resolution */
  screen?: {
    width: number;
    height: number;
  };
}

/**
 * Next action for client after authentication.
 */
export interface NextAction {
  /** Action type */
  type: 'redirect' | 'continue' | 'setup_mfa' | 'change_password';
  /** Action URL */
  url?: string;
  /** Action parameters */
  params?: Record<string, any>;
}

/**
 * Password policy configuration.
 */
export interface PasswordPolicy {
  /** Minimum length */
  minLength: number;
  /** Maximum length */
  maxLength: number;
  /** Require uppercase */
  requireUppercase: boolean;
  /** Require lowercase */
  requireLowercase: boolean;
  /** Require numbers */
  requireNumbers: boolean;
  /** Require special characters */
  requireSpecialChars: boolean;
  /** Password history */
  historyCount: number;
  /** Expiration days */
  expirationDays: number;
}

/**
 * Rate limiting information.
 */
export interface RateLimitInfo {
  /** Requests per time window */
  limit: number;
  /** Time window in seconds */
  window: number;
  /** Current usage */
  used: number;
  /** Reset timestamp */
  reset: number;
}

/**
 * API key usage statistics.
 */
export interface ApiKeyUsage {
  /** Total requests */
  totalRequests: number;
  /** Requests today */
  requestsToday: number;
  /** Last used timestamp */
  lastUsed: number;
  /** Usage by endpoint */
  byEndpoint?: Record<string, number>;
}

/**
 * CORS configuration for security.
 */
export interface CorsConfig {
  /** Allowed origins */
  origins: string[];
  /** Allowed methods */
  methods: string[];
  /** Allowed headers */
  headers: string[];
  /** Allow credentials */
  credentials: boolean;
  /** Max age */
  maxAge: number;
}

/**
 * Content Security Policy configuration.
 */
export interface CspConfig {
  /** CSP directives */
  directives: Record<string, string[]>;
  /** Report URI */
  reportUri?: string;
  /** Report only mode */
  reportOnly: boolean;
}

/**
 * Rate limiting configuration.
 */
export interface RateLimitConfig {
  /** Request limit */
  limit: number;
  /** Time window in seconds */
  window: number;
  /** Skip successful requests */
  skipSuccessfulRequests: boolean;
  /** Skip failed requests */
  skipFailedRequests: boolean;
}

/**
 * Cookie configuration for sessions.
 */
export interface CookieConfig {
  /** Cookie name */
  name: string;
  /** HTTP only flag */
  httpOnly: boolean;
  /** Secure flag */
  secure: boolean;
  /** SameSite policy */
  sameSite: 'strict' | 'lax' | 'none';
  /** Max age in seconds */
  maxAge: number;
  /** Cookie domain */
  domain?: string;
  /** Cookie path */
  path: string;
}

/**
 * Retry configuration for authentication operations.
 */
export interface RetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Base delay in milliseconds */
  baseDelay: number;
  /** Delay multiplier */
  multiplier: number;
  /** Maximum delay */
  maxDelay: number;
  /** Jitter enabled */
  jitter: boolean;
}

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

/**
 * Type guard to check if response is a successful login response.
 */
export function isLoginResponse(response: any): response is LoginResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    response.success === true &&
    typeof response.sessionToken === 'string' &&
    typeof response.user === 'object'
  );
}

/**
 * Type guard to check if response is a token refresh response.
 */
export function isTokenRefreshResponse(response: any): response is TokenRefreshResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    response.success === true &&
    typeof response.sessionToken === 'string' &&
    typeof response.refreshMetadata === 'object'
  );
}

/**
 * Type guard to check if error is an authentication error.
 */
export function isAuthError(error: any): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof error.type === 'string' &&
    typeof error.context === 'object'
  );
}

/**
 * Type guard to check if session is valid.
 */
export function isValidSession(session: any): session is MiddlewareSession {
  return (
    typeof session === 'object' &&
    session !== null &&
    typeof session.token === 'string' &&
    typeof session.expiresAt === 'number' &&
    session.expiresAt > Date.now() &&
    session.isValid === true
  );
}

/**
 * Type guard to check if user has specific role.
 */
export function hasRole(user: User, roleName: string): boolean {
  return user.roles?.some(role => role.name === roleName && role.isActive) || false;
}

/**
 * Type guard to check if user has specific permission.
 */
export function hasPermission(roles: UserRole[], permissionId: string): boolean {
  return roles.some(role => 
    role.isActive && 
    role.systemPermissions?.some(permission => 
      permission.id === permissionId && permission.granted
    )
  );
}

/**
 * Utility to check service access permissions.
 */
export function hasServiceAccess(
  roles: UserRole[], 
  serviceId: string, 
  verb: HttpVerb
): boolean {
  return roles.some(role =>
    role.isActive &&
    role.serviceAccess?.some(access =>
      access.serviceId === serviceId && access.verbs.includes(verb)
    )
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  // Core authentication types
  User,
  UserRole,
  ServiceAccess,
  SystemPermission,
  UserPreferences,
  AuthProvider,
  
  // Middleware types
  MiddlewareSession,
  ClientInfo,
  SecurityContext,
  MiddlewareAuthContext,
  ComputedPermissions,
  ServicePermissions,
  EndpointPermissions,
  RequestContext,
  
  // Server-side types
  SessionValidationResult,
  ValidationAction,
  ValidationMetadata,
  ServerAuthProvider,
  AuthProviderConfig,
  
  // Serverless types
  ServerlessAuthContext,
  ServerlessEnvironment,
  ApiKeyInfo,
  ServiceAccountInfo,
  ServerlessRequestContext,
  ServerlessMetrics,
  
  // Configuration types
  RuntimeSecretsConfig,
  DatabasePoolConfig,
  DatabaseSSLConfig,
  OAuthProviderConfig,
  EnvironmentAuthConfig,
  
  // Response types
  LoginResponse,
  TokenRefreshResponse,
  LogoutResponse,
  AuthErrorResponse,
  
  // Error types
  AuthError,
  RecoveryAction,
  
  // Supporting types
  AccessFilter,
  PermissionConstraint,
  ParameterConstraint,
  ResponseFilter,
  FilterCondition,
  NotificationSettings,
  AccessibilitySettings,
  DeviceInfo,
  NextAction,
  PasswordPolicy,
  RateLimitInfo,
  ApiKeyUsage,
  CorsConfig,
  CspConfig,
  RateLimitConfig,
  CookieConfig,
  RetryConfig,
  
  // Enum types
  RoleType,
  HttpVerb,
  AuthMethod,
  PermissionCategory,
  AuthProviderType,
  AuthCapability,
  SecurityFlag,
  AuthErrorType,
};