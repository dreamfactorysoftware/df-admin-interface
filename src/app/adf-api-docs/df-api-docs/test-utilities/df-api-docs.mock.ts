import {
  API_KEY_HEADER,
  SESSION_TOKEN_HEADER,
} from 'src/app/shared/constants/http-headers';

export const mockApiDocsData = {
  openapi: '3.0.0',
  servers: [{ url: '/api/v2/email', description: '' }],
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
