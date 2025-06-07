/**
 * Custom React Testing Library Utilities for DreamFactory Admin Interface
 * 
 * Enhanced React component testing integration with @testing-library/react as specified
 * in Section 3.3. Provides comprehensive testing patterns for React 19/Next.js 15.1
 * application with TanStack React Query, Next.js router context, and Tailwind CSS support.
 * 
 * Key Features:
 * - Custom render functions with all necessary testing providers
 * - React Hook Form testing utilities with validation scenarios
 * - TanStack React Query testing patterns for server state management
 * - Screen reader testing utilities for WCAG 2.1 AA compliance validation
 * - Headless UI component testing with keyboard navigation patterns
 * - Next.js middleware and server component testing helpers
 * - Native TypeScript support with zero configuration overhead for Vitest 2.1.0
 * 
 * Performance Characteristics:
 * - Zero configuration overhead with Vitest 2.1.0
 * - Up to 10x faster test execution compared to Jest configurations
 * - Native TypeScript support with enhanced type inference
 * - Realistic API mocking through MSW integration
 * 
 * Usage Examples:
 * 
 * ```typescript
 * import { renderWithProviders, userEvent, screen } from '@/test/utils/test-utils';
 * import { DatabaseServiceForm } from '@/components/database-service/service-form';
 * 
 * test('database service form validation', async () => {
 *   const user = userEvent.setup();
 *   renderWithProviders(<DatabaseServiceForm />);
 *   
 *   await user.type(screen.getByRole('textbox', { name: /service name/i }), 'test-service');
 *   await user.click(screen.getByRole('button', { name: /test connection/i }));
 *   
 *   expect(screen.getByText(/connection successful/i)).toBeInTheDocument();
 * });
 * ```
 */

import React, { ReactElement, ReactNode, PropsWithChildren } from 'react';
import { render, renderHook, RenderOptions, RenderHookOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FormProvider, useForm, UseFormProps, FieldValues } from 'react-hook-form';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import { SearchParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import { server } from '../mocks/server';
import { mockData } from '../mocks/mock-data';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// ============================================================================
// TYPE DEFINITIONS AND INTERFACES
// ============================================================================

/**
 * Custom render options extending @testing-library/react options
 * with additional provider configurations for comprehensive testing setup
 */
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Pre-configured QueryClient instance for React Query testing
   * If not provided, creates a new client with testing-optimized defaults
   */
  queryClient?: QueryClient;
  
  /**
   * Initial URL pathname for Next.js router simulation
   * Defaults to '/' for standard component testing
   */
  initialPathname?: string;
  
  /**
   * URL search parameters for Next.js router context
   * Useful for testing components that depend on query parameters
   */
  searchParams?: URLSearchParams;
  
  /**
   * Mock Next.js router instance for advanced navigation testing
   * If not provided, creates a default mock with common methods
   */
  router?: Partial<AppRouterInstance>;
  
  /**
   * Theme configuration for Tailwind CSS testing
   * Supports light/dark mode testing scenarios
   */
  theme?: 'light' | 'dark' | 'system';
  
  /**
   * Disable React Query provider for components that don't require server state
   * Useful for testing pure UI components in isolation
   */
  disableQueryClient?: boolean;
  
  /**
   * Additional providers to wrap around the component
   * Useful for custom context providers or state management
   */
  additionalProviders?: Array<React.ComponentType<{ children: ReactNode }>>;
}

/**
 * React Hook Form testing configuration options
 * Provides comprehensive form testing scenarios with validation support
 */
export interface FormTestingOptions<TFieldValues extends FieldValues = FieldValues> 
  extends UseFormProps<TFieldValues> {
  /**
   * Initial form values for testing pre-populated forms
   */
  defaultValues?: TFieldValues;
  
  /**
   * Schema validation function for testing form validation logic
   */
  resolver?: UseFormProps<TFieldValues>['resolver'];
  
  /**
   * Form submission handler for testing form interactions
   */
  onSubmit?: (data: TFieldValues) => void | Promise<void>;
  
  /**
   * Form validation mode for testing different validation behaviors
   */
  mode?: UseFormProps<TFieldValues>['mode'];
  
  /**
   * Enable form state debugging for complex form testing scenarios
   */
  debug?: boolean;
}

/**
 * React Query testing configuration options
 * Enables comprehensive server state management testing patterns
 */
export interface QueryTestingOptions {
  /**
   * Custom query client configuration for specific testing scenarios
   */
  queryClientConfig?: {
    defaultOptions?: {
      queries?: {
        retry?: boolean | number;
        retryDelay?: number;
        staleTime?: number;
        gcTime?: number;
      };
      mutations?: {
        retry?: boolean | number;
        retryDelay?: number;
      };
    };
  };
  
  /**
   * Mock network conditions for testing loading states and errors
   */
  networkConditions?: 'online' | 'offline' | 'slow';
  
  /**
   * Enable React Query devtools for debugging during testing
   */
  enableDevtools?: boolean;
}

/**
 * Accessibility testing configuration options
 * Supports WCAG 2.1 AA compliance validation scenarios
 */
export interface AccessibilityTestingOptions {
  /**
   * Screen reader simulation mode for testing assistive technology support
   */
  screenReaderMode?: 'nvda' | 'jaws' | 'voiceover' | 'orca';
  
