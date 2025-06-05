/**
 * Factory functions for creating reusable test components and mock data structures 
 * that mirror the patterns from Angular TestBed. Provides standardized creation 
 * functions for database services, schema metadata, user profiles, and form 
 * validation scenarios to ensure consistent testing across all React components.
 */

// Mock data types - these will be properly typed once the actual type files are available
type DatabaseService = any;
type SchemaTable = any;
type SchemaField = any;
type UserProfile = any;
type AdminProfile = any;
type Role = any;
type ApiEndpoint = any;
type OpenApiSpec = any;
type SystemConfig = any;
type FormValidationState = any;

/**
 * Database Service Factory Functions
 * Replaces Angular service mocks for connection testing workflows
 */
export const createDatabaseService = (overrides: Partial<DatabaseService> = {}): DatabaseService => {
  const baseService = {
    id: 1,
    name: 'test-mysql-db',
    label: 'Test MySQL Database',
    description: 'Test database service for unit testing',
    is_active: true,
    type: 'mysql',
    mutable: true,
    deletable: true,
    created_date: '2024-01-01T00:00:00.000Z',
    last_modified_date: '2024-01-01T00:00:00.000Z',
    created_by_id: 1,
    last_modified_by_id: 1,
    config: {
      host: 'localhost',
      port: 3306,
      database: 'test_db',
      username: 'test_user',
      password: 'test_password',
      driver: 'mysql',
      options: {
        connect_timeout: 60,
        read_timeout: 60,
        write_timeout: 60,
      },
      attributes: [],
      statements: [],
      ssl_cert: null,
      ssl_key: null,
      ssl_ca: null,
      ssl_cipher: null,
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
      timezone: 'UTC',
      strict: true,
    },
  };

  return { ...baseService, ...overrides };
};

export const createPostgreSQLService = (overrides: Partial<DatabaseService> = {}): DatabaseService => {
  return createDatabaseService({
    name: 'test-postgresql-db',
    label: 'Test PostgreSQL Database',
    type: 'pgsql',
    config: {
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      username: 'test_user',
      password: 'test_password',
      driver: 'pgsql',
      options: {
        charset: 'utf8',
        prefix: '',
        prefix_indexes: true,
        schema: 'public',
        sslmode: 'prefer',
      },
      attributes: [],
      statements: [],
    },
    ...overrides,
  });
};

export const createMongoDBService = (overrides: Partial<DatabaseService> = {}): DatabaseService => {
  return createDatabaseService({
    name: 'test-mongodb',
    label: 'Test MongoDB Database',
    type: 'mongodb',
    config: {
      host: 'localhost',
      port: 27017,
      database: 'test_db',
      username: 'test_user',
      password: 'test_password',
      driver: 'mongodb',
      options: {
        readPreference: 'primary',
        writeConcern: 'majority',
        readConcern: 'majority',
      },
      dsn: '',
      attributes: [],
      statements: [],
    },
    ...overrides,
  });
};

export const createOracleService = (overrides: Partial<DatabaseService> = {}): DatabaseService => {
  return createDatabaseService({
    name: 'test-oracle-db',
    label: 'Test Oracle Database',
    type: 'oracle',
    config: {
      host: 'localhost',
      port: 1521,
      database: 'XE',
      username: 'test_user',
      password: 'test_password',
      driver: 'oracle',
      service_name: 'XE',
      charset: 'AL32UTF8',
      options: {},
      attributes: [],
      statements: [],
    },
    ...overrides,
  });
};

export const createSnowflakeService = (overrides: Partial<DatabaseService> = {}): DatabaseService => {
  return createDatabaseService({
    name: 'test-snowflake-db',
    label: 'Test Snowflake Database',
    type: 'snowflake',
    config: {
      host: 'test-account.snowflakecomputing.com',
      database: 'TEST_DB',
      username: 'test_user',
      password: 'test_password',
      driver: 'snowflake',
      warehouse: 'TEST_WH',
      schema: 'PUBLIC',
      role: 'TEST_ROLE',
      options: {},
      attributes: [],
      statements: [],
    },
    ...overrides,
  });
};

/**
 * Connection Test Mock Data
 * For testing database connection validation workflows
 */
