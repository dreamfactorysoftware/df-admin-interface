/**
 * Database service configuration fixture factory functions for React/Next.js testing
 * 
 * Generates realistic database connection data for testing React components and API 
 * generation workflows. Provides comprehensive factory functions for creating database 
 * services, connection configurations, and schema metadata to support testing of 
 * database management interfaces.
 * 
 * Features:
 * - Multi-database type support (MySQL, PostgreSQL, MongoDB, Oracle, Snowflake)
 * - Connection validation result generation for testing database connectivity scenarios
 * - Schema metadata factories for testing schema discovery functionality
 * - Connection pooling and performance tuning parameter generation
 * - Type-safe factories compatible with React Query and SWR caching
 * - Virtual scrolling test data for large schemas (1000+ tables)
 * - Realistic error scenarios for comprehensive testing coverage
 * 
 * @see Technical Specification Section F-001 (Database Service Connection Management)
 * @see Technical Specification Section F-002 (Schema Discovery and Browsing)
 */

import { 
  DatabaseConfig,
  DatabaseType,
  DatabaseService,
  DatabaseServiceType,
  MySQLConfig,
  PostgreSQLConfig,
  MongoDBConfig,
  OracleConfig,
  SnowflakeConfig,
  ConnectionTestRequest,
  ConnectionTestResult,
  ConnectionCapabilities,
  SSLConfig,
  PoolingConfig,
  DEFAULT_DATABASE_CONFIGS,
  DATABASE_TYPE_METADATA,
} from '../../types/database';

import {
  SchemaData,
  SchemaTable,
  SchemaField,
  TableRelated,
  SchemaView,
  StoredProcedure,
  DatabaseFunction,
  Sequence,
  SchemaLoadingState,
  ProgressiveSchemaData,
  VirtualScrollItem,
  SchemaPerformanceMetrics,
  TreeNodeType,
  SchemaTreeNode,
} from '../../types/schema';

import { createCompleteTestDataSet } from '../utils/component-factories';

// =============================================================================
// DATABASE SERVICE FACTORY FUNCTIONS
// =============================================================================

/**
 * Base database service factory function
 * Creates a complete database service configuration with all required metadata
 */
export const databaseServiceFactory = (
  type: DatabaseType,
  overrides: Partial<DatabaseService> = {}
): DatabaseService => {
  const baseService: DatabaseService = {
    id: 1,
    name: `test-${type}-service`,
    label: `Test ${DATABASE_TYPE_METADATA[type].label} Service`,
    description: `Test ${type} database service for unit testing`,
    type,
    isActive: true,
    config: createDatabaseConfig(type),
    createdDate: '2024-01-01T00:00:00.000Z',
    lastModifiedDate: '2024-01-01T00:00:00.000Z',
    createdById: 1,
    lastModifiedById: 1,
    mutable: true,
    deletable: true,
    refresh: false,
  };

  return { ...baseService, ...overrides };
};

/**
 * MySQL database service factory
 * Generates MySQL-specific configuration with realistic defaults
 */
export const mysqlServiceFactory = (
  overrides: Partial<DatabaseService> = {}
): DatabaseService => {
  return databaseServiceFactory('mysql', {
    name: 'test-mysql-db',
    label: 'Test MySQL Database',
    config: mysqlConfigFactory(),
    ...overrides,
  });
};

/**
 * PostgreSQL database service factory
 * Generates PostgreSQL-specific configuration with realistic defaults
 */
export const postgresqlServiceFactory = (
  overrides: Partial<DatabaseService> = {}
): DatabaseService => {
  return databaseServiceFactory('postgresql', {
    name: 'test-postgresql-db',
    label: 'Test PostgreSQL Database',
    config: postgresqlConfigFactory(),
    ...overrides,
  });
};

/**
 * MongoDB database service factory
 * Generates MongoDB-specific configuration with realistic defaults
 */
export const mongodbServiceFactory = (
  overrides: Partial<DatabaseService> = {}
): DatabaseService => {
  return databaseServiceFactory('mongodb', {
    name: 'test-mongodb',
    label: 'Test MongoDB Database',
    config: mongodbConfigFactory(),
    ...overrides,
  });
};

/**
 * Oracle database service factory
 * Generates Oracle-specific configuration with realistic defaults
 */
export const oracleServiceFactory = (
  overrides: Partial<DatabaseService> = {}
): DatabaseService => {
  return databaseServiceFactory('oracle', {
    name: 'test-oracle-db',
    label: 'Test Oracle Database',
    config: oracleConfigFactory(),
    ...overrides,
  });
};

/**
 * Snowflake database service factory
 * Generates Snowflake-specific configuration with realistic defaults
 */
export const snowflakeServiceFactory = (
  overrides: Partial<DatabaseService> = {}
): DatabaseService => {
  return databaseServiceFactory('snowflake', {
    name: 'test-snowflake-db',
    label: 'Test Snowflake Database',
    config: snowflakeConfigFactory(),
    ...overrides,
  });
};

// =============================================================================
// DATABASE CONFIGURATION FACTORY FUNCTIONS
// =============================================================================

/**
 * Generic database configuration factory
 * Creates configuration based on database type with appropriate defaults
 */
