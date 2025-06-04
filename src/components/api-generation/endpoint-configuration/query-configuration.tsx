/**
 * Query Configuration Component
 * 
 * Advanced component for configuring query parameters, filtering options, sorting capabilities,
 * and pagination settings for API endpoints. Features dynamic filter conditions, real-time
 * query preview with syntax highlighting, and comprehensive validation.
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon, TrashIcon, EyeIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import {
  QueryConfigurationProps,
  FilterCondition,
  SortConfiguration,
  FilterOperator,
  FilterDataType,
  LogicalOperator,
  SortOrder,
  OperatorConfig,
  QueryConfiguration
} from './types/query-config.types';

import {
  queryConfigurationFormSchema,
  defaultQueryConfiguration,
  type QueryConfigurationFormData
} from './schemas/query.schema';

/**
 * Operator configurations with metadata
 */
const OPERATOR_CONFIGS: OperatorConfig[] = [
  {
    operator: 'equals',
    label: 'Equals',
    supportedTypes: ['string', 'number', 'boolean', 'date', 'datetime'],
    requiresValue: true,
    supportsMultipleValues: false,
    description: 'Exact match'
  },
  {
    operator: 'not_equals',
    label: 'Not Equals',
    supportedTypes: ['string', 'number', 'boolean', 'date', 'datetime'],
    requiresValue: true,
    supportsMultipleValues: false,
    description: 'Does not match'
  },
  {
    operator: 'like',
    label: 'Contains',
    supportedTypes: ['string'],
    requiresValue: true,
    supportsMultipleValues: false,
    description: 'Contains substring'
  },
  {
    operator: 'not_like',
    label: 'Does Not Contain',
    supportedTypes: ['string'],
    requiresValue: true,
    supportsMultipleValues: false,
    description: 'Does not contain substring'
  },
  {
    operator: 'starts_with',
    label: 'Starts With',
    supportedTypes: ['string'],
    requiresValue: true,
    supportsMultipleValues: false,
    description: 'Begins with value'
  },
  {
    operator: 'ends_with',
    label: 'Ends With',
    supportedTypes: ['string'],
    requiresValue: true,
    supportsMultipleValues: false,
    description: 'Ends with value'
  },
  {
    operator: 'greater_than',
    label: 'Greater Than',
    supportedTypes: ['number', 'date', 'datetime'],
    requiresValue: true,
    supportsMultipleValues: false,
    description: 'Greater than value'
  },
  {
    operator: 'greater_than_or_equal',
    label: 'Greater Than or Equal',
    supportedTypes: ['number', 'date', 'datetime'],
    requiresValue: true,
    supportsMultipleValues: false,
    description: 'Greater than or equal to value'
  },
  {
    operator: 'less_than',
    label: 'Less Than',
    supportedTypes: ['number', 'date', 'datetime'],
    requiresValue: true,
    supportsMultipleValues: false,
    description: 'Less than value'
  },
  {
    operator: 'less_than_or_equal',
    label: 'Less Than or Equal',
    supportedTypes: ['number', 'date', 'datetime'],
    requiresValue: true,
    supportsMultipleValues: false,
    description: 'Less than or equal to value'
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
    description: 'Does not match any value in list'
  },
  {
    operator: 'is_null',
    label: 'Is Null',
    supportedTypes: ['string', 'number', 'boolean', 'date', 'datetime', 'json'],
    requiresValue: false,
    supportsMultipleValues: false,
    description: 'Value is null'
  },
  {
    operator: 'is_not_null',
    label: 'Is Not Null',
    supportedTypes: ['string', 'number', 'boolean', 'date', 'datetime', 'json'],
    requiresValue: false,
    supportsMultipleValues: false,
    description: 'Value is not null'
  },
  {
    operator: 'between',
    label: 'Between',
    supportedTypes: ['number', 'date', 'datetime'],
    requiresValue: true,
    supportsMultipleValues: true,
    description: 'Between two values'
  },
  {
    operator: 'not_between',
    label: 'Not Between',
    supportedTypes: ['number', 'date', 'datetime'],
    requiresValue: true,
    supportsMultipleValues: true,
    description: 'Not between two values'
  }
];

