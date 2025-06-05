import { GenericSuccessResponse } from './generic-http';

/**
 * User Management Types for React/Next.js Integration
 * 
 * Maintains full compatibility with DreamFactory API contracts while supporting:
 * - React Hook Form integration for form management
 * - Zod schema validator compatibility for comprehensive input validation
 * - Next.js API route authentication endpoints
 * - Modern React authentication workflows
 */

// ===== CORE AUTHENTICATION INTERFACES =====

/**
 * Login credentials interface with React Hook Form support
 * Supports both username and email-based authentication flows
 */
export interface LoginCredentials {
  /** Username for credential-based login (optional if email provided) */
  username?: string;
  /** Email address for email-based login (optional if username provided) */
  email?: string;
  /** User password (required) */
  password: string;
  /** Remember user session across browser sessions */
  rememberMe?: boolean;
  /** Specific authentication service to use */
  service?: string;
}

/**
 * User registration details for account creation flows
 * Compatible with React Hook Form field validation patterns
 */
export interface RegisterDetails {
  /** Unique username for the account */
  username: string;
  /** Email address for the account */
  email: string;
  /** Full display name */
  name: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
}

/**
 * Password reset form data structure
 * Supports multi-step password reset workflows with React Hook Form
 */
export interface ResetFormData {
  /** Email address for password reset */
  email: string;
  /** Username for password reset */
  username: string;
  /** Reset verification code */
  code: string;
  /** New password to set */
  newPassword: string;
  /** Optional security question for additional verification */
  securityQuestion?: string;
  /** Answer to security question if provided */
  securityAnswer?: string;
}

/**
 * Password update request for authenticated users
 * Used in profile management workflows
 */
export interface UpdatePasswordRequest {
  /** Current password for verification */
  oldPassword: string;
  /** New password to set */
  newPassword: string;
}

/**
 * Password update response with new session token
 * Extends generic success response with session management
 */
export interface UpdatePasswordResponse extends GenericSuccessResponse {
  /** New session token after password change */
  sessionToken: string;
}

/**
 * URL parameters for user management operations
 * Used in Next.js dynamic routes and API endpoints
 */
export interface UserParams {
  /** Admin identifier */
  admin: string;
  /** Verification or reset code */
  code: string;
  /** Email address parameter */
  email: string;
  /** Username parameter */
  username: string;
}

/**
 * Forgot password request interface
 * Supports both username and email-based password recovery
 */
export interface ForgetPasswordRequest {
  /** Username for password recovery (optional if email provided) */
  username?: string;
  /** Email address for password recovery (optional if username provided) */
  email?: string;
}

/**
 * Security question interface for additional authentication security
 */
export interface SecurityQuestion {
  /** The security question text */
  securityQuestion: string;
}

// ===== REACT HOOK FORM INTEGRATION TYPES =====

/**
 * Form validation state interface for React Hook Form integration
 * Provides type-safe form state management with validation errors
 */
export interface FormValidationState<T = Record<string, any>> {
  /** Form data values */
  values: T;
  /** Field-level validation errors */
  errors: Partial<Record<keyof T, string>>;
  /** Form-level validation errors */
  formError?: string;
  /** Loading state for form submission */
  isSubmitting: boolean;
  /** Form validation state */
  isValid: boolean;
  /** Form touched state */
  isDirty: boolean;
}

/**
 * Login form state for React Hook Form
 * Extends FormValidationState with login-specific fields
 */
export interface LoginFormState extends FormValidationState<LoginCredentials> {
  /** Authentication attempt count for rate limiting */
  attemptCount: number;
  /** Maximum attempts allowed before lockout */
  maxAttempts: number;
  /** Lockout expiration timestamp */
  lockoutUntil?: number;
}

/**
 * Registration form state for React Hook Form
 * Extends FormValidationState with registration-specific fields
 */
export interface RegisterFormState extends FormValidationState<RegisterDetails> {
  /** Password confirmation field */
  confirmPassword: string;
  /** Terms of service acceptance */
  acceptTerms: boolean;
  /** Email verification status */
  emailVerificationSent: boolean;
}

/**
 * Password reset form state for React Hook Form
 * Supports multi-step password reset workflows
 */
export interface ResetFormState extends FormValidationState<ResetFormData> {
  /** Current step in the reset process */
  currentStep: 'request' | 'verify' | 'reset' | 'complete';
  /** Verification code sent timestamp */
  codeSentAt?: number;
  /** Code expiration timestamp */
  codeExpiresAt?: number;
}

