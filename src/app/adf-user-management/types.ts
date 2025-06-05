/**
 * @fileoverview TypeScript type definitions for authentication workflows in the adf-user-management module.
 * 
 * This module provides strongly-typed interfaces that ensure type safety across all authentication
 * components and replace Angular's type definitions with React/Next.js compatible interfaces.
 * Designed for TypeScript 5.8+ compatibility with React 19 and integrates seamlessly with
 * Zod schema validators and React Hook Form for comprehensive input validation.
 * 
 * Key Features:
 * - React/Next.js compatible authentication types
 * - Zod schema integration for real-time validation under 100ms
 * - OAuth, LDAP, and SAML provider type definitions
 * - Next.js middleware integration for session management
 * - Component-specific UI state management
 * - Form state and validation interfaces
 * 
 * @requires react@19.0.0
 * @requires next@15.1.0
 * @requires zod@3.22.0
 * @requires react-hook-form@7.52.0
 */

import type { ReactNode } from 'react';

// Re-export core authentication types from lib for component consumption
export type {
  // Core authentication interfaces
  LoginResponse,
  UserSession,
  SessionUser,
  SessionTokens,
  SessionMetadata,
  
  // RBAC and permissions
  UserPermissions,
  UserRole,
  ServicePermissions,
  SystemPermissions,
  
  // Middleware integration
  MiddlewareAuthContext,
  
  // Token management
  TokenRefreshRequest,
  TokenRefreshResponse,
  
  // Error handling
  AuthenticationError,
  AuthErrorType,
  
  // Authentication state management
  AuthState,
  AuthActions,
} from '../../lib/types/auth';

export type {
  // User management workflows
  LoginCredentials,
  RegisterDetails,
  ResetFormData,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
  ForgetPasswordRequest,
  SecurityQuestion,
  
  // Form validation and state
  FormValidationState,
  LoginFormState,
  RegisterFormState,
  ResetFormState,
  ValidationResult,
  
  // Authentication workflow context
  AuthWorkflowContext,
  SessionData,
  
  // Multi-factor authentication
  MfaChallenge,
  MfaVerificationRequest,
  
  // Event tracking
  AuthEvent,
  AuthEventType,
} from '../../lib/types/user-management';

// =============================================================================
// COMPONENT-SPECIFIC AUTHENTICATION TYPES
// =============================================================================

/**
 * Login credentials interface specifically for React Hook Form integration
 * Extends base LoginCredentials with UI-specific properties for the login component
 */
export interface LoginFormCredentials {
  /** Email address or username based on system configuration */
  email?: string;
  username?: string;
  /** User password */
  password: string;
  /** Remember user session across browser sessions */
  rememberMe?: boolean;
  /** Selected authentication service for external providers */
  service?: string;
  /** Two-factor authentication code */
  twoFactorCode?: string;
}

/**
 * Registration details interface with enhanced validation for React Hook Form
 * Supports comprehensive user profile creation with validation feedback
 */
export interface RegistrationFormDetails {
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** Full display name */
  name: string;
  /** Email address for account */
  email: string;
  /** Username for account (optional based on configuration) */
  username?: string;
  /** Password for account */
  password: string;
  /** Password confirmation */
  confirmPassword: string;
  /** Terms of service acceptance */
  acceptTerms: boolean;
  /** Newsletter subscription preference */
  subscribeNewsletter?: boolean;
}

/**
 * Password reset request interface for multi-step password reset workflow
 * Supports both email and username-based password recovery with security questions
 */
export interface PasswordResetRequest {
  /** Email address for password reset */
  email?: string;
  /** Username for password reset */
  username?: string;
  /** Reset verification code */
  code?: string;
  /** New password to set */
  newPassword?: string;
  /** Password confirmation */
  confirmPassword?: string;
  /** Security question for additional verification */
  securityQuestion?: string;
  /** Answer to security question */
  securityAnswer?: string;
  /** Current step in reset process */
  step: 'request' | 'verify' | 'reset' | 'complete';
}

/**
 * Security question interface for enhanced password recovery
 * Provides additional authentication security layer
 */
export interface SecurityQuestionDetails {
  /** Unique identifier for the security question */
  id: string;
  /** The security question text */
  question: string;
  /** User's answer to the security question (hashed for storage) */
  answer?: string;
  /** Whether this question is active */
  isActive: boolean;
  /** Question category for organization */
  category: 'personal' | 'family' | 'education' | 'work' | 'other';
  /** Difficulty level of the question */
  difficulty: 'easy' | 'medium' | 'hard';
}

