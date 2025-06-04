/**
 * OpenAPI Preview Component Test Render Utilities
 * 
 * React Testing Library render utilities and custom providers for OpenAPI preview component testing.
 * Provides reusable render functions with API generation context, React Query client, MSW integration,
 * and routing setup for consistent component testing environment across the OpenAPI preview test suite.
 * 
 * This implementation follows React/Next.js Integration Requirements for React Testing Library component
 * testing patterns and F-006: API Documentation and Testing requirements with comprehensive component
 * testing automation for OpenAPI preview functionality.
 * 
 * @fileoverview Testing utilities for OpenAPI preview components with React 19 and Next.js 15.1 integration
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1.0, React Testing Library, Vitest 2.1.0
 */

import React, { type PropsWithChildren, type ReactElement } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { vi, type MockInstance } from 'vitest';

// Import OpenAPI preview types and testing utilities
import type {
  OpenAPISpecification,
  OpenAPIPreviewProps,
  SwaggerUIConfig,
  ApiKeyInfo,
  ServiceInfo,
  ApiTestResult,
  ApiCallInfo,
} from '../types';

import {
  createTestQueryClient,
  createMockOpenAPISpec,
  createMockApiKey,
  createMockServiceInfo,
  createMockApiTestResult,
  setupMockServer,
  defaultTestConfig,
  type TestEnvironmentConfig,
} from './test-setup';

// ============================================================================
// Mock Setup and Configuration
// ============================================================================

/**
 * Mock Next.js router for testing navigation in OpenAPI preview components
 * Provides consistent router behavior across all OpenAPI preview tests
 */
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn().mockResolvedValue(undefined),
  pathname: '/api-docs/test-service',
  query: {},
  asPath: '/api-docs/test-service',
  route: '/api-docs/[serviceId]',
  isReady: true,
  isFallback: false,
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
};

/**
 * Mock useRouter hook for Next.js navigation testing
 * Ensures consistent router behavior in OpenAPI preview components
 */
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockRouter.pathname,
  useSearchParams: () => new URLSearchParams(),
}));

/**
 * Mock @swagger-ui/react for consistent UI testing
 * Provides controlled SwaggerUI behavior during component testing
 */
export const mockSwaggerUI = {
  SwaggerUI: vi.fn(({ onComplete, onFailure, ...props }) => {
    // Simulate SwaggerUI rendering
    React.useEffect(() => {
      // Simulate successful spec loading
      if (onComplete) {
        setTimeout(() => onComplete(), 100);
      }
    }, [onComplete]);

    return React.createElement('div', {
      'data-testid': 'swagger-ui',
      'data-spec-url': props.url,
      'data-config': JSON.stringify(props),
    }, 'Mocked SwaggerUI Component');
  }),
};

vi.mock('@swagger-ui/react', () => mockSwaggerUI);

/**
 * Mock window.matchMedia for responsive design testing
 * Ensures consistent behavior across different viewport sizes
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ============================================================================
// OpenAPI Preview Context Provider
// ============================================================================

/**
 * Configuration interface for OpenAPI preview test context
 * Defines available options for customizing the test environment
 */
export interface OpenAPIPreviewTestContextConfig {
  readonly mockApiKey?: ApiKeyInfo;
  readonly mockServiceInfo?: ServiceInfo;
  readonly mockOpenAPISpec?: OpenAPISpecification;
  readonly baseUrl?: string;
  readonly theme?: 'light' | 'dark' | 'auto';
  readonly enableAuth?: boolean;
  readonly showTryItOut?: boolean;
  readonly customConfig?: Partial<SwaggerUIConfig>;
}

/**
 * OpenAPI preview test context for managing test state
 * Provides centralized state management for OpenAPI preview testing
 */
interface OpenAPIPreviewTestContext {
  readonly apiKey: ApiKeyInfo | null;
  readonly serviceInfo: ServiceInfo | null;
  readonly openApiSpec: OpenAPISpecification | null;
  readonly baseUrl: string;
  readonly theme: 'light' | 'dark' | 'auto';
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly setApiKey: (apiKey: ApiKeyInfo | null) => void;
  readonly setServiceInfo: (serviceInfo: ServiceInfo | null) => void;
  readonly setOpenApiSpec: (spec: OpenAPISpecification | null) => void;
  readonly setLoading: (loading: boolean) => void;
  readonly setError: (error: Error | null) => void;
}