/**
 * Filter Condition Builder Component
 */
interface FilterConditionBuilderProps {
  condition: FilterCondition;
  index: number;
  availableFields: Array<{
    name: string;
    type: FilterDataType;
    nullable: boolean;
    description?: string;
  }>;
  showLogicalOperator: boolean;
  onUpdate: (index: number, condition: FilterCondition) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

const FilterConditionBuilder: React.FC<FilterConditionBuilderProps> = ({
  condition,
  index,
  availableFields,
  showLogicalOperator,
  onUpdate,
  onRemove,
  disabled = false
}) => {
  const selectedField = availableFields.find(f => f.name === condition.field);
  
  const availableOperators = useMemo(() => {
    if (!selectedField) return [];
    return OPERATOR_CONFIGS.filter(op => 
      op.supportedTypes.includes(selectedField.type)
    );
  }, [selectedField]);

  const selectedOperator = OPERATOR_CONFIGS.find(op => op.operator === condition.operator);

  const handleFieldChange = useCallback((fieldName: string) => {
    const field = availableFields.find(f => f.name === fieldName);
    if (!field) return;

    const newCondition: FilterCondition = {
      ...condition,
      field: fieldName,
      dataType: field.type,
      operator: 'equals',
      value: null
    };
    onUpdate(index, newCondition);
  }, [availableFields, condition, index, onUpdate]);

  const handleOperatorChange = useCallback((operator: FilterOperator) => {
    const newCondition: FilterCondition = {
      ...condition,
      operator,
      value: null
    };
    onUpdate(index, newCondition);
  }, [condition, index, onUpdate]);

  const handleValueChange = useCallback((value: string) => {
    let parsedValue: any = value;

    if (selectedField) {
      switch (selectedField.type) {
        case 'number':
          parsedValue = value ? parseFloat(value) : null;
          break;
        case 'boolean':
          parsedValue = value === 'true';
          break;
        case 'date':
        case 'datetime':
          parsedValue = value || null;
          break;
        default:
          parsedValue = value || null;
      }
    }

    if (selectedOperator?.supportsMultipleValues && typeof parsedValue === 'string') {
      parsedValue = parsedValue.split(',').map(v => v.trim()).filter(v => v);
    }

    const newCondition: FilterCondition = {
      ...condition,
      value: parsedValue
    };
    onUpdate(index, newCondition);
  }, [condition, index, onUpdate, selectedField, selectedOperator]);

  const handleLogicalOperatorChange = useCallback((logicalOperator: LogicalOperator) => {
    const newCondition: FilterCondition = {
      ...condition,
      logicalOperator
    };
    onUpdate(index, newCondition);
  }, [condition, index, onUpdate]);

  const renderValueInput = () => {
    if (!selectedOperator?.requiresValue) return null;

    const inputProps = {
      value: Array.isArray(condition.value) 
        ? condition.value.join(', ') 
        : condition.value?.toString() || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleValueChange(e.target.value),
      disabled,
      className: "flex-1"
    };

    if (selectedOperator.supportsMultipleValues) {
      return (
        <Input
          {...inputProps}
          placeholder={selectedOperator.operator === 'between' || selectedOperator.operator === 'not_between' 
            ? "value1, value2" 
            : "value1, value2, value3..."
          }
        />
      );
    }

    switch (selectedField?.type) {
      case 'boolean':
        return (
          <Select
            value={condition.value?.toString() || ''}
            onValueChange={handleValueChange}
            disabled={disabled}
          >
            <option value="">Select...</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </Select>
        );
      case 'date':
        return <Input {...inputProps} type="date" />;
      case 'datetime':
        return <Input {...inputProps} type="datetime-local" />;
      case 'number':
        return <Input {...inputProps} type="number" />;
      default:
        return <Input {...inputProps} type="text" />;
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
      {showLogicalOperator && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Join with:</span>
          <Select
            value={condition.logicalOperator || 'AND'}
            onValueChange={handleLogicalOperatorChange}
            disabled={disabled}
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </Select>
        </div>
      )}
      
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Field
          </label>
          <Select
            value={condition.field}
            onValueChange={handleFieldChange}
            disabled={disabled}
          >
            <option value="">Select field...</option>
            {availableFields.map((field) => (
              <option key={field.name} value={field.name}>
                {field.name} ({field.type})
              </option>
            ))}
          </Select>
        </div>

        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Operator
          </label>
          <Select
            value={condition.operator}
            onValueChange={handleOperatorChange}
            disabled={disabled || !condition.field}
          >
            <option value="">Select operator...</option>
            {availableOperators.map((op) => (
              <option key={op.operator} value={op.operator} title={op.description}>
                {op.label}
              </option>
            ))}
          </Select>
        </div>

        {selectedOperator?.requiresValue && (
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Value
            </label>
            {renderValueInput()}
          </div>
        )}

        <div className="pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(index)}
            disabled={disabled}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Sort Configuration Builder Component
 */
interface SortConfigurationBuilderProps {
  sortConfig: SortConfiguration;
  index: number;
  availableFields: Array<{
    name: string;
    type: FilterDataType;
    nullable: boolean;
    description?: string;
  }>;
  onUpdate: (index: number, sortConfig: SortConfiguration) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

const SortConfigurationBuilder: React.FC<SortConfigurationBuilderProps> = ({
  sortConfig,
  index,
  availableFields,
  onUpdate,
  onRemove,
  disabled = false
}) => {
  const handleFieldChange = useCallback((field: string) => {
    const newSortConfig: SortConfiguration = {
      ...sortConfig,
      field
    };
    onUpdate(index, newSortConfig);
  }, [index, onUpdate, sortConfig]);

  const handleOrderChange = useCallback((order: SortOrder) => {
    const newSortConfig: SortConfiguration = {
      ...sortConfig,
      order
    };
    onUpdate(index, newSortConfig);
  }, [index, onUpdate, sortConfig]);

  const handlePriorityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const priority = parseInt(e.target.value) || 1;
    const newSortConfig: SortConfiguration = {
      ...sortConfig,
      priority
    };
    onUpdate(index, newSortConfig);
  }, [index, onUpdate, sortConfig]);

  return (
    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex-1">
        <Select
          value={sortConfig.field}
          onValueChange={handleFieldChange}
          disabled={disabled}
        >
          <option value="">Select field...</option>
          {availableFields.map((field) => (
            <option key={field.name} value={field.name}>
              {field.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-32">
        <Select
          value={sortConfig.order}
          onValueChange={handleOrderChange}
          disabled={disabled}
        >
          <option value="ASC">Ascending</option>
          <option value="DESC">Descending</option>
        </Select>
      </div>

      <div className="w-20">
        <Input
          type="number"
          min="1"
          max="10"
          value={sortConfig.priority}
          onChange={handlePriorityChange}
          disabled={disabled}
          placeholder="Priority"
        />
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onRemove(index)}
        disabled={disabled}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

/**
 * Query Preview Component
 */
interface QueryPreviewProps {
  configuration: QueryConfigurationFormData;
  tableFields: Array<{
    name: string;
    type: FilterDataType;
    nullable: boolean;
    description?: string;
  }>;
}

const QueryPreview: React.FC<QueryPreviewProps> = ({ configuration, tableFields }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const generateSQLPreview = useCallback(() => {
    const parts: string[] = ['SELECT * FROM table_name'];

    // Generate WHERE clause from filter conditions
    if (configuration.filterConditions.length > 0) {
      const whereConditions = configuration.filterConditions.map((condition, index) => {
        let conditionStr = '';
        
        if (index > 0) {
          conditionStr += condition.logicalOperator || configuration.defaultLogicalOperator;
          conditionStr += ' ';
        }

        switch (condition.operator) {
          case 'equals':
            conditionStr += `${condition.field} = ?`;
            break;
          case 'not_equals':
            conditionStr += `${condition.field} != ?`;
            break;
          case 'like':
            conditionStr += `${condition.field} LIKE '%?%'`;
            break;
          case 'not_like':
            conditionStr += `${condition.field} NOT LIKE '%?%'`;
            break;
          case 'starts_with':
            conditionStr += `${condition.field} LIKE '?%'`;
            break;
          case 'ends_with':
            conditionStr += `${condition.field} LIKE '%?'`;
            break;
          case 'greater_than':
            conditionStr += `${condition.field} > ?`;
            break;
          case 'greater_than_or_equal':
            conditionStr += `${condition.field} >= ?`;
            break;
          case 'less_than':
            conditionStr += `${condition.field} < ?`;
            break;
          case 'less_than_or_equal':
            conditionStr += `${condition.field} <= ?`;
            break;
          case 'in':
            conditionStr += `${condition.field} IN (?)`;
            break;
          case 'not_in':
            conditionStr += `${condition.field} NOT IN (?)`;
            break;
          case 'is_null':
            conditionStr += `${condition.field} IS NULL`;
            break;
          case 'is_not_null':
            conditionStr += `${condition.field} IS NOT NULL`;
            break;
          case 'between':
            conditionStr += `${condition.field} BETWEEN ? AND ?`;
            break;
          case 'not_between':
            conditionStr += `${condition.field} NOT BETWEEN ? AND ?`;
            break;
        }

        return conditionStr;
      });

      parts.push(`WHERE ${whereConditions.join(' ')}`);
    }

    // Generate ORDER BY clause
    if (configuration.sortConfigurations.length > 0) {
      const sortedConfigs = [...configuration.sortConfigurations].sort((a, b) => a.priority - b.priority);
      const orderByClause = sortedConfigs.map(sort => 
        `${sort.field} ${sort.order}`
      ).join(', ');
      parts.push(`ORDER BY ${orderByClause}`);
    }

    // Add pagination
    if (configuration.pagination.enabled) {
      parts.push(`LIMIT ${configuration.pagination.defaultPageSize} OFFSET ?`);
    }

    return parts.join('\n');
  }, [configuration]);

  const sqlPreview = generateSQLPreview();

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div 
        className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <EyeIcon className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-gray-900 dark:text-gray-100">Query Preview</span>
        </div>
        <ChevronDownIcon 
          className={`h-4 w-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </div>
      
      {isExpanded && (
        <div className="p-4 bg-white dark:bg-gray-900">
          <pre className="text-sm font-mono bg-gray-50 dark:bg-gray-800 p-3 rounded border overflow-x-auto">
            <code className="text-gray-800 dark:text-gray-200">{sqlPreview}</code>
          </pre>
          
          {configuration.queryParameters.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Query Parameters:
              </h4>
              <div className="flex flex-wrap gap-2">
                {configuration.queryParameters.map((param, index) => (
                  <Badge key={index} variant="secondary">
                    {param.name} ({param.dataType}){param.required && ' *'}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Main Query Configuration Component
 */
export const QueryConfiguration: React.FC<QueryConfigurationProps> = ({
  endpointId,
  initialConfiguration,
  tableFields,
  onConfigurationChange,
  onPreviewGenerated,
  disabled = false,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'filters' | 'sorting' | 'pagination' | 'parameters'>('filters');

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty, isValid },
    reset,
    setValue,
    getValues
  } = useForm<QueryConfigurationFormData>({
    resolver: zodResolver(queryConfigurationFormSchema),
    defaultValues: {
      ...defaultQueryConfiguration,
      ...initialConfiguration
    },
    mode: 'onChange'
  });

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
    remove: removeParameter
  } = useFieldArray({
    control,
    name: 'queryParameters'
  });

  const watchedValues = watch();

  // Generate configuration and notify parent when form changes
  useEffect(() => {
    if (isDirty && isValid) {
      const configuration: QueryConfiguration = {
        id: uuidv4(),
        endpointId,
        ...watchedValues,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      onConfigurationChange(configuration);
    }
  }, [watchedValues, isDirty, isValid, endpointId, onConfigurationChange]);

  // Generate preview when configuration changes
  useEffect(() => {
    const generatePreview = () => {
      // This would generate a more sophisticated preview
      // For now, return a basic SQL-like representation
      const preview = `Query configuration for endpoint ${endpointId}`;
      onPreviewGenerated(preview);
    };

    if (isValid) {
      generatePreview();
    }
  }, [watchedValues, isValid, endpointId, onPreviewGenerated]);

  const handleAddFilter = useCallback(() => {
    const newFilter: FilterCondition = {
      id: uuidv4(),
      field: '',
      operator: 'equals',
      value: null,
      dataType: 'string',
      logicalOperator: 'AND'
    };
    appendFilter(newFilter);
  }, [appendFilter]);

  const handleUpdateFilter = useCallback((index: number, condition: FilterCondition) => {
    updateFilter(index, condition);
  }, [updateFilter]);

  const handleAddSort = useCallback(() => {
    const newSort: SortConfiguration = {
      id: uuidv4(),
      field: '',
      order: 'ASC',
      priority: sortFields.length + 1
    };
    appendSort(newSort);
  }, [appendSort, sortFields.length]);

  const handleUpdateSort = useCallback((index: number, sortConfig: SortConfiguration) => {
    updateSort(index, sortConfig);
  }, [updateSort]);

  const handleAddParameter = useCallback(() => {
    const newParameter = {
      enabled: true,
      name: '',
      dataType: 'string' as FilterDataType,
      required: false,
      description: ''
    };
    appendParameter(newParameter);
  }, [appendParameter]);

  const tabs = [
    { id: 'filters', label: 'Filter Conditions', count: filterFields.length },
    { id: 'sorting', label: 'Sorting', count: sortFields.length },
    { id: 'pagination', label: 'Pagination', count: 0 },
    { id: 'parameters', label: 'Parameters', count: parameterFields.length }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              disabled={disabled}
            >
              {tab.label}
              {tab.count > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Filter Conditions Tab */}
        {activeTab === 'filters' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Filter Conditions
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure dynamic filter conditions for your API endpoint
                </p>
              </div>
              <Button
                onClick={handleAddFilter}
                disabled={disabled || filterFields.length >= watchedValues.maxFilterConditions}
                size="sm"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Filter
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Logical Operator
                </label>
                <Controller
                  name="defaultLogicalOperator"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} disabled={disabled}>
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </Select>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Filter Conditions
                </label>
                <Controller
                  name="maxFilterConditions"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      max="50"
                      disabled={disabled}
                    />
                  )}
                />
              </div>
            </div>

            <div>
              <Controller
                name="allowDynamicFilters"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={disabled}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Allow dynamic filters via query parameters
                    </span>
                  </label>
                )}
              />
            </div>

            <div className="space-y-3">
              {filterFields.map((field, index) => (
                <FilterConditionBuilder
                  key={field.id}
                  condition={field}
                  index={index}
                  availableFields={tableFields}
                  showLogicalOperator={index > 0}
                  onUpdate={handleUpdateFilter}
                  onRemove={removeFilter}
                  disabled={disabled}
                />
              ))}

              {filterFields.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No filter conditions configured.</p>
                  <p className="text-sm">Click "Add Filter" to create your first filter condition.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sorting Tab */}
        {activeTab === 'sorting' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Sorting Configuration
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure default sorting and multi-field sorting options
                </p>
              </div>
              <Button
                onClick={handleAddSort}
                disabled={disabled || sortFields.length >= watchedValues.maxSortFields}
                size="sm"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Sort
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Sort Field
                </label>
                <Controller
                  name="defaultSortField"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} disabled={disabled}>
                      <option value="">No default sort</option>
                      {tableFields.map((tableField) => (
                        <option key={tableField.name} value={tableField.name}>
                          {tableField.name}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Sort Order
                </label>
                <Controller
                  name="defaultSortOrder"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} disabled={disabled}>
                      <option value="ASC">Ascending</option>
                      <option value="DESC">Descending</option>
                    </Select>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Sort Fields
                </label>
                <Controller
                  name="maxSortFields"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      max="20"
                      disabled={disabled}
                    />
                  )}
                />
              </div>
            </div>

            <div>
              <Controller
                name="allowDynamicSorting"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={disabled}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Allow dynamic sorting via query parameters
                    </span>
                  </label>
                )}
              />
            </div>

            <div className="space-y-3">
              {sortFields.map((field, index) => (
                <SortConfigurationBuilder
                  key={field.id}
                  sortConfig={field}
                  index={index}
                  availableFields={tableFields}
                  onUpdate={handleUpdateSort}
                  onRemove={removeSort}
                  disabled={disabled}
                />
              ))}

              {sortFields.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No sort configurations defined.</p>
                  <p className="text-sm">Click "Add Sort" to configure field sorting.</p>
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
                Configure pagination behavior for your API endpoint
              </p>
            </div>

            <div>
              <Controller
                name="pagination.enabled"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={disabled}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Enable pagination
                    </span>
                  </label>
                )}
              />
            </div>

            {watchedValues.pagination.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default Page Size
                    </label>
                    <Controller
                      name="pagination.defaultPageSize"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          max="1000"
                          disabled={disabled}
                        />
                      )}
                    />
                    {errors.pagination?.defaultPageSize && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.pagination.defaultPageSize.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Maximum Page Size
                    </label>
                    <Controller
                      name="pagination.maxPageSize"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          max="10000"
                          disabled={disabled}
                        />
                      )}
                    />
                    {errors.pagination?.maxPageSize && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.pagination.maxPageSize.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Page Size Options (comma-separated)
                    </label>
                    <Controller
                      name="pagination.pageSizeOptions"
                      control={control}
                      render={({ field }) => (
                        <Input
                          value={field.value.join(', ')}
                          onChange={(e) => {
                            const values = e.target.value
                              .split(',')
                              .map(v => parseInt(v.trim()))
                              .filter(v => !isNaN(v) && v > 0);
                            field.onChange(values);
                          }}
                          disabled={disabled}
                          placeholder="10, 25, 50, 100"
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Controller
                      name="pagination.allowPageSizeChange"
                      control={control}
                      render={({ field }) => (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            disabled={disabled}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Allow page size change
                          </span>
                        </label>
                      )}
                    />
                  </div>

                  <div>
                    <Controller
                      name="pagination.showTotal"
                      control={control}
                      render={({ field }) => (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            disabled={disabled}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Show total count
                          </span>
                        </label>
                      )}
                    />
                  </div>

                  <div>
                    <Controller
                      name="pagination.showQuickJumper"
                      control={control}
                      render={({ field }) => (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            disabled={disabled}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Show quick page jumper
                          </span>
                        </label>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Query Parameters Tab */}
        {activeTab === 'parameters' && (
          <div className="space-y-4">
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
                onClick={handleAddParameter}
                disabled={disabled || parameterFields.length >= 50}
                size="sm"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Parameter
              </Button>
            </div>

            <div className="space-y-4">
              {parameterFields.map((field, index) => (
                <div key={field.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Parameter Name
                      </label>
                      <Controller
                        name={`queryParameters.${index}.name`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            disabled={disabled}
                            placeholder="parameter_name"
                          />
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data Type
                      </label>
                      <Controller
                        name={`queryParameters.${index}.dataType`}
                        control={control}
                        render={({ field }) => (
                          <Select {...field} disabled={disabled}>
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="date">Date</option>
                            <option value="datetime">DateTime</option>
                          </Select>
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Default Value
                      </label>
                      <Controller
                        name={`queryParameters.${index}.defaultValue`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            value={field.value?.toString() || ''}
                            disabled={disabled}
                            placeholder="Default value"
                          />
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-6">
                      <Controller
                        name={`queryParameters.${index}.required`}
                        control={control}
                        render={({ field }) => (
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              disabled={disabled}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                              Required
                            </span>
                          </label>
                        )}
                      />

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeParameter(index)}
                        disabled={disabled}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <Controller
                      name={`queryParameters.${index}.description`}
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          disabled={disabled}
                          placeholder="Parameter description..."
                          rows={2}
                        />
                      )}
                    />
                  </div>
                </div>
              ))}

              {parameterFields.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No query parameters defined.</p>
                  <p className="text-sm">Click "Add Parameter" to create custom query parameters.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Query Preview */}
      <QueryPreview configuration={watchedValues} tableFields={tableFields} />

      {/* Form Errors */}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">
            <p className="font-medium">Please fix the following errors:</p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              {Object.entries(errors).map(([key, error]) => (
                <li key={key}>
                  {typeof error === 'object' && error?.message ? error.message : 'Invalid value'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryConfiguration;