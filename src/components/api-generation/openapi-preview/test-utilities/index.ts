/**
 * @fileoverview Central export barrel for OpenAPI preview test utilities
 * @description Provides comprehensive testing infrastructure for OpenAPI preview components including
 * MSW handlers, Vitest configuration, React Testing Library utilities, mock data factories, and
 * testing automation tools. Enables consistent testing patterns across the OpenAPI preview test suite
 * with tree-shaking friendly exports optimized for Turbopack build performance.
 * 
 * @version 1.0.0
 * @license MIT
 * @author DreamFactory Team
 * 
 * Technical Specifications:
 * - React/Next.js Integration Requirements for modular test utility organization with clean import patterns
 * - Section 3.6 Development & Deployment requiring organized test infrastructure for Vitest 2.1.0 integration
 * - F-006: API Documentation and Testing requiring comprehensive testing utility exports for OpenAPI preview components
 * - Turbopack build optimization requirements per Section 0.1.1 technical scope for test bundle efficiency
 * - Section 6.6 Testing Strategy implementation for 90%+ code coverage with comprehensive test automation
 * 
 * Export Categories:
 * - MSW Handlers: Complete API mocking infrastructure for realistic testing without backend dependencies
 * - Test Setup: Vitest configuration, React Query client setup, and global test utilities
 * - Render Utils: React Testing Library render functions with provider setup and component testing utilities
 * - Mock Data: Type-safe test fixtures including OpenAPI specifications, service definitions, and API keys
 * - Testing Components: Mock React components for isolated OpenAPI preview functionality testing
 * - Performance Utils: Testing utilities for performance benchmarking and optimization validation
 * - Accessibility Utils: WCAG 2.1 AA compliance testing utilities and keyboard navigation automation
 * 
 * Features:
 * - Tree-shaking optimized exports for minimal bundle impact during test execution
 * - Type-safe imports with full TypeScript 5.8+ compatibility and strict mode support
 * - Vitest 2.1.0 native integration with 10x faster test execution than Jest/Karma
 * - React 19.0.0 and Next.js 15.1.0 compatibility with server component testing support
 * - MSW integration for comprehensive API mocking with realistic network simulation
 * - React Query testing utilities with intelligent cache management and synchronization
 * - Comprehensive OpenAPI v3.0.0 mock specifications for all supported database types
 * - Performance testing utilities meeting React/Next.js Integration Requirements benchmarks
 * - Accessibility testing automation ensuring WCAG 2.1 AA compliance per F-006 requirements
 */

// =============================================================================
// MSW HANDLERS AND API MOCKING INFRASTRUCTURE
// =============================================================================

// Complete MSW handler collections for comprehensive API mocking
export {
  // Primary handler collections
  openApiPreviewHandlers,
  apiDocsHandlers,
  openApiSpecHandlers,
  apiKeyHandlers,
  serviceHealthHandlers,
  errorSimulationHandlers,
  
  // Categorized handler sets for selective testing scenarios
  coreHandlers,
  errorHandlers,
  performanceHandlers as perfHandlers,
  securityHandlers,
  
  // Mock data generation utilities
  resetMockData,
  configureMockBehavior,
  validateMockData,
  
  // Network and API simulation utilities
  createMockApiResponse,
  validateOpenApiSpec,
  
  // Default export for convenient MSW setup
  default as defaultMswHandlers
} from './msw-handlers'

// =============================================================================
// TEST ENVIRONMENT SETUP AND CONFIGURATION
// =============================================================================

