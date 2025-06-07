/**
 * Application domain fixture factory functions for comprehensive React component testing.
 * 
 * Provides realistic mock data generators for DreamFactory application configurations,
 * roles, API keys, and storage scenarios. Designed for Vitest 2.1.0 testing framework
 * with enhanced React 19 component testing integration using @testing-library/react.
 * 
 * Replaces static Angular mock data with dynamic factory patterns supporting
 * configurable overrides for test-specific customization scenarios.
 * 
 * @fileoverview Application testing fixtures with faker.js integration
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+ / Vitest 2.1.0
 */

import type { AppType, AppPayload, AppRow, APP_TYPES } from '../../types/apps';
import type { RoleType, RoleListItem, CreateRoleData } from '../../types/role';

// ============================================================================
// Faker.js Mock Implementation
// ============================================================================

/**
 * Lightweight faker implementation for realistic test data generation.
 * Provides deterministic seeding for reproducible test scenarios.
 */
class MockFaker {
  private seed: number = 1;

  /**
   * Set seed for deterministic random generation
   */
  setSeed(newSeed: number): void {
    this.seed = newSeed;
  }

  /**
   * Simple seeded random number generator
   */
  private random(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Generate random string of specified length
   */
  private randomString(length: number, chars: string = 'abcdefghijklmnopqrstuvwxyz0123456789'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(this.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate random number between min and max
   */
  private randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  /**
   * Pick random element from array
   */
  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(this.random() * array.length)];
  }

  /**
   * Generate random company name
   */
  company(): string {
    const prefixes = ['Acme', 'Global', 'United', 'Advanced', 'Premier', 'Dynamic', 'Innovative', 'Strategic'];
    const suffixes = ['Corp', 'Inc', 'LLC', 'Systems', 'Solutions', 'Technologies', 'Enterprises', 'Group'];
    return `${this.randomChoice(prefixes)} ${this.randomChoice(suffixes)}`;
  }

  /**
   * Generate realistic application name
   */
  appName(): string {
    const prefixes = ['Admin', 'Customer', 'Sales', 'Analytics', 'Mobile', 'Web', 'Dashboard', 'Portal'];
    const suffixes = ['App', 'Panel', 'Console', 'Interface', 'Manager', 'Studio', 'Builder', 'Center'];
    return `${this.randomChoice(prefixes)} ${this.randomChoice(suffixes)}`;
  }

  /**
   * Generate lorem ipsum description
   */
  description(): string {
    const sentences = [
      'A comprehensive application for managing business operations.',
      'Streamlined interface for enhanced productivity and user experience.',
      'Advanced dashboard providing real-time analytics and reporting.',
      'Secure platform for efficient data management and collaboration.',
      'Innovative solution for modern business requirements.',
      'User-friendly application designed for optimal workflow efficiency.',
    ];
    return this.randomChoice(sentences);
  }

  /**
   * Generate realistic URL
   */
  url(): string {
    const domains = ['example.com', 'testapp.org', 'mycompany.io', 'business-suite.net', 'enterprise-app.com'];
    const subdomains = ['app', 'portal', 'dashboard', 'admin', 'client'];
    return `https://${this.randomChoice(subdomains)}.${this.randomChoice(domains)}`;
  }

  /**
   * Generate secure API key
   */
  apiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return this.randomString(32, chars);
  }

  /**
   * Generate role name
   */
  roleName(): string {
    const roles = ['Admin', 'User', 'Manager', 'Viewer', 'Editor', 'Analyst', 'Developer', 'Support'];
    const modifiers = ['Standard', 'Advanced', 'Premium', 'Basic', 'Professional', 'Senior', 'Junior'];
    
    if (this.random() > 0.5) {
      return this.randomChoice(roles);
    }
    return `${this.randomChoice(modifiers)} ${this.randomChoice(roles)}`;
  }

  /**
   * Generate past date for creation timestamps
   */
  pastDate(daysAgo: number = 30): string {
    const date = new Date();
    date.setDate(date.getDate() - this.randomInt(1, daysAgo));
    return date.toISOString();
  }

  /**
   * Generate file path
   */
  filePath(): string {
    const paths = [
      '/var/www/html/app',
      '/opt/apps/dashboard',
      '/usr/share/applications/portal',
      '/home/www/client-app',
      '/srv/web/admin-panel',
    ];
    return this.randomChoice(paths);
  }

  /**
   * Generate storage container name
   */
  containerName(): string {
    const containers = ['app-assets', 'static-files', 'uploads', 'media', 'resources', 'content'];
    return this.randomChoice(containers);
  }

