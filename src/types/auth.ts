/**
 * Authentication and authorization types for DreamFactory Admin Interface
 * 
 * Supports Next.js middleware-based authentication, JWT validation,
 * session management with HttpOnly cookies, and role-based access control.
 * 
 * Key features:
 * - Next.js middleware authentication patterns
 * - Server-side session token validation
 * - React 19 concurrent features support
 * - Enhanced security with HttpOnly cookie management
 * - RBAC integration with React context and Zustand
 */

import { z } from 'zod';

// =============================================================================
// CORE AUTHENTICATION INTERFACES
// =============================================================================

/**
 * User login credentials interface with multiple authentication methods
 * Supports email/username login with optional service selection
 */
export interface LoginCredentials {
  /** User's email address - primary login method */
  email?: string;
  /** Username alternative to email */
  username?: string;
  /** User password - required for all authentication methods */
  password: string;
  /** Remember user session preference for extended session duration */
  rememberMe?: boolean;
  /** Optional service context for service-specific authentication */
  service?: string;
}

/**
 * Enhanced login response supporting both legacy and modern token formats
 * Compatible with DreamFactory API v2 responses and Next.js server components
 */
export interface LoginResponse {
  /** Primary session token for API authentication */
  sessionToken?: string;
  /** Legacy session token format for backward compatibility */
  session_token?: string;
  /** User session information including profile and permissions */
  user?: UserSession;
  /** Token expiration timestamp for middleware validation */
  expiresAt?: string | Date;
  /** Refresh token for automatic session renewal */
  refreshToken?: string;
  /** Additional response properties for extensibility */
  [key: string]: any;
}

/**
 * Comprehensive user session interface supporting both user and admin roles
 * Includes all necessary data for Next.js middleware and React components
 */
export interface UserSession {
  /** Unique user identifier */
  id: number;
  /** User's email address */
  email: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** User's full display name */
  name: string;
  /** DreamFactory host information */
  host: string;
  /** Unique session identifier */
  sessionId: string;
  /** JWT session token for API authentication */
  sessionToken: string;
  /** Token expiration date for middleware validation */
  tokenExpiryDate: Date;
  /** Last successful login timestamp */
  lastLoginDate: string;
  /** Root admin privileges flag */
  isRootAdmin: boolean;
  /** System admin privileges flag */
  isSysAdmin: boolean;
  /** Primary role identifier */
  roleId: number;
  /** Legacy role identifier for backward compatibility */
  role_id?: number;
  /** Detailed role information including permissions */
  role?: RoleType;
  /** User profile metadata */
  profile?: UserProfile;
}

/**
 * User registration details for new account creation
 * Supports both user and admin registration workflows
 */
export interface RegisterDetails {
  /** Unique username */
  username: string;
  /** User's email address */
  email: string;
  /** User's full display name */
  name: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** Optional initial password (if not using email verification) */
  password?: string;
}

// =============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC) TYPES
// =============================================================================

/**
 * Comprehensive role definition supporting hierarchical permissions
 * Compatible with DreamFactory's role-based access control system
 */
export interface RoleType {
  /** Unique role identifier */
  id: number;
  /** Human-readable role name */
  name: string;
  /** Detailed role description */
  description: string;
  /** Role active status */
  isActive: boolean;
  /** Role creation metadata */
  createdById: number;
  createdDate: string;
  lastModifiedById: number;
  lastModifiedDate: string;
  /** Associated lookup keys for role configuration */
  lookupByRoleId: number[];
  /** Admin interface tab access permissions */
  accessibleTabs?: Array<string>;
  /** Granular permission specifications */
  permissions?: RolePermission[];
}

/**
 * Granular permission definition for resource access control
 * Supports operation-level permissions on specific resources
 */
export interface RolePermission {
  /** Resource identifier (e.g., 'service', 'schema', 'user') */
  resource: string;
  /** Allowed operations on the resource */
  operations: Array<'create' | 'read' | 'update' | 'delete' | 'execute'>;
  /** Optional resource-specific constraints */
  constraints?: Record<string, any>;
}

/**
 * Simplified role interface for UI display and selection
 * Used in forms and management interfaces
 */
export interface RoleRow {
  /** Unique role identifier */
  id: number;
  /** Role display name */
  name: string;
  /** Role description */
  description: string;
  /** Role active status */
  active: boolean;
}

// =============================================================================
// NEXT.JS MIDDLEWARE AUTHENTICATION TYPES
// =============================================================================

/**
 * Next.js middleware request context for authentication processing
 * Includes all necessary data for server-side authentication validation
 */
