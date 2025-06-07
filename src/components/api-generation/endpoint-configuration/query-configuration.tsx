/**
 * Query Configuration Component
 * 
 * Advanced query builder component for configuring API endpoint parameters including
 * filtering, sorting, pagination, and custom query parameters. Features real-time
 * query preview with syntax highlighting and comprehensive validation.
 * 
 * @author DreamFactory Admin Interface Team
 * @version 1.0.0
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';

// Type imports
import {
  QueryConfiguration,
  QueryConfigurationProps,
  FilterCondition,
  SortConfiguration,
  QueryParameterConfiguration,
  FilterOperator,
  FilterDataType,
  LogicalOperator,
  SortOrder,
  OperatorConfig,
  QueryGenerationResult,
  ValidationError
} from './types/query-config.types';

// Schema imports
import {
  queryConfigurationFormSchema,
  QueryConfigurationFormData,
  defaultQueryConfiguration,
  validateFilterCondition,
  validateSortConfiguration,
  validatePaginationConfiguration
} from './schemas/query.schema';

// UI Component imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Icons for better UX
import {
  PlusIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CogIcon
} from '@heroicons/react/24/outline';

/**
 * Operator configuration for different data types with support requirements
 */
const OPERATOR_CONFIGS: OperatorConfig[] = [
  {
    operator: 'equals',
    label: 'Equals',
    supportedTypes: ['string', 'number', 'boolean', 'date', 'datetime'],
    requiresValue: true,
    supportsMultipleValues: false,
    description: 'Exact match comparison'
  },
  {
    operator: 'not_equals',
    label: 'Not Equals',
    supportedTypes: ['string', 'number', 'boolean', 'date', 'datetime'],
    requiresValue: true,
    supportsMultipleValues: false,
    description: 'Exclude exact matches'
  },
  {
    operator: 'like',
    label: 'Contains',
    supportedTypes: ['string'],
    requiresValue: true,
    supportsMultipleValues: false,
    description: 'Pattern matching with wildcards'
  },
  {
    operator: 'not_like',
    label: 'Does Not Contain',
    supportedTypes: ['string'],
    requiresValue: true,
    supportsMultipleValues: false,
    description: 'Exclude pattern matches'
  },
  {
    operator: 'starts_with',
    label: 'Starts With',
    supportedTypes: ['string'],
    requiresValue: true,
    supportsMultipleValues: false,
    description: 'Matches beginning of string'
  },
  {
    operator: 'ends_with',
    label: 'Ends With',
    supportedTypes: ['string'],
    requiresValue: true,
    supportsMultipleValues: false,
    description: 'Matches end of string'
  },
  {
    operator: 'greater_than',
    label: 'Greater Than',
    supportedTypes: ['number', 'date', 'datetime'],
    requiresValue: true,
    supportsMultipleValues: false,
    description: 'Numeric or date comparison >'
  },
  {
    operator: 'greater_than_or_equal',
    label: 'Greater Than or Equal',
    supportedTypes: ['number', 'date', 'datetime'],
    requiresValue: true,
    supportsMultipleValues: false,
    description: 'Numeric or date comparison >='
  },
  {
    operator: 'less_than',
    label: 'Less Than',
    supportedTypes: ['number', 'date', 'datetime'],
    requiresValue: true,
    supportsMultipleValues: false,
    description: 'Numeric or date comparison <'
  },
  {
    operator: 'less_than_or_equal',
    label: 'Less Than or Equal',
    supportedTypes: ['number', 'date', 'datetime'],
    requiresValue: true,
    supportsMultipleValues: false,
    description: 'Numeric or date comparison <='
  },
  {
    operator: 'in',
    label: 'In List',
    supportedTypes: ['string', 'number'],
    requiresValue: true,
    supportsMultipleValues: true,
    description: 'Matches any value in list'
  },
  {
    operator: 'not_in',
    label: 'Not In List',
    supportedTypes: ['string', 'number'],
    requiresValue: true,
    supportsMultipleValues: true,
    description: 'Excludes values in list'
  },
  {
    operator: 'is_null',
    label: 'Is Null',
    supportedTypes: ['string', 'number', 'boolean', 'date', 'datetime', 'json'],
    requiresValue: false,
    supportsMultipleValues: false,
    description: 'Field has no value'
  },
  {
    operator: 'is_not_null',
    label: 'Is Not Null',
    supportedTypes: ['string', 'number', 'boolean', 'date', 'datetime', 'json'],
    requiresValue: false,
    supportsMultipleValues: false,
    description: 'Field has a value'
  },
  {
    operator: 'between',
    label: 'Between',
    supportedTypes: ['number', 'date', 'datetime'],
    requiresValue: true,
    supportsMultipleValues: true,
    description: 'Value within range (inclusive)'
  },
  {
    operator: 'not_between',
    label: 'Not Between',
    supportedTypes: ['number', 'date', 'datetime'],
    requiresValue: true,
    supportsMultipleValues: true,
    description: 'Value outside range'
  }
];

