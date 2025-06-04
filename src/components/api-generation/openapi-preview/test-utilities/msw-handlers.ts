/**
 * Mock Service Worker (MSW) handlers for OpenAPI preview testing and development.
 * 
 * Provides comprehensive HTTP request interception and mock responses for:
 * - API documentation retrieval workflows per F-006 API Documentation and Testing
 * - OpenAPI specification generation and preview rendering per Section 2.1 Feature Catalog
 * - Swagger UI integration and testing scenarios per React/Next.js Integration Requirements
 * - Authentication and authorization testing with API keys and session tokens
 * - Error simulation and edge case handling for comprehensive OpenAPI preview test coverage
 * 
 * Integrates with Vitest testing framework enabling isolated frontend development
 * without backend dependencies per Section 4.4.2.2 Enhanced Testing Pipeline.
 * 
 * Supports MSW-powered in-browser testing with realistic API simulation for
 * React Query and SWR data fetching patterns per Section 3.6 Development & Deployment.
 * 
 * @fileoverview MSW handlers for OpenAPI preview component testing
 * @version 1.0.0
 * @since TypeScript 5.8+ with React 19 and Next.js 15.1 compatibility
 */

import { http, HttpResponse, delay } from 'msw';
import type {
  OpenAPISpecification,
  ServiceInfo,
  ApiDocsRowData,
  ApiKeyInfo,
  SwaggerUIConfig,
  ApiCallResponse,
  ValidationError,
} from '../types';

// ============================================================================
// Mock Data Constants and Simulation Configuration
// ============================================================================

/**
 * Realistic network delays for comprehensive testing scenarios
 * Supporting performance requirements from React/Next.js Integration Requirements
 */
const NETWORK_DELAYS = {
  INSTANT: 10,     // Cached responses, local operations
  FAST: 50,        // API key validation, session checks
  NORMAL: 200,     // Standard OpenAPI retrieval
  SLOW: 800,       // Large specification generation
  VERY_SLOW: 2000, // Complex schema processing
  TIMEOUT: 5000    // Simulated timeout scenarios
} as const;

/**
 * Mock API base URLs for different DreamFactory endpoints
 * Following DreamFactory API patterns at /api/v2 and /system/api/v2
 */
const API_ENDPOINTS = {
  SYSTEM_API: '/api/v2/system',
  SERVICE_API: '/api/v2',
  DOCS_API: '/api/v2/_doc',
  SCHEMA_API: '/api/v2/_schema',
} as const;

/**
 * HTTP headers consistent with DreamFactory authentication patterns
 */
const HTTP_HEADERS = {
  API_KEY: 'X-DreamFactory-Api-Key',
  SESSION_TOKEN: 'X-DreamFactory-Session-Token',
  CONTENT_TYPE: 'application/json',
  CACHE_CONTROL: 'no-cache',
} as const;

/**
 * Mock service configurations with realistic OpenAPI specifications
 * Supporting multiple database types per F-001 Database Service Connection Management
 */