export const createDatabaseConfig = (
  type: DatabaseType,
  overrides: Partial<DatabaseConfig> = {}
): DatabaseConfig => {
  const configs = {
    mysql: mysqlConfigFactory,
    postgresql: postgresqlConfigFactory,
    mongodb: mongodbConfigFactory,
    oracle: oracleConfigFactory,
    snowflake: snowflakeConfigFactory,
  };

  const factory = configs[type];
  return factory(overrides as any);
};

/**
 * MySQL configuration factory
 * Generates realistic MySQL connection parameters with security considerations
 */
export const mysqlConfigFactory = (
  overrides: Partial<MySQLConfig> = {}
): MySQLConfig => {
  const baseConfig: MySQLConfig = {
    name: 'test-mysql',
    label: 'Test MySQL Connection',
    description: 'MySQL database connection for testing',
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    database: 'test_dreamfactory',
    username: 'df_test_user',
    password: 'secure_test_password_123',
    isActive: true,
    charset: 'utf8mb4',
    timezone: 'UTC',
    strictMode: true,
    flags: ['FOUND_ROWS'],
    ssl: sslConfigFactory(),
    pooling: poolingConfigFactory(),
    connectionTimeout: 5000,
    queryTimeout: 30000,
    options: {
      autoReconnect: true,
      reconnectDelay: 2000,
      maxReconnects: 3,
    },
  };

  return { ...baseConfig, ...overrides };
};

/**
 * PostgreSQL configuration factory
 * Generates realistic PostgreSQL connection parameters with advanced features
 */
export const postgresqlConfigFactory = (
  overrides: Partial<PostgreSQLConfig> = {}
): PostgreSQLConfig => {
  const baseConfig: PostgreSQLConfig = {
    name: 'test-postgresql',
    label: 'Test PostgreSQL Connection',
    description: 'PostgreSQL database connection for testing',
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: 'test_dreamfactory',
    username: 'df_test_user',
    password: 'secure_test_password_123',
    isActive: true,
    searchPath: ['public', 'test_schema'],
    applicationName: 'DreamFactory Test Suite',
    statementTimeout: 30000,
    sslVerification: false,
    ssl: sslConfigFactory({ enabled: false }),
    pooling: poolingConfigFactory({ max: 20 }),
    connectionTimeout: 5000,
    queryTimeout: 30000,
    options: {
      timezone: 'UTC',
      commandTimeout: 30000,
      queryTimeout: 30000,
    },
  };

  return { ...baseConfig, ...overrides };
};

/**
 * MongoDB configuration factory
 * Generates realistic MongoDB connection parameters with replica set support
 */
export const mongodbConfigFactory = (
  overrides: Partial<MongoDBConfig> = {}
): MongoDBConfig => {
  const baseConfig: MongoDBConfig = {
    name: 'test-mongodb',
    label: 'Test MongoDB Connection',
    description: 'MongoDB database connection for testing',
    type: 'mongodb',
    host: 'localhost',
    port: 27017,
    username: 'df_test_user',
    password: 'secure_test_password_123',
    isActive: true,
    uri: 'mongodb://df_test_user:secure_test_password_123@localhost:27017/test_dreamfactory',
    defaultDatabase: 'test_dreamfactory',
    authDatabase: 'admin',
    replicaSet: 'rs0',
    readPreference: 'primary',
    writeConcern: {
      w: 'majority',
      j: true,
      wtimeout: 10000,
    },
    ssl: sslConfigFactory({ enabled: false }),
    pooling: poolingConfigFactory({ max: 50, min: 5 }),
    connectionTimeout: 5000,
    queryTimeout: 30000,
    options: {
      maxPoolSize: 50,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    },
  };

  return { ...baseConfig, ...overrides };
};

/**
 * Oracle configuration factory
 * Generates realistic Oracle connection parameters with enterprise features
 */
export const oracleConfigFactory = (
  overrides: Partial<OracleConfig> = {}
): OracleConfig => {
  const baseConfig: OracleConfig = {
    name: 'test-oracle',
    label: 'Test Oracle Connection',
    description: 'Oracle database connection for testing',
    type: 'oracle',
    host: 'localhost',
    port: 1521,
    database: 'XE',
    username: 'df_test_user',
    password: 'secure_test_password_123',
    isActive: true,
    serviceName: 'XE',
    tnsConnectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=XE)))',
    edition: 'standard',
    enableWallet: false,
    walletLocation: null,
    ssl: sslConfigFactory({ enabled: false }),
    pooling: poolingConfigFactory({ max: 15, min: 2 }),
    connectionTimeout: 5000,
    queryTimeout: 60000,
    options: {
      autoCommit: false,
      maxRows: 1000,
      outFormat: 'OBJECT',
      fetchArraySize: 100,
    },
  };

  return { ...baseConfig, ...overrides };
};

/**
 * Snowflake configuration factory
 * Generates realistic Snowflake connection parameters with cloud features
 */
