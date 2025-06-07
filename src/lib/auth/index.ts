/**
 * @fileoverview Authentication Library Barrel Exports
 * 
 * Centralized export file for all authentication utilities, providing clean import
 * patterns throughout the application and supporting tree-shaking optimization
 * for Next.js build pipeline. Organized by functional areas for optimal developer
 * experience and maintainability.
 * 
 * Features:
 * - Tree-shaking optimized exports for minimal bundle size
 * - Organized by functional domains (schemas, validation, tokens, etc.)
 * - TypeScript-first design with comprehensive type exports
 * - Next.js 15.1+ and React 19 compatibility
 * - Enterprise-grade authentication patterns
 * 
 * @version 1.0.0
 * @since React 19 / Next.js 15.1 migration
 */

// =============================================================================
// AUTHENTICATION SCHEMAS AND FORM VALIDATION
// =============================================================================

/**
 * Authentication form schemas for React Hook Form integration
 * Provides comprehensive validation for all authentication workflows
 */
export {
  // Core authentication schemas
  createLoginFormSchema,
  createRegistrationFormSchema,
  createPasswordResetFormSchema,
  createForgotPasswordFormSchema,
  createConfirmationCodeFormSchema,
  createAuthenticationSchemas,
  
  // Pre-configured schemas for common use cases
  LOGIN_FORM_SCHEMA,
  LDAP_LOGIN_FORM_SCHEMA,
  REGISTRATION_FORM_SCHEMA,
  EMAIL_CONFIRMATION_REGISTRATION_SCHEMA,
  PASSWORD_RESET_FORM_SCHEMA,
  SECURE_PASSWORD_RESET_SCHEMA,
  FORGOT_PASSWORD_FORM_SCHEMA,
  FLEXIBLE_FORGOT_PASSWORD_SCHEMA,
  EMAIL_CONFIRMATION_CODE_SCHEMA,
  TWO_FACTOR_CODE_SCHEMA,
  USER_PROFILE_SCHEMA,
  
  // OAuth and SAML schemas
  createOAuthFormSchema,
  createSAMLFormSchema,
  
  // Schema configuration and types
  type AuthSystemConfig,
  type OAuthProviderConfig,
  type SAMLServiceConfig,
  type LoginFormData,
  type RegistrationFormData,
  type PasswordResetFormData,
  type ForgotPasswordFormData,
  type EmailConfirmationFormData,
  type UserProfileData,
} from './auth-schema';

// =============================================================================
// PASSWORD VALIDATION AND SECURITY
// =============================================================================

/**
 * Password validation utilities with enterprise security features
 * Implements comprehensive password policies and strength checking
 */
export {
  // Main validation functions
  validatePassword,
  validatePasswordMatch,
  checkPasswordExpiration,
  validatePasswordRealTime,
  
  // Schema creation functions
  createPasswordValidationSchema,
  passwordSchema,
  
  // Utility functions
  getPasswordStrengthMeter,
  
  // Configuration and types
  DEFAULT_PASSWORD_POLICY,
  DEFAULT_EXPIRATION_CONFIG,
  type PasswordValidationResult,
  type PasswordMatchResult,
  type PasswordPolicyConfig,
  type PasswordExpirationConfig,
  type UserPasswordContext,
  type PasswordStrength,
} from './password-validation';

// =============================================================================
// JWT TOKEN MANAGEMENT
// =============================================================================

/**
 * JWT token handling with validation, parsing, and lifecycle management
 * Provides comprehensive token operations for secure authentication
 */
export {
  // Core JWT functions
  parseJWTPayload,
  validateJWTToken,
  isTokenExpired,
  needsTokenRefresh,
  getTimeToExpiry,
  isValidJWTFormat,
  
  // Token refresh and lifecycle management
  TokenRefreshManager,
  JWTLifecycleManager,
  globalTokenRefreshManager,
  globalJWTLifecycleManager,
  
  // Middleware integration
  extractTokenFromRequest,
  validateTokenForMiddleware,
  
  // Utility functions
  createMockJWT,
  formatJWTError,
  shouldForceReauth,
  
  // Types and enums
  type JWTPayload,
  type JWTValidationResult,
  type TokenRefreshConfig,
  type TokenRefreshResult,
  type TokenSecurityOptions,
  JWTValidationError,
  
  // Default export object
  default as jwtUtils,
} from './jwt';

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Session lifecycle management with state persistence and validation
 * Handles user sessions, authentication state, and cross-tab synchronization
 */
