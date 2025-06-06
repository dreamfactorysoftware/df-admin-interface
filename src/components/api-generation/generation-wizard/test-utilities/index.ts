/**
 * Central export file for API generation wizard test utilities.
 * 
 * Provides clean imports for test utilities, MSW handlers, mock data, and testing components
 * following React/Next.js Integration Requirements for modular test utility organization.
 * 
 * Enables consistent testing patterns across the wizard component test suite with tree-shaking
 * friendly exports optimized for Turbopack build performance per Section 0.1.1 technical scope.
 * 
 * Key Features:
 * - F-006: API Documentation and Testing requiring comprehensive testing utility exports
 * - Section 3.6 Development & Deployment organized test infrastructure for Vitest integration
 * - React/Next.js Integration Requirements for modular component testing patterns
 * - Turbopack optimization through tree-shaking friendly export structure
 * - MSW handlers for realistic API interaction testing during development and testing
 * - Comprehensive mock data factories and fixtures for 90%+ test coverage requirements
 * 
 * Usage:
 * ```typescript
 * // Import specific utilities (tree-shaking friendly)
 * import { renderWithProviders, mockDatabaseTables, mswServer } from './test-utilities';
 * 
 * // Import entire test setup
 * import { testSetup } from './test-utilities';
 * 
 * // Import specific handler groups
 * import { schemaDiscoveryHandlers, apiGenerationHandlers } from './test-utilities';
 * ```
 */

// ============================================================================
// MSW Handlers and API Mocking
// ============================================================================

/**
 * Mock Service Worker handlers for comprehensive API interaction testing
 * Supports isolated frontend development without backend dependencies
 */
export {
  // Complete handler collections
  apiGenerationWizardHandlers,
  apiGenerationWizardHandlers as default,
  developmentOnlyHandlers,
  
  // Individual handler groups for selective testing
  databaseServiceTypeHandlers,
  databaseServiceHandlers,
  schemaDiscoveryHandlers,
  apiGenerationHandlers,
  apiDocumentationHandlers,
  
  // Error simulation and testing utilities
  type ErrorScenarios
} from './msw-handlers';

// ============================================================================
// Test Setup and Configuration
// ============================================================================

/**
 * Vitest test configuration and MSW server setup utilities
 * Provides consistent testing environment across all wizard component tests
 */
export {
  // MSW server configuration
  mswServer,
  wizardApiHandlers,
  
  // React Query test utilities
  createTestQueryClient,
  testQueryClient,
  waitForQueryToComplete,
  clearQueryCache,
  
  // Mock data factories for test scenarios
  createMockWizardState,
  createMockDatabaseTable,
  createMockEndpointConfiguration,
  
  // Test environment utilities
  withNetworkLatency,
  createConsoleSpy,
  validateAccessibility,
  configureTest,
  
  // Type exports for test configuration
  type TestConfig,
  type MockedFunction
} from './test-setup';

// Provide default test setup as a comprehensive utility object
export { default as testSetup } from './test-setup';

// ============================================================================
// React Testing Library Utilities
// ============================================================================

/**
 * Custom render functions and testing utilities for wizard components
 * Includes provider setup, router mocking, and wizard-specific test helpers
 */
export {
  // Enhanced render function with providers
  renderWithProviders,
  renderWithProviders as render, // Alias for convenience
  
  // Test wrapper and provider components
  TestWrapper,
  
  // Router and navigation testing
  createMockRouter,
  
  // Mock data for component testing
  defaultTestWizardState,
  mockDatabaseTables,
  mockEndpointConfigurations,
  mockOpenAPISpec,
  
  // Wizard-specific testing utilities
  wizardTestUtils,
  wizardAssertions,
  mswTestUtils,
  
  // React Query test client factory
  createTestQueryClient as createRenderTestQueryClient,
  
  // Re-export React Testing Library utilities for convenience
  screen,
  waitFor,
  fireEvent,
  within,
  act,
  cleanup,
  
  // User event for realistic interaction testing
  userEvent,
  
  // Type exports for render options and test data
  type RenderWithProvidersOptions,
  type DatabaseTable,
  type EndpointConfiguration,
  type WizardStep,
  type WizardState
} from './render-utils';

// ============================================================================
// Comprehensive Test Suite Utilities
// ============================================================================

/**
 * Vitest test suite utilities and testing patterns for wizard components
 * Includes test utilities, assertions, and mock factories for comprehensive coverage
 */
export {
  // Test utility functions for wizard testing
  createWizardProps,
  waitForWizardState,
  createUserEvent,
  validateAccessibility as validateA11y, // Alias for accessibility validation
  
  // Re-export Vitest testing utilities
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  vi
} from './wizard-tests';

// ============================================================================
// Mock Data and Fixtures
// ============================================================================

/**
 * Comprehensive mock data and fixtures for wizard testing scenarios
 * Provides realistic test data for unit tests, integration tests, and MSW handlers
 */
