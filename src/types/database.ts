import { z } from 'zod';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import type { SWRConfiguration } from 'swr';

// =============================================================================
// DATABASE CONNECTOR TYPES
// =============================================================================

/**
 * Supported database types in DreamFactory
 * Based on technical specification section 3.5.1
 */
export type DatabaseType = 
  | 'mysql'
  | 'postgresql' 
  | 'oracle'
  | 'mongodb'
  | 'snowflake';

/**
 * Database group classification for service management
 */
export type DatabaseGroup = 'Database' | 'NoSQL' | 'Cloud Data Warehouse';

/**
 * Database driver specifications for each supported type
 */
export interface DatabaseDriver {
  name: string;
  label: string;
  description: string;
  group: DatabaseGroup;
  versions: string[];
  connector: string;
  features: string[];
  icon?: string;
  configSchema: DatabaseConfigSchema[];
}

// =============================================================================
// CONNECTION CONFIGURATION TYPES
// =============================================================================

/**
 * Base connection configuration shared across all database types
 * Compatible with React Hook Form and Zod validation
 */
export interface BaseDatabaseConfig {
  /** Database service name - must be unique */
  name: string;
  /** Human-readable label */
  label: string;
  /** Optional description */
  description?: string;
  /** Database type identifier */
  type: DatabaseType;
  /** Connection host or URL */
  host: string;
  /** Database port number */
  port: number;
  /** Database name/schema */
  database: string;
  /** Connection username */
  username: string;
  /** Connection password */
  password: string;
  /** Service active status */
  isActive: boolean;
  /** SSL configuration */
  ssl?: SSLConfig;
  /** Connection pooling settings */
  pooling?: PoolingConfig;
  /** Additional driver-specific options */
  options?: Record<string, any>;
  /** Connection timeout in milliseconds (default: 5000) */
  connectionTimeout?: number;
  /** Query timeout in milliseconds */
  queryTimeout?: number;
}

/**
 * MySQL-specific configuration extending base config
 */
export interface MySQLConfig extends BaseDatabaseConfig {
  type: 'mysql';
  /** MySQL charset (default: utf8mb4) */
  charset?: string;
  /** MySQL timezone setting */
  timezone?: string;
  /** Enable strict mode */
  strictMode?: boolean;
  /** Connection flags */
  flags?: string[];
}

/**
 * PostgreSQL-specific configuration
 */
export interface PostgreSQLConfig extends BaseDatabaseConfig {
  type: 'postgresql';
  /** PostgreSQL schema search path */
  searchPath?: string[];
  /** Application name for connection tracking */
  applicationName?: string;
  /** Statement timeout in milliseconds */
  statementTimeout?: number;
  /** Enable SSL certificate verification */
  sslVerification?: boolean;
}

/**
 * Oracle-specific configuration
 */
export interface OracleConfig extends BaseDatabaseConfig {
  type: 'oracle';
  /** Oracle service name or SID */
  serviceName?: string;
  /** TNS connection string */
  tnsConnectString?: string;
  /** Oracle edition (Standard, Express, Enterprise) */
  edition?: 'standard' | 'express' | 'enterprise';
  /** Enable Oracle wallet */
  enableWallet?: boolean;
  /** Wallet location */
  walletLocation?: string;
}

/**
 * MongoDB-specific configuration
 */
export interface MongoDBConfig extends Omit<BaseDatabaseConfig, 'database'> {
  type: 'mongodb';
  /** MongoDB connection URI */
  uri?: string;
  /** Default database name */
  defaultDatabase?: string;
  /** Authentication database */
  authDatabase?: string;
  /** Replica set name */
  replicaSet?: string;
  /** Read preference */
  readPreference?: 'primary' | 'primaryPreferred' | 'secondary' | 'secondaryPreferred' | 'nearest';
  /** Write concern */
  writeConcern?: {
    w?: number | string;
    j?: boolean;
    wtimeout?: number;
  };
}

/**
 * Snowflake-specific configuration
 */
export interface SnowflakeConfig extends BaseDatabaseConfig {
  type: 'snowflake';
  /** Snowflake account identifier */
  account: string;
  /** Snowflake warehouse */
  warehouse?: string;
  /** Snowflake role */
  role?: string;
  /** Session parameters */
  sessionParameters?: Record<string, string>;
  /** Private key for key-pair authentication */
  privateKey?: string;
  /** Private key passphrase */
  privateKeyPassphrase?: string;
}

