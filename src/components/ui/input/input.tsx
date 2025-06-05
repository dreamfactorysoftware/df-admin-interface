/**
 * Base Input component with React Hook Form integration and WCAG 2.1 AA accessibility compliance
 * Provides foundation for all text-based inputs with consistent styling, validation, and theme support
 * 
 * @file src/components/ui/input/input.tsx
 * @since 1.0.0
 */

'use client';

import React, { forwardRef, useId, useState, useCallback } from 'react';
import { useController, FieldValues, FieldPath } from 'react-hook-form';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import {
  BaseInputProps,
  ControlledInputProps,
  InputContainerProps,
  InputAdornmentProps,
  InputRef,
  InputChangeEvent,
  InputFocusEvent,
  InputKeyboardEvent
} from './input.types';

/**
 * Input variant styles using class-variance-authority
 * Implements WCAG 2.1 AA compliant design tokens from Section 7.7.1
 */
const inputVariants = cva(
  [
    // Base styles with accessibility compliance
    'w-full rounded-md border transition-all duration-200',
    'text-sm font-normal leading-5',
    'placeholder:text-gray-400 dark:placeholder:text-gray-500',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'read-only:cursor-default read-only:bg-gray-50 dark:read-only:bg-gray-800',
    // Focus styles with WCAG 2.1 AA compliance (3:1 contrast ratio for UI components)
    'focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2',
    'focus:border-primary-600 dark:focus:ring-primary-500 dark:focus:border-primary-500',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
  ],
  {
    variants: {
      variant: {
        outline: [
          'bg-white dark:bg-gray-900',
          'border-gray-300 dark:border-gray-600',
          'text-gray-900 dark:text-gray-100',
          'hover:border-gray-400 dark:hover:border-gray-500',
        ],
        filled: [
          'bg-gray-50 dark:bg-gray-800',
          'border-gray-200 dark:border-gray-700',
          'text-gray-900 dark:text-gray-100',
          'hover:bg-gray-100 dark:hover:bg-gray-750',
          'hover:border-gray-300 dark:hover:border-gray-600',
        ],
        ghost: [
          'bg-transparent',
          'border-transparent',
          'text-gray-900 dark:text-gray-100',
          'hover:bg-gray-50 dark:hover:bg-gray-800',
          'hover:border-gray-200 dark:hover:border-gray-700',
        ],
      },
      size: {
        sm: [
          'h-9 px-3 py-1.5 text-sm',
          'min-h-[36px]', // Close to WCAG minimum while maintaining proportion
        ],
        md: [
          'h-11 px-3 py-2 text-sm',
          'min-h-[44px]', // WCAG 2.1 AA minimum touch target
        ],
        lg: [
          'h-12 px-4 py-3 text-base',
          'min-h-[48px]', // Enhanced touch target for better accessibility
        ],
      },
      state: {
        default: '',
        error: [
          'border-error-500 dark:border-error-400',
          'text-error-900 dark:text-error-100',
          'focus:ring-error-500 focus:border-error-500',
          'dark:focus:ring-error-400 dark:focus:border-error-400',
        ],
        success: [
          'border-success-500 dark:border-success-400',
          'text-success-900 dark:text-success-100',
          'focus:ring-success-500 focus:border-success-500',
          'dark:focus:ring-success-400 dark:focus:border-success-400',
        ],
        warning: [
          'border-warning-500 dark:border-warning-400',
          'text-warning-900 dark:text-warning-100',
          'focus:ring-warning-500 focus:border-warning-500',
          'dark:focus:ring-warning-400 dark:focus:border-warning-400',
        ],
      },
      hasPrefix: {
        true: 'pl-10',
        false: '',
      },
      hasSuffix: {
        true: 'pr-10',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'md',
      state: 'default',
      hasPrefix: false,
      hasSuffix: false,
    },
  }
);

/**
 * Container wrapper styles for proper prefix/suffix positioning
 */
const containerVariants = cva(
  'relative inline-flex w-full',
  {
    variants: {
      disabled: {
        true: 'opacity-50 cursor-not-allowed',
        false: '',
      },
    },
  }
);

/**
 * Prefix/suffix adornment styles
 */
const adornmentVariants = cva(
  [
    'absolute inset-y-0 flex items-center justify-center',
    'text-gray-400 dark:text-gray-500',
    'pointer-events-none',
  ],
  {
    variants: {
      position: {
        prefix: 'left-0 pl-3',
        suffix: 'right-0 pr-3',
      },
      size: {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
      },
      clickable: {
        true: 'pointer-events-auto cursor-pointer hover:text-gray-600 dark:hover:text-gray-300',
        false: '',
      },
    },
    defaultVariants: {
      position: 'prefix',
      size: 'md',
      clickable: false,
    },
  }
);

/**
 * Input container component for layout and prefix/suffix support
 */
const InputContainer = ({
  size = 'md',
  variant = 'outline',
  state = 'default',
  hasPrefix = false,
  hasSuffix = false,
  disabled = false,
  readonly = false,
  focused = false,
  className,
  children,
  onClick,
}: InputContainerProps) => {
  return (
    <div
      className={cn(
        containerVariants({ disabled }),
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

/**
 * Input adornment component for prefix/suffix elements
 */
const InputAdornment = ({
  children,
  position,
  size = 'md',
  clickable = false,
  onClick,
  className,
  'aria-label': ariaLabel,
}: InputAdornmentProps) => {
  const handleClick = useCallback(() => {
    if (clickable && onClick) {
      onClick();
    }
  }, [clickable, onClick]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (clickable && onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  }, [clickable, onClick]);

  return (
    <div
      className={cn(
        adornmentVariants({ position, size, clickable }),
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? ariaLabel : undefined}
    >
      {children}
    </div>
  );
};

/**
 * Base Input component with comprehensive accessibility and theme support
 */
export const Input = forwardRef<InputRef, BaseInputProps>(
  (
    {
      variant = 'outline',
      size = 'md',
      state = 'default',
      error,
      helpText,
      prefix,
      suffix,
      loading = false,
      className,
      containerClassName,
      required = false,
      disabled = false,
      readOnly = false,
      id: providedId,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      'aria-errormessage': ariaErrorMessage,
      onChange,
      onFocus,
      onBlur,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const [focused, setFocused] = useState(false);
    const { resolvedTheme } = useTheme();

    // Generate IDs for associated elements
    const errorId = error ? `${id}-error` : undefined;
    const helpId = helpText ? `${id}-help` : undefined;
    const describedByIds = [ariaDescribedBy, errorId, helpId].filter(Boolean).join(' ') || undefined;

    // Determine input state based on error and other states
    const inputState = error ? 'error' : state;
    const hasPrefix = Boolean(prefix);
    const hasSuffix = Boolean(suffix) || loading;

    // Handle focus events with proper state management
    const handleFocus = useCallback((event: InputFocusEvent) => {
      setFocused(true);
      onFocus?.(event);
    }, [onFocus]);

    const handleBlur = useCallback((event: InputFocusEvent) => {
      setFocused(false);
      onBlur?.(event);
    }, [onBlur]);

    // Handle change events
    const handleChange = useCallback((event: InputChangeEvent) => {
      onChange?.(event);
    }, [onChange]);

    // Handle keyboard events for accessibility
    const handleKeyDown = useCallback((event: InputKeyboardEvent) => {
      onKeyDown?.(event);
    }, [onKeyDown]);

    // Loading spinner component
    const LoadingSpinner = () => (
      <svg
        className="animate-spin h-4 w-4 text-gray-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    return (
      <div className="w-full">
        <InputContainer
          size={size}
          variant={variant}
          state={inputState}
          hasPrefix={hasPrefix}
          hasSuffix={hasSuffix}
          disabled={disabled}
          readonly={readOnly}
          focused={focused}
          className={containerClassName}
        >
          {/* Prefix element */}
          {prefix && (
            <InputAdornment position="prefix" size={size}>
              {prefix}
            </InputAdornment>
          )}

          {/* Main input element */}
          <input
            ref={ref}
            id={id}
            className={cn(
              inputVariants({
                variant,
                size,
                state: inputState,
                hasPrefix,
                hasSuffix,
              }),
              className
            )}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            aria-label={ariaLabel}
            aria-describedby={describedByIds}
            aria-invalid={ariaInvalid || Boolean(error)}
            aria-errormessage={ariaErrorMessage || errorId}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            {...props}
          />

          {/* Suffix element */}
          {(suffix || loading) && (
            <InputAdornment position="suffix" size={size}>
              {loading ? <LoadingSpinner /> : suffix}
            </InputAdornment>
          )}
        </InputContainer>

        {/* Error message with ARIA live region */}
        {error && (
          <div
            id={errorId}
            className="mt-1 text-sm text-error-600 dark:text-error-400"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {/* Help text */}
        {helpText && !error && (
          <div
            id={helpId}
            className="mt-1 text-sm text-gray-500 dark:text-gray-400"
          >
            {helpText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Controlled Input component with React Hook Form integration
 * Automatically handles field registration, validation, and error display
 */
export function ControlledInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  defaultValue,
  rules,
  shouldUnregister,
  ...inputProps
}: ControlledInputProps<TFieldValues, TName>) {
  const {
    field,
    fieldState: { error, isDirty, isTouched },
    formState: { isSubmitting }
  } = useController({
    name,
    control,
    defaultValue,
    rules,
    shouldUnregister,
  });

  return (
    <Input
      {...inputProps}
      {...field}
      error={error?.message}
      disabled={inputProps.disabled || isSubmitting}
      aria-invalid={Boolean(error)}
      state={error ? 'error' : inputProps.state}
    />
  );
}

// Export components and utilities
export { InputContainer, InputAdornment };
export type { InputRef, InputChangeEvent, InputFocusEvent, InputKeyboardEvent };
export type { BaseInputProps, ControlledInputProps } from './input.types';