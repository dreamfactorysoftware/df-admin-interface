/**
 * Form Field Component
 * 
 * Comprehensive form field wrapper providing consistent layout, labeling,
 * error display, and accessibility features for all form inputs. Automatically
 * integrates with React Hook Form field state, displays validation errors,
 * and maintains WCAG 2.1 AA compliance with proper ARIA associations.
 * 
 * Features:
 * - React Hook Form integration with automatic field state management via useController
 * - WCAG 2.1 AA accessibility compliance with proper ARIA associations between labels, inputs, and errors
 * - Consistent styling using Tailwind CSS 4.1+ utility classes with design tokens
 * - Error state display with 4.5:1 contrast ratio for accessibility compliance
 * - Responsive layout support for different screen sizes and form layouts
 * - Optional and required field indicator support with clear visual distinction
 * - Dark theme styling via Zustand theme store integration
 * - Performance optimized with React.memo and optimized re-rendering
 * 
 * @fileoverview Form field wrapper component for DreamFactory Admin Interface
 * @version 1.0.0
 */

import React, { forwardRef, useId, useMemo } from 'react';
import { 
  useController, 
  type Control, 
  type FieldPath, 
  type FieldValues, 
  type RegisterOptions,
  type FieldError 
} from 'react-hook-form';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../hooks/use-theme';
import { FormLabel } from './form-label';
import { FormError } from './form-error';
import type { 
  BaseComponentProps, 
  AccessibilityProps, 
  ThemeProps, 
  ResponsiveProps,
  SizeVariant,
  ValidationState,
  LoadingState
} from '../../../types/ui';
import type {
  FormFieldVariant,
  FormLayout,
  FormSpacing
} from './form.types';

/**
 * Form field configuration options
 * Controls field behavior and appearance
 */
export interface FormFieldConfig {
  /** Field display label */
  label: string;
  
  /** Field placeholder text */
  placeholder?: string;
  
  /** Field description or help text */
  description?: string;
  
  /** Field is required */
  required?: boolean;
  
  /** Field is disabled */
  disabled?: boolean;
  
  /** Field is read-only */
  readOnly?: boolean;
  
  /** Show optional indicator when field is not required */
  showOptional?: boolean;
  
  /** Custom required indicator */
  requiredIndicator?: React.ReactNode;
  
  /** Custom optional indicator */
  optionalIndicator?: React.ReactNode;
  
  /** Hide the label (while maintaining accessibility) */
  hideLabel?: boolean;
  
  /** Additional label props */
  labelProps?: Record<string, any>;
  
  /** Additional description text ID for ARIA association */
  descriptionId?: string;
  
  /** Tooltip content for the label */
  tooltip?: string;
  
  /** Field group name for radio/checkbox groups */
  group?: string;
}

/**
 * Form field layout configuration
 * Controls field positioning and spacing
 */
export interface FormFieldLayout {
  /** Layout orientation */
  orientation?: 'vertical' | 'horizontal' | 'inline';
  
  /** Label width in horizontal layout */
  labelWidth?: 'auto' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Field spacing */
  spacing?: FormSpacing;
  
  /** Grid column span */
  colSpan?: number;
  
  /** Field alignment in container */
  align?: 'start' | 'center' | 'end' | 'stretch';
  
  /** Field justification in container */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}

/**
 * Form field wrapper props
 * Comprehensive interface for React Hook Form integration and styling
 */
export interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends BaseComponentProps<HTMLDivElement>,
    AccessibilityProps,
    ThemeProps,
    ResponsiveProps {
  
  /** React Hook Form control instance */
  control: Control<TFieldValues>;
  
  /** Field name for form registration */
  name: TName;
  
  /** Form field configuration */
  config: FormFieldConfig;
  
  /** Form field layout configuration */
  layout?: FormFieldLayout;
  
  /** React Hook Form validation rules */
  rules?: RegisterOptions<TFieldValues, TName>;
  
  /** Field styling variant */
  variant?: FormFieldVariant;
  
  /** Field size */
  size?: SizeVariant;
  
  /** Custom field component */
  children: React.ReactElement;
  
  /** Custom error message override */
  errorMessage?: string;
  
  /** Show field loading state */
  loading?: boolean;
  
  /** Field validation state override */
  validationState?: ValidationState;
  
  /** Custom CSS classes for field wrapper */
  className?: string;
  
  /** Custom CSS classes for label wrapper */
  labelClassName?: string;
  
  /** Custom CSS classes for input wrapper */
  inputClassName?: string;
  
  /** Custom CSS classes for error wrapper */
  errorClassName?: string;
  
  /** Field change callback */
  onFieldChange?: (value: any) => void;
  
  /** Field blur callback */
  onFieldBlur?: () => void;
  
  /** Field focus callback */
  onFieldFocus?: () => void;
  
  /** Custom field renderer */
  renderField?: (fieldProps: any) => React.ReactNode;
  
  /** Test identifier for field wrapper */
  'data-testid'?: string;
}

/**
 * Form field layout class mappings
 * WCAG compliant spacing and responsive design
 */
const LAYOUT_CLASSES = {
  orientation: {
    vertical: 'flex flex-col space-y-2',
    horizontal: 'flex flex-row items-start space-x-4',
    inline: 'flex flex-row items-center space-x-2',
  },
  labelWidth: {
    auto: 'w-auto',
    sm: 'w-24 flex-shrink-0',
    md: 'w-32 flex-shrink-0',
    lg: 'w-40 flex-shrink-0',
    xl: 'w-48 flex-shrink-0',
  },
  spacing: {
    compact: 'space-y-1',
    normal: 'space-y-2',
    relaxed: 'space-y-3',
    loose: 'space-y-4',
  },
  align: {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  },
  justify: {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  },
} as const;

/**
 * Form field variant class mappings
 * Consistent styling with design system tokens
 */
const FIELD_VARIANT_CLASSES = {
  default: {
    wrapper: 'rounded-md',
    focus: 'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
  },
  filled: {
    wrapper: 'bg-gray-50 dark:bg-gray-800 rounded-md p-3',
    focus: 'focus-within:bg-white dark:focus-within:bg-gray-700',
  },
  outlined: {
    wrapper: 'border border-gray-300 dark:border-gray-600 rounded-md p-3',
    focus: 'focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500',
  },
  underlined: {
    wrapper: 'border-b border-gray-300 dark:border-gray-600 pb-1',
    focus: 'focus-within:border-primary-500',
  },
  ghost: {
    wrapper: 'hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md p-2',
    focus: 'focus-within:bg-white dark:focus-within:bg-gray-700',
  },
} as const;

/**
 * Generate responsive grid column classes
 * Supports responsive form layouts
 */
const getColumnSpanClasses = (colSpan?: number): string => {
  if (!colSpan || colSpan < 1 || colSpan > 12) return '';
  
  const spanClasses = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
    5: 'col-span-5',
    6: 'col-span-6',
    7: 'col-span-7',
    8: 'col-span-8',
    9: 'col-span-9',
    10: 'col-span-10',
    11: 'col-span-11',
    12: 'col-span-12',
  };
  
  return spanClasses[colSpan as keyof typeof spanClasses] || '';
};

/**
 * Form Field Component
 * 
 * Comprehensive form field wrapper that provides automatic React Hook Form
 * integration, accessibility compliance, and consistent styling. Supports
 * complex form layouts with responsive design and dark theme integration.
 * 
 * Performance optimized with React.memo and intelligent re-rendering based
 * on field state changes. Maintains WCAG 2.1 AA standards throughout.
 */
