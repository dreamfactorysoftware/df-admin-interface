/**
 * Mock Service Worker (MSW) Handlers for API Generation Wizard
 * 
 * Comprehensive HTTP request handlers for database service operations, schema discovery,
 * endpoint configuration, and OpenAPI generation workflows. Enables realistic API 
 * simulation without backend dependencies during Vitest test execution and development.
 * 
 * Supports all F-006 API Documentation and Testing requirements with MSW integration
 * per Section 2.1 Feature Catalog and Section 4.4.2.2 Enhanced Testing Pipeline.
 * 
 * @fileoverview MSW handlers for API generation wizard testing
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, MSW 2.x, Vitest 2.1.0
 */

import { http, HttpResponse } from 'msw';
import type { DatabaseService, DatabaseDriver, ConnectionTestResult } from '../../../types/database-service';
import type { ApiResponse } from '../../../../lib/api-client';

// =============================================================================
// MOCK DATA CONSTANTS
// =============================================================================

/**
 * Mock database services for service selection testing
 */
const MOCK_DATABASE_SERVICES: DatabaseService[] = [
  {
    id: 1,
    name: 'mysql_users_db',
    label: 'MySQL Users Database',
    description: 'Main users and authentication database',
    type: 'mysql' as DatabaseDriver,
    is_active: true,
    deletable: true,
    mutable: true,
    created_date: '2024-01-15T10:30:00Z',
    last_modified_date: '2024-06-01T14:22:00Z',
    created_by_id: 1,
    last_modified_by_id: 1,
    config: {
      host: 'localhost',
      port: 3306,
      database: 'users_db',
      username: 'admin',
      options: {
        charset: 'utf8mb4',
        collation: 'utf8mb4_unicode_ci'
      }
    }
  },
  {
    id: 2,
    name: 'postgresql_inventory',
    label: 'PostgreSQL Inventory System',
    description: 'Inventory management and tracking system',
    type: 'postgresql' as DatabaseDriver,
    is_active: true,
    deletable: true,
    mutable: true,
    created_date: '2024-02-20T09:15:00Z',
    last_modified_date: '2024-05-28T16:45:00Z',
    created_by_id: 1,
    last_modified_by_id: 2,
    config: {
      host: 'localhost',
      port: 5432,
      database: 'inventory_db',
      username: 'postgres',
      options: {
        sslmode: 'prefer'
      }
    }
  },
  {
    id: 3,
    name: 'mongodb_analytics',
    label: 'MongoDB Analytics Data',
    description: 'Analytics and reporting data store',
    type: 'mongodb' as DatabaseDriver,
    is_active: true,
    deletable: false,
    mutable: true,
    created_date: '2024-03-10T11:00:00Z',
    last_modified_date: '2024-06-05T13:20:00Z',
    created_by_id: 2,
    last_modified_by_id: 2,
    config: {
      host: 'localhost',
      port: 27017,
      database: 'analytics_db',
      username: 'mongo_admin',
      options: {
        authSource: 'admin'
      }
    }
  },
  {
    id: 4,
    name: 'sqlserver_orders',
    label: 'SQL Server Orders Database',
    description: 'E-commerce orders and transactions',
    type: 'sqlserver' as DatabaseDriver,
    is_active: false,
    deletable: true,
    mutable: true,
    created_date: '2024-01-25T08:45:00Z',
    last_modified_date: '2024-04-15T12:10:00Z',
    created_by_id: 1,
    last_modified_by_id: 1,
    config: {
      host: 'sql-server.company.com',
      port: 1433,
      database: 'orders_db',
      username: 'orders_user'
    }
  },
  {
    id: 5,
    name: 'oracle_hr_system',
    label: 'Oracle HR Management',
    description: 'Human resources management system',
    type: 'oracle' as DatabaseDriver,
    is_active: true,
    deletable: true,
    mutable: true,
    created_date: '2024-04-01T07:30:00Z',
    last_modified_date: '2024-06-03T15:55:00Z',
    created_by_id: 3,
    last_modified_by_id: 3,
    config: {
      host: 'oracle.internal.com',
      port: 1521,
      database: 'hr_system',
      username: 'hr_admin',
      options: {
        service_name: 'XEPDB1'
      }
    }
  }
];

/**
 * Mock database service types for configuration
 */
const MOCK_SERVICE_TYPES = [
  {
    name: 'mysql',
    label: 'MySQL',
    description: 'MySQL Database Service',
    group: 'Database',
    singleton: false,
    dependencies: [],
    config_schema: [
      {
        name: 'host',
        label: 'Host',
        type: 'string',
        required: true,
        default: 'localhost'
      },
      {
        name: 'port',
        label: 'Port Number',
        type: 'integer',
        required: false,
        default: 3306
      },
      {
        name: 'database',
        label: 'Database',
        type: 'string',
        required: true
      },
      {
        name: 'username',
        label: 'Username',
        type: 'string',
        required: true
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        required: true
      }
    ]
  },
  {
    name: 'postgresql',
    label: 'PostgreSQL',
    description: 'PostgreSQL Database Service',
    group: 'Database',
    singleton: false,
    dependencies: [],
    config_schema: [
      {
        name: 'host',
        label: 'Host',
        type: 'string',
        required: true,
        default: 'localhost'
      },
      {
        name: 'port',
        label: 'Port Number',
        type: 'integer',
        required: false,
        default: 5432
      },
      {
        name: 'database',
        label: 'Database',
        type: 'string',
        required: true
      },
      {
        name: 'username',
        label: 'Username',
        type: 'string',
        required: true
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        required: true
      }
    ]
  },
  {
    name: 'mongodb',
    label: 'MongoDB',
    description: 'MongoDB Database Service',
    group: 'Database',
    singleton: false,
    dependencies: [],
    config_schema: [
      {
        name: 'host',
        label: 'Host',
        type: 'string',
        required: true,
        default: 'localhost'
      },
      {
        name: 'port',
        label: 'Port Number',
        type: 'integer',
        required: false,
        default: 27017
      },
      {
        name: 'database',
        label: 'Database',
        type: 'string',
        required: true
      },
      {
        name: 'username',
        label: 'Username',
        type: 'string',
        required: false
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        required: false
      }
    ]
  }
];

/**
 * Mock schema data for different database services
 */