/**
 * Union type for all database configurations
 */
export type DatabaseConfig = 
  | MySQLConfig 
  | PostgreSQLConfig 
  | OracleConfig 
  | MongoDBConfig 
  | SnowflakeConfig;

// =============================================================================
// SSL CONFIGURATION TYPES
// =============================================================================

/**
 * SSL configuration options for secure database connections
 */
export interface SSLConfig {
  /** Enable SSL/TLS encryption */
  enabled: boolean;
  /** SSL mode */
  mode?: 'require' | 'prefer' | 'allow' | 'disable' | 'verify-ca' | 'verify-full';
  /** SSL certificate file path or content */
  cert?: string;
  /** SSL private key file path or content */
  key?: string;
  /** SSL certificate authority file path or content */
  ca?: string;
  /** Reject unauthorized connections */
  rejectUnauthorized?: boolean;
  /** Server name for certificate verification */
  serverName?: string;
  /** SSL cipher suite */
  ciphers?: string;
  /** Minimum SSL/TLS version */
  minVersion?: string;
  /** Maximum SSL/TLS version */
  maxVersion?: string;
}

// =============================================================================
// CONNECTION POOLING TYPES
// =============================================================================

/**
 * Connection pooling configuration for optimal performance
 */
export interface PoolingConfig {
  /** Enable connection pooling */
  enabled: boolean;
  /** Minimum number of connections in pool */
  min?: number;
  /** Maximum number of connections in pool */
  max?: number;
  /** Connection idle timeout in milliseconds */
  idleTimeoutMillis?: number;
  /** Maximum time to wait for connection in milliseconds */
  acquireTimeoutMillis?: number;
  /** How often to run eviction check in milliseconds */
  evictionRunIntervalMillis?: number;
  /** Minimum idle time before connection eviction */
  softIdleTimeoutMillis?: number;
  /** Test connections before use */
  testOnBorrow?: boolean;
  /** Test connections when returning to pool */
  testOnReturn?: boolean;
  /** Test idle connections periodically */
  testWhileIdle?: boolean;
  /** Validation query for testing connections */
  validationQuery?: string;
}

// =============================================================================
// SCHEMA DISCOVERY TYPES
// =============================================================================

/**
 * Database schema metadata structure
 * Optimized for React Query caching and virtual scrolling
 */
export interface DatabaseSchema {
  /** Schema name/identifier */
  name: string;
  /** Schema display label */
  label?: string;
  /** Schema description */
  description?: string;
  /** Number of tables in schema */
  tableCount: number;
  /** Schema last modified timestamp */
  lastModified?: string;
  /** Schema access permissions */
  permissions?: SchemaPermissions;
  /** Tables within this schema */
  tables?: DatabaseTable[];
  /** Whether schema is system/internal */
  isSystem?: boolean;
  /** Schema size in bytes */
  sizeBytes?: number;
}

/**
 * Database table metadata
 * Supports virtual scrolling for large datasets (1000+ tables)
 */
export interface DatabaseTable {
  /** Table name */
  name: string;
  /** Table display label */
  label?: string;
  /** Table description/comment */
  description?: string;
  /** Table type (table, view, materialized_view) */
  type: 'table' | 'view' | 'materialized_view';
  /** Number of rows (approximate) */
  rowCount?: number;
  /** Number of fields/columns */
  fieldCount: number;
  /** Table schema name */
  schema?: string;
  /** Table fields/columns */
  fields?: DatabaseField[];
  /** Table relationships */
  relationships?: TableRelationship[];
  /** Table indexes */
  indexes?: TableIndex[];
  /** Table constraints */
  constraints?: TableConstraint[];
  /** Whether table is system/internal */
  isSystem?: boolean;
  /** Table size in bytes */
  sizeBytes?: number;
  /** Table last modified timestamp */
  lastModified?: string;
  /** Access permissions for this table */
  permissions?: TablePermissions;
}

/**
 * Database field/column metadata
 */
