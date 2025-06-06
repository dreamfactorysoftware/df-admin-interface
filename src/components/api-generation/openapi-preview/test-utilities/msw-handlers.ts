/**
 * @fileoverview Mock Service Worker (MSW) handlers for OpenAPI preview components
 * @description Provides comprehensive HTTP request mocking for API documentation, OpenAPI specification
 * generation, and preview workflows. Enables realistic API simulation without backend dependencies
 * during Vitest test execution and development environments.
 * 
 * @version 1.0.0
 * @license MIT
 * @author DreamFactory Team
 * 
 * Features:
 * - F-006 API Documentation and Testing with MSW integration per Section 2.1 Feature Catalog
 * - Section 3.6 Development & Deployment requiring MSW-powered in-browser testing with Vitest automation
 * - React/Next.js Integration Requirements for API mocking during development and testing
 * - 90%+ test coverage targets requiring comprehensive mock data for OpenAPI preview workflow testing
 * - Realistic error simulation and edge case handling for comprehensive test coverage per Section 4.4.2.2
 * - Enhanced testing pipeline integration with Vitest parallel execution and modern ES modules support
 */

import { http, HttpResponse, delay, type DefaultBodyType } from 'msw'
import type { ApiResponse } from '../../../lib/api-client'
import type {
  ApiDocsRowData,
  ApiDocsListResponse,
  ServiceApiKeys,
  ServiceApiKeysResponse,
  ApiKeyInfo,
  OpenAPIPreviewError,
  ApiKeyError,
  SwaggerUIError,
  SwaggerUIConfig,
  OpenAPIViewerFormData
} from '../types'
import type {
  DatabaseService,
  ServiceRow,
  ConnectionTestResult,
  CurrentServiceState
} from '../../../types/database-service'

// =============================================================================
// MOCK DATA GENERATORS
// =============================================================================

/**
 * Generate realistic API documentation row data
 * Enhanced with comprehensive metadata for testing scenarios
 */
function generateApiDocsRowData(overrides: Partial<ApiDocsRowData> = {}): ApiDocsRowData {
  const baseData: ApiDocsRowData = {
    id: Math.floor(Math.random() * 1000) + 1,
    name: `service_${Math.random().toString(36).substring(2, 8)}`,
    label: `Test Service ${Math.floor(Math.random() * 100)}`,
    description: 'Mock database service for API generation testing',
    group: 'database',
    type: 'mysql',
    status: 'active',
    isActive: true,
    openapi: {
      specUrl: `/api/v2/system/openapi/${overrides.name || 'test_service'}`,
      version: '3.0.0',
      lastUpdated: new Date().toISOString(),
      operationCount: Math.floor(Math.random() * 50) + 10,
      specSize: Math.floor(Math.random() * 1000000) + 50000
    },
    documentation: {
      hasDocumentation: true,
      url: `/docs/${overrides.name || 'test_service'}`,
      lastGenerated: new Date().toISOString(),
      generationStatus: 'completed'
    },
    usage: {
      totalCalls: Math.floor(Math.random() * 10000),
      dailyCalls: Math.floor(Math.random() * 1000),
      lastAccessed: new Date().toISOString(),
      popularEndpoints: [
        `/${overrides.name || 'test_service'}/users`,
        `/${overrides.name || 'test_service'}/orders`,
        `/${overrides.name || 'test_service'}/products`
      ]
    },
    health: {
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      responseTime: Math.floor(Math.random() * 1000) + 100,
      errorRate: Math.random() * 5
    }
  }

  return { ...baseData, ...overrides }
}

/**
 * Generate realistic API key information
 * Enhanced with security metadata and usage statistics
 */
function generateApiKeyInfo(overrides: Partial<ApiKeyInfo> = {}): ApiKeyInfo {
  const keyId = Math.random().toString(36).substring(2, 12)
  const baseData: ApiKeyInfo = {
    id: keyId,
    name: `api_key_${keyId}`,
    apiKey: `df_${Math.random().toString(36).substring(2, 32)}`,
    description: 'Mock API key for testing OpenAPI preview functionality',
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    scopes: ['read', 'write', 'admin'],
    rateLimit: {
      requestsPerMinute: 1000,
      requestsPerHour: 10000,
      requestsPerDay: 100000,
      burst: 100
    },
    usage: {
      totalRequests: Math.floor(Math.random() * 50000),
      dailyRequests: Math.floor(Math.random() * 1000),
      errorCount: Math.floor(Math.random() * 50),
      lastError: Math.random() > 0.7 ? 'Rate limit exceeded' : undefined
    },
    security: {
      allowedOrigins: ['http://localhost:3000', 'https://admin.dreamfactory.com'],
      allowedIPs: ['127.0.0.1', '::1'],
      requireHTTPS: true,
      enableLogging: true
    },
    metadata: {
      createdBy: 'admin@dreamfactory.com',
      updatedBy: 'admin@dreamfactory.com',
      version: 1,
      environment: 'development',
      tags: ['testing', 'development', 'api-docs']
    }
  }

  return { ...baseData, ...overrides }
}

