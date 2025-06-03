/**
 * Common validation schemas and utilities for DreamFactory schema management
 * 
 * Provides reusable Zod validation schemas for database connections, identifiers,
 * names, and configuration patterns used across schema management forms. Designed
 * for React Hook Form integration with real-time validation under 100ms.
 * 
 * @version React 19/Next.js 15.1 Migration
 * @author DreamFactory Admin Interface Team
 */

import { z } from 'zod'

// =============================================================================
// BASIC VALIDATION UTILITIES
// =============================================================================

/**
 * Validation error messages with consistent language and formatting
 */
export const ValidationMessages = {
  // Required field messages
  REQUIRED: 'This field is required',
  EMAIL_REQUIRED: 'Email address is required',
  PASSWORD_REQUIRED: 'Password is required',
  NAME_REQUIRED: 'Name is required',
  
  // Format validation messages
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_URL: 'Please enter a valid URL',
  INVALID_JSON: 'Please enter valid JSON',
  INVALID_CSV: 'Please enter comma-separated values (e.g., item1, item2, item3)',
  INVALID_PORT: 'Port must be between 1 and 65535',
  INVALID_IDENTIFIER: 'Must contain only letters, numbers, and underscores',
  
  // Length validation messages
  TOO_SHORT: (min: number) => `Must be at least ${min} characters`,
  TOO_LONG: (max: number) => `Must be no more than ${max} characters`,
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  
  // Pattern validation messages
  PASSWORDS_DO_NOT_MATCH: 'Passwords do not match',
  NAME_NOT_UNIQUE: 'Name must be unique',
  INVALID_DATABASE_NAME: 'Database name can only contain letters, numbers, and underscores',
  INVALID_SERVICE_NAME: 'Service name must be unique and contain only letters, numbers, and hyphens',
  INVALID_TABLE_NAME: 'Table name can only contain letters, numbers, and underscores, must start with a letter',
  INVALID_FIELD_NAME: 'Field name can only contain letters, numbers, and underscores, must start with a letter',
  
  // Connection validation messages
  CONNECTION_TIMEOUT: 'Connection timed out. Please verify host and port.',
  INVALID_CREDENTIALS: 'Invalid username or password',
  DATABASE_NOT_FOUND: 'Database not found or access denied',
  
  // Configuration validation messages
  INVALID_CONFIGURATION: 'Invalid configuration provided',
  MISSING_REQUIRED_CONFIG: 'Required configuration parameters are missing',
} as const

/**
 * Common regex patterns for validation
 */
export const ValidationPatterns = {
  // Identifier patterns
  IDENTIFIER: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
  SERVICE_NAME: /^[a-zA-Z][a-zA-Z0-9-]*[a-zA-Z0-9]$/,
  DATABASE_NAME: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
  TABLE_NAME: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
  FIELD_NAME: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
  
  // Data format patterns
  CSV: /^\w+(?:\s*,\s*\w+)*$/,
  URL: /^https?:\/\/.+/,
  HOST: /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$/,
  IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  IPV6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
  
  // Character set patterns
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  ALPHANUMERIC_WITH_SPACES: /^[a-zA-Z0-9\s]+$/,
  NO_SPECIAL_CHARS: /^[a-zA-Z0-9_-]+$/,
} as const

// =============================================================================
// BASIC FIELD VALIDATION SCHEMAS
// =============================================================================

/**
 * Required string field with minimum length
 */
export const requiredString = (minLength = 1, maxLength = 255) => 
  z.string()
    .min(minLength, ValidationMessages.TOO_SHORT(minLength))
    .max(maxLength, ValidationMessages.TOO_LONG(maxLength))
    .trim()

/**
 * Optional string field with maximum length
 */
export const optionalString = (maxLength = 255) => 
  z.string()
    .max(maxLength, ValidationMessages.TOO_LONG(maxLength))
    .trim()
    .optional()

/**
 * Email validation schema
 */
export const emailSchema = z.string()
  .min(1, ValidationMessages.EMAIL_REQUIRED)
  .email(ValidationMessages.INVALID_EMAIL)
  .trim()
  .toLowerCase()

/**
 * Password validation schema
 */
export const passwordSchema = z.string()
  .min(8, ValidationMessages.PASSWORD_TOO_SHORT)
  .max(128, ValidationMessages.TOO_LONG(128))

/**
 * Confirm password schema for password matching
 */
