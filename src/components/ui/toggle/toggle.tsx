/**
 * Toggle Component - WCAG 2.1 AA Compliant Switch Control
 * 
 * A comprehensive toggle/switch component built with Headless UI Switch primitive
 * that replaces Angular Material mat-slide-toggle with enhanced accessibility,
 * proper keyboard navigation, and responsive design support.
 * 
 * Features:
 * - WCAG 2.1 AA compliance with proper contrast ratios (4.5:1 for text, 3:1 for UI)
 * - Minimum 44x44px touch targets for mobile accessibility
 * - Focus-visible keyboard navigation with 2px outline system
 * - Screen reader support with proper ARIA labeling
 * - React Hook Form integration for validation and state management
 * - Size variants (sm, md, lg) with responsive touch targets
 * - Label positioning (left, right, top, bottom, none)
 * - Loading and disabled states with visual feedback
 * - Custom colors and styling through Tailwind CSS
 * 
 * @fileoverview Accessible toggle switch component using Headless UI
 * @version 1.0.0
 */

'use client';

import React, { useId, useMemo, forwardRef } from 'react';
import { Switch } from '@headlessui/react';
import { cn } from '@/lib/utils';
import {
  toggleVariants,
  toggleThumbVariants,
  toggleLabelVariants,
  toggleContainerVariants,
  createToggleClasses,
  type ToggleVariantProps,
  type ToggleLabelVariantProps,
  type ToggleContainerVariantProps,
} from './toggle-variants';
import type { ToggleProps } from '@/types/ui';

/**
 * Enhanced Toggle Props extending base UI props with specific toggle features
 */
export interface EnhancedToggleProps extends ToggleProps {
  /** Additional variant props from toggle-variants */
  variantProps?: Partial<ToggleVariantProps & ToggleLabelVariantProps & ToggleContainerVariantProps>;
}

/**
 * Toggle Component Implementation
 * 
 * Implements a fully accessible toggle switch using Headless UI Switch primitive
 * with comprehensive WCAG 2.1 AA compliance and React Hook Form integration.
 */
