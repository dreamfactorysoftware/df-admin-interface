/**
 * Comprehensive Mock Data and Fixtures for OpenAPI Preview Testing
 * 
 * Provides realistic test data for OpenAPI documentation preview components including:
 * - Complete OpenAPI v3.0.0 specifications for multiple service types
 * - Database service configurations (MySQL, PostgreSQL, MongoDB, Snowflake)
 * - Email service definitions with DreamFactory extensions
 * - Security schemes and authentication methods
 * - Component schemas and reusable definitions
 * - API key management test data
 * - Service metadata and health information
 * 
 * @fileoverview Mock data for F-006 API Documentation and Testing with type-safe interfaces
 * @version 1.0.0
 * @since React 19.0.0 + Next.js 15.1
 */

import type {
  OpenAPISpecification,
  ApiDocsRowData,
  ServiceInfo,
  ApiKeyInfo,
  SwaggerUIConfig,
  ApiDocumentationMetadata,
  ServiceEndpoint,
  ServiceHealthStatus,
  ApiDocParameter,
  ApiDocResponse,
  ApiDocExample,
} from '../types';

// ============================================================================
// HTTP Headers and Constants (Mock Implementation)
// ============================================================================

/**
 * Mock HTTP headers constants for testing
 * Replaces src/lib/constants/http-headers.ts dependency
 */
export const MOCK_HTTP_HEADERS = {
  API_KEY_HEADER: 'X-DreamFactory-Api-Key',
  SESSION_TOKEN_HEADER: 'X-DreamFactory-Session-Token',
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  CACHE_CONTROL: 'Cache-Control',
  USER_AGENT: 'User-Agent',
} as const;

// ============================================================================
// Base OpenAPI Specification Templates
// ============================================================================

/**
 * Base OpenAPI information shared across all mock specifications
 */
const baseOpenAPIInfo = {
  contact: {
    name: 'DreamFactory Software, Inc.',
    url: 'https://www.dreamfactory.com',
    email: 'support@dreamfactory.com',
  },
  license: {
    name: 'Apache 2.0',
    url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
  },
  termsOfService: 'https://www.dreamfactory.com/terms',
  'x-dreamfactory-generated': new Date().toISOString(),
} as const;

/**
 * Common security schemes used across all DreamFactory services
 */
const commonSecuritySchemes = {
  BasicAuth: {
    type: 'http' as const,
    scheme: 'basic',
    description: 'HTTP Basic Authentication',
  },
  BearerAuth: {
    type: 'http' as const,
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT Bearer Token Authentication',
  },
  ApiKeyQuery: {
    type: 'apiKey' as const,
    in: 'query' as const,
    name: 'api_key',
    description: 'API Key passed as query parameter',
  },
  ApiKeyHeader: {
    type: 'apiKey' as const,
    in: 'header' as const,
    name: MOCK_HTTP_HEADERS.API_KEY_HEADER,
    description: 'API Key passed in request header',
  },
  SessionTokenQuery: {
    type: 'apiKey' as const,
    in: 'query' as const,
    name: 'session_token',
    description: 'Session token passed as query parameter',
  },
  SessionTokenHeader: {
    type: 'apiKey' as const,
    in: 'header' as const,
    name: MOCK_HTTP_HEADERS.SESSION_TOKEN_HEADER,
    description: 'Session token passed in request header',
  },
  OAuth2: {
    type: 'oauth2' as const,
    description: 'OAuth 2.0 Authentication',
    flows: {
      authorizationCode: {
        authorizationUrl: 'https://auth.dreamfactory.com/oauth/authorize',
        tokenUrl: 'https://auth.dreamfactory.com/oauth/token',
        scopes: {
          'read': 'Read access to API resources',
          'write': 'Write access to API resources',
          'admin': 'Administrative access to all resources',
        },
      },
    },
  },
} as const;

/**
 * Common response schemas used across all services
 */
const commonResponseSchemas = {
  Success: {
    type: 'object' as const,
    properties: {
      success: {
        type: 'boolean' as const,
        description: 'True when API call was successful, false or error otherwise.',
        example: true,
      },
    },
    required: ['success'],
  },
  Error: {
    type: 'object' as const,
    properties: {
      error: {
        type: 'object' as const,
        properties: {
          code: {
            type: 'integer' as const,
            format: 'int32',
            description: 'Error code.',
            example: 400,
          },
          message: {
            type: 'string' as const,
            description: 'String description of the error.',
            example: 'Bad Request',
          },
          context: {
            type: 'object' as const,
            description: 'Additional error context',
            additionalProperties: true,
          },
        },
        required: ['code', 'message'],
      },
    },
    required: ['error'],
  },
  ResourceList: {
    type: 'object' as const,
    properties: {
      resource: {
        type: 'array' as const,
        description: 'Array of accessible resources available to this service.',
        items: { type: 'string' as const },
        example: ['users', 'posts', 'comments'],
      },
    },
    required: ['resource'],
  },
  PaginatedResponse: {
    type: 'object' as const,
    properties: {
      resource: {
        type: 'array' as const,
        description: 'Array of resources',
        items: { type: 'object' as const },
      },
      meta: {
        type: 'object' as const,
        properties: {
          count: {
            type: 'integer' as const,
            description: 'Number of records returned',
            example: 25,
          },
          total: {
            type: 'integer' as const,
            description: 'Total number of records available',
            example: 150,
          },
          offset: {
            type: 'integer' as const,
            description: 'Starting record offset',
            example: 0,
          },
        },
        required: ['count'],
      },
    },
    required: ['resource'],
  },
} as const;

/**
 * Common request/response components
 */
const commonComponents = {
  responses: {
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
    PaginatedResponse: {
      description: 'Paginated Resource Response',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/PaginatedResponse' },
        },
        'application/xml': {
          schema: { $ref: '#/components/schemas/PaginatedResponse' },
        },
      },
    },
  },
  parameters: {
    LimitParam: {
      name: 'limit',
      in: 'query' as const,
      description: 'Number of records to return',
      required: false,
      schema: {
        type: 'integer' as const,
        minimum: 1,
        maximum: 1000,
        default: 25,
      },
      example: 25,
    },
    OffsetParam: {
      name: 'offset',
      in: 'query' as const,
      description: 'Starting record offset',
      required: false,
      schema: {
        type: 'integer' as const,
        minimum: 0,
        default: 0,
      },
      example: 0,
    },
    FilterParam: {
      name: 'filter',
      in: 'query' as const,
      description: 'SQL-like where clause for filtering records',
      required: false,
      schema: {
        type: 'string' as const,
      },
      example: 'name like "John%"',
    },
    OrderParam: {
      name: 'order',
      in: 'query' as const,
      description: 'SQL-like order by clause for sorting records',
      required: false,
      schema: {
        type: 'string' as const,
      },
      example: 'created_date DESC',
    },
    GroupParam: {
      name: 'group',
      in: 'query' as const,
      description: 'Comma-separated list of fields to group by',
      required: false,
      schema: {
        type: 'string' as const,
      },
      example: 'category,status',
    },
    FieldsParam: {
      name: 'fields',
      in: 'query' as const,
      description: 'Comma-separated list of field names to return',
      required: false,
      schema: {
        type: 'string' as const,
      },
      example: 'id,name,email',
    },
  },
} as const;

// ============================================================================
// Email Service OpenAPI Specification
// ============================================================================

/**
 * Complete OpenAPI specification for email service
 * Enhanced version of the original Angular mock data
 */
