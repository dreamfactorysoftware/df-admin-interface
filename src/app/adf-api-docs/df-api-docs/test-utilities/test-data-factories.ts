/**
 * @fileoverview React-compatible test data factories for API documentation component testing
 * @description Generates mock API documentation data, service configurations, and user interaction scenarios
 * Optimized for Vitest 2.1+ and React Testing Library testing workflows with comprehensive F-006 feature coverage
 * 
 * @version 1.0.0
 * @license MIT
 * @author DreamFactory Team
 * 
 * Features:
 * - Factory functions compatible with Vitest 2.1+ testing framework per enhanced test execution requirements
 * - React Testing Library integration for component testing data generation
 * - TypeScript type safety for test data generation per code quality standards
 * - Mock data generation for React Query and SWR hook testing per state management requirements
 * - Comprehensive coverage of API documentation testing scenarios per F-006 feature requirements
 * - MSW handler factories for realistic API mocking during development and testing
 * - OpenAPI specification generation with configurable parameters
 * - Performance testing data for build time optimization
 * - Accessibility testing mock data for WCAG 2.1 AA compliance
 */

import type { 
  Service,
  ServiceType,
  ServiceRow,
  OpenAPISpec,
  OpenAPIOperation,
  OpenAPIPath,
  OpenAPISchema,
  OpenAPIResponse,
  OpenAPIParameter,
  EndpointConfig,
  GenerationStep,
  WizardState,
  GenerationProgress,
  GenerationResult,
  ServiceDeploymentConfig,
  DeploymentStatus,
  HTTPMethod,
  ServiceStatus,
  ServiceCategory,
  ServiceFormConfig,
  ServiceFormState,
  ServiceConfigSchema,
  ConfigFieldType,
  ServiceError,
  ServiceValidationError,
  GenerationError
} from '@/types/services'

import type {
  TestScenario,
  TestFixtureFactory,
  MSWHandler,
  ApiMockGenerators,
  PerformanceMetrics,
  DatabaseServiceMockFactory,
  AuthMockFactory,
  ComponentTestUtils,
  FormTestHelpers,
  AccessibilityTestConfig,
  TestingContext
} from '@/types/testing'

import type { 
  ApiResponse, 
  ApiError, 
  ListResponse 
} from '@/types/api'

import type { faker } from '@faker-js/faker'

// =================================================================================================
// CORE FACTORY CONFIGURATION
// =================================================================================================

/**
 * Factory configuration options for customizing mock data generation
 * Enhanced for React Testing Library and Vitest integration patterns
 */
export interface FactoryConfig {
  /** Enable realistic data generation using Faker.js */
  realistic?: boolean
  
  /** Seed for consistent test data across test runs */
  seed?: number
  
  /** Locale for internationalized data generation */
  locale?: string
  
  /** Performance optimization for large dataset generation */
  performance?: {
    useCache?: boolean
    batchSize?: number
    maxItems?: number
  }
  
  /** Vitest-specific configuration */
  vitest?: {
    mockDepth?: number
    enableSnapshots?: boolean
    coverageThreshold?: number
  }
  
  /** React Query/SWR testing optimizations */
  queryOptimization?: {
    enableCaching?: boolean
    staleTime?: number
    cacheTime?: number
    enableOptimistic?: boolean
  }
}

/**
 * Default factory configuration optimized for React ecosystem testing
 */
const DEFAULT_FACTORY_CONFIG: Required<FactoryConfig> = {
  realistic: true,
  seed: 12345,
  locale: 'en',
  performance: {
    useCache: true,
    batchSize: 100,
    maxItems: 1000
  },
  vitest: {
    mockDepth: 3,
    enableSnapshots: true,
    coverageThreshold: 90
  },
  queryOptimization: {
    enableCaching: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    enableOptimistic: true
  }
}

// =================================================================================================
// OPENAPI SPECIFICATION FACTORIES
// =================================================================================================

/**
 * OpenAPI specification factory for comprehensive API documentation testing
 * Generates valid OpenAPI 3.0+ specifications with configurable complexity
 */
export class OpenAPISpecificationFactory implements TestFixtureFactory<OpenAPISpec> {
  private config: Required<FactoryConfig>
  
  constructor(config: FactoryConfig = {}) {
    this.config = { ...DEFAULT_FACTORY_CONFIG, ...config }
  }
  
  /**
   * Creates a complete OpenAPI specification with realistic endpoints
   */
  create(overrides: Partial<OpenAPISpec> = {}): OpenAPISpec {
    const baseSpec: OpenAPISpec = {
      openapi: '3.0.3',
      info: {
        title: 'DreamFactory Database API',
        version: '1.0.0',
        description: 'Auto-generated REST API for database operations',
        contact: {
          name: 'DreamFactory Support',
          email: 'support@dreamfactory.com',
          url: 'https://dreamfactory.com/support'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        },
        termsOfService: 'https://dreamfactory.com/terms'
      },
      servers: [
        {
          url: 'https://api.example.com/api/v2',
          description: 'Production server'
        },
        {
          url: 'https://staging-api.example.com/api/v2',
          description: 'Staging server'
        },
        {
          url: 'http://localhost:8000/api/v2',
          description: 'Development server'
        }
      ],
      paths: this.createPaths(),
      components: {
        schemas: this.createSchemas(),
        responses: this.createResponses(),
        parameters: this.createParameters(),
        securitySchemes: this.createSecuritySchemes()
      },
      security: [
        { apiKey: [] },
        { bearerAuth: [] }
      ],
      tags: this.createTags(),
      'x-dreamfactory': {
        serviceId: 1,
        serviceName: 'mysql_db',
        serviceType: 'database',
        generated: new Date().toISOString(),
        generator: {
          name: 'DreamFactory Admin Interface',
          version: '5.0.0'
        },
        cache: {
          ttl: 300,
          strategy: 'intelligent'
        },
        performance: {
          optimizations: ['lazy-loading', 'virtual-scrolling', 'request-batching'],
          benchmarks: {
            generateTime: 2.5,
            specSize: 125000,
            endpointCount: 24
          }
        }
      },
      'x-nextjs': {
        apiRoutes: {
          'GET /users': {
            path: '/api/v2/users',
            method: 'GET',
            handler: 'getUsersHandler'
          },
          'POST /users': {
            path: '/api/v2/users',
            method: 'POST',
            handler: 'createUserHandler'
          }
        },
        serverless: true,
        edge: true,
        middleware: ['auth', 'cors', 'rate-limit']
      }
    }
    
    return { ...baseSpec, ...overrides }
  }
  
  /**
   * Creates multiple OpenAPI specifications for testing large datasets
   */
  createMany(count: number, overrides: Partial<OpenAPISpec> = {}): OpenAPISpec[] {
    return Array.from({ length: count }, (_, index) => 
      this.create({
        ...overrides,
        info: {
          ...overrides.info,
          title: `${overrides.info?.title || 'API'} ${index + 1}`,
          version: `1.${index}.0`
        }
      })
    )
  }
  
  /**
   * Creates invalid OpenAPI specification for error testing
   */
  createInvalid(invalidFields: (keyof OpenAPISpec)[] = ['openapi']): Partial<OpenAPISpec> {
    const spec = this.create()
    const invalid: Partial<OpenAPISpec> = {}
    
    invalidFields.forEach(field => {
      switch (field) {
        case 'openapi':
          // @ts-expect-error - Intentionally invalid version for testing
          invalid.openapi = '2.0.0' // Invalid version
          break
        case 'info':
          // @ts-expect-error - Missing required title field
          invalid.info = { version: '1.0.0' }
          break
        case 'paths':
          // @ts-expect-error - Invalid path structure
          invalid.paths = 'invalid-paths'
          break
      }
    })
    
    return { ...spec, ...invalid }
  }
  
  /**
   * Creates OpenAPI spec with related service configuration
   */
  createWithRelations(relations: Record<string, unknown>): OpenAPISpec {
    const spec = this.create()
    
    if (relations.service) {
      const service = relations.service as Service
      spec['x-dreamfactory'] = {
        ...spec['x-dreamfactory']!,
        serviceId: service.id,
        serviceName: service.name,
        serviceType: service.type
      }
    }
    
    if (relations.endpoints) {
      const endpoints = relations.endpoints as EndpointConfig[]
      spec.paths = this.createPathsFromEndpoints(endpoints)
    }
    
    return spec
  }
  
