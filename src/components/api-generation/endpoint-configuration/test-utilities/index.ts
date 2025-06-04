/**
 * @fileoverview Central export barrel for endpoint configuration test utilities
 * 
 * Provides clean, tree-shaking friendly imports for all endpoint configuration testing infrastructure
 * including MSW handlers, React Testing Library utilities, mock data, Vitest configuration helpers,
 * and React Query testing patterns. Enables consistent testing patterns across the endpoint
 * configuration component test suite per React/Next.js Integration Requirements.
 * 
 * Key exports organized by category:
 * - MSW Handlers: API mocking for realistic endpoint testing
 * - Test Setup: Vitest configuration and environment setup utilities  
 * - Render Utils: React Testing Library with endpoint context providers
 * - Mock Data: Comprehensive test fixtures and OpenAPI specifications
 * - Type Definitions: TypeScript interfaces for endpoint configuration testing
 * 
 * Features:
 * - Turbopack build optimization through selective exports per Section 0.1.1
 * - React 19 testing patterns with @testing-library/react integration
 * - Vitest performance optimization for < 30 second test execution per Section 3.6
 * - MSW integration for F-006 API Documentation and Testing requirements
 * - Type-safe mock data factories for comprehensive endpoint configuration testing
 * 
 * Performance Requirements:
 * - Test bundle generation optimized for Turbopack per Section 3.2.5
 * - Tree-shaking friendly exports for minimal test bundle size
 * - Real-time validation testing utilities under 100ms execution time
 * - 90%+ code coverage support through comprehensive test utilities
 * 
 * @version 1.0.0
 * @since 2024-12-19
 */

// =============================================================================
// MSW HANDLERS AND API MOCKING
// =============================================================================

export {
  // Primary MSW handler collections
  endpointConfigurationHandlers,
  default as mswHandlers,
  
  // MSW utility functions for test environment management
  resetMockData,
  addMockEndpoint,
  getMockEndpoints,
  
  // MSW-compatible type definitions
  type EndpointConfiguration as MSWEndpointConfiguration,
  type EndpointParameter as MSWEndpointParameter,
  type SecurityScheme as MSWSecurityScheme,
  type ValidationRule as MSWValidationRule,
  type OpenAPISpecification as MSWOpenAPISpecification,
  type ApiError as MSWApiError,
} from './msw-handlers';

// =============================================================================
// TEST ENVIRONMENT SETUP AND VITEST INTEGRATION
// =============================================================================

export {
  // Core test environment functions
  createTestQueryClient,
  createTestServer,
  setupTestEnvironment,
  teardownTestEnvironment,
  resetTestState,
  getTestContext,
  
  // React Query testing utilities for async operations
  waitForMutationToComplete,
  waitForQueriesToSettle,
  
  // Mock data factory functions for consistent test fixtures
  createMockEndpointConfig,
  createMockParameter,
  createMockSecurityScheme,
  createMockResponse,
  createMockValidationRules,
  
  // Test context and setup type definitions
  type EndpointConfigTestContext,
  type TestEndpointConfig,
  type TestParameter,
  type TestSecurityScheme,
  type TestResponse,
  type TestValidationRules,
} from './test-setup';

// =============================================================================
// REACT TESTING LIBRARY RENDER UTILITIES
// =============================================================================

export {
  // Primary render functions with endpoint configuration context
  renderWithEndpointConfig,
  renderEndpointComponent,
  
  // React context hooks for test components
  useMockEndpointConfig,
  
  // Test scenario creation utilities
  createEndpointTestScenario,
  endpointValidationUtils,
  
  // Render utility type definitions
  type CustomRenderOptions,
  type FormTestUtilities,
  type ApiTestUtilities,
  type StateTestUtilities,
  type ExtendedRenderResult,
  type EndpointConfigContextValue,
  type MockRouterConfig,
  
  // Re-export test setup utilities for convenience
  createMockEndpointConfig as createMockEndpointConfigForRender,
  createMockParameter as createMockParameterForRender,
  createMockSecurityScheme as createMockSecuritySchemeForRender,
  createMockResponse as createMockResponseForRender,
  createMockValidationRules as createMockValidationRulesForRender,
  getTestContext as getTestContextForRender,
} from './render-utils';

// Set default export to the primary render function for convenience
export { default as renderWithEndpointConfig } from './render-utils';

// =============================================================================
// COMPREHENSIVE MOCK DATA AND FIXTURES
// =============================================================================

export {
  // Comprehensive mock endpoint configurations for all HTTP methods
  MOCK_ENDPOINT_CONFIGURATIONS,
  MOCK_OPENAPI_SPECIFICATION,
  
  // Detailed schema definitions for OpenAPI 3.0+ testing
  MOCK_SCHEMAS,
  MOCK_PARAMETERS,
  MOCK_RESPONSES,
  MOCK_SECURITY_CONFIGS,
  
  // HTTP standards and media type constants
  MOCK_HTTP_STATUS_CODES,
  MOCK_MEDIA_TYPES,
  
  // React Hook Form testing fixtures
  MOCK_FORM_DATA,
  
  // MSW-compatible structured mock data
  MSW_MOCK_DATA,
  
  // Mock data factory functions with flexible overrides
  createMockEndpoint,
  createMockParameter as createMockParam,
  createMockSchema,
  createMockResponse as createMockResp,
  createMockSecurity,
  
  // Mock data type definitions
  type MockEndpointConfiguration,
  type EndpointParameter as MockEndpointParameter,
  type RequestBodyConfiguration,
  type ResponseConfiguration,
  type MediaTypeConfiguration,
  type SchemaConfiguration,
  type SecurityConfiguration,
  type OAuthFlowConfiguration,
  type HeaderConfiguration,
  type ExampleConfiguration,
  
  // Enum types for type-safe testing
  type HttpMethod,
  type ParameterLocation,
  type ParameterStyle,
  type SchemaType,
  type SecurityType,
  type SecurityLocation,
} from './mock-data';

