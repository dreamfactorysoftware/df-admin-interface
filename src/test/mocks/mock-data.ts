/**
 * Comprehensive mock data fixtures for DreamFactory API responses
 * Provides realistic test data for development and testing scenarios
 * 
 * This file contains mock data for:
 * - Database service configurations
 * - Schema metadata and discovery
 * - User management and authentication
 * - System configuration
 * - API documentation and OpenAPI specs
 */

import type {
  DatabaseService,
  DatabaseServiceConfig,
  SchemaData,
  SchemaTable,
  SchemaField,
  ForeignKey,
  TableIndex,
  ConnectionTestResult,
  FormSchema,
} from '../../types';

// ============================================================================
// DATABASE SERVICE MOCK DATA
// ============================================================================

export const mockDatabaseDrivers = [
  'mysql',
  'postgresql',
  'sqlserver',
  'oracle',
  'mongodb',
  'snowflake',
  'sqlite',
  'mariadb',
] as const;

export const mockDatabaseServiceConfigs: Record<string, DatabaseServiceConfig> = {
  mysql: {
    host: 'mysql-server.internal',
    port: 3306,
    database: 'production_app',
    username: 'app_user',
    password: '***hidden***',
    driver: 'mysql',
    charset: 'utf8mb4',
    timezone: 'UTC',
    pooling: {
      min: 5,
      max: 20,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 600000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    },
    ssl: {
      enabled: true,
      mode: 'require',
      rejectUnauthorized: true,
    },
    options: {
      caching: {
        enabled: true,
        ttl: 300,
        maxSize: 1000,
        strategy: 'lru',
      },
      queryTimeout: 30000,
      connectionTimeout: 10000,
      maxQueryParams: 1000,
      caseSensitive: false,
      dateFormat: 'YYYY-MM-DD HH:mm:ss',
      enableForeignKeys: true,
    },
    security: {
      encryption: {
        enabled: true,
        algorithm: 'AES-256-GCM',
        keyRotation: true,
      },
      auditing: {
        enabled: true,
        logLevel: 'standard',
        retentionDays: 90,
      },
      accessControl: {
        allowedIPs: ['10.0.0.0/8', '172.16.0.0/12'],
        maxConnections: 100,
        rateLimiting: {
          enabled: true,
          requestsPerMinute: 1000,
          requestsPerHour: 50000,
          requestsPerDay: 1000000,
        },
      },
    },
  },
  postgresql: {
    host: 'pg-cluster.internal',
    port: 5432,
    database: 'analytics_db',
    username: 'analytics_user',
    password: '***hidden***',
    driver: 'postgresql',
    charset: 'UTF8',
    timezone: 'UTC',
    pooling: {
      min: 2,
      max: 15,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 600000,
    },
    ssl: {
      enabled: true,
      mode: 'verify-full',
      rejectUnauthorized: true,
    },
    options: {
      caching: {
        enabled: true,
        ttl: 600,
        maxSize: 500,
        strategy: 'lfu',
      },
      queryTimeout: 45000,
      connectionTimeout: 15000,
      maxQueryParams: 2000,
      caseSensitive: true,
      enableForeignKeys: true,
    },
  },
  mongodb: {
    host: 'mongo-replica.internal',
    port: 27017,
    database: 'document_store',
    username: 'doc_user',
    password: '***hidden***',
    driver: 'mongodb',
    connectionString: 'mongodb://mongo-replica.internal:27017/document_store?replicaSet=rs0',
    options: {
      caching: {
        enabled: true,
        ttl: 300,
        maxSize: 1000,
        strategy: 'lru',
      },
      connectionTimeout: 10000,
      maxQueryParams: 500,
    },
  },
};

export const mockDatabaseServices: DatabaseService[] = [
  {
    id: 1,
    name: 'mysql_production',
    label: 'Production MySQL Database',
    description: 'Primary production database for customer data and transactions',
    type: 'mysql',
    config: mockDatabaseServiceConfigs.mysql,
    is_active: true,
    created_date: '2024-01-15T10:30:00Z',
    last_modified_date: '2024-03-10T14:45:00Z',
    created_by_id: 1,
    last_modified_by_id: 1,
    status: 'active',
    lastConnectionTest: {
      success: true,
      message: 'Connection successful',
      details: 'Connected to mysql-server.internal:3306 in 245ms',
      testDuration: 245,
      timestamp: '2024-03-15T09:15:00Z',
    },
    schemaLastDiscovered: '2024-03-15T08:00:00Z',
    apiEndpointsCount: 45,
  },
  {
    id: 2,
    name: 'postgresql_analytics',
    label: 'Analytics PostgreSQL Database',
    description: 'Data warehouse for business intelligence and reporting',
    type: 'postgresql',
    config: mockDatabaseServiceConfigs.postgresql,
    is_active: true,
    created_date: '2024-02-01T09:00:00Z',
    last_modified_date: '2024-03-12T11:20:00Z',
    created_by_id: 2,
    last_modified_by_id: 1,
    status: 'active',
    lastConnectionTest: {
      success: true,
      message: 'Connection successful',
      details: 'Connected to pg-cluster.internal:5432 in 180ms',
      testDuration: 180,
      timestamp: '2024-03-15T09:10:00Z',
    },
    schemaLastDiscovered: '2024-03-15T07:30:00Z',
    apiEndpointsCount: 28,
  },
  {
    id: 3,
    name: 'mongodb_documents',
    label: 'Document Store MongoDB',
    description: 'NoSQL database for flexible document storage and content management',
    type: 'mongodb',
    config: mockDatabaseServiceConfigs.mongodb,
    is_active: true,
    created_date: '2024-02-20T16:45:00Z',
    last_modified_date: '2024-03-08T13:30:00Z',
    created_by_id: 3,
    last_modified_by_id: 3,
    status: 'active',
    lastConnectionTest: {
      success: true,
      message: 'Connection successful',
      details: 'Connected to mongo-replica.internal:27017 in 120ms',
      testDuration: 120,
      timestamp: '2024-03-15T09:05:00Z',
    },
    schemaLastDiscovered: '2024-03-15T07:00:00Z',
    apiEndpointsCount: 12,
  },
  {
    id: 4,
    name: 'mysql_staging',
    label: 'Staging MySQL Database',
    description: 'Staging environment for testing and development',
    type: 'mysql',
    config: {
      ...mockDatabaseServiceConfigs.mysql,
      host: 'mysql-staging.internal',
      database: 'staging_app',
      username: 'staging_user',
    },
    is_active: false,
    created_date: '2024-01-20T12:00:00Z',
    last_modified_date: '2024-03-01T10:15:00Z',
    created_by_id: 2,
    last_modified_by_id: 2,
    status: 'inactive',
    lastConnectionTest: {
      success: false,
      message: 'Connection failed',
      details: 'Host mysql-staging.internal:3306 is unreachable',
      testDuration: 5000,
      timestamp: '2024-03-15T09:00:00Z',
      errorCode: 'CONNECTION_TIMEOUT',
    },
    schemaLastDiscovered: '2024-02-28T15:00:00Z',
    apiEndpointsCount: 0,
  },
];

