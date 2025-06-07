/**
 * User Management Workflow Types for React Hook Form and Zod Integration
 * 
 * Provides comprehensive type definitions for user authentication, registration, profile management,
 * and role-based access control workflows. Designed for seamless integration with React Hook Form
 * validation patterns and Zod schema validators while maintaining compatibility with Next.js API
 * routes and DreamFactory backend services.
 * 
 * @fileoverview This module provides comprehensive user management type definitions for:
 * - React Hook Form integration with real-time validation under 100ms
 * - Zod schema validator compatibility for type-safe input validation
 * - Next.js API route authentication endpoint compatibility
 * - Role-based access control (RBAC) with granular permissions
 * - Password reset and security question workflows optimized for React components
 * - Session management and token refresh patterns
 * - User profile and preference management
 * - Multi-factor authentication support
 */

import {
  GenericSuccessResponse,
  GenericErrorResponse,
  ApiError,
  ValidationErrors,
  RequestOptions,
  PaginatedResponse,
  ListRequestParams
} from './generic-http';

// =============================================================================
// CORE USER ENTITY TYPES
// =============================================================================

/**
 * Core user entity representing a system user with complete profile information.
 * Used across all user management workflows and components.
 */
export interface User {
  /** Unique user identifier */
  id: number | string;
  /** User email address (primary identifier) */
  email: string;
  /** Display name */
  name: string;
  /** First name */
  first_name?: string;
  /** Last name */
  last_name?: string;
  /** Phone number */
  phone?: string;
  /** User status */
  is_active: boolean;
  /** Admin privileges flag */
  is_sys_admin: boolean;
  /** Account confirmation status */
  confirmed?: boolean;
  /** Last login timestamp */
  last_login_date?: string;
  /** Account creation timestamp */
  created_date?: string;
  /** Last modification timestamp */
  last_modified_date?: string;
  /** User profile image URL */
  avatar_url?: string;
  /** User timezone */
  timezone?: string;
  /** User locale/language preference */
  locale?: string;
  /** User role assignments */
  roles?: UserRole[];
  /** User permissions (computed from roles) */
  permissions?: UserPermission[];
  /** User preferences */
  preferences?: UserPreferences;
  /** Security question configuration */
  security_question?: SecurityQuestionConfig;
  /** Multi-factor authentication status */
  mfa_enabled?: boolean;
  /** Password expiration date */
  password_expires?: string;
  /** Account locked status */
  is_locked?: boolean;
  /** Failed login attempts count */
  failed_login_attempts?: number;
  /** Additional user metadata */
  metadata?: Record<string, any>;
}

/**
 * User role assignment with app-specific context.
 */
export interface UserRole {
  /** Role identifier */
  id: number | string;
  /** Role name */
  name: string;
  /** Role description */
  description?: string;
  /** Associated application ID (optional) */
  app_id?: number | string;
  /** Associated application name */
  app_name?: string;
  /** Role assignment date */
  assigned_date?: string;
  /** Role expiration date */
  expires_date?: string;
  /** Role is active */
  is_active: boolean;
}

/**
 * User permission definition with resource-level granularity.
 */
export interface UserPermission {
  /** Permission identifier */
  id: string;
  /** Permission name */
  name: string;
  /** Permission description */
  description?: string;
  /** Resource type this permission applies to */
  resource_type: string;
  /** Resource identifier (optional for global permissions) */
  resource_id?: string | number;
  /** Permission actions (read, write, delete, etc.) */
  actions: string[];
  /** Permission source (role, direct assignment) */
  source: 'role' | 'direct';
  /** Source role ID if permission comes from role */
  source_role_id?: string | number;
}

/**
 * User preferences for UI customization and behavior.
 */
export interface UserPreferences {
  /** UI theme preference */
  theme?: 'light' | 'dark' | 'auto';
  /** Dashboard layout preference */
  dashboard_layout?: 'compact' | 'comfortable' | 'spacious';
  /** Items per page for data tables */
  items_per_page?: number;
  /** Default data export format */
  export_format?: 'json' | 'csv' | 'xml';
  /** Email notification preferences */
  notifications?: NotificationPreferences;
  /** Keyboard shortcuts enabled */
  keyboard_shortcuts?: boolean;
  /** Show help tooltips */
  show_tooltips?: boolean;
  /** Custom dashboard widgets */
  dashboard_widgets?: string[];
  /** Additional custom preferences */
  custom?: Record<string, any>;
}

