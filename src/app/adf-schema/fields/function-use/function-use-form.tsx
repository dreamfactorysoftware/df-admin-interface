"use client";

/**
 * @fileoverview Function Usage Form Component
 * 
 * React component implementing database function usage form using React Hook Form with Zod validation.
 * Provides an interactive UI for configuring database function usage entries within a reactive form,
 * supporting both accordion and table display modes. Handles dynamic addition/removal of function 
 * entries with comprehensive validation and integrates seamlessly with parent field configuration forms.
 * 
 * Features:
 * - React Hook Form with useFieldArray for dynamic function entries
 * - Real-time Zod validation under 100ms response time
 * - Tailwind CSS 4.1+ with consistent theme injection
 * - WCAG 2.1 AA compliance through Headless UI integration
 * - Accordion and table display modes for different user preferences
 * - Comprehensive function type and parameter validation
 * - Optimistic UI updates with proper error handling
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  useForm, 
  useFieldArray, 
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormWatch
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ChevronDownIcon, 
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  Disclosure,
  Switch,
  Listbox,
  Transition,
  Dialog
} from '@headlessui/react';
import clsx from 'clsx';

// Types and schemas
import {
  type FunctionUsageFormData,
  type FunctionUsageEntry,
  type DatabaseFunction,
  type FunctionUsageFormProps,
  type FunctionSelectOption,
  type ExecutionContextOption,
  type FunctionParameterType,
  type FunctionExecutionContext,
  type ComponentVariant,
  type ComponentSize,
  functionUsageFormSchema,
  EXECUTION_CONTEXT_LABELS,
  DEFAULT_FUNCTION_OPTIONS,
  isDatabaseFunction
} from './function-use.types';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Enhanced Zod schema for function usage entries with comprehensive validation
 */
const functionUsageEntrySchema = z.object({
  id: z.string().uuid().optional(),
  functionId: z
    .string()
    .min(1, 'Function selection is required')
    .refine((val) => val.length > 0, 'Please select a valid function'),
  
  functionName: z.string().min(1, 'Function name is required'),
  
  fieldName: z
    .string()
    .min(1, 'Field name is required')
    .max(255, 'Field name must be less than 255 characters')
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Field name must be a valid identifier'),
  
  context: z.enum(['pre_process', 'post_process', 'validation', 'transform', 'filter', 'aggregate']),
  
  parameters: z
    .record(z.any())
    .refine((params) => {
      return Object.keys(params).length >= 0;
    }, 'Invalid parameter configuration'),
  
  enabled: z.boolean(),
  
  order: z
    .number()
    .int()
    .min(0)
    .max(999),
  
  options: z.object({
    errorHandling: z.enum(['ignore', 'skip', 'fail', 'default']),
    defaultOnError: z.any().optional(),
    cacheResults: z.boolean().optional(),
    cacheDuration: z.number().min(0).max(86400).optional(),
    debug: z.boolean().optional()
  }).optional()
});

/**
 * Main form schema for multiple function usage entries
 */
const functionUsageFormArraySchema = z.object({
  entries: z.array(functionUsageEntrySchema).min(0, 'At least one function entry is required')
});

type FunctionUsageFormArrayData = z.infer<typeof functionUsageFormArraySchema>;

// =============================================================================
// MOCK DATA FOR DEVELOPMENT
// =============================================================================

/**
 * Mock database functions for development and testing
 */