// ============================================================================
// SCHEMA METADATA MOCK DATA
// ============================================================================

export const mockSchemaFields: SchemaField[] = [
  {
    name: 'id',
    type: 'integer',
    dbType: 'INT',
    length: 11,
    defaultValue: null,
    isNullable: false,
    isPrimaryKey: true,
    isForeignKey: false,
    isUnique: true,
    isAutoIncrement: true,
    label: 'ID',
    description: 'Primary key identifier',
    validation: {
      required: true,
      min: 1,
    },
    constraints: [
      {
        type: 'primary_key',
        definition: 'PRIMARY KEY (id)',
        name: 'pk_users_id',
      },
    ],
  },
  {
    name: 'email',
    type: 'string',
    dbType: 'VARCHAR',
    length: 255,
    defaultValue: null,
    isNullable: false,
    isPrimaryKey: false,
    isForeignKey: false,
    isUnique: true,
    isAutoIncrement: false,
    label: 'Email Address',
    description: 'User email address for authentication',
    validation: {
      required: true,
      maxLength: 255,
      pattern: '^[^@]+@[^@]+\\.[^@]+$',
      format: 'email',
    },
    format: {
      lowercase: true,
    },
    constraints: [
      {
        type: 'unique',
        definition: 'UNIQUE KEY `uk_users_email` (`email`)',
        name: 'uk_users_email',
      },
    ],
  },
  {
    name: 'first_name',
    type: 'string',
    dbType: 'VARCHAR',
    length: 100,
    defaultValue: null,
    isNullable: false,
    isPrimaryKey: false,
    isForeignKey: false,
    isUnique: false,
    isAutoIncrement: false,
    label: 'First Name',
    description: 'User first name',
    validation: {
      required: true,
      maxLength: 100,
      minLength: 1,
    },
    format: {
      capitalize: true,
    },
  },
  {
    name: 'last_name',
    type: 'string',
    dbType: 'VARCHAR',
    length: 100,
    defaultValue: null,
    isNullable: false,
    isPrimaryKey: false,
    isForeignKey: false,
    isUnique: false,
    isAutoIncrement: false,
    label: 'Last Name',
    description: 'User last name',
    validation: {
      required: true,
      maxLength: 100,
      minLength: 1,
    },
    format: {
      capitalize: true,
    },
  },
  {
    name: 'role_id',
    type: 'integer',
    dbType: 'INT',
    length: 11,
    defaultValue: null,
    isNullable: true,
    isPrimaryKey: false,
    isForeignKey: true,
    isUnique: false,
    isAutoIncrement: false,
    label: 'Role ID',
    description: 'Reference to user role',
    validation: {
      min: 1,
    },
    constraints: [
      {
        type: 'foreign_key',
        definition: 'FOREIGN KEY (role_id) REFERENCES roles(id)',
        name: 'fk_users_role_id',
      },
    ],
  },
  {
    name: 'created_at',
    type: 'timestamp',
    dbType: 'TIMESTAMP',
    defaultValue: 'CURRENT_TIMESTAMP',
    isNullable: false,
    isPrimaryKey: false,
    isForeignKey: false,
    isUnique: false,
    isAutoIncrement: false,
    label: 'Created At',
    description: 'Record creation timestamp',
    validation: {
      required: true,
    },
  },
  {
    name: 'updated_at',
    type: 'timestamp',
    dbType: 'TIMESTAMP',
    defaultValue: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    isNullable: false,
    isPrimaryKey: false,
    isForeignKey: false,
    isUnique: false,
    isAutoIncrement: false,
    label: 'Updated At',
    description: 'Record last update timestamp',
    validation: {
      required: true,
    },
  },
];

