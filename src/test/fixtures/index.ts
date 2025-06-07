/**
 * Centralized Test Fixtures Index
 * 
 * This module serves as the primary export point for all test fixture factories,
 * providing organized namespace access to domain-specific data generation functions.
 * 
 * Features:
 * - Namespace organization for clear separation of application domains
 * - Comprehensive TypeScript typing for all fixture factory functions
 * - Common fixture preset configurations for frequently used testing scenarios
 * - Convenience functions for generating complete test scenarios across multiple domains
 * - Legacy compatibility exports for seamless migration from Angular test patterns
 * 
 * Usage:
 * ```typescript
 * import { Apps, Users, Database, Schema, Fixtures } from '@/test/fixtures';
 * 
 * // Create individual entities
 * const user = Users.profile();
 * const app = Apps.data();
 * const schema = Schema.discovery();
 * 
 * // Create complete scenarios
 * const adminSetup = Fixtures.adminSetup();
 * const databaseWithSchema = Fixtures.databaseWithSchema();
 * ```
 * 
 * @fileoverview Centralized fixture management for React/Next.js testing
 */

// ============================================================================
// Domain-Specific Fixture Imports
// ============================================================================

// App and Role fixtures
import {
  roleFactory,
  roleRowFactory,
  appConfigurationFactory,
  apiKeyFactory,
  appRowFactory,
  appDataFactory,
  appPayloadFactory,
  createAppRows,
  createApps,
  createRoles,
  createRoleRows,
  appScenarios,
  roleScenarios,
  ROLES,
  EDIT_DATA,
  type FactoryOverrides,
  type AppStorageConfiguration,
  type AppHostingConfiguration,
  type ApiKeyConfiguration,
} from './app-fixtures';

// User and Authentication fixtures
import {
  UserFixtures,
  userProfileFactory,
  adminProfileFactory,
  roleFactory as userRoleFactory,
  rolePermissionFactory,
  userSessionFactory,
  userRegistrationFactory,
  passwordResetFactory,
  mfaConfigurationFactory,
  userRelationshipFactory,
  userScenarioFactory,
  type UserProfile,
  type AdminProfile,
  type Role,
  type Permission,
  type UserSession,
  type UserRegistration,
  type PasswordReset,
  type MfaConfiguration,
  type UserFactoryOptions,
  type AdminFactoryOptions,
  type RoleFactoryOptions,
  type SessionFactoryOptions,
} from './user-fixtures';

// Database Service fixtures
import {
  databaseServiceFactory,
  connectionConfigFactory,
  databaseSchemaFactory,
  connectionTestResultFactory,
  databaseServiceTypeFactory,
  connectionTestScenariosFactory,
  bulkDatabaseServicesFactory,
  performanceTestDataFactory,
  type DatabaseService,
  type DatabaseConnection,
  type ConnectionConfig,
  type ConnectionTestResult,
  type DatabaseType,
  type DatabaseSchema,
  type TableMetadata,
  type FieldMetadata,
  type RelationshipMetadata,
} from './database-fixtures';

// Scheduler fixtures
import {
  schedulerFixtures,
  serviceFactory,
  servicesFactory,
  getCommonServices,
  serviceConfigFactory,
  schedulerTaskFactory,
  schedulerTasksFactory,
  schedulerTasksWithVariousServicesFactory,
  taskLogFactory,
  successfulTaskLogFactory,
  errorTaskLogFactory,
  createSchedulePayloadFactory,
  updateSchedulePayloadFactory,
  schedulerScenarioFactory,
  largeSchedulerDatasetFactory,
  type Service,
  type SchedulerTaskData,
  type CreateSchedulePayload,
  type UpdateSchedulePayload,
  type ServiceFactoryOptions,
  type SchedulerTaskFactoryOptions,
} from './scheduler-fixtures';

// API Limits fixtures
import {
  limitTypeFactory,
  limitTableRowDataFactory,
  limitCacheFactory,
  limitUsageStatsFactory,
  createLimitsList,
  createLimitCachesList,
  createLimitScenarios,
  createLimitErrorScenarios,
  mockLimitTypes,
  mockTableData,
  mockLimitCache,
  type LimitType,
  type LimitCache,
  type LimitUsageStats,
  type LimitTypeFactoryOptions,
  type LimitTableRowDataFactoryOptions,
  type LimitCacheFactoryOptions,
} from './limits-fixtures';