export const createConnectionTestResult = (success: boolean = true, overrides: any = {}) => {
  const baseResult = {
    success,
    timestamp: new Date().toISOString(),
    response_time_ms: success ? 250 : 5000,
    error: success ? null : 'Connection timeout after 5000ms',
    details: success 
      ? {
          host: 'localhost',
          port: 3306,
          database: 'test_db',
          server_version: '8.0.35',
          connection_id: 12345,
        }
      : {
          error_code: 'TIMEOUT',
          error_type: 'CONNECTION_ERROR',
          retry_count: 3,
        },
  };

  return { ...baseResult, ...overrides };
};

/**
 * Schema Discovery Mock Data Generators
 * For testing schema discovery functionality with table and field metadata
 */
export const createSchemaTable = (overrides: Partial<SchemaTable> = {}): SchemaTable => {
  const baseTable = {
    alias: 'users',
    name: 'users',
    label: 'Users',
    description: 'User accounts table',
    native: [],
    plural: 'users',
    is_view: false,
    primary_key: ['id'],
    name_field: 'name',
    access: 31, // Full CRUD access
    field: [],
    related: [],
    constraints: {},
    created_date: '2024-01-01T00:00:00.000Z',
    last_modified_date: '2024-01-01T00:00:00.000Z',
  };

  return { ...baseTable, ...overrides };
};

export const createSchemaField = (overrides: Partial<SchemaField> = {}): SchemaField => {
  const baseField = {
    alias: 'id',
    name: 'id',
    label: 'ID',
    description: 'Primary key identifier',
    native: [],
    type: 'id',
    db_type: 'int(11)',
    length: 11,
    precision: null,
    scale: null,
    default: null,
    required: false,
    allow_null: false,
    fixed_length: false,
    supports_multibyte: false,
    auto_increment: true,
    is_primary_key: true,
    is_unique: true,
    is_index: false,
    is_foreign_key: false,
    ref_table: null,
    ref_field: null,
    ref_on_update: null,
    ref_on_delete: null,
    picklist: null,
    validation: null,
    db_function: null,
    is_virtual: false,
    is_aggregate: false,
  };

  return { ...baseField, ...overrides };
};

export const createStringField = (name: string, overrides: Partial<SchemaField> = {}): SchemaField => {
  return createSchemaField({
    alias: name,
    name,
    label: name.charAt(0).toUpperCase() + name.slice(1),
    type: 'string',
    db_type: 'varchar(255)',
    length: 255,
    auto_increment: false,
    is_primary_key: false,
    is_unique: false,
    allow_null: true,
    ...overrides,
  });
};

export const createEmailField = (overrides: Partial<SchemaField> = {}): SchemaField => {
  return createStringField('email', {
    label: 'Email Address',
    description: 'User email address',
    is_unique: true,
    required: true,
    allow_null: false,
    validation: ['email'],
    ...overrides,
  });
};

export const createTimestampField = (name: string, overrides: Partial<SchemaField> = {}): SchemaField => {
  return createSchemaField({
    alias: name,
    name,
    label: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
    type: 'timestamp',
    db_type: 'timestamp',
    default: 'CURRENT_TIMESTAMP',
    allow_null: false,
    auto_increment: false,
    is_primary_key: false,
    is_unique: false,
    ...overrides,
  });
};

export const createBooleanField = (name: string, overrides: Partial<SchemaField> = {}): SchemaField => {
  return createSchemaField({
    alias: name,
    name,
    label: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
    type: 'boolean',
    db_type: 'tinyint(1)',
    length: 1,
    default: false,
    allow_null: false,
    auto_increment: false,
    is_primary_key: false,
    is_unique: false,
    ...overrides,
  });
};

export const createForeignKeyField = (name: string, refTable: string, overrides: Partial<SchemaField> = {}): SchemaField => {
  return createSchemaField({
    alias: name,
    name,
    label: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
    type: 'integer',
    db_type: 'int(11)',
    length: 11,
    is_foreign_key: true,
    ref_table: refTable,
    ref_field: 'id',
    ref_on_update: 'CASCADE',
    ref_on_delete: 'SET NULL',
    allow_null: true,
    auto_increment: false,
    is_primary_key: false,
    is_unique: false,
    ...overrides,
  });
};

/**
 * Complete table with common fields for testing
 */
