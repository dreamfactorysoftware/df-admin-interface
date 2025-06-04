import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import CacheTable from './cache-table';
import CacheModal from './cache-modal';

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (matches: boolean) => ({
  matches,
  media: '',
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

// Mock IntersectionObserver for virtualized table testing
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver for responsive testing
const mockResizeObserver = vi.fn();
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.ResizeObserver = mockResizeObserver;

// Mock cache data for testing
const mockCacheData = {
  resource: Array.from({ length: 1000 }, (_, index) => ({
    id: `cache-${index}`,
    service_name: `service_${index}`,
    cache_key: `cache_key_${index}`,
    cache_size: Math.floor(Math.random() * 1000000),
    last_access: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    ttl: Math.floor(Math.random() * 3600),
    hit_count: Math.floor(Math.random() * 1000),
    is_expired: Math.random() > 0.8,
  })),
  meta: {
    count: 1000,
    schema: ['id', 'service_name', 'cache_key', 'cache_size', 'last_access', 'ttl', 'hit_count', 'is_expired'],
  },
};

// MSW handlers for cache operations
const cacheHandlers = [
  // Get cache entries with pagination and filtering
  http.get('/api/v2/system/cache', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '25');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const filter = url.searchParams.get('filter');
    
    let filteredData = [...mockCacheData.resource];
    
    if (filter) {
      filteredData = filteredData.filter((item) =>
        item.service_name.includes(filter) || item.cache_key.includes(filter)
      );
    }
    
    const paginatedData = filteredData.slice(offset, offset + limit);
    
    return HttpResponse.json({
      resource: paginatedData,
      meta: {
        ...mockCacheData.meta,
        count: filteredData.length,
      },
    });
  }),

  // Flush single cache entry
  http.delete('/api/v2/system/cache/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      message: `Cache entry ${id} flushed successfully`,
    });
  }),

  // Flush all cache entries
  http.delete('/api/v2/system/cache', () => {
    return HttpResponse.json({
      message: 'All cache entries flushed successfully',
    });
  }),

  // Error handlers for testing error scenarios
  http.delete('/api/v2/system/cache/error-cache', () => {
    return HttpResponse.json(
      {
        error: {
          code: 500,
          message: 'Failed to flush cache entry',
          status_code: 500,
        },
      },
      { status: 500 }
    );
  }),
];

