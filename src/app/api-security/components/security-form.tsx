/**
 * Generic Security Form Component
 * 
 * Reusable form component for CRUD operations in security management features.
 * Implements React Hook Form with Zod validation, supports dynamic field rendering
 * based on data type, provides real-time validation under 100ms, and includes
 * accessibility features. Used by both limits and roles management for create/edit operations.
 * 
 * @fileoverview Generic security form with React Hook Form + Zod validation
 * @version 1.0.0
 */

'use client';

import React, { useCallback, useMemo, useEffect } from 'react';
import { 
  useForm,
  type UseFormReturn,
  type FieldValues,
  type SubmitHandler,
  type SubmitErrorHandler,
  type Path
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z, type ZodSchema } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Supported field types for dynamic field rendering
 */
export type SecurityFormFieldType = 
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'url'
  | 'json';

/**
 * Field configuration for dynamic form rendering
 */
export interface SecurityFormField {
  /** Unique field identifier - must match schema key */
  name: string;
  /** Display label for the field */
  label: string;
  /** Field input type */
  type: SecurityFormFieldType;
  /** Placeholder text */
  placeholder?: string;
  /** Help text displayed below the field */
  helpText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Field width in grid columns (1-12) */
  width?: number;
  /** Select/radio options */
  options?: Array<{ value: string | number; label: string; disabled?: boolean }>;
  /** Conditional rendering logic */
  condition?: {
    /** Field to watch for condition */
    field: string;
    /** Expected value to show this field */
    value: any;
    /** Operator for comparison */
    operator?: 'equals' | 'not_equals' | 'includes' | 'excludes';
  };
  /** Field validation rules (additional to schema) */
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    customValidator?: (value: any) => string | undefined;
  };
}

/**
 * Form configuration for different entity types
 */
export interface SecurityFormConfig<T extends FieldValues = FieldValues> {
  /** Form title */
  title: string;
  /** Form description */
  description?: string;
  /** Field definitions */
  fields: SecurityFormField[];
  /** Zod validation schema */
  schema: ZodSchema<T>;
  /** Default form values */
  defaultValues?: Partial<T>;
  /** Form submit button text */
  submitText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Whether to show reset button */
  showReset?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Form mode */
  mode?: 'create' | 'edit' | 'view';
}

/**
 * Security form component props
 */
