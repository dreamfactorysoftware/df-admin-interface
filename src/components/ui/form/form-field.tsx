/**
 * Form Field Wrapper Component for DreamFactory Admin Interface
 * 
 * A comprehensive form field wrapper that provides consistent layout, labeling, error display,
 * and accessibility features for all form inputs. Automatically integrates with React Hook Form
 * field state, displays validation errors, and maintains WCAG 2.1 AA compliance with proper
 * ARIA associations between labels, inputs, and error messages.
 * 
 * Key Features:
 * - React Hook Form integration with automatic field state management and validation display
 * - WCAG 2.1 AA accessibility compliance with proper ARIA associations between labels, inputs, and errors
 * - Consistent styling using Tailwind CSS 4.1+ utility classes with design tokens
 * - Error state display with 4.5:1 contrast ratio for accessibility compliance
 * - Responsive layout support for different screen sizes and form layouts
 * - Optional and required field indicator support with clear visual distinction
 * - Dark theme support via Zustand theme store integration
 * - Support for conditional field rendering and progressive disclosure
 * 
 * Replaces Angular mat-form-field patterns with modern React implementation.
 * 
 * @fileoverview React Form Field wrapper component for consistent form layouts
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

'use client';

import React, { 
  forwardRef, 
  useId, 
  useMemo, 
  type ReactNode, 
  type ReactElement,
  type HTMLAttributes,
  type RefObject,
} from 'react';
import { 
  useController, 
  type Control, 
  type FieldPath, 
  type FieldValues, 
  type FieldError,
  type ControllerProps,
  type ControllerRenderProps,
  type ControllerFieldState,
} from 'react-hook-form';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { FormLabel, type FormLabelProps, useFormLabelId } from './form-label';
import { FormError, type FormErrorProps, getFormErrorId, getFormErrorAriaDescribedBy } from './form-error';
import type { 
  FormFieldProps as BaseFormFieldProps,
  FormFieldType,
  FormFieldVariant,
  FormFieldCondition,
  FormFieldLayout,
  ZodFieldValidation,
  AsyncValidationFunction,
  FormFieldValidationResult,
  ResponsiveValue,
  ComponentSize,
  ComponentVariant,
  BaseComponent,
} from './form.types';

// ============================================================================
// FORM FIELD VARIANTS AND STYLING
// ============================================================================

/**
 * Form field wrapper variant definitions using class-variance-authority
 * Provides consistent layout and styling patterns for all form fields
 */
const formFieldVariants = cva(
  // Base styles for form field wrapper
  [
    'space-y-2 transition-all duration-200 ease-out',
    // Focus management for accessibility
    'focus-within:ring-1 focus-within:ring-primary-500 focus-within:ring-offset-1',
    'dark:focus-within:ring-primary-400',
  ],
  {
    variants: {
      /**
       * Size variants affecting spacing and component dimensions
       */
      size: {
        xs: 'space-y-1',
        sm: 'space-y-1.5',
        md: 'space-y-2',
        lg: 'space-y-3',
        xl: 'space-y-4',
      },
      
      /**
       * Layout variants for different form field arrangements
       */
      layout: {
        default: 'block',
        inline: 'flex flex-col sm:flex-row sm:items-start sm:gap-4',
        floating: 'relative',
        minimal: 'space-y-1',
        compact: 'space-y-1',
      },
      
      /**
       * State variants for validation and interaction states
       */
      state: {
        default: '',
        error: 'ring-1 ring-red-300 dark:ring-red-600 bg-red-50/50 dark:bg-red-900/10',
        success: 'ring-1 ring-green-300 dark:ring-green-600 bg-green-50/50 dark:bg-green-900/10',
        warning: 'ring-1 ring-yellow-300 dark:ring-yellow-600 bg-yellow-50/50 dark:bg-yellow-900/10',
        disabled: 'opacity-60 cursor-not-allowed',
        loading: 'opacity-75',
      },
      
      /**
       * Width variants for responsive field sizing
       */
      width: {
        auto: 'w-auto',
        full: 'w-full',
        xs: 'w-20',
        sm: 'w-32',
        md: 'w-48',
        lg: 'w-64',
        xl: 'w-80',
        '2xl': 'w-96',
      },
      
      /**
       * Spacing variants for different form densities
       */
      spacing: {
        none: 'space-y-0',
        tight: 'space-y-1',
        normal: 'space-y-2',
        relaxed: 'space-y-3',
        loose: 'space-y-4',
      },
    },
    
    /**
     * Compound variants for complex styling combinations
     */
    compoundVariants: [
      // Inline layout with smaller spacing
      {
        layout: 'inline',
        size: 'sm',
        className: 'sm:gap-3',
      },
      // Error state with enhanced visibility
      {
        state: 'error',
        layout: 'default',
        className: 'rounded-md p-3 border border-red-200 dark:border-red-700',
      },
      // Floating layout needs different focus styles
      {
        layout: 'floating',
        className: 'focus-within:ring-0', // Disable wrapper focus ring for floating fields
      },
    ],
    
    /**
     * Default variant values
     */
    defaultVariants: {
      size: 'md',
      layout: 'default',
      state: 'default',
      width: 'full',
      spacing: 'normal',
    },
  }
);

