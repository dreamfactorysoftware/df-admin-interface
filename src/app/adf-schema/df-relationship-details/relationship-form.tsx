/**
 * Relationship Form Component
 * 
 * React Hook Form component for database relationship configuration with comprehensive 
 * validation, dynamic field behavior, and type-safe form state management. Handles both 
 * create and edit modes with intelligent field enabling/disabling based on relationship 
 * type (belongs_to vs many_many).
 * 
 * Features:
 * - React Hook Form 7.57.0 with Zod schema validation for type-safe form handling
 * - Real-time validation under 100ms for optimal user experience  
 * - WCAG 2.1 AA compliance through Headless UI accessible components
 * - Dynamic field behavior based on relationship type selection
 * - Class-variance-authority for dynamic Tailwind class composition
 * - Comprehensive error handling and user feedback
 * - Loading states and async operation support
 * - Keyboard navigation and screen reader support
 * 
 * @fileoverview Database relationship configuration form component
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+ / React Hook Form 7.57.0
 */

'use client';

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cva, type VariantProps } from 'class-variance-authority';

// UI Components
import { FormField } from '../../../components/ui/form/form-field';
import { Select } from '../../../components/ui/select/Select';
import { Button } from '../../../components/ui/button/button';
import { Toggle } from '../../../components/ui/toggle/toggle';

// Validation and Types
import {
  RelationshipSchema,
  type RelationshipFormData,
  type RelationshipType,
  type RelationshipFormValues,
  getEnabledFields,
  getDisabledFields,
  getDefaultRelationshipValues,
  getRelationshipFieldConfigs,
  validateRelationshipForm,
  createDebouncedValidator,
  type RelationshipFieldConfig,
} from './validation-schemas';

// Utilities
import { cn } from '../../../lib/utils';

// Types for external integration
interface RelationshipFormProps {
  /** Initial relationship data for edit mode */
  initialData?: Partial<RelationshipFormData>;
  
  /** Form submission handler */
  onSubmit: (data: RelationshipFormValues) => Promise<void> | void;
  
  /** Cancel handler */
  onCancel?: () => void;
  
  /** Loading state */
  loading?: boolean;
  
  /** Form mode */
  mode?: 'create' | 'edit';
  
  /** Available database services for dropdowns */
  availableServices?: Array<{ label: string; value: number }>;
  
  /** Available tables for current service */
  availableTables?: Array<{ label: string; value: string }>;
  
  /** Available fields for selected table */
  availableFields?: Array<{ label: string; value: string }>;
  
  /** Service ID change handler for loading tables */
  onServiceChange?: (serviceId: number) => void;
  
  /** Table change handler for loading fields */
  onTableChange?: (tableName: string) => void;
  
  /** Form error state */
  error?: string;
  
  /** Form success state */
  success?: string;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Accessibility props */
  'aria-label'?: string;
  'aria-describedby'?: string;
  
  /** Test identifier */
  'data-testid'?: string;
}

/**
 * Form section styling variants using class-variance-authority
 * Provides consistent theme integration and accessibility compliance
 */
const formSectionVariants = cva(
  [
    "space-y-6 p-6 rounded-lg border transition-all duration-200",
    "focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-opacity-50",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-white border-gray-200 shadow-sm",
          "dark:bg-gray-800 dark:border-gray-700",
        ],
        elevated: [
          "bg-white border-gray-300 shadow-md",
          "dark:bg-gray-800 dark:border-gray-600",
        ],
        outlined: [
          "bg-transparent border-2 border-gray-300",
          "dark:border-gray-600",
        ],
      },
      state: {
        default: "",
        loading: "opacity-75 pointer-events-none",
        error: [
          "border-error-300 bg-error-50",
          "dark:border-error-700 dark:bg-error-900/20",
        ],
        success: [
          "border-success-300 bg-success-50", 
          "dark:border-success-700 dark:bg-success-900/20",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
      state: "default",
    },
  }
);

/**
 * Field group styling variants
 * Provides consistent spacing and visual hierarchy
 */
const fieldGroupVariants = cva(
  "space-y-4",
  {
    variants: {
      spacing: {
        compact: "space-y-2",
        normal: "space-y-4", 
        relaxed: "space-y-6",
      },
      layout: {
        stack: "flex flex-col",
        grid: "grid grid-cols-1 gap-4 md:grid-cols-2",
        inline: "flex flex-wrap gap-4",
      },
    },
    defaultVariants: {
      spacing: "normal",
      layout: "stack",
    },
  }
);

/**
 * Relationship Form Component
 * 
 * Comprehensive form component for database relationship configuration that provides
 * real-time validation, dynamic field behavior, and enterprise-grade accessibility.
 * Integrates seamlessly with React Hook Form and Zod for type-safe validation.
 */
