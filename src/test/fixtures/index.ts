/**
 * @fileoverview Centralized test fixture management system providing organized access to all domain-specific
 * data generation functions. This module consolidates fixture factories into logical namespaces, enabling
 * easy consumption across test files while maintaining clear separation between application domains.
 * 
 * @example
 * // Import specific namespace
 * import { Database } from '@/test/fixtures';
 * const connection = Database.serviceFactory({ name: 'test-db' });
 * 
 * @example  
 * // Import multiple namespaces
 * import { Apps, Users, Database } from '@/test/fixtures';
 * const testScenario = Presets.adminWithDatabase();
 * 
 * @example
 * // Import factory types for type safety
 * import type { DatabaseServiceFactory, UserProfileFactory } from '@/test/fixtures';
 */

// =============================================================================
// DOMAIN-SPECIFIC FIXTURE EXPORTS
// =============================================================================

/**
 * App management fixture factories for testing application configuration,
 * role assignments, API keys, and storage settings.
 * 
 * @namespace Apps
 * @description Provides factory functions for creating realistic app configuration data
 * including application records, roles, API keys, and storage configurations to replace
 * static Angular mock data with dynamic React testing patterns.
 */
export * as Apps from './app-fixtures';

/**
 * Database service configuration fixture factories for testing connection management,
 * schema discovery, and multi-database support workflows.
 * 
 * @namespace Database
 * @description Generates realistic database connection data for testing React components
 * and API generation workflows. Supports MySQL, PostgreSQL, MongoDB, SQLite, Oracle,
 * and Snowflake configurations with connection testing scenarios.
 */
export * as Database from './database-fixtures';

/**
 * Database schema discovery fixture factories for testing hierarchical tree visualization,
 * metadata introspection, and relationship mapping capabilities.
 * 
 * @namespace Schema
 * @description Provides comprehensive factory functions for creating table definitions,
 * field configurations, relationships, and schema validation data to support testing
 * of schema management interfaces with performance optimization for 1000+ tables.
 */
export * as Schema from './schema-fixtures';

/**
 * User and admin profile fixture factories for testing authentication, authorization,
 * and user management workflows with role-based permissions.
 * 
 * @namespace Users
 * @description Generates realistic user data for testing authentication, authorization,
 * and user management React components. Includes user profiles, admin accounts, roles,
 * permissions, and session management scenarios.
 */
export * as Users from './user-fixtures';

/**
 * API generation and OpenAPI specification fixture factories for testing endpoint
 * configuration, documentation generation, and API testing workflows.
 * 
 * @namespace API
 * @description Provides factory functions for creating OpenAPI specifications, endpoint
 * configurations, and API documentation data. Supports API generation wizard workflows
 * and preview functionality testing.
 */
export * as API from './api-fixtures';

/**
 * System configuration fixture factories for testing environment settings,
 * email templates, CORS policies, and global system management.
 * 
 * @namespace System
 * @description Generates system configuration and environment data for testing React
 * components and Next.js middleware. Includes system settings, environment variables,
 * service configurations, and global lookup data.
 */
export * as System from './system-fixtures';

/**
 * Scheduler task configuration fixture factories for testing scheduled job
 * management, service configurations, and task execution logging.
 * 
 * @namespace Scheduler
 * @description Provides factory functions for creating scheduler tasks, service
 * configurations, and task execution logs to support testing of scheduler
 * management interfaces with error scenarios and service relationships.
 */
export * as Scheduler from './scheduler-fixtures';

/**
 * API limits and rate limiting fixture factories for testing rate limiting
 * configurations, cache statistics, and quota management.
 * 
 * @namespace Limits
 * @description Generates realistic limit configurations and cache data for testing
 * React components. Supports various limit types (instance, user, service, role-based)
 * with quota tracking and usage monitoring scenarios.
 */
export * as Limits from './limits-fixtures';

// =============================================================================
// FACTORY UTILITY RE-EXPORTS
// =============================================================================

/**
 * Re-export common factory utilities and shared configuration functions
 * from the component factories module for easy access.
 */
export {
  // Core factory utilities
  createMockDate,
  generateId,
  generateApiKey,
  generateJwtToken,
  
  // Database utilities
  createConnectionConfig,
  createSchemaMetadata,
  
  // User utilities
  createUserSession,
  createRolePermissions,
  
  // Form utilities
  createFormValidationData,
  createFieldConfiguration,
  
  // API utilities  
  createApiResponse,
  createErrorResponse,
  createPaginatedResponse,
} from './component-factories';

// =============================================================================
// PRESET CONFIGURATIONS
// =============================================================================

/**
 * Common preset configurations for frequently used testing scenarios.
 * These presets combine multiple fixture factories to create complete
 * test environments with realistic data relationships.
 * 
 * @namespace Presets
 */
