/**
 * Testing Utilities and Data Factories
 * 
 * Provides comprehensive testing utilities, data factories, and helper functions
 * for React component testing. Includes mock data generation, test helpers,
 * and utility functions that support isolated component testing and realistic
 * test scenario creation.
 */

import { faker } from '@faker-js/faker';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient } from '@tanstack/react-query';

import { 
  UserSession, 
  RBAC_PERMISSIONS,
  type RBACPermission,
} from '../../lib/auth/session';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Database service mock data structure
 */
export interface MockDatabaseService {
  id: number;
  name: string;
  label: string;
  description: string;
  type: 'sql_db' | 'nosql_db' | 'file' | 'http' | 'email';
  config: {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    driver?: string;
    options?: Record<string, any>;
  };
  is_active: boolean;
  created_date: string;
  last_modified_date: string;
  created_by_id: number;
  last_modified_by_id: number;
}

/**
 * Database table mock data structure
 */
export interface MockDatabaseTable {
  name: string;
  label: string;
  plural: string;
  primary_key: string[];
  name_field: string | null;
  description: string | null;
  is_view: boolean;
  access: number;
  field: MockDatabaseField[];
  related: MockDatabaseRelation[];
}

/**
 * Database field mock data structure
 */
export interface MockDatabaseField {
  name: string;
  label: string;
  type: string;
  db_type: string;
  length?: number;
  precision?: number;
  scale?: number;
  default?: any;
  required: boolean;
  allow_null: boolean;
  auto_increment: boolean;
  is_primary_key: boolean;
  is_unique: boolean;
  is_index: boolean;
  is_foreign_key: boolean;
  ref_table?: string;
  ref_field?: string;
  validation?: string[];
  description?: string;
}

/**
 * Database relation mock data structure
 */
export interface MockDatabaseRelation {
  name: string;
  label: string;
  type: 'belongs_to' | 'has_one' | 'has_many' | 'many_many';
  field: string;
  ref_service_id: number;
  ref_table: string;
  ref_field: string;
  always_fetch: boolean;
  flatten: boolean;
}

/**
 * Mock user data structure
 */
export interface MockUser {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  phone?: string;
  security_question?: string;
  default_app_id?: number;
  oauth_provider?: string;
  created_date: string;
  last_modified_date: string;
  created_by_id: number;
  last_modified_by_id: number;
}

/**
 * Mock role data structure
 */
export interface MockRole {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  role_service_access_by_role_id: MockRoleServiceAccess[];
  role_lookup_by_role_id: MockRoleLookup[];
  created_date: string;
  last_modified_date: string;
}

/**
 * Mock role service access structure
 */
export interface MockRoleServiceAccess {
  id: number;
  role_id: number;
  service_id: number;
  component: string;
  verb_mask: number;
  requestor_type: string;
  filters: any[];
  filter_op: string;
}

/**
 * Mock role lookup structure
 */
export interface MockRoleLookup {
  id: number;
  role_id: number;
  name: string;
  value: string;
  private: boolean;
  description?: string;
}

/**
 * Test data factory options
 */
export interface FactoryOptions {
  count?: number;
  overrides?: Partial<any>;
  relationships?: boolean;
}

// =============================================================================
// DATA FACTORIES
// =============================================================================

/**
 * Creates mock database service data
 */