  /**
   * Creates realistic API paths with full CRUD operations
   */
  private createPaths(): Record<string, OpenAPIPath> {
    return {
      '/users': {
        get: this.createOperation('get', 'users', 'Get all users'),
        post: this.createOperation('post', 'users', 'Create a new user')
      },
      '/users/{id}': {
        get: this.createOperation('get', 'users', 'Get user by ID'),
        put: this.createOperation('put', 'users', 'Update user'),
        patch: this.createOperation('patch', 'users', 'Partially update user'),
        delete: this.createOperation('delete', 'users', 'Delete user'),
        parameters: [{
          name: 'id',
          in: 'path',
          required: true,
          description: 'User ID',
          schema: { type: 'integer', minimum: 1 }
        }]
      },
      '/products': {
        get: this.createOperation('get', 'products', 'Get all products'),
        post: this.createOperation('post', 'products', 'Create a new product')
      },
      '/products/{id}': {
        get: this.createOperation('get', 'products', 'Get product by ID'),
        put: this.createOperation('put', 'products', 'Update product'),
        delete: this.createOperation('delete', 'products', 'Delete product'),
        parameters: [{
          name: 'id',
          in: 'path',
          required: true,
          description: 'Product ID',
          schema: { type: 'integer', minimum: 1 }
        }]
      },
      '/orders': {
        get: this.createOperation('get', 'orders', 'Get all orders'),
        post: this.createOperation('post', 'orders', 'Create a new order')
      }
    }
  }
  