  /**
   * Generate boolean with specified probability
   */
  boolean(probability: number = 0.5): boolean {
    return this.random() < probability;
  }
}

// Create singleton faker instance
const faker = new MockFaker();

// ============================================================================
// Core Factory Configuration Types
// ============================================================================

/**
 * Factory configuration options for customizing generated data
 */
export interface FactoryOptions {
  /** Seed for deterministic random generation */
  seed?: number;
  /** Override specific fields */
  overrides?: Record<string, any>;
  /** Number of items to generate for array factories */
  count?: number;
}

/**
 * App configuration scenario types
 */
export type AppConfigurationType = 'none' | 'local' | 'url' | 'cloud_storage';

/**
 * Storage service configuration for cloud apps
 */
export interface StorageConfiguration {
  serviceId: number;
  serviceName: string;
  container: string;
  path?: string;
  credentials?: Record<string, any>;
}

// ============================================================================
// Role Factory Functions
// ============================================================================

/**
 * Factory function to generate role objects with proper TypeScript typing.
 * Replaces static ROLES export with configurable role generation.
 * 
 * @param options Configuration options for role generation
 * @returns Generated RoleType object
 */
export function roleFactory(options: FactoryOptions = {}): RoleType {
  if (options.seed !== undefined) {
    faker.setSeed(options.seed);
  }

  const baseRole: RoleType = {
    id: faker.randomInt(1, 1000),
    name: faker.roleName().toLowerCase().replace(/\s+/g, '_'),
    description: faker.description(),
    isActive: faker.boolean(0.8), // 80% chance of being active
    createdById: faker.randomInt(1, 10),
    createdDate: faker.pastDate(365),
    lastModifiedById: faker.randomInt(1, 10),
    lastModifiedDate: faker.pastDate(30),
    lookupByRoleId: [],
    accessibleTabs: [
      'dashboard',
      'services',
      'schema',
      'users',
      'config',
    ].filter(() => faker.boolean(0.6)), // Random subset of tabs
  };

  return { ...baseRole, ...options.overrides };
}

/**
 * Factory for creating role list items optimized for table display
 */
export function roleListItemFactory(options: FactoryOptions = {}): RoleListItem {
  if (options.seed !== undefined) {
    faker.setSeed(options.seed);
  }

  const baseRoleListItem: RoleListItem = {
    id: faker.randomInt(1, 1000),
    name: faker.roleName().toLowerCase().replace(/\s+/g, '_'),
    description: faker.description(),
    isActive: faker.boolean(0.8),
    userCount: faker.randomInt(0, 50),
    serviceAccessCount: faker.randomInt(1, 10),
    lastModifiedDate: faker.pastDate(30),
  };

  return { ...baseRoleListItem, ...options.overrides };
}

/**
 * Factory for creating role creation data
 */
export function createRoleDataFactory(options: FactoryOptions = {}): CreateRoleData {
  if (options.seed !== undefined) {
    faker.setSeed(options.seed);
  }

  const baseCreateRoleData: CreateRoleData = {
    name: faker.roleName().toLowerCase().replace(/\s+/g, '_'),
    description: faker.description(),
    isActive: true,
    roleServiceAccess: [],
    lookupByRoleId: [],
  };

  return { ...baseCreateRoleData, ...options.overrides };
}

/**
 * Generate predefined role scenarios for common testing patterns
 */
export function roleScenarioFactory(scenario: 'admin' | 'user' | 'readonly' | 'manager'): RoleType {
  const scenarios = {
    admin: roleFactory({
      overrides: {
        name: 'admin',
        description: 'Administrator role with full system access',
        isActive: true,
        accessibleTabs: ['dashboard', 'services', 'schema', 'users', 'config', 'admin-settings'],
      },
    }),
    user: roleFactory({
      overrides: {
        name: 'user',
        description: 'Standard user role with limited access',
        isActive: true,
        accessibleTabs: ['dashboard', 'services', 'schema'],
      },
    }),
    readonly: roleFactory({
      overrides: {
        name: 'readonly',
        description: 'Read-only access role for viewing data',
        isActive: true,
        accessibleTabs: ['dashboard', 'services'],
      },
    }),
    manager: roleFactory({
      overrides: {
        name: 'manager',
        description: 'Management role with user administration access',
        isActive: true,
        accessibleTabs: ['dashboard', 'services', 'schema', 'users'],
      },
    }),
  };

  return scenarios[scenario];
}

// ============================================================================
// Application Data Factory Functions
// ============================================================================