export interface DatabaseField {
  /** Field name */
  name: string;
  /** Field display label */
  label?: string;
  /** Field description/comment */
  description?: string;
  /** Field data type */
  type: string;
  /** Database-native type */
  dbType?: string;
  /** Field length/size */
  length?: number;
  /** Numeric precision */
  precision?: number;
  /** Numeric scale */
  scale?: number;
  /** Default value */
  defaultValue?: any;
  /** Whether field is required/not null */
  required: boolean;
  /** Whether field allows null values */
  allowNull: boolean;
  /** Whether field is primary key */
  isPrimaryKey: boolean;
  /** Whether field is unique */
  isUnique: boolean;
  /** Whether field is foreign key */
  isForeignKey: boolean;
  /** Whether field is auto-increment */
  autoIncrement: boolean;
  /** Whether field is indexed */
  isIndexed: boolean;
  /** Whether field is virtual/computed */
  isVirtual: boolean;
  /** Foreign key reference table */
  refTable?: string;
  /** Foreign key reference field */
  refField?: string;
  /** Foreign key update action */
  refOnUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  /** Foreign key delete action */
  refOnDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  /** Field validation rules */
  validation?: FieldValidation[];
  /** Field access permissions */
  permissions?: FieldPermissions;
}

/**
 * Table relationship metadata
 */
export interface TableRelationship {
  /** Relationship name/alias */
  name: string;
  /** Relationship type */
  type: 'belongs_to' | 'has_many' | 'has_one' | 'many_many';
  /** Local field name */
  field: string;
  /** Referenced service ID */
  refServiceId?: number;
  /** Referenced table name */
  refTable: string;
  /** Referenced field name */
  refField: string;
  /** Junction table for many-to-many */
  junctionTable?: string;
  /** Junction local field */
  junctionField?: string;
  /** Junction reference field */
  junctionRefField?: string;
  /** Whether to always fetch related data */
  alwaysFetch: boolean;
  /** Whether to flatten relationship data */
  flatten: boolean;
  /** Whether relationship is virtual */
  isVirtual: boolean;
}

/**
 * Table index metadata
 */
export interface TableIndex {
  /** Index name */
  name: string;
  /** Index type (btree, hash, etc.) */
  type?: string;
  /** Index columns */
  columns: string[];
  /** Whether index is unique */
  isUnique: boolean;
  /** Whether index is primary */
  isPrimary: boolean;
  /** Index creation statement */
  definition?: string;
}

/**
 * Table constraint metadata
 */
export interface TableConstraint {
  /** Constraint name */
  name: string;
  /** Constraint type */
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK' | 'NOT NULL';
  /** Constraint columns */
  columns: string[];
  /** Referenced table (for foreign keys) */
  refTable?: string;
  /** Referenced columns (for foreign keys) */
  refColumns?: string[];
  /** Constraint definition */
  definition?: string;
}

// =============================================================================
// PERMISSION TYPES
// =============================================================================

/**
 * Schema-level permissions
 */
export interface SchemaPermissions {
  /** Can read schema metadata */
  read: boolean;
  /** Can create new tables */
  create: boolean;
  /** Can modify schema structure */
  alter: boolean;
  /** Can drop schema */
  drop: boolean;
}

/**
 * Table-level permissions
 */
export interface TablePermissions {
  /** Can read table data */
  read: boolean;
  /** Can insert new records */
  create: boolean;
  /** Can update existing records */
  update: boolean;
  /** Can delete records */
  delete: boolean;
  /** Can modify table structure */
  alter: boolean;
  /** Can drop table */
  drop: boolean;
}

/**
 * Field-level permissions
 */
export interface FieldPermissions {
  /** Can read field data */
  read: boolean;
  /** Can insert field data */
  create: boolean;
  /** Can update field data */
  update: boolean;
}

/**
 * Field validation rule
 */
export interface FieldValidation {
  /** Validation type */
  type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'url' | 'custom';
  /** Validation value/parameter */
  value?: any;
  /** Custom validation message */
  message?: string;
}

// =============================================================================
// CONNECTION TESTING TYPES
// =============================================================================

/**
 * Database connection test request
 * Designed for React Query mutations with concurrent features
 */
export interface ConnectionTestRequest {
  /** Database configuration to test */
  config: Partial<DatabaseConfig>;
  /** Test timeout in milliseconds (max 5000) */
  timeout?: number;
  /** Whether to test schema access */
  testSchema?: boolean;
  /** Whether to test write permissions */
  testWrite?: boolean;
}