export const confirmPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: ValidationMessages.PASSWORDS_DO_NOT_MATCH,
  path: ['confirmPassword']
})

/**
 * URL validation schema
 */
export const urlSchema = z.string()
  .min(1, ValidationMessages.REQUIRED)
  .regex(ValidationPatterns.URL, ValidationMessages.INVALID_URL)
  .trim()

/**
 * JSON validation schema
 */
export const jsonSchema = z.string()
  .min(1, ValidationMessages.REQUIRED)
  .refine((value) => {
    try {
      JSON.parse(value)
      return true
    } catch {
      return false
    }
  }, {
    message: ValidationMessages.INVALID_JSON
  })

/**
 * CSV validation schema (converted from Angular CsvValidator)
 */
export const csvSchema = z.string()
  .min(1, ValidationMessages.REQUIRED)
  .regex(ValidationPatterns.CSV, ValidationMessages.INVALID_CSV)
  .trim()

// =============================================================================
// DATABASE IDENTIFIER VALIDATION SCHEMAS
// =============================================================================

/**
 * Generic identifier validation (letters, numbers, underscores)
 */
export const identifierSchema = z.string()
  .min(1, ValidationMessages.REQUIRED)
  .max(64, ValidationMessages.TOO_LONG(64))
  .regex(ValidationPatterns.IDENTIFIER, ValidationMessages.INVALID_IDENTIFIER)
  .trim()

/**
 * Service name validation schema
 */
export const serviceNameSchema = z.string()
  .min(1, ValidationMessages.REQUIRED)
  .max(50, ValidationMessages.TOO_LONG(50))
  .regex(ValidationPatterns.SERVICE_NAME, ValidationMessages.INVALID_SERVICE_NAME)
  .trim()

/**
 * Database name validation schema
 */
export const databaseNameSchema = z.string()
  .min(1, ValidationMessages.REQUIRED)
  .max(64, ValidationMessages.TOO_LONG(64))
  .regex(ValidationPatterns.DATABASE_NAME, ValidationMessages.INVALID_DATABASE_NAME)
  .trim()

/**
 * Table name validation schema
 */
export const tableNameSchema = z.string()
  .min(1, ValidationMessages.REQUIRED)
  .max(64, ValidationMessages.TOO_LONG(64))
  .regex(ValidationPatterns.TABLE_NAME, ValidationMessages.INVALID_TABLE_NAME)
  .trim()

/**
 * Field name validation schema
 */
export const fieldNameSchema = z.string()
  .min(1, ValidationMessages.REQUIRED)
  .max(64, ValidationMessages.TOO_LONG(64))
  .regex(ValidationPatterns.FIELD_NAME, ValidationMessages.INVALID_FIELD_NAME)
  .trim()

/**
 * Display label validation schema (allows spaces and special characters)
 */
export const labelSchema = z.string()
  .min(1, ValidationMessages.REQUIRED)
  .max(100, ValidationMessages.TOO_LONG(100))
  .trim()

/**
 * Description validation schema (optional long text)
 */
export const descriptionSchema = z.string()
  .max(500, ValidationMessages.TOO_LONG(500))
  .trim()
  .optional()

// =============================================================================
// DATABASE CONNECTION VALIDATION SCHEMAS
// =============================================================================

/**
 * Host validation schema (supports both hostnames and IP addresses)
 */
export const hostSchema = z.string()
  .min(1, ValidationMessages.REQUIRED)
  .refine((value) => {
    return ValidationPatterns.HOST.test(value) || 
           ValidationPatterns.IPV4.test(value) || 
           ValidationPatterns.IPV6.test(value) ||
           value === 'localhost'
  }, {
    message: 'Please enter a valid hostname or IP address'
  })
  .trim()

/**
 * Port validation schema
 */
export const portSchema = z.number()
  .min(1, ValidationMessages.INVALID_PORT)
  .max(65535, ValidationMessages.INVALID_PORT)
  .default(3306)

/**
 * Connection timeout validation schema
 */
export const timeoutSchema = z.number()
  .min(1, 'Timeout must be at least 1 second')
  .max(300, 'Timeout cannot exceed 300 seconds')
  .default(30)

/**
 * Username validation schema
 */
export const usernameSchema = z.string()
  .min(1, ValidationMessages.REQUIRED)
  .max(64, ValidationMessages.TOO_LONG(64))
  .trim()

/**
 * Database connection string validation schema
 */
