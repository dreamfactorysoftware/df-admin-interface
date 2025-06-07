/**
 * Comprehensive service-related entity definitions for DreamFactory Admin Interface
 * 
 * This module provides type definitions for service management, database connections,
 * and API generation workflows. Designed for React 19/Next.js 15.1+ integration
 * with support for React Hook Form validation and modern data fetching patterns.
 * 
 * @fileoverview Service type definitions maintaining full backend compatibility
 * @version 1.0.0
 */

import { z } from 'zod';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

// =============================================================================
// CORE SERVICE TYPES
// =============================================================================

/**
 * Supported service types in DreamFactory ecosystem
 * Maps to backend service_type endpoint configurations
 */
export type ServiceType = 
  | 'mysql'
  | 'postgresql' 
  | 'sql_server'
  | 'oracle'
  | 'mongodb'
  | 'snowflake'
  | 'sqlite'
  | 'cassandra'
  | 'redis'
  | 'elasticsearch'
  | 'http'
  | 'soap'
  | 'file'
  | 'email'
  | 'script'
  | 'oauth'
  | 'ldap'
  | 'saml';

/**
 * Service connection status for real-time UI updates
 * Used with SWR/React Query for connection state management
 */
export type ServiceStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';

/**
 * Service action types for endpoint generation
 * Maps to DreamFactory REST API verbs
 */
export type ServiceAction = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

// =============================================================================
// DATABASE SERVICE CONFIGURATION SCHEMAS
// =============================================================================

/**
 * Base database connection configuration
 * Extends for specific database types with Zod validation
 */
export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  options?: Record<string, unknown>;
  ssl_enabled?: boolean;
  ssl_config?: {
    ca?: string;
    cert?: string;
    key?: string;
    verify_server_cert?: boolean;
  };
}

/**
 * MySQL-specific connection configuration
 * Supports React Hook Form integration with type safety
 */
export interface MySQLConfig extends DatabaseConnectionConfig {
  charset?: string;
  collation?: string;
  strict_mode?: boolean;
  unix_socket?: string;
  engine?: 'InnoDB' | 'MyISAM';
}

/**
 * PostgreSQL-specific connection configuration
 * Enhanced for enterprise PostgreSQL deployments
 */
export interface PostgreSQLConfig extends DatabaseConnectionConfig {
  schema?: string;
  search_path?: string[];
  application_name?: string;
  connection_timeout?: number;
  statement_timeout?: number;
}

/**
 * MongoDB-specific connection configuration
 * Supports both standalone and replica set configurations
 */
export interface MongoDBConfig {
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
  auth_source?: string;
  replica_set?: string;
  connection_options?: Record<string, unknown>;
  ssl_enabled?: boolean;
}

/**
 * Snowflake-specific connection configuration
 * Enterprise data warehouse connection parameters
 */
export interface SnowflakeConfig {
  account: string;
  username: string;
  password: string;
  database?: string;
  schema?: string;
  warehouse?: string;
  role?: string;
  region?: string;
  authenticator?: 'snowflake' | 'oauth' | 'externalbrowser';
}

/**
 * Union type for all database configurations
 * Used in dynamic form components for type-safe configuration
 */
export type DatabaseConfig = 
  | MySQLConfig 
  | PostgreSQLConfig 
  | MongoDBConfig 
  | SnowflakeConfig 
  | DatabaseConnectionConfig;

// =============================================================================
// SERVICE ENTITY DEFINITIONS
// =============================================================================

/**
 * Core service entity matching DreamFactory backend structure
 * Maintains complete compatibility with /api/v2/system/service endpoints
 */
export interface Service {
  id: number;
  name: string;
  label: string;
  description?: string;
  type: ServiceType;
  is_active: boolean;
  mutable: boolean;
  deletable: boolean;
  created_date?: string;
  last_modified_date?: string;
  created_by_id?: number;
  last_modified_by_id?: number;
  config?: DatabaseConfig | Record<string, unknown>;
  
