/**
 * Mock Service Worker (MSW) handlers for API generation wizard testing and development.
 * 
 * Provides comprehensive HTTP request interception and mock responses for:
 * - Database service connection testing and management per F-001
 * - Schema discovery workflows supporting 1000+ table datasets per F-002
 * - REST API endpoint generation and configuration per F-003
 * - OpenAPI specification generation and preview workflows
 * - Error simulation and edge case handling for comprehensive test coverage
 * 
 * Integrates with Vitest testing framework and enables isolated frontend development
 * without backend dependencies per Section 4.4.2.2 Enhanced Testing Pipeline.
 * 
 * Supports React/Next.js Integration Requirements with realistic API simulation
 * for React Query and SWR data fetching patterns.
 */

import { http, HttpResponse, delay } from 'msw';
import type {
  DatabaseTable,
  DatabaseField,
  FieldType,
  ForeignKeyRelation,
  GenerationResult,
  OpenAPISpec,
  WizardState,
  EndpointConfiguration,
  HTTPMethod,
  GenerationStatus,
  ReferentialAction
} from '../types';

// ============================================================================
// Mock Data Constants and Generators
// ============================================================================

/**
 * Simulated network delays for realistic testing
 */
const NETWORK_DELAYS = {
  FAST: 50,      // Connection tests, cached responses
  NORMAL: 200,   // Standard API operations
  SLOW: 1000,    // Schema discovery for large databases
  TIMEOUT: 5000  // Simulated timeout scenarios
} as const;

/**
 * Mock database service types with realistic configurations
 */
const MOCK_DATABASE_TYPES = [
  {
    name: 'mysql',
    label: 'MySQL',
    description: 'MySQL database service',
    config_schema: {
      host: { type: 'string', required: true },
      port: { type: 'integer', default: 3306 },
      database: { type: 'string', required: true },
      username: { type: 'string', required: true },
      password: { type: 'string', required: true }
    }
  },
  {
    name: 'postgresql',
    label: 'PostgreSQL',
    description: 'PostgreSQL database service',
    config_schema: {
      host: { type: 'string', required: true },
      port: { type: 'integer', default: 5432 },
      database: { type: 'string', required: true },
      username: { type: 'string', required: true },
      password: { type: 'string', required: true }
    }
  },
  {
    name: 'mongodb',
    label: 'MongoDB',
    description: 'MongoDB database service',
    config_schema: {
      host: { type: 'string', required: true },
      port: { type: 'integer', default: 27017 },
      database: { type: 'string', required: true },
      username: { type: 'string' },
      password: { type: 'string' }
    }
  },
  {
    name: 'snowflake',
    label: 'Snowflake',
    description: 'Snowflake data warehouse service',
    config_schema: {
      account: { type: 'string', required: true },
      warehouse: { type: 'string', required: true },
      database: { type: 'string', required: true },
      schema: { type: 'string', default: 'public' },
      username: { type: 'string', required: true },
      password: { type: 'string', required: true }
    }
  }
] as const;

/**
 * Generate mock database fields for realistic schema simulation
 */
function generateMockFields(tableType: 'users' | 'orders' | 'products' | 'invoices' | 'generic' = 'generic'): DatabaseField[] {
  const baseFields: DatabaseField[] = [
    {
      name: 'id',
      dbType: 'INT AUTO_INCREMENT',
      type: FieldType.INTEGER,
      isNullable: false,
      isPrimaryKey: true,
      isForeignKey: false,
      isUnique: true,
      isAutoIncrement: true,
      description: 'Primary key identifier'
    }
  ];

  switch (tableType) {
    case 'users':
      return [
        ...baseFields,
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
          name: 'is_active',
          dbType: 'BOOLEAN',
          type: FieldType.BOOLEAN,
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          isUnique: false,
          defaultValue: true,
          description: 'User active status'
        }
      ];

    case 'orders':
      return [
        ...baseFields,
        {
          name: 'user_id',
          dbType: 'INT',
          type: FieldType.INTEGER,
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: true,
          isUnique: false,
          description: 'Reference to user table'
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
          description: 'Order total amount'
        },
        {
          name: 'order_date',
          dbType: 'DATETIME',
          type: FieldType.DATETIME,
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          isUnique: false,
          description: 'Order placement date'
        },
        {
          name: 'status',
          dbType: 'ENUM',
          type: FieldType.STRING,
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          isUnique: false,
          defaultValue: 'pending',
          description: 'Order status'
        }
      ];

    case 'products':
      return [
        ...baseFields,
        {
          name: 'name',
          dbType: 'VARCHAR(255)',
          type: FieldType.STRING,
          length: 255,
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
          name: 'inventory_count',
          dbType: 'INT',
          type: FieldType.INTEGER,
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          isUnique: false,
          defaultValue: 0,
          description: 'Available inventory count'
        }
      ];

    default:
      return [
        ...baseFields,
        {
          name: 'name',
          dbType: 'VARCHAR(255)',
          type: FieldType.STRING,
          length: 255,
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          isUnique: false,
          description: 'Generic name field'
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
        }
      ];
  }
}