/**
 * Notification preferences for various system events.
 */
export interface NotificationPreferences {
  /** Email notifications enabled */
  email_enabled: boolean;
  /** In-app notifications enabled */
  in_app_enabled: boolean;
  /** Notification frequency */
  frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  /** Specific event notifications */
  events: {
    /** API generation completion */
    api_generation?: boolean;
    /** System maintenance */
    system_maintenance?: boolean;
    /** Security alerts */
    security_alerts?: boolean;
    /** Usage reports */
    usage_reports?: boolean;
    /** Feature updates */
    feature_updates?: boolean;
  };
}

// =============================================================================
// AUTHENTICATION WORKFLOW TYPES
// =============================================================================

/**
 * Login form data structure for React Hook Form integration.
 * Provides type-safe form handling with validation support.
 */
export interface LoginFormData {
  /** User email address */
  email: string;
  /** User password */
  password: string;
  /** Remember me option */
  remember_me?: boolean;
  /** Two-factor authentication code */
  mfa_code?: string;
  /** Additional login context */
  context?: {
    /** Login attempt source */
    source?: 'web' | 'api' | 'mobile';
    /** Client information */
    client_info?: string;
    /** IP address (automatically captured) */
    ip_address?: string;
  };
}

/**
 * Zod-compatible login validation schema type.
 * Used for runtime validation and TypeScript inference.
 */
export interface LoginValidationSchema {
  /** Email field validation rules */
  email: {
    required: string;
    pattern: {
      value: RegExp;
      message: string;
    };
    maxLength: {
      value: number;
      message: string;
    };
  };
  /** Password field validation rules */
  password: {
    required: string;
    minLength: {
      value: number;
      message: string;
    };
    maxLength: {
      value: number;
      message: string;
    };
  };
  /** MFA code validation (when required) */
  mfa_code?: {
    required: string;
    pattern: {
      value: RegExp;
      message: string;
    };
    length: {
      value: number;
      message: string;
    };
  };
}

/**
 * Login response data structure from authentication endpoints.
 */
export interface LoginResponse extends GenericSuccessResponse {
  /** Authenticated user information */
  user: User;
  /** Session token */
  session_token: string;
  /** Token expiration timestamp */
  expires: string;
  /** Refresh token for token renewal */
  refresh_token?: string;
  /** Whether MFA is required for this user */
  mfa_required: boolean;
  /** Available MFA methods if required */
  mfa_methods?: MfaMethod[];
  /** Session configuration */
  session_config: SessionConfig;
  /** First-time login flag */
  is_first_login: boolean;
  /** Password change required flag */
  password_change_required: boolean;
}

/**
 * MFA method configuration for multi-factor authentication.
 */
export interface MfaMethod {
  /** MFA method type */
  type: 'totp' | 'sms' | 'email' | 'backup_codes';
  /** Method display name */
  name: string;
  /** Method description */
  description?: string;
  /** Whether method is enabled */
  enabled: boolean;
  /** Whether method is primary */
  is_primary: boolean;
  /** Method-specific configuration */
  config?: Record<string, any>;
}

/**
 * Session configuration settings.
 */
export interface SessionConfig {
  /** Session timeout in minutes */
  timeout: number;
  /** Whether session extends on activity */
  extend_on_activity: boolean;
  /** Session token refresh threshold */
  refresh_threshold: number;
  /** Concurrent session limit */
  max_concurrent_sessions: number;
  /** Whether to force logout on password change */
  logout_on_password_change: boolean;
}

// =============================================================================
// USER REGISTRATION TYPES
// =============================================================================

/**
 * User registration form data for React Hook Form integration.
 * Supports both admin-created users and self-registration workflows.
 */
export interface UserRegistrationFormData {
  /** User email address */
  email: string;
  /** User password */
  password: string;
  /** Password confirmation */
  password_confirm: string;
  /** First name */
  first_name: string;
  /** Last name */
  last_name: string;
  /** Display name (auto-generated if not provided) */
  name?: string;
  /** Phone number */
  phone?: string;
  /** User timezone */
  timezone?: string;
  /** User locale */
  locale?: string;
  /** Initial roles to assign */
  role_ids?: (string | number)[];
  /** Whether user should be immediately active */
  is_active?: boolean;
  /** Whether to send welcome email */
  send_welcome_email?: boolean;
  /** Security question configuration */
  security_question?: SecurityQuestionFormData;
  /** Terms acceptance (for self-registration) */
  accept_terms?: boolean;
  /** Privacy policy acceptance */
  accept_privacy?: boolean;
  /** Marketing emails opt-in */
  marketing_emails?: boolean;
  /** Additional user metadata */
  metadata?: Record<string, any>;
}