export const snowflakeConfigFactory = (
  overrides: Partial<SnowflakeConfig> = {}
): SnowflakeConfig => {
  const baseConfig: SnowflakeConfig = {
    name: 'test-snowflake',
    label: 'Test Snowflake Connection',
    description: 'Snowflake data warehouse connection for testing',
    type: 'snowflake',
    host: 'test-account.snowflakecomputing.com',
    port: 443,
    database: 'TEST_DATABASE',
    username: 'DF_TEST_USER',
    password: 'secure_test_password_123',
    isActive: true,
    account: 'test-account',
    warehouse: 'TEST_WAREHOUSE',
    role: 'DF_ROLE',
    sessionParameters: {
      QUERY_TAG: 'DreamFactory_Test',
      TIMESTAMP_OUTPUT_FORMAT: 'YYYY-MM-DD HH24:MI:SS.FF3 TZHTZM',
      TIMESTAMP_TYPE_MAPPING: 'TIMESTAMP_NTZ',
    },
    privateKey: null,
    privateKeyPassphrase: null,
    ssl: sslConfigFactory({ enabled: true, mode: 'require' }),
    pooling: poolingConfigFactory({ max: 10, min: 1 }),
    connectionTimeout: 5000,
    queryTimeout: 300000, // 5 minutes for complex queries
    options: {
      application: 'DreamFactory',
      insecureConnect: false,
      ocspFailOpen: true,
      validateDefaultParameters: true,
    },
  };

  return { ...baseConfig, ...overrides };
};

// =============================================================================
// CONNECTION CONFIGURATION HELPER FACTORIES
// =============================================================================

/**
 * SSL configuration factory
 * Generates SSL/TLS configuration for secure database connections
 */
export const sslConfigFactory = (
  overrides: Partial<SSLConfig> = {}
): SSLConfig => {
  const baseConfig: SSLConfig = {
    enabled: true,
    mode: 'prefer',
    cert: null,
    key: null,
    ca: null,
    rejectUnauthorized: false,
    serverName: null,
    ciphers: 'HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.3',
  };

  return { ...baseConfig, ...overrides };
};

/**
 * Connection pooling configuration factory
 * Generates optimized pooling settings for database connections
 */
export const poolingConfigFactory = (
  overrides: Partial<PoolingConfig> = {}
): PoolingConfig => {
  const baseConfig: PoolingConfig = {
    enabled: true,
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 10000,
    evictionRunIntervalMillis: 60000,
    softIdleTimeoutMillis: 25000,
    testOnBorrow: true,
    testOnReturn: false,
    testWhileIdle: true,
    validationQuery: 'SELECT 1',
  };

  return { ...baseConfig, ...overrides };
};

// =============================================================================
// CONNECTION TEST RESULT FACTORIES
// =============================================================================

/**
 * Connection test result factory
 * Generates realistic connection validation responses for testing scenarios
 */
export const connectionTestResultFactory = (
  success: boolean = true,
  overrides: Partial<ConnectionTestResult> = {}
): ConnectionTestResult => {
  const timestamp = new Date().toISOString();
  const duration = success ? Math.floor(Math.random() * 1000) + 100 : 5000;

  const baseResult: ConnectionTestResult = {
    success,
    duration,
    timestamp,
    message: success 
      ? 'Connection established successfully'
      : 'Failed to establish database connection',
    serverVersion: success ? generateServerVersion() : undefined,
    availableSchemas: success ? generateAvailableSchemas() : undefined,
    capabilities: success ? connectionCapabilitiesFactory() : undefined,
    error: success ? undefined : {
      code: 'CONNECTION_FAILED',
      message: 'Unable to connect to database server',
      details: {
        errno: 2003,
        code: 'ER_CANT_CONNECT',
        sqlState: 'HY000',
        sqlMessage: 'Can\'t connect to MySQL server on \'localhost\' (10061)',
      },
    },
  };

  return { ...baseResult, ...overrides };
};

/**
 * Connection test request factory
 * Generates test requests for database connection validation
 */
export const connectionTestRequestFactory = (
  type: DatabaseType,
  overrides: Partial<ConnectionTestRequest> = {}
): ConnectionTestRequest => {
  const baseRequest: ConnectionTestRequest = {
    config: createDatabaseConfig(type),
    timeout: 5000,
    testSchema: true,
    testWrite: false,
  };

  return { ...baseRequest, ...overrides };
};

/**
 * Connection capabilities factory
 * Generates database feature capabilities for testing
 */
export const connectionCapabilitiesFactory = (
  overrides: Partial<ConnectionCapabilities> = {}
): ConnectionCapabilities => {
  const baseCapabilities: ConnectionCapabilities = {
    transactions: true,
    foreignKeys: true,
    storedProcedures: true,
    views: true,
    fullTextSearch: true,
    jsonSupport: true,
    maxConnections: 151,
    charsets: ['utf8', 'utf8mb4', 'latin1', 'ascii'],
  };

  return { ...baseCapabilities, ...overrides };
};

// =============================================================================
// SCHEMA METADATA FACTORY FUNCTIONS
// =============================================================================

/**
 * Database schema factory
 * Generates comprehensive schema metadata for testing schema discovery functionality
 */
