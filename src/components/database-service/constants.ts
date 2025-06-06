/**
 * Database Service Constants and Configuration
 * 
 * Centralized constants and configuration values for database service functionality,
 * including supported database types, default connection parameters, validation rules,
 * SWR/React Query configuration, and component settings. Provides optimized caching
 * strategies and performance configuration for React/Next.js integration.
 * 
 * @fileoverview Database service constants migrated from Angular to React/Next.js
 * @version 1.0.0
 * @since 2024-01-01
 */

import type { 
  DatabaseDriver, 
  DatabaseType, 
  ServiceTier, 
  ConnectionTimeouts,
  SWRConfig,
  ReactQueryConfig,
  DatabaseOptions,
  DatabaseServiceSWRConfig
} from './types';

// =============================================================================
// CORE DATABASE CONFIGURATION CONSTANTS
// =============================================================================

/**
 * Supported database drivers with feature parity from Angular implementation
 * Multi-database support per F-001 feature requirements
 */
export const DATABASE_DRIVERS: readonly DatabaseDriver[] = [
  'mysql',
  'pgsql',
  'sqlite',
  'mongodb',
  'oracle',
  'sqlsrv',
  'snowflake',
  'ibmdb2',
  'informix',
  'sqlanywhere',
  'memsql',
  'salesforce_db',
  'hana',
  'apache_hive',
  'databricks',
  'dremio'
] as const;

/**
 * Database type definitions with configuration metadata
 * Enhanced from Angular ServiceType with React-specific optimizations
 */
