/**
 * API Documentation Mock Utilities
 * 
 * MSW-compatible mock data factory for OpenAPI specification testing and development.
 * Migrated from Angular static mock pattern to React/Next.js compatible factory functions
 * with enhanced TypeScript type safety and Zod validation support.
 * 
 * Features:
 * - Factory functions for flexible test data generation per React testing patterns
 * - MSW request handler compatibility for realistic API mocking during development
 * - Configurable OpenAPI specification parameters for comprehensive testing scenarios
 * - Vitest performance optimizations and React Query integration support
 * - TypeScript type annotations for improved IDE support and type safety
 * - Data validation functions for OpenAPI specification compliance testing
 * 
 * Migration Source: src/app/adf-api-docs/df-api-docs/test-utilities/df-api-docs.mock.ts (Angular)
 * Target Framework: React 19/Next.js 15.1 with Vitest/MSW testing infrastructure
 */

import { z } from 'zod';
import { HTTP_HEADERS } from '@/lib/config/constants';

// =============================================================================
// TYPE DEFINITIONS FOR API DOCUMENTATION MOCKS
// =============================================================================

/**
 * OpenAPI 3.0 Security Scheme Types
 * Comprehensive type definitions for all supported authentication mechanisms
 */
export type SecuritySchemeType = 'http' | 'apiKey' | 'oauth2' | 'openIdConnect';

export interface SecurityScheme {
  type: SecuritySchemeType;
  scheme?: 'basic' | 'bearer' | 'digest' | 'hoba' | 'mutual' | 'negotiate' | 'vapid' | 'scram-sha-1' | 'scram-sha-256';
  bearerFormat?: string;
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  flows?: OAuth2Flows;
  openIdConnectUrl?: string;
}

export interface OAuth2Flows {
  implicit?: OAuth2Flow;
  password?: OAuth2Flow;
  clientCredentials?: OAuth2Flow;
  authorizationCode?: OAuth2Flow;
}

export interface OAuth2Flow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

/**
 * OpenAPI Schema Definition Types
 * Supports all JSON Schema draft-07 types with OpenAPI extensions
 */
export interface OpenAPISchema {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';
  format?: string;
  description?: string;
  enum?: any[];
  items?: OpenAPISchema;
  properties?: Record<string, OpenAPISchema>;
  required?: string[];
  $ref?: string;
  allOf?: OpenAPISchema[];
  oneOf?: OpenAPISchema[];
  anyOf?: OpenAPISchema[];
  not?: OpenAPISchema;
  additionalProperties?: boolean | OpenAPISchema;
  example?: any;
  examples?: Record<string, any>;
  default?: any;
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
}

/**
 * OpenAPI Response Definition
 * Comprehensive response structure with content type support
 */
export interface OpenAPIResponse {
  description: string;
  headers?: Record<string, OpenAPISchema>;
  content?: Record<string, {
    schema: OpenAPISchema;
    example?: any;
    examples?: Record<string, any>;
  }>;
  links?: Record<string, any>;
}

/**
 * OpenAPI Parameter Definition
 * Supports all parameter locations and styles
 */
export interface OpenAPIParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: 'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject';
  explode?: boolean;
  allowReserved?: boolean;
  schema?: OpenAPISchema;
  example?: any;
  examples?: Record<string, any>;
}

/**
 * OpenAPI Operation Definition
 * Complete operation specification with all optional fields
 */
export interface OpenAPIOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: {
    description?: string;
    content: Record<string, {
      schema: OpenAPISchema;
      example?: any;
      examples?: Record<string, any>;
    }>;
    required?: boolean;
  };
  responses: Record<string, OpenAPIResponse>;
  callbacks?: Record<string, any>;
  deprecated?: boolean;
  security?: Array<Record<string, string[]>>;
  servers?: Array<{ url: string; description?: string }>;
  externalDocs?: { description?: string; url: string };
}

/**
 * Complete OpenAPI 3.0 Specification Type
 * Full specification with all components and metadata
 */
