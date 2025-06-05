/**
 * @fileoverview Zod validation schemas for authentication forms
 * 
 * This module provides comprehensive authentication validation schemas for all
 * authentication workflows including login, registration, password reset, and
 * forgot password. Replaces Angular reactive forms validators with type-safe
 * Zod schemas integrated with React Hook Form for optimal performance under 100ms.
 * 
 * Features:
 * - Login form validation with conditional email/username switching
 * - Registration schema with nested profile details validation
 * - Password reset with confirmation matching using Zod refinement
 * - Forgot password with dynamic field switching
 * - LDAP service selection validation for multi-service environments
 * - Password strength validation with 16-character minimum requirement
 * - Confirmation code validation for account recovery workflows
 * - OAuth and SAML integration support
 * 
 * @version 1.0.0
 * @since React 19 / Next.js 15.1 migration
 */

import { z } from 'zod';
import {
  createPasswordSchema,
  createEmailSchema,
  createUsernameSchema,
  createLoginFieldSchema,
  createLdapServiceSchema,
  createConfirmationCodeSchema,
  createPasswordMatchValidator,
  DEFAULT_PASSWORD_CONFIG,
  type LoginValidationMode,
  type LdapServiceConfig,
  type ConfirmationCodeConfig,
  type PasswordStrengthConfig
} from './validators';
import type {
  PerformantZodSchema,
  ZodInferredType
} from '../validation/types';

// =============================================================================
// AUTHENTICATION CONFIGURATION TYPES
// =============================================================================

/**
 * System authentication configuration determining validation behavior.
 * Controls which authentication fields and workflows are available.
 */
export interface AuthSystemConfig {
  /** Primary authentication mode (email, username, or both) */
  readonly loginMode: LoginValidationMode;
  /** Whether user registration is enabled */
  readonly allowRegistration: boolean;
  /** Whether password reset functionality is enabled */
  readonly allowPasswordReset: boolean;
  /** Whether self-service forgot password is enabled */
  readonly allowForgotPassword: boolean;
  /** Available LDAP authentication services */
  readonly ldapServices: LdapServiceConfig[];
  /** Whether OAuth authentication is enabled */
  readonly allowOAuth: boolean;
  /** Whether SAML authentication is enabled */
  readonly allowSAML: boolean;
  /** Allowed email domains for registration */
  readonly allowedEmailDomains?: string[];
  /** Custom password strength requirements */
  readonly passwordConfig?: Partial<PasswordStrengthConfig>;
  /** Whether to require security questions */
  readonly requireSecurityQuestions: boolean;
  /** Confirmation code configuration */
  readonly confirmationCodeConfig?: ConfirmationCodeConfig;
  /** Whether email confirmation is required for registration */
  readonly requireEmailConfirmation: boolean;
}

/**
 * OAuth provider configuration for external authentication.
 * Supports validation of OAuth provider selection and configuration.
 */
export interface OAuthProviderConfig {
  /** Provider identifier (google, github, microsoft, etc.) */
  readonly id: string;
  /** Display name for the OAuth provider */
  readonly name: string;
  /** Whether this provider is currently enabled */
  readonly enabled: boolean;
  /** Provider client ID (if available for validation) */
  readonly clientId?: string;
  /** Supported scopes for this provider */
  readonly scopes?: string[];
}

/**
 * SAML service configuration for enterprise authentication.
 * Supports validation of SAML service selection and configuration.
 */
export interface SAMLServiceConfig {
  /** Service identifier for SAML authentication */
  readonly id: string;
  /** Display name for the SAML service */
  readonly name: string;
  /** Whether this service is currently active */
  readonly active: boolean;
  /** SAML entity ID */
  readonly entityId?: string;
  /** Single Sign-On URL */
  readonly ssoUrl?: string;
}

// =============================================================================
// LOGIN FORM SCHEMAS
// =============================================================================