  /**
   * Creates OpenAPI operation for specific HTTP method and resource
   */
  private createOperation(method: string, resource: string, summary: string): OpenAPIOperation {
    const operation: OpenAPIOperation = {
      operationId: `${method}${resource.charAt(0).toUpperCase() + resource.slice(1)}`,
      summary,
      description: `${summary} with comprehensive validation and error handling`,
      tags: [resource],
      responses: {
        '200': {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: method === 'get' && !summary.includes('by ID') 
                ? { 
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: `#/components/schemas/${resource.slice(0, -1)}` }
                      },
                      meta: { $ref: '#/components/schemas/PaginationMeta' }
                    }
                  }
                : { $ref: `#/components/schemas/${resource.slice(0, -1)}` }
            }
          }
        },
        '400': { $ref: '#/components/responses/BadRequest' },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '404': { $ref: '#/components/responses/NotFound' },
        '422': { $ref: '#/components/responses/ValidationError' },
        '500': { $ref: '#/components/responses/InternalServerError' }
      },
      security: [{ apiKey: [] }, { bearerAuth: [] }]
    }
    
    // Add request body for POST and PUT operations
    if (['post', 'put', 'patch'].includes(method)) {
      operation.requestBody = {
        required: method !== 'patch',
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/${resource.slice(0, -1)}Input` }
          }
        }
      }
    }
    
    // Add query parameters for GET operations
    if (method === 'get' && !summary.includes('by ID')) {
      operation.parameters = [
        {
          name: 'limit',
          in: 'query',
          description: 'Number of items to return',
          schema: { type: 'integer', minimum: 1, maximum: 1000, default: 25 }
        },
        {
          name: 'offset',
          in: 'query',
          description: 'Number of items to skip',
          schema: { type: 'integer', minimum: 0, default: 0 }
        },
        {
          name: 'filter',
          in: 'query',
          description: 'SQL-style filter conditions',
          schema: { type: 'string' }
        },
        {
          name: 'fields',
          in: 'query',
          description: 'Comma-separated list of fields to return',
          schema: { type: 'string' }
        },
        {
          name: 'order',
          in: 'query',
          description: 'Field to order by',
          schema: { type: 'string' }
        }
      ]
    }
    
    return operation
  }
  
  /**
   * Creates reusable schema components
   */
  private createSchemas(): Record<string, OpenAPISchema> {
    return {
      User: {
        type: 'object',
        required: ['id', 'email', 'first_name', 'last_name'],
        properties: {
          id: { type: 'integer', readOnly: true, example: 1 },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          first_name: { type: 'string', minLength: 1, maxLength: 50, example: 'John' },
          last_name: { type: 'string', minLength: 1, maxLength: 50, example: 'Doe' },
          phone: { type: 'string', nullable: true, example: '+1-555-123-4567' },
          is_active: { type: 'boolean', default: true },
          created_date: { type: 'string', format: 'date-time', readOnly: true },
          last_modified_date: { type: 'string', format: 'date-time', readOnly: true }
        }
      },
      UserInput: {
        type: 'object',
        required: ['email', 'first_name', 'last_name'],
        properties: {
          email: { type: 'string', format: 'email' },
          first_name: { type: 'string', minLength: 1, maxLength: 50 },
          last_name: { type: 'string', minLength: 1, maxLength: 50 },
          phone: { type: 'string', nullable: true },
          is_active: { type: 'boolean', default: true }
        }
      },
      Product: {
        type: 'object',
        required: ['id', 'name', 'price'],
        properties: {
          id: { type: 'integer', readOnly: true, example: 1 },
          name: { type: 'string', minLength: 1, maxLength: 100, example: 'Laptop' },
          description: { type: 'string', nullable: true, example: 'High-performance laptop' },
          price: { type: 'number', minimum: 0, example: 999.99 },
          category_id: { type: 'integer', example: 1 },
          in_stock: { type: 'boolean', default: true },
          created_date: { type: 'string', format: 'date-time', readOnly: true },
          last_modified_date: { type: 'string', format: 'date-time', readOnly: true }
        }
      },
      ProductInput: {
        type: 'object',
        required: ['name', 'price'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', nullable: true },
          price: { type: 'number', minimum: 0 },
          category_id: { type: 'integer' },
          in_stock: { type: 'boolean', default: true }
        }
      },
      Order: {
        type: 'object',
        required: ['id', 'user_id', 'total', 'status'],
        properties: {
          id: { type: 'integer', readOnly: true, example: 1 },
          user_id: { type: 'integer', example: 1 },
          total: { type: 'number', minimum: 0, example: 1299.98 },
          status: { 
            type: 'string', 
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            example: 'pending'
          },
          order_items: {
            type: 'array',
            items: { $ref: '#/components/schemas/OrderItem' }
          },
          created_date: { type: 'string', format: 'date-time', readOnly: true },
          last_modified_date: { type: 'string', format: 'date-time', readOnly: true }
        }
      },
      OrderItem: {
        type: 'object',
        required: ['product_id', 'quantity', 'price'],
        properties: {
          product_id: { type: 'integer', example: 1 },
          quantity: { type: 'integer', minimum: 1, example: 2 },
          price: { type: 'number', minimum: 0, example: 999.99 }
        }
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          count: { type: 'integer', example: 25 },
          offset: { type: 'integer', example: 0 },
          limit: { type: 'integer', example: 25 },
          total: { type: 'integer', example: 150 }
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
              code: { type: 'integer', example: 400 },
              message: { type: 'string', example: 'Bad Request' },
              details: { type: 'string', nullable: true }
            }
          }
        }
      },
      ValidationError: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message', 'validation_errors'],
            properties: {
              code: { type: 'integer', example: 422 },
              message: { type: 'string', example: 'Validation failed' },
              validation_errors: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['field', 'message'],
                  properties: {
                    field: { type: 'string', example: 'email' },
                    message: { type: 'string', example: 'Email is required' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  /**
   * Creates reusable response components
   */
  private createResponses(): Record<string, OpenAPIResponse> {
    return {
      BadRequest: {
        description: 'Bad Request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      Unauthorized: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      Forbidden: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ValidationError' }
          }
        }
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    }
  }
  
  /**
   * Creates reusable parameter components
   */
  private createParameters(): Record<string, OpenAPIParameter> {
    return {
      IdPath: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Resource ID',
        schema: { type: 'integer', minimum: 1 }
      },
      LimitQuery: {
        name: 'limit',
        in: 'query',
        description: 'Number of items to return',
        schema: { type: 'integer', minimum: 1, maximum: 1000, default: 25 }
      },
      OffsetQuery: {
        name: 'offset',
        in: 'query',
        description: 'Number of items to skip',
        schema: { type: 'integer', minimum: 0, default: 0 }
      },
      FilterQuery: {
        name: 'filter',
        in: 'query',
        description: 'SQL-style filter conditions',
        schema: { type: 'string' }
      }
    }
  }
  
  /**
   * Creates security scheme definitions
   */
  private createSecuritySchemes(): Record<string, any> {
    return {
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-DreamFactory-API-Key',
        description: 'API key for authentication'
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token authentication'
      }
    }
  }
  
  /**
   * Creates API documentation tags
   */
  private createTags(): Array<{ name: string; description?: string }> {
    return [
      { name: 'users', description: 'User management operations' },
      { name: 'products', description: 'Product catalog operations' },
      { name: 'orders', description: 'Order processing operations' }
    ]
  }
  
  /**
   * Creates paths from endpoint configurations
   */
  private createPathsFromEndpoints(endpoints: EndpointConfig[]): Record<string, OpenAPIPath> {
    const paths: Record<string, OpenAPIPath> = {}
    
    endpoints.forEach(endpoint => {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {}
      }
      
      const method = endpoint.method.toLowerCase() as keyof OpenAPIPath
      paths[endpoint.path][method] = this.createOperationFromEndpoint(endpoint)
    })
    
    return paths
  }
  
  /**
   * Creates OpenAPI operation from endpoint configuration
   */
  private createOperationFromEndpoint(endpoint: EndpointConfig): OpenAPIOperation {
    return {
      operationId: endpoint.operationId || `${endpoint.method.toLowerCase()}${endpoint.path.replace(/[^a-zA-Z0-9]/g, '')}`,
      summary: endpoint.description || `${endpoint.method} operation`,
      description: endpoint.description,
      tags: endpoint.tags || [],
      parameters: endpoint.pathParameters?.map(param => ({
        name: param.name,
        in: 'path' as const,
        required: param.required,
        description: param.description,
        schema: { type: param.type as any }
      })),
      requestBody: endpoint.requestBody,
      responses: endpoint.responses || {
        '200': { description: 'Successful operation' }
      },
      security: endpoint.security?.map(sec => ({ [sec.type]: [] }))
    }
  }
}

// =================================================================================================
// SERVICE CONFIGURATION FACTORIES
// =================================================================================================

/**
 * Service configuration factory for database service testing
 * Generates realistic service configurations with proper validation schemas
 */
export class ServiceConfigurationFactory implements TestFixtureFactory<Service> {
  private config: Required<FactoryConfig>
  private openApiFactory: OpenAPISpecificationFactory
  
  constructor(config: FactoryConfig = {}) {
    this.config = { ...DEFAULT_FACTORY_CONFIG, ...config }
    this.openApiFactory = new OpenAPISpecificationFactory(config)
  }
  
  /**
   * Creates a complete database service configuration
   */
  create(overrides: Partial<Service> = {}): Service {
    const baseService: Service = {
      id: 1,
      name: 'mysql_customers',
      label: 'Customer Database',
      description: 'MySQL database containing customer and order data',
      isActive: true,
      type: 'mysql',
      mutable: true,
      deletable: true,
      createdDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      lastModifiedDate: new Date().toISOString(),
      createdById: 1,
      lastModifiedById: 1,
      config: {
        host: 'localhost',
        port: 3306,
        database: 'customers',
        username: 'df_user',
        password: '***',
        driver: 'mysql',
        options: {
          charset: 'utf8mb4',
          collation: 'utf8mb4_unicode_ci'
        },
        attributes: {
          persistent: false,
          timeout: 30,
          retry_count: 3,
          ssl: {
            enabled: false
          }
        }
      },
      serviceDocByServiceId: null,
      refresh: false,
      status: 'active',
      health: {
        status: 'healthy',
        lastCheck: new Date().toISOString(),
        message: 'Connection established successfully',
        metrics: {
          responseTime: 45,
          errorRate: 0,
          throughput: 150
        }
      },
      cache: {
        lastUpdate: new Date().toISOString(),
        ttl: 300,
        invalidation: 'automatic'
      },
      openapi: {
        specUrl: '/api/v2/mysql_customers/_schema',
        generatedAt: new Date().toISOString(),
        version: '3.0.3',
        endpointCount: 24
      }
    }
    
    return { ...baseService, ...overrides }
  }
  
  /**
   * Creates multiple service configurations for testing
   */
  createMany(count: number, overrides: Partial<Service> = {}): Service[] {
    return Array.from({ length: count }, (_, index) => 
      this.create({
        ...overrides,
        id: index + 1,
        name: `${overrides.name || 'test_service'}_${index + 1}`,
        label: `${overrides.label || 'Test Service'} ${index + 1}`
      })
    )
  }
  
  /**
   * Creates invalid service configuration for error testing
   */
  createInvalid(invalidFields: (keyof Service)[] = ['name']): Partial<Service> {
    const service = this.create()
    const invalid: Partial<Service> = {}
    
    invalidFields.forEach(field => {
      switch (field) {
        case 'name':
          // @ts-expect-error - Invalid name for testing
          invalid.name = ''
          break
        case 'type':
          // @ts-expect-error - Invalid type for testing
          invalid.type = 'invalid_type'
          break
        case 'config':
          invalid.config = {}
          break
      }
    })
    
    return { ...service, ...invalid }
  }
  
  /**
   * Creates service with related OpenAPI specification
   */
  createWithRelations(relations: Record<string, unknown>): Service {
    const service = this.create()
    
    if (relations.openapi) {
      const openapi = relations.openapi as OpenAPISpec
      service.openapi = {
        specUrl: `/api/v2/${service.name}/_schema`,
        generatedAt: new Date().toISOString(),
        version: openapi.openapi,
        endpointCount: Object.keys(openapi.paths).length
      }
    }
    
    return service
  }
  
  /**
   * Creates service type configuration for form testing
   */
  createServiceType(type: ServiceCategory = 'database'): ServiceType {
    const serviceTypes: Record<ServiceCategory, ServiceType> = {
      database: {
        name: 'mysql',
        label: 'MySQL Database',
        description: 'MySQL database connector with full CRUD operations',
        group: 'database',
        class: 'DreamFactory\\Core\\Database\\Services\\MySQLService',
        configSchema: this.createDatabaseConfigSchema(),
        icon: 'database',
        color: '#4285f4',
        supportsMultipleInstances: true,
        minimumVersion: '4.0.0',
        licenseRequired: false,
        capabilities: {
          apiGeneration: true,
          realTime: false,
          transactions: true,
          batchOperations: true,
          eventScripts: true
        },
        react: {
          customFormComponent: 'DatabaseServiceForm',
          validationSchema: undefined, // Would contain Zod schema
          defaultValues: {
            host: 'localhost',
            port: 3306,
            driver: 'mysql'
          },
          fieldGroups: [
            {
              name: 'connection',
              label: 'Connection Settings',
              fields: ['host', 'port', 'database', 'username', 'password'],
              collapsible: false
            },
            {
              name: 'options',
              label: 'Advanced Options',
              fields: ['charset', 'collation', 'timeout'],
              collapsible: true
            }
          ]
        },
        nextjs: {
          apiRoutes: {
            test: '/api/services/test-connection',
            deploy: '/api/services/deploy',
            preview: '/api/services/preview',
            validate: '/api/services/validate'
          },
          ssrSupported: true,
          edgeCompatible: false
        }
      },
      email: {
        name: 'smtp',
        label: 'SMTP Email',
        description: 'SMTP email service for notifications',
        group: 'email',
        configSchema: [],
        capabilities: {}
      },
      file: {
        name: 's3',
        label: 'Amazon S3',
        description: 'Amazon S3 file storage service',
        group: 'file',
        configSchema: [],
        capabilities: {}
      },
      oauth: {
        name: 'oauth_google',
        label: 'Google OAuth',
        description: 'Google OAuth authentication provider',
        group: 'oauth',
        configSchema: [],
        capabilities: {}
      },
      ldap: {
        name: 'ldap',
        label: 'LDAP',
        description: 'LDAP directory service',
        group: 'ldap',
        configSchema: [],
        capabilities: {}
      },
      saml: {
        name: 'saml',
        label: 'SAML SSO',
        description: 'SAML single sign-on provider',
        group: 'saml',
        configSchema: [],
        capabilities: {}
      },
      script: {
        name: 'nodejs',
        label: 'Node.js Script',
        description: 'Server-side Node.js scripting',
        group: 'script',
        configSchema: [],
        capabilities: {}
      },
      cache: {
        name: 'redis',
        label: 'Redis Cache',
        description: 'Redis caching service',
        group: 'cache',
        configSchema: [],
        capabilities: {}
      },
      push: {
        name: 'fcm',
        label: 'Firebase Push',
        description: 'Firebase Cloud Messaging',
        group: 'push',
        configSchema: [],
        capabilities: {}
      },
      remote_web: {
        name: 'rest',
        label: 'REST Service',
        description: 'Remote REST web service',
        group: 'remote_web',
        configSchema: [],
        capabilities: {}
      },
      soap: {
        name: 'soap',
        label: 'SOAP Service',
        description: 'SOAP web service connector',
        group: 'soap',
        configSchema: [],
        capabilities: {}
      },
      rpc: {
        name: 'jsonrpc',
        label: 'JSON-RPC',
        description: 'JSON-RPC service connector',
        group: 'rpc',
        configSchema: [],
        capabilities: {}
      },
      http: {
        name: 'http',
        label: 'HTTP Service',
        description: 'Generic HTTP service connector',
        group: 'http',
        configSchema: [],
        capabilities: {}
      },
      api_key: {
        name: 'api_key',
        label: 'API Key Auth',
        description: 'API key authentication service',
        group: 'api_key',
        configSchema: [],
        capabilities: {}
      },
      jwt: {
        name: 'jwt',
        label: 'JWT Auth',
        description: 'JWT token authentication service',
        group: 'jwt',
        configSchema: [],
        capabilities: {}
      },
      custom: {
        name: 'custom',
        label: 'Custom Service',
        description: 'Custom service implementation',
        group: 'custom',
        configSchema: [],
        capabilities: {}
      }
    }
    
    return serviceTypes[type]
  }
  
  /**
   * Creates database service configuration schema for forms
   */
  private createDatabaseConfigSchema(): ServiceConfigSchema[] {
    return [
      {
        name: 'host',
        label: 'Host',
        type: 'string',
        description: 'Database server hostname or IP address',
        required: true,
        default: 'localhost',
        validation: {
          pattern: '^[a-zA-Z0-9.-]+$',
          minLength: 1,
          maxLength: 255
        },
        reactHookForm: {
          dependencies: ['port'],
          customValidation: (value: string) => {
            if (!value.trim()) return 'Host is required'
            return true
          },
          debounceMs: 300
        }
      },
      {
        name: 'port',
        label: 'Port',
        type: 'integer',
        description: 'Database server port number',
        required: true,
        default: 3306,
        validation: {
          min: 1,
          max: 65535
        }
      },
      {
        name: 'database',
        label: 'Database Name',
        type: 'string',
        description: 'Name of the database to connect to',
        required: true,
        validation: {
          minLength: 1,
          maxLength: 64,
          pattern: '^[a-zA-Z0-9_]+$'
        }
      },
      {
        name: 'username',
        label: 'Username',
        type: 'string',
        description: 'Database username',
        required: true,
        validation: {
          minLength: 1,
          maxLength: 32
        }
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        description: 'Database password',
        required: true,
        validation: {
          minLength: 1
        }
      },
      {
        name: 'charset',
        label: 'Character Set',
        type: 'picklist',
        description: 'Database character encoding',
        default: 'utf8mb4',
        picklist: [
          { label: 'UTF-8 MB4', value: 'utf8mb4' },
          { label: 'UTF-8', value: 'utf8' },
          { label: 'Latin1', value: 'latin1' }
        ]
      },
      {
        name: 'ssl_enabled',
        label: 'Enable SSL',
        type: 'boolean',
        description: 'Use SSL/TLS encryption for database connections',
        default: false
      },
      {
        name: 'ssl_cert',
        label: 'SSL Certificate',
        type: 'file_certificate',
        description: 'SSL certificate file for secure connections',
        conditional: {
          field: 'ssl_enabled',
          operator: 'equals',
          value: true
        }
      },
      {
        name: 'connection_timeout',
        label: 'Connection Timeout',
        type: 'integer',
        description: 'Connection timeout in seconds',
        default: 30,
        validation: {
          min: 5,
          max: 300
        }
      }
    ]
  }
  
  /**
   * Creates service row data for table display testing
   */
  createServiceRow(overrides: Partial<ServiceRow> = {}): ServiceRow {
    const baseRow: ServiceRow = {
      id: 1,
      name: 'mysql_customers',
      label: 'Customer Database',
      description: 'MySQL database for customer management',
      type: 'mysql',
      scripting: 'Yes',
      active: true,
      deletable: true,
      category: 'database',
      status: 'active',
      lastActivity: new Date().toISOString(),
      endpointCount: 24,
      healthStatus: 'healthy'
    }
    
    return { ...baseRow, ...overrides }
  }
}

// =================================================================================================
// API GENERATION FACTORIES
// =================================================================================================

/**
 * API generation workflow factory for testing generation wizards
 * Creates realistic generation steps, progress tracking, and results
 */
export class APIGenerationFactory {
  private config: Required<FactoryConfig>
  
  constructor(config: FactoryConfig = {}) {
    this.config = { ...DEFAULT_FACTORY_CONFIG, ...config }
  }
  
  /**
   * Creates generation step configuration for wizard testing
   */
  createGenerationStep(stepId: string, overrides: Partial<GenerationStep> = {}): GenerationStep {
    const steps: Record<string, GenerationStep> = {
      'service-selection': {
        id: 'service-selection',
        name: 'serviceSelection',
        title: 'Select Database Service',
        description: 'Choose the database service to generate APIs for',
        order: 1,
        required: true,
        completed: false,
        valid: false,
        errors: [],
        data: {},
        component: 'ServiceSelectionStep',
        navigation: {
          next: 'schema-discovery',
          canSkip: false,
          canGoBack: false
        },
        config: {
          defaultValues: {
            serviceId: null
          },
          dependencies: []
        },
        progress: {
          current: 1,
          total: 5,
          percentage: 20
        }
      },
      'schema-discovery': {
        id: 'schema-discovery',
        name: 'schemaDiscovery',
        title: 'Discover Database Schema',
        description: 'Analyze database structure and select tables for API generation',
        order: 2,
        required: true,
        completed: false,
        valid: false,
        errors: [],
        data: {},
        component: 'SchemaDiscoveryStep',
        navigation: {
          previous: 'service-selection',
          next: 'endpoint-configuration',
          canSkip: false,
          canGoBack: true
        },
        config: {
          defaultValues: {
            selectedTables: [],
            includeViews: false,
            includeRelationships: true
          },
          dependencies: ['serviceId']
        },
        progress: {
          current: 2,
          total: 5,
          percentage: 40
        }
      },
      'endpoint-configuration': {
        id: 'endpoint-configuration',
        name: 'endpointConfiguration',
        title: 'Configure API Endpoints',
        description: 'Customize endpoint behavior and parameters',
        order: 3,
        required: true,
        completed: false,
        valid: false,
        errors: [],
        data: {},
        component: 'EndpointConfigurationStep',
        navigation: {
          previous: 'schema-discovery',
          next: 'security-configuration',
          canSkip: false,
          canGoBack: true
        },
        config: {
          defaultValues: {
            enableCaching: true,
            enablePagination: true,
            defaultLimit: 25,
            maxLimit: 1000
          },
          dependencies: ['selectedTables']
        },
        progress: {
          current: 3,
          total: 5,
          percentage: 60
        }
      },
      'security-configuration': {
        id: 'security-configuration',
        name: 'securityConfiguration',
        title: 'Security Settings',
        description: 'Configure authentication and authorization',
        order: 4,
        required: false,
        completed: false,
        valid: true,
        errors: [],
        data: {},
        component: 'SecurityConfigurationStep',
        navigation: {
          previous: 'endpoint-configuration',
          next: 'review-generate',
          canSkip: true,
          canGoBack: true
        },
        config: {
          defaultValues: {
            requireAuthentication: true,
            defaultRole: 'api_user',
            enableRateLimit: false
          },
          dependencies: []
        },
        progress: {
          current: 4,
          total: 5,
          percentage: 80
        }
      },
      'review-generate': {
        id: 'review-generate',
        name: 'reviewGenerate',
        title: 'Review & Generate',
        description: 'Review configuration and generate API endpoints',
        order: 5,
        required: true,
        completed: false,
        valid: false,
        errors: [],
        data: {},
        component: 'ReviewGenerateStep',
        navigation: {
          previous: 'security-configuration',
          canSkip: false,
          canGoBack: true
        },
        config: {
          defaultValues: {},
          dependencies: ['serviceId', 'selectedTables']
        },
        progress: {
          current: 5,
          total: 5,
          percentage: 100
        }
      }
    }
    
    const step = steps[stepId] || steps['service-selection']
    return { ...step, ...overrides }
  }
  
  /**
   * Creates wizard state for testing state management
   */
  createWizardState(overrides: Partial<WizardState> = {}): WizardState {
    const steps = [
      'service-selection',
      'schema-discovery', 
      'endpoint-configuration',
      'security-configuration',
      'review-generate'
    ]
    
    const stepConfigs = steps.reduce((acc, stepId) => {
      acc[stepId] = this.createGenerationStep(stepId)
      return acc
    }, {} as Record<string, GenerationStep>)
    
    const baseState: WizardState = {
      currentStep: 'service-selection',
      steps: stepConfigs,
      stepOrder: steps,
      status: 'idle',
      progress: {
        current: 1,
        total: 5,
        percentage: 20,
        completedSteps: []
      },
      data: {
        serviceId: null,
        selectedTables: [],
        endpointConfig: {},
        securityConfig: {},
        generationOptions: {}
      },
      validation: {
        valid: false,
        errors: {},
        touched: {}
      },
      navigation: {
        canGoNext: false,
        canGoPrevious: false,
        canFinish: false,
        canCancel: true
      },
      react: {
        actions: {
          setCurrentStep: () => {},
          updateStepData: () => {},
          validateStep: async () => true,
          nextStep: () => {},
          previousStep: () => {},
          reset: () => {}
        },
        cacheKeys: ['generation-wizard'],
        optimistic: true
      }
    }
    
    return { ...baseState, ...overrides }
  }
  
  /**
   * Creates generation progress for testing progress tracking
   */
  createGenerationProgress(overrides: Partial<GenerationProgress> = {}): GenerationProgress {
    const baseProgress: GenerationProgress = {
      id: 'gen_123456',
      serviceId: 1,
      phase: 'analyzing',
      progress: 45,
      operation: 'Discovering database schema',
      message: 'Analyzing table relationships...',
      startedAt: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
      metrics: {
        duration: 30000,
        endpointsGenerated: 0,
        specSize: 0,
        validationTime: 0
      }
    }
    
    return { ...baseProgress, ...overrides }
  }
  
  /**
   * Creates generation result for testing completion scenarios
   */
  createGenerationResult(overrides: Partial<GenerationResult> = {}): GenerationResult {
    const serviceFactory = new ServiceConfigurationFactory(this.config)
    const openApiFactory = new OpenAPISpecificationFactory(this.config)
    
    const baseResult: GenerationResult = {
      id: 'result_123456',
      serviceId: 1,
      status: 'success',
      message: 'API generation completed successfully',
      service: serviceFactory.create(),
      openapi: openApiFactory.create(),
      endpoints: this.createEndpointConfigs(),
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'admin@example.com',
        version: '1.0.0',
        source: 'DreamFactory Admin Interface',
        settings: {
          includeViews: false,
          enableCaching: true,
          enablePagination: true
        }
      },
      validation: {
        valid: true,
        errors: [],
        warnings: ['Consider adding rate limiting for production use'],
        suggestions: ['Enable caching for better performance']
      },
      performance: {
        totalTime: 4500, // 4.5 seconds
        phases: {
          discovery: 1200,
          generation: 2800,
          validation: 500
        },
        resourceUsage: {
          memory: 45, // MB
          cpu: 15 // %
        }
      }
    }
    
    return { ...baseResult, ...overrides }
  }
  
  /**
   * Creates endpoint configurations for testing
   */
  createEndpointConfigs(): EndpointConfig[] {
    return [
      {
        path: '/users',
        method: 'GET',
        description: 'Retrieve all users with pagination',
        operationId: 'getUsers',
        tags: ['users'],
        queryParameters: [
          {
            name: 'limit',
            type: 'integer',
            required: false,
            description: 'Number of items to return',
            default: 25
          },
          {
            name: 'offset',
            type: 'integer',
            required: false,
            description: 'Number of items to skip',
            default: 0
          }
        ],
        responses: {
          '200': {
            description: 'Successful operation',
            contentType: 'application/json'
          }
        },
        security: [
          {
            type: 'apiKey',
            name: 'X-DreamFactory-API-Key',
            in: 'header'
          }
        ],
        caching: {
          enabled: true,
          ttl: 300,
          varyBy: ['limit', 'offset']
        }
      },
      {
        path: '/users',
        method: 'POST',
        description: 'Create a new user',
        operationId: 'createUser',
        tags: ['users'],
        requestBody: {
          required: true,
          contentType: 'application/json',
          schema: {
            type: 'object',
            required: ['email', 'first_name', 'last_name'],
            properties: {
              email: { type: 'string', format: 'email' },
              first_name: { type: 'string' },
              last_name: { type: 'string' }
            }
          }
        },
        responses: {
          '201': {
            description: 'User created successfully'
          },
          '422': {
            description: 'Validation error'
          }
        }
      }
    ]
  }
  
  /**
   * Creates deployment configuration for testing
   */
  createDeploymentConfig(overrides: Partial<ServiceDeploymentConfig> = {}): ServiceDeploymentConfig {
    const baseConfig: ServiceDeploymentConfig = {
      target: 'serverless',
      environment: 'development',
      resources: {
        memory: '512MB',
        timeout: '30s',
        concurrency: 100,
        runtime: 'nodejs20.x'
      },
      envVars: {
        NODE_ENV: 'development',
        DATABASE_URL: 'mysql://localhost:3306/test',
        API_BASE_URL: 'https://api.example.com'
      },
      scaling: {
        minInstances: 0,
        maxInstances: 10,
        targetCPU: 70,
        targetMemory: 80
      },
      healthCheck: {
        path: '/health',
        method: 'GET',
        timeout: 5,
        interval: 30,
        threshold: 3
      },
      monitoring: {
        metrics: true,
        logs: true,
        traces: true,
        alerts: [
          {
            type: 'error_rate',
            threshold: 5,
            action: 'email'
          }
        ]
      },
      nextjs: {
        apiRoute: {
          path: '/api/v2/mysql_customers',
          dynamic: true,
          middleware: ['auth', 'cors']
        },
        edge: {
          regions: ['us-east-1', 'eu-west-1'],
          runtime: 'edge'
        },
        build: {
          outputStandalone: true,
          experimental: {
            serverComponentsExternalPackages: ['mysql2']
          }
        }
      },
      security: {
        cors: {
          origins: ['https://app.example.com'],
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          headers: ['Content-Type', 'Authorization'],
          credentials: true
        },
        rateLimit: {
          requests: 100,
          period: 'minute',
          burst: 20
        },
        authentication: {
          required: true,
          methods: ['apiKey', 'jwt']
        }
      }
    }
    
    return { ...baseConfig, ...overrides }
  }
  
  /**
   * Creates deployment status for testing deployment tracking
   */
  createDeploymentStatus(overrides: Partial<DeploymentStatus> = {}): DeploymentStatus {
    const baseStatus: DeploymentStatus = {
      id: 'deploy_123456',
      serviceId: 1,
      status: 'deployed',
      message: 'Service deployed successfully',
      deployedAt: new Date().toISOString(),
      url: 'https://api.example.com/v2/mysql_customers',
      health: 'healthy',
      metrics: {
        buildTime: 120000, // 2 minutes
        deployTime: 45000, // 45 seconds
        memoryUsage: 256, // MB
        cpuUsage: 15, // %
        requestCount: 1250,
        errorRate: 0.2 // %
      },
      rollback: {
        available: true,
        previousVersion: '1.0.0',
        reason: 'Performance degradation detected'
      },
      logs: {
        build: [
          'Building Next.js application...',
          'Compiling TypeScript...',
          'Optimizing bundle...',
          'Build completed successfully'
        ],
        runtime: [
          'Service started on port 3000',
          'Database connection established',
          'Health check endpoint responding'
        ],
        errors: []
      }
    }
    
    return { ...baseStatus, ...overrides }
  }
}

// =================================================================================================
// USER INTERACTION FACTORIES
// =================================================================================================

/**
 * User interaction scenario factory for testing form submissions and workflows
 * Creates realistic user interaction patterns for comprehensive testing
 */
export class UserInteractionFactory {
  private config: Required<FactoryConfig>
  
  constructor(config: FactoryConfig = {}) {
    this.config = { ...DEFAULT_FACTORY_CONFIG, ...config }
  }
  
  /**
   * Creates form interaction scenario for database connection testing
   */
  createDatabaseConnectionInteraction(): TestScenario {
    return {
      name: 'Database Connection Form Interaction',
      props: {
        serviceType: 'mysql',
        mode: 'create'
      },
      setup: async () => {
        // Setup mock API responses
      },
      expectations: {
        render: true,
        accessibility: true,
        performance: true,
        interactions: true
      },
      mocks: {},
      queries: {
        serviceTypes: {
          data: [
            {
              name: 'mysql',
              label: 'MySQL',
              group: 'database'
            }
          ]
        }
      }
    }
  }
  
  /**
   * Creates API generation workflow interaction scenario
   */
  createAPIGenerationInteraction(): TestScenario {
    return {
      name: 'API Generation Wizard Interaction',
      props: {
        serviceId: 1,
        initialStep: 'service-selection'
      },
      setup: async () => {
        // Setup wizard state and mocks
      },
      expectations: {
        render: true,
        accessibility: true,
        performance: true,
        interactions: true
      },
      mocks: {},
      queries: {
        wizardState: {
          data: new APIGenerationFactory(this.config).createWizardState()
        }
      }
    }
  }
  
  /**
   * Creates form validation interaction scenario
   */
  createFormValidationInteraction(): TestScenario {
    return {
      name: 'Form Validation Interaction',
      props: {
        validationRules: {
          host: { required: true, pattern: /^[a-zA-Z0-9.-]+$/ },
          port: { required: true, min: 1, max: 65535 },
          database: { required: true, minLength: 1 }
        }
      },
      expectations: {
        render: true,
        accessibility: true,
        performance: true,
        interactions: true
      },
      mocks: {},
      queries: {}
    }
  }
  
  /**
   * Creates error handling interaction scenario
   */
  createErrorHandlingInteraction(): TestScenario {
    return {
      name: 'Error Handling Interaction',
      props: {
        errorType: 'validation',
        errorMessage: 'Connection failed: Invalid credentials'
      },
      expectations: {
        render: true,
        accessibility: true,
        performance: true,
        interactions: true
      },
      mocks: {},
      queries: {}
    }
  }
  
  /**
   * Creates loading state interaction scenario
   */
  createLoadingStateInteraction(): TestScenario {
    return {
      name: 'Loading State Interaction',
      props: {
        isLoading: true,
        loadingMessage: 'Testing database connection...'
      },
      expectations: {
        render: true,
        accessibility: true,
        performance: true,
        interactions: false
      },
      mocks: {},
      queries: {}
    }
  }
}

// =================================================================================================
// ERROR SCENARIO FACTORIES
// =================================================================================================

/**
 * Error scenario factory for comprehensive error handling testing
 * Creates various error conditions for robust testing coverage
 */
export class ErrorScenarioFactory {
  private config: Required<FactoryConfig>
  
  constructor(config: FactoryConfig = {}) {
    this.config = { ...DEFAULT_FACTORY_CONFIG, ...config }
  }
  
  /**
   * Creates service error scenarios
   */
  createServiceError(category: ServiceError['category'] = 'configuration'): ServiceError {
    const errors: Record<ServiceError['category'], ServiceError> = {
      configuration: {
        code: 'INVALID_CONFIGURATION',
        message: 'Service configuration is invalid',
        status: 400,
        category: 'configuration',
        context: {
          serviceId: 1,
          serviceName: 'mysql_customers',
          serviceType: 'mysql',
          operation: 'validate_config'
        },
        suggestions: [
          'Check database connection parameters',
          'Verify username and password',
          'Ensure database server is running'
        ],
        documentation: {
          title: 'Database Configuration Guide',
          url: 'https://docs.dreamfactory.com/database-config'
        },
        timestamp: new Date().toISOString(),
        requestId: 'req_123456'
      },
      connection: {
        code: 'CONNECTION_FAILED',
        message: 'Failed to connect to database server',
        status: 503,
        category: 'connection',
        context: {
          serviceId: 1,
          serviceName: 'mysql_customers',
          serviceType: 'mysql',
          operation: 'test_connection'
        },
        suggestions: [
          'Check network connectivity',
          'Verify server is running',
          'Check firewall settings'
        ],
        documentation: {
          title: 'Connection Troubleshooting',
          url: 'https://docs.dreamfactory.com/connection-troubleshooting'
        },
        timestamp: new Date().toISOString(),
        requestId: 'req_123457'
      },
      validation: {
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        status: 422,
        category: 'validation',
        context: {
          serviceId: 1,
          serviceName: 'mysql_customers',
          serviceType: 'mysql',
          operation: 'create_service'
        },
        suggestions: [
          'Review required fields',
          'Check data format requirements',
          'Ensure all constraints are met'
        ],
        documentation: {
          title: 'Validation Requirements',
          url: 'https://docs.dreamfactory.com/validation'
        },
        timestamp: new Date().toISOString(),
        requestId: 'req_123458'
      },
      deployment: {
        code: 'DEPLOYMENT_FAILED',
        message: 'Service deployment failed',
        status: 500,
        category: 'deployment',
        context: {
          serviceId: 1,
          serviceName: 'mysql_customers',
          serviceType: 'mysql',
          operation: 'deploy_service'
        },
        suggestions: [
          'Check deployment logs',
          'Verify resource availability',
          'Review deployment configuration'
        ],
        documentation: {
          title: 'Deployment Guide',
          url: 'https://docs.dreamfactory.com/deployment'
        },
        timestamp: new Date().toISOString(),
        requestId: 'req_123459'
      },
      generation: {
        code: 'GENERATION_FAILED',
        message: 'API generation failed',
        status: 500,
        category: 'generation',
        context: {
          serviceId: 1,
          serviceName: 'mysql_customers',
          serviceType: 'mysql',
          operation: 'generate_api'
        },
        suggestions: [
          'Check schema structure',
          'Verify table permissions',
          'Review generation settings'
        ],
        documentation: {
          title: 'API Generation Guide',
          url: 'https://docs.dreamfactory.com/api-generation'
        },
        timestamp: new Date().toISOString(),
        requestId: 'req_123460'
      }
    }
    
    return errors[category]
  }
  
  /**
   * Creates validation error scenarios
   */
  createValidationError(field: string = 'host'): ServiceValidationError {
    const errors: Record<string, ServiceValidationError> = {
      host: {
        field: 'host',
        message: 'Host is required and must be a valid hostname or IP address',
        code: 'INVALID_HOST',
        value: '',
        rule: 'required|hostname',
        suggestion: 'Enter a valid hostname like "localhost" or IP address like "192.168.1.1"'
      },
      port: {
        field: 'port',
        message: 'Port must be between 1 and 65535',
        code: 'INVALID_PORT',
        value: 70000,
        rule: 'integer|min:1|max:65535',
        suggestion: 'Enter a valid port number between 1 and 65535'
      },
      database: {
        field: 'database',
        message: 'Database name is required',
        code: 'MISSING_DATABASE',
        value: '',
        rule: 'required|string|min:1',
        suggestion: 'Enter the name of the database you want to connect to'
      },
      username: {
        field: 'username',
        message: 'Username is required',
        code: 'MISSING_USERNAME',
        value: '',
        rule: 'required|string|min:1',
        suggestion: 'Enter a valid database username'
      },
      password: {
        field: 'password',
        message: 'Password is required',
        code: 'MISSING_PASSWORD',
        value: '',
        rule: 'required|string|min:1',
        suggestion: 'Enter the password for the database user'
      }
    }
    
    return errors[field] || errors.host
  }
  
  /**
   * Creates generation error scenarios
   */
  createGenerationError(phase: GenerationError['phase'] = 'generation'): GenerationError {
    const baseError = this.createServiceError('generation') as GenerationError
    
    const phaseErrors: Record<GenerationError['phase'], Partial<GenerationError>> = {
      initialization: {
        phase: 'initialization',
        message: 'Failed to initialize API generation process',
        details: {
          source: 'GenerationOrchestrator',
          expected: 'Valid service configuration',
          actual: 'Missing service ID'
        }
      },
      analysis: {
        phase: 'analysis',
        message: 'Schema analysis failed',
        details: {
          source: 'SchemaAnalyzer',
          line: 1,
          column: 1,
          expected: 'Readable database schema',
          actual: 'Permission denied'
        }
      },
      generation: {
        phase: 'generation',
        message: 'API endpoint generation failed',
        details: {
          source: 'EndpointGenerator',
          expected: 'Valid table metadata',
          actual: 'Corrupted schema data'
        }
      },
      validation: {
        phase: 'validation',
        message: 'Generated API validation failed',
        details: {
          source: 'OpenAPIValidator',
          line: 45,
          column: 12,
          expected: 'Valid OpenAPI specification',
          actual: 'Invalid schema reference'
        }
      },
      deployment: {
        phase: 'deployment',
        message: 'API deployment failed',
        details: {
          source: 'DeploymentManager',
          expected: 'Successful deployment',
          actual: 'Resource limit exceeded'
        }
      }
    }
    
    return {
      ...baseError,
      ...phaseErrors[phase],
      recovery: {
        canRetry: phase !== 'deployment',
        canModify: true,
        autoRecover: phase === 'validation'
      }
    }
  }
  
  /**
   * Creates network error scenarios for testing
   */
  createNetworkErrors(): Record<string, any> {
    return {
      timeout: {
        code: 'NETWORK_TIMEOUT',
        message: 'Request timed out',
        status: 408,
        cause: 'Network timeout after 30 seconds'
      },
      connectionRefused: {
        code: 'CONNECTION_REFUSED',
        message: 'Connection refused',
        status: 503,
        cause: 'Unable to connect to database server'
      },
      unauthorizedAccess: {
        code: 'UNAUTHORIZED_ACCESS',
        message: 'Access denied',
        status: 401,
        cause: 'Invalid authentication credentials'
      },
      serverUnavailable: {
        code: 'SERVER_UNAVAILABLE',
        message: 'Server temporarily unavailable',
        status: 503,
        cause: 'Database server is down for maintenance'
      }
    }
  }
}

// =================================================================================================
// MSW HANDLER FACTORIES
// =================================================================================================

/**
 * MSW handler factory for API mocking during testing
 * Creates realistic API response handlers for comprehensive testing scenarios
 */
export class MSWHandlerFactory {
  private config: Required<FactoryConfig>
  private serviceFactory: ServiceConfigurationFactory
  private openApiFactory: OpenAPISpecificationFactory
  private errorFactory: ErrorScenarioFactory
  
  constructor(config: FactoryConfig = {}) {
    this.config = { ...DEFAULT_FACTORY_CONFIG, ...config }
    this.serviceFactory = new ServiceConfigurationFactory(config)
    this.openApiFactory = new OpenAPISpecificationFactory(config)
    this.errorFactory = new ErrorScenarioFactory(config)
  }
  
  /**
   * Creates API mock generators for consistent response patterns
   */
  createApiMockGenerators(): ApiMockGenerators {
    return {
      successResponse: <T>(data: T, meta?: Record<string, unknown>): ApiResponse<T> => ({
        resource: Array.isArray(data) ? data : [data],
        meta: {
          count: Array.isArray(data) ? data.length : 1,
          ...meta
        }
      }),
      
      errorResponse: (error: Partial<ApiError>): ApiError => ({
        code: 'GENERIC_ERROR',
        message: 'An error occurred',
        status: 500,
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
        ...error
      }),
      
      listResponse: <T>(items: T[], total?: number, offset?: number): ApiResponse<T[]> => ({
        resource: items,
        meta: {
          count: items.length,
          offset: offset || 0,
          limit: items.length,
          total: total || items.length
        }
      }),
      
      paginatedResponse: <T>(
        items: T[],
        page: number,
        limit: number,
        total: number
      ): ApiResponse<T[]> => ({
        resource: items,
        meta: {
          count: items.length,
          offset: (page - 1) * limit,
          limit,
          total
        }
      }),
      
      validationErrorResponse: (field: string, message: string): ApiError => ({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        status: 422,
        details: {
          validation_errors: [{ field, message }]
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`
      }),
      
      authErrorResponse: (type: 'unauthorized' | 'forbidden'): ApiError => {
        const errors = {
          unauthorized: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            status: 401
          },
          forbidden: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
            status: 403
          }
        }
        
        return {
          ...errors[type],
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`
        }
      },
      
      serverErrorResponse: (message?: string): ApiError => ({
        code: 'INTERNAL_SERVER_ERROR',
        message: message || 'Internal server error',
        status: 500,
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`
      })
    }
  }
  
  /**
   * Creates service API handlers for testing
   */
  createServiceHandlers(): MSWHandler[] {
    // Note: This would typically use the actual MSW rest object
    // For type safety, we're returning a mock structure
    const handlers: any[] = [
      // GET /api/v2/system/service
      {
        method: 'GET',
        path: '/api/v2/system/service',
        resolver: () => {
          const services = this.serviceFactory.createMany(5)
          return {
            json: this.createApiMockGenerators().listResponse(services)
          }
        }
      },
      
      // POST /api/v2/system/service
      {
        method: 'POST',
        path: '/api/v2/system/service',
        resolver: (req: any) => {
          const service = this.serviceFactory.create(req.body)
          return {
            status: 201,
            json: this.createApiMockGenerators().successResponse(service)
          }
        }
      },
      
      // GET /api/v2/system/service/:id
      {
        method: 'GET',
        path: '/api/v2/system/service/:id',
        resolver: (req: any) => {
          const service = this.serviceFactory.create({ id: parseInt(req.params.id) })
          return {
            json: this.createApiMockGenerators().successResponse(service)
          }
        }
      },
      
      // PUT /api/v2/system/service/:id
      {
        method: 'PUT',
        path: '/api/v2/system/service/:id',
        resolver: (req: any) => {
          const service = this.serviceFactory.create({
            id: parseInt(req.params.id),
            ...req.body
          })
          return {
            json: this.createApiMockGenerators().successResponse(service)
          }
        }
      },
      
      // DELETE /api/v2/system/service/:id
      {
        method: 'DELETE',
        path: '/api/v2/system/service/:id',
        resolver: () => {
          return {
            status: 204
          }
        }
      },
      
      // POST /api/v2/system/service/:id/_test
      {
        method: 'POST',
        path: '/api/v2/system/service/:id/_test',
        resolver: () => {
          return {
            json: this.createApiMockGenerators().successResponse({
              success: true,
              message: 'Connection test successful',
              responseTime: 45
            })
          }
        }
      },
      
      // GET /api/v2/:service/_schema
      {
        method: 'GET',
        path: '/api/v2/:service/_schema',
        resolver: () => {
          const openapi = this.openApiFactory.create()
          return {
            json: this.createApiMockGenerators().successResponse(openapi)
          }
        }
      }
    ]
    
    return handlers as MSWHandler[]
  }
  
  /**
   * Creates error scenario handlers for testing error conditions
   */
  createErrorHandlers(): MSWHandler[] {
    const handlers: any[] = [
      // Connection timeout
      {
        method: 'POST',
        path: '/api/v2/system/service/timeout/_test',
        resolver: () => {
          return {
            status: 408,
            json: this.errorFactory.createNetworkErrors().timeout
          }
        }
      },
      
      // Validation error
      {
        method: 'POST',
        path: '/api/v2/system/service/invalid',
        resolver: () => {
          return {
            status: 422,
            json: this.createApiMockGenerators().validationErrorResponse('host', 'Host is required')
          }
        }
      },
      
      // Server error
      {
        method: 'GET',
        path: '/api/v2/system/service/error',
        resolver: () => {
          return {
            status: 500,
            json: this.createApiMockGenerators().serverErrorResponse()
          }
        }
      }
    ]
    
    return handlers as MSWHandler[]
  }
  
  /**
   * Creates performance testing handlers with delays
   */
  createPerformanceHandlers(): MSWHandler[] {
    const handlers: any[] = [
      // Slow response simulation
      {
        method: 'GET',
        path: '/api/v2/system/service/slow',
        resolver: async () => {
          await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
          return {
            json: this.createApiMockGenerators().successResponse({ slow: true })
          }
        }
      },
      
      // Large dataset simulation
      {
        method: 'GET',
        path: '/api/v2/system/service/large',
        resolver: () => {
          const services = this.serviceFactory.createMany(1000)
          return {
            json: this.createApiMockGenerators().listResponse(services)
          }
        }
      }
    ]
    
    return handlers as MSWHandler[]
  }
}

