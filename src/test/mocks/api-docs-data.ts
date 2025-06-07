/**
 * Mock data for API documentation testing
 * Provides comprehensive OpenAPI spec mock data for Swagger UI integration testing
 * Replaces Angular test utilities with React Testing Library compatible patterns
 */

import {
  API_KEY_HEADER,
  SESSION_TOKEN_HEADER,
} from '@/lib/constants/http-headers';

/**
 * Mock OpenAPI specification data for testing API documentation components
 * Mirrors the structure of DreamFactory-generated OpenAPI specs for various service types
 */
export const mockApiDocsData = {
  openapi: '3.0.0',
  servers: [{ url: '/api/v2/email', description: 'Local Email Service' }],
  components: {
    securitySchemes: {
      BasicAuth: { type: 'http', scheme: 'basic' },
      BearerAuth: { type: 'http', scheme: 'bearer' },
      ApiKeyQuery: { type: 'apiKey', in: 'query', name: 'api_key' },
      ApiKeyHeader: {
        type: 'apiKey',
        in: 'header',
        name: API_KEY_HEADER,
      },
      SessionTokenQuery: {
        type: 'apiKey',
        in: 'query',
        name: 'session_token',
      },
      SessionTokenHeader: {
        type: 'apiKey',
        in: 'header',
        name: SESSION_TOKEN_HEADER,
      },
    },
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
    },
    schemas: {
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description:
              'True when API call was successful, false or error otherwise.',
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          code: {
            type: 'integer',
            format: 'int32',
            description: 'Error code.',
          },
          message: {
            type: 'string',
            description: 'String description of the error.',
          },
        },
      },
      ResourceList: {
        type: 'object',
        properties: {
          resource: {
            type: 'array',
            description:
              'Array of accessible resources available to this service.',
            items: { type: 'string' },
          },
        },
      },
      EmailResponse: {
        type: 'object',
        properties: {
          count: {
            type: 'integer',
            format: 'int32',
            description: 'Number of emails successfully sent.',
          },
        },
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
          },
          to: {
            type: 'array',
            description: 'Required single or multiple receiver addresses.',
            items: { $ref: '#/components/schemas/EmailAddress' },
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
          },
          fromEmail: {
            type: 'string',
            description: 'Required sender email.',
          },
          replyToName: {
            type: 'string',
            description: 'Optional reply to name.',
          },
          replyToEmail: {
            type: 'string',
            description: 'Optional reply to email.',
          },
          attachment: {
            type: 'array',
            description:
              'File(s) to import from storage service or URL for attachment',
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
            },
          },
        },
      },
      EmailAddress: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description:
              'Optional name displayed along with the email address.',
          },
          email: {
            type: 'string',
            description: 'Required email address.',
          },
        },
      },
    },
    requestBodies: {
      EmailRequest: {
        description: 'Email Request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/EmailRequest' },
          },
          'application/xml': {
            schema: { $ref: '#/components/schemas/EmailRequest' },
          },
        },
      },
    },
  },
  security: [
    { BasicAuth: [] },
    { BearerAuth: [] },
    { ApiKeyQuery: [] },
    { ApiKeyHeader: [] },
    { SessionTokenQuery: [] },
    { SessionTokenHeader: [] },
  ],
  tags: [],
  info: {
    title: 'Local Email Service',
    description:
      'Email service used for sending user invites and/or password reset confirmation.',
    version: '2.0',
  },
  paths: {
    '/': {
      post: {
        summary: 'Send an email created from posted data and/or a template.',
        description:
          "If a template is not used with all required fields, then they must be included in the request. If the 'from' address is not provisioned in the service, then it must be included in the request.",
        operationId: 'sendEmailEmail',
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
            description:
              'Import file(s) from URL for attachment. This is also available in form-data post and in json payload data.',
            schema: { type: 'string' },
            in: 'query',
          },
        ],
        requestBody: { $ref: '#/components/requestBodies/EmailRequest' },
        responses: {
          '200': { $ref: '#/components/responses/EmailResponse' },
          default: { $ref: '#/components/responses/Error' },
        },
        tags: ['email'],
      },
    },
  },
};

/**
 * Mock database service API documentation with more complex schema
 */