const MOCK_SERVICES: Record<string, ServiceInfo> = {
  'database-mysql': {
    id: 1,
    name: 'database-mysql',
    label: 'MySQL Database Service',
    description: 'Production MySQL database with user management and e-commerce tables',
    type: 'mysql',
    isActive: true,
    mutable: true,
    deletable: true,
    createdDate: '2024-01-15T10:30:00Z',
    lastModifiedDate: '2024-03-01T14:22:00Z',
    config: {
      host: 'mysql.example.com',
      port: 3306,
      database: 'ecommerce_prod',
      generateDocs: true,
      includeExamples: true,
      authenticationRequired: true,
      corsEnabled: true,
      cacheEnabled: false,
      rateLimitEnabled: true,
    },
    apiDocumentation: {
      hasDocumentation: true,
      documentationUrl: '/api/v2/_doc/database-mysql',
      swaggerUrl: '/api/v2/_doc/database-mysql?format=swagger',
      lastGenerated: '2024-03-01T14:22:00Z',
      version: '3.0.2',
      endpointCount: 45,
    },
    endpoints: [
      {
        path: '/users',
        method: 'GET',
        operationId: 'getUsers',
        summary: 'Retrieve user records',
        description: 'Get a list of users with optional filtering and pagination',
        tags: ['Users'],
        authenticated: true,
      },
      {
        path: '/users',
        method: 'POST',
        operationId: 'createUser',
        summary: 'Create new user',
        description: 'Create a new user record with validation',
        tags: ['Users'],
        authenticated: true,
      },
      {
        path: '/products',
        method: 'GET',
        operationId: 'getProducts',
        summary: 'Retrieve product catalog',
        description: 'Get product listings with inventory information',
        tags: ['Products'],
        authenticated: false,
      },
    ],
    health: {
      status: 'healthy',
      lastChecked: '2024-03-01T16:00:00Z',
      responseTime: 145,
      uptime: 99.98,
      errorRate: 0.001,
    },
  },
  'database-postgresql': {
    id: 2,
    name: 'database-postgresql',
    label: 'PostgreSQL Analytics DB',
    description: 'Analytics PostgreSQL database with reporting and metrics tables',
    type: 'postgresql',
    isActive: true,
    mutable: true,
    deletable: true,
    createdDate: '2024-02-01T09:15:00Z',
    lastModifiedDate: '2024-03-01T11:45:00Z',
    config: {
      host: 'postgres.analytics.example.com',
      port: 5432,
      database: 'analytics_warehouse',
      generateDocs: true,
      includeExamples: false,
      authenticationRequired: true,
      corsEnabled: false,
      cacheEnabled: true,
      rateLimitEnabled: false,
    },
    apiDocumentation: {
      hasDocumentation: true,
      documentationUrl: '/api/v2/_doc/database-postgresql',
      swaggerUrl: '/api/v2/_doc/database-postgresql?format=swagger',
      lastGenerated: '2024-03-01T11:45:00Z',
      version: '3.0.2',
      endpointCount: 28,
    },
    health: {
      status: 'healthy',
      lastChecked: '2024-03-01T16:00:00Z',
      responseTime: 89,
      uptime: 99.95,
      errorRate: 0.002,
    },
  },
  'email-service': {
    id: 3,
    name: 'email-service',
    label: 'SMTP Email Service',
    description: 'Email delivery service for notifications and marketing campaigns',
    type: 'email',
    isActive: true,
    mutable: false,
    deletable: false,
    createdDate: '2024-01-10T08:00:00Z',
    lastModifiedDate: '2024-02-15T12:30:00Z',
    config: {
      driver: 'smtp',
      host: 'smtp.example.com',
      port: 587,
      generateDocs: true,
      includeExamples: true,
      authenticationRequired: true,
    },
    apiDocumentation: {
      hasDocumentation: true,
      documentationUrl: '/api/v2/_doc/email-service',
      swaggerUrl: '/api/v2/_doc/email-service?format=swagger',
      lastGenerated: '2024-02-15T12:30:00Z',
      version: '3.0.2',
      endpointCount: 8,
    },
    health: {
      status: 'healthy',
      lastChecked: '2024-03-01T16:00:00Z',
      responseTime: 234,
      uptime: 99.99,
      errorRate: 0.0001,
    },
  },
} as const;

/**
 * Comprehensive OpenAPI specification for MySQL database service
 * Supporting F-003 REST API Endpoint Generation requirements
 */
