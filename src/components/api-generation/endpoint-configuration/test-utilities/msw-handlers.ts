/**
 * Mock Service Worker (MSW) Handlers for Endpoint Configuration Testing
 * 
 * Comprehensive HTTP request handlers for API mocking during development and testing
 * of endpoint configuration components. Defines realistic API simulation patterns
 * for endpoint operations, parameter validation, security configuration, and OpenAPI
 * generation workflows enabling isolated frontend testing without backend dependencies.
 * 
 * Features:
 * - Complete endpoint configuration CRUD operations with realistic response simulation
 * - Parameter validation and configuration with comprehensive error handling
 * - Security scheme assignment and authentication workflow testing
 * - OpenAPI specification generation and preview simulation
 * - Real-time validation feedback with configurable latency simulation
 * - Comprehensive error scenarios and edge case handling for robust test coverage
 * 
 * Technical Implementation:
 * - MSW 2.4.0+ HTTP request handlers with type-safe response structures
 * - Realistic database-backed endpoint simulation with in-memory state management
 * - Configurable response delays for performance testing and UX validation
 * - Comprehensive error simulation including network failures and validation errors
 * - Integration with Vitest testing framework for automated endpoint configuration testing
 * 
 * @fileoverview MSW handlers for endpoint configuration component testing
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, MSW 2.4.0+
 */

import { http, HttpResponse, delay } from 'msw';
import type { DefaultBodyType, PathParams } from 'msw';

// Type imports for endpoint configuration
import type { 
  DatabaseService,
  DatabaseDriver,
  ServiceStatus,
  DatabaseType,
  ApiErrorResponse,
  ResponseMetadata
} from '../../../../types/database-service';

// =============================================================================
// ENDPOINT CONFIGURATION TYPES
// =============================================================================

/**
 * HTTP methods supported by endpoint configuration
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Parameter types for endpoint configuration
 */
export type ParameterType = 'path' | 'query' | 'header' | 'body' | 'form';

/**
 * Data types for parameter validation
 */
export type DataType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'file' | 'date' | 'datetime';

/**
 * Security scheme types
 */
export type SecuritySchemeType = 'none' | 'api_key' | 'bearer' | 'basic' | 'oauth2' | 'session';

/**
 * Parameter configuration interface
 */
export interface ParameterConfig {
  id: string;
  name: string;
  type: ParameterType;
  dataType: DataType;
  required: boolean;
  description?: string;
  defaultValue?: any;
  example?: any;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    minimum?: number;
    maximum?: number;
    enum?: any[];
    format?: string;
  };
  deprecated?: boolean;
  allowEmptyValue?: boolean;
}

/**
 * Security configuration interface
 */
export interface SecurityConfig {
  type: SecuritySchemeType;
  name?: string;
  in?: 'header' | 'query' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: any;
  openIdConnectUrl?: string;
  description?: string;
  required: boolean;
}

/**
 * Response configuration interface
 */
export interface ResponseConfig {
  statusCode: number;
  description: string;
  mediaType?: string;
  schema?: any;
  examples?: Record<string, any>;
  headers?: Record<string, any>;
}

/**
 * Endpoint configuration interface
 */
export interface EndpointConfig {
  id: string;
  serviceId: number;
  path: string;
  method: HttpMethod;
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters: ParameterConfig[];
  security: SecurityConfig[];
  responses: ResponseConfig[];
  requestBody?: {
    required: boolean;
    mediaType: string;
    schema: any;
    examples?: Record<string, any>;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    version: number;
    deprecated?: boolean;
  };
}

/**
 * Endpoint list response interface
 */
export interface EndpointListResponse {
  resource: EndpointConfig[];
  meta: ResponseMetadata;
}

/**
 * OpenAPI specification interface
 */
export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
    parameters?: Record<string, any>;
    responses?: Record<string, any>;
  };
  security?: Array<Record<string, any>>;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  suggestions?: Array<{
    field: string;
    message: string;
    suggestion: string;
  }>;
}

/**
 * Preview request interface
 */
export interface PreviewRequest {
  endpoint: EndpointConfig;
  testData?: Record<string, any>;
  format: 'openapi' | 'postman' | 'curl' | 'raw';
}

/**
 * Preview response interface
 */
export interface PreviewResponse {
  openapi?: OpenAPISpec;
  postman?: any;
  curl?: string;
  raw?: string;
  validationResult: ValidationResult;
  generatedAt: string;
}

// =============================================================================
// MOCK DATA GENERATION UTILITIES
// =============================================================================

/**
 * Generate mock database services for testing
 */
