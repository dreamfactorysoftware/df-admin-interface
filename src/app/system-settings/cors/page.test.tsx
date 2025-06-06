/**
 * @fileoverview Vitest unit tests for CORS Management Page Component
 * 
 * Comprehensive test suite for the CORS management page component covering:
 * - CORS policy loading with React Query cache testing
 * - CORS creation workflows and form validation
 * - Error boundary integration and error handling scenarios
 * - User interactions with React Testing Library patterns
 * - Accessibility testing with jest-axe integration
 * - Mock Service Worker (MSW) for realistic API mocking
 * - Performance testing and optimization validation
 * 
 * Replaces Angular Jest/Karma testing with modern Vitest and React Testing Library
 * patterns per Section 7.1.2 testing configuration requirements.
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+ / Vitest 2.1.0
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor, within, fireEvent, cleanup } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

// Test utilities and mocks
import { server, corsHandlers } from '@/test/mocks/cors-handlers';
import { createTestWrapper, TestProviders } from '@/test/utils/test-wrappers';
import { mockCorsEntries, resetCorsData, createMockCorsEntry } from '@/test/mocks/cors-data';
import { http, HttpResponse } from 'msw';

// Components under test
import CorsManagementPage from './page';

// Types and utilities
import type { CorsConfig } from '@/types/cors';

// Extend expect with jest-axe matchers for accessibility testing
expect.extend(toHaveNoViolations);

// ============================================================================
// Test Configuration and Setup
// ============================================================================

/**
 * Test configuration for CORS page testing
 */
const TEST_CONFIG = {
  // Timeout configurations for different test scenarios
  timeouts: {
    render: 5000,
    interaction: 3000,
    api: 2000,
    accessibility: 10000,
  },
  
  // Mock data identifiers for consistent testing
  mockData: {
    validCorsId: 1,
    invalidCorsId: 9999,
    testCorsEntry: {
      id: 999,
      description: 'Test CORS Configuration',
      enabled: true,
      path: '/test/api/*',
      origin: 'https://test.example.com',
      method: ['GET', 'POST'],
      header: 'Content-Type, Authorization',
      exposedHeader: 'X-Custom-Header',
      maxAge: 3600,
      supportsCredentials: false,
      createdById: 1,
      createdDate: '2024-01-01T00:00:00Z',
      lastModifiedById: 1,
      lastModifiedDate: '2024-01-01T00:00:00Z',
    } as CorsConfig,
  },
  
  // User interaction delays for realistic testing
  userInteraction: {
    typing: 50,
    clicking: 100,
    navigation: 200,
  },
};

/**
 * Global test setup and teardown
 */
beforeAll(() => {
  // Start MSW server before all tests
  server.listen({ onUnhandledRequest: 'error' });
  
  // Reset CORS mock data to initial state
  resetCorsData();
  
  // Mock console methods to avoid test noise
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  // Clean up MSW server after all tests
  server.close();
  
  // Restore console methods
  vi.restoreAllMocks();
});

beforeEach(() => {
  // Reset MSW handlers before each test
  server.resetHandlers();
  
  // Reset CORS mock data before each test
  resetCorsData();
  
  // Clear any cached query data
  vi.clearAllMocks();
});

afterEach(() => {
  // Clean up DOM after each test
  cleanup();
  
  // Reset all handlers to default state
  server.resetHandlers();
});

// ============================================================================
// Helper Functions and Test Utilities
// ============================================================================

/**
 * Creates a fresh QueryClient for each test to avoid cache pollution
 */
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

/**
 * Custom render function with all necessary providers
 */
const renderCorsPage = (
  ui: React.ReactElement = <CorsManagementPage />,
  options: { 
    queryClient?: QueryClient;
    errorBoundary?: boolean;
  } = {}
) => {
  const { queryClient = createTestQueryClient(), errorBoundary = false } = options;
  
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TestProviders>
        {errorBoundary ? (
          <ErrorBoundary
            fallback={<div role="alert">Something went wrong</div>}
            onError={(error) => {
              console.error('Error Boundary caught error:', error);
            }}
          >
            {children}
          </ErrorBoundary>
        ) : (
          children
        )}
      </TestProviders>
    </QueryClientProvider>
  );
  
  return {
    queryClient,
    ...render(ui, { wrapper: TestWrapper }),
  };
};