/**
 * React context for OpenAPI preview testing state
 * Provides shared state across OpenAPI preview test components
 */
const OpenAPIPreviewTestContext = React.createContext<OpenAPIPreviewTestContext | null>(null);

/**
 * Hook for accessing OpenAPI preview test context
 * Ensures type-safe access to test context state
 */
export function useOpenAPIPreviewTestContext(): OpenAPIPreviewTestContext {
  const context = React.useContext(OpenAPIPreviewTestContext);
  if (!context) {
    throw new Error('useOpenAPIPreviewTestContext must be used within OpenAPIPreviewTestProvider');
  }
  return context;
}

/**
 * OpenAPI preview test provider component
 * Manages test state and provides context to child components
 */
export function OpenAPIPreviewTestProvider({
  children,
  initialConfig = {},
}: PropsWithChildren<{
  initialConfig?: OpenAPIPreviewTestContextConfig;
}>): ReactElement {
  const [apiKey, setApiKey] = React.useState<ApiKeyInfo | null>(
    initialConfig.mockApiKey || createMockApiKey()
  );
  const [serviceInfo, setServiceInfo] = React.useState<ServiceInfo | null>(
    initialConfig.mockServiceInfo || createMockServiceInfo()
  );
  const [openApiSpec, setOpenApiSpec] = React.useState<OpenAPISpecification | null>(
    initialConfig.mockOpenAPISpec || createMockOpenAPISpec()
  );
  const [isLoading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const contextValue: OpenAPIPreviewTestContext = React.useMemo(
    () => ({
      apiKey,
      serviceInfo,
      openApiSpec,
      baseUrl: initialConfig.baseUrl || 'http://localhost:3000/api/v2',
      theme: initialConfig.theme || 'light',
      isLoading,
      error,
      setApiKey,
      setServiceInfo,
      setOpenApiSpec,
      setLoading,
      setError,
    }),
    [apiKey, serviceInfo, openApiSpec, isLoading, error, initialConfig.baseUrl, initialConfig.theme]
  );

  return (
    <OpenAPIPreviewTestContext.Provider value={contextValue}>
      {children}
    </OpenAPIPreviewTestContext.Provider>
  );
}

// ============================================================================
// Test Wrapper Components
// ============================================================================

/**
 * Complete test wrapper with all necessary providers
 * Combines React Query, OpenAPI context, and theme providers for testing
 */
export interface TestWrapperProps {
  readonly queryClient?: QueryClient;
  readonly openApiConfig?: OpenAPIPreviewTestContextConfig;
  readonly mockRouterConfig?: Partial<typeof mockRouter>;
}

/**
 * Test wrapper component that provides all necessary contexts
 * Ensures consistent provider setup across all OpenAPI preview tests
 */
export function TestWrapper({
  children,
  queryClient,
  openApiConfig = {},
  mockRouterConfig = {},
}: PropsWithChildren<TestWrapperProps>): ReactElement {
  // Create or use provided query client
  const testQueryClient = queryClient || createTestQueryClient();

  // Apply router configuration overrides
  React.useEffect(() => {
    Object.assign(mockRouter, mockRouterConfig);
  }, [mockRouterConfig]);

  return (
    <QueryClientProvider client={testQueryClient}>
      <OpenAPIPreviewTestProvider initialConfig={openApiConfig}>
        {children}
      </OpenAPIPreviewTestProvider>
    </QueryClientProvider>
  );
}

/**
 * Minimal test wrapper for unit tests that don't require full context
 * Provides only essential providers for isolated component testing
 */
export function MinimalTestWrapper({
  children,
  queryClient,
}: PropsWithChildren<{
  queryClient?: QueryClient;
}>): ReactElement {
  const testQueryClient = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
}

// ============================================================================
// Custom Render Functions
// ============================================================================

/**
 * Options for customizing the OpenAPI preview render function
 * Extends React Testing Library render options with OpenAPI-specific configuration
 */
export interface OpenAPIPreviewRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  readonly queryClient?: QueryClient;
  readonly openApiConfig?: OpenAPIPreviewTestContextConfig;
  readonly mockRouterConfig?: Partial<typeof mockRouter>;
  readonly wrapper?: React.ComponentType<PropsWithChildren>;
  readonly skipProviders?: boolean;
}

