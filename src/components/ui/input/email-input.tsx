'use client';

/**
 * EmailInput Component
 * 
 * Enhanced email input component with validation, autocomplete suggestions, 
 * typo detection, and accessibility features. Optimized for email entry with 
 * proper validation and UX enhancements for registration and profile workflows.
 * 
 * Features:
 * - International domain name support
 * - Real-time email format validation
 * - Common email provider autocomplete
 * - Typo detection and correction suggestions
 * - Multiple email support with delimiter handling
 * - WCAG 2.1 AA accessibility compliance
 * - Browser autocomplete integration
 * - Consistent Tailwind CSS styling
 * 
 * @fileoverview Email input component for React 19/Next.js 15.1
 * @version 1.0.0
 */

import React, { useState, useRef, useCallback, useMemo, useId, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { InputProps } from '@/types/ui';

// Common email providers for autocomplete suggestions
const COMMON_EMAIL_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'protonmail.com',
  'aol.com',
  'live.com',
  'msn.com',
  'company.com', // Placeholder for business emails
] as const;

// Common typos and their corrections
const DOMAIN_TYPO_CORRECTIONS = {
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'outllok.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'iclou.com': 'icloud.com',
  'icloud.co': 'icloud.com',
} as const;

// Email validation regex supporting international domain names
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Multiple email delimiters
const EMAIL_DELIMITERS = /[,;]/;

/**
 * Extended props for EmailInput component
 */
export interface EmailInputProps extends Omit<InputProps, 'type'> {
  /** Support multiple email addresses */
  multiple?: boolean;
  /** Show domain suggestions */
  showSuggestions?: boolean;
  /** Show typo corrections */
  showTypoCorrections?: boolean;
  /** Custom email providers for autocomplete */
  customProviders?: string[];
  /** Validation callback for custom rules */
  validateEmail?: (email: string) => string | undefined;
  /** Callback when email suggestions are accepted */
  onSuggestionAccept?: (suggestion: string) => void;
  /** Callback when typo correction is applied */
  onTypoCorrection?: (original: string, corrected: string) => void;
}

/**
 * Validates a single email address
 */
const validateSingleEmail = (email: string): boolean => {
  if (!email.trim()) return false;
  
  // Support for international domain names by allowing Unicode characters
  const internationalEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-\u00A0-\uFFFF]+@[a-zA-Z0-9\u00A0-\uFFFF](?:[a-zA-Z0-9-\u00A0-\uFFFF]{0,61}[a-zA-Z0-9\u00A0-\uFFFF])?(?:\.[a-zA-Z0-9\u00A0-\uFFFF](?:[a-zA-Z0-9-\u00A0-\uFFFF]{0,61}[a-zA-Z0-9\u00A0-\uFFFF])?)*$/;
  
  return internationalEmailRegex.test(email.trim());
};

/**
 * Validates multiple email addresses
 */
const validateMultipleEmails = (emails: string): { isValid: boolean; invalidEmails: string[] } => {
  const emailList = emails.split(EMAIL_DELIMITERS).map(email => email.trim()).filter(Boolean);
  const invalidEmails = emailList.filter(email => !validateSingleEmail(email));
  
  return {
    isValid: invalidEmails.length === 0 && emailList.length > 0,
    invalidEmails
  };
};

/**
 * Detects potential typos in email domain
 */
const detectDomainTypo = (email: string): string | null => {
  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) return null;
  
  const domain = email.substring(atIndex + 1).toLowerCase();
  const correction = DOMAIN_TYPO_CORRECTIONS[domain as keyof typeof DOMAIN_TYPO_CORRECTIONS];
  
  return correction ? `${email.substring(0, atIndex + 1)}${correction}` : null;
};

/**
 * Generates domain suggestions based on input
 */
const generateDomainSuggestions = (
  email: string, 
  customProviders: string[] = []
): string[] => {
  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) return [];
  
  const username = email.substring(0, atIndex);
  const partialDomain = email.substring(atIndex + 1).toLowerCase();
  
  if (!username || !partialDomain) return [];
  
  const allProviders = [...COMMON_EMAIL_PROVIDERS, ...customProviders];
  
  return allProviders
    .filter(provider => 
      provider.toLowerCase().startsWith(partialDomain) && 
      provider.toLowerCase() !== partialDomain
    )
    .slice(0, 3) // Limit to 3 suggestions
    .map(provider => `${username}@${provider}`);
};

/**
 * EmailInput Component
 */
