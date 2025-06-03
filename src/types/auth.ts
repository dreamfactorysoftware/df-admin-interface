/**
 * Authentication and Authorization Types
 * 
 * Comprehensive authentication types supporting Next.js middleware-based session management,
 * JWT validation, RBAC enforcement, and React 19 concurrent features for the DreamFactory
 * Admin Interface React migration.
 * 
 * Key Features:
 * - Next.js middleware authentication with HttpOnly cookie support
 * - JWT-based session management with server-side validation
 * - Role-based access control (RBAC) integration
 * - React 19 concurrent features compatibility
 * - Server component and SSR support
 * - Performance-optimized middleware processing (<100ms)
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// Core Authentication Types
// ============================================================================

/**
 * Login credentials interface supporting multiple authentication methods
 * Migrated from Angular reactive forms to React Hook Form compatibility
 */
export interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
  rememberMe?: boolean;
  service?: string;
}

/**
 * Enhanced login response with Next.js compatibility
 * Supports both session_token and sessionToken formats for backward compatibility
 */
export interface LoginResponse {
  session_token?: string;
  sessionToken?: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  id: number;
  isRootAdmin: boolean;
  isSysAdmin: boolean;
  roleId: number;
  role_id?: number;
  host: string;
  lastLoginDate: string;
  tokenExpiryDate: string | Date;
  sessionId: string;
  [key: string]: any;
}

/**
 * JWT token structure for Next.js middleware validation
 * Enhanced with server-side rendering compatibility
 */
export interface JWTPayload {
  sub: string; // Subject (user ID)
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  isRootAdmin: boolean;
  isSysAdmin: boolean;
  roleId: number;
  sessionId: string;
  iat: number; // Issued at
  exp: number; // Expiration time
  aud: string; // Audience
  iss: string; // Issuer
}

/**
 * User session data optimized for Zustand state management
 * Includes React context compatibility for server components
 */
export interface UserSession {
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  host: string;
  id: number;
  isRootAdmin: boolean;
  isSysAdmin: boolean;
  lastLoginDate: string;
  sessionId: string;
  sessionToken: string;
  tokenExpiryDate: Date;
  roleId: number;
  role_id?: number;
}

/**
 * Authentication state interface for React context and Zustand stores
 * Supports React 19 concurrent features with optimistic updates
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserSession | null;
  token: string | null;
  error: AuthError | null;
  lastActivity: Date | null;
  isRefreshing: boolean;
}

// ============================================================================
// Next.js Middleware Authentication Types
// ============================================================================

/**
 * Middleware authentication context for Next.js edge runtime
 * Optimized for sub-100ms processing requirements
 */
export interface MiddlewareAuthContext {
  request: NextRequest;
  sessionToken: string | null;
  isValid: boolean;
  user: Partial<UserSession> | null;
  permissions: string[];
  shouldRedirect: boolean;
  redirectUrl?: string;
  processingTime?: number;
}

/**
 * Middleware authentication result with performance metrics
 * Includes timing data for monitoring and optimization
 */
export interface MiddlewareAuthResult {
  success: boolean;
  response: NextResponse;
  user?: Partial<UserSession>;
  error?: AuthError;
  processingTimeMs: number;
  cacheHit: boolean;
}

/**
 * Route protection configuration for Next.js middleware
 * Supports dynamic route matching and permission-based access control
 */
export interface RouteProtectionConfig {
  path: string;
  requireAuth: boolean;
  requiredPermissions?: string[];
  requireAdmin?: boolean;
  requireRootAdmin?: boolean;
  allowedRoles?: number[];
  redirectTo?: string;
  bypassPatterns?: string[];
}

/**
 * Session validation options for middleware processing
 * Configurable validation levels for performance optimization
 */
export interface SessionValidationOptions {
  validateSignature: boolean;
  checkExpiration: boolean;
  validatePermissions: boolean;
  allowRefresh: boolean;
  maxAge?: number;
  gracePeriod?: number;
}

// ============================================================================
// Role-Based Access Control (RBAC) Types
// ============================================================================

/**
 * Role definition with Next.js context integration
 * Enhanced with React component access patterns
 */
export interface Role {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdById: number;
  createdDate: string;
  lastModifiedById: number;
  lastModifiedDate: string;
  lookupByRoleId: number[];
  accessibleTabs?: string[];
  permissions: Permission[];
}

/**
 * Permission structure for granular access control
 * Integrated with React component authorization patterns
 */
