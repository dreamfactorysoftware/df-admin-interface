'use client';

/**
 * TableForm Component
 * 
 * React component providing form interface for table metadata editing including name, alias, 
 * label, plural, and description fields. Implements React Hook Form with Zod validation, 
 * real-time validation feedback, and responsive design. Supports both create and edit modes 
 * with proper form state management.
 * 
 * Features:
 * - React Hook Form 7.52+ integration with Zod schema validation
 * - Real-time validation under 100ms response time
 * - WCAG 2.1 AA accessibility compliance with proper ARIA attributes
 * - Tailwind CSS styling with responsive design across all device sizes
 * - Support for both create and edit modes with proper state management
 * - Focus management and keyboard navigation support
 * - Error handling with user-friendly validation messages
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';

// Import custom hooks for data management
import { useTableDetail, useCreateTable, useUpdateTable } from './hooks';

// Import types
import type { TableMetadata, TableFormData } from './types';

/**
 * Zod validation schema for table form
 * Enforces business rules and data integrity requirements
 */
const tableFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Table name is required')
    .max(64, 'Table name must be 64 characters or less')
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]*$/,
      'Table name must start with a letter and contain only letters, numbers, and underscores'
    ),
  alias: z
    .string()
    .max(64, 'Alias must be 64 characters or less')
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]*$/,
      'Alias must start with a letter and contain only letters, numbers, and underscores'
    )
    .optional()
    .or(z.literal('')),
  label: z
    .string()
    .max(128, 'Label must be 128 characters or less')
    .optional()
    .or(z.literal('')),
  plural: z
    .string()
    .max(128, 'Plural form must be 128 characters or less')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .max(512, 'Description must be 512 characters or less')
    .optional()
    .or(z.literal('')),
});

/**
 * Props interface for TableForm component
 */
export interface TableFormProps {
  /** Service name (database connection) */
  serviceName: string;
  /** Table name for edit mode, undefined for create mode */
  tableName?: string;
  /** Form mode - create or edit */
  mode: 'create' | 'edit';
  /** Optional initial data for the form */
  initialData?: Partial<TableFormData>;
  /** Callback fired when form is successfully submitted */
  onSuccess?: (data: TableMetadata) => void;
  /** Callback fired when form submission fails */
  onError?: (error: Error) => void;
  /** Callback fired when cancel button is clicked */
  onCancel?: () => void;
  /** Optional CSS class name for styling */
  className?: string;
  /** Whether to disable the form */
  disabled?: boolean;
}

/**
 * Shared input component with consistent styling and accessibility
 */
