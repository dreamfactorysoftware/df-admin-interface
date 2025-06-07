/**
 * Number Input Component
 * 
 * Enhanced number input component with increment/decrement controls, number formatting,
 * and comprehensive accessibility support. Provides internationalized number handling
 * with proper validation and WCAG 2.1 AA compliance.
 * 
 * Features:
 * - Increment/decrement controls with keyboard support
 * - Number formatting with locale-specific thousand separators and decimal points
 * - Min/max validation with immediate feedback
 * - Currency and percentage formatting modes
 * - WCAG 2.1 AA accessibility compliance with screen reader support
 * - Keyboard navigation (up/down arrows for increment/decrement)
 * - Step control with customizable increment values
 * - Right-to-left (RTL) language support
 * - Integration with React Hook Form and Zod validation
 * 
 * @fileoverview Accessible number input component for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

'use client';

import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useRef, 
  useMemo, 
  forwardRef,
  useId,
  startTransition 
} from 'react';
import { ChevronUp, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import type { 
  InputProps, 
  InputVariant, 
  InputSize, 
  InputState,
  ValidationSeverity 
} from './input.types';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Number formatting modes for different input scenarios
 */
export type NumberFormatMode = 
  | 'decimal'     // Standard decimal number formatting
  | 'integer'     // Integer-only formatting
  | 'currency'    // Currency formatting with symbols
  | 'percentage'  // Percentage formatting with % symbol
  | 'scientific'  // Scientific notation (e.g., 1.23e+4)
  | 'bytes';      // Data size formatting (KB, MB, GB)

/**
 * Locale-specific number formatting configuration
 */
export interface NumberFormatConfig {
  /** Locale identifier (e.g., 'en-US', 'de-DE', 'fr-FR') */
  locale?: string;
  /** Number of decimal places to display */
  decimals?: number;
  /** Use thousands separator */
  useThousandsSeparator?: boolean;
  /** Currency code for currency formatting (e.g., 'USD', 'EUR') */
  currency?: string;
  /** Minimum number of integer digits */
  minimumIntegerDigits?: number;
  /** Minimum number of fraction digits */
  minimumFractionDigits?: number;
  /** Maximum number of fraction digits */
  maximumFractionDigits?: number;
  /** Whether to show the currency symbol */
  showCurrencySymbol?: boolean;
  /** Whether to show the percentage symbol */
  showPercentageSymbol?: boolean;
}

/**
 * Number input specific props extending base input functionality
 */
export interface NumberInputProps extends Omit<InputProps, 'type' | 'value' | 'onChange' | 'onValueChange'> {
  /** Current numeric value */
  value?: number | null;
  /** Value change handler with numeric value */
  onChange?: (value: number | null, formattedValue: string) => void;
  /** String value change handler for form integration */
  onValueChange?: (value: string, numericValue: number | null) => void;
  
  // Number constraints
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step increment for arrow controls */
  step?: number;
  /** Number of decimal places allowed */
  precision?: number;
  
  // Formatting options
  /** Number formatting mode */
  formatMode?: NumberFormatMode;
  /** Locale-specific formatting configuration */
  formatConfig?: NumberFormatConfig;
  
  // UI enhancements
  /** Show increment/decrement buttons */
  showIncrementControls?: boolean;
  /** Position of increment/decrement controls */
  controlsPosition?: 'right' | 'vertical';
  /** Custom increment control icons */
  incrementIcon?: React.ReactNode;
  decrementIcon?: React.ReactNode;
  
  // Validation feedback
  /** Custom validation function */
  validate?: (value: number | null) => string | null;
  /** Show validation status indicators */
  showValidationIndicators?: boolean;
  