function generateMockServices(): DatabaseService[] {
  return [
    {
      id: 1,
      name: 'mysql_primary',
      label: 'MySQL Primary Database',
      description: 'Primary MySQL database for application data',
      type: 'mysql' as DatabaseDriver,
      is_active: true,
      mutable: true,
      deletable: true,
      config: {
        driver: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'app_db',
        username: 'root',
        charset: 'utf8mb4',
        collation: 'utf8mb4_unicode_ci'
      },
      created_date: '2024-01-15T10:30:00Z',
      last_modified_date: '2024-01-15T10:30:00Z',
      created_by_id: 1,
      last_modified_by_id: 1
    },
    {
      id: 2,
      name: 'postgresql_analytics',
      label: 'PostgreSQL Analytics',
      description: 'PostgreSQL database for analytics and reporting',
      type: 'pgsql' as DatabaseDriver,
      is_active: true,
      mutable: true,
      deletable: true,
      config: {
        driver: 'pgsql',
        host: 'localhost',
        port: 5432,
        database: 'analytics_db',
        username: 'postgres',
        charset: 'utf8'
      },
      created_date: '2024-01-15T11:30:00Z',
      last_modified_date: '2024-01-15T11:30:00Z',
      created_by_id: 1,
      last_modified_by_id: 1
    }
  ];
}

/**
 * Generate mock endpoint configurations for testing
 */
function generateMockEndpoints(): EndpointConfig[] {
  return [
    {
      id: 'ep_001',
      serviceId: 1,
      path: '/api/v1/users',
      method: 'GET',
      operationId: 'getUsers',
      summary: 'Get all users',
      description: 'Retrieve a paginated list of all users with optional filtering',
      tags: ['users', 'management'],
      parameters: [
        {
          id: 'param_001',
          name: 'page',
          type: 'query',
          dataType: 'integer',
          required: false,
          description: 'Page number for pagination',
          defaultValue: 1,
          example: 1,
          validation: { minimum: 1, maximum: 1000 }
        },
        {
          id: 'param_002',
          name: 'limit',
          type: 'query',
          dataType: 'integer',
          required: false,
          description: 'Number of items per page',
          defaultValue: 20,
          example: 20,
          validation: { minimum: 1, maximum: 100 }
        },
        {
          id: 'param_003',
          name: 'search',
          type: 'query',
          dataType: 'string',
          required: false,
          description: 'Search term for filtering users',
          example: 'john',
          validation: { minLength: 2, maxLength: 50 }
        }
      ],
      security: [
        {
          type: 'bearer',
          required: true,
          description: 'JWT Bearer token for authentication',
          bearerFormat: 'JWT'
        }
      ],
      responses: [
        {
          statusCode: 200,
          description: 'Successful response with user list',
          mediaType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/User' }
              },
              meta: { $ref: '#/components/schemas/PaginationMeta' }
            }
          },
          examples: {
            default: {
              summary: 'Default user list response',
              value: {
                data: [
                  { id: 1, name: 'John Doe', email: 'john@example.com' },
                  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
                ],
                meta: { page: 1, limit: 20, total: 2, pages: 1 }
              }
            }
          }
        },
        {
          statusCode: 401,
          description: 'Unauthorized - Invalid or missing authentication',
          mediaType: 'application/json',
          schema: { $ref: '#/components/schemas/Error' }
        }
      ],
      metadata: {
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        createdBy: 'admin',
        version: 1
      }
    },
    {
      id: 'ep_002',
      serviceId: 1,
      path: '/api/v1/users/{id}',
      method: 'PUT',
      operationId: 'updateUser',
      summary: 'Update user',
      description: 'Update an existing user by ID',
      tags: ['users', 'management'],
      parameters: [
        {
          id: 'param_004',
          name: 'id',
          type: 'path',
          dataType: 'integer',
          required: true,
          description: 'User ID to update',
          example: 123,
          validation: { minimum: 1 }
        }
      ],
      security: [
        {
          type: 'bearer',
          required: true,
          description: 'JWT Bearer token for authentication',
          bearerFormat: 'JWT'
        }
      ],
      responses: [
        {
          statusCode: 200,
          description: 'User updated successfully',
          mediaType: 'application/json',
          schema: { $ref: '#/components/schemas/User' }
        },
        {
          statusCode: 404,
          description: 'User not found',
          mediaType: 'application/json',
          schema: { $ref: '#/components/schemas/Error' }
        }
      ],
      requestBody: {
        required: true,
        mediaType: 'application/json',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100 },
            email: { type: 'string', format: 'email' },
            active: { type: 'boolean' }
          },
          required: ['name', 'email']
        },
        examples: {
          default: {
            summary: 'Update user example',
            value: {
              name: 'John Doe Updated',
              email: 'john.updated@example.com',
              active: true
            }
          }
        }
      },
      metadata: {
        createdAt: '2024-01-15T11:30:00Z',
        updatedAt: '2024-01-15T11:30:00Z',
        createdBy: 'admin',
        version: 1
      }
    }
  ];
}