export interface OpenAPISpecification {
  openapi: string;
  info: {
    title: string;
    description?: string;
    termsOfService?: string;
    contact?: {
      name?: string;
      url?: string;
      email?: string;
    };
    license?: {
      name: string;
      url?: string;
    };
    version: string;
  };
  servers?: Array<{ url: string; description?: string; variables?: Record<string, any> }>;
  paths: Record<string, Record<string, OpenAPIOperation>>;
  components?: {
    schemas?: Record<string, OpenAPISchema>;
    responses?: Record<string, OpenAPIResponse>;
    parameters?: Record<string, OpenAPIParameter>;
    examples?: Record<string, any>;
    requestBodies?: Record<string, any>;
    headers?: Record<string, any>;
    securitySchemes?: Record<string, SecurityScheme>;
    links?: Record<string, any>;
    callbacks?: Record<string, any>;
  };
  security?: Array<Record<string, string[]>>;
  tags?: Array<{ name: string; description?: string; externalDocs?: any }>;
  externalDocs?: { description?: string; url: string };
}

/**
 * Mock Configuration Options
 * Flexible configuration for test data generation
 */
export interface MockApiDocsConfig {
  serviceName?: string;
  serviceType?: 'email' | 'database' | 'file' | 'remote' | 'script' | 'notification';
  version?: string;
  includeAuth?: boolean;
  includeSecurity?: boolean;
  customSchemas?: Record<string, OpenAPISchema>;
  customEndpoints?: Record<string, Record<string, OpenAPIOperation>>;
  baseUrl?: string;
  description?: string;
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod validation schema for OpenAPI specification compliance
 * Ensures generated mock data adheres to OpenAPI 3.0 standards
 */
export const OpenAPISpecificationSchema = z.object({
  openapi: z.string().regex(/^3\.0\.\d+$/, 'Must be valid OpenAPI 3.0.x version'),
  info: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    version: z.string().min(1, 'Version is required'),
    contact: z.object({
      name: z.string().optional(),
      url: z.string().url().optional(),
      email: z.string().email().optional(),
    }).optional(),
    license: z.object({
      name: z.string().min(1),
      url: z.string().url().optional(),
    }).optional(),
  }),
  servers: z.array(z.object({
    url: z.string().min(1, 'Server URL is required'),
    description: z.string().optional(),
  })).optional(),
  paths: z.record(z.string(), z.record(z.string(), z.any())),
  components: z.object({
    schemas: z.record(z.string(), z.any()).optional(),
    responses: z.record(z.string(), z.any()).optional(),
    parameters: z.record(z.string(), z.any()).optional(),
    securitySchemes: z.record(z.string(), z.any()).optional(),
    requestBodies: z.record(z.string(), z.any()).optional(),
  }).optional(),
  security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
  tags: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  })).optional(),
});

/**
 * Zod validation schema for mock configuration
 * Ensures configuration parameters are valid for test data generation
 */
export const MockApiDocsConfigSchema = z.object({
  serviceName: z.string().min(1).default('Test Service'),
  serviceType: z.enum(['email', 'database', 'file', 'remote', 'script', 'notification']).default('email'),
  version: z.string().default('2.0'),
  includeAuth: z.boolean().default(true),
  includeSecurity: z.boolean().default(true),
  customSchemas: z.record(z.string(), z.any()).default({}),
  customEndpoints: z.record(z.string(), z.record(z.string(), z.any())).default({}),
  baseUrl: z.string().default('/api/v2'),
  description: z.string().optional(),
});

// =============================================================================
// MOCK DATA FACTORY FUNCTIONS
// =============================================================================

/**
 * Creates comprehensive security schemes for OpenAPI specification
 * Supports all DreamFactory authentication mechanisms with configurable options
 * 
 * @param includeAuth - Whether to include authentication schemes (default: true)
 * @returns Record of security scheme definitions
 */
