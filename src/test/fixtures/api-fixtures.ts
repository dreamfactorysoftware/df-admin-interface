/**
 * API generation and OpenAPI specification fixture factory functions
 * 
 * Provides comprehensive factory functions for creating realistic API configuration data
 * for testing React components and API generation workflows. Supports OpenAPI 3.0+
 * specifications, endpoint configurations, and API documentation data.
 * 
 * @fileoverview API fixtures for testing API generation, OpenAPI specs, and documentation
 */

import { faker } from '@faker-js/faker';

// ============================================================================
// Core API Types (matching expected structure from technical specification)
// ============================================================================

export interface ApiEndpointConfig {
  id: string;
  serviceName: string;
  tableName: string;
  resource: string;
  methods: HttpMethod[];
  security?: EndpointSecurity;
  parameters?: EndpointParameter[];
  responses?: ApiResponse[];
  rateLimit?: RateLimitConfig;
  caching?: CachingConfig;
  validation?: ValidationConfig;
  metadata?: EndpointMetadata;
}

export interface OpenApiSpecification {
  openapi: string;
  info: OpenApiInfo;
  servers?: OpenApiServer[];
  paths: Record<string, PathItem>;
  components?: Components;
  security?: SecurityRequirement[];
  tags?: Tag[];
  externalDocs?: ExternalDocumentation;
}

export interface OpenApiInfo {
  title: string;
  description?: string;
  version: string;
  termsOfService?: string;
  contact?: Contact;
  license?: License;
}

export interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  patch?: Operation;
  delete?: Operation;
  options?: Operation;
  head?: Operation;
  parameters?: Parameter[];
  summary?: string;
  description?: string;
}

export interface Operation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
  security?: SecurityRequirement[];
  deprecated?: boolean;
}

export interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  schema?: Schema;
  example?: any;
  examples?: Record<string, Example>;
}

export interface RequestBody {
  description?: string;
  content: Record<string, MediaType>;
  required?: boolean;
}

export interface Response {
  description: string;
  headers?: Record<string, Header>;
  content?: Record<string, MediaType>;
  links?: Record<string, Link>;
}

export interface MediaType {
  schema?: Schema;
  example?: any;
  examples?: Record<string, Example>;
  encoding?: Record<string, Encoding>;
}

export interface Schema {
  type?: string;
  format?: string;
  properties?: Record<string, Schema>;
  items?: Schema;
  required?: string[];
  enum?: any[];
  example?: any;
  description?: string;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  $ref?: string;
}

export interface Components {
  schemas?: Record<string, Schema>;
  responses?: Record<string, Response>;
  parameters?: Record<string, Parameter>;
  examples?: Record<string, Example>;
  requestBodies?: Record<string, RequestBody>;
  headers?: Record<string, Header>;
  securitySchemes?: Record<string, SecurityScheme>;
  links?: Record<string, Link>;
  callbacks?: Record<string, Callback>;
}

export interface SecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlows;
  openIdConnectUrl?: string;
}

export interface OAuthFlows {
  implicit?: OAuthFlow;
  password?: OAuthFlow;
  clientCredentials?: OAuthFlow;
  authorizationCode?: OAuthFlow;
}

export interface OAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export interface EndpointSecurity {
  authentication: AuthenticationType[];
  roles?: string[];
  permissions?: string[];
  apiKeyRequired?: boolean;
  rateLimiting?: boolean;
  ipWhitelist?: string[];
}

export type AuthenticationType = 'api_key' | 'session' | 'oauth2' | 'basic_auth' | 'bearer_token';

export interface EndpointParameter {
  name: string;
  type: ParameterType;
  location: ParameterLocation;
  required: boolean;
  description?: string;
  defaultValue?: any;
  validation?: ParameterValidation;
}

export type ParameterType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
export type ParameterLocation = 'query' | 'path' | 'header' | 'body';

export interface ParameterValidation {
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  enum?: any[];
}

export interface ApiResponse {
  statusCode: number;
  description: string;
  schema?: Schema;
  examples?: Record<string, any>;
  headers?: Record<string, Header>;
}

export interface RateLimitConfig {
  enabled: boolean;
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  burstLimit?: number;
  keyBy?: 'ip' | 'user' | 'api_key';
}

