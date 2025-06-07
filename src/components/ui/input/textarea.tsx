/**
 * Textarea component with auto-resize functionality, character counting, and WCAG 2.1 AA accessibility compliance
 * Provides enhanced UX for multi-line text input with consistent styling and validation integration
 * 
 * @file src/components/ui/input/textarea.tsx
 * @since 1.0.0
 */

'use client';

import React, { forwardRef, useId, useState, useCallback, useRef, useEffect, useImperativeHandle } from 'react';
import { useController, FieldValues, FieldPath } from 'react-hook-form';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import {
  TextareaProps,
  ControlledTextareaProps,
  TextareaRef,
  TextareaChangeEvent,
  TextareaFocusEvent,
  TextareaKeyboardEvent
} from './input.types';

/**
 * Textarea variant styles using class-variance-authority
 * Implements WCAG 2.1 AA compliant design tokens from Section 7.7.1
 */
const textareaVariants = cva(
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
    // Textarea specific styles
    'block resize-none overflow-hidden',
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
          'px-3 py-1.5 text-sm',
          'min-h-[72px]', // 2 lines minimum for textarea
        ],
        md: [
          'px-3 py-2 text-sm',
          'min-h-[88px]', // 2.5 lines minimum for textarea
        ],
        lg: [
          'px-4 py-3 text-base',
          'min-h-[96px]', // 2.5 lines minimum for textarea
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
      resize: {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'md',
      state: 'default',
      resize: 'none',
    },
  }
);

/**
 * Character count display styles
 */
const characterCountVariants = cva(
  'text-xs transition-colors duration-200 text-right',
  {
    variants: {
      state: {
        default: 'text-gray-500 dark:text-gray-400',
        warning: 'text-warning-600 dark:text-warning-400',
        error: 'text-error-600 dark:text-error-400',
      },
    },
    defaultVariants: {
      state: 'default',
    },
  }
);

/**
 * Auto-resize hook for textarea elements
 * Maintains smooth performance with large text content
 */
function useAutoResize(
  textareaRef: React.RefObject<HTMLTextAreaElement>,
  value: string,
  minRows: number = 2,
  maxRows: number = 10,
  autoResize: boolean = true
) {
  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || !autoResize) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate line height
    const style = window.getComputedStyle(textarea);
    const lineHeight = parseInt(style.lineHeight) || parseInt(style.fontSize) * 1.2;
    
    // Calculate min and max heights
    const minHeight = lineHeight * minRows;
    const maxHeight = lineHeight * maxRows;
    
    // Set new height based on scroll height, constrained by min/max
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
    
    // Handle overflow for max height
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [autoResize, minRows, maxRows]);

  // Resize when value changes
  useEffect(() => {
    resizeTextarea();
  }, [value, resizeTextarea]);

  // Resize on mount and window resize
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Initial resize
    resizeTextarea();

    // Handle window resize
    const handleResize = () => {
      resizeTextarea();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resizeTextarea]);

  return resizeTextarea;
}

/**
 * Character count hook with visual and screen reader announcements
 */
function useCharacterCount(
  value: string = '',
  maxLength?: number,
  showCharacterCount: boolean = false
) {
  const currentLength = value.length;
  const hasMaxLength = maxLength !== undefined;
  
  // Calculate warning and error thresholds
  const warningThreshold = hasMaxLength ? Math.floor(maxLength * 0.8) : Infinity;
  const errorThreshold = hasMaxLength ? maxLength : Infinity;
  
  // Determine state
  const state = currentLength >= errorThreshold 
    ? 'error' 
    : currentLength >= warningThreshold 
    ? 'warning' 
    : 'default';

  // Generate accessible announcement text
  const announcementText = hasMaxLength 
    ? `${currentLength} of ${maxLength} characters used`
    : `${currentLength} characters entered`;

  return {
    currentLength,
    maxLength,
    hasMaxLength,
    state,
    announcementText,
    isNearLimit: state === 'warning',
    isOverLimit: state === 'error',
    showCount: showCharacterCount || hasMaxLength,
  };
}

/**
 * Textarea component with auto-resize, character counting, and accessibility
 */
