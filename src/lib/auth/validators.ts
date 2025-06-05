/**
 * @fileoverview Authentication validation utilities for React Hook Form and Zod integration
 * 
 * This module provides comprehensive authentication validation utilities including
 * password matching, email/username validation, security question validation, and
 * custom validators for authentication forms. Migrated from Angular validators to
 * React Hook Form with Zod schema integration for optimal performance under 100ms.
 * 
 * Features:
 * - Password matching validation with real-time feedback
 * - Dynamic email/username validation based on system configuration
 * - Security question validation for account recovery workflows
 * - LDAP service validation for multi-service environments
 * - Confirmation code validation for registration and password reset
 * - Comprehensive error handling with user-friendly feedback
 * 
 * @version 1.0.0
 * @since React 19 / Next.js 15.1 migration
 */

import { z } from 'zod';
import type { 
  FieldPath,
  FieldPathValue,
  FieldValues,
  UseFormWatch,
  UseFormSetError,
  UseFormClearErrors,
  Path,
  PathValue
} from 'react-hook-form';
import type {
  ValidationResult,
  ValidationSuccess,
  ValidationFailure,
  FieldValidationError,
  CrossFieldValidationError,
  DoesNotMatchError,
  ValidationPerformanceMetrics,
  PerformantZodSchema
} from '../validation/types';

// =============================================================================
// AUTHENTICATION VALIDATION TYPES
// =============================================================================

/**
 * Authentication field types for dynamic validation switching.
 * Determines which field to validate based on system configuration.
 */
export type AuthenticationField = 'email' | 'username';

/**
 * Login credential validation modes based on system authentication configuration.
 * Supports dynamic switching between email and username-based authentication.
 */
export type LoginValidationMode = 'email' | 'username' | 'both';

/**
 * LDAP service configuration for multi-service authentication environments.
 * Supports validation of service selection and configuration parameters.
 */
export interface LdapServiceConfig {
  /** Service identifier for LDAP authentication */
  readonly id: string;
  /** Display name for the LDAP service */
  readonly name: string;
  /** Whether this service is currently active */
  readonly active: boolean;
  /** Service host configuration */
  readonly host?: string;
  /** Service port configuration */
  readonly port?: number;
}

/**
 * Security question configuration for account recovery workflows.
 * Supports predefined and custom security questions with validation.
 */
export interface SecurityQuestionConfig {
  /** Unique identifier for the security question */
  readonly id: string;
  /** The security question text */
  readonly question: string;
  /** Whether this is a custom user-defined question */
  readonly isCustom: boolean;
  /** Minimum answer length requirement */
  readonly minAnswerLength?: number;
  /** Maximum answer length requirement */
  readonly maxAnswerLength?: number;
}

/**
 * Password strength configuration based on system security requirements.
 * Implements 16-character minimum requirement per security specifications.
 */
export interface PasswordStrengthConfig {
  /** Minimum password length (default: 16 characters) */
  readonly minLength: 16;
  /** Require uppercase characters */
  readonly requireUppercase: boolean;
  /** Require lowercase characters */
  readonly requireLowercase: boolean;
  /** Require numeric characters */
  readonly requireNumbers: boolean;
  /** Require special characters */
  readonly requireSpecialChars: boolean;
  /** List of forbidden common passwords */
  readonly forbiddenPasswords?: string[];
}

/**
 * Confirmation code validation configuration for registration and password reset.
 * Supports various code formats and expiration handling.
 */
export interface ConfirmationCodeConfig {
  /** Expected code length */
  readonly length: number;
  /** Code format pattern (alphanumeric, numeric, etc.) */
  readonly format: 'alphanumeric' | 'numeric' | 'alphabetic';
  /** Whether code is case-sensitive */
  readonly caseSensitive: boolean;
  /** Code expiration time in minutes */
  readonly expirationMinutes?: number;
}

// =============================================================================
// PASSWORD VALIDATION UTILITIES
// =============================================================================

/**
 * Default password strength configuration per security specifications.
 * Implements 16-character minimum requirement with comprehensive security rules.
 */
export const DEFAULT_PASSWORD_CONFIG: PasswordStrengthConfig = {
  minLength: 16,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbiddenPasswords: [
    'password123456789',
    'admin123456789012',
    'qwerty123456789012',
    'letmein123456789',
    'welcome123456789',
    'password12345678',
  ]
} as const;