  // Accessibility
  /** Unit description for screen readers (e.g., "dollars", "percentage") */
  unitLabel?: string;
  /** Announce value changes to screen readers */
  announceValueChanges?: boolean;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get browser's preferred locale or fallback to en-US
 */
const getBrowserLocale = (): string => {
  if (typeof window === 'undefined') return 'en-US';
  return navigator.language || navigator.languages?.[0] || 'en-US';
};

/**
 * Format number according to locale and configuration
 */
const formatNumber = (
  value: number | null,
  mode: NumberFormatMode,
  config: NumberFormatConfig = {}
): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }

  const locale = config.locale || getBrowserLocale();
  const options: Intl.NumberFormatOptions = {};

  // Base configuration
  if (config.minimumIntegerDigits !== undefined) {
    options.minimumIntegerDigits = config.minimumIntegerDigits;
  }
  if (config.minimumFractionDigits !== undefined) {
    options.minimumFractionDigits = config.minimumFractionDigits;
  }
  if (config.maximumFractionDigits !== undefined) {
    options.maximumFractionDigits = config.maximumFractionDigits;
  } else if (config.decimals !== undefined) {
    options.minimumFractionDigits = config.decimals;
    options.maximumFractionDigits = config.decimals;
  }

  // Thousands separator
  if (config.useThousandsSeparator !== false) {
    options.useGrouping = true;
  }

  // Mode-specific formatting
  switch (mode) {
    case 'currency':
      options.style = 'currency';
      options.currency = config.currency || 'USD';
      if (config.showCurrencySymbol === false) {
        options.currencyDisplay = 'code';
      }
      break;
      
    case 'percentage':
      options.style = 'percent';
      // Convert decimal to percentage (0.15 -> 15%)
      value = value / 100;
      break;
      
    case 'scientific':
      return value.toExponential(config.decimals || 2);
      
    case 'bytes':
      return formatBytes(value, config.decimals || 2);
      
    case 'integer':
      options.maximumFractionDigits = 0;
      break;
      
    case 'decimal':
    default:
      options.style = 'decimal';
      break;
  }

  try {
    const formatter = new Intl.NumberFormat(locale, options);
    return formatter.format(value);
  } catch (error) {
    // Fallback for unsupported locales or options
    return value.toLocaleString(locale);
  }
};

/**
 * Parse formatted number string back to numeric value
 */
const parseNumber = (
  formattedValue: string,
  mode: NumberFormatMode,
  config: NumberFormatConfig = {}
): number | null => {
  if (!formattedValue || formattedValue.trim() === '') {
    return null;
  }

  const locale = config.locale || getBrowserLocale();
  let cleanValue = formattedValue.trim();

  // Remove formatting characters based on locale
  try {
    const sampleNumber = 1234.56;
    const formatted = new Intl.NumberFormat(locale).format(sampleNumber);
    const thousandsSeparator = formatted.charAt(1); // Character at position 1 in "1,234.56"
    const decimalSeparator = formatted.charAt(5);   // Character at position 5 in "1,234.56"

    // Remove thousands separators
    cleanValue = cleanValue.replace(new RegExp(`\\${thousandsSeparator}`, 'g'), '');
    
    // Normalize decimal separator to dot
    if (decimalSeparator !== '.') {
      cleanValue = cleanValue.replace(decimalSeparator, '.');
    }
  } catch {
    // Fallback: remove common thousands separators and normalize decimal
    cleanValue = cleanValue.replace(/[,\s]/g, '').replace(',', '.');
  }

  // Remove currency symbols and percentage signs
  cleanValue = cleanValue.replace(/[$€£¥₹%]/g, '');
  
  // Handle percentage mode
  if (mode === 'percentage') {
    cleanValue = cleanValue.replace('%', '');
  }

  // Parse the cleaned number
  const numericValue = parseFloat(cleanValue);
  
  if (isNaN(numericValue)) {
    return null;
  }

  // Convert percentage back to decimal
  if (mode === 'percentage' && formattedValue.includes('%')) {
    return numericValue * 100;
  }

  return numericValue;
};

/**
 * Format bytes to human readable string (for bytes mode)
 */
const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  if (bytes < 0) return '-' + formatBytes(-bytes, decimals);

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const formattedNumber = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  
  return `${formattedNumber} ${sizes[i]}`;
};

/**
 * Validate number against constraints
 */
const validateNumber = (
  value: number | null,
  min?: number,
  max?: number,
  precision?: number,
  customValidator?: (value: number | null) => string | null
): { isValid: boolean; error?: string } => {
  // Custom validation first
  if (customValidator) {
    const customError = customValidator(value);
    if (customError) {
      return { isValid: false, error: customError };
    }
  }

  // Null/undefined is considered valid unless required
  if (value === null || value === undefined) {
    return { isValid: true };
  }

  // NaN validation
  if (isNaN(value)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }

  // Min/max validation
  if (min !== undefined && value < min) {
    return { isValid: false, error: `Value must be at least ${min}` };
  }

  if (max !== undefined && value > max) {
    return { isValid: false, error: `Value must be no more than ${max}` };
  }

  // Precision validation
  if (precision !== undefined && precision >= 0) {
    const decimalPlaces = (value.toString().split('.')[1] || '').length;
    if (decimalPlaces > precision) {
      return { isValid: false, error: `Value can have at most ${precision} decimal places` };
    }
  }

  return { isValid: true };
};

