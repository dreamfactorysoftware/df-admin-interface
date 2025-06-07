/**
 * Testing utility types for Vitest, React Testing Library, Mock Service Worker, and component testing patterns.
 * Provides type safety for test fixtures, mocks, and testing utilities ensuring comprehensive test coverage.
 * 
 * Supports:
 * - Vitest testing framework replacing Jest/Karma for 10x faster test execution
 * - React Testing Library component testing with enhanced assertions
 * - Mock Service Worker (MSW) for realistic API mocking during development and testing
 * - Performance testing types for build time optimization
 * - Accessibility testing utilities for WCAG 2.1 AA compliance
 */

import type { ReactElement, ReactNode } from 'react'
import type { RenderOptions, RenderResult, queries } from '@testing-library/react'
import type { vi } from 'vitest'
import type { rest, setupWorker, setupServer } from 'msw'
import type { UseFormReturn } from 'react-hook-form'
import type { QueryClient } from '@tanstack/react-query'
import type { z } from 'zod'

// Re-export dependency types for testing utilities
import type { ApiResponse, ApiError, ApiRequestOptions } from './api'
import type { DatabaseService, DatabaseConnection, SchemaMetadata } from './database'
import type { User, AdminUser, UserSession } from './user'

// =================================================================================================
// VITEST FRAMEWORK TYPES
// =================================================================================================

/**
 * Enhanced Vitest test configuration replacing Jest/Karma patterns
 * Provides 10x faster test execution with native TypeScript support
 */
export interface VitestConfig {
  testMatch?: string[]
  testIgnore?: string[]
  coverage?: VitestCoverageConfig
  setupFiles?: string[]
  environment?: 'jsdom' | 'node' | 'happy-dom'
  globals?: boolean
  pool?: 'threads' | 'forks'
  isolate?: boolean
  reporters?: ('default' | 'verbose' | 'junit' | 'json' | 'html')[]
  timeout?: number
}

/**
 * Vitest coverage configuration for comprehensive test coverage reporting
 */
export interface VitestCoverageConfig {
  provider: 'v8' | 'istanbul'
  reporter: ('text' | 'json' | 'html' | 'lcov')[]
  include: string[]
  exclude: string[]
  thresholds: {
    lines: number
    functions: number
    branches: number
    statements: number
  }
  reportsDirectory: string
  all: boolean
}

/**
 * Vitest mock function type with enhanced TypeScript inference
 */
export type MockFunction<TArgs extends unknown[] = unknown[], TReturn = unknown> = 
  ReturnType<typeof vi.fn<TArgs, TReturn>>

/**
 * Vitest spy function type for monitoring existing functions
 */
export type SpyFunction<T = unknown> = ReturnType<typeof vi.spyOn<T, keyof T>>

/**
 * Test suite configuration for database service management tests
 */
export interface TestSuiteConfig {
  name: string
  timeout?: number
  retry?: number
  skip?: boolean
  only?: boolean
  concurrent?: boolean
  shuffle?: boolean
}

// =================================================================================================
// REACT TESTING LIBRARY TYPES
// =================================================================================================

/**
 * Enhanced render options for React components with providers
 * Replaces Angular TestBed module configuration patterns
 */
export interface CustomRenderOptions extends Omit<RenderOptions, 'queries'> {
  initialEntries?: string[]
  authState?: {
    user?: User | AdminUser | null
    session?: UserSession | null
    isAuthenticated?: boolean
  }
  queryClient?: QueryClient
  theme?: 'light' | 'dark'
  locale?: string
  preloadedState?: Record<string, unknown>
  renderWithProviders?: boolean
}

/**
 * Custom render result extending React Testing Library with additional utilities
 */
export interface CustomRenderResult extends RenderResult {
  user: {
    click: (element: Element | null) => Promise<void>
    type: (element: Element | null, text: string) => Promise<void>
    clear: (element: Element | null) => Promise<void>
    selectOptions: (element: Element | null, values: string | string[]) => Promise<void>
    upload: (element: Element | null, file: File | File[]) => Promise<void>
    keyboard: (text: string) => Promise<void>
    tab: (options?: { shift?: boolean }) => Promise<void>
  }
  queryClient: QueryClient
  history: unknown[]
}

/**
 * Component testing utilities for database service management components
 */
export interface ComponentTestUtils {
  renderWithProviders: (
    ui: ReactElement,
    options?: CustomRenderOptions
  ) => CustomRenderResult
  
