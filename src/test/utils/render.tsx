/**
 * Custom React Testing Library Render Utilities
 * 
 * Enhanced render utilities for React components with Next.js, React Query,
 * and Zustand provider setup. Provides comprehensive testing environment
 * that matches the application's runtime configuration.
 */

import React, { ReactElement, ReactNode } from 'react';
import { render as rtlRender, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { vi } from 'vitest';

// ============================================================================
// PROVIDER WRAPPER CONFIGURATION
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Custom query client for testing specific scenarios
   */
  queryClient?: QueryClient;
  
  /**
   * Initial route for router mock
   */
  initialRoute?: string;
  
  /**
   * Router mock configuration
   */
  routerMock?: Partial<ReturnType<typeof useRouter>>;
  
  /**
   * Whether to wrap with providers (default: true)
   */
  withProviders?: boolean;
  
  /**
   * Additional wrapper component
   */
  wrapper?: React.ComponentType<{ children: ReactNode }>;
}

/**
 * Default query client configuration for testing
 */
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests for faster execution
        retry: false,
        // Disable background refetching in tests
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        // Shorter stale time for tests
        staleTime: 0,
        // Shorter cache time for tests
        gcTime: 0,
      },
      mutations: {
        // Disable retries in tests
        retry: false,
      },
    },
    logger: {
      // Suppress query client logs during tests unless debugging
      log: process.env.DEBUG_TESTS ? console.log : () => {},
      warn: process.env.DEBUG_TESTS ? console.warn : () => {},
      error: process.env.DEBUG_TESTS ? console.error : () => {},
    },
  });
}

/**
 * Default router mock configuration
 */
function createDefaultRouterMock(initialRoute: string = '/'): ReturnType<typeof useRouter> {
  return {
    push: vi.fn().mockResolvedValue(true),
    replace: vi.fn().mockResolvedValue(true),
    prefetch: vi.fn().mockResolvedValue(undefined),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: initialRoute,
    query: {},
    asPath: initialRoute,
    route: initialRoute,
  };
}

/**
 * All Providers Wrapper
 * 
 * Comprehensive provider wrapper that includes all necessary providers
 * for testing React components in the DreamFactory Admin Interface context.
 */
interface AllProvidersProps {
  children: ReactNode;
  queryClient: QueryClient;
  routerMock: ReturnType<typeof useRouter>;
}

function AllProviders({ children, queryClient, routerMock }: AllProvidersProps) {
  // Mock Next.js router
  vi.mocked(useRouter).mockReturnValue(routerMock);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// ============================================================================
// CUSTOM RENDER FUNCTION
// ============================================================================

/**
 * Custom render function with enhanced provider setup
 * 
 * Renders React components with all necessary providers and context
 * for comprehensive testing. Automatically sets up React Query,
 * Next.js router mocking, and other essential testing utilities.
 * 
 * @param ui - The React component to render
 * @param options - Render options and configuration
 * @returns Enhanced render result with utilities and cleanup
 */
export function render(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & {
  queryClient: QueryClient;
  routerMock: ReturnType<typeof useRouter>;
  rerender: (ui: ReactElement) => void;
} {
  const {
    queryClient = createTestQueryClient(),
    initialRoute = '/',
    routerMock = createDefaultRouterMock(initialRoute),
    withProviders = true,
    wrapper: ExternalWrapper,
    ...renderOptions
  } = options;

  // Merge router mock with custom overrides
  const finalRouterMock = {
    ...createDefaultRouterMock(initialRoute),
    ...routerMock,
  };

  let Wrapper: React.ComponentType<{ children: ReactNode }> | undefined;

  if (withProviders) {
    Wrapper = ({ children }: { children: ReactNode }) => {
      const content = (
        <AllProviders queryClient={queryClient} routerMock={finalRouterMock}>
          {children}
        </AllProviders>
      );

      // Wrap with external wrapper if provided
      return ExternalWrapper ? (
        <ExternalWrapper>{content}</ExternalWrapper>
      ) : (
        content
      );
    };
  } else {
    Wrapper = ExternalWrapper;
  }

  const renderResult = rtlRender(ui, {
    wrapper: Wrapper,
    ...renderOptions,
  });

  // Enhanced rerender function that maintains provider context
  const rerender = (ui: ReactElement) => {
    return renderResult.rerender(ui);
  };

  return {
    ...renderResult,
    queryClient,
    routerMock: finalRouterMock,
    rerender,
  };
}

// ============================================================================
// SPECIALIZED RENDER UTILITIES
// ============================================================================

/**
 * Render with loading state
 * 
 * Utility for testing components in loading states by configuring
 * React Query to return loading queries.
 */
export function renderWithLoading(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: false, // Disable automatic queries to simulate loading
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  return render(ui, { ...options, queryClient });
}

/**
 * Render with error state
 * 
 * Utility for testing components in error states by pre-populating
 * the query cache with error responses.
 */
export function renderWithError(
  ui: ReactElement,
  error: Error,
  queryKey: string[],
  options: CustomRenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
  const queryClient = createTestQueryClient();
  
  // Pre-populate cache with error
  queryClient.setQueryData(queryKey, () => {
    throw error;
  });

  return render(ui, { ...options, queryClient });
}

/**
 * Render with mock data
 * 
 * Utility for testing components with pre-populated data by setting
 * up the query cache with mock responses.
 */
export function renderWithMockData<T>(
  ui: ReactElement,
  mockData: T,
  queryKey: string[],
  options: CustomRenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
  const queryClient = createTestQueryClient();
  
  // Pre-populate cache with mock data
  queryClient.setQueryData(queryKey, mockData);

  return render(ui, { ...options, queryClient });
}

/**
 * Render for form testing
 * 
 * Specialized render utility for testing forms with enhanced
 * form validation and submission tracking.
 */
export function renderForm(
  ui: ReactElement,
  options: CustomRenderOptions & {
    onSubmit?: (data: any) => void;
    initialValues?: Record<string, any>;
  } = {}
): RenderResult & {
  queryClient: QueryClient;
  routerMock: ReturnType<typeof useRouter>;
  submitSpy: ReturnType<typeof vi.fn>;
} {
  const { onSubmit = vi.fn(), ...renderOptions } = options;
  const submitSpy = vi.fn(onSubmit);

  // Mock form submission
  const mockSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    submitSpy(data);
  };

  const renderResult = render(ui, renderOptions);

  // Set up form submission listener
  const forms = renderResult.container.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', mockSubmit);
  });

  return {
    ...renderResult,
    submitSpy,
  };
}