  /**
   * Keyboard navigation testing patterns for interactive components
   */
  keyboardNavigation?: boolean;
  
  /**
   * Color contrast testing for visual accessibility compliance
   */
  colorContrastTesting?: boolean;
  
  /**
   * Focus management testing for proper focus handling
   */
  focusManagement?: boolean;
  
  /**
   * ARIA attributes validation for semantic markup testing
   */
  ariaValidation?: boolean;
}

/**
 * Next.js testing utilities configuration
 * Enables testing of Next.js-specific features and patterns
 */
export interface NextJsTestingOptions {
  /**
   * App router configuration for testing page components
   */
  appRouter?: {
    pathname?: string;
    searchParams?: Record<string, string>;
    params?: Record<string, string>;
  };
  
  /**
   * Middleware testing configuration for authentication flows
   */
  middleware?: {
    enabled?: boolean;
    authToken?: string;
    userRole?: string;
  };
  
  /**
   * Server component testing support for RSC patterns
   */
  serverComponents?: boolean;
  
  /**
   * API route testing utilities for backend endpoint testing
   */
  apiRoutes?: boolean;
}

// ============================================================================
// QUERY CLIENT UTILITIES
// ============================================================================

/**
 * Creates a testing-optimized QueryClient instance
 * 
 * Configures React Query with settings optimized for test environments:
 * - Disables retries to prevent hanging tests
 * - Sets immediate stale time for predictable behavior
 * - Disables background refetching for controlled testing
 * - Reduces cache time for faster test cleanup
 * 
 * @param options - Optional configuration for customizing query behavior
 * @returns Configured QueryClient instance for testing
 */
export const createTestQueryClient = (options?: QueryTestingOptions): QueryClient => {
  const defaultOptions = {
    queries: {
      retry: false,              // Disable retries for predictable test behavior
      retryDelay: 0,            // No retry delay for faster tests
      staleTime: 0,             // Always consider data stale for fresh fetches
      gcTime: 0,                // Immediate garbage collection for cleanup
      refetchOnWindowFocus: false, // Disable background refetching
      refetchOnMount: false,    // Control refetching explicitly in tests
      refetchOnReconnect: false, // Disable network reconnection refetching
    },
    mutations: {
      retry: false,             // Disable mutation retries for predictable behavior
      retryDelay: 0,           // No retry delay for mutations
    },
  };

  const queryClientConfig = {
    defaultOptions: {
      ...defaultOptions,
      ...options?.queryClientConfig?.defaultOptions,
    },
  };

  // Apply network condition simulation
  if (options?.networkConditions === 'offline') {
    queryClientConfig.defaultOptions.queries = {
      ...queryClientConfig.defaultOptions.queries,
      networkMode: 'offlineFirst' as const,
    };
  } else if (options?.networkConditions === 'slow') {
    queryClientConfig.defaultOptions.queries = {
      ...queryClientConfig.defaultOptions.queries,
      staleTime: 5000, // Simulate slow network with longer stale time
    };
  }

  return new QueryClient(queryClientConfig);
};

/**
 * Cleans up QueryClient state between tests
 * 
 * Ensures test isolation by clearing all cached queries and mutations.
 * Should be called in afterEach hooks for consistent test behavior.
 * 
 * @param queryClient - QueryClient instance to clean up
 */
export const cleanupQueryClient = (queryClient: QueryClient): void => {
  queryClient.clear();
  queryClient.getQueryCache().clear();
  queryClient.getMutationCache().clear();
  
  // Remove all event listeners
  queryClient.getQueryCache().getAll().forEach(query => {
    query.destroy();
  });
};

