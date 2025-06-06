/**
 * Service Form Fields Component
 * 
 * Dynamic form field rendering component that migrates Angular df-dynamic-field and df-array-field
 * functionality to React. Provides comprehensive field type support with React Hook Form integration,
 * Zod validation, and conditional field rendering based on service configuration schemas.
 * 
 * Supports all service configuration field types including text, password, number, select, boolean,
 * file, array, and object fields with real-time validation under 100ms per integration requirements.
 * Uses Tailwind CSS styling with Headless UI components for accessibility compliance.
 * 
 * @fileoverview Dynamic form fields for database service configuration
 * @version 1.0.0
 * @since 2024-01-01
 */

import React, { useCallback, useMemo, useState, useEffect, Fragment } from 'react';
import { 
  Controller, 
  useController,
  Control, 
  UseFormRegister, 
  UseFormWatch,
  UseFormSetValue,
  UseFormTrigger,
  FieldError,
  FieldValues,
  Path,
  PathValue
} from 'react-hook-form';
import { z } from 'zod';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';

import { Input } from '@/components/ui/input';
import type {
  DynamicFieldConfig,
  DynamicFieldType,
  SelectOption,
  ConditionalLogic,
  FieldCondition,
  ComparisonOperator,
  ConditionalAction,
  ServiceFormInput,
  BaseComponentProps,
  FieldTransform,
  FieldWidth,
  GridConfig
} from './service-form-types';
import { cn } from '@/lib/utils';

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

/**
 * Props for the main ServiceFormFields component
 */
export interface ServiceFormFieldsProps extends BaseComponentProps {
  /** Array of dynamic field configurations to render */
  fields: DynamicFieldConfig[];
  /** React Hook Form control instance */
  control: Control<ServiceFormInput>;
  /** React Hook Form register function */
  register: UseFormRegister<ServiceFormInput>;
  /** React Hook Form watch function */
  watch: UseFormWatch<ServiceFormInput>;
  /** React Hook Form setValue function */
  setValue: UseFormSetValue<ServiceFormInput>;
  /** React Hook Form trigger function for validation */
  trigger: UseFormTrigger<ServiceFormInput>;
  /** Form validation errors object */
  errors: Record<string, FieldError>;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  /** Optional section filter to render only specific field groups */
  section?: string;
  /** Layout configuration for field rendering */
  layout?: 'single' | 'two-column' | 'grid';
  /** Whether to show field groups with visual separation */
  showFieldGroups?: boolean;
  /** Enable conditional logic evaluation for fields */
  enableConditionalLogic?: boolean;
  /** Enable asynchronous validation for fields */
  enableAsyncValidation?: boolean;
  /** Callback fired when field value changes */
  onFieldChange?: (fieldName: string, value: any) => void;
  /** Callback fired when field loses focus */
  onFieldBlur?: (fieldName: string) => void;
  /** Custom component overrides for specific field types */
  customComponents?: Record<string, React.ComponentType<any>>;
}

/**
 * Props for individual dynamic field components
 */
export interface DynamicFieldProps extends BaseComponentProps {
  /** Field configuration object */
  config: DynamicFieldConfig;
  /** React Hook Form control instance */
  control: Control<ServiceFormInput>;
  /** React Hook Form register function */
  register: UseFormRegister<ServiceFormInput>;
  /** React Hook Form watch function */
  watch: UseFormWatch<ServiceFormInput>;
  /** React Hook Form setValue function */
  setValue: UseFormSetValue<ServiceFormInput>;
  /** React Hook Form trigger function */
  trigger: UseFormTrigger<ServiceFormInput>;
  /** Field validation error */
  error?: FieldError;
  /** Whether the form is submitting */
  isSubmitting?: boolean;
  /** Current form data for conditional logic */
  formData?: ServiceFormInput;
  /** Callback fired when field value changes */
  onFieldChange?: (value: any) => void;
  /** Callback fired when field loses focus */
  onFieldBlur?: () => void;
  /** Custom component override */
  customComponent?: React.ComponentType<any>;
}

/**
 * Props for array field components
 */