export const mockEmailServiceSpec: OpenAPISpecification = {
  openapi: '3.0.0',
  info: {
    title: 'DreamFactory Email Service',
    description: 'Email service used for sending user invites, password reset confirmations, and general email communications. Supports template-based emails with attachments and HTML content.',
    version: '2.1.0',
    'x-dreamfactory-service': 'email',
    ...baseOpenAPIInfo,
  },
  servers: [
    {
      url: '/api/v2/email',
      description: 'DreamFactory Email Service API Endpoint',
    },
    {
      url: 'https://demo.dreamfactory.com/api/v2/email',
      description: 'Demo Environment',
    },
  ],
  security: [
    { ApiKeyHeader: [] },
    { SessionTokenHeader: [] },
    { BearerAuth: [] },
    { BasicAuth: [] },
  ],
  tags: [
    {
      name: 'email',
      description: 'Email operations',
      externalDocs: {
        description: 'Email Service Documentation',
        url: 'https://wiki.dreamfactory.com/Email_Services',
      },
    },
  ],
  paths: {
    '/': {
      get: {
        summary: 'Get available email resources',
        description: 'Returns a list of available email resources and operations.',
        operationId: 'getEmailResources',
        tags: ['email'],
        responses: {
          '200': { $ref: '#/components/responses/ResourceList' },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'GET',
        'x-dreamfactory-cache': true,
      },
      post: {
        summary: 'Send an email created from posted data and/or a template',
        description: "Send an email using provided data or a template. If a template is not used with all required fields, then they must be included in the request. If the 'from' address is not provisioned in the service, then it must be included in the request.",
        operationId: 'sendEmail',
        tags: ['email'],
        parameters: [
          {
            name: 'template',
            description: 'Optional template name to base email on.',
            schema: { type: 'string' },
            in: 'query',
            example: 'welcome-email',
          },
          {
            name: 'template_id',
            description: 'Optional template id to base email on.',
            schema: { type: 'integer', format: 'int32' },
            in: 'query',
            example: 123,
          },
          {
            name: 'attachment',
            description: 'Import file(s) from URL for attachment. This is also available in form-data post and in json payload data.',
            schema: { type: 'string' },
            in: 'query',
            example: 'https://example.com/file.pdf',
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
        'x-dreamfactory-verb': 'POST',
      },
    },
    '/templates': {
      get: {
        summary: 'Get available email templates',
        description: 'Returns a list of configured email templates.',
        operationId: 'getEmailTemplates',
        tags: ['email'],
        parameters: [
          { $ref: '#/components/parameters/LimitParam' },
          { $ref: '#/components/parameters/OffsetParam' },
          { $ref: '#/components/parameters/FilterParam' },
        ],
        responses: {
          '200': { $ref: '#/components/responses/EmailTemplateList' },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'GET',
        'x-dreamfactory-cache': true,
      },
    },
  },
  components: {
    securitySchemes: commonSecuritySchemes,
    parameters: commonComponents.parameters,
    responses: {
      ...commonComponents.responses,
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
      EmailTemplateList: {
        description: 'Email Template List Response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                resource: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/EmailTemplate' },
                },
                meta: {
                  $ref: '#/components/schemas/PaginatedResponse/properties/meta',
                },
              },
            },
          },
        },
      },
    },
    schemas: {
      ...commonResponseSchemas,
      EmailResponse: {
        type: 'object',
        properties: {
          count: {
            type: 'integer',
            format: 'int32',
            description: 'Number of emails successfully sent.',
            example: 1,
          },
          success: {
            type: 'boolean',
            description: 'Whether the email was sent successfully.',
            example: true,
          },
          message: {
            type: 'string',
            description: 'Additional response message.',
            example: 'Email sent successfully',
          },
        },
        required: ['count', 'success'],
      },
      EmailRequest: {
        type: 'object',
        properties: {
          template: {
            type: 'string',
            description: 'Email Template name to base email on.',
            example: 'welcome-email',
          },
          templateId: {
            type: 'integer',
            format: 'int32',
            description: 'Email Template id to base email on.',
            example: 123,
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
            example: 'Welcome to DreamFactory!',
            maxLength: 255,
          },
          bodyText: {
            type: 'string',
            description: 'Text only version of the body.',
            example: 'Welcome to DreamFactory! Thank you for signing up.',
          },
          bodyHtml: {
            type: 'string',
            description: 'Escaped HTML version of the body.',
            example: '<h1>Welcome to DreamFactory!</h1><p>Thank you for signing up.</p>',
          },
          fromName: {
            type: 'string',
            description: 'Required sender name.',
            example: 'DreamFactory Support',
            maxLength: 100,
          },
          fromEmail: {
            type: 'string',
            description: 'Required sender email.',
            format: 'email',
            example: 'support@dreamfactory.com',
          },
          replyToName: {
            type: 'string',
            description: 'Optional reply to name.',
            example: 'DreamFactory No-Reply',
            maxLength: 100,
          },
          replyToEmail: {
            type: 'string',
            description: 'Optional reply to email.',
            format: 'email',
            example: 'no-reply@dreamfactory.com',
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
                  example: 'local_files',
                },
                path: {
                  type: 'string',
                  description: 'File path relative to the service.',
                  example: 'attachments/welcome-guide.pdf',
                },
                url: {
                  type: 'string',
                  format: 'uri',
                  description: 'Direct URL to the file for attachment.',
                  example: 'https://example.com/file.pdf',
                },
              },
            },
          },
          priority: {
            type: 'string',
            enum: ['low', 'normal', 'high'],
            description: 'Email priority level',
            default: 'normal',
            example: 'normal',
          },
        },
        required: ['to', 'subject', 'fromName', 'fromEmail'],
      },
      EmailAddress: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Optional name displayed along with the email address.',
            example: 'John Doe',
            maxLength: 100,
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Required email address.',
            example: 'john.doe@example.com',
          },
        },
        required: ['email'],
      },
      EmailTemplate: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Template ID',
            example: 123,
          },
          name: {
            type: 'string',
            description: 'Template name',
            example: 'welcome-email',
          },
          subject: {
            type: 'string',
            description: 'Template subject line',
            example: 'Welcome to DreamFactory!',
          },
          description: {
            type: 'string',
            description: 'Template description',
            example: 'Welcome email template for new users',
          },
          created_date: {
            type: 'string',
            format: 'date-time',
            description: 'Template creation date',
            example: '2024-01-15T10:30:00Z',
          },
          last_modified_date: {
            type: 'string',
            format: 'date-time',
            description: 'Template last modification date',
            example: '2024-01-20T14:45:00Z',
          },
        },
        required: ['id', 'name', 'subject'],
      },
    },
    requestBodies: {
      EmailRequest: {
        description: 'Email Request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/EmailRequest' },
            examples: {
              simpleEmail: {
                summary: 'Simple email example',
                description: 'Basic email with text content',
                value: {
                  to: [{ email: 'user@example.com', name: 'Test User' }],
                  subject: 'Test Email',
                  bodyText: 'This is a test email.',
                  fromName: 'DreamFactory',
                  fromEmail: 'test@dreamfactory.com',
                },
              },
              templateEmail: {
                summary: 'Template-based email',
                description: 'Email using a predefined template',
                value: {
                  template: 'welcome-email',
                  to: [{ email: 'newuser@example.com', name: 'New User' }],
                  fromName: 'DreamFactory Support',
                  fromEmail: 'support@dreamfactory.com',
                },
              },
            },
          },
          'application/xml': {
            schema: { $ref: '#/components/schemas/EmailRequest' },
          },
          'multipart/form-data': {
            schema: { $ref: '#/components/schemas/EmailRequest' },
          },
        },
        required: true,
      },
    },
  },
} as const;

// ============================================================================
// Database Service OpenAPI Specifications
// ============================================================================

/**
 * MySQL Database Service OpenAPI specification
 */