// ============================================================================
// ENHANCED FORM FIELD INTERFACES
// ============================================================================

/**
 * Enhanced form field props with comprehensive React Hook Form integration
 */
export interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<BaseFormFieldProps<TFieldValues, TName>, 'children'>,
          BaseComponent,
          VariantProps<typeof formFieldVariants> {
  
  // ========================================================================
  // CORE FIELD CONFIGURATION
  // ========================================================================
  
  /**
   * Field name for React Hook Form registration
   * Must be a valid field path within the form values
   */
  name: TName;
  
  /**
   * React Hook Form control instance
   * If not provided, component will attempt to use form context
   */
  control?: Control<TFieldValues>;
  
  /**
   * Field label text or component
   * Automatically associates with input via htmlFor
   */
  label?: ReactNode;
  
  /**
   * Field description or help text
   * Displayed below the label with proper ARIA association
   */
  description?: ReactNode;
  
  /**
   * Placeholder text for the input
   */
  placeholder?: string;
  
  /**
   * Whether the field is required
   * Automatically adds required indicator and validation
   */
  required?: boolean;
  
  /**
   * Whether the field is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether the field is readonly
   */
  readonly?: boolean;
  
  /**
   * Whether the field is hidden
   * Maintains accessibility while hiding visually
   */
  hidden?: boolean;
  
  // ========================================================================
  // CHILD COMPONENT INTEGRATION
  // ========================================================================
  
  /**
   * Child input component or render function
   * Receives field props for integration with React Hook Form
   */
  children: 
    | ReactElement
    | ((props: FormFieldChildProps<TFieldValues, TName>) => ReactElement);
  
  // ========================================================================
  // LAYOUT AND STYLING
  // ========================================================================
  
  /**
   * Form field layout configuration
   */
  fieldLayout?: FormFieldLayout;
  
  /**
   * Responsive width configuration
   */
  responsiveWidth?: ResponsiveValue<keyof typeof formFieldVariants.defaultVariants.width>;
  
  /**
   * Grid column span for grid layouts
   */
  gridColumn?: ResponsiveValue<string>;
  
  /**
   * Custom CSS classes for the wrapper
   */
  wrapperClassName?: string;
  
  /**
   * Custom CSS classes for the input container
   */
  inputClassName?: string;
  
  // ========================================================================
  // VALIDATION AND ERROR HANDLING
  // ========================================================================
  
  /**
   * Zod schema validation configuration
   */
  zodValidation?: ZodFieldValidation<TFieldValues[TName]>;
  
  /**
   * Async validation function
   */
  asyncValidation?: AsyncValidationFunction<TFieldValues[TName]>;
  
  /**
   * Custom error message override
   */
  errorMessage?: string | ((error: FieldError) => string);
  
  /**
   * Whether to show validation errors
   */
  showError?: boolean;
  
  /**
   * Error display configuration
   */
  errorConfig?: Partial<FormErrorProps>;
  
  // ========================================================================
  // CONDITIONAL RENDERING
  // ========================================================================
  
  /**
   * Conditional logic for field visibility/behavior
   */
  condition?: FormFieldCondition<TFieldValues>;
  
  /**
   * Field dependencies for reactive updates
   */
  dependencies?: (keyof TFieldValues)[];
  
  // ========================================================================
  // ACCESSIBILITY CONFIGURATION
  // ========================================================================
  
  /**
   * Custom ARIA label
   * Overrides automatic label association
   */
  'aria-label'?: string;
  
  /**
   * Additional ARIA described by IDs
   * Automatically includes label, description, and error IDs
   */
  'aria-describedby'?: string;
  
  /**
   * ARIA labelledby IDs
   * For complex labeling scenarios
   */
  'aria-labelledby'?: string;
  
  /**
   * Whether the field should be announced by screen readers
   */
  'aria-live'?: 'off' | 'polite' | 'assertive';
  
  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================
  
  /**
   * Callback when field value changes
   */
  onValueChange?: (value: TFieldValues[TName]) => void;
  
  /**
   * Callback when field validation state changes
   */
  onValidationChange?: (result: FormFieldValidationResult) => void;
  
  /**
   * Callback when field receives focus
   */
  onFocus?: (event: React.FocusEvent) => void;
  
  /**
   * Callback when field loses focus
   */
  onBlur?: (event: React.FocusEvent) => void;
  
  // ========================================================================
  // ADVANCED CONFIGURATION
  // ========================================================================
  
  /**
   * Custom field ID override
   * Generated automatically if not provided
   */
  fieldId?: string;
  
  /**
   * Whether to register the field with React Hook Form
   * Useful for display-only fields
   */
  registerField?: boolean;
  
  /**
   * Custom validation debounce delay in milliseconds
   */
  validationDelay?: number;
  
  /**
   * Whether to validate field on mount
   */
  validateOnMount?: boolean;
}

