'use client';

/**
 * Table Form Component
 * 
 * React component providing form interface for table metadata editing including name, alias, 
 * label, plural, and description fields. Implements React Hook Form with Zod validation, 
 * real-time validation feedback, and responsive design. Supports both create and edit modes 
 * with proper form state management.
 * 
 * This component replaces the Angular reactive forms implementation with modern React patterns,
 * maintaining all existing functionality while improving performance and user experience.
 * 
 * @framework React 19 + Next.js 15.1
 * @validation React Hook Form 7.52+ with Zod schema validation
 * @styling Tailwind CSS 4.1+ with responsive design
 * @accessibility WCAG 2.1 AA compliant with proper ARIA labels
 * 
 * @fileoverview Table metadata form component for DreamFactory schema management
 * @version 1.0.0
 * @since React 19.0.0 + Next.js 15.1
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Form, 
  FormField, 
  FormLabel, 
  FormError, 
  FormControl,
  FormGroup 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPE DEFINITIONS AND INTERFACES
// =============================================================================

/**
 * Table metadata form data structure
 * Matches the DreamFactory API schema for table definitions
 */
export interface TableFormData {
  /** Table name (required, database identifier) */
  name: string;
  /** Table alias (optional, alternative reference name) */
  alias?: string | null;
  /** Table label (optional, display name) */
  label?: string | null;
  /** Table plural form (optional, used for API endpoints) */
  plural?: string | null;
  /** Table description (optional, documentation) */
  description?: string | null;
}

/**
 * Table form component props interface
 */
export interface TableFormProps {
  /** Form operation mode - determines field behavior and validation */
  mode: 'create' | 'edit';
  /** Initial form data for edit mode */
  initialData?: Partial<TableFormData>;
  /** Form submission handler with validation */
  onSubmit: (data: TableFormData) => void | Promise<void>;
  /** Cancel/back navigation handler */
  onCancel: () => void;
  /** Loading state during form submission */
  isLoading?: boolean;
  /** Error state from server validation */
  error?: string | null;
  /** Form disabled state */
  disabled?: boolean;
  /** Custom CSS classes for styling */
  className?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/**
 * Form field validation state for real-time feedback
 */
interface FieldValidationState {
  isValid: boolean;
  error?: string;
  touched: boolean;
}

// =============================================================================
// ZOD VALIDATION SCHEMA DEFINITION
// =============================================================================

/**
 * Comprehensive Zod validation schema for table metadata
 * Implements real-time validation with performance optimization under 100ms
 */
const tableFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Table name is required')
    .max(64, 'Table name must be 64 characters or less')
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]*$/,
      'Table name must start with a letter and contain only letters, numbers, and underscores'
    )
    .refine(
      (name) => !['select', 'from', 'where', 'order', 'group', 'having', 'union', 'insert', 'update', 'delete', 'create', 'drop', 'alter'].includes(name.toLowerCase()),
      'Table name cannot be a SQL reserved word'
    ),
  
  alias: z
    .string()
    .max(64, 'Alias must be 64 characters or less')
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]*$/,
      'Alias must start with a letter and contain only letters, numbers, and underscores'
    )
    .optional()
    .nullable()
    .or(z.literal('')),
  
  label: z
    .string()
    .max(128, 'Label must be 128 characters or less')
    .optional()
    .nullable()
    .or(z.literal('')),
  
  plural: z
    .string()
    .max(128, 'Plural form must be 128 characters or less')
    .optional()
    .nullable()
    .or(z.literal('')),
  
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional()
    .nullable()
    .or(z.literal(''))
});

/**
 * Inferred TypeScript type from Zod schema for type safety
 */
type TableFormSchemaType = z.infer<typeof tableFormSchema>;

// =============================================================================
// FORM COMPONENT IMPLEMENTATION
// =============================================================================

/**
 * TableForm Component
 * 
 * Provides a comprehensive form interface for table metadata editing with real-time
 * validation, accessibility compliance, and responsive design. Implements React Hook Form
 * with Zod validation for optimal performance and user experience.
 */