/**
 * Creates a Zod schema for password validation with configurable strength requirements.
 * Implements comprehensive password validation including length, complexity, and common password detection.
 * 
 * @param config - Password strength configuration (defaults to DEFAULT_PASSWORD_CONFIG)
 * @returns Performant Zod schema for password validation
 * 
 * @example
 * ```typescript
 * const passwordSchema = createPasswordSchema();
 * const result = passwordSchema.safeParse('MySecurePassword123!');
 * ```
 */
export const createPasswordSchema = (
  config: Partial<PasswordStrengthConfig> = {}
): PerformantZodSchema<string> => {
  const finalConfig = { ...DEFAULT_PASSWORD_CONFIG, ...config };
  
  let schema = z.string()
    .min(finalConfig.minLength, `Password must be at least ${finalConfig.minLength} characters long`)
    .max(128, 'Password must be less than 128 characters');

  // Add complexity requirements based on configuration
  if (finalConfig.requireUppercase) {
    schema = schema.regex(
      /[A-Z]/,
      'Password must contain at least one uppercase letter'
    );
  }

  if (finalConfig.requireLowercase) {
    schema = schema.regex(
      /[a-z]/,
      'Password must contain at least one lowercase letter'
    );
  }

  if (finalConfig.requireNumbers) {
    schema = schema.regex(
      /\d/,
      'Password must contain at least one number'
    );
  }

  if (finalConfig.requireSpecialChars) {
    schema = schema.regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      'Password must contain at least one special character'
    );
  }

  // Add common password validation
  if (finalConfig.forbiddenPasswords?.length) {
    schema = schema.refine(
      (password) => !finalConfig.forbiddenPasswords!.includes(password.toLowerCase()),
      'Password is too common. Please choose a more secure password.'
    );
  }

  // Add performance metadata
  return Object.assign(schema, {
    maxValidationTime: 100,
    complexityScore: 'medium' as const
  }) as PerformantZodSchema<string>;
};

/**
 * Creates a password matching validator using Zod refinement for cross-field validation.
 * Implements real-time password confirmation validation with proper error handling.
 * 
 * @param passwordField - Name of the password field to match against
 * @param confirmPasswordField - Name of the confirmation password field
 * @returns Zod schema refinement for password matching validation
 * 
 * @example
 * ```typescript
 * const schema = z.object({
 *   password: createPasswordSchema(),
 *   confirmPassword: z.string()
 * }).refine(...createPasswordMatchValidator('password', 'confirmPassword'));
 * ```
 */
export const createPasswordMatchValidator = <T extends Record<string, any>>(
  passwordField: keyof T,
  confirmPasswordField: keyof T
) => {
  return (data: T, ctx: z.RefinementCtx) => {
    const password = data[passwordField];
    const confirmPassword = data[confirmPasswordField];

    if (password !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: [confirmPasswordField as string],
        params: { doesNotMatch: true }
      });
      return false;
    }
    return true;
  };
};

/**
 * React Hook Form utility for real-time password matching validation.
 * Provides immediate feedback when password confirmation fields don't match.
 * 
 * @param watch - React Hook Form watch function
 * @param setError - React Hook Form setError function
 * @param clearErrors - React Hook Form clearErrors function
 * @param passwordField - Name of the password field
 * @param confirmPasswordField - Name of the confirmation password field
 * @returns Validation function for use in form effects
 * 
 * @example
 * ```typescript
 * const passwordMatchValidator = usePasswordMatchValidator(
 *   watch, setError, clearErrors, 'password', 'confirmPassword'
 * );
 * 
 * useEffect(() => {
 *   passwordMatchValidator();
 * }, [watch('password'), watch('confirmPassword')]);
 * ```
 */
export const usePasswordMatchValidator = <T extends FieldValues>(
  watch: UseFormWatch<T>,
  setError: UseFormSetError<T>,
  clearErrors: UseFormClearErrors<T>,
  passwordField: Path<T>,
  confirmPasswordField: Path<T>
) => {
  return () => {
    const password = watch(passwordField);
    const confirmPassword = watch(confirmPasswordField);

    if (password && confirmPassword) {
      if (password !== confirmPassword) {
        setError(confirmPasswordField, {
          type: 'manual',
          message: 'Passwords do not match'
        });
      } else {
        clearErrors(confirmPasswordField);
      }
    }
  };
};

// =============================================================================
// EMAIL AND USERNAME VALIDATION
// =============================================================================

