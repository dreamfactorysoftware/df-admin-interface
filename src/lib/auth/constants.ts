/**
 * Authentication Constants and Configuration
 * 
 * Centralized configuration for all authentication-related functionality
 * including token keys, cookie names, expiration times, security policies,
 * and authentication endpoints. Provides environment-specific settings
 * for Next.js 15.1+ middleware and React 19 authentication flows.
 * 
 * Key features:
 * - JWT token and session configuration
 * - Security policy constants with 16-character minimum password requirements
 * - Authentication endpoint definitions for DreamFactory API integration
 * - Cookie security configuration with SameSite=Strict and HttpOnly
 * - Support for LDAP, OAuth, and SAML authentication services
 * - Comprehensive validation rules and timeout settings
 */

// =============================================================================
// TOKEN AND SESSION CONFIGURATION
// =============================================================================

/**
 * JWT token configuration constants
 * Used by Next.js middleware for token validation and management
 */
export const TOKEN_CONFIG = {
  /** Primary JWT token key for API authentication */
  SESSION_TOKEN_KEY: 'session_token',
  /** Legacy token key for backward compatibility */
  LEGACY_TOKEN_KEY: 'sessionToken',
  /** JWT token header name for API requests */
  AUTHORIZATION_HEADER: 'Authorization',
  /** Bearer token prefix for authorization headers */
  BEARER_PREFIX: 'Bearer',
  /** API key header name for DreamFactory services */
  API_KEY_HEADER: 'X-DreamFactory-API-Key',
  /** Session ID header for request tracking */
  SESSION_ID_HEADER: 'X-DreamFactory-Session-Id',
  /** JWT issuer identifier */
  JWT_ISSUER: 'dreamfactory-admin',
  /** JWT audience identifier */
  JWT_AUDIENCE: 'dreamfactory-users',
} as const;

/**
 * Session configuration constants
 * Defines session lifecycle and management parameters
 */
export const SESSION_CONFIG = {
  /** Default session duration in seconds (8 hours) */
  DEFAULT_SESSION_DURATION: 8 * 60 * 60,
  /** Extended session duration for "remember me" (30 days) */
  EXTENDED_SESSION_DURATION: 30 * 24 * 60 * 60,
  /** Session refresh threshold in seconds (30 minutes before expiry) */
  REFRESH_THRESHOLD: 30 * 60,
  /** Maximum session duration in seconds (7 days) */
  MAX_SESSION_DURATION: 7 * 24 * 60 * 60,
  /** Session check interval in milliseconds (5 minutes) */
  SESSION_CHECK_INTERVAL: 5 * 60 * 1000,
  /** Session storage key for browser storage */
  SESSION_STORAGE_KEY: 'df_session',
  /** User data storage key for browser storage */
  USER_STORAGE_KEY: 'df_user',
  /** Last activity timestamp key */
  LAST_ACTIVITY_KEY: 'df_last_activity',
} as const;

// =============================================================================
// COOKIE CONFIGURATION
// =============================================================================

/**
 * Cookie configuration for secure session storage
 * Implements security best practices with HttpOnly and SameSite=Strict
 */
export const COOKIE_CONFIG = {
  /** Primary session cookie name */
  SESSION_COOKIE_NAME: 'df-session-token',
  /** Refresh token cookie name */
  REFRESH_COOKIE_NAME: 'df-refresh-token',
  /** User preferences cookie name */
  PREFERENCES_COOKIE_NAME: 'df-preferences',
  /** CSRF token cookie name */
  CSRF_COOKIE_NAME: 'df-csrf-token',
  /** Default cookie path */
  COOKIE_PATH: '/',
  /** Cookie domain (set via environment variable) */
  COOKIE_DOMAIN: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined,
  /** Cookie security settings */
  SECURITY_SETTINGS: {
    /** Enable secure flag in production */
    secure: process.env.NODE_ENV === 'production',
    /** Enable HttpOnly to prevent XSS attacks */
    httpOnly: true,
    /** SameSite policy for CSRF protection */
    sameSite: 'strict' as const,
    /** Cookie max age in seconds (matches session duration) */
    maxAge: 8 * 60 * 60,
  },
  /** Extended cookie settings for "remember me" */
  EXTENDED_SETTINGS: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
} as const;