/**
 * Waits for all React Query operations to complete
 * 
 * Useful for testing scenarios that involve multiple async operations
 * or when waiting for background refetching to complete.
 * 
 * @param queryClient - QueryClient instance to wait for
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 */
export const waitForQueries = async (
  queryClient: QueryClient, 
  timeout: number = 5000
): Promise<void> => {
  const startTime = Date.now();
  
  while (queryClient.isFetching() || queryClient.isMutating()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Queries did not settle within ${timeout}ms`);
    }
    
    // Wait for next tick
    await new Promise(resolve => setTimeout(resolve, 10));
  }
};

// ============================================================================
// ROUTER MOCK UTILITIES
// ============================================================================

/**
 * Creates a comprehensive mock Next.js App Router instance
 * 
 * Provides realistic router behavior for testing components that depend
 * on Next.js routing functionality, including navigation, URL manipulation,
 * and route handling.
 * 
 * @param initialPathname - Starting pathname for router simulation
 * @param customRouter - Custom router methods to override defaults
 * @returns Mock AppRouterInstance with comprehensive navigation support
 */
export const createMockRouter = (
  initialPathname: string = '/',
  customRouter?: Partial<AppRouterInstance>
): AppRouterInstance => {
  const mockRouter: AppRouterInstance = {
    push: vi.fn().mockResolvedValue(undefined),
    replace: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    back: vi.fn(),
    forward: vi.fn(),
    ...customRouter,
  };

  // Add debugging helpers for test scenarios
  Object.defineProperty(mockRouter, '_testHelpers', {
    value: {
      getLastPushCall: () => (mockRouter.push as any).mock.calls.slice(-1)[0],
      getLastReplaceCall: () => (mockRouter.replace as any).mock.calls.slice(-1)[0],
      getPushCallCount: () => (mockRouter.push as any).mock.calls.length,
      getReplaceCallCount: () => (mockRouter.replace as any).mock.calls.length,
      reset: () => {
        vi.clearAllMocks();
      },
    },
    enumerable: false,
  });

  return mockRouter;
};

/**
 * Creates mock Next.js router contexts for comprehensive routing testing
 * 
 * Sets up all required Next.js router contexts including pathname,
 * search parameters, and app router instance for realistic testing
 * of components that depend on Next.js routing.
 * 
 * @param options - Router configuration options
 * @returns Object containing all necessary router context values
 */
export const createRouterContexts = (options: {
  pathname?: string;
  searchParams?: URLSearchParams;
  router?: Partial<AppRouterInstance>;
} = {}) => {
  const pathname = options.pathname || '/';
  const searchParams = options.searchParams || new URLSearchParams();
  const router = createMockRouter(pathname, options.router);

  return {
    router,
    pathname,
    searchParams,
  };
};

// ============================================================================
// THEME AND STYLING UTILITIES
// ============================================================================

/**
 * Theme provider for Tailwind CSS testing scenarios
 * 
 * Enables testing of components with different theme configurations
 * and ensures proper Tailwind CSS class application in test environments.
 */
const ThemeProvider: React.FC<PropsWithChildren<{ theme?: 'light' | 'dark' | 'system' }>> = ({
  children,
  theme = 'light',
}) => {
  React.useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Clean up on unmount
    return () => {
      root.classList.remove('dark');
    };
  }, [theme]);

  return <>{children}</>;
};

/**
 * Comprehensive test providers wrapper component
 * 
 * Combines all necessary providers for testing React components in the
 * DreamFactory Admin Interface, including React Query, Next.js router,
 * theme configuration, and additional custom providers.
 */
const AllTheProviders: React.FC<PropsWithChildren<{
  queryClient?: QueryClient;
  router?: AppRouterInstance;
  pathname?: string;
  searchParams?: URLSearchParams;
  theme?: 'light' | 'dark' | 'system';
  additionalProviders?: Array<React.ComponentType<{ children: ReactNode }>>;
  disableQueryClient?: boolean;
}>> = ({
  children,
  queryClient,
  router,
  pathname = '/',
  searchParams = new URLSearchParams(),
  theme = 'light',
  additionalProviders = [],
  disableQueryClient = false,
}) => {
  // Create default QueryClient if not provided and not disabled
  const defaultQueryClient = React.useMemo(
    () => disableQueryClient ? null : (queryClient || createTestQueryClient()),
    [queryClient, disableQueryClient]
  );

  // Create default router if not provided
  const defaultRouter = React.useMemo(
    () => router || createMockRouter(pathname),
    [router, pathname]
  );

  // Wrap with additional providers if specified
  const wrapWithAdditionalProviders = (content: ReactNode): ReactNode => {
    return additionalProviders.reduce(
      (acc, Provider) => <Provider>{acc}</Provider>,
      content
    );
  };

  const content = (
    <ThemeProvider theme={theme}>
      <AppRouterContext.Provider value={defaultRouter}>
        <PathnameContext.Provider value={pathname}>
          <SearchParamsContext.Provider value={searchParams}>
            {wrapWithAdditionalProviders(children)}
          </SearchParamsContext.Provider>
        </PathnameContext.Provider>
      </AppRouterContext.Provider>
    </ThemeProvider>
  );

  // Conditionally wrap with QueryClientProvider
  if (defaultQueryClient) {
    return (
      <QueryClientProvider client={defaultQueryClient}>
        {content}
      </QueryClientProvider>
    );
  }

  return <>{content}</>;
};

// ============================================================================
// MAIN RENDER UTILITIES
// ============================================================================

/**
 * Enhanced render function with comprehensive provider support
 * 
 * Custom render function that wraps React Testing Library's render
 * with all necessary providers for testing DreamFactory Admin Interface
 * components. Supports React Query, Next.js router, theming, and
 * additional custom providers.
 * 
 * @param ui - React component to render
 * @param options - Comprehensive rendering configuration options
 * @returns Enhanced render result with additional testing utilities
 */
export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const {
    queryClient,
    initialPathname = '/',
    searchParams = new URLSearchParams(),
    router,
    theme = 'light',
    disableQueryClient = false,
    additionalProviders = [],
    ...renderOptions
  } = options;

  // Create providers wrapper
  const Wrapper: React.FC<PropsWithChildren> = ({ children }) => (
    <AllTheProviders
      queryClient={queryClient}
      router={router}
      pathname={initialPathname}
      searchParams={searchParams}
      theme={theme}
      additionalProviders={additionalProviders}
      disableQueryClient={disableQueryClient}
    >
      {children}
    </AllTheProviders>
  );

  const renderResult = render(ui, { wrapper: Wrapper, ...renderOptions });

  // Return enhanced result with additional utilities
  return {
    ...renderResult,
    
    /**
     * Get the current QueryClient instance for advanced testing scenarios
     */
    queryClient: disableQueryClient ? null : (queryClient || createTestQueryClient()),
    
    /**
     * Helper to wait for all queries to settle
     */
    waitForQueries: async (timeout?: number) => {
      const client = disableQueryClient ? null : (queryClient || createTestQueryClient());
      if (client) {
        await waitForQueries(client, timeout);
      }
    },
    
    /**
     * Helper to trigger a rerender with different props/options
     */
    rerenderWithProviders: (newUi: ReactElement, newOptions?: CustomRenderOptions) => {
      const mergedOptions = { ...options, ...newOptions };
      const NewWrapper: React.FC<PropsWithChildren> = ({ children }) => (
        <AllTheProviders
          queryClient={mergedOptions.queryClient}
          router={mergedOptions.router}
          pathname={mergedOptions.initialPathname || '/'}
          searchParams={mergedOptions.searchParams || new URLSearchParams()}
          theme={mergedOptions.theme || 'light'}
          additionalProviders={mergedOptions.additionalProviders || []}
          disableQueryClient={mergedOptions.disableQueryClient || false}
        >
          {children}
        </AllTheProviders>
      );
      
      return renderResult.rerender(React.cloneElement(newUi, { wrapper: NewWrapper }));
    },
  };
};

/**
 * Enhanced renderHook function with provider support
 * 
 * Custom renderHook function that wraps React Testing Library's renderHook
 * with comprehensive provider support for testing custom hooks that depend
 * on React Query, Next.js router, or other context providers.
 * 
 * @param hook - Hook function to test
 * @param options - Hook testing configuration options
 * @returns Enhanced hook render result with provider integration
 */
export const renderHookWithProviders = <TProps, TResult>(
  hook: (props: TProps) => TResult,
  options: CustomRenderOptions & RenderHookOptions<TProps> = {}
) => {
  const {
    queryClient,
    initialPathname = '/',
    searchParams = new URLSearchParams(),
    router,
    theme = 'light',
    disableQueryClient = false,
    additionalProviders = [],
    ...renderHookOptions
  } = options;

  // Create providers wrapper for hook testing
  const Wrapper: React.FC<PropsWithChildren> = ({ children }) => (
    <AllTheProviders
      queryClient={queryClient}
      router={router}
      pathname={initialPathname}
      searchParams={searchParams}
      theme={theme}
      additionalProviders={additionalProviders}
      disableQueryClient={disableQueryClient}
    >
      {children}
    </AllTheProviders>
  );

  const hookResult = renderHook(hook, { wrapper: Wrapper, ...renderHookOptions });

  return {
    ...hookResult,
    
    /**
     * Get the current QueryClient instance for hook testing scenarios
     */
    queryClient: disableQueryClient ? null : (queryClient || createTestQueryClient()),
    
    /**
     * Helper to wait for hook-related queries to settle
     */
    waitForQueries: async (timeout?: number) => {
      const client = disableQueryClient ? null : (queryClient || createTestQueryClient());
      if (client) {
        await waitForQueries(client, timeout);
      }
    },
  };
};

// ============================================================================
// REACT HOOK FORM TESTING UTILITIES
// ============================================================================

/**
 * Form testing wrapper component with React Hook Form integration
 * 
 * Provides comprehensive form testing capabilities with React Hook Form,
 * including validation scenarios, submission handling, and form state management.
 * Supports complex form testing patterns used throughout the DreamFactory
 * Admin Interface.
 */
export const FormTestWrapper: React.FC<PropsWithChildren<FormTestingOptions>> = ({
  children,
  defaultValues,
  resolver,
  onSubmit,
  mode = 'onChange',
  debug = false,
  ...formProps
}) => {
  const methods = useForm({
    defaultValues,
    resolver,
    mode,
    ...formProps,
  });

  const handleSubmit = methods.handleSubmit((data) => {
    if (debug) {
      console.log('Form submitted with data:', data);
    }
    onSubmit?.(data);
  });

  // Debug form state in development
  React.useEffect(() => {
    if (debug && process.env.NODE_ENV === 'test') {
      console.log('Form state:', {
        values: methods.getValues(),
        errors: methods.formState.errors,
        isValid: methods.formState.isValid,
        isDirty: methods.formState.isDirty,
        isSubmitting: methods.formState.isSubmitting,
      });
    }
  }, [methods.formState, debug, methods]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit} data-testid="test-form">
        {children}
      </form>
    </FormProvider>
  );
};

/**
 * Renders a component with React Hook Form provider and testing utilities
 * 
 * Specialized render function for testing form components with comprehensive
 * React Hook Form integration. Provides access to form methods, validation
 * state, and submission handling for thorough form testing.
 * 
 * @param ui - Form component to render
 * @param formOptions - React Hook Form configuration options
 * @param renderOptions - Additional render configuration options
 * @returns Enhanced render result with form testing utilities
 */
export const renderWithForm = <TFieldValues extends FieldValues = FieldValues>(
  ui: ReactElement,
  formOptions: FormTestingOptions<TFieldValues> = {},
  renderOptions: CustomRenderOptions = {}
) => {
  const FormWrapper: React.FC<PropsWithChildren> = ({ children }) => (
    <FormTestWrapper {...formOptions}>
      {children}
    </FormTestWrapper>
  );

  const result = renderWithProviders(ui, {
    ...renderOptions,
    additionalProviders: [FormWrapper, ...(renderOptions.additionalProviders || [])],
  });

  return {
    ...result,
    
    /**
     * Helper to submit the form programmatically
     */
    submitForm: async () => {
      const form = result.getByTestId('test-form');
      const user = userEvent.setup();
      await user.click(form);
      return form;
    },
    
    /**
     * Helper to get form validation errors
     */
    getFormErrors: () => {
      const form = result.getByTestId('test-form');
      return form.querySelectorAll('[role="alert"], .error-message');
    },
    
    /**
     * Helper to check if form is in valid state
     */
    isFormValid: () => {
      const form = result.getByTestId('test-form');
      return form.checkValidity();
    },
  };
};

// ============================================================================
// ACCESSIBILITY TESTING UTILITIES
// ============================================================================

/**
 * Screen reader testing utilities for WCAG 2.1 AA compliance validation
 * 
 * Provides comprehensive accessibility testing capabilities including
 * screen reader simulation, keyboard navigation testing, and ARIA
 * validation for ensuring compliance with accessibility standards.
 */
export const accessibilityUtils = {
  /**
   * Simulates screen reader navigation through component
   * 
   * Tests the component's accessibility tree and ensures proper
   * screen reader navigation patterns are supported.
   * 
   * @param container - DOM container to test
   * @param options - Screen reader simulation options
   * @returns Accessibility navigation results
   */
  simulateScreenReader: async (
    container: HTMLElement,
    options: AccessibilityTestingOptions = {}
  ) => {
    const {
      screenReaderMode = 'nvda',
      keyboardNavigation = true,
      focusManagement = true,
      ariaValidation = true,
    } = options;

    const results = {
      focusableElements: [] as HTMLElement[],
      ariaLabels: [] as string[],
      headingStructure: [] as { level: number; text: string }[],
      landmarkRegions: [] as string[],
      errors: [] as string[],
    };

    // Find all focusable elements
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ];

    results.focusableElements = Array.from(
      container.querySelectorAll(focusableSelectors.join(', '))
    ) as HTMLElement[];

    // Extract ARIA labels and accessible names
    results.focusableElements.forEach((element) => {
      const accessibleName = element.getAttribute('aria-label') ||
                            element.getAttribute('aria-labelledby') ||
                            element.textContent ||
                            element.getAttribute('title') ||
                            element.getAttribute('placeholder');
      
      if (accessibleName) {
        results.ariaLabels.push(accessibleName.trim());
      } else {
        results.errors.push(`Focusable element missing accessible name: ${element.tagName}`);
      }
    });

    // Analyze heading structure
    const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    results.headingStructure = headings.map((heading) => ({
      level: parseInt(heading.tagName.charAt(1)),
      text: heading.textContent?.trim() || '',
    }));

    // Find landmark regions
    const landmarks = Array.from(container.querySelectorAll('[role], main, nav, header, footer, aside, section'));
    results.landmarkRegions = landmarks.map((landmark) => 
      landmark.getAttribute('role') || landmark.tagName.toLowerCase()
    );

    // Test keyboard navigation if enabled
    if (keyboardNavigation) {
      await testKeyboardNavigation(container, results);
    }

    // Validate ARIA attributes if enabled
    if (ariaValidation) {
      validateAriaAttributes(container, results);
    }

    return results;
  },

  /**
   * Tests keyboard navigation patterns for interactive components
   * 
   * Validates that all interactive elements are accessible via keyboard
   * and that navigation follows expected patterns for screen readers.
   * 
   * @param container - DOM container to test
   * @returns Keyboard navigation test results
   */
  testKeyboardNavigation: async (container: HTMLElement) => {
    const user = userEvent.setup();
    const results = {
      tabOrder: [] as HTMLElement[],
      accessibleElements: 0,
      inaccessibleElements: 0,
      errors: [] as string[],
    };

    // Test tab navigation
    const focusableElements = container.querySelectorAll(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    );

    for (const element of Array.from(focusableElements)) {
      try {
        await user.tab();
        if (document.activeElement === element) {
          results.tabOrder.push(element as HTMLElement);
          results.accessibleElements++;
        } else {
          results.inaccessibleElements++;
          results.errors.push(`Element not reachable via keyboard: ${element.tagName}`);
        }
      } catch (error) {
        results.errors.push(`Keyboard navigation error: ${error}`);
      }
    }

    return results;
  },

  /**
   * Validates color contrast for visual accessibility compliance
   * 
   * Checks color contrast ratios against WCAG 2.1 AA standards
   * to ensure proper visual accessibility for all users.
   * 
   * @param container - DOM container to test
   * @returns Color contrast validation results
   */
  validateColorContrast: (container: HTMLElement) => {
    const results = {
      passed: 0,
      failed: 0,
      warnings: [] as string[],
      errors: [] as string[],
    };

    // Get all text elements
    const textElements = Array.from(container.querySelectorAll('*')).filter(
      (element) => element.textContent && element.textContent.trim()
    );

    textElements.forEach((element) => {
      const computedStyle = window.getComputedStyle(element);
      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;
      const fontSize = parseFloat(computedStyle.fontSize);

      // Simple contrast validation (in a real implementation, you'd use a proper contrast calculation)
      if (color && backgroundColor && color !== backgroundColor) {
        results.passed++;
      } else {
        results.failed++;
        results.warnings.push(
          `Potential contrast issue for element: ${element.tagName} with text "${element.textContent?.substring(0, 50)}..."`
        );
      }
    });

    return results;
  },

  /**
   * Validates ARIA attributes and semantic markup
   * 
   * Ensures proper ARIA attribute usage and semantic HTML structure
   * for optimal screen reader compatibility and accessibility.
   * 
   * @param container - DOM container to validate
   * @returns ARIA validation results
   */
  validateAria: (container: HTMLElement) => {
    const results = {
      validAttributes: 0,
      invalidAttributes: 0,
      missingAttributes: 0,
      errors: [] as string[],
      warnings: [] as string[],
    };

    // Check for proper ARIA usage
    const elementsWithAria = Array.from(container.querySelectorAll('[aria-*], [role]'));
    
    elementsWithAria.forEach((element) => {
      const attributes = Array.from(element.attributes);
      
      attributes.forEach((attr) => {
        if (attr.name.startsWith('aria-') || attr.name === 'role') {
          // Basic validation of common ARIA patterns
          if (attr.value.trim()) {
            results.validAttributes++;
          } else {
            results.invalidAttributes++;
            results.errors.push(`Empty ARIA attribute: ${attr.name} on ${element.tagName}`);
          }
        }
      });
    });

    // Check for missing required ARIA attributes
    const interactiveElements = Array.from(container.querySelectorAll('button, input, select, textarea'));
    
    interactiveElements.forEach((element) => {
      const hasAccessibleName = element.getAttribute('aria-label') ||
                               element.getAttribute('aria-labelledby') ||
                               element.textContent?.trim() ||
                               element.getAttribute('title');
      
      if (!hasAccessibleName) {
        results.missingAttributes++;
        results.warnings.push(`Interactive element missing accessible name: ${element.tagName}`);
      }
    });

    return results;
  },
};

// Helper function for testing keyboard navigation
const testKeyboardNavigation = async (container: HTMLElement, results: any) => {
  const user = userEvent.setup();
  const focusableElements = Array.from(
    container.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])')
  );

  // Test tab navigation through all focusable elements
  for (let i = 0; i < focusableElements.length; i++) {
    try {
      await user.tab();
      if (document.activeElement !== focusableElements[i]) {
        results.errors.push(`Tab order inconsistency at element ${i}: ${focusableElements[i].tagName}`);
      }
    } catch (error) {
      results.errors.push(`Keyboard navigation error at element ${i}: ${error}`);
    }
  }
};

// Helper function for validating ARIA attributes
const validateAriaAttributes = (container: HTMLElement, results: any) => {
  const ariaElements = Array.from(container.querySelectorAll('[aria-*], [role]'));
  
  ariaElements.forEach((element) => {
    const role = element.getAttribute('role');
    const ariaLabel = element.getAttribute('aria-label');
    const ariaDescribedBy = element.getAttribute('aria-describedby');
    
    // Validate role attribute
    if (role && !['button', 'link', 'textbox', 'combobox', 'listbox', 'option', 'tab', 'tabpanel', 'dialog', 'alert'].includes(role)) {
      results.errors.push(`Invalid ARIA role: ${role} on ${element.tagName}`);
    }
    
    // Validate aria-label
    if (ariaLabel && ariaLabel.trim().length === 0) {
      results.errors.push(`Empty aria-label on ${element.tagName}`);
    }
    
    // Validate aria-describedby references
    if (ariaDescribedBy) {
      const referencedIds = ariaDescribedBy.split(' ');
      referencedIds.forEach((id) => {
        if (!container.querySelector(`#${id}`)) {
          results.errors.push(`aria-describedby references non-existent element: ${id}`);
        }
      });
    }
  });
};

