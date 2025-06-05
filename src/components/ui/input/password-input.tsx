'use client';

/**
 * Password Input Component
 * 
 * Enhanced password input with show/hide toggle, strength meter, and security features.
 * Provides comprehensive UX for password entry with proper accessibility and security
 * considerations for authentication workflows.
 * 
 * Features:
 * - Show/hide toggle with eye icon
 * - Password strength meter with visual and textual feedback
 * - Security features (paste prevention, autocomplete control)
 * - Real-time validation with immediate feedback
 * - Password confirmation matching
 * - WCAG 2.1 AA accessibility compliance
 * - Secure focus handling and value masking
 * - Password manager integration support
 * 
 * @fileoverview Password input component for secure authentication
 * @version 1.0.0
 */

import React, { 
  forwardRef, 
  useState, 
  useCallback, 
  useEffect, 
  useMemo,
  useRef,
  type ForwardedRef,
  type KeyboardEvent,
  type ClipboardEvent,
  type ChangeEvent,
  type FocusEvent 
} from 'react';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { InputProps, ValidationState } from '@/types/ui';

/**
 * Password strength levels for validation feedback
 */
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong' | 'excellent';

/**
 * Password validation rule configuration
 */
export interface PasswordRule {
  /** Rule identifier */
  id: string;
  /** Rule description for display */
  label: string;
  /** Validation function */
  test: (password: string) => boolean;
  /** Required for minimum strength */
  required?: boolean;
}

/**
 * Password input component props
 */
export interface PasswordInputProps extends Omit<InputProps, 'type' | 'showPasswordToggle'> {
  /** Show password strength meter */
  showStrengthMeter?: boolean;
  /** Password validation rules */
  validationRules?: PasswordRule[];
  /** Minimum required strength level */
  minStrength?: PasswordStrength;
  /** Confirmation password for matching validation */
  confirmValue?: string;
  /** Enable password confirmation mode */
  isConfirmation?: boolean;
  /** Prevent paste operations for security */
  preventPaste?: boolean;
  /** Custom autocomplete value */
  autoComplete?: 'new-password' | 'current-password' | 'off';
  /** Mask value in accessibility announcements */
  maskValueInAnnouncements?: boolean;
  /** Show validation rules checklist */
  showValidationRules?: boolean;
  /** Focus management configuration */
  focusManagement?: {
    /** Maintain cursor position on visibility toggle */
    maintainCursorPosition?: boolean;
    /** Auto-focus on mount */
    autoFocus?: boolean;
  };
}

/**
 * Default password validation rules following security best practices
 */
const DEFAULT_PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'length',
    label: 'At least 8 characters long',
    test: (password) => password.length >= 8,
    required: true,
  },
  {
    id: 'uppercase',
    label: 'Contains uppercase letter',
    test: (password) => /[A-Z]/.test(password),
    required: true,
  },
  {
    id: 'lowercase',
    label: 'Contains lowercase letter',
    test: (password) => /[a-z]/.test(password),
    required: true,
  },
  {
    id: 'number',
    label: 'Contains number',
    test: (password) => /\d/.test(password),
    required: true,
  },
  {
    id: 'special',
    label: 'Contains special character',
    test: (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  },
  {
    id: 'noSpaces',
    label: 'No spaces',
    test: (password) => !/\s/.test(password),
  },
];

/**
 * Calculate password strength based on validation rules
 */
function calculatePasswordStrength(
  password: string, 
  rules: PasswordRule[]
): { strength: PasswordStrength; score: number; passedRules: number } {
  if (!password) {
    return { strength: 'weak', score: 0, passedRules: 0 };
  }

  const passedRules = rules.filter(rule => rule.test(password)).length;
  const totalRules = rules.length;
  const score = Math.round((passedRules / totalRules) * 100);

  let strength: PasswordStrength;
  if (score >= 90) strength = 'excellent';
  else if (score >= 75) strength = 'strong';
  else if (score >= 60) strength = 'good';
  else if (score >= 40) strength = 'fair';
  else strength = 'weak';

  return { strength, score, passedRules };
}

/**
 * Get strength meter color classes based on strength level
 */
function getStrengthColors(strength: PasswordStrength): {
  bg: string;
  text: string;
  border: string;
} {
  switch (strength) {
    case 'excellent':
      return {
        bg: 'bg-emerald-500',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-500',
      };
    case 'strong':
      return {
        bg: 'bg-green-500',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-500',
      };
    case 'good':
      return {
        bg: 'bg-blue-500',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-500',
      };
    case 'fair':
      return {
        bg: 'bg-yellow-500',
        text: 'text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-500',
      };
    case 'weak':
    default:
      return {
        bg: 'bg-red-500',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-500',
      };
  }
}