const MOCK_SCHEMAS = {
  mysql_users_db: {
    resource: [
      {
        name: 'users',
        label: 'Users',
        plural: 'users',
        primary_key: ['id'],
        name_field: 'email',
        field: [
          {
            name: 'id',
            label: 'ID',
            type: 'integer',
            db_type: 'int(11)',
            length: 11,
            precision: 11,
            scale: 0,
            default: null,
            required: true,
            allow_null: false,
            fixed_length: false,
            supports_multibyte: false,
            auto_increment: true,
            is_primary_key: true,
            is_unique: true,
            is_index: true,
            is_foreign_key: false,
            ref_table: '',
            ref_fields: '',
            validation: null
          },
          {
            name: 'email',
            label: 'Email',
            type: 'string',
            db_type: 'varchar(255)',
            length: 255,
            precision: 255,
            scale: 0,
            default: null,
            required: true,
            allow_null: false,
            fixed_length: false,
            supports_multibyte: true,
            auto_increment: false,
            is_primary_key: false,
            is_unique: true,
            is_index: true,
            is_foreign_key: false,
            ref_table: '',
            ref_fields: '',
            validation: [
              {
                type: 'email',
                message: 'Must be a valid email address'
              }
            ]
          },
          {
            name: 'password',
            label: 'Password',
            type: 'string',
            db_type: 'varchar(255)',
            length: 255,
            precision: 255,
            scale: 0,
            default: null,
            required: true,
            allow_null: false,
            fixed_length: false,
            supports_multibyte: false,
            auto_increment: false,
            is_primary_key: false,
            is_unique: false,
            is_index: false,
            is_foreign_key: false,
            ref_table: '',
            ref_fields: '',
            validation: null
          },
          {
            name: 'first_name',
            label: 'First Name',
            type: 'string',
            db_type: 'varchar(100)',
            length: 100,
            precision: 100,
            scale: 0,
            default: null,
            required: false,
            allow_null: true,
            fixed_length: false,
            supports_multibyte: true,
            auto_increment: false,
            is_primary_key: false,
            is_unique: false,
            is_index: false,
            is_foreign_key: false,
            ref_table: '',
            ref_fields: '',
            validation: null
          },
          {
            name: 'last_name',
            label: 'Last Name',
            type: 'string',
            db_type: 'varchar(100)',
            length: 100,
            precision: 100,
            scale: 0,
            default: null,
            required: false,
            allow_null: true,
            fixed_length: false,
            supports_multibyte: true,
            auto_increment: false,
            is_primary_key: false,
            is_unique: false,
            is_index: false,
            is_foreign_key: false,
            ref_table: '',
            ref_fields: '',
            validation: null
          },
          {
            name: 'role_id',
            label: 'Role ID',
            type: 'integer',
            db_type: 'int(11)',
            length: 11,
            precision: 11,
            scale: 0,
            default: 1,
            required: false,
            allow_null: true,
            fixed_length: false,
            supports_multibyte: false,
            auto_increment: false,
            is_primary_key: false,
            is_unique: false,
            is_index: true,
            is_foreign_key: true,
            ref_table: 'roles',
            ref_fields: 'id',
            validation: null
          },
          {
            name: 'created_at',
            label: 'Created At',
            type: 'timestamp',
            db_type: 'timestamp',
            length: 0,
            precision: 0,
            scale: 0,
            default: 'CURRENT_TIMESTAMP',
            required: false,
            allow_null: false,
            fixed_length: false,
            supports_multibyte: false,
            auto_increment: false,
            is_primary_key: false,
            is_unique: false,
            is_index: false,
            is_foreign_key: false,
            ref_table: '',
            ref_fields: '',
            validation: null
          },
          {
            name: 'updated_at',
            label: 'Updated At',
            type: 'timestamp',
            db_type: 'timestamp',
            length: 0,
            precision: 0,
            scale: 0,
            default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            required: false,
            allow_null: false,
            fixed_length: false,
            supports_multibyte: false,
            auto_increment: false,
            is_primary_key: false,
            is_unique: false,
            is_index: false,
            is_foreign_key: false,
            ref_table: '',
            ref_fields: '',
            validation: null
          }
        ],
        related: [
          {
            name: 'user_profiles',
            type: 'has_one',
            ref_table: 'user_profiles',
            ref_field: 'user_id',
            field: 'id'
          },
          {
            name: 'orders',
            type: 'has_many',
            ref_table: 'orders',
            ref_field: 'user_id',
            field: 'id'
          }
        ]
      },
      {
        name: 'roles',
        label: 'Roles',
        plural: 'roles',
        primary_key: ['id'],
        name_field: 'name',
        field: [
          {
            name: 'id',
            label: 'ID',
            type: 'integer',
            db_type: 'int(11)',
            length: 11,
            precision: 11,
            scale: 0,
            default: null,
            required: true,
            allow_null: false,
            fixed_length: false,
            supports_multibyte: false,
            auto_increment: true,
            is_primary_key: true,
            is_unique: true,
            is_index: true,
            is_foreign_key: false,
            ref_table: '',
            ref_fields: '',
            validation: null
          },
          {
            name: 'name',
            label: 'Role Name',
            type: 'string',
            db_type: 'varchar(50)',
            length: 50,
            precision: 50,
            scale: 0,
            default: null,
            required: true,
            allow_null: false,
            fixed_length: false,
            supports_multibyte: true,
            auto_increment: false,
            is_primary_key: false,
            is_unique: true,
            is_index: true,
            is_foreign_key: false,
            ref_table: '',
            ref_fields: '',
            validation: null
          },
          {
            name: 'description',
            label: 'Description',
            type: 'text',
            db_type: 'text',
            length: 65535,
            precision: 65535,
            scale: 0,
            default: null,
            required: false,
            allow_null: true,
            fixed_length: false,
            supports_multibyte: true,
            auto_increment: false,
            is_primary_key: false,
            is_unique: false,
            is_index: false,
            is_foreign_key: false,
            ref_table: '',
            ref_fields: '',
            validation: null
          }
        ],
        related: [
          {
            name: 'users',
            type: 'has_many',
            ref_table: 'users',
            ref_field: 'role_id',
            field: 'id'
          }
        ]
      },
      {
        name: 'user_profiles',
        label: 'User Profiles',
        plural: 'user_profiles',
        primary_key: ['id'],
        name_field: 'display_name',
        field: [
          {
            name: 'id',
            label: 'ID',
            type: 'integer',
            db_type: 'int(11)',
            length: 11,
            precision: 11,
            scale: 0,
            default: null,
            required: true,
            allow_null: false,
            fixed_length: false,
            supports_multibyte: false,
            auto_increment: true,
            is_primary_key: true,
            is_unique: true,
            is_index: true,
            is_foreign_key: false,
            ref_table: '',
            ref_fields: '',
            validation: null
          },
          {
            name: 'user_id',
            label: 'User ID',
            type: 'integer',
            db_type: 'int(11)',
            length: 11,
            precision: 11,
            scale: 0,
            default: null,
            required: true,
            allow_null: false,
            fixed_length: false,
            supports_multibyte: false,
            auto_increment: false,
            is_primary_key: false,
            is_unique: true,
            is_index: true,
            is_foreign_key: true,
            ref_table: 'users',
            ref_fields: 'id',
            validation: null
          },
          {
            name: 'display_name',
            label: 'Display Name',
            type: 'string',
            db_type: 'varchar(150)',
            length: 150,
            precision: 150,
            scale: 0,
            default: null,
            required: false,
            allow_null: true,
            fixed_length: false,
            supports_multibyte: true,
            auto_increment: false,
            is_primary_key: false,
            is_unique: false,
            is_index: false,
            is_foreign_key: false,
            ref_table: '',
            ref_fields: '',
            validation: null
          },
          {
            name: 'bio',
            label: 'Biography',
            type: 'text',
            db_type: 'text',
            length: 65535,
            precision: 65535,
            scale: 0,
            default: null,
            required: false,
            allow_null: true,
            fixed_length: false,
            supports_multibyte: true,
            auto_increment: false,
            is_primary_key: false,
            is_unique: false,
            is_index: false,
            is_foreign_key: false,
            ref_table: '',
            ref_fields: '',
            validation: null
          }
        ],
        related: [
          {
            name: 'user',
            type: 'belongs_to',
            ref_table: 'users',
            ref_field: 'id',
            field: 'user_id'
          }
        ]
      }
    ]
  },
  postgresql_inventory: {
    resource: [
      {
        name: 'products',
        label: 'Products',
        plural: 'products',
        primary_key: ['id'],
        name_field: 'name',
        field: [
          {
            name: 'id',
            label: 'ID',
            type: 'integer',
            db_type: 'serial',
            length: 0,
            precision: 0,
            scale: 0,
            default: null,
            required: true,
            allow_null: false,
            fixed_length: false,
            supports_multibyte: false,
            auto_increment: true,
            is_primary_key: true,
            is_unique: true,
            is_index: true,
            is_foreign_key: false,
            ref_table: '',
            ref_fields: '',
            validation: null
          },
          {
            name: 'sku',
            label: 'SKU',
            type: 'string',
            db_type: 'varchar(50)',
            length: 50,
            precision: 50,
            scale: 0,
            default: null,
            required: true,
            allow_null: false,
            fixed_length: false,
            supports_multibyte: false,
            auto_increment: false,
            is_primary_key: false,
            is_unique: true,
            is_index: true,
            is_foreign_key: false,
            ref_table: '',
            ref_fields: '',
            validation: null
          },
          {
            name: 'name',
            label: 'Product Name',
            type: 'string',
            db_type: 'varchar(255)',
            length: 255,
            precision: 255,
            scale: 0,
            default: null,
            required: true,
            allow_null: false,
            fixed_length: false,
            supports_multibyte: true,
            auto_increment: false,
            is_primary_key: false,
            is_unique: false,
            is_index: false,
            is_foreign_key: false,
            ref_table: '',
            ref_fields: '',
            validation: null
          },
          {
            name: 'description',
            label: 'Description',
            type: 'text',
            db_type: 'text',
            length: 0,
            precision: 0,
            scale: 0,
            default: null,
            required: false,
            allow_null: true,
            fixed_length: false,
            supports_multibyte: true,
            auto_increment: false,
            is_primary_key: false,
            is_unique: false,
            is_index: false,
            is_foreign_key: false,
            ref_table: '',
            ref_fields: '',
            validation: null
          },
          {
            name: 'price',
            label: 'Price',
            type: 'float',
            db_type: 'decimal(10,2)',
            length: 10,
            precision: 10,
            scale: 2,
            default: null,
            required: true,
            allow_null: false,
            fixed_length: false,
            supports_multibyte: false,
            auto_increment: false,
            is_primary_key: false,
            is_unique: false,
            is_index: false,
            is_foreign_key: false,
            ref_table: '',
            ref_fields: '',
            validation: [
              {
                type: 'min_value',
                value: 0,
                message: 'Price must be greater than or equal to 0'
              }
            ]
          },
          {
            name: 'category_id',
            label: 'Category ID',
            type: 'integer',
            db_type: 'integer',
            length: 0,
            precision: 0,
            scale: 0,
            default: null,
            required: false,
            allow_null: true,
            fixed_length: false,
            supports_multibyte: false,
            auto_increment: false,
            is_primary_key: false,
            is_unique: false,
            is_index: true,
            is_foreign_key: true,
            ref_table: 'categories',
            ref_fields: 'id',
            validation: null
          }
        ],
        related: [
          {
            name: 'category',
            type: 'belongs_to',
            ref_table: 'categories',
            ref_field: 'id',
            field: 'category_id'
          },
          {
            name: 'inventory_items',
            type: 'has_many',
            ref_table: 'inventory',
            ref_field: 'product_id',
            field: 'id'
          }
        ]
      },
      {
        name: 'categories',
        label: 'Categories',
        plural: 'categories',
        primary_key: ['id'],
        name_field: 'name',
        field: [
          {
            name: 'id',
            label: 'ID',
            type: 'integer',
            db_type: 'serial',
            length: 0,
            precision: 0,
            scale: 0,
            default: null,
            required: true,
            allow_null: false,
            fixed_length: false,
            supports_multibyte: false,
            auto_increment: true,
            is_primary_key: true,
            is_unique: true,
            is_index: true,
            is_foreign_key: false,
            ref_table: '',
            ref_fields: '',
            validation: null
          },
          {
            name: 'name',
            label: 'Category Name',
            type: 'string',
            db_type: 'varchar(100)',
            length: 100,
            precision: 100,
            scale: 0,
            default: null,
            required: true,
            allow_null: false,
            fixed_length: false,
            supports_multibyte: true,
            auto_increment: false,
            is_primary_key: false,
            is_unique: true,
            is_index: true,
            is_foreign_key: false,
            ref_table: '',
            ref_fields: '',
            validation: null
          }
        ],
        related: [
          {
            name: 'products',
            type: 'has_many',
            ref_table: 'products',
            ref_field: 'category_id',
            field: 'id'
          }
        ]
      }
    ]
  }
};