/**
 * Creates a comprehensive login form validation schema with conditional field switching.
 * Supports email/username authentication, LDAP service selection, and OAuth/SAML integration.
 * 
 * @param config - System authentication configuration
 * @returns Performant Zod schema for login form validation
 * 
 * @example
 * ```typescript
 * const loginSchema = createLoginFormSchema({
 *   loginMode: 'both',
 *   ldapServices: [{ id: 'ad', name: 'Active Directory', active: true }],
 *   allowOAuth: true,
 *   allowSAML: true
 * });
 * 
 * type LoginFormData = z.infer<typeof loginSchema>;
 * ```
 */
export const createLoginFormSchema = (config: Partial<AuthSystemConfig> = {}) => {
  const {
    loginMode = 'email',
    ldapServices = [],
    allowedEmailDomains,
    allowOAuth = false,
    allowSAML = false
  } = config;

  // Base schema object for dynamic field construction
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  // Add conditional login field validation based on system configuration
  if (loginMode === 'email') {
    schemaFields.email = createEmailSchema(allowedEmailDomains);
  } else if (loginMode === 'username') {
    schemaFields.username = createUsernameSchema();
  } else if (loginMode === 'both') {
    // Support both fields with at least one required
    schemaFields.email = createEmailSchema(allowedEmailDomains).optional();
    schemaFields.username = createUsernameSchema().optional();
  }

  // Password is always required for traditional login
  schemaFields.password = z.string()
    .min(1, 'Password is required')
    .max(128, 'Password is too long');

  // Add LDAP service selection if multiple services are available
  if (ldapServices.length > 1) {
    schemaFields.service = createLdapServiceSchema(ldapServices, false);
  } else if (ldapServices.length === 1) {
    // Single service can be pre-selected, but validate if provided
    schemaFields.service = createLdapServiceSchema(ldapServices, false);
  }

  // Add OAuth provider selection if enabled
  if (allowOAuth) {
    schemaFields.oauthProvider = z.string().optional();
  }

  // Add SAML service selection if enabled
  if (allowSAML) {
    schemaFields.samlService = z.string().optional();
  }

  // Remember me option for session persistence
  schemaFields.rememberMe = z.boolean().optional().default(false);

  // Create base schema
  let schema = z.object(schemaFields);

  // Add conditional validation refinements
  if (loginMode === 'both') {
    schema = schema.refine(
      (data) => data.email || data.username,
      {
        message: 'Please provide either an email address or username',
        path: ['email']
      }
    );
  }

  // Add performance metadata
  return Object.assign(schema, {
    maxValidationTime: 100,
    complexityScore: 'medium' as const
  }) as PerformantZodSchema<ZodInferredType<typeof schema>>;
};

/**
 * Simplified login schema for basic email/password authentication.
 * Optimized for standard authentication flows without additional complexity.
 * 
 * @example
 * ```typescript
 * const { register, handleSubmit, formState: { errors } } = useForm({
 *   resolver: zodResolver(LOGIN_FORM_SCHEMA)
 * });
 * ```
 */
export const LOGIN_FORM_SCHEMA = createLoginFormSchema({
  loginMode: 'email',
  ldapServices: [],
  allowOAuth: false,
  allowSAML: false
});

/**
 * Enhanced login schema with LDAP service selection.
 * Supports enterprise authentication with multiple LDAP services.
 */
export const LDAP_LOGIN_FORM_SCHEMA = (ldapServices: LdapServiceConfig[]) =>
  createLoginFormSchema({
    loginMode: 'both',
    ldapServices,
    allowOAuth: false,
    allowSAML: false
  });

// =============================================================================
// REGISTRATION FORM SCHEMAS
// =============================================================================

/**
 * User profile details schema for registration forms.
 * Validates personal information with optional fields based on system configuration.
 */
export const USER_PROFILE_SCHEMA = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  
  displayName: z.string()
    .max(100, 'Display name is too long')
    .optional(),
  
  phone: z.string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
    .optional(),
  
  timezone: z.string()
    .optional(),
  
  locale: z.string()
    .optional()
});

