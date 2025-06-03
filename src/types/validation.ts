/**
 * Comprehensive Zod Validation Schemas
 * 
 * This module provides runtime type checking with compile-time inference for all application forms,
 * API payloads, configuration objects, and user inputs. Designed for React Hook Form integration
 * with performance targets under 100ms for real-time validation.
 * 
 * Features:
 * - Runtime type checking with compile-time TypeScript inference
 * - Custom error messages with internationalization support
 * - React Hook Form resolver integration
 * - Next.js API route validation support
 * - Field-level validation with conditional logic
 * - Performance optimized for real-time validation under 100ms
 * 
 * @module validation
 * @version 1.0.0
 * @since React 19 / Next.js 15.1 Migration
 */

import { z } from 'zod';

// =============================================================================
// CORE VALIDATION UTILITIES
// =============================================================================

/**
 * Enhanced error message mapping for consistent user feedback
 */
export const ErrorMessages = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_URL: 'Please enter a valid URL',
  INVALID_JSON: 'Please enter valid JSON',
  PASSWORD_WEAK: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  PASSWORDS_NO_MATCH: 'Passwords do not match',
  NAME_TOO_SHORT: 'Name must be at least 2 characters',
  NAME_TOO_LONG: 'Name must not exceed 100 characters',
  INVALID_PORT: 'Port must be between 1 and 65535',
  CONNECTION_NAME_EXISTS: 'A service with this name already exists',
  INVALID_DATABASE_TYPE: 'Please select a valid database type',
  HOST_REQUIRED: 'Database host is required',
  USERNAME_REQUIRED: 'Username is required',
  DATABASE_NAME_REQUIRED: 'Database name is required',
  INVALID_IP_ADDRESS: 'Please enter a valid IP address',
  INVALID_PHONE: 'Please enter a valid phone number',
  FILE_TOO_LARGE: 'File size must not exceed the maximum limit',
  INVALID_FILE_TYPE: 'File type is not supported',
  FUTURE_DATE_REQUIRED: 'Date must be in the future',
  PAST_DATE_REQUIRED: 'Date must be in the past',
  ALPHANUMERIC_ONLY: 'Only letters and numbers are allowed',
  NO_SPECIAL_CHARS: 'Special characters are not allowed',
  POSITIVE_NUMBER: 'Value must be a positive number',
  INTEGER_REQUIRED: 'Value must be a whole number',
  RANGE_EXCEEDED: 'Value is outside the allowed range',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must not exceed ${max} characters`,
  MIN_VALUE: (min: number) => `Value must be at least ${min}`,
  MAX_VALUE: (max: number) => `Value must not exceed ${max}`,
  ENUM_INVALID: (options: string[]) => `Must be one of: ${options.join(', ')}`,
} as const;

/**
 * Database driver enumeration with validation
 */
export const DatabaseDriverSchema = z.enum([
  'mysql',
  'postgresql',
  'sqlserver',
  'oracle',
  'mongodb',
  'snowflake',
  'sqlite',
  'mariadb',
  'cassandra',
  'couchdb',
  'adabas',
  'db2',
  'firebird',
  'informix',
  'redis',
], {
  errorMap: () => ({ message: ErrorMessages.INVALID_DATABASE_TYPE }),
});

/**
 * Service status enumeration
 */
export const ServiceStatusSchema = z.enum([
  'active',
  'inactive',
  'testing',
  'error',
  'configuring',
  'disabled',
], {
  errorMap: () => ({ message: 'Please select a valid service status' }),
});

/**
 * User role enumeration
 */
export const UserRoleSchema = z.enum([
  'admin',
  'developer',
  'user',
  'viewer',
  'api-user',
  'system',
], {
  errorMap: () => ({ message: 'Please select a valid user role' }),
});

/**
 * Common field validation patterns
 */
export const CommonValidation = {
  // String validations
  name: z.string()
    .min(2, ErrorMessages.MIN_LENGTH(2))
    .max(100, ErrorMessages.MAX_LENGTH(100))
    .regex(/^[a-zA-Z0-9_\-\s]+$/, ErrorMessages.ALPHANUMERIC_ONLY),
  
  serviceName: z.string()
    .min(1, ErrorMessages.REQUIRED)
    .max(50, ErrorMessages.MAX_LENGTH(50))
    .regex(/^[a-zA-Z][a-zA-Z0-9_\-]*$/, 'Service name must start with a letter and contain only letters, numbers, underscores, and hyphens'),
  
  description: z.string()
    .max(500, ErrorMessages.MAX_LENGTH(500))
    .optional(),
  
  email: z.string()
    .email(ErrorMessages.INVALID_EMAIL)
    .max(254, ErrorMessages.MAX_LENGTH(254)),
  
  url: z.string()
    .url(ErrorMessages.INVALID_URL)
    .optional()
    .or(z.literal('')),
  
  // Password validation with complexity requirements
  password: z.string()
    .min(8, ErrorMessages.MIN_LENGTH(8))
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      ErrorMessages.PASSWORD_WEAK
    ),
  
  confirmPassword: z.string(),
  
  // Network validations
  host: z.string()
    .min(1, ErrorMessages.HOST_REQUIRED)
    .refine(
      (value) => {
        // Valid hostname or IP address
        const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return hostnameRegex.test(value) || ipRegex.test(value);
      },
      'Please enter a valid hostname or IP address'
    ),
  
  port: z.number()
    .min(1, ErrorMessages.MIN_VALUE(1))
    .max(65535, ErrorMessages.MAX_VALUE(65535))
    .int(ErrorMessages.INTEGER_REQUIRED),
  
  // JSON validation
  jsonString: z.string()
    .refine((value) => {
      if (!value || value.trim() === '') return true;
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }, ErrorMessages.INVALID_JSON),
  
  // Common IDs
  id: z.number().int().positive(),
  uuid: z.string().uuid('Invalid UUID format'),
  
  // Date validations
  dateString: z.string().datetime('Invalid date format'),
  futureDate: z.string().datetime().refine(
    (date) => new Date(date) > new Date(),
    ErrorMessages.FUTURE_DATE_REQUIRED
  ),
  pastDate: z.string().datetime().refine(
    (date) => new Date(date) < new Date(),
    ErrorMessages.PAST_DATE_REQUIRED
  ),
} as const;

// =============================================================================
// DATABASE SERVICE VALIDATION SCHEMAS
// =============================================================================

/**
 * SSL Configuration validation schema
 */
export const SSLConfigSchema = z.object({
  enabled: z.boolean().default(false),
  mode: z.enum(['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full']).optional(),
  ca: z.string().optional(),
  cert: z.string().optional(),
  key: z.string().optional(),
  rejectUnauthorized: z.boolean().default(true),
});

/**
 * Database connection pooling configuration
 */
export const PoolingConfigSchema = z.object({
  min: z.number().int().min(0).default(0),
  max: z.number().int().min(1).max(100).default(10),
  acquireTimeoutMillis: z.number().int().min(1000).max(300000).default(30000),
  createTimeoutMillis: z.number().int().min(1000).max(60000).default(30000),
  destroyTimeoutMillis: z.number().int().min(1000).max(60000).default(5000),
  idleTimeoutMillis: z.number().int().min(10000).max(3600000).default(600000),
  reapIntervalMillis: z.number().int().min(1000).max(60000).default(1000),
  createRetryIntervalMillis: z.number().int().min(100).max(10000).default(200),
});

/**
 * Database service configuration validation schema
 * Optimized for real-time validation under 100ms
 */
export const DatabaseServiceConfigSchema = z.object({
  // Connection parameters
  name: CommonValidation.serviceName,
  label: z.string().max(100).optional(),
  description: CommonValidation.description,
  driver: DatabaseDriverSchema,
  host: CommonValidation.host,
  port: CommonValidation.port.default(3306),
  database: z.string().min(1, ErrorMessages.DATABASE_NAME_REQUIRED).max(100),
  username: z.string().min(1, ErrorMessages.USERNAME_REQUIRED).max(100),
  password: z.string().min(1, 'Password is required').max(255),
  
  // Optional parameters
  connectionString: z.string().max(1000).optional(),
  charset: z.string().max(50).default('utf8'),
  timezone: z.string().max(50).default('UTC'),
  
  // Configuration objects
  ssl: SSLConfigSchema.optional(),
  pooling: PoolingConfigSchema.optional(),
  
  // Database-specific options
  options: z.record(z.any()).optional(),
  
  // Service metadata
  isActive: z.boolean().default(true),
  serviceName: z.string().optional(), // For backward compatibility
});

/**
 * Database connection test schema
 */
export const ConnectionTestSchema = z.object({
  host: CommonValidation.host,
  port: CommonValidation.port,
  database: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  driver: DatabaseDriverSchema,
  ssl: SSLConfigSchema.optional(),
  timeout: z.number().int().min(5000).max(60000).default(30000),
});

/**
 * Service creation/update schema with comprehensive validation
 */
export const ServiceFormSchema = z.object({
  id: z.number().optional(),
  name: CommonValidation.serviceName,
  label: z.string().max(100).optional(),
  description: CommonValidation.description,
  type: DatabaseDriverSchema,
  config: DatabaseServiceConfigSchema,
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    // Custom validation: ensure SSL is properly configured for production
    if (data.config.ssl?.enabled && !data.config.ssl.mode) {
      return false;
    }
    return true;
  },
  {
    message: 'SSL mode is required when SSL is enabled',
    path: ['config', 'ssl', 'mode'],
  }
);

// =============================================================================
// USER AUTHENTICATION & MANAGEMENT SCHEMAS
// =============================================================================

/**
 * User login validation schema
 */
export const LoginSchema = z.object({
  email: CommonValidation.email,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
  twoFactorCode: z.string().length(6).optional(),
});

/**
 * User registration validation schema
 */
export const RegisterSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: CommonValidation.email,
  password: CommonValidation.password,
  confirmPassword: CommonValidation.confirmPassword,
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, ErrorMessages.INVALID_PHONE).optional(),
  role: UserRoleSchema.default('user'),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: ErrorMessages.PASSWORDS_NO_MATCH,
    path: ['confirmPassword'],
  }
);

/**
 * Password change validation schema
 */
export const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: CommonValidation.password,
  confirmPassword: CommonValidation.confirmPassword,
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: ErrorMessages.PASSWORDS_NO_MATCH,
    path: ['confirmPassword'],
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  }
);

/**
 * Password reset validation schema
 */
export const PasswordResetSchema = z.object({
  email: CommonValidation.email,
});

/**
 * User profile update validation schema
 */
export const UserProfileSchema = z.object({
  id: CommonValidation.id.optional(),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: CommonValidation.email,
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, ErrorMessages.INVALID_PHONE).optional(),
  timezone: z.string().max(50).default('UTC'),
  language: z.string().length(2).default('en'),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  preferences: z.record(z.any()).optional(),
});

/**
 * Role assignment validation schema
 */
export const RoleAssignmentSchema = z.object({
  userId: CommonValidation.id,
  roleId: CommonValidation.id,
  serviceName: z.string().optional(),
  permissions: z.array(z.string()).default([]),
  expiresAt: z.string().datetime().optional(),
});

// =============================================================================
// SCHEMA DISCOVERY & API GENERATION SCHEMAS
// =============================================================================

/**
 * Schema field validation schema
 */
export const SchemaFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required').max(100),
  type: z.enum([
    'integer', 'bigint', 'decimal', 'float', 'double',
    'string', 'text', 'boolean', 'date', 'datetime',
    'timestamp', 'time', 'binary', 'json', 'xml',
    'uuid', 'enum', 'set'
  ]),
  dbType: z.string().max(100),
  length: z.number().int().positive().optional(),
  precision: z.number().int().positive().optional(),
  scale: z.number().int().min(0).optional(),
  defaultValue: z.any().optional(),
  isNullable: z.boolean().default(true),
  isPrimaryKey: z.boolean().default(false),
  isForeignKey: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  isAutoIncrement: z.boolean().default(false),
  label: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  validation: z.record(z.any()).optional(),
});

/**
 * Table configuration validation schema
 */
export const TableConfigSchema = z.object({
  name: z.string().min(1, 'Table name is required').max(100),
  label: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  schema: z.string().max(100).optional(),
  fields: z.array(SchemaFieldSchema).min(1, 'At least one field is required'),
  primaryKey: z.array(z.string()).optional(),
  indexes: z.array(z.object({
    name: z.string().max(100),
    fields: z.array(z.string()).min(1),
    unique: z.boolean().default(false),
    type: z.string().optional(),
  })).optional(),
  apiEnabled: z.boolean().default(true),
  caching: z.boolean().default(false),
  cacheTtl: z.number().int().min(60).max(86400).default(3600),
});

/**
 * API endpoint configuration validation schema
 */
export const ApiEndpointConfigSchema = z.object({
  tableName: z.string().min(1, 'Table name is required'),
  resourceName: z.string().min(1, 'Resource name is required').max(100),
  methods: z.array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])).min(1),
  authentication: z.boolean().default(true),
  publicRead: z.boolean().default(false),
  publicWrite: z.boolean().default(false),
  rateLimiting: z.object({
    enabled: z.boolean().default(false),
    requestsPerMinute: z.number().int().min(1).max(10000).default(100),
  }).optional(),
  caching: z.object({
    enabled: z.boolean().default(false),
    ttl: z.number().int().min(60).max(86400).default(300),
  }).optional(),
  validation: z.object({
    strictMode: z.boolean().default(true),
    allowExtraFields: z.boolean().default(false),
  }).optional(),
});

/**
 * OpenAPI specification generation schema
 */
export const OpenApiConfigSchema = z.object({
  title: z.string().min(1, 'API title is required').max(100),
  description: z.string().max(500).optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semantic version format (x.y.z)').default('1.0.0'),
  contact: z.object({
    name: z.string().max(100).optional(),
    email: CommonValidation.email.optional(),
    url: CommonValidation.url.optional(),
  }).optional(),
  license: z.object({
    name: z.string().max(100),
    url: CommonValidation.url.optional(),
  }).optional(),
  servers: z.array(z.object({
    url: z.string().url(),
    description: z.string().max(200).optional(),
  })).min(1, 'At least one server is required'),
  includeTables: z.array(z.string()).optional(),
  excludeTables: z.array(z.string()).optional(),
  includeSystemTables: z.boolean().default(false),
});

// =============================================================================
// SYSTEM CONFIGURATION SCHEMAS
// =============================================================================

/**
 * CORS configuration validation schema
 */
export const CorsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  allowedOrigins: z.array(z.string().url().or(z.literal('*'))).min(1),
  allowedMethods: z.array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'])).min(1),
  allowedHeaders: z.array(z.string()).default(['Content-Type', 'Authorization']),
  exposedHeaders: z.array(z.string()).optional(),
  allowCredentials: z.boolean().default(false),
  maxAge: z.number().int().min(0).max(86400).default(3600),
});

/**
 * Cache configuration validation schema
 */
export const CacheConfigSchema = z.object({
  enabled: z.boolean().default(true),
  driver: z.enum(['redis', 'file', 'database', 'memory']).default('file'),
  host: CommonValidation.host.optional(),
  port: CommonValidation.port.optional(),
  database: z.number().int().min(0).max(15).default(0),
  password: z.string().optional(),
  prefix: z.string().max(50).default('dreamfactory'),
  ttl: z.number().int().min(60).max(604800).default(3600),
  serializer: z.enum(['php', 'json']).default('json'),
});

/**
 * Email template configuration validation schema
 */
export const EmailTemplateSchema = z.object({
  id: CommonValidation.id.optional(),
  name: z.string().min(1, 'Template name is required').max(100),
  description: CommonValidation.description,
  subject: z.string().min(1, 'Subject is required').max(200),
  bodyText: z.string().optional(),
  bodyHtml: z.string().optional(),
  fromName: z.string().max(100).optional(),
  fromEmail: CommonValidation.email.optional(),
  replyToName: z.string().max(100).optional(),
  replyToEmail: CommonValidation.email.optional(),
  defaults: z.record(z.string()).optional(),
  isActive: z.boolean().default(true),
}).refine(
  (data) => data.bodyText || data.bodyHtml,
  {
    message: 'Either text body or HTML body is required',
    path: ['bodyText'],
  }
);

/**
 * System settings validation schema
 */
export const SystemSettingsSchema = z.object({
  siteName: z.string().min(1, 'Site name is required').max(100),
  siteDescription: z.string().max(500).optional(),
  defaultTimezone: z.string().max(50).default('UTC'),
  defaultLanguage: z.string().length(2).default('en'),
  maintenanceMode: z.boolean().default(false),
  registrationEnabled: z.boolean().default(true),
  passwordReset: z.boolean().default(true),
  emailVerification: z.boolean().default(false),
  sessionTimeout: z.number().int().min(300).max(86400).default(3600),
  apiRateLimit: z.number().int().min(10).max(10000).default(1000),
  fileUploadSize: z.number().int().min(1).max(1000).default(100), // MB
  allowedFileTypes: z.array(z.string()).default(['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx']),
  logLevel: z.enum(['debug', 'info', 'warning', 'error']).default('info'),
  debugMode: z.boolean().default(false),
});

// =============================================================================
// FILE MANAGEMENT SCHEMAS
// =============================================================================

/**
 * File upload validation schema
 */
export const FileUploadSchema = z.object({
  file: z.instanceof(File, 'Please select a file'),
  path: z.string().max(500).default('/'),
  overwrite: z.boolean().default(false),
  makePublic: z.boolean().default(false),
  generateThumbnail: z.boolean().default(false),
  extractMetadata: z.boolean().default(true),
}).refine(
  (data) => {
    // File size validation (configurable max size)
    const maxSize = 100 * 1024 * 1024; // 100MB default
    return data.file.size <= maxSize;
  },
  {
    message: 'File size exceeds maximum allowed size',
    path: ['file'],
  }
).refine(
  (data) => {
    // File type validation
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/json',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    return allowedTypes.includes(data.file.type);
  },
  {
    message: 'File type is not supported',
    path: ['file'],
  }
);

/**
 * File management operation validation schema
 */
export const FileOperationSchema = z.object({
  operation: z.enum(['copy', 'move', 'delete', 'rename']),
  sourcePath: z.string().min(1, 'Source path is required'),
  targetPath: z.string().optional(),
  recursive: z.boolean().default(false),
  force: z.boolean().default(false),
}).refine(
  (data) => {
    // Target path required for copy, move, rename operations
    if (['copy', 'move', 'rename'].includes(data.operation) && !data.targetPath) {
      return false;
    }
    return true;
  },
  {
    message: 'Target path is required for this operation',
    path: ['targetPath'],
  }
);

// =============================================================================
// SEARCH AND FILTERING SCHEMAS
// =============================================================================

/**
 * Generic search filter validation schema
 */
export const SearchFilterSchema = z.object({
  searchTerm: z.string().max(200).optional(),
  filters: z.array(z.object({
    field: z.string().min(1),
    operator: z.enum([
      'equals', 'notEquals', 'contains', 'notContains',
      'startsWith', 'endsWith', 'greaterThan', 'lessThan',
      'greaterThanOrEqual', 'lessThanOrEqual', 'between',
      'in', 'notIn', 'isEmpty', 'isNotEmpty', 'isNull', 'isNotNull'
    ]),
    value: z.any(),
  })).default([]),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(1000).default(25),
  includeCount: z.boolean().default(true),
});

/**
 * Advanced query builder validation schema
 */
export const QueryBuilderSchema = z.object({
  table: z.string().min(1, 'Table name is required'),
  select: z.array(z.string()).optional(),
  where: z.array(z.object({
    field: z.string().min(1),
    operator: z.string().min(1),
    value: z.any(),
    logic: z.enum(['AND', 'OR']).default('AND'),
  })).optional(),
  orderBy: z.array(z.object({
    field: z.string().min(1),
    direction: z.enum(['ASC', 'DESC']).default('ASC'),
  })).optional(),
  groupBy: z.array(z.string()).optional(),
  having: z.array(z.object({
    field: z.string().min(1),
    operator: z.string().min(1),
    value: z.any(),
  })).optional(),
  limit: z.number().int().min(1).max(10000).optional(),
  offset: z.number().int().min(0).optional(),
});

// =============================================================================
// UTILITY VALIDATION FUNCTIONS
// =============================================================================

/**
 * Custom validation for password confirmation
 */
export const createPasswordConfirmSchema = (passwordField: string = 'password') => {
  return z.object({
    [passwordField]: CommonValidation.password,
    confirmPassword: z.string(),
  }).refine(
    (data) => data[passwordField as keyof typeof data] === data.confirmPassword,
    {
      message: ErrorMessages.PASSWORDS_NO_MATCH,
      path: ['confirmPassword'],
    }
  );
};

/**
 * Dynamic field validation based on field type
 */
export const createFieldValidationSchema = (fieldType: string) => {
  const baseSchema = z.object({
    name: z.string().min(1, 'Field name is required'),
    required: z.boolean().default(false),
    defaultValue: z.any().optional(),
  });

  switch (fieldType) {
    case 'string':
      return baseSchema.extend({
        minLength: z.number().int().min(0).optional(),
        maxLength: z.number().int().min(1).optional(),
        pattern: z.string().optional(),
      });
    
    case 'number':
      return baseSchema.extend({
        min: z.number().optional(),
        max: z.number().optional(),
        step: z.number().positive().optional(),
      });
    
    case 'email':
      return baseSchema.extend({
        domain: z.string().optional(),
      });
    
    case 'select':
      return baseSchema.extend({
        options: z.array(z.object({
          label: z.string(),
          value: z.any(),
        })).min(1, 'At least one option is required'),
        multiple: z.boolean().default(false),
      });
    
    default:
      return baseSchema;
  }
};

/**
 * JSON validation with custom error messages
 */
export const validateJson = (value: string): boolean => {
  if (!value || value.trim() === '') return true;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Async validation for unique names (for use with React Hook Form)
 */
export const createUniqueNameValidator = (
  checkFunction: (name: string) => Promise<boolean>
) => {
  return z.string().refine(
    async (name) => !(await checkFunction(name)),
    'This name is already in use'
  );
};

/**
 * Performance-optimized validation for real-time input
 * Debounced validation to meet 100ms target
 */
export const createRealTimeValidator = <T extends z.ZodType>(
  schema: T,
  debounceMs: number = 100
) => {
  let timeoutId: NodeJS.Timeout;
  
  return (value: z.infer<T>): Promise<z.SafeParseReturnType<z.infer<T>, z.infer<T>>> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        resolve(schema.safeParse(value));
      }, debounceMs);
    });
  };
};

// =============================================================================
// SCHEMA EXPORTS FOR REACT HOOK FORM INTEGRATION
// =============================================================================

/**
 * Exported validation schemas for React Hook Form resolvers
 */
export const ValidationSchemas = {
  // Authentication & User Management
  login: LoginSchema,
  register: RegisterSchema,
  passwordChange: PasswordChangeSchema,
  passwordReset: PasswordResetSchema,
  userProfile: UserProfileSchema,
  roleAssignment: RoleAssignmentSchema,
  
  // Database Services
  databaseService: ServiceFormSchema,
  connectionTest: ConnectionTestSchema,
  
  // Schema Discovery & API Generation
  schemaField: SchemaFieldSchema,
  tableConfig: TableConfigSchema,
  apiEndpointConfig: ApiEndpointConfigSchema,
  openApiConfig: OpenApiConfigSchema,
  
  // System Configuration
  corsConfig: CorsConfigSchema,
  cacheConfig: CacheConfigSchema,
  emailTemplate: EmailTemplateSchema,
  systemSettings: SystemSettingsSchema,
  
  // File Management
  fileUpload: FileUploadSchema,
  fileOperation: FileOperationSchema,
  
  // Search & Filtering
  searchFilter: SearchFilterSchema,
  queryBuilder: QueryBuilderSchema,
} as const;

/**
 * Type inference helpers for React Hook Form
 */
export type LoginFormData = z.infer<typeof LoginSchema>;
export type RegisterFormData = z.infer<typeof RegisterSchema>;
export type PasswordChangeFormData = z.infer<typeof PasswordChangeSchema>;
export type UserProfileFormData = z.infer<typeof UserProfileSchema>;
export type DatabaseServiceFormData = z.infer<typeof ServiceFormSchema>;
export type ConnectionTestFormData = z.infer<typeof ConnectionTestSchema>;
export type SchemaFieldFormData = z.infer<typeof SchemaFieldSchema>;
export type TableConfigFormData = z.infer<typeof TableConfigSchema>;
export type ApiEndpointConfigFormData = z.infer<typeof ApiEndpointConfigSchema>;
export type OpenApiConfigFormData = z.infer<typeof OpenApiConfigSchema>;
export type CorsConfigFormData = z.infer<typeof CorsConfigSchema>;
export type CacheConfigFormData = z.infer<typeof CacheConfigSchema>;
export type EmailTemplateFormData = z.infer<typeof EmailTemplateSchema>;
export type SystemSettingsFormData = z.infer<typeof SystemSettingsSchema>;
export type FileUploadFormData = z.infer<typeof FileUploadSchema>;
export type FileOperationFormData = z.infer<typeof FileOperationSchema>;
export type SearchFilterFormData = z.infer<typeof SearchFilterSchema>;
export type QueryBuilderFormData = z.infer<typeof QueryBuilderSchema>;

/**
 * Default export for convenience
 */
export default ValidationSchemas;

/**
 * Performance metrics for validation operations
 * Target: Real-time validation under 100ms
 */
export const ValidationMetrics = {
  TARGET_VALIDATION_TIME: 100, // milliseconds
  DEBOUNCE_DELAY: 100, // milliseconds
  MAX_CONCURRENT_VALIDATIONS: 5,
  CACHE_TTL: 300000, // 5 minutes
} as const;