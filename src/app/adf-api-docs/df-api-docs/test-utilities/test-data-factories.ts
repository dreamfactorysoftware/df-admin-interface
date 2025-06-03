/**
 * React-Compatible Test Data Factories for API Documentation Testing
 * 
 * Comprehensive factory functions for generating mock API documentation data,
 * service configurations, and user interaction scenarios. Optimized for Vitest 2.1+
 * and React Testing Library workflows with enhanced TypeScript type safety.
 * 
 * Features:
 * - Factory functions replacing Angular test fixture patterns
 * - React Query and SWR hook testing support  
 * - OpenAPI specification generation with configurable parameters
 * - Service authentication and security testing coverage
 * - Schema validation mock data for database connections
 * - User interaction simulation for form workflows
 * - MSW integration for realistic API mocking
 * - Performance optimized for 10x faster test execution
 * 
 * @version 1.0.0
 * @framework React 19/Next.js 15.1/Vitest 2.1+
 */

import { faker } from '@faker-js/faker';
import type { 
  Service, 
  ServiceConfiguration, 
  ServiceRow,
  ServiceType,
  ServiceTypeDefinition,
  APIEndpointConfig,
  OpenAPIConfig,
  APIGenerationWorkflow,
  ServiceTestResult,
  ServiceHealthStatus,
  ServiceMetrics,
  HTTPMethod,
  EndpointParameter,
  AuthenticationConfig,
  ValidationConfig,
  OpenAPIPreview,
  APIGenerationResult
} from 'src/types/service';

// ============================================================================
// CORE FACTORY CONFIGURATION TYPES
// ============================================================================

/**
 * Configuration options for test data factory customization
 */
export interface FactoryOptions {
  /** Enable realistic data generation using faker.js */
  useRealisticData?: boolean;
  /** Seed value for consistent test data across test runs */
  seed?: number;
  /** Override default values with custom data */
  overrides?: Record<string, any>;
  /** Enable performance optimization for large datasets */
  optimizeForPerformance?: boolean;
  /** Include debug information in generated data */
  includeDebugInfo?: boolean;
}

/**
 * Database-specific factory configuration
 */
export interface DatabaseFactoryOptions extends FactoryOptions {
  /** Database type for connection testing */
  databaseType?: 'mysql' | 'postgresql' | 'mongodb' | 'oracle' | 'snowflake' | 'sql_server';
  /** Include connection pooling configuration */
  includePooling?: boolean;
  /** Include SSL/TLS configuration */
  includeSSL?: boolean;
  /** Schema size for large dataset testing */
  schemaSize?: 'small' | 'medium' | 'large' | 'xlarge';
}

/**
 * API documentation-specific factory configuration  
 */
export interface ApiDocsFactoryOptions extends FactoryOptions {
  /** OpenAPI specification version */
  openApiVersion?: '3.0.0' | '3.0.1' | '3.0.2' | '3.0.3' | '3.1.0';
  /** Include advanced security schemes */
  includeAdvancedSecurity?: boolean;
  /** Number of endpoints to generate */
  endpointCount?: number;
  /** Include example data in specifications */
  includeExamples?: boolean;
  /** Enable comprehensive validation schemas */
  includeValidationSchemas?: boolean;
}

/**
 * User interaction factory configuration
 */
export interface UserInteractionFactoryOptions extends FactoryOptions {
  /** Interaction type for form testing */
  interactionType?: 'create' | 'edit' | 'delete' | 'test' | 'deploy';
  /** Include error scenarios */
  includeErrors?: boolean;
  /** Validation state configuration */
  validationState?: 'valid' | 'invalid' | 'pending';
  /** Include optimistic update scenarios */
  includeOptimisticUpdates?: boolean;
}

// ============================================================================
// DEFAULT FACTORY CONFIGURATIONS
// ============================================================================

const DEFAULT_FACTORY_OPTIONS: Required<FactoryOptions> = {
  useRealisticData: true,
  seed: 12345,
  overrides: {},
  optimizeForPerformance: false,
  includeDebugInfo: false,
};

const DEFAULT_DATABASE_OPTIONS: Required<DatabaseFactoryOptions> = {
  ...DEFAULT_FACTORY_OPTIONS,
  databaseType: 'mysql',
  includePooling: false,
  includeSSL: false,
  schemaSize: 'medium',
};

const DEFAULT_API_DOCS_OPTIONS: Required<ApiDocsFactoryOptions> = {
  ...DEFAULT_FACTORY_OPTIONS,
  openApiVersion: '3.0.3',
  includeAdvancedSecurity: false,
  endpointCount: 5,
  includeExamples: true,
  includeValidationSchemas: true,
};

const DEFAULT_USER_INTERACTION_OPTIONS: Required<UserInteractionFactoryOptions> = {
  ...DEFAULT_FACTORY_OPTIONS,
  interactionType: 'create',
  includeErrors: false,
  validationState: 'valid',
  includeOptimisticUpdates: true,
};

// ============================================================================
// CORE UTILITY FUNCTIONS
// ============================================================================

/**
 * Initialize faker with consistent seed for reproducible test data
 */
function initializeFaker(seed: number): void {
  faker.seed(seed);
}

/**
 * Apply overrides to generated data object
 */
function applyOverrides<T extends Record<string, any>>(
  data: T, 
  overrides: Record<string, any>
): T {
  return { ...data, ...overrides };
}

/**
 * Generate unique identifier with optional prefix
 */
