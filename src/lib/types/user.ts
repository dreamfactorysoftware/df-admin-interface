/**
 * User Data Types for React/Next.js Integration
 * 
 * Comprehensive user-related data structures and session management types,
 * maintaining full compatibility with existing DreamFactory APIs while supporting
 * modern React application patterns, Next.js middleware authentication flows,
 * and role-based access control for React components.
 * 
 * These types provide the foundational data structures for user entities,
 * authentication sessions, and permission management, ensuring seamless
 * integration with existing DreamFactory backend APIs while enabling
 * modern React component patterns and Next.js server-side rendering capabilities.
 * 
 * @fileoverview User data interfaces for React/Next.js integration
 * @version 1.0.0
 */

import { ReactNode } from 'react';
import { RoleRow, RoleType } from './role';

// =============================================================================
// PRESERVED BACKEND API COMPATIBILITY INTERFACES
// =============================================================================

/**
 * Core user profile data interface maintaining exact compatibility with backend API.
 * Used for authentication responses and user management operations.
 * 
 * @interface UserProfile
 * @example
 * ```typescript
 * const userProfile: UserProfile = {
 *   id: 123,
 *   name: "admin",
 *   first_name: "System",
 *   last_name: "Administrator",
 *   email: "admin@dreamfactory.com",
 *   is_active: true,
 *   role: [{ id: 1, name: "admin", description: "Administrator", active: true }],
 *   created_date: "2024-01-15T10:30:00Z",
 *   last_modified_date: "2024-01-15T10:30:00Z"
 * };
 * ```
 */
export interface UserProfile {
  /** Unique user identifier from backend database */
  id: number;
  
  /** Username for authentication (unique system identifier) */
  name: string;
  
  /** User's first name */
  first_name: string;
  
  /** User's last name */
  last_name: string;
  
  /** User's email address */
  email: string;
  
  /** Whether the user account is active */
  is_active: boolean;
  
  /** Array of roles assigned to the user */
  role: RoleRow[];
  
  /** ISO 8601 timestamp when user was created */
  created_date: string;
  
  /** ISO 8601 timestamp when user was last modified */
  last_modified_date: string;
  
  /** Optional phone number */
  phone?: string;
  
  /** Optional security question */
  security_question?: string;
  
  /** Optional additional user metadata */
  attributes?: Record<string, any>;
  
  /** Optional last login timestamp */
  last_login?: string;
  
  /** Optional password last changed timestamp */
  password_last_changed?: string;
  
  /** Whether the user must change password on next login */
  force_password_change?: boolean;
}

/**
 * User row data interface for table display and listing operations.
 * Simplified user data for grid displays and selection components.
 * 
 * @interface UserRow
 * @example
 * ```typescript
 * const userRow: UserRow = {
 *   id: 123,
 *   name: "admin",
 *   email: "admin@dreamfactory.com",
 *   first_name: "System",
 *   last_name: "Administrator",
 *   is_active: true,
 *   role_name: "Administrator"
 * };
 * ```
 */
export interface UserRow {
  /** Unique user identifier */
  id: number;
  
  /** Username */
  name: string;
  
  /** User's email address */
  email: string;
  
  /** User's first name */
  first_name: string;
  
  /** User's last name */
  last_name: string;
  
  /** Whether the user account is active */
  is_active: boolean;
  
  /** Primary role name for display */
  role_name?: string;
  
  /** Last login date for display */
  last_login?: string;
  
  /** Created date for display */
  created_date?: string;
}

/**
 * Admin profile interface for administrative user management.
 * Extended user profile with administrative capabilities and metadata.
 * 
 * @interface AdminProfile
 * @example
 * ```typescript
 * const adminProfile: AdminProfile = {
 *   ...userProfile,
 *   is_sys_admin: true,
 *   admin_created_by_id: 1,
 *   admin_created_date: "2024-01-15T10:30:00Z",
 *   admin_last_modified_by_id: 1,
 *   admin_last_modified_date: "2024-01-15T10:30:00Z",
 *   admin_permissions: ["system:manage", "users:create", "services:configure"]
 * };
 * ```
 */
export interface AdminProfile extends UserProfile {
  /** Whether user has system administrator privileges */
  is_sys_admin: boolean;
  