// System Configuration fixtures
import {
  systemConfigFactory,
  environmentConfigFactory,
  globalLookupFactory,
  globalLookupListFactory,
  emailTemplateFactory,
  smtpConfigFactory,
  corsConfigFactory,
  cacheConfigFactory,
  systemInfoFactory,
  healthCheckFactory,
  developmentSystemPreset,
  productionSystemPreset,
  maintenanceModePreset,
  highLoadSystemPreset,
  type SystemConfig,
  type EnvironmentConfig,
  type GlobalLookupKey,
  type EmailTemplate,
  type SmtpConfig,
  type CorsConfig,
  type CacheConfig,
  type SystemInfo,
  type HealthCheck,
  type SystemConfigFactoryOptions,
  type EnvironmentConfigFactoryOptions,
  type GlobalLookupFactoryOptions,
} from './system-fixtures';

// API Generation fixtures
import {
  apiFixtures,
  openApiSpecFactory,
  apiEndpointFactory,
  apiDocumentationFactory,
  endpointConfigurationFactory,
  apiTestScenarioFactory,
  apiVersioningScenarioFactory,
  apiGenerationWizardFactory,
  type ApiEndpointConfig,
  type OpenApiSpecification,
  type ApiDocumentation,
  type ApiTestScenario,
  type ApiGenerationWizardState,
  type HttpMethod,
  type EndpointSecurity,
  type AuthenticationType,
} from './api-fixtures';

// Schema Discovery fixtures
import {
  fieldDefinitionFactory,
  relationshipFactory,
  tableSchemaFactory,
  fieldValidationFactory,
  schemaDiscoveryFactory,
  largeSchemaDatasetFactory,
  schemaVersioningFactory,
  generateSchemaByPattern,
  schemaComponentTestFactory,
  schemaFixturePresets,
  type SchemaData,
  type SchemaTable,
  type SchemaField,
  type ForeignKey,
  type FieldValidation,
  type SchemaFactoryOptions,
  type FieldType,
} from './schema-fixtures';

// ============================================================================
// Organized Namespace Exports
// ============================================================================

/**
 * App and Role Management Fixtures
 * 
 * Provides factory functions for creating app configurations, role definitions,
 * API keys, and app metadata for testing application management interfaces.
 * 
 * Key Features:
 * - App configuration scenarios (server, URL, path-based apps)
 * - Role-based access control testing data
 * - API key generation with customizable formats
 * - Bulk creation functions for list/table testing
 */
export const Apps = {
  // Core factories
  data: appDataFactory,
  row: appRowFactory,
  payload: appPayloadFactory,
  configuration: appConfigurationFactory,
  apiKey: apiKeyFactory,
  
  // Role factories
  role: roleFactory,
  roleRow: roleRowFactory,
  
  // Bulk creators
  createRows: createAppRows,
  createMultiple: createApps,
  createRoles: createRoles,
  createRoleRows: createRoleRows,
  
  // Scenario presets
  scenarios: appScenarios,
  roleScenarios: roleScenarios,
  
  // Legacy compatibility
  legacyRoles: ROLES,
  legacyEditData: EDIT_DATA,
} as const;

/**
 * User Management and Authentication Fixtures
 * 
 * Comprehensive factory functions for user profiles, authentication sessions,
 * role assignments, and security configurations for testing user management
 * and authentication workflows in React components and Next.js middleware.
 * 
 * Key Features:
 * - User profile generation with configurable roles and permissions
 * - Administrative user scenarios with elevated privileges
 * - Session management with JWT token simulation
 * - Multi-factor authentication configuration
 * - Password reset and registration workflows
 */
export const Users = {
  // Primary factories
  profile: userProfileFactory,
  adminProfile: adminProfileFactory,
  role: userRoleFactory,
  rolePermission: rolePermissionFactory,
  session: userSessionFactory,
  registration: userRegistrationFactory,
  passwordReset: passwordResetFactory,
  mfaConfiguration: mfaConfigurationFactory,
  relationship: userRelationshipFactory,
  scenario: userScenarioFactory,
  
  // Convenience shortcuts from UserFixtures
  basicUser: UserFixtures.basicUser,
  adminUser: UserFixtures.adminUser,
  developerUser: UserFixtures.developerUser,
  readOnlyUser: UserFixtures.readOnlyUser,
  inactiveUser: UserFixtures.inactiveUser,
  unverifiedUser: UserFixtures.unverifiedUser,
  
  // Session scenarios
  validSession: UserFixtures.validSession,
  expiredSession: UserFixtures.expiredSession,
  adminSession: UserFixtures.adminSession,
  
  // Registration scenarios
  newRegistration: UserFixtures.newRegistration,
  inviteRegistration: UserFixtures.inviteRegistration,
  
  // Password reset scenarios
  activeReset: UserFixtures.activeReset,
  expiredReset: UserFixtures.expiredReset,
  
  // MFA scenarios
  enabledMfa: UserFixtures.enabledMfa,
  disabledMfa: UserFixtures.disabledMfa,
} as const;

