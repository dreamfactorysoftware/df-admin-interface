/**
 * Database service configuration types for React/Next.js migration
 * 
 * Supports all DreamFactory database connectors:
 * - MySQL 5.7+, 8.0+
 * - PostgreSQL 12+  
 * - MongoDB 4.4+
 * - Oracle Database 19c+
 * - Snowflake (Latest)
 * 
 * Features:
 * - React Hook Form compatibility with Zod validation
 * - Real-time validation under 100ms
 * - Connection testing under 5 seconds
 * - Schema discovery optimized for 1000+ tables
 * - Next.js API route compatibility
 * - React Query/SWR integration
 */

import { z } from 'zod';
import type { 
  ApiResponse, 
  ApiError, 
  PaginatedResponse,
  CacheConfig,
  LoadingState 
} from './api';

// ============================================================================
// DATABASE CONNECTOR TYPES
// ============================================================================

/** Supported database types in DreamFactory */
export type DatabaseType = 
  | 'mysql'
  | 'postgresql' 
  | 'mongodb'
  | 'oracle'
  | 'snowflake';

/** Database driver configurations */
export const DATABASE_DRIVERS = {
  mysql: {
    name: 'MySQL',
    description: 'MySQL database connector with full CRUD and schema introspection',
    versions: ['5.7+', '8.0+'],
    features: ['Full CRUD', 'Schema introspection', 'Relationships'],
    port: 3306,
    defaultConnection: {
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci'
    }
  },
  postgresql: {
    name: 'PostgreSQL', 
    description: 'PostgreSQL connector with advanced SQL features and JSON support',
    versions: ['12+'],
    features: ['Advanced SQL features', 'JSON support', 'Full text search'],
    port: 5432,
    defaultConnection: {
      charset: 'UTF8'
    }
  },
  mongodb: {
    name: 'MongoDB',
    description: 'MongoDB connector for document operations and aggregation',
    versions: ['4.4+'],
    features: ['Document operations', 'Aggregation', 'GridFS'],
    port: 27017,
    defaultConnection: {
      authSource: 'admin'
    }
  },
  oracle: {
    name: 'Oracle Database',
    description: 'Oracle Database connector with enterprise-grade features',
    versions: ['19c+'],
    features: ['Enterprise features', 'Advanced SQL', 'PL/SQL support'],
    port: 1521,
    defaultConnection: {
      charset: 'UTF8'
    }
  },
  snowflake: {
    name: 'Snowflake',
    description: 'Snowflake cloud data warehouse connector',
    versions: ['Latest'],
    features: ['Cloud data warehouse', 'Auto-scaling', 'Data sharing'],
    port: 443,
    defaultConnection: {
      warehouse: 'COMPUTE_WH',
      role: 'PUBLIC'
    }
  }
} as const;

// ============================================================================
// SSL CONFIGURATION TYPES  
// ============================================================================

/** SSL/TLS configuration for secure database connections */
export interface SSLConfig {
  /** Enable SSL/TLS encryption */
  enabled: boolean;
  /** SSL mode - varies by database type */
  mode?: 'disable' | 'require' | 'verify-ca' | 'verify-full' | 'preferred';
  /** Path to CA certificate file */
  ca_cert?: string;
  /** Path to client certificate file */
  client_cert?: string;
  /** Path to client private key file */
  client_key?: string;
  /** SSL cipher suite */
  cipher?: string;
  /** Verify server certificate */
  verify_server_cert?: boolean;
  /** SSL/TLS version */
  version?: 'TLSv1' | 'TLSv1.1' | 'TLSv1.2' | 'TLSv1.3';
}

/** Zod schema for SSL configuration validation */
export const sslConfigSchema = z.object({
  enabled: z.boolean().default(false),
  mode: z.enum(['disable', 'require', 'verify-ca', 'verify-full', 'preferred']).optional(),
  ca_cert: z.string().optional(),
  client_cert: z.string().optional(), 
  client_key: z.string().optional(),
  cipher: z.string().optional(),
  verify_server_cert: z.boolean().optional(),
  version: z.enum(['TLSv1', 'TLSv1.1', 'TLSv1.2', 'TLSv1.3']).optional()
}).refine((data) => {
  // If SSL is enabled, verify required fields based on mode
  if (data.enabled && data.mode === 'verify-ca') {
    return !!data.ca_cert;
  }
  return true;
}, {
  message: "CA certificate is required when SSL mode is 'verify-ca'",
  path: ['ca_cert']
});