// =================================================================================================
// PERFORMANCE TESTING FACTORIES
// =================================================================================================

/**
 * Performance testing data factory for build time optimization testing
 * Creates metrics and benchmarks for performance validation
 */
export class PerformanceTestingFactory {
  private config: Required<FactoryConfig>
  
  constructor(config: FactoryConfig = {}) {
    this.config = { ...DEFAULT_FACTORY_CONFIG, ...config }
  }
  
  /**
   * Creates performance metrics for component testing
   */
  createPerformanceMetrics(overrides: Partial<PerformanceMetrics> = {}): PerformanceMetrics {
    const baseMetrics: PerformanceMetrics = {
      renderTime: 45, // milliseconds
      mountTime: 120,
      updateTime: 25,
      unmountTime: 15,
      memoryUsage: 12.5, // MB
      bundleSize: 145000, // bytes
      cacheHitRate: 85 // percentage
    }
    
    return { ...baseMetrics, ...overrides }
  }
  
  /**
   * Creates performance benchmark data for comparison
   */
  createPerformanceBenchmarks(): Record<string, PerformanceMetrics> {
    return {
      baseline: this.createPerformanceMetrics(),
      optimized: this.createPerformanceMetrics({
        renderTime: 32,
        mountTime: 95,
        updateTime: 18,
        bundleSize: 125000,
        cacheHitRate: 92
      }),
      regression: this.createPerformanceMetrics({
        renderTime: 78,
        mountTime: 180,
        updateTime: 45,
        bundleSize: 185000,
        cacheHitRate: 65
      })
    }
  }
  