export const mockSchemaTables: SchemaTable[] = [
  {
    name: 'users',
    label: 'Users',
    description: 'System users and authentication data',
    schema: 'public',
    fields: mockSchemaFields,
    primaryKey: ['id'],
    foreignKeys: [
      {
        name: 'fk_users_role_id',
        field: 'role_id',
        referencedTable: 'roles',
        referencedField: 'id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        deferrable: false,
      },
    ],
    indexes: [
      {
        name: 'idx_users_email',
        fields: ['email'],
        unique: true,
        type: 'btree',
      },
      {
        name: 'idx_users_role_id',
        fields: ['role_id'],
        unique: false,
        type: 'btree',
      },
      {
        name: 'idx_users_created_at',
        fields: ['created_at'],
        unique: false,
        type: 'btree',
      },
    ],
    constraints: [
      {
        name: 'pk_users',
        type: 'primary_key',
        definition: 'PRIMARY KEY (id)',
        fields: ['id'],
      },
      {
        name: 'uk_users_email',
        type: 'unique',
        definition: 'UNIQUE KEY (email)',
        fields: ['email'],
      },
    ],
    rowCount: 15420,
    estimatedSize: '2.4 MB',
    lastModified: '2024-03-15T08:30:00Z',
    collation: 'utf8mb4_unicode_ci',
    engine: 'InnoDB',
    expanded: false,
    selected: false,
    apiEnabled: true,
  },
  {
    name: 'roles',
    label: 'Roles',
    description: 'User roles and permissions',
    schema: 'public',
    fields: [
      {
        name: 'id',
        type: 'integer',
        dbType: 'INT',
        length: 11,
        defaultValue: null,
        isNullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        isUnique: true,
        isAutoIncrement: true,
      },
      {
        name: 'name',
        type: 'string',
        dbType: 'VARCHAR',
        length: 50,
        defaultValue: null,
        isNullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        isUnique: true,
        isAutoIncrement: false,
      },
      {
        name: 'description',
        type: 'text',
        dbType: 'TEXT',
        defaultValue: null,
        isNullable: true,
        isPrimaryKey: false,
        isForeignKey: false,
        isUnique: false,
        isAutoIncrement: false,
      },
    ],
    primaryKey: ['id'],
    foreignKeys: [],
    indexes: [
      {
        name: 'idx_roles_name',
        fields: ['name'],
        unique: true,
        type: 'btree',
      },
    ],
    constraints: [
      {
        name: 'pk_roles',
        type: 'primary_key',
        definition: 'PRIMARY KEY (id)',
        fields: ['id'],
      },
    ],
    rowCount: 8,
    estimatedSize: '16 KB',
    lastModified: '2024-02-20T10:00:00Z',
    collation: 'utf8mb4_unicode_ci',
    engine: 'InnoDB',
    expanded: false,
    selected: false,
    apiEnabled: true,
  },
  {
    name: 'products',
    label: 'Products',
    description: 'Product catalog and inventory',
    schema: 'public',
    fields: [
      {
        name: 'id',
        type: 'integer',
        dbType: 'INT',
        length: 11,
        defaultValue: null,
        isNullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        isUnique: true,
        isAutoIncrement: true,
      },
      {
        name: 'sku',
        type: 'string',
        dbType: 'VARCHAR',
        length: 50,
        defaultValue: null,
        isNullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        isUnique: true,
        isAutoIncrement: false,
      },
      {
        name: 'name',
        type: 'string',
        dbType: 'VARCHAR',
        length: 255,
        defaultValue: null,
        isNullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        isUnique: false,
        isAutoIncrement: false,
      },
      {
        name: 'price',
        type: 'decimal',
        dbType: 'DECIMAL',
        precision: 10,
        scale: 2,
        defaultValue: null,
        isNullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        isUnique: false,
        isAutoIncrement: false,
      },
      {
        name: 'category_id',
        type: 'integer',
        dbType: 'INT',
        length: 11,
        defaultValue: null,
        isNullable: true,
        isPrimaryKey: false,
        isForeignKey: true,
        isUnique: false,
        isAutoIncrement: false,
      },
    ],
    primaryKey: ['id'],
    foreignKeys: [
      {
        name: 'fk_products_category_id',
        field: 'category_id',
        referencedTable: 'categories',
        referencedField: 'id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        deferrable: false,
      },
    ],
    indexes: [
      {
        name: 'idx_products_sku',
        fields: ['sku'],
        unique: true,
        type: 'btree',
      },
      {
        name: 'idx_products_category_id',
        fields: ['category_id'],
        unique: false,
        type: 'btree',
      },
      {
        name: 'idx_products_price',
        fields: ['price'],
        unique: false,
        type: 'btree',
      },
    ],
    constraints: [
      {
        name: 'pk_products',
        type: 'primary_key',
        definition: 'PRIMARY KEY (id)',
        fields: ['id'],
      },
      {
        name: 'uk_products_sku',
        type: 'unique',
        definition: 'UNIQUE KEY (sku)',
        fields: ['sku'],
      },
    ],
    rowCount: 125000,
    estimatedSize: '45.2 MB',
    lastModified: '2024-03-15T12:00:00Z',
    collation: 'utf8mb4_unicode_ci',
    engine: 'InnoDB',
    expanded: false,
    selected: false,
    apiEnabled: true,
  },
];