export function createMockService(overrides: Partial<MockDatabaseService> = {}): MockDatabaseService {
  const serviceTypes = ['sql_db', 'nosql_db', 'file', 'http', 'email'] as const;
  const serviceType = overrides.type || faker.helpers.arrayElement(serviceTypes);
  
  const baseService: MockDatabaseService = {
    id: faker.number.int({ min: 1, max: 1000 }),
    name: faker.lorem.slug(),
    label: faker.company.name(),
    description: faker.lorem.sentence(),
    type: serviceType,
    config: {},
    is_active: true,
    created_date: faker.date.past().toISOString(),
    last_modified_date: faker.date.recent().toISOString(),
    created_by_id: 1,
    last_modified_by_id: 1,
  };

  // Add type-specific configuration
  if (serviceType === 'sql_db') {
    baseService.config = {
      host: faker.internet.domainName(),
      port: faker.number.int({ min: 3000, max: 5432 }),
      database: faker.lorem.word(),
      username: faker.internet.userName(),
      driver: faker.helpers.arrayElement(['mysql', 'pgsql', 'sqlite']),
      options: {
        charset: 'utf8mb4',
        collation: 'utf8mb4_unicode_ci',
      },
    };
  } else if (serviceType === 'nosql_db') {
    baseService.config = {
      host: faker.internet.domainName(),
      port: faker.number.int({ min: 27017, max: 27020 }),
      database: faker.lorem.word(),
      username: faker.internet.userName(),
      options: {
        authSource: 'admin',
        readPreference: 'primary',
      },
    };
  }

  return { ...baseService, ...overrides };
}

/**
 * Creates multiple mock database services
 */
export function createMockServices(options: FactoryOptions = {}): MockDatabaseService[] {
  const { count = 5, overrides = {} } = options;
  return Array.from({ length: count }, () => createMockService(overrides));
}

/**
 * Creates mock database field data
 */
export function createMockField(overrides: Partial<MockDatabaseField> = {}): MockDatabaseField {
  const fieldTypes = ['string', 'integer', 'boolean', 'datetime', 'text', 'decimal'];
  const dbTypes = ['varchar(255)', 'int(11)', 'tinyint(1)', 'datetime', 'text', 'decimal(10,2)'];
  
  const fieldType = faker.helpers.arrayElement(fieldTypes);
  const dbType = faker.helpers.arrayElement(dbTypes);

  return {
    name: faker.lorem.word().toLowerCase(),
    label: faker.lorem.words(2),
    type: fieldType,
    db_type: dbType,
    length: fieldType === 'string' ? faker.number.int({ min: 50, max: 255 }) : undefined,
    precision: fieldType === 'decimal' ? 10 : undefined,
    scale: fieldType === 'decimal' ? 2 : undefined,
    default: fieldType === 'boolean' ? faker.datatype.boolean() : null,
    required: faker.datatype.boolean(),
    allow_null: faker.datatype.boolean(),
    auto_increment: fieldType === 'integer' ? faker.datatype.boolean() : false,
    is_primary_key: false,
    is_unique: faker.datatype.boolean(),
    is_index: faker.datatype.boolean(),
    is_foreign_key: false,
    validation: faker.datatype.boolean() ? [faker.lorem.sentence()] : undefined,
    description: faker.datatype.boolean() ? faker.lorem.sentence() : undefined,
    ...overrides,
  };
}

/**
 * Creates mock database relation data
 */
export function createMockRelation(overrides: Partial<MockDatabaseRelation> = {}): MockDatabaseRelation {
  const relationTypes = ['belongs_to', 'has_one', 'has_many', 'many_many'] as const;
  
  return {
    name: faker.lorem.word(),
    label: faker.lorem.words(2),
    type: faker.helpers.arrayElement(relationTypes),
    field: faker.lorem.word().toLowerCase(),
    ref_service_id: faker.number.int({ min: 1, max: 100 }),
    ref_table: faker.lorem.word(),
    ref_field: faker.lorem.word().toLowerCase(),
    always_fetch: faker.datatype.boolean(),
    flatten: faker.datatype.boolean(),
    ...overrides,
  };
}

/**
 * Creates mock database table data
 */
export function createMockTable(overrides: Partial<MockDatabaseTable> = {}): MockDatabaseTable {
  const fieldCount = faker.number.int({ min: 3, max: 10 });
  const relationCount = faker.number.int({ min: 0, max: 3 });
  
  const fields = Array.from({ length: fieldCount }, (_, index) => 
    createMockField(index === 0 ? { 
      name: 'id', 
      is_primary_key: true, 
      auto_increment: true,
      type: 'integer',
      required: true,
      allow_null: false,
    } : {})
  );

  const relations = Array.from({ length: relationCount }, () => createMockRelation());

  return {
    name: faker.lorem.word().toLowerCase(),
    label: faker.lorem.words(2),
    plural: faker.lorem.words(2),
    primary_key: ['id'],
    name_field: faker.datatype.boolean() ? fields[1]?.name || 'name' : null,
    description: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    is_view: faker.datatype.boolean(),
    access: 31, // Full access
    field: fields,
    related: relations,
    ...overrides,
  };
}