// =============================================================================
// SECURITY POLICY CONSTANTS
// =============================================================================

/**
 * Password security requirements and validation rules
 * Implements 16-character minimum requirement per security specifications
 */
export const PASSWORD_POLICY = {
  /** Minimum password length (16 characters per security specifications) */
  MIN_LENGTH: 16,
  /** Maximum password length */
  MAX_LENGTH: 128,
  /** Require uppercase letters */
  REQUIRE_UPPERCASE: true,
  /** Require lowercase letters */
  REQUIRE_LOWERCASE: true,
  /** Require numeric characters */
  REQUIRE_NUMBERS: true,
  /** Require special characters */
  REQUIRE_SPECIAL_CHARS: true,
  /** Allowed special characters */
  ALLOWED_SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  /** Password history limit (prevent reuse) */
  PASSWORD_HISTORY_LIMIT: 5,
  /** Password expiration days (0 = no expiration) */
  PASSWORD_EXPIRY_DAYS: 0,
  /** Maximum login attempts before lockout */
  MAX_LOGIN_ATTEMPTS: 5,
  /** Account lockout duration in seconds (30 minutes) */
  LOCKOUT_DURATION: 30 * 60,
} as const;

/**
 * Validation rules for authentication forms
 * Provides consistent validation across all authentication workflows
 */
export const VALIDATION_RULES = {
  /** Email validation pattern */
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** Username validation pattern (alphanumeric with underscores/hyphens) */
  USERNAME_PATTERN: /^[a-zA-Z0-9_-]+$/,
  /** Password strength pattern (at least one of each required character type) */
  PASSWORD_STRENGTH_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]).+$/,
  /** Minimum username length */
  MIN_USERNAME_LENGTH: 3,
  /** Maximum username length */
  MAX_USERNAME_LENGTH: 50,
  /** Minimum name length */
  MIN_NAME_LENGTH: 1,
  /** Maximum name length */
  MAX_NAME_LENGTH: 100,
  /** Session token validation pattern */
  SESSION_TOKEN_PATTERN: /^[A-Za-z0-9+/=]+$/,
  /** Confirmation code pattern for password reset */
  CONFIRMATION_CODE_PATTERN: /^[A-Za-z0-9]{6,8}$/,
} as const;

/**
 * Security question configuration for password recovery
 * Supports additional verification for enhanced security
 */
export const SECURITY_QUESTIONS = {
  /** Maximum number of security questions */
  MAX_QUESTIONS: 3,
  /** Minimum answer length */
  MIN_ANSWER_LENGTH: 3,
  /** Maximum answer length */
  MAX_ANSWER_LENGTH: 255,
  /** Available security questions */
  PREDEFINED_QUESTIONS: [
    'What was the name of your first pet?',
    'What city were you born in?',
    'What was your childhood nickname?',
    'What is your mother\'s maiden name?',
    'What was the make of your first car?',
    'What elementary school did you attend?',
    'What was the name of your first employer?',
  ],
} as const;

// =============================================================================
// AUTHENTICATION ENDPOINTS
// =============================================================================

/**
 * Authentication API endpoints for DreamFactory integration
 * Supports all authentication workflows and user management operations
 */
export const AUTH_ENDPOINTS = {
  /** Base API path for authentication */
  BASE_PATH: '/api/v2',
  /** User session management endpoints */
  SESSION: {
    /** Login endpoint */
    LOGIN: '/api/v2/user/session',
    /** Logout endpoint */
    LOGOUT: '/api/v2/user/session',
    /** Refresh token endpoint */
    REFRESH: '/api/v2/user/session',
    /** Session validation endpoint */
    VALIDATE: '/api/v2/user/session',
  },
  /** User management endpoints */
  USER: {
    /** User registration endpoint */
    REGISTER: '/api/v2/user/register',
    /** User profile endpoint */
    PROFILE: '/api/v2/user/profile',
    /** Password update endpoint */
    UPDATE_PASSWORD: '/api/v2/user/password',
    /** User preferences endpoint */
    PREFERENCES: '/api/v2/user/profile',
  },
  /** Password recovery endpoints */
  PASSWORD_RECOVERY: {
    /** Forgot password request endpoint */
    FORGOT_PASSWORD: '/api/v2/user/password',
    /** Password reset endpoint */
    RESET_PASSWORD: '/api/v2/user/password',
    /** Password reset confirmation endpoint */
    CONFIRM_RESET: '/api/v2/user/password',
  },
  /** System endpoints */
  SYSTEM: {
    /** System configuration endpoint */
    CONFIG: '/api/v2/system/config',
    /** Environment endpoint */
    ENVIRONMENT: '/api/v2/system/environment',
    /** Admin endpoints */
    ADMIN: '/api/v2/system/admin',
  },
} as const;

