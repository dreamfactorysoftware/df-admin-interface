/**
 * @fileoverview Zod schema validators for authentication forms providing real-time validation
 * under 100ms performance requirement. Replaces Angular validators with React Hook Form 
 * compatible schemas that support dynamic validation based on system configuration.
 * 
 * This module provides comprehensive validation schemas for all authentication workflows
 * including login, registration, password reset, and external provider authentication.
 * 
 * @requires zod
 * @requires ./types - TypeScript interfaces for authentication data structures
 */

import { z } from 'zod';

/**
 * Password strength validation utility with configurable requirements
 * Implements industry-standard password complexity checks for enhanced security
 */
const passwordValidation = z
  .string()
  .min(16, 'Password must be at least 16 characters long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  )
  .max(128, 'Password must be less than 128 characters');

/**
 * Email validation with enhanced RFC-compliant pattern matching
 * Provides comprehensive email format validation for authentication workflows
 */
const emailValidation = z
  .string()
  .email('Please enter a valid email address')
  .max(254, 'Email address must be less than 254 characters')
  .regex(
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    'Please enter a valid email address'
  );

/**
 * Username validation with alphanumeric and special character support
 * Follows common username conventions while allowing flexibility for diverse naming patterns
 */
const usernameValidation = z
  .string()
  .min(3, 'Username must be at least 3 characters long')
  .max(50, 'Username must be less than 50 characters')
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    'Username can only contain letters, numbers, dots, underscores, and hyphens'
  );

/**
 * Security question validation for password recovery workflows
 * Ensures questions are meaningful and answers provide adequate security
 */
const securityQuestionValidation = z.object({
  question: z
    .string()
    .min(10, 'Security question must be at least 10 characters long')
    .max(200, 'Security question must be less than 200 characters'),
  answer: z
    .string()
    .min(3, 'Security answer must be at least 3 characters long')
    .max(100, 'Security answer must be less than 100 characters')
    .transform((val) => val.toLowerCase().trim()) // Normalize for comparison
});

/**
 * Login credentials schema with dynamic email/username validation
 * Supports system configuration-based login attribute switching (email vs username)
 * Integrates with external authentication services (LDAP, OAuth, SAML)
 * 
 * @param loginAttribute - System-configured login method ('email' | 'username')
 * @param hasExternalServices - Whether LDAP/OAuth services are available
 */
export const createLoginSchema = (
  loginAttribute: 'email' | 'username' = 'email',
  hasExternalServices: boolean = false
) => {
  const baseSchema = z.object({
    password: z
      .string()
      .min(1, 'Password is required')
      .max(128, 'Password must be less than 128 characters'),
    rememberMe: z.boolean().optional().default(false),
  });

  // Dynamic service selection for external authentication providers
  const serviceSchema = hasExternalServices
    ? z.object({
        service: z
          .string()
          .optional()
          .refine(
            (val) => !val || val.length > 0,
            'Please select a valid authentication service'
          ),
      })
    : z.object({});

  // Dynamic login attribute validation based on system configuration
  const credentialSchema = loginAttribute === 'email'
    ? z.object({
        email: emailValidation,
        username: z.string().optional(),
      })
    : z.object({
        username: usernameValidation,
        email: z.string().optional(),
      });

  return baseSchema.merge(serviceSchema).merge(credentialSchema);
};

/**
 * Default login schema for email-based authentication
 * Provides backward compatibility and common use case optimization
 */
export const loginSchema = createLoginSchema('email', false);

/**
 * User registration schema with comprehensive profile validation
 * Includes all required fields for user account creation with enhanced validation
 * Supports both email and username-based registration workflows
 * 
 * @param loginAttribute - System-configured login method for registration
 */
export const createRegisterSchema = (
  loginAttribute: 'email' | 'username' = 'email'
) => {
  const baseSchema = z.object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, apostrophes, and hyphens'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, apostrophes, and hyphens'),
    name: z
      .string()
      .min(1, 'Display name is required')
      .max(100, 'Display name must be less than 100 characters'),
  });

  // Dynamic credential requirements based on system configuration
  const credentialSchema = loginAttribute === 'email'
    ? z.object({
        email: emailValidation,
        username: z.string().optional(),
      })
    : z.object({
        username: usernameValidation,
        email: emailValidation.optional(),
      });

  return baseSchema.merge(credentialSchema);
};