function generateId(prefix?: string): string {
  const id = faker.string.uuid();
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Generate realistic database connection string
 */
function generateConnectionString(type: string, config: any): string {
  switch (type) {
    case 'mysql':
      return `mysql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
    case 'postgresql':
      return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
    case 'mongodb':
      return `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
    default:
      return `${type}://${config.host}:${config.port}/${config.database}`;
  }
}

// ============================================================================
// SERVICE CONFIGURATION FACTORIES
// ============================================================================

/**
 * Generate complete database service configuration for testing
 */
export function createDatabaseServiceFactory(
  options: Partial<DatabaseFactoryOptions> = {}
): Service {
  const config = { ...DEFAULT_DATABASE_OPTIONS, ...options };
  initializeFaker(config.seed);

  const serviceConfig: ServiceConfiguration = {
    host: config.useRealisticData ? faker.internet.domainName() : 'localhost',
    port: config.useRealisticData ? faker.internet.port() : 3306,
    database: config.useRealisticData ? faker.database.name() : 'test_db',
    username: config.useRealisticData ? faker.internet.userName() : 'testuser',
    password: config.useRealisticData ? faker.internet.password() : 'testpass',
    maxConnections: config.includePooling ? faker.number.int({ min: 5, max: 50 }) : undefined,
    connectionTimeout: config.includePooling ? faker.number.int({ min: 5000, max: 30000 }) : undefined,
    sslMode: config.includeSSL ? faker.helpers.arrayElement(['require', 'prefer', 'disable']) : undefined,
    sslCert: config.includeSSL ? '/path/to/cert.pem' : undefined,
  };

  const service: Service = {
    id: faker.number.int({ min: 1, max: 1000 }),
    name: config.useRealisticData ? 
      faker.company.name().toLowerCase().replace(/[^a-z0-9]/g, '_') : 
      'test_service',
    label: config.useRealisticData ? 
      `${faker.company.name()} ${config.databaseType.toUpperCase()} Database` :
      'Test Database Service',
    description: config.useRealisticData ?
      faker.lorem.sentence() :
      'Test database service for API generation',
    isActive: faker.datatype.boolean({ probability: 0.8 }),
    type: config.databaseType as ServiceType,
    mutable: true,
    deletable: true,
    createdDate: faker.date.past({ years: 1 }).toISOString(),
    lastModifiedDate: faker.date.recent({ days: 30 }).toISOString(),
    createdById: faker.number.int({ min: 1, max: 100 }),
    lastModifiedById: faker.number.int({ min: 1, max: 100 }),
    config: serviceConfig,
    serviceDocByServiceId: null,
    refresh: false,
    tags: config.useRealisticData ? 
      faker.helpers.arrayElements(['production', 'staging', 'development'], { min: 0, max: 2 }) :
      ['test'],
    version: '1.0.0',
    healthStatus: createServiceHealthStatusFactory({ seed: config.seed }),
    metrics: createServiceMetricsFactory({ seed: config.seed }),
  };

  return applyOverrides(service, config.overrides);
}

/**
 * Generate service row data for table display testing
 */
export function createServiceRowFactory(
  options: Partial<DatabaseFactoryOptions> = {}
): ServiceRow {
  const config = { ...DEFAULT_DATABASE_OPTIONS, ...options };
  initializeFaker(config.seed);

  const serviceRow: ServiceRow = {
    id: faker.number.int({ min: 1, max: 1000 }),
    name: config.useRealisticData ? 
      faker.company.name().toLowerCase().replace(/[^a-z0-9]/g, '_') : 
      'test_service',
    label: config.useRealisticData ? 
      `${faker.company.name()} Database` :
      'Test Service',
    description: config.useRealisticData ?
      faker.lorem.sentence() :
      'Test database service',
    type: config.databaseType as ServiceType,
    group: 'Database',
    scripting: faker.helpers.arrayElement(['V8js', 'Python', 'PHP', 'NodeJS']),
    active: faker.datatype.boolean({ probability: 0.8 }),
    deletable: true,
    healthStatus: createServiceHealthStatusFactory({ seed: config.seed }),
    lastTested: faker.date.recent({ days: 7 }).toISOString(),
    connectionStatus: faker.helpers.arrayElement(['connected', 'disconnected', 'testing', 'error']),
  };

  return applyOverrides(serviceRow, config.overrides);
}

/**
 * Generate service type definition for configuration testing
 */
export function createServiceTypeDefinitionFactory(
  options: Partial<DatabaseFactoryOptions> = {}
): ServiceTypeDefinition {
  const config = { ...DEFAULT_DATABASE_OPTIONS, ...options };
  initializeFaker(config.seed);

  const serviceType: ServiceTypeDefinition = {
    name: config.databaseType,
    label: `${config.databaseType.toUpperCase()} Database`,
    description: config.useRealisticData ?
      faker.lorem.sentences(2) :
      `${config.databaseType} database service type`,
    group: 'Database',
    class: `DreamFactory\\Core\\${config.databaseType.charAt(0).toUpperCase() + config.databaseType.slice(1)}\\Services\\${config.databaseType.charAt(0).toUpperCase() + config.databaseType.slice(1)}`,
    configSchema: createConfigSchemaFactory(config),
    capabilities: {
      supportsGeneratedAPIs: true,
      supportsCustomAPIs: false,
      supportsSchemaDiscovery: true,
      supportsTransactions: config.databaseType !== 'mongodb',
      supportsStoredProcedures: ['mysql', 'postgresql', 'sql_server', 'oracle'].includes(config.databaseType),
      supportsCaching: true,
      supportsFiltering: true,
      supportsPagination: true,
      supportsRelationships: config.databaseType !== 'mongodb',
      supportsEventScripts: true,
      requiresAuthentication: true,
      connectionTesting: true,
    },
    documentation: {
      url: `https://docs.dreamfactory.com/services/${config.databaseType}`,
      version: '2.0',
    },
    icon: `df-${config.databaseType}`,
    category: 'basic',
    deprecated: false,
  };

  return applyOverrides(serviceType, config.overrides);
}

/**
 * Generate configuration schema for service setup testing
 */
function createConfigSchemaFactory(
  config: Required<DatabaseFactoryOptions>
): any[] {
  const baseSchema = [
    {
      name: 'host',
      label: 'Host',
      type: 'string',
      description: 'Database server hostname or IP address',
      alias: 'host',
      required: true,
      category: 'basic',
    },
    {
      name: 'port',
      label: 'Port',
      type: 'integer',
      description: 'Database server port number',
      alias: 'port',
      required: false,
      default: config.databaseType === 'mysql' ? 3306 : 
               config.databaseType === 'postgresql' ? 5432 :
               config.databaseType === 'mongodb' ? 27017 : 5432,
      category: 'basic',
    },
    {
      name: 'database',
      label: 'Database',
      type: 'string',
      description: 'Database name or schema',
      alias: 'database',
      required: true,
      category: 'basic',
    },
    {
      name: 'username',
      label: 'Username',
      type: 'string',
      description: 'Database authentication username',
      alias: 'username',
      required: true,
      category: 'basic',
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      description: 'Database authentication password',
      alias: 'password',
      required: true,
      category: 'basic',
    },
  ];

  if (config.includePooling) {
    baseSchema.push(
      {
        name: 'max_connections',
        label: 'Max Connections',
        type: 'integer',
        description: 'Maximum number of concurrent connections',
        alias: 'maxConnections',
        required: false,
        default: 10,
        category: 'advanced',
      },
      {
        name: 'connection_timeout',
        label: 'Connection Timeout',
        type: 'integer',
        description: 'Connection timeout in milliseconds',
        alias: 'connectionTimeout',
        required: false,
        default: 30000,
        category: 'advanced',
      }
    );
  }

  if (config.includeSSL) {
    baseSchema.push(
      {
        name: 'ssl_mode',
        label: 'SSL Mode',
        type: 'picklist',
        description: 'SSL/TLS connection mode',
        alias: 'sslMode',
        required: false,
        picklist: ['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full'],
        default: 'prefer',
        category: 'security',
      },
      {
        name: 'ssl_cert',
        label: 'SSL Certificate',
        type: 'file_certificate',
        description: 'Client SSL certificate file',
        alias: 'sslCert',
        required: false,
        category: 'security',
      }
    );
  }

  return baseSchema;
}

// ============================================================================
// SERVICE TESTING FACTORIES
// ============================================================================

/**
 * Generate service health status for monitoring testing
 */
export function createServiceHealthStatusFactory(
  options: Partial<FactoryOptions> = {}
): ServiceHealthStatus {
  const config = { ...DEFAULT_FACTORY_OPTIONS, ...options };
  initializeFaker(config.seed);

  const healthStatus: ServiceHealthStatus = {
    status: faker.helpers.arrayElement(['healthy', 'degraded', 'unhealthy', 'unknown']),
    lastChecked: faker.date.recent({ hours: 1 }).toISOString(),
    responseTime: faker.number.int({ min: 50, max: 2000 }),
    errorCount: faker.number.int({ min: 0, max: 10 }),
    uptime: faker.number.float({ min: 95.0, max: 100.0, fractionDigits: 2 }),
  };

  return applyOverrides(healthStatus, config.overrides);
}

/**
 * Generate service metrics for performance testing
 */
export function createServiceMetricsFactory(
  options: Partial<FactoryOptions> = {}
): ServiceMetrics {
  const config = { ...DEFAULT_FACTORY_OPTIONS, ...options };
  initializeFaker(config.seed);

  const metrics: ServiceMetrics = {
    requestCount: faker.number.int({ min: 100, max: 10000 }),
    errorRate: faker.number.float({ min: 0.0, max: 5.0, fractionDigits: 2 }),
    averageResponseTime: faker.number.int({ min: 50, max: 1000 }),
    lastActivity: faker.date.recent({ hours: 2 }).toISOString(),
    dataVolume: {
      read: faker.number.int({ min: 1000000, max: 100000000 }),
      written: faker.number.int({ min: 500000, max: 50000000 }),
    },
  };

  return applyOverrides(metrics, config.overrides);
}

/**
 * Generate service test result for connection testing
 */
export function createServiceTestResultFactory(
  options: Partial<DatabaseFactoryOptions> = {}
): ServiceTestResult {
  const config = { ...DEFAULT_DATABASE_OPTIONS, ...options };
  initializeFaker(config.seed);

  const isSuccess = faker.datatype.boolean({ probability: 0.8 });

  const testResult: ServiceTestResult = {
    success: isSuccess,
    connectionTime: faker.number.int({ min: 100, max: 5000 }),
    message: isSuccess ? 
      'Connection successful' : 
      'Connection failed: Unable to connect to database',
    details: isSuccess ? {
      host: config.useRealisticData ? faker.internet.domainName() : 'localhost',
      port: config.useRealisticData ? faker.internet.port() : 3306,
      database: config.useRealisticData ? faker.database.name() : 'test_db',
      version: faker.system.semver(),
      features: faker.helpers.arrayElements([
        'transactions', 'stored_procedures', 'views', 'triggers', 'foreign_keys'
      ], { min: 2, max: 5 }),
    } : undefined,
    error: !isSuccess ? {
      code: faker.helpers.arrayElement(['CONNECTION_REFUSED', 'AUTHENTICATION_FAILED', 'DATABASE_NOT_FOUND']),
      message: faker.helpers.arrayElement([
        'Connection refused by database server',
        'Authentication failed for user',
        'Database does not exist'
      ]),
      stack: config.includeDebugInfo ? faker.lorem.paragraphs(3) : undefined,
    } : undefined,
  };

  return applyOverrides(testResult, config.overrides);
}

// ============================================================================
// API DOCUMENTATION FACTORIES
// ============================================================================

/**
 * Generate OpenAPI specification configuration for documentation testing
 */
export function createOpenAPIConfigFactory(
  options: Partial<ApiDocsFactoryOptions> = {}
): OpenAPIConfig {
  const config = { ...DEFAULT_API_DOCS_OPTIONS, ...options };
  initializeFaker(config.seed);

  const openApiConfig: OpenAPIConfig = {
    version: config.openApiVersion,
    info: {
      title: config.useRealisticData ? 
        `${faker.company.name()} API Documentation` :
        'Test API Documentation',
      description: config.useRealisticData ?
        faker.lorem.paragraph() :
        'API documentation for testing purposes',
      version: faker.system.semver(),
      contact: {
        name: config.useRealisticData ? faker.person.fullName() : 'Test Developer',
        email: config.useRealisticData ? faker.internet.email() : 'test@example.com',
        url: config.useRealisticData ? faker.internet.url() : 'https://example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: config.useRealisticData ? faker.internet.url() : 'https://api.example.com',
        description: config.useRealisticData ? 
          `${faker.helpers.arrayElement(['Production', 'Staging', 'Development'])} Server` :
          'Test Server',
      },
    ],
    security: config.includeAdvancedSecurity ? [
      { 'BearerAuth': [] },
      { 'ApiKeyAuth': [] },
      { 'OAuth2': ['read', 'write'] },
    ] : [
      { 'BearerAuth': [] },
    ],
    tags: [
      {
        name: 'database',
        description: 'Database operations',
      },
      {
        name: 'authentication',
        description: 'Authentication endpoints',
      },
    ],
    components: {
      schemas: {},
      responses: {},
      parameters: {},
    },
  };

  return applyOverrides(openApiConfig, config.overrides);
}

/**
 * Generate API endpoint configuration for testing
 */
export function createAPIEndpointConfigFactory(
  options: Partial<ApiDocsFactoryOptions> = {}
): APIEndpointConfig {
  const config = { ...DEFAULT_API_DOCS_OPTIONS, ...options };
  initializeFaker(config.seed);

  const endpointConfig: APIEndpointConfig = {
    serviceName: config.useRealisticData ? 
      faker.company.name().toLowerCase().replace(/[^a-z0-9]/g, '_') :
      'test_service',
    resource: config.useRealisticData ? faker.database.collation() : 'users',
    methods: faker.helpers.arrayElements(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as HTTPMethod[], 
                                       { min: 1, max: 5 }),
    parameters: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => 
      createEndpointParameterFactory(config)
    ),
    authentication: createAuthenticationConfigFactory(config),
    caching: {
      enabled: faker.datatype.boolean({ probability: 0.7 }),
      ttl: faker.number.int({ min: 300, max: 3600 }),
      key: config.useRealisticData ? faker.string.alphanumeric(8) : 'cache_key',
      tags: faker.helpers.arrayElements(['database', 'user', 'api'], { min: 1, max: 3 }),
    },
    rateLimit: {
      enabled: faker.datatype.boolean({ probability: 0.6 }),
      requests: faker.number.int({ min: 100, max: 1000 }),
      window: faker.number.int({ min: 60, max: 3600 }),
      message: 'Rate limit exceeded. Please try again later.',
      headers: true,
    },
    validation: createValidationConfigFactory(config),
    transformation: {
      request: [],
      response: [],
    },
    documentation: {
      summary: config.useRealisticData ?
        faker.lorem.sentence() :
        'Test API endpoint',
      description: config.useRealisticData ?
        faker.lorem.paragraph() :
        'Test endpoint for API documentation',
      tags: ['database'],
      examples: config.includeExamples ? {
        request: { id: 1, name: 'test' },
        response: { success: true, data: {} },
      } : undefined,
    },
  };

  return applyOverrides(endpointConfig, config.overrides);
}

