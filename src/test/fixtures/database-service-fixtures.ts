/**
 * Database Service Test Fixtures
 * 
 * Comprehensive test data fixtures for database service components testing.
 * Provides realistic mock data, edge cases, and performance benchmarks for
 * comprehensive test coverage of the DreamFactory Admin Interface React migration.
 * 
 * Fixture Categories:
 * - Mock database services with various configurations
 * - Connection test results and scenarios
 * - Service types and paywall configurations
 * - Performance benchmarks and thresholds
 * - Error scenarios and edge cases
 * - Large dataset generators for virtualization testing
 * 
 * @fileoverview Test fixtures for database service components
 * @version 1.0.0
 * @since 2024-01-01
 */

import type {
  DatabaseService,
  DatabaseDriver,
  ServiceStatus,
  ConnectionTestResult,
  ConnectionTestStatus,
  ServiceType,
  ServiceListFilters,
  ServiceListSort,
  BulkActionType,
  ApiErrorResponse
} from '../../components/database-service/service-list/service-list-types';

// =============================================================================
// DATABASE SERVICE FIXTURES
// =============================================================================

/**
 * Base database service configurations for different drivers
 */
export const BASE_SERVICE_CONFIGS = {
  mysql: {
    host: 'mysql.example.com',
    port: 3306,
    database: 'production_db',
    username: 'app_user',
    password: '***',
    options: {
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
      timezone: '+00:00',
      ssl: false,
    },
  },
  postgresql: {
    host: 'postgres.example.com',
    port: 5432,
    database: 'production_db',
    username: 'app_user',
    password: '***',
    options: {
      schema: 'public',
      sslmode: 'prefer',
      connect_timeout: 10,
    },
  },
  mongodb: {
    host: 'mongodb.example.com',
    port: 27017,
    database: 'production_db',
    username: 'app_user',
    password: '***',
    options: {
      authSource: 'admin',
      ssl: true,
      replicaSet: 'rs0',
    },
  },
  oracle: {
    host: 'oracle.example.com',
    port: 1521,
    database: 'ORCL',
    username: 'app_user',
    password: '***',
    options: {
      service_name: 'ORCL.example.com',
      sid: 'ORCL',
    },
  },
  sqlserver: {
    host: 'sqlserver.example.com',
    port: 1433,
    database: 'production_db',
    username: 'app_user',
    password: '***',
    options: {
      encrypt: true,
      trustServerCertificate: false,
      connectionTimeout: 30000,
    },
  },
} as const;

/**
 * Predefined database services for consistent testing
 */
export const MOCK_DATABASE_SERVICES: DatabaseService[] = [
  // Active MySQL service
  {
    id: 1,
    name: 'primary-mysql',
    label: 'Primary MySQL Database',
    description: 'Main production MySQL database for user data',
    type: 'mysql',
    driver: 'mysql',
    is_active: true,
    status: 'active',
    config: BASE_SERVICE_CONFIGS.mysql,
    created_date: '2024-01-01T00:00:00Z',
    created_by_id: 1,
    last_modified_date: '2024-01-15T10:30:00Z',
    last_modified_by_id: 1,
  },
  
  // Inactive PostgreSQL service
  {
    id: 2,
    name: 'analytics-postgres',
    label: 'Analytics PostgreSQL',
    description: 'PostgreSQL database for analytics and reporting',
    type: 'postgresql',
    driver: 'postgresql',
    is_active: false,
    status: 'inactive',
    config: BASE_SERVICE_CONFIGS.postgresql,
    created_date: '2024-01-02T08:15:00Z',
    created_by_id: 2,
    last_modified_date: '2024-01-20T14:45:00Z',
    last_modified_by_id: 1,
  },
  
  // Error state MongoDB service
  {
    id: 3,
    name: 'logs-mongodb',
    label: 'Logs MongoDB',
    description: 'MongoDB database for application logs and events',
    type: 'mongodb',
    driver: 'mongodb',
    is_active: true,
    status: 'error',
    config: BASE_SERVICE_CONFIGS.mongodb,
    created_date: '2024-01-03T12:00:00Z',
    created_by_id: 1,
    last_modified_date: '2024-01-25T09:20:00Z',
    last_modified_by_id: 3,
  },
  
  // Testing Oracle service
  {
    id: 4,
    name: 'enterprise-oracle',
    label: 'Enterprise Oracle DB',
    description: 'Oracle database for enterprise resource planning',
    type: 'oracle',
    driver: 'oracle',
    is_active: true,
    status: 'testing',
    config: BASE_SERVICE_CONFIGS.oracle,
    created_date: '2024-01-04T16:30:00Z',
    created_by_id: 4,
    last_modified_date: '2024-01-26T11:10:00Z',
    last_modified_by_id: 2,
  },
  
  // Active SQL Server service
  {
    id: 5,
    name: 'warehouse-sqlserver',
    label: 'Data Warehouse SQL Server',
    description: 'SQL Server database for data warehousing',
    type: 'sqlserver',
    driver: 'sqlserver',
    is_active: true,
    status: 'active',
    config: BASE_SERVICE_CONFIGS.sqlserver,
    created_date: '2024-01-05T09:45:00Z',
    created_by_id: 5,
    last_modified_date: '2024-01-27T15:25:00Z',
    last_modified_by_id: 1,
  },
];