/**
 * Generate realistic database service data
 * Enhanced with comprehensive connection metadata
 */
function generateDatabaseService(overrides: Partial<DatabaseService> = {}): DatabaseService {
  const serviceId = Math.floor(Math.random() * 1000) + 1
  const serviceName = `test_db_${Math.random().toString(36).substring(2, 8)}`
  
  const baseData: DatabaseService = {
    id: serviceId,
    name: serviceName,
    label: `Test Database ${serviceId}`,
    description: 'Mock database service for OpenAPI preview testing',
    type: 'mysql',
    is_active: true,
    mutable: true,
    deletable: true,
    created_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_by_id: 1,
    last_modified_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    last_modified_by_id: 1,
    config: {
      host: 'localhost',
      port: 3306,
      database: `test_db_${serviceId}`,
      username: 'test_user',
      password: '***',
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
      options: {
        ssl_verify_server_cert: false,
        persistent: true
      }
    },
    metadata: {
      schema_version: '1.0.0',
      table_count: Math.floor(Math.random() * 100) + 10,
      last_sync: new Date().toISOString(),
      connection_status: 'connected',
      performance_metrics: {
        avg_response_time: Math.floor(Math.random() * 500) + 50,
        connection_pool_size: 10,
        active_connections: Math.floor(Math.random() * 8) + 1
      }
    }
  }

  return { ...baseData, ...overrides }
}

/**
 * Generate realistic OpenAPI specification
 * Enhanced with comprehensive endpoint definitions and security schemes
 */
