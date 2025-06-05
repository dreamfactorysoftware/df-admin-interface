/**
 * Database service configuration fixture factory functions for testing React components
 * and API generation workflows. Provides comprehensive factory functions for creating
 * database services, connection configurations, and schema metadata to support testing
 * of database management interfaces.
 *
 * This module supports all DreamFactory database connector types including MySQL,
 * PostgreSQL, MongoDB, Oracle, SQL Server, Snowflake, and others with realistic
 * configuration data optimized for React Hook Form validation and SWR/React Query
 * caching scenarios.
 */

import type {
  DatabaseService,
  DatabaseConnection,
  ConnectionConfig,
  ConnectionTestResult,
  DatabaseType,
  DatabaseSchema,
  TableMetadata,
  FieldMetadata,
  RelationshipMetadata,
  ConnectionPoolConfig,
  SSLConfig,
} from '@/types/database';
import type {
  Service,
  ServiceType,
  ConfigSchema,
} from '@/types/service';
import type {
  SchemaTable,
  SchemaField,
  SchemaRelationship,
  TableRelatedType,
} from '@/types/schema';

/**
 * Default factory options for database service creation
 */
interface DatabaseFactoryOptions {
  id?: number;
  active?: boolean;
  mutable?: boolean;
  deletable?: boolean;
  withAdvancedConfig?: boolean;
  withConnectionPool?: boolean;
  withSSL?: boolean;
  includeTestResults?: boolean;
}

/**
 * Connection configuration factory options
 */
interface ConnectionConfigOptions {
  type: DatabaseType;
  includeOptionalFields?: boolean;
  withSSL?: boolean;
  withConnectionPool?: boolean;
  withCaching?: boolean;
}

/**
 * Schema factory options for generating table and field metadata
 */
interface SchemaFactoryOptions {
  tableCount?: number;
  fieldsPerTable?: number;
  includeRelationships?: boolean;
  includeIndexes?: boolean;
  includeConstraints?: boolean;
  withLargeDataset?: boolean;
}

/**
 * Connection test result factory options
 */
interface TestResultOptions {
  success?: boolean;
  timeout?: boolean;
  withPerformanceMetrics?: boolean;
  customError?: string;
}

/**
 * Supported database types with their specific characteristics
 */
const DATABASE_TYPES: Record<DatabaseType, {
  defaultPort: number;
  driver: string;
  supportsTransactions: boolean;
  supportsSchemas: boolean;
}> = {
  mysql: {
    defaultPort: 3306,
    driver: 'mysql',
    supportsTransactions: true,
    supportsSchemas: true,
  },
  postgresql: {
    defaultPort: 5432,
    driver: 'pgsql',
    supportsTransactions: true,
    supportsSchemas: true,
  },
  mongodb: {
    defaultPort: 27017,
    driver: 'mongodb',
    supportsTransactions: true,
    supportsSchemas: false,
  },
  sqlite: {
    defaultPort: 0,
    driver: 'sqlite',
    supportsTransactions: true,
    supportsSchemas: false,
  },
  oracle: {
    defaultPort: 1521,
    driver: 'oci',
    supportsTransactions: true,
    supportsSchemas: true,
  },
  sqlserver: {
    defaultPort: 1433,
    driver: 'sqlsrv',
    supportsTransactions: true,
    supportsSchemas: true,
  },
  snowflake: {
    defaultPort: 443,
    driver: 'snowflake',
    supportsTransactions: true,
    supportsSchemas: true,
  },
  mariadb: {
    defaultPort: 3306,
    driver: 'mysql',
    supportsTransactions: true,
    supportsSchemas: true,
  },
  ibmdb2: {
    defaultPort: 50000,
    driver: 'ibm',
    supportsTransactions: true,
    supportsSchemas: true,
  },
};

/**
 * Sample database schemas for different use cases
 */
const SAMPLE_SCHEMAS = {
  ecommerce: ['users', 'products', 'orders', 'order_items', 'categories', 'reviews'],
  crm: ['contacts', 'companies', 'opportunities', 'activities', 'tasks', 'notes'],
  blog: ['posts', 'authors', 'categories', 'tags', 'comments', 'media'],
  inventory: ['items', 'warehouses', 'suppliers', 'purchase_orders', 'stock_movements'],
  analytics: ['events', 'users', 'sessions', 'page_views', 'conversions', 'funnels'],
};

/**
 * Field type mappings for different database systems
 */