// MSW server instance and lifecycle management
export {
  // MSW server configuration
  server,
  serverConfig,
  
  // React Query test client management
  createTestQueryClient,
  testQueryClient,
  
  // Enhanced cleanup and environment setup
  enhancedCleanup,
  setupTestEnvironment,
  configureTestEnvironment,
  setupOpenAPIPreviewTests,
  
  // Browser API mocking
  mockBrowserAPIs,
  
  // Async operation utilities
  waitForQueries,
  waitForQuery,
  simulateUserDelay,
  
  // Mock data factories
  createMockOpenAPIPreviewStore,
  createMockApiKey,
  createMockServiceApiKeys,
  createMockOpenAPIError,
  
  // Custom test assertions and matchers
  expectValidOpenAPISpec,
  expectQueryCacheToContain,
  expectHandlerToBeCalled,
  
  // Debugging and performance measurement
  debugLog,
  measureTestPerformance,
  
  // Test configuration types and interfaces
  type TestEnvironmentConfig,
  type MockedFunction,
  type MockedClass,
  type MockInstance,
  
  // Test constants and common values
  TEST_CONSTANTS,
  
  // Default export for comprehensive test setup
  default as testSetupUtils
} from './test-setup'

// =============================================================================
// REACT TESTING LIBRARY RENDER UTILITIES
// =============================================================================

// Primary render functions with provider setup
export {
  // Main render function with comprehensive provider setup
  renderOpenAPIPreview,
  render, // Alias for renderOpenAPIPreview
  
  // Specialized component render functions
  renderOpenAPIViewer,
  renderApiDocsList,
  renderApiKeySelector,
  
  // Enhanced render result interface
  type OpenAPIPreviewRenderResult,
  type OpenAPIPreviewRenderOptions,
  
  // Mock provider components
  useOpenAPIPreviewTestContext,
  type MockOpenAPIPreviewContext,
  
  // Router mocking utilities
  createMockAppRouter,
  type MockAppRouter,
  
  // Test configuration interfaces
  type OpenAPIPreviewTestConfig,
  
  // Re-exported React Testing Library utilities
  screen,
  within,
  waitFor,
  fireEvent,
  userEvent,
  
  // Custom testing utilities
  openApiTestUtils as openApiPreviewTestUtils,
  openApiPerformanceUtils,
  openApiA11yUtils,
  
  // Custom matchers and assertions
  expect as customExpect,
  
  // Default export for convenient render utilities
  default as renderUtils
} from './render-utils'

// =============================================================================
// MOCK DATA AND TEST FIXTURES
// =============================================================================

// Comprehensive mock data collections
export {
  // OpenAPI specification templates and examples
  MOCK_SERVICES,
  MYSQL_OPENAPI_SPEC,
  EMAIL_OPENAPI_SPEC,
  BASE_OPENAPI_SPEC,
  
  // API key test fixtures
  MOCK_API_KEYS,
  
  // Service definitions and metadata
  MOCK_DATABASE_SERVICES,
  MOCK_EMAIL_SERVICES,
  MOCK_FILE_SERVICES,
  
  // Network simulation constants
  NETWORK_DELAYS,
  
  // API endpoint definitions
  API_ENDPOINTS,
  
  // HTTP headers and authentication
  HTTP_HEADERS,
  DEFAULT_REQUEST_HEADERS,
  
  // Test data generators
  createMockOpenAPISpec,
  createMockServiceInfo,
  createMockApiTestResult,
  createMockValidationErrors,
  
  // SwaggerUI configuration templates
  DEFAULT_SWAGGER_CONFIG,
  PERFORMANCE_SWAGGER_CONFIG,
  ACCESSIBILITY_SWAGGER_CONFIG,
  
  // Database schema mock data for large dataset testing
  LARGE_SCHEMA_MOCK_DATA,
  PERFORMANCE_TEST_DATA,
  
  // Error simulation data
  MOCK_ERROR_SCENARIOS,
  AUTHENTICATION_ERROR_DATA,
  NETWORK_ERROR_DATA
} from './mock-data'

// =============================================================================
// COMPREHENSIVE TEST SUITE AND AUTOMATION
// =============================================================================

