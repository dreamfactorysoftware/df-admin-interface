/**
 * Authentication Schema Validation for DreamFactory Admin Interface
 * 
 * Comprehensive Zod schema definitions for all authentication flows
 * including login, registration, password reset, and profile management.
 * 
 * Features:
 * - React Hook Form integration with type-safe validation
 * - Real-time validation with performance under 100ms requirement
 * - WCAG 2.1 AA compliant error messaging
 * - System configuration-aware field validation
 * - Enterprise-grade security validation patterns
 * 
 * @fileoverview Zod validation schemas for authentication workflows
 * @version 1.0.0
 * @see Technical Specification Section 4.2 - ERROR HANDLING AND VALIDATION
 * @see Technical Specification Section React/Next.js Integration Requirements
 */

import { z } from 'zod';

// =============================================================================
// VALIDATION CONSTANTS AND UTILITIES
// =============================================================================

/**
 * Authentication validation constants
 * Configurable thresholds for security compliance
 */
export const AUTH_VALIDATION_CONSTANTS = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 255,
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 100,
  DISPLAY_NAME_MAX_LENGTH: 255,
} as const;

/**
 * Regular expression patterns for validation
 * WCAG 2.1 AA compliant error messages with clear instructions
 */
export const VALIDATION_PATTERNS = {
  // Email validation - RFC 5322 compliant
  EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  
  // Username validation - alphanumeric and common special characters
  USERNAME: /^[a-zA-Z0-9._-]+$/,
  
  // Name validation - letters, spaces, hyphens, apostrophes
  NAME: /^[a-zA-Z\s'-]+$/,
  
  // Strong password validation
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
} as const;

/**
 * Custom validation error messages
 * Provides clear, actionable feedback for users
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  EMAIL_REQUIRED: 'Email address is required',
  USERNAME_REQUIRED: 'Username is required',
  USERNAME_MIN_LENGTH: `Username must be at least ${AUTH_VALIDATION_CONSTANTS.USERNAME_MIN_LENGTH} characters`,
  USERNAME_MAX_LENGTH: `Username must be less than ${AUTH_VALIDATION_CONSTANTS.USERNAME_MAX_LENGTH} characters`,
  USERNAME_PATTERN: 'Username can only contain letters, numbers, dots, underscores, and hyphens',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN_LENGTH: `Password must be at least ${AUTH_VALIDATION_CONSTANTS.PASSWORD_MIN_LENGTH} characters`,
  PASSWORD_CONFIRMATION_REQUIRED: 'Password confirmation is required',
  PASSWORD_CONFIRMATION_MISMATCH: 'Passwords do not match',
  FIRST_NAME_REQUIRED: 'First name is required',
  FIRST_NAME_PATTERN: 'First name can only contain letters, spaces, hyphens, and apostrophes',
  LAST_NAME_REQUIRED: 'Last name is required',
  LAST_NAME_PATTERN: 'Last name can only contain letters, spaces, hyphens, and apostrophes',
  DISPLAY_NAME_REQUIRED: 'Display name is required',
  SECURITY_QUESTION_REQUIRED: 'Security question is required',
  SECURITY_ANSWER_REQUIRED: 'Security answer is required',
} as const;

// =============================================================================
// BASE FIELD SCHEMAS
// =============================================================================

/**
 * Email field validation schema
 * Supports both required and optional email scenarios
 */
export const emailSchema = z
  .string()
  .regex(VALIDATION_PATTERNS.EMAIL, VALIDATION_MESSAGES.EMAIL_INVALID)
  .min(1, VALIDATION_MESSAGES.EMAIL_REQUIRED);

/**
 * Optional email field validation schema
 * Used when email is not the primary login attribute
 */
export const optionalEmailSchema = z
  .string()
  .regex(VALIDATION_PATTERNS.EMAIL, VALIDATION_MESSAGES.EMAIL_INVALID)
  .or(z.literal(''));

/**
 * Username field validation schema
 * Configurable validation based on system requirements
 */
export const usernameSchema = z
  .string()
  .min(AUTH_VALIDATION_CONSTANTS.USERNAME_MIN_LENGTH, VALIDATION_MESSAGES.USERNAME_MIN_LENGTH)
  .max(AUTH_VALIDATION_CONSTANTS.USERNAME_MAX_LENGTH, VALIDATION_MESSAGES.USERNAME_MAX_LENGTH)
  .regex(VALIDATION_PATTERNS.USERNAME, VALIDATION_MESSAGES.USERNAME_PATTERN);

/**
 * Optional username field validation schema
 * Used when username is not the primary login attribute
 */
export const optionalUsernameSchema = z
  .string()
  .min(AUTH_VALIDATION_CONSTANTS.USERNAME_MIN_LENGTH, VALIDATION_MESSAGES.USERNAME_MIN_LENGTH)
  .max(AUTH_VALIDATION_CONSTANTS.USERNAME_MAX_LENGTH, VALIDATION_MESSAGES.USERNAME_MAX_LENGTH)
  .regex(VALIDATION_PATTERNS.USERNAME, VALIDATION_MESSAGES.USERNAME_PATTERN)
  .or(z.literal(''));

/**
 * Password field validation schema
 * Enforces minimum security requirements
 */
export const passwordSchema = z
  .string()
  .min(AUTH_VALIDATION_CONSTANTS.PASSWORD_MIN_LENGTH, VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH)
  .max(AUTH_VALIDATION_CONSTANTS.PASSWORD_MAX_LENGTH, 'Password is too long');

/**
 * Name field validation schema
 * Used for first name, last name validation
 */
export const nameSchema = z
  .string()
  .min(AUTH_VALIDATION_CONSTANTS.NAME_MIN_LENGTH, VALIDATION_MESSAGES.REQUIRED)
  .max(AUTH_VALIDATION_CONSTANTS.NAME_MAX_LENGTH, 'Name is too long')
  .regex(VALIDATION_PATTERNS.NAME, 'Name can only contain letters, spaces, hyphens, and apostrophes');

/**
 * Display name field validation schema
 * More flexible than regular name fields
 */
export const displayNameSchema = z
  .string()
  .min(AUTH_VALIDATION_CONSTANTS.NAME_MIN_LENGTH, VALIDATION_MESSAGES.DISPLAY_NAME_REQUIRED)
  .max(AUTH_VALIDATION_CONSTANTS.DISPLAY_NAME_MAX_LENGTH, 'Display name is too long');

// =============================================================================
// AUTHENTICATION FORM SCHEMAS
// =============================================================================

/**
 * Login credentials schema with conditional validation
 * Supports both email and username-based authentication
 */
export const loginCredentialsSchema = z
  .object({
    email: z.string().optional(),
    username: z.string().optional(),
    password: passwordSchema,
    rememberMe: z.boolean().optional(),
    service: z.string().optional(),
  })
  .refine(
    (data) => data.email || data.username,
    {
      message: 'Either email or username is required',
      path: ['email'],
    }
  );

/**
 * Registration schema with nested profile details
 * Matches the Angular FormGroup structure for seamless migration
 */
export const registrationSchema = z.object({
  profileDetailsGroup: z.object({
    username: z.string(),
    email: z.string(),
    firstName: nameSchema.refine(
      (val) => val.trim().length > 0,
      { message: VALIDATION_MESSAGES.FIRST_NAME_REQUIRED }
    ),
    lastName: nameSchema.refine(
      (val) => val.trim().length > 0,
      { message: VALIDATION_MESSAGES.LAST_NAME_REQUIRED }
    ),
    name: displayNameSchema.refine(
      (val) => val.trim().length > 0,
      { message: VALIDATION_MESSAGES.DISPLAY_NAME_REQUIRED }
    ),
  }),
});

/**
 * Dynamic registration schema factory
 * Creates validation schema based on system configuration
 * 
 * @param loginAttribute - 'email' or 'username' from system config
 * @returns Zod schema with appropriate required field validation
 */
export function createRegistrationSchema(loginAttribute: 'email' | 'username' = 'email') {
  return z.object({
    profileDetailsGroup: z.object({
      username: loginAttribute === 'username' 
        ? usernameSchema.refine(
            (val) => val.trim().length > 0,
            { message: VALIDATION_MESSAGES.USERNAME_REQUIRED }
          )
        : optionalUsernameSchema,
      email: loginAttribute === 'email'
        ? emailSchema
        : optionalEmailSchema,
      firstName: nameSchema.refine(
        (val) => val.trim().length > 0,
        { message: VALIDATION_MESSAGES.FIRST_NAME_REQUIRED }
      ),
      lastName: nameSchema.refine(
        (val) => val.trim().length > 0,
        { message: VALIDATION_MESSAGES.LAST_NAME_REQUIRED }
      ),
      name: displayNameSchema.refine(
        (val) => val.trim().length > 0,
        { message: VALIDATION_MESSAGES.DISPLAY_NAME_REQUIRED }
      ),
    }),
  });
}

/**
 * Forgot password schema with conditional validation
 * Supports both email and username-based recovery
 */
export const forgotPasswordSchema = z
  .object({
    email: z.string().optional(),
    username: z.string().optional(),
  })
  .refine(
    (data) => data.email || data.username,
    {
      message: 'Either email or username is required',
      path: ['email'],
    }
  );

/**
 * Dynamic forgot password schema factory
 * Creates validation schema based on system configuration
 * 
 * @param loginAttribute - 'email' or 'username' from system config
 * @returns Zod schema with appropriate field validation
 */
export function createForgotPasswordSchema(loginAttribute: 'email' | 'username' = 'email') {
  if (loginAttribute === 'username') {
    return z.object({
      username: usernameSchema.refine(
        (val) => val.trim().length > 0,
        { message: VALIDATION_MESSAGES.USERNAME_REQUIRED }
      ),
      email: optionalEmailSchema,
    });
  }

  return z.object({
    email: emailSchema,
    username: optionalUsernameSchema,
  });
}

/**
 * Password reset schema with confirmation validation
 * Includes real-time password matching validation
 */
export const passwordResetSchema = z
  .object({
    email: optionalEmailSchema,
    username: optionalUsernameSchema,
    code: z.string().min(1, 'Verification code is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, VALIDATION_MESSAGES.PASSWORD_CONFIRMATION_REQUIRED),
    securityQuestion: z.string().optional(),
    securityAnswer: z.string().optional(),
  })
  .refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: VALIDATION_MESSAGES.PASSWORD_CONFIRMATION_MISMATCH,
      path: ['confirmPassword'],
    }
  );

/**
 * Update password schema for authenticated users
 * Requires current password verification
 */
export const updatePasswordSchema = z
  .object({
    oldPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, VALIDATION_MESSAGES.PASSWORD_CONFIRMATION_REQUIRED),
  })
  .refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: VALIDATION_MESSAGES.PASSWORD_CONFIRMATION_MISMATCH,
      path: ['confirmPassword'],
    }
  )
  .refine(
    (data) => data.oldPassword !== data.newPassword,
    {
      message: 'New password must be different from current password',
      path: ['newPassword'],
    }
  );

/**
 * Security question schema for additional verification
 * Used in password recovery workflows
 */
export const securityQuestionSchema = z.object({
  securityQuestion: z.string().min(1, VALIDATION_MESSAGES.SECURITY_QUESTION_REQUIRED),
  securityAnswer: z.string().min(1, VALIDATION_MESSAGES.SECURITY_ANSWER_REQUIRED),
});

// =============================================================================
// TYPE EXPORTS FOR REACT HOOK FORM INTEGRATION
// =============================================================================

/**
 * TypeScript types derived from Zod schemas
 * Ensures type safety across React Hook Form implementations
 */

export type LoginCredentialsFormData = z.infer<typeof loginCredentialsSchema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;
export type SecurityQuestionFormData = z.infer<typeof securityQuestionSchema>;

