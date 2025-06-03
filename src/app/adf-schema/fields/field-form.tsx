'use client';

/**
 * Database Field Configuration Form Component
 * 
 * Comprehensive React component implementing field configuration form using React Hook Form
 * with Zod validation. Handles all field attributes including type selection, constraints,
 * relationships, validation rules, and function usage with real-time validation and dynamic
 * control enabling/disabling based on field type selections.
 * 
 * Features:
 * - React Hook Form with Zod schema validators per React/Next.js Integration Requirements
 * - Real-time validation under 100ms per React/Next.js Integration Requirements  
 * - Tailwind CSS 4.1+ with consistent theme injection per React/Next.js Integration Requirements
 * - WCAG 2.1 AA compliance through Headless UI integration per Section 7.1 accessibility requirements
 * - Dynamic control enabling/disabling based on field type selection per existing Angular functionality
 * 
 * @author DreamFactory Platform Migration Team
 * @version 1.0.0
 * @since Next.js 15.1+ / React 19
 */

import React, { useEffect, useMemo, useCallback } from 'react';
import { useForm, useWatch, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useMutation, useQuery } from '@tanstack/react-query';

// Core component imports with proper typing
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Function use component integration
import { FunctionUseForm } from './function-use/function-use-form';

// Type definitions and validation schemas
import type { 
  DatabaseSchemaFieldType,
  FieldFormData,
  FieldType,
  ReferenceTable,
  ReferenceField,
  DatabaseFunctionUse
} from './field.types';

// Custom hooks for data fetching and validation
import { useApi } from '@/hooks/use-api';
import { useFieldValidation } from '@/hooks/use-field-validation';
import { useNotifications } from '@/hooks/use-notifications';
import { useDebounce } from '@/hooks/use-debounce';

// Field schema definitions
import { createFieldFormSchema } from '@/lib/field-schema';

// =============================================================================
// FIELD TYPE CONSTANTS AND CONFIGURATIONS
// =============================================================================

/**
 * Comprehensive field type options with enhanced metadata
 * Supports all DreamFactory field types and database-specific variations
 */
const FIELD_TYPE_OPTIONS = [
  { value: 'manual', label: 'I will manually enter a type', category: 'custom' },
  { value: 'id', label: 'ID (Auto-incrementing identifier)', category: 'identifier' },
  { value: 'string', label: 'String (Variable length text)', category: 'text' },
  { value: 'integer', label: 'Integer (Whole numbers)', category: 'numeric' },
  { value: 'text', label: 'Text (Large text blocks)', category: 'text' },
  { value: 'boolean', label: 'Boolean (True/False)', category: 'logical' },
  { value: 'binary', label: 'Binary (File data)', category: 'binary' },
  { value: 'float', label: 'Float (Decimal numbers)', category: 'numeric' },
  { value: 'double', label: 'Double (Large decimal numbers)', category: 'numeric' },
  { value: 'decimal', label: 'Decimal (Precise decimal numbers)', category: 'numeric' },
  { value: 'datetime', label: 'DateTime (Date and time)', category: 'temporal' },
  { value: 'date', label: 'Date (Date only)', category: 'temporal' },
  { value: 'time', label: 'Time (Time only)', category: 'temporal' },
  { value: 'reference', label: 'Reference (Foreign key)', category: 'relationship' },
  { value: 'user_id', label: 'User ID (Current user)', category: 'system' },
  { value: 'user_id_on_create', label: 'User ID on Create (Creation user)', category: 'system' },
  { value: 'user_id_on_update', label: 'User ID on Update (Update user)', category: 'system' },
  { value: 'timestamp', label: 'Timestamp (Unix timestamp)', category: 'temporal' },
  { value: 'timestamp_on_create', label: 'Timestamp on Create (Creation time)', category: 'system' },
  { value: 'timestamp_on_update', label: 'Timestamp on Update (Update time)', category: 'system' },
] as const;

/**
 * Field type configuration mapping for dynamic form control
 * Defines which controls are enabled/disabled based on field type
 */
