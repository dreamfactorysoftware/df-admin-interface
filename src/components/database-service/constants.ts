/**
 * Database Service Constants
 * 
 * This file contains all constants and configuration values for database service components,
 * including supported database types, connection parameters, validation rules, and caching
 * configuration for optimal React/Next.js performance.
 */

import type { DatabaseType, DatabaseConfig, ConnectionTimeouts, SWRConfig, ReactQueryConfig } from './types';

// =============================================================================
// DATABASE TYPES AND DRIVERS
// =============================================================================

/**
 * Supported database types with their display labels and driver information
 * Migrated from Angular service constants to React/Next.js configuration
 */
export const DATABASE_TYPES: Record<string, DatabaseType> = {
  // Core/Free Database Types
  mysql: {
    name: 'mysql',
    label: 'MySQL',
    description: 'Database service supporting MySQL connections.',
    group: 'Database',
    driver: 'mysql',
    defaultPort: 3306,
    supportedFeatures: ['schema_discovery', 'relationship_mapping', 'indexes', 'stored_procedures'],
    tier: 'core'
  },
  mariadb: {
    name: 'mariadb',
    label: 'MariaDB',
    description: 'Database service supporting MariaDB connections.',
    group: 'Database',
    driver: 'mysql', // MariaDB uses MySQL driver
    defaultPort: 3306,
    supportedFeatures: ['schema_discovery', 'relationship_mapping', 'indexes', 'stored_procedures'],
    tier: 'core'
  },
  pgsql: {
    name: 'pgsql',
    label: 'PostgreSQL',
    description: 'Database service supporting PostgreSQL connections.',
    group: 'Database',
    driver: 'pgsql',
    defaultPort: 5432,
    supportedFeatures: ['schema_discovery', 'relationship_mapping', 'indexes', 'stored_procedures', 'custom_types'],
    tier: 'core'
  },
  sqlite: {
    name: 'sqlite',
    label: 'SQLite',
    description: 'Database service supporting SQLite connections.',
    group: 'Database',
    driver: 'sqlite',
    defaultPort: null,
    supportedFeatures: ['schema_discovery', 'indexes'],
    tier: 'core'
  },
  mongodb: {
    name: 'mongodb',
    label: 'MongoDB',
    description: 'Database service for MongoDB connections.',
    group: 'Database',
    driver: 'mongodb',
    defaultPort: 27017,
    supportedFeatures: ['schema_discovery', 'document_collections'],
    tier: 'core'
  },

  // Silver Tier Database Types
  oracle: {
    name: 'oracle',
    label: 'Oracle',
    description: 'Database service supporting Oracle SQL connections.',
    group: 'Database',
    driver: 'oci',
    defaultPort: 1521,
    supportedFeatures: ['schema_discovery', 'relationship_mapping', 'indexes', 'stored_procedures', 'packages'],
    tier: 'silver'
  },
  sqlsrv: {
    name: 'sqlsrv',
    label: 'SQL Server',
    description: 'Database service supporting SQL Server connections.',
    group: 'Database',
    driver: 'sqlsrv',
    defaultPort: 1433,
    supportedFeatures: ['schema_discovery', 'relationship_mapping', 'indexes', 'stored_procedures'],
    tier: 'silver'
  },
  ibmdb2: {
    name: 'ibmdb2',
    label: 'IBM DB2',
    description: 'Database service supporting IBM DB2 SQL connections.',
    group: 'Database',
    driver: 'ibm',
    defaultPort: 50000,
    supportedFeatures: ['schema_discovery', 'relationship_mapping', 'indexes', 'stored_procedures'],
    tier: 'silver'
  },
  informix: {
    name: 'informix',
    label: 'IBM Informix',
    description: 'Database service supporting IBM Informix SQL connections.',
    group: 'Database',
    driver: 'informix',
    defaultPort: 9088,
    supportedFeatures: ['schema_discovery', 'relationship_mapping', 'indexes', 'stored_procedures'],
    tier: 'silver'
  },
  sqlanywhere: {
    name: 'sqlanywhere',
    label: 'SAP SQL Anywhere',
    description: 'Database service supporting SAP SQL Anywhere connections.',
    group: 'Database',
    driver: 'sqlanywhere',
    defaultPort: 2638,
    supportedFeatures: ['schema_discovery', 'relationship_mapping', 'indexes', 'stored_procedures'],
    tier: 'silver'
  },
  memsql: {
    name: 'memsql',
    label: 'MemSQL',
    description: 'Database service supporting MemSQL connections.',
    group: 'Database',
    driver: 'mysql', // MemSQL is MySQL compatible
    defaultPort: 3306,
    supportedFeatures: ['schema_discovery', 'relationship_mapping', 'indexes'],
    tier: 'silver'
  },
  salesforce_db: {
    name: 'salesforce_db',
    label: 'Salesforce',
    description: 'Database service with SOAP and/or OAuth authentication support for Salesforce connections.',
    group: 'Database',
    driver: 'salesforce',
    defaultPort: 443,
    supportedFeatures: ['schema_discovery', 'oauth_auth', 'soap_auth'],
    tier: 'silver'
  },

  // Gold Tier Database Types
  snowflake: {
    name: 'snowflake',
    label: 'Snowflake',
    description: 'Database service supporting Snowflake connections.',
    group: 'Database',
    driver: 'snowflake',
    defaultPort: 443,
    supportedFeatures: ['schema_discovery', 'warehouse_support', 'data_sharing'],
    tier: 'gold'
  },
  hana: {
    name: 'hana',
    label: 'SAP HANA',
    description: 'SAP HANA database service.',
    group: 'Database',
    driver: 'hdbodbc',
    defaultPort: 30015,
    supportedFeatures: ['schema_discovery', 'relationship_mapping', 'indexes', 'in_memory'],
    tier: 'gold'
  },
  apache_hive: {
    name: 'apache_hive',
    label: 'Apache Hive',
    description: 'The Apache Hive data warehouse software facilitates reading, writing, and managing large datasets residing in distributed storage using SQL',
    group: 'Big Data',
    driver: 'hive',
    defaultPort: 10000,
    supportedFeatures: ['schema_discovery', 'big_data', 'hdfs_integration'],
    tier: 'gold'
  },
  databricks: {
    name: 'databricks',
    label: 'Databricks',
    description: 'The Databricks data intelligence platform simplifies data engineering, analytics, and AI workloads by providing scalable compute and SQL-based access to large datasets in a unified environment.',
    group: 'Big Data',
    driver: 'databricks',
    defaultPort: 443,
    supportedFeatures: ['schema_discovery', 'big_data', 'spark_integration'],
    tier: 'gold'
  },
  dremio: {
    name: 'dremio',
    label: 'Dremio',
    description: 'The Dremio data lakehouse platform enables fast querying, data exploration, and analytics on large datasets across various storage systems using SQL.',
    group: 'Big Data',
    driver: 'dremio',
    defaultPort: 31010,
    supportedFeatures: ['schema_discovery', 'big_data', 'data_lake'],
    tier: 'gold'
  }
} as const;

