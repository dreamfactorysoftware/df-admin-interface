/**
 * Comprehensive Mock Data and Fixtures for Endpoint Configuration Testing
 * 
 * Provides type-safe mock data and factory functions for testing API endpoint configuration
 * components. Includes OpenAPI specifications, endpoint parameters, HTTP methods, security
 * schemes, and response configurations for comprehensive test coverage.
 * 
 * @fileoverview Mock data factories for endpoint configuration testing
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import type { 
  EndpointConfiguration, 
  EndpointParameter, 
  HttpMethod, 
  SecurityScheme,
  ApiResponse,
  ValidationRule,
  QueryConfiguration,
  OpenApiSpecification,
  EndpointConfigForm
} from '../types';

// =============================================================================
// HTTP CONSTANTS AND HEADERS
// =============================================================================

/**
 * Standard HTTP headers for API configuration
 */
export const HTTP_HEADERS = {
  API_KEY: 'X-DreamFactory-API-Key',
  SESSION_TOKEN: 'X-DreamFactory-Session-Token',
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  ACCEPT: 'Accept',
  CACHE_CONTROL: 'Cache-Control',
  CORS_ORIGIN: 'Access-Control-Allow-Origin',
} as const;

/**
 * Standard HTTP status codes for API responses
 */
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Supported HTTP methods for endpoint configuration
 */
export const SUPPORTED_HTTP_METHODS: HttpMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE'
];

/**
 * Standard content types for API requests/responses
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  XML: 'application/xml',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  TEXT_PLAIN: 'text/plain',
  TEXT_HTML: 'text/html',
} as const;

// =============================================================================
// SECURITY SCHEME MOCK DATA
// =============================================================================

/**
 * Mock security schemes for API authentication testing
 */
export const mockSecuritySchemes: Record<string, SecurityScheme> = {
  BasicAuth: {
    type: 'http',
    scheme: 'basic',
    description: 'HTTP Basic Authentication'
  },
  BearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT Bearer Token Authentication'
  },
  ApiKeyQuery: {
    type: 'apiKey',
    in: 'query',
    name: 'api_key',
    description: 'API Key passed as query parameter'
  },
  ApiKeyHeader: {
    type: 'apiKey',
    in: 'header',
    name: HTTP_HEADERS.API_KEY,
    description: 'API Key passed in request header'
  },
  SessionTokenQuery: {
    type: 'apiKey',
    in: 'query',
    name: 'session_token',
    description: 'Session token passed as query parameter'
  },
  SessionTokenHeader: {
    type: 'apiKey',
    in: 'header',
    name: HTTP_HEADERS.SESSION_TOKEN,
    description: 'Session token passed in request header'
  },
  OAuth2: {
    type: 'oauth2',
    flows: {
      authorizationCode: {
        authorizationUrl: 'https://api.example.com/oauth/authorize',
        tokenUrl: 'https://api.example.com/oauth/token',
        scopes: {
          'read': 'Read access to resources',
          'write': 'Write access to resources',
          'admin': 'Administrative access'
        }
      }
    },
    description: 'OAuth 2.0 Authorization Code Flow'
  }
};

// =============================================================================
// ENDPOINT PARAMETER MOCK DATA
// =============================================================================

/**
 * Factory function for creating mock endpoint parameters
 */
export function createMockParameter(overrides: Partial<EndpointParameter> = {}): EndpointParameter {
  const defaults: EndpointParameter = {
    name: 'id',
    in: 'path',
    required: true,
    schema: {
      type: 'integer',
      format: 'int64'
    },
    description: 'Unique identifier for the resource',
    example: 123
  };

  return { ...defaults, ...overrides };
}

/**
 * Collection of common endpoint parameters for testing
 */
