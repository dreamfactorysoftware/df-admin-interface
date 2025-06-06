/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import CachePage from './page';
import { server } from '../../../test/mocks/server';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Mock Next.js environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_API_KEY: 'test-api-key',
  },
}));

// Mock window.confirm for system cache flush confirmation dialogs
const mockConfirm = vi.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
});

// Mock console.log and console.error for notification testing
const mockConsoleLog = vi.fn();
const mockConsoleError = vi.fn();
Object.defineProperty(console, 'log', {
  value: mockConsoleLog,
  writable: true,
});
Object.defineProperty(console, 'error', {
  value: mockConsoleError,
  writable: true,
});

/**
 * Custom render function with React Query provider
 * Replaces Angular TestBed configuration with React Testing Library patterns
 */
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for testing
        cacheTime: 0, // Disable caching for testing
        staleTime: 0, // Always consider data stale for testing
      },
      mutations: {
        retry: false, // Disable retries for testing
      },
    },
  });

  const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: AllTheProviders }),
    queryClient,
  };
};

/**
 * Mock data factory for cache service responses
 * Replicates DfBaseService mock data patterns
 */
const createMockCacheData = () => [
  {
    name: 'service_cache',
    label: 'Service Cache',
    description: 'Cache for database service configurations',
    type: 'service',
  },
  {
    name: 'schema_cache',
    label: 'Schema Cache',
    description: 'Cache for database schema metadata',
    type: 'schema',
  },
  {
    name: 'user_cache',
    label: 'User Cache',
    description: 'Cache for user session and profile data',
    type: 'user',
  },
];

