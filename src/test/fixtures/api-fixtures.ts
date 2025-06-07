/**
 * API generation and OpenAPI specification fixture factory functions that generate 
 * realistic API configuration data for testing React components and API generation workflows.
 * 
 * Provides comprehensive factory functions for creating OpenAPI specifications, endpoint 
 * configurations, API documentation data, security configurations, and testing scenarios
 * to support React Hook Form integration, API generation wizard workflows, and Swagger UI components.
 * 
 * Designed for React 19.0.0 + Next.js 15.1+ architecture with TanStack React Query 
 * integration, Mock Service Worker (MSW) compatibility, and Vitest testing automation.
 * 
 * @fileoverview API fixture factory functions for comprehensive testing coverage
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import type {
  HttpMethod,
  HttpStatusCode,
  ApiListResponse,
  ApiResourceResponse,
  ApiRequestOptions,
  KeyValuePair,
} from '../../types/api';

// ============================================================================
// OpenAPI 3.0+ Specification Types
// ============================================================================

/**
 * OpenAPI 3.0+ specification structure for API documentation generation
 * Compatible with @swagger-ui/react and MSW integration
 */
export interface OpenApiSpec {
  openapi: string;
  info: OpenApiInfo;
  servers: OpenApiServer[];
  paths: Record<string, OpenApiPathItem>;
  components?: OpenApiComponents;
  security?: OpenApiSecurityRequirement[];
  tags?: OpenApiTag[];
  externalDocs?: OpenApiExternalDocumentation;
}

export interface OpenApiInfo {
  title: string;
  description?: string;
  version: string;
  termsOfService?: string;
  contact?: OpenApiContact;
  license?: OpenApiLicense;
}

export interface OpenApiContact {
  name?: string;
  url?: string;
  email?: string;
}

export interface OpenApiLicense {
  name: string;
  url?: string;
}

export interface OpenApiServer {
  url: string;
  description?: string;
  variables?: Record<string, OpenApiServerVariable>;
}

export interface OpenApiServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

export interface OpenApiPathItem {
  $ref?: string;
  summary?: string;
  description?: string;
  get?: OpenApiOperation;
  put?: OpenApiOperation;
  post?: OpenApiOperation;
  delete?: OpenApiOperation;
  options?: OpenApiOperation;
  head?: OpenApiOperation;
  patch?: OpenApiOperation;
  trace?: OpenApiOperation;
  servers?: OpenApiServer[];
  parameters?: OpenApiParameter[];
}

export interface OpenApiOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: OpenApiExternalDocumentation;
  operationId?: string;
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses: Record<string, OpenApiResponse>;
  callbacks?: Record<string, any>;
  deprecated?: boolean;
  security?: OpenApiSecurityRequirement[];
  servers?: OpenApiServer[];
}

export interface OpenApiParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: OpenApiSchema;
  example?: any;
  examples?: Record<string, OpenApiExample>;
}

export interface OpenApiRequestBody {
  description?: string;
  content: Record<string, OpenApiMediaType>;
  required?: boolean;
}

export interface OpenApiResponse {
  description: string;
  headers?: Record<string, OpenApiHeader>;
  content?: Record<string, OpenApiMediaType>;
  links?: Record<string, OpenApiLink>;
}

export interface OpenApiHeader {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: OpenApiSchema;
  example?: any;
  examples?: Record<string, OpenApiExample>;
}

export interface OpenApiMediaType {
  schema?: OpenApiSchema;
  example?: any;
  examples?: Record<string, OpenApiExample>;
  encoding?: Record<string, OpenApiEncoding>;
}

export interface OpenApiEncoding {
  contentType?: string;
  headers?: Record<string, OpenApiHeader>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

export interface OpenApiSchema {
  title?: string;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  enum?: any[];
  type?: 'null' | 'boolean' | 'object' | 'array' | 'number' | 'string' | 'integer';
  allOf?: OpenApiSchema[];
  oneOf?: OpenApiSchema[];
  anyOf?: OpenApiSchema[];
  not?: OpenApiSchema;
  items?: OpenApiSchema;
  properties?: Record<string, OpenApiSchema>;
  additionalProperties?: boolean | OpenApiSchema;
  description?: string;
  format?: string;
  default?: any;
  nullable?: boolean;
  discriminator?: OpenApiDiscriminator;
  readOnly?: boolean;
  writeOnly?: boolean;
  xml?: OpenApiXml;
  externalDocs?: OpenApiExternalDocumentation;
  example?: any;
  deprecated?: boolean;
  $ref?: string;
}

export interface OpenApiDiscriminator {
  propertyName: string;
  mapping?: Record<string, string>;
}

export interface OpenApiXml {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
}

export interface OpenApiExample {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}

export interface OpenApiLink {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, any>;
  requestBody?: any;
  description?: string;
  server?: OpenApiServer;
}

export interface OpenApiComponents {
  schemas?: Record<string, OpenApiSchema>;
  responses?: Record<string, OpenApiResponse>;
  parameters?: Record<string, OpenApiParameter>;
  examples?: Record<string, OpenApiExample>;
  requestBodies?: Record<string, OpenApiRequestBody>;
  headers?: Record<string, OpenApiHeader>;
  securitySchemes?: Record<string, OpenApiSecurityScheme>;
  links?: Record<string, OpenApiLink>;
  callbacks?: Record<string, any>;
}

export interface OpenApiSecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: OpenApiOAuthFlows;
  openIdConnectUrl?: string;
}

export interface OpenApiOAuthFlows {
  implicit?: OpenApiOAuthFlow;
  password?: OpenApiOAuthFlow;
  clientCredentials?: OpenApiOAuthFlow;
  authorizationCode?: OpenApiOAuthFlow;
}

export interface OpenApiOAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export interface OpenApiTag {
  name: string;
  description?: string;
  externalDocs?: OpenApiExternalDocumentation;
}

export interface OpenApiExternalDocumentation {
  description?: string;
  url: string;
}

export interface OpenApiSecurityRequirement {
  [name: string]: string[];
}

// ============================================================================
// API Generation Configuration Types
// ============================================================================

/**
 * API endpoint configuration for generating REST endpoints from database tables
 * Used by API generation wizard components and endpoint configuration forms
 */
export interface ApiEndpointConfig {
  /** Unique identifier for the endpoint configuration */
  id: string;
  /** HTTP method for the endpoint */
  method: HttpMethod;
  /** URL path pattern for the endpoint */
  path: string;
  /** Human-readable summary of the endpoint */
  summary: string;
  /** Detailed description of the endpoint functionality */
  description?: string;
  /** Unique operation identifier for OpenAPI specification */
  operationId: string;
  /** Tags for grouping related endpoints */
  tags: string[];
  /** Query parameters configuration */
  parameters: ApiParameterConfig[];
  /** Request body configuration for POST/PUT/PATCH operations */
  requestBody?: ApiRequestBodyConfig;
  /** Response configuration mapping status codes to response definitions */
  responses: Record<string, ApiResponseConfig>;
  /** Security requirements for the endpoint */
  security: ApiSecurityConfig[];
  /** Database service and table information */
  source: ApiSourceConfig;
  /** Rate limiting configuration */
  rateLimit?: ApiRateLimitConfig;
  /** Caching configuration */
  cache?: ApiCacheConfig;
  /** Validation rules */
  validation?: ApiValidationConfig;
  /** Creation timestamp */
  createdAt: string;
  /** Last modification timestamp */
  updatedAt: string;
  /** Whether the endpoint is enabled */
  enabled: boolean;
}

export interface ApiParameterConfig {
  /** Parameter name */
  name: string;
  /** Parameter location (query, header, path) */
  in: 'query' | 'header' | 'path';
  /** Parameter description */
  description?: string;
  /** Whether the parameter is required */
  required: boolean;
  /** Parameter schema definition */
  schema: ApiSchemaConfig;
  /** Example value */
  example?: any;
  /** Default value */
  default?: any;
}

export interface ApiRequestBodyConfig {
  /** Request body description */
  description?: string;
  /** Whether request body is required */
  required: boolean;
  /** Content type configurations */
  content: Record<string, ApiMediaTypeConfig>;
}

export interface ApiResponseConfig {
  /** Response description */
  description: string;
  /** Response headers */
  headers?: Record<string, ApiHeaderConfig>;
  /** Response content configurations */
  content?: Record<string, ApiMediaTypeConfig>;
}

export interface ApiHeaderConfig {
  /** Header description */
  description?: string;
  /** Whether header is required */
  required?: boolean;
  /** Header schema definition */
  schema?: ApiSchemaConfig;
}

export interface ApiMediaTypeConfig {
  /** Schema definition for the media type */
  schema?: ApiSchemaConfig;
  /** Example value */
  example?: any;
  /** Multiple examples */
  examples?: Record<string, any>;
}

export interface ApiSchemaConfig {
  /** Schema type */
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  /** Format specification */
  format?: string;
  /** Schema description */
  description?: string;
  /** Enumeration values */
  enum?: any[];
  /** Minimum value (for numbers) */
  minimum?: number;
  /** Maximum value (for numbers) */
  maximum?: number;
  /** Minimum length (for strings) */
  minLength?: number;
  /** Maximum length (for strings) */
  maxLength?: number;
  /** Pattern validation (for strings) */
  pattern?: string;
  /** Array item schema */
  items?: ApiSchemaConfig;
  /** Object properties */
  properties?: Record<string, ApiSchemaConfig>;
  /** Required properties */
  required?: string[];
  /** Additional properties allowed */
  additionalProperties?: boolean;
  /** Default value */
  default?: any;
  /** Example value */
  example?: any;
}

export interface ApiSecurityConfig {
  /** Security scheme name */
  name: string;
  /** Security type */
  type: 'apiKey' | 'bearer' | 'oauth2' | 'basic';
  /** Required scopes (for OAuth2) */
  scopes?: string[];
}

