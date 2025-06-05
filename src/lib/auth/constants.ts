/**
 * Authentication Constants and Configuration
 * 
 * Centralized authentication constants for the DreamFactory Admin Interface.
 * Provides configuration for JWT tokens, cookies, session management, 
 * security policies, and authentication endpoints.
 */

// =============================================================================
// TOKEN AND HEADER CONSTANTS
// =============================================================================

/**
 * HTTP header keys for authentication
 */
export const AUTH_HEADERS = {
  SESSION_TOKEN: 'X-DreamFactory-Session-Token',
  API_KEY: 'X-DreamFactory-API-Key', 
  LICENSE_KEY: 'X-DreamFactory-License-Key',
  AUTHORIZATION: 'Authorization',
} as const;

/**
 * Token storage keys
 */
export const TOKEN_KEYS = {
  SESSION_TOKEN: 'session_token',
  REFRESH_TOKEN: 'refresh_token',
  API_KEY: 'api_key',
  CSRF_TOKEN: 'csrf_token',
} as const;

/**
 * JWT token configuration
 */
export const JWT_CONFIG = {
  ALGORITHM: 'HS256',
  ISSUER: 'dreamfactory',
  AUDIENCE: 'dreamfactory-admin',
  TOKEN_TYPE: 'Bearer',
  CLAIMS: {
    USER_ID: 'sub',
    EMAIL: 'email',
    ROLES: 'roles',
    PERMISSIONS: 'permissions',
    SESSION_ID: 'sid',
    ISSUED_AT: 'iat',
    EXPIRES_AT: 'exp',
    NOT_BEFORE: 'nbf',
  },
} as const;

// =============================================================================
// COOKIE CONFIGURATION
// =============================================================================

/**
 * Cookie names and configuration
 */
export const COOKIE_CONFIG = {
  NAMES: {
    SESSION_TOKEN: 'df_session',
    REFRESH_TOKEN: 'df_refresh',
    CSRF_TOKEN: 'df_csrf',
    PREFERENCES: 'df_prefs',
    THEME: 'df_theme',
  },
  OPTIONS: {
    SECURE: process.env.NODE_ENV === 'production',
    HTTP_ONLY: true,
    SAME_SITE: 'strict' as const,
    PATH: '/',
    MAX_AGE: 60 * 60 * 24 * 30, // 30 days in seconds
  },
  DOMAIN: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined,
} as const;

// =============================================================================
// SESSION AND EXPIRATION CONFIGURATION
// =============================================================================

/**
 * Session timeout and expiration settings
 */
export const SESSION_CONFIG = {
  // Session timeouts (in milliseconds)
  TIMEOUTS: {
    DEFAULT: 60 * 60 * 1000, // 1 hour
    EXTENDED: 8 * 60 * 60 * 1000, // 8 hours
    REMEMBER_ME: 30 * 24 * 60 * 60 * 1000, // 30 days
    ADMIN: 2 * 60 * 60 * 1000, // 2 hours
  },
  
  // Token refresh settings
  REFRESH: {
    THRESHOLD: 5 * 60 * 1000, // Refresh when 5 minutes remaining
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
    BACKGROUND_INTERVAL: 15 * 60 * 1000, // Check every 15 minutes
  },
  
  // Session validation intervals
  VALIDATION: {
    INTERVAL: 60 * 1000, // Validate every minute
    IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes idle
    WARNING_THRESHOLD: 5 * 60 * 1000, // Warn 5 minutes before expiry
  },
} as const;

/**
 * Token expiration configuration
 */
export const TOKEN_EXPIRATION = {
  ACCESS_TOKEN: 15 * 60, // 15 minutes (in seconds)
  REFRESH_TOKEN: 30 * 24 * 60 * 60, // 30 days (in seconds)
  CSRF_TOKEN: 60 * 60, // 1 hour (in seconds)
  PASSWORD_RESET: 60 * 60, // 1 hour (in seconds)
  EMAIL_VERIFICATION: 24 * 60 * 60, // 24 hours (in seconds)
  INVITATION: 7 * 24 * 60 * 60, // 7 days (in seconds)
} as const;

