/**
 * Authentication validation utilities for DreamFactory Admin Interface
 * 
 * Provides comprehensive validation functions for authentication forms including:
 * - Password matching validation with real-time feedback
 * - Email/username validation with dynamic switching
 * - Security question validation for account recovery
 * - LDAP service validation for multi-service environments
 * - Confirmation code validation for registration and password reset
 * - Form validation coordination with accessibility support
 * 
 * Built with React Hook Form, Zod validation, and Next.js integration
 * Optimized for performance with validation responses under 100ms
 */

import { z } from 'zod';
import { 
  LoginCredentials, 
  RegisterDetails, 
  ResetFormData, 
  ForgetPasswordRequest,
  UpdatePasswordRequest,
  SecurityQuestion,
  AuthError,
  AuthErrorCode 
} from '@/types/auth';

// =============================================================================
// VALIDATION CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Password validation configuration with enterprise-grade requirements
 * Aligned with OWASP password policy recommendations
 */
export const PASSWORD_CONFIG = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  FORBIDDEN_SEQUENCES: ['123456', 'password', 'qwerty', 'admin'],
} as const;

/**
 * Email validation patterns supporting international domains
 * RFC 5322 compliant with practical limitations
 */
export const EMAIL_CONFIG = {
  MAX_LENGTH: 254,
  MIN_LENGTH: 5,
  PATTERN: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
} as const;

/**
 * Username validation configuration for system consistency
 * Supports alphanumeric usernames with specific allowed characters
 */
export const USERNAME_CONFIG = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 50,
  PATTERN: /^[a-zA-Z0-9._-]+$/,
  FORBIDDEN_NAMES: ['admin', 'root', 'system', 'api', 'null', 'undefined'],
} as const;

/**
 * Confirmation code validation for password reset and registration
 * Supports various code formats and expiration checking
 */
export const CODE_CONFIG = {
  LENGTH: 6,
  PATTERN: /^[A-Z0-9]{6}$/,
  EXPIRY_MINUTES: 15,
  MAX_ATTEMPTS: 5,
} as const;

/**
 * Security question validation configuration
 * Ensures adequate complexity for password recovery security
 */
export const SECURITY_QUESTION_CONFIG = {
  MIN_ANSWER_LENGTH: 3,
  MAX_ANSWER_LENGTH: 100,
  MIN_QUESTION_LENGTH: 10,
  MAX_QUESTION_LENGTH: 200,
} as const;

// =============================================================================
// CORE VALIDATION UTILITIES
// =============================================================================

/**
 * Creates a comprehensive password validation schema with configurable requirements
 * Includes strength checking, forbidden sequences, and accessibility-friendly error messages
 * 
 * @param options - Optional configuration overrides
 * @returns Zod schema for password validation
 */
export function createPasswordSchema(options?: {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  customForbiddenSequences?: string[];
}) {
  const config = { ...PASSWORD_CONFIG, ...options };

  return z.string()
    .min(config.MIN_LENGTH, `Password must be at least ${config.MIN_LENGTH} characters long`)
    .max(config.MAX_LENGTH, `Password must not exceed ${config.MAX_LENGTH} characters`)
    .refine(
      (password) => !config.REQUIRE_UPPERCASE || /[A-Z]/.test(password),
      { message: 'Password must contain at least one uppercase letter' }
    )
    .refine(
      (password) => !config.REQUIRE_LOWERCASE || /[a-z]/.test(password),
      { message: 'Password must contain at least one lowercase letter' }
    )
    .refine(
      (password) => !config.REQUIRE_NUMBERS || /\d/.test(password),
      { message: 'Password must contain at least one number' }
    )
    .refine(
      (password) => !config.REQUIRE_SPECIAL_CHARS || /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      { message: 'Password must contain at least one special character' }
    )
    .refine(
      (password) => {
        const forbiddenSequences = config.FORBIDDEN_SEQUENCES.concat(options?.customForbiddenSequences || []);
        return !forbiddenSequences.some(seq => password.toLowerCase().includes(seq.toLowerCase()));
      },
      { message: 'Password contains forbidden sequences or common passwords' }
    );
}

