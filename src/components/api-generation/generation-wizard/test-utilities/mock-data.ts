/**
 * Comprehensive mock data and fixtures for API generation wizard testing.
 * 
 * Provides realistic test data for unit tests, integration tests, and MSW handlers with 
 * type-safe interfaces compatible with React/Next.js integration requirements.
 * 
 * Supports:
 * - F-006: API Documentation and Testing with comprehensive OpenAPI specifications
 * - F-003: REST API Endpoint Generation wizard workflow testing
 * - Section 4.4.2.2 Enhanced Testing Pipeline with 90%+ coverage requirements
 * - React/Next.js Integration Requirements with Zod schema validator compatibility
 * 
 * Mock data patterns migrated from Angular to React/TypeScript fixtures per
 * React/Next.js Integration Requirements for optimal testing performance.
 */

import {
  WizardStep,
  HTTPMethod,
  GenerationStatus,
  ParameterType,
  FilterOperator,
  FieldType,
  ReferentialAction,
  type DatabaseTable,
  type DatabaseField,
  type ForeignKeyRelation,
  type WizardState,
  type EndpointConfiguration,
  type MethodConfiguration,
  type EndpointParameter,
  type EndpointSecurity,
  type OpenAPISpec,
  type GenerationResult,
  type TableSelectionData,
  type VirtualScrollConfig,
  type RequestSchema,
  type ResponseSchema,
  type ResponseFormatOptions,
  type APIKeyPermission,
  type RateLimitConfig,
  type CORSConfig
} from '../types';

// ============================================================================
// Database Schema Mock Data
// ============================================================================

/**
 * Mock database fields for realistic table structures
 */
export const mockDatabaseFields: DatabaseField[] = [
  {
    name: 'id',
    dbType: 'INT(11)',
    type: FieldType.INTEGER,
    isNullable: false,
    isPrimaryKey: true,
    isForeignKey: false,
    isUnique: true,
    isAutoIncrement: true,
    description: 'Primary key identifier'
  },
  {
    name: 'email',
    dbType: 'VARCHAR(255)',
    type: FieldType.STRING,
    length: 255,
    isNullable: false,
    isPrimaryKey: false,
    isForeignKey: false,
    isUnique: true,
    description: 'User email address'
  },
  {
    name: 'first_name',
    dbType: 'VARCHAR(100)',
    type: FieldType.STRING,
    length: 100,
    isNullable: false,
    isPrimaryKey: false,
    isForeignKey: false,
    isUnique: false,
    description: 'User first name'
  },
  {
    name: 'last_name',
    dbType: 'VARCHAR(100)',
    type: FieldType.STRING,
    length: 100,
    isNullable: false,
    isPrimaryKey: false,
    isForeignKey: false,
    isUnique: false,
    description: 'User last name'
  },
  {
    name: 'created_at',
    dbType: 'TIMESTAMP',
    type: FieldType.TIMESTAMP,
    isNullable: false,
    isPrimaryKey: false,
    isForeignKey: false,
    isUnique: false,
    defaultValue: 'CURRENT_TIMESTAMP',
    description: 'Record creation timestamp'
  },
  {
    name: 'updated_at',
    dbType: 'TIMESTAMP',
    type: FieldType.TIMESTAMP,
    isNullable: true,
    isPrimaryKey: false,
    isForeignKey: false,
    isUnique: false,
    description: 'Record last update timestamp'
  },
  {
    name: 'is_active',
    dbType: 'BOOLEAN',
    type: FieldType.BOOLEAN,
    isNullable: false,
    isPrimaryKey: false,
    isForeignKey: false,
    isUnique: false,
    defaultValue: true,
    description: 'User account active status'
  }
];

/**
 * Mock database fields for orders table
 */
export const mockOrderFields: DatabaseField[] = [
  {
    name: 'id',
    dbType: 'INT(11)',
    type: FieldType.INTEGER,
    isNullable: false,
    isPrimaryKey: true,
    isForeignKey: false,
    isUnique: true,
    isAutoIncrement: true,
    description: 'Order primary key'
  },
  {
    name: 'user_id',
    dbType: 'INT(11)',
    type: FieldType.INTEGER,
    isNullable: false,
    isPrimaryKey: false,
    isForeignKey: true,
    isUnique: false,
    description: 'Reference to user who placed the order'
  },
  {
    name: 'order_number',
    dbType: 'VARCHAR(50)',
    type: FieldType.STRING,
    length: 50,
    isNullable: false,
    isPrimaryKey: false,
    isForeignKey: false,
    isUnique: true,
    description: 'Unique order identifier'
  },
  {
    name: 'total_amount',
    dbType: 'DECIMAL(10,2)',
    type: FieldType.DECIMAL,
    precision: 10,
    scale: 2,
    isNullable: false,
    isPrimaryKey: false,
    isForeignKey: false,
    isUnique: false,
    description: 'Total order amount'
  },
  {
    name: 'status',
    dbType: 'ENUM("pending","processing","shipped","delivered","cancelled")',
    type: FieldType.STRING,
    isNullable: false,
    isPrimaryKey: false,
    isForeignKey: false,
    isUnique: false,
    defaultValue: 'pending',
    description: 'Order status'
  },
  {
    name: 'created_at',
    dbType: 'TIMESTAMP',
    type: FieldType.TIMESTAMP,
    isNullable: false,
    isPrimaryKey: false,
    isForeignKey: false,
    isUnique: false,
    defaultValue: 'CURRENT_TIMESTAMP',
    description: 'Order creation timestamp'
  }
];

/**
 * Mock foreign key relationships
 */
export const mockForeignKeys: ForeignKeyRelation[] = [
  {
    name: 'fk_orders_user_id',
    field: 'user_id',
    referencedTable: 'users',
    referencedField: 'id',
    onDelete: ReferentialAction.CASCADE,
    onUpdate: ReferentialAction.CASCADE
  }
];

