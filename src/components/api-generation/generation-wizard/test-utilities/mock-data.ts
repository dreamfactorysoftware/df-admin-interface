/**
 * API Generation Wizard Mock Data and Test Fixtures
 * 
 * Comprehensive mock data and fixtures for API generation wizard testing, including 
 * OpenAPI specifications, database schemas, service configurations, and wizard state 
 * objects. Provides realistic test data for unit tests, integration tests, and MSW 
 * handlers with type-safe interfaces compatible with React Hook Form and Zod validators.
 * 
 * @fileoverview Mock data for API generation wizard testing
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import type {
  WizardState,
  WizardStepInfo,
  ServiceSelectionData,
  TableSelectionData,
  EndpointConfigurationData,
  SecurityConfigurationData,
  GenerationPreviewData,
  GenerationResult,
  ServiceSelectionFormData,
  TableSelectionFormData,
  EndpointConfigurationFormData,
  SecurityConfigurationFormData,
  GenerationPreviewFormData,
  SelectedTable,
  SelectedField,
  EndpointSummary,
  OpenApiSpecification,
  CodeSample,
  SecuritySummary,
  PerformanceEstimation,
  GenerationStatistics,
  HttpMethod,
  DatabaseService,
  SchemaTable,
  SchemaField,
  ConnectionTestResult,
  ConnectionTestStatus,
} from '../types';

import type {
  DatabaseDriver,
  ServiceStatus,
  DatabaseConnectionFormData,
} from '../../../database-service/types';

// =============================================================================
// DATABASE SERVICE MOCK DATA
// =============================================================================

/**
 * Mock database services for different database types
 */
export const mockDatabaseServices: DatabaseService[] = [
  {
    id: 1,
    name: 'ecommerce_mysql',
    label: 'E-commerce MySQL Database',
    description: 'Primary MySQL database for e-commerce application',
    type: 'mysql' as DatabaseDriver,
    host: 'localhost',
    port: 3306,
    database: 'ecommerce_db',
    username: 'ecom_user',
    password: '********',
    is_active: true,
    status: 'active' as ServiceStatus,
    created_date: '2024-01-15T10:30:00Z',
    last_modified_date: '2024-01-20T14:45:00Z',
    created_by_id: 1,
    last_modified_by_id: 1,
    config: {
      charset: 'utf8mb4',
      timezone: 'UTC',
      ssl: {
        enabled: false,
        mode: 'disable',
      },
      pooling: {
        min: 0,
        max: 10,
        acquireTimeoutMillis: 60000,
        idleTimeoutMillis: 300000,
      },
    },
    deletable: true,
    api_doc_by_service_id: null,
    service_doc_by_service_id: null,
  },
  {
    id: 2,
    name: 'analytics_postgres',
    label: 'Analytics PostgreSQL Database',
    description: 'PostgreSQL database for analytics and reporting',
    type: 'postgresql' as DatabaseDriver,
    host: 'analytics.example.com',
    port: 5432,
    database: 'analytics_db',
    username: 'analytics_user',
    password: '********',
    is_active: true,
    status: 'active' as ServiceStatus,
    created_date: '2024-01-10T08:15:00Z',
    last_modified_date: '2024-01-18T16:20:00Z',
    created_by_id: 1,
    last_modified_by_id: 1,
    config: {
      charset: 'UTF8',
      timezone: 'UTC',
      ssl: {
        enabled: true,
        mode: 'require',
        rejectUnauthorized: true,
      },
      pooling: {
        min: 2,
        max: 20,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 600000,
      },
    },
    deletable: true,
    api_doc_by_service_id: null,
    service_doc_by_service_id: null,
  },
  {
    id: 3,
    name: 'inventory_mongodb',
    label: 'Inventory MongoDB Database',
    description: 'MongoDB database for inventory management',
    type: 'mongodb' as DatabaseDriver,
    host: 'inventory-cluster.example.com',
    port: 27017,
    database: 'inventory_db',
    username: 'inventory_user',
    password: '********',
    is_active: true,
    status: 'active' as ServiceStatus,
    created_date: '2024-01-12T12:00:00Z',
    last_modified_date: '2024-01-22T09:30:00Z',
    created_by_id: 2,
    last_modified_by_id: 2,
    config: {
      ssl: {
        enabled: true,
        mode: 'prefer',
      },
      pooling: {
        min: 1,
        max: 15,
        acquireTimeoutMillis: 45000,
        idleTimeoutMillis: 300000,
      },
    },
    deletable: false,
    api_doc_by_service_id: null,
    service_doc_by_service_id: null,
  },
  {
    id: 4,
    name: 'warehouse_snowflake',
    label: 'Data Warehouse Snowflake',
    description: 'Snowflake data warehouse for business intelligence',
    type: 'snowflake' as DatabaseDriver,
    host: 'company.snowflakecomputing.com',
    port: 443,
    database: 'WAREHOUSE_DB',
    username: 'WAREHOUSE_USER',
    password: '********',
    is_active: true,
    status: 'active' as ServiceStatus,
    created_date: '2024-01-08T14:20:00Z',
    last_modified_date: '2024-01-25T11:15:00Z',
    created_by_id: 1,
    last_modified_by_id: 3,
    config: {
      warehouse: 'COMPUTE_WH',
      role: 'ACCOUNTADMIN',
      ssl: {
        enabled: true,
        mode: 'require',
      },
    },
    deletable: true,
    api_doc_by_service_id: null,
    service_doc_by_service_id: null,
  },
  {
    id: 5,
    name: 'legacy_oracle',
    label: 'Legacy Oracle Database',
    description: 'Legacy Oracle database for historical data',
    type: 'oracle' as DatabaseDriver,
    host: 'legacy-db.internal.com',
    port: 1521,
    database: 'LEGACY_DB',
    username: 'legacy_user',
    password: '********',
    is_active: false,
    status: 'inactive' as ServiceStatus,
    created_date: '2023-12-01T10:00:00Z',
    last_modified_date: '2024-01-05T15:30:00Z',
    created_by_id: 3,
    last_modified_by_id: 1,
    config: {
      serviceName: 'LEGACY_DB',
      ssl: {
        enabled: false,
        mode: 'disable',
      },
      pooling: {
        min: 0,
        max: 5,
        acquireTimeoutMillis: 120000,
        idleTimeoutMillis: 900000,
      },
    },
    deletable: true,
    api_doc_by_service_id: null,
    service_doc_by_service_id: null,
  },
];

/**
 * Mock connection test results for different scenarios
 */
export const mockConnectionTestResults: Record<string, ConnectionTestResult> = {
  success: {
    success: true,
    message: 'Connection successful',
    details: 'Successfully connected to MySQL database',
    duration: 1250,
    timestamp: '2024-01-25T10:30:00Z',
    metadata: {
      server_version: '8.0.35',
      character_set: 'utf8mb4',
      timezone: 'UTC',
      ssl_enabled: false,
      connection_id: 12345,
    },
    status: 'success' as ConnectionTestStatus,
  },
  failure: {
    success: false,
    message: 'Connection failed',
    details: 'Access denied for user \'invalid_user\'@\'localhost\' (using password: YES)',
    duration: 5000,
    timestamp: '2024-01-25T10:35:00Z',
    metadata: {
      error_code: 1045,
      error_state: '28000',
      attempted_host: 'localhost',
      attempted_port: 3306,
    },
    status: 'error' as ConnectionTestStatus,
  },
  timeout: {
    success: false,
    message: 'Connection timeout',
    details: 'Connection attempt timed out after 30 seconds',
    duration: 30000,
    timestamp: '2024-01-25T10:40:00Z',
    metadata: {
      timeout_duration: 30000,
      attempted_host: 'unreachable-host.example.com',
      attempted_port: 5432,
    },
    status: 'timeout' as ConnectionTestStatus,
  },
  testing: {
    success: false,
    message: 'Testing connection...',
    details: 'Connection test in progress',
    duration: 0,
    timestamp: '2024-01-25T10:45:00Z',
    metadata: {},
    status: 'testing' as ConnectionTestStatus,
  },
};

// =============================================================================
// DATABASE SCHEMA MOCK DATA
// =============================================================================

/**
 * Mock schema tables for e-commerce database
 */
