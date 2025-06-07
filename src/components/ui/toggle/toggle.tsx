'use client';

import React, { forwardRef, useId } from 'react';
import { Switch } from '@headlessui/react';
import { Controller, useFormContext, FieldValues, Path } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { 
  toggleVariants,
  toggleSwitchVariants, 
  toggleThumbVariants,
  toggleLabelVariants,
  toggleLoadingVariants,
  getToggleClasses,
  type ToggleVariants,
  type ToggleSwitchVariants,
  type ToggleThumbVariants,
  type ToggleLabelVariants
} from './toggle-variants';
import type { 
  BaseComponent, 
  FormFieldComponent, 
  ComponentSize, 
  ComponentVariant 
} from '@/types/ui';

/**
 * WCAG 2.1 AA Compliant Toggle Component
 * 
 * A comprehensive switch control built on Headless UI Switch primitive that provides
 * full accessibility compliance, React Hook Form integration, and consistent styling
 * with the DreamFactory design system.
 * 
 * Features:
 * - WCAG 2.1 AA compliance with minimum 4.5:1 contrast ratios
 * - Minimum 44x44px touch targets for mobile accessibility
 * - Proper ARIA labeling and keyboard navigation
 * - React Hook Form integration with validation support
 * - Multiple size variants and label positioning options
 * - Loading and disabled states with appropriate visual feedback
 * - Smooth transitions and hover states
 * - Dark/light theme support with proper contrast maintenance
 * 
 * Replaces Angular Material mat-slide-toggle with modern React patterns.
 */

/**
 * Toggle label position options for flexible layout
 */
export type ToggleLabelPosition = 'left' | 'right' | 'top' | 'bottom' | 'none';

/**
 * Toggle switch styling variants  
 */
export type ToggleSwitchStyle = 'default' | 'rounded' | 'square';

/**
 * Core toggle component properties extending base accessibility requirements
 */
export interface ToggleProps extends Omit<BaseComponent, 'children'> {
  // Core toggle functionality
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  
  // React Hook Form integration
  name?: string;
  control?: any;
  rules?: any;
  
  // Labeling and content
  label?: string;
  description?: string;
  helpText?: string;
  
  // Visual styling variants
  size?: ComponentSize;
  variant?: ComponentVariant;
  labelPosition?: ToggleLabelPosition;
  switchStyle?: ToggleSwitchStyle;
  
  // State management
  loading?: boolean;
  disabled?: boolean;
  required?: boolean;
  
  // Enhanced accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
  'aria-required'?: boolean;
  
  // Custom styling
  className?: string;
  switchClassName?: string;
  thumbClassName?: string;
  labelClassName?: string;
  
  // Error state
  error?: string;
  invalid?: boolean;
  
  // Event handlers
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
}

/**
 * Form-integrated toggle component with React Hook Form support
 */
export interface FormToggleProps<T extends FieldValues = FieldValues> 
  extends Omit<ToggleProps, 'name' | 'control'> {
  name: Path<T>;
  control?: any;
  rules?: any;
}

/**
 * Loading indicator component for toggle states
 */
const ToggleLoadingSpinner: React.FC<{ size?: ComponentSize; className?: string }> = ({
  size = 'md',
  className
}) => {
  const spinnerClasses = toggleLoadingVariants({ size });
  
  return (
    <div 
      className={cn(spinnerClasses, className)}
      role="status"
      aria-label="Loading"
      aria-hidden="true"
    />
  );
};

/**
 * Toggle label component with proper accessibility integration
 */
const ToggleLabel: React.FC<{
  id?: string;
  label?: string;
  required?: boolean;
  size?: ComponentSize;
  variant?: ComponentVariant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}> = ({ 
  id, 
  label, 
  required, 
  size = 'md', 
  variant = 'primary',
  disabled,
  loading,
  className,
  onClick 
}) => {
  if (!label) return null;

  const labelClasses = toggleLabelVariants({
    size,
    variant,
    state: disabled ? 'disabled' : loading ? 'loading' : 'default'
  });

  return (
    <label
      htmlFor={id}
      className={cn(labelClasses, className)}
      onClick={onClick}
    >
      {label}
      {required && (
        <span 
          className="ml-1 text-error-500" 
          aria-label="Required field"
        >
          *
        </span>
      )}
    </label>
  );
};

/**
 * Error message component with proper ARIA integration
 */