export const DATABASE_TYPES: readonly DatabaseType[] = [
  {
    name: 'mysql',
    label: 'MySQL',
    description: 'MySQL database service for high-performance web applications',
    group: 'SQL Databases',
    driver: 'mysql',
    defaultPort: 3306,
    supportedFeatures: ['transactions', 'indexes', 'foreign_keys', 'stored_procedures'],
    tier: 'core'
  },
  {
    name: 'pgsql',
    label: 'PostgreSQL',
    description: 'PostgreSQL database service with advanced SQL features',
    group: 'SQL Databases',
    driver: 'pgsql',
    defaultPort: 5432,
    supportedFeatures: ['transactions', 'indexes', 'foreign_keys', 'stored_procedures', 'json_support'],
    tier: 'core'
  },
  {
    name: 'sqlite',
    label: 'SQLite',
    description: 'Lightweight file-based database service',
    group: 'SQL Databases',
    driver: 'sqlite',
    defaultPort: null,
    supportedFeatures: ['transactions', 'indexes', 'foreign_keys'],
    tier: 'core'
  },
  {
    name: 'mongodb',
    label: 'MongoDB',
    description: 'NoSQL document database service',
    group: 'NoSQL Databases',
    driver: 'mongodb',
    defaultPort: 27017,
    supportedFeatures: ['aggregation', 'indexing', 'replication', 'sharding'],
    tier: 'core'
  },
  {
    name: 'oracle',
    label: 'Oracle Database',
    description: 'Enterprise Oracle database service',
    group: 'SQL Databases',
    driver: 'oracle',
    defaultPort: 1521,
    supportedFeatures: ['transactions', 'indexes', 'foreign_keys', 'stored_procedures', 'partitioning'],
    tier: 'gold'
  },
  {
    name: 'sqlsrv',
    label: 'Microsoft SQL Server',
    description: 'Microsoft SQL Server database service',
    group: 'SQL Databases',
    driver: 'sqlsrv',
    defaultPort: 1433,
    supportedFeatures: ['transactions', 'indexes', 'foreign_keys', 'stored_procedures', 'json_support'],
    tier: 'silver'
  },
  {
    name: 'snowflake',
    label: 'Snowflake',
    description: 'Cloud data warehouse service',
    group: 'Cloud Databases',
    driver: 'snowflake',
    defaultPort: 443,
    supportedFeatures: ['transactions', 'scaling', 'time_travel', 'clustering'],
    tier: 'gold'
  },
  {
    name: 'ibmdb2',
    label: 'IBM Db2',
    description: 'IBM Db2 database service',
    group: 'SQL Databases',
    driver: 'ibmdb2',
    defaultPort: 50000,
    supportedFeatures: ['transactions', 'indexes', 'foreign_keys', 'stored_procedures'],
    tier: 'gold'
  },
  {
    name: 'informix',
    label: 'IBM Informix',
    description: 'IBM Informix database service',
    group: 'SQL Databases',
    driver: 'informix',
    defaultPort: 9088,
    supportedFeatures: ['transactions', 'indexes', 'foreign_keys', 'stored_procedures'],
    tier: 'gold'
  },
  {
    name: 'sqlanywhere',
    label: 'SAP SQL Anywhere',
    description: 'SAP SQL Anywhere database service',
    group: 'SQL Databases',
    driver: 'sqlanywhere',
    defaultPort: 2638,
    supportedFeatures: ['transactions', 'indexes', 'foreign_keys', 'stored_procedures'],
    tier: 'gold'
  },
  {
    name: 'memsql',
    label: 'MemSQL (SingleStore)',
    description: 'MemSQL distributed database service',
    group: 'SQL Databases',
    driver: 'memsql',
    defaultPort: 3306,
    supportedFeatures: ['transactions', 'indexes', 'real_time_analytics', 'json_support'],
    tier: 'silver'
  },
  {
    name: 'salesforce_db',
    label: 'Salesforce Database',
    description: 'Salesforce cloud database service',
    group: 'Cloud Databases',
    driver: 'salesforce_db',
    defaultPort: 443,
    supportedFeatures: ['soql', 'sosl', 'metadata_api', 'bulk_api'],
    tier: 'gold'
  },
  {
    name: 'hana',
    label: 'SAP HANA',
    description: 'SAP HANA in-memory database service',
    group: 'SQL Databases',
    driver: 'hana',
    defaultPort: 30015,
    supportedFeatures: ['transactions', 'in_memory', 'analytics', 'stored_procedures'],
    tier: 'gold'
  },
  {
    name: 'apache_hive',
    label: 'Apache Hive',
    description: 'Apache Hive data warehouse service',
    group: 'Big Data',
    driver: 'apache_hive',
    defaultPort: 10000,
    supportedFeatures: ['batch_processing', 'sql_interface', 'partitioning'],
    tier: 'silver'
  },
  {
    name: 'databricks',
    label: 'Databricks',
    description: 'Databricks unified analytics platform',
    group: 'Cloud Databases',
    driver: 'databricks',
    defaultPort: 443,
    supportedFeatures: ['spark_sql', 'delta_lake', 'ml_integration', 'streaming'],
    tier: 'gold'
  },
  {
    name: 'dremio',
    label: 'Dremio',
    description: 'Dremio data lake engine',
    group: 'Big Data',
    driver: 'dremio',
    defaultPort: 31010,
    supportedFeatures: ['data_virtualization', 'sql_interface', 'columnar_storage'],
    tier: 'silver'
  }
] as const;

// =============================================================================
// CONNECTION TIMEOUT CONFIGURATION
// =============================================================================

/**
 * Connection timeout configuration with 5-second requirement per F-001-RQ-002
 * Optimized for React/Next.js integration requirements
 */
export const CONNECTION_TIMEOUTS: ConnectionTimeouts = {
  /** Connection test timeout - meets F-001-RQ-002 requirement */
  CONNECTION_TEST: 5000, // 5 seconds as specified
  /** Schema discovery timeout for large databases (1000+ tables) */
  SCHEMA_DISCOVERY: 30000, // 30 seconds for comprehensive introspection
  /** Standard query timeout for API operations */
  QUERY_TIMEOUT: 15000, // 15 seconds for balanced performance
  /** Bulk operation timeout for large dataset operations */
  BULK_OPERATION: 60000, // 60 seconds for data-intensive operations
  /** Connection pool timeout for resource management */
  POOL_TIMEOUT: 10000 // 10 seconds for pool acquisition
} as const;

