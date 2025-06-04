/**
 * Comprehensive mock data and fixtures for endpoint configuration testing
 * 
 * This module provides realistic test data for unit tests, integration tests, and MSW handlers
 * with type-safe interfaces derived from the original Angular mock data patterns.
 * 
 * Features:
 * - OpenAPI 3.0+ specification mock data for F-003 REST API Endpoint Generation
 * - Endpoint configuration objects for HTTP methods, parameters, and security
 * - Type-safe mock data compatible with Zod schema validators
 * - React Hook Form testing fixtures
 * - MSW-compatible mock responses
 * - 90%+ test coverage support per Section 2.4 Implementation Considerations
 */

// Core endpoint configuration types
export interface MockEndpointConfiguration {
  id: string;
  name: string;
  description?: string;
  method: HttpMethod;
  path: string;
  parameters: EndpointParameter[];
  requestBody?: RequestBodyConfiguration;
  responses: ResponseConfiguration[];
  security: SecurityConfiguration[];
  tags: string[];
  operationId: string;
  deprecated?: boolean;
  summary?: string;
}

export interface EndpointParameter {
  name: string;
  in: ParameterLocation;
  required: boolean;
  schema: ParameterSchema;
  description?: string;
  example?: any;
  style?: ParameterStyle;
  explode?: boolean;
}

export interface RequestBodyConfiguration {
  description?: string;
  required: boolean;
  content: Record<string, MediaTypeConfiguration>;
}

export interface ResponseConfiguration {
  statusCode: string;
  description: string;
  content?: Record<string, MediaTypeConfiguration>;
  headers?: Record<string, HeaderConfiguration>;
}

export interface MediaTypeConfiguration {
  schema: SchemaConfiguration;
  example?: any;
  examples?: Record<string, ExampleConfiguration>;
}

export interface SchemaConfiguration {
  type: SchemaType;
  format?: string;
  properties?: Record<string, SchemaConfiguration>;
  items?: SchemaConfiguration;
  required?: string[];
  enum?: any[];
  minimum?: number;
  maximum?: number;
  pattern?: string;
  additionalProperties?: boolean | SchemaConfiguration;
  description?: string;
  example?: any;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
}

export interface SecurityConfiguration {
  type: SecurityType;
  name: string;
  description?: string;
  in?: SecurityLocation;
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlowConfiguration;
  openIdConnectUrl?: string;
  scopes?: string[];
}

