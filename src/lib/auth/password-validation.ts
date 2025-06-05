/**
 * Password Validation Utilities
 * 
 * Provides comprehensive password validation with enterprise security features
 * including strength checking, policy enforcement, and security requirements validation.
 * Implements 16-character minimum requirement per security specifications.
 */

import { z } from 'zod'

// Types for password validation results and configuration
export interface PasswordValidationResult {
  isValid: boolean
  score: number
  strength: PasswordStrength
  errors: string[]
  feedback: string[]
  entropy: number
}

export interface PasswordMatchResult {
  isMatch: boolean
  errors: string[]
}

export interface PasswordPolicyConfig {
  minLength: number
  maxLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  minSpecialChars: number
  forbiddenPatterns: string[]
  preventCommonPasswords: boolean
  preventUserInfo: boolean
  maxRepeatingChars: number
  preventSequentialChars: boolean
}

export interface PasswordExpirationConfig {
  maxAgeInDays: number
  warningThresholdInDays: number
  enforceRotation: boolean
  preventReuse: number
}

export interface UserPasswordContext {
  email?: string
  firstName?: string
  lastName?: string
  username?: string
  previousPasswords?: string[]
  lastPasswordChange?: Date
}

export type PasswordStrength = 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong'

// Default security policy configuration per DreamFactory specifications
export const DEFAULT_PASSWORD_POLICY: PasswordPolicyConfig = {
  minLength: 16, // Per security specifications
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minSpecialChars: 2,
  forbiddenPatterns: [
    'password',
    'admin',
    'dreamfactory',
    'qwerty',
    '123456',
    'letmein',
    'welcome',
    'changeme'
  ],
  preventCommonPasswords: true,
  preventUserInfo: true,
  maxRepeatingChars: 2,
  preventSequentialChars: true
}

export const DEFAULT_EXPIRATION_CONFIG: PasswordExpirationConfig = {
  maxAgeInDays: 90,
  warningThresholdInDays: 14,
  enforceRotation: true,
  preventReuse: 12
}

// Common weak passwords list (subset for security)
const COMMON_PASSWORDS = new Set([
  'password123456789',
  '1234567890123456',
  'qwertyuiopasdfgh',
  'passwordpassword',
  'adminadminadmin',
  'letmeinletmein12',
  'welcome123456789',
  'changemechangeme',
  '!@#$%^&*()123456',
  'abcdefghijklmnop'
])