/**
 * Mock database tables for comprehensive testing scenarios
 */
export const mockDatabaseTables: DatabaseTable[] = [
  {
    name: 'users',
    label: 'Users',
    description: 'User account information and authentication data',
    schema: 'public',
    rowCount: 15420,
    fields: mockDatabaseFields,
    primaryKey: ['id'],
    foreignKeys: [],
    selected: false,
    expanded: false,
    hasExistingAPI: false
  },
  {
    name: 'orders',
    label: 'Orders',
    description: 'Customer order information and status tracking',
    schema: 'public',
    rowCount: 45230,
    fields: mockOrderFields,
    primaryKey: ['id'],
    foreignKeys: mockForeignKeys,
    selected: false,
    expanded: false,
    hasExistingAPI: false
  },
  {
    name: 'products',
    label: 'Products',
    description: 'Product catalog with pricing and inventory data',
    schema: 'public',
    rowCount: 2340,
    fields: [
      {
        name: 'id',
        dbType: 'INT(11)',
        type: FieldType.INTEGER,
        isNullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        isUnique: true,
        isAutoIncrement: true,
        description: 'Product primary key'
      },
      {
        name: 'name',
        dbType: 'VARCHAR(200)',
        type: FieldType.STRING,
        length: 200,
        isNullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        isUnique: false,
        description: 'Product name'
      },
      {
        name: 'description',
        dbType: 'TEXT',
        type: FieldType.TEXT,
        isNullable: true,
        isPrimaryKey: false,
        isForeignKey: false,
        isUnique: false,
        description: 'Product description'
      },
      {
        name: 'price',
        dbType: 'DECIMAL(8,2)',
        type: FieldType.DECIMAL,
        precision: 8,
        scale: 2,
        isNullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        isUnique: false,
        description: 'Product price'
      },
      {
        name: 'stock_quantity',
        dbType: 'INT(11)',
        type: FieldType.INTEGER,
        isNullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        isUnique: false,
        defaultValue: 0,
        description: 'Available stock quantity'
      },
      {
        name: 'metadata',
        dbType: 'JSON',
        type: FieldType.JSON,
        isNullable: true,
        isPrimaryKey: false,
        isForeignKey: false,
        isUnique: false,
        description: 'Additional product metadata'
      }
    ],
    primaryKey: ['id'],
    foreignKeys: [],
    selected: false,
    expanded: false,
    hasExistingAPI: false
  },
  {
    name: 'categories',
    label: 'Categories',
    description: 'Product categorization and hierarchy management',
    schema: 'public',
    rowCount: 156,
    fields: [
      {
        name: 'id',
        dbType: 'INT(11)',
        type: FieldType.INTEGER,
        isNullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        isUnique: true,
        isAutoIncrement: true,
        description: 'Category primary key'
      },
      {
        name: 'parent_id',
        dbType: 'INT(11)',
        type: FieldType.INTEGER,
        isNullable: true,
        isPrimaryKey: false,
        isForeignKey: true,
        isUnique: false,
        description: 'Parent category reference'
      },
      {
        name: 'name',
        dbType: 'VARCHAR(100)',
        type: FieldType.STRING,
        length: 100,
        isNullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        isUnique: false,
        description: 'Category name'
      },
      {
        name: 'slug',
        dbType: 'VARCHAR(100)',
        type: FieldType.STRING,
        length: 100,
        isNullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        isUnique: true,
        description: 'URL-friendly category identifier'
      }
    ],
    primaryKey: ['id'],
    foreignKeys: [
      {
        name: 'fk_categories_parent_id',
        field: 'parent_id',
        referencedTable: 'categories',
        referencedField: 'id',
        onDelete: ReferentialAction.SET_NULL,
        onUpdate: ReferentialAction.CASCADE
      }
    ],
    selected: false,
    expanded: false,
    hasExistingAPI: false
  }
];

/**
 * Mock selected tables for wizard testing
 */
export const mockSelectedTables: DatabaseTable[] = [
  {
    ...mockDatabaseTables[0],
    selected: true
  },
  {
    ...mockDatabaseTables[1],
    selected: true
  }
];

/**
 * Mock large dataset for performance testing (1000+ tables scenario)
 */
export const mockLargeDataset: DatabaseTable[] = Array.from({ length: 1250 }, (_, index) => ({
  name: `table_${String(index + 1).padStart(4, '0')}`,
  label: `Table ${index + 1}`,
  description: `Generated table ${index + 1} for performance testing`,
  schema: index < 500 ? 'public' : index < 1000 ? 'analytics' : 'staging',
  rowCount: Math.floor(Math.random() * 100000) + 1000,
  fields: [
    {
      name: 'id',
      dbType: 'BIGINT',
      type: FieldType.BIGINT,
      isNullable: false,
      isPrimaryKey: true,
      isForeignKey: false,
      isUnique: true,
      isAutoIncrement: true,
      description: 'Primary key'
    },
    {
      name: 'data',
      dbType: 'TEXT',
      type: FieldType.TEXT,
      isNullable: true,
      isPrimaryKey: false,
      isForeignKey: false,
      isUnique: false,
      description: 'Data field'
    }
  ],
  primaryKey: ['id'],
  foreignKeys: [],
  selected: false,
  expanded: false,
  hasExistingAPI: Math.random() > 0.7
}));

// ============================================================================
// Wizard State Mock Data
// ============================================================================

/**
 * Mock table selection configuration
 */
