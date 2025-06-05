/**
 * Comprehensive Zod validation schemas for all application forms, API payloads,
 * configuration objects, and user inputs. Provides runtime type checking with
 * compile-time inference ensuring data integrity throughout the React application.
 * 
 * Integrates with React Hook Form for real-time validation under 100ms performance target.
 * Supports server-side validation for Next.js API routes.
 */

import { z } from 'zod'

// ============================================================================
// CORE VALIDATION UTILITIES
// ============================================================================

/**
 * Custom JSON string validator with detailed error messaging
 * Replaces Angular JsonValidator with Zod-compatible implementation
 */
export const jsonStringSchema = z
  .string()
  .refine(
    (value) => {
      if (!value || value.trim() === '') return true
      try {
        JSON.parse(value)
        return true
      } catch {
        return false
      }
    },
    {
      message: 'Invalid JSON format. Please check syntax and try again.',
    }
  )

/**
 * Password matching validator for registration and password change forms
 * Replaces Angular matchValidator with Zod-compatible implementation
 */
export const createPasswordMatchSchema = () =>
  z
    .object({
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          'Password must contain uppercase, lowercase, number, and special character'
        ),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    })

/**
 * Unique name validator for form arrays with duplicate detection
 * Replaces Angular uniqueNameValidator with Zod-compatible implementation
 */
export const createUniqueNameArraySchema = <T extends { name: string }>(
  itemSchema: z.ZodSchema<T>
) =>
  z.array(itemSchema).refine(
    (items) => {
      const names = items.map((item) => item.name?.toLowerCase()).filter(Boolean)
      return names.length === new Set(names).size
    },
    {
      message: 'Names must be unique across all items',
    }
  )

/**
 * Common validation patterns used across multiple forms
 */
export const ValidationPatterns = {
  // Network and connectivity
  host: z
    .string()
    .min(1, 'Host is required')
    .refine(
      (value) => {
        // Allow localhost, IP addresses, and domain names
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
        return value === 'localhost' || domainRegex.test(value) || ipRegex.test(value)
      },
      { message: 'Please enter a valid hostname or IP address' }
    ),

  port: z
    .number({ invalid_type_error: 'Port must be a number' })
    .int('Port must be an integer')
    .min(1, 'Port must be greater than 0')
    .max(65535, 'Port must be less than 65536'),

  // User input constraints
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-\s]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores'),

  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),

  email: z
    .string()
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long'),

  url: z
    .string()
    .url('Please enter a valid URL')
    .max(2048, 'URL is too long'),

  // API and security
  apiKey: z
    .string()
    .min(16, 'API key must be at least 16 characters')
    .max(256, 'API key is too long'),

  sessionToken: z
    .string()
    .min(1, 'Session token is required')
    .max(1024, 'Session token is too long'),
}

// ============================================================================
// DATABASE CONNECTION VALIDATION SCHEMAS
// ============================================================================

/**
 * Database connection types supported by DreamFactory
 */
export const DatabaseTypeSchema = z.enum([
  'mysql',
  'postgresql',
  'sqlsrv',
  'oracle',
  'mongodb',
  'snowflake',
  'sqlite',
  'cassandra',
  'couchdb',
  'adabas',
  'db2',
  'firebird',
  'informix',
  'redis',
  'riak',
], {
  errorMap: () => ({ message: 'Please select a valid database type' }),
})

/**
 * SSL connection modes for database security
 */
export const SSLModeSchema = z.enum([
  'disable',
  'allow',
  'prefer',
  'require',
  'verify-ca',
  'verify-full',
], {
  errorMap: () => ({ message: 'Please select a valid SSL mode' }),
})

/**
 * Core database connection configuration schema
 * Used for creating and editing database service connections
 */
