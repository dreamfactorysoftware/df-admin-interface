/**
 * User Management Types for DreamFactory Admin Interface
 * 
 * Comprehensive user management types including authentication payloads, user profiles,
 * admin configurations, role assignments, and session management. Supports JWT-based
 * authentication with Next.js middleware integration and role-based access control.
 * 
 * Migrated from Angular guards to Next.js middleware patterns with React Hook Form
 * schemas and Zod validation for enhanced security and type safety.
 */

import { z } from 'zod';

// ============================================================================
// Core User Types
// ============================================================================

/**
 * Base user interface with core properties
 */
export interface BaseUser {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  email: string;
  username?: string;
  phone?: string;
  security_question?: string;
  security_answer?: string;
  confirm_code?: string;
  default_app_id?: number;
  oauth_provider?: string;
  created_date?: string;
  last_modified_date?: string;
  email_verified_at?: string;
  is_active: boolean;
  is_sys_admin?: boolean;
  last_login_date?: string;
  host?: string;
}

/**
 * Complete user profile with all available fields
 */
export interface UserProfile extends BaseUser {
  avatar_url?: string;
  timezone?: string;
  locale?: string;
  theme_preference?: 'light' | 'dark' | 'system';
  notification_preferences?: NotificationPreferences;
  api_key?: string;
  adldap?: string;
  openid_connect?: string;
  saml?: string;
  created_by_id?: number;
  last_modified_by_id?: number;
  user_lookup_by_user_id?: UserLookup[];
  user_to_app_to_role_by_user_id?: UserAppRole[];
}

/**
 * Admin user with additional administrative fields
 */
export interface AdminUser extends UserProfile {
  is_sys_admin: true;
  role_id?: number;
  admin_permissions?: AdminPermission[];
  managed_services?: string[];
  system_access_level?: 'full' | 'limited' | 'readonly';
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  email_notifications: boolean;
  system_alerts: boolean;
  api_quota_warnings: boolean;
  security_notifications: boolean;
  maintenance_notifications: boolean;
  newsletter_subscription?: boolean;
}

/**
 * User lookup key-value pairs
 */
export interface UserLookup {
  id?: number;
  user_id: number;
  name: string;
  value?: string;
  private?: boolean;
  description?: string;
}

// ============================================================================
// Authentication Types
// ============================================================================

/**
 * JWT token payload structure
 */
export interface JWTPayload {
  sub: string; // Subject (user ID)
  email: string;
  name: string;
  iss: string; // Issuer
  aud: string; // Audience
  exp: number; // Expiration time
  iat: number; // Issued at time
  jti?: string; // JWT ID
  session_id?: string;
  is_sys_admin?: boolean;
  role_id?: number;
  app_id?: number;
  scopes?: string[];
}

/**
 * Authentication session data
 */
export interface AuthSession {
  id: string;
  session_token: string;
  refresh_token?: string;
  expires_at: number;
  created_at: number;
  last_activity: number;
  user_id: number;
  user_agent?: string;
  ip_address?: string;
  is_active: boolean;
}

/**
 * Login credentials payload
 */
export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
  duration?: number;
}

/**
 * OAuth login payload
 */
export interface OAuthCredentials {
  provider: string;
  code: string;
  state?: string;
  redirect_uri?: string;
}

/**
 * API Key authentication payload
 */
export interface ApiKeyAuth {
  api_key: string;
  session_token?: string;
}

/**
 * Authentication response from DreamFactory API
 */
export interface AuthResponse {
  success: boolean;
  session_token: string;
  session_id: string;
  user_id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  email: string;
  is_sys_admin: boolean;
  last_login_date?: string;
  host?: string;
  role?: UserRole;
  app?: UserApp;
  expires?: number;
  refresh_token?: string;
}

/**
 * Password reset request payload
 */
export interface PasswordResetRequest {
  email: string;
  reset_url?: string;
}

/**
 * Password reset confirmation payload
 */
export interface PasswordResetConfirmation {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
}

/**
 * Change password payload
 */
export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  new_password_confirmation: string;
}

// ============================================================================
// Role-Based Access Control (RBAC) Types
// ============================================================================

/**
 * User role definition
 */
export interface UserRole {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  role_service_access_by_role_id?: RoleServiceAccess[];
  role_lookup_by_role_id?: RoleLookup[];
  created_date?: string;
  last_modified_date?: string;
  created_by_id?: number;
  last_modified_by_id?: number;
}

/**
 * Role service access permissions
 */
export interface RoleServiceAccess {
  id?: number;
  role_id: number;
  service_id?: number;
  service?: string;
  component?: string;
  verb_mask?: number;
  requestor_type?: RequestorType;
  filters?: AccessFilter[];
  filter_op?: 'AND' | 'OR';
  created_date?: string;
  last_modified_date?: string;
  created_by_id?: number;
  last_modified_by_id?: number;
}