export interface ArrayFieldProps extends BaseComponentProps {
  /** Array field configuration */
  config: DynamicFieldConfig;
  /** React Hook Form control instance */
  control: Control<ServiceFormInput>;
  /** React Hook Form register function */
  register: UseFormRegister<ServiceFormInput>;
  /** React Hook Form watch function */
  watch: UseFormWatch<ServiceFormInput>;
  /** React Hook Form setValue function */
  setValue: UseFormSetValue<ServiceFormInput>;
  /** React Hook Form trigger function */
  trigger: UseFormTrigger<ServiceFormInput>;
  /** Field validation error */
  error?: FieldError;
  /** Whether the form is submitting */
  isSubmitting?: boolean;
  /** Nested field configurations for array items */
  itemFields?: DynamicFieldConfig[];
  /** Callback fired when array changes */
  onArrayChange?: (value: any[]) => void;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Evaluates conditional logic for field visibility and behavior
 */
const evaluateCondition = (
  condition: FieldCondition,
  formData: ServiceFormInput
): boolean => {
  const { field, operator, value, caseSensitive = true } = condition;
  const fieldValue = formData[field as keyof ServiceFormInput];
  
  // Handle case sensitivity for string comparisons
  const normalizeValue = (val: any): any => {
    if (typeof val === 'string' && !caseSensitive) {
      return val.toLowerCase();
    }
    return val;
  };
  
  const normalizedFieldValue = normalizeValue(fieldValue);
  const normalizedConditionValue = normalizeValue(value);
  
  switch (operator) {
    case 'equals':
      return normalizedFieldValue === normalizedConditionValue;
    case 'notEquals':
      return normalizedFieldValue !== normalizedConditionValue;
    case 'contains':
      return String(normalizedFieldValue).includes(String(normalizedConditionValue));
    case 'notContains':
      return !String(normalizedFieldValue).includes(String(normalizedConditionValue));
    case 'startsWith':
      return String(normalizedFieldValue).startsWith(String(normalizedConditionValue));
    case 'endsWith':
      return String(normalizedFieldValue).endsWith(String(normalizedConditionValue));
    case 'greaterThan':
      return Number(fieldValue) > Number(value);
    case 'lessThan':
      return Number(fieldValue) < Number(value);
    case 'greaterThanOrEqual':
      return Number(fieldValue) >= Number(value);
    case 'lessThanOrEqual':
      return Number(fieldValue) <= Number(value);
    case 'isEmpty':
      return !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0) || fieldValue === '';
    case 'isNotEmpty':
      return !!fieldValue && (!Array.isArray(fieldValue) || fieldValue.length > 0) && fieldValue !== '';
    case 'isNull':
      return fieldValue === null || fieldValue === undefined;
    case 'isNotNull':
      return fieldValue !== null && fieldValue !== undefined;
    case 'oneOf':
      return Array.isArray(value) && value.includes(fieldValue);
    case 'noneOf':
      return Array.isArray(value) && !value.includes(fieldValue);
    default:
      return false;
  }
};

/**
 * Evaluates complete conditional logic for a field
 */
const evaluateConditionalLogic = (
  conditional: ConditionalLogic,
  formData: ServiceFormInput
): boolean => {
  const { conditions, operator } = conditional;
  
  if (operator === 'AND') {
    return conditions.every(condition => evaluateCondition(condition, formData));
  } else {
    return conditions.some(condition => evaluateCondition(condition, formData));
  }
};

/**
 * Applies field transformation to a value
 */
const applyFieldTransform = (value: string, transform?: FieldTransform): string => {
  if (!transform || typeof value !== 'string') return value;
  
  switch (transform) {
    case 'uppercase':
      return value.toUpperCase();
    case 'lowercase':
      return value.toLowerCase();
    case 'capitalize':
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    case 'trim':
      return value.trim();
    case 'slugify':
      return value
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    case 'camelCase':
      return value.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
    case 'pascalCase':
      return value.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
        .replace(/^[a-z]/, chr => chr.toUpperCase());
    case 'kebabCase':
      return value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    case 'snakeCase':
      return value.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    default:
      return value;
  }
};

/**
 * Gets responsive grid classes based on field width configuration
 */