export const mockSchemaData: SchemaData[] = [
  {
    serviceName: 'mysql_production',
    databaseName: 'production_app',
    schemaName: 'public',
    tables: mockSchemaTables,
    views: [
      {
        name: 'user_roles_view',
        definition: 'SELECT u.id, u.email, u.first_name, u.last_name, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id',
        fields: [
          {
            name: 'id',
            type: 'integer',
            dbType: 'INT',
            isNullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
            isUnique: false,
            isAutoIncrement: false,
          },
          {
            name: 'email',
            type: 'string',
            dbType: 'VARCHAR',
            length: 255,
            isNullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
            isUnique: false,
            isAutoIncrement: false,
          },
          {
            name: 'role_name',
            type: 'string',
            dbType: 'VARCHAR',
            length: 50,
            isNullable: true,
            isPrimaryKey: false,
            isForeignKey: false,
            isUnique: false,
            isAutoIncrement: false,
          },
        ],
        updatable: false,
      },
    ],
    procedures: [
      {
        name: 'get_user_statistics',
        parameters: [
          {
            name: 'start_date',
            type: 'DATE',
            mode: 'IN',
          },
          {
            name: 'end_date',
            type: 'DATE',
            mode: 'IN',
          },
        ],
        returnType: 'CURSOR',
        definition: 'SELECT COUNT(*) as total_users, COUNT(DISTINCT role_id) as role_count FROM users WHERE created_at BETWEEN start_date AND end_date',
        language: 'SQL',
      },
    ],
    functions: [
      {
        name: 'calculate_user_age',
        parameters: [
          {
            name: 'birth_date',
            type: 'DATE',
          },
        ],
        returnType: 'INTEGER',
        definition: 'RETURN FLOOR(DATEDIFF(CURDATE(), birth_date) / 365.25)',
        language: 'SQL',
        immutable: true,
      },
    ],
    sequences: [
      {
        name: 'user_id_seq',
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        startValue: 1,
        cache: 1,
        cycle: false,
      },
    ],
    lastDiscovered: '2024-03-15T08:00:00Z',
    totalTables: 3,
    totalFields: 12,
  },
];

// ============================================================================
// USER MANAGEMENT MOCK DATA
// ============================================================================

export const mockRoles = [
  {
    id: 1,
    name: 'super_admin',
    label: 'Super Administrator',
    description: 'Full system access with all permissions',
    is_active: true,
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-01-01T00:00:00Z',
    permissions: [
      'system.admin',
      'user.create',
      'user.read',
      'user.update',
      'user.delete',
      'role.create',
      'role.read',
      'role.update',
      'role.delete',
      'service.create',
      'service.read',
      'service.update',
      'service.delete',
      'schema.read',
      'api.generate',
      'api.test',
      'config.read',
      'config.update',
    ],
  },
  {
    id: 2,
    name: 'admin',
    label: 'Administrator',
    description: 'Administrative access with limited system configuration',
    is_active: true,
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-02-15T10:30:00Z',
    permissions: [
      'user.create',
      'user.read',
      'user.update',
      'role.read',
      'service.create',
      'service.read',
      'service.update',
      'service.delete',
      'schema.read',
      'api.generate',
      'api.test',
      'config.read',
    ],
  },
  {
    id: 3,
    name: 'developer',
    label: 'Developer',
    description: 'Development access for API generation and testing',
    is_active: true,
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-03-01T14:20:00Z',
    permissions: [
      'service.read',
      'schema.read',
      'api.generate',
      'api.test',
      'config.read',
    ],
  },
  {
    id: 4,
    name: 'analyst',
    label: 'Data Analyst',
    description: 'Read-only access for data analysis and reporting',
    is_active: true,
    created_date: '2024-01-15T00:00:00Z',
    last_modified_date: '2024-01-15T00:00:00Z',
    permissions: [
      'service.read',
      'schema.read',
      'api.test',
    ],
  },
  {
    id: 5,
    name: 'viewer',
    label: 'Viewer',
    description: 'Basic read-only access',
    is_active: true,
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-01-01T00:00:00Z',
    permissions: [
      'service.read',
      'schema.read',
    ],
  },
];

