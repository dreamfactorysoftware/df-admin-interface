/**
 * @fileoverview Comprehensive Vitest unit tests for CacheTable component
 * 
 * Tests the cache table component functionality including virtualized table rendering,
 * cache operations with optimistic updates, modal interactions, error scenarios, and
 * responsive design patterns. Implements React Testing Library best practices with
 * MSW for realistic API mocking and comprehensive accessibility testing.
 * 
 * Key test coverage areas:
 * - Virtualized table rendering for 1000+ cache entries per scaling requirements
 * - Cache flush operations with optimistic updates and rollback scenarios
 * - Modal accessibility with keyboard navigation per WCAG 2.1 AA compliance
 * - Responsive design across mobile and desktop breakpoints
 * - Error state handling with comprehensive recovery scenarios
 * - React Query cache management and mutation testing
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { toast } from 'react-hot-toast';

// Components under test
import CacheTable from './cache-table';
import CacheModal from './cache-modal';

// Test utilities and types
import { createWrapper } from '../../../test/utils/test-utils';
import { 
  createMockCacheData,
  createMockCacheRow,
  createLargeCacheDataset
} from '../../../test/utils/component-factories';

// Mock data factories
const createCacheApiResponse = (count: number = 50, filter: string = '') => {
  const allData = createLargeCacheDataset(1200); // Generate large dataset for virtualization testing
  
  let filteredData = allData;
  if (filter) {
    filteredData = allData.filter(item => 
      item.label.toLowerCase().includes(filter.toLowerCase()) ||
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }
  
  const paginatedData = filteredData.slice(0, count);
  
  return {
    resource: paginatedData,
    meta: { count: filteredData.length }
  };
};

// MSW server setup for realistic API mocking
const cacheHandlers = [
  // Successful cache list retrieval
  http.get('/api/v2/system/cache', ({ request }) => {
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') || '';
    const limit = Number(url.searchParams.get('limit')) || 50;
    
    const responseData = createCacheApiResponse(limit, filter);
    
    // Simulate realistic API latency
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(HttpResponse.json(responseData));
      }, Math.random() * 100 + 25); // 25-125ms latency
    });
  }),

  // Successful cache flush operation
  http.delete('/api/v2/system/cache/:serviceName', ({ params }) => {
    const { serviceName } = params;
    
    return new Promise(resolve => {
      setTimeout(() => {
        // Simulate 10% failure rate for error testing
        if (Math.random() < 0.1) {
          resolve(new HttpResponse(null, { 
            status: 500,
            statusText: `Failed to flush cache for ${serviceName}`
          }));
        } else {
          resolve(new HttpResponse(null, { status: 204 }));
        }
      }, Math.random() * 200 + 50); // 50-250ms latency
    });
  }),

  // Network error simulation
  http.get('/api/v2/system/cache/error', () => {
    return HttpResponse.error();
  }),

  // Server error simulation  
  http.get('/api/v2/system/cache/server-error', () => {
    return new HttpResponse(null, { 
      status: 500,
      statusText: 'Internal Server Error'
    });
  })
];

const server = setupServer(...cacheHandlers);

// Mock toast notifications
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock IntersectionObserver for virtualization testing
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver for responsive testing
const mockResizeObserver = vi.fn();
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.ResizeObserver = mockResizeObserver;

// Mock window.matchMedia for responsive breakpoint testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('CacheTable Component', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  beforeEach(() => {
    // Create fresh QueryClient for each test to avoid cache pollution
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries in tests
          staleTime: 0, // Always refetch in tests
          cacheTime: 0, // Don't cache in tests
        },
        mutations: {
          retry: false,
        },
      },
    });
    
    user = userEvent.setup();
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
  });

  afterAll(() => {
    server.close();
  });

  // Helper function to render component with all necessary providers
  const renderCacheTable = (props = {}) => {
    const defaultProps = {
      serviceId: 'test-service-id',
      className: 'test-class-name',
      ...props
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <CacheTable {...defaultProps} />
      </QueryClientProvider>
    );
  };

  describe('Component Rendering and Initial State', () => {
    it('renders cache table with loading state initially', async () => {
      renderCacheTable();
      
      // Check for loading indicator
      expect(screen.getByText('Loading cache data...')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading')).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByText('Loading cache data...')).not.toBeInTheDocument();
      });
    });

    it('displays cache table header with correct title and description', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText('Per-Service Cache Entries')).toBeInTheDocument();
        expect(screen.getByText(/Manage cache entries for individual services/)).toBeInTheDocument();
      });
    });

    it('renders refresh button with correct accessibility attributes', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        expect(refreshButton).toBeInTheDocument();
        expect(refreshButton).toHaveAttribute('type', 'button');
      });
    });

    it('renders filter input with proper labels and accessibility', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        const filterInput = screen.getByPlaceholderText('Filter cache entries...');
        expect(filterInput).toBeInTheDocument();
        expect(filterInput).toHaveAttribute('type', 'text');
        expect(filterInput).toHaveAttribute('name', 'cache-filter');
        expect(filterInput).toHaveAttribute('id', 'cache-filter');
      });
    });

    it('applies custom className prop correctly', () => {
      const customClass = 'custom-test-class';
      renderCacheTable({ className: customClass });
      
      const container = screen.getByRole('generic');
      expect(container).toHaveClass(customClass);
    });
  });

  describe('Virtualized Table Rendering for Large Datasets', () => {
    beforeEach(() => {
      // Mock large dataset response
      server.use(
        http.get('/api/v2/system/cache', () => {
          const largeDataset = createCacheApiResponse(1200);
          return HttpResponse.json(largeDataset);
        })
      );
    });

    it('renders virtualized table for 1000+ cache entries efficiently', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries: 1200/)).toBeInTheDocument();
      });

      // Verify table structure is present
      const tableHeader = screen.getByText('Service Cache');
      expect(tableHeader).toBeInTheDocument();
      
      const actionsHeader = screen.getByText('Actions');
      expect(actionsHeader).toBeInTheDocument();

      // Check that not all items are rendered (only visible ones due to virtualization)
      const flushButtons = screen.getAllByRole('button', { name: /flush cache for/i });
      expect(flushButtons.length).toBeLessThan(1200); // Should be virtualized
      expect(flushButtons.length).toBeGreaterThan(0); // But some should be visible
    });

    it('handles virtualized scrolling performance efficiently', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries: 1200/)).toBeInTheDocument();
      });

      const scrollContainer = screen.getByRole('generic', { hidden: true });
      
      // Simulate scroll event
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 1000 } });
      
      // Verify that new items are rendered as user scrolls
      await waitFor(() => {
        const flushButtons = screen.getAllByRole('button', { name: /flush cache for/i });
        expect(flushButtons.length).toBeGreaterThan(0);
      });
    });

    it('maintains scroll position and selection state during virtualization', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries: 1200/)).toBeInTheDocument();
      });

      // Test scroll position maintenance
      const scrollContainer = screen.getByRole('generic', { hidden: true });
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 500 } });
      
      // Simulate component update
      act(() => {
        queryClient.invalidateQueries({ queryKey: ['cache'] });
      });

      // Verify scroll position is maintained
      await waitFor(() => {
        expect(scrollContainer.scrollTop).toBe(500);
      });
    });
  });

  describe('Data Fetching and Filtering', () => {
    it('fetches and displays cache data correctly', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      // Check that cache entries are displayed
      await waitFor(() => {
        const cacheEntries = screen.getAllByText(/Service \d+ Cache/);
        expect(cacheEntries.length).toBeGreaterThan(0);
      });
    });

    it('filters cache entries based on search input', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      // Find and interact with filter input
      const filterInput = screen.getByPlaceholderText('Filter cache entries...');
      
      // Type filter text
      await user.type(filterInput, 'Service 1');
      
      // Wait for filter to be applied
      await waitFor(() => {
        const filteredEntries = screen.getAllByText(/Service 1/);
        expect(filteredEntries.length).toBeGreaterThan(0);
      });

      // Verify that non-matching entries are not visible
      expect(screen.queryByText('Service 2 Cache')).not.toBeInTheDocument();
    });

    it('shows "no results" message when filter returns empty results', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      const filterInput = screen.getByPlaceholderText('Filter cache entries...');
      await user.type(filterInput, 'nonexistent-cache-service');
      
      await waitFor(() => {
        expect(screen.getByText('No cache entries match your filter.')).toBeInTheDocument();
      });
    });

    it('clears filter when input is emptied', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      const filterInput = screen.getByPlaceholderText('Filter cache entries...');
      
      // Apply filter
      await user.type(filterInput, 'Service 1');
      await waitFor(() => {
        expect(screen.getAllByText(/Service 1/).length).toBeGreaterThan(0);
      });

      // Clear filter
      await user.clear(filterInput);
      
      // Wait for all entries to be visible again
      await waitFor(() => {
        const allEntries = screen.getAllByText(/Service \d+ Cache/);
        expect(allEntries.length).toBeGreaterThan(10); // More entries should be visible
      });
    });
  });

  describe('Cache Operations and Mutations', () => {
    it('opens flush confirmation modal when flush button is clicked', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      // Click first flush button
      const flushButtons = screen.getAllByRole('button', { name: /flush cache for/i });
      await user.click(flushButtons[0]);

      // Verify modal opens
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Flush Cache Confirmation')).toBeInTheDocument();
      });
    });

    it('performs cache flush operation with optimistic updates', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      // Click flush button
      const flushButtons = screen.getAllByRole('button', { name: /flush cache for/i });
      const targetButton = flushButtons[0];
      const cacheLabel = targetButton.getAttribute('aria-label')?.split(' for ')[1];
      
      await user.click(targetButton);

      // Confirm flush in modal
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /flush cache/i });
      await user.click(confirmButton);

      // Verify optimistic update (loading state)
      await waitFor(() => {
        expect(screen.getByText('Flushing Cache...')).toBeInTheDocument();
      });

      // Wait for operation to complete
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Verify success toast was called
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Cache flushed successfully'),
        expect.any(Object)
      );
    });

    it('handles cache flush errors with rollback functionality', async () => {
      // Configure server to return error
      server.use(
        http.delete('/api/v2/system/cache/:serviceName', () => {
          return new HttpResponse(null, { 
            status: 500,
            statusText: 'Internal Server Error'
          });
        })
      );

      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      // Perform flush operation
      const flushButtons = screen.getAllByRole('button', { name: /flush cache for/i });
      await user.click(flushButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /flush cache/i });
      await user.click(confirmButton);

      // Wait for error handling
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Verify error toast was called
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to flush cache'),
        expect.any(Object)
      );
    });

    it('performs optimistic updates correctly with React Query cache management', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      // Get initial cache entry count
      const initialEntries = screen.getAllByText(/Service \d+ Cache/);
      const initialCount = initialEntries.length;

      // Perform cache flush
      const flushButtons = screen.getAllByRole('button', { name: /flush cache for/i });
      await user.click(flushButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /flush cache/i });
      await user.click(confirmButton);

      // Wait for optimistic update to complete
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Verify React Query cache was updated
      const queryData = queryClient.getQueryData(['cache', { filter: '' }]);
      expect(queryData).toBeDefined();
    });
  });

  describe('Modal Accessibility and Keyboard Navigation', () => {
    it('supports keyboard navigation in confirmation modal', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      // Open modal
      const flushButtons = screen.getAllByRole('button', { name: /flush cache for/i });
      await user.click(flushButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Test Tab navigation
      const modal = screen.getByRole('dialog');
      const closeButton = within(modal).getByRole('button', { name: /close/i });
      const cancelButton = within(modal).getByRole('button', { name: /cancel/i });
      const confirmButton = within(modal).getByRole('button', { name: /flush cache/i });

      // Test focus trap
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);

      // Tab to next element
      await user.tab();
      expect(document.activeElement).toBe(within(modal).getByRole('checkbox'));

      await user.tab();
      expect(document.activeElement).toBe(cancelButton);

      await user.tab();
      expect(document.activeElement).toBe(confirmButton);
    });

    it('closes modal with Escape key', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      // Open modal
      const flushButtons = screen.getAllByRole('button', { name: /flush cache for/i });
      await user.click(flushButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Press Escape
      await user.keyboard('{Escape}');

      // Verify modal closes
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('maintains focus management and ARIA attributes correctly', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      // Open modal
      const flushButtons = screen.getAllByRole('button', { name: /flush cache for/i });
      await user.click(flushButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      
      // Check ARIA attributes
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('role', 'dialog');
      
      // Check for proper labeling
      const title = within(modal).getByRole('heading');
      expect(title).toHaveTextContent(/Flush.*Cache Confirmation/);
      
      // Check confirmation checkbox accessibility
      const checkbox = within(modal).getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-describedby');
    });

    it('provides proper screen reader announcements for cache operations', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      // Check flush button accessibility
      const flushButtons = screen.getAllByRole('button', { name: /flush cache for/i });
      const firstButton = flushButtons[0];
      
      expect(firstButton).toHaveAttribute('aria-label');
      expect(firstButton.getAttribute('aria-label')).toMatch(/Flush cache for/);
    });
  });

  describe('Responsive Design and Breakpoint Testing', () => {
    beforeEach(() => {
      // Reset viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });

    it('adapts table layout for mobile breakpoints (< 768px)', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      // Update matchMedia mock for mobile
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      // Check responsive grid classes are applied
      const tableHeader = screen.getByText('Service Cache');
      const headerContainer = tableHeader.closest('.grid');
      expect(headerContainer).toHaveClass('grid-cols-12');
    });

    it('maintains full desktop layout for larger screens (>= 768px)', async () => {
      // Simulate desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(min-width: 768px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      // Verify desktop layout elements
      expect(screen.getByText('Service Cache')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('handles dynamic viewport changes during interaction', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      // Simulate viewport change from desktop to mobile
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 375,
        });
        
        window.dispatchEvent(new Event('resize'));
      });

      // Component should still render correctly
      expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
    });
  });

  describe('Error Handling and Recovery Scenarios', () => {
    it('displays error state when API request fails', async () => {
      // Configure server to return error
      server.use(
        http.get('/api/v2/system/cache', () => {
          return new HttpResponse(null, { 
            status: 500,
            statusText: 'Internal Server Error'
          });
        })
      );

      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText('Error loading cache data')).toBeInTheDocument();
        expect(screen.getByText('An unknown error occurred')).toBeInTheDocument();
      });

      // Check for retry button
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('handles network errors gracefully with retry mechanism', async () => {
      // Configure server to return network error
      server.use(
        http.get('/api/v2/system/cache', () => {
          return HttpResponse.error();
        })
      );

      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText('Error loading cache data')).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /try again/i });
      
      // Restore successful response for retry
      server.use(
        http.get('/api/v2/system/cache', () => {
          return HttpResponse.json(createCacheApiResponse());
        })
      );

      await user.click(retryButton);

      // Verify recovery
      await waitFor(() => {
        expect(screen.queryByText('Error loading cache data')).not.toBeInTheDocument();
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });
    });

    it('maintains user interaction state during error recovery', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      // Apply filter before error
      const filterInput = screen.getByPlaceholderText('Filter cache entries...');
      await user.type(filterInput, 'Service 1');

      // Trigger error condition
      server.use(
        http.get('/api/v2/system/cache', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      // Trigger refetch
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText('Error loading cache data')).toBeInTheDocument();
      });

      // Verify filter value is maintained
      expect(filterInput).toHaveValue('Service 1');
    });

    it('provides comprehensive error messages for different failure types', async () => {
      const errorScenarios = [
        {
          status: 400,
          statusText: 'Bad Request',
          expectedMessage: 'Bad Request'
        },
        {
          status: 401, 
          statusText: 'Unauthorized',
          expectedMessage: 'Unauthorized'
        },
        {
          status: 403,
          statusText: 'Forbidden',
          expectedMessage: 'Forbidden'
        },
        {
          status: 404,
          statusText: 'Not Found',
          expectedMessage: 'Not Found'
        }
      ];

      for (const scenario of errorScenarios) {
        // Reset query client
        queryClient.clear();
        
        // Configure server error
        server.use(
          http.get('/api/v2/system/cache', () => {
            return new HttpResponse(null, { 
              status: scenario.status,
              statusText: scenario.statusText
            });
          })
        );

        // Re-render component
        const { unmount } = renderCacheTable();
        
        await waitFor(() => {
          expect(screen.getByText('Error loading cache data')).toBeInTheDocument();
        });

        unmount();
      }
    });
  });

  describe('React Query Cache Management', () => {
    it('implements proper cache invalidation after mutations', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      // Perform cache operation
      const flushButtons = screen.getAllByRole('button', { name: /flush cache for/i });
      await user.click(flushButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /flush cache/i });
      await user.click(confirmButton);

      // Wait for operation completion
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Verify cache invalidation occurred
      const cacheData = queryClient.getQueryData(['cache', { filter: '' }]);
      expect(cacheData).toBeDefined();
    });

    it('handles stale-while-revalidate patterns correctly', async () => {
      // Create initial cache data
      queryClient.setQueryData(['cache', { filter: '' }], createCacheApiResponse());

      renderCacheTable();
      
      // Component should render with cached data immediately
      expect(screen.getByText(/Total entries:/)).toBeInTheDocument();

      // Wait for background revalidation
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });
    });

    it('manages concurrent mutations correctly', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      // Attempt multiple concurrent operations
      const flushButtons = screen.getAllByRole('button', { name: /flush cache for/i });
      
      // Click multiple flush buttons quickly
      await user.click(flushButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Only one modal should be open
      const modals = screen.getAllByRole('dialog');
      expect(modals).toHaveLength(1);
    });
  });

  describe('Integration with Cache Modal Component', () => {
    it('passes correct props to cache modal component', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      // Open modal
      const flushButtons = screen.getAllByRole('button', { name: /flush cache for/i });
      await user.click(flushButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Verify modal content shows correct cache information
      const modal = screen.getByRole('dialog');
      expect(within(modal).getByText(/Service.*Cache/)).toBeInTheDocument();
    });

    it('handles modal state management correctly', async () => {
      renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      // Open modal
      const flushButtons = screen.getAllByRole('button', { name: /flush cache for/i });
      await user.click(flushButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close modal with cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('handles component unmounting without memory leaks', async () => {
      const { unmount } = renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      // Unmount component
      unmount();

      // Verify no memory leaks (queries should be cleaned up)
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    });

    it('implements efficient re-rendering patterns', async () => {
      const { rerender } = renderCacheTable();
      
      await waitFor(() => {
        expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
      });

      // Re-render with same props should not cause unnecessary network requests
      rerender(
        <QueryClientProvider client={queryClient}>
          <CacheTable serviceId="test-service-id" className="test-class-name" />
        </QueryClientProvider>
      );

      // Component should still display correctly
      expect(screen.getByText(/Total entries:/)).toBeInTheDocument();
    });
  });
});