/**
 * Generate mock foreign key relationships for realistic schema connections
 */
function generateMockForeignKeys(tableName: string): ForeignKeyRelation[] {
  const relationships: Record<string, ForeignKeyRelation[]> = {
    orders: [
      {
        name: 'fk_orders_user_id',
        field: 'user_id',
        referencedTable: 'users',
        referencedField: 'id',
        onDelete: ReferentialAction.CASCADE,
        onUpdate: ReferentialAction.CASCADE
      }
    ],
    order_items: [
      {
        name: 'fk_order_items_order_id',
        field: 'order_id',
        referencedTable: 'orders',
        referencedField: 'id',
        onDelete: ReferentialAction.CASCADE,
        onUpdate: ReferentialAction.CASCADE
      },
      {
        name: 'fk_order_items_product_id',
        field: 'product_id',
        referencedTable: 'products',
        referencedField: 'id',
        onDelete: ReferentialAction.RESTRICT,
        onUpdate: ReferentialAction.CASCADE
      }
    ]
  };

  return relationships[tableName] || [];
}

/**
 * Generate comprehensive mock database schema with realistic table structures
 * Supports testing scenarios for databases with 1000+ tables per F-002-RQ-002
 */
function generateMockDatabaseTables(size: 'small' | 'medium' | 'large' = 'medium'): DatabaseTable[] {
  const baseTables: DatabaseTable[] = [
    {
      name: 'users',
      label: 'Users',
      description: 'Application users table',
      schema: 'public',
      rowCount: 15420,
      fields: generateMockFields('users'),
      primaryKey: ['id'],
      foreignKeys: [],
      selected: false,
      expanded: false,
      hasExistingAPI: false
    },
    {
      name: 'orders',
      label: 'Orders',
      description: 'Customer orders table',
      schema: 'public',
      rowCount: 89234,
      fields: generateMockFields('orders'),
      primaryKey: ['id'],
      foreignKeys: generateMockForeignKeys('orders'),
      selected: false,
      expanded: false,
      hasExistingAPI: false
    },
    {
      name: 'products',
      label: 'Products',
      description: 'Product catalog table',
      schema: 'public',
      rowCount: 5678,
      fields: generateMockFields('products'),
      primaryKey: ['id'],
      foreignKeys: [],
      selected: false,
      expanded: false,
      hasExistingAPI: false
    },
    {
      name: 'order_items',
      label: 'Order Items',
      description: 'Individual items within orders',
      schema: 'public',
      rowCount: 234567,
      fields: [
        ...generateMockFields('generic'),
        {
          name: 'order_id',
          dbType: 'INT',
          type: FieldType.INTEGER,
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: true,
          isUnique: false,
          description: 'Reference to orders table'
        },
        {
          name: 'product_id',
          dbType: 'INT',
          type: FieldType.INTEGER,
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: true,
          isUnique: false,
          description: 'Reference to products table'
        },
        {
          name: 'quantity',
          dbType: 'INT',
          type: FieldType.INTEGER,
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          isUnique: false,
          description: 'Item quantity'
        }
      ],
      primaryKey: ['id'],
      foreignKeys: generateMockForeignKeys('order_items'),
      selected: false,
      expanded: false,
      hasExistingAPI: false
    }
  ];

  // Generate additional tables for large schema testing
  if (size === 'large') {
    const additionalTables: DatabaseTable[] = [];
    
    // Generate 1000+ tables for performance testing
    for (let i = 1; i <= 1200; i++) {
      additionalTables.push({
        name: `table_${i.toString().padStart(4, '0')}`,
        label: `Table ${i}`,
        description: `Generated table ${i} for large schema testing`,
        schema: i <= 600 ? 'public' : 'staging',
        rowCount: Math.floor(Math.random() * 100000),
        fields: generateMockFields('generic'),
        primaryKey: ['id'],
        foreignKeys: [],
        selected: false,
        expanded: false,
        hasExistingAPI: Math.random() > 0.8 // 20% chance of existing API
      });
    }
    
    return [...baseTables, ...additionalTables];
  }

  if (size === 'medium') {
    // Generate 50 additional tables for medium schema
    const additionalTables: DatabaseTable[] = [];
    for (let i = 1; i <= 50; i++) {
      additionalTables.push({
        name: `table_${i.toString().padStart(2, '0')}`,
        label: `Table ${i}`,
        description: `Additional table ${i}`,
        schema: 'public',
        rowCount: Math.floor(Math.random() * 10000),
        fields: generateMockFields('generic'),
        primaryKey: ['id'],
        foreignKeys: [],
        selected: false,
        expanded: false,
        hasExistingAPI: false
      });
    }
    
    return [...baseTables, ...additionalTables];
  }

  return baseTables;
}

