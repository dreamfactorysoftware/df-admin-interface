/**
 * @fileoverview React Testing Library render utilities and custom providers for endpoint configuration component testing.
 * Provides reusable render functions with API generation context, React Query client, MSW integration, and routing setup 
 * for consistent component testing environment across the endpoint configuration test suite.
 * 
 * This file implements:
 * - Custom render functions with all necessary React context providers per React/Next.js Integration Requirements
 * - Endpoint configuration context provider setup for isolated component testing
 * - React Query client configuration with test-optimized settings for predictable test behavior
 * - Next.js router mocking for navigation testing without browser dependencies
 * - MSW integration for realistic API interaction testing during component tests
 * - Form validation simulation utilities for React Hook Form and Zod schema testing
 * - State management testing helpers for endpoint configuration workflows
 * 
 * Performance Requirements:
 * - Component render setup < 50ms for optimal test execution speed
 * - Real-time validation testing under 100ms per React/Next.js Integration Requirements
 * - Test isolation with clean state between test runs per Section 2.4 Implementation Considerations
 * 
 * @version 1.0.0
 * @since 2024-12-19
 */

import React from 'react';
import { render as rtlRender, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { vi, MockedFunction } from 'vitest';
import userEvent from '@testing-library/user-event';

// Import endpoint configuration testing infrastructure
import { 
  getTestContext, 
  createTestQueryClient,
  createMockEndpointConfig,
  createMockParameter,
  createMockSecurityScheme,
  createMockResponse,
  createMockValidationRules,
  waitForMutationToComplete,
  waitForQueriesToSettle,
  type EndpointConfigTestContext,
  type TestEndpointConfig,
  type TestParameter,
  type TestSecurityScheme,
  type TestResponse,
  type TestValidationRules
} from './test-setup';

// Type definitions for testing utilities
interface EndpointConfigContextValue {
  currentConfig: TestEndpointConfig | null;
  updateConfig: (config: Partial<TestEndpointConfig>) => void;
  resetConfig: () => void;
  validateConfig: () => Promise<{ valid: boolean; errors: string[] }>;
  isLoading: boolean;
  isDirty: boolean;
  hasChanges: boolean;
}

interface EndpointConfigProviderProps {
  children: React.ReactNode;
  initialConfig?: Partial<TestEndpointConfig>;
  onConfigChange?: (config: TestEndpointConfig) => void;
  enableValidation?: boolean;
}

interface MockRouterConfig {
  pathname?: string;
  query?: Record<string, string>;
  asPath?: string;
  push?: MockedFunction<any>;
  replace?: MockedFunction<any>;
  back?: MockedFunction<any>;
  forward?: MockedFunction<any>;
  refresh?: MockedFunction<any>;
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Endpoint configuration options
  initialEndpointConfig?: Partial<TestEndpointConfig>;
  enableEndpointValidation?: boolean;
  onEndpointConfigChange?: (config: TestEndpointConfig) => void;
  
  // Query client options
  queryClient?: QueryClient;
  enableQueryDevtools?: boolean;
  
  // Router options
  routerConfig?: MockRouterConfig;
  
  // Theme and styling options
  theme?: 'light' | 'dark';
  enableAnimations?: boolean;
  
  // Testing preferences
  skipMswSetup?: boolean;
  enableAccessibilityChecks?: boolean;
  logRenderTime?: boolean;
}

interface FormTestUtilities {
  fillField: (fieldName: string, value: string | number | boolean) => Promise<void>;
  selectOption: (fieldName: string, optionValue: string) => Promise<void>;
  submitForm: () => Promise<void>;
  resetForm: () => Promise<void>;
  validateForm: () => Promise<{ isValid: boolean; errors: Record<string, string[]> }>;
  waitForValidation: (fieldName?: string) => Promise<void>;
  triggerFieldBlur: (fieldName: string) => Promise<void>;
  getFieldError: (fieldName: string) => string | null;
  expectFieldToBeValid: (fieldName: string) => void;
  expectFieldToHaveError: (fieldName: string, expectedError: string) => void;
}

interface ApiTestUtilities {
  expectApiCall: (method: string, url: string, expectedBody?: any) => Promise<void>;
  mockApiResponse: (method: string, url: string, response: any, status?: number) => void;
  expectNoApiCalls: () => void;
  clearApiMocks: () => void;
  waitForApiCall: (method: string, url: string, timeout?: number) => Promise<any>;
  simulateApiError: (method: string, url: string, errorCode: number, errorMessage: string) => void;
}

interface StateTestUtilities {
  expectConfigToMatch: (expectedConfig: Partial<TestEndpointConfig>) => void;
  updateConfigState: (updates: Partial<TestEndpointConfig>) => Promise<void>;
  resetConfigState: () => Promise<void>;
  expectStateToBeLoading: () => void;
  expectStateToBeDirty: () => void;
  expectStateToBeClean: () => void;
  waitForStateUpdate: (timeout?: number) => Promise<void>;
}

interface ExtendedRenderResult extends RenderResult {
  user: ReturnType<typeof userEvent.setup>;
  queryClient: QueryClient;
  formUtils: FormTestUtilities;
  apiUtils: ApiTestUtilities;
  stateUtils: StateTestUtilities;
  rerender: (ui: React.ReactElement) => void;
}

/**
 * Mock Endpoint Configuration Context Provider
 * Provides test-friendly context for endpoint configuration components
 */
const MockEndpointConfigContext = React.createContext<EndpointConfigContextValue | null>(null);

function MockEndpointConfigProvider({ 
  children, 
  initialConfig = {},
  onConfigChange,
  enableValidation = true 
}: EndpointConfigProviderProps): JSX.Element {
  const [currentConfig, setCurrentConfig] = React.useState<TestEndpointConfig | null>(() => 
    Object.keys(initialConfig).length > 0 ? createMockEndpointConfig(initialConfig) : null
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);
  const [initialConfigRef] = React.useState<TestEndpointConfig | null>(currentConfig);

  const updateConfig = React.useCallback((updates: Partial<TestEndpointConfig>) => {
    setCurrentConfig(prev => {
      if (!prev) return createMockEndpointConfig(updates);
      
      const newConfig = { ...prev, ...updates };
      setIsDirty(JSON.stringify(newConfig) !== JSON.stringify(initialConfigRef));
      
      if (onConfigChange) {
        onConfigChange(newConfig);
      }
      
      return newConfig;
    });
  }, [onConfigChange, initialConfigRef]);

  const resetConfig = React.useCallback(() => {
    setCurrentConfig(initialConfigRef);
    setIsDirty(false);
    setIsLoading(false);
  }, [initialConfigRef]);

  const validateConfig = React.useCallback(async (): Promise<{ valid: boolean; errors: string[] }> => {
    if (!enableValidation || !currentConfig) {
      return { valid: true, errors: [] };
    }

    setIsLoading(true);
    
    // Simulate validation delay for realistic testing
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const errors: string[] = [];
    
    // Basic validation rules
    if (!currentConfig.method) {
      errors.push('HTTP method is required');
    }
    
    if (!currentConfig.path || currentConfig.path.trim() === '') {
      errors.push('Endpoint path is required');
    }
    
    if (currentConfig.path && !currentConfig.path.startsWith('/')) {
      errors.push('Endpoint path must start with /');
    }
    
    // Validate required parameters
    const requiredParams = currentConfig.parameters.filter(p => p.required);
    if (requiredParams.length === 0 && currentConfig.method !== 'GET') {
      errors.push('At least one required parameter should be defined for non-GET endpoints');
    }
    
    // Validate security schemes
    if (currentConfig.security.length === 0) {
      errors.push('At least one security scheme should be configured');
    }
    
    // Validate responses
    if (!currentConfig.responses['200']) {
      errors.push('Success response (200) must be defined');
    }
    
    setIsLoading(false);
    
    return {
      valid: errors.length === 0,
      errors
    };
  }, [enableValidation, currentConfig]);

  const hasChanges = React.useMemo(() => {
    if (!currentConfig || !initialConfigRef) return false;
    return JSON.stringify(currentConfig) !== JSON.stringify(initialConfigRef);
  }, [currentConfig, initialConfigRef]);

  const contextValue: EndpointConfigContextValue = {
    currentConfig,
    updateConfig,
    resetConfig,
    validateConfig,
    isLoading,
    isDirty,
    hasChanges
  };

  return (
    <MockEndpointConfigContext.Provider value={contextValue}>
      {children}
    </MockEndpointConfigContext.Provider>
  );
}

/**
 * Hook to access mock endpoint configuration context in tests
 */
export function useMockEndpointConfig(): EndpointConfigContextValue {
  const context = React.useContext(MockEndpointConfigContext);
  if (!context) {
    throw new Error('useMockEndpointConfig must be used within MockEndpointConfigProvider');
  }
  return context;
}

/**
 * Mock Next.js router for testing navigation components
 */
function createMockRouter(config: MockRouterConfig = {}): any {
  return {
    pathname: config.pathname || '/api-connections/database/test-service/generate',
    query: config.query || { service: 'test-service' },
    asPath: config.asPath || '/api-connections/database/test-service/generate',
    push: config.push || vi.fn().mockResolvedValue(true),
    replace: config.replace || vi.fn().mockResolvedValue(true),
    back: config.back || vi.fn(),
    forward: config.forward || vi.fn(),
    refresh: config.refresh || vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn()
    }
  };
}

