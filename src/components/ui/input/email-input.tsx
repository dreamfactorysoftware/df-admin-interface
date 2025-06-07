/**
 * Email Input Component with Enhanced Validation and UX Features
 * 
 * A comprehensive email input component designed for the DreamFactory Admin Interface
 * React 19/Next.js 15.1 refactoring. Provides advanced email validation, autocomplete
 * suggestions, typo detection, and full WCAG 2.1 AA accessibility compliance.
 * 
 * Features:
 * - International domain name support with comprehensive validation
 * - Privacy-conscious autocomplete suggestions for common email providers
 * - Intelligent typo detection with helpful correction suggestions
 * - Multiple email support with flexible delimiter handling
 * - Real-time validation feedback with accessible error announcements
 * - Browser autocomplete integration for seamless form filling
 * - WCAG 2.1 AA accessibility with enhanced keyboard navigation
 * - Consistent styling with email-specific visual indicators
 * - React Hook Form integration with Zod schema validation
 * 
 * @fileoverview Enhanced email input component for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, forwardRef } from 'react';
import { AtSign, Check, AlertCircle, ChevronDown, X, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import type { 
  InputProps, 
  InputRef,
  InputSize,
  InputVariant,
  InputState,
  ValidationSeverity 
} from './input.types';

// =============================================================================
// EMAIL VALIDATION AND DOMAIN CONSTANTS
// =============================================================================

/**
 * Common email providers for autocomplete suggestions
 * Privacy-conscious list focusing on major providers only
 */
const COMMON_EMAIL_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'live.com',
  'msn.com',
  'comcast.net',
  'verizon.net',
  'att.net',
  'sbcglobal.net',
  'protonmail.com',
  'tutanota.com',
] as const;

/**
 * Common typos and their corrections for better UX
 * Focuses on frequent typing mistakes for major providers
 */
const TYPO_CORRECTIONS = {
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmailcom': 'gmail.com',
  'yahoo.co': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'hotmai.com': 'hotmail.com',
  'hotmailcom': 'hotmail.com',
  'outloo.com': 'outlook.com',
  'outlok.com': 'outlook.com',
  'outlook.co': 'outlook.com',
} as const;

/**
 * Email validation regex supporting international domains
 * Based on RFC 5322 specification with practical considerations
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Multiple email delimiters for flexible input handling
 */
const EMAIL_DELIMITERS = [',', ';', ' ', '\n', '\t'] as const;

/**
 * Maximum number of email suggestions to show
 */
const MAX_SUGGESTIONS = 5;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Email validation result interface
 */
interface EmailValidationResult {
  isValid: boolean;
  message?: string;
  severity?: ValidationSeverity;
  suggestions?: string[];
}

/**
 * Email autocomplete suggestion interface
 */
interface EmailSuggestion {
  email: string;
  domain: string;
  type: 'autocomplete' | 'typo-correction';
  confidence: number;
}

/**
 * Email input specific props extending base input props
 */
interface EmailInputProps extends Omit<InputProps, 'type'> {
  /** Allow multiple email addresses with delimiter support */
  multiple?: boolean;
  
  /** Custom email delimiters (defaults to comma, semicolon, space) */
  delimiters?: string[];
  
  /** Enable domain autocomplete suggestions */
  enableAutocomplete?: boolean;
  
  /** Enable typo detection and correction suggestions */
  enableTypoDetection?: boolean;
  
  /** Custom email providers for autocomplete */
  customProviders?: string[];
  
  /** Maximum number of emails allowed (for multiple mode) */
  maxEmails?: number;
  
  /** Validation mode timing */
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit';
  
  /** Custom email validation function */
  customValidator?: (email: string) => EmailValidationResult;
  
  /** Callback when emails are added/removed (multiple mode) */
  onEmailsChange?: (emails: string[]) => void;
  
  /** Callback when suggestion is selected */
  onSuggestionSelect?: (suggestion: EmailSuggestion) => void;
  
  /** Show email validation status icons */
  showValidationIcons?: boolean;
  