/**
 * Mock roles for security configuration
 */
const MOCK_ROLES = [
  {
    id: 1,
    name: 'Admin',
    description: 'Full system administration privileges',
    is_active: true,
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-06-01T12:00:00Z'
  },
  {
    id: 2,
    name: 'Editor',
    description: 'Can create and edit content',
    is_active: true,
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-05-15T10:30:00Z'
  },
  {
    id: 3,
    name: 'Viewer',
    description: 'Read-only access to content',
    is_active: true,
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-04-20T14:15:00Z'
  },
  {
    id: 4,
    name: 'API User',
    description: 'API access only',
    is_active: true,
    created_date: '2024-02-01T08:00:00Z',
    last_modified_date: '2024-06-03T16:45:00Z'
  }
];

/**
 * Mock API keys for security configuration
 */
const MOCK_API_KEYS = [
  {
    id: 1,
    name: 'production_api_key',
    api_key: 'df_prod_abc123def456ghi789jkl012mno345pqr678',
    is_active: true,
    role_id: 4,
    user_id: 1,
    created_date: '2024-03-01T10:00:00Z',
    last_modified_date: '2024-06-01T09:30:00Z',
    expires_on: '2025-03-01T10:00:00Z'
  },
  {
    id: 2,
    name: 'development_api_key',
    api_key: 'df_dev_xyz789abc123def456ghi789jkl012mno345',
    is_active: true,
    role_id: 2,
    user_id: 2,
    created_date: '2024-04-15T14:30:00Z',
    last_modified_date: '2024-05-20T11:15:00Z',
    expires_on: '2024-12-31T23:59:59Z'
  }
];

/**
 * Mock OpenAPI specification for preview
 */