export const mockTableSelectionData: TableSelectionData = {
  searchTerm: '',
  selectedTableNames: ['users', 'orders'],
  filters: [
    {
      field: 'rowCount',
      operator: FilterOperator.GREATER_THAN,
      value: 1000,
      active: false
    },
    {
      field: 'hasExistingAPI',
      operator: FilterOperator.EQUALS,
      value: false,
      active: true
    }
  ],
  virtualScrollConfig: {
    overscan: 5,
    itemHeight: 60,
    containerHeight: 400,
    enabled: true
  }
};

/**
 * Mock virtual scroll configuration
 */
export const mockVirtualScrollConfig: VirtualScrollConfig = {
  overscan: 10,
  itemHeight: 48,
  containerHeight: 600,
  enabled: true
};

/**
 * Mock endpoint parameters for testing
 */
export const mockEndpointParameters: EndpointParameter[] = [
  {
    name: 'limit',
    type: ParameterType.QUERY,
    dataType: FieldType.INTEGER,
    required: false,
    description: 'Maximum number of records to return',
    defaultValue: 25,
    validation: {
      min: 1,
      max: 1000
    }
  },
  {
    name: 'offset',
    type: ParameterType.QUERY,
    dataType: FieldType.INTEGER,
    required: false,
    description: 'Number of records to skip',
    defaultValue: 0,
    validation: {
      min: 0
    }
  },
  {
    name: 'filter',
    type: ParameterType.QUERY,
    dataType: FieldType.STRING,
    required: false,
    description: 'SQL-like filter expression',
    validation: {
      maxLength: 500
    }
  },
  {
    name: 'order',
    type: ParameterType.QUERY,
    dataType: FieldType.STRING,
    required: false,
    description: 'Sort order specification',
    allowedValues: ['id', 'email', 'created_at', '-id', '-email', '-created_at']
  }
];

/**
 * Mock security configuration
 */
export const mockEndpointSecurity: EndpointSecurity = {
  requireAuth: true,
  requiredRoles: ['user', 'admin'],
  apiKeyPermissions: [
    {
      keyId: 'api_key_1',
      allowedMethods: [HTTPMethod.GET, HTTPMethod.POST],
      ipRestrictions: ['192.168.1.0/24', '10.0.0.0/8'],
      expiresAt: new Date('2025-12-31T23:59:59Z')
    }
  ],
  rateLimiting: {
    requestsPerMinute: 100,
    requestsPerHour: 5000,
    requestsPerDay: 100000,
    burstAllowance: 10
  },
  corsConfig: {
    allowedOrigins: ['https://example.com', 'https://app.example.com'],
    allowedMethods: [HTTPMethod.GET, HTTPMethod.POST, HTTPMethod.PUT, HTTPMethod.DELETE],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    allowCredentials: true,
    maxAge: 86400
  }
};

/**
 * Mock request schema for POST/PUT operations
 */
export const mockRequestSchema: RequestSchema = {
  contentType: 'application/json',
  requiredFields: ['email', 'first_name', 'last_name'],
  optionalFields: ['is_active'],
  fieldValidations: {
    email: {
      pattern: '^[^@]+@[^@]+\\.[^@]+$',
      maxLength: 255
    },
    first_name: {
      minLength: 1,
      maxLength: 100
    },
    last_name: {
      minLength: 1,
      maxLength: 100
    }
  },
  includeAllFields: false,
  excludedFields: ['id', 'created_at', 'updated_at']
};

/**
 * Mock response schema configuration
 */
export const mockResponseSchema: ResponseSchema = {
  includedFields: ['id', 'email', 'first_name', 'last_name', 'is_active', 'created_at'],
  excludedFields: ['password_hash', 'reset_token'],
  includeMetadata: true,
  formatOptions: {
    dateFormat: 'ISO',
    timezone: 'UTC',
    includeNulls: false,
    flattenNested: false,
    fieldTransforms: {
      created_at: 'toISOString',
      updated_at: 'toISOString'
    }
  }
};

/**
 * Mock method configuration for GET operations
 */
export const mockGetMethodConfiguration: MethodConfiguration = {
  enabled: true,
  parameters: mockEndpointParameters,
  responseSchema: mockResponseSchema,
  security: mockEndpointSecurity,
  description: 'Retrieve user records with filtering and pagination',
  tags: ['users', 'authentication']
};

/**
 * Mock method configuration for POST operations
 */
export const mockPostMethodConfiguration: MethodConfiguration = {
  enabled: true,
  parameters: [],
  requestSchema: mockRequestSchema,
  responseSchema: {
    ...mockResponseSchema,
    includedFields: ['id', 'email', 'first_name', 'last_name', 'is_active', 'created_at']
  },
  security: mockEndpointSecurity,
  description: 'Create a new user account',
  tags: ['users', 'authentication']
};

/**
 * Mock endpoint configurations for wizard testing
 */