/**
 * Creates a dynamic email validation schema with comprehensive email pattern validation.
 * Supports both standard email validation and custom domain restrictions.
 * 
 * @param allowedDomains - Optional array of allowed email domains
 * @returns Performant Zod schema for email validation
 * 
 * @example
 * ```typescript
 * const emailSchema = createEmailSchema(['example.com', 'company.org']);
 * const result = emailSchema.safeParse('user@example.com');
 * ```
 */
export const createEmailSchema = (
  allowedDomains?: string[]
): PerformantZodSchema<string> => {
  let schema = z.string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long'); // RFC 5321 limit

  // Add domain restriction if specified
  if (allowedDomains?.length) {
    schema = schema.refine(
      (email) => {
        const domain = email.split('@')[1]?.toLowerCase();
        return domain && allowedDomains.includes(domain);
      },
      `Email must be from an allowed domain: ${allowedDomains.join(', ')}`
    );
  }

  // Add performance metadata
  return Object.assign(schema, {
    maxValidationTime: 100,
    complexityScore: 'low' as const
  }) as PerformantZodSchema<string>;
};

/**
 * Creates a username validation schema with configurable requirements.
 * Supports alphanumeric usernames with optional special characters.
 * 
 * @param minLength - Minimum username length (default: 3)
 * @param maxLength - Maximum username length (default: 50)
 * @param allowSpecialChars - Whether to allow special characters
 * @returns Performant Zod schema for username validation
 * 
 * @example
 * ```typescript
 * const usernameSchema = createUsernameSchema(4, 30, true);
 * const result = usernameSchema.safeParse('user_name123');
 * ```
 */
export const createUsernameSchema = (
  minLength: number = 3,
  maxLength: number = 50,
  allowSpecialChars: boolean = false
): PerformantZodSchema<string> => {
  const pattern = allowSpecialChars 
    ? /^[a-zA-Z0-9._-]+$/ 
    : /^[a-zA-Z0-9]+$/;
  
  const errorMessage = allowSpecialChars
    ? 'Username can only contain letters, numbers, dots, underscores, and hyphens'
    : 'Username can only contain letters and numbers';

  const schema = z.string()
    .min(1, 'Username is required')
    .min(minLength, `Username must be at least ${minLength} characters long`)
    .max(maxLength, `Username must be less than ${maxLength} characters`)
    .regex(pattern, errorMessage);

  // Add performance metadata
  return Object.assign(schema, {
    maxValidationTime: 100,
    complexityScore: 'low' as const
  }) as PerformantZodSchema<string>;
};

/**
 * Creates a dynamic login field validation schema that switches between email and username
 * based on the system authentication configuration.
 * 
 * @param mode - Login validation mode (email, username, or both)
 * @param allowedDomains - Optional array of allowed email domains
 * @returns Performant Zod schema for dynamic login field validation
 * 
 * @example
 * ```typescript
 * const loginSchema = createLoginFieldSchema('both');
 * const result = loginSchema.safeParse('user@example.com');
 * ```
 */
export const createLoginFieldSchema = (
  mode: LoginValidationMode,
  allowedDomains?: string[]
): PerformantZodSchema<string> => {
  const baseSchema = z.string().min(1, 'Login field is required');

  switch (mode) {
    case 'email':
      return createEmailSchema(allowedDomains);
    
    case 'username':
      return createUsernameSchema();
    
    case 'both':
      // Allow either email or username format
      const emailSchema = createEmailSchema(allowedDomains);
      const usernameSchema = createUsernameSchema();
      
      const schema = baseSchema.refine(
        (value) => {
          const emailResult = emailSchema.safeParse(value);
          const usernameResult = usernameSchema.safeParse(value);
          return emailResult.success || usernameResult.success;
        },
        'Please enter a valid email address or username'
      );

      // Add performance metadata
      return Object.assign(schema, {
        maxValidationTime: 100,
        complexityScore: 'medium' as const
      }) as PerformantZodSchema<string>;
    
    default:
      throw new Error(`Invalid login validation mode: ${mode}`);
  }
};

// =============================================================================
// SECURITY QUESTION VALIDATION
// =============================================================================

/**
 * Creates a security question validation schema for account recovery workflows.
 * Validates both predefined and custom security questions with answer requirements.
 * 
 * @param config - Security question configuration
 * @returns Performant Zod schema for security question validation
 * 
 * @example
 * ```typescript
 * const questionSchema = createSecurityQuestionSchema({
 *   id: 'mother-maiden-name',
 *   question: "What is your mother's maiden name?",
 *   isCustom: false,
 *   minAnswerLength: 2
 * });
 * ```
 */
