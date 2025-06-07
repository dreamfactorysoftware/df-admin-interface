/**
 * @fileoverview Field Form Component - React/Next.js Migration
 * 
 * Comprehensive database field configuration form using React Hook Form with Zod validation.
 * Handles all field attributes (name, type, constraints, relationships) with real-time validation,
 * dynamic control enabling/disabling based on field type selection, and integration with the 
 * df-function-use component for database function management.
 * 
 * @version 2.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useController, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Switch } from '@headlessui/react';
import { 
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
  Label,
  Description
} from '@headlessui/react';
import { 
  ChevronUpDownIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BeakerIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

import {
  DatabaseSchemaFieldType,
  FieldFormData,
  CreateFieldSchema,
  UpdateFieldSchema,
  DbFunctionUseType
} from './df-field-details.types';

/**
 * Enhanced Zod schema for field form with conditional validation
 */
const FieldFormSchema = z.object({
  name: z.string()
    .min(1, 'Field name is required')
    .max(64, 'Field name must be 64 characters or less')
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Field name must be a valid identifier'),
  
  type: z.string().min(1, 'Field type is required'),
  
  label: z.string()
    .min(1, 'Field label is required')
    .max(128, 'Field label must be 128 characters or less'),
  
  allowNull: z.boolean().default(true),
  required: z.boolean().default(false),
  
  description: z.string()
    .max(512, 'Description must be 512 characters or less')
    .nullable()
    .optional(),
  
  default: z.string()
    .max(255, 'Default value must be 255 characters or less')
    .nullable()
    .optional(),
  
  length: z.number()
    .int()
    .min(1, 'Length must be positive')
    .max(2147483647, 'Length too large')
    .nullable()
    .optional(),
  
  precision: z.number()
    .int()
    .min(1, 'Precision must be positive')
    .max(65, 'Precision cannot exceed 65')
    .nullable()
    .optional(),
  
  scale: z.number()
    .int()
    .min(0, 'Scale must be non-negative')
    .max(30, 'Scale cannot exceed 30')
    .default(0),
  
  // Advanced properties
  isPrimaryKey: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  autoIncrement: z.boolean().default(false),
  isForeignKey: z.boolean().default(false),
  
  // Foreign key relationships
  refTable: z.string()
    .min(1, 'Referenced table is required when foreign key is enabled')
    .nullable()
    .optional(),
  
  refField: z.string()
    .min(1, 'Referenced field is required when foreign key is enabled')
    .nullable()
    .optional(),
  
  refOnDelete: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'])
    .nullable()
    .optional(),
  
  refOnUpdate: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'])
    .nullable()
    .optional(),
  
  // Database function support
  dbFunction: z.array(z.object({
    use: z.array(z.string()).min(1, 'At least one function use is required'),
    function: z.string().min(1, 'Function name is required'),
  })).nullable().optional(),
  
  // Other properties
  picklist: z.string().nullable().optional(),
  validation: z.string().nullable().optional(),
  fixedLength: z.boolean().default(false),
  supportsMultibyte: z.boolean().default(false),
  isVirtual: z.boolean().default(false),
  isAggregate: z.boolean().default(false),
}).refine((data) => {
  // Custom validation: require reference fields when foreign key is enabled
  if (data.isForeignKey) {
    return data.refTable && data.refField;
  }
  return true;
}, {
  message: "Referenced table and field are required when foreign key is enabled",
  path: ["refTable"]
}).refine((data) => {
  // Custom validation: length required for certain types
  const typesRequiringLength = ['varchar', 'char', 'string', 'text'];
  if (typesRequiringLength.includes(data.type.toLowerCase()) && !data.length) {
    return false;
  }
  return true;
}, {
  message: "Length is required for this field type",
  path: ["length"]
}).refine((data) => {
  // Custom validation: precision required for decimal types
  const decimalTypes = ['decimal', 'numeric', 'float', 'double'];
  if (decimalTypes.includes(data.type.toLowerCase()) && !data.precision) {
    return false;
  }
  return true;
}, {
  message: "Precision is required for numeric field types",
  path: ["precision"]
});

/**
 * Form data type inferred from schema
 */
type FormData = z.infer<typeof FieldFormSchema>;

/**
 * Component props interface
 */
