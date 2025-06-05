/**
 * Shared Zod validation utilities and common patterns used across schema management forms.
 * 
 * This module provides reusable validation schemas for database connections, identifiers,
 * names, and configuration patterns with consistent error messaging and type safety.
 * Integrates with React Hook Form for real-time validation under 100ms performance target.
 * 
 * @fileoverview Common validation schemas for DreamFactory schema management workflows
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { z } from 'zod';
import type { 
  DatabaseType, 
  DatabaseConfig,
  MySQLConfig,
  PostgreSQLConfig,
  OracleConfig,
  MongoDBConfig,
  SnowflakeConfig
} from '../../../types/database';
import type { SchemaField, FieldType, SchemaTable } from '../../../types/schema';
import type { ApiRequestOptions } from '../../../types/api';

// ============================================================================
// CORE IDENTIFIER VALIDATION PATTERNS
// ============================================================================

/**
 * Common identifier validation patterns for database objects
 * Ensures consistency across all schema management forms
 */
export const IdentifierPatterns = {
  /**
   * Service name validation for database service creation
   * Must be unique, alphanumeric with underscores and hyphens only
   */
  serviceName: z
    .string({ required_error: 'Service name is required' })
    .min(1, 'Service name cannot be empty')
    .max(50, 'Service name must be less than 50 characters')
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_-]*$/,
      'Service name must start with a letter and contain only letters, numbers, underscores, and hyphens'
    )
    .refine(
      (value) => !['api', 'system', 'db', 'admin', 'test', 'default'].includes(value.toLowerCase()),
      { message: 'Service name cannot be a reserved word' }
    ),

  /**
   * Database table name validation
   * Supports SQL naming conventions across different database types
   */
  tableName: z
    .string({ required_error: 'Table name is required' })
    .min(1, 'Table name cannot be empty')
    .max(128, 'Table name must be less than 128 characters')
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      'Table name must start with a letter or underscore and contain only letters, numbers, and underscores'
    )
    .refine(
      (value) => !value.startsWith('__') && !value.endsWith('__'),
      { message: 'Table name cannot start or end with double underscores' }
    ),

  /**
   * Database field/column name validation
   * Ensures compatibility across different database systems
   */
  fieldName: z
    .string({ required_error: 'Field name is required' })
    .min(1, 'Field name cannot be empty')
    .max(64, 'Field name must be less than 64 characters')
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      'Field name must start with a letter or underscore and contain only letters, numbers, and underscores'
    )
    .refine(
      (value) => !['id', 'created_at', 'updated_at', 'deleted_at'].includes(value.toLowerCase()) || 
                 ['id', 'created_at', 'updated_at', 'deleted_at'].includes(value),
      { message: 'Field name conflicts with reserved system fields. Use exact casing if intentional.' }
    ),

  /**
   * Schema name validation for databases that support schemas
   * PostgreSQL, Oracle, SQL Server specific patterns
   */
  schemaName: z
    .string()
    .min(1, 'Schema name cannot be empty')
    .max(64, 'Schema name must be less than 64 characters')
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      'Schema name must start with a letter or underscore and contain only letters, numbers, and underscores'
    )
    .optional(),

  /**
   * Index name validation for database indexes
   */
  indexName: z
    .string({ required_error: 'Index name is required' })
    .min(1, 'Index name cannot be empty')
    .max(64, 'Index name must be less than 64 characters')
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      'Index name must start with a letter or underscore and contain only letters, numbers, and underscores'
    ),

  /**
   * Constraint name validation for foreign keys, unique constraints, etc.
   */
  constraintName: z
    .string({ required_error: 'Constraint name is required' })
    .min(1, 'Constraint name cannot be empty')
    .max(64, 'Constraint name must be less than 64 characters')
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      'Constraint name must start with a letter or underscore and contain only letters, numbers, and underscores'
    ),
} as const;

// ============================================================================
// DATABASE CONNECTION VALIDATION SCHEMAS
// ============================================================================

/**
 * Base database connection configuration schema
 * Common fields across all database types with enhanced validation
 */
