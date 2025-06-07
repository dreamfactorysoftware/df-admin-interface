/**
 * Form Control Wrapper Component for DreamFactory Admin Interface
 * 
 * Comprehensive form field wrapper that provides consistent layout, accessibility,
 * and React Hook Form integration. Replaces Angular FormControl patterns with
 * modern React form management, automatic field registration, and WCAG 2.1 AA
 * compliance for all form inputs across database configuration workflows.
 * 
 * Key Features:
 * - Automatic React Hook Form field registration with proper typing
 * - WCAG 2.1 AA accessibility compliance with focus indicators and keyboard navigation
 * - Consistent spacing and layout patterns using Tailwind CSS design tokens
 * - Focus ring system with 3:1 contrast ratio for optimal visibility
 * - Support for disabled, readonly, and loading states with clear visual distinction
 * - Help text and description support with proper ARIA associations
 * - Theme-aware styling with light/dark mode support
 * - Responsive layout with mobile-first design approach
 * 
 * @fileoverview Form control wrapper for React Hook Form integration
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import React, { 
  forwardRef, 
  ReactNode, 
  ComponentType, 
  useId, 
  useMemo,
  HTMLAttributes,
  LabelHTMLAttributes,
  cloneElement,
  isValidElement
} from 'react';
import { 
  useController, 
  useFormContext, 
  FieldPath, 
  FieldValues, 
  Control 
} from 'react-hook-form';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import type { 
  FormFieldProps, 
  FormFieldComponent, 
  ComponentSize, 
  ComponentVariant,
  FormFieldLayout,
  FormFieldType 
} from './form.types';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Form control layout configuration options
 */
export interface FormControlLayout extends FormFieldLayout {
  /** Label position relative to input */
  labelPosition?: 'top' | 'left' | 'inline' | 'floating' | 'hidden';
  
  /** Label width when positioned left */
  labelWidth?: string;
  
  /** Field width configuration */
  fieldWidth?: string;
  
  /** Help text positioning */
  helpTextPosition?: 'below' | 'side' | 'tooltip';
  
  /** Error message positioning */
  errorPosition?: 'below' | 'side' | 'inline';
  
  /** Compact layout for space-constrained areas */
  compact?: boolean;
  
  /** Full width field expansion */
  fullWidth?: boolean;
}

/**
 * Form control styling variants
 */
export type FormControlVariant = 
  | 'default'
  | 'outlined'
  | 'filled'
  | 'underlined'
  | 'floating'
  | 'minimal'
  | 'card'
  | 'inline';

/**
 * Form control size variants
 */
export type FormControlSize = ComponentSize;

/**
 * Form control state indicators
 */
export interface FormControlState {
  /** Field has been touched by user */
  isTouched?: boolean;
  
  /** Field value has changed from initial */
  isDirty?: boolean;
  
  /** Field is currently being validated */
  isValidating?: boolean;
  
  /** Field has validation errors */
  hasError?: boolean;
  
  /** Field is in loading state */
  isLoading?: boolean;
  
  /** Field is disabled */
  isDisabled?: boolean;
  
  /** Field is readonly */
  isReadonly?: boolean;
  
  /** Field is required */
  isRequired?: boolean;
}

/**
 * Form control props interface with comprehensive configuration
 */