export const createUsersTable = (): SchemaTable => {
  const table = createSchemaTable({
    name: 'users',
    label: 'Users',
    description: 'Application users',
  });

  table.field = [
    createSchemaField(), // ID field (default)
    createStringField('first_name', { required: true, allow_null: false }),
    createStringField('last_name', { required: true, allow_null: false }),
    createEmailField(),
    createStringField('password', { length: 255, required: true, allow_null: false }),
    createBooleanField('is_active', { default: true }),
    createTimestampField('created_at'),
    createTimestampField('updated_at'),
  ];

  return table;
};

export const createOrdersTable = (): SchemaTable => {
  const table = createSchemaTable({
    name: 'orders',
    label: 'Orders',
    description: 'Customer orders',
  });

  table.field = [
    createSchemaField(), // ID field
    createForeignKeyField('user_id', 'users', { required: true, allow_null: false }),
    createStringField('order_number', { length: 50, is_unique: true, required: true }),
    createSchemaField({
      alias: 'total_amount',
      name: 'total_amount',
      label: 'Total Amount',
      type: 'decimal',
      db_type: 'decimal(10,2)',
      precision: 10,
      scale: 2,
      default: '0.00',
      allow_null: false,
    }),
    createStringField('status', { 
      length: 20, 
      default: 'pending',
      picklist: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    }),
    createTimestampField('created_at'),
    createTimestampField('updated_at'),
  ];

  return table;
};

/**
 * Large schema for testing performance with 1000+ tables
 */
export const createLargeSchema = (tableCount: number = 1000): SchemaTable[] => {
  const tables: SchemaTable[] = [];

  // Add some core tables
  tables.push(createUsersTable());
  tables.push(createOrdersTable());

  // Generate additional tables for performance testing
  for (let i = 3; i <= tableCount; i++) {
    const tableName = `table_${i.toString().padStart(4, '0')}`;
    const table = createSchemaTable({
      name: tableName,
      label: `Table ${i}`,
      description: `Generated table ${i} for performance testing`,
    });

    table.field = [
      createSchemaField(), // ID field
      createStringField('name'),
      createStringField('description'),
      createBooleanField('is_active'),
      createTimestampField('created_at'),
    ];

    tables.push(table);
  }

  return tables;
};

/**
 * User and Admin Profile Factory Functions
 * With role-based permission scenarios
 */
export const createUserProfile = (overrides: Partial<UserProfile> = {}): UserProfile => {
  const baseUser = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    name: 'John Doe',
    username: 'john.doe',
    email: 'john.doe@example.com',
    is_active: true,
    confirmed: true,
    last_login_date: '2024-01-01T12:00:00.000Z',
    created_date: '2024-01-01T00:00:00.000Z',
    last_modified_date: '2024-01-01T00:00:00.000Z',
    created_by_id: 1,
    last_modified_by_id: 1,
    phone: '+1-555-123-4567',
    security_question: 'What is your favorite color?',
    default_app_id: null,
    oauth_provider: null,
    expired: false,
    is_sys_admin: false,
    role: [],
    user_lookup_by_user_id: [],
    app_by_user_id: [],
  };

  return { ...baseUser, ...overrides };
};

export const createAdminProfile = (overrides: Partial<AdminProfile> = {}): AdminProfile => {
  return createUserProfile({
    email: 'admin@example.com',
    username: 'admin',
    first_name: 'System',
    last_name: 'Administrator',
    name: 'System Administrator',
    is_sys_admin: true,
    ...overrides,
  });
};

export const createRole = (overrides: Partial<Role> = {}): Role => {
  const baseRole = {
    id: 1,
    name: 'user',
    description: 'Standard user role',
    is_active: true,
    created_date: '2024-01-01T00:00:00.000Z',
    last_modified_date: '2024-01-01T00:00:00.000Z',
    created_by_id: 1,
    last_modified_by_id: 1,
    role_service_access_by_role_id: [],
    role_lookup_by_role_id: [],
    user_to_app_to_role_by_role_id: [],
  };

  return { ...baseRole, ...overrides };
};

export const createAdminRole = (): Role => {
  return createRole({
    name: 'admin',
    description: 'Administrator role with full access',
    role_service_access_by_role_id: [
      {
        id: 1,
        role_id: 1,
        service_id: 1,
        component: '*',
        verb_mask: 31, // Full CRUD access
        requestor_type: 1,
        filters: [],
        filter_op: 'AND',
      },
    ],
  });
};