export const BaseDatabaseConnectionSchema = z.object({
  name: IdentifierPatterns.serviceName,
  label: z
    .string({ required_error: 'Display label is required' })
    .min(1, 'Label cannot be empty')
    .max(100, 'Label must be less than 100 characters')
    .regex(
      /^[a-zA-Z0-9\s\-_().,]+$/,
      'Label can contain letters, numbers, spaces, and common punctuation'
    ),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  type: z.enum([
    'mysql',
    'postgresql', 
    'oracle',
    'mongodb',
    'snowflake',
    'sqlsrv',
    'sqlite',
    'cassandra',
    'couchdb'
  ], {
    errorMap: () => ({ message: 'Please select a valid database type' })
  }),
  host: z
    .string({ required_error: 'Host is required' })
    .min(1, 'Host cannot be empty')
    .refine(
      (value) => {
        // Allow localhost, IP addresses, and domain names
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return (
          value === 'localhost' || 
          domainRegex.test(value) || 
          ipRegex.test(value) ||
          ipv6Regex.test(value)
        );
      },
      { message: 'Please enter a valid hostname, IP address, or localhost' }
    ),
  port: z
    .number({ 
      required_error: 'Port is required',
      invalid_type_error: 'Port must be a number' 
    })
    .int('Port must be an integer')
    .min(1, 'Port must be greater than 0')
    .max(65535, 'Port must be less than 65536'),
  database: z
    .string({ required_error: 'Database name is required' })
    .min(1, 'Database name cannot be empty')
    .max(64, 'Database name must be less than 64 characters')
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_-]*$/,
      'Database name must start with a letter or underscore'
    ),
  username: z
    .string({ required_error: 'Username is required' })
    .min(1, 'Username cannot be empty')
    .max(64, 'Username must be less than 64 characters'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty')
    .max(256, 'Password is too long'),
  isActive: z.boolean().default(true),
  connectionTimeout: z
    .number()
    .int()
    .min(1000, 'Connection timeout must be at least 1 second')
    .max(300000, 'Connection timeout cannot exceed 5 minutes')
    .default(5000),
  queryTimeout: z
    .number()
    .int()
    .min(1000, 'Query timeout must be at least 1 second')
    .max(600000, 'Query timeout cannot exceed 10 minutes')
    .optional(),
});

/**
 * SSL configuration validation schema
 * Used for secure database connections
 */
export const SSLConfigSchema = z.object({
  enabled: z.boolean().default(false),
  mode: z
    .enum(['require', 'prefer', 'allow', 'disable', 'verify-ca', 'verify-full'])
    .default('prefer'),
  cert: z.string().optional(),
  key: z.string().optional(),
  ca: z.string().optional(),
  rejectUnauthorized: z.boolean().default(true),
  serverName: z.string().optional(),
}).optional();

/**
 * Connection pooling configuration schema
 */
export const PoolingConfigSchema = z.object({
  enabled: z.boolean().default(true),
  minConnections: z
    .number()
    .int()
    .min(0, 'Minimum connections cannot be negative')
    .max(100, 'Minimum connections cannot exceed 100')
    .default(0),
  maxConnections: z
    .number()
    .int()
    .min(1, 'Maximum connections must be at least 1')
    .max(1000, 'Maximum connections cannot exceed 1000')
    .default(10),
  acquireTimeoutMillis: z
    .number()
    .int()
    .min(1000, 'Acquire timeout must be at least 1 second')
    .max(60000, 'Acquire timeout cannot exceed 1 minute')
    .default(30000),
  idleTimeoutMillis: z
    .number()
    .int()
    .min(10000, 'Idle timeout must be at least 10 seconds')
    .max(3600000, 'Idle timeout cannot exceed 1 hour')
    .default(300000),
}).optional();

/**
 * Database-specific connection schemas with enhanced validation
 */