export const mockEndpointParameters = {
  // Path parameters
  pathId: createMockParameter({
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'integer', format: 'int64' },
    description: 'Resource identifier',
    example: 123
  }),
  
  pathServiceName: createMockParameter({
    name: 'serviceName',
    in: 'path',
    required: true,
    schema: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$' },
    description: 'Database service name',
    example: 'mysql_db'
  }),

  pathTableName: createMockParameter({
    name: 'tableName',
    in: 'path',
    required: true,
    schema: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$' },
    description: 'Database table name',
    example: 'users'
  }),

  // Query parameters
  queryLimit: createMockParameter({
    name: 'limit',
    in: 'query',
    required: false,
    schema: { type: 'integer', minimum: 1, maximum: 1000, default: 25 },
    description: 'Maximum number of records to return',
    example: 25
  }),

  queryOffset: createMockParameter({
    name: 'offset',
    in: 'query',
    required: false,
    schema: { type: 'integer', minimum: 0, default: 0 },
    description: 'Number of records to skip',
    example: 0
  }),

  queryFilter: createMockParameter({
    name: 'filter',
    in: 'query',
    required: false,
    schema: { type: 'string' },
    description: 'Filter conditions for the query',
    example: 'name = "John Doe"'
  }),

  querySort: createMockParameter({
    name: 'order',
    in: 'query',
    required: false,
    schema: { type: 'string' },
    description: 'Sort order for results',
    example: 'name ASC, created_at DESC'
  }),

  queryFields: createMockParameter({
    name: 'fields',
    in: 'query',
    required: false,
    schema: { type: 'string' },
    description: 'Comma-separated list of fields to return',
    example: 'id,name,email'
  }),

  queryFormat: createMockParameter({
    name: 'format',
    in: 'query',
    required: false,
    schema: { 
      type: 'string',
      enum: ['json', 'xml'],
      default: 'json'
    },
    description: 'Response format',
    example: 'json'
  }),

  // Header parameters
  headerApiKey: createMockParameter({
    name: HTTP_HEADERS.API_KEY,
    in: 'header',
    required: true,
    schema: { type: 'string', minLength: 32 },
    description: 'API key for authentication',
    example: 'your-api-key-here'
  }),

  headerSessionToken: createMockParameter({
    name: HTTP_HEADERS.SESSION_TOKEN,
    in: 'header',
    required: false,
    schema: { type: 'string' },
    description: 'Session token for authentication',
    example: 'session-token-here'
  }),

  headerContentType: createMockParameter({
    name: HTTP_HEADERS.CONTENT_TYPE,
    in: 'header',
    required: false,
    schema: { 
      type: 'string',
      enum: [CONTENT_TYPES.JSON, CONTENT_TYPES.XML],
      default: CONTENT_TYPES.JSON
    },
    description: 'Content type of the request body',
    example: CONTENT_TYPES.JSON
  })
};

// =============================================================================
// API RESPONSE MOCK DATA
// =============================================================================

/**
 * Factory function for creating mock API responses
 */
export function createMockApiResponse(overrides: Partial<ApiResponse> = {}): ApiResponse {
  const defaults: ApiResponse = {
    description: 'Successful response',
    content: {
      [CONTENT_TYPES.JSON]: {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the operation was successful'
            }
          }
        }
      }
    }
  };

  return { ...defaults, ...overrides };
}

/**
 * Standard API response templates
 */