/**
 * Simple Select component since the dest_file select doesn't exist yet
 */
interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({ value, onValueChange, placeholder, children, disabled }) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    disabled={disabled}
    className={cn(
      'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
      'placeholder:text-gray-400',
      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
    )}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {children}
  </select>
);

/**
 * Simple Textarea component since the dest_file textarea doesn't exist yet
 */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error = false, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
        'placeholder:text-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-red-500 focus:ring-red-500',
        'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = 'Textarea';

/**
 * Filter Condition Builder Component
 * Builds individual filter conditions with operator and value selection
 */
interface FilterConditionBuilderProps {
  condition: FilterCondition;
  availableFields: Array<{
    name: string;
    type: FilterDataType;
    nullable: boolean;
    description?: string;
  }>;
  onConditionChange: (condition: FilterCondition) => void;
  onConditionRemove: (conditionId: string) => void;
  showLogicalOperator?: boolean;
  disabled?: boolean;
  index: number;
}

const FilterConditionBuilder: React.FC<FilterConditionBuilderProps> = ({
  condition,
  availableFields,
  onConditionChange,
  onConditionRemove,
  showLogicalOperator = true,
  disabled = false,
  index
}) => {
  // Get available operators for the selected field's data type
  const selectedField = availableFields.find(f => f.name === condition.field);
  const availableOperators = useMemo(() => {
    if (!selectedField) return [];
    return OPERATOR_CONFIGS.filter(op => 
      op.supportedTypes.includes(selectedField.type)
    );
  }, [selectedField]);

  // Get current operator config
  const operatorConfig = OPERATOR_CONFIGS.find(op => op.operator === condition.operator);

  // Handle field change
  const handleFieldChange = useCallback((fieldName: string) => {
    const field = availableFields.find(f => f.name === fieldName);
    if (!field) return;

    onConditionChange({
      ...condition,
      field: fieldName,
      dataType: field.type,
      // Reset operator and value when field changes
      operator: 'equals',
      value: null
    });
  }, [condition, availableFields, onConditionChange]);

  // Handle operator change
  const handleOperatorChange = useCallback((operator: FilterOperator) => {
    onConditionChange({
      ...condition,
      operator,
      // Reset value when operator changes
      value: null
    });
  }, [condition, onConditionChange]);

  // Handle value change
  const handleValueChange = useCallback((value: string | number | boolean | string[] | number[] | null) => {
    onConditionChange({
      ...condition,
      value
    });
  }, [condition, onConditionChange]);

  // Handle logical operator change
  const handleLogicalOperatorChange = useCallback((logicalOperator: LogicalOperator) => {
    onConditionChange({
      ...condition,
      logicalOperator
    });
  }, [condition, onConditionChange]);

  // Render value input based on operator and data type
  const renderValueInput = () => {
    if (!operatorConfig?.requiresValue) return null;

    const { dataType } = condition;
    const { supportsMultipleValues } = operatorConfig;

    if (supportsMultipleValues) {
      // Array input for IN, NOT IN, BETWEEN operators
      const arrayValue = Array.isArray(condition.value) ? condition.value : [];
      const isStringArray = dataType === 'string';
      
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Values (comma-separated)
          </label>
          <Input
            type="text"
            placeholder={isStringArray ? "value1, value2, value3" : "1, 2, 3"}
            value={arrayValue.join(', ')}
            onChange={(e) => {
              const values = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
              const processedValues = isStringArray ? values : values.map(v => {
                const num = Number(v);
                return isNaN(num) ? v : num;
              });
              handleValueChange(processedValues);
            }}
            disabled={disabled}
          />
        </div>
      );
    }

    // Single value input
    switch (dataType) {
      case 'boolean':
        return (
          <Select
            value={condition.value?.toString() || ''}
            onValueChange={(value) => handleValueChange(value === 'true')}
            placeholder="Select boolean value"
            disabled={disabled}
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </Select>
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder="Enter number"
            value={condition.value?.toString() || ''}
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              handleValueChange(isNaN(num) ? null : num);
            }}
            disabled={disabled}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={condition.value?.toString() || ''}
            onChange={(e) => handleValueChange(e.target.value || null)}
            disabled={disabled}
          />
        );

      case 'datetime':
        return (
          <Input
            type="datetime-local"
            value={condition.value?.toString() || ''}
            onChange={(e) => handleValueChange(e.target.value || null)}
            disabled={disabled}
          />
        );

      default:
        return (
          <Input
            type="text"
            placeholder="Enter value"
            value={condition.value?.toString() || ''}
            onChange={(e) => handleValueChange(e.target.value || null)}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Filter {index + 1}
          </Badge>
          {selectedField && (
            <Badge variant="secondary" className="text-xs">
              {selectedField.type}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onConditionRemove(condition.id)}
          disabled={disabled}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Field Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Field
          </label>
          <Select
            value={condition.field}
            onValueChange={handleFieldChange}
            placeholder="Select field"
            disabled={disabled}
          >
            {availableFields.map((field) => (
              <option key={field.name} value={field.name}>
                {field.name} ({field.type})
              </option>
            ))}
          </Select>
        </div>

        {/* Operator Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Operator
          </label>
          <Select
            value={condition.operator}
            onValueChange={(value) => handleOperatorChange(value as FilterOperator)}
            placeholder="Select operator"
            disabled={disabled || !selectedField}
          >
            {availableOperators.map((op) => (
              <option key={op.operator} value={op.operator}>
                {op.label}
              </option>
            ))}
          </Select>
          {operatorConfig && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {operatorConfig.description}
            </p>
          )}
        </div>

        {/* Value Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Value
          </label>
          {renderValueInput()}
        </div>
      </div>

      {/* Logical Operator (for chaining) */}
      {showLogicalOperator && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Combine with next condition using:
            </span>
            <div className="flex space-x-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="AND"
                  checked={condition.logicalOperator === 'AND'}
                  onChange={(e) => handleLogicalOperatorChange(e.target.value as LogicalOperator)}
                  disabled={disabled}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">AND</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="OR"
                  checked={condition.logicalOperator === 'OR'}
                  onChange={(e) => handleLogicalOperatorChange(e.target.value as LogicalOperator)}
                  disabled={disabled}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">OR</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Sort Configuration Builder Component
 * Builds individual sort configurations with field and order selection
 */
interface SortConfigurationBuilderProps {
  sortConfig: SortConfiguration;
  availableFields: Array<{
    name: string;
    type: FilterDataType;
    nullable: boolean;
    description?: string;
  }>;
  onSortConfigChange: (sortConfig: SortConfiguration) => void;
  onSortConfigRemove: (sortConfigId: string) => void;
  disabled?: boolean;
  index: number;
}

const SortConfigurationBuilder: React.FC<SortConfigurationBuilderProps> = ({
  sortConfig,
  availableFields,
  onSortConfigChange,
  onSortConfigRemove,
  disabled = false,
  index
}) => {
  const selectedField = availableFields.find(f => f.name === sortConfig.field);

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Sort {index + 1}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Priority: {sortConfig.priority}
          </Badge>
          {selectedField && (
            <Badge variant="secondary" className="text-xs">
              {selectedField.type}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSortConfigRemove(sortConfig.id)}
          disabled={disabled}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Field Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Field
          </label>
          <Select
            value={sortConfig.field}
            onValueChange={(field) => onSortConfigChange({ ...sortConfig, field })}
            placeholder="Select field"
            disabled={disabled}
          >
            {availableFields.map((field) => (
              <option key={field.name} value={field.name}>
                {field.name} ({field.type})
              </option>
            ))}
          </Select>
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Order
          </label>
          <Select
            value={sortConfig.order}
            onValueChange={(order) => onSortConfigChange({ ...sortConfig, order: order as SortOrder })}
            disabled={disabled}
          >
            <option value="ASC">Ascending (A-Z, 1-9)</option>
            <option value="DESC">Descending (Z-A, 9-1)</option>
          </Select>
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Priority
          </label>
          <Input
            type="number"
            min="1"
            max="10"
            value={sortConfig.priority}
            onChange={(e) => {
              const priority = parseInt(e.target.value);
              if (!isNaN(priority) && priority >= 1 && priority <= 10) {
                onSortConfigChange({ ...sortConfig, priority });
              }
            }}
            disabled={disabled}
            placeholder="1-10"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Lower numbers sort first
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Query Parameter Builder Component
 * Builds custom query parameters with validation rules
 */
interface QueryParameterBuilderProps {
  parameter: QueryParameterConfiguration;
  onParameterChange: (parameter: QueryParameterConfiguration) => void;
  onParameterRemove: (parameterId: string) => void;
  disabled?: boolean;
  index: number;
}

const QueryParameterBuilder: React.FC<QueryParameterBuilderProps> = ({
  parameter,
  onParameterChange,
  onParameterRemove,
  disabled = false,
  index
}) => {
  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Parameter {index + 1}
          </Badge>
          <Badge variant={parameter.required ? "destructive" : "secondary"} className="text-xs">
            {parameter.required ? "Required" : "Optional"}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {parameter.dataType}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onParameterRemove(parameter.name)}
          disabled={disabled}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Parameter Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Parameter Name
          </label>
          <Input
            type="text"
            placeholder="parameter_name"
            value={parameter.name}
            onChange={(e) => onParameterChange({ ...parameter, name: e.target.value })}
            disabled={disabled}
          />
        </div>

        {/* Data Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Data Type
          </label>
          <Select
            value={parameter.dataType}
            onValueChange={(dataType) => onParameterChange({ ...parameter, dataType: dataType as FilterDataType })}
            disabled={disabled}
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="date">Date</option>
            <option value="datetime">DateTime</option>
            <option value="json">JSON</option>
          </Select>
        </div>

        {/* Required/Optional */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={parameter.required}
              onChange={(e) => onParameterChange({ ...parameter, required: e.target.checked })}
              disabled={disabled}
              className="text-primary-600 focus:ring-primary-500 rounded"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Required Parameter
            </span>
          </label>
        </div>

        {/* Default Value (only if not required) */}
        {!parameter.required && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Default Value
            </label>
            <Input
              type={parameter.dataType === 'number' ? 'number' : 'text'}
              placeholder="Default value"
              value={parameter.defaultValue?.toString() || ''}
              onChange={(e) => {
                let value: string | number | boolean | undefined = e.target.value;
                if (parameter.dataType === 'number' && value) {
                  const num = parseFloat(value);
                  value = isNaN(num) ? undefined : num;
                } else if (parameter.dataType === 'boolean') {
                  value = value === 'true';
                }
                onParameterChange({ ...parameter, defaultValue: value });
              }}
              disabled={disabled}
            />
          </div>
        )}

        {/* Description */}
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <Input
            type="text"
            placeholder="Parameter description"
            value={parameter.description || ''}
            onChange={(e) => onParameterChange({ ...parameter, description: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Query Preview Component
 * Displays generated SQL with syntax highlighting and validation feedback
 */
interface QueryPreviewProps {
  configuration: QueryConfigurationFormData;
  tableFields: Array<{
    name: string;
    type: FilterDataType;
    nullable: boolean;
    description?: string;
  }>;
  className?: string;
}

const QueryPreview: React.FC<QueryPreviewProps> = ({ configuration, tableFields, className }) => {
  const [queryResult, setQueryResult] = useState<QueryGenerationResult>({
    sql: '',
    parameters: {},
    errors: [],
    isValid: false
  });

  // Generate query preview
  const generateQueryPreview = useCallback(() => {
    try {
      const { filterConditions, sortConfigurations, pagination } = configuration;

      // Start building SQL
      let sql = 'SELECT * FROM {table_name}';
      const parameters: Record<string, unknown> = {};
      const errors: ValidationError[] = [];

      // Add WHERE clause for filters
      if (filterConditions.length > 0) {
        const whereClauses: string[] = [];
        
        filterConditions.forEach((condition, index) => {
          const field = tableFields.find(f => f.name === condition.field);
          if (!field) {
            errors.push({
              field: `filterConditions.${index}.field`,
              message: `Field "${condition.field}" not found`,
              code: 'FIELD_NOT_FOUND'
            });
            return;
          }

          const operatorConfig = OPERATOR_CONFIGS.find(op => op.operator === condition.operator);
          if (!operatorConfig) {
            errors.push({
              field: `filterConditions.${index}.operator`,
              message: `Invalid operator "${condition.operator}"`,
              code: 'INVALID_OPERATOR'
            });
            return;
          }

          if (operatorConfig.requiresValue && (condition.value === null || condition.value === undefined || condition.value === '')) {
            errors.push({
              field: `filterConditions.${index}.value`,
              message: 'Value is required for this operator',
              code: 'VALUE_REQUIRED'
            });
            return;
          }

          const paramName = `param_${index}`;
          let clause = '';

          switch (condition.operator) {
            case 'equals':
              clause = `${condition.field} = :${paramName}`;
              parameters[paramName] = condition.value;
              break;
            case 'not_equals':
              clause = `${condition.field} != :${paramName}`;
              parameters[paramName] = condition.value;
              break;
            case 'like':
              clause = `${condition.field} LIKE :${paramName}`;
              parameters[paramName] = `%${condition.value}%`;
              break;
            case 'not_like':
              clause = `${condition.field} NOT LIKE :${paramName}`;
              parameters[paramName] = `%${condition.value}%`;
              break;
            case 'starts_with':
              clause = `${condition.field} LIKE :${paramName}`;
              parameters[paramName] = `${condition.value}%`;
              break;
            case 'ends_with':
              clause = `${condition.field} LIKE :${paramName}`;
              parameters[paramName] = `%${condition.value}`;
              break;
            case 'greater_than':
              clause = `${condition.field} > :${paramName}`;
              parameters[paramName] = condition.value;
              break;
            case 'greater_than_or_equal':
              clause = `${condition.field} >= :${paramName}`;
              parameters[paramName] = condition.value;
              break;
            case 'less_than':
              clause = `${condition.field} < :${paramName}`;
              parameters[paramName] = condition.value;
              break;
            case 'less_than_or_equal':
              clause = `${condition.field} <= :${paramName}`;
              parameters[paramName] = condition.value;
              break;
            case 'in':
              if (Array.isArray(condition.value) && condition.value.length > 0) {
                const placeholders = condition.value.map((_, i) => `:${paramName}_${i}`).join(', ');
                clause = `${condition.field} IN (${placeholders})`;
                condition.value.forEach((val, i) => {
                  parameters[`${paramName}_${i}`] = val;
                });
              }
              break;
            case 'not_in':
              if (Array.isArray(condition.value) && condition.value.length > 0) {
                const placeholders = condition.value.map((_, i) => `:${paramName}_${i}`).join(', ');
                clause = `${condition.field} NOT IN (${placeholders})`;
                condition.value.forEach((val, i) => {
                  parameters[`${paramName}_${i}`] = val;
                });
              }
              break;
            case 'is_null':
              clause = `${condition.field} IS NULL`;
              break;
            case 'is_not_null':
              clause = `${condition.field} IS NOT NULL`;
              break;
            case 'between':
              if (Array.isArray(condition.value) && condition.value.length === 2) {
                clause = `${condition.field} BETWEEN :${paramName}_min AND :${paramName}_max`;
                parameters[`${paramName}_min`] = condition.value[0];
                parameters[`${paramName}_max`] = condition.value[1];
              }
              break;
            case 'not_between':
              if (Array.isArray(condition.value) && condition.value.length === 2) {
                clause = `${condition.field} NOT BETWEEN :${paramName}_min AND :${paramName}_max`;
                parameters[`${paramName}_min`] = condition.value[0];
                parameters[`${paramName}_max`] = condition.value[1];
              }
              break;
          }

          if (clause) {
            if (whereClauses.length > 0 && condition.logicalOperator) {
              whereClauses.push(`${condition.logicalOperator} ${clause}`);
            } else {
              whereClauses.push(clause);
            }
          }
        });

        if (whereClauses.length > 0) {
          sql += `\nWHERE ${whereClauses.join('\n  ')}`;
        }
      }

      // Add ORDER BY clause for sorting
      if (sortConfigurations.length > 0) {
        const sortClauses = sortConfigurations
          .sort((a, b) => a.priority - b.priority)
          .map(sort => `${sort.field} ${sort.order}`)
          .join(', ');
        
        sql += `\nORDER BY ${sortClauses}`;
      }

      // Add LIMIT clause for pagination
      if (pagination.enabled) {
        sql += `\nLIMIT :limit OFFSET :offset`;
        parameters.limit = pagination.defaultPageSize;
        parameters.offset = 0; // This would be calculated based on page number
      }

      setQueryResult({
        sql,
        parameters,
        errors,
        isValid: errors.length === 0
      });
    } catch (error) {
      setQueryResult({
        sql: '',
        parameters: {},
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'GENERATION_ERROR'
        }],
        isValid: false
      });
    }
  }, [configuration, tableFields]);

  // Regenerate query when configuration changes
  useEffect(() => {
    generateQueryPreview();
  }, [generateQueryPreview]);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Query Preview
        </h3>
        <div className="flex items-center space-x-2">
          {queryResult.isValid ? (
            <Badge variant="success" className="flex items-center space-x-1">
              <CheckCircleIcon className="h-3 w-3" />
              <span>Valid</span>
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center space-x-1">
              <ExclamationTriangleIcon className="h-3 w-3" />
              <span>{queryResult.errors.length} Error{queryResult.errors.length !== 1 ? 's' : ''}</span>
            </Badge>
          )}
        </div>
      </div>

      {/* SQL Preview */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Generated SQL
        </label>
        <Textarea
          value={queryResult.sql}
          readOnly
          className={cn(
            'font-mono text-sm min-h-[120px]',
            queryResult.isValid 
              ? 'border-green-300 bg-green-50 dark:bg-green-950/20' 
              : 'border-red-300 bg-red-50 dark:bg-red-950/20'
          )}
          placeholder="Query will appear here as you configure filters and sorting..."
        />
      </div>

      {/* Parameters Preview */}
      {Object.keys(queryResult.parameters).length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Query Parameters
          </label>
          <Textarea
            value={JSON.stringify(queryResult.parameters, null, 2)}
            readOnly
            className="font-mono text-sm min-h-[80px] bg-gray-50 dark:bg-gray-800"
          />
        </div>
      )}

      {/* Validation Errors */}
      {queryResult.errors.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-red-700 dark:text-red-300">
            Validation Errors
          </label>
          <div className="space-y-2">
            {queryResult.errors.map((error, index) => (
              <div
                key={index}
                className="p-3 rounded-md bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800"
              >
                <div className="flex items-start space-x-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      {error.field}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main Query Configuration Component
 * Comprehensive query builder with filtering, sorting, pagination, and preview
 */
const QueryConfiguration: React.FC<QueryConfigurationProps> = ({
  endpointId,
  initialConfiguration,
  tableFields,
  onConfigurationChange,
  onPreviewGenerated,
  disabled = false,
  className
}) => {
  // Form state management with React Hook Form and Zod validation
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setValue,
    getValues,
    reset
  } = useForm<QueryConfigurationFormData>({
    resolver: zodResolver(queryConfigurationFormSchema),
    defaultValues: {
      ...defaultQueryConfiguration,
      ...initialConfiguration
    },
    mode: 'onChange'
  });

  // Field arrays for dynamic lists
  const {
    fields: filterFields,
    append: appendFilter,
    remove: removeFilter,
    update: updateFilter
  } = useFieldArray({
    control,
    name: 'filterConditions'
  });

  const {
    fields: sortFields,
    append: appendSort,
    remove: removeSort,
    update: updateSort
  } = useFieldArray({
    control,
    name: 'sortConfigurations'
  });

  const {
    fields: parameterFields,
    append: appendParameter,
    remove: removeParameter,
    update: updateParameter
  } = useFieldArray({
    control,
    name: 'queryParameters'
  });

  // Watch form values for real-time updates
  const watchedValues = watch();

  // Track active tabs
  const [activeTab, setActiveTab] = useState<'filters' | 'sorting' | 'pagination' | 'parameters' | 'preview'>('filters');

  // Generate unique IDs for new items
  const generateId = useCallback(() => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, []);

  // Handle adding new filter condition
  const handleAddFilter = useCallback(() => {
    const maxConditions = watchedValues.maxFilterConditions || 10;
    if (filterFields.length >= maxConditions) return;

    const newFilter: FilterCondition = {
      id: generateId(),
      field: tableFields[0]?.name || '',
      operator: 'equals',
      value: null,
      dataType: tableFields[0]?.type || 'string',
      logicalOperator: 'AND'
    };

    appendFilter(newFilter);
  }, [filterFields.length, watchedValues.maxFilterConditions, tableFields, generateId, appendFilter]);

  // Handle adding new sort configuration
  const handleAddSort = useCallback(() => {
    const maxSortFields = watchedValues.maxSortFields || 5;
    if (sortFields.length >= maxSortFields) return;

    const nextPriority = Math.max(0, ...sortFields.map(s => s.priority)) + 1;
    const newSort: SortConfiguration = {
      id: generateId(),
      field: tableFields[0]?.name || '',
      order: 'ASC',
      priority: Math.min(nextPriority, 10)
    };

    appendSort(newSort);
  }, [sortFields, watchedValues.maxSortFields, tableFields, generateId, appendSort]);

  // Handle adding new query parameter
  const handleAddParameter = useCallback(() => {
    if (parameterFields.length >= 50) return; // Max 50 parameters

    const newParameter: QueryParameterConfiguration = {
      enabled: true,
      name: `param_${parameterFields.length + 1}`,
      dataType: 'string',
      required: false,
      description: ''
    };

    appendParameter(newParameter);
  }, [parameterFields.length, generateId, appendParameter]);

  // Handle form submission
  const onSubmit = useCallback((data: QueryConfigurationFormData) => {
    const fullConfiguration: QueryConfiguration = {
      id: generateId(),
      endpointId,
      ...data,
      queryPreview: '', // This would be generated
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onConfigurationChange(fullConfiguration);
  }, [endpointId, generateId, onConfigurationChange]);

  // Update configuration when form values change
  useEffect(() => {
    const subscription = watch((data) => {
      if (data && Object.keys(data).length > 0) {
        const fullConfiguration: QueryConfiguration = {
          id: generateId(),
          endpointId,
          ...data as QueryConfigurationFormData,
          queryPreview: '', // This would be generated
          createdAt: new Date(),
          updatedAt: new Date()
        };

        onConfigurationChange(fullConfiguration);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, endpointId, generateId, onConfigurationChange]);

  // Reset form when initial configuration changes
  useEffect(() => {
    if (initialConfiguration) {
      reset({
        ...defaultQueryConfiguration,
        ...initialConfiguration
      });
    }
  }, [initialConfiguration, reset]);

  // Tab navigation
  const tabs = [
    { id: 'filters', label: 'Filters', icon: CogIcon },
    { id: 'sorting', label: 'Sorting', icon: ChevronUpIcon },
    { id: 'pagination', label: 'Pagination', icon: InformationCircleIcon },
    { id: 'parameters', label: 'Parameters', icon: CogIcon },
    { id: 'preview', label: 'Preview', icon: EyeIcon }
  ] as const;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Query Configuration
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure filtering, sorting, pagination, and custom parameters for your API endpoint
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {filterFields.length} filter{filterFields.length !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {sortFields.length} sort{sortFields.length !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {parameterFields.length} parameter{parameterFields.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={disabled}
                className={cn(
                  'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  isActive
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Filters Tab */}
        {activeTab === 'filters' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Filter Conditions
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure dynamic filtering options for your API endpoint
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddFilter}
                disabled={disabled || filterFields.length >= (watchedValues.maxFilterConditions || 10)}
                className="flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Filter</span>
              </Button>
            </div>

            {/* Filter Configuration Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default Logical Operator
                </label>
                <Controller
                  name="defaultLogicalOperator"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={disabled}
                    >
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Max Filter Conditions
                </label>
                <Controller
                  name="maxFilterConditions"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      disabled={disabled}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <Controller
                    name="allowDynamicFilters"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        disabled={disabled}
                        className="text-primary-600 focus:ring-primary-500 rounded"
                      />
                    )}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Allow Dynamic Filters
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Allow API consumers to add filters at runtime
                </p>
              </div>
            </div>

            {/* Filter Conditions List */}
            <div className="space-y-4">
              {filterFields.map((field, index) => (
                <FilterConditionBuilder
                  key={field.id}
                  condition={field}
                  availableFields={tableFields}
                  onConditionChange={(condition) => updateFilter(index, condition)}
                  onConditionRemove={(conditionId) => {
                    const removeIndex = filterFields.findIndex(f => f.id === conditionId);
                    if (removeIndex !== -1) removeFilter(removeIndex);
                  }}
                  showLogicalOperator={index < filterFields.length - 1}
                  disabled={disabled}
                  index={index}
                />
              ))}

              {filterFields.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <CogIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No filter conditions configured</p>
                  <p className="text-sm mb-4">Add filter conditions to enable dynamic querying</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddFilter}
                    disabled={disabled}
                  >
                    Add Your First Filter
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sorting Tab */}
        {activeTab === 'sorting' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Sort Configuration
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure default sorting and allow dynamic sort options
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSort}
                disabled={disabled || sortFields.length >= (watchedValues.maxSortFields || 5)}
                className="flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Sort Field</span>
              </Button>
            </div>

            {/* Sort Configuration Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default Sort Field
                </label>
                <Controller
                  name="defaultSortField"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      placeholder="Select default field"
                      disabled={disabled}
                    >
                      {tableFields.map((tableField) => (
                        <option key={tableField.name} value={tableField.name}>
                          {tableField.name} ({tableField.type})
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default Sort Order
                </label>
                <Controller
                  name="defaultSortOrder"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'ASC'}
                      onValueChange={field.onChange}
                      disabled={disabled}
                    >
                      <option value="ASC">Ascending</option>
                      <option value="DESC">Descending</option>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Max Sort Fields
                </label>
                <Controller
                  name="maxSortFields"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      disabled={disabled}
                    />
                  )}
                />
              </div>

              <div className="md:col-span-3">
                <label className="flex items-center space-x-2">
                  <Controller
                    name="allowDynamicSorting"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        disabled={disabled}
                        className="text-primary-600 focus:ring-primary-500 rounded"
                      />
                    )}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Allow Dynamic Sorting
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                  Allow API consumers to specify custom sort fields and orders
                </p>
              </div>
            </div>

            {/* Sort Configurations List */}
            <div className="space-y-4">
              {sortFields.map((field, index) => (
                <SortConfigurationBuilder
                  key={field.id}
                  sortConfig={field}
                  availableFields={tableFields}
                  onSortConfigChange={(sortConfig) => updateSort(index, sortConfig)}
                  onSortConfigRemove={(sortConfigId) => {
                    const removeIndex = sortFields.findIndex(s => s.id === sortConfigId);
                    if (removeIndex !== -1) removeSort(removeIndex);
                  }}
                  disabled={disabled}
                  index={index}
                />
              ))}

              {sortFields.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <ChevronUpIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No sort configurations defined</p>
                  <p className="text-sm mb-4">Add sort fields to control result ordering</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddSort}
                    disabled={disabled}
                  >
                    Add Your First Sort Field
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pagination Tab */}
        {activeTab === 'pagination' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Pagination Configuration
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure pagination behavior and limits for your API endpoint
              </p>
            </div>

            <div className="space-y-6">
              {/* Enable Pagination */}
              <div className="flex items-center space-x-3">
                <Controller
                  name="pagination.enabled"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={disabled}
                      className="text-primary-600 focus:ring-primary-500 rounded"
                    />
                  )}
                />
                <div>
                  <label className="text-base font-medium text-gray-900 dark:text-gray-100">
                    Enable Pagination
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automatically paginate large result sets
                  </p>
                </div>
              </div>

              {/* Pagination Settings */}
              {watchedValues.pagination?.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Default Page Size
                    </label>
                    <Controller
                      name="pagination.defaultPageSize"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          min="1"
                          max="1000"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          disabled={disabled}
                        />
                      )}
                    />
                    {errors.pagination?.defaultPageSize && (
                      <p className="text-sm text-red-600">{errors.pagination.defaultPageSize.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Maximum Page Size
                    </label>
                    <Controller
                      name="pagination.maxPageSize"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          min="1"
                          max="10000"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          disabled={disabled}
                        />
                      )}
                    />
                    {errors.pagination?.maxPageSize && (
                      <p className="text-sm text-red-600">{errors.pagination.maxPageSize.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Page Size Options (comma-separated)
                    </label>
                    <Controller
                      name="pagination.pageSizeOptions"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="text"
                          placeholder="10, 25, 50, 100"
                          value={field.value.join(', ')}
                          onChange={(e) => {
                            const options = e.target.value
                              .split(',')
                              .map(s => parseInt(s.trim()))
                              .filter(n => !isNaN(n) && n > 0);
                            field.onChange(options);
                          }}
                          disabled={disabled}
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <Controller
                        name="pagination.allowPageSizeChange"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            disabled={disabled}
                            className="text-primary-600 focus:ring-primary-500 rounded"
                          />
                        )}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Allow Page Size Changes
                      </span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <Controller
                        name="pagination.showTotal"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            disabled={disabled}
                            className="text-primary-600 focus:ring-primary-500 rounded"
                          />
                        )}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Show Total Count
                      </span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <Controller
                        name="pagination.showQuickJumper"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            disabled={disabled}
                            className="text-primary-600 focus:ring-primary-500 rounded"
                          />
                        )}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Show Quick Page Jumper
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Parameters Tab */}
        {activeTab === 'parameters' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Query Parameters
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Define custom query parameters for your API endpoint
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddParameter}
                disabled={disabled || parameterFields.length >= 50}
                className="flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Parameter</span>
              </Button>
            </div>

            {/* Query Parameters List */}
            <div className="space-y-4">
              {parameterFields.map((field, index) => (
                <QueryParameterBuilder
                  key={field.name}
                  parameter={field}
                  onParameterChange={(parameter) => updateParameter(index, parameter)}
                  onParameterRemove={(parameterId) => {
                    const removeIndex = parameterFields.findIndex(p => p.name === parameterId);
                    if (removeIndex !== -1) removeParameter(removeIndex);
                  }}
                  disabled={disabled}
                  index={index}
                />
              ))}

              {parameterFields.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <CogIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No custom parameters defined</p>
                  <p className="text-sm mb-4">Add custom parameters to extend your API functionality</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddParameter}
                    disabled={disabled}
                  >
                    Add Your First Parameter
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <QueryPreview
            configuration={watchedValues}
            tableFields={tableFields}
            className="space-y-4"
          />
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={disabled || isSubmitting}
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={disabled || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </form>
    </div>
  );
};

// Export component and types
export default QueryConfiguration;
export type { QueryConfigurationProps };