export const mockEndpointConfigurations: EndpointConfiguration[] = [
  {
    tableName: 'users',
    basePath: '/users',
    enabledMethods: [HTTPMethod.GET, HTTPMethod.POST, HTTPMethod.PUT, HTTPMethod.DELETE],
    methodConfigurations: {
      [HTTPMethod.GET]: mockGetMethodConfiguration,
      [HTTPMethod.POST]: mockPostMethodConfiguration,
      [HTTPMethod.PUT]: {
        ...mockPostMethodConfiguration,
        description: 'Update an existing user account',
        parameters: [
          {
            name: 'id',
            type: ParameterType.PATH,
            dataType: FieldType.INTEGER,
            required: true,
            description: 'User ID to update'
          }
        ]
      },
      [HTTPMethod.PATCH]: {
        ...mockPostMethodConfiguration,
        description: 'Partially update a user account',
        requestSchema: {
          ...mockRequestSchema,
          requiredFields: [],
          optionalFields: ['email', 'first_name', 'last_name', 'is_active']
        }
      },
      [HTTPMethod.DELETE]: {
        enabled: true,
        parameters: [
          {
            name: 'id',
            type: ParameterType.PATH,
            dataType: FieldType.INTEGER,
            required: true,
            description: 'User ID to delete'
          }
        ],
        responseSchema: {
          includedFields: ['success', 'message'],
          excludedFields: [],
          includeMetadata: false,
          formatOptions: {
            includeNulls: false,
            flattenNested: false,
            fieldTransforms: {}
          }
        },
        security: mockEndpointSecurity,
        description: 'Delete a user account',
        tags: ['users', 'authentication']
      }
    },
    security: mockEndpointSecurity,
    customParameters: [],
    enabled: true
  },
  {
    tableName: 'orders',
    basePath: '/orders',
    enabledMethods: [HTTPMethod.GET, HTTPMethod.POST, HTTPMethod.PUT],
    methodConfigurations: {
      [HTTPMethod.GET]: {
        enabled: true,
        parameters: [
          ...mockEndpointParameters,
          {
            name: 'status',
            type: ParameterType.QUERY,
            dataType: FieldType.STRING,
            required: false,
            description: 'Filter by order status',
            allowedValues: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
          },
          {
            name: 'user_id',
            type: ParameterType.QUERY,
            dataType: FieldType.INTEGER,
            required: false,
            description: 'Filter by user ID'
          }
        ],
        responseSchema: {
          includedFields: ['id', 'user_id', 'order_number', 'total_amount', 'status', 'created_at'],
          excludedFields: [],
          includeMetadata: true,
          formatOptions: {
            dateFormat: 'ISO',
            timezone: 'UTC',
            includeNulls: false,
            flattenNested: false,
            fieldTransforms: {
              created_at: 'toISOString',
              total_amount: 'toFixed(2)'
            }
          }
        },
        security: mockEndpointSecurity,
        description: 'Retrieve order records with filtering',
        tags: ['orders', 'e-commerce']
      },
      [HTTPMethod.POST]: {
        enabled: true,
        parameters: [],
        requestSchema: {
          contentType: 'application/json',
          requiredFields: ['user_id', 'total_amount'],
          optionalFields: ['status'],
          fieldValidations: {
            user_id: {
              min: 1
            },
            total_amount: {
              min: 0.01,
              max: 999999.99
            }
          },
          includeAllFields: false,
          excludedFields: ['id', 'order_number', 'created_at']
        },
        responseSchema: {
          includedFields: ['id', 'user_id', 'order_number', 'total_amount', 'status', 'created_at'],
          excludedFields: [],
          includeMetadata: true,
          formatOptions: {
            dateFormat: 'ISO',
            timezone: 'UTC',
            includeNulls: false,
            flattenNested: false,
            fieldTransforms: {
              created_at: 'toISOString',
              total_amount: 'toFixed(2)'
            }
          }
        },
        security: mockEndpointSecurity,
        description: 'Create a new order',
        tags: ['orders', 'e-commerce']
      },
      [HTTPMethod.PUT]: {
        enabled: true,
        parameters: [
          {
            name: 'id',
            type: ParameterType.PATH,
            dataType: FieldType.INTEGER,
            required: true,
            description: 'Order ID to update'
          }
        ],
        requestSchema: {
          contentType: 'application/json',
          requiredFields: ['status'],
          optionalFields: ['total_amount'],
          fieldValidations: {
            status: {
              pattern: '^(pending|processing|shipped|delivered|cancelled)$'
            },
            total_amount: {
              min: 0.01,
              max: 999999.99
            }
          },
          includeAllFields: false,
          excludedFields: ['id', 'user_id', 'order_number', 'created_at']
        },
        responseSchema: {
          includedFields: ['id', 'user_id', 'order_number', 'total_amount', 'status', 'created_at'],
          excludedFields: [],
          includeMetadata: true,
          formatOptions: {
            dateFormat: 'ISO',
            timezone: 'UTC',
            includeNulls: false,
            flattenNested: false,
            fieldTransforms: {
              created_at: 'toISOString',
              total_amount: 'toFixed(2)'
            }
          }
        },
        security: mockEndpointSecurity,
        description: 'Update an existing order',
        tags: ['orders', 'e-commerce']
      },
      [HTTPMethod.PATCH]: {
        enabled: false,
        parameters: [],
        responseSchema: mockResponseSchema,
        description: '',
        tags: []
      },
      [HTTPMethod.DELETE]: {
        enabled: false,
        parameters: [],
        responseSchema: mockResponseSchema,
        description: '',
        tags: []
      }
    },
    security: mockEndpointSecurity,
    customParameters: [
      {
        name: 'include_user',
        type: ParameterType.QUERY,
        dataType: FieldType.BOOLEAN,
        required: false,
        description: 'Include user information in the response',
        defaultValue: false
      }
    ],
    enabled: true
  }
];

// ============================================================================
// OpenAPI Specification Mock Data
// ============================================================================

/**
 * Mock OpenAPI specification for comprehensive testing
 * Supports F-006: API Documentation and Testing requirements
 */
