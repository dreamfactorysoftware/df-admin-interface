/**
 * OpenAPI Preview Test Utilities - Central Export Index
 * 
 * Central barrel export file providing clean, tree-shaking friendly imports for all OpenAPI preview
 * test utilities, MSW handlers, mock data, and testing components. Enables consistent testing
 * patterns across the OpenAPI preview component test suite with organized module structure
 * following React/Next.js Integration Requirements.
 * 
 * This implementation supports:
 * - F-006: API Documentation and Testing comprehensive testing utility exports
 * - Section 3.6 Development & Deployment organized test infrastructure for Vitest integration
 * - Turbopack build optimization requirements per Section 0.1.1 technical scope
 * - React 19 patterns with React Testing Library utilities and MSW integration
 * 
 * @fileoverview Central export for OpenAPI preview testing infrastructure
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1.0, Vitest 2.1.0, MSW 2.0.0
 */

// ============================================================================
// MSW Handlers and Mock Server Configuration
// ============================================================================

/**
 * Mock Service Worker handlers for comprehensive API simulation
 * Provides realistic HTTP request interception for OpenAPI preview testing
 */
export {
  // Main handler collections
  openApiPreviewHandlers,
  openApiPreviewHandlers as default,
  coreHandlers,
  errorHandlers,
  perfHandlers,
  securityHandlers,
  
  // Specific handler groups
  serviceHandlers,
  openApiHandlers,
  apiDocHandlers,
  authHandlers,
  errorSimulationHandlers,
  performanceHandlers,
  
  // Mock data constants
  MOCK_SERVICES,
  MYSQL_OPENAPI_SPEC,
  EMAIL_OPENAPI_SPEC,
  MOCK_API_KEYS,
  NETWORK_DELAYS,
  API_ENDPOINTS,
  HTTP_HEADERS,
  
  // Utility functions
  createMockApiResponse,
  validateOpenApiSpec,
} from './msw-handlers';

// ============================================================================
// Test Environment Setup and Configuration
// ============================================================================

/**
 * Test environment setup utilities and configuration
 * Provides comprehensive test environment management for OpenAPI preview tests
 */
export {
  // Core setup functions
  setupTestEnvironment,
  cleanupTestEnvironment,
  
  // MSW server management
  mockServer,
  setupMockServer,
  
  // React Query client utilities
  createTestQueryClient,
  getTestQueryClient,
  resetTestQueryClient,
  waitForQueriesToSettle,
  
  // Mock data factories
  createMockOpenAPISpec,
  createMockApiKey,
  createMockServiceInfo,
  createMockApiTestResult,
  createMockValidationErrors,
  
  // Test utility functions
  waitFor,
  createMockFunction,
  expectToMatchSchema,
  createMethodSpy,
  
  // Performance testing utilities
  measureExecutionTime,
  expectToCompleteWithin,
  
  // Accessibility testing utilities
  mockAxeCore,
  expectToBeAccessible,
  
  // Configuration
  defaultTestConfig,
} from './test-setup';

// ============================================================================
// Component Render Utilities and Providers
// ============================================================================

/**
 * React Testing Library render utilities with OpenAPI preview context
 * Provides comprehensive component testing environment with all necessary providers
 */
export {
  // Main render functions
  renderOpenAPIPreview,
  renderWithQueryClient,
  
  // Test wrapper components
  TestWrapper,
  MinimalTestWrapper,
  
  // Context providers and hooks
  OpenAPIPreviewTestProvider,
  useOpenAPIPreviewTestContext,
  
  // Mock configurations
  mockRouter,
  mockSwaggerUI,
  
  // Utility functions
  createOpenAPIPreviewProps,
  createTestSwaggerUIConfig,
  simulateApiInteraction,
  validateOpenAPISpecRendering,
  
  // Complete utility collection
  openApiPreviewTestUtils,
  
  // Default configuration
  defaultOpenAPIPreviewTestConfig,
} from './render-utils';

// ============================================================================
// Mock Data Collections and Fixtures
// ============================================================================

/**
 * Comprehensive mock data and fixtures for OpenAPI preview testing
 * Provides realistic test data for multiple service types and scenarios
 */