export const DatabaseConnectionSchema = z.object({
  name: ValidationPatterns.name,
  label: z.string().max(100, 'Label must be less than 100 characters').optional(),
  description: ValidationPatterns.description,
  type: DatabaseTypeSchema,
  is_active: z.boolean().default(true),

  // Connection parameters
  host: ValidationPatterns.host,
  port: ValidationPatterns.port.optional(),
  database: z.string().min(1, 'Database name is required').max(64, 'Database name is too long'),
  username: z.string().min(1, 'Username is required').max(128, 'Username is too long'),
  password: z.string().min(1, 'Password is required').max(256, 'Password is too long'),

  // Advanced connection options
  charset: z.string().max(32, 'Charset name is too long').optional(),
  collation: z.string().max(64, 'Collation name is too long').optional(),
  timezone: z.string().max(32, 'Timezone is too long').optional(),
  
  // SSL configuration
  ssl_enabled: z.boolean().default(false),
  ssl_mode: SSLModeSchema.optional(),
  ssl_cert: z.string().max(10000, 'SSL certificate is too long').optional(),
  ssl_key: z.string().max(10000, 'SSL key is too long').optional(),
  ssl_ca: z.string().max(10000, 'SSL CA certificate is too long').optional(),

  // Connection pooling and performance
  max_connections: z.number().int().min(1).max(1000).default(10),
  connection_timeout: z.number().int().min(1).max(300).default(30),
  query_timeout: z.number().int().min(1).max(3600).default(300),

  // MongoDB specific options
  auth_source: z.string().max(64, 'Auth source is too long').optional(),
  replica_set: z.string().max(128, 'Replica set name is too long').optional(),

  // Additional driver options as JSON
  driver_options: jsonStringSchema.optional(),
})

/**
 * Database connection test schema for validation endpoint
 */
export const DatabaseConnectionTestSchema = DatabaseConnectionSchema.pick({
  type: true,
  host: true,
  port: true,
  database: true,
  username: true,
  password: true,
  ssl_enabled: true,
  ssl_mode: true,
  connection_timeout: true,
})

/**
 * Database service update schema (allows partial updates)
 */
export const DatabaseServiceUpdateSchema = DatabaseConnectionSchema.partial().extend({
  id: z.number().int().positive('Service ID must be a positive integer'),
})

// ============================================================================
// USER MANAGEMENT VALIDATION SCHEMAS
// ============================================================================

/**
 * User registration schema with password confirmation
 */
export const UserRegistrationSchema = createPasswordMatchSchema().extend({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  name: z.string().min(1, 'Display name is required').max(100, 'Display name is too long'),
  email: ValidationPatterns.email,
  phone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
    .max(20, 'Phone number is too long')
    .optional(),
})

/**
 * User login credentials schema
 */
export const UserLoginSchema = z.object({
  email: ValidationPatterns.email,
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().default(false),
})

/**
 * User profile update schema
 */
export const UserProfileUpdateSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  name: z.string().min(1, 'Display name is required').max(100, 'Display name is too long'),
  email: ValidationPatterns.email,
  phone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
    .max(20, 'Phone number is too long')
    .optional(),
  security_question: z.string().max(255, 'Security question is too long').optional(),
  security_answer: z.string().max(255, 'Security answer is too long').optional(),
})

/**
 * Password change schema with current password verification
 */
export const PasswordChangeSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
  })
  .merge(createPasswordMatchSchema())

/**
 * Password reset request schema
 */
export const PasswordResetRequestSchema = z.object({
  email: ValidationPatterns.email,
})

/**
 * Password reset confirmation schema
 */
export const PasswordResetConfirmSchema = createPasswordMatchSchema().extend({
  token: z.string().min(1, 'Reset token is required'),
})

/**
 * Admin user creation schema
 */
export const AdminUserCreationSchema = UserRegistrationSchema.extend({
  is_sys_admin: z.boolean().default(false),
  is_active: z.boolean().default(true),
  role_id: z.number().int().positive('Please select a valid role').optional(),
})

// ============================================================================
// ROLE AND SECURITY VALIDATION SCHEMAS
// ============================================================================

/**
 * Role creation and update schema
 */
export const RoleSchema = z.object({
  name: ValidationPatterns.name,
  description: ValidationPatterns.description,
  is_active: z.boolean().default(true),
  role_service_access_by_role_id: z.array(z.object({
    service_id: z.number().int().positive(),
    component: z.string().max(255),
    verb_mask: z.number().int().min(0).max(31),
    requestor_type: z.enum(['API', 'SCRIPT_POST', 'SCRIPT_PRE']),
    filters: z.array(z.string()).optional(),
    filter_op: z.enum(['AND', 'OR']).default('AND'),
  })).optional(),
})

/**
 * API key creation schema
 */
export const ApiKeyCreationSchema = z.object({
  name: ValidationPatterns.name,
  role_id: z.number().int().positive('Please select a valid role'),
  is_active: z.boolean().default(true),
  expires_at: z.string().datetime().optional(),
  allowed_hosts: z.array(z.string().max(255)).optional(),
})

/**
 * API key update schema
 */