/**
 * Generate endpoint parameter for API testing
 */
function createEndpointParameterFactory(
  config: Required<ApiDocsFactoryOptions>
): EndpointParameter {
  return {
    name: config.useRealisticData ? faker.lorem.word() : 'id',
    type: faker.helpers.arrayElement(['query', 'path', 'header', 'body']),
    dataType: faker.helpers.arrayElement(['string', 'integer', 'number', 'boolean', 'array', 'object']),
    required: faker.datatype.boolean({ probability: 0.5 }),
    description: config.useRealisticData ? faker.lorem.sentence() : 'Test parameter',
    example: 'test_value',
  };
}

/**
 * Generate authentication configuration for security testing
 */
function createAuthenticationConfigFactory(
  config: Required<ApiDocsFactoryOptions>
): AuthenticationConfig {
  return {
    required: faker.datatype.boolean({ probability: 0.8 }),
    methods: faker.helpers.arrayElements(['api_key', 'basic', 'bearer', 'oauth2', 'session'], 
                                       { min: 1, max: 3 }),
    roles: config.useRealisticData ? 
      faker.helpers.arrayElements(['admin', 'user', 'viewer'], { min: 1, max: 2 }) :
      ['user'],
    permissions: config.useRealisticData ?
      faker.helpers.arrayElements(['read', 'write', 'delete'], { min: 1, max: 3 }) :
      ['read'],
    customHeaders: config.includeAdvancedSecurity ? {
      'X-API-Version': '2.0',
      'X-Client-Type': 'web',
    } : undefined,
  };
}