export const createReadOnlyRole = (): Role => {
  return createRole({
    name: 'readonly',
    description: 'Read-only access role',
    role_service_access_by_role_id: [
      {
        id: 2,
        role_id: 2,
        service_id: 1,
        component: '*',
        verb_mask: 1, // Only GET access
        requestor_type: 1,
        filters: [],
        filter_op: 'AND',
      },
    ],
  });
};

/**
 * User with specific role scenarios for testing RBAC
 */
export const createUserWithRole = (roleName: string, permissions: any[] = []): UserProfile => {
  const roles = {
    admin: createAdminRole(),
    readonly: createReadOnlyRole(),
    user: createRole(),
  };

  return createUserProfile({
    role: [roles[roleName as keyof typeof roles] || createRole({ name: roleName })],
  });
};

/**
 * Form Validation Test Data Factories
 * For React Hook Form integration testing
 */
export const createFormValidationState = (overrides: Partial<FormValidationState> = {}): FormValidationState => {
  const baseState = {
    isValid: true,
    isDirty: false,
    isSubmitting: false,
    isSubmitted: false,
    errors: {},
    touchedFields: {},
    dirtyFields: {},
    values: {},
    defaultValues: {},
  };

  return { ...baseState, ...overrides };
};

export const createFormErrors = (fieldErrors: Record<string, string>): FormValidationState => {
  return createFormValidationState({
    isValid: false,
    errors: fieldErrors,
    touchedFields: Object.keys(fieldErrors).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
  });
};

export const createDatabaseConnectionFormData = (overrides: any = {}) => {
  const baseData = {
    name: 'test-connection',
    label: 'Test Connection',
    description: 'Test database connection',
    type: 'mysql',
    is_active: true,
    config: {
      host: 'localhost',
      port: 3306,
      database: 'test_db',
      username: 'test_user',
      password: 'test_password',
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
    },
  };

  return { ...baseData, ...overrides };
};

export const createFormValidationScenarios = () => {
  return {
    valid: createFormValidationState(),
    requiredFieldMissing: createFormErrors({
      name: 'Name is required',
      host: 'Host is required',
    }),
    invalidEmail: createFormErrors({
      email: 'Please enter a valid email address',
    }),
    passwordTooShort: createFormErrors({
      password: 'Password must be at least 8 characters long',
    }),
    invalidPort: createFormErrors({
      port: 'Port must be a number between 1 and 65535',
    }),
    submitting: createFormValidationState({
      isSubmitting: true,
      isValid: true,
    }),
    submitted: createFormValidationState({
      isSubmitted: true,
      isValid: true,
    }),
  };
};

/**
 * API Endpoint Configuration Mock Data
 * For OpenAPI testing scenarios
 */
export const createApiEndpoint = (overrides: Partial<ApiEndpoint> = {}): ApiEndpoint => {
  const baseEndpoint = {
    path: '/api/v2/users',
    method: 'GET',
    summary: 'Get users',
    description: 'Retrieve a list of users',
    operationId: 'getUsers',
    tags: ['Users'],
    parameters: [
      {
        name: 'limit',
        in: 'query',
        description: 'Maximum number of records to return',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 1000, default: 100 },
      },
      {
        name: 'offset',
        in: 'query',
        description: 'Number of records to skip',
        required: false,
        schema: { type: 'integer', minimum: 0, default: 0 },
      },
    ],
    responses: {
      '200': {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                resource: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                meta: { $ref: '#/components/schemas/Meta' },
              },
            },
          },
        },
      },
      '400': {
        description: 'Bad Request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
    },
    security: [{ ApiKeyAuth: [] }],
  };

  return { ...baseEndpoint, ...overrides };
};

export const createOpenApiSpec = (overrides: Partial<OpenApiSpec> = {}): OpenApiSpec => {
  const baseSpec = {
    openapi: '3.0.3',
    info: {
      title: 'DreamFactory API',
      description: 'Generated API documentation',
      version: '1.0.0',
      contact: {
        name: 'DreamFactory Support',
        url: 'https://www.dreamfactory.com',
        email: 'support@dreamfactory.com',
      },
    },
    servers: [
      {
        url: 'https://localhost/api/v2',
        description: 'Development server',
      },
    ],
    paths: {
      '/users': {
        get: createApiEndpoint(),
        post: createApiEndpoint({
          method: 'POST',
          summary: 'Create user',
          description: 'Create a new user',
          operationId: 'createUser',
        }),
      },
    },
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', format: 'int64' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            is_active: { type: 'boolean' },
            created_date: { type: 'string', format: 'date-time' },
          },
        },
        Meta: {
          type: 'object',
          properties: {
            count: { type: 'integer' },
            limit: { type: 'integer' },
            offset: { type: 'integer' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'integer' },
                message: { type: 'string' },
                context: { type: 'object' },
              },
            },
          },
        },
      },
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-DreamFactory-API-Key',
        },
        JWTAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      { ApiKeyAuth: [] },
      { JWTAuth: [] },
    ],
  };

  return { ...baseSpec, ...overrides };
};