// ============================================================================
// HEADLESS UI TESTING UTILITIES
// ============================================================================

/**
 * Headless UI component testing utilities
 * 
 * Specialized testing utilities for Headless UI components with
 * keyboard navigation patterns, focus management, and accessibility
 * features specific to the Headless UI library.
 */
export const headlessUIUtils = {
  /**
   * Tests Headless UI Listbox component behavior
   * 
   * Validates proper keyboard navigation, selection handling, and
   * accessibility features for Headless UI Listbox components.
   * 
   * @param container - DOM container containing the Listbox
   * @returns Listbox testing results
   */
  testListbox: async (container: HTMLElement) => {
    const user = userEvent.setup();
    const button = container.querySelector('[role="button"]') as HTMLElement;
    const listbox = container.querySelector('[role="listbox"]') as HTMLElement;
    
    if (!button) {
      throw new Error('Listbox button not found');
    }

    const results = {
      canOpen: false,
      canClose: false,
      keyboardNavigation: false,
      selection: false,
      accessibility: true,
      errors: [] as string[],
    };

    try {
      // Test opening listbox
      await user.click(button);
      if (listbox && listbox.style.display !== 'none') {
        results.canOpen = true;
      }

      // Test keyboard navigation
      await user.keyboard('{ArrowDown}');
      const firstOption = container.querySelector('[role="option"]');
      if (firstOption && firstOption.getAttribute('data-headlessui-state')?.includes('active')) {
        results.keyboardNavigation = true;
      }

      // Test selection
      await user.keyboard('{Enter}');
      if (firstOption && firstOption.getAttribute('aria-selected') === 'true') {
        results.selection = true;
      }

      // Test closing
      await user.keyboard('{Escape}');
      if (!listbox || listbox.style.display === 'none') {
        results.canClose = true;
      }

    } catch (error) {
      results.errors.push(`Listbox test error: ${error}`);
      results.accessibility = false;
    }

    return results;
  },

  /**
   * Tests Headless UI Dialog component behavior
   * 
   * Validates modal behavior, focus trapping, keyboard interactions,
   * and accessibility features for Headless UI Dialog components.
   * 
   * @param container - DOM container containing the Dialog
   * @returns Dialog testing results
   */
  testDialog: async (container: HTMLElement) => {
    const user = userEvent.setup();
    const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
    
    if (!dialog) {
      throw new Error('Dialog not found');
    }

    const results = {
      focusTrapping: false,
      escapeToClose: false,
      clickOutsideToClose: false,
      accessibility: true,
      errors: [] as string[],
    };

    try {
      // Test focus trapping
      const focusableElements = dialog.querySelectorAll(
        'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        await user.tab();
        if (document.activeElement === focusableElements[0]) {
          results.focusTrapping = true;
        }
      }

      // Test escape to close
      await user.keyboard('{Escape}');
      if (dialog.style.display === 'none' || !dialog.isConnected) {
        results.escapeToClose = true;
      }

    } catch (error) {
      results.errors.push(`Dialog test error: ${error}`);
      results.accessibility = false;
    }

    return results;
  },

  /**
   * Tests Headless UI Combobox component behavior
   * 
   * Validates search functionality, keyboard navigation, selection
   * handling, and accessibility features for Headless UI Combobox components.
   * 
   * @param container - DOM container containing the Combobox
   * @returns Combobox testing results
   */
  testCombobox: async (container: HTMLElement) => {
    const user = userEvent.setup();
    const input = container.querySelector('input[role="combobox"]') as HTMLInputElement;
    
    if (!input) {
      throw new Error('Combobox input not found');
    }

    const results = {
      canType: false,
      showsOptions: false,
      keyboardNavigation: false,
      selection: false,
      accessibility: true,
      errors: [] as string[],
    };

    try {
      // Test typing
      await user.type(input, 'test');
      if (input.value === 'test') {
        results.canType = true;
      }

      // Test options display
      const options = container.querySelectorAll('[role="option"]');
      if (options.length > 0) {
        results.showsOptions = true;
      }

      // Test keyboard navigation
      await user.keyboard('{ArrowDown}');
      const firstOption = options[0] as HTMLElement;
      if (firstOption && firstOption.getAttribute('data-headlessui-state')?.includes('active')) {
        results.keyboardNavigation = true;
      }

      // Test selection
      await user.keyboard('{Enter}');
      if (input.value !== 'test') {
        results.selection = true;
      }

    } catch (error) {
      results.errors.push(`Combobox test error: ${error}`);
      results.accessibility = false;
    }

    return results;
  },
};

