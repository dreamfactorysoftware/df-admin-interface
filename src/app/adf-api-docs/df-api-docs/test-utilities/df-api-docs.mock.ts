/**
 * Modern MSW-compatible mock data factory for API documentation testing
 * 
 * Migrated from Angular mock pattern to React/Next.js testing infrastructure
 * with support for Vitest, MSW, and React Query integration.
 */

import {
  API_KEY_HEADER,
  SESSION_TOKEN_HEADER,
  LICENSE_KEY_HEADER,
} from 'src/app/shared/constants/http-headers';

// TypeScript type definitions for OpenAPI specification structure
export interface OpenAPISecurityScheme {
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect';
  scheme?: string;
  in?: 'query' | 'header' | 'cookie';
  name?: string;
  description?: string;
}

export interface OpenAPIResponse {
  description: string;
  content: {
    [mediaType: string]: {
      schema: {
        $ref?: string;
        type?: string;
        properties?: Record<string, unknown>;
      };
    };
  };
}

export interface OpenAPISchema {
  type: string;
  properties?: Record<string, {
    type: string;
    format?: string;
    description?: string;
    items?: unknown;
    $ref?: string;
  }>;
  required?: string[];
}

export interface OpenAPIParameter {
  name: string;
  description?: string;
  schema: {
    type: string;
    format?: string;
  };
  in: 'query' | 'header' | 'path' | 'cookie';
  required?: boolean;
}

export interface OpenAPIOperation {
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: {
    $ref: string;
  };
  responses: {
    [statusCode: string]: {
      $ref: string;
    };
  };
  tags?: string[];
  security?: Array<Record<string, string[]>>;
}

export interface OpenAPIPath {
  [method: string]: OpenAPIOperation;
}