export const databaseSchemaFactory = (
  serviceName: string = 'test-service',
  tableCount: number = 10,
  overrides: Partial<SchemaData> = {}
): SchemaData => {
  const tables = generateSchemaTablesFactory(tableCount);
  const views = generateSchemaViewsFactory(Math.floor(tableCount * 0.3));
  const procedures = generateStoredProceduresFactory(Math.floor(tableCount * 0.2));
  const functions = generateDatabaseFunctionsFactory(Math.floor(tableCount * 0.1));
  const sequences = generateSequencesFactory(Math.floor(tableCount * 0.15));

  const baseSchema: SchemaData = {
    serviceName,
    serviceId: 1,
    databaseName: 'test_database',
    schemaName: 'public',
    tables,
    views,
    procedures,
    functions,
    sequences,
    lastDiscovered: new Date().toISOString(),
    totalTables: tables.length,
    totalFields: tables.reduce((sum, table) => sum + table.fields.length, 0),
    totalRelationships: tables.reduce((sum, table) => sum + table.related.length, 0),
    virtualScrollingEnabled: tableCount > 100,
    pageSize: tableCount > 100 ? 50 : tableCount,
    estimatedRowHeight: 48,
    loadingState: schemaLoadingStateFactory(),
    progressiveData: tableCount > 100 ? progressiveSchemaDataFactory(tableCount) : undefined,
  };

  return { ...baseSchema, ...overrides };
};

/**
 * Schema table factory
 * Generates realistic table metadata with fields and relationships
 */
export const schemaTableFactory = (
  name: string,
  fieldCount: number = 5,
  overrides: Partial<SchemaTable> = {}
): SchemaTable => {
  const fields = generateSchemaFieldsFactory(fieldCount, name);
  const primaryKey = fields.filter(f => f.isPrimaryKey).map(f => f.name);

  const baseTable: SchemaTable = {
    id: `table_${name}`,
    name,
    label: name.charAt(0).toUpperCase() + name.slice(1),
    description: `${name} table for testing`,
    schema: 'public',
    alias: name,
    plural: `${name}s`,
    isView: false,
    fields,
    primaryKey,
    foreignKeys: generateForeignKeysFactory(fields),
    indexes: generateTableIndexesFactory(name, fields),
    constraints: generateTableConstraintsFactory(name, fields),
    triggers: generateTriggersFactory(name),
    related: generateTableRelationshipsFactory(name),
    nameField: fields.find(f => f.type === 'string')?.name || 'name',
    rowCount: Math.floor(Math.random() * 10000) + 100,
    estimatedSize: generateEstimatedSize(),
    lastModified: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    collation: 'utf8mb4_unicode_ci',
    engine: 'InnoDB',
    access: 31, // Full CRUD access
    virtualIndex: 0,
    virtualHeight: 48,
    isVisible: true,
    expanded: false,
    selected: false,
    level: 0,
    hasChildren: true,
    isLoading: false,
    apiEnabled: true,
    generatedEndpoints: [
      `GET /api/v2/${name}`,
      `POST /api/v2/${name}`,
      `GET /api/v2/${name}/{id}`,
      `PUT /api/v2/${name}/{id}`,
      `PATCH /api/v2/${name}/{id}`,
      `DELETE /api/v2/${name}/{id}`,
    ],
    cacheKey: `schema_table_${name}_${Date.now()}`,
    lastCacheUpdate: new Date().toISOString(),
  };

  return { ...baseTable, ...overrides };
};

/**
 * Schema field factory
 * Generates realistic field metadata with validation and constraints
 */
export const schemaFieldFactory = (
  name: string,
  type: string = 'string',
  overrides: Partial<SchemaField> = {}
): SchemaField => {
  const isPrimaryKey = name === 'id' || name.endsWith('_id') && name === 'id';
  const isForeignKey = name.endsWith('_id') && name !== 'id';

  const baseField: SchemaField = {
    id: `field_${name}`,
    name,
    label: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
    description: `${name} field`,
    alias: name,
    type: type as any,
    dbType: getDbTypeFromType(type),
    length: getDefaultLengthForType(type),
    precision: type.includes('decimal') ? 10 : undefined,
    scale: type.includes('decimal') ? 2 : undefined,
    defaultValue: getDefaultValueForType(type),
    isNullable: !isPrimaryKey,
    allowNull: !isPrimaryKey,
    isPrimaryKey,
    isForeignKey,
    isUnique: isPrimaryKey || name === 'email',
    isIndex: isPrimaryKey || isForeignKey,
    isAutoIncrement: isPrimaryKey && type === 'integer',
    isComputed: false,
    isVirtual: false,
    isAggregate: false,
    required: isPrimaryKey || name === 'email',
    fixedLength: false,
    supportsMultibyte: type === 'string' || type === 'text',
    refTable: isForeignKey ? name.replace('_id', '') : undefined,
    refField: isForeignKey ? 'id' : undefined,
    refOnUpdate: isForeignKey ? 'CASCADE' : undefined,
    refOnDelete: isForeignKey ? 'SET NULL' : undefined,
    validation: generateFieldValidation(name, type),
    constraints: [],
    picklist: name === 'status' ? ['active', 'inactive', 'pending'] : undefined,
    format: generateFieldFormat(type),
    hidden: name === 'password' || name.includes('secret'),
    dbFunction: [],
    native: [],
    value: [],
  };

  return { ...baseField, ...overrides };
};

