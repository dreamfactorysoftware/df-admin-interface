'use client';

import * as React from 'react';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// Types for the number input component
export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  /** Current value of the input */
  value?: number | string;
  /** Callback when value changes */
  onChange?: (value: number | undefined) => void;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step increment for controls */
  step?: number;
  /** Number of decimal places to display */
  precision?: number;
  /** Format mode for display */
  formatMode?: 'number' | 'currency' | 'percentage';
  /** Currency code for currency mode (ISO 4217) */
  currency?: string;
  /** Locale for number formatting */
  locale?: string;
  /** Whether to show increment/decrement controls */
  showControls?: boolean;
  /** Whether to allow negative values */
  allowNegative?: boolean;
  /** Whether to show thousands separator */
  showThousandsSeparator?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Visual variant */
  variant?: 'outline' | 'filled' | 'ghost';
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Helper text */
  helperText?: string;
  /** Label for accessibility */
  label?: string;
  /** Loading state */
  loading?: boolean;
  /** Prefix element (e.g., icon) */
  prefix?: React.ReactNode;
  /** Suffix element (e.g., unit) */
  suffix?: React.ReactNode;
}

// Number formatting utility functions
const formatNumber = (
  value: number,
  options: {
    formatMode: 'number' | 'currency' | 'percentage';
    precision?: number;
    currency?: string;
    locale?: string;
    showThousandsSeparator?: boolean;
  }
): string => {
  const { formatMode, precision, currency, locale = 'en-US', showThousandsSeparator = true } = options;

  const formatOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    useGrouping: showThousandsSeparator,
  };

  switch (formatMode) {
    case 'currency':
      return new Intl.NumberFormat(locale, {
        ...formatOptions,
        style: 'currency',
        currency: currency || 'USD',
      }).format(value);
    
    case 'percentage':
      return new Intl.NumberFormat(locale, {
        ...formatOptions,
        style: 'percent',
      }).format(value / 100);
    
    default:
      return new Intl.NumberFormat(locale, formatOptions).format(value);
  }
};