export const mockMySQLServiceSpec: OpenAPISpecification = {
  openapi: '3.0.0',
  info: {
    title: 'DreamFactory MySQL Database Service',
    description: 'REST API for MySQL database operations including CRUD operations, stored procedures, and database introspection. Automatically generated from database schema.',
    version: '2.1.0',
    'x-dreamfactory-service': 'mysql_db',
    ...baseOpenAPIInfo,
  },
  servers: [
    {
      url: '/api/v2/mysql_db',
      description: 'DreamFactory MySQL Database Service',
    },
  ],
  security: [
    { ApiKeyHeader: [] },
    { SessionTokenHeader: [] },
  ],
  tags: [
    {
      name: 'users',
      description: 'User management operations',
    },
    {
      name: 'posts',
      description: 'Blog post operations',
    },
    {
      name: 'comments',
      description: 'Comment operations',
    },
    {
      name: 'database',
      description: 'Database introspection operations',
    },
  ],
  paths: {
    '/': {
      get: {
        summary: 'Get available database resources',
        description: 'Returns a list of available tables, views, and stored procedures.',
        operationId: 'getDatabaseResources',
        tags: ['database'],
        responses: {
          '200': { $ref: '#/components/responses/ResourceList' },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'GET',
        'x-dreamfactory-cache': true,
      },
    },
    '/_schema': {
      get: {
        summary: 'Get database schema',
        description: 'Returns the complete database schema including tables, fields, and relationships.',
        operationId: 'getDatabaseSchema',
        tags: ['database'],
        responses: {
          '200': {
            description: 'Database Schema',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DatabaseSchema' },
              },
            },
          },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'GET',
        'x-dreamfactory-cache': true,
      },
    },
    '/users': {
      get: {
        summary: 'Get users',
        description: 'Retrieve user records with optional filtering and pagination.',
        operationId: 'getUsers',
        tags: ['users'],
        parameters: [
          { $ref: '#/components/parameters/LimitParam' },
          { $ref: '#/components/parameters/OffsetParam' },
          { $ref: '#/components/parameters/FilterParam' },
          { $ref: '#/components/parameters/OrderParam' },
          { $ref: '#/components/parameters/FieldsParam' },
        ],
        responses: {
          '200': { $ref: '#/components/responses/UserList' },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'GET',
        'x-dreamfactory-table': 'users',
        'x-dreamfactory-cache': true,
      },
      post: {
        summary: 'Create users',
        description: 'Create one or more user records.',
        operationId: 'createUsers',
        tags: ['users'],
        requestBody: { $ref: '#/components/requestBodies/UserRequest' },
        responses: {
          '201': { $ref: '#/components/responses/UserList' },
          '400': { $ref: '#/components/responses/Error' },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'POST',
        'x-dreamfactory-table': 'users',
      },
      put: {
        summary: 'Update users',
        description: 'Update one or more user records.',
        operationId: 'updateUsers',
        tags: ['users'],
        requestBody: { $ref: '#/components/requestBodies/UserRequest' },
        responses: {
          '200': { $ref: '#/components/responses/UserList' },
          '400': { $ref: '#/components/responses/Error' },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'PUT',
        'x-dreamfactory-table': 'users',
      },
      patch: {
        summary: 'Patch users',
        description: 'Partially update one or more user records.',
        operationId: 'patchUsers',
        tags: ['users'],
        requestBody: { $ref: '#/components/requestBodies/UserRequest' },
        responses: {
          '200': { $ref: '#/components/responses/UserList' },
          '400': { $ref: '#/components/responses/Error' },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'PATCH',
        'x-dreamfactory-table': 'users',
      },
      delete: {
        summary: 'Delete users',
        description: 'Delete one or more user records.',
        operationId: 'deleteUsers',
        tags: ['users'],
        parameters: [
          { $ref: '#/components/parameters/FilterParam' },
        ],
        responses: {
          '200': { $ref: '#/components/responses/UserList' },
          '400': { $ref: '#/components/responses/Error' },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'DELETE',
        'x-dreamfactory-table': 'users',
      },
    },
    '/users/{id}': {
      get: {
        summary: 'Get user by ID',
        description: 'Retrieve a specific user record by ID.',
        operationId: 'getUserById',
        tags: ['users'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: { type: 'integer', format: 'int32' },
            example: 123,
          },
          { $ref: '#/components/parameters/FieldsParam' },
        ],
        responses: {
          '200': { $ref: '#/components/responses/User' },
          '404': { $ref: '#/components/responses/Error' },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'GET',
        'x-dreamfactory-table': 'users',
      },
      put: {
        summary: 'Update user by ID',
        description: 'Update a specific user record by ID.',
        operationId: 'updateUserById',
        tags: ['users'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: { type: 'integer', format: 'int32' },
            example: 123,
          },
        ],
        requestBody: {
          description: 'User data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' },
            },
          },
          required: true,
        },
        responses: {
          '200': { $ref: '#/components/responses/User' },
          '400': { $ref: '#/components/responses/Error' },
          '404': { $ref: '#/components/responses/Error' },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'PUT',
        'x-dreamfactory-table': 'users',
      },
      delete: {
        summary: 'Delete user by ID',
        description: 'Delete a specific user record by ID.',
        operationId: 'deleteUserById',
        tags: ['users'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: { type: 'integer', format: 'int32' },
            example: 123,
          },
        ],
        responses: {
          '200': { $ref: '#/components/responses/User' },
          '404': { $ref: '#/components/responses/Error' },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'DELETE',
        'x-dreamfactory-table': 'users',
      },
    },
    '/posts': {
      get: {
        summary: 'Get posts',
        description: 'Retrieve blog post records with optional filtering and pagination.',
        operationId: 'getPosts',
        tags: ['posts'],
        parameters: [
          { $ref: '#/components/parameters/LimitParam' },
          { $ref: '#/components/parameters/OffsetParam' },
          { $ref: '#/components/parameters/FilterParam' },
          { $ref: '#/components/parameters/OrderParam' },
          { $ref: '#/components/parameters/FieldsParam' },
        ],
        responses: {
          '200': { $ref: '#/components/responses/PostList' },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'GET',
        'x-dreamfactory-table': 'posts',
        'x-dreamfactory-cache': true,
      },
      post: {
        summary: 'Create posts',
        description: 'Create one or more blog post records.',
        operationId: 'createPosts',
        tags: ['posts'],
        requestBody: { $ref: '#/components/requestBodies/PostRequest' },
        responses: {
          '201': { $ref: '#/components/responses/PostList' },
          '400': { $ref: '#/components/responses/Error' },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'POST',
        'x-dreamfactory-table': 'posts',
      },
    },
  },
  components: {
    securitySchemes: commonSecuritySchemes,
    parameters: commonComponents.parameters,
    responses: {
      ...commonComponents.responses,
      User: {
        description: 'User Record',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/User' },
          },
        },
      },
      UserList: {
        description: 'User List',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                resource: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/User' },
                },
                meta: {
                  $ref: '#/components/schemas/PaginatedResponse/properties/meta',
                },
              },
            },
          },
        },
      },
      Post: {
        description: 'Post Record',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Post' },
          },
        },
      },
      PostList: {
        description: 'Post List',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                resource: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Post' },
                },
                meta: {
                  $ref: '#/components/schemas/PaginatedResponse/properties/meta',
                },
              },
            },
          },
        },
      },
    },
    schemas: {
      ...commonResponseSchemas,
      DatabaseSchema: {
        type: 'object',
        properties: {
          table: {
            type: 'array',
            items: { $ref: '#/components/schemas/TableSchema' },
          },
        },
      },
      TableSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Table name',
            example: 'users',
          },
          label: {
            type: 'string',
            description: 'Table display label',
            example: 'Users',
          },
          plural: {
            type: 'string',
            description: 'Plural form of table name',
            example: 'users',
          },
          primary_key: {
            type: 'array',
            items: { type: 'string' },
            description: 'Primary key field names',
            example: ['id'],
          },
          field: {
            type: 'array',
            items: { $ref: '#/components/schemas/FieldSchema' },
          },
        },
      },
      FieldSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Field name',
            example: 'email',
          },
          label: {
            type: 'string',
            description: 'Field display label',
            example: 'Email Address',
          },
          type: {
            type: 'string',
            description: 'Database field type',
            example: 'varchar',
          },
          db_type: {
            type: 'string',
            description: 'Native database type',
            example: 'varchar(255)',
          },
          length: {
            type: 'integer',
            description: 'Field length',
            example: 255,
          },
          precision: {
            type: 'integer',
            description: 'Numeric precision',
            example: 10,
          },
          scale: {
            type: 'integer',
            description: 'Numeric scale',
            example: 2,
          },
          default: {
            description: 'Default value',
            example: null,
          },
          required: {
            type: 'boolean',
            description: 'Whether field is required',
            example: true,
          },
          allow_null: {
            type: 'boolean',
            description: 'Whether field allows null values',
            example: false,
          },
          auto_increment: {
            type: 'boolean',
            description: 'Whether field is auto-incrementing',
            example: false,
          },
          is_primary_key: {
            type: 'boolean',
            description: 'Whether field is part of primary key',
            example: false,
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int32',
            description: 'User ID',
            example: 123,
            'x-dreamfactory-type': 'id',
          },
          name: {
            type: 'string',
            description: 'User full name',
            example: 'John Doe',
            maxLength: 100,
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john.doe@example.com',
            maxLength: 255,
          },
          username: {
            type: 'string',
            description: 'Unique username',
            example: 'johndoe',
            maxLength: 50,
          },
          created_date: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation date',
            example: '2024-01-15T10:30:00Z',
            readOnly: true,
          },
          last_modified_date: {
            type: 'string',
            format: 'date-time',
            description: 'Last modification date',
            example: '2024-01-20T14:45:00Z',
            readOnly: true,
          },
          is_active: {
            type: 'boolean',
            description: 'Whether user account is active',
            example: true,
            default: true,
          },
          posts: {
            type: 'array',
            items: { $ref: '#/components/schemas/Post' },
            description: 'User posts (if included)',
            'x-dreamfactory-relationship': 'has_many',
          },
        },
        required: ['name', 'email'],
      },
      Post: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int32',
            description: 'Post ID',
            example: 456,
            'x-dreamfactory-type': 'id',
          },
          title: {
            type: 'string',
            description: 'Post title',
            example: 'Getting Started with DreamFactory',
            maxLength: 255,
          },
          content: {
            type: 'string',
            description: 'Post content',
            example: 'This is a comprehensive guide to getting started with DreamFactory...',
          },
          excerpt: {
            type: 'string',
            description: 'Post excerpt',
            example: 'A comprehensive guide to getting started...',
            maxLength: 500,
          },
          status: {
            type: 'string',
            enum: ['draft', 'published', 'archived'],
            description: 'Post status',
            example: 'published',
            default: 'draft',
          },
          user_id: {
            type: 'integer',
            format: 'int32',
            description: 'Author user ID',
            example: 123,
            'x-dreamfactory-relationship': 'belongs_to',
          },
          created_date: {
            type: 'string',
            format: 'date-time',
            description: 'Post creation date',
            example: '2024-01-15T10:30:00Z',
            readOnly: true,
          },
          published_date: {
            type: 'string',
            format: 'date-time',
            description: 'Post publication date',
            example: '2024-01-16T09:00:00Z',
          },
        },
        required: ['title', 'content', 'user_id'],
      },
    },
    requestBodies: {
      UserRequest: {
        description: 'User Request',
        content: {
          'application/json': {
            schema: {
              oneOf: [
                { $ref: '#/components/schemas/User' },
                {
                  type: 'object',
                  properties: {
                    resource: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              ],
            },
            examples: {
              singleUser: {
                summary: 'Single user',
                description: 'Create or update a single user',
                value: {
                  name: 'Jane Smith',
                  email: 'jane.smith@example.com',
                  username: 'janesmith',
                  is_active: true,
                },
              },
              multipleUsers: {
                summary: 'Multiple users',
                description: 'Create or update multiple users',
                value: {
                  resource: [
                    {
                      name: 'Jane Smith',
                      email: 'jane.smith@example.com',
                      username: 'janesmith',
                    },
                    {
                      name: 'Bob Johnson',
                      email: 'bob.johnson@example.com',
                      username: 'bobjohnson',
                    },
                  ],
                },
              },
            },
          },
        },
        required: true,
      },
      PostRequest: {
        description: 'Post Request',
        content: {
          'application/json': {
            schema: {
              oneOf: [
                { $ref: '#/components/schemas/Post' },
                {
                  type: 'object',
                  properties: {
                    resource: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Post' },
                    },
                  },
                },
              ],
            },
          },
        },
        required: true,
      },
    },
  },
} as const;