export const mockSchemaTables: SchemaTable[] = [
  {
    name: 'users',
    schema: 'ecommerce_db',
    type: 'table',
    description: 'User accounts and profile information',
    rowCount: 15420,
    fields: [
      {
        name: 'id',
        type: 'int',
        isNullable: false,
        isPrimaryKey: true,
        isAutoIncrement: true,
        description: 'Unique user identifier',
        defaultValue: null,
        maxLength: null,
        precision: null,
        scale: null,
      },
      {
        name: 'email',
        type: 'varchar',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'User email address',
        defaultValue: null,
        maxLength: 255,
        precision: null,
        scale: null,
      },
      {
        name: 'first_name',
        type: 'varchar',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'User first name',
        defaultValue: null,
        maxLength: 100,
        precision: null,
        scale: null,
      },
      {
        name: 'last_name',
        type: 'varchar',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'User last name',
        defaultValue: null,
        maxLength: 100,
        precision: null,
        scale: null,
      },
      {
        name: 'password_hash',
        type: 'varchar',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Hashed password',
        defaultValue: null,
        maxLength: 255,
        precision: null,
        scale: null,
      },
      {
        name: 'created_at',
        type: 'timestamp',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Account creation timestamp',
        defaultValue: 'CURRENT_TIMESTAMP',
        maxLength: null,
        precision: null,
        scale: null,
      },
      {
        name: 'updated_at',
        type: 'timestamp',
        isNullable: true,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Last update timestamp',
        defaultValue: null,
        maxLength: null,
        precision: null,
        scale: null,
      },
      {
        name: 'is_active',
        type: 'boolean',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Account active status',
        defaultValue: true,
        maxLength: null,
        precision: null,
        scale: null,
      },
    ],
    indexes: ['PRIMARY', 'idx_users_email', 'idx_users_created_at'],
    relationships: [
      {
        type: 'one-to-many',
        table: 'orders',
        field: 'user_id',
        referencedField: 'id',
      },
      {
        type: 'one-to-many',
        table: 'shopping_carts',
        field: 'user_id',
        referencedField: 'id',
      },
    ],
  },
  {
    name: 'products',
    schema: 'ecommerce_db',
    type: 'table',
    description: 'Product catalog information',
    rowCount: 8750,
    fields: [
      {
        name: 'id',
        type: 'int',
        isNullable: false,
        isPrimaryKey: true,
        isAutoIncrement: true,
        description: 'Unique product identifier',
        defaultValue: null,
        maxLength: null,
        precision: null,
        scale: null,
      },
      {
        name: 'sku',
        type: 'varchar',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Stock keeping unit',
        defaultValue: null,
        maxLength: 50,
        precision: null,
        scale: null,
      },
      {
        name: 'name',
        type: 'varchar',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Product name',
        defaultValue: null,
        maxLength: 255,
        precision: null,
        scale: null,
      },
      {
        name: 'description',
        type: 'text',
        isNullable: true,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Product description',
        defaultValue: null,
        maxLength: 65535,
        precision: null,
        scale: null,
      },
      {
        name: 'price',
        type: 'decimal',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Product price',
        defaultValue: null,
        maxLength: null,
        precision: 10,
        scale: 2,
      },
      {
        name: 'category_id',
        type: 'int',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Product category reference',
        defaultValue: null,
        maxLength: null,
        precision: null,
        scale: null,
      },
      {
        name: 'stock_quantity',
        type: 'int',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Available stock quantity',
        defaultValue: 0,
        maxLength: null,
        precision: null,
        scale: null,
      },
      {
        name: 'is_active',
        type: 'boolean',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Product active status',
        defaultValue: true,
        maxLength: null,
        precision: null,
        scale: null,
      },
      {
        name: 'created_at',
        type: 'timestamp',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Product creation timestamp',
        defaultValue: 'CURRENT_TIMESTAMP',
        maxLength: null,
        precision: null,
        scale: null,
      },
    ],
    indexes: ['PRIMARY', 'idx_products_sku', 'idx_products_category_id', 'idx_products_price'],
    relationships: [
      {
        type: 'many-to-one',
        table: 'categories',
        field: 'category_id',
        referencedField: 'id',
      },
      {
        type: 'one-to-many',
        table: 'order_items',
        field: 'product_id',
        referencedField: 'id',
      },
    ],
  },
  {
    name: 'orders',
    schema: 'ecommerce_db',
    type: 'table',
    description: 'Customer orders and order information',
    rowCount: 45230,
    fields: [
      {
        name: 'id',
        type: 'int',
        isNullable: false,
        isPrimaryKey: true,
        isAutoIncrement: true,
        description: 'Unique order identifier',
        defaultValue: null,
        maxLength: null,
        precision: null,
        scale: null,
      },
      {
        name: 'order_number',
        type: 'varchar',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Human-readable order number',
        defaultValue: null,
        maxLength: 50,
        precision: null,
        scale: null,
      },
      {
        name: 'user_id',
        type: 'int',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Customer user reference',
        defaultValue: null,
        maxLength: null,
        precision: null,
        scale: null,
      },
      {
        name: 'status',
        type: 'enum',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Order status',
        defaultValue: 'pending',
        maxLength: null,
        precision: null,
        scale: null,
      },
      {
        name: 'total_amount',
        type: 'decimal',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Total order amount',
        defaultValue: null,
        maxLength: null,
        precision: 10,
        scale: 2,
      },
      {
        name: 'shipping_address',
        type: 'text',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Shipping address',
        defaultValue: null,
        maxLength: 1000,
        precision: null,
        scale: null,
      },
      {
        name: 'created_at',
        type: 'timestamp',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Order creation timestamp',
        defaultValue: 'CURRENT_TIMESTAMP',
        maxLength: null,
        precision: null,
        scale: null,
      },
      {
        name: 'shipped_at',
        type: 'timestamp',
        isNullable: true,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Order shipping timestamp',
        defaultValue: null,
        maxLength: null,
        precision: null,
        scale: null,
      },
    ],
    indexes: ['PRIMARY', 'idx_orders_order_number', 'idx_orders_user_id', 'idx_orders_status', 'idx_orders_created_at'],
    relationships: [
      {
        type: 'many-to-one',
        table: 'users',
        field: 'user_id',
        referencedField: 'id',
      },
      {
        type: 'one-to-many',
        table: 'order_items',
        field: 'order_id',
        referencedField: 'id',
      },
    ],
  },
  {
    name: 'categories',
    schema: 'ecommerce_db',
    type: 'table',
    description: 'Product categories and hierarchy',
    rowCount: 156,
    fields: [
      {
        name: 'id',
        type: 'int',
        isNullable: false,
        isPrimaryKey: true,
        isAutoIncrement: true,
        description: 'Unique category identifier',
        defaultValue: null,
        maxLength: null,
        precision: null,
        scale: null,
      },
      {
        name: 'name',
        type: 'varchar',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Category name',
        defaultValue: null,
        maxLength: 100,
        precision: null,
        scale: null,
      },
      {
        name: 'slug',
        type: 'varchar',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'URL-friendly category identifier',
        defaultValue: null,
        maxLength: 100,
        precision: null,
        scale: null,
      },
      {
        name: 'parent_id',
        type: 'int',
        isNullable: true,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Parent category reference',
        defaultValue: null,
        maxLength: null,
        precision: null,
        scale: null,
      },
      {
        name: 'sort_order',
        type: 'int',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Category display order',
        defaultValue: 0,
        maxLength: null,
        precision: null,
        scale: null,
      },
      {
        name: 'is_active',
        type: 'boolean',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        description: 'Category active status',
        defaultValue: true,
        maxLength: null,
        precision: null,
        scale: null,
      },
    ],
    indexes: ['PRIMARY', 'idx_categories_slug', 'idx_categories_parent_id'],
    relationships: [
      {
        type: 'self-referencing',
        table: 'categories',
        field: 'parent_id',
        referencedField: 'id',
      },
      {
        type: 'one-to-many',
        table: 'products',
        field: 'category_id',
        referencedField: 'id',
      },
    ],
  },
];

/**
 * Mock schema fields for complex field types
 */
export const mockComplexSchemaFields: SchemaField[] = [
  {
    name: 'metadata',
    type: 'json',
    isNullable: true,
    isPrimaryKey: false,
    isAutoIncrement: false,
    description: 'JSON metadata field',
    defaultValue: null,
    maxLength: null,
    precision: null,
    scale: null,
  },
  {
    name: 'coordinates',
    type: 'point',
    isNullable: true,
    isPrimaryKey: false,
    isAutoIncrement: false,
    description: 'Geographic coordinates',
    defaultValue: null,
    maxLength: null,
    precision: null,
    scale: null,
  },
  {
    name: 'tags',
    type: 'array',
    isNullable: true,
    isPrimaryKey: false,
    isAutoIncrement: false,
    description: 'Array of tags',
    defaultValue: null,
    maxLength: null,
    precision: null,
    scale: null,
  },
];

// =============================================================================
// WIZARD STATE MOCK DATA
// =============================================================================

/**
 * Mock wizard steps with different states
 */
export const mockWizardSteps: WizardStepInfo[] = [
  {
    step: 'service-selection',
    title: 'Select Database Service',
    description: 'Choose the database service to generate APIs for',
    order: 1,
    completed: true,
    active: false,
    accessible: true,
    valid: true,
    estimatedTime: 2,
  },
  {
    step: 'table-selection',
    title: 'Select Tables',
    description: 'Choose database tables and configure fields',
    order: 2,
    completed: true,
    active: false,
    accessible: true,
    valid: true,
    estimatedTime: 5,
  },
  {
    step: 'endpoint-configuration',
    title: 'Configure Endpoints',
    description: 'Set up API endpoint parameters and behavior',
    order: 3,
    completed: false,
    active: true,
    accessible: true,
    valid: false,
    estimatedTime: 8,
  },
  {
    step: 'security-configuration',
    title: 'Configure Security',
    description: 'Set up authentication and authorization',
    order: 4,
    completed: false,
    active: false,
    accessible: false,
    valid: false,
    estimatedTime: 6,
  },
  {
    step: 'generation-preview',
    title: 'Preview & Generate',
    description: 'Review configuration and generate APIs',
    order: 5,
    completed: false,
    active: false,
    accessible: false,
    valid: false,
    estimatedTime: 3,
  },
  {
    step: 'generation-complete',
    title: 'Complete',
    description: 'API generation completed successfully',
    order: 6,
    completed: false,
    active: false,
    accessible: false,
    valid: false,
    estimatedTime: 1,
  },
];

/**
 * Mock service selection data with different scenarios
 */
export const mockServiceSelectionData: Record<string, ServiceSelectionData> = {
  initial: {
    selectedService: null,
    availableServices: mockDatabaseServices,
    loading: false,
    error: null,
    connectionTest: null,
    testingConnection: false,
    filter: {
      activeOnly: true,
      recentFirst: true,
    },
    createNewService: false,
    newServiceConfig: null,
  },
  withSelection: {
    selectedService: mockDatabaseServices[0],
    availableServices: mockDatabaseServices,
    loading: false,
    error: null,
    connectionTest: mockConnectionTestResults.success,
    testingConnection: false,
    filter: {
      activeOnly: true,
      recentFirst: true,
    },
    createNewService: false,
    newServiceConfig: null,
  },
  loading: {
    selectedService: null,
    availableServices: [],
    loading: true,
    error: null,
    connectionTest: null,
    testingConnection: false,
    filter: {
      activeOnly: true,
      recentFirst: true,
    },
    createNewService: false,
    newServiceConfig: null,
  },
  error: {
    selectedService: null,
    availableServices: [],
    loading: false,
    error: 'Failed to load database services',
    connectionTest: null,
    testingConnection: false,
    filter: {
      activeOnly: true,
      recentFirst: true,
    },
    createNewService: false,
    newServiceConfig: null,
  },
  testing: {
    selectedService: mockDatabaseServices[0],
    availableServices: mockDatabaseServices,
    loading: false,
    error: null,
    connectionTest: null,
    testingConnection: true,
    filter: {
      activeOnly: true,
      recentFirst: true,
    },
    createNewService: false,
    newServiceConfig: null,
  },
  createNew: {
    selectedService: null,
    availableServices: mockDatabaseServices,
    loading: false,
    error: null,
    connectionTest: null,
    testingConnection: false,
    filter: {
      activeOnly: true,
      recentFirst: true,
    },
    createNewService: true,
    newServiceConfig: {
      name: 'new_postgres_service',
      description: 'New PostgreSQL service for testing',
      type: 'postgresql',
      config: {
        host: 'new-postgres.example.com',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
      },
      activate: true,
    },
  },
};

/**
 * Mock selected tables with comprehensive configuration
 */