const FIELD_TYPES_BY_DATABASE: Record<DatabaseType, string[]> = {
  mysql: ['VARCHAR', 'INT', 'BIGINT', 'DECIMAL', 'TEXT', 'DATETIME', 'TIMESTAMP', 'BOOLEAN', 'JSON'],
  postgresql: ['VARCHAR', 'INTEGER', 'BIGINT', 'NUMERIC', 'TEXT', 'TIMESTAMP', 'TIMESTAMPTZ', 'BOOLEAN', 'JSONB'],
  mongodb: ['String', 'Number', 'Date', 'Boolean', 'Array', 'Object', 'ObjectId', 'Decimal128'],
  sqlite: ['TEXT', 'INTEGER', 'REAL', 'BLOB', 'NUMERIC'],
  oracle: ['VARCHAR2', 'NUMBER', 'DATE', 'TIMESTAMP', 'CLOB', 'BLOB', 'CHAR'],
  sqlserver: ['NVARCHAR', 'INT', 'BIGINT', 'DECIMAL', 'DATETIME2', 'BIT', 'TEXT', 'UNIQUEIDENTIFIER'],
  snowflake: ['VARCHAR', 'NUMBER', 'FLOAT', 'BOOLEAN', 'DATE', 'TIMESTAMP_NTZ', 'VARIANT', 'ARRAY'],
  mariadb: ['VARCHAR', 'INT', 'BIGINT', 'DECIMAL', 'TEXT', 'DATETIME', 'TIMESTAMP', 'BOOLEAN', 'JSON'],
  ibmdb2: ['VARCHAR', 'INTEGER', 'BIGINT', 'DECIMAL', 'TIMESTAMP', 'DATE', 'CLOB', 'BLOB'],
};

/**
 * Generates a realistic database service configuration for testing
 * @param type - Database type (mysql, postgresql, mongodb, etc.)
 * @param options - Configuration options for the service
 * @returns Complete database service configuration
 */
export function databaseServiceFactory(
  type: DatabaseType,
  options: DatabaseFactoryOptions = {}
): DatabaseService {
  const {
    id = Math.floor(Math.random() * 1000) + 1,
    active = true,
    mutable = true,
    deletable = true,
    withAdvancedConfig = false,
    withConnectionPool = false,
    withSSL = false,
  } = options;

  const dbConfig = DATABASE_TYPES[type];
  const baseConfig = {
    service_id: id,
    host: type === 'sqlite' ? undefined : `${type}-server.example.com`,
    port: type === 'sqlite' ? undefined : dbConfig.defaultPort,
    database: type === 'sqlite' ? 'test.db' : `${type}_test_db`,
    username: type === 'sqlite' ? undefined : `${type}_user`,
    password: type === 'sqlite' ? undefined : 'secure_password_123',
    max_records: 1000,
    cache_enabled: false,
    cache_ttl: 0,
    options: [],
    attributes: null,
    statements: null,
    allow_upsert: true,
  };

  // Add advanced configuration options
  if (withAdvancedConfig) {
    Object.assign(baseConfig, {
      timezone: 'UTC',
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
      strict_mode: true,
      fetch_mode: 'array',
      default_schema: type === 'postgresql' ? 'public' : undefined,
    });
  }

  // Add connection pooling configuration
  if (withConnectionPool) {
    Object.assign(baseConfig, {
      max_connections: 10,
      min_connections: 1,
      connection_timeout: 30,
      idle_timeout: 300,
      pool_size: 5,
    });
  }

  // Add SSL configuration
  if (withSSL) {
    Object.assign(baseConfig, {
      ssl_enabled: true,
      ssl_verify_cert: true,
      ssl_ca_cert: '/path/to/ca-cert.pem',
      ssl_client_cert: '/path/to/client-cert.pem',
      ssl_client_key: '/path/to/client-key.pem',
    });
  }

  return {
    id,
    name: `${type}_test_service`,
    label: `Test ${dbConfig.driver.toUpperCase()} Service`,
    description: `Test database service for ${type} connections and API generation`,
    isActive: active,
    type,
    mutable,
    deletable,
    createdDate: new Date().toISOString(),
    lastModifiedDate: new Date().toISOString(),
    createdById: 1,
    lastModifiedById: 1,
    config: baseConfig,
    serviceDocByServiceId: null,
    refresh: false,
  };
}

/**
 * Generates realistic connection configuration for database testing
 * @param options - Connection configuration options
 * @returns Connection configuration object
 */