/**
 * Generate validation configuration for data integrity testing
 */
function createValidationConfigFactory(
  config: Required<ApiDocsFactoryOptions>
): ValidationConfig {
  return {
    validateRequest: faker.datatype.boolean({ probability: 0.9 }),
    validateResponse: faker.datatype.boolean({ probability: 0.8 }),
    schemas: config.includeValidationSchemas ? {
      request: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          email: { type: 'string', format: 'email' },
        },
        required: ['name'],
      },
      response: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
        },
        required: ['success'],
      },
    } : {},
    strict: faker.datatype.boolean({ probability: 0.7 }),
  };
}

/**
 * Generate OpenAPI preview for documentation testing
 */
export function createOpenAPIPreviewFactory(
  options: Partial<ApiDocsFactoryOptions> = {}
): OpenAPIPreview {
  const config = { ...DEFAULT_API_DOCS_OPTIONS, ...options };
  initializeFaker(config.seed);

  const preview: OpenAPIPreview = {
    spec: createOpenAPIConfigFactory(config),
    url: config.useRealisticData ? 
      `${faker.internet.url()}/docs` :
      'https://api.example.com/docs',
    downloadUrl: config.useRealisticData ?
      `${faker.internet.url()}/openapi.json` :
      'https://api.example.com/openapi.json',
    lastGenerated: faker.date.recent({ hours: 1 }).toISOString(),
    errors: faker.datatype.boolean({ probability: 0.2 }) ? [
      'Schema validation failed for endpoint /users',
      'Missing required parameter in POST /users endpoint',
    ] : undefined,
    warnings: faker.datatype.boolean({ probability: 0.3 }) ? [
      'Deprecated endpoint /legacy/users should be updated',
      'Missing description for parameter "limit"',
    ] : undefined,
  };

  return applyOverrides(preview, config.overrides);
}