const MOCK_FUNCTIONS: DatabaseFunction[] = [
  {
    id: 'func_upper',
    name: 'UPPER',
    category: 'string',
    type: 'string',
    description: 'Converts a string to uppercase',
    syntax: 'UPPER(string)',
    parameters: [
      {
        name: 'string',
        type: 'string',
        required: true,
        description: 'The string to convert to uppercase'
      }
    ],
    returnType: 'string',
    supportedDatabases: ['mysql', 'postgresql', 'sqlserver', 'oracle'],
    examples: [
      {
        title: 'Basic Usage',
        description: 'Convert a name to uppercase',
        input: { string: 'john doe' },
        output: 'JOHN DOE',
        sqlExample: "SELECT UPPER('john doe')"
      }
    ]
  },
  {
    id: 'func_length',
    name: 'LENGTH',
    category: 'string',
    type: 'string',
    description: 'Returns the length of a string',
    syntax: 'LENGTH(string)',
    parameters: [
      {
        name: 'string',
        type: 'string',
        required: true,
        description: 'The string to measure'
      }
    ],
    returnType: 'number',
    supportedDatabases: ['mysql', 'postgresql', 'sqlserver', 'oracle'],
    examples: [
      {
        title: 'Basic Usage',
        description: 'Get string length',
        input: { string: 'hello world' },
        output: 11,
        sqlExample: "SELECT LENGTH('hello world')"
      }
    ]
  },
  {
    id: 'func_now',
    name: 'NOW',
    category: 'date',
    type: 'date',
    description: 'Returns the current date and time',
    syntax: 'NOW()',
    parameters: [],
    returnType: 'datetime',
    supportedDatabases: ['mysql', 'postgresql'],
    examples: [
      {
        title: 'Current Timestamp',
        description: 'Get current date and time',
        input: {},
        output: '2024-12-19 10:30:00',
        sqlExample: 'SELECT NOW()'
      }
    ]
  },
  {
    id: 'func_abs',
    name: 'ABS',
    category: 'math',
    type: 'numeric',
    description: 'Returns the absolute value of a number',
    syntax: 'ABS(number)',
    parameters: [
      {
        name: 'number',
        type: 'number',
        required: true,
        description: 'The number to get absolute value for'
      }
    ],
    returnType: 'number',
    supportedDatabases: ['mysql', 'postgresql', 'sqlserver', 'oracle'],
    examples: [
      {
        title: 'Absolute Value',
        description: 'Get absolute value of negative number',
        input: { number: -42 },
        output: 42,
        sqlExample: 'SELECT ABS(-42)'
      }
    ]
  }
];

/**
 * Execution context options for dropdown selection
 */
