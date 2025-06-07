"use client";

import React, { forwardRef, useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Eye, EyeOff, Shield, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import type { InputProps } from "./input.types";

/**
 * Password Input Component for DreamFactory Admin Interface
 * 
 * Comprehensive password input with show/hide toggle, strength meter, and security features.
 * Implements WCAG 2.1 AA accessibility compliance with proper password input handling.
 * 
 * Features:
 * - Show/hide toggle with focus and cursor position preservation
 * - Visual and textual password strength feedback
 * - Security features (paste prevention, autocomplete control)
 * - Real-time password validation with actionable feedback
 * - Password confirmation matching with live validation
 * - WCAG 2.1 AA accessibility with proper announcements
 * - Secure focus handling and value masking
 * - Password manager integration support
 * 
 * @see Technical Specification Section 7.7.1 for design tokens
 * @see WCAG 2.1 AA Guidelines for password input accessibility
 * 
 * @fileoverview Enhanced password input component with security and UX features
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Password strength levels with corresponding feedback
 */
export type PasswordStrength = 'none' | 'weak' | 'fair' | 'good' | 'strong';

/**
 * Password validation rule configuration
 */
export interface PasswordRule {
  /** Unique identifier for the rule */
  id: string;
  /** Human-readable description of the rule */
  label: string;
  /** Function to test if password meets this rule */
  test: (password: string) => boolean;
  /** Whether this rule is required for form submission */
  required?: boolean;
  /** Detailed explanation for screen readers */
  description?: string;
}

/**
 * Password strength configuration
 */
export interface PasswordStrengthConfig {
  /** Show visual strength meter */
  showMeter?: boolean;
  /** Show textual strength feedback */
  showText?: boolean;
  /** Custom strength calculation function */
  calculateStrength?: (password: string, rules: PasswordRule[]) => PasswordStrength;
  /** Custom strength messages */
  strengthMessages?: Record<PasswordStrength, string>;
}

/**
 * Security configuration for password input
 */
export interface PasswordSecurityConfig {
  /** Prevent paste operations for security */
  preventPaste?: boolean;
  /** Disable autocomplete (overrides browser behavior) */
  disableAutocomplete?: boolean;
  /** Clear input on window blur for security */
  clearOnBlur?: boolean;
  /** Mask value in dev tools and browser history */
  maskValue?: boolean;
  /** Custom password manager hint */
  passwordManagerHint?: string;
}

/**
 * Password confirmation configuration
 */
export interface PasswordConfirmationConfig {
  /** Password to match against */
  matchPassword?: string;
  /** Custom mismatch error message */
  mismatchMessage?: string;
  /** Show real-time matching feedback */
  showMatchFeedback?: boolean;
}

/**
 * Enhanced password input props
 */
export interface PasswordInputProps extends Omit<InputProps, 'type' | 'showPasswordToggle'> {
  /** Current password value */
  value?: string;
  
  /** Change handler for password value */
  onValueChange?: (value: string) => void;
  
  /** Password validation rules */
  rules?: PasswordRule[];
  
  /** Password strength configuration */
  strengthConfig?: PasswordStrengthConfig;
  
  /** Security configuration */
  securityConfig?: PasswordSecurityConfig;
  
  /** Password confirmation configuration */
  confirmationConfig?: PasswordConfirmationConfig;
  
  /** Show password requirements list */
  showRequirements?: boolean;
  
  /** Validation triggered callback */
  onValidation?: (isValid: boolean, strength: PasswordStrength, failedRules: PasswordRule[]) => void;
  
  /** Custom password visibility toggle aria-label */
  toggleAriaLabel?: string;
  
  /** Enable enhanced security mode */
  enhancedSecurity?: boolean;
  
  /** Custom strength meter colors */
  strengthColors?: {
    none: string;
    weak: string;
    fair: string;
    good: string;
    strong: string;
  };
}

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

/**
 * Default password validation rules
 */
const DEFAULT_PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'minLength',
    label: 'At least 8 characters',
    description: 'Password must contain at least 8 characters',
    test: (password) => password.length >= 8,
    required: true,
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter',
    description: 'Password must contain at least one uppercase letter',
    test: (password) => /[A-Z]/.test(password),
    required: true,
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter',
    description: 'Password must contain at least one lowercase letter',
    test: (password) => /[a-z]/.test(password),
    required: true,
  },
  {
    id: 'number',
    label: 'One number',
    description: 'Password must contain at least one number',
    test: (password) => /\d/.test(password),
    required: true,
  },
  {
    id: 'special',
    label: 'One special character',
    description: 'Password must contain at least one special character (!@#$%^&*)',
    test: (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    required: false,
  },
  {
    id: 'noSpaces',
    label: 'No spaces',
    description: 'Password cannot contain spaces',
    test: (password) => !/\s/.test(password),
    required: true,
  },
];

