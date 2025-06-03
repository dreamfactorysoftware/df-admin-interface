/**
 * Testing Utility Types for DreamFactory Admin Interface
 * 
 * Comprehensive type definitions for the modernized testing framework stack:
 * - Vitest testing framework replacing Jest/Karma for 10x faster test execution
 * - Mock Service Worker (MSW) for realistic API mocking during development
 * - React Testing Library for component testing with accessibility focus
 * - Integration with React Hook Form and Zod validation
 * - Performance testing types for build time optimization
 * - E2E testing integration with Playwright
 * 
 * @version 1.0.0
 * @framework React 19/Next.js 15.1
 */

import type { RenderOptions, RenderResult, screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import type { MockInstance, MockedFunction, MockRestore } from 'vitest';
import type { RestHandler, DefaultBodyType } from 'msw';
import type { SetupServerApi } from 'msw/node';
import type { 
  UseFormReturn, 
  FieldValues, 
  FieldErrors,
  FormState 
} from 'react-hook-form';
import type { ZodSchema, ZodIssue } from 'zod';
import type { 
  UseQueryResult, 
  UseMutationResult, 
  QueryClient 
} from '@tanstack/react-query';

// ============================================================================
// Core API Types (Expected to be defined in src/types/api.ts)
// ============================================================================

/**
 * Base API response structure for DreamFactory endpoints
 */
export interface ApiResponse<T = unknown> {
  resource?: T;
  meta?: {
    count?: number;
    schema?: string[];
  };
  error?: {
    code: number;
    message: string;
    details?: unknown;
  };
}

/**
 * Database connection configuration
 */
export interface DatabaseConnection {
  id?: string;
  name: string;
  type: 'mysql' | 'postgresql' | 'mongodb' | 'sql_server' | 'oracle' | 'snowflake';
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  is_active?: boolean;
  created_date?: string;
  last_modified_date?: string;
}

/**
 * User profile structure
 */
export interface User {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  is_active: boolean;
  role?: {
    id: number;
    name: string;
    description?: string;
  };
  created_date?: string;
  last_login_date?: string;
}

// ============================================================================
// Vitest Testing Framework Types
// ============================================================================

/**
 * Enhanced Vitest test context with DreamFactory-specific utilities
 */
export interface DreamFactoryTestContext {
  /** Current test name for debugging */
  testName: string;
  /** Mock cleanup functions */
  cleanup: MockRestore[];
  /** Test-specific query client instance */
  queryClient: QueryClient;
  /** MSW server instance for API mocking */
  server: SetupServerApi;
  /** Performance measurement utilities */
  performance: TestPerformanceUtils;
}

/**
 * Vitest suite configuration for component testing
 */
export interface ComponentTestSuite {
  /** Test description */
  describe: string;
  /** Setup function called before each test */
  beforeEach?: (context: DreamFactoryTestContext) => void | Promise<void>;
  /** Cleanup function called after each test */
  afterEach?: (context: DreamFactoryTestContext) => void | Promise<void>;
  /** Test cases definition */
  tests: ComponentTestCase[];
}

/**
 * Individual component test case
 */
export interface ComponentTestCase {
  /** Test case description */
  it: string;
  /** Test implementation */
  test: (context: DreamFactoryTestContext) => void | Promise<void>;
  /** Skip this test */
  skip?: boolean;
  /** Only run this test */
  only?: boolean;
  /** Test timeout in milliseconds */
  timeout?: number;
}

/**
 * Vitest mock utilities for React components
 */
export interface VitestMockUtils {
  /** Mock React Hook Form implementation */
  mockUseForm: <T extends FieldValues = FieldValues>() => MockedFunction<() => UseFormReturn<T>>;
  
  /** Mock React Query hooks */
  mockUseQuery: <T = unknown>() => MockedFunction<() => UseQueryResult<T>>;
  mockUseMutation: <T = unknown>() => MockedFunction<() => UseMutationResult<T>>;
  
  /** Mock Next.js router */
  mockRouter: MockedFunction<() => {
    push: MockedFunction<(url: string) => Promise<boolean>>;
    replace: MockedFunction<(url: string) => Promise<boolean>>;
    back: MockedFunction<() => void>;
    pathname: string;
    query: Record<string, string | string[]>;
  }>;
  
  /** Mock local storage */
  mockLocalStorage: MockedFunction<() => Storage>;
  
  /** Mock window.fetch for API calls */
  mockFetch: MockedFunction<typeof fetch>;
}

// ============================================================================
// React Testing Library Integration Types
// ============================================================================

/**
 * Enhanced render options for DreamFactory components
 */
export interface DreamFactoryRenderOptions extends RenderOptions {
  /** Pre-configured providers (QueryClient, Theme, etc.) */
  withProviders?: boolean;
  /** Initial router state for Next.js components */
  initialRouter?: {
    pathname: string;
    query?: Record<string, string | string[]>;
  };
  /** Mock authenticated user context */
  authenticatedUser?: User | null;
  /** Initial React Query cache data */
  initialQueryData?: Record<string, unknown>;
  /** Custom theme or UI provider props */
  themeConfig?: {
    theme: 'light' | 'dark';
    primaryColor?: string;
  };
}

/**
 * Enhanced render result with DreamFactory utilities
 */
export interface DreamFactoryRenderResult extends RenderResult {
  /** User event utilities pre-configured for accessibility testing */
  user: UserEvent;
  /** Query client instance for testing server state */
  queryClient: QueryClient;
  /** Helper to wait for async operations */
  waitForData: (timeout?: number) => Promise<void>;
  /** Accessibility testing utilities */
  axe: {
    /** Run accessibility audit on rendered component */
    check: () => Promise<AccessibilityViolation[]>;
    /** Check specific WCAG guidelines */
    checkWCAG: (level: 'A' | 'AA' | 'AAA') => Promise<AccessibilityViolation[]>;
  };
}

/**
 * Accessibility violation report
 */
export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
  }>;
}