export const createSecurityQuestionSchema = (
  config: SecurityQuestionConfig
): PerformantZodSchema<string> => {
  const minLength = config.minAnswerLength || 2;
  const maxLength = config.maxAnswerLength || 100;

  const schema = z.string()
    .min(1, 'Security answer is required')
    .min(minLength, `Answer must be at least ${minLength} characters long`)
    .max(maxLength, `Answer must be less than ${maxLength} characters`)
    .refine(
      (answer) => answer.trim().length >= minLength,
      'Answer cannot be only whitespace'
    );

  // Add performance metadata
  return Object.assign(schema, {
    maxValidationTime: 100,
    complexityScore: 'low' as const
  }) as PerformantZodSchema<string>;
};

/**
 * Creates a combined security question and answer validation schema.
 * Validates both the question selection and the provided answer.
 * 
 * @param availableQuestions - Array of available security questions
 * @returns Performant Zod schema for security question and answer validation
 */
export const createSecurityQuestionAndAnswerSchema = (
  availableQuestions: SecurityQuestionConfig[]
) => {
  const questionIds = availableQuestions.map(q => q.id);
  
  return z.object({
    questionId: z.string()
      .min(1, 'Please select a security question')
      .refine(
        (id) => questionIds.includes(id),
        'Please select a valid security question'
      ),
    answer: z.string()
      .min(1, 'Security answer is required')
      .min(2, 'Answer must be at least 2 characters long')
      .max(100, 'Answer must be less than 100 characters')
      .refine(
        (answer) => answer.trim().length >= 2,
        'Answer cannot be only whitespace'
      )
  });
};

// =============================================================================
// LDAP SERVICE VALIDATION
// =============================================================================

/**
 * Creates an LDAP service selection validation schema for multi-service environments.
 * Validates service selection and configuration parameters.
 * 
 * @param availableServices - Array of available LDAP services
 * @param required - Whether service selection is required
 * @returns Performant Zod schema for LDAP service validation
 * 
 * @example
 * ```typescript
 * const ldapSchema = createLdapServiceSchema(services, true);
 * const result = ldapSchema.safeParse('active-directory-main');
 * ```
 */
export const createLdapServiceSchema = (
  availableServices: LdapServiceConfig[],
  required: boolean = false
): PerformantZodSchema<string | undefined> => {
  const activeServices = availableServices.filter(service => service.active);
  const serviceIds = activeServices.map(service => service.id);

  let schema = z.string().optional();

  if (required) {
    schema = z.string()
      .min(1, 'Please select an authentication service')
      .refine(
        (serviceId) => serviceIds.includes(serviceId),
        'Please select a valid authentication service'
      );
  } else {
    schema = z.string()
      .optional()
      .refine(
        (serviceId) => !serviceId || serviceIds.includes(serviceId),
        'Please select a valid authentication service'
      );
  }

  // Add performance metadata
  return Object.assign(schema, {
    maxValidationTime: 100,
    complexityScore: 'low' as const
  }) as PerformantZodSchema<string | undefined>;
};

/**
 * Validates LDAP service availability and configuration.
 * Checks if the selected service is active and properly configured.
 * 
 * @param serviceId - The LDAP service ID to validate
 * @param availableServices - Array of available LDAP services
 * @returns Validation result with service configuration details
 */