export function connectionConfigFactory(
  options: ConnectionConfigOptions
): ConnectionConfig {
  const { type, includeOptionalFields = false, withSSL = false, withConnectionPool = false, withCaching = false } = options;
  
  const dbConfig = DATABASE_TYPES[type];
  const config: ConnectionConfig = {
    host: type === 'sqlite' ? undefined : `${type}-server.example.com`,
    port: type === 'sqlite' ? undefined : dbConfig.defaultPort,
    database: type === 'sqlite' ? 'test.db' : `${type}_database`,
    username: type === 'sqlite' ? undefined : `${type}_user`,
    password: type === 'sqlite' ? undefined : 'test_password_123',
    driver: dbConfig.driver,
  };

  if (includeOptionalFields) {
    Object.assign(config, {
      schema: type === 'postgresql' ? 'public' : undefined,
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
      timezone: 'UTC',
      options: {
        connect_timeout: 10,
        read_timeout: 30,
        write_timeout: 30,
      },
    });
  }

  if (withSSL) {
    config.ssl = {
      enabled: true,
      verify_cert: true,
      ca_cert: '/path/to/ca-certificate.pem',
      client_cert: '/path/to/client-certificate.pem',
      client_key: '/path/to/client-key.pem',
    };
  }

  if (withConnectionPool) {
    config.pool = {
      max_connections: 10,
      min_connections: 2,
      acquire_timeout: 30000,
      idle_timeout: 300000,
      max_lifetime: 1800000,
    };
  }

  if (withCaching) {
    config.cache = {
      enabled: true,
      ttl: 300,
      prefix: `${type}_cache`,
      tags: ['database', type],
    };
  }

  return config;
}

/**
 * Generates database schema metadata for testing schema discovery functionality
 * @param type - Database type
 * @param options - Schema generation options
 * @returns Complete database schema with tables, fields, and relationships
 */
export function databaseSchemaFactory(
  type: DatabaseType,
  options: SchemaFactoryOptions = {}
): DatabaseSchema {
  const {
    tableCount = 6,
    fieldsPerTable = 5,
    includeRelationships = true,
    includeIndexes = true,
    includeConstraints = true,
    withLargeDataset = false,
  } = options;

  const schemaName = type === 'postgresql' ? 'public' : type === 'oracle' ? 'TESTSCHEMA' : 'test_schema';
  const tables = generateSampleTables(type, withLargeDataset ? 1000 : tableCount, fieldsPerTable);
  
  let relationships: RelationshipMetadata[] = [];
  if (includeRelationships) {
    relationships = generateSampleRelationships(tables);
  }

  return {
    name: schemaName,
    database: `${type}_test_database`,
    tables,
    relationships,
    views: generateSampleViews(type, Math.min(tableCount, 3)),
    procedures: type !== 'mongodb' ? generateSampleProcedures(type, 2) : [],
    functions: type !== 'mongodb' ? generateSampleFunctions(type, 3) : [],
    indexes: includeIndexes ? generateSampleIndexes(tables) : [],
    constraints: includeConstraints ? generateSampleConstraints(tables) : [],
    createdDate: new Date().toISOString(),
    lastModifiedDate: new Date().toISOString(),
  };
}

/**
 * Generates connection test results for various scenarios
 * @param options - Test result configuration options
 * @returns Connection test result object
 */
export function connectionTestResultFactory(
  options: TestResultOptions = {}
): ConnectionTestResult {
  const {
    success = true,
    timeout = false,
    withPerformanceMetrics = false,
    customError,
  } = options;

  if (timeout) {
    return {
      success: false,
      error: 'Connection timeout after 5000ms',
      errorCode: 'TIMEOUT',
      timestamp: new Date().toISOString(),
      duration: 5000,
      details: {
        host: 'unreachable-server.example.com',
        port: 3306,
        timeout: 5000,
      },
    };
  }

  if (!success) {
    return {
      success: false,
      error: customError || 'Authentication failed: Access denied for user',
      errorCode: customError ? 'CUSTOM_ERROR' : 'AUTH_FAILED',
      timestamp: new Date().toISOString(),
      duration: 1250,
      details: {
        host: 'mysql-server.example.com',
        port: 3306,
        database: 'test_db',
        username: 'invalid_user',
      },
    };
  }

  const result: ConnectionTestResult = {
    success: true,
    message: 'Database connection successful',
    timestamp: new Date().toISOString(),
    duration: Math.floor(Math.random() * 2000) + 500,
    serverInfo: {
      version: '8.0.32',
      uptime: '1234567',
      threads: 42,
      charset: 'utf8mb4',
    },
  };

  if (withPerformanceMetrics) {
    result.performance = {
      connectionTime: 450,
      queryTime: 85,
      networkLatency: 12,
      serverLoad: 0.35,
    };
  }

  return result;
}