const MOCK_OPENAPI_SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'Generated Database API',
    description: 'Auto-generated REST API for database operations',
    version: '1.0.0',
    contact: {
      name: 'DreamFactory Admin',
      email: 'admin@dreamfactory.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: '/api/v2/mysql_users_db',
      description: 'MySQL Users Database API'
    }
  ],
  paths: {
    '/users': {
      get: {
        summary: 'Retrieve users',
        description: 'Get a list of users with optional filtering and pagination',
        operationId: 'getUsers',
        tags: ['Users'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Number of records to return',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 1000,
              default: 25
            }
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of records to skip',
            schema: {
              type: 'integer',
              minimum: 0,
              default: 0
            }
          },
          {
            name: 'filter',
            in: 'query',
            description: 'SQL WHERE clause filter',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'order',
            in: 'query',
            description: 'SQL ORDER BY clause',
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    resource: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/User'
                      }
                    },
                    meta: {
                      $ref: '#/components/schemas/Meta'
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        },
        security: [
          {
            apiKey: []
          },
          {
            bearerAuth: []
          }
        ]
      },
      post: {
        summary: 'Create user',
        description: 'Create a new user record',
        operationId: 'createUser',
        tags: ['Users'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  resource: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/UserInput'
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    resource: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/User'
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        },
        security: [
          {
            apiKey: []
          },
          {
            bearerAuth: []
          }
        ]
      }
    },
    '/users/{id}': {
      get: {
        summary: 'Get user by ID',
        description: 'Retrieve a specific user by their ID',
        operationId: 'getUserById',
        tags: ['Users'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: {
              type: 'integer'
            }
          }
        ],
        responses: {
          '200': {
            description: 'User found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        },
        security: [
          {
            apiKey: []
          },
          {
            bearerAuth: []
          }
        ]
      },
      put: {
        summary: 'Update user',
        description: 'Update an existing user record',
        operationId: 'updateUser',
        tags: ['Users'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: {
              type: 'integer'
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserInput'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'User updated successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        },
        security: [
          {
            apiKey: []
          },
          {
            bearerAuth: []
          }
        ]
      },
      delete: {
        summary: 'Delete user',
        description: 'Delete a user record',
        operationId: 'deleteUser',
        tags: ['Users'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: {
              type: 'integer'
            }
          }
        ],
        responses: {
          '200': {
            description: 'User deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'integer'
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        },
        security: [
          {
            apiKey: []
          },
          {
            bearerAuth: []
          }
        ]
      }
    }
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'User ID',
            example: 1
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com'
          },
          first_name: {
            type: 'string',
            description: 'User first name',
            example: 'John'
          },
          last_name: {
            type: 'string',
            description: 'User last name',
            example: 'Doe'
          },
          role_id: {
            type: 'integer',
            description: 'User role ID',
            example: 2
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
            example: '2024-01-15T10:30:00Z'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
            example: '2024-06-01T14:22:00Z'
          }
        },
        required: ['id', 'email', 'created_at', 'updated_at']
      },
      UserInput: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com'
          },
          password: {
            type: 'string',
            description: 'User password',
            minLength: 8,
            example: 'securePassword123'
          },
          first_name: {
            type: 'string',
            description: 'User first name',
            example: 'John'
          },
          last_name: {
            type: 'string',
            description: 'User last name',
            example: 'Doe'
          },
          role_id: {
            type: 'integer',
            description: 'User role ID',
            example: 2
          }
        },
        required: ['email', 'password']
      },
      Meta: {
        type: 'object',
        properties: {
          count: {
            type: 'integer',
            description: 'Total number of records'
          },
          schema: {
            type: 'array',
            description: 'Field schema information'
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'integer',
                description: 'Error code'
              },
              message: {
                type: 'string',
                description: 'Error message'
              },
              details: {
                type: 'object',
                description: 'Additional error details'
              }
            }
          }
        }
      }
    },
    securitySchemes: {
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-DreamFactory-API-Key'
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  tags: [
    {
      name: 'Users',
      description: 'User management operations'
    }
  ]
};

/**
 * Utility function to simulate network delay for realistic testing
 */
const simulateNetworkDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Utility function to create error responses
 */
const createErrorResponse = (code: number, message: string, details?: any): ApiResponse => ({
  error: {
    code,
    message,
    details
  }
});

/**
 * Utility function to create success responses
 */
const createSuccessResponse = <T>(data: T, metadata?: any): ApiResponse<T> => ({
  data,
  resource: data,
  success: true,
  ...(metadata && { meta: metadata })
});

// =============================================================================
// DATABASE SERVICE MANAGEMENT HANDLERS (F-001)
// =============================================================================

/**
 * Get list of database services
 * Supports filtering by active status and database type
 */
const getServicesHandler = http.get('/api/v2/system/service', async ({ request }) => {
  await simulateNetworkDelay(300);

  const url = new URL(request.url);
  const filterParam = url.searchParams.get('filter');
  const limitParam = url.searchParams.get('limit');
  const offsetParam = url.searchParams.get('offset');

  let filteredServices = [...MOCK_DATABASE_SERVICES];

  // Apply filters if provided
  if (filterParam) {
    try {
      // Simple filter parsing for common cases
      if (filterParam.includes('is_active=true')) {
        filteredServices = filteredServices.filter(service => service.is_active);
      }
      if (filterParam.includes('is_active=false')) {
        filteredServices = filteredServices.filter(service => !service.is_active);
      }
      
      // Filter by database type
      const typeMatch = filterParam.match(/type='([^']+)'/);
      if (typeMatch) {
        const type = typeMatch[1];
        filteredServices = filteredServices.filter(service => service.type === type);
      }
    } catch (error) {
      return HttpResponse.json(
        createErrorResponse(400, 'Invalid filter syntax', { filter: filterParam }),
        { status: 400 }
      );
    }
  }

  // Apply pagination
  const limit = limitParam ? parseInt(limitParam, 10) : 25;
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
  
  const paginatedServices = filteredServices.slice(offset, offset + limit);

  return HttpResponse.json(
    createSuccessResponse(paginatedServices, {
      count: filteredServices.length,
      schema: [
        { name: 'id', type: 'integer', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'label', type: 'string', required: false },
        { name: 'description', type: 'string', required: false },
        { name: 'type', type: 'string', required: true },
        { name: 'is_active', type: 'boolean', required: true }
      ]
    }),
    { status: 200 }
  );
});

/**
 * Get specific database service by ID
 */
const getServiceByIdHandler = http.get('/api/v2/system/service/:id', async ({ params }) => {
  await simulateNetworkDelay(200);

  const serviceId = parseInt(params.id as string, 10);
  if (isNaN(serviceId)) {
    return HttpResponse.json(
      createErrorResponse(400, 'Invalid service ID'),
      { status: 400 }
    );
  }

  const service = MOCK_DATABASE_SERVICES.find(s => s.id === serviceId);
  if (!service) {
    return HttpResponse.json(
      createErrorResponse(404, `Service with ID ${serviceId} not found`),
      { status: 404 }
    );
  }

  return HttpResponse.json(createSuccessResponse(service), { status: 200 });
});

/**
 * Create new database service
 */