/**
 * Password Input Component
 * 
 * Provides secure password input with comprehensive validation, accessibility,
 * and user experience features for authentication workflows.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      className,
      value = '',
      onChange,
      onFocus,
      onBlur,
      placeholder = 'Enter password',
      disabled = false,
      required = false,
      error,
      success,
      helperText,
      showStrengthMeter = false,
      validationRules = DEFAULT_PASSWORD_RULES,
      minStrength = 'good',
      confirmValue,
      isConfirmation = false,
      preventPaste = false,
      autoComplete = 'new-password',
      maskValueInAnnouncements = true,
      showValidationRules = false,
      focusManagement = {
        maintainCursorPosition: true,
        autoFocus: false,
      },
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'data-testid': testId,
      ...inputProps
    },
    ref: ForwardedRef<HTMLInputElement>
  ) {
    // State management
    const [isVisible, setIsVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [cursorPosition, setCursorPosition] = useState<number | null>(null);
    const internalRef = useRef<HTMLInputElement>(null);
    
    // Merge refs for internal and external access
    const inputRef = (ref || internalRef) as React.RefObject<HTMLInputElement>;

    // Password strength calculation
    const strengthData = useMemo(() => {
      if (!showStrengthMeter || isConfirmation) return null;
      return calculatePasswordStrength(value, validationRules);
    }, [value, validationRules, showStrengthMeter, isConfirmation]);

    // Validation state calculation
    const validationState = useMemo((): ValidationState => {
      const hasValue = Boolean(value);
      let isValid = true;
      let validationError = error;

      // Password confirmation validation
      if (isConfirmation && confirmValue !== undefined) {
        isValid = value === confirmValue;
        if (!isValid && hasValue) {
          validationError = 'Passwords do not match';
        }
      }
      // Strength validation for new passwords
      else if (showStrengthMeter && strengthData && hasValue) {
        const requiredRules = validationRules.filter(rule => rule.required);
        const passedRequiredRules = requiredRules.filter(rule => rule.test(value));
        
        if (passedRequiredRules.length < requiredRules.length) {
          isValid = false;
          if (!validationError) {
            validationError = 'Password does not meet minimum requirements';
          }
        } else {
          const strengthLevels: PasswordStrength[] = ['weak', 'fair', 'good', 'strong', 'excellent'];
          const minIndex = strengthLevels.indexOf(minStrength);
          const currentIndex = strengthLevels.indexOf(strengthData.strength);
          
          if (currentIndex < minIndex) {
            isValid = false;
            if (!validationError) {
              validationError = `Password must be at least ${minStrength} strength`;
            }
          }
        }
      }

      return {
        isValid,
        isDirty: hasValue,
        isTouched: isFocused,
        error: validationError,
      };
    }, [
      value,
      error,
      isConfirmation,
      confirmValue,
      showStrengthMeter,
      strengthData,
      validationRules,
      minStrength,
      isFocused,
    ]);

    // Accessibility announcements
    const strengthAnnouncement = useMemo(() => {
      if (!strengthData || !maskValueInAnnouncements) return '';
      return `Password strength: ${strengthData.strength}. ${strengthData.passedRules} of ${validationRules.length} requirements met.`;
    }, [strengthData, maskValueInAnnouncements, validationRules.length]);

    // Toggle password visibility with cursor position preservation
    const toggleVisibility = useCallback(() => {
      if (focusManagement.maintainCursorPosition && inputRef.current) {
        setCursorPosition(inputRef.current.selectionStart);
      }
      setIsVisible(prev => !prev);
    }, [focusManagement.maintainCursorPosition, inputRef]);

    // Restore cursor position after visibility toggle
    useEffect(() => {
      if (
        cursorPosition !== null && 
        inputRef.current && 
        focusManagement.maintainCursorPosition
      ) {
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
            setCursorPosition(null);
          }
        });
      }
    }, [isVisible, cursorPosition, focusManagement.maintainCursorPosition, inputRef]);

    // Event handlers
    const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event.target.value);
    }, [onChange]);

    const handleFocus = useCallback((event: FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(event);
    }, [onFocus]);

    const handleBlur = useCallback((event: FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(event);
    }, [onBlur]);

    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
      // Allow keyboard shortcuts but prevent clipboard operations if configured
      if (preventPaste && (event.ctrlKey || event.metaKey) && event.key === 'v') {
        event.preventDefault();
        return;
      }
    }, [preventPaste]);

    const handlePaste = useCallback((event: ClipboardEvent<HTMLInputElement>) => {
      if (preventPaste) {
        event.preventDefault();
      }
    }, [preventPaste]);

    // Component styling
    const inputClasses = cn(
      // Base input styling
      'flex h-12 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm',
      'ring-offset-white placeholder:text-gray-500',
      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'dark:border-gray-600 dark:bg-gray-900 dark:ring-offset-gray-900',
      'dark:placeholder:text-gray-400 dark:focus:ring-primary-400',
      
      // Validation states
      {
        'border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:ring-red-400':
          validationState.error && !isFocused,
        'border-green-500 focus:ring-green-500 dark:border-green-400 dark:focus:ring-green-400':
          success && !validationState.error,
      },
      
      // Add padding for suffix (toggle button)
      'pr-12',
      
      className
    );

    const strengthColors = strengthData ? getStrengthColors(strengthData.strength) : null;

    // Generate unique IDs for accessibility
    const inputId = inputProps.id || `password-input-${Math.random().toString(36).substr(2, 9)}`;
    const strengthId = `${inputId}-strength`;
    const rulesId = `${inputId}-rules`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // Build aria-describedby list
    const describedByIds = [
      ariaDescribedBy,
      strengthData && strengthId,
      showValidationRules && rulesId,
      validationState.error && errorId,
      helperText && helperId,
    ].filter(Boolean).join(' ');

    return (
      <div className="w-full space-y-2">
        {/* Input container */}
        <div className="relative">
          <input
            ref={inputRef}
            id={inputId}
            type={isVisible ? 'text' : 'password'}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            autoFocus={focusManagement.autoFocus}
            className={inputClasses}
            aria-label={ariaLabel || (isConfirmation ? 'Confirm password' : 'Password')}
            aria-describedby={describedByIds || undefined}
            aria-invalid={validationState.error ? 'true' : 'false'}
            aria-required={required}
            data-testid={testId}
            {...inputProps}
          />

          {/* Password visibility toggle button */}
          <button
            type="button"
            onClick={toggleVisibility}
            disabled={disabled}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5',
              'text-gray-500 hover:text-gray-700 focus:outline-none',
              'focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'dark:text-gray-400 dark:hover:text-gray-300'
            )}
            aria-label={isVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isVisible}
            tabIndex={-1} // Remove from tab order to avoid focus conflicts
          >
            {isVisible ? (
              <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <EyeIcon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Password strength meter */}
        {strengthData && showStrengthMeter && !isConfirmation && (
          <div 
            id={strengthId}
            className="space-y-2"
            aria-live="polite"
            aria-atomic="true"
          >
            {/* Strength bar */}
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((segment) => (
                <div
                  key={segment}
                  className={cn(
                    'h-2 flex-1 rounded-full transition-colors duration-200',
                    segment <= Math.ceil((strengthData.score / 100) * 5)
                      ? strengthColors.bg
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              ))}
            </div>

            {/* Strength label */}
            <p className={cn('text-sm font-medium', strengthColors.text)}>
              Password strength: {strengthData.strength} 
              {maskValueInAnnouncements && (
                <span className="sr-only">
                  {strengthAnnouncement}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Validation rules checklist */}
        {showValidationRules && !isConfirmation && value && (
          <div id={rulesId} className="space-y-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Password requirements:
            </p>
            <ul className="space-y-1 text-sm">
              {validationRules.map((rule) => {
                const isRulePassed = rule.test(value);
                return (
                  <li
                    key={rule.id}
                    className={cn(
                      'flex items-center gap-2',
                      isRulePassed
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {isRulePassed ? (
                      <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <XCircleIcon className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>{rule.label}</span>
                    <span className="sr-only">
                      {isRulePassed ? 'Satisfied' : 'Not satisfied'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Error message */}
        {validationState.error && (
          <div
            id={errorId}
            className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
            role="alert"
            aria-live="polite"
          >
            <XCircleIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{validationState.error}</span>
          </div>
        )}

        {/* Helper text */}
        {helperText && !validationState.error && (
          <p
            id={helperId}
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}

        {/* Success message */}
        {success && validationState.isValid && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircleIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>Password meets all requirements</span>
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;