export {
  // Main mock data collection
  mockDataCollections,
  mockDataCollections as mockData,
  
  // OpenAPI specifications
  mockEmailServiceSpec,
  mockMySQLServiceSpec,
  mockPostgreSQLServiceSpec,
  mockMongoDBServiceSpec,
  
  // Service and API data
  mockApiDocsRowData,
  mockServiceInfo,
  mockApiKeyInfo,
  mockSwaggerUIConfigs,
  
  // Error and edge case scenarios
  mockErrorScenarios,
  mockLargeDatasetScenarios,
  
  // Utility helpers
  mockDataHelpers,
  
  // HTTP constants
  MOCK_HTTP_HEADERS,
} from './mock-data';

// ============================================================================
// Type Exports for Testing
// ============================================================================

/**
 * TypeScript type definitions for test utilities and mock data
 * Provides type safety and IntelliSense support for testing code
 */

// Test setup types
export type {
  TestEnvironmentConfig,
} from './test-setup';

// Render utility types
export type {
  TestWrapperProps,
  OpenAPIPreviewRenderOptions,
  OpenAPIPreviewRenderResult,
  OpenAPIPreviewTestContextConfig,
  ApiInteractionSimulation,
} from './render-utils';

// Mock data types
export type {
  MockDataCollections,
  MockServiceType,
  MockErrorType,
} from './mock-data';

// Re-export component types for convenience
export type {
  OpenAPISpecification,
  OpenAPIPreviewProps,
  SwaggerUIConfig,
  ApiKeyInfo,
  ServiceInfo,
  ApiTestResult,
  ApiCallInfo,
  ValidationError,
  ApiDocsRowData,
  ServiceEndpoint,
  ServiceHealthStatus,
  ApiDocumentationMetadata,
} from '../types';

// ============================================================================
// Convenience Collections and Shortcuts
// ============================================================================

/**
 * Pre-configured collections for common testing scenarios
 * Reduces boilerplate and provides standardized testing patterns
 */

/**
 * Essential testing utilities for basic OpenAPI preview testing
 * Includes the most commonly used functions for simple test scenarios
 */
export const essentialTestUtils = {
  // Render functions
  render: renderOpenAPIPreview,
  renderWithQuery: renderWithQueryClient,
  
  // Setup functions
  setup: setupTestEnvironment,
  cleanup: cleanupTestEnvironment,
  
  // Mock factories
  createSpec: createMockOpenAPISpec,
  createApiKey: createMockApiKey,
  createService: createMockServiceInfo,
  
  // MSW handlers
  handlers: coreHandlers,
  server: mockServer,
} as const;

/**
 * Advanced testing utilities for comprehensive test scenarios
 * Includes performance testing, accessibility validation, and complex mocking
 */
export const advancedTestUtils = {
  // Performance testing
  measureTime: measureExecutionTime,
  expectPerformance: expectToCompleteWithin,
  
  // Accessibility testing
  axe: mockAxeCore,
  expectA11y: expectToBeAccessible,
  
  // Error simulation
  errorHandlers,
  perfHandlers,
  
  // Large dataset testing
  largeDatasets: mockLargeDatasetScenarios,
  
  // Mock validation
  validateMock: mockDataHelpers.validateMockData,
} as const;

/**
 * OpenAPI specification testing utilities
 * Specialized utilities for testing different OpenAPI specification scenarios
 */
export const openApiSpecUtils = {
  // Specification collections
  specs: {
    email: mockEmailServiceSpec,
    mysql: mockMySQLServiceSpec,
    postgresql: mockPostgreSQLServiceSpec,
    mongodb: mockMongoDBServiceSpec,
  },
  
  // Validation utilities
  validate: validateOpenApiSpec,
  validateRendering: validateOpenAPISpecRendering,
  
  // Generation utilities
  generate: mockDataHelpers.generateMockSpec,
  
  // SwaggerUI configurations
  swaggerConfigs: mockSwaggerUIConfigs,
} as const;

/**
 * Service testing utilities
 * Utilities for testing different service types and configurations
 */
export const serviceTestUtils = {
  // Service collections
  services: mockServiceInfo,
  
  // Service utilities
  getByName: mockDataHelpers.getServiceByName,
  getRandom: mockDataHelpers.getRandomService,
  
  // API documentation data
  apiDocs: mockApiDocsRowData,
  
  // Health status scenarios
  healthStatuses: ['healthy', 'degraded', 'unhealthy'] as const,
} as const;