export const mockDatabaseApiDocsData = {
  openapi: '3.0.0',
  servers: [{ url: '/api/v2/mysql_db', description: 'MySQL Database Service' }],
  info: {
    title: 'MySQL Database Service',
    description: 'Auto-generated REST API for MySQL database operations.',
    version: '2.0',
  },
  paths: {
    '/_schema': {
      get: {
        summary: 'Retrieve database schema information',
        operationId: 'getSchemaList',
        responses: {
          '200': { $ref: '#/components/responses/SchemaResponse' },
          default: { $ref: '#/components/responses/Error' },
        },
        tags: ['schema'],
      },
    },
    '/_table/users': {
      get: {
        summary: 'Retrieve users table records',
        operationId: 'getUsersRecords',
        parameters: [
          {
            name: 'limit',
            description: 'Maximum number of records to return',
            schema: { type: 'integer', minimum: 1, maximum: 1000 },
            in: 'query',
          },
          {
            name: 'offset',
            description: 'Number of records to skip',
            schema: { type: 'integer', minimum: 0 },
            in: 'query',
          },
        ],
        responses: {
          '200': { $ref: '#/components/responses/RecordsResponse' },
          default: { $ref: '#/components/responses/Error' },
        },
        tags: ['records'],
      },
      post: {
        summary: 'Create new users table records',
        operationId: 'createUsersRecords',
        requestBody: {
          description: 'Records to create',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RecordsRequest' },
            },
          },
        },
        responses: {
          '201': { $ref: '#/components/responses/RecordsResponse' },
          default: { $ref: '#/components/responses/Error' },
        },
        tags: ['records'],
      },
    },
  },
  components: {
    schemas: {
      SchemaResponse: {
        type: 'object',
        properties: {
          resource: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of available tables',
          },
        },
      },
      RecordsResponse: {
        type: 'object',
        properties: {
          resource: {
            type: 'array',
            items: { type: 'object' },
            description: 'Array of database records',
          },
          meta: {
            type: 'object',
            properties: {
              count: { type: 'integer' },
              total: { type: 'integer' },
            },
          },
        },
      },
      RecordsRequest: {
        type: 'object',
        properties: {
          resource: {
            type: 'array',
            items: { type: 'object' },
            description: 'Array of records to create or update',
          },
        },
      },
    },
    responses: {
      SchemaResponse: {
        description: 'Database schema information',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SchemaResponse' },
          },
        },
      },
      RecordsResponse: {
        description: 'Database records response',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RecordsResponse' },
          },
        },
      },
      Error: {
        description: 'Error Response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'integer' },
                    message: { type: 'string' },
                    status_code: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    securitySchemes: {
      ApiKeyHeader: {
        type: 'apiKey',
        in: 'header',
        name: API_KEY_HEADER,
      },
      SessionTokenHeader: {
        type: 'apiKey',
        in: 'header',
        name: SESSION_TOKEN_HEADER,
      },
    },
  },
  security: [{ ApiKeyHeader: [] }, { SessionTokenHeader: [] }],
};

/**
 * Mock API keys data for testing API key display and copy functionality
 */
export const mockApiKeysData = [
  {
    id: 1,
    name: 'Development Key',
    key: 'dev_abc123def456ghi789',
    roleId: 1,
    serviceName: 'email',
    isActive: true,
    createdDate: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    name: 'Production Key',
    key: 'prod_xyz789uvw456rst123',
    roleId: 2,
    serviceName: 'email',
    isActive: true,
    createdDate: '2024-01-10T14:20:00Z',
  },
  {
    id: 3,
    name: 'Testing Key',
    key: 'test_mno345pqr678stu901',
    roleId: 3,
    serviceName: 'email',
    isActive: false,
    createdDate: '2024-01-05T09:15:00Z',
  },
];

/**
 * Mock service response data for testing service ID lookup
 */
export const mockServiceResponse = {
  resource: [
    {
      id: 1,
      name: 'email',
      label: 'Local Email Service',
      description: 'Email service for user notifications',
      type: 'local_email',
      isActive: true,
      config: {},
    },
  ],
  meta: {
    count: 1,
  },
};

/**
 * Factory function for creating mock OpenAPI specifications
 */
export const createMockApiSpec = (serviceName: string, serviceType: string = 'database') => {
  const baseSpec = {
    openapi: '3.0.0',
    info: {
      title: `${serviceName} Service`,
      description: `Auto-generated REST API for ${serviceName} service`,
      version: '2.0',
    },
    servers: [{ url: `/api/v2/${serviceName}`, description: `${serviceName} Service` }],
    security: [{ ApiKeyHeader: [] }, { SessionTokenHeader: [] }],
    components: {
      securitySchemes: {
        ApiKeyHeader: {
          type: 'apiKey',
          in: 'header',
          name: API_KEY_HEADER,
        },
        SessionTokenHeader: {
          type: 'apiKey',
          in: 'header',
          name: SESSION_TOKEN_HEADER,
        },
      },
    },
  };

  if (serviceType === 'database') {
    return {
      ...baseSpec,
      paths: {
        '/_schema': {
          get: {
            summary: 'Get schema information',
            operationId: 'getSchema',
            responses: {
              '200': { description: 'Schema information' },
            },
          },
        },
      },
    };
  }

  if (serviceType === 'email') {
    return {
      ...baseSpec,
      paths: {
        '/': {
          post: {
            summary: 'Send email',
            operationId: 'sendEmail',
            responses: {
              '200': { description: 'Email sent successfully' },
            },
          },
        },
      },
    };
  }

  return baseSpec;
};

/**
 * Mock error responses for testing error scenarios
 */
export const mockApiDocsErrors = {
  notFound: {
    error: {
      code: 404,
      message: 'Service not found',
      status_code: 404,
    },
  },
  unauthorized: {
    error: {
      code: 401,
      message: 'Unauthorized access',
      status_code: 401,
    },
  },
  serverError: {
    error: {
      code: 500,
      message: 'Internal server error',
      status_code: 500,
    },
  },
};