/**
 * Generate mock OpenAPI specification for endpoint preview and documentation
 */
function generateMockOpenAPISpec(serviceName: string, tables: string[]): OpenAPISpec {
  const paths: Record<string, any> = {};

  // Generate paths for each selected table
  tables.forEach(tableName => {
    const basePath = `/api/v2/${serviceName}/_table/${tableName}`;
    
    paths[basePath] = {
      get: {
        operationId: `get${tableName}List`,
        summary: `Get ${tableName} records`,
        description: `Retrieve a list of ${tableName} records with optional filtering`,
        tags: [tableName],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of records to return',
            required: false,
            schema: { type: 'integer', default: 100, maximum: 1000 }
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of records to skip',
            required: false,
            schema: { type: 'integer', default: 0, minimum: 0 }
          },
          {
            name: 'filter',
            in: 'query',
            description: 'SQL-like filter expression',
            required: false,
            schema: { type: 'string' }
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
                      items: { $ref: `#/components/schemas/${tableName}` }
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        count: { type: 'integer' },
                        total: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        operationId: `create${tableName}`,
        summary: `Create ${tableName} record`,
        description: `Create a new ${tableName} record`,
        tags: [tableName],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${tableName}Input` }
            }
          }
        },
        responses: {
          '201': {
            description: 'Record created successfully',
            content: {
              'application/json': {
                schema: { $ref: `#/components/schemas/${tableName}` }
              }
            }
          }
        }
      }
    };

    // Individual record operations
    paths[`${basePath}/{id}`] = {
      get: {
        operationId: `get${tableName}ById`,
        summary: `Get ${tableName} by ID`,
        description: `Retrieve a specific ${tableName} record by ID`,
        tags: [tableName],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: `#/components/schemas/${tableName}` }
              }
            }
          }
        }
      },
      put: {
        operationId: `update${tableName}`,
        summary: `Update ${tableName} record`,
        description: `Update an existing ${tableName} record`,
        tags: [tableName],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${tableName}Input` }
            }
          }
        },
        responses: {
          '200': {
            description: 'Record updated successfully',
            content: {
              'application/json': {
                schema: { $ref: `#/components/schemas/${tableName}` }
              }
            }
          }
        }
      },
      delete: {
        operationId: `delete${tableName}`,
        summary: `Delete ${tableName} record`,
        description: `Delete a specific ${tableName} record`,
        tags: [tableName],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '204': {
            description: 'Record deleted successfully'
          }
        }
      }
    };
  });

  return {
    openapi: '3.0.3',
    info: {
      title: `${serviceName} API`,
      version: '1.0.0',
      description: `Auto-generated REST API for ${serviceName} database service`,
      contact: {
        name: 'DreamFactory',
        url: 'https://www.dreamfactory.com'
      }
    },
    servers: [
      {
        url: `http://localhost:3000/api/v2/${serviceName}`,
        description: 'Local development server'
      }
    ],
    paths,
    components: {
      schemas: tables.reduce((schemas, tableName) => {
        schemas[tableName] = {
          type: 'object',
          properties: {
            id: { type: 'integer', readOnly: true },
            name: { type: 'string', maxLength: 255 },
            created_at: { type: 'string', format: 'date-time', readOnly: true }
          }
        };
        schemas[`${tableName}Input`] = {
          type: 'object',
          properties: {
            name: { type: 'string', maxLength: 255 }
          },
          required: ['name']
        };
        return schemas;
      }, {} as Record<string, any>),
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-DreamFactory-API-Key'
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer'
        }
      }
    },
    security: [
      { ApiKeyAuth: [] },
      { BearerAuth: [] }
    ],
    tags: tables.map(tableName => ({
      name: tableName,
      description: `Operations for ${tableName} table`
    }))
  };
}

