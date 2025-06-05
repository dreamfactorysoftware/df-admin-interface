/**
 * Schema Validation Barrel Export
 * 
 * Centralized export file providing type-safe access to all Zod validation schemas
 * used throughout the schema management components. Enables clean imports and
 * consistent validation patterns across field, table, and database workflows.
 * 
 * @module SchemaValidation
 * @version 1.0.0
 * @requires react-hook-form ^7.52.0
 * @requires zod ^3.22.0
 * @since TypeScript 5.8+
 */

// CSV Validation Schemas
// Provides validation for comma-separated values used in bulk operations,
// tag selectors, and import field lists
export {
  csvSchema,
  type CsvData,
  type CsvValidationResult
} from './csv-validation';

// Field Validation Schemas  
// Comprehensive schemas for database field configuration supporting all field types,
// constraints, relationships, and validation rules with React Hook Form integration
export {
  // Base field schemas
  fieldSchema,
  fieldCreateSchema,
  fieldUpdateSchema,
  fieldMetadataSchema,
  
  // Field type-specific schemas
  stringFieldSchema,
  numberFieldSchema,
  booleanFieldSchema,
  dateFieldSchema,
  textFieldSchema,
  jsonFieldSchema,
  
  // Field constraint schemas
  fieldConstraintsSchema,
  fieldRelationshipSchema,
  fieldValidationRulesSchema,
  
  // Picklist and options schemas
  fieldPicklistSchema,
  fieldOptionsSchema,
  
  // Type inference exports
  type FieldFormData,
  type FieldCreateData,
  type FieldUpdateData,
  type FieldMetadata,
  type FieldConstraints,
  type FieldRelationship,
  type FieldValidationRules,
  type FieldPicklist,
  type FieldOptions
} from './field-validation';

// Table Validation Schemas
// Schemas for database table management including creation, modification,
// and configuration with comprehensive metadata and relationship validation
export {
  // Base table schemas
  tableSchema,
  tableCreateSchema,
  tableUpdateSchema,
  tableMetadataSchema,
  
  // Table configuration schemas
  tableConfigurationSchema,
  tableRelationshipSchema,
  tableConstraintsSchema,
  
  // Table filtering and search schemas
  tableFilterSchema,
  tableSearchSchema,
  tablePaginationSchema,
  
  // Table import/export schemas
  tableImportSchema,
  tableExportSchema,
  
  // Type inference exports
  type TableFormData,
  type TableCreateData,
  type TableUpdateData,
  type TableMetadata,
  type TableConfiguration,
  type TableRelationship,
  type TableConstraints,
  type TableFilter,
  type TableSearch,
  type TablePagination,
  type TableImport,
  type TableExport
} from './table-validation';

// Common Validation Utilities
// Shared validation patterns, utilities, and common schemas used across
// all schema management components for consistent behavior
export {
  // Database connection schemas
  databaseConnectionSchema,
  connectionTestSchema,
  connectionConfigSchema,
  
  // Identifier validation schemas
  identifierSchema,
  serviceNameSchema,
  tableNameSchema,
  fieldNameSchema,
  
  // Common field schemas
  nameSchema,
  descriptionSchema,
  urlSchema,
  portSchema,
  usernameSchema,
  passwordSchema,
  
  // Configuration schemas
  paginationSchema,
  sortingSchema,
  filteringSchema,
  
  // API generation schemas
  endpointConfigSchema,
  apiParameterSchema,
  apiResponseSchema,
  
  // Validation utilities
  createConditionalSchema,
  createOptionalSchema,
  createArraySchema,
  validateRequired,
  validateLength,
  validateFormat,
  validateRange,
  
  // Type inference exports
  type DatabaseConnection,
  type ConnectionTest,
  type ConnectionConfig,
  type Identifier,
  type ServiceName,
  type TableName,
  type FieldName,
  type Name,
  type Description,
  type Pagination,
  type Sorting,
  type Filtering,
  type EndpointConfig,
  type ApiParameter,
  type ApiResponse,
  type ValidationUtils
} from './common-validation';

// Re-export commonly used validation utilities for convenience
export {
  createConditionalSchema as conditional,
  createOptionalSchema as optional,
  createArraySchema as array,
  validateRequired as required,
  validateLength as length,
  validateFormat as format,
  validateRange as range
} from './common-validation';

/**
 * Validation Schema Categories
 * 
 * Organized grouping of validation schemas by functional area for easier
 * discovery and usage in complex form validation scenarios.
 */
export const ValidationSchemas = {
  csv: {
    csvSchema
  },
  field: {
    fieldSchema,
    fieldCreateSchema,
    fieldUpdateSchema,
    fieldMetadataSchema,
    stringFieldSchema,
    numberFieldSchema,
    booleanFieldSchema,
    dateFieldSchema,
    textFieldSchema,
    jsonFieldSchema,
    fieldConstraintsSchema,
    fieldRelationshipSchema,
    fieldValidationRulesSchema,
    fieldPicklistSchema,
    fieldOptionsSchema
  },
  table: {
    tableSchema,
    tableCreateSchema,
    tableUpdateSchema,
    tableMetadataSchema,
    tableConfigurationSchema,
    tableRelationshipSchema,
    tableConstraintsSchema,
    tableFilterSchema,
    tableSearchSchema,
    tablePaginationSchema,
    tableImportSchema,
    tableExportSchema
  },
  common: {
    databaseConnectionSchema,
    connectionTestSchema,
    connectionConfigSchema,
    identifierSchema,
    serviceNameSchema,
    tableNameSchema,
    fieldNameSchema,
    nameSchema,
    descriptionSchema,
    urlSchema,
    portSchema,
    usernameSchema,
    passwordSchema,
    paginationSchema,
    sortingSchema,
    filteringSchema,
    endpointConfigSchema,
    apiParameterSchema,
    apiResponseSchema
  }
} as const;

/**
 * Validation Utilities
 * 
 * Collection of utility functions for creating and composing validation schemas
 * with consistent patterns across the application.
 */
export const ValidationUtils = {
  conditional: createConditionalSchema,
  optional: createOptionalSchema,
  array: createArraySchema,
  required: validateRequired,
  length: validateLength,
  format: validateFormat,
  range: validateRange
} as const;

/**
 * Default export providing access to all validation schemas and utilities
 * for cases where a single import is preferred.
 */
export default {
  schemas: ValidationSchemas,
  utils: ValidationUtils
} as const;