export const mockOpenAPISpec: OpenAPISpec = {
  openapi: '3.0.3',
  info: {
    title: 'DreamFactory Generated API',
    version: '1.0.0',
    description: 'Auto-generated REST API for database service: test-mysql-service',
    contact: {
      name: 'DreamFactory Support',
      url: 'https://www.dreamfactory.com/support',
      email: 'support@dreamfactory.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'https://api.example.com/api/v2',
      description: 'Production server',
      variables: {
        version: {
          default: 'v2',
          description: 'API version',
          enum: ['v1', 'v2']
        }
      }
    },
    {
      url: 'https://staging-api.example.com/api/v2',
      description: 'Staging server'
    }
  ],
  paths: {
    '/test-mysql-service/users': {
      get: {
        operationId: 'getUsersList',
        summary: 'Retrieve users list',
        description: 'Retrieve user records with filtering and pagination',
        tags: ['users', 'authentication'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of records to return',
            required: false,
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
            required: false,
            schema: {
              type: 'integer',
              minimum: 0,
              default: 0
            }
          },
          {
            name: 'filter',
            in: 'query',
            description: 'SQL-like filter expression',
            required: false,
            schema: {
              type: 'string',
              maxLength: 500
            }
          },
          {
            name: 'order',
            in: 'query',
            description: 'Sort order specification',
            required: false,
            schema: {
              type: 'string',
              enum: ['id', 'email', 'created_at', '-id', '-email', '-created_at']
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
                      $ref: '#/components/schemas/PaginationMeta'
                    }
                  }
                },
                example: {
                  resource: [
                    {
                      id: 1,
                      email: 'john.doe@example.com',
                      first_name: 'John',
                      last_name: 'Doe',
                      is_active: true,
                      created_at: '2024-01-15T10:30:00Z'
                    }
                  ],
                  meta: {
                    count: 1,
                    total: 15420,
                    offset: 0,
                    limit: 25
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
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          '403': {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
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
        operationId: 'createUser',
        summary: 'Create new user',
        description: 'Create a new user account',
        tags: ['users', 'authentication'],
        requestBody: {
          description: 'User data to create',
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateUserRequest'
              },
              example: {
                email: 'jane.smith@example.com',
                first_name: 'Jane',
                last_name: 'Smith',
                is_active: true
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
                  $ref: '#/components/schemas/ValidationErrorResponse'
                }
              }
            }
          },
          '409': {
            description: 'Email already exists',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
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
    '/test-mysql-service/users/{id}': {
      get: {
        operationId: 'getUserById',
        summary: 'Get user by ID',
        description: 'Retrieve a specific user by their ID',
        tags: ['users', 'authentication'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'User ID',
            required: true,
            schema: {
              type: 'integer',
              minimum: 1
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
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      },
      put: {
        operationId: 'updateUser',
        summary: 'Update user',
        description: 'Update an existing user account',
        tags: ['users', 'authentication'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'User ID to update',
            required: true,
            schema: {
              type: 'integer',
              minimum: 1
            }
          }
        ],
        requestBody: {
          description: 'Updated user data',
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateUserRequest'
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
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      },
      delete: {
        operationId: 'deleteUser',
        summary: 'Delete user',
        description: 'Delete a user account',
        tags: ['users', 'authentication'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'User ID to delete',
            required: true,
            schema: {
              type: 'integer',
              minimum: 1
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
                    success: {
                      type: 'boolean',
                      example: true
                    },
                    message: {
                      type: 'string',
                      example: 'User deleted successfully'
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
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/test-mysql-service/orders': {
      get: {
        operationId: 'getOrdersList',
        summary: 'Retrieve orders list',
        description: 'Retrieve order records with filtering',
        tags: ['orders', 'e-commerce'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of records to return',
            required: false,
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
            required: false,
            schema: {
              type: 'integer',
              minimum: 0,
              default: 0
            }
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by order status',
            required: false,
            schema: {
              type: 'string',
              enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
            }
          },
          {
            name: 'user_id',
            in: 'query',
            description: 'Filter by user ID',
            required: false,
            schema: {
              type: 'integer',
              minimum: 1
            }
          },
          {
            name: 'include_user',
            in: 'query',
            description: 'Include user information in the response',
            required: false,
            schema: {
              type: 'boolean',
              default: false
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
                        $ref: '#/components/schemas/Order'
                      }
                    },
                    meta: {
                      $ref: '#/components/schemas/PaginationMeta'
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        operationId: 'createOrder',
        summary: 'Create new order',
        description: 'Create a new order',
        tags: ['orders', 'e-commerce'],
        requestBody: {
          description: 'Order data to create',
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateOrderRequest'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Order created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Order'
                }
              }
            }
          }
        }
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
            description: 'User unique identifier',
            example: 1
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john.doe@example.com'
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
          is_active: {
            type: 'boolean',
            description: 'User account active status',
            example: true
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
            example: '2024-01-15T10:30:00Z'
          }
        },
        required: ['id', 'email', 'first_name', 'last_name', 'is_active', 'created_at']
      },
      CreateUserRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'jane.smith@example.com'
          },
          first_name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'User first name',
            example: 'Jane'
          },
          last_name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'User last name',
            example: 'Smith'
          },
          is_active: {
            type: 'boolean',
            description: 'User account active status',
            default: true
          }
        },
        required: ['email', 'first_name', 'last_name']
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          first_name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'User first name'
          },
          last_name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'User last name'
          },
          is_active: {
            type: 'boolean',
            description: 'User account active status'
          }
        }
      },
      Order: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Order unique identifier',
            example: 1001
          },
          user_id: {
            type: 'integer',
            description: 'User who placed the order',
            example: 1
          },
          order_number: {
            type: 'string',
            description: 'Unique order identifier',
            example: 'ORD-2024-001001'
          },
          total_amount: {
            type: 'number',
            format: 'decimal',
            description: 'Total order amount',
            example: 99.99
          },
          status: {
            type: 'string',
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            description: 'Order status',
            example: 'pending'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Order creation timestamp',
            example: '2024-01-15T14:30:00Z'
          }
        },
        required: ['id', 'user_id', 'order_number', 'total_amount', 'status', 'created_at']
      },
      CreateOrderRequest: {
        type: 'object',
        properties: {
          user_id: {
            type: 'integer',
            minimum: 1,
            description: 'User ID who places the order',
            example: 1
          },
          total_amount: {
            type: 'number',
            format: 'decimal',
            minimum: 0.01,
            maximum: 999999.99,
            description: 'Total order amount',
            example: 99.99
          },
          status: {
            type: 'string',
            enum: ['pending'],
            description: 'Initial order status',
            default: 'pending'
          }
        },
        required: ['user_id', 'total_amount']
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          count: {
            type: 'integer',
            description: 'Number of records in current response',
            example: 25
          },
          total: {
            type: 'integer',
            description: 'Total number of available records',
            example: 15420
          },
          offset: {
            type: 'integer',
            description: 'Number of records skipped',
            example: 0
          },
          limit: {
            type: 'integer',
            description: 'Maximum records requested',
            example: 25
          }
        },
        required: ['count', 'total', 'offset', 'limit']
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'integer',
                description: 'Error code',
                example: 400
              },
              message: {
                type: 'string',
                description: 'Error message',
                example: 'Invalid request parameters'
              },
              context: {
                type: 'object',
                description: 'Additional error context'
              }
            },
            required: ['code', 'message']
          }
        },
        required: ['error']
      },
      ValidationErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'integer',
                description: 'Error code',
                example: 400
              },
              message: {
                type: 'string',
                description: 'Error message',
                example: 'Validation failed'
              },
              context: {
                type: 'object',
                properties: {
                  resource: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: {
                          type: 'string',
                          description: 'Field name with validation error'
                        },
                        message: {
                          type: 'string',
                          description: 'Validation error message'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    securitySchemes: {
      apiKey: {
        type: 'apiKey',
        name: 'X-DreamFactory-Api-Key',
        in: 'header',
        description: 'DreamFactory API key for authentication'
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT bearer token authentication'
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
  ],
  tags: [
    {
      name: 'users',
      description: 'User account management operations'
    },
    {
      name: 'orders',
      description: 'Order management operations'
    },
    {
      name: 'authentication',
      description: 'Authentication and authorization operations'
    },
    {
      name: 'e-commerce',
      description: 'E-commerce related operations'
    }
  ]
};

// ============================================================================
// Generation Result Mock Data
// ============================================================================

/**
 * Mock successful generation result
 */
export const mockSuccessfulGenerationResult: GenerationResult = {
  success: true,
  serviceId: 42,
  endpointUrls: [
    'https://api.example.com/api/v2/test-mysql-service/users',
    'https://api.example.com/api/v2/test-mysql-service/orders'
  ],
  openApiSpec: mockOpenAPISpec,
  statistics: {
    tablesProcessed: 2,
    endpointsGenerated: 8,
    schemasCreated: 6,
    generationDuration: 3450,
    specificationSize: 125678
  },
  warnings: [
    'Field "password_hash" in table "users" excluded from API for security',
    'Foreign key constraint "fk_orders_user_id" will be enforced on write operations'
  ],
  timestamp: new Date('2024-01-15T15:45:30Z')
};

/**
 * Mock failed generation result
 */
export const mockFailedGenerationResult: GenerationResult = {
  success: false,
  error: 'Database connection lost during generation process',
  endpointUrls: [],
  openApiSpec: mockOpenAPISpec,
  statistics: {
    tablesProcessed: 1,
    endpointsGenerated: 0,
    schemasCreated: 0,
    generationDuration: 1200,
    specificationSize: 0
  },
  warnings: [],
  timestamp: new Date('2024-01-15T15:42:15Z')
};

// ============================================================================
// Complete Wizard State Mock Data
// ============================================================================

/**
 * Mock initial wizard state
 */
export const mockInitialWizardState: WizardState = {
  currentStep: WizardStep.TABLE_SELECTION,
  loading: false,
  generationStatus: GenerationStatus.IDLE,
  serviceName: 'test-mysql-service',
  availableTables: mockDatabaseTables,
  selectedTables: [],
  endpointConfigurations: [],
  generationProgress: 0,
  validationErrors: {}
};

/**
 * Mock wizard state in table selection step
 */
export const mockTableSelectionWizardState: WizardState = {
  currentStep: WizardStep.TABLE_SELECTION,
  loading: false,
  generationStatus: GenerationStatus.CONFIGURING,
  serviceName: 'test-mysql-service',
  availableTables: mockDatabaseTables,
  selectedTables: mockSelectedTables,
  endpointConfigurations: [],
  generationProgress: 25,
  validationErrors: {}
};

/**
 * Mock wizard state in endpoint configuration step
 */
export const mockEndpointConfigurationWizardState: WizardState = {
  currentStep: WizardStep.ENDPOINT_CONFIGURATION,
  loading: false,
  generationStatus: GenerationStatus.CONFIGURING,
  serviceName: 'test-mysql-service',
  availableTables: mockDatabaseTables,
  selectedTables: mockSelectedTables,
  endpointConfigurations: mockEndpointConfigurations,
  generationProgress: 50,
  validationErrors: {}
};

/**
 * Mock wizard state in generation preview step
 */
export const mockGenerationPreviewWizardState: WizardState = {
  currentStep: WizardStep.GENERATION_PREVIEW,
  loading: false,
  generationStatus: GenerationStatus.VALIDATING,
  serviceName: 'test-mysql-service',
  availableTables: mockDatabaseTables,
  selectedTables: mockSelectedTables,
  endpointConfigurations: mockEndpointConfigurations,
  generatedSpec: mockOpenAPISpec,
  generationProgress: 75,
  validationErrors: {}
};

/**
 * Mock wizard state during generation progress
 */
export const mockGenerationProgressWizardState: WizardState = {
  currentStep: WizardStep.GENERATION_PROGRESS,
  loading: true,
  generationStatus: GenerationStatus.GENERATING,
  serviceName: 'test-mysql-service',
  availableTables: mockDatabaseTables,
  selectedTables: mockSelectedTables,
  endpointConfigurations: mockEndpointConfigurations,
  generatedSpec: mockOpenAPISpec,
  generationProgress: 85,
  validationErrors: {}
};

/**
 * Mock completed wizard state
 */
export const mockCompletedWizardState: WizardState = {
  currentStep: WizardStep.GENERATION_PROGRESS,
  loading: false,
  generationStatus: GenerationStatus.COMPLETED,
  serviceName: 'test-mysql-service',
  availableTables: mockDatabaseTables,
  selectedTables: mockSelectedTables,
  endpointConfigurations: mockEndpointConfigurations,
  generatedSpec: mockOpenAPISpec,
  generationProgress: 100,
  generationResult: mockSuccessfulGenerationResult,
  validationErrors: {}
};

/**
 * Mock wizard state with validation errors
 */
export const mockValidationErrorWizardState: WizardState = {
  currentStep: WizardStep.ENDPOINT_CONFIGURATION,
  loading: false,
  error: 'Configuration validation failed',
  generationStatus: GenerationStatus.ERROR,
  serviceName: 'test-mysql-service',
  availableTables: mockDatabaseTables,
  selectedTables: mockSelectedTables,
  endpointConfigurations: mockEndpointConfigurations,
  generationProgress: 50,
  validationErrors: {
    'users.basePath': ['Base path must start with a forward slash'],
    'orders.methodConfigurations.POST.requestSchema': ['Required fields cannot be empty'],
    'orders.security.rateLimiting': ['Requests per minute must be greater than 0']
  }
};

// ============================================================================
// Email Service Mock Data (Additional OpenAPI Testing)
// ============================================================================

/**
 * Mock email service OpenAPI specification for comprehensive testing
 * Provides additional F-006 API Documentation and Testing coverage
 */
export const mockEmailServiceOpenAPISpec: OpenAPISpec = {
  openapi: '3.0.3',
  info: {
    title: 'Email Service API',
    version: '1.0.0',
    description: 'DreamFactory Email Service for sending transactional emails',
    contact: {
      name: 'Email Service Support',
      email: 'email-support@dreamfactory.com'
    }
  },
  servers: [
    {
      url: 'https://api.example.com/api/v2',
      description: 'Production email service'
    }
  ],
  paths: {
    '/email-service/send': {
      post: {
        operationId: 'sendEmail',
        summary: 'Send email',
        description: 'Send a transactional email via configured email service',
        tags: ['email'],
        requestBody: {
          description: 'Email message data',
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/EmailRequest'
              },
              example: {
                to: [
                  {
                    name: 'John Doe',
                    email: 'john.doe@example.com'
                  }
                ],
                from: {
                  name: 'Test Sender',
                  email: 'noreply@example.com'
                },
                subject: 'Test Email',
                text: 'This is a test email message.',
                html: '<p>This is a <strong>test</strong> email message.</p>'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Email sent successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/EmailResponse'
                }
              }
            }
          },
          '400': {
            description: 'Invalid email data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          '500': {
            description: 'Email service error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        },
        security: [
          {
            apiKey: []
          }
        ]
      }
    }
  },
  components: {
    schemas: {
      EmailAddress: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Display name',
            example: 'John Doe'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email address',
            example: 'john.doe@example.com'
          }
        },
        required: ['email']
      },
      EmailRequest: {
        type: 'object',
        properties: {
          to: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/EmailAddress'
            },
            description: 'Email recipients',
            minItems: 1,
            maxItems: 50
          },
          from: {
            $ref: '#/components/schemas/EmailAddress',
            description: 'Email sender'
          },
          cc: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/EmailAddress'
            },
            description: 'CC recipients'
          },
          bcc: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/EmailAddress'
            },
            description: 'BCC recipients'
          },
          subject: {
            type: 'string',
            description: 'Email subject line',
            maxLength: 200,
            example: 'Test Email'
          },
          text: {
            type: 'string',
            description: 'Plain text email body',
            maxLength: 50000
          },
          html: {
            type: 'string',
            description: 'HTML email body',
            maxLength: 100000
          },
          attachments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                filename: {
                  type: 'string',
                  description: 'Attachment filename'
                },
                content: {
                  type: 'string',
                  format: 'base64',
                  description: 'Base64 encoded attachment content'
                },
                contentType: {
                  type: 'string',
                  description: 'MIME type of attachment'
                }
              },
              required: ['filename', 'content', 'contentType']
            },
            description: 'Email attachments'
          }
        },
        required: ['to', 'from', 'subject']
      },
      EmailResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Email sent successfully',
            example: true
          },
          messageId: {
            type: 'string',
            description: 'Email service message identifier',
            example: 'msg_12345abcdef'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Email sent timestamp',
            example: '2024-01-15T16:30:00Z'
          }
        },
        required: ['success', 'messageId', 'timestamp']
      },
      ErrorResponse: {
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
              }
            }
          }
        }
      }
    },
    securitySchemes: {
      apiKey: {
        type: 'apiKey',
        name: 'X-DreamFactory-Api-Key',
        in: 'header'
      }
    }
  },
  security: [
    {
      apiKey: []
    }
  ],
  tags: [
    {
      name: 'email',
      description: 'Email sending operations'
    }
  ]
};