/**
 * Creates a comprehensive registration form validation schema.
 * Includes profile details, password confirmation, and optional security questions.
 * 
 * @param config - System authentication configuration
 * @returns Performant Zod schema for registration form validation
 * 
 * @example
 * ```typescript
 * const registrationSchema = createRegistrationFormSchema({
 *   loginMode: 'email',
 *   allowedEmailDomains: ['company.com'],
 *   requireSecurityQuestions: true,
 *   requireEmailConfirmation: true
 * });
 * ```
 */
export const createRegistrationFormSchema = (config: Partial<AuthSystemConfig> = {}) => {
  const {
    loginMode = 'email',
    allowedEmailDomains,
    passwordConfig,
    requireSecurityQuestions = false,
    requireEmailConfirmation = false,
    confirmationCodeConfig
  } = config;

  // Base schema fields
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  // Add login field based on system configuration
  if (loginMode === 'email' || loginMode === 'both') {
    schemaFields.email = createEmailSchema(allowedEmailDomains);
  }
  
  if (loginMode === 'username' || loginMode === 'both') {
    schemaFields.username = createUsernameSchema();
  }

  // Password fields with confirmation matching
  schemaFields.password = createPasswordSchema(passwordConfig);
  schemaFields.confirmPassword = z.string()
    .min(1, 'Password confirmation is required');

  // User profile information
  schemaFields.profile = USER_PROFILE_SCHEMA;

  // Security questions if required
  if (requireSecurityQuestions) {
    schemaFields.securityQuestion = z.string()
      .min(1, 'Please select a security question');
    schemaFields.securityAnswer = z.string()
      .min(2, 'Security answer must be at least 2 characters')
      .max(100, 'Security answer is too long');
  }

  // Email confirmation code if required
  if (requireEmailConfirmation && confirmationCodeConfig) {
    schemaFields.emailConfirmationCode = createConfirmationCodeSchema(confirmationCodeConfig);
  }

  // Terms and conditions acceptance
  schemaFields.acceptTerms = z.boolean()
    .refine(val => val === true, 'You must accept the terms and conditions');

  // Privacy policy acceptance
  schemaFields.acceptPrivacy = z.boolean()
    .refine(val => val === true, 'You must accept the privacy policy');

  // Marketing communications (optional)
  schemaFields.acceptMarketing = z.boolean().optional().default(false);

  // Create base schema
  let schema = z.object(schemaFields);

  // Add password matching validation
  schema = schema.refine(
    ...createPasswordMatchValidator('password', 'confirmPassword')
  );

  // Add conditional validation for dual login mode
  if (loginMode === 'both') {
    schema = schema.refine(
      (data) => data.email || data.username,
      {
        message: 'Please provide either an email address or username',
        path: ['email']
      }
    );
  }

  // Add performance metadata
  return Object.assign(schema, {
    maxValidationTime: 100,
    complexityScore: 'high' as const
  }) as PerformantZodSchema<ZodInferredType<typeof schema>>;
};

/**
 * Standard registration schema for email-based registration.
 * Includes profile details and password confirmation validation.
 */
export const REGISTRATION_FORM_SCHEMA = createRegistrationFormSchema({
  loginMode: 'email',
  requireSecurityQuestions: false,
  requireEmailConfirmation: false
});

/**
 * Enhanced registration schema with email confirmation.
 * Includes confirmation code validation for email verification.
 */
export const EMAIL_CONFIRMATION_REGISTRATION_SCHEMA = (
  confirmationCodeConfig: ConfirmationCodeConfig
) => createRegistrationFormSchema({
  loginMode: 'email',
  requireEmailConfirmation: true,
  confirmationCodeConfig,
  requireSecurityQuestions: false
});

// =============================================================================
// PASSWORD RESET FORM SCHEMAS
// =============================================================================

