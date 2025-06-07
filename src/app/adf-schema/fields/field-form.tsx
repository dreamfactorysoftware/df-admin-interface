/**
 * Database Field Configuration Form Component
 * 
 * Comprehensive React form component for configuring database field attributes
 * including type selection, constraints, relationships, validation rules, and
 * function usage. Built with React Hook Form, Zod validation, and WCAG 2.1 AA
 * compliance for the DreamFactory Admin Interface database schema management.
 * 
 * Features:
 * - React Hook Form with Zod schema validators for type-safe form handling
 * - Real-time validation under 100ms with dynamic field enabling/disabling
 * - Tailwind CSS 4.1+ styling with consistent theme injection
 * - WCAG 2.1 AA accessibility compliance through Headless UI integration
 * - Dynamic control management based on field type selection
 * - Comprehensive field type support (string, integer, decimal, boolean, etc.)
 * - Advanced validation rules including regex, min/max values, and constraints
 * - Relationship configuration for foreign keys and database references
 * - Function usage configuration for computed fields and transformations
 * - CSV picklist validation and JSON validation for complex field types
 * 
 * @fileoverview Database field configuration form for schema management
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';

// UI Components - Using the comprehensive form system
import { FormField } from '@/components/ui/form/form-field';
import { Select } from '@/components/ui/select/Select';
import { Toggle } from '@/components/ui/toggle/toggle';
import { Input } from '@/components/ui/input/input';
import { TextArea } from '@/components/ui/input/textarea';
import { Button } from '@/components/ui/button/Button';

// Hook imports for functionality
import { useTheme } from '@/hooks/use-theme';
import { useDebounce } from '@/hooks/use-debounce';

// Type definitions and schemas
import type { 
  DatabaseField, 
  FieldType, 
  FieldConstraint,
  FieldRelationship,
  FieldFunction,
  FieldValidationRule 
} from './field.types';

// ============================================================================
// FIELD TYPE DEFINITIONS AND CONSTANTS
// ============================================================================

/**
 * Comprehensive database field types supporting all major database systems
 * Includes types from MySQL, PostgreSQL, Oracle, MongoDB, and Snowflake
 */
export const FIELD_TYPES = [
  // String types
  { value: 'string', label: 'String', category: 'text' },
  { value: 'text', label: 'Text', category: 'text' },
  { value: 'longtext', label: 'Long Text', category: 'text' },
  { value: 'char', label: 'Character', category: 'text' },
  { value: 'varchar', label: 'Variable Character', category: 'text' },
  
  // Numeric types
  { value: 'integer', label: 'Integer', category: 'numeric' },
  { value: 'bigint', label: 'Big Integer', category: 'numeric' },
  { value: 'smallint', label: 'Small Integer', category: 'numeric' },
  { value: 'decimal', label: 'Decimal', category: 'numeric' },
  { value: 'float', label: 'Float', category: 'numeric' },
  { value: 'double', label: 'Double', category: 'numeric' },
  { value: 'money', label: 'Money', category: 'numeric' },
  
  // Date/Time types
  { value: 'date', label: 'Date', category: 'datetime' },
  { value: 'time', label: 'Time', category: 'datetime' },
  { value: 'datetime', label: 'Date Time', category: 'datetime' },
  { value: 'timestamp', label: 'Timestamp', category: 'datetime' },
  { value: 'year', label: 'Year', category: 'datetime' },
  
  // Boolean and binary types
  { value: 'boolean', label: 'Boolean', category: 'boolean' },
  { value: 'binary', label: 'Binary', category: 'binary' },
  { value: 'blob', label: 'BLOB', category: 'binary' },
  { value: 'longblob', label: 'Long BLOB', category: 'binary' },
  
  // JSON and array types
  { value: 'json', label: 'JSON', category: 'structured' },
  { value: 'array', label: 'Array', category: 'structured' },
  { value: 'object', label: 'Object', category: 'structured' },
  
  // Special types
  { value: 'uuid', label: 'UUID', category: 'special' },
  { value: 'enum', label: 'Enumeration', category: 'special' },
  { value: 'set', label: 'Set', category: 'special' },
  { value: 'geometry', label: 'Geometry', category: 'special' },
] as const;

/**
 * Field validation rule types
 */