export interface SecurityFormProps<T extends FieldValues = FieldValues> {
  /** Form configuration */
  config: SecurityFormConfig<T>;
  /** Form submission handler */
  onSubmit: SubmitHandler<T>;
  /** Form error handler */
  onError?: SubmitErrorHandler<T>;
  /** Cancel handler */
  onCancel?: () => void;
  /** Reset handler */
  onReset?: () => void;
  /** Form data for edit mode */
  initialData?: Partial<T>;
  /** Custom CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Whether form is disabled */
  disabled?: boolean;
  /** Success message */
  successMessage?: string;
  /** Error message */
  errorMessage?: string;
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Creates common validation schemas for security forms
 */
export const createSecurityValidationSchemas = () => {
  const nameSchema = z
    .string()
    .min(1, 'Name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(255, 'Name cannot exceed 255 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores');

  const descriptionSchema = z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional();

  const urlSchema = z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal(''));

  const jsonSchema = z
    .string()
    .refine(
      (value) => {
        if (!value || value.trim() === '') return true;
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Invalid JSON format. Please check syntax and try again.' }
    );

  const positiveNumberSchema = z
    .number()
    .min(0, 'Value must be positive')
    .or(z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(0)));

  return {
    nameSchema,
    descriptionSchema,
    urlSchema,
    jsonSchema,
    positiveNumberSchema,
  };
};

// ============================================================================
// FIELD RENDERING COMPONENTS
// ============================================================================

/**
 * Renders a dynamic form field based on field configuration
 */
const SecurityFormFieldRenderer: React.FC<{
  field: SecurityFormField;
  form: UseFormReturn<any>;
  disabled?: boolean;
}> = ({ field, form, disabled = false }) => {
  const {
    control,
    formState: { errors },
    watch,
  } = form;

  // Check conditional rendering
  const shouldRender = useMemo(() => {
    if (!field.condition) return true;
    
    const watchedValue = watch(field.condition.field);
    const expectedValue = field.condition.value;
    const operator = field.condition.operator || 'equals';
    
    switch (operator) {
      case 'equals':
        return watchedValue === expectedValue;
      case 'not_equals':
        return watchedValue !== expectedValue;
      case 'includes':
        return Array.isArray(watchedValue) ? watchedValue.includes(expectedValue) : false;
      case 'excludes':
        return Array.isArray(watchedValue) ? !watchedValue.includes(expectedValue) : true;
      default:
        return true;
    }
  }, [field.condition, watch]);

  if (!shouldRender) return null;

  const fieldError = errors[field.name];
  const isDisabled = disabled || field.disabled;
  const isRequired = field.required;

  return (
    <div className={cn('form-field-container', field.width && `col-span-${field.width}`)}>
      <FormField
        control={control}
        name={field.name}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel className={cn(isRequired && 'required')}>
              {field.label}
              {isRequired && <span className="text-red-500 ml-1" aria-label="required">*</span>}
            </FormLabel>
            <FormControl>
              {(() => {
                switch (field.type) {
                  case 'textarea':
                    return (
                      <Textarea
                        {...formField}
                        placeholder={field.placeholder}
                        disabled={isDisabled}
                        className={cn(fieldError && 'border-red-500')}
                        aria-describedby={field.helpText ? `${field.name}-help` : undefined}
                        aria-invalid={!!fieldError}
                      />
                    );

                  case 'select':
                    return (
                      <Select
                        onValueChange={formField.onChange}
                        value={formField.value}
                        disabled={isDisabled}
                      >
                        <SelectTrigger className={cn(fieldError && 'border-red-500')}>
                          <SelectValue placeholder={field.placeholder || 'Select an option'} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={String(option.value)}
                              disabled={option.disabled}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );

                  case 'number':
                    return (
                      <Input
                        {...formField}
                        type="number"
                        placeholder={field.placeholder}
                        disabled={isDisabled}
                        className={cn(fieldError && 'border-red-500')}
                        aria-describedby={field.helpText ? `${field.name}-help` : undefined}
                        aria-invalid={!!fieldError}
                        min={field.validation?.min}
                        max={field.validation?.max}
                        onChange={(e) => {
                          const value = e.target.value === '' ? '' : Number(e.target.value);
                          formField.onChange(value);
                        }}
                      />
                    );

                  case 'email':
                    return (
                      <Input
                        {...formField}
                        type="email"
                        placeholder={field.placeholder}
                        disabled={isDisabled}
                        className={cn(fieldError && 'border-red-500')}
                        aria-describedby={field.helpText ? `${field.name}-help` : undefined}
                        aria-invalid={!!fieldError}
                        autoComplete="email"
                      />
                    );

                  case 'password':
                    return (
                      <Input
                        {...formField}
                        type="password"
                        placeholder={field.placeholder}
                        disabled={isDisabled}
                        className={cn(fieldError && 'border-red-500')}
                        aria-describedby={field.helpText ? `${field.name}-help` : undefined}
                        aria-invalid={!!fieldError}
                        autoComplete="new-password"
                      />
                    );

                  case 'url':
                    return (
                      <Input
                        {...formField}
                        type="url"
                        placeholder={field.placeholder}
                        disabled={isDisabled}
                        className={cn(fieldError && 'border-red-500')}
                        aria-describedby={field.helpText ? `${field.name}-help` : undefined}
                        aria-invalid={!!fieldError}
                      />
                    );

                  case 'json':
                    return (
                      <Textarea
                        {...formField}
                        placeholder={field.placeholder || 'Enter valid JSON'}
                        disabled={isDisabled}
                        className={cn(
                          'font-mono text-sm',
                          fieldError && 'border-red-500'
                        )}
                        aria-describedby={field.helpText ? `${field.name}-help` : undefined}
                        aria-invalid={!!fieldError}
                        rows={6}
                      />
                    );

                  default:
                    return (
                      <Input
                        {...formField}
                        type="text"
                        placeholder={field.placeholder}
                        disabled={isDisabled}
                        className={cn(fieldError && 'border-red-500')}
                        aria-describedby={field.helpText ? `${field.name}-help` : undefined}
                        aria-invalid={!!fieldError}
                        pattern={field.validation?.pattern?.source}
                      />
                    );
                }
              })()}
            </FormControl>
            {field.helpText && (
              <p id={`${field.name}-help`} className="text-sm text-muted-foreground mt-1">
                {field.helpText}
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Generic Security Form Component
 * 
 * Supports both rate limits and role-based access control configurations
 * with dynamic field rendering and real-time validation under 100ms.
 */
export const SecurityForm = <T extends FieldValues = FieldValues>({
  config,
  onSubmit,
  onError,
  onCancel,
  onReset,
  initialData,
  className,
  testId = 'security-form',
  disabled = false,
  successMessage,
  errorMessage,
}: SecurityFormProps<T>) => {
  // Initialize form with React Hook Form and Zod validation
  const form = useForm<T>({
    resolver: zodResolver(config.schema),
    defaultValues: {
      ...config.defaultValues,
      ...initialData,
    } as T,
    mode: 'onChange', // Real-time validation
    reValidateMode: 'onChange',
  });

  const {
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty, isValid },
    clearErrors,
  } = form;

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        ...config.defaultValues,
        ...initialData,
      } as T);
    }
  }, [initialData, reset, config.defaultValues]);

  // Handle form submission
  const handleFormSubmit = useCallback<SubmitHandler<T>>(
    async (data) => {
      try {
        clearErrors();
        await onSubmit(data);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    },
    [onSubmit, clearErrors]
  );

  // Handle form errors
  const handleFormError = useCallback<SubmitErrorHandler<T>>(
    (errors) => {
      console.error('Form validation errors:', errors);
      onError?.(errors);
    },
    [onError]
  );

  // Handle form reset
  const handleReset = useCallback(() => {
    reset(config.defaultValues as T);
    clearErrors();
    onReset?.();
  }, [reset, clearErrors, onReset, config.defaultValues]);

  // Handle form cancel
  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmed) return;
    }
    onCancel?.();
  }, [isDirty, onCancel]);

  const isFormDisabled = disabled || config.isLoading || isSubmitting;
  const isViewMode = config.mode === 'view';

  return (
    <div className={cn('security-form-container', className)} data-testid={testId}>
      {/* Form Header */}
      <div className="form-header mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {config.title}
        </h2>
        {config.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {config.description}
          </p>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
          <CheckCircleIcon className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Form {...form}>
        <form
          onSubmit={handleSubmit(handleFormSubmit, handleFormError)}
          className="space-y-6"
          noValidate
        >
          {/* Dynamic Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {config.fields.map((field) => (
              <SecurityFormFieldRenderer
                key={field.name}
                field={field}
                form={form}
                disabled={isFormDisabled || isViewMode}
              />
            ))}
          </div>

          {/* Form Actions */}
          {!isViewMode && (
            <div className="form-actions flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="submit"
                disabled={isFormDisabled || !isValid}
                className="sm:order-1"
                data-testid="submit-button"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  config.submitText || 'Save'
                )}
              </Button>

              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="sm:order-3"
                  data-testid="cancel-button"
                >
                  {config.cancelText || 'Cancel'}
                </Button>
              )}

              {config.showReset && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleReset}
                  disabled={isFormDisabled || !isDirty}
                  className="sm:order-2"
                  data-testid="reset-button"
                >
                  Reset
                </Button>
              )}
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