export interface OAuthFlowConfiguration {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export interface HeaderConfiguration {
  description?: string;
  required?: boolean;
  schema: SchemaConfiguration;
  example?: any;
}

export interface ExampleConfiguration {
  summary?: string;
  description?: string;
  value: any;
  externalValue?: string;
}

// Enums for type safety
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export type ParameterLocation = 'query' | 'header' | 'path' | 'cookie';
export type ParameterStyle = 'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject';
export type SchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';
export type SecurityType = 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
export type SecurityLocation = 'query' | 'header' | 'cookie';

// Mock HTTP status codes for comprehensive testing
export const MOCK_HTTP_STATUS_CODES = {
  SUCCESS: {
    OK: '200',
    CREATED: '201',
    ACCEPTED: '202',
    NO_CONTENT: '204',
  },
  CLIENT_ERROR: {
    BAD_REQUEST: '400',
    UNAUTHORIZED: '401',
    FORBIDDEN: '403',
    NOT_FOUND: '404',
    METHOD_NOT_ALLOWED: '405',
    CONFLICT: '409',
    UNPROCESSABLE_ENTITY: '422',
    TOO_MANY_REQUESTS: '429',
  },
  SERVER_ERROR: {
    INTERNAL_SERVER_ERROR: '500',
    NOT_IMPLEMENTED: '501',
    BAD_GATEWAY: '502',
    SERVICE_UNAVAILABLE: '503',
    GATEWAY_TIMEOUT: '504',
  },
} as const;

// Mock media types for content negotiation testing
export const MOCK_MEDIA_TYPES = {
  JSON: 'application/json',
  XML: 'application/xml',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  TEXT_PLAIN: 'text/plain',
  TEXT_HTML: 'text/html',
  BINARY: 'application/octet-stream',
} as const;

// Mock schema configurations for various data types
export const MOCK_SCHEMAS: Record<string, SchemaConfiguration> = {
  STRING: {
    type: 'string',
    description: 'A simple string value',
    example: 'example string',
  },
  EMAIL: {
    type: 'string',
    format: 'email',
    description: 'Email address',
    pattern: '^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$',
    example: 'user@example.com',
  },
  UUID: {
    type: 'string',
    format: 'uuid',
    description: 'UUID identifier',
    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
    example: '123e4567-e89b-12d3-a456-426614174000',
  },
  INTEGER: {
    type: 'integer',
    description: 'Integer value',
    minimum: 0,
    example: 42,
  },
  POSITIVE_INTEGER: {
    type: 'integer',
    format: 'int32',
    description: 'Positive integer value',
    minimum: 1,
    example: 123,
  },
  NUMBER: {
    type: 'number',
    description: 'Numeric value',
    example: 3.14159,
  },
  BOOLEAN: {
    type: 'boolean',
    description: 'Boolean value',
    example: true,
  },
  DATE: {
    type: 'string',
    format: 'date',
    description: 'Date in YYYY-MM-DD format',
    example: '2024-01-15',
  },
  DATETIME: {
    type: 'string',
    format: 'date-time',
    description: 'DateTime in ISO 8601 format',
    example: '2024-01-15T10:30:00Z',
  },
  ENUM_STATUS: {
    type: 'string',
    enum: ['active', 'inactive', 'pending', 'suspended'],
    description: 'Status enumeration',
    example: 'active',
  },
  ARRAY_STRINGS: {
    type: 'array',
    items: {
      type: 'string',
    },
    description: 'Array of strings',
    example: ['item1', 'item2', 'item3'],
  },
  ARRAY_INTEGERS: {
    type: 'array',
    items: {
      type: 'integer',
    },
    description: 'Array of integers',
    example: [1, 2, 3, 4, 5],
  },
  PAGINATION_OBJECT: {
    type: 'object',
    properties: {
      page: {
        type: 'integer',
        minimum: 1,
        description: 'Current page number',
        example: 1,
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        description: 'Number of items per page',
        example: 20,
      },
      total: {
        type: 'integer',
        minimum: 0,
        description: 'Total number of items',
        example: 150,
      },
      totalPages: {
        type: 'integer',
        minimum: 0,
        description: 'Total number of pages',
        example: 8,
      },
    },
    required: ['page', 'limit', 'total', 'totalPages'],
    description: 'Pagination information',
  },
  ERROR_OBJECT: {
    type: 'object',
    properties: {
      error: {
        type: 'object',
        properties: {
          code: {
            type: 'integer',
            description: 'Error code',
            example: 400,
          },
          message: {
            type: 'string',
            description: 'Error message',
            example: 'Bad Request',
          },
          details: {
            type: 'string',
            description: 'Detailed error description',
            example: 'The request body is missing required fields',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Error timestamp',
            example: '2024-01-15T10:30:00Z',
          },
        },
        required: ['code', 'message'],
      },
    },
    required: ['error'],
    description: 'Standard error response',
  },
} as const;

// Mock security configurations
export const MOCK_SECURITY_CONFIGS: Record<string, SecurityConfiguration> = {
  API_KEY_HEADER: {
    type: 'apiKey',
    name: 'X-API-Key',
    in: 'header',
    description: 'API key authentication via header',
  },
  API_KEY_QUERY: {
    type: 'apiKey',
    name: 'api_key',
    in: 'query',
    description: 'API key authentication via query parameter',
  },
  BEARER_TOKEN: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    name: 'Authorization',
    description: 'Bearer token authentication',
  },
  BASIC_AUTH: {
    type: 'http',
    scheme: 'basic',
    name: 'Authorization',
    description: 'Basic HTTP authentication',
  },
  OAUTH2_AUTH_CODE: {
    type: 'oauth2',
    name: 'oauth2AuthCode',
    description: 'OAuth 2.0 Authorization Code Flow',
    flows: {
      authorizationUrl: 'https://api.example.com/oauth/authorize',
      tokenUrl: 'https://api.example.com/oauth/token',
      scopes: {
        'read': 'Read access to resources',
        'write': 'Write access to resources',
        'admin': 'Administrative access',
      },
    },
  },
  OAUTH2_CLIENT_CREDENTIALS: {
    type: 'oauth2',
    name: 'oauth2ClientCredentials',
    description: 'OAuth 2.0 Client Credentials Flow',
    flows: {
      tokenUrl: 'https://api.example.com/oauth/token',
      scopes: {
        'api:read': 'Read API access',
        'api:write': 'Write API access',
      },
    },
  },
} as const;