/**
 * Generate mock database service with custom overrides
 */
export const createMockDatabaseService = (overrides: Partial<DatabaseService> = {}): DatabaseService => {
  const drivers: DatabaseDriver[] = ['mysql', 'postgresql', 'mongodb', 'oracle', 'sqlserver'];
  const statuses: ServiceStatus[] = ['active', 'inactive', 'error', 'testing'];
  
  const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  const baseId = Math.floor(Math.random() * 10000) + 1000;
  
  const baseService: DatabaseService = {
    id: baseId,
    name: `mock-service-${baseId}`,
    label: `Mock ${randomDriver.toUpperCase()} Service`,
    description: `Generated mock ${randomDriver} database service for testing`,
    type: randomDriver,
    driver: randomDriver,
    is_active: Math.random() > 0.3, // 70% chance of being active
    status: randomStatus,
    config: BASE_SERVICE_CONFIGS[randomDriver],
    created_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    created_by_id: Math.floor(Math.random() * 10) + 1,
    last_modified_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    last_modified_by_id: Math.floor(Math.random() * 10) + 1,
    ...overrides
  };
  
  return baseService;
};

/**
 * Generate large dataset for virtualization testing
 */
export const generateLargeServiceDataset = (count: number = 1000): DatabaseService[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockDatabaseService({
      id: index + 1,
      name: `service-${String(index + 1).padStart(4, '0')}`,
      label: `Database Service ${index + 1}`,
    })
  );
};

/**
 * Minimal valid service for edge case testing
 */
export const MINIMAL_DATABASE_SERVICE: DatabaseService = {
  id: 999,
  name: 'minimal-service',
  label: 'Minimal Service',
  description: '',
  type: 'mysql',
  driver: 'mysql',
  is_active: true,
  status: 'active',
  config: {
    host: 'localhost',
    port: 3306,
    database: 'test',
    username: 'root',
    password: '',
    options: {},
  },
  created_date: '2024-01-01T00:00:00Z',
  created_by_id: 1,
  last_modified_date: '2024-01-01T00:00:00Z',
  last_modified_by_id: 1,
};

/**
 * Default mock services for tests
 */
export const mockDatabaseServices = MOCK_DATABASE_SERVICES;

// =============================================================================
// CONNECTION TEST FIXTURES
// =============================================================================

/**
 * Successful connection test results by database type
 */