const ToggleErrorMessage: React.FC<{
  id?: string;
  error?: string;
  size?: ComponentSize;
}> = ({ id, error, size = 'md' }) => {
  if (!error) return null;

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-xs', 
    md: 'text-sm',
    lg: 'text-sm',
    xl: 'text-base'
  };

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className={cn(
        'mt-1 text-error-500 dark:text-error-400',
        textSizes[size as keyof typeof textSizes] || textSizes.md
      )}
    >
      {error}
    </div>
  );
};

/**
 * Help text component for additional context
 */
const ToggleHelpText: React.FC<{
  id?: string;
  helpText?: string;
  size?: ComponentSize;
}> = ({ id, helpText, size = 'md' }) => {
  if (!helpText) return null;

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm', 
    lg: 'text-sm',
    xl: 'text-base'
  };

  return (
    <div
      id={id}
      className={cn(
        'mt-1 text-secondary-600 dark:text-secondary-400',
        textSizes[size as keyof typeof textSizes] || textSizes.md
      )}
    >
      {helpText}
    </div>
  );
};

/**
 * Main Toggle Component
 * 
 * Implements a fully accessible toggle switch using Headless UI Switch primitive
 * with comprehensive WCAG 2.1 AA compliance and React Hook Form integration.
 */
export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(({
  // Core toggle props
  checked,
  defaultChecked = false,
  onChange,
  
  // Form integration
  name,
  control,
  rules,
  
  // Content
  label,
  description,
  helpText,
  
  // Styling
  size = 'md',
  variant = 'primary', 
  labelPosition = 'right',
  switchStyle = 'default',
  
  // State
  loading = false,
  disabled = false,
  required = false,
  
  // Accessibility
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-labelledby': ariaLabelledBy,
  'aria-required': ariaRequired,
  
  // Custom styling
  className,
  switchClassName,
  thumbClassName,
  labelClassName,
  
  // Error state
  error,
  invalid = false,
  
  // Event handlers
  onFocus,
  onBlur,
  
  // Base component props
  id: providedId,
  'data-testid': testId,
  
  ...rest
}, ref) => {
  // Generate unique IDs for accessibility
  const generatedId = useId();
  const id = providedId || generatedId;
  const labelId = `${id}-label`;
  const descriptionId = description ? `${id}-description` : undefined;
  const helpTextId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  // Combine ARIA describedby IDs
  const combinedAriaDescribedBy = [
    ariaDescribedBy,
    descriptionId,
    helpTextId,
    errorId
  ].filter(Boolean).join(' ') || undefined;

  // Get variant classes
  const variantClasses = getToggleClasses({
    container: {
      size,
      variant: invalid || error ? 'error' : variant,
      labelPosition,
      switchStyle,
      className
    },
    switch: {
      size,
      switchStyle,
      variant: invalid || error ? 'error' : variant,
      className: switchClassName
    },
    thumb: {
      size,
      switchStyle, 
      variant: invalid || error ? 'error' : variant,
      className: thumbClassName
    },
    label: {
      size,
      variant: invalid || error ? 'error' : variant,
      state: disabled ? 'disabled' : loading ? 'loading' : 'default',
      className: labelClassName
    }
  });

  // Internal toggle component without form integration
  const ToggleComponent: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
  }> = ({ checked: isChecked, onChange: onToggleChange }) => {
    const handleClick = () => {
      if (loading || disabled) return;
      onToggleChange(!isChecked);
    };

    return (
      <div className={variantClasses.container}>
        {/* Label positioned left or top */}
        {(labelPosition === 'left' || labelPosition === 'top') && (
          <ToggleLabel
            id={labelId}
            label={label}
            required={required}
            size={size}
            variant={invalid || error ? 'error' : variant}
            disabled={disabled}
            loading={loading}
            className={variantClasses.label}
            onClick={handleClick}
          />
        )}

        {/* Switch container */}
        <div className="relative flex items-center">
          <Switch
            ref={ref}
            id={id}
            checked={isChecked}
            onChange={onToggleChange}
            disabled={disabled || loading}
            data-testid={testId}
            className={variantClasses.switch}
            data-state={isChecked ? 'checked' : 'unchecked'}
            data-loading={loading}
            aria-label={ariaLabel || (label ? undefined : 'Toggle switch')}
            aria-labelledby={ariaLabelledBy || (label ? labelId : undefined)}
            aria-describedby={combinedAriaDescribedBy}
            aria-required={ariaRequired ?? required}
            aria-invalid={invalid || !!error}
            onFocus={onFocus}
            onBlur={onBlur}
            {...rest}
          >
            <span className="sr-only">
              {label || 'Toggle switch'}
              {isChecked ? ' (enabled)' : ' (disabled)'}
            </span>
            
            {/* Switch thumb/handle */}
            <span
              className={variantClasses.thumb}
              data-state={isChecked ? 'checked' : 'unchecked'}
              aria-hidden="true"
            >
              {/* Loading indicator inside thumb */}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ToggleLoadingSpinner 
                    size={size === 'lg' ? 'sm' : 'xs'}
                    className="text-current"
                  />
                </div>
              )}
            </span>
          </Switch>
        </div>

        {/* Label positioned right or bottom */}
        {(labelPosition === 'right' || labelPosition === 'bottom') && (
          <ToggleLabel
            id={labelId}
            label={label}
            required={required}
            size={size}
            variant={invalid || error ? 'error' : variant}
            disabled={disabled}
            loading={loading}
            className={variantClasses.label}
            onClick={handleClick}
          />
        )}
      </div>
    );
  };

  // Content area with description, help text, and error
  const ContentArea: React.FC = () => (
    <>
      {description && (
        <div
          id={descriptionId}
          className={cn(
            'text-secondary-600 dark:text-secondary-400',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}
        >
          {description}
        </div>
      )}
      
      <ToggleHelpText
        id={helpTextId}
        helpText={helpText}
        size={size}
      />
      
      <ToggleErrorMessage
        id={errorId}
        error={error}
        size={size}
      />
    </>
  );

  // If no form integration, use controlled/uncontrolled pattern
  if (!name && !control) {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
    const isControlled = checked !== undefined;
    const toggleChecked = isControlled ? checked : internalChecked;

    const handleChange = (newChecked: boolean) => {
      if (!isControlled) {
        setInternalChecked(newChecked);
      }
      onChange?.(newChecked);
    };

    return (
      <div className="space-y-2">
        <ToggleComponent 
          checked={toggleChecked}
          onChange={handleChange}
        />
        <ContentArea />
      </div>
    );
  }

  // React Hook Form integration
  return (
    <div className="space-y-2">
      <Controller
        name={name!}
        control={control}
        rules={{
          required: required && 'This field is required',
          ...rules
        }}
        defaultValue={defaultChecked}
        render={({ field: { onChange: fieldOnChange, onBlur: fieldOnBlur, value, name: fieldName, ref: fieldRef } }) => (
          <ToggleComponent
            checked={Boolean(value)}
            onChange={(newChecked) => {
              fieldOnChange(newChecked);
              onChange?.(newChecked);
            }}
          />
        )}
      />
      <ContentArea />
    </div>
  );
});