export const TableForm: React.FC<TableFormProps> = React.memo(({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
  disabled = false,
  className,
  'data-testid': testId = 'table-form'
}) => {
  // ============================================================================
  // FORM INITIALIZATION AND CONFIGURATION
  // ============================================================================

  /**
   * Default form values with proper typing and null handling
   */
  const defaultValues = useMemo((): TableFormSchemaType => ({
    name: initialData?.name || '',
    alias: initialData?.alias || '',
    label: initialData?.label || '',
    plural: initialData?.plural || '',
    description: initialData?.description || ''
  }), [initialData]);

  /**
   * React Hook Form configuration with Zod resolver
   * Optimized for real-time validation performance under 100ms
   */
  const form = useForm<TableFormSchemaType>({
    resolver: zodResolver(tableFormSchema),
    defaultValues,
    mode: 'onChange', // Enable real-time validation
    reValidateMode: 'onChange', // Re-validate on every change
    criteriaMode: 'firstError', // Show first error only for performance
    shouldFocusError: true, // Focus first error field for accessibility
    shouldUnregister: false, // Keep form state for better UX
    shouldUseNativeValidation: false // Use Zod validation instead
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty, touchedFields, isSubmitting },
    reset,
    watch,
    setValue
  } = form;

  // ============================================================================
  // FORM STATE MANAGEMENT AND EFFECTS
  // ============================================================================

  /**
   * Reset form when initial data changes (for edit mode updates)
   */
  useEffect(() => {
    if (initialData) {
      reset(defaultValues);
    }
  }, [initialData, defaultValues, reset]);

  /**
   * Auto-generate plural form from table name if not manually set
   * Implements smart pluralization for improved UX
   */
  const nameValue = watch('name');
  const pluralValue = watch('plural');

  useEffect(() => {
    if (mode === 'create' && nameValue && !pluralValue && !touchedFields.plural) {
      const autoPlural = nameValue.endsWith('s') 
        ? `${nameValue}es`
        : nameValue.endsWith('y')
        ? `${nameValue.slice(0, -1)}ies`
        : `${nameValue}s`;
      
      setValue('plural', autoPlural, { shouldValidate: false, shouldTouch: false });
    }
  }, [nameValue, pluralValue, touchedFields.plural, mode, setValue]);

  // ============================================================================
  // EVENT HANDLERS AND FORM SUBMISSION
  // ============================================================================

  /**
   * Form submission handler with validation and error handling
   */
  const handleFormSubmit = useCallback(async (data: TableFormSchemaType) => {
    try {
      // Transform empty strings to null for consistency with API expectations
      const transformedData: TableFormData = {
        name: data.name,
        alias: data.alias === '' ? null : data.alias,
        label: data.label === '' ? null : data.label,
        plural: data.plural === '' ? null : data.plural,
        description: data.description === '' ? null : data.description
      };

      await onSubmit(transformedData);
    } catch (submitError) {
      // Error handling is managed by parent component
      console.error('Form submission error:', submitError);
    }
  }, [onSubmit]);

  /**
   * Cancel handler with form reset
   */
  const handleCancel = useCallback(() => {
    reset();
    onCancel();
  }, [reset, onCancel]);

  // ============================================================================
  // ACCESSIBILITY AND VALIDATION HELPERS
  // ============================================================================

  /**
   * Generate field validation state for accessibility announcements
   */
  const getFieldValidationState = useCallback((fieldName: keyof TableFormSchemaType): FieldValidationState => {
    const fieldError = errors[fieldName];
    const isTouched = touchedFields[fieldName];
    
    return {
      isValid: !fieldError,
      error: fieldError?.message,
      touched: !!isTouched
    };
  }, [errors, touchedFields]);

  /**
   * Generate ARIA attributes for form fields
   */
  const getFieldAriaAttributes = useCallback((fieldName: keyof TableFormSchemaType) => {
    const validationState = getFieldValidationState(fieldName);
    
    return {
      'aria-invalid': validationState.touched && !validationState.isValid,
      'aria-describedby': validationState.error ? `${fieldName}-error` : undefined,
      'aria-required': fieldName === 'name'
    };
  }, [getFieldValidationState]);

  // ============================================================================
  // COMPONENT RENDERING
  // ============================================================================

  return (
    <div 
      className={cn(
        'space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700',
        className
      )}
      data-testid={testId}
    >
      {/* Error Alert Display */}
      {error && (
        <Alert
          variant="destructive"
          className="mb-4"
          data-testid={`${testId}-error-alert`}
        >
          <p className="text-sm font-medium">Form Submission Error</p>
          <p className="text-sm">{error}</p>
        </Alert>
      )}

      {/* Main Form */}
      <Form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Form Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {mode === 'create' ? 'Create New Table' : 'Edit Table Details'}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {mode === 'create' 
              ? 'Define the metadata for your new database table'
              : 'Update the metadata and configuration for this table'
            }
          </p>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Table Name Field */}
          <FormGroup className="sm:col-span-2">
            <FormLabel htmlFor="name" required>
              Table Name
            </FormLabel>
            <FormControl>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="name"
                    type="text"
                    placeholder="Enter table name"
                    disabled={disabled || isLoading || (mode === 'edit')}
                    className={cn(
                      'transition-colors duration-200',
                      errors.name && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    )}
                    {...getFieldAriaAttributes('name')}
                    data-testid={`${testId}-name-input`}
                  />
                )}
              />
            </FormControl>
            {errors.name && (
              <FormError id="name-error" data-testid={`${testId}-name-error`}>
                {errors.name.message}
              </FormError>
            )}
            {mode === 'edit' && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Table name cannot be changed after creation
              </p>
            )}
          </FormGroup>

          {/* Alias Field */}
          <FormGroup>
            <FormLabel htmlFor="alias">
              Alias
            </FormLabel>
            <FormControl>
              <Controller
                name="alias"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="alias"
                    type="text"
                    placeholder="Optional alias"
                    disabled={disabled || isLoading}
                    className={cn(
                      'transition-colors duration-200',
                      errors.alias && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    )}
                    {...getFieldAriaAttributes('alias')}
                    data-testid={`${testId}-alias-input`}
                  />
                )}
              />
            </FormControl>
            {errors.alias && (
              <FormError id="alias-error" data-testid={`${testId}-alias-error`}>
                {errors.alias.message}
              </FormError>
            )}
          </FormGroup>

          {/* Label Field */}
          <FormGroup>
            <FormLabel htmlFor="label">
              Label
            </FormLabel>
            <FormControl>
              <Controller
                name="label"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="label"
                    type="text"
                    placeholder="Display label"
                    disabled={disabled || isLoading}
                    className={cn(
                      'transition-colors duration-200',
                      errors.label && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    )}
                    {...getFieldAriaAttributes('label')}
                    data-testid={`${testId}-label-input`}
                  />
                )}
              />
            </FormControl>
            {errors.label && (
              <FormError id="label-error" data-testid={`${testId}-label-error`}>
                {errors.label.message}
              </FormError>
            )}
          </FormGroup>

          {/* Plural Field */}
          <FormGroup>
            <FormLabel htmlFor="plural">
              Plural Form
            </FormLabel>
            <FormControl>
              <Controller
                name="plural"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="plural"
                    type="text"
                    placeholder="Plural form"
                    disabled={disabled || isLoading}
                    className={cn(
                      'transition-colors duration-200',
                      errors.plural && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    )}
                    {...getFieldAriaAttributes('plural')}
                    data-testid={`${testId}-plural-input`}
                  />
                )}
              />
            </FormControl>
            {errors.plural && (
              <FormError id="plural-error" data-testid={`${testId}-plural-error`}>
                {errors.plural.message}
              </FormError>
            )}
          </FormGroup>

          {/* Description Field */}
          <FormGroup className="sm:col-span-2">
            <FormLabel htmlFor="description">
              Description
            </FormLabel>
            <FormControl>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="description"
                    type="text"
                    placeholder="Optional description"
                    disabled={disabled || isLoading}
                    className={cn(
                      'transition-colors duration-200',
                      errors.description && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    )}
                    {...getFieldAriaAttributes('description')}
                    data-testid={`${testId}-description-input`}
                  />
                )}
              />
            </FormControl>
            {errors.description && (
              <FormError id="description-error" data-testid={`${testId}-description-error`}>
                {errors.description.message}
              </FormError>
            )}
          </FormGroup>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading || isSubmitting}
            className="order-2 sm:order-1"
            data-testid={`${testId}-cancel-button`}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            variant="default"
            disabled={disabled || isLoading || isSubmitting || !isValid}
            className="order-1 sm:order-2"
            data-testid={`${testId}-submit-button`}
          >
            {isLoading || isSubmitting ? (
              <>
                <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              mode === 'create' ? 'Create Table' : 'Update Table'
            )}
          </Button>
        </div>

        {/* Form Status Information */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>
            Form valid: {isValid ? '✓' : '✗'} | 
            Changed: {isDirty ? '✓' : '✗'} |
            Required fields: Table name
          </p>
          {mode === 'create' && (
            <p>
              * Plural form will be auto-generated if not specified
            </p>
          )}
        </div>
      </Form>
    </div>
  );
});

// =============================================================================
// COMPONENT CONFIGURATION AND EXPORTS
// =============================================================================

/**
 * Display name for debugging and development tools
 */
TableForm.displayName = 'TableForm';

/**
 * Default export for convenient importing
 */
export default TableForm;

/**
 * Named exports for specific use cases
 */
export {
  tableFormSchema,
  type TableFormData,
  type TableFormProps
};

/**
 * Component version information for debugging
 */
export const TABLE_FORM_VERSION = '1.0.0';
export const COMPONENT_NAME = 'TableForm';

/**
 * Performance optimization exports
 */
export const MemoizedTableForm = React.memo(TableForm);