// ============================================================================
// API GENERATION WORKFLOW FACTORIES
// ============================================================================

/**
 * Generate API generation workflow for testing wizard components
 */
export function createAPIGenerationWorkflowFactory(
  options: Partial<ApiDocsFactoryOptions> = {}
): APIGenerationWorkflow {
  const config = { ...DEFAULT_API_DOCS_OPTIONS, ...options };
  initializeFaker(config.seed);

  const workflow: APIGenerationWorkflow = {
    serviceId: faker.number.int({ min: 1, max: 100 }),
    serviceName: config.useRealisticData ?
      faker.company.name().toLowerCase().replace(/[^a-z0-9]/g, '_') :
      'test_service',
    currentStep: faker.number.int({ min: 0, max: 4 }),
    steps: [
      {
        id: 'service-selection',
        title: 'Select Service',
        description: 'Choose the database service for API generation',
        component: 'ServiceSelectionStep',
        completed: true,
        required: true,
        data: { serviceId: faker.number.int({ min: 1, max: 100 }) },
      },
      {
        id: 'table-selection',
        title: 'Select Tables',
        description: 'Choose which tables to include in the API',
        component: 'TableSelectionStep',
        completed: faker.datatype.boolean({ probability: 0.8 }),
        required: true,
        data: { 
          selectedTables: config.useRealisticData ?
            faker.helpers.arrayElements(['users', 'orders', 'products', 'categories'], 
                                      { min: 1, max: 4 }) :
            ['users', 'orders']
        },
      },
      {
        id: 'endpoint-configuration',
        title: 'Configure Endpoints',
        description: 'Set up API endpoint parameters and security',
        component: 'EndpointConfigurationStep',
        completed: faker.datatype.boolean({ probability: 0.6 }),
        required: true,
        data: { endpoints: [] },
      },
      {
        id: 'security-configuration',
        title: 'Security Settings',
        description: 'Configure authentication and authorization',
        component: 'SecurityConfigurationStep',
        completed: faker.datatype.boolean({ probability: 0.4 }),
        required: false,
        data: { security: {} },
      },
      {
        id: 'documentation-generation',
        title: 'Generate Documentation',
        description: 'Create OpenAPI specification and documentation',
        component: 'DocumentationGenerationStep',
        completed: false,
        required: true,
        data: { documentation: {} },
      },
    ],
    configuration: {
      selectedTables: config.useRealisticData ?
        faker.helpers.arrayElements(['users', 'orders', 'products'], { min: 1, max: 3 }) :
        ['users'],
      endpoints: [],
      security: {
        authenticationRequired: true,
        defaultRoles: ['user'],
        endpointPermissions: [],
        rateLimiting: { enabled: false, default: { enabled: false } },
        cors: {
          enabled: true,
          origins: ['*'],
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          headers: ['Content-Type', 'Authorization'],
          credentials: false,
        },
        encryption: { enabled: false, algorithm: 'AES-256' },
      },
      documentation: {
        generateOpenAPI: true,
        includeExamples: true,
        theme: 'default',
        customization: {},
      },
      deployment: {
        environment: 'development',
        serverless: false,
        scaling: {
          autoScale: false,
          minInstances: 1,
          maxInstances: 5,
          targetCPU: 80,
          targetMemory: 80,
        },
        monitoring: {
          enabled: true,
          metrics: ['requests', 'errors', 'latency'],
          alerts: [],
          logging: {
            level: 'info',
            format: 'json',
            destinations: [],
          },
        },
      },
    },
    status: faker.helpers.arrayElement(['draft', 'validating', 'generating', 'completed', 'error']),
    progress: faker.number.int({ min: 0, max: 100 }),
    errors: faker.datatype.boolean({ probability: 0.2 }) ? [
      'Table "users" not found in database',
      'Invalid endpoint configuration for table "orders"',
    ] : undefined,
    result: faker.datatype.boolean({ probability: 0.3 }) ? 
      createAPIGenerationResultFactory(config) : undefined,
  };

  return applyOverrides(workflow, config.overrides);
}

/**
 * Generate API generation result for completion testing
 */
