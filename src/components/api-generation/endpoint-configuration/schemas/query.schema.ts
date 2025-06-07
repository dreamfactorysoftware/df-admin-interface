/**
 * Query Configuration Validation Schemas
 * 
 * Zod schemas for validating query configuration forms with real-time validation.
 * Ensures data integrity and provides detailed validation feedback.
 */

import { z } from 'zod';
import { FilterOperator, FilterDataType, LogicalOperator, SortOrder } from '../types/query-config.types';

/**
 * Schema for filter operators
 */
export const filterOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'like',
  'not_like',
  'starts_with',
  'ends_with',
  'greater_than',
  'greater_than_or_equal',
  'less_than',
  'less_than_or_equal',
  'in',
  'not_in',
  'is_null',
  'is_not_null',
  'between',
  'not_between'
] as const);

/**
 * Schema for filter data types
 */
export const filterDataTypeSchema = z.enum([
  'string',
  'number',
  'boolean',
  'date',
  'datetime',
  'json'
] as const);

/**
 * Schema for logical operators
 */
export const logicalOperatorSchema = z.enum(['AND', 'OR'] as const);

/**
 * Schema for sort order
 */
export const sortOrderSchema = z.enum(['ASC', 'DESC'] as const);

/**
 * Schema for filter condition values with dynamic validation
 */
export const filterValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.array(z.number()),
  z.null()
]).optional();

/**
 * Schema for individual filter conditions
 */
export const filterConditionSchema = z.object({
  id: z.string().min(1, 'Filter condition ID is required'),
  field: z.string().min(1, 'Field is required'),
  operator: filterOperatorSchema,
  value: filterValueSchema,
  dataType: filterDataTypeSchema,
  logicalOperator: logicalOperatorSchema.optional()
}).refine((data) => {
  // Validate that operators requiring values have values
  const operatorsRequiringValues: FilterOperator[] = [
    'equals', 'not_equals', 'like', 'not_like', 'starts_with', 'ends_with',
    'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal',
    'in', 'not_in', 'between', 'not_between'
  ];
  
  if (operatorsRequiringValues.includes(data.operator)) {
    return data.value !== null && data.value !== undefined && data.value !== '';
  }
  
  return true;
}, {
  message: 'This operator requires a value',
  path: ['value']
}).refine((data) => {
  // Validate array operators have array values
  const arrayOperators: FilterOperator[] = ['in', 'not_in'];
  
  if (arrayOperators.includes(data.operator)) {
    return Array.isArray(data.value) && data.value.length > 0;
  }
  
  return true;
}, {
  message: 'This operator requires an array of values',
  path: ['value']
}).refine((data) => {
  // Validate between operators have exactly 2 values
  const betweenOperators: FilterOperator[] = ['between', 'not_between'];
  
  if (betweenOperators.includes(data.operator)) {
    return Array.isArray(data.value) && data.value.length === 2;
  }
  
  return true;
}, {
  message: 'Between operators require exactly 2 values',
  path: ['value']
});

/**
 * Schema for sort configurations
 */
export const sortConfigurationSchema = z.object({
  id: z.string().min(1, 'Sort configuration ID is required'),
  field: z.string().min(1, 'Field is required'),
  order: sortOrderSchema,
  priority: z.number().min(1, 'Priority must be at least 1').max(10, 'Priority cannot exceed 10')
});

/**
 * Schema for pagination configuration
 */
export const paginationConfigurationSchema = z.object({
  enabled: z.boolean(),
  defaultPageSize: z.number().min(1, 'Page size must be at least 1').max(1000, 'Page size cannot exceed 1000'),
  maxPageSize: z.number().min(1, 'Max page size must be at least 1').max(10000, 'Max page size cannot exceed 10000'),
  allowPageSizeChange: z.boolean(),
  pageSizeOptions: z.array(z.number().min(1)).min(1, 'At least one page size option is required'),
  showTotal: z.boolean(),
  showQuickJumper: z.boolean()
}).refine((data) => {
  // Ensure default page size is within max page size
  return data.defaultPageSize <= data.maxPageSize;
}, {
  message: 'Default page size cannot exceed max page size',
  path: ['defaultPageSize']
}).refine((data) => {
  // Ensure default page size is in the options list
  return data.pageSizeOptions.includes(data.defaultPageSize);
}, {
  message: 'Default page size must be included in the page size options',
  path: ['defaultPageSize']
});

/**
 * Schema for query parameter validation rules
 */
export const queryParameterValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  enum: z.array(z.union([z.string(), z.number()])).optional()
}).optional();

/**
 * Schema for query parameters
 */