/**
 * Profile details nested form data type
 * Extracted for easier component prop typing
 */
export type ProfileDetailsFormData = RegistrationFormData['profileDetailsGroup'];

// =============================================================================
// SCHEMA FACTORY UTILITIES
// =============================================================================

/**
 * Creates a complete authentication schema set based on system configuration
 * Provides all schemas needed for authentication workflows
 * 
 * @param loginAttribute - 'email' or 'username' from system config
 * @returns Object containing all configured authentication schemas
 */
export function createAuthSchemas(loginAttribute: 'email' | 'username' = 'email') {
  return {
    login: loginCredentialsSchema,
    registration: createRegistrationSchema(loginAttribute),
    forgotPassword: createForgotPasswordSchema(loginAttribute),
    passwordReset: passwordResetSchema,
    updatePassword: updatePasswordSchema,
    securityQuestion: securityQuestionSchema,
  };
}

/**
 * Validates field requirements based on system configuration
 * Helper function for conditional field validation
 * 
 * @param loginAttribute - 'email' or 'username' from system config
 * @returns Object with field requirement flags
 */
export function getFieldRequirements(loginAttribute: 'email' | 'username' = 'email') {
  return {
    emailRequired: loginAttribute === 'email',
    usernameRequired: loginAttribute === 'username',
    emailOptional: loginAttribute === 'username',
    usernameOptional: loginAttribute === 'email',
  };
}

// Export commonly used schemas as defaults
export {
  loginCredentialsSchema as LoginSchema,
  registrationSchema as RegistrationSchema,
  forgotPasswordSchema as ForgotPasswordSchema,
  passwordResetSchema as PasswordResetSchema,
  updatePasswordSchema as UpdatePasswordSchema,
};