export const VALIDATION_RULES = [
  { value: 'required', label: 'Required Field' },
  { value: 'unique', label: 'Unique Value' },
  { value: 'min_length', label: 'Minimum Length' },
  { value: 'max_length', label: 'Maximum Length' },
  { value: 'min_value', label: 'Minimum Value' },
  { value: 'max_value', label: 'Maximum Value' },
  { value: 'regex', label: 'Regular Expression' },
  { value: 'email', label: 'Email Format' },
  { value: 'url', label: 'URL Format' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'ip_address', label: 'IP Address' },
  { value: 'date_format', label: 'Date Format' },
  { value: 'json_schema', label: 'JSON Schema' },
  { value: 'custom', label: 'Custom Validation' },
] as const;

/**
 * Field relationship types for foreign keys and references
 */
export const RELATIONSHIP_TYPES = [
  { value: 'belongs_to', label: 'Belongs To (N:1)' },
  { value: 'has_many', label: 'Has Many (1:N)' },
  { value: 'has_one', label: 'Has One (1:1)' },
  { value: 'many_to_many', label: 'Many to Many (N:N)' },
] as const;

/**
 * Function usage types for computed fields
 */
export const FUNCTION_TYPES = [
  { value: 'auto_increment', label: 'Auto Increment' },
  { value: 'auto_uuid', label: 'Auto UUID' },
  { value: 'current_timestamp', label: 'Current Timestamp' },
  { value: 'current_date', label: 'Current Date' },
  { value: 'computed', label: 'Computed Expression' },
  { value: 'hash', label: 'Hash Function' },
  { value: 'encrypt', label: 'Encryption' },
  { value: 'transform', label: 'Data Transform' },
] as const;

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Comprehensive Zod schema for database field configuration
 * Provides type-safe validation with real-time feedback under 100ms
 */
const fieldFormSchema = z.object({
  // Basic field properties
  name: z.string()
    .min(1, 'Field name is required')
    .max(64, 'Field name must be 64 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with a letter and contain only letters, numbers, and underscores'),
  
  label: z.string()
    .min(1, 'Field label is required')
    .max(128, 'Field label must be 128 characters or less'),
  
  type: z.enum([
    'string', 'text', 'longtext', 'char', 'varchar',
    'integer', 'bigint', 'smallint', 'decimal', 'float', 'double', 'money',
    'date', 'time', 'datetime', 'timestamp', 'year',
    'boolean', 'binary', 'blob', 'longblob',
    'json', 'array', 'object',
    'uuid', 'enum', 'set', 'geometry'
  ], { errorMap: () => ({ message: 'Please select a valid field type' }) }),
  
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  
  // Field constraints
  nullable: z.boolean().default(true),
  default_value: z.string().optional(),
  primary_key: z.boolean().default(false),
  auto_increment: z.boolean().default(false),
  
  // Size and precision constraints
  size: z.number()
    .int('Size must be an integer')
    .min(1, 'Size must be at least 1')
    .max(65535, 'Size cannot exceed 65535')
    .optional(),
  
  precision: z.number()
    .int('Precision must be an integer')
    .min(1, 'Precision must be at least 1')
    .max(65, 'Precision cannot exceed 65')
    .optional(),
  
  scale: z.number()
    .int('Scale must be an integer')
    .min(0, 'Scale cannot be negative')
    .max(30, 'Scale cannot exceed 30')
    .optional(),
  
  // Validation rules
  validation_rules: z.array(z.object({
    type: z.enum([
      'required', 'unique', 'min_length', 'max_length', 'min_value', 'max_value',
      'regex', 'email', 'url', 'phone', 'ip_address', 'date_format', 'json_schema', 'custom'
    ]),
    value: z.string().optional(),
    message: z.string().optional(),
    enabled: z.boolean().default(true),
  })).default([]),
  
  // Index configuration
  indexed: z.boolean().default(false),
  unique: z.boolean().default(false),
  
  // Picklist/Enum values for dropdown fields
  picklist_values: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      // Validate CSV format for picklist values
      try {
        const values = val.split(',').map(v => v.trim()).filter(v => v.length > 0);
        return values.length > 0 && values.every(v => v.length <= 255);
      } catch {
        return false;
      }
    }, 'Picklist values must be a valid comma-separated list with each value under 255 characters'),
  
  // Foreign key relationship
  relationship: z.object({
    type: z.enum(['belongs_to', 'has_many', 'has_one', 'many_to_many']).optional(),
    table: z.string().optional(),
    field: z.string().optional(),
    on_delete: z.enum(['CASCADE', 'SET_NULL', 'RESTRICT', 'NO_ACTION']).optional(),
    on_update: z.enum(['CASCADE', 'SET_NULL', 'RESTRICT', 'NO_ACTION']).optional(),
  }).optional(),
  
  // Function usage for computed fields
  function_usage: z.object({
    type: z.enum([
      'auto_increment', 'auto_uuid', 'current_timestamp', 'current_date',
      'computed', 'hash', 'encrypt', 'transform'
    ]).optional(),
    expression: z.string().optional(),
    parameters: z.record(z.any()).optional(),
  }).optional(),
  
  // JSON field validation
  json_schema: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    }, 'JSON schema must be valid JSON format'),
  
  // Additional metadata
  metadata: z.record(z.any()).optional(),
}).refine((data) => {
  // Custom validation rules based on field type
  if (data.type === 'decimal' || data.type === 'float' || data.type === 'double') {
    if (data.precision && data.scale && data.scale >= data.precision) {
      return false;
    }
  }
  
  // Primary key fields cannot be nullable
  if (data.primary_key && data.nullable) {
    return false;
  }
  
  // Auto increment requires integer type and primary key
  if (data.auto_increment && !['integer', 'bigint', 'smallint'].includes(data.type)) {
    return false;
  }
  
  return true;
}, {
  message: 'Field configuration is invalid. Please check type-specific constraints.',
  path: ['type']
});