/**
 * System Configuration Mock Data Factories
 * For environment and service settings testing
 */
export const createSystemConfig = (overrides: Partial<SystemConfig> = {}): SystemConfig => {
  const baseConfig = {
    id: 1,
    name: 'app.debug',
    value: 'false',
    description: 'Enable application debug mode',
    is_private: false,
    created_date: '2024-01-01T00:00:00.000Z',
    last_modified_date: '2024-01-01T00:00:00.000Z',
    created_by_id: 1,
    last_modified_by_id: 1,
  };

  return { ...baseConfig, ...overrides };
};

export const createEmailTemplateConfig = (): SystemConfig[] => {
  return [
    createSystemConfig({
      name: 'smtp.host',
      value: 'smtp.example.com',
      description: 'SMTP server hostname',
    }),
    createSystemConfig({
      name: 'smtp.port',
      value: '587',
      description: 'SMTP server port',
    }),
    createSystemConfig({
      name: 'smtp.username',
      value: 'noreply@example.com',
      description: 'SMTP authentication username',
      is_private: true,
    }),
    createSystemConfig({
      name: 'smtp.password',
      value: '********',
      description: 'SMTP authentication password',
      is_private: true,
    }),
  ];
};

export const createCorsConfig = (): SystemConfig[] => {
  return [
    createSystemConfig({
      name: 'cors.enabled',
      value: 'true',
      description: 'Enable CORS support',
    }),
    createSystemConfig({
      name: 'cors.origins',
      value: 'http://localhost:3000,https://app.example.com',
      description: 'Allowed CORS origins',
    }),
    createSystemConfig({
      name: 'cors.methods',
      value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      description: 'Allowed HTTP methods',
    }),
    createSystemConfig({
      name: 'cors.headers',
      value: 'Origin,Content-Type,Accept,Authorization,X-Requested-With',
      description: 'Allowed headers',
    }),
  ];
};

export const createCacheConfig = (): SystemConfig[] => {
  return [
    createSystemConfig({
      name: 'cache.driver',
      value: 'redis',
      description: 'Cache driver (file, redis, memcached)',
    }),
    createSystemConfig({
      name: 'cache.redis.host',
      value: 'localhost',
      description: 'Redis server hostname',
    }),
    createSystemConfig({
      name: 'cache.redis.port',
      value: '6379',
      description: 'Redis server port',
    }),
    createSystemConfig({
      name: 'cache.default_ttl',
      value: '3600',
      description: 'Default cache TTL in seconds',
    }),
  ];
};

/**
 * Environment Configuration Factory
 */
export const createEnvironmentConfig = (env: 'development' | 'staging' | 'production' = 'development') => {
  const configs = {
    development: {
      api_url: 'http://localhost:8000/api/v2',
      app_url: 'http://localhost:3000',
      debug: true,
      log_level: 'debug',
      cache_enabled: false,
    },
    staging: {
      api_url: 'https://staging-api.example.com/api/v2',
      app_url: 'https://staging.example.com',
      debug: false,
      log_level: 'info',
      cache_enabled: true,
    },
    production: {
      api_url: 'https://api.example.com/api/v2',
      app_url: 'https://app.example.com',
      debug: false,
      log_level: 'error',
      cache_enabled: true,
    },
  };

  return configs[env];
};

/**
 * Collection Factories for Comprehensive Testing
 */