// =============================================================================
// AUTHENTICATION ENDPOINTS
// =============================================================================

/**
 * Authentication API endpoints
 */
export const AUTH_ENDPOINTS = {
  // Primary authentication endpoints
  LOGIN: '/api/v2/user/session',
  LOGOUT: '/api/v2/user/session',
  REFRESH: '/api/v2/user/refresh',
  VALIDATE: '/api/v2/user/session',
  
  // User management endpoints
  REGISTER: '/api/v2/user/register',
  PROFILE: '/api/v2/user/profile',
  PASSWORD_RESET: '/api/v2/user/password',
  FORGOT_PASSWORD: '/api/v2/user/password',
  VERIFY_EMAIL: '/api/v2/user/verify',
  
  // Administrative endpoints
  ADMIN_LOGIN: '/api/v2/system/admin/session',
  SYSTEM_CONFIG: '/api/v2/system/config',
  ENVIRONMENT: '/api/v2/system/environment',
  
  // OAuth and external authentication
  OAUTH_CALLBACK: '/api/auth/oauth/callback',
  SAML_CALLBACK: '/api/auth/saml/callback',
  LDAP_AUTH: '/api/v2/user/session',
  
  // Session management
  SESSION_LIST: '/api/v2/system/admin/session',
  SESSION_DELETE: '/api/v2/system/admin/session',
} as const;

/**
 * Authentication service types
 */
export const AUTH_SERVICE_TYPES = {
  LOCAL: 'local',
  LDAP: 'ldap',
  ACTIVE_DIRECTORY: 'ad',
  OAUTH_GOOGLE: 'oauth_google',
  OAUTH_FACEBOOK: 'oauth_facebook',
  OAUTH_GITHUB: 'oauth_github',
  OAUTH_MICROSOFT: 'oauth_microsoft',
  SAML: 'saml',
  OPENID_CONNECT: 'oidc',
  CUSTOM: 'custom',
} as const;

// =============================================================================
// SECURITY POLICY CONSTANTS
// =============================================================================

/**
 * Password security requirements
 */
export const PASSWORD_POLICY = {
  MIN_LENGTH: 16,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  HISTORY_COUNT: 12, // Remember last 12 passwords
  EXPIRY_DAYS: 90,
  WARNING_DAYS: 7,
} as const;

/**
 * Account security settings
 */
export const ACCOUNT_SECURITY = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes
  SUSPICIOUS_ACTIVITY_THRESHOLD: 10,
  PASSWORD_RESET_ATTEMPTS: 3,
  EMAIL_VERIFICATION_ATTEMPTS: 3,
  TWO_FACTOR_BACKUP_CODES: 8,
  SESSION_TIMEOUT_WARNING: 5 * 60 * 1000, // 5 minutes
} as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: {
    MAX_REQUESTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  },
  PASSWORD_RESET: {
    MAX_REQUESTS: 3,
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
  },
  API_REQUESTS: {
    MAX_REQUESTS: 1000,
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
  },
  REGISTRATION: {
    MAX_REQUESTS: 3,
    WINDOW_MS: 24 * 60 * 60 * 1000, // 24 hours
  },
} as const;

// =============================================================================
// VALIDATION CONSTANTS
// =============================================================================

/**
 * Form validation patterns and rules
 */
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,30}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+-=\[\]{}|;:,.<>?]).{16,}$/,
  PHONE: /^\+?[\d\s-()]{10,20}$/,
  DOMAIN: /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
  API_KEY: /^[a-zA-Z0-9]{32,}$/,
  JWT_TOKEN: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
} as const;