/**
 * Database connection test result
 * Optimized for SWR caching behavior
 */
export interface ConnectionTestResult {
  /** Whether connection test passed */
  success: boolean;
  /** Test execution time in milliseconds */
  duration: number;
  /** Test timestamp */
  timestamp: string;
  /** Connection status message */
  message: string;
  /** Database server version */
  serverVersion?: string;
  /** Available schemas/databases */
  availableSchemas?: string[];
  /** Connection capabilities */
  capabilities?: ConnectionCapabilities;
  /** Error details if test failed */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Database connection capabilities
 */
export interface ConnectionCapabilities {
  /** Supports transactions */
  transactions: boolean;
  /** Supports foreign keys */
  foreignKeys: boolean;
  /** Supports stored procedures */
  storedProcedures: boolean;
  /** Supports views */
  views: boolean;
  /** Supports full-text search */
  fullTextSearch: boolean;
  /** Supports JSON data type */
  jsonSupport: boolean;
  /** Maximum connections */
  maxConnections?: number;
  /** Supported character sets */
  charsets?: string[];
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod schema for SSL configuration validation
 */
export const SSLConfigSchema = z.object({
  enabled: z.boolean(),
  mode: z.enum(['require', 'prefer', 'allow', 'disable', 'verify-ca', 'verify-full']).optional(),
  cert: z.string().optional(),
  key: z.string().optional(),
  ca: z.string().optional(),
  rejectUnauthorized: z.boolean().optional(),
  serverName: z.string().optional(),
  ciphers: z.string().optional(),
  minVersion: z.string().optional(),
  maxVersion: z.string().optional(),
}).strict();

/**
 * Zod schema for connection pooling validation
 */
export const PoolingConfigSchema = z.object({
  enabled: z.boolean(),
  min: z.number().min(0).max(100).optional(),
  max: z.number().min(1).max(1000).optional(),
  idleTimeoutMillis: z.number().min(1000).max(300000).optional(),
  acquireTimeoutMillis: z.number().min(1000).max(60000).optional(),
  evictionRunIntervalMillis: z.number().min(1000).max(300000).optional(),
  softIdleTimeoutMillis: z.number().min(1000).max(300000).optional(),
  testOnBorrow: z.boolean().optional(),
  testOnReturn: z.boolean().optional(),
  testWhileIdle: z.boolean().optional(),
  validationQuery: z.string().optional(),
}).strict();

/**
 * Base database configuration schema
 */
export const BaseDatabaseConfigSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, 'Name must start with letter and contain only letters, numbers, underscores, and hyphens'),
  label: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  host: z.string().min(1).max(255),
  port: z.number().min(1).max(65535),
  database: z.string().min(1).max(255),
  username: z.string().min(1).max(255),
  password: z.string().min(1),
  isActive: z.boolean(),
  ssl: SSLConfigSchema.optional(),
  pooling: PoolingConfigSchema.optional(),
  options: z.record(z.any()).optional(),
  connectionTimeout: z.number().min(1000).max(30000).default(5000),
  queryTimeout: z.number().min(1000).max(300000).optional(),
}).strict();

/**
 * MySQL configuration validation schema
 */
export const MySQLConfigSchema = BaseDatabaseConfigSchema.extend({
  type: z.literal('mysql'),
  charset: z.string().default('utf8mb4').optional(),
  timezone: z.string().optional(),
  strictMode: z.boolean().optional(),
  flags: z.array(z.string()).optional(),
}).strict();

/**
 * PostgreSQL configuration validation schema
 */
export const PostgreSQLConfigSchema = BaseDatabaseConfigSchema.extend({
  type: z.literal('postgresql'),
  searchPath: z.array(z.string()).optional(),
  applicationName: z.string().max(64).optional(),
  statementTimeout: z.number().min(0).max(3600000).optional(),
  sslVerification: z.boolean().optional(),
}).strict();

/**
 * Oracle configuration validation schema
 */
export const OracleConfigSchema = BaseDatabaseConfigSchema.extend({
  type: z.literal('oracle'),
  serviceName: z.string().optional(),
  tnsConnectString: z.string().optional(),
  edition: z.enum(['standard', 'express', 'enterprise']).optional(),
  enableWallet: z.boolean().optional(),
  walletLocation: z.string().optional(),
}).strict();