export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

/**
 * RBAC context for React components and hooks
 * Supports concurrent rendering and Suspense boundaries
 */
export interface RBACContext {
  userRole: Role | null;
  permissions: Permission[];
  hasPermission: (permission: string) => boolean;
  hasRole: (roleId: number) => boolean;
  isAdmin: boolean;
  isRootAdmin: boolean;
  checkAccess: (resource: string, action: string) => boolean;
}

/**
 * Access control check result with caching support
 * Optimized for React Query and SWR integration
 */
export interface AccessCheckResult {
  granted: boolean;
  reason?: string;
  requiredPermissions?: string[];
  userPermissions: string[];
  cacheKey: string;
  ttl: number;
}

// ============================================================================
// Server-Side Authentication Types
// ============================================================================

/**
 * Server-side authentication context for Next.js Server Components
 * Supports HttpOnly cookie extraction and validation
 */
export interface ServerAuthContext {
  sessionToken: string | null;
  user: UserSession | null;
  isValid: boolean;
  cookies: Record<string, string>;
  headers: Record<string, string>;
  requestUrl: string;
  userAgent?: string;
}

/**
 * Session cookie configuration for HttpOnly security
 * Enhanced with Next.js cookie management patterns
 */
export interface SessionCookieConfig {
  name: string;
  domain?: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  expires?: Date;
}

/**
 * Server-side session validation result
 * Includes performance metrics for monitoring
 */
export interface ServerSessionValidation {
  isValid: boolean;
  user: UserSession | null;
  error?: AuthError;
  shouldRefresh: boolean;
  validationTimeMs: number;
  source: 'cache' | 'api' | 'jwt';
}

// ============================================================================
// React 19 & Next.js Integration Types
// ============================================================================

/**
 * Authentication hook return type for React 19 concurrent features
 * Supports Suspense, transitions, and optimistic updates
 */
export interface UseAuthReturn {
  // Core state
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  
  // React 19 concurrent features
  startTransition: (callback: () => void) => void;
  isPending: boolean;
  
  // RBAC integration
  hasPermission: (permission: string) => boolean;
  hasRole: (roleId: number) => boolean;
  isAdmin: boolean;
  isRootAdmin: boolean;
}

/**
 * Authentication provider props for React context
 * Enhanced with React 19 concurrent rendering support
 */
export interface AuthProviderProps {
  children: React.ReactNode;
  initialSession?: UserSession | null;
  cookieConfig?: SessionCookieConfig;
  enableConcurrentFeatures?: boolean;
  suspenseFallback?: React.ReactNode;
}

/**
 * Authentication context value for React providers
 * Optimized for server-side rendering and hydration
 */
export interface AuthContextValue extends UseAuthReturn {
  // Additional context-specific properties
  lastActivity: Date | null;
  sessionExpiry: Date | null;
  isRefreshing: boolean;
  
  // Server-side hydration
  isHydrated: boolean;
  hydrateSession: (session: UserSession) => void;
}

// ============================================================================
// Error Handling Types
// ============================================================================

/**
 * Authentication error types with detailed context
 * Enhanced for React Error Boundary integration
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: string;
  timestamp: Date;
  requestId?: string;
  statusCode?: number;
  retryable: boolean;
  context?: Record<string, any>;
}

/**
 * Authentication error codes for comprehensive error handling
 * Covers all authentication scenarios and failure modes
 */
export enum AuthErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  PASSWORD_EXPIRED = 'PASSWORD_EXPIRED',
  
  // Session errors
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_INVALID = 'SESSION_INVALID',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  
  // Token errors
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_MALFORMED = 'TOKEN_MALFORMED',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  
  // Authorization errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED = 'ACCESS_DENIED',
  ROLE_REQUIRED = 'ROLE_REQUIRED',
  ADMIN_REQUIRED = 'ADMIN_REQUIRED',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  MIDDLEWARE_ERROR = 'MIDDLEWARE_ERROR',
  
  // Rate limiting
  RATE_LIMITED = 'RATE_LIMITED',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS'
}

// ============================================================================
// OAuth and External Authentication Types (Future Support)
// ============================================================================

/**
 * OAuth configuration for external authentication providers
 * Currently out of scope but included for future development
 */
export interface OAuthConfig {
  provider: string;
  clientId: string;
  clientSecret?: string; // Server-side only
  redirectUri: string;
  scope: string[];
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
}

