'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Fragment } from 'react';
import { Dialog, Transition, Switch, Listbox } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Type definitions based on the Angular component structure
interface BasicOption {
  label: string;
  value: string | number;
  name?: string;
}

interface TableField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
}

interface Service {
  id: number;
  name: string;
  label: string;
  type: string;
}

interface RelationshipData {
  name?: string;
  alias?: string;
  label?: string;
  description?: string;
  alwaysFetch: boolean;
  type: 'belongs_to' | 'has_many' | 'has_one' | 'many_many';
  isVirtual: boolean;
  field: string;
  refServiceId: number;
  refTable: string;
  refField: string;
  junctionServiceId?: number | null;
  junctionTable?: string | null;
  junctionField?: string | null;
  junctionRefField?: string | null;
}

// Zod validation schema with dynamic validation based on relationship type
const createRelationshipSchema = (relationshipType?: string) => z.object({
  name: z.string().optional(),
  alias: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  alwaysFetch: z.boolean().default(false),
  type: z.enum(['belongs_to', 'has_many', 'has_one', 'many_many'], {
    required_error: 'Relationship type is required',
  }),
  isVirtual: z.boolean().default(true),
  field: z.string().min(1, 'Field is required'),
  refServiceId: z.number().min(1, 'Reference service is required'),
  refTable: z.string().min(1, 'Reference table is required'),
  refField: z.string().min(1, 'Reference field is required'),
  junctionServiceId: relationshipType === 'many_many' 
    ? z.number().min(1, 'Junction service is required for many-to-many relationships')
    : z.number().optional().nullable(),
  junctionTable: relationshipType === 'many_many' 
    ? z.string().min(1, 'Junction table is required for many-to-many relationships')
    : z.string().optional().nullable(),
  junctionField: relationshipType === 'many_many' 
    ? z.string().min(1, 'Junction field is required for many-to-many relationships')
    : z.string().optional().nullable(),
  junctionRefField: relationshipType === 'many_many' 
    ? z.string().min(1, 'Junction reference field is required for many-to-many relationships')
    : z.string().optional().nullable(),
});

// Type inference from schema
type RelationshipFormData = z.infer<ReturnType<typeof createRelationshipSchema>>;

// Relationship type options
const RELATIONSHIP_TYPE_OPTIONS: BasicOption[] = [
  { label: 'Belongs To', value: 'belongs_to' },
  { label: 'Has Many', value: 'has_many' },
  { label: 'Has One', value: 'has_one' },
  { label: 'Many To Many', value: 'many_many' },
];

// Custom Select component using Headless UI
interface SelectProps {
  value: string | number | null;
  onChange: (value: any) => void;
  options: BasicOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

const Select: React.FC<SelectProps> = ({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Select an option', 
  error, 
  disabled = false,
  required = false
}) => {
  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="relative">
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button 
            className={cn(
              "relative w-full cursor-default rounded-md border bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm",
              error ? "border-error-500" : "border-gray-300",
              disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"
            )}
          >
            <span className="block truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  className={({ active }) =>
                    cn(
                      "relative cursor-default select-none py-2 pl-10 pr-4",
                      active ? "bg-primary-100 text-primary-900" : "text-gray-900"
                    )
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <>
                      <span className={cn("block truncate", selected ? "font-medium" : "font-normal")}>
                        {option.label}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      {error && (
        <p className="mt-1 text-sm text-error-600">{error}</p>
      )}
    </div>
  );
};

// Custom Input component
interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  type?: 'text' | 'email' | 'password';
}

const Input: React.FC<InputProps> = ({
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  type = 'text'
}) => (
  <div>
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={cn(
        "block w-full rounded-md border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm",
        error ? "border-error-500" : "border-gray-300",
        disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white",
        "px-3 py-2"
      )}
    />
    {error && (
      <p className="mt-1 text-sm text-error-600">{error}</p>
    )}
  </div>
);

// Custom Toggle component using Headless UI
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, disabled = false }) => (
  <div className="flex items-center">
    <Switch
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={cn(
        checked ? 'bg-primary-600' : 'bg-gray-200',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          checked ? 'translate-x-5' : 'translate-x-0',
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
        )}
      />
    </Switch>
    <span className="ml-3 text-sm font-medium text-gray-700">{label}</span>
  </div>
);