export {
  // Database schema mock data
  mockDatabaseFields,
  mockOrderFields,
  mockForeignKeys,
  mockDatabaseTables as mockTables, // Alias to avoid naming conflicts
  mockSelectedTables,
  mockLargeDataset,
  
  // Wizard state and configuration mocks
  mockTableSelectionData,
  mockVirtualScrollConfig,
  mockEndpointParameters,
  mockEndpointSecurity,
  mockRequestSchema,
  mockResponseSchema,
  mockGetMethodConfiguration,
  mockPostMethodConfiguration,
  mockEndpointConfigurations as mockConfigurations, // Alias
  
  // OpenAPI specification mocks
  mockOpenAPISpec as mockOpenAPI, // Alias
  mockEmailServiceOpenAPISpec,
  
  // Generation result mocks
  mockSuccessfulGenerationResult,
  mockFailedGenerationResult,
  
  // Complete wizard state mocks for different steps
  mockInitialWizardState,
  mockTableSelectionWizardState,
  mockEndpointConfigurationWizardState,
  mockGenerationPreviewWizardState,
  mockGenerationProgressWizardState,
  mockCompletedWizardState,
  mockValidationErrorWizardState,
  
  // MSW support data and API responses
  mockAPIResponses,
  
  // Utility functions for generating mock data
  generateMockTable,
  createMockWizardState as createWizardState, // Alias to avoid conflicts
  createMockEndpointConfiguration as createEndpointConfig // Alias
} from './mock-data';

// Provide default mock data collection
export { default as mockData } from './mock-data';

// ============================================================================
// Type Re-exports for Convenience
// ============================================================================

/**
 * Comprehensive type exports for TypeScript support in test files
 * Ensures type safety and IntelliSense support across the test suite
 */
export type {
  // Core wizard types
  WizardState,
  WizardStep,
  DatabaseTable,
  DatabaseField,
  EndpointConfiguration,
  MethodConfiguration,
  
  // OpenAPI and generation types
  OpenAPISpec,
  GenerationResult,
  GenerationStatus,
  HTTPMethod,
  
  // Testing utility types
  RenderWithProvidersOptions,
  TestConfig,
  MockedFunction,
  
  // Parameter and configuration types
  EndpointParameter,
  EndpointSecurity,
  RequestSchema,
  ResponseSchema,
  
  // Field and schema types
  FieldType,
  ForeignKeyRelation,
  ParameterType,
  FilterOperator,
  ReferentialAction,
  
  // Wizard data types
  TableSelectionData,
  VirtualScrollConfig,
  APIKeyPermission,
  RateLimitConfig,
  CORSConfig,
  ResponseFormatOptions
} from '../types';

// ============================================================================
// Convenience Exports and Aliases
// ============================================================================

/**
 * Convenience exports for common testing patterns and workflows
 * Provides simplified access to frequently used testing utilities
 */

// Test environment setup utilities grouped for convenience
export const testEnvironment = {
  mswServer,
  createTestQueryClient,
  configureTest,
  validateAccessibility,
  createConsoleSpy,
  withNetworkLatency
} as const;

// Render utilities grouped for convenience
export const renderUtils = {
  renderWithProviders,
  createMockRouter,
  TestWrapper,
  createTestQueryClient
} as const;

// Mock data factories grouped for convenience
export const mockFactories = {
  createMockWizardState,
  createMockDatabaseTable,
  createMockEndpointConfiguration,
  generateMockTable
} as const;

// MSW handler collections grouped for convenience
export const mswHandlers = {
  all: apiGenerationWizardHandlers,
  databaseTypes: databaseServiceTypeHandlers,
  databaseServices: databaseServiceHandlers,
  schemaDiscovery: schemaDiscoveryHandlers,
  apiGeneration: apiGenerationHandlers,
  documentation: apiDocumentationHandlers,
  development: developmentOnlyHandlers
} as const;

// Wizard testing utilities grouped for convenience
export const wizardUtils = {
  createWizardProps,
  waitForWizardState,
  createUserEvent,
  wizardTestUtils,
  wizardAssertions
} as const;

// ============================================================================
// Default Export for Complete Test Utilities
// ============================================================================

/**
 * Complete test utilities collection for comprehensive wizard testing
 * Provides everything needed for wizard component testing in a single import
 */
export const wizardTestUtilities = {
  // Test environment and setup
  testEnvironment,
  testSetup,
  
  // Rendering and component testing
  renderUtils,
  renderWithProviders,
  createMockRouter,
  
  // Mock data and factories
  mockFactories,
  mockData,
  
  // MSW handlers and API mocking
  mswHandlers,
  mswServer,
  
  // Wizard-specific utilities
  wizardUtils,
  
  // Accessibility and validation
  validateAccessibility,
  
  // Type utilities and configuration
  configureTest,
  createTestQueryClient
} as const;

// Default export for convenience importing
export default wizardTestUtilities;

// ============================================================================
// Development and Debugging Utilities
// ============================================================================

/**
 * Development-specific utilities for debugging and test development
 * Only included in development builds for enhanced testing experience
 */
export const devUtilities = process.env.NODE_ENV === 'development' ? {
  // Development MSW handlers with additional debugging
  developmentOnlyHandlers,
  
  // Large dataset for performance testing
  mockLargeDataset,
  
  // Console utilities for debugging
  createConsoleSpy,
  
  // Network simulation for testing loading states
  withNetworkLatency,
  
  // Accessibility debugging
  validateAccessibility
} as const : undefined;

// ============================================================================
// Tree-shaking Optimization Comments
// ============================================================================

/*
 * Tree-shaking Optimization Notes:
 * 
 * This barrel export file is structured to maximize Turbopack's tree-shaking efficiency:
 * 
 * 1. Named exports are used exclusively to enable dead code elimination
 * 2. Re-exports use explicit import/export patterns for better static analysis
 * 3. Conditional exports (devUtilities) are properly guarded for production builds
 * 4. Grouped exports (testEnvironment, renderUtils, etc.) are marked as const assertions
 * 5. Type-only exports are separated using 'export type' syntax
 * 6. Default exports are provided for convenience but don't interfere with tree-shaking
 * 
 * This structure ensures that only the required test utilities are included in the final
 * test bundle, optimizing build performance and reducing bundle size per Section 0.1.1
 * technical scope requirements for Turbopack optimization.
 */