export const validateLdapService = (
  serviceId: string,
  availableServices: LdapServiceConfig[]
): ValidationResult<LdapServiceConfig> => {
  const startTime = Date.now();
  
  const service = availableServices.find(s => s.id === serviceId);
  
  if (!service) {
    return {
      success: false,
      data: null,
      errors: {
        fieldErrors: {
          service: [{
            field: 'service',
            code: 'SERVICE_NOT_FOUND',
            message: 'Selected authentication service not found'
          }]
        },
        crossFieldErrors: [],
        schemaErrors: [],
        errorCount: 1,
        summary: 'Invalid authentication service selected'
      },
      performance: {
        validationTime: Date.now() - startTime,
        fieldValidationTimes: { service: Date.now() - startTime },
        schemaProcessingTime: 0,
        errorProcessingTime: 0,
        startTime: new Date(startTime),
        endTime: new Date(),
        metPerformanceTarget: true,
        metadata: { serviceId }
      },
      timestamp: new Date()
    };
  }

  if (!service.active) {
    return {
      success: false,
      data: null,
      errors: {
        fieldErrors: {
          service: [{
            field: 'service',
            code: 'SERVICE_INACTIVE',
            message: 'Selected authentication service is currently unavailable'
          }]
        },
        crossFieldErrors: [],
        schemaErrors: [],
        errorCount: 1,
        summary: 'Authentication service unavailable'
      },
      performance: {
        validationTime: Date.now() - startTime,
        fieldValidationTimes: { service: Date.now() - startTime },
        schemaProcessingTime: 0,
        errorProcessingTime: 0,
        startTime: new Date(startTime),
        endTime: new Date(),
        metPerformanceTarget: true,
        metadata: { serviceId, serviceName: service.name }
      },
      timestamp: new Date()
    };
  }

  return {
    success: true,
    data: service,
    errors: null,
    performance: {
      validationTime: Date.now() - startTime,
      fieldValidationTimes: { service: Date.now() - startTime },
      schemaProcessingTime: 0,
      errorProcessingTime: 0,
      startTime: new Date(startTime),
      endTime: new Date(),
      metPerformanceTarget: true,
      metadata: { serviceId, serviceName: service.name }
    },
    timestamp: new Date()
  };
};

// =============================================================================
// CONFIRMATION CODE VALIDATION
// =============================================================================

/**
 * Creates a confirmation code validation schema for registration and password reset.
 * Supports various code formats with length and character validation.
 * 
 * @param config - Confirmation code configuration
 * @returns Performant Zod schema for confirmation code validation
 * 
 * @example
 * ```typescript
 * const codeSchema = createConfirmationCodeSchema({
 *   length: 6,
 *   format: 'numeric',
 *   caseSensitive: false
 * });
 * ```
 */
export const createConfirmationCodeSchema = (
  config: ConfirmationCodeConfig
): PerformantZodSchema<string> => {
  const { length, format, caseSensitive } = config;
  
  let pattern: RegExp;
  let patternMessage: string;

  switch (format) {
    case 'numeric':
      pattern = new RegExp(`^\\d{${length}}$`);
      patternMessage = `Code must be exactly ${length} digits`;
      break;
    case 'alphabetic':
      pattern = caseSensitive 
        ? new RegExp(`^[a-zA-Z]{${length}}$`)
        : new RegExp(`^[a-zA-Z]{${length}}$`, 'i');
      patternMessage = `Code must be exactly ${length} letters`;
      break;
    case 'alphanumeric':
    default:
      pattern = caseSensitive
        ? new RegExp(`^[a-zA-Z0-9]{${length}}$`)
        : new RegExp(`^[a-zA-Z0-9]{${length}}$`, 'i');
      patternMessage = `Code must be exactly ${length} alphanumeric characters`;
      break;
  }

  let schema = z.string()
    .min(1, 'Confirmation code is required')
    .length(length, `Code must be exactly ${length} characters`)
    .regex(pattern, patternMessage);

  // Normalize case if not case-sensitive
  if (!caseSensitive) {
    schema = schema.transform(code => code.toUpperCase());
  }

  // Add performance metadata
  return Object.assign(schema, {
    maxValidationTime: 100,
    complexityScore: 'low' as const
  }) as PerformantZodSchema<string>;
};

/**
 * Validates confirmation code format and expiration.
 * Checks code format compliance and optional expiration time.
 * 
 * @param code - The confirmation code to validate
 * @param config - Confirmation code configuration
 * @param issuedAt - Optional timestamp when code was issued
 * @returns Validation result with expiration check
 */