// Mock API functions (replace with actual API calls)
const mockApiClient = {
  get: async (url: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock data based on URL patterns
    if (url.includes('/_schema') && !url.includes('/_schema/')) {
      // Mock table list
      return {
        resource: [
          { name: 'users', label: 'Users' },
          { name: 'orders', label: 'Orders' },
          { name: 'products', label: 'Products' },
          { name: 'categories', label: 'Categories' },
        ]
      };
    } else if (url.includes('/_schema/')) {
      // Mock field list
      return {
        field: [
          { name: 'id', label: 'ID', type: 'integer' },
          { name: 'name', label: 'Name', type: 'string' },
          { name: 'email', label: 'Email', type: 'string' },
          { name: 'created_at', label: 'Created At', type: 'datetime' },
        ]
      };
    } else if (url.includes('/system/service')) {
      // Mock services list
      return {
        resource: [
          { id: 1, name: 'db', label: 'MySQL Database', type: 'mysql' },
          { id: 2, name: 'pg_db', label: 'PostgreSQL Database', type: 'pgsql' },
          { id: 3, name: 'mongo_db', label: 'MongoDB Database', type: 'mongodb' },
        ]
      };
    }
    return { resource: [] };
  },
  
  post: async (url: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, id: Math.random() };
  },
  
  patch: async (url: string, data: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  }
};

// Main RelationshipForm component
interface RelationshipFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<RelationshipData>;
  onCancel: () => void;
  onSuccess: () => void;
}