// =============================================================================
// LARGE DATASET FACTORY FUNCTIONS FOR PERFORMANCE TESTING
// =============================================================================

/**
 * Large schema factory for virtual scrolling testing
 * Generates schemas with 1000+ tables for performance testing
 */
export const largeSchemaFactory = (
  tableCount: number = 1500,
  serviceName: string = 'large-test-service'
): SchemaData => {
  console.log(`Generating large schema with ${tableCount} tables for performance testing...`);
  
  return databaseSchemaFactory(serviceName, tableCount, {
    virtualScrollingEnabled: true,
    pageSize: 50,
    progressiveData: progressiveSchemaDataFactory(tableCount),
  });
};

/**
 * Virtual scroll item factory
 * Generates virtual scroll items for testing TanStack Virtual integration
 */
export const virtualScrollItemFactory = (
  index: number,
  table: SchemaTable
): VirtualScrollItem => {
  return {
    index,
    key: `virtual_item_${table.id}`,
    data: table,
    height: 48,
    isVisible: true,
    isLoaded: true,
  };
};

/**
 * Schema performance metrics factory
 * Generates performance metrics for monitoring schema operations
 */
export const schemaPerformanceMetricsFactory = (
  tableCount: number = 100
): SchemaPerformanceMetrics => {
  return {
    discoveryTime: Math.floor(Math.random() * 2000) + 500,
    renderTime: Math.floor(Math.random() * 100) + 10,
    cacheHitRate: Math.random() * 0.3 + 0.7, // 70-100%
    totalTables: tableCount,
    loadedTables: Math.min(tableCount, 50),
    averageTableSize: Math.floor(Math.random() * 1000) + 100,
    virtualItemsRendered: Math.min(tableCount, 20),
    virtualScrollPosition: 0,
    virtualScrollHeight: tableCount * 48,
    estimatedMemoryUsage: tableCount * 2048, // bytes per table
    cacheSize: Math.floor(tableCount * 0.1) * 1024,
    errors: [],
    warnings: tableCount > 1000 ? [
      {
        type: 'performance_concern',
        message: 'Large schema detected, consider enabling progressive loading',
        timestamp: new Date().toISOString(),
        suggestion: 'Enable virtual scrolling for better performance',
      },
    ] : [],
  };
};

// =============================================================================
// TREE STRUCTURE FACTORIES FOR HIERARCHICAL DISPLAY
// =============================================================================

/**
 * Schema tree node factory
 * Generates tree nodes for hierarchical schema display
 */
export const schemaTreeNodeFactory = (
  type: TreeNodeType,
  name: string,
  level: number = 0,
  overrides: Partial<SchemaTreeNode> = {}
): SchemaTreeNode => {
  const baseNode: SchemaTreeNode = {
    id: `${type}_${name}_${level}`,
    type,
    name,
    label: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
    description: `${type} node: ${name}`,
    parentId: level > 0 ? `parent_${level - 1}` : undefined,
    children: [],
    level,
    index: 0,
    expanded: level < 2,
    selected: false,
    isLoading: false,
    hasChildren: type === 'database' || type === 'schema' || type === 'tables' || type === 'table',
    virtualIndex: 0,
    virtualHeight: 32,
    isVisible: true,
    data: type === 'table' ? schemaTableFactory(name) : undefined,
    cacheKey: `tree_node_${type}_${name}_${Date.now()}`,
    lastUpdated: new Date().toISOString(),
  };

  return { ...baseNode, ...overrides };
};

// =============================================================================
// ERROR SCENARIO FACTORIES
// =============================================================================

/**
 * Connection error scenarios factory
 * Generates various connection failure scenarios for testing error handling
 */
export const connectionErrorScenariosFactory = () => {
  return {
    timeout: connectionTestResultFactory(false, {
      duration: 5000,
      message: 'Connection timeout after 5000ms',
      error: {
        code: 'CONNECTION_TIMEOUT',
        message: 'Connection timeout',
        details: { timeout: 5000, attempted: 'localhost:3306' },
      },
    }),
    
    invalidCredentials: connectionTestResultFactory(false, {
      duration: 1500,
      message: 'Access denied for user',
      error: {
        code: 'ACCESS_DENIED',
        message: 'Access denied for user \'testuser\'@\'localhost\' (using password: YES)',
        details: { errno: 1045, sqlState: '28000' },
      },
    }),
    
    hostNotFound: connectionTestResultFactory(false, {
      duration: 3000,
      message: 'Host not found',
      error: {
        code: 'HOST_NOT_FOUND',
        message: 'getaddrinfo ENOTFOUND invalid-host',
        details: { errno: 'ENOTFOUND', hostname: 'invalid-host' },
      },
    }),
    
    portClosed: connectionTestResultFactory(false, {
      duration: 2000,
      message: 'Connection refused',
      error: {
        code: 'CONNECTION_REFUSED',
        message: 'connect ECONNREFUSED 127.0.0.1:3307',
        details: { errno: 'ECONNREFUSED', port: 3307 },
      },
    }),
    
    databaseNotFound: connectionTestResultFactory(false, {
      duration: 1000,
      message: 'Unknown database',
      error: {
        code: 'DATABASE_NOT_FOUND',
        message: 'Unknown database \'nonexistent_db\'',
        details: { errno: 1049, sqlState: '42000' },
      },
    }),
    
    sslRequired: connectionTestResultFactory(false, {
      duration: 800,
      message: 'SSL connection required',
      error: {
        code: 'SSL_REQUIRED',
        message: 'SSL connection is required. Please specify SSL options and retry.',
        details: { sslMode: 'REQUIRED' },
      },
    }),
  };
};

