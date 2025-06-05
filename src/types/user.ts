/**
 * User Management Types for DreamFactory React/Next.js Admin Interface
 * 
 * Comprehensive type definitions for user authentication, authorization, and management
 * supporting JWT-based authentication with Next.js middleware integration and RBAC.
 * 
 * Key Features:
 * - JWT-based session management with Next.js middleware patterns
 * - Role-based access control (RBAC) enforcement
 * - React Hook Form integration with Zod validation schemas
 * - Server-side rendering compatibility
 * - Enhanced security with cookie hydration support
 */

import { z } from 'zod';

// ============================================================================
// CORE USER TYPES
// ============================================================================

/**
 * User profile type union for distinguishing between regular users and administrators
 */
export type UserProfileType = 'users' | 'admins';

/**
 * Core user role type for RBAC integration
 */
export interface RoleType {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_date?: string;
  last_modified_date?: string;
  created_by_id?: number;
  last_modified_by_id?: number;
  lookup_by_role_id?: number[];
  accessibleTabs?: string[];
}

/**
 * Lookup key for additional user metadata and configuration
 */
export interface LookupKey {
  id?: number;
  name: string;
  value: string;
  private?: boolean;
  description?: string;
  created_date?: string;
  last_modified_date?: string;
  created_by_id?: number;
  last_modified_by_id?: number;
}

/**
 * Comprehensive user profile interface supporting both regular users and admins
 * Enhanced for React/Next.js with server-side rendering compatibility
 */
export interface UserProfile {
  // Core identification
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  
  // Authentication & Security
  is_active: boolean;
  confirmed?: boolean;
  security_question?: string;
  security_answer?: string;
  password_set_date?: string;
  last_login_date?: string;
  failed_login_attempts?: number;
  locked_until?: string;
  
  // Profile details
  phone?: string;
  name?: string;
  
  // Audit trail
  created_date?: string;
  last_modified_date?: string;
  created_by_id?: number;
  last_modified_by_id?: number;
  
  // Relationships and metadata
  lookup_by_user_id?: LookupKey[];
  user_to_app_to_role_by_user_id?: UserAppRole[];
  
  // RBAC integration - enhanced for Next.js middleware
  role?: RoleType;
  permissions?: string[];
  accessibleRoutes?: string[];
  
  // Enhanced security for Next.js SSR
  sessionId?: string;
  tokenVersion?: number;
  lastActivity?: string;
}

/**
 * Admin profile extending user profile with administrative capabilities
 * Enhanced for Next.js middleware-based access control
 */
export interface AdminProfile extends UserProfile {
  // Admin-specific flags
  is_sys_admin?: boolean;
  
  // Enhanced access control for Next.js routes
  accessibleTabs?: string[];
  restrictedRoutes?: string[];
  adminCapabilities?: AdminCapability[];
  
  // System-level permissions
  systemPermissions?: SystemPermission[];
}

/**
 * Admin capability enum for granular permission control
 */
export type AdminCapability = 
  | 'user_management'
  | 'service_management' 
  | 'schema_management'
  | 'api_generation'
  | 'system_configuration'
  | 'security_management'
  | 'audit_access'
  | 'backup_restore';

/**
 * System-level permissions for administrative operations
 */
export type SystemPermission =
  | 'read_users'
  | 'create_users'
  | 'update_users'
  | 'delete_users'
  | 'read_services'
  | 'create_services'
  | 'update_services'
  | 'delete_services'
  | 'read_schema'
  | 'update_schema'
  | 'generate_apis'
  | 'manage_security'
  | 'view_logs'
  | 'system_backup';

/**
 * User-to-application role mapping for multi-app access control
 */
export interface UserAppRole {
  id?: number;
  user_id: number;
  app_id: number;
  role_id: number;
  created_date?: string;
  last_modified_date?: string;
  created_by_id?: number;
  last_modified_by_id?: number;
}

/**
 * Lightweight user representation for table/list views
 * Optimized for React components with SSR support
 */
export interface UserRow {
  id: number;
  username: string;
  email: string;
  display_name?: string;
  name?: string;
  is_active: boolean;
  last_login_date?: string;
  created_date?: string;
  role?: string;
  
  // UI state for React components
  isLoading?: boolean;
  isSelected?: boolean;
}

// ============================================================================
// SESSION MANAGEMENT TYPES
// ============================================================================

/**
 * Enhanced user session for Next.js middleware integration
 * Supports both client-side and server-side rendering
 */
export interface UserSession {
  // Core session data
  id: number;
  session_token: string;
  sessionToken?: string; // Alternate naming for compatibility
  user_id: number;
  username: string;
  email: string;
  display_name?: string;
  
  // Enhanced for Next.js middleware
  host?: string;
  is_sys_admin?: boolean;
  is_active: boolean;
  token_map?: { [key: string]: string };
  