export const RelationshipForm: React.FC<RelationshipFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  mode = 'create',
  availableServices = [],
  availableTables = [],
  availableFields = [],
  onServiceChange,
  onTableChange,
  error,
  success,
  className,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'data-testid': testId,
}) => {
  
  // Form state management with React Hook Form and Zod validation
  const form = useForm<RelationshipFormData>({
    resolver: zodResolver(RelationshipSchema),
    defaultValues: {
      ...getDefaultRelationshipValues('belongs_to'),
      ...initialData,
    },
    mode: 'onChange', // Enable real-time validation
    criteriaMode: 'all', // Show all validation errors
    shouldFocusError: true, // Accessibility: focus first error field
    delayError: 50, // Debounce validation for performance
  });
  
  const { 
    control, 
    handleSubmit, 
    formState: { errors, isSubmitting, isValid, isDirty },
    setValue,
    clearErrors,
    trigger,
    reset,
  } = form;
  
  // Watch relationship type for dynamic field behavior
  const watchedType = useWatch({
    control,
    name: 'type',
    defaultValue: initialData?.type || 'belongs_to',
  });
  
  // Watch service IDs for dropdown dependencies
  const watchedRefServiceId = useWatch({
    control,
    name: 'refServiceId',
  });
  
  const watchedJunctionServiceId = useWatch({
    control,
    name: 'junctionServiceId',
  });
  
  // Local state for loading states
  const [isValidating, setIsValidating] = useState(false);
  const [fieldStates, setFieldStates] = useState<Record<string, boolean>>({});
  
  // Debounced validator for real-time feedback under 100ms
  const debouncedValidator = useMemo(
    () => createDebouncedValidator(50),
    []
  );
  
  // Calculate enabled/disabled fields based on relationship type
  const enabledFields = useMemo(
    () => getEnabledFields(watchedType),
    [watchedType]
  );
  
  const disabledFields = useMemo(
    () => getDisabledFields(watchedType),
    [watchedType]
  );
  
  // Get field configurations for dynamic rendering
  const fieldConfigs = useMemo(
    () => getRelationshipFieldConfigs(watchedType),
    [watchedType]
  );
  
  // Form section state based on validation and loading
  const formState = useMemo(() => {
    if (loading || isSubmitting) return 'loading';
    if (error) return 'error';
    if (success) return 'success';
    return 'default';
  }, [loading, isSubmitting, error, success]);
  
  // Enhanced form submission with loading state and error handling
  const onFormSubmit: SubmitHandler<RelationshipFormData> = useCallback(
    async (data) => {
      try {
        setIsValidating(true);
        
        // Additional client-side validation
        const validationResult = await debouncedValidator(data);
        if (!validationResult.success) {
          console.warn('Client-side validation failed:', validationResult.errors);
        }
        
        // Submit form data
        await onSubmit(data);
        
        // Announce success to screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = `Relationship ${mode === 'create' ? 'created' : 'updated'} successfully`;
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 1000);
        
      } catch (submitError) {
        console.error('Form submission error:', submitError);
        
        // Announce error to screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = 'Form submission failed. Please check the errors and try again.';
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 1000);
      } finally {
        setIsValidating(false);
      }
    },
    [onSubmit, mode, debouncedValidator]
  );
  
  // Handle relationship type change with field cleanup
  const handleTypeChange = useCallback(
    (newType: RelationshipType) => {
      setValue('type', newType);
      
      // Clear junction fields if switching away from many_many
      if (newType !== 'many_many') {
        setValue('junctionServiceId', undefined);
        setValue('junctionTable', undefined);
        setValue('junctionField', undefined);
        setValue('junctionRefField', undefined);
        
        // Clear errors for disabled fields
        clearErrors(['junctionServiceId', 'junctionTable', 'junctionField', 'junctionRefField']);
      }
      
      // Trigger validation for affected fields
      trigger();
    },
    [setValue, clearErrors, trigger]
  );
  
  // Handle service selection with dependent field updates
  const handleServiceChange = useCallback(
    (serviceId: number, isJunction: boolean = false) => {
      if (isJunction) {
        setValue('junctionServiceId', serviceId);
        setValue('junctionTable', undefined);
        setValue('junctionField', undefined);
        setValue('junctionRefField', undefined);
      } else {
        setValue('refServiceId', serviceId);
        setValue('refTable', undefined);
        setValue('refField', undefined);
      }
      
      // Notify parent component to load tables
      onServiceChange?.(serviceId);
      
      // Trigger validation
      trigger();
    },
    [setValue, onServiceChange, trigger]
  );
  
  // Handle table selection with dependent field updates
  const handleTableChange = useCallback(
    (tableName: string, isJunction: boolean = false) => {
      if (isJunction) {
        setValue('junctionTable', tableName);
        setValue('junctionField', undefined);
        setValue('junctionRefField', undefined);
      } else {
        setValue('refTable', tableName);
        setValue('refField', undefined);
      }
      
      // Notify parent component to load fields
      onTableChange?.(tableName);
      
      // Trigger validation
      trigger();
    },
    [setValue, onTableChange, trigger]
  );
  
  // Reset form to initial state
  const handleReset = useCallback(() => {
    reset({
      ...getDefaultRelationshipValues(watchedType),
      ...initialData,
    });
  }, [reset, watchedType, initialData]);
  
  // Effect to update form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        ...getDefaultRelationshipValues(initialData.type || 'belongs_to'),
        ...initialData,
      });
    }
  }, [initialData, reset]);
  
  // Render a form field based on configuration
  const renderFormField = useCallback(
    (config: RelationshipFieldConfig) => {
      const fieldName = config.name;
      const isDisabled = disabledFields.includes(fieldName) || loading || isSubmitting;
      const isRequired = config.required && enabledFields.includes(fieldName);
      
      // Common field configuration
      const fieldConfig = {
        label: config.label,
        placeholder: config.placeholder,
        helperText: config.helperText,
        required: isRequired,
        disabled: isDisabled,
      };
      
      switch (config.type) {
        case 'select':
          // Get appropriate options based on field name
          let options: Array<{ label: string; value: any }> = [];
          
          if (fieldName === 'type') {
            options = config.options || [];
          } else if (fieldName === 'refServiceId' || fieldName === 'junctionServiceId') {
            options = availableServices;
          } else if (fieldName === 'refTable' || fieldName === 'junctionTable') {
            options = availableTables;
          } else if (fieldName === 'refField' || fieldName === 'field' || 
                     fieldName === 'junctionField' || fieldName === 'junctionRefField') {
            options = availableFields;
          }
          
          return (
            <FormField
              key={fieldName}
              control={control}
              name={fieldName}
              config={fieldConfig}
              rules={{ required: isRequired ? 'This field is required' : false }}
            >
              <Select
                options={options}
                placeholder={config.placeholder || `Select ${config.label.toLowerCase()}`}
                disabled={isDisabled}
                error={errors[fieldName]?.message}
                loading={fieldStates[fieldName]}
                clearable={!isRequired}
                onChange={(value) => {
                  // Handle specific field change logic
                  if (fieldName === 'type') {
                    handleTypeChange(value as RelationshipType);
                  } else if (fieldName === 'refServiceId') {
                    handleServiceChange(value as number, false);
                  } else if (fieldName === 'junctionServiceId') {
                    handleServiceChange(value as number, true);
                  } else if (fieldName === 'refTable') {
                    handleTableChange(value as string, false);
                  } else if (fieldName === 'junctionTable') {
                    handleTableChange(value as string, true);
                  }
                }}
                data-testid={`${testId}-${fieldName}`}
              />
            </FormField>
          );
          
        case 'toggle':
          return (
            <FormField
              key={fieldName}
              control={control}
              name={fieldName}
              config={fieldConfig}
            >
              <Toggle
                disabled={isDisabled}
                size="md"
                variant="primary"
                label={config.label}
                labelPosition="right"
                data-testid={`${testId}-${fieldName}`}
              />
            </FormField>
          );
          
        case 'textarea':
          // For this component, we'll use a basic textarea since we don't have a dedicated TextArea component
          return (
            <FormField
              key={fieldName}
              control={control}
              name={fieldName}
              config={fieldConfig}
            >
              <textarea
                className={cn(
                  "w-full px-3 py-2 border border-gray-300 rounded-md",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                )}
                rows={3}
                placeholder={config.placeholder}
                disabled={isDisabled}
                data-testid={`${testId}-${fieldName}`}
              />
            </FormField>
          );
          
        default: // text input
          return (
            <FormField
              key={fieldName}
              control={control}
              name={fieldName}
              config={fieldConfig}
            >
              <input
                type="text"
                className={cn(
                  "w-full px-3 py-2 border border-gray-300 rounded-md",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                )}
                placeholder={config.placeholder}
                disabled={isDisabled}
                data-testid={`${testId}-${fieldName}`}
              />
            </FormField>
          );
      }
    },
    [
      control,
      errors,
      disabledFields,
      enabledFields,
      loading,
      isSubmitting,
      availableServices,
      availableTables, 
      availableFields,
      fieldStates,
      handleTypeChange,
      handleServiceChange,
      handleTableChange,
      testId,
    ]
  );
  
  // Group fields by category for better UX
  const basicFields = fieldConfigs.filter(config => 
    ['name', 'alias', 'label', 'description', 'type'].includes(config.name)
  );
  
  const relationshipFields = fieldConfigs.filter(config =>
    ['field', 'refServiceId', 'refTable', 'refField'].includes(config.name)
  );
  
  const junctionFields = fieldConfigs.filter(config =>
    config.name.startsWith('junction')
  );
  
  const settingsFields = fieldConfigs.filter(config =>
    ['alwaysFetch', 'isVirtual'].includes(config.name)
  );
  
  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className={cn(
        formSectionVariants({ 
          variant: "default", 
          state: formState 
        }),
        className
      )}
      aria-label={ariaLabel || `${mode} relationship form`}
      aria-describedby={ariaDescribedBy}
      data-testid={testId || `relationship-form-${mode}`}
      noValidate // Use React Hook Form validation instead
    >
      {/* Form Header */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {mode === 'create' ? 'Create Relationship' : 'Edit Relationship'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure a database relationship to enable API generation with proper data associations.
        </p>
      </div>
      
      {/* Error/Success Messages */}
      {error && (
        <div 
          className="p-4 rounded-md bg-error-50 border border-error-200 dark:bg-error-900/20 dark:border-error-800"
          role="alert"
          aria-live="polite"
        >
          <p className="text-sm text-error-700 dark:text-error-300">
            {error}
          </p>
        </div>
      )}
      
      {success && (
        <div 
          className="p-4 rounded-md bg-success-50 border border-success-200 dark:bg-success-900/20 dark:border-success-800"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-success-700 dark:text-success-300">
            {success}
          </p>
        </div>
      )}
      
      {/* Basic Information Section */}
      <fieldset className="space-y-4">
        <legend className="text-base font-medium text-gray-900 dark:text-white">
          Basic Information
        </legend>
        <div className={fieldGroupVariants({ layout: "grid" })}>
          {basicFields.map(renderFormField)}
        </div>
      </fieldset>
      
      {/* Relationship Configuration Section */}
      <fieldset className="space-y-4">
        <legend className="text-base font-medium text-gray-900 dark:text-white">
          Relationship Configuration
        </legend>
        <div className={fieldGroupVariants({ layout: "stack" })}>
          {relationshipFields.map(renderFormField)}
        </div>
      </fieldset>
      
      {/* Junction Table Configuration (Many-to-Many only) */}
      {watchedType === 'many_many' && (
        <fieldset className="space-y-4">
          <legend className="text-base font-medium text-gray-900 dark:text-white">
            Junction Table Configuration
            <span className="block text-sm font-normal text-gray-600 dark:text-gray-400 mt-1">
              Required for many-to-many relationships
            </span>
          </legend>
          <div className={fieldGroupVariants({ layout: "stack" })}>
            {junctionFields.map(renderFormField)}
          </div>
        </fieldset>
      )}
      
      {/* Settings Section */}
      <fieldset className="space-y-4">
        <legend className="text-base font-medium text-gray-900 dark:text-white">
          Settings
        </legend>
        <div className={fieldGroupVariants({ layout: "inline" })}>
          {settingsFields.map(renderFormField)}
        </div>
      </fieldset>
      
      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={isSubmitting || isValidating}
          disabled={!isValid || !isDirty}
          loadingText={mode === 'create' ? 'Creating...' : 'Updating...'}
          className="order-2 sm:order-1"
          data-testid={`${testId}-submit`}
        >
          {mode === 'create' ? 'Create Relationship' : 'Update Relationship'}
        </Button>
        
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={handleReset}
          disabled={!isDirty || isSubmitting}
          className="order-3 sm:order-2"
          data-testid={`${testId}-reset`}
        >
          Reset
        </Button>
        
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onCancel}
            disabled={isSubmitting}
            className="order-1 sm:order-3 sm:ml-auto"
            data-testid={`${testId}-cancel`}
          >
            Cancel
          </Button>
        )}
      </div>
      
      {/* Form Validation Summary for Screen Readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {Object.keys(errors).length > 0 && (
          `Form has ${Object.keys(errors).length} validation error${Object.keys(errors).length === 1 ? '' : 's'}`
        )}
        {isSubmitting && 'Submitting form...'}
        {isValidating && 'Validating form data...'}
      </div>
    </form>
  );
};

/**
 * Component display name for debugging
 */
RelationshipForm.displayName = 'RelationshipForm';

/**
 * Export types for external usage
 */
export type {
  RelationshipFormProps,
  RelationshipFormData,
  RelationshipFormValues,
  RelationshipType,
} from './validation-schemas';

/**
 * Export variant types for styling customization
 */
export type RelationshipFormVariants = VariantProps<typeof formSectionVariants>;

/**
 * Default export for convenient importing
 */
export default RelationshipForm;