// =============================================================================
// TIMEOUT AND EXPIRATION CONFIGURATION
// =============================================================================

/**
 * Timeout configuration for authentication operations
 * Defines maximum wait times for various authentication workflows
 */
export const TIMEOUT_CONFIG = {
  /** Default API request timeout in milliseconds */
  DEFAULT_REQUEST_TIMEOUT: 30000, // 30 seconds
  /** Login request timeout in milliseconds */
  LOGIN_TIMEOUT: 15000, // 15 seconds
  /** Token refresh timeout in milliseconds */
  REFRESH_TIMEOUT: 10000, // 10 seconds
  /** Password reset request timeout in milliseconds */
  PASSWORD_RESET_TIMEOUT: 20000, // 20 seconds
  /** Session validation timeout in milliseconds */
  SESSION_VALIDATION_TIMEOUT: 5000, // 5 seconds
  /** Connection test timeout in milliseconds */
  CONNECTION_TEST_TIMEOUT: 30000, // 30 seconds
} as const;

/**
 * Token refresh configuration
 * Manages automatic token refresh behavior and timing
 */
export const REFRESH_CONFIG = {
  /** Automatic refresh enabled flag */
  AUTO_REFRESH_ENABLED: true,
  /** Refresh retry attempts */
  MAX_REFRESH_RETRIES: 3,
  /** Retry delay in milliseconds */
  RETRY_DELAY: 1000, // 1 second
  /** Exponential backoff multiplier */
  BACKOFF_MULTIPLIER: 2,
  /** Maximum backoff delay in milliseconds */
  MAX_BACKOFF_DELAY: 10000, // 10 seconds
  /** Buffer time before token expiry to trigger refresh (5 minutes) */
  REFRESH_BUFFER_TIME: 5 * 60 * 1000,
} as const;

// =============================================================================
// AUTHENTICATION SERVICE CONSTANTS
// =============================================================================

/**
 * OAuth authentication provider configuration
 * Supports external authentication integration
 */
export const OAUTH_PROVIDERS = {
  /** Google OAuth configuration */
  GOOGLE: {
    name: 'google',
    displayName: 'Google',
    scope: 'openid email profile',
    responseType: 'code',
  },
  /** Microsoft OAuth configuration */
  MICROSOFT: {
    name: 'microsoft',
    displayName: 'Microsoft',
    scope: 'openid email profile',
    responseType: 'code',
  },
  /** GitHub OAuth configuration */
  GITHUB: {
    name: 'github',
    displayName: 'GitHub',
    scope: 'user:email',
    responseType: 'code',
  },
} as const;

/**
 * LDAP authentication service configuration
 * Supports LDAP integration for enterprise environments
 */
export const LDAP_CONFIG = {
  /** Default LDAP service name */
  DEFAULT_SERVICE_NAME: 'ldap',
  /** LDAP connection timeout in milliseconds */
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  /** LDAP search timeout in milliseconds */
  SEARCH_TIMEOUT: 5000, // 5 seconds
  /** Maximum LDAP search results */
  MAX_SEARCH_RESULTS: 100,
  /** LDAP attribute mappings */
  ATTRIBUTE_MAPPING: {
    username: 'sAMAccountName',
    email: 'mail',
    firstName: 'givenName',
    lastName: 'sn',
    displayName: 'displayName',
  },
} as const;

/**
 * SAML authentication configuration
 * Supports SAML SSO integration
 */
export const SAML_CONFIG = {
  /** Default SAML service name */
  DEFAULT_SERVICE_NAME: 'saml',
  /** SAML response timeout in milliseconds */
  RESPONSE_TIMEOUT: 30000, // 30 seconds
  /** SAML assertion lifetime in seconds */
  ASSERTION_LIFETIME: 300, // 5 minutes
  /** SAML attribute mappings */
  ATTRIBUTE_MAPPING: {
    email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
    firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
    lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
    displayName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
  },
} as const;

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================