export const mockApiResponses = {
  // Success responses
  success: createMockApiResponse({
    description: 'Operation completed successfully',
    content: {
      [CONTENT_TYPES.JSON]: {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true }
          }
        }
      }
    }
  }),

  created: createMockApiResponse({
    description: 'Resource created successfully',
    content: {
      [CONTENT_TYPES.JSON]: {
        schema: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 123 },
            message: { type: 'string', example: 'Resource created successfully' }
          }
        }
      }
    }
  }),

  resourceList: createMockApiResponse({
    description: 'List of resources',
    content: {
      [CONTENT_TYPES.JSON]: {
        schema: {
          type: 'object',
          properties: {
            resource: {
              type: 'array',
              items: { type: 'object' },
              description: 'Array of resources'
            },
            meta: {
              type: 'object',
              properties: {
                count: { type: 'integer', description: 'Total count of resources' },
                limit: { type: 'integer', description: 'Limit applied to the query' },
                offset: { type: 'integer', description: 'Offset applied to the query' }
              }
            }
          }
        }
      }
    }
  }),

  // Error responses
  badRequest: createMockApiResponse({
    description: 'Bad request - validation errors',
    content: {
      [CONTENT_TYPES.JSON]: {
        schema: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'integer', example: 400 },
                message: { type: 'string', example: 'Validation failed' },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }),

  unauthorized: createMockApiResponse({
    description: 'Authentication required',
    content: {
      [CONTENT_TYPES.JSON]: {
        schema: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'integer', example: 401 },
                message: { type: 'string', example: 'Authentication required' }
              }
            }
          }
        }
      }
    }
  }),

  forbidden: createMockApiResponse({
    description: 'Access forbidden',
    content: {
      [CONTENT_TYPES.JSON]: {
        schema: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'integer', example: 403 },
                message: { type: 'string', example: 'Access forbidden' }
              }
            }
          }
        }
      }
    }
  }),

  notFound: createMockApiResponse({
    description: 'Resource not found',
    content: {
      [CONTENT_TYPES.JSON]: {
        schema: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'integer', example: 404 },
                message: { type: 'string', example: 'Resource not found' }
              }
            }
          }
        }
      }
    }
  }),

  internalError: createMockApiResponse({
    description: 'Internal server error',
    content: {
      [CONTENT_TYPES.JSON]: {
        schema: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'integer', example: 500 },
                message: { type: 'string', example: 'Internal server error' }
              }
            }
          }
        }
      }
    }
  })
};

// =============================================================================
// VALIDATION RULES MOCK DATA
// =============================================================================

/**
 * Factory function for creating mock validation rules
 */
export function createMockValidationRule(overrides: Partial<ValidationRule> = {}): ValidationRule {
  const defaults: ValidationRule = {
    field: 'email',
    operator: 'required',
    value: true,
    message: 'This field is required'
  };

  return { ...defaults, ...overrides };
}

/**
 * Common validation rules for testing
 */
export const mockValidationRules = {
  required: createMockValidationRule({
    field: 'name',
    operator: 'required',
    value: true,
    message: 'Name is required'
  }),

  minLength: createMockValidationRule({
    field: 'password',
    operator: 'min_length',
    value: 8,
    message: 'Password must be at least 8 characters'
  }),

  maxLength: createMockValidationRule({
    field: 'description',
    operator: 'max_length',
    value: 255,
    message: 'Description cannot exceed 255 characters'
  }),

  email: createMockValidationRule({
    field: 'email',
    operator: 'email',
    value: true,
    message: 'Please enter a valid email address'
  }),

  numeric: createMockValidationRule({
    field: 'age',
    operator: 'numeric',
    value: true,
    message: 'Age must be a number'
  }),

  range: createMockValidationRule({
    field: 'rating',
    operator: 'between',
    value: [1, 5],
    message: 'Rating must be between 1 and 5'
  }),

  pattern: createMockValidationRule({
    field: 'phone',
    operator: 'regex',
    value: '^\\+?[1-9]\\d{1,14}$',
    message: 'Please enter a valid phone number'
  })
};

// =============================================================================
// QUERY CONFIGURATION MOCK DATA
// =============================================================================

/**
 * Factory function for creating mock query configurations
 */
export function createMockQueryConfiguration(overrides: Partial<QueryConfiguration> = {}): QueryConfiguration {
  const defaults: QueryConfiguration = {
    pagination: {
      enabled: true,
      defaultLimit: 25,
      maxLimit: 1000
    },
    filtering: {
      enabled: true,
      allowedOperators: ['=', '!=', '<', '>', '<=', '>=', 'LIKE', 'IN', 'NOT IN']
    },
    sorting: {
      enabled: true,
      defaultSort: 'id ASC',
      allowedFields: ['id', 'name', 'created_at', 'updated_at']
    },
    fieldSelection: {
      enabled: true,
      allowedFields: ['*']
    }
  };

  return { ...defaults, ...overrides };
}