/**
 * Validation error messages
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_USERNAME: 'Username must be 3-30 characters, letters, numbers, hyphens, and underscores only',
  INVALID_PASSWORD: 'Password must be at least 16 characters with uppercase, lowercase, number, and special character',
  PASSWORD_MISMATCH: 'Passwords do not match',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_DOMAIN: 'Please enter a valid domain name',
  INVALID_API_KEY: 'API key must be at least 32 characters',
  INVALID_TOKEN: 'Invalid token format',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters`,
  ACCOUNT_LOCKED: 'Account temporarily locked due to too many failed attempts',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_CREDENTIALS: 'Invalid username/email or password',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before continuing',
  TWO_FACTOR_REQUIRED: 'Two-factor authentication is required',
} as const;

// =============================================================================
// AUTHENTICATION FLOW CONSTANTS
// =============================================================================

/**
 * Authentication flow states
 */
export const AUTH_STATES = {
  UNAUTHENTICATED: 'unauthenticated',
  AUTHENTICATING: 'authenticating',
  AUTHENTICATED: 'authenticated',
  TOKEN_REFRESHING: 'token_refreshing',
  SESSION_EXPIRED: 'session_expired',
  ACCOUNT_LOCKED: 'account_locked',
  EMAIL_VERIFICATION_REQUIRED: 'email_verification_required',
  TWO_FACTOR_REQUIRED: 'two_factor_required',
  PASSWORD_RESET_REQUIRED: 'password_reset_required',
} as const;

/**
 * Authentication events
 */
export const AUTH_EVENTS = {
  LOGIN_SUCCESS: 'auth:login:success',
  LOGIN_FAILURE: 'auth:login:failure',
  LOGOUT: 'auth:logout',
  TOKEN_REFRESHED: 'auth:token:refreshed',
  TOKEN_REFRESH_FAILED: 'auth:token:refresh:failed',
  SESSION_EXPIRED: 'auth:session:expired',
  ACCOUNT_LOCKED: 'auth:account:locked',
  PASSWORD_CHANGED: 'auth:password:changed',
  EMAIL_VERIFIED: 'auth:email:verified',
  TWO_FACTOR_ENABLED: 'auth:2fa:enabled',
  TWO_FACTOR_DISABLED: 'auth:2fa:disabled',
} as const;

// =============================================================================
// ROUTE PROTECTION CONSTANTS
// =============================================================================

/**
 * Protected route patterns
 */
export const PROTECTED_ROUTES = {
  // Public routes (no authentication required)
  PUBLIC: [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/oauth/callback',
    '/saml/callback',
    '/api/health',
    '/api/status',
  ],
  
  // Admin-only routes
  ADMIN_ONLY: [
    '/admin-settings',
    '/system-settings',
    '/adf-admins',
    '/adf-users',
    '/adf-roles',
    '/adf-config',
    '/adf-scheduler',
  ],
  
  // API routes requiring authentication
  API_PROTECTED: [
    '/api/v2/user',
    '/api/v2/system',
    '/api/v2/service',
    '/api/v2/schema',
  ],
} as const;

/**
 * Role-based access control permissions
 */
export const RBAC_PERMISSIONS = {
  SUPER_ADMIN: 'super_admin',
  SYSTEM_ADMIN: 'system_admin',
  DATABASE_ADMIN: 'database_admin',
  API_ADMIN: 'api_admin',
  USER_ADMIN: 'user_admin',
  READ_ONLY: 'read_only',
  
  // Granular permissions
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  
  SERVICES_CREATE: 'services:create',
  SERVICES_READ: 'services:read',
  SERVICES_UPDATE: 'services:update',
  SERVICES_DELETE: 'services:delete',
  
  SCHEMA_READ: 'schema:read',
  SCHEMA_MODIFY: 'schema:modify',
  
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_MONITOR: 'system:monitor',
} as const;

// =============================================================================
// ENVIRONMENT-SPECIFIC CONSTANTS
// =============================================================================

/**
 * Environment-specific authentication configuration
 */