// Mock endpoint parameters
export const MOCK_PARAMETERS: Record<string, EndpointParameter> = {
  ID_PATH: {
    name: 'id',
    in: 'path',
    required: true,
    schema: MOCK_SCHEMAS.UUID,
    description: 'Resource identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  },
  LIMIT_QUERY: {
    name: 'limit',
    in: 'query',
    required: false,
    schema: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 20,
    },
    description: 'Number of items to return',
    example: 20,
  },
  OFFSET_QUERY: {
    name: 'offset',
    in: 'query',
    required: false,
    schema: {
      type: 'integer',
      minimum: 0,
      default: 0,
    },
    description: 'Number of items to skip',
    example: 0,
  },
  SORT_QUERY: {
    name: 'sort',
    in: 'query',
    required: false,
    schema: {
      type: 'string',
      pattern: '^[a-zA-Z_][a-zA-Z0-9_]*(:asc|:desc)?$',
    },
    description: 'Sort field and direction (field:asc or field:desc)',
    example: 'created_at:desc',
  },
  FILTER_QUERY: {
    name: 'filter',
    in: 'query',
    required: false,
    schema: {
      type: 'string',
    },
    description: 'Filter expression for results',
    example: 'status=active AND created_at>2024-01-01',
  },
  INCLUDE_QUERY: {
    name: 'include',
    in: 'query',
    required: false,
    schema: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    style: 'form',
    explode: false,
    description: 'Related resources to include',
    example: ['metadata', 'relationships'],
  },
  CONTENT_TYPE_HEADER: {
    name: 'Content-Type',
    in: 'header',
    required: true,
    schema: {
      type: 'string',
      enum: [
        MOCK_MEDIA_TYPES.JSON,
        MOCK_MEDIA_TYPES.XML,
        MOCK_MEDIA_TYPES.FORM_DATA,
        MOCK_MEDIA_TYPES.URL_ENCODED,
      ],
    },
    description: 'Content type of the request body',
    example: MOCK_MEDIA_TYPES.JSON,
  },
  ACCEPT_HEADER: {
    name: 'Accept',
    in: 'header',
    required: false,
    schema: {
      type: 'string',
      enum: [
        MOCK_MEDIA_TYPES.JSON,
        MOCK_MEDIA_TYPES.XML,
        MOCK_MEDIA_TYPES.TEXT_PLAIN,
      ],
    },
    description: 'Acceptable response content types',
    example: MOCK_MEDIA_TYPES.JSON,
  },
} as const;