// ============================================================================
// MSW Handler Support Data
// ============================================================================

/**
 * Mock API responses for MSW handlers
 */
export const mockAPIResponses = {
  getUsersList: {
    resource: [
      {
        id: 1,
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        is_active: true,
        created_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        email: 'jane.smith@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        is_active: true,
        created_at: '2024-01-14T09:15:00Z'
      }
    ],
    meta: {
      count: 2,
      total: 15420,
      offset: 0,
      limit: 25
    }
  },
  getOrdersList: {
    resource: [
      {
        id: 1001,
        user_id: 1,
        order_number: 'ORD-2024-001001',
        total_amount: 99.99,
        status: 'pending',
        created_at: '2024-01-15T14:30:00Z'
      },
      {
        id: 1002,
        user_id: 2,
        order_number: 'ORD-2024-001002',
        total_amount: 149.99,
        status: 'processing',
        created_at: '2024-01-15T13:45:00Z'
      }
    ],
    meta: {
      count: 2,
      total: 45230,
      offset: 0,
      limit: 25
    }
  },
  createUserSuccess: {
    resource: [
      {
        id: 15421,
        email: 'new.user@example.com',
        first_name: 'New',
        last_name: 'User',
        is_active: true,
        created_at: '2024-01-15T16:45:00Z'
      }
    ]
  },
  validationError: {
    error: {
      code: 400,
      message: 'Validation failed',
      context: {
        resource: [
          {
            field: 'email',
            message: 'Email format is invalid'
          },
          {
            field: 'first_name',
            message: 'First name is required'
          }
        ]
      }
    }
  }
};