/**
 * Access filter for role-based permissions
 */
export interface AccessFilter {
  name: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Filter operators for access control
 */
export type FilterOperator = 
  | 'EQ' | 'NE' | 'GT' | 'GTE' | 'LT' | 'LTE'
  | 'IN' | 'NOT IN' | 'LIKE' | 'NOT LIKE'
  | 'IS NULL' | 'IS NOT NULL'
  | 'CONTAINS' | 'STARTS WITH' | 'ENDS WITH';

/**
 * Requestor types for role access
 */
export type RequestorType = 'API' | 'SCRIPT' | 'EVENT';

/**
 * Role lookup key-value pairs
 */
export interface RoleLookup {
  id?: number;
  role_id: number;
  name: string;
  value?: string;
  private?: boolean;
  description?: string;
}

/**
 * User application role assignment
 */
export interface UserAppRole {
  id?: number;
  user_id: number;
  app_id: number;
  role_id: number;
  app?: UserApp;
  role?: UserRole;
  created_date?: string;
  last_modified_date?: string;
  created_by_id?: number;
  last_modified_by_id?: number;
}

/**
 * Application definition
 */
export interface UserApp {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  type?: AppType;
  path?: string;
  url?: string;
  storage_service_id?: number;
  storage_container?: string;
  requires_fullscreen?: boolean;
  allow_fullscreen_toggle?: boolean;
  toggle_location?: string;
  created_date?: string;
  last_modified_date?: string;
  created_by_id?: number;
  last_modified_by_id?: number;
}

/**
 * Application types
 */
export type AppType = 'Web App' | 'Native App' | 'No Storage Required';

/**
 * Admin permission types
 */
export interface AdminPermission {
  resource: string;
  actions: AdminAction[];
  scope?: 'global' | 'limited';
  conditions?: PermissionCondition[];
}

/**
 * Admin actions
 */
export type AdminAction = 
  | 'create' | 'read' | 'update' | 'delete'
  | 'manage' | 'configure' | 'monitor'
  | 'backup' | 'restore' | 'import' | 'export';

/**
 * Permission conditions
 */
export interface PermissionCondition {
  field: string;
  operator: FilterOperator;
  value: any;
}

// ============================================================================
// Session Management Types
// ============================================================================

/**
 * Client-side session state
 */
export interface SessionState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  session: AuthSession | null;
  permissions: UserPermissions | null;
  loading: boolean;
  error: string | null;
  lastActivity: number;
  expiresAt: number;
}

/**
 * User permissions derived from roles
 */
export interface UserPermissions {
  isSystemAdmin: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManageServices: boolean;
  canManageApps: boolean;
  canViewReports: boolean;
  canConfigureSystem: boolean;
  canManageFiles: boolean;
  canManageScripts: boolean;
  canManageScheduler: boolean;
  canManageCache: boolean;
  canManageCors: boolean;
  canManageEmailTemplates: boolean;
  canManageLookupKeys: boolean;
  serviceAccess: ServicePermission[];
  appAccess: AppPermission[];
}

/**
 * Service-level permissions
 */
export interface ServicePermission {
  serviceId: number;
  serviceName: string;
  component?: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  filters?: AccessFilter[];
}

/**
 * App-level permissions
 */
export interface AppPermission {
  appId: number;
  appName: string;
  roleId: number;
  roleName: string;
  canAccess: boolean;
}

/**
 * Session refresh request
 */
export interface SessionRefreshRequest {
  refresh_token?: string;
  session_token: string;
}

/**
 * Session validation result
 */
export interface SessionValidation {
  valid: boolean;
  expired: boolean;
  user_id?: number;
  session_id?: string;
  expires_at?: number;
  error?: string;
}

// ============================================================================
// Next.js Middleware Integration Types
// ============================================================================

/**
 * Middleware authentication context
 */
export interface MiddlewareAuthContext {
  user: UserProfile | null;
  session: AuthSession | null;
  permissions: UserPermissions | null;
  isAuthenticated: boolean;
  requiresRefresh: boolean;
}

/**
 * Route protection configuration
 */
export interface RouteProtection {
  path: string;
  requireAuth: boolean;
  requiredPermissions?: string[];
  requireSystemAdmin?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
}

/**
 * Middleware request context
 */
export interface MiddlewareRequest {
  pathname: string;
  searchParams: URLSearchParams;
  headers: Headers;
  cookies: Record<string, string>;
  userAgent?: string;
  ip?: string;
}

/**
 * Middleware response actions
 */
export type MiddlewareAction = 
  | { type: 'continue' }
  | { type: 'redirect'; url: string }
  | { type: 'rewrite'; url: string }
  | { type: 'block'; status: number; message?: string }
  | { type: 'refresh_token'; token: string };