export interface CachingConfig {
  enabled: boolean;
  ttl?: number;
  strategy?: 'memory' | 'redis' | 'database';
  varyBy?: string[];
}

export interface ValidationConfig {
  enabled: boolean;
  strictMode?: boolean;
  validateResponse?: boolean;
  customValidators?: string[];
}

export interface EndpointMetadata {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: string;
  tags: string[];
  deprecated?: boolean;
}

export interface ApiDocumentation {
  id: string;
  title: string;
  description: string;
  version: string;
  baseUrl: string;
  endpoints: ApiEndpointConfig[];
  specification: OpenApiSpecification;
  swaggerConfig: SwaggerConfig;
  testScenarios: ApiTestScenario[];
}

export interface SwaggerConfig {
  url: string;
  layout: 'BaseLayout' | 'StandaloneLayout';
  deepLinking: boolean;
  displayOperationId: boolean;
  defaultModelsExpandDepth: number;
  defaultModelExpandDepth: number;
  defaultModelRendering: 'example' | 'model';
  displayRequestDuration: boolean;
  docExpansion: 'list' | 'full' | 'none';
  filter: boolean | string;
  maxDisplayedTags: number;
  showExtensions: boolean;
  showCommonExtensions: boolean;
  tryItOutEnabled: boolean;
}

export interface ApiTestScenario {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  queryParams?: Record<string, any>;
  body?: any;
  expectedStatus: number;
  expectedResponse?: any;
  authentication?: TestAuthentication;
  tags: string[];
}

export interface TestAuthentication {
  type: AuthenticationType;
  credentials: Record<string, string>;
}

export interface ApiGenerationWizardStep {
  id: string;
  title: string;
  description: string;
  component: string;
  data: any;
  validation: any;
  completed: boolean;
  optional: boolean;
}

export interface ApiGenerationWizardState {
  currentStep: number;
  steps: ApiGenerationWizardStep[];
  configuration: Partial<ApiEndpointConfig>;
  preview?: OpenApiSpecification;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a realistic OpenAPI 3.0+ specification with proper schema definitions
 */
export function openApiSpecFactory(overrides: Partial<OpenApiSpecification> = {}): OpenApiSpecification {
  const serviceName = faker.company.buzzNoun();
  const version = faker.system.semver();
  
  return {
    openapi: '3.0.3',
    info: {
      title: `${serviceName} API`,
      description: `RESTful API for ${serviceName} database operations generated by DreamFactory`,
      version,
      contact: {
        name: 'API Support',
        url: 'https://www.dreamfactory.com/support',
        email: 'support@dreamfactory.com'
      },
      license: {
        name: 'Apache 2.0',
        url: 'https://www.apache.org/licenses/LICENSE-2.0.html'
      }
    },
    servers: [
      {
        url: 'https://api.example.com/api/v2',
        description: 'Production server'
      },
      {
        url: 'https://staging.api.example.com/api/v2',
        description: 'Staging server'
      }
    ],
    paths: generateApiPaths(),
    components: generateComponents(),
    security: [
      { ApiKeyAuth: [] },
      { BearerAuth: [] }
    ],
    tags: generateTags(),
    ...overrides
  };
}

/**
 * Generates REST endpoint configurations with parameters and responses
 */
export function apiEndpointFactory(overrides: Partial<ApiEndpointConfig> = {}): ApiEndpointConfig {
  const tableName = faker.database.collation().toLowerCase();
  const serviceName = faker.company.buzzNoun().toLowerCase();
  
  return {
    id: faker.string.uuid(),
    serviceName,
    tableName,
    resource: `/${serviceName}/_table/${tableName}`,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    security: endpointSecurityFactory(),
    parameters: generateEndpointParameters(),
    responses: generateApiResponses(),
    rateLimit: rateLimitConfigFactory(),
    caching: cachingConfigFactory(),
    validation: validationConfigFactory(),
    metadata: {
      createdAt: faker.date.recent().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      createdBy: faker.person.fullName(),
      version: '1.0.0',
      tags: [serviceName, tableName, 'database', 'crud'],
      deprecated: faker.datatype.boolean(0.1) // 10% chance of being deprecated
    },
    ...overrides
  };
}

/**
 * Generates API documentation data and Swagger UI configurations
 */
export function apiDocumentationFactory(overrides: Partial<ApiDocumentation> = {}): ApiDocumentation {
  const serviceName = faker.company.buzzNoun();
  const endpoints = Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => apiEndpointFactory());
  
