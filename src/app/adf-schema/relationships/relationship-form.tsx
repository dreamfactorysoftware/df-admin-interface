'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Listbox, Transition } from '@headlessui/react';
import { Switch } from '@headlessui/react';
import { Fragment } from 'react';

import { RelationshipFormData, RelationshipType, Service, TableField } from './relationship.types';
import { useSchemaDiscovery } from '@/hooks/use-schema-discovery';
import { useRelationshipValidation } from '@/hooks/use-relationship-validation';
import { cn } from '@/lib/utils';

// Zod schema for comprehensive form validation with real-time feedback under 100ms
const relationshipSchema = z.object({
  name: z.string().optional(),
  alias: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  alwaysFetch: z.boolean().default(false),
  type: z.enum(['belongs_to', 'has_many', 'has_one', 'many_many'] as const, {
    required_error: 'Relationship type is required',
  }),
  isVirtual: z.boolean().default(true),
  field: z.string({
    required_error: 'Field is required',
  }).min(1, 'Field is required'),
  refServiceId: z.number({
    required_error: 'Reference service is required',
  }).min(1, 'Reference service is required'),
  refTable: z.string({
    required_error: 'Reference table is required',
  }).min(1, 'Reference table is required'),
  refField: z.string({
    required_error: 'Reference field is required',
  }).min(1, 'Reference field is required'),
  // Junction table fields - conditionally required for many_many relationships
  junctionServiceId: z.number().optional(),
  junctionTable: z.string().optional(),
  junctionField: z.string().optional(),
  junctionRefField: z.string().optional(),
}).superRefine((data, ctx) => {
  // Conditional validation for many-to-many relationships
  if (data.type === 'many_many') {
    if (!data.junctionServiceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Junction service is required for many-to-many relationships',
        path: ['junctionServiceId'],
      });
    }
    if (!data.junctionTable) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Junction table is required for many-to-many relationships',
        path: ['junctionTable'],
      });
    }
    if (!data.junctionField) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Junction field is required for many-to-many relationships',
        path: ['junctionField'],
      });
    }
    if (!data.junctionRefField) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Junction reference field is required for many-to-many relationships',
        path: ['junctionRefField'],
      });
    }
  }
});

interface BasicOption {
  label: string;
  value: string | number;
  name?: string;
}