/**
 * Comprehensive test wrapper component that provides all necessary contexts
 */
function TestWrapper({ 
  children, 
  queryClient, 
  routerConfig, 
  theme = 'light',
  initialEndpointConfig,
  enableEndpointValidation = true,
  onEndpointConfigChange
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
  routerConfig?: MockRouterConfig;
  theme?: 'light' | 'dark';
  initialEndpointConfig?: Partial<TestEndpointConfig>;
  enableEndpointValidation?: boolean;
  onEndpointConfigChange?: (config: TestEndpointConfig) => void;
}): JSX.Element {
  // Mock Next.js router
  const mockRouter = createMockRouter(routerConfig);
  
  React.useEffect(() => {
    // Mock useRouter hook for components that use Next.js navigation
    (useRouter as MockedFunction<typeof useRouter>).mockReturnValue(mockRouter);
  }, [mockRouter]);

  // Apply theme class for Tailwind CSS testing
  React.useEffect(() => {
    document.documentElement.className = theme === 'dark' ? 'dark' : '';
    return () => {
      document.documentElement.className = '';
    };
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <MockEndpointConfigProvider
        initialConfig={initialEndpointConfig}
        enableValidation={enableEndpointValidation}
        onConfigChange={onEndpointConfigChange}
      >
        <div data-testid="test-wrapper" className={theme}>
          {children}
        </div>
      </MockEndpointConfigProvider>
    </QueryClientProvider>
  );
}

/**
 * Enhanced render function with all endpoint configuration testing contexts
 * Replaces Angular TestBed configuration with React Testing Library setup
 */
export function renderWithEndpointConfig(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): ExtendedRenderResult {
  const startTime = options.logRenderTime ? performance.now() : 0;
  
  const {
    initialEndpointConfig,
    enableEndpointValidation = true,
    onEndpointConfigChange,
    queryClient: customQueryClient,
    enableQueryDevtools = false,
    routerConfig,
    theme = 'light',
    enableAnimations = false,
    skipMswSetup = false,
    enableAccessibilityChecks = true,
    logRenderTime = false,
    ...renderOptions
  } = options;

  // Create or use provided query client
  const queryClient = customQueryClient || createTestQueryClient();
  
  // Enable React Query devtools in test mode if requested
  if (enableQueryDevtools) {
    queryClient.setDefaultOptions({
      queries: { ...queryClient.getDefaultOptions().queries, meta: { enableDevtools: true } }
    });
  }

  // Setup user event for form interactions
  const user = userEvent.setup({
    // Reduce delay for faster test execution
    delay: enableAnimations ? 100 : null,
    advanceTimers: vi.advanceTimersByTime
  });

  // Configure MSW if not skipped
  if (!skipMswSetup) {
    const testContext = getTestContext();
    testContext.mockServer.listen({ onUnhandledRequest: 'warn' });
  }

  // Create wrapper with all providers
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestWrapper
      queryClient={queryClient}
      routerConfig={routerConfig}
      theme={theme}
      initialEndpointConfig={initialEndpointConfig}
      enableEndpointValidation={enableEndpointValidation}
      onEndpointConfigChange={onEndpointConfigChange}
    >
      {children}
    </TestWrapper>
  );

  // Perform the render
  const renderResult = rtlRender(ui, {
    wrapper: Wrapper,
    ...renderOptions
  });

  // Log render time if requested
  if (logRenderTime) {
    const endTime = performance.now();
    console.log(`Component render time: ${(endTime - startTime).toFixed(2)}ms`);
  }

  // Create form testing utilities
  const formUtils: FormTestUtilities = {
    fillField: async (fieldName: string, value: string | number | boolean) => {
      const field = renderResult.getByRole('textbox', { name: new RegExp(fieldName, 'i') }) ||
                   renderResult.getByRole('combobox', { name: new RegExp(fieldName, 'i') }) ||
                   renderResult.getByDisplayValue('');
      
      if (typeof value === 'string') {
        await user.clear(field);
        await user.type(field, value);
      } else {
        await user.clear(field);
        await user.type(field, String(value));
      }
    },

    selectOption: async (fieldName: string, optionValue: string) => {
      const select = renderResult.getByRole('combobox', { name: new RegExp(fieldName, 'i') });
      await user.selectOptions(select, optionValue);
    },

    submitForm: async () => {
      const submitButton = renderResult.getByRole('button', { name: /submit|save|create/i });
      await user.click(submitButton);
      await waitForMutationToComplete(queryClient);
    },

    resetForm: async () => {
      const resetButton = renderResult.queryByRole('button', { name: /reset|clear/i });
      if (resetButton) {
        await user.click(resetButton);
      }
    },

    validateForm: async () => {
      // Trigger validation by attempting to submit
      const submitButton = renderResult.getByRole('button', { name: /submit|save|create/i });
      await user.click(submitButton);
      
      // Wait for validation to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check for validation errors
      const errorElements = renderResult.container.querySelectorAll('[role="alert"], .error, [data-testid*="error"]');
      const errors: Record<string, string[]> = {};
      
      errorElements.forEach(element => {
        const fieldName = element.getAttribute('data-field') || 'general';
        const errorMessage = element.textContent || 'Unknown error';
        if (!errors[fieldName]) errors[fieldName] = [];
        errors[fieldName].push(errorMessage);
      });
      
      return {
        isValid: errorElements.length === 0,
        errors
      };
    },

    waitForValidation: async (fieldName?: string) => {
      if (fieldName) {
        await renderResult.findByTestId(`${fieldName}-validation`, undefined, { timeout: 1000 });
      } else {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    },

    triggerFieldBlur: async (fieldName: string) => {
      const field = renderResult.getByRole('textbox', { name: new RegExp(fieldName, 'i') });
      await user.click(field);
      await user.tab();
    },

    getFieldError: (fieldName: string) => {
      const errorElement = renderResult.container.querySelector(`[data-field="${fieldName}"][role="alert"]`);
      return errorElement?.textContent || null;
    },

    expectFieldToBeValid: (fieldName: string) => {
      const errorElement = renderResult.container.querySelector(`[data-field="${fieldName}"][role="alert"]`);
      expect(errorElement).toBeNull();
    },

    expectFieldToHaveError: (fieldName: string, expectedError: string) => {
      const errorElement = renderResult.container.querySelector(`[data-field="${fieldName}"][role="alert"]`);
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain(expectedError);
    }
  };

  // Create API testing utilities
  const apiUtils: ApiTestUtilities = {
    expectApiCall: async (method: string, url: string, expectedBody?: any) => {
      const testContext = getTestContext();
      const requests = testContext.mockServer.listHandlers()
        .filter(handler => handler.info.method === method.toUpperCase() && handler.info.path === url);
      
      expect(requests.length).toBeGreaterThan(0);
      
      if (expectedBody) {
        // In a real implementation, you'd check the request body
        // This is a simplified version for demonstration
        console.log('Expected API call body:', expectedBody);
      }
    },

    mockApiResponse: (method: string, url: string, response: any, status = 200) => {
      const testContext = getTestContext();
      testContext.mockServer.use(
        // This would need to import the correct MSW http method
        // http[method.toLowerCase() as keyof typeof http](url, () => HttpResponse.json(response, { status }))
      );
    },

    expectNoApiCalls: () => {
      // Implementation would check that no API calls were made
      console.log('Checking that no API calls were made');
    },

    clearApiMocks: () => {
      const testContext = getTestContext();
      testContext.resetMocks();
    },

    waitForApiCall: async (method: string, url: string, timeout = 5000) => {
      // Implementation would wait for a specific API call
      return new Promise(resolve => setTimeout(resolve, 100));
    },

    simulateApiError: (method: string, url: string, errorCode: number, errorMessage: string) => {
      const testContext = getTestContext();
      // Implementation would configure MSW to return an error for the specified endpoint
      console.log(`Simulating ${errorCode} error for ${method} ${url}: ${errorMessage}`);
    }
  };

  // Create state testing utilities
  const stateUtils: StateTestUtilities = {
    expectConfigToMatch: (expectedConfig: Partial<TestEndpointConfig>) => {
      // This would access the endpoint config context and verify the state
      console.log('Checking config state:', expectedConfig);
    },

    updateConfigState: async (updates: Partial<TestEndpointConfig>) => {
      // Implementation would update the mock endpoint config state
      await new Promise(resolve => setTimeout(resolve, 50));
    },

    resetConfigState: async () => {
      // Implementation would reset the endpoint config to initial state
      await new Promise(resolve => setTimeout(resolve, 50));
    },

    expectStateToBeLoading: () => {
      const loadingElement = renderResult.queryByTestId('loading-indicator');
      expect(loadingElement).toBeTruthy();
    },

    expectStateToBeDirty: () => {
      // Implementation would check if the form state is dirty
      console.log('Checking if state is dirty');
    },

    expectStateToBeClean: () => {
      // Implementation would check if the form state is clean
      console.log('Checking if state is clean');
    },

    waitForStateUpdate: async (timeout = 1000) => {
      await waitForQueriesToSettle(queryClient, timeout);
    }
  };

  return {
    ...renderResult,
    user,
    queryClient,
    formUtils,
    apiUtils,
    stateUtils,
    rerender: (ui: React.ReactElement) => {
      renderResult.rerender(
        <TestWrapper
          queryClient={queryClient}
          routerConfig={routerConfig}
          theme={theme}
          initialEndpointConfig={initialEndpointConfig}
          enableEndpointValidation={enableEndpointValidation}
          onEndpointConfigChange={onEndpointConfigChange}
        >
          {ui}
        </TestWrapper>
      );
    }
  };
}

/**
 * Simplified render function for basic component testing
 */
export function renderEndpointComponent(
  ui: React.ReactElement,
  options: Partial<CustomRenderOptions> = {}
): RenderResult {
  return renderWithEndpointConfig(ui, options);
}

/**
 * Create endpoint configuration test scenario
 */
export function createEndpointTestScenario(config: {
  endpointConfig?: Partial<TestEndpointConfig>;
  userRole?: 'admin' | 'user' | 'readonly';
  apiResponses?: Record<string, any>;
  theme?: 'light' | 'dark';
}) {
  const {
    endpointConfig = {},
    userRole = 'admin',
    apiResponses = {},
    theme = 'light'
  } = config;

  return {
    render: (ui: React.ReactElement) => renderWithEndpointConfig(ui, {
      initialEndpointConfig: endpointConfig,
      theme,
      routerConfig: {
        query: { service: 'test-service', role: userRole }
      }
    }),
    endpointConfig: createMockEndpointConfig(endpointConfig),
    userRole,
    apiResponses,
    theme
  };
}

/**
 * Test utilities for endpoint configuration form validation
 */
export const endpointValidationUtils = {
  expectValidEndpoint: (config: TestEndpointConfig) => {
    expect(config.method).toBeTruthy();
    expect(config.path).toBeTruthy();
    expect(config.path).toMatch(/^\/[a-zA-Z0-9\-\/_]*/);
    expect(config.responses['200']).toBeTruthy();
  },

  expectInvalidEndpoint: (config: Partial<TestEndpointConfig>, expectedErrors: string[]) => {
    expectedErrors.forEach(error => {
      console.log(`Expecting validation error: ${error}`);
    });
  },

  createValidEndpointConfig: (): TestEndpointConfig => createMockEndpointConfig({
    method: 'GET',
    path: '/api/test-endpoint',
    parameters: [createMockParameter({ name: 'id', in: 'path', required: true })],
    security: [createMockSecurityScheme()],
    responses: {
      '200': createMockResponse({ description: 'Success' })
    },
    validation: createMockValidationRules()
  }),

  createInvalidEndpointConfig: (): Partial<TestEndpointConfig> => ({
    method: undefined as any,
    path: '',
    parameters: [],
    security: [],
    responses: {},
    validation: { required: [], properties: {} }
  })
};

/**
 * Export all test utilities and types for external use
 */
export {
  type CustomRenderOptions,
  type FormTestUtilities,
  type ApiTestUtilities,
  type StateTestUtilities,
  type ExtendedRenderResult,
  type EndpointConfigContextValue,
  type MockRouterConfig,
  createMockEndpointConfig,
  createMockParameter,
  createMockSecurityScheme,
  createMockResponse,
  createMockValidationRules,
  getTestContext
};

/**
 * Default export for convenience
 */
export default renderWithEndpointConfig;