// ============================================================================
// Error Simulation Utilities
// ============================================================================

/**
 * Simulate various error scenarios for comprehensive testing coverage
 */
const ERROR_SCENARIOS = {
  CONNECTION_TIMEOUT: {
    status: 408,
    message: 'Connection timeout',
    details: 'Database connection timed out after 30 seconds'
  },
  INVALID_CREDENTIALS: {
    status: 401,
    message: 'Authentication failed',
    details: 'Invalid username or password'
  },
  NETWORK_ERROR: {
    status: 500,
    message: 'Network error',
    details: 'Unable to connect to database server'
  },
  SCHEMA_ACCESS_DENIED: {
    status: 403,
    message: 'Schema access denied',
    details: 'Insufficient permissions to access database schema'
  },
  INVALID_TABLE_NAME: {
    status: 400,
    message: 'Invalid table name',
    details: 'Table name contains invalid characters'
  },
  GENERATION_FAILED: {
    status: 500,
    message: 'API generation failed',
    details: 'An error occurred during endpoint generation'
  }
} as const;

/**
 * Check if request should trigger error scenario based on URL parameters
 */
function shouldTriggerError(url: URL): keyof typeof ERROR_SCENARIOS | null {
  const errorParam = url.searchParams.get('error');
  if (errorParam && errorParam in ERROR_SCENARIOS) {
    return errorParam as keyof typeof ERROR_SCENARIOS;
  }
  return null;
}

/**
 * Generate error response for testing error handling
 */
function createErrorResponse(errorType: keyof typeof ERROR_SCENARIOS) {
  const error = ERROR_SCENARIOS[errorType];
  return HttpResponse.json(
    {
      error: {
        code: error.status,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString()
      }
    },
    { status: error.status }
  );
}

// ============================================================================
// MSW HTTP Handlers
// ============================================================================

/**
 * Database service type discovery handlers
 * Supports F-001: Database Service Connection Management
 */
export const databaseServiceTypeHandlers = [
  // Get available database service types
  http.get('/api/v2/system/service_type', async ({ request }) => {
    const url = new URL(request.url);
    const errorType = shouldTriggerError(url);
    
    if (errorType) {
      return createErrorResponse(errorType);
    }

    await delay(NETWORK_DELAYS.FAST);

    return HttpResponse.json({
      resource: MOCK_DATABASE_TYPES.map(type => ({
        name: type.name,
        label: type.label,
        description: type.description,
        config_schema: type.config_schema
      }))
    });
  })
];

/**
 * Database service management handlers
 * Supports F-001: Database Service Connection Management
 */