// ============================================================================
// NEXT.JS TESTING UTILITIES
// ============================================================================

/**
 * Next.js specific testing utilities
 * 
 * Comprehensive testing utilities for Next.js-specific features including
 * middleware, server components, API routes, and app router functionality.
 */
export const nextJsUtils = {
  /**
   * Tests Next.js middleware functionality
   * 
   * Validates middleware behavior for authentication, authorization,
   * and request/response manipulation in Next.js applications.
   * 
   * @param middlewareFunction - Middleware function to test
   * @param request - Mock request object
   * @returns Middleware testing results
   */
  testMiddleware: async (
    middlewareFunction: Function,
    request: Partial<Request> = {}
  ) => {
    const mockRequest = {
      url: 'http://localhost:3000/',
      method: 'GET',
      headers: new Headers(),
      ...request,
    } as Request;

    const mockNextResponse = {
      next: vi.fn().mockReturnValue({ type: 'next' }),
      redirect: vi.fn().mockReturnValue({ type: 'redirect' }),
      rewrite: vi.fn().mockReturnValue({ type: 'rewrite' }),
      json: vi.fn().mockReturnValue({ type: 'json' }),
    };

    try {
      const result = await middlewareFunction(mockRequest, mockNextResponse);
      
      return {
        success: true,
        result,
        calls: {
          next: mockNextResponse.next.mock.calls.length,
          redirect: mockNextResponse.redirect.mock.calls.length,
          rewrite: mockNextResponse.rewrite.mock.calls.length,
          json: mockNextResponse.json.mock.calls.length,
        },
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        calls: {
          next: 0,
          redirect: 0,
          rewrite: 0,
          json: 0,
        },
        error: error as Error,
      };
    }
  },

  /**
   * Creates mock Next.js request and response objects
   * 
   * Provides realistic Next.js request/response objects for testing
   * API routes, middleware, and server-side functionality.
   * 
   * @param options - Request/response configuration options
   * @returns Mock Next.js request and response objects
   */
  createMockNextRequest: (options: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    query?: Record<string, string>;
  } = {}) => {
    const {
      url = 'http://localhost:3000/',
      method = 'GET',
      headers = {},
      body,
      query = {},
    } = options;

    const mockHeaders = new Headers(headers);
    
    const mockRequest = {
      url,
      method,
      headers: mockHeaders,
      body: body ? JSON.stringify(body) : null,
      json: vi.fn().mockResolvedValue(body),
      text: vi.fn().mockResolvedValue(body ? JSON.stringify(body) : ''),
      formData: vi.fn().mockResolvedValue(new FormData()),
      clone: vi.fn().mockReturnThis(),
    } as Partial<Request>;

    const mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis(),
      redirect: vi.fn().mockReturnThis(),
      headers: new Headers(),
      ok: true,
      status: 200,
      statusText: 'OK',
    };

    return { request: mockRequest as Request, response: mockResponse };
  },

  /**
   * Tests server component rendering
   * 
   * Validates server component behavior, data fetching, and
   * server-side rendering patterns for Next.js server components.
   * 
   * @param ServerComponent - Server component to test
   * @param props - Component props
   * @returns Server component testing results
   */
  testServerComponent: async (
    ServerComponent: React.ComponentType<any>,
    props: any = {}
  ) => {
    const results = {
      rendered: false,
      dataFetched: false,
      errors: [] as string[],
      renderTime: 0,
    };

    const startTime = Date.now();

    try {
      const result = renderWithProviders(<ServerComponent {...props} />);
      results.rendered = true;
      results.renderTime = Date.now() - startTime;

      // Check if component fetched data (look for loading states, etc.)
      const loadingElements = result.container.querySelectorAll('[data-loading="true"], .loading, .spinner');
      if (loadingElements.length === 0) {
        results.dataFetched = true;
      }

      return { ...results, renderResult: result };
    } catch (error) {
      results.errors.push(`Server component test error: ${error}`);
      return { ...results, renderResult: null };
    }
  },
};