/**
 * Next.js middleware authentication configuration
 * Defines behavior for edge-based authentication processing
 */
export const MIDDLEWARE_CONFIG = {
  /** Protected route patterns */
  PROTECTED_ROUTES: [
    '/api-connections/:path*',
    '/admin-settings/:path*',
    '/system-settings/:path*',
    '/api-security/:path*',
    '/profile/:path*',
    '/adf-:path*',
  ],
  /** Public route patterns (always accessible) */
  PUBLIC_ROUTES: [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/saml-callback',
    '/api/auth/:path*',
  ],
  /** API route patterns that require authentication */
  PROTECTED_API_ROUTES: [
    '/api/v2/:path*',
    '/api/system/:path*',
  ],
  /** Admin-only route patterns */
  ADMIN_ROUTES: [
    '/admin-settings/:path*',
    '/system-settings/:path*',
    '/adf-admins/:path*',
    '/adf-users/:path*',
    '/adf-config/:path*',
  ],
  /** Routes that require system admin privileges */
  SYSTEM_ADMIN_ROUTES: [
    '/system-settings/:path*',
    '/adf-config/:path*',
  ],
} as const;

/**
 * Authentication error codes for middleware processing
 * Standardizes error handling across authentication flows
 */
export const AUTH_ERROR_CODES = {
  /** Invalid or missing credentials */
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  /** Expired authentication token */
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  /** Invalid token signature or format */
  TOKEN_INVALID: 'TOKEN_INVALID',
  /** Token refresh operation failed */
  REFRESH_FAILED: 'REFRESH_FAILED',
  /** Session has expired */
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  /** User not authenticated */
  UNAUTHORIZED: 'UNAUTHORIZED',
  /** User lacks required permissions */
  FORBIDDEN: 'FORBIDDEN',
  /** Network communication error */
  NETWORK_ERROR: 'NETWORK_ERROR',
  /** Server-side authentication error */
  SERVER_ERROR: 'SERVER_ERROR',
  /** Form validation error */
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  /** Account locked due to failed attempts */
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  /** Service unavailable */
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

// =============================================================================
// FORM VALIDATION CONSTANTS
// =============================================================================

/**
 * Form validation error messages
 * Provides consistent user-friendly error messaging
 */
export const VALIDATION_MESSAGES = {
  /** Required field messages */
  REQUIRED: {
    EMAIL: 'Email address is required',
    USERNAME: 'Username is required',
    PASSWORD: 'Password is required',
    CONFIRM_PASSWORD: 'Password confirmation is required',
    FIRST_NAME: 'First name is required',
    LAST_NAME: 'Last name is required',
    SECURITY_ANSWER: 'Security answer is required',
  },
  /** Format validation messages */
  FORMAT: {
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_USERNAME: 'Username can only contain letters, numbers, underscores, and hyphens',
    PASSWORD_TOO_SHORT: `Password must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters long`,
    PASSWORD_TOO_WEAK: 'Password must contain uppercase, lowercase, numbers, and special characters',
    PASSWORDS_DONT_MATCH: 'Passwords do not match',
    INVALID_CONFIRMATION_CODE: 'Invalid confirmation code format',
  },
  /** Authentication error messages */
  AUTH: {
    LOGIN_FAILED: 'Invalid email/username or password',
    ACCOUNT_LOCKED: 'Account locked due to too many failed login attempts',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    UNAUTHORIZED: 'You are not authorized to access this resource',
    TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
  },
  /** Password reset messages */
  PASSWORD_RESET: {
    EMAIL_SENT: 'Password reset instructions have been sent to your email',
    INVALID_TOKEN: 'Invalid or expired password reset token',
    PASSWORD_UPDATED: 'Password has been successfully updated',
    RESET_FAILED: 'Password reset failed. Please try again.',
  },
} as const;

/**
 * Form field configuration for authentication forms
 * Standardizes form field behavior and validation
 */
export const FORM_CONFIG = {
  /** Debounce delay for real-time validation in milliseconds */
  VALIDATION_DEBOUNCE: 300,
  /** Auto-focus first field on form mount */
  AUTO_FOCUS_FIRST_FIELD: true,
  /** Clear form on successful submission */
  CLEAR_ON_SUCCESS: true,
  /** Show password strength indicator */
  SHOW_PASSWORD_STRENGTH: true,
  /** Enable remember me option */
  ENABLE_REMEMBER_ME: true,
  /** Maximum login attempts display */
  SHOW_LOGIN_ATTEMPTS: true,
} as const;

// =============================================================================
// ENVIRONMENT-SPECIFIC CONFIGURATION
// =============================================================================

/**
 * Environment-specific configuration overrides
 * Allows customization based on deployment environment
 */
export const ENV_CONFIG = {
  /** Development environment settings */
  DEVELOPMENT: {
    /** Enable debug logging */
    DEBUG_AUTH: process.env.NODE_ENV === 'development',
    /** Relaxed CORS settings */
    CORS_ORIGIN: '*',
    /** Extended session for development */
    SESSION_DURATION: 24 * 60 * 60, // 24 hours
    /** Disable HTTPS requirement */
    REQUIRE_HTTPS: false,
  },
  /** Production environment settings */
  PRODUCTION: {
    /** Disable debug logging */
    DEBUG_AUTH: false,
    /** Strict CORS settings */
    CORS_ORIGIN: process.env.NEXT_PUBLIC_APP_URL || 'https://app.dreamfactory.com',
    /** Standard session duration */
    SESSION_DURATION: 8 * 60 * 60, // 8 hours
    /** Require HTTPS */
    REQUIRE_HTTPS: true,
  },
} as const;

/**
 * Feature flags for authentication functionality
 * Enables/disables specific authentication features
 */
export const FEATURE_FLAGS = {
  /** Enable OAuth authentication */
  OAUTH_ENABLED: process.env.NEXT_PUBLIC_OAUTH_ENABLED === 'true',
  /** Enable LDAP authentication */
  LDAP_ENABLED: process.env.NEXT_PUBLIC_LDAP_ENABLED === 'true',
  /** Enable SAML authentication */
  SAML_ENABLED: process.env.NEXT_PUBLIC_SAML_ENABLED === 'true',
  /** Enable user registration */
  REGISTRATION_ENABLED: process.env.NEXT_PUBLIC_REGISTRATION_ENABLED !== 'false',
  /** Enable password recovery */
  PASSWORD_RECOVERY_ENABLED: process.env.NEXT_PUBLIC_PASSWORD_RECOVERY_ENABLED !== 'false',
  /** Enable security questions */
  SECURITY_QUESTIONS_ENABLED: process.env.NEXT_PUBLIC_SECURITY_QUESTIONS_ENABLED === 'true',
  /** Enable remember me functionality */
  REMEMBER_ME_ENABLED: process.env.NEXT_PUBLIC_REMEMBER_ME_ENABLED !== 'false',
  /** Enable automatic token refresh */
  AUTO_REFRESH_ENABLED: process.env.NEXT_PUBLIC_AUTO_REFRESH_ENABLED !== 'false',
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Export all constant object types for type safety
export type TokenConfig = typeof TOKEN_CONFIG;
export type SessionConfig = typeof SESSION_CONFIG;
export type CookieConfig = typeof COOKIE_CONFIG;
export type PasswordPolicy = typeof PASSWORD_POLICY;
export type ValidationRules = typeof VALIDATION_RULES;
export type AuthEndpoints = typeof AUTH_ENDPOINTS;
export type TimeoutConfig = typeof TIMEOUT_CONFIG;
export type RefreshConfig = typeof REFRESH_CONFIG;
export type OAuthProviders = typeof OAUTH_PROVIDERS;
export type LdapConfig = typeof LDAP_CONFIG;
export type SamlConfig = typeof SAML_CONFIG;
export type MiddlewareConfig = typeof MIDDLEWARE_CONFIG;
export type AuthErrorCodes = typeof AUTH_ERROR_CODES;
export type ValidationMessages = typeof VALIDATION_MESSAGES;
export type FormConfig = typeof FORM_CONFIG;
export type EnvConfig = typeof ENV_CONFIG;
export type FeatureFlags = typeof FEATURE_FLAGS;