  return {
    id: faker.string.uuid(),
    title: `${serviceName} API Documentation`,
    description: `Complete API documentation for ${serviceName} service endpoints`,
    version: faker.system.semver(),
    baseUrl: `https://api.example.com/api/v2/${serviceName.toLowerCase()}`,
    endpoints,
    specification: openApiSpecFactory(),
    swaggerConfig: swaggerConfigFactory(),
    testScenarios: endpoints.flatMap(endpoint => 
      generateTestScenariosForEndpoint(endpoint)
    ),
    ...overrides
  };
}

/**
 * Generates endpoint security and rate limiting configurations
 */
export function endpointConfigurationFactory(overrides: Partial<ApiEndpointConfig> = {}): ApiEndpointConfig {
  return {
    ...apiEndpointFactory(),
    security: {
      authentication: ['api_key', 'session'],
      roles: ['admin', 'user', 'viewer'],
      permissions: ['read', 'write', 'delete'],
      apiKeyRequired: true,
      rateLimiting: true,
      ipWhitelist: [
        '192.168.1.0/24',
        '10.0.0.0/8'
      ]
    },
    rateLimit: {
      enabled: true,
      requestsPerMinute: 100,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      burstLimit: 50,
      keyBy: 'api_key'
    },
    ...overrides
  };
}

/**
 * Generates API testing scenarios with request/response examples
 */
export function apiTestScenarioFactory(overrides: Partial<ApiTestScenario> = {}): ApiTestScenario {
  const method = faker.helpers.arrayElement(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
  const endpoint = `/api/v2/${faker.company.buzzNoun().toLowerCase()}/_table/${faker.database.collation().toLowerCase()}`;
  
  return {
    id: faker.string.uuid(),
    name: `${method} ${endpoint}`,
    description: `Test scenario for ${method} operation on ${endpoint}`,
    endpoint,
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-DreamFactory-API-Key': faker.string.alphanumeric(32),
      'Accept': 'application/json'
    },
    queryParams: method === 'GET' ? {
      limit: faker.number.int({ min: 10, max: 100 }),
      offset: faker.number.int({ min: 0, max: 1000 }),
      filter: `name='${faker.person.firstName()}'`,
      order: 'created_date DESC'
    } : undefined,
    body: ['POST', 'PUT', 'PATCH'].includes(method) ? generateRequestBody() : undefined,
    expectedStatus: getExpectedStatusForMethod(method),
    expectedResponse: generateResponseBody(method),
    authentication: {
      type: 'api_key',
      credentials: {
        'X-DreamFactory-API-Key': faker.string.alphanumeric(32)
      }
    },
    tags: ['integration', 'api', 'crud'],
    ...overrides
  };
}

/**
 * Generates API versioning scenarios and backward compatibility testing data
 */
export function apiVersioningScenarioFactory(): {
  currentVersion: string;
  previousVersions: string[];
  compatibilityMatrix: Record<string, boolean>;
  migrationPaths: Array<{ from: string; to: string; breaking: boolean }>;
  deprecatedEndpoints: Array<{ endpoint: string; deprecatedIn: string; removedIn: string }>;
} {
  const currentVersion = faker.system.semver();
  const previousVersions = Array.from({ length: 3 }, () => faker.system.semver()).sort().reverse();
  
  return {
    currentVersion,
    previousVersions,
    compatibilityMatrix: Object.fromEntries(
      previousVersions.map(version => [version, faker.datatype.boolean(0.8)])
    ),
    migrationPaths: previousVersions.map(version => ({
      from: version,
      to: currentVersion,
      breaking: faker.datatype.boolean(0.3)
    })),
    deprecatedEndpoints: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
      endpoint: `/api/v1/${faker.company.buzzNoun().toLowerCase()}`,
      deprecatedIn: faker.helpers.arrayElement(previousVersions),
      removedIn: currentVersion
    }))
  };
}

/**
 * Generates factory functions for testing API generation wizard workflows
 */