// ============================================================================
// Utility Functions for Mock Data
// ============================================================================

/**
 * Generate mock table with specified row count for performance testing
 */
export function generateMockTable(name: string, rowCount: number): DatabaseTable {
  return {
    name,
    label: name.charAt(0).toUpperCase() + name.slice(1),
    description: `Mock table ${name} for testing with ${rowCount} rows`,
    schema: 'public',
    rowCount,
    fields: [
      {
        name: 'id',
        dbType: 'BIGINT',
        type: FieldType.BIGINT,
        isNullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        isUnique: true,
        isAutoIncrement: true,
        description: 'Primary key'
      },
      {
        name: 'data',
        dbType: 'VARCHAR(255)',
        type: FieldType.STRING,
        length: 255,
        isNullable: true,
        isPrimaryKey: false,
        isForeignKey: false,
        isUnique: false,
        description: 'Data field'
      }
    ],
    primaryKey: ['id'],
    foreignKeys: [],
    selected: false,
    expanded: false,
    hasExistingAPI: false
  };
}

/**
 * Create mock wizard state for specific step
 */
export function createMockWizardState(step: WizardStep, overrides: Partial<WizardState> = {}): WizardState {
  const baseState: WizardState = {
    currentStep: step,
    loading: false,
    generationStatus: GenerationStatus.IDLE,
    serviceName: 'test-service',
    availableTables: mockDatabaseTables,
    selectedTables: [],
    endpointConfigurations: [],
    generationProgress: 0,
    validationErrors: {},
    ...overrides
  };

  // Set appropriate progress based on step
  switch (step) {
    case WizardStep.TABLE_SELECTION:
      baseState.generationProgress = 25;
      break;
    case WizardStep.ENDPOINT_CONFIGURATION:
      baseState.generationProgress = 50;
      baseState.selectedTables = mockSelectedTables;
      break;
    case WizardStep.GENERATION_PREVIEW:
      baseState.generationProgress = 75;
      baseState.selectedTables = mockSelectedTables;
      baseState.endpointConfigurations = mockEndpointConfigurations;
      break;
    case WizardStep.GENERATION_PROGRESS:
      baseState.generationProgress = 100;
      baseState.selectedTables = mockSelectedTables;
      baseState.endpointConfigurations = mockEndpointConfigurations;
      baseState.generatedSpec = mockOpenAPISpec;
      break;
  }

  return baseState;
}