/**
 * Pre-configured query configurations for different use cases
 */
export const mockQueryConfigurations = {
  standard: createMockQueryConfiguration(),

  readOnly: createMockQueryConfiguration({
    pagination: {
      enabled: true,
      defaultLimit: 50,
      maxLimit: 500
    },
    filtering: {
      enabled: true,
      allowedOperators: ['=', 'LIKE', 'IN']
    },
    sorting: {
      enabled: true,
      defaultSort: 'name ASC',
      allowedFields: ['name', 'created_at']
    },
    fieldSelection: {
      enabled: false,
      allowedFields: []
    }
  }),

  minimal: createMockQueryConfiguration({
    pagination: {
      enabled: true,
      defaultLimit: 10,
      maxLimit: 100
    },
    filtering: {
      enabled: false,
      allowedOperators: []
    },
    sorting: {
      enabled: false,
      defaultSort: '',
      allowedFields: []
    },
    fieldSelection: {
      enabled: false,
      allowedFields: []
    }
  }),

  advanced: createMockQueryConfiguration({
    pagination: {
      enabled: true,
      defaultLimit: 100,
      maxLimit: 5000
    },
    filtering: {
      enabled: true,
      allowedOperators: ['=', '!=', '<', '>', '<=', '>=', 'LIKE', 'NOT LIKE', 'IN', 'NOT IN', 'IS NULL', 'IS NOT NULL']
    },
    sorting: {
      enabled: true,
      defaultSort: 'updated_at DESC',
      allowedFields: ['*']
    },
    fieldSelection: {
      enabled: true,
      allowedFields: ['*']
    }
  })
};

// =============================================================================
// ENDPOINT CONFIGURATION MOCK DATA
// =============================================================================

/**
 * Factory function for creating mock endpoint configurations
 */
export function createMockEndpointConfiguration(overrides: Partial<EndpointConfiguration> = {}): EndpointConfiguration {
  const defaults: EndpointConfiguration = {
    path: '/api/v2/users',
    method: 'GET',
    operationId: 'getUsers',
    summary: 'Get list of users',
    description: 'Retrieve a paginated list of users with optional filtering and sorting',
    tags: ['users'],
    parameters: [
      mockEndpointParameters.queryLimit,
      mockEndpointParameters.queryOffset,
      mockEndpointParameters.queryFilter,
      mockEndpointParameters.querySort
    ],
    responses: {
      '200': mockApiResponses.resourceList,
      '400': mockApiResponses.badRequest,
      '401': mockApiResponses.unauthorized,
      '500': mockApiResponses.internalError
    },
    security: [
      { ApiKeyHeader: [] },
      { SessionTokenHeader: [] }
    ],
    queryConfiguration: mockQueryConfigurations.standard,
    validationRules: [
      mockValidationRules.required
    ]
  };

  return { ...defaults, ...overrides };
}

/**
 * Complete endpoint configurations for different HTTP methods
 */
