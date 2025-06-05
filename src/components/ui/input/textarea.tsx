'use client';

import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Textarea component props interface
 * Extends standard HTML textarea attributes with enhanced functionality
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Visual variant of the textarea */
  variant?: 'outline' | 'filled' | 'ghost';
  /** Size variant affecting height and padding */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the textarea should auto-resize based on content */
  autoResize?: boolean;
  /** Maximum height for auto-resize in pixels */
  maxHeight?: number;
  /** Minimum height for auto-resize in pixels */
  minHeight?: number;
  /** Maximum character count */
  maxLength?: number;
  /** Whether to show character count */
  showCharacterCount?: boolean;
  /** Error state for validation feedback */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Success state for validation feedback */
  success?: boolean;
  /** Label for the textarea */
  label?: string;
  /** Helper text to display below the textarea */
  helperText?: string;
  /** Whether the label is required (shows asterisk) */
  required?: boolean;
  /** Custom class name for the container */
  containerClassName?: string;
  /** Ref for the container element */
  containerRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Textarea component for multi-line text input with auto-resize functionality,
 * character counting, and consistent styling. Provides enhanced UX for longer
 * text content with proper accessibility and validation integration.
 *
 * Features:
 * - Auto-resize functionality that grows with content up to maximum height
 * - Character count display with visual indicators for approaching limits
 * - WCAG 2.1 AA accessibility compliance with proper labeling and keyboard navigation
 * - React Hook Form integration for validation and form state management
 * - Size variants (sm, md, lg) for various use cases
 * - Consistent styling with other input components using Tailwind CSS design tokens
 * - Proper focus management and disabled state handling
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      containerClassName,
      containerRef,
      variant = 'outline',
      size = 'md',
      autoResize = true,
      maxHeight = 400,
      minHeight,
      maxLength,
      showCharacterCount = false,
      error = false,
      errorMessage,
      success = false,
      label,
      helperText,
      required = false,
      value,
      defaultValue,
      onChange,
      onInput,
      disabled = false,
      readOnly = false,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      'aria-required': ariaRequired,
      id,
      ...props
    },
    ref
  ) => {
    // Internal state for character count and auto-resize
    const [characterCount, setCharacterCount] = useState(0);
    const [currentHeight, setCurrentHeight] = useState<number | undefined>(undefined);
    
    // Refs for internal functionality
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const hiddenTextareaRef = useRef<HTMLTextAreaElement | null>(null);
    
    // Generate unique IDs for accessibility
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const labelId = `${textareaId}-label`;
    const helperTextId = `${textareaId}-helper`;
    const errorId = `${textareaId}-error`;
    const charCountId = `${textareaId}-char-count`;
    
    // Combine refs
    const combinedRef = useCallback(
      (element: HTMLTextAreaElement | null) => {
        textareaRef.current = element;
        if (typeof ref === 'function') {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      },
      [ref]
    );

    /**
     * Calculate the height needed for the textarea content
     */
    const calculateHeight = useCallback((content: string): number => {
      if (!hiddenTextareaRef.current || !autoResize) return currentHeight || 0;
      
      const hiddenTextarea = hiddenTextareaRef.current;
      hiddenTextarea.value = content;
      
      // Reset height to auto to get the correct scrollHeight
      hiddenTextarea.style.height = 'auto';
      const scrollHeight = hiddenTextarea.scrollHeight;
      
      // Apply min/max height constraints
      const minHeightValue = minHeight || 0;
      const maxHeightValue = maxHeight || Infinity;
      
      return Math.min(Math.max(scrollHeight, minHeightValue), maxHeightValue);
    }, [autoResize, minHeight, maxHeight, currentHeight]);

    /**
     * Handle textarea content changes and auto-resize
     */
    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = event.target.value;
        
        // Update character count
        setCharacterCount(newValue.length);
        
        // Handle auto-resize
        if (autoResize) {
          const newHeight = calculateHeight(newValue);
          setCurrentHeight(newHeight);
        }
        
        // Call parent onChange handler
        onChange?.(event);
      },
      [onChange, autoResize, calculateHeight]
    );

    /**
     * Handle input events for real-time updates
     */
    const handleInput = useCallback(
      (event: React.FormEvent<HTMLTextAreaElement>) => {
        const target = event.target as HTMLTextAreaElement;
        const newValue = target.value;
        
        // Update character count
        setCharacterCount(newValue.length);
        
        // Handle auto-resize
        if (autoResize) {
          const newHeight = calculateHeight(newValue);
          setCurrentHeight(newHeight);
        }
        
        // Call parent onInput handler
        onInput?.(event);
      },
      [onInput, autoResize, calculateHeight]
    );

    // Initialize character count and height on mount and value changes
    useEffect(() => {
      const currentValue = value || defaultValue || '';
      const currentValueString = typeof currentValue === 'string' ? currentValue : String(currentValue);
      
      setCharacterCount(currentValueString.length);
      
      if (autoResize) {
        const initialHeight = calculateHeight(currentValueString);
        setCurrentHeight(initialHeight);
      }
    }, [value, defaultValue, autoResize, calculateHeight]);

    // Base styles for the textarea
    const baseStyles = cn(
      // Base textarea styling
      'w-full rounded-md transition-all duration-200',
      'placeholder:text-gray-400 dark:placeholder:text-gray-500',
      'resize-none', // Disable manual resize when auto-resize is enabled
      
      // Typography
      'text-sm leading-relaxed',
      'font-normal',
      
      // Focus styles - WCAG 2.1 AA compliant
      'focus:outline-none',
      'focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
      'focus-visible:border-primary-600',
      
      // Disabled state
      'disabled:cursor-not-allowed disabled:opacity-50',
      'disabled:bg-gray-50 dark:disabled:bg-gray-800/50',
      
      // Read-only state
      'read-only:bg-gray-50 dark:read-only:bg-gray-800/50',
      'read-only:cursor-default',
      
      // Accessibility - ensure minimum touch target
      size === 'sm' ? 'min-h-[44px]' : size === 'md' ? 'min-h-[48px]' : 'min-h-[52px]'
    );

    // Variant-specific styles
    const variantStyles = {
      outline: cn(
        'bg-white dark:bg-gray-900',
        'border border-gray-300 dark:border-gray-600',
        'hover:border-gray-400 dark:hover:border-gray-500',
        error && 'border-error-500 dark:border-error-400',
        success && 'border-success-500 dark:border-success-400',
        'focus:border-primary-600 dark:focus:border-primary-400'
      ),
      filled: cn(
        'bg-gray-50 dark:bg-gray-800',
        'border border-transparent',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        error && 'bg-error-50 dark:bg-error-900/20 border-error-500',
        success && 'bg-success-50 dark:bg-success-900/20 border-success-500',
        'focus:bg-white dark:focus:bg-gray-900',
        'focus:border-primary-600 dark:focus:border-primary-400'
      ),
      ghost: cn(
        'bg-transparent',
        'border border-transparent',
        'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        error && 'hover:bg-error-50 dark:hover:bg-error-900/20',
        success && 'hover:bg-success-50 dark:hover:bg-success-900/20',
        'focus:bg-white dark:focus:bg-gray-900',
        'focus:border-primary-600 dark:focus:border-primary-400'
      ),
    };

    // Size-specific styles
    const sizeStyles = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-3 py-2.5 text-sm',
      lg: 'px-4 py-3 text-base',
    };

    // Character count styling
    const isNearLimit = maxLength && characterCount >= maxLength * 0.8;
    const isOverLimit = maxLength && characterCount > maxLength;
    
    const characterCountStyles = cn(
      'text-xs mt-1 transition-colors duration-200',
      isOverLimit
        ? 'text-error-600 dark:text-error-400'
        : isNearLimit
        ? 'text-warning-600 dark:text-warning-400'
        : 'text-gray-500 dark:text-gray-400'
    );

    // Determine ARIA describedby
    const describedByIds = [
      helperText && helperTextId,
      errorMessage && errorId,
      showCharacterCount && charCountId,
      ariaDescribedBy,
    ].filter(Boolean).join(' ') || undefined;

    // Container styles
    const containerStyles = cn('w-full', containerClassName);

    // Label styles
    const labelStyles = cn(
      'block text-sm font-medium mb-1.5',
      'text-gray-700 dark:text-gray-300',
      error && 'text-error-600 dark:text-error-400',
      success && 'text-success-600 dark:text-success-400',
      disabled && 'text-gray-400 dark:text-gray-600'
    );

    // Helper text styles
    const helperTextStyles = cn(
      'text-xs mt-1 transition-colors duration-200',
      error ? 'text-error-600 dark:text-error-400' : 'text-gray-500 dark:text-gray-400'
    );

    return (
      <div className={containerStyles} ref={containerRef}>
        {/* Label */}
        {label && (
          <label htmlFor={textareaId} id={labelId} className={labelStyles}>
            {label}
            {required && (
              <span className="text-error-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Hidden textarea for height calculation */}
        {autoResize && (
          <textarea
            ref={hiddenTextareaRef}
            className={cn(baseStyles, variantStyles[variant], sizeStyles[size])}
            style={{
              position: 'absolute',
              top: -9999,
              left: -9999,
              visibility: 'hidden',
              height: 'auto',
              minHeight: 'auto',
              maxHeight: 'none',
              overflow: 'hidden',
            }}
            tabIndex={-1}
            aria-hidden="true"
            readOnly
          />
        )}

        {/* Main textarea */}
        <textarea
          ref={combinedRef}
          id={textareaId}
          className={cn(
            baseStyles,
            variantStyles[variant],
            sizeStyles[size],
            className
          )}
          style={{
            height: autoResize && currentHeight ? `${currentHeight}px` : undefined,
            resize: autoResize ? 'none' : 'vertical',
          }}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onInput={handleInput}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          aria-describedby={describedByIds}
          aria-invalid={ariaInvalid ?? (error ? 'true' : undefined)}
          aria-required={ariaRequired ?? (required ? 'true' : undefined)}
          aria-labelledby={label ? labelId : undefined}
          {...props}
        />

        {/* Footer with helper text and character count */}
        {(helperText || errorMessage || showCharacterCount) && (
          <div className="flex justify-between items-start mt-1 gap-2">
            <div className="flex-1">
              {/* Helper text or error message */}
              {(helperText || errorMessage) && (
                <p
                  id={errorMessage ? errorId : helperTextId}
                  className={helperTextStyles}
                  role={error ? 'alert' : undefined}
                  aria-live={error ? 'polite' : undefined}
                >
                  {errorMessage || helperText}
                </p>
              )}
            </div>

            {/* Character count */}
            {showCharacterCount && (
              <div
                id={charCountId}
                className={characterCountStyles}
                aria-live="polite"
                aria-label={`${characterCount}${maxLength ? ` of ${maxLength}` : ''} characters`}
              >
                {characterCount}
                {maxLength && (
                  <>
                    <span aria-hidden="true">/</span>
                    <span className="sr-only">of</span>
                    {maxLength}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;