export const ApiKeyUpdateSchema = ApiKeyCreationSchema.partial().extend({
  id: z.number().int().positive('API key ID must be a positive integer'),
})

// ============================================================================
// SERVICE CONFIGURATION VALIDATION SCHEMAS
// ============================================================================

/**
 * Service endpoint configuration schema
 */
export const ServiceEndpointSchema = z.object({
  service_id: z.number().int().positive('Service ID is required'),
  table_name: z.string().min(1, 'Table name is required').max(128, 'Table name is too long'),
  endpoints: z.array(z.object({
    verb: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    path: z.string().min(1, 'Endpoint path is required').max(255, 'Endpoint path is too long'),
    enabled: z.boolean().default(true),
    requires_auth: z.boolean().default(true),
    rate_limit: z.number().int().min(0).max(10000).optional(),
    cache_enabled: z.boolean().default(false),
    cache_ttl: z.number().int().min(0).max(86400).optional(),
  })),
  security_rules: z.array(z.object({
    rule_type: z.enum(['filter', 'validation', 'transformation']),
    condition: z.string().max(1000, 'Rule condition is too long'),
    action: z.string().max(1000, 'Rule action is too long'),
    enabled: z.boolean().default(true),
  })).optional(),
})

/**
 * OpenAPI specification configuration schema
 */
export const OpenApiConfigSchema = z.object({
  title: z.string().min(1, 'API title is required').max(100, 'API title is too long'),
  description: z.string().max(1000, 'API description is too long').optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in format x.y.z'),
  contact_name: z.string().max(100, 'Contact name is too long').optional(),
  contact_email: ValidationPatterns.email.optional(),
  license_name: z.string().max(100, 'License name is too long').optional(),
  license_url: ValidationPatterns.url.optional(),
  servers: z.array(z.object({
    url: ValidationPatterns.url,
    description: z.string().max(255, 'Server description is too long').optional(),
  })).optional(),
})

// ============================================================================
// SCHEMA DISCOVERY VALIDATION SCHEMAS
// ============================================================================

/**
 * Table field definition schema for schema discovery
 */
export const TableFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required').max(128, 'Field name is too long'),
  type: z.string().min(1, 'Field type is required').max(64, 'Field type is too long'),
  length: z.number().int().min(0).optional(),
  precision: z.number().int().min(0).max(65).optional(),
  scale: z.number().int().min(0).max(30).optional(),
  is_nullable: z.boolean().default(true),
  is_primary_key: z.boolean().default(false),
  is_unique: z.boolean().default(false),
  is_index: z.boolean().default(false),
  default_value: z.string().max(255, 'Default value is too long').optional(),
  comment: z.string().max(500, 'Comment is too long').optional(),
  validation_rules: jsonStringSchema.optional(),
})

/**
 * Table creation/update schema
 */
export const TableDefinitionSchema = z.object({
  name: z
    .string()
    .min(1, 'Table name is required')
    .max(128, 'Table name is too long')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Table name must start with a letter and contain only letters, numbers, and underscores'),
  label: z.string().max(100, 'Table label is too long').optional(),
  description: z.string().max(500, 'Table description is too long').optional(),
  fields: z.array(TableFieldSchema).min(1, 'At least one field is required'),
  indexes: z.array(z.object({
    name: z.string().min(1, 'Index name is required').max(128, 'Index name is too long'),
    type: z.enum(['INDEX', 'UNIQUE', 'FULLTEXT', 'SPATIAL']),
    fields: z.array(z.string()).min(1, 'At least one field is required for index'),
  })).optional(),
})

/**
 * Table relationship schema
 */
export const TableRelationshipSchema = z.object({
  name: z.string().min(1, 'Relationship name is required').max(128, 'Relationship name is too long'),
  type: z.enum(['belongs_to', 'has_one', 'has_many', 'many_to_many']),
  local_table: z.string().min(1, 'Local table is required'),
  local_field: z.string().min(1, 'Local field is required'),
  foreign_table: z.string().min(1, 'Foreign table is required'),
  foreign_field: z.string().min(1, 'Foreign field is required'),
  junction_table: z.string().optional(),
  junction_local_field: z.string().optional(),
  junction_foreign_field: z.string().optional(),
  on_delete: z.enum(['CASCADE', 'SET_NULL', 'RESTRICT', 'NO_ACTION']).default('RESTRICT'),
  on_update: z.enum(['CASCADE', 'SET_NULL', 'RESTRICT', 'NO_ACTION']).default('CASCADE'),
})