export const mockUsers = [
  {
    id: 1,
    email: 'admin@dreamfactory.com',
    first_name: 'System',
    last_name: 'Administrator',
    username: 'admin',
    is_active: true,
    is_verified: true,
    role_id: 1,
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-03-10T09:15:00Z',
    last_login_date: '2024-03-15T08:30:00Z',
    phone: '+1-555-0101',
    security_question: 'What was your first pet\'s name?',
    security_answer: '***hidden***',
    confirm_code: null,
    default_app_id: null,
    oauth_provider: null,
    remember_token: null,
    profile: {
      avatar_url: '/avatars/admin.jpg',
      timezone: 'America/New_York',
      locale: 'en-US',
      theme: 'dark',
      notifications_enabled: true,
      two_factor_enabled: true,
    },
    permissions: mockRoles[0].permissions,
    session: {
      token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...',
      expires_at: '2024-03-15T20:30:00Z',
      created_at: '2024-03-15T08:30:00Z',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  },
  {
    id: 2,
    email: 'john.developer@company.com',
    first_name: 'John',
    last_name: 'Developer',
    username: 'john.dev',
    is_active: true,
    is_verified: true,
    role_id: 3,
    created_date: '2024-01-15T10:00:00Z',
    last_modified_date: '2024-03-12T16:45:00Z',
    last_login_date: '2024-03-15T07:45:00Z',
    phone: '+1-555-0102',
    profile: {
      avatar_url: '/avatars/john.jpg',
      timezone: 'America/Los_Angeles',
      locale: 'en-US',
      theme: 'light',
      notifications_enabled: true,
      two_factor_enabled: false,
    },
    permissions: mockRoles[2].permissions,
  },
  {
    id: 3,
    email: 'sarah.analyst@company.com',
    first_name: 'Sarah',
    last_name: 'Analyst',
    username: 'sarah.analyst',
    is_active: true,
    is_verified: true,
    role_id: 4,
    created_date: '2024-02-01T14:30:00Z',
    last_modified_date: '2024-03-08T11:20:00Z',
    last_login_date: '2024-03-14T16:15:00Z',
    phone: '+1-555-0103',
    profile: {
      avatar_url: '/avatars/sarah.jpg',
      timezone: 'America/Chicago',
      locale: 'en-US',
      theme: 'auto',
      notifications_enabled: false,
      two_factor_enabled: true,
    },
    permissions: mockRoles[3].permissions,
  },
  {
    id: 4,
    email: 'inactive.user@company.com',
    first_name: 'Inactive',
    last_name: 'User',
    username: 'inactive.user',
    is_active: false,
    is_verified: true,
    role_id: 5,
    created_date: '2024-01-20T12:00:00Z',
    last_modified_date: '2024-02-28T09:30:00Z',
    last_login_date: '2024-02-15T14:20:00Z',
    profile: {
      timezone: 'UTC',
      locale: 'en-US',
      theme: 'light',
      notifications_enabled: false,
      two_factor_enabled: false,
    },
    permissions: [],
  },
];

export const mockAdmins = [
  {
    id: 1,
    email: 'super.admin@dreamfactory.com',
    first_name: 'Super',
    last_name: 'Admin',
    username: 'superadmin',
    is_active: true,
    is_verified: true,
    role_id: 1,
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-01-01T00:00:00Z',
    last_login_date: '2024-03-15T08:00:00Z',
    is_sys_admin: true,
    permissions: ['*'],
  },
  {
    id: 2,
    email: 'platform.admin@dreamfactory.com',
    first_name: 'Platform',
    last_name: 'Admin',
    username: 'platform.admin',
    is_active: true,
    is_verified: true,
    role_id: 2,
    created_date: '2024-01-05T10:00:00Z',
    last_modified_date: '2024-03-01T15:30:00Z',
    last_login_date: '2024-03-15T07:30:00Z',
    is_sys_admin: false,
    permissions: mockRoles[1].permissions,
  },
];

// ============================================================================
// SYSTEM CONFIGURATION MOCK DATA
// ============================================================================

export const mockSystemConfig = {
  platform: {
    name: 'DreamFactory',
    version: '5.2.1',
    build: '2024.03.15',
    edition: 'Silver',
    license_key: 'DF-SLV-XXXX-XXXX-XXXX-XXXX',
    host_os: 'Linux',
    server_type: 'Apache/2.4.41',
    php_version: '8.2.15',
    database_driver: 'mysql',
    cache_driver: 'redis',
    queue_driver: 'database',
  },
  environment: {
    app_name: 'DreamFactory Admin Interface',
    app_env: 'production',
    app_debug: false,
    app_url: 'https://admin.dreamfactory.local',
    timezone: 'UTC',
    locale: 'en',
    log_level: 'info',
    log_max_files: 30,
    session_driver: 'database',
    session_lifetime: 720,
    cache_default: 'redis',
    queue_default: 'database',
  },
  database: {
    default_connection: 'mysql',
    connections: {
      mysql: {
        driver: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'dreamfactory',
        username: 'df_admin',
        charset: 'utf8mb4',
        collation: 'utf8mb4_unicode_ci',
        prefix: 'df_',
        strict: true,
        engine: 'InnoDB',
      },
    },
  },
  security: {
    jwt_ttl: 60,
    jwt_refresh_ttl: 20160,
    jwt_algo: 'HS256',
    password_min_length: 8,
    password_require_numbers: true,
    password_require_symbols: true,
    password_require_mixed_case: true,
    session_timeout: 720,
    max_login_attempts: 5,
    lockout_duration: 900,
    two_factor_enabled: true,
    api_rate_limit: 1000,
    api_rate_limit_window: 60,
  },
  cors: {
    enabled: true,
    allowed_origins: ['*'],
    allowed_methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowed_headers: ['*'],
    exposed_headers: ['X-Total-Count', 'X-Dreamfactory-Api-Version'],
    max_age: 86400,
    supports_credentials: true,
  },
  cache: {
    default: 'redis',
    stores: {
      redis: {
        driver: 'redis',
        host: 'localhost',
        port: 6379,
        database: 0,
        prefix: 'df_cache:',
      },
      file: {
        driver: 'file',
        path: '/storage/framework/cache/data',
      },
    },
    prefix: 'df',
    default_ttl: 3600,
  },
  email: {
    default: 'smtp',
    mailers: {
      smtp: {
        transport: 'smtp',
        host: 'smtp.mailtrap.io',
        port: 587,
        encryption: 'tls',
        username: 'df_mailer',
        password: '***hidden***',
        timeout: 30,
      },
    },
    from: {
      address: 'noreply@dreamfactory.local',
      name: 'DreamFactory Admin',
    },
    templates: {
      user_invite: {
        subject: 'Welcome to DreamFactory',
        content_type: 'text/html',
        body_text: 'Welcome to DreamFactory! Click here to activate your account: {activation_link}',
        body_html: '<h1>Welcome to DreamFactory!</h1><p>Click <a href="{activation_link}">here</a> to activate your account.</p>',
      },
      password_reset: {
        subject: 'Password Reset Request',
        content_type: 'text/html',
        body_text: 'Click here to reset your password: {reset_link}',
        body_html: '<h1>Password Reset</h1><p>Click <a href="{reset_link}">here</a> to reset your password.</p>',
      },
    },
  },
  lookup_keys: {
    global: {
      'app.name': 'DreamFactory Admin Interface',
      'app.description': 'Comprehensive REST API generation platform',
      'support.email': 'support@dreamfactory.com',
      'support.phone': '+1-800-555-0199',
      'company.name': 'DreamFactory Software Inc.',
      'company.website': 'https://www.dreamfactory.com',
    },
    user_defined: {
      'custom.brand_color': '#5b39f3',
      'custom.logo_url': '/assets/img/logo.png',
      'custom.footer_text': '© 2024 DreamFactory Software Inc.',
      'api.timeout': '30000',
      'ui.page_size': '25',
    },
  },
};

// ============================================================================
// API DOCUMENTATION MOCK DATA
// ============================================================================

export const mockOpenApiSpecs = {
  mysql_production: {
    openapi: '3.0.3',
    info: {
      title: 'Production MySQL Database API',
      description: 'Auto-generated REST API for production_app database',
      version: '1.0.0',
      contact: {
        name: 'DreamFactory Support',
        email: 'support@dreamfactory.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'https://api.dreamfactory.local/api/v2',
        description: 'Production server',
      },
      {
        url: 'https://staging.dreamfactory.local/api/v2',
        description: 'Staging server',
      },
    ],
    security: [
      {
        apiKey: [],
      },
      {
        bearerAuth: [],
      },
    ],
    paths: {
      '/mysql_production/users': {
        get: {
          tags: ['Users'],
          summary: 'Retrieve users',
          description: 'Get a list of users with optional filtering and pagination',
          operationId: 'getUsers',
          parameters: [
            {
              name: 'fields',
              in: 'query',
              description: 'Comma-separated list of fields to return',
              required: false,
              schema: {
                type: 'string',
                example: 'id,email,first_name,last_name',
              },
            },
            {
              name: 'filter',
              in: 'query',
              description: 'SQL WHERE clause filter',
              required: false,
              schema: {
                type: 'string',
                example: 'is_active=true',
              },
            },
            {
              name: 'order',
              in: 'query',
              description: 'SQL ORDER BY clause',
              required: false,
              schema: {
                type: 'string',
                example: 'last_name ASC, first_name ASC',
              },
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Number of records to return',
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 1000,
                default: 25,
              },
            },
            {
              name: 'offset',
              in: 'query',
              description: 'Number of records to skip',
              required: false,
              schema: {
                type: 'integer',
                minimum: 0,
                default: 0,
              },
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
                      resource: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/User',
                        },
                      },
                      meta: {
                        $ref: '#/components/schemas/Meta',
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Bad Request',
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
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            '500': {
              description: 'Internal Server Error',
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
              apiKey: [],
            },
          ],
        },
        post: {
          tags: ['Users'],
          summary: 'Create users',
          description: 'Create one or more user records',
          operationId: 'createUsers',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    {
                      $ref: '#/components/schemas/UserCreate',
                    },
                    {
                      type: 'object',
                      properties: {
                        resource: {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/UserCreate',
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      resource: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/User',
                        },
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Bad Request',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/mysql_production/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Retrieve user by ID',
          description: 'Get a single user record by ID',
          operationId: 'getUserById',
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: 'User ID',
              required: true,
              schema: {
                type: 'integer',
                minimum: 1,
              },
            },
            {
              name: 'fields',
              in: 'query',
              description: 'Comma-separated list of fields to return',
              required: false,
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/User',
                  },
                },
              },
            },
            '404': {
              description: 'Not Found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
        put: {
          tags: ['Users'],
          summary: 'Update user',
          description: 'Update a user record by ID',
          operationId: 'updateUser',
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: 'User ID',
              required: true,
              schema: {
                type: 'integer',
                minimum: 1,
              },
            },
          ],
          requestBody: {
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
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/User',
                  },
                },
              },
            },
            '404': {
              description: 'Not Found',
            },
          },
        },
        delete: {
          tags: ['Users'],
          summary: 'Delete user',
          description: 'Delete a user record by ID',
          operationId: 'deleteUser',
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: 'User ID',
              required: true,
              schema: {
                type: 'integer',
                minimum: 1,
              },
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
                      id: {
                        type: 'integer',
                      },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'Not Found',
            },
          },
        },
      },
    },
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              readOnly: true,
              description: 'Primary key identifier',
            },
            email: {
              type: 'string',
              format: 'email',
              maxLength: 255,
              description: 'User email address',
            },
            first_name: {
              type: 'string',
              maxLength: 100,
              description: 'User first name',
            },
            last_name: {
              type: 'string',
              maxLength: 100,
              description: 'User last name',
            },
            role_id: {
              type: 'integer',
              nullable: true,
              description: 'Reference to user role',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              readOnly: true,
              description: 'Record creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              readOnly: true,
              description: 'Record last update timestamp',
            },
          },
          required: ['email', 'first_name', 'last_name'],
        },
        UserCreate: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              maxLength: 255,
            },
            first_name: {
              type: 'string',
              maxLength: 100,
            },
            last_name: {
              type: 'string',
              maxLength: 100,
            },
            role_id: {
              type: 'integer',
              nullable: true,
            },
          },
          required: ['email', 'first_name', 'last_name'],
        },
        UserUpdate: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              maxLength: 255,
            },
            first_name: {
              type: 'string',
              maxLength: 100,
            },
            last_name: {
              type: 'string',
              maxLength: 100,
            },
            role_id: {
              type: 'integer',
              nullable: true,
            },
          },
        },
        Meta: {
          type: 'object',
          properties: {
            count: {
              type: 'integer',
              description: 'Number of records in this response',
            },
            total: {
              type: 'integer',
              description: 'Total number of records available',
            },
            limit: {
              type: 'integer',
              description: 'Number of records requested',
            },
            offset: {
              type: 'integer',
              description: 'Number of records skipped',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'integer',
                  description: 'HTTP status code',
                },
                message: {
                  type: 'string',
                  description: 'Error message',
                },
                details: {
                  type: 'string',
                  description: 'Additional error details',
                },
              },
            },
          },
        },
      },
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-DreamFactory-Api-Key',
          description: 'DreamFactory API Key',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer Token',
        },
      },
    },
    tags: [
      {
        name: 'Users',
        description: 'User management operations',
      },
      {
        name: 'Roles',
        description: 'Role management operations',
      },
      {
        name: 'Products',
        description: 'Product catalog operations',
      },
    ],
  },
};