/**
 * PostgreSQL Database Service OpenAPI specification
 */
export const mockPostgreSQLServiceSpec: OpenAPISpecification = {
  openapi: '3.0.0',
  info: {
    title: 'DreamFactory PostgreSQL Database Service',
    description: 'REST API for PostgreSQL database operations with advanced query capabilities, JSON support, and full-text search. Automatically generated from database schema.',
    version: '2.1.0',
    'x-dreamfactory-service': 'postgres_db',
    ...baseOpenAPIInfo,
  },
  servers: [
    {
      url: '/api/v2/postgres_db',
      description: 'DreamFactory PostgreSQL Database Service',
    },
  ],
  security: [
    { ApiKeyHeader: [] },
    { SessionTokenHeader: [] },
  ],
  tags: [
    {
      name: 'products',
      description: 'Product catalog operations',
    },
    {
      name: 'categories',
      description: 'Product category operations',
    },
    {
      name: 'orders',
      description: 'Order management operations',
    },
  ],
  paths: {
    '/': {
      get: {
        summary: 'Get available database resources',
        description: 'Returns a list of available tables, views, and stored procedures.',
        operationId: 'getPostgreSQLResources',
        responses: {
          '200': { $ref: '#/components/responses/ResourceList' },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'GET',
        'x-dreamfactory-cache': true,
      },
    },
    '/products': {
      get: {
        summary: 'Get products',
        description: 'Retrieve product records with support for advanced PostgreSQL features like JSON queries and full-text search.',
        operationId: 'getProducts',
        tags: ['products'],
        parameters: [
          { $ref: '#/components/parameters/LimitParam' },
          { $ref: '#/components/parameters/OffsetParam' },
          { $ref: '#/components/parameters/FilterParam' },
          { $ref: '#/components/parameters/OrderParam' },
          { $ref: '#/components/parameters/FieldsParam' },
          {
            name: 'search',
            in: 'query',
            description: 'Full-text search query',
            required: false,
            schema: { type: 'string' },
            example: 'wireless headphones',
          },
        ],
        responses: {
          '200': { $ref: '#/components/responses/ProductList' },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'GET',
        'x-dreamfactory-table': 'products',
        'x-dreamfactory-cache': true,
      },
      post: {
        summary: 'Create products',
        description: 'Create one or more product records with JSON metadata support.',
        operationId: 'createProducts',
        tags: ['products'],
        requestBody: { $ref: '#/components/requestBodies/ProductRequest' },
        responses: {
          '201': { $ref: '#/components/responses/ProductList' },
          '400': { $ref: '#/components/responses/Error' },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'POST',
        'x-dreamfactory-table': 'products',
      },
    },
  },
  components: {
    securitySchemes: commonSecuritySchemes,
    parameters: commonComponents.parameters,
    responses: {
      ...commonComponents.responses,
      ProductList: {
        description: 'Product List',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                resource: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Product' },
                },
                meta: {
                  $ref: '#/components/schemas/PaginatedResponse/properties/meta',
                },
              },
            },
          },
        },
      },
    },
    schemas: {
      ...commonResponseSchemas,
      Product: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int32',
            description: 'Product ID',
            example: 789,
            'x-dreamfactory-type': 'id',
          },
          name: {
            type: 'string',
            description: 'Product name',
            example: 'Wireless Bluetooth Headphones',
            maxLength: 255,
          },
          description: {
            type: 'string',
            description: 'Product description',
            example: 'High-quality wireless headphones with noise cancellation',
          },
          price: {
            type: 'number',
            format: 'decimal',
            description: 'Product price',
            example: 199.99,
            minimum: 0,
          },
          sku: {
            type: 'string',
            description: 'Stock Keeping Unit',
            example: 'WBH-001',
            maxLength: 50,
          },
          category_id: {
            type: 'integer',
            format: 'int32',
            description: 'Category ID',
            example: 101,
            'x-dreamfactory-relationship': 'belongs_to',
          },
          metadata: {
            type: 'object',
            description: 'Product metadata in JSON format',
            example: {
              brand: 'AudioTech',
              color: 'Black',
              weight: '250g',
              features: ['noise-cancellation', 'wireless', 'long-battery'],
            },
            additionalProperties: true,
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Product tags for search and categorization',
            example: ['electronics', 'audio', 'wireless'],
          },
          is_active: {
            type: 'boolean',
            description: 'Whether product is active',
            example: true,
            default: true,
          },
          created_date: {
            type: 'string',
            format: 'date-time',
            description: 'Product creation date',
            example: '2024-01-15T10:30:00Z',
            readOnly: true,
          },
          last_modified_date: {
            type: 'string',
            format: 'date-time',
            description: 'Last modification date',
            example: '2024-01-20T14:45:00Z',
            readOnly: true,
          },
        },
        required: ['name', 'price', 'sku', 'category_id'],
      },
      Category: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int32',
            description: 'Category ID',
            example: 101,
            'x-dreamfactory-type': 'id',
          },
          name: {
            type: 'string',
            description: 'Category name',
            example: 'Electronics',
            maxLength: 100,
          },
          slug: {
            type: 'string',
            description: 'URL-friendly category slug',
            example: 'electronics',
            maxLength: 100,
          },
          parent_id: {
            type: 'integer',
            format: 'int32',
            description: 'Parent category ID for hierarchical categories',
            example: null,
            'x-dreamfactory-relationship': 'belongs_to',
          },
        },
        required: ['name', 'slug'],
      },
    },
    requestBodies: {
      ProductRequest: {
        description: 'Product Request',
        content: {
          'application/json': {
            schema: {
              oneOf: [
                { $ref: '#/components/schemas/Product' },
                {
                  type: 'object',
                  properties: {
                    resource: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Product' },
                    },
                  },
                },
              ],
            },
            examples: {
              singleProduct: {
                summary: 'Single product',
                description: 'Create a single product with JSON metadata',
                value: {
                  name: 'Smart Watch Pro',
                  description: 'Advanced smartwatch with health monitoring',
                  price: 299.99,
                  sku: 'SWP-001',
                  category_id: 101,
                  metadata: {
                    brand: 'TechCorp',
                    features: ['heart-rate', 'gps', 'waterproof'],
                    warranty: '2 years',
                  },
                  tags: ['electronics', 'wearable', 'health'],
                },
              },
            },
          },
        },
        required: true,
      },
    },
  },
} as const;

/**
 * MongoDB Service OpenAPI specification
 */