// =============================================================================
// DEFAULT CONNECTION PARAMETERS
// =============================================================================

/**
 * Database-specific default connection parameters
 * Migrated from Angular injection tokens to React configuration objects
 */
export const DEFAULT_CONNECTION_PARAMS: Record<DatabaseDriver, Partial<DatabaseOptions>> = {
  mysql: {
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    strict: false,
    engine: 'InnoDB'
  },
  pgsql: {
    charset: 'UTF8',
    search_path: 'public',
    application_name: 'DreamFactory Admin'
  },
  sqlite: {
    // SQLite has minimal configuration options
  },
  mongodb: {
    authSource: 'admin',
    readPreference: 'primary',
    writeConcern: 'majority'
  },
  oracle: {
    charset: 'AL32UTF8',
    // Use service_name by default instead of SID
    service_name: ''
  },
  sqlsrv: {
    charset: 'UTF-8',
    // SQL Server specific options
  },
  snowflake: {
    warehouse: 'COMPUTE_WH',
    role: 'ACCOUNTADMIN',
    account: ''
  },
  ibmdb2: {
    charset: 'UTF-8',
    // DB2 specific options
  },
  informix: {
    charset: 'UTF-8',
    // Informix specific options
  },
  sqlanywhere: {
    charset: 'UTF-8',
    // SQL Anywhere specific options
  },
  memsql: {
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci'
  },
  salesforce_db: {
    // Salesforce uses OAuth-based authentication
  },
  hana: {
    charset: 'UTF-8',
    // SAP HANA specific options
  },
  apache_hive: {
    // Hive specific options
  },
  databricks: {
    // Databricks specific options
  },
  dremio: {
    // Dremio specific options
  }
} as const;

// =============================================================================
// SWR CONFIGURATION FOR OPTIMAL PERFORMANCE
// =============================================================================

/**
 * SWR configuration for database service operations
 * Optimized for React/Next.js integration with cache hit responses under 50ms
 */
export const DATABASE_SERVICE_SWR_CONFIG: SWRConfig = {
  connectionTest: {
    // Minimal caching for connection tests due to dynamic nature
    refreshInterval: 0, // No automatic refresh
    revalidateOnFocus: false, // Manual trigger only
    revalidateOnReconnect: false,
    dedupingInterval: 1000, // 1 second deduplication
    errorRetryInterval: 2000, // 2 second retry interval
    errorRetryCount: 2, // Limited retries for failed connections
    focusThrottleInterval: 5000 // Throttle focus revalidation
  },
  serviceList: {
    // Moderate caching for service listings
    refreshInterval: 60000, // 1 minute auto-refresh
    revalidateOnFocus: true, // Refresh when user returns to tab
    revalidateOnReconnect: true, // Refresh on network reconnection
    dedupingInterval: 5000, // 5 second deduplication
    errorRetryInterval: 3000, // 3 second retry interval
    errorRetryCount: 3, // Standard retry count
    focusThrottleInterval: 10000 // 10 second focus throttle
  },
  schemaDiscovery: {
    // Aggressive caching for schema data (expensive operations)
    refreshInterval: 300000, // 5 minute auto-refresh
    revalidateOnFocus: false, // Manual refresh for large schemas
    revalidateOnReconnect: true, // Refresh on reconnection
    dedupingInterval: 30000, // 30 second deduplication
    errorRetryInterval: 5000, // 5 second retry interval
    errorRetryCount: 2, // Limited retries for schema operations
    focusThrottleInterval: 30000 // 30 second focus throttle
  },
  serviceConfig: {
    // Standard caching for configuration data
    refreshInterval: 120000, // 2 minute auto-refresh
    revalidateOnFocus: true, // Refresh on focus
    revalidateOnReconnect: true, // Refresh on reconnection
    dedupingInterval: 10000, // 10 second deduplication
    errorRetryInterval: 3000, // 3 second retry interval
    errorRetryCount: 3, // Standard retry count
    focusThrottleInterval: 15000 // 15 second focus throttle
  }
} as const;