/**
 * Props passed to child input components
 */
export interface FormFieldChildProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  // React Hook Form integration
  field: ControllerRenderProps<TFieldValues, TName>;
  fieldState: ControllerFieldState;
  formState: any; // FormState from React Hook Form
  
  // Generated IDs for accessibility
  id: string;
  name: TName;
  
  // ARIA attributes
  'aria-describedby': string;
  'aria-labelledby'?: string;
  'aria-invalid': boolean;
  'aria-required'?: boolean;
  
  // State information
  hasError: boolean;
  isRequired: boolean;
  isDisabled: boolean;
  isReadonly: boolean;
  
  // Styling classes
  className?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Evaluate conditional logic for field visibility/behavior
 */
function evaluateCondition<TFieldValues extends FieldValues>(
  condition: FormFieldCondition<TFieldValues>,
  formValues: TFieldValues
): boolean {
  const { when, operator, value, and, or } = condition;
  
  // Get the value of the field we're checking against
  const fieldValue = formValues[when];
  
  // Evaluate the primary condition
  let result = false;
  switch (operator) {
    case 'equals':
      result = fieldValue === value;
      break;
    case 'notEquals':
      result = fieldValue !== value;
      break;
    case 'contains':
      result = String(fieldValue).includes(String(value));
      break;
    case 'notContains':
      result = !String(fieldValue).includes(String(value));
      break;
    case 'startsWith':
      result = String(fieldValue).startsWith(String(value));
      break;
    case 'endsWith':
      result = String(fieldValue).endsWith(String(value));
      break;
    case 'greaterThan':
      result = Number(fieldValue) > Number(value);
      break;
    case 'lessThan':
      result = Number(fieldValue) < Number(value);
      break;
    case 'greaterThanOrEqual':
      result = Number(fieldValue) >= Number(value);
      break;
    case 'lessThanOrEqual':
      result = Number(fieldValue) <= Number(value);
      break;
    case 'isEmpty':
      result = !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0) || String(fieldValue).trim() === '';
      break;
    case 'isNotEmpty':
      result = !!fieldValue && (!Array.isArray(fieldValue) || fieldValue.length > 0) && String(fieldValue).trim() !== '';
      break;
    case 'isNull':
      result = fieldValue === null || fieldValue === undefined;
      break;
    case 'isNotNull':
      result = fieldValue !== null && fieldValue !== undefined;
      break;
    case 'isTrue':
      result = fieldValue === true;
      break;
    case 'isFalse':
      result = fieldValue === false;
      break;
    case 'matches':
      result = new RegExp(String(value)).test(String(fieldValue));
      break;
    case 'in':
      result = Array.isArray(value) && value.includes(fieldValue);
      break;
    case 'notIn':
      result = Array.isArray(value) && !value.includes(fieldValue);
      break;
    default:
      result = false;
  }
  
  // Handle compound conditions
  if (and && and.length > 0) {
    result = result && and.every(subCondition => evaluateCondition(subCondition, formValues));
  }
  
  if (or && or.length > 0) {
    result = result || or.some(subCondition => evaluateCondition(subCondition, formValues));
  }
  
  return result;
}