  // Session metadata
  created_date?: string;
  expires_at?: string;
  last_activity?: string;
  user_agent?: string;
  ip_address?: string;
  
  // RBAC data for middleware
  role?: RoleType;
  permissions?: string[];
  accessibleRoutes?: string[];
  restrictedRoutes?: string[];
  
  // Security enhancements
  tokenVersion?: number;
  refreshToken?: string;
  csrfToken?: string;
  
  // Next.js specific
  isServerSide?: boolean;
  cookieData?: SessionCookieData;
}

/**
 * Session cookie data for Next.js middleware hydration
 */
export interface SessionCookieData {
  sessionId: string;
  userId: number;
  tokenVersion: number;
  expiresAt: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
}

/**
 * Session validation result for middleware processing
 */
export interface SessionValidationResult {
  isValid: boolean;
  session?: UserSession;
  error?: SessionError;
  requiresRefresh?: boolean;
  redirectTo?: string;
}

/**
 * Session error types for enhanced error handling
 */
export type SessionError = 
  | 'token_expired'
  | 'token_invalid'
  | 'user_inactive'
  | 'permission_denied'
  | 'session_expired'
  | 'refresh_required'
  | 'authentication_required';

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

/**
 * Login credentials interface with enhanced validation
 */
export interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
  remember?: boolean;
  service?: string;
  
  // Enhanced security
  captcha?: string;
  twoFactorCode?: string;
  deviceId?: string;
}

/**
 * Login response with enhanced JWT support
 */
export interface LoginResponse {
  session_token?: string;
  sessionToken?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: UserProfile;
  permissions?: string[];
  
  // Enhanced session data
  sessionId?: string;
  tokenVersion?: number;
  csrfToken?: string;
  
  // Error handling
  error?: string;
  error_description?: string;
  
  // Additional fields support
  [key: string]: any;
}

/**
 * User registration details with comprehensive validation
 */
export interface RegisterDetails {
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  phone?: string;
  
  // Security questions
  security_question?: string;
  security_answer?: string;
  
  // Terms and privacy
  acceptTerms?: boolean;
  acceptPrivacy?: boolean;
  
  // Additional metadata
  source?: string;
  referral?: string;
}

/**
 * Password reset request interface
 */
export interface ForgetPasswordRequest {
  email?: string;
  username?: string;
  captcha?: string;
}

/**
 * Password reset form data
 */
export interface ResetFormData {
  code: string;
  password: string;
  confirmPassword: string;
  email?: string;
  username?: string;
  
  // Security enhancement
  deviceId?: string;
  timestamp?: string;
}

/**
 * Security question interface
 */
export interface SecurityQuestion {
  id?: number;
  question: string;
  answer?: string;
  is_default?: boolean;
}

/**
 * Password update request
 */
export interface UpdatePasswordRequest {
  old_password: string;
  new_password: string;
  confirm_password?: string;
  
  // Enhanced security
  force_logout_all?: boolean;
  sessionId?: string;
}

/**
 * Password update response
 */
export interface UpdatePasswordResponse {
  success: boolean;
  message?: string;
  session_token?: string;
  sessionToken?: string;
  
  // Force re-authentication
  requiresReauth?: boolean;
  loggedOutSessions?: number;
}

/**
 * User parameters for routing and API calls
 */
export interface UserParams {
  admin?: boolean;
  code?: string;
  email?: string;
  username?: string;
  id?: string | number;
  
  // Enhanced routing support
  tab?: string;
  action?: string;
  returnUrl?: string;
}

// ============================================================================
// REACT HOOK FORM & ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod validation schema for login form
 */
export const LoginSchema = z.object({
  username: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
  service: z.string().optional(),
  captcha: z.string().optional(),
  twoFactorCode: z.string().optional(),
}).refine(data => data.username || data.email, {
  message: 'Either username or email is required',
  path: ['username'],
});

export type LoginFormData = z.infer<typeof LoginSchema>;

/**
 * Zod validation schema for user registration
 */
export const RegisterSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must not exceed 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  first_name: z.string().max(100, 'First name must not exceed 100 characters').optional(),
  last_name: z.string().max(100, 'Last name must not exceed 100 characters').optional(),
  display_name: z.string().max(100, 'Display name must not exceed 100 characters').optional(),
  phone: z.string().optional(),
  security_question: z.string().optional(),
  security_answer: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms of service'),
  acceptPrivacy: z.boolean().refine(val => val === true, 'You must accept the privacy policy'),
  source: z.string().optional(),
  referral: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof RegisterSchema>;

/**
 * Zod validation schema for password reset request
 */
export const ForgetPasswordSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  username: z.string().optional(),
  captcha: z.string().optional(),
}).refine(data => data.email || data.username, {
  message: 'Either email or username is required',
  path: ['email'],
});