// =============================================================================
// REACT QUERY CONFIGURATION
// =============================================================================

/**
 * React Query configuration for advanced server-state management
 * Optimized for complex database operations and intelligent caching
 */
export const DATABASE_SERVICE_REACT_QUERY_CONFIG: ReactQueryConfig = {
  defaultOptions: {
    queries: {
      // Default cache time for efficient memory usage
      staleTime: 5 * 60 * 1000, // 5 minutes default stale time
      cacheTime: 10 * 60 * 1000, // 10 minutes cache retention
      retry: 3, // Standard retry attempts
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: true, // Refresh on window focus
      refetchOnReconnect: true // Refresh on network reconnection
    },
    mutations: {
      retry: 2, // Limited mutation retries
      retryDelay: 1000 // 1 second mutation retry delay
    }
  },
  queryConfigs: {
    serviceList: {
      staleTime: 2 * 60 * 1000, // 2 minutes for service listings
      cacheTime: 10 * 60 * 1000, // 10 minutes cache retention
      refetchOnWindowFocus: true // Refresh service list on focus
    },
    connectionTest: {
      staleTime: 0, // Always fresh for connection tests
      cacheTime: 1 * 60 * 1000, // 1 minute cache for debugging
      retry: 1, // Single retry for connection tests
      refetchOnWindowFocus: false // Manual testing only
    },
    schemaDiscovery: {
      staleTime: 15 * 60 * 1000, // 15 minutes for schema data
      cacheTime: 30 * 60 * 1000, // 30 minutes cache retention
      retry: 2, // Limited retries for expensive operations
      refetchOnWindowFocus: false // Manual refresh for large schemas
    },
    serviceConfig: {
      staleTime: 5 * 60 * 1000, // 5 minutes for configuration
      cacheTime: 15 * 60 * 1000, // 15 minutes cache retention
      refetchOnWindowFocus: true // Refresh config on focus
    }
  }
} as const;

// =============================================================================
// VALIDATION CONFIGURATION
// =============================================================================

/**
 * Validation rules and constraints for database service configuration
 * Enhanced from Angular validators for React Hook Form integration
 */
export const VALIDATION_RULES = {
  serviceName: {
    minLength: 1,
    maxLength: 64,
    pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
    errorMessage: 'Service name must start with a letter and contain only letters, numbers, underscores, and hyphens'
  },
  displayLabel: {
    minLength: 1,
    maxLength: 255,
    errorMessage: 'Display label is required and must be less than 255 characters'
  },
  description: {
    maxLength: 1024,
    errorMessage: 'Description must be less than 1024 characters'
  },
  host: {
    minLength: 1,
    maxLength: 255,
    errorMessage: 'Host is required and must be less than 255 characters'
  },
  port: {
    min: 1,
    max: 65535,
    errorMessage: 'Port must be between 1 and 65535'
  },
  database: {
    minLength: 1,
    maxLength: 64,
    errorMessage: 'Database name is required and must be less than 64 characters'
  },
  username: {
    minLength: 1,
    maxLength: 64,
    errorMessage: 'Username is required and must be less than 64 characters'
  },
  password: {
    maxLength: 255,
    errorMessage: 'Password must be less than 255 characters'
  },
  connectionTimeout: {
    min: 1000,
    max: 60000,
    errorMessage: 'Connection timeout must be between 1 and 60 seconds'
  }
} as const;

// =============================================================================
// COMPONENT CONFIGURATION
// =============================================================================

/**
 * Component-specific configuration for database service UI
 * Optimized for React/Next.js rendering performance
 */