export const createCompleteTestDataSet = () => {
  return {
    // Database services
    services: {
      mysql: createDatabaseService(),
      postgresql: createPostgreSQLService(),
      mongodb: createMongoDBService(),
      oracle: createOracleService(),
      snowflake: createSnowflakeService(),
    },
    
    // Schema data
    schema: {
      users: createUsersTable(),
      orders: createOrdersTable(),
      largeSchema: createLargeSchema(100), // Smaller for quick tests
    },
    
    // User data
    users: {
      admin: createAdminProfile(),
      user: createUserProfile(),
      userWithAdminRole: createUserWithRole('admin'),
      userWithReadOnlyRole: createUserWithRole('readonly'),
    },
    
    // Roles
    roles: {
      admin: createAdminRole(),
      readonly: createReadOnlyRole(),
      user: createRole(),
    },
    
    // API configuration
    api: {
      endpoint: createApiEndpoint(),
      openApiSpec: createOpenApiSpec(),
    },
    
    // System configuration
    system: {
      email: createEmailTemplateConfig(),
      cors: createCorsConfig(),
      cache: createCacheConfig(),
      environment: createEnvironmentConfig(),
    },
    
    // Form validation
    forms: {
      validation: createFormValidationScenarios(),
      connectionData: createDatabaseConnectionFormData(),
    },
    
    // Connection testing
    connection: {
      success: createConnectionTestResult(true),
      failure: createConnectionTestResult(false),
      timeout: createConnectionTestResult(false, {
        error: 'Connection timeout',
        response_time_ms: 5000,
      }),
    },
  };
};

/**
 * Factory for creating test data with specific scenarios
 */
export const createTestScenario = (scenario: string) => {
  const scenarios = {
    'database-connection-success': () => ({
      service: createDatabaseService(),
      connectionResult: createConnectionTestResult(true),
      form: createFormValidationState(),
    }),
    
    'database-connection-failure': () => ({
      service: createDatabaseService(),
      connectionResult: createConnectionTestResult(false),
      form: createFormErrors({ host: 'Unable to connect to database host' }),
    }),
    
    'schema-discovery-large': () => ({
      service: createDatabaseService(),
      schema: createLargeSchema(1500),
      connectionResult: createConnectionTestResult(true),
    }),
    
    'user-management-admin': () => ({
      currentUser: createAdminProfile(),
      users: [createUserProfile(), createUserProfile({ id: 2, email: 'jane@example.com' })],
      roles: [createAdminRole(), createReadOnlyRole()],
    }),
    
    'api-generation-complete': () => ({
      service: createDatabaseService(),
      schema: createUsersTable(),
      endpoints: [
        createApiEndpoint(),
        createApiEndpoint({ method: 'POST', path: '/api/v2/users' }),
        createApiEndpoint({ method: 'PUT', path: '/api/v2/users/{id}' }),
        createApiEndpoint({ method: 'DELETE', path: '/api/v2/users/{id}' }),
      ],
      openApiSpec: createOpenApiSpec(),
    }),
    
    'system-configuration': () => ({
      emailConfig: createEmailTemplateConfig(),
      corsConfig: createCorsConfig(),
      cacheConfig: createCacheConfig(),
      environment: createEnvironmentConfig('development'),
    }),
  };

  const scenarioFn = scenarios[scenario as keyof typeof scenarios];
  if (!scenarioFn) {
    throw new Error(`Unknown test scenario: ${scenario}`);
  }

  return scenarioFn();
};