/**
 * Configurable factory function that generates application records with realistic field values.
 * Transforms static EDIT_DATA export to dynamic generation supporting all app types.
 * 
 * @param options Configuration options for app generation
 * @returns Generated AppType object
 */
export function appDataFactory(options: FactoryOptions = {}): AppType {
  if (options.seed !== undefined) {
    faker.setSeed(options.seed);
  }

  // Generate consistent timestamps
  const createdDate = faker.pastDate(365);
  const lastModifiedDate = faker.pastDate(30);

  const baseApp: AppType = {
    id: faker.randomInt(1, 1000),
    name: faker.appName().toLowerCase().replace(/\s+/g, '-'),
    apiKey: faker.apiKey(),
    description: faker.description(),
    isActive: faker.boolean(0.9), // 90% chance of being active
    type: faker.randomChoice([0, 1, 2, 3]), // Random app type
    path: undefined,
    url: undefined,
    storageServiceId: undefined,
    storageContainer: undefined,
    requiresFullscreen: faker.boolean(0.2), // 20% chance
    allowFullscreenToggle: faker.boolean(0.7), // 70% chance
    toggleLocation: faker.randomChoice(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
    roleId: faker.randomInt(1, 10),
    createdDate,
    lastModifiedDate,
    createdById: faker.randomInt(1, 10),
    lastModifiedById: faker.randomInt(1, 10),
    launchUrl: '', // Will be computed based on type
    roleByRoleId: undefined,
  };

  // Configure app-specific fields based on type
  switch (baseApp.type) {
    case 0: // APP_TYPES.NONE
      baseApp.launchUrl = `/app/${baseApp.name}`;
      break;
    case 1: // APP_TYPES.LOCAL_FILE
      baseApp.path = faker.filePath();
      baseApp.launchUrl = `/app/${baseApp.name}`;
      break;
    case 2: // APP_TYPES.URL
      baseApp.url = faker.url();
      baseApp.launchUrl = baseApp.url;
      break;
    case 3: // APP_TYPES.CLOUD_STORAGE
      baseApp.storageServiceId = faker.randomInt(1, 5);
      baseApp.storageContainer = faker.containerName();
      baseApp.launchUrl = `/storage/${baseApp.storageContainer}/${baseApp.name}`;
      break;
  }

  return { ...baseApp, ...options.overrides };
}

/**
 * Factory for creating app row data optimized for table display
 */
export function appRowFactory(options: FactoryOptions = {}): AppRow {
  if (options.seed !== undefined) {
    faker.setSeed(options.seed);
  }

  const baseAppRow: AppRow = {
    id: faker.randomInt(1, 1000),
    name: faker.appName().toLowerCase().replace(/\s+/g, '-'),
    role: faker.roleName(),
    apiKey: faker.apiKey(),
    description: faker.description(),
    active: faker.boolean(0.9),
    launchUrl: faker.url(),
    createdById: faker.randomInt(1, 10),
  };

  return { ...baseAppRow, ...options.overrides };
}

/**
 * Factory for creating app payload data for API operations
 */
export function appPayloadFactory(options: FactoryOptions = {}): AppPayload {
  if (options.seed !== undefined) {
    faker.setSeed(options.seed);
  }

  const appType = faker.randomChoice([0, 1, 2, 3]);
  
  const basePayload: AppPayload = {
    name: faker.appName().toLowerCase().replace(/\s+/g, '-'),
    description: faker.description(),
    type: appType,
    role_id: faker.randomInt(1, 10),
    is_active: faker.boolean(0.9),
    requires_fullscreen: faker.boolean(0.2),
    allow_fullscreen_toggle: faker.boolean(0.7),
    toggle_location: faker.randomChoice(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
  };

  // Add type-specific fields
  switch (appType) {
    case 1: // LOCAL_FILE
      basePayload.path = faker.filePath();
      break;
    case 2: // URL
      basePayload.url = faker.url();
      break;
    case 3: // CLOUD_STORAGE
      basePayload.storage_service_id = faker.randomInt(1, 5);
      basePayload.storage_container = faker.containerName();
      break;
  }

  return { ...basePayload, ...options.overrides };
}

// ============================================================================
// Application Configuration Factory Functions
// ============================================================================

/**
 * Factory for generating app storage and hosting configuration scenarios.
 * Supports all app deployment types with realistic configuration options.
 * 
 * @param configurationType Type of app configuration to generate
 * @param options Configuration options
 * @returns Application configuration object
 */
export function appConfigurationFactory(
  configurationType: AppConfigurationType = 'none',
  options: FactoryOptions = {}
): AppType {
  if (options.seed !== undefined) {
    faker.setSeed(options.seed);
  }

  const baseConfig = appDataFactory(options);

  const configurations = {
    none: {
      type: 0,
      path: undefined,
      url: undefined,
      storageServiceId: undefined,
      storageContainer: undefined,
      launchUrl: `/app/${baseConfig.name}`,
    },
    local: {
      type: 1,
      path: faker.filePath(),
      url: undefined,
      storageServiceId: undefined,
      storageContainer: undefined,
      launchUrl: `/app/${baseConfig.name}`,
    },
    url: {
      type: 2,
      path: undefined,
      url: faker.url(),
      storageServiceId: undefined,
      storageContainer: undefined,
      launchUrl: faker.url(),
    },
    cloud_storage: {
      type: 3,
      path: undefined,
      url: undefined,
      storageServiceId: faker.randomInt(1, 5),
      storageContainer: faker.containerName(),
      launchUrl: `/storage/${faker.containerName()}/${baseConfig.name}`,
    },
  };

  return {
    ...baseConfig,
    ...configurations[configurationType],
    ...options.overrides,
  };
}

/**
 * Factory for generating storage service configurations
 */
export function storageConfigurationFactory(options: FactoryOptions = {}): StorageConfiguration {
  if (options.seed !== undefined) {
    faker.setSeed(options.seed);
  }

  const serviceTypes = ['s3', 'azure', 'gcs', 'local', 'ftp'];
  const serviceType = faker.randomChoice(serviceTypes);

  const baseConfig: StorageConfiguration = {
    serviceId: faker.randomInt(1, 10),
    serviceName: `${serviceType}-storage-${faker.randomInt(1, 100)}`,
    container: faker.containerName(),
    path: serviceType === 'local' ? faker.filePath() : undefined,
    credentials: serviceType !== 'local' ? {
      access_key: faker.apiKey(),
      secret_key: faker.apiKey(),
      region: faker.randomChoice(['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1']),
    } : undefined,
  };

  return { ...baseConfig, ...options.overrides };
}

// ============================================================================
// API Key Factory Functions
// ============================================================================

/**
 * Factory for generating secure API keys with proper formatting.
 * Supports different API key formats and security levels.
 * 
 * @param format API key format type
 * @param options Configuration options
 * @returns Generated API key string
 */
export function apiKeyFactory(
  format: 'standard' | 'jwt' | 'uuid' | 'custom' = 'standard',
  options: FactoryOptions = {}
): string {
  if (options.seed !== undefined) {
    faker.setSeed(options.seed);
  }

  const generators = {
    standard: () => faker.apiKey(),
    jwt: () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ 
        sub: faker.randomInt(1, 1000).toString(),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      }));
      const signature = faker.randomString(43, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_');
      return `${header}.${payload}.${signature}`;
    },
    uuid: () => {
      const chars = '0123456789abcdef';
      return `${faker.randomString(8, chars)}-${faker.randomString(4, chars)}-${faker.randomString(4, chars)}-${faker.randomString(4, chars)}-${faker.randomString(12, chars)}`;
    },
    custom: () => `df_${faker.randomString(24, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')}_${Date.now()}`,
  };

  return generators[format]();
}