interface InputFieldProps {
  label: string;
  name: string;
  control: any;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  description?: string;
  maxLength?: number;
  className?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  control,
  error,
  required = false,
  disabled = false,
  placeholder,
  description,
  maxLength,
  className,
}) => {
  const inputId = `table-form-${name}`;
  const errorId = `${inputId}-error`;
  const descId = `${inputId}-description`;

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-900 dark:text-gray-100"
      >
        {label}
        {required && (
          <span className="ml-1 text-red-500 dark:text-red-400" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {description && (
        <p id={descId} className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}

      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <input
            {...field}
            id={inputId}
            type="text"
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className={cn(
              // Base styles
              'block w-full rounded-md border px-3 py-2 text-base',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'transition-colors duration-200',
              'min-h-[44px]', // WCAG touch target minimum
              
              // Focus styles with 3:1 contrast ratio
              'focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2',
              'focus:border-primary-600 dark:focus:ring-primary-500 dark:focus:border-primary-500',
              
              // Default state
              'border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800',
              'text-gray-900 dark:text-gray-100',
              
              // Error state
              error && [
                'border-red-500 dark:border-red-400',
                'focus:ring-red-500 focus:border-red-500',
                'dark:focus:ring-red-400 dark:focus:border-red-400',
              ],
              
              // Disabled state
              disabled && [
                'bg-gray-50 dark:bg-gray-700',
                'text-gray-500 dark:text-gray-400',
                'cursor-not-allowed',
                'border-gray-200 dark:border-gray-600',
              ],
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              description && descId,
              error && errorId
            )}
            aria-required={required}
          />
        )}
      />
      
      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Main TableForm component
 */
export const TableForm: React.FC<TableFormProps> = ({
  serviceName,
  tableName,
  mode,
  initialData,
  onSuccess,
  onError,
  onCancel,
  className,
  disabled = false,
}) => {
  // Fetch existing table data for edit mode
  const { data: tableData, isLoading: isLoadingTable } = useTableDetail(
    serviceName,
    tableName,
    { enabled: mode === 'edit' && !!tableName }
  );

  // Mutation hooks for create and update operations
  const createTableMutation = useCreateTable(serviceName);
  const updateTableMutation = useUpdateTable(serviceName);

  // Determine initial form values
  const defaultValues = useMemo<TableFormData>(() => {
    if (mode === 'edit' && tableData) {
      return {
        name: tableData.name || '',
        alias: tableData.alias || '',
        label: tableData.label || '',
        plural: tableData.plural || '',
        description: tableData.description || '',
      };
    }
    
    return {
      name: initialData?.name || '',
      alias: initialData?.alias || '',
      label: initialData?.label || '',
      plural: initialData?.plural || '',
      description: initialData?.description || '',
    };
  }, [mode, tableData, initialData]);

  // Initialize React Hook Form with Zod validation
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, isValid },
    reset,
    watch,
    setValue,
    trigger,
  } = useForm<TableFormData>({
    resolver: zodResolver(tableFormSchema),
    defaultValues,
    mode: 'onChange', // Enable real-time validation
  });

  // Reset form when default values change
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  // Auto-generate label and plural from name if they're empty
  const watchedName = watch('name');
  const watchedLabel = watch('label');
  const watchedPlural = watch('plural');

  useEffect(() => {
    if (watchedName && mode === 'create') {
      // Auto-generate label if empty
      if (!watchedLabel) {
        const generatedLabel = watchedName
          .replace(/([A-Z])/g, ' $1') // Add space before capital letters
          .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
          .trim();
        setValue('label', generatedLabel);
      }

      // Auto-generate plural if empty
      if (!watchedPlural) {
        const generatedPlural = watchedName.endsWith('s') 
          ? `${watchedName}es`
          : `${watchedName}s`;
        setValue('plural', generatedPlural);
      }
    }
  }, [watchedName, watchedLabel, watchedPlural, mode, setValue]);

  // Debounced real-time validation trigger
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      trigger(); // Trigger validation after 100ms delay
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [watchedName, trigger]);

  // Form submission handler
  const onSubmit = useCallback(async (data: TableFormData) => {
    try {
      let result: TableMetadata;
      
      if (mode === 'create') {
        // Create new table with default ID field
        const tablePayload = {
          ...data,
          field: [
            {
              alias: null,
              name: 'id',
              label: 'Id',
              description: null,
              native: [],
              type: 'id',
              dbType: null,
              length: null,
              precision: null,
              scale: null,
              default: null,
              required: false,
              allowNull: false,
              fixedLength: false,
              supportsMultibyte: false,
              autoIncrement: true,
              isPrimaryKey: true,
              isUnique: false,
              isIndex: false,
              isForeignKey: false,
              refTable: null,
              refField: null,
              refOnUpdate: null,
              refOnDelete: null,
              picklist: null,
              validation: null,
              dbFunction: null,
              isVirtual: false,
              isAggregate: false,
            },
          ],
        };
        
        result = await createTableMutation.mutateAsync(tablePayload);
      } else {
        // Update existing table
        if (!tableName) {
          throw new Error('Table name is required for update operation');
        }
        
        result = await updateTableMutation.mutateAsync({
          tableName,
          data,
        });
      }

      onSuccess?.(result);
    } catch (error) {
      console.error('Table form submission error:', error);
      onError?.(error instanceof Error ? error : new Error('Unknown error occurred'));
    }
  }, [mode, tableName, createTableMutation, updateTableMutation, onSuccess, onError]);

  // Loading state for edit mode
  if (mode === 'edit' && isLoadingTable) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading table details...</span>
      </div>
    );
  }

  const isFormDisabled = disabled || isSubmitting;
  const isMutating = createTableMutation.isPending || updateTableMutation.isPending;

  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Form Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {mode === 'create' ? 'Create New Table' : 'Edit Table Details'}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {mode === 'create' 
              ? 'Define the basic properties for your new database table.'
              : 'Modify the properties of the selected table.'
            }
          </p>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Table Name */}
          <InputField
            label="Table Name"
            name="name"
            control={control}
            error={errors.name?.message}
            required
            disabled={isFormDisabled || mode === 'edit'} // Name cannot be changed in edit mode
            placeholder="users"
            description="Database table name (letters, numbers, underscores only)"
            maxLength={64}
            className="md:col-span-1"
          />

          {/* Alias */}
          <InputField
            label="Alias"
            name="alias"
            control={control}
            error={errors.alias?.message}
            disabled={isFormDisabled}
            placeholder="user_table"
            description="Alternative name for API access"
            maxLength={64}
            className="md:col-span-1"
          />

          {/* Label */}
          <InputField
            label="Label"
            name="label"
            control={control}
            error={errors.label?.message}
            disabled={isFormDisabled}
            placeholder="Users"
            description="Human-readable display name"
            maxLength={128}
            className="md:col-span-1"
          />

          {/* Plural */}
          <InputField
            label="Plural Form"
            name="plural"
            control={control}
            error={errors.plural?.message}
            disabled={isFormDisabled}
            placeholder="Users"
            description="Plural form for API collections"
            maxLength={128}
            className="md:col-span-1"
          />

          {/* Description */}
          <div className="md:col-span-2">
            <InputField
              label="Description"
              name="description"
              control={control}
              error={errors.description?.message}
              disabled={isFormDisabled}
              placeholder="Stores user account information and preferences"
              description="Optional table description for documentation"
              maxLength={512}
            />
          </div>
        </div>

        {/* Error Display */}
        {(createTableMutation.error || updateTableMutation.error) && (
          <div 
            className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            role="alert"
            aria-live="polite"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg 
                  className="h-5 w-5 text-red-400" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error {mode === 'create' ? 'Creating' : 'Updating'} Table
                </h3>
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {(createTableMutation.error || updateTableMutation.error)?.message || 
                   'An unexpected error occurred. Please try again.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex-1 sm:flex-none order-2 sm:order-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={isFormDisabled || isMutating}
              className={cn(
                'w-full sm:w-auto inline-flex justify-center items-center',
                'px-6 py-2 text-sm font-medium rounded-md',
                'border border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-800',
                'text-gray-700 dark:text-gray-300',
                'hover:bg-gray-50 dark:hover:bg-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors duration-200',
                'min-h-[44px] min-w-[80px]', // WCAG touch targets
              )}
            >
              Cancel
            </button>
          </div>

          <div className="flex-1 sm:flex-none order-1 sm:order-2">
            <button
              type="submit"
              disabled={isFormDisabled || !isDirty || !isValid || isMutating}
              className={cn(
                'w-full sm:w-auto inline-flex justify-center items-center',
                'px-6 py-2 text-sm font-medium rounded-md',
                'bg-primary-600 hover:bg-primary-700',
                'text-white',
                'focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors duration-200',
                'min-h-[44px] min-w-[80px]', // WCAG touch targets
              )}
            >
              {isMutating && (
                <svg 
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                  fill="none" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {mode === 'create' ? 'Create Table' : 'Update Table'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TableForm;