/**
 * Generate responsive width classes
 */
function getResponsiveWidthClasses(
  responsiveWidth?: ResponsiveValue<keyof typeof formFieldVariants.defaultVariants.width>
): string {
  if (!responsiveWidth) return '';
  
  if (typeof responsiveWidth === 'string') {
    return formFieldVariants({ width: responsiveWidth as any });
  }
  
  const classes: string[] = [];
  Object.entries(responsiveWidth).forEach(([breakpoint, width]) => {
    const prefix = breakpoint === 'base' ? '' : `${breakpoint}:`;
    classes.push(`${prefix}${formFieldVariants({ width: width as any })}`);
  });
  
  return classes.join(' ');
}

// ============================================================================
// MAIN FORM FIELD COMPONENT
// ============================================================================

/**
 * FormField component providing comprehensive form field wrapper functionality
 * 
 * @example
 * ```tsx
 * // Basic usage with text input
 * <FormField
 *   name="email"
 *   label="Email Address"
 *   control={control}
 *   required
 * >
 *   <input
 *     type="email"
 *     placeholder="Enter your email"
 *     className="w-full px-3 py-2 border rounded-md"
 *   />
 * </FormField>
 * 
 * // Advanced usage with conditional rendering
 * <FormField
 *   name="databaseType"
 *   label="Database Type"
 *   control={control}
 *   condition={{
 *     when: 'hasDatabase',
 *     operator: 'equals',
 *     value: true
 *   }}
 *   onValueChange={(value) => console.log('Database type changed:', value)}
 * >
 *   {({ field, hasError, isRequired }) => (
 *     <select
 *       {...field}
 *       className={cn(
 *         "w-full px-3 py-2 border rounded-md",
 *         hasError && "border-red-500",
 *         isRequired && "border-l-4 border-l-blue-500"
 *       )}
 *     >
 *       <option value="">Select a database type</option>
 *       <option value="mysql">MySQL</option>
 *       <option value="postgresql">PostgreSQL</option>
 *     </select>
 *   )}
 * </FormField>
 * 
 * // With custom error handling
 * <FormField
 *   name="connectionString"
 *   label="Connection String"
 *   control={control}
 *   asyncValidation={async (value) => {
 *     const result = await testConnection(value);
 *     return result.success || "Connection failed";
 *   }}
 *   errorConfig={{
 *     showIcon: true,
 *     variant: "error"
 *   }}
 * >
 *   <textarea
 *     placeholder="Enter database connection string"
 *     className="w-full px-3 py-2 border rounded-md resize-vertical"
 *     rows={3}
 *   />
 * </FormField>
 * ```
 */
export const FormField = forwardRef<
  HTMLDivElement,
  FormFieldProps<any, any>