// Test wrapper component with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('CacheTable', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let queryClient: QueryClient;

  beforeEach(() => {
    user = userEvent.setup();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
    
    // Setup MSW handlers
    server.use(...cacheHandlers);
    
    // Mock window.matchMedia for responsive testing
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => {
        return mockMatchMedia(query.includes('min-width: 768px'));
      }),
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  describe('Table Rendering', () => {
    it('renders cache table with loading state initially', async () => {
      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      // Check for loading indicator
      expect(screen.getByTestId('cache-table-loading')).toBeInTheDocument();
    });

    it('renders cache table with data after loading', async () => {
      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Check table headers
      expect(screen.getByText('Service Name')).toBeInTheDocument();
      expect(screen.getByText('Cache Key')).toBeInTheDocument();
      expect(screen.getByText('Size')).toBeInTheDocument();
      expect(screen.getByText('Last Access')).toBeInTheDocument();
      expect(screen.getByText('TTL')).toBeInTheDocument();
      expect(screen.getByText('Hit Count')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('renders correct number of table rows for initial page', async () => {
      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        const tableRows = screen.getAllByTestId(/^cache-row-/);
        expect(tableRows).toHaveLength(25); // Default page size
      });
    });
  });

  describe('Virtualized Table Testing', () => {
    it('handles large datasets with virtualization for 1000+ entries', async () => {
      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Check that virtual scroller is present
      const virtualScroller = screen.getByTestId('virtual-scroller');
      expect(virtualScroller).toBeInTheDocument();

      // Simulate scrolling to load more items
      fireEvent.scroll(virtualScroller, { target: { scrollTop: 1000 } });

      await waitFor(() => {
        // Check that new items are loaded
        const visibleRows = screen.getAllByTestId(/^cache-row-/);
        expect(visibleRows.length).toBeGreaterThan(0);
      });
    });

    it('maintains performance with large datasets', async () => {
      const renderStart = performance.now();
      
      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      const renderTime = performance.now() - renderStart;
      
      // Ensure rendering completes within performance requirements
      expect(renderTime).toBeLessThan(1000); // Under 1 second for large datasets
    });

    it('handles virtualization scroll events efficiently', async () => {
      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('virtual-scroller')).toBeInTheDocument();
      });

      const scroller = screen.getByTestId('virtual-scroller');
      
      // Simulate rapid scrolling
      for (let i = 0; i < 10; i++) {
        fireEvent.scroll(scroller, { target: { scrollTop: i * 100 } });
      }

      // Table should remain responsive
      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });
    });
  });

  describe('Cache Operations', () => {
    it('opens flush confirmation modal when flush button is clicked', async () => {
      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Click flush button on first cache entry
      const flushButton = screen.getAllByTestId('flush-cache-button')[0];
      await user.click(flushButton);

      // Check that modal is opened
      await waitFor(() => {
        expect(screen.getByTestId('cache-flush-modal')).toBeInTheDocument();
      });
    });

    it('performs optimistic update when flushing cache entry', async () => {
      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      const initialRowCount = screen.getAllByTestId(/^cache-row-/).length;

      // Click flush button and confirm
      const flushButton = screen.getAllByTestId('flush-cache-button')[0];
      await user.click(flushButton);

      await waitFor(() => {
        expect(screen.getByTestId('cache-flush-modal')).toBeInTheDocument();
      });

      const confirmButton = screen.getByTestId('confirm-flush-button');
      await user.click(confirmButton);

      // Check for optimistic update - row should be removed immediately
      await waitFor(() => {
        const currentRowCount = screen.getAllByTestId(/^cache-row-/).length;
        expect(currentRowCount).toBe(initialRowCount - 1);
      });
    });

    it('handles flush operation rollback on error', async () => {
      // Use error handler
      server.use(
        http.delete('/api/v2/system/cache/cache-0', () => {
          return HttpResponse.json(
            {
              error: {
                code: 500,
                message: 'Failed to flush cache entry',
                status_code: 500,
              },
            },
            { status: 500 }
          );
        })
      );

      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      const initialRowCount = screen.getAllByTestId(/^cache-row-/).length;

      // Flush first entry which will fail
      const flushButton = screen.getAllByTestId('flush-cache-button')[0];
      await user.click(flushButton);

      await waitFor(() => {
        expect(screen.getByTestId('cache-flush-modal')).toBeInTheDocument();
      });

      const confirmButton = screen.getByTestId('confirm-flush-button');
      await user.click(confirmButton);

      // Check that rollback occurred - row count should be restored
      await waitFor(() => {
        const currentRowCount = screen.getAllByTestId(/^cache-row-/).length;
        expect(currentRowCount).toBe(initialRowCount);
      });

      // Check for error message
      expect(screen.getByText('Failed to flush cache entry')).toBeInTheDocument();
    });

    it('performs bulk flush operation with optimistic updates', async () => {
      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Select multiple cache entries
      const checkboxes = screen.getAllByTestId(/^cache-checkbox-/);
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);
      await user.click(checkboxes[2]);

      // Click bulk flush button
      const bulkFlushButton = screen.getByTestId('bulk-flush-button');
      await user.click(bulkFlushButton);

      // Confirm bulk operation
      await waitFor(() => {
        expect(screen.getByTestId('bulk-flush-modal')).toBeInTheDocument();
      });

      const confirmButton = screen.getByTestId('confirm-bulk-flush-button');
      await user.click(confirmButton);

      // Check that selected rows are removed optimistically
      await waitFor(() => {
        expect(screen.queryByTestId('cache-row-cache-0')).not.toBeInTheDocument();
        expect(screen.queryByTestId('cache-row-cache-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('cache-row-cache-2')).not.toBeInTheDocument();
      });
    });
  });

  describe('Modal Accessibility Testing', () => {
    it('supports keyboard navigation in flush confirmation modal', async () => {
      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Open modal with keyboard
      const flushButton = screen.getAllByTestId('flush-cache-button')[0];
      flushButton.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByTestId('cache-flush-modal')).toBeInTheDocument();
      });

      // Test tab navigation
      await user.keyboard('{Tab}');
      expect(screen.getByTestId('cancel-flush-button')).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(screen.getByTestId('confirm-flush-button')).toHaveFocus();

      // Test escape key to close modal
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByTestId('cache-flush-modal')).not.toBeInTheDocument();
      });
    });

    it('maintains focus trap within modal for WCAG 2.1 AA compliance', async () => {
      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Open modal
      const flushButton = screen.getAllByTestId('flush-cache-button')[0];
      await user.click(flushButton);

      await waitFor(() => {
        expect(screen.getByTestId('cache-flush-modal')).toBeInTheDocument();
      });

      // Focus should be trapped within modal
      const modal = screen.getByTestId('cache-flush-modal');
      const focusableElements = within(modal).getAllByRole('button');
      
      expect(focusableElements).toHaveLength(2); // Cancel and Confirm buttons
      
      // Test shift+tab from first element goes to last
      focusableElements[0].focus();
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(focusableElements[focusableElements.length - 1]).toHaveFocus();
    });

    it('provides proper ARIA labels and roles for screen readers', async () => {
      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Check table accessibility
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Cache entries table');

      // Check button accessibility
      const flushButtons = screen.getAllByTestId('flush-cache-button');
      expect(flushButtons[0]).toHaveAttribute('aria-label', expect.stringContaining('Flush cache'));

      // Open modal and check accessibility
      await user.click(flushButtons[0]);

      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toHaveAttribute('aria-labelledby');
        expect(modal).toHaveAttribute('aria-describedby');
      });
    });
  });

  describe('Responsive Design Testing', () => {
    it('adapts layout for mobile viewport (< 768px)', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => {
          return mockMatchMedia(query.includes('max-width: 767px'));
        }),
      });

      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Check that table is responsive
      const table = screen.getByTestId('cache-table');
      expect(table).toHaveClass('overflow-x-auto'); // Horizontal scroll for mobile

      // Some columns should be hidden on mobile
      expect(screen.queryByText('Hit Count')).not.toBeInTheDocument();
      expect(screen.queryByText('TTL')).not.toBeInTheDocument();
    });

    it('shows full table layout for desktop viewport (>= 768px)', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => {
          return mockMatchMedia(query.includes('min-width: 768px'));
        }),
      });

      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // All columns should be visible on desktop
      expect(screen.getByText('Service Name')).toBeInTheDocument();
      expect(screen.getByText('Cache Key')).toBeInTheDocument();
      expect(screen.getByText('Size')).toBeInTheDocument();
      expect(screen.getByText('Last Access')).toBeInTheDocument();
      expect(screen.getByText('TTL')).toBeInTheDocument();
      expect(screen.getByText('Hit Count')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('handles viewport changes dynamically', async () => {
      let isMobile = false;
      
      // Mock dynamic viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => {
          if (query.includes('min-width: 768px')) {
            return mockMatchMedia(!isMobile);
          }
          return mockMatchMedia(isMobile);
        }),
      });

      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Initially desktop - all columns visible
      expect(screen.getByText('Hit Count')).toBeInTheDocument();

      // Simulate viewport change to mobile
      isMobile = true;
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        // Hit Count column should be hidden on mobile
        expect(screen.queryByText('Hit Count')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State Testing', () => {
    it('displays error message when cache data fails to load', async () => {
      // Mock API error
      server.use(
        http.get('/api/v2/system/cache', () => {
          return HttpResponse.json(
            {
              error: {
                code: 500,
                message: 'Failed to load cache data',
                status_code: 500,
              },
            },
            { status: 500 }
          );
        })
      );

      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table-error')).toBeInTheDocument();
        expect(screen.getByText('Failed to load cache data')).toBeInTheDocument();
      });
    });

    it('provides retry functionality after error', async () => {
      let shouldError = true;

      // Mock API with conditional error
      server.use(
        http.get('/api/v2/system/cache', () => {
          if (shouldError) {
            return HttpResponse.json(
              {
                error: {
                  code: 500,
                  message: 'Failed to load cache data',
                  status_code: 500,
                },
              },
              { status: 500 }
            );
          }
          return HttpResponse.json(mockCacheData);
        })
      );

      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByTestId('cache-table-error')).toBeInTheDocument();
      });

      // Click retry button
      shouldError = false;
      const retryButton = screen.getByTestId('retry-button');
      await user.click(retryButton);

      // Should show data after retry
      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
        expect(screen.queryByTestId('cache-table-error')).not.toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      // Mock network error
      server.use(
        http.get('/api/v2/system/cache', () => {
          return HttpResponse.error();
        })
      );

      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table-error')).toBeInTheDocument();
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('shows validation errors for invalid cache operations', async () => {
      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Try to flush without proper permissions (simulated)
      server.use(
        http.delete('/api/v2/system/cache/:id', () => {
          return HttpResponse.json(
            {
              error: {
                code: 403,
                message: 'Insufficient permissions to flush cache',
                status_code: 403,
              },
            },
            { status: 403 }
          );
        })
      );

      const flushButton = screen.getAllByTestId('flush-cache-button')[0];
      await user.click(flushButton);

      await waitFor(() => {
        expect(screen.getByTestId('cache-flush-modal')).toBeInTheDocument();
      });

      const confirmButton = screen.getByTestId('confirm-flush-button');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Insufficient permissions to flush cache')).toBeInTheDocument();
      });
    });

    it('handles partial failure in bulk operations', async () => {
      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Select multiple entries
      const checkboxes = screen.getAllByTestId(/^cache-checkbox-/);
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      // Mock partial failure
      server.use(
        http.delete('/api/v2/system/cache', () => {
          return HttpResponse.json(
            {
              message: 'Partial success: 1 of 2 cache entries flushed',
              failed_items: ['cache-1'],
            },
            { status: 207 } // Multi-status
          );
        })
      );

      const bulkFlushButton = screen.getByTestId('bulk-flush-button');
      await user.click(bulkFlushButton);

      await waitFor(() => {
        expect(screen.getByTestId('bulk-flush-modal')).toBeInTheDocument();
      });

      const confirmButton = screen.getByTestId('confirm-bulk-flush-button');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/partial success/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('filters cache entries by service name', async () => {
      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('cache-search-input');
      await user.type(searchInput, 'service_1');

      await waitFor(() => {
        const rows = screen.getAllByTestId(/^cache-row-/);
        // Should only show filtered results
        expect(rows.length).toBeLessThan(25);
      });
    });

    it('filters cache entries by cache key', async () => {
      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('cache-search-input');
      await user.type(searchInput, 'cache_key_5');

      await waitFor(() => {
        const rows = screen.getAllByTestId(/^cache-row-/);
        expect(rows.length).toBeLessThan(25);
      });
    });

    it('clears filter when search input is cleared', async () => {
      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('cache-search-input');
      
      // Apply filter
      await user.type(searchInput, 'service_1');
      await waitFor(() => {
        const filteredRows = screen.getAllByTestId(/^cache-row-/);
        expect(filteredRows.length).toBeLessThan(25);
      });

      // Clear filter
      await user.clear(searchInput);
      await waitFor(() => {
        const allRows = screen.getAllByTestId(/^cache-row-/);
        expect(allRows).toHaveLength(25); // Back to full page size
      });
    });
  });

  describe('Pagination', () => {
    it('handles pagination for large datasets', async () => {
      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Check pagination controls
      expect(screen.getByTestId('pagination-info')).toHaveTextContent('1-25 of 1000');
      
      const nextButton = screen.getByTestId('pagination-next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId('pagination-info')).toHaveTextContent('26-50 of 1000');
      });
    });

    it('disables navigation buttons appropriately', async () => {
      render(
        <TestWrapper>
          <CacheTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('cache-table')).toBeInTheDocument();
      });

      // Previous button should be disabled on first page
      const prevButton = screen.getByTestId('pagination-prev');
      expect(prevButton).toBeDisabled();

      // Go to last page
      const lastButton = screen.getByTestId('pagination-last');
      await user.click(lastButton);

      await waitFor(() => {
        const nextButton = screen.getByTestId('pagination-next');
        expect(nextButton).toBeDisabled();
      });
    });
  });
});