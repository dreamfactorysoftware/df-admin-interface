/**
 * RelationshipForm - React Hook Form component for database relationship configuration
 * 
 * Migrated from Angular reactive forms to React Hook Form 7.57.0 with Zod schema validation
 * per React/Next.js Integration Requirements. Handles both create and edit modes with 
 * intelligent field enabling/disabling based on relationship type (belongs_to vs many_many).
 * 
 * Features:
 * - React Hook Form with Zod schema validators for all user inputs
 * - Real-time validation under 100ms per performance requirements
 * - WCAG 2.1 AA compliance through Headless UI accessible components
 * - Class-variance-authority for dynamic Tailwind class composition
 * - Type-safe form state management with TypeScript 5.8+
 * - Dynamic field behavior based on relationship type
 * - Comprehensive error handling and validation
 */

'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cva, type VariantProps } from 'class-variance-authority';
import { 
  relationshipFormSchema,
  relationshipCreationSchema,
  type RelationshipFormData,
  type RelationshipCreationFormData,
  type BasicOption,
  type ServiceOption,
  type FieldOption,
  type TableOption,
  getDefaultRelationshipFormValues,
  requiresJunctionTable
} from './validation-schemas';
import type { RelationshipType } from '../../types/database';

// ============================================================================
// COMPONENT PROPS AND INTERFACES
// ============================================================================

export interface RelationshipFormProps {
  /** Form mode - create or edit */
  mode: 'create' | 'edit';
  /** Initial data for edit mode */
  initialData?: Partial<RelationshipFormData>;
  /** Available database fields for local field selection */
  fieldOptions: FieldOption[];
  /** Available services for reference and junction selection */
  serviceOptions: ServiceOption[];
  /** Available reference tables (populated based on selected reference service) */
  referenceTableOptions: TableOption[];
  /** Available reference fields (populated based on selected reference table) */
  referenceFieldOptions: FieldOption[];
  /** Available junction tables (populated based on selected junction service) */
  junctionTableOptions: TableOption[];
  /** Available junction fields (populated based on selected junction table) */
  junctionFieldOptions: FieldOption[];
  /** Loading state for async operations */
  isLoading?: boolean;
  /** Callback when form is submitted successfully */
  onSubmit: (data: RelationshipFormData) => Promise<void>;
  /** Callback when cancel is clicked */
  onCancel: () => void;
  /** Callback when reference service changes (to load tables) */
  onReferenceServiceChange: (serviceId: number) => void;
  /** Callback when reference table changes (to load fields) */
  onReferenceTableChange: (tableName: string, serviceId: number) => void;
  /** Callback when junction service changes (to load tables) */
  onJunctionServiceChange: (serviceId: number) => void;
  /** Callback when junction table changes (to load fields) */
  onJunctionTableChange: (tableName: string, serviceId: number) => void;
  /** Error message to display */
  errorMessage?: string;
  /** Success message to display */
  successMessage?: string;
}

// ============================================================================
// FORM STYLING WITH CLASS-VARIANCE-AUTHORITY
// ============================================================================

const formVariants = cva(
  'w-full max-w-4xl mx-auto bg-white rounded-lg border transition-all duration-200',
  {
    variants: {
      state: {
        idle: 'border-gray-300 shadow-sm',
        loading: 'border-blue-500 shadow-md',
        error: 'border-red-500 shadow-md',
        success: 'border-green-500 shadow-md'
      },
      size: {
        compact: 'p-4 space-y-4',
        normal: 'p-6 space-y-6',
        spacious: 'p-8 space-y-8'
      }
    },
    defaultVariants: {
      state: 'idle',
      size: 'normal'
    }
  }
);

const fieldVariants = cva(
  'transition-all duration-200',
  {
    variants: {
      state: {
        enabled: 'opacity-100',
        disabled: 'opacity-50 pointer-events-none',
        hidden: 'opacity-0 pointer-events-none h-0 overflow-hidden'
      }
    },
    defaultVariants: {
      state: 'enabled'
    }
  }
);