// ============================================================================
// React Hook Form & Zod Schemas
// ============================================================================

/**
 * User registration schema for React Hook Form
 */
export const userRegistrationSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  display_name: z.string().optional(),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  phone: z.string().optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  password_confirmation: z.string(),
  security_question: z.string().optional(),
  security_answer: z.string().optional(),
  default_app_id: z.number().optional(),
  is_active: z.boolean().default(true),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});

/**
 * User profile update schema
 */
export const userProfileUpdateSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  display_name: z.string().optional(),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  phone: z.string().optional(),
  security_question: z.string().optional(),
  security_answer: z.string().optional(),
  default_app_id: z.number().optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  theme_preference: z.enum(['light', 'dark', 'system']).optional(),
  notification_preferences: z.object({
    email_notifications: z.boolean(),
    system_alerts: z.boolean(),
    api_quota_warnings: z.boolean(),
    security_notifications: z.boolean(),
    maintenance_notifications: z.boolean(),
    newsletter_subscription: z.boolean().optional(),
  }).optional(),
  is_active: z.boolean(),
});

/**
 * Login form schema
 */
export const loginFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional(),
  duration: z.number().optional(),
});

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  reset_url: z.string().url().optional(),
});

/**
 * Password reset confirmation schema
 */
export const passwordResetConfirmationSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().min(1, 'Reset code is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  old_password: z.string().min(1, 'Current password is required'),
  new_password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  new_password_confirmation: z.string(),
}).refine((data) => data.new_password === data.new_password_confirmation, {
  message: "Passwords don't match",
  path: ["new_password_confirmation"],
}).refine((data) => data.old_password !== data.new_password, {
  message: "New password must be different from current password",
  path: ["new_password"],
});

/**
 * Role creation/update schema
 */
export const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(64, 'Role name too long'),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  role_service_access_by_role_id: z.array(z.object({
    service_id: z.number().optional(),
    service: z.string().optional(),
    component: z.string().optional(),
    verb_mask: z.number().optional(),
    requestor_type: z.enum(['API', 'SCRIPT', 'EVENT']).optional(),
    filters: z.array(z.object({
      name: z.string(),
      operator: z.string(),
      value: z.any(),
    })).optional(),
    filter_op: z.enum(['AND', 'OR']).optional(),
  })).optional(),
  role_lookup_by_role_id: z.array(z.object({
    name: z.string().min(1, 'Lookup name is required'),
    value: z.string().optional(),
    private: z.boolean().optional(),
    description: z.string().optional(),
  })).optional(),
});

/**
 * User app role assignment schema
 */
export const userAppRoleSchema = z.object({
  user_id: z.number().min(1, 'User ID is required'),
  app_id: z.number().min(1, 'App ID is required'),
  role_id: z.number().min(1, 'Role ID is required'),
});

// ============================================================================
// React Hook Form Type Inference
// ============================================================================

/**
 * TypeScript type inference for form schemas
 */
export type UserRegistrationForm = z.infer<typeof userRegistrationSchema>;
export type UserProfileUpdateForm = z.infer<typeof userProfileUpdateSchema>;
export type LoginForm = z.infer<typeof loginFormSchema>;
export type PasswordResetRequestForm = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmationForm = z.infer<typeof passwordResetConfirmationSchema>;
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;
export type RoleForm = z.infer<typeof roleSchema>;
export type UserAppRoleForm = z.infer<typeof userAppRoleSchema>;

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
    details?: any;
  };
  meta?: {
    total?: number;
    count?: number;
    offset?: number;
    limit?: number;
  };
}

/**
 * User list API response
 */
export interface UsersListResponse extends ApiResponse<UserProfile[]> {
  meta: {
    total: number;
    count: number;
    offset: number;
    limit: number;
  };
}

/**
 * Role list API response
 */
export interface RolesListResponse extends ApiResponse<UserRole[]> {
  meta: {
    total: number;
    count: number;
    offset: number;
    limit: number;
  };
}

/**
 * User session response
 */
export interface UserSessionResponse extends ApiResponse<AuthResponse> {}

// ============================================================================
// State Management Types (Zustand)
// ============================================================================

/**
 * Authentication store state
 */