/**
 * Database Service Configuration Fixtures
 * 
 * Factory functions for creating database service definitions, connection
 * configurations, and schema metadata to support testing of database
 * management interfaces and API generation workflows.
 * 
 * Key Features:
 * - Support for multiple database types (MySQL, PostgreSQL, MongoDB, etc.)
 * - Connection testing scenarios including success and error states
 * - Schema introspection results with table and field metadata
 * - Performance testing data for large datasets
 * - Service type configurations with proper schemas
 */
export const Database = {
  // Core service factories
  service: databaseServiceFactory,
  connectionConfig: connectionConfigFactory,
  schema: databaseSchemaFactory,
  serviceType: databaseServiceTypeFactory,
  
  // Connection testing
  connectionTest: connectionTestResultFactory,
  connectionTestScenarios: connectionTestScenariosFactory,
  
  // Bulk operations
  bulkServices: bulkDatabaseServicesFactory,
  performanceTestData: performanceTestDataFactory,
} as const;

/**
 * Scheduler Task Management Fixtures
 * 
 * Provides factory functions for creating scheduled task configurations,
 * service assignments, execution logs, and workflow scenarios for testing
 * scheduler management interfaces.
 * 
 * Key Features:
 * - Task configuration with various service types
 * - Execution log scenarios including success and error states
 * - Service relationship management
 * - Large dataset generation for virtual scrolling tests
 * - Create and update payload generation for form testing
 */
export const Scheduler = {
  // Individual factories
  task: schedulerTaskFactory,
  taskLog: taskLogFactory,
  service: serviceFactory,
  serviceConfig: serviceConfigFactory,
  createPayload: createSchedulePayloadFactory,
  updatePayload: updateSchedulePayloadFactory,
  
  // Multiple entity creators
  tasks: schedulerTasksFactory,
  services: servicesFactory,
  tasksWithVariousServices: schedulerTasksWithVariousServicesFactory,
  
  // Log scenarios
  successfulLog: successfulTaskLogFactory,
  errorLog: errorTaskLogFactory,
  
  // Common configurations
  commonServices: getCommonServices,
  
  // Complex scenarios
  scenario: schedulerScenarioFactory,
  largeDataset: largeSchedulerDatasetFactory,
  
  // Complete fixtures object
  all: schedulerFixtures,
} as const;

/**
 * API Rate Limiting and Security Fixtures
 * 
 * Factory functions for creating API limit configurations, cache statistics,
 * and usage analytics for testing rate limiting and API security interfaces.
 * 
 * Key Features:
 * - Various limit types (instance, user, service, role-based)
 * - Cache statistics and quota management
 * - Usage analytics and monitoring data
 * - Error scenario testing for exceeded limits
 * - Table display data for management interfaces
 */
export const Limits = {
  // Core factories
  limitType: limitTypeFactory,
  tableRowData: limitTableRowDataFactory,
  cache: limitCacheFactory,
  usageStats: limitUsageStatsFactory,
  
  // Bulk creators
  createList: createLimitsList,
  createCacheList: createLimitCachesList,
  
  // Scenario generators
  scenarios: createLimitScenarios,
  errorScenarios: createLimitErrorScenarios,
  
  // Mock data for quick testing
  mockTypes: mockLimitTypes,
  mockTableData: mockTableData,
  mockCache: mockLimitCache,
} as const;

/**
 * System Configuration and Environment Fixtures
 * 
 * Comprehensive factory functions for system settings, environment variables,
 * email templates, CORS policies, and caching configurations for testing
 * system administration interfaces.
 * 
 * Key Features:
 * - Environment-specific configurations (dev, staging, production)
 * - Global lookup keys and system settings
 * - Email template management with variable substitution
 * - CORS policy configuration and security headers
 * - Cache provider configurations and statistics
 * - Health check scenarios and system monitoring
 */