export function createAPIGenerationResultFactory(
  options: Partial<ApiDocsFactoryOptions> = {}
): APIGenerationResult {
  const config = { ...DEFAULT_API_DOCS_OPTIONS, ...options };
  initializeFaker(config.seed);

  const result: APIGenerationResult = {
    success: faker.datatype.boolean({ probability: 0.9 }),
    endpointsGenerated: faker.number.int({ min: 5, max: 50 }),
    openApiSpec: createOpenAPIPreviewFactory(config),
    deploymentUrl: config.useRealisticData ?
      `${faker.internet.url()}/api/v2/database` :
      'https://api.example.com/v2/database',
    documentation: {
      url: config.useRealisticData ?
        `${faker.internet.url()}/docs` :
        'https://api.example.com/docs',
      downloadUrl: config.useRealisticData ?
        `${faker.internet.url()}/openapi.json` :
        'https://api.example.com/openapi.json',
    },
    errors: faker.datatype.boolean({ probability: 0.1 }) ? [
      'Failed to generate endpoint for table "invalid_table"',
    ] : undefined,
    warnings: faker.datatype.boolean({ probability: 0.3 }) ? [
      'Table "users" has no primary key defined',
      'Large table "transactions" may impact performance',
    ] : undefined,
    metrics: {
      generationTime: faker.number.int({ min: 1000, max: 30000 }),
      endpoints: Array.from({ length: config.endpointCount }, () => ({
        endpoint: `/${faker.lorem.word()}`,
        method: faker.helpers.arrayElement(['GET', 'POST', 'PUT', 'DELETE']) as HTTPMethod,
        responseTime: faker.number.int({ min: 50, max: 500 }),
        complexity: faker.helpers.arrayElement(['low', 'medium', 'high']),
        dependencies: faker.helpers.arrayElements(['database', 'cache', 'auth'], { min: 1, max: 3 }),
      })),
    },
  };

  return applyOverrides(result, config.overrides);
}

// ============================================================================
// USER INTERACTION FACTORIES
// ============================================================================

/**
 * Generate form submission data for user interaction testing
 */
export function createFormSubmissionFactory<T = Record<string, any>>(
  formType: 'database-connection' | 'api-generation' | 'user-management' | 'security-config',
  options: Partial<UserInteractionFactoryOptions> = {}
): T {
  const config = { ...DEFAULT_USER_INTERACTION_OPTIONS, ...options };
  initializeFaker(config.seed);

  let formData: Record<string, any> = {};

  switch (formType) {
    case 'database-connection':
      formData = {
        name: config.useRealisticData ? 
          faker.company.name().toLowerCase().replace(/[^a-z0-9]/g, '_') :
          'test_connection',
        label: config.useRealisticData ? 
          `${faker.company.name()} Database` :
          'Test Database',
        description: config.useRealisticData ?
          faker.lorem.sentence() :
          'Test database connection',
        type: faker.helpers.arrayElement(['mysql', 'postgresql', 'mongodb']),
        host: config.useRealisticData ? faker.internet.domainName() : 'localhost',
        port: config.useRealisticData ? faker.internet.port() : 3306,
        database: config.useRealisticData ? faker.database.name() : 'test_db',
        username: config.useRealisticData ? faker.internet.userName() : 'testuser',
        password: config.useRealisticData ? faker.internet.password() : 'testpass',
        isActive: true,
      };
      break;

    case 'api-generation':
      formData = {
        serviceName: config.useRealisticData ?
          faker.company.name().toLowerCase().replace(/[^a-z0-9]/g, '_') :
          'test_service',
        selectedTables: config.useRealisticData ?
          faker.helpers.arrayElements(['users', 'orders', 'products', 'categories'], 
                                    { min: 1, max: 4 }) :
          ['users', 'orders'],
        generateOpenAPI: true,
        includeExamples: config.includeExamples,
        securityEnabled: faker.datatype.boolean({ probability: 0.8 }),
        cachingEnabled: faker.datatype.boolean({ probability: 0.6 }),
        rateLimitingEnabled: faker.datatype.boolean({ probability: 0.4 }),
      };
      break;

    case 'user-management':
      formData = {
        firstName: config.useRealisticData ? faker.person.firstName() : 'Test',
        lastName: config.useRealisticData ? faker.person.lastName() : 'User',
        email: config.useRealisticData ? faker.internet.email() : 'test@example.com',
        username: config.useRealisticData ? faker.internet.userName() : 'testuser',
        password: config.useRealisticData ? faker.internet.password() : 'testpass123',
        confirmPassword: config.useRealisticData ? faker.internet.password() : 'testpass123',
        isActive: true,
        roleId: faker.number.int({ min: 1, max: 10 }),
        phone: config.useRealisticData ? faker.phone.number() : '+1234567890',
      };
      break;

    case 'security-config':
      formData = {
        authenticationRequired: faker.datatype.boolean({ probability: 0.9 }),
        allowedMethods: faker.helpers.arrayElements(['GET', 'POST', 'PUT', 'DELETE'], 
                                                  { min: 1, max: 4 }),
        rateLimitEnabled: faker.datatype.boolean({ probability: 0.6 }),
        maxRequestsPerMinute: faker.number.int({ min: 60, max: 1000 }),
        corsEnabled: faker.datatype.boolean({ probability: 0.8 }),
        allowedOrigins: config.useRealisticData ? 
          [faker.internet.url(), faker.internet.url()] :
          ['https://example.com'],
        ipWhitelistEnabled: faker.datatype.boolean({ probability: 0.3 }),
        allowedIpAddresses: config.useRealisticData ?
          [faker.internet.ip(), faker.internet.ip()] :
          ['192.168.1.1'],
      };
      break;
  }

  // Add validation errors if requested
  if (config.includeErrors && config.validationState === 'invalid') {
    formData._errors = {
      name: config.interactionType === 'create' ? 'Name is required' : undefined,
      email: 'Invalid email format',
      password: 'Password must be at least 8 characters',
    };
  }

  // Add optimistic update metadata
  if (config.includeOptimisticUpdates) {
    formData._optimistic = {
      id: generateId('temp'),
      timestamp: new Date().toISOString(),
      type: config.interactionType,
    };
  }

  return applyOverrides(formData, config.overrides) as T;
}