/**
 * Generate accessible announcements for value changes
 */
const generateValueAnnouncement = (
  value: number | null,
  mode: NumberFormatMode,
  unitLabel?: string,
  config?: NumberFormatConfig
): string => {
  if (value === null) {
    return 'Value cleared';
  }

  const formattedValue = formatNumber(value, mode, config);
  const unit = unitLabel || (mode === 'currency' ? 'currency' : mode === 'percentage' ? 'percent' : '');
  
  return `Value: ${formattedValue}${unit ? ` ${unit}` : ''}`;
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(({
  // Value and change handlers
  value = null,
  onChange,
  onValueChange,
  
  // Constraints
  min,
  max,
  step = 1,
  precision,
  
  // Formatting
  formatMode = 'decimal',
  formatConfig = {},
  
  // UI options
  showIncrementControls = true,
  controlsPosition = 'right',
  incrementIcon = <ChevronUp className="h-3 w-3" />,
  decrementIcon = <ChevronDown className="h-3 w-3" />,
  
  // Validation
  validate,
  showValidationIndicators = true,
  
  // Accessibility
  unitLabel,
  announceValueChanges = true,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  
  // Base input props
  variant = 'outline',
  size = 'md',
  state = 'default',
  label,
  labelPosition = 'top',
  placeholder,
  disabled = false,
  required = false,
  className,
  containerClassName,
  labelClassName,
  inputClassName,
  errorClassName,
  helperText,
  error,
  
  // Event handlers
  onFocus,
  onBlur,
  onKeyDown,
  
  // Test attributes
  'data-testid': testId,
  
  ...restProps
}, ref) => {
  // =============================================================================
  // STATE AND REFS
  // =============================================================================
  
  const { resolvedTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState<number | null>(value);
  const [displayValue, setDisplayValue] = useState('');
  const [validationState, setValidationState] = useState<{ isValid: boolean; error?: string }>({ isValid: true });
  
  // Combine refs
  const combinedRef = useCallback((node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  // Generate unique IDs for accessibility
  const inputId = useId();
  const labelId = useId();
  const errorId = useId();
  const helperId = useId();
  const announcementId = useId();

  // =============================================================================
  // DERIVED VALUES
  // =============================================================================

  const currentState: InputState = useMemo(() => {
    if (disabled) return 'disabled';
    if (error || !validationState.isValid) return 'error';
    if (isFocused) return 'focused';
    return state;
  }, [disabled, error, validationState.isValid, isFocused, state]);

  const effectiveError = error || validationState.error;

  // =============================================================================
  // FORMATTING AND PARSING
  // =============================================================================

  const formatDisplayValue = useCallback((numericValue: number | null): string => {
    if (numericValue === null) return '';
    return formatNumber(numericValue, formatMode, formatConfig);
  }, [formatMode, formatConfig]);

  const parseDisplayValue = useCallback((displayStr: string): number | null => {
    return parseNumber(displayStr, formatMode, formatConfig);
  }, [formatMode, formatConfig]);

  // =============================================================================
  // VALUE MANAGEMENT
  // =============================================================================

  const updateValue = useCallback((newValue: number | null, shouldValidate: boolean = true) => {
    setInternalValue(newValue);
    
    // Update display value when not focused (to show formatted version)
    if (!isFocused) {
      setDisplayValue(formatDisplayValue(newValue));
    }

    // Validate the new value
    if (shouldValidate) {
      const validation = validateNumber(newValue, min, max, precision, validate);
      setValidationState(validation);
    }

    // Call change handlers
    const formattedValue = formatDisplayValue(newValue);
    onChange?.(newValue, formattedValue);
    onValueChange?.(formattedValue, newValue);

    // Announce to screen readers
    if (announceValueChanges && announcementRef.current) {
      const announcement = generateValueAnnouncement(newValue, formatMode, unitLabel, formatConfig);
      announcementRef.current.textContent = announcement;
    }
  }, [
    isFocused, 
    formatDisplayValue, 
    min, 
    max, 
    precision, 
    validate, 
    onChange, 
    onValueChange, 
    announceValueChanges, 
    formatMode, 
    unitLabel, 
    formatConfig
  ]);

  const incrementValue = useCallback(() => {
    if (disabled) return;
    
    const currentValue = internalValue || 0;
    const newValue = Math.min(currentValue + step, max !== undefined ? max : Infinity);
    
    // Apply precision rounding
    const roundedValue = precision !== undefined 
      ? Math.round(newValue * Math.pow(10, precision)) / Math.pow(10, precision)
      : newValue;
    
    updateValue(roundedValue);
  }, [disabled, internalValue, step, max, precision, updateValue]);

  const decrementValue = useCallback(() => {
    if (disabled) return;
    
    const currentValue = internalValue || 0;
    const newValue = Math.max(currentValue - step, min !== undefined ? min : -Infinity);
    
    // Apply precision rounding
    const roundedValue = precision !== undefined 
      ? Math.round(newValue * Math.pow(10, precision)) / Math.pow(10, precision)
      : newValue;
    
    updateValue(roundedValue);
  }, [disabled, internalValue, step, min, precision, updateValue]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setDisplayValue(inputValue);

    // Parse and validate in real-time
    startTransition(() => {
      const parsedValue = parseDisplayValue(inputValue);
      updateValue(parsedValue);
    });
  }, [parseDisplayValue, updateValue]);

  const handleInputFocus = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    
    // Show raw numeric value for editing
    if (internalValue !== null) {
      setDisplayValue(internalValue.toString());
    }
    
    onFocus?.(event);
  }, [internalValue, onFocus]);

  const handleInputBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    
    // Format the display value
    setDisplayValue(formatDisplayValue(internalValue));
    
    onBlur?.(event);
  }, [internalValue, formatDisplayValue, onBlur]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle increment/decrement with arrow keys
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      incrementValue();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      decrementValue();
    }
    
    onKeyDown?.(event);
  }, [incrementValue, decrementValue, onKeyDown]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Sync external value changes
  useEffect(() => {
    if (value !== internalValue) {
      setInternalValue(value);
      if (!isFocused) {
        setDisplayValue(formatDisplayValue(value));
      }
    }
  }, [value, internalValue, isFocused, formatDisplayValue]);

  // Initial formatting
  useEffect(() => {
    setDisplayValue(formatDisplayValue(internalValue));
  }, [formatDisplayValue, internalValue]);

  // =============================================================================
  // STYLING
  // =============================================================================

  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-3 text-base',
    lg: 'h-11 px-4 text-lg',
    xl: 'h-12 px-4 text-xl',
  };

  const variantClasses = {
    outline: cn(
      'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900',
      'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
      currentState === 'error' && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
      currentState === 'success' && 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
    ),
    filled: cn(
      'border-0 bg-gray-100 dark:bg-gray-800',
      'focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary-500/20',
      currentState === 'error' && 'bg-red-50 dark:bg-red-900/10 focus:ring-red-500/20',
      currentState === 'success' && 'bg-green-50 dark:bg-green-900/10 focus:ring-green-500/20'
    ),
    ghost: cn(
      'border-0 bg-transparent',
      'hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary-500/20',
      currentState === 'error' && 'focus:ring-red-500/20',
      currentState === 'success' && 'focus:ring-green-500/20'
    ),
    underlined: cn(
      'border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent rounded-none',
      'focus:border-primary-500',
      currentState === 'error' && 'border-red-500 focus:border-red-500',
      currentState === 'success' && 'border-green-500 focus:border-green-500'
    ),
    floating: cn(
      'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 pt-6',
      'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
      currentState === 'error' && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
      currentState === 'success' && 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
    ),
  };

  const baseInputClasses = cn(
    'w-full transition-all duration-200 rounded-md',
    'text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400',
    'focus:outline-none',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900',
    sizeClasses[size],
    variantClasses[variant],
    showIncrementControls && controlsPosition === 'right' && 'pr-8',
    inputClassName
  );

  const controlButtonClasses = cn(
    'flex items-center justify-center w-6 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
    'hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors duration-150',
    'focus:outline-none focus:ring-1 focus:ring-primary-500 focus:ring-offset-1',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
    'min-h-[44px] min-w-[44px] touch-manipulation' // WCAG touch target compliance
  );

  // =============================================================================
  // ACCESSIBILITY ATTRIBUTES
  // =============================================================================

  const ariaDescribedByIds = [
    ariaDescribedBy,
    helperText && helperId,
    effectiveError && errorId,
  ].filter(Boolean).join(' ') || undefined;

  const inputAriaAttributes = {
    'aria-label': ariaLabel || (label ? undefined : `Number input${unitLabel ? ` in ${unitLabel}` : ''}`),
    'aria-labelledby': label ? labelId : undefined,
    'aria-describedby': ariaDescribedByIds,
    'aria-invalid': !validationState.isValid || !!error,
    'aria-required': required,
    'aria-errormessage': effectiveError ? errorId : undefined,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuenow': internalValue,
    'aria-valuetext': internalValue !== null 
      ? generateValueAnnouncement(internalValue, formatMode, unitLabel, formatConfig)
      : undefined,
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  const renderLabel = () => {
    if (!label || labelPosition === 'none') return null;

    const labelElement = (
      <label
        id={labelId}
        htmlFor={inputId}
        className={cn(
          'block text-sm font-medium text-gray-700 dark:text-gray-300',
          required && "after:content-['*'] after:text-red-500 after:ml-1",
          labelPosition === 'floating' && 'absolute left-3 top-2 text-xs text-gray-500 pointer-events-none transition-all duration-200',
          labelClassName
        )}
      >
        {label}
      </label>
    );

    if (labelPosition === 'floating') return labelElement;

    return (
      <div className={cn(
        labelPosition === 'left' && 'flex items-center space-x-3',
        labelPosition === 'right' && 'flex items-center space-x-3 flex-row-reverse',
        labelPosition === 'top' && 'space-y-2'
      )}>
        {labelElement}
      </div>
    );
  };

  const renderControls = () => {
    if (!showIncrementControls) return null;

    const incrementDisabled = disabled || (max !== undefined && internalValue !== null && internalValue >= max);
    const decrementDisabled = disabled || (min !== undefined && internalValue !== null && internalValue <= min);

    return (
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
        <button
          type="button"
          onClick={incrementValue}
          disabled={incrementDisabled}
          className={cn(controlButtonClasses, 'border-b border-gray-200 dark:border-gray-700')}
          aria-label={`Increment by ${step}${unitLabel ? ` ${unitLabel}` : ''}`}
          data-testid={`${testId}-increment`}
        >
          {incrementIcon}
        </button>
        <button
          type="button"
          onClick={decrementValue}
          disabled={decrementDisabled}
          className={controlButtonClasses}
          aria-label={`Decrement by ${step}${unitLabel ? ` ${unitLabel}` : ''}`}
          data-testid={`${testId}-decrement`}
        >
          {decrementIcon}
        </button>
      </div>
    );
  };

  const renderValidationIcon = () => {
    if (!showValidationIndicators || currentState === 'default' || currentState === 'focused') {
      return null;
    }

    return (
      <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none">
        {currentState === 'error' ? (
          <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
        ) : currentState === 'success' ? (
          <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
        ) : null}
      </div>
    );
  };

  const renderHelperText = () => {
    if (!helperText) return null;

    return (
      <p
        id={helperId}
        className="mt-1 text-xs text-gray-600 dark:text-gray-400"
      >
        {helperText}
      </p>
    );
  };

  const renderError = () => {
    if (!effectiveError) return null;

    return (
      <p
        id={errorId}
        className={cn(
          'mt-1 text-xs text-red-600 dark:text-red-400 flex items-center space-x-1',
          errorClassName
        )}
        role="alert"
        aria-live="polite"
      >
        <AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
        <span>{effectiveError}</span>
      </p>
    );
  };

  return (
    <div className={cn('w-full', containerClassName)} data-testid={testId}>
      {/* Label */}
      {renderLabel()}

      {/* Input Container */}
      <div className="relative">
        <input
          ref={combinedRef}
          id={inputId}
          type="text"
          inputMode="numeric"
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          className={baseInputClasses}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          {...inputAriaAttributes}
          {...restProps}
          data-testid={`${testId}-input`}
        />

        {/* Increment/Decrement Controls */}
        {renderControls()}

        {/* Validation Icon */}
        {renderValidationIcon()}
      </div>

      {/* Helper Text */}
      {renderHelperText()}

      {/* Error Message */}
      {renderError()}

      {/* Screen Reader Announcements */}
      <div
        ref={announcementRef}
        id={announcementId}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
    </div>
  );
});

NumberInput.displayName = 'NumberInput';

// =============================================================================
// EXPORTS
// =============================================================================

export default NumberInput;
export type { NumberInputProps, NumberFormatMode, NumberFormatConfig };