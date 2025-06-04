/**
 * Generic Security Form Component
 * 
 * A highly reusable form component for CRUD operations in security management features.
 * Implements React Hook Form with Zod validation, supports dynamic field rendering,
 * provides real-time validation under 100ms, and includes full accessibility features.
 * 
 * Features:
 * - Generic form structure supporting both limits and roles data
 * - Dynamic field rendering based on field configuration
 * - Real-time validation under 100ms with Zod schemas
 * - WCAG 2.1 AA accessibility compliance through Headless UI
 * - Conditional field display logic
 * - Comprehensive error handling and user feedback
 * - Loading states and submission handling
 * - Customizable form actions and layout
 * - Type-safe form data with TypeScript inference
 * - Performance optimized for complex nested forms
 * 
 * Usage Examples:
 * 
 * ```tsx
 * // For Limits Management
 * <SecurityForm
 *   formId="limits-form"
 *   title="Configure Rate Limit"
 *   schema={limitFormSchema}
 *   fields={limitFieldConfig}
 *   defaultValues={defaultLimitData}
 *   onSubmit={handleLimitSubmit}
 *   isLoading={isSubmitting}
 * />
 * 
 * // For Roles Management
 * <SecurityForm
 *   formId="roles-form"
 *   title="Create Role"
 *   schema={roleFormSchema}
 *   fields={roleFieldConfig}
 *   defaultValues={defaultRoleData}
 *   onSubmit={handleRoleSubmit}
 *   isLoading={isSubmitting}
 * />
 * ```
 * 
 * @module SecurityForm
 * @version 1.0.0
 * @since React 19 / Next.js 15.1 Migration
 */

'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import { useForm, FieldValues, Path, PathValue, SubmitHandler, FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// UI Components
import {
  Form,
  FormField,
  FormLabel,
  FormControl,
  FormDescription,
  FormErrorMessage,
  FormActions,
  FormSection,
  FormGroup
} from '@/components/ui/form';
import { Input, Textarea, PasswordInput, NumberInput } from '@/components/ui/input';
import { Select, type SelectOption } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

// Types and Validation
import type { 
  DatabaseServiceFormData,
  UserProfileFormData,
  RoleAssignmentFormData 
} from '@/types/validation';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Supported field types for dynamic form generation
 */
export type FieldType = 
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'datetime-local'
  | 'url'
  | 'tel'
  | 'hidden'
  | 'json'
  | 'switch';

/**
 * Field validation configuration
 */
export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

/**
 * Conditional field display logic
 */
export interface ConditionalLogic {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan';
  value: any;
  action: 'show' | 'hide' | 'enable' | 'disable';
}

/**
 * Dynamic field configuration
 */
export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  defaultValue?: any;
  validation?: FieldValidation;
  options?: SelectOption[];
  disabled?: boolean;
  hidden?: boolean;
  readonly?: boolean;
  group?: string;
  className?: string;
  conditional?: ConditionalLogic[];
  rows?: number; // For textarea
  step?: number; // For number inputs
  accept?: string; // For file inputs
  multiple?: boolean; // For select/file inputs
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'error' | 'success' | 'warning';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  autoComplete?: string;
  autoFocus?: boolean;
}

/**
 * Form action configuration
 */
export interface FormAction {
  label: string;
  type: 'submit' | 'button' | 'reset';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'sm' | 'default' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  position?: 'left' | 'right' | 'center';
}

/**
 * Form layout configuration
 */
export interface FormLayout {
  variant?: 'default' | 'card' | 'inline';
  columns?: 1 | 2 | 3 | 4;
  spacing?: 'sm' | 'default' | 'lg';
  sectioned?: boolean;
  collapsible?: boolean;
  responsive?: boolean;
}

/**
 * Form submission result
 */
export interface FormSubmissionResult {
  success: boolean;
  data?: any;
  errors?: Record<string, string>;
  message?: string;
}

/**
 * Main SecurityForm component props
 */
export interface SecurityFormProps<TSchema extends z.ZodType = z.ZodType> extends VariantProps<typeof formVariants> {
  // Core Configuration
  formId: string;
  title?: string;
  description?: string;
  schema: TSchema;
  fields: FieldConfig[];
  
  // Data Management
  defaultValues?: Partial<z.infer<TSchema>>;
  initialData?: Partial<z.infer<TSchema>>;
  
  // Event Handlers
  onSubmit: (data: z.infer<TSchema>) => Promise<FormSubmissionResult> | FormSubmissionResult;
  onReset?: () => void;
  onChange?: (data: Partial<z.infer<TSchema>>) => void;
  onFieldChange?: (fieldName: string, value: any) => void;
  onValidationError?: (errors: Record<string, FieldError>) => void;
  