/**
 * Generates service type configuration schema for database services
 * @param type - Database type
 * @returns Service type with complete configuration schema
 */
export function databaseServiceTypeFactory(type: DatabaseType): ServiceType {
  const dbConfig = DATABASE_TYPES[type];
  const configSchema: ConfigSchema[] = [];

  // Basic connection fields
  if (type !== 'sqlite') {
    configSchema.push(
      {
        name: 'host',
        label: 'Host',
        type: 'string',
        description: 'Database server hostname or IP address',
        alias: 'host',
        required: true,
        default: 'localhost',
        precision: 0,
        scale: null,
        allowNull: false,
        picklist: null,
        validation: null,
        dbFunction: null,
      },
      {
        name: 'port',
        label: 'Port',
        type: 'integer',
        description: 'Database server port number',
        alias: 'port',
        required: false,
        default: dbConfig.defaultPort,
        precision: 0,
        scale: null,
        allowNull: true,
        picklist: null,
        validation: null,
        dbFunction: null,
      },
      {
        name: 'username',
        label: 'Username',
        type: 'string',
        description: 'Database username for authentication',
        alias: 'username',
        required: true,
        default: null,
        precision: 0,
        scale: null,
        allowNull: false,
        picklist: null,
        validation: null,
        dbFunction: null,
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        description: 'Database password for authentication',
        alias: 'password',
        required: true,
        default: null,
        precision: 0,
        scale: null,
        allowNull: false,
        picklist: null,
        validation: null,
        dbFunction: null,
      }
    );
  }

  configSchema.push(
    {
      name: 'database',
      label: type === 'sqlite' ? 'Database File' : 'Database Name',
      type: 'string',
      description: type === 'sqlite' ? 'Path to SQLite database file' : 'Name of the database to connect to',
      alias: 'database',
      required: true,
      default: type === 'sqlite' ? 'database.db' : null,
      precision: 0,
      scale: null,
      allowNull: false,
      picklist: null,
      validation: null,
      dbFunction: null,
    },
    {
      name: 'max_records',
      label: 'Max Records',
      type: 'integer',
      description: 'Maximum number of records to return in a single request',
      alias: 'max_records',
      required: false,
      default: 1000,
      precision: 0,
      scale: null,
      allowNull: true,
      picklist: null,
      validation: null,
      dbFunction: null,
    },
    {
      name: 'cache_enabled',
      label: 'Enable Caching',
      type: 'boolean',
      description: 'Enable query result caching for improved performance',
      alias: 'cache_enabled',
      required: false,
      default: false,
      precision: 0,
      scale: null,
      allowNull: true,
      picklist: null,
      validation: null,
      dbFunction: null,
    }
  );

  return {
    name: type,
    label: dbConfig.driver.toUpperCase(),
    description: `Database service supporting ${type} connections`,
    group: 'Database',
    configSchema,
  };
}

/**
 * Generates sample table metadata for schema testing
 */
function generateSampleTables(
  type: DatabaseType,
  count: number,
  fieldsPerTable: number
): TableMetadata[] {
  const schemaType = count > 100 ? 'analytics' : 'ecommerce';
  const tableNames = count > 100 
    ? generateLargeTableSet(count)
    : SAMPLE_SCHEMAS[schemaType].slice(0, count);

  return tableNames.map((tableName, index) => ({
    name: tableName,
    label: tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    type: 'table',
    description: `${tableName} table for data management`,
    fields: generateSampleFields(type, fieldsPerTable, tableName),
    primaryKey: 'id',
    indexes: generateTableIndexes(tableName),
    constraints: generateTableConstraints(tableName),
    rowCount: Math.floor(Math.random() * 10000) + 100,
    createdDate: new Date().toISOString(),
    lastModifiedDate: new Date().toISOString(),
  }));
}

/**
 * Generates sample field metadata for table testing
 */