// ============================================================================
// FORM SCHEMA MOCK DATA
// ============================================================================

export const mockFormSchemas: FormSchema[] = [
  {
    id: 'database-service-form',
    title: 'Database Service Configuration',
    description: 'Configure a new database service connection',
    fields: [
      {
        id: 'name',
        name: 'name',
        type: 'text',
        label: 'Service Name',
        placeholder: 'Enter service name',
        description: 'Unique identifier for this database service',
        required: true,
        validation: {
          required: true,
          minLength: 3,
          maxLength: 50,
          pattern: '^[a-zA-Z0-9_-]+$',
        },
        grid: { xs: 12, md: 6 },
        section: 'basic',
        order: 1,
      },
      {
        id: 'label',
        name: 'label',
        type: 'text',
        label: 'Display Label',
        placeholder: 'Enter display label',
        description: 'Human-readable name for this service',
        required: false,
        validation: {
          maxLength: 100,
        },
        grid: { xs: 12, md: 6 },
        section: 'basic',
        order: 2,
      },
      {
        id: 'type',
        name: 'type',
        type: 'select',
        label: 'Database Type',
        description: 'Select the database management system',
        required: true,
        options: [
          { value: 'mysql', label: 'MySQL', description: 'MySQL 5.7+' },
          { value: 'postgresql', label: 'PostgreSQL', description: 'PostgreSQL 12+' },
          { value: 'sqlserver', label: 'SQL Server', description: 'Microsoft SQL Server 2017+' },
          { value: 'oracle', label: 'Oracle', description: 'Oracle Database 18c+' },
          { value: 'mongodb', label: 'MongoDB', description: 'MongoDB 4.4+' },
          { value: 'snowflake', label: 'Snowflake', description: 'Snowflake Data Cloud' },
        ],
        validation: {
          required: true,
        },
        grid: { xs: 12, md: 6 },
        section: 'basic',
        order: 3,
      },
      {
        id: 'description',
        name: 'description',
        type: 'textarea',
        label: 'Description',
        placeholder: 'Enter service description',
        description: 'Optional description of this service',
        required: false,
        validation: {
          maxLength: 500,
        },
        grid: { xs: 12 },
        section: 'basic',
        order: 4,
      },
      {
        id: 'host',
        name: 'config.host',
        type: 'text',
        label: 'Host',
        placeholder: 'localhost',
        description: 'Database server hostname or IP address',
        required: true,
        validation: {
          required: true,
          maxLength: 255,
        },
        grid: { xs: 12, md: 8 },
        section: 'connection',
        order: 5,
      },
      {
        id: 'port',
        name: 'config.port',
        type: 'number',
        label: 'Port',
        placeholder: '3306',
        description: 'Database server port number',
        required: false,
        validation: {
          min: 1,
          max: 65535,
        },
        grid: { xs: 12, md: 4 },
        section: 'connection',
        order: 6,
      },
      {
        id: 'database',
        name: 'config.database',
        type: 'text',
        label: 'Database Name',
        placeholder: 'my_database',
        description: 'Name of the database to connect to',
        required: true,
        validation: {
          required: true,
          maxLength: 64,
        },
        grid: { xs: 12, md: 6 },
        section: 'connection',
        order: 7,
      },
      {
        id: 'username',
        name: 'config.username',
        type: 'text',
        label: 'Username',
        placeholder: 'database_user',
        description: 'Database user account',
        required: true,
        validation: {
          required: true,
          maxLength: 64,
        },
        grid: { xs: 12, md: 6 },
        section: 'connection',
        order: 8,
      },
      {
        id: 'password',
        name: 'config.password',
        type: 'password',
        label: 'Password',
        placeholder: 'Enter password',
        description: 'Database user password',
        required: true,
        validation: {
          required: true,
          minLength: 8,
        },
        grid: { xs: 12 },
        section: 'connection',
        order: 9,
      },
      {
        id: 'ssl_enabled',
        name: 'config.ssl.enabled',
        type: 'switch',
        label: 'Enable SSL',
        description: 'Use SSL encryption for database connections',
        required: false,
        grid: { xs: 12, md: 6 },
        section: 'security',
        order: 10,
      },
      {
        id: 'ssl_mode',
        name: 'config.ssl.mode',
        type: 'select',
        label: 'SSL Mode',
        description: 'SSL connection mode',
        required: false,
        options: [
          { value: 'disable', label: 'Disable' },
          { value: 'allow', label: 'Allow' },
          { value: 'prefer', label: 'Prefer' },
          { value: 'require', label: 'Require' },
          { value: 'verify-ca', label: 'Verify CA' },
          { value: 'verify-full', label: 'Verify Full' },
        ],
        conditional: {
          conditions: [
            {
              field: 'config.ssl.enabled',
              operator: 'equals',
              value: true,
            },
          ],
          operator: 'AND',
          action: 'show',
        },
        grid: { xs: 12, md: 6 },
        section: 'security',
        order: 11,
      },
    ],
    layout: {
      type: 'tabs',
      sections: [
        {
          id: 'basic',
          title: 'Basic Information',
          description: 'Service identification and type',
          fields: ['name', 'label', 'type', 'description'],
          order: 1,
        },
        {
          id: 'connection',
          title: 'Connection Settings',
          description: 'Database connection parameters',
          fields: ['host', 'port', 'database', 'username', 'password'],
          order: 2,
        },
        {
          id: 'security',
          title: 'Security Options',
          description: 'SSL and encryption settings',
          fields: ['ssl_enabled', 'ssl_mode'],
          order: 3,
        },
      ],
    },
    validation: {
      validationMode: 'onChange',
      shouldFocusError: true,
    },
    submission: {
      method: 'POST',
      action: '/api/v2/system/service',
      enctype: 'application/json',
      onSuccess: {
        action: 'redirect',
        params: { url: '/api-connections/database' },
      },
      onError: {
        action: 'message',
      },
    },
    styling: {
      theme: 'default',
      size: 'md',
      spacing: 'md',
      borders: true,
      shadows: true,
      rounded: true,
    },
  },
];