/**
 * Security question form data structure.
 */
export interface SecurityQuestionFormData {
  /** Selected security question ID */
  question_id: string | number;
  /** Security question answer */
  answer: string;
  /** Backup security question (optional) */
  backup_question_id?: string | number;
  /** Backup question answer */
  backup_answer?: string;
}

/**
 * User registration validation schema for Zod integration.
 */
export interface UserRegistrationValidationSchema {
  email: {
    required: string;
    pattern: { value: RegExp; message: string };
    maxLength: { value: number; message: string };
    /** Custom async email uniqueness validation */
    validate?: {
      unique: (email: string) => Promise<boolean | string>;
    };
  };
  password: {
    required: string;
    minLength: { value: number; message: string };
    maxLength: { value: number; message: string };
    pattern: { value: RegExp; message: string };
  };
  password_confirm: {
    required: string;
    validate: {
      matches: (value: string, formValues: any) => boolean | string;
    };
  };
  first_name: {
    required: string;
    maxLength: { value: number; message: string };
    pattern: { value: RegExp; message: string };
  };
  last_name: {
    required: string;
    maxLength: { value: number; message: string };
    pattern: { value: RegExp; message: string };
  };
  phone?: {
    pattern: { value: RegExp; message: string };
  };
  accept_terms?: {
    required: string;
    validate: { isTrue: (value: boolean) => boolean | string };
  };
}

/**
 * User registration response from Next.js API routes.
 */
export interface UserRegistrationResponse extends GenericSuccessResponse {
  /** Created user information */
  user: User;
  /** Whether email confirmation is required */
  confirmation_required: boolean;
  /** Confirmation token (if required) */
  confirmation_token?: string;
  /** Estimated confirmation email delivery time */
  confirmation_email_sent?: boolean;
  /** Whether admin approval is required */
  approval_required: boolean;
  /** Next steps for user onboarding */
  next_steps: string[];
}

// =============================================================================
// PASSWORD RESET WORKFLOW TYPES
// =============================================================================

/**
 * Password reset request form data for React Hook Form.
 */
export interface PasswordResetRequestFormData {
  /** User email address */
  email: string;
  /** Security question answer (if required) */
  security_answer?: string;
  /** Selected security question ID */
  security_question_id?: string | number;
  /** Captcha response (if enabled) */
  captcha_response?: string;
}

/**
 * Password reset request validation schema.
 */
export interface PasswordResetRequestValidationSchema {
  email: {
    required: string;
    pattern: { value: RegExp; message: string };
    validate?: {
      exists: (email: string) => Promise<boolean | string>;
    };
  };
  security_answer?: {
    required: string;
    minLength: { value: number; message: string };
  };
  captcha_response?: {
    required: string;
  };
}

/**
 * Password reset request response.
 */
export interface PasswordResetRequestResponse extends GenericSuccessResponse {
  /** Whether reset email was sent */
  email_sent: boolean;
  /** Reset token expiration time */
  expires_in: number;
  /** Whether security question was required */
  security_question_required: boolean;
  /** Rate limiting information */
  rate_limit?: {
    /** Requests remaining */
    remaining: number;
    /** Reset time for rate limit */
    reset_time: string;
  };
}

/**
 * Password reset form data for completing password reset.
 */
export interface PasswordResetFormData {
  /** New password */
  password: string;
  /** Password confirmation */
  password_confirm: string;
  /** Reset token from email/URL */
  reset_token: string;
  /** User email (for verification) */
  email: string;
  /** Optional additional verification */
  verification_code?: string;
}

/**
 * Password reset validation schema.
 */
export interface PasswordResetValidationSchema {
  password: {
    required: string;
    minLength: { value: number; message: string };
    maxLength: { value: number; message: string };
    pattern: { value: RegExp; message: string };
  };
  password_confirm: {
    required: string;
    validate: {
      matches: (value: string, formValues: any) => boolean | string;
    };
  };
  reset_token: {
    required: string;
  };
  email: {
    required: string;
    pattern: { value: RegExp; message: string };
  };
}

