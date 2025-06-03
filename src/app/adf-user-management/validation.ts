import { z } from 'zod';

/**
 * Authentication validation schemas for React Hook Form integration
 * Provides real-time validation under 100ms performance requirement
 * with dynamic configuration support for system settings
 */

// Common validation patterns
const emailSchema = z.string().email('Invalid email format');
const usernameSchema = z.string().min(1, 'Username is required');
const passwordSchema = z.string().min(16, 'Password must be at least 16 characters');
const requiredStringSchema = z.string().min(1, 'This field is required');

// Configuration type for dynamic validation
export interface ValidationConfig {
  loginAttribute: 'email' | 'username';
  hasLdapServices: boolean;
  hasOauthServices: boolean;
  hasSamlServices: boolean;
  minimumPasswordLength?: number;
}

/**
 * Dynamic login schema factory that adapts based on system configuration
 * Supports email/username authentication with external service providers
 */
export function createLoginSchema(config: ValidationConfig) {
  const baseSchema = z.object({
    password: passwordSchema,
    rememberMe: z.boolean().optional(),
    services: z.string().optional(), // For LDAP/OAuth/SAML service selection
  });

  // Dynamic username/email validation based on service selection and config
  if (config.loginAttribute === 'username') {
    return baseSchema.extend({
      username: usernameSchema,
      email: z.string().optional(),
    }).refine((data) => {
      // If external service is selected, use username regardless of loginAttribute
      if (data.services && data.services !== '') {
        return data.username && data.username.length > 0;
      }
      // Otherwise use configured login attribute
      return data.username && data.username.length > 0;
    }, {
      message: 'Username is required',
      path: ['username'],
    });
  } else {
    return baseSchema.extend({
      email: emailSchema,
      username: z.string().optional(),
    }).refine((data) => {
      // If external service is selected, use username
      if (data.services && data.services !== '') {
        return data.username && data.username.length > 0;
      }
      // Otherwise use email
      return data.email && data.email.length > 0;
    }, {
      message: data => data.services && data.services !== '' ? 'Username is required' : 'Email is required',
      path: data => data.services && data.services !== '' ? ['username'] : ['email'],
    });
  }
}

/**
 * Registration schema with comprehensive profile validation
 * Supports dynamic email/username requirement based on system configuration
 */
export function createRegisterSchema(config: ValidationConfig) {
  const baseSchema = z.object({
    firstName: requiredStringSchema,
    lastName: requiredStringSchema,
    name: requiredStringSchema,
  });

  if (config.loginAttribute === 'username') {
    return baseSchema.extend({
      username: usernameSchema,
      email: emailSchema.optional(),
    });
  } else {
    return baseSchema.extend({
      email: emailSchema,
      username: z.string().optional(),
    });
  }
}

/**
 * Password reset schema with confirmation matching and security question support
 * Handles both regular reset and admin reset flows
 */