// Test suite configuration and automation utilities
export {
  // Test configuration constants
  TEST_CONFIG,
  
  // Mock React components for testing
  MockOpenAPIPreviewLayout,
  MockOpenAPIPreviewProvider,
  
  // Performance measurement utilities
  measureExecutionTime,
  expectToCompleteWithin,
  
  // Accessibility testing utilities
  expectToBeAccessible,
  
  // Test suite metadata and information
  metadata as testSuiteMetadata,
  
  // Default export containing test automation utilities
  default as previewTestSuite
} from './preview-tests'

// =============================================================================
// CONVENIENCE EXPORTS AND ALIASES
// =============================================================================

/**
 * Quick access exports for common testing patterns
 * Provides convenient imports for frequently used testing utilities
 */

// Most commonly used testing functions
export const testUtils = {
  // Primary render function
  render: renderOpenAPIPreview,
  
  // Test environment setup
  setup: setupOpenAPIPreviewTests,
  
  // MSW server management
  server,
  
  // Query client for React Query testing
  queryClient: testQueryClient,
  
  // Mock data factories
  createMockStore: createMockOpenAPIPreviewStore,
  createMockKey: createMockApiKey,
  createMockError: createMockOpenAPIError,
  
  // Common assertions
  waitForQueries,
  expectToBeAccessible,
  debugLog
}

/**
 * Performance testing utilities collection
 * Specialized exports for performance benchmarking and optimization validation
 */
export const performanceTestUtils = {
  // Performance measurement
  measureRenderTime: openApiPerformanceUtils.measureRenderTime,
  testLargeDataset: openApiPerformanceUtils.testLargeDatasetPerformance,
  testSwaggerUIPerformance: openApiPerformanceUtils.testSwaggerUIPerformance,
  
  // Performance constants from test configuration
  PERFORMANCE_THRESHOLDS: {
    MAX_RENDER_TIME: 100, // milliseconds
    MAX_SPEC_LOAD_TIME: 2000, // milliseconds
    MAX_API_CALL_TIME: 2000, // milliseconds
    MAX_CACHE_HIT_TIME: 50 // milliseconds
  },
  
  // Large dataset testing
  LARGE_DATASET_SIZES: {
    SMALL: 10,
    MEDIUM: 100,
    LARGE: 1000
  }
}

/**
 * Accessibility testing utilities collection
 * Specialized exports for WCAG 2.1 AA compliance testing and validation
 */
export const accessibilityTestUtils = {
  // Accessibility testing functions
  testAccessibility: openApiA11yUtils.testAccessibility,
  testKeyboardAccessibility: openApiA11yUtils.testKeyboardAccessibility,
  testScreenReaderSupport: openApiA11yUtils.testScreenReaderSupport,
  
  // Common accessibility assertions
  expectToBeAccessible,
  
  // WCAG compliance testing
  WCAG_REQUIREMENTS: {
    LEVEL: 'AA',
    VERSION: '2.1',
    SUPPORTED_STANDARDS: [
      'keyboard-navigation',
      'screen-reader-support',
      'color-contrast',
      'focus-management',
      'aria-labeling'
    ]
  }
}

/**
 * MSW and API mocking utilities collection
 * Specialized exports for comprehensive API simulation and network testing
 */
export const apiMockingUtils = {
  // MSW handler management
  server,
  serverConfig,
  
  // Handler collections by category
  handlers: {
    core: coreHandlers,
    errors: errorHandlers,
    performance: perfHandlers,
    security: securityHandlers
  },
  
  // Mock data creation
  createMockResponse: createMockApiResponse,
  validateSpec: validateOpenApiSpec,
  
  // Network simulation
  delays: NETWORK_DELAYS,
  
  // Common API endpoints for testing
  endpoints: API_ENDPOINTS,
  
  // Authentication headers
  headers: HTTP_HEADERS
}

// =============================================================================
// TYPE-ONLY EXPORTS
// =============================================================================

/**
 * Type-only exports for enhanced TypeScript development experience
 * Provides comprehensive type definitions without runtime impact
 */