export const SUCCESSFUL_CONNECTION_TESTS: Record<DatabaseDriver, ConnectionTestResult> = {
  mysql: {
    success: true,
    message: 'MySQL connection successful',
    details: {
      host: 'mysql.example.com',
      port: 3306,
      database: 'production_db',
      version: '8.0.33',
      responseTime: 245,
      charset: 'utf8mb4',
    },
    timestamp: '2024-01-01T12:00:00Z',
  },
  
  postgresql: {
    success: true,
    message: 'PostgreSQL connection successful',
    details: {
      host: 'postgres.example.com',
      port: 5432,
      database: 'production_db',
      version: '15.2',
      responseTime: 189,
      encoding: 'UTF8',
    },
    timestamp: '2024-01-01T12:00:00Z',
  },
  
  mongodb: {
    success: true,
    message: 'MongoDB connection successful',
    details: {
      host: 'mongodb.example.com',
      port: 27017,
      database: 'production_db',
      version: '6.0.4',
      responseTime: 156,
      replicaSet: 'rs0',
    },
    timestamp: '2024-01-01T12:00:00Z',
  },
  
  oracle: {
    success: true,
    message: 'Oracle connection successful',
    details: {
      host: 'oracle.example.com',
      port: 1521,
      database: 'ORCL',
      version: '19.3.0.0.0',
      responseTime: 423,
      serviceName: 'ORCL.example.com',
    },
    timestamp: '2024-01-01T12:00:00Z',
  },
  
  sqlserver: {
    success: true,
    message: 'SQL Server connection successful',
    details: {
      host: 'sqlserver.example.com',
      port: 1433,
      database: 'production_db',
      version: '15.0.2000.5',
      responseTime: 312,
      edition: 'Enterprise Edition',
    },
    timestamp: '2024-01-01T12:00:00Z',
  },
};

/**
 * Failed connection test results with various error scenarios
 */
export const FAILED_CONNECTION_TESTS: Record<string, ConnectionTestResult> = {
  connection_refused: {
    success: false,
    message: 'Connection refused',
    details: {
      error: 'ECONNREFUSED',
      code: 'CONNECTION_REFUSED',
      host: 'nonexistent.example.com',
      port: 3306,
    },
    timestamp: '2024-01-01T12:00:00Z',
  },
  
  authentication_failed: {
    success: false,
    message: 'Authentication failed',
    details: {
      error: 'Access denied for user',
      code: 'AUTH_FAILED',
      host: 'mysql.example.com',
      port: 3306,
      username: 'invalid_user',
    },
    timestamp: '2024-01-01T12:00:00Z',
  },
  
  database_not_found: {
    success: false,
    message: 'Database not found',
    details: {
      error: 'Unknown database',
      code: 'DATABASE_NOT_FOUND',
      host: 'mysql.example.com',
      port: 3306,
      database: 'nonexistent_db',
    },
    timestamp: '2024-01-01T12:00:00Z',
  },
  
  timeout: {
    success: false,
    message: 'Connection timeout',
    details: {
      error: 'ETIMEDOUT',
      code: 'CONNECTION_TIMEOUT',
      host: 'slow.example.com',
      port: 3306,
      timeout: 5000,
    },
    timestamp: '2024-01-01T12:00:00Z',
  },
  
  ssl_error: {
    success: false,
    message: 'SSL connection error',
    details: {
      error: 'SSL certificate verification failed',
      code: 'SSL_ERROR',
      host: 'secure.example.com',
      port: 3306,
    },
    timestamp: '2024-01-01T12:00:00Z',
  },
};

/**
 * Generate connection test result
 */
export const createMockConnectionTestResult = (
  success: boolean = true,
  driver: DatabaseDriver = 'mysql',
  errorType?: keyof typeof FAILED_CONNECTION_TESTS
): ConnectionTestResult => {
  if (success) {
    return {
      ...SUCCESSFUL_CONNECTION_TESTS[driver],
      details: {
        ...SUCCESSFUL_CONNECTION_TESTS[driver].details,
        responseTime: Math.floor(Math.random() * 1000) + 100, // 100-1100ms
      },
      timestamp: new Date().toISOString(),
    };
  } else {
    const failureType = errorType || 'connection_refused';
    return {
      ...FAILED_CONNECTION_TESTS[failureType],
      timestamp: new Date().toISOString(),
    };
  }
};

// =============================================================================
// SERVICE TYPE FIXTURES
// =============================================================================

/**
 * Complete service types for full feature access
 */