/**
 * Enhanced render result with OpenAPI preview test utilities
 * Provides additional utilities specific to OpenAPI preview testing
 */
export interface OpenAPIPreviewRenderResult extends RenderResult {
  readonly queryClient: QueryClient;
  readonly mockRouter: typeof mockRouter;
  readonly updateApiKey: (apiKey: ApiKeyInfo) => void;
  readonly updateServiceInfo: (serviceInfo: ServiceInfo) => void;
  readonly updateOpenApiSpec: (spec: OpenAPISpecification) => void;
  readonly simulateApiCall: (callInfo: Partial<ApiCallInfo>) => ApiTestResult;
  readonly waitForSwaggerUI: () => Promise<void>;
  readonly getSwaggerUIElement: () => HTMLElement | null;
}

/**
 * Custom render function for OpenAPI preview components
 * Provides complete testing environment with all necessary providers and utilities
 */
export function renderOpenAPIPreview(
  ui: ReactElement,
  options: OpenAPIPreviewRenderOptions = {}
): OpenAPIPreviewRenderResult {
  const {
    queryClient,
    openApiConfig,
    mockRouterConfig,
    wrapper: CustomWrapper,
    skipProviders = false,
    ...renderOptions
  } = options;

  // Create test query client if not provided
  const testQueryClient = queryClient || createTestQueryClient();

  // Create wrapper component
  const Wrapper = ({ children }: PropsWithChildren) => {
    if (skipProviders) {
      return CustomWrapper ? <CustomWrapper>{children}</CustomWrapper> : <>{children}</>;
    }

    const content = (
      <TestWrapper
        queryClient={testQueryClient}
        openApiConfig={openApiConfig}
        mockRouterConfig={mockRouterConfig}
      >
        {children}
      </TestWrapper>
    );

    return CustomWrapper ? <CustomWrapper>{content}</CustomWrapper> : content;
  };

  // Render component with wrapper
  const renderResult = render(ui, {
    wrapper: Wrapper,
    ...renderOptions,
  });

  // Enhanced render result with OpenAPI-specific utilities
  return {
    ...renderResult,
    queryClient: testQueryClient,
    mockRouter,

    // Utility functions for updating test context
    updateApiKey: (apiKey: ApiKeyInfo) => {
      renderResult.rerender(
        <TestWrapper
          queryClient={testQueryClient}
          openApiConfig={{ ...openApiConfig, mockApiKey: apiKey }}
        >
          {ui}
        </TestWrapper>
      );
    },

    updateServiceInfo: (serviceInfo: ServiceInfo) => {
      renderResult.rerender(
        <TestWrapper
          queryClient={testQueryClient}
          openApiConfig={{ ...openApiConfig, mockServiceInfo: serviceInfo }}
        >
          {ui}
        </TestWrapper>
      );
    },

    updateOpenApiSpec: (spec: OpenAPISpecification) => {
      renderResult.rerender(
        <TestWrapper
          queryClient={testQueryClient}
          openApiConfig={{ ...openApiConfig, mockOpenAPISpec: spec }}
        >
          {ui}
        </TestWrapper>
      );
    },

    // Utility for simulating API calls in tests
    simulateApiCall: (callInfo: Partial<ApiCallInfo>): ApiTestResult => {
      const mockCall: ApiCallInfo = {
        id: 'test-call-' + Date.now(),
        timestamp: new Date().toISOString(),
        method: 'GET',
        url: 'http://localhost:3000/api/v2/test-service/test',
        headers: { 'Content-Type': 'application/json' },
        status: 'success',
        ...callInfo,
      };

      return createMockApiTestResult({
        request: mockCall,
        success: callInfo.status !== 'error',
      });
    },

    // Utility for waiting for SwaggerUI to load
    waitForSwaggerUI: async (): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 150)); // Wait for mock SwaggerUI
    },

    // Utility for getting SwaggerUI element
    getSwaggerUIElement: (): HTMLElement | null => {
      return renderResult.queryByTestId('swagger-ui');
    },
  };
}