// ===== ZOD VALIDATION COMPATIBILITY TYPES =====

/**
 * Validation schema result interface for Zod compatibility
 * Provides type-safe validation result handling
 */
export interface ValidationResult<T> {
  /** Validation success status */
  success: boolean;
  /** Parsed and validated data (if successful) */
  data?: T;
  /** Validation errors by field */
  errors?: Record<string, string[]>;
  /** First error message for quick access */
  error?: string;
}

/**
 * Field validation rule interface for dynamic validation
 * Compatible with both React Hook Form and Zod validation patterns
 */
export interface FieldValidationRule {
  /** Rule type identifier */
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'custom';
  /** Rule value (for length, pattern rules) */
  value?: string | number | RegExp;
  /** Error message for validation failure */
  message: string;
  /** Custom validation function */
  validator?: (value: any) => boolean | Promise<boolean>;
}

/**
 * Form schema definition for dynamic form generation
 * Supports both React Hook Form and Zod validation integration
 */
export interface FormSchemaDefinition {
  /** Field definitions with validation rules */
  fields: Record<string, {
    /** Field type */
    type: 'text' | 'email' | 'password' | 'checkbox' | 'select';
    /** Field label */
    label: string;
    /** Placeholder text */
    placeholder?: string;
    /** Required field flag */
    required?: boolean;
    /** Validation rules */
    rules?: FieldValidationRule[];
    /** Default value */
    defaultValue?: any;
    /** Field options (for select fields) */
    options?: { label: string; value: any }[];
  }>;
  /** Form-level validation rules */
  formRules?: {
    /** Cross-field validation function */
    validator: (values: Record<string, any>) => Record<string, string> | null;
    /** Debounce delay for validation */
    debounceMs?: number;
  };
}

// ===== NEXT.JS API ROUTE COMPATIBILITY TYPES =====

/**
 * Next.js API route request body for authentication
 * Type-safe request handling for Next.js API routes
 */
export interface AuthApiRequest<T = any> {
  /** Request method */
  method: 'POST' | 'PUT' | 'GET' | 'DELETE';
  /** Request body data */
  body: T;
  /** Request headers */
  headers: Record<string, string>;
  /** Query parameters */
  query: Record<string, string>;
  /** User session context */
  user?: {
    id: string;
    username: string;
    email: string;
    roles: string[];
  };
}

/**
 * Next.js API route response for authentication
 * Standardized response format for authentication endpoints
 */
export interface AuthApiResponse<T = any> {
  /** Response success status */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error message (if unsuccessful) */
  error?: string;
  /** Error details */
  details?: Record<string, any>;
  /** Response metadata */
  meta?: {
    /** Request timestamp */
    timestamp: number;
    /** Request ID for tracking */
    requestId: string;
    /** Rate limiting information */
    rateLimit?: {
      limit: number;
      remaining: number;
      reset: number;
    };
  };
}

/**
 * Session data interface for Next.js middleware
 * Compatible with Next.js middleware authentication patterns
 */
export interface SessionData {
  /** Session token */
  token: string;
  /** Token expiration timestamp */
  expiresAt: number;
  /** User information */
  user: {
    id: string;
    username: string;
    email: string;
    name: string;
    roles: string[];
    permissions: string[];
  };
  /** Session metadata */
  metadata: {
    /** Session creation timestamp */
    createdAt: number;
    /** Last activity timestamp */
    lastActivity: number;
    /** User agent information */
    userAgent?: string;
    /** IP address */
    ipAddress?: string;
  };
}

// ===== AUTHENTICATION WORKFLOW TYPES =====

/**
 * Authentication workflow context for React components
 * Provides complete authentication state management
 */
export interface AuthWorkflowContext {
  /** Current authentication state */
  state: 'idle' | 'authenticating' | 'authenticated' | 'error' | 'expired';
  /** Current user data */
  user: SessionData['user'] | null;
  /** Authentication loading state */
  isLoading: boolean;
  /** Authentication error */
  error: string | null;
  /** Login function */
  login: (credentials: LoginCredentials) => Promise<ValidationResult<SessionData>>;
  /** Logout function */
  logout: () => Promise<void>;
  /** Token refresh function */
  refreshToken: () => Promise<ValidationResult<SessionData>>;
  /** Password update function */
  updatePassword: (request: UpdatePasswordRequest) => Promise<ValidationResult<UpdatePasswordResponse>>;
  /** Password reset request function */
  requestPasswordReset: (request: ForgetPasswordRequest) => Promise<ValidationResult<GenericSuccessResponse>>;
  /** Password reset completion function */
  completePasswordReset: (data: ResetFormData) => Promise<ValidationResult<GenericSuccessResponse>>;
}