export const mockEndpointConfigurations = {
  // GET endpoints
  getUsers: createMockEndpointConfiguration(),

  getUserById: createMockEndpointConfiguration({
    path: '/api/v2/users/{id}',
    method: 'GET',
    operationId: 'getUserById',
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by their unique identifier',
    parameters: [
      mockEndpointParameters.pathId,
      mockEndpointParameters.queryFields
    ],
    responses: {
      '200': mockApiResponses.success,
      '404': mockApiResponses.notFound,
      '401': mockApiResponses.unauthorized,
      '500': mockApiResponses.internalError
    }
  }),

  // POST endpoints
  createUser: createMockEndpointConfiguration({
    path: '/api/v2/users',
    method: 'POST',
    operationId: 'createUser',
    summary: 'Create new user',
    description: 'Create a new user with the provided data',
    parameters: [
      mockEndpointParameters.headerContentType
    ],
    requestBody: {
      required: true,
      content: {
        [CONTENT_TYPES.JSON]: {
          schema: {
            type: 'object',
            required: ['name', 'email'],
            properties: {
              name: {
                type: 'string',
                minLength: 1,
                maxLength: 100,
                example: 'John Doe'
              },
              email: {
                type: 'string',
                format: 'email',
                example: 'john.doe@example.com'
              },
              password: {
                type: 'string',
                minLength: 8,
                format: 'password',
                example: 'securePassword123'
              }
            }
          }
        }
      }
    },
    responses: {
      '201': mockApiResponses.created,
      '400': mockApiResponses.badRequest,
      '401': mockApiResponses.unauthorized,
      '409': {
        description: 'User already exists',
        content: {
          [CONTENT_TYPES.JSON]: {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'integer', example: 409 },
                    message: { type: 'string', example: 'User with this email already exists' }
                  }
                }
              }
            }
          }
        }
      },
      '500': mockApiResponses.internalError
    },
    validationRules: [
      mockValidationRules.required,
      mockValidationRules.email,
      mockValidationRules.minLength
    ]
  }),

  // PUT endpoints
  updateUser: createMockEndpointConfiguration({
    path: '/api/v2/users/{id}',
    method: 'PUT',
    operationId: 'updateUser',
    summary: 'Update user',
    description: 'Update an existing user with the provided data',
    parameters: [
      mockEndpointParameters.pathId,
      mockEndpointParameters.headerContentType
    ],
    requestBody: {
      required: true,
      content: {
        [CONTENT_TYPES.JSON]: {
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                minLength: 1,
                maxLength: 100,
                example: 'John Smith'
              },
              email: {
                type: 'string',
                format: 'email',
                example: 'john.smith@example.com'
              }
            }
          }
        }
      }
    },
    responses: {
      '200': mockApiResponses.success,
      '400': mockApiResponses.badRequest,
      '401': mockApiResponses.unauthorized,
      '404': mockApiResponses.notFound,
      '500': mockApiResponses.internalError
    },
    validationRules: [
      mockValidationRules.email,
      mockValidationRules.maxLength
    ]
  }),

  // PATCH endpoints
  patchUser: createMockEndpointConfiguration({
    path: '/api/v2/users/{id}',
    method: 'PATCH',
    operationId: 'patchUser',
    summary: 'Partially update user',
    description: 'Partially update specific fields of an existing user',
    parameters: [
      mockEndpointParameters.pathId,
      mockEndpointParameters.headerContentType
    ],
    requestBody: {
      required: true,
      content: {
        [CONTENT_TYPES.JSON]: {
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                minLength: 1,
                maxLength: 100,
                example: 'Updated Name'
              },
              email: {
                type: 'string',
                format: 'email',
                example: 'updated@example.com'
              },
              active: {
                type: 'boolean',
                example: true
              }
            }
          }
        }
      }
    },
    responses: {
      '200': mockApiResponses.success,
      '400': mockApiResponses.badRequest,
      '401': mockApiResponses.unauthorized,
      '404': mockApiResponses.notFound,
      '500': mockApiResponses.internalError
    }
  }),

  // DELETE endpoints
  deleteUser: createMockEndpointConfiguration({
    path: '/api/v2/users/{id}',
    method: 'DELETE',
    operationId: 'deleteUser',
    summary: 'Delete user',
    description: 'Delete a specific user by their unique identifier',
    parameters: [
      mockEndpointParameters.pathId
    ],
    responses: {
      '204': {
        description: 'User deleted successfully'
      },
      '401': mockApiResponses.unauthorized,
      '404': mockApiResponses.notFound,
      '500': mockApiResponses.internalError
    }
  })
};

// =============================================================================
// OPENAPI SPECIFICATION MOCK DATA
// =============================================================================

/**
 * Factory function for creating complete OpenAPI specifications
 */