/**
 * Creates multiple mock database tables
 */
export function createMockTables(options: FactoryOptions = {}): MockDatabaseTable[] {
  const { count = 5, overrides = {} } = options;
  return Array.from({ length: count }, () => createMockTable(overrides));
}

/**
 * Creates mock user data
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  
  return {
    id: faker.number.int({ min: 1, max: 1000 }),
    name: `${firstName} ${lastName}`,
    first_name: firstName,
    last_name: lastName,
    email: faker.internet.email(),
    is_active: true,
    phone: faker.datatype.boolean() ? faker.phone.number() : undefined,
    security_question: faker.datatype.boolean() ? faker.lorem.sentence() : undefined,
    default_app_id: faker.datatype.boolean() ? faker.number.int({ min: 1, max: 10 }) : undefined,
    oauth_provider: faker.datatype.boolean() ? faker.helpers.arrayElement(['google', 'facebook', 'github']) : undefined,
    created_date: faker.date.past().toISOString(),
    last_modified_date: faker.date.recent().toISOString(),
    created_by_id: 1,
    last_modified_by_id: 1,
    ...overrides,
  };
}

/**
 * Creates multiple mock users
 */
export function createMockUsers(options: FactoryOptions = {}): MockUser[] {
  const { count = 10, overrides = {} } = options;
  return Array.from({ length: count }, () => createMockUser(overrides));
}

/**
 * Creates mock role service access data
 */
export function createMockRoleServiceAccess(overrides: Partial<MockRoleServiceAccess> = {}): MockRoleServiceAccess {
  return {
    id: faker.number.int({ min: 1, max: 1000 }),
    role_id: faker.number.int({ min: 1, max: 100 }),
    service_id: faker.number.int({ min: 1, max: 100 }),
    component: faker.helpers.arrayElement(['*', 'table/*', 'procedure/*', 'function/*']),
    verb_mask: faker.number.int({ min: 1, max: 31 }), // Bitmask for CRUD operations
    requestor_type: faker.helpers.arrayElement(['API', 'Script', 'Admin']),
    filters: [],
    filter_op: 'AND',
    ...overrides,
  };
}

/**
 * Creates mock role lookup data
 */
export function createMockRoleLookup(overrides: Partial<MockRoleLookup> = {}): MockRoleLookup {
  return {
    id: faker.number.int({ min: 1, max: 1000 }),
    role_id: faker.number.int({ min: 1, max: 100 }),
    name: faker.lorem.word().toUpperCase(),
    value: faker.lorem.word(),
    private: faker.datatype.boolean(),
    description: faker.datatype.boolean() ? faker.lorem.sentence() : undefined,
    ...overrides,
  };
}

/**
 * Creates mock role data
 */