const getGridClasses = (width?: FieldWidth, grid?: GridConfig): string => {
  if (grid) {
    const classes = [];
    if (grid.xs) classes.push(`col-span-${grid.xs}`);
    if (grid.sm) classes.push(`sm:col-span-${grid.sm}`);
    if (grid.md) classes.push(`md:col-span-${grid.md}`);
    if (grid.lg) classes.push(`lg:col-span-${grid.lg}`);
    if (grid.xl) classes.push(`xl:col-span-${grid.xl}`);
    return classes.join(' ');
  }
  
  if (typeof width === 'string') {
    switch (width) {
      case 'full':
        return 'col-span-12';
      case 'half':
        return 'col-span-6';
      case 'third':
        return 'col-span-4';
      case 'quarter':
        return 'col-span-3';
      case 'auto':
        return 'col-auto';
      default:
        return 'col-span-12';
    }
  }
  
  if (typeof width === 'object') {
    const classes = [];
    if (width.xs) classes.push(`col-span-${width.xs}`);
    if (width.sm) classes.push(`sm:col-span-${width.sm}`);
    if (width.md) classes.push(`md:col-span-${width.md}`);
    if (width.lg) classes.push(`lg:col-span-${width.lg}`);
    if (width.xl) classes.push(`xl:col-span-${width.xl}`);
    return classes.join(' ');
  }
  
  return 'col-span-12';
};

// =============================================================================
// FIELD COMPONENTS
// =============================================================================

/**
 * Text input field component
 */
const TextField: React.FC<DynamicFieldProps> = ({
  config,
  control,
  register,
  error,
  isSubmitting,
  onFieldChange,
  onFieldBlur,
}) => {
  const { 
    name, 
    placeholder, 
    required, 
    disabled, 
    readonly,
    mask,
    transform,
    validation 
  } = config;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Apply field transformation
    if (transform) {
      value = applyFieldTransform(value, transform);
      e.target.value = value;
    }
    
    if (onFieldChange) {
      onFieldChange(value);
    }
  }, [transform, onFieldChange]);

  return (
    <Input
      {...register(name as Path<ServiceFormInput>, {
        required: required ? `${config.label} is required` : false,
        minLength: validation?.minLength ? {
          value: validation.minLength,
          message: `Minimum length is ${validation.minLength} characters`
        } : undefined,
        maxLength: validation?.maxLength ? {
          value: validation.maxLength,
          message: `Maximum length is ${validation.maxLength} characters`
        } : undefined,
        pattern: validation?.pattern ? {
          value: new RegExp(validation.pattern),
          message: 'Invalid format'
        } : undefined,
        onChange: handleChange,
        onBlur: onFieldBlur,
      })}
      placeholder={placeholder}
      disabled={disabled || isSubmitting || readonly}
      error={!!error}
      errorMessage={error?.message}
      className={readonly ? 'bg-gray-50 text-gray-500' : ''}
    />
  );
};

/**
 * Password input field component with visibility toggle
 */