export function createSecuritySchemes(includeAuth: boolean = true): Record<string, SecurityScheme> {
  const baseSchemes: Record<string, SecurityScheme> = {};

  if (includeAuth) {
    return {
      BasicAuth: {
        type: 'http',
        scheme: 'basic',
        description: 'HTTP Basic Authentication with username and password',
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer token authentication',
      },
      ApiKeyQuery: {
        type: 'apiKey',
        in: 'query',
        name: 'api_key',
        description: 'API key passed as query parameter',
      },
      ApiKeyHeader: {
        type: 'apiKey',
        in: 'header',
        name: HTTP_HEADERS.API_KEY,
        description: 'DreamFactory API key passed in request header',
      },
      SessionTokenQuery: {
        type: 'apiKey',
        in: 'query',
        name: 'session_token',
        description: 'Session token passed as query parameter',
      },
      SessionTokenHeader: {
        type: 'apiKey',
        in: 'header',
        name: HTTP_HEADERS.SESSION_TOKEN,
        description: 'DreamFactory session token passed in request header',
      },
    };
  }

  return baseSchemes;
}

/**
 * Creates standard OpenAPI response definitions
 * Provides comprehensive response schemas for common API patterns
 * 
 * @param includeCustomResponses - Whether to include service-specific responses
 * @returns Record of response definitions
 */
export function createApiResponses(includeCustomResponses: boolean = true): Record<string, OpenAPIResponse> {
  const baseResponses: Record<string, OpenAPIResponse> = {
    Success: {
      description: 'Success Response',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Success' },
        },
        'application/xml': {
          schema: { $ref: '#/components/schemas/Success' },
        },
      },
    },
    Error: {
      description: 'Error Response',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' },
        },
        'application/xml': {
          schema: { $ref: '#/components/schemas/Error' },
        },
      },
    },
    ResourceList: {
      description: 'Resource List Response',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ResourceList' },
        },
        'application/xml': {
          schema: { $ref: '#/components/schemas/ResourceList' },
        },
      },
    },
  };

  if (includeCustomResponses) {
    return {
      ...baseResponses,
      EmailResponse: {
        description: 'Email Response',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/EmailResponse' },
          },
          'application/xml': {
            schema: { $ref: '#/components/schemas/EmailResponse' },
          },
        },
      },
      DatabaseResponse: {
        description: 'Database Operation Response',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DatabaseResponse' },
          },
        },
      },
      SchemaResponse: {
        description: 'Database Schema Response',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SchemaResponse' },
          },
        },
      },
    };
  }

  return baseResponses;
}

/**
 * Creates comprehensive OpenAPI schema definitions
 * Supports extensible schema patterns for all DreamFactory service types
 * 
 * @param serviceType - Type of service to generate schemas for
 * @param customSchemas - Additional schema definitions to include
 * @returns Record of schema definitions
 */