export interface FieldFormProps {
  /** Current field being edited (null for create mode) */
  field?: DatabaseSchemaFieldType | null;
  /** Whether form is in edit mode vs create mode */
  mode?: 'create' | 'edit' | 'view';
  /** Table ID for context */
  tableId: string;
  /** Service ID for context */
  serviceId: string;
  /** Available field types for the database */
  availableTypes?: Array<{ value: string; label: string; category?: string }>;
  /** Available tables for foreign key references */
  availableTables?: Array<{ value: string; label: string }>;
  /** Whether form is loading */
  isLoading?: boolean;
  /** Whether form is disabled */
  disabled?: boolean;
  /** Form submission handler */
  onSubmit: (data: FormData) => Promise<void>;
  /** Form cancellation handler */
  onCancel?: () => void;
  /** Form change handler for auto-save */
  onChange?: (data: Partial<FormData>) => void;
  /** Validation error handler */
  onValidationError?: (errors: Record<string, any>) => void;
  /** Field deletion handler (edit mode only) */
  onDelete?: () => Promise<void>;
  /** Custom CSS classes */
  className?: string;
}

// ============================================================================
// FIELD TYPE DEFINITIONS AND HELPERS
// ============================================================================

/**
 * Default field types grouped by category
 */
const DEFAULT_FIELD_TYPES = [
  // String types
  { value: 'string', label: 'String', category: 'Text' },
  { value: 'text', label: 'Text', category: 'Text' },
  { value: 'varchar', label: 'VARCHAR', category: 'Text' },
  { value: 'char', label: 'CHAR', category: 'Text' },
  
  // Numeric types
  { value: 'integer', label: 'Integer', category: 'Numeric' },
  { value: 'bigint', label: 'Big Integer', category: 'Numeric' },
  { value: 'smallint', label: 'Small Integer', category: 'Numeric' },
  { value: 'decimal', label: 'Decimal', category: 'Numeric' },
  { value: 'float', label: 'Float', category: 'Numeric' },
  { value: 'double', label: 'Double', category: 'Numeric' },
  
  // Date/Time types
  { value: 'date', label: 'Date', category: 'Date/Time' },
  { value: 'time', label: 'Time', category: 'Date/Time' },
  { value: 'datetime', label: 'DateTime', category: 'Date/Time' },
  { value: 'timestamp', label: 'Timestamp', category: 'Date/Time' },
  
  // Other types
  { value: 'boolean', label: 'Boolean', category: 'Other' },
  { value: 'json', label: 'JSON', category: 'Other' },
  { value: 'binary', label: 'Binary', category: 'Other' },
  { value: 'uuid', label: 'UUID', category: 'Other' },
];

/**
 * Foreign key action options
 */
const FOREIGN_KEY_ACTIONS = [
  { value: 'CASCADE', label: 'CASCADE' },
  { value: 'SET NULL', label: 'SET NULL' },
  { value: 'RESTRICT', label: 'RESTRICT' },
  { value: 'NO ACTION', label: 'NO ACTION' },
];

/**
 * Helper function to determine if field type supports length
 */
const supportsLength = (type: string): boolean => {
  const lengthTypes = ['varchar', 'char', 'string', 'text', 'binary'];
  return lengthTypes.includes(type.toLowerCase());
};

/**
 * Helper function to determine if field type supports precision/scale
 */
const supportsPrecisionScale = (type: string): boolean => {
  const precisionTypes = ['decimal', 'numeric', 'float', 'double'];
  return precisionTypes.includes(type.toLowerCase());
};

/**
 * Helper function to determine if field type supports auto increment
 */