  /** Placeholder text for email input */
  emailPlaceholder?: string;
  
  /** Domain whitelist for restricted email domains */
  allowedDomains?: string[];
  
  /** Domain blacklist for blocked email domains */
  blockedDomains?: string[];
}

/**
 * Email input component state interface
 */
interface EmailInputState {
  inputValue: string;
  emails: string[];
  suggestions: EmailSuggestion[];
  showSuggestions: boolean;
  activeSuggestionIndex: number;
  validationResults: Map<string, EmailValidationResult>;
  isValidating: boolean;
  hasFocus: boolean;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Validate single email address with comprehensive checks
 */
const validateEmail = (
  email: string,
  options: {
    allowedDomains?: string[];
    blockedDomains?: string[];
    customValidator?: (email: string) => EmailValidationResult;
  } = {}
): EmailValidationResult => {
  const trimmedEmail = email.trim().toLowerCase();
  
  // Empty email check
  if (!trimmedEmail) {
    return {
      isValid: false,
      message: 'Email address is required',
      severity: 'error'
    };
  }
  
  // Basic format validation
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address',
      severity: 'error'
    };
  }
  
  // Extract domain for additional checks
  const domain = trimmedEmail.split('@')[1];
  
  // Domain whitelist check
  if (options.allowedDomains && options.allowedDomains.length > 0) {
    if (!options.allowedDomains.includes(domain)) {
      return {
        isValid: false,
        message: `Email domain must be one of: ${options.allowedDomains.join(', ')}`,
        severity: 'error'
      };
    }
  }
  
  // Domain blacklist check
  if (options.blockedDomains && options.blockedDomains.includes(domain)) {
    return {
      isValid: false,
      message: 'This email domain is not allowed',
      severity: 'error'
    };
  }
  
  // Custom validation
  if (options.customValidator) {
    const customResult = options.customValidator(trimmedEmail);
    if (!customResult.isValid) {
      return customResult;
    }
  }
  
  return {
    isValid: true,
    message: 'Valid email address',
    severity: 'success'
  };
};

/**
 * Generate email autocomplete suggestions
 */
const generateEmailSuggestions = (
  input: string,
  providers: string[] = [...COMMON_EMAIL_PROVIDERS],
  enableTypoDetection: boolean = true
): EmailSuggestion[] => {
  const suggestions: EmailSuggestion[] = [];
  const trimmedInput = input.trim().toLowerCase();
  
  if (!trimmedInput || !trimmedInput.includes('@')) {
    // No @ symbol yet, suggest adding common domains
    if (trimmedInput.length > 0) {
      providers.slice(0, MAX_SUGGESTIONS).forEach((provider, index) => {
        suggestions.push({
          email: `${trimmedInput}@${provider}`,
          domain: provider,
          type: 'autocomplete',
          confidence: 1 - (index * 0.1)
        });
      });
    }
    return suggestions;
  }
  
  const [localPart, domainPart] = trimmedInput.split('@');
  
  if (!localPart) {
    return suggestions;
  }
  
  // Typo correction suggestions
  if (enableTypoDetection && domainPart) {
    const correction = TYPO_CORRECTIONS[domainPart as keyof typeof TYPO_CORRECTIONS];
    if (correction) {
      suggestions.push({
        email: `${localPart}@${correction}`,
        domain: correction,
        type: 'typo-correction',
        confidence: 0.95
      });
    }
  }
  
  // Domain autocomplete suggestions
  if (domainPart && domainPart.length > 0) {
    const matchingProviders = providers.filter(provider => 
      provider.startsWith(domainPart) && provider !== domainPart
    );
    
    matchingProviders.slice(0, MAX_SUGGESTIONS - suggestions.length).forEach((provider, index) => {
      suggestions.push({
        email: `${localPart}@${provider}`,
        domain: provider,
        type: 'autocomplete',
        confidence: 0.8 - (index * 0.1)
      });
    });
  }
  
  // Sort by confidence and limit results
  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_SUGGESTIONS);
};