  /** ID of admin who created this admin user */
  admin_created_by_id?: number;
  
  /** Timestamp when admin privileges were granted */
  admin_created_date?: string;
  
  /** ID of admin who last modified this admin user */
  admin_last_modified_by_id?: number;
  
  /** Timestamp when admin privileges were last modified */
  admin_last_modified_date?: string;
  
  /** Array of specific admin permissions */
  admin_permissions?: string[];
  
  /** Whether admin can create other admin users */
  can_create_admins?: boolean;
  
  /** Whether admin can modify system settings */
  can_modify_system?: boolean;
  
  /** Array of manageable user groups */
  manageable_groups?: string[];
}

// =============================================================================
// NEXT.JS SESSION MANAGEMENT INTERFACES
// =============================================================================

/**
 * Next.js session interface for middleware and server-side authentication.
 * Designed for Next.js middleware token validation and server components.
 * 
 * @interface UserSession
 * @example
 * ```typescript
 * const session: UserSession = {
 *   user: userProfile,
 *   token: "eyJhbGciOiJIUzI1NiIs...",
 *   expiresAt: new Date("2024-01-16T10:30:00Z"),
 *   refreshToken: "refresh_token_here",
 *   sessionId: "session_123",
 *   isAuthenticated: true,
 *   permissions: ["api:read", "schema:view"],
 *   features: { apiGeneration: true, userManagement: false }
 * };
 * ```
 */
export interface UserSession {
  /** Complete user profile data */
  user: UserProfile;
  
  /** JWT authentication token */
  token: string;
  
  /** Token expiration timestamp */
  expiresAt: Date;
  
  /** Refresh token for session renewal */
  refreshToken?: string;
  
  /** Unique session identifier */
  sessionId: string;
  
  /** Whether the session is currently authenticated */
  isAuthenticated: boolean;
  
  /** Cached user permissions for quick access */
  permissions: string[];
  
  /** Feature flags for the current user */
  features: Record<string, boolean>;
  
  /** Session creation timestamp */
  createdAt?: Date;
  
  /** Last activity timestamp for session timeout */
  lastActivity?: Date;
  
  /** Client information (IP, user agent, etc.) */
  clientInfo?: SessionClientInfo;
  
  /** Whether session requires refresh */
  requiresRefresh?: boolean;
  
  /** Session security flags */
  securityFlags?: SessionSecurityFlags;
}

/**
 * Session client information for security tracking.
 */
export interface SessionClientInfo {
  /** Client IP address */
  ipAddress?: string;
  
  /** User agent string */
  userAgent?: string;
  
  /** Client device type */
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  
  /** Browser information */
  browser?: string;
  
  /** Operating system information */
  os?: string;
  
  /** Geographic location (if available) */
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

/**
 * Session security flags for enhanced security monitoring.
 */
export interface SessionSecurityFlags {
  /** Whether session was created with MFA */
  mfaVerified?: boolean;
  
  /** Whether session is from a trusted device */
  trustedDevice?: boolean;
  
  /** Risk score for the session */
  riskScore?: number;
  
  /** Whether session requires additional verification */
  requiresVerification?: boolean;
  
  /** Security warnings */
  warnings?: string[];
}

/**
 * Session management options for Next.js middleware.
 */
export interface SessionOptions {
  /** Session timeout in milliseconds */
  timeout?: number;
  
  /** Automatic refresh threshold in milliseconds */
  refreshThreshold?: number;
  
  /** Whether to extend session on activity */
  extendOnActivity?: boolean;
  
  /** Secure cookie settings */
  cookieSettings?: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge?: number;
  };
  
  /** Whether to enable session security monitoring */
  securityMonitoring?: boolean;
}

// =============================================================================
// REACT COMPONENT INTEGRATION TYPES
// =============================================================================

/**
 * React context user data for component consumption.
 * Optimized for React context providers and component state.
 * 
 * @interface UserContextData
 * @example
 * ```typescript
 * const userContext: UserContextData = {
 *   user: userProfile,
 *   session: userSession,
 *   loading: false,
 *   error: null,
 *   isAuthenticated: true,
 *   hasPermission: (permission) => userPermissions.includes(permission),
 *   hasRole: (roleName) => userRoles.some(role => role.name === roleName),
 *   logout: async () => { ... },
 *   refreshSession: async () => { ... },
 *   updateProfile: async (data) => { ... }
 * };
 * ```
 */