/**
 * Default registration schema for email-based registration
 */
export const registerSchema = createRegisterSchema('email');

/**
 * Password reset schema with comprehensive validation and security features
 * Supports code-based password reset with confirmation matching
 * Includes expiration handling and security question integration
 * 
 * @param loginAttribute - System-configured login method
 * @param hasSecurityQuestions - Whether security questions are enabled
 */
export const createPasswordResetSchema = (
  loginAttribute: 'email' | 'username' = 'email',
  hasSecurityQuestions: boolean = false
) => {
  const baseSchema = z.object({
    code: z
      .string()
      .min(1, 'Reset code is required')
      .max(100, 'Reset code is invalid')
      .regex(/^[a-zA-Z0-9-_]+$/, 'Reset code contains invalid characters'),
    newPassword: passwordValidation,
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  }).refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  );

  // Dynamic credential validation
  const credentialSchema = loginAttribute === 'email'
    ? z.object({
        email: emailValidation,
        username: z.string().optional(),
      })
    : z.object({
        username: usernameValidation,
        email: z.string().optional(),
      });

  // Optional security question validation
  const securitySchema = hasSecurityQuestions
    ? z.object({
        securityQuestion: z.string().optional(),
        securityAnswer: z
          .string()
          .min(3, 'Security answer must be at least 3 characters long')
          .max(100, 'Security answer must be less than 100 characters')
          .transform((val) => val.toLowerCase().trim())
          .optional(),
      })
    : z.object({});

  return baseSchema.merge(credentialSchema).merge(securitySchema);
};

/**
 * Default password reset schema
 */
export const passwordResetSchema = createPasswordResetSchema('email', false);

/**
 * Forgot password request schema with dynamic login attribute support
 * Handles initial password reset request with optional security question workflow
 * 
 * @param loginAttribute - System-configured login method
 */
export const createForgotPasswordSchema = (
  loginAttribute: 'email' | 'username' = 'email'
) => {
  return loginAttribute === 'email'
    ? z.object({
        email: emailValidation,
        username: z.string().optional(),
      })
    : z.object({
        username: usernameValidation,
        email: z.string().optional(),
      });
};

/**
 * Default forgot password schema
 */
export const forgotPasswordSchema = createForgotPasswordSchema('email');

/**
 * Security question setup schema for enhanced account security
 * Used during registration or security enhancement workflows
 */
export const securityQuestionSetupSchema = z.object({
  securityQuestion: z
    .string()
    .min(10, 'Security question must be at least 10 characters long')
    .max(200, 'Security question must be less than 200 characters'),
  securityAnswer: z
    .string()
    .min(3, 'Security answer must be at least 3 characters long')
    .max(100, 'Security answer must be less than 100 characters')
    .transform((val) => val.toLowerCase().trim()),
});

/**
 * Security question response schema for password recovery
 */