export function createApiSchemas(
  serviceType: string = 'email',
  customSchemas: Record<string, OpenAPISchema> = {}
): Record<string, OpenAPISchema> {
  const baseSchemas: Record<string, OpenAPISchema> = {
    Success: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'True when API call was successful, false or error otherwise.',
        },
      },
      required: ['success'],
    },
    Error: {
      type: 'object',
      properties: {
        code: {
          type: 'integer',
          format: 'int32',
          description: 'Error code.',
          minimum: 100,
          maximum: 599,
        },
        message: {
          type: 'string',
          description: 'String description of the error.',
          minLength: 1,
        },
        details: {
          type: 'object',
          description: 'Additional error details and context.',
          additionalProperties: true,
        },
      },
      required: ['code', 'message'],
    },
    ResourceList: {
      type: 'object',
      properties: {
        resource: {
          type: 'array',
          description: 'Array of accessible resources available to this service.',
          items: { type: 'string' },
        },
      },
      required: ['resource'],
    },
  };

  // Service-specific schemas
  const serviceSchemas: Record<string, OpenAPISchema> = {};

  if (serviceType === 'email') {
    Object.assign(serviceSchemas, {
      EmailResponse: {
        type: 'object',
        properties: {
          count: {
            type: 'integer',
            format: 'int32',
            description: 'Number of emails successfully sent.',
            minimum: 0,
          },
        },
        required: ['count'],
      },
      EmailRequest: {
        type: 'object',
        properties: {
          template: {
            type: 'string',
            description: 'Email Template name to base email on.',
          },
          templateId: {
            type: 'integer',
            format: 'int32',
            description: 'Email Template id to base email on.',
            minimum: 1,
          },
          to: {
            type: 'array',
            description: 'Required single or multiple receiver addresses.',
            items: { $ref: '#/components/schemas/EmailAddress' },
            minItems: 1,
          },
          cc: {
            type: 'array',
            description: 'Optional CC receiver addresses.',
            items: { $ref: '#/components/schemas/EmailAddress' },
          },
          bcc: {
            type: 'array',
            description: 'Optional BCC receiver addresses.',
            items: { $ref: '#/components/schemas/EmailAddress' },
          },
          subject: {
            type: 'string',
            description: 'Text only subject line.',
            maxLength: 998, // RFC 5322 limit
          },
          bodyText: {
            type: 'string',
            description: 'Text only version of the body.',
          },
          bodyHtml: {
            type: 'string',
            description: 'Escaped HTML version of the body.',
          },
          fromName: {
            type: 'string',
            description: 'Required sender name.',
            minLength: 1,
          },
          fromEmail: {
            type: 'string',
            format: 'email',
            description: 'Required sender email.',
          },
          replyToName: {
            type: 'string',
            description: 'Optional reply to name.',
          },
          replyToEmail: {
            type: 'string',
            format: 'email',
            description: 'Optional reply to email.',
          },
          attachment: {
            type: 'array',
            description: 'File(s) to import from storage service or URL for attachment',
            items: {
              type: 'object',
              properties: {
                service: {
                  type: 'string',
                  description: 'Name of the storage service to use.',
                },
                path: {
                  type: 'string',
                  description: 'File path relative to the service.',
                },
              },
              required: ['service', 'path'],
            },
          },
        },
        required: ['to', 'fromName', 'fromEmail'],
      },
      EmailAddress: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Optional name displayed along with the email address.',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Required email address.',
          },
        },
        required: ['email'],
      },
    });
  }

  if (serviceType === 'database') {
    Object.assign(serviceSchemas, {
      DatabaseResponse: {
        type: 'object',
        properties: {
          resource: {
            type: 'array',
            description: 'Array of database records.',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
          meta: {
            type: 'object',
            properties: {
              count: { type: 'integer', minimum: 0 },
              schema: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
      SchemaResponse: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Schema name' },
          label: { type: 'string', description: 'Display label' },
          plural: { type: 'string', description: 'Plural form' },
          primary_key: { type: 'array', items: { type: 'string' } },
          name_field: { type: 'string', description: 'Display field name' },
          field: {
            type: 'array',
            description: 'Schema field definitions',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                label: { type: 'string' },
                type: { type: 'string' },
                db_type: { type: 'string' },
                length: { type: 'integer' },
                precision: { type: 'integer' },
                scale: { type: 'integer' },
                default: {},
                required: { type: 'boolean' },
                allow_null: { type: 'boolean' },
                auto_increment: { type: 'boolean' },
                is_primary_key: { type: 'boolean' },
                is_unique: { type: 'boolean' },
              },
              required: ['name', 'type'],
            },
          },
        },
        required: ['name', 'field'],
      },
    });
  }

  return {
    ...baseSchemas,
    ...serviceSchemas,
    ...customSchemas,
  };
}

/**
 * Creates service-specific API endpoints
 * Generates OpenAPI path definitions based on service type and configuration
 * 
 * @param serviceType - Type of service to generate endpoints for
 * @param baseUrl - Base URL for the service endpoints
 * @param customEndpoints - Additional endpoint definitions to include
 * @returns Record of path definitions
 */
