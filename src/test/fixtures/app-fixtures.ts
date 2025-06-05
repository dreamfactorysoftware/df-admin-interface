/**
 * Application domain fixture factory functions for React component testing.
 * Provides configurable factory functions for creating realistic app configuration data,
 * replacing static Angular mock data with dynamic React testing patterns.
 * 
 * Compatible with Vitest 2.1.0 testing framework for 10x faster test execution.
 * Integrates with @testing-library/react for enhanced React component testing.
 */

import { faker } from '@faker-js/faker';

// Type imports for app-related entities
import type { AppRow, AppType, AppPayload } from '../../types/apps';
import type { RoleRow, RoleType } from '../../types/role';

/**
 * Factory override system for test-specific data customization
 */
export interface FactoryOverrides<T> {
  [K in keyof T]?: T[K] | (() => T[K]);
}

/**
 * App configuration types for storage and hosting scenarios
 */
export interface AppStorageConfiguration {
  storageServiceId?: number;
  storageContainer?: string;
  path?: string;
  requiresFullscreen: boolean;
  allowFullscreenToggle: boolean;
  toggleLocation: string;
}

export interface AppHostingConfiguration {
  type: number; // app location (0=None, 1=Server, 2=URL, 3=Path)
  url?: string;
  path?: string;
  launchUrl: string;
}

/**
 * API Key configuration interface
 */
export interface ApiKeyConfiguration {
  keyLength?: number;
  prefix?: string;
  includeTimestamp?: boolean;
  format?: 'hex' | 'base64' | 'uuid';
}

/**
 * Role factory function for generating role objects with proper TypeScript typing
 */
export function roleFactory(overrides: FactoryOverrides<RoleType> = {}): RoleType {
  const baseRole: RoleType = {
    id: faker.number.int({ min: 1, max: 1000 }),
    name: faker.person.jobTitle().toLowerCase().replace(/\s+/g, '_'),
    description: faker.lorem.sentence(),
    isActive: faker.datatype.boolean(0.8), // 80% chance of being active
    createdById: faker.number.int({ min: 1, max: 100 }),
    createdDate: faker.date.past().toISOString(),
    lastModifiedById: faker.number.int({ min: 1, max: 100 }),
    lastModifiedDate: faker.date.recent().toISOString(),
    lookupByRoleId: faker.helpers.arrayElements(
      Array.from({ length: 10 }, (_, i) => i + 1),
      { min: 0, max: 5 }
    ),
    accessibleTabs: faker.helpers.arrayElements([
      'schema',
      'data',
      'api-docs',
      'services',
      'roles',
      'users',
      'apps',
      'files',
      'scripts',
      'config',
      'logs'
    ], { min: 1, max: 6 })
  };

  // Apply overrides with support for both values and functions
  return Object.keys(overrides).reduce((acc, key) => {
    const override = overrides[key as keyof RoleType];
    if (typeof override === 'function') {
      acc[key as keyof RoleType] = override() as any;
    } else {
      acc[key as keyof RoleType] = override as any;
    }
    return acc;
  }, { ...baseRole });
}

/**
 * Simple role row factory for table/list view scenarios
 */
export function roleRowFactory(overrides: FactoryOverrides<RoleRow> = {}): RoleRow {
  const fullRole = roleFactory(overrides);
  const roleRow: RoleRow = {
    id: fullRole.id,
    name: fullRole.name,
    description: fullRole.description,
    active: fullRole.isActive
  };

  // Apply any RoleRow-specific overrides
  return Object.keys(overrides).reduce((acc, key) => {
    if (key in roleRow) {
      const override = overrides[key as keyof RoleRow];
      if (typeof override === 'function') {
        acc[key as keyof RoleRow] = override() as any;
      } else {
        acc[key as keyof RoleRow] = override as any;
      }
    }
    return acc;
  }, { ...roleRow });
}

/**
 * App storage and hosting configuration factory
 */
export function appConfigurationFactory(
  overrides: FactoryOverrides<AppStorageConfiguration & AppHostingConfiguration> = {}
): AppStorageConfiguration & AppHostingConfiguration {
  const appType = faker.number.int({ min: 0, max: 3 });
  
  const baseConfig: AppStorageConfiguration & AppHostingConfiguration = {
    type: appType,
    storageServiceId: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 10 }), { probability: 0.3 }),
    storageContainer: faker.helpers.maybe(() => faker.system.directoryPath(), { probability: 0.3 }),
    path: faker.helpers.maybe(() => faker.system.filePath(), { probability: 0.4 }),
    url: appType === 2 ? faker.internet.url() : undefined,
    requiresFullscreen: faker.datatype.boolean(0.2), // 20% chance of requiring fullscreen
    allowFullscreenToggle: faker.datatype.boolean(0.6), // 60% chance of allowing toggle
    toggleLocation: faker.helpers.arrayElement(['top-right', 'top-left', 'bottom-right', 'bottom-left']),
    launchUrl: faker.internet.url()
  };

  // Apply overrides
  return Object.keys(overrides).reduce((acc, key) => {
    const override = overrides[key as keyof (AppStorageConfiguration & AppHostingConfiguration)];
    if (typeof override === 'function') {
      acc[key as keyof (AppStorageConfiguration & AppHostingConfiguration)] = override() as any;
    } else {
      acc[key as keyof (AppStorageConfiguration & AppHostingConfiguration)] = override as any;
    }
    return acc;
  }, { ...baseConfig });
}