  /**
   * Creates large dataset for virtual scrolling performance testing
   */
  createLargeDataset(size: number = 1000): any[] {
    return Array.from({ length: size }, (_, index) => ({
      id: index + 1,
      name: `Item ${index + 1}`,
      description: `Description for item ${index + 1}`,
      value: Math.random() * 1000,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
    }))
  }
  
  /**
   * Creates performance test scenarios
   */
  createPerformanceScenarios(): TestScenario[] {
    return [
      {
        name: 'Component Render Performance',
        props: {
          data: this.createLargeDataset(100)
        },
        expectations: {
          render: true,
          accessibility: false,
          performance: true,
          interactions: false
        },
        mocks: {},
        queries: {}
      },
      {
        name: 'Virtual Scrolling Performance',
        props: {
          data: this.createLargeDataset(1000),
          virtualized: true
        },
        expectations: {
          render: true,
          accessibility: false,
          performance: true,
          interactions: true
        },
        mocks: {},
        queries: {}
      },
      {
        name: 'Form Validation Performance',
        props: {
          validationMode: 'onChange',
          debounceMs: 100
        },
        expectations: {
          render: true,
          accessibility: false,
          performance: true,
          interactions: true
        },
        mocks: {},
        queries: {}
      }
    ]
  }
}

// =================================================================================================
// ACCESSIBILITY TESTING FACTORIES
// =================================================================================================