export const securityQuestionResponseSchema = z.object({
  securityAnswer: z
    .string()
    .min(1, 'Security answer is required')
    .max(100, 'Security answer must be less than 100 characters')
    .transform((val) => val.toLowerCase().trim()),
  newPassword: passwordValidation,
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

/**
 * OAuth provider configuration schema
 * Validates external OAuth service configurations
 */
export const oauthProviderSchema = z.object({
  name: z
    .string()
    .min(1, 'Provider name is required')
    .max(50, 'Provider name must be less than 50 characters'),
  label: z
    .string()
    .min(1, 'Provider label is required')
    .max(100, 'Provider label must be less than 100 characters'),
  clientId: z
    .string()
    .min(1, 'Client ID is required')
    .max(255, 'Client ID must be less than 255 characters'),
  clientSecret: z
    .string()
    .min(1, 'Client secret is required')
    .max(255, 'Client secret must be less than 255 characters'),
  redirectUri: z
    .string()
    .url('Redirect URI must be a valid URL')
    .max(500, 'Redirect URI must be less than 500 characters'),
  scope: z
    .string()
    .max(200, 'Scope must be less than 200 characters')
    .optional(),
  icon: z
    .string()
    .max(50, 'Icon name must be less than 50 characters')
    .optional(),
});

/**
 * LDAP provider configuration schema
 * Validates LDAP/Active Directory service configurations
 */
export const ldapProviderSchema = z.object({
  name: z
    .string()
    .min(1, 'LDAP service name is required')
    .max(50, 'LDAP service name must be less than 50 characters'),
  label: z
    .string()
    .min(1, 'LDAP service label is required')
    .max(100, 'LDAP service label must be less than 100 characters'),
  host: z
    .string()
    .min(1, 'LDAP host is required')
    .max(255, 'LDAP host must be less than 255 characters'),
  port: z
    .number()
    .int('Port must be an integer')
    .min(1, 'Port must be greater than 0')
    .max(65535, 'Port must be less than 65536')
    .default(389),
  baseDn: z
    .string()
    .min(1, 'Base DN is required')
    .max(500, 'Base DN must be less than 500 characters'),
  accountSuffix: z
    .string()
    .max(100, 'Account suffix must be less than 100 characters')
    .optional(),
  useTls: z.boolean().default(false),
  useStartTls: z.boolean().default(false),
  followReferrals: z.boolean().default(true),
});

/**
 * SAML provider configuration schema
 * Validates SAML service configurations for enterprise authentication
 */
export const samlProviderSchema = z.object({
  name: z
    .string()
    .min(1, 'SAML service name is required')
    .max(50, 'SAML service name must be less than 50 characters'),
  label: z
    .string()
    .min(1, 'SAML service label is required')
    .max(100, 'SAML service label must be less than 100 characters'),
  entityId: z
    .string()
    .min(1, 'Entity ID is required')
    .max(500, 'Entity ID must be less than 500 characters'),
  ssoUrl: z
    .string()
    .url('SSO URL must be a valid URL')
    .max(500, 'SSO URL must be less than 500 characters'),
  sloUrl: z
    .string()
    .url('SLO URL must be a valid URL')
    .max(500, 'SLO URL must be less than 500 characters')
    .optional(),
  x509cert: z
    .string()
    .min(1, 'X.509 certificate is required')
    .max(5000, 'X.509 certificate is too large'),
  wantAssertionsSigned: z.boolean().default(true),
  wantNameId: z.boolean().default(true),
  wantXMLValidation: z.boolean().default(true),
});

/**
 * Password update schema for authenticated users
 * Validates password changes with current password verification
 */
export const passwordUpdateSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required')
    .max(128, 'Current password must be less than 128 characters'),
  newPassword: passwordValidation,
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  }
);

/**
 * Email verification schema for account activation
 * Validates email verification tokens and expiration
 */
export const emailVerificationSchema = z.object({
  token: z
    .string()
    .min(1, 'Verification token is required')
    .max(255, 'Verification token is invalid')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Verification token contains invalid characters'),
  email: emailValidation,
});

/**
 * Two-factor authentication setup schema
 * Validates TOTP configuration for enhanced security
 */
export const twoFactorSetupSchema = z.object({
  secret: z
    .string()
    .min(16, 'Invalid TOTP secret')
    .max(32, 'Invalid TOTP secret')
    .regex(/^[A-Z2-7]+$/, 'Invalid TOTP secret format'),
  code: z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only digits'),
  backupCodes: z
    .array(z.string().length(8).regex(/^[A-Z0-9]{8}$/))
    .length(10, 'Must provide exactly 10 backup codes'),
});

/**
 * Two-factor authentication verification schema
 * Validates TOTP codes during login
 */
export const twoFactorVerificationSchema = z.object({
  code: z
    .string()
    .min(6, 'Verification code must be at least 6 characters')
    .max(8, 'Verification code must be at most 8 characters')
    .regex(/^[A-Z0-9]+$/, 'Verification code contains invalid characters'),
});

/**
 * Session management schema for authentication state
 * Validates session tokens and user context data
 */