/**
 * Generate OpenAPI specification for testing
 */
function generateOpenAPISpec(endpoints: EndpointConfig[]): OpenAPISpec {
  const paths: Record<string, any> = {};
  
  endpoints.forEach(endpoint => {
    if (!paths[endpoint.path]) {
      paths[endpoint.path] = {};
    }
    
    paths[endpoint.path][endpoint.method.toLowerCase()] = {
      operationId: endpoint.operationId,
      summary: endpoint.summary,
      description: endpoint.description,
      tags: endpoint.tags,
      parameters: endpoint.parameters.map(param => ({
        name: param.name,
        in: param.type,
        required: param.required,
        description: param.description,
        schema: {
          type: param.dataType,
          default: param.defaultValue,
          example: param.example,
          ...param.validation
        }
      })),
      security: endpoint.security.map(sec => ({
        [sec.type]: []
      })),
      responses: endpoint.responses.reduce((acc, resp) => {
        acc[resp.statusCode] = {
          description: resp.description,
          content: resp.mediaType ? {
            [resp.mediaType]: {
              schema: resp.schema,
              examples: resp.examples
            }
          } : undefined
        };
        return acc;
      }, {} as Record<string, any>),
      requestBody: endpoint.requestBody ? {
        required: endpoint.requestBody.required,
        content: {
          [endpoint.requestBody.mediaType]: {
            schema: endpoint.requestBody.schema,
            examples: endpoint.requestBody.examples
          }
        }
      } : undefined
    };
  });

  return {
    openapi: '3.0.3',
    info: {
      title: 'DreamFactory Generated API',
      version: '1.0.0',
      description: 'API generated by DreamFactory Admin Interface'
    },
    servers: [
      {
        url: '/api/v2',
        description: 'DreamFactory API Server'
      }
    ],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            active: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'integer' },
                message: { type: 'string' },
                details: { type: 'object' }
              }
            }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            pages: { type: 'integer', example: 5 }
          }
        }
      }
    },
    security: [
      { bearerAuth: [] }
    ]
  };
}

/**
 * Validate endpoint configuration
 */