// ============================================================================
// CONNECTION POOLING CONFIGURATION
// ============================================================================

/** Database connection pooling configuration */
export interface ConnectionPoolConfig {
  /** Minimum number of connections in pool */
  min_connections: number;
  /** Maximum number of connections in pool */
  max_connections: number;
  /** Maximum idle time for connections (seconds) */
  max_idle_time: number;
  /** Connection acquire timeout (milliseconds) */
  acquire_timeout: number;
  /** Connection validation query */
  validation_query?: string;
  /** Test connections on checkout */
  test_on_borrow: boolean;
  /** Test connections on checkin */
  test_on_return: boolean;
  /** Test connections while idle */
  test_while_idle: boolean;
  /** Time between eviction runs (milliseconds) */
  time_between_eviction_runs: number;
  /** Minimum evictable idle time (milliseconds) */
  min_evictable_idle_time: number;
}

/** Zod schema for connection pool validation */
export const connectionPoolSchema = z.object({
  min_connections: z.number().min(1).max(100).default(1),
  max_connections: z.number().min(1).max(1000).default(10),
  max_idle_time: z.number().min(60).max(3600).default(300),
  acquire_timeout: z.number().min(1000).max(60000).default(30000),
  validation_query: z.string().optional(),
  test_on_borrow: z.boolean().default(true),
  test_on_return: z.boolean().default(false),
  test_while_idle: z.boolean().default(true),
  time_between_eviction_runs: z.number().min(10000).max(300000).default(30000),
  min_evictable_idle_time: z.number().min(60000).max(1800000).default(180000)
}).refine((data) => {
  return data.max_connections >= data.min_connections;
}, {
  message: "Maximum connections must be greater than or equal to minimum connections",
  path: ['max_connections']
});

// ============================================================================
// DATABASE-SPECIFIC CONNECTION CONFIGURATIONS
// ============================================================================

/** MySQL-specific connection configuration */
export interface MySQLConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  charset?: string;
  collation?: string;
  timezone?: string;
  options?: string;
  ssl?: SSLConfig;
  pool?: ConnectionPoolConfig;
}

/** PostgreSQL-specific connection configuration */
export interface PostgreSQLConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  schema?: string;
  charset?: string;
  timezone?: string;
  search_path?: string;
  application_name?: string;
  ssl?: SSLConfig;
  pool?: ConnectionPoolConfig;
}

/** MongoDB-specific connection configuration */
export interface MongoDBConfig {
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
  auth_source?: string;
  replica_set?: string;
  read_preference?: 'primary' | 'primaryPreferred' | 'secondary' | 'secondaryPreferred' | 'nearest';
  write_concern?: {
    w: number | 'majority';
    j: boolean;
    wtimeout: number;
  };
  ssl?: SSLConfig;
  options?: string;
}

/** Oracle-specific connection configuration */
export interface OracleConfig {
  host: string;
  port: number;
  service_name?: string;
  sid?: string;
  username: string;
  password: string;
  schema?: string;
  charset?: string;
  nls_lang?: string;
  connection_string?: string;
  ssl?: SSLConfig;
  pool?: ConnectionPoolConfig;
}

/** Snowflake-specific connection configuration */
export interface SnowflakeConfig {
  account: string;
  username: string;
  password?: string;
  authenticator?: 'snowflake' | 'externalbrowser' | 'oauth' | 'snowflake_jwt';
  private_key?: string;
  private_key_passphrase?: string;
  warehouse?: string;
  database?: string;
  schema?: string;
  role?: string;
  timeout?: number;
  ssl?: SSLConfig;
}

// ============================================================================
// UNIFIED DATABASE SERVICE CONFIGURATION
// ============================================================================

/** Complete database service configuration */
export interface DatabaseServiceConfig {
  /** Service identifier */
  id?: number;
  /** Service name (unique) */
  name: string;
  /** Display label */
  label: string;
  /** Description */
  description?: string;
  /** Database type */
  type: DatabaseType;
  /** Service is active */
  is_active: boolean;
  /** Service can be modified */
  mutable: boolean;
  /** Service can be deleted */
  deletable: boolean;
  /** Database-specific configuration */
  config: MySQLConfig | PostgreSQLConfig | MongoDBConfig | OracleConfig | SnowflakeConfig;
  /** Service creation timestamp */
  created_date?: string;
  /** Last modification timestamp */
  last_modified_date?: string;
  /** Service creator ID */
  created_by_id?: number;
  /** Last modifier ID */
  last_modified_by_id?: number;
  /** Force service refresh */
  refresh?: boolean;
}