export function createMockRole(overrides: Partial<MockRole> = {}): MockRole {
  const serviceAccessCount = faker.number.int({ min: 1, max: 5 });
  const lookupCount = faker.number.int({ min: 0, max: 3 });
  
  return {
    id: faker.number.int({ min: 1, max: 100 }),
    name: faker.lorem.word(),
    description: faker.lorem.sentence(),
    is_active: true,
    role_service_access_by_role_id: Array.from({ length: serviceAccessCount }, () => 
      createMockRoleServiceAccess()
    ),
    role_lookup_by_role_id: Array.from({ length: lookupCount }, () => 
      createMockRoleLookup()
    ),
    created_date: faker.date.past().toISOString(),
    last_modified_date: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Creates multiple mock roles
 */
export function createMockRoles(options: FactoryOptions = {}): MockRole[] {
  const { count = 5, overrides = {} } = options;
  return Array.from({ length: count }, () => createMockRole(overrides));
}

/**
 * Creates mock session data for testing
 */
export function createMockSession(overrides: Partial<UserSession> = {}): UserSession {
  return {
    userId: faker.string.uuid(),
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    displayName: faker.person.fullName(),
    roles: ['user'],
    permissions: [RBAC_PERMISSIONS.USER_READ],
    sessionId: faker.string.uuid(),
    sessionToken: faker.string.uuid(),
    refreshToken: faker.string.uuid(),
    csrfToken: faker.string.uuid(),
    issuedAt: Date.now(),
    expiresAt: Date.now() + 3600000, // 1 hour
    lastActivity: Date.now(),
    isRootAdmin: false,
    isSysAdmin: false,
    roleId: faker.string.uuid(),
    accessibleTabs: [],
    preferences: {},
    ...overrides,
  };
}

// =============================================================================
// TEST UTILITIES
// =============================================================================

/**
 * Types a value into an input field
 */
export async function typeIntoInput(element: HTMLElement, value: string): Promise<void> {
  const user = userEvent.setup();
  await user.clear(element);
  await user.type(element, value);
}

/**
 * Selects an option from a select element
 */
export async function selectOption(selectElement: HTMLElement, optionValue: string): Promise<void> {
  const user = userEvent.setup();
  await user.selectOptions(selectElement, optionValue);
}

/**
 * Clicks an element and waits for any side effects
 */
export async function clickElement(element: HTMLElement): Promise<void> {
  const user = userEvent.setup();
  await user.click(element);
}

/**
 * Submits a form and waits for completion
 */
export async function submitForm(formElement: HTMLElement): Promise<void> {
  fireEvent.submit(formElement);
  await waitFor(() => {
    // Wait for any async operations to complete
  });
}

/**
 * Waits for an element to appear in the DOM
 */
export async function waitForElement(testId: string, timeout: number = 5000): Promise<HTMLElement> {
  return await screen.findByTestId(testId, {}, { timeout });
}

/**
 * Waits for an element to disappear from the DOM
 */
export async function waitForElementToDisappear(testId: string, timeout: number = 5000): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
  }, { timeout });
}

/**
 * Waits for loading states to complete
 */
export async function waitForLoadingToComplete(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
}

/**
 * Checks if an element has specific CSS classes
 */
export function expectElementToHaveClasses(element: HTMLElement, classes: string[]): void {
  classes.forEach(className => {
    expect(element).toHaveClass(className);
  });
}

/**
 * Checks if an element has accessibility attributes
 */
export function expectElementToBeAccessible(element: HTMLElement): void {
  // Check for basic accessibility attributes
  if (element.tagName === 'BUTTON') {
    expect(element).toHaveAttribute('type');
  }
  
  if (element.tagName === 'INPUT') {
    expect(element).toHaveAttribute('type');
    if (element.getAttribute('required')) {
      expect(element).toHaveAttribute('aria-required', 'true');
    }
  }
  
  if (element.getAttribute('aria-expanded')) {
    expect(['true', 'false']).toContain(element.getAttribute('aria-expanded'));
  }
}

/**
 * Simulates keyboard navigation
 */
export async function navigateWithKeyboard(key: string, element?: HTMLElement): Promise<void> {
  const user = userEvent.setup();
  const target = element || document.body;
  
  if (target instanceof HTMLElement) {
    target.focus();
  }
  
  await user.keyboard(`{${key}}`);
}

/**
 * Tests component focus management
 */
export async function testFocusManagement(
  triggerElement: HTMLElement, 
  expectedFocusElement: HTMLElement
): Promise<void> {
  const user = userEvent.setup();
  
  await user.click(triggerElement);
  
  await waitFor(() => {
    expect(expectedFocusElement).toHaveFocus();
  });
}

/**
 * Simulates file upload
 */
export async function uploadFile(inputElement: HTMLInputElement, file: File): Promise<void> {
  const user = userEvent.setup();
  await user.upload(inputElement, file);
}