/**
 * API Key factory for generating secure API keys with proper formatting
 */
export function apiKeyFactory(config: ApiKeyConfiguration = {}): string {
  const {
    keyLength = 32,
    prefix = 'df',
    includeTimestamp = false,
    format = 'hex'
  } = config;

  let key: string;

  switch (format) {
    case 'uuid':
      key = faker.string.uuid();
      break;
    case 'base64':
      key = Buffer.from(faker.string.alphanumeric(keyLength)).toString('base64');
      break;
    case 'hex':
    default:
      key = faker.string.hexadecimal({ length: keyLength }).slice(2); // Remove '0x' prefix
      break;
  }

  // Add timestamp if requested
  if (includeTimestamp) {
    const timestamp = Date.now().toString(36);
    key = `${key}_${timestamp}`;
  }

  // Add prefix
  return prefix ? `${prefix}_${key}` : key;
}

/**
 * App row factory for table/list view scenarios
 */
export function appRowFactory(overrides: FactoryOverrides<AppRow> = {}): AppRow {
  const role = roleFactory();
  
  const baseAppRow: AppRow = {
    id: faker.number.int({ min: 1, max: 1000 }),
    name: faker.company.name().toLowerCase().replace(/[^a-z0-9]/g, '_'),
    role: role.name,
    apiKey: apiKeyFactory(),
    description: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.7 }),
    active: faker.datatype.boolean(0.8),
    launchUrl: faker.internet.url(),
    createdById: faker.number.int({ min: 1, max: 100 })
  };

  // Apply overrides
  return Object.keys(overrides).reduce((acc, key) => {
    const override = overrides[key as keyof AppRow];
    if (typeof override === 'function') {
      acc[key as keyof AppRow] = override() as any;
    } else {
      acc[key as keyof AppRow] = override as any;
    }
    return acc;
  }, { ...baseAppRow });
}

/**
 * Configurable appDataFactory function that generates application records with realistic field values
 */
export function appDataFactory(overrides: FactoryOverrides<AppType> = {}): AppType {
  const role = roleFactory();
  const config = appConfigurationFactory();
  
  const baseApp: AppType = {
    id: faker.number.int({ min: 1, max: 1000 }),
    name: faker.company.name().toLowerCase().replace(/[^a-z0-9]/g, '_'),
    apiKey: apiKeyFactory(),
    description: faker.lorem.paragraph(),
    isActive: faker.datatype.boolean(0.8),
    type: config.type,
    path: config.path,
    url: config.url,
    storageServiceId: config.storageServiceId,
    storageContainer: config.storageContainer,
    requiresFullscreen: config.requiresFullscreen,
    allowFullscreenToggle: config.allowFullscreenToggle,
    toggleLocation: config.toggleLocation,
    roleId: faker.helpers.maybe(() => role.id, { probability: 0.7 }),
    createdDate: faker.date.past().toISOString(),
    lastModifiedDate: faker.date.recent().toISOString(),
    createdById: faker.number.int({ min: 1, max: 100 }),
    lastModifiedById: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 100 }), { probability: 0.8 }),
    launchUrl: config.launchUrl,
    roleByRoleId: faker.helpers.maybe(() => role, { probability: 0.7 })
  };

  // Apply overrides
  return Object.keys(overrides).reduce((acc, key) => {
    const override = overrides[key as keyof AppType];
    if (typeof override === 'function') {
      acc[key as keyof AppType] = override() as any;
    } else {
      acc[key as keyof AppType] = override as any;
    }
    return acc;
  }, { ...baseApp });
}

/**
 * App payload factory for create/update operations
 */
export function appPayloadFactory(overrides: FactoryOverrides<AppPayload> = {}): AppPayload {
  const config = appConfigurationFactory();
  
  const basePayload: AppPayload = {
    name: faker.company.name().toLowerCase().replace(/[^a-z0-9]/g, '_'),
    description: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.7 }),
    type: config.type,
    role_id: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 50 }), { probability: 0.7 }),
    is_active: faker.datatype.boolean(0.8),
    url: config.url,
    storage_service_id: config.storageServiceId,
    storage_container: config.storageContainer,
    path: config.path
  };

  // Apply overrides
  return Object.keys(overrides).reduce((acc, key) => {
    const override = overrides[key as keyof AppPayload];
    if (typeof override === 'function') {
      acc[key as keyof AppPayload] = override() as any;
    } else {
      acc[key as keyof AppPayload] = override as any;
    }
    return acc;
  }, { ...basePayload });
}