export const validateConfirmationCode = (
  code: string,
  config: ConfirmationCodeConfig,
  issuedAt?: Date
): ValidationResult<string> => {
  const startTime = Date.now();
  
  // Validate code format
  const schema = createConfirmationCodeSchema(config);
  const formatResult = schema.safeParse(code);
  
  if (!formatResult.success) {
    const error = formatResult.error.issues[0];
    return {
      success: false,
      data: null,
      errors: {
        fieldErrors: {
          code: [{
            field: 'code',
            code: 'INVALID_FORMAT',
            message: error.message
          }]
        },
        crossFieldErrors: [],
        schemaErrors: [],
        errorCount: 1,
        summary: 'Invalid confirmation code format'
      },
      performance: {
        validationTime: Date.now() - startTime,
        fieldValidationTimes: { code: Date.now() - startTime },
        schemaProcessingTime: 0,
        errorProcessingTime: 0,
        startTime: new Date(startTime),
        endTime: new Date(),
        metPerformanceTarget: true,
        metadata: { codeLength: code.length, expectedLength: config.length }
      },
      timestamp: new Date()
    };
  }

  // Check expiration if configured and issuedAt provided
  if (config.expirationMinutes && issuedAt) {
    const expirationTime = new Date(issuedAt.getTime() + config.expirationMinutes * 60000);
    const now = new Date();
    
    if (now > expirationTime) {
      return {
        success: false,
        data: null,
        errors: {
          fieldErrors: {
            code: [{
              field: 'code',
              code: 'CODE_EXPIRED',
              message: 'Confirmation code has expired. Please request a new code.'
            }]
          },
          crossFieldErrors: [],
          schemaErrors: [],
          errorCount: 1,
          summary: 'Confirmation code expired'
        },
        performance: {
          validationTime: Date.now() - startTime,
          fieldValidationTimes: { code: Date.now() - startTime },
          schemaProcessingTime: 0,
          errorProcessingTime: 0,
          startTime: new Date(startTime),
          endTime: new Date(),
          metPerformanceTarget: true,
          metadata: { 
            issuedAt: issuedAt.toISOString(),
            expirationTime: expirationTime.toISOString(),
            currentTime: now.toISOString()
          }
        },
        timestamp: new Date()
      };
    }
  }

  return {
    success: true,
    data: formatResult.data,
    errors: null,
    performance: {
      validationTime: Date.now() - startTime,
      fieldValidationTimes: { code: Date.now() - startTime },
      schemaProcessingTime: 0,
      errorProcessingTime: 0,
      startTime: new Date(startTime),
      endTime: new Date(),
      metPerformanceTarget: true,
      metadata: { 
        validatedCode: formatResult.data,
        hasExpiration: Boolean(config.expirationMinutes && issuedAt)
      }
    },
    timestamp: new Date()
  };
};

// =============================================================================
// COMPREHENSIVE FORM VALIDATION COORDINATION
// =============================================================================

/**
 * Creates a comprehensive authentication form schema with all validation rules.
 * Combines multiple validation types for complete form validation coordination.
 * 
 * @param options - Form validation configuration options
 * @returns Comprehensive Zod schema for authentication forms
 */
export interface AuthFormValidationOptions {
  /** Login validation mode */
  loginMode: LoginValidationMode;
  /** Whether to include password confirmation */
  includePasswordConfirmation: boolean;
  /** Whether to include security questions */
  includeSecurityQuestions: boolean;
  /** Available LDAP services */
  ldapServices?: LdapServiceConfig[];
  /** Available security questions */
  securityQuestions?: SecurityQuestionConfig[];
  /** Password strength configuration */
  passwordConfig?: Partial<PasswordStrengthConfig>;
  /** Allowed email domains */
  allowedEmailDomains?: string[];
  /** Confirmation code configuration */
  confirmationCodeConfig?: ConfirmationCodeConfig;
}

/**
 * Creates a comprehensive authentication form validation schema.
 * Provides coordinated validation for all authentication workflows.
 * 
 * @param options - Form validation configuration
 * @returns Comprehensive authentication form schema
 */
export const createAuthFormSchema = (options: AuthFormValidationOptions) => {
  const {
    loginMode,
    includePasswordConfirmation,
    includeSecurityQuestions,
    ldapServices = [],
    securityQuestions = [],
    passwordConfig,
    allowedEmailDomains,
    confirmationCodeConfig
  } = options;

  // Base schema object
  const schemaObject: Record<string, any> = {};

  // Add login field validation
  if (loginMode === 'email') {
    schemaObject.email = createEmailSchema(allowedEmailDomains);
  } else if (loginMode === 'username') {
    schemaObject.username = createUsernameSchema();
  } else {
    // Both email and username fields
    schemaObject.email = createEmailSchema(allowedEmailDomains).optional();
    schemaObject.username = createUsernameSchema().optional();
  }

  // Add password validation
  schemaObject.password = createPasswordSchema(passwordConfig);

  // Add password confirmation if required
  if (includePasswordConfirmation) {
    schemaObject.confirmPassword = z.string().min(1, 'Password confirmation is required');
  }

  // Add LDAP service validation if services available
  if (ldapServices.length > 0) {
    schemaObject.service = createLdapServiceSchema(ldapServices, false);
  }

  // Add security questions if required
  if (includeSecurityQuestions && securityQuestions.length > 0) {
    const questionSchema = createSecurityQuestionAndAnswerSchema(securityQuestions);
    schemaObject.securityQuestion = questionSchema.shape.questionId;
    schemaObject.securityAnswer = questionSchema.shape.answer;
  }

  // Add confirmation code if configured
  if (confirmationCodeConfig) {
    schemaObject.confirmationCode = createConfirmationCodeSchema(confirmationCodeConfig);
  }

  // Create base schema
  let schema = z.object(schemaObject);

  // Add cross-field validation refinements
  if (includePasswordConfirmation) {
    schema = schema.refine(
      (data) => data.password === data.confirmPassword,
      {
        message: 'Passwords do not match',
        path: ['confirmPassword']
      }
    );
  }

  // Add conditional login field validation for 'both' mode
  if (loginMode === 'both') {
    schema = schema.refine(
      (data) => data.email || data.username,
      {
        message: 'Please provide either an email address or username',
        path: ['email']
      }
    );
  }

  return schema;
};

/**
 * Performance-optimized form error handler for authentication forms.
 * Provides real-time error feedback under 100ms requirement.
 * 
 * @param errors - Form validation errors
 * @param setError - React Hook Form setError function
 * @param clearErrors - React Hook Form clearErrors function
 * @returns Performance metrics for validation timing
 */
export const handleAuthFormErrors = <T extends FieldValues>(
  errors: Record<string, any>,
  setError: UseFormSetError<T>,
  clearErrors: UseFormClearErrors<T>
): ValidationPerformanceMetrics => {
  const startTime = Date.now();
  const fieldTimings: Record<string, number> = {};

  Object.entries(errors).forEach(([field, error]) => {
    const fieldStartTime = Date.now();
    
    if (error?.message) {
      setError(field as Path<T>, {
        type: 'manual',
        message: error.message
      });
    }
    
    fieldTimings[field] = Date.now() - fieldStartTime;
  });

  const endTime = Date.now();
  const totalTime = endTime - startTime;

  return {
    validationTime: totalTime,
    fieldValidationTimes: fieldTimings,
    schemaProcessingTime: 0,
    errorProcessingTime: totalTime,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    metPerformanceTarget: totalTime < 100,
    metadata: {
      errorCount: Object.keys(errors).length,
      fieldsProcessed: Object.keys(fieldTimings)
    }
  };
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Debounced validation utility for real-time form validation.
 * Ensures validation performance stays under 100ms requirement.
 * 
 * @param validationFn - Validation function to debounce
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Debounced validation function
 */
export const createDebouncedValidator = <T extends any[], R>(
  validationFn: (...args: T) => R,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: T): Promise<R> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        resolve(validationFn(...args));
      }, delay);
    });
  };
};

/**
 * Creates a validation error object compatible with legacy Angular patterns.
 * Maintains backward compatibility while supporting new React Hook Form patterns.
 * 
 * @param code - Error code for programmatic handling
 * @param message - User-friendly error message
 * @param legacyError - Optional legacy Angular error object
 * @returns Standardized field validation error
 */
export const createValidationError = (
  code: string,
  message: string,
  legacyError?: DoesNotMatchError | { notUnique: true } | { jsonInvalid: true }
): FieldValidationError => {
  return {
    field: '',
    code,
    message,
    legacyError,
    context: {
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * Validates authentication form performance metrics.
 * Ensures all validation operations meet the 100ms requirement.
 * 
 * @param metrics - Validation performance metrics
 * @returns Whether performance targets were met
 */
export const validateAuthFormPerformance = (
  metrics: ValidationPerformanceMetrics
): boolean => {
  const { validationTime, fieldValidationTimes } = metrics;
  
  // Check total validation time
  if (validationTime >= 100) {
    console.warn(`Authentication validation exceeded 100ms target: ${validationTime}ms`);
    return false;
  }
  
  // Check individual field validation times
  const slowFields = Object.entries(fieldValidationTimes)
    .filter(([, time]) => time >= 50) // Warning threshold for individual fields
    .map(([field]) => field);
  
  if (slowFields.length > 0) {
    console.warn(`Slow authentication field validation detected:`, slowFields);
  }
  
  return metrics.metPerformanceTarget;
};