export const FULL_SERVICE_TYPES: ServiceType[] = [
  {
    name: 'mysql',
    label: 'MySQL',
    description: 'MySQL Database Service',
    group: 'Database',
    singleton: false,
    dependencies: [],
    subscription_required: false,
  },
  {
    name: 'postgresql',
    label: 'PostgreSQL',
    description: 'PostgreSQL Database Service',
    group: 'Database',
    singleton: false,
    dependencies: [],
    subscription_required: false,
  },
  {
    name: 'mongodb',
    label: 'MongoDB',
    description: 'MongoDB NoSQL Database',
    group: 'NoSQL',
    singleton: false,
    dependencies: [],
    subscription_required: true,
  },
  {
    name: 'oracle',
    label: 'Oracle Database',
    description: 'Oracle Enterprise Database',
    group: 'Enterprise',
    singleton: false,
    dependencies: [],
    subscription_required: true,
  },
  {
    name: 'sqlserver',
    label: 'SQL Server',
    description: 'Microsoft SQL Server Database',
    group: 'Microsoft',
    singleton: false,
    dependencies: [],
    subscription_required: true,
  },
];

/**
 * Limited service types for paywall testing
 */
export const LIMITED_SERVICE_TYPES: ServiceType[] = [
  {
    name: 'mysql',
    label: 'MySQL',
    description: 'MySQL Database Service',
    group: 'Database',
    singleton: false,
    dependencies: [],
    subscription_required: false,
  },
];

/**
 * Empty service types for paywall activation
 */
export const EMPTY_SERVICE_TYPES: ServiceType[] = [];

/**
 * Mock service types
 */
export const mockServiceTypes = FULL_SERVICE_TYPES;

// =============================================================================
// ERROR RESPONSE FIXTURES
// =============================================================================

/**
 * Standard API error responses
 */
export const API_ERROR_RESPONSES: Record<string, ApiErrorResponse> = {
  badRequest: {
    error: {
      code: 400,
      message: 'Bad Request: Invalid parameters provided',
    },
  },
  
  unauthorized: {
    error: {
      code: 401,
      message: 'Unauthorized: Authentication required',
    },
  },
  
  forbidden: {
    error: {
      code: 403,
      message: 'Forbidden: Insufficient permissions',
    },
  },
  
  notFound: {
    error: {
      code: 404,
      message: 'Not Found: Resource does not exist',
    },
  },
  
  conflict: {
    error: {
      code: 409,
      message: 'Conflict: Resource already exists',
    },
  },
  
  internalServerError: {
    error: {
      code: 500,
      message: 'Internal Server Error: An unexpected error occurred',
    },
  },
  
  serviceUnavailable: {
    error: {
      code: 503,
      message: 'Service Unavailable: Server is temporarily unavailable',
    },
  },
  
  validationError: {
    error: {
      code: 400,
      message: 'Validation Error: Required fields are missing',
      details: {
        name: 'Service name is required',
        type: 'Database type is required',
        config: 'Configuration is invalid',
      },
    },
  },
};

// =============================================================================
// FILTER AND SORT FIXTURES
// =============================================================================

/**
 * Common filter scenarios for testing
 */
export const FILTER_SCENARIOS: Record<string, ServiceListFilters> = {
  searchMysql: {
    search: 'mysql',
  },
  
  activeServices: {
    isActive: true,
  },
  
  inactiveServices: {
    isActive: false,
  },
  
  errorStatus: {
    status: ['error'],
  },
  
  databaseTypes: {
    type: ['mysql', 'postgresql'],
  },
  
  complexFilter: {
    search: 'production',
    type: ['mysql', 'postgresql'],
    status: ['active'],
    isActive: true,
  },
  
  emptyFilter: {},
};

/**
 * Common sorting scenarios
 */
export const SORT_SCENARIOS: Record<string, ServiceListSort> = {
  nameAsc: {
    field: 'name',
    direction: 'asc',
  },
  
  nameDesc: {
    field: 'name',
    direction: 'desc',
  },
  
  createdDateDesc: {
    field: 'created_date',
    direction: 'desc',
  },
  
  modifiedDateDesc: {
    field: 'last_modified_date',
    direction: 'desc',
  },
  
  typeAsc: {
    field: 'type',
    direction: 'asc',
  },
};