/**
 * Batch factory functions for creating multiple instances
 */
export function createAppRows(count: number, overrides: FactoryOverrides<AppRow> = {}): AppRow[] {
  return Array.from({ length: count }, () => appRowFactory(overrides));
}

export function createApps(count: number, overrides: FactoryOverrides<AppType> = {}): AppType[] {
  return Array.from({ length: count }, () => appDataFactory(overrides));
}

export function createRoles(count: number, overrides: FactoryOverrides<RoleType> = {}): RoleType[] {
  return Array.from({ length: count }, () => roleFactory(overrides));
}

export function createRoleRows(count: number, overrides: FactoryOverrides<RoleRow> = {}): RoleRow[] {
  return Array.from({ length: count }, () => roleRowFactory(overrides));
}

/**
 * Predefined app scenarios for common testing patterns
 */
export const appScenarios = {
  /**
   * Active server-based application with full configuration
   */
  serverApp: (overrides: FactoryOverrides<AppType> = {}) => appDataFactory({
    isActive: true,
    type: 1, // Server
    requiresFullscreen: false,
    allowFullscreenToggle: true,
    roleId: () => faker.number.int({ min: 1, max: 10 }),
    ...overrides
  }),

  /**
   * URL-based application for external integrations
   */
  urlApp: (overrides: FactoryOverrides<AppType> = {}) => appDataFactory({
    isActive: true,
    type: 2, // URL
    url: () => faker.internet.url(),
    path: undefined,
    storageServiceId: undefined,
    storageContainer: undefined,
    ...overrides
  }),

  /**
   * Path-based application for file system apps
   */
  pathApp: (overrides: FactoryOverrides<AppType> = {}) => appDataFactory({
    isActive: true,
    type: 3, // Path
    path: () => faker.system.filePath(),
    url: undefined,
    storageServiceId: () => faker.number.int({ min: 1, max: 5 }),
    storageContainer: () => faker.system.directoryPath(),
    ...overrides
  }),

  /**
   * Inactive/disabled application
   */
  inactiveApp: (overrides: FactoryOverrides<AppType> = {}) => appDataFactory({
    isActive: false,
    roleId: undefined,
    roleByRoleId: undefined,
    ...overrides
  }),

  /**
   * Fullscreen application configuration
   */
  fullscreenApp: (overrides: FactoryOverrides<AppType> = {}) => appDataFactory({
    requiresFullscreen: true,
    allowFullscreenToggle: false,
    toggleLocation: 'top-right',
    ...overrides
  })
};

/**
 * Predefined role scenarios for common testing patterns
 */
export const roleScenarios = {
  /**
   * Admin role with full access
   */
  adminRole: (overrides: FactoryOverrides<RoleType> = {}) => roleFactory({
    name: 'admin',
    description: 'Full administrative access',
    isActive: true,
    accessibleTabs: ['schema', 'data', 'api-docs', 'services', 'roles', 'users', 'apps', 'files', 'scripts', 'config', 'logs'],
    ...overrides
  }),

  /**
   * Read-only role with limited access
   */
  readOnlyRole: (overrides: FactoryOverrides<RoleType> = {}) => roleFactory({
    name: 'readonly',
    description: 'Read-only access to data and documentation',
    isActive: true,
    accessibleTabs: ['data', 'api-docs'],
    ...overrides
  }),

  /**
   * Developer role with schema and API access
   */
  developerRole: (overrides: FactoryOverrides<RoleType> = {}) => roleFactory({
    name: 'developer',
    description: 'Development and API management access',
    isActive: true,
    accessibleTabs: ['schema', 'data', 'api-docs', 'services', 'scripts'],
    ...overrides
  }),

  /**
   * Inactive/disabled role
   */
  inactiveRole: (overrides: FactoryOverrides<RoleType> = {}) => roleFactory({
    isActive: false,
    accessibleTabs: [],
    ...overrides
  })
};

// Export legacy compatibility for existing Angular tests that might reference ROLES
export const ROLES = {
  admin: () => roleScenarios.adminRole(),
  readonly: () => roleScenarios.readOnlyRole(),
  developer: () => roleScenarios.developerRole()
};

// Export legacy compatibility for existing Angular tests that might reference EDIT_DATA
export const EDIT_DATA = {
  app: () => appDataFactory(),
  appRow: () => appRowFactory(),
  appPayload: () => appPayloadFactory()
};