  // Service capabilities metadata
  base_url?: string;
  doc?: string;
  
  // Security and access control
  service_doc_by_service_id?: ServiceDocumentation[];
  role_service_access_by_service_id?: RoleServiceAccess[];
}

/**
 * Simplified service representation for table/listing components
 * Optimized for React virtualization with TanStack Virtual
 */
export interface ServiceRow {
  id: number;
  name: string;
  label: string;
  type: ServiceType;
  is_active: boolean;
  status: ServiceStatus;
  created_date?: string;
  last_test_date?: string;
  error_message?: string;
}

/**
 * Service creation/update payload
 * Used with React Hook Form for service configuration workflows
 */
export interface ServicePayload {
  name: string;
  label: string;
  description?: string;
  type: ServiceType;
  is_active: boolean;
  config: DatabaseConfig | Record<string, unknown>;
}

// =============================================================================
// SERVICE METADATA AND DOCUMENTATION
// =============================================================================

/**
 * Service documentation structure
 * Supports OpenAPI specification generation and API documentation
 */
export interface ServiceDocumentation {
  id: number;
  service_id: number;
  format: 'openapi' | 'swagger' | 'postman' | 'insomnia';
  content: string;
  content_type: string;
  created_date: string;
  last_modified_date: string;
}

/**
 * Role-based service access control
 * Integrates with Next.js middleware for RBAC enforcement
 */
export interface RoleServiceAccess {
  id: number;
  role_id: number;
  service_id: number;
  component?: string;
  verb_mask: number;
  requestor_type: 'API' | 'SCRIPT' | 'ADMIN';
  filters?: string;
  filter_op?: 'AND' | 'OR';
  created_date: string;
  last_modified_date: string;
}

// =============================================================================
// SCHEMA DISCOVERY TYPES
// =============================================================================

/**
 * Database schema structure for React Query caching
 * Supports hierarchical tree visualization with TanStack Virtual
 */
export interface DatabaseSchema {
  service_name: string;
  tables: TableMetadata[];
  views: ViewMetadata[];
  procedures: ProcedureMetadata[];
  functions: FunctionMetadata[];
  relationships: RelationshipMetadata[];
}

/**
 * Table metadata for schema discovery
 * Optimized for large schema datasets (1000+ tables)
 */
export interface TableMetadata {
  name: string;
  label?: string;
  plural?: string;
  description?: string;
  primary_key?: string[];
  foreign_keys?: ForeignKeyMetadata[];
  indexes?: IndexMetadata[];
  field: FieldMetadata[];
  access?: number;
  field_extras?: Record<string, unknown>;
  is_view?: boolean;
  is_virtual?: boolean;
  max_records?: number;
}

/**
 * Field metadata for table introspection
 * Supports React Hook Form dynamic field generation
 */
export interface FieldMetadata {
  name: string;
  label?: string;
  type: string;
  db_type?: string;
  length?: number;
  precision?: number;
  scale?: number;
  default?: unknown;
  required?: boolean;
  allow_null?: boolean;
  fixed_length?: boolean;
  supports_multibyte?: boolean;
  auto_increment?: boolean;
  is_primary_key?: boolean;
  is_foreign_key?: boolean;
  ref_table?: string;
  ref_fields?: string;
  ref_on_update?: string;
  ref_on_delete?: string;
  is_unique?: boolean;
  is_index?: boolean;
  validation?: FieldValidation[];
  extra?: Record<string, unknown>;
}

/**
 * Field validation rules for dynamic form generation
 * Integrates with Zod schemas for type-safe validation
 */
export interface FieldValidation {
  type: 'required' | 'email' | 'url' | 'regex' | 'min' | 'max' | 'length';
  value?: unknown;
  message?: string;
}

/**
 * Database relationship metadata
 * Supports automatic foreign key discovery and API relationship generation
 */