export const mockSelectedTables: SelectedTable[] = [
  {
    name: 'users',
    schema: 'ecommerce_db',
    label: 'User Accounts',
    description: 'User accounts and profile information',
    selectedFields: [
      {
        name: 'id',
        type: 'int',
        included: true,
        readable: true,
        writable: false,
        required: true,
        label: 'User ID',
        description: 'Unique user identifier',
        isPrimaryKey: true,
        isForeignKey: false,
      },
      {
        name: 'email',
        type: 'varchar',
        included: true,
        readable: true,
        writable: true,
        required: true,
        label: 'Email Address',
        description: 'User email address',
        isPrimaryKey: false,
        isForeignKey: false,
        validation: {
          pattern: '^[^@]+@[^@]+\\.[^@]+$',
          errorMessage: 'Invalid email format',
        },
      },
      {
        name: 'first_name',
        type: 'varchar',
        included: true,
        readable: true,
        writable: true,
        required: true,
        label: 'First Name',
        description: 'User first name',
        isPrimaryKey: false,
        isForeignKey: false,
        validation: {
          minLength: 1,
          maxLength: 100,
        },
      },
      {
        name: 'last_name',
        type: 'varchar',
        included: true,
        readable: true,
        writable: true,
        required: true,
        label: 'Last Name',
        description: 'User last name',
        isPrimaryKey: false,
        isForeignKey: false,
        validation: {
          minLength: 1,
          maxLength: 100,
        },
      },
      {
        name: 'password_hash',
        type: 'varchar',
        included: false,
        readable: false,
        writable: false,
        required: false,
        label: 'Password Hash',
        description: 'Hashed password',
        isPrimaryKey: false,
        isForeignKey: false,
      },
      {
        name: 'created_at',
        type: 'timestamp',
        included: true,
        readable: true,
        writable: false,
        required: false,
        label: 'Created At',
        description: 'Account creation timestamp',
        isPrimaryKey: false,
        isForeignKey: false,
      },
      {
        name: 'is_active',
        type: 'boolean',
        included: true,
        readable: true,
        writable: true,
        required: true,
        label: 'Active Status',
        description: 'Account active status',
        isPrimaryKey: false,
        isForeignKey: false,
        defaultValue: true,
      },
    ],
    apiConfig: {
      methods: {
        get: true,
        post: true,
        put: true,
        patch: true,
        delete: false,
        custom: [],
      },
      pathOverride: '/api/users',
      queryParams: {
        enableLimit: true,
        enableOffset: true,
        enableOrder: true,
        enableFilter: true,
        enableFields: true,
        customParams: [],
        defaults: {
          limit: 25,
          offset: 0,
        },
      },
      responseFormat: {
        includeMetadata: true,
        includeCount: true,
        wrapperFormat: 'envelope',
        fieldTransforms: [],
      },
      pagination: {
        enabled: true,
        defaultPageSize: 25,
        maxPageSize: 1000,
        style: 'offset',
        includeTotal: true,
      },
      filtering: {
        enabled: true,
        allowedOperators: ['eq', 'ne', 'like', 'gt', 'lt', 'in'],
        filterableFields: ['email', 'first_name', 'last_name', 'is_active'],
        customFilters: [],
      },
      sorting: {
        enabled: true,
        sortableFields: ['id', 'email', 'first_name', 'last_name', 'created_at'],
        defaultSort: [{ field: 'id', direction: 'asc' }],
        maxSortFields: 3,
      },
      middleware: ['authentication', 'rate-limiting'],
    },
    enabled: true,
    priority: 1,
    customSettings: {
      alias: 'users',
      tags: ['user-management', 'authentication'],
      category: 'core',
      permissions: {
        read: true,
        write: true,
        delete: false,
      },
      metadata: {
        tableType: 'master',
        businessCritical: true,
      },
    },
  },
  {
    name: 'products',
    schema: 'ecommerce_db',
    label: 'Product Catalog',
    description: 'Product catalog information',
    selectedFields: [
      {
        name: 'id',
        type: 'int',
        included: true,
        readable: true,
        writable: false,
        required: true,
        label: 'Product ID',
        description: 'Unique product identifier',
        isPrimaryKey: true,
        isForeignKey: false,
      },
      {
        name: 'sku',
        type: 'varchar',
        included: true,
        readable: true,
        writable: true,
        required: true,
        label: 'SKU',
        description: 'Stock keeping unit',
        isPrimaryKey: false,
        isForeignKey: false,
        validation: {
          pattern: '^[A-Z0-9-]+$',
          maxLength: 50,
        },
      },
      {
        name: 'name',
        type: 'varchar',
        included: true,
        readable: true,
        writable: true,
        required: true,
        label: 'Product Name',
        description: 'Product name',
        isPrimaryKey: false,
        isForeignKey: false,
        validation: {
          minLength: 1,
          maxLength: 255,
        },
      },
      {
        name: 'description',
        type: 'text',
        included: true,
        readable: true,
        writable: true,
        required: false,
        label: 'Description',
        description: 'Product description',
        isPrimaryKey: false,
        isForeignKey: false,
      },
      {
        name: 'price',
        type: 'decimal',
        included: true,
        readable: true,
        writable: true,
        required: true,
        label: 'Price',
        description: 'Product price',
        isPrimaryKey: false,
        isForeignKey: false,
        validation: {
          min: 0,
          max: 999999.99,
        },
      },
      {
        name: 'category_id',
        type: 'int',
        included: true,
        readable: true,
        writable: true,
        required: true,
        label: 'Category ID',
        description: 'Product category reference',
        isPrimaryKey: false,
        isForeignKey: true,
      },
      {
        name: 'stock_quantity',
        type: 'int',
        included: true,
        readable: true,
        writable: true,
        required: true,
        label: 'Stock Quantity',
        description: 'Available stock quantity',
        isPrimaryKey: false,
        isForeignKey: false,
        validation: {
          min: 0,
        },
        defaultValue: 0,
      },
      {
        name: 'is_active',
        type: 'boolean',
        included: true,
        readable: true,
        writable: true,
        required: true,
        label: 'Active Status',
        description: 'Product active status',
        isPrimaryKey: false,
        isForeignKey: false,
        defaultValue: true,
      },
    ],
    apiConfig: {
      methods: {
        get: true,
        post: true,
        put: true,
        patch: true,
        delete: true,
        custom: [
          {
            method: 'PATCH',
            description: 'Update stock quantity',
            enabled: true,
            parameters: {
              operation: 'stock_update',
              quantity: 'number',
            },
          },
        ],
      },
      pathOverride: '/api/products',
      queryParams: {
        enableLimit: true,
        enableOffset: true,
        enableOrder: true,
        enableFilter: true,
        enableFields: true,
        customParams: [
          {
            name: 'include_inactive',
            type: 'boolean',
            description: 'Include inactive products',
            required: false,
            defaultValue: false,
          },
        ],
        defaults: {
          limit: 50,
          offset: 0,
        },
      },
      responseFormat: {
        includeMetadata: true,
        includeCount: true,
        wrapperFormat: 'envelope',
        fieldTransforms: [
          {
            sourceField: 'price',
            targetField: 'formatted_price',
            transform: 'format',
            parameters: {
              format: 'currency',
              currency: 'USD',
            },
          },
        ],
      },
      pagination: {
        enabled: true,
        defaultPageSize: 50,
        maxPageSize: 500,
        style: 'offset',
        includeTotal: true,
      },
      filtering: {
        enabled: true,
        allowedOperators: ['eq', 'ne', 'like', 'gt', 'lt', 'gte', 'lte', 'in', 'between'],
        filterableFields: ['sku', 'name', 'category_id', 'price', 'stock_quantity', 'is_active'],
        customFilters: [
          {
            name: 'in_stock',
            description: 'Products with stock available',
            expression: 'stock_quantity > 0',
            parameters: [],
          },
          {
            name: 'price_range',
            description: 'Products within price range',
            expression: 'price BETWEEN :min_price AND :max_price',
            parameters: [
              {
                name: 'min_price',
                type: 'decimal',
                required: true,
              },
              {
                name: 'max_price',
                type: 'decimal',
                required: true,
              },
            ],
          },
        ],
      },
      sorting: {
        enabled: true,
        sortableFields: ['id', 'sku', 'name', 'price', 'stock_quantity', 'created_at'],
        defaultSort: [{ field: 'name', direction: 'asc' }],
        maxSortFields: 3,
      },
      middleware: ['authentication', 'rate-limiting', 'caching'],
    },
    enabled: true,
    priority: 2,
    customSettings: {
      alias: 'products',
      tags: ['e-commerce', 'catalog', 'inventory'],
      category: 'business',
      permissions: {
        read: true,
        write: true,
        delete: true,
      },
      metadata: {
        tableType: 'transaction',
        businessCritical: true,
        cached: true,
      },
    },
  },
];

/**
 * Mock table selection data with different states
 */
