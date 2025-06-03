/**
 * User Management Authentication Types
 * 
 * TypeScript type definitions for authentication workflows including user credentials,
 * registration details, password reset forms, security questions, and OAuth providers.
 * Provides strongly-typed interfaces that ensure type safety across all authentication
 * components and replace Angular's type definitions with React/Next.js compatible interfaces.
 * 
 * Key Features:
 * - TypeScript 5.8+ static typing for React 19 compatibility
 * - Zod schema validators integrated with React Hook Form for all user inputs
 * - Type safety throughout authentication workflows
 * - Next.js middleware integration support
 * - OAuth and LDAP service type definitions
 * - Real-time validation under 100ms requirement compliance
 */

import { z } from 'zod';

// ============================================================================
// Login Credentials Interface
// ============================================================================

/**
 * Login credentials interface replacing Angular authentication types per React/Next.js Integration Requirements
 * Supports multiple authentication methods including username/email, LDAP, and OAuth providers
 */
export interface LoginCredentials {
  /** Username for authentication (alternative to email) */
  username?: string;
  /** Email address for authentication (alternative to username) */
  email?: string;
  /** User password - required for all authentication methods */
  password: string;
  /** Remember me option for extended session duration */
  rememberMe?: boolean;
  /** Service provider for LDAP authentication */
  service?: string;
  /** LDAP provider selection for multi-provider environments */
  ldapProvider?: string;
  /** Authentication method type */
  loginAttribute?: 'email' | 'username';
}

/**
 * Zod schema for login credentials validation with React Hook Form integration
 * Provides real-time validation under 100ms requirement
 */
export const LoginCredentialsSchema = z.object({
  username: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  rememberMe: z.boolean().optional().default(false),
  service: z.string().optional(),
  ldapProvider: z.string().optional(),
  loginAttribute: z.enum(['email', 'username']).optional().default('email'),
}).refine((data) => {
  // Ensure either username or email is provided based on loginAttribute
  if (data.loginAttribute === 'email') {
    return !!data.email;
  } else {
    return !!data.username;
  }
}, {
  message: 'Either email or username is required',
  path: ['email'],
});

// ============================================================================
// Registration Details Interface
// ============================================================================

/**
 * Registration details interface with Zod schema compatibility for React Hook Form validation
 * Supports comprehensive user registration with profile management
 */
export interface RegisterDetails {
  /** User's email address - required for registration */
  email: string;
  /** Username for the account */
  username?: string;
  /** First name of the user */
  firstName: string;
  /** Last name of the user */
  lastName: string;
  /** Full display name */
  fullName?: string;
  /** User's password */
  password: string;
  /** Password confirmation for validation */
  confirmPassword: string;
  /** Phone number (optional) */
  phone?: string;
  /** Security question for password recovery */
  securityQuestion?: string;
  /** Answer to security question */
  securityAnswer?: string;
  /** Default application ID for user */
  defaultAppId?: number;
  /** Terms of service acceptance */
  acceptTerms: boolean;
  /** Newsletter subscription opt-in */
  subscribeNewsletter?: boolean;
}

/**
 * Zod schema for registration details validation with React Hook Form integration
 * Ensures comprehensive validation for user registration workflows
 */
export const RegisterDetailsSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .optional(),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  fullName: z.string().optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
    .optional(),
  securityQuestion: z.string().max(255, 'Security question must be less than 255 characters').optional(),
  securityAnswer: z.string().max(255, 'Security answer must be less than 255 characters').optional(),
  defaultAppId: z.number().int().positive().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms of service to register',
  }),
  subscribeNewsletter: z.boolean().optional().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((data) => {
  // Generate fullName if not provided
  if (!data.fullName) {
    data.fullName = `${data.firstName} ${data.lastName}`.trim();
  }
  return true;
});

// ============================================================================
// Password Reset Interfaces
// ============================================================================

/**
 * Password reset request interface for password workflows
 * Supports both email and username-based password reset flows
 */
export interface PasswordResetRequest {
  /** Email address for password reset */
  email?: string;
  /** Username for password reset */
  username?: string;
  /** Login attribute type determining reset method */
  loginAttribute: 'email' | 'username';
  /** Security question answer (if required) */
  securityAnswer?: string;
}

/**
 * Password reset form data interface for completing password reset
 */
export interface PasswordResetForm {
  /** Email address or username */
  identifier: string;
  /** Reset code from email/SMS */
  code: string;
  /** New password */
  newPassword: string;
  /** Confirm new password */
  confirmPassword: string;
  /** Whether this is an admin reset */
  isAdmin?: boolean;
}