export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(({
  multiple = false,
  showSuggestions = true,
  showTypoCorrections = true,
  customProviders = [],
  validateEmail,
  onSuggestionAccept,
  onTypoCorrection,
  value = '',
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  error: externalError,
  className,
  disabled,
  required,
  autoComplete = 'email',
  placeholder = 'Enter email address',
  'aria-describedby': ariaDescribedby,
  'aria-label': ariaLabel,
  'data-testid': testId,
  ...props
}, ref) => {
  // Generate unique IDs for accessibility
  const inputId = useId();
  const errorId = useId();
  const suggestionsId = useId();
  const helperId = useId();
  
  // Internal state
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [typoCorrection, setTypoCorrection] = useState<string | null>(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [validationError, setValidationError] = useState<string | undefined>();
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Determine if controlled or uncontrolled
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  
  // Validate current value
  const validateCurrentValue = useCallback((emailValue: string) => {
    if (!emailValue.trim()) {
      if (required) {
        return 'Email address is required';
      }
      return undefined;
    }
    
    // Custom validation first
    if (validateEmail) {
      const customError = validateEmail(emailValue);
      if (customError) return customError;
    }
    
    if (multiple) {
      const { isValid, invalidEmails } = validateMultipleEmails(emailValue);
      if (!isValid) {
        return `Invalid email${invalidEmails.length > 1 ? 's' : ''}: ${invalidEmails.join(', ')}`;
      }
    } else {
      if (!validateSingleEmail(emailValue)) {
        return 'Please enter a valid email address';
      }
    }
    
    return undefined;
  }, [multiple, required, validateEmail]);
  
  // Update validation error when value changes
  React.useEffect(() => {
    const error = validateCurrentValue(currentValue);
    setValidationError(error);
  }, [currentValue, validateCurrentValue]);
  
  // Generate suggestions and typo corrections
  const { domainSuggestions, detectedTypo } = useMemo(() => {
    if (!focused || !currentValue.includes('@')) {
      return { domainSuggestions: [], detectedTypo: null };
    }
    
    // For multiple emails, only suggest for the last email being typed
    const emails = multiple ? currentValue.split(EMAIL_DELIMITERS) : [currentValue];
    const lastEmail = emails[emails.length - 1]?.trim() || '';
    
    const domainSuggestions = showSuggestions 
      ? generateDomainSuggestions(lastEmail, customProviders)
      : [];
    
    const detectedTypo = showTypoCorrections 
      ? detectDomainTypo(lastEmail)
      : null;
    
    return { domainSuggestions, detectedTypo };
  }, [currentValue, focused, multiple, showSuggestions, showTypoCorrections, customProviders]);
  
  // Update suggestions state
  React.useEffect(() => {
    setSuggestions(domainSuggestions);
    setTypoCorrection(detectedTypo);
    setActiveSuggestionIndex(-1);
  }, [domainSuggestions, detectedTypo]);
  
  // Handle value change
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    onChange?.(newValue);
  }, [isControlled, onChange]);
  
  // Handle focus
  const handleFocus = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    onFocus?.(event);
  }, [onFocus]);
  
  // Handle blur
  const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    // Delay blur to allow suggestion clicks
    setTimeout(() => {
      setFocused(false);
      setActiveSuggestionIndex(-1);
    }, 150);
    
    onBlur?.(event);
  }, [onBlur]);
  
  // Handle suggestion acceptance
  const acceptSuggestion = useCallback((suggestion: string) => {
    let newValue = suggestion;
    
    if (multiple) {
      const emails = currentValue.split(EMAIL_DELIMITERS);
      emails[emails.length - 1] = suggestion;
      newValue = emails.join(', ');
    }
    
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    onChange?.(newValue);
    onSuggestionAccept?.(suggestion);
    setFocused(false);
    inputRef.current?.focus();
  }, [currentValue, multiple, isControlled, onChange, onSuggestionAccept]);
  
  // Handle typo correction
  const acceptTypoCorrection = useCallback(() => {
    if (!typoCorrection) return;
    
    let newValue = typoCorrection;
    
    if (multiple) {
      const emails = currentValue.split(EMAIL_DELIMITERS);
      const originalEmail = emails[emails.length - 1]?.trim() || '';
      emails[emails.length - 1] = typoCorrection;
      newValue = emails.join(', ');
      onTypoCorrection?.(originalEmail, typoCorrection);
    } else {
      onTypoCorrection?.(currentValue, typoCorrection);
    }
    
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    onChange?.(newValue);
    setTypoCorrection(null);
    inputRef.current?.focus();
  }, [typoCorrection, currentValue, multiple, isControlled, onChange, onTypoCorrection]);
  
  // Keyboard navigation for suggestions
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    const totalSuggestions = suggestions.length + (typoCorrection ? 1 : 0);
    
    if (totalSuggestions === 0) return;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < totalSuggestions - 1 ? prev + 1 : -1
        );
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev > -1 ? prev - 1 : totalSuggestions - 1
        );
        break;
        
      case 'Enter':
        if (activeSuggestionIndex >= 0) {
          event.preventDefault();
          
          if (typoCorrection && activeSuggestionIndex === 0) {
            acceptTypoCorrection();
          } else {
            const suggestionIndex = typoCorrection ? activeSuggestionIndex - 1 : activeSuggestionIndex;
            const suggestion = suggestions[suggestionIndex];
            if (suggestion) {
              acceptSuggestion(suggestion);
            }
          }
        }
        break;
        
      case 'Escape':
        setFocused(false);
        setActiveSuggestionIndex(-1);
        break;
    }
  }, [suggestions, typoCorrection, activeSuggestionIndex, acceptSuggestion, acceptTypoCorrection]);
  
  // Determine error state
  const hasError = !!(externalError || validationError);
  const errorMessage = externalError || validationError;
  
  // Combine refs
  const combinedRef = useCallback((element: HTMLInputElement | null) => {
    if (typeof ref === 'function') {
      ref(element);
    } else if (ref) {
      ref.current = element;
    }
    inputRef.current = element;
  }, [ref]);
  
  // ARIA attributes
  const ariaAttributes = {
    'aria-invalid': hasError,
    'aria-describedby': cn(
      hasError && errorId,
      ariaDescribedby,
      helperId
    ).trim() || undefined,
    'aria-expanded': focused && (suggestions.length > 0 || !!typoCorrection),
    'aria-haspopup': 'listbox',
    'aria-owns': focused && (suggestions.length > 0 || !!typoCorrection) ? suggestionsId : undefined,
    'aria-activedescendant': activeSuggestionIndex >= 0 
      ? `${suggestionsId}-option-${activeSuggestionIndex}`
      : undefined,
    'aria-label': ariaLabel || (multiple ? 'Enter multiple email addresses' : 'Enter email address'),
  };
  
  return (
    <div className="relative w-full">
      {/* Main Input */}
      <input
        {...props}
        ref={combinedRef}
        id={inputId}
        type="email"
        value={currentValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        placeholder={multiple ? 'Enter email addresses separated by commas' : placeholder}
        className={cn(
          // Base styles
          'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors duration-200',
          
          // Error styles
          hasError && 'border-destructive focus-visible:ring-destructive',
          
          // Success styles (when valid and has content)
          !hasError && currentValue && validationError === undefined && 
          'border-success focus-visible:ring-success',
          
          // Custom className
          className
        )}
        data-testid={testId || 'email-input'}
        {...ariaAttributes}
      />
      
      {/* Suggestions Dropdown */}
      {focused && (suggestions.length > 0 || typoCorrection) && (
        <div
          ref={suggestionsRef}
          id={suggestionsId}
          role="listbox"
          aria-label="Email suggestions"
          className={cn(
            'absolute z-50 w-full mt-1 bg-popover text-popover-foreground',
            'border border-border rounded-md shadow-md max-h-60 overflow-auto',
            'animate-fade-in'
          )}
        >
          {/* Typo Correction */}
          {typoCorrection && (
            <div
              id={`${suggestionsId}-option-0`}
              role="option"
              aria-selected={activeSuggestionIndex === 0}
              className={cn(
                'px-3 py-2 cursor-pointer border-b border-border last:border-b-0',
                'hover:bg-muted transition-colors duration-150',
                activeSuggestionIndex === 0 && 'bg-accent text-accent-foreground'
              )}
              onClick={acceptTypoCorrection}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Did you mean:</span>
                <span className="font-medium">{typoCorrection}</span>
              </div>
            </div>
          )}
          
          {/* Domain Suggestions */}
          {suggestions.map((suggestion, index) => {
            const adjustedIndex = typoCorrection ? index + 1 : index;
            return (
              <div
                key={suggestion}
                id={`${suggestionsId}-option-${adjustedIndex}`}
                role="option"
                aria-selected={activeSuggestionIndex === adjustedIndex}
                className={cn(
                  'px-3 py-2 cursor-pointer border-b border-border last:border-b-0',
                  'hover:bg-muted transition-colors duration-150',
                  activeSuggestionIndex === adjustedIndex && 'bg-accent text-accent-foreground'
                )}
                onClick={() => acceptSuggestion(suggestion)}
              >
                {suggestion}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Error Message */}
      {hasError && errorMessage && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          className="mt-1 text-xs text-destructive"
          data-testid="email-input-error"
        >
          {errorMessage}
        </div>
      )}
      
      {/* Helper Text */}
      {multiple && !hasError && (
        <div
          id={helperId}
          className="mt-1 text-xs text-muted-foreground"
          data-testid="email-input-helper"
        >
          Separate multiple email addresses with commas or semicolons
        </div>
      )}
      
      {/* Screen Reader Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {focused && suggestions.length > 0 && 
          `${suggestions.length} email suggestions available. Use arrow keys to navigate and Enter to select.`
        }
        {typoCorrection && 
          `Possible typo detected. Suggested correction: ${typoCorrection}`
        }
      </div>
    </div>
  );
});

EmailInput.displayName = 'EmailInput';

export default EmailInput;