export interface RelationshipMetadata {
  type: 'belongs_to' | 'has_one' | 'has_many' | 'many_to_many';
  table: string;
  field: string;
  ref_table: string;
  ref_field: string;
  ref_on_update?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  ref_on_delete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

/**
 * Foreign key metadata for relationship discovery
 */
export interface ForeignKeyMetadata {
  name: string;
  column: string;
  ref_table: string;
  ref_column: string;
  on_update?: string;
  on_delete?: string;
}

/**
 * Database index metadata
 */
export interface IndexMetadata {
  name: string;
  columns: string[];
  unique: boolean;
  primary: boolean;
}

/**
 * Database view metadata
 */
export interface ViewMetadata {
  name: string;
  definition: string;
  columns: FieldMetadata[];
}

/**
 * Stored procedure metadata
 */
export interface ProcedureMetadata {
  name: string;
  parameters: ProcedureParameter[];
  return_type?: string;
}

/**
 * Stored function metadata
 */
export interface FunctionMetadata {
  name: string;
  parameters: ProcedureParameter[];
  return_type: string;
}

/**
 * Procedure/function parameter definition
 */
export interface ProcedureParameter {
  name: string;
  type: string;
  direction: 'IN' | 'OUT' | 'INOUT';
  default?: unknown;
}

// =============================================================================
// API GENERATION TYPES
// =============================================================================

/**
 * API endpoint configuration for generation workflow
 * Supports React Hook Form step-by-step wizard implementation
 */
export interface EndpointConfiguration {
  table_name: string;
  resource_path?: string;
  methods: ServiceAction[];
  parameters: EndpointParameter[];
  security_rules: SecurityRule[];
  cache_enabled?: boolean;
  cache_ttl?: number;
  rate_limit?: RateLimit;
  custom_headers?: Record<string, string>;
}

/**
 * Endpoint parameter configuration
 * Used in dynamic form generation with React Hook Form
 */
export interface EndpointParameter {
  name: string;
  type: 'query' | 'path' | 'header' | 'body';
  data_type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: unknown;
  description?: string;
  validation?: FieldValidation[];
}

/**
 * Security rule configuration for generated APIs
 * Integrates with Next.js middleware for runtime enforcement
 */
export interface SecurityRule {
  id?: number;
  role_id?: number;
  service_id?: number;
  table?: string;
  request_type: 'API' | 'SCRIPT' | 'ADMIN';
  verb_mask: number;
  filters?: string;
  filter_op?: 'AND' | 'OR';
  allow_on_exists?: boolean;
  allow_on_missing?: boolean;
}

/**
 * Rate limiting configuration
 */
export interface RateLimit {
  max_requests: number;
  time_window: number; // seconds
  per_user?: boolean;
  per_service?: boolean;
}

/**
 * OpenAPI specification generation result
 * Used with @swagger-ui/react for documentation preview
 */
export interface OpenAPISpecification {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, Record<string, unknown>>;
  components?: {
    schemas?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
  security?: Array<Record<string, string[]>>;
}

// =============================================================================
// REACT COMPONENT INTEGRATION TYPES
// =============================================================================

/**
 * Service form hook return type
 * Provides React Hook Form integration with type safety
 */
export interface ServiceFormHook<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  isSubmitting: boolean;
  submitForm: (data: T) => Promise<void>;
  testConnection: () => Promise<boolean>;
  connectionStatus: ServiceStatus;
  errors: Record<string, string>;
}

/**
 * Service list hook return type
 * Integrates with SWR/React Query for data fetching
 */
export interface ServiceListHook {
  services: ServiceRow[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  deleteService: (id: number) => Promise<void>;
  toggleService: (id: number, isActive: boolean) => Promise<void>;
}

/**
 * Schema discovery hook return type
 * Supports TanStack Virtual for large dataset rendering
 */
export interface SchemaDiscoveryHook {
  schema: DatabaseSchema | null;
  isLoading: boolean;
  error: Error | null;
  selectedTable: TableMetadata | null;
  setSelectedTable: (table: TableMetadata | null) => void;
  searchTables: (query: string) => TableMetadata[];
  expandedTables: Set<string>;
  toggleTableExpansion: (tableName: string) => void;
}

/**
 * API generation workflow hook return type
 * Manages multi-step wizard state with React Hook Form
 */
export interface APIGenerationHook {
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  canProceed: boolean;
  configuration: Partial<EndpointConfiguration>;
  updateConfiguration: (updates: Partial<EndpointConfiguration>) => void;
  generateAPI: () => Promise<OpenAPISpecification>;
  previewAPI: () => Promise<OpenAPISpecification>;
  isGenerating: boolean;
  errors: Record<string, string>;
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod schema for database connection validation
 * Integrates with React Hook Form for real-time validation
 */
export const DatabaseConnectionSchema = z.object({
  host: z.string().min(1, 'Host is required').max(255, 'Host too long'),
  port: z.number().int().min(1, 'Port must be positive').max(65535, 'Invalid port'),
  database: z.string().min(1, 'Database name is required').max(64, 'Database name too long'),
  username: z.string().min(1, 'Username is required').max(64, 'Username too long'),
  password: z.string().min(1, 'Password is required'),
  ssl_enabled: z.boolean().optional(),
});

/**
 * Zod schema for service payload validation
 * Ensures type safety for service creation/update operations
 */
export const ServicePayloadSchema = z.object({
  name: z.string()
    .min(1, 'Service name is required')
    .max(64, 'Service name too long')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Invalid service name format'),
  label: z.string().min(1, 'Service label is required').max(255, 'Label too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  type: z.enum([
    'mysql', 'postgresql', 'sql_server', 'oracle', 'mongodb', 'snowflake',
    'sqlite', 'cassandra', 'redis', 'elasticsearch', 'http', 'soap',
    'file', 'email', 'script', 'oauth', 'ldap', 'saml'
  ]),
  is_active: z.boolean(),
  config: z.record(z.unknown()),
});

/**
 * Zod schema for endpoint configuration validation
 * Supports dynamic validation for API generation workflow
 */
export const EndpointConfigurationSchema = z.object({
  table_name: z.string().min(1, 'Table name is required'),
  resource_path: z.string().optional(),
  methods: z.array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])).min(1),
  parameters: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(['query', 'path', 'header', 'body']),
    data_type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
    required: z.boolean(),
    default: z.unknown().optional(),
    description: z.string().optional(),
  })).optional(),
  cache_enabled: z.boolean().optional(),
  cache_ttl: z.number().int().min(0).optional(),
});