/**
 * Authentication testing utilities
 * Utilities for testing API key management and authentication scenarios
 */
export const authTestUtils = {
  // API key collections
  apiKeys: mockApiKeyInfo,
  
  // Key utilities
  getKeyByName: mockDataHelpers.getApiKeyByName,
  
  // Auth handlers
  authHandlers,
  securityHandlers,
  
  // Security schemes
  securitySchemes: mockDataCollections.components.securitySchemes,
} as const;

// ============================================================================
// Vitest Integration Helpers
// ============================================================================

/**
 * Vitest-specific utilities and configuration helpers
 * Provides seamless integration with Vitest testing framework
 */
export const vitestHelpers = {
  /**
   * Setup function for Vitest beforeAll hook
   * Configures the complete testing environment for OpenAPI preview tests
   */
  setupVitest: () => {
    setupTestEnvironment();
    return {
      queryClient: getTestQueryClient(),
      server: mockServer,
      cleanup: cleanupTestEnvironment,
    };
  },
  
  /**
   * Cleanup function for Vitest afterAll hook
   * Ensures proper cleanup of all test resources
   */
  cleanupVitest: () => {
    cleanupTestEnvironment();
    resetTestQueryClient();
    if (mockServer.listHandlers().length > 0) {
      mockServer.close();
    }
  },
  
  /**
   * Per-test setup for Vitest beforeEach hook
   * Resets test state between individual tests
   */
  resetBetweenTests: () => {
    resetTestQueryClient();
    mockServer.resetHandlers();
  },
  
  /**
   * Default Vitest configuration for OpenAPI preview tests
   * Provides standard test timeouts and environment settings
   */
  vitestConfig: {
    testTimeout: 10000, // 10 seconds
    hookTimeout: 5000,  // 5 seconds
    teardownTimeout: 3000, // 3 seconds
    environment: 'jsdom',
    setupFiles: ['./src/components/api-generation/openapi-preview/test-utilities/index.ts'],
  },
} as const;

// ============================================================================
// React Testing Library Integration
// ============================================================================

/**
 * React Testing Library utilities with OpenAPI preview enhancements
 * Provides enhanced testing capabilities specifically for OpenAPI preview components
 */