export interface ApiSourceConfig {
  /** Database service ID */
  serviceId: string;
  /** Database service name */
  serviceName: string;
  /** Database service type */
  serviceType: 'mysql' | 'postgresql' | 'mongodb' | 'oracle' | 'snowflake' | 'mssql';
  /** Target table name */
  tableName?: string;
  /** SQL query (for custom endpoints) */
  query?: string;
}

export interface ApiRateLimitConfig {
  /** Maximum requests per time window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Rate limit scope */
  scope: 'global' | 'user' | 'ip';
}

export interface ApiCacheConfig {
  /** Cache TTL in seconds */
  ttl: number;
  /** Cache key strategy */
  keyStrategy: 'path' | 'query' | 'custom';
  /** Custom cache key template */
  keyTemplate?: string;
  /** Cache conditions */
  conditions?: string[];
}

export interface ApiValidationConfig {
  /** Input validation rules */
  input?: Record<string, any>;
  /** Output validation rules */
  output?: Record<string, any>;
  /** Custom validation functions */
  custom?: string[];
}

// ============================================================================
// API Documentation Configuration Types
// ============================================================================

/**
 * API documentation configuration for Swagger UI integration
 * Used by API documentation components and preview functionality
 */
export interface ApiDocumentationConfig {
  /** Documentation ID */
  id: string;
  /** API title */
  title: string;
  /** API description */
  description: string;
  /** API version */
  version: string;
  /** Contact information */
  contact?: {
    name?: string;
    email?: string;
    url?: string;
  };
  /** License information */
  license?: {
    name: string;
    url?: string;
  };
  /** API servers */
  servers: ApiServerConfig[];
  /** Documentation tags */
  tags: ApiTagConfig[];
  /** External documentation links */
  externalDocs?: {
    description?: string;
    url: string;
  };
  /** Swagger UI configuration */
  swaggerUi: SwaggerUIConfig;
  /** Generated OpenAPI specification */
  openApiSpec?: OpenApiSpec;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

export interface ApiServerConfig {
  /** Server URL */
  url: string;
  /** Server description */
  description?: string;
  /** Server variables */
  variables?: Record<string, {
    default: string;
    description?: string;
    enum?: string[];
  }>;
}

export interface ApiTagConfig {
  /** Tag name */
  name: string;
  /** Tag description */
  description?: string;
  /** External documentation */
  externalDocs?: {
    description?: string;
    url: string;
  };
}

export interface SwaggerUIConfig {
  /** Enable try-it-out functionality */
  tryItOutEnabled: boolean;
  /** Default models expand depth */
  defaultModelsExpandDepth: number;
  /** Default model expand depth */
  defaultModelExpandDepth: number;
  /** Deep linking enabled */
  deepLinking: boolean;
  /** Display operation ID */
  displayOperationId: boolean;
  /** Display request duration */
  displayRequestDuration: boolean;
  /** Show extensions */
  showExtensions: boolean;
  /** Show common extensions */
  showCommonExtensions: boolean;
  /** Custom CSS theme */
  theme?: 'light' | 'dark' | 'auto';
  /** Plugin configurations */
  plugins?: string[];
}

// ============================================================================
// API Testing Scenario Types
// ============================================================================

/**
 * API testing scenario configuration for automated testing and validation
 * Used by testing workflows, MSW integration, and Vitest automation
 */
export interface ApiTestScenario {
  /** Scenario ID */
  id: string;
  /** Scenario name */
  name: string;
  /** Scenario description */
  description: string;
  /** Test suite category */
  category: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Test steps */
  steps: ApiTestStep[];
  /** Setup requirements */
  setup?: ApiTestSetup;
  /** Cleanup requirements */
  cleanup?: ApiTestCleanup;
  /** Expected duration in milliseconds */
  expectedDuration?: number;
  /** Prerequisites */
  prerequisites?: string[];
  /** Tags for categorization */
  tags: string[];
  /** Creation timestamp */
  createdAt: string;
  /** Last execution timestamp */
  lastExecuted?: string;
  /** Execution results */
  results?: ApiTestResult[];
}

export interface ApiTestStep {
  /** Step ID */
  id: string;
  /** Step name */
  name: string;
  /** Step description */
  description?: string;
  /** HTTP request configuration */
  request: ApiTestRequest;
  /** Expected response configuration */
  expectedResponse: ApiTestExpectedResponse;
  /** Validation rules */
  validations: ApiTestValidation[];
  /** Step timeout in milliseconds */
  timeout?: number;
  /** Retry configuration */
  retry?: {
    count: number;
    delay: number;
  };
}

export interface ApiTestRequest {
  /** HTTP method */
  method: HttpMethod;
  /** Request URL */
  url: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: any;
  /** Query parameters */
  params?: Record<string, any>;
  /** Request timeout */
  timeout?: number;
}

export interface ApiTestExpectedResponse {
  /** Expected status code */
  statusCode: HttpStatusCode;
  /** Expected headers */
  headers?: Record<string, string | RegExp>;
  /** Expected body structure */
  body?: any;
  /** Response time threshold in milliseconds */
  maxResponseTime?: number;
}

export interface ApiTestValidation {
  /** Validation type */
  type: 'schema' | 'value' | 'regex' | 'custom';
  /** JSON path or field name */
  path: string;
  /** Expected value or pattern */
  expected: any;
  /** Validation message */
  message?: string;
}

export interface ApiTestSetup {
  /** Database setup scripts */
  database?: string[];
  /** Data fixtures to load */
  fixtures?: string[];
  /** Environment variables */
  environment?: Record<string, string>;
  /** Mock configurations */
  mocks?: ApiMockConfig[];
}

export interface ApiTestCleanup {
  /** Database cleanup scripts */
  database?: string[];
  /** Files to remove */
  files?: string[];
  /** Cache invalidation */
  cache?: string[];
}

export interface ApiTestResult {
  /** Execution timestamp */
  timestamp: string;
  /** Test duration in milliseconds */
  duration: number;
  /** Test status */
  status: 'passed' | 'failed' | 'skipped' | 'timeout';
  /** Error message (if failed) */
  error?: string;
  /** Detailed results by step */
  steps: {
    stepId: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
    response?: {
      statusCode: number;
      headers: Record<string, string>;
      body: any;
      responseTime: number;
    };
  }[];
}

export interface ApiMockConfig {
  /** Mock ID */
  id: string;
  /** URL pattern to mock */
  url: string | RegExp;
  /** HTTP method to mock */
  method: HttpMethod;
  /** Mock response */
  response: {
    status: HttpStatusCode;
    headers?: Record<string, string>;
    body?: any;
    delay?: number;
  };
  /** Mock conditions */
  conditions?: {
    headers?: Record<string, string | RegExp>;
    query?: Record<string, string | RegExp>;
    body?: any;
  };
}

// ============================================================================
// Factory Function Types
// ============================================================================

export type DatabaseType = 'mysql' | 'postgresql' | 'mongodb' | 'oracle' | 'snowflake' | 'mssql';
export type EndpointType = 'list' | 'create' | 'read' | 'update' | 'delete' | 'custom';
export type SecurityLevel = 'public' | 'authenticated' | 'admin' | 'custom';

// ============================================================================
// OpenAPI Specification Factory Functions
// ============================================================================

/**
 * Creates a comprehensive OpenAPI 3.0+ specification with proper schema definitions
 * for database-driven API endpoints. Includes authentication schemes, error responses,
 * and pagination metadata compatible with DreamFactory API patterns.
 * 
 * @param overrides - Partial OpenAPI specification to merge with defaults
 * @returns Complete OpenAPI specification for API documentation
 */
export const createOpenApiSpec = (overrides: Partial<OpenApiSpec> = {}): OpenApiSpec => {
  const baseSpec: OpenApiSpec = {
    openapi: '3.0.3',
    info: {
      title: 'DreamFactory Generated API',
      description: 'Automatically generated REST API from database schema with comprehensive CRUD operations, authentication, and data validation.',
      version: '1.0.0',
      contact: {
        name: 'DreamFactory API Support',
        url: 'https://www.dreamfactory.com/support',
        email: 'support@dreamfactory.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      termsOfService: 'https://www.dreamfactory.com/terms',
    },
    servers: [
      {
        url: 'https://localhost/api/v2',
        description: 'Development server',
        variables: {
          version: {
            default: 'v2',
            enum: ['v1', 'v2'],
            description: 'API version',
          },
        },
      },
      {
        url: 'https://api.dreamfactory.com/{version}',
        description: 'Production server',
        variables: {
          version: {
            default: 'v2',
            enum: ['v1', 'v2'],
            description: 'API version',
          },
        },
      },
    ],
    paths: {},
    components: {
      schemas: {
        User: {
          type: 'object',
          description: 'User account information',
          required: ['id', 'email', 'first_name', 'last_name'],
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
              description: 'Unique user identifier',
              example: 1,
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              maxLength: 255,
              example: 'john.doe@example.com',
            },
            first_name: {
              type: 'string',
              description: 'User first name',
              maxLength: 100,
              example: 'John',
            },
            last_name: {
              type: 'string',
              description: 'User last name',
              maxLength: 100,
              example: 'Doe',
            },
            username: {
              type: 'string',
              description: 'Unique username',
              maxLength: 50,
              example: 'john.doe',
            },
            is_active: {
              type: 'boolean',
              description: 'Whether the user account is active',
              default: true,
              example: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
              example: '2024-01-01T00:00:00.000Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last account update timestamp',
              example: '2024-01-01T12:00:00.000Z',
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          description: 'Pagination metadata for list responses',
          required: ['count', 'limit', 'offset'],
          properties: {
            count: {
              type: 'integer',
              minimum: 0,
              description: 'Total number of records',
              example: 150,
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 1000,
              description: 'Maximum number of records per page',
              example: 25,
            },
            offset: {
              type: 'integer',
              minimum: 0,
              description: 'Number of records to skip',
              example: 0,
            },
            has_next: {
              type: 'boolean',
              description: 'Whether there are more pages available',
              example: true,
            },
            has_previous: {
              type: 'boolean',
              description: 'Whether there are previous pages',
              example: false,
            },
            page_count: {
              type: 'integer',
              minimum: 0,
              description: 'Total number of pages',
              example: 6,
            },
          },
        },
        ListResponse: {
          type: 'object',
          description: 'Standard list response wrapper',
          required: ['resource', 'meta'],
          properties: {
            resource: {
              type: 'array',
              description: 'Array of resources',
              items: {
                oneOf: [
                  { $ref: '#/components/schemas/User' },
                  { type: 'object' },
                ],
              },
            },
            meta: {
              $ref: '#/components/schemas/PaginationMeta',
            },
          },
        },
        ResourceResponse: {
          type: 'object',
          description: 'Standard single resource response wrapper',
          required: ['resource'],
          properties: {
            resource: {
              oneOf: [
                { $ref: '#/components/schemas/User' },
                { type: 'object' },
              ],
              description: 'Single resource data',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          description: 'Standard error response structure',
          required: ['error'],
          properties: {
            error: {
              type: 'object',
              required: ['code', 'message', 'status_code'],
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code for programmatic handling',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  description: 'Human-readable error message',
                  example: 'The email field is required.',
                },
                status_code: {
                  type: 'integer',
                  description: 'HTTP status code',
                  example: 400,
                },
                context: {
                  oneOf: [
                    { type: 'string' },
                    {
                      type: 'object',
                      properties: {
                        errors: {
                          type: 'object',
                          additionalProperties: {
                            type: 'array',
                            items: { type: 'string' },
                          },
                          description: 'Field-specific validation errors',
                        },
                      },
                    },
                  ],
                  description: 'Additional error context',
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp',
              example: '2024-01-01T12:00:00.000Z',
            },
            request_id: {
              type: 'string',
              description: 'Request correlation ID for debugging',
              example: 'req_abc123def456',
            },
          },
        },
      },
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-DreamFactory-API-Key',
          description: 'API key for application authentication',
        },
        SessionAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-DreamFactory-Session-Token',
          description: 'Session token for user authentication',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT bearer token authentication',
        },
        OAuth2: {
          type: 'oauth2',
          description: 'OAuth2 authentication flows',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://auth.dreamfactory.com/oauth2/authorize',
              tokenUrl: 'https://auth.dreamfactory.com/oauth2/token',
              scopes: {
                'read': 'Read access to resources',
                'write': 'Write access to resources',
                'admin': 'Administrative access',
              },
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad Request - Invalid request parameters',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                error: {
                  code: 'BAD_REQUEST',
                  message: 'Invalid request parameters',
                  status_code: 400,
                  context: {
                    errors: {
                      email: ['The email field is required.'],
                      age: ['The age must be a number.'],
                    },
                  },
                },
                timestamp: '2024-01-01T12:00:00.000Z',
                request_id: 'req_abc123def456',
              },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized - Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'Authentication required',
                  status_code: 401,
                },
                timestamp: '2024-01-01T12:00:00.000Z',
                request_id: 'req_abc123def456',
              },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                error: {
                  code: 'FORBIDDEN',
                  message: 'Insufficient permissions to access this resource',
                  status_code: 403,
                },
                timestamp: '2024-01-01T12:00:00.000Z',
                request_id: 'req_abc123def456',
              },
            },
          },
        },
        NotFound: {
          description: 'Not Found - Resource does not exist',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                error: {
                  code: 'NOT_FOUND',
                  message: 'The requested resource was not found',
                  status_code: 404,
                },
                timestamp: '2024-01-01T12:00:00.000Z',
                request_id: 'req_abc123def456',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal Server Error - Server processing error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                error: {
                  code: 'INTERNAL_ERROR',
                  message: 'An internal server error occurred',
                  status_code: 500,
                },
                timestamp: '2024-01-01T12:00:00.000Z',
                request_id: 'req_abc123def456',
              },
            },
          },
        },
      },
      parameters: {
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Maximum number of records to return',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 1000,
            default: 25,
          },
          example: 25,
        },
        OffsetParam: {
          name: 'offset',
          in: 'query',
          description: 'Number of records to skip for pagination',
          required: false,
          schema: {
            type: 'integer',
            minimum: 0,
            default: 0,
          },
          example: 0,
        },
        FilterParam: {
          name: 'filter',
          in: 'query',
          description: 'SQL-like filter conditions for querying records',
          required: false,
          schema: {
            type: 'string',
          },
          example: 'is_active=true AND email LIKE "%@example.com"',
        },
        SortParam: {
          name: 'sort',
          in: 'query',
          description: 'Comma-separated list of fields to sort by',
          required: false,
          schema: {
            type: 'string',
          },
          example: 'created_at DESC, email ASC',
        },
        FieldsParam: {
          name: 'fields',
          in: 'query',
          description: 'Comma-separated list of fields to include in response',
          required: false,
          schema: {
            type: 'string',
          },
          example: 'id,email,first_name,last_name',
        },
        RelatedParam: {
          name: 'related',
          in: 'query',
          description: 'Comma-separated list of related resources to include',
          required: false,
          schema: {
            type: 'string',
          },
          example: 'profile,roles',
        },
      },
    },
    security: [
      { ApiKeyAuth: [] },
      { SessionAuth: [] },
      { BearerAuth: [] },
    ],
    tags: [
      {
        name: 'Users',
        description: 'User account management operations',
        externalDocs: {
          description: 'User management documentation',
          url: 'https://docs.dreamfactory.com/users',
        },
      },
      {
        name: 'Authentication',
        description: 'Authentication and session management',
        externalDocs: {
          description: 'Authentication guide',
          url: 'https://docs.dreamfactory.com/auth',
        },
      },
      {
        name: 'Database',
        description: 'Database table operations',
        externalDocs: {
          description: 'Database API guide',
          url: 'https://docs.dreamfactory.com/database',
        },
      },
    ],
    externalDocs: {
      description: 'Complete DreamFactory API Documentation',
      url: 'https://docs.dreamfactory.com',
    },
  };

  return { ...baseSpec, ...overrides };
};