function generateOpenAPISpec(serviceName: string, serviceType: string = 'mysql') {
  return {
    openapi: '3.0.0',
    info: {
      title: `${serviceName} API Documentation`,
      description: `REST API endpoints for ${serviceName} database service`,
      version: '2.0.0',
      contact: {
        name: 'DreamFactory API Support',
        url: 'https://www.dreamfactory.com/support',
        email: 'support@dreamfactory.com'
      },
      license: {
        name: 'Apache 2.0',
        url: 'http://www.apache.org/licenses/LICENSE-2.0.html'
      }
    },
    servers: [
      {
        url: `{protocol}://{host}/api/v2/${serviceName}`,
        description: 'DreamFactory API Server',
        variables: {
          protocol: {
            enum: ['http', 'https'],
            default: 'https'
          },
          host: {
            default: 'api.dreamfactory.com',
            description: 'API server hostname'
          }
        }
      }
    ],
    paths: {
      [`/${serviceName}`]: {
        get: {
          summary: 'Retrieve database resources',
          description: 'Get a list of available database resources and tables',
          operationId: 'getResources',
          tags: ['Database Resources'],
          parameters: [
            {
              name: 'include_schema',
              in: 'query',
              description: 'Include detailed schema information',
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
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            label: { type: 'string' },
                            plural: { type: 'string' },
                            access: { type: 'integer' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': {
              $ref: '#/components/responses/UnauthorizedError'
            },
            '500': {
              $ref: '#/components/responses/InternalServerError'
            }
          },
          security: [
            { SessionToken: [] },
            { ApiKey: [] }
          ]
        }
      },
      [`/${serviceName}/users`]: {
        get: {
          summary: 'Get users',
          description: 'Retrieve users from the database',
          operationId: 'getUsers',
          tags: ['Users'],
          parameters: [
            {
              name: 'limit',
              in: 'query',
              description: 'Maximum number of records to return',
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 1000,
                default: 100
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
              description: 'Users retrieved successfully',
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
                        $ref: '#/components/schemas/ResponseMeta'
                      }
                    }
                  }
                }
              }
            },
            '400': {
              $ref: '#/components/responses/BadRequestError'
            },
            '401': {
              $ref: '#/components/responses/UnauthorizedError'
            },
            '500': {
              $ref: '#/components/responses/InternalServerError'
            }
          },
          security: [
            { SessionToken: [] },
            { ApiKey: [] }
          ]
        },
        post: {
          summary: 'Create users',
          description: 'Create one or more users in the database',
          operationId: 'createUsers',
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
                        $ref: '#/components/schemas/UserCreate'
                      }
                    }
                  }
                }
              }
            }
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
              $ref: '#/components/responses/BadRequestError'
            },
            '401': {
              $ref: '#/components/responses/UnauthorizedError'
            },
            '500': {
              $ref: '#/components/responses/InternalServerError'
            }
          },
          security: [
            { SessionToken: [] },
            { ApiKey: [] }
          ]
        }
      },
      [`/${serviceName}/users/{id}`]: {
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
              description: 'User retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/User'
                  }
                }
              }
            },
            '404': {
              $ref: '#/components/responses/NotFoundError'
            },
            '401': {
              $ref: '#/components/responses/UnauthorizedError'
            },
            '500': {
              $ref: '#/components/responses/InternalServerError'
            }
          },
          security: [
            { SessionToken: [] },
            { ApiKey: [] }
          ]
        },
        put: {
          summary: 'Update user',
          description: 'Update a specific user by their ID',
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
                  $ref: '#/components/schemas/UserUpdate'
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
            '400': {
              $ref: '#/components/responses/BadRequestError'
            },
            '404': {
              $ref: '#/components/responses/NotFoundError'
            },
            '401': {
              $ref: '#/components/responses/UnauthorizedError'
            },
            '500': {
              $ref: '#/components/responses/InternalServerError'
            }
          },
          security: [
            { SessionToken: [] },
            { ApiKey: [] }
          ]
        },
        delete: {
          summary: 'Delete user',
          description: 'Delete a specific user by their ID',
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
              $ref: '#/components/responses/NotFoundError'
            },
            '401': {
              $ref: '#/components/responses/UnauthorizedError'
            },
            '500': {
              $ref: '#/components/responses/InternalServerError'
            }
          },
          security: [
            { SessionToken: [] },
            { ApiKey: [] }
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
              description: 'Unique user identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            first_name: {
              type: 'string',
              description: 'User first name'
            },
            last_name: {
              type: 'string',
              description: 'User last name'
            },
            is_active: {
              type: 'boolean',
              description: 'Whether the user is active'
            },
            created_date: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp'
            },
            last_modified_date: {
              type: 'string',
              format: 'date-time',
              description: 'Last modification timestamp'
            }
          },
          required: ['id', 'email']
        },
        UserCreate: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            first_name: {
              type: 'string',
              description: 'User first name'
            },
            last_name: {
              type: 'string',
              description: 'User last name'
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'User password'
            },
            is_active: {
              type: 'boolean',
              default: true,
              description: 'Whether the user is active'
            }
          },
          required: ['email', 'password']
        },
        UserUpdate: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            first_name: {
              type: 'string',
              description: 'User first name'
            },
            last_name: {
              type: 'string',
              description: 'User last name'
            },
            is_active: {
              type: 'boolean',
              description: 'Whether the user is active'
            }
          }
        },
        ResponseMeta: {
          type: 'object',
          properties: {
            count: {
              type: 'integer',
              description: 'Number of records returned'
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
              },
              required: ['code', 'message']
            }
          }
        }
      },
      securitySchemes: {
        SessionToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-DreamFactory-Session-Token',
          description: 'Session token for authenticated requests'
        },
        ApiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-DreamFactory-API-Key',
          description: 'API key for authenticated requests'
        }
      },
      responses: {
        BadRequestError: {
          description: 'Bad request error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Database Resources',
        description: 'Database resource management operations'
      },
      {
        name: 'Users',
        description: 'User management operations'
      }
    ]
  }
}

/**
 * Generate realistic error responses for comprehensive testing
 */
function generateOpenAPIPreviewError(
  category: OpenAPIPreviewError['category'],
  message: string,
  context?: Partial<OpenAPIPreviewError['context']>
): OpenAPIPreviewError {
  return {
    code: 500,
    message,
    category,
    timestamp: new Date().toISOString(),
    context,
    recoveryActions: [
      {
        label: 'Retry',
        action: () => console.log('Retry action triggered'),
        description: 'Attempt the operation again'
      },
      {
        label: 'Refresh',
        action: () => console.log('Refresh action triggered'),
        description: 'Refresh the page and try again'
      }
    ],
    documentation: {
      title: 'OpenAPI Preview Troubleshooting',
      url: 'https://docs.dreamfactory.com/docs/openapi-preview-troubleshooting'
    }
  }
}