export const queryParameterConfigurationSchema = z.object({
  enabled: z.boolean(),
  name: z.string().min(1, 'Parameter name is required').regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Parameter name must be a valid identifier'),
  dataType: filterDataTypeSchema,
  required: z.boolean(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  description: z.string().optional(),
  validation: queryParameterValidationSchema
}).refine((data) => {
  // If parameter is required, it shouldn't have a default value
  if (data.required && data.defaultValue !== undefined) {
    return false;
  }
  return true;
}, {
  message: 'Required parameters cannot have default values',
  path: ['defaultValue']
});

/**
 * Main schema for query configuration form
 */
export const queryConfigurationFormSchema = z.object({
  filterConditions: z.array(filterConditionSchema).max(20, 'Maximum 20 filter conditions allowed'),
  defaultLogicalOperator: logicalOperatorSchema,
  allowDynamicFilters: z.boolean(),
  maxFilterConditions: z.number().min(1, 'Must allow at least 1 filter condition').max(50, 'Cannot exceed 50 filter conditions'),
  sortConfigurations: z.array(sortConfigurationSchema).max(10, 'Maximum 10 sort configurations allowed'),
  allowDynamicSorting: z.boolean(),
  defaultSortField: z.string().optional(),
  defaultSortOrder: sortOrderSchema.optional(),
  maxSortFields: z.number().min(1, 'Must allow at least 1 sort field').max(20, 'Cannot exceed 20 sort fields'),
  pagination: paginationConfigurationSchema,
  queryParameters: z.array(queryParameterConfigurationSchema).max(50, 'Maximum 50 query parameters allowed')
}).refine((data) => {
  // Ensure filter conditions don't exceed max
  return data.filterConditions.length <= data.maxFilterConditions;
}, {
  message: 'Number of filter conditions exceeds the maximum allowed',
  path: ['filterConditions']
}).refine((data) => {
  // Ensure sort configurations don't exceed max
  return data.sortConfigurations.length <= data.maxSortFields;
}, {
  message: 'Number of sort configurations exceeds the maximum allowed',
  path: ['sortConfigurations']
}).refine((data) => {
  // Ensure sort priorities are unique
  const priorities = data.sortConfigurations.map(s => s.priority);
  return new Set(priorities).size === priorities.length;
}, {
  message: 'Sort priorities must be unique',
  path: ['sortConfigurations']
}).refine((data) => {
  // Ensure parameter names are unique
  const names = data.queryParameters.map(p => p.name);
  return new Set(names).size === names.length;
}, {
  message: 'Query parameter names must be unique',
  path: ['queryParameters']
});

/**
 * Complete query configuration schema
 */
export const queryConfigurationSchema = z.object({
  id: z.string().min(1, 'Configuration ID is required'),
  endpointId: z.string().min(1, 'Endpoint ID is required'),
  filterConditions: z.array(filterConditionSchema),
  defaultLogicalOperator: logicalOperatorSchema,
  allowDynamicFilters: z.boolean(),
  maxFilterConditions: z.number().min(1).max(50),
  sortConfigurations: z.array(sortConfigurationSchema),
  allowDynamicSorting: z.boolean(),
  defaultSortField: z.string().optional(),
  defaultSortOrder: sortOrderSchema.optional(),
  maxSortFields: z.number().min(1).max(20),
  pagination: paginationConfigurationSchema,
  queryParameters: z.array(queryParameterConfigurationSchema),
  queryPreview: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

/**
 * Schema for table field information
 */
export const tableFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  type: filterDataTypeSchema,
  nullable: z.boolean(),
  description: z.string().optional()
});

/**
 * Type exports for use with React Hook Form
 */
export type QueryConfigurationFormData = z.infer<typeof queryConfigurationFormSchema>;
export type FilterConditionData = z.infer<typeof filterConditionSchema>;
export type SortConfigurationData = z.infer<typeof sortConfigurationSchema>;
export type PaginationConfigurationData = z.infer<typeof paginationConfigurationSchema>;
export type QueryParameterConfigurationData = z.infer<typeof queryParameterConfigurationSchema>;
export type QueryConfigurationData = z.infer<typeof queryConfigurationSchema>;
export type TableFieldData = z.infer<typeof tableFieldSchema>;

/**
 * Default values for form initialization
 */
export const defaultQueryConfiguration: QueryConfigurationFormData = {
  filterConditions: [],
  defaultLogicalOperator: 'AND',
  allowDynamicFilters: true,
  maxFilterConditions: 10,
  sortConfigurations: [],
  allowDynamicSorting: true,
  defaultSortField: undefined,
  defaultSortOrder: 'ASC',
  maxSortFields: 5,
  pagination: {
    enabled: true,
    defaultPageSize: 25,
    maxPageSize: 1000,
    allowPageSizeChange: true,
    pageSizeOptions: [10, 25, 50, 100],
    showTotal: true,
    showQuickJumper: false
  },
  queryParameters: []
};

/**
 * Validation utility functions
 */
export const validateQueryConfiguration = (data: unknown) => {
  return queryConfigurationFormSchema.safeParse(data);
};

export const validateFilterCondition = (data: unknown) => {
  return filterConditionSchema.safeParse(data);
};

export const validateSortConfiguration = (data: unknown) => {
  return sortConfigurationSchema.safeParse(data);
};

export const validatePaginationConfiguration = (data: unknown) => {
  return paginationConfigurationSchema.safeParse(data);
};