/**
 * Password confirmation validator with real-time matching feedback
 * Optimized for React Hook Form with immediate validation response
 * 
 * @param password - Original password field value
 * @param confirmPassword - Password confirmation field value
 * @returns Validation result with user-friendly error messages
 */
export function validatePasswordMatch(password: string, confirmPassword: string): {
  isValid: boolean;
  error?: string;
  strength?: 'weak' | 'medium' | 'strong';
} {
  // Early return for empty confirmation field to avoid premature errors
  if (!confirmPassword) {
    return { isValid: false };
  }

  // Check password match
  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: 'Passwords do not match. Please ensure both password fields are identical.',
    };
  }

  // Calculate password strength for additional feedback
  const strength = calculatePasswordStrength(password);

  return {
    isValid: true,
    strength,
  };
}

/**
 * Calculates password strength based on complexity metrics
 * Provides user feedback for password quality improvement
 * 
 * @param password - Password to analyze
 * @returns Password strength level
 */
export function calculatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  let score = 0;

  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety scoring
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

  // Avoid common patterns
  if (!/(.)\1{2,}/.test(password)) score += 1; // No repeated characters
  if (!/012|123|234|345|456|567|678|789|890/.test(password)) score += 1; // No sequential numbers
  if (!/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/.test(password.toLowerCase())) score += 1; // No sequential letters

  if (score <= 3) return 'weak';
  if (score <= 6) return 'medium';
  return 'strong';
}

// =============================================================================
// EMAIL AND USERNAME VALIDATION
// =============================================================================

/**
 * Dynamic email/username validation with system configuration support
 * Adapts validation rules based on authentication service configuration
 * 
 * @param value - Email or username value to validate
 * @param mode - Validation mode: 'email', 'username', or 'auto'
 * @param config - Optional configuration for custom validation rules
 * @returns Validation result with detailed error information
 */
export function validateEmailOrUsername(
  value: string,
  mode: 'email' | 'username' | 'auto' = 'auto',
  config?: {
    allowEmail?: boolean;
    allowUsername?: boolean;
    customEmailPattern?: RegExp;
    customUsernamePattern?: RegExp;
  }
): {
  isValid: boolean;
  type?: 'email' | 'username';
  error?: string;
} {
  if (!value || !value.trim()) {
    return {
      isValid: false,
      error: 'Email or username is required for authentication',
    };
  }

  const trimmedValue = value.trim();

  // Auto-detect mode based on presence of @ symbol
  if (mode === 'auto') {
    mode = trimmedValue.includes('@') ? 'email' : 'username';
  }

  // Check if the detected/specified mode is allowed
  const allowEmail = config?.allowEmail ?? true;
  const allowUsername = config?.allowUsername ?? true;

  if (mode === 'email' && !allowEmail) {
    return {
      isValid: false,
      error: 'Email authentication is not enabled. Please use username instead.',
    };
  }

  if (mode === 'username' && !allowUsername) {
    return {
      isValid: false,
      error: 'Username authentication is not enabled. Please use email instead.',
    };
  }

  // Validate email format
  if (mode === 'email') {
    const emailPattern = config?.customEmailPattern || EMAIL_CONFIG.PATTERN;
    
    if (trimmedValue.length < EMAIL_CONFIG.MIN_LENGTH) {
      return {
        isValid: false,
        error: `Email must be at least ${EMAIL_CONFIG.MIN_LENGTH} characters long`,
      };
    }

    if (trimmedValue.length > EMAIL_CONFIG.MAX_LENGTH) {
      return {
        isValid: false,
        error: `Email must not exceed ${EMAIL_CONFIG.MAX_LENGTH} characters`,
      };
    }

    if (!emailPattern.test(trimmedValue)) {
      return {
        isValid: false,
        error: 'Please enter a valid email address (e.g., user@example.com)',
      };
    }

    return {
      isValid: true,
      type: 'email',
    };
  }

  // Validate username format
  if (mode === 'username') {
    const usernamePattern = config?.customUsernamePattern || USERNAME_CONFIG.PATTERN;

    if (trimmedValue.length < USERNAME_CONFIG.MIN_LENGTH) {
      return {
        isValid: false,
        error: `Username must be at least ${USERNAME_CONFIG.MIN_LENGTH} characters long`,
      };
    }

    if (trimmedValue.length > USERNAME_CONFIG.MAX_LENGTH) {
      return {
        isValid: false,
        error: `Username must not exceed ${USERNAME_CONFIG.MAX_LENGTH} characters`,
      };
    }

    if (!usernamePattern.test(trimmedValue)) {
      return {
        isValid: false,
        error: 'Username can only contain letters, numbers, dots, underscores, and hyphens',
      };
    }

    if (USERNAME_CONFIG.FORBIDDEN_NAMES.includes(trimmedValue.toLowerCase())) {
      return {
        isValid: false,
        error: 'This username is reserved. Please choose a different username.',
      };
    }

    return {
      isValid: true,
      type: 'username',
    };
  }

  return {
    isValid: false,
    error: 'Invalid authentication mode specified',
  };
}