export interface FormControlProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  // Core field configuration
  /** Field name for React Hook Form registration */
  name: TName;
  
  /** Field label text */
  label: string;
  
  /** React Hook Form control instance */
  control?: Control<TFieldValues>;
  
  /** Field validation rules */
  rules?: FormFieldProps<TFieldValues, TName>['rules'];
  
  /** Default field value */
  defaultValue?: TFieldValues[TName];
  
  // Field content and behavior
  /** Form input element or render function */
  children: ReactNode | ((props: {
    field: {
      name: TName;
      value: TFieldValues[TName];
      onChange: (value: TFieldValues[TName]) => void;
      onBlur: () => void;
      ref: (instance: any) => void;
    };
    fieldState: {
      invalid: boolean;
      isTouched: boolean;
      isDirty: boolean;
      error?: { message?: string };
    };
    formState: {
      isSubmitting: boolean;
      isValidating: boolean;
    };
  }) => ReactNode);
  
  // Layout and styling
  /** Visual variant for the form control */
  variant?: FormControlVariant;
  
  /** Size variant for consistent spacing */
  size?: FormControlSize;
  
  /** Layout configuration */
  layout?: FormControlLayout;
  
  // Field state
  /** Field is disabled */
  disabled?: boolean;
  
  /** Field is readonly */
  readonly?: boolean;
  
  /** Field is required */
  required?: boolean;
  
  /** Field is in loading state */
  loading?: boolean;
  
  /** Hide field from display */
  hidden?: boolean;
  
  // Help and documentation
  /** Helper text displayed below field */
  helpText?: string;
  
  /** Detailed description for screen readers */
  description?: string;
  
  /** Placeholder text for input */
  placeholder?: string;
  
  /** Error message override */
  error?: string;
  
  // Icons and addons
  /** Icon component displayed before label */
  startIcon?: ComponentType<{ className?: string }>;
  
  /** Icon component displayed after label */
  endIcon?: ComponentType<{ className?: string }>;
  
  /** Content displayed before input */
  startAddon?: ReactNode;
  
  /** Content displayed after input */
  endAddon?: ReactNode;
  
  // Accessibility
  /** Accessible label override */
  'aria-label'?: string;
  
  /** Additional aria-describedby IDs */
  'aria-describedby'?: string;
  
  /** Custom aria-labelledby */
  'aria-labelledby'?: string;
  
  /** Aria live region for dynamic updates */
  'aria-live'?: 'off' | 'polite' | 'assertive';
  
  // Event handlers
  /** Called when field value changes */
  onValueChange?: (value: TFieldValues[TName]) => void;
  
  /** Called when field loses focus */
  onBlur?: () => void;
  
  /** Called when field gains focus */
  onFocus?: () => void;
  
  /** Called when field validation state changes */
  onValidationChange?: (isValid: boolean, error?: string) => void;
  
  // Testing
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/**
 * Label component props for consistent styling
 */
interface FormLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  disabled?: boolean;
  size?: FormControlSize;
  variant?: FormControlVariant;
  position?: FormControlLayout['labelPosition'];
  children: ReactNode;
}

/**
 * Help text component props for accessibility
 */
interface FormHelpTextProps extends HTMLAttributes<HTMLDivElement> {
  size?: FormControlSize;
  variant?: FormControlVariant;
  children: ReactNode;
}

/**
 * Error message component props for accessibility
 */
interface FormErrorProps extends HTMLAttributes<HTMLDivElement> {
  size?: FormControlSize;
  variant?: FormControlVariant;
  children: ReactNode;
}

// =============================================================================
// UTILITY FUNCTIONS AND CONSTANTS
// =============================================================================

/**
 * Default layout configuration
 */
const DEFAULT_LAYOUT: Required<FormControlLayout> = {
  labelPosition: 'top',
  labelWidth: 'auto',
  fieldWidth: '100%',
  helpTextPosition: 'below',
  errorPosition: 'below',
  compact: false,
  fullWidth: true,
};

/**
 * Size variant class mappings
 */
const SIZE_CLASSES: Record<FormControlSize, {
  wrapper: string;
  label: string;
  helpText: string;
  error: string;
  spacing: string;
}> = {
  xs: {
    wrapper: 'space-y-1',
    label: 'text-xs font-medium',
    helpText: 'text-xs',
    error: 'text-xs',
    spacing: 'gap-1',
  },
  sm: {
    wrapper: 'space-y-1.5',
    label: 'text-sm font-medium',
    helpText: 'text-xs',
    error: 'text-xs',
    spacing: 'gap-1.5',
  },
  md: {
    wrapper: 'space-y-2',
    label: 'text-sm font-medium',
    helpText: 'text-sm',
    error: 'text-sm',
    spacing: 'gap-2',
  },
  lg: {
    wrapper: 'space-y-2.5',
    label: 'text-base font-medium',
    helpText: 'text-sm',
    error: 'text-sm',
    spacing: 'gap-2.5',
  },
  xl: {
    wrapper: 'space-y-3',
    label: 'text-lg font-medium',
    helpText: 'text-base',
    error: 'text-base',
    spacing: 'gap-3',
  },
};