export const System = {
  // Core configurations
  config: systemConfigFactory,
  environment: environmentConfigFactory,
  globalLookup: globalLookupFactory,
  globalLookupList: globalLookupListFactory,
  
  // Communication settings
  emailTemplate: emailTemplateFactory,
  smtpConfig: smtpConfigFactory,
  
  // Security and performance
  corsConfig: corsConfigFactory,
  cacheConfig: cacheConfigFactory,
  
  // Monitoring and health
  systemInfo: systemInfoFactory,
  healthCheck: healthCheckFactory,
  
  // Preset configurations
  presets: {
    development: developmentSystemPreset,
    production: productionSystemPreset,
    maintenance: maintenanceModePreset,
    highLoad: highLoadSystemPreset,
  },
} as const;

/**
 * API Generation and Documentation Fixtures
 * 
 * Factory functions for creating OpenAPI specifications, endpoint configurations,
 * API documentation, and testing scenarios for API generation workflows.
 * 
 * Key Features:
 * - OpenAPI 3.0+ specification generation
 * - REST endpoint configuration with security and validation
 * - API documentation with Swagger UI integration
 * - Test scenario generation for API validation
 * - Generation wizard workflow simulation
 * - API versioning and compatibility testing
 */
export const API = {
  // Core specifications
  openApiSpec: openApiSpecFactory,
  endpoint: apiEndpointFactory,
  endpointConfiguration: endpointConfigurationFactory,
  documentation: apiDocumentationFactory,
  
  // Testing scenarios
  testScenario: apiTestScenarioFactory,
  versioningScenario: apiVersioningScenarioFactory,
  
  // Workflow generators
  generationWizard: apiGenerationWizardFactory,
  
  // Complete fixtures object
  all: apiFixtures,
} as const;

/**
 * Database Schema Discovery and Management Fixtures
 * 
 * Comprehensive factory functions for table definitions, field configurations,
 * relationships, and schema validation data to support testing of schema
 * management interfaces and discovery workflows.
 * 
 * Key Features:
 * - Realistic table and field generation with proper data types
 * - Relationship management including foreign keys and constraints
 * - Schema introspection results with hierarchical structures
 * - Field validation rules and constraint configurations
 * - Large dataset generation for virtual scrolling performance tests
 * - Schema versioning and migration workflow testing
 */
export const Schema = {
  // Core factories
  field: fieldDefinitionFactory,
  relationship: relationshipFactory,
  table: tableSchemaFactory,
  fieldValidation: fieldValidationFactory,
  discovery: schemaDiscoveryFactory,
  
  // Specialized generators
  largeDataset: largeSchemaDatasetFactory,
  versioning: schemaVersioningFactory,
  componentTest: schemaComponentTestFactory,
  
  // Pattern-based generation
  generateByPattern: generateSchemaByPattern,
  
  // Preset configurations
  presets: schemaFixturePresets,
} as const;

// ============================================================================
// Convenience Functions for Common Testing Scenarios
// ============================================================================

/**
 * Convenience functions for generating complete test scenarios that span
 * multiple application domains. These functions create realistic data
 * relationships and provide comprehensive testing environments.
 */