export const sessionSchema = z.object({
  sessionToken: z
    .string()
    .min(1, 'Session token is required')
    .max(500, 'Session token is invalid'),
  refreshToken: z
    .string()
    .min(1, 'Refresh token is required')
    .max(500, 'Refresh token is invalid')
    .optional(),
  expiresAt: z
    .number()
    .int('Expiration must be an integer')
    .min(Date.now(), 'Session has expired'),
  userId: z
    .number()
    .int('User ID must be an integer')
    .positive('User ID must be positive'),
  roles: z
    .array(z.string().max(50))
    .default([]),
  permissions: z
    .array(z.string().max(100))
    .default([]),
});

/**
 * Type inference helpers for React Hook Form integration
 * Provides compile-time type safety for form validation
 */
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type SecurityQuestionSetupData = z.infer<typeof securityQuestionSetupSchema>;
export type SecurityQuestionResponseData = z.infer<typeof securityQuestionResponseSchema>;
export type OAuthProviderData = z.infer<typeof oauthProviderSchema>;
export type LDAPProviderData = z.infer<typeof ldapProviderSchema>;
export type SAMLProviderData = z.infer<typeof samlProviderSchema>;
export type PasswordUpdateData = z.infer<typeof passwordUpdateSchema>;
export type EmailVerificationData = z.infer<typeof emailVerificationSchema>;
export type TwoFactorSetupData = z.infer<typeof twoFactorSetupSchema>;
export type TwoFactorVerificationData = z.infer<typeof twoFactorVerificationSchema>;
export type SessionData = z.infer<typeof sessionSchema>;

/**
 * Schema factory utilities for dynamic validation configuration
 * Enables runtime schema creation based on system configuration
 */
export const SchemaFactory = {
  /**
   * Creates a login schema based on system configuration
   */
  createLoginSchema,
  
  /**
   * Creates a registration schema based on system configuration
   */
  createRegisterSchema,
  
  /**
   * Creates a password reset schema based on system configuration
   */
  createPasswordResetSchema,
  
  /**
   * Creates a forgot password schema based on system configuration
   */
  createForgotPasswordSchema,
} as const;

/**
 * Validation performance optimization utilities
 * Provides caching and memoization for schema validation to meet <100ms requirement
 */
export const ValidationUtils = {
  /**
   * Validates data against schema with performance timing
   * Logs validation time for performance monitoring
   */
  async validateWithTiming<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    fieldName?: string
  ): Promise<{ success: boolean; data?: T; errors?: z.ZodError; duration: number }> {
    const startTime = performance.now();
    
    try {
      const result = await schema.parseAsync(data);
      const duration = performance.now() - startTime;
      
      // Log performance warning if validation exceeds 50ms
      if (duration > 50) {
        console.warn(`Validation for ${fieldName || 'unknown field'} took ${duration.toFixed(2)}ms`);
      }
      
      return { success: true, data: result, duration };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      if (error instanceof z.ZodError) {
        return { success: false, errors: error, duration };
      }
      
      throw error;
    }
  },
  
  /**
   * Creates memoized validation function for frequently used schemas
   * Improves performance for repeated validations
   */
  createMemoizedValidator<T>(schema: z.ZodSchema<T>) {
    const cache = new Map<string, { result: z.SafeParseReturnType<unknown, T>; timestamp: number }>();
    const CACHE_TTL = 5000; // 5 seconds
    
    return (data: unknown): z.SafeParseReturnType<unknown, T> => {
      const key = JSON.stringify(data);
      const cached = cache.get(key);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.result;
      }
      
      const result = schema.safeParse(data);
      cache.set(key, { result, timestamp: Date.now() });
      
      // Clear old cache entries
      if (cache.size > 100) {
        const cutoff = Date.now() - CACHE_TTL;
        for (const [cacheKey, entry] of cache.entries()) {
          if (entry.timestamp < cutoff) {
            cache.delete(cacheKey);
          }
        }
      }
      
      return result;
    };
  },
} as const;

/**
 * Common validation patterns for reuse across components
 * Provides consistent validation behavior throughout the application
 */
export const CommonValidationPatterns = {
  email: emailValidation,
  username: usernameValidation,
  password: passwordValidation,
  securityQuestion: securityQuestionValidation,
} as const;