const FIELD_TYPE_CONFIG: Record<string, {
  enabledControls: string[];
  disabledControls: string[];
  showPicklist: boolean;
  defaultValues?: Record<string, any>;
}> = {
  manual: {
    enabledControls: ['dbType'],
    disabledControls: ['length', 'precision', 'scale', 'fixedLength', 'supportsMultibyte'],
    showPicklist: false,
  },
  string: {
    enabledControls: ['length', 'fixedLength', 'supportsMultibyte'],
    disabledControls: ['dbType', 'precision', 'scale'],
    showPicklist: true,
  },
  integer: {
    enabledControls: ['length'],
    disabledControls: ['dbType', 'precision', 'scale', 'fixedLength', 'supportsMultibyte'],
    showPicklist: true,
  },
  text: {
    enabledControls: ['length'],
    disabledControls: ['dbType', 'precision', 'scale', 'fixedLength', 'supportsMultibyte'],
    showPicklist: false,
  },
  binary: {
    enabledControls: ['length'],
    disabledControls: ['dbType', 'precision', 'scale', 'fixedLength', 'supportsMultibyte'],
    showPicklist: false,
  },
  float: {
    enabledControls: ['precision', 'scale'],
    disabledControls: ['dbType', 'length', 'fixedLength', 'supportsMultibyte'],
    showPicklist: false,
    defaultValues: { scale: 0 },
  },
  double: {
    enabledControls: ['precision', 'scale'],
    disabledControls: ['dbType', 'length', 'fixedLength', 'supportsMultibyte'],
    showPicklist: false,
    defaultValues: { scale: 0 },
  },
  decimal: {
    enabledControls: ['precision', 'scale'],
    disabledControls: ['dbType', 'length', 'fixedLength', 'supportsMultibyte'],
    showPicklist: false,
    defaultValues: { scale: 0 },
  },
  default: {
    enabledControls: [],
    disabledControls: ['dbType', 'length', 'precision', 'scale', 'fixedLength', 'supportsMultibyte'],
    showPicklist: false,
  },
};

// =============================================================================
// MAIN COMPONENT INTERFACE AND PROPS
// =============================================================================

interface FieldFormProps {
  /** Optional field data for editing existing fields */
  fieldData?: DatabaseSchemaFieldType | null;
  /** Form mode - create or edit */
  mode: 'create' | 'edit';
  /** Service name for API calls */
  serviceName: string;
  /** Table name for field creation */
  tableName: string;
  /** Field name for editing (edit mode only) */
  fieldName?: string;
  /** Callback when form is successfully submitted */
  onSuccess?: (data: FieldFormData) => void;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Form submission loading state */
  isSubmitting?: boolean;
  /** Custom form validation rules */
  customValidation?: Record<string, z.ZodSchema>;
}

// =============================================================================
// FIELD FORM COMPONENT IMPLEMENTATION
// =============================================================================