/** Lightweight database service for list views */
export interface DatabaseServiceRow {
  id: number;
  name: string;
  label: string;
  description?: string;
  type: DatabaseType;
  is_active: boolean;
  deletable: boolean;
  connection_status?: 'connected' | 'disconnected' | 'testing' | 'error';
  last_tested?: string;
  created_date: string;
  last_modified_date: string;
}

// ============================================================================
// CONNECTION TESTING TYPES
// ============================================================================

/** Database connection test request */
export interface ConnectionTestRequest {
  type: DatabaseType;
  config: MySQLConfig | PostgreSQLConfig | MongoDBConfig | OracleConfig | SnowflakeConfig;
  timeout?: number; // Maximum test duration in milliseconds (default: 5000)
}

/** Database connection test result */
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  response_time_ms: number;
  tested_at: string;
  server_version?: string;
  error_code?: string;
  error_details?: string;
  warnings?: string[];
  connection_info?: {
    host: string;
    port: number;
    database: string;
    charset?: string;
    timezone?: string;
  };
}

/** Connection test with React concurrent features */
export interface ConnectionTestState extends LoadingState {
  result?: ConnectionTestResult;
  error?: ApiError;
  abortController?: AbortController;
}

// ============================================================================
// SCHEMA DISCOVERY TYPES
// ============================================================================

/** Database field/column definition */
export interface DatabaseField {
  name: string;
  label?: string;
  type: string;
  db_type: string;
  length?: number;
  precision?: number;
  scale?: number;
  default_value?: any;
  is_nullable: boolean;
  is_primary_key: boolean;
  is_unique: boolean;
  is_foreign_key: boolean;
  is_index: boolean;
  is_auto_increment: boolean;
  foreign_key?: {
    table: string;
    column: string;
    on_update?: string;
    on_delete?: string;
  };
  comment?: string;
  native_type?: string;
  validation?: {
    required?: boolean;
    min_length?: number;
    max_length?: number;
    pattern?: string;
  };
}

/** Database table definition */
export interface DatabaseTable {
  name: string;
  label?: string;
  description?: string;
  type: 'table' | 'view' | 'materialized_view';
  fields: DatabaseField[];
  primary_key: string[];
  indexes: DatabaseIndex[];
  foreign_keys: DatabaseForeignKey[];
  table_constraints?: DatabaseConstraint[];
  row_count?: number;
  size_bytes?: number;
  comment?: string;
  schema?: string;
  created_date?: string;
  last_modified_date?: string;
}

/** Database index definition */
export interface DatabaseIndex {
  name: string;
  type: 'primary' | 'unique' | 'index' | 'fulltext' | 'spatial';
  columns: string[];
  is_unique: boolean;
  is_partial: boolean;
  condition?: string;
  comment?: string;
}

/** Database foreign key definition */
export interface DatabaseForeignKey {
  name: string;
  columns: string[];
  foreign_table: string;
  foreign_columns: string[];
  on_update?: 'cascade' | 'restrict' | 'set_null' | 'set_default' | 'no_action';
  on_delete?: 'cascade' | 'restrict' | 'set_null' | 'set_default' | 'no_action';
  match_type?: 'full' | 'partial' | 'simple';
}

/** Database constraint definition */
export interface DatabaseConstraint {
  name: string;
  type: 'check' | 'unique' | 'exclude';
  columns: string[];
  condition?: string;
  is_deferrable?: boolean;
  initially_deferred?: boolean;
}

/** Complete database schema */
export interface DatabaseSchema {
  service_name: string;
  database_name: string;
  schema_name?: string;
  tables: DatabaseTable[];
  views: DatabaseTable[];
  total_tables: number;
  total_views: number;
  discovery_time_ms: number;
  discovered_at: string;
  version: string;
  charset?: string;
  collation?: string;
  warnings?: string[];
}

/** Schema discovery configuration for performance optimization */
export interface SchemaDiscoveryConfig {
  /** Include table row counts (slower) */
  include_row_counts: boolean;
  /** Include table sizes (slower) */
  include_table_sizes: boolean;
  /** Maximum tables to discover (performance limit) */
  max_tables: number;
  /** Table name filter pattern */
  table_filter?: string;
  /** Schema/database filter */
  schema_filter?: string;
  /** Discovery timeout in milliseconds */
  timeout: number;
  /** Use cached results if available */
  use_cache: boolean;
  /** Cache TTL in seconds */
  cache_ttl: number;
}

