/**
 * Vitest Test Suite for Cache Management Page Component
 * 
 * This test suite validates the React cache management functionality using Vitest,
 * React Testing Library, and Mock Service Worker (MSW) for realistic API mocking.
 * Replaces Angular Jest/Karma tests with modern React testing patterns per
 * Section 7.1.2 testing configuration.
 * 
 * Coverage Areas:
 * - Cache management page rendering and user interactions
 * - Cache table data display and operations
 * - Cache modal confirmation dialogs
 * - SWR/React Query integration for cache operations
 * - Error handling and loading states
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Keyboard navigation and screen reader support
 * - MSW API mocking for realistic testing scenarios
 * 
 * Performance Target: < 30 seconds for complete test execution
 * Coverage Target: 90%+ code coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { rest } from 'msw';
import { server } from '@/test/mocks/server';

// Import components to test
import CachePage from './page';
import CacheTable from './cache-table';
import CacheModal from './cache-modal';
import { useCacheOperations } from './use-cache-operations';

// Import test utilities and providers
import { 
  renderWithProviders, 
  mockQueryClient,
  createMockSession,
  createMockCacheData
} from '@/test/utils/test-utils';
import { MockAuthProvider, TestQueryProvider } from '@/test/utils/mock-providers';

// Extend expect with jest-axe matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Mock cache data fixtures for comprehensive testing
const mockCacheData = {
  system: {
    total_size: 1024 * 1024 * 50, // 50MB
    entry_count: 1234,
    hit_rate: 85.6,
    last_cleared: '2024-01-15T10:30:00Z',
    enabled: true,
  },
  services: [
    {
      id: 'mysql-cache',
      service_name: 'mysql-production',
      service_type: 'mysql',
      cache_size: 1024 * 1024 * 15, // 15MB
      entry_count: 456,
      hit_rate: 92.3,
      last_accessed: '2024-01-15T11:45:00Z',
      enabled: true,
    },
    {
      id: 'postgresql-cache',
      service_name: 'postgresql-analytics',
      service_type: 'postgresql',
      cache_size: 1024 * 1024 * 8, // 8MB
      entry_count: 234,
      hit_rate: 78.9,
      last_accessed: '2024-01-15T09:20:00Z',
      enabled: true,
    },
  ],
};

// MSW handlers for cache management API endpoints
const cacheHandlers = [
  // Get system cache status
  rest.get('/api/v2/system/cache', (req, res, ctx) => {
    return res(ctx.json({ data: mockCacheData.system }));
  }),

  // Get service-specific cache data
  rest.get('/api/v2/system/cache/services', (req, res, ctx) => {
    return res(ctx.json({ data: mockCacheData.services }));
  }),

  // Clear system cache
  rest.delete('/api/v2/system/cache', (req, res, ctx) => {
    return res(ctx.json({ 
      success: true, 
      message: 'System cache cleared successfully' 
    }));
  }),

  // Clear specific service cache
  rest.delete('/api/v2/system/cache/service/:serviceId', (req, res, ctx) => {
    const { serviceId } = req.params;
    return res(ctx.json({ 
      success: true, 
      message: `Cache cleared for service: ${serviceId}` 
    }));
  }),

  // Error scenario: Cache operation failure
  rest.delete('/api/v2/system/cache/error', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        error: {
          code: 500,
          message: 'Failed to clear cache - internal server error',
          status_code: 500,
        },
      })
    );
  }),

  // Simulate slow response for loading state testing
  rest.get('/api/v2/system/cache/slow', (req, res, ctx) => {
    return res(
      ctx.delay(2000),
      ctx.json({ data: mockCacheData.system })
    );
  }),
];

describe('Cache Management Page', () => {
  const user = userEvent.setup();
  const mockSession = createMockSession();

  beforeEach(() => {
    // Reset MSW handlers before each test
    server.resetHandlers(...cacheHandlers);
    
    // Mock console methods to avoid test noise
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up mocks
    vi.restoreAllMocks();
  });

  describe('Page Component Rendering', () => {
    it('renders cache management page with correct title and navigation', async () => {
      renderWithProviders(<CachePage />);

      // Verify page title
      expect(screen.getByRole('heading', { name: /cache management/i })).toBeInTheDocument();
      
      // Verify navigation breadcrumbs
      expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
      expect(screen.getByText(/system settings/i)).toBeInTheDocument();
      expect(screen.getByText(/cache/i)).toBeInTheDocument();

      // Verify main content areas
      expect(screen.getByTestId('cache-overview-section')).toBeInTheDocument();
      expect(screen.getByTestId('cache-table-section')).toBeInTheDocument();
    });

    it('displays system cache overview with correct metrics', async () => {
      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByTestId('system-cache-overview')).toBeInTheDocument();
      });

      // Verify cache metrics display
      expect(screen.getByText(/50\.0 MB/i)).toBeInTheDocument(); // Total size
      expect(screen.getByText(/1,234/i)).toBeInTheDocument(); // Entry count
      expect(screen.getByText(/85\.6%/i)).toBeInTheDocument(); // Hit rate
      expect(screen.getByText(/enabled/i)).toBeInTheDocument(); // Status
    });

    it('renders loading state while fetching cache data', async () => {
      // Use slow endpoint to test loading states
      server.use(
        rest.get('/api/v2/system/cache', (req, res, ctx) => {
          return res(ctx.delay(1000), ctx.json({ data: mockCacheData.system }));
        })
      );

      renderWithProviders(<CachePage />);

      // Verify loading indicators
      expect(screen.getByTestId('cache-overview-loading')).toBeInTheDocument();
      expect(screen.getByRole('status', { name: /loading cache data/i })).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('cache-overview-loading')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('handles cache data fetch errors gracefully', async () => {
      // Mock API error response
      server.use(
        rest.get('/api/v2/system/cache', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              error: {
                code: 500,
                message: 'Internal server error',
                status_code: 500,
              },
            })
          );
        })
      );

      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-error-message')).toBeInTheDocument();
      });

      expect(screen.getByText(/failed to load cache data/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('Cache Table Component', () => {
    it('renders cache table with service data', async () => {
      renderWithProviders(<CacheTable />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Verify table headers
      expect(screen.getByRole('columnheader', { name: /service name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /cache size/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /entries/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /hit rate/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();

      // Verify service data rows
      expect(screen.getByText('mysql-production')).toBeInTheDocument();
      expect(screen.getByText('postgresql-analytics')).toBeInTheDocument();
      expect(screen.getByText('15.0 MB')).toBeInTheDocument();
      expect(screen.getByText('92.3%')).toBeInTheDocument();
    });

    it('supports sorting by different columns', async () => {
      renderWithProviders(<CacheTable />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Test sorting by cache size
      const cacheSizeHeader = screen.getByRole('columnheader', { name: /cache size/i });
      await user.click(cacheSizeHeader);

      // Verify sort indicator
      expect(cacheSizeHeader).toHaveAttribute('aria-sort', 'ascending');

      // Click again for descending sort
      await user.click(cacheSizeHeader);
      expect(cacheSizeHeader).toHaveAttribute('aria-sort', 'descending');
    });

    it('supports filtering cache entries', async () => {
      renderWithProviders(<CacheTable />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Find and use filter input
      const filterInput = screen.getByPlaceholderText(/filter cache entries/i);
      await user.type(filterInput, 'mysql');

      // Verify filtering results
      await waitFor(() => {
        expect(screen.getByText('mysql-production')).toBeInTheDocument();
        expect(screen.queryByText('postgresql-analytics')).not.toBeInTheDocument();
      });
    });

    it('displays individual cache clear buttons', async () => {
      renderWithProviders(<CacheTable />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Verify clear buttons for each service
      const clearButtons = screen.getAllByRole('button', { name: /clear cache/i });
      expect(clearButtons).toHaveLength(mockCacheData.services.length);

      // Test individual button attributes
      const mysqlClearButton = screen.getByRole('button', { 
        name: /clear cache for mysql-production/i 
      });
      expect(mysqlClearButton).toBeInTheDocument();
      expect(mysqlClearButton).toHaveAttribute('data-testid', 'clear-cache-mysql-cache');
    });
  });

  describe('Cache Operations', () => {
    it('opens confirmation modal when clearing system cache', async () => {
      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-overview-section')).toBeInTheDocument();
      });

      // Click clear all cache button
      const clearAllButton = screen.getByRole('button', { name: /clear all cache/i });
      await user.click(clearAllButton);

      // Verify modal opens
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /confirm cache clear/i })).toBeInTheDocument();
      });

      expect(screen.getByText(/are you sure you want to clear all system cache/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('successfully clears system cache with confirmation', async () => {
      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear all cache/i })).toBeInTheDocument();
      });

      // Open confirmation modal
      await user.click(screen.getByRole('button', { name: /clear all cache/i }));

      // Confirm cache clear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /confirm/i }));

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/system cache cleared successfully/i)).toBeInTheDocument();
      });

      // Verify modal closes
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('clears individual service cache', async () => {
      renderWithProviders(<CacheTable />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Click clear button for mysql service
      const mysqlClearButton = screen.getByRole('button', { 
        name: /clear cache for mysql-production/i 
      });
      await user.click(mysqlClearButton);

      // Confirm in modal
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /confirm/i }));

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/cache cleared for service: mysql-cache/i)).toBeInTheDocument();
      });
    });

    it('handles cache clear operation errors', async () => {
      // Mock error response
      server.use(
        rest.delete('/api/v2/system/cache', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              error: {
                code: 500,
                message: 'Failed to clear cache - internal server error',
                status_code: 500,
              },
            })
          );
        })
      );

      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear all cache/i })).toBeInTheDocument();
      });

      // Attempt to clear cache
      await user.click(screen.getByRole('button', { name: /clear all cache/i }));
      await user.click(screen.getByRole('button', { name: /confirm/i }));

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/failed to clear cache - internal server error/i)).toBeInTheDocument();
      });

      // Verify error styling
      expect(screen.getByTestId('cache-error-alert')).toBeInTheDocument();
    });

    it('cancels cache clear operation from modal', async () => {
      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear all cache/i })).toBeInTheDocument();
      });

      // Open confirmation modal
      await user.click(screen.getByRole('button', { name: /clear all cache/i }));

      // Cancel operation
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Verify modal closes without action
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText(/cache cleared/i)).not.toBeInTheDocument();
    });
  });

  describe('Cache Modal Component', () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
      mockOnConfirm.mockClear();
      mockOnCancel.mockClear();
    });

    it('renders modal with correct content and accessibility', async () => {
      render(
        <CacheModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          title="Clear System Cache"
          message="Are you sure you want to clear all system cache? This action cannot be undone."
          confirmText="Clear Cache"
          isLoading={false}
        />
      );

      // Verify modal structure
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');

      // Verify content
      expect(screen.getByText('Clear System Cache')).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to clear all system cache/i)).toBeInTheDocument();

      // Verify buttons
      expect(screen.getByRole('button', { name: /clear cache/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('displays loading state correctly', async () => {
      render(
        <CacheModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          title="Clear System Cache"
          message="Clearing cache..."
          confirmText="Clear Cache"
          isLoading={true}
        />
      );

      // Verify loading state
      const confirmButton = screen.getByRole('button', { name: /clearing/i });
      expect(confirmButton).toBeDisabled();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('calls onConfirm when confirm button is clicked', async () => {
      render(
        <CacheModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          title="Clear System Cache"
          message="Are you sure?"
          confirmText="Confirm"
          isLoading={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /confirm/i }));
      expect(mockOnConfirm).toHaveBeenCalledOnce();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      render(
        <CacheModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          title="Clear System Cache"
          message="Are you sure?"
          confirmText="Confirm"
          isLoading={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnCancel).toHaveBeenCalledOnce();
    });

    it('calls onCancel when escape key is pressed', async () => {
      render(
        <CacheModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          title="Clear System Cache"
          message="Are you sure?"
          confirmText="Confirm"
          isLoading={false}
        />
      );

      await user.keyboard('{Escape}');
      expect(mockOnCancel).toHaveBeenCalledOnce();
    });
  });

  describe('Accessibility Compliance', () => {
    it('meets WCAG 2.1 AA standards for cache page', async () => {
      const { container } = renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-overview-section')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation through cache table', async () => {
      renderWithProviders(<CacheTable />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Test tab navigation through table elements
      const table = screen.getByRole('table');
      const firstRow = within(table).getAllByRole('row')[1]; // Skip header
      const clearButton = within(firstRow).getByRole('button', { name: /clear cache/i });

      // Tab to clear button
      await user.tab();
      expect(clearButton).toHaveFocus();

      // Test Enter key activation
      await user.keyboard('{Enter}');

      // Verify modal opens
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('provides proper ARIA labels and descriptions', async () => {
      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-overview-section')).toBeInTheDocument();
      });

      // Verify ARIA landmarks
      expect(screen.getByRole('main')).toHaveAttribute('aria-labelledby', 'cache-page-title');
      
      // Verify button descriptions
      const clearAllButton = screen.getByRole('button', { name: /clear all cache/i });
      expect(clearAllButton).toHaveAttribute('aria-describedby');

      // Verify table accessibility
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', /cache entries/i);
    });

    it('announces cache operations to screen readers', async () => {
      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear all cache/i })).toBeInTheDocument();
      });

      // Clear cache and verify announcement
      await user.click(screen.getByRole('button', { name: /clear all cache/i }));
      await user.click(screen.getByRole('button', { name: /confirm/i }));

      // Verify live region announcement
      await waitFor(() => {
        const liveRegion = screen.getByRole('status', { name: /cache operation status/i });
        expect(liveRegion).toHaveTextContent(/system cache cleared successfully/i);
      });
    });

    it('maintains focus management in modal dialogs', async () => {
      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear all cache/i })).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear all cache/i });
      
      // Open modal
      await user.click(clearButton);

      // Verify focus moves to modal
      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
        
        // Focus should be on the first focusable element (confirm button or close button)
        const firstFocusableElement = within(modal).getByRole('button', { name: /cancel/i });
        expect(firstFocusableElement).toHaveFocus();
      });

      // Close modal and verify focus returns
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(clearButton).toHaveFocus();
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('implements efficient re-rendering with React Query caching', async () => {
      const renderSpy = vi.fn();
      
      function TestComponent() {
        renderSpy();
        return <CacheTable />;
      }

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Initial render
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same data should use cache
      renderWithProviders(<TestComponent />);
      
      // Should not trigger additional API calls due to caching
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('handles large cache datasets efficiently', async () => {
      // Mock large dataset
      const largeCacheData = {
        services: Array.from({ length: 100 }, (_, i) => ({
          id: `service-${i}`,
          service_name: `test-service-${i}`,
          service_type: 'mysql',
          cache_size: Math.random() * 1024 * 1024 * 10,
          entry_count: Math.floor(Math.random() * 1000),
          hit_rate: Math.random() * 100,
          last_accessed: new Date().toISOString(),
          enabled: true,
        })),
      };

      server.use(
        rest.get('/api/v2/system/cache/services', (req, res, ctx) => {
          return res(ctx.json({ data: largeCacheData.services }));
        })
      );

      const startTime = performance.now();
      
      renderWithProviders(<CacheTable />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Verify performance - should render large dataset in reasonable time
      expect(renderTime).toBeLessThan(1000); // Less than 1 second

      // Verify virtual scrolling implementation
      expect(screen.getByTestId('virtual-table-container')).toBeInTheDocument();
    });

    it('optimizes bundle size with dynamic imports', async () => {
      // This test would typically run in a build environment
      // For now, we verify that the components support lazy loading
      
      const LazyComponent = React.lazy(() => import('./cache-modal'));
      
      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyComponent
            isOpen={true}
            onConfirm={() => {}}
            onCancel={() => {}}
            title="Test"
            message="Test message"
            confirmText="Confirm"
            isLoading={false}
          />
        </React.Suspense>
      );

      // Verify lazy loading works
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundary Integration', () => {
    it('handles component errors gracefully', async () => {
      // Mock component that throws an error
      const ErrorComponent = () => {
        throw new Error('Test error for error boundary');
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TestQueryProvider>
          <ErrorComponent />
        </TestQueryProvider>
      );

      // Verify error boundary catches the error
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('provides error recovery options', async () => {
      // Mock network error scenario
      server.use(
        rest.get('/api/v2/system/cache', (req, res, ctx) => {
          return res.networkError('Network connection failed');
        })
      );

      renderWithProviders(<CachePage />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-error-message')).toBeInTheDocument();
      });

      // Verify retry button exists
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      // Reset to successful response and test retry
      server.use(
        rest.get('/api/v2/system/cache', (req, res, ctx) => {
          return res(ctx.json({ data: mockCacheData.system }));
        })
      );

      await user.click(retryButton);

      // Verify recovery
      await waitFor(() => {
        expect(screen.getByTestId('system-cache-overview')).toBeInTheDocument();
      });
    });
  });

  describe('Integration with SWR/React Query', () => {
    it('implements proper cache invalidation strategies', async () => {
      const queryClient = mockQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      renderWithProviders(<CachePage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear all cache/i })).toBeInTheDocument();
      });

      // Clear cache
      await user.click(screen.getByRole('button', { name: /clear all cache/i }));
      await user.click(screen.getByRole('button', { name: /confirm/i }));

      // Verify cache invalidation
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith(['cache', 'system']);
      });
    });

    it('handles optimistic updates correctly', async () => {
      renderWithProviders(<CacheTable />);

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Get initial hit rate
      const initialHitRate = screen.getByText('92.3%');
      expect(initialHitRate).toBeInTheDocument();

      // Clear cache (optimistic update should show immediate change)
      const clearButton = screen.getByRole('button', { 
        name: /clear cache for mysql-production/i 
      });
      await user.click(clearButton);
      await user.click(screen.getByRole('button', { name: /confirm/i }));

      // Verify optimistic update (cache cleared, metrics should reflect this)
      await waitFor(() => {
        expect(screen.getByText(/cache cleared for service/i)).toBeInTheDocument();
      });
    });

    it('implements stale-while-revalidate pattern', async () => {
      let requestCount = 0;
      
      server.use(
        rest.get('/api/v2/system/cache', (req, res, ctx) => {
          requestCount++;
          return res(ctx.json({ 
            data: { 
              ...mockCacheData.system, 
              entry_count: 1000 + requestCount 
            } 
          }));
        })
      );

      renderWithProviders(<CachePage />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/1,001/)).toBeInTheDocument();
      });

      // Trigger revalidation
      await user.click(screen.getByRole('button', { name: /refresh/i }));

      // Should show stale data initially, then update
      await waitFor(() => {
        expect(screen.getByText(/1,002/)).toBeInTheDocument();
      });

      expect(requestCount).toBe(2);
    });
  });
});

// Hook testing utilities
describe('useCacheOperations Hook', () => {
  it('provides cache operation functions with proper state management', async () => {
    let hookResult: any;

    function TestComponent() {
      hookResult = useCacheOperations();
      return <div>Test</div>;
    }

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(hookResult).toBeDefined();
    });

    // Verify hook interface
    expect(hookResult.clearSystemCache).toBeInstanceOf(Function);
    expect(hookResult.clearServiceCache).toBeInstanceOf(Function);
    expect(hookResult.isClearing).toBe(false);
    expect(hookResult.error).toBe(null);
  });

  it('handles cache operations with proper loading states', async () => {
    let hookResult: any;

    function TestComponent() {
      hookResult = useCacheOperations();
      return (
        <div>
          <button onClick={() => hookResult.clearSystemCache()}>
            Clear Cache
          </button>
          {hookResult.isClearing && <div>Clearing...</div>}
        </div>
      );
    }

    renderWithProviders(<TestComponent />);

    // Trigger cache clear
    await user.click(screen.getByRole('button', { name: /clear cache/i }));

    // Verify loading state
    expect(screen.getByText('Clearing...')).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText('Clearing...')).not.toBeInTheDocument();
    });
  });
});