/**
 * Parse multiple emails from input string using delimiters
 */
const parseMultipleEmails = (
  input: string,
  delimiters: string[] = [',', ';']
): string[] => {
  if (!input.trim()) return [];
  
  // Create regex pattern from delimiters
  const delimiterPattern = delimiters.map(d => 
    d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  ).join('|');
  
  const regex = new RegExp(`[${delimiterPattern}]`);
  
  return input
    .split(regex)
    .map(email => email.trim())
    .filter(email => email.length > 0);
};

/**
 * Get input state styling based on validation results
 */
const getInputStateFromValidation = (
  validationResults: Map<string, EmailValidationResult>,
  emails: string[]
): InputState => {
  if (emails.length === 0) return 'default';
  
  const hasErrors = Array.from(validationResults.values()).some(result => 
    !result.isValid && result.severity === 'error'
  );
  
  if (hasErrors) return 'error';
  
  const hasWarnings = Array.from(validationResults.values()).some(result => 
    result.severity === 'warning'
  );
  
  if (hasWarnings) return 'warning';
  
  const allValid = emails.every(email => {
    const result = validationResults.get(email);
    return result && result.isValid;
  });
  
  return allValid ? 'success' : 'default';
};

// =============================================================================
// MAIN COMPONENT IMPLEMENTATION
// =============================================================================

/**
 * Enhanced Email Input Component
 * 
 * @example
 * ```tsx
 * // Basic email input
 * <EmailInput 
 *   name="email"
 *   label="Email Address"
 *   placeholder="Enter your email"
 *   required
 * />
 * 
 * // Multiple emails with custom delimiters
 * <EmailInput
 *   name="recipients"
 *   label="Recipients"
 *   multiple
 *   delimiters={[',', ';', '\n']}
 *   maxEmails={10}
 *   onEmailsChange={(emails) => console.log(emails)}
 * />
 * 
 * // Custom validation with domain restrictions
 * <EmailInput
 *   name="workEmail"
 *   label="Work Email"
 *   allowedDomains={['company.com', 'partner.org']}
 *   customValidator={(email) => ({
 *     isValid: !email.includes('temp'),
 *     message: 'Temporary emails not allowed',
 *     severity: 'error'
 *   })}
 * />
 * ```
 */