// =============================================================================
// SECURITY QUESTION VALIDATION
// =============================================================================

/**
 * Security question validation for account recovery workflows
 * Ensures adequate security while maintaining usability
 * 
 * @param question - Security question text
 * @param answer - Security question answer
 * @returns Validation result with detailed feedback
 */
export function validateSecurityQuestion(
  question?: string,
  answer?: string
): {
  isValid: boolean;
  questionError?: string;
  answerError?: string;
  suggestions?: string[];
} {
  const errors: { questionError?: string; answerError?: string } = {};
  const suggestions: string[] = [];

  // Validate question
  if (!question || !question.trim()) {
    errors.questionError = 'Security question is required for account recovery';
  } else {
    const trimmedQuestion = question.trim();

    if (trimmedQuestion.length < SECURITY_QUESTION_CONFIG.MIN_QUESTION_LENGTH) {
      errors.questionError = `Security question must be at least ${SECURITY_QUESTION_CONFIG.MIN_QUESTION_LENGTH} characters long`;
    }

    if (trimmedQuestion.length > SECURITY_QUESTION_CONFIG.MAX_QUESTION_LENGTH) {
      errors.questionError = `Security question must not exceed ${SECURITY_QUESTION_CONFIG.MAX_QUESTION_LENGTH} characters`;
    }

    // Check for question mark
    if (!trimmedQuestion.endsWith('?')) {
      suggestions.push('Consider ending your security question with a question mark');
    }

    // Check for generic questions that might be easily guessed
    const genericPatterns = [
      /what.*color/i,
      /favorite.*food/i,
      /mother.*maiden.*name/i,
      /pet.*name/i,
    ];

    if (genericPatterns.some(pattern => pattern.test(trimmedQuestion))) {
      suggestions.push('Consider using a more specific and personal security question');
    }
  }

  // Validate answer
  if (!answer || !answer.trim()) {
    errors.answerError = 'Security answer is required';
  } else {
    const trimmedAnswer = answer.trim();

    if (trimmedAnswer.length < SECURITY_QUESTION_CONFIG.MIN_ANSWER_LENGTH) {
      errors.answerError = `Security answer must be at least ${SECURITY_QUESTION_CONFIG.MIN_ANSWER_LENGTH} characters long`;
    }

    if (trimmedAnswer.length > SECURITY_QUESTION_CONFIG.MAX_ANSWER_LENGTH) {
      errors.answerError = `Security answer must not exceed ${SECURITY_QUESTION_CONFIG.MAX_ANSWER_LENGTH} characters`;
    }

    // Check for overly simple answers
    if (trimmedAnswer.length < 6 && /^[a-zA-Z]+$/.test(trimmedAnswer)) {
      suggestions.push('Consider providing a more detailed answer for better security');
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    ...errors,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}

// =============================================================================
// LDAP SERVICE VALIDATION
// =============================================================================

/**
 * LDAP service validation for multi-service authentication environments
 * Validates service selection and configuration parameters
 * 
 * @param serviceName - LDAP service identifier
 * @param config - Optional service configuration validation
 * @returns Validation result with service-specific error handling
 */
export function validateLDAPService(
  serviceName?: string,
  config?: {
    availableServices?: string[];
    requireServiceSelection?: boolean;
    customValidation?: (service: string) => boolean;
  }
): {
  isValid: boolean;
  error?: string;
  warnings?: string[];
} {
  const warnings: string[] = [];

  // Check if service selection is required
  if (config?.requireServiceSelection && (!serviceName || !serviceName.trim())) {
    return {
      isValid: false,
      error: 'LDAP service selection is required for authentication',
    };
  }

  // If no service provided and not required, return valid
  if (!serviceName || !serviceName.trim()) {
    return { isValid: true };
  }

  const trimmedService = serviceName.trim();

  // Validate service name format
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmedService)) {
    return {
      isValid: false,
      error: 'LDAP service name contains invalid characters. Use only letters, numbers, dots, underscores, and hyphens.',
    };
  }

  // Check against available services if provided
  if (config?.availableServices && config.availableServices.length > 0) {
    if (!config.availableServices.includes(trimmedService)) {
      return {
        isValid: false,
        error: `LDAP service "${trimmedService}" is not available. Please select from: ${config.availableServices.join(', ')}`,
      };
    }
  }

  // Apply custom validation if provided
  if (config?.customValidation && !config.customValidation(trimmedService)) {
    return {
      isValid: false,
      error: 'LDAP service validation failed. Please check service configuration.',
    };
  }

  // Add warnings for potential issues
  if (trimmedService.length > 50) {
    warnings.push('LDAP service name is unusually long. Verify this is correct.');
  }

  if (trimmedService.includes('test') || trimmedService.includes('dev')) {
    warnings.push('This appears to be a development LDAP service. Ensure this is intended for production use.');
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// =============================================================================
// CONFIRMATION CODE VALIDATION
// =============================================================================

/**
 * Confirmation code validation for registration and password reset workflows
 * Supports various code formats with expiration and attempt tracking
 * 
 * @param code - Confirmation code to validate
 * @param config - Validation configuration options
 * @returns Validation result with security considerations
 */
export function validateConfirmationCode(
  code?: string,
  config?: {
    expectedLength?: number;
    caseInsensitive?: boolean;
    allowNumericOnly?: boolean;
    allowAlphaOnly?: boolean;
    customPattern?: RegExp;
    expirationTime?: Date;
    attemptCount?: number;
    maxAttempts?: number;
  }
): {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  isExpired?: boolean;
  attemptsRemaining?: number;
} {
  const warnings: string[] = [];

  // Check basic requirements
  if (!code || !code.trim()) {
    return {
      isValid: false,
      error: 'Confirmation code is required to complete this action',
    };
  }

  const trimmedCode = code.trim();
  const expectedLength = config?.expectedLength || CODE_CONFIG.LENGTH;

  // Check code length
  if (trimmedCode.length !== expectedLength) {
    return {
      isValid: false,
      error: `Confirmation code must be exactly ${expectedLength} characters long`,
    };
  }

  // Check code format
  let pattern = config?.customPattern || CODE_CONFIG.PATTERN;
  
  if (config?.allowNumericOnly && /^\d+$/.test(trimmedCode)) {
    pattern = /^\d+$/;
  } else if (config?.allowAlphaOnly && /^[A-Za-z]+$/.test(trimmedCode)) {
    pattern = /^[A-Za-z]+$/i;
  }

  const codeToValidate = config?.caseInsensitive ? trimmedCode.toUpperCase() : trimmedCode;
  
  if (!pattern.test(codeToValidate)) {
    return {
      isValid: false,
      error: 'Confirmation code format is invalid. Please check the code and try again.',
    };
  }

  // Check expiration
  if (config?.expirationTime) {
    const now = new Date();
    if (now > config.expirationTime) {
      return {
        isValid: false,
        error: 'Confirmation code has expired. Please request a new code.',
        isExpired: true,
      };
    }

    // Warn if close to expiration
    const timeUntilExpiry = config.expirationTime.getTime() - now.getTime();
    const minutesUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60));
    
    if (minutesUntilExpiry <= 2) {
      warnings.push(`Confirmation code expires in ${minutesUntilExpiry} minute(s)`);
    }
  }

  // Check attempt limits
  const attemptCount = config?.attemptCount || 0;
  const maxAttempts = config?.maxAttempts || CODE_CONFIG.MAX_ATTEMPTS;
  const attemptsRemaining = maxAttempts - attemptCount;

  if (attemptCount >= maxAttempts) {
    return {
      isValid: false,
      error: 'Maximum confirmation attempts exceeded. Please request a new code.',
      attemptsRemaining: 0,
    };
  }

  if (attemptsRemaining <= 2) {
    warnings.push(`${attemptsRemaining} attempt(s) remaining`);
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    attemptsRemaining,
  };
}

