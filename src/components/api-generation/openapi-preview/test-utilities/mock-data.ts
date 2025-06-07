/**
 * @fileoverview Comprehensive mock data and fixtures for OpenAPI preview testing
 * @description OpenAPI v3.0.0 specifications, service definitions, security schemes, and component schemas
 * 
 * Provides realistic test data for unit tests, integration tests, and MSW handlers with type-safe
 * interfaces derived from the original Angular mock data. Supports comprehensive testing automation
 * for OpenAPI documentation preview and API generation workflows.
 * 
 * @version 1.0.0
 * @license MIT
 * @author DreamFactory Team
 * 
 * Key Features:
 * - Complete OpenAPI v3.0.0 specification mock data for multiple service types
 * - Type-safe interfaces compatible with Zod schema validators per React/Next.js Integration Requirements
 * - Comprehensive database service mock data supporting MySQL, PostgreSQL, MongoDB, Oracle, Snowflake
 * - Email service definitions with security schemes and component schemas per F-006 requirements
 * - Realistic API documentation test fixtures for MSW handlers and Vitest automation
 * - File service and administrative interface mock data for complete testing coverage
 * - Performance-optimized test data supporting 1000+ table schema testing scenarios
 * 
 * Testing Requirements:
 * - F-006: API Documentation and Testing requiring comprehensive mock OpenAPI specifications for testing automation
 * - React/Next.js Integration Requirements for type-safe mock data with Zod schema validator integration
 * - F-003: REST API Endpoint Generation OpenAPI preview requiring realistic test data for all preview scenarios
 * - Section 3.6 Development & Deployment requiring 90%+ test coverage with comprehensive test fixtures
 */

import type { 
  ApiDocsRowData,
  ApiKeyInfo,
  ServiceApiKeys,
  OpenAPIViewerProps,
  SwaggerUIConfig,
  SwaggerUIConfigData
} from '../types'
import type { 
  DatabaseService,
  DatabaseDriver,
  ServiceStatus,
  ConnectionTestResult,
  ServiceRow
} from '../../../../types/database-service'

// =============================================================================
// HTTP HEADERS CONSTANTS (MIGRATED FROM ANGULAR)
// =============================================================================

/**
 * DreamFactory API authentication headers
 * Migrated from Angular constants with enhanced TypeScript typing
 */
export const HTTP_HEADERS = {
  SESSION_TOKEN: 'X-DreamFactory-Session-Token',
  API_KEY: 'X-DreamFactory-API-Key',
  LICENSE_KEY: 'X-DreamFactory-License-Key',
  CONTENT_TYPE: 'Content-Type',
  ACCEPT: 'Accept',
  CACHE_CONTROL: 'Cache-Control',
  AUTHORIZATION: 'Authorization'
} as const

/**
 * Default request headers for OpenAPI testing
 */
export const DEFAULT_REQUEST_HEADERS = {
  [HTTP_HEADERS.CONTENT_TYPE]: 'application/json',
  [HTTP_HEADERS.ACCEPT]: 'application/json',
  [HTTP_HEADERS.CACHE_CONTROL]: 'no-cache'
} as const

// =============================================================================
// OPENAPI SPECIFICATION BASE TEMPLATES
// =============================================================================

/**
 * Base OpenAPI 3.0.0 specification template
 * Enhanced from Angular mock data with comprehensive security schemes
 */
export const BASE_OPENAPI_SPEC = {
  openapi: '3.0.0',
  info: {
    title: 'DreamFactory Generated API',
    description: 'Auto-generated REST API from DreamFactory',
    version: '2.0',
    contact: {
      name: 'DreamFactory Support',
      url: 'https://www.dreamfactory.com',
      email: 'support@dreamfactory.com'
    },
    license: {
      name: 'Commercial',
      url: 'https://www.dreamfactory.com/license'
    }
  },
  components: {
    securitySchemes: {
      BasicAuth: { 
        type: 'http', 
        scheme: 'basic',
        description: 'HTTP Basic Authentication'
      },
      BearerAuth: { 
        type: 'http', 
        scheme: 'bearer',
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
      }
    },
    responses: {
      Success: {
        description: 'Success Response',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Success' }
          },
          'application/xml': {
            schema: { $ref: '#/components/schemas/Success' }
          }
        }
      },
      Error: {
        description: 'Error Response',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          },
          'application/xml': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      ResourceList: {
        description: 'Resource List Response',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ResourceList' }
          },
          'application/xml': {
            schema: { $ref: '#/components/schemas/ResourceList' }
          }
        }
      },
      RecordResponse: {
        description: 'Database Record Response',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RecordResponse' }
          },
          'application/xml': {
            schema: { $ref: '#/components/schemas/RecordResponse' }
          }
        }
      },
      RecordsResponse: {
        description: 'Database Records List Response',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RecordsResponse' }
          },
          'application/xml': {
            schema: { $ref: '#/components/schemas/RecordsResponse' }
          }
        }
      }
    },
    schemas: {
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'True when API call was successful, false or error otherwise.'
          }
        },
        required: ['success']
      },
      Error: {
        type: 'object',
        properties: {
          code: {
            type: 'integer',
            format: 'int32',
            description: 'Error code.'
          },
          message: {
            type: 'string',
            description: 'String description of the error.'
          },
          context: {
            type: 'object',
            description: 'Additional error context information.',
            additionalProperties: true
          }
        },
        required: ['code', 'message']
      },
      ResourceList: {
        type: 'object',
        properties: {
          resource: {
            type: 'array',
            description: 'Array of accessible resources available to this service.',
            items: { type: 'string' }
          }
        },
        required: ['resource']
      },
      RecordResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int32',
            description: 'Record identifier'
          }
        },
        additionalProperties: true
      },
      RecordsResponse: {
        type: 'object',
        properties: {
          resource: {
            type: 'array',
            description: 'Array of database records',
            items: { $ref: '#/components/schemas/RecordResponse' }
          },
          meta: {
            type: 'object',
            properties: {
              count: {
                type: 'integer',
                description: 'Total number of records'
              },
              offset: {
                type: 'integer',
                description: 'Record offset for pagination'
              },
              limit: {
                type: 'integer',
                description: 'Record limit for pagination'
              }
            }
          }
        },
        required: ['resource']
      }
    },
    parameters: {
      OffsetParam: {
        name: 'offset',
        in: 'query',
        description: 'Number of records to skip for pagination',
        schema: {
          type: 'integer',
          minimum: 0,
          default: 0
        }
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Maximum number of records to return',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 1000,
          default: 25
        }
      },
      FilterParam: {
        name: 'filter',
        in: 'query',
        description: 'SQL-like filter expression for record selection',
        schema: {
          type: 'string'
        }
      },
      OrderParam: {
        name: 'order',
        in: 'query',
        description: 'SQL-like order expression for record sorting',
        schema: {
          type: 'string'
        }
      },
      FieldsParam: {
        name: 'fields',
        in: 'query',
        description: 'Comma-delimited list of field names to retrieve',
        schema: {
          type: 'string'
        }
      },
      IdsParam: {
        name: 'ids',
        in: 'query',
        description: 'Comma-delimited list of record IDs to retrieve',
        schema: {
          type: 'string'
        }
      }
    }
  },
  security: [
    { BasicAuth: [] },
    { BearerAuth: [] },
    { ApiKeyQuery: [] },
    { ApiKeyHeader: [] },
    { SessionTokenQuery: [] },
    { SessionTokenHeader: [] }
  ],
  tags: [
    {
      name: 'database',
      description: 'Database operations and management'
    },
    {
      name: 'email',
      description: 'Email service operations'
    },
    {
      name: 'file',
      description: 'File storage operations'
    },
    {
      name: 'system',
      description: 'System administration'
    }
  ]
} as const