Toggle.displayName = 'Toggle';

/**
 * Form-integrated Toggle component with automatic error handling
 * 
 * This component automatically integrates with React Hook Form context
 * and displays validation errors without manual prop passing.
 */
export const FormToggle = forwardRef<HTMLButtonElement, FormToggleProps>(({
  name,
  control,
  rules,
  ...props
}, ref) => {
  const formContext = useFormContext();
  const resolvedControl = control || formContext?.control;
  
  if (!resolvedControl) {
    console.warn(
      'FormToggle: No form control found. Use within a form provider or pass control prop.'
    );
    return <Toggle ref={ref} name={name} {...props} />;
  }

  const fieldState = formContext?.getFieldState?.(name);
  const error = fieldState?.error?.message;

  return (
    <Toggle
      ref={ref}
      name={name}
      control={resolvedControl}
      rules={rules}
      error={error}
      invalid={!!error}
      {...props}
    />
  );
});

FormToggle.displayName = 'FormToggle';

/**
 * Export convenience hooks and utilities
 */

/**
 * Hook for managing toggle state with validation
 */
export const useToggle = (initialValue: boolean = false) => {
  const [checked, setChecked] = React.useState(initialValue);
  
  const toggle = React.useCallback(() => {
    setChecked(prev => !prev);
  }, []);
  
  const setTrue = React.useCallback(() => {
    setChecked(true);
  }, []);
  
  const setFalse = React.useCallback(() => {
    setChecked(false);
  }, []);
  
  return {
    checked,
    setChecked,
    toggle,
    setTrue,
    setFalse
  } as const;
};

/**
 * Default export for convenience
 */
export default Toggle;

/**
 * Type exports for external use
 */
export type {
  ToggleProps,
  FormToggleProps,
  ToggleLabelPosition,
  ToggleSwitchStyle,
  ToggleVariants,
  ToggleSwitchVariants,
  ToggleThumbVariants,
  ToggleLabelVariants
};