// =============================================================================
// FORM VALIDATION COORDINATION
// =============================================================================

/**
 * Comprehensive login form validation with dynamic field handling
 * Supports both email/username authentication modes
 * 
 * @param credentials - Login form data to validate
 * @param config - Authentication configuration options
 * @returns Complete validation result for form error handling
 */
export function validateLoginForm(
  credentials: Partial<LoginCredentials>,
  config?: {
    allowEmail?: boolean;
    allowUsername?: boolean;
    requireServiceSelection?: boolean;
    availableServices?: string[];
    customPasswordValidation?: (password: string) => { isValid: boolean; error?: string };
  }
): {
  isValid: boolean;
  errors: Partial<Record<keyof LoginCredentials, string>>;
  fieldType?: 'email' | 'username';
  warnings?: string[];
} {
  const errors: Partial<Record<keyof LoginCredentials, string>> = {};
  const warnings: string[] = [];

  // Validate email/username field
  const identifierField = credentials.email || credentials.username;
  const emailUsernameValidation = validateEmailOrUsername(
    identifierField || '',
    'auto',
    {
      allowEmail: config?.allowEmail,
      allowUsername: config?.allowUsername,
    }
  );

  if (!emailUsernameValidation.isValid) {
    if (credentials.email) {
      errors.email = emailUsernameValidation.error;
    } else {
      errors.username = emailUsernameValidation.error;
    }
  }

  // Validate password
  if (!credentials.password || !credentials.password.trim()) {
    errors.password = 'Password is required for authentication';
  } else {
    // Use custom password validation if provided
    if (config?.customPasswordValidation) {
      const passwordValidation = config.customPasswordValidation(credentials.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.error;
      }
    } else {
      // Basic password validation for login (different from registration)
      if (credentials.password.length < 1) {
        errors.password = 'Password cannot be empty';
      }
    }
  }

  // Validate service selection if required
  if (config?.requireServiceSelection || credentials.service) {
    const serviceValidation = validateLDAPService(credentials.service, {
      requireServiceSelection: config?.requireServiceSelection,
      availableServices: config?.availableServices,
    });

    if (!serviceValidation.isValid) {
      errors.service = serviceValidation.error;
    }

    if (serviceValidation.warnings) {
      warnings.push(...serviceValidation.warnings);
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    fieldType: emailUsernameValidation.type,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Registration form validation with comprehensive field checking
 * Includes password confirmation and security question validation
 * 
 * @param formData - Registration form data including password confirmation
 * @param config - Registration configuration options
 * @returns Complete validation result for registration workflow
 */
export function validateRegistrationForm(
  formData: Partial<RegisterDetails & { 
    confirmPassword?: string; 
    securityQuestion?: string; 
    securityAnswer?: string; 
  }>,
  config?: {
    requireSecurityQuestion?: boolean;
    customPasswordRules?: Parameters<typeof createPasswordSchema>[0];
    customEmailValidation?: (email: string) => { isValid: boolean; error?: string };
  }
): {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: string[];
  passwordStrength?: 'weak' | 'medium' | 'strong';
} {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // Validate username
  if (!formData.username || !formData.username.trim()) {
    errors.username = 'Username is required for account creation';
  } else {
    const usernameValidation = validateEmailOrUsername(formData.username, 'username');
    if (!usernameValidation.isValid) {
      errors.username = usernameValidation.error || 'Invalid username format';
    }
  }

  // Validate email
  if (!formData.email || !formData.email.trim()) {
    errors.email = 'Email address is required for account creation';
  } else {
    if (config?.customEmailValidation) {
      const emailValidation = config.customEmailValidation(formData.email);
      if (!emailValidation.isValid) {
        errors.email = emailValidation.error || 'Invalid email address';
      }
    } else {
      const emailValidation = validateEmailOrUsername(formData.email, 'email');
      if (!emailValidation.isValid) {
        errors.email = emailValidation.error || 'Invalid email address';
      }
    }
  }

  // Validate name fields
  if (!formData.firstName || !formData.firstName.trim()) {
    errors.firstName = 'First name is required';
  } else if (formData.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters long';
  }

  if (!formData.lastName || !formData.lastName.trim()) {
    errors.lastName = 'Last name is required';
  } else if (formData.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters long';
  }

  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Full name is required';
  }

  // Validate password if provided
  let passwordStrength: 'weak' | 'medium' | 'strong' | undefined;
  if (formData.password) {
    try {
      const passwordSchema = createPasswordSchema(config?.customPasswordRules);
      passwordSchema.parse(formData.password);
      passwordStrength = calculatePasswordStrength(formData.password);
    } catch (zodError: any) {
      if (zodError.errors && zodError.errors[0]) {
        errors.password = zodError.errors[0].message;
      } else {
        errors.password = 'Password does not meet security requirements';
      }
    }

    // Validate password confirmation
    if (formData.confirmPassword !== undefined) {
      const confirmValidation = validatePasswordMatch(formData.password, formData.confirmPassword);
      if (!confirmValidation.isValid && confirmValidation.error) {
        errors.confirmPassword = confirmValidation.error;
      }
    }
  }

  // Validate security question if required
  if (config?.requireSecurityQuestion || formData.securityQuestion || formData.securityAnswer) {
    const securityValidation = validateSecurityQuestion(formData.securityQuestion, formData.securityAnswer);
    
    if (!securityValidation.isValid) {
      if (securityValidation.questionError) {
        errors.securityQuestion = securityValidation.questionError;
      }
      if (securityValidation.answerError) {
        errors.securityAnswer = securityValidation.answerError;
      }
    }

    if (securityValidation.suggestions) {
      warnings.push(...securityValidation.suggestions);
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
    passwordStrength,
  };
}

/**
 * Password reset form validation with security verification
 * Includes confirmation code and security question validation
 * 
 * @param formData - Password reset form data
 * @param config - Reset configuration options
 * @returns Complete validation result for password reset workflow
 */
export function validatePasswordResetForm(
  formData: Partial<ResetFormData>,
  config?: {
    requireSecurityQuestion?: boolean;
    codeConfig?: Parameters<typeof validateConfirmationCode>[1];
    passwordConfig?: Parameters<typeof createPasswordSchema>[0];
  }
): {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: string[];
  codeStatus?: {
    isExpired?: boolean;
    attemptsRemaining?: number;
  };
} {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];
  let codeStatus: { isExpired?: boolean; attemptsRemaining?: number } = {};

  // Validate email
  if (!formData.email || !formData.email.trim()) {
    errors.email = 'Email address is required for password reset';
  } else {
    const emailValidation = validateEmailOrUsername(formData.email, 'email');
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error || 'Invalid email address';
    }
  }

  // Validate username if provided
  if (formData.username) {
    const usernameValidation = validateEmailOrUsername(formData.username, 'username');
    if (!usernameValidation.isValid) {
      errors.username = usernameValidation.error || 'Invalid username';
    }
  }

  // Validate confirmation code
  if (!formData.code || !formData.code.trim()) {
    errors.code = 'Confirmation code is required to reset password';
  } else {
    const codeValidation = validateConfirmationCode(formData.code, config?.codeConfig);
    if (!codeValidation.isValid) {
      errors.code = codeValidation.error || 'Invalid confirmation code';
    }
    
    codeStatus = {
      isExpired: codeValidation.isExpired,
      attemptsRemaining: codeValidation.attemptsRemaining,
    };

    if (codeValidation.warnings) {
      warnings.push(...codeValidation.warnings);
    }
  }

  // Validate new password
  if (!formData.newPassword || !formData.newPassword.trim()) {
    errors.newPassword = 'New password is required';
  } else {
    try {
      const passwordSchema = createPasswordSchema(config?.passwordConfig);
      passwordSchema.parse(formData.newPassword);
    } catch (zodError: any) {
      if (zodError.errors && zodError.errors[0]) {
        errors.newPassword = zodError.errors[0].message;
      } else {
        errors.newPassword = 'New password does not meet security requirements';
      }
    }
  }

  // Validate security question if required
  if (config?.requireSecurityQuestion || formData.securityQuestion || formData.securityAnswer) {
    const securityValidation = validateSecurityQuestion(formData.securityQuestion, formData.securityAnswer);
    
    if (!securityValidation.isValid) {
      if (securityValidation.questionError) {
        errors.securityQuestion = securityValidation.questionError;
      }
      if (securityValidation.answerError) {
        errors.securityAnswer = securityValidation.answerError;
      }
    }

    if (securityValidation.suggestions) {
      warnings.push(...securityValidation.suggestions);
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
    codeStatus,
  };
}

// =============================================================================
// ERROR HANDLING AND ACCESSIBILITY HELPERS
// =============================================================================

/**
 * Creates accessible error messages with proper ARIA attributes
 * Ensures form validation errors are properly announced to screen readers
 * 
 * @param fieldName - Form field identifier
 * @param error - Error message to format
 * @param options - Accessibility and formatting options
 * @returns Formatted error object with accessibility attributes
 */
export function createAccessibleError(
  fieldName: string,
  error: string,
  options?: {
    includeAriaAttributes?: boolean;
    errorId?: string;
    priority?: 'polite' | 'assertive';
  }
): {
  message: string;
  ariaAttributes?: Record<string, string>;
  id: string;
} {
  const errorId = options?.errorId || `${fieldName}-error`;
  const priority = options?.priority || 'polite';

  const result = {
    message: error,
    id: errorId,
  };

  if (options?.includeAriaAttributes !== false) {
    return {
      ...result,
      ariaAttributes: {
        'aria-describedby': errorId,
        'aria-invalid': 'true',
        'aria-live': priority,
      },
    };
  }

  return result;
}

/**
 * Converts validation errors to AuthError format for consistent error handling
 * Provides standardized error structure across authentication workflows
 * 
 * @param validationErrors - Field validation errors
 * @param context - Additional error context
 * @returns Formatted AuthError object
 */
export function createAuthError(
  validationErrors: Record<string, string>,
  context?: string
): AuthError {
  const errorMessages = Object.entries(validationErrors)
    .map(([field, error]) => `${field}: ${error}`)
    .join('; ');

  return {
    code: AuthErrorCode.VALIDATION_ERROR,
    message: errorMessages || 'Validation failed',
    context,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Debounced validation function for real-time form feedback
 * Optimizes validation performance by reducing unnecessary calls
 * 
 * @param validationFn - Validation function to debounce
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Debounced validation function
 */
export function createDebouncedValidator<T extends any[], R>(
  validationFn: (...args: T) => R,
  delay: number = 300
): (...args: T) => Promise<R> {
  let timeoutId: NodeJS.Timeout;

  return (...args: T): Promise<R> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        resolve(validationFn(...args));
      }, delay);
    });
  };
}