// ============================================================================
// SYSTEM CONFIGURATION VALIDATION SCHEMAS
// ============================================================================

/**
 * CORS configuration schema
 */
export const CorsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  allowed_origins: z.array(z.string().max(255)).default(['*']),
  allowed_methods: z.array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'])),
  allowed_headers: z.array(z.string().max(100)),
  exposed_headers: z.array(z.string().max(100)).optional(),
  max_age: z.number().int().min(0).max(86400).default(3600),
  supports_credentials: z.boolean().default(false),
})

/**
 * Cache configuration schema
 */
export const CacheConfigSchema = z.object({
  default_ttl: z.number().int().min(0).max(86400).default(300),
  max_memory: z.number().int().min(1).max(1024).default(128),
  redis_host: ValidationPatterns.host.optional(),
  redis_port: ValidationPatterns.port.optional(),
  redis_password: z.string().max(256).optional(),
  redis_database: z.number().int().min(0).max(15).default(0),
})

/**
 * Email template schema
 */
export const EmailTemplateSchema = z.object({
  name: ValidationPatterns.name,
  description: ValidationPatterns.description,
  subject: z.string().min(1, 'Email subject is required').max(255, 'Email subject is too long'),
  body_text: z.string().max(10000, 'Email body is too long').optional(),
  body_html: z.string().max(10000, 'Email HTML body is too long').optional(),
  from_name: z.string().max(100, 'From name is too long').optional(),
  from_email: ValidationPatterns.email.optional(),
  reply_to_name: z.string().max(100, 'Reply-to name is too long').optional(),
  reply_to_email: ValidationPatterns.email.optional(),
  defaults: jsonStringSchema.optional(),
})

/**
 * Global lookup key schema
 */
export const LookupKeySchema = z.object({
  name: z
    .string()
    .min(1, 'Lookup key name is required')
    .max(128, 'Lookup key name is too long')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Lookup key must start with a letter and contain only letters, numbers, and underscores'),
  value: z.string().max(1000, 'Lookup key value is too long'),
  private: z.boolean().default(false),
  description: z.string().max(500, 'Description is too long').optional(),
})

// ============================================================================
// FILE MANAGEMENT VALIDATION SCHEMAS
// ============================================================================

/**
 * File upload validation schema
 */
export const FileUploadSchema = z.object({
  name: z.string().min(1, 'File name is required').max(255, 'File name is too long'),
  size: z.number().int().min(1, 'File size must be greater than 0').max(100 * 1024 * 1024, 'File size cannot exceed 100MB'),
  type: z.string().max(100, 'File type is too long'),
  path: z.string().max(500, 'File path is too long').optional(),
  content_type: z.string().max(100, 'Content type is too long').optional(),
})

/**
 * Folder creation schema
 */
export const FolderCreationSchema = z.object({
  name: z
    .string()
    .min(1, 'Folder name is required')
    .max(255, 'Folder name is too long')
    .regex(/^[^<>:"/\\|?*]+$/, 'Folder name contains invalid characters'),
  path: z.string().max(500, 'Folder path is too long').optional(),
})

// ============================================================================
// SCHEDULER AND EVENT VALIDATION SCHEMAS
// ============================================================================

/**
 * Scheduled task schema
 */
export const ScheduledTaskSchema = z.object({
  name: ValidationPatterns.name,
  description: ValidationPatterns.description,
  is_active: z.boolean().default(true),
  cron_expression: z
    .string()
    .min(1, 'Cron expression is required')
    .regex(/^(\S+\s+){4}\S+$/, 'Invalid cron expression format'),
  service_id: z.number().int().positive('Please select a valid service'),
  component: z.string().min(1, 'Component is required').max(255, 'Component name is too long'),
  payload: jsonStringSchema.optional(),
  callback_url: ValidationPatterns.url.optional(),
  timeout: z.number().int().min(1).max(3600).default(300),
  max_retries: z.number().int().min(0).max(10).default(3),
})

/**
 * Event script schema
 */
export const EventScriptSchema = z.object({
  name: ValidationPatterns.name,
  description: ValidationPatterns.description,
  type: z.enum(['php', 'nodejs', 'python', 'v8js']),
  is_active: z.boolean().default(true),
  content: z.string().min(1, 'Script content is required').max(100000, 'Script content is too long'),
  config: jsonStringSchema.optional(),
})

// ============================================================================
// FORM SUBMISSION AND API VALIDATION
// ============================================================================

/**
 * Generic API response schema for validation
 */
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional(),
})