function validateEndpointConfiguration(endpoint: Partial<EndpointConfig>): ValidationResult {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];
  const suggestions: ValidationResult['suggestions'] = [];

  // Validate required fields
  if (!endpoint.path) {
    errors.push({
      field: 'path',
      message: 'Endpoint path is required',
      code: 'REQUIRED_FIELD'
    });
  } else if (!endpoint.path.startsWith('/')) {
    errors.push({
      field: 'path',
      message: 'Endpoint path must start with /',
      code: 'INVALID_FORMAT'
    });
  }

  if (!endpoint.method) {
    errors.push({
      field: 'method',
      message: 'HTTP method is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!endpoint.serviceId) {
    errors.push({
      field: 'serviceId',
      message: 'Service ID is required',
      code: 'REQUIRED_FIELD'
    });
  }

  // Validate parameters
  if (endpoint.parameters) {
    endpoint.parameters.forEach((param, index) => {
      if (!param.name) {
        errors.push({
          field: `parameters[${index}].name`,
          message: 'Parameter name is required',
          code: 'REQUIRED_FIELD'
        });
      }

      if (!param.type) {
        errors.push({
          field: `parameters[${index}].type`,
          message: 'Parameter type is required',
          code: 'REQUIRED_FIELD'
        });
      }

      if (!param.dataType) {
        errors.push({
          field: `parameters[${index}].dataType`,
          message: 'Parameter data type is required',
          code: 'REQUIRED_FIELD'
        });
      }

      // Suggest parameter descriptions
      if (!param.description) {
        suggestions?.push({
          field: `parameters[${index}].description`,
          message: 'Parameter description is recommended for better documentation',
          suggestion: `Add a description for parameter '${param.name}'`
        });
      }
    });
  }

  // Validate security configuration
  if (endpoint.security && endpoint.security.length === 0) {
    warnings.push({
      field: 'security',
      message: 'No security schemes configured. This endpoint will be publicly accessible',
      code: 'SECURITY_WARNING'
    });
  }

  // Validate responses
  if (!endpoint.responses || endpoint.responses.length === 0) {
    warnings.push({
      field: 'responses',
      message: 'No response configurations defined',
      code: 'MISSING_RESPONSES'
    });
  } else {
    const hasSuccessResponse = endpoint.responses.some(r => r.statusCode >= 200 && r.statusCode < 300);
    if (!hasSuccessResponse) {
      warnings.push({
        field: 'responses',
        message: 'No success response (2xx) defined',
        code: 'MISSING_SUCCESS_RESPONSE'
      });
    }
  }

  // Check for common patterns and suggest improvements
  if (endpoint.method === 'GET' && endpoint.path && !endpoint.path.includes('{')) {
    suggestions?.push({
      field: 'parameters',
      message: 'Consider adding query parameters for filtering and pagination',
      suggestion: 'Add pagination parameters like page, limit, or search filters'
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}

// =============================================================================
// IN-MEMORY STATE MANAGEMENT
// =============================================================================

// Mock data storage
let mockServices = generateMockServices();
let mockEndpoints = generateMockEndpoints();

// Configurable response delays for testing
const RESPONSE_DELAYS = {
  default: 100,
  slow: 2000,
  fast: 50,
  timeout: 30000
};

// Error simulation flags
let simulateNetworkError = false;
let simulateValidationError = false;
let simulateServerError = false;

// =============================================================================
// MSW HTTP HANDLERS
// =============================================================================

/**
 * MSW handlers for endpoint configuration API simulation
 */
export const endpointConfigurationHandlers = [
  // =============================================================================
  // SERVICE MANAGEMENT ENDPOINTS
  // =============================================================================

  /**
   * GET /api/v2/service - Get all database services
   */
  http.get('/api/v2/service', async ({ request }) => {
    await delay(RESPONSE_DELAYS.default);

    if (simulateNetworkError) {
      return HttpResponse.error();
    }

    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('include_inactive') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '0');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let services = includeInactive 
      ? mockServices 
      : mockServices.filter(service => service.is_active);

    // Apply pagination
    if (limit > 0) {
      services = services.slice(offset, offset + limit);
    }

    return HttpResponse.json({
      resource: services,
      meta: {
        count: services.length,
        total: mockServices.length
      }
    }, { status: 200 });
  }),

  /**
   * GET /api/v2/service/{serviceId} - Get specific database service
   */
  http.get('/api/v2/service/:serviceId', async ({ params }) => {
    await delay(RESPONSE_DELAYS.default);

    if (simulateNetworkError) {
      return HttpResponse.error();
    }

    const serviceId = parseInt(params.serviceId as string);
    const service = mockServices.find(s => s.id === serviceId);

    if (!service) {
      return HttpResponse.json({
        error: {
          code: 404,
          message: `Service with ID ${serviceId} not found`,
          details: { serviceId }
        }
      }, { status: 404 });
    }

    return HttpResponse.json({
      resource: service
    }, { status: 200 });
  }),

  // =============================================================================
  // ENDPOINT CONFIGURATION ENDPOINTS
  // =============================================================================

  /**
   * GET /api/v2/service/{serviceId}/endpoints - Get all endpoints for a service
   */
  http.get('/api/v2/service/:serviceId/endpoints', async ({ request, params }) => {
    await delay(RESPONSE_DELAYS.default);

    if (simulateNetworkError) {
      return HttpResponse.error();
    }

    const serviceId = parseInt(params.serviceId as string);
    const url = new URL(request.url);
    const method = url.searchParams.get('method');
    const path = url.searchParams.get('path');
    const limit = parseInt(url.searchParams.get('limit') || '0');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Check if service exists
    const service = mockServices.find(s => s.id === serviceId);
    if (!service) {
      return HttpResponse.json({
        error: {
          code: 404,
          message: `Service with ID ${serviceId} not found`,
          details: { serviceId }
        }
      }, { status: 404 });
    }

    let endpoints = mockEndpoints.filter(ep => ep.serviceId === serviceId);

    // Apply filters
    if (method) {
      endpoints = endpoints.filter(ep => ep.method === method.toUpperCase());
    }
    if (path) {
      endpoints = endpoints.filter(ep => ep.path.includes(path));
    }

    // Apply pagination
    if (limit > 0) {
      endpoints = endpoints.slice(offset, offset + limit);
    }

    return HttpResponse.json({
      resource: endpoints,
      meta: {
        count: endpoints.length,
        total: mockEndpoints.filter(ep => ep.serviceId === serviceId).length,
        service: {
          id: service.id,
          name: service.name,
          type: service.type
        }
      }
    }, { status: 200 });
  }),

  /**
   * POST /api/v2/service/{serviceId}/endpoints - Create new endpoint
   */
  http.post('/api/v2/service/:serviceId/endpoints', async ({ request, params }) => {
    await delay(RESPONSE_DELAYS.default);

    if (simulateNetworkError) {
      return HttpResponse.error();
    }

    if (simulateServerError) {
      return HttpResponse.json({
        error: {
          code: 500,
          message: 'Internal server error during endpoint creation',
          details: { phase: 'creation' }
        }
      }, { status: 500 });
    }

    const serviceId = parseInt(params.serviceId as string);
    
    // Check if service exists
    const service = mockServices.find(s => s.id === serviceId);
    if (!service) {
      return HttpResponse.json({
        error: {
          code: 404,
          message: `Service with ID ${serviceId} not found`,
          details: { serviceId }
        }
      }, { status: 404 });
    }

    try {
      const endpointData = await request.json() as Partial<EndpointConfig>;
      
      // Validate endpoint configuration
      const validation = validateEndpointConfiguration(endpointData);
      
      if (simulateValidationError || !validation.valid) {
        return HttpResponse.json({
          error: {
            code: 422,
            message: 'Validation failed',
            details: {
              validation_errors: validation.errors,
              warnings: validation.warnings
            }
          }
        }, { status: 422 });
      }

      // Check for duplicate endpoint
      const existingEndpoint = mockEndpoints.find(ep => 
        ep.serviceId === serviceId && 
        ep.path === endpointData.path && 
        ep.method === endpointData.method
      );

      if (existingEndpoint) {
        return HttpResponse.json({
          error: {
            code: 409,
            message: 'Endpoint already exists',
            details: {
              existingEndpoint: {
                id: existingEndpoint.id,
                path: existingEndpoint.path,
                method: existingEndpoint.method
              }
            }
          }
        }, { status: 409 });
      }

      // Create new endpoint
      const newEndpoint: EndpointConfig = {
        id: `ep_${Date.now()}`,
        serviceId,
        path: endpointData.path || '/api/v1/example',
        method: endpointData.method || 'GET',
        operationId: endpointData.operationId || `${endpointData.method?.toLowerCase()}${endpointData.path?.replace(/[^a-zA-Z0-9]/g, '')}`,
        summary: endpointData.summary || 'Generated endpoint',
        description: endpointData.description,
        tags: endpointData.tags || [],
        parameters: endpointData.parameters || [],
        security: endpointData.security || [],
        responses: endpointData.responses || [
          {
            statusCode: 200,
            description: 'Successful response',
            mediaType: 'application/json',
            schema: { type: 'object' }
          }
        ],
        requestBody: endpointData.requestBody,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'admin',
          version: 1
        }
      };

      mockEndpoints.push(newEndpoint);

      return HttpResponse.json({
        resource: newEndpoint,
        meta: {
          validation,
          service: {
            id: service.id,
            name: service.name,
            type: service.type
          }
        }
      }, { status: 201 });
    } catch (error) {
      return HttpResponse.json({
        error: {
          code: 400,
          message: 'Invalid request body',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      }, { status: 400 });
    }
  }),

  /**
   * GET /api/v2/service/{serviceId}/endpoints/{endpointId} - Get specific endpoint
   */
  http.get('/api/v2/service/:serviceId/endpoints/:endpointId', async ({ params }) => {
    await delay(RESPONSE_DELAYS.default);

    if (simulateNetworkError) {
      return HttpResponse.error();
    }

    const serviceId = parseInt(params.serviceId as string);
    const endpointId = params.endpointId as string;

    const endpoint = mockEndpoints.find(ep => 
      ep.id === endpointId && ep.serviceId === serviceId
    );

    if (!endpoint) {
      return HttpResponse.json({
        error: {
          code: 404,
          message: `Endpoint ${endpointId} not found for service ${serviceId}`,
          details: { serviceId, endpointId }
        }
      }, { status: 404 });
    }

    return HttpResponse.json({
      resource: endpoint
    }, { status: 200 });
  }),

  /**
   * PUT /api/v2/service/{serviceId}/endpoints/{endpointId} - Update endpoint
   */
  http.put('/api/v2/service/:serviceId/endpoints/:endpointId', async ({ request, params }) => {
    await delay(RESPONSE_DELAYS.default);

    if (simulateNetworkError) {
      return HttpResponse.error();
    }

    if (simulateServerError) {
      return HttpResponse.json({
        error: {
          code: 500,
          message: 'Internal server error during endpoint update',
          details: { phase: 'update' }
        }
      }, { status: 500 });
    }

    const serviceId = parseInt(params.serviceId as string);
    const endpointId = params.endpointId as string;

    const endpointIndex = mockEndpoints.findIndex(ep => 
      ep.id === endpointId && ep.serviceId === serviceId
    );

    if (endpointIndex === -1) {
      return HttpResponse.json({
        error: {
          code: 404,
          message: `Endpoint ${endpointId} not found for service ${serviceId}`,
          details: { serviceId, endpointId }
        }
      }, { status: 404 });
    }

    try {
      const updateData = await request.json() as Partial<EndpointConfig>;
      
      // Validate endpoint configuration
      const validation = validateEndpointConfiguration({
        ...mockEndpoints[endpointIndex],
        ...updateData
      });
      
      if (simulateValidationError || !validation.valid) {
        return HttpResponse.json({
          error: {
            code: 422,
            message: 'Validation failed',
            details: {
              validation_errors: validation.errors,
              warnings: validation.warnings
            }
          }
        }, { status: 422 });
      }

      // Update endpoint
      const updatedEndpoint: EndpointConfig = {
        ...mockEndpoints[endpointIndex],
        ...updateData,
        id: endpointId, // Preserve original ID
        serviceId, // Preserve original service ID
        metadata: {
          ...mockEndpoints[endpointIndex].metadata,
          updatedAt: new Date().toISOString(),
          version: mockEndpoints[endpointIndex].metadata.version + 1
        }
      };

      mockEndpoints[endpointIndex] = updatedEndpoint;

      return HttpResponse.json({
        resource: updatedEndpoint,
        meta: {
          validation,
          previousVersion: mockEndpoints[endpointIndex].metadata.version - 1
        }
      }, { status: 200 });
    } catch (error) {
      return HttpResponse.json({
        error: {
          code: 400,
          message: 'Invalid request body',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      }, { status: 400 });
    }
  }),

  /**
   * DELETE /api/v2/service/{serviceId}/endpoints/{endpointId} - Delete endpoint
   */
  http.delete('/api/v2/service/:serviceId/endpoints/:endpointId', async ({ params }) => {
    await delay(RESPONSE_DELAYS.default);

    if (simulateNetworkError) {
      return HttpResponse.error();
    }

    if (simulateServerError) {
      return HttpResponse.json({
        error: {
          code: 500,
          message: 'Internal server error during endpoint deletion',
          details: { phase: 'deletion' }
        }
      }, { status: 500 });
    }

    const serviceId = parseInt(params.serviceId as string);
    const endpointId = params.endpointId as string;

    const endpointIndex = mockEndpoints.findIndex(ep => 
      ep.id === endpointId && ep.serviceId === serviceId
    );

    if (endpointIndex === -1) {
      return HttpResponse.json({
        error: {
          code: 404,
          message: `Endpoint ${endpointId} not found for service ${serviceId}`,
          details: { serviceId, endpointId }
        }
      }, { status: 404 });
    }

    const deletedEndpoint = mockEndpoints.splice(endpointIndex, 1)[0];

    return HttpResponse.json({
      resource: deletedEndpoint,
      meta: {
        deleted: true,
        deletedAt: new Date().toISOString()
      }
    }, { status: 200 });
  }),

  // =============================================================================
  // VALIDATION AND PREVIEW ENDPOINTS
  // =============================================================================

  /**
   * POST /api/v2/service/{serviceId}/endpoints/validate - Validate endpoint configuration
   */
  http.post('/api/v2/service/:serviceId/endpoints/validate', async ({ request, params }) => {
    await delay(RESPONSE_DELAYS.fast);

    if (simulateNetworkError) {
      return HttpResponse.error();
    }

    const serviceId = parseInt(params.serviceId as string);

    // Check if service exists
    const service = mockServices.find(s => s.id === serviceId);
    if (!service) {
      return HttpResponse.json({
        error: {
          code: 404,
          message: `Service with ID ${serviceId} not found`,
          details: { serviceId }
        }
      }, { status: 404 });
    }

    try {
      const endpointData = await request.json() as Partial<EndpointConfig>;
      const validation = validateEndpointConfiguration(endpointData);

      return HttpResponse.json({
        resource: validation,
        meta: {
          serviceId,
          validatedAt: new Date().toISOString()
        }
      }, { status: 200 });
    } catch (error) {
      return HttpResponse.json({
        error: {
          code: 400,
          message: 'Invalid request body',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      }, { status: 400 });
    }
  }),

  /**
   * POST /api/v2/service/{serviceId}/endpoints/preview - Generate endpoint preview
   */
  http.post('/api/v2/service/:serviceId/endpoints/preview', async ({ request, params }) => {
    await delay(RESPONSE_DELAYS.default);

    if (simulateNetworkError) {
      return HttpResponse.error();
    }

    const serviceId = parseInt(params.serviceId as string);

    // Check if service exists
    const service = mockServices.find(s => s.id === serviceId);
    if (!service) {
      return HttpResponse.json({
        error: {
          code: 404,
          message: `Service with ID ${serviceId} not found`,
          details: { serviceId }
        }
      }, { status: 404 });
    }

    try {
      const previewRequest = await request.json() as PreviewRequest;
      const validation = validateEndpointConfiguration(previewRequest.endpoint);

      let response: PreviewResponse = {
        validationResult: validation,
        generatedAt: new Date().toISOString()
      };

      if (previewRequest.format === 'openapi' || !previewRequest.format) {
        response.openapi = generateOpenAPISpec([previewRequest.endpoint as EndpointConfig]);
      }

      if (previewRequest.format === 'curl') {
        response.curl = `curl -X ${previewRequest.endpoint.method} \\
  "${service.config?.host || 'localhost'}${previewRequest.endpoint.path}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN"`;
      }

      if (previewRequest.format === 'postman') {
        response.postman = {
          info: {
            name: `${previewRequest.endpoint.summary || 'Generated Endpoint'}`,
            schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
          },
          item: [{
            name: previewRequest.endpoint.summary || previewRequest.endpoint.operationId,
            request: {
              method: previewRequest.endpoint.method,
              header: [
                { key: 'Content-Type', value: 'application/json' },
                { key: 'Authorization', value: 'Bearer {{token}}' }
              ],
              url: {
                raw: `{{baseUrl}}${previewRequest.endpoint.path}`,
                host: ['{{baseUrl}}'],
                path: previewRequest.endpoint.path.split('/').filter(Boolean)
              }
            }
          }]
        };
      }

      if (previewRequest.format === 'raw') {
        response.raw = JSON.stringify({
          endpoint: previewRequest.endpoint,
          service: service,
          generatedAt: response.generatedAt
        }, null, 2);
      }

      return HttpResponse.json({
        resource: response,
        meta: {
          serviceId,
          format: previewRequest.format || 'openapi'
        }
      }, { status: 200 });
    } catch (error) {
      return HttpResponse.json({
        error: {
          code: 400,
          message: 'Invalid preview request',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      }, { status: 400 });
    }
  }),

  // =============================================================================
  // OPENAPI GENERATION ENDPOINTS
  // =============================================================================

  /**
   * GET /api/v2/service/{serviceId}/openapi - Generate OpenAPI specification for service
   */
  http.get('/api/v2/service/:serviceId/openapi', async ({ request, params }) => {
    await delay(RESPONSE_DELAYS.slow);

    if (simulateNetworkError) {
      return HttpResponse.error();
    }

    const serviceId = parseInt(params.serviceId as string);
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';
    const includeSchemas = url.searchParams.get('include_schemas') === 'true';

    // Check if service exists
    const service = mockServices.find(s => s.id === serviceId);
    if (!service) {
      return HttpResponse.json({
        error: {
          code: 404,
          message: `Service with ID ${serviceId} not found`,
          details: { serviceId }
        }
      }, { status: 404 });
    }

    const serviceEndpoints = mockEndpoints.filter(ep => ep.serviceId === serviceId);
    
    if (serviceEndpoints.length === 0) {
      return HttpResponse.json({
        error: {
          code: 404,
          message: `No endpoints found for service ${serviceId}`,
          details: { serviceId }
        }
      }, { status: 404 });
    }

    const openApiSpec = generateOpenAPISpec(serviceEndpoints);

    // Enhance with service-specific information
    openApiSpec.info.title = `${service.name} API`;
    openApiSpec.info.description = service.description || `Generated API for ${service.name} service`;

    if (format === 'yaml') {
      // In a real implementation, this would convert to YAML
      return new HttpResponse(
        `# ${openApiSpec.info.title}\n# Generated OpenAPI Specification\n\n` + 
        JSON.stringify(openApiSpec, null, 2),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/x-yaml'
          }
        }
      );
    }

    return HttpResponse.json({
      resource: openApiSpec,
      meta: {
        serviceId,
        serviceName: service.name,
        endpointCount: serviceEndpoints.length,
        generatedAt: new Date().toISOString(),
        format
      }
    }, { status: 200 });
  }),

  // =============================================================================
  // BATCH OPERATIONS
  // =============================================================================

  /**
   * POST /api/v2/service/{serviceId}/endpoints/batch - Batch endpoint operations
   */
  http.post('/api/v2/service/:serviceId/endpoints/batch', async ({ request, params }) => {
    await delay(RESPONSE_DELAYS.slow);

    if (simulateNetworkError) {
      return HttpResponse.error();
    }

    const serviceId = parseInt(params.serviceId as string);

    // Check if service exists
    const service = mockServices.find(s => s.id === serviceId);
    if (!service) {
      return HttpResponse.json({
        error: {
          code: 404,
          message: `Service with ID ${serviceId} not found`,
          details: { serviceId }
        }
      }, { status: 404 });
    }

    try {
      const batchRequest = await request.json() as {
        operation: 'create' | 'update' | 'delete' | 'validate';
        endpoints: Partial<EndpointConfig>[];
      };

      const results = [];
      const errors = [];

      for (const [index, endpointData] of batchRequest.endpoints.entries()) {
        try {
          if (batchRequest.operation === 'validate') {
            const validation = validateEndpointConfiguration(endpointData);
            results.push({
              index,
              endpoint: endpointData,
              validation,
              success: validation.valid
            });
          } else if (batchRequest.operation === 'create') {
            const validation = validateEndpointConfiguration(endpointData);
            if (validation.valid) {
              const newEndpoint: EndpointConfig = {
                id: `ep_batch_${Date.now()}_${index}`,
                serviceId,
                path: endpointData.path || `/api/v1/batch${index}`,
                method: endpointData.method || 'GET',
                operationId: endpointData.operationId || `batch${index}`,
                summary: endpointData.summary || `Batch endpoint ${index}`,
                description: endpointData.description,
                tags: endpointData.tags || [],
                parameters: endpointData.parameters || [],
                security: endpointData.security || [],
                responses: endpointData.responses || [
                  {
                    statusCode: 200,
                    description: 'Successful response',
                    mediaType: 'application/json',
                    schema: { type: 'object' }
                  }
                ],
                requestBody: endpointData.requestBody,
                metadata: {
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  createdBy: 'admin',
                  version: 1
                }
              };
              mockEndpoints.push(newEndpoint);
              results.push({
                index,
                endpoint: newEndpoint,
                validation,
                success: true
              });
            } else {
              errors.push({
                index,
                endpoint: endpointData,
                validation,
                error: 'Validation failed'
              });
            }
          }
        } catch (error) {
          errors.push({
            index,
            endpoint: endpointData,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return HttpResponse.json({
        resource: {
          operation: batchRequest.operation,
          results,
          errors,
          summary: {
            total: batchRequest.endpoints.length,
            successful: results.length,
            failed: errors.length
          }
        },
        meta: {
          serviceId,
          processedAt: new Date().toISOString()
        }
      }, { 
        status: errors.length > 0 ? 207 : 200 // 207 Multi-Status for partial success
      });
    } catch (error) {
      return HttpResponse.json({
        error: {
          code: 400,
          message: 'Invalid batch request',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      }, { status: 400 });
    }
  })
];

// =============================================================================
// TEST UTILITY FUNCTIONS
// =============================================================================

/**
 * Reset mock data to initial state
 */
export function resetMockData(): void {
  mockServices = generateMockServices();
  mockEndpoints = generateMockEndpoints();
}

/**
 * Add mock service for testing
 */
export function addMockService(service: DatabaseService): void {
  mockServices.push(service);
}

/**
 * Add mock endpoint for testing
 */
export function addMockEndpoint(endpoint: EndpointConfig): void {
  mockEndpoints.push(endpoint);
}

/**
 * Get current mock services
 */
export function getMockServices(): DatabaseService[] {
  return [...mockServices];
}

/**
 * Get current mock endpoints
 */
export function getMockEndpoints(): EndpointConfig[] {
  return [...mockEndpoints];
}

/**
 * Configure response delays for testing
 */
export function configureResponseDelays(delays: Partial<typeof RESPONSE_DELAYS>): void {
  Object.assign(RESPONSE_DELAYS, delays);
}

/**
 * Enable/disable error simulation
 */
export function setErrorSimulation(options: {
  networkError?: boolean;
  validationError?: boolean;
  serverError?: boolean;
}): void {
  if (options.networkError !== undefined) {
    simulateNetworkError = options.networkError;
  }
  if (options.validationError !== undefined) {
    simulateValidationError = options.validationError;
  }
  if (options.serverError !== undefined) {
    simulateServerError = options.serverError;
  }
}

/**
 * Get current error simulation status
 */
export function getErrorSimulationStatus(): {
  networkError: boolean;
  validationError: boolean;
  serverError: boolean;
} {
  return {
    networkError: simulateNetworkError,
    validationError: simulateValidationError,
    serverError: simulateServerError
  };
}

/**
 * Generate test endpoint configuration
 */
export function generateTestEndpoint(overrides: Partial<EndpointConfig> = {}): EndpointConfig {
  const baseEndpoint = generateMockEndpoints()[0];
  return {
    ...baseEndpoint,
    id: `test_${Date.now()}`,
    ...overrides
  };
}

/**
 * Generate test parameter configuration
 */
export function generateTestParameter(overrides: Partial<ParameterConfig> = {}): ParameterConfig {
  return {
    id: `param_test_${Date.now()}`,
    name: 'testParam',
    type: 'query',
    dataType: 'string',
    required: false,
    description: 'Test parameter for unit testing',
    example: 'test-value',
    ...overrides
  };
}

/**
 * Generate test security configuration
 */
export function generateTestSecurity(overrides: Partial<SecurityConfig> = {}): SecurityConfig {
  return {
    type: 'bearer',
    required: true,
    description: 'Test security configuration',
    bearerFormat: 'JWT',
    ...overrides
  };
}

/**
 * Export all handlers as default for easy import
 */
export default endpointConfigurationHandlers;