// =============================================================================
// EMAIL SERVICE MOCK DATA (ENHANCED FROM ANGULAR)
// =============================================================================

/**
 * Comprehensive email service OpenAPI specification
 * Enhanced from original Angular mock data with additional schemas and operations
 */
export const MOCK_EMAIL_SERVICE_SPEC = {
  ...BASE_OPENAPI_SPEC,
  servers: [{ 
    url: '/api/v2/email', 
    description: 'Email service endpoints' 
  }],
  info: {
    ...BASE_OPENAPI_SPEC.info,
    title: 'Email Service API',
    description: 'Email service used for sending user invites, password reset confirmations, and transactional emails.',
    version: '2.0'
  },
  components: {
    ...BASE_OPENAPI_SPEC.components,
    schemas: {
      ...BASE_OPENAPI_SPEC.components.schemas,
      EmailResponse: {
        type: 'object',
        properties: {
          count: {
            type: 'integer',
            format: 'int32',
            description: 'Number of emails successfully sent.'
          },
          sent_time: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when emails were sent'
          }
        },
        required: ['count']
      },
      EmailRequest: {
        type: 'object',
        properties: {
          template: {
            type: 'string',
            description: 'Email Template name to base email on.'
          },
          templateId: {
            type: 'integer',
            format: 'int32',
            description: 'Email Template id to base email on.'
          },
          to: {
            type: 'array',
            description: 'Required single or multiple receiver addresses.',
            items: { $ref: '#/components/schemas/EmailAddress' },
            minItems: 1
          },
          cc: {
            type: 'array',
            description: 'Optional CC receiver addresses.',
            items: { $ref: '#/components/schemas/EmailAddress' }
          },
          bcc: {
            type: 'array',
            description: 'Optional BCC receiver addresses.',
            items: { $ref: '#/components/schemas/EmailAddress' }
          },
          subject: {
            type: 'string',
            description: 'Text only subject line.',
            maxLength: 200
          },
          bodyText: {
            type: 'string',
            description: 'Text only version of the body.'
          },
          bodyHtml: {
            type: 'string',
            description: 'Escaped HTML version of the body.'
          },
          fromName: {
            type: 'string',
            description: 'Required sender name.',
            maxLength: 100
          },
          fromEmail: {
            type: 'string',
            description: 'Required sender email.',
            format: 'email'
          },
          replyToName: {
            type: 'string',
            description: 'Optional reply to name.',
            maxLength: 100
          },
          replyToEmail: {
            type: 'string',
            description: 'Optional reply to email.',
            format: 'email'
          },
          attachment: {
            type: 'array',
            description: 'File(s) to import from storage service or URL for attachment',
            items: {
              type: 'object',
              properties: {
                service: {
                  type: 'string',
                  description: 'Name of the storage service to use.'
                },
                path: {
                  type: 'string',
                  description: 'File path relative to the service.'
                },
                filename: {
                  type: 'string',
                  description: 'Optional filename override'
                },
                contentType: {
                  type: 'string',
                  description: 'Optional content type override'
                }
              },
              required: ['service', 'path']
            }
          },
          priority: {
            type: 'string',
            enum: ['low', 'normal', 'high'],
            default: 'normal',
            description: 'Email priority level'
          }
        },
        required: ['to', 'subject', 'fromName', 'fromEmail']
      },
      EmailAddress: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Optional name displayed along with the email address.',
            maxLength: 100
          },
          email: {
            type: 'string',
            description: 'Required email address.',
            format: 'email'
          }
        },
        required: ['email']
      }
    },
    requestBodies: {
      EmailRequest: {
        description: 'Email Request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/EmailRequest' }
          },
          'application/xml': {
            schema: { $ref: '#/components/schemas/EmailRequest' }
          }
        },
        required: true
      }
    }
  },
  paths: {
    '/': {
      post: {
        summary: 'Send an email created from posted data and/or a template.',
        description: 'If a template is not used with all required fields, then they must be included in the request. If the \'from\' address is not provisioned in the service, then it must be included in the request.',
        operationId: 'sendEmail',
        parameters: [
          {
            name: 'template',
            description: 'Optional template name to base email on.',
            schema: { type: 'string' },
            in: 'query'
          },
          {
            name: 'template_id',
            description: 'Optional template id to base email on.',
            schema: { type: 'integer', format: 'int32' },
            in: 'query'
          },
          {
            name: 'attachment',
            description: 'Import file(s) from URL for attachment. This is also available in form-data post and in json payload data.',
            schema: { type: 'string' },
            in: 'query'
          }
        ],
        requestBody: { $ref: '#/components/requestBodies/EmailRequest' },
        responses: {
          '200': {
            description: 'Email sent successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EmailResponse' }
              }
            }
          },
          '400': {
            description: 'Bad request - invalid email data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': { $ref: '#/components/responses/Error' },
          '403': { $ref: '#/components/responses/Error' },
          '500': { $ref: '#/components/responses/Error' }
        },
        tags: ['email']
      }
    },
    '/templates': {
      get: {
        summary: 'Get available email templates',
        description: 'Retrieve a list of available email templates',
        operationId: 'getEmailTemplates',
        responses: {
          '200': {
            description: 'List of email templates',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    resource: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          name: { type: 'string' },
                          description: { type: 'string' },
                          subject: { type: 'string' },
                          body_text: { type: 'string' },
                          body_html: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          default: { $ref: '#/components/responses/Error' }
        },
        tags: ['email']
      }
    }
  }
} as const