export const COMPONENT_CONFIG = {
  serviceList: {
    defaultPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100],
    maxVisiblePages: 7,
    enableVirtualScrolling: true, // For large datasets
    virtualScrollThreshold: 100 // Enable virtual scrolling above 100 items
  },
  connectionTest: {
    showProgressIndicator: true,
    progressUpdateInterval: 500, // 500ms progress updates
    timeoutWarningThreshold: 3000, // Warn at 3 seconds
    successMessageDuration: 3000, // 3 second success message
    errorMessageDuration: 5000 // 5 second error message
  },
  schemaDiscovery: {
    enableLazyLoading: true,
    nodeExpansionDepth: 2, // Default expansion depth
    virtualScrolling: {
      enabled: true,
      itemHeight: 32, // Height per tree item in pixels
      threshold: 50 // Enable virtual scrolling above 50 nodes
    },
    searchDebounceMs: 300, // 300ms search debounce
    maxSearchResults: 1000 // Limit search results for performance
  },
  serviceForm: {
    autoSaveEnabled: true,
    autoSaveInterval: 30000, // 30 second auto-save
    confirmNavigationOnChanges: true,
    validateOnChange: true, // Real-time validation
    validationDebounceMs: 500 // 500ms validation debounce
  }
} as const;

// =============================================================================
// API ENDPOINT CONFIGURATION
// =============================================================================

/**
 * API endpoint configuration for database service operations
 * Maintains compatibility with DreamFactory Core APIs
 */
export const API_ENDPOINTS = {
  services: '/api/v2/system/service',
  serviceTypes: '/api/v2/system/service_type',
  serviceById: (id: number) => `/api/v2/system/service/${id}`,
  connectionTest: '/api/v2/system/service/_test',
  schema: (serviceName: string) => `/api/v2/${serviceName}/_schema`,
  schemaTable: (serviceName: string, tableName: string) => `/api/v2/${serviceName}/_schema/${tableName}`,
  schemaField: (serviceName: string, tableName: string, fieldName: string) => 
    `/api/v2/${serviceName}/_schema/${tableName}/${fieldName}`,
  
  // Next.js API routes for preview and testing
  preview: {
    connectionTest: '/api/preview/connection-test',
    schemaPreview: '/api/preview/schema',
    endpointPreview: '/api/preview/endpoints'
  }
} as const;

// =============================================================================
// ERROR HANDLING CONFIGURATION
// =============================================================================

/**
 * Error handling configuration for database service operations
 * Enhanced error classification and retry strategies
 */
export const ERROR_CONFIG = {
  connectionErrors: {
    retryAttempts: 2,
    retryDelay: 2000, // 2 second delay between retries
    timeoutErrorCode: 'CONNECTION_TIMEOUT',
    authErrorCode: 'AUTHENTICATION_FAILED',
    networkErrorCode: 'NETWORK_ERROR',
    configErrorCode: 'INVALID_CONFIGURATION'
  },
  schemaErrors: {
    retryAttempts: 1,
    retryDelay: 3000, // 3 second delay for schema operations
    permissionErrorCode: 'INSUFFICIENT_PERMISSIONS',
    notFoundErrorCode: 'SCHEMA_NOT_FOUND',
    tooLargeErrorCode: 'SCHEMA_TOO_LARGE'
  },
  apiErrors: {
    retryAttempts: 3,
    retryDelay: 1000, // 1 second delay for API operations
    rateLimitErrorCode: 'RATE_LIMIT_EXCEEDED',
    serverErrorCode: 'INTERNAL_SERVER_ERROR',
    maintenanceErrorCode: 'SERVICE_MAINTENANCE'
  }
} as const;

// =============================================================================
// PERFORMANCE MONITORING CONFIGURATION
// =============================================================================

/**
 * Performance monitoring thresholds and configuration
 * Aligned with React/Next.js integration requirements
 */