export interface UserContextData {
  /** Current user profile (null if not authenticated) */
  user: UserProfile | null;
  
  /** Current session information */
  session: UserSession | null;
  
  /** Loading state for authentication operations */
  loading: boolean;
  
  /** Error state for authentication operations */
  error: string | null;
  
  /** Whether user is currently authenticated */
  isAuthenticated: boolean;
  
  /** Function to check if user has specific permission */
  hasPermission: (permission: string) => boolean;
  
  /** Function to check if user has specific role */
  hasRole: (roleName: string) => boolean;
  
  /** Function to check if user has any of the specified roles */
  hasAnyRole: (roleNames: string[]) => boolean;
  
  /** Function to check if user has all specified permissions */
  hasAllPermissions: (permissions: string[]) => boolean;
  
  /** Function to log out the current user */
  logout: () => Promise<void>;
  
  /** Function to refresh the current session */
  refreshSession: () => Promise<void>;
  
  /** Function to update user profile */
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  
  /** Function to change user password */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  /** User preferences and settings */
  preferences?: UserPreferences;
  
  /** Feature availability for the current user */
  features?: Record<string, boolean>;
}

/**
 * User preferences interface for customization settings.
 */
export interface UserPreferences {
  /** UI theme preference */
  theme?: 'light' | 'dark' | 'system';
  
  /** Language preference */
  language?: string;
  
  /** Timezone preference */
  timezone?: string;
  
  /** Date format preference */
  dateFormat?: string;
  
  /** Time format preference */
  timeFormat?: '12h' | '24h';
  
  /** Dashboard layout preferences */
  dashboardLayout?: Record<string, any>;
  
  /** Table display preferences */
  tablePreferences?: {
    pageSize?: number;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    visibleColumns?: string[];
  };
  
  /** Notification preferences */
  notifications?: {
    email?: boolean;
    browser?: boolean;
    types?: string[];
  };
}

/**
 * User state management interface for React components.
 */
export interface UserComponentState extends UserProfile {
  /** Loading state for user operations */
  loading?: boolean;
  
  /** Error state for user operations */
  error?: string | null;
  
  /** Whether user data is being edited */
  isEditing?: boolean;
  
  /** Whether user is selected in multi-select interfaces */
  isSelected?: boolean;
  
  /** Validation errors for form fields */
  validationErrors?: UserValidationErrors;
  
  /** Original values for change tracking */
  originalValues?: Partial<UserProfile>;
  
  /** Dirty state for form change detection */
  isDirty?: boolean;
  
  /** Available roles for assignment */
  availableRoles?: RoleRow[];
  
  /** Current role assignments */
  assignedRoles?: RoleRow[];
}

/**
 * User validation errors for form components.
 */
export interface UserValidationErrors {
  /** Username validation errors */
  name?: string[];
  
  /** Email validation errors */
  email?: string[];
  
  /** First name validation errors */
  first_name?: string[];
  
  /** Last name validation errors */
  last_name?: string[];
  
  /** Password validation errors */
  password?: string[];
  
  /** Phone validation errors */
  phone?: string[];
  
  /** Role assignment validation errors */
  roles?: string[];
  
  /** General validation errors */
  general?: string[];
}

// =============================================================================
// AUTHENTICATION AND AUTHORIZATION TYPES
// =============================================================================

/**
 * Login credentials interface for authentication forms.
 */
export interface LoginCredentials {
  /** Username or email */
  username: string;
  
  /** Password */
  password: string;
  
  /** Remember me option */
  remember?: boolean;
  
  /** Multi-factor authentication token */
  mfaToken?: string;
  
  /** Captcha token for security */
  captchaToken?: string;
}

/**
 * Login response interface from authentication API.
 */
export interface LoginResponse {
  /** Whether login was successful */
  success: boolean;
  
  /** Authentication session token */
  session_token?: string;
  
  /** Session ID */
  session_id?: string;
  
  /** User profile data */
  user?: UserProfile;
  
  /** Error message if login failed */
  error?: string;
  
