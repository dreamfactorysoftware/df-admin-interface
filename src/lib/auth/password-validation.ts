/**
 * Password Validation Utilities for DreamFactory Admin Interface
 * 
 * Provides comprehensive password validation including strength checking, policy enforcement,
 * and security requirements validation for React/Next.js authentication forms.
 * 
 * Key features:
 * - 16-character minimum password requirements per security specifications
 * - Configurable password complexity validation with character class requirements
 * - Real-time password matching validation for confirmation fields
 * - User-friendly error messages and validation feedback
 * - Security scoring and strength indicators for user guidance
 * - Enterprise security features including password rotation and expiration
 * - Integration with React Hook Form and Zod validation schemas
 * 
 * @version 1.0.0
 * @author DreamFactory Platform Team
 */

import { z } from 'zod';
import type { 
  UpdatePasswordRequest, 
  ResetFormData, 
  SecurityQuestion,
  AuthError 
} from '@/types/auth';

// =============================================================================
// PASSWORD POLICY CONFIGURATION
// =============================================================================

/**
 * Password complexity requirements configuration
 * Defines character class requirements and validation rules per security specifications
 */
export interface PasswordPolicy {
  /** Minimum password length (16 characters per security specifications) */
  minLength: number;
  /** Maximum password length to prevent DoS attacks */
  maxLength: number;
  /** Require uppercase letters */
  requireUppercase: boolean;
  /** Require lowercase letters */
  requireLowercase: boolean;
  /** Require numeric digits */
  requireNumbers: boolean;
  /** Require special characters */
  requireSpecialChars: boolean;
  /** Minimum number of character classes required */
  minCharacterClasses: number;
  /** Prevent common passwords */
  preventCommonPasswords: boolean;
  /** Prevent username/email in password */
  preventPersonalInfo: boolean;
  /** Maximum consecutive repeated characters */
  maxConsecutiveChars: number;
  /** Password expiration in days (0 = no expiration) */
  expirationDays: number;
  /** Password history count to prevent reuse */
  historyCount: number;
}

/**
 * Default password policy based on enterprise security requirements
 * Implements 16-character minimum with comprehensive complexity requirements
 */
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 16,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minCharacterClasses: 3,
  preventCommonPasswords: true,
  preventPersonalInfo: true,
  maxConsecutiveChars: 3,
  expirationDays: 90,
  historyCount: 12,
};

/**
 * Password strength levels for user guidance
 */
export enum PasswordStrength {
  VERY_WEAK = 0,
  WEAK = 1,
  FAIR = 2,
  GOOD = 3,
  STRONG = 4,
  VERY_STRONG = 5,
}

/**
 * Password validation result interface
 * Provides comprehensive validation feedback for forms
 */
export interface PasswordValidationResult {
  /** Overall validation result */
  isValid: boolean;
  /** Password strength score (0-5) */
  strength: PasswordStrength;
  /** Strength percentage for progress indicators */
  strengthPercentage: number;
  /** User-friendly error messages */
  errors: string[];
  /** Helpful suggestions for improvement */
  suggestions: string[];
  /** Character class requirements met */
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
    noCommonPassword: boolean;
    noPersonalInfo: boolean;
    noConsecutiveChars: boolean;
  };
  /** Security score breakdown */
  scoreBreakdown: {
    lengthScore: number;
    complexityScore: number;
    diversityScore: number;
    securityScore: number;
  };
}

/**
 * Password matching validation result
 */
export interface PasswordMatchResult {
  /** Passwords match */
  matches: boolean;
  /** Error message if passwords don't match */
  error?: string;
}

/**
 * Password expiration check result
 */
export interface PasswordExpirationResult {
  /** Password is expired */
  isExpired: boolean;
  /** Days until expiration (negative if expired) */
  daysUntilExpiration: number;
  /** Warning threshold reached */
  warningThreshold: boolean;
  /** Human-readable expiration message */
  message: string;
}

// =============================================================================
// COMMON PASSWORD DETECTION
// =============================================================================

