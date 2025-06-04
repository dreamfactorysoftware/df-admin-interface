/**
 * Mock Service Worker (MSW) handlers for API mocking during development and testing
 * of endpoint configuration components. Provides realistic API simulation without
 * backend dependencies for comprehensive endpoint configuration workflow testing.
 * 
 * Features:
 * - Complete endpoint CRUD operations with validation
 * - Parameter configuration with type-specific validation
 * - Security scheme assignment and validation
 * - OpenAPI specification generation and preview
 * - Realistic error simulation and edge case handling
 * - Performance optimized for Vitest test execution
 */

import { http, HttpResponse } from 'msw';

// Types for endpoint configuration (inferred from technical specification)
interface EndpointParameter {
  id: string;
  name: string;
  type: 'path' | 'query' | 'body' | 'header';
  dataType: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    minimum?: number;
    maximum?: number;
    enum?: string[];
  };
}

interface SecurityScheme {
  id: string;
  type: 'apiKey' | 'bearer' | 'basic' | 'oauth2';
  name?: string;
  in?: 'header' | 'query' | 'cookie';
  scheme?: string;
  description?: string;
}

interface ValidationRule {
  id: string;
  field: string;
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'range' | 'enum';
  value: string | number | string[];
  message: string;
  condition?: string;
}