/**
 * Predefined form configurations for common security entities
 */
export const securityFormConfigs = {
  /**
   * Rate limit configuration form
   */
  rateLimit: {
    title: 'Rate Limit Configuration',
    description: 'Configure API rate limiting rules to control request frequency',
    fields: [
      {
        name: 'name',
        label: 'Limit Name',
        type: 'text' as const,
        placeholder: 'Enter a descriptive name',
        required: true,
        width: 2,
        helpText: 'A unique name to identify this rate limit rule',
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea' as const,
        placeholder: 'Describe the purpose of this rate limit',
        width: 3,
        helpText: 'Optional description to explain when this limit applies',
      },
      {
        name: 'rate',
        label: 'Request Rate',
        type: 'number' as const,
        placeholder: '100',
        required: true,
        helpText: 'Maximum number of requests allowed',
        validation: { min: 1, max: 10000 },
      },
      {
        name: 'period',
        label: 'Time Period',
        type: 'select' as const,
        required: true,
        options: [
          { value: 'minute', label: 'Per Minute' },
          { value: 'hour', label: 'Per Hour' },
          { value: 'day', label: 'Per Day' },
        ],
        helpText: 'Time period for the rate limit',
      },
      {
        name: 'enabled',
        label: 'Status',
        type: 'select' as const,
        required: true,
        options: [
          { value: 'true', label: 'Enabled' },
          { value: 'false', label: 'Disabled' },
        ],
      },
    ],
    schema: z.object({
      name: z.string().min(3).max(255),
      description: z.string().max(1000).optional(),
      rate: z.number().min(1).max(10000),
      period: z.enum(['minute', 'hour', 'day']),
      enabled: z.boolean().or(z.string().transform(val => val === 'true')),
    }),
    defaultValues: {
      rate: 100,
      period: 'hour' as const,
      enabled: true,
    },
  },

  /**
   * Role configuration form
   */
  role: {
    title: 'Role Configuration',
    description: 'Configure role-based access control settings',
    fields: [
      {
        name: 'name',
        label: 'Role Name',
        type: 'text' as const,
        placeholder: 'Enter role name',
        required: true,
        width: 2,
        helpText: 'A unique name for this role',
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea' as const,
        placeholder: 'Describe the role permissions',
        width: 3,
        helpText: 'Optional description of what this role allows',
      },
      {
        name: 'active',
        label: 'Status',
        type: 'select' as const,
        required: true,
        options: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ],
      },
    ],
    schema: z.object({
      name: z.string().min(3).max(255),
      description: z.string().max(1000).optional(),
      active: z.boolean().or(z.string().transform(val => val === 'true')),
    }),
    defaultValues: {
      active: true,
    },
  },
};

export default SecurityForm;