// Character sets for complexity validation
const CHARACTER_SETS = {
  lowercase: /[a-z]/,
  uppercase: /[A-Z]/,
  numbers: /[0-9]/,
  specialChars: /[!@#$%^&*(),.?":{}|<>]/,
  extendedSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/
}

// Sequential patterns to detect
const SEQUENTIAL_PATTERNS = [
  'abcdefghijklmnopqrstuvwxyz',
  'qwertyuiopasdfghjklzxcvbnm',
  '1234567890',
  '0987654321'
]

/**
 * Zod schema for password validation
 */
export const passwordSchema = z.string()
  .min(16, 'Password must be at least 16 characters long per security requirements')
  .max(128, 'Password must not exceed 128 characters')
  .refine(
    (password) => /[a-z]/.test(password),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (password) => /[A-Z]/.test(password),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (password) => /[0-9]/.test(password),
    'Password must contain at least one number'
  )
  .refine(
    (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
    'Password must contain at least one special character'
  )

/**
 * Calculate password entropy for strength assessment
 */
function calculateEntropy(password: string): number {
  const charsetSize = getCharsetSize(password)
  return Math.log2(Math.pow(charsetSize, password.length))
}

/**
 * Determine character set size for entropy calculation
 */
function getCharsetSize(password: string): number {
  let size = 0
  
  if (CHARACTER_SETS.lowercase.test(password)) size += 26
  if (CHARACTER_SETS.uppercase.test(password)) size += 26
  if (CHARACTER_SETS.numbers.test(password)) size += 10
  if (CHARACTER_SETS.extendedSpecial.test(password)) size += 32
  
  return Math.max(size, 10) // Minimum charset size
}

/**
 * Determine password strength based on entropy and other factors
 */
function determineStrength(
  password: string, 
  entropy: number, 
  policyViolations: number
): PasswordStrength {
  const length = password.length
  const hasVariety = getUniqueCharCount(password) > length * 0.5
  
  // Adjust entropy based on policy violations
  const adjustedEntropy = entropy - (policyViolations * 10)
  
  if (adjustedEntropy < 40 || length < 12) return 'very-weak'
  if (adjustedEntropy < 60 || length < 16) return 'weak'
  if (adjustedEntropy < 80 || !hasVariety) return 'fair'
  if (adjustedEntropy < 100) return 'good'
  if (adjustedEntropy < 120) return 'strong'
  return 'very-strong'
}

/**
 * Count unique characters in password
 */
function getUniqueCharCount(password: string): number {
  return new Set(password.split('')).size
}

/**
 * Check for repeating character patterns
 */
function hasExcessiveRepeating(password: string, maxRepeating: number): boolean {
  for (let i = 0; i <= password.length - maxRepeating - 1; i++) {
    const char = password[i]
    let count = 1
    
    for (let j = i + 1; j < password.length && password[j] === char; j++) {
      count++
      if (count > maxRepeating) return true
    }
  }
  return false
}

/**
 * Check for sequential character patterns
 */
function hasSequentialChars(password: string): boolean {
  const lowerPassword = password.toLowerCase()
  
  for (const pattern of SEQUENTIAL_PATTERNS) {
    for (let i = 0; i <= pattern.length - 4; i++) {
      const sequence = pattern.substring(i, i + 4)
      const reverseSequence = sequence.split('').reverse().join('')
      
      if (lowerPassword.includes(sequence) || lowerPassword.includes(reverseSequence)) {
        return true
      }
    }
  }
  return false
}

/**
 * Check if password contains user-related information
 */
function containsUserInfo(password: string, userContext?: UserPasswordContext): boolean {
  if (!userContext) return false
  
  const lowerPassword = password.toLowerCase()
  const userInfo = [
    userContext.email?.split('@')[0],
    userContext.firstName,
    userContext.lastName,
    userContext.username
  ].filter(Boolean).map(info => info!.toLowerCase())
  
  return userInfo.some(info => 
    info.length >= 3 && lowerPassword.includes(info)
  )
}

/**
 * Check if password was previously used
 */
function isPreviouslyUsed(password: string, userContext?: UserPasswordContext): boolean {
  if (!userContext?.previousPasswords) return false
  
  // In production, this should use hashed comparison
  return userContext.previousPasswords.some(prevPassword => 
    prevPassword === password
  )
}

/**
 * Main password validation function
 */
export function validatePassword(
  password: string,
  config: Partial<PasswordPolicyConfig> = {},
  userContext?: UserPasswordContext
): PasswordValidationResult {
  const policy = { ...DEFAULT_PASSWORD_POLICY, ...config }
  const errors: string[] = []
  const feedback: string[] = []
  
  // Basic length validation
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`)
  }
  
  if (password.length > policy.maxLength) {
    errors.push(`Password must not exceed ${policy.maxLength} characters`)
  }
  
  // Character class requirements
  if (policy.requireLowercase && !CHARACTER_SETS.lowercase.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (policy.requireUppercase && !CHARACTER_SETS.uppercase.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (policy.requireNumbers && !CHARACTER_SETS.numbers.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (policy.requireSpecialChars) {
    const specialCharCount = (password.match(CHARACTER_SETS.extendedSpecial) || []).length
    if (specialCharCount === 0) {
      errors.push('Password must contain at least one special character')
    } else if (specialCharCount < policy.minSpecialChars) {
      errors.push(`Password must contain at least ${policy.minSpecialChars} special characters`)
    }
  }
  
  // Pattern and complexity checks
  if (policy.preventCommonPasswords && COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('Password is too common and easily guessable')
  }
  
  // Check forbidden patterns
  const lowerPassword = password.toLowerCase()
  for (const pattern of policy.forbiddenPatterns) {
    if (lowerPassword.includes(pattern.toLowerCase())) {
      errors.push(`Password cannot contain the word "${pattern}"`)
    }
  }
  
  // Repeating characters check
  if (hasExcessiveRepeating(password, policy.maxRepeatingChars)) {
    errors.push(`Password cannot have more than ${policy.maxRepeatingChars} repeating characters`)
  }
  
  // Sequential characters check
  if (policy.preventSequentialChars && hasSequentialChars(password)) {
    errors.push('Password cannot contain sequential characters (e.g., "abcd", "1234")')
  }
  
  // User information check
  if (policy.preventUserInfo && containsUserInfo(password, userContext)) {
    errors.push('Password cannot contain personal information')
  }
  
  // Previous password check
  if (isPreviouslyUsed(password, userContext)) {
    errors.push('Password has been used previously and cannot be reused')
  }
  
  // Calculate entropy and strength
  const entropy = calculateEntropy(password)
  const strength = determineStrength(password, entropy, errors.length)
  const score = Math.min(Math.round((entropy / 120) * 100), 100)
  
  // Generate feedback
  if (strength === 'very-weak' || strength === 'weak') {
    feedback.push('Consider using a longer password with more character variety')
  }
  
  if (getUniqueCharCount(password) < password.length * 0.5) {
    feedback.push('Use more unique characters for better security')
  }
  
  if (password.length < 20) {
    feedback.push('Longer passwords provide better security')
  }
  
  return {
    isValid: errors.length === 0,
    score,
    strength,
    errors,
    feedback,
    entropy
  }
}

/**
 * Validate password confirmation match
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): PasswordMatchResult {
  const errors: string[] = []
  
  if (!confirmPassword) {
    errors.push('Password confirmation is required')
  } else if (password !== confirmPassword) {
    errors.push('Passwords do not match')
  }
  
  return {
    isMatch: password === confirmPassword && password.length > 0,
    errors
  }
}

/**
 * Check password expiration status
 */
export function checkPasswordExpiration(
  lastPasswordChange: Date,
  config: Partial<PasswordExpirationConfig> = {}
): {
  isExpired: boolean
  daysUntilExpiration: number
  requiresWarning: boolean
  daysSinceChange: number
} {
  const expirationConfig = { ...DEFAULT_EXPIRATION_CONFIG, ...config }
  const now = new Date()
  const daysSinceChange = Math.floor(
    (now.getTime() - lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  const daysUntilExpiration = expirationConfig.maxAgeInDays - daysSinceChange
  const isExpired = daysUntilExpiration <= 0
  const requiresWarning = daysUntilExpiration <= expirationConfig.warningThresholdInDays
  
  return {
    isExpired,
    daysUntilExpiration: Math.max(0, daysUntilExpiration),
    requiresWarning: requiresWarning && !isExpired,
    daysSinceChange
  }
}

/**
 * Generate password strength meter display data
 */
export function getPasswordStrengthMeter(result: PasswordValidationResult): {
  percentage: number
  color: string
  label: string
  description: string
} {
  const strengthConfig = {
    'very-weak': { color: '#dc2626', label: 'Very Weak', description: 'Easily guessable' },
    'weak': { color: '#ea580c', label: 'Weak', description: 'Could be guessed' },
    'fair': { color: '#ca8a04', label: 'Fair', description: 'Somewhat secure' },
    'good': { color: '#65a30d', label: 'Good', description: 'Secure' },
    'strong': { color: '#16a34a', label: 'Strong', description: 'Very secure' },
    'very-strong': { color: '#059669', label: 'Very Strong', description: 'Extremely secure' }
  }
  
  const config = strengthConfig[result.strength]
  
  return {
    percentage: result.score,
    color: config.color,
    label: config.label,
    description: config.description
  }
}

/**
 * Real-time password validation for form integration
 */
export function validatePasswordRealTime(
  password: string,
  confirmPassword?: string,
  config?: Partial<PasswordPolicyConfig>,
  userContext?: UserPasswordContext
): {
  password: PasswordValidationResult
  match?: PasswordMatchResult
  realTimeErrors: string[]
  canSubmit: boolean
} {
  const passwordResult = validatePassword(password, config, userContext)
  const matchResult = confirmPassword !== undefined 
    ? validatePasswordMatch(password, confirmPassword)
    : undefined
  
  // Collect real-time errors (show only critical ones during typing)
  const realTimeErrors: string[] = []
  
  if (password.length > 0 && password.length < (config?.minLength || DEFAULT_PASSWORD_POLICY.minLength)) {
    realTimeErrors.push(`Minimum ${config?.minLength || DEFAULT_PASSWORD_POLICY.minLength} characters required`)
  }
  
  if (matchResult && !matchResult.isMatch && confirmPassword && confirmPassword.length > 0) {
    realTimeErrors.push('Passwords do not match')
  }
  
  const canSubmit = passwordResult.isValid && (!matchResult || matchResult.isMatch)
  
  return {
    password: passwordResult,
    match: matchResult,
    realTimeErrors,
    canSubmit
  }
}

/**
 * Create password validation schema for forms
 */
export function createPasswordValidationSchema(
  config?: Partial<PasswordPolicyConfig>,
  userContext?: UserPasswordContext
) {
  const policy = { ...DEFAULT_PASSWORD_POLICY, ...config }
  
  return z.object({
    password: z.string()
      .min(policy.minLength, `Password must be at least ${policy.minLength} characters long`)
      .max(policy.maxLength, `Password must not exceed ${policy.maxLength} characters`)
      .refine(
        (password) => !policy.requireLowercase || CHARACTER_SETS.lowercase.test(password),
        'Password must contain at least one lowercase letter'
      )
      .refine(
        (password) => !policy.requireUppercase || CHARACTER_SETS.uppercase.test(password),
        'Password must contain at least one uppercase letter'
      )
      .refine(
        (password) => !policy.requireNumbers || CHARACTER_SETS.numbers.test(password),
        'Password must contain at least one number'
      )
      .refine(
        (password) => !policy.requireSpecialChars || CHARACTER_SETS.extendedSpecial.test(password),
        'Password must contain at least one special character'
      )
      .refine(
        (password) => !policy.preventCommonPasswords || !COMMON_PASSWORDS.has(password.toLowerCase()),
        'Password is too common and easily guessable'
      )
      .refine(
        (password) => !hasExcessiveRepeating(password, policy.maxRepeatingChars),
        `Password cannot have more than ${policy.maxRepeatingChars} repeating characters`
      )
      .refine(
        (password) => !policy.preventSequentialChars || !hasSequentialChars(password),
        'Password cannot contain sequential characters'
      )
      .refine(
        (password) => !policy.preventUserInfo || !containsUserInfo(password, userContext),
        'Password cannot contain personal information'
      )
      .refine(
        (password) => !isPreviouslyUsed(password, userContext),
        'Password has been used previously and cannot be reused'
      ),
    confirmPassword: z.string()
  }).refine(
    (data) => data.password === data.confirmPassword,
    {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    }
  )
}