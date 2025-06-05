/**
 * Authentication Utilities Library
 * 
 * Centralized barrel export file providing all authentication-related utilities
 * for the DreamFactory Admin Interface React/Next.js implementation.
 * 
 * This module supports:
 * - JWT token management with automatic refresh
 * - Next.js middleware authentication flows
 * - Secure session management with edge optimization
 * - Zod-based authentication validation schemas
 * - Password strength validation and security
 * - Cookie utilities for secure session storage
 * - Authentication constants and configuration
 * 
 * @fileoverview Authentication library barrel exports for React 19 + Next.js 15.1
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 */

// =============================================================================
// AUTHENTICATION SCHEMAS & VALIDATION
// =============================================================================

/**
 * Zod authentication schemas for form validation and API contract validation
 * Includes login, registration, password reset, and session validation schemas
 */
export {
  // Authentication form schemas
  loginSchema,
  registrationSchema,
  passwordResetSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  
  // Session and token schemas
  sessionSchema,
  tokenSchema,
  refreshTokenSchema,
  
  // User authentication schemas
  userCredentialsSchema,
  userSessionSchema,
  
  // API authentication schemas
  apiKeySchema,
  authHeaderSchema,
  
  // Type exports from schemas
  type LoginFormData,
  type RegistrationFormData,
  type PasswordResetFormData,
  type ChangePasswordFormData,
  type ForgotPasswordFormData,
  type SessionData,
  type TokenData,
  type RefreshTokenData,
  type UserCredentials,
  type UserSession,
  type ApiKeyData,
  type AuthHeaderData,
} from './auth-schema';

// =============================================================================
// PASSWORD VALIDATION & SECURITY
// =============================================================================

/**
 * Password strength validation utilities with configurable security requirements
 * Supports enterprise-grade password policies and strength assessment
 */
export {
  // Password validation functions
  validatePasswordStrength,
  checkPasswordComplexity,
  isPasswordCompromised,
  generateSecurePassword,
  
  // Password policy utilities
  getPasswordRequirements,
  validatePasswordPolicy,
  
  // Password strength assessment
  calculatePasswordScore,
  getPasswordStrengthLevel,
  
  // Password security utilities
  hashPassword,
  verifyPassword,
  
  // Type exports
  type PasswordStrengthResult,
  type PasswordPolicy,
  type PasswordRequirements,
  type PasswordSecurityLevel,
} from './password-validation';

// =============================================================================
// JWT TOKEN MANAGEMENT
// =============================================================================

/**
 * JWT token utilities for authentication, validation, and automatic refresh
 * Supports Next.js middleware integration and edge-optimized token handling
 */
export {
  // Token creation and validation
  createJWT,
  validateJWT,
  decodeJWT,
  refreshJWT,
  
  // Token utility functions
  isTokenExpired,
  getTokenExpiration,
  extractTokenPayload,
  
  // Token refresh utilities
  shouldRefreshToken,
  performTokenRefresh,
  
  // JWT middleware utilities
  extractTokenFromHeaders,
  attachTokenToHeaders,
  
  // Token revocation
  revokeToken,
  isTokenRevoked,
  
  // Type exports
  type JWTPayload,
  type JWTHeader,
  type TokenValidationResult,
  type RefreshTokenResult,
  type TokenExtractionResult,
} from './jwt';

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Session management utilities for server-side and client-side session handling
 * Optimized for Next.js SSR/ISR with edge middleware support
 */
export {
  // Session creation and management
  createSession,
  validateSession,
  updateSession,
  destroySession,
  
  // Session state utilities
  getSessionData,
  setSessionData,
  clearSessionData,
  
  // Session expiration handling
  isSessionExpired,
  extendSession,
  refreshSession,
  
  // Session middleware utilities
  extractSessionFromRequest,
  attachSessionToResponse,
  
  // Session security
  validateSessionIntegrity,
  regenerateSessionId,
  
  // Concurrent session management
  detectConcurrentSessions,
  invalidateOtherSessions,
  
  // Type exports
  type SessionConfig,
  type SessionStore,
  type SessionMiddleware,
  type ConcurrentSessionData,
} from './session';

// =============================================================================
// COOKIE UTILITIES
// =============================================================================

/**
 * Secure cookie utilities for authentication token storage
 * Implements security best practices with HttpOnly, Secure, and SameSite attributes
 */
export {
  // Cookie creation and management
  createAuthCookie,
  readAuthCookie,
  updateAuthCookie,
  deleteAuthCookie,
  
  // Secure cookie utilities
  setSecureCookie,
  getSecureCookie,
  clearSecureCookie,
  
  // Cookie configuration
  getDefaultCookieOptions,
  createCookieOptions,
  
  // Cookie validation
  validateCookieSignature,
  isCookieSecure,
  
  // Session cookie utilities
  setSessionCookie,
  getSessionCookie,
  clearSessionCookie,
  
  // Type exports
  type CookieOptions,
  type SecureCookieConfig,
  type AuthCookieData,
} from './cookies';

// =============================================================================
// NEXT.JS MIDDLEWARE UTILITIES
// =============================================================================

/**
 * Next.js middleware utilities for edge-based authentication and authorization
 * Optimized for Next.js 15.1+ App Router with comprehensive security flows
 */
export {
  // Middleware authentication functions
  authenticateRequest,
  authorizeRequest,
  validateMiddlewareToken,
  
  // Request/response utilities
  extractAuthFromRequest,
  attachAuthToResponse,
  redirectToLogin,
  
  // Edge middleware optimization
  createEdgeAuthValidator,
  optimizeMiddlewareResponse,
  
  // Authorization utilities
  checkUserPermissions,
  enforceRoleBasedAccess,
  validateResourceAccess,
  
  // Middleware configuration
  createAuthMiddleware,
  configureMiddlewareOptions,
  
  // Error handling
  handleAuthenticationError,
  handleAuthorizationError,
  
  // Type exports
  type MiddlewareAuthResult,
  type MiddlewareConfig,
  type AuthRequest,
  type AuthResponse,
  type PermissionCheck,
  type RoleBasedAccess,
} from './middleware-utils';