export const mockTableSelectionData: Record<string, TableSelectionData> = {
  initial: {
    availableTables: mockSchemaTables,
    selectedTables: [],
    loading: false,
    error: null,
    lastDiscovered: '2024-01-25T10:00:00Z',
    filter: {
      primaryKeyOnly: false,
      foreignKeyOnly: false,
      hideSystemTables: true,
      hideEmptyTables: false,
    },
    bulkSelection: {
      selectAll: false,
      selectAllFields: false,
      bulkOperationInProgress: false,
    },
    tableMetadata: new Map(),
    refreshing: false,
    totalTables: mockSchemaTables.length,
    pagination: {
      currentPage: 1,
      pageSize: 50,
      totalItems: mockSchemaTables.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  },
  withSelection: {
    availableTables: mockSchemaTables,
    selectedTables: mockSelectedTables,
    loading: false,
    error: null,
    lastDiscovered: '2024-01-25T10:00:00Z',
    filter: {
      primaryKeyOnly: false,
      foreignKeyOnly: false,
      hideSystemTables: true,
      hideEmptyTables: false,
    },
    bulkSelection: {
      selectAll: false,
      selectAllFields: true,
      bulkOperationInProgress: false,
    },
    tableMetadata: new Map([
      ['users', {
        name: 'users',
        rowCount: 15420,
        sizeEstimate: '2.3 MB',
        lastModified: '2024-01-24T15:30:00Z',
        indexes: ['PRIMARY', 'idx_users_email'],
        relationships: ['orders', 'shopping_carts'],
        constraints: ['UNIQUE(email)', 'CHECK(is_active IN (0,1))'],
        additionalInfo: {
          hasAutoIncrement: true,
          hasTimestamps: true,
          charset: 'utf8mb4',
        },
      }],
      ['products', {
        name: 'products',
        rowCount: 8750,
        sizeEstimate: '5.7 MB',
        lastModified: '2024-01-25T09:15:00Z',
        indexes: ['PRIMARY', 'idx_products_sku', 'idx_products_category_id'],
        relationships: ['categories', 'order_items'],
        constraints: ['UNIQUE(sku)', 'FOREIGN KEY(category_id)'],
        additionalInfo: {
          hasAutoIncrement: true,
          hasTimestamps: true,
          hasJsonFields: false,
        },
      }],
    ]),
    refreshing: false,
    totalTables: mockSchemaTables.length,
    pagination: {
      currentPage: 1,
      pageSize: 50,
      totalItems: mockSchemaTables.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  },
  loading: {
    availableTables: [],
    selectedTables: [],
    loading: true,
    error: null,
    lastDiscovered: null,
    filter: {
      primaryKeyOnly: false,
      foreignKeyOnly: false,
      hideSystemTables: true,
      hideEmptyTables: false,
    },
    bulkSelection: {
      selectAll: false,
      selectAllFields: false,
      bulkOperationInProgress: false,
    },
    tableMetadata: new Map(),
    refreshing: false,
    totalTables: 0,
    pagination: {
      currentPage: 1,
      pageSize: 50,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  },
  error: {
    availableTables: [],
    selectedTables: [],
    loading: false,
    error: 'Failed to discover database schema',
    lastDiscovered: null,
    filter: {
      primaryKeyOnly: false,
      foreignKeyOnly: false,
      hideSystemTables: true,
      hideEmptyTables: false,
    },
    bulkSelection: {
      selectAll: false,
      selectAllFields: false,
      bulkOperationInProgress: false,
    },
    tableMetadata: new Map(),
    refreshing: false,
    totalTables: 0,
    pagination: {
      currentPage: 1,
      pageSize: 50,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  },
};

// =============================================================================
// ENDPOINT CONFIGURATION MOCK DATA
// =============================================================================

/**
 * Mock endpoint configuration data
 */
export const mockEndpointConfigurationData: EndpointConfigurationData = {
  globalSettings: {
    basePath: '/api/v1',
    version: '1.0.0',
    defaultResponseFormat: 'json',
    enableDocumentation: true,
    enableLogging: true,
    enableCompression: true,
    defaultPageSize: 25,
    maxPageSize: 1000,
    requestTimeout: 30,
    httpsOnly: false,
  },
  tableConfigurations: new Map([
    ['users', {
      tableName: 'users',
      pathOverride: '/api/users',
      enabledMethods: new Set(['GET', 'POST', 'PUT', 'PATCH'] as HttpMethod[]),
      methodConfigs: new Map([
        ['GET', {
          method: 'GET',
          description: 'Retrieve user information',
          parameters: [
            {
              name: 'id',
              location: 'path',
              type: 'number',
              description: 'User ID',
              required: true,
            },
            {
              name: 'include_inactive',
              location: 'query',
              type: 'boolean',
              description: 'Include inactive users',
              required: false,
              defaultValue: false,
            },
          ],
          successCodes: [200],
          errorCodes: [400, 401, 404, 500],
          tags: ['users', 'authentication'],
          requiresAuth: true,
          requiredPermissions: ['user:read'],
        }],
        ['POST', {
          method: 'POST',
          description: 'Create new user',
          parameters: [
            {
              name: 'user',
              location: 'body',
              type: 'object',
              description: 'User data',
              required: true,
            },
          ],
          successCodes: [201],
          errorCodes: [400, 401, 409, 500],
          tags: ['users', 'authentication'],
          requiresAuth: true,
          requiredPermissions: ['user:write'],
        }],
      ]),
      customQueryParams: [],
      responseTransforms: [],
      requestValidators: [
        {
          name: 'email_format',
          description: 'Validate email format',
          type: 'schema',
          rules: {
            pattern: '^[^@]+@[^@]+\\.[^@]+$',
          },
          enabled: true,
          order: 1,
        },
      ],
      businessLogicHooks: [],
      metadata: {
        title: 'User Management API',
        description: 'API endpoints for user account management',
        version: '1.0.0',
        tags: ['users', 'authentication'],
        createdAt: '2024-01-25T10:00:00Z',
        lastModified: '2024-01-25T14:30:00Z',
        externalDocs: [],
      },
    }],
  ]),
  customEndpoints: [
    {
      id: 'auth-login',
      name: 'User Login',
      path: '/api/auth/login',
      method: 'POST',
      description: 'Authenticate user and return access token',
      handler: 'AuthController.login',
      parameters: [
        {
          name: 'credentials',
          location: 'body',
          type: 'object',
          description: 'User credentials',
          required: true,
          validation: {
            email: 'string',
            password: 'string',
          },
        },
      ],
      security: ['basic-auth'],
      tags: ['authentication'],
      enabled: true,
    },
    {
      id: 'health-check',
      name: 'Health Check',
      path: '/api/health',
      method: 'GET',
      description: 'API health status check',
      handler: 'HealthController.check',
      parameters: [],
      security: [],
      tags: ['monitoring'],
      enabled: true,
    },
  ],
  middlewareConfig: [
    {
      name: 'authentication',
      description: 'JWT token authentication',
      type: 'authentication',
      config: {
        tokenHeader: 'Authorization',
        tokenPrefix: 'Bearer',
        secretKey: 'jwt-secret',
        algorithm: 'HS256',
      },
      order: 1,
      enabled: true,
    },
    {
      name: 'rate-limiting',
      description: 'API rate limiting',
      type: 'custom',
      config: {
        windowMs: 900000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests, please try again later',
      },
      order: 2,
      enabled: true,
    },
  ],
  rateLimiting: {
    enabled: true,
    defaultLimits: {
      requests: 100,
      window: 3600, // 1 hour
      message: 'Rate limit exceeded',
    },
    endpointLimits: new Map([
      ['/api/auth/login', {
        requests: 5,
        window: 900, // 15 minutes
        message: 'Too many login attempts',
      }],
    ]),
    userLimits: new Map(),
    storage: 'memory',
    includeHeaders: true,
  },
  corsConfig: {
    enabled: true,
    allowedOrigins: ['http://localhost:3000', 'https://app.example.com'],
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    allowCredentials: true,
    maxAge: 86400, // 24 hours
  },
  cachingConfig: {
    enabled: true,
    defaultTtl: 300, // 5 minutes
    endpointSettings: new Map([
      ['/api/users', {
        enabled: true,
        ttl: 600, // 10 minutes
        keyPattern: 'users:{id}',
        tags: ['users'],
      }],
      ['/api/products', {
        enabled: true,
        ttl: 1800, // 30 minutes
        keyPattern: 'products:{id}',
        tags: ['products'],
      }],
    ]),
    storage: 'redis',
    invalidationStrategy: 'automatic',
  },
  loggingConfig: {
    enabled: true,
    level: 'info',
    format: 'json',
    includeRequestBody: false,
    includeResponseBody: false,
    includeHeaders: true,
    retentionDays: 30,
    storage: 'database',
  },
  validationResults: [],
  loading: false,
  error: null,
};

// =============================================================================
// SECURITY CONFIGURATION MOCK DATA
// =============================================================================

/**
 * Mock security configuration data
 */
export const mockSecurityConfigurationData: SecurityConfigurationData = {
  authenticationConfig: {
    enabled: true,
    methods: [
      {
        type: 'jwt',
        name: 'JWT Token Authentication',
        description: 'JSON Web Token based authentication',
        enabled: true,
        config: {
          secretKey: 'jwt-secret-key',
          algorithm: 'HS256',
          expiresIn: '1h',
          issuer: 'dreamfactory-api',
        },
        priority: 1,
      },
      {
        type: 'api-key',
        name: 'API Key Authentication',
        description: 'API key based authentication',
        enabled: true,
        config: {
          headerName: 'X-API-Key',
          keyLength: 32,
          keyPrefix: 'df_',
        },
        priority: 2,
      },
    ],
    sessionConfig: {
      timeout: 30, // 30 minutes
      enableRenewal: true,
      storage: 'database',
      cookieSettings: {
        name: 'df_session',
        path: '/',
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
      },
      concurrentSessions: 3,
    },
    tokenConfig: {
      type: 'jwt',
      expiration: 60, // 1 hour
      enableRefresh: true,
      refreshExpiration: 7, // 7 days
      signingAlgorithm: 'HS256',
      secret: 'jwt-secret-key',
      issuer: 'dreamfactory-api',
      audience: 'dreamfactory-users',
    },
    mfaConfig: {
      enabled: false,
      methods: [],
      requirement: 'optional',
      bypassRoles: ['system-admin'],
      sessionDuration: 480, // 8 hours
    },
    passwordPolicy: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      historyCount: 5,
      expirationDays: 90,
      forbiddenPasswords: ['password', '123456', 'admin'],
    },
    lockoutPolicy: {
      enabled: true,
      failedAttempts: 5,
      lockoutDuration: 15, // 15 minutes
      resetOnSuccess: true,
      notifyOnLockout: true,
    },
  },
  authorizationConfig: {
    enabled: true,
    model: 'rbac',
    defaultPermissions: ['api:read'],
    inheritanceEnabled: true,
    cachingEnabled: true,
    cacheTtl: 15, // 15 minutes
  },
  apiKeyConfig: {
    enabled: true,
    generationSettings: {
      keyLength: 32,
      keyFormat: 'hex',
      keyPrefix: 'df_',
      characterSet: 'alphanumeric',
    },
    validationSettings: {
      checkExpiration: true,
      checkStatus: true,
      checkPermissions: true,
      checkRateLimit: true,
      checkIpRestrictions: false,
    },
    managementPolicies: {
      defaultExpiration: 365, // 1 year
      maxKeysPerUser: 10,
      autoRenewalEnabled: false,
      renewalNotificationDays: 30,
      inactiveCleanupDays: 90,
    },
    usageTracking: {
      enabled: true,
      trackRequestCount: true,
      trackDataTransfer: false,
      trackEndpoints: true,
      trackClientIps: false,
      retentionDays: 90,
    },
  },
  rbacConfig: {
    enabled: true,
    roles: [
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full system access',
        permissions: ['*'],
        active: true,
        metadata: {
          system: true,
          deletable: false,
        },
        createdAt: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z',
      },
      {
        id: 'user',
        name: 'Standard User',
        description: 'Basic user access',
        permissions: ['api:read', 'user:read', 'user:update-own'],
        active: true,
        metadata: {
          system: false,
          deletable: true,
        },
        createdAt: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-15T10:30:00Z',
      },
      {
        id: 'readonly',
        name: 'Read Only',
        description: 'Read-only access to APIs',
        permissions: ['api:read'],
        active: true,
        metadata: {
          system: false,
          deletable: true,
        },
        createdAt: '2024-01-10T00:00:00Z',
        lastModified: '2024-01-10T00:00:00Z',
      },
    ],
    permissions: [
      {
        id: 'api:read',
        name: 'API Read Access',
        description: 'Read access to API endpoints',
        resource: 'api',
        action: 'read',
        active: true,
      },
      {
        id: 'api:write',
        name: 'API Write Access',
        description: 'Write access to API endpoints',
        resource: 'api',
        action: 'write',
        active: true,
      },
      {
        id: 'user:read',
        name: 'User Read Access',
        description: 'Read access to user data',
        resource: 'user',
        action: 'read',
        active: true,
      },
      {
        id: 'user:write',
        name: 'User Write Access',
        description: 'Write access to user data',
        resource: 'user',
        action: 'write',
        active: true,
      },
    ],
    hierarchy: [
      {
        parentRole: 'admin',
        childRole: 'user',
        inheritanceType: 'full',
      },
      {
        parentRole: 'user',
        childRole: 'readonly',
        inheritanceType: 'partial',
      },
    ],
    assignmentPolicies: [
      {
        name: 'auto-assign-user',
        description: 'Automatically assign user role to new accounts',
        conditions: [
          {
            type: 'user-attribute',
            field: 'account_type',
            operator: 'equals',
            value: 'standard',
          },
        ],
        targetRoles: ['user'],
        action: 'assign',
        active: true,
      },
    ],
  },
  endpointSecurity: new Map([
    ['/api/users', {
      endpoint: '/api/users',
      method: 'GET',
      authenticationRequired: true,
      requiredPermissions: ['user:read'],
      requiredRoles: ['user', 'admin'],
      ipRestrictions: [],
      rateLimits: [
        {
          requests: 100,
          window: 3600, // 1 hour
        },
      ],
      customRules: [],
      metadata: {
        description: 'User list endpoint security',
        lastModified: '2024-01-25T10:00:00Z',
      },
    }],
    ['/api/products', {
      endpoint: '/api/products',
      method: 'GET',
      authenticationRequired: true,
      requiredPermissions: ['api:read'],
      requiredRoles: ['readonly', 'user', 'admin'],
      ipRestrictions: [],
      rateLimits: [
        {
          requests: 200,
          window: 3600, // 1 hour
        },
      ],
      customRules: [],
      metadata: {
        description: 'Product list endpoint security',
        lastModified: '2024-01-25T10:00:00Z',
      },
    }],
  ]),
  securityMiddleware: [
    {
      name: 'jwt-auth',
      type: 'authentication',
      config: {
        secretKey: 'jwt-secret-key',
        algorithm: 'HS256',
        headerName: 'Authorization',
        tokenPrefix: 'Bearer',
      },
      order: 1,
      enabled: true,
    },
    {
      name: 'rbac-check',
      type: 'authorization',
      config: {
        permissionCache: true,
        cacheTtl: 900, // 15 minutes
      },
      order: 2,
      enabled: true,
    },
  ],
  encryptionConfig: {
    enabled: false,
    algorithm: 'AES-256-GCM',
    keyManagement: {
      storage: 'local',
      rotationEnabled: false,
      rotationInterval: 90,
      backupEnabled: false,
      recoveryEnabled: false,
    },
    dataEncryption: {
      encryptAtRest: false,
      encryptInTransit: true,
      encryptedFields: [],
      fieldKeyMapping: {},
    },
    transportEncryption: {
      forceHttps: false,
      tlsVersion: '1.2',
      cipherSuites: [],
      certificateValidation: true,
    },
  },
  auditConfig: {
    enabled: true,
    events: [
      {
        type: 'authentication',
        name: 'login',
        description: 'User login events',
        enabled: true,
        severity: 'medium',
        metadata: {
          trackIpAddress: true,
          trackUserAgent: true,
        },
      },
      {
        type: 'authorization',
        name: 'permission-denied',
        description: 'Permission denied events',
        enabled: true,
        severity: 'high',
        metadata: {
          trackRequestDetails: true,
        },
      },
      {
        type: 'data-access',
        name: 'sensitive-data-access',
        description: 'Access to sensitive data',
        enabled: true,
        severity: 'medium',
        metadata: {
          trackDataAccessed: false,
        },
      },
    ],
    logFormat: 'json',
    storage: 'database',
    retention: {
      retentionDays: 365,
      archiveAfterDays: 90,
      compressionEnabled: true,
    },
    alerting: {
      enabled: false,
      conditions: [],
      channels: [],
      rateLimiting: {
        enabled: false,
        maxAlertsPerHour: 10,
        cooldownMinutes: 15,
        groupSimilar: true,
      },
    },
  },
  validationResults: [],
  loading: false,
  error: null,
};

// =============================================================================
// OPENAPI SPECIFICATION MOCK DATA
// =============================================================================

/**
 * Mock OpenAPI specification for e-commerce API
 */
export const mockOpenApiSpecification: OpenApiSpecification = {
  openapi: '3.0.3',
  info: {
    title: 'E-commerce API',
    description: 'Auto-generated REST API for e-commerce database',
    version: '1.0.0',
    contact: {
      name: 'API Support',
      email: 'api-support@example.com',
      url: 'https://example.com/support',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'https://api.example.com/v1',
      description: 'Production server',
    },
    {
      url: 'https://staging-api.example.com/v1',
      description: 'Staging server',
    },
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Development server',
    },
  ],
  paths: {
    '/users': {
      get: {
        operationId: 'getUsers',
        summary: 'Get users',
        description: 'Retrieve a list of users with optional filtering and pagination',
        tags: ['Users'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items to return',
            required: false,
            schema: {
              type: 'number',
              default: 25,
              minimum: 1,
              maximum: 1000,
            },
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of items to skip',
            required: false,
            schema: {
              type: 'number',
              default: 0,
              minimum: 0,
            },
          },
          {
            name: 'filter',
            in: 'query',
            description: 'Filter expression',
            required: false,
            schema: {
              type: 'string',
            },
            example: 'is_active=true',
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/User',
                      },
                    },
                    meta: {
                      $ref: '#/components/schemas/PaginationMeta',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
          {
            apiKey: [],
          },
        ],
      },
      post: {
        operationId: 'createUser',
        summary: 'Create user',
        description: 'Create a new user account',
        tags: ['Users'],
        requestBody: {
          description: 'User data',
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserCreate',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      $ref: '#/components/schemas/User',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ValidationError',
                },
              },
            },
          },
          '409': {
            description: 'User already exists',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    },
    '/users/{id}': {
      get: {
        operationId: 'getUserById',
        summary: 'Get user by ID',
        description: 'Retrieve a specific user by their ID',
        tags: ['Users'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'User ID',
            required: true,
            schema: {
              type: 'number',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      $ref: '#/components/schemas/User',
                    },
                  },
                },
              },
            },
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
      put: {
        operationId: 'updateUser',
        summary: 'Update user',
        description: 'Update an existing user',
        tags: ['Users'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'User ID',
            required: true,
            schema: {
              type: 'number',
            },
          },
        ],
        requestBody: {
          description: 'Updated user data',
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserUpdate',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      $ref: '#/components/schemas/User',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ValidationError',
                },
              },
            },
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    },
    '/products': {
      get: {
        operationId: 'getProducts',
        summary: 'Get products',
        description: 'Retrieve a list of products with optional filtering and pagination',
        tags: ['Products'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items to return',
            required: false,
            schema: {
              type: 'number',
              default: 50,
              minimum: 1,
              maximum: 500,
            },
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of items to skip',
            required: false,
            schema: {
              type: 'number',
              default: 0,
              minimum: 0,
            },
          },
          {
            name: 'category_id',
            in: 'query',
            description: 'Filter by category ID',
            required: false,
            schema: {
              type: 'number',
            },
          },
          {
            name: 'price_min',
            in: 'query',
            description: 'Minimum price filter',
            required: false,
            schema: {
              type: 'number',
              format: 'decimal',
            },
          },
          {
            name: 'price_max',
            in: 'query',
            description: 'Maximum price filter',
            required: false,
            schema: {
              type: 'number',
              format: 'decimal',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Product',
                      },
                    },
                    meta: {
                      $ref: '#/components/schemas/PaginationMeta',
                    },
                  },
                },
              },
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: 'Unique user identifier',
            example: 1,
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com',
          },
          first_name: {
            type: 'string',
            description: 'User first name',
            example: 'John',
          },
          last_name: {
            type: 'string',
            description: 'User last name',
            example: 'Doe',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
            example: '2024-01-25T10:30:00Z',
          },
          is_active: {
            type: 'boolean',
            description: 'Account active status',
            example: true,
          },
        },
        required: ['id', 'email', 'first_name', 'last_name', 'created_at', 'is_active'],
      },
      UserCreate: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'newuser@example.com',
          },
          first_name: {
            type: 'string',
            description: 'User first name',
            example: 'Jane',
          },
          last_name: {
            type: 'string',
            description: 'User last name',
            example: 'Smith',
          },
          password: {
            type: 'string',
            description: 'User password',
            example: 'securePassword123',
          },
          is_active: {
            type: 'boolean',
            description: 'Account active status',
            example: true,
            default: true,
          },
        },
        required: ['email', 'first_name', 'last_name', 'password'],
      },
      UserUpdate: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
          first_name: {
            type: 'string',
            description: 'User first name',
          },
          last_name: {
            type: 'string',
            description: 'User last name',
          },
          is_active: {
            type: 'boolean',
            description: 'Account active status',
          },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: 'Unique product identifier',
            example: 1,
          },
          sku: {
            type: 'string',
            description: 'Stock keeping unit',
            example: 'LAPTOP-001',
          },
          name: {
            type: 'string',
            description: 'Product name',
            example: 'Gaming Laptop',
          },
          description: {
            type: 'string',
            description: 'Product description',
            example: 'High-performance gaming laptop with RGB keyboard',
          },
          price: {
            type: 'number',
            format: 'decimal',
            description: 'Product price',
            example: 1299.99,
          },
          category_id: {
            type: 'number',
            description: 'Product category reference',
            example: 1,
          },
          stock_quantity: {
            type: 'number',
            description: 'Available stock quantity',
            example: 25,
          },
          is_active: {
            type: 'boolean',
            description: 'Product active status',
            example: true,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Product creation timestamp',
            example: '2024-01-20T14:30:00Z',
          },
        },
        required: ['id', 'sku', 'name', 'price', 'category_id', 'stock_quantity', 'is_active'],
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          total: {
            type: 'number',
            description: 'Total number of items',
            example: 150,
          },
          count: {
            type: 'number',
            description: 'Number of items in current page',
            example: 25,
          },
          limit: {
            type: 'number',
            description: 'Maximum items per page',
            example: 25,
          },
          offset: {
            type: 'number',
            description: 'Number of items skipped',
            example: 0,
          },
          has_more: {
            type: 'boolean',
            description: 'Whether there are more items available',
            example: true,
          },
        },
        required: ['total', 'count', 'limit', 'offset', 'has_more'],
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
            example: 'Resource not found',
          },
          code: {
            type: 'number',
            description: 'Error code',
            example: 404,
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Error timestamp',
            example: '2024-01-25T10:30:00Z',
          },
        },
        required: ['error', 'code', 'timestamp'],
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Validation error message',
            example: 'Validation failed',
          },
          code: {
            type: 'number',
            description: 'Error code',
            example: 400,
          },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  description: 'Field name',
                  example: 'email',
                },
                message: {
                  type: 'string',
                  description: 'Field error message',
                  example: 'Invalid email format',
                },
              },
            },
          },
        },
        required: ['error', 'code', 'details'],
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token authentication',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key authentication',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Users',
      description: 'User management operations',
    },
    {
      name: 'Products',
      description: 'Product catalog operations',
    },
    {
      name: 'Authentication',
      description: 'Authentication and authorization',
    },
  ],
};