/**
 * TypeScript type inference from Zod schema
 */
export type FieldFormData = z.infer<typeof fieldFormSchema>;

// ============================================================================
// FORM COMPONENT INTERFACES
// ============================================================================

/**
 * Props interface for the FieldForm component
 */
export interface FieldFormProps {
  /** Initial field data for editing existing fields */
  initialData?: Partial<FieldFormData>;
  
  /** Form submission handler */
  onSubmit: (data: FieldFormData) => void | Promise<void>;
  
  /** Form cancellation handler */
  onCancel?: () => void;
  
  /** Available tables for relationship configuration */
  availableTables?: Array<{ value: string; label: string; fields?: string[] }>;
  
  /** Loading state for form submission */
  loading?: boolean;
  
  /** Disable form editing */
  disabled?: boolean;
  
  /** Show advanced options */
  showAdvanced?: boolean;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Test identifier */
  'data-testid'?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get field type category for conditional field visibility
 */
const getFieldTypeCategory = (type: string): string => {
  const fieldType = FIELD_TYPES.find(ft => ft.value === type);
  return fieldType?.category || 'general';
};

/**
 * Check if field type supports size constraint
 */
const fieldTypeSupportsSize = (type: string): boolean => {
  return ['string', 'varchar', 'char', 'decimal', 'float', 'double'].includes(type);
};

/**
 * Check if field type supports precision/scale
 */
const fieldTypeSupportsPrecision = (type: string): boolean => {
  return ['decimal', 'float', 'double', 'money'].includes(type);
};

/**
 * Check if field type supports auto increment
 */
const fieldTypeSupportsAutoIncrement = (type: string): boolean => {
  return ['integer', 'bigint', 'smallint'].includes(type);
};

/**
 * Check if field type supports picklist values
 */
const fieldTypeSupportsPicklist = (type: string): boolean => {
  return ['enum', 'set', 'string', 'varchar'].includes(type);
};

/**
 * Check if field type supports JSON schema
 */
const fieldTypeSupportsJsonSchema = (type: string): boolean => {
  return ['json', 'object', 'text', 'longtext'].includes(type);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Database Field Configuration Form Component
 * 
 * Comprehensive form component for database field configuration with real-time
 * validation, dynamic field enabling/disabling, and full accessibility support.
 */
export const FieldForm: React.FC<FieldFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  availableTables = [],
  loading = false,
  disabled = false,
  showAdvanced = false,
  className,
  'data-testid': testId,
}) => {
  // Theme management for consistent styling
  const { resolvedTheme } = useTheme();
  
  // Form state management with React Hook Form and Zod validation
  const form = useForm<FieldFormData>({
    resolver: zodResolver(fieldFormSchema),
    defaultValues: {
      name: '',
      label: '',
      type: 'string',
      description: '',
      nullable: true,
      primary_key: false,
      auto_increment: false,
      indexed: false,
      unique: false,
      validation_rules: [],
      ...initialData,
    },
    mode: 'onChange', // Enable real-time validation
  });
  
  // Watch field type for dynamic field enabling/disabling
  const watchedType = useWatch({
    control: form.control,
    name: 'type',
  });
  
  const watchedPrimaryKey = useWatch({
    control: form.control,
    name: 'primary_key',
  });
  
  // Debounce validation for performance optimization under 100ms
  const debouncedValidation = useDebounce(
    () => {
      form.trigger(); // Trigger validation
    },
    50 // 50ms debounce for sub-100ms validation response
  );
  
  // Local state for advanced sections
  const [showValidationRules, setShowValidationRules] = useState(false);
  const [showRelationship, setShowRelationship] = useState(false);
  const [showFunctionUsage, setShowFunctionUsage] = useState(false);
  
  // Memoized field type category for performance
  const fieldTypeCategory = useMemo(() => getFieldTypeCategory(watchedType), [watchedType]);
  
  // Dynamic field enablement based on field type
  const fieldConstraints = useMemo(() => ({
    supportsSize: fieldTypeSupportsSize(watchedType),
    supportsPrecision: fieldTypeSupportsPrecision(watchedType),
    supportsAutoIncrement: fieldTypeSupportsAutoIncrement(watchedType),
    supportsPicklist: fieldTypeSupportsPicklist(watchedType),
    supportsJsonSchema: fieldTypeSupportsJsonSchema(watchedType),
  }), [watchedType]);
  
  // Effect to handle field type changes and constraint updates
  useEffect(() => {
    if (watchedType) {
      // Clear incompatible constraints when field type changes
      if (!fieldConstraints.supportsAutoIncrement) {
        form.setValue('auto_increment', false);
      }
      
      if (!fieldConstraints.supportsPrecision) {
        form.setValue('precision', undefined);
        form.setValue('scale', undefined);
      }
      
      if (!fieldConstraints.supportsSize) {
        form.setValue('size', undefined);
      }
      
      // Trigger debounced validation
      debouncedValidation();
    }
  }, [watchedType, fieldConstraints, form, debouncedValidation]);
  
  // Effect to handle primary key constraint changes
  useEffect(() => {
    if (watchedPrimaryKey) {
      // Primary key fields cannot be nullable
      form.setValue('nullable', false);
      form.setValue('unique', true);
    }
  }, [watchedPrimaryKey, form]);
  
  // Form submission handler with error handling
  const handleSubmit = useCallback(async (data: FieldFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Field form submission error:', error);
      // Additional error handling could be added here
    }
  }, [onSubmit]);
  
  // Validation rule management
  const addValidationRule = useCallback(() => {
    const currentRules = form.getValues('validation_rules') || [];
    form.setValue('validation_rules', [
      ...currentRules,
      {
        type: 'required' as const,
        value: '',
        message: '',
        enabled: true,
      },
    ]);
  }, [form]);
  
  const removeValidationRule = useCallback((index: number) => {
    const currentRules = form.getValues('validation_rules') || [];
    form.setValue('validation_rules', currentRules.filter((_, i) => i !== index));
  }, [form]);
  
  return (
    <div
      className={cn(
        'field-form-container',
        'w-full max-w-4xl mx-auto p-6',
        'bg-white dark:bg-gray-900',
        'border border-gray-200 dark:border-gray-700',
        'rounded-lg shadow-sm',
        className
      )}
      data-testid={testId}
      data-theme={resolvedTheme}
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Form Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {initialData ? 'Edit Field Configuration' : 'Create New Field'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure the database field properties, constraints, and validation rules.
          </p>
        </div>
        
        {/* Basic Field Properties */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Field Name */}
          <FormField
            control={form.control}
            name="name"
            config={{
              label: 'Field Name',
              placeholder: 'Enter field name (e.g., user_id)',
              description: 'Database column name (letters, numbers, underscores only)',
              required: true,
            }}
          >
            <Input
              type="text"
              disabled={disabled || loading}
              className="font-mono text-sm"
            />
          </FormField>
          
          {/* Field Label */}
          <FormField
            control={form.control}
            name="label"
            config={{
              label: 'Field Label',
              placeholder: 'Enter display label',
              description: 'Human-readable label for forms and displays',
              required: true,
            }}
          >
            <Input
              type="text"
              disabled={disabled || loading}
            />
          </FormField>
          
          {/* Field Type */}
          <FormField
            control={form.control}
            name="type"
            config={{
              label: 'Field Type',
              description: 'Database field data type',
              required: true,
            }}
          >
            <Select
              options={FIELD_TYPES.map(type => ({
                value: type.value,
                label: type.label,
                group: type.category,
              }))}
              disabled={disabled || loading}
              placeholder="Select field type..."
            />
          </FormField>
          
          {/* Field Description */}
          <FormField
            control={form.control}
            name="description"
            config={{
              label: 'Description',
              placeholder: 'Optional field description',
              description: 'Additional information about this field',
            }}
          >
            <TextArea
              rows={3}
              disabled={disabled || loading}
            />
          </FormField>
        </div>
        
        {/* Field Constraints */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">
            Field Constraints
          </h4>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Nullable */}
            <FormField
              control={form.control}
              name="nullable"
              config={{
                label: 'Allow NULL',
                description: 'Field can have empty values',
              }}
            >
              <Toggle
                disabled={disabled || loading || watchedPrimaryKey}
              />
            </FormField>
            
            {/* Primary Key */}
            <FormField
              control={form.control}
              name="primary_key"
              config={{
                label: 'Primary Key',
                description: 'Field is a primary key',
              }}
            >
              <Toggle
                disabled={disabled || loading}
              />
            </FormField>
            
            {/* Auto Increment */}
            <FormField
              control={form.control}
              name="auto_increment"
              config={{
                label: 'Auto Increment',
                description: 'Automatically increment value',
              }}
            >
              <Toggle
                disabled={disabled || loading || !fieldConstraints.supportsAutoIncrement}
              />
            </FormField>
            
            {/* Indexed */}
            <FormField
              control={form.control}
              name="indexed"
              config={{
                label: 'Indexed',
                description: 'Create database index',
              }}
            >
              <Toggle
                disabled={disabled || loading}
              />
            </FormField>
            
            {/* Unique */}
            <FormField
              control={form.control}
              name="unique"
              config={{
                label: 'Unique',
                description: 'Enforce unique values',
              }}
            >
              <Toggle
                disabled={disabled || loading}
              />
            </FormField>
          </div>
        </div>
        
        {/* Size and Precision Constraints */}
        {(fieldConstraints.supportsSize || fieldConstraints.supportsPrecision) && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              Size & Precision
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Size */}
              {fieldConstraints.supportsSize && (
                <FormField
                  control={form.control}
                  name="size"
                  config={{
                    label: 'Size',
                    placeholder: 'Enter size',
                    description: 'Maximum field size',
                  }}
                >
                  <Input
                    type="number"
                    min={1}
                    max={65535}
                    disabled={disabled || loading}
                  />
                </FormField>
              )}
              
              {/* Precision */}
              {fieldConstraints.supportsPrecision && (
                <FormField
                  control={form.control}
                  name="precision"
                  config={{
                    label: 'Precision',
                    placeholder: 'Enter precision',
                    description: 'Total number of digits',
                  }}
                >
                  <Input
                    type="number"
                    min={1}
                    max={65}
                    disabled={disabled || loading}
                  />
                </FormField>
              )}
              
              {/* Scale */}
              {fieldConstraints.supportsPrecision && (
                <FormField
                  control={form.control}
                  name="scale"
                  config={{
                    label: 'Scale',
                    placeholder: 'Enter scale',
                    description: 'Digits after decimal point',
                  }}
                >
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    disabled={disabled || loading}
                  />
                </FormField>
              )}
            </div>
          </div>
        )}
        
        {/* Default Value */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="default_value"
            config={{
              label: 'Default Value',
              placeholder: 'Enter default value',
              description: 'Default value for new records',
            }}
          >
            <Input
              type="text"
              disabled={disabled || loading}
            />
          </FormField>
        </div>
        
        {/* Picklist Values */}
        {fieldConstraints.supportsPicklist && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="picklist_values"
              config={{
                label: 'Picklist Values',
                placeholder: 'value1, value2, value3',
                description: 'Comma-separated list of allowed values',
              }}
            >
              <TextArea
                rows={3}
                disabled={disabled || loading}
              />
            </FormField>
          </div>
        )}
        
        {/* JSON Schema */}
        {fieldConstraints.supportsJsonSchema && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="json_schema"
              config={{
                label: 'JSON Schema',
                placeholder: '{"type": "object", "properties": {...}}',
                description: 'JSON schema for validation',
              }}
            >
              <TextArea
                rows={4}
                disabled={disabled || loading}
                className="font-mono text-sm"
              />
            </FormField>
          </div>
        )}
        
        {/* Advanced Sections */}
        {showAdvanced && (
          <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            {/* Validation Rules Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Validation Rules
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowValidationRules(!showValidationRules)}
                  disabled={disabled || loading}
                >
                  {showValidationRules ? 'Hide' : 'Show'} Rules
                </Button>
              </div>
              
              {showValidationRules && (
                <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                  {form.watch('validation_rules')?.map((rule, index) => (
                    <div key={index} className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <FormField
                        control={form.control}
                        name={`validation_rules.${index}.type`}
                        config={{
                          label: 'Rule Type',
                        }}
                      >
                        <Select
                          options={VALIDATION_RULES}
                          disabled={disabled || loading}
                        />
                      </FormField>
                      
                      <FormField
                        control={form.control}
                        name={`validation_rules.${index}.value`}
                        config={{
                          label: 'Rule Value',
                        }}
                      >
                        <Input
                          type="text"
                          disabled={disabled || loading}
                        />
                      </FormField>
                      
                      <FormField
                        control={form.control}
                        name={`validation_rules.${index}.message`}
                        config={{
                          label: 'Error Message',
                        }}
                      >
                        <Input
                          type="text"
                          disabled={disabled || loading}
                        />
                      </FormField>
                      
                      <div className="flex items-end space-x-2">
                        <FormField
                          control={form.control}
                          name={`validation_rules.${index}.enabled`}
                          config={{
                            label: 'Enabled',
                          }}
                        >
                          <Toggle
                            disabled={disabled || loading}
                          />
                        </FormField>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeValidationRule(index)}
                          disabled={disabled || loading}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addValidationRule}
                    disabled={disabled || loading}
                  >
                    Add Validation Rule
                  </Button>
                </div>
              )}
            </div>
            
            {/* Relationship Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Relationship Configuration
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRelationship(!showRelationship)}
                  disabled={disabled || loading}
                >
                  {showRelationship ? 'Hide' : 'Show'} Relationship
                </Button>
              </div>
              
              {showRelationship && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                  <FormField
                    control={form.control}
                    name="relationship.type"
                    config={{
                      label: 'Relationship Type',
                    }}
                  >
                    <Select
                      options={RELATIONSHIP_TYPES}
                      disabled={disabled || loading}
                      placeholder="Select relationship type..."
                    />
                  </FormField>
                  
                  <FormField
                    control={form.control}
                    name="relationship.table"
                    config={{
                      label: 'Related Table',
                    }}
                  >
                    <Select
                      options={availableTables}
                      disabled={disabled || loading}
                      placeholder="Select related table..."
                    />
                  </FormField>
                  
                  <FormField
                    control={form.control}
                    name="relationship.field"
                    config={{
                      label: 'Related Field',
                    }}
                  >
                    <Input
                      type="text"
                      disabled={disabled || loading}
                    />
                  </FormField>
                  
                  <FormField
                    control={form.control}
                    name="relationship.on_delete"
                    config={{
                      label: 'On Delete',
                    }}
                  >
                    <Select
                      options={[
                        { value: 'CASCADE', label: 'CASCADE' },
                        { value: 'SET_NULL', label: 'SET NULL' },
                        { value: 'RESTRICT', label: 'RESTRICT' },
                        { value: 'NO_ACTION', label: 'NO ACTION' },
                      ]}
                      disabled={disabled || loading}
                      placeholder="Select action..."
                    />
                  </FormField>
                </div>
              )}
            </div>
            
            {/* Function Usage Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Function Usage
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFunctionUsage(!showFunctionUsage)}
                  disabled={disabled || loading}
                >
                  {showFunctionUsage ? 'Hide' : 'Show'} Functions
                </Button>
              </div>
              
              {showFunctionUsage && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                  <FormField
                    control={form.control}
                    name="function_usage.type"
                    config={{
                      label: 'Function Type',
                    }}
                  >
                    <Select
                      options={FUNCTION_TYPES}
                      disabled={disabled || loading}
                      placeholder="Select function type..."
                    />
                  </FormField>
                  
                  <FormField
                    control={form.control}
                    name="function_usage.expression"
                    config={{
                      label: 'Function Expression',
                      description: 'Custom expression or SQL function',
                    }}
                  >
                    <TextArea
                      rows={3}
                      disabled={disabled || loading}
                      className="font-mono text-sm"
                    />
                  </FormField>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={disabled || loading}
            >
              Reset
            </Button>
            
            <Button
              type="submit"
              loading={loading}
              disabled={disabled || !form.formState.isValid}
            >
              {initialData ? 'Update Field' : 'Create Field'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

/**
 * Display name for debugging
 */
FieldForm.displayName = 'FieldForm';

/**
 * Default export
 */
export default FieldForm;