export const Fixtures = {
  /**
   * Creates a complete administrative setup with user, system configuration,
   * and database services for testing admin interface functionality.
   * 
   * @param options Configuration options for the admin setup
   * @returns Complete admin scenario with all related entities
   */
  adminSetup: (options: {
    environment?: 'development' | 'staging' | 'production';
    includeLargeSchema?: boolean;
    includeSchedulerTasks?: boolean;
  } = {}) => {
    const { environment = 'development', includeLargeSchema = false, includeSchedulerTasks = true } = options;
    
    return {
      user: Users.adminProfile({ adminLevel: 'super' }),
      session: Users.adminSession(),
      systemConfig: System.config({ environment, debug: environment === 'development' }),
      environmentConfig: System.environment({ environment }),
      database: Database.service('postgresql'),
      schema: includeLargeSchema ? Schema.largeDataset() : Schema.discovery(),
      schedulerTasks: includeSchedulerTasks ? Scheduler.tasks(5) : [],
      limits: Limits.createList(3),
      apis: API.documentation(),
    };
  },

  /**
   * Creates a database service with comprehensive schema data for testing
   * database management and API generation workflows.
   * 
   * @param databaseType The type of database to create
   * @param options Additional configuration options
   * @returns Complete database setup with schema and metadata
   */
  databaseWithSchema: (
    databaseType: DatabaseType = 'mysql',
    options: {
      tableCount?: number;
      includeRelationships?: boolean;
      includeTestData?: boolean;
    } = {}
  ) => {
    const { tableCount = 10, includeRelationships = true, includeTestData = true } = options;
    
    const database = Database.service(databaseType);
    const schema = Schema.discovery({
      serviceName: database.name,
      databaseName: database.config.database,
      databaseType,
      tableCount,
      relationshipDensity: includeRelationships ? 0.7 : 0,
    });
    
    return {
      database,
      schema,
      connectionTest: Database.connectionTest({ success: true, withPerformanceMetrics: true }),
      testData: includeTestData ? {
        users: Users.profile(),
        app: Apps.data(),
        limits: Limits.scenarios.userLimit,
      } : undefined,
    };
  },

  /**
   * Creates a complete API generation scenario with service, schema,
   * and generated documentation for testing API workflow interfaces.
   * 
   * @param options Configuration options for API generation
   * @returns Complete API generation scenario
   */
  apiGenerationScenario: (options: {
    serviceName?: string;
    includeWizardState?: boolean;
    includeTestScenarios?: boolean;
  } = {}) => {
    const { serviceName = 'api_service', includeWizardState = true, includeTestScenarios = true } = options;
    
    const database = Database.service('postgresql', { name: serviceName });
    const schema = Schema.discovery({ serviceName, tableCount: 6 });
    const endpoints = schema.tables.map(table => 
      API.endpoint({
        serviceName,
        tableName: table.name,
        methods: ['GET', 'POST', 'PUT', 'DELETE'] as HttpMethod[],
      })
    );
    
    return {
      database,
      schema,
      endpoints,
      documentation: API.documentation({
        title: `${serviceName} API`,
        endpoints,
      }),
      wizardState: includeWizardState ? API.generationWizard() : undefined,
      testScenarios: includeTestScenarios ? endpoints.flatMap(endpoint => 
        endpoint.methods.map(method => API.testScenario({
          endpoint: endpoint.resource,
          method,
        }))
      ) : [],
    };
  },

  /**
   * Creates user management testing scenario with various user types,
   * roles, and permissions for comprehensive user interface testing.
   * 
   * @param userCount Number of users to generate
   * @returns Complete user management scenario
   */
  userManagementScenario: (userCount: number = 10) => {
    const users = Array.from({ length: userCount }, (_, index) => {
      if (index === 0) return Users.adminUser();
      if (index === 1) return Users.developerUser();
      if (index === 2) return Users.readOnlyUser();
      if (index < userCount - 2) return Users.basicUser();
      return Users.inactiveUser();
    });
    
    return {
      users,
      roles: [
        Users.role({ name: 'Administrator' }),
        Users.role({ name: 'Developer' }),
        Users.role({ name: 'User' }),
        Users.role({ name: 'Read Only' }),
      ],
      sessions: users.filter(user => user.isActive).map(user => 
        Users.session({ userId: user.id, roles: user.roles.map(role => role.name) })
      ),
      registrations: [
        Users.newRegistration(),
        Users.inviteRegistration(),
      ],
      passwordResets: [
        Users.activeReset(),
        Users.expiredReset(),
      ],
    };
  },

  /**
   * Creates system monitoring and health check scenario with various
   * system states for testing monitoring dashboards and alerts.
   * 
   * @param includeProblems Whether to include problematic system states
   * @returns Complete system monitoring scenario
   */
  systemMonitoringScenario: (includeProblems: boolean = true) => {
    return {
      systemInfo: System.systemInfo({ includeResources: true }),
      healthCheck: System.healthCheck({ 
        status: includeProblems ? 'degraded' : 'healthy',
        failingServices: includeProblems ? ['cache'] : [],
      }),
      cacheConfig: System.cacheConfig({ withStatistics: true }),
      corsConfig: System.corsConfig(),
      emailTemplates: [
        System.emailTemplate({ type: 'alert' }),
        System.emailTemplate({ type: 'notification' }),
      ],
      globalLookups: System.globalLookupList({ count: 15 }),
      environmentConfig: System.environment({ includeOptional: true }),
    };
  },

  /**
   * Creates performance testing scenario with large datasets optimized
   * for testing virtual scrolling, pagination, and component performance.
   * 
   * @param scale Size scale for the performance test (small, medium, large)
   * @returns Performance testing scenario with large datasets
   */
  performanceTestingScenario: (scale: 'small' | 'medium' | 'large' = 'medium') => {
    const scaleConfig = {
      small: { tables: 100, tasks: 50, users: 25, limits: 10 },
      medium: { tables: 500, tasks: 200, users: 100, limits: 50 },
      large: { tables: 1500, tasks: 1000, users: 500, limits: 200 },
    };
    
    const config = scaleConfig[scale];
    
    return {
      schema: Schema.largeDataset(config.tables),
      schedulerTasks: Scheduler.largeDataset(config.tasks),
      users: Array.from({ length: config.users }, () => Users.profile()),
      limits: Limits.createList(config.limits),
      database: Database.performanceTestData({
        tableCount: config.tables,
        recordsPerTable: 10000,
        includeComplexRelationships: true,
      }),
    };
  },
} as const;