const MYSQL_OPENAPI_SPEC: OpenAPISpecification = {
  openapi: '3.0.2',
  info: {
    title: 'MySQL Database Service API',
    description: 'Auto-generated REST API for MySQL database operations with comprehensive CRUD functionality',
    version: '1.0.0',
    contact: {
      name: 'DreamFactory Support',
      email: 'support@dreamfactory.com',
    },
    'x-dreamfactory-service': 'database-mysql',
    'x-dreamfactory-generated': '2024-03-01T14:22:00Z',
  },
  servers: [
    {
      url: '/api/v2/database-mysql',
      description: 'MySQL Database Service Endpoint',
    },
  ],
  security: [
    { ApiKeyHeader: [] },
    { SessionTokenHeader: [] },
  ],
  tags: [
    {
      name: 'Users',
      description: 'User management operations',
    },
    {
      name: 'Products',
      description: 'Product catalog management',
    },
    {
      name: 'Orders',
      description: 'Order processing and fulfillment',
    },
  ],
  paths: {
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'Retrieve user records',
        description: 'Get a paginated list of user records with optional filtering, sorting, and field selection',
        operationId: 'getUsers',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of records to return',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 100 },
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of records to skip for pagination',
            schema: { type: 'integer', minimum: 0, default: 0 },
          },
          {
            name: 'filter',
            in: 'query',
            description: 'SQL-like filter expression for record selection',
            schema: { type: 'string' },
            example: 'email LIKE "%@example.com"',
          },
          {
            name: 'order',
            in: 'query',
            description: 'Field(s) to sort results by',
            schema: { type: 'string' },
            example: 'last_name ASC, first_name ASC',
          },
        ],
        responses: {
          '200': {
            description: 'Successful operation',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    resource: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' },
                    },
                    meta: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
                example: {
                  resource: [
                    {
                      id: 1,
                      email: 'john.doe@example.com',
                      first_name: 'John',
                      last_name: 'Doe',
                      is_active: true,
                      created_at: '2024-01-15T10:30:00Z',
                      updated_at: '2024-02-01T14:20:00Z',
                    },
                  ],
                  meta: {
                    count: 1,
                    total: 150,
                    limit: 100,
                    offset: 0,
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
        'x-dreamfactory-verb': 'GET',
        'x-dreamfactory-table': 'users',
        'x-dreamfactory-cache': true,
      },
      post: {
        tags: ['Users'],
        summary: 'Create new user records',
        description: 'Create one or more user records with validation and constraint checking',
        operationId: 'createUsers',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: '#/components/schemas/UserCreate' },
                  {
                    type: 'object',
                    properties: {
                      resource: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/UserCreate' },
                      },
                    },
                  },
                ],
              },
              examples: {
                'single-user': {
                  summary: 'Create single user',
                  value: {
                    email: 'jane.smith@example.com',
                    first_name: 'Jane',
                    last_name: 'Smith',
                    password: 'SecurePassword123!',
                  },
                },
                'multiple-users': {
                  summary: 'Create multiple users',
                  value: {
                    resource: [
                      {
                        email: 'user1@example.com',
                        first_name: 'User',
                        last_name: 'One',
                        password: 'Password123!',
                      },
                      {
                        email: 'user2@example.com',
                        first_name: 'User',
                        last_name: 'Two',
                        password: 'Password456!',
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Users created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    resource: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '409': { $ref: '#/components/responses/Conflict' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
        'x-dreamfactory-verb': 'POST',
        'x-dreamfactory-table': 'users',
      },
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'Retrieve product catalog',
        description: 'Get product listings with inventory information and pricing details',
        operationId: 'getProducts',
        parameters: [
          {
            name: 'category',
            in: 'query',
            description: 'Filter products by category',
            schema: { type: 'string' },
          },
          {
            name: 'in_stock',
            in: 'query',
            description: 'Filter products by stock availability',
            schema: { type: 'boolean' },
          },
        ],
        responses: {
          '200': {
            description: 'Product list retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    resource: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Product' },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
        'x-dreamfactory-verb': 'GET',
        'x-dreamfactory-table': 'products',
        'x-dreamfactory-cache': false,
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyHeader: {
        type: 'apiKey',
        in: 'header',
        name: HTTP_HEADERS.API_KEY,
        description: 'DreamFactory API Key for authentication',
      },
      SessionTokenHeader: {
        type: 'apiKey',
        in: 'header',
        name: HTTP_HEADERS.SESSION_TOKEN,
        description: 'DreamFactory Session Token for user authentication',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Unique user identifier',
            readOnly: true,
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address (unique)',
            maxLength: 255,
          },
          first_name: {
            type: 'string',
            description: 'User first name',
            maxLength: 100,
          },
          last_name: {
            type: 'string',
            description: 'User last name',
            maxLength: 100,
          },
          is_active: {
            type: 'boolean',
            description: 'User account status',
            default: true,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Record creation timestamp',
            readOnly: true,
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Record last modification timestamp',
            readOnly: true,
          },
        },
        required: ['email', 'first_name', 'last_name'],
        'x-dreamfactory-type': 'table',
      },
      UserCreate: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address (must be unique)',
            maxLength: 255,
          },
          first_name: {
            type: 'string',
            description: 'User first name',
            maxLength: 100,
          },
          last_name: {
            type: 'string',
            description: 'User last name',
            maxLength: 100,
          },
          password: {
            type: 'string',
            description: 'User password (minimum 8 characters)',
            minLength: 8,
            writeOnly: true,
          },
          is_active: {
            type: 'boolean',
            description: 'User account status',
            default: true,
          },
        },
        required: ['email', 'first_name', 'last_name', 'password'],
      },
      Product: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Unique product identifier',
            readOnly: true,
          },
          name: {
            type: 'string',
            description: 'Product name',
            maxLength: 200,
          },
          description: {
            type: 'string',
            description: 'Product description',
          },
          price: {
            type: 'number',
            format: 'decimal',
            description: 'Product price in USD',
            minimum: 0,
          },
          category: {
            type: 'string',
            description: 'Product category',
            maxLength: 100,
          },
          stock_quantity: {
            type: 'integer',
            description: 'Available inventory quantity',
            minimum: 0,
          },
          is_featured: {
            type: 'boolean',
            description: 'Featured product flag',
            default: false,
          },
        },
        required: ['name', 'price', 'category'],
        'x-dreamfactory-type': 'table',
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          count: {
            type: 'integer',
            description: 'Number of records in current response',
          },
          total: {
            type: 'integer',
            description: 'Total number of available records',
          },
          limit: {
            type: 'integer',
            description: 'Maximum records per page',
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
                description: 'Error description',
              },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    code: { type: 'integer' },
                  },
                },
                description: 'Detailed error information',
              },
            },
          },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Bad request - validation errors or malformed request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: {
                code: 400,
                message: 'Bad Request',
                details: [
                  {
                    message: 'email field is required',
                    code: 1001,
                  },
                ],
              },
            },
          },
        },
      },
      Unauthorized: {
        description: 'Authentication required or invalid credentials',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: {
                code: 401,
                message: 'Authentication required',
              },
            },
          },
        },
      },
      Conflict: {
        description: 'Resource conflict - duplicate key or constraint violation',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: {
                code: 409,
                message: 'Conflict',
                details: [
                  {
                    message: 'Email address already exists',
                    code: 2001,
                  },
                ],
              },
            },
          },
        },
      },
      InternalError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: {
                code: 500,
                message: 'Internal Server Error',
              },
            },
          },
        },
      },
    },
  },
} as const;