interface EndpointConfiguration {
  id: string;
  serviceName: string;
  tableName: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  parameters: EndpointParameter[];
  security: SecurityScheme[];
  validation: ValidationRule[];
  description?: string;
  summary?: string;
  tags?: string[];
  responses?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface OpenAPISpecification {
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
  components: {
    schemas: Record<string, any>;
    securitySchemes: Record<string, any>;
    responses: Record<string, any>;
  };
  security: Array<Record<string, any>>;
}

interface ApiError {
  code: number;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Mock data storage
const mockEndpoints: EndpointConfiguration[] = [
  {
    id: 'ep-001',
    serviceName: 'users_db',
    tableName: 'users',
    method: 'GET',
    path: '/api/v2/users_db/_table/users',
    parameters: [
      {
        id: 'param-001',
        name: 'limit',
        type: 'query',
        dataType: 'number',
        required: false,
        description: 'Maximum number of records to return',
        validation: { minimum: 1, maximum: 1000 }
      },
      {
        id: 'param-002',
        name: 'offset',
        type: 'query',
        dataType: 'number',
        required: false,
        description: 'Number of records to skip',
        validation: { minimum: 0 }
      },
      {
        id: 'param-003',
        name: 'filter',
        type: 'query',
        dataType: 'string',
        required: false,
        description: 'SQL WHERE clause for filtering'
      }
    ],
    security: [
      {
        id: 'sec-001',
        type: 'apiKey',
        name: 'X-DreamFactory-API-Key',
        in: 'header',
        description: 'API Key authentication'
      }
    ],
    validation: [
      {
        id: 'val-001',
        field: 'limit',
        type: 'range',
        value: [1, 1000],
        message: 'Limit must be between 1 and 1000'
      }
    ],
    description: 'Retrieve users from the database',
    summary: 'Get Users',
    tags: ['users'],
    responses: {
      '200': {
        description: 'Success Response',
        schema: { type: 'object' }
      }
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'ep-002',
    serviceName: 'users_db',
    tableName: 'users',
    method: 'POST',
    path: '/api/v2/users_db/_table/users',
    parameters: [
      {
        id: 'param-004',
        name: 'body',
        type: 'body',
        dataType: 'object',
        required: true,
        description: 'User data to create'
      }
    ],
    security: [
      {
        id: 'sec-002',
        type: 'bearer',
        scheme: 'bearer',
        description: 'JWT Bearer token authentication'
      }
    ],
    validation: [
      {
        id: 'val-002',
        field: 'email',
        type: 'pattern',
        value: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
        message: 'Invalid email format'
      },
      {
        id: 'val-003',
        field: 'username',
        type: 'minLength',
        value: 3,
        message: 'Username must be at least 3 characters'
      }
    ],
    description: 'Create a new user in the database',
    summary: 'Create User',
    tags: ['users'],
    responses: {
      '201': {
        description: 'User created successfully',
        schema: { type: 'object' }
      }
    },
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  }
];

const mockSecuritySchemes: SecurityScheme[] = [
  {
    id: 'sec-api-key',
    type: 'apiKey',
    name: 'X-DreamFactory-API-Key',
    in: 'header',
    description: 'API Key authentication'
  },
  {
    id: 'sec-bearer',
    type: 'bearer',
    scheme: 'bearer',
    description: 'JWT Bearer token authentication'
  },
  {
    id: 'sec-basic',
    type: 'basic',
    description: 'HTTP Basic authentication'
  },
  {
    id: 'sec-session',
    type: 'apiKey',
    name: 'X-DreamFactory-Session-Token',
    in: 'header',
    description: 'Session token authentication'
  }
];

// Helper functions
const createApiError = (code: number, message: string, details?: any): ApiError => ({
  code,
  message,
  details,
  timestamp: new Date().toISOString()
});

const generateEndpointId = (): string => {
  return `ep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const generateParameterId = (): string => {
  return `param-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const validateEndpointConfiguration = (config: Partial<EndpointConfiguration>): string[] => {
  const errors: string[] = [];
  
  if (!config.serviceName) errors.push('Service name is required');
  if (!config.tableName) errors.push('Table name is required');
  if (!config.method) errors.push('HTTP method is required');
  if (!config.path) errors.push('Path is required');
  
  if (config.path && !/^\/api\/v2\//.test(config.path)) {
    errors.push('Path must start with /api/v2/');
  }
  
  if (config.method && !['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method)) {
    errors.push('Invalid HTTP method');
  }
  
  return errors;
};

const generateOpenAPISpec = (endpoints: EndpointConfiguration[]): OpenAPISpecification => {
  const paths: Record<string, any> = {};
  const schemas: Record<string, any> = {};
  const securitySchemes: Record<string, any> = {};
  
  // Build paths from endpoints
  endpoints.forEach(endpoint => {
    if (!paths[endpoint.path]) {
      paths[endpoint.path] = {};
    }
    
    const operation = {
      summary: endpoint.summary || `${endpoint.method} ${endpoint.tableName}`,
      description: endpoint.description || '',
      operationId: `${endpoint.method.toLowerCase()}${endpoint.tableName}`,
      tags: endpoint.tags || [endpoint.tableName],
      parameters: endpoint.parameters
        .filter(p => p.type !== 'body')
        .map(p => ({
          name: p.name,
          in: p.type,
          required: p.required,
          description: p.description,
          schema: { type: p.dataType }
        })),
      responses: endpoint.responses || {
        '200': {
          description: 'Success Response',
          content: {
            'application/json': {
              schema: { type: 'object' }
            }
          }
        }
      },
      security: endpoint.security.map(s => ({ [s.id]: [] }))
    };
    
    // Add request body for POST/PUT/PATCH methods
    const bodyParam = endpoint.parameters.find(p => p.type === 'body');
    if (bodyParam && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      operation.requestBody = {
        required: bodyParam.required,
        content: {
          'application/json': {
            schema: { type: bodyParam.dataType }
          }
        }
      };
    }
    
    paths[endpoint.path][endpoint.method.toLowerCase()] = operation;
  });
  
  // Build security schemes
  mockSecuritySchemes.forEach(scheme => {
    securitySchemes[scheme.id] = {
      type: scheme.type,
      ...(scheme.name && { name: scheme.name }),
      ...(scheme.in && { in: scheme.in }),
      ...(scheme.scheme && { scheme: scheme.scheme }),
      description: scheme.description
    };
  });
  
  return {
    openapi: '3.0.0',
    info: {
      title: 'Generated API Documentation',
      version: '1.0.0',
      description: 'Auto-generated API documentation from DreamFactory endpoint configuration'
    },
    servers: [
      {
        url: '/api/v2',
        description: 'DreamFactory API Server'
      }
    ],
    paths,
    components: {
      schemas,
      securitySchemes,
      responses: {
        Success: {
          description: 'Success Response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' }
                }
              }
            }
          }
        },
        Error: {
          description: 'Error Response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'integer' },
                  message: { type: 'string' },
                  details: { type: 'object' }
                }
              }
            }
          }
        }
      }
    },
    security: mockSecuritySchemes.map(scheme => ({ [scheme.id]: [] }))
  };
};