export interface OpenAPISpecification {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
    contact?: {
      name?: string;
      email?: string;
      url?: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: {
    [path: string]: OpenAPIPath;
  };
  components: {
    securitySchemes: {
      [name: string]: OpenAPISecurityScheme;
    };
    responses: {
      [name: string]: OpenAPIResponse;
    };
    schemas: {
      [name: string]: OpenAPISchema;
    };
    requestBodies?: {
      [name: string]: {
        description: string;
        content: {
          [mediaType: string]: {
            schema: {
              $ref: string;
            };
          };
        };
      };
    };
  };
  security: Array<Record<string, string[]>>;
  tags: string[];
}

// Configuration options for flexible test data generation
export interface MockApiDocsOptions {
  serviceName?: string;
  serviceType?: 'email' | 'database' | 'file' | 'notification';
  version?: string;
  includeAdvancedAuth?: boolean;
  includeCustomSchemas?: boolean;
  enableOptimisticUpdates?: boolean;
  cacheTimeout?: number;
}

// Default configuration for React Query integration
const DEFAULT_MOCK_OPTIONS: Required<MockApiDocsOptions> = {
  serviceName: 'Local Email Service',
  serviceType: 'email',
  version: '2.0',
  includeAdvancedAuth: false,
  includeCustomSchemas: false,
  enableOptimisticUpdates: true,
  cacheTimeout: 300000, // 5 minutes - optimized for React Query
};

/**
 * Factory function to generate OpenAPI specification mock data
 * Replaces Angular static export pattern with flexible React testing approach
 * 
 * @param options - Configuration options for customizing mock data generation
 * @returns Complete OpenAPI specification object
 */
export function createMockApiDocsData(
  options: Partial<MockApiDocsOptions> = {}
): OpenAPISpecification {
  const config = { ...DEFAULT_MOCK_OPTIONS, ...options };
  
  // Base OpenAPI structure with configurable parameters
  const mockData: OpenAPISpecification = {
    openapi: '3.0.0',
    servers: [
      { 
        url: `/api/v2/${config.serviceType}`, 
        description: config.serviceName 
      }
    ],
    info: {
      title: config.serviceName,
      description: generateServiceDescription(config.serviceType),
      version: config.version,
      contact: {
        name: 'DreamFactory Admin Interface',
        email: 'support@dreamfactory.com',
        url: 'https://dreamfactory.com'
      }
    },
    components: {
      securitySchemes: createSecuritySchemes(config),
      responses: createResponseSchemas(),
      schemas: createDataSchemas(config),
      requestBodies: createRequestBodies()
    },
    security: createSecurityRequirements(config),
    tags: [config.serviceType],
    paths: createApiPaths(config)
  };

  return mockData;
}

/**
 * Enhanced security schemes with React/Next.js authentication patterns
 */
function createSecuritySchemes(config: Required<MockApiDocsOptions>): Record<string, OpenAPISecurityScheme> {
  const baseSchemes: Record<string, OpenAPISecurityScheme> = {
    BasicAuth: { 
      type: 'http', 
      scheme: 'basic',
      description: 'HTTP Basic Authentication for development environments'
    },
    BearerAuth: { 
      type: 'http', 
      scheme: 'bearer',
      description: 'JWT Bearer token authentication for production environments'
    },
    ApiKeyQuery: { 
      type: 'apiKey', 
      in: 'query', 
      name: 'api_key',
      description: 'API key passed as query parameter'
    },
    ApiKeyHeader: {
      type: 'apiKey',
      in: 'header',
      name: API_KEY_HEADER,
      description: 'DreamFactory API key in custom header'
    },
    SessionTokenQuery: {
      type: 'apiKey',
      in: 'query',
      name: 'session_token',
      description: 'Session token as query parameter'
    },
    SessionTokenHeader: {
      type: 'apiKey',
      in: 'header',
      name: SESSION_TOKEN_HEADER,
      description: 'DreamFactory session token in custom header'
    },
  };

  // Add advanced authentication schemes for enhanced testing scenarios
  if (config.includeAdvancedAuth) {
    baseSchemes.LicenseKeyHeader = {
      type: 'apiKey',
      in: 'header',
      name: LICENSE_KEY_HEADER,
      description: 'DreamFactory license key for enterprise features'
    };
  }

  return baseSchemes;
}

/**
 * Standard response schemas for MSW integration
 */
function createResponseSchemas(): Record<string, OpenAPIResponse> {
  return {
    Success: {
      description: 'Successful operation response',
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
      description: 'Error response with detailed information',
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
      description: 'Paginated resource list response',
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
      description: 'Email service operation response',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/EmailResponse' },
        },
        'application/xml': {
          schema: { $ref: '#/components/schemas/EmailResponse' },
        },
      },
    },
  };
}

/**
 * Data schemas with enhanced type safety for React Query integration
 */