/** Schema discovery optimized for large datasets */
export interface PaginatedSchemaDiscovery {
  config: SchemaDiscoveryConfig;
  pagination: {
    page: number;
    per_page: number;
    total_pages: number;
    total_items: number;
  };
  filters: {
    table_name?: string;
    table_type?: 'table' | 'view';
    has_primary_key?: boolean;
    has_foreign_keys?: boolean;
  };
}

// ============================================================================
// RELATIONSHIP MAPPING TYPES
// ============================================================================

/** Database relationship types */
export type RelationshipType = 'belongs_to' | 'has_many' | 'has_one' | 'many_many';

/** Table relationship definition */
export interface TableRelationship {
  name: string;
  alias?: string;
  label?: string;
  description?: string;
  type: RelationshipType;
  local_field: string;
  foreign_service?: string;
  foreign_table: string;
  foreign_field: string;
  junction_service?: string;
  junction_table?: string;
  junction_local_field?: string;
  junction_foreign_field?: string;
  is_virtual: boolean;
  always_fetch: boolean;
  flatten: boolean;
  flatten_drop_prefix: boolean;
  on_update?: string;
  on_delete?: string;
}

/** Relationship discovery result */
export interface RelationshipDiscoveryResult {
  service_name: string;
  table_name: string;
  relationships: TableRelationship[];
  discovered_at: string;
  discovery_method: 'foreign_keys' | 'naming_convention' | 'manual';
}

// ============================================================================
// FORM SCHEMAS AND VALIDATION
// ============================================================================

/** Zod schema for MySQL configuration */
export const mysqlConfigSchema = z.object({
  host: z.string().min(1, 'Host is required').max(255),
  port: z.number().min(1).max(65535).default(3306),
  database: z.string().min(1, 'Database name is required').max(64),
  username: z.string().min(1, 'Username is required').max(32),
  password: z.string().min(1, 'Password is required'),
  charset: z.string().optional().default('utf8mb4'),
  collation: z.string().optional().default('utf8mb4_unicode_ci'),
  timezone: z.string().optional(),
  options: z.string().optional(),
  ssl: sslConfigSchema.optional(),
  pool: connectionPoolSchema.optional()
});

/** Zod schema for PostgreSQL configuration */
export const postgresqlConfigSchema = z.object({
  host: z.string().min(1, 'Host is required').max(255),
  port: z.number().min(1).max(65535).default(5432),
  database: z.string().min(1, 'Database name is required').max(63),
  username: z.string().min(1, 'Username is required').max(63),
  password: z.string().min(1, 'Password is required'),
  schema: z.string().optional().default('public'),
  charset: z.string().optional().default('UTF8'),
  timezone: z.string().optional(),
  search_path: z.string().optional(),
  application_name: z.string().optional(),
  ssl: sslConfigSchema.optional(),
  pool: connectionPoolSchema.optional()
});

/** Zod schema for MongoDB configuration */
export const mongodbConfigSchema = z.object({
  host: z.string().min(1, 'Host is required').max(255),
  port: z.number().min(1).max(65535).default(27017),
  database: z.string().min(1, 'Database name is required').max(64),
  username: z.string().optional(),
  password: z.string().optional(),
  auth_source: z.string().optional().default('admin'),
  replica_set: z.string().optional(),
  read_preference: z.enum(['primary', 'primaryPreferred', 'secondary', 'secondaryPreferred', 'nearest']).optional(),
  write_concern: z.object({
    w: z.union([z.number(), z.literal('majority')]).default(1),
    j: z.boolean().default(true),
    wtimeout: z.number().default(5000)
  }).optional(),
  ssl: sslConfigSchema.optional(),
  options: z.string().optional()
}).refine((data) => {
  // If username is provided, password should be provided too
  if (data.username && !data.password) {
    return false;
  }
  return true;
}, {
  message: "Password is required when username is provided",
  path: ['password']
});

/** Zod schema for Oracle configuration */
export const oracleConfigSchema = z.object({
  host: z.string().min(1, 'Host is required').max(255),
  port: z.number().min(1).max(65535).default(1521),
  service_name: z.string().optional(),
  sid: z.string().optional(),
  username: z.string().min(1, 'Username is required').max(30),
  password: z.string().min(1, 'Password is required'),
  schema: z.string().optional(),
  charset: z.string().optional().default('UTF8'),
  nls_lang: z.string().optional(),
  connection_string: z.string().optional(),
  ssl: sslConfigSchema.optional(),
  pool: connectionPoolSchema.optional()
}).refine((data) => {
  // Either service_name or SID should be provided
  return data.service_name || data.sid || data.connection_string;
}, {
  message: "Either service name, SID, or connection string is required",
  path: ['service_name']
});