// Mock response configurations
export const MOCK_RESPONSES: Record<string, ResponseConfiguration> = {
  SUCCESS_LIST: {
    statusCode: MOCK_HTTP_STATUS_CODES.SUCCESS.OK,
    description: 'Successful list response',
    content: {
      [MOCK_MEDIA_TYPES.JSON]: {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: MOCK_SCHEMAS.UUID,
                  name: MOCK_SCHEMAS.STRING,
                  status: MOCK_SCHEMAS.ENUM_STATUS,
                  created_at: MOCK_SCHEMAS.DATETIME,
                  updated_at: MOCK_SCHEMAS.DATETIME,
                },
                required: ['id', 'name', 'status'],
              },
            },
            meta: MOCK_SCHEMAS.PAGINATION_OBJECT,
          },
          required: ['data', 'meta'],
        },
        example: {
          data: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Example Item 1',
              status: 'active',
              created_at: '2024-01-15T10:30:00Z',
              updated_at: '2024-01-15T10:30:00Z',
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'Example Item 2',
              status: 'inactive',
              created_at: '2024-01-14T15:45:00Z',
              updated_at: '2024-01-14T15:45:00Z',
            },
          ],
          meta: {
            page: 1,
            limit: 20,
            total: 150,
            totalPages: 8,
          },
        },
      },
    },
  },
  SUCCESS_ITEM: {
    statusCode: MOCK_HTTP_STATUS_CODES.SUCCESS.OK,
    description: 'Successful item response',
    content: {
      [MOCK_MEDIA_TYPES.JSON]: {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: MOCK_SCHEMAS.UUID,
                name: MOCK_SCHEMAS.STRING,
                description: MOCK_SCHEMAS.STRING,
                status: MOCK_SCHEMAS.ENUM_STATUS,
                email: MOCK_SCHEMAS.EMAIL,
                created_at: MOCK_SCHEMAS.DATETIME,
                updated_at: MOCK_SCHEMAS.DATETIME,
                metadata: {
                  type: 'object',
                  additionalProperties: true,
                },
              },
              required: ['id', 'name', 'status'],
            },
          },
          required: ['data'],
        },
        example: {
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Example Item',
            description: 'This is an example item for testing',
            status: 'active',
            email: 'user@example.com',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:30:00Z',
            metadata: {
              category: 'test',
              priority: 'high',
            },
          },
        },
      },
    },
  },
  SUCCESS_CREATED: {
    statusCode: MOCK_HTTP_STATUS_CODES.SUCCESS.CREATED,
    description: 'Resource created successfully',
    content: {
      [MOCK_MEDIA_TYPES.JSON]: {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: MOCK_SCHEMAS.UUID,
                name: MOCK_SCHEMAS.STRING,
                status: MOCK_SCHEMAS.ENUM_STATUS,
                created_at: MOCK_SCHEMAS.DATETIME,
              },
              required: ['id', 'name', 'status', 'created_at'],
            },
          },
          required: ['data'],
        },
        example: {
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'New Item',
            status: 'active',
            created_at: '2024-01-15T10:30:00Z',
          },
        },
      },
    },
  },
  SUCCESS_NO_CONTENT: {
    statusCode: MOCK_HTTP_STATUS_CODES.SUCCESS.NO_CONTENT,
    description: 'Operation completed successfully with no content',
  },
  ERROR_BAD_REQUEST: {
    statusCode: MOCK_HTTP_STATUS_CODES.CLIENT_ERROR.BAD_REQUEST,
    description: 'Bad request - validation errors',
    content: {
      [MOCK_MEDIA_TYPES.JSON]: {
        schema: MOCK_SCHEMAS.ERROR_OBJECT,
        example: {
          error: {
            code: 400,
            message: 'Bad Request',
            details: 'Validation failed for required fields',
            timestamp: '2024-01-15T10:30:00Z',
          },
        },
      },
    },
  },
  ERROR_UNAUTHORIZED: {
    statusCode: MOCK_HTTP_STATUS_CODES.CLIENT_ERROR.UNAUTHORIZED,
    description: 'Authentication required',
    content: {
      [MOCK_MEDIA_TYPES.JSON]: {
        schema: MOCK_SCHEMAS.ERROR_OBJECT,
        example: {
          error: {
            code: 401,
            message: 'Unauthorized',
            details: 'Valid authentication credentials required',
            timestamp: '2024-01-15T10:30:00Z',
          },
        },
      },
    },
  },
  ERROR_FORBIDDEN: {
    statusCode: MOCK_HTTP_STATUS_CODES.CLIENT_ERROR.FORBIDDEN,
    description: 'Access forbidden',
    content: {
      [MOCK_MEDIA_TYPES.JSON]: {
        schema: MOCK_SCHEMAS.ERROR_OBJECT,
        example: {
          error: {
            code: 403,
            message: 'Forbidden',
            details: 'Insufficient permissions to access this resource',
            timestamp: '2024-01-15T10:30:00Z',
          },
        },
      },
    },
  },
  ERROR_NOT_FOUND: {
    statusCode: MOCK_HTTP_STATUS_CODES.CLIENT_ERROR.NOT_FOUND,
    description: 'Resource not found',
    content: {
      [MOCK_MEDIA_TYPES.JSON]: {
        schema: MOCK_SCHEMAS.ERROR_OBJECT,
        example: {
          error: {
            code: 404,
            message: 'Not Found',
            details: 'The requested resource does not exist',
            timestamp: '2024-01-15T10:30:00Z',
          },
        },
      },
    },
  },
  ERROR_INTERNAL_SERVER: {
    statusCode: MOCK_HTTP_STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    content: {
      [MOCK_MEDIA_TYPES.JSON]: {
        schema: MOCK_SCHEMAS.ERROR_OBJECT,
        example: {
          error: {
            code: 500,
            message: 'Internal Server Error',
            details: 'An unexpected error occurred while processing the request',
            timestamp: '2024-01-15T10:30:00Z',
          },
        },
      },
    },
  },
} as const;