/**
 * Variant class mappings for different form styles
 */
const VARIANT_CLASSES: Record<FormControlVariant, {
  wrapper: string;
  label: string;
  field: string;
}> = {
  default: {
    wrapper: '',
    label: 'text-gray-900 dark:text-gray-100',
    field: '',
  },
  outlined: {
    wrapper: 'border border-gray-200 dark:border-gray-700 rounded-md p-3',
    label: 'text-gray-700 dark:text-gray-300',
    field: '',
  },
  filled: {
    wrapper: 'bg-gray-50 dark:bg-gray-800 rounded-md p-3',
    label: 'text-gray-700 dark:text-gray-300',
    field: '',
  },
  underlined: {
    wrapper: 'border-b border-gray-200 dark:border-gray-700 pb-2',
    label: 'text-gray-700 dark:text-gray-300',
    field: '',
  },
  floating: {
    wrapper: 'relative',
    label: 'absolute top-2 left-3 text-gray-500 dark:text-gray-400 transition-all duration-200',
    field: 'pt-6',
  },
  minimal: {
    wrapper: 'space-y-1',
    label: 'text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wide',
    field: '',
  },
  card: {
    wrapper: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm',
    label: 'text-gray-800 dark:text-gray-200',
    field: '',
  },
  inline: {
    wrapper: 'flex items-center space-x-3',
    label: 'text-gray-700 dark:text-gray-300 flex-shrink-0',
    field: 'flex-1',
  },
};

/**
 * Generate accessibility attributes for form control
 */
const generateAccessibilityProps = (
  fieldId: string,
  helpTextId: string,
  errorId: string,
  props: Pick<FormControlProps, 'aria-label' | 'aria-describedby' | 'aria-labelledby' | 'required' | 'disabled' | 'readonly'>,
  hasError: boolean,
  hasHelpText: boolean
) => {
  const describedBy: string[] = [];
  
  if (hasHelpText) {
    describedBy.push(helpTextId);
  }
  
  if (hasError) {
    describedBy.push(errorId);
  }
  
  if (props['aria-describedby']) {
    describedBy.push(props['aria-describedby']);
  }
  
  return {
    'aria-label': props['aria-label'],
    'aria-labelledby': props['aria-labelledby'],
    'aria-describedby': describedBy.length > 0 ? describedBy.join(' ') : undefined,
    'aria-required': props.required,
    'aria-disabled': props.disabled,
    'aria-readonly': props.readonly,
    'aria-invalid': hasError,
  };
};

/**
 * Enhanced focus ring classes for WCAG 2.1 AA compliance
 */
const FOCUS_RING_CLASSES = [
  'focus-within:ring-2',
  'focus-within:ring-primary-500',
  'focus-within:ring-opacity-50',
  'focus-within:border-primary-500',
  'transition-all',
  'duration-200',
  'ease-in-out',
].join(' ');

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Form label component with consistent styling and accessibility
 */
const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ 
    required, 
    disabled, 
    size = 'md', 
    variant = 'default', 
    position = 'top',
    className,
    children,
    ...props 
  }, ref) => {
    const sizeClasses = SIZE_CLASSES[size];
    const variantClasses = VARIANT_CLASSES[variant];
    
    return (
      <label
        ref={ref}
        className={cn(
          // Base label styles
          'block font-medium leading-6 select-none',
          
          // Size-based styling
          sizeClasses.label,
          
          // Variant-based styling
          variantClasses.label,
          
          // Position-specific styling
          {
            'mb-1.5': position === 'top',
            'sr-only': position === 'hidden',
            'absolute z-10 px-1 bg-white dark:bg-gray-900': position === 'floating',
          },
          
          // State-based styling
          {
            'opacity-50 cursor-not-allowed': disabled,
            'cursor-pointer': !disabled,
          },
          
          // Theme-aware focus styling
          'transition-colors duration-200',
          
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span 
            className="ml-1 text-red-500 dark:text-red-400 select-none" 
            aria-label="required"
          >
            *
          </span>
        )}
      </label>
    );
  }
);