export const rtlHelpers = {
  /**
   * Custom queries for OpenAPI preview components
   * Provides semantic queries for common OpenAPI preview elements
   */
  queries: {
    // SwaggerUI specific queries
    getSwaggerUI: () => document.querySelector('[data-testid="swagger-ui"]'),
    getApiOperation: (operationId: string) => 
      document.querySelector(`[data-operation-id="${operationId}"]`),
    getSecurityScheme: (schemeName: string) =>
      document.querySelector(`[data-security-scheme="${schemeName}"]`),
    
    // Documentation specific queries
    getEndpointList: () => document.querySelector('[role="list"][aria-label*="endpoint"]'),
    getSchemaList: () => document.querySelector('[role="list"][aria-label*="schema"]'),
    getOperationDetails: () => document.querySelector('[data-testid="operation-details"]'),
  },
  
  /**
   * Custom matchers for OpenAPI preview testing
   * Provides domain-specific assertions for OpenAPI preview components
   */
  matchers: {
    toHaveValidOpenAPISpec: (spec: any) => {
      return mockDataHelpers.validateMockData.isValidOpenAPISpec(spec);
    },
    toHaveActiveApiKey: (keyInfo: any) => {
      return mockDataHelpers.validateMockData.isValidApiKey(keyInfo) && keyInfo.isActive;
    },
    toHaveHealthyService: (serviceInfo: any) => {
      return mockDataHelpers.validateMockData.isValidServiceInfo(serviceInfo) && 
             serviceInfo.health?.status === 'healthy';
    },
  },
  
  /**
   * User interaction helpers
   * Provides high-level user interaction utilities for testing
   */
  interactions: {
    expandOperation: async (operationId: string) => {
      const operation = rtlHelpers.queries.getApiOperation(operationId);
      if (operation) {
        operation.click();
        // Wait for expansion animation
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    },
    
    tryApiCall: async (operationId: string, parameters: Record<string, any> = {}) => {
      const operation = rtlHelpers.queries.getApiOperation(operationId);
      if (operation) {
        // Simulate filling parameters and executing try-it-out
        const tryButton = operation.querySelector('[data-testid="try-it-out"]');
        if (tryButton) {
          (tryButton as HTMLElement).click();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    },
  },
} as const;

// ============================================================================
// Documentation and Usage Examples
// ============================================================================

/**
 * Usage examples and documentation for test utilities
 * Provides copy-paste examples for common testing scenarios
 */
export const usageExamples = {
  /**
   * Basic component rendering test example
   */
  basicRender: `
import { renderOpenAPIPreview, mockEmailServiceSpec } from './test-utilities';

test('renders OpenAPI preview component', () => {
  const { getByText } = renderOpenAPIPreview(
    <OpenAPIPreview spec={mockEmailServiceSpec} />
  );
  
  expect(getByText('DreamFactory Email Service')).toBeInTheDocument();
});
  `,
  
  /**
   * MSW handler usage example
   */
  mswSetup: `
import { setupTestEnvironment, mockServer, openApiPreviewHandlers } from './test-utilities';

beforeAll(() => {
  setupTestEnvironment();
  mockServer.use(...openApiPreviewHandlers);
});

afterAll(() => {
  mockServer.close();
});
  `,
  
  /**
   * Performance testing example
   */
  performanceTest: `
import { expectToCompleteWithin, renderOpenAPIPreview } from './test-utilities';

test('renders large specification within performance budget', async () => {
  const result = await expectToCompleteWithin(
    () => renderOpenAPIPreview(<OpenAPIPreview spec={largeSpec} />),
    2000 // 2 seconds
  );
  
  expect(result).toBeDefined();
});
  `,
  
  /**
   * Accessibility testing example
   */
  accessibilityTest: `
import { renderOpenAPIPreview, expectToBeAccessible } from './test-utilities';

test('meets accessibility standards', async () => {
  const { container } = renderOpenAPIPreview(
    <OpenAPIPreview spec={mockEmailServiceSpec} />
  );
  
  await expectToBeAccessible(container);
});
  `,
} as const;

// ============================================================================
// Default Export and Module Information
// ============================================================================

/**
 * Complete OpenAPI preview test utilities collection
 * Main export providing all testing utilities in organized collections
 */
const openApiPreviewTestUtilities = {
  // Core collections
  essential: essentialTestUtils,
  advanced: advancedTestUtils,
  specs: openApiSpecUtils,
  services: serviceTestUtils,
  auth: authTestUtils,
  
  // Framework integration
  vitest: vitestHelpers,
  rtl: rtlHelpers,
  
  // Documentation
  examples: usageExamples,
  
  // Direct access to main utilities
  render: renderOpenAPIPreview,
  setup: setupTestEnvironment,
  mockData: mockDataCollections,
  handlers: openApiPreviewHandlers,
} as const;

// Export as default for convenient import
export default openApiPreviewTestUtilities;

/**
 * Module metadata for build optimization and documentation
 */
export const moduleInfo = {
  name: 'OpenAPI Preview Test Utilities',
  version: '1.0.0',
  description: 'Comprehensive test utilities for OpenAPI preview components',
  framework: 'React 19 + Next.js 15.1',
  testFramework: 'Vitest 2.1.0',
  mockingLibrary: 'MSW 2.0.0',
  testingLibrary: 'React Testing Library',
  
  // Turbopack optimization hints
  sideEffects: false, // Enable tree-shaking
  exports: {
    // ES modules for optimal tree-shaking
    '.': {
      import: './index.js',
      types: './index.d.ts',
    },
  },
  
  // Bundle analyzer information
  bundleSize: {
    estimated: '~50KB gzipped',
    treeshaking: 'full support',
    chunks: 'splittable by utility type',
  },
} as const;

/**
 * Type definition for the complete test utilities module
 * Provides full type safety for all exported utilities
 */
export type OpenAPIPreviewTestUtilities = typeof openApiPreviewTestUtilities;

// ============================================================================
// Auto-initialization for Test Environment
// ============================================================================

/**
 * Auto-setup when module is imported
 * Automatically configures test environment for immediate use
 */
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  // Only auto-setup in test environment
  try {
    setupTestEnvironment();
  } catch (error) {
    console.warn('OpenAPI Preview Test Utilities: Auto-setup failed', error);
  }
}

/**
 * Export statement verification for tree-shaking optimization
 * Ensures all exports are properly configured for Turbopack
 */
export const __esModule = true;