>(
  <TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>(
    {
      // Core props
      name,
      control,
      label,
      description,
      placeholder,
      required = false,
      disabled = false,
      readonly = false,
      hidden = false,
      children,
      
      // Layout and styling
      size,
      layout,
      state,
      width,
      spacing,
      fieldLayout,
      responsiveWidth,
      gridColumn,
      wrapperClassName,
      inputClassName,
      className,
      
      // Validation
      rules,
      zodValidation,
      asyncValidation,
      errorMessage,
      showError = true,
      errorConfig,
      
      // Conditional rendering
      condition,
      dependencies,
      
      // Accessibility
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-labelledby': ariaLabelledBy,
      'aria-live': ariaLive,
      
      // Event handlers
      onValueChange,
      onValidationChange,
      onFocus,
      onBlur,
      
      // Advanced configuration
      fieldId: providedFieldId,
      registerField = true,
      validationDelay = 300,
      validateOnMount = false,
      
      // Base component props
      id,
      'data-testid': testId,
      ...props
    }: FormFieldProps<TFieldValues, TName>,
    ref: React.Ref<HTMLDivElement>
  ) => {
    // ========================================================================
    // HOOKS AND STATE
    // ========================================================================
    
    const { resolvedTheme } = useTheme();
    const generatedId = useId();
    const fieldId = providedFieldId || `field-${generatedId}`;
    
    // Generate consistent IDs for accessibility
    const { labelId, controlId, descriptionId, errorId, getLabelProps, getControlProps } = useFormLabelId(fieldId);
    
    // React Hook Form controller integration
    const controller = useController({
      name,
      control,
      rules: {
        required: required ? 'This field is required' : false,
        ...rules,
      },
      defaultValue: undefined,
    });
    
    const { field, fieldState, formState } = controller;
    
    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================
    
    // Field state computations
    const hasError = !!fieldState.error;
    const isDirty = fieldState.isDirty;
    const isTouched = fieldState.isTouched;
    const isInvalid = fieldState.invalid;
    const isValidating = fieldState.isValidating;
    
    // Determine effective state
    const effectiveState = useMemo(() => {
      if (disabled) return 'disabled';
      if (isValidating) return 'loading';
      if (hasError) return 'error';
      return state || 'default';
    }, [disabled, isValidating, hasError, state]);
    
    // Build ARIA attributes
    const ariaDescribedByList = useMemo(() => [
      descriptionId,
      hasError ? errorId : undefined,
      ariaDescribedBy,
    ].filter(Boolean).join(' '), [descriptionId, hasError, errorId, ariaDescribedBy]);
    
    // ========================================================================
    // CONDITIONAL RENDERING LOGIC
    // ========================================================================
    
    // Check if field should be visible based on conditions
    const isVisible = useMemo(() => {
      if (!condition) return !hidden;
      
      try {
        const shouldShow = evaluateCondition(condition, formState.values || {});
        return shouldShow && !hidden;
      } catch (error) {
        console.warn(`Error evaluating condition for field ${name}:`, error);
        return !hidden;
      }
    }, [condition, formState.values, hidden, name]);
    
    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================
    
    const handleValueChange = React.useCallback((value: TFieldValues[TName]) => {
      field.onChange(value);
      onValueChange?.(value);
    }, [field.onChange, onValueChange]);
    
    const handleBlur = React.useCallback((event: React.FocusEvent) => {
      field.onBlur();
      onBlur?.(event);
    }, [field.onBlur, onBlur]);
    
    const handleFocus = React.useCallback((event: React.FocusEvent) => {
      onFocus?.(event);
    }, [onFocus]);
    
    // ========================================================================
    // CHILD COMPONENT PROPS
    // ========================================================================
    
    const childProps: FormFieldChildProps<TFieldValues, TName> = useMemo(() => ({
      field: {
        ...field,
        onChange: handleValueChange,
        onBlur: handleBlur,
      },
      fieldState,
      formState,
      
      // Generated IDs
      id: controlId,
      name,
      
      // ARIA attributes
      'aria-describedby': ariaDescribedByList,
      'aria-labelledby': ariaLabelledBy || labelId,
      'aria-invalid': hasError,
      'aria-required': required || undefined,
      
      // State information
      hasError,
      isRequired: required,
      isDisabled: disabled,
      isReadonly: readonly,
      
      // Styling
      className: inputClassName,
    }), [
      field,
      fieldState,
      formState,
      controlId,
      name,
      ariaDescribedByList,
      ariaLabelledBy,
      labelId,
      hasError,
      required,
      disabled,
      readonly,
      inputClassName,
      handleValueChange,
      handleBlur,
    ]);
    
    // ========================================================================
    // STYLING CLASSES
    // ========================================================================
    
    const wrapperClasses = cn(
      formFieldVariants({
        size,
        layout,
        state: effectiveState,
        width,
        spacing,
      }),
      getResponsiveWidthClasses(responsiveWidth),
      gridColumn && `col-span-${gridColumn}`,
      wrapperClassName,
      className
    );
    
    // ========================================================================
    // RENDER GUARDS
    // ========================================================================
    
    // Don't render if conditionally hidden
    if (!isVisible) {
      return null;
    }
    
    // ========================================================================
    // RENDER COMPONENT
    // ========================================================================
    
    return (
      <div
        ref={ref}
        id={id || fieldId}
        className={wrapperClasses}
        data-testid={testId || `form-field-${name}`}
        data-field-name={name}
        data-field-state={effectiveState}
        role={ariaLive ? 'status' : undefined}
        aria-live={ariaLive}
        onFocus={handleFocus}
        {...props}
      >
        {/* Field Label */}
        {label && (
          <FormLabel
            {...getLabelProps({
              required,
              description: typeof description === 'string' ? description : undefined,
              size: size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : size === 'xl' ? 'xl' : 'md',
              variant: layout === 'floating' ? 'floating' : 'default',
              state: effectiveState === 'error' ? 'error' : effectiveState === 'disabled' ? 'disabled' : 'default',
            })}
            data-testid={`${testId || `form-field-${name}`}-label`}
          >
            {label}
          </FormLabel>
        )}
        
        {/* Field Description */}
        {description && typeof description !== 'string' && (
          <div
            id={descriptionId}
            className={cn(
              'text-sm text-gray-600 dark:text-gray-400',
              size === 'xs' && 'text-xs',
              size === 'lg' && 'text-base',
              size === 'xl' && 'text-lg'
            )}
            data-testid={`${testId || `form-field-${name}`}-description`}
          >
            {description}
          </div>
        )}
        
        {/* Field Input Container */}
        <div className="relative">
          {/* Child Input Component */}
          {typeof children === 'function' ? (
            children(childProps)
          ) : (
            React.cloneElement(children, {
              ...childProps,
              ...children.props,
              id: childProps.id,
              name: childProps.name,
              'aria-describedby': childProps['aria-describedby'],
              'aria-labelledby': childProps['aria-labelledby'],
              'aria-invalid': childProps['aria-invalid'],
              'aria-required': childProps['aria-required'],
              className: cn(children.props.className, childProps.className),
              disabled: disabled || children.props.disabled,
              readOnly: readonly || children.props.readOnly,
              placeholder: placeholder || children.props.placeholder,
              onChange: (e: any) => {
                const value = e.target ? e.target.value : e;
                handleValueChange(value);
                children.props.onChange?.(e);
              },
              onBlur: (e: any) => {
                handleBlur(e);
                children.props.onBlur?.(e);
              },
              onFocus: (e: any) => {
                handleFocus(e);
                children.props.onFocus?.(e);
              },
            })
          )}
          
          {/* Loading Indicator */}
          {isValidating && (
            <div 
              className="absolute right-2 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            >
              <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          )}
        </div>
        
        {/* Field Error Display */}
        {showError && hasError && (
          <FormError
            fieldName={name}
            error={fieldState.error}
            errorId={errorId}
            size={size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : size === 'xl' ? 'xl' : 'md'}
            variant={effectiveState === 'error' ? 'error' : 'primary'}
            data-testid={`${testId || `form-field-${name}`}-error`}
            {...errorConfig}
          />
        )}
      </div>
    );
  }
) as <TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>(
  props: FormFieldProps<TFieldValues, TName> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement;

FormField.displayName = 'FormField';

// ============================================================================
// UTILITY HOOKS AND FUNCTIONS
// ============================================================================

/**
 * Hook for form field state management and utilities
 */
export function useFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(
  name: TName,
  control?: Control<TFieldValues>
) {
  const controller = useController({ name, control });
  const { field, fieldState, formState } = controller;
  
  const fieldId = useId();
  const errorId = getFormErrorId(name);
  
  return {
    ...controller,
    fieldId,
    errorId,
    hasError: !!fieldState.error,
    isDirty: fieldState.isDirty,
    isTouched: fieldState.isTouched,
    isInvalid: fieldState.invalid,
    isValidating: fieldState.isValidating,
    ariaDescribedBy: getFormErrorAriaDescribedBy(name, !!fieldState.error),
  };
}

/**
 * Hook for conditional field rendering
 */
export function useConditionalField<TFieldValues extends FieldValues>(
  condition: FormFieldCondition<TFieldValues>,
  formValues: TFieldValues
): boolean {
  return useMemo(() => {
    try {
      return evaluateCondition(condition, formValues);
    } catch (error) {
      console.warn('Error evaluating field condition:', error);
      return true; // Default to visible on error
    }
  }, [condition, formValues]);
}

/**
 * Utility function to create form field groups with consistent styling
 */
export function createFormFieldGroup(options: {
  title?: string;
  description?: string;
  spacing?: ComponentSize;
  layout?: 'default' | 'grid' | 'inline';
  columns?: number;
}) {
  const { title, description, spacing = 'md', layout = 'default', columns = 1 } = options;
  
  const groupClasses = cn(
    'space-y-4',
    spacing === 'xs' && 'space-y-1',
    spacing === 'sm' && 'space-y-2',
    spacing === 'lg' && 'space-y-6',
    spacing === 'xl' && 'space-y-8',
    layout === 'grid' && `grid grid-cols-${columns} gap-4`,
    layout === 'inline' && 'flex flex-wrap gap-4'
  );
  
  return {
    groupProps: {
      className: groupClasses,
      role: 'group',
      'aria-labelledby': title ? 'group-title' : undefined,
    },
    titleProps: title ? {
      id: 'group-title',
      className: 'text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2',
    } : undefined,
    descriptionProps: description ? {
      className: 'text-sm text-gray-600 dark:text-gray-400 mb-4',
    } : undefined,
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  FormFieldProps,
  FormFieldChildProps,
  FormFieldCondition,
  FormFieldValidationResult,
};

export { formFieldVariants };

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default form field configuration for database service forms
 */
export const DATABASE_FORM_FIELD_CONFIG: Partial<FormFieldProps> = {
  size: 'md',
  layout: 'default',
  width: 'full',
  spacing: 'normal',
  showError: true,
  registerField: true,
  validateOnMount: false,
  validationDelay: 300,
};

/**
 * Default form field configuration for API generation forms
 */
export const API_FORM_FIELD_CONFIG: Partial<FormFieldProps> = {
  size: 'sm',
  layout: 'default',
  width: 'full',
  spacing: 'tight',
  showError: true,
  registerField: true,
  validateOnMount: true,
  validationDelay: 150,
};

/**
 * Accessible field configurations meeting WCAG 2.1 AA standards
 */
export const ACCESSIBLE_FIELD_CONFIG = {
  colors: {
    error: 'text-red-700 dark:text-red-400 border-red-500 dark:border-red-400',
    success: 'text-green-700 dark:text-green-400 border-green-500 dark:border-green-400',
    warning: 'text-yellow-800 dark:text-yellow-300 border-yellow-500 dark:border-yellow-400',
  },
  focusRing: 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-primary-400',
  spacing: {
    compact: 'space-y-1',
    normal: 'space-y-2',
    relaxed: 'space-y-3',
  },
} as const;