/**
 * Creates a password reset form validation schema with confirmation matching.
 * Includes optional confirmation code validation for secure password reset workflows.
 * 
 * @param config - System authentication configuration
 * @returns Performant Zod schema for password reset form validation
 * 
 * @example
 * ```typescript
 * const resetSchema = createPasswordResetFormSchema({
 *   passwordConfig: { minLength: 16, requireSpecialChars: true },
 *   confirmationCodeConfig: { length: 6, format: 'alphanumeric', caseSensitive: false }
 * });
 * ```
 */
export const createPasswordResetFormSchema = (config: Partial<AuthSystemConfig> = {}) => {
  const {
    passwordConfig,
    confirmationCodeConfig
  } = config;

  // Base schema fields
  const schemaFields: Record<string, z.ZodTypeAny> = {
    // Confirmation code (required for password reset)
    confirmationCode: confirmationCodeConfig 
      ? createConfirmationCodeSchema(confirmationCodeConfig)
      : z.string().min(1, 'Confirmation code is required'),
    
    // New password with strength validation
    newPassword: createPasswordSchema(passwordConfig),
    
    // Password confirmation
    confirmPassword: z.string()
      .min(1, 'Password confirmation is required')
  };

  // Create base schema
  let schema = z.object(schemaFields);

  // Add password matching validation using Zod refinement
  schema = schema.refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    }
  );

  // Add performance metadata
  return Object.assign(schema, {
    maxValidationTime: 100,
    complexityScore: 'medium' as const
  }) as PerformantZodSchema<ZodInferredType<typeof schema>>;
};

/**
 * Standard password reset schema with 6-digit confirmation code.
 * Optimized for common password reset workflows.
 */
export const PASSWORD_RESET_FORM_SCHEMA = createPasswordResetFormSchema({
  confirmationCodeConfig: {
    length: 6,
    format: 'alphanumeric',
    caseSensitive: false,
    expirationMinutes: 15
  }
});

/**
 * Secure password reset schema with longer confirmation code.
 * Enhanced security for sensitive environments.
 */
export const SECURE_PASSWORD_RESET_SCHEMA = createPasswordResetFormSchema({
  passwordConfig: {
    ...DEFAULT_PASSWORD_CONFIG,
    minLength: 20,
    requireSpecialChars: true
  },
  confirmationCodeConfig: {
    length: 8,
    format: 'alphanumeric',
    caseSensitive: true,
    expirationMinutes: 10
  }
});

// =============================================================================
// FORGOT PASSWORD FORM SCHEMAS
// =============================================================================

/**
 * Creates a forgot password form validation schema with dynamic field switching.
 * Supports both email and username recovery based on system configuration.
 * 
 * @param config - System authentication configuration
 * @returns Performant Zod schema for forgot password form validation
 * 
 * @example
 * ```typescript
 * const forgotPasswordSchema = createForgotPasswordFormSchema({
 *   loginMode: 'both',
 *   allowedEmailDomains: ['company.com']
 * });
 * ```
 */
export const createForgotPasswordFormSchema = (config: Partial<AuthSystemConfig> = {}) => {
  const {
    loginMode = 'email',
    allowedEmailDomains
  } = config;

  // Dynamic field creation based on login mode
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  if (loginMode === 'email') {
    schemaFields.email = createEmailSchema(allowedEmailDomains);
  } else if (loginMode === 'username') {
    schemaFields.username = createUsernameSchema();
  } else if (loginMode === 'both') {
    // Allow either email or username
    schemaFields.email = createEmailSchema(allowedEmailDomains).optional();
    schemaFields.username = createUsernameSchema().optional();
  }

  // Optional security question for additional verification
  schemaFields.securityAnswer = z.string()
    .max(100, 'Security answer is too long')
    .optional();

  // Create base schema
  let schema = z.object(schemaFields);

  // Add conditional validation for dual mode
  if (loginMode === 'both') {
    schema = schema.refine(
      (data) => data.email || data.username,
      {
        message: 'Please provide either an email address or username',
        path: ['email']
      }
    );
  }

  // Add performance metadata
  return Object.assign(schema, {
    maxValidationTime: 100,
    complexityScore: 'low' as const
  }) as PerformantZodSchema<ZodInferredType<typeof schema>>;
};