// Re-export the legacy mockTableDetailsData for backward compatibility
export const mockTableDetailsData = {
  alias: 'test-table',
  name: 'test-table',
  label: 'label',
  description: 'desc',
  native: [],
  plural: 'labels',
  is_view: false,
  primary_key: ['ja'],
  name_field: null,
  field: [
    {
      alias: 'isActive',
      name: 'active',
      label: 'active',
      description: null,
      native: [],
      type: 'boolean',
      db_type: 'tinyint(1)',
      length: 1,
      precision: null,
      scale: null,
      default: true,
      required: false,
      allow_null: false,
      fixed_length: false,
      supports_multibyte: false,
      auto_increment: false,
      is_primary_key: false,
      is_unique: false,
      is_index: false,
      is_foreign_key: false,
      ref_table: null,
      ref_field: null,
      ref_on_update: null,
      ref_on_delete: null,
      picklist: null,
      validation: ['{"success": false}'],
      db_function: [
        {
          use: ['SELECT', 'FILTER'],
          function: 'upper(fieldname)',
        },
        {
          use: ['UPDATE'],
          function: 'max(fieldname)',
        },
      ],
      is_virtual: false,
      is_aggregate: false,
    },
    {
      alias: 'test',
      name: 'another',
      label: 'Another',
      description: 'test',
      native: [],
      type: 'integer',
      db_type: 'int(11)',
      length: 11,
      precision: null,
      scale: null,
      default: 0,
      required: false,
      allow_null: true,
      fixed_length: false,
      supports_multibyte: false,
      auto_increment: false,
      is_primary_key: false,
      is_unique: false,
      is_index: false,
      is_foreign_key: false,
      ref_table: null,
      ref_field: null,
      ref_on_update: null,
      ref_on_delete: null,
      picklist: ['1', '2', '3'],
      validation: null,
      db_function: null,
      is_virtual: false,
      is_aggregate: false,
    },
    {
      alias: '',
      name: 'game',
      label: 'game',
      description: null,
      native: [],
      type: 'user_id',
      db_type: 'int(11)',
      length: 11,
      precision: null,
      scale: null,
      default: null,
      required: true,
      allow_null: false,
      fixed_length: false,
      supports_multibyte: false,
      auto_increment: false,
      is_primary_key: false,
      is_unique: true,
      is_index: false,
      is_foreign_key: false,
      ref_table: null,
      ref_field: null,
      ref_on_update: null,
      ref_on_delete: null,
      picklist: null,
      validation: null,
      db_function: [
        {
          use: ['filter', 'insert'],
          function: 'upper(fieldname)',
        },
        {
          use: ['select', 'filter', 'insert', 'update'],
          function: 'upper(fieldname)',
        },
        {
          use: ['update'],
          function: 'upper(fieldname)',
        },
      ],
      is_virtual: false,
      is_aggregate: false,
    },
    {
      alias: null,
      name: 'ja',
      label: 'Ja',
      description: null,
      native: [],
      type: 'id',
      db_type: 'int(11)',
      length: 11,
      precision: null,
      scale: null,
      default: null,
      required: false,
      allow_null: false,
      fixed_length: false,
      supports_multibyte: false,
      auto_increment: true,
      is_primary_key: true,
      is_unique: true,
      is_index: false,
      is_foreign_key: false,
      ref_table: null,
      ref_field: null,
      ref_on_update: null,
      ref_on_delete: null,
      picklist: null,
      validation: null,
      db_function: null,
      is_virtual: false,
      is_aggregate: false,
    },
  ],
  related: [
    {
      alias: 'test-relationship',
      name: 'app_by_is_active',
      label: 'label-test-relationship',
      description: null,
      native: [],
      type: 'has_one',
      field: 'active',
      is_virtual: true,
      ref_service_id: 45,
      ref_table: 'app',
      ref_field: 'is_active',
      ref_on_update: null,
      ref_on_delete: null,
      junction_service_id: null,
      junction_table: null,
      junction_field: null,
      junction_ref_field: null,
      always_fetch: false,
      flatten: false,
      flatten_drop_prefix: false,
    },
  ],
  constraints: {
    primary: {
      constraint_type: 'PRIMARY KEY',
      constraint_schema: 'dreamfactory',
      constraint_name: 'PRIMARY',
      table_schema: 'dreamfactory',
      table_name: 'test-table',
      column_name: 'ja',
      referenced_table_schema: null,
      referenced_table_name: null,
      referenced_column_name: null,
      update_rule: null,
      delete_rule: null,
    },
    game: {
      constraint_type: 'UNIQUE',
      constraint_schema: 'dreamfactory',
      constraint_name: 'game',
      table_schema: 'dreamfactory',
      table_name: 'test-table',
      column_name: 'game',
      referenced_table_schema: null,
      referenced_table_name: null,
      referenced_column_name: null,
      update_rule: null,
      delete_rule: null,
    },
    undx_dreamfactory_test_table_game: {
      constraint_type: 'UNIQUE',
      constraint_schema: 'dreamfactory',
      constraint_name: 'undx_dreamfactory_test-table_game',
      table_schema: 'dreamfactory',
      table_name: 'test-table',
      column_name: 'game',
      referenced_table_schema: null,
      referenced_table_name: null,
      referenced_column_name: null,
      update_rule: null,
      delete_rule: null,
    },
    undx_dreamfactory_test_table_ja: {
      constraint_type: 'UNIQUE',
      constraint_schema: 'dreamfactory',
      constraint_name: 'undx_dreamfactory_test-table_ja',
      table_schema: 'dreamfactory',
      table_name: 'test-table',
      column_name: 'ja',
      referenced_table_schema: null,
      referenced_table_name: null,
      referenced_column_name: null,
      update_rule: null,
      delete_rule: null,
    },
  },
  access: 31,
};