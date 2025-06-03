/**
 * @fileoverview Central exports file for all Zod validation schemas used throughout the schema management components.
 * Provides centralized access to validation schemas for field, table, database, and common validation workflows.
 * Enables clean imports and consistent schema usage across React Hook Form integrations.
 * 
 * @version React 19 / Next.js 15.1 / TypeScript 5.8+
 * @requires Zod schema validation for React Hook Form integration
 * @performance Real-time validation under 100ms per React/Next.js Integration Requirements
 */

// CSV Validation Schemas
// Exports for bulk input validation, tag selectors, and import field lists
export {
  csvSchema,
  bulkIdSchema,
  tagSelectorSchema,
  importFieldListSchema,
  type CsvValidationResult,
  type BulkIdInput,
  type TagSelectorInput,
  type ImportFieldList
} from './csv-validation';

// Field Validation Schemas  
// Comprehensive schemas for database field configuration and validation rules
export {
  fieldSchema,
  fieldConstraintSchema,
  fieldRelationshipSchema,
  fieldTypeSchema,
  fieldMetadataSchema,
  picklistSchema,
  fieldValidationRulesSchema,
  conditionalFieldSchema,
  jsonFieldSchema,
  type FieldFormData,
  type FieldConstraintData,
  type FieldRelationshipData,
  type FieldTypeData,
  type FieldMetadata,
  type PicklistData,
  type FieldValidationRules,
  type ConditionalFieldData,
  type JsonFieldData
} from './field-validation';

// Table Validation Schemas
// Schemas for table creation, modification, and configuration workflows
export {
  tableSchema,
  tableMetadataSchema,
  tableRelationshipSchema,
  tableConstraintSchema,
  tableFilterSchema,
  tableSearchSchema,
  tableConfigurationSchema,
  schemaIntegritySchema,
  type TableFormData,
  type TableMetadata,
  type TableRelationshipData,
  type TableConstraintData,
  type TableFilterData,
  type TableSearchData,
  type TableConfiguration,
  type SchemaIntegrityData
} from './table-validation';

// Common Validation Utilities
// Shared validation patterns and utilities used across all schema components
export {
  databaseConnectionSchema,
  serviceNameSchema,
  identifierSchema,
  configurationSchema,
  connectionParametersSchema,
  hostValidationSchema,
  portValidationSchema,
  urlValidationSchema,
  emailValidationSchema,
  passwordValidationSchema,
  type DatabaseConnectionData,
  type ServiceNameData,
  type IdentifierData,
  type ConfigurationData,
  type ConnectionParameters,
  type HostValidation,
  type PortValidation,
  type UrlValidation,
  type EmailValidation,
  type PasswordValidation
} from './common-validation';

// Re-export validation utilities from lib/validation for convenience
export {
  createFormConfig,
  zodResolver,
  transformErrors,
  validateWithDebounce,
  resetFormDefaults,
  type ValidationResult,
  type FormConfig,
  type ErrorTransform,
  type ValidationTiming
} from '../../../lib/validation';

/**
 * Schema validation registry for type-safe schema access
 * Enables consistent validation patterns across all schema management components
 */
export const SchemaRegistry = {
  // CSV validation schemas
  csv: {
    basic: 'csvSchema',
    bulkId: 'bulkIdSchema',
    tagSelector: 'tagSelectorSchema',
    importFieldList: 'importFieldListSchema'
  },
  
  // Field validation schemas
  field: {
    basic: 'fieldSchema',
    constraint: 'fieldConstraintSchema',
    relationship: 'fieldRelationshipSchema',
    type: 'fieldTypeSchema',
    metadata: 'fieldMetadataSchema',
    picklist: 'picklistSchema',
    validationRules: 'fieldValidationRulesSchema',
    conditional: 'conditionalFieldSchema',
    json: 'jsonFieldSchema'
  },
  
  // Table validation schemas
  table: {
    basic: 'tableSchema',
    metadata: 'tableMetadataSchema',
    relationship: 'tableRelationshipSchema',
    constraint: 'tableConstraintSchema',
    filter: 'tableFilterSchema',
    search: 'tableSearchSchema',
    configuration: 'tableConfigurationSchema',
    integrity: 'schemaIntegritySchema'
  },
  
  // Common validation schemas
  common: {
    connection: 'databaseConnectionSchema',
    serviceName: 'serviceNameSchema',
    identifier: 'identifierSchema',
    configuration: 'configurationSchema',
    connectionParameters: 'connectionParametersSchema',
    host: 'hostValidationSchema',
    port: 'portValidationSchema',
    url: 'urlValidationSchema',
    email: 'emailValidationSchema',
    password: 'passwordValidationSchema'
  }
} as const;

/**
 * Type utility for inferring schema types from the registry
 * Provides compile-time type safety for schema access patterns
 */
export type SchemaRegistryType = typeof SchemaRegistry;
export type CsvSchemaKeys = keyof SchemaRegistryType['csv'];
export type FieldSchemaKeys = keyof SchemaRegistryType['field'];
export type TableSchemaKeys = keyof SchemaRegistryType['table'];
export type CommonSchemaKeys = keyof SchemaRegistryType['common'];

/**
 * Helper type for schema validation results
 * Provides consistent typing for all validation operations
 */
export type SchemaValidationResult<T> = {
  success: boolean;
  data?: T;
  error?: {
    issues: Array<{
      path: (string | number)[];
      message: string;
      code: string;
    }>;
    message: string;
  };
};

/**
 * Utility function for creating type-safe schema accessors
 * Enables runtime schema retrieval with compile-time type checking
 */
export function getSchemaByPath<
  Category extends keyof SchemaRegistryType,
  Key extends keyof SchemaRegistryType[Category]
>(category: Category, key: Key): string {
  return SchemaRegistry[category][key] as string;
}