/**
 * Render with performance tracking
 * 
 * Utility for testing component performance by tracking render times
 * and providing performance metrics.
 */
export function renderWithPerformanceTracking(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & {
  queryClient: QueryClient;
  routerMock: ReturnType<typeof useRouter>;
  performanceMetrics: {
    renderTime: number;
    queryTime: number;
  };
} {
  const startTime = performance.now();
  
  const renderResult = render(ui, options);
  
  const endTime = performance.now();
  const renderTime = endTime - startTime;

  // Track query performance
  const queryClient = renderResult.queryClient;
  const originalFetch = queryClient.fetchQuery;
  let queryTime = 0;

  queryClient.fetchQuery = async (...args: any[]) => {
    const queryStart = performance.now();
    const result = await originalFetch.apply(queryClient, args as [any]);
    const queryEnd = performance.now();
    queryTime += queryEnd - queryStart;
    return result;
  };

  return {
    ...renderResult,
    performanceMetrics: {
      renderTime,
      queryTime,
    },
  };
}

// ============================================================================
// TESTING UTILITIES
// ============================================================================

/**
 * Wait for queries to settle
 * 
 * Utility function to wait for all pending React Query operations
 * to complete before proceeding with test assertions.
 */
export async function waitForQueries(queryClient: QueryClient): Promise<void> {
  await new Promise(resolve => {
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      const queries = queryClient.getQueryCache().getAll();
      const hasActiveQueries = queries.some(query => query.state.fetchStatus !== 'idle');
      
      if (!hasActiveQueries) {
        unsubscribe();
        resolve(undefined);
      }
    });

    // Safety timeout
    setTimeout(() => {
      unsubscribe();
      resolve(undefined);
    }, 5000);
  });
}

/**
 * Clear all query caches
 * 
 * Utility to clean up query caches between tests for proper isolation.
 */
export function clearAllQueryCaches(queryClient: QueryClient): void {
  queryClient.clear();
  queryClient.removeQueries();
  queryClient.getQueryCache().clear();
  queryClient.getMutationCache().clear();
}

/**
 * Mock route parameters
 * 
 * Utility to mock Next.js dynamic route parameters for testing.
 */
export function mockRouteParams(params: Record<string, string | string[]>): void {
  const { useParams } = require('next/navigation');
  vi.mocked(useParams).mockReturnValue(params);
}

/**
 * Mock search parameters
 * 
 * Utility to mock Next.js search parameters for testing.
 */
export function mockSearchParams(searchParams: Record<string, string>): void {
  const { useSearchParams } = require('next/navigation');
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams(searchParams));
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Re-export everything from React Testing Library for convenience
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Re-export render as default for backward compatibility
export { render as default };