export const Presets = {
  /**
   * Creates a complete admin user setup with elevated permissions,
   * assigned roles, and configured services.
   * 
   * @example
   * const adminSetup = Presets.adminWithPermissions();
   * // Returns: { user: AdminProfile, roles: Role[], permissions: Permission[] }
   */
  adminWithPermissions: () => ({
    user: Users.adminProfileFactory({
      isActive: true,
      roles: ['admin', 'user_manager', 'service_admin']
    }),
    roles: [
      Users.rolePermissionFactory({ name: 'admin', level: 'admin' }),
      Users.rolePermissionFactory({ name: 'user_manager', level: 'manager' }),
      Users.rolePermissionFactory({ name: 'service_admin', level: 'service' })
    ],
    permissions: Users.rolePermissionFactory({ 
      permissions: ['create', 'read', 'update', 'delete', 'admin'] 
    })
  }),

  /**
   * Creates a database service with complete schema including tables,
   * fields, relationships, and connection configuration.
   * 
   * @example
   * const dbSetup = Presets.databaseWithSchema();
   * // Returns: { service: DatabaseService, schema: SchemaData, connection: ConnectionConfig }
   */
  databaseWithSchema: (options: { tableCount?: number; dbType?: string } = {}) => ({
    service: Database.serviceFactory({
      type: options.dbType || 'mysql',
      isActive: true,
      connectionStatus: 'connected'
    }),
    schema: Schema.schemaDiscoveryFactory({
      tableCount: options.tableCount || 25,
      includeRelationships: true,
      includeIndexes: true
    }),
    connection: Database.connectionConfigFactory({
      testConnection: true,
      pooling: true
    })
  }),

  /**
   * Creates a complete API generation scenario with OpenAPI specification,
   * endpoint configurations, and security settings.
   * 
   * @example
   * const apiSetup = Presets.apiGenerationWorkflow();
   * // Returns: { spec: OpenAPISpec, endpoints: Endpoint[], security: SecurityConfig }
   */
  apiGenerationWorkflow: () => ({
    spec: API.openApiSpecFactory({
      version: '3.0.3',
      includeAuthentication: true,
      includeExamples: true
    }),
    endpoints: [
      API.apiEndpointFactory({ method: 'GET', path: '/users' }),
      API.apiEndpointFactory({ method: 'POST', path: '/users' }),
      API.apiEndpointFactory({ method: 'PUT', path: '/users/{id}' }),
      API.apiEndpointFactory({ method: 'DELETE', path: '/users/{id}' })
    ],
    security: API.apiEndpointFactory({ 
      security: ['apiKey', 'bearer'],
      rateLimiting: true 
    })
  }),

  /**
   * Creates a large schema testing scenario with 1000+ tables for
   * performance testing of virtual scrolling and progressive loading.
   * 
   * @example
   * const largeSchema = Presets.largeSchemaPerformance();
   * // Returns: { schema: LargeSchemaData, virtualConfig: VirtualScrollConfig }
   */
  largeSchemaPerformance: () => ({
    schema: Schema.schemaDiscoveryFactory({
      tableCount: 1200,
      fieldsPerTable: 15,
      relationshipDensity: 0.3,
      includeVirtualScrolling: true
    }),
    virtualConfig: {
      itemHeight: 32,
      overscan: 10,
      estimateSize: true
    },
    performance: {
      renderThreshold: 100,
      maxConcurrentRenders: 50
    }
  }),

  /**
   * Creates a complete user management scenario with multiple user types,
   * roles, and permission configurations for testing RBAC workflows.
   * 
   * @example
   * const userManagement = Presets.userManagementScenario();
   * // Returns: { users: User[], admins: Admin[], roles: Role[], sessions: Session[] }
   */
  userManagementScenario: () => ({
    users: [
      Users.userProfileFactory({ role: 'viewer', isActive: true }),
      Users.userProfileFactory({ role: 'editor', isActive: true }),
      Users.userProfileFactory({ role: 'admin', isActive: false })
    ],
    admins: [
      Users.adminProfileFactory({ permissions: 'full', isActive: true }),
      Users.adminProfileFactory({ permissions: 'limited', isActive: true })
    ],
    roles: [
      Users.rolePermissionFactory({ name: 'viewer', permissions: ['read'] }),
      Users.rolePermissionFactory({ name: 'editor', permissions: ['read', 'update'] }),
      Users.rolePermissionFactory({ name: 'admin', permissions: ['create', 'read', 'update', 'delete'] })
    ],
    sessions: [
      Users.userSessionFactory({ role: 'admin', expiresIn: '1h' }),
      Users.userSessionFactory({ role: 'editor', expiresIn: '8h' })
    ]
  }),

  /**
   * Creates a system configuration testing scenario with environment
   * variables, email templates, CORS settings, and cache configurations.
   * 
   * @example
   * const systemConfig = Presets.systemConfigurationSetup();
   * // Returns: { config: SystemConfig, environment: EnvConfig, email: EmailConfig }
   */
  systemConfigurationSetup: () => ({
    config: System.systemConfigFactory({
      environment: 'test',
      debugMode: true,
      logLevel: 'debug'
    }),
    environment: System.environmentConfigFactory({
      apiUrl: 'http://localhost:3000/api',
      authEnabled: true,
      cacheEnabled: true
    }),
    email: System.emailTemplateFactory({
      templates: ['welcome', 'reset-password', 'verification'],
      smtpConfig: true
    }),
    cors: System.corsConfigFactory({
      allowedOrigins: ['http://localhost:3000'],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
    })
  })
};