export {
  // Session management functions
  getSessionManager,
  initializeSession,
  createUserSession,
  validateSession,
  refreshCurrentSession,
  logoutUser,
  getCurrentUserSession,
  isAuthenticated,
  userHasPermission,
  userHasRole,
  getSessionTimeRemaining,
  updateUserActivity,
  onSessionStateChange,
  emergencySessionInvalidation,
  
  // Session manager class
  SessionManager,
  
  // React integration
  createSessionHook,
  
  // Types and interfaces
  type UserSession,
  type SessionInitOptions,
  type SessionValidationResult,
  type SessionRefreshResult,
  type SessionEventData,
  type SessionStateChangeListener,
  type UseSessionData,
} from './session';

// =============================================================================
// COOKIE MANAGEMENT
// =============================================================================

/**
 * Secure HTTP-only cookie operations with SameSite=Strict configuration
 * Provides session token storage and cookie lifecycle management
 */
export {
  // Core cookie functions
  storeSessionToken,
  getSessionToken,
  refreshSessionToken,
  getRefreshToken,
  getCsrfToken,
  
  // Cookie validation and parsing
  validateCookie,
  parseCookiesFromRequest,
  
  // Cross-domain cookie support
  setCrossDomainCookie,
  synchronizeCrossSubdomainCookies,
  
  // Cookie cleanup utilities
  performLogoutCleanup,
  cleanupExpiredCookies,
  emergencySessionInvalidation as emergencyCookieInvalidation,
  
  // Response helper functions for middleware
  setResponseCookie,
  deleteResponseCookie,
  
  // Configuration and types
  COOKIE_CONFIG,
  SECURE_COOKIE_DEFAULTS,
  type CookieOptions,
  type SessionData,
  type CookieValidationResult,
  type CookieCleanupOptions,
  type CrossDomainCookieConfig,
} from './cookies';

// =============================================================================
// AUTHENTICATION CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Authentication constants, configuration, and type definitions
 * Centralized configuration for JWT, cookies, sessions, and security policies
 */
export {
  // HTTP headers and token keys
  AUTH_HEADERS,
  TOKEN_KEYS,
  JWT_CONFIG,
  
  // Cookie configuration
  COOKIE_CONFIG,
  
  // Session and expiration settings
  SESSION_CONFIG,
  TOKEN_EXPIRATION,
  
  // Security and validation
  SECURITY_CONFIG,
  RATE_LIMITS,
  VALIDATION_PATTERNS,
  VALIDATION_MESSAGES,
  
  // Authentication flow constants
  AUTH_STATES,
  AUTH_EVENTS,
  
  // Route protection and RBAC
  PROTECTED_ROUTES,
  RBAC_PERMISSIONS,
  
  // Environment configuration
  ENV_CONFIG,
  getAuthConfig,
  
  // Middleware configuration
  MIDDLEWARE_CONFIG,
  
  // Audit and logging
  AUDIT_EVENTS,
  LOG_LEVELS,
  
  // Type exports
  type AuthHeader,
  type TokenKey,
  type AuthEndpoint,
  type AuthServiceType,
  type AuthState,
  type AuthEvent,
  type RBACPermission,
  type AuditEvent,
  type LogLevel,
} from './constants';

// =============================================================================
// AUTHENTICATION VALIDATORS
// =============================================================================

/**
 * Authentication validation utilities for React Hook Form and Zod integration
 * Provides comprehensive form validation with performance optimization
 */
export {
  // Schema creation functions
  createEmailSchema,
  createUsernameSchema,
  createPasswordSchema,
  createPasswordMatchValidator,
  createLdapServiceSchema,
  createSecurityQuestionAndAnswerSchema,
  createConfirmationCodeSchema,
  createAuthFormSchema,
  
  // Validation functions
  validateEmail,
  validateUsername,
  validatePassword as validatePasswordField,
  validatePasswordMatch as validatePasswordMatchField,
  validateLdapService,
  validateSecurityQuestionAndAnswer,
  validateConfirmationCode,
  
  // Performance and utility functions
  handleAuthFormErrors,
  createDebouncedValidator,
  createValidationError,
  validateAuthFormPerformance,
  
  // Configuration constants
  DEFAULT_PASSWORD_CONFIG,
  
  // Types and interfaces
  type AuthenticationField,
  type LoginValidationMode,
  type LdapServiceConfig,
  type SecurityQuestionConfig,
  type PasswordStrengthConfig,
  type ConfirmationCodeConfig,
  type AuthFormValidationOptions,
} from './validators';

// =============================================================================
// NEXT.JS MIDDLEWARE UTILITIES
// =============================================================================

/**
 * Next.js middleware authentication utilities for edge-based processing
 * Provides comprehensive authentication handling in middleware context
 */