export const Textarea = forwardRef<TextareaRef, TextareaProps>(
  (
    {
      variant = 'outline',
      size = 'md',
      state = 'default',
      resize = 'none',
      autoResize = true,
      minRows = 2,
      maxRows = 10,
      showCharacterCount = false,
      error,
      helpText,
      className,
      containerClassName,
      required = false,
      disabled = false,
      readOnly = false,
      maxLength,
      rows: providedRows,
      id: providedId,
      value: controlledValue,
      defaultValue,
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [focused, setFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    
    // Use controlled value if provided, otherwise use internal state
    const value = controlledValue !== undefined ? controlledValue : internalValue;
    
    const { resolvedTheme } = useTheme();

    // Expose textarea element through ref
    useImperativeHandle(ref, () => textareaRef.current!, []);

    // Auto-resize functionality
    const resizeTextarea = useAutoResize(textareaRef, value, minRows, maxRows, autoResize);

    // Character count functionality
    const characterCount = useCharacterCount(value, maxLength, showCharacterCount);

    // Generate IDs for associated elements
    const errorId = error ? `${id}-error` : undefined;
    const helpId = helpText ? `${id}-help` : undefined;
    const countId = characterCount.showCount ? `${id}-count` : undefined;
    const describedByIds = [ariaDescribedBy, errorId, helpId, countId].filter(Boolean).join(' ') || undefined;

    // Determine textarea state based on error, character count, and other states
    const textareaState = error 
      ? 'error' 
      : characterCount.isOverLimit 
      ? 'error' 
      : characterCount.isNearLimit 
      ? 'warning' 
      : state;

    // Calculate rows for non-auto-resize mode
    const calculatedRows = autoResize ? minRows : (providedRows || minRows);

    // Handle focus events with proper state management
    const handleFocus = useCallback((event: TextareaFocusEvent) => {
      setFocused(true);
      onFocus?.(event);
    }, [onFocus]);

    const handleBlur = useCallback((event: TextareaFocusEvent) => {
      setFocused(false);
      onBlur?.(event);
    }, [onBlur]);

    // Handle change events with auto-resize
    const handleChange = useCallback((event: TextareaChangeEvent) => {
      const newValue = event.target.value;
      
      // Update internal value if uncontrolled
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      
      // Call external onChange handler
      onChange?.(event);
      
      // Trigger resize on next frame to ensure DOM is updated
      requestAnimationFrame(() => {
        resizeTextarea();
      });
    }, [controlledValue, onChange, resizeTextarea]);

    // Handle keyboard events for accessibility
    const handleKeyDown = useCallback((event: TextareaKeyboardEvent) => {
      // Handle Ctrl+A for select all
      if (event.ctrlKey && event.key === 'a') {
        event.currentTarget.select();
        event.preventDefault();
        return;
      }

      // Handle Tab key for indentation if desired
      if (event.key === 'Tab' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
        // Allow default tab behavior for navigation
        // Custom tab handling can be added here if needed
      }

      onKeyDown?.(event);
    }, [onKeyDown]);

    return (
      <div className={cn('w-full', containerClassName)}>
        <div className="relative">
          {/* Main textarea element */}
          <textarea
            ref={textareaRef}
            id={id}
            className={cn(
              textareaVariants({
                variant,
                size,
                state: textareaState,
                resize: autoResize ? 'none' : resize,
              }),
              className
            )}
            rows={calculatedRows}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            maxLength={maxLength}
            value={value}
            aria-label={ariaLabel}
            aria-describedby={describedByIds}
            aria-invalid={ariaInvalid || Boolean(error) || characterCount.isOverLimit}
            aria-errormessage={ariaErrorMessage || errorId}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            {...props}
          />

          {/* Resize handle indicator for manual resize mode */}
          {!autoResize && resize !== 'none' && (
            <div 
              className="absolute bottom-1 right-1 w-3 h-3 opacity-20 pointer-events-none"
              aria-hidden="true"
            >
              <svg 
                className="w-full h-full text-gray-400" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M22 22H2v-2h20v2zm0-4H6v-2h16v2zm0-4H10v-2h12v2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Character count display */}
        {characterCount.showCount && (
          <div
            id={countId}
            className={cn(
              'mt-1 flex justify-end',
              characterCountVariants({ state: characterCount.state })
            )}
            aria-live="polite"
            aria-atomic="true"
          >
            <span role="status" aria-label={characterCount.announcementText}>
              {characterCount.hasMaxLength 
                ? `${characterCount.currentLength} / ${characterCount.maxLength}`
                : characterCount.currentLength
              }
              <span className="sr-only"> characters</span>
            </span>
          </div>
        )}

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

        {/* Character limit exceeded message */}
        {characterCount.isOverLimit && !error && (
          <div
            className="mt-1 text-sm text-error-600 dark:text-error-400"
            role="alert"
            aria-live="polite"
          >
            Character limit exceeded by {characterCount.currentLength - characterCount.maxLength!} characters
          </div>
        )}

        {/* Help text */}
        {helpText && !error && !characterCount.isOverLimit && (
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

Textarea.displayName = 'Textarea';

/**
 * Controlled Textarea component with React Hook Form integration
 * Automatically handles field registration, validation, and error display
 */
export function ControlledTextarea<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  defaultValue,
  rules,
  shouldUnregister,
  ...textareaProps
}: ControlledTextareaProps<TFieldValues, TName>) {
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
    <Textarea
      {...textareaProps}
      {...field}
      error={error?.message}
      disabled={textareaProps.disabled || isSubmitting}
      aria-invalid={Boolean(error)}
      state={error ? 'error' : textareaProps.state}
    />
  );
}

// Export types for external use
export type { TextareaRef, TextareaChangeEvent, TextareaFocusEvent, TextareaKeyboardEvent };
export type { TextareaProps, ControlledTextareaProps } from './input.types';