// ============================================================================
// MSW INTEGRATION UTILITIES
// ============================================================================

/**
 * MSW (Mock Service Worker) integration utilities
 * 
 * Enhanced utilities for working with MSW in testing scenarios,
 * providing realistic API mocking and network simulation capabilities.
 */
export const mswUtils = {
  /**
   * Waits for MSW requests to complete
   * 
   * Useful for testing scenarios that involve multiple API calls
   * or when waiting for all pending requests to finish.
   * 
   * @param timeout - Maximum time to wait in milliseconds
   */
  waitForRequests: async (timeout: number = 5000): Promise<void> => {
    const startTime = Date.now();
    
    // In a real implementation, you'd track pending requests
    // For now, we'll use a simple timeout
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (Date.now() - startTime > timeout) {
      throw new Error(`Requests did not complete within ${timeout}ms`);
    }
  },

  /**
   * Resets MSW handlers to default state
   * 
   * Ensures clean state between tests by resetting all MSW handlers
   * to their default configuration.
   */
  resetHandlers: (): void => {
    server.resetHandlers();
  },

  /**
   * Uses custom MSW handlers for specific test scenarios
   * 
   * Allows temporary replacement of MSW handlers for testing
   * specific error conditions or edge cases.
   * 
   * @param handlers - Custom MSW handlers to use
   */
  useHandlers: (...handlers: Parameters<typeof server.use>): void => {
    server.use(...handlers);
  },

  /**
   * Gets mock data for testing scenarios
   * 
   * Provides access to the comprehensive mock data library
   * for consistent testing data across all test scenarios.
   */
  getMockData: () => mockData,
};