/**
 * Common passwords to prevent usage
 * Limited set for security - comprehensive list should be server-side
 */
const COMMON_PASSWORDS = new Set([
  'password', 'password123', '123456789', 'qwertyuiop',
  'administrator', 'dreamfactory', 'admin123456',
  'letmein123456789', 'welcome123456789', 'password1234567890',
  '1234567890123456', 'abcdefghijklmnop', 'qwertyuiopasdfgh',
]);

/**
 * Special characters allowed in passwords
 */
const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

// =============================================================================
// CORE VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates password strength and complexity according to policy
 * 
 * @param password - Password to validate
 * @param policy - Password policy configuration (optional, uses default)
 * @param personalInfo - Personal information to check against (email, username, name)
 * @returns Comprehensive validation result with strength scoring
 */
export function validatePasswordStrength(
  password: string,
  policy: Partial<PasswordPolicy> = {},
  personalInfo: { email?: string; username?: string; name?: string } = {}
): PasswordValidationResult {
  const appliedPolicy = { ...DEFAULT_PASSWORD_POLICY, ...policy };
  const errors: string[] = [];
  const suggestions: string[] = [];
  
  // Initialize requirements tracking
  const requirements = {
    minLength: password.length >= appliedPolicy.minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: new RegExp(`[${SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password),
    noCommonPassword: !COMMON_PASSWORDS.has(password.toLowerCase()),
    noPersonalInfo: !containsPersonalInfo(password, personalInfo),
    noConsecutiveChars: !hasConsecutiveChars(password, appliedPolicy.maxConsecutiveChars),
  };

  // Check minimum length requirement
  if (!requirements.minLength) {
    errors.push(`Password must be at least ${appliedPolicy.minLength} characters long`);
    suggestions.push(`Add ${appliedPolicy.minLength - password.length} more characters`);
  }

  // Check maximum length
  if (password.length > appliedPolicy.maxLength) {
    errors.push(`Password must not exceed ${appliedPolicy.maxLength} characters`);
  }

  // Check character class requirements
  if (appliedPolicy.requireUppercase && !requirements.hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
    suggestions.push('Add an uppercase letter (A-Z)');
  }

  if (appliedPolicy.requireLowercase && !requirements.hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
    suggestions.push('Add a lowercase letter (a-z)');
  }

  if (appliedPolicy.requireNumbers && !requirements.hasNumbers) {
    errors.push('Password must contain at least one number');
    suggestions.push('Add a number (0-9)');
  }

  if (appliedPolicy.requireSpecialChars && !requirements.hasSpecialChars) {
    errors.push('Password must contain at least one special character');
    suggestions.push(`Add a special character (${SPECIAL_CHARS})`);
  }

  // Check character class diversity
  const characterClasses = [
    requirements.hasUppercase,
    requirements.hasLowercase,
    requirements.hasNumbers,
    requirements.hasSpecialChars,
  ].filter(Boolean).length;

  if (characterClasses < appliedPolicy.minCharacterClasses) {
    errors.push(`Password must use at least ${appliedPolicy.minCharacterClasses} different character types`);
    suggestions.push('Mix uppercase, lowercase, numbers, and special characters');
  }

  // Check common password prevention
  if (appliedPolicy.preventCommonPasswords && !requirements.noCommonPassword) {
    errors.push('Password is too common and easily guessed');
    suggestions.push('Choose a more unique password');
  }

  // Check personal information prevention
  if (appliedPolicy.preventPersonalInfo && !requirements.noPersonalInfo) {
    errors.push('Password must not contain personal information');
    suggestions.push('Avoid using your email, username, or name in the password');
  }

  // Check consecutive characters
  if (!requirements.noConsecutiveChars) {
    errors.push(`Password must not have more than ${appliedPolicy.maxConsecutiveChars} consecutive identical characters`);
    suggestions.push('Avoid repeating the same character multiple times');
  }

  // Calculate strength scores
  const scoreBreakdown = calculatePasswordScore(password, requirements, appliedPolicy);
  const overallScore = (
    scoreBreakdown.lengthScore +
    scoreBreakdown.complexityScore +
    scoreBreakdown.diversityScore +
    scoreBreakdown.securityScore
  ) / 4;

  const strength = getPasswordStrength(overallScore);
  const strengthPercentage = Math.round(overallScore * 20); // Convert to 0-100%

  return {
    isValid: errors.length === 0 && strength >= PasswordStrength.GOOD,
    strength,
    strengthPercentage,
    errors,
    suggestions,
    requirements,
    scoreBreakdown,
  };
}

/**
 * Validates that two passwords match
 * 
 * @param password - Primary password
 * @param confirmPassword - Confirmation password
 * @returns Password match validation result
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): PasswordMatchResult {
  const matches = password === confirmPassword;
  
  return {
    matches,
    error: matches ? undefined : 'Passwords do not match',
  };
}

/**
 * Checks if password has expired based on policy and last change date
 * 
 * @param lastPasswordChange - Date of last password change
 * @param policy - Password policy with expiration settings
 * @returns Password expiration status
 */
export function checkPasswordExpiration(
  lastPasswordChange: Date,
  policy: Partial<PasswordPolicy> = {}
): PasswordExpirationResult {
  const appliedPolicy = { ...DEFAULT_PASSWORD_POLICY, ...policy };
  
  // If no expiration policy, password never expires
  if (appliedPolicy.expirationDays === 0) {
    return {
      isExpired: false,
      daysUntilExpiration: Infinity,
      warningThreshold: false,
      message: 'Password does not expire',
    };
  }

  const now = new Date();
  const expirationDate = new Date(lastPasswordChange);
  expirationDate.setDate(expirationDate.getDate() + appliedPolicy.expirationDays);
  
  const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysUntilExpiration <= 0;
  const warningThreshold = daysUntilExpiration <= 7 && daysUntilExpiration > 0;

  let message: string;
  if (isExpired) {
    message = `Password expired ${Math.abs(daysUntilExpiration)} day(s) ago`;
  } else if (warningThreshold) {
    message = `Password expires in ${daysUntilExpiration} day(s)`;
  } else {
    message = `Password expires on ${expirationDate.toLocaleDateString()}`;
  }

  return {
    isExpired,
    daysUntilExpiration,
    warningThreshold,
    message,
  };
}

/**
 * Validates password rotation requirements
 * Checks if password was used recently based on history
 * 
 * @param newPassword - New password to validate
 * @param passwordHistory - Array of recent password hashes
 * @param policy - Password policy with history settings
 * @returns Validation result for password reuse
 */
export function validatePasswordRotation(
  newPassword: string,
  passwordHistory: string[] = [],
  policy: Partial<PasswordPolicy> = {}
): { isValid: boolean; error?: string } {
  const appliedPolicy = { ...DEFAULT_PASSWORD_POLICY, ...policy };
  
  // If no history policy, allow any password
  if (appliedPolicy.historyCount === 0) {
    return { isValid: true };
  }

  // Note: In production, this should hash the password and compare hashes
  // For security reasons, we're providing a placeholder implementation
  const hashedNewPassword = hashPassword(newPassword);
  const recentPasswords = passwordHistory.slice(-appliedPolicy.historyCount);
  
  if (recentPasswords.includes(hashedNewPassword)) {
    return {
      isValid: false,
      error: `Password cannot be the same as your last ${appliedPolicy.historyCount} passwords`,
    };
  }

  return { isValid: true };
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Creates a Zod schema for password validation with configurable policy
 * 
 * @param policy - Password policy configuration
 * @param personalInfo - Personal information for validation
 * @returns Zod schema for password validation
 */
export function createPasswordSchema(
  policy: Partial<PasswordPolicy> = {},
  personalInfo: { email?: string; username?: string; name?: string } = {}
) {
  return z.string()
    .min(1, 'Password is required')
    .refine((password) => {
      const result = validatePasswordStrength(password, policy, personalInfo);
      return result.isValid;
    }, (password) => {
      const result = validatePasswordStrength(password, policy, personalInfo);
      return {
        message: result.errors[0] || 'Password does not meet security requirements',
      };
    });
}

/**
 * Creates a Zod schema for password confirmation fields
 * 
 * @param passwordField - Name of the password field to match against
 * @returns Zod schema for password confirmation
 */
export function createPasswordConfirmSchema(passwordField: string = 'password') {
  return z.string()
    .min(1, 'Password confirmation is required')
    .refine((confirmPassword, ctx) => {
      const password = ctx.path.length > 0 ? 
        (ctx as any).parent?.[passwordField] : 
        undefined;
      
      if (!password) return true; // Let password field handle its own validation
      
      const result = validatePasswordMatch(password, confirmPassword);
      return result.matches;
    }, 'Passwords do not match');
}

/**
 * Password update request schema with current password verification
 */
export const updatePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: createPasswordSchema(),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => {
  const result = validatePasswordMatch(data.newPassword, data.confirmPassword);
  return result.matches;
}, {
  message: 'New password and confirmation do not match',
  path: ['confirmPassword'],
});

/**
 * Password reset form schema with security question validation
 */
export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(1, 'Username is required'),
  code: z.string().min(1, 'Verification code is required'),
  newPassword: createPasswordSchema(),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
  securityQuestion: z.string().optional(),
  securityAnswer: z.string().optional(),
}).refine((data) => {
  const result = validatePasswordMatch(data.newPassword, data.confirmPassword);
  return result.matches;
}, {
  message: 'New password and confirmation do not match',
  path: ['confirmPassword'],
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Checks if password contains personal information
 * 
 * @param password - Password to check
 * @param personalInfo - Personal information to check against
 * @returns True if password contains personal information
 */
function containsPersonalInfo(
  password: string,
  personalInfo: { email?: string; username?: string; name?: string }
): boolean {
  const lowerPassword = password.toLowerCase();
  
  // Check email (remove domain)
  if (personalInfo.email) {
    const emailLocal = personalInfo.email.split('@')[0].toLowerCase();
    if (emailLocal.length >= 3 && lowerPassword.includes(emailLocal)) {
      return true;
    }
  }

  // Check username
  if (personalInfo.username && personalInfo.username.length >= 3) {
    if (lowerPassword.includes(personalInfo.username.toLowerCase())) {
      return true;
    }
  }

  // Check name parts
  if (personalInfo.name) {
    const nameParts = personalInfo.name.toLowerCase().split(/\s+/);
    for (const part of nameParts) {
      if (part.length >= 3 && lowerPassword.includes(part)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks for consecutive repeated characters
 * 
 * @param password - Password to check
 * @param maxConsecutive - Maximum allowed consecutive characters
 * @returns True if password has too many consecutive characters
 */
function hasConsecutiveChars(password: string, maxConsecutive: number): boolean {
  let consecutiveCount = 1;
  let previousChar = '';

  for (const char of password) {
    if (char === previousChar) {
      consecutiveCount++;
      if (consecutiveCount > maxConsecutive) {
        return true;
      }
    } else {
      consecutiveCount = 1;
    }
    previousChar = char;
  }

  return false;
}

/**
 * Calculates detailed password strength scores
 * 
 * @param password - Password to score
 * @param requirements - Requirements validation results
 * @param policy - Password policy configuration
 * @returns Detailed score breakdown
 */
function calculatePasswordScore(
  password: string,
  requirements: PasswordValidationResult['requirements'],
  policy: PasswordPolicy
): PasswordValidationResult['scoreBreakdown'] {
  // Length score (0-5)
  const lengthScore = Math.min(5, Math.max(0, (password.length - 8) / 4));

  // Complexity score (0-5) based on character classes
  const complexityScore = [
    requirements.hasUppercase,
    requirements.hasLowercase,
    requirements.hasNumbers,
    requirements.hasSpecialChars,
  ].filter(Boolean).length * 1.25;

  // Diversity score (0-5) based on unique characters and patterns
  const uniqueChars = new Set(password).size;
  const diversityScore = Math.min(5, (uniqueChars / password.length) * 10);

  // Security score (0-5) based on security requirements
  let securityScore = 5;
  if (!requirements.noCommonPassword) securityScore -= 2;
  if (!requirements.noPersonalInfo) securityScore -= 1.5;
  if (!requirements.noConsecutiveChars) securityScore -= 1;
  securityScore = Math.max(0, securityScore);

  return {
    lengthScore,
    complexityScore,
    diversityScore,
    securityScore,
  };
}

/**
 * Converts numeric score to password strength enum
 * 
 * @param score - Numeric score (0-5)
 * @returns Password strength level
 */
function getPasswordStrength(score: number): PasswordStrength {
  if (score < 1) return PasswordStrength.VERY_WEAK;
  if (score < 2) return PasswordStrength.WEAK;
  if (score < 3) return PasswordStrength.FAIR;
  if (score < 4) return PasswordStrength.GOOD;
  if (score < 4.5) return PasswordStrength.STRONG;
  return PasswordStrength.VERY_STRONG;
}

/**
 * Simple password hashing for demonstration
 * Note: In production, use a proper password hashing library like bcrypt
 * 
 * @param password - Password to hash
 * @returns Hashed password
 */
function hashPassword(password: string): string {
  // This is a placeholder implementation
  // In production, use bcrypt or similar secure hashing
  return Buffer.from(password).toString('base64');
}

// =============================================================================
// UTILITY FUNCTIONS FOR FORMS
// =============================================================================

/**
 * Gets user-friendly password strength label
 * 
 * @param strength - Password strength level
 * @returns Human-readable strength description
 */
export function getPasswordStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case PasswordStrength.VERY_WEAK:
      return 'Very Weak';
    case PasswordStrength.WEAK:
      return 'Weak';
    case PasswordStrength.FAIR:
      return 'Fair';
    case PasswordStrength.GOOD:
      return 'Good';
    case PasswordStrength.STRONG:
      return 'Strong';
    case PasswordStrength.VERY_STRONG:
      return 'Very Strong';
    default:
      return 'Unknown';
  }
}

/**
 * Gets color code for password strength visualization
 * 
 * @param strength - Password strength level
 * @returns CSS color class or hex color
 */
export function getPasswordStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case PasswordStrength.VERY_WEAK:
      return '#ef4444'; // red-500
    case PasswordStrength.WEAK:
      return '#f97316'; // orange-500
    case PasswordStrength.FAIR:
      return '#eab308'; // yellow-500
    case PasswordStrength.GOOD:
      return '#22c55e'; // green-500
    case PasswordStrength.STRONG:
      return '#059669'; // emerald-600
    case PasswordStrength.VERY_STRONG:
      return '#047857'; // emerald-700
    default:
      return '#6b7280'; // gray-500
  }
}

/**
 * Creates password strength progress bar data
 * 
 * @param result - Password validation result
 * @returns Progress bar configuration
 */
export function getPasswordStrengthProgress(result: PasswordValidationResult) {
  return {
    percentage: result.strengthPercentage,
    color: getPasswordStrengthColor(result.strength),
    label: getPasswordStrengthLabel(result.strength),
    showPercentage: result.strength >= PasswordStrength.FAIR,
  };
}

/**
 * Debounced password validation for real-time feedback
 * 
 * @param password - Password to validate
 * @param policy - Password policy configuration
 * @param personalInfo - Personal information for validation
 * @param debounceMs - Debounce delay in milliseconds
 * @returns Promise with validation result
 */
export function debouncePasswordValidation(
  password: string,
  policy: Partial<PasswordPolicy> = {},
  personalInfo: { email?: string; username?: string; name?: string } = {},
  debounceMs: number = 300
): Promise<PasswordValidationResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = validatePasswordStrength(password, policy, personalInfo);
      resolve(result);
    }, debounceMs);
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  type PasswordPolicy,
  type PasswordValidationResult,
  type PasswordMatchResult,
  type PasswordExpirationResult,
  PasswordStrength,
  DEFAULT_PASSWORD_POLICY,
  updatePasswordSchema,
  resetPasswordSchema,
};