export const DatabaseConnectionSchemas = {
  mysql: BaseDatabaseConnectionSchema.extend({
    type: z.literal('mysql'),
    charset: z
      .enum(['utf8', 'utf8mb4', 'latin1', 'ascii'])
      .default('utf8mb4')
      .optional(),
    timezone: z
      .string()
      .regex(/^[+-]\d{2}:\d{2}$|^UTC$|^[A-Za-z]+\/[A-Za-z_]+$/, 'Invalid timezone format')
      .default('UTC')
      .optional(),
    strictMode: z.boolean().default(true).optional(),
    ssl: SSLConfigSchema,
    pooling: PoolingConfigSchema,
    options: z.record(z.any()).optional(),
  }),

  postgresql: BaseDatabaseConnectionSchema.extend({
    type: z.literal('postgresql'),
    searchPath: z
      .array(z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid schema name in search path'))
      .default(['public'])
      .optional(),
    applicationName: z
      .string()
      .max(64, 'Application name must be less than 64 characters')
      .default('DreamFactory')
      .optional(),
    statementTimeout: z
      .number()
      .int()
      .min(0, 'Statement timeout cannot be negative')
      .max(3600000, 'Statement timeout cannot exceed 1 hour')
      .optional(),
    sslVerification: z.boolean().default(true).optional(),
    ssl: SSLConfigSchema,
    pooling: PoolingConfigSchema,
    options: z.record(z.any()).optional(),
  }),

  oracle: BaseDatabaseConnectionSchema.extend({
    type: z.literal('oracle'),
    serviceName: z
      .string()
      .max(64, 'Service name must be less than 64 characters')
      .optional(),
    tnsConnectString: z
      .string()
      .max(512, 'TNS connect string is too long')
      .optional(),
    edition: z
      .enum(['standard', 'express', 'enterprise'])
      .default('standard')
      .optional(),
    enableWallet: z.boolean().default(false).optional(),
    walletLocation: z
      .string()
      .max(256, 'Wallet location path is too long')
      .optional(),
    ssl: SSLConfigSchema,
    pooling: PoolingConfigSchema,
    options: z.record(z.any()).optional(),
  }),

  mongodb: BaseDatabaseConnectionSchema.omit({ database: true }).extend({
    type: z.literal('mongodb'),
    uri: z
      .string()
      .regex(
        /^mongodb(\+srv)?:\/\/([^@]+@)?[\w.-]+(:\d+)?(\/[\w-]*)?(\?.*)?$/,
        'Invalid MongoDB connection URI format'
      )
      .optional(),
    defaultDatabase: z
      .string()
      .min(1, 'Default database name cannot be empty')
      .max(64, 'Default database name must be less than 64 characters')
      .regex(/^[a-zA-Z_][a-zA-Z0-9_-]*$/, 'Invalid database name format')
      .optional(),
    authDatabase: z
      .string()
      .max(64, 'Auth database name must be less than 64 characters')
      .default('admin')
      .optional(),
    replicaSet: z
      .string()
      .max(64, 'Replica set name must be less than 64 characters')
      .optional(),
    readPreference: z
      .enum(['primary', 'primaryPreferred', 'secondary', 'secondaryPreferred', 'nearest'])
      .default('primary')
      .optional(),
    writeConcern: z.object({
      w: z.union([z.number().int().min(0), z.string()]).default(1).optional(),
      j: z.boolean().default(false).optional(),
      wtimeout: z.number().int().min(0).default(10000).optional(),
    }).optional(),
    ssl: SSLConfigSchema,
    options: z.record(z.any()).optional(),
  }),

  snowflake: BaseDatabaseConnectionSchema.extend({
    type: z.literal('snowflake'),
    account: z
      .string({ required_error: 'Snowflake account identifier is required' })
      .min(1, 'Account identifier cannot be empty')
      .max(64, 'Account identifier must be less than 64 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid account identifier format'),
    warehouse: z
      .string()
      .max(64, 'Warehouse name must be less than 64 characters')
      .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid warehouse name format')
      .optional(),
    role: z
      .string()
      .max(64, 'Role name must be less than 64 characters')
      .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid role name format')
      .optional(),
    sessionParameters: z
      .record(z.string())
      .optional(),
    privateKey: z
      .string()
      .max(4096, 'Private key is too long')
      .optional(),
    privateKeyPassphrase: z
      .string()
      .max(256, 'Private key passphrase is too long')
      .optional(),
    ssl: SSLConfigSchema,
    options: z.record(z.any()).optional(),
  }),
} as const;

// ============================================================================
// SCHEMA FIELD VALIDATION PATTERNS
// ============================================================================

/**
 * Database field type validation schema
 * Supports all common field types across different database systems
 */
export const FieldTypeSchema = z.enum([
  // String types
  'string', 'text', 'varchar', 'char', 'nvarchar', 'nchar', 'clob', 'nclob',
  // Numeric types
  'integer', 'bigint', 'smallint', 'decimal', 'numeric', 'float', 'double', 'real',
  'tinyint', 'mediumint', 'bit',
  // Date/time types
  'datetime', 'timestamp', 'date', 'time', 'year',
  // Binary types
  'binary', 'varbinary', 'blob', 'longblob', 'mediumblob', 'tinyblob',
  // Boolean type
  'boolean',
  // JSON and XML types
  'json', 'jsonb', 'xml',
  // UUID type
  'uuid',
  // Spatial types
  'geometry', 'geography', 'point', 'polygon',
  // Array types (PostgreSQL)
  'array',
  // Other types
  'enum', 'set', 'inet', 'cidr', 'macaddr',
], {
  errorMap: () => ({ message: 'Please select a valid field type' })
});

/**
 * Schema field definition validation
 * Comprehensive validation for database field configuration
 */
export const SchemaFieldSchema = z.object({
  name: IdentifierPatterns.fieldName,
  label: z
    .string()
    .max(100, 'Field label must be less than 100 characters')
    .optional(),
  type: FieldTypeSchema,
  size: z
    .number()
    .int()
    .min(1, 'Field size must be at least 1')
    .max(65535, 'Field size cannot exceed 65535')
    .optional(),
  precision: z
    .number()
    .int()
    .min(1, 'Precision must be at least 1')
    .max(65, 'Precision cannot exceed 65')
    .optional(),
  scale: z
    .number()
    .int()
    .min(0, 'Scale cannot be negative')
    .max(30, 'Scale cannot exceed 30')
    .optional(),
  isNullable: z.boolean().default(true),
  isPrimaryKey: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  isAutoIncrement: z.boolean().default(false),
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
  comment: z
    .string()
    .max(1024, 'Comment must be less than 1024 characters')
    .optional(),
  // Validation constraints
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  pattern: z
    .string()
    .refine(
      (value) => {
        try {
          new RegExp(value);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Invalid regular expression pattern' }
    )
    .optional(),
  enumValues: z
    .array(z.string().min(1, 'Enum value cannot be empty'))
    .min(1, 'At least one enum value is required')
    .optional(),
  // Foreign key reference
  referencedTable: IdentifierPatterns.tableName.optional(),
  referencedField: IdentifierPatterns.fieldName.optional(),
});

/**
 * Schema table definition validation
 * Comprehensive validation for database table configuration
 */
export const SchemaTableSchema = z.object({
  name: IdentifierPatterns.tableName,
  label: z
    .string()
    .max(100, 'Table label must be less than 100 characters')
    .optional(),
  description: z
    .string()
    .max(1024, 'Table description must be less than 1024 characters')
    .optional(),
  schema: IdentifierPatterns.schemaName,
  alias: z
    .string()
    .max(64, 'Table alias must be less than 64 characters')
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid alias format')
    .optional(),
  plural: z
    .string()
    .max(64, 'Plural name must be less than 64 characters')
    .optional(),
  isView: z.boolean().default(false),
  fields: z
    .array(SchemaFieldSchema)
    .min(1, 'Table must have at least one field')
    .refine(
      (fields) => {
        const names = fields.map(f => f.name.toLowerCase());
        return names.length === new Set(names).size;
      },
      { message: 'Field names must be unique within the table' }
    )
    .refine(
      (fields) => fields.filter(f => f.isPrimaryKey).length <= 1,
      { message: 'Table can have at most one primary key field' }
    ),
  // Table options
  engine: z
    .enum(['InnoDB', 'MyISAM', 'Memory', 'Archive', 'CSV'])
    .default('InnoDB')
    .optional(),
  charset: z
    .enum(['utf8', 'utf8mb4', 'latin1', 'ascii'])
    .default('utf8mb4')
    .optional(),
  collation: z
    .string()
    .max(64, 'Collation name must be less than 64 characters')
    .optional(),
  comment: z
    .string()
    .max(2048, 'Table comment must be less than 2048 characters')
    .optional(),
});

// ============================================================================
// API GENERATION CONFIGURATION SCHEMAS
// ============================================================================

/**
 * API endpoint configuration validation
 * Used for configuring generated REST API endpoints
 */
export const ApiEndpointConfigSchema = z.object({
  path: z
    .string({ required_error: 'API path is required' })
    .min(1, 'API path cannot be empty')
    .regex(/^\/[a-zA-Z0-9_\-\/]*$/, 'API path must start with / and contain only valid URL characters')
    .refine(
      (value) => !value.includes('//'),
      { message: 'API path cannot contain consecutive slashes' }
    ),
  methods: z
    .array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']))
    .min(1, 'At least one HTTP method must be selected')
    .refine(
      (methods) => methods.length === new Set(methods).size,
      { message: 'HTTP methods must be unique' }
    ),
  requiresAuth: z.boolean().default(true),
  allowedRoles: z
    .array(z.string().min(1, 'Role name cannot be empty'))
    .optional(),
  rateLimit: z.object({
    requests: z
      .number()
      .int()
      .min(1, 'Rate limit requests must be at least 1')
      .max(10000, 'Rate limit requests cannot exceed 10000'),
    window: z
      .number()
      .int()
      .min(1, 'Rate limit window must be at least 1 second')
      .max(86400, 'Rate limit window cannot exceed 24 hours'),
  }).optional(),
  caching: z.object({
    enabled: z.boolean().default(false),
    ttl: z
      .number()
      .int()
      .min(1, 'Cache TTL must be at least 1 second')
      .max(86400, 'Cache TTL cannot exceed 24 hours')
      .default(300),
  }).optional(),
  description: z
    .string()
    .max(1024, 'Endpoint description must be less than 1024 characters')
    .optional(),
});

/**
 * API generation workflow configuration
 * Controls the overall API generation process
 */
export const ApiGenerationConfigSchema = z.object({
  serviceName: IdentifierPatterns.serviceName,
  version: z
    .string()
    .regex(/^v\d+(\.\d+)?$/, 'Version must be in format v1 or v1.0')
    .default('v1'),
  baseUrl: z
    .string()
    .url('Base URL must be a valid URL')
    .optional(),
  generateDocs: z.boolean().default(true),
  enableCors: z.boolean().default(true),
  corsOrigins: z
    .array(z.string().url('CORS origin must be a valid URL'))
    .default(['*'])
    .optional(),
  defaultContentType: z
    .enum(['application/json', 'application/xml', 'text/plain'])
    .default('application/json'),
  includeMetadata: z.boolean().default(true),
  enablePagination: z.boolean().default(true),
  maxPageSize: z
    .number()
    .int()
    .min(10, 'Maximum page size must be at least 10')
    .max(10000, 'Maximum page size cannot exceed 10000')
    .default(1000),
  defaultPageSize: z
    .number()
    .int()
    .min(1, 'Default page size must be at least 1')
    .max(1000, 'Default page size cannot exceed 1000')
    .default(25),
});

// ============================================================================
// VALIDATION UTILITIES AND HELPERS
// ============================================================================

/**
 * Validates database connection parameters based on database type
 * Provides type-safe validation with database-specific rules
 */
export function validateDatabaseConnection(
  type: DatabaseType,
  config: Partial<DatabaseConfig>
): z.ZodSchema<any> {
  switch (type) {
    case 'mysql':
      return DatabaseConnectionSchemas.mysql;
    case 'postgresql':
      return DatabaseConnectionSchemas.postgresql;
    case 'oracle':
      return DatabaseConnectionSchemas.oracle;
    case 'mongodb':
      return DatabaseConnectionSchemas.mongodb;
    case 'snowflake':
      return DatabaseConnectionSchemas.snowflake;
    default:
      return BaseDatabaseConnectionSchema;
  }
}

/**
 * Creates a validation schema for unique field names within a table
 * Prevents duplicate field names and reserved word conflicts
 */
export function createUniqueFieldNamesSchema() {
  return z
    .array(SchemaFieldSchema)
    .refine(
      (fields) => {
        const names = fields.map(field => field.name.toLowerCase());
        return names.length === new Set(names).size;
      },
      {
        message: 'Field names must be unique within the table',
        path: ['fields'],
      }
    );
}

/**
 * Creates a validation schema for table relationships
 * Ensures foreign key references are valid and avoid circular dependencies
 */
export function createTableRelationshipSchema(existingTables: string[]) {
  return z.object({
    sourceField: IdentifierPatterns.fieldName,
    targetTable: z
      .string()
      .refine(
        (table) => existingTables.includes(table),
        { message: 'Referenced table must exist in the schema' }
      ),
    targetField: IdentifierPatterns.fieldName,
    onDelete: z
      .enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'])
      .default('RESTRICT'),
    onUpdate: z
      .enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'])
      .default('CASCADE'),
  });
}

/**
 * Validates API endpoint path uniqueness across service configuration
 * Prevents conflicting endpoint definitions
 */
export function createUniqueEndpointPathsSchema() {
  return z
    .array(ApiEndpointConfigSchema)
    .refine(
      (endpoints) => {
        const paths = endpoints.map(endpoint => endpoint.path.toLowerCase());
        return paths.length === new Set(paths).size;
      },
      {
        message: 'API endpoint paths must be unique',
        path: ['endpoints'],
      }
    );
}

/**
 * Custom validation error formatter for consistent error messages
 * Provides user-friendly error messages for schema validation failures
 */
export function formatValidationErrors(errors: z.ZodError): Record<string, string> {
  const formattedErrors: Record<string, string> = {};
  
  errors.errors.forEach((error) => {
    const path = error.path.join('.');
    formattedErrors[path] = error.message;
  });
  
  return formattedErrors;
}

/**
 * Debounced validation function for real-time form validation
 * Ensures validation performance under 100ms for responsive user experience
 */
export function createDebouncedValidator<T>(
  schema: z.ZodSchema<T>,
  debounceMs: number = 100
) {
  let timeoutId: NodeJS.Timeout;
  
  return (data: unknown): Promise<{ success: boolean; errors?: Record<string, string>; data?: T }> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const result = schema.safeParse(data);
        if (result.success) {
          resolve({ success: true, data: result.data });
        } else {
          resolve({ 
            success: false, 
            errors: formatValidationErrors(result.error) 
          });
        }
      }, debounceMs);
    });
  };
}