// =============================================================================
// EXTERNAL AUTHENTICATION PROVIDER TYPES
// =============================================================================

/**
 * OAuth provider configuration for external authentication services
 * Supports major OAuth 2.0 providers with comprehensive configuration options
 */
export interface OAuthProvider {
  /** Unique provider identifier */
  id: string;
  /** Provider name (e.g., 'google', 'microsoft', 'github') */
  name: string;
  /** Display label for UI */
  label: string;
  /** Provider type classification */
  type: 'oauth2' | 'openid_connect';
  /** OAuth client ID */
  clientId: string;
  /** OAuth client secret (server-side only) */
  clientSecret?: string;
  /** Authorization URL for OAuth flow */
  authUrl: string;
  /** Token exchange URL */
  tokenUrl: string;
  /** User profile information URL */
  userInfoUrl?: string;
  /** OAuth scopes to request */
  scopes: string[];
  /** Redirect URI for OAuth callback */
  redirectUri: string;
  /** Additional OAuth parameters */
  additionalParams?: Record<string, string>;
  /** Provider icon for UI display */
  icon?: string;
  /** Provider color theme */
  color?: string;
  /** Whether provider is enabled */
  enabled: boolean;
  /** Provider configuration metadata */
  metadata: {
    /** Whether provider supports PKCE */
    supportsPKCE: boolean;
    /** Whether provider supports refresh tokens */
    supportsRefresh: boolean;
    /** Token endpoint authentication method */
    tokenEndpointAuthMethod: 'client_secret_basic' | 'client_secret_post' | 'none';
  };
}

/**
 * LDAP service configuration for enterprise directory authentication
 * Supports Active Directory and OpenLDAP integration
 */
export interface LDAPService {
  /** Unique service identifier */
  id: string;
  /** Service name for identification */
  name: string;
  /** Display label for UI */
  label: string;
  /** LDAP server hostname or IP address */
  host: string;
  /** LDAP server port (default: 389 for LDAP, 636 for LDAPS) */
  port: number;
  /** Base Distinguished Name for user searches */
  baseDn: string;
  /** LDAP bind user DN for service authentication */
  bindDn?: string;
  /** LDAP bind user password */
  bindPassword?: string;
  /** User search filter template */
  userSearchFilter: string;
  /** User attribute mapping */
  attributeMapping: {
    /** Username attribute */
    username: string;
    /** Email attribute */
    email: string;
    /** First name attribute */
    firstName: string;
    /** Last name attribute */
    lastName: string;
    /** Display name attribute */
    displayName: string;
    /** Group membership attribute */
    groups?: string;
  };
  /** Account suffix for login (e.g., '@domain.com') */
  accountSuffix?: string;
  /** Whether to use TLS encryption */
  useTls: boolean;
  /** Whether to use StartTLS */
  useStartTls: boolean;
  /** Whether to follow LDAP referrals */
  followReferrals: boolean;
  /** Connection timeout in milliseconds */
  timeout: number;
  /** Whether service is enabled */
  enabled: boolean;
  /** Service configuration metadata */
  metadata: {
    /** LDAP server version */
    version: number;
    /** Supported authentication mechanisms */
    authMechanisms: string[];
    /** Whether server supports paging */
    supportsPaging: boolean;
  };
}

/**
 * SAML service configuration for enterprise single sign-on
 * Supports SAML 2.0 authentication workflows
 */
export interface SAMLService {
  /** Unique service identifier */
  id: string;
  /** Service name for identification */
  name: string;
  /** Display label for UI */
  label: string;
  /** SAML entity ID */
  entityId: string;
  /** Single Sign-On URL */
  ssoUrl: string;
  /** Single Logout URL */
  sloUrl?: string;
  /** X.509 certificate for signature verification */
  x509Certificate: string;
  /** Whether to sign authentication requests */
  signRequests: boolean;
  /** Whether assertions must be signed */
  wantAssertionsSigned: boolean;
  /** Whether to request NameID */
  wantNameId: boolean;
  /** Whether to validate XML signatures */
  wantXMLValidation: boolean;
  /** NameID format to request */
  nameIdFormat: 'persistent' | 'transient' | 'email' | 'unspecified';
  /** Attribute mapping for user profile */
  attributeMapping: {
    /** Username attribute */
    username: string;
    /** Email attribute */
    email: string;
    /** First name attribute */
    firstName: string;
    /** Last name attribute */
    lastName: string;
    /** Display name attribute */
    displayName: string;
    /** Role/group attribute */
    roles?: string;
  };
  /** Whether service is enabled */
  enabled: boolean;
  /** Service configuration metadata */
  metadata: {
    /** SAML protocol version */
    protocolVersion: '2.0';
    /** Supported bindings */
    supportedBindings: ('HTTP-POST' | 'HTTP-Redirect')[];
    /** Whether service supports encryption */
    supportsEncryption: boolean;
  };
}

