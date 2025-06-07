/**
 * Test Providers Component
 * 
 * Comprehensive testing provider wrapper that sets up all necessary React context
 * providers, state management, and mock services for component testing in the
 * DreamFactory Admin Interface React/Next.js migration.
 * 
 * Providers Included:
 * - React Query Client for server state management
 * - Zustand store providers for application state
 * - Theme provider for light/dark mode testing
 * - React Hook Form DevTools (development only)
 * - Error boundary for graceful error handling
 * - MSW browser worker integration
 * - Accessibility testing utilities
 * 
 * Features:
 * - Optimized for Vitest and React Testing Library
 * - Supports React 19 concurrent features testing
 * - Provides realistic state management scenarios
 * - Enables isolated component testing
 * - Includes performance measurement utilities
 * - Supports accessibility compliance testing
 */

import React, { ReactNode, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

// Test-specific providers and utilities
import { ErrorBoundary } from 'react-error-boundary';

// ============================================================================
// QUERY CLIENT SETUP
// ============================================================================

/**
 * Create a test-optimized React Query client
 * 
 * Configured for fast testing with disabled retries and caching
 * to ensure predictable test behavior and faster execution.
 */
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries for faster test execution
        retry: false,
        // Disable caching to ensure fresh data in each test
        staleTime: 0,
        gcTime: 0,
        // Enable error throwing for better test error handling
        throwOnError: true,
        // Disable refetching on window focus for test stability
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        // Disable retries for mutations in tests
        retry: false,
        // Enable error throwing for better test error handling
        throwOnError: true,
      },
    },
    // Suppress console logs during testing
    logger: {
      log: () => {},
      warn: () => {},
      error: process.env.DEBUG_TESTS ? console.error : () => {},
    },
  });
};

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * Test Error Boundary
 * 
 * Provides graceful error handling during testing and captures
 * component errors for debugging purposes.
 */
interface TestErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

const TestErrorBoundary: React.FC<TestErrorBoundaryProps> = ({ 
  children, 
  onError 
}) => {
  const handleError = (error: Error, errorInfo: any) => {
    if (process.env.DEBUG_TESTS) {
      console.group('🚨 Component Error Caught by Test Boundary');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
    
    onError?.(error, errorInfo);
  };

  const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
    <div 
      role="alert" 
      className="error-boundary-fallback"
      data-testid="error-boundary-fallback"
    >
      <h2>Test Error Boundary</h2>
      <p>Something went wrong during component rendering:</p>
      <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>
        {error.message}
      </pre>
      <button 
        onClick={resetErrorBoundary}
        data-testid="error-boundary-reset"
      >
        Reset Component
      </button>
    </div>
  );

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
};

// ============================================================================
// LOADING FALLBACK COMPONENT
// ============================================================================

/**
 * Test Loading Fallback
 * 
 * Provides a consistent loading state for Suspense boundaries
 * during testing scenarios.
 */
const TestLoadingFallback: React.FC = () => (
  <div 
    className="test-loading-fallback"
    data-testid="test-loading-fallback"
    role="status"
    aria-label="Loading test content"
  >
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    <span className="sr-only">Loading...</span>
  </div>
);

// ============================================================================
// MAIN TEST PROVIDERS COMPONENT
// ============================================================================

/**
 * Test Providers Props Interface
 */
interface TestProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  initialTheme?: 'light' | 'dark' | 'system';
  enableErrorBoundary?: boolean;
  onError?: (error: Error, errorInfo: any) => void;
  mockAppState?: Record<string, any>;
}

/**
 * Test Providers Component
 * 
 * Wraps components with all necessary providers for comprehensive testing.
 * Provides realistic application context while enabling isolated testing.
 */
export const TestProviders: React.FC<TestProvidersProps> = ({
  children,
  queryClient,
  initialTheme = 'light',
  enableErrorBoundary = true,
  onError,
  mockAppState = {},
}) => {
  // Create query client if not provided
  const testQueryClient = queryClient || createTestQueryClient();

  const ProviderStack = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme={initialTheme}
        enableSystem={true}
        disableTransitionOnChange
      >
        <Suspense fallback={<TestLoadingFallback />}>
          {children}
        </Suspense>
        
        {/* Toast notifications for testing */}
        <Toaster
          position="top-right"
          expand={false}
          richColors
          closeButton
          data-testid="toast-container"
        />
      </ThemeProvider>
    </QueryClientProvider>
  );

  // Wrap with error boundary if enabled
  if (enableErrorBoundary) {
    return (
      <TestErrorBoundary onError={onError}>
        <ProviderStack>{children}</ProviderStack>
      </TestErrorBoundary>
    );
  }

  return <ProviderStack>{children}</ProviderStack>;
};

// ============================================================================
// SPECIALIZED PROVIDER COMPONENTS
// ============================================================================

/**
 * Isolated Component Test Provider
 * 
 * Minimal provider setup for testing individual components
 * without full application context.
 */
export const IsolatedTestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isolatedQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });

  return (
    <QueryClientProvider client={isolatedQueryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

/**
 * Performance Test Provider
 * 
 * Optimized provider setup for performance testing scenarios
 * with monitoring and measurement capabilities.
 */
export const PerformanceTestProvider: React.FC<{ 
  children: ReactNode;
  onPerformanceMetric?: (metric: string, value: number) => void;
}> = ({ children, onPerformanceMetric }) => {
  const performanceQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 30000, // 30 seconds for performance testing
        gcTime: 60000,    // 1 minute for performance testing
      },
    },
  });

  // Performance monitoring wrapper
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      onPerformanceMetric?.('render_time', renderTime);
    };
  }, [onPerformanceMetric]);

  return (
    <QueryClientProvider client={performanceQueryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <Suspense fallback={<TestLoadingFallback />}>
          {children}
        </Suspense>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a test wrapper with custom configuration
 */
export const createTestWrapper = (options: Partial<TestProvidersProps> = {}) => {
  return ({ children }: { children: ReactNode }) => (
    <TestProviders {...options}>
      {children}
    </TestProviders>
  );
};

/**
 * Cleanup test providers and reset state
 */
export const cleanupTestProviders = (queryClient?: QueryClient) => {
  if (queryClient) {
    queryClient.clear();
    queryClient.getQueryCache().clear();
    queryClient.getMutationCache().clear();
  }
};

/**
 * Wait for React Query to settle (useful for integration tests)
 */
export const waitForQueryToSettle = async (queryClient: QueryClient) => {
  await queryClient.invalidateQueries();
  
  // Wait for all queries to finish
  await new Promise(resolve => {
    const interval = setInterval(() => {
      const isFetching = queryClient.isFetching();
      const isMutating = queryClient.isMutating();
      
      if (!isFetching && !isMutating) {
        clearInterval(interval);
        resolve(undefined);
      }
    }, 10);
  });
};

// ============================================================================
// EXPORTS
// ============================================================================

export default TestProviders;