/**
 * Pagination parameters schema
 */
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(1000).default(25),
  sort: z.string().max(128).optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().max(255).optional(),
})

/**
 * Bulk operation schema
 */
export const BulkOperationSchema = z.object({
  operation: z.enum(['create', 'update', 'delete']),
  ids: z.array(z.number().int().positive()).min(1, 'At least one item must be selected'),
  data: z.any().optional(),
})

// ============================================================================
// TYPE EXPORTS FOR REACT HOOK FORM INTEGRATION
// ============================================================================

// Database connection types
export type DatabaseConnectionFormData = z.infer<typeof DatabaseConnectionSchema>
export type DatabaseConnectionTestData = z.infer<typeof DatabaseConnectionTestSchema>
export type DatabaseServiceUpdateData = z.infer<typeof DatabaseServiceUpdateSchema>

// User management types
export type UserRegistrationFormData = z.infer<typeof UserRegistrationSchema>
export type UserLoginFormData = z.infer<typeof UserLoginSchema>
export type UserProfileUpdateData = z.infer<typeof UserProfileUpdateSchema>
export type PasswordChangeFormData = z.infer<typeof PasswordChangeSchema>
export type PasswordResetRequestData = z.infer<typeof PasswordResetRequestSchema>
export type PasswordResetConfirmData = z.infer<typeof PasswordResetConfirmSchema>
export type AdminUserCreationData = z.infer<typeof AdminUserCreationSchema>

// Role and security types
export type RoleFormData = z.infer<typeof RoleSchema>
export type ApiKeyCreationData = z.infer<typeof ApiKeyCreationSchema>
export type ApiKeyUpdateData = z.infer<typeof ApiKeyUpdateSchema>

// Service configuration types
export type ServiceEndpointData = z.infer<typeof ServiceEndpointSchema>
export type OpenApiConfigData = z.infer<typeof OpenApiConfigSchema>

// Schema discovery types
export type TableFieldData = z.infer<typeof TableFieldSchema>
export type TableDefinitionData = z.infer<typeof TableDefinitionSchema>
export type TableRelationshipData = z.infer<typeof TableRelationshipSchema>

// System configuration types
export type CorsConfigData = z.infer<typeof CorsConfigSchema>
export type CacheConfigData = z.infer<typeof CacheConfigSchema>
export type EmailTemplateData = z.infer<typeof EmailTemplateSchema>
export type LookupKeyData = z.infer<typeof LookupKeySchema>

// File management types
export type FileUploadData = z.infer<typeof FileUploadSchema>
export type FolderCreationData = z.infer<typeof FolderCreationSchema>

// Scheduler and event types
export type ScheduledTaskData = z.infer<typeof ScheduledTaskSchema>
export type EventScriptData = z.infer<typeof EventScriptSchema>

// API and utility types
export type ApiResponseData = z.infer<typeof ApiResponseSchema>
export type PaginationData = z.infer<typeof PaginationSchema>
export type BulkOperationData = z.infer<typeof BulkOperationSchema>

/**
 * Helper function to create form resolver for React Hook Form
 * Provides runtime validation with compile-time type inference
 */
export const createFormResolver = <T>(schema: z.ZodSchema<T>) => {
  return async (data: any) => {
    try {
      const result = await schema.parseAsync(data)
      return { values: result, errors: {} }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formErrors: Record<string, { message: string }> = {}
        error.errors.forEach((err) => {
          const path = err.path.join('.')
          formErrors[path] = { message: err.message }
        })
        return { values: {}, errors: formErrors }
      }
      throw error
    }
  }
}

/**
 * Performance-optimized validation function for real-time validation
 * Ensures validation completes under 100ms performance target
 */
export const validateField = <T>(schema: z.ZodSchema<T>, value: any): string | undefined => {
  try {
    schema.parse(value)
    return undefined
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message
    }
    return 'Validation error occurred'
  }
}

/**
 * Server-side validation helper for Next.js API routes
 * Provides comprehensive error handling for API endpoints
 */
export const validateApiPayload = async <T>(
  schema: z.ZodSchema<T>,
  payload: any
): Promise<{ success: true; data: T } | { success: false; errors: Array<{ field: string; message: string }> }> => {
  try {
    const data = await schema.parseAsync(payload)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      return { success: false, errors }
    }
    return {
      success: false,
      errors: [{ field: 'general', message: 'Validation failed' }],
    }
  }
}