/**
 * Simple render function for components that don't need full OpenAPI context
 * Provides minimal React Query setup for basic component testing
 */
export function renderWithQueryClient(
  ui: ReactElement,
  options: Omit<OpenAPIPreviewRenderOptions, 'openApiConfig'> = {}
): RenderResult {
  const { queryClient, wrapper: CustomWrapper, ...renderOptions } = options;
  const testQueryClient = queryClient || createTestQueryClient();

  const Wrapper = ({ children }: PropsWithChildren) => {
    const content = <MinimalTestWrapper queryClient={testQueryClient}>{children}</MinimalTestWrapper>;
    return CustomWrapper ? <CustomWrapper>{content}</CustomWrapper> : content;
  };

  return render(ui, {
    wrapper: Wrapper,
    ...renderOptions,
  });
}

// ============================================================================
// OpenAPI Preview State Management Utilities
// ============================================================================

/**
 * Utility for creating OpenAPI preview component props with sensible defaults
 * Simplifies test setup by providing realistic default props
 */
export function createOpenAPIPreviewProps(
  overrides: Partial<OpenAPIPreviewProps> = {}
): OpenAPIPreviewProps {
  const mockApiKey = createMockApiKey();
  const mockSpec = createMockOpenAPISpec();

  return {
    serviceName: 'test-service',
    openApiSpec: mockSpec,
    apiKey: mockApiKey.key,
    sessionToken: mockApiKey.sessionToken,
    baseUrl: 'http://localhost:3000/api/v2',
    theme: 'light',
    showTryItOut: true,
    showCodeSamples: true,
    enableAuth: true,
    autoLoadSpec: false, // Disable auto-loading in tests
    onSpecLoaded: vi.fn(),
    onApiCall: vi.fn(),
    onError: vi.fn(),
    onAuthSuccess: vi.fn(),
    onAuthFailure: vi.fn(),
    ...overrides,
  };
}

/**
 * Utility for creating SwaggerUI configuration for testing
 * Provides consistent SwaggerUI setup across OpenAPI preview tests
 */
export function createTestSwaggerUIConfig(
  overrides: Partial<SwaggerUIConfig> = {}
): SwaggerUIConfig {
  const mockSpec = createMockOpenAPISpec();

  return {
    spec: mockSpec,
    layout: 'BaseLayout',
    deepLinking: false, // Disable for testing
    displayOperationId: true,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    defaultModelRendering: 'example',
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: false,
    showCommonExtensions: false,
    tryItOutEnabled: true,
    persistAuthorization: false, // Disable for testing
    onComplete: vi.fn(),
    onFailure: vi.fn(),
    'x-dreamfactory-service': 'test-service',
    'x-dreamfactory-baseUrl': 'http://localhost:3000/api/v2',
    'x-dreamfactory-apiKey': 'test-api-key',
    ...overrides,
  };
}

// ============================================================================
// API Testing Simulation Utilities
// ============================================================================

/**
 * Configuration for simulating API interactions in tests
 * Defines parameters for realistic API call simulation
 */
export interface ApiInteractionSimulation {
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly endpoint: string;
  readonly requestBody?: any;
  readonly headers?: Record<string, string>;
  readonly responseStatus?: number;
  readonly responseBody?: any;
  readonly responseDelay?: number;
  readonly shouldFail?: boolean;
}

/**
 * Simulates API interaction within OpenAPI preview components
 * Provides realistic API call behavior for testing API documentation features
 */