/**
 * MongoDB configuration validation schema
 */
export const MongoDBConfigSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/),
  label: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  type: z.literal('mongodb'),
  host: z.string().min(1).max(255),
  port: z.number().min(1).max(65535).default(27017),
  username: z.string().optional(),
  password: z.string().optional(),
  isActive: z.boolean(),
  uri: z.string().optional(),
  defaultDatabase: z.string().optional(),
  authDatabase: z.string().optional(),
  replicaSet: z.string().optional(),
  readPreference: z.enum(['primary', 'primaryPreferred', 'secondary', 'secondaryPreferred', 'nearest']).optional(),
  writeConcern: z.object({
    w: z.union([z.number(), z.string()]).optional(),
    j: z.boolean().optional(),
    wtimeout: z.number().optional(),
  }).optional(),
  ssl: SSLConfigSchema.optional(),
  pooling: PoolingConfigSchema.optional(),
  options: z.record(z.any()).optional(),
  connectionTimeout: z.number().min(1000).max(30000).default(5000),
  queryTimeout: z.number().min(1000).max(300000).optional(),
}).strict();

/**
 * Snowflake configuration validation schema
 */
export const SnowflakeConfigSchema = BaseDatabaseConfigSchema.extend({
  type: z.literal('snowflake'),
  account: z.string().min(1).max(255),
  warehouse: z.string().optional(),
  role: z.string().optional(),
  sessionParameters: z.record(z.string()).optional(),
  privateKey: z.string().optional(),
  privateKeyPassphrase: z.string().optional(),
}).strict();

/**
 * Union schema for all database configurations
 */
export const DatabaseConfigSchema = z.discriminatedUnion('type', [
  MySQLConfigSchema,
  PostgreSQLConfigSchema,
  OracleConfigSchema,
  MongoDBConfigSchema,
  SnowflakeConfigSchema,
]);

/**
 * Connection test request validation schema
 */
export const ConnectionTestRequestSchema = z.object({
  config: DatabaseConfigSchema.partial(),
  timeout: z.number().min(1000).max(5000).default(5000),
  testSchema: z.boolean().default(true),
  testWrite: z.boolean().default(false),
}).strict();

// =============================================================================
// REACT QUERY INTEGRATION TYPES
// =============================================================================

/**
 * Database service query key factory for React Query
 */
export const databaseQueryKeys = {
  all: ['database'] as const,
  services: () => [...databaseQueryKeys.all, 'services'] as const,
  service: (id: string) => [...databaseQueryKeys.services(), id] as const,
  schemas: (serviceId: string) => [...databaseQueryKeys.service(serviceId), 'schemas'] as const,
  schema: (serviceId: string, schemaName: string) => [...databaseQueryKeys.schemas(serviceId), schemaName] as const,
  tables: (serviceId: string, schemaName?: string) => [...databaseQueryKeys.schemas(serviceId), schemaName ?? 'default', 'tables'] as const,
  table: (serviceId: string, tableName: string, schemaName?: string) => [...databaseQueryKeys.tables(serviceId, schemaName), tableName] as const,
  fields: (serviceId: string, tableName: string, schemaName?: string) => [...databaseQueryKeys.table(serviceId, tableName, schemaName), 'fields'] as const,
  connectionTest: (config: Partial<DatabaseConfig>) => [...databaseQueryKeys.all, 'test', config] as const,
};

/**
 * React Query options for database services
 * Optimized for SWR caching behavior with cache hit responses under 50ms
 */
export interface DatabaseServiceQueryOptions<T = unknown> extends UseQueryOptions<T> {
  /** Cache time in milliseconds (default: 5 minutes) */
  cacheTime?: number;
  /** Stale time in milliseconds (default: 1 minute) */
  staleTime?: number;
  /** Refetch on window focus */
  refetchOnWindowFocus?: boolean;
  /** Background refetch interval */
  refetchInterval?: number;
}

/**
 * React Query mutation options for database operations
 */
export interface DatabaseMutationOptions<T = unknown, V = unknown> extends UseMutationOptions<T, Error, V> {
  /** Optimistic update function */
  onMutate?: (variables: V) => Promise<any> | any;
  /** Success callback with cache invalidation */
  onSuccess?: (data: T, variables: V, context: any) => Promise<unknown> | unknown;
  /** Error callback with rollback */
  onError?: (error: Error, variables: V, context: any) => Promise<unknown> | unknown;
}