/**
 * Component testing utilities for specific DreamFactory features
 */
export interface ComponentTestUtils {
  /** Database service component testing helpers */
  database: {
    /** Render database connection form with mock data */
    renderConnectionForm: (
      initialData?: Partial<DatabaseConnection>
    ) => DreamFactoryRenderResult;
    /** Simulate database connection test */
    simulateConnectionTest: (
      connection: DatabaseConnection
    ) => Promise<{ success: boolean; error?: string }>;
    /** Mock database schema response */
    mockSchemaResponse: (tables: string[]) => void;
  };
  
  /** API generation testing helpers */
  apiGeneration: {
    /** Render API generation wizard */
    renderGenerationWizard: (
      databaseId: string
    ) => DreamFactoryRenderResult;
    /** Simulate endpoint configuration */
    simulateEndpointConfig: (
      endpoints: Array<{ table: string; methods: string[] }>
    ) => Promise<void>;
    /** Mock OpenAPI spec generation */
    mockOpenAPIGeneration: (spec: object) => void;
  };
  
  /** User management testing helpers */
  userManagement: {
    /** Render user form component */
    renderUserForm: (initialData?: Partial<User>) => DreamFactoryRenderResult;
    /** Simulate user creation workflow */
    simulateUserCreation: (userData: Partial<User>) => Promise<void>;
    /** Mock role assignment */
    mockRoleAssignment: (userId: number, roleId: number) => void;
  };
}

// ============================================================================
// Mock Service Worker (MSW) Types
// ============================================================================

/**
 * MSW request handler factory for DreamFactory API endpoints
 */
export interface MSWHandlerFactory {
  /** Create handlers for database service endpoints */
  database: {
    /** Mock GET /api/v2/_schema endpoint */
    getSchema: (response?: ApiResponse<any>) => RestHandler;
    /** Mock POST /api/v2/_schema endpoint */
    createService: (response?: ApiResponse<DatabaseConnection>) => RestHandler;
    /** Mock POST /api/v2/_schema/{service}/_test endpoint */
    testConnection: (response?: { success: boolean; error?: string }) => RestHandler;
    /** Mock GET /api/v2/_schema/{service} endpoint */
    getServiceDetails: (response?: ApiResponse<DatabaseConnection>) => RestHandler;
  };
  