export function createMockOpenApiSpec(overrides: Partial<OpenApiSpecification> = {}): OpenApiSpecification {
  const defaults: OpenApiSpecification = {
    openapi: '3.0.3',
    info: {
      title: 'DreamFactory API',
      description: 'Auto-generated REST API for database operations',
      version: '1.0.0',
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
        url: '/api/v2',
        description: 'DreamFactory API v2'
      }
    ],
    components: {
      securitySchemes: mockSecuritySchemes,
      responses: mockApiResponses,
      schemas: {
        User: {
          type: 'object',
          required: ['id', 'name', 'email'],
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
              description: 'Unique identifier',
              example: 123
            },
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              description: 'User full name',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
              example: '2024-01-01T00:00:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
              example: '2024-01-01T00:00:00Z'
            }
          }
        },
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'object',
              required: ['code', 'message'],
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
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      { ApiKeyHeader: [] },
      { SessionTokenHeader: [] }
    ],
    tags: [
      {
        name: 'users',
        description: 'User management operations'
      }
    ],
    paths: {}
  };

  return { ...defaults, ...overrides };
}

/**
 * Complete OpenAPI specifications for different database services
 */
export const mockOpenApiSpecs = {
  // MySQL database service
  mysql: createMockOpenApiSpec({
    info: {
      title: 'MySQL Database API',
      description: 'Auto-generated REST API for MySQL database operations',
      version: '1.0.0'
    },
    servers: [
      {
        url: '/api/v2/mysql_db',
        description: 'MySQL Database Service'
      }
    ],
    paths: {
      '/users': {
        get: {
          ...mockEndpointConfigurations.getUsers,
          tags: ['users']
        },
        post: {
          ...mockEndpointConfigurations.createUser,
          tags: ['users']
        }
      },
      '/users/{id}': {
        get: {
          ...mockEndpointConfigurations.getUserById,
          tags: ['users']
        },
        put: {
          ...mockEndpointConfigurations.updateUser,
          tags: ['users']
        },
        patch: {
          ...mockEndpointConfigurations.patchUser,
          tags: ['users']
        },
        delete: {
          ...mockEndpointConfigurations.deleteUser,
          tags: ['users']
        }
      }
    }
  }),

  // PostgreSQL database service
  postgresql: createMockOpenApiSpec({
    info: {
      title: 'PostgreSQL Database API',
      description: 'Auto-generated REST API for PostgreSQL database operations',
      version: '1.0.0'
    },
    servers: [
      {
        url: '/api/v2/postgres_db',
        description: 'PostgreSQL Database Service'
      }
    ]
  }),

  // MongoDB service
  mongodb: createMockOpenApiSpec({
    info: {
      title: 'MongoDB API',
      description: 'Auto-generated REST API for MongoDB operations',
      version: '1.0.0'
    },
    servers: [
      {
        url: '/api/v2/mongo_db',
        description: 'MongoDB Service'
      }
    ]
  })
};

// =============================================================================
// FORM CONFIGURATION MOCK DATA
// =============================================================================

/**
 * Mock endpoint configuration form data for React Hook Form testing
 */
export const mockEndpointConfigForm: EndpointConfigForm = {
  serviceName: 'mysql_db',
  tableName: 'users',
  path: '/api/v2/mysql_db/users',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  security: {
    enabled: true,
    schemes: ['ApiKeyHeader', 'SessionTokenHeader'],
    requireAuthentication: true
  },
  queryConfig: mockQueryConfigurations.standard,
  validationRules: [
    mockValidationRules.required,
    mockValidationRules.email,
    mockValidationRules.minLength
  ],
  responseFormats: [CONTENT_TYPES.JSON, CONTENT_TYPES.XML],
  tags: ['users', 'database'],
  description: 'User management endpoints for the MySQL database service',
  generateDocumentation: true,
  enableTesting: true
};

// =============================================================================
// FACTORY FUNCTIONS FOR DYNAMIC TEST DATA
// =============================================================================

/**
 * Factory for creating endpoint configurations with random data
 */