/**
 * Zod schema for password reset request validation
 */
export const PasswordResetRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address').optional(),
  username: z.string().min(1, 'Username is required').optional(),
  loginAttribute: z.enum(['email', 'username']),
  securityAnswer: z.string().min(1, 'Security answer is required').optional(),
}).refine((data) => {
  if (data.loginAttribute === 'email') {
    return !!data.email;
  } else {
    return !!data.username;
  }
}, {
  message: 'Either email or username is required',
  path: ['email'],
});

/**
 * Zod schema for password reset form validation
 */
export const PasswordResetFormSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  code: z.string()
    .min(4, 'Reset code must be at least 4 characters')
    .max(10, 'Reset code must be less than 10 characters'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  isAdmin: z.boolean().optional().default(false),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ============================================================================
// Security Question Interface
// ============================================================================

/**
 * Security question interface for password workflows
 * Supports predefined and custom security questions
 */
export interface SecurityQuestion {
  /** Unique identifier for the security question */
  id: string;
  /** The security question text */
  question: string;
  /** Whether this is a custom question */
  isCustom?: boolean;
  /** Category of the security question */
  category?: 'personal' | 'family' | 'education' | 'other';
}

/**
 * Security question answer interface
 */
export interface SecurityQuestionAnswer {
  /** Reference to security question */
  questionId: string;
  /** User's answer to the security question */
  answer: string;
}

/**
 * Zod schema for security question answer validation
 */
export const SecurityQuestionAnswerSchema = z.object({
  questionId: z.string().min(1, 'Security question is required'),
  answer: z.string()
    .min(1, 'Security answer is required')
    .max(255, 'Security answer must be less than 255 characters'),
});

// ============================================================================
// OAuth Provider Types
// ============================================================================

/**
 * OAuth provider configuration for external authentication
 * Supports multiple OAuth 2.0 providers including Google, Microsoft, GitHub, etc.
 */
export interface OAuthProvider {
  /** Unique provider identifier */
  id: string;
  /** Display name for the provider */
  name: string;
  /** Provider type (google, microsoft, github, etc.) */
  type: 'google' | 'microsoft' | 'github' | 'facebook' | 'linkedin' | 'custom';
  /** OAuth 2.0 client ID */
  clientId: string;
  /** OAuth 2.0 authorization URL */
  authUrl: string;
  /** OAuth 2.0 token URL */
  tokenUrl: string;
  /** OAuth 2.0 scopes requested */
  scopes: string[];
  /** Provider icon URL */
  iconUrl?: string;
  /** Whether provider is enabled */
  enabled: boolean;
  /** Additional provider configuration */
  config?: Record<string, any>;
}

/**
 * OAuth callback data interface for processing OAuth responses
 */
export interface OAuthCallbackData {
  /** Authorization code from OAuth provider */
  code: string;
  /** State parameter for CSRF protection */
  state: string;
  /** OAuth token (if provided directly) */
  oauthToken?: string;
  /** Provider identifier */
  provider: string;
  /** Error code (if authentication failed) */
  error?: string;
  /** Error description */
  errorDescription?: string;
}

// ============================================================================
// LDAP Service Types
// ============================================================================

/**
 * LDAP service configuration for directory-based authentication
 * Supports Active Directory, OpenLDAP, and other LDAP providers
 */
export interface LDAPService {
  /** Unique LDAP service identifier */
  id: string;
  /** Display name for the LDAP service */
  name: string;
  /** LDAP server host */
  host: string;
  /** LDAP server port */
  port: number;
  /** Base DN for user searches */
  baseDn: string;
  /** Username attribute in LDAP */
  usernameAttribute: string;
  /** Email attribute in LDAP */
  emailAttribute: string;
  /** First name attribute in LDAP */
  firstNameAttribute: string;
  /** Last name attribute in LDAP */
  lastNameAttribute: string;
  /** Whether to use SSL/TLS */
  useSSL: boolean;
  /** Whether to use StartTLS */
  useStartTLS: boolean;
  /** Service account DN */
  serviceAccountDn?: string;
  /** Service account password */
  serviceAccountPassword?: string;
  /** Whether service is enabled */
  enabled: boolean;
  /** Additional LDAP configuration */
  options?: Record<string, any>;
}

// ============================================================================
// User Session and Auth Context
// ============================================================================

/**
 * User session interface for Next.js middleware integration
 * Supports both client and server-side session management
 */
export interface UserSession {
  /** Session token (JWT) */
  sessionToken: string;
  /** User ID */
  userId: number;
  /** User email */
  email: string;
  /** User's full name */
  name: string;
  /** Whether user is system administrator */
  isSysAdmin: boolean;
  /** Whether user is root administrator */
  isRootAdmin: boolean;
  /** User's role ID */
  roleId: number;
  /** Session expiration timestamp */
  expiresAt: number;
  /** Session creation timestamp */
  createdAt: number;
  /** Last activity timestamp */
  lastActivity: number;
  /** Session metadata */
  metadata?: Record<string, any>;
}

/**
 * Authentication context interface for React context providers
 * Provides authentication state management throughout the application
 */
export interface AuthContext {
  /** Current user session */
  session: UserSession | null;
  /** Authentication loading state */
  isLoading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Authentication error state */
  error: string | null;
  /** Available OAuth providers */
  oauthProviders: OAuthProvider[];
  /** Available LDAP services */
  ldapServices: LDAPService[];
  /** Login function */
  login: (credentials: LoginCredentials) => Promise<void>;
  /** Register function */
  register: (details: RegisterDetails) => Promise<void>;
  /** Logout function */
  logout: () => Promise<void>;
  /** Password reset request function */
  requestPasswordReset: (request: PasswordResetRequest) => Promise<void>;
  /** Password reset completion function */
  resetPassword: (form: PasswordResetForm) => Promise<void>;
  /** Session refresh function */
  refreshSession: () => Promise<void>;
  /** Clear error function */
  clearError: () => void;
}

/**
 * Zod schema for user session validation
 */
export const UserSessionSchema = z.object({
  sessionToken: z.string().min(1, 'Session token is required'),
  userId: z.number().int().positive('User ID must be a positive integer'),
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'User name is required'),
  isSysAdmin: z.boolean(),
  isRootAdmin: z.boolean(),
  roleId: z.number().int().positive('Role ID must be a positive integer'),
  expiresAt: z.number().int().positive('Expiration timestamp must be positive'),
  createdAt: z.number().int().positive('Creation timestamp must be positive'),
  lastActivity: z.number().int().positive('Last activity timestamp must be positive'),
  metadata: z.record(z.any()).optional(),
});