/**
 * Array of all database types for iteration and selection
 */
export const DATABASE_TYPE_LIST = Object.values(DATABASE_TYPES);

/**
 * Database types grouped by tier for licensing and feature availability
 */
export const DATABASE_TYPES_BY_TIER = {
  core: DATABASE_TYPE_LIST.filter(db => db.tier === 'core'),
  silver: DATABASE_TYPE_LIST.filter(db => db.tier === 'silver'),
  gold: DATABASE_TYPE_LIST.filter(db => db.tier === 'gold')
} as const;

// =============================================================================
// DEFAULT CONNECTION CONFIGURATIONS
// =============================================================================

/**
 * Default connection parameters for each database type
 * These provide sensible defaults for new database service configurations
 */
export const DEFAULT_DATABASE_CONFIGS: Record<string, DatabaseConfig> = {
  mysql: {
    driver: 'mysql',
    host: 'localhost',
    port: 3306,
    database: '',
    username: '',
    password: '',
    options: {
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
      strict: false,
      engine: 'InnoDB'
    },
    connectionTimeout: 10000,
    ssl: {
      enabled: false,
      verify: true
    }
  },
  mariadb: {
    driver: 'mysql',
    host: 'localhost',
    port: 3306,
    database: '',
    username: '',
    password: '',
    options: {
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
      strict: false,
      engine: 'InnoDB'
    },
    connectionTimeout: 10000,
    ssl: {
      enabled: false,
      verify: true
    }
  },
  pgsql: {
    driver: 'pgsql',
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    username: '',
    password: '',
    options: {
      schema: 'public',
      charset: 'utf8',
      application_name: 'DreamFactory'
    },
    connectionTimeout: 10000,
    ssl: {
      enabled: false,
      verify: true,
      mode: 'prefer'
    }
  },
  sqlite: {
    driver: 'sqlite',
    database: '',
    options: {
      foreign_key_constraints: true,
      journal_mode: 'WAL'
    },
    connectionTimeout: 5000
  },
  mongodb: {
    driver: 'mongodb',
    host: 'localhost',
    port: 27017,
    database: '',
    username: '',
    password: '',
    options: {
      authSource: 'admin',
      readPreference: 'primary',
      writeConcern: 'majority'
    },
    connectionTimeout: 10000,
    ssl: {
      enabled: false,
      verify: true
    }
  },
  oracle: {
    driver: 'oci',
    host: 'localhost',
    port: 1521,
    database: 'XE',
    username: '',
    password: '',
    options: {
      sid: 'XE',
      service_name: '',
      charset: 'UTF8'
    },
    connectionTimeout: 15000,
    ssl: {
      enabled: false,
      verify: true
    }
  },
  sqlsrv: {
    driver: 'sqlsrv',
    host: 'localhost',
    port: 1433,
    database: 'master',
    username: '',
    password: '',
    options: {
      encrypt: true,
      trustServerCertificate: false,
      multipleActiveResultSets: false
    },
    connectionTimeout: 10000,
    ssl: {
      enabled: false,
      verify: true
    }
  },
  snowflake: {
    driver: 'snowflake',
    host: '', // account.region.snowflakecomputing.com
    port: 443,
    database: '',
    username: '',
    password: '',
    options: {
      warehouse: '',
      schema: 'PUBLIC',
      role: '',
      account: ''
    },
    connectionTimeout: 30000,
    ssl: {
      enabled: true,
      verify: true
    }
  }
};