export const mockMongoDBServiceSpec: OpenAPISpecification = {
  openapi: '3.0.0',
  info: {
    title: 'DreamFactory MongoDB Service',
    description: 'REST API for MongoDB operations including document CRUD, aggregation pipelines, and NoSQL queries. Automatically generated from collection schema.',
    version: '2.1.0',
    'x-dreamfactory-service': 'mongodb',
    ...baseOpenAPIInfo,
  },
  servers: [
    {
      url: '/api/v2/mongodb',
      description: 'DreamFactory MongoDB Service',
    },
  ],
  security: [
    { ApiKeyHeader: [] },
    { SessionTokenHeader: [] },
  ],
  tags: [
    {
      name: 'customers',
      description: 'Customer document operations',
    },
    {
      name: 'transactions',
      description: 'Transaction document operations',
    },
    {
      name: 'analytics',
      description: 'Analytics and aggregation operations',
    },
  ],
  paths: {
    '/': {
      get: {
        summary: 'Get available MongoDB collections',
        description: 'Returns a list of available collections and operations.',
        operationId: 'getMongoDBResources',
        responses: {
          '200': { $ref: '#/components/responses/ResourceList' },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'GET',
        'x-dreamfactory-cache': true,
      },
    },
    '/customers': {
      get: {
        summary: 'Get customers',
        description: 'Retrieve customer documents with MongoDB query support.',
        operationId: 'getCustomers',
        tags: ['customers'],
        parameters: [
          { $ref: '#/components/parameters/LimitParam' },
          { $ref: '#/components/parameters/OffsetParam' },
          { $ref: '#/components/parameters/FilterParam' },
          { $ref: '#/components/parameters/OrderParam' },
          { $ref: '#/components/parameters/FieldsParam' },
          {
            name: 'query',
            in: 'query',
            description: 'MongoDB query in JSON format',
            required: false,
            schema: { type: 'string' },
            example: '{"status": "active", "age": {"$gte": 18}}',
          },
        ],
        responses: {
          '200': { $ref: '#/components/responses/CustomerList' },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'GET',
        'x-dreamfactory-table': 'customers',
        'x-dreamfactory-cache': true,
      },
      post: {
        summary: 'Create customers',
        description: 'Create one or more customer documents.',
        operationId: 'createCustomers',
        tags: ['customers'],
        requestBody: { $ref: '#/components/requestBodies/CustomerRequest' },
        responses: {
          '201': { $ref: '#/components/responses/CustomerList' },
          '400': { $ref: '#/components/responses/Error' },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'POST',
        'x-dreamfactory-table': 'customers',
      },
    },
    '/customers/_aggregate': {
      post: {
        summary: 'Aggregate customers',
        description: 'Perform MongoDB aggregation pipeline operations on customer data.',
        operationId: 'aggregateCustomers',
        tags: ['customers', 'analytics'],
        requestBody: {
          description: 'MongoDB aggregation pipeline',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  pipeline: {
                    type: 'array',
                    items: { type: 'object' },
                    description: 'MongoDB aggregation pipeline stages',
                    example: [
                      { $match: { status: 'active' } },
                      { $group: { _id: '$country', total: { $sum: 1 } } },
                      { $sort: { total: -1 } },
                    ],
                  },
                },
                required: ['pipeline'],
              },
            },
          },
          required: true,
        },
        responses: {
          '200': {
            description: 'Aggregation Results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    resource: {
                      type: 'array',
                      items: { type: 'object' },
                      description: 'Aggregation results',
                    },
                  },
                },
              },
            },
          },
          default: { $ref: '#/components/responses/Error' },
        },
        'x-dreamfactory-verb': 'POST',
        'x-dreamfactory-table': 'customers',
      },
    },
  },
  components: {
    securitySchemes: commonSecuritySchemes,
    parameters: commonComponents.parameters,
    responses: {
      ...commonComponents.responses,
      CustomerList: {
        description: 'Customer List',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                resource: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Customer' },
                },
                meta: {
                  $ref: '#/components/schemas/PaginatedResponse/properties/meta',
                },
              },
            },
          },
        },
      },
    },
    schemas: {
      ...commonResponseSchemas,
      Customer: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'MongoDB Object ID',
            example: '507f1f77bcf86cd799439011',
            'x-dreamfactory-type': 'objectid',
          },
          customerId: {
            type: 'string',
            description: 'Customer ID',
            example: 'CUST-001',
            maxLength: 50,
          },
          name: {
            type: 'object',
            properties: {
              first: {
                type: 'string',
                description: 'First name',
                example: 'John',
                maxLength: 50,
              },
              last: {
                type: 'string',
                description: 'Last name',
                example: 'Doe',
                maxLength: 50,
              },
              middle: {
                type: 'string',
                description: 'Middle name',
                example: 'William',
                maxLength: 50,
              },
            },
            required: ['first', 'last'],
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Customer email address',
            example: 'john.doe@example.com',
          },
          phone: {
            type: 'object',
            properties: {
              primary: {
                type: 'string',
                description: 'Primary phone number',
                example: '+1-555-123-4567',
              },
              mobile: {
                type: 'string',
                description: 'Mobile phone number',
                example: '+1-555-987-6543',
              },
            },
          },
          address: {
            type: 'object',
            properties: {
              street: {
                type: 'string',
                description: 'Street address',
                example: '123 Main St',
              },
              city: {
                type: 'string',
                description: 'City',
                example: 'Anytown',
              },
              state: {
                type: 'string',
                description: 'State or province',
                example: 'CA',
              },
              zipCode: {
                type: 'string',
                description: 'ZIP or postal code',
                example: '12345',
              },
              country: {
                type: 'string',
                description: 'Country',
                example: 'USA',
              },
            },
            required: ['street', 'city', 'country'],
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'suspended'],
            description: 'Customer status',
            example: 'active',
            default: 'active',
          },
          preferences: {
            type: 'object',
            properties: {
              newsletter: {
                type: 'boolean',
                description: 'Newsletter subscription preference',
                example: true,
              },
              notifications: {
                type: 'object',
                properties: {
                  email: { type: 'boolean', example: true },
                  sms: { type: 'boolean', example: false },
                  push: { type: 'boolean', example: true },
                },
              },
              language: {
                type: 'string',
                description: 'Preferred language',
                example: 'en',
              },
            },
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Customer tags',
            example: ['vip', 'corporate', 'loyalty-member'],
          },
          metadata: {
            type: 'object',
            description: 'Additional customer metadata',
            additionalProperties: true,
            example: {
              source: 'website',
              campaign: 'summer2024',
              tier: 'gold',
            },
          },
          createdDate: {
            type: 'string',
            format: 'date-time',
            description: 'Customer creation date',
            example: '2024-01-15T10:30:00Z',
          },
          lastModifiedDate: {
            type: 'string',
            format: 'date-time',
            description: 'Last modification date',
            example: '2024-01-20T14:45:00Z',
          },
        },
        required: ['customerId', 'name', 'email', 'status'],
      },
      Transaction: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'MongoDB Object ID',
            example: '507f1f77bcf86cd799439012',
            'x-dreamfactory-type': 'objectid',
          },
          transactionId: {
            type: 'string',
            description: 'Transaction ID',
            example: 'TXN-2024-001',
            maxLength: 50,
          },
          customerId: {
            type: 'string',
            description: 'Customer ID',
            example: 'CUST-001',
            'x-dreamfactory-relationship': 'belongs_to',
          },
          amount: {
            type: 'number',
            format: 'decimal',
            description: 'Transaction amount',
            example: 99.99,
          },
          currency: {
            type: 'string',
            description: 'Currency code',
            example: 'USD',
            maxLength: 3,
          },
          type: {
            type: 'string',
            enum: ['purchase', 'refund', 'credit', 'debit'],
            description: 'Transaction type',
            example: 'purchase',
          },
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'failed', 'cancelled'],
            description: 'Transaction status',
            example: 'completed',
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string', example: 'PROD-001' },
                name: { type: 'string', example: 'Wireless Headphones' },
                quantity: { type: 'integer', example: 1 },
                price: { type: 'number', example: 99.99 },
              },
            },
            description: 'Transaction items',
          },
          paymentMethod: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer'],
                example: 'credit_card',
              },
              last4: {
                type: 'string',
                description: 'Last 4 digits of payment method',
                example: '1234',
              },
            },
          },
          createdDate: {
            type: 'string',
            format: 'date-time',
            description: 'Transaction creation date',
            example: '2024-01-15T10:30:00Z',
          },
        },
        required: ['transactionId', 'customerId', 'amount', 'currency', 'type', 'status'],
      },
    },
    requestBodies: {
      CustomerRequest: {
        description: 'Customer Request',
        content: {
          'application/json': {
            schema: {
              oneOf: [
                { $ref: '#/components/schemas/Customer' },
                {
                  type: 'object',
                  properties: {
                    resource: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Customer' },
                    },
                  },
                },
              ],
            },
            examples: {
              singleCustomer: {
                summary: 'Single customer',
                description: 'Create a single customer document',
                value: {
                  customerId: 'CUST-002',
                  name: {
                    first: 'Jane',
                    last: 'Smith',
                  },
                  email: 'jane.smith@example.com',
                  phone: {
                    primary: '+1-555-555-5555',
                  },
                  address: {
                    street: '456 Oak Ave',
                    city: 'Springfield',
                    state: 'IL',
                    zipCode: '62701',
                    country: 'USA',
                  },
                  status: 'active',
                  preferences: {
                    newsletter: true,
                    notifications: {
                      email: true,
                      sms: false,
                      push: true,
                    },
                  },
                  tags: ['new-customer'],
                },
              },
            },
          },
        },
        required: true,
      },
    },
  },
} as const;