// =============================================================================
// DATABASE SERVICE MOCK DATA
// =============================================================================

/**
 * Comprehensive database service mock data for various database types
 * Supports MySQL, PostgreSQL, MongoDB, Oracle, Snowflake testing scenarios
 */
export const MOCK_DATABASE_SERVICES: DatabaseService[] = [
  {
    id: 1,
    name: 'northwind_mysql',
    label: 'Northwind MySQL Database',
    description: 'Sample MySQL database with customer and order data for testing API generation',
    type: 'mysql' as DatabaseDriver,
    is_active: true,
    deletable: true,
    created_date: '2024-01-15T10:30:00Z',
    created_by_id: 1,
    last_modified_date: '2024-06-01T14:22:00Z',
    last_modified_by_id: 1,
    config: {
      host: 'localhost',
      port: 3306,
      database: 'northwind',
      username: 'testuser',
      password: '***',
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
      options: {
        timeout: 30,
        ssl: false,
        verify_ssl: false
      }
    }
  },
  {
    id: 2,
    name: 'analytics_postgres',
    label: 'Analytics PostgreSQL Database',
    description: 'PostgreSQL database containing analytics and reporting data for business intelligence APIs',
    type: 'pgsql' as DatabaseDriver,
    is_active: true,
    deletable: true,
    created_date: '2024-02-10T09:15:00Z',
    created_by_id: 1,
    last_modified_date: '2024-05-28T16:45:00Z',
    last_modified_by_id: 2,
    config: {
      host: 'postgres.example.com',
      port: 5432,
      database: 'analytics',
      username: 'analytics_user',
      password: '***',
      schema: 'public',
      options: {
        timeout: 30,
        ssl: true,
        verify_ssl: true
      }
    }
  },
  {
    id: 3,
    name: 'products_mongodb',
    label: 'Product Catalog MongoDB',
    description: 'MongoDB database for product catalog and inventory management API generation',
    type: 'mongodb' as DatabaseDriver,
    is_active: true,
    deletable: true,
    created_date: '2024-03-05T13:20:00Z',
    created_by_id: 2,
    last_modified_date: '2024-06-02T11:10:00Z',
    last_modified_by_id: 2,
    config: {
      host: 'mongodb.example.com',
      port: 27017,
      database: 'products',
      username: 'product_admin',
      password: '***',
      options: {
        authSource: 'admin',
        ssl: true,
        timeout: 30
      }
    }
  },
  {
    id: 4,
    name: 'warehouse_oracle',
    label: 'Warehouse Oracle Database',
    description: 'Oracle database for warehouse management and supply chain APIs',
    type: 'oracle' as DatabaseDriver,
    is_active: false,
    deletable: true,
    created_date: '2024-01-20T08:00:00Z',
    created_by_id: 1,
    last_modified_date: '2024-05-30T17:30:00Z',
    last_modified_by_id: 3,
    config: {
      host: 'oracle.enterprise.com',
      port: 1521,
      database: 'WAREHOUSE',
      username: 'wh_api_user',
      password: '***',
      service_name: 'WAREHOUSE.enterprise.com',
      options: {
        timeout: 60,
        ssl: true
      }
    }
  },
  {
    id: 5,
    name: 'bigdata_snowflake',
    label: 'Big Data Snowflake',
    description: 'Snowflake data warehouse for big data analytics and reporting APIs',
    type: 'snowflake' as DatabaseDriver,
    is_active: true,
    deletable: false,
    created_date: '2024-04-01T12:00:00Z',
    created_by_id: 3,
    last_modified_date: '2024-06-03T09:25:00Z',
    last_modified_by_id: 3,
    config: {
      account: 'company.us-west-2.snowflakecomputing.com',
      username: 'ANALYTICS_USER',
      password: '***',
      database: 'ANALYTICS_DB',
      schema: 'PUBLIC',
      warehouse: 'COMPUTE_WH',
      role: 'ANALYTICS_ROLE',
      options: {
        timeout: 120,
        ssl: true
      }
    }
  }
] as const

/**
 * Sample database service OpenAPI specification for MySQL Northwind database
 * Demonstrates comprehensive CRUD operations for multiple tables
 */
