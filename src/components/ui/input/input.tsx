/**
 * Input Component Implementation
 * 
 * Enterprise-grade input component with React Hook Form integration, WCAG 2.1 AA
 * accessibility compliance, and comprehensive Tailwind CSS styling. Provides seamless
 * form integration with validation, theming, and responsive design capabilities.
 * 
 * Features:
 * - React Hook Form integration with automatic field registration and validation
 * - WCAG 2.1 AA accessibility compliance with proper ARIA attributes and focus management
 * - Tailwind CSS 4.1+ styling with consistent design tokens and dark theme support
 * - Focus ring system with 3:1 contrast ratio for UI components
 * - Support for prefix and suffix elements with proper spacing and visual hierarchy
 * - Multiple variants (outline, filled, ghost) with consistent design language
 * - Comprehensive validation states and error handling
 * - Responsive design with mobile-first approach
 * 
 * @fileoverview Base input component for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

'use client';

import React, { 
  forwardRef, 
  useId, 
  useState, 
  useCallback, 
  useEffect,
  useMemo 
} from 'react';
import { useController, type FieldPath, type FieldValues } from 'react-hook-form';
import { Eye, EyeOff, X, AlertCircle, CheckCircle, Info } from 'lucide-react';

// Internal imports
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import type { 
  InputProps, 
  InputVariant, 
  InputSize, 
  InputState,
  ReactHookFormProps,
  InputRef 
} from './input.types';

// =============================================================================
// COMPONENT CONFIGURATION AND CONSTANTS
// =============================================================================

/**
 * Input variant styling configuration with WCAG 2.1 AA compliance
 */