const supportsAutoIncrement = (type: string): boolean => {
  const autoIncrementTypes = ['integer', 'bigint', 'smallint'];
  return autoIncrementTypes.includes(type.toLowerCase());
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Field Form Component
 * 
 * Provides comprehensive database field configuration with real-time validation,
 * dynamic control management, and integration with function-use components.
 */
export default function FieldForm({
  field = null,
  mode = 'create',
  tableId,
  serviceId,
  availableTypes = DEFAULT_FIELD_TYPES,
  availableTables = [],
  isLoading = false,
  disabled = false,
  onSubmit,
  onCancel,
  onChange,
  onValidationError,
  onDelete,
  className
}: FieldFormProps) {
  
  // ========================================================================
  // STATE AND FORM SETUP
  // ========================================================================
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [functionUseDialogOpen, setFunctionUseDialogOpen] = useState(false);
  
  // Initialize form with React Hook Form and Zod validation
  const form = useForm<FormData>({
    resolver: zodResolver(FieldFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: useMemo(() => ({
      name: field?.name || '',
      type: field?.type || '',
      label: field?.label || '',
      allowNull: field?.allowNull ?? true,
      required: field?.required ?? false,
      description: field?.description || '',
      default: field?.default || '',
      length: field?.length || null,
      precision: field?.precision || null,
      scale: field?.scale || 0,
      isPrimaryKey: field?.isPrimaryKey ?? false,
      isUnique: field?.isUnique ?? false,
      autoIncrement: field?.autoIncrement ?? false,
      isForeignKey: field?.isForeignKey ?? false,
      refTable: field?.refTable || '',
      refField: field?.refField || '',
      refOnDelete: field?.refOnDelete || null,
      refOnUpdate: field?.refOnUpdate || null,
      dbFunction: field?.dbFunction || null,
      picklist: field?.picklist || '',
      validation: field?.validation || '',
      fixedLength: field?.fixedLength ?? false,
      supportsMultibyte: field?.supportsMultibyte ?? false,
      isVirtual: field?.isVirtual ?? false,
      isAggregate: field?.isAggregate ?? false,
    }), [field]),
  });
  
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isValid, isDirty, touchedFields }
  } = form;
  
  // Watch key fields for dynamic behavior
  const watchedType = useWatch({ control, name: 'type' });
  const watchedIsForeignKey = useWatch({ control, name: 'isForeignKey' });
  const watchedIsPrimaryKey = useWatch({ control, name: 'isPrimaryKey' });
  const watchedAutoIncrement = useWatch({ control, name: 'autoIncrement' });
  
  // ========================================================================
  // DYNAMIC FORM BEHAVIOR
  // ========================================================================
  
  // Effect to handle field type changes and enable/disable relevant controls
  useEffect(() => {
    if (!watchedType) return;
    
    // Clear length when not supported
    if (!supportsLength(watchedType)) {
      setValue('length', null);
      clearErrors('length');
    }
    
    // Clear precision/scale when not supported
    if (!supportsPrecisionScale(watchedType)) {
      setValue('precision', null);
      setValue('scale', 0);
      clearErrors(['precision', 'scale']);
    }
    
    // Disable auto increment for unsupported types
    if (!supportsAutoIncrement(watchedType) && watchedAutoIncrement) {
      setValue('autoIncrement', false);
      clearErrors('autoIncrement');
    }
    
    // Primary keys cannot be null and are required
    if (watchedIsPrimaryKey) {
      setValue('allowNull', false);
      setValue('required', true);
      clearErrors(['allowNull', 'required']);
    }
    
  }, [watchedType, watchedAutoIncrement, watchedIsPrimaryKey, setValue, clearErrors]);
  
  // Effect to handle foreign key relationship changes
  useEffect(() => {
    if (!watchedIsForeignKey) {
      setValue('refTable', '');
      setValue('refField', '');
      setValue('refOnDelete', null);
      setValue('refOnUpdate', null);
      clearErrors(['refTable', 'refField', 'refOnDelete', 'refOnUpdate']);
    }
  }, [watchedIsForeignKey, setValue, clearErrors]);
  
  // Effect to call onChange handler when form data changes
  useEffect(() => {
    if (onChange && isDirty) {
      const subscription = watch((data) => {
        onChange(data as Partial<FormData>);
      });
      return () => subscription.unsubscribe();
    }
  }, [watch, onChange, isDirty]);
  
  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================
  
  const handleFormSubmit = useCallback(async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Field form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit]);
  
  const handleFormError = useCallback((errors: Record<string, any>) => {
    console.warn('Field form validation errors:', errors);
    onValidationError?.(errors);
  }, [onValidationError]);
  
  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    
    try {
      setIsSubmitting(true);
      await onDelete();
    } catch (error) {
      console.error('Field deletion error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [onDelete]);
  
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);
  
  // ========================================================================
  // RENDER HELPERS
  // ========================================================================
  
  /**
   * Render field type selector with grouped options
   */
  const renderTypeSelector = useCallback(() => {
    const groupedTypes = availableTypes.reduce((groups, type) => {
      const category = type.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(type);
      return groups;
    }, {} as Record<string, typeof availableTypes>);
    
    return (
      <div className="space-y-2">
        <Label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
          Field Type <span className="text-red-500">*</span>
        </Label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Listbox value={field.value} onChange={field.onChange} disabled={disabled || isLoading}>
              <div className="relative">
                <ListboxButton className={cn(
                  "relative w-full cursor-default rounded-lg bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm",
                  "border border-gray-300 dark:border-gray-600",
                  errors.type && "border-red-500 dark:border-red-400",
                  (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                )}>
                  <span className="block truncate text-gray-900 dark:text-gray-100">
                    {field.value ? availableTypes.find(t => t.value === field.value)?.label || field.value : 'Select a type...'}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </ListboxButton>
                <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {Object.entries(groupedTypes).map(([category, types]) => (
                    <div key={category}>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                        {category}
                      </div>
                      {types.map((type) => (
                        <ListboxOption
                          key={type.value}
                          value={type.value}
                          className={({ active, selected }) => cn(
                            "relative cursor-default select-none py-2 pl-10 pr-4",
                            active ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100" : "text-gray-900 dark:text-gray-100"
                          )}
                        >
                          {({ selected }) => (
                            <>
                              <span className={cn("block truncate", selected ? "font-medium" : "font-normal")}>
                                {type.label}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                              )}
                            </>
                          )}
                        </ListboxOption>
                      ))}
                    </div>
                  ))}
                </ListboxOptions>
              </div>
            </Listbox>
          )}
        />
        {errors.type && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <ExclamationTriangleIcon className="h-4 w-4" />
            {errors.type.message}
          </p>
        )}
      </div>
    );
  }, [availableTypes, control, errors.type, disabled, isLoading]);
  
  /**
   * Render constraint toggles section
   */
  const renderConstraintToggles = useCallback(() => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Constraints</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Primary Key Toggle */}
        <Controller
          name="isPrimaryKey"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Primary Key
                </Label>
                <Description className="text-sm text-gray-500 dark:text-gray-400">
                  Uniquely identifies each record
                </Description>
              </div>
              <Switch
                checked={field.value}
                onChange={field.onChange}
                disabled={disabled || isLoading}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  field.value ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700",
                  (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    field.value ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </Switch>
            </div>
          )}
        />
        
        {/* Unique Toggle */}
        <Controller
          name="isUnique"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Unique
                </Label>
                <Description className="text-sm text-gray-500 dark:text-gray-400">
                  Values must be unique across records
                </Description>
              </div>
              <Switch
                checked={field.value}
                onChange={field.onChange}
                disabled={disabled || isLoading || watchedIsPrimaryKey}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  field.value ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700",
                  (disabled || isLoading || watchedIsPrimaryKey) && "opacity-50 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    field.value ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </Switch>
            </div>
          )}
        />
        
        {/* Allow Null Toggle */}
        <Controller
          name="allowNull"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Allow Null
                </Label>
                <Description className="text-sm text-gray-500 dark:text-gray-400">
                  Field can have null values
                </Description>
              </div>
              <Switch
                checked={field.value}
                onChange={field.onChange}
                disabled={disabled || isLoading || watchedIsPrimaryKey}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  field.value ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700",
                  (disabled || isLoading || watchedIsPrimaryKey) && "opacity-50 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    field.value ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </Switch>
            </div>
          )}
        />
        
        {/* Required Toggle */}
        <Controller
          name="required"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Required
                </Label>
                <Description className="text-sm text-gray-500 dark:text-gray-400">
                  Field is required for record creation
                </Description>
              </div>
              <Switch
                checked={field.value}
                onChange={field.onChange}
                disabled={disabled || isLoading}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  field.value ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700",
                  (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    field.value ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </Switch>
            </div>
          )}
        />
        
        {/* Auto Increment Toggle (only for supported types) */}
        {supportsAutoIncrement(watchedType) && (
          <Controller
            name="autoIncrement"
            control={control}
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Auto Increment
                  </Label>
                  <Description className="text-sm text-gray-500 dark:text-gray-400">
                    Automatically increment value
                  </Description>
                </div>
                <Switch
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={disabled || isLoading}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    field.value ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700",
                    (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      field.value ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </Switch>
              </div>
            )}
          />
        )}
      </div>
    </div>
  ), [control, disabled, isLoading, watchedIsPrimaryKey, watchedType]);
  
  // ========================================================================
  // MAIN RENDER
  // ========================================================================
  
  return (
    <div className={cn("space-y-8", className)}>
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(handleFormSubmit, handleFormError)} className="space-y-6">
          
          {/* Basic Information Section */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Field Name */}
              <div className="space-y-2">
                <Label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Field Name <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      disabled={disabled || isLoading || mode === 'edit'}
                      className={cn(
                        "block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",
                        errors.name && "border-red-500 dark:border-red-400",
                        (disabled || isLoading || mode === 'edit') && "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900"
                      )}
                      placeholder="Enter field name (e.g., user_id, first_name)"
                    />
                  )}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    {errors.name.message}
                  </p>
                )}
                {mode === 'edit' && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <InformationCircleIcon className="h-4 w-4" />
                    Field name cannot be changed in edit mode
                  </p>
                )}
              </div>
              
              {/* Field Label */}
              <div className="space-y-2">
                <Label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Display Label <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="label"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      disabled={disabled || isLoading}
                      className={cn(
                        "block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",
                        errors.label && "border-red-500 dark:border-red-400",
                        (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                      )}
                      placeholder="Enter display label (e.g., User ID, First Name)"
                    />
                  )}
                />
                {errors.label && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    {errors.label.message}
                  </p>
                )}
              </div>
              
              {/* Field Type */}
              <div className="lg:col-span-2">
                {renderTypeSelector()}
              </div>
              
              {/* Description */}
              <div className="lg:col-span-2 space-y-2">
                <Label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Description
                </Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      disabled={disabled || isLoading}
                      className={cn(
                        "block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",
                        errors.description && "border-red-500 dark:border-red-400",
                        (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                      )}
                      placeholder="Enter field description..."
                    />
                  )}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Type-Specific Configuration */}
          {watchedType && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Type Configuration
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Length (for string types) */}
                {supportsLength(watchedType) && (
                  <div className="space-y-2">
                    <Label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                      Length {supportsLength(watchedType) && <span className="text-red-500">*</span>}
                    </Label>
                    <Controller
                      name="length"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="1"
                          max="2147483647"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          disabled={disabled || isLoading}
                          className={cn(
                            "block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",
                            errors.length && "border-red-500 dark:border-red-400",
                            (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                          )}
                          placeholder="e.g., 255"
                        />
                      )}
                    />
                    {errors.length && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        {errors.length.message}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Precision (for numeric types) */}
                {supportsPrecisionScale(watchedType) && (
                  <div className="space-y-2">
                    <Label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                      Precision <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="precision"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="1"
                          max="65"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          disabled={disabled || isLoading}
                          className={cn(
                            "block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",
                            errors.precision && "border-red-500 dark:border-red-400",
                            (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                          )}
                          placeholder="e.g., 10"
                        />
                      )}
                    />
                    {errors.precision && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        {errors.precision.message}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Scale (for numeric types) */}
                {supportsPrecisionScale(watchedType) && (
                  <div className="space-y-2">
                    <Label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                      Scale
                    </Label>
                    <Controller
                      name="scale"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="0"
                          max="30"
                          disabled={disabled || isLoading}
                          className={cn(
                            "block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",
                            errors.scale && "border-red-500 dark:border-red-400",
                            (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                          )}
                          placeholder="e.g., 2"
                        />
                      )}
                    />
                    {errors.scale && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        {errors.scale.message}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Default Value */}
                <div className="space-y-2">
                  <Label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Default Value
                  </Label>
                  <Controller
                    name="default"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        disabled={disabled || isLoading}
                        className={cn(
                          "block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",
                          errors.default && "border-red-500 dark:border-red-400",
                          (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                        )}
                        placeholder="Enter default value..."
                      />
                    )}
                  />
                  {errors.default && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      {errors.default.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Constraints Section */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {renderConstraintToggles()}
          </div>
          
          {/* Foreign Key Configuration */}
          {watchedIsForeignKey && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
                Foreign Key Configuration
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Referenced Table */}
                <div className="space-y-2">
                  <Label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Referenced Table <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="refTable"
                    control={control}
                    render={({ field }) => (
                      <Listbox value={field.value} onChange={field.onChange} disabled={disabled || isLoading}>
                        <div className="relative">
                          <ListboxButton className={cn(
                            "relative w-full cursor-default rounded-lg bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm",
                            "border border-gray-300 dark:border-gray-600",
                            errors.refTable && "border-red-500 dark:border-red-400",
                            (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                          )}>
                            <span className="block truncate text-gray-900 dark:text-gray-100">
                              {field.value || 'Select a table...'}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </span>
                          </ListboxButton>
                          <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {availableTables.map((table) => (
                              <ListboxOption
                                key={table.value}
                                value={table.value}
                                className={({ active }) => cn(
                                  "relative cursor-default select-none py-2 pl-10 pr-4",
                                  active ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100" : "text-gray-900 dark:text-gray-100"
                                )}
                              >
                                {({ selected }) => (
                                  <>
                                    <span className={cn("block truncate", selected ? "font-medium" : "font-normal")}>
                                      {table.label}
                                    </span>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </ListboxOption>
                            ))}
                          </ListboxOptions>
                        </div>
                      </Listbox>
                    )}
                  />
                  {errors.refTable && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      {errors.refTable.message}
                    </p>
                  )}
                </div>
                
                {/* Referenced Field */}
                <div className="space-y-2">
                  <Label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Referenced Field <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="refField"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        disabled={disabled || isLoading}
                        className={cn(
                          "block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",
                          errors.refField && "border-red-500 dark:border-red-400",
                          (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                        )}
                        placeholder="Enter referenced field name..."
                      />
                    )}
                  />
                  {errors.refField && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      {errors.refField.message}
                    </p>
                  )}
                </div>
                
                {/* On Delete Action */}
                <div className="space-y-2">
                  <Label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    On Delete
                  </Label>
                  <Controller
                    name="refOnDelete"
                    control={control}
                    render={({ field }) => (
                      <Listbox value={field.value} onChange={field.onChange} disabled={disabled || isLoading}>
                        <div className="relative">
                          <ListboxButton className={cn(
                            "relative w-full cursor-default rounded-lg bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm",
                            "border border-gray-300 dark:border-gray-600",
                            (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                          )}>
                            <span className="block truncate text-gray-900 dark:text-gray-100">
                              {field.value || 'Select action...'}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </span>
                          </ListboxButton>
                          <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {FOREIGN_KEY_ACTIONS.map((action) => (
                              <ListboxOption
                                key={action.value}
                                value={action.value}
                                className={({ active }) => cn(
                                  "relative cursor-default select-none py-2 pl-10 pr-4",
                                  active ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100" : "text-gray-900 dark:text-gray-100"
                                )}
                              >
                                {({ selected }) => (
                                  <>
                                    <span className={cn("block truncate", selected ? "font-medium" : "font-normal")}>
                                      {action.label}
                                    </span>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </ListboxOption>
                            ))}
                          </ListboxOptions>
                        </div>
                      </Listbox>
                    )}
                  />
                </div>
                
                {/* On Update Action */}
                <div className="space-y-2">
                  <Label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    On Update
                  </Label>
                  <Controller
                    name="refOnUpdate"
                    control={control}
                    render={({ field }) => (
                      <Listbox value={field.value} onChange={field.onChange} disabled={disabled || isLoading}>
                        <div className="relative">
                          <ListboxButton className={cn(
                            "relative w-full cursor-default rounded-lg bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm",
                            "border border-gray-300 dark:border-gray-600",
                            (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                          )}>
                            <span className="block truncate text-gray-900 dark:text-gray-100">
                              {field.value || 'Select action...'}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </span>
                          </ListboxButton>
                          <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {FOREIGN_KEY_ACTIONS.map((action) => (
                              <ListboxOption
                                key={action.value}
                                value={action.value}
                                className={({ active }) => cn(
                                  "relative cursor-default select-none py-2 pl-10 pr-4",
                                  active ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100" : "text-gray-900 dark:text-gray-100"
                                )}
                              >
                                {({ selected }) => (
                                  <>
                                    <span className={cn("block truncate", selected ? "font-medium" : "font-normal")}>
                                      {action.label}
                                    </span>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </ListboxOption>
                            ))}
                          </ListboxOptions>
                        </div>
                      </Listbox>
                    )}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Advanced Options (Collapsible) */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Advanced Options
              </h3>
              <ChevronUpDownIcon 
                className={cn(
                  "h-5 w-5 text-gray-400 transition-transform",
                  showAdvanced && "rotate-180"
                )}
              />
            </button>
            
            {showAdvanced && (
              <div className="mt-6 space-y-6">
                {/* Database Functions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Database Functions
                    </Label>
                    <button
                      type="button"
                      onClick={() => setFunctionUseDialogOpen(true)}
                      disabled={disabled || isLoading}
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md",
                        "bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                        (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <BeakerIcon className="h-4 w-4" />
                      Manage Functions
                    </button>
                  </div>
                  <Description className="text-sm text-gray-500 dark:text-gray-400">
                    Configure database functions to be applied to this field during operations.
                  </Description>
                </div>
                
                {/* Additional Advanced Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    name="fixedLength"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Fixed Length
                          </Label>
                          <Description className="text-sm text-gray-500 dark:text-gray-400">
                            Field has fixed character length
                          </Description>
                        </div>
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={disabled || isLoading}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            field.value ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700",
                            (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              field.value ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </Switch>
                      </div>
                    )}
                  />
                  
                  <Controller
                    name="supportsMultibyte"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Multibyte Support
                          </Label>
                          <Description className="text-sm text-gray-500 dark:text-gray-400">
                            Field supports multibyte characters
                          </Description>
                        </div>
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={disabled || isLoading}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            field.value ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700",
                            (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              field.value ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </Switch>
                      </div>
                    )}
                  />
                  
                  <Controller
                    name="isVirtual"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Virtual Field
                          </Label>
                          <Description className="text-sm text-gray-500 dark:text-gray-400">
                            Field is computed, not stored
                          </Description>
                        </div>
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={disabled || isLoading}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            field.value ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700",
                            (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              field.value ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </Switch>
                      </div>
                    )}
                  />
                  
                  <Controller
                    name="isAggregate"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Aggregate Field
                          </Label>
                          <Description className="text-sm text-gray-500 dark:text-gray-400">
                            Field represents aggregate data
                          </Description>
                        </div>
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={disabled || isLoading}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            field.value ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700",
                            (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              field.value ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </Switch>
                      </div>
                    )}
                  />
                </div>
                
                {/* Validation Rules */}
                <div className="space-y-2">
                  <Label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Validation Rules
                  </Label>
                  <Controller
                    name="validation"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={3}
                        disabled={disabled || isLoading}
                        className={cn(
                          "block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",
                          errors.validation && "border-red-500 dark:border-red-400",
                          (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                        )}
                        placeholder="Enter validation rules (e.g., regex patterns, constraints)..."
                      />
                    )}
                  />
                  {errors.validation && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      {errors.validation.message}
                    </p>
                  )}
                </div>
                
                {/* Picklist Values */}
                <div className="space-y-2">
                  <Label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Picklist Values
                  </Label>
                  <Controller
                    name="picklist"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={3}
                        disabled={disabled || isLoading}
                        className={cn(
                          "block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",
                          errors.picklist && "border-red-500 dark:border-red-400",
                          (disabled || isLoading) && "opacity-50 cursor-not-allowed"
                        )}
                        placeholder="Enter comma-separated values for enum/picklist fields..."
                      />
                    )}
                  />
                  {errors.picklist && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      {errors.picklist.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
            {/* Delete Button (Edit Mode Only) */}
            {mode === 'edit' && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={disabled || isLoading || isSubmitting}
                className={cn(
                  "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md",
                  "bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
                  "sm:order-first sm:mr-auto",
                  (disabled || isLoading || isSubmitting) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Cog6ToothIcon className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Field'
                )}
              </button>
            )}
            
            {/* Cancel Button */}
            <button
              type="button"
              onClick={handleCancel}
              disabled={disabled || isLoading || isSubmitting}
              className={cn(
                "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md",
                "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                (disabled || isLoading || isSubmitting) && "opacity-50 cursor-not-allowed"
              )}
            >
              Cancel
            </button>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={disabled || isLoading || isSubmitting || !isValid}
              className={cn(
                "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md",
                "bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                (disabled || isLoading || isSubmitting || !isValid) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Cog6ToothIcon className="h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Create Field' : 'Update Field'
              )}
            </button>
          </div>
        </form>
      </FormProvider>
      
      {/* TODO: Function Use Dialog */}
      {/* This would integrate with the df-function-use component when available */}
      {functionUseDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Database Functions Configuration
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Function configuration component will be integrated here.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setFunctionUseDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORT DEFAULT COMPONENT
// ============================================================================

export { FieldForm };