const PasswordField: React.FC<DynamicFieldProps> = ({
  config,
  register,
  error,
  isSubmitting,
  onFieldChange,
  onFieldBlur,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { name, placeholder, required, disabled, readonly, validation } = config;

  return (
    <div className="relative">
      <Input
        {...register(name as Path<ServiceFormInput>, {
          required: required ? `${config.label} is required` : false,
          minLength: validation?.minLength ? {
            value: validation.minLength,
            message: `Minimum length is ${validation.minLength} characters`
          } : undefined,
          onChange: (e) => onFieldChange?.(e.target.value),
          onBlur: onFieldBlur,
        })}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        disabled={disabled || isSubmitting || readonly}
        error={!!error}
        errorMessage={error?.message}
        className={cn(
          'pr-10',
          readonly && 'bg-gray-50 text-gray-500'
        )}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 pr-3 flex items-center"
        onClick={() => setShowPassword(!showPassword)}
        disabled={readonly}
      >
        {showPassword ? (
          <EyeSlashIcon className="h-4 w-4 text-gray-400" />
        ) : (
          <EyeIcon className="h-4 w-4 text-gray-400" />
        )}
      </button>
    </div>
  );
};

/**
 * Number input field component
 */
const NumberField: React.FC<DynamicFieldProps> = ({
  config,
  register,
  error,
  isSubmitting,
  onFieldChange,
  onFieldBlur,
}) => {
  const { name, placeholder, required, disabled, readonly, validation } = config;

  return (
    <Input
      {...register(name as Path<ServiceFormInput>, {
        required: required ? `${config.label} is required` : false,
        min: validation?.min ? {
          value: validation.min,
          message: `Minimum value is ${validation.min}`
        } : undefined,
        max: validation?.max ? {
          value: validation.max,
          message: `Maximum value is ${validation.max}`
        } : undefined,
        valueAsNumber: true,
        onChange: (e) => onFieldChange?.(Number(e.target.value)),
        onBlur: onFieldBlur,
      })}
      type="number"
      placeholder={placeholder}
      disabled={disabled || isSubmitting || readonly}
      error={!!error}
      errorMessage={error?.message}
      className={readonly ? 'bg-gray-50 text-gray-500' : ''}
    />
  );
};

/**
 * Select dropdown field component
 */
const SelectField: React.FC<DynamicFieldProps> = ({
  config,
  control,
  error,
  isSubmitting,
  onFieldChange,
}) => {
  const { name, options = [], required, disabled, readonly, multiselect, searchable } = config;

  return (
    <Controller
      name={name as Path<ServiceFormInput>}
      control={control}
      rules={{
        required: required ? `${config.label} is required` : false,
      }}
      render={({ field }) => (
        <div className="relative">
          <select
            {...field}
            multiple={multiselect}
            disabled={disabled || isSubmitting || readonly}
            className={cn(
              'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-500 focus:ring-red-500',
              readonly && 'bg-gray-50 text-gray-500',
              'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
            )}
            onChange={(e) => {
              const value = multiselect 
                ? Array.from(e.target.selectedOptions, option => option.value)
                : e.target.value;
              field.onChange(value);
              onFieldChange?.(value);
            }}
          >
            {!multiselect && (
              <option value="">Select {config.label.toLowerCase()}...</option>
            )}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          {error && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {error.message}
            </p>
          )}
        </div>
      )}
    />
  );
};

/**
 * Checkbox field component using Headless UI Switch
 */
const CheckboxField: React.FC<DynamicFieldProps> = ({
  config,
  control,
  error,
  isSubmitting,
  onFieldChange,
}) => {
  const { name, required, disabled, readonly } = config;

  return (
    <Controller
      name={name as Path<ServiceFormInput>}
      control={control}
      rules={{
        required: required ? `${config.label} is required` : false,
      }}
      render={({ field }) => (
        <div className="flex items-center space-x-3">
          <Switch
            checked={field.value || false}
            onChange={(checked) => {
              field.onChange(checked);
              onFieldChange?.(checked);
            }}
            disabled={disabled || isSubmitting || readonly}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              field.value ? 'bg-primary-600' : 'bg-gray-200',
              disabled || readonly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              'dark:bg-gray-700'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition',
                field.value ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </Switch>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {error.message}
            </p>
          )}
        </div>
      )}
    />
  );
};

/**
 * Textarea field component
 */
const TextareaField: React.FC<DynamicFieldProps> = ({
  config,
  register,
  error,
  isSubmitting,
  onFieldChange,
  onFieldBlur,
}) => {
  const { name, placeholder, required, disabled, readonly, validation } = config;

  return (
    <div>
      <textarea
        {...register(name as Path<ServiceFormInput>, {
          required: required ? `${config.label} is required` : false,
          minLength: validation?.minLength ? {
            value: validation.minLength,
            message: `Minimum length is ${validation.minLength} characters`
          } : undefined,
          maxLength: validation?.maxLength ? {
            value: validation.maxLength,
            message: `Maximum length is ${validation.maxLength} characters`
          } : undefined,
          onChange: (e) => onFieldChange?.(e.target.value),
          onBlur: onFieldBlur,
        })}
        placeholder={placeholder}
        disabled={disabled || isSubmitting || readonly}
        rows={4}
        className={cn(
          'flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-500 focus:ring-red-500',
          readonly && 'bg-gray-50 text-gray-500',
          'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
        )}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error.message}
        </p>
      )}
    </div>
  );
};