export const connectionStringSchema = z.string()
  .min(1, ValidationMessages.REQUIRED)
  .max(1000, ValidationMessages.TOO_LONG(1000))
  .trim()

/**
 * SSL mode validation schema
 */
export const sslModeSchema = z.enum(['disable', 'require', 'verify-ca', 'verify-full', 'preferred'])
  .default('disable')

/**
 * Basic database connection validation schema
 */
export const basicConnectionSchema = z.object({
  host: hostSchema,
  port: portSchema,
  database: databaseNameSchema,
  username: usernameSchema,
  password: passwordSchema,
  timeout: timeoutSchema.optional()
})

/**
 * Advanced connection configuration schema
 */
export const advancedConnectionSchema = basicConnectionSchema.extend({
  charset: optionalString(20),
  collation: optionalString(50),
  timezone: optionalString(50),
  ssl_enabled: z.boolean().default(false),
  ssl_mode: sslModeSchema.optional(),
  ssl_cert: optionalString(1000),
  ssl_key: optionalString(1000),
  ssl_ca: optionalString(1000),
  options: optionalString(500)
})

// =============================================================================
// API GENERATION VALIDATION SCHEMAS
// =============================================================================

/**
 * HTTP method validation schema
 */
export const httpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * API endpoint path validation schema
 */
export const endpointPathSchema = z.string()
  .min(1, ValidationMessages.REQUIRED)
  .max(200, ValidationMessages.TOO_LONG(200))
  .regex(/^\/[a-zA-Z0-9\/_-]*$/, 'Path must start with / and contain only valid URL characters')
  .trim()

/**
 * API parameter validation schema
 */
export const apiParameterSchema = z.object({
  name: fieldNameSchema,
  type: z.enum(['string', 'number', 'boolean', 'date']),
  required: z.boolean().default(false),
  description: descriptionSchema,
  default_value: z.string().optional()
})

/**
 * API endpoint configuration schema
 */
export const endpointConfigSchema = z.object({
  name: serviceNameSchema,
  path: endpointPathSchema,
  method: httpMethodSchema,
  description: descriptionSchema,
  parameters: z.array(apiParameterSchema).default([]),
  auth_required: z.boolean().default(true),
  rate_limit: z.number().min(0).max(10000).optional(),
  cache_ttl: z.number().min(0).max(3600).optional()
})

// =============================================================================
// FORM FIELD CONFIGURATION VALIDATION SCHEMAS
// =============================================================================

/**
 * Field type validation schema
 */
export const fieldTypeSchema = z.enum([
  'string', 'text', 'integer', 'float', 'decimal', 'boolean',
  'date', 'datetime', 'time', 'timestamp', 'binary', 'json',
  'uuid', 'email', 'url', 'phone', 'currency'
])

/**
 * Field constraint validation schema
 */
export const fieldConstraintSchema = z.object({
  max_length: z.number().min(1).max(65535).optional(),
  min_length: z.number().min(0).optional(),
  max_value: z.number().optional(),
  min_value: z.number().optional(),
  pattern: z.string().optional(),
  enum_values: z.array(z.string()).optional(),
  decimal_places: z.number().min(0).max(10).optional(),
  precision: z.number().min(1).max(65).optional()
}).refine((data) => {
  // Ensure min_length <= max_length if both are provided
  if (data.min_length !== undefined && data.max_length !== undefined) {
    return data.min_length <= data.max_length
  }
  return true
}, {
  message: 'Minimum length cannot be greater than maximum length',
  path: ['min_length']
}).refine((data) => {
  // Ensure min_value <= max_value if both are provided
  if (data.min_value !== undefined && data.max_value !== undefined) {
    return data.min_value <= data.max_value
  }
  return true
}, {
  message: 'Minimum value cannot be greater than maximum value',
  path: ['min_value']
})

/**
 * Complete field configuration validation schema
 */
export const fieldConfigSchema = z.object({
  name: fieldNameSchema,
  label: labelSchema,
  type: fieldTypeSchema,
  required: z.boolean().default(false),
  unique: z.boolean().default(false),
  indexed: z.boolean().default(false),
  description: descriptionSchema,
  default_value: z.string().optional(),
  constraints: fieldConstraintSchema.optional(),
  picklist_values: csvSchema.optional(),
  foreign_table: tableNameSchema.optional(),
  foreign_key: fieldNameSchema.optional()
})