  /** Create handlers for authentication endpoints */
  auth: {
    /** Mock POST /api/v2/user/session endpoint */
    login: (response?: ApiResponse<{ session_token: string; session_id: string }>) => RestHandler;
    /** Mock DELETE /api/v2/user/session endpoint */
    logout: (response?: ApiResponse<{ success: boolean }>) => RestHandler;
    /** Mock GET /api/v2/user/profile endpoint */
    getProfile: (response?: ApiResponse<User>) => RestHandler;
  };
  
  /** Create handlers for system endpoints */
  system: {
    /** Mock GET /api/v2/system/admin endpoint */
    getAdmins: (response?: ApiResponse<User[]>) => RestHandler;
    /** Mock GET /api/v2/system/role endpoint */
    getRoles: (response?: ApiResponse<any[]>) => RestHandler;
    /** Mock GET /api/v2/system/config endpoint */
    getConfig: (response?: ApiResponse<any>) => RestHandler;
  };
}

/**
 * MSW server configuration for different testing scenarios
 */
export interface MSWServerConfig {
  /** Base URL for API endpoints */
  baseUrl?: string;
  /** Default response delay in milliseconds */
  delay?: number;
  /** Global error simulation */
  simulateNetworkError?: boolean;
  /** Authentication state simulation */
  authState?: 'authenticated' | 'unauthenticated' | 'expired';
  /** Default user context for authenticated requests */
  defaultUser?: User;
}

/**
 * API mocking utilities for development and testing
 */
export interface ApiMockUtils {
  /** Setup MSW server with DreamFactory handlers */
  setupServer: (config?: MSWServerConfig) => SetupServerApi;
  /** Create mock responses for specific scenarios */
  createMockResponse: <T>(data: T, options?: {
    delay?: number;
    status?: number;
    headers?: Record<string, string>;
  }) => ApiResponse<T>;
  /** Simulate API errors */
  simulateError: (
    code: number,
    message: string,
    details?: unknown
  ) => ApiResponse<never>;
  /** Mock pagination responses */
  createPaginatedResponse: <T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ) => ApiResponse<T[]>;
}

// ============================================================================
// Form Testing with React Hook Form + Zod
// ============================================================================

/**
 * Form testing utilities with validation support
 */
export interface FormTestUtils<T extends FieldValues = FieldValues> {
  /** Render form with React Hook Form integration */
  renderForm: (
    schema: ZodSchema<T>,
    defaultValues?: Partial<T>
  ) => DreamFactoryRenderResult & {
    form: UseFormReturn<T>;
    submitForm: (data?: Partial<T>) => Promise<void>;
    getFieldError: (fieldName: keyof T) => string | undefined;
    setFieldValue: (fieldName: keyof T, value: any) => Promise<void>;
  };
  
  /** Test form validation scenarios */
  testValidation: {
    /** Test field-level validation */
    testField: (
      fieldName: keyof T,
      validValues: any[],
      invalidValues: Array<{ value: any; expectedError: string }>
    ) => Promise<void>;
    
    /** Test form submission with valid data */
    testValidSubmission: (validData: T) => Promise<void>;
    
    /** Test form submission with invalid data */
    testInvalidSubmission: (
      invalidData: Partial<T>,
      expectedErrors: Partial<Record<keyof T, string>>
    ) => Promise<void>;
  };
  
  /** Simulate user interactions with form fields */
  userInteractions: {
    /** Type into text inputs */
    typeInField: (fieldName: keyof T, value: string) => Promise<void>;
    /** Select options from dropdowns */
    selectOption: (fieldName: keyof T, value: string) => Promise<void>;
    /** Click checkboxes and radio buttons */
    clickCheckbox: (fieldName: keyof T) => Promise<void>;
    /** Submit form */
    submitForm: () => Promise<void>;
    /** Clear form fields */
    clearForm: () => Promise<void>;
  };
}