/**
 * Mock code samples for different programming languages
 */
export const mockCodeSamples: CodeSample[] = [
  {
    language: 'javascript',
    title: 'Get Users - JavaScript/Fetch',
    code: `// Get users with pagination
const response = await fetch('/api/v1/users?limit=25&offset=0', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Users:', data.data);
console.log('Total:', data.meta.total);`,
    description: 'Fetch users using JavaScript and the native fetch API',
    endpoint: '/api/users',
    method: 'GET',
    category: 'request',
    complexity: 'basic',
  },
  {
    language: 'python',
    title: 'Create User - Python/Requests',
    code: `import requests

# Create a new user
url = 'https://api.example.com/v1/users'
headers = {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
}
data = {
    'email': 'newuser@example.com',
    'first_name': 'Jane',
    'last_name': 'Smith',
    'password': 'securePassword123'
}

response = requests.post(url, json=data, headers=headers)

if response.status_code == 201:
    user = response.json()['data']
    print(f"User created: {user['id']}")
else:
    print(f"Error: {response.json()['error']}")`,
    description: 'Create a new user using Python requests library',
    endpoint: '/api/users',
    method: 'POST',
    category: 'request',
    complexity: 'intermediate',
  },
  {
    language: 'curl',
    title: 'Update Product - cURL',
    code: `# Update product stock quantity
curl -X PATCH "https://api.example.com/v1/products/1" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "stock_quantity": 50
  }'`,
    description: 'Update product information using cURL',
    endpoint: '/api/products/{id}',
    method: 'PATCH',
    category: 'request',
    complexity: 'basic',
  },
  {
    language: 'typescript',
    title: 'Complete User Management - TypeScript',
    code: `import axios, { AxiosResponse } from 'axios';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  is_active: boolean;
}

interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    count: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

class UserService {
  private baseURL = 'https://api.example.com/v1';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private get headers() {
    return {
      'Authorization': \`Bearer \${this.token}\`,
      'Content-Type': 'application/json'
    };
  }

  async getUsers(limit = 25, offset = 0): Promise<User[]> {
    const response: AxiosResponse<ApiResponse<User[]>> = await axios.get(
      \`\${this.baseURL}/users\`,
      {
        headers: this.headers,
        params: { limit, offset }
      }
    );
    return response.data.data;
  }

  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await axios.post(
      \`\${this.baseURL}/users\`,
      userData,
      { headers: this.headers }
    );
    return response.data.data;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await axios.put(
      \`\${this.baseURL}/users/\${id}\`,
      updates,
      { headers: this.headers }
    );
    return response.data.data;
  }
}

// Usage example
const userService = new UserService('your-jwt-token');

// Get users
const users = await userService.getUsers(10, 0);
console.log('Users:', users);

// Create user
const newUser = await userService.createUser({
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  is_active: true
});
console.log('Created user:', newUser);`,
    description: 'Complete TypeScript service class for user management with proper typing',
    endpoint: '/api/users',
    method: 'GET',
    category: 'complete-example',
    complexity: 'advanced',
  },
];