/**
 * Standard forgot password schema for email-based recovery.
 * Simple email validation for password recovery requests.
 */
export const FORGOT_PASSWORD_FORM_SCHEMA = createForgotPasswordFormSchema({
  loginMode: 'email'
});

/**
 * Flexible forgot password schema supporting both email and username.
 * Allows users to recover using either identifier.
 */
export const FLEXIBLE_FORGOT_PASSWORD_SCHEMA = createForgotPasswordFormSchema({
  loginMode: 'both'
});

// =============================================================================
// CONFIRMATION CODE FORM SCHEMAS
// =============================================================================

/**
 * Creates a confirmation code validation schema for various verification workflows.
 * Supports email confirmation, password reset, and two-factor authentication codes.
 * 
 * @param config - Confirmation code configuration
 * @param includeResendOption - Whether to include resend functionality
 * @returns Performant Zod schema for confirmation code validation
 * 
 * @example
 * ```typescript
 * const confirmationSchema = createConfirmationCodeFormSchema({
 *   length: 6,
 *   format: 'numeric',
 *   caseSensitive: false
 * }, true);
 * ```
 */
export const createConfirmationCodeFormSchema = (
  config: ConfirmationCodeConfig,
  includeResendOption: boolean = false
) => {
  const schemaFields: Record<string, z.ZodTypeAny> = {
    code: createConfirmationCodeSchema(config)
  };

  // Add resend tracking if enabled
  if (includeResendOption) {
    schemaFields.requestResend = z.boolean().optional().default(false);
  }

  const schema = z.object(schemaFields);

  // Add performance metadata
  return Object.assign(schema, {
    maxValidationTime: 100,
    complexityScore: 'low' as const
  }) as PerformantZodSchema<ZodInferredType<typeof schema>>;
};

/**
 * Standard 6-digit email confirmation code schema.
 * Common pattern for email verification workflows.
 */
export const EMAIL_CONFIRMATION_CODE_SCHEMA = createConfirmationCodeFormSchema({
  length: 6,
  format: 'numeric',
  caseSensitive: false,
  expirationMinutes: 30
}, true);

/**
 * Two-factor authentication code schema.
 * Enhanced security with shorter expiration time.
 */
export const TWO_FACTOR_CODE_SCHEMA = createConfirmationCodeFormSchema({
  length: 6,
  format: 'numeric',
  caseSensitive: false,
  expirationMinutes: 5
}, false);

// =============================================================================
// OAUTH AND SAML INTEGRATION SCHEMAS
// =============================================================================

/**
 * OAuth authentication flow validation schema.
 * Validates OAuth provider selection and callback handling.
 * 
 * @param providers - Available OAuth providers
 * @returns Performant Zod schema for OAuth authentication
 */
export const createOAuthFormSchema = (providers: OAuthProviderConfig[]) => {
  const enabledProviders = providers.filter(p => p.enabled);
  const providerIds = enabledProviders.map(p => p.id);

  const schema = z.object({
    provider: z.string()
      .min(1, 'Please select an OAuth provider')
      .refine(
        (providerId) => providerIds.includes(providerId),
        'Please select a valid OAuth provider'
      ),
    
    // Optional scope specification for advanced flows
    scopes: z.array(z.string()).optional(),
    
    // State parameter for CSRF protection
    state: z.string().optional(),
    
    // Redirect URL for callback handling
    redirectUrl: z.string().url().optional()
  });

  // Add performance metadata
  return Object.assign(schema, {
    maxValidationTime: 100,
    complexityScore: 'low' as const
  }) as PerformantZodSchema<ZodInferredType<typeof schema>>;
};

/**
 * SAML authentication flow validation schema.
 * Validates SAML service selection and assertion handling.
 * 
 * @param services - Available SAML services
 * @returns Performant Zod schema for SAML authentication
 */