// Complete mock endpoint configurations for comprehensive testing
export const MOCK_ENDPOINT_CONFIGURATIONS: Record<string, MockEndpointConfiguration> = {
  GET_LIST: {
    id: 'get-list-endpoint',
    name: 'Get Items List',
    description: 'Retrieve a paginated list of items with filtering and sorting',
    method: 'GET',
    path: '/api/v2/items',
    parameters: [
      MOCK_PARAMETERS.LIMIT_QUERY,
      MOCK_PARAMETERS.OFFSET_QUERY,
      MOCK_PARAMETERS.SORT_QUERY,
      MOCK_PARAMETERS.FILTER_QUERY,
      MOCK_PARAMETERS.INCLUDE_QUERY,
      MOCK_PARAMETERS.ACCEPT_HEADER,
    ],
    responses: [
      MOCK_RESPONSES.SUCCESS_LIST,
      MOCK_RESPONSES.ERROR_BAD_REQUEST,
      MOCK_RESPONSES.ERROR_UNAUTHORIZED,
      MOCK_RESPONSES.ERROR_FORBIDDEN,
      MOCK_RESPONSES.ERROR_INTERNAL_SERVER,
    ],
    security: [
      MOCK_SECURITY_CONFIGS.API_KEY_HEADER,
      MOCK_SECURITY_CONFIGS.BEARER_TOKEN,
    ],
    tags: ['Items', 'List Operations'],
    operationId: 'getItemsList',
    summary: 'List all items with pagination',
  },
  GET_ITEM: {
    id: 'get-item-endpoint',
    name: 'Get Single Item',
    description: 'Retrieve a specific item by its identifier',
    method: 'GET',
    path: '/api/v2/items/{id}',
    parameters: [
      MOCK_PARAMETERS.ID_PATH,
      MOCK_PARAMETERS.INCLUDE_QUERY,
      MOCK_PARAMETERS.ACCEPT_HEADER,
    ],
    responses: [
      MOCK_RESPONSES.SUCCESS_ITEM,
      MOCK_RESPONSES.ERROR_BAD_REQUEST,
      MOCK_RESPONSES.ERROR_UNAUTHORIZED,
      MOCK_RESPONSES.ERROR_FORBIDDEN,
      MOCK_RESPONSES.ERROR_NOT_FOUND,
      MOCK_RESPONSES.ERROR_INTERNAL_SERVER,
    ],
    security: [
      MOCK_SECURITY_CONFIGS.API_KEY_HEADER,
      MOCK_SECURITY_CONFIGS.BEARER_TOKEN,
    ],
    tags: ['Items', 'Read Operations'],
    operationId: 'getItemById',
    summary: 'Get item by ID',
  },
  POST_ITEM: {
    id: 'post-item-endpoint',
    name: 'Create New Item',
    description: 'Create a new item with the provided data',
    method: 'POST',
    path: '/api/v2/items',
    parameters: [
      MOCK_PARAMETERS.CONTENT_TYPE_HEADER,
      MOCK_PARAMETERS.ACCEPT_HEADER,
    ],
    requestBody: {
      description: 'Item data for creation',
      required: true,
      content: {
        [MOCK_MEDIA_TYPES.JSON]: {
          schema: {
            type: 'object',
            properties: {
              name: MOCK_SCHEMAS.STRING,
              description: MOCK_SCHEMAS.STRING,
              status: MOCK_SCHEMAS.ENUM_STATUS,
              email: MOCK_SCHEMAS.EMAIL,
              metadata: {
                type: 'object',
                additionalProperties: true,
              },
            },
            required: ['name', 'status'],
          },
          example: {
            name: 'New Item',
            description: 'This is a new item',
            status: 'active',
            email: 'item@example.com',
            metadata: {
              category: 'test',
              priority: 'medium',
            },
          },
        },
      },
    },
    responses: [
      MOCK_RESPONSES.SUCCESS_CREATED,
      MOCK_RESPONSES.ERROR_BAD_REQUEST,
      MOCK_RESPONSES.ERROR_UNAUTHORIZED,
      MOCK_RESPONSES.ERROR_FORBIDDEN,
      MOCK_RESPONSES.ERROR_INTERNAL_SERVER,
    ],
    security: [
      MOCK_SECURITY_CONFIGS.API_KEY_HEADER,
      MOCK_SECURITY_CONFIGS.BEARER_TOKEN,
    ],
    tags: ['Items', 'Create Operations'],
    operationId: 'createItem',
    summary: 'Create a new item',
  },
  PUT_ITEM: {
    id: 'put-item-endpoint',
    name: 'Update Item',
    description: 'Update an existing item with new data',
    method: 'PUT',
    path: '/api/v2/items/{id}',
    parameters: [
      MOCK_PARAMETERS.ID_PATH,
      MOCK_PARAMETERS.CONTENT_TYPE_HEADER,
      MOCK_PARAMETERS.ACCEPT_HEADER,
    ],
    requestBody: {
      description: 'Updated item data',
      required: true,
      content: {
        [MOCK_MEDIA_TYPES.JSON]: {
          schema: {
            type: 'object',
            properties: {
              name: MOCK_SCHEMAS.STRING,
              description: MOCK_SCHEMAS.STRING,
              status: MOCK_SCHEMAS.ENUM_STATUS,
              email: MOCK_SCHEMAS.EMAIL,
              metadata: {
                type: 'object',
                additionalProperties: true,
              },
            },
            required: ['name', 'status'],
          },
          example: {
            name: 'Updated Item',
            description: 'This item has been updated',
            status: 'active',
            email: 'updated@example.com',
            metadata: {
              category: 'updated',
              priority: 'high',
            },
          },
        },
      },
    },
    responses: [
      MOCK_RESPONSES.SUCCESS_ITEM,
      MOCK_RESPONSES.ERROR_BAD_REQUEST,
      MOCK_RESPONSES.ERROR_UNAUTHORIZED,
      MOCK_RESPONSES.ERROR_FORBIDDEN,
      MOCK_RESPONSES.ERROR_NOT_FOUND,
      MOCK_RESPONSES.ERROR_INTERNAL_SERVER,
    ],
    security: [
      MOCK_SECURITY_CONFIGS.API_KEY_HEADER,
      MOCK_SECURITY_CONFIGS.BEARER_TOKEN,
    ],
    tags: ['Items', 'Update Operations'],
    operationId: 'updateItem',
    summary: 'Update an existing item',
  },
  PATCH_ITEM: {
    id: 'patch-item-endpoint',
    name: 'Partial Update Item',
    description: 'Partially update an existing item',
    method: 'PATCH',
    path: '/api/v2/items/{id}',
    parameters: [
      MOCK_PARAMETERS.ID_PATH,
      MOCK_PARAMETERS.CONTENT_TYPE_HEADER,
      MOCK_PARAMETERS.ACCEPT_HEADER,
    ],
    requestBody: {
      description: 'Partial item data for update',
      required: true,
      content: {
        [MOCK_MEDIA_TYPES.JSON]: {
          schema: {
            type: 'object',
            properties: {
              name: MOCK_SCHEMAS.STRING,
              description: MOCK_SCHEMAS.STRING,
              status: MOCK_SCHEMAS.ENUM_STATUS,
              email: MOCK_SCHEMAS.EMAIL,
              metadata: {
                type: 'object',
                additionalProperties: true,
              },
            },
            additionalProperties: false,
          },
          example: {
            status: 'inactive',
            metadata: {
              priority: 'low',
            },
          },
        },
      },
    },
    responses: [
      MOCK_RESPONSES.SUCCESS_ITEM,
      MOCK_RESPONSES.ERROR_BAD_REQUEST,
      MOCK_RESPONSES.ERROR_UNAUTHORIZED,
      MOCK_RESPONSES.ERROR_FORBIDDEN,
      MOCK_RESPONSES.ERROR_NOT_FOUND,
      MOCK_RESPONSES.ERROR_INTERNAL_SERVER,
    ],
    security: [
      MOCK_SECURITY_CONFIGS.API_KEY_HEADER,
      MOCK_SECURITY_CONFIGS.BEARER_TOKEN,
    ],
    tags: ['Items', 'Update Operations'],
    operationId: 'patchItem',
    summary: 'Partially update an item',
  },
  DELETE_ITEM: {
    id: 'delete-item-endpoint',
    name: 'Delete Item',
    description: 'Delete an existing item by its identifier',
    method: 'DELETE',
    path: '/api/v2/items/{id}',
    parameters: [
      MOCK_PARAMETERS.ID_PATH,
    ],
    responses: [
      MOCK_RESPONSES.SUCCESS_NO_CONTENT,
      MOCK_RESPONSES.ERROR_BAD_REQUEST,
      MOCK_RESPONSES.ERROR_UNAUTHORIZED,
      MOCK_RESPONSES.ERROR_FORBIDDEN,
      MOCK_RESPONSES.ERROR_NOT_FOUND,
      MOCK_RESPONSES.ERROR_INTERNAL_SERVER,
    ],
    security: [
      MOCK_SECURITY_CONFIGS.API_KEY_HEADER,
      MOCK_SECURITY_CONFIGS.BEARER_TOKEN,
    ],
    tags: ['Items', 'Delete Operations'],
    operationId: 'deleteItem',
    summary: 'Delete an item',
  },
} as const;