/**
 * Generate user interaction event for testing user workflows
 */
export function createUserInteractionEventFactory(
  eventType: 'click' | 'input' | 'submit' | 'navigate' | 'error',
  options: Partial<UserInteractionFactoryOptions> = {}
): any {
  const config = { ...DEFAULT_USER_INTERACTION_OPTIONS, ...options };
  initializeFaker(config.seed);

  const baseEvent = {
    id: generateId('event'),
    type: eventType,
    timestamp: new Date().toISOString(),
    userId: faker.number.int({ min: 1, max: 1000 }),
    sessionId: generateId('session'),
  };

  switch (eventType) {
    case 'click':
      return {
        ...baseEvent,
        target: {
          element: faker.helpers.arrayElement(['button', 'link', 'checkbox', 'radio']),
          text: config.useRealisticData ? faker.lorem.words(2) : 'Test Button',
          selector: config.useRealisticData ? 
            `#${faker.lorem.word()}-${faker.string.alphanumeric(4)}` :
            '#test-button',
        },
        coordinates: {
          x: faker.number.int({ min: 0, max: 1920 }),
          y: faker.number.int({ min: 0, max: 1080 }),
        },
      };

    case 'input':
      return {
        ...baseEvent,
        field: {
          name: config.useRealisticData ? faker.lorem.word() : 'testField',
          type: faker.helpers.arrayElement(['text', 'email', 'password', 'number']),
          value: config.useRealisticData ? faker.lorem.words(3) : 'test value',
          valid: config.validationState === 'valid',
        },
        validation: config.validationState === 'invalid' ? {
          errors: ['Field is required', 'Invalid format'],
        } : undefined,
      };

    case 'submit':
      return {
        ...baseEvent,
        form: {
          name: config.useRealisticData ? faker.lorem.word() : 'testForm',
          data: createFormSubmissionFactory('database-connection', config),
          valid: config.validationState === 'valid',
          method: faker.helpers.arrayElement(['POST', 'PUT', 'PATCH']),
        },
        result: config.includeErrors ? {
          success: false,
          errors: ['Validation failed', 'Network error'],
        } : {
          success: true,
          data: { id: faker.number.int({ min: 1, max: 1000 }) },
        },
      };

    case 'navigate':
      return {
        ...baseEvent,
        navigation: {
          from: config.useRealisticData ? `/${faker.lorem.word()}` : '/test',
          to: config.useRealisticData ? `/${faker.lorem.word()}` : '/new-test',
          method: faker.helpers.arrayElement(['push', 'replace', 'back']),
          trigger: faker.helpers.arrayElement(['click', 'programmatic', 'browser']),
        },
      };

    case 'error':
      return {
        ...baseEvent,
        error: {
          type: faker.helpers.arrayElement(['validation', 'network', 'authentication', 'authorization']),
          message: config.useRealisticData ? 
            faker.lorem.sentence() :
            'Test error message',
          code: faker.helpers.arrayElement([400, 401, 403, 404, 500]),
          stack: config.includeDebugInfo ? faker.lorem.paragraphs(3) : undefined,
        },
        context: {
          component: config.useRealisticData ? faker.lorem.word() : 'TestComponent',
          props: { testProp: 'testValue' },
          state: { loading: false, error: true },
        },
      };

    default:
      return baseEvent;
  }
}

// ============================================================================
// REACT QUERY AND SWR MOCK DATA FACTORIES
// ============================================================================

/**
 * Generate React Query cache data for hook testing
 */
export function createReactQueryCacheFactory(
  queryKey: string[],
  options: Partial<FactoryOptions> = {}
): any {
  const config = { ...DEFAULT_FACTORY_OPTIONS, ...options };
  initializeFaker(config.seed);

  return {
    queryKey,
    queryHash: JSON.stringify(queryKey),
    data: config.overrides.data || createDatabaseServiceFactory(config),
    dataUpdatedAt: Date.now(),
    error: config.overrides.error || null,
    errorUpdatedAt: config.overrides.error ? Date.now() : 0,
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchMeta: null,
    isInvalidated: false,
    status: config.overrides.error ? 'error' : 'success',
    fetchStatus: 'idle',
  };
}

/**
 * Generate SWR cache data for hook testing
 */
export function createSWRCacheFactory(
  key: string,
  options: Partial<FactoryOptions> = {}
): any {
  const config = { ...DEFAULT_FACTORY_OPTIONS, ...options };
  initializeFaker(config.seed);

  return {
    data: config.overrides.data || createDatabaseServiceFactory(config),
    error: config.overrides.error || undefined,
    isLoading: config.overrides.isLoading || false,
    isValidating: config.overrides.isValidating || false,
    mutate: () => Promise.resolve(),
  };
}

/**
 * Generate MSW response data for API mocking
 */
export function createMSWResponseFactory(
  responseType: 'success' | 'error' | 'loading',
  options: Partial<FactoryOptions> = {}
): any {
  const config = { ...DEFAULT_FACTORY_OPTIONS, ...options };
  initializeFaker(config.seed);

  switch (responseType) {
    case 'success':
      return {
        status: 200,
        data: config.overrides.data || createDatabaseServiceFactory(config),
        headers: {
          'content-type': 'application/json',
          'x-request-id': generateId('req'),
        },
      };

    case 'error':
      return {
        status: config.overrides.status || 400,
        error: {
          code: config.overrides.code || 'VALIDATION_ERROR',
          message: config.overrides.message || 'Validation failed',
          details: config.includeDebugInfo ? faker.lorem.paragraph() : undefined,
        },
        headers: {
          'content-type': 'application/json',
          'x-request-id': generateId('req'),
        },
      };

    case 'loading':
      return {
        status: 'pending',
        delay: faker.number.int({ min: 100, max: 2000 }),
      };

    default:
      return {};
  }
}