/**
 * Unified external authentication provider interface
 * Provides a common interface for all external authentication services
 */
export interface ExternalAuthProvider {
  /** Provider type */
  type: 'oauth' | 'ldap' | 'saml';
  /** Provider configuration */
  config: OAuthProvider | LDAPService | SAMLService;
  /** Provider status */
  status: 'active' | 'inactive' | 'error' | 'testing';
  /** Last successful authentication timestamp */
  lastUsed?: Date;
  /** Error information if provider is in error state */
  error?: {
    /** Error message */
    message: string;
    /** Error timestamp */
    timestamp: Date;
    /** Error details */
    details?: Record<string, any>;
  };
}

// =============================================================================
// NEXT.JS MIDDLEWARE INTEGRATION TYPES
// =============================================================================

/**
 * Authentication context for React components and Next.js middleware
 * Provides comprehensive authentication state management for the application
 */
export interface AuthContext {
  /** Current user session */
  session: UserSession | null;
  /** Authentication loading state */
  isLoading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether session is being refreshed */
  isRefreshing: boolean;
  /** Authentication error */
  error: AuthenticationError | null;
  /** Available external authentication providers */
  providers: ExternalAuthProvider[];
  /** System authentication configuration */
  config: AuthenticationConfig;
  /** Authentication actions */
  actions: {
    /** Login with credentials */
    login: (credentials: LoginFormCredentials) => Promise<LoginResponse>;
    /** Logout user and clear session */
    logout: () => Promise<void>;
    /** Register new user account */
    register: (details: RegistrationFormDetails) => Promise<ValidationResult<UserSession>>;
    /** Request password reset */
    requestPasswordReset: (request: ForgetPasswordRequest) => Promise<ValidationResult<void>>;
    /** Complete password reset */
    completePasswordReset: (request: PasswordResetRequest) => Promise<ValidationResult<void>>;
    /** Refresh authentication token */
    refreshToken: () => Promise<TokenRefreshResponse>;
    /** Check authentication status */
    checkAuth: () => Promise<boolean>;
    /** Clear authentication error */
    clearError: () => void;
  };
}

/**
 * System authentication configuration
 * Defines authentication behavior and available features
 */
export interface AuthenticationConfig {
  /** Primary login attribute (email or username) */
  loginAttribute: 'email' | 'username';
  /** Whether user registration is enabled */
  allowRegistration: boolean;
  /** Whether password reset is enabled */
  allowPasswordReset: boolean;
  /** Whether remember me functionality is enabled */
  allowRememberMe: boolean;
  /** Whether security questions are enabled */
  securityQuestionsEnabled: boolean;
  /** Whether two-factor authentication is available */
  twoFactorEnabled: boolean;
  /** Whether two-factor authentication is required for admins */
  twoFactorRequiredForAdmins: boolean;
  /** Available external authentication providers */
  externalProviders: string[];
  /** Password policy configuration */
  passwordPolicy: {
    /** Minimum password length */
    minLength: number;
    /** Whether uppercase characters are required */
    requireUppercase: boolean;
    /** Whether lowercase characters are required */
    requireLowercase: boolean;
    /** Whether numeric characters are required */
    requireNumbers: boolean;
    /** Whether special characters are required */
    requireSpecialChars: boolean;
    /** Password expiration in days (0 = no expiration) */
    expirationDays: number;
  };
  /** Rate limiting configuration */
  rateLimiting: {
    /** Maximum login attempts per time window */
    maxLoginAttempts: number;
    /** Time window for login attempts in minutes */
    loginAttemptWindow: number;
    /** Account lockout duration in minutes */
    lockoutDuration: number;
  };
}

// =============================================================================
// COMPONENT UI STATE TYPES
// =============================================================================

/**
 * Login component state interface
 * Manages UI state for the login component with external provider support
 */
export interface LoginComponentState {
  /** Current form data */
  formData: Partial<LoginFormCredentials>;
  /** Form validation errors */
  errors: Record<string, string>;
  /** Whether form is being submitted */
  isSubmitting: boolean;
  /** Whether to show password field */
  showPassword: boolean;
  /** Selected authentication provider */
  selectedProvider?: string;
  /** Whether external providers are visible */
  showExternalProviders: boolean;
  /** Login attempt count */
  attemptCount: number;
  /** Whether account is locked out */
  isLockedOut: boolean;
  /** Lockout expiration timestamp */
  lockoutExpiresAt?: Date;
  /** Two-factor authentication challenge */
  twoFactorChallenge?: {
    /** Challenge type */
    type: 'totp' | 'sms' | 'email';
    /** Challenge ID */
    challengeId: string;
    /** Whether code input is visible */
    showCodeInput: boolean;
  };
}