// OpenAPI 3.0+ specification mock for comprehensive testing
export const MOCK_OPENAPI_SPECIFICATION = {
  openapi: '3.0.3',
  info: {
    title: 'DreamFactory Generated API',
    description: 'Automatically generated REST API from database schema',
    version: '1.0.0',
    contact: {
      name: 'API Support',
      email: 'support@dreamfactory.com',
      url: 'https://www.dreamfactory.com/support',
    },
    license: {
      name: 'DreamFactory License',
      url: 'https://www.dreamfactory.com/license',
    },
  },
  servers: [
    {
      url: 'https://api.example.com',
      description: 'Production server',
    },
    {
      url: 'https://staging-api.example.com',
      description: 'Staging server',
    },
    {
      url: 'http://localhost:8080',
      description: 'Development server',
    },
  ],
  paths: Object.fromEntries(
    Object.values(MOCK_ENDPOINT_CONFIGURATIONS).map(endpoint => [
      endpoint.path,
      {
        [endpoint.method.toLowerCase()]: {
          summary: endpoint.summary,
          description: endpoint.description,
          operationId: endpoint.operationId,
          tags: endpoint.tags,
          parameters: endpoint.parameters,
          requestBody: endpoint.requestBody,
          responses: Object.fromEntries(
            endpoint.responses.map(response => [
              response.statusCode,
              {
                description: response.description,
                content: response.content,
                headers: response.headers,
              },
            ])
          ),
          security: endpoint.security.map(sec => ({
            [sec.name]: sec.scopes || [],
          })),
          deprecated: endpoint.deprecated || false,
        },
      },
    ])
  ),
  components: {
    securitySchemes: Object.fromEntries(
      Object.values(MOCK_SECURITY_CONFIGS).map(security => [
        security.name,
        {
          type: security.type,
          name: security.name,
          in: security.in,
          scheme: security.scheme,
          bearerFormat: security.bearerFormat,
          flows: security.flows,
          openIdConnectUrl: security.openIdConnectUrl,
          description: security.description,
        },
      ])
    ),
    schemas: MOCK_SCHEMAS,
    parameters: MOCK_PARAMETERS,
    responses: MOCK_RESPONSES,
  },
  tags: [
    {
      name: 'Items',
      description: 'Operations related to item management',
    },
    {
      name: 'List Operations',
      description: 'Operations for listing resources with pagination',
    },
    {
      name: 'Read Operations',
      description: 'Operations for reading individual resources',
    },
    {
      name: 'Create Operations',
      description: 'Operations for creating new resources',
    },
    {
      name: 'Update Operations',
      description: 'Operations for updating existing resources',
    },
    {
      name: 'Delete Operations',
      description: 'Operations for deleting resources',
    },
  ],
} as const;