export const MOCK_DATABASE_SERVICE_SPEC = {
  ...BASE_OPENAPI_SPEC,
  servers: [{ 
    url: '/api/v2/northwind_mysql', 
    description: 'Northwind MySQL database service endpoints' 
  }],
  info: {
    ...BASE_OPENAPI_SPEC.info,
    title: 'Northwind MySQL API',
    description: 'Auto-generated REST API for Northwind MySQL database with comprehensive CRUD operations',
    version: '2.0'
  },
  components: {
    ...BASE_OPENAPI_SPEC.components,
    schemas: {
      ...BASE_OPENAPI_SPEC.components.schemas,
      Customer: {
        type: 'object',
        properties: {
          CustomerID: {
            type: 'string',
            maxLength: 5,
            description: 'Unique customer identifier'
          },
          CompanyName: {
            type: 'string',
            maxLength: 40,
            description: 'Customer company name'
          },
          ContactName: {
            type: 'string',
            maxLength: 30,
            description: 'Customer contact person name'
          },
          ContactTitle: {
            type: 'string',
            maxLength: 30,
            description: 'Customer contact person title'
          },
          Address: {
            type: 'string',
            maxLength: 60,
            description: 'Customer address'
          },
          City: {
            type: 'string',
            maxLength: 15,
            description: 'Customer city'
          },
          Region: {
            type: 'string',
            maxLength: 15,
            description: 'Customer region'
          },
          PostalCode: {
            type: 'string',
            maxLength: 10,
            description: 'Customer postal code'
          },
          Country: {
            type: 'string',
            maxLength: 15,
            description: 'Customer country'
          },
          Phone: {
            type: 'string',
            maxLength: 24,
            description: 'Customer phone number'
          },
          Fax: {
            type: 'string',
            maxLength: 24,
            description: 'Customer fax number'
          }
        },
        required: ['CustomerID', 'CompanyName']
      },
      Product: {
        type: 'object',
        properties: {
          ProductID: {
            type: 'integer',
            format: 'int32',
            description: 'Unique product identifier'
          },
          ProductName: {
            type: 'string',
            maxLength: 40,
            description: 'Product name'
          },
          SupplierID: {
            type: 'integer',
            format: 'int32',
            description: 'Supplier identifier'
          },
          CategoryID: {
            type: 'integer',
            format: 'int32',
            description: 'Product category identifier'
          },
          QuantityPerUnit: {
            type: 'string',
            maxLength: 20,
            description: 'Product quantity per unit'
          },
          UnitPrice: {
            type: 'number',
            format: 'decimal',
            description: 'Product unit price'
          },
          UnitsInStock: {
            type: 'integer',
            format: 'int16',
            description: 'Units currently in stock'
          },
          UnitsOnOrder: {
            type: 'integer',
            format: 'int16',
            description: 'Units currently on order'
          },
          ReorderLevel: {
            type: 'integer',
            format: 'int16',
            description: 'Minimum stock level before reorder'
          },
          Discontinued: {
            type: 'boolean',
            description: 'Whether product is discontinued'
          }
        },
        required: ['ProductID', 'ProductName']
      },
      Order: {
        type: 'object',
        properties: {
          OrderID: {
            type: 'integer',
            format: 'int32',
            description: 'Unique order identifier'
          },
          CustomerID: {
            type: 'string',
            maxLength: 5,
            description: 'Customer identifier'
          },
          EmployeeID: {
            type: 'integer',
            format: 'int32',
            description: 'Employee identifier'
          },
          OrderDate: {
            type: 'string',
            format: 'date-time',
            description: 'Order date'
          },
          RequiredDate: {
            type: 'string',
            format: 'date-time',
            description: 'Required delivery date'
          },
          ShippedDate: {
            type: 'string',
            format: 'date-time',
            description: 'Actual shipping date'
          },
          ShipVia: {
            type: 'integer',
            format: 'int32',
            description: 'Shipping company identifier'
          },
          Freight: {
            type: 'number',
            format: 'decimal',
            description: 'Shipping freight cost'
          },
          ShipName: {
            type: 'string',
            maxLength: 40,
            description: 'Shipping recipient name'
          },
          ShipAddress: {
            type: 'string',
            maxLength: 60,
            description: 'Shipping address'
          },
          ShipCity: {
            type: 'string',
            maxLength: 15,
            description: 'Shipping city'
          },
          ShipRegion: {
            type: 'string',
            maxLength: 15,
            description: 'Shipping region'
          },
          ShipPostalCode: {
            type: 'string',
            maxLength: 10,
            description: 'Shipping postal code'
          },
          ShipCountry: {
            type: 'string',
            maxLength: 15,
            description: 'Shipping country'
          }
        },
        required: ['OrderID']
      }
    }
  },
  paths: {
    '/_table/customers': {
      get: {
        summary: 'Retrieve customer records',
        description: 'Get a list of customer records with optional filtering and pagination',
        operationId: 'getCustomers',
        parameters: [
          { $ref: '#/components/parameters/OffsetParam' },
          { $ref: '#/components/parameters/LimitParam' },
          { $ref: '#/components/parameters/FilterParam' },
          { $ref: '#/components/parameters/OrderParam' },
          { $ref: '#/components/parameters/FieldsParam' }
        ],
        responses: {
          '200': {
            description: 'Customer records retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    resource: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Customer' }
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        count: { type: 'integer' },
                        offset: { type: 'integer' },
                        limit: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          },
          default: { $ref: '#/components/responses/Error' }
        },
        tags: ['database']
      },
      post: {
        summary: 'Create new customer records',
        description: 'Create one or more new customer records',
        operationId: 'createCustomers',
        requestBody: {
          description: 'Customer data',
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
                        items: { $ref: '#/components/schemas/Customer' }
                      }
                    }
                  }
                ]
              }
            }
          },
          required: true
        },
        responses: {
          '201': {
            description: 'Customer records created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RecordsResponse' }
              }
            }
          },
          default: { $ref: '#/components/responses/Error' }
        },
        tags: ['database']
      }
    },
    '/_table/customers/{id}': {
      get: {
        summary: 'Retrieve specific customer record',
        description: 'Get a specific customer record by ID',
        operationId: 'getCustomer',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Customer ID'
          },
          { $ref: '#/components/parameters/FieldsParam' }
        ],
        responses: {
          '200': {
            description: 'Customer record retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Customer' }
              }
            }
          },
          '404': {
            description: 'Customer not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          default: { $ref: '#/components/responses/Error' }
        },
        tags: ['database']
      },
      put: {
        summary: 'Update customer record',
        description: 'Update a specific customer record by ID',
        operationId: 'updateCustomer',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Customer ID'
          }
        ],
        requestBody: {
          description: 'Updated customer data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Customer' }
            }
          },
          required: true
        },
        responses: {
          '200': {
            description: 'Customer record updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Customer' }
              }
            }
          },
          '404': {
            description: 'Customer not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          default: { $ref: '#/components/responses/Error' }
        },
        tags: ['database']
      },
      delete: {
        summary: 'Delete customer record',
        description: 'Delete a specific customer record by ID',
        operationId: 'deleteCustomer',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Customer ID'
          }
        ],
        responses: {
          '200': {
            description: 'Customer record deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' }
              }
            }
          },
          '404': {
            description: 'Customer not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          default: { $ref: '#/components/responses/Error' }
        },
        tags: ['database']
      }
    },
    '/_table/products': {
      get: {
        summary: 'Retrieve product records',
        description: 'Get a list of product records with optional filtering and pagination',
        operationId: 'getProducts',
        parameters: [
          { $ref: '#/components/parameters/OffsetParam' },
          { $ref: '#/components/parameters/LimitParam' },
          { $ref: '#/components/parameters/FilterParam' },
          { $ref: '#/components/parameters/OrderParam' },
          { $ref: '#/components/parameters/FieldsParam' }
        ],
        responses: {
          '200': {
            description: 'Product records retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    resource: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Product' }
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        count: { type: 'integer' },
                        offset: { type: 'integer' },
                        limit: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          },
          default: { $ref: '#/components/responses/Error' }
        },
        tags: ['database']
      }
    },
    '/_table/orders': {
      get: {
        summary: 'Retrieve order records',
        description: 'Get a list of order records with optional filtering and pagination',
        operationId: 'getOrders',
        parameters: [
          { $ref: '#/components/parameters/OffsetParam' },
          { $ref: '#/components/parameters/LimitParam' },
          { $ref: '#/components/parameters/FilterParam' },
          { $ref: '#/components/parameters/OrderParam' },
          { $ref: '#/components/parameters/FieldsParam' }
        ],
        responses: {
          '200': {
            description: 'Order records retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    resource: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Order' }
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        count: { type: 'integer' },
                        offset: { type: 'integer' },
                        limit: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          },
          default: { $ref: '#/components/responses/Error' }
        },
        tags: ['database']
      }
    }
  }
} as const