// =============================================================================
// GENERATION PREVIEW MOCK DATA
// =============================================================================

/**
 * Mock endpoint summaries for preview
 */
export const mockEndpointSummaries: EndpointSummary[] = [
  {
    path: '/api/users',
    method: 'GET',
    description: 'Retrieve paginated list of users',
    table: 'users',
    operationType: 'list',
    parameters: [
      {
        name: 'limit',
        location: 'query',
        type: 'number',
        required: false,
        description: 'Number of items to return (max 1000)',
        example: 25,
      },
      {
        name: 'offset',
        location: 'query',
        type: 'number',
        required: false,
        description: 'Number of items to skip',
        example: 0,
      },
      {
        name: 'filter',
        location: 'query',
        type: 'string',
        required: false,
        description: 'Filter expression',
        example: 'is_active=true',
      },
    ],
    responseSchema: {
      type: 'object',
      properties: [
        {
          name: 'data',
          type: 'array',
          required: true,
          description: 'Array of user objects',
        },
        {
          name: 'meta',
          type: 'object',
          required: true,
          description: 'Pagination metadata',
        },
      ],
      description: 'Paginated users response',
      example: {
        data: [{ id: 1, email: 'user@example.com' }],
        meta: { total: 100, count: 25 },
      },
    },
    security: ['bearerAuth'],
    tags: ['Users'],
    enabled: true,
    estimatedResponseTime: 150,
    complexityScore: 3,
  },
  {
    path: '/api/users',
    method: 'POST',
    description: 'Create a new user account',
    table: 'users',
    operationType: 'create',
    parameters: [
      {
        name: 'user',
        location: 'body',
        type: 'object',
        required: true,
        description: 'User creation data',
        example: {
          email: 'newuser@example.com',
          first_name: 'Jane',
          last_name: 'Doe',
          password: 'securePassword123',
        },
      },
    ],
    responseSchema: {
      type: 'object',
      properties: [
        {
          name: 'data',
          type: 'object',
          required: true,
          description: 'Created user object',
        },
      ],
      description: 'User creation response',
      example: {
        data: { id: 101, email: 'newuser@example.com' },
      },
    },
    security: ['bearerAuth'],
    tags: ['Users'],
    enabled: true,
    estimatedResponseTime: 250,
    complexityScore: 5,
  },
  {
    path: '/api/users/{id}',
    method: 'GET',
    description: 'Retrieve a specific user by ID',
    table: 'users',
    operationType: 'read',
    parameters: [
      {
        name: 'id',
        location: 'path',
        type: 'number',
        required: true,
        description: 'User ID',
        example: 1,
      },
    ],
    responseSchema: {
      type: 'object',
      properties: [
        {
          name: 'data',
          type: 'object',
          required: true,
          description: 'User object',
        },
      ],
      description: 'Single user response',
      example: {
        data: { id: 1, email: 'user@example.com' },
      },
    },
    security: ['bearerAuth'],
    tags: ['Users'],
    enabled: true,
    estimatedResponseTime: 100,
    complexityScore: 2,
  },
  {
    path: '/api/products',
    method: 'GET',
    description: 'Retrieve paginated list of products with filtering',
    table: 'products',
    operationType: 'list',
    parameters: [
      {
        name: 'limit',
        location: 'query',
        type: 'number',
        required: false,
        description: 'Number of items to return (max 500)',
        example: 50,
      },
      {
        name: 'category_id',
        location: 'query',
        type: 'number',
        required: false,
        description: 'Filter by category ID',
        example: 1,
      },
      {
        name: 'price_min',
        location: 'query',
        type: 'number',
        required: false,
        description: 'Minimum price filter',
        example: 10.00,
      },
    ],
    responseSchema: {
      type: 'object',
      properties: [
        {
          name: 'data',
          type: 'array',
          required: true,
          description: 'Array of product objects',
        },
        {
          name: 'meta',
          type: 'object',
          required: true,
          description: 'Pagination metadata',
        },
      ],
      description: 'Paginated products response',
      example: {
        data: [{ id: 1, name: 'Gaming Laptop', price: 1299.99 }],
        meta: { total: 500, count: 50 },
      },
    },
    security: ['bearerAuth'],
    tags: ['Products'],
    enabled: true,
    estimatedResponseTime: 200,
    complexityScore: 4,
  },
];

/**
 * Mock security summary for preview
 */
export const mockSecuritySummary: SecuritySummary = {
  authenticationMethods: ['JWT Bearer Token', 'API Key'],
  authorizationModel: 'Role-Based Access Control (RBAC)',
  securedEndpoints: 8,
  publicEndpoints: 1,
  securityScore: 85,
  recommendations: [
    {
      id: 'enable-https',
      title: 'Enable HTTPS Only',
      description: 'Configure the API to only accept HTTPS connections for enhanced security',
      priority: 'high',
      category: 'encryption',
      effort: 'low',
    },
    {
      id: 'implement-rate-limiting',
      title: 'Implement Rate Limiting',
      description: 'Add rate limiting to prevent abuse and ensure API availability',
      priority: 'medium',
      category: 'general',
      effort: 'medium',
    },
    {
      id: 'enable-audit-logging',
      title: 'Enable Comprehensive Audit Logging',
      description: 'Log all authentication and authorization events for security monitoring',
      priority: 'medium',
      category: 'audit',
      effort: 'low',
    },
  ],
  compliance: [
    {
      standard: 'OWASP API Security Top 10',
      status: 'partial',
      score: 80,
      requiredActions: [
        'Implement proper authentication on all endpoints',
        'Add input validation and sanitization',
        'Enable comprehensive logging and monitoring',
      ],
    },
    {
      standard: 'REST API Best Practices',
      status: 'compliant',
      score: 95,
      requiredActions: [],
    },
  ],
};

/**
 * Mock performance estimations
 */
export const mockPerformanceEstimations: PerformanceEstimation[] = [
  {
    target: '/api/users (GET)',
    responseTime: 150,
    throughput: 500,
    memoryUsage: 45,
    cpuUsage: 15,
    databaseQueries: 1,
    cacheHitRatio: 0.75,
    recommendations: [
      {
        type: 'caching',
        description: 'Enable response caching for 5 minutes to reduce database load',
        expectedImprovement: '40% faster response time',
        complexity: 'low',
      },
      {
        type: 'indexing',
        description: 'Add composite index on commonly filtered fields',
        expectedImprovement: '25% faster query execution',
        complexity: 'medium',
      },
    ],
  },
  {
    target: '/api/products (GET)',
    responseTime: 200,
    throughput: 400,
    memoryUsage: 60,
    cpuUsage: 20,
    databaseQueries: 2,
    cacheHitRatio: 0.60,
    recommendations: [
      {
        type: 'pagination',
        description: 'Implement cursor-based pagination for large datasets',
        expectedImprovement: '50% better performance for large result sets',
        complexity: 'medium',
      },
      {
        type: 'optimization',
        description: 'Optimize query to reduce JOIN operations',
        expectedImprovement: '30% faster query execution',
        complexity: 'high',
      },
    ],
  },
];

/**
 * Mock generation statistics
 */
export const mockGenerationStatistics: GenerationStatistics = {
  totalEndpoints: 12,
  endpointsByMethod: {
    GET: 6,
    POST: 3,
    PUT: 2,
    PATCH: 1,
    DELETE: 0,
    HEAD: 0,
    OPTIONS: 0,
  },
  endpointsByTable: {
    users: 4,
    products: 4,
    categories: 2,
    orders: 2,
  },
  totalSchemas: 8,
  totalSecurityRules: 15,
  generationTime: 4250,
  estimatedApiSize: '2.8 MB',
  complexityMetrics: {
    overallScore: 65,
    schemaComplexity: 70,
    endpointComplexity: 60,
    securityComplexity: 75,
    maintainabilityScore: 80,
  },
};

/**
 * Mock generation preview data with all scenarios
 */