function generateSampleFields(
  type: DatabaseType,
  count: number,
  tableName: string
): FieldMetadata[] {
  const fieldTypes = FIELD_TYPES_BY_DATABASE[type];
  const commonFields = ['id', 'created_at', 'updated_at'];
  const specificFields = generateTableSpecificFields(tableName, count - commonFields.length);
  
  return [...commonFields, ...specificFields].map((fieldName, index) => {
    const isId = fieldName === 'id';
    const isTimestamp = fieldName.includes('_at');
    
    return {
      name: fieldName,
      label: fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type: isId ? 'integer' : isTimestamp ? 'timestamp' : fieldTypes[Math.floor(Math.random() * fieldTypes.length)],
      dbType: isId ? 'INT' : isTimestamp ? 'TIMESTAMP' : fieldTypes[Math.floor(Math.random() * fieldTypes.length)],
      required: isId || fieldName === 'name' || fieldName === 'email',
      allowNull: !isId && fieldName !== 'name' && fieldName !== 'email',
      autoIncrement: isId,
      isPrimaryKey: isId,
      isUnique: isId || fieldName === 'email',
      isForeignKey: fieldName.endsWith('_id') && !isId,
      length: isTimestamp ? undefined : Math.floor(Math.random() * 255) + 1,
      precision: 10,
      scale: fieldName.includes('price') || fieldName.includes('amount') ? 2 : 0,
      default: isTimestamp ? 'CURRENT_TIMESTAMP' : null,
      description: `${fieldName} field for ${tableName}`,
    };
  });
}

/**
 * Generates table-specific field names based on table purpose
 */
function generateTableSpecificFields(tableName: string, count: number): string[] {
  const fieldMap: Record<string, string[]> = {
    users: ['email', 'name', 'password', 'role', 'status'],
    products: ['name', 'description', 'price', 'category_id', 'sku'],
    orders: ['user_id', 'total_amount', 'status', 'shipping_address', 'order_number'],
    companies: ['name', 'industry', 'website', 'employee_count', 'revenue'],
    posts: ['title', 'content', 'author_id', 'published_at', 'status'],
  };

  const baseFields = fieldMap[tableName] || ['name', 'description', 'status', 'priority', 'value'];
  return baseFields.slice(0, count);
}

/**
 * Generates sample relationships between tables
 */
function generateSampleRelationships(tables: TableMetadata[]): RelationshipMetadata[] {
  const relationships: RelationshipMetadata[] = [];
  
  // Generate foreign key relationships
  tables.forEach(table => {
    table.fields.forEach(field => {
      if (field.isForeignKey && field.name.endsWith('_id')) {
        const referencedTableName = field.name.replace('_id', '');
        const referencedTable = tables.find(t => t.name === referencedTableName);
        
        if (referencedTable) {
          relationships.push({
            name: `fk_${table.name}_${field.name}`,
            type: 'belongs_to',
            fromTable: table.name,
            fromField: field.name,
            toTable: referencedTable.name,
            toField: 'id',
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            description: `Foreign key relationship from ${table.name} to ${referencedTable.name}`,
          });
        }
      }
    });
  });

  return relationships;
}

/**
 * Generates sample views for schema testing
 */
function generateSampleViews(type: DatabaseType, count: number): any[] {
  if (type === 'mongodb') return [];
  
  return Array.from({ length: count }, (_, index) => ({
    name: `view_${index + 1}`,
    definition: `SELECT * FROM table_${index + 1} WHERE active = 1`,
    type: 'view',
  }));
}

/**
 * Generates sample stored procedures
 */
function generateSampleProcedures(type: DatabaseType, count: number): any[] {
  return Array.from({ length: count }, (_, index) => ({
    name: `proc_${index + 1}`,
    parameters: ['param1', 'param2'],
    type: 'procedure',
  }));
}

/**
 * Generates sample functions
 */
function generateSampleFunctions(type: DatabaseType, count: number): any[] {
  return Array.from({ length: count }, (_, index) => ({
    name: `func_${index + 1}`,
    returnType: 'VARCHAR',
    type: 'function',
  }));
}

/**
 * Generates sample indexes for tables
 */
function generateSampleIndexes(tables: TableMetadata[]): any[] {
  const indexes: any[] = [];
  
  tables.forEach(table => {
    // Primary key index
    indexes.push({
      name: `pk_${table.name}`,
      table: table.name,
      columns: ['id'],
      unique: true,
      type: 'primary',
    });
    
    // Additional indexes for common fields
    table.fields.forEach(field => {
      if (field.name === 'email' || field.name.endsWith('_id')) {
        indexes.push({
          name: `idx_${table.name}_${field.name}`,
          table: table.name,
          columns: [field.name],
          unique: field.isUnique,
          type: 'btree',
        });
      }
    });
  });
  
  return indexes;
}