// =============================================================================
// API DOCUMENTATION ROW DATA
// =============================================================================

/**
 * Mock API documentation row data for service listings
 * Enhanced with realistic metadata and health information
 */
export const MOCK_API_DOCS_DATA: ApiDocsRowData[] = [
  {
    id: 1,
    name: 'northwind_mysql',
    label: 'Northwind MySQL Database',
    description: 'Sample MySQL database with customer and order data for testing API generation',
    group: 'database',
    type: 'mysql',
    status: 'active',
    isActive: true,
    openapi: {
      specUrl: '/api/v2/northwind_mysql/_schema',
      version: '3.0.0',
      lastUpdated: '2024-06-03T10:30:00Z',
      operationCount: 15,
      specSize: 45600
    },
    documentation: {
      hasDocumentation: true,
      url: '/docs/northwind_mysql',
      lastGenerated: '2024-06-03T10:30:00Z',
      generationStatus: 'completed'
    },
    usage: {
      totalCalls: 12450,
      dailyCalls: 245,
      lastAccessed: '2024-06-05T14:22:00Z',
      popularEndpoints: [
        '/api/v2/northwind_mysql/_table/customers',
        '/api/v2/northwind_mysql/_table/orders',
        '/api/v2/northwind_mysql/_table/products'
      ]
    },
    health: {
      status: 'healthy',
      lastCheck: '2024-06-05T15:00:00Z',
      responseTime: 125,
      errorRate: 0.2
    }
  },
  {
    id: 2,
    name: 'analytics_postgres',
    label: 'Analytics PostgreSQL Database',
    description: 'PostgreSQL database containing analytics and reporting data for business intelligence APIs',
    group: 'database',
    type: 'pgsql',
    status: 'active',
    isActive: true,
    openapi: {
      specUrl: '/api/v2/analytics_postgres/_schema',
      version: '3.0.0',
      lastUpdated: '2024-06-02T16:45:00Z',
      operationCount: 28,
      specSize: 78900
    },
    documentation: {
      hasDocumentation: true,
      url: '/docs/analytics_postgres',
      lastGenerated: '2024-06-02T16:45:00Z',
      generationStatus: 'completed'
    },
    usage: {
      totalCalls: 8760,
      dailyCalls: 167,
      lastAccessed: '2024-06-05T13:15:00Z',
      popularEndpoints: [
        '/api/v2/analytics_postgres/_table/events',
        '/api/v2/analytics_postgres/_table/users',
        '/api/v2/analytics_postgres/_table/sessions'
      ]
    },
    health: {
      status: 'healthy',
      lastCheck: '2024-06-05T15:00:00Z',
      responseTime: 89,
      errorRate: 0.1
    }
  },
  {
    id: 3,
    name: 'products_mongodb',
    label: 'Product Catalog MongoDB',
    description: 'MongoDB database for product catalog and inventory management API generation',
    group: 'database',
    type: 'mongodb',
    status: 'active',
    isActive: true,
    openapi: {
      specUrl: '/api/v2/products_mongodb/_schema',
      version: '3.0.0',
      lastUpdated: '2024-06-02T11:10:00Z',
      operationCount: 22,
      specSize: 56200
    },
    documentation: {
      hasDocumentation: true,
      url: '/docs/products_mongodb',
      lastGenerated: '2024-06-02T11:10:00Z',
      generationStatus: 'completed'
    },
    usage: {
      totalCalls: 15680,
      dailyCalls: 325,
      lastAccessed: '2024-06-05T14:45:00Z',
      popularEndpoints: [
        '/api/v2/products_mongodb/_table/products',
        '/api/v2/products_mongodb/_table/categories',
        '/api/v2/products_mongodb/_table/inventory'
      ]
    },
    health: {
      status: 'healthy',
      lastCheck: '2024-06-05T15:00:00Z',
      responseTime: 156,
      errorRate: 0.3
    }
  },
  {
    id: 4,
    name: 'warehouse_oracle',
    label: 'Warehouse Oracle Database',
    description: 'Oracle database for warehouse management and supply chain APIs',
    group: 'database',
    type: 'oracle',
    status: 'inactive',
    isActive: false,
    openapi: {
      specUrl: '/api/v2/warehouse_oracle/_schema',
      version: '3.0.0',
      lastUpdated: '2024-05-30T17:30:00Z',
      operationCount: 42,
      specSize: 125400
    },
    documentation: {
      hasDocumentation: false,
      generationStatus: 'failed'
    },
    usage: {
      totalCalls: 0,
      dailyCalls: 0
    },
    health: {
      status: 'unhealthy',
      lastCheck: '2024-06-05T15:00:00Z',
      responseTime: 0,
      errorRate: 100
    }
  },
  {
    id: 5,
    name: 'bigdata_snowflake',
    label: 'Big Data Snowflake',
    description: 'Snowflake data warehouse for big data analytics and reporting APIs',
    group: 'database',
    type: 'snowflake',
    status: 'active',
    isActive: true,
    openapi: {
      specUrl: '/api/v2/bigdata_snowflake/_schema',
      version: '3.0.0',
      lastUpdated: '2024-06-03T09:25:00Z',
      operationCount: 185,
      specSize: 445600
    },
    documentation: {
      hasDocumentation: true,
      url: '/docs/bigdata_snowflake',
      lastGenerated: '2024-06-03T09:25:00Z',
      generationStatus: 'completed'
    },
    usage: {
      totalCalls: 3420,
      dailyCalls: 89,
      lastAccessed: '2024-06-05T12:30:00Z',
      popularEndpoints: [
        '/api/v2/bigdata_snowflake/_table/fact_sales',
        '/api/v2/bigdata_snowflake/_table/dim_customer',
        '/api/v2/bigdata_snowflake/_table/dim_product'
      ]
    },
    health: {
      status: 'healthy',
      lastCheck: '2024-06-05T15:00:00Z',
      responseTime: 245,
      errorRate: 0.05
    }
  },
  {
    id: 6,
    name: 'email_service',
    label: 'Email Service',
    description: 'Email service used for sending user invites and password reset confirmations',
    group: 'email',
    type: 'email',
    status: 'active',
    isActive: true,
    openapi: {
      specUrl: '/api/v2/email/_schema',
      version: '3.0.0',
      lastUpdated: '2024-06-01T14:00:00Z',
      operationCount: 4,
      specSize: 12800
    },
    documentation: {
      hasDocumentation: true,
      url: '/docs/email',
      lastGenerated: '2024-06-01T14:00:00Z',
      generationStatus: 'completed'
    },
    usage: {
      totalCalls: 1250,
      dailyCalls: 45,
      lastAccessed: '2024-06-05T11:20:00Z',
      popularEndpoints: [
        '/api/v2/email/',
        '/api/v2/email/templates'
      ]
    },
    health: {
      status: 'healthy',
      lastCheck: '2024-06-05T15:00:00Z',
      responseTime: 78,
      errorRate: 0.8
    }
  }
] as const