/**
 * Email service OpenAPI specification for diverse API testing
 */
const EMAIL_OPENAPI_SPEC: OpenAPISpecification = {
  openapi: '3.0.2',
  info: {
    title: 'Email Service API',
    description: 'SMTP email delivery service for transactional and marketing communications',
    version: '1.0.0',
    'x-dreamfactory-service': 'email-service',
    'x-dreamfactory-generated': '2024-02-15T12:30:00Z',
  },
  servers: [
    {
      url: '/api/v2/email-service',
      description: 'Email Service Endpoint',
    },
  ],
  security: [
    { ApiKeyHeader: [] },
  ],
  paths: {
    '/': {
      post: {
        summary: 'Send email message',
        description: 'Send single or multiple email messages with attachments and templating support',
        operationId: 'sendEmail',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EmailRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Email sent successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EmailResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyHeader: {
        type: 'apiKey',
        in: 'header',
        name: HTTP_HEADERS.API_KEY,
      },
    },
    schemas: {
      EmailRequest: {
        type: 'object',
        properties: {
          to: {
            type: 'array',
            items: { $ref: '#/components/schemas/EmailAddress' },
            description: 'Recipient email addresses',
          },
          subject: {
            type: 'string',
            description: 'Email subject line',
            maxLength: 255,
          },
          body_text: {
            type: 'string',
            description: 'Plain text email body',
          },
          body_html: {
            type: 'string',
            description: 'HTML email body',
          },
        },
        required: ['to', 'subject'],
      },
      EmailAddress: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Email address',
          },
          name: {
            type: 'string',
            description: 'Display name',
          },
        },
        required: ['email'],
      },
      EmailResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Delivery status',
          },
          message_id: {
            type: 'string',
            description: 'Unique message identifier',
          },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Invalid email request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      Unauthorized: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      InternalError: {
        description: 'Email delivery failure',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
    },
  },
} as const;

/**
 * Mock API key configurations for authentication testing
 */
const MOCK_API_KEYS: Record<string, ApiKeyInfo> = {
  'valid-api-key': {
    id: 'key-12345',
    name: 'Development API Key',
    key: 'valid-api-key',
    sessionToken: 'session-token-67890',
    createdAt: '2024-01-01T00:00:00Z',
    expiresAt: '2024-12-31T23:59:59Z',
    permissions: [
      {
        resource: 'database-mysql/*',
        actions: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      },
      {
        resource: 'email-service/*',
        actions: ['POST'],
      },
    ],
    isActive: true,
    lastUsed: '2024-03-01T15:30:00Z',
    usageCount: 1247,
    rateLimit: {
      requestsPerMinute: 100,
      requestsPerHour: 5000,
      requestsPerDay: 50000,
    },
  },
  'readonly-api-key': {
    id: 'key-readonly',
    name: 'Read-Only API Key',
    key: 'readonly-api-key',
    createdAt: '2024-02-01T00:00:00Z',
    permissions: [
      {
        resource: 'database-mysql/*',
        actions: ['GET'],
      },
    ],
    isActive: true,
    rateLimit: {
      requestsPerMinute: 50,
      requestsPerHour: 2000,
      requestsPerDay: 20000,
    },
  },
  'expired-api-key': {
    id: 'key-expired',
    name: 'Expired API Key',
    key: 'expired-api-key',
    createdAt: '2023-01-01T00:00:00Z',
    expiresAt: '2023-12-31T23:59:59Z',
    permissions: [],
    isActive: false,
  },
} as const;