// =============================================================================
// BULK OPERATION VALIDATION SCHEMAS
// =============================================================================

/**
 * Bulk ID validation schema (comma-separated IDs)
 */
export const bulkIdSchema = z.string()
  .min(1, ValidationMessages.REQUIRED)
  .regex(/^[0-9]+(?:\s*,\s*[0-9]+)*$/, 'Please enter comma-separated numeric IDs')
  .trim()

/**
 * Bulk operation type schema
 */
export const bulkOperationSchema = z.enum(['create', 'update', 'delete', 'clone'])

/**
 * Import configuration schema
 */
export const importConfigSchema = z.object({
  file_type: z.enum(['csv', 'json', 'xml']),
  delimiter: z.string().length(1).default(','),
  quote_char: z.string().length(1).default('"'),
  escape_char: z.string().length(1).default('\\'),
  has_header: z.boolean().default(true),
  encoding: z.enum(['utf-8', 'utf-16', 'iso-8859-1']).default('utf-8'),
  batch_size: z.number().min(1).max(1000).default(100)
})

// =============================================================================
// PAGINATION AND FILTERING VALIDATION SCHEMAS
// =============================================================================

/**
 * Pagination parameters schema
 */
export const paginationSchema = z.object({
  limit: z.number().min(1).max(1000).default(25),
  offset: z.number().min(0).default(0),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc')
})

/**
 * Search and filter schema
 */
export const searchFilterSchema = z.object({
  search: z.string().max(255).optional(),
  filter: z.string().max(1000).optional(),
  fields: z.array(z.string()).optional(),
  include_count: z.boolean().default(false)
})

// =============================================================================
// UNIQUE NAME VALIDATION UTILITIES
// =============================================================================

/**
 * Creates a Zod refinement function for unique name validation within an array
 * Replaces the Angular uniqueNameValidator function
 */
export function createUniqueNameValidation<T extends { name: string }>(
  fieldName = 'name',
  errorMessage = ValidationMessages.NAME_NOT_UNIQUE
) {
  return (items: T[]) => {
    const nameSet = new Set<string>()
    const duplicates = new Set<string>()
    
    items.forEach(item => {
      const name = item[fieldName as keyof T] as string
      if (name && nameSet.has(name)) {
        duplicates.add(name)
      } else if (name) {
        nameSet.add(name)
      }
    })
    
    return duplicates.size === 0
  }
}

/**
 * Schema for validating arrays with unique names
 */
export const uniqueNameArraySchema = <T extends z.ZodSchema>(itemSchema: T) =>
  z.array(itemSchema)
    .refine(
      (items) => {
        const names = items.map((item: any) => item.name).filter(Boolean)
        return names.length === new Set(names).size
      },
      {
        message: ValidationMessages.NAME_NOT_UNIQUE
      }
    )

// =============================================================================
// ENVIRONMENT AND CONFIGURATION VALIDATION
// =============================================================================

/**
 * Environment variable validation schema
 */
export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_BASE_URL: urlSchema,
  SESSION_TIMEOUT: z.number().min(300).max(86400).default(3600), // 5 minutes to 24 hours
  MAX_UPLOAD_SIZE: z.number().min(1024).max(104857600).default(10485760), // 1KB to 100MB
  ENABLE_DEBUG: z.boolean().default(false),
  ENABLE_ANALYTICS: z.boolean().default(false)
})

/**
 * Feature flag configuration schema
 */
export const featureFlagSchema = z.object({
  enable_advanced_forms: z.boolean().default(true),
  enable_bulk_operations: z.boolean().default(true),
  enable_schema_caching: z.boolean().default(true),
  enable_connection_pooling: z.boolean().default(false),
  enable_audit_logging: z.boolean().default(false),
  max_schema_size: z.number().min(100).max(10000).default(1000)
})

// =============================================================================
// PERFORMANCE AND OPTIMIZATION SCHEMAS
// =============================================================================

/**
 * Cache configuration schema
 */
export const cacheConfigSchema = z.object({
  ttl: z.number().min(60).max(3600).default(300), // 1 minute to 1 hour
  max_size: z.number().min(100).max(10000).default(1000),
  enable_compression: z.boolean().default(true),
  enable_encryption: z.boolean().default(false)
})

/**
 * Performance monitoring schema
 */