/**
 * OAuth callback data for authentication flow completion
 * Supports PKCE and state validation
 */
export interface OAuthCallbackData {
  code: string;
  state: string;
  oauthToken?: string;
  provider: string;
  error?: string;
  errorDescription?: string;
}

/**
 * SAML authentication configuration
 * Currently out of scope but included for future development
 */
export interface SAMLConfig {
  entityId: string;
  ssoUrl: string;
  x509Certificate: string;
  signatureAlgorithm: string;
  nameIdFormat: string;
  attributeMapping: Record<string, string>;
}

// ============================================================================
// Utility Types and Helpers
// ============================================================================

/**
 * Authentication event types for audit logging
 * Supports comprehensive security event tracking
 */
export enum AuthEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  SESSION_REFRESH = 'SESSION_REFRESH',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION'
}

/**
 * Authentication audit log entry
 * Enhanced with Next.js request context
 */
export interface AuthAuditLog {
  eventType: AuthEventType;
  userId?: number;
  email?: string;
  sessionId?: string;
  requestId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  errorCode?: AuthErrorCode;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Authentication configuration interface
 * Centralized configuration for all authentication features
 */
export interface AuthConfig {
  // JWT settings
  jwtSecret: string;
  jwtExpiry: number;
  jwtRefreshExpiry: number;
  
  // Session settings
  sessionTimeout: number;
  sessionRefreshThreshold: number;
  maxConcurrentSessions: number;
  
  // Cookie settings
  cookieConfig: SessionCookieConfig;
  
  // Security settings
  enableBruteForceProtection: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
  
  // Middleware settings
  enableMiddleware: boolean;
  middlewareTimeout: number;
  excludePatterns: string[];
  
  // Features
  enableOAuth: boolean;
  enableSAML: boolean;
  enableMFA: boolean;
  enableAuditLogging: boolean;
}

/**
 * Type guard utility functions for authentication types
 */
export type AuthTypeGuards = {
  isLoginResponse: (obj: any) => obj is LoginResponse;
  isUserSession: (obj: any) => obj is UserSession;
  isJWTPayload: (obj: any) => obj is JWTPayload;
  isAuthError: (obj: any) => obj is AuthError;
  isValidSessionToken: (token: string) => boolean;
};

/**
 * React Hook Form compatible authentication schemas
 * For integration with form validation and React Hook Form
 */
export interface AuthFormSchemas {
  loginSchema: any; // Will be Zod schema in actual implementation
  registerSchema: any; // Will be Zod schema in actual implementation
  resetPasswordSchema: any; // Will be Zod schema in actual implementation
  changePasswordSchema: any; // Will be Zod schema in actual implementation
}

// ============================================================================
// Constants and Defaults
// ============================================================================

/**
 * Default authentication configuration values
 * Optimized for DreamFactory deployment patterns
 */
export const DEFAULT_AUTH_CONFIG: Partial<AuthConfig> = {
  jwtExpiry: 3600, // 1 hour
  jwtRefreshExpiry: 604800, // 7 days
  sessionTimeout: 1800, // 30 minutes
  sessionRefreshThreshold: 300, // 5 minutes
  maxConcurrentSessions: 3,
  enableBruteForceProtection: true,
  maxLoginAttempts: 5,
  lockoutDuration: 900, // 15 minutes
  enableMiddleware: true,
  middlewareTimeout: 100, // 100ms requirement
  enableAuditLogging: true
};

/**
 * Default session cookie configuration
 * Secure defaults for production deployment
 */
export const DEFAULT_COOKIE_CONFIG: SessionCookieConfig = {
  name: 'df-session-token',
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 86400 // 24 hours
};

/**
 * Protected route patterns for Next.js middleware
 * Comprehensive list of routes requiring authentication
 */
export const PROTECTED_ROUTES: string[] = [
  '/admin-settings',
  '/system-settings',
  '/api-security',
  '/api-connections',
  '/profile',
  '/adf-*'
];

/**
 * Public route patterns that bypass authentication
 * Routes accessible without valid session
 */
export const PUBLIC_ROUTES: string[] = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/saml-callback',
  '/api/auth/*',
  '/_next/*',
  '/favicon.ico',
  '/public/*'
];

// Export all types for external consumption
export type {
  // Re-export core types for convenience
  LoginCredentials as Credentials,
  LoginResponse as AuthResponse,
  UserSession as Session,
  AuthState as State,
  AuthError as Error,
  Role as UserRole,
  Permission as UserPermission
};