// =============================================================================
// PERFORMANCE BENCHMARKS
// =============================================================================

/**
 * Performance benchmarks and thresholds from technical specification
 */
export const PERFORMANCE_BENCHMARKS = {
  // Component rendering thresholds
  INITIAL_RENDER_THRESHOLD: 100, // 100ms for initial component render
  RE_RENDER_THRESHOLD: 50, // 50ms for component re-renders
  INTERACTION_THRESHOLD: 500, // 500ms for user interactions
  
  // Data fetching thresholds (per F-001-RQ-002)
  CONNECTION_TEST_THRESHOLD: 5000, // 5 seconds max for connection tests
  SERVICE_LIST_FETCH_THRESHOLD: 1000, // 1 second for service list fetch
  SERVICE_CRUD_THRESHOLD: 2000, // 2 seconds for CRUD operations
  
  // Virtualization thresholds (per F-002-RQ-002)
  LARGE_DATASET_SIZE: 1000, // 1000+ items for virtualization testing
  VIRTUAL_RENDER_THRESHOLD: 200, // 200ms for virtual table rendering
  SCROLL_PERFORMANCE_THRESHOLD: 16, // 16ms (60fps) for smooth scrolling
  
  // Memory usage thresholds
  MEMORY_LEAK_THRESHOLD: 50 * 1024 * 1024, // 50MB memory increase
  COMPONENT_CLEANUP_THRESHOLD: 100, // 100ms for component cleanup
  
  // Network and caching thresholds
  CACHE_HIT_RATIO_THRESHOLD: 0.8, // 80% cache hit ratio
  BACKGROUND_REFRESH_THRESHOLD: 30000, // 30 seconds for background refresh
  
  // Accessibility thresholds
  A11Y_FOCUS_THRESHOLD: 100, // 100ms for focus management
  KEYBOARD_NAVIGATION_THRESHOLD: 50, // 50ms for keyboard navigation
  
  // Bulk operation thresholds
  BULK_OPERATION_THRESHOLD: 5000, // 5 seconds for bulk operations
  MAX_BULK_SELECTION: 100, // Maximum 100 items for bulk selection
} as const;

// =============================================================================
// BULK ACTION FIXTURES
// =============================================================================

/**
 * Bulk action scenarios for testing
 */
export const BULK_ACTION_SCENARIOS = {
  deleteMultiple: {
    action: 'delete' as BulkActionType,
    serviceIds: [1, 2, 3],
    expectedConfirmation: true,
  },
  
  activateMultiple: {
    action: 'activate' as BulkActionType,
    serviceIds: [2, 4],
    expectedConfirmation: false,
  },
  
  deactivateMultiple: {
    action: 'deactivate' as BulkActionType,
    serviceIds: [1, 5],
    expectedConfirmation: false,
  },
  
  testConnections: {
    action: 'test' as BulkActionType,
    serviceIds: [1, 2, 3, 4, 5],
    expectedConfirmation: false,
  },
  
  largeSelection: {
    action: 'delete' as BulkActionType,
    serviceIds: Array.from({ length: 50 }, (_, i) => i + 1),
    expectedConfirmation: true,
  },
};

// =============================================================================
// EDGE CASE FIXTURES
// =============================================================================

/**
 * Edge cases and boundary conditions for comprehensive testing
 */