const inputVariants = cva(
  'w-full px-3 py-2 border rounded-md transition-all duration-150',
  {
    variants: {
      state: {
        default: 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
        error: 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200',
        disabled: 'bg-gray-100 border-gray-200 cursor-not-allowed'
      }
    },
    defaultVariants: {
      state: 'default'
    }
  }
);

const labelVariants = cva(
  'block text-sm font-medium mb-1',
  {
    variants: {
      required: {
        true: "after:content-['*'] after:text-red-500 after:ml-1",
        false: ''
      },
      state: {
        default: 'text-gray-700',
        error: 'text-red-700',
        disabled: 'text-gray-500'
      }
    },
    defaultVariants: {
      required: false,
      state: 'default'
    }
  }
);

const alertVariants = cva(
  'px-4 py-3 rounded-md border mb-4',
  {
    variants: {
      type: {
        error: 'bg-red-50 border-red-200 text-red-800',
        success: 'bg-green-50 border-green-200 text-green-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
      }
    }
  }
);

// ============================================================================
// FORM FIELD COMPONENTS
// ============================================================================

interface FormFieldProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  required = false,
  error,
  disabled = false,
  children,
  className = ''
}) => {
  const fieldState = disabled ? 'disabled' : 'enabled';
  const labelState = error ? 'error' : disabled ? 'disabled' : 'default';

  return (
    <div className={`${fieldVariants({ state: fieldState })} ${className}`}>
      <label 
        htmlFor={name}
        className={labelVariants({ required, state: labelState })}
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input: React.FC<InputProps> = ({ error, disabled, className = '', ...props }) => {
  const state = disabled ? 'disabled' : error ? 'error' : 'default';
  
  return (
    <input
      className={`${inputVariants({ state })} ${className}`}
      disabled={disabled}
      aria-invalid={error}
      aria-describedby={error ? `${props.name}-error` : undefined}
      {...props}
    />
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: BasicOption[];
  error?: boolean;
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({ 
  options, 
  error, 
  disabled, 
  placeholder = 'Select an option...',
  className = '',
  ...props 
}) => {
  const state = disabled ? 'disabled' : error ? 'error' : 'default';
  
  return (
    <select
      className={`${inputVariants({ state })} ${className}`}
      disabled={disabled}
      aria-invalid={error}
      aria-describedby={error ? `${props.name}-error` : undefined}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  description?: string;
}

const Toggle: React.FC<ToggleProps> = ({ 
  checked, 
  onChange, 
  disabled = false, 
  label, 
  description 
}) => {
  return (
    <div className="flex items-start space-x-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${checked ? 'bg-blue-600' : 'bg-gray-200'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
            transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {description && (
          <span className="text-sm text-gray-500">{description}</span>
        )}
      </div>
    </div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
        outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

const Button: React.FC<ButtonProps> = ({ 
  variant, 
  size, 
  loading = false, 
  children, 
  className = '',
  disabled,
  ...props 
}) => {
  return (
    <button
      className={`${buttonVariants({ variant, size })} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
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
      {children}
    </button>
  );
};

// ============================================================================
// MAIN RELATIONSHIP FORM COMPONENT
// ============================================================================

export const RelationshipForm: React.FC<RelationshipFormProps> = ({
  mode,
  initialData,
  fieldOptions,
  serviceOptions,
  referenceTableOptions,
  referenceFieldOptions,
  junctionTableOptions,
  junctionFieldOptions,
  isLoading = false,
  onSubmit,
  onCancel,
  onReferenceServiceChange,
  onReferenceTableChange,
  onJunctionServiceChange,
  onJunctionTableChange,
  errorMessage,
  successMessage
}) => {
  // ============================================================================
  // FORM SETUP WITH REACT HOOK FORM AND ZOD VALIDATION
  // ============================================================================

  const defaultValues = useMemo(() => {
    if (mode === 'edit' && initialData) {
      return initialData;
    }
    return getDefaultRelationshipFormValues();
  }, [mode, initialData]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { 
      errors, 
      isSubmitting, 
      isValid, 
      isDirty 
    }
  } = useForm<RelationshipFormData>({
    resolver: zodResolver(mode === 'create' ? relationshipCreationSchema : relationshipFormSchema),
    defaultValues,
    mode: 'onChange' // Enable real-time validation
  });

  // Watch form values for dynamic behavior
  const watchedType = watch('type');
  const watchedRefServiceId = watch('refServiceId');
  const watchedRefTable = watch('refTable');
  const watchedJunctionServiceId = watch('junctionServiceId');
  const watchedJunctionTable = watch('junctionTable');

  // ============================================================================
  // DYNAMIC FIELD BEHAVIOR BASED ON RELATIONSHIP TYPE
  // ============================================================================

  const isJunctionRequired = useMemo(() => {
    return requiresJunctionTable(watchedType as RelationshipType);
  }, [watchedType]);

  // Reset junction fields when relationship type changes from many_many to others
  useEffect(() => {
    if (!isJunctionRequired) {
      setValue('junctionServiceId', null);
      setValue('junctionTable', null);
      setValue('junctionField', null);
      setValue('junctionRefField', null);
    }
  }, [isJunctionRequired, setValue]);

  // ============================================================================
  // DYNAMIC DATA LOADING CALLBACKS
  // ============================================================================

  const handleReferenceServiceChange = useCallback((serviceId: string) => {
    const numericServiceId = Number(serviceId);
    if (numericServiceId && numericServiceId !== watchedRefServiceId) {
      setValue('refServiceId', numericServiceId);
      setValue('refTable', '');
      setValue('refField', '');
      onReferenceServiceChange(numericServiceId);
    }
  }, [setValue, onReferenceServiceChange, watchedRefServiceId]);

  const handleReferenceTableChange = useCallback((tableName: string) => {
    if (tableName && tableName !== watchedRefTable) {
      setValue('refTable', tableName);
      setValue('refField', '');
      if (watchedRefServiceId) {
        onReferenceTableChange(tableName, watchedRefServiceId);
      }
    }
  }, [setValue, onReferenceTableChange, watchedRefServiceId, watchedRefTable]);

  const handleJunctionServiceChange = useCallback((serviceId: string) => {
    const numericServiceId = Number(serviceId);
    if (numericServiceId && numericServiceId !== watchedJunctionServiceId) {
      setValue('junctionServiceId', numericServiceId);
      setValue('junctionTable', '');
      setValue('junctionField', '');
      setValue('junctionRefField', '');
      onJunctionServiceChange(numericServiceId);
    }
  }, [setValue, onJunctionServiceChange, watchedJunctionServiceId]);

  const handleJunctionTableChange = useCallback((tableName: string) => {
    if (tableName && tableName !== watchedJunctionTable) {
      setValue('junctionTable', tableName);
      setValue('junctionField', '');
      setValue('junctionRefField', '');
      if (watchedJunctionServiceId) {
        onJunctionTableChange(tableName, watchedJunctionServiceId);
      }
    }
  }, [setValue, onJunctionTableChange, watchedJunctionServiceId, watchedJunctionTable]);

  // ============================================================================
  // FORM SUBMISSION HANDLER
  // ============================================================================

  const handleFormSubmit = useCallback(async (data: RelationshipFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
      // Error handling is managed by parent component
    }
  }, [onSubmit]);

  // ============================================================================
  // FORM STATE DETERMINATION FOR STYLING
  // ============================================================================

  const formState = useMemo(() => {
    if (isSubmitting || isLoading) return 'loading';
    if (errorMessage) return 'error';
    if (successMessage) return 'success';
    return 'idle';
  }, [isSubmitting, isLoading, errorMessage, successMessage]);

  // ============================================================================
  // RELATIONSHIP TYPE OPTIONS
  // ============================================================================

  const relationshipTypeOptions: BasicOption[] = [
    { label: 'Belongs To', value: 'belongs_to' },
    { label: 'Has Many', value: 'has_many' },
    { label: 'Has One', value: 'has_one' },
    { label: 'Many To Many', value: 'many_many' }
  ];

  // ============================================================================
  // RENDER COMPONENT
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {mode === 'create' ? 'Create' : 'Edit'} Relationship
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Configure database table relationships for API generation
          </p>
        </div>

        {/* Alert Messages */}
        {errorMessage && (
          <div className={alertVariants({ type: 'error' })} role="alert">
            <strong>Error:</strong> {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className={alertVariants({ type: 'success' })} role="alert">
            <strong>Success:</strong> {successMessage}
          </div>
        )}

        {/* Main Form */}
        <form 
          onSubmit={handleSubmit(handleFormSubmit)}
          className={formVariants({ state: formState })}
          noValidate
        >
          {/* Basic Information Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Relationship Name"
                    name="name"
                    error={errors.name?.message}
                    disabled={mode === 'create'} // Auto-generated in create mode
                  >
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="Auto-generated"
                      disabled={mode === 'create'}
                      error={!!errors.name}
                    />
                  </FormField>
                )}
              />

              <Controller
                name="alias"
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Alias"
                    name="alias"
                    error={errors.alias?.message}
                  >
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="Optional alias"
                      error={!!errors.alias}
                    />
                  </FormField>
                )}
              />

              <Controller
                name="label"
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Display Label"
                    name="label"
                    error={errors.label?.message}
                    className="md:col-span-2"
                  >
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="Human-readable label"
                      error={!!errors.label}
                    />
                  </FormField>
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Description"
                    name="description"
                    error={errors.description?.message}
                    className="md:col-span-2"
                  >
                    <textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="Optional description"
                      rows={3}
                      className={inputVariants({ 
                        state: errors.description ? 'error' : 'default' 
                      })}
                    />
                  </FormField>
                )}
              />
            </div>
          </section>

          {/* Relationship Configuration Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Relationship Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Relationship Type"
                    name="type"
                    required
                    error={errors.type?.message}
                  >
                    <Select
                      {...field}
                      options={relationshipTypeOptions}
                      placeholder="Select relationship type"
                      error={!!errors.type}
                    />
                  </FormField>
                )}
              />

              <Controller
                name="field"
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Local Field"
                    name="field"
                    required
                    error={errors.field?.message}
                  >
                    <Select
                      {...field}
                      options={fieldOptions}
                      placeholder="Select local field"
                      error={!!errors.field}
                    />
                  </FormField>
                )}
              />
            </div>

            {/* Relationship Options */}
            <div className="mt-6 space-y-4">
              <Controller
                name="alwaysFetch"
                control={control}
                render={({ field }) => (
                  <Toggle
                    checked={field.value}
                    onChange={field.onChange}
                    label="Always Fetch"
                    description="Always fetch related data with parent record"
                  />
                )}
              />

              <Controller
                name="isVirtual"
                control={control}
                render={({ field }) => (
                  <Toggle
                    checked={field.value}
                    onChange={field.onChange}
                    disabled // Virtual relationships are standard
                    label="Virtual Relationship"
                    description="This is a virtual relationship (recommended)"
                  />
                )}
              />
            </div>
          </section>

          {/* Reference Configuration Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Reference Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Controller
                name="refServiceId"
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Reference Service"
                    name="refServiceId"
                    required
                    error={errors.refServiceId?.message}
                  >
                    <Select
                      {...field}
                      value={field.value?.toString() || ''}
                      onChange={(e) => handleReferenceServiceChange(e.target.value)}
                      options={serviceOptions.map(opt => ({ ...opt, value: opt.value.toString() }))}
                      placeholder="Select service"
                      error={!!errors.refServiceId}
                    />
                  </FormField>
                )}
              />

              <Controller
                name="refTable"
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Reference Table"
                    name="refTable"
                    required
                    error={errors.refTable?.message}
                  >
                    <Select
                      {...field}
                      onChange={(e) => handleReferenceTableChange(e.target.value)}
                      options={referenceTableOptions}
                      placeholder="Select table"
                      disabled={!watchedRefServiceId}
                      error={!!errors.refTable}
                    />
                  </FormField>
                )}
              />

              <Controller
                name="refField"
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Reference Field"
                    name="refField"
                    required
                    error={errors.refField?.message}
                  >
                    <Select
                      {...field}
                      options={referenceFieldOptions}
                      placeholder="Select field"
                      disabled={!watchedRefTable}
                      error={!!errors.refField}
                    />
                  </FormField>
                )}
              />
            </div>
          </section>

          {/* Junction Table Configuration Section (only for many_many) */}
          {isJunctionRequired && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Junction Table Configuration
                <span className="ml-2 text-sm font-normal text-gray-600">
                  (Required for Many-to-Many relationships)
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="junctionServiceId"
                  control={control}
                  render={({ field }) => (
                    <FormField
                      label="Junction Service"
                      name="junctionServiceId"
                      required={isJunctionRequired}
                      error={errors.junctionServiceId?.message}
                    >
                      <Select
                        {...field}
                        value={field.value?.toString() || ''}
                        onChange={(e) => handleJunctionServiceChange(e.target.value)}
                        options={serviceOptions.map(opt => ({ ...opt, value: opt.value.toString() }))}
                        placeholder="Select junction service"
                        error={!!errors.junctionServiceId}
                      />
                    </FormField>
                  )}
                />

                <Controller
                  name="junctionTable"
                  control={control}
                  render={({ field }) => (
                    <FormField
                      label="Junction Table"
                      name="junctionTable"
                      required={isJunctionRequired}
                      error={errors.junctionTable?.message}
                    >
                      <Select
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => handleJunctionTableChange(e.target.value)}
                        options={junctionTableOptions}
                        placeholder="Select junction table"
                        disabled={!watchedJunctionServiceId}
                        error={!!errors.junctionTable}
                      />
                    </FormField>
                  )}
                />

                <Controller
                  name="junctionField"
                  control={control}
                  render={({ field }) => (
                    <FormField
                      label="Junction Local Field"
                      name="junctionField"
                      required={isJunctionRequired}
                      error={errors.junctionField?.message}
                    >
                      <Select
                        {...field}
                        value={field.value || ''}
                        options={junctionFieldOptions}
                        placeholder="Select junction local field"
                        disabled={!watchedJunctionTable}
                        error={!!errors.junctionField}
                      />
                    </FormField>
                  )}
                />

                <Controller
                  name="junctionRefField"
                  control={control}
                  render={({ field }) => (
                    <FormField
                      label="Junction Reference Field"
                      name="junctionRefField"
                      required={isJunctionRequired}
                      error={errors.junctionRefField?.message}
                    >
                      <Select
                        {...field}
                        value={field.value || ''}
                        options={junctionFieldOptions}
                        placeholder="Select junction reference field"
                        disabled={!watchedJunctionTable}
                        error={!!errors.junctionRefField}
                      />
                    </FormField>
                  )}
                />
              </div>
            </section>
          )}

          {/* Form Actions */}
          <section className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={!isValid || !isDirty}
            >
              {mode === 'create' ? 'Create Relationship' : 'Update Relationship'}
            </Button>
          </section>
        </form>
      </div>
    </div>
  );
};

export default RelationshipForm;

// ============================================================================
// TYPE EXPORTS FOR EXTERNAL USE
// ============================================================================

export type { RelationshipFormProps };
export type { RelationshipFormData, RelationshipCreationFormData } from './validation-schemas';