export const databaseServiceHandlers = [
  // Test database connection
  http.post('/api/v2/system/service/:serviceName/_test', async ({ request, params }) => {
    const url = new URL(request.url);
    const errorType = shouldTriggerError(url);
    
    if (errorType) {
      await delay(NETWORK_DELAYS.SLOW);
      return createErrorResponse(errorType);
    }

    const body = await request.json() as any;
    const { serviceName } = params;

    // Validate required connection parameters
    if (!body.host || !body.database) {
      return HttpResponse.json(
        {
          error: {
            code: 400,
            message: 'Missing required connection parameters',
            details: 'Host and database are required fields'
          }
        },
        { status: 400 }
      );
    }

    await delay(NETWORK_DELAYS.NORMAL);

    return HttpResponse.json({
      success: true,
      message: `Successfully connected to ${serviceName} database`,
      connection_details: {
        host: body.host,
        port: body.port,
        database: body.database,
        response_time_ms: Math.floor(Math.random() * 200) + 50
      }
    });
  }),

  // Create database service
  http.post('/api/v2/system/service', async ({ request }) => {
    const url = new URL(request.url);
    const errorType = shouldTriggerError(url);
    
    if (errorType) {
      return createErrorResponse(errorType);
    }

    const body = await request.json() as any;

    // Validate service configuration
    if (!body.name || !body.type) {
      return HttpResponse.json(
        {
          error: {
            code: 400,
            message: 'Invalid service configuration',
            details: 'Service name and type are required'
          }
        },
        { status: 400 }
      );
    }

    await delay(NETWORK_DELAYS.NORMAL);

    const serviceId = Math.floor(Math.random() * 1000) + 1;

    return HttpResponse.json({
      id: serviceId,
      name: body.name,
      type: body.type,
      label: body.label || body.name,
      description: body.description || `${body.type} database service`,
      config: body.config,
      is_active: true,
      created_date: new Date().toISOString(),
      last_modified_date: new Date().toISOString()
    }, { status: 201 });
  }),

  // Get existing database services
  http.get('/api/v2/system/service', async ({ request }) => {
    const url = new URL(request.url);
    const errorType = shouldTriggerError(url);
    
    if (errorType) {
      return createErrorResponse(errorType);
    }

    await delay(NETWORK_DELAYS.FAST);

    return HttpResponse.json({
      resource: [
        {
          id: 1,
          name: 'sample_mysql',
          type: 'mysql',
          label: 'Sample MySQL',
          description: 'Sample MySQL database service',
          is_active: true,
          created_date: '2024-01-15T10:30:00Z',
          last_modified_date: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          name: 'sample_postgresql',
          type: 'postgresql',
          label: 'Sample PostgreSQL',
          description: 'Sample PostgreSQL database service',
          is_active: true,
          created_date: '2024-01-20T14:15:00Z',
          last_modified_date: '2024-01-20T14:15:00Z'
        }
      ]
    });
  })
];

/**
 * Schema discovery handlers supporting F-002: Schema Discovery and Browsing
 * Includes support for large schemas with 1000+ tables per F-002-RQ-002
 */
export const schemaDiscoveryHandlers = [
  // Get database schema overview
  http.get('/api/v2/:serviceName/_schema', async ({ request, params }) => {
    const url = new URL(request.url);
    const errorType = shouldTriggerError(url);
    
    if (errorType) {
      return createErrorResponse(errorType);
    }

    const { serviceName } = params;
    const refresh = url.searchParams.get('refresh') === 'true';
    const size = url.searchParams.get('size') as 'small' | 'medium' | 'large' || 'medium';

    // Simulate longer delay for large schemas and refresh operations
    const delay_time = size === 'large' || refresh ? NETWORK_DELAYS.SLOW : NETWORK_DELAYS.NORMAL;
    await delay(delay_time);

    const tables = generateMockDatabaseTables(size);

    return HttpResponse.json({
      resource: {
        name: serviceName,
        tables: tables.map(table => ({
          name: table.name,
          label: table.label,
          description: table.description,
          schema: table.schema,
          row_count: table.rowCount,
          field_count: table.fields.length,
          has_primary_key: table.primaryKey.length > 0,
          has_foreign_keys: table.foreignKeys.length > 0,
          has_existing_api: table.hasExistingAPI
        }))
      },
      meta: {
        count: tables.length,
        schema_discovery_time_ms: delay_time,
        last_discovery: new Date().toISOString()
      }
    });
  }),

  // Get specific table schema details
  http.get('/api/v2/:serviceName/_schema/:tableName', async ({ request, params }) => {
    const url = new URL(request.url);
    const errorType = shouldTriggerError(url);
    
    if (errorType) {
      return createErrorResponse(errorType);
    }

    const { serviceName, tableName } = params;

    // Find the requested table in our mock data
    const allTables = generateMockDatabaseTables('medium');
    const table = allTables.find(t => t.name === tableName);

    if (!table) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: 'Table not found',
            details: `Table '${tableName}' does not exist in service '${serviceName}'`
          }
        },
        { status: 404 }
      );
    }

    await delay(NETWORK_DELAYS.FAST);

    return HttpResponse.json({
      resource: {
        name: table.name,
        label: table.label,
        description: table.description,
        schema: table.schema,
        row_count: table.rowCount,
        fields: table.fields,
        primary_key: table.primaryKey,
        foreign_keys: table.foreignKeys,
        indexes: [
          {
            name: `idx_${table.name}_id`,
            fields: ['id'],
            type: 'PRIMARY',
            unique: true
          }
        ]
      }
    });
  }),

  // Get table relationships
  http.get('/api/v2/:serviceName/_schema/:tableName/_related', async ({ request, params }) => {
    const url = new URL(request.url);
    const errorType = shouldTriggerError(url);
    
    if (errorType) {
      return createErrorResponse(errorType);
    }

    const { tableName } = params;

    await delay(NETWORK_DELAYS.FAST);

    // Mock relationship data based on table name
    const relationships = {
      users: ['orders'],
      orders: ['users', 'order_items'],
      products: ['order_items'],
      order_items: ['orders', 'products']
    };

    return HttpResponse.json({
      resource: {
        related_tables: relationships[tableName as keyof typeof relationships] || [],
        incoming_references: tableName === 'users' ? ['orders'] : [],
        outgoing_references: tableName === 'orders' ? ['users'] : []
      }
    });
  })
];