/**
 * Registration component state interface
 * Manages UI state for the registration component with validation feedback
 */
export interface RegisterComponentState {
  /** Current form data */
  formData: Partial<RegistrationFormDetails>;
  /** Form validation errors */
  errors: Record<string, string>;
  /** Whether form is being submitted */
  isSubmitting: boolean;
  /** Whether passwords are visible */
  showPasswords: boolean;
  /** Password strength indicator */
  passwordStrength: {
    /** Strength score (0-4) */
    score: number;
    /** Strength feedback */
    feedback: string[];
    /** Whether password meets requirements */
    isValid: boolean;
  };
  /** Whether email verification is required */
  requiresEmailVerification: boolean;
  /** Whether email verification was sent */
  verificationSent: boolean;
  /** Current registration step */
  currentStep: 'form' | 'verification' | 'complete';
}

/**
 * Password reset component state interface
 * Manages UI state for the multi-step password reset workflow
 */
export interface PasswordResetComponentState {
  /** Current form data */
  formData: Partial<PasswordResetRequest>;
  /** Form validation errors */
  errors: Record<string, string>;
  /** Whether form is being submitted */
  isSubmitting: boolean;
  /** Current step in reset process */
  currentStep: 'request' | 'verify' | 'reset' | 'complete';
  /** Whether reset code was sent */
  codeSent: boolean;
  /** Code expiration timestamp */
  codeExpiresAt?: Date;
  /** Whether to show new password */
  showNewPassword: boolean;
  /** Whether to show confirm password */
  showConfirmPassword: boolean;
  /** Whether security question is required */
  requiresSecurityQuestion: boolean;
  /** Available security questions */
  securityQuestions: SecurityQuestionDetails[];
}

/**
 * Forgot password component state interface
 * Manages UI state for the initial password reset request
 */
export interface ForgotPasswordComponentState {
  /** Current form data */
  formData: Partial<ForgetPasswordRequest>;
  /** Form validation errors */
  errors: Record<string, string>;
  /** Whether form is being submitted */
  isSubmitting: boolean;
  /** Whether reset email was sent */
  emailSent: boolean;
  /** Email sent timestamp */
  emailSentAt?: Date;
  /** Whether to show resend option */
  canResend: boolean;
  /** Resend cooldown in seconds */
  resendCooldown: number;
}

// =============================================================================
// FORM INTEGRATION TYPES
// =============================================================================

/**
 * Form field error interface for validation feedback
 * Provides comprehensive error information for form fields
 */
export interface FieldError {
  /** Error message */
  message: string;
  /** Error type */
  type: 'required' | 'pattern' | 'minLength' | 'maxLength' | 'custom';
  /** Field value that caused the error */
  value?: any;
  /** Additional error context */
  context?: Record<string, any>;
}

/**
 * Form submission result interface
 * Provides standardized response format for form submissions
 */
export interface FormSubmissionResult<T = any> {
  /** Submission success status */
  success: boolean;
  /** Response data */
  data?: T;
  /** Field-specific errors */
  fieldErrors?: Record<string, FieldError>;
  /** Form-level error message */
  message?: string;
  /** Additional metadata */
  metadata?: {
    /** Submission timestamp */
    timestamp: Date;
    /** Processing duration in milliseconds */
    duration: number;
    /** Request ID for tracking */
    requestId?: string;
  };
}

/**
 * Form configuration interface for React Hook Form integration
 * Provides comprehensive form setup with validation and submission handling
 */
export interface FormConfig<T = any> {
  /** Default form values */
  defaultValues: Partial<T>;
  /** Validation mode */
  mode: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  /** Revalidation mode */
  reValidateMode: 'onChange' | 'onBlur' | 'onSubmit';
  /** Whether to focus on first error */
  shouldFocusError: boolean;
  /** Custom form submission handler */
  onSubmit: (data: T) => Promise<FormSubmissionResult<any>>;
  /** Custom error handler */
  onError?: (errors: Record<string, FieldError>) => void;
  /** Form reset configuration */
  resetOptions?: {
    /** Whether to reset on successful submission */
    resetOnSuccess: boolean;
    /** Values to reset to */
    resetValues?: Partial<T>;
  };
}