/**
 * Zod schema testing utilities
 */
export interface ZodTestUtils {
  /** Test schema validation with various inputs */
  testSchema: <T>(
    schema: ZodSchema<T>,
    validInputs: unknown[],
    invalidInputs: Array<{ input: unknown; expectedError: string }>
  ) => void;
  
  /** Generate mock data that conforms to schema */
  generateMockData: <T>(schema: ZodSchema<T>) => T;
  
  /** Test schema transformation and coercion */
  testTransforms: <T>(
    schema: ZodSchema<T>,
    transformTests: Array<{ input: unknown; expectedOutput: T }>
  ) => void;
}

// ============================================================================
// Server State Testing (React Query/SWR)
// ============================================================================

/**
 * React Query testing utilities
 */
export interface ReactQueryTestUtils {
  /** Create test query client with custom configuration */
  createTestQueryClient: (config?: {
    defaultOptions?: any;
    logger?: any;
  }) => QueryClient;
  
  /** Mock query responses */
  mockQuery: <T>(
    queryKey: any[],
    data: T,
    options?: {
      error?: Error;
      isLoading?: boolean;
      isError?: boolean;
    }
  ) => void;
  
  /** Mock mutation responses */
  mockMutation: <T>(
    mutationFn: string,
    response: T,
    options?: {
      error?: Error;
      isLoading?: boolean;
      isError?: boolean;
    }
  ) => void;
  
  /** Test cache invalidation scenarios */
  testCacheInvalidation: (
    triggerAction: () => Promise<void>,
    expectedInvalidatedKeys: any[][]
  ) => Promise<void>;
  
  /** Test optimistic updates */
  testOptimisticUpdate: <T>(
    mutation: () => Promise<void>,
    optimisticData: T,
    rollbackData: T
  ) => Promise<void>;
}

/**
 * SWR testing utilities
 */
export interface SWRTestUtils {
  /** Create test SWR configuration */
  createTestConfig: (config?: {
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
    refreshInterval?: number;
  }) => any;
  
  /** Mock SWR data fetching */
  mockSWRData: <T>(
    key: string,
    data: T,
    options?: {
      error?: Error;
      isValidating?: boolean;
    }
  ) => void;
  
  /** Test revalidation scenarios */
  testRevalidation: (
    key: string,
    triggerRevalidation: () => void
  ) => Promise<void>;
}

// ============================================================================
// Performance Testing Types
// ============================================================================

/**
 * Performance testing utilities for build optimization
 */
export interface TestPerformanceUtils {
  /** Measure component render performance */
  measureRenderTime: (
    renderFn: () => DreamFactoryRenderResult,
    iterations?: number
  ) => Promise<{
    average: number;
    min: number;
    max: number;
    percentile95: number;
  }>;
  
  /** Test bundle size impact */
  measureBundleImpact: (
    componentPath: string
  ) => Promise<{
    sizeBefore: number;
    sizeAfter: number;
    impact: number;
  }>;
  
  /** Measure API call performance */
  measureApiPerformance: (
    apiCall: () => Promise<any>,
    iterations?: number
  ) => Promise<{
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
  }>;
  
  /** Test memory usage during component lifecycle */
  measureMemoryUsage: (
    component: () => DreamFactoryRenderResult
  ) => Promise<{
    initialMemory: number;
    peakMemory: number;
    finalMemory: number;
    memoryLeak: boolean;
  }>;
}

/**
 * Core Web Vitals testing for SSR performance
 */
export interface WebVitalsTestUtils {
  /** Measure Largest Contentful Paint (LCP) */
  measureLCP: () => Promise<number>;
  
  /** Measure First Input Delay (FID) */
  measureFID: () => Promise<number>;
  
  /** Measure Cumulative Layout Shift (CLS) */
  measureCLS: () => Promise<number>;
  