export {
  // Core middleware functions
  handleMiddlewareAuth,
  processAuthentication,
  shouldProcessRequest,
  middlewareConfig,
  
  // Token and session utilities
  extractToken,
  validateToken,
  parseJWTPayload as parseMiddlewareJWT,
  refreshAuthToken,
  createAuthContext,
  createUnauthenticatedContext,
  
  // Route protection
  isPublicRoute,
  isAdminRoute,
  validateRouteAccess,
  checkUserPermissions,
  
  // Request/response utilities
  addAuthHeaders,
  setAuthCookies,
  clearAuthCookies,
  createLoginRedirect,
  createAccessDeniedResponse,
  
  // Security monitoring
  logAuthEvent,
  detectSuspiciousActivity,
  
  // Types for middleware
  type JWTPayload as MiddlewareJWTPayload,
  type UserSession as MiddlewareUserSession,
  type AuthContext,
  type AuthResult,
  type TokenValidationResult,
  type RefreshResult,
  type RouteProtection,
  type AuthAuditEvent,
} from './middleware-utils';

// =============================================================================
// CONVENIENCE RE-EXPORTS AND UTILITIES
// =============================================================================

/**
 * Commonly used authentication utilities exported for convenience
 * Provides quick access to frequently needed functions
 */

// Most commonly used validation schemas
export const commonSchemas = {
  login: LOGIN_FORM_SCHEMA,
  registration: REGISTRATION_FORM_SCHEMA,
  passwordReset: PASSWORD_RESET_FORM_SCHEMA,
  forgotPassword: FORGOT_PASSWORD_FORM_SCHEMA,
  emailConfirmation: EMAIL_CONFIRMATION_CODE_SCHEMA,
} as const;

// Most commonly used validation functions
export const commonValidators = {
  email: createEmailSchema,
  username: createUsernameSchema,
  password: createPasswordSchema,
  passwordMatch: createPasswordMatchValidator,
} as const;

// Authentication state helpers
export const authHelpers = {
  isAuthenticated,
  userHasPermission,
  userHasRole,
  getCurrentUserSession,
  getSessionTimeRemaining,
  updateUserActivity,
} as const;

// Token utilities
export const tokenUtils = {
  parse: parseJWTPayload,
  validate: validateJWTToken,
  isExpired: isTokenExpired,
  needsRefresh: needsTokenRefresh,
  getTimeToExpiry,
  formatError: formatJWTError,
} as const;

// Session utilities
export const sessionUtils = {
  initialize: initializeSession,
  create: createUserSession,
  validate: validateSession,
  refresh: refreshCurrentSession,
  logout: logoutUser,
  manager: getSessionManager,
} as const;

// =============================================================================
// TYPE-ONLY EXPORTS FOR ENHANCED DEVELOPER EXPERIENCE
// =============================================================================

/**
 * Comprehensive type exports for external consumption
 * Enables type-safe integration across the application
 */

// Form data types
export type {
  LoginFormData,
  RegistrationFormData,
  PasswordResetFormData,
  ForgotPasswordFormData,
  EmailConfirmationFormData,
  UserProfileData,
} from './auth-schema';

// Password validation types
export type {
  PasswordValidationResult,
  PasswordMatchResult,
  PasswordPolicyConfig,
  PasswordExpirationConfig,
  UserPasswordContext,
  PasswordStrength,
} from './password-validation';

// JWT types
export type {
  JWTPayload,
  JWTValidationResult,
  TokenRefreshConfig,
  TokenRefreshResult,
  TokenSecurityOptions,
} from './jwt';

// Session types
export type {
  UserSession,
  SessionInitOptions,
  SessionValidationResult,
  SessionRefreshResult,
  SessionEventData,
  SessionStateChangeListener,
  UseSessionData,
} from './session';

// Cookie types
export type {
  CookieOptions,
  SessionData,
  CookieValidationResult,
  CookieCleanupOptions,
  CrossDomainCookieConfig,
} from './cookies';

// Validator types
export type {
  AuthenticationField,
  LoginValidationMode,
  LdapServiceConfig,
  SecurityQuestionConfig,
  PasswordStrengthConfig,
  ConfirmationCodeConfig,
  AuthFormValidationOptions,
} from './validators';

// Middleware types
export type {
  AuthContext,
  AuthResult,
  TokenValidationResult,
  RefreshResult,
  RouteProtection,
  AuthAuditEvent,
} from './middleware-utils';

// Constants types
export type {
  AuthHeader,
  TokenKey,
  AuthEndpoint,
  AuthServiceType,
  AuthState,
  AuthEvent,
  RBACPermission,
  AuditEvent,
  LogLevel,
} from './constants';

// =============================================================================
// DEFAULT EXPORT FOR COMPREHENSIVE ACCESS
// =============================================================================

/**
 * Default export providing organized access to all authentication utilities
 * Enables both named imports and namespace imports for flexibility
 */