export const FormField = React.memo(forwardRef<
  HTMLDivElement,
  FormFieldProps
>(({
  control,
  name,
  config,
  layout = {},
  rules,
  variant = 'default',
  size = 'md',
  children,
  errorMessage,
  loading = false,
  validationState,
  className,
  labelClassName,
  inputClassName,
  errorClassName,
  onFieldChange,
  onFieldBlur,
  onFieldFocus,
  renderField,
  'aria-describedby': ariaDescribedBy,
  'aria-labelledby': ariaLabelledBy,
  'data-testid': testId,
  ...props
}, ref) => {
  
  // Generate unique IDs for accessibility relationships
  const fieldId = useId();
  const labelId = `${fieldId}-label`;
  const descriptionId = config.description ? `${fieldId}-description` : undefined;
  const errorId = `${fieldId}-error`;
  
  // Get theme context for dark mode styling
  const { resolvedTheme } = useTheme();
  
  // Extract layout configuration with defaults
  const {
    orientation = 'vertical',
    labelWidth = 'auto',
    spacing = 'normal',
    colSpan,
    align = 'stretch',
    justify = 'start',
  } = layout;
  
  // React Hook Form integration with useController
  const {
    field,
    fieldState: { invalid, isTouched, isDirty, error }
  } = useController({
    name,
    control,
    rules: {
      required: config.required ? 'This field is required' : false,
      ...rules,
    },
  });
  
  // Determine validation state
  const hasError = invalid && isTouched;
  const finalValidationState = validationState || (hasError ? 'error' : 'valid');
  const displayError = hasError ? error : undefined;
  
  // Memoized ARIA describedby calculation
  const combinedDescribedBy = useMemo(() => {
    const ids = [
      ariaDescribedBy,
      descriptionId,
      hasError ? errorId : undefined,
    ].filter(Boolean);
    
    return ids.length > 0 ? ids.join(' ') : undefined;
  }, [ariaDescribedBy, descriptionId, hasError, errorId]);
  
  // Enhanced field props with React Hook Form integration
  const enhancedFieldProps = useMemo(() => ({
    ...field,
    id: fieldId,
    'aria-labelledby': ariaLabelledBy || labelId,
    'aria-describedby': combinedDescribedBy,
    'aria-required': config.required,
    'aria-invalid': hasError,
    disabled: config.disabled || loading,
    readOnly: config.readOnly,
    placeholder: config.placeholder,
    onChange: (value: any) => {
      field.onChange(value);
      onFieldChange?.(value);
    },
    onBlur: () => {
      field.onBlur();
      onFieldBlur?.();
    },
    onFocus: () => {
      onFieldFocus?.();
    },
    'data-field-name': name,
    'data-validation-state': finalValidationState,
  }), [
    field,
    fieldId,
    ariaLabelledBy,
    labelId,
    combinedDescribedBy,
    config.required,
    config.disabled,
    config.readOnly,
    config.placeholder,
    hasError,
    loading,
    finalValidationState,
    name,
    onFieldChange,
    onFieldBlur,
    onFieldFocus,
  ]);
  
  // Field wrapper classes with responsive and theme support
  const wrapperClasses = cn(
    // Base field wrapper styles
    'form-field-wrapper',
    
    // Layout orientation classes
    LAYOUT_CLASSES.orientation[orientation],
    
    // Spacing classes (only for vertical orientation)
    orientation === 'vertical' && LAYOUT_CLASSES.spacing[spacing],
    
    // Alignment and justification
    LAYOUT_CLASSES.align[align],
    LAYOUT_CLASSES.justify[justify],
    
    // Grid column span for responsive layouts
    getColumnSpanClasses(colSpan),
    
    // Variant-specific wrapper styling
    FIELD_VARIANT_CLASSES[variant].wrapper,
    
    // Focus state styling with accessibility compliance
    !config.disabled && !config.readOnly && FIELD_VARIANT_CLASSES[variant].focus,
    
    // Loading state styling
    loading && 'opacity-75 pointer-events-none',
    
    // Disabled state styling with proper contrast
    config.disabled && 'opacity-60',
    
    // Error state styling with WCAG compliant colors
    hasError && 'border-error-300 dark:border-error-700',
    
    // Success state styling (when valid and touched)
    !hasError && isTouched && isDirty && 'border-success-300 dark:border-success-700',
    
    // Custom wrapper classes
    className
  );
  
  // Label wrapper classes for horizontal layouts
  const labelWrapperClasses = cn(
    'label-wrapper',
    // Horizontal layout label positioning
    orientation === 'horizontal' && [
      LAYOUT_CLASSES.labelWidth[labelWidth],
      'flex-shrink-0',
      // Align label with first line of input in horizontal layout
      'pt-2',
    ],
    labelClassName
  );
  
  // Input wrapper classes
  const inputWrapperClasses = cn(
    'input-wrapper',
    // Horizontal layout input container
    orientation === 'horizontal' && 'flex-1 min-w-0',
    inputClassName
  );
  
  // Error wrapper classes
  const errorWrapperClasses = cn(
    'error-wrapper',
    // Full width in horizontal layout
    orientation === 'horizontal' && 'w-full',
    errorClassName
  );
  
  // Clone children with enhanced props
  const enhancedChildren = useMemo(() => {
    if (renderField) {
      return renderField(enhancedFieldProps);
    }
    
    if (React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...enhancedFieldProps,
        // Merge any existing props from children
        ...children.props,
        // Ensure our enhanced props take precedence for critical accessibility attributes
        id: enhancedFieldProps.id,
        'aria-labelledby': enhancedFieldProps['aria-labelledby'],
        'aria-describedby': enhancedFieldProps['aria-describedby'],
        'aria-required': enhancedFieldProps['aria-required'],
        'aria-invalid': enhancedFieldProps['aria-invalid'],
      });
    }
    
    return children;
  }, [children, enhancedFieldProps, renderField]);
  
  return (
    <div
      ref={ref}
      className={wrapperClasses}
      data-testid={testId || `form-field-${name}`}
      data-field-name={name}
      data-orientation={orientation}
      data-variant={variant}
      data-size={size}
      data-theme={resolvedTheme}
      data-loading={loading}
      data-disabled={config.disabled}
      data-readonly={config.readOnly}
      data-required={config.required}
      data-has-error={hasError}
      data-is-touched={isTouched}
      data-is-dirty={isDirty}
      {...props}
    >
      {/* Label Section */}
      {!config.hideLabel && (
        <div className={labelWrapperClasses}>
          <FormLabel
            id={labelId}
            htmlFor={fieldId}
            required={config.required}
            optional={config.showOptional && !config.required}
            description={config.description}
            error={hasError}
            disabled={config.disabled}
            size={size}
            variant={orientation === 'inline' ? 'inline' : 'default'}
            requiredIndicator={config.requiredIndicator}
            optionalIndicator={config.optionalIndicator}
            className={cn(
              // Horizontal layout label styling
              orientation === 'horizontal' && 'text-right',
              // Inline layout label styling
              orientation === 'inline' && 'mb-0',
            )}
            {...config.labelProps}
          >
            {config.label}
          </FormLabel>
        </div>
      )}
      
      {/* Input Section */}
      <div className={inputWrapperClasses}>
        {/* Form Input/Control */}
        <div className="relative">
          {enhancedChildren}
          
          {/* Loading Indicator */}
          {loading && (
            <div 
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              aria-hidden="true"
            >
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 dark:border-primary-400" />
            </div>
          )}
        </div>
        
        {/* Error Message */}
        {hasError && (
          <div className={errorWrapperClasses}>
            <FormError
              error={displayError}
              message={errorMessage}
              fieldName={name}
              className="mt-1"
              aria-live="polite"
              id={errorId}
            />
          </div>
        )}
      </div>
      
      {/* Screen Reader Status Updates */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {loading && `Loading ${config.label}`}
        {hasError && `Error in ${config.label}: ${displayError?.message || errorMessage}`}
        {!hasError && isTouched && isDirty && `${config.label} is valid`}
      </div>
    </div>
  );
})) as <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(
  props: FormFieldProps<TFieldValues, TName> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement;

// Set display name for debugging
FormField.displayName = 'FormField';

/**
 * Hook for managing form field accessibility relationships
 * Provides automatic ID generation and ARIA attribute management
 * 
 * @param fieldName - The form field name
 * @param config - Field configuration options
 * @returns Object with field accessibility props and helper functions
 */
export const useFormFieldAccessibility = (
  fieldName: string,
  config: FormFieldConfig
) => {
  const fieldId = useId();
  const labelId = `${fieldId}-label`;
  const descriptionId = config.description ? `${fieldId}-description` : undefined;
  const errorId = `${fieldId}-error`;
  
  // Generate ARIA describedby string
  const describedBy = [descriptionId, errorId]
    .filter(Boolean)
    .join(' ') || undefined;
  
  return {
    // Field IDs
    fieldId,
    labelId,
    descriptionId,
    errorId,
    
    // Props for form field wrapper
    fieldProps: {
      id: fieldId,
      'aria-labelledby': labelId,
      'aria-describedby': describedBy,
      'aria-required': config.required,
    },
    
    // Props for label
    labelProps: {
      id: labelId,
      htmlFor: fieldId,
      required: config.required,
    },
    
    // Helper functions
    getDescribedBy: (hasError: boolean) => {
      const ids = [descriptionId, hasError ? errorId : undefined]
        .filter(Boolean);
      return ids.length > 0 ? ids.join(' ') : undefined;
    },
  };
};

/**
 * Hook for form field validation state management
 * Integrates with React Hook Form and provides enhanced validation feedback
 * 
 * @param control - React Hook Form control
 * @param name - Field name
 * @param config - Field configuration
 * @returns Validation state and helper functions
 */
export const useFormFieldValidation = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(
  control: Control<TFieldValues>,
  name: TName,
  config: FormFieldConfig
) => {
  const {
    fieldState: { invalid, isTouched, isDirty, error },
    field
  } = useController({ name, control });
  
  const hasError = invalid && isTouched;
  const isValid = !invalid && isTouched && isDirty;
  
  return {
    // Field state
    hasError,
    isValid,
    isTouched,
    isDirty,
    error,
    
    // Field props
    field,
    
    // Validation helpers
    getValidationState: (): ValidationState => {
      if (hasError) return 'error';
      if (isValid) return 'valid';
      return 'idle';
    },
    
    getAriaInvalid: () => hasError,
    getAriaRequired: () => config.required,
  };
};

/**
 * Component constants for consistent behavior
 */
export const FORM_FIELD_CONSTANTS = {
  /** Default variant */
  DEFAULT_VARIANT: 'default' as FormFieldVariant,
  
  /** Default size */
  DEFAULT_SIZE: 'md' as SizeVariant,
  
  /** Default layout orientation */
  DEFAULT_ORIENTATION: 'vertical' as const,
  
  /** Default spacing */
  DEFAULT_SPACING: 'normal' as FormSpacing,
  
  /** Default label width in horizontal layout */
  DEFAULT_LABEL_WIDTH: 'md' as const,
  
  /** Maximum column span */
  MAX_COLUMN_SPAN: 12,
  
  /** Field accessibility role */
  FIELD_ROLE: 'group',
  
  /** Error announcement delay (ms) */
  ERROR_ANNOUNCEMENT_DELAY: 150,
} as const;

/**
 * Export type definitions for external use
 */
export type { 
  FormFieldProps, 
  FormFieldConfig, 
  FormFieldLayout 
};

/**
 * Default export for convenient importing
 */
export default FormField;