  /** Test server-side rendering performance */
  measureSSRPerformance: () => Promise<{
    serverRenderTime: number;
    hydrationTime: number;
    totalRenderTime: number;
  }>;
  
  /** Validate performance thresholds */
  validatePerformanceThresholds: () => Promise<{
    lcpPassed: boolean; // < 2.5s
    fidPassed: boolean; // < 100ms
    clsPassed: boolean; // < 0.1
  }>;
}

// ============================================================================
// E2E Testing Integration (Playwright)
// ============================================================================

/**
 * E2E test scenario definitions
 */
export interface E2ETestScenario {
  /** Scenario name */
  name: string;
  /** Test description */
  description: string;
  /** Steps to execute */
  steps: E2ETestStep[];
  /** Expected outcome */
  expectedOutcome: string;
  /** Browser compatibility */
  browsers?: ('chromium' | 'firefox' | 'webkit')[];
  /** Viewport sizes to test */
  viewports?: Array<{ width: number; height: number }>;
}

/**
 * Individual E2E test step
 */
export interface E2ETestStep {
  /** Step description */
  description: string;
  /** Action to perform */
  action: 'navigate' | 'click' | 'type' | 'wait' | 'assert' | 'custom';
  /** CSS selector or element identifier */
  selector?: string;
  /** Value for type actions */
  value?: string;
  /** Wait conditions */
  waitFor?: 'element' | 'network' | 'timeout';
  /** Custom step implementation */
  customAction?: () => Promise<void>;
  /** Assertion details */
  assertion?: {
    type: 'text' | 'attribute' | 'visible' | 'count';
    expected: any;
  };
}

/**
 * Playwright page object utilities
 */
export interface PlaywrightPageObjects {
  /** Database service management page */
  databaseServicePage: {
    /** Navigate to service list */
    navigateToServices: () => Promise<void>;
    /** Create new database service */
    createService: (connection: DatabaseConnection) => Promise<void>;
    /** Test database connection */
    testConnection: (serviceName: string) => Promise<boolean>;
    /** Delete service */
    deleteService: (serviceName: string) => Promise<void>;
  };
  
  /** API generation workflow page */
  apiGenerationPage: {
    /** Navigate to API generation */
    navigateToGeneration: (serviceId: string) => Promise<void>;
    /** Configure endpoints */
    configureEndpoints: (config: any) => Promise<void>;
    /** Generate API documentation */
    generateDocumentation: () => Promise<void>;
    /** Preview generated APIs */
    previewAPIs: () => Promise<string[]>;
  };
  
  /** User management page */
  userManagementPage: {
    /** Navigate to user list */
    navigateToUsers: () => Promise<void>;
    /** Create new user */
    createUser: (user: Partial<User>) => Promise<void>;
    /** Edit user details */
    editUser: (userId: number, updates: Partial<User>) => Promise<void>;
    /** Assign role to user */
    assignRole: (userId: number, roleId: number) => Promise<void>;
  };
}

// ============================================================================
// Test Fixture and Mock Data Types
// ============================================================================

/**
 * Test fixture factory for consistent test data
 */
export interface TestFixtureFactory {
  /** Generate database connection fixtures */
  databaseConnection: (overrides?: Partial<DatabaseConnection>) => DatabaseConnection;
  
  /** Generate user fixtures */
  user: (overrides?: Partial<User>) => User;
  
  /** Generate API response fixtures */
  apiResponse: <T>(data: T, overrides?: Partial<ApiResponse<T>>) => ApiResponse<T>;
  
  /** Generate form validation error fixtures */
  validationErrors: <T extends FieldValues>(
    fields: (keyof T)[],
    messages?: string[]
  ) => FieldErrors<T>;
  
  /** Generate performance metrics fixtures */
  performanceMetrics: () => {
    renderTime: number;
    memoryUsage: number;
    bundleSize: number;
  };
}

/**
 * Global test utilities export
 */