export function createRandomEndpointConfig(
  serviceName: string,
  tableName: string,
  methods: HttpMethod[] = ['GET']
): EndpointConfiguration {
  const config = createMockEndpointConfiguration({
    path: `/api/v2/${serviceName}/${tableName}`,
    method: methods[0],
    operationId: `${methods[0].toLowerCase()}${tableName.charAt(0).toUpperCase() + tableName.slice(1)}`,
    summary: `${methods[0]} ${tableName}`,
    description: `${methods[0]} operation for ${tableName} in ${serviceName}`,
    tags: [tableName, serviceName]
  });

  return config;
}

/**
 * Factory for creating complete OpenAPI specs for testing
 */
export function createTestOpenApiSpec(
  serviceName: string,
  tables: string[],
  methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
): OpenApiSpecification {
  const spec = createMockOpenApiSpec({
    info: {
      title: `${serviceName} API`,
      description: `Auto-generated API for ${serviceName} service`,
      version: '1.0.0'
    },
    servers: [
      {
        url: `/api/v2/${serviceName}`,
        description: `${serviceName} Service`
      }
    ]
  });

  // Generate paths for each table and method combination
  const paths: Record<string, any> = {};
  
  tables.forEach(table => {
    methods.forEach(method => {
      const pathKey = method === 'POST' ? `/${table}` : `/${table}/{id}`;
      
      if (!paths[pathKey]) {
        paths[pathKey] = {};
      }
      
      paths[pathKey][method.toLowerCase()] = createRandomEndpointConfig(
        serviceName,
        table,
        [method]
      );
    });
  });

  spec.paths = paths;
  return spec;
}

/**
 * Utility function to create MSW-compatible response data
 */
export function createMswResponseData(
  endpointConfig: EndpointConfiguration,
  statusCode: number = HTTP_STATUS_CODES.OK
): any {
  const response = endpointConfig.responses?.[statusCode.toString()];
  
  if (!response) {
    return { success: true };
  }

  // Extract example data from schema
  const content = response.content?.[CONTENT_TYPES.JSON];
  if (content?.schema) {
    return generateExampleFromSchema(content.schema);
  }

  return { success: true };
}

/**
 * Helper function to generate example data from JSON schema
 */
function generateExampleFromSchema(schema: any): any {
  if (schema.example) {
    return schema.example;
  }

  if (schema.type === 'object' && schema.properties) {
    const result: any = {};
    for (const [key, prop] of Object.entries(schema.properties as any)) {
      result[key] = generateExampleFromSchema(prop);
    }
    return result;
  }

  if (schema.type === 'array' && schema.items) {
    return [generateExampleFromSchema(schema.items)];
  }

  // Default values for primitive types
  switch (schema.type) {
    case 'string':
      return schema.format === 'email' ? 'test@example.com' : 'string';
    case 'integer':
      return 123;
    case 'number':
      return 123.45;
    case 'boolean':
      return true;
    default:
      return null;
  }
}

// =============================================================================
// EXPORT COLLECTIONS
// =============================================================================

/**
 * Complete collection of all mock data for easy importing
 */
export const mockData = {
  constants: {
    HTTP_HEADERS,
    HTTP_STATUS_CODES,
    SUPPORTED_HTTP_METHODS,
    CONTENT_TYPES
  },
  securitySchemes: mockSecuritySchemes,
  parameters: mockEndpointParameters,
  responses: mockApiResponses,
  validationRules: mockValidationRules,
  queryConfigurations: mockQueryConfigurations,
  endpointConfigurations: mockEndpointConfigurations,
  openApiSpecs: mockOpenApiSpecs,
  formData: mockEndpointConfigForm
};

/**
 * Factory functions for dynamic data generation
 */
export const factories = {
  createMockParameter,
  createMockApiResponse,
  createMockValidationRule,
  createMockQueryConfiguration,
  createMockEndpointConfiguration,
  createMockOpenApiSpec,
  createRandomEndpointConfig,
  createTestOpenApiSpec,
  createMswResponseData
};

// Default export for convenient importing
export default mockData;