/**
 * API generation and configuration handlers for F-003: REST API Endpoint Generation
 */
export const apiGenerationHandlers = [
  // Generate OpenAPI specification preview
  http.post('/api/v2/:serviceName/_openapi', async ({ request, params }) => {
    const url = new URL(request.url);
    const errorType = shouldTriggerError(url);
    
    if (errorType) {
      return createErrorResponse(errorType);
    }

    const { serviceName } = params;
    const body = await request.json() as any;

    // Validate request body
    if (!body.tables || !Array.isArray(body.tables) || body.tables.length === 0) {
      return HttpResponse.json(
        {
          error: {
            code: 400,
            message: 'Invalid request',
            details: 'At least one table must be specified'
          }
        },
        { status: 400 }
      );
    }

    await delay(NETWORK_DELAYS.NORMAL);

    const openApiSpec = generateMockOpenAPISpec(serviceName as string, body.tables);

    return HttpResponse.json({
      openapi_spec: openApiSpec,
      generated_endpoints: body.tables.flatMap((table: string) => [
        `GET /api/v2/${serviceName}/_table/${table}`,
        `POST /api/v2/${serviceName}/_table/${table}`,
        `GET /api/v2/${serviceName}/_table/${table}/{id}`,
        `PUT /api/v2/${serviceName}/_table/${table}/{id}`,
        `DELETE /api/v2/${serviceName}/_table/${table}/{id}`
      ]),
      generation_time_ms: NETWORK_DELAYS.NORMAL,
      estimated_size_kb: Math.floor(JSON.stringify(openApiSpec).length / 1024)
    });
  }),

  // Generate actual API endpoints
  http.post('/api/v2/:serviceName/_generate', async ({ request, params }) => {
    const url = new URL(request.url);
    const errorType = shouldTriggerError(url);
    
    if (errorType) {
      return createErrorResponse(errorType);
    }

    const { serviceName } = params;
    const body = await request.json() as any;

    // Validate endpoint configurations
    if (!body.configurations || !Array.isArray(body.configurations)) {
      return HttpResponse.json(
        {
          error: {
            code: 400,
            message: 'Invalid configuration',
            details: 'Endpoint configurations array is required'
          }
        },
        { status: 400 }
      );
    }

    // Simulate generation time based on number of tables
    const generationTime = Math.min(body.configurations.length * 500, 5000);
    await delay(generationTime);

    const result: GenerationResult = {
      success: true,
      serviceId: Math.floor(Math.random() * 1000) + 1,
      endpointUrls: body.configurations.flatMap((config: any) => [
        `http://localhost:3000/api/v2/${serviceName}/_table/${config.tableName}`,
        `http://localhost:3000/api/v2/${serviceName}/_table/${config.tableName}/{id}`
      ]),
      openApiSpec: generateMockOpenAPISpec(serviceName as string, body.configurations.map((c: any) => c.tableName)),
      statistics: {
        tablesProcessed: body.configurations.length,
        endpointsGenerated: body.configurations.length * 5, // 5 methods per table
        schemasCreated: body.configurations.length * 2, // Input and output schemas
        generationDuration: generationTime,
        specificationSize: Math.floor(Math.random() * 50000) + 10000
      },
      warnings: [],
      timestamp: new Date()
    };

    return HttpResponse.json(result, { status: 201 });
  }),

  // Get generation progress (for long-running operations)
  http.get('/api/v2/:serviceName/_generate/:jobId', async ({ request, params }) => {
    const url = new URL(request.url);
    const errorType = shouldTriggerError(url);
    
    if (errorType) {
      return createErrorResponse(errorType);
    }

    const { jobId } = params;

    await delay(NETWORK_DELAYS.FAST);

    // Simulate different progress states
    const states = [
      { status: GenerationStatus.CONFIGURING, progress: 25 },
      { status: GenerationStatus.VALIDATING, progress: 50 },
      { status: GenerationStatus.GENERATING, progress: 75 },
      { status: GenerationStatus.COMPLETED, progress: 100 }
    ];

    const randomState = states[Math.floor(Math.random() * states.length)];

    return HttpResponse.json({
      job_id: jobId,
      status: randomState.status,
      progress: randomState.progress,
      current_operation: `Processing table ${Math.floor(randomState.progress / 25) + 1} of 4`,
      estimated_completion: new Date(Date.now() + (100 - randomState.progress) * 1000).toISOString()
    });
  })
];