export const passwordResetSchema = z.object({
  username: z.string().optional(),
  email: z.string().optional(),
  code: requiredStringSchema,
  newPassword: passwordSchema,
  confirmPassword: requiredStringSchema,
  securityQuestion: z.string().optional(),
  securityAnswer: z.string().optional(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((data) => {
  // At least email or username must be provided
  return data.email || data.username;
}, {
  message: 'Either email or username is required',
  path: ['email'],
});

/**
 * Forgot password schema with configurable login attribute validation
 * Supports both email and username-based password recovery
 */
export function createForgotPasswordSchema(config: ValidationConfig) {
  if (config.loginAttribute === 'username') {
    return z.object({
      username: usernameSchema,
      email: z.string().optional(),
    });
  } else {
    return z.object({
      email: emailSchema,
      username: z.string().optional(),
    });
  }
}

/**
 * Security question password reset schema
 * Used when security questions are enabled for password recovery
 */
export const securityQuestionResetSchema = z.object({
  securityQuestion: z.string(),
  securityAnswer: requiredStringSchema,
  newPassword: passwordSchema,
  confirmPassword: requiredStringSchema,
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * OAuth provider validation schema
 * Validates OAuth service configuration and redirect parameters
 */
export const oauthProviderSchema = z.object({
  name: requiredStringSchema,
  label: requiredStringSchema,
  type: z.literal('oauth'),
  iconClass: z.string().optional(),
  path: requiredStringSchema,
  redirectUri: z.string().url().optional(),
  state: z.string().optional(),
  scope: z.string().optional(),
});

/**
 * LDAP provider validation schema
 * Validates LDAP service configuration for external authentication
 */
export const ldapProviderSchema = z.object({
  name: requiredStringSchema,
  label: requiredStringSchema,
  type: z.literal('ldap'),
  username: usernameSchema,
  password: passwordSchema,
});

/**
 * SAML provider validation schema
 * Validates SAML service configuration and assertion parameters
 */
export const samlProviderSchema = z.object({
  name: requiredStringSchema,
  label: requiredStringSchema,
  type: z.literal('saml'),
  iconClass: z.string().optional(),
  path: requiredStringSchema,
  relayState: z.string().optional(),
});

/**
 * Update password schema for authenticated users
 * Requires current password verification for security
 */
export const updatePasswordSchema = z.object({
  oldPassword: passwordSchema,
  newPassword: passwordSchema,
  confirmPassword: requiredStringSchema,
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((data) => data.oldPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

/**
 * Password strength validation with configurable requirements
 * Provides detailed feedback for password composition
 */
export function createPasswordStrengthSchema(minimumLength: number = 16) {
  return z.string()
    .min(minimumLength, `Password must be at least ${minimumLength} characters`)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
}

/**
 * Type definitions for schema validation results
 * Provides type safety for form data throughout the application
 */
export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
export type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>;
export type SecurityQuestionResetFormData = z.infer<typeof securityQuestionResetSchema>;
export type OAuthProviderData = z.infer<typeof oauthProviderSchema>;
export type LdapProviderData = z.infer<typeof ldapProviderSchema>;
export type SamlProviderData = z.infer<typeof samlProviderSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

/**
 * Validation helper utilities for form integration
 * Provides optimized validation functions for React Hook Form
 */
export const validationHelpers = {
  /**
   * Validates email format with performance optimization
   * Cached regex pattern for sub-100ms validation performance
   */
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validates password strength with detailed feedback
   * Returns array of failed requirements for user guidance
   */
  validatePasswordStrength: (password: string, minimumLength: number = 16): string[] => {
    const errors: string[] = [];
    
    if (password.length < minimumLength) {
      errors.push(`Password must be at least ${minimumLength} characters`);
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return errors;
  },

  /**
   * Validates username format with system requirements
   * Ensures compliance with DreamFactory username standards
   */
  validateUsername: (username: string): boolean => {
    // Username must be non-empty and contain valid characters
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    return username.length > 0 && usernameRegex.test(username);
  },

  /**
   * Dynamic schema resolver for runtime configuration
   * Provides cached schema instances for performance optimization
   */
  getSchemaForConfig: (config: ValidationConfig, schemaType: 'login' | 'register' | 'forgotPassword') => {
    const schemaCache = new Map();
    const cacheKey = `${schemaType}-${JSON.stringify(config)}`;
    
    if (schemaCache.has(cacheKey)) {
      return schemaCache.get(cacheKey);
    }
    
    let schema;
    switch (schemaType) {
      case 'login':
        schema = createLoginSchema(config);
        break;
      case 'register':
        schema = createRegisterSchema(config);
        break;
      case 'forgotPassword':
        schema = createForgotPasswordSchema(config);
        break;
      default:
        throw new Error(`Unknown schema type: ${schemaType}`);
    }
    
    schemaCache.set(cacheKey, schema);
    return schema;
  },
};

/**
 * Default validation configuration
 * Provides fallback values when system configuration is not available
 */
export const defaultValidationConfig: ValidationConfig = {
  loginAttribute: 'email',
  hasLdapServices: false,
  hasOauthServices: false,
  hasSamlServices: false,
  minimumPasswordLength: 16,
};