/**
 * Generates sample constraints for tables
 */
function generateSampleConstraints(tables: TableMetadata[]): any[] {
  const constraints: any[] = [];
  
  tables.forEach(table => {
    table.fields.forEach(field => {
      if (field.isForeignKey) {
        constraints.push({
          name: `fk_${table.name}_${field.name}`,
          table: table.name,
          type: 'foreign_key',
          columns: [field.name],
          referencedTable: field.name.replace('_id', ''),
          referencedColumns: ['id'],
        });
      }
    });
  });
  
  return constraints;
}

/**
 * Generates table indexes for a specific table
 */
function generateTableIndexes(tableName: string): any[] {
  return [
    {
      name: `pk_${tableName}`,
      columns: ['id'],
      unique: true,
      type: 'primary',
    },
    {
      name: `idx_${tableName}_created_at`,
      columns: ['created_at'],
      unique: false,
      type: 'btree',
    },
  ];
}

/**
 * Generates table constraints for a specific table
 */
function generateTableConstraints(tableName: string): any[] {
  return [
    {
      name: `pk_${tableName}`,
      type: 'primary_key',
      columns: ['id'],
    },
  ];
}

/**
 * Generates a large set of table names for performance testing
 */
function generateLargeTableSet(count: number): string[] {
  const prefixes = ['user', 'product', 'order', 'item', 'log', 'event', 'data', 'record'];
  const suffixes = ['details', 'history', 'summary', 'archive', 'temp', 'backup'];
  const tables: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const prefix = prefixes[i % prefixes.length];
    const suffix = suffixes[Math.floor(i / prefixes.length) % suffixes.length];
    const number = Math.floor(i / (prefixes.length * suffixes.length)) + 1;
    tables.push(`${prefix}_${suffix}_${number}`);
  }
  
  return tables;
}

/**
 * Factory for creating database connection test scenarios
 * @param scenarios - Array of test scenario configurations
 * @returns Array of connection test results
 */
export function connectionTestScenariosFactory(
  scenarios: Array<{ type: DatabaseType; success: boolean; errorType?: string }>
): ConnectionTestResult[] {
  return scenarios.map(({ type, success, errorType }) => {
    if (!success) {
      const errorMap = {
        timeout: { timeout: true },
        auth: { customError: 'Authentication failed: Invalid credentials' },
        network: { customError: 'Network unreachable: Connection refused' },
        permission: { customError: 'Permission denied: Insufficient privileges' },
      };
      
      return connectionTestResultFactory(errorMap[errorType as keyof typeof errorMap] || {});
    }
    
    return connectionTestResultFactory({ 
      success: true, 
      withPerformanceMetrics: true 
    });
  });
}

/**
 * Bulk factory for creating multiple database services for testing
 * @param types - Array of database types to create services for
 * @param baseOptions - Base options to apply to all services
 * @returns Array of database service configurations
 */
export function bulkDatabaseServicesFactory(
  types: DatabaseType[],
  baseOptions: DatabaseFactoryOptions = {}
): DatabaseService[] {
  return types.map((type, index) => 
    databaseServiceFactory(type, {
      ...baseOptions,
      id: (baseOptions.id || 100) + index,
    })
  );
}

/**
 * Performance testing data factory for large dataset scenarios
 * @param options - Performance test configuration
 * @returns Large dataset configuration for testing virtual scrolling and pagination
 */
export function performanceTestDataFactory(options: {
  tableCount?: number;
  recordsPerTable?: number;
  includeComplexRelationships?: boolean;
}) {
  const { tableCount = 1000, recordsPerTable = 10000, includeComplexRelationships = true } = options;
  
  return {
    schema: databaseSchemaFactory('postgresql', {
      tableCount,
      fieldsPerTable: 8,
      includeRelationships: includeComplexRelationships,
      withLargeDataset: true,
    }),
    connectionTest: connectionTestResultFactory({
      success: true,
      withPerformanceMetrics: true,
    }),
    estimatedRecords: tableCount * recordsPerTable,
    performanceMetrics: {
      expectedLoadTime: Math.floor(tableCount / 100) * 1000, // 1s per 100 tables
      memoryUsage: Math.floor(tableCount * recordsPerTable * 0.001), // Estimated MB
      virtualScrollThreshold: 100,
      paginationSize: 50,
    },
  };
}