/**
 * API documentation and testing handlers for F-006: API Documentation and Testing
 */
export const apiDocumentationHandlers = [
  // Get API documentation for generated service
  http.get('/api/v2/:serviceName/_docs', async ({ request, params }) => {
    const url = new URL(request.url);
    const errorType = shouldTriggerError(url);
    
    if (errorType) {
      return createErrorResponse(errorType);
    }

    const { serviceName } = params;

    await delay(NETWORK_DELAYS.FAST);

    const openApiSpec = generateMockOpenAPISpec(serviceName as string, ['users', 'orders', 'products']);

    return HttpResponse.json({
      service_name: serviceName,
      documentation: openApiSpec,
      interactive_url: `http://localhost:3000/api-docs/${serviceName}`,
      last_updated: new Date().toISOString()
    });
  }),

  // Test API endpoint
  http.post('/api/v2/:serviceName/_test', async ({ request, params }) => {
    const url = new URL(request.url);
    const errorType = shouldTriggerError(url);
    
    if (errorType) {
      return createErrorResponse(errorType);
    }

    const body = await request.json() as any;

    await delay(NETWORK_DELAYS.NORMAL);

    return HttpResponse.json({
      test_result: {
        status: 'success',
        response_time_ms: Math.floor(Math.random() * 200) + 50,
        status_code: 200,
        response_body: {
          message: 'API endpoint test successful',
          endpoint: body.endpoint,
          method: body.method,
          timestamp: new Date().toISOString()
        }
      }
    });
  })
];

/**
 * Complete MSW handlers collection for API generation wizard
 * Provides comprehensive mock API coverage for development and testing
 */
export const apiGenerationWizardHandlers = [
  ...databaseServiceTypeHandlers,
  ...databaseServiceHandlers,
  ...schemaDiscoveryHandlers,
  ...apiGenerationHandlers,
  ...apiDocumentationHandlers
];

/**
 * Default export for convenient import in test setup files
 */
export default apiGenerationWizardHandlers;

/**
 * Development-only handlers for enhanced testing scenarios
 * Includes additional error cases and edge conditions
 */
export const developmentOnlyHandlers = [
  // Simulate network timeout
  http.get('/api/timeout/*', async () => {
    await delay(NETWORK_DELAYS.TIMEOUT);
    return HttpResponse.json({ message: 'Request timed out' }, { status: 408 });
  }),

  // Simulate intermittent failures
  http.get('/api/flaky/*', async ({ request }) => {
    // 30% chance of failure
    if (Math.random() < 0.3) {
      return HttpResponse.json(
        { error: { message: 'Intermittent server error' } },
        { status: 500 }
      );
    }
    
    await delay(NETWORK_DELAYS.NORMAL);
    return HttpResponse.json({ message: 'Success after retry' });
  }),

  // Simulate large payload response for performance testing
  http.get('/api/large-response/*', async () => {
    await delay(NETWORK_DELAYS.SLOW);
    
    const largeData = Array.from({ length: 10000 }, (_, i) => ({
      id: i + 1,
      name: `Record ${i + 1}`,
      data: Array.from({ length: 100 }, () => Math.random().toString(36).substr(2, 9))
    }));

    return HttpResponse.json({ resource: largeData });
  })
];

/**
 * Export individual handler groups for selective use in different test contexts
 */
export {
  databaseServiceTypeHandlers,
  databaseServiceHandlers,
  schemaDiscoveryHandlers,
  apiGenerationHandlers,
  apiDocumentationHandlers
};