// ============================================================================
// CONNECTION TEST MOCK DATA
// ============================================================================

export const mockConnectionTests: Record<string, ConnectionTestResult> = {
  success: {
    success: true,
    message: 'Connection successful',
    details: 'Successfully connected to database server in 245ms',
    testDuration: 245,
    timestamp: '2024-03-15T10:30:00Z',
  },
  timeout: {
    success: false,
    message: 'Connection timeout',
    details: 'Failed to connect to database server within 30 seconds',
    testDuration: 30000,
    timestamp: '2024-03-15T10:30:00Z',
    errorCode: 'CONNECTION_TIMEOUT',
  },
  auth_failure: {
    success: false,
    message: 'Authentication failed',
    details: 'Invalid username or password for database user',
    testDuration: 1200,
    timestamp: '2024-03-15T10:30:00Z',
    errorCode: 'AUTHENTICATION_FAILED',
  },
  database_not_found: {
    success: false,
    message: 'Database not found',
    details: 'The specified database does not exist on the server',
    testDuration: 800,
    timestamp: '2024-03-15T10:30:00Z',
    errorCode: 'DATABASE_NOT_FOUND',
  },
  host_unreachable: {
    success: false,
    message: 'Host unreachable',
    details: 'Cannot reach the specified database host',
    testDuration: 5000,
    timestamp: '2024-03-15T10:30:00Z',
    errorCode: 'HOST_UNREACHABLE',
  },
};