  /** Whether MFA is required */
  mfa_required?: boolean;
  
  /** MFA methods available */
  mfa_methods?: string[];
  
  /** Session expiration timestamp */
  expires_at?: string;
  
  /** Refresh token */
  refresh_token?: string;
}

/**
 * Password reset request interface.
 */
export interface PasswordResetRequest {
  /** Email address for password reset */
  email: string;
  
  /** Captcha token for security */
  captchaToken?: string;
}

/**
 * Password reset confirmation interface.
 */
export interface PasswordResetConfirmation {
  /** Reset token from email */
  token: string;
  
  /** New password */
  password: string;
  
  /** Password confirmation */
  confirmPassword: string;
}

/**
 * Permission definition interface for role-based access control.
 */
export interface Permission {
  /** Permission identifier */
  id: string;
  
  /** Human-readable permission name */
  name: string;
  
  /** Permission description */
  description: string;
  
  /** Permission category */
  category: string;
  
  /** Permission level */
  level: 'read' | 'write' | 'admin' | 'owner';
  
  /** Resource the permission applies to */
  resource: string;
  
  /** Whether permission requires additional context */
  requiresContext?: boolean;
  
  /** Dependencies on other permissions */
  dependencies?: string[];
}

/**
 * User permission context for granular access control.
 */
export interface UserPermissionContext {
  /** User identifier */
  userId: number;
  
  /** Effective permissions */
  permissions: Permission[];
  
  /** Role-based permissions */
  rolePermissions: Record<string, Permission[]>;
  
  /** Direct user permissions */
  userPermissions: Permission[];
  
  /** Resource-specific permissions */
  resourcePermissions: Record<string, Permission[]>;
  
  /** Permission evaluation cache */
  permissionCache: Map<string, boolean>;
  
  /** Context expiration timestamp */
  expiresAt: Date;
}

// =============================================================================
// COMPONENT PROPS INTERFACES
// =============================================================================

/**
 * User management component props interface.
 */
export interface UserManagementComponentProps {
  /** Current user context for permission checking */
  currentUser?: UserProfile;
  
  /** Available users for management */
  users?: UserProfile[];
  
  /** Available roles for assignment */
  availableRoles?: RoleRow[];
  
  /** Loading state */
  loading?: boolean;
  
  /** Error state */
  error?: string | null;
  
  /** User creation handler */
  onCreateUser?: (user: Partial<UserProfile>) => Promise<void>;
  
  /** User update handler */
  onUpdateUser?: (id: number, user: Partial<UserProfile>) => Promise<void>;
  
  /** User deletion handler */
  onDeleteUser?: (id: number) => Promise<void>;
  
  /** User selection handler */
  onSelectUser?: (user: UserProfile) => void;
  
  /** Role assignment handler */
  onAssignRole?: (userId: number, roleId: number) => Promise<void>;
  
  /** Component styling classes */
  className?: string;
  
  /** Child components */
  children?: ReactNode;
}

/**
 * User profile component props interface.
 */
export interface UserProfileProps {
  /** User profile to display/edit */
  user: UserProfile;
  
  /** Whether component is in edit mode */
  editable?: boolean;
  
  /** Whether component is read-only */
  readOnly?: boolean;
  
  /** Profile update handler */
  onUpdate?: (updates: Partial<UserProfile>) => Promise<void>;
  
  /** Password change handler */
  onPasswordChange?: (currentPassword: string, newPassword: string) => Promise<void>;
  
  /** Profile deletion handler */
  onDelete?: () => Promise<void>;
  
  /** Loading state */
  loading?: boolean;
  
  /** Form validation errors */
  errors?: UserValidationErrors;
  
  /** Component styling */
  className?: string;
}

/**
 * User selector component props interface.
 */
export interface UserSelectorProps {
  /** Available users for selection */
  users: UserRow[];
  
  /** Currently selected user IDs */
  selectedIds?: number[];
  
  /** Multi-select mode */
  multiple?: boolean;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Loading state */
  loading?: boolean;
  
  /** Error message */
  error?: string;
  
  /** Selection change handler */
  onChange: (selectedIds: number[]) => void;
  
  /** Search functionality enabled */
  searchable?: boolean;
  
  /** Filter by role */
  roleFilter?: string[];
  