/** Zod schema for Snowflake configuration */
export const snowflakeConfigSchema = z.object({
  account: z.string().min(1, 'Account is required').max(255),
  username: z.string().min(1, 'Username is required').max(255),
  password: z.string().optional(),
  authenticator: z.enum(['snowflake', 'externalbrowser', 'oauth', 'snowflake_jwt']).default('snowflake'),
  private_key: z.string().optional(),
  private_key_passphrase: z.string().optional(),
  warehouse: z.string().optional().default('COMPUTE_WH'),
  database: z.string().optional(),
  schema: z.string().optional().default('PUBLIC'),
  role: z.string().optional().default('PUBLIC'),
  timeout: z.number().min(1000).max(300000).optional().default(60000),
  ssl: sslConfigSchema.optional()
}).refine((data) => {
  // Password validation based on authenticator
  if (data.authenticator === 'snowflake' && !data.password) {
    return false;
  }
  if (data.authenticator === 'snowflake_jwt' && !data.private_key) {
    return false;
  }
  return true;
}, {
  message: "Password is required for Snowflake authenticator, private key is required for JWT authenticator",
  path: ['password']
});

/** Unified database service configuration schema */
export const databaseServiceConfigSchema = z.object({
  id: z.number().optional(),
  name: z.string()
    .min(1, 'Service name is required')
    .max(64, 'Service name must be 64 characters or less')
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Service name must start with a letter or underscore and contain only letters, numbers, and underscores'),
  label: z.string().min(1, 'Label is required').max(255),
  description: z.string().max(1000).optional(),
  type: z.enum(['mysql', 'postgresql', 'mongodb', 'oracle', 'snowflake']),
  is_active: z.boolean().default(true),
  mutable: z.boolean().default(true),
  deletable: z.boolean().default(true),
  config: z.union([
    mysqlConfigSchema,
    postgresqlConfigSchema, 
    mongodbConfigSchema,
    oracleConfigSchema,
    snowflakeConfigSchema
  ]),
  created_date: z.string().optional(),
  last_modified_date: z.string().optional(),
  created_by_id: z.number().optional(),
  last_modified_by_id: z.number().optional(),
  refresh: z.boolean().optional().default(false)
});

/** Connection test request schema */
export const connectionTestRequestSchema = z.object({
  type: z.enum(['mysql', 'postgresql', 'mongodb', 'oracle', 'snowflake']),
  config: z.union([
    mysqlConfigSchema,
    postgresqlConfigSchema,
    mongodbConfigSchema, 
    oracleConfigSchema,
    snowflakeConfigSchema
  ]),
  timeout: z.number().min(1000).max(60000).optional().default(5000)
});

/** Schema discovery configuration schema */
export const schemaDiscoveryConfigSchema = z.object({
  include_row_counts: z.boolean().default(false),
  include_table_sizes: z.boolean().default(false),
  max_tables: z.number().min(1).max(10000).default(1000),
  table_filter: z.string().optional(),
  schema_filter: z.string().optional(),
  timeout: z.number().min(5000).max(300000).default(30000),
  use_cache: z.boolean().default(true),
  cache_ttl: z.number().min(60).max(3600).default(300)
});

// ============================================================================
// REACT QUERY / SWR INTEGRATION TYPES
// ============================================================================

/** SWR/React Query key factories for database operations */
export const databaseQueryKeys = {
  all: ['database'] as const,
  services: () => [...databaseQueryKeys.all, 'services'] as const,
  service: (id: number) => [...databaseQueryKeys.services(), id] as const,
  schema: (serviceName: string) => [...databaseQueryKeys.all, 'schema', serviceName] as const,
  tables: (serviceName: string) => [...databaseQueryKeys.schema(serviceName), 'tables'] as const,
  table: (serviceName: string, tableName: string) => [...databaseQueryKeys.tables(serviceName), tableName] as const,
  relationships: (serviceName: string, tableName: string) => [...databaseQueryKeys.table(serviceName, tableName), 'relationships'] as const,
  connectionTest: (type: DatabaseType, config: any) => ['database', 'connection-test', type, config] as const
} as const;