// =============================================================================
// TYPE DEFINITIONS FOR FACTORY FUNCTIONS
// =============================================================================

/**
 * Type definitions for all fixture factory functions to ensure type safety
 * when consuming fixtures in test files.
 */

// App factory types
export type {
  AppDataFactory,
  RoleFactory,
  AppConfigurationFactory,
  ApiKeyFactory
} from './app-fixtures';

// Database factory types  
export type {
  DatabaseServiceFactory,
  ConnectionConfigFactory,
  DatabaseSchemaFactory,
  ConnectionTestResultFactory
} from './database-fixtures';

// Schema factory types
export type {
  TableSchemaFactory,
  FieldDefinitionFactory,
  RelationshipFactory,
  SchemaDiscoveryFactory,
  FieldValidationFactory
} from './schema-fixtures';

// User factory types
export type {
  UserProfileFactory,
  AdminProfileFactory,
  RolePermissionFactory,
  UserSessionFactory,
  UserRegistrationFactory
} from './user-fixtures';

// API factory types
export type {
  OpenApiSpecFactory,
  ApiEndpointFactory,
  ApiDocumentationFactory,
  EndpointConfigurationFactory,
  ApiTestScenarioFactory
} from './api-fixtures';

// System factory types
export type {
  SystemConfigFactory,
  EnvironmentConfigFactory,
  GlobalLookupFactory,
  EmailTemplateFactory,
  CorsConfigFactory,
  CacheConfigFactory
} from './system-fixtures';

// Scheduler factory types
export type {
  ServiceFactory,
  SchedulerTaskFactory,
  TaskLogFactory,
  ServiceConfigFactory
} from './scheduler-fixtures';

// Limits factory types
export type {
  LimitTypeFactory,
  LimitTableRowDataFactory,
  LimitCacheFactory
} from './limits-fixtures';

// =============================================================================
// CONVENIENCE TYPE UNIONS
// =============================================================================

/**
 * Union type of all available factory functions for comprehensive type checking
 */
export type AnyFactoryFunction = 
  | AppDataFactory
  | DatabaseServiceFactory  
  | TableSchemaFactory
  | UserProfileFactory
  | OpenApiSpecFactory
  | SystemConfigFactory
  | ServiceFactory
  | LimitTypeFactory;

/**
 * Configuration options for factory functions
 */
export interface FactoryOptions {
  /** Override default values with partial data */
  overrides?: Record<string, any>;
  /** Generate realistic random data vs predictable test data */
  useRealisticData?: boolean;
  /** Include related entity data in factory output */
  includeRelated?: boolean;
  /** Validation strictness level for generated data */
  validationLevel?: 'strict' | 'lenient' | 'none';
}

/**
 * Preset configuration options for common testing scenarios
 */
export interface PresetOptions {
  /** Environment context for the preset */
  environment?: 'test' | 'development' | 'staging';
  /** Scale factor for data generation (affects counts, sizes, etc.) */
  scale?: 'small' | 'medium' | 'large';
  /** Include performance testing data */
  includePerformanceData?: boolean;
  /** Enable debug metadata in generated fixtures */
  includeDebugInfo?: boolean;
}

// =============================================================================
// MODULE METADATA
// =============================================================================

/**
 * Module metadata for development and debugging
 */
export const __FIXTURE_META__ = {
  version: '1.0.0',
  domains: [
    'Apps', 'Database', 'Schema', 'Users', 
    'API', 'System', 'Scheduler', 'Limits'
  ],
  presets: [
    'adminWithPermissions',
    'databaseWithSchema', 
    'apiGenerationWorkflow',
    'largeSchemaPerformance',
    'userManagementScenario',
    'systemConfigurationSetup'
  ],
  totalFactories: 24,
  lastUpdated: new Date().toISOString()
} as const;