export function apiGenerationWizardFactory(overrides: Partial<ApiGenerationWizardState> = {}): ApiGenerationWizardState {
  const steps: ApiGenerationWizardStep[] = [
    {
      id: 'service-selection',
      title: 'Select Database Service',
      description: 'Choose the database service to generate APIs for',
      component: 'ServiceSelectionStep',
      data: {
        availableServices: Array.from({ length: 5 }, () => ({
          id: faker.string.uuid(),
          name: faker.company.buzzNoun(),
          type: faker.helpers.arrayElement(['mysql', 'postgresql', 'mongodb', 'sqlserver'])
        }))
      },
      validation: { required: ['selectedService'] },
      completed: false,
      optional: false
    },
    {
      id: 'schema-discovery',
      title: 'Discover Schema',
      description: 'Explore database schema and select tables',
      component: 'SchemaDiscoveryStep',
      data: {
        tables: Array.from({ length: 10 }, () => ({
          name: faker.database.collation(),
          selected: faker.datatype.boolean(0.6),
          fieldCount: faker.number.int({ min: 3, max: 20 })
        }))
      },
      validation: { required: ['selectedTables'] },
      completed: false,
      optional: false
    },
    {
      id: 'endpoint-configuration',
      title: 'Configure Endpoints',
      description: 'Set up HTTP methods and parameters',
      component: 'EndpointConfigurationStep',
      data: {
        httpMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        pagination: true,
        filtering: true,
        sorting: true
      },
      validation: { required: ['httpMethods'] },
      completed: false,
      optional: false
    },
    {
      id: 'security-configuration',
      title: 'Configure Security',
      description: 'Set up authentication and access controls',
      component: 'SecurityConfigurationStep',
      data: {
        authenticationTypes: ['api_key', 'session', 'oauth2'],
        roles: ['admin', 'user', 'viewer'],
        rateLimiting: true
      },
      validation: { required: ['authenticationTypes'] },
      completed: false,
      optional: true
    },
    {
      id: 'preview-generation',
      title: 'Preview & Generate',
      description: 'Review configuration and generate APIs',
      component: 'PreviewGenerationStep',
      data: {
        previewEnabled: true,
        generateDocumentation: true,
        includeExamples: true
      },
      validation: {},
      completed: false,
      optional: false
    }
  ];

  return {
    currentStep: 0,
    steps,
    configuration: {
      serviceName: faker.company.buzzNoun(),
      methods: ['GET', 'POST'],
      security: endpointSecurityFactory()
    },
    preview: openApiSpecFactory(),
    errors: {},
    warnings: {
      'security-configuration': ['Consider enabling rate limiting for production use']
    },
    ...overrides
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateApiPaths(): Record<string, PathItem> {
  const paths: Record<string, PathItem> = {};
  const tableName = faker.database.collation().toLowerCase();
  const basePath = `/_table/${tableName}`;
  
  // Collection endpoints
  paths[basePath] = {
    get: {
      tags: [tableName],
      summary: `Get ${tableName} records`,
      description: `Retrieve multiple records from ${tableName} table`,
      operationId: `get${tableName}Records`,
      parameters: [
        {
          name: 'limit',
          in: 'query',
          description: 'Maximum number of records to return',
          schema: { type: 'integer', minimum: 1, maximum: 1000, default: 25 }
        },
        {
          name: 'offset',
          in: 'query',
          description: 'Number of records to skip',
          schema: { type: 'integer', minimum: 0, default: 0 }
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
                  resource: { type: 'array', items: { $ref: `#/components/schemas/${tableName}` } }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: [tableName],
      summary: `Create ${tableName} record`,
      description: `Create a new record in ${tableName} table`,
      operationId: `create${tableName}Record`,
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

  // Individual record endpoints
  paths[`${basePath}/{id}`] = {
    get: {
      tags: [tableName],
      summary: `Get ${tableName} record by ID`,
      operationId: `get${tableName}Record`,
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
      tags: [tableName],
      summary: `Update ${tableName} record`,
      operationId: `update${tableName}Record`,
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
      tags: [tableName],
      summary: `Delete ${tableName} record`,
      operationId: `delete${tableName}Record`,
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

  return paths;
}

function generateComponents(): Components {
  const tableName = faker.database.collation().toLowerCase();
  
  return {
    schemas: {
      [tableName]: {
        type: 'object',
        properties: {
          id: { type: 'integer', readOnly: true },
          name: { type: 'string', maxLength: 255 },
          email: { type: 'string', format: 'email' },
          created_date: { type: 'string', format: 'date-time', readOnly: true },
          updated_date: { type: 'string', format: 'date-time', readOnly: true }
        },
        required: ['name', 'email']
      },
      [`${tableName}Input`]: {
        type: 'object',
        properties: {
          name: { type: 'string', maxLength: 255 },
          email: { type: 'string', format: 'email' }
        },
        required: ['name', 'email']
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'integer' },
              message: { type: 'string' },
              context: { type: 'object' }
            }
          }
        }
      }
    },
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-DreamFactory-API-Key'
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  };
}

function generateTags(): Tag[] {
  return [
    {
      name: faker.database.collation().toLowerCase(),
      description: `Operations on ${faker.database.collation().toLowerCase()} table`
    },
    {
      name: 'database',
      description: 'Database table operations'
    }
  ];
}

function generateEndpointParameters(): EndpointParameter[] {
  return [
    {
      name: 'limit',
      type: 'integer',
      location: 'query',
      required: false,
      description: 'Maximum number of records to return',
      defaultValue: 25,
      validation: { minimum: 1, maximum: 1000 }
    },
    {
      name: 'offset',
      type: 'integer',
      location: 'query',
      required: false,
      description: 'Number of records to skip for pagination',
      defaultValue: 0,
      validation: { minimum: 0 }
    },
    {
      name: 'filter',
      type: 'string',
      location: 'query',
      required: false,
      description: 'SQL-style filter expression'
    },
    {
      name: 'order',
      type: 'string',
      location: 'query',
      required: false,
      description: 'Comma-separated list of fields to order by'
    }
  ];
}

function generateApiResponses(): ApiResponse[] {
  return [
    {
      statusCode: 200,
      description: 'Successful operation',
      schema: {
        type: 'object',
        properties: {
          resource: {
            type: 'array',
            items: { type: 'object' }
          }
        }
      },
      examples: {
        'application/json': {
          resource: [
            {
              id: 1,
              name: faker.person.fullName(),
              email: faker.internet.email(),
              created_date: faker.date.recent().toISOString()
            }
          ]
        }
      }
    },
    {
      statusCode: 400,
      description: 'Bad request',
      schema: {
        $ref: '#/components/schemas/Error'
      }
    },
    {
      statusCode: 401,
      description: 'Unauthorized'
    },
    {
      statusCode: 403,
      description: 'Forbidden'
    },
    {
      statusCode: 404,
      description: 'Not found'
    },
    {
      statusCode: 500,
      description: 'Internal server error'
    }
  ];
}

function endpointSecurityFactory(): EndpointSecurity {
  return {
    authentication: ['api_key'],
    roles: ['user'],
    permissions: ['read'],
    apiKeyRequired: true,
    rateLimiting: false
  };
}

function rateLimitConfigFactory(): RateLimitConfig {
  return {
    enabled: faker.datatype.boolean(0.7),
    requestsPerMinute: faker.number.int({ min: 10, max: 1000 }),
    requestsPerHour: faker.number.int({ min: 100, max: 10000 }),
    requestsPerDay: faker.number.int({ min: 1000, max: 100000 }),
    burstLimit: faker.number.int({ min: 5, max: 100 }),
    keyBy: faker.helpers.arrayElement(['ip', 'user', 'api_key'])
  };
}

function cachingConfigFactory(): CachingConfig {
  return {
    enabled: faker.datatype.boolean(0.5),
    ttl: faker.number.int({ min: 60, max: 3600 }),
    strategy: faker.helpers.arrayElement(['memory', 'redis', 'database']),
    varyBy: faker.helpers.arrayElements(['user_id', 'api_key', 'query_params'], { min: 1, max: 3 })
  };
}

function validationConfigFactory(): ValidationConfig {
  return {
    enabled: true,
    strictMode: faker.datatype.boolean(0.3),
    validateResponse: faker.datatype.boolean(0.8),
    customValidators: faker.helpers.arrayElements(['email', 'phone', 'uuid'], { min: 0, max: 3 })
  };
}

function swaggerConfigFactory(): SwaggerConfig {
  return {
    url: '/api/docs/swagger.json',
    layout: 'StandaloneLayout',
    deepLinking: true,
    displayOperationId: false,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    defaultModelRendering: 'example',
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    maxDisplayedTags: 20,
    showExtensions: false,
    showCommonExtensions: false,
    tryItOutEnabled: true
  };
}

function generateTestScenariosForEndpoint(endpoint: ApiEndpointConfig): ApiTestScenario[] {
  return endpoint.methods.map(method => ({
    id: faker.string.uuid(),
    name: `${method} ${endpoint.resource}`,
    description: `Test ${method} operation on ${endpoint.resource}`,
    endpoint: endpoint.resource,
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-DreamFactory-API-Key': faker.string.alphanumeric(32)
    },
    queryParams: method === 'GET' ? {
      limit: 10,
      offset: 0
    } : undefined,
    body: ['POST', 'PUT', 'PATCH'].includes(method) ? generateRequestBody() : undefined,
    expectedStatus: getExpectedStatusForMethod(method),
    expectedResponse: generateResponseBody(method),
    authentication: {
      type: 'api_key',
      credentials: {
        'X-DreamFactory-API-Key': faker.string.alphanumeric(32)
      }
    },
    tags: ['integration', endpoint.tableName, endpoint.serviceName]
  }));
}

function generateRequestBody(): any {
  return {
    resource: [
      {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        status: faker.helpers.arrayElement(['active', 'inactive']),
        metadata: {
          source: 'api',
          created_by: 'test_user'
        }
      }
    ]
  };
}

function generateResponseBody(method: HttpMethod): any {
  switch (method) {
    case 'GET':
      return {
        resource: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
          id: faker.number.int({ min: 1, max: 1000 }),
          name: faker.person.fullName(),
          email: faker.internet.email(),
          created_date: faker.date.recent().toISOString(),
          updated_date: faker.date.recent().toISOString()
        }))
      };
    case 'POST':
      return {
        resource: [
          {
            id: faker.number.int({ min: 1001, max: 2000 }),
            name: faker.person.fullName(),
            email: faker.internet.email(),
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString()
          }
        ]
      };
    case 'PUT':
    case 'PATCH':
      return {
        resource: [
          {
            id: faker.number.int({ min: 1, max: 1000 }),
            name: faker.person.fullName(),
            email: faker.internet.email(),
            created_date: faker.date.past().toISOString(),
            updated_date: new Date().toISOString()
          }
        ]
      };
    case 'DELETE':
      return {
        resource: [
          {
            id: faker.number.int({ min: 1, max: 1000 })
          }
        ]
      };
    default:
      return {};
  }
}