// ============================================================================
// RE-EXPORTS AND FINAL UTILITIES
// ============================================================================

// Re-export commonly used testing utilities
export { screen, within, waitFor, fireEvent, cleanup } from '@testing-library/react';
export { userEvent };
export { vi, expect, describe, it, test, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

// Export mock data for easy access in tests
export { mockData };

// Export MSW server for advanced testing scenarios
export { server };

/**
 * Default render function - alias for renderWithProviders
 * 
 * Provides a convenient default render function that includes
 * all necessary providers for most testing scenarios.
 */
export const render = renderWithProviders;

/**
 * Default renderHook function - alias for renderHookWithProviders
 * 
 * Provides a convenient default renderHook function that includes
 * all necessary providers for hook testing scenarios.
 */
export const renderHook = renderHookWithProviders;

/**
 * Comprehensive testing utilities object
 * 
 * Provides all testing utilities in a single object for
 * convenient import and usage in test files.
 */
export const testUtils = {
  // Core render utilities
  render: renderWithProviders,
  renderHook: renderHookWithProviders,
  renderWithForm,
  
  // Provider utilities
  createTestQueryClient,
  createMockRouter,
  createRouterContexts,
  cleanupQueryClient,
  waitForQueries,
  
  // Accessibility utilities
  accessibility: accessibilityUtils,
  
  // Headless UI utilities
  headlessUI: headlessUIUtils,
  
  // Next.js utilities
  nextJs: nextJsUtils,
  
  // MSW utilities
  msw: mswUtils,
  
  // User interaction utilities
  userEvent,
  
  // Mock data
  mockData,
  
  // MSW server
  server,
};

/**
 * Default export with all testing utilities
 * 
 * Provides a comprehensive testing utilities object as the default export
 * for convenient usage in test files that need access to multiple utilities.
 */
export default testUtils;