// =============================================================================
// UTILITY TYPES AND HELPERS
// =============================================================================

/**
 * Type guard for database configurations
 * Enables type-safe configuration handling in React components
 */
export function isDatabaseConfig(config: unknown): config is DatabaseConfig {
  return typeof config === 'object' && 
         config !== null && 
         'host' in config && 
         'port' in config;
}

/**
 * Type guard for MySQL configuration
 */
export function isMySQLConfig(config: DatabaseConfig): config is MySQLConfig {
  return 'charset' in config || 'collation' in config || 'strict_mode' in config;
}

/**
 * Type guard for PostgreSQL configuration
 */
export function isPostgreSQLConfig(config: DatabaseConfig): config is PostgreSQLConfig {
  return 'schema' in config || 'search_path' in config || 'application_name' in config;
}

/**
 * Type guard for MongoDB configuration
 */
export function isMongoDBConfig(config: unknown): config is MongoDBConfig {
  return typeof config === 'object' && 
         config !== null && 
         'host' in config &&
         (!('username' in config) || typeof (config as any).username === 'string');
}

/**
 * Default configuration factory for service types
 * Provides sensible defaults for React Hook Form initialization
 */
export function getDefaultConfig(serviceType: ServiceType): Partial<DatabaseConfig> {
  switch (serviceType) {
    case 'mysql':
      return {
        port: 3306,
        charset: 'utf8mb4',
        collation: 'utf8mb4_unicode_ci',
      } as Partial<MySQLConfig>;
    
    case 'postgresql':
      return {
        port: 5432,
        schema: 'public',
      } as Partial<PostgreSQLConfig>;
    
    case 'mongodb':
      return {
        port: 27017,
      } as Partial<MongoDBConfig>;
    
    case 'sql_server':
      return {
        port: 1433,
      } as Partial<DatabaseConnectionConfig>;
    
    case 'oracle':
      return {
        port: 1521,
      } as Partial<DatabaseConnectionConfig>;
    
    default:
      return {};
  }
}