// ============================================================================
// PAGINATION AND METADATA MOCK DATA
// ============================================================================

export const mockPaginationMeta = {
  count: 25,
  total: 15420,
  limit: 25,
  offset: 0,
  page: 1,
  totalPages: 617,
  hasNextPage: true,
  hasPreviousPage: false,
};

export const mockApiResponse = <T>(data: T, meta = mockPaginationMeta) => ({
  resource: Array.isArray(data) ? data : [data],
  meta,
});

// ============================================================================
// ERROR RESPONSE MOCK DATA
// ============================================================================

export const mockErrorResponses = {
  unauthorized: {
    error: {
      code: 401,
      message: 'Unauthorized',
      details: 'Invalid or missing authentication credentials',
    },
  },
  forbidden: {
    error: {
      code: 403,
      message: 'Forbidden',
      details: 'Insufficient permissions to access this resource',
    },
  },
  notFound: {
    error: {
      code: 404,
      message: 'Not Found',
      details: 'The requested resource was not found',
    },
  },
  validationError: {
    error: {
      code: 400,
      message: 'Validation Error',
      details: 'One or more fields contain invalid data',
      validation_errors: {
        email: ['The email field is required.'],
        password: ['The password must be at least 8 characters.'],
      },
    },
  },
  serverError: {
    error: {
      code: 500,
      message: 'Internal Server Error',
      details: 'An unexpected error occurred while processing your request',
    },
  },
};

// ============================================================================
// EXPORT ALL MOCK DATA
// ============================================================================

export const mockData = {
  // Database services
  databaseServices: mockDatabaseServices,
  databaseServiceConfigs: mockDatabaseServiceConfigs,
  databaseDrivers: mockDatabaseDrivers,
  
  // Schema metadata
  schemaData: mockSchemaData,
  schemaTables: mockSchemaTables,
  schemaFields: mockSchemaFields,
  
  // User management
  users: mockUsers,
  admins: mockAdmins,
  roles: mockRoles,
  
  // System configuration
  systemConfig: mockSystemConfig,
  
  // API documentation
  openApiSpecs: mockOpenApiSpecs,
  
  // Forms
  formSchemas: mockFormSchemas,
  
  // Connection testing
  connectionTests: mockConnectionTests,
  
  // Utilities
  paginationMeta: mockPaginationMeta,
  apiResponse: mockApiResponse,
  errorResponses: mockErrorResponses,
};

export default mockData;