// Core testing interfaces
export type {
  // Component testing types
  OpenAPIPreviewRenderResult,
  OpenAPIPreviewRenderOptions,
  OpenAPIPreviewTestConfig,
  MockOpenAPIPreviewContext,
  
  // MSW and API testing types
  TestEnvironmentConfig,
  MockedFunction,
  MockedClass,
  MockInstance,
  
  // Router mocking types
  MockAppRouter,
  
  // Mock data and fixtures types
  ApiDocsRowData,
  ApiKeyInfo,
  ServiceApiKeys,
  OpenAPIViewerProps,
  SwaggerUIConfig,
  OpenAPIPreviewError,
  OpenAPIPreviewState,
  OpenAPIPreviewActions,
  
  // Database service types
  DatabaseService,
  DatabaseDriver,
  ServiceStatus,
  ConnectionTestResult,
  ServiceRow,
  
  // Theme and UI types
  ThemeMode
} from './types'

// =============================================================================
// MIGRATION COMPATIBILITY EXPORTS
// =============================================================================

/**
 * Compatibility exports for seamless migration from Angular testing patterns
 * Provides familiar naming conventions and patterns for easier adoption
 */

// Angular-style naming aliases for easier migration
export const AngularCompatibility = {
  // TestBed equivalent
  TestEnvironment: setupOpenAPIPreviewTests,
  
  // HttpClientTestingModule equivalent
  MockHttpClient: server,
  
  // ComponentFixture equivalent
  ComponentWrapper: renderOpenAPIPreview,
  
  // DebugElement equivalent
  TestingUtilities: testUtils,
  
  // Common Angular testing patterns
  fakeAsync: (fn: () => void) => fn(), // Simplified for React
  tick: (ms?: number) => new Promise(resolve => setTimeout(resolve, ms || 0)),
  flush: () => waitForQueries()
}

// =============================================================================
// DEFAULT EXPORT FOR COMPREHENSIVE ACCESS
// =============================================================================

/**
 * Default export providing complete access to all OpenAPI preview testing utilities
 * Enables both named imports and default import patterns for maximum flexibility
 */
export default {
  // Primary testing utilities
  testUtils,
  performanceTestUtils,
  accessibilityTestUtils,
  apiMockingUtils,
  
  // Render utilities
  render: renderOpenAPIPreview,
  renderOpenAPIViewer,
  renderApiDocsList,
  renderApiKeySelector,
  
  // MSW and API mocking
  server,
  handlers: openApiPreviewHandlers,
  
  // Mock data and fixtures
  mockData: {
    MOCK_SERVICES,
    MYSQL_OPENAPI_SPEC,
    EMAIL_OPENAPI_SPEC,
    MOCK_API_KEYS
  },
  
  // Test environment setup
  setup: setupOpenAPIPreviewTests,
  
  // Common constants
  constants: {
    TEST_CONSTANTS,
    HTTP_HEADERS,
    NETWORK_DELAYS
  },
  
  // Migration compatibility
  angular: AngularCompatibility,
  
  // Metadata
  version: '1.0.0',
  framework: 'Vitest 2.1.0',
  compatibility: {
    react: '19.0.0',
    nextjs: '15.1.0',
    vitest: '2.1.0',
    msw: 'latest'
  },
  coverage: {
    target: '90%+',
    requirements: 'Section 3.6 Enhanced Testing Pipeline'
  },
  performance: {
    optimization: 'Turbopack build optimization',
    requirements: 'React/Next.js Integration Requirements'
  },
  accessibility: {
    compliance: 'WCAG 2.1 AA',
    requirements: 'F-006: API Documentation and Testing'
  }
}

// =============================================================================
// DOCUMENTATION AND USAGE EXAMPLES
// =============================================================================