// =============================================================================
// API KEY MOCK DATA
// =============================================================================

/**
 * Mock API key data for testing API key management functionality
 * Includes various key states and configurations
 */
export const MOCK_API_KEYS: ApiKeyInfo[] = [
  {
    id: 'key_001',
    name: 'Production API Key',
    apiKey: 'df_api_prod_abcd1234567890efghij',
    description: 'Primary production API key for client applications',
    createdAt: '2024-01-15T10:00:00Z',
    expiresAt: '2025-01-15T10:00:00Z',
    lastUsed: '2024-06-05T14:30:00Z',
    status: 'active',
    scopes: ['database:read', 'database:write', 'email:send'],
    rateLimit: {
      requestsPerMinute: 1000,
      requestsPerHour: 50000,
      requestsPerDay: 1000000,
      burst: 2000
    },
    usage: {
      totalRequests: 2450680,
      dailyRequests: 8540,
      errorCount: 125,
      lastError: 'Rate limit exceeded'
    },
    security: {
      allowedOrigins: ['https://app.example.com', 'https://mobile.example.com'],
      allowedIPs: ['192.168.1.0/24', '10.0.0.0/8'],
      requireHTTPS: true,
      enableLogging: true
    },
    metadata: {
      createdBy: 'admin@example.com',
      updatedBy: 'admin@example.com',
      version: 1,
      environment: 'production',
      tags: ['client-app', 'production', 'high-priority']
    }
  },
  {
    id: 'key_002',
    name: 'Development API Key',
    apiKey: 'df_api_dev_xyz9876543210mnopqr',
    description: 'Development and testing API key',
    createdAt: '2024-03-01T09:00:00Z',
    expiresAt: '2024-09-01T09:00:00Z',
    lastUsed: '2024-06-05T16:15:00Z',
    status: 'active',
    scopes: ['database:read', 'database:write', 'email:send', 'file:read', 'file:write'],
    rateLimit: {
      requestsPerMinute: 100,
      requestsPerHour: 5000,
      requestsPerDay: 100000,
      burst: 200
    },
    usage: {
      totalRequests: 45620,
      dailyRequests: 156,
      errorCount: 23,
      lastError: 'Invalid table name'
    },
    security: {
      allowedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      requireHTTPS: false,
      enableLogging: true
    },
    metadata: {
      createdBy: 'developer@example.com',
      updatedBy: 'developer@example.com',
      version: 2,
      environment: 'development',
      tags: ['development', 'testing', 'unrestricted']
    }
  },
  {
    id: 'key_003',
    name: 'Staging API Key',
    apiKey: 'df_api_staging_def4567890123abc',
    description: 'Staging environment API key for pre-production testing',
    createdAt: '2024-02-15T14:30:00Z',
    expiresAt: '2024-08-15T14:30:00Z',
    lastUsed: '2024-06-04T10:45:00Z',
    status: 'active',
    scopes: ['database:read', 'database:write', 'email:send'],
    rateLimit: {
      requestsPerMinute: 500,
      requestsPerHour: 25000,
      requestsPerDay: 500000,
      burst: 1000
    },
    usage: {
      totalRequests: 156780,
      dailyRequests: 1240,
      errorCount: 45,
      lastError: 'Database connection timeout'
    },
    security: {
      allowedOrigins: ['https://staging.example.com'],
      allowedIPs: ['203.0.113.0/24'],
      requireHTTPS: true,
      enableLogging: true
    },
    metadata: {
      createdBy: 'qa@example.com',
      updatedBy: 'devops@example.com',
      version: 1,
      environment: 'staging',
      tags: ['staging', 'qa', 'pre-production']
    }
  },
  {
    id: 'key_004',
    name: 'Analytics API Key',
    apiKey: 'df_api_analytics_ghi7890123456def',
    description: 'Read-only API key for analytics and reporting',
    createdAt: '2024-04-01T08:00:00Z',
    expiresAt: '2025-04-01T08:00:00Z',
    lastUsed: '2024-06-05T06:00:00Z',
    status: 'active',
    scopes: ['database:read'],
    rateLimit: {
      requestsPerMinute: 200,
      requestsPerHour: 10000,
      requestsPerDay: 200000,
      burst: 400
    },
    usage: {
      totalRequests: 67890,
      dailyRequests: 2890,
      errorCount: 12,
      lastError: 'Insufficient permissions'
    },
    security: {
      allowedOrigins: ['https://analytics.example.com'],
      requireHTTPS: true,
      enableLogging: true
    },
    metadata: {
      createdBy: 'analytics@example.com',
      updatedBy: 'analytics@example.com',
      version: 1,
      environment: 'production',
      tags: ['analytics', 'read-only', 'reporting']
    }
  },
  {
    id: 'key_005',
    name: 'Expired API Key',
    apiKey: 'df_api_expired_jkl3456789012ghi',
    description: 'Expired API key for testing expiration scenarios',
    createdAt: '2023-06-01T12:00:00Z',
    expiresAt: '2024-01-01T12:00:00Z',
    lastUsed: '2023-12-28T15:30:00Z',
    status: 'expired',
    scopes: ['database:read', 'database:write'],
    rateLimit: {
      requestsPerMinute: 100,
      requestsPerHour: 5000,
      requestsPerDay: 100000,
      burst: 200
    },
    usage: {
      totalRequests: 89560,
      dailyRequests: 0,
      errorCount: 156,
      lastError: 'API key expired'
    },
    security: {
      requireHTTPS: true,
      enableLogging: true
    },
    metadata: {
      createdBy: 'temp@example.com',
      version: 1,
      environment: 'development',
      tags: ['expired', 'temporary']
    }
  }
] as const