// ============================================================================
// Form State Types
// ============================================================================

/**
 * Form state type for authentication forms
 * Provides loading, error, and success state management
 */
export interface AuthFormState {
  /** Whether form is submitting */
  isSubmitting: boolean;
  /** Form error message */
  error: string | null;
  /** Form success message */
  success: string | null;
  /** Form completion status */
  isComplete: boolean;
}

/**
 * Alert message interface for authentication feedback
 */
export interface AuthAlert {
  /** Alert type */
  type: 'success' | 'error' | 'warning' | 'info';
  /** Alert message */
  message: string;
  /** Alert title (optional) */
  title?: string;
  /** Whether alert is dismissible */
  dismissible?: boolean;
  /** Auto-dismiss timeout in milliseconds */
  autoHide?: number;
}

// ============================================================================
// Type Exports
// ============================================================================

// Re-export all types for convenient importing
export type {
  LoginCredentials,
  RegisterDetails,
  PasswordResetRequest,
  PasswordResetForm,
  SecurityQuestion,
  SecurityQuestionAnswer,
  OAuthProvider,
  OAuthCallbackData,
  LDAPService,
  UserSession,
  AuthContext,
  AuthFormState,
  AuthAlert,
};

// Re-export all schemas for validation
export {
  LoginCredentialsSchema,
  RegisterDetailsSchema,
  PasswordResetRequestSchema,
  PasswordResetFormSchema,
  SecurityQuestionAnswerSchema,
  UserSessionSchema,
};

// Default export for the module
export default {
  // Types
  LoginCredentials,
  RegisterDetails,
  PasswordResetRequest,
  PasswordResetForm,
  SecurityQuestion,
  SecurityQuestionAnswer,
  OAuthProvider,
  OAuthCallbackData,
  LDAPService,
  UserSession,
  AuthContext,
  AuthFormState,
  AuthAlert,
  
  // Schemas
  LoginCredentialsSchema,
  RegisterDetailsSchema,
  PasswordResetRequestSchema,
  PasswordResetFormSchema,
  SecurityQuestionAnswerSchema,
  UserSessionSchema,
};