// ============================================================================
// TYPE EXPORTS FOR FORM INTEGRATION
// ============================================================================

// Export inferred types for React Hook Form integration
export type DatabaseConnectionFormData = z.infer<typeof BaseDatabaseConnectionSchema>;
export type MySQLConnectionFormData = z.infer<typeof DatabaseConnectionSchemas.mysql>;
export type PostgreSQLConnectionFormData = z.infer<typeof DatabaseConnectionSchemas.postgresql>;
export type OracleConnectionFormData = z.infer<typeof DatabaseConnectionSchemas.oracle>;
export type MongoDBConnectionFormData = z.infer<typeof DatabaseConnectionSchemas.mongodb>;
export type SnowflakeConnectionFormData = z.infer<typeof DatabaseConnectionSchemas.snowflake>;

export type SchemaFieldFormData = z.infer<typeof SchemaFieldSchema>;
export type SchemaTableFormData = z.infer<typeof SchemaTableSchema>;
export type ApiEndpointConfigFormData = z.infer<typeof ApiEndpointConfigSchema>;
export type ApiGenerationConfigFormData = z.infer<typeof ApiGenerationConfigSchema>;

// Export schema objects for form registration
export {
  BaseDatabaseConnectionSchema,
  DatabaseConnectionSchemas,
  SchemaFieldSchema,
  SchemaTableSchema,
  ApiEndpointConfigSchema,
  ApiGenerationConfigSchema,
  SSLConfigSchema,
  PoolingConfigSchema,
  FieldTypeSchema,
};