export function simulateApiInteraction(
  simulation: ApiInteractionSimulation
): Promise<ApiTestResult> {
  const {
    method,
    endpoint,
    requestBody,
    headers = {},
    responseStatus = 200,
    responseBody = { success: true },
    responseDelay = 100,
    shouldFail = false,
  } = simulation;

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const callInfo: ApiCallInfo = {
        id: 'sim-' + Date.now(),
        timestamp: new Date().toISOString(),
        method,
        url: `http://localhost:3000/api/v2${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: requestBody,
        status: shouldFail ? 'error' : 'success',
      };

      if (shouldFail) {
        const error = new Error(`API call failed: ${method} ${endpoint}`);
        reject(error);
        return;
      }

      const result = createMockApiTestResult({
        success: true,
        duration: responseDelay,
        request: callInfo,
        response: {
          statusCode: responseStatus,
          statusText: responseStatus === 200 ? 'OK' : 'Error',
          headers: {
            'Content-Type': 'application/json',
            'X-DreamFactory-Request-Id': 'sim-req-' + Date.now(),
          },
          body: responseBody,
          size: JSON.stringify(responseBody).length,
          contentType: 'application/json',
        },
      });

      resolve(result);
    }, responseDelay);
  });
}

/**
 * Utility for testing OpenAPI specification rendering
 * Validates that the specification is properly processed and displayed
 */
export function validateOpenAPISpecRendering(
  spec: OpenAPISpecification,
  container: HTMLElement
): {
  hasSwaggerUI: boolean;
  hasOperations: boolean;
  operationCount: number;
  hasSchemas: boolean;
  hasSecuritySchemes: boolean;
} {
  const swaggerElement = container.querySelector('[data-testid="swagger-ui"]');
  
  // Count operations in the spec
  const operationCount = Object.values(spec.paths).reduce((count, pathItem) => {
    return count + Object.keys(pathItem).filter(key => 
      ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'].includes(key)
    ).length;
  }, 0);

  return {
    hasSwaggerUI: Boolean(swaggerElement),
    hasOperations: operationCount > 0,
    operationCount,
    hasSchemas: Boolean(spec.components?.schemas && Object.keys(spec.components.schemas).length > 0),
    hasSecuritySchemes: Boolean(spec.components?.securitySchemes && Object.keys(spec.components.securitySchemes).length > 0),
  };
}

// ============================================================================
// Export Configuration and Utilities
// ============================================================================

/**
 * Default configuration for OpenAPI preview testing
 * Provides standardized test setup across the test suite
 */
export const defaultOpenAPIPreviewTestConfig: Required<OpenAPIPreviewTestContextConfig> = {
  mockApiKey: createMockApiKey(),
  mockServiceInfo: createMockServiceInfo(),
  mockOpenAPISpec: createMockOpenAPISpec(),
  baseUrl: 'http://localhost:3000/api/v2',
  theme: 'light',
  enableAuth: true,
  showTryItOut: true,
  customConfig: {},
};

/**
 * Test utilities for common OpenAPI preview testing scenarios
 * Provides pre-configured utilities for frequent testing patterns
 */
export const openApiPreviewTestUtils = {
  // Render utilities
  render: renderOpenAPIPreview,
  renderWithQuery: renderWithQueryClient,
  
  // Mock factories
  createProps: createOpenAPIPreviewProps,
  createSwaggerConfig: createTestSwaggerUIConfig,
  createMockSpec: createMockOpenAPISpec,
  createMockApiKey,
  createMockService: createMockServiceInfo,
  
  // Simulation utilities
  simulateApi: simulateApiInteraction,
  validateSpec: validateOpenAPISpecRendering,
  
  // Test environment
  defaultConfig: defaultOpenAPIPreviewTestConfig,
  mockRouter,
  mockSwaggerUI,
} as const;

// Export all testing utilities and types
export * from './test-setup';
export type {
  TestWrapperProps,
  OpenAPIPreviewRenderOptions,
  OpenAPIPreviewRenderResult,
  OpenAPIPreviewTestContextConfig,
  ApiInteractionSimulation,
};

/**
 * Auto-setup for OpenAPI preview component testing
 * Ensures MSW server is properly configured when utilities are imported
 */
setupMockServer();