  renderWithQueryClient: (
    ui: ReactElement,
    queryClient?: QueryClient
  ) => CustomRenderResult
  
  renderWithAuth: (
    ui: ReactElement,
    authState: CustomRenderOptions['authState']
  ) => CustomRenderResult
  
  renderWithTheme: (
    ui: ReactElement,
    theme?: 'light' | 'dark'
  ) => CustomRenderResult
  
  waitForLoadingToFinish: () => Promise<void>
  expectAccessibleForm: (container: HTMLElement) => Promise<void>
  expectValidationErrors: (errors: Record<string, string>) => Promise<void>
}

/**
 * Form testing utilities for React Hook Form with Zod validation
 */
export interface FormTestHelpers<TFormData = Record<string, unknown>> {
  fillForm: (data: Partial<TFormData>) => Promise<void>
  submitForm: () => Promise<void>
  clearForm: () => Promise<void>
  expectFieldError: (fieldName: keyof TFormData, errorMessage: string) => Promise<void>
  expectFormValid: () => Promise<void>
  expectFormInvalid: () => Promise<void>
  uploadFile: (fieldName: keyof TFormData, file: File) => Promise<void>
  selectOption: (fieldName: keyof TFormData, value: string) => Promise<void>
  triggerValidation: (fieldName?: keyof TFormData) => Promise<void>
  getFieldValue: (fieldName: keyof TFormData) => unknown
  getFormState: () => UseFormReturn<TFormData>['formState']
}

/**
 * Database connection form testing scenario types
 */
export interface DatabaseConnectionTestScenarios {
  validConnection: DatabaseConnection
  invalidConnection: Partial<DatabaseConnection>
  connectionWithSSL: DatabaseConnection
  connectionTimeoutError: DatabaseConnection
  connectionRefused: DatabaseConnection
  authenticationError: DatabaseConnection
}

// =================================================================================================
// MOCK SERVICE WORKER (MSW) TYPES
// =================================================================================================

/**
 * MSW request handler configuration for DreamFactory API endpoints
 */
export interface MSWHandlerConfig {
  baseUrl?: string
  delay?: number | 'infinite'
  status?: number
  headers?: Record<string, string>
  once?: boolean
}

/**
 * MSW handler types for different API operations
 */
export type MSWHandler = ReturnType<typeof rest.get | typeof rest.post | typeof rest.put | typeof rest.patch | typeof rest.delete>

/**
 * MSW worker setup configuration for browser and Node.js environments
 */
export interface MSWWorkerConfig {
  serviceWorker?: {
    url?: string
    options?: ServiceWorkerRegistrationOptions
  }
  onUnhandledRequest?: 'error' | 'warn' | 'bypass'
  waitUntilReady?: boolean
}

/**
 * MSW server setup configuration for Node.js testing environment
 */
export interface MSWServerConfig {
  onUnhandledRequest?: 'error' | 'warn' | 'bypass'
  listen?: {
    onUnhandledRequest?: 'error' | 'warn' | 'bypass'
  }
}

/**
 * API mock response generators for consistent testing
 */
export interface ApiMockGenerators {
  successResponse: <T>(data: T, meta?: Record<string, unknown>) => ApiResponse<T>
  errorResponse: (error: Partial<ApiError>) => ApiError
  listResponse: <T>(items: T[], total?: number, offset?: number) => ApiResponse<T[]>
  paginatedResponse: <T>(
    items: T[],
    page: number,
    limit: number,
    total: number
  ) => ApiResponse<T[]>
  validationErrorResponse: (
    field: string,
    message: string
  ) => ApiError
  authErrorResponse: (type: 'unauthorized' | 'forbidden') => ApiError
  serverErrorResponse: (message?: string) => ApiError
}

/**
 * Database service mock data factories
 */
export interface DatabaseServiceMockFactory {
  createDatabaseService: (overrides?: Partial<DatabaseService>) => DatabaseService
  createConnectionConfig: (type: string, overrides?: Partial<DatabaseConnection>) => DatabaseConnection
  createSchemaMetadata: (overrides?: Partial<SchemaMetadata>) => SchemaMetadata
  createTableList: (count: number) => SchemaMetadata[]
  createFieldList: (tableId: string, count: number) => SchemaMetadata[]
  createValidationScenarios: () => DatabaseConnectionTestScenarios
}

/**
 * User authentication mock data factories
 */