  /** Filter by active status */
  activeFilter?: boolean;
  
  /** Custom user display renderer */
  renderUser?: (user: UserRow) => ReactNode;
  
  /** Component styling */
  className?: string;
}

/**
 * Authentication guard component props interface.
 */
export interface AuthGuardProps {
  /** Required permissions for access */
  permissions?: string[];
  
  /** Required roles for access */
  roles?: string[];
  
  /** Whether to require ALL permissions/roles or ANY */
  requireAll?: boolean;
  
  /** Fallback component for unauthorized access */
  fallback?: ReactNode;
  
  /** Redirect URL for unauthorized access */
  redirectTo?: string;
  
  /** Loading component */
  loading?: ReactNode;
  
  /** Children to protect */
  children: ReactNode;
  
  /** Custom authorization check */
  authorize?: (user: UserProfile) => boolean;
}

// =============================================================================
// HOOK INTEGRATION TYPES
// =============================================================================

/**
 * User management hook return interface.
 */
export interface UseUserManagementReturn {
  /** Available users */
  users: UserProfile[];
  
  /** Loading state */
  loading: boolean;
  
  /** Error state */
  error: string | null;
  
  /** Create user function */
  createUser: (payload: CreateUserPayload) => Promise<UserProfile>;
  
  /** Update user function */
  updateUser: (id: number, payload: UpdateUserPayload) => Promise<UserProfile>;
  
  /** Delete user function */
  deleteUser: (id: number, options?: DeleteUserOptions) => Promise<void>;
  
  /** Refresh users function */
  refreshUsers: () => Promise<void>;
  
  /** Get user by ID function */
  getUserById: (id: number) => UserProfile | undefined;
  
  /** Filter users function */
  filterUsers: (params: UserQueryParams) => UserProfile[];
  
  /** Assign role to user */
  assignRole: (userId: number, roleId: number) => Promise<void>;
  
  /** Remove role from user */
  removeRole: (userId: number, roleId: number) => Promise<void>;
}

/**
 * Authentication hook return interface.
 */
export interface UseAuthReturn {
  /** Current user */
  user: UserProfile | null;
  
  /** Current session */
  session: UserSession | null;
  
  /** Authentication state */
  isAuthenticated: boolean;
  
  /** Loading state */
  loading: boolean;
  
  /** Error state */
  error: string | null;
  
  /** Login function */
  login: (credentials: LoginCredentials) => Promise<void>;
  
  /** Logout function */
  logout: () => Promise<void>;
  
  /** Refresh session function */
  refreshSession: () => Promise<void>;
  
  /** Update profile function */
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  
  /** Change password function */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  /** Permission check function */
  hasPermission: (permission: string) => boolean;
  
  /** Role check function */
  hasRole: (roleName: string) => boolean;
}

// =============================================================================
// API PAYLOAD TYPES
// =============================================================================

/**
 * User creation payload for API requests.
 */
export interface CreateUserPayload {
  /** Username (required) */
  name: string;
  
  /** Email address (required) */
  email: string;
  
  /** First name (required) */
  first_name: string;
  
  /** Last name (required) */
  last_name: string;
  
  /** Password (required) */
  password: string;
  
  /** Whether user is active (default: true) */
  is_active?: boolean;
  
  /** Role assignments */
  role?: number[];
  
  /** Phone number */
  phone?: string;
  
  /** Security question */
  security_question?: string;
  
  /** Security answer */
  security_answer?: string;
  
  /** Additional attributes */
  attributes?: Record<string, any>;
  
  /** Whether to force password change on first login */
  force_password_change?: boolean;
}

/**
 * User update payload for API requests.
 */
export interface UpdateUserPayload {
  /** Updated username */
  name?: string;
  
  /** Updated email address */
  email?: string;
  
  /** Updated first name */
  first_name?: string;
  
  /** Updated last name */
  last_name?: string;
  
  /** Updated password */
  password?: string;
  
  /** Updated active status */
  is_active?: boolean;
  
  /** Updated role assignments */
  role?: number[];
  
  /** Updated phone number */
  phone?: string;
  
  /** Updated security question */
  security_question?: string;
  
  /** Updated security answer */
  security_answer?: string;
  