/**
 * Mock service API keys collection
 */
export const MOCK_SERVICE_API_KEYS: ServiceApiKeys = {
  serviceId: 1,
  serviceName: 'northwind_mysql',
  keys: MOCK_API_KEYS,
  lastUpdated: '2024-06-05T15:00:00Z',
  cache: {
    timestamp: '2024-06-05T15:00:00Z',
    ttl: 300000,
    source: 'server'
  },
  pagination: {
    page: 1,
    pageSize: 25,
    total: 5,
    hasNext: false,
    hasPrevious: false
  },
  sorting: {
    field: 'createdAt',
    direction: 'desc'
  },
  filters: {
    status: ['active'],
    search: ''
  }
} as const

// =============================================================================
// SWAGGER UI CONFIGURATION
// =============================================================================

/**
 * Default SwaggerUI configuration for testing
 * Enhanced with comprehensive theme and accessibility settings
 */
export const MOCK_SWAGGER_CONFIG: SwaggerUIConfigData = {
  layout: 'BaseLayout',
  deepLinking: true,
  displayOperationId: false,
  defaultModelsExpandDepth: 1,
  defaultModelExpandDepth: 1,
  defaultModelRendering: 'example',
  displayRequestDuration: true,
  docExpansion: 'list',
  filter: false,
  maxDisplayedTags: 100,
  showExtensions: false,
  showCommonExtensions: false,
  useUnsafeMarkdown: false,
  tryItOutEnabled: true,
  theme: {
    mode: 'light',
    variables: {
      '--swagger-ui-primary-color': '#5b39f3',
      '--swagger-ui-background-color': '#ffffff',
      '--swagger-ui-text-color': '#1f2937',
      '--swagger-ui-border-color': '#e5e7eb'
    }
  },
  dreamfactory: {
    baseUrl: 'http://localhost:80/api/v2',
    serviceName: 'northwind_mysql',
    serviceType: 'mysql'
  },
  react: {
    containerId: 'swagger-ui-container'
  },
  performance: {
    lazyLoad: true,
    virtualScrolling: false,
    maxOperations: 1000,
    searchDebounce: 300
  },
  accessibility: {
    keyboardNavigation: true,
    screenReader: true,
    highContrast: false,
    focusManagement: true
  }
} as const

// =============================================================================
// CONNECTION TEST RESULTS
// =============================================================================

/**
 * Mock connection test results for various scenarios
 */
export const MOCK_CONNECTION_TEST_RESULTS: Record<string, ConnectionTestResult> = {
  success: {
    success: true,
    message: 'Connection successful',
    responseTime: 125,
    timestamp: '2024-06-05T15:00:00Z',
    metadata: {
      serverVersion: 'MySQL 8.0.35',
      charset: 'utf8mb4',
      timeZone: 'UTC',
      tables: 13,
      views: 2,
      procedures: 5
    }
  },
  timeout: {
    success: false,
    message: 'Connection timeout after 30 seconds',
    error: 'TIMEOUT_ERROR',
    details: 'Unable to establish connection within timeout period',
    responseTime: 30000,
    timestamp: '2024-06-05T15:00:00Z'
  },
  authentication: {
    success: false,
    message: 'Authentication failed',
    error: 'AUTH_ERROR',
    details: 'Invalid username or password',
    responseTime: 89,
    timestamp: '2024-06-05T15:00:00Z'
  },
  networkError: {
    success: false,
    message: 'Network error',
    error: 'NETWORK_ERROR',
    details: 'Host unreachable or port blocked',
    responseTime: 5000,
    timestamp: '2024-06-05T15:00:00Z'
  }
} as const

// =============================================================================
// LARGE DATASET MOCK DATA
// =============================================================================

/**
 * Mock data generator for large dataset testing (1000+ tables)
 * Supports performance testing scenarios per F-002-RQ-002 requirements
 */