// =============================================================================
// API ENDPOINTS AND URLS
// =============================================================================

/**
 * API endpoint URLs for database service operations
 * Migrated from Angular URL constants to React/Next.js API routes
 */
export const DATABASE_SERVICE_ENDPOINTS = {
  BASE_URL: '/api/v2',
  SYSTEM_SERVICE: '/api/v2/system/service',
  SERVICE_TYPE: '/api/v2/system/service_type',
  SERVICE_TEST: '/api/v2/system/service_test',
  SCHEMA_DISCOVERY: (serviceName: string) => `/${serviceName}/_schema`,
  TABLE_SCHEMA: (serviceName: string, tableName: string) => `/${serviceName}/_schema/${tableName}`,
  CONNECTION_TEST: (serviceId: number) => `/api/v2/system/service/${serviceId}/_test`,
  SERVICE_DETAIL: (serviceId: number) => `/api/v2/system/service/${serviceId}`,
  SERVICE_CONFIG: (serviceId: number) => `/api/v2/system/service/${serviceId}/config`
} as const;

// =============================================================================
// CONNECTION TESTING AND TIMEOUTS
// =============================================================================

/**
 * Connection timeout configurations per F-001 requirement for 5-second connection testing
 */
export const CONNECTION_TIMEOUTS: ConnectionTimeouts = {
  // Standard connection test timeout (5 seconds as per requirement)
  CONNECTION_TEST: 5000,
  // Schema discovery timeout for large databases
  SCHEMA_DISCOVERY: 30000,
  // Database query timeout
  QUERY_TIMEOUT: 15000,
  // Bulk operation timeout
  BULK_OPERATION: 60000,
  // Connection pool timeout
  POOL_TIMEOUT: 10000
} as const;