const authLib = {
  // Schema utilities
  schemas: {
    create: {
      login: createLoginFormSchema,
      registration: createRegistrationFormSchema,
      passwordReset: createPasswordResetFormSchema,
      forgotPassword: createForgotPasswordFormSchema,
      confirmationCode: createConfirmationCodeFormSchema,
      oauth: createOAuthFormSchema,
      saml: createSAMLFormSchema,
      comprehensive: createAuthenticationSchemas,
    },
    common: commonSchemas,
  },
  
  // Validation utilities
  validators: {
    create: {
      email: createEmailSchema,
      username: createUsernameSchema,
      password: createPasswordSchema,
      passwordMatch: createPasswordMatchValidator,
      ldapService: createLdapServiceSchema,
      securityQuestion: createSecurityQuestionAndAnswerSchema,
      confirmationCode: createConfirmationCodeSchema,
      authForm: createAuthFormSchema,
    },
    validate: {
      email: validateEmail,
      username: validateUsername,
      password: validatePasswordField,
      passwordMatch: validatePasswordMatchField,
      ldapService: validateLdapService,
      securityQuestion: validateSecurityQuestionAndAnswer,
      confirmationCode: validateConfirmationCode,
    },
    common: commonValidators,
  },
  
  // Password utilities
  password: {
    validate: validatePassword,
    validateMatch: validatePasswordMatch,
    checkExpiration: checkPasswordExpiration,
    validateRealTime: validatePasswordRealTime,
    createSchema: createPasswordValidationSchema,
    getStrengthMeter: getPasswordStrengthMeter,
    config: DEFAULT_PASSWORD_POLICY,
  },
  
  // JWT utilities
  jwt: {
    parse: parseJWTPayload,
    validate: validateJWTToken,
    isExpired: isTokenExpired,
    needsRefresh: needsTokenRefresh,
    getTimeToExpiry,
    formatError: formatJWTError,
    shouldForceReauth,
    createMock: createMockJWT,
    RefreshManager: TokenRefreshManager,
    LifecycleManager: JWTLifecycleManager,
    middleware: {
      extract: extractTokenFromRequest,
      validate: validateTokenForMiddleware,
    },
  },
  
  // Session utilities
  session: {
    manager: getSessionManager,
    initialize: initializeSession,
    create: createUserSession,
    validate: validateSession,
    refresh: refreshCurrentSession,
    logout: logoutUser,
    getCurrent: getCurrentUserSession,
    isAuthenticated,
    hasPermission: userHasPermission,
    hasRole: userHasRole,
    getTimeRemaining: getSessionTimeRemaining,
    updateActivity: updateUserActivity,
    onStateChange: onSessionStateChange,
    emergencyInvalidate: emergencySessionInvalidation,
  },
  
  // Cookie utilities
  cookies: {
    store: storeSessionToken,
    get: getSessionToken,
    refresh: refreshSessionToken,
    getRefresh: getRefreshToken,
    getCsrf: getCsrfToken,
    validate: validateCookie,
    parse: parseCookiesFromRequest,
    cleanup: performLogoutCleanup,
    cleanupExpired: cleanupExpiredCookies,
    crossDomain: {
      set: setCrossDomainCookie,
      synchronize: synchronizeCrossSubdomainCookies,
    },
    response: {
      set: setResponseCookie,
      delete: deleteResponseCookie,
    },
  },
  
  // Middleware utilities
  middleware: {
    handle: handleMiddlewareAuth,
    process: processAuthentication,
    shouldProcess: shouldProcessRequest,
    config: middlewareConfig,
    route: {
      isPublic: isPublicRoute,
      isAdmin: isAdminRoute,
      validateAccess: validateRouteAccess,
      checkPermissions: checkUserPermissions,
    },
    request: {
      addHeaders: addAuthHeaders,
      setAuthCookies,
      clearAuthCookies,
      createLoginRedirect,
      createAccessDeniedResponse,
    },
    security: {
      log: logAuthEvent,
      detectSuspicious: detectSuspiciousActivity,
    },
  },
  
  // Constants and configuration
  constants: {
    headers: AUTH_HEADERS,
    tokens: TOKEN_KEYS,
    jwt: JWT_CONFIG,
    cookies: COOKIE_CONFIG,
    session: SESSION_CONFIG,
    security: SECURITY_CONFIG,
    validation: VALIDATION_PATTERNS,
    states: AUTH_STATES,
    events: AUTH_EVENTS,
    routes: PROTECTED_ROUTES,
    permissions: RBAC_PERMISSIONS,
    audit: AUDIT_EVENTS,
    logs: LOG_LEVELS,
  },
  
  // Helper utilities
  helpers: authHelpers,
  utils: {
    token: tokenUtils,
    session: sessionUtils,
  },
} as const;

export default authLib;