/**
 * Service status color mapping for UI components
 * Provides consistent visual feedback using Tailwind CSS classes
 */
export const ServiceStatusColors = {
  idle: 'text-gray-500 bg-gray-100',
  connecting: 'text-blue-600 bg-blue-100 animate-pulse',
  connected: 'text-green-600 bg-green-100',
  error: 'text-red-600 bg-red-100',
  disconnected: 'text-gray-500 bg-gray-100',
} as const;

/**
 * Service type display metadata
 * Provides human-readable labels and icons for service types
 */
export const ServiceTypeMetadata = {
  mysql: { label: 'MySQL', icon: '🐬', category: 'SQL Database' },
  postgresql: { label: 'PostgreSQL', icon: '🐘', category: 'SQL Database' },
  sql_server: { label: 'SQL Server', icon: '🏢', category: 'SQL Database' },
  oracle: { label: 'Oracle', icon: '🔶', category: 'SQL Database' },
  mongodb: { label: 'MongoDB', icon: '🍃', category: 'NoSQL Database' },
  snowflake: { label: 'Snowflake', icon: '❄️', category: 'Data Warehouse' },
  sqlite: { label: 'SQLite', icon: '📦', category: 'SQL Database' },
  cassandra: { label: 'Cassandra', icon: '🏛️', category: 'NoSQL Database' },
  redis: { label: 'Redis', icon: '🔴', category: 'Cache/NoSQL' },
  elasticsearch: { label: 'Elasticsearch', icon: '🔍', category: 'Search Engine' },
  http: { label: 'HTTP Service', icon: '🌐', category: 'Web Service' },
  soap: { label: 'SOAP Service', icon: '🧼', category: 'Web Service' },
  file: { label: 'File Service', icon: '📁', category: 'Storage' },
  email: { label: 'Email Service', icon: '📧', category: 'Communication' },
  script: { label: 'Script Service', icon: '📜', category: 'Custom Logic' },
  oauth: { label: 'OAuth Provider', icon: '🔐', category: 'Authentication' },
  ldap: { label: 'LDAP Directory', icon: '📂', category: 'Authentication' },
  saml: { label: 'SAML Provider', icon: '🎫', category: 'Authentication' },
} as const;

/**
 * Export all types for convenient importing
 */
export type {
  // Core types
  ServiceType,
  ServiceStatus,
  ServiceAction,
  
  // Configuration types
  DatabaseConfig,
  MySQLConfig,
  PostgreSQLConfig,
  MongoDBConfig,
  SnowflakeConfig,
  
  // Entity types
  Service,
  ServiceRow,
  ServicePayload,
  ServiceDocumentation,
  RoleServiceAccess,
  
  // Schema types
  DatabaseSchema,
  TableMetadata,
  FieldMetadata,
  FieldValidation,
  RelationshipMetadata,
  ForeignKeyMetadata,
  IndexMetadata,
  ViewMetadata,
  ProcedureMetadata,
  FunctionMetadata,
  ProcedureParameter,
  
  // API generation types
  EndpointConfiguration,
  EndpointParameter,
  SecurityRule,
  RateLimit,
  OpenAPISpecification,
  
  // React integration types
  ServiceFormHook,
  ServiceListHook,
  SchemaDiscoveryHook,
  APIGenerationHook,
};