export function createApiEndpoints(
  serviceType: string = 'email',
  baseUrl: string = '/api/v2/email',
  customEndpoints: Record<string, Record<string, OpenAPIOperation>> = {}
): Record<string, Record<string, OpenAPIOperation>> {
  const baseEndpoints: Record<string, Record<string, OpenAPIOperation>> = {};

  if (serviceType === 'email') {
    baseEndpoints['/'] = {
      post: {
        summary: 'Send an email created from posted data and/or a template.',
        description: "If a template is not used with all required fields, then they must be included in the request. If the 'from' address is not provisioned in the service, then it must be included in the request.",
        operationId: 'sendEmailEmail',
        tags: ['email'],
        parameters: [
          {
            name: 'template',
            description: 'Optional template name to base email on.',
            schema: { type: 'string' },
            in: 'query',
          },
          {
            name: 'template_id',
            description: 'Optional template id to base email on.',
            schema: { type: 'integer', format: 'int32' },
            in: 'query',
          },
          {
            name: 'attachment',
            description: 'Import file(s) from URL for attachment. This is also available in form-data post and in json payload data.',
            schema: { type: 'string' },
            in: 'query',
          },
        ],
        requestBody: { $ref: '#/components/requestBodies/EmailRequest' },
        responses: {
          '200': { $ref: '#/components/responses/EmailResponse' },
          '400': { $ref: '#/components/responses/Error' },
          '401': { $ref: '#/components/responses/Error' },
          '500': { $ref: '#/components/responses/Error' },
          default: { $ref: '#/components/responses/Error' },
        },
      },
    };
  }

  if (serviceType === 'database') {
    baseEndpoints['/_table'] = {
      get: {
        summary: 'List available database tables',
        description: 'Retrieve metadata for all accessible database tables',
        operationId: 'getTableList',
        tags: ['database', 'schema'],
        parameters: [
          {
            name: 'include_schemas',
            description: 'Include schema information for each table',
            schema: { type: 'boolean', default: false },
            in: 'query',
          },
        ],
        responses: {
          '200': { $ref: '#/components/responses/ResourceList' },
          '401': { $ref: '#/components/responses/Error' },
          '500': { $ref: '#/components/responses/Error' },
        },
      },
    };

    baseEndpoints['/_table/{table_name}'] = {
      get: {
        summary: 'Get table schema information',
        description: 'Retrieve detailed schema information for a specific table',
        operationId: 'getTableSchema',
        tags: ['database', 'schema'],
        parameters: [
          {
            name: 'table_name',
            description: 'Name of the table to retrieve schema for',
            schema: { type: 'string' },
            in: 'path',
            required: true,
          },
        ],
        responses: {
          '200': { $ref: '#/components/responses/SchemaResponse' },
          '404': { $ref: '#/components/responses/Error' },
          '500': { $ref: '#/components/responses/Error' },
        },
      },
    };
  }

  return {
    ...baseEndpoints,
    ...customEndpoints,
  };
}

/**
 * Creates request body definitions for OpenAPI specification
 * Supports all common content types and request patterns
 * 
 * @param serviceType - Type of service to generate request bodies for
 * @returns Record of request body definitions
 */
export function createRequestBodies(serviceType: string = 'email'): Record<string, any> {
  const baseRequestBodies: Record<string, any> = {};

  if (serviceType === 'email') {
    baseRequestBodies.EmailRequest = {
      description: 'Email Request',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/EmailRequest' },
        },
        'application/xml': {
          schema: { $ref: '#/components/schemas/EmailRequest' },
        },
        'multipart/form-data': {
          schema: { $ref: '#/components/schemas/EmailRequest' },
        },
      },
      required: true,
    };
  }

  if (serviceType === 'database') {
    baseRequestBodies.DatabaseRecord = {
      description: 'Database Record Request',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
      required: true,
    };
  }

  return baseRequestBodies;
}