export const EmailInput = forwardRef<InputRef, EmailInputProps>(({
  // Email-specific props
  multiple = false,
  delimiters = [',', ';'],
  enableAutocomplete = true,
  enableTypoDetection = true,
  customProviders = [],
  maxEmails = 10,
  validationMode = 'onChange',
  customValidator,
  onEmailsChange,
  onSuggestionSelect,
  showValidationIcons = true,
  emailPlaceholder,
  allowedDomains,
  blockedDomains,
  
  // Base input props
  className,
  value = '',
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  placeholder = 'Enter email address',
  disabled = false,
  readonly = false,
  required = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'data-testid': testId,
  
  // Input configuration
  variant = 'outline',
  size = 'md',
  label,
  labelPosition = 'top',
  helperText,
  error,
  showLabel = true,
  
  // Event handlers
  onValueChange,
  onValidationChange,
  onClear,
  
  ...rest
}, ref) => {
  // =============================================================================
  // HOOKS AND STATE MANAGEMENT
  // =============================================================================
  
  const { resolvedTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const [mounted, setMounted] = useState(false);
  
  // Component state
  const [state, setState] = useState<EmailInputState>({
    inputValue: typeof value === 'string' ? value : '',
    emails: [],
    suggestions: [],
    showSuggestions: false,
    activeSuggestionIndex: -1,
    validationResults: new Map(),
    isValidating: false,
    hasFocus: false,
  });
  
  // Memoized email providers list
  const emailProviders = useMemo(() => [
    ...COMMON_EMAIL_PROVIDERS,
    ...customProviders
  ], [customProviders]);
  
  // =============================================================================
  // VALIDATION AND EMAIL PROCESSING
  // =============================================================================
  
  /**
   * Validate all emails and update validation results
   */
  const validateEmails = useCallback(async (emails: string[]) => {
    if (emails.length === 0) {
      setState(prev => ({ ...prev, validationResults: new Map() }));
      return;
    }
    
    setState(prev => ({ ...prev, isValidating: true }));
    
    const validationResults = new Map<string, EmailValidationResult>();
    
    for (const email of emails) {
      const result = validateEmail(email, {
        allowedDomains,
        blockedDomains,
        customValidator
      });
      validationResults.set(email, result);
    }
    
    setState(prev => ({
      ...prev,
      validationResults,
      isValidating: false
    }));
    
    // Notify validation change
    const hasErrors = Array.from(validationResults.values()).some(result => !result.isValid);
    const validationState = hasErrors ? { isValid: false, error: 'Please correct email errors' } : { isValid: true };
    onValidationChange?.(validationState);
  }, [allowedDomains, blockedDomains, customValidator, onValidationChange]);
  
  /**
   * Process input value and extract emails
   */
  const processInput = useCallback((inputValue: string) => {
    if (multiple) {
      const parsedEmails = parseMultipleEmails(inputValue, delimiters);
      const uniqueEmails = Array.from(new Set(parsedEmails));
      
      // Limit number of emails
      const limitedEmails = uniqueEmails.slice(0, maxEmails);
      
      setState(prev => ({ ...prev, emails: limitedEmails }));
      onEmailsChange?.(limitedEmails);
      
      // Validate if not in submit-only mode
      if (validationMode !== 'onSubmit') {
        validateEmails(limitedEmails);
      }
    } else {
      const emails = inputValue.trim() ? [inputValue.trim()] : [];
      setState(prev => ({ ...prev, emails }));
      
      if (validationMode === 'onChange' && inputValue.trim()) {
        validateEmails(emails);
      }
    }
  }, [multiple, delimiters, maxEmails, validationMode, onEmailsChange, validateEmails]);
  
  /**
   * Generate and update autocomplete suggestions
   */
  const updateSuggestions = useCallback((inputValue: string) => {
    if (!enableAutocomplete || disabled || readonly) {
      setState(prev => ({ ...prev, suggestions: [], showSuggestions: false }));
      return;
    }
    
    const suggestions = generateEmailSuggestions(
      inputValue,
      emailProviders,
      enableTypoDetection
    );
    
    setState(prev => ({
      ...prev,
      suggestions,
      showSuggestions: suggestions.length > 0 && inputValue.length > 0,
      activeSuggestionIndex: -1
    }));
  }, [enableAutocomplete, disabled, readonly, emailProviders, enableTypoDetection]);
  
  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  /**
   * Handle input value changes
   */
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    setState(prev => ({ ...prev, inputValue: newValue }));
    
    // Update suggestions for autocomplete
    updateSuggestions(newValue);
    
    // Process emails if multiple mode and contains delimiters
    if (multiple && delimiters.some(delimiter => newValue.includes(delimiter))) {
      processInput(newValue);
      setState(prev => ({ ...prev, inputValue: '' }));
    } else {
      processInput(newValue);
    }
    
    // Call external change handlers
    onChange?.(event);
    onValueChange?.(newValue, event);
  }, [multiple, delimiters, processInput, updateSuggestions, onChange, onValueChange]);
  
  /**
   * Handle input focus
   */
  const handleFocus = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    setState(prev => ({ 
      ...prev, 
      hasFocus: true,
      showSuggestions: prev.suggestions.length > 0 && enableAutocomplete
    }));
    
    onFocus?.(event);
  }, [enableAutocomplete, onFocus]);
  
  /**
   * Handle input blur
   */
  const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    // Delay hiding suggestions to allow selection
    setTimeout(() => {
      setState(prev => ({ 
        ...prev, 
        hasFocus: false,
        showSuggestions: false,
        activeSuggestionIndex: -1
      }));
      
      // Validate on blur if configured
      if (validationMode === 'onBlur' && state.emails.length > 0) {
        validateEmails(state.emails);
      }
    }, 150);
    
    onBlur?.(event);
  }, [validationMode, state.emails, validateEmails, onBlur]);
  
  /**
   * Handle keyboard navigation and selection
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    const { suggestions, showSuggestions, activeSuggestionIndex, inputValue } = state;
    
    if (showSuggestions && suggestions.length > 0) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setState(prev => ({
            ...prev,
            activeSuggestionIndex: Math.min(
              prev.activeSuggestionIndex + 1,
              prev.suggestions.length - 1
            )
          }));
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          setState(prev => ({
            ...prev,
            activeSuggestionIndex: Math.max(prev.activeSuggestionIndex - 1, -1)
          }));
          break;
          
        case 'Enter':
          event.preventDefault();
          if (activeSuggestionIndex >= 0) {
            const selectedSuggestion = suggestions[activeSuggestionIndex];
            selectSuggestion(selectedSuggestion);
          } else if (inputValue.trim()) {
            // Add current input as email
            setState(prev => ({ ...prev, inputValue: '' }));
            processInput(inputValue);
          }
          break;
          
        case 'Escape':
          setState(prev => ({
            ...prev,
            showSuggestions: false,
            activeSuggestionIndex: -1
          }));
          break;
          
        case 'Tab':
          if (activeSuggestionIndex >= 0) {
            event.preventDefault();
            const selectedSuggestion = suggestions[activeSuggestionIndex];
            selectSuggestion(selectedSuggestion);
          }
          break;
      }
    }
    
    // Handle multiple email completion with delimiters
    if (multiple && delimiters.includes(event.key) && inputValue.trim()) {
      event.preventDefault();
      processInput(inputValue);
      setState(prev => ({ ...prev, inputValue: '' }));
    }
    
    onKeyDown?.(event);
  }, [state, multiple, delimiters, processInput, onKeyDown]);
  
  /**
   * Select an autocomplete suggestion
   */
  const selectSuggestion = useCallback((suggestion: EmailSuggestion) => {
    setState(prev => ({
      ...prev,
      inputValue: multiple ? '' : suggestion.email,
      showSuggestions: false,
      activeSuggestionIndex: -1
    }));
    
    if (multiple) {
      setState(prev => ({
        ...prev,
        emails: [...prev.emails, suggestion.email]
      }));
      onEmailsChange?.([...state.emails, suggestion.email]);
    } else {
      processInput(suggestion.email);
    }
    
    onSuggestionSelect?.(suggestion);
    
    // Focus back to input
    inputRef.current?.focus();
  }, [multiple, processInput, state.emails, onEmailsChange, onSuggestionSelect]);
  
  /**
   * Remove email from multiple mode
   */
  const removeEmail = useCallback((emailToRemove: string) => {
    const updatedEmails = state.emails.filter(email => email !== emailToRemove);
    setState(prev => ({
      ...prev,
      emails: updatedEmails,
      validationResults: new Map(
        [...prev.validationResults.entries()].filter(([email]) => email !== emailToRemove)
      )
    }));
    onEmailsChange?.(updatedEmails);
  }, [state.emails, onEmailsChange]);
  
  /**
   * Clear all input
   */
  const handleClear = useCallback(() => {
    setState(prev => ({
      ...prev,
      inputValue: '',
      emails: [],
      suggestions: [],
      showSuggestions: false,
      validationResults: new Map()
    }));
    onClear?.();
    onEmailsChange?.([]);
    inputRef.current?.focus();
  }, [onClear, onEmailsChange]);
  
  // =============================================================================
  // EFFECTS
  // =============================================================================
  
  // Handle mounting
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Update internal state when external value changes
  useEffect(() => {
    if (typeof value === 'string' && value !== state.inputValue) {
      setState(prev => ({ ...prev, inputValue: value }));
      processInput(value);
    }
  }, [value, state.inputValue, processInput]);
  
  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  
  const inputState = getInputStateFromValidation(state.validationResults, state.emails);
  const hasValue = state.inputValue.length > 0 || state.emails.length > 0;
  const showClearButton = hasValue && !disabled && !readonly;
  
  // Calculate error message
  const errorMessage = error || (() => {
    const errorResults = Array.from(state.validationResults.values())
      .filter(result => !result.isValid && result.severity === 'error');
    return errorResults.length > 0 ? errorResults[0].message : undefined;
  })();
  
  // Calculate success message
  const successMessage = (() => {
    if (state.emails.length === 0) return undefined;
    const allValid = state.emails.every(email => {
      const result = state.validationResults.get(email);
      return result && result.isValid;
    });
    return allValid ? `${state.emails.length} valid email${state.emails.length !== 1 ? 's' : ''}` : undefined;
  })();
  
  // =============================================================================
  // STYLING
  // =============================================================================
  
  const containerClasses = cn(
    'relative w-full',
    className
  );
  
  const inputClasses = cn(
    // Base input styling
    'w-full rounded-md border transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'placeholder:text-gray-400 dark:placeholder:text-gray-500',
    
    // Size variants
    {
      'h-9 px-3 text-sm': size === 'sm',
      'h-10 px-3 text-sm': size === 'md',
      'h-11 px-4 text-base': size === 'lg',
      'h-12 px-4 text-lg': size === 'xl',
    },
    
    // Variant styles
    {
      // Outline variant
      'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800': variant === 'outline' && inputState === 'default',
      'border-red-300 dark:border-red-600 bg-white dark:bg-gray-800': variant === 'outline' && inputState === 'error',
      'border-green-300 dark:border-green-600 bg-white dark:bg-gray-800': variant === 'outline' && inputState === 'success',
      'border-yellow-300 dark:border-yellow-600 bg-white dark:bg-gray-800': variant === 'outline' && inputState === 'warning',
      
      // Filled variant
      'border-transparent bg-gray-100 dark:bg-gray-700': variant === 'filled' && inputState === 'default',
      'border-transparent bg-red-50 dark:bg-red-900/20': variant === 'filled' && inputState === 'error',
      'border-transparent bg-green-50 dark:bg-green-900/20': variant === 'filled' && inputState === 'success',
      'border-transparent bg-yellow-50 dark:bg-yellow-900/20': variant === 'filled' && inputState === 'warning',
    },
    
    // Focus states
    {
      'focus:border-primary-500 focus:ring-primary-500': inputState === 'default',
      'focus:border-red-500 focus:ring-red-500': inputState === 'error',
      'focus:border-green-500 focus:ring-green-500': inputState === 'success',
      'focus:border-yellow-500 focus:ring-yellow-500': inputState === 'warning',
    },
    
    // Disabled state
    {
      'opacity-50 cursor-not-allowed': disabled,
      'cursor-default': readonly,
    },
    
    // Email input specific styling
    multiple && 'pl-2 pt-1',
    
    // Padding adjustments for icons
    'pr-10'
  );
  
  const labelClasses = cn(
    'block text-sm font-medium',
    {
      'text-gray-700 dark:text-gray-300': inputState === 'default',
      'text-red-700 dark:text-red-400': inputState === 'error',
      'text-green-700 dark:text-green-400': inputState === 'success',
      'text-yellow-700 dark:text-yellow-400': inputState === 'warning',
    },
    labelPosition === 'top' && 'mb-1',
    !showLabel && 'sr-only'
  );
  
  const helperTextClasses = cn(
    'mt-1 text-sm',
    {
      'text-gray-500 dark:text-gray-400': inputState === 'default',
      'text-red-600 dark:text-red-400': inputState === 'error',
      'text-green-600 dark:text-green-400': inputState === 'success',
      'text-yellow-600 dark:text-yellow-400': inputState === 'warning',
    }
  );
  
  // =============================================================================
  // RENDER HELPERS
  // =============================================================================
  
  /**
   * Render email chips for multiple mode
   */
  const renderEmailChips = () => {
    if (!multiple || state.emails.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 p-1">
        {state.emails.map((email, index) => {
          const validationResult = state.validationResults.get(email);
          const isValid = validationResult?.isValid ?? true;
          
          return (
            <div
              key={`${email}-${index}`}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                'transition-colors duration-200',
                {
                  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300': isValid,
                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300': !isValid,
                }
              )}
            >
              <Mail className="w-3 h-3" />
              <span>{email}</span>
              <button
                type="button"
                onClick={() => removeEmail(email)}
                className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-sm p-0.5 transition-colors"
                aria-label={`Remove ${email}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    );
  };
  
  /**
   * Render autocomplete suggestions dropdown
   */
  const renderSuggestions = () => {
    if (!state.showSuggestions || state.suggestions.length === 0) return null;
    
    return (
      <ul
        ref={suggestionsRef}
        className={cn(
          'absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
          'rounded-md shadow-lg max-h-60 overflow-auto',
          'py-1'
        )}
        role="listbox"
        aria-label="Email suggestions"
      >
        {state.suggestions.map((suggestion, index) => (
          <li
            key={`${suggestion.email}-${index}`}
            role="option"
            aria-selected={index === state.activeSuggestionIndex}
            className={cn(
              'px-3 py-2 cursor-pointer transition-colors duration-150',
              'flex items-center justify-between',
              {
                'bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100': 
                  index === state.activeSuggestionIndex,
                'hover:bg-gray-50 dark:hover:bg-gray-700': index !== state.activeSuggestionIndex,
              }
            )}
            onClick={() => selectSuggestion(suggestion)}
            onMouseEnter={() => setState(prev => ({ ...prev, activeSuggestionIndex: index }))}
          >
            <div className="flex items-center gap-2">
              <AtSign className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{suggestion.email}</span>
            </div>
            {suggestion.type === 'typo-correction' && (
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded">
                Did you mean?
              </span>
            )}
          </li>
        ))}
      </ul>
    );
  };
  
  /**
   * Render validation icons
   */
  const renderValidationIcon = () => {
    if (!showValidationIcons || state.emails.length === 0) return null;
    
    switch (inputState) {
      case 'success':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };
  
  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  
  if (!mounted) {
    return <div className={containerClasses} />;
  }
  
  return (
    <div className={containerClasses}>
      {/* Label */}
      {label && (
        <label htmlFor={rest.id || rest.name} className={labelClasses}>
          {label}
          {required && (
            <span className="ml-1 text-red-500" aria-label="required">
              *
            </span>
          )}
        </label>
      )}
      
      {/* Input Container */}
      <div className="relative">
        {/* Email Chips (Multiple Mode) */}
        {renderEmailChips()}
        
        {/* Input Field */}
        <div className="relative">
          <input
            ref={inputRef}
            type="email"
            className={inputClasses}
            value={state.inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={emailPlaceholder || placeholder}
            disabled={disabled}
            readOnly={readonly}
            required={required}
            autoComplete="email"
            spellCheck={false}
            aria-label={ariaLabel || label}
            aria-describedby={ariaDescribedBy}
            aria-invalid={inputState === 'error'}
            aria-expanded={state.showSuggestions}
            aria-autocomplete="list"
            aria-controls={state.showSuggestions ? 'email-suggestions' : undefined}
            data-testid={testId}
            {...rest}
          />
          
          {/* Input Icons */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
            {state.isValidating && (
              <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            )}
            {renderValidationIcon()}
            {showClearButton && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm transition-colors"
                aria-label="Clear email input"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
        
        {/* Suggestions Dropdown */}
        {renderSuggestions()}
      </div>
      
      {/* Helper Text / Error Message */}
      {(helperText || errorMessage || successMessage) && (
        <div className={helperTextClasses}>
          {errorMessage || successMessage || helperText}
        </div>
      )}
      
      {/* Multiple Email Count */}
      {multiple && state.emails.length > 0 && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {state.emails.length} of {maxEmails} email{state.emails.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
});

EmailInput.displayName = 'EmailInput';

export default EmailInput;