/**
 * Factory for generating API key configurations with metadata
 */
export function apiKeyConfigFactory(options: FactoryOptions = {}) {
  if (options.seed !== undefined) {
    faker.setSeed(options.seed);
  }

  const baseConfig = {
    key: apiKeyFactory('standard', options),
    name: `${faker.appName().replace(/\s+/g, '-')}-key`,
    description: `API key for ${faker.appName()}`,
    isActive: faker.boolean(0.95),
    permissions: faker.randomChoice([
      ['read'],
      ['read', 'write'],
      ['read', 'write', 'delete'],
      ['admin'],
    ]),
    rateLimit: faker.randomInt(100, 10000),
    expiresAt: null as string | null,
    lastUsed: faker.pastDate(7),
    createdDate: faker.pastDate(365),
    createdById: faker.randomInt(1, 10),
  };

  // Sometimes add expiration
  if (faker.boolean(0.3)) {
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + faker.randomInt(30, 365));
    baseConfig.expiresAt = expDate.toISOString();
  }

  return { ...baseConfig, ...options.overrides };
}

// ============================================================================
// Factory Overrides System
// ============================================================================

/**
 * Factory override system allowing test-specific data customization.
 * Provides deep merge capability for complex object overrides.
 */
export class FactoryOverrides {
  private static deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key];
        const targetValue = result[key];
        
        if (
          sourceValue &&
          typeof sourceValue === 'object' &&
          !Array.isArray(sourceValue) &&
          targetValue &&
          typeof targetValue === 'object' &&
          !Array.isArray(targetValue)
        ) {
          result[key] = this.deepMerge(targetValue, sourceValue);
        } else {
          result[key] = sourceValue as T[Extract<keyof T, string>];
        }
      }
    }
    
    return result;
  }

  /**
   * Apply deep overrides to factory-generated object
   */
  static apply<T>(baseObject: T, overrides: Partial<T>): T {
    return this.deepMerge(baseObject, overrides);
  }

  /**
   * Create override preset for common testing scenarios
   */
  static createPreset<T>(name: string, overrides: Partial<T>): (base: T) => T {
    return (base: T) => this.apply(base, overrides);
  }
}