// ============================================================================
// MSW Request Handlers
// ============================================================================

/**
 * Service listing and information handlers
 * Supporting F-006 API Documentation and Testing requirements
 */
export const serviceHandlers = [
  // Get all services with API documentation capability
  http.get(`${API_ENDPOINTS.SYSTEM_API}/service`, async ({ request }) => {
    await delay(NETWORK_DELAYS.NORMAL);
    
    const url = new URL(request.url);
    const includeSchema = url.searchParams.get('include_schema') === 'true';
    const filterType = url.searchParams.get('type');
    
    let services = Object.values(MOCK_SERVICES);
    
    if (filterType) {
      services = services.filter(service => service.type === filterType);
    }
    
    const response = {
      resource: services.map(service => ({
        ...service,
        ...(includeSchema && { 
          openApiSpec: service.name === 'database-mysql' ? MYSQL_OPENAPI_SPEC :
                       service.name === 'email-service' ? EMAIL_OPENAPI_SPEC : undefined
        })
      }))
    };
    
    return HttpResponse.json(response, {
      headers: {
        'Content-Type': HTTP_HEADERS.CONTENT_TYPE,
        'Cache-Control': 'max-age=300',
      },
    });
  }),

  // Get specific service information
  http.get(`${API_ENDPOINTS.SYSTEM_API}/service/:serviceName`, async ({ params, request }) => {
    await delay(NETWORK_DELAYS.FAST);
    
    const { serviceName } = params;
    const service = MOCK_SERVICES[serviceName as string];
    
    if (!service) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: `Service '${serviceName}' not found`,
          },
        },
        { status: 404 }
      );
    }
    
    // Simulate service health check
    const healthCheck = Math.random() > 0.05; // 95% uptime simulation
    const responseService = {
      ...service,
      health: {
        ...service.health,
        status: healthCheck ? 'healthy' : 'degraded',
        lastChecked: new Date().toISOString(),
        responseTime: Math.floor(Math.random() * 500) + 50,
      },
    };
    
    return HttpResponse.json(responseService);
  }),
];

/**
 * OpenAPI specification handlers
 * Supporting comprehensive API documentation retrieval per F-006
 */
export const openApiHandlers = [
  // Get OpenAPI specification for service
  http.get(`${API_ENDPOINTS.DOCS_API}/:serviceName`, async ({ params, request }) => {
    const { serviceName } = params;
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';
    
    // Simulate different response times based on service complexity
    const service = MOCK_SERVICES[serviceName as string];
    if (!service) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: `Documentation not found for service '${serviceName}'`,
          },
        },
        { status: 404 }
      );
    }
    
    // Simulate processing time based on service endpoint count
    const processingDelay = service.endpoints && service.endpoints.length > 20 
      ? NETWORK_DELAYS.SLOW 
      : NETWORK_DELAYS.NORMAL;
    await delay(processingDelay);
    
    let spec: OpenAPISpecification;
    switch (serviceName) {
      case 'database-mysql':
        spec = MYSQL_OPENAPI_SPEC;
        break;
      case 'database-postgresql':
        spec = {
          ...MYSQL_OPENAPI_SPEC,
          info: {
            ...MYSQL_OPENAPI_SPEC.info,
            title: 'PostgreSQL Analytics Database API',
            description: 'Auto-generated REST API for PostgreSQL analytics operations',
            'x-dreamfactory-service': 'database-postgresql',
          },
          servers: [{ url: '/api/v2/database-postgresql', description: 'PostgreSQL Database Service' }],
        };
        break;
      case 'email-service':
        spec = EMAIL_OPENAPI_SPEC;
        break;
      default:
        return HttpResponse.json(
          {
            error: {
              code: 404,
              message: `OpenAPI specification not available for service '${serviceName}'`,
            },
          },
          { status: 404 }
        );
    }
    
    // Support different response formats
    if (format === 'yaml') {
      // For YAML format, return a simple YAML string representation
      const yamlContent = `openapi: "${spec.openapi}"\ninfo:\n  title: "${spec.info.title}"\n  version: "${spec.info.version}"`;
      return new HttpResponse(yamlContent, {
        headers: {
          'Content-Type': 'application/x-yaml',
        },
      });
    }
    
    return HttpResponse.json(spec, {
      headers: {
        'Content-Type': HTTP_HEADERS.CONTENT_TYPE,
        'Cache-Control': 'max-age=600', // Cache for 10 minutes
        'X-Generated-At': new Date().toISOString(),
      },
    });
  }),

  // Generate OpenAPI specification for new/modified service
  http.post(`${API_ENDPOINTS.DOCS_API}/:serviceName/generate`, async ({ params, request }) => {
    const { serviceName } = params;
    
    // Simulate OpenAPI generation processing time
    await delay(NETWORK_DELAYS.VERY_SLOW);
    
    const service = MOCK_SERVICES[serviceName as string];
    if (!service) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: `Service '${serviceName}' not found`,
          },
        },
        { status: 404 }
      );
    }
    
    // Simulate generation process
    const generationSuccess = Math.random() > 0.1; // 90% success rate
    
    if (!generationSuccess) {
      return HttpResponse.json(
        {
          error: {
            code: 500,
            message: 'OpenAPI specification generation failed',
            details: [
              {
                message: 'Database connection timeout during schema introspection',
                code: 5001,
              },
            ],
          },
        },
        { status: 500 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      message: 'OpenAPI specification generated successfully',
      url: `${API_ENDPOINTS.DOCS_API}/${serviceName}`,
      timestamp: new Date().toISOString(),
      endpoints_generated: service.endpoints?.length || 0,
    });
  }),
];