export interface AuthMockFactory {
  createUser: (overrides?: Partial<User>) => User
  createAdminUser: (overrides?: Partial<AdminUser>) => AdminUser
  createUserSession: (user: User | AdminUser) => UserSession
  createLoginCredentials: (type: 'user' | 'admin') => {
    email: string
    password: string
  }
  createJWTToken: (payload: Record<string, unknown>) => string
  createAuthHeaders: (session: UserSession) => Record<string, string>
}

// =================================================================================================
// QUERY TESTING UTILITIES
// =================================================================================================

/**
 * TanStack React Query testing utilities for server state management
 */
export interface QueryTestHelpers {
  queryClient: QueryClient
  
  // Query state inspection
  getQueryData: <T>(queryKey: unknown[]) => T | undefined
  getQueryState: (queryKey: unknown[]) => unknown
  invalidateQueries: (queryKey?: unknown[]) => Promise<void>
  refetchQueries: (queryKey?: unknown[]) => Promise<void>
  
  // Cache management
  clearCache: () => void
  setQueryData: <T>(queryKey: unknown[], data: T) => void
  removeQueries: (queryKey?: unknown[]) => void
  
  // Mutation testing
  mockMutation: <TData, TError, TVariables>(
    mutationFn: (variables: TVariables) => Promise<TData>
  ) => MockFunction<[TVariables], Promise<TData>>
  
  // Loading and error states
  expectQueryLoading: (queryKey: unknown[]) => void
  expectQuerySuccess: <T>(queryKey: unknown[], data: T) => void
  expectQueryError: (queryKey: unknown[], error: unknown) => void
  
  // Background sync testing
  expectBackgroundRefetch: (queryKey: unknown[]) => Promise<void>
  expectOptimisticUpdate: <T>(queryKey: unknown[], expectedData: T) => void
}

/**
 * SWR testing utilities for configuration data
 */
export interface SWRTestHelpers {
  mockSWRResponse: <T>(key: string, data: T, error?: unknown) => void
  expectSWRLoading: (key: string) => void
  expectSWRData: <T>(key: string, data: T) => void
  expectSWRError: (key: string, error: unknown) => void
  triggerRevalidation: (key: string) => Promise<void>
  mockSWRMutation: <T>(key: string, mutationFn: () => Promise<T>) => void
}

// =================================================================================================
// PERFORMANCE TESTING TYPES
// =================================================================================================

/**
 * Performance benchmarks for component rendering and operations
 */
export interface PerformanceMetrics {
  renderTime: number
  mountTime: number
  updateTime: number
  unmountTime: number
  memoryUsage: number
  bundleSize?: number
  cacheHitRate?: number
}

/**
 * Performance testing utilities for build time optimization
 */
export interface PerformanceTestHelpers {
  measureRenderTime: (component: ReactElement) => Promise<number>
  measureUpdateTime: (
    component: ReactElement,
    updates: () => void
  ) => Promise<number>
  
  measureMemoryUsage: () => number
  measureBundleSize: (entryPoint: string) => Promise<number>
  measureCachePerformance: (queryKey: unknown[]) => Promise<{
    hitRate: number
    missRate: number
    averageResponseTime: number
  }>
  
  expectPerformanceThreshold: (
    metric: keyof PerformanceMetrics,
    threshold: number,
    actual: number
  ) => void
  
  profileComponent: (
    component: ReactElement,
    interactions: () => Promise<void>
  ) => Promise<PerformanceMetrics>
  
  expectSubFiveSecondOperation: (
    operation: () => Promise<void>,
    description: string
  ) => Promise<void>
}

/**
 * Build performance testing configuration
 */
export interface BuildPerformanceConfig {
  entryPoints: string[]
  thresholds: {
    buildTime: number // milliseconds
    bundleSize: number // bytes
    treeShaking: number // percentage
    codeSpitting: boolean
  }
  turbopackEnabled: boolean
  outputDirectory: string
}

// =================================================================================================
// ACCESSIBILITY TESTING TYPES
// =================================================================================================

/**
 * WCAG 2.1 AA compliance testing utilities
 */
export interface AccessibilityTestHelpers {
  checkAccessibility: (container: HTMLElement) => Promise<void>
  expectNoAccessibilityViolations: (container: HTMLElement) => Promise<void>
  expectKeyboardNavigation: (container: HTMLElement) => Promise<void>
  expectScreenReaderSupport: (container: HTMLElement) => Promise<void>
  expectColorContrast: (container: HTMLElement) => Promise<void>
  expectFocusManagement: (container: HTMLElement) => Promise<void>
  expectAriaLabels: (container: HTMLElement) => Promise<void>
  