export type ForgetPasswordFormData = z.infer<typeof ForgetPasswordSchema>;

/**
 * Zod validation schema for password reset
 */
export const ResetPasswordSchema = z.object({
  code: z.string().min(1, 'Reset code is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  email: z.string().email().optional(),
  username: z.string().optional(),
  deviceId: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;

/**
 * Zod validation schema for password update
 */
export const UpdatePasswordSchema = z.object({
  old_password: z.string().min(1, 'Current password is required'),
  new_password: z.string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirm_password: z.string(),
  force_logout_all: z.boolean().optional(),
}).refine(data => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export type UpdatePasswordFormData = z.infer<typeof UpdatePasswordSchema>;

/**
 * Zod validation schema for user profile editing
 */
export const UserProfileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must not exceed 255 characters'),
  first_name: z.string().max(100, 'First name must not exceed 100 characters').optional(),
  last_name: z.string().max(100, 'Last name must not exceed 100 characters').optional(),
  display_name: z.string().max(100, 'Display name must not exceed 100 characters').optional(),
  phone: z.string().optional(),
  security_question: z.string().optional(),
  security_answer: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type UserProfileFormData = z.infer<typeof UserProfileSchema>;

// ============================================================================
// RBAC & PERMISSION TYPES
// ============================================================================

/**
 * Permission context for route and component access control
 */
export interface PermissionContext {
  user: UserProfile | null;
  permissions: string[];
  roles: RoleType[];
  route: string;
  resource?: string;
  action?: string;
}

/**
 * RBAC rule for Next.js middleware evaluation
 */
export interface RBACRule {
  resource: string;
  action: string;
  conditions?: RBACCondition[];
  roles?: string[];
  permissions?: string[];
  deny?: boolean;
}

/**
 * RBAC condition for advanced permission logic
 */
export interface RBACCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'in' | 'not_in';
  value: any;
  contextField?: string;
}

/**
 * Permission check result for UI components
 */
export interface PermissionCheckResult {
  granted: boolean;
  reason?: string;
  alternatives?: string[];
  requiredPermissions?: string[];
}

/**
 * Route protection configuration for Next.js middleware
 */
export interface RouteProtection {
  path: string;
  requiresAuth: boolean;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  adminOnly?: boolean;
  redirectTo?: string;
  allowGuests?: boolean;
}

// ============================================================================
// NEXT.JS MIDDLEWARE TYPES
// ============================================================================

/**
 * Middleware authentication context
 */
export interface MiddlewareAuthContext {
  user: UserProfile | null;
  session: UserSession | null;
  isAuthenticated: boolean;
  permissions: string[];
  roles: string[];
  route: string;
  requestHeaders: Record<string, string>;
}

/**
 * Middleware response for authentication handling
 */
export interface MiddlewareResponse {
  continue: boolean;
  redirect?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  status?: number;
  error?: string;
}

/**
 * JWT token payload structure for Next.js middleware
 */
export interface JWTTokenPayload {
  sub: string | number; // User ID
  username: string;
  email: string;
  role?: string;
  permissions?: string[];
  iat: number; // Issued at
  exp: number; // Expires at
  jti?: string; // JWT ID
  aud?: string; // Audience
  iss?: string; // Issuer
  tokenVersion?: number;
  sessionId?: string;
}

/**
 * Token refresh result for automatic token renewal
 */
export interface TokenRefreshResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
  requiresReauth?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
  timestamp?: string;
}

/**
 * Paginated user list response
 */
export interface UserListResponse extends ApiResponse<UserRow[]> {
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * User creation/update response
 */
export interface UserMutationResponse extends ApiResponse<UserProfile> {
  created?: boolean;
  updated?: boolean;
  validationErrors?: Record<string, string[]>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * User search filters for list views
 */
export interface UserSearchFilters {
  query?: string;
  isActive?: boolean;
  role?: string;
  createdAfter?: string;
  createdBefore?: string;
  lastLoginAfter?: string;
  lastLoginBefore?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * User form state for React components
 */
export interface UserFormState {
  isLoading: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  errors: Record<string, string>;
  touchedFields: Record<string, boolean>;
  submitCount: number;
}

/**
 * User action types for state management
 */
export type UserAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'activate'
  | 'deactivate'
  | 'reset_password'
  | 'unlock'
  | 'view_profile'
  | 'edit_profile';

// ============================================================================
// EXPORTS
// ============================================================================

// Re-export commonly used types for convenience
export type {
  UserProfile,
  AdminProfile,
  UserSession,
  LoginCredentials,
  LoginResponse,
  RegisterDetails,
  UserRow,
  RoleType,
  LookupKey,
};

// Export validation schemas
export {
  LoginSchema,
  RegisterSchema,
  ForgetPasswordSchema,
  ResetPasswordSchema,
  UpdatePasswordSchema,
  UserProfileSchema,
};