FormLabel.displayName = 'FormLabel';

/**
 * Help text component with accessibility support
 */
const FormHelpText = forwardRef<HTMLDivElement, FormHelpTextProps>(
  ({ size = 'md', variant = 'default', className, children, ...props }, ref) => {
    const sizeClasses = SIZE_CLASSES[size];
    
    return (
      <div
        ref={ref}
        className={cn(
          // Base help text styles
          'leading-5',
          
          // Size-based styling
          sizeClasses.helpText,
          
          // Theme-aware colors
          'text-gray-600 dark:text-gray-400',
          
          // Accessibility improvements
          'break-words',
          
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FormHelpText.displayName = 'FormHelpText';

/**
 * Error message component with accessibility and animation
 */
const FormError = forwardRef<HTMLDivElement, FormErrorProps>(
  ({ size = 'md', variant = 'default', className, children, ...props }, ref) => {
    const sizeClasses = SIZE_CLASSES[size];
    
    return (
      <div
        ref={ref}
        role="alert"
        aria-live="polite"
        className={cn(
          // Base error styles
          'leading-5 font-medium',
          
          // Size-based styling
          sizeClasses.error,
          
          // Error-specific colors
          'text-red-600 dark:text-red-400',
          
          // Animation for error appearance
          'animate-fade-in',
          
          // Accessibility improvements
          'break-words',
          
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FormError.displayName = 'FormError';

// =============================================================================
// MAIN FORM CONTROL COMPONENT
// =============================================================================

/**
 * Comprehensive form control wrapper component
 * 
 * Provides consistent layout, accessibility, and React Hook Form integration
 * for all form inputs in the DreamFactory Admin Interface.
 */
export const FormControl = forwardRef<
  HTMLDivElement,
  FormControlProps
>(
  <TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>(
    {
      // Core props
      name,
      label,
      control,
      rules,
      defaultValue,
      children,
      
      // Styling props
      variant = 'default',
      size = 'md',
      layout: layoutProp,
      className,
      
      // State props
      disabled = false,
      readonly = false,
      required = false,
      loading = false,
      hidden = false,
      
      // Content props
      helpText,
      description,
      placeholder,
      error: errorOverride,
      
      // Icon and addon props
      startIcon: StartIcon,
      endIcon: EndIcon,
      startAddon,
      endAddon,
      
      // Accessibility props
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-labelledby': ariaLabelledBy,
      'aria-live': ariaLive = 'polite',
      
      // Event handlers
      onValueChange,
      onBlur: onBlurProp,
      onFocus: onFocusProp,
      onValidationChange,
      
      // Other props
      'data-testid': testId,
      ...containerProps
    }: FormControlProps<TFieldValues, TName>,
    ref: React.Ref<HTMLDivElement>
  ) => {
    // =============================================================================
    // HOOKS AND STATE
    // =============================================================================
    
    // Get form context (optional, component can work standalone)
    const formContext = useFormContext<TFieldValues>();
    const controlToUse = control || formContext?.control;
    
    // Use React Hook Form controller for field registration
    const {
      field,
      fieldState: { invalid, isTouched, isDirty, error: fieldError },
      formState: { isSubmitting, isValidating }
    } = useController({
      name,
      control: controlToUse,
      rules: {
        ...rules,
        required: required ? (rules?.required || 'This field is required') : rules?.required,
      },
      defaultValue,
    });
    
    // Theme integration
    const { resolvedTheme } = useTheme();
    
    // Generate stable IDs for accessibility
    const fieldId = useId();
    const labelId = useId();
    const helpTextId = useId();
    const errorId = useId();
    
    // Merge layout configuration
    const layout = useMemo(() => ({
      ...DEFAULT_LAYOUT,
      ...layoutProp,
    }), [layoutProp]);
    
    // =============================================================================
    // COMPUTED VALUES
    // =============================================================================
    
    // Determine error state and message
    const hasError = invalid || !!errorOverride;
    const errorMessage = errorOverride || fieldError?.message;
    const hasHelpText = !!helpText || !!description;
    
    // Determine field state
    const fieldState: FormControlState = {
      isTouched,
      isDirty,
      isValidating,
      hasError,
      isLoading: loading || isSubmitting,
      isDisabled: disabled,
      isReadonly: readonly,
      isRequired: required,
    };
    
    // Size and variant classes
    const sizeClasses = SIZE_CLASSES[size];
    const variantClasses = VARIANT_CLASSES[variant];
    
    // Generate accessibility properties
    const accessibilityProps = generateAccessibilityProps(
      fieldId,
      helpTextId,
      errorId,
      {
        'aria-label': ariaLabel,
        'aria-describedby': ariaDescribedBy,
        'aria-labelledby': ariaLabelledBy,
        required,
        disabled,
        readonly,
      },
      hasError,
      hasHelpText
    );
    
    // =============================================================================
    // EVENT HANDLERS
    // =============================================================================
    
    const handleValueChange = (value: TFieldValues[TName]) => {
      field.onChange(value);
      onValueChange?.(value);
    };
    
    const handleBlur = () => {
      field.onBlur();
      onBlurProp?.();
    };
    
    const handleFocus = () => {
      onFocusProp?.();
    };
    
    // Effect for validation change callback
    React.useEffect(() => {
      onValidationChange?.(!hasError, errorMessage);
    }, [hasError, errorMessage, onValidationChange]);
    
    // =============================================================================
    // RENDER FIELD CONTENT
    // =============================================================================
    
    const renderFieldContent = () => {
      if (typeof children === 'function') {
        // Render function with field props
        return children({
          field: {
            name: field.name,
            value: field.value,
            onChange: handleValueChange,
            onBlur: handleBlur,
            ref: field.ref,
          },
          fieldState: {
            invalid,
            isTouched,
            isDirty,
            error: fieldError,
          },
          formState: {
            isSubmitting,
            isValidating,
          },
        });
      } else if (isValidElement(children)) {
        // Clone element and inject field props
        return cloneElement(children, {
          id: fieldId,
          name: field.name,
          value: field.value,
          onChange: (e: any) => {
            const value = e?.target?.value ?? e;
            handleValueChange(value);
            // Call original onChange if it exists
            (children.props as any)?.onChange?.(e);
          },
          onBlur: (e: any) => {
            handleBlur();
            // Call original onBlur if it exists
            (children.props as any)?.onBlur?.(e);
          },
          onFocus: (e: any) => {
            handleFocus();
            // Call original onFocus if it exists
            (children.props as any)?.onFocus?.(e);
          },
          ref: field.ref,
          placeholder,
          disabled: disabled || isSubmitting,
          readOnly: readonly,
          'aria-invalid': hasError,
          ...accessibilityProps,
          className: cn(
            // Merge existing classes with focus ring
            (children.props as any)?.className,
            FOCUS_RING_CLASSES,
            {
              'opacity-50 cursor-not-allowed': disabled,
              'bg-gray-50 dark:bg-gray-800': readonly,
            }
          ),
        });
      }
      
      return children;
    };
    
    // =============================================================================
    // CONDITIONAL RENDERING
    // =============================================================================
    
    // Hide field if specified
    if (hidden) {
      return null;
    }
    
    // =============================================================================
    // LAYOUT RENDERING
    // =============================================================================
    
    // Inline layout
    if (layout.labelPosition === 'inline' || variant === 'inline') {
      return (
        <div
          ref={ref}
          className={cn(
            'flex items-start',
            sizeClasses.spacing,
            variantClasses.wrapper,
            {
              'opacity-50': disabled,
              'pointer-events-none': disabled,
            },
            className
          )}
          data-testid={testId}
          {...containerProps}
        >
          {/* Inline label */}
          <FormLabel
            htmlFor={fieldId}
            required={required}
            disabled={disabled}
            size={size}
            variant={variant}
            position="inline"
            className={cn(
              'mt-0.5 flex-shrink-0',
              layout.labelWidth !== 'auto' && `w-[${layout.labelWidth}]`
            )}
            style={{
              width: layout.labelWidth !== 'auto' ? layout.labelWidth : undefined,
            }}
          >
            {StartIcon && <StartIcon className="mr-2 h-4 w-4" />}
            {label}
            {EndIcon && <EndIcon className="ml-2 h-4 w-4" />}
          </FormLabel>
          
          {/* Field container */}
          <div className={cn('flex-1 min-w-0', variantClasses.field)}>
            {startAddon && (
              <div className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                {startAddon}
              </div>
            )}
            
            {/* Field content */}
            {renderFieldContent()}
            
            {endAddon && (
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {endAddon}
              </div>
            )}
            
            {/* Help text */}
            {hasHelpText && (
              <FormHelpText
                id={helpTextId}
                size={size}
                variant={variant}
                className="mt-1"
              >
                {helpText || description}
              </FormHelpText>
            )}
            
            {/* Error message */}
            {hasError && errorMessage && (
              <FormError
                id={errorId}
                size={size}
                variant={variant}
                className="mt-1"
              >
                {errorMessage}
              </FormError>
            )}
          </div>
        </div>
      );
    }
    
    // Standard layout (top, left, floating)
    return (
      <div
        ref={ref}
        className={cn(
          // Base wrapper styles
          'relative',
          
          // Size-based spacing
          sizeClasses.wrapper,
          
          // Variant-based styling
          variantClasses.wrapper,
          
          // Full width handling
          {
            'w-full': layout.fullWidth,
          },
          
          // State-based styling
          {
            'opacity-50': disabled,
            'pointer-events-none': disabled,
          },
          
          // Compact layout
          {
            'space-y-1': layout.compact,
          },
          
          className
        )}
        data-testid={testId}
        {...containerProps}
      >
        {/* Label */}
        {layout.labelPosition !== 'hidden' && (
          <FormLabel
            htmlFor={fieldId}
            required={required}
            disabled={disabled}
            size={size}
            variant={variant}
            position={layout.labelPosition}
            className={cn(
              variantClasses.label,
              {
                'mb-0': layout.labelPosition === 'floating',
              }
            )}
          >
            {StartIcon && <StartIcon className="mr-2 h-4 w-4 inline" />}
            {label}
            {EndIcon && <EndIcon className="ml-2 h-4 w-4 inline" />}
          </FormLabel>
        )}
        
        {/* Field container */}
        <div className={cn('relative', variantClasses.field)}>
          {startAddon && (
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              {startAddon}
            </div>
          )}
          
          {/* Field content */}
          {renderFieldContent()}
          
          {/* Loading indicator */}
          {(loading || isValidating) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-500" />
            </div>
          )}
          
          {endAddon && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {endAddon}
            </div>
          )}
        </div>
        
        {/* Help text */}
        {hasHelpText && layout.helpTextPosition === 'below' && (
          <FormHelpText
            id={helpTextId}
            size={size}
            variant={variant}
          >
            {helpText || description}
          </FormHelpText>
        )}
        
        {/* Error message */}
        {hasError && errorMessage && layout.errorPosition === 'below' && (
          <FormError
            id={errorId}
            size={size}
            variant={variant}
          >
            {errorMessage}
          </FormError>
        )}
      </div>
    );
  }
) as <TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>(
  props: FormControlProps<TFieldValues, TName> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement;

FormControl.displayName = 'FormControl';

// =============================================================================
// EXPORTS
// =============================================================================

export default FormControl;

export type {
  FormControlProps,
  FormControlLayout,
  FormControlVariant,
  FormControlSize,
  FormControlState,
  FormLabelProps,
  FormHelpTextProps,
  FormErrorProps,
};

export {
  FormLabel,
  FormHelpText,
  FormError,
};