export const createSAMLFormSchema = (services: SAMLServiceConfig[]) => {
  const activeServices = services.filter(s => s.active);
  const serviceIds = activeServices.map(s => s.id);

  const schema = z.object({
    service: z.string()
      .min(1, 'Please select a SAML service')
      .refine(
        (serviceId) => serviceIds.includes(serviceId),
        'Please select a valid SAML service'
      ),
    
    // RelayState parameter for return URL
    relayState: z.string().optional(),
    
    // Optional binding specification
    binding: z.enum(['POST', 'Redirect']).optional().default('POST')
  });

  // Add performance metadata
  return Object.assign(schema, {
    maxValidationTime: 100,
    complexityScore: 'low' as const
  }) as PerformantZodSchema<ZodInferredType<typeof schema>>;
};

// =============================================================================
// COMPREHENSIVE AUTHENTICATION SCHEMA FACTORY
// =============================================================================

/**
 * Creates a comprehensive authentication schema supporting all workflows.
 * Factory function that generates appropriate schemas based on system configuration.
 * 
 * @param config - Complete system authentication configuration
 * @returns Object containing all authentication schemas for the system
 * 
 * @example
 * ```typescript
 * const authSchemas = createAuthenticationSchemas({
 *   loginMode: 'both',
 *   allowRegistration: true,
 *   allowPasswordReset: true,
 *   ldapServices: ldapServices,
 *   allowOAuth: true,
 *   allowSAML: false
 * });
 * 
 * // Use specific schemas
 * const loginForm = useForm({
 *   resolver: zodResolver(authSchemas.login)
 * });
 * ```
 */
export const createAuthenticationSchemas = (config: AuthSystemConfig) => {
  const schemas = {
    // Core authentication schemas
    login: createLoginFormSchema(config),
    registration: config.allowRegistration 
      ? createRegistrationFormSchema(config) 
      : null,
    passwordReset: config.allowPasswordReset 
      ? createPasswordResetFormSchema(config) 
      : null,
    forgotPassword: config.allowForgotPassword 
      ? createForgotPasswordFormSchema(config) 
      : null,

    // Confirmation code schemas
    emailConfirmation: config.confirmationCodeConfig 
      ? createConfirmationCodeFormSchema(config.confirmationCodeConfig, true) 
      : null,
    
    // External authentication schemas
    oauth: config.allowOAuth 
      ? (providers: OAuthProviderConfig[]) => createOAuthFormSchema(providers)
      : null,
    saml: config.allowSAML 
      ? (services: SAMLServiceConfig[]) => createSAMLFormSchema(services)
      : null
  };

  return schemas;
};

// =============================================================================
// TYPE EXPORTS FOR FORM DATA INFERENCE
// =============================================================================

/**
 * Inferred TypeScript types for all authentication form data.
 * Provides compile-time type safety for form handling.
 */
export type LoginFormData = ZodInferredType<typeof LOGIN_FORM_SCHEMA>;
export type RegistrationFormData = ZodInferredType<typeof REGISTRATION_FORM_SCHEMA>;
export type PasswordResetFormData = ZodInferredType<typeof PASSWORD_RESET_FORM_SCHEMA>;
export type ForgotPasswordFormData = ZodInferredType<typeof FORGOT_PASSWORD_FORM_SCHEMA>;
export type EmailConfirmationFormData = ZodInferredType<typeof EMAIL_CONFIRMATION_CODE_SCHEMA>;
export type UserProfileData = ZodInferredType<typeof USER_PROFILE_SCHEMA>;

/**
 * Configuration types for schema creation.
 * Used for dynamic schema generation based on system settings.
 */
export type {
  AuthSystemConfig,
  OAuthProviderConfig,
  SAMLServiceConfig,
  LoginValidationMode,
  LdapServiceConfig,
  ConfirmationCodeConfig,
  PasswordStrengthConfig
};

/**
 * Re-export validation utilities for convenient access.
 * Provides access to all authentication validation functions.
 */
export {
  createPasswordSchema,
  createEmailSchema,
  createUsernameSchema,
  createPasswordMatchValidator,
  DEFAULT_PASSWORD_CONFIG
} from './validators';