// =============================================================================
// VALIDATION SCHEMA EXPORTS
// =============================================================================

/**
 * Pre-configured Zod schemas for common authentication forms
 * Ready-to-use schemas with comprehensive validation rules
 */
export const ValidationSchemas = {
  /**
   * Login form schema with dynamic email/username support
   */
  login: z.object({
    email: z.string().optional(),
    username: z.string().optional(),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
    service: z.string().optional(),
  }).refine(
    (data) => data.email || data.username,
    {
      message: 'Either email or username is required',
      path: ['email'],
    }
  ),

  /**
   * Registration form schema with password confirmation
   */
  registration: z.object({
    username: z.string().min(USERNAME_CONFIG.MIN_LENGTH).max(USERNAME_CONFIG.MAX_LENGTH),
    email: z.string().email(),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    name: z.string().min(1, 'Full name is required'),
    password: createPasswordSchema(),
    confirmPassword: z.string(),
    securityQuestion: z.string().min(SECURITY_QUESTION_CONFIG.MIN_QUESTION_LENGTH).optional(),
    securityAnswer: z.string().min(SECURITY_QUESTION_CONFIG.MIN_ANSWER_LENGTH).optional(),
  }).refine(
    (data) => data.password === data.confirmPassword,
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  ),

  /**
   * Password reset form schema with confirmation code
   */
  passwordReset: z.object({
    email: z.string().email(),
    username: z.string().optional(),
    code: z.string().length(CODE_CONFIG.LENGTH),
    newPassword: createPasswordSchema(),
    securityQuestion: z.string().optional(),
    securityAnswer: z.string().optional(),
  }),

  /**
   * Forget password request schema
   */
  forgetPassword: z.object({
    email: z.string().email().optional(),
    username: z.string().min(USERNAME_CONFIG.MIN_LENGTH).optional(),
  }).refine(
    (data) => data.email || data.username,
    {
      message: 'Either email or username is required',
      path: ['email'],
    }
  ),

  /**
   * Password update schema for authenticated users
   */
  updatePassword: z.object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: createPasswordSchema(),
    confirmPassword: z.string(),
  }).refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: 'New passwords do not match',
      path: ['confirmPassword'],
    }
  ),
} as const;

// Export all validation utilities for convenient importing
export type {
  // Re-export auth types for validator consumers
  LoginCredentials,
  RegisterDetails,
  ResetFormData,
  ForgetPasswordRequest,
  UpdatePasswordRequest,
  SecurityQuestion,
  AuthError,
};

export {
  // Configuration constants
  PASSWORD_CONFIG,
  EMAIL_CONFIG,
  USERNAME_CONFIG,
  CODE_CONFIG,
  SECURITY_QUESTION_CONFIG,
  
  // Core validation functions
  createPasswordSchema,
  validatePasswordMatch,
  calculatePasswordStrength,
  validateEmailOrUsername,
  validateSecurityQuestion,
  validateLDAPService,
  validateConfirmationCode,
  
  // Form validation coordinators
  validateLoginForm,
  validateRegistrationForm,
  validatePasswordResetForm,
  
  // Error handling utilities
  createAccessibleError,
  createAuthError,
  createDebouncedValidator,
  
  // Pre-configured schemas
  ValidationSchemas,
};