export const mockGenerationPreviewData: Record<string, GenerationPreviewData> = {
  complete: {
    endpointSummaries: mockEndpointSummaries,
    openApiSpec: mockOpenApiSpecification,
    codeSamples: mockCodeSamples,
    documentationPreview: {
      content: '<h1>E-commerce API Documentation</h1><p>This API provides comprehensive access to e-commerce data...</p>',
      format: 'html',
      sections: [
        {
          id: 'introduction',
          title: 'Introduction',
          content: 'Welcome to the E-commerce API documentation...',
          order: 1,
          level: 1,
          type: 'overview',
        },
        {
          id: 'authentication',
          title: 'Authentication',
          content: 'This API uses JWT Bearer tokens for authentication...',
          order: 2,
          level: 1,
          type: 'authentication',
        },
        {
          id: 'users-endpoints',
          title: 'User Endpoints',
          content: 'User management operations...',
          order: 3,
          level: 1,
          type: 'endpoints',
        },
      ],
      tableOfContents: [
        {
          id: 'introduction',
          title: 'Introduction',
          level: 1,
          anchor: '#introduction',
        },
        {
          id: 'authentication',
          title: 'Authentication',
          level: 1,
          anchor: '#authentication',
        },
        {
          id: 'endpoints',
          title: 'API Endpoints',
          level: 1,
          anchor: '#endpoints',
          children: [
            {
              id: 'users',
              title: 'Users',
              level: 2,
              anchor: '#users',
            },
            {
              id: 'products',
              title: 'Products',
              level: 2,
              anchor: '#products',
            },
          ],
        },
      ],
      metadata: {
        generatedAt: '2024-01-25T15:30:00Z',
        version: '1.0.0',
        totalPages: 45,
        totalEndpoints: 12,
        totalSchemas: 8,
        size: '2.8 MB',
      },
    },
    securitySummary: mockSecuritySummary,
    performanceEstimations: mockPerformanceEstimations,
    validationResults: [
      {
        target: 'OpenAPI Specification',
        type: 'syntax',
        success: true,
        issues: [],
        timestamp: '2024-01-25T15:30:00Z',
      },
      {
        target: 'Security Configuration',
        type: 'security',
        success: true,
        issues: [
          {
            code: 'SECURITY_001',
            message: 'Consider enabling HTTPS-only mode for production',
            severity: 'warning',
            location: 'global.httpsOnly',
            suggestedFix: 'Set httpsOnly: true in global settings',
          },
        ],
        timestamp: '2024-01-25T15:30:00Z',
      },
    ],
    statistics: mockGenerationStatistics,
    loading: false,
    error: null,
    lastGenerated: '2024-01-25T15:30:00Z',
    previewConfig: {
      includeCodeSamples: true,
      includeDocumentation: true,
      includeSecurityAnalysis: true,
      includePerformanceAnalysis: true,
      codeSampleLanguages: ['javascript', 'python', 'curl', 'typescript'],
      documentationFormat: 'html',
      detailLevel: 'comprehensive',
    },
  },
  loading: {
    endpointSummaries: [],
    openApiSpec: {
      openapi: '3.0.3',
      info: {
        title: 'Loading...',
        description: 'Generating API documentation...',
        version: '1.0.0',
      },
      servers: [],
      paths: {},
      components: {},
      security: [],
      tags: [],
    },
    codeSamples: [],
    documentationPreview: {
      content: '',
      format: 'html',
      sections: [],
      tableOfContents: [],
      metadata: {
        generatedAt: '',
        version: '',
        totalPages: 0,
        totalEndpoints: 0,
        totalSchemas: 0,
        size: '0 KB',
      },
    },
    securitySummary: {
      authenticationMethods: [],
      authorizationModel: '',
      securedEndpoints: 0,
      publicEndpoints: 0,
      securityScore: 0,
      recommendations: [],
      compliance: [],
    },
    performanceEstimations: [],
    validationResults: [],
    statistics: {
      totalEndpoints: 0,
      endpointsByMethod: {
        GET: 0,
        POST: 0,
        PUT: 0,
        PATCH: 0,
        DELETE: 0,
        HEAD: 0,
        OPTIONS: 0,
      },
      endpointsByTable: {},
      totalSchemas: 0,
      totalSecurityRules: 0,
      generationTime: 0,
      estimatedApiSize: '0 KB',
      complexityMetrics: {
        overallScore: 0,
        schemaComplexity: 0,
        endpointComplexity: 0,
        securityComplexity: 0,
        maintainabilityScore: 0,
      },
    },
    loading: true,
    error: null,
    lastGenerated: '',
    previewConfig: {
      includeCodeSamples: true,
      includeDocumentation: true,
      includeSecurityAnalysis: true,
      includePerformanceAnalysis: true,
      codeSampleLanguages: ['javascript', 'python', 'curl'],
      documentationFormat: 'html',
      detailLevel: 'detailed',
    },
  },
  error: {
    endpointSummaries: [],
    openApiSpec: {
      openapi: '3.0.3',
      info: {
        title: 'Error',
        description: 'Failed to generate API preview',
        version: '1.0.0',
      },
      servers: [],
      paths: {},
      components: {},
      security: [],
      tags: [],
    },
    codeSamples: [],
    documentationPreview: {
      content: '',
      format: 'html',
      sections: [],
      tableOfContents: [],
      metadata: {
        generatedAt: '',
        version: '',
        totalPages: 0,
        totalEndpoints: 0,
        totalSchemas: 0,
        size: '0 KB',
      },
    },
    securitySummary: {
      authenticationMethods: [],
      authorizationModel: '',
      securedEndpoints: 0,
      publicEndpoints: 0,
      securityScore: 0,
      recommendations: [],
      compliance: [],
    },
    performanceEstimations: [],
    validationResults: [
      {
        target: 'API Generation',
        type: 'syntax',
        success: false,
        issues: [
          {
            code: 'GEN_001',
            message: 'Failed to connect to database service',
            severity: 'error',
            location: 'service.connection',
            suggestedFix: 'Check database service configuration and connectivity',
          },
        ],
        timestamp: '2024-01-25T15:30:00Z',
      },
    ],
    statistics: {
      totalEndpoints: 0,
      endpointsByMethod: {
        GET: 0,
        POST: 0,
        PUT: 0,
        PATCH: 0,
        DELETE: 0,
        HEAD: 0,
        OPTIONS: 0,
      },
      endpointsByTable: {},
      totalSchemas: 0,
      totalSecurityRules: 0,
      generationTime: 0,
      estimatedApiSize: '0 KB',
      complexityMetrics: {
        overallScore: 0,
        schemaComplexity: 0,
        endpointComplexity: 0,
        securityComplexity: 0,
        maintainabilityScore: 0,
      },
    },
    loading: false,
    error: 'Failed to generate API preview. Please check your configuration and try again.',
    lastGenerated: '',
    previewConfig: {
      includeCodeSamples: true,
      includeDocumentation: true,
      includeSecurityAnalysis: true,
      includePerformanceAnalysis: true,
      codeSampleLanguages: ['javascript', 'python', 'curl'],
      documentationFormat: 'html',
      detailLevel: 'detailed',
    },
  },
};

// =============================================================================
// GENERATION RESULT MOCK DATA
// =============================================================================

/**
 * Mock generation result for successful API generation
 */
export const mockGenerationResult: GenerationResult = {
  success: true,
  message: 'API generation completed successfully',
  serviceInfo: {
    serviceId: 1,
    serviceName: 'ecommerce_mysql',
    serviceUrl: 'https://api.example.com/v1',
    version: '1.0.0',
    status: 'active',
    createdAt: '2024-01-25T15:45:00Z',
    configuration: {
      endpoints: 12,
      tables: 4,
      security: 'enabled',
      documentation: 'enabled',
    },
  },
  endpoints: [
    {
      id: 'users-get',
      url: '/api/v1/users',
      method: 'GET',
      description: 'Retrieve paginated list of users',
      table: 'users',
      status: 'active',
      security: ['bearerAuth'],
      parameters: [
        {
          name: 'limit',
          type: 'number',
          location: 'query',
          required: false,
          description: 'Number of items to return',
          defaultValue: 25,
        },
        {
          name: 'offset',
          type: 'number',
          location: 'query',
          required: false,
          description: 'Number of items to skip',
          defaultValue: 0,
        },
      ],
      responseSchema: {
        id: 'UserListResponse',
        name: 'User List Response',
        type: 'object',
        properties: [
          {
            name: 'data',
            type: 'array',
            required: true,
            description: 'Array of user objects',
          },
          {
            name: 'meta',
            type: 'object',
            required: true,
            description: 'Pagination metadata',
          },
        ],
        required: ['data', 'meta'],
        description: 'Response containing paginated user data',
      },
    },
    {
      id: 'users-post',
      url: '/api/v1/users',
      method: 'POST',
      description: 'Create a new user account',
      table: 'users',
      status: 'active',
      security: ['bearerAuth'],
      parameters: [
        {
          name: 'user',
          type: 'object',
          location: 'body',
          required: true,
          description: 'User creation data',
        },
      ],
      responseSchema: {
        id: 'UserCreateResponse',
        name: 'User Create Response',
        type: 'object',
        properties: [
          {
            name: 'data',
            type: 'object',
            required: true,
            description: 'Created user object',
          },
        ],
        required: ['data'],
        description: 'Response containing created user data',
      },
      requestSchema: {
        id: 'UserCreateRequest',
        name: 'User Create Request',
        type: 'object',
        properties: [
          {
            name: 'email',
            type: 'string',
            required: true,
            description: 'User email address',
          },
          {
            name: 'first_name',
            type: 'string',
            required: true,
            description: 'User first name',
          },
          {
            name: 'last_name',
            type: 'string',
            required: true,
            description: 'User last name',
          },
          {
            name: 'password',
            type: 'string',
            required: true,
            description: 'User password',
          },
        ],
        required: ['email', 'first_name', 'last_name', 'password'],
        description: 'Request body for creating a new user',
      },
    },
  ],
  schemas: [
    {
      id: 'User',
      name: 'User',
      type: 'object',
      properties: [
        {
          name: 'id',
          type: 'number',
          required: true,
          description: 'Unique user identifier',
          example: 1,
        },
        {
          name: 'email',
          type: 'string',
          format: 'email',
          required: true,
          description: 'User email address',
          example: 'user@example.com',
        },
        {
          name: 'first_name',
          type: 'string',
          required: true,
          description: 'User first name',
          example: 'John',
        },
        {
          name: 'last_name',
          type: 'string',
          required: true,
          description: 'User last name',
          example: 'Doe',
        },
        {
          name: 'created_at',
          type: 'string',
          format: 'date-time',
          required: true,
          description: 'Account creation timestamp',
          example: '2024-01-25T10:30:00Z',
        },
        {
          name: 'is_active',
          type: 'boolean',
          required: true,
          description: 'Account active status',
          example: true,
        },
      ],
      required: ['id', 'email', 'first_name', 'last_name', 'created_at', 'is_active'],
      description: 'User account information',
    },
    {
      id: 'Product',
      name: 'Product',
      type: 'object',
      properties: [
        {
          name: 'id',
          type: 'number',
          required: true,
          description: 'Unique product identifier',
          example: 1,
        },
        {
          name: 'sku',
          type: 'string',
          required: true,
          description: 'Stock keeping unit',
          example: 'LAPTOP-001',
        },
        {
          name: 'name',
          type: 'string',
          required: true,
          description: 'Product name',
          example: 'Gaming Laptop',
        },
        {
          name: 'price',
          type: 'number',
          format: 'decimal',
          required: true,
          description: 'Product price',
          example: 1299.99,
        },
      ],
      required: ['id', 'sku', 'name', 'price'],
      description: 'Product information',
    },
  ],
  securityConfigurations: [
    {
      type: 'authentication',
      name: 'JWT Bearer Authentication',
      description: 'JSON Web Token based authentication for API access',
      endpoints: ['/api/v1/users', '/api/v1/products'],
      status: 'applied',
      details: {
        tokenType: 'JWT',
        algorithm: 'HS256',
        expiresIn: '1h',
        headerName: 'Authorization',
        tokenPrefix: 'Bearer',
      },
    },
    {
      type: 'authorization',
      name: 'Role-Based Access Control',
      description: 'Permission-based access control for endpoints',
      endpoints: ['/api/v1/users', '/api/v1/products'],
      status: 'applied',
      details: {
        model: 'RBAC',
        roles: ['admin', 'user', 'readonly'],
        permissions: ['api:read', 'api:write', 'user:read', 'user:write'],
      },
    },
  ],
  errors: [],
  warnings: [
    {
      code: 'SECURITY_001',
      message: 'HTTPS-only mode is not enabled',
      context: 'Security configuration',
      timestamp: '2024-01-25T15:45:00Z',
      action: 'Consider enabling HTTPS-only mode for production deployment',
    },
    {
      code: 'PERF_001',
      message: 'No caching configuration detected',
      context: 'Performance optimization',
      timestamp: '2024-01-25T15:45:00Z',
      action: 'Enable caching for frequently accessed endpoints',
    },
  ],
  statistics: mockGenerationStatistics,
  metadata: {
    sessionId: 'wizard-session-12345',
    timestamp: '2024-01-25T15:45:00Z',
    duration: 4250,
    user: {
      id: 'user-123',
      name: 'John Developer',
      email: 'john@example.com',
    },
    environment: 'development',
    version: {
      wizard: '1.0.0',
      api: '2.5.0',
      system: '5.2.1',
    },
  },
  nextSteps: [
    {
      id: 'test-endpoints',
      title: 'Test Your API Endpoints',
      description: 'Use the interactive API documentation to test your newly generated endpoints',
      category: 'testing',
      priority: 'high',
      effort: 'low',
      actionUrl: '/api-docs',
      actionText: 'Open API Documentation',
    },
    {
      id: 'configure-security',
      title: 'Review Security Settings',
      description: 'Review and enhance your API security configuration for production use',
      category: 'security',
      priority: 'high',
      effort: 'medium',
      actionUrl: '/api-security',
      actionText: 'Configure Security',
    },
    {
      id: 'enable-monitoring',
      title: 'Enable API Monitoring',
      description: 'Set up monitoring and alerting for your API endpoints',
      category: 'deployment',
      priority: 'medium',
      effort: 'medium',
      actionUrl: '/monitoring',
      actionText: 'Setup Monitoring',
    },
  ],
};