// =============================================================================
// MULTI-DATABASE TYPE COLLECTION FACTORIES
// =============================================================================

/**
 * All database types collection factory
 * Generates services for all supported database types
 */
export const allDatabaseTypesFactory = () => {
  return {
    mysql: mysqlServiceFactory(),
    postgresql: postgresqlServiceFactory(),
    mongodb: mongodbServiceFactory(),
    oracle: oracleServiceFactory(),
    snowflake: snowflakeServiceFactory(),
  };
};

/**
 * Database service type definitions factory
 * Generates service type metadata for all supported databases
 */
export const databaseServiceTypesFactory = (): DatabaseServiceType[] => {
  const types: DatabaseType[] = ['mysql', 'postgresql', 'mongodb', 'oracle', 'snowflake'];
  
  return types.map(type => ({
    name: type,
    label: DATABASE_TYPE_METADATA[type].label,
    description: DATABASE_TYPE_METADATA[type].description,
    group: DATABASE_TYPE_METADATA[type].group,
    class: `Database\\${type.charAt(0).toUpperCase() + type.slice(1)}\\Connection`,
    configSchema: generateConfigSchemaForType(type),
    icon: DATABASE_TYPE_METADATA[type].icon,
    features: DATABASE_TYPE_METADATA[type].features,
    versions: getVersionsForType(type),
    licenseRequired: type === 'oracle' ? 'gold' : 'open_source',
  }));
};

/**
 * Complete test dataset factory for comprehensive testing
 * Combines all factory functions for complete test coverage
 */