// =============================================================================
// UTILITY TYPES AND TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if a provider is an OAuth provider
 */
export function isOAuthProvider(provider: ExternalAuthProvider): provider is { type: 'oauth'; config: OAuthProvider } {
  return provider.type === 'oauth';
}

/**
 * Type guard to check if a provider is an LDAP service
 */
export function isLDAPService(provider: ExternalAuthProvider): provider is { type: 'ldap'; config: LDAPService } {
  return provider.type === 'ldap';
}

/**
 * Type guard to check if a provider is a SAML service
 */
export function isSAMLService(provider: ExternalAuthProvider): provider is { type: 'saml'; config: SAMLService } {
  return provider.type === 'saml';
}

/**
 * Type guard to check if a value is a valid authentication context
 */
export function isAuthContext(value: any): value is AuthContext {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.isAuthenticated === 'boolean' &&
    typeof value.isLoading === 'boolean' &&
    typeof value.actions === 'object'
  );
}

/**
 * Type guard to check if a form submission result is successful
 */
export function isSuccessfulSubmission<T>(result: FormSubmissionResult<T>): result is FormSubmissionResult<T> & { success: true; data: T } {
  return result.success === true && result.data !== undefined;
}

// =============================================================================
// COMPONENT PROP TYPES
// =============================================================================

/**
 * Base props for authentication components
 * Provides common properties for all authentication UI components
 */
export interface AuthComponentProps {
  /** Component CSS class name */
  className?: string;
  /** Component children */
  children?: ReactNode;
  /** Whether component is disabled */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/**
 * Login component props
 * Extends base props with login-specific configuration
 */
export interface LoginComponentProps extends AuthComponentProps {
  /** Initial form values */
  initialValues?: Partial<LoginFormCredentials>;
  /** Whether to show external providers */
  showExternalProviders?: boolean;
  /** Success callback */
  onSuccess?: (result: LoginResponse) => void;
  /** Error callback */
  onError?: (error: AuthenticationError) => void;
  /** Custom form submission handler */
  onSubmit?: (credentials: LoginFormCredentials) => Promise<LoginResponse>;
  /** Whether to redirect after successful login */
  redirectOnSuccess?: boolean;
  /** Redirect URL after successful login */
  redirectTo?: string;
}

/**
 * Registration component props
 * Extends base props with registration-specific configuration
 */
export interface RegisterComponentProps extends AuthComponentProps {
  /** Initial form values */
  initialValues?: Partial<RegistrationFormDetails>;
  /** Whether email verification is required */
  requireEmailVerification?: boolean;
  /** Success callback */
  onSuccess?: (result: ValidationResult<UserSession>) => void;
  /** Error callback */
  onError?: (error: AuthenticationError) => void;
  /** Custom form submission handler */
  onSubmit?: (details: RegistrationFormDetails) => Promise<ValidationResult<UserSession>>;
  /** Whether to redirect after successful registration */
  redirectOnSuccess?: boolean;
  /** Redirect URL after successful registration */
  redirectTo?: string;
}

/**
 * Password reset component props
 * Extends base props with password reset-specific configuration
 */
export interface PasswordResetComponentProps extends AuthComponentProps {
  /** Initial form values */
  initialValues?: Partial<PasswordResetRequest>;
  /** Current step in reset process */
  step?: 'request' | 'verify' | 'reset' | 'complete';
  /** Success callback */
  onSuccess?: (result: ValidationResult<void>) => void;
  /** Error callback */
  onError?: (error: AuthenticationError) => void;
  /** Custom form submission handler */
  onSubmit?: (request: PasswordResetRequest) => Promise<ValidationResult<void>>;
  /** Step change callback */
  onStepChange?: (step: 'request' | 'verify' | 'reset' | 'complete') => void;
}

// =============================================================================
// EXPORT ALL TYPES FOR MODULE CONSUMPTION
// =============================================================================

export type {
  // Component-specific types
  LoginFormCredentials,
  RegistrationFormDetails,
  PasswordResetRequest,
  SecurityQuestionDetails,
  
  // External provider types
  OAuthProvider,
  LDAPService,
  SAMLService,
  ExternalAuthProvider,
  
  // Context and configuration
  AuthContext,
  AuthenticationConfig,
  
  // Component state types
  LoginComponentState,
  RegisterComponentState,
  PasswordResetComponentState,
  ForgotPasswordComponentState,
  
  // Form integration types
  FieldError,
  FormSubmissionResult,
  FormConfig,
  
  // Component props
  AuthComponentProps,
  LoginComponentProps,
  RegisterComponentProps,
  PasswordResetComponentProps,
};