/**
 * MSW HTTP handlers for endpoint configuration API mocking
 * 
 * Provides comprehensive coverage for:
 * - Endpoint CRUD operations
 * - Parameter configuration and validation
 * - Security scheme management
 * - OpenAPI specification generation
 * - Error simulation and edge cases
 */
export const endpointConfigurationHandlers = [
  // Get all endpoints for a service
  http.get('/api/v2/system/service/:serviceName/endpoints', ({ params }) => {
    const { serviceName } = params;
    
    const serviceEndpoints = mockEndpoints.filter(
      ep => ep.serviceName === serviceName
    );
    
    return HttpResponse.json({
      resource: serviceEndpoints,
      meta: {
        count: serviceEndpoints.length,
        schema: ['id', 'method', 'path', 'summary', 'createdAt', 'updatedAt']
      }
    });
  }),

  // Get specific endpoint configuration
  http.get('/api/v2/system/service/:serviceName/endpoints/:endpointId', ({ params }) => {
    const { serviceName, endpointId } = params;
    
    const endpoint = mockEndpoints.find(
      ep => ep.id === endpointId && ep.serviceName === serviceName
    );
    
    if (!endpoint) {
      return HttpResponse.json(
        createApiError(404, `Endpoint ${endpointId} not found`),
        { status: 404 }
      );
    }
    
    return HttpResponse.json(endpoint);
  }),

  // Create new endpoint configuration
  http.post('/api/v2/system/service/:serviceName/endpoints', async ({ params, request }) => {
    const { serviceName } = params;
    const requestBody = await request.json() as Partial<EndpointConfiguration>;
    
    // Validate configuration
    const validationErrors = validateEndpointConfiguration(requestBody);
    if (validationErrors.length > 0) {
      return HttpResponse.json(
        createApiError(400, 'Validation failed', { errors: validationErrors }),
        { status: 400 }
      );
    }
    
    // Check for duplicate endpoint
    const duplicate = mockEndpoints.find(
      ep => ep.serviceName === serviceName && 
           ep.method === requestBody.method && 
           ep.path === requestBody.path
    );
    
    if (duplicate) {
      return HttpResponse.json(
        createApiError(409, 'Endpoint already exists for this method and path'),
        { status: 409 }
      );
    }
    
    // Create new endpoint
    const newEndpoint: EndpointConfiguration = {
      id: generateEndpointId(),
      serviceName: serviceName as string,
      tableName: requestBody.tableName!,
      method: requestBody.method!,
      path: requestBody.path!,
      parameters: requestBody.parameters || [],
      security: requestBody.security || [],
      validation: requestBody.validation || [],
      description: requestBody.description,
      summary: requestBody.summary,
      tags: requestBody.tags,
      responses: requestBody.responses,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockEndpoints.push(newEndpoint);
    
    return HttpResponse.json(newEndpoint, { status: 201 });
  }),

  // Update endpoint configuration
  http.put('/api/v2/system/service/:serviceName/endpoints/:endpointId', async ({ params, request }) => {
    const { serviceName, endpointId } = params;
    const requestBody = await request.json() as Partial<EndpointConfiguration>;
    
    const endpointIndex = mockEndpoints.findIndex(
      ep => ep.id === endpointId && ep.serviceName === serviceName
    );
    
    if (endpointIndex === -1) {
      return HttpResponse.json(
        createApiError(404, `Endpoint ${endpointId} not found`),
        { status: 404 }
      );
    }
    
    // Validate configuration if provided
    if (Object.keys(requestBody).length > 0) {
      const validationErrors = validateEndpointConfiguration(requestBody);
      if (validationErrors.length > 0) {
        return HttpResponse.json(
          createApiError(400, 'Validation failed', { errors: validationErrors }),
          { status: 400 }
        );
      }
    }
    
    // Update endpoint
    const updatedEndpoint = {
      ...mockEndpoints[endpointIndex],
      ...requestBody,
      updatedAt: new Date().toISOString()
    };
    
    mockEndpoints[endpointIndex] = updatedEndpoint;
    
    return HttpResponse.json(updatedEndpoint);
  }),

  // Delete endpoint configuration
  http.delete('/api/v2/system/service/:serviceName/endpoints/:endpointId', ({ params }) => {
    const { serviceName, endpointId } = params;
    
    const endpointIndex = mockEndpoints.findIndex(
      ep => ep.id === endpointId && ep.serviceName === serviceName
    );
    
    if (endpointIndex === -1) {
      return HttpResponse.json(
        createApiError(404, `Endpoint ${endpointId} not found`),
        { status: 404 }
      );
    }
    
    mockEndpoints.splice(endpointIndex, 1);
    
    return HttpResponse.json({ success: true });
  }),

  // Get endpoint parameters
  http.get('/api/v2/system/service/:serviceName/endpoints/:endpointId/parameters', ({ params }) => {
    const { serviceName, endpointId } = params;
    
    const endpoint = mockEndpoints.find(
      ep => ep.id === endpointId && ep.serviceName === serviceName
    );
    
    if (!endpoint) {
      return HttpResponse.json(
        createApiError(404, `Endpoint ${endpointId} not found`),
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      resource: endpoint.parameters,
      meta: {
        count: endpoint.parameters.length,
        schema: ['id', 'name', 'type', 'dataType', 'required', 'description']
      }
    });
  }),

  // Add parameter to endpoint
  http.post('/api/v2/system/service/:serviceName/endpoints/:endpointId/parameters', async ({ params, request }) => {
    const { serviceName, endpointId } = params;
    const parameter = await request.json() as Partial<EndpointParameter>;
    
    const endpoint = mockEndpoints.find(
      ep => ep.id === endpointId && ep.serviceName === serviceName
    );
    
    if (!endpoint) {
      return HttpResponse.json(
        createApiError(404, `Endpoint ${endpointId} not found`),
        { status: 404 }
      );
    }
    
    // Validate parameter
    if (!parameter.name || !parameter.type || !parameter.dataType) {
      return HttpResponse.json(
        createApiError(400, 'Parameter name, type, and dataType are required'),
        { status: 400 }
      );
    }
    
    // Check for duplicate parameter name
    const duplicate = endpoint.parameters.find(p => p.name === parameter.name);
    if (duplicate) {
      return HttpResponse.json(
        createApiError(409, `Parameter ${parameter.name} already exists`),
        { status: 409 }
      );
    }
    
    const newParameter: EndpointParameter = {
      id: generateParameterId(),
      name: parameter.name!,
      type: parameter.type!,
      dataType: parameter.dataType!,
      required: parameter.required || false,
      description: parameter.description,
      validation: parameter.validation
    };
    
    endpoint.parameters.push(newParameter);
    endpoint.updatedAt = new Date().toISOString();
    
    return HttpResponse.json(newParameter, { status: 201 });
  }),

  // Update parameter
  http.put('/api/v2/system/service/:serviceName/endpoints/:endpointId/parameters/:parameterId', async ({ params, request }) => {
    const { serviceName, endpointId, parameterId } = params;
    const parameterUpdate = await request.json() as Partial<EndpointParameter>;
    
    const endpoint = mockEndpoints.find(
      ep => ep.id === endpointId && ep.serviceName === serviceName
    );
    
    if (!endpoint) {
      return HttpResponse.json(
        createApiError(404, `Endpoint ${endpointId} not found`),
        { status: 404 }
      );
    }
    
    const parameterIndex = endpoint.parameters.findIndex(p => p.id === parameterId);
    if (parameterIndex === -1) {
      return HttpResponse.json(
        createApiError(404, `Parameter ${parameterId} not found`),
        { status: 404 }
      );
    }
    
    const updatedParameter = {
      ...endpoint.parameters[parameterIndex],
      ...parameterUpdate
    };
    
    endpoint.parameters[parameterIndex] = updatedParameter;
    endpoint.updatedAt = new Date().toISOString();
    
    return HttpResponse.json(updatedParameter);
  }),

  // Delete parameter
  http.delete('/api/v2/system/service/:serviceName/endpoints/:endpointId/parameters/:parameterId', ({ params }) => {
    const { serviceName, endpointId, parameterId } = params;
    
    const endpoint = mockEndpoints.find(
      ep => ep.id === endpointId && ep.serviceName === serviceName
    );
    
    if (!endpoint) {
      return HttpResponse.json(
        createApiError(404, `Endpoint ${endpointId} not found`),
        { status: 404 }
      );
    }
    
    const parameterIndex = endpoint.parameters.findIndex(p => p.id === parameterId);
    if (parameterIndex === -1) {
      return HttpResponse.json(
        createApiError(404, `Parameter ${parameterId} not found`),
        { status: 404 }
      );
    }
    
    endpoint.parameters.splice(parameterIndex, 1);
    endpoint.updatedAt = new Date().toISOString();
    
    return HttpResponse.json({ success: true });
  }),

  // Get available security schemes
  http.get('/api/v2/system/security-schemes', () => {
    return HttpResponse.json({
      resource: mockSecuritySchemes,
      meta: {
        count: mockSecuritySchemes.length,
        schema: ['id', 'type', 'name', 'in', 'description']
      }
    });
  }),

  // Assign security scheme to endpoint
  http.post('/api/v2/system/service/:serviceName/endpoints/:endpointId/security', async ({ params, request }) => {
    const { serviceName, endpointId } = params;
    const securityScheme = await request.json() as { schemeId: string };
    
    const endpoint = mockEndpoints.find(
      ep => ep.id === endpointId && ep.serviceName === serviceName
    );
    
    if (!endpoint) {
      return HttpResponse.json(
        createApiError(404, `Endpoint ${endpointId} not found`),
        { status: 404 }
      );
    }
    
    const scheme = mockSecuritySchemes.find(s => s.id === securityScheme.schemeId);
    if (!scheme) {
      return HttpResponse.json(
        createApiError(404, `Security scheme ${securityScheme.schemeId} not found`),
        { status: 404 }
      );
    }
    
    // Check if already assigned
    const existing = endpoint.security.find(s => s.id === scheme.id);
    if (existing) {
      return HttpResponse.json(
        createApiError(409, 'Security scheme already assigned to endpoint'),
        { status: 409 }
      );
    }
    
    endpoint.security.push(scheme);
    endpoint.updatedAt = new Date().toISOString();
    
    return HttpResponse.json(scheme, { status: 201 });
  }),

  // Remove security scheme from endpoint
  http.delete('/api/v2/system/service/:serviceName/endpoints/:endpointId/security/:schemeId', ({ params }) => {
    const { serviceName, endpointId, schemeId } = params;
    
    const endpoint = mockEndpoints.find(
      ep => ep.id === endpointId && ep.serviceName === serviceName
    );
    
    if (!endpoint) {
      return HttpResponse.json(
        createApiError(404, `Endpoint ${endpointId} not found`),
        { status: 404 }
      );
    }
    
    const schemeIndex = endpoint.security.findIndex(s => s.id === schemeId);
    if (schemeIndex === -1) {
      return HttpResponse.json(
        createApiError(404, `Security scheme ${schemeId} not assigned to endpoint`),
        { status: 404 }
      );
    }
    
    endpoint.security.splice(schemeIndex, 1);
    endpoint.updatedAt = new Date().toISOString();
    
    return HttpResponse.json({ success: true });
  }),

  // Generate OpenAPI specification preview
  http.post('/api/v2/system/service/:serviceName/openapi/preview', async ({ params, request }) => {
    const { serviceName } = params;
    const options = await request.json() as { endpointIds?: string[]; format?: 'json' | 'yaml' };
    
    let endpointsToInclude = mockEndpoints.filter(ep => ep.serviceName === serviceName);
    
    // Filter by specific endpoints if requested
    if (options.endpointIds && options.endpointIds.length > 0) {
      endpointsToInclude = endpointsToInclude.filter(ep => 
        options.endpointIds!.includes(ep.id)
      );
    }
    
    if (endpointsToInclude.length === 0) {
      return HttpResponse.json(
        createApiError(404, 'No endpoints found for the specified criteria'),
        { status: 404 }
      );
    }
    
    const openApiSpec = generateOpenAPISpec(endpointsToInclude);
    
    // Simulate processing delay for realistic testing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return HttpResponse.json({
      specification: openApiSpec,
      format: options.format || 'json',
      generatedAt: new Date().toISOString(),
      endpointCount: endpointsToInclude.length
    });
  }),

  // Validate endpoint configuration
  http.post('/api/v2/system/service/:serviceName/endpoints/validate', async ({ params, request }) => {
    const { serviceName } = params;
    const config = await request.json() as Partial<EndpointConfiguration>;
    
    const validationErrors = validateEndpointConfiguration({
      ...config,
      serviceName: serviceName as string
    });
    
    // Additional business logic validation
    if (config.method === 'GET' && config.parameters?.some(p => p.type === 'body')) {
      validationErrors.push('GET requests cannot have body parameters');
    }
    
    if (config.method === 'DELETE' && config.parameters?.some(p => p.type === 'body')) {
      validationErrors.push('DELETE requests should not have body parameters');
    }
    
    // Check for required parameters in path
    if (config.path && config.path.includes('{') && config.path.includes('}')) {
      const pathParams = config.path.match(/{([^}]+)}/g)?.map(p => p.slice(1, -1)) || [];
      const definedPathParams = config.parameters?.filter(p => p.type === 'path').map(p => p.name) || [];
      
      const missingPathParams = pathParams.filter(pp => !definedPathParams.includes(pp));
      if (missingPathParams.length > 0) {
        validationErrors.push(`Missing path parameters: ${missingPathParams.join(', ')}`);
      }
    }
    
    return HttpResponse.json({
      valid: validationErrors.length === 0,
      errors: validationErrors,
      warnings: [],
      validatedAt: new Date().toISOString()
    });
  }),

  // Test endpoint configuration
  http.post('/api/v2/system/service/:serviceName/endpoints/:endpointId/test', async ({ params, request }) => {
    const { serviceName, endpointId } = params;
    const testData = await request.json() as { parameters: Record<string, any>; body?: any };
    
    const endpoint = mockEndpoints.find(
      ep => ep.id === endpointId && ep.serviceName === serviceName
    );
    
    if (!endpoint) {
      return HttpResponse.json(
        createApiError(404, `Endpoint ${endpointId} not found`),
        { status: 404 }
      );
    }
    
    // Simulate endpoint testing with various scenarios
    const testResults = {
      success: true,
      executionTime: Math.floor(Math.random() * 500) + 50, // 50-550ms
      requestUrl: endpoint.path,
      requestMethod: endpoint.method,
      requestParameters: testData.parameters,
      requestBody: testData.body,
      responseStatus: 200,
      responseHeaders: {
        'Content-Type': 'application/json',
        'X-DreamFactory-API-Key': 'test-key'
      },
      responseBody: {
        success: true,
        message: 'Test endpoint executed successfully',
        data: endpoint.method === 'GET' ? 
          { resource: [{ id: 1, name: 'Test Record' }] } :
          { id: 1, name: 'Test Record' }
      },
      validationResults: {
        parameterValidation: 'passed',
        securityValidation: 'passed',
        businessRuleValidation: 'passed'
      },
      testedAt: new Date().toISOString()
    };
    
    // Simulate occasional failures for testing error handling
    if (Math.random() < 0.1) { // 10% chance of failure
      testResults.success = false;
      testResults.responseStatus = 400;
      testResults.responseBody = createApiError(400, 'Validation failed during test execution');
    }
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return HttpResponse.json(testResults);
  }),

  // Error simulation endpoints for edge case testing
  http.get('/api/v2/system/service/error-simulation/endpoints', () => {
    return HttpResponse.json(
      createApiError(500, 'Internal server error - service temporarily unavailable'),
      { status: 500 }
    );
  }),

  http.post('/api/v2/system/service/timeout-simulation/endpoints', async () => {
    // Simulate timeout scenario
    await new Promise(resolve => setTimeout(resolve, 5000));
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/v2/system/service/rate-limit-simulation/endpoints', () => {
    return HttpResponse.json(
      createApiError(429, 'Rate limit exceeded - too many requests'),
      { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0'
        }
      }
    );
  })
];

/**
 * Default export for easy importing in test files
 */
export default endpointConfigurationHandlers;

/**
 * Helper function to reset mock data between tests
 */
export const resetMockData = (): void => {
  // Reset to initial state
  mockEndpoints.splice(2); // Keep first 2 mock endpoints
  
  // Reset any other shared state if needed
  console.log('Mock data reset for endpoint configuration handlers');
};

/**
 * Helper function to add custom mock endpoints for specific tests
 */
export const addMockEndpoint = (endpoint: EndpointConfiguration): void => {
  mockEndpoints.push(endpoint);
};

/**
 * Helper function to get current mock endpoints (for test assertions)
 */
export const getMockEndpoints = (): EndpointConfiguration[] => {
  return [...mockEndpoints];
};

/**
 * Export types for use in tests
 */
export type {
  EndpointConfiguration,
  EndpointParameter,
  SecurityScheme,
  ValidationRule,
  OpenAPISpecification,
  ApiError
};