function createDataSchemas(config: Required<MockApiDocsOptions>): Record<string, OpenAPISchema> {
  const baseSchemas: Record<string, OpenAPISchema> = {
    Success: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Indicates successful API operation completion',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'ISO 8601 timestamp of the operation',
        },
      },
      required: ['success']
    },
    Error: {
      type: 'object',
      properties: {
        code: {
          type: 'integer',
          format: 'int32',
          description: 'HTTP status code or custom error code',
        },
        message: {
          type: 'string',
          description: 'Human-readable error description',
        },
        details: {
          type: 'string',
          description: 'Additional error context for debugging',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'ISO 8601 timestamp when error occurred',
        },
      },
      required: ['code', 'message']
    },
    ResourceList: {
      type: 'object',
      properties: {
        resource: {
          type: 'array',
          description: 'Array of accessible resources for this service',
          items: { type: 'string' },
        },
        meta: {
          type: 'object',
          description: 'Pagination and metadata information',
        },
      },
      required: ['resource']
    },
    EmailResponse: {
      type: 'object',
      properties: {
        count: {
          type: 'integer',
          format: 'int32',
          description: 'Number of emails successfully processed',
        },
        failed: {
          type: 'array',
          description: 'List of failed email addresses with reasons',
          items: { type: 'object' },
        },
        messageId: {
          type: 'string',
          description: 'Unique identifier for tracking purposes',
        },
      },
      required: ['count']
    },
    EmailRequest: {
      type: 'object',
      properties: {
        template: {
          type: 'string',
          description: 'Email template identifier for consistent formatting',
        },
        templateId: {
          type: 'integer',
          format: 'int32',
          description: 'Numeric template ID as alternative to name',
        },
        to: {
          type: 'array',
          description: 'Primary recipient email addresses (required)',
          items: { $ref: '#/components/schemas/EmailAddress' },
        },
        cc: {
          type: 'array',
          description: 'Carbon copy recipient addresses (optional)',
          items: { $ref: '#/components/schemas/EmailAddress' },
        },
        bcc: {
          type: 'array',
          description: 'Blind carbon copy recipients (optional)',
          items: { $ref: '#/components/schemas/EmailAddress' },
        },
        subject: {
          type: 'string',
          description: 'Plain text email subject line',
        },
        bodyText: {
          type: 'string',
          description: 'Plain text version of email content',
        },
        bodyHtml: {
          type: 'string',
          description: 'HTML formatted email content',
        },
        fromName: {
          type: 'string',
          description: 'Display name for the sender',
        },
        fromEmail: {
          type: 'string',
          description: 'Sender email address (must be authorized)',
        },
        replyToName: {
          type: 'string',
          description: 'Display name for reply-to address',
        },
        replyToEmail: {
          type: 'string',
          description: 'Email address for recipient replies',
        },
        attachment: {
          type: 'array',
          description: 'File attachments from storage services or URLs',
          items: {
            type: 'object',
            properties: {
              service: {
                type: 'string',
                description: 'DreamFactory storage service identifier',
              },
              path: {
                type: 'string',
                description: 'File path relative to the storage service root',
              },
            },
          },
        },
      },
      required: ['to', 'subject']
    },
    EmailAddress: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Display name accompanying the email address',
        },
        email: {
          type: 'string',
          description: 'Valid email address (RFC 5322 compliant)',
        },
      },
      required: ['email']
    },
  };

  // Add custom schemas for comprehensive testing scenarios
  if (config.includeCustomSchemas) {
    baseSchemas.DatabaseConnection = {
      type: 'object',
      properties: {
        id: { type: 'integer', description: 'Unique connection identifier' },
        name: { type: 'string', description: 'Human-readable connection name' },
        type: { type: 'string', description: 'Database type (mysql, postgresql, etc.)' },
        config: { type: 'object', description: 'Database-specific configuration' },
      },
      required: ['name', 'type']
    };
  }

  return baseSchemas;
}

/**
 * Request body definitions for API operations
 */
function createRequestBodies(): Record<string, unknown> {
  return {
    EmailRequest: {
      description: 'Email composition and delivery request',
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
    },
  };
}

/**
 * Security requirements configuration
 */
function createSecurityRequirements(config: Required<MockApiDocsOptions>): Array<Record<string, string[]>> {
  const baseRequirements = [
    { BasicAuth: [] },
    { BearerAuth: [] },
    { ApiKeyQuery: [] },
    { ApiKeyHeader: [] },
    { SessionTokenQuery: [] },
    { SessionTokenHeader: [] },
  ];

  if (config.includeAdvancedAuth) {
    baseRequirements.push({ LicenseKeyHeader: [] });
  }

  return baseRequirements;
}

/**
 * API paths configuration based on service type
 */