// Default export from mock-data for comprehensive access
export { default as mockData } from './mock-data';

// =============================================================================
// CONVENIENCE RE-EXPORTS AND ALIASES
// =============================================================================

// Commonly used test utilities grouped for easy access
export const testUtils = {
  // Environment setup
  setup: setupTestEnvironment,
  teardown: teardownTestEnvironment,
  reset: resetTestState,
  getContext: getTestContext,
  
  // Query client utilities
  createQueryClient: createTestQueryClient,
  waitForMutations: waitForMutationToComplete,
  waitForQueries: waitForQueriesToSettle,
  
  // Mock data creation
  mockEndpoint: createMockEndpointConfig,
  mockParameter: createMockParameter,
  mockSecurity: createMockSecurityScheme,
  mockResponse: createMockResponse,
  mockValidation: createMockValidationRules,
  
  // MSW management
  resetMocks: resetMockData,
  addMockEndpoint: addMockEndpoint,
  getMockEndpoints: getMockEndpoints,
};

// Rendering utilities grouped for common test patterns
export const renderUtils = {
  // Primary render functions
  withEndpointConfig: renderWithEndpointConfig,
  component: renderEndpointComponent,
  
  // Test scenario helpers
  createScenario: createEndpointTestScenario,
  validation: endpointValidationUtils,
  
  // Context access
  useEndpointConfig: useMockEndpointConfig,
};

// Mock data utilities organized by category
export const mockUtils = {
  // Endpoint configurations
  endpoints: MOCK_ENDPOINT_CONFIGURATIONS,
  openApiSpec: MOCK_OPENAPI_SPECIFICATION,
  
  // Schema components
  schemas: MOCK_SCHEMAS,
  parameters: MOCK_PARAMETERS,
  responses: MOCK_RESPONSES,
  security: MOCK_SECURITY_CONFIGS,
  
  // Constants
  statusCodes: MOCK_HTTP_STATUS_CODES,
  mediaTypes: MOCK_MEDIA_TYPES,
  
  // Form testing data
  formData: MOCK_FORM_DATA,
  
  // Factory functions
  create: {
    endpoint: createMockEndpoint,
    parameter: createMockParam,
    schema: createMockSchema,
    response: createMockResp,
    security: createMockSecurity,
  },
};

// MSW utilities for API mocking
export const mswUtils = {
  // Handler collections
  handlers: endpointConfigurationHandlers,
  
  // Mock data management
  reset: resetMockData,
  add: addMockEndpoint,
  get: getMockEndpoints,
  
  // MSW-compatible data
  data: MSW_MOCK_DATA,
};

// =============================================================================
// TYPE DEFINITIONS FOR EXTERNAL CONSUMPTION
// =============================================================================

// Consolidated type exports for comprehensive endpoint configuration testing
export type {
  // Test environment and setup types
  EndpointConfigTestContext as TestContext,
  TestEndpointConfig as EndpointConfig,
  TestParameter as Parameter,
  TestSecurityScheme as SecurityScheme,
  TestResponse as Response,
  TestValidationRules as ValidationRules,
  
  // Render utility types
  CustomRenderOptions as RenderOptions,
  FormTestUtilities as FormUtils,
  ApiTestUtilities as ApiUtils,
  StateTestUtilities as StateUtils,
  ExtendedRenderResult as RenderResult,
  
  // Mock data types
  MockEndpointConfiguration as EndpointConfiguration,
  RequestBodyConfiguration as RequestBody,
  ResponseConfiguration as ResponseConfig,
  SchemaConfiguration as Schema,
  SecurityConfiguration as Security,
  
  // MSW types
  MSWEndpointConfiguration as MSWEndpoint,
  MSWEndpointParameter as MSWParameter,
  MSWSecurityScheme as MSWSecurity,
  MSWOpenAPISpecification as MSWOpenAPI,
  MSWApiError as MSWError,
  
  // Enum types
  HttpMethod,
  ParameterLocation,
  SecurityType,
  SchemaType,
};

// =============================================================================
// PERFORMANCE AND TURBOPACK OPTIMIZATION
// =============================================================================

/**
 * Tree-shaking friendly export configuration
 * Enables Turbopack to optimize test bundle size by excluding unused utilities
 */
export const __esModule = true;

/**
 * Utility function to create a minimal test environment for performance-critical tests
 * Provides essential testing utilities with minimal overhead for fast test execution
 */
export function createMinimalTestEnvironment() {
  return {
    queryClient: createTestQueryClient(),
    render: renderEndpointComponent,
    mockEndpoint: createMockEndpointConfig,
    resetMocks: resetMockData,
  };
}

/**
 * Utility function to validate test setup performance
 * Ensures test environment initialization meets the < 50ms requirement
 */
export async function validateTestPerformance(setupFn: () => void | Promise<void>): Promise<boolean> {
  const startTime = performance.now();
  await setupFn();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Log warning if test setup exceeds performance threshold
  if (duration > 50) {
    console.warn(`Test setup took ${duration.toFixed(2)}ms, exceeding 50ms threshold`);
    return false;
  }
  
  return true;
}

/**
 * Export version for compatibility tracking
 */
export const version = '1.0.0';

/**
 * Export metadata for build optimization
 */
export const metadata = {
  name: 'endpoint-configuration-test-utilities',
  version,
  description: 'Comprehensive test utilities for endpoint configuration components',
  framework: 'react-next-vitest',
  buildOptimized: true,
  treeShakingFriendly: true,
} as const;