export const Toggle = forwardRef<HTMLButtonElement, EnhancedToggleProps>(
  (
    {
      // Value and change handling
      value,
      defaultValue = false,
      onChange,
      controlled,
      
      // Labeling and accessibility
      label,
      labelPosition = 'right',
      labelVariant = 'default',
      showLabel = true,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-labelledby': ariaLabelledBy,
      announceOnChange,
      
      // Styling and theming
      variant = 'primary',
      size = 'md',
      state = 'default',
      className,
      thumbClassName,
      labelClassName,
      containerClassName,
      
      // Layout props
      layout = 'horizontal',
      alignment = 'start',
      spacing = 'normal',
      
      // Form integration
      name,
      required,
      disabled,
      loading,
      error,
      helperText,
      register,
      rules,
      
      // Event handlers
      onFocus,
      onBlur,
      onClick,
      onKeyDown,
      
      // Icons for checked/unchecked states
      checkedIcon,
      uncheckedIcon,
      
      // Animation props
      disableTransitions = false,
      
      // Additional props
      variantProps,
      'data-testid': testId,
      ...rest
    },
    ref
  ) => {
    // Generate unique IDs for accessibility
    const toggleId = useId();
    const labelId = useId();
    const descriptionId = useId();
    const errorId = useId();

    // Determine if component is controlled or uncontrolled
    const isControlled = controlled ?? (value !== undefined);
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const currentValue = isControlled ? (value ?? false) : internalValue;

    // Determine effective state based on props
    const effectiveState = useMemo(() => {
      if (loading) return 'loading';
      if (disabled) return 'disabled';
      if (error) return 'error';
      return state;
    }, [loading, disabled, error, state]);

    // Generate consistent class names using variant utilities
    const classes = useMemo(() => {
      return createToggleClasses({
        size,
        variant,
        state: effectiveState,
        labelPosition: showLabel ? labelPosition : 'none',
        labelVariant,
        labelState: effectiveState,
        layout,
        alignment,
        spacing,
        toggleClassName: className,
        thumbClassName,
        labelClassName,
        containerClassName,
        ...variantProps,
      });
    }, [
      size,
      variant,
      effectiveState,
      labelPosition,
      labelVariant,
      layout,
      alignment,
      spacing,
      className,
      thumbClassName,
      labelClassName,
      containerClassName,
      showLabel,
      variantProps,
    ]);

    // Handle value changes with proper event propagation
    const handleChange = React.useCallback(
      (newValue: boolean) => {
        // Update internal state for uncontrolled usage
        if (!isControlled) {
          setInternalValue(newValue);
        }

        // Call external onChange handler
        onChange?.(newValue);

        // Announce state change to screen readers
        if (announceOnChange) {
          const announcement = document.createElement('div');
          announcement.setAttribute('aria-live', 'polite');
          announcement.setAttribute('aria-atomic', 'true');
          announcement.className = 'sr-only';
          announcement.textContent = announceOnChange.replace(
            '{state}',
            newValue ? 'checked' : 'unchecked'
          );
          document.body.appendChild(announcement);
          setTimeout(() => document.body.removeChild(announcement), 1000);
        }
      },
      [isControlled, onChange, announceOnChange]
    );

    // Enhanced click handler with accessibility announcements
    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        
        // Prevent click during loading state
        if (loading) {
          event.preventDefault();
          return;
        }
      },
      [onClick, loading]
    );

    // Enhanced keyboard handler for better accessibility
    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(event);
        
        // Prevent keyboard interaction during loading
        if (loading && (event.key === ' ' || event.key === 'Enter')) {
          event.preventDefault();
          return;
        }
      },
      [onKeyDown, loading]
    );

    // Accessibility attributes
    const accessibilityProps = {
      id: toggleId,
      name,
      required,
      disabled: effectiveState === 'disabled' || loading,
      'aria-label': ariaLabel || (showLabel ? undefined : label),
      'aria-labelledby': ariaLabelledBy || (showLabel && label ? labelId : undefined),
      'aria-describedby': cn(
        ariaDescribedBy,
        helperText ? descriptionId : undefined,
        error ? errorId : undefined
      ).trim() || undefined,
      'aria-invalid': error ? 'true' : undefined,
      'aria-required': required ? 'true' : undefined,
      'data-testid': testId,
      'data-state': currentValue ? 'checked' : 'unchecked',
      'data-loading': loading ? 'true' : undefined,
      'data-error': error ? 'true' : undefined,
    };

    // React Hook Form integration
    const registerProps = register
      ? register(name || 'toggle', {
          required: required ? 'This field is required' : false,
          ...rules,
        })
      : {};

    // Label element
    const labelElement = label && showLabel && labelPosition !== 'none' ? (
      <span
        id={labelId}
        className={classes.label}
        onClick={loading ? undefined : () => handleChange(!currentValue)}
      >
        {label}
        {required && (
          <span className="text-error-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </span>
    ) : null;

    // Helper text element
    const helperElement = helperText ? (
      <div
        id={descriptionId}
        className={cn(
          'text-sm mt-1',
          effectiveState === 'error'
            ? 'text-error-600 dark:text-error-400'
            : 'text-secondary-600 dark:text-secondary-400'
        )}
      >
        {helperText}
      </div>
    ) : null;

    // Error message element
    const errorElement = error ? (
      <div
        id={errorId}
        role="alert"
        className="text-sm text-error-600 dark:text-error-400 mt-1"
      >
        {error}
      </div>
    ) : null;

    // Main toggle switch component
    const toggleSwitch = (
      <Switch
        ref={ref}
        checked={currentValue}
        onChange={handleChange}
        className={cn(
          classes.toggle,
          // Enhanced transitions
          !disableTransitions && 'transition-all duration-200',
          // Loading cursor override
          loading && 'cursor-wait'
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        {...accessibilityProps}
        {...registerProps}
        {...rest}
      >
        {/* Toggle thumb with icons */}
        <span
          className={cn(
            classes.thumb,
            !disableTransitions && 'transition-all duration-200'
          )}
          aria-hidden="true"
        >
          {/* Loading indicator */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={cn(
                  'animate-spin rounded-full border-2 border-current border-t-transparent',
                  size === 'sm' && 'h-3 w-3',
                  size === 'md' && 'h-4 w-4',
                  size === 'lg' && 'h-5 w-5'
                )}
                role="status"
                aria-label="Loading"
              />
            </div>
          )}
          
          {/* State icons */}
          {!loading && (currentValue ? checkedIcon : uncheckedIcon) && (
            <div className="flex items-center justify-center h-full w-full">
              {currentValue ? checkedIcon : uncheckedIcon}
            </div>
          )}
        </span>
      </Switch>
    );

    // Render component based on layout configuration
    return (
      <div>
        {/* Main toggle container with label */}
        <div className={classes.container}>
          {/* Top label */}
          {labelPosition === 'top' && labelElement}
          
          {/* Left label */}
          {labelPosition === 'left' && labelElement}
          
          {/* Toggle switch */}
          {toggleSwitch}
          
          {/* Right label */}
          {labelPosition === 'right' && labelElement}
          
          {/* Bottom label */}
          {labelPosition === 'bottom' && labelElement}
        </div>
        
        {/* Helper text and error messages */}
        {helperElement}
        {errorElement}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

/**
 * ToggleField Component
 * 
 * A wrapper around Toggle that provides additional form field functionality
 * including validation, error display, and enhanced React Hook Form integration.
 */
export interface ToggleFieldProps extends EnhancedToggleProps {
  /** Field label (different from toggle label) */
  fieldLabel?: string;
  /** Field description */
  description?: string;
  /** Show validation status visually */
  showValidation?: boolean;
}

export const ToggleField = forwardRef<HTMLButtonElement, ToggleFieldProps>(
  (
    {
      fieldLabel,
      description,
      showValidation = true,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn('space-y-2', className)}>
        {/* Field label (separate from toggle label) */}
        {fieldLabel && (
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
            {fieldLabel}
            {props.required && (
              <span className="text-error-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        
        {/* Description */}
        {description && (
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            {description}
          </p>
        )}
        
        {/* Toggle component */}
        <Toggle ref={ref} {...props} />
      </div>
    );
  }
);

ToggleField.displayName = 'ToggleField';

/**
 * ToggleGroup Component
 * 
 * A container for multiple related toggles with group labeling and
 * coordinated keyboard navigation for enhanced accessibility.
 */
export interface ToggleGroupProps {
  /** Group label */
  label?: string;
  /** Group description */
  description?: string;
  /** Child toggle components */
  children: React.ReactNode;
  /** Group orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Group spacing */
  spacing?: 'compact' | 'normal' | 'relaxed';
  /** Custom className */
  className?: string;
  /** Required group indicator */
  required?: boolean;
}

export const ToggleGroup: React.FC<ToggleGroupProps> = ({
  label,
  description,
  children,
  orientation = 'vertical',
  spacing = 'normal',
  className,
  required,
}) => {
  const groupId = useId();
  const descriptionId = useId();

  const spacingClasses = {
    compact: orientation === 'horizontal' ? 'gap-4' : 'gap-2',
    normal: orientation === 'horizontal' ? 'gap-6' : 'gap-3',
    relaxed: orientation === 'horizontal' ? 'gap-8' : 'gap-4',
  };

  return (
    <fieldset
      className={cn('space-y-3', className)}
      aria-labelledby={label ? groupId : undefined}
      aria-describedby={description ? descriptionId : undefined}
    >
      {/* Group label */}
      {label && (
        <legend
          id={groupId}
          className="text-sm font-medium text-secondary-700 dark:text-secondary-300"
        >
          {label}
          {required && (
            <span className="text-error-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </legend>
      )}
      
      {/* Group description */}
      {description && (
        <p
          id={descriptionId}
          className="text-sm text-secondary-600 dark:text-secondary-400"
        >
          {description}
        </p>
      )}
      
      {/* Toggle items container */}
      <div
        className={cn(
          'flex',
          orientation === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col',
          spacingClasses[spacing]
        )}
        role="group"
      >
        {children}
      </div>
    </fieldset>
  );
};

ToggleGroup.displayName = 'ToggleGroup';

// Export all toggle-related components and types
export {
  type ToggleProps,
  type ToggleFieldProps,
  type ToggleGroupProps,
  type EnhancedToggleProps,
} from './toggle';

// Re-export variant utilities for external usage
export {
  toggleVariants,
  toggleThumbVariants,
  toggleLabelVariants,
  toggleContainerVariants,
  createToggleClasses,
  type ToggleVariantProps,
  type ToggleLabelVariantProps,
  type ToggleContainerVariantProps,
} from './toggle-variants';

// Export default
export default Toggle;