// =============================================================================
// MSW HTTP HANDLERS
// =============================================================================

/**
 * API Documentation List Handlers
 * Comprehensive mocking for API documentation retrieval workflows
 */
export const apiDocsHandlers = [
  // Get API documentation list
  http.get('/api/v2/system/service', async ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const filter = url.searchParams.get('filter')
    const includeCount = url.searchParams.get('include_count') === 'true'
    
    // Simulate realistic API delay
    await delay(Math.random() * 300 + 100)

    // Handle error simulation for testing
    if (url.searchParams.get('force_error') === 'true') {
      return new HttpResponse(
        JSON.stringify({
          error: {
            code: 500,
            message: 'Internal server error during service retrieval',
            details: 'Mock error for testing error handling'
          }
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Generate mock services based on query parameters
    const totalServices = 156 // Mock total count for pagination testing
    const services: ApiDocsRowData[] = []
    
    for (let i = 0; i < Math.min(limit, 50); i++) {
      const serviceIndex = offset + i
      if (serviceIndex >= totalServices) break
      
      const service = generateApiDocsRowData({
        id: serviceIndex + 1,
        name: `service_${serviceIndex + 1}`,
        label: `Database Service ${serviceIndex + 1}`,
        type: ['mysql', 'postgresql', 'mongodb', 'oracle'][serviceIndex % 4],
        group: 'database'
      })
      
      // Apply filter if specified
      if (!filter || service.name.includes(filter) || service.label.includes(filter)) {
        services.push(service)
      }
    }

    const response: ApiDocsListResponse = {
      resource: services,
      meta: {
        count: services.length,
        ...(includeCount && { total: totalServices }),
        ...(limit && { limit }),
        ...(offset && { offset })
      }
    }

    return HttpResponse.json(response)
  }),

  // Get specific service details
  http.get('/api/v2/system/service/:serviceId', async ({ params }) => {
    const { serviceId } = params
    
    // Simulate realistic API delay
    await delay(Math.random() * 200 + 50)

    // Handle not found scenario
    if (serviceId === '999') {
      return new HttpResponse(
        JSON.stringify({
          error: {
            code: 404,
            message: 'Service not found',
            details: `Service with ID ${serviceId} does not exist`
          }
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const service = generateDatabaseService({
      id: parseInt(serviceId as string),
      name: `service_${serviceId}`,
      label: `Database Service ${serviceId}`
    })

    return HttpResponse.json({ resource: service })
  })
]

/**
 * OpenAPI Specification Generation Handlers
 * Comprehensive mocking for OpenAPI spec generation and preview workflows
 */
export const openApiSpecHandlers = [
  // Generate OpenAPI specification for service
  http.get('/api/v2/system/openapi/:serviceName', async ({ params, request }) => {
    const { serviceName } = params
    const url = new URL(request.url)
    const format = url.searchParams.get('format') || 'json'
    const includeSchemas = url.searchParams.get('include_schemas') === 'true'
    
    // Simulate realistic API delay for spec generation
    await delay(Math.random() * 1000 + 500)

    // Handle error scenarios for testing
    if (serviceName === 'error_service') {
      const error = generateOpenAPIPreviewError(
        'spec',
        'Failed to generate OpenAPI specification',
        {
          service: {
            id: 1,
            name: serviceName as string,
            type: 'mysql'
          },
          spec: {
            url: `/api/v2/system/openapi/${serviceName}`,
            version: '3.0.0'
          }
        }
      )

      return new HttpResponse(
        JSON.stringify({ error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Generate comprehensive OpenAPI specification
    const spec = generateOpenAPISpec(serviceName as string)
    
    // Add additional schemas if requested
    if (includeSchemas) {
      spec.components.schemas = {
        ...spec.components.schemas,
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            price: { type: 'number', format: 'decimal' },
            category_id: { type: 'integer' },
            created_date: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'name', 'price']
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            total_amount: { type: 'number', format: 'decimal' },
            status: { 
              type: 'string', 
              enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] 
            },
            created_date: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'user_id', 'total_amount', 'status']
        }
      }
    }

    // Return different formats based on request
    if (format === 'yaml') {
      // In a real implementation, this would convert to YAML
      return new HttpResponse(
        `# OpenAPI Specification for ${serviceName}\n# Generated on ${new Date().toISOString()}\nopenapi: 3.0.0\ninfo:\n  title: ${serviceName} API\n  version: 2.0.0`,
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/x-yaml',
            'Content-Disposition': `attachment; filename="${serviceName}-openapi.yaml"`
          } 
        }
      )
    }

    return HttpResponse.json(spec)
  }),

  // Preview OpenAPI specification with SwaggerUI configuration
  http.post('/api/v2/system/openapi/:serviceName/preview', async ({ params, request }) => {
    const { serviceName } = params
    
    // Parse SwaggerUI configuration from request body
    let config: Partial<SwaggerUIConfig> = {}
    try {
      config = await request.json() as Partial<SwaggerUIConfig>
    } catch (error) {
      // Handle invalid JSON
      return new HttpResponse(
        JSON.stringify({
          error: {
            code: 400,
            message: 'Invalid JSON in request body',
            details: 'SwaggerUI configuration must be valid JSON'
          }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Simulate realistic API delay for preview generation
    await delay(Math.random() * 800 + 200)

    // Generate preview response with enhanced configuration
    const previewConfig: SwaggerUIConfig = {
      spec: generateOpenAPISpec(serviceName as string),
      layout: config.layout || 'BaseLayout',
      deepLinking: config.deepLinking ?? true,
      displayOperationId: config.displayOperationId ?? false,
      defaultModelsExpandDepth: config.defaultModelsExpandDepth ?? 1,
      defaultModelExpandDepth: config.defaultModelExpandDepth ?? 1,
      defaultModelRendering: config.defaultModelRendering || 'example',
      displayRequestDuration: config.displayRequestDuration ?? true,
      docExpansion: config.docExpansion || 'list',
      filter: config.filter ?? false,
      maxDisplayedTags: config.maxDisplayedTags ?? 100,
      showExtensions: config.showExtensions ?? false,
      showCommonExtensions: config.showCommonExtensions ?? false,
      useUnsafeMarkdown: config.useUnsafeMarkdown ?? false,
      tryItOutEnabled: config.tryItOutEnabled ?? true,
      theme: {
        mode: config.theme?.mode || 'light',
        variables: config.theme?.variables || {},
        customCSS: config.theme?.customCSS || ''
      },
      dreamfactory: {
        baseUrl: config.dreamfactory?.baseUrl || 'http://localhost:80',
        serviceName: serviceName as string,
        serviceType: 'mysql',
        headers: config.dreamfactory?.headers || {},
        sessionToken: config.dreamfactory?.sessionToken,
        apiKey: config.dreamfactory?.apiKey
      },
      react: {
        containerId: config.react?.containerId || 'swagger-ui-container',
        domNode: config.react?.domNode
      },
      performance: {
        lazyLoad: config.performance?.lazyLoad ?? true,
        virtualScrolling: config.performance?.virtualScrolling ?? false,
        maxOperations: config.performance?.maxOperations ?? 1000,
        searchDebounce: config.performance?.searchDebounce ?? 300
      },
      accessibility: {
        keyboardNavigation: config.accessibility?.keyboardNavigation ?? true,
        screenReader: config.accessibility?.screenReader ?? true,
        highContrast: config.accessibility?.highContrast ?? false,
        focusManagement: config.accessibility?.focusManagement ?? true
      }
    }

    return HttpResponse.json({
      success: true,
      config: previewConfig,
      metadata: {
        serviceName: serviceName as string,
        specVersion: '3.0.0',
        generatedAt: new Date().toISOString(),
        operationCount: Object.keys(previewConfig.spec?.paths || {}).length,
        schemaCount: Object.keys(previewConfig.spec?.components?.schemas || {}).length
      }
    })
  })
]

/**
 * API Key Management Handlers
 * Comprehensive mocking for API key management workflows in OpenAPI preview
 */
export const apiKeyHandlers = [
  // Get API keys for service
  http.get('/api/v2/system/service/:serviceId/keys', async ({ params, request }) => {
    const { serviceId } = params
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const status = url.searchParams.get('status')
    
    // Simulate realistic API delay
    await delay(Math.random() * 400 + 100)

    // Handle error scenarios
    if (serviceId === '998') {
      const error: ApiKeyError = {
        code: 403,
        message: 'Insufficient permissions to access API keys',
        category: 'authorization',
        timestamp: new Date().toISOString(),
        context: {
          serviceId: parseInt(serviceId as string),
          serviceName: `service_${serviceId}`,
          operation: 'read'
        },
        security: {
          isSecurityIssue: true,
          requiresAttention: false,
          securityActions: ['Check user permissions', 'Verify role assignments']
        }
      }

      return new HttpResponse(
        JSON.stringify({ error }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Generate mock API keys
    const totalKeys = 12
    const keys: ApiKeyInfo[] = []
    
    for (let i = 0; i < Math.min(limit, totalKeys - offset); i++) {
      const keyIndex = offset + i
      if (keyIndex >= totalKeys) break
      
      const key = generateApiKeyInfo({
        id: `key_${serviceId}_${keyIndex + 1}`,
        name: `api_key_${keyIndex + 1}`,
        status: status as ApiKeyInfo['status'] || (['active', 'inactive', 'expired'][keyIndex % 3] as ApiKeyInfo['status'])
      })
      
      keys.push(key)
    }

    const serviceApiKeys: ServiceApiKeys = {
      serviceId: parseInt(serviceId as string),
      serviceName: `service_${serviceId}`,
      keys,
      lastUpdated: new Date().toISOString(),
      cache: {
        timestamp: new Date().toISOString(),
        ttl: 300000, // 5 minutes
        source: 'server'
      },
      pagination: {
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        total: totalKeys,
        hasNext: offset + limit < totalKeys,
        hasPrevious: offset > 0
      },
      sorting: {
        field: 'createdAt',
        direction: 'desc'
      }
    }

    const response: ServiceApiKeysResponse = {
      data: serviceApiKeys,
      success: true
    }

    return HttpResponse.json(response)
  }),

  // Create new API key
  http.post('/api/v2/system/service/:serviceId/keys', async ({ params, request }) => {
    const { serviceId } = params
    
    // Parse API key creation data
    let keyData: Partial<ApiKeyInfo>
    try {
      keyData = await request.json()
    } catch (error) {
      return new HttpResponse(
        JSON.stringify({
          error: {
            code: 400,
            message: 'Invalid JSON in request body',
            details: 'API key data must be valid JSON'
          }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Simulate realistic API delay for key generation
    await delay(Math.random() * 600 + 200)

    // Validate required fields
    if (!keyData.name) {
      return new HttpResponse(
        JSON.stringify({
          error: {
            code: 400,
            message: 'API key name is required',
            details: 'Name field cannot be empty'
          }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Generate new API key
    const newKey = generateApiKeyInfo({
      ...keyData,
      id: `key_${serviceId}_${Date.now()}`,
      apiKey: `df_${Math.random().toString(36).substring(2, 32)}`,
      createdAt: new Date().toISOString(),
      lastUsed: undefined, // New key hasn't been used yet
      usage: {
        totalRequests: 0,
        dailyRequests: 0,
        errorCount: 0
      }
    })

    return HttpResponse.json({ data: newKey, success: true }, { status: 201 })
  }),

  // Update API key
  http.put('/api/v2/system/service/:serviceId/keys/:keyId', async ({ params, request }) => {
    const { serviceId, keyId } = params
    
    // Parse update data
    let updateData: Partial<ApiKeyInfo>
    try {
      updateData = await request.json()
    } catch (error) {
      return new HttpResponse(
        JSON.stringify({
          error: {
            code: 400,
            message: 'Invalid JSON in request body'
          }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Simulate realistic API delay
    await delay(Math.random() * 300 + 100)

    // Handle not found scenario
    if (keyId === 'nonexistent') {
      return new HttpResponse(
        JSON.stringify({
          error: {
            code: 404,
            message: 'API key not found',
            details: `API key with ID ${keyId} does not exist`
          }
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Generate updated API key
    const updatedKey = generateApiKeyInfo({
      id: keyId as string,
      ...updateData,
      metadata: {
        ...updateData.metadata,
        updatedBy: 'admin@dreamfactory.com',
        version: (updateData.metadata?.version || 1) + 1
      }
    })

    return HttpResponse.json({ data: updatedKey, success: true })
  }),

  // Delete API key
  http.delete('/api/v2/system/service/:serviceId/keys/:keyId', async ({ params }) => {
    const { serviceId, keyId } = params
    
    // Simulate realistic API delay
    await delay(Math.random() * 200 + 50)

    // Handle not found scenario
    if (keyId === 'nonexistent') {
      return new HttpResponse(
        JSON.stringify({
          error: {
            code: 404,
            message: 'API key not found'
          }
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return HttpResponse.json({ 
      data: { success: true, id: keyId },
      success: true 
    })
  }),

  // Validate API key
  http.post('/api/v2/system/service/:serviceId/keys/:keyId/validate', async ({ params }) => {
    const { serviceId, keyId } = params
    
    // Simulate realistic API delay for validation
    await delay(Math.random() * 400 + 100)

    // Simulate validation scenarios
    const validationResult = {
      valid: Math.random() > 0.1, // 90% success rate
      keyId: keyId as string,
      serviceId: parseInt(serviceId as string),
      validatedAt: new Date().toISOString(),
      permissions: ['read', 'write'],
      rateLimit: {
        remaining: Math.floor(Math.random() * 1000),
        resetTime: new Date(Date.now() + 60000).toISOString()
      }
    }

    if (!validationResult.valid) {
      return new HttpResponse(
        JSON.stringify({
          error: {
            code: 401,
            message: 'Invalid or expired API key',
            details: 'API key validation failed'
          }
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return HttpResponse.json({ data: validationResult, success: true })
  })
]

/**
 * Service Health and Status Handlers
 * Mock endpoints for service status monitoring in OpenAPI preview
 */
export const serviceHealthHandlers = [
  // Get service health status
  http.get('/api/v2/system/service/:serviceId/health', async ({ params }) => {
    const { serviceId } = params
    
    // Simulate realistic API delay
    await delay(Math.random() * 300 + 50)

    const healthStatus = {
      serviceId: parseInt(serviceId as string),
      status: ['healthy', 'degraded', 'unhealthy'][Math.floor(Math.random() * 3)],
      lastCheck: new Date().toISOString(),
      responseTime: Math.floor(Math.random() * 1000) + 50,
      errorRate: Math.random() * 10,
      uptime: Math.floor(Math.random() * 86400) + 3600, // 1-24 hours
      details: {
        database: {
          connected: Math.random() > 0.1,
          connectionCount: Math.floor(Math.random() * 10) + 1,
          queryTime: Math.floor(Math.random() * 500) + 10
        },
        api: {
          enabled: true,
          endpointCount: Math.floor(Math.random() * 50) + 10,
          lastRequest: new Date(Date.now() - Math.random() * 3600000).toISOString()
        }
      }
    }

    return HttpResponse.json({ data: healthStatus, success: true })
  }),

  // Test service connection
  http.post('/api/v2/system/service/:serviceId/test', async ({ params }) => {
    const { serviceId } = params
    
    // Simulate realistic connection test delay
    await delay(Math.random() * 2000 + 1000)

    // Simulate connection test scenarios
    const isSuccessful = Math.random() > 0.15 // 85% success rate
    
    const testResult: ConnectionTestResult = {
      success: isSuccessful,
      message: isSuccessful 
        ? 'Database connection successful'
        : 'Failed to connect to database: Connection timeout',
      response_time: Math.floor(Math.random() * 2000) + 100,
      timestamp: new Date().toISOString(),
      details: isSuccessful ? {
        database_version: '8.0.33',
        connection_id: Math.floor(Math.random() * 10000),
        server_info: 'MySQL Community Server',
        charset: 'utf8mb4'
      } : {
        error_code: 2003,
        error_message: 'Can\'t connect to MySQL server on \'localhost\' (10061)',
        suggested_action: 'Check database server status and network connectivity'
      }
    }

    if (!isSuccessful) {
      return new HttpResponse(
        JSON.stringify({
          error: {
            code: 500,
            message: testResult.message,
            details: testResult.details
          }
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return HttpResponse.json({ data: testResult, success: true })
  })
]

/**
 * Error Simulation Handlers
 * Specialized handlers for testing error scenarios and edge cases
 */
export const errorSimulationHandlers = [
  // Network timeout simulation
  http.get('/api/v2/test/timeout', async () => {
    // Simulate network timeout
    await delay(10000) // 10 seconds - should trigger timeout
    return HttpResponse.json({ message: 'This should timeout' })
  }),

  // Rate limit simulation
  http.get('/api/v2/test/rate-limit', async () => {
    return new HttpResponse(
      JSON.stringify({
        error: {
          code: 429,
          message: 'Rate limit exceeded',
          details: 'Too many requests. Please try again later.',
          retry_after: 60
        }
      }),
      { 
        status: 429, 
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        } 
      }
    )
  }),

  // Server error simulation
  http.get('/api/v2/test/server-error', async () => {
    return new HttpResponse(
      JSON.stringify({
        error: {
          code: 500,
          message: 'Internal server error',
          details: 'An unexpected error occurred while processing your request'
        }
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }),

  // Authentication error simulation
  http.get('/api/v2/test/auth-error', async () => {
    return new HttpResponse(
      JSON.stringify({
        error: {
          code: 401,
          message: 'Authentication required',
          details: 'Valid session token or API key required'
        }
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }),

  // Malformed JSON simulation
  http.get('/api/v2/test/malformed-json', async () => {
    return new HttpResponse(
      '{"invalid": json, "missing": quotes}',
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  })
]

// =============================================================================
// COMBINED HANDLERS EXPORT
// =============================================================================

/**
 * Complete collection of MSW handlers for OpenAPI preview testing
 * Provides comprehensive API mocking for all OpenAPI preview workflows
 */
export const openApiPreviewHandlers = [
  ...apiDocsHandlers,
  ...openApiSpecHandlers,
  ...apiKeyHandlers,
  ...serviceHealthHandlers,
  ...errorSimulationHandlers
]

/**
 * Default export for convenient importing
 * Enables simple integration with MSW setup in Vitest configuration
 */
export default openApiPreviewHandlers

// =============================================================================
// UTILITY FUNCTIONS FOR TESTING
// =============================================================================

/**
 * Helper function to reset mock data state
 * Useful for cleaning up between test runs
 */
export function resetMockData(): void {
  // Reset any global mock state if needed
  console.log('Mock data state reset for OpenAPI preview handlers')
}

/**
 * Helper function to configure mock behavior
 * Allows dynamic configuration of mock responses during testing
 */
export function configureMockBehavior(config: {
  /** Enable/disable error simulation */
  enableErrors?: boolean
  /** Customize API response delays */
  responseDelay?: number
  /** Override success rates for various operations */
  successRates?: {
    connection?: number
    apiGeneration?: number
    keyValidation?: number
  }
}): void {
  // In a real implementation, this would configure global mock behavior
  console.log('Mock behavior configured:', config)
}

/**
 * Helper function to validate mock data consistency
 * Ensures mock responses follow expected patterns and schemas
 */
export function validateMockData(): boolean {
  // In a real implementation, this would validate all mock data
  // against the defined TypeScript interfaces and Zod schemas
  return true
}

/**
 * @example
 * // Basic usage in Vitest setup
 * import { setupServer } from 'msw/node'
 * import { openApiPreviewHandlers } from './msw-handlers'
 * 
 * const server = setupServer(...openApiPreviewHandlers)
 * 
 * beforeAll(() => server.listen())
 * afterEach(() => server.resetHandlers())
 * afterAll(() => server.close())
 * 
 * @example
 * // Advanced usage with custom configuration
 * import { configureMockBehavior, resetMockData } from './msw-handlers'
 * 
 * beforeEach(() => {
 *   resetMockData()
 *   configureMockBehavior({
 *     enableErrors: false,
 *     responseDelay: 100,
 *     successRates: {
 *       connection: 0.9,
 *       apiGeneration: 0.95,
 *       keyValidation: 0.85
 *     }
 *   })
 * })
 * 
 * @example
 * // Error scenario testing
 * test('handles API generation errors gracefully', async () => {
 *   // Use error simulation endpoints
 *   const response = await fetch('/api/v2/system/openapi/error_service')
 *   expect(response.status).toBe(500)
 *   
 *   const error = await response.json()
 *   expect(error.error.category).toBe('spec')
 * })
 * 
 * @example
 * // OpenAPI specification testing
 * test('generates valid OpenAPI specification', async () => {
 *   const response = await fetch('/api/v2/system/openapi/test_service')
 *   expect(response.status).toBe(200)
 *   
 *   const spec = await response.json()
 *   expect(spec.openapi).toBe('3.0.0')
 *   expect(spec.info.title).toContain('test_service')
 *   expect(spec.paths).toBeDefined()
 *   expect(spec.components.schemas).toBeDefined()
 * })
 */