export const PERFORMANCE_CONFIG = {
  thresholds: {
    connectionTestMs: 5000, // F-001-RQ-002 requirement
    cacheHitMs: 50, // React/Next.js integration requirement
    validationMs: 100, // Real-time validation requirement
    ssrPageMs: 2000, // SSR page load requirement
    apiResponseMs: 2000 // API response requirement
  },
  monitoring: {
    enablePerformanceLogging: true,
    logSlowOperations: true,
    slowOperationThreshold: 1000, // 1 second threshold
    enableMetrics: true,
    metricsCollectionInterval: 60000 // 1 minute metrics collection
  }
} as const;

// =============================================================================
// FEATURE FLAGS AND TOGGLES
// =============================================================================

/**
 * Feature flags for progressive enhancement and A/B testing
 * Enables gradual rollout of new database service features
 */
export const FEATURE_FLAGS = {
  enableAdvancedCaching: true, // Enhanced React Query caching
  enableVirtualScrolling: true, // TanStack Virtual for large datasets
  enableAutoSave: true, // Auto-save form functionality
  enableConnectionPooling: true, // Advanced connection pooling
  enableSchemaSearch: true, // Schema search functionality
  enablePerformanceMonitoring: true, // Performance tracking
  enableOptimisticUpdates: true, // Optimistic UI updates
  enableBackgroundRefresh: true, // Background data refresh
  enableErrorRetry: true, // Automatic error retry
  enableSSROptimization: true // Server-side rendering optimizations
} as const;

// =============================================================================
// EXPORTED GROUPED CONSTANTS
// =============================================================================

/**
 * Grouped export for convenient access to related constants
 */
export const DATABASE_SERVICE_CONSTANTS = {
  drivers: DATABASE_DRIVERS,
  types: DATABASE_TYPES,
  timeouts: CONNECTION_TIMEOUTS,
  defaults: DEFAULT_CONNECTION_PARAMS,
  swrConfig: DATABASE_SERVICE_SWR_CONFIG,
  reactQueryConfig: DATABASE_SERVICE_REACT_QUERY_CONFIG,
  validation: VALIDATION_RULES,
  components: COMPONENT_CONFIG,
  api: API_ENDPOINTS,
  errors: ERROR_CONFIG,
  performance: PERFORMANCE_CONFIG,
  features: FEATURE_FLAGS
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Re-export types for convenience and type safety
 */
export type {
  DatabaseDriver,
  DatabaseType,
  ServiceTier,
  ConnectionTimeouts,
  SWRConfig,
  ReactQueryConfig,
  DatabaseOptions,
  DatabaseServiceSWRConfig
} from './types';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Utility function to get database type configuration by driver
 */
export const getDatabaseType = (driver: DatabaseDriver): DatabaseType | undefined => {
  return DATABASE_TYPES.find(type => type.driver === driver);
};

/**
 * Utility function to get default port for a database driver
 */
export const getDefaultPort = (driver: DatabaseDriver): number | null => {
  const dbType = getDatabaseType(driver);
  return dbType?.defaultPort ?? null;
};

/**
 * Utility function to check if a database driver supports a specific feature
 */
export const supportsFeature = (driver: DatabaseDriver, feature: string): boolean => {
  const dbType = getDatabaseType(driver);
  return dbType?.supportedFeatures.includes(feature) ?? false;
};

/**
 * Utility function to get SWR configuration for a specific operation type
 */
export const getSWRConfig = (operationType: keyof SWRConfig): DatabaseServiceSWRConfig => {
  return DATABASE_SERVICE_SWR_CONFIG[operationType];
};

/**
 * Utility function to get React Query configuration for a specific query type
 */
export const getReactQueryConfig = (queryType: keyof ReactQueryConfig['queryConfigs']) => {
  return DATABASE_SERVICE_REACT_QUERY_CONFIG.queryConfigs[queryType];
};