/**
 * Accessibility testing factory for WCAG 2.1 AA compliance testing
 * Creates test data and scenarios for comprehensive accessibility validation
 */
export class AccessibilityTestingFactory {
  private config: Required<FactoryConfig>
  
  constructor(config: FactoryConfig = {}) {
    this.config = { ...DEFAULT_FACTORY_CONFIG, ...config }
  }
  
  /**
   * Creates accessibility test configuration
   */
  createAccessibilityConfig(overrides: Partial<AccessibilityTestConfig> = {}): AccessibilityTestConfig {
    const baseConfig: AccessibilityTestConfig = {
      rules: {
        'color-contrast': true,
        'keyboard-navigation': true,
        'screen-reader': true,
        'focus-management': true,
        'aria-labels': true,
        'form-labels': true
      },
      exclude: [
        'third-party-widget',
        'legacy-component'
      ],
      include: [
        'form',
        'button',
        'input',
        'table',
        'navigation'
      ],
      level: 'AA',
      tags: ['wcag2a', 'wcag2aa', 'section508']
    }
    
    return { ...baseConfig, ...overrides }
  }
  
  /**
   * Creates accessibility test scenarios
   */
  createAccessibilityScenarios(): TestScenario[] {
    return [
      {
        name: 'Form Accessibility',
        props: {
          formType: 'database-connection',
          includeLabels: true,
          includeErrorMessages: true
        },
        expectations: {
          render: true,
          accessibility: true,
          performance: false,
          interactions: true
        },
        mocks: {},
        queries: {}
      },
      {
        name: 'Navigation Accessibility',
        props: {
          navigationType: 'breadcrumb',
          includeSkipLinks: true
        },
        expectations: {
          render: true,
          accessibility: true,
          performance: false,
          interactions: true
        },
        mocks: {},
        queries: {}
      },
      {
        name: 'Table Accessibility',
        props: {
          tableType: 'service-list',
          includeSortHeaders: true,
          includeRowHeaders: true
        },
        expectations: {
          render: true,
          accessibility: true,
          performance: false,
          interactions: true
        },
        mocks: {},
        queries: {}
      }
    ]
  }
  