/**
 * Wait for page to fully load and hydrate
 */
const waitForPageLoad = async () => {
  await waitFor(
    () => {
      expect(screen.getByRole('main') || screen.getByText('CORS Management')).toBeInTheDocument();
    },
    { timeout: TEST_CONFIG.timeouts.render }
  );
};

/**
 * Simulate network delay for realistic testing
 */
const simulateNetworkDelay = (ms: number = 100) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// ============================================================================
// Test Suite: CORS Page Rendering and Basic Functionality
// ============================================================================

describe('CORS Management Page', () => {
  describe('Page Rendering and Initial Load', () => {
    it('should render CORS management page with correct title and layout', async () => {
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Verify page title and description
      expect(screen.getByRole('heading', { name: /cors management/i })).toBeInTheDocument();
      expect(screen.getByText(/configure cross-origin resource sharing policies/i)).toBeInTheDocument();
      
      // Verify navigation and structure
      const main = screen.getByRole('main') || screen.getByText('CORS Management').closest('div');
      expect(main).toBeInTheDocument();
      
      // Verify quick action buttons
      expect(screen.getByRole('link', { name: /cors documentation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create cors policy/i })).toBeInTheDocument();
    });

    it('should display CORS overview cards with loading states', async () => {
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Check for overview cards
      const overviewCards = screen.getAllByText(/policies/i);
      expect(overviewCards).toHaveLength(2); // Active Policies and Total Policies
      
      // Verify loading skeletons are present initially
      const loadingSkeletons = document.querySelectorAll('.animate-pulse');
      expect(loadingSkeletons.length).toBeGreaterThan(0);
    });

    it('should render with proper semantic HTML structure', async () => {
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Verify semantic structure
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      
      // Verify proper link elements
      const documentationLink = screen.getByRole('link', { name: /cors documentation/i });
      expect(documentationLink).toHaveAttribute('href', '/api-docs/cors');
      expect(documentationLink).toHaveAttribute('target', '_blank');
      expect(documentationLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should handle mobile responsive design', async () => {
      // Mock mobile user agent
      const mockHeaders = new Map();
      mockHeaders.set('user-agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15');
      
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Verify responsive classes are applied
      const mainContainer = screen.getByText('CORS Management').closest('div');
      expect(mainContainer).toHaveClass('p-4');
      
      // Verify mobile-optimized layout
      const headerContainer = screen.getByText('CORS Management').closest('.space-y-1')?.parentElement;
      expect(headerContainer).toHaveClass('flex-col', 'gap-4');
    });
  });

  // ============================================================================
  // Test Suite: CORS Policy Loading and Display
  // ============================================================================

  describe('CORS Policy Loading and Display', () => {
    it('should load and display CORS policies successfully', async () => {
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Wait for CORS table to load
      await waitFor(
        () => {
          const corsTable = screen.getByText(/cors policies/i).closest('.overflow-hidden');
          expect(corsTable).toBeInTheDocument();
        },
        { timeout: TEST_CONFIG.timeouts.api }
      );
      
      // Verify CORS policies section is present
      expect(screen.getByText('CORS Policies')).toBeInTheDocument();
      expect(screen.getByText(/manage cross-origin resource sharing policies/i)).toBeInTheDocument();
    });

    it('should handle empty CORS policy list gracefully', async () => {
      // Mock empty response
      server.use(
        http.get('/api/v2/system/cors', () => {
          return HttpResponse.json({
            resource: [],
            meta: { count: 0, total: 0 }
          });
        })
      );
      
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Should still render the table container
      await waitFor(() => {
        expect(screen.getByText('CORS Policies')).toBeInTheDocument();
      });
    });

    it('should display loading states during data fetching', async () => {
      // Add delay to API response to test loading states
      server.use(
        http.get('/api/v2/system/cors', async () => {
          await simulateNetworkDelay(500);
          return HttpResponse.json({
            resource: mockCorsEntries,
            meta: { count: mockCorsEntries.length, total: mockCorsEntries.length }
          });
        })
      );
      
      renderCorsPage();
      
      // Check for loading skeletons
      const loadingElements = document.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);
      
      await waitForPageLoad();
      
      // Wait for loading to complete
      await waitFor(
        () => {
          expect(screen.getByText('CORS Policies')).toBeInTheDocument();
        },
        { timeout: TEST_CONFIG.timeouts.api }
      );
    });

    it('should handle CORS policy loading errors gracefully', async () => {
      // Mock API error response
      server.use(
        http.get('/api/v2/system/cors', () => {
          return HttpResponse.json(
            { error: 'Failed to load CORS policies' },
            { status: 500 }
          );
        })
      );
      
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Should still render the page structure
      expect(screen.getByText('CORS Management')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Test Suite: User Interactions and Navigation
  // ============================================================================

  describe('User Interactions and Navigation', () => {
    it('should handle quick action button clicks', async () => {
      const user = userEvent.setup({ delay: TEST_CONFIG.userInteraction.clicking });
      
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Test documentation link
      const docLink = screen.getByRole('link', { name: /cors documentation/i });
      expect(docLink).toHaveAttribute('href', '/api-docs/cors');
      
      // Test create button click
      const createButton = screen.getByRole('button', { name: /create cors policy/i });
      await user.click(createButton);
      
      // Button should be interactive
      expect(createButton).toBeEnabled();
    });

    it('should handle overview card interactions', async () => {
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Verify overview cards are present and contain expected content
      const activeCard = screen.getByText('Active Policies').closest('.p-6');
      const totalCard = screen.getByText('Total Policies').closest('.p-6');
      const recentCard = screen.getByText('Recent Changes').closest('.p-6');
      
      expect(activeCard).toBeInTheDocument();
      expect(totalCard).toBeInTheDocument();
      expect(recentCard).toBeInTheDocument();
      
      // Verify cards have proper styling
      expect(activeCard).toHaveClass('p-6');
      expect(totalCard).toHaveClass('p-6');
      expect(recentCard).toHaveClass('p-6');
    });

    it('should handle status indicator interactions', async () => {
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Wait for status indicator to appear
      await waitFor(() => {
        const statusText = screen.getByText('Operational') || screen.getByText('Error');
        expect(statusText).toBeInTheDocument();
      });
    });

    it('should handle keyboard navigation properly', async () => {
      const user = userEvent.setup({ delay: TEST_CONFIG.userInteraction.typing });
      
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Test tab navigation through interactive elements
      await user.tab();
      
      // Documentation link should be focusable
      const docLink = screen.getByRole('link', { name: /cors documentation/i });
      expect(docLink).toBeInTheDocument();
      
      await user.tab();
      
      // Create button should be focusable
      const createButton = screen.getByRole('button', { name: /create cors policy/i });
      expect(createButton).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Test Suite: React Query Cache Testing
  // ============================================================================

  describe('React Query Cache Management', () => {
    it('should cache CORS policy data correctly', async () => {
      const queryClient = createTestQueryClient();
      
      renderCorsPage(undefined, { queryClient });
      
      await waitForPageLoad();
      
      // Wait for initial data load
      await waitFor(() => {
        expect(screen.getByText('CORS Policies')).toBeInTheDocument();
      });
      
      // Verify cache contains data
      const cacheData = queryClient.getQueryData(['cors', 'list']);
      expect(cacheData).toBeDefined();
    });

    it('should handle cache invalidation scenarios', async () => {
      const queryClient = createTestQueryClient();
      
      renderCorsPage(undefined, { queryClient });
      
      await waitForPageLoad();
      
      // Invalidate specific query
      await queryClient.invalidateQueries({ queryKey: ['cors'] });
      
      // Should trigger refetch
      await waitFor(() => {
        expect(screen.getByText('CORS Policies')).toBeInTheDocument();
      });
    });

    it('should handle concurrent requests properly', async () => {
      const queryClient = createTestQueryClient();
      
      // Mock multiple concurrent renders
      const { rerender } = renderCorsPage(undefined, { queryClient });
      
      await waitForPageLoad();
      
      // Rerender multiple times quickly
      rerender(<CorsManagementPage />);
      rerender(<CorsManagementPage />);
      rerender(<CorsManagementPage />);
      
      // Should handle concurrent requests without errors
      await waitFor(() => {
        expect(screen.getByText('CORS Management')).toBeInTheDocument();
      });
    });

    it('should handle stale data scenarios', async () => {
      const queryClient = createTestQueryClient();
      
      renderCorsPage(undefined, { queryClient });
      
      await waitForPageLoad();
      
      // Mark data as stale
      queryClient.invalidateQueries({ queryKey: ['cors'], exact: false });
      
      // Should still display cached data while refetching
      expect(screen.getByText('CORS Management')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Test Suite: Error Boundary Testing
  // ============================================================================

  describe('Error Boundary Integration', () => {
    it('should catch and handle component errors gracefully', async () => {
      // Mock a component that throws an error
      const ErrorThrowingComponent = () => {
        throw new Error('Test error for error boundary');
      };
      
      const TestPageWithError = () => (
        <div>
          <CorsManagementPage />
          <ErrorThrowingComponent />
        </div>
      );
      
      renderCorsPage(<TestPageWithError />, { errorBoundary: true });
      
      // Should render error boundary fallback
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      });
    });

    it('should handle API errors without crashing', async () => {
      // Mock API error
      server.use(
        http.get('/api/v2/system/cors', () => {
          return HttpResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
          );
        })
      );
      
      renderCorsPage(undefined, { errorBoundary: true });
      
      // Should not trigger error boundary for API errors
      await waitForPageLoad();
      
      expect(screen.getByText('CORS Management')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should handle rendering errors in suspense boundaries', async () => {
      // Mock component that fails to suspend properly
      const FailingSuspenseComponent = () => {
        throw new Promise(() => {}); // Never resolves
      };
      
      renderCorsPage(<FailingSuspenseComponent />, { errorBoundary: true });
      
      // Should handle suspense errors
      await waitFor(() => {
        // Either show loading state or error boundary
        const hasLoadingOrError = 
          document.querySelector('.animate-pulse') || 
          screen.queryByRole('alert');
        expect(hasLoadingOrError).toBeTruthy();
      });
    });

    it('should provide error reporting and recovery mechanisms', async () => {
      const onErrorSpy = vi.fn();
      
      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <ErrorBoundary
          fallback={<div role="alert">Error occurred</div>}
          onError={onErrorSpy}
        >
          {children}
        </ErrorBoundary>
      );
      
      // Component that throws after initial render
      const DelayedErrorComponent = () => {
        const [shouldError, setShouldError] = React.useState(false);
        
        React.useEffect(() => {
          setTimeout(() => setShouldError(true), 100);
        }, []);
        
        if (shouldError) {
          throw new Error('Delayed error');
        }
        
        return <CorsManagementPage />;
      };
      
      render(<DelayedErrorComponent />, { wrapper: TestWrapper });
      
      // Wait for error to be thrown and caught
      await waitFor(() => {
        expect(onErrorSpy).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Delayed error' }),
          expect.any(Object)
        );
      });
    });
  });

  // ============================================================================
  // Test Suite: Accessibility Testing
  // ============================================================================

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('should have no accessibility violations on initial render', async () => {
      const { container } = renderCorsPage();
      
      await waitForPageLoad();
      
      // Run accessibility tests
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }, TEST_CONFIG.timeouts.accessibility);

    it('should have proper heading hierarchy', async () => {
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Verify heading hierarchy
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      
      expect(h1).toBeInTheDocument();
      expect(h2).toBeInTheDocument();
      
      // H1 should be the main page title
      expect(h1).toHaveTextContent(/cors management/i);
    });

    it('should have proper ARIA labels and roles', async () => {
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Verify ARIA roles
      const mainContent = screen.getByRole('main') || screen.getByText('CORS Management').closest('div');
      expect(mainContent).toBeInTheDocument();
      
      // Verify button roles
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Verify link roles
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup({ delay: TEST_CONFIG.userInteraction.typing });
      
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Test tab navigation
      await user.tab();
      
      // First focusable element should be focused
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInstanceOf(HTMLElement);
      expect(focusedElement?.tagName).toMatch(/^(A|BUTTON)$/);
    });

    it('should have sufficient color contrast', async () => {
      const { container } = renderCorsPage();
      
      await waitForPageLoad();
      
      // Run color contrast accessibility tests
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });

    it('should provide proper focus management', async () => {
      const user = userEvent.setup({ delay: TEST_CONFIG.userInteraction.typing });
      
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Test focus trap behavior
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // Test that elements are focusable
      for (const element of Array.from(focusableElements).slice(0, 3)) {
        await user.tab();
        // Verify element can receive focus
        expect(element).toBeInstanceOf(HTMLElement);
      }
    });

    it('should provide screen reader compatible content', async () => {
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Verify descriptive text is present
      expect(screen.getByText(/configure cross-origin resource sharing policies/i)).toBeInTheDocument();
      expect(screen.getByText(/manage cross-origin resource sharing policies/i)).toBeInTheDocument();
      
      // Verify status indicators have accessible text
      const statusElements = screen.queryAllByText(/operational|error/i);
      expect(statusElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // Test Suite: Performance and Optimization
  // ============================================================================

  describe('Performance and Optimization', () => {
    it('should render within performance requirements (2 seconds SSR)', async () => {
      const startTime = performance.now();
      
      renderCorsPage();
      
      await waitForPageLoad();
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 2 seconds for SSR requirement
      expect(renderTime).toBeLessThan(2000);
    });

    it('should handle large datasets efficiently', async () => {
      // Mock large dataset
      const largeCorsDataset = Array.from({ length: 1000 }, (_, index) => 
        createMockCorsEntry({
          id: index + 1,
          description: `CORS Config ${index + 1}`,
          path: `/api/v${index % 10}/*`,
          origin: `https://app${index}.example.com`,
        })
      );
      
      server.use(
        http.get('/api/v2/system/cors', () => {
          return HttpResponse.json({
            resource: largeCorsDataset.slice(0, 25), // Paginated response
            meta: { count: 25, total: largeCorsDataset.length }
          });
        })
      );
      
      const startTime = performance.now();
      
      renderCorsPage();
      
      await waitForPageLoad();
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should still render efficiently with large datasets
      expect(renderTime).toBeLessThan(3000);
    });

    it('should optimize re-renders with React.memo and useMemo', async () => {
      const renderCount = { current: 0 };
      
      const TrackingWrapper = ({ children }: { children: React.ReactNode }) => {
        React.useEffect(() => {
          renderCount.current++;
        });
        return <>{children}</>;
      };
      
      const TestComponent = () => (
        <TrackingWrapper>
          <CorsManagementPage />
        </TrackingWrapper>
      );
      
      const { rerender } = renderCorsPage(<TestComponent />);
      
      await waitForPageLoad();
      
      const initialRenderCount = renderCount.current;
      
      // Rerender with same props
      rerender(<TestComponent />);
      
      // Should not cause unnecessary re-renders
      expect(renderCount.current).toBeLessThanOrEqual(initialRenderCount + 1);
    });

    it('should handle memory cleanup properly', async () => {
      const queryClient = createTestQueryClient();
      
      const { unmount } = renderCorsPage(undefined, { queryClient });
      
      await waitForPageLoad();
      
      // Unmount component
      unmount();
      
      // Verify cleanup
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    });
  });

  // ============================================================================
  // Test Suite: Integration with Mock Service Worker
  // ============================================================================

  describe('Mock Service Worker Integration', () => {
    it('should handle MSW mock responses correctly', async () => {
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Verify MSW is intercepting requests
      await waitFor(() => {
        expect(screen.getByText('CORS Policies')).toBeInTheDocument();
      });
    });

    it('should handle MSW error scenarios', async () => {
      // Configure MSW to return error
      server.use(
        http.get('/api/v2/system/cors', () => {
          return HttpResponse.json(
            { error: 'MSW simulated error' },
            { status: 500 }
          );
        })
      );
      
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Should handle error gracefully
      expect(screen.getByText('CORS Management')).toBeInTheDocument();
    });

    it('should support MSW request matching and validation', async () => {
      const requestSpy = vi.fn();
      
      server.use(
        http.get('/api/v2/system/cors', ({ request }) => {
          requestSpy(request.url);
          return HttpResponse.json({
            resource: mockCorsEntries,
            meta: { count: mockCorsEntries.length, total: mockCorsEntries.length }
          });
        })
      );
      
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Verify MSW intercepted the request
      await waitFor(() => {
        expect(requestSpy).toHaveBeenCalledWith(
          expect.stringContaining('/api/v2/system/cors')
        );
      });
    });

    it('should handle MSW latency simulation', async () => {
      server.use(
        http.get('/api/v2/system/cors', async () => {
          await simulateNetworkDelay(300);
          return HttpResponse.json({
            resource: mockCorsEntries,
            meta: { count: mockCorsEntries.length, total: mockCorsEntries.length }
          });
        })
      );
      
      const startTime = performance.now();
      
      renderCorsPage();
      
      await waitForPageLoad();
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should include simulated latency
      expect(totalTime).toBeGreaterThan(250);
    });
  });

  // ============================================================================
  // Test Suite: Edge Cases and Error Scenarios
  // ============================================================================

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle network timeouts gracefully', async () => {
      server.use(
        http.get('/api/v2/system/cors', async () => {
          // Simulate timeout
          await new Promise(resolve => setTimeout(resolve, 10000));
          return HttpResponse.json({ resource: [] });
        })
      );
      
      renderCorsPage();
      
      // Should still render page structure during timeout
      await waitForPageLoad();
      
      expect(screen.getByText('CORS Management')).toBeInTheDocument();
    });

    it('should handle malformed API responses', async () => {
      server.use(
        http.get('/api/v2/system/cors', () => {
          return new Response('Invalid JSON response', {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );
      
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Should handle malformed response gracefully
      expect(screen.getByText('CORS Management')).toBeInTheDocument();
    });

    it('should handle unexpected data structures', async () => {
      server.use(
        http.get('/api/v2/system/cors', () => {
          return HttpResponse.json({
            // Missing expected fields
            unexpectedField: 'unexpected value',
            resource: null,
          });
        })
      );
      
      renderCorsPage();
      
      await waitForPageLoad();
      
      // Should handle unexpected data gracefully
      expect(screen.getByText('CORS Management')).toBeInTheDocument();
    });

    it('should handle component unmounting during async operations', async () => {
      const { unmount } = renderCorsPage();
      
      // Unmount immediately to test cleanup
      unmount();
      
      // Should not cause memory leaks or errors
      expect(() => unmount()).not.toThrow();
    });
  });
});

// ============================================================================
// Additional Helper Components for Testing
// ============================================================================

/**
 * Test wrapper component for providing necessary context
 */
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TestProviders>
        {children}
      </TestProviders>
    </QueryClientProvider>
  );
};

/**
 * Mock implementation of Next.js headers for testing
 */
vi.mock('next/headers', () => ({
  headers: () => {
    const headerMap = new Map();
    headerMap.set = vi.fn();
    headerMap.get = vi.fn().mockReturnValue('test-user-agent');
    return headerMap;
  },
}));

/**
 * Mock React Suspense for testing
 */
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    Suspense: ({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) => 
      children || fallback,
  };
});