  simulateKeyboardNavigation: (
    keys: string[],
    container?: HTMLElement
  ) => Promise<void>
  
  simulateScreenReader: (
    container: HTMLElement
  ) => Promise<string[]>
  
  checkFormAccessibility: (
    form: HTMLFormElement
  ) => Promise<{
    hasLabels: boolean
    hasErrorAnnouncements: boolean
    hasRequiredIndicators: boolean
    hasKeyboardSupport: boolean
  }>
}

/**
 * Accessibility test configuration for WCAG 2.1 AA compliance
 */
export interface AccessibilityTestConfig {
  rules: {
    'color-contrast': boolean
    'keyboard-navigation': boolean
    'screen-reader': boolean
    'focus-management': boolean
    'aria-labels': boolean
    'form-labels': boolean
  }
  exclude: string[]
  include: string[]
  level: 'A' | 'AA' | 'AAA'
  tags: string[]
}

// =================================================================================================
// COMPONENT TESTING PATTERNS
// =================================================================================================

/**
 * Test scenario configuration for comprehensive component testing
 */
export interface TestScenario<TProps = Record<string, unknown>> {
  name: string
  props: TProps
  setup?: () => Promise<void> | void
  teardown?: () => Promise<void> | void
  expectations: {
    render: boolean
    accessibility: boolean
    performance: boolean
    interactions: boolean
  }
  mocks?: Record<string, MockFunction>
  queries?: Record<string, unknown>
}

/**
 * Database service component testing scenarios
 */
export interface DatabaseServiceTestScenarios {
  connectionForm: TestScenario[]
  serviceList: TestScenario[]
  schemaDiscovery: TestScenario[]
  apiGeneration: TestScenario[]
  errorHandling: TestScenario[]
  loadingStates: TestScenario[]
  accessibilityCompliance: TestScenario[]
}

/**
 * Test fixture factory for creating reusable test data
 */
export interface TestFixtureFactory<T = unknown> {
  create: (overrides?: Partial<T>) => T
  createMany: (count: number, overrides?: Partial<T>) => T[]
  createInvalid: (invalidFields?: (keyof T)[]) => Partial<T>
  createWithRelations: (relations: Record<string, unknown>) => T
}

/**
 * Error testing utilities for comprehensive error handling validation
 */
export interface ErrorTestHelpers {
  expectErrorBoundary: (error: Error) => Promise<void>
  expectValidationError: (field: string, message: string) => Promise<void>
  expectNetworkError: (status: number) => Promise<void>
  expectAuthenticationError: () => Promise<void>
  expectServerError: () => Promise<void>
  
  simulateNetworkError: (endpoint: string) => void
  simulateTimeoutError: (endpoint: string, delay: number) => void
  simulateValidationError: (field: string, error: string) => void
  
  expectErrorRecovery: (
    errorSimulation: () => void,
    recoveryAction: () => Promise<void>
  ) => Promise<void>
}

// =================================================================================================
// SNAPSHOT TESTING TYPES
// =================================================================================================

/**
 * Snapshot testing configuration for component regression testing
 */
export interface SnapshotTestConfig {
  updateSnapshots: boolean
  snapshotFormat: {
    escapeString: boolean
    indent: number
    min: boolean
    printBasicPrototype: boolean
    printFunctionName: boolean
  }
  snapshotDir: string
  snapshotExtension: string
}

/**
 * Component snapshot testing utilities
 */
export interface SnapshotTestHelpers {
  expectComponentSnapshot: (component: ReactElement) => void
  expectPropsSnapshot: (props: Record<string, unknown>) => void
  expectStateSnapshot: (state: Record<string, unknown>) => void
  expectQuerySnapshot: (queryKey: unknown[], data: unknown) => void
  
  createThemeSnapshots: (component: ReactElement) => void
  createResponsiveSnapshots: (component: ReactElement) => void
  createInteractionSnapshots: (
    component: ReactElement,
    interactions: () => Promise<void>
  ) => Promise<void>
}

// =================================================================================================
// INTEGRATION TESTING TYPES
// =================================================================================================

/**
 * End-to-end testing configuration for Playwright integration
 */