export interface MiddlewareAuthContext {
  /** HTTP request headers including authorization */
  headers: Record<string, string>;
  /** Extracted session token from cookies or headers */
  sessionToken?: string;
  /** Refresh token for automatic renewal */
  refreshToken?: string;
  /** Request pathname for route-based authorization */
  pathname: string;
  /** User agent information for security logging */
  userAgent?: string;
  /** Client IP address for audit logging */
  clientIP?: string;
}

/**
 * Middleware authentication result for request processing decisions
 * Determines whether to proceed, redirect, or block the request
 */
export interface MiddlewareAuthResult {
  /** Authentication validation result */
  isAuthenticated: boolean;
  /** Authorization validation result */
  isAuthorized: boolean;
  /** User session data if authenticated */
  user?: UserSession;
  /** Redirect URL if authentication/authorization fails */
  redirectTo?: string;
  /** Updated session token if refresh occurred */
  updatedToken?: string;
  /** Error information for failed authentication */
  error?: AuthError;
  /** Additional response headers to set */
  headers?: Record<string, string>;
}

/**
 * JWT token payload structure for server-side validation
 * Includes all claims necessary for authentication and authorization
 */
export interface JWTPayload {
  /** Subject - user identifier */
  sub: string;
  /** Issued at timestamp */
  iat: number;
  /** Expiration timestamp */
  exp: number;
  /** Issuer - DreamFactory instance */
  iss?: string;
  /** User session data */
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    roleId: number;
    isRootAdmin: boolean;
    isSysAdmin: boolean;
  };
  /** User permissions for middleware authorization */
  permissions?: string[];
  /** Session metadata */
  sessionId: string;
}

// =============================================================================
// AUTHENTICATION FLOW TYPES
// =============================================================================

/**
 * Authentication state for React context and Zustand integration
 * Manages application-wide authentication state
 */
export interface AuthState {
  /** Current authentication status */
  isAuthenticated: boolean;
  /** Loading state for authentication operations */
  isLoading: boolean;
  /** Current user session data */
  user: UserSession | null;
  /** Last authentication error */
  error: AuthError | null;
  /** Token refresh in progress flag */
  isRefreshing: boolean;
}

/**
 * Authentication actions for state management
 * Defines all possible authentication state mutations
 */
export interface AuthActions {
  /** Login action with credentials */
  login: (credentials: LoginCredentials) => Promise<void>;
  /** Login with existing JWT token */
  loginWithToken: (token: string) => Promise<void>;
  /** Logout action with cleanup */
  logout: () => Promise<void>;
  /** Refresh session token */
  refreshToken: () => Promise<void>;
  /** Update user profile data */
  updateUser: (user: Partial<UserSession>) => void;
  /** Clear authentication errors */
  clearError: () => void;
  /** Check session validity */
  checkSession: () => Promise<boolean>;
}

/**
 * Combined authentication store interface for Zustand
 * Includes both state and actions for complete authentication management
 */
export interface AuthStore extends AuthState, AuthActions {}

// =============================================================================
// ERROR HANDLING TYPES
// =============================================================================

/**
 * Comprehensive authentication error interface
 * Supports detailed error reporting and user feedback
 */
export interface AuthError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** HTTP status code if applicable */
  statusCode?: number;
  /** Additional error context */
  context?: string | Record<string, any>;
  /** Timestamp of error occurrence */
  timestamp?: string;
  /** Request ID for error tracking */
  requestId?: string;
}

/**
 * Authentication error codes enumeration
 * Standardizes error handling across the application
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  REFRESH_FAILED = 'REFRESH_FAILED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

// =============================================================================
// FORM VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod validation schema for login credentials
 * Provides runtime type checking and validation for React Hook Form
 */
export const LoginCredentialsSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  username: z.string().min(1, 'Username is required').optional(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
  service: z.string().optional(),
}).refine(
  (data) => data.email || data.username,
  {
    message: 'Either email or username is required',
    path: ['email'],
  }
);

/**
 * Zod validation schema for user registration
 * Ensures data integrity for new user account creation
 */
export const RegisterDetailsSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Full name is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

// =============================================================================
// PASSWORD MANAGEMENT TYPES
// =============================================================================

/**
 * Password reset request interface
 * Supports both email and username-based password recovery
 */
export interface ForgetPasswordRequest {
  /** User's email address */
  email?: string;
  /** Alternative username for password recovery */
  username?: string;
}

/**
 * Password reset form data with security verification
 * Includes security question validation for enhanced security
 */
export interface ResetFormData {
  /** User's email address */
  email: string;
  /** Username for verification */
  username: string;
  /** Password reset verification code */
  code: string;
  /** New password */
  newPassword: string;
  /** Security question for additional verification */
  securityQuestion?: string;
  /** Security question answer */
  securityAnswer?: string;
}

/**
 * Password update request for authenticated users
 * Requires current password verification
 */