/**
 * Creates a mock file for testing file uploads
 */
export function createMockFile(
  name: string = 'test.txt',
  content: string = 'test content',
  type: string = 'text/plain'
): File {
  return new File([content], name, { type });
}

/**
 * Creates multiple mock files
 */
export function createMockFiles(count: number = 3): File[] {
  return Array.from({ length: count }, (_, index) => 
    createMockFile(`test-${index + 1}.txt`, `Test content ${index + 1}`)
  );
}

/**
 * Waits for React Query to settle (all queries/mutations complete)
 */
export async function waitForReactQueryToSettle(queryClient: QueryClient): Promise<void> {
  await waitFor(() => {
    const queryCache = queryClient.getQueryCache();
    const mutationCache = queryClient.getMutationCache();
    
    const pendingQueries = queryCache.findAll({ 
      predicate: query => query.state.fetchStatus === 'fetching' 
    });
    
    const pendingMutations = mutationCache.findAll({ 
      predicate: mutation => mutation.state.status === 'pending' 
    });
    
    expect(pendingQueries).toHaveLength(0);
    expect(pendingMutations).toHaveLength(0);
  });
}

/**
 * Flushes all pending promises
 */
export async function flushPromises(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Debug helper to log component structure
 */
export function debugComponent(container?: HTMLElement): void {
  if (process.env.NODE_ENV === 'test') {
    console.log(screen.debug(container));
  }
}

/**
 * Checks if component renders without errors
 */
export function expectNoErrors(): void {
  expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
  expect(() => screen.getByRole('alert')).toThrow();
}

// =============================================================================
// ASSERTION HELPERS
// =============================================================================

/**
 * Custom matchers for testing library
 */
export const customMatchers = {
  toBeVisible: (element: HTMLElement) => ({
    pass: element.style.display !== 'none' && element.style.visibility !== 'hidden',
    message: () => `Expected element to be visible`,
  }),
  
  toHaveLoadingState: (element: HTMLElement) => ({
    pass: element.getAttribute('aria-busy') === 'true' || 
          element.getAttribute('data-loading') === 'true',
    message: () => `Expected element to have loading state`,
  }),
  
  toBeAccessibleButton: (element: HTMLElement) => {
    const isButton = element.tagName === 'BUTTON' || element.getAttribute('role') === 'button';
    const hasType = element.hasAttribute('type');
    const hasAccessibleName = element.hasAttribute('aria-label') || 
                             element.hasAttribute('aria-labelledby') || 
                             element.textContent?.trim();
    
    return {
      pass: isButton && hasType && !!hasAccessibleName,
      message: () => `Expected element to be an accessible button`,
    };
  },
};

// =============================================================================
// MOCK DATA CONSTANTS
// =============================================================================

/**
 * Common mock data for consistent testing
 */
export const MOCK_DATA = {
  DATABASE_TYPES: ['mysql', 'postgresql', 'mongodb', 'sqlite', 'oracle', 'mssql'],
  FIELD_TYPES: ['string', 'integer', 'boolean', 'datetime', 'text', 'decimal', 'json'],
  VERB_MASKS: {
    NONE: 0,
    GET: 1,
    POST: 2,
    PUT: 4,
    PATCH: 8,
    DELETE: 16,
    ALL: 31,
  },
  COMMON_ROLES: ['admin', 'user', 'guest', 'developer', 'operator'],
  COMMON_PERMISSIONS: Object.values(RBAC_PERMISSIONS),
  SAMPLE_EMAILS: [
    'admin@example.com',
    'user@example.com',
    'developer@example.com',
    'test@dreamfactory.com',
  ],
} as const;

// =============================================================================
// EXPORTS
// =============================================================================

export {
  type MockDatabaseService,
  type MockDatabaseTable,
  type MockDatabaseField,
  type MockDatabaseRelation,
  type MockUser,
  type MockRole,
  type MockRoleServiceAccess,
  type MockRoleLookup,
  type FactoryOptions,
};