export interface AuthStore {
  // State
  session: SessionState;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  loginWithOAuth: (credentials: OAuthCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  changePassword: (data: ChangePasswordForm) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  confirmPasswordReset: (data: PasswordResetConfirmationForm) => Promise<boolean>;
  
  // Utilities
  checkPermission: (permission: string) => boolean;
  hasRole: (roleName: string) => boolean;
  canAccessService: (serviceId: number, action: AdminAction) => boolean;
  canAccessApp: (appId: number) => boolean;
  isSessionExpiring: () => boolean;
  updateLastActivity: () => void;
  
  // Internal actions
  setUser: (user: UserProfile | null) => void;
  setSession: (session: AuthSession | null) => void;
  setPermissions: (permissions: UserPermissions | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

// ============================================================================
// React Query Types
// ============================================================================

/**
 * User query key factory
 */
export const userQueryKeys = {
  all: ['users'] as const,
  lists: () => [...userQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...userQueryKeys.lists(), filters] as const,
  details: () => [...userQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...userQueryKeys.details(), id] as const,
  profile: () => [...userQueryKeys.all, 'profile'] as const,
  permissions: (userId: number) => [...userQueryKeys.all, 'permissions', userId] as const,
  roles: () => ['roles'] as const,
  rolesList: () => [...userQueryKeys.roles(), 'list'] as const,
  roleDetail: (id: number) => [...userQueryKeys.roles(), 'detail', id] as const,
  apps: () => ['apps'] as const,
  appsList: () => [...userQueryKeys.apps(), 'list'] as const,
  appDetail: (id: number) => [...userQueryKeys.apps(), 'detail', id] as const,
  session: () => ['session'] as const,
};

/**
 * User mutation types
 */
export interface UserMutations {
  createUser: (data: UserRegistrationForm) => Promise<UserProfile>;
  updateUser: (id: number, data: Partial<UserProfileUpdateForm>) => Promise<UserProfile>;
  deleteUser: (id: number) => Promise<void>;
  createRole: (data: RoleForm) => Promise<UserRole>;
  updateRole: (id: number, data: Partial<RoleForm>) => Promise<UserRole>;
  deleteRole: (id: number) => Promise<void>;
  assignUserRole: (data: UserAppRoleForm) => Promise<UserAppRole>;
  removeUserRole: (userAppRoleId: number) => Promise<void>;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Authentication error types
 */
export interface AuthError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

/**
 * Common authentication error codes
 */
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  ACCOUNT_NOT_VERIFIED: 'ACCOUNT_NOT_VERIFIED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERROR_CODES;

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract user ID from various user objects
 */
export type UserId<T extends { id: number }> = T['id'];

/**
 * User creation payload (without server-generated fields)
 */
export type CreateUserPayload = Omit<
  UserProfile,
  'id' | 'created_date' | 'last_modified_date' | 'created_by_id' | 'last_modified_by_id' | 'last_login_date'
>;

/**
 * User update payload (without immutable fields)
 */
export type UpdateUserPayload = Partial<Omit<
  UserProfile,
  'id' | 'created_date' | 'last_modified_date' | 'created_by_id' | 'last_modified_by_id' | 'last_login_date'
>>;

/**
 * Role creation payload
 */
export type CreateRolePayload = Omit<
  UserRole,
  'id' | 'created_date' | 'last_modified_date' | 'created_by_id' | 'last_modified_by_id'
>;

/**
 * Role update payload
 */
export type UpdateRolePayload = Partial<CreateRolePayload>;

/**
 * Type guards for user types
 */
export const isAdminUser = (user: UserProfile): user is AdminUser => {
  return user.is_sys_admin === true;
};

export const isAuthenticatedUser = (user: any): user is UserProfile => {
  return user && typeof user === 'object' && 'id' in user && 'email' in user;
};

export const isValidSession = (session: any): session is AuthSession => {
  return session && 
         typeof session === 'object' && 
         'session_token' in session && 
         'expires_at' in session && 
         session.expires_at > Date.now();
};

// ============================================================================
// Export All Types
// ============================================================================

export type {
  BaseUser,
  UserProfile,
  AdminUser,
  NotificationPreferences,
  UserLookup,
  JWTPayload,
  AuthSession,
  LoginCredentials,
  OAuthCredentials,
  ApiKeyAuth,
  AuthResponse,
  PasswordResetRequest,
  PasswordResetConfirmation,
  ChangePasswordRequest,
  UserRole,
  RoleServiceAccess,
  AccessFilter,
  FilterOperator,
  RequestorType,
  RoleLookup,
  UserAppRole,
  UserApp,
  AppType,
  AdminPermission,
  AdminAction,
  PermissionCondition,
  SessionState,
  UserPermissions,
  ServicePermission,
  AppPermission,
  SessionRefreshRequest,
  SessionValidation,
  MiddlewareAuthContext,
  RouteProtection,
  MiddlewareRequest,
  MiddlewareAction,
  ApiResponse,
  UsersListResponse,
  RolesListResponse,
  UserSessionResponse,
  AuthStore,
  UserMutations,
  AuthError,
  AuthErrorCode,
  CreateUserPayload,
  UpdateUserPayload,
  CreateRolePayload,
  UpdateRolePayload,
};