const parseNumber = (
  value: string,
  options: {
    formatMode: 'number' | 'currency' | 'percentage';
    locale?: string;
  }
): number | undefined => {
  if (!value || value.trim() === '') return undefined;
  
  const { formatMode, locale = 'en-US' } = options;
  
  // Remove formatting characters based on locale
  let cleanValue = value;
  
  // Get locale-specific decimal and group separators
  const formatter = new Intl.NumberFormat(locale);
  const parts = formatter.formatToParts(1234.5);
  const decimalSeparator = parts.find(part => part.type === 'decimal')?.value || '.';
  const groupSeparator = parts.find(part => part.type === 'group')?.value || ',';
  
  // Remove currency symbols and percentage signs
  cleanValue = cleanValue.replace(/[$%€£¥₹₽]/g, '');
  
  // Remove group separators
  cleanValue = cleanValue.replace(new RegExp(`\\${groupSeparator}`, 'g'), '');
  
  // Replace decimal separator with standard dot
  if (decimalSeparator !== '.') {
    cleanValue = cleanValue.replace(decimalSeparator, '.');
  }
  
  // Remove any remaining non-numeric characters except decimal point and minus sign
  cleanValue = cleanValue.replace(/[^\d.-]/g, '');
  
  const parsed = parseFloat(cleanValue);
  
  if (isNaN(parsed)) return undefined;
  
  // Convert percentage back to decimal
  if (formatMode === 'percentage') {
    return parsed * 100;
  }
  
  return parsed;
};

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onChange,
      min,
      max,
      step = 1,
      precision,
      formatMode = 'number',
      currency = 'USD',
      locale = 'en-US',
      showControls = true,
      allowNegative = true,
      showThousandsSeparator = true,
      size = 'md',
      variant = 'outline',
      error = false,
      errorMessage,
      helperText,
      label,
      loading = false,
      prefix,
      suffix,
      className,
      onFocus,
      onBlur,
      onKeyDown,
      disabled,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState<string>('');
    const [isFocused, setIsFocused] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    // Convert numeric value to display string
    const formatDisplayValue = useCallback(
      (numValue: number | string | undefined): string => {
        if (numValue === undefined || numValue === '') return '';
        
        const num = typeof numValue === 'string' ? parseFloat(numValue) : numValue;
        if (isNaN(num)) return '';
        
        if (isFocused || isComposing) {
          // Show raw number when focused for easier editing
          return num.toString();
        }
        
        return formatNumber(num, {
          formatMode,
          precision,
          currency,
          locale,
          showThousandsSeparator,
        });
      },
      [formatMode, precision, currency, locale, showThousandsSeparator, isFocused, isComposing]
    );

    // Update display value when value prop changes
    useEffect(() => {
      setDisplayValue(formatDisplayValue(value));
    }, [value, formatDisplayValue]);

    // Validate number within constraints
    const validateNumber = useCallback(
      (num: number): number => {
        let validated = num;
        
        if (!allowNegative && validated < 0) {
          validated = 0;
        }
        
        if (min !== undefined && validated < min) {
          validated = min;
        }
        
        if (max !== undefined && validated > max) {
          validated = max;
        }
        
        if (precision !== undefined) {
          validated = parseFloat(validated.toFixed(precision));
        }
        
        return validated;
      },
      [min, max, precision, allowNegative]
    );

    // Handle increment/decrement
    const adjustValue = useCallback(
      (direction: 'up' | 'down') => {
        if (disabled || loading) return;
        
        const currentValue = typeof value === 'string' ? parseFloat(value) || 0 : value || 0;
        const adjustment = direction === 'up' ? step : -step;
        const newValue = validateNumber(currentValue + adjustment);
        
        onChange?.(newValue);
        
        // Announce to screen readers
        const announcement = `Value ${direction === 'up' ? 'increased' : 'decreased'} to ${formatDisplayValue(newValue)}`;
        const ariaLiveRegion = document.createElement('div');
        ariaLiveRegion.setAttribute('aria-live', 'polite');
        ariaLiveRegion.setAttribute('aria-atomic', 'true');
        ariaLiveRegion.style.position = 'absolute';
        ariaLiveRegion.style.left = '-10000px';
        ariaLiveRegion.textContent = announcement;
        document.body.appendChild(ariaLiveRegion);
        setTimeout(() => document.body.removeChild(ariaLiveRegion), 1000);
      },
      [value, step, validateNumber, onChange, disabled, loading, formatDisplayValue]
    );

    // Handle input change
    const handleInputChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;
        setDisplayValue(inputValue);
        
        if (inputValue === '') {
          onChange?.(undefined);
          return;
        }
        
        const parsed = parseNumber(inputValue, { formatMode, locale });
        if (parsed !== undefined) {
          const validated = validateNumber(parsed);
          onChange?.(validated);
        }
      },
      [formatMode, locale, validateNumber, onChange]
    );

    // Handle focus
    const handleFocus = useCallback(
      (event: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        // Show raw number for easier editing
        if (value !== undefined) {
          const rawValue = typeof value === 'string' ? value : value.toString();
          setDisplayValue(rawValue);
        }
        onFocus?.(event);
      },
      [value, onFocus]
    );

    // Handle blur
    const handleBlur = useCallback(
      (event: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        setDisplayValue(formatDisplayValue(value));
        onBlur?.(event);
      },
      [value, formatDisplayValue, onBlur]
    );

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (isComposing) return;
        
        switch (event.key) {
          case 'ArrowUp':
            event.preventDefault();
            adjustValue('up');
            break;
          case 'ArrowDown':
            event.preventDefault();
            adjustValue('down');
            break;
          case 'PageUp':
            event.preventDefault();
            adjustValue('up');
            break;
          case 'PageDown':
            event.preventDefault();
            adjustValue('down');
            break;
          case 'Home':
            if (min !== undefined) {
              event.preventDefault();
              onChange?.(min);
            }
            break;
          case 'End':
            if (max !== undefined) {
              event.preventDefault();
              onChange?.(max);
            }
            break;
        }
        
        onKeyDown?.(event);
      },
      [adjustValue, min, max, onChange, onKeyDown, isComposing]
    );

    // Handle composition events for IME support
    const handleCompositionStart = useCallback(() => {
      setIsComposing(true);
    }, []);

    const handleCompositionEnd = useCallback(() => {
      setIsComposing(false);
    }, []);

    // Style variants
    const sizeClasses = {
      sm: 'h-8 px-2 text-sm',
      md: 'h-10 px-3 text-sm',
      lg: 'h-12 px-4 text-base',
    };

    const variantClasses = {
      outline: cn(
        'border border-gray-300 bg-white text-gray-900',
        'hover:border-gray-400',
        'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
        'disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500',
        error && 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
      ),
      filled: cn(
        'border-0 bg-gray-100 text-gray-900',
        'hover:bg-gray-200',
        'focus:bg-white focus:ring-2 focus:ring-primary-500/20',
        'disabled:bg-gray-50 disabled:text-gray-500',
        error && 'bg-error-50 focus:ring-error-500/20'
      ),
      ghost: cn(
        'border-0 bg-transparent text-gray-900',
        'hover:bg-gray-100',
        'focus:bg-white focus:ring-2 focus:ring-primary-500/20',
        'disabled:text-gray-500',
        error && 'focus:ring-error-500/20'
      ),
    };

    const controlButtonClasses = cn(
      'flex items-center justify-center',
      'w-6 h-6 rounded',
      'border border-gray-300 bg-white',
      'hover:bg-gray-50 hover:border-gray-400',
      'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
      'disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400',
      'transition-colors',
      size === 'sm' && 'w-5 h-5',
      size === 'lg' && 'w-7 h-7'
    );

    // Generate IDs for accessibility
    const inputId = React.useId();
    const errorId = error && errorMessage ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const describedBy = [ariaDescribedBy, errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          <div
            className={cn(
              'flex items-center w-full rounded-md transition-colors',
              sizeClasses[size],
              variantClasses[variant],
              loading && 'opacity-60',
              className
            )}
          >
            {prefix && (
              <div className="flex items-center pr-2 text-gray-500">
                {prefix}
              </div>
            )}
            
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              inputMode="numeric"
              value={displayValue}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              disabled={disabled || loading}
              aria-label={ariaLabel || label}
              aria-describedby={describedBy}
              aria-invalid={error}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={typeof value === 'number' ? value : undefined}
              role="spinbutton"
              className={cn(
                'flex-1 bg-transparent border-0 outline-none',
                'placeholder:text-gray-500',
                'disabled:cursor-not-allowed'
              )}
              {...props}
            />
            
            {suffix && (
              <div className="flex items-center pl-2 text-gray-500">
                {suffix}
              </div>
            )}
            
            {showControls && (
              <div className="flex flex-col ml-1 gap-0.5">
                <button
                  type="button"
                  onClick={() => adjustValue('up')}
                  disabled={disabled || loading || (max !== undefined && typeof value === 'number' && value >= max)}
                  aria-label="Increase value"
                  className={controlButtonClasses}
                >
                  <ChevronUpIcon className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => adjustValue('down')}
                  disabled={disabled || loading || (min !== undefined && typeof value === 'number' && value <= min)}
                  aria-label="Decrease value"
                  className={controlButtonClasses}
                >
                  <ChevronDownIcon className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {(errorMessage || helperText) && (
          <div className="mt-1 text-sm">
            {error && errorMessage && (
              <div id={errorId} className="text-error-600" role="alert">
                {errorMessage}
              </div>
            )}
            {!error && helperText && (
              <div id={helperId} className="text-gray-600">
                {helperText}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';

export { NumberInput };
export default NumberInput;