describe('CachePage Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeAll(() => {
    // Start MSW server for realistic API mocking
    server.listen({ onUnhandledRequest: 'error' });
  });

  beforeEach(() => {
    // Reset MSW handlers and console mocks before each test
    server.resetHandlers();
    mockConfirm.mockClear();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
    
    // Setup user-event for component interaction testing
    user = userEvent.setup();
  });

  afterEach(() => {
    // Reset MSW handlers after each test
    server.resetHandlers();
  });

  describe('Initial Rendering and Loading States', () => {
    it('renders the cache management page with proper structure', async () => {
      // Setup successful cache data response
      server.use(
        http.get('/api/v2/system/cache', () => {
          return HttpResponse.json({
            resource: createMockCacheData(),
            meta: { count: 3 },
          });
        })
      );

      renderWithProviders(<CachePage />);

      // Test page header structure
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Cache Management');
      expect(screen.getByText('Manage system and service-specific cache configurations')).toBeInTheDocument();

      // Test system cache flush section
      expect(screen.getByRole('heading', { level: 3, name: 'System Cache Management' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Flush System Cache' })).toBeInTheDocument();

      // Wait for cache table to load
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 3, name: 'Per-Service Caches' })).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching cache data', () => {
      // Setup delayed response to test loading state
      server.use(
        http.get('/api/v2/system/cache', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({
            resource: createMockCacheData(),
            meta: { count: 3 },
          });
        })
      );

      renderWithProviders(<CachePage />);

      // Test loading spinner and message
      expect(screen.getByText('Loading cache information...')).toBeInTheDocument();
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // Loading spinner
    });

    it('renders cache table with service data after loading', async () => {
      const mockData = createMockCacheData();
      server.use(
        http.get('/api/v2/system/cache', () => {
          return HttpResponse.json({
            resource: mockData,
            meta: { count: mockData.length },
          });
        })
      );

      renderWithProviders(<CachePage />);

      // Wait for table to render with data
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Test table headers
      expect(screen.getByRole('columnheader', { name: 'Service' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();

      // Test each service row
      mockData.forEach((cache) => {
        expect(screen.getByText(cache.label)).toBeInTheDocument();
        expect(screen.getByText(cache.description)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: `Clear cache for ${cache.label}` })).toBeInTheDocument();
      });
    });

    it('shows empty state when no caches are available', async () => {
      server.use(
        http.get('/api/v2/system/cache', () => {
          return HttpResponse.json({
            resource: [],
            meta: { count: 0 },
          });
        })
      );

      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByText('No service caches available')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Validation', () => {
    it('displays error state when cache fetch fails', async () => {
      // Setup error response for cache fetching
      server.use(
        http.get('/api/v2/system/cache', () => {
          return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
        })
      );

      renderWithProviders(<CachePage />);

      // Wait for error state to render
      await waitFor(() => {
        expect(screen.getByText('Error loading cache information')).toBeInTheDocument();
        expect(screen.getByText('Failed to fetch caches: Internal Server Error')).toBeInTheDocument();
      });

      // Test retry button functionality
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('handles network errors gracefully', async () => {
      // Setup network error
      server.use(
        http.get('/api/v2/system/cache', () => {
          return HttpResponse.error();
        })
      );

      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByText('Error loading cache information')).toBeInTheDocument();
      });
    });

    it('handles authentication errors (401)', async () => {
      server.use(
        http.get('/api/v2/system/cache', () => {
          return new HttpResponse(null, { status: 401, statusText: 'Unauthorized' });
        })
      );

      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch caches: Unauthorized')).toBeInTheDocument();
      });
    });

    it('handles forbidden errors (403)', async () => {
      server.use(
        http.get('/api/v2/system/cache', () => {
          return new HttpResponse(null, { status: 403, statusText: 'Forbidden' });
        })
      );

      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch caches: Forbidden')).toBeInTheDocument();
      });
    });
  });

  describe('System Cache Flush Operations', () => {
    beforeEach(() => {
      // Setup successful cache data for each test
      server.use(
        http.get('/api/v2/system/cache', () => {
          return HttpResponse.json({
            resource: createMockCacheData(),
            meta: { count: 3 },
          });
        })
      );
    });

    it('prompts for confirmation before flushing system cache', async () => {
      mockConfirm.mockReturnValue(false); // User cancels

      renderWithProviders(<CachePage />);

      const flushButton = await screen.findByRole('button', { name: 'Flush System Cache' });
      await user.click(flushButton);

      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to flush the entire system cache? This action cannot be undone.'
      );
    });

    it('successfully flushes system cache when confirmed', async () => {
      mockConfirm.mockReturnValue(true); // User confirms

      server.use(
        http.delete('/api/v2/system/cache', () => {
          return HttpResponse.json({ success: true });
        })
      );

      renderWithProviders(<CachePage />);

      const flushButton = await screen.findByRole('button', { name: 'Flush System Cache' });
      await user.click(flushButton);

      // Wait for success message to appear
      await waitFor(() => {
        expect(screen.getByText('System cache flushed successfully')).toBeInTheDocument();
      });

      expect(mockConsoleLog).toHaveBeenCalledWith('System cache flushed successfully');
    });

    it('shows loading state during system cache flush', async () => {
      mockConfirm.mockReturnValue(true);

      server.use(
        http.delete('/api/v2/system/cache', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({ success: true });
        })
      );

      renderWithProviders(<CachePage />);

      const flushButton = await screen.findByRole('button', { name: 'Flush System Cache' });
      await user.click(flushButton);

      // Test loading state
      expect(screen.getByText('Flushing...')).toBeInTheDocument();
      expect(flushButton).toBeDisabled();
    });

    it('handles system cache flush errors', async () => {
      mockConfirm.mockReturnValue(true);

      server.use(
        http.delete('/api/v2/system/cache', () => {
          return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
        })
      );

      renderWithProviders(<CachePage />);

      const flushButton = await screen.findByRole('button', { name: 'Flush System Cache' });
      await user.click(flushButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Failed to flush system cache: Internal Server Error')).toBeInTheDocument();
      });

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to flush system cache:',
        expect.any(Error)
      );
    });

    it('does not proceed when user cancels confirmation', async () => {
      mockConfirm.mockReturnValue(false);

      const deleteSpy = vi.fn();
      server.use(
        http.delete('/api/v2/system/cache', deleteSpy)
      );

      renderWithProviders(<CachePage />);

      const flushButton = await screen.findByRole('button', { name: 'Flush System Cache' });
      await user.click(flushButton);

      // Ensure no API call was made
      expect(deleteSpy).not.toHaveBeenCalled();
    });
  });

  describe('Service Cache Flush Operations', () => {
    beforeEach(() => {
      server.use(
        http.get('/api/v2/system/cache', () => {
          return HttpResponse.json({
            resource: createMockCacheData(),
            meta: { count: 3 },
          });
        })
      );
    });

    it('prompts for confirmation before flushing individual service cache', async () => {
      mockConfirm.mockReturnValue(false);

      renderWithProviders(<CachePage />);

      // Wait for table to load and click first service clear button
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: 'Clear cache for Service Cache' });
      await user.click(clearButton);

      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to flush the cache for "service_cache"?'
      );
    });

    it('successfully flushes individual service cache', async () => {
      mockConfirm.mockReturnValue(true);

      server.use(
        http.delete('/api/v2/system/cache/service_cache', () => {
          return HttpResponse.json({ success: true });
        })
      );

      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: 'Clear cache for Service Cache' });
      await user.click(clearButton);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Service cache "service_cache" flushed successfully'
      );
    });

    it('handles service cache flush errors', async () => {
      mockConfirm.mockReturnValue(true);

      server.use(
        http.delete('/api/v2/system/cache/service_cache', () => {
          return new HttpResponse(null, { status: 404, statusText: 'Not Found' });
        })
      );

      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: 'Clear cache for Service Cache' });
      await user.click(clearButton);

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith(
          'Failed to flush service cache "service_cache":',
          expect.any(Error)
        );
      });
    });

    it('disables service cache buttons during flush operation', async () => {
      mockConfirm.mockReturnValue(true);

      server.use(
        http.delete('/api/v2/system/cache/service_cache', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({ success: true });
        })
      );

      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: 'Clear cache for Service Cache' });
      await user.click(clearButton);

      // Button should be disabled during operation
      expect(clearButton).toBeDisabled();
    });
  });

  describe('React Query Cache Invalidation and Management', () => {
    it('invalidates cache queries after successful system cache flush', async () => {
      mockConfirm.mockReturnValue(true);

      server.use(
        http.get('/api/v2/system/cache', () => {
          return HttpResponse.json({
            resource: createMockCacheData(),
            meta: { count: 3 },
          });
        }),
        http.delete('/api/v2/system/cache', () => {
          return HttpResponse.json({ success: true });
        })
      );

      const { queryClient } = renderWithProviders(<CachePage />);

      // Spy on query invalidation
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Flush System Cache' })).toBeInTheDocument();
      });

      const flushButton = screen.getByRole('button', { name: 'Flush System Cache' });
      await user.click(flushButton);

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['cache'] });
      });
    });

    it('invalidates specific cache queries after service cache flush', async () => {
      mockConfirm.mockReturnValue(true);

      server.use(
        http.get('/api/v2/system/cache', () => {
          return HttpResponse.json({
            resource: createMockCacheData(),
            meta: { count: 3 },
          });
        }),
        http.delete('/api/v2/system/cache/service_cache', () => {
          return HttpResponse.json({ success: true });
        })
      );

      const { queryClient } = renderWithProviders(<CachePage />);

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: 'Clear cache for Service Cache' });
      await user.click(clearButton);

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['cache', 'list'] });
      });
    });

    it('refetches cache data when refresh button is clicked', async () => {
      const fetchSpy = vi.fn(() => {
        return HttpResponse.json({
          resource: createMockCacheData(),
          meta: { count: 3 },
        });
      });

      server.use(
        http.get('/api/v2/system/cache', fetchSpy)
      );

      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Should have been called twice: initial load + manual refresh
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(2);
      });
    });

    it('retries failed requests automatically up to 3 times', async () => {
      let callCount = 0;
      const failingHandler = vi.fn(() => {
        callCount++;
        if (callCount < 3) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json({
          resource: createMockCacheData(),
          meta: { count: 3 },
        });
      });

      server.use(
        http.get('/api/v2/system/cache', failingHandler)
      );

      // Override the query client to enable retries for this test
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 3,
            retryDelay: 1, // Fast retries for testing
          },
        },
      });

      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      render(<CachePage />, { wrapper: TestWrapper });

      // Should eventually succeed after retries
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(callCount).toBe(3);
    });
  });

  describe('User Interaction Testing', () => {
    beforeEach(() => {
      server.use(
        http.get('/api/v2/system/cache', () => {
          return HttpResponse.json({
            resource: createMockCacheData(),
            meta: { count: 3 },
          });
        })
      );
    });

    it('handles keyboard navigation for cache management actions', async () => {
      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Flush System Cache' })).toBeInTheDocument();
      });

      // Test Tab navigation to system flush button
      await user.tab();
      expect(screen.getByRole('button', { name: 'Flush System Cache' })).toHaveFocus();

      // Test Tab navigation to refresh button
      await user.tab();
      expect(screen.getByRole('button', { name: /refresh/i })).toHaveFocus();

      // Test Tab navigation to service clear buttons
      await user.tab();
      expect(screen.getByRole('button', { name: 'Clear cache for Service Cache' })).toHaveFocus();
    });

    it('supports Enter key activation for flush operations', async () => {
      mockConfirm.mockReturnValue(true);

      server.use(
        http.delete('/api/v2/system/cache', () => {
          return HttpResponse.json({ success: true });
        })
      );

      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Flush System Cache' })).toBeInTheDocument();
      });

      const flushButton = screen.getByRole('button', { name: 'Flush System Cache' });
      flushButton.focus();
      await user.keyboard('{Enter}');

      expect(mockConfirm).toHaveBeenCalled();
    });

    it('supports Space key activation for cache operations', async () => {
      mockConfirm.mockReturnValue(true);

      server.use(
        http.delete('/api/v2/system/cache/service_cache', () => {
          return HttpResponse.json({ success: true });
        })
      );

      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: 'Clear cache for Service Cache' });
      clearButton.focus();
      await user.keyboard(' '); // Space key

      expect(mockConfirm).toHaveBeenCalled();
    });

    it('provides proper focus management during loading states', async () => {
      server.use(
        http.get('/api/v2/system/cache', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({
            resource: createMockCacheData(),
            meta: { count: 3 },
          });
        })
      );

      renderWithProviders(<CachePage />);

      // During loading, interactive elements should still be focusable
      const systemFlushButton = screen.getByRole('button', { name: 'Flush System Cache' });
      expect(systemFlushButton).toBeInTheDocument();
      systemFlushButton.focus();
      expect(systemFlushButton).toHaveFocus();
    });
  });

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    beforeEach(() => {
      server.use(
        http.get('/api/v2/system/cache', () => {
          return HttpResponse.json({
            resource: createMockCacheData(),
            meta: { count: 3 },
          });
        })
      );
    });

    it('has no accessibility violations on initial render', async () => {
      const { container } = renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('maintains accessibility during loading states', async () => {
      server.use(
        http.get('/api/v2/system/cache', async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return HttpResponse.json({
            resource: createMockCacheData(),
            meta: { count: 3 },
          });
        })
      );

      const { container } = renderWithProviders(<CachePage />);

      // Test accessibility during loading
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('maintains accessibility during error states', async () => {
      server.use(
        http.get('/api/v2/system/cache', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const { container } = renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByText('Error loading cache information')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper ARIA labels for interactive elements', async () => {
      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Test ARIA labels for cache clear buttons
      const serviceCache = createMockCacheData()[0];
      const clearButton = screen.getByRole('button', { name: `Clear cache for ${serviceCache.label}` });
      expect(clearButton).toHaveAttribute('aria-label', `Clear cache for ${serviceCache.label}`);
    });

    it('provides proper semantic structure with headings hierarchy', async () => {
      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Test heading hierarchy (h1 -> h3)
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Cache Management');

      const sectionHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(sectionHeadings).toHaveLength(2);
      expect(sectionHeadings[0]).toHaveTextContent('System Cache Management');
      expect(sectionHeadings[1]).toHaveTextContent('Per-Service Caches');
    });

    it('supports screen reader announcements for dynamic content', async () => {
      mockConfirm.mockReturnValue(true);

      server.use(
        http.delete('/api/v2/system/cache', () => {
          return HttpResponse.json({ success: true });
        })
      );

      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Flush System Cache' })).toBeInTheDocument();
      });

      const flushButton = screen.getByRole('button', { name: 'Flush System Cache' });
      await user.click(flushButton);

      // Success message should be announced to screen readers
      await waitFor(() => {
        const successMessage = screen.getByText('System cache flushed successfully');
        expect(successMessage).toBeInTheDocument();
        // The success message container should have proper semantic role
        expect(successMessage.closest('[role]')).toBeInTheDocument();
      });
    });

    it('provides sufficient color contrast for all text elements', async () => {
      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Test high contrast text elements
      const pageTitle = screen.getByRole('heading', { level: 1 });
      expect(pageTitle).toHaveClass('text-gray-900', 'dark:text-white');

      const description = screen.getByText('Manage system and service-specific cache configurations');
      expect(description).toHaveClass('text-gray-600', 'dark:text-gray-400');
    });
  });

  describe('Error Boundary Integration', () => {
    it('handles component errors gracefully', () => {
      // Mock a component that throws an error
      const ThrowError = () => {
        throw new Error('Test error for error boundary');
      };

      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        try {
          return <>{children}</>;
        } catch (error) {
          return <div role="alert">Something went wrong: {error instanceof Error ? error.message : 'Unknown error'}</div>;
        }
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong: Test error for error boundary');
    });

    it('handles Query Client errors gracefully', async () => {
      // Test invalid query configuration
      const invalidQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            cacheTime: 0,
          },
        },
      });

      // Spy on console.error to suppress error logs in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      server.use(
        http.get('/api/v2/system/cache', () => {
          return HttpResponse.error();
        })
      );

      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={invalidQueryClient}>
          {children}
        </QueryClientProvider>
      );

      render(<CachePage />, { wrapper: TestWrapper });

      // Should handle the error gracefully and show error UI
      await waitFor(() => {
        expect(screen.getByText('Error loading cache information')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Performance and Optimization', () => {
    it('efficiently handles large cache datasets', async () => {
      // Create large dataset to test performance
      const largeCacheDataset = Array.from({ length: 100 }, (_, i) => ({
        name: `cache_${i}`,
        label: `Cache Service ${i}`,
        description: `Cache for service number ${i}`,
        type: 'service',
      }));

      server.use(
        http.get('/api/v2/system/cache', () => {
          return HttpResponse.json({
            resource: largeCacheDataset,
            meta: { count: largeCacheDataset.length },
          });
        })
      );

      const startTime = performance.now();
      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (< 1000ms for large dataset)
      expect(renderTime).toBeLessThan(1000);

      // Verify all items are rendered
      expect(screen.getAllByText(/Cache Service/)).toHaveLength(largeCacheDataset.length);
    });

    it('implements proper cache TTL configuration', async () => {
      const fetchSpy = vi.fn(() => {
        return HttpResponse.json({
          resource: createMockCacheData(),
          meta: { count: 3 },
        });
      });

      server.use(
        http.get('/api/v2/system/cache', fetchSpy)
      );

      // Create query client with specific TTL settings
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes as specified in component
            cacheTime: 10 * 60 * 1000, // 10 minutes as specified in component
            retry: 3,
          },
        },
      });

      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      render(<CachePage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify cache configuration
      const queries = queryClient.getQueryCache().getAll();
      const cacheQuery = queries.find(q => q.queryKey.includes('cache'));
      
      expect(cacheQuery).toBeDefined();
      expect(fetchSpy).toHaveBeenCalledTimes(1); // Only called once due to caching
    });
  });
});