function getExpectedStatusForMethod(method: HttpMethod): number {
  switch (method) {
    case 'GET':
      return 200;
    case 'POST':
      return 201;
    case 'PUT':
    case 'PATCH':
      return 200;
    case 'DELETE':
      return 204;
    default:
      return 200;
  }
}

// ============================================================================
// Additional Types for completeness
// ============================================================================

interface Contact {
  name?: string;
  url?: string;
  email?: string;
}

interface License {
  name: string;
  url?: string;
}

interface OpenApiServer {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariable>;
}

interface ServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

interface Tag {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
}

interface ExternalDocumentation {
  description?: string;
  url: string;
}

interface Example {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}

interface Header {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  schema?: Schema;
  example?: any;
  examples?: Record<string, Example>;
}

interface Link {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, any>;
  requestBody?: any;
  description?: string;
  server?: OpenApiServer;
}

interface Encoding {
  contentType?: string;
  headers?: Record<string, Header>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

interface Callback {
  [expression: string]: PathItem;
}

type SecurityRequirement = Record<string, string[]>;

// Export all factory functions for easy testing
export const apiFixtures = {
  openApiSpecFactory,
  apiEndpointFactory,
  apiDocumentationFactory,
  endpointConfigurationFactory,
  apiTestScenarioFactory,
  apiVersioningScenarioFactory,
  apiGenerationWizardFactory,
  endpointSecurityFactory,
  rateLimitConfigFactory,
  cachingConfigFactory,
  validationConfigFactory,
  swaggerConfigFactory
};