/**
 * Retry configuration for connection testing
 */
export const CONNECTION_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  maxRetryDelay: 5000
} as const;

// =============================================================================
// SWR CONFIGURATION FOR DATA FETCHING
// =============================================================================

/**
 * SWR configuration for optimal caching and real-time synchronization
 * Configured per React/Next.js integration requirements for sub-50ms cache responses
 */
export const DATABASE_SERVICE_SWR_CONFIG: SWRConfig = {
  // Connection test caching - shorter duration for real-time validation
  connectionTest: {
    refreshInterval: 0, // No automatic refresh for connection tests
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 1000,
    errorRetryInterval: 2000,
    errorRetryCount: 2,
    focusThrottleInterval: 5000
  },
  
  // Service list caching - moderate refresh for service discovery
  serviceList: {
    refreshInterval: 30000, // 30 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    errorRetryInterval: 5000,
    errorRetryCount: 3,
    focusThrottleInterval: 10000
  },

  // Schema discovery caching - longer duration for stable schema data
  schemaDiscovery: {
    refreshInterval: 300000, // 5 minutes
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 10000,
    errorRetryInterval: 10000,
    errorRetryCount: 2,
    focusThrottleInterval: 30000
  },

  // Service configuration caching - immediate updates for config changes
  serviceConfig: {
    refreshInterval: 60000, // 1 minute
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    errorRetryInterval: 3000,
    errorRetryCount: 3,
    focusThrottleInterval: 5000
  }
} as const;

// =============================================================================
// REACT QUERY CONFIGURATION
// =============================================================================

/**
 * React Query configuration for complex server-state management
 * Optimized for database operations with intelligent caching strategies
 */
export const DATABASE_SERVICE_REACT_QUERY_CONFIG: ReactQueryConfig = {
  // Default query options for all database service queries
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    },
    mutations: {
      retry: 1,
      retryDelay: 1000
    }
  },

  // Specific configurations for different query types
  queryConfigs: {
    // Database service list queries
    serviceList: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true
    },

    // Connection test queries
    connectionTest: {
      staleTime: 0, // Always consider stale for real-time testing
      cacheTime: 1 * 60 * 1000, // 1 minute
      retry: 2,
      refetchOnWindowFocus: false
    },

    // Schema discovery queries - longer cache for stable data
    schemaDiscovery: {
      staleTime: 15 * 60 * 1000, // 15 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false
    },

    // Service configuration queries
    serviceConfig: {
      staleTime: 1 * 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true
    }
  }
} as const;

// =============================================================================
// VALIDATION RULES AND CONSTRAINTS
// =============================================================================

/**
 * Database-specific validation rules for connection parameters
 */
export const DATABASE_VALIDATION_RULES = {
  // Common validation patterns
  patterns: {
    hostname: /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    ipAddress: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    port: /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/,
    databaseName: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
    username: /^[a-zA-Z][a-zA-Z0-9_@.-]*$/
  },

  // Field length limits
  limits: {
    serviceName: { min: 1, max: 64 },
    serviceLabel: { min: 1, max: 255 },
    host: { min: 1, max: 255 },
    database: { min: 1, max: 64 },
    username: { min: 1, max: 64 },
    password: { min: 0, max: 255 },
    description: { min: 0, max: 1024 }
  },

  // Port ranges for different database types
  portRanges: {
    mysql: { min: 1, max: 65535, default: 3306 },
    pgsql: { min: 1, max: 65535, default: 5432 },
    oracle: { min: 1, max: 65535, default: 1521 },
    sqlsrv: { min: 1, max: 65535, default: 1433 },
    mongodb: { min: 1, max: 65535, default: 27017 },
    snowflake: { min: 443, max: 443, default: 443 }
  }
} as const;