/**
 * API documentation data handlers
 * Supporting API documentation browsing and searching per F-006
 */
export const apiDocHandlers = [
  // Get API documentation list for service
  http.get(`${API_ENDPOINTS.SERVICE_API}/:serviceName/_doc`, async ({ params, request }) => {
    const { serviceName } = params;
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('search') || '';
    const groupFilter = url.searchParams.get('group');
    
    await delay(NETWORK_DELAYS.NORMAL);
    
    const service = MOCK_SERVICES[serviceName as string];
    if (!service || !service.apiDocumentation?.hasDocumentation) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: `API documentation not available for service '${serviceName}'`,
          },
        },
        { status: 404 }
      );
    }
    
    // Generate mock API documentation data based on service endpoints
    const apiDocs: ApiDocsRowData[] = (service.endpoints || []).map((endpoint, index) => ({
      name: endpoint.operationId || `${endpoint.method.toLowerCase()}${endpoint.path.replace(/\//g, '_')}`,
      label: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
      description: endpoint.description || `${endpoint.method} operation for ${endpoint.path}`,
      group: endpoint.tags?.[0] || 'General',
      type: 'REST',
      endpoint: endpoint.path,
      method: endpoint.method,
      parameters: [
        {
          name: 'limit',
          type: 'integer',
          required: false,
          description: 'Maximum number of records to return',
          example: 100,
        },
      ],
      responses: [
        {
          statusCode: 200,
          description: 'Successful operation',
          contentType: 'application/json',
          example: { success: true, data: [] },
        },
        {
          statusCode: 400,
          description: 'Bad request',
          contentType: 'application/json',
          example: { error: { code: 400, message: 'Bad Request' } },
        },
      ],
      lastModified: service.lastModifiedDate,
      version: service.apiDocumentation?.version,
      deprecated: endpoint.deprecated || false,
    }));
    
    // Apply search and filtering
    let filteredDocs = apiDocs;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredDocs = filteredDocs.filter(doc =>
        doc.name.toLowerCase().includes(searchLower) ||
        doc.label.toLowerCase().includes(searchLower) ||
        doc.description.toLowerCase().includes(searchLower)
      );
    }
    
    if (groupFilter) {
      filteredDocs = filteredDocs.filter(doc => doc.group === groupFilter);
    }
    
    return HttpResponse.json({
      resource: filteredDocs,
      meta: {
        count: filteredDocs.length,
        total: apiDocs.length,
        search_term: searchTerm,
        group_filter: groupFilter,
      },
    });
  }),
];

/**
 * Authentication and API key validation handlers
 * Supporting secure OpenAPI preview access per F-004
 */