export function FieldForm({
  fieldData = null,
  mode = 'create',
  serviceName,
  tableName,
  fieldName,
  onSuccess,
  onCancel,
  isSubmitting = false,
  customValidation = {},
}: FieldFormProps) {
  
  // =============================================================================
  // HOOKS AND STATE MANAGEMENT
  // =============================================================================
  
  const router = useRouter();
  const params = useParams();
  const { showNotification } = useNotifications();
  const { validateField } = useFieldValidation();
  
  // API client for data fetching and mutations
  const { get, post, put } = useApi();
  
  // =============================================================================
  // FORM SCHEMA AND VALIDATION SETUP
  // =============================================================================
  
  /**
   * Dynamic form schema generation based on field type and requirements
   * Uses Zod for runtime validation with compile-time type inference
   */
  const formSchema = useMemo(() => {
    return createFieldFormSchema({
      mode,
      fieldType: fieldData?.type,
      customValidation,
      serviceName,
      tableName,
    });
  }, [mode, fieldData?.type, customValidation, serviceName, tableName]);
  
  // =============================================================================
  // REACT HOOK FORM CONFIGURATION
  // =============================================================================
  
  /**
   * Initialize React Hook Form with comprehensive configuration
   * Includes Zod resolver, default values, and performance optimizations
   */
  const form = useForm<FieldFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: fieldData?.name || '',
      alias: fieldData?.alias || '',
      label: fieldData?.label || '',
      type: fieldData?.type || '',
      dbType: fieldData?.dbType || '',
      length: fieldData?.length || undefined,
      precision: fieldData?.precision || undefined,
      scale: fieldData?.scale || 0,
      default: fieldData?.default || '',
      
      // Boolean flags with proper defaults
      isVirtual: fieldData?.isVirtual || false,
      isAggregate: fieldData?.isAggregate || false,
      allowNull: fieldData?.allowNull || false,
      autoIncrement: fieldData?.autoIncrement || false,
      isIndex: fieldData?.isIndex || false,
      isUnique: fieldData?.isUnique || false,
      isPrimaryKey: fieldData?.isPrimaryKey || false,
      isForeignKey: fieldData?.isForeignKey || false,
      fixedLength: fieldData?.fixedLength || false,
      supportsMultibyte: fieldData?.supportsMultibyte || false,
      
      // Reference fields
      refTable: fieldData?.refTable || '',
      refField: fieldData?.refField || '',
      
      // JSON validation and picklist
      validation: fieldData?.validation ? JSON.stringify(fieldData.validation, null, 2) : '',
      picklist: fieldData?.picklist || '',
      
      // Database functions
      dbFunction: fieldData?.dbFunction || [],
    },
    mode: 'onChange', // Real-time validation
    criteriaMode: 'all',
    shouldFocusError: true,
    shouldUnregister: false,
  });
  
  const {
    handleSubmit,
    control,
    setValue,
    getValues,
    reset,
    trigger,
    formState: { errors, isValid, isDirty },
  } = form;
  
  // =============================================================================
  // FORM FIELD WATCHERS FOR DYNAMIC BEHAVIOR
  // =============================================================================
  
  // Watch critical fields for dynamic form behavior
  const watchedType = useWatch({ control, name: 'type' });
  const watchedIsVirtual = useWatch({ control, name: 'isVirtual' });
  const watchedIsForeignKey = useWatch({ control, name: 'isForeignKey' });
  const watchedRefTable = useWatch({ control, name: 'refTable' });
  
  // Debounced values for performance optimization
  const debouncedType = useDebounce(watchedType, 100);
  const debouncedRefTable = useDebounce(watchedRefTable, 300);
  
  // =============================================================================
  // DATA FETCHING QUERIES
  // =============================================================================
  
  /**
   * Fetch available reference tables for foreign key relationships
   * Only active when isForeignKey is enabled
   */
  const {
    data: referenceTables = [],
    isLoading: isLoadingTables,
    error: tablesError,
  } = useQuery<ReferenceTable[]>({
    queryKey: ['schema', serviceName, 'tables'],
    queryFn: () => get(`${serviceName}/_schema`).then(res => res.resource || []),
    enabled: watchedIsForeignKey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
  
  /**
   * Fetch reference fields for selected reference table
   * Only active when a reference table is selected
   */
  const {
    data: referenceFields = [],
    isLoading: isLoadingFields,
    error: fieldsError,
  } = useQuery<ReferenceField[]>({
    queryKey: ['schema', serviceName, 'table', debouncedRefTable, 'fields'],
    queryFn: () => get(`${serviceName}/_schema/${debouncedRefTable}`).then(res => res.field || []),
    enabled: Boolean(debouncedRefTable && watchedIsForeignKey),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
  
  // =============================================================================
  // FORM SUBMISSION MUTATIONS
  // =============================================================================
  
  /**
   * Create new field mutation
   */
  const createFieldMutation = useMutation({
    mutationFn: (data: FieldFormData) => 
      post(`${serviceName}/_schema/${tableName}/_field`, {
        resource: [data],
      }),
    onSuccess: (result, variables) => {
      showNotification({
        type: 'success',
        title: 'Field Created',
        message: `Field "${variables.name}" has been created successfully.`,
      });
      onSuccess?.(variables);
      // Navigate back to fields list
      router.push(`/adf-schema/fields?service=${serviceName}&table=${tableName}`);
    },
    onError: (error: any) => {
      showNotification({
        type: 'error',
        title: 'Creation Failed',
        message: error.message || 'Failed to create field. Please try again.',
      });
    },
  });
  
  /**
   * Update existing field mutation
   */
  const updateFieldMutation = useMutation({
    mutationFn: (data: FieldFormData) => 
      put(`${serviceName}/_schema/${tableName}/_field`, {
        resource: [data],
      }),
    onSuccess: (result, variables) => {
      showNotification({
        type: 'success',
        title: 'Field Updated',
        message: `Field "${variables.name}" has been updated successfully.`,
      });
      onSuccess?.(variables);
      // Navigate back to fields list
      router.push(`/adf-schema/fields?service=${serviceName}&table=${tableName}`);
    },
    onError: (error: any) => {
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update field. Please try again.',
      });
    },
  });
  
  // =============================================================================
  // DYNAMIC FORM CONTROL MANAGEMENT
  // =============================================================================
  
  /**
   * Get field type configuration for dynamic control management
   */
  const getFieldTypeConfig = useCallback((type: string) => {
    return FIELD_TYPE_CONFIG[type] || FIELD_TYPE_CONFIG.default;
  }, []);
  
  /**
   * Check if a form control should be enabled based on current state
   */
  const isControlEnabled = useCallback((controlName: string): boolean => {
    const typeConfig = getFieldTypeConfig(debouncedType);
    const isVirtual = getValues('isVirtual');
    
    // Special handling for virtual fields
    if (isVirtual) {
      if (controlName === 'dbType') return false;
      if (controlName === 'isAggregate') return true;
    }
    
    // Special handling for foreign key fields
    if (controlName === 'refTable') {
      return watchedIsForeignKey;
    }
    
    if (controlName === 'refField') {
      return watchedIsForeignKey && Boolean(debouncedRefTable);
    }
    
    // Check type-specific configuration
    if (typeConfig.enabledControls.includes(controlName)) {
      return true;
    }
    
    if (typeConfig.disabledControls.includes(controlName)) {
      return false;
    }
    
    // Default enabled for unconfigured controls
    return true;
  }, [debouncedType, watchedIsForeignKey, debouncedRefTable, getFieldTypeConfig, getValues]);
  
  /**
   * Check if picklist should be shown for current field type
   */
  const shouldShowPicklist = useMemo(() => {
    const typeConfig = getFieldTypeConfig(debouncedType);
    return typeConfig.showPicklist;
  }, [debouncedType, getFieldTypeConfig]);
  
  // =============================================================================
  // FORM FIELD EFFECTS AND DYNAMIC UPDATES
  // =============================================================================
  
  /**
   * Handle field type changes and update form controls accordingly
   */
  useEffect(() => {
    if (!debouncedType) return;
    
    const typeConfig = getFieldTypeConfig(debouncedType);
    
    // Apply default values for the selected type
    if (typeConfig.defaultValues) {
      Object.entries(typeConfig.defaultValues).forEach(([key, value]) => {
        setValue(key as keyof FieldFormData, value);
      });
    }
    
    // Clear disabled fields
    typeConfig.disabledControls.forEach(controlName => {
      if (controlName !== 'scale') { // Keep scale value for numeric types
        setValue(controlName as keyof FieldFormData, undefined);
      }
    });
    
    // Trigger validation for affected fields
    trigger(['length', 'precision', 'scale', 'dbType']);
  }, [debouncedType, getFieldTypeConfig, setValue, trigger]);
  
  /**
   * Handle virtual field state changes
   */
  useEffect(() => {
    if (watchedIsVirtual) {
      // Clear dbType for virtual fields
      setValue('dbType', '');
      // Enable isAggregate for virtual fields
    } else {
      // Disable isAggregate for non-virtual fields
      setValue('isAggregate', false);
      // Enable dbType if type is manual
      if (debouncedType === 'manual') {
        // dbType will be enabled by isControlEnabled logic
      }
    }
    
    trigger(['dbType', 'isAggregate']);
  }, [watchedIsVirtual, debouncedType, setValue, trigger]);
  
  /**
   * Handle foreign key state changes
   */
  useEffect(() => {
    if (!watchedIsForeignKey) {
      // Clear reference fields when foreign key is disabled
      setValue('refTable', '');
      setValue('refField', '');
    }
    
    trigger(['refTable', 'refField']);
  }, [watchedIsForeignKey, setValue, trigger]);
  
  /**
   * Clear reference field when reference table changes
   */
  useEffect(() => {
    if (debouncedRefTable !== getValues('refTable')) {
      setValue('refField', '');
      trigger('refField');
    }
  }, [debouncedRefTable, setValue, trigger, getValues]);
  
  // =============================================================================
  // FORM SUBMISSION HANDLERS
  // =============================================================================
  
  /**
   * Handle form submission with comprehensive data processing
   */
  const onSubmit = useCallback(async (data: FieldFormData) => {
    try {
      // Process and validate form data
      const processedData = {
        ...data,
        // Parse JSON validation if provided
        validation: data.validation ? JSON.parse(data.validation) : null,
        // Convert empty strings to null for proper API handling
        dbType: data.dbType || null,
        length: data.length || null,
        precision: data.precision || null,
        default: data.default || null,
        refTable: data.refTable || null,
        refField: data.refField || null,
        picklist: data.picklist || null,
      };
      
      // Submit based on mode
      if (mode === 'create') {
        await createFieldMutation.mutateAsync(processedData);
      } else {
        await updateFieldMutation.mutateAsync(processedData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      // Error handling is done in mutation callbacks
    }
  }, [mode, createFieldMutation, updateFieldMutation]);
  
  /**
   * Handle form cancellation
   */
  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmCancel = confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmCancel) return;
    }
    
    if (onCancel) {
      onCancel();
    } else {
      router.push(`/adf-schema/fields?service=${serviceName}&table=${tableName}`);
    }
  }, [isDirty, onCancel, router, serviceName, tableName]);
  
  // =============================================================================
  // COMPONENT RENDER
  // =============================================================================
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Form Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {mode === 'create' ? 'Create New Field' : `Edit Field: ${fieldName}`}
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Configure database field properties, constraints, and validation rules.
        </p>
      </div>
      
      {/* Error Display */}
      {(tablesError || fieldsError) && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load reference data. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Main Form */}
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Basic Field Information Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Field Name */}
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="required">Field Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter field name"
                        disabled={mode === 'edit'} // Field name cannot be changed in edit mode
                        className="transition-colors duration-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Field Alias */}
              <FormField
                control={control}
                name="alias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Alias
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Alternative name for this field in API responses</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter field alias"
                        className="transition-colors duration-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Field Label */}
              <FormField
                control={control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Label
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Human-readable label for this field</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter field label"
                        className="transition-colors duration-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Field Type */}
              <FormField
                control={control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="required flex items-center gap-2">
                      Field Type
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Data type for this field - affects validation and storage</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="transition-colors duration-200">
                          <SelectValue placeholder="Select field type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FIELD_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Type Configuration Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Type Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Database Type (manual entry) */}
              <FormField
                control={control}
                name="dbType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Database Type
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Native database type (e.g., VARCHAR, INT, TEXT)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter database type"
                        disabled={!isControlEnabled('dbType')}
                        className="transition-colors duration-200 disabled:opacity-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Length */}
              <FormField
                control={control}
                name="length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="Max length"
                        disabled={!isControlEnabled('length')}
                        className="transition-colors duration-200 disabled:opacity-50"
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Precision */}
              <FormField
                control={control}
                name="precision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precision</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="Decimal precision"
                        disabled={!isControlEnabled('precision')}
                        className="transition-colors duration-200 disabled:opacity-50"
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Scale */}
              <FormField
                control={control}
                name="scale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scale</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="Decimal scale"
                        disabled={!isControlEnabled('scale')}
                        className="transition-colors duration-200 disabled:opacity-50"
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Default Value */}
              <FormField
                control={control}
                name="default"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Default Value</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter default value"
                        className="transition-colors duration-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Field Properties Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Field Properties
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Virtual Field */}
              <FormField
                control={control}
                name="isVirtual"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Virtual Field</FormLabel>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Field exists only in API, not in database
                      </div>
                    </div>
                    <FormControl>
                      <Toggle
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-describedby="virtual-field-description"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Aggregate Field */}
              <FormField
                control={control}
                name="isAggregate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Aggregate Field</FormLabel>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Field contains aggregated data
                      </div>
                    </div>
                    <FormControl>
                      <Toggle
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isControlEnabled('isAggregate')}
                        aria-describedby="aggregate-field-description"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Allow Null */}
              <FormField
                control={control}
                name="allowNull"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Allow Null</FormLabel>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Field can contain null values
                      </div>
                    </div>
                    <FormControl>
                      <Toggle
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-describedby="allow-null-description"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Auto Increment */}
              <FormField
                control={control}
                name="autoIncrement"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Auto Increment</FormLabel>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Automatically increment value
                      </div>
                    </div>
                    <FormControl>
                      <Toggle
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-describedby="auto-increment-description"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Index */}
              <FormField
                control={control}
                name="isIndex"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Index</FormLabel>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Create database index for this field
                      </div>
                    </div>
                    <FormControl>
                      <Toggle
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-describedby="index-description"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Unique */}
              <FormField
                control={control}
                name="isUnique"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Unique</FormLabel>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Field values must be unique
                      </div>
                    </div>
                    <FormControl>
                      <Toggle
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-describedby="unique-description"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Primary Key */}
              <FormField
                control={control}
                name="isPrimaryKey"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Primary Key</FormLabel>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Field is part of primary key
                      </div>
                    </div>
                    <FormControl>
                      <Toggle
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isControlEnabled('isPrimaryKey')}
                        aria-describedby="primary-key-description"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Foreign Key */}
              <FormField
                control={control}
                name="isForeignKey"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Foreign Key</FormLabel>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Field references another table
                      </div>
                    </div>
                    <FormControl>
                      <Toggle
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-describedby="foreign-key-description"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Fixed Length */}
              <FormField
                control={control}
                name="fixedLength"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Fixed Length</FormLabel>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Field has fixed length
                      </div>
                    </div>
                    <FormControl>
                      <Toggle
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isControlEnabled('fixedLength')}
                        aria-describedby="fixed-length-description"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Supports Multibyte */}
              <FormField
                control={control}
                name="supportsMultibyte"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Supports Multibyte</FormLabel>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Field supports multibyte characters
                      </div>
                    </div>
                    <FormControl>
                      <Toggle
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isControlEnabled('supportsMultibyte')}
                        aria-describedby="multibyte-description"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Foreign Key Reference Section */}
          {watchedIsForeignKey && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Foreign Key Reference
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reference Table */}
                <FormField
                  control={control}
                  name="refTable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">Reference Table</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                        disabled={isLoadingTables}
                      >
                        <FormControl>
                          <SelectTrigger className="transition-colors duration-200">
                            <SelectValue placeholder="Select reference table" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {referenceTables.map((table) => (
                            <SelectItem key={table.name} value={table.name}>
                              {table.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Reference Field */}
                <FormField
                  control={control}
                  name="refField"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">Reference Field</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                        disabled={!debouncedRefTable || isLoadingFields}
                      >
                        <FormControl>
                          <SelectTrigger className="transition-colors duration-200">
                            <SelectValue placeholder="Select reference field" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {referenceFields.map((field) => (
                            <SelectItem key={field.name} value={field.name}>
                              {field.label || field.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}
          
          {/* Validation Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Validation and Constraints
            </h3>
            
            <div className="space-y-6">
              {/* JSON Validation Rules */}
              <FormField
                control={control}
                name="validation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Validation Rules (JSON)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>JSON object containing validation rules for this field</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder='{"required": true, "minLength": 3}'
                        rows={4}
                        className="font-mono text-sm transition-colors duration-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Picklist (for supported field types) */}
              {shouldShowPicklist && (
                <FormField
                  control={control}
                  name="picklist"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Picklist Values (CSV)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="value1,value2,value3"
                          className="transition-colors duration-200"
                        />
                      </FormControl>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Comma-separated values for dropdown options
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
          
          {/* Database Functions Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Database Functions
            </h3>
            
            <FormField
              control={control}
              name="dbFunction"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FunctionUseForm
                      value={field.value}
                      onChange={field.onChange}
                      serviceName={serviceName}
                      tableName={tableName}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting || createFieldMutation.isPending || updateFieldMutation.isPending}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={
                !isValid || 
                isSubmitting || 
                createFieldMutation.isPending || 
                updateFieldMutation.isPending
              }
              className="min-w-24"
            >
              {createFieldMutation.isPending || updateFieldMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{mode === 'create' ? 'Creating...' : 'Updating...'}</span>
                </div>
              ) : (
                <span>{mode === 'create' ? 'Create Field' : 'Update Field'}</span>
              )}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

// =============================================================================
// COMPONENT EXPORT WITH DISPLAY NAME
// =============================================================================

FieldForm.displayName = 'FieldForm';

export default FieldForm;