  /**
   * Creates keyboard navigation test data
   */
  createKeyboardNavigationTests(): Record<string, string[]> {
    return {
      tabOrder: ['Tab', 'Tab', 'Tab', 'Tab'],
      escapeAction: ['Escape'],
      enterAction: ['Enter'],
      arrowNavigation: ['ArrowDown', 'ArrowDown', 'ArrowUp'],
      homeEnd: ['Home', 'End'],
      pageNavigation: ['PageDown', 'PageUp']
    }
  }
}

// =================================================================================================
// COMPREHENSIVE FACTORY AGGREGATOR
// =================================================================================================

/**
 * Comprehensive factory aggregator providing all testing utilities
 * Serves as the main entry point for test data generation
 */
export class APIDocsTestDataFactory {
  private config: Required<FactoryConfig>
  
  public readonly openapi: OpenAPISpecificationFactory
  public readonly service: ServiceConfigurationFactory
  public readonly generation: APIGenerationFactory
  public readonly interaction: UserInteractionFactory
  public readonly error: ErrorScenarioFactory
  public readonly msw: MSWHandlerFactory
  public readonly performance: PerformanceTestingFactory
  public readonly accessibility: AccessibilityTestingFactory
  
  constructor(config: FactoryConfig = {}) {
    this.config = { ...DEFAULT_FACTORY_CONFIG, ...config }
    
    // Initialize all factory instances
    this.openapi = new OpenAPISpecificationFactory(config)
    this.service = new ServiceConfigurationFactory(config)
    this.generation = new APIGenerationFactory(config)
    this.interaction = new UserInteractionFactory(config)
    this.error = new ErrorScenarioFactory(config)
    this.msw = new MSWHandlerFactory(config)
    this.performance = new PerformanceTestingFactory(config)
    this.accessibility = new AccessibilityTestingFactory(config)
  }
  