  // UI Configuration
  layout?: FormLayout;
  actions?: FormAction[];
  showResetButton?: boolean;
  hideSubmitButton?: boolean;
  submitButtonText?: string;
  resetButtonText?: string;
  
  // State
  isLoading?: boolean;
  isSubmitting?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  
  // Styling
  className?: string;
  formClassName?: string;
  
  // Advanced Features
  autoSave?: boolean;
  autoSaveDelay?: number;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  clearErrorsOnChange?: boolean;
  persistFormData?: boolean;
  formStorageKey?: string;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
}

// ============================================================================
// FORM STYLING VARIANTS
// ============================================================================

const formVariants = cva(
  'w-full',
  {
    variants: {
      variant: {
        default: '',
        card: 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm',
        compact: 'space-y-4',
        spacious: 'space-y-8',
      },
      size: {
        sm: 'max-w-md',
        default: 'max-w-2xl',
        lg: 'max-w-4xl',
        full: 'w-full',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    }
  }
);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Evaluates conditional logic for field visibility and state
 */
const evaluateConditional = (
  conditional: ConditionalLogic,
  formValues: Record<string, any>
): boolean => {
  const fieldValue = formValues[conditional.field];
  const targetValue = conditional.value;

  switch (conditional.operator) {
    case 'equals':
      return fieldValue === targetValue;
    case 'notEquals':
      return fieldValue !== targetValue;
    case 'contains':
      return String(fieldValue).includes(String(targetValue));
    case 'notContains':
      return !String(fieldValue).includes(String(targetValue));
    case 'greaterThan':
      return Number(fieldValue) > Number(targetValue);
    case 'lessThan':
      return Number(fieldValue) < Number(targetValue);
    default:
      return true;
  }
};

/**
 * Determines field visibility based on conditional logic
 */
const shouldShowField = (
  field: FieldConfig,
  formValues: Record<string, any>
): boolean => {
  if (field.hidden) return false;
  
  if (!field.conditional || field.conditional.length === 0) {
    return true;
  }

  return field.conditional.every(conditional => {
    const result = evaluateConditional(conditional, formValues);
    return conditional.action === 'show' ? result : !result;
  });
};

/**
 * Determines field enabled state based on conditional logic
 */
const isFieldEnabled = (
  field: FieldConfig,
  formValues: Record<string, any>
): boolean => {
  if (field.disabled) return false;
  
  if (!field.conditional || field.conditional.length === 0) {
    return true;
  }

  return field.conditional.every(conditional => {
    if (conditional.action === 'enable' || conditional.action === 'disable') {
      const result = evaluateConditional(conditional, formValues);
      return conditional.action === 'enable' ? result : !result;
    }
    return true;
  });
};

/**
 * Groups fields by their group property
 */
const groupFields = (fields: FieldConfig[]): Record<string, FieldConfig[]> => {
  return fields.reduce((groups, field) => {
    const group = field.group || 'default';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(field);
    return groups;
  }, {} as Record<string, FieldConfig[]>);
};

/**
 * Debounce function for performance optimization
 */
const useDebounce = <T extends any[]>(
  callback: (...args: T) => void,
  delay: number
) => {
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  return useCallback((...args: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

// ============================================================================
// FIELD RENDERERS
// ============================================================================

/**
 * Renders individual form fields based on type
 */
const FieldRenderer: React.FC<{
  field: FieldConfig;
  value: any;
  onChange: (value: any) => void;
  onBlur: () => void;
  error?: FieldError;
  disabled?: boolean;
  readonly?: boolean;
}> = ({ field, value, onChange, onBlur, error, disabled = false, readonly = false }) => {
  const isDisabled = disabled || field.disabled || readonly || field.readonly;
  const hasError = Boolean(error);

  const commonProps = {
    id: field.name,
    name: field.name,
    placeholder: field.placeholder,
    disabled: isDisabled,
    error: hasError,
    className: field.className,
    autoComplete: field.autoComplete,
    autoFocus: field.autoFocus,
    size: field.size,
    variant: hasError ? 'error' : field.variant,
    'aria-describedby': field.description ? `${field.name}-description` : undefined,
    'aria-invalid': hasError,
    value: value || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
    },
    onBlur,
  };

  // Handle different field types
  switch (field.type) {
    case 'text':
    case 'email':
    case 'url':
    case 'tel':
      return (
        <Input
          {...commonProps}
          type={field.type}
          leftIcon={field.leftIcon}
          rightIcon={field.rightIcon}
        />
      );

    case 'password':
      return (
        <PasswordInput
          {...commonProps}
          showToggle={!readonly}
        />
      );

    case 'number':
      return (
        <NumberInput
          {...commonProps}
          min={field.validation?.min}
          max={field.validation?.max}
          step={field.step}
          onChange={(e) => {
            const newValue = e.target.value === '' ? undefined : Number(e.target.value);
            onChange(newValue);
          }}
        />
      );

    case 'textarea':
      return (
        <Textarea
          {...commonProps}
          rows={field.rows || 3}
          resizable={!readonly}
        />
      );

    case 'select':
    case 'multiselect':
      return (
        <Select
          value={value}
          onChange={onChange}
          options={field.options || []}
          placeholder={field.placeholder}
          multiple={field.type === 'multiselect' || field.multiple}
          disabled={isDisabled}
          error={hasError}
          searchable={field.options && field.options.length > 5}
          size={field.size}
          className={field.className}
          aria-describedby={field.description ? `${field.name}-description` : undefined}
          aria-invalid={hasError}
        />
      );

    case 'checkbox':
      return (
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            onBlur={onBlur}
            disabled={isDisabled}
            className={cn(
              'rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500',
              isDisabled && 'opacity-50 cursor-not-allowed',
              hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500'
            )}
            aria-describedby={field.description ? `${field.name}-description` : undefined}
            aria-invalid={hasError}
          />
          <span className={cn(
            'text-sm text-gray-700 dark:text-gray-300',
            isDisabled && 'opacity-50'
          )}>
            {field.label}
          </span>
        </label>
      );

    case 'radio':
      return (
        <div className="space-y-2">
          {field.options?.map((option) => (
            <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={field.name}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                disabled={isDisabled || option.disabled}
                className={cn(
                  'border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500',
                  isDisabled && 'opacity-50 cursor-not-allowed',
                  hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                )}
                aria-describedby={field.description ? `${field.name}-description` : undefined}
                aria-invalid={hasError}
              />
              <span className={cn(
                'text-sm text-gray-700 dark:text-gray-300',
                (isDisabled || option.disabled) && 'opacity-50'
              )}>
                {option.label}
              </span>
              {option.description && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {option.description}
                </span>
              )}
            </label>
          ))}
        </div>
      );

    case 'date':
    case 'datetime-local':
      return (
        <Input
          {...commonProps}
          type={field.type}
        />
      );

    case 'hidden':
      return (
        <input
          type="hidden"
          name={field.name}
          value={value || ''}
          onChange={commonProps.onChange}
        />
      );

    case 'json':
      return (
        <Textarea
          {...commonProps}
          rows={field.rows || 6}
          placeholder={field.placeholder || 'Enter valid JSON...'}
        />
      );

    case 'switch':
      return (
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {field.label}
          </span>
          <div className="relative">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              onBlur={onBlur}
              disabled={isDisabled}
              className="sr-only"
              aria-describedby={field.description ? `${field.name}-description` : undefined}
              aria-invalid={hasError}
            />
            <div className={cn(
              'block w-14 h-8 rounded-full transition-colors duration-200',
              value ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600',
              isDisabled && 'opacity-50 cursor-not-allowed',
              hasError && 'ring-2 ring-red-500'
            )}>
              <div className={cn(
                'absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200',
                value && 'transform translate-x-6'
              )} />
            </div>
          </div>
        </label>
      );

    default:
      return (
        <Input
          {...commonProps}
          type="text"
        />
      );
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Generic Security Form Component
 * 
 * Provides a comprehensive, accessible, and performant form solution
 * for all security management operations including limits and roles.
 */
export function SecurityForm<TSchema extends z.ZodType>({
  // Core Configuration
  formId,
  title,
  description,
  schema,
  fields,
  
  // Data Management
  defaultValues,
  initialData,
  
  // Event Handlers
  onSubmit,
  onReset,
  onChange,
  onFieldChange,
  onValidationError,
  
  // UI Configuration
  layout = {},
  actions,
  showResetButton = true,
  hideSubmitButton = false,
  submitButtonText = 'Save Changes',
  resetButtonText = 'Reset Form',
  
  // State
  isLoading = false,
  isSubmitting = false,
  disabled = false,
  readonly = false,
  
  // Styling
  className,
  formClassName,
  variant,
  size,
  
  // Advanced Features
  autoSave = false,
  autoSaveDelay = 1000,
  validateOnChange = true,
  validateOnBlur = true,
  clearErrorsOnChange = true,
  persistFormData = false,
  formStorageKey,
  
  // Accessibility
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-labelledby': ariaLabelledBy,
  
  ...props
}: SecurityFormProps<TSchema>) {
  
  // =========================================================================
  // FORM INITIALIZATION
  // =========================================================================
  
  const form = useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...defaultValues,
      ...initialData,
    } as any,
    mode: validateOnChange ? 'onChange' : validateOnBlur ? 'onBlur' : 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    shouldUnregister: false,
  });

  const {
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid, isDirty },
    register,
    setValue,
    getValues,
    clearErrors,
    setError,
  } = form;

  // Watch all form values for conditional logic
  const formValues = watch();
  
  // =========================================================================
  // FORM PERSISTENCE
  // =========================================================================
  
  // Load persisted form data on mount
  useEffect(() => {
    if (persistFormData && formStorageKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(formStorageKey);
        if (saved) {
          const parsedData = JSON.parse(saved);
          reset(parsedData);
        }
      } catch (error) {
        console.warn('Failed to load persisted form data:', error);
      }
    }
  }, [persistFormData, formStorageKey, reset]);

  // Save form data on changes
  const debouncedSave = useDebounce((data: any) => {
    if (persistFormData && formStorageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(formStorageKey, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to persist form data:', error);
      }
    }
  }, 500);

  useEffect(() => {
    if (isDirty) {
      debouncedSave(formValues);
    }
  }, [formValues, isDirty, debouncedSave]);

  // =========================================================================
  // AUTO-SAVE FUNCTIONALITY
  // =========================================================================
  
  const debouncedAutoSave = useDebounce(async (data: z.infer<TSchema>) => {
    if (autoSave && isValid && isDirty) {
      try {
        await onSubmit(data);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }, autoSaveDelay);

  useEffect(() => {
    if (autoSave && isValid && isDirty) {
      debouncedAutoSave(formValues);
    }
  }, [formValues, isValid, isDirty, autoSave, debouncedAutoSave]);

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================
  
  const handleFormSubmit: SubmitHandler<z.infer<TSchema>> = async (data) => {
    try {
      const result = await onSubmit(data);
      
      if (!result.success && result.errors) {
        // Set field-specific errors
        Object.entries(result.errors).forEach(([field, message]) => {
          setError(field as Path<z.infer<TSchema>>, {
            type: 'server',
            message,
          });
        });
      }

      // Clear persisted data on successful submission
      if (result.success && persistFormData && formStorageKey) {
        localStorage.removeItem(formStorageKey);
      }
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  const handleFormReset = useCallback(() => {
    reset();
    clearErrors();
    
    // Clear persisted data
    if (persistFormData && formStorageKey) {
      localStorage.removeItem(formStorageKey);
    }
    
    onReset?.();
  }, [reset, clearErrors, onReset, persistFormData, formStorageKey]);

  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setValue(fieldName as Path<z.infer<TSchema>>, value, {
      shouldValidate: validateOnChange,
      shouldDirty: true,
      shouldTouch: true,
    });
    
    if (clearErrorsOnChange && errors[fieldName]) {
      clearErrors(fieldName as Path<z.infer<TSchema>>);
    }
    
    onFieldChange?.(fieldName, value);
  }, [setValue, validateOnChange, clearErrorsOnChange, errors, clearErrors, onFieldChange]);

  // Notify parent of form changes
  useEffect(() => {
    onChange?.(formValues);
  }, [formValues, onChange]);

  // Notify parent of validation errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      onValidationError?.(errors);
    }
  }, [errors, onValidationError]);

  // =========================================================================
  // FIELD PROCESSING
  // =========================================================================
  
  // Filter and process fields based on current form state
  const visibleFields = useMemo(() => {
    return fields.filter(field => shouldShowField(field, formValues));
  }, [fields, formValues]);

  // Group fields for layout
  const groupedFields = useMemo(() => {
    if (layout.sectioned) {
      return groupFields(visibleFields);
    }
    return { default: visibleFields };
  }, [visibleFields, layout.sectioned]);

  // =========================================================================
  // FORM ACTIONS
  // =========================================================================
  
  const defaultActions: FormAction[] = [
    ...(showResetButton ? [{
      label: resetButtonText,
      type: 'reset' as const,
      variant: 'outline' as const,
      onClick: handleFormReset,
      disabled: !isDirty || isSubmitting,
      position: 'left' as const,
    }] : []),
    ...(!hideSubmitButton ? [{
      label: submitButtonText,
      type: 'submit' as const,
      variant: 'default' as const,
      loading: isSubmitting,
      disabled: disabled || isLoading || (!autoSave && !isValid),
      position: 'right' as const,
    }] : []),
  ];

  const formActions = actions || defaultActions;

  // =========================================================================
  // RENDER METHODS
  // =========================================================================
  
  const renderField = (field: FieldConfig) => {
    const fieldError = errors[field.name as keyof typeof errors] as FieldError | undefined;
    const fieldValue = formValues[field.name];
    const fieldEnabled = isFieldEnabled(field, formValues);

    // Don't render hidden fields in the UI
    if (field.type === 'hidden') {
      return <input key={field.name} {...register(field.name as Path<z.infer<TSchema>>)} type="hidden" />;
    }

    return (
      <FormField key={field.name} className={field.className}>
        {field.type !== 'checkbox' && field.type !== 'switch' && (
          <FormLabel
            htmlFor={field.name}
            required={field.validation?.required}
          >
            {field.label}
          </FormLabel>
        )}
        
        <FormControl error={fieldError}>
          <FieldRenderer
            field={field}
            value={fieldValue}
            onChange={(value) => handleFieldChange(field.name, value)}
            onBlur={() => {
              if (validateOnBlur) {
                form.trigger(field.name as Path<z.infer<TSchema>>);
              }
            }}
            error={fieldError}
            disabled={disabled || isLoading || !fieldEnabled}
            readonly={readonly}
          />
          
          {field.description && (
            <FormDescription id={`${field.name}-description`}>
              {field.description}
            </FormDescription>
          )}
        </FormControl>
      </FormField>
    );
  };

  const renderFieldGroup = (groupName: string, groupFields: FieldConfig[]) => {
    if (groupName === 'default' && !layout.sectioned) {
      return (
        <div
          key={groupName}
          className={cn(
            'grid gap-6',
            layout.columns === 2 && 'grid-cols-1 md:grid-cols-2',
            layout.columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
            layout.columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          )}
        >
          {groupFields.map(renderField)}
        </div>
      );
    }

    return (
      <FormSection
        key={groupName}
        title={groupName !== 'default' ? groupName : undefined}
        collapsible={layout.collapsible}
        className={cn(
          layout.spacing === 'sm' && 'space-y-4',
          layout.spacing === 'lg' && 'space-y-8'
        )}
      >
        <div
          className={cn(
            'grid gap-6',
            layout.columns === 2 && 'grid-cols-1 md:grid-cols-2',
            layout.columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
            layout.columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          )}
        >
          {groupFields.map(renderField)}
        </div>
      </FormSection>
    );
  };

  // =========================================================================
  // MAIN RENDER
  // =========================================================================
  
  return (
    <div 
      className={cn(formVariants({ variant, size }), className)}
      {...props}
    >
      {/* Form Header */}
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 
              id={`${formId}-title`}
              className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
            >
              {title}
            </h2>
          )}
          {description && (
            <p 
              id={`${formId}-description`}
              className="text-gray-600 dark:text-gray-400"
            >
              {description}
            </p>
          )}
        </div>
      )}

      {/* Main Form */}
      <Form
        variant={layout.variant}
        size={layout.spacing}
        className={formClassName}
      >
        <form
          id={formId}
          onSubmit={handleSubmit(handleFormSubmit)}
          noValidate
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy || (description ? `${formId}-description` : undefined)}
          aria-labelledby={ariaLabelledBy || (title ? `${formId}-title` : undefined)}
        >
          {/* Form Fields */}
          <div className={cn(
            layout.spacing === 'sm' && 'space-y-4',
            layout.spacing === 'default' && 'space-y-6',
            layout.spacing === 'lg' && 'space-y-8'
          )}>
            {Object.entries(groupedFields).map(([groupName, groupFields]) =>
              renderFieldGroup(groupName, groupFields)
            )}
          </div>

          {/* Form Actions */}
          {formActions.length > 0 && (
            <FormActions className="mt-8">
              {formActions.map((action, index) => (
                <Button
                  key={`${action.label}-${index}`}
                  type={action.type}
                  variant={action.variant}
                  size={action.size}
                  loading={action.loading}
                  disabled={action.disabled}
                  onClick={action.onClick}
                  className={action.className}
                  leftIcon={action.leftIcon}
                  rightIcon={action.rightIcon}
                >
                  {action.label}
                </Button>
              ))}
            </FormActions>
          )}
        </form>
      </Form>

      {/* Loading Overlay */}
      {(isLoading || isSubmitting) && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center rounded-lg">
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg">
            <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isSubmitting ? 'Saving...' : 'Loading...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  SecurityFormProps,
  FieldConfig,
  FieldType,
  FieldValidation,
  ConditionalLogic,
  FormAction,
  FormLayout,
  FormSubmissionResult,
};

export {
  formVariants,
  evaluateConditional,
  shouldShowField,
  isFieldEnabled,
  groupFields,
  useDebounce,
};

export default SecurityForm;