export interface E2ETestConfig {
  baseURL: string
  timeout: number
  retries: number
  workers: number
  browsers: ('chromium' | 'firefox' | 'webkit')[]
  headless: boolean
  screenshot: 'off' | 'only-on-failure' | 'on'
  video: 'off' | 'on-first-retry' | 'retain-on-failure' | 'on'
  trace: 'off' | 'on-first-retry' | 'retain-on-failure' | 'on'
}

/**
 * Database service end-to-end testing scenarios
 */
export interface E2ETestScenarios {
  userFlow: {
    login: () => Promise<void>
    createDatabaseService: (config: DatabaseConnection) => Promise<void>
    testConnection: () => Promise<void>
    discoverSchema: () => Promise<void>
    generateAPI: () => Promise<void>
    validateEndpoints: () => Promise<void>
    logout: () => Promise<void>
  }
  
  errorFlows: {
    invalidCredentials: () => Promise<void>
    connectionTimeout: () => Promise<void>
    invalidConfiguration: () => Promise<void>
    networkError: () => Promise<void>
  }
  
  performanceFlows: {
    largeSchemaDiscovery: () => Promise<void>
    bulkApiGeneration: () => Promise<void>
    concurrentConnections: () => Promise<void>
  }
}

// =================================================================================================
// UTILITY TYPES AND EXPORTS
// =================================================================================================

/**
 * Comprehensive testing context providing all testing utilities
 */
export interface TestingContext {
  vitest: {
    config: VitestConfig
    mock: typeof vi.fn
    spy: typeof vi.spyOn
  }
  
  rtl: ComponentTestUtils
  msw: {
    worker: ReturnType<typeof setupWorker>
    server: ReturnType<typeof setupServer>
    handlers: MSWHandler[]
    mockGenerators: ApiMockGenerators
  }
  
  queries: QueryTestHelpers
  swr: SWRTestHelpers
  forms: FormTestHelpers
  performance: PerformanceTestHelpers
  accessibility: AccessibilityTestHelpers
  errors: ErrorTestHelpers
  snapshots: SnapshotTestHelpers
  
  factories: {
    database: DatabaseServiceMockFactory
    auth: AuthMockFactory
    fixtures: TestFixtureFactory
  }
  
  scenarios: {
    database: DatabaseServiceTestScenarios
    e2e: E2ETestScenarios
  }
}

/**
 * Test suite metadata for comprehensive test organization
 */
export interface TestSuiteMetadata {
  name: string
  description: string
  tags: string[]
  category: 'unit' | 'integration' | 'e2e' | 'performance' | 'accessibility'
  priority: 'low' | 'medium' | 'high' | 'critical'
  dependencies: string[]
  estimatedDuration: number // milliseconds
  parallelizable: boolean
  flakyness: 'stable' | 'occasional' | 'frequent'
  lastUpdated: string
  author: string
}

/**
 * Test execution report for comprehensive test result analysis
 */
export interface TestExecutionReport {
  summary: {
    total: number
    passed: number
    failed: number
    skipped: number
    duration: number // milliseconds
    coverage: {
      lines: number
      functions: number
      branches: number
      statements: number
    }
  }
  
  performance: {
    averageTestDuration: number
    slowestTests: Array<{
      name: string
      duration: number
    }>
    memoryUsage: number
    bundleSize: number
  }
  
  accessibility: {
    violations: Array<{
      rule: string
    severity: 'minor' | 'moderate' | 'serious' | 'critical'
      element: string
      message: string
    }>
    compliance: {
      level: 'A' | 'AA' | 'AAA'
      percentage: number
    }
  }
  
  flaky: Array<{
    name: string
    successRate: number
    lastFailure: string
  }>
}

// =================================================================================================
// EXPORTS FOR EXTERNAL CONSUMPTION
// =================================================================================================

/**
 * Re-export commonly used testing types for convenience
 */
export type {
  // Vitest core types
  MockFunction,
  SpyFunction,
  
  // React Testing Library types
  CustomRenderOptions,
  CustomRenderResult,
  
  // MSW types
  MSWHandler,
  MSWWorkerConfig,
  
  // Query testing types
  QueryTestHelpers,
  
  // Performance types
  PerformanceMetrics,
  
  // Accessibility types
  AccessibilityTestConfig,
  
  // Test scenario types
  TestScenario,
  TestFixtureFactory,
  
  // Comprehensive testing context
  TestingContext
}

/**
 * Default export providing the complete testing type system
 */
export default TestingContext