// ============================================================================
// API Documentation Row Data
// ============================================================================

/**
 * Mock API documentation row data for service listings
 */
export const mockApiDocsRowData: ApiDocsRowData[] = [
  {
    name: 'email',
    label: 'Email Service',
    description: 'Send emails using templates or custom content with attachment support',
    group: 'Communication',
    type: 'email',
    endpoint: '/api/v2/email',
    method: 'POST',
    lastModified: '2024-01-20T14:45:00Z',
    version: '2.1.0',
    deprecated: false,
    parameters: [
      {
        name: 'template',
        type: 'string',
        required: false,
        description: 'Optional template name to base email on',
        example: 'welcome-email',
      },
      {
        name: 'template_id',
        type: 'integer',
        required: false,
        description: 'Optional template id to base email on',
        example: 123,
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: 'Email sent successfully',
        contentType: 'application/json',
        example: { count: 1, success: true },
      },
      {
        statusCode: 400,
        description: 'Bad request - missing required fields',
        contentType: 'application/json',
        example: { error: { code: 400, message: 'Missing required field: to' } },
      },
    ],
    examples: [
      {
        title: 'Send Simple Email',
        description: 'Send a basic email with text content',
        request: {
          method: 'POST',
          url: '/api/v2/email',
          headers: {
            'Content-Type': 'application/json',
            'X-DreamFactory-Api-Key': 'your-api-key',
          },
          body: {
            to: [{ email: 'user@example.com', name: 'Test User' }],
            subject: 'Test Email',
            bodyText: 'This is a test email.',
            fromName: 'DreamFactory',
            fromEmail: 'test@dreamfactory.com',
          },
        },
        response: {
          statusCode: 200,
          body: { count: 1, success: true },
        },
      },
    ],
  },
  {
    name: 'mysql_db',
    label: 'MySQL Database',
    description: 'MySQL database service with full CRUD operations and schema introspection',
    group: 'Database',
    type: 'mysql',
    endpoint: '/api/v2/mysql_db',
    method: 'GET',
    lastModified: '2024-01-20T14:45:00Z',
    version: '2.1.0',
    deprecated: false,
    parameters: [
      {
        name: 'limit',
        type: 'integer',
        required: false,
        description: 'Number of records to return',
        defaultValue: 25,
        constraints: { minimum: 1, maximum: 1000 },
      },
      {
        name: 'filter',
        type: 'string',
        required: false,
        description: 'SQL-like where clause for filtering records',
        example: 'name like "John%"',
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: 'List of database resources',
        contentType: 'application/json',
        example: { resource: ['users', 'posts', 'comments'] },
      },
    ],
    examples: [
      {
        title: 'Get Users',
        description: 'Retrieve user records with pagination',
        request: {
          method: 'GET',
          url: '/api/v2/mysql_db/users?limit=10&offset=0',
          headers: {
            'X-DreamFactory-Api-Key': 'your-api-key',
          },
        },
        response: {
          statusCode: 200,
          body: {
            resource: [
              {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                created_date: '2024-01-15T10:30:00Z',
              },
            ],
            meta: { count: 1, total: 150 },
          },
        },
      },
    ],
  },
  {
    name: 'postgres_db',
    label: 'PostgreSQL Database',
    description: 'PostgreSQL database service with JSON support and advanced query capabilities',
    group: 'Database',
    type: 'postgresql',
    endpoint: '/api/v2/postgres_db',
    method: 'GET',
    lastModified: '2024-01-20T14:45:00Z',
    version: '2.1.0',
    deprecated: false,
    parameters: [
      {
        name: 'search',
        type: 'string',
        required: false,
        description: 'Full-text search query',
        example: 'wireless headphones',
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: 'List of database resources',
        contentType: 'application/json',
        example: { resource: ['products', 'categories', 'orders'] },
      },
    ],
    examples: [
      {
        title: 'Search Products',
        description: 'Search products using full-text search',
        request: {
          method: 'GET',
          url: '/api/v2/postgres_db/products?search=wireless%20headphones',
          headers: {
            'X-DreamFactory-Api-Key': 'your-api-key',
          },
        },
        response: {
          statusCode: 200,
          body: {
            resource: [
              {
                id: 789,
                name: 'Wireless Bluetooth Headphones',
                price: 199.99,
                metadata: { brand: 'AudioTech', features: ['noise-cancellation'] },
              },
            ],
          },
        },
      },
    ],
  },
  {
    name: 'mongodb',
    label: 'MongoDB Service',
    description: 'MongoDB NoSQL database service with document operations and aggregation pipelines',
    group: 'Database',
    type: 'mongodb',
    endpoint: '/api/v2/mongodb',
    method: 'GET',
    lastModified: '2024-01-20T14:45:00Z',
    version: '2.1.0',
    deprecated: false,
    parameters: [
      {
        name: 'query',
        type: 'string',
        required: false,
        description: 'MongoDB query in JSON format',
        example: '{"status": "active", "age": {"$gte": 18}}',
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: 'List of MongoDB collections',
        contentType: 'application/json',
        example: { resource: ['customers', 'transactions', 'analytics'] },
      },
    ],
    examples: [
      {
        title: 'Query Customers',
        description: 'Find active customers using MongoDB query syntax',
        request: {
          method: 'GET',
          url: '/api/v2/mongodb/customers?query={"status":"active"}',
          headers: {
            'X-DreamFactory-Api-Key': 'your-api-key',
          },
        },
        response: {
          statusCode: 200,
          body: {
            resource: [
              {
                _id: '507f1f77bcf86cd799439011',
                customerId: 'CUST-001',
                name: { first: 'John', last: 'Doe' },
                status: 'active',
              },
            ],
          },
        },
      },
    ],
  },
] as const;

// ============================================================================
// Service Information Mock Data
// ============================================================================

/**
 * Mock service information for comprehensive service testing
 */