// Mock data for React Hook Form testing
export const MOCK_FORM_DATA = {
  VALID_ENDPOINT: {
    name: 'Test Endpoint',
    description: 'This is a test endpoint',
    method: 'GET' as HttpMethod,
    path: '/api/v2/test',
    parameters: [MOCK_PARAMETERS.LIMIT_QUERY],
    security: [MOCK_SECURITY_CONFIGS.API_KEY_HEADER],
    tags: ['Test'],
  },
  INVALID_ENDPOINT: {
    name: '',
    description: 'This is an invalid endpoint with missing required fields',
    method: 'INVALID_METHOD' as any,
    path: 'invalid-path-without-leading-slash',
    parameters: [],
    security: [],
    tags: [],
  },
  PARTIAL_ENDPOINT: {
    name: 'Partial Endpoint',
    method: 'POST' as HttpMethod,
    path: '/api/v2/partial',
  },
} as const;

// MSW-compatible mock handlers data
export const MSW_MOCK_DATA = {
  endpoints: Object.values(MOCK_ENDPOINT_CONFIGURATIONS),
  openApiSpec: MOCK_OPENAPI_SPECIFICATION,
  securityConfigs: Object.values(MOCK_SECURITY_CONFIGS),
  schemas: MOCK_SCHEMAS,
  parameters: Object.values(MOCK_PARAMETERS),
  responses: Object.values(MOCK_RESPONSES),
} as const;