  /**
   * Creates comprehensive test suite data for API documentation component
   */
  createTestSuite(): {
    openapi: OpenAPISpec[]
    services: Service[]
    scenarios: TestScenario[]
    errors: ServiceError[]
    handlers: MSWHandler[]
    performance: PerformanceMetrics
    accessibility: AccessibilityTestConfig
  } {
    return {
      openapi: this.openapi.createMany(3),
      services: this.service.createMany(5),
      scenarios: [
        ...this.interaction.createDatabaseConnectionInteraction() ? [this.interaction.createDatabaseConnectionInteraction()] : [],
        ...this.interaction.createAPIGenerationInteraction() ? [this.interaction.createAPIGenerationInteraction()] : [],
        ...this.performance.createPerformanceScenarios(),
        ...this.accessibility.createAccessibilityScenarios()
      ],
      errors: [
        this.error.createServiceError('configuration'),
        this.error.createServiceError('validation'),
        this.error.createServiceError('generation')
      ],
      handlers: [
        ...this.msw.createServiceHandlers(),
        ...this.msw.createErrorHandlers(),
        ...this.msw.createPerformanceHandlers()
      ],
      performance: this.performance.createPerformanceMetrics(),
      accessibility: this.accessibility.createAccessibilityConfig()
    }
  }
  
  /**
   * Resets all factories to initial state for test isolation
   */
  reset(): void {
    // Reset any cached state or counters in factories
    // Implementation would depend on specific caching mechanisms
  }
  
  /**
   * Updates factory configuration at runtime
   */
  updateConfig(config: Partial<FactoryConfig>): void {
    Object.assign(this.config, config)
  }
}

// =================================================================================================
// DEFAULT EXPORT AND UTILITY FUNCTIONS
// =================================================================================================

/**
 * Default factory instance for convenient usage
 */
export const apiDocsTestDataFactory = new APIDocsTestDataFactory()

/**
 * Utility function to create factory with custom configuration
 */
export function createTestDataFactory(config: FactoryConfig = {}): APIDocsTestDataFactory {
  return new APIDocsTestDataFactory(config)
}

/**
 * Utility function to generate mock MSW handlers for common scenarios
 */
export function createMockHandlers(scenarios: string[] = ['success', 'error']): MSWHandler[] {
  const factory = new MSWHandlerFactory()
  const handlers: MSWHandler[] = []
  
  scenarios.forEach(scenario => {
    switch (scenario) {
      case 'success':
        handlers.push(...factory.createServiceHandlers())
        break
      case 'error':
        handlers.push(...factory.createErrorHandlers())
        break
      case 'performance':
        handlers.push(...factory.createPerformanceHandlers())
        break
    }
  })
  
  return handlers
}

/**
 * Utility function to create React Query test utilities
 */
export function createQueryTestData(): {
  queryKey: string[]
  queryData: Service[]
  mutationData: Partial<Service>
  errorData: ServiceError
} {
  const factory = new APIDocsTestDataFactory()
  
  return {
    queryKey: ['services'],
    queryData: factory.service.createMany(3),
    mutationData: { name: 'test_service', type: 'mysql' },
    errorData: factory.error.createServiceError('validation')
  }
}

/**
 * Export all factory classes for direct usage
 */
export {
  OpenAPISpecificationFactory,
  ServiceConfigurationFactory,
  APIGenerationFactory,
  UserInteractionFactory,
  ErrorScenarioFactory,
  MSWHandlerFactory,
  PerformanceTestingFactory,
  AccessibilityTestingFactory
}

/**
 * Export default factory configuration
 */
export { DEFAULT_FACTORY_CONFIG }

/**
 * @example
 * // Basic usage
 * import { apiDocsTestDataFactory } from './test-data-factories'
 * 
 * // Create OpenAPI specification for testing
 * const openapi = apiDocsTestDataFactory.openapi.create()
 * 
 * // Create service configuration
 * const service = apiDocsTestDataFactory.service.create({
 *   name: 'test_db',
 *   type: 'postgresql'
 * })
 * 
 * // Create test scenarios
 * const scenarios = apiDocsTestDataFactory.createTestSuite()
 * 
 * // Custom factory with different configuration
 * const customFactory = createTestDataFactory({
 *   realistic: false,
 *   seed: 54321
 * })
 * 
 * // MSW handlers for API mocking
 * const handlers = createMockHandlers(['success', 'error'])
 * 
 * // React Query test data
 * const queryTestData = createQueryTestData()
 */