export interface DreamFactoryTestUtils {
  /** Vitest mock utilities */
  vitest: VitestMockUtils;
  
  /** React Testing Library utilities */
  rtl: ComponentTestUtils;
  
  /** MSW API mocking utilities */
  msw: ApiMockUtils;
  
  /** Form testing utilities */
  forms: FormTestUtils;
  
  /** Server state testing utilities */
  serverState: {
    reactQuery: ReactQueryTestUtils;
    swr: SWRTestUtils;
  };
  
  /** Performance testing utilities */
  performance: TestPerformanceUtils & WebVitalsTestUtils;
  
  /** E2E testing utilities */
  e2e: PlaywrightPageObjects;
  
  /** Test fixture factory */
  fixtures: TestFixtureFactory;
  
  /** Accessibility testing utilities */
  accessibility: {
    /** Check WCAG compliance */
    checkWCAG: (level: 'A' | 'AA' | 'AAA') => Promise<AccessibilityViolation[]>;
    /** Test keyboard navigation */
    testKeyboardNavigation: () => Promise<boolean>;
    /** Test screen reader compatibility */
    testScreenReader: () => Promise<boolean>;
  };
}

// ============================================================================
// Test Configuration Types
// ============================================================================

/**
 * Vitest configuration for DreamFactory testing
 */
export interface DreamFactoryTestConfig {
  /** Test environment setup */
  environment: 'jsdom' | 'node' | 'happy-dom';
  
  /** Global setup files */
  setupFiles: string[];
  
  /** Test file patterns */
  include: string[];
  
  /** Files to exclude from testing */
  exclude: string[];
  
  /** Coverage configuration */
  coverage: {
    provider: 'v8' | 'istanbul';
    reporter: string[];
    thresholds: {
      global: {
        branches: number;
        functions: number;
        lines: number;
        statements: number;
      };
    };
  };
  
  /** MSW integration */
  msw: {
    enabled: boolean;
    baseUrl: string;
    handlers: string[];
  };
  
  /** Performance testing */
  performance: {
    enabled: boolean;
    thresholds: {
      renderTime: number;
      bundleSize: number;
      memoryUsage: number;
    };
  };
}

/**
 * Test runner utilities for CI/CD integration
 */
export interface TestRunnerUtils {
  /** Run unit tests with coverage */
  runUnitTests: (config?: Partial<DreamFactoryTestConfig>) => Promise<{
    passed: number;
    failed: number;
    coverage: number;
  }>;
  
  /** Run integration tests with MSW */
  runIntegrationTests: () => Promise<{
    passed: number;
    failed: number;
    apiMocksCovered: number;
  }>;
  
  /** Run E2E tests with Playwright */
  runE2ETests: (browsers?: string[]) => Promise<{
    passed: number;
    failed: number;
    browserCompatibility: Record<string, boolean>;
  }>;
  
  /** Run performance tests */
  runPerformanceTests: () => Promise<{
    webVitals: {
      lcp: number;
      fid: number;
      cls: number;
    };
    buildMetrics: {
      buildTime: number;
      bundleSize: number;
    };
  }>;
  
  /** Generate test reports */
  generateReports: () => Promise<{
    coverage: string;
    performance: string;
    accessibility: string;
  }>;
}

// ============================================================================
// Export Main Testing Interface
// ============================================================================

/**
 * Main testing utilities interface for DreamFactory Admin Interface
 * Provides comprehensive testing capabilities for the React/Next.js migration
 */
export interface TestingUtils extends DreamFactoryTestUtils {
  /** Test configuration */
  config: DreamFactoryTestConfig;
  
  /** Test runner utilities */
  runner: TestRunnerUtils;
  
  /** Initialize testing environment */
  setup: () => Promise<void>;
  
  /** Cleanup testing environment */
  cleanup: () => Promise<void>;
}

/**
 * Default export: Testing utilities factory
 */
export declare function createTestingUtils(
  config?: Partial<DreamFactoryTestConfig>
): Promise<TestingUtils>;