export interface UpdatePasswordRequest {
  /** Current password for verification */
  oldPassword: string;
  /** New password */
  newPassword: string;
}

/**
 * Password update response with new session token
 * Includes updated authentication token after password change
 */
export interface UpdatePasswordResponse {
  /** Operation success flag */
  success: boolean;
  /** New session token after password update */
  sessionToken: string;
  /** Additional response metadata */
  message?: string;
}

/**
 * Security question interface for password recovery
 * Supports additional security verification
 */
export interface SecurityQuestion {
  /** Security question text */
  securityQuestion: string;
  /** Security question answer (write-only) */
  securityAnswer?: string;
}

// =============================================================================
// OAUTH AND EXTERNAL AUTHENTICATION TYPES
// =============================================================================

/**
 * OAuth authentication request parameters
 * Supports external authentication providers
 */
export interface OAuthLoginRequest {
  /** OAuth provider token */
  oauthToken: string;
  /** Authorization code from provider */
  code: string;
  /** State parameter for CSRF protection */
  state: string;
  /** OAuth provider identifier */
  provider?: string;
}

/**
 * SAML authentication parameters
 * Supports SAML-based single sign-on
 */
export interface SAMLAuthParams {
  /** SAML response token */
  samlResponse: string;
  /** Relay state parameter */
  relayState?: string;
  /** SAML provider configuration */
  provider?: string;
}

// =============================================================================
// SESSION STORAGE AND COOKIE TYPES
// =============================================================================

/**
 * Cookie configuration for secure session storage
 * Supports HttpOnly cookies with Next.js middleware
 */
export interface AuthCookieConfig {
  /** Cookie name for session storage */
  name: string;
  /** Cookie expiration time in seconds */
  maxAge: number;
  /** Cookie security flag */
  secure: boolean;
  /** HttpOnly flag for XSS protection */
  httpOnly: boolean;
  /** SameSite policy for CSRF protection */
  sameSite: 'strict' | 'lax' | 'none';
  /** Cookie domain */
  domain?: string;
  /** Cookie path */
  path: string;
}

/**
 * Session storage interface for client-side state management
 * Manages temporary session data in browser storage
 */
export interface SessionStorage {
  /** Store session data */
  setSession: (session: UserSession) => void;
  /** Retrieve session data */
  getSession: () => UserSession | null;
  /** Clear session data */
  clearSession: () => void;
  /** Store authentication token */
  setToken: (token: string) => void;
  /** Retrieve authentication token */
  getToken: () => string | null;
  /** Clear authentication token */
  clearToken: () => void;
}

// =============================================================================
// TYPE EXPORTS AND UTILITIES
// =============================================================================

/**
 * Type utility for extracting user permissions from session
 * Simplifies permission checking in components
 */
export type UserPermissions = RolePermission[];

/**
 * Type utility for authentication status
 * Provides clear authentication state typing
 */
export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading' | 'error';

/**
 * Protected route component props interface
 * Supports route-level authentication requirements
 */
export interface ProtectedRouteProps {
  /** Required permissions for route access */
  requiredPermissions?: string[];
  /** Required roles for route access */
  requiredRoles?: string[];
  /** Fallback component for unauthorized access */
  fallback?: React.ComponentType;
  /** Redirect URL for unauthenticated users */
  redirectTo?: string;
  /** Child components to protect */
  children: React.ReactNode;
}

/**
 * Authentication hook configuration
 * Configures authentication behavior in React components
 */
export interface UseAuthConfig {
  /** Automatically redirect if not authenticated */
  redirectIfUnauthenticated?: boolean;
  /** Redirect URL for unauthenticated users */
  redirectTo?: string;
  /** Required permissions for component access */
  requiredPermissions?: string[];
  /** Enable automatic token refresh */
  enableAutoRefresh?: boolean;
}

// Export all types for convenient importing
export type {
  // Core authentication
  LoginCredentials,
  LoginResponse,
  UserSession,
  RegisterDetails,
  
  // RBAC
  RoleType,
  RolePermission,
  RoleRow,
  
  // Middleware
  MiddlewareAuthContext,
  MiddlewareAuthResult,
  JWTPayload,
  
  // State management
  AuthState,
  AuthActions,
  AuthStore,
  
  // Error handling
  AuthError,
  
  // Password management
  ForgetPasswordRequest,
  ResetFormData,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
  SecurityQuestion,
  
  // External authentication
  OAuthLoginRequest,
  SAMLAuthParams,
  
  // Storage and cookies
  AuthCookieConfig,
  SessionStorage,
  
  // Utilities
  UserPermissions,
  AuthStatus,
  ProtectedRouteProps,
  UseAuthConfig,
};

// Export validation schemas
export {
  LoginCredentialsSchema,
  RegisterDetailsSchema,
  AuthErrorCode,
};