export const authHandlers = [
  // Validate API key
  http.get(`${API_ENDPOINTS.SYSTEM_API}/session`, async ({ request }) => {
    await delay(NETWORK_DELAYS.FAST);
    
    const apiKey = request.headers.get(HTTP_HEADERS.API_KEY);
    const sessionToken = request.headers.get(HTTP_HEADERS.SESSION_TOKEN);
    
    if (!apiKey && !sessionToken) {
      return HttpResponse.json(
        {
          error: {
            code: 401,
            message: 'Authentication required - provide API key or session token',
          },
        },
        { status: 401 }
      );
    }
    
    // Validate API key
    if (apiKey) {
      const keyInfo = MOCK_API_KEYS[apiKey];
      
      if (!keyInfo) {
        return HttpResponse.json(
          {
            error: {
              code: 401,
              message: 'Invalid API key',
            },
          },
          { status: 401 }
        );
      }
      
      if (!keyInfo.isActive) {
        return HttpResponse.json(
          {
            error: {
              code: 401,
              message: 'API key is inactive or expired',
            },
          },
          { status: 401 }
        );
      }
      
      // Check expiration
      if (keyInfo.expiresAt && new Date(keyInfo.expiresAt) < new Date()) {
        return HttpResponse.json(
          {
            error: {
              code: 401,
              message: 'API key has expired',
            },
          },
          { status: 401 }
        );
      }
      
      return HttpResponse.json({
        success: true,
        session_token: keyInfo.sessionToken || `session-${Date.now()}`,
        session_id: `session-${keyInfo.id}`,
        api_key: keyInfo.key,
        expires_in: 3600, // 1 hour
        user: {
          id: 1,
          email: 'api-user@example.com',
          name: keyInfo.name,
          is_sys_admin: false,
        },
        permissions: keyInfo.permissions,
      });
    }
    
    // Validate session token (simplified)
    return HttpResponse.json({
      success: true,
      session_token: sessionToken,
      session_id: `session-from-token`,
      expires_in: 3600,
      user: {
        id: 1,
        email: 'session-user@example.com',
        name: 'Session User',
        is_sys_admin: false,
      },
    });
  }),

  // API key information endpoint
  http.get(`${API_ENDPOINTS.SYSTEM_API}/api_key/:keyId`, async ({ params, request }) => {
    await delay(NETWORK_DELAYS.FAST);
    
    const { keyId } = params;
    const apiKey = request.headers.get(HTTP_HEADERS.API_KEY);
    
    // Find key by ID or value
    const keyInfo = Object.values(MOCK_API_KEYS).find(
      key => key.id === keyId || key.key === apiKey
    );
    
    if (!keyInfo) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: 'API key not found',
          },
        },
        { status: 404 }
      );
    }
    
    // Return key info without sensitive data
    const { key, ...safeKeyInfo } = keyInfo;
    return HttpResponse.json(safeKeyInfo);
  }),
];

/**
 * Error simulation handlers for comprehensive testing scenarios
 * Supporting Section 4.4.2.2 Enhanced Testing Pipeline requirements
 */
export const errorSimulationHandlers = [
  // Simulate network timeout
  http.get(`${API_ENDPOINTS.DOCS_API}/timeout-test`, async () => {
    await delay(NETWORK_DELAYS.TIMEOUT);
    return HttpResponse.json(
      {
        error: {
          code: 408,
          message: 'Request timeout',
        },
      },
      { status: 408 }
    );
  }),

  // Simulate server error
  http.get(`${API_ENDPOINTS.DOCS_API}/error-test`, async () => {
    await delay(NETWORK_DELAYS.NORMAL);
    return HttpResponse.json(
      {
        error: {
          code: 500,
          message: 'Internal server error during OpenAPI generation',
          details: [
            {
              message: 'Database schema introspection failed',
              code: 5001,
            },
            {
              message: 'Unable to generate OpenAPI paths for complex relationships',
              code: 5002,
            },
          ],
        },
      },
      { status: 500 }
    );
  }),

  // Simulate validation errors
  http.post(`${API_ENDPOINTS.DOCS_API}/validation-test`, async () => {
    await delay(NETWORK_DELAYS.NORMAL);
    return HttpResponse.json(
      {
        error: {
          code: 400,
          message: 'OpenAPI specification validation failed',
          details: [
            {
              message: 'Invalid OpenAPI version format',
              code: 4001,
              path: 'openapi',
            },
            {
              message: 'Required field "info.title" is missing',
              code: 4002,
              path: 'info.title',
            },
            {
              message: 'Invalid server URL format',
              code: 4003,
              path: 'servers[0].url',
            },
          ],
        },
      },
      { status: 400 }
    );
  }),

  // Simulate rate limiting
  http.get(`${API_ENDPOINTS.DOCS_API}/rate-limit-test`, async ({ request }) => {
    await delay(NETWORK_DELAYS.FAST);
    
    const apiKey = request.headers.get(HTTP_HEADERS.API_KEY);
    const keyInfo = apiKey ? MOCK_API_KEYS[apiKey] : null;
    
    // Simulate rate limit based on API key configuration
    if (keyInfo?.rateLimit) {
      return HttpResponse.json(
        {
          error: {
            code: 429,
            message: 'Rate limit exceeded',
            details: [
              {
                message: `Rate limit: ${keyInfo.rateLimit.requestsPerMinute} requests per minute`,
                code: 4291,
              },
            ],
          },
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': keyInfo.rateLimit.requestsPerMinute.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.floor(Date.now() / 1000 + 60).toString(),
          },
        }
      );
    }
    
    return HttpResponse.json({ success: true });
  }),
];