/**
 * Default strength messages
 */
const DEFAULT_STRENGTH_MESSAGES: Record<PasswordStrength, string> = {
  none: 'Enter a password',
  weak: 'Weak password',
  fair: 'Fair password',
  good: 'Good password',
  strong: 'Strong password',
};

/**
 * Default strength colors for meter
 */
const DEFAULT_STRENGTH_COLORS = {
  none: 'bg-gray-200 dark:bg-gray-700',
  weak: 'bg-red-500',
  fair: 'bg-orange-500',
  good: 'bg-yellow-500',
  strong: 'bg-green-500',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate password strength based on rules
 */
const calculatePasswordStrength = (
  password: string,
  rules: PasswordRule[]
): PasswordStrength => {
  if (!password) return 'none';
  
  const passedRules = rules.filter(rule => rule.test(password));
  const passedRequired = rules.filter(rule => rule.required && rule.test(password));
  const totalRequired = rules.filter(rule => rule.required).length;
  
  // Calculate strength based on passed rules
  const strength = passedRules.length / rules.length;
  const requiredMet = passedRequired.length >= totalRequired;
  
  if (!requiredMet) return 'weak';
  if (strength >= 0.9) return 'strong';
  if (strength >= 0.7) return 'good';
  if (strength >= 0.5) return 'fair';
  return 'weak';
};

/**
 * Generate secure ID for form elements
 */
const generateSecureId = (): string => {
  return `password-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Announce to screen readers
 */
const announceToScreenReader = (message: string): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * PasswordInput component with comprehensive security and UX features
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      value = '',
      onValueChange,
      onChange,
      rules = DEFAULT_PASSWORD_RULES,
      strengthConfig = {},
      securityConfig = {},
      confirmationConfig = {},
      showRequirements = true,
      onValidation,
      toggleAriaLabel,
      enhancedSecurity = false,
      strengthColors = DEFAULT_STRENGTH_COLORS,
      className,
      containerClassName,
      labelClassName,
      helperClassName,
      errorClassName,
      disabled,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      'aria-errormessage': ariaErrorMessage,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    // =============================================================================
    // HOOKS AND STATE
    // =============================================================================
    
    const { resolvedTheme } = useTheme();
    const [isVisible, setIsVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [selectionRange, setSelectionRange] = useState<[number, number] | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const toggleButtonRef = useRef<HTMLButtonElement>(null);
    
    // Generate stable IDs for accessibility
    const ids = useMemo(() => ({
      input: generateSecureId(),
      requirements: `${generateSecureId()}-requirements`,
      strength: `${generateSecureId()}-strength`,
      toggle: `${generateSecureId()}-toggle`,
      error: `${generateSecureId()}-error`,
    }), []);

    // =============================================================================
    // CONFIGURATION
    // =============================================================================
    
    const {
      showMeter = true,
      showText = true,
      calculateStrength: customCalculateStrength,
      strengthMessages = DEFAULT_STRENGTH_MESSAGES,
    } = strengthConfig;

    const {
      preventPaste = enhancedSecurity,
      disableAutocomplete = enhancedSecurity,
      clearOnBlur = enhancedSecurity,
      maskValue = enhancedSecurity,
      passwordManagerHint = 'current-password',
    } = securityConfig;

    const {
      matchPassword,
      mismatchMessage = 'Passwords do not match',
      showMatchFeedback = true,
    } = confirmationConfig;

    // =============================================================================
    // COMPUTED VALUES
    // =============================================================================
    
    const passwordStrength = useMemo(() => {
      if (customCalculateStrength) {
        return customCalculateStrength(value, rules);
      }
      return calculatePasswordStrength(value, rules);
    }, [value, rules, customCalculateStrength]);

    const failedRules = useMemo(() => {
      return rules.filter(rule => !rule.test(value));
    }, [value, rules]);

    const isValid = useMemo(() => {
      const requiredRules = rules.filter(rule => rule.required);
      return requiredRules.every(rule => rule.test(value));
    }, [value, rules]);

    const passwordsMatch = useMemo(() => {
      if (!matchPassword) return true;
      return value === matchPassword;
    }, [value, matchPassword]);

    const hasError = useMemo(() => {
      return (!isValid && value.length > 0) || (!passwordsMatch && showMatchFeedback);
    }, [isValid, value.length, passwordsMatch, showMatchFeedback]);

    const strengthPercentage = useMemo(() => {
      const strengthMap: Record<PasswordStrength, number> = {
        none: 0,
        weak: 25,
        fair: 50,
        good: 75,
        strong: 100,
      };
      return strengthMap[passwordStrength];
    }, [passwordStrength]);

    // =============================================================================
    // ACCESSIBILITY ATTRIBUTES
    // =============================================================================
    
    const accessibilityProps = useMemo(() => {
      const describedByIds = [
        ariaDescribedBy,
        showRequirements ? ids.requirements : null,
        showMeter || showText ? ids.strength : null,
      ].filter(Boolean).join(' ');

      return {
        'aria-describedby': describedByIds || undefined,
        'aria-invalid': hasError || ariaInvalid,
        'aria-errormessage': hasError ? (ariaErrorMessage || ids.error) : undefined,
        'aria-required': props.required,
      };
    }, [ariaDescribedBy, showRequirements, showMeter, showText, ids, hasError, ariaInvalid, ariaErrorMessage, props.required]);

    // =============================================================================
    // EVENT HANDLERS
    // =============================================================================
    
    const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      
      // Store cursor position for visibility toggle
      const input = event.target;
      if (input.selectionStart !== null && input.selectionEnd !== null) {
        setSelectionRange([input.selectionStart, input.selectionEnd]);
      }
      
      // Update value
      onValueChange?.(newValue);
      onChange?.(event);
    }, [onValueChange, onChange]);

    const handleInputFocus = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(event);
    }, [props]);

    const handleInputBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      
      // Clear password on blur if enhanced security is enabled
      if (clearOnBlur && value) {
        onValueChange?.('');
        announceToScreenReader('Password cleared for security');
      }
      
      props.onBlur?.(event);
    }, [clearOnBlur, value, onValueChange, props]);

    const handlePaste = useCallback((event: React.ClipboardEvent<HTMLInputElement>) => {
      if (preventPaste) {
        event.preventDefault();
        announceToScreenReader('Paste disabled for security');
        return;
      }
      props.onPaste?.(event);
    }, [preventPaste, props]);

    const toggleVisibility = useCallback(() => {
      const newVisible = !isVisible;
      setIsVisible(newVisible);
      
      // Restore cursor position after toggle
      setTimeout(() => {
        const input = inputRef.current;
        if (input && selectionRange) {
          input.focus();
          input.setSelectionRange(selectionRange[0], selectionRange[1]);
        }
      }, 0);
      
      // Announce visibility change
      const message = newVisible 
        ? 'Password is now visible' 
        : 'Password is now hidden';
      announceToScreenReader(message);
    }, [isVisible, selectionRange]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow Escape to hide password if visible
      if (event.key === 'Escape' && isVisible) {
        setIsVisible(false);
        announceToScreenReader('Password hidden');
      }
      
      props.onKeyDown?.(event);
    }, [isVisible, props]);

    // =============================================================================
    // EFFECTS
    // =============================================================================
    
    // Trigger validation callback when validation state changes
    useEffect(() => {
      onValidation?.(isValid && passwordsMatch, passwordStrength, failedRules);
    }, [isValid, passwordsMatch, passwordStrength, failedRules, onValidation]);

    // Imperative handle for ref
    React.useImperativeHandle(ref, () => inputRef.current!, []);

    // =============================================================================
    // RENDER HELPERS
    // =============================================================================
    
    const renderPasswordRequirements = () => {
      if (!showRequirements || rules.length === 0) return null;

      return (
        <div
          id={ids.requirements}
          className="mt-2"
          aria-label="Password requirements"
        >
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password requirements:
          </p>
          <ul className="space-y-1">
            {rules.map((rule) => {
              const isPassed = rule.test(value);
              const isRequired = rule.required;
              
              return (
                <li
                  key={rule.id}
                  className={cn(
                    "flex items-center text-sm transition-colors duration-200",
                    isPassed
                      ? "text-green-600 dark:text-green-400"
                      : isRequired
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {isPassed ? (
                    <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
                  ) : isRequired ? (
                    <X className="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <div className="w-4 h-4 mr-2 flex-shrink-0 rounded-full border border-current" aria-hidden="true" />
                  )}
                  <span>
                    {rule.label}
                    {isRequired && <span className="ml-1 text-red-500">*</span>}
                  </span>
                  <span className="sr-only">
                    {isPassed ? 'met' : 'not met'}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      );
    };

    const renderStrengthMeter = () => {
      if (!showMeter && !showText) return null;

      return (
        <div
          id={ids.strength}
          className="mt-2"
          aria-label={`Password strength: ${strengthMessages[passwordStrength]}`}
        >
          {showText && (
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Password strength
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  passwordStrength === 'none' && "text-gray-500 dark:text-gray-400",
                  passwordStrength === 'weak' && "text-red-600 dark:text-red-400",
                  passwordStrength === 'fair' && "text-orange-600 dark:text-orange-400",
                  passwordStrength === 'good' && "text-yellow-600 dark:text-yellow-400",
                  passwordStrength === 'strong' && "text-green-600 dark:text-green-400"
                )}
                aria-live="polite"
              >
                {strengthMessages[passwordStrength]}
              </span>
            </div>
          )}
          
          {showMeter && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300 ease-out",
                  strengthColors[passwordStrength]
                )}
                style={{ width: `${strengthPercentage}%` }}
                role="progressbar"
                aria-valuenow={strengthPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Password strength: ${strengthPercentage}%`}
              />
            </div>
          )}
        </div>
      );
    };

    const renderError = () => {
      if (!hasError) return null;

      const errorMessage = !passwordsMatch 
        ? mismatchMessage 
        : `Password does not meet requirements: ${failedRules.map(r => r.label).join(', ')}`;

      return (
        <div
          id={ids.error}
          className={cn(
            "mt-2 flex items-center text-sm text-red-600 dark:text-red-400",
            errorClassName
          )}
          role="alert"
          aria-live="polite"
        >
          <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
          {errorMessage}
        </div>
      );
    };

    // =============================================================================
    // MAIN RENDER
    // =============================================================================
    
    return (
      <div className={cn("space-y-1", containerClassName)} data-testid={testId}>
        <div className="relative">
          <input
            ref={inputRef}
            type={isVisible ? "text" : "password"}
            value={maskValue && !isFocused ? '•'.repeat(value.length) : value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            autoComplete={disableAutocomplete ? "off" : passwordManagerHint}
            disabled={disabled}
            className={cn(
              // Base input styles
              "w-full px-3 py-2 pr-12 border rounded-md shadow-sm transition-colors duration-200",
              "text-sm placeholder-gray-400 dark:placeholder-gray-500",
              "min-h-[44px]", // WCAG touch target minimum
              
              // Focus states
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              "focus:border-primary-500 focus:ring-primary-500",
              
              // Theme variants
              "bg-white dark:bg-gray-900",
              "border-gray-300 dark:border-gray-600",
              "text-gray-900 dark:text-gray-100",
              
              // Error states
              hasError && [
                "border-red-500 dark:border-red-400",
                "focus:border-red-500 focus:ring-red-500",
              ],
              
              // Disabled state
              disabled && [
                "opacity-50 cursor-not-allowed",
                "bg-gray-50 dark:bg-gray-800",
              ],
              
              className
            )}
            {...accessibilityProps}
            {...props}
          />
          
          {/* Password toggle button */}
          <button
            ref={toggleButtonRef}
            type="button"
            onClick={toggleVisibility}
            disabled={disabled}
            className={cn(
              "absolute inset-y-0 right-0 flex items-center justify-center w-12",
              "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300",
              "transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              // Ensure minimum touch target
              "min-w-[44px] min-h-[44px]"
            )}
            aria-label={
              toggleAriaLabel || 
              (isVisible ? "Hide password" : "Show password")
            }
            aria-pressed={isVisible}
            tabIndex={disabled ? -1 : 0}
          >
            {isVisible ? (
              <EyeOff className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Eye className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Enhanced security indicator */}
        {enhancedSecurity && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Shield className="w-3 h-3 mr-1" aria-hidden="true" />
            Enhanced security mode enabled
          </div>
        )}

        {/* Password strength meter */}
        {renderStrengthMeter()}

        {/* Password requirements */}
        {renderPasswordRequirements()}

        {/* Error message */}
        {renderError()}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

// =============================================================================
// EXPORTS
// =============================================================================

export default PasswordInput;

export {
  type PasswordInputProps,
  type PasswordRule,
  type PasswordStrength,
  type PasswordStrengthConfig,
  type PasswordSecurityConfig,
  type PasswordConfirmationConfig,
  DEFAULT_PASSWORD_RULES,
  DEFAULT_STRENGTH_MESSAGES,
  calculatePasswordStrength,
};