/**
 * Multi-factor authentication interface
 * Future-compatible interface for MFA workflows
 */
export interface MfaChallenge {
  /** Challenge type */
  type: 'totp' | 'sms' | 'email' | 'backup_code';
  /** Challenge identifier */
  challengeId: string;
  /** Challenge message */
  message: string;
  /** Required input format */
  inputFormat: 'numeric' | 'alphanumeric' | 'code';
  /** Challenge expiration timestamp */
  expiresAt: number;
}

/**
 * MFA verification request
 */
export interface MfaVerificationRequest {
  /** Challenge identifier */
  challengeId: string;
  /** User-provided verification code */
  code: string;
  /** Remember device flag */
  rememberDevice?: boolean;
}

// ===== FORM CONFIGURATION TYPES =====

/**
 * Login form configuration for React Hook Form
 * Provides reusable form configuration with validation
 */
export interface LoginFormConfig {
  /** Form schema definition */
  schema: FormSchemaDefinition;
  /** Default form values */
  defaultValues: Partial<LoginCredentials>;
  /** Form submission handler */
  onSubmit: (values: LoginCredentials) => Promise<ValidationResult<SessionData>>;
  /** Form validation mode */
  mode: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  /** Reset form on successful submission */
  resetOnSuccess?: boolean;
}

/**
 * Registration form configuration for React Hook Form
 */
export interface RegisterFormConfig {
  /** Form schema definition */
  schema: FormSchemaDefinition;
  /** Default form values */
  defaultValues: Partial<RegisterDetails>;
  /** Form submission handler */
  onSubmit: (values: RegisterDetails) => Promise<ValidationResult<GenericSuccessResponse>>;
  /** Form validation mode */
  mode: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  /** Email verification requirement */
  requireEmailVerification?: boolean;
}

/**
 * Password reset form configuration for React Hook Form
 */
export interface PasswordResetFormConfig {
  /** Form schema definition */
  schema: FormSchemaDefinition;
  /** Default form values */
  defaultValues: Partial<ResetFormData>;
  /** Form submission handler */
  onSubmit: (values: ResetFormData) => Promise<ValidationResult<GenericSuccessResponse>>;
  /** Current workflow step */
  step: ResetFormState['currentStep'];
  /** Step transition handler */
  onStepChange: (step: ResetFormState['currentStep']) => void;
}

// ===== UTILITY TYPES =====

/**
 * Authentication event types for logging and analytics
 */
export type AuthEventType = 
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'token_refresh'
  | 'password_change'
  | 'password_reset_request'
  | 'password_reset_complete'
  | 'account_registration'
  | 'account_verification'
  | 'mfa_challenge'
  | 'mfa_verification';

/**
 * Authentication event data for analytics and monitoring
 */
export interface AuthEvent {
  /** Event type */
  type: AuthEventType;
  /** Event timestamp */
  timestamp: number;
  /** User identifier (if available) */
  userId?: string;
  /** Session identifier */
  sessionId?: string;
  /** Event metadata */
  metadata: Record<string, any>;
  /** Success status */
  success: boolean;
  /** Error message (if unsuccessful) */
  error?: string;
}

/**
 * Rate limiting configuration for authentication endpoints
 */
export interface AuthRateLimitConfig {
  /** Maximum attempts per window */
  maxAttempts: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Lockout duration in milliseconds */
  lockoutMs: number;
  /** Rate limit key generator */
  keyGenerator: (request: AuthApiRequest) => string;
}

// Export all interfaces for external consumption
export type {
  FormValidationState,
  LoginFormState,
  RegisterFormState,
  ResetFormState,
  ValidationResult,
  FieldValidationRule,
  FormSchemaDefinition,
  AuthApiRequest,
  AuthApiResponse,
  SessionData,
  AuthWorkflowContext,
  MfaChallenge,
  MfaVerificationRequest,
  LoginFormConfig,
  RegisterFormConfig,
  PasswordResetFormConfig,
  AuthEvent,
  AuthEventType,
  AuthRateLimitConfig
};