export const completeDatabaseTestDatasetFactory = () => {
  return {
    services: allDatabaseTypesFactory(),
    schemas: {
      small: databaseSchemaFactory('small-service', 5),
      medium: databaseSchemaFactory('medium-service', 50),
      large: largeSchemaFactory(1000),
      virtual: largeSchemaFactory(1500),
    },
    connections: {
      success: connectionTestResultFactory(true),
      errors: connectionErrorScenariosFactory(),
    },
    configurations: {
      ssl: sslConfigFactory(),
      pooling: poolingConfigFactory(),
    },
    performance: {
      small: schemaPerformanceMetricsFactory(5),
      medium: schemaPerformanceMetricsFactory(50),
      large: schemaPerformanceMetricsFactory(1000),
    },
    serviceTypes: databaseServiceTypesFactory(),
  };
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generates schema tables for testing
 */
function generateSchemaTablesFactory(count: number): SchemaTable[] {
  const commonTables = ['users', 'orders', 'products', 'categories', 'customers'];
  const tables: SchemaTable[] = [];

  // Add common tables first
  commonTables.slice(0, Math.min(count, commonTables.length)).forEach((name, index) => {
    tables.push(schemaTableFactory(name, 5 + index, { virtualIndex: index }));
  });

  // Add generated tables for the rest
  for (let i = commonTables.length; i < count; i++) {
    const name = `table_${i.toString().padStart(4, '0')}`;
    tables.push(schemaTableFactory(name, Math.floor(Math.random() * 10) + 3, { virtualIndex: i }));
  }

  return tables;
}

/**
 * Generates schema fields for a table
 */
function generateSchemaFieldsFactory(count: number, tableName: string): SchemaField[] {
  const fields: SchemaField[] = [];
  
  // Always add ID field first
  fields.push(schemaFieldFactory('id', 'integer', { isPrimaryKey: true, isAutoIncrement: true }));
  
  // Add common fields based on table name
  const commonFields = getCommonFieldsForTable(tableName);
  commonFields.slice(0, count - 1).forEach(({ name, type, options }) => {
    fields.push(schemaFieldFactory(name, type, options));
  });

  // Fill remaining slots with generated fields
  for (let i = fields.length; i < count; i++) {
    const fieldName = `field_${i}`;
    const fieldType = getRandomFieldType();
    fields.push(schemaFieldFactory(fieldName, fieldType));
  }

  return fields;
}

/**
 * Gets common fields for specific table types
 */
function getCommonFieldsForTable(tableName: string): Array<{ name: string; type: string; options?: Partial<SchemaField> }> {
  const fieldSets: Record<string, Array<{ name: string; type: string; options?: Partial<SchemaField> }>> = {
    users: [
      { name: 'email', type: 'string', options: { isUnique: true, required: true } },
      { name: 'first_name', type: 'string', options: { required: true } },
      { name: 'last_name', type: 'string', options: { required: true } },
      { name: 'password', type: 'string', options: { hidden: true, required: true } },
      { name: 'is_active', type: 'boolean', options: { defaultValue: true } },
      { name: 'created_at', type: 'timestamp' },
      { name: 'updated_at', type: 'timestamp' },
    ],
    orders: [
      { name: 'user_id', type: 'integer', options: { isForeignKey: true, refTable: 'users' } },
      { name: 'order_number', type: 'string', options: { isUnique: true } },
      { name: 'total_amount', type: 'decimal', options: { precision: 10, scale: 2 } },
      { name: 'status', type: 'string', options: { picklist: ['pending', 'processing', 'shipped', 'delivered'] } },
      { name: 'created_at', type: 'timestamp' },
      { name: 'updated_at', type: 'timestamp' },
    ],
    products: [
      { name: 'name', type: 'string', options: { required: true } },
      { name: 'description', type: 'text' },
      { name: 'price', type: 'decimal', options: { precision: 10, scale: 2 } },
      { name: 'sku', type: 'string', options: { isUnique: true } },
      { name: 'category_id', type: 'integer', options: { isForeignKey: true, refTable: 'categories' } },
      { name: 'is_active', type: 'boolean', options: { defaultValue: true } },
      { name: 'created_at', type: 'timestamp' },
    ],
  };

  return fieldSets[tableName] || [
    { name: 'name', type: 'string' },
    { name: 'description', type: 'text' },
    { name: 'is_active', type: 'boolean' },
    { name: 'created_at', type: 'timestamp' },
    { name: 'updated_at', type: 'timestamp' },
  ];
}

/**
 * Gets random field type for generated fields
 */
function getRandomFieldType(): string {
  const types = ['string', 'integer', 'boolean', 'timestamp', 'text', 'decimal'];
  return types[Math.floor(Math.random() * types.length)];
}

/**
 * Gets database type from field type
 */
function getDbTypeFromType(type: string): string {
  const typeMap: Record<string, string> = {
    integer: 'int(11)',
    string: 'varchar(255)',
    text: 'text',
    boolean: 'tinyint(1)',
    timestamp: 'timestamp',
    decimal: 'decimal(10,2)',
    date: 'date',
    datetime: 'datetime',
    float: 'float',
    double: 'double',
  };
  return typeMap[type] || 'varchar(255)';
}

/**
 * Gets default length for field type
 */
function getDefaultLengthForType(type: string): number | undefined {
  const lengthMap: Record<string, number> = {
    string: 255,
    integer: 11,
    boolean: 1,
    decimal: 10,
  };
  return lengthMap[type];
}

/**
 * Gets default value for field type
 */
function getDefaultValueForType(type: string): any {
  const defaultMap: Record<string, any> = {
    boolean: false,
    timestamp: 'CURRENT_TIMESTAMP',
    integer: 0,
    decimal: '0.00',
  };
  return defaultMap[type] || null;
}

/**
 * Generates field validation rules
 */
function generateFieldValidation(name: string, type: string): any {
  if (name === 'email') {
    return { format: 'email', required: true };
  }
  if (name === 'password') {
    return { minLength: 8, required: true };
  }
  if (type === 'integer') {
    return { min: 0 };
  }
  return null;
}

/**
 * Generates field format configuration
 */
function generateFieldFormat(type: string): any {
  if (type === 'decimal') {
    return { currencyCode: 'USD', thousandsSeparator: ',', decimalSeparator: '.' };
  }
  if (type === 'timestamp') {
    return { dateFormat: 'YYYY-MM-DD HH:mm:ss' };
  }
  return null;
}

/**
 * Additional helper functions for generating related data
 */
function generateForeignKeysFactory(fields: SchemaField[]): any[] {
  return fields
    .filter(f => f.isForeignKey)
    .map(f => ({
      name: `fk_${f.name}`,
      field: f.name,
      referencedTable: f.refTable!,
      referencedField: f.refField!,
      onDelete: f.refOnDelete,
      onUpdate: f.refOnUpdate,
    }));
}

function generateTableIndexesFactory(tableName: string, fields: SchemaField[]): any[] {
  const indexes: any[] = [];
  
  // Primary key index
  const pkFields = fields.filter(f => f.isPrimaryKey);
  if (pkFields.length > 0) {
    indexes.push({
      name: 'PRIMARY',
      fields: pkFields.map(f => f.name),
      unique: true,
      type: 'btree',
    });
  }

  // Unique indexes
  fields.filter(f => f.isUnique && !f.isPrimaryKey).forEach(f => {
    indexes.push({
      name: `uk_${tableName}_${f.name}`,
      fields: [f.name],
      unique: true,
      type: 'btree',
    });
  });

  return indexes;
}

function generateTableConstraintsFactory(tableName: string, fields: SchemaField[]): any[] {
  const constraints: any[] = [];
  
  fields.filter(f => f.isForeignKey).forEach(f => {
    constraints.push({
      name: `fk_${tableName}_${f.name}`,
      type: 'foreign_key',
      definition: `FOREIGN KEY (${f.name}) REFERENCES ${f.refTable}(${f.refField})`,
      fields: [f.name],
    });
  });

  return constraints;
}

function generateTriggersFactory(tableName: string): any[] {
  return [
    {
      name: `trg_${tableName}_updated_at`,
      timing: 'BEFORE',
      events: ['UPDATE'],
      definition: `SET NEW.updated_at = CURRENT_TIMESTAMP`,
      enabled: true,
    },
  ];
}

function generateTableRelationshipsFactory(tableName: string): TableRelated[] {
  // Generate some basic relationships for common table types
  if (tableName === 'users') {
    return [
      {
        id: `rel_${tableName}_orders`,
        alias: 'orders',
        name: 'orders',
        label: 'Orders',
        type: 'has_many',
        field: 'id',
        isVirtual: true,
        refServiceId: 1,
        refTable: 'orders',
        refField: 'user_id',
        alwaysFetch: false,
        flatten: false,
        flattenDropPrefix: false,
      },
    ];
  }
  
  if (tableName === 'orders') {
    return [
      {
        id: `rel_${tableName}_user`,
        alias: 'user',
        name: 'user',
        label: 'User',
        type: 'belongs_to',
        field: 'user_id',
        isVirtual: true,
        refServiceId: 1,
        refTable: 'users',
        refField: 'id',
        alwaysFetch: false,
        flatten: false,
        flattenDropPrefix: false,
      },
    ];
  }

  return [];
}

function generateSchemaViewsFactory(count: number): any[] {
  const views: any[] = [];
  for (let i = 0; i < count; i++) {
    views.push({
      name: `view_${i}`,
      label: `View ${i}`,
      definition: `SELECT * FROM table_${i}`,
      fields: [],
      updatable: false,
    });
  }
  return views;
}

function generateStoredProceduresFactory(count: number): any[] {
  const procedures: any[] = [];
  for (let i = 0; i < count; i++) {
    procedures.push({
      name: `proc_${i}`,
      label: `Procedure ${i}`,
      parameters: [],
      definition: `BEGIN SELECT 1; END`,
    });
  }
  return procedures;
}

function generateDatabaseFunctionsFactory(count: number): any[] {
  const functions: any[] = [];
  for (let i = 0; i < count; i++) {
    functions.push({
      name: `func_${i}`,
      label: `Function ${i}`,
      parameters: [],
      returnType: 'INTEGER',
      definition: `RETURN 1`,
    });
  }
  return functions;
}

function generateSequencesFactory(count: number): any[] {
  const sequences: any[] = [];
  for (let i = 0; i < count; i++) {
    sequences.push({
      name: `seq_${i}`,
      increment: 1,
      startValue: 1,
    });
  }
  return sequences;
}

function schemaLoadingStateFactory(): SchemaLoadingState {
  return {
    isLoading: false,
    isError: false,
    loadedTables: 0,
    totalTables: 0,
    currentPage: 1,
    hasNextPage: false,
    isFetchingNextPage: false,
  };
}

function progressiveSchemaDataFactory(totalTables: number): ProgressiveSchemaData {
  const chunkSize = 50;
  const totalChunks = Math.ceil(totalTables / chunkSize);
  
  return {
    chunks: [],
    chunkSize,
    totalChunks,
    loadedChunks: 0,
    lastLoadTime: new Date().toISOString(),
  };
}

function generateServerVersion(): string {
  const versions = {
    mysql: '8.0.35',
    postgresql: '15.4',
    mongodb: '7.0.2',
    oracle: '19c',
    snowflake: '7.24.0',
  };
  const types = Object.keys(versions) as DatabaseType[];
  const type = types[Math.floor(Math.random() * types.length)];
  return versions[type];
}

function generateAvailableSchemas(): string[] {
  return ['public', 'information_schema', 'test_schema', 'app_schema'];
}

function generateEstimatedSize(): string {
  const sizes = ['1.2 MB', '5.8 MB', '12.3 MB', '450 KB', '2.1 GB'];
  return sizes[Math.floor(Math.random() * sizes.length)];
}

function generateConfigSchemaForType(type: DatabaseType): any[] {
  // Simplified config schema - in real implementation this would be much more detailed
  return [
    { name: 'host', type: 'string', required: true },
    { name: 'port', type: 'integer', required: true },
    { name: 'database', type: 'string', required: true },
    { name: 'username', type: 'string', required: true },
    { name: 'password', type: 'password', required: true },
  ];
}

function getVersionsForType(type: DatabaseType): string[] {
  const versionMap: Record<DatabaseType, string[]> = {
    mysql: ['5.7', '8.0', '8.1'],
    postgresql: ['12', '13', '14', '15', '16'],
    mongodb: ['5.0', '6.0', '7.0'],
    oracle: ['11g', '12c', '18c', '19c', '21c'],
    snowflake: ['7.x', '8.x'],
  };
  return versionMap[type];
}

// Export all factory functions for easy testing access
export {
  // Configuration factories
  mysqlConfigFactory,
  postgresqlConfigFactory,
  mongodbConfigFactory,
  oracleConfigFactory,
  snowflakeConfigFactory,
  sslConfigFactory,
  poolingConfigFactory,
  
  // Connection testing factories
  connectionTestRequestFactory,
  connectionCapabilitiesFactory,
  connectionErrorScenariosFactory,
  
  // Schema factories
  schemaTableFactory,
  schemaFieldFactory,
  schemaTreeNodeFactory,
  virtualScrollItemFactory,
  schemaPerformanceMetricsFactory,
  
  // Large dataset factories
  largeSchemaFactory,
  
  // Collection factories
  allDatabaseTypesFactory,
  databaseServiceTypesFactory,
  completeDatabaseTestDatasetFactory,
};