/**
 * @example
 * // Basic OpenAPI preview component testing
 * import { render, screen, waitFor } from '@/components/api-generation/openapi-preview/test-utilities'
 * 
 * test('should display OpenAPI documentation', async () => {
 *   const { user } = render(<OpenAPIViewer service={mockService} />)
 *   
 *   await waitFor(() => {
 *     expect(screen.getByTestId('swagger-ui-container')).toBeInTheDocument()
 *   })
 * })
 * 
 * @example
 * // Using convenience utilities
 * import { testUtils } from '@/components/api-generation/openapi-preview/test-utilities'
 * 
 * beforeEach(() => {
 *   testUtils.setup({
 *     msw: { handlers: 'core' },
 *     performance: { enableMetrics: true }
 *   })
 * })
 * 
 * @example
 * // Performance testing
 * import { performanceTestUtils } from '@/components/api-generation/openapi-preview/test-utilities'
 * 
 * test('should handle large datasets efficiently', async () => {
 *   const { renderTime } = await performanceTestUtils.testLargeDataset(1000)
 *   expect(renderTime).toBeLessThan(performanceTestUtils.PERFORMANCE_THRESHOLDS.MAX_RENDER_TIME)
 * })
 * 
 * @example
 * // Accessibility testing
 * import { accessibilityTestUtils } from '@/components/api-generation/openapi-preview/test-utilities'
 * 
 * test('should be accessible', async () => {
 *   const { container } = render(<OpenAPIViewer />)
 *   const accessibility = await accessibilityTestUtils.testAccessibility('openapi-viewer')
 *   expect(accessibility.passed).toBe(true)
 * })
 * 
 * @example
 * // MSW API mocking
 * import { apiMockingUtils } from '@/components/api-generation/openapi-preview/test-utilities'
 * 
 * beforeEach(() => {
 *   apiMockingUtils.server.use(...apiMockingUtils.handlers.core)
 * })
 * 
 * @example
 * // Default import usage
 * import openApiTestUtils from '@/components/api-generation/openapi-preview/test-utilities'
 * 
 * test('comprehensive testing example', async () => {
 *   openApiTestUtils.setup()
 *   const { user } = openApiTestUtils.render(<Component />)
 *   await openApiTestUtils.testUtils.waitForQueries()
 * })
 * 
 * @example
 * // Angular migration pattern
 * import { AngularCompatibility } from '@/components/api-generation/openapi-preview/test-utilities'
 * 
 * describe('OpenAPI Preview Component', () => {
 *   beforeEach(() => {
 *     AngularCompatibility.TestEnvironment()
 *   })
 *   
 *   it('should render', AngularCompatibility.fakeAsync(() => {
 *     const wrapper = AngularCompatibility.ComponentWrapper(<Component />)
 *     AngularCompatibility.tick()
 *     expect(wrapper.container).toBeInTheDocument()
 *   }))
 * })
 */

/**
 * Export summary for comprehensive OpenAPI preview testing infrastructure:
 * 
 * ✅ **MSW Handlers**: Complete API mocking with realistic network simulation
 * ✅ **Test Setup**: Vitest 2.1.0 configuration with React Query and browser API mocking
 * ✅ **Render Utils**: React Testing Library utilities with comprehensive provider setup
 * ✅ **Mock Data**: Type-safe OpenAPI specifications and service definitions
 * ✅ **Performance Testing**: Benchmarking utilities meeting React/Next.js requirements
 * ✅ **Accessibility Testing**: WCAG 2.1 AA compliance automation
 * ✅ **Tree-shaking Optimization**: Turbopack-friendly exports for minimal bundle impact
 * ✅ **TypeScript Support**: Full type safety with strict mode compatibility
 * ✅ **Migration Support**: Angular compatibility layer for seamless transition
 * 
 * This testing infrastructure enables comprehensive OpenAPI preview component testing
 * with 90%+ code coverage, performance optimization, and accessibility compliance
 * per the technical specification requirements for React/Next.js migration.
 */