/**
 * File input field component
 */
const FileField: React.FC<DynamicFieldProps> = ({
  config,
  register,
  error,
  isSubmitting,
  onFieldChange,
}) => {
  const { name, required, disabled, readonly, validation } = config;

  return (
    <div>
      <input
        {...register(name as Path<ServiceFormInput>, {
          required: required ? `${config.label} is required` : false,
          onChange: (e) => onFieldChange?.(e.target.files),
        })}
        type="file"
        disabled={disabled || isSubmitting || readonly}
        className={cn(
          'flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-500 focus:ring-red-500',
          readonly && 'bg-gray-50 text-gray-500',
          'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
        )}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error.message}
        </p>
      )}
    </div>
  );
};

/**
 * Array field component for handling dynamic arrays
 */
const ArrayField: React.FC<ArrayFieldProps> = ({
  config,
  control,
  register,
  watch,
  setValue,
  trigger,
  error,
  isSubmitting,
  itemFields = [],
  onArrayChange,
}) => {
  const { name, label } = config;
  const [isExpanded, setIsExpanded] = useState(true);
  
  const fieldArray = watch(name as Path<ServiceFormInput>) as any[] || [];

  const addItem = useCallback(() => {
    const newArray = [...fieldArray, {}];
    setValue(name as Path<ServiceFormInput>, newArray as PathValue<ServiceFormInput, Path<ServiceFormInput>>);
    onArrayChange?.(newArray);
    trigger(name as Path<ServiceFormInput>);
  }, [fieldArray, setValue, name, onArrayChange, trigger]);

  const removeItem = useCallback((index: number) => {
    const newArray = fieldArray.filter((_, i) => i !== index);
    setValue(name as Path<ServiceFormInput>, newArray as PathValue<ServiceFormInput, Path<ServiceFormInput>>);
    onArrayChange?.(newArray);
    trigger(name as Path<ServiceFormInput>);
  }, [fieldArray, setValue, name, onArrayChange, trigger]);

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
        >
          {isExpanded ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
          <span>{label} ({fieldArray.length} items)</span>
        </button>
        <button
          type="button"
          onClick={addItem}
          disabled={isSubmitting}
          className="inline-flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-800 disabled:opacity-50 dark:text-primary-400"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Item</span>
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error.message}
        </p>
      )}

      {isExpanded && (
        <div className="space-y-4">
          {fieldArray.map((_, index) => (
            <div key={index} className="relative border border-gray-100 rounded-md p-3 dark:border-gray-600">
              <div className="absolute top-2 right-2">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={isSubmitting}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              
              <div className="pr-8 space-y-3">
                {itemFields.map((itemField) => (
                  <div key={itemField.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                      {itemField.label}
                      {itemField.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <DynamicField
                      config={{
                        ...itemField,
                        name: `${name}.${index}.${itemField.name}`,
                      }}
                      control={control}
                      register={register}
                      watch={watch}
                      setValue={setValue}
                      trigger={trigger}
                      error={error}
                      isSubmitting={isSubmitting}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {fieldArray.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No items added yet. Click "Add Item" to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Object field component for handling nested objects
 */
const ObjectField: React.FC<DynamicFieldProps> = ({
  config,
  control,
  register,
  watch,
  setValue,
  trigger,
  error,
  isSubmitting,
}) => {
  const { name, label } = config;
  const [isExpanded, setIsExpanded] = useState(true);
  
  // For object fields, we would typically have nested field configurations
  // This is a simplified implementation that allows for key-value pairs
  const objectValue = watch(name as Path<ServiceFormInput>) as Record<string, any> || {};
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const addProperty = useCallback(() => {
    if (newKey && newValue) {
      const updatedObject = { ...objectValue, [newKey]: newValue };
      setValue(name as Path<ServiceFormInput>, updatedObject as PathValue<ServiceFormInput, Path<ServiceFormInput>>);
      setNewKey('');
      setNewValue('');
      trigger(name as Path<ServiceFormInput>);
    }
  }, [newKey, newValue, objectValue, setValue, name, trigger]);

  const removeProperty = useCallback((key: string) => {
    const updatedObject = { ...objectValue };
    delete updatedObject[key];
    setValue(name as Path<ServiceFormInput>, updatedObject as PathValue<ServiceFormInput, Path<ServiceFormInput>>);
    trigger(name as Path<ServiceFormInput>);
  }, [objectValue, setValue, name, trigger]);

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
        >
          {isExpanded ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
          <span>{label} ({Object.keys(objectValue).length} properties)</span>
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error.message}
        </p>
      )}

      {isExpanded && (
        <div className="space-y-4">
          {/* Existing properties */}
          {Object.entries(objectValue).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2">
              <Input
                value={key}
                disabled
                className="flex-1"
                placeholder="Property name"
              />
              <Input
                value={String(value)}
                onChange={(e) => {
                  const updatedObject = { ...objectValue, [key]: e.target.value };
                  setValue(name as Path<ServiceFormInput>, updatedObject as PathValue<ServiceFormInput, Path<ServiceFormInput>>);
                }}
                className="flex-1"
                placeholder="Property value"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => removeProperty(key)}
                disabled={isSubmitting}
                className="text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          {/* Add new property */}
          <div className="flex items-center space-x-2 pt-2 border-t border-gray-100 dark:border-gray-600">
            <Input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Property name"
              className="flex-1"
              disabled={isSubmitting}
            />
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Property value"
              className="flex-1"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={addProperty}
              disabled={!newKey || !newValue || isSubmitting}
              className="inline-flex items-center justify-center w-8 h-8 text-primary-600 hover:text-primary-800 disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main dynamic field component that renders appropriate field type
 */
const DynamicField: React.FC<DynamicFieldProps> = (props) => {
  const { config, customComponent } = props;

  // Use custom component if provided
  if (customComponent) {
    return React.createElement(customComponent, props);
  }

  // Render appropriate field component based on type
  switch (config.type) {
    case 'text':
    case 'email':
    case 'url':
    case 'tel':
      return <TextField {...props} />;
    case 'password':
      return <PasswordField {...props} />;
    case 'number':
    case 'range':
      return <NumberField {...props} />;
    case 'select':
    case 'multiselect':
      return <SelectField {...props} />;
    case 'checkbox':
    case 'switch':
      return <CheckboxField {...props} />;
    case 'textarea':
      return <TextareaField {...props} />;
    case 'file':
      return <FileField {...props} />;
    case 'array':
      return (
        <ArrayField
          config={config}
          control={props.control}
          register={props.register}
          watch={props.watch}
          setValue={props.setValue}
          trigger={props.trigger}
          error={props.error}
          isSubmitting={props.isSubmitting}
        />
      );
    case 'object':
    case 'key-value':
      return <ObjectField {...props} />;
    default:
      // Fallback to text field for unsupported types
      return <TextField {...props} />;
  }
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Service Form Fields Component
 * 
 * Renders dynamic form fields based on service configuration schemas.
 * Migrates Angular df-dynamic-field and df-array-field functionality to React
 * with React Hook Form integration and real-time Zod validation.
 */
export const ServiceFormFields: React.FC<ServiceFormFieldsProps> = ({
  fields,
  control,
  register,
  watch,
  setValue,
  trigger,
  errors,
  isSubmitting = false,
  section,
  layout = 'single',
  showFieldGroups = true,
  enableConditionalLogic = true,
  enableAsyncValidation = false,
  onFieldChange,
  onFieldBlur,
  customComponents = {},
  className,
  ...props
}) => {
  // Watch all form values for conditional logic
  const formData = watch() as ServiceFormInput;

  // Filter fields by section if specified
  const filteredFields = useMemo(() => {
    return section 
      ? fields.filter(field => field.section === section)
      : fields;
  }, [fields, section]);

  // Filter fields based on conditional logic
  const visibleFields = useMemo(() => {
    if (!enableConditionalLogic) return filteredFields;

    return filteredFields.filter(field => {
      if (!field.conditional) return !field.hidden;
      
      const shouldShow = evaluateConditionalLogic(field.conditional, formData);
      return field.conditional.action === 'show' ? shouldShow : !shouldShow;
    });
  }, [filteredFields, formData, enableConditionalLogic]);

  // Group fields by section
  const groupedFields = useMemo(() => {
    if (!showFieldGroups) {
      return { default: visibleFields };
    }

    return visibleFields.reduce((groups, field) => {
      const groupKey = field.section || 'default';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(field);
      return groups;
    }, {} as Record<string, DynamicFieldConfig[]>);
  }, [visibleFields, showFieldGroups]);

  // Sort fields by order within each group
  const sortedGroupedFields = useMemo(() => {
    const sorted: Record<string, DynamicFieldConfig[]> = {};
    
    Object.entries(groupedFields).forEach(([groupKey, groupFields]) => {
      sorted[groupKey] = groupFields.sort((a, b) => (a.order || 0) - (b.order || 0));
    });
    
    return sorted;
  }, [groupedFields]);

  // Get layout classes
  const getLayoutClasses = useCallback(() => {
    switch (layout) {
      case 'two-column':
        return 'grid grid-cols-1 md:grid-cols-2 gap-6';
      case 'grid':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
      default:
        return 'space-y-6';
    }
  }, [layout]);

  // Field change handler with conditional logic evaluation
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    if (onFieldChange) {
      onFieldChange(fieldName, value);
    }
    
    // Re-evaluate conditional logic for all fields if enabled
    if (enableConditionalLogic) {
      // Trigger validation for fields that depend on this field
      visibleFields.forEach(field => {
        if (field.conditional?.conditions.some(condition => condition.field === fieldName)) {
          trigger(field.name as Path<ServiceFormInput>);
        }
      });
    }
  }, [onFieldChange, enableConditionalLogic, visibleFields, trigger]);

  // Field blur handler
  const handleFieldBlur = useCallback((fieldName: string) => {
    if (onFieldBlur) {
      onFieldBlur(fieldName);
    }
  }, [onFieldBlur]);

  // Render field with label and description
  const renderField = useCallback((field: DynamicFieldConfig) => {
    const fieldError = errors[field.name];
    const gridClasses = getGridClasses(field.width, field.grid);
    
    return (
      <div key={field.id} className={cn('field-container', gridClasses)}>
        {/* Field Label */}
        <label 
          htmlFor={field.name}
          className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300"
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {/* Field Description */}
        {field.description && (
          <p className="text-sm text-gray-500 mb-2 dark:text-gray-400">
            {field.description}
          </p>
        )}
        
        {/* Dynamic Field Component */}
        <DynamicField
          config={field}
          control={control}
          register={register}
          watch={watch}
          setValue={setValue}
          trigger={trigger}
          error={fieldError}
          isSubmitting={isSubmitting}
          formData={formData}
          onFieldChange={(value) => handleFieldChange(field.name, value)}
          onFieldBlur={() => handleFieldBlur(field.name)}
          customComponent={customComponents[field.type]}
        />
        
        {/* Field Help Text */}
        {field.helpText && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {field.helpText}
          </p>
        )}
      </div>
    );
  }, [
    errors,
    control,
    register,
    watch,
    setValue,
    trigger,
    isSubmitting,
    formData,
    handleFieldChange,
    handleFieldBlur,
    customComponents,
  ]);

  // Render field group
  const renderFieldGroup = useCallback((groupKey: string, groupFields: DynamicFieldConfig[]) => {
    if (groupKey === 'default' && !showFieldGroups) {
      return (
        <div className={getLayoutClasses()}>
          {groupFields.map(renderField)}
        </div>
      );
    }

    return (
      <div key={groupKey} className="field-group space-y-4">
        {groupKey !== 'default' && (
          <div className="border-b border-gray-200 pb-2 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {groupKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </h3>
          </div>
        )}
        <div className={getLayoutClasses()}>
          {groupFields.map(renderField)}
        </div>
      </div>
    );
  }, [showFieldGroups, getLayoutClasses, renderField]);

  if (visibleFields.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No fields to display for the current configuration.</p>
      </div>
    );
  }

  return (
    <div className={cn('service-form-fields', className)} {...props}>
      <div className="space-y-8">
        {Object.entries(sortedGroupedFields).map(([groupKey, groupFields]) =>
          renderFieldGroup(groupKey, groupFields)
        )}
      </div>
    </div>
  );
};

export default ServiceFormFields;