export const mockServiceInfo: ServiceInfo[] = [
  {
    id: 1,
    name: 'email',
    label: 'Email Service',
    description: 'Email service used for sending user invites, password reset confirmations, and general email communications',
    type: 'email',
    isActive: true,
    mutable: true,
    deletable: true,
    createdDate: '2024-01-10T09:00:00Z',
    lastModifiedDate: '2024-01-20T14:45:00Z',
    config: {
      host: 'smtp.dreamfactory.com',
      port: 587,
      encryption: 'tls',
      from_name: 'DreamFactory',
      from_email: 'support@dreamfactory.com',
      generateDocs: true,
      includeExamples: true,
      authenticationRequired: true,
    },
    apiDocumentation: {
      hasDocumentation: true,
      documentationUrl: '/docs/email',
      swaggerUrl: '/api/v2/email/_schema',
      lastGenerated: '2024-01-20T14:45:00Z',
      version: '2.1.0',
      endpointCount: 3,
    },
    openApiSpec: mockEmailServiceSpec,
    endpoints: [
      {
        path: '/',
        method: 'GET',
        operationId: 'getEmailResources',
        summary: 'Get available email resources',
        tags: ['email'],
        authenticated: true,
      },
      {
        path: '/',
        method: 'POST',
        operationId: 'sendEmail',
        summary: 'Send an email',
        tags: ['email'],
        authenticated: true,
      },
      {
        path: '/templates',
        method: 'GET',
        operationId: 'getEmailTemplates',
        summary: 'Get email templates',
        tags: ['email'],
        authenticated: true,
      },
    ],
    health: {
      status: 'healthy',
      lastChecked: '2024-01-20T15:00:00Z',
      responseTime: 150,
      uptime: 99.95,
      errorRate: 0.002,
      details: {
        smtp_connection: 'connected',
        template_cache: 'warm',
        queue_size: 0,
      },
    },
  },
  {
    id: 2,
    name: 'mysql_db',
    label: 'MySQL Database',
    description: 'MySQL database service providing REST API access to relational data with full CRUD operations',
    type: 'mysql',
    isActive: true,
    mutable: true,
    deletable: false,
    createdDate: '2024-01-08T08:30:00Z',
    lastModifiedDate: '2024-01-20T14:45:00Z',
    config: {
      host: 'mysql.dreamfactory.local',
      port: 3306,
      database: 'production_db',
      username: 'df_user',
      generateDocs: true,
      includeExamples: true,
      authenticationRequired: true,
      corsEnabled: true,
      cacheEnabled: true,
      rateLimitEnabled: false,
    },
    apiDocumentation: {
      hasDocumentation: true,
      documentationUrl: '/docs/mysql_db',
      swaggerUrl: '/api/v2/mysql_db/_schema',
      lastGenerated: '2024-01-20T14:45:00Z',
      version: '2.1.0',
      endpointCount: 24,
    },
    openApiSpec: mockMySQLServiceSpec,
    endpoints: [
      {
        path: '/',
        method: 'GET',
        operationId: 'getDatabaseResources',
        summary: 'Get database resources',
        tags: ['database'],
        authenticated: true,
      },
      {
        path: '/users',
        method: 'GET',
        operationId: 'getUsers',
        summary: 'Get users',
        tags: ['users'],
        authenticated: true,
      },
      {
        path: '/users',
        method: 'POST',
        operationId: 'createUsers',
        summary: 'Create users',
        tags: ['users'],
        authenticated: true,
      },
      {
        path: '/posts',
        method: 'GET',
        operationId: 'getPosts',
        summary: 'Get posts',
        tags: ['posts'],
        authenticated: true,
      },
    ],
    health: {
      status: 'healthy',
      lastChecked: '2024-01-20T15:00:00Z',
      responseTime: 85,
      uptime: 99.98,
      errorRate: 0.001,
      details: {
        connection_pool: 'healthy',
        active_connections: 15,
        max_connections: 100,
        query_cache_hit_ratio: 0.95,
      },
    },
  },
  {
    id: 3,
    name: 'postgres_db',
    label: 'PostgreSQL Database',
    description: 'PostgreSQL database service with advanced features including JSON support and full-text search',
    type: 'postgresql',
    isActive: true,
    mutable: true,
    deletable: false,
    createdDate: '2024-01-12T11:15:00Z',
    lastModifiedDate: '2024-01-20T14:45:00Z',
    config: {
      host: 'postgres.dreamfactory.local',
      port: 5432,
      database: 'ecommerce_db',
      username: 'df_user',
      generateDocs: true,
      includeExamples: true,
      authenticationRequired: true,
      corsEnabled: true,
      cacheEnabled: true,
    },
    apiDocumentation: {
      hasDocumentation: true,
      documentationUrl: '/docs/postgres_db',
      swaggerUrl: '/api/v2/postgres_db/_schema',
      lastGenerated: '2024-01-20T14:45:00Z',
      version: '2.1.0',
      endpointCount: 18,
    },
    openApiSpec: mockPostgreSQLServiceSpec,
    endpoints: [
      {
        path: '/',
        method: 'GET',
        operationId: 'getPostgreSQLResources',
        summary: 'Get PostgreSQL resources',
        tags: ['database'],
        authenticated: true,
      },
      {
        path: '/products',
        method: 'GET',
        operationId: 'getProducts',
        summary: 'Get products',
        tags: ['products'],
        authenticated: true,
      },
      {
        path: '/products',
        method: 'POST',
        operationId: 'createProducts',
        summary: 'Create products',
        tags: ['products'],
        authenticated: true,
      },
    ],
    health: {
      status: 'healthy',
      lastChecked: '2024-01-20T15:00:00Z',
      responseTime: 95,
      uptime: 99.97,
      errorRate: 0.003,
      details: {
        connection_pool: 'healthy',
        active_connections: 8,
        max_connections: 50,
        index_usage: 'optimal',
      },
    },
  },
  {
    id: 4,
    name: 'mongodb',
    label: 'MongoDB Service',
    description: 'MongoDB NoSQL database service providing flexible document-based data storage with aggregation capabilities',
    type: 'mongodb',
    isActive: true,
    mutable: true,
    deletable: false,
    createdDate: '2024-01-14T13:20:00Z',
    lastModifiedDate: '2024-01-20T14:45:00Z',
    config: {
      host: 'mongodb.dreamfactory.local',
      port: 27017,
      database: 'analytics_db',
      username: 'df_user',
      generateDocs: true,
      includeExamples: true,
      authenticationRequired: true,
      corsEnabled: true,
      cacheEnabled: false,
    },
    apiDocumentation: {
      hasDocumentation: true,
      documentationUrl: '/docs/mongodb',
      swaggerUrl: '/api/v2/mongodb/_schema',
      lastGenerated: '2024-01-20T14:45:00Z',
      version: '2.1.0',
      endpointCount: 12,
    },
    openApiSpec: mockMongoDBServiceSpec,
    endpoints: [
      {
        path: '/',
        method: 'GET',
        operationId: 'getMongoDBResources',
        summary: 'Get MongoDB collections',
        tags: ['database'],
        authenticated: true,
      },
      {
        path: '/customers',
        method: 'GET',
        operationId: 'getCustomers',
        summary: 'Get customers',
        tags: ['customers'],
        authenticated: true,
      },
      {
        path: '/customers/_aggregate',
        method: 'POST',
        operationId: 'aggregateCustomers',
        summary: 'Aggregate customers',
        tags: ['customers', 'analytics'],
        authenticated: true,
      },
    ],
    health: {
      status: 'healthy',
      lastChecked: '2024-01-20T15:00:00Z',
      responseTime: 120,
      uptime: 99.93,
      errorRate: 0.005,
      details: {
        replica_set: 'healthy',
        active_connections: 25,
        oplog_window: '24 hours',
        cache_usage: '75%',
      },
    },
  },
] as const;

// ============================================================================
// API Key Management Mock Data
// ============================================================================

/**
 * Mock API key information for testing key management functionality
 */
export const mockApiKeyInfo: ApiKeyInfo[] = [
  {
    id: 'api_key_1',
    name: 'Development API Key',
    key: 'df_dev_abc123def456ghi789jkl012mno345',
    sessionToken: 'session_token_dev_xyz789abc123def456',
    createdAt: '2024-01-15T10:30:00Z',
    expiresAt: '2024-07-15T10:30:00Z',
    permissions: [
      {
        resource: 'email/*',
        actions: ['GET', 'POST'],
      },
      {
        resource: 'mysql_db/*',
        actions: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      },
    ],
    isActive: true,
    lastUsed: '2024-01-20T14:00:00Z',
    usageCount: 1543,
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 3600,
      requestsPerDay: 86400,
      burstLimit: 100,
    },
  },
  {
    id: 'api_key_2',
    name: 'Production API Key',
    key: 'df_prod_pqr789stu012vwx345yza678bcd901',
    createdAt: '2024-01-10T08:00:00Z',
    permissions: [
      {
        resource: 'postgres_db/products',
        actions: ['GET'],
        filters: { status: 'active' },
      },
      {
        resource: 'mongodb/customers',
        actions: ['GET', 'POST', 'PUT'],
      },
    ],
    isActive: true,
    lastUsed: '2024-01-20T15:45:00Z',
    usageCount: 8750,
    rateLimit: {
      requestsPerMinute: 120,
      requestsPerHour: 7200,
      requestsPerDay: 172800,
    },
  },
  {
    id: 'api_key_3',
    name: 'Testing API Key',
    key: 'df_test_efg456hij789klm012nop345qrs678',
    createdAt: '2024-01-18T16:20:00Z',
    expiresAt: '2024-02-18T16:20:00Z',
    permissions: [
      {
        resource: 'email/templates',
        actions: ['GET'],
      },
    ],
    isActive: false,
    lastUsed: '2024-01-19T10:15:00Z',
    usageCount: 25,
    rateLimit: {
      requestsPerMinute: 10,
      requestsPerHour: 600,
      requestsPerDay: 14400,
    },
  },
] as const;

// ============================================================================
// Swagger UI Configuration Mock Data
// ============================================================================

/**
 * Mock Swagger UI configurations for different testing scenarios
 */