/** React Query options for database services */
export interface DatabaseQueryOptions extends CacheConfig {
  /** Enable background refetching */
  refetchOnWindowFocus?: boolean;
  /** Enable refetch on reconnect */
  refetchOnReconnect?: boolean;
  /** Retry failed requests */
  retry?: number | boolean;
  /** Retry delay */
  retryDelay?: number;
  /** Enable optimistic updates */
  optimisticUpdates?: boolean;
}

/** Database service query result with React Query features */
export interface DatabaseServiceQueryResult extends LoadingState {
  services: DatabaseServiceRow[];
  error?: ApiError;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
  prefetch: (serviceId: number) => Promise<void>;
}

/** Schema discovery query result optimized for large datasets */
export interface SchemaDiscoveryQueryResult extends LoadingState {
  schema?: DatabaseSchema;
  tables: DatabaseTable[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  fetchNextPage: () => Promise<void>;
  fetchPreviousPage: () => Promise<void>;
  totalCount: number;
  error?: ApiError;
  invalidate: () => Promise<void>;
}

// ============================================================================
// NEXT.JS API ROUTE TYPES
// ============================================================================

/** Next.js API route handler for database services */
export interface DatabaseServiceApiHandler {
  GET: (request: Request) => Promise<Response>;
  POST: (request: Request) => Promise<Response>;
  PUT: (request: Request) => Promise<Response>;
  DELETE: (request: Request) => Promise<Response>;
}

/** Database service API endpoints */
export interface DatabaseServiceEndpoints {
  /** List database services */
  list: '/api/database/services';
  /** Get specific service */
  detail: '/api/database/services/[id]';
  /** Create new service */
  create: '/api/database/services';
  /** Update service */
  update: '/api/database/services/[id]';
  /** Delete service */
  delete: '/api/database/services/[id]';
  /** Test connection */
  test: '/api/database/test-connection';
  /** Discover schema */
  schema: '/api/database/services/[id]/schema';
  /** Get table details */
  table: '/api/database/services/[id]/tables/[table]';
  /** Get relationships */
  relationships: '/api/database/services/[id]/tables/[table]/relationships';
}

// ============================================================================
// TYPE EXPORTS FOR CONVENIENCE
// ============================================================================

/** All database configuration types */
export type DatabaseConfig = 
  | MySQLConfig 
  | PostgreSQLConfig 
  | MongoDBConfig 
  | OracleConfig 
  | SnowflakeConfig;

/** All configuration schemas */
export type DatabaseConfigSchema = 
  | typeof mysqlConfigSchema
  | typeof postgresqlConfigSchema
  | typeof mongodbConfigSchema
  | typeof oracleConfigSchema
  | typeof snowflakeConfigSchema;

/** Common database service operations */
export interface DatabaseServiceOperations {
  create: (config: DatabaseServiceConfig) => Promise<DatabaseServiceConfig>;
  update: (id: number, config: Partial<DatabaseServiceConfig>) => Promise<DatabaseServiceConfig>;
  delete: (id: number) => Promise<void>;
  testConnection: (request: ConnectionTestRequest) => Promise<ConnectionTestResult>;
  discoverSchema: (serviceName: string, config?: SchemaDiscoveryConfig) => Promise<DatabaseSchema>;
  getRelationships: (serviceName: string, tableName: string) => Promise<TableRelationship[]>;
}

/** Performance metrics for database operations */
export interface DatabasePerformanceMetrics {
  connection_time_ms: number;
  schema_discovery_time_ms: number;
  query_execution_time_ms: number;
  cache_hit_rate: number;
  total_requests: number;
  error_rate: number;
  last_updated: string;
}

// ============================================================================
// LEGACY COMPATIBILITY TYPES
// ============================================================================

/** Legacy service type mapping for backward compatibility */
export interface LegacyServiceMapping {
  /** Legacy Angular service ID */
  legacy_id?: string;
  /** Migration status */
  migration_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  /** Migration timestamp */
  migrated_at?: string;
  /** Legacy configuration reference */
  legacy_config?: any;
  /** Migration notes */
  migration_notes?: string;
}

/** Extended database service for migration tracking */
export interface MigrationAwareDatabaseService extends DatabaseServiceConfig {
  migration?: LegacyServiceMapping;
}

// Re-export commonly used types for convenience
export type { ApiResponse, ApiError, PaginatedResponse, LoadingState } from './api';