export const performanceSchema = z.object({
  max_response_time: z.number().min(100).max(30000).default(5000), // 100ms to 30s
  enable_monitoring: z.boolean().default(true),
  sample_rate: z.number().min(0.01).max(1.0).default(0.1), // 1% to 100%
  alert_threshold: z.number().min(1000).max(60000).default(10000) // 1s to 60s
})

// =============================================================================
// TYPE EXPORTS FOR TYPESCRIPT INTEGRATION
// =============================================================================

// Infer types from schemas for TypeScript usage
export type RequiredString = z.infer<typeof requiredString>
export type OptionalString = z.infer<typeof optionalString>
export type EmailData = z.infer<typeof emailSchema>
export type PasswordData = z.infer<typeof passwordSchema>
export type ConfirmPasswordData = z.infer<typeof confirmPasswordSchema>
export type JsonData = z.infer<typeof jsonSchema>
export type CsvData = z.infer<typeof csvSchema>

export type ServiceNameData = z.infer<typeof serviceNameSchema>
export type DatabaseNameData = z.infer<typeof databaseNameSchema>
export type TableNameData = z.infer<typeof tableNameSchema>
export type FieldNameData = z.infer<typeof fieldNameSchema>

export type BasicConnectionData = z.infer<typeof basicConnectionSchema>
export type AdvancedConnectionData = z.infer<typeof advancedConnectionSchema>

export type EndpointConfigData = z.infer<typeof endpointConfigSchema>
export type FieldConfigData = z.infer<typeof fieldConfigSchema>
export type ImportConfigData = z.infer<typeof importConfigSchema>

export type PaginationData = z.infer<typeof paginationSchema>
export type SearchFilterData = z.infer<typeof searchFilterSchema>

export type EnvironmentData = z.infer<typeof environmentSchema>
export type FeatureFlagData = z.infer<typeof featureFlagSchema>
export type CacheConfigData = z.infer<typeof cacheConfigSchema>
export type PerformanceData = z.infer<typeof performanceSchema>

// =============================================================================
// SCHEMA COLLECTIONS FOR EASY IMPORT
// =============================================================================

/**
 * Collection of basic validation schemas
 */
export const BasicValidation = {
  requiredString,
  optionalString,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: confirmPasswordSchema,
  url: urlSchema,
  json: jsonSchema,
  csv: csvSchema
} as const

/**
 * Collection of identifier validation schemas
 */
export const IdentifierValidation = {
  identifier: identifierSchema,
  serviceName: serviceNameSchema,
  databaseName: databaseNameSchema,
  tableName: tableNameSchema,
  fieldName: fieldNameSchema,
  label: labelSchema,
  description: descriptionSchema
} as const

/**
 * Collection of connection validation schemas
 */
export const ConnectionValidation = {
  host: hostSchema,
  port: portSchema,
  timeout: timeoutSchema,
  username: usernameSchema,
  connectionString: connectionStringSchema,
  sslMode: sslModeSchema,
  basicConnection: basicConnectionSchema,
  advancedConnection: advancedConnectionSchema
} as const

/**
 * Collection of API validation schemas
 */
export const ApiValidation = {
  httpMethod: httpMethodSchema,
  endpointPath: endpointPathSchema,
  apiParameter: apiParameterSchema,
  endpointConfig: endpointConfigSchema
} as const

/**
 * Collection of field validation schemas
 */
export const FieldValidation = {
  fieldType: fieldTypeSchema,
  fieldConstraint: fieldConstraintSchema,
  fieldConfig: fieldConfigSchema
} as const

/**
 * Collection of utility validation schemas
 */
export const UtilityValidation = {
  bulkId: bulkIdSchema,
  bulkOperation: bulkOperationSchema,
  importConfig: importConfigSchema,
  pagination: paginationSchema,
  searchFilter: searchFilterSchema,
  uniqueNameArray: uniqueNameArraySchema
} as const

/**
 * Collection of configuration validation schemas
 */
export const ConfigValidation = {
  environment: environmentSchema,
  featureFlag: featureFlagSchema,
  cacheConfig: cacheConfigSchema,
  performance: performanceSchema
} as const

/**
 * All validation schemas grouped by category
 */
export const ValidationSchemas = {
  Basic: BasicValidation,
  Identifier: IdentifierValidation,
  Connection: ConnectionValidation,
  Api: ApiValidation,
  Field: FieldValidation,
  Utility: UtilityValidation,
  Config: ConfigValidation
} as const

// =============================================================================
// DEFAULT EXPORTS
// =============================================================================

export default ValidationSchemas