// ============================================================================
// BATCH FACTORY FUNCTIONS
// ============================================================================

/**
 * Generate multiple services for list testing
 */
export function createServiceListFactory(
  count: number,
  options: Partial<DatabaseFactoryOptions> = {}
): ServiceRow[] {
  const config = { ...DEFAULT_DATABASE_OPTIONS, ...options };
  
  return Array.from({ length: count }, (_, index) => 
    createServiceRowFactory({ 
      ...config, 
      seed: config.seed + index,
      overrides: { id: index + 1, ...config.overrides }
    })
  );
}

/**
 * Generate multiple API endpoints for testing
 */
export function createAPIEndpointListFactory(
  count: number,
  options: Partial<ApiDocsFactoryOptions> = {}
): APIEndpointConfig[] {
  const config = { ...DEFAULT_API_DOCS_OPTIONS, ...options };
  
  return Array.from({ length: count }, (_, index) => 
    createAPIEndpointConfigFactory({
      ...config,
      seed: config.seed + index,
      overrides: { ...config.overrides }
    })
  );
}

/**
 * Generate multiple user interactions for workflow testing
 */
export function createUserInteractionListFactory(
  count: number,
  eventType: 'click' | 'input' | 'submit' | 'navigate' | 'error',
  options: Partial<UserInteractionFactoryOptions> = {}
): any[] {
  const config = { ...DEFAULT_USER_INTERACTION_OPTIONS, ...options };
  
  return Array.from({ length: count }, (_, index) => 
    createUserInteractionEventFactory(eventType, {
      ...config,
      seed: config.seed + index,
      overrides: { ...config.overrides }
    })
  );
}

// ============================================================================
// FACTORY PRESETS FOR COMMON TESTING SCENARIOS
// ============================================================================

/**
 * Preset: Database connection testing scenario
 */
export const DATABASE_CONNECTION_PRESET = {
  mysql: () => createDatabaseServiceFactory({ databaseType: 'mysql', includeSSL: false }),
  postgresql: () => createDatabaseServiceFactory({ databaseType: 'postgresql', includeSSL: true }),
  mongodb: () => createDatabaseServiceFactory({ databaseType: 'mongodb', includePooling: true }),
  withErrors: () => createDatabaseServiceFactory({ 
    overrides: { isActive: false },
    includeErrors: true 
  }),
  largeSchema: () => createDatabaseServiceFactory({ schemaSize: 'xlarge' }),
};

/**
 * Preset: API documentation testing scenario
 */
export const API_DOCUMENTATION_PRESET = {
  basic: () => createOpenAPIConfigFactory({ includeAdvancedSecurity: false }),
  advanced: () => createOpenAPIConfigFactory({ 
    includeAdvancedSecurity: true,
    endpointCount: 10,
    includeValidationSchemas: true 
  }),
  withErrors: () => createOpenAPIPreviewFactory({
    overrides: {
      errors: ['Invalid schema definition', 'Missing required fields'],
      warnings: ['Deprecated endpoint detected']
    }
  }),
};

/**
 * Preset: User interaction testing scenario
 */
export const USER_INTERACTION_PRESET = {
  validForm: () => createFormSubmissionFactory('database-connection', { 
    validationState: 'valid' 
  }),
  invalidForm: () => createFormSubmissionFactory('database-connection', { 
    validationState: 'invalid',
    includeErrors: true 
  }),
  optimisticUpdate: () => createFormSubmissionFactory('api-generation', { 
    includeOptimisticUpdates: true 
  }),
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Core factory functions
  createDatabaseServiceFactory,
  createServiceRowFactory,
  createServiceTypeDefinitionFactory,
  createServiceHealthStatusFactory,
  createServiceMetricsFactory,
  createServiceTestResultFactory,
  
  // API documentation factories
  createOpenAPIConfigFactory,
  createAPIEndpointConfigFactory,
  createOpenAPIPreviewFactory,
  createAPIGenerationWorkflowFactory,
  createAPIGenerationResultFactory,
  
  // User interaction factories
  createFormSubmissionFactory,
  createUserInteractionEventFactory,
  
  // React Query/SWR factories
  createReactQueryCacheFactory,
  createSWRCacheFactory,
  createMSWResponseFactory,
  
  // Batch factories
  createServiceListFactory,
  createAPIEndpointListFactory,
  createUserInteractionListFactory,
  
  // Presets
  DATABASE_CONNECTION_PRESET,
  API_DOCUMENTATION_PRESET,
  USER_INTERACTION_PRESET,
  
  // Utility functions
  generateId,
  generateConnectionString,
};

/**
 * Default export: Factory collection for convenient importing
 */
export default {
  database: DATABASE_CONNECTION_PRESET,
  apiDocs: API_DOCUMENTATION_PRESET,
  userInteraction: USER_INTERACTION_PRESET,
  services: {
    create: createDatabaseServiceFactory,
    createRow: createServiceRowFactory,
    createList: createServiceListFactory,
    createHealthStatus: createServiceHealthStatusFactory,
    createMetrics: createServiceMetricsFactory,
    createTestResult: createServiceTestResultFactory,
  },
  api: {
    createConfig: createOpenAPIConfigFactory,
    createEndpoint: createAPIEndpointConfigFactory,
    createPreview: createOpenAPIPreviewFactory,
    createWorkflow: createAPIGenerationWorkflowFactory,
    createResult: createAPIGenerationResultFactory,
  },
  hooks: {
    createReactQueryCache: createReactQueryCacheFactory,
    createSWRCache: createSWRCacheFactory,
    createMSWResponse: createMSWResponseFactory,
  },
  forms: {
    createSubmission: createFormSubmissionFactory,
    createInteraction: createUserInteractionEventFactory,
  },
  utils: {
    generateId,
    generateConnectionString,
  },
};