// =============================================================================
// COMPONENT CONFIGURATION
// =============================================================================

/**
 * UI component configuration options for database service forms and displays
 */
export const DATABASE_SERVICE_UI_CONFIG = {
  // Form field configurations
  formFields: {
    serviceName: {
      required: true,
      placeholder: 'Enter service name',
      helperText: 'Unique identifier for this database service'
    },
    serviceLabel: {
      required: true,
      placeholder: 'Enter display label',
      helperText: 'Human-readable name for this service'
    },
    host: {
      required: true,
      placeholder: 'localhost or IP address',
      helperText: 'Database server hostname or IP address'
    },
    port: {
      required: false,
      placeholder: 'Default port will be used',
      helperText: 'Database server port number'
    },
    database: {
      required: true,
      placeholder: 'Enter database name',
      helperText: 'Name of the database to connect to'
    },
    username: {
      required: true,
      placeholder: 'Enter username',
      helperText: 'Database user with appropriate permissions'
    },
    password: {
      required: false,
      placeholder: 'Enter password',
      helperText: 'Database user password',
      type: 'password'
    }
  },

  // Table pagination and display options
  table: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    defaultSortField: 'label',
    defaultSortDirection: 'asc' as const
  },

  // Connection test UI states
  connectionTest: {
    states: {
      idle: 'Test Connection',
      testing: 'Testing...',
      success: 'Connection Successful',
      error: 'Connection Failed'
    },
    colors: {
      idle: 'blue',
      testing: 'yellow',
      success: 'green',
      error: 'red'
    }
  }
} as const;

// =============================================================================
// FEATURE FLAGS AND CAPABILITIES
// =============================================================================

/**
 * Feature flags for database service capabilities
 * Enables conditional rendering based on database type support
 */
export const DATABASE_FEATURE_FLAGS = {
  // Schema discovery features
  schemaDiscovery: {
    virtualScrolling: true, // Enable for 1000+ table support
    relationshipMapping: true,
    indexInformation: true,
    constraintDetails: true
  },

  // Connection features
  connection: {
    sslSupport: true,
    connectionPooling: true,
    readOnlyMode: true,
    transactionSupport: true
  },

  // API generation features
  apiGeneration: {
    customEndpoints: true,
    bulkOperations: true,
    filteringSupport: true,
    aggregationSupport: true
  }
} as const;

// =============================================================================
// ERROR MESSAGES AND CONSTANTS
// =============================================================================

/**
 * Standardized error messages for database service operations
 */
export const DATABASE_ERROR_MESSAGES = {
  connection: {
    timeout: 'Connection timed out. Please check your database server and network connectivity.',
    refused: 'Connection refused. Please verify the host and port are correct.',
    authentication: 'Authentication failed. Please check your username and password.',
    database: 'Database not found. Please verify the database name is correct.',
    ssl: 'SSL connection failed. Please check your SSL configuration.',
    unknown: 'An unknown error occurred while connecting to the database.'
  },
  validation: {
    required: 'This field is required.',
    invalidHost: 'Please enter a valid hostname or IP address.',
    invalidPort: 'Please enter a valid port number (1-65535).',
    invalidDatabase: 'Please enter a valid database name.',
    invalidUsername: 'Please enter a valid username.',
    duplicateService: 'A service with this name already exists.'
  },
  schema: {
    discoveryFailed: 'Failed to discover database schema. Please check your connection and permissions.',
    largeSchema: 'This database has a large number of tables. Schema discovery may take longer than usual.',
    noTables: 'No tables found in the selected database.',
    permissionDenied: 'Insufficient permissions to access schema information.'
  }
} as const;

/**
 * Success messages for database service operations
 */
export const DATABASE_SUCCESS_MESSAGES = {
  connection: {
    successful: 'Database connection successful!',
    updated: 'Connection settings updated successfully.',
    created: 'Database service created successfully.',
    deleted: 'Database service deleted successfully.'
  },
  schema: {
    discovered: 'Database schema discovered successfully.',
    updated: 'Schema information updated.'
  }
} as const;