export const generateLargeDatasetMockData = (tableCount: number = 1000): ApiDocsRowData[] => {
  const mockData: ApiDocsRowData[] = []
  
  for (let i = 1; i <= tableCount; i++) {
    const mockService: ApiDocsRowData = {
      id: i,
      name: `service_${i.toString().padStart(4, '0')}`,
      label: `Service ${i}`,
      description: `Auto-generated service ${i} for performance testing`,
      group: i % 5 === 0 ? 'email' : 'database',
      type: ['mysql', 'pgsql', 'mongodb', 'oracle', 'snowflake'][i % 5],
      status: i % 10 === 0 ? 'inactive' : 'active',
      isActive: i % 10 !== 0,
      openapi: {
        specUrl: `/api/v2/service_${i.toString().padStart(4, '0')}/_schema`,
        version: '3.0.0',
        lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        operationCount: Math.floor(Math.random() * 50) + 5,
        specSize: Math.floor(Math.random() * 100000) + 10000
      },
      documentation: {
        hasDocumentation: i % 7 !== 0,
        url: i % 7 !== 0 ? `/docs/service_${i.toString().padStart(4, '0')}` : undefined,
        lastGenerated: i % 7 !== 0 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        generationStatus: i % 7 === 0 ? 'failed' : 'completed'
      },
      usage: {
        totalCalls: Math.floor(Math.random() * 1000000),
        dailyCalls: Math.floor(Math.random() * 1000),
        lastAccessed: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        popularEndpoints: [
          `/api/v2/service_${i.toString().padStart(4, '0')}/_table/table1`,
          `/api/v2/service_${i.toString().padStart(4, '0')}/_table/table2`
        ]
      },
      health: {
        status: i % 15 === 0 ? 'unhealthy' : (i % 8 === 0 ? 'degraded' : 'healthy'),
        lastCheck: new Date().toISOString(),
        responseTime: Math.floor(Math.random() * 500) + 50,
        errorRate: Math.random() * 5
      }
    }
    
    mockData.push(mockService)
  }
  
  return mockData
}

// =============================================================================
// ERROR SCENARIOS
// =============================================================================

/**
 * Mock error responses for comprehensive error handling testing
 */
export const MOCK_ERROR_RESPONSES = {
  unauthorized: {
    code: 401,
    message: 'Unauthorized: Invalid API key or session token',
    context: {
      timestamp: '2024-06-05T15:00:00Z',
      requestId: 'req_12345',
      suggestedAction: 'Verify your API key and try again'
    }
  },
  forbidden: {
    code: 403,
    message: 'Forbidden: Insufficient permissions',
    context: {
      timestamp: '2024-06-05T15:00:00Z',
      requestId: 'req_12346',
      requiredScope: 'database:read',
      userScopes: ['email:send']
    }
  },
  notFound: {
    code: 404,
    message: 'Service not found',
    context: {
      timestamp: '2024-06-05T15:00:00Z',
      requestId: 'req_12347',
      serviceName: 'invalid_service'
    }
  },
  validation: {
    code: 400,
    message: 'Validation error: Invalid input data',
    context: {
      timestamp: '2024-06-05T15:00:00Z',
      requestId: 'req_12348',
      validationErrors: [
        {
          field: 'email',
          message: 'Invalid email format'
        },
        {
          field: 'subject',
          message: 'Subject is required'
        }
      ]
    }
  },
  rateLimit: {
    code: 429,
    message: 'Rate limit exceeded',
    context: {
      timestamp: '2024-06-05T15:00:00Z',
      requestId: 'req_12349',
      retryAfter: 60,
      limit: 1000,
      remaining: 0,
      resetTime: '2024-06-05T15:01:00Z'
    }
  },
  serverError: {
    code: 500,
    message: 'Internal server error',
    context: {
      timestamp: '2024-06-05T15:00:00Z',
      requestId: 'req_12350',
      errorId: 'err_abc123'
    }
  }
} as const

// =============================================================================
// EXPORT ALL MOCK DATA
// =============================================================================

/**
 * Comprehensive mock data export for OpenAPI preview testing
 * Provides all necessary test fixtures and utilities
 */
export const OPENAPI_PREVIEW_MOCK_DATA = {
  // Base configurations
  BASE_OPENAPI_SPEC,
  HTTP_HEADERS,
  DEFAULT_REQUEST_HEADERS,
  
  // Service specifications
  MOCK_EMAIL_SERVICE_SPEC,
  MOCK_DATABASE_SERVICE_SPEC,
  
  // Service data
  MOCK_DATABASE_SERVICES,
  MOCK_API_DOCS_DATA,
  
  // API key data
  MOCK_API_KEYS,
  MOCK_SERVICE_API_KEYS,
  
  // Configuration
  MOCK_SWAGGER_CONFIG,
  
  // Connection testing
  MOCK_CONNECTION_TEST_RESULTS,
  
  // Error scenarios
  MOCK_ERROR_RESPONSES,
  
  // Utilities
  generateLargeDatasetMockData
} as const

// Make individual exports available for convenience
export {
  BASE_OPENAPI_SPEC,
  MOCK_EMAIL_SERVICE_SPEC,
  MOCK_DATABASE_SERVICE_SPEC,
  MOCK_DATABASE_SERVICES,
  MOCK_API_DOCS_DATA,
  MOCK_API_KEYS,
  MOCK_SERVICE_API_KEYS,
  MOCK_SWAGGER_CONFIG,
  MOCK_CONNECTION_TEST_RESULTS,
  MOCK_ERROR_RESPONSES,
  generateLargeDatasetMockData
}

/**
 * @example
 * // Import specific mock data for unit tests
 * import { MOCK_EMAIL_SERVICE_SPEC, MOCK_API_KEYS } from './mock-data'
 * 
 * // Import all mock data for comprehensive testing
 * import { OPENAPI_PREVIEW_MOCK_DATA } from './mock-data'
 * 
 * // Generate large dataset for performance testing
 * import { generateLargeDatasetMockData } from './mock-data'
 * const largeDataset = generateLargeDatasetMockData(1500) // 1500 services
 * 
 * // Use in MSW handlers
 * rest.get('/api/v2/services', (req, res, ctx) => {
 *   return res(ctx.json({ resource: MOCK_API_DOCS_DATA }))
 * })
 * 
 * // Use in Vitest tests
 * test('should render OpenAPI specification', () => {
 *   render(<OpenAPIViewer spec={MOCK_EMAIL_SERVICE_SPEC} />)
 *   expect(screen.getByText('Email Service API')).toBeInTheDocument()
 * })
 */