export const mockSwaggerUIConfigs: Record<string, SwaggerUIConfig> = {
  default: {
    layout: 'BaseLayout',
    deepLinking: true,
    displayOperationId: false,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    defaultModelRendering: 'example',
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: false,
    showCommonExtensions: false,
    tryItOutEnabled: true,
    persistAuthorization: true,
    'x-dreamfactory-baseUrl': 'https://demo.dreamfactory.com',
    'x-dreamfactory-apiKey': 'your-api-key-here',
  },
  email: {
    spec: mockEmailServiceSpec,
    layout: 'BaseLayout',
    deepLinking: true,
    tryItOutEnabled: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 2,
    'x-dreamfactory-service': 'email',
    'x-dreamfactory-baseUrl': 'https://demo.dreamfactory.com',
    'x-dreamfactory-apiKey': 'df_dev_abc123def456ghi789jkl012mno345',
    customStyles: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
    `,
    requestInterceptor: (request: any) => {
      request.headers['X-DreamFactory-Api-Key'] = 'df_dev_abc123def456ghi789jkl012mno345';
      return request;
    },
  },
  mysql: {
    spec: mockMySQLServiceSpec,
    layout: 'BaseLayout',
    deepLinking: true,
    tryItOutEnabled: true,
    docExpansion: 'none',
    defaultModelsExpandDepth: 1,
    operationsSorter: 'method',
    tagsSorter: 'alpha',
    'x-dreamfactory-service': 'mysql_db',
    'x-dreamfactory-baseUrl': 'https://demo.dreamfactory.com',
    'x-dreamfactory-apiKey': 'df_dev_abc123def456ghi789jkl012mno345',
  },
  mongodb: {
    spec: mockMongoDBServiceSpec,
    layout: 'StandaloneLayout',
    deepLinking: true,
    tryItOutEnabled: true,
    docExpansion: 'full',
    displayOperationId: true,
    showExtensions: true,
    'x-dreamfactory-service': 'mongodb',
    'x-dreamfactory-baseUrl': 'https://demo.dreamfactory.com',
    'x-dreamfactory-apiKey': 'df_dev_abc123def456ghi789jkl012mno345',
    oauth2RedirectUrl: 'https://demo.dreamfactory.com/oauth2-redirect.html',
  },
} as const;

// ============================================================================
// Error Scenarios and Edge Cases
// ============================================================================

/**
 * Mock data for error scenarios and edge case testing
 */
export const mockErrorScenarios = {
  invalidOpenAPISpec: {
    openapi: '2.0', // Invalid version
    info: {
      title: 'Invalid Service',
      version: '1.0.0',
    },
    paths: {},
  },
  serviceNotFound: {
    error: {
      code: 404,
      message: 'Service not found',
      context: {
        service: 'nonexistent_service',
        requested_at: '2024-01-20T15:00:00Z',
      },
    },
  },
  unauthorizedAccess: {
    error: {
      code: 401,
      message: 'Unauthorized - Invalid API key',
      context: {
        provided_key: 'invalid_key_***',
        required_permissions: ['read'],
      },
    },
  },
  rateLimitExceeded: {
    error: {
      code: 429,
      message: 'Rate limit exceeded',
      context: {
        limit: 60,
        remaining: 0,
        reset_time: '2024-01-20T15:01:00Z',
      },
    },
  },
  serverError: {
    error: {
      code: 500,
      message: 'Internal server error',
      context: {
        trace_id: 'trace_abc123def456',
        timestamp: '2024-01-20T15:00:00Z',
      },
    },
  },
} as const;

/**
 * Mock data for large dataset testing (performance scenarios)
 */
export const mockLargeDatasetScenarios = {
  manyTables: Array.from({ length: 1000 }, (_, i) => ({
    name: `table_${i.toString().padStart(4, '0')}`,
    label: `Table ${i + 1}`,
    description: `Auto-generated table ${i + 1} for performance testing`,
    group: `Group ${Math.floor(i / 100) + 1}`,
    type: 'table',
    endpoint: `/api/v2/mysql_db/table_${i.toString().padStart(4, '0')}`,
    method: 'GET' as const,
    lastModified: new Date(2024, 0, 15 + (i % 30)).toISOString(),
    version: '2.1.0',
    deprecated: i > 950, // Mark last 50 as deprecated
  })),
  manyServices: Array.from({ length: 50 }, (_, i) => ({
    id: i + 100,
    name: `service_${i.toString().padStart(2, '0')}`,
    label: `Service ${i + 1}`,
    description: `Auto-generated service ${i + 1} for testing`,
    type: ['mysql', 'postgresql', 'mongodb', 'email', 'rest'][i % 5],
    isActive: i % 10 !== 9, // 90% active
    mutable: true,
    deletable: i > 40, // First 40 are not deletable
    createdDate: new Date(2024, 0, 1 + i).toISOString(),
    lastModifiedDate: new Date(2024, 0, 15 + (i % 30)).toISOString(),
    config: {},
    health: {
      status: (['healthy', 'degraded', 'unhealthy'][i % 3]) as ServiceHealthStatus['status'],
      lastChecked: new Date().toISOString(),
      responseTime: 50 + (i * 10) % 500,
      uptime: 95 + (i % 5),
      errorRate: (i % 10) / 1000,
    },
  })),
} as const;

// ============================================================================
// Testing Utilities and Helpers
// ============================================================================

/**
 * Helper functions for working with mock data in tests
 */
export const mockDataHelpers = {
  /**
   * Get a random service from the mock service list
   */
  getRandomService: (): ServiceInfo => {
    const randomIndex = Math.floor(Math.random() * mockServiceInfo.length);
    return mockServiceInfo[randomIndex];
  },

  /**
   * Get a service by name
   */
  getServiceByName: (name: string): ServiceInfo | undefined => {
    return mockServiceInfo.find(service => service.name === name);
  },

  /**
   * Get an API key by name
   */
  getApiKeyByName: (name: string): ApiKeyInfo | undefined => {
    return mockApiKeyInfo.find(key => key.name === name);
  },

  /**
   * Generate a mock OpenAPI spec for a given service type
   */
  generateMockSpec: (serviceType: string, serviceName: string): OpenAPISpecification => {
    const baseSpec = mockEmailServiceSpec;
    return {
      ...baseSpec,
      info: {
        ...baseSpec.info,
        title: `DreamFactory ${serviceType} Service`,
        'x-dreamfactory-service': serviceName,
      },
      servers: [
        {
          url: `/api/v2/${serviceName}`,
          description: `DreamFactory ${serviceType} Service`,
        },
      ],
    };
  },

  /**
   * Create a mock error response
   */
  createErrorResponse: (code: number, message: string, context?: Record<string, any>) => ({
    error: {
      code,
      message,
      context: context || {},
    },
  }),

  /**
   * Create a mock success response
   */
  createSuccessResponse: (data: any) => ({
    success: true,
    data,
  }),

  /**
   * Validate mock data against expected structure
   */
  validateMockData: {
    isValidOpenAPISpec: (spec: any): spec is OpenAPISpecification => {
      return (
        spec &&
        typeof spec.openapi === 'string' &&
        spec.openapi.startsWith('3.') &&
        spec.info &&
        typeof spec.info.title === 'string' &&
        typeof spec.info.version === 'string' &&
        spec.paths &&
        typeof spec.paths === 'object'
      );
    },
    isValidServiceInfo: (service: any): service is ServiceInfo => {
      return (
        service &&
        typeof service.id === 'number' &&
        typeof service.name === 'string' &&
        typeof service.type === 'string' &&
        typeof service.isActive === 'boolean'
      );
    },
    isValidApiKey: (key: any): key is ApiKeyInfo => {
      return (
        key &&
        typeof key.id === 'string' &&
        typeof key.name === 'string' &&
        typeof key.key === 'string' &&
        Array.isArray(key.permissions) &&
        typeof key.isActive === 'boolean'
      );
    },
  },
} as const;

// ============================================================================
// Export Collections for Easy Testing
// ============================================================================

/**
 * Comprehensive mock data collections for different testing scenarios
 */
export const mockDataCollections = {
  /**
   * All OpenAPI specifications
   */
  openApiSpecs: {
    email: mockEmailServiceSpec,
    mysql: mockMySQLServiceSpec,
    postgresql: mockPostgreSQLServiceSpec,
    mongodb: mockMongoDBServiceSpec,
  },

  /**
   * All service information
   */
  services: mockServiceInfo,

  /**
   * All API documentation data
   */
  apiDocs: mockApiDocsRowData,

  /**
   * All API keys
   */
  apiKeys: mockApiKeyInfo,

  /**
   * All Swagger UI configurations
   */
  swaggerConfigs: mockSwaggerUIConfigs,

  /**
   * Error scenarios
   */
  errors: mockErrorScenarios,

  /**
   * Large dataset scenarios
   */
  largeDatasets: mockLargeDatasetScenarios,

  /**
   * Common components and schemas
   */
  components: {
    securitySchemes: commonSecuritySchemes,
    responses: commonComponents.responses,
    parameters: commonComponents.parameters,
    schemas: commonResponseSchemas,
  },

  /**
   * Test utilities and helpers
   */
  helpers: mockDataHelpers,
} as const;

// Default export for convenience
export default mockDataCollections;

/**
 * Type exports for use in tests
 */
export type MockDataCollections = typeof mockDataCollections;
export type MockServiceType = keyof typeof mockDataCollections.openApiSpecs;
export type MockErrorType = keyof typeof mockErrorScenarios;