const RelationshipForm: React.FC<RelationshipFormProps> = ({
  mode,
  initialData,
  onCancel,
  onSuccess
}) => {
  const router = useRouter();
  const params = useParams();
  const { name: dbName, id: tableName } = params as { name: string; id: string };

  // State for dropdown options
  const [serviceOptions, setServiceOptions] = useState<BasicOption[]>([]);
  const [fieldOptions, setFieldOptions] = useState<BasicOption[]>([]);
  const [referenceTableOptions, setReferenceTableOptions] = useState<BasicOption[]>([]);
  const [referenceFieldOptions, setReferenceFieldOptions] = useState<BasicOption[]>([]);
  const [junctionTableOptions, setJunctionTableOptions] = useState<BasicOption[]>([]);
  const [junctionFieldOptions, setJunctionFieldOptions] = useState<BasicOption[]>([]);

  // Initialize form with dynamic schema
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<RelationshipFormData>({
    resolver: zodResolver(createRelationshipSchema(watch('type'))),
    defaultValues: {
      alwaysFetch: false,
      isVirtual: true,
      ...initialData
    }
  });

  // Watch form values for dynamic behavior
  const watchedType = watch('type');
  const watchedRefServiceId = watch('refServiceId');
  const watchedRefTable = watch('refTable');
  const watchedJunctionServiceId = watch('junctionServiceId');
  const watchedJunctionTable = watch('junctionTable');

  // Load initial data
  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => mockApiClient.get('/system/service'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: fieldsData } = useQuery({
    queryKey: ['table-fields', dbName, tableName],
    queryFn: () => mockApiClient.get(`${dbName}/_schema/${tableName}`),
    staleTime: 5 * 60 * 1000,
  });

  // Dynamic queries for reference tables and fields
  const { data: referenceTablesData } = useQuery({
    queryKey: ['reference-tables', watchedRefServiceId],
    queryFn: () => {
      if (!watchedRefServiceId) return null;
      const serviceName = getServiceName(watchedRefServiceId);
      return mockApiClient.get(`${serviceName}/_schema`);
    },
    enabled: !!watchedRefServiceId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: referenceFieldsData } = useQuery({
    queryKey: ['reference-fields', watchedRefServiceId, watchedRefTable],
    queryFn: () => {
      if (!watchedRefServiceId || !watchedRefTable) return null;
      const serviceName = getServiceName(watchedRefServiceId);
      return mockApiClient.get(`${serviceName}/_schema/${watchedRefTable}`);
    },
    enabled: !!watchedRefServiceId && !!watchedRefTable,
    staleTime: 5 * 60 * 1000,
  });

  // Dynamic queries for junction tables and fields
  const { data: junctionTablesData } = useQuery({
    queryKey: ['junction-tables', watchedJunctionServiceId],
    queryFn: () => {
      if (!watchedJunctionServiceId) return null;
      const serviceName = getServiceName(watchedJunctionServiceId);
      return mockApiClient.get(`${serviceName}/_schema`);
    },
    enabled: !!watchedJunctionServiceId && watchedType === 'many_many',
    staleTime: 5 * 60 * 1000,
  });

  const { data: junctionFieldsData } = useQuery({
    queryKey: ['junction-fields', watchedJunctionServiceId, watchedJunctionTable],
    queryFn: () => {
      if (!watchedJunctionServiceId || !watchedJunctionTable) return null;
      const serviceName = getServiceName(watchedJunctionServiceId);
      return mockApiClient.get(`${serviceName}/_schema/${watchedJunctionTable}`);
    },
    enabled: !!watchedJunctionServiceId && !!watchedJunctionTable && watchedType === 'many_many',
    staleTime: 5 * 60 * 1000,
  });

  // Helper function to get service name by ID
  const getServiceName = useCallback((serviceId: number): string => {
    const service = serviceOptions.find(option => option.value === serviceId);
    return service?.name || '';
  }, [serviceOptions]);

  // Update options when data changes
  useEffect(() => {
    if (servicesData?.resource) {
      const options = servicesData.resource.map((service: Service) => ({
        label: mode === 'edit' ? service.type : service.label,
        value: service.id,
        name: service.name,
      }));
      setServiceOptions(options);
    }
  }, [servicesData, mode]);

  useEffect(() => {
    if (fieldsData?.field) {
      const options = fieldsData.field.map((field: TableField) => ({
        label: field.label,
        value: field.name,
      }));
      setFieldOptions(options);
    }
  }, [fieldsData]);

  useEffect(() => {
    if (referenceTablesData?.resource) {
      const options = referenceTablesData.resource.map((table: any) => ({
        label: table.name,
        value: table.name,
      }));
      setReferenceTableOptions(options);
    }
  }, [referenceTablesData]);

  useEffect(() => {
    if (referenceFieldsData?.field) {
      const options = referenceFieldsData.field.map((field: any) => ({
        label: field.label,
        value: field.name,
      }));
      setReferenceFieldOptions(options);
    }
  }, [referenceFieldsData]);

  useEffect(() => {
    if (junctionTablesData?.resource) {
      const options = junctionTablesData.resource.map((table: any) => ({
        label: table.name,
        value: table.name,
      }));
      setJunctionTableOptions(options);
    }
  }, [junctionTablesData]);

  useEffect(() => {
    if (junctionFieldsData?.field) {
      const options = junctionFieldsData.field.map((field: any) => ({
        label: field.label,
        value: field.name,
      }));
      setJunctionFieldOptions(options);
    }
  }, [junctionFieldsData]);

  // Reset dependent fields when parent fields change
  useEffect(() => {
    setValue('refTable', '');
    setValue('refField', '');
  }, [watchedRefServiceId, setValue]);

  useEffect(() => {
    setValue('refField', '');
  }, [watchedRefTable, setValue]);

  useEffect(() => {
    setValue('junctionTable', '');
    setValue('junctionField', '');
    setValue('junctionRefField', '');
  }, [watchedJunctionServiceId, setValue]);

  useEffect(() => {
    setValue('junctionField', '');
    setValue('junctionRefField', '');
  }, [watchedJunctionTable, setValue]);

  // Handle relationship type changes (enable/disable junction fields)
  useEffect(() => {
    if (watchedType !== 'many_many') {
      setValue('junctionServiceId', null);
      setValue('junctionTable', null);
      setValue('junctionField', null);
      setValue('junctionRefField', null);
    }
  }, [watchedType, setValue]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: RelationshipFormData) => {
      const payload = { resource: [data] };
      
      if (mode === 'create') {
        return mockApiClient.post(`${dbName}/_schema/${tableName}/_related`, payload);
      } else {
        return mockApiClient.patch(`${dbName}/_schema/${tableName}/_related`, payload);
      }
    },
    onSuccess: () => {
      toast.success(
        mode === 'create' 
          ? 'Relationship created successfully' 
          : 'Relationship updated successfully'
      );
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'An error occurred while saving the relationship');
    },
  });

  // Form submission handler
  const onSubmit = (data: RelationshipFormData) => {
    saveMutation.mutate(data);
  };

  // Check if junction fields should be disabled
  const isJunctionDisabled = watchedType !== 'many_many';

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === 'create' ? 'Create' : 'Edit'} Relationship
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Configure database table relationships for API generation
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
                <span className="text-gray-500 text-xs ml-1">(Auto-generated)</span>
              </label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Auto-generated relationship name"
                    disabled={true}
                    error={errors.name?.message}
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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

          <div className="mt-6 space-y-4">
            <Controller
              name="alwaysFetch"
              control={control}
              render={({ field }) => (
                <Toggle
                  checked={field.value}
                  onChange={field.onChange}
                  label="Always Fetch Related Records"
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
                  label="Virtual Relationship"
                  disabled={true}
                />
              )}
            />
          </div>
        </div>

        {/* Relationship Configuration Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Relationship Configuration</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship Type <span className="text-red-500">*</span>
              </label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={RELATIONSHIP_TYPE_OPTIONS}
                    placeholder="Select relationship type"
                    error={errors.type?.message}
                    required
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Local Field <span className="text-red-500">*</span>
              </label>
              <Controller
                name="field"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={fieldOptions}
                    placeholder="Select local field"
                    error={errors.field?.message}
                    required
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Reference Configuration Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Reference Configuration</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Service <span className="text-red-500">*</span>
              </label>
              <Controller
                name="refServiceId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={serviceOptions}
                    placeholder="Select reference service"
                    error={errors.refServiceId?.message}
                    required
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Table <span className="text-red-500">*</span>
              </label>
              <Controller
                name="refTable"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={referenceTableOptions}
                    placeholder="Select reference table"
                    error={errors.refTable?.message}
                    required
                    disabled={!watchedRefServiceId}
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Field <span className="text-red-500">*</span>
              </label>
              <Controller
                name="refField"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={referenceFieldOptions}
                    placeholder="Select reference field"
                    error={errors.refField?.message}
                    required
                    disabled={!watchedRefTable}
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Junction Table Configuration Section (for many-to-many) */}
        <div className={cn(
          "bg-gray-50 rounded-lg p-6 transition-opacity duration-200",
          isJunctionDisabled ? "opacity-50" : "opacity-100"
        )}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Junction Table Configuration</h2>
            {isJunctionDisabled && (
              <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">
                Available for Many-to-Many relationships only
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Junction Service {watchedType === 'many_many' && <span className="text-red-500">*</span>}
              </label>
              <Controller
                name="junctionServiceId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={serviceOptions}
                    placeholder="Select junction service"
                    error={errors.junctionServiceId?.message}
                    disabled={isJunctionDisabled}
                    required={watchedType === 'many_many'}
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Junction Table {watchedType === 'many_many' && <span className="text-red-500">*</span>}
              </label>
              <Controller
                name="junctionTable"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={junctionTableOptions}
                    placeholder="Select junction table"
                    error={errors.junctionTable?.message}
                    disabled={isJunctionDisabled || !watchedJunctionServiceId}
                    required={watchedType === 'many_many'}
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Junction Field {watchedType === 'many_many' && <span className="text-red-500">*</span>}
              </label>
              <Controller
                name="junctionField"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={junctionFieldOptions}
                    placeholder="Select junction field"
                    error={errors.junctionField?.message}
                    disabled={isJunctionDisabled || !watchedJunctionTable}
                    required={watchedType === 'many_many'}
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Junction Reference Field {watchedType === 'many_many' && <span className="text-red-500">*</span>}
              </label>
              <Controller
                name="junctionRefField"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={junctionFieldOptions}
                    placeholder="Select junction reference field"
                    error={errors.junctionRefField?.message}
                    disabled={isJunctionDisabled || !watchedJunctionTable}
                    required={watchedType === 'many_many'}
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {mode === 'create' ? 'Create Relationship' : 'Update Relationship'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RelationshipForm;