// Utility functions for test data generation
export const createMockEndpoint = (
  overrides: Partial<MockEndpointConfiguration> = {}
): MockEndpointConfiguration => ({
  ...MOCK_ENDPOINT_CONFIGURATIONS.GET_LIST,
  ...overrides,
  id: overrides.id || `mock-endpoint-${Date.now()}`,
});

export const createMockParameter = (
  overrides: Partial<EndpointParameter> = {}
): EndpointParameter => ({
  ...MOCK_PARAMETERS.LIMIT_QUERY,
  ...overrides,
  name: overrides.name || `mock-param-${Date.now()}`,
});

export const createMockSchema = (
  overrides: Partial<SchemaConfiguration> = {}
): SchemaConfiguration => ({
  ...MOCK_SCHEMAS.STRING,
  ...overrides,
});

export const createMockResponse = (
  overrides: Partial<ResponseConfiguration> = {}
): ResponseConfiguration => ({
  ...MOCK_RESPONSES.SUCCESS_ITEM,
  ...overrides,
});

export const createMockSecurity = (
  overrides: Partial<SecurityConfiguration> = {}
): SecurityConfiguration => ({
  ...MOCK_SECURITY_CONFIGS.API_KEY_HEADER,
  ...overrides,
  name: overrides.name || `mock-security-${Date.now()}`,
});

// Export all mock data for comprehensive testing coverage
export default {
  configurations: MOCK_ENDPOINT_CONFIGURATIONS,
  openApiSpec: MOCK_OPENAPI_SPECIFICATION,
  schemas: MOCK_SCHEMAS,
  parameters: MOCK_PARAMETERS,
  responses: MOCK_RESPONSES,
  security: MOCK_SECURITY_CONFIGS,
  statusCodes: MOCK_HTTP_STATUS_CODES,
  mediaTypes: MOCK_MEDIA_TYPES,
  formData: MOCK_FORM_DATA,
  mswData: MSW_MOCK_DATA,
  utilities: {
    createMockEndpoint,
    createMockParameter,
    createMockSchema,
    createMockResponse,
    createMockSecurity,
  },
} as const;