  /** Updated additional attributes */
  attributes?: Record<string, any>;
  
  /** Whether to force password change */
  force_password_change?: boolean;
}

/**
 * User deletion options.
 */
export interface DeleteUserOptions {
  /** Whether to force deletion even if user has dependencies */
  force?: boolean;
  
  /** Replacement user ID for data reassignment */
  replacementUserId?: number;
  
  /** Whether to send notification */
  notifyUser?: boolean;
  
  /** Reason for deletion */
  reason?: string;
}

/**
 * User query parameters for filtering and pagination.
 */
export interface UserQueryParams {
  /** Filter by active status */
  active?: boolean;
  
  /** Search by name, email, or other fields */
  search?: string;
  
  /** Filter by role IDs */
  roles?: number[];
  
  /** Filter by email domain */
  emailDomain?: string;
  
  /** Filter by creation date range */
  createdAfter?: string;
  createdBefore?: string;
  
  /** Filter by last login date range */
  lastLoginAfter?: string;
  lastLoginBefore?: string;
  
  /** Pagination limit */
  limit?: number;
  
  /** Pagination offset */
  offset?: number;
  
  /** Sort field */
  sortBy?: keyof UserProfile;
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  
  /** Include related data */
  include?: ('roles' | 'permissions' | 'attributes')[];
}

// =============================================================================
// TYPE GUARDS AND VALIDATORS
// =============================================================================

/**
 * Type guard to check if an object is a valid UserProfile.
 */
export function isUserProfile(obj: any): obj is UserProfile {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.first_name === 'string' &&
    typeof obj.last_name === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.is_active === 'boolean' &&
    Array.isArray(obj.role) &&
    typeof obj.created_date === 'string' &&
    typeof obj.last_modified_date === 'string'
  );
}

/**
 * Type guard to check if an object is a valid UserSession.
 */
export function isUserSession(obj: any): obj is UserSession {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    isUserProfile(obj.user) &&
    typeof obj.token === 'string' &&
    obj.expiresAt instanceof Date &&
    typeof obj.sessionId === 'string' &&
    typeof obj.isAuthenticated === 'boolean' &&
    Array.isArray(obj.permissions)
  );
}

/**
 * Validates user data according to business rules.
 */