const createServiceHandler = http.post('/api/v2/system/service', async ({ request }) => {
  await simulateNetworkDelay(800);

  try {
    const body = await request.json() as any;
    const serviceData = body.resource?.[0] || body;

    // Basic validation
    if (!serviceData.name || !serviceData.type) {
      return HttpResponse.json(
        createErrorResponse(400, 'Missing required fields: name and type'),
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existingService = MOCK_DATABASE_SERVICES.find(s => s.name === serviceData.name);
    if (existingService) {
      return HttpResponse.json(
        createErrorResponse(409, `Service with name '${serviceData.name}' already exists`),
        { status: 409 }
      );
    }

    // Create new service
    const newService: DatabaseService = {
      id: Math.max(...MOCK_DATABASE_SERVICES.map(s => s.id)) + 1,
      name: serviceData.name,
      label: serviceData.label || serviceData.name,
      description: serviceData.description || '',
      type: serviceData.type as DatabaseDriver,
      is_active: serviceData.is_active !== undefined ? serviceData.is_active : true,
      deletable: true,
      mutable: true,
      created_date: new Date().toISOString(),
      last_modified_date: new Date().toISOString(),
      created_by_id: 1,
      last_modified_by_id: 1,
      config: serviceData.config || {}
    };

    // Add to mock data (in real implementation, this would be persisted)
    MOCK_DATABASE_SERVICES.push(newService);

    return HttpResponse.json(
      createSuccessResponse([newService]),
      { status: 201 }
    );
  } catch (error) {
    return HttpResponse.json(
      createErrorResponse(400, 'Invalid request body'),
      { status: 400 }
    );
  }
});

/**
 * Update existing database service
 */
const updateServiceHandler = http.patch('/api/v2/system/service/:id', async ({ params, request }) => {
  await simulateNetworkDelay(600);

  const serviceId = parseInt(params.id as string, 10);
  if (isNaN(serviceId)) {
    return HttpResponse.json(
      createErrorResponse(400, 'Invalid service ID'),
      { status: 400 }
    );
  }

  const serviceIndex = MOCK_DATABASE_SERVICES.findIndex(s => s.id === serviceId);
  if (serviceIndex === -1) {
    return HttpResponse.json(
      createErrorResponse(404, `Service with ID ${serviceId} not found`),
      { status: 404 }
    );
  }

  try {
    const body = await request.json() as any;
    const updateData = body.resource?.[0] || body;

    // Update service
    const updatedService = {
      ...MOCK_DATABASE_SERVICES[serviceIndex],
      ...updateData,
      id: serviceId, // Prevent ID changes
      last_modified_date: new Date().toISOString(),
      last_modified_by_id: 1
    };

    MOCK_DATABASE_SERVICES[serviceIndex] = updatedService;

    return HttpResponse.json(
      createSuccessResponse([updatedService]),
      { status: 200 }
    );
  } catch (error) {
    return HttpResponse.json(
      createErrorResponse(400, 'Invalid request body'),
      { status: 400 }
    );
  }
});

/**
 * Delete database service
 */
const deleteServiceHandler = http.delete('/api/v2/system/service/:id', async ({ params }) => {
  await simulateNetworkDelay(400);

  const serviceId = parseInt(params.id as string, 10);
  if (isNaN(serviceId)) {
    return HttpResponse.json(
      createErrorResponse(400, 'Invalid service ID'),
      { status: 400 }
    );
  }

  const serviceIndex = MOCK_DATABASE_SERVICES.findIndex(s => s.id === serviceId);
  if (serviceIndex === -1) {
    return HttpResponse.json(
      createErrorResponse(404, `Service with ID ${serviceId} not found`),
      { status: 404 }
    );
  }

  const service = MOCK_DATABASE_SERVICES[serviceIndex];
  if (!service.deletable) {
    return HttpResponse.json(
      createErrorResponse(403, 'This service cannot be deleted'),
      { status: 403 }
    );
  }

  // Remove service from mock data
  MOCK_DATABASE_SERVICES.splice(serviceIndex, 1);

  return HttpResponse.json(
    createSuccessResponse({ id: serviceId }),
    { status: 200 }
  );
});

/**
 * Test database connection
 */
const testConnectionHandler = http.post('/api/v2/system/service/_test', async ({ request }) => {
  await simulateNetworkDelay(2000); // Simulate longer connection test time

  try {
    const body = await request.json() as any;
    const connectionConfig = body.resource?.[0] || body;

    // Basic validation
    if (!connectionConfig.type || !connectionConfig.config) {
      return HttpResponse.json(
        createErrorResponse(400, 'Missing required fields: type and config'),
        { status: 400 }
      );
    }

    const { type, config } = connectionConfig;

    // Simulate different connection test scenarios
    const shouldSimulateError = Math.random() < 0.1; // 10% chance of error
    if (shouldSimulateError) {
      const testResult: ConnectionTestResult = {
        success: false,
        message: 'Connection failed: Unable to connect to database server',
        details: {
          error_code: 'ECONNREFUSED',
          error_message: 'Connection refused by server',
          host: config.host || 'localhost',
          port: config.port || 3306,
          database: config.database || 'unknown'
        },
        test_duration: 2.5
      };

      return HttpResponse.json(createSuccessResponse(testResult), { status: 200 });
    }

    // Simulate successful connection
    const testResult: ConnectionTestResult = {
      success: true,
      message: 'Connection test successful',
      details: {
        server_version: type === 'mysql' ? '8.0.35' : 
                      type === 'postgresql' ? '15.4' :
                      type === 'mongodb' ? '7.0.2' :
                      type === 'sqlserver' ? '2022' :
                      type === 'oracle' ? '19c' : '1.0.0',
        host: config.host || 'localhost',
        port: config.port || (type === 'mysql' ? 3306 : 
                             type === 'postgresql' ? 5432 :
                             type === 'mongodb' ? 27017 : 1433),
        database: config.database || 'test_db',
        connection_time: Math.random() * 1000 + 500 // 500-1500ms
      },
      test_duration: 1.8
    };

    return HttpResponse.json(createSuccessResponse(testResult), { status: 200 });
  } catch (error) {
    return HttpResponse.json(
      createErrorResponse(400, 'Invalid connection test request'),
      { status: 400 }
    );
  }
});

/**
 * Get available service types
 */
const getServiceTypesHandler = http.get('/api/v2/system/service_type', async () => {
  await simulateNetworkDelay(200);

  return HttpResponse.json(
    createSuccessResponse(MOCK_SERVICE_TYPES),
    { status: 200 }
  );
});

// =============================================================================
// SCHEMA DISCOVERY HANDLERS (F-002)
// =============================================================================

/**
 * Get database schema for a service
 */
const getSchemaHandler = http.get('/api/v2/:serviceName/_schema', async ({ params, request }) => {
  await simulateNetworkDelay(800);

  const serviceName = params.serviceName as string;
  const url = new URL(request.url);
  const refresh = url.searchParams.get('refresh') === 'true';

  // Find service by name
  const service = MOCK_DATABASE_SERVICES.find(s => s.name === serviceName);
  if (!service) {
    return HttpResponse.json(
      createErrorResponse(404, `Service '${serviceName}' not found`),
      { status: 404 }
    );
  }

  if (!service.is_active) {
    return HttpResponse.json(
      createErrorResponse(503, `Service '${serviceName}' is not active`),
      { status: 503 }
    );
  }

  // Get mock schema data
  const schemaData = MOCK_SCHEMAS[serviceName as keyof typeof MOCK_SCHEMAS];
  if (!schemaData) {
    // Return empty schema for services without mock data
    return HttpResponse.json(
      createSuccessResponse({ resource: [] }),
      { status: 200 }
    );
  }

  return HttpResponse.json(createSuccessResponse(schemaData), { status: 200 });
});

/**
 * Get specific table schema
 */
const getTableSchemaHandler = http.get('/api/v2/:serviceName/_schema/:tableName', async ({ params }) => {
  await simulateNetworkDelay(400);

  const serviceName = params.serviceName as string;
  const tableName = params.tableName as string;

  // Find service by name
  const service = MOCK_DATABASE_SERVICES.find(s => s.name === serviceName);
  if (!service) {
    return HttpResponse.json(
      createErrorResponse(404, `Service '${serviceName}' not found`),
      { status: 404 }
    );
  }

  if (!service.is_active) {
    return HttpResponse.json(
      createErrorResponse(503, `Service '${serviceName}' is not active`),
      { status: 503 }
    );
  }

  // Get schema data and find table
  const schemaData = MOCK_SCHEMAS[serviceName as keyof typeof MOCK_SCHEMAS];
  if (!schemaData) {
    return HttpResponse.json(
      createErrorResponse(404, `Schema for service '${serviceName}' not found`),
      { status: 404 }
    );
  }

  const table = schemaData.resource.find(t => t.name === tableName);
  if (!table) {
    return HttpResponse.json(
      createErrorResponse(404, `Table '${tableName}' not found in service '${serviceName}'`),
      { status: 404 }
    );
  }

  return HttpResponse.json(createSuccessResponse(table), { status: 200 });
});

// =============================================================================
// API GENERATION HANDLERS (F-003)
// =============================================================================

/**
 * Generate API endpoints for a service
 */
const generateApiHandler = http.post('/api/v2/system/service/:id/generate', async ({ params, request }) => {
  await simulateNetworkDelay(3000); // Simulate longer generation time

  const serviceId = parseInt(params.id as string, 10);
  if (isNaN(serviceId)) {
    return HttpResponse.json(
      createErrorResponse(400, 'Invalid service ID'),
      { status: 400 }
    );
  }

  const service = MOCK_DATABASE_SERVICES.find(s => s.id === serviceId);
  if (!service) {
    return HttpResponse.json(
      createErrorResponse(404, `Service with ID ${serviceId} not found`),
      { status: 404 }
    );
  }

  try {
    const body = await request.json() as any;
    const generationConfig = body.resource?.[0] || body;

    // Simulate generation process
    const generationResult = {
      success: true,
      message: 'API endpoints generated successfully',
      service_info: {
        service_id: serviceId,
        service_name: service.name,
        service_url: `/api/v2/${service.name}`,
        version: '1.0.0',
        status: 'active',
        created_at: new Date().toISOString()
      },
      endpoints: [
        {
          id: 'get_users',
          url: `/api/v2/${service.name}/users`,
          method: 'GET',
          description: 'Retrieve users with optional filtering and pagination',
          table: 'users',
          status: 'active',
          security: ['api_key'],
          parameters: [
            { name: 'limit', type: 'integer', location: 'query', required: false },
            { name: 'offset', type: 'integer', location: 'query', required: false },
            { name: 'filter', type: 'string', location: 'query', required: false }
          ]
        },
        {
          id: 'post_users',
          url: `/api/v2/${service.name}/users`,
          method: 'POST',
          description: 'Create new user records',
          table: 'users',
          status: 'active',
          security: ['api_key'],
          parameters: [
            { name: 'resource', type: 'array', location: 'body', required: true }
          ]
        },
        {
          id: 'get_user_by_id',
          url: `/api/v2/${service.name}/users/{id}`,
          method: 'GET',
          description: 'Retrieve specific user by ID',
          table: 'users',
          status: 'active',
          security: ['api_key'],
          parameters: [
            { name: 'id', type: 'integer', location: 'path', required: true }
          ]
        }
      ],
      schemas: [
        {
          id: 'User',
          name: 'User',
          type: 'object',
          properties: [
            { name: 'id', type: 'integer', required: true },
            { name: 'email', type: 'string', required: true },
            { name: 'first_name', type: 'string', required: false },
            { name: 'last_name', type: 'string', required: false },
            { name: 'role_id', type: 'integer', required: false }
          ],
          required: ['id', 'email']
        }
      ],
      security_configurations: [
        {
          type: 'authentication',
          name: 'API Key Authentication',
          description: 'Requires valid API key in X-DreamFactory-API-Key header',
          endpoints: ['get_users', 'post_users', 'get_user_by_id'],
          status: 'applied'
        }
      ],
      statistics: {
        total_endpoints: 3,
        endpoints_by_method: {
          GET: 2,
          POST: 1,
          PUT: 0,
          PATCH: 0,
          DELETE: 0,
          HEAD: 0,
          OPTIONS: 0
        },
        endpoints_by_table: {
          users: 3
        },
        total_schemas: 1,
        total_security_rules: 1,
        generation_time: 2800,
        estimated_api_size: '2.1 KB'
      },
      next_steps: [
        {
          id: 'test_endpoints',
          title: 'Test Generated Endpoints',
          description: 'Use the API documentation to test your newly generated endpoints',
          category: 'testing',
          priority: 'high',
          effort: 'low',
          action_url: `/api-docs/${service.name}`,
          action_text: 'Open API Documentation'
        },
        {
          id: 'configure_security',
          title: 'Configure Advanced Security',
          description: 'Set up role-based access control and additional security rules',
          category: 'security',
          priority: 'medium',
          effort: 'medium'
        }
      ]
    };

    return HttpResponse.json(createSuccessResponse(generationResult), { status: 201 });
  } catch (error) {
    return HttpResponse.json(
      createErrorResponse(400, 'Invalid generation configuration'),
      { status: 400 }
    );
  }
});

/**
 * Get OpenAPI specification for a service
 */
const getOpenApiSpecHandler = http.get('/api/v2/:serviceName/_openapi', async ({ params }) => {
  await simulateNetworkDelay(600);

  const serviceName = params.serviceName as string;

  // Find service by name
  const service = MOCK_DATABASE_SERVICES.find(s => s.name === serviceName);
  if (!service) {
    return HttpResponse.json(
      createErrorResponse(404, `Service '${serviceName}' not found`),
      { status: 404 }
    );
  }

  // Return mock OpenAPI spec with service-specific modifications
  const serviceSpec = {
    ...MOCK_OPENAPI_SPEC,
    info: {
      ...MOCK_OPENAPI_SPEC.info,
      title: `${service.label || service.name} API`,
      description: service.description || `Auto-generated REST API for ${service.name}`
    },
    servers: [
      {
        url: `/api/v2/${serviceName}`,
        description: `${service.label || service.name} Database API`
      }
    ]
  };

  return HttpResponse.json(createSuccessResponse(serviceSpec), { status: 200 });
});

/**
 * Preview API generation configuration
 */
const previewGenerationHandler = http.post('/api/v2/system/service/:id/preview', async ({ params, request }) => {
  await simulateNetworkDelay(1500);

  const serviceId = parseInt(params.id as string, 10);
  if (isNaN(serviceId)) {
    return HttpResponse.json(
      createErrorResponse(400, 'Invalid service ID'),
      { status: 400 }
    );
  }

  const service = MOCK_DATABASE_SERVICES.find(s => s.id === serviceId);
  if (!service) {
    return HttpResponse.json(
      createErrorResponse(404, `Service with ID ${serviceId} not found`),
      { status: 404 }
    );
  }

  try {
    const body = await request.json() as any;
    const previewConfig = body.resource?.[0] || body;

    const previewResult = {
      endpoint_summaries: [
        {
          path: `/api/v2/${service.name}/users`,
          method: 'GET' as const,
          description: 'Retrieve users with filtering and pagination',
          table: 'users',
          operation_type: 'read' as const,
          parameters: [
            {
              name: 'limit',
              location: 'query' as const,
              type: 'integer',
              required: false,
              description: 'Number of records to return'
            },
            {
              name: 'filter',
              location: 'query' as const,
              type: 'string',
              required: false,
              description: 'SQL WHERE clause filter'
            }
          ],
          response_schema: {
            type: 'object' as const,
            properties: [
              { name: 'resource', type: 'array', required: true, description: 'Array of user objects' },
              { name: 'meta', type: 'object', required: false, description: 'Response metadata' }
            ],
            description: 'Users list response'
          },
          security: ['api_key'],
          tags: ['Users'],
          enabled: true,
          estimated_response_time: 150,
          complexity_score: 3
        }
      ],
      openapi_spec: MOCK_OPENAPI_SPEC,
      code_samples: [
        {
          language: 'javascript',
          title: 'Fetch Users with JavaScript',
          code: `fetch('/api/v2/${service.name}/users?limit=10', {
  method: 'GET',
  headers: {
    'X-DreamFactory-API-Key': 'your-api-key-here',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`,
          description: 'Basic example of fetching users using the Fetch API',
          endpoint: `/api/v2/${service.name}/users`,
          method: 'GET' as const,
          category: 'request' as const,
          complexity: 'basic' as const
        },
        {
          language: 'python',
          title: 'Create User with Python',
          code: `import requests

url = '/api/v2/${service.name}/users'
headers = {
    'X-DreamFactory-API-Key': 'your-api-key-here',
    'Content-Type': 'application/json'
}
data = {
    'resource': [{
        'email': 'john.doe@example.com',
        'first_name': 'John',
        'last_name': 'Doe',
        'password': 'securePassword123'
    }]
}

response = requests.post(url, json=data, headers=headers)
print(response.json())`,
          description: 'Example of creating a new user using Python requests',
          endpoint: `/api/v2/${service.name}/users`,
          method: 'POST' as const,
          category: 'request' as const,
          complexity: 'intermediate' as const
        },
        {
          language: 'curl',
          title: 'Get User by ID with cURL',
          code: `curl -X GET '/api/v2/${service.name}/users/1' \\
  -H 'X-DreamFactory-API-Key: your-api-key-here' \\
  -H 'Content-Type: application/json'`,
          description: 'Retrieve a specific user by ID using cURL',
          endpoint: `/api/v2/${service.name}/users/{id}`,
          method: 'GET' as const,
          category: 'request' as const,
          complexity: 'basic' as const
        }
      ],
      security_summary: {
        authentication_methods: ['api_key'],
        authorization_model: 'rbac',
        secured_endpoints: 3,
        public_endpoints: 0,
        security_score: 85,
        recommendations: [
          {
            id: 'enable_https',
            title: 'Enable HTTPS Only',
            description: 'Configure the API to only accept HTTPS connections for enhanced security',
            priority: 'high' as const,
            category: 'encryption' as const,
            effort: 'low' as const
          },
          {
            id: 'rate_limiting',
            title: 'Implement Rate Limiting',
            description: 'Add rate limiting to prevent abuse and ensure fair usage',
            priority: 'medium' as const,
            category: 'general' as const,
            effort: 'medium' as const
          }
        ],
        compliance: [
          {
            standard: 'OWASP API Security Top 10',
            status: 'partial' as const,
            score: 75,
            required_actions: ['Implement proper authentication', 'Add input validation']
          }
        ]
      },
      performance_estimations: [
        {
          target: 'GET /users',
          response_time: 150,
          throughput: 500,
          memory_usage: 2.5,
          cpu_usage: 15,
          database_queries: 1,
          cache_hit_ratio: 0.8,
          recommendations: [
            {
              type: 'caching' as const,
              description: 'Enable query result caching for frequently accessed data',
              expected_improvement: '50% faster response times',
              complexity: 'low' as const
            }
          ]
        }
      ],
      validation_results: [
        {
          target: 'endpoint_configuration',
          type: 'syntax' as const,
          success: true,
          issues: [],
          timestamp: new Date().toISOString()
        },
        {
          target: 'security_configuration',
          type: 'security' as const,
          success: true,
          issues: [
            {
              code: 'SECURITY_001',
              message: 'Consider enabling HTTPS-only mode',
              severity: 'warning' as const,
              location: 'global_settings',
              suggested_fix: 'Set httpsOnly: true in global configuration'
            }
          ],
          timestamp: new Date().toISOString()
        }
      ],
      statistics: {
        total_endpoints: 3,
        endpoints_by_method: {
          GET: 2,
          POST: 1,
          PUT: 0,
          PATCH: 0,
          DELETE: 0,
          HEAD: 0,
          OPTIONS: 0
        },
        endpoints_by_table: {
          users: 3
        },
        total_schemas: 1,
        total_security_rules: 1,
        generation_time: 1200,
        estimated_api_size: '1.8 KB',
        complexity_metrics: {
          overall_score: 3.5,
          schema_complexity: 2.0,
          endpoint_complexity: 4.0,
          security_complexity: 5.0,
          maintainability_score: 8.5
        }
      }
    };

    return HttpResponse.json(createSuccessResponse(previewResult), { status: 200 });
  } catch (error) {
    return HttpResponse.json(
      createErrorResponse(400, 'Invalid preview configuration'),
      { status: 400 }
    );
  }
});

// =============================================================================
// SECURITY CONFIGURATION HANDLERS (F-004)
// =============================================================================

/**
 * Get list of roles
 */
const getRolesHandler = http.get('/api/v2/system/role', async ({ request }) => {
  await simulateNetworkDelay(300);

  const url = new URL(request.url);
  const filterParam = url.searchParams.get('filter');
  
  let filteredRoles = [...MOCK_ROLES];

  // Apply filters if provided
  if (filterParam) {
    if (filterParam.includes('is_active=true')) {
      filteredRoles = filteredRoles.filter(role => role.is_active);
    }
  }

  return HttpResponse.json(
    createSuccessResponse(filteredRoles, {
      count: filteredRoles.length,
      schema: [
        { name: 'id', type: 'integer', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'description', type: 'string', required: false },
        { name: 'is_active', type: 'boolean', required: true }
      ]
    }),
    { status: 200 }
  );
});

/**
 * Create new role
 */
const createRoleHandler = http.post('/api/v2/system/role', async ({ request }) => {
  await simulateNetworkDelay(500);

  try {
    const body = await request.json() as any;
    const roleData = body.resource?.[0] || body;

    // Basic validation
    if (!roleData.name) {
      return HttpResponse.json(
        createErrorResponse(400, 'Missing required field: name'),
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existingRole = MOCK_ROLES.find(r => r.name === roleData.name);
    if (existingRole) {
      return HttpResponse.json(
        createErrorResponse(409, `Role with name '${roleData.name}' already exists`),
        { status: 409 }
      );
    }

    // Create new role
    const newRole = {
      id: Math.max(...MOCK_ROLES.map(r => r.id)) + 1,
      name: roleData.name,
      description: roleData.description || '',
      is_active: roleData.is_active !== undefined ? roleData.is_active : true,
      created_date: new Date().toISOString(),
      last_modified_date: new Date().toISOString()
    };

    MOCK_ROLES.push(newRole);

    return HttpResponse.json(
      createSuccessResponse([newRole]),
      { status: 201 }
    );
  } catch (error) {
    return HttpResponse.json(
      createErrorResponse(400, 'Invalid request body'),
      { status: 400 }
    );
  }
});

/**
 * Get list of API keys
 */
const getApiKeysHandler = http.get('/api/v2/system/api_key', async ({ request }) => {
  await simulateNetworkDelay(300);

  const url = new URL(request.url);
  const filterParam = url.searchParams.get('filter');
  
  let filteredKeys = [...MOCK_API_KEYS];

  // Apply filters if provided
  if (filterParam) {
    if (filterParam.includes('is_active=true')) {
      filteredKeys = filteredKeys.filter(key => key.is_active);
    }
  }

  return HttpResponse.json(
    createSuccessResponse(filteredKeys, {
      count: filteredKeys.length,
      schema: [
        { name: 'id', type: 'integer', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'api_key', type: 'string', required: true },
        { name: 'is_active', type: 'boolean', required: true },
        { name: 'role_id', type: 'integer', required: false }
      ]
    }),
    { status: 200 }
  );
});

/**
 * Create new API key
 */
const createApiKeyHandler = http.post('/api/v2/system/api_key', async ({ request }) => {
  await simulateNetworkDelay(700);

  try {
    const body = await request.json() as any;
    const keyData = body.resource?.[0] || body;

    // Basic validation
    if (!keyData.name) {
      return HttpResponse.json(
        createErrorResponse(400, 'Missing required field: name'),
        { status: 400 }
      );
    }

    // Generate API key
    const generateApiKey = () => {
      const prefix = 'df_';
      const randomPart = Math.random().toString(36).substring(2) + 
                        Math.random().toString(36).substring(2) +
                        Math.random().toString(36).substring(2);
      return prefix + randomPart;
    };

    // Create new API key
    const newKey = {
      id: Math.max(...MOCK_API_KEYS.map(k => k.id)) + 1,
      name: keyData.name,
      api_key: generateApiKey(),
      is_active: keyData.is_active !== undefined ? keyData.is_active : true,
      role_id: keyData.role_id || null,
      user_id: keyData.user_id || 1,
      created_date: new Date().toISOString(),
      last_modified_date: new Date().toISOString(),
      expires_on: keyData.expires_on || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
    };

    MOCK_API_KEYS.push(newKey);

    return HttpResponse.json(
      createSuccessResponse([newKey]),
      { status: 201 }
    );
  } catch (error) {
    return HttpResponse.json(
      createErrorResponse(400, 'Invalid request body'),
      { status: 400 }
    );
  }
});

// =============================================================================
// ERROR SIMULATION HANDLERS
// =============================================================================

/**
 * Simulate various error scenarios for testing error handling
 */
const errorSimulationHandler = http.post('/api/v2/_test/error/:errorType', async ({ params }) => {
  await simulateNetworkDelay(300);

  const errorType = params.errorType as string;

  switch (errorType) {
    case 'timeout':
      await simulateNetworkDelay(10000); // Simulate timeout
      return HttpResponse.json(
        createErrorResponse(408, 'Request timeout'),
        { status: 408 }
      );

    case 'server_error':
      return HttpResponse.json(
        createErrorResponse(500, 'Internal server error'),
        { status: 500 }
      );

    case 'unauthorized':
      return HttpResponse.json(
        createErrorResponse(401, 'Unauthorized access'),
        { status: 401 }
      );

    case 'forbidden':
      return HttpResponse.json(
        createErrorResponse(403, 'Access forbidden'),
        { status: 403 }
      );

    case 'rate_limit':
      return HttpResponse.json(
        createErrorResponse(429, 'Rate limit exceeded'),
        { status: 429 }
      );

    case 'validation':
      return HttpResponse.json(
        createErrorResponse(422, 'Validation failed', {
          field_errors: {
            email: ['Email is required', 'Email must be valid'],
            password: ['Password must be at least 8 characters']
          }
        }),
        { status: 422 }
      );

    default:
      return HttpResponse.json(
        createErrorResponse(400, `Unknown error type: ${errorType}`),
        { status: 400 }
      );
  }
});

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Complete array of MSW handlers for API generation wizard testing
 * 
 * Includes handlers for:
 * - Database Service Management (F-001)
 * - Schema Discovery (F-002) 
 * - API Generation (F-003)
 * - Security Configuration (F-004)
 * - Error simulation for comprehensive testing
 */
export const apiGenerationWizardHandlers = [
  // Database Service Management
  getServicesHandler,
  getServiceByIdHandler,
  createServiceHandler,
  updateServiceHandler,
  deleteServiceHandler,
  testConnectionHandler,
  getServiceTypesHandler,

  // Schema Discovery
  getSchemaHandler,
  getTableSchemaHandler,

  // API Generation
  generateApiHandler,
  getOpenApiSpecHandler,
  previewGenerationHandler,

  // Security Configuration
  getRolesHandler,
  createRoleHandler,
  getApiKeysHandler,
  createApiKeyHandler,

  // Error Simulation
  errorSimulationHandler
];

// Export individual handler groups for selective usage
export const databaseServiceHandlers = [
  getServicesHandler,
  getServiceByIdHandler,
  createServiceHandler,
  updateServiceHandler,
  deleteServiceHandler,
  testConnectionHandler,
  getServiceTypesHandler
];

export const schemaDiscoveryHandlers = [
  getSchemaHandler,
  getTableSchemaHandler
];

export const apiGenerationHandlers = [
  generateApiHandler,
  getOpenApiSpecHandler,
  previewGenerationHandler
];

export const securityConfigurationHandlers = [
  getRolesHandler,
  createRoleHandler,
  getApiKeysHandler,
  createApiKeyHandler
];

export const errorSimulationHandlers = [
  errorSimulationHandler
];

// Export mock data for use in tests
export {
  MOCK_DATABASE_SERVICES,
  MOCK_SERVICE_TYPES,
  MOCK_SCHEMAS,
  MOCK_ROLES,
  MOCK_API_KEYS,
  MOCK_OPENAPI_SPEC
};

// Export utility functions
export {
  simulateNetworkDelay,
  createErrorResponse,
  createSuccessResponse
};

// Default export
export default apiGenerationWizardHandlers;