/**
 * Performance testing handlers
 * Supporting React/Next.js Integration Requirements performance benchmarks
 */
export const performanceHandlers = [
  // Fast response simulation (cache hit)
  http.get(`${API_ENDPOINTS.DOCS_API}/fast-response`, async () => {
    await delay(NETWORK_DELAYS.INSTANT);
    return HttpResponse.json(
      { message: 'Fast cached response', timestamp: Date.now() },
      {
        headers: {
          'Cache-Control': 'max-age=3600',
          'X-Cache': 'HIT',
        },
      }
    );
  }),

  // Slow response simulation (large specification)
  http.get(`${API_ENDPOINTS.DOCS_API}/large-spec`, async () => {
    await delay(NETWORK_DELAYS.VERY_SLOW);
    
    // Generate a large mock specification
    const largeSpec = {
      ...MYSQL_OPENAPI_SPEC,
      paths: Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [
          `/table_${i}`,
          MYSQL_OPENAPI_SPEC.paths['/users'],
        ])
      ),
    };
    
    return HttpResponse.json(largeSpec, {
      headers: {
        'Content-Length': JSON.stringify(largeSpec).length.toString(),
        'X-Processing-Time': NETWORK_DELAYS.VERY_SLOW.toString(),
      },
    });
  }),
];

// ============================================================================
// Handler Collections and Exports
// ============================================================================

/**
 * Complete collection of MSW handlers for OpenAPI preview testing
 * Organized by functionality for selective import and testing scenarios
 */
export const openApiPreviewHandlers = [
  ...serviceHandlers,
  ...openApiHandlers,
  ...apiDocHandlers,
  ...authHandlers,
  ...errorSimulationHandlers,
  ...performanceHandlers,
];

/**
 * Essential handlers for basic OpenAPI preview functionality
 * Minimum set required for component testing and development
 */
export const coreHandlers = [
  ...serviceHandlers,
  ...openApiHandlers,
  ...authHandlers,
];

/**
 * Error testing handlers for comprehensive edge case coverage
 * Supporting 90%+ test coverage requirements per Section 4.4.2.2
 */
export const errorHandlers = [
  ...errorSimulationHandlers,
];

/**
 * Performance testing handlers for benchmarking and optimization
 * Supporting React/Next.js Integration Requirements performance targets
 */
export const perfHandlers = [
  ...performanceHandlers,
];

/**
 * Authentication testing handlers for security validation
 * Supporting F-004 API Security Configuration requirements
 */
export const securityHandlers = [
  ...authHandlers,
];

// Export default handlers for convenient import
export default openApiPreviewHandlers;

/**
 * Export mock data for direct testing use
 */
export {
  MOCK_SERVICES,
  MYSQL_OPENAPI_SPEC,
  EMAIL_OPENAPI_SPEC,
  MOCK_API_KEYS,
  NETWORK_DELAYS,
  API_ENDPOINTS,
  HTTP_HEADERS,
};

/**
 * Utility function to create test-specific API responses
 * Enables dynamic response generation for custom test scenarios
 */
export function createMockApiResponse<T>(
  data: T,
  options: {
    delay?: number;
    status?: number;
    headers?: Record<string, string>;
  } = {}
): Promise<HttpResponse> {
  const { delay: responseDelay = NETWORK_DELAYS.NORMAL, status = 200, headers = {} } = options;
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        HttpResponse.json(data, {
          status,
          headers: {
            'Content-Type': HTTP_HEADERS.CONTENT_TYPE,
            ...headers,
          },
        })
      );
    }, responseDelay);
  });
}

/**
 * Utility function to validate OpenAPI specification structure
 * Supporting F-006 API Documentation and Testing validation requirements
 */
export function validateOpenApiSpec(spec: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (typeof spec !== 'object' || spec === null) {
    errors.push({
      path: 'root',
      message: 'OpenAPI specification must be an object',
      code: 'INVALID_TYPE',
      severity: 'error',
    });
    return errors;
  }
  
  const specObj = spec as Record<string, unknown>;
  
  // Check required fields
  if (!specObj.openapi) {
    errors.push({
      path: 'openapi',
      message: 'OpenAPI version is required',
      code: 'MISSING_REQUIRED',
      severity: 'error',
    });
  }
  
  if (!specObj.info) {
    errors.push({
      path: 'info',
      message: 'Info object is required',
      code: 'MISSING_REQUIRED',
      severity: 'error',
    });
  }
  
  if (!specObj.paths) {
    errors.push({
      path: 'paths',
      message: 'Paths object is required',
      code: 'MISSING_REQUIRED',
      severity: 'error',
    });
  }
  
  return errors;
}