// =============================================================================
// FORM DATA MOCK DATA
// =============================================================================

/**
 * Mock form data for all wizard steps
 */
export const mockFormData: Record<string, any> = {
  serviceSelection: {
    selectedService: {
      id: 1,
      name: 'ecommerce_mysql',
      type: 'mysql',
      is_active: true,
    },
    createNewService: false,
  } as ServiceSelectionFormData,
  
  tableSelection: {
    selectedTables: [
      {
        name: 'users',
        schema: 'ecommerce_db',
        enabled: true,
        priority: 1,
        selectedFields: [
          {
            name: 'id',
            type: 'int',
            included: true,
            readable: true,
            writable: false,
            required: true,
            isPrimaryKey: true,
            isForeignKey: false,
          },
          {
            name: 'email',
            type: 'varchar',
            included: true,
            readable: true,
            writable: true,
            required: true,
            isPrimaryKey: false,
            isForeignKey: false,
          },
        ],
        apiConfig: {
          methods: {
            get: true,
            post: true,
            put: true,
            patch: true,
            delete: false,
          },
        },
      },
    ],
    filter: {
      primaryKeyOnly: false,
      foreignKeyOnly: false,
      hideSystemTables: true,
      hideEmptyTables: false,
    },
  } as TableSelectionFormData,
  
  endpointConfiguration: {
    globalSettings: {
      basePath: '/api/v1',
      version: '1.0.0',
      defaultResponseFormat: 'json',
      enableDocumentation: true,
      enableLogging: true,
      enableCompression: true,
      defaultPageSize: 25,
      maxPageSize: 1000,
      requestTimeout: 30,
      httpsOnly: false,
    },
    customEndpoints: [],
    rateLimiting: {
      enabled: true,
      defaultLimits: {
        requests: 100,
        window: 3600,
      },
    },
    corsConfig: {
      enabled: true,
      allowedOrigins: ['*'],
      allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowCredentials: false,
      maxAge: 86400,
    },
  } as EndpointConfigurationFormData,
  
  securityConfiguration: {
    authenticationConfig: {
      enabled: true,
      methods: [
        {
          type: 'jwt',
          name: 'JWT Authentication',
          enabled: true,
          priority: 1,
        },
      ],
      sessionConfig: {
        timeout: 30,
        enableRenewal: true,
        storage: 'database',
        concurrentSessions: 3,
      },
    },
    authorizationConfig: {
      enabled: true,
      model: 'rbac',
      defaultPermissions: ['api:read'],
      inheritanceEnabled: true,
      cachingEnabled: true,
      cacheTtl: 15,
    },
    apiKeyConfig: {
      enabled: true,
      generationSettings: {
        keyLength: 32,
        keyFormat: 'hex',
        keyPrefix: 'df_',
      },
      managementPolicies: {
        defaultExpiration: 365,
        maxKeysPerUser: 10,
        autoRenewalEnabled: false,
      },
    },
    encryptionConfig: {
      enabled: false,
      algorithm: 'AES-256-GCM',
      keyManagement: {
        storage: 'local',
        rotationEnabled: false,
        rotationInterval: 90,
      },
    },
    auditConfig: {
      enabled: true,
      logFormat: 'json',
      storage: 'database',
      retention: {
        retentionDays: 365,
        archiveAfterDays: 90,
        compressionEnabled: true,
      },
    },
  } as SecurityConfigurationFormData,
  
  generationPreview: {
    previewConfig: {
      includeCodeSamples: true,
      includeDocumentation: true,
      includeSecurityAnalysis: true,
      includePerformanceAnalysis: true,
      codeSampleLanguages: ['javascript', 'python', 'curl'],
      documentationFormat: 'html',
      detailLevel: 'detailed',
    },
    endpointSummaries: mockEndpointSummaries,
    openApiSpec: {
      openapi: '3.0.3',
      info: {
        title: 'E-commerce API',
        description: 'Auto-generated REST API for e-commerce database',
        version: '1.0.0',
      },
    },
  } as GenerationPreviewFormData,
};

// =============================================================================
// COMPLETE WIZARD STATES
// =============================================================================

/**
 * Mock complete wizard states for different scenarios
 */
export const mockWizardStates: Record<string, WizardState> = {
  initial: {
    currentStep: 'service-selection',
    steps: [
      {
        step: 'service-selection',
        title: 'Select Database Service',
        description: 'Choose the database service to generate APIs for',
        order: 1,
        completed: false,
        active: true,
        accessible: true,
        valid: false,
      },
      {
        step: 'table-selection',
        title: 'Select Tables',
        description: 'Choose database tables and configure fields',
        order: 2,
        completed: false,
        active: false,
        accessible: false,
        valid: false,
      },
      {
        step: 'endpoint-configuration',
        title: 'Configure Endpoints',
        description: 'Set up API endpoint parameters and behavior',
        order: 3,
        completed: false,
        active: false,
        accessible: false,
        valid: false,
      },
      {
        step: 'security-configuration',
        title: 'Configure Security',
        description: 'Set up authentication and authorization',
        order: 4,
        completed: false,
        active: false,
        accessible: false,
        valid: false,
      },
      {
        step: 'generation-preview',
        title: 'Preview & Generate',
        description: 'Review configuration and generate APIs',
        order: 5,
        completed: false,
        active: false,
        accessible: false,
        valid: false,
      },
      {
        step: 'generation-complete',
        title: 'Complete',
        description: 'API generation completed successfully',
        order: 6,
        completed: false,
        active: false,
        accessible: false,
        valid: false,
      },
    ],
    serviceSelection: mockServiceSelectionData.initial,
    tableSelection: mockTableSelectionData.initial,
    endpointConfiguration: mockEndpointConfigurationData,
    securityConfiguration: mockSecurityConfigurationData,
    generationPreview: mockGenerationPreviewData.complete,
    completed: false,
    loading: false,
    error: null,
    isValid: false,
    lastModified: Date.now(),
    sessionId: 'wizard-session-initial',
    isDraft: false,
    autoSave: true,
  },
  inProgress: {
    currentStep: 'endpoint-configuration',
    steps: mockWizardSteps,
    serviceSelection: mockServiceSelectionData.withSelection,
    tableSelection: mockTableSelectionData.withSelection,
    endpointConfiguration: mockEndpointConfigurationData,
    securityConfiguration: mockSecurityConfigurationData,
    generationPreview: mockGenerationPreviewData.complete,
    completed: false,
    loading: false,
    error: null,
    isValid: false,
    lastModified: Date.now(),
    sessionId: 'wizard-session-progress',
    isDraft: true,
    autoSave: true,
  },
  completed: {
    currentStep: 'generation-complete',
    steps: [
      {
        step: 'service-selection',
        title: 'Select Database Service',
        description: 'Choose the database service to generate APIs for',
        order: 1,
        completed: true,
        active: false,
        accessible: true,
        valid: true,
      },
      {
        step: 'table-selection',
        title: 'Select Tables',
        description: 'Choose database tables and configure fields',
        order: 2,
        completed: true,
        active: false,
        accessible: true,
        valid: true,
      },
      {
        step: 'endpoint-configuration',
        title: 'Configure Endpoints',
        description: 'Set up API endpoint parameters and behavior',
        order: 3,
        completed: true,
        active: false,
        accessible: true,
        valid: true,
      },
      {
        step: 'security-configuration',
        title: 'Configure Security',
        description: 'Set up authentication and authorization',
        order: 4,
        completed: true,
        active: false,
        accessible: true,
        valid: true,
      },
      {
        step: 'generation-preview',
        title: 'Preview & Generate',
        description: 'Review configuration and generate APIs',
        order: 5,
        completed: true,
        active: false,
        accessible: true,
        valid: true,
      },
      {
        step: 'generation-complete',
        title: 'Complete',
        description: 'API generation completed successfully',
        order: 6,
        completed: true,
        active: true,
        accessible: true,
        valid: true,
      },
    ],
    serviceSelection: mockServiceSelectionData.withSelection,
    tableSelection: mockTableSelectionData.withSelection,
    endpointConfiguration: mockEndpointConfigurationData,
    securityConfiguration: mockSecurityConfigurationData,
    generationPreview: mockGenerationPreviewData.complete,
    completed: true,
    loading: false,
    error: null,
    isValid: true,
    lastModified: Date.now(),
    sessionId: 'wizard-session-complete',
    isDraft: false,
    autoSave: false,
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Export all mock data for testing
 */
export {
  // Database services and schemas
  mockDatabaseServices,
  mockConnectionTestResults,
  mockSchemaTables,
  mockComplexSchemaFields,
  
  // Wizard state data
  mockWizardSteps,
  mockServiceSelectionData,
  mockSelectedTables,
  mockTableSelectionData,
  mockEndpointConfigurationData,
  mockSecurityConfigurationData,
  
  // OpenAPI and preview data
  mockOpenApiSpecification,
  mockCodeSamples,
  mockEndpointSummaries,
  mockSecuritySummary,
  mockPerformanceEstimations,
  mockGenerationStatistics,
  mockGenerationPreviewData,
  
  // Generation results
  mockGenerationResult,
  
  // Form data
  mockFormData,
  
  // Complete wizard states
  mockWizardStates,
};

/**
 * Utility functions for creating mock data variants
 */
export const mockDataUtils = {
  /**
   * Create a mock database service with custom properties
   */
  createMockService: (overrides: Partial<DatabaseService> = {}): DatabaseService => ({
    ...mockDatabaseServices[0],
    ...overrides,
  }),
  
  /**
   * Create a mock selected table with custom properties
   */
  createMockSelectedTable: (overrides: Partial<SelectedTable> = {}): SelectedTable => ({
    ...mockSelectedTables[0],
    ...overrides,
  }),
  
  /**
   * Create a mock wizard state with custom step
   */
  createMockWizardState: (currentStep: string, overrides: Partial<WizardState> = {}): WizardState => ({
    ...mockWizardStates.initial,
    currentStep: currentStep as any,
    ...overrides,
  }),
  
  /**
   * Create a mock connection test result
   */
  createMockConnectionTest: (success: boolean, overrides: Partial<ConnectionTestResult> = {}): ConnectionTestResult => ({
    ...(success ? mockConnectionTestResults.success : mockConnectionTestResults.failure),
    ...overrides,
  }),
  
  /**
   * Create a mock OpenAPI spec with custom endpoints
   */
  createMockOpenApiSpec: (paths: Record<string, any> = {}): OpenApiSpecification => ({
    ...mockOpenApiSpecification,
    paths: {
      ...mockOpenApiSpecification.paths,
      ...paths,
    },
  }),
};

/**
 * Mock data constants for testing
 */
export const MOCK_DATA_CONSTANTS = {
  DEFAULT_SERVICE_ID: 1,
  DEFAULT_SESSION_ID: 'wizard-session-test',
  DEFAULT_USER_EMAIL: 'test@example.com',
  DEFAULT_API_VERSION: '1.0.0',
  DEFAULT_PAGE_SIZE: 25,
  DEFAULT_TIMEOUT: 30,
} as const;