/**
 * Password reset completion response.
 */
export interface PasswordResetResponse extends GenericSuccessResponse {
  /** Whether password was successfully reset */
  password_reset: boolean;
  /** Whether user should be automatically logged in */
  auto_login: boolean;
  /** Session information if auto-login enabled */
  session?: {
    token: string;
    expires: string;
    user: User;
  };
  /** Security recommendations */
  security_recommendations?: string[];
}

// =============================================================================
// USER PROFILE MANAGEMENT TYPES
// =============================================================================

/**
 * User profile update form data for React Hook Form.
 */
export interface UserProfileFormData {
  /** Display name */
  name?: string;
  /** First name */
  first_name?: string;
  /** Last name */
  last_name?: string;
  /** Phone number */
  phone?: string;
  /** Profile image file */
  avatar?: File;
  /** Avatar URL (if using external image) */
  avatar_url?: string;
  /** User timezone */
  timezone?: string;
  /** User locale */
  locale?: string;
  /** Email notification preferences */
  notification_preferences?: NotificationPreferences;
  /** UI preferences */
  ui_preferences?: Pick<UserPreferences, 'theme' | 'dashboard_layout' | 'items_per_page'>;
  /** Whether to remove current avatar */
  remove_avatar?: boolean;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Password change form data for React Hook Form.
 */
export interface PasswordChangeFormData {
  /** Current password */
  current_password: string;
  /** New password */
  new_password: string;
  /** New password confirmation */
  new_password_confirm: string;
  /** Whether to logout other sessions */
  logout_other_sessions?: boolean;
}

/**
 * Password change validation schema.
 */
export interface PasswordChangeValidationSchema {
  current_password: {
    required: string;
  };
  new_password: {
    required: string;
    minLength: { value: number; message: string };
    maxLength: { value: number; message: string };
    pattern: { value: RegExp; message: string };
    validate: {
      different: (value: string, formValues: any) => boolean | string;
    };
  };
  new_password_confirm: {
    required: string;
    validate: {
      matches: (value: string, formValues: any) => boolean | string;
    };
  };
}

/**
 * User profile update response.
 */
export interface UserProfileUpdateResponse extends GenericSuccessResponse {
  /** Updated user information */
  user: User;
  /** Whether avatar was updated */
  avatar_updated?: boolean;
  /** New avatar URL */
  avatar_url?: string;
  /** Whether preferences were updated */
  preferences_updated?: boolean;
  /** Fields that were modified */
  modified_fields: string[];
}

// =============================================================================
// SECURITY QUESTION MANAGEMENT TYPES
// =============================================================================

/**
 * Available security question definition.
 */
export interface SecurityQuestion {
  /** Question identifier */
  id: string | number;
  /** Question text */
  question: string;
  /** Question category */
  category: 'personal' | 'preference' | 'historical' | 'custom';
  /** Whether question supports custom answers */
  allows_custom_answer: boolean;
  /** Whether question is currently active */
  is_active: boolean;
  /** Question difficulty level */
  difficulty: 'low' | 'medium' | 'high';
}

/**
 * Security question configuration for users.
 */
export interface SecurityQuestionConfig {
  /** Primary security question */
  primary_question: {
    id: string | number;
    question: string;
    answer_hash: string;
  };
  /** Backup security question (optional) */
  backup_question?: {
    id: string | number;
    question: string;
    answer_hash: string;
  };
  /** Configuration date */
  configured_date: string;
  /** Last verification date */
  last_verified?: string;
  /** Whether configuration is complete */
  is_complete: boolean;
}

/**
 * Security question setup form data.
 */
export interface SecurityQuestionSetupFormData {
  /** Primary question ID */
  primary_question_id: string | number;
  /** Primary question answer */
  primary_answer: string;
  /** Backup question ID */
  backup_question_id?: string | number;
  /** Backup question answer */
  backup_answer?: string;
}

/**
 * Security question verification form data.
 */
export interface SecurityQuestionVerificationFormData {
  /** Security question answer */
  answer: string;
  /** Question ID being answered */
  question_id: string | number;
  /** Whether this is for password reset */
  for_password_reset?: boolean;
}

// =============================================================================
// ROLE AND PERMISSION MANAGEMENT TYPES
// =============================================================================

/**
 * Role definition with comprehensive permission structure.
 */
export interface Role {
  /** Role identifier */
  id: string | number;
  /** Role name */
  name: string;
  /** Role description */
  description?: string;
  /** Whether role is system default */
  is_default: boolean;
  /** Whether role is active */
  is_active: boolean;
  /** Associated application ID */
  app_id?: string | number;
  /** Associated application name */
  app_name?: string;
  /** Role permissions */
  permissions: Permission[];
  /** Role creation date */
  created_date: string;
  /** Role last modification date */
  last_modified_date: string;
  /** Number of users assigned to this role */
  user_count?: number;
  /** Role hierarchy level */
  level?: number;
  /** Parent role ID (for hierarchical roles) */
  parent_role_id?: string | number;
}

/**
 * Permission definition with resource-level granularity.
 */
export interface Permission {
  /** Permission identifier */
  id: string;
  /** Permission name */
  name: string;
  /** Permission description */
  description?: string;
  /** Resource type */
  resource_type: string;
  /** Allowed actions */
  actions: PermissionAction[];
  /** Permission scope */
  scope: 'global' | 'application' | 'resource' | 'field';
  /** Resource pattern (for pattern-based permissions) */
  resource_pattern?: string;
  /** Whether permission is system default */
  is_system: boolean;
  /** Permission category */
  category: string;
}

/**
 * Permission action definition.
 */
export interface PermissionAction {
  /** Action name */
  action: string;
  /** Action display name */
  display_name: string;
  /** Action description */
  description?: string;
  /** Whether action is destructive */
  is_destructive: boolean;
  /** Required conditions for action */
  conditions?: PermissionCondition[];
}

/**
 * Permission condition for conditional access.
 */
export interface PermissionCondition {
  /** Condition type */
  type: 'time' | 'location' | 'mfa' | 'approval' | 'custom';
  /** Condition parameters */
  parameters: Record<string, any>;
  /** Condition description */
  description?: string;
}

/**
 * Role assignment form data for React Hook Form.
 */
export interface RoleAssignmentFormData {
  /** User ID to assign roles to */
  user_id: string | number;
  /** Role IDs to assign */
  role_ids: (string | number)[];
  /** Application context (optional) */
  app_id?: string | number;
  /** Assignment expiration date */
  expires_date?: string;
  /** Assignment reason/notes */
  notes?: string;
  /** Whether to notify user of role changes */
  notify_user?: boolean;
}

// =============================================================================
// SESSION MANAGEMENT TYPES
// =============================================================================

/**
 * User session information.
 */
export interface UserSession {
  /** Session identifier */
  id: string;
  /** Session token */
  token: string;
  /** User ID */
  user_id: string | number;
  /** Session creation timestamp */
  created_at: string;
  /** Last activity timestamp */
  last_activity: string;
  /** Session expiration timestamp */
  expires_at: string;
  /** Session IP address */
  ip_address: string;
  /** User agent string */
  user_agent: string;
  /** Session location (if available) */
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  /** Whether session is current */
  is_current: boolean;
  /** Session type */
  type: 'web' | 'api' | 'mobile';
  /** Session status */
  status: 'active' | 'expired' | 'revoked';
}

/**
 * Token refresh request data.
 */
export interface TokenRefreshRequestData {
  /** Refresh token */
  refresh_token: string;
  /** Current session token */
  current_token?: string;
  /** Whether to extend session */
  extend_session?: boolean;
}

/**
 * Token refresh response.
 */
export interface TokenRefreshResponse extends GenericSuccessResponse {
  /** New session token */
  token: string;
  /** New token expiration */
  expires: string;
  /** New refresh token (if rotated) */
  refresh_token?: string;
  /** Session configuration */
  session_config: SessionConfig;
  /** User information (if updated) */
  user?: User;
}

// =============================================================================
// API ENDPOINT TYPES FOR NEXT.JS INTEGRATION
// =============================================================================

/**
 * Next.js API route request types for user management endpoints.
 */
export interface UserManagementApiRequest<T = any> extends RequestOptions {
  /** Request body data */
  body: T;
  /** Authentication context */
  auth?: {
    /** Current user */
    user: User;
    /** Session token */
    token: string;
    /** User permissions */
    permissions: string[];
  };
  /** Request metadata */
  metadata?: {
    /** Request timestamp */
    timestamp: string;
    /** Request ID for tracing */
    request_id: string;
    /** Client information */
    client_info?: string;
  };
}

/**
 * User list request parameters.
 */
export interface UserListRequestParams extends ListRequestParams {
  /** Filter by user status */
  status?: 'all' | 'active' | 'inactive' | 'locked';
  /** Filter by role */
  role_id?: string | number;
  /** Filter by application */
  app_id?: string | number;
  /** Include user roles in response */
  include_roles?: boolean;
  /** Include user permissions in response */
  include_permissions?: boolean;
  /** Include user preferences in response */
  include_preferences?: boolean;
}

/**
 * User list response.
 */
export interface UserListResponse extends PaginatedResponse<User> {
  /** Summary statistics */
  summary?: {
    /** Total active users */
    active_users: number;
    /** Total inactive users */
    inactive_users: number;
    /** Total admin users */
    admin_users: number;
    /** Users with MFA enabled */
    mfa_enabled_users: number;
  };
  /** Available filters */
  filters?: {
    /** Available roles for filtering */
    roles: Role[];
    /** Available applications for filtering */
    applications: { id: string | number; name: string }[];
  };
}

// =============================================================================
// ERROR HANDLING TYPES
// =============================================================================

/**
 * User management specific error types.
 */
export type UserManagementErrorType =
  | 'authentication_failed'
  | 'invalid_credentials'
  | 'account_locked'
  | 'account_inactive'
  | 'password_expired'
  | 'mfa_required'
  | 'mfa_invalid'
  | 'email_not_verified'
  | 'password_too_weak'
  | 'password_recently_used'
  | 'security_question_incorrect'
  | 'reset_token_invalid'
  | 'reset_token_expired'
  | 'rate_limit_exceeded'
  | 'insufficient_permissions'
  | 'role_assignment_failed'
  | 'user_not_found'
  | 'email_already_exists'
  | 'session_expired'
  | 'session_invalid'
  | 'validation_failed';

/**
 * User management error response.
 */
export interface UserManagementErrorResponse extends GenericErrorResponse {
  error: ApiError & {
    /** User management specific error type */
    type: UserManagementErrorType;
    /** Additional context for user management errors */
    context?: {
      /** Failed field (for validation errors) */
      field?: string;
      /** Remaining attempts (for rate limiting) */
      remaining_attempts?: number;
      /** Lockout duration (for account locks) */
      lockout_duration?: number;
      /** Required action (for account issues) */
      required_action?: 'verify_email' | 'reset_password' | 'contact_admin' | 'setup_mfa';
      /** Available recovery methods */
      recovery_methods?: ('email' | 'security_question' | 'admin_unlock')[];
    };
  };
}

// =============================================================================
// REACT HOOK FORM INTEGRATION TYPES
// =============================================================================

/**
 * React Hook Form field state for user management forms.
 */
export interface UserManagementFieldState {
  /** Field name */
  name: string;
  /** Field value */
  value: any;
  /** Field error message */
  error?: string;
  /** Field is currently being validated */
  isValidating?: boolean;
  /** Field is dirty (user has interacted) */
  isDirty?: boolean;
  /** Field is touched (user has focused/blurred) */
  isTouched?: boolean;
  /** Field validation rules */
  rules?: {
    required?: string | boolean;
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
    pattern?: { value: RegExp; message: string };
    validate?: Record<string, (value: any) => boolean | string | Promise<boolean | string>>;
  };
}

/**
 * React Hook Form configuration for user management forms.
 */
export interface UserManagementFormConfig<T = any> {
  /** Default form values */
  defaultValues?: Partial<T>;
  /** Form validation mode */
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  /** Re-validation mode */
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  /** Whether to focus first error field */
  shouldFocusError?: boolean;
  /** Whether to use uncontrolled form */
  shouldUnregister?: boolean;
  /** Custom resolver for validation */
  resolver?: any; // Zod resolver type would be imported
  /** Form submission handler */
  onSubmit?: (data: T) => void | Promise<void>;
  /** Form error handler */
  onError?: (errors: any) => void;
  /** Form validation handler */
  onValidationChange?: (isValid: boolean) => void;
}

// =============================================================================
// UTILITY TYPES AND TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if error is a user management error.
 */
export function isUserManagementError(error: any): error is UserManagementErrorResponse {
  return (
    error &&
    typeof error === 'object' &&
    error.success === false &&
    error.error &&
    typeof error.error.type === 'string' &&
    [
      'authentication_failed',
      'invalid_credentials',
      'account_locked',
      'account_inactive',
      'password_expired',
      'mfa_required',
      'mfa_invalid',
      'email_not_verified',
      'password_too_weak',
      'password_recently_used',
      'security_question_incorrect',
      'reset_token_invalid',
      'reset_token_expired',
      'rate_limit_exceeded',
      'insufficient_permissions',
      'role_assignment_failed',
      'user_not_found',
      'email_already_exists',
      'session_expired',
      'session_invalid',
      'validation_failed'
    ].includes(error.error.type)
  );
}

/**
 * Type guard to check if user has admin privileges.
 */
export function isAdminUser(user: User): boolean {
  return user.is_sys_admin === true;
}

/**
 * Type guard to check if user account is active.
 */
export function isActiveUser(user: User): boolean {
  return user.is_active === true && !user.is_locked;
}

/**
 * Type guard to check if user has specific permission.
 */
export function hasPermission(user: User, permission: string): boolean {
  return user.permissions?.some(p => p.id === permission) || user.is_sys_admin === true;
}

/**
 * Type guard to check if user has role.
 */
export function hasRole(user: User, roleName: string): boolean {
  return user.roles?.some(r => r.name === roleName && r.is_active) || false;
}

/**
 * Extract form field names from form data type.
 */
export type FormFieldNames<T> = {
  [K in keyof T]: K
}[keyof T];

/**
 * Extract validation schema type from form data type.
 */
export type ValidationSchemaFor<T> = {
  [K in keyof T]?: {
    required?: string | boolean;
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
    pattern?: { value: RegExp; message: string };
    validate?: Record<string, (value: any, formValues?: T) => boolean | string | Promise<boolean | string>>;
  }
};

// =============================================================================
// CONSTANTS AND ENUMS
// =============================================================================

/**
 * User status enumeration.
 */
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  LOCKED: 'locked',
  PENDING: 'pending',
  SUSPENDED: 'suspended'
} as const;