// ============================================================================
// Type Exports for Fixture Factory Functions
// ============================================================================

/**
 * Comprehensive type exports for all fixture factory function signatures
 * and configuration options. These types enable proper TypeScript
 * integration and IDE support for fixture usage.
 */
export type {
  // App and Role types
  FactoryOverrides,
  AppStorageConfiguration,
  AppHostingConfiguration,
  ApiKeyConfiguration,
  
  // User and Authentication types
  UserProfile,
  AdminProfile,
  Role,
  Permission,
  UserSession,
  UserRegistration,
  PasswordReset,
  MfaConfiguration,
  UserFactoryOptions,
  AdminFactoryOptions,
  RoleFactoryOptions,
  SessionFactoryOptions,
  
  // Database types
  DatabaseService,
  DatabaseConnection,
  ConnectionConfig,
  ConnectionTestResult,
  DatabaseType,
  DatabaseSchema,
  TableMetadata,
  FieldMetadata,
  RelationshipMetadata,
  
  // Scheduler types
  Service,
  SchedulerTaskData,
  CreateSchedulePayload,
  UpdateSchedulePayload,
  ServiceFactoryOptions,
  SchedulerTaskFactoryOptions,
  
  // Limits types
  LimitType,
  LimitCache,
  LimitUsageStats,
  LimitTypeFactoryOptions,
  LimitTableRowDataFactoryOptions,
  LimitCacheFactoryOptions,
  
  // System types
  SystemConfig,
  EnvironmentConfig,
  GlobalLookupKey,
  EmailTemplate,
  SmtpConfig,
  CorsConfig,
  CacheConfig,
  SystemInfo,
  HealthCheck,
  SystemConfigFactoryOptions,
  EnvironmentConfigFactoryOptions,
  GlobalLookupFactoryOptions,
  
  // API types
  ApiEndpointConfig,
  OpenApiSpecification,
  ApiDocumentation,
  ApiTestScenario,
  ApiGenerationWizardState,
  HttpMethod,
  EndpointSecurity,
  AuthenticationType,
  
  // Schema types
  SchemaData,
  SchemaTable,
  SchemaField,
  ForeignKey,
  FieldValidation,
  SchemaFactoryOptions,
  FieldType,
};

// ============================================================================
// Default Export for Convenience
// ============================================================================

/**
 * Default export providing quick access to all fixture namespaces
 * and convenience functions for comprehensive testing scenarios.
 */
export default {
  Apps,
  Users,
  Database,
  Scheduler,
  Limits,
  System,
  API,
  Schema,
  Fixtures,
} as const;

// ============================================================================
// Legacy Compatibility Exports
// ============================================================================

/**
 * Legacy compatibility exports for seamless migration from Angular
 * test patterns. These exports maintain existing test file compatibility
 * while encouraging migration to the new namespace organization.
 * 
 * @deprecated Use the namespace exports (Apps, Users, etc.) instead
 */
export {
  // App fixtures (legacy)
  roleFactory,
  appDataFactory,
  appRowFactory,
  
  // User fixtures (legacy)
  userProfileFactory,
  adminProfileFactory,
  userSessionFactory,
  
  // Database fixtures (legacy)
  databaseServiceFactory,
  databaseSchemaFactory,
  
  // Schema fixtures (legacy)
  tableSchemaFactory,
  fieldDefinitionFactory,
  
  // System fixtures (legacy)
  systemConfigFactory,
  environmentConfigFactory,
};