/**
 * Creates a realistic OpenAPI specification for a specific database service type
 * with table-specific schemas and operations. Includes proper data types,
 * constraints, and relationships based on the database type.
 * 
 * @param databaseType - Type of database (mysql, postgresql, etc.)
 * @param tableName - Name of the target table
 * @param overrides - Additional specification overrides
 * @returns Database-specific OpenAPI specification
 */
export const createDatabaseApiSpec = (
  databaseType: DatabaseType,
  tableName: string = 'users',
  overrides: Partial<OpenApiSpec> = {}
): OpenApiSpec => {
  const baseSpec = createOpenApiSpec();
  
  // Database-specific schema configurations
  const databaseConfigs = {
    mysql: {
      idType: 'integer',
      idFormat: 'int64',
      timestampFormat: 'date-time',
      booleanType: 'boolean',
    },
    postgresql: {
      idType: 'integer',
      idFormat: 'int64',
      timestampFormat: 'date-time',
      booleanType: 'boolean',
    },
    mongodb: {
      idType: 'string',
      idFormat: 'objectid',
      timestampFormat: 'date-time',
      booleanType: 'boolean',
    },
    oracle: {
      idType: 'integer',
      idFormat: 'int64',
      timestampFormat: 'date-time',
      booleanType: 'integer',
    },
    snowflake: {
      idType: 'integer',
      idFormat: 'int64',
      timestampFormat: 'date-time',
      booleanType: 'boolean',
    },
    mssql: {
      idType: 'integer',
      idFormat: 'int64',
      timestampFormat: 'date-time',
      booleanType: 'boolean',
    },
  };

  const config = databaseConfigs[databaseType];
  const capitalizedTable = tableName.charAt(0).toUpperCase() + tableName.slice(1);

  // Create table-specific schema
  const tableSchema: OpenApiSchema = {
    type: 'object',
    description: `${capitalizedTable} record from ${databaseType} database`,
    required: ['id'],
    properties: {
      id: {
        type: config.idType,
        format: config.idFormat,
        description: 'Primary key identifier',
        example: databaseType === 'mongodb' ? '507f1f77bcf86cd799439011' : 1,
      },
      created_at: {
        type: 'string',
        format: config.timestampFormat,
        description: 'Record creation timestamp',
        example: '2024-01-01T00:00:00.000Z',
      },
      updated_at: {
        type: 'string',
        format: config.timestampFormat,
        description: 'Record last update timestamp',
        example: '2024-01-01T12:00:00.000Z',
      },
    },
  };

  // Add database-specific fields
  if (tableName === 'users') {
    tableSchema.required?.push('email', 'first_name', 'last_name');
    tableSchema.properties = {
      ...tableSchema.properties,
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address',
        maxLength: 255,
        example: 'user@example.com',
      },
      first_name: {
        type: 'string',
        description: 'User first name',
        maxLength: 100,
        example: 'John',
      },
      last_name: {
        type: 'string',
        description: 'User last name',
        maxLength: 100,
        example: 'Doe',
      },
      is_active: {
        type: config.booleanType === 'boolean' ? 'boolean' : 'integer',
        description: 'Whether the user is active',
        example: config.booleanType === 'boolean' ? true : 1,
      },
    };
  }

  // Create CRUD paths for the table
  const tablePaths: Record<string, OpenApiPathItem> = {
    [`/${tableName}`]: {
      get: {
        tags: [capitalizedTable],
        summary: `List ${tableName}`,
        description: `Retrieve a paginated list of ${tableName} records with optional filtering and sorting`,
        operationId: `get${capitalizedTable}List`,
        parameters: [
          { $ref: '#/components/parameters/LimitParam' },
          { $ref: '#/components/parameters/OffsetParam' },
          { $ref: '#/components/parameters/FilterParam' },
          { $ref: '#/components/parameters/SortParam' },
          { $ref: '#/components/parameters/FieldsParam' },
          { $ref: '#/components/parameters/RelatedParam' },
        ],
        responses: {
          '200': {
            description: 'Successfully retrieved records',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ListResponse' },
                    {
                      properties: {
                        resource: {
                          type: 'array',
                          items: { $ref: `#/components/schemas/${capitalizedTable}` },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ ApiKeyAuth: [] }, { SessionAuth: [] }],
      },
      post: {
        tags: [capitalizedTable],
        summary: `Create ${tableName}`,
        description: `Create one or more new ${tableName} records`,
        operationId: `create${capitalizedTable}`,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: `#/components/schemas/${capitalizedTable}` },
                  {
                    type: 'object',
                    properties: {
                      resource: {
                        type: 'array',
                        items: { $ref: `#/components/schemas/${capitalizedTable}` },
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
            description: 'Successfully created records',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ResourceResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ ApiKeyAuth: [] }, { SessionAuth: [] }],
      },
    },
    [`/${tableName}/{id}`]: {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: `${capitalizedTable} ID`,
          schema: {
            type: config.idType,
            format: config.idFormat,
          },
          example: databaseType === 'mongodb' ? '507f1f77bcf86cd799439011' : 1,
        },
      ],
      get: {
        tags: [capitalizedTable],
        summary: `Get ${tableName} by ID`,
        description: `Retrieve a specific ${tableName} record by its ID`,
        operationId: `get${capitalizedTable}ById`,
        parameters: [
          { $ref: '#/components/parameters/FieldsParam' },
          { $ref: '#/components/parameters/RelatedParam' },
        ],
        responses: {
          '200': {
            description: 'Successfully retrieved record',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ResourceResponse' },
                    {
                      properties: {
                        resource: { $ref: `#/components/schemas/${capitalizedTable}` },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ ApiKeyAuth: [] }, { SessionAuth: [] }],
      },
      put: {
        tags: [capitalizedTable],
        summary: `Update ${tableName}`,
        description: `Update a specific ${tableName} record by its ID`,
        operationId: `update${capitalizedTable}`,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${capitalizedTable}` },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successfully updated record',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ResourceResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ ApiKeyAuth: [] }, { SessionAuth: [] }],
      },
      patch: {
        tags: [capitalizedTable],
        summary: `Partially update ${tableName}`,
        description: `Partially update a specific ${tableName} record by its ID`,
        operationId: `patch${capitalizedTable}`,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: `Partial ${capitalizedTable} record for updates`,
                additionalProperties: false,
                properties: tableSchema.properties,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successfully updated record',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ResourceResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ ApiKeyAuth: [] }, { SessionAuth: [] }],
      },
      delete: {
        tags: [capitalizedTable],
        summary: `Delete ${tableName}`,
        description: `Delete a specific ${tableName} record by its ID`,
        operationId: `delete${capitalizedTable}`,
        responses: {
          '204': {
            description: 'Successfully deleted record',
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
        security: [{ ApiKeyAuth: [] }, { SessionAuth: [] }],
      },
    },
  };

  const databaseSpec: OpenApiSpec = {
    ...baseSpec,
    info: {
      ...baseSpec.info,
      title: `${capitalizedTable} API (${databaseType.toUpperCase()})`,
      description: `Generated REST API for ${tableName} table in ${databaseType} database with full CRUD operations, pagination, filtering, and authentication.`,
    },
    paths: {
      ...baseSpec.paths,
      ...tablePaths,
    },
    components: {
      ...baseSpec.components,
      schemas: {
        ...baseSpec.components?.schemas,
        [capitalizedTable]: tableSchema,
      },
    },
    tags: [
      ...baseSpec.tags || [],
      {
        name: capitalizedTable,
        description: `${capitalizedTable} table operations`,
        externalDocs: {
          description: `${capitalizedTable} API documentation`,
          url: `https://docs.dreamfactory.com/database/${tableName}`,
        },
      },
    ],
  };

  return { ...databaseSpec, ...overrides };
};

/**
 * Creates a minimal OpenAPI specification for rapid prototyping and basic testing
 * scenarios. Includes essential schemas and operations without complex relationships.
 * 
 * @param title - API title
 * @param version - API version
 * @returns Minimal OpenAPI specification
 */
export const createMinimalApiSpec = (
  title: string = 'Minimal API',
  version: string = '1.0.0'
): OpenApiSpec => {
  return {
    openapi: '3.0.3',
    info: {
      title,
      version,
      description: 'Minimal API specification for testing and prototyping',
    },
    servers: [
      {
        url: 'https://localhost/api/v2',
        description: 'Development server',
      },
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          description: 'Check API health status',
          operationId: 'healthCheck',
          responses: {
            '200': {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Error: {
          type: 'object',
          required: ['code', 'message'],
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  };
};

// ============================================================================
// API Endpoint Configuration Factory Functions
// ============================================================================

/**
 * Creates realistic REST endpoint configurations with parameters and responses
 * for database table operations. Includes comprehensive parameter definitions,
 * response schemas, and security configurations.
 * 
 * @param endpointType - Type of endpoint (list, create, read, update, delete)
 * @param tableName - Database table name
 * @param overrides - Additional configuration overrides
 * @returns Complete API endpoint configuration
 */
export const createApiEndpointConfig = (
  endpointType: EndpointType = 'list',
  tableName: string = 'users',
  overrides: Partial<ApiEndpointConfig> = {}
): ApiEndpointConfig => {
  const timestamp = new Date().toISOString();
  const capitalizedTable = tableName.charAt(0).toUpperCase() + tableName.slice(1);

  const endpointConfigs = {
    list: {
      method: 'GET' as HttpMethod,
      path: `/${tableName}`,
      summary: `List ${tableName}`,
      description: `Retrieve a paginated list of ${tableName} records with optional filtering, sorting, and field selection`,
      operationId: `get${capitalizedTable}List`,
      parameters: [
        {
          name: 'limit',
          in: 'query' as const,
          description: 'Maximum number of records to return',
          required: false,
          schema: {
            type: 'integer' as const,
            minimum: 1,
            maximum: 1000,
            default: 25,
          },
          example: 25,
        },
        {
          name: 'offset',
          in: 'query' as const,
          description: 'Number of records to skip for pagination',
          required: false,
          schema: {
            type: 'integer' as const,
            minimum: 0,
            default: 0,
          },
          example: 0,
        },
        {
          name: 'filter',
          in: 'query' as const,
          description: 'SQL-like filter conditions',
          required: false,
          schema: {
            type: 'string' as const,
          },
          example: 'is_active=true',
        },
        {
          name: 'sort',
          in: 'query' as const,
          description: 'Comma-separated list of fields to sort by',
          required: false,
          schema: {
            type: 'string' as const,
          },
          example: 'created_at DESC',
        },
      ],
      responses: {
        '200': {
          description: 'Successfully retrieved records',
          content: {
            'application/json': {
              schema: {
                type: 'object' as const,
                properties: {
                  resource: {
                    type: 'array' as const,
                    items: {
                      type: 'object' as const,
                    },
                  },
                  meta: {
                    type: 'object' as const,
                    properties: {
                      count: { type: 'integer' as const },
                      limit: { type: 'integer' as const },
                      offset: { type: 'integer' as const },
                    },
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad Request',
        },
        '401': {
          description: 'Unauthorized',
        },
        '500': {
          description: 'Internal Server Error',
        },
      },
    },
    create: {
      method: 'POST' as HttpMethod,
      path: `/${tableName}`,
      summary: `Create ${tableName}`,
      description: `Create one or more new ${tableName} records`,
      operationId: `create${capitalizedTable}`,
      parameters: [],
      requestBody: {
        description: `${capitalizedTable} data to create`,
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object' as const,
              description: `${capitalizedTable} record data`,
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Successfully created records',
          content: {
            'application/json': {
              schema: {
                type: 'object' as const,
                properties: {
                  resource: {
                    type: 'object' as const,
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad Request - Validation failed',
        },
        '401': {
          description: 'Unauthorized',
        },
        '403': {
          description: 'Forbidden',
        },
        '500': {
          description: 'Internal Server Error',
        },
      },
    },
    read: {
      method: 'GET' as HttpMethod,
      path: `/${tableName}/{id}`,
      summary: `Get ${tableName} by ID`,
      description: `Retrieve a specific ${tableName} record by its ID`,
      operationId: `get${capitalizedTable}ById`,
      parameters: [
        {
          name: 'id',
          in: 'path' as const,
          description: `${capitalizedTable} ID`,
          required: true,
          schema: {
            type: 'integer' as const,
            format: 'int64',
          },
          example: 1,
        },
        {
          name: 'fields',
          in: 'query' as const,
          description: 'Comma-separated list of fields to include',
          required: false,
          schema: {
            type: 'string' as const,
          },
          example: 'id,name,email',
        },
      ],
      responses: {
        '200': {
          description: 'Successfully retrieved record',
          content: {
            'application/json': {
              schema: {
                type: 'object' as const,
                properties: {
                  resource: {
                    type: 'object' as const,
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad Request',
        },
        '401': {
          description: 'Unauthorized',
        },
        '404': {
          description: 'Not Found',
        },
        '500': {
          description: 'Internal Server Error',
        },
      },
    },
    update: {
      method: 'PUT' as HttpMethod,
      path: `/${tableName}/{id}`,
      summary: `Update ${tableName}`,
      description: `Update a specific ${tableName} record by its ID`,
      operationId: `update${capitalizedTable}`,
      parameters: [
        {
          name: 'id',
          in: 'path' as const,
          description: `${capitalizedTable} ID`,
          required: true,
          schema: {
            type: 'integer' as const,
            format: 'int64',
          },
          example: 1,
        },
      ],
      requestBody: {
        description: `Updated ${tableName} data`,
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object' as const,
              description: `${capitalizedTable} record data`,
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Successfully updated record',
          content: {
            'application/json': {
              schema: {
                type: 'object' as const,
                properties: {
                  resource: {
                    type: 'object' as const,
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad Request - Validation failed',
        },
        '401': {
          description: 'Unauthorized',
        },
        '403': {
          description: 'Forbidden',
        },
        '404': {
          description: 'Not Found',
        },
        '500': {
          description: 'Internal Server Error',
        },
      },
    },
    delete: {
      method: 'DELETE' as HttpMethod,
      path: `/${tableName}/{id}`,
      summary: `Delete ${tableName}`,
      description: `Delete a specific ${tableName} record by its ID`,
      operationId: `delete${capitalizedTable}`,
      parameters: [
        {
          name: 'id',
          in: 'path' as const,
          description: `${capitalizedTable} ID`,
          required: true,
          schema: {
            type: 'integer' as const,
            format: 'int64',
          },
          example: 1,
        },
      ],
      responses: {
        '204': {
          description: 'Successfully deleted record',
        },
        '400': {
          description: 'Bad Request',
        },
        '401': {
          description: 'Unauthorized',
        },
        '403': {
          description: 'Forbidden',
        },
        '404': {
          description: 'Not Found',
        },
        '500': {
          description: 'Internal Server Error',
        },
      },
    },
    custom: {
      method: 'GET' as HttpMethod,
      path: `/${tableName}/search`,
      summary: `Search ${tableName}`,
      description: `Advanced search functionality for ${tableName} records`,
      operationId: `search${capitalizedTable}`,
      parameters: [
        {
          name: 'q',
          in: 'query' as const,
          description: 'Search query string',
          required: true,
          schema: {
            type: 'string' as const,
            minLength: 1,
          },
          example: 'john doe',
        },
        {
          name: 'fields',
          in: 'query' as const,
          description: 'Fields to search in',
          required: false,
          schema: {
            type: 'string' as const,
          },
          example: 'first_name,last_name,email',
        },
      ],
      responses: {
        '200': {
          description: 'Search results',
          content: {
            'application/json': {
              schema: {
                type: 'object' as const,
                properties: {
                  resource: {
                    type: 'array' as const,
                    items: {
                      type: 'object' as const,
                    },
                  },
                  meta: {
                    type: 'object' as const,
                    properties: {
                      count: { type: 'integer' as const },
                      query: { type: 'string' as const },
                    },
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad Request',
        },
        '401': {
          description: 'Unauthorized',
        },
        '500': {
          description: 'Internal Server Error',
        },
      },
    },
  };

  const baseConfig = endpointConfigs[endpointType];

  const config: ApiEndpointConfig = {
    id: `endpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    method: baseConfig.method,
    path: baseConfig.path,
    summary: baseConfig.summary,
    description: baseConfig.description,
    operationId: baseConfig.operationId,
    tags: [capitalizedTable, 'Database'],
    parameters: baseConfig.parameters,
    requestBody: baseConfig.requestBody,
    responses: baseConfig.responses,
    security: [
      {
        name: 'ApiKeyAuth',
        type: 'apiKey',
        scopes: [],
      },
      {
        name: 'SessionAuth',
        type: 'bearer',
        scopes: [],
      },
    ],
    source: {
      serviceId: 'db_service_1',
      serviceName: 'primary-database',
      serviceType: 'mysql',
      tableName,
    },
    rateLimit: {
      maxRequests: endpointType === 'list' ? 100 : 1000,
      windowSeconds: 3600,
      scope: 'user',
    },
    cache: {
      ttl: endpointType === 'list' ? 300 : 60,
      keyStrategy: 'query',
      conditions: ['GET'],
    },
    validation: {
      input: {},
      output: {},
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    enabled: true,
  };

  return { ...config, ...overrides };
};

/**
 * Creates a complete set of CRUD endpoint configurations for a database table
 * with consistent naming and parameter conventions. Includes all standard
 * operations with proper relationship handling.
 * 
 * @param tableName - Database table name
 * @param databaseType - Database service type
 * @returns Array of endpoint configurations for all CRUD operations
 */
export const createCrudEndpointSet = (
  tableName: string = 'users',
  databaseType: DatabaseType = 'mysql'
): ApiEndpointConfig[] => {
  const endpoints: ApiEndpointConfig[] = [
    createApiEndpointConfig('list', tableName, {
      source: { serviceType: databaseType, serviceName: `${databaseType}-db`, serviceId: 'db_1', tableName },
    }),
    createApiEndpointConfig('create', tableName, {
      source: { serviceType: databaseType, serviceName: `${databaseType}-db`, serviceId: 'db_1', tableName },
    }),
    createApiEndpointConfig('read', tableName, {
      source: { serviceType: databaseType, serviceName: `${databaseType}-db`, serviceId: 'db_1', tableName },
    }),
    createApiEndpointConfig('update', tableName, {
      source: { serviceType: databaseType, serviceName: `${databaseType}-db`, serviceId: 'db_1', tableName },
    }),
    createApiEndpointConfig('delete', tableName, {
      source: { serviceType: databaseType, serviceName: `${databaseType}-db`, serviceId: 'db_1', tableName },
    }),
  ];

  return endpoints;
};

/**
 * Creates endpoint configuration with enhanced security settings including
 * rate limiting, authentication requirements, and access control rules.
 * 
 * @param endpointType - Type of endpoint to secure
 * @param securityLevel - Level of security to apply
 * @param overrides - Additional security configuration overrides
 * @returns Secured endpoint configuration
 */
export const createSecuredEndpointConfig = (
  endpointType: EndpointType = 'list',
  securityLevel: SecurityLevel = 'authenticated',
  overrides: Partial<ApiEndpointConfig> = {}
): ApiEndpointConfig => {
  const baseConfig = createApiEndpointConfig(endpointType);

  const securityConfigs = {
    public: {
      security: [],
      rateLimit: {
        maxRequests: 1000,
        windowSeconds: 3600,
        scope: 'ip' as const,
      },
    },
    authenticated: {
      security: [
        {
          name: 'ApiKeyAuth',
          type: 'apiKey' as const,
          scopes: [],
        },
      ],
      rateLimit: {
        maxRequests: 5000,
        windowSeconds: 3600,
        scope: 'user' as const,
      },
    },
    admin: {
      security: [
        {
          name: 'BearerAuth',
          type: 'bearer' as const,
          scopes: ['admin'],
        },
      ],
      rateLimit: {
        maxRequests: 10000,
        windowSeconds: 3600,
        scope: 'user' as const,
      },
    },
    custom: {
      security: [
        {
          name: 'OAuth2',
          type: 'oauth2' as const,
          scopes: ['read', 'write'],
        },
        {
          name: 'ApiKeyAuth',
          type: 'apiKey' as const,
          scopes: [],
        },
      ],
      rateLimit: {
        maxRequests: 2000,
        windowSeconds: 3600,
        scope: 'user' as const,
      },
    },
  };

  const securityConfig = securityConfigs[securityLevel];

  return {
    ...baseConfig,
    security: securityConfig.security,
    rateLimit: securityConfig.rateLimit,
    ...overrides,
  };
};

// ============================================================================
// API Documentation Factory Functions
// ============================================================================

/**
 * Creates comprehensive API documentation configuration with Swagger UI settings
 * and integration configurations for React components. Includes theme settings,
 * plugin configurations, and interactive features.
 * 
 * @param title - API documentation title
 * @param version - API version
 * @param overrides - Additional documentation configuration
 * @returns Complete API documentation configuration
 */
export const createApiDocumentationConfig = (
  title: string = 'DreamFactory Generated API',
  version: string = '1.0.0',
  overrides: Partial<ApiDocumentationConfig> = {}
): ApiDocumentationConfig => {
  const timestamp = new Date().toISOString();

  const config: ApiDocumentationConfig = {
    id: `docs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    description: 'Comprehensive REST API documentation with interactive testing capabilities, authentication examples, and detailed schema definitions.',
    version,
    contact: {
      name: 'DreamFactory Support',
      email: 'support@dreamfactory.com',
      url: 'https://www.dreamfactory.com/support',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    servers: [
      {
        url: 'https://localhost/api/v2',
        description: 'Development server',
        variables: {
          version: {
            default: 'v2',
            description: 'API version',
            enum: ['v1', 'v2'],
          },
        },
      },
      {
        url: 'https://api.dreamfactory.com/{version}',
        description: 'Production server',
        variables: {
          version: {
            default: 'v2',
            description: 'API version',
            enum: ['v1', 'v2'],
          },
        },
      },
      {
        url: 'https://staging-api.dreamfactory.com/{version}',
        description: 'Staging server',
        variables: {
          version: {
            default: 'v2',
            description: 'API version',
            enum: ['v1', 'v2'],
          },
        },
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management operations',
        externalDocs: {
          description: 'Authentication guide',
          url: 'https://docs.dreamfactory.com/authentication',
        },
      },
      {
        name: 'Users',
        description: 'User account management and profile operations',
        externalDocs: {
          description: 'User management documentation',
          url: 'https://docs.dreamfactory.com/users',
        },
      },
      {
        name: 'Database',
        description: 'Database table operations and schema management',
        externalDocs: {
          description: 'Database API guide',
          url: 'https://docs.dreamfactory.com/database',
        },
      },
      {
        name: 'Files',
        description: 'File storage and management operations',
        externalDocs: {
          description: 'File service documentation',
          url: 'https://docs.dreamfactory.com/files',
        },
      },
      {
        name: 'System',
        description: 'System configuration and administrative operations',
        externalDocs: {
          description: 'System administration guide',
          url: 'https://docs.dreamfactory.com/system',
        },
      },
    ],
    externalDocs: {
      description: 'Complete DreamFactory API Documentation',
      url: 'https://docs.dreamfactory.com',
    },
    swaggerUi: {
      tryItOutEnabled: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      deepLinking: true,
      displayOperationId: true,
      displayRequestDuration: true,
      showExtensions: false,
      showCommonExtensions: false,
      theme: 'auto',
      plugins: [
        'TopbarPlugin',
        'RequestSnippetsPlugin',
      ],
    },
    openApiSpec: createOpenApiSpec(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return { ...config, ...overrides };
};

/**
 * Creates API documentation specifically tailored for database service APIs
 * with table-specific examples, field descriptions, and relationship documentation.
 * 
 * @param databaseType - Type of database service
 * @param tableName - Primary table name for documentation
 * @param overrides - Additional configuration overrides
 * @returns Database-specific API documentation configuration
 */
export const createDatabaseApiDocumentation = (
  databaseType: DatabaseType = 'mysql',
  tableName: string = 'users',
  overrides: Partial<ApiDocumentationConfig> = {}
): ApiDocumentationConfig => {
  const capitalizedTable = tableName.charAt(0).toUpperCase() + tableName.slice(1);
  const databaseTitle = databaseType.toUpperCase();

  const baseConfig = createApiDocumentationConfig(
    `${capitalizedTable} API (${databaseTitle})`,
    '1.0.0',
    {
      description: `REST API for ${tableName} table in ${databaseType} database. Provides comprehensive CRUD operations, advanced querying capabilities, pagination, filtering, and authentication. Generated automatically from database schema with real-time synchronization.`,
      openApiSpec: createDatabaseApiSpec(databaseType, tableName),
    }
  );

  // Add database-specific tags
  const databaseTags = [
    {
      name: capitalizedTable,
      description: `${capitalizedTable} table operations including CRUD, search, and relationship management`,
      externalDocs: {
        description: `${capitalizedTable} API reference`,
        url: `https://docs.dreamfactory.com/database/${tableName}`,
      },
    },
    {
      name: `${databaseTitle} Database`,
      description: `${databaseTitle} database-specific operations and constraints`,
      externalDocs: {
        description: `${databaseTitle} integration guide`,
        url: `https://docs.dreamfactory.com/database/${databaseType}`,
      },
    },
  ];

  return {
    ...baseConfig,
    tags: [...baseConfig.tags, ...databaseTags],
    swaggerUi: {
      ...baseConfig.swaggerUi,
      defaultModelsExpandDepth: 3, // Expand more for database schemas
      defaultModelExpandDepth: 3,
    },
    ...overrides,
  };
};

/**
 * Creates Swagger UI configuration for React component integration with
 * custom theming, plugin management, and interactive features optimized
 * for DreamFactory API documentation.
 * 
 * @param theme - UI theme preference
 * @param interactive - Whether to enable interactive features
 * @param overrides - Additional Swagger UI configuration
 * @returns Swagger UI configuration object
 */
export const createSwaggerUIConfig = (
  theme: 'light' | 'dark' | 'auto' = 'auto',
  interactive: boolean = true,
  overrides: Partial<SwaggerUIConfig> = {}
): SwaggerUIConfig => {
  const config: SwaggerUIConfig = {
    tryItOutEnabled: interactive,
    defaultModelsExpandDepth: interactive ? 2 : 1,
    defaultModelExpandDepth: interactive ? 2 : 1,
    deepLinking: true,
    displayOperationId: true,
    displayRequestDuration: interactive,
    showExtensions: false,
    showCommonExtensions: true,
    theme,
    plugins: interactive 
      ? [
          'TopbarPlugin',
          'RequestSnippetsPlugin',
          'DownloadUrlPlugin',
        ]
      : [
          'TopbarPlugin',
        ],
  };

  return { ...config, ...overrides };
};

// ============================================================================
// API Testing Scenario Factory Functions
// ============================================================================

/**
 * Creates comprehensive API testing scenarios with request/response examples
 * for automated testing workflows. Includes setup/teardown requirements,
 * validation rules, and MSW-compatible mock configurations.
 * 
 * @param scenarioType - Type of testing scenario
 * @param tableName - Target table for database scenarios
 * @param overrides - Additional scenario configuration
 * @returns Complete API testing scenario
 */
export const createApiTestScenario = (
  scenarioType: 'crud' | 'authentication' | 'validation' | 'performance' | 'security' = 'crud',
  tableName: string = 'users',
  overrides: Partial<ApiTestScenario> = {}
): ApiTestScenario => {
  const timestamp = new Date().toISOString();
  const capitalizedTable = tableName.charAt(0).toUpperCase() + tableName.slice(1);

  const scenarioConfigs = {
    crud: {
      name: `${capitalizedTable} CRUD Operations`,
      description: `Complete CRUD operation testing for ${tableName} table including create, read, update, delete, and list operations with proper error handling`,
      category: 'integration' as const,
      priority: 'high' as const,
      steps: [
        {
          id: 'create_record',
          name: `Create ${tableName} record`,
          description: `Create a new ${tableName} record with valid data`,
          request: {
            method: 'POST' as HttpMethod,
            url: `/${tableName}`,
            headers: {
              'Content-Type': 'application/json',
              'X-DreamFactory-API-Key': 'test-api-key',
            },
            body: {
              first_name: 'John',
              last_name: 'Doe',
              email: 'john.doe@example.com',
              is_active: true,
            },
          },
          expectedResponse: {
            statusCode: 201 as HttpStatusCode,
            headers: {
              'Content-Type': 'application/json',
            },
            maxResponseTime: 2000,
          },
          validations: [
            {
              type: 'value',
              path: 'resource.id',
              expected: 'number',
              message: 'Created record should have an ID',
            },
            {
              type: 'value',
              path: 'resource.email',
              expected: 'john.doe@example.com',
              message: 'Email should match input',
            },
          ],
          timeout: 5000,
        },
        {
          id: 'read_record',
          name: `Read ${tableName} record`,
          description: `Retrieve the created ${tableName} record by ID`,
          request: {
            method: 'GET' as HttpMethod,
            url: `/${tableName}/1`,
            headers: {
              'X-DreamFactory-API-Key': 'test-api-key',
            },
          },
          expectedResponse: {
            statusCode: 200 as HttpStatusCode,
            headers: {
              'Content-Type': 'application/json',
            },
            maxResponseTime: 1000,
          },
          validations: [
            {
              type: 'value',
              path: 'resource.id',
              expected: 1,
              message: 'Should retrieve record with ID 1',
            },
            {
              type: 'schema',
              path: 'resource',
              expected: {
                type: 'object',
                required: ['id', 'email', 'first_name', 'last_name'],
              },
              message: 'Record should have required fields',
            },
          ],
          timeout: 3000,
        },
        {
          id: 'update_record',
          name: `Update ${tableName} record`,
          description: `Update the ${tableName} record with new data`,
          request: {
            method: 'PUT' as HttpMethod,
            url: `/${tableName}/1`,
            headers: {
              'Content-Type': 'application/json',
              'X-DreamFactory-API-Key': 'test-api-key',
            },
            body: {
              first_name: 'Jane',
              last_name: 'Smith',
              email: 'jane.smith@example.com',
              is_active: true,
            },
          },
          expectedResponse: {
            statusCode: 200 as HttpStatusCode,
            headers: {
              'Content-Type': 'application/json',
            },
            maxResponseTime: 2000,
          },
          validations: [
            {
              type: 'value',
              path: 'resource.first_name',
              expected: 'Jane',
              message: 'First name should be updated',
            },
            {
              type: 'value',
              path: 'resource.email',
              expected: 'jane.smith@example.com',
              message: 'Email should be updated',
            },
          ],
          timeout: 5000,
        },
        {
          id: 'list_records',
          name: `List ${tableName} records`,
          description: `Retrieve paginated list of ${tableName} records`,
          request: {
            method: 'GET' as HttpMethod,
            url: `/${tableName}?limit=10&offset=0`,
            headers: {
              'X-DreamFactory-API-Key': 'test-api-key',
            },
          },
          expectedResponse: {
            statusCode: 200 as HttpStatusCode,
            headers: {
              'Content-Type': 'application/json',
            },
            maxResponseTime: 1500,
          },
          validations: [
            {
              type: 'value',
              path: 'resource',
              expected: 'array',
              message: 'Should return array of records',
            },
            {
              type: 'value',
              path: 'meta.count',
              expected: 'number',
              message: 'Should include total count',
            },
          ],
          timeout: 3000,
        },
        {
          id: 'delete_record',
          name: `Delete ${tableName} record`,
          description: `Delete the ${tableName} record by ID`,
          request: {
            method: 'DELETE' as HttpMethod,
            url: `/${tableName}/1`,
            headers: {
              'X-DreamFactory-API-Key': 'test-api-key',
            },
          },
          expectedResponse: {
            statusCode: 204 as HttpStatusCode,
            maxResponseTime: 2000,
          },
          validations: [
            {
              type: 'value',
              path: 'response.status',
              expected: 204,
              message: 'Should return 204 No Content',
            },
          ],
          timeout: 5000,
        },
      ],
      expectedDuration: 15000,
      tags: ['crud', 'database', 'integration'],
    },
    authentication: {
      name: 'API Authentication Flow',
      description: 'Test authentication mechanisms including API keys, session tokens, and JWT bearer tokens',
      category: 'security' as const,
      priority: 'critical' as const,
      steps: [
        {
          id: 'login_user',
          name: 'User login',
          description: 'Authenticate user and receive session token',
          request: {
            method: 'POST' as HttpMethod,
            url: '/system/auth/session',
            headers: {
              'Content-Type': 'application/json',
              'X-DreamFactory-API-Key': 'test-api-key',
            },
            body: {
              email: 'admin@example.com',
              password: 'test123',
            },
          },
          expectedResponse: {
            statusCode: 200 as HttpStatusCode,
            headers: {
              'Content-Type': 'application/json',
            },
            maxResponseTime: 3000,
          },
          validations: [
            {
              type: 'value',
              path: 'session_token',
              expected: 'string',
              message: 'Should return session token',
            },
            {
              type: 'value',
              path: 'session_id',
              expected: 'string',
              message: 'Should return session ID',
            },
          ],
          timeout: 5000,
        },
        {
          id: 'authenticated_request',
          name: 'Authenticated API request',
          description: 'Make API request using session token',
          request: {
            method: 'GET' as HttpMethod,
            url: '/system/user/profile',
            headers: {
              'X-DreamFactory-API-Key': 'test-api-key',
              'X-DreamFactory-Session-Token': 'session-token-from-login',
            },
          },
          expectedResponse: {
            statusCode: 200 as HttpStatusCode,
            headers: {
              'Content-Type': 'application/json',
            },
            maxResponseTime: 1000,
          },
          validations: [
            {
              type: 'value',
              path: 'id',
              expected: 'number',
              message: 'Should return user profile with ID',
            },
            {
              type: 'value',
              path: 'email',
              expected: 'admin@example.com',
              message: 'Should return correct user email',
            },
          ],
          timeout: 3000,
        },
        {
          id: 'logout_user',
          name: 'User logout',
          description: 'Logout user and invalidate session token',
          request: {
            method: 'DELETE' as HttpMethod,
            url: '/system/auth/session',
            headers: {
              'X-DreamFactory-API-Key': 'test-api-key',
              'X-DreamFactory-Session-Token': 'session-token-from-login',
            },
          },
          expectedResponse: {
            statusCode: 200 as HttpStatusCode,
            maxResponseTime: 1000,
          },
          validations: [
            {
              type: 'value',
              path: 'success',
              expected: true,
              message: 'Should confirm successful logout',
            },
          ],
          timeout: 3000,
        },
      ],
      expectedDuration: 10000,
      tags: ['authentication', 'security', 'session'],
    },
    validation: {
      name: `${capitalizedTable} Validation Tests`,
      description: 'Test input validation, error handling, and data constraints',
      category: 'unit' as const,
      priority: 'medium' as const,
      steps: [
        {
          id: 'invalid_email',
          name: 'Invalid email validation',
          description: 'Test email format validation',
          request: {
            method: 'POST' as HttpMethod,
            url: `/${tableName}`,
            headers: {
              'Content-Type': 'application/json',
              'X-DreamFactory-API-Key': 'test-api-key',
            },
            body: {
              first_name: 'John',
              last_name: 'Doe',
              email: 'invalid-email',
              is_active: true,
            },
          },
          expectedResponse: {
            statusCode: 400 as HttpStatusCode,
            headers: {
              'Content-Type': 'application/json',
            },
            maxResponseTime: 1000,
          },
          validations: [
            {
              type: 'value',
              path: 'error.code',
              expected: 'VALIDATION_ERROR',
              message: 'Should return validation error',
            },
            {
              type: 'regex',
              path: 'error.message',
              expected: /email/i,
              message: 'Error message should mention email',
            },
          ],
          timeout: 3000,
        },
        {
          id: 'missing_required_field',
          name: 'Missing required field validation',
          description: 'Test required field validation',
          request: {
            method: 'POST' as HttpMethod,
            url: `/${tableName}`,
            headers: {
              'Content-Type': 'application/json',
              'X-DreamFactory-API-Key': 'test-api-key',
            },
            body: {
              first_name: 'John',
              // Missing last_name and email
              is_active: true,
            },
          },
          expectedResponse: {
            statusCode: 400 as HttpStatusCode,
            headers: {
              'Content-Type': 'application/json',
            },
            maxResponseTime: 1000,
          },
          validations: [
            {
              type: 'value',
              path: 'error.code',
              expected: 'VALIDATION_ERROR',
              message: 'Should return validation error',
            },
            {
              type: 'value',
              path: 'error.context.errors',
              expected: 'object',
              message: 'Should include field-specific errors',
            },
          ],
          timeout: 3000,
        },
      ],
      expectedDuration: 5000,
      tags: ['validation', 'error-handling', 'input'],
    },
    performance: {
      name: `${capitalizedTable} Performance Tests`,
      description: 'Test API performance under various load conditions',
      category: 'performance' as const,
      priority: 'medium' as const,
      steps: [
        {
          id: 'large_list_request',
          name: 'Large list request performance',
          description: 'Test performance with large result sets',
          request: {
            method: 'GET' as HttpMethod,
            url: `/${tableName}?limit=1000`,
            headers: {
              'X-DreamFactory-API-Key': 'test-api-key',
            },
          },
          expectedResponse: {
            statusCode: 200 as HttpStatusCode,
            headers: {
              'Content-Type': 'application/json',
            },
            maxResponseTime: 5000,
          },
          validations: [
            {
              type: 'value',
              path: 'resource.length',
              expected: 'number',
              message: 'Should return records array',
            },
            {
              type: 'custom',
              path: 'response.time',
              expected: 'response.time < 5000',
              message: 'Response time should be under 5 seconds',
            },
          ],
          timeout: 10000,
        },
        {
          id: 'concurrent_requests',
          name: 'Concurrent request handling',
          description: 'Test handling of multiple simultaneous requests',
          request: {
            method: 'GET' as HttpMethod,
            url: `/${tableName}?limit=10`,
            headers: {
              'X-DreamFactory-API-Key': 'test-api-key',
            },
          },
          expectedResponse: {
            statusCode: 200 as HttpStatusCode,
            maxResponseTime: 2000,
          },
          validations: [
            {
              type: 'custom',
              path: 'response.time',
              expected: 'response.time < 2000',
              message: 'Response time should remain fast under load',
            },
          ],
          timeout: 5000,
          retry: {
            count: 10,
            delay: 100,
          },
        },
      ],
      expectedDuration: 30000,
      tags: ['performance', 'load-testing', 'scalability'],
    },
    security: {
      name: 'API Security Tests',
      description: 'Test security measures including authorization, input sanitization, and rate limiting',
      category: 'security' as const,
      priority: 'critical' as const,
      steps: [
        {
          id: 'unauthorized_access',
          name: 'Unauthorized access attempt',
          description: 'Test access without authentication',
          request: {
            method: 'GET' as HttpMethod,
            url: `/${tableName}`,
            headers: {},
          },
          expectedResponse: {
            statusCode: 401 as HttpStatusCode,
            headers: {
              'Content-Type': 'application/json',
            },
            maxResponseTime: 1000,
          },
          validations: [
            {
              type: 'value',
              path: 'error.code',
              expected: 'UNAUTHORIZED',
              message: 'Should return unauthorized error',
            },
          ],
          timeout: 3000,
        },
        {
          id: 'sql_injection_attempt',
          name: 'SQL injection prevention',
          description: 'Test SQL injection protection in filters',
          request: {
            method: 'GET' as HttpMethod,
            url: `/${tableName}?filter=id=1; DROP TABLE ${tableName};--`,
            headers: {
              'X-DreamFactory-API-Key': 'test-api-key',
            },
          },
          expectedResponse: {
            statusCode: 400 as HttpStatusCode,
            headers: {
              'Content-Type': 'application/json',
            },
            maxResponseTime: 1000,
          },
          validations: [
            {
              type: 'value',
              path: 'error.code',
              expected: 'BAD_REQUEST',
              message: 'Should reject malicious input',
            },
          ],
          timeout: 3000,
        },
      ],
      expectedDuration: 8000,
      tags: ['security', 'authorization', 'injection'],
    },
  };

  const scenarioConfig = scenarioConfigs[scenarioType];

  const scenario: ApiTestScenario = {
    id: `test_${scenarioType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: scenarioConfig.name,
    description: scenarioConfig.description,
    category: scenarioConfig.category,
    priority: scenarioConfig.priority,
    steps: scenarioConfig.steps,
    setup: {
      database: [`CREATE DATABASE IF NOT EXISTS test_db;`, `USE test_db;`],
      fixtures: [`${tableName}_fixture.json`],
      environment: {
        NODE_ENV: 'test',
        API_URL: 'http://localhost:3000/api/v2',
        API_KEY: 'test-api-key',
      },
      mocks: [
        {
          id: 'auth_success',
          url: /\/system\/auth\/session$/,
          method: 'POST',
          response: {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              session_token: 'mock-session-token-12345',
              session_id: 'mock-session-id-67890',
              user: {
                id: 1,
                email: 'admin@example.com',
                first_name: 'Admin',
                last_name: 'User',
              },
            },
          },
        },
      ],
    },
    cleanup: {
      database: [`DROP TABLE IF EXISTS ${tableName};`],
      cache: ['test_cache_*'],
    },
    expectedDuration: scenarioConfig.expectedDuration,
    prerequisites: [],
    tags: scenarioConfig.tags,
    createdAt: timestamp,
  };

  return { ...scenario, ...overrides };
};

/**
 * Creates API testing scenarios specifically designed for MSW (Mock Service Worker)
 * integration with realistic request/response patterns and proper error simulation.
 * 
 * @param endpointPath - API endpoint path to test
 * @param httpMethod - HTTP method to test
 * @param overrides - Additional scenario configuration
 * @returns MSW-compatible testing scenario
 */
export const createMswTestScenario = (
  endpointPath: string = '/users',
  httpMethod: HttpMethod = 'GET',
  overrides: Partial<ApiTestScenario> = {}
): ApiTestScenario => {
  const timestamp = new Date().toISOString();

  const scenario: ApiTestScenario = {
    id: `msw_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `MSW Test for ${httpMethod} ${endpointPath}`,
    description: `Mock Service Worker integration test for ${httpMethod} ${endpointPath} endpoint with realistic request/response simulation`,
    category: 'integration',
    priority: 'medium',
    steps: [
      {
        id: 'msw_request',
        name: 'MSW mocked request',
        description: `Test ${httpMethod} request to ${endpointPath} with MSW mocking`,
        request: {
          method: httpMethod,
          url: endpointPath,
          headers: {
            'Content-Type': 'application/json',
            'X-DreamFactory-API-Key': 'mock-api-key',
          },
          body: httpMethod === 'POST' || httpMethod === 'PUT' ? {
            name: 'Test User',
            email: 'test@example.com',
          } : undefined,
        },
        expectedResponse: {
          statusCode: httpMethod === 'POST' ? 201 : httpMethod === 'DELETE' ? 204 : 200,
          headers: {
            'Content-Type': 'application/json',
          },
          maxResponseTime: 100,
        },
        validations: [
          {
            type: 'value',
            path: 'response.status',
            expected: httpMethod === 'POST' ? 201 : httpMethod === 'DELETE' ? 204 : 200,
            message: `Should return correct status code for ${httpMethod}`,
          },
        ],
        timeout: 1000,
      },
    ],
    setup: {
      mocks: [
        {
          id: 'main_endpoint_mock',
          url: new RegExp(endpointPath.replace(/\//g, '\\/')),
          method: httpMethod,
          response: {
            status: httpMethod === 'POST' ? 201 : httpMethod === 'DELETE' ? 204 : 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: httpMethod === 'DELETE' ? undefined : httpMethod === 'GET' && endpointPath.includes('{id}') ? {
              resource: {
                id: 1,
                name: 'Test User',
                email: 'test@example.com',
                created_at: timestamp,
              },
            } : {
              resource: [
                {
                  id: 1,
                  name: 'Test User 1',
                  email: 'test1@example.com',
                  created_at: timestamp,
                },
                {
                  id: 2,
                  name: 'Test User 2',
                  email: 'test2@example.com',
                  created_at: timestamp,
                },
              ],
              meta: {
                count: 2,
                limit: 25,
                offset: 0,
              },
            },
            delay: 50,
          },
        },
      ],
    },
    expectedDuration: 2000,
    tags: ['msw', 'mocking', 'integration'],
    createdAt: timestamp,
  };

  return { ...scenario, ...overrides };
};

/**
 * Creates performance testing scenarios with load testing parameters,
 * response time thresholds, and scalability validation rules.
 * 
 * @param endpointPath - API endpoint to performance test
 * @param loadLevel - Performance load level (light, medium, heavy)
 * @param overrides - Additional scenario configuration
 * @returns Performance testing scenario
 */
export const createPerformanceTestScenario = (
  endpointPath: string = '/users',
  loadLevel: 'light' | 'medium' | 'heavy' = 'medium',
  overrides: Partial<ApiTestScenario> = {}
): ApiTestScenario => {
  const timestamp = new Date().toISOString();

  const loadConfigs = {
    light: {
      concurrency: 10,
      duration: 30000,
      maxResponseTime: 1000,
      targetRps: 10,
    },
    medium: {
      concurrency: 50,
      duration: 60000,
      maxResponseTime: 2000,
      targetRps: 50,
    },
    heavy: {
      concurrency: 100,
      duration: 120000,
      maxResponseTime: 5000,
      targetRps: 100,
    },
  };

  const config = loadConfigs[loadLevel];

  const scenario: ApiTestScenario = {
    id: `perf_test_${loadLevel}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `Performance Test - ${loadLevel.toUpperCase()} load on ${endpointPath}`,
    description: `Performance testing scenario with ${loadLevel} load: ${config.concurrency} concurrent users, ${config.targetRps} RPS target, ${config.duration/1000}s duration`,
    category: 'performance',
    priority: 'medium',
    steps: [
      {
        id: 'performance_test',
        name: `${loadLevel} load test`,
        description: `Execute ${loadLevel} load test on ${endpointPath}`,
        request: {
          method: 'GET',
          url: endpointPath,
          headers: {
            'X-DreamFactory-API-Key': 'test-api-key',
          },
        },
        expectedResponse: {
          statusCode: 200,
          maxResponseTime: config.maxResponseTime,
        },
        validations: [
          {
            type: 'custom',
            path: 'response.time',
            expected: `response.time < ${config.maxResponseTime}`,
            message: `Response time should be under ${config.maxResponseTime}ms`,
          },
          {
            type: 'custom',
            path: 'response.status',
            expected: 'response.status === 200',
            message: 'Should maintain successful responses under load',
          },
        ],
        timeout: config.maxResponseTime * 2,
        retry: {
          count: config.concurrency,
          delay: 1000 / config.targetRps,
        },
      },
    ],
    setup: {
      environment: {
        PERFORMANCE_TEST: 'true',
        LOAD_LEVEL: loadLevel,
        CONCURRENCY: config.concurrency.toString(),
        TARGET_RPS: config.targetRps.toString(),
      },
    },
    expectedDuration: config.duration,
    tags: ['performance', 'load-testing', loadLevel, 'scalability'],
    createdAt: timestamp,
  };

  return { ...scenario, ...overrides };
};

// ============================================================================
// Complete API Generation Test Suite Factory
// ============================================================================

/**
 * Creates a comprehensive test suite covering all aspects of API generation
 * including CRUD operations, authentication, validation, performance, and security.
 * Provides complete testing coverage for database-driven API endpoints.
 * 
 * @param tableName - Database table name
 * @param databaseType - Database service type
 * @returns Complete API testing suite with all scenario types
 */
export const createCompleteApiTestSuite = (
  tableName: string = 'users',
  databaseType: DatabaseType = 'mysql'
) => {
  return {
    // API specifications and documentation
    openApiSpec: createDatabaseApiSpec(databaseType, tableName),
    documentation: createDatabaseApiDocumentation(databaseType, tableName),
    
    // Endpoint configurations
    endpoints: createCrudEndpointSet(tableName, databaseType),
    securedEndpoints: [
      createSecuredEndpointConfig('list', 'public'),
      createSecuredEndpointConfig('create', 'authenticated'),
      createSecuredEndpointConfig('update', 'authenticated'),
      createSecuredEndpointConfig('delete', 'admin'),
    ],
    
    // Testing scenarios
    testScenarios: {
      crud: createApiTestScenario('crud', tableName),
      authentication: createApiTestScenario('authentication', tableName),
      validation: createApiTestScenario('validation', tableName),
      performance: createApiTestScenario('performance', tableName),
      security: createApiTestScenario('security', tableName),
    },
    
    // MSW mocking scenarios
    mswScenarios: [
      createMswTestScenario(`/${tableName}`, 'GET'),
      createMswTestScenario(`/${tableName}`, 'POST'),
      createMswTestScenario(`/${tableName}/{id}`, 'GET'),
      createMswTestScenario(`/${tableName}/{id}`, 'PUT'),
      createMswTestScenario(`/${tableName}/{id}`, 'DELETE'),
    ],
    
    // Performance testing scenarios
    performanceScenarios: {
      light: createPerformanceTestScenario(`/${tableName}`, 'light'),
      medium: createPerformanceTestScenario(`/${tableName}`, 'medium'),
      heavy: createPerformanceTestScenario(`/${tableName}`, 'heavy'),
    },
    
    // Swagger UI configuration
    swaggerUI: createSwaggerUIConfig('auto', true),
    
    // Database-specific metadata
    metadata: {
      databaseType,
      tableName,
      generatedAt: new Date().toISOString(),
      testSuiteVersion: '1.0.0',
    },
  };
};

/**
 * Creates API versioning test scenarios for backward compatibility testing
 * with multiple API versions and migration validation.
 * 
 * @param versions - Array of API versions to test
 * @param tableName - Database table name
 * @returns Versioning test scenarios for compatibility validation
 */
export const createApiVersioningScenarios = (
  versions: string[] = ['v1', 'v2'],
  tableName: string = 'users'
) => {
  return versions.map(version => ({
    version,
    spec: createOpenApiSpec({
      info: {
        title: `${tableName.charAt(0).toUpperCase() + tableName.slice(1)} API ${version.toUpperCase()}`,
        version: version === 'v1' ? '1.0.0' : '2.0.0',
        description: `API version ${version} for ${tableName} operations`,
      },
      servers: [
        {
          url: `https://api.dreamfactory.com/${version}`,
          description: `${version.toUpperCase()} API server`,
        },
      ],
    }),
    testScenarios: [
      createApiTestScenario('crud', tableName, {
        name: `${tableName.charAt(0).toUpperCase() + tableName.slice(1)} CRUD Operations (${version.toUpperCase()})`,
        steps: [
          {
            id: `${version}_compatibility_test`,
            name: `${version.toUpperCase()} compatibility test`,
            description: `Test backward compatibility for ${version} API`,
            request: {
              method: 'GET',
              url: `/${version}/${tableName}`,
              headers: {
                'X-DreamFactory-API-Key': 'test-api-key',
              },
            },
            expectedResponse: {
              statusCode: 200,
              maxResponseTime: 2000,
            },
            validations: [
              {
                type: 'value',
                path: 'resource',
                expected: 'array',
                message: `${version.toUpperCase()} should return array of records`,
              },
            ],
            timeout: 5000,
          },
        ],
        tags: ['versioning', 'compatibility', version],
      }),
    ],
    endpoints: createCrudEndpointSet(tableName).map(endpoint => ({
      ...endpoint,
      path: `/${version}${endpoint.path}`,
      operationId: `${version}_${endpoint.operationId}`,
    })),
  }));
};

// Export all types and factory functions for comprehensive API testing coverage
export default {
  // Factory functions
  createOpenApiSpec,
  createDatabaseApiSpec,
  createMinimalApiSpec,
  createApiEndpointConfig,
  createCrudEndpointSet,
  createSecuredEndpointConfig,
  createApiDocumentationConfig,
  createDatabaseApiDocumentation,
  createSwaggerUIConfig,
  createApiTestScenario,
  createMswTestScenario,
  createPerformanceTestScenario,
  createCompleteApiTestSuite,
  createApiVersioningScenarios,
  
  // Utility functions for test scenarios
  scenarios: {
    crud: (tableName: string) => createApiTestScenario('crud', tableName),
    auth: (tableName: string) => createApiTestScenario('authentication', tableName),
    validation: (tableName: string) => createApiTestScenario('validation', tableName),
    performance: (tableName: string) => createApiTestScenario('performance', tableName),
    security: (tableName: string) => createApiTestScenario('security', tableName),
  },
};