// =============================================================================
// GENERAL VALIDATORS
// =============================================================================

/**
 * General authentication validators for forms and API validation
 * Includes email, username, and credential validation utilities
 */
export {
  // Email validation
  validateEmail,
  isValidEmailFormat,
  normalizeEmail,
  
  // Username validation
  validateUsername,
  isValidUsername,
  normalizeUsername,
  
  // Credential validation
  validateCredentials,
  sanitizeCredentials,
  
  // Input sanitization
  sanitizeAuthInput,
  validateAuthInput,
  
  // Form validation utilities
  createAuthValidator,
  validateAuthForm,
  
  // API validation
  validateApiCredentials,
  validateAuthHeaders,
  
  // Type exports
  type EmailValidationResult,
  type UsernameValidationResult,
  type CredentialValidationResult,
  type AuthInputValidation,
  type FormValidationResult,
} from './validators';

// =============================================================================
// AUTHENTICATION CONSTANTS
// =============================================================================

/**
 * Authentication constants and configuration values
 * Centralized configuration for authentication flows and security settings
 */
export {
  // Authentication endpoints
  AUTH_ENDPOINTS,
  
  // Token configuration
  TOKEN_CONFIG,
  JWT_CONFIG,
  
  // Session configuration
  SESSION_CONFIG,
  
  // Cookie configuration
  COOKIE_CONFIG,
  
  // Security configuration
  SECURITY_CONFIG,
  
  // Validation configuration
  VALIDATION_CONFIG,
  
  // Error messages
  AUTH_ERROR_MESSAGES,
  
  // Success messages
  AUTH_SUCCESS_MESSAGES,
  
  // Default values
  DEFAULT_AUTH_VALUES,
  
  // Timeout configurations
  AUTH_TIMEOUTS,
  
  // Permission constants
  PERMISSIONS,
  ROLES,
  
  // Route protection constants
  PROTECTED_ROUTES,
  PUBLIC_ROUTES,
  
  // Type exports
  type AuthEndpoints,
  type TokenConfiguration,
  type SessionConfiguration,
  type CookieConfiguration,
  type SecurityConfiguration,
  type ValidationConfiguration,
  type AuthErrorMessages,
  type AuthSuccessMessages,
  type Permission,
  type Role,
} from './constants';

// =============================================================================
// RE-EXPORTED TYPES FOR CONVENIENCE
// =============================================================================

/**
 * Commonly used authentication types re-exported for convenience
 * Reduces import complexity for frequently used types
 */
export type {
  // Core authentication types
  AuthenticationResult,
  AuthorizationResult,
  AuthenticationError,
  
  // User types
  AuthenticatedUser,
  UserPermissions,
  UserRole,
  
  // Token types
  AccessToken,
  RefreshToken,
  TokenPair,
  
  // Session types
  ActiveSession,
  SessionToken,
  
  // Request/Response types
  AuthenticatedRequest,
  AuthorizedResponse,
  
  // Middleware types
  AuthMiddleware,
  AuthGuard,
} from './types';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * High-level authentication utility functions
 * Provides convenient APIs for common authentication operations
 */

/**
 * Initialize authentication system with configuration
 * @param config - Authentication configuration options
 */
export function initializeAuth(config?: Partial<SecurityConfiguration>): void;

/**
 * Check if user is authenticated
 * @param request - Request object or session data
 * @returns Boolean indicating authentication status
 */
export function isAuthenticated(request?: any): boolean;

/**
 * Get current user information
 * @param request - Request object containing session
 * @returns Current user data or null
 */
export function getCurrentUser(request?: any): AuthenticatedUser | null;

/**
 * Perform logout operation
 * @param options - Logout configuration options
 */
export function logout(options?: { clearSession?: boolean; redirectUrl?: string }): Promise<void>;

/**
 * Refresh authentication tokens
 * @param refreshToken - Current refresh token
 * @returns New token pair or error
 */
export function refreshAuthentication(refreshToken: string): Promise<TokenPair>;

/**
 * Check user permissions for specific resource
 * @param permission - Required permission
 * @param user - User data (optional, can be extracted from context)
 * @returns Boolean indicating access permission
 */
export function hasPermission(permission: string, user?: AuthenticatedUser): boolean;

/**
 * Create authentication context for React components
 * @param initialState - Initial authentication state
 * @returns Authentication context provider and hooks
 */
export function createAuthContext(initialState?: Partial<UserSession>): {
  AuthProvider: React.ComponentType<{ children: React.ReactNode }>;
  useAuth: () => UserSession;
  useAuthActions: () => AuthActions;
};

// Type definitions for utility functions
export interface AuthActions {
  login: (credentials: UserCredentials) => Promise<AuthenticationResult>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<TokenPair>;
  updateUser: (userData: Partial<AuthenticatedUser>) => Promise<void>;
  checkPermission: (permission: string) => boolean;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  roles: UserRole[];
  permissions: UserPermissions;
  lastLogin?: Date;
  sessionId: string;
}

export interface TokenPair {
  accessToken: AccessToken;
  refreshToken: RefreshToken;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthenticationResult {
  success: boolean;
  user?: AuthenticatedUser;
  tokens?: TokenPair;
  error?: AuthenticationError;
}

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: string[];
}

export interface AuthenticationError {
  code: string;
  message: string;
  details?: Record<string, any>;
}