/**
 * Main factory function for creating comprehensive OpenAPI mock data
 * Generates complete OpenAPI 3.0 specification with configurable parameters
 * for testing and development scenarios
 * 
 * @param config - Configuration options for mock data generation
 * @returns Complete OpenAPI specification object
 * 
 * @example
 * ```typescript
 * // Basic email service mock
 * const emailMock = createMockApiDocsData({
 *   serviceName: 'Email Service',
 *   serviceType: 'email'
 * });
 * 
 * // Database service mock with custom schemas
 * const dbMock = createMockApiDocsData({
 *   serviceName: 'User Database',
 *   serviceType: 'database',
 *   customSchemas: {
 *     User: {
 *       type: 'object',
 *       properties: {
 *         id: { type: 'integer' },
 *         name: { type: 'string' }
 *       }
 *     }
 *   }
 * });
 * ```
 */
export function createMockApiDocsData(config: Partial<MockApiDocsConfig> = {}): OpenAPISpecification {
  // Validate and set defaults for configuration
  const validatedConfig = MockApiDocsConfigSchema.parse(config);
  const {
    serviceName,
    serviceType,
    version,
    includeAuth,
    includeSecurity,
    customSchemas,
    customEndpoints,
    baseUrl,
    description,
  } = validatedConfig;

  const spec: OpenAPISpecification = {
    openapi: '3.0.0',
    info: {
      title: serviceName,
      description: description || `${serviceName} API documentation generated for testing and development`,
      version,
    },
    servers: [
      {
        url: baseUrl,
        description: `${serviceName} endpoint`,
      },
    ],
    components: {
      securitySchemes: createSecuritySchemes(includeAuth),
      responses: createApiResponses(serviceType !== 'generic'),
      schemas: createApiSchemas(serviceType, customSchemas),
      requestBodies: createRequestBodies(serviceType),
    },
    paths: createApiEndpoints(serviceType, baseUrl, customEndpoints),
    tags: [
      {
        name: serviceType,
        description: `${serviceName} operations`,
      },
    ],
  };

  if (includeSecurity && includeAuth) {
    spec.security = [
      { BasicAuth: [] },
      { BearerAuth: [] },
      { ApiKeyQuery: [] },
      { ApiKeyHeader: [] },
      { SessionTokenQuery: [] },
      { SessionTokenHeader: [] },
    ];
  }

  return spec;
}

// =============================================================================
// MSW REQUEST HANDLERS AND UTILITIES
// =============================================================================

/**
 * Creates MSW-compatible response data for API documentation endpoints
 * Optimized for React Query integration and realistic API simulation
 * 
 * @param spec - OpenAPI specification to serve
 * @param options - Additional response options for MSW handlers
 * @returns MSW response configuration object
 */
export function createMswApiDocsResponse(
  spec: OpenAPISpecification,
  options: {
    delay?: number;
    status?: number;
    headers?: Record<string, string>;
  } = {}
) {
  const { delay = 100, status = 200, headers = {} } = options;

  return {
    spec,
    delay,
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      ...headers,
    },
  };
}

/**
 * Generates test fixtures optimized for Vitest performance
 * Creates multiple mock variations for comprehensive testing scenarios
 * 
 * @returns Array of test fixture configurations
 */
export function generateTestFixtures(): Array<{
  name: string;
  config: MockApiDocsConfig;
  expectedPaths: string[];
  expectedSchemas: string[];
}> {
  return [
    {
      name: 'Email Service Mock',
      config: MockApiDocsConfigSchema.parse({
        serviceName: 'Test Email Service',
        serviceType: 'email',
        includeAuth: true,
      }),
      expectedPaths: ['/'],
      expectedSchemas: ['Success', 'Error', 'EmailRequest', 'EmailResponse', 'EmailAddress'],
    },
    {
      name: 'Database Service Mock',
      config: MockApiDocsConfigSchema.parse({
        serviceName: 'Test Database Service',
        serviceType: 'database',
        includeAuth: true,
      }),
      expectedPaths: ['/_table', '/_table/{table_name}'],
      expectedSchemas: ['Success', 'Error', 'DatabaseResponse', 'SchemaResponse'],
    },
    {
      name: 'Minimal Service Mock',
      config: MockApiDocsConfigSchema.parse({
        serviceName: 'Minimal Service',
        serviceType: 'script',
        includeAuth: false,
        includeSecurity: false,
      }),
      expectedPaths: [],
      expectedSchemas: ['Success', 'Error'],
    },
  ];
}