/**
 * Permission scope enumeration.
 */
export const PERMISSION_SCOPE = {
  GLOBAL: 'global',
  APPLICATION: 'application',
  RESOURCE: 'resource',
  FIELD: 'field'
} as const;

/**
 * MFA method types.
 */
export const MFA_METHODS = {
  TOTP: 'totp',
  SMS: 'sms',
  EMAIL: 'email',
  BACKUP_CODES: 'backup_codes'
} as const;

/**
 * Security question categories.
 */
export const SECURITY_QUESTION_CATEGORIES = {
  PERSONAL: 'personal',
  PREFERENCE: 'preference',
  HISTORICAL: 'historical',
  CUSTOM: 'custom'
} as const;

// =============================================================================
// EXPORTS
// =============================================================================

// Export all types for external consumption
export type {
  // Core user types
  User,
  UserRole,
  UserPermission,
  UserPreferences,
  NotificationPreferences,
  
  // Authentication types
  LoginFormData,
  LoginValidationSchema,
  LoginResponse,
  MfaMethod,
  SessionConfig,
  
  // Registration types
  UserRegistrationFormData,
  SecurityQuestionFormData,
  UserRegistrationValidationSchema,
  UserRegistrationResponse,
  
  // Password reset types
  PasswordResetRequestFormData,
  PasswordResetRequestValidationSchema,
  PasswordResetRequestResponse,
  PasswordResetFormData,
  PasswordResetValidationSchema,
  PasswordResetResponse,
  
  // Profile management types
  UserProfileFormData,
  PasswordChangeFormData,
  PasswordChangeValidationSchema,
  UserProfileUpdateResponse,
  
  // Security questions
  SecurityQuestion,
  SecurityQuestionConfig,
  SecurityQuestionSetupFormData,
  SecurityQuestionVerificationFormData,
  
  // Roles and permissions
  Role,
  Permission,
  PermissionAction,
  PermissionCondition,
  RoleAssignmentFormData,
  
  // Session management
  UserSession,
  TokenRefreshRequestData,
  TokenRefreshResponse,
  
  // API types
  UserManagementApiRequest,
  UserListRequestParams,
  UserListResponse,
  
  // Error types
  UserManagementErrorType,
  UserManagementErrorResponse,
  
  // Form integration types
  UserManagementFieldState,
  UserManagementFormConfig,
  FormFieldNames,
  ValidationSchemaFor
};