/**
 * SWR configuration for database operations
 * Designed for optimal caching behavior with sub-5-second connection validation
 */
export interface DatabaseSWRConfig extends SWRConfiguration {
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Revalidate on focus */
  revalidateOnFocus?: boolean;
  /** Revalidate on reconnect */
  revalidateOnReconnect?: boolean;
  /** Dedupe interval in milliseconds */
  dedupingInterval?: number;
  /** Error retry count */
  errorRetryCount?: number;
  /** Error retry interval */
  errorRetryInterval?: number;
}

// =============================================================================
// PERFORMANCE OPTIMIZATION TYPES
// =============================================================================

/**
 * Virtual scrolling configuration for large schemas (1000+ tables)
 * Compatible with TanStack Virtual
 */
export interface VirtualScrollConfig {
  /** Estimated item height in pixels */
  estimateHeight: number;
  /** Overscan count for smoother scrolling */
  overscan: number;
  /** Enable dynamic height calculation */
  dynamicHeight: boolean;
  /** Scroll margin for boundary detection */
  scrollMargin: number;
  /** Initial scroll offset */
  initialOffset?: number;
  /** Scroll behavior (smooth, auto) */
  scrollBehavior?: 'smooth' | 'auto';
}

/**
 * Progressive loading configuration for schema discovery
 */
export interface ProgressiveLoadingConfig {
  /** Page size for progressive loading */
  pageSize: number;
  /** Prefetch next page threshold */
  prefetchThreshold: number;
  /** Enable background prefetching */
  backgroundPrefetch: boolean;
  /** Maximum cached pages */
  maxCachedPages: number;
  /** Cache invalidation strategy */
  cacheStrategy: 'time-based' | 'usage-based' | 'hybrid';
}

/**
 * Schema discovery pagination for large datasets
 */
export interface SchemaPagination {
  /** Current page number */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total item count */
  total: number;
  /** Whether there are more pages */
  hasMore: boolean;
  /** Next page cursor (for cursor-based pagination) */
  cursor?: string;
}

// =============================================================================
// CONFIGURATION SCHEMA TYPES
// =============================================================================

/**
 * Database configuration schema definition
 * Used for dynamic form generation with React Hook Form
 */
export interface DatabaseConfigSchema {
  /** Field name */
  name: string;
  /** Field label */
  label: string;
  /** Field type for form rendering */
  type: 'string' | 'text' | 'integer' | 'password' | 'boolean' | 'picklist' | 'object';
  /** Field description */
  description?: string;
  /** Field alias for API mapping */
  alias: string;
  /** Default value */
  default?: any;
  /** Whether field is required */
  required?: boolean;
  /** Whether field allows null */
  allowNull?: boolean;
  /** Field validation rules */
  validation?: any;
  /** Picklist values for select fields */
  values?: any[];
  /** Field grouping for form organization */
  group?: string;
  /** Field display order */
  order?: number;
  /** Field conditional display logic */
  conditional?: {
    field: string;
    value: any;
    operator: 'equals' | 'not_equals' | 'in' | 'not_in';
  };
}

// =============================================================================
// SERVICE MANAGEMENT TYPES
// =============================================================================

/**
 * Database service definition
 * Compatible with DreamFactory service management API
 */
export interface DatabaseService {
  /** Service ID */
  id?: number;
  /** Service name (unique identifier) */
  name: string;
  /** Service display label */
  label: string;
  /** Service description */
  description?: string;
  /** Service type (database connector) */
  type: DatabaseType;
  /** Service active status */
  isActive: boolean;
  /** Service configuration */
  config: DatabaseConfig;
  /** Service creation timestamp */
  createdDate?: string;
  /** Service last modified timestamp */
  lastModifiedDate?: string;
  /** Service creator ID */
  createdById?: number;
  /** Service last modifier ID */
  lastModifiedById?: number;
  /** Whether service is mutable */
  mutable?: boolean;
  /** Whether service is deletable */
  deletable?: boolean;
  /** Service refresh flag */
  refresh?: boolean;
}

/**
 * Database service list response
 */