// =============================================================================
// VALIDATION AND COMPLIANCE TESTING UTILITIES
// =============================================================================

/**
 * Validates OpenAPI specification compliance
 * Ensures generated mock data adheres to OpenAPI 3.0 standards
 * 
 * @param spec - OpenAPI specification to validate
 * @returns Validation result with detailed error information
 */
export function validateOpenAPISpecification(spec: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  try {
    OpenAPISpecificationSchema.parse(spec);
    
    const warnings: string[] = [];
    
    // Additional validation checks
    if (!spec.components?.schemas) {
      warnings.push('No schemas defined in components');
    }
    
    if (!spec.paths || Object.keys(spec.paths).length === 0) {
      warnings.push('No paths defined in specification');
    }
    
    if (spec.security && spec.security.length > 0 && !spec.components?.securitySchemes) {
      warnings.push('Security requirements defined but no security schemes specified');
    }

    return {
      isValid: true,
      errors: [],
      warnings,
    };
  } catch (error) {
    const errors: string[] = [];
    
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(err => `${err.path.join('.')}: ${err.message}`));
    } else {
      errors.push('Unknown validation error');
    }

    return {
      isValid: false,
      errors,
      warnings: [],
    };
  }
}

/**
 * Checks OpenAPI specification for common API documentation best practices
 * Provides recommendations for improving API documentation quality
 * 
 * @param spec - OpenAPI specification to analyze
 * @returns Quality assessment with recommendations
 */
export function assessApiDocumentationQuality(spec: OpenAPISpecification): {
  score: number;
  recommendations: string[];
  strengths: string[];
} {
  const recommendations: string[] = [];
  const strengths: string[] = [];
  let score = 100;

  // Check for description completeness
  if (!spec.info.description) {
    recommendations.push('Add a comprehensive description to the API info section');
    score -= 10;
  } else {
    strengths.push('API has a descriptive overview');
  }

  // Check for operation descriptions
  let operationsWithoutDescription = 0;
  let totalOperations = 0;
  
  Object.values(spec.paths).forEach(pathItem => {
    Object.values(pathItem).forEach(operation => {
      totalOperations++;
      if (!operation.description) {
        operationsWithoutDescription++;
      }
    });
  });

  if (operationsWithoutDescription > 0) {
    recommendations.push(`Add descriptions to ${operationsWithoutDescription} operation(s)`);
    score -= (operationsWithoutDescription / totalOperations) * 20;
  } else if (totalOperations > 0) {
    strengths.push('All operations have descriptions');
  }

  // Check for example data
  const hasExamples = spec.components?.schemas && 
    Object.values(spec.components.schemas).some(schema => 
      typeof schema === 'object' && 'example' in schema
    );
  
  if (!hasExamples) {
    recommendations.push('Add example data to schema definitions for better documentation');
    score -= 15;
  } else {
    strengths.push('Schema definitions include example data');
  }

  // Check for security documentation
  if (spec.security && spec.security.length > 0) {
    strengths.push('API includes security requirements');
  } else {
    recommendations.push('Consider adding security requirements if API requires authentication');
    score -= 5;
  }

  return {
    score: Math.max(0, Math.round(score)),
    recommendations,
    strengths,
  };
}

// =============================================================================
// DEFAULT EXPORT - BACKWARD COMPATIBILITY
// =============================================================================

/**
 * Default mock data for backward compatibility with existing tests
 * Maintains the original static export pattern while providing enhanced functionality
 */
export const mockApiDocsData = createMockApiDocsData({
  serviceName: 'Local Email Service',
  serviceType: 'email',
  description: 'Email service used for sending user invites and/or password reset confirmation.',
  version: '2.0',
  includeAuth: true,
  includeSecurity: true,
});

/**
 * Type-safe mock data for development and testing
 * Provides validated mock data with comprehensive type information
 */
export type MockApiDocsData = typeof mockApiDocsData;

// Re-export for convenience and backward compatibility
export default mockApiDocsData;