// ============================================================================
// Collection Factory Functions
// ============================================================================

/**
 * Factory for generating arrays of applications
 */
export function appCollectionFactory(count: number = 5, options: FactoryOptions = {}): AppType[] {
  const apps: AppType[] = [];
  
  for (let i = 0; i < count; i++) {
    apps.push(appDataFactory({
      seed: options.seed ? options.seed + i : undefined,
      overrides: options.overrides,
    }));
  }
  
  return apps;
}

/**
 * Factory for generating arrays of roles
 */
export function roleCollectionFactory(count: number = 3, options: FactoryOptions = {}): RoleType[] {
  const roles: RoleType[] = [];
  
  for (let i = 0; i < count; i++) {
    roles.push(roleFactory({
      seed: options.seed ? options.seed + i : undefined,
      overrides: options.overrides,
    }));
  }
  
  return roles;
}

/**
 * Comprehensive test data factory for complete application scenarios
 */
export function completeAppScenarioFactory(options: FactoryOptions = {}) {
  if (options.seed !== undefined) {
    faker.setSeed(options.seed);
  }

  const adminRole = roleScenarioFactory('admin');
  const userRole = roleScenarioFactory('user');
  const readonlyRole = roleScenarioFactory('readonly');

  const apps = [
    appConfigurationFactory('none', { overrides: { roleId: adminRole.id, roleByRoleId: adminRole } }),
    appConfigurationFactory('local', { overrides: { roleId: userRole.id, roleByRoleId: userRole } }),
    appConfigurationFactory('url', { overrides: { roleId: readonlyRole.id, roleByRoleId: readonlyRole } }),
    appConfigurationFactory('cloud_storage', { overrides: { roleId: adminRole.id, roleByRoleId: adminRole } }),
  ];

  const apiKeys = apps.map(app => apiKeyConfigFactory({ overrides: { key: app.apiKey } }));

  return {
    roles: [adminRole, userRole, readonlyRole],
    apps,
    apiKeys,
    storageConfigs: [
      storageConfigurationFactory({ overrides: { serviceName: 's3-production' } }),
      storageConfigurationFactory({ overrides: { serviceName: 'local-development' } }),
    ],
  };
}

// ============================================================================
// Legacy Compatibility Exports
// ============================================================================

/**
 * Legacy ROLES export for backward compatibility with existing tests.
 * Replaced by roleFactory for enhanced testing flexibility.
 * @deprecated Use roleScenarioFactory or roleFactory instead
 */
export const ROLES = [
  roleScenarioFactory('admin'),
  roleScenarioFactory('user'),
  roleScenarioFactory('readonly'),
  roleScenarioFactory('manager'),
];

/**
 * Legacy EDIT_DATA export for backward compatibility.
 * Replaced by appDataFactory for dynamic data generation.
 * @deprecated Use appDataFactory or appConfigurationFactory instead
 */
export const EDIT_DATA = appDataFactory({
  seed: 12345, // Fixed seed for consistency with legacy tests
  overrides: {
    name: 'sample-app',
    description: 'Sample application for testing',
    isActive: true,
  },
});

// ============================================================================
// Default Exports for Convenience
// ============================================================================

export default {
  // Role factories
  roleFactory,
  roleListItemFactory,
  createRoleDataFactory,
  roleScenarioFactory,
  roleCollectionFactory,
  
  // App factories
  appDataFactory,
  appRowFactory,
  appPayloadFactory,
  appConfigurationFactory,
  appCollectionFactory,
  
  // Storage factories
  storageConfigurationFactory,
  
  // API key factories
  apiKeyFactory,
  apiKeyConfigFactory,
  
  // Utility factories
  FactoryOverrides,
  completeAppScenarioFactory,
  
  // Legacy compatibility
  ROLES,
  EDIT_DATA,
};