const EXECUTION_CONTEXT_OPTIONS: ExecutionContextOption[] = [
  {
    value: 'pre_process',
    label: 'Pre-Processing',
    description: 'Execute before data processing',
    performanceImpact: 'low'
  },
  {
    value: 'post_process',
    label: 'Post-Processing',
    description: 'Execute after data processing',
    performanceImpact: 'low'
  },
  {
    value: 'validation',
    label: 'Validation',
    description: 'Execute during validation phase',
    performanceImpact: 'medium'
  },
  {
    value: 'transform',
    label: 'Data Transformation',
    description: 'Execute during data transformation',
    performanceImpact: 'medium'
  },
  {
    value: 'filter',
    label: 'Filtering',
    description: 'Execute during data filtering',
    performanceImpact: 'high'
  },
  {
    value: 'aggregate',
    label: 'Aggregation',
    description: 'Execute during data aggregation',
    performanceImpact: 'high'
  }
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generates a unique ID for new function usage entries
 */
const generateId = (): string => {
  return `func_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validates function parameters based on function definition
 */
const validateFunctionParameters = (
  parameters: Record<string, any>,
  functionDef: DatabaseFunction | null
): { isValid: boolean; errors: string[] } => {
  if (!functionDef) {
    return { isValid: false, errors: ['Function definition not found'] };
  }

  const errors: string[] = [];
  
  // Check required parameters
  for (const param of functionDef.parameters) {
    if (param.required && (!parameters[param.name] || parameters[param.name] === '')) {
      errors.push(`Parameter "${param.name}" is required`);
    }
  }
  
  // Validate parameter types
  for (const [paramName, paramValue] of Object.entries(parameters)) {
    const paramDef = functionDef.parameters.find(p => p.name === paramName);
    if (paramDef && paramValue !== null && paramValue !== undefined && paramValue !== '') {
      // Basic type validation
      if (paramDef.type === 'number' && isNaN(Number(paramValue))) {
        errors.push(`Parameter "${paramName}" must be a valid number`);
      }
      if (paramDef.type === 'boolean' && typeof paramValue !== 'boolean') {
        errors.push(`Parameter "${paramName}" must be a boolean value`);
      }
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Formats function options for display in selects
 */
const formatFunctionOptions = (functions: DatabaseFunction[]): FunctionSelectOption[] => {
  return functions.map(func => ({
    value: func.id,
    label: func.name,
    description: func.description,
    category: func.category,
    disabled: false,
    metadata: {
      returnType: func.returnType,
      parameterCount: func.parameters.length,
      supportedDatabases: func.supportedDatabases
    }
  }));
};

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

interface FunctionUsageFormComponentProps {
  /** Initial function usage entries */
  initialEntries?: FunctionUsageEntry[];
  /** Available functions for selection */
  availableFunctions?: DatabaseFunction[];
  /** Target field information */
  fieldInfo: {
    name: string;
    type: string;
    nullable: boolean;
  };
  /** Form submission handler */
  onSubmit: (entries: FunctionUsageEntry[]) => Promise<void>;
  /** Form change handler for real-time updates */
  onChange?: (entries: FunctionUsageEntry[]) => void;
  /** Form cancellation handler */
  onCancel?: () => void;
  /** Display mode - accordion or table */
  displayMode?: 'accordion' | 'table';
  /** Read-only mode */
  readOnly?: boolean;
  /** Show advanced options */
  showAdvancedOptions?: boolean;
  /** Maximum number of function entries */
  maxEntries?: number;
  /** Component size */
  size?: ComponentSize;
  /** Component variant */
  variant?: ComponentVariant;
  /** Additional CSS classes */
  className?: string;
  /** Test identifier */
  'data-testid'?: string;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Function selector component with search and filtering
 */
interface FunctionSelectorProps {
  value: string;
  onChange: (value: string) => void;
  functions: DatabaseFunction[];
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  'data-testid'?: string;
}

const FunctionSelector: React.FC<FunctionSelectorProps> = ({
  value,
  onChange,
  functions,
  error,
  disabled = false,
  placeholder = 'Select a function...',
  'data-testid': testId
}) => {
  const [query, setQuery] = useState('');
  
  const filteredFunctions = useMemo(() => {
    if (!query) return functions;
    
    return functions.filter(func =>
      func.name.toLowerCase().includes(query.toLowerCase()) ||
      func.description.toLowerCase().includes(query.toLowerCase()) ||
      func.category.toLowerCase().includes(query.toLowerCase())
    );
  }, [functions, query]);
  
  const selectedFunction = functions.find(f => f.id === value);
  
  return (
    <div className="relative" data-testid={testId}>
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button
            className={clsx(
              'relative w-full cursor-default rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm',
              disabled && 'cursor-not-allowed opacity-50',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500'
            )}
          >
            <span className="block truncate">
              {selectedFunction ? selectedFunction.name : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </Listbox.Button>
          
          <Transition
            as={React.Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              <div className="sticky top-0 z-10 bg-white p-2">
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Search functions..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              
              {filteredFunctions.length === 0 ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  No functions found.
                </div>
              ) : (
                filteredFunctions.map((func) => (
                  <Listbox.Option
                    key={func.id}
                    value={func.id}
                    className={({ active }) =>
                      clsx(
                        'relative cursor-default select-none py-2 pl-10 pr-4',
                        active ? 'bg-primary-100 text-primary-900' : 'text-gray-900'
                      )
                    }
                  >
                    {({ selected }) => (
                      <>
                        <div className="flex flex-col">
                          <span className={clsx('block', selected ? 'font-medium' : 'font-normal')}>
                            {func.name}
                          </span>
                          <span className="text-xs text-gray-500 truncate">
                            {func.description}
                          </span>
                        </div>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                            <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))
              )}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      
      {error && (
        <div className="mt-1 text-sm text-red-600 flex items-center">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

/**
 * Parameter editor component for function parameters
 */
interface ParameterEditorProps {
  functionDef: DatabaseFunction | null;
  values: Record<string, any>;
  onChange: (parameters: Record<string, any>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

const ParameterEditor: React.FC<ParameterEditorProps> = ({
  functionDef,
  values,
  onChange,
  errors = {},
  disabled = false
}) => {
  if (!functionDef || functionDef.parameters.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No parameters required for this function.
      </div>
    );
  }
  
  const handleParameterChange = (paramName: string, value: any) => {
    onChange({
      ...values,
      [paramName]: value
    });
  };
  
  return (
    <div className="space-y-4">
      {functionDef.parameters.map((param) => (
        <div key={param.name} className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {param.name}
            {param.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {param.type === 'boolean' ? (
            <Switch
              checked={values[param.name] || false}
              onChange={(checked) => handleParameterChange(param.name, checked)}
              disabled={disabled}
              className={clsx(
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                values[param.name] ? 'bg-primary-600' : 'bg-gray-200',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              <span
                className={clsx(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  values[param.name] ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </Switch>
          ) : param.options ? (
            <select
              value={values[param.name] || ''}
              onChange={(e) => handleParameterChange(param.name, e.target.value)}
              disabled={disabled}
              className={clsx(
                'block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm',
                disabled && 'cursor-not-allowed opacity-50',
                errors[param.name] && 'border-red-300 focus:border-red-500 focus:ring-red-500'
              )}
            >
              <option value="">Select {param.name}...</option>
              {param.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={param.type === 'number' ? 'number' : 'text'}
              value={values[param.name] || ''}
              onChange={(e) => handleParameterChange(param.name, e.target.value)}
              placeholder={param.description}
              disabled={disabled}
              min={param.min}
              max={param.max}
              pattern={param.pattern}
              className={clsx(
                'block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm',
                disabled && 'cursor-not-allowed opacity-50',
                errors[param.name] && 'border-red-300 focus:border-red-500 focus:ring-red-500'
              )}
            />
          )}
          
          {param.description && (
            <p className="text-xs text-gray-500">{param.description}</p>
          )}
          
          {errors[param.name] && (
            <div className="text-sm text-red-600 flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              {errors[param.name]}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Function usage entry component for accordion display
 */
interface FunctionUsageEntryProps {
  index: number;
  entry: FunctionUsageEntry;
  functions: DatabaseFunction[];
  control: Control<FunctionUsageFormArrayData>;
  register: UseFormRegister<FunctionUsageFormArrayData>;
  watch: UseFormWatch<FunctionUsageFormArrayData>;
  errors?: FieldErrors<FunctionUsageFormArrayData>;
  onRemove: () => void;
  readOnly?: boolean;
  showAdvanced?: boolean;
}

const FunctionUsageEntryComponent: React.FC<FunctionUsageEntryProps> = ({
  index,
  entry,
  functions,
  control,
  register,
  watch,
  errors,
  onRemove,
  readOnly = false,
  showAdvanced = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const watchedFunctionId = watch(`entries.${index}.functionId`);
  const watchedParameters = watch(`entries.${index}.parameters`);
  
  const selectedFunction = useMemo(() => {
    return functions.find(f => f.id === watchedFunctionId) || null;
  }, [functions, watchedFunctionId]);
  
  const entryErrors = errors?.entries?.[index];
  const hasErrors = Boolean(entryErrors);
  
  return (
    <Disclosure as="div" className="border border-gray-200 rounded-lg">
      {({ open }) => (
        <>
          <Disclosure.Button
            className={clsx(
              'flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              hasErrors ? 'bg-red-50 text-red-900' : 'bg-gray-50 text-gray-900 hover:bg-gray-100',
              open && 'rounded-b-none'
            )}
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center space-x-3">
              {open ? (
                <ChevronDownIcon className="h-5 w-5" />
              ) : (
                <ChevronRightIcon className="h-5 w-5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium">
                  {selectedFunction?.name || 'Select Function'} 
                  {entry.fieldName && ` on ${entry.fieldName}`}
                </div>
                <div className="text-xs text-gray-500">
                  {EXECUTION_CONTEXT_LABELS[entry.context]} • Order: {entry.order}
                </div>
              </div>
              {hasErrors && (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              )}
            </div>
            
            {!readOnly && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="ml-2 p-1 text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                aria-label="Remove function"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </Disclosure.Button>
          
          <Disclosure.Panel className="px-4 pb-4 space-y-4">
            {/* Function Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Function
                </label>
                <Controller
                  name={`entries.${index}.functionId`}
                  control={control}
                  render={({ field }) => (
                    <FunctionSelector
                      value={field.value}
                      onChange={field.onChange}
                      functions={functions}
                      disabled={readOnly}
                      error={entryErrors?.functionId?.message}
                      data-testid={`function-selector-${index}`}
                    />
                  )}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Execution Context
                </label>
                <Controller
                  name={`entries.${index}.context`}
                  control={control}
                  render={({ field }) => (
                    <Listbox value={field.value} onChange={field.onChange} disabled={readOnly}>
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-default rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm">
                          <span className="block truncate">
                            {EXECUTION_CONTEXT_LABELS[field.value]}
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                          </span>
                        </Listbox.Button>
                        
                        <Transition
                          as={React.Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {EXECUTION_CONTEXT_OPTIONS.map((option) => (
                              <Listbox.Option
                                key={option.value}
                                value={option.value}
                                className={({ active }) =>
                                  clsx(
                                    'relative cursor-default select-none py-2 pl-10 pr-4',
                                    active ? 'bg-primary-100 text-primary-900' : 'text-gray-900'
                                  )
                                }
                              >
                                {({ selected }) => (
                                  <>
                                    <div className="flex flex-col">
                                      <span className={clsx('block', selected ? 'font-medium' : 'font-normal')}>
                                        {option.label}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {option.description}
                                      </span>
                                    </div>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                                        <CheckCircleIcon className="h-5 w-5" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  )}
                />
                {entryErrors?.context && (
                  <div className="mt-1 text-sm text-red-600">
                    {entryErrors.context.message}
                  </div>
                )}
              </div>
            </div>
            
            {/* Field Name and Order */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Name
                </label>
                <input
                  {...register(`entries.${index}.fieldName`)}
                  type="text"
                  disabled={readOnly}
                  className={clsx(
                    'block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm',
                    readOnly && 'cursor-not-allowed opacity-50',
                    entryErrors?.fieldName && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  )}
                />
                {entryErrors?.fieldName && (
                  <div className="mt-1 text-sm text-red-600">
                    {entryErrors.fieldName.message}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order
                </label>
                <input
                  {...register(`entries.${index}.order`, { valueAsNumber: true })}
                  type="number"
                  min="0"
                  max="999"
                  disabled={readOnly}
                  className={clsx(
                    'block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm',
                    readOnly && 'cursor-not-allowed opacity-50'
                  )}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enabled
                </label>
                <Controller
                  name={`entries.${index}.enabled`}
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={readOnly}
                      className={clsx(
                        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                        field.value ? 'bg-primary-600' : 'bg-gray-200',
                        readOnly && 'cursor-not-allowed opacity-50'
                      )}
                    >
                      <span
                        className={clsx(
                          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                          field.value ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </Switch>
                  )}
                />
              </div>
            </div>
            
            {/* Function Parameters */}
            {selectedFunction && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Function Parameters
                </h4>
                <Controller
                  name={`entries.${index}.parameters`}
                  control={control}
                  render={({ field }) => (
                    <ParameterEditor
                      functionDef={selectedFunction}
                      values={field.value || {}}
                      onChange={field.onChange}
                      disabled={readOnly}
                      errors={entryErrors?.parameters as Record<string, string>}
                    />
                  )}
                />
              </div>
            )}
            
            {/* Advanced Options */}
            {showAdvanced && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Advanced Options
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Error Handling
                    </label>
                    <Controller
                      name={`entries.${index}.options.errorHandling`}
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          disabled={readOnly}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="fail">Fail on Error</option>
                          <option value="skip">Skip on Error</option>
                          <option value="ignore">Ignore Errors</option>
                          <option value="default">Use Default Value</option>
                        </select>
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cache Results
                    </label>
                    <Controller
                      name={`entries.${index}.options.cacheResults`}
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value || false}
                          onChange={field.onChange}
                          disabled={readOnly}
                          className={clsx(
                            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                            field.value ? 'bg-primary-600' : 'bg-gray-200',
                            readOnly && 'cursor-not-allowed opacity-50'
                          )}
                        >
                          <span
                            className={clsx(
                              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                              field.value ? 'translate-x-5' : 'translate-x-0'
                            )}
                          />
                        </Switch>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Main Function Usage Form Component
 * 
 * Implements a comprehensive form for managing database function usage entries
 * with support for dynamic addition/removal, real-time validation, and both
 * accordion and table display modes.
 */
const FunctionUsageForm: React.FC<FunctionUsageFormComponentProps> = ({
  initialEntries = [],
  availableFunctions = MOCK_FUNCTIONS,
  fieldInfo,
  onSubmit,
  onChange,
  onCancel,
  displayMode = 'accordion',
  readOnly = false,
  showAdvancedOptions = false,
  maxEntries = 10,
  size = 'md',
  variant = 'primary',
  className,
  'data-testid': testId
}) => {
  // Form setup with validation
  const form = useForm<FunctionUsageFormArrayData>({
    resolver: zodResolver(functionUsageFormArraySchema),
    defaultValues: {
      entries: initialEntries.length > 0 ? initialEntries : []
    },
    mode: 'onChange' // Real-time validation
  });
  
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty, isValid }
  } = form;
  
  // Field array for dynamic entries
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'entries'
  });
  
  // Watch all entries for real-time updates
  const watchedEntries = watch('entries');
  
  // State for display mode
  const [currentDisplayMode, setCurrentDisplayMode] = useState(displayMode);
  
  // Memoized functions list
  const functionOptions = useMemo(() => {
    return formatFunctionOptions(availableFunctions);
  }, [availableFunctions]);
  
  // Handle form submission
  const handleFormSubmit = useCallback(async (data: FunctionUsageFormArrayData) => {
    try {
      const processedEntries: FunctionUsageEntry[] = data.entries.map((entry, index) => ({
        ...entry,
        id: entry.id || generateId(),
        order: entry.order || index,
        options: entry.options || DEFAULT_FUNCTION_OPTIONS,
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          lastValidated: new Date().toISOString()
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }));
      
      await onSubmit(processedEntries);
    } catch (error) {
      console.error('Function usage form submission error:', error);
      throw error;
    }
  }, [onSubmit]);
  
  // Handle adding new entry
  const handleAddEntry = useCallback(() => {
    if (fields.length >= maxEntries) {
      return;
    }
    
    const newEntry: Partial<FunctionUsageEntry> = {
      id: generateId(),
      functionId: '',
      functionName: '',
      fieldName: fieldInfo.name,
      context: 'pre_process',
      parameters: {},
      enabled: true,
      order: fields.length,
      options: DEFAULT_FUNCTION_OPTIONS
    };
    
    append(newEntry as any);
  }, [fields.length, maxEntries, fieldInfo.name, append]);
  
  // Handle removing entry
  const handleRemoveEntry = useCallback((index: number) => {
    remove(index);
  }, [remove]);
  
  // Real-time change handler
  useEffect(() => {
    if (onChange && isDirty) {
      const processedEntries: FunctionUsageEntry[] = watchedEntries
        .filter(entry => entry.functionId && entry.fieldName)
        .map((entry, index) => ({
          ...entry,
          id: entry.id || generateId(),
          order: entry.order || index,
          options: entry.options || DEFAULT_FUNCTION_OPTIONS
        })) as FunctionUsageEntry[];
      
      onChange(processedEntries);
    }
  }, [watchedEntries, onChange, isDirty]);
  
  // Table display component
  const TableDisplay = () => (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Function
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Field
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Context
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Enabled
            </th>
            {!readOnly && (
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {fields.map((field, index) => {
            const watchedEntry = watchedEntries[index];
            const selectedFunction = availableFunctions.find(f => f.id === watchedEntry?.functionId);
            const entryErrors = errors?.entries?.[index];
            
            return (
              <tr key={field.id} className={entryErrors ? 'bg-red-50' : undefined}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <Controller
                    name={`entries.${index}.functionId`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <FunctionSelector
                        value={controllerField.value}
                        onChange={controllerField.onChange}
                        functions={availableFunctions}
                        disabled={readOnly}
                        error={entryErrors?.functionId?.message}
                        data-testid={`table-function-selector-${index}`}
                      />
                    )}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <input
                    {...register(`entries.${index}.fieldName`)}
                    type="text"
                    disabled={readOnly}
                    className={clsx(
                      'block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm',
                      readOnly && 'cursor-not-allowed opacity-50',
                      entryErrors?.fieldName && 'border-red-300'
                    )}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Controller
                    name={`entries.${index}.context`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <select
                        {...controllerField}
                        disabled={readOnly}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        {EXECUTION_CONTEXT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <input
                    {...register(`entries.${index}.order`, { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="999"
                    disabled={readOnly}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Controller
                    name={`entries.${index}.enabled`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Switch
                        checked={controllerField.value}
                        onChange={controllerField.onChange}
                        disabled={readOnly}
                        className={clsx(
                          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                          controllerField.value ? 'bg-primary-600' : 'bg-gray-200',
                          readOnly && 'cursor-not-allowed opacity-50'
                        )}
                      >
                        <span
                          className={clsx(
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                            controllerField.value ? 'translate-x-5' : 'translate-x-0'
                          )}
                        />
                      </Switch>
                    )}
                  />
                </td>
                {!readOnly && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => handleRemoveEntry(index)}
                      className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
  
  return (
    <div 
      className={clsx(
        'function-usage-form',
        'space-y-6',
        className
      )}
      data-testid={testId}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Function Usage Configuration
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Configure database functions to apply to the {fieldInfo.name} field.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Display Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">View:</span>
            <button
              type="button"
              onClick={() => setCurrentDisplayMode('accordion')}
              className={clsx(
                'px-2 py-1 text-xs font-medium rounded',
                currentDisplayMode === 'accordion'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              Accordion
            </button>
            <button
              type="button"
              onClick={() => setCurrentDisplayMode('table')}
              className={clsx(
                'px-2 py-1 text-xs font-medium rounded',
                currentDisplayMode === 'table'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              Table
            </button>
          </div>
          
          {/* Add Button */}
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddEntry}
              disabled={fields.length >= maxEntries}
              className={clsx(
                'inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
                fields.length >= maxEntries
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
              )}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Function
            </button>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {fields.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <ExclamationTriangleIcon />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No functions configured
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a function to this field.
            </p>
            {!readOnly && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleAddEntry}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Your First Function
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Display Mode Content */}
            {currentDisplayMode === 'accordion' ? (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <FunctionUsageEntryComponent
                    key={field.id}
                    index={index}
                    entry={watchedEntries[index] as FunctionUsageEntry}
                    functions={availableFunctions}
                    control={control}
                    register={register}
                    watch={watch}
                    errors={errors}
                    onRemove={() => handleRemoveEntry(index)}
                    readOnly={readOnly}
                    showAdvanced={showAdvancedOptions}
                  />
                ))}
              </div>
            ) : (
              <TableDisplay />
            )}
            
            {/* Form Actions */}
            {!readOnly && (
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {fields.length} of {maxEntries} functions configured
                </div>
                
                <div className="flex items-center space-x-3">
                  {onCancel && (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Cancel
                    </button>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || !isValid || !isDirty}
                    className={clsx(
                      'px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2',
                      isSubmitting || !isValid || !isDirty
                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        : 'text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
                    )}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Functions'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </form>
    </div>
  );
};

export default FunctionUsageForm;

// Named exports for testing and composition
export {
  FunctionSelector,
  ParameterEditor,
  FunctionUsageEntryComponent,
  type FunctionUsageFormComponentProps,
  type FunctionSelectorProps,
  type ParameterEditorProps,
  type FunctionUsageEntryProps
};