interface RelationshipFormProps {
  mode: 'create' | 'edit';
  dbName: string;
  tableName: string;
  relationshipData?: Partial<RelationshipFormData>;
  fieldOptions: BasicOption[];
  serviceOptions: BasicOption[];
  onSubmit: (data: RelationshipFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function RelationshipForm({
  mode,
  dbName,
  tableName,
  relationshipData,
  fieldOptions,
  serviceOptions,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: RelationshipFormProps) {
  // Initialize React Hook Form with Zod validation for real-time validation under 100ms
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid, isDirty },
    clearErrors,
  } = useForm<RelationshipFormData>({
    resolver: zodResolver(relationshipSchema),
    mode: 'onChange', // Real-time validation
    defaultValues: {
      name: '',
      alias: '',
      label: '',
      description: '',
      alwaysFetch: false,
      type: undefined,
      isVirtual: true,
      field: '',
      refServiceId: undefined,
      refTable: '',
      refField: '',
      junctionServiceId: undefined,
      junctionTable: '',
      junctionField: '',
      junctionRefField: '',
      ...relationshipData,
    },
  });

  // Custom hooks for schema discovery and validation
  const { getTableOptions, getFieldOptions } = useSchemaDiscovery();
  const { validateRelationshipConfiguration } = useRelationshipValidation();

  // Watch form values for dynamic behavior
  const watchedType = watch('type');
  const watchedRefServiceId = watch('refServiceId');
  const watchedRefTable = watch('refTable');
  const watchedJunctionServiceId = watch('junctionServiceId');
  const watchedJunctionTable = watch('junctionTable');

  // Relationship type options
  const typeOptions: BasicOption[] = [
    { label: 'Belongs To', value: 'belongs_to' },
    { label: 'Has Many', value: 'has_many' },
    { label: 'Has One', value: 'has_one' },
    { label: 'Many To Many', value: 'many_many' },
  ];

  // Get service name helper function
  const getServiceName = (serviceId: number): string | undefined => {
    const service = serviceOptions.find(item => item.value === serviceId);
    return service?.name;
  };

  // React Query for reference table options with intelligent caching
  const {
    data: referenceTableOptions = [],
    isLoading: isLoadingRefTables,
    error: refTablesError,
  } = useQuery({
    queryKey: ['tables', watchedRefServiceId],
    queryFn: () => getTableOptions(getServiceName(watchedRefServiceId!)),
    enabled: !!watchedRefServiceId,
    staleTime: 300000, // 5 minutes
    cacheTime: 900000, // 15 minutes
  });

  // React Query for reference field options
  const {
    data: referenceFieldOptions = [],
    isLoading: isLoadingRefFields,
    error: refFieldsError,
  } = useQuery({
    queryKey: ['fields', watchedRefServiceId, watchedRefTable],
    queryFn: () => getFieldOptions(getServiceName(watchedRefServiceId!), watchedRefTable),
    enabled: !!(watchedRefServiceId && watchedRefTable),
    staleTime: 300000,
    cacheTime: 900000,
  });

  // React Query for junction table options
  const {
    data: junctionTableOptions = [],
    isLoading: isLoadingJunctionTables,
    error: junctionTablesError,
  } = useQuery({
    queryKey: ['tables', watchedJunctionServiceId],
    queryFn: () => getTableOptions(getServiceName(watchedJunctionServiceId!)),
    enabled: !!(watchedJunctionServiceId && watchedType === 'many_many'),
    staleTime: 300000,
    cacheTime: 900000,
  });

  // React Query for junction field options
  const {
    data: junctionFieldOptions = [],
    isLoading: isLoadingJunctionFields,
    error: junctionFieldsError,
  } = useQuery({
    queryKey: ['fields', watchedJunctionServiceId, watchedJunctionTable],
    queryFn: () => getFieldOptions(getServiceName(watchedJunctionServiceId!), watchedJunctionTable),
    enabled: !!(watchedJunctionServiceId && watchedJunctionTable && watchedType === 'many_many'),
    staleTime: 300000,
    cacheTime: 900000,
  });

  // Effect to handle cascade resets when reference service changes
  useEffect(() => {
    if (watchedRefServiceId) {
      setValue('refTable', '');
      setValue('refField', '');
      clearErrors(['refTable', 'refField']);
    }
  }, [watchedRefServiceId, setValue, clearErrors]);

  // Effect to handle cascade resets when reference table changes
  useEffect(() => {
    if (watchedRefTable) {
      setValue('refField', '');
      clearErrors(['refField']);
    }
  }, [watchedRefTable, setValue, clearErrors]);

  // Effect to handle cascade resets when junction service changes
  useEffect(() => {
    if (watchedJunctionServiceId && watchedType === 'many_many') {
      setValue('junctionTable', '');
      setValue('junctionField', '');
      setValue('junctionRefField', '');
      clearErrors(['junctionTable', 'junctionField', 'junctionRefField']);
    }
  }, [watchedJunctionServiceId, watchedType, setValue, clearErrors]);

  // Effect to handle cascade resets when junction table changes
  useEffect(() => {
    if (watchedJunctionTable && watchedType === 'many_many') {
      setValue('junctionField', '');
      setValue('junctionRefField', '');
      clearErrors(['junctionField', 'junctionRefField']);
    }
  }, [watchedJunctionTable, watchedType, setValue, clearErrors]);

  // Determine if junction fields should be enabled based on relationship type
  const isJunctionEnabled = watchedType === 'many_many';

  // Memoized validation state for performance optimization
  const validationState = useMemo(() => {
    return validateRelationshipConfiguration({
      type: watchedType,
      field: watch('field'),
      refServiceId: watchedRefServiceId,
      refTable: watchedRefTable,
      refField: watch('refField'),
      junctionServiceId: watchedJunctionServiceId,
      junctionTable: watchedJunctionTable,
      junctionField: watch('junctionField'),
      junctionRefField: watch('junctionRefField'),
    });
  }, [
    watchedType,
    watch('field'),
    watchedRefServiceId,
    watchedRefTable,
    watch('refField'),
    watchedJunctionServiceId,
    watchedJunctionTable,
    watch('junctionField'),
    watch('junctionRefField'),
    validateRelationshipConfiguration,
  ]);

  const handleFormSubmit = async (data: RelationshipFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to submit relationship form:', error);
    }
  };