export interface DatabaseServiceListResponse {
  /** List of database services */
  resource: DatabaseService[];
  /** Response metadata */
  meta?: {
    count: number;
    total: number;
    schema?: string[];
  };
}

/**
 * Service type definition for database connectors
 */
export interface DatabaseServiceType {
  /** Service type name */
  name: DatabaseType;
  /** Service type label */
  label: string;
  /** Service type description */
  description: string;
  /** Service group */
  group: DatabaseGroup;
  /** Service type class */
  class?: string;
  /** Configuration schema */
  configSchema: DatabaseConfigSchema[];
  /** Service icon identifier */
  icon?: string;
  /** Supported features */
  features?: string[];
  /** Version requirements */
  versions?: string[];
  /** License requirements */
  licenseRequired?: 'open_source' | 'silver' | 'gold';
}

// =============================================================================
// EXPORT TYPES FOR COMPONENT CONSUMPTION
// =============================================================================

/**
 * Comprehensive export of all database-related types
 * for consumption by React components and hooks
 */
export type {
  // Core configuration types
  DatabaseConfig,
  MySQLConfig,
  PostgreSQLConfig,
  OracleConfig,
  MongoDBConfig,
  SnowflakeConfig,
  
  // Schema and metadata types
  DatabaseSchema,
  DatabaseTable,
  DatabaseField,
  TableRelationship,
  TableIndex,
  TableConstraint,
  
  // Connection and testing types
  ConnectionTestRequest,
  ConnectionTestResult,
  ConnectionCapabilities,
  
  // Permission types
  SchemaPermissions,
  TablePermissions,
  FieldPermissions,
  
  // Performance types
  VirtualScrollConfig,
  ProgressiveLoadingConfig,
  SchemaPagination,
  
  // Service management types
  DatabaseService,
  DatabaseServiceType,
  DatabaseServiceListResponse,
  
  // React Query integration types
  DatabaseServiceQueryOptions,
  DatabaseMutationOptions,
  DatabaseSWRConfig,
};

/**
 * Default configurations for supported database types
 */
export const DEFAULT_DATABASE_CONFIGS: Record<DatabaseType, Partial<DatabaseConfig>> = {
  mysql: {
    port: 3306,
    charset: 'utf8mb4',
    connectionTimeout: 5000,
  },
  postgresql: {
    port: 5432,
    applicationName: 'DreamFactory',
    connectionTimeout: 5000,
  },
  oracle: {
    port: 1521,
    edition: 'standard',
    connectionTimeout: 5000,
  },
  mongodb: {
    port: 27017,
    readPreference: 'primary',
    connectionTimeout: 5000,
  },
  snowflake: {
    port: 443,
    connectionTimeout: 5000,
  },
};

/**
 * Database type metadata for UI rendering
 */
export const DATABASE_TYPE_METADATA: Record<DatabaseType, {
  label: string;
  description: string;
  icon: string;
  group: DatabaseGroup;
  features: string[];
}> = {
  mysql: {
    label: 'MySQL',
    description: 'Popular open-source relational database',
    icon: 'mysql',
    group: 'Database',
    features: ['ACID compliance', 'Replication', 'Partitioning', 'Full-text indexing'],
  },
  postgresql: {
    label: 'PostgreSQL',
    description: 'Advanced open-source relational database',
    icon: 'postgresql',
    group: 'Database',
    features: ['ACID compliance', 'JSON support', 'Advanced indexing', 'Custom functions'],
  },
  oracle: {
    label: 'Oracle Database',
    description: 'Enterprise-grade relational database',
    icon: 'oracle',
    group: 'Database',
    features: ['Enterprise features', 'Advanced security', 'High availability', 'Performance tuning'],
  },
  mongodb: {
    label: 'MongoDB',
    description: 'Document-oriented NoSQL database',
    icon: 'mongodb',
    group: 'NoSQL',
    features: ['Document storage', 'Flexible schema', 'Horizontal scaling', 'Aggregation framework'],
  },
  snowflake: {
    label: 'Snowflake',
    description: 'Cloud-native data warehouse',
    icon: 'snowflake',
    group: 'Cloud Data Warehouse',
    features: ['Cloud-native', 'Elastic scaling', 'Multi-cloud', 'Time travel'],
  },
};