export function validateUserData(user: Partial<UserProfile>): UserValidationResult {
  const errors: UserValidationErrors = {};
  
  // Username validation
  if (!user.name) {
    errors.name = ['Username is required'];
  } else if (user.name.length < 3) {
    errors.name = ['Username must be at least 3 characters'];
  } else if (user.name.length > 32) {
    errors.name = ['Username must not exceed 32 characters'];
  } else if (!/^[a-zA-Z0-9_-]+$/.test(user.name)) {
    errors.name = ['Username can only contain letters, numbers, underscores, and hyphens'];
  }
  
  // Email validation
  if (!user.email) {
    errors.email = ['Email is required'];
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.email = ['Please enter a valid email address'];
  }
  
  // First name validation
  if (!user.first_name) {
    errors.first_name = ['First name is required'];
  } else if (user.first_name.length > 100) {
    errors.first_name = ['First name must not exceed 100 characters'];
  }
  
  // Last name validation
  if (!user.last_name) {
    errors.last_name = ['Last name is required'];
  } else if (user.last_name.length > 100) {
    errors.last_name = ['Last name must not exceed 100 characters'];
  }
  
  // Phone validation (if provided)
  if (user.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(user.phone.replace(/[\s\-\(\)]/g, ''))) {
    errors.phone = ['Please enter a valid phone number'];
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * User validation result interface.
 */
export interface UserValidationResult {
  /** Whether user data is valid */
  isValid: boolean;
  
  /** Validation errors by field */
  errors: UserValidationErrors;
  
  /** Validation warnings */
  warnings?: Record<string, string[]>;
}

/**
 * Default values for creating new users.
 */
export const DEFAULT_USER_VALUES: Partial<UserProfile> = {
  is_active: true,
  role: [],
  attributes: {}
};

/**
 * User field labels for form components.
 */
export const USER_FIELD_LABELS: Record<keyof UserProfile, string> = {
  id: 'ID',
  name: 'Username',
  first_name: 'First Name',
  last_name: 'Last Name',
  email: 'Email Address',
  is_active: 'Active',
  role: 'Roles',
  created_date: 'Created Date',
  last_modified_date: 'Last Modified Date',
  phone: 'Phone Number',
  security_question: 'Security Question',
  attributes: 'Additional Attributes',
  last_login: 'Last Login',
  password_last_changed: 'Password Last Changed',
  force_password_change: 'Force Password Change'
};

/**
 * Session timeout constants for different environments.
 */
export const SESSION_TIMEOUTS = {
  /** Default session timeout (24 hours) */
  DEFAULT: 24 * 60 * 60 * 1000,
  
  /** Short session timeout (2 hours) */
  SHORT: 2 * 60 * 60 * 1000,
  
  /** Extended session timeout (7 days) */
  EXTENDED: 7 * 24 * 60 * 60 * 1000,
  
  /** Remember me session timeout (30 days) */
  REMEMBER_ME: 30 * 24 * 60 * 60 * 1000
} as const;

/**
 * Permission constants for common user operations.
 */
export const USER_PERMISSIONS = {
  /** View user profiles */
  VIEW_USERS: 'users:view',
  
  /** Create new users */
  CREATE_USERS: 'users:create',
  
  /** Update user profiles */
  UPDATE_USERS: 'users:update',
  
  /** Delete users */
  DELETE_USERS: 'users:delete',
  
  /** Manage user roles */
  MANAGE_USER_ROLES: 'users:manage_roles',
  
  /** View admin profiles */
  VIEW_ADMINS: 'admins:view',
  
  /** Create admin users */
  CREATE_ADMINS: 'admins:create',
  
  /** Update admin profiles */
  UPDATE_ADMINS: 'admins:update',
  
  /** Delete admin users */
  DELETE_ADMINS: 'admins:delete',
  
  /** Manage system settings */
  MANAGE_SYSTEM: 'system:manage'
} as const;

/**
 * User status constants.
 */
export const USER_STATUS = {
  /** Active user account */
  ACTIVE: 'active',
  
  /** Inactive user account */
  INACTIVE: 'inactive',
  
  /** Pending user account activation */
  PENDING: 'pending',
  
  /** Suspended user account */
  SUSPENDED: 'suspended',
  
  /** Locked user account */
  LOCKED: 'locked'
} as const;

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Extract user display name utility type.
 */
export type UserDisplayName = Pick<UserProfile, 'first_name' | 'last_name' | 'name'>;

/**
 * Extract user contact info utility type.
 */
export type UserContactInfo = Pick<UserProfile, 'email' | 'phone'>;

/**
 * Extract user security info utility type.
 */
export type UserSecurityInfo = Pick<UserProfile, 'security_question' | 'last_login' | 'password_last_changed' | 'force_password_change'>;

/**
 * User summary type for minimal data requirements.
 */
export type UserSummary = Pick<UserProfile, 'id' | 'name' | 'email' | 'first_name' | 'last_name' | 'is_active'>;

/**
 * Helper function to get user display name.
 */
export function getUserDisplayName(user: UserDisplayName): string {
  return `${user.first_name} ${user.last_name}`.trim() || user.name;
}

/**
 * Helper function to get user initials.
 */
export function getUserInitials(user: UserDisplayName): string {
  const firstName = user.first_name?.charAt(0).toUpperCase() || '';
  const lastName = user.last_name?.charAt(0).toUpperCase() || '';
  return firstName + lastName || user.name?.charAt(0).toUpperCase() || '';
}

/**
 * Helper function to check if user has any admin roles.
 */
export function isUserAdmin(user: UserProfile): boolean {
  return user.role.some(role => 
    role.name.toLowerCase().includes('admin') || 
    role.name.toLowerCase().includes('administrator')
  );
}

/**
 * Helper function to check if session is expired.
 */
export function isSessionExpired(session: UserSession): boolean {
  return new Date() >= session.expiresAt;
}

/**
 * Helper function to check if session needs refresh.
 */
export function shouldRefreshSession(session: UserSession, thresholdMs: number = 5 * 60 * 1000): boolean {
  const timeUntilExpiry = session.expiresAt.getTime() - Date.now();
  return timeUntilExpiry <= thresholdMs;
}