  // Custom Select component using Headless UI for consistent styling
  const Select = ({ 
    options, 
    value, 
    onChange, 
    placeholder, 
    disabled = false, 
    loading = false,
    error 
  }: {
    options: BasicOption[];
    value: string | number | undefined;
    onChange: (value: any) => void;
    placeholder: string;
    disabled?: boolean;
    loading?: boolean;
    error?: string;
  }) => (
    <div className="relative">
      <Listbox value={value} onChange={onChange} disabled={disabled || loading}>
        <div className="relative">
          <Listbox.Button
            className={cn(
              'relative w-full cursor-default rounded-lg py-2 pl-3 pr-10 text-left',
              'border border-gray-300 bg-white shadow-sm',
              'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
              'dark:border-gray-600 dark:bg-gray-800 dark:text-white',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              loading && 'animate-pulse'
            )}
          >
            <span className={cn('block truncate', !value && 'text-gray-500')}>
              {loading ? 'Loading...' : (
                options.find(opt => opt.value === value)?.label || placeholder
              )}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 sm:text-sm">
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  className={({ active }) =>
                    cn(
                      'relative cursor-default select-none py-2 pl-3 pr-9',
                      active ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-gray-100'
                    )
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <span className={cn('block truncate', selected ? 'font-medium' : 'font-normal')}>
                      {option.label}
                    </span>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );

  // Custom Input component for text fields
  const Input = ({ 
    value, 
    onChange, 
    placeholder, 
    disabled = false,
    error 
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
    error?: string;
  }) => (
    <div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900',
          'placeholder-gray-500 shadow-sm',
          'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
          'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
          'dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
        )}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );

  // Custom Toggle component using Headless UI Switch
  const Toggle = ({ 
    checked, 
    onChange, 
    disabled = false,
    label 
  }: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    label: string;
  }) => (
    <div className="flex items-center">
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </Switch>
      <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
        {label}
      </span>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {mode === 'create' ? 'Create Relationship' : 'Edit Relationship'}
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Configure the database relationship between tables and services
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
        {/* Basic Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
              <span className="text-xs text-gray-500 ml-1">(auto-generated)</span>
            </label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Relationship name"
                  disabled={true}
                  error={errors.name?.message}
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Alias
            </label>
            <Controller
              name="alias"
              control={control}
              render={({ field }) => (
                <Input
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Relationship alias"
                  error={errors.alias?.message}
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Label
            </label>
            <Controller
              name="label"
              control={control}
              render={({ field }) => (
                <Input
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Display label"
                  error={errors.label?.message}
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Relationship description"
                  error={errors.description?.message}
                />
              )}
            />
          </div>
        </div>

        {/* Configuration Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Relationship Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Toggle Options */}
            <div className="space-y-4">
              <Controller
                name="alwaysFetch"
                control={control}
                render={({ field }) => (
                  <Toggle
                    checked={field.value}
                    onChange={field.onChange}
                    label="Always Fetch Related Data"
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
                    disabled={true}
                    label="Virtual Relationship"
                  />
                )}
              />
            </div>

            {/* Relationship Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Relationship Type <span className="text-red-500">*</span>
              </label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    options={typeOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select relationship type"
                    error={errors.type?.message}
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Primary Relationship Configuration */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Primary Relationship
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Local Field <span className="text-red-500">*</span>
              </label>
              <Controller
                name="field"
                control={control}
                render={({ field }) => (
                  <Select
                    options={fieldOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select field"
                    error={errors.field?.message}
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reference Service <span className="text-red-500">*</span>
              </label>
              <Controller
                name="refServiceId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={serviceOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select service"
                    error={errors.refServiceId?.message}
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reference Table <span className="text-red-500">*</span>
              </label>
              <Controller
                name="refTable"
                control={control}
                render={({ field }) => (
                  <Select
                    options={referenceTableOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select table"
                    disabled={!watchedRefServiceId}
                    loading={isLoadingRefTables}
                    error={errors.refTable?.message || (refTablesError ? 'Failed to load tables' : undefined)}
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reference Field <span className="text-red-500">*</span>
              </label>
              <Controller
                name="refField"
                control={control}
                render={({ field }) => (
                  <Select
                    options={referenceFieldOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select field"
                    disabled={!watchedRefTable}
                    loading={isLoadingRefFields}
                    error={errors.refField?.message || (refFieldsError ? 'Failed to load fields' : undefined)}
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Junction Table Configuration for Many-to-Many */}
        {isJunctionEnabled && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Junction Table Configuration
              <span className="text-sm text-gray-500 ml-2">(Required for Many-to-Many relationships)</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Junction Service <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="junctionServiceId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={serviceOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select service"
                      error={errors.junctionServiceId?.message}
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Junction Table <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="junctionTable"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={junctionTableOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select table"
                      disabled={!watchedJunctionServiceId}
                      loading={isLoadingJunctionTables}
                      error={errors.junctionTable?.message || (junctionTablesError ? 'Failed to load tables' : undefined)}
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Junction Field <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="junctionField"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={junctionFieldOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select field"
                      disabled={!watchedJunctionTable}
                      loading={isLoadingJunctionFields}
                      error={errors.junctionField?.message || (junctionFieldsError ? 'Failed to load fields' : undefined)}
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Junction Reference Field <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="junctionRefField"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={junctionFieldOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select field"
                      disabled={!watchedJunctionTable}
                      loading={isLoadingJunctionFields}
                      error={errors.junctionRefField?.message}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* Validation Status */}
        {validationState && !validationState.isValid && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Configuration Issues
                </h3>
                <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
                  {validationState.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              mode === 'create' ? 'Create Relationship' : 'Update Relationship'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}