const INPUT_VARIANTS: Record<InputVariant, {
  base: string;
  focus: string;
  error: string;
  success: string;
  warning: string;
  disabled: string;
}> = {
  outline: {
    base: cn(
      'border border-gray-300 bg-white text-gray-900',
      'dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100',
      'placeholder:text-gray-500 dark:placeholder:text-gray-400',
      'transition-colors duration-200'
    ),
    focus: cn(
      'border-primary-500 ring-2 ring-primary-500/20',
      'dark:border-primary-400 dark:ring-primary-400/20'
    ),
    error: cn(
      'border-error-500 ring-2 ring-error-500/20 text-error-900',
      'dark:border-error-400 dark:ring-error-400/20 dark:text-error-100'
    ),
    success: cn(
      'border-success-500 ring-2 ring-success-500/20 text-success-900',
      'dark:border-success-400 dark:ring-success-400/20 dark:text-success-100'
    ),
    warning: cn(
      'border-warning-500 ring-2 ring-warning-500/20 text-warning-900',
      'dark:border-warning-400 dark:ring-warning-400/20 dark:text-warning-100'
    ),
    disabled: cn(
      'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed',
      'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
    ),
  },
  filled: {
    base: cn(
      'border border-transparent bg-gray-100 text-gray-900',
      'dark:bg-gray-800 dark:text-gray-100',
      'placeholder:text-gray-500 dark:placeholder:text-gray-400',
      'transition-colors duration-200'
    ),
    focus: cn(
      'bg-white border-primary-500 ring-2 ring-primary-500/20',
      'dark:bg-gray-900 dark:border-primary-400 dark:ring-primary-400/20'
    ),
    error: cn(
      'bg-error-50 border-error-500 ring-2 ring-error-500/20 text-error-900',
      'dark:bg-error-900/20 dark:border-error-400 dark:ring-error-400/20 dark:text-error-100'
    ),
    success: cn(
      'bg-success-50 border-success-500 ring-2 ring-success-500/20 text-success-900',
      'dark:bg-success-900/20 dark:border-success-400 dark:ring-success-400/20 dark:text-success-100'
    ),
    warning: cn(
      'bg-warning-50 border-warning-500 ring-2 ring-warning-500/20 text-warning-900',
      'dark:bg-warning-900/20 dark:border-warning-400 dark:ring-warning-400/20 dark:text-warning-100'
    ),
    disabled: cn(
      'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed',
      'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500'
    ),
  },
  ghost: {
    base: cn(
      'border border-transparent bg-transparent text-gray-900',
      'dark:text-gray-100',
      'placeholder:text-gray-500 dark:placeholder:text-gray-400',
      'hover:bg-gray-50 dark:hover:bg-gray-900/50',
      'transition-colors duration-200'
    ),
    focus: cn(
      'bg-white border-primary-500 ring-2 ring-primary-500/20',
      'dark:bg-gray-900 dark:border-primary-400 dark:ring-primary-400/20'
    ),
    error: cn(
      'bg-error-50 border-error-500 ring-2 ring-error-500/20 text-error-900',
      'dark:bg-error-900/20 dark:border-error-400 dark:ring-error-400/20 dark:text-error-100'
    ),
    success: cn(
      'bg-success-50 border-success-500 ring-2 ring-success-500/20 text-success-900',
      'dark:bg-success-900/20 dark:border-success-400 dark:ring-success-400/20 dark:text-success-100'
    ),
    warning: cn(
      'bg-warning-50 border-warning-500 ring-2 ring-warning-500/20 text-warning-900',
      'dark:bg-warning-900/20 dark:border-warning-400 dark:ring-warning-400/20 dark:text-warning-100'
    ),
    disabled: cn(
      'bg-transparent border-gray-200 text-gray-400 cursor-not-allowed',
      'dark:border-gray-700 dark:text-gray-500'
    ),
  },
  underlined: {
    base: cn(
      'border-0 border-b-2 border-gray-300 bg-transparent text-gray-900 rounded-none',
      'dark:border-gray-600 dark:text-gray-100',
      'placeholder:text-gray-500 dark:placeholder:text-gray-400',
      'transition-colors duration-200'
    ),
    focus: cn(
      'border-primary-500 ring-0',
      'dark:border-primary-400'
    ),
    error: cn(
      'border-error-500 ring-0 text-error-900',
      'dark:border-error-400 dark:text-error-100'
    ),
    success: cn(
      'border-success-500 ring-0 text-success-900',
      'dark:border-success-400 dark:text-success-100'
    ),
    warning: cn(
      'border-warning-500 ring-0 text-warning-900',
      'dark:border-warning-400 dark:text-warning-100'
    ),
    disabled: cn(
      'border-gray-200 text-gray-400 cursor-not-allowed',
      'dark:border-gray-700 dark:text-gray-500'
    ),
  },
  floating: {
    base: cn(
      'border border-gray-300 bg-white text-gray-900 pt-6 pb-2',
      'dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100',
      'placeholder:text-transparent',
      'transition-colors duration-200'
    ),
    focus: cn(
      'border-primary-500 ring-2 ring-primary-500/20',
      'dark:border-primary-400 dark:ring-primary-400/20'
    ),
    error: cn(
      'border-error-500 ring-2 ring-error-500/20 text-error-900',
      'dark:border-error-400 dark:ring-error-400/20 dark:text-error-100'
    ),
    success: cn(
      'border-success-500 ring-2 ring-success-500/20 text-success-900',
      'dark:border-success-400 dark:ring-success-400/20 dark:text-success-100'
    ),
    warning: cn(
      'border-warning-500 ring-2 ring-warning-500/20 text-warning-900',
      'dark:border-warning-400 dark:ring-warning-400/20 dark:text-warning-100'
    ),
    disabled: cn(
      'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed',
      'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
    ),
  },
};

/**
 * Input size configuration with WCAG touch target compliance (minimum 44px)
 */
const INPUT_SIZES: Record<InputSize, {
  input: string;
  icon: string;
  text: string;
}> = {
  sm: {
    input: 'h-10 px-3 text-sm min-h-[44px]', // WCAG minimum touch target
    icon: 'h-4 w-4',
    text: 'text-sm',
  },
  md: {
    input: 'h-11 px-3 text-base min-h-[44px]',
    icon: 'h-5 w-5',
    text: 'text-base',
  },
  lg: {
    input: 'h-12 px-4 text-lg min-h-[48px]',
    icon: 'h-5 w-5',
    text: 'text-lg',
  },
  xl: {
    input: 'h-14 px-4 text-xl min-h-[56px]',
    icon: 'h-6 w-6',
    text: 'text-xl',
  },
};

/**
 * Message icons for different states
 */