export const ENV_CONFIG = {
  DEVELOPMENT: {
    TOKEN_EXPIRY: 24 * 60 * 60, // 24 hours for development
    REFRESH_THRESHOLD: 60 * 60, // 1 hour
    ENABLE_DEBUG: true,
    MOCK_AUTH: process.env.NEXT_PUBLIC_MOCK_AUTH === 'true',
  },
  
  PRODUCTION: {
    TOKEN_EXPIRY: 15 * 60, // 15 minutes for production
    REFRESH_THRESHOLD: 5 * 60, // 5 minutes
    ENABLE_DEBUG: false,
    MOCK_AUTH: false,
  },
  
  TEST: {
    TOKEN_EXPIRY: 60, // 1 minute for testing
    REFRESH_THRESHOLD: 30, // 30 seconds
    ENABLE_DEBUG: true,
    MOCK_AUTH: true,
  },
} as const;

/**
 * Get environment-specific configuration
 */
export function getAuthConfig() {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return ENV_CONFIG.PRODUCTION;
    case 'test':
      return ENV_CONFIG.TEST;
    default:
      return ENV_CONFIG.DEVELOPMENT;
  }
}

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================

/**
 * Next.js middleware configuration for authentication
 */
export const MIDDLEWARE_CONFIG = {
  // Routes that should be processed by auth middleware
  MATCHER: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/health (health check endpoints)
     * - api/status (status endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/health|api/status|_next/static|_next/image|favicon.ico|public).*)',
  ],
  
  // Headers to extract for authentication
  HEADERS: {
    AUTHORIZATION: 'authorization',
    SESSION_TOKEN: 'x-dreamfactory-session-token',
    API_KEY: 'x-dreamfactory-api-key',
    USER_AGENT: 'user-agent',
    X_FORWARDED_FOR: 'x-forwarded-for',
    X_REAL_IP: 'x-real-ip',
  },
  
  // Response headers to set
  RESPONSE_HEADERS: {
    CACHE_CONTROL: 'no-cache, no-store, must-revalidate',
    EXPIRES: '0',
    PRAGMA: 'no-cache',
  },
} as const;

// =============================================================================
// AUDIT AND LOGGING CONSTANTS
// =============================================================================

/**
 * Authentication audit log events
 */
export const AUDIT_EVENTS = {
  USER_LOGIN_SUCCESS: 'user.login.success',
  USER_LOGIN_FAILURE: 'user.login.failure',
  USER_LOGOUT: 'user.logout',
  USER_SESSION_EXPIRED: 'user.session.expired',
  USER_PASSWORD_CHANGED: 'user.password.changed',
  USER_EMAIL_VERIFIED: 'user.email.verified',
  ADMIN_LOGIN_SUCCESS: 'admin.login.success',
  ADMIN_LOGIN_FAILURE: 'admin.login.failure',
  TOKEN_REFRESH_SUCCESS: 'token.refresh.success',
  TOKEN_REFRESH_FAILURE: 'token.refresh.failure',
  ACCOUNT_LOCKED: 'account.locked',
  SUSPICIOUS_ACTIVITY: 'security.suspicious.activity',
  PERMISSION_DENIED: 'security.permission.denied',
} as const;

/**
 * Log levels for authentication events
 */
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  SECURITY: 'security',
} as const;

// Type exports for better TypeScript integration
export type AuthHeader = keyof typeof AUTH_HEADERS;
export type TokenKey = keyof typeof TOKEN_KEYS;
export type AuthEndpoint = keyof typeof AUTH_ENDPOINTS;
export type AuthServiceType = typeof AUTH_SERVICE_TYPES[keyof typeof AUTH_SERVICE_TYPES];
export type AuthState = typeof AUTH_STATES[keyof typeof AUTH_STATES];
export type AuthEvent = typeof AUTH_EVENTS[keyof typeof AUTH_EVENTS];
export type RBACPermission = typeof RBAC_PERMISSIONS[keyof typeof RBAC_PERMISSIONS];
export type AuditEvent = typeof AUDIT_EVENTS[keyof typeof AUDIT_EVENTS];
export type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];