/**
 * Create mock endpoint configuration for table
 */
export function createMockEndpointConfiguration(tableName: string): EndpointConfiguration {
  return {
    tableName,
    basePath: `/${tableName}`,
    enabledMethods: [HTTPMethod.GET, HTTPMethod.POST],
    methodConfigurations: {
      [HTTPMethod.GET]: mockGetMethodConfiguration,
      [HTTPMethod.POST]: mockPostMethodConfiguration,
      [HTTPMethod.PUT]: {
        enabled: false,
        parameters: [],
        responseSchema: mockResponseSchema,
        description: '',
        tags: []
      },
      [HTTPMethod.PATCH]: {
        enabled: false,
        parameters: [],
        responseSchema: mockResponseSchema,
        description: '',
        tags: []
      },
      [HTTPMethod.DELETE]: {
        enabled: false,
        parameters: [],
        responseSchema: mockResponseSchema,
        description: '',
        tags: []
      }
    },
    security: mockEndpointSecurity,
    customParameters: [],
    enabled: true
  };
}

// Export all mock data for comprehensive testing coverage
export default {
  // Database schema mocks
  mockDatabaseFields,
  mockOrderFields,
  mockForeignKeys,
  mockDatabaseTables,
  mockSelectedTables,
  mockLargeDataset,
  
  // Wizard state mocks
  mockTableSelectionData,
  mockVirtualScrollConfig,
  mockEndpointParameters,
  mockEndpointSecurity,
  mockRequestSchema,
  mockResponseSchema,
  mockGetMethodConfiguration,
  mockPostMethodConfiguration,
  mockEndpointConfigurations,
  
  // OpenAPI specification mocks
  mockOpenAPISpec,
  mockEmailServiceOpenAPISpec,
  
  // Generation result mocks
  mockSuccessfulGenerationResult,
  mockFailedGenerationResult,
  
  // Complete wizard state mocks
  mockInitialWizardState,
  mockTableSelectionWizardState,
  mockEndpointConfigurationWizardState,
  mockGenerationPreviewWizardState,
  mockGenerationProgressWizardState,
  mockCompletedWizardState,
  mockValidationErrorWizardState,
  
  // MSW support data
  mockAPIResponses,
  
  // Utility functions
  generateMockTable,
  createMockWizardState,
  createMockEndpointConfiguration
};