const STATE_ICONS = {
  error: AlertCircle,
  success: CheckCircle,
  warning: AlertCircle,
  info: Info,
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Determine the current input state based on props and validation
 */
const getInputState = (
  error?: string,
  successMessage?: string,
  warningMessage?: string,
  disabled?: boolean,
  readOnly?: boolean,
  loading?: boolean
): InputState => {
  if (disabled) return 'disabled';
  if (readOnly) return 'readonly';
  if (loading) return 'loading';
  if (error) return 'error';
  if (successMessage) return 'success';
  if (warningMessage) return 'warning';
  return 'default';
};

/**
 * Get the appropriate variant styles based on state
 */
const getVariantStyles = (
  variant: InputVariant,
  state: InputState,
  isFocused: boolean
): string => {
  const variantConfig = INPUT_VARIANTS[variant];
  
  if (state === 'disabled') return variantConfig.disabled;
  if (state === 'error') return variantConfig.error;
  if (state === 'success') return variantConfig.success;
  if (state === 'warning') return variantConfig.warning;
  if (isFocused) return cn(variantConfig.base, variantConfig.focus);
  
  return variantConfig.base;
};

/**
 * Generate accessible description text
 */
const generateDescription = (
  helperText?: string,
  error?: string,
  successMessage?: string,
  warningMessage?: string,
  description?: string
): string | undefined => {
  const messages = [description, helperText, error, successMessage, warningMessage]
    .filter(Boolean);
  
  return messages.length > 0 ? messages.join(' ') : undefined;
};

// =============================================================================
// MAIN COMPONENT IMPLEMENTATION
// =============================================================================

/**
 * Base Input Component
 * 
 * Enterprise-grade input component with comprehensive accessibility,
 * validation, and theming support.
 */
export const Input = forwardRef<InputRef, InputProps>(function Input(
  {
    // Core input props
    variant = 'outline',
    size = 'md',
    type = 'text',
    label,
    labelPosition = 'top',
    helperText,
    error,
    successMessage,
    warningMessage,
    description,
    showLabel = true,
    
    // React Hook Form integration
    form,
    name,
    rules,
    transform,
    fieldError,
    
    // Visual enhancements
    prefix,
    suffix,
    clearable,
    showPasswordToggle,
    loading,
    showCharacterCount,
    
    // Accessibility props
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-labelledby': ariaLabelledBy,
    'aria-invalid': ariaInvalid,
    'aria-required': ariaRequired,
    'aria-errormessage': ariaErrorMessage,
    
    // Styling props
    className,
    containerClassName,
    labelClassName,
    inputClassName,
    helperClassName,
    errorClassName,
    successClassName,
    
    // Event handlers
    onValueChange,
    onFocusChange,
    onValidationChange,
    onClear,
    onPrefixClick,
    onSuffixClick,
    onEnterPress,
    onEscapePress,
    onFocus,
    onBlur,
    onChange,
    onKeyDown,
    
    // HTML input props
    value,
    defaultValue,
    placeholder,
    disabled,
    readOnly,
    required,
    maxLength,
    minLength,
    max,
    min,
    step,
    pattern,
    autoComplete,
    autoFocus,
    tabIndex,
    id: providedId,
    
    // Data attributes
    'data-testid': testId,
    
    ...rest
  },
  ref
) {
  // =============================================================================
  // HOOKS AND STATE
  // =============================================================================
  
  const { resolvedTheme } = useTheme();
  const generatedId = useId();
  const id = providedId || generatedId;
  
  // Local state
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [internalValue, setInternalValue] = useState(value || defaultValue || '');
  
  // React Hook Form integration
  const {
    field: controllerField,
    fieldState: { error: controllerError, invalid, isDirty, isTouched },
  } = useController({
    name: name as FieldPath<FieldValues>,
    control: form?.control,
    rules: rules,
    defaultValue: defaultValue,
  }) as any;

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  
  // Determine controlled vs uncontrolled
  const isControlled = controllerField || value !== undefined;
  const currentValue = isControlled 
    ? (controllerField?.value ?? value ?? '') 
    : internalValue;
  
  // Error handling priority: prop error > field error > controller error
  const currentError = error || fieldError?.message || controllerError?.message;
  
  // Determine current state
  const currentState = getInputState(
    currentError,
    successMessage,
    warningMessage,
    disabled,
    readOnly,
    loading
  );
  
  // Generate IDs for accessibility
  const labelId = `${id}-label`;
  const helperTextId = `${id}-helper`;
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;
  
  // Password toggle support
  const isPasswordType = type === 'password';
  const inputType = isPasswordType && showPassword ? 'text' : type;
  
  // Character count
  const characterCount = currentValue ? String(currentValue).length : 0;
  const showCharCount = showCharacterCount && maxLength;
  
  // Clearable support
  const showClearButton = clearable && currentValue && !disabled && !readOnly;
  
  // Generate comprehensive ARIA attributes
  const ariaAttributes = useMemo(() => {
    const describedByIds = [
      ariaDescribedBy,
      description && descriptionId,
      helperText && helperTextId,
      currentError && errorId,
    ].filter(Boolean);
    
    return {
      'aria-label': ariaLabel || (!showLabel && label ? label : undefined),
      'aria-labelledby': ariaLabelledBy || (showLabel && label ? labelId : undefined),
      'aria-describedby': describedByIds.length > 0 ? describedByIds.join(' ') : undefined,
      'aria-invalid': ariaInvalid ?? (currentError ? true : false),
      'aria-required': ariaRequired ?? required,
      'aria-errormessage': ariaErrorMessage || (currentError ? errorId : undefined),
    };
  }, [
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    ariaInvalid,
    ariaRequired,
    ariaErrorMessage,
    showLabel,
    label,
    labelId,
    description,
    descriptionId,
    helperText,
    helperTextId,
    currentError,
    errorId,
    required,
  ]);
  
  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  /**
   * Handle input value changes with transformation and validation
   */
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    let transformedValue = newValue;
    
    // Apply input transformation
    if (transform?.input) {
      transformedValue = transform.input(newValue);
    }
    
    // Update value based on control mode
    if (isControlled && controllerField) {
      controllerField.onChange(transformedValue);
    } else {
      setInternalValue(transformedValue);
    }
    
    // Call custom handlers
    onValueChange?.(transformedValue, event);
    onChange?.(event);
  }, [isControlled, controllerField, transform, onValueChange, onChange]);
  
  /**
   * Handle focus events with accessibility announcements
   */
  const handleFocus = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    
    // Announce helper text or error to screen readers on focus
    if (currentError || helperText || description) {
      const announcement = currentError || helperText || description;
      // Screen reader announcement would be handled by aria-describedby
    }
    
    onFocusChange?.(true, event);
    onFocus?.(event);
    controllerField?.onBlur?.();
  }, [currentError, helperText, description, onFocusChange, onFocus, controllerField]);
  
  /**
   * Handle blur events
   */
  const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onFocusChange?.(false, event);
    onBlur?.(event);
    controllerField?.onBlur?.();
  }, [onFocusChange, onBlur, controllerField]);
  
  /**
   * Handle keyboard navigation and shortcuts
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'Enter':
        onEnterPress?.(currentValue);
        break;
      case 'Escape':
        onEscapePress?.();
        break;
    }
    
    onKeyDown?.(event);
  }, [currentValue, onEnterPress, onEscapePress, onKeyDown]);
  
  /**
   * Handle clear button click
   */
  const handleClear = useCallback(() => {
    if (isControlled && controllerField) {
      controllerField.onChange('');
    } else {
      setInternalValue('');
    }
    
    onClear?.();
    onValueChange?.('');
  }, [isControlled, controllerField, onClear, onValueChange]);
  
  /**
   * Handle password visibility toggle
   */
  const handlePasswordToggle = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);
  
  // =============================================================================
  // VALIDATION EFFECTS
  // =============================================================================
  
  /**
   * Notify of validation state changes
   */
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange({
        isValid: !currentError,
        error: currentError,
        success: successMessage,
        warning: warningMessage,
        isDirty: isDirty,
        isTouched: isTouched,
      });
    }
  }, [
    currentError,
    successMessage,
    warningMessage,
    isDirty,
    isTouched,
    onValidationChange,
  ]);
  
  // =============================================================================
  // STYLING COMPUTATION
  // =============================================================================
  
  const sizeConfig = INPUT_SIZES[size];
  const variantStyles = getVariantStyles(variant, currentState, isFocused);
  
  // Container classes
  const containerClasses = cn(
    'relative w-full',
    containerClassName
  );
  
  // Input wrapper classes for prefix/suffix layout
  const inputWrapperClasses = cn(
    'relative flex items-center',
    variant === 'floating' && 'relative'
  );
  
  // Input element classes
  const inputClasses = cn(
    // Base styles
    'w-full rounded-md font-medium transition-all duration-200',
    'focus:outline-none focus:ring-0', // Custom focus handling
    'disabled:cursor-not-allowed',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
    
    // Size styles
    sizeConfig.input,
    sizeConfig.text,
    
    // Variant and state styles
    variantStyles,
    
    // Prefix/suffix padding adjustments
    prefix && 'pl-10',
    suffix && 'pr-10',
    (showClearButton || (isPasswordType && showPasswordToggle)) && 'pr-10',
    (showClearButton && (isPasswordType && showPasswordToggle)) && 'pr-16',
    
    // Floating variant adjustments
    variant === 'floating' && 'peer',
    
    // Custom classes
    inputClassName,
    className
  );
  
  // Label classes
  const labelClasses = cn(
    'block font-medium transition-colors duration-200',
    sizeConfig.text,
    
    // Position-specific styles
    labelPosition === 'top' && 'mb-2',
    labelPosition === 'left' && 'mr-3',
    labelPosition === 'right' && 'ml-3',
    labelPosition === 'inside' && 'sr-only',
    
    // Floating label styles
    variant === 'floating' && cn(
      'absolute left-3 transition-all duration-200 pointer-events-none',
      'peer-focus:text-xs peer-focus:-translate-y-1.5 peer-focus:text-primary-600',
      'peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:-translate-y-1.5',
      'dark:peer-focus:text-primary-400',
      'text-gray-500 dark:text-gray-400',
      isFocused || currentValue ? 'text-xs -translate-y-1.5 text-primary-600 dark:text-primary-400' : 'text-base translate-y-0'
    ),
    
    // State colors
    currentError ? 'text-error-600 dark:text-error-400' : 'text-gray-700 dark:text-gray-300',
    required && "after:content-['*'] after:ml-0.5 after:text-error-500",
    
    // Custom classes
    labelClassName
  );
  
  // Helper text classes
  const helperClasses = cn(
    'mt-1.5 text-sm',
    currentState === 'error' ? 'text-error-600 dark:text-error-400' : 'text-gray-600 dark:text-gray-400',
    helperClassName
  );
  
  // Message classes for different states
  const messageClasses = cn(
    'mt-1.5 text-sm flex items-center gap-1.5',
    currentState === 'error' && 'text-error-600 dark:text-error-400',
    currentState === 'success' && 'text-success-600 dark:text-success-400',
    currentState === 'warning' && 'text-warning-600 dark:text-warning-400'
  );
  
  // =============================================================================
  // RENDER HELPERS
  // =============================================================================
  
  /**
   * Render prefix element
   */
  const renderPrefix = () => {
    if (!prefix) return null;
    
    return (
      <div 
        className={cn(
          'absolute left-3 flex items-center pointer-events-none',
          sizeConfig.icon,
          'text-gray-400 dark:text-gray-500'
        )}
        onClick={onPrefixClick}
        role={onPrefixClick ? 'button' : undefined}
        tabIndex={onPrefixClick ? 0 : undefined}
      >
        {prefix}
      </div>
    );
  };
  
  /**
   * Render suffix elements (clear, password toggle, custom suffix)
   */
  const renderSuffix = () => {
    const elements = [];
    
    // Clear button
    if (showClearButton) {
      elements.push(
        <button
          key="clear"
          type="button"
          onClick={handleClear}
          className={cn(
            'flex items-center justify-center transition-colors duration-200',
            'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded',
            sizeConfig.icon
          )}
          aria-label="Clear input"
          tabIndex={tabIndex}
        >
          <X className={sizeConfig.icon} />
        </button>
      );
    }
    
    // Password toggle
    if (isPasswordType && showPasswordToggle) {
      const PasswordIcon = showPassword ? EyeOff : Eye;
      elements.push(
        <button
          key="password-toggle"
          type="button"
          onClick={handlePasswordToggle}
          className={cn(
            'flex items-center justify-center transition-colors duration-200',
            'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded',
            sizeConfig.icon
          )}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={tabIndex}
        >
          <PasswordIcon className={sizeConfig.icon} />
        </button>
      );
    }
    
    // Custom suffix
    if (suffix) {
      elements.push(
        <div 
          key="suffix"
          className={cn(
            'flex items-center pointer-events-none',
            sizeConfig.icon,
            'text-gray-400 dark:text-gray-500'
          )}
          onClick={onSuffixClick}
          role={onSuffixClick ? 'button' : undefined}
          tabIndex={onSuffixClick ? 0 : undefined}
        >
          {suffix}
        </div>
      );
    }
    
    if (elements.length === 0) return null;
    
    return (
      <div className={cn(
        'absolute right-3 flex items-center gap-1',
        'pointer-events-auto'
      )}>
        {elements}
      </div>
    );
  };
  
  /**
   * Render state message with icon
   */
  const renderStateMessage = () => {
    const message = currentError || successMessage || warningMessage;
    if (!message) return null;
    
    const StateIcon = STATE_ICONS[currentState as keyof typeof STATE_ICONS];
    
    return (
      <div 
        id={currentError ? errorId : descriptionId}
        className={messageClasses}
        role={currentError ? 'alert' : 'status'}
        aria-live={currentError ? 'assertive' : 'polite'}
      >
        {StateIcon && <StateIcon className="h-4 w-4 flex-shrink-0" />}
        <span>{message}</span>
      </div>
    );
  };
  
  /**
   * Render character count
   */
  const renderCharacterCount = () => {
    if (!showCharCount) return null;
    
    const isNearLimit = maxLength && characterCount / maxLength > 0.8;
    const isOverLimit = maxLength && characterCount > maxLength;
    
    return (
      <div className={cn(
        'mt-1 text-xs text-right',
        isOverLimit ? 'text-error-600 dark:text-error-400' :
        isNearLimit ? 'text-warning-600 dark:text-warning-400' :
        'text-gray-500 dark:text-gray-400'
      )}>
        {characterCount}{maxLength && ` / ${maxLength}`}
      </div>
    );
  };
  
  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  
  return (
    <div className={containerClasses} data-testid={testId}>
      {/* Label */}
      {label && showLabel && variant !== 'floating' && (
        <label
          id={labelId}
          htmlFor={id}
          className={labelClasses}
        >
          {label}
        </label>
      )}
      
      {/* Input wrapper */}
      <div className={inputWrapperClasses}>
        {/* Prefix */}
        {renderPrefix()}
        
        {/* Input element */}
        <input
          {...rest}
          ref={ref}
          id={id}
          type={inputType}
          value={currentValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={inputClasses}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          placeholder={variant === 'floating' ? label : placeholder}
          maxLength={maxLength}
          minLength={minLength}
          max={max}
          min={min}
          step={step}
          pattern={pattern}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          tabIndex={tabIndex}
          {...ariaAttributes}
        />
        
        {/* Floating label */}
        {label && variant === 'floating' && (
          <label
            id={labelId}
            htmlFor={id}
            className={labelClasses}
          >
            {label}
          </label>
        )}
        
        {/* Suffix elements */}
        {renderSuffix()}
      </div>
      
      {/* Description */}
      {description && (
        <div 
          id={descriptionId}
          className="mt-1.5 text-sm text-gray-600 dark:text-gray-400"
        >
          {description}
        </div>
      )}
      
      {/* Helper text */}
      {helperText && !currentError && !successMessage && !warningMessage && (
        <div 
          id={helperTextId}
          className={helperClasses}
        >
          {helperText}
        </div>
      )}
      
      {/* State messages */}
      {renderStateMessage()}
      
      {/* Character count */}
      {renderCharacterCount()}
    </div>
  );
});

Input.displayName = 'Input';

// =============================================================================
// EXPORTS
// =============================================================================

export default Input;
export type { InputProps, InputRef };