function createApiPaths(config: Required<MockApiDocsOptions>): Record<string, OpenAPIPath> {
  return {
    '/': {
      post: {
        summary: `Send ${config.serviceType} using configuration and/or template`,
        description: generateOperationDescription(config.serviceType),
        operationId: `send${capitalizeFirst(config.serviceType)}`,
        parameters: [
          {
            name: 'template',
            description: 'Optional template identifier for consistent formatting',
            schema: { type: 'string' },
            in: 'query',
          },
          {
            name: 'template_id',
            description: 'Optional numeric template identifier',
            schema: { type: 'integer', format: 'int32' },
            in: 'query',
          },
          {
            name: 'attachment',
            description: 'Import file attachments from URL or storage service',
            schema: { type: 'string' },
            in: 'query',
          },
        ],
        requestBody: { $ref: '#/components/requestBodies/EmailRequest' },
        responses: {
          '200': { $ref: '#/components/responses/EmailResponse' },
          '400': { $ref: '#/components/responses/Error' },
          '401': { $ref: '#/components/responses/Error' },
          '403': { $ref: '#/components/responses/Error' },
          '500': { $ref: '#/components/responses/Error' },
          default: { $ref: '#/components/responses/Error' },
        },
        tags: [config.serviceType],
      },
      get: {
        summary: `List available ${config.serviceType} resources`,
        description: `Retrieve accessible resources and configuration for ${config.serviceType} service`,
        operationId: `list${capitalizeFirst(config.serviceType)}Resources`,
        responses: {
          '200': { $ref: '#/components/responses/ResourceList' },
          '401': { $ref: '#/components/responses/Error' },
          '403': { $ref: '#/components/responses/Error' },
          default: { $ref: '#/components/responses/Error' },
        },
        tags: [config.serviceType],
      },
    },
  };
}

/**
 * Utility functions for dynamic content generation
 */
function generateServiceDescription(serviceType: string): string {
  const descriptions = {
    email: 'Email service for user invitations, notifications, and password reset confirmations with template support.',
    database: 'Database service providing CRUD operations with automatic REST API generation and schema discovery.',
    file: 'File storage service with upload, download, and management capabilities across multiple storage providers.',
    notification: 'Push notification service supporting multiple platforms and delivery channels.',
  };
  
  return descriptions[serviceType as keyof typeof descriptions] || 
         `${capitalizeFirst(serviceType)} service for DreamFactory API operations.`;
}

function generateOperationDescription(serviceType: string): string {
  const descriptions = {
    email: "Send email using posted data and/or template. If template is not used with all required fields, they must be included in the request. If 'from' address is not provisioned, it must be included.",
    database: 'Execute database operations with automatic validation and relationship handling.',
    file: 'Upload, download, or manipulate files with automatic metadata extraction.',
    notification: 'Send push notifications to specified devices or user groups.',
  };
  
  return descriptions[serviceType as keyof typeof descriptions] || 
         `Execute ${serviceType} operations with the provided configuration.`;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * OpenAPI specification validation functions for testing compliance
 */
export function validateOpenAPISpecification(spec: OpenAPISpecification): boolean {
  try {
    // Required top-level properties
    if (!spec.openapi || !spec.info || !spec.paths) {
      return false;
    }

    // Info object validation
    if (!spec.info.title || !spec.info.version) {
      return false;
    }

    // Paths validation
    if (typeof spec.paths !== 'object' || Object.keys(spec.paths).length === 0) {
      return false;
    }

    // Components validation (if present)
    if (spec.components) {
      if (spec.components.schemas) {
        for (const [schemaName, schema] of Object.entries(spec.components.schemas)) {
          if (!schema.type) {
            console.warn(`Schema ${schemaName} missing type property`);
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('OpenAPI validation error:', error);
    return false;
  }
}

/**
 * MSW request handlers factory for React Query integration
 * Optimized for Vitest testing environment performance
 */
export function createMSWHandlers(options: Partial<MockApiDocsOptions> = []) {
  const mockData = createMockApiDocsData(options);
  const config = { ...DEFAULT_MOCK_OPTIONS, ...options };
  
  // Return handlers configuration for MSW setup
  return {
    mockData,
    baseUrl: `/api/v2/${config.serviceType}`,
    cacheKey: ['api-docs', config.serviceType, config.version],
    enableOptimisticUpdates: config.enableOptimisticUpdates,
    cacheTimeout: config.cacheTimeout,
  };
}

/**
 * React Query cache key generator for consistent testing
 */
export function generateApiDocsCacheKey(
  serviceType: string, 
  version: string = '2.0'
): string[] {
  return ['api-docs', serviceType, version];
}

// Backward compatibility export for existing tests
export const mockApiDocsData = createMockApiDocsData();

// Named exports for flexible testing patterns
export { createMockApiDocsData as createApiDocsMock };
export { DEFAULT_MOCK_OPTIONS as defaultMockConfig };