export const EDGE_CASE_FIXTURES = {
  // Malformed service data
  malformedService: {
    id: 'invalid-id' as any,
    name: '',
    type: 'invalid-type' as DatabaseDriver,
    // Missing required fields
  } as Partial<DatabaseService>,
  
  // Extremely long values
  longNameService: createMockDatabaseService({
    name: 'a'.repeat(1000),
    label: 'b'.repeat(500),
    description: 'c'.repeat(2000),
  }),
  
  // Special characters
  specialCharService: createMockDatabaseService({
    name: 'test-service_$@#%^&*()',
    label: 'Test Service with 特殊字符 and émojis 🚀',
    description: 'Service with special characters: <script>alert("xss")</script>',
  }),
  
  // Unicode and internationalization
  unicodeService: createMockDatabaseService({
    name: 'тест-сервис',
    label: 'テストサービス',
    description: '数据库服务测试',
  }),
  
  // Zero and negative IDs
  zeroIdService: createMockDatabaseService({ id: 0 }),
  negativeIdService: createMockDatabaseService({ id: -1 }),
  
  // Null and undefined values
  nullValueService: {
    ...createMockDatabaseService(),
    label: null as any,
    description: undefined as any,
  },
  
  // Empty arrays and objects
  emptyConfigService: createMockDatabaseService({
    config: {} as any,
  }),
  
  // Maximum values
  maxTimestampService: createMockDatabaseService({
    created_date: '9999-12-31T23:59:59.999Z',
    last_modified_date: '9999-12-31T23:59:59.999Z',
  }),
};

// =============================================================================
// TEST SCENARIOS
// =============================================================================

/**
 * Comprehensive test scenarios combining fixtures
 */
export const TEST_SCENARIOS = {
  // Standard operation scenarios
  standardWorkflow: {
    services: MOCK_DATABASE_SERVICES.slice(0, 5),
    filters: FILTER_SCENARIOS.emptyFilter,
    sorting: SORT_SCENARIOS.nameAsc,
  },
  
  // Large dataset scenario
  largeDataset: {
    services: generateLargeServiceDataset(PERFORMANCE_BENCHMARKS.LARGE_DATASET_SIZE),
    filters: FILTER_SCENARIOS.emptyFilter,
    sorting: SORT_SCENARIOS.nameAsc,
  },
  
  // Complex filtering scenario
  complexFiltering: {
    services: MOCK_DATABASE_SERVICES,
    filters: FILTER_SCENARIOS.complexFilter,
    sorting: SORT_SCENARIOS.modifiedDateDesc,
  },
  
  // Error scenario
  errorScenario: {
    services: [],
    error: API_ERROR_RESPONSES.internalServerError,
  },
  
  // Empty state scenario
  emptyState: {
    services: [],
    filters: FILTER_SCENARIOS.emptyFilter,
    sorting: SORT_SCENARIOS.nameAsc,
  },
  
  // Edge case scenario
  edgeCase: {
    services: [
      EDGE_CASE_FIXTURES.malformedService,
      EDGE_CASE_FIXTURES.longNameService,
      EDGE_CASE_FIXTURES.specialCharService,
    ] as DatabaseService[],
    filters: FILTER_SCENARIOS.emptyFilter,
    sorting: SORT_SCENARIOS.nameAsc,
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Database service fixtures
  MOCK_DATABASE_SERVICES,
  BASE_SERVICE_CONFIGS,
  MINIMAL_DATABASE_SERVICE,
  createMockDatabaseService,
  generateLargeServiceDataset,
  
  // Connection test fixtures
  SUCCESSFUL_CONNECTION_TESTS,
  FAILED_CONNECTION_TESTS,
  createMockConnectionTestResult,
  
  // Service type fixtures
  FULL_SERVICE_TYPES,
  LIMITED_SERVICE_TYPES,
  EMPTY_SERVICE_TYPES,
  mockServiceTypes,
  
  // Error response fixtures
  API_ERROR_RESPONSES,
  
  // Filter and sort fixtures
  FILTER_SCENARIOS,
  SORT_SCENARIOS,
  
  // Performance benchmarks
  PERFORMANCE_BENCHMARKS,
  
  // Bulk action fixtures
  BULK_ACTION_SCENARIOS,
  
  // Edge case fixtures
  EDGE_CASE_FIXTURES,
  
  // Test scenarios
  TEST_SCENARIOS,
};

// Default exports for common usage
export default {
  services: mockDatabaseServices,
  serviceTypes: mockServiceTypes,
  createService: createMockDatabaseService,
  createConnectionTest: createMockConnectionTestResult,
  benchmarks: PERFORMANCE_BENCHMARKS,
};