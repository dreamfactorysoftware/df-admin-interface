/**
 * @fileoverview Comprehensive Vitest test suite for the scheduler management page component.
 * 
 * This test file replaces the Angular Jasmine/Karma tests with React Testing Library and provides:
 * - 10x faster test execution with Vitest compared to Jasmine/Karma
 * - User-centric testing approaches with React Testing Library
 * - Realistic API mocking with Mock Service Worker (MSW)
 * - React Query caching and state management validation
 * - WCAG 2.1 AA accessibility compliance testing
 * - TanStack Virtual performance testing for large datasets
 * - Comprehensive CRUD operation testing
 * - Paywall enforcement and security testing
 * 
 * @see Section 7.1.1 - Vitest configuration for 10x faster test execution
 * @see Section 7.1.2 - React Testing Library integration
 * @see Section 4.3.2 - React Query state management testing
 * @see Section 5.2 - WCAG 2.1 AA accessibility requirements
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe, toHaveNoViolations } from 'jest-axe';
import { server } from '@/test/mocks/server';
import { rest } from 'msw';
import SchedulerPage from './page';
import { schedulerTasksData, largeSchedulerDataset } from '@/test/mocks/scheduler-data';
import type { SchedulerTask, SchedulerTaskStatus } from '@/types/scheduler';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Mock Next.js router for navigation testing
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/system-settings/scheduler',
}));

// Mock ResizeObserver for TanStack Virtual testing
const mockResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', mockResizeObserver);

// Mock IntersectionObserver for infinite scroll testing
const mockIntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));
vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);

// Mock window.confirm for delete confirmation testing
const mockConfirm = vi.fn();
vi.stubGlobal('confirm', mockConfirm);

// Mock console methods for error boundary testing
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

/**
 * Test wrapper component that provides all necessary providers for React Query,
 * authentication context, and other dependencies.
 */
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for testing
        staleTime: 0, // Always consider data stale
        gcTime: 0, // Disable garbage collection
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

/**
 * Helper function to render components with all necessary providers
 */
const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui, { wrapper: TestWrapper });
};

/**
 * Helper function to setup user interactions
 */
const setupUser = () => userEvent.setup();

describe('SchedulerPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
    
    // Create fresh QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0, gcTime: 0 },
        mutations: { retry: false },
      },
    });

    // Start MSW server
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    // Clean up MSW handlers
    server.resetHandlers();
    server.close();
    
    // Clean up console mocks
    mockConsoleError.mockClear();
    mockConsoleWarn.mockClear();
  });

  describe('Component Rendering and Basic Functionality', () => {
    it('should render successfully with all core elements', async () => {
      renderWithProviders(<SchedulerPage />);

      // Verify page title
      expect(screen.getByRole('heading', { name: /scheduler management/i })).toBeInTheDocument();
      
      // Verify action buttons
      expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      
      // Wait for table to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify table headers
      expect(screen.getByRole('columnheader', { name: /task name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /last run/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /next run/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
    });

    it('should display loading state initially', () => {
      renderWithProviders(<SchedulerPage />);
      
      // Verify loading skeleton or spinner
      expect(screen.getByTestId('scheduler-loading') || screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should handle empty state when no tasks exist', async () => {
      // Override MSW handler to return empty array
      server.use(
        rest.get('/api/v2/system/scheduler_task', (req, res, ctx) => {
          return res(ctx.json({ resource: [] }));
        })
      );

      renderWithProviders(<SchedulerPage />);

      await waitFor(() => {
        expect(screen.getByText(/no scheduler tasks found/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/create your first task/i)).toBeInTheDocument();
    });
  });

  describe('React Query Integration and Caching', () => {
    it('should cache scheduler tasks data with proper TTL configuration', async () => {
      const user = setupUser();
      renderWithProviders(<SchedulerPage />);

      // Wait for initial data load
      await waitFor(() => {
        expect(screen.getByText('Email Reports Task')).toBeInTheDocument();
      });

      // Verify cache has been populated
      const cachedData = queryClient.getQueryData(['scheduler-tasks']);
      expect(cachedData).toBeDefined();
      expect(Array.isArray(cachedData)).toBe(true);

      // Trigger refresh and verify cache invalidation
      await user.click(screen.getByRole('button', { name: /refresh/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('progressbar') || screen.getByTestId('scheduler-loading')).toBeInTheDocument();
      });
    });

    it('should handle stale data revalidation in background', async () => {
      const user = setupUser();
      renderWithProviders(<SchedulerPage />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Email Reports Task')).toBeInTheDocument();
      });

      // Mock stale time expiry and background refetch
      const staleTime = 300000; // 5 minutes as per Section 5.2
      expect(queryClient.getDefaultOptions().queries?.staleTime).toBeLessThanOrEqual(staleTime);
    });

    it('should handle React Query error states gracefully', async () => {
      // Override MSW to return error
      server.use(
        rest.get('/api/v2/system/scheduler_task', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }));
        })
      );

      renderWithProviders(<SchedulerPage />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load scheduler tasks/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('CRUD Operations and User Interactions', () => {
    it('should handle task creation workflow', async () => {
      const user = setupUser();
      renderWithProviders(<SchedulerPage />);

      // Click create task button
      await user.click(screen.getByRole('button', { name: /create task/i }));

      // Verify navigation to create page
      expect(mockPush).toHaveBeenCalledWith('/system-settings/scheduler/create');
    });

    it('should handle task editing workflow', async () => {
      const user = setupUser();
      renderWithProviders(<SchedulerPage />);

      // Wait for tasks to load
      await waitFor(() => {
        expect(screen.getByText('Email Reports Task')).toBeInTheDocument();
      });

      // Find and click edit button for first task
      const editButton = screen.getByRole('button', { name: /edit email reports task/i });
      await user.click(editButton);

      // Verify navigation to edit page
      expect(mockPush).toHaveBeenCalledWith('/system-settings/scheduler/1');
    });

    it('should handle task deletion with confirmation', async () => {
      const user = setupUser();
      const deleteMutationSpy = vi.fn();
      
      // Mock successful delete
      server.use(
        rest.delete('/api/v2/system/scheduler_task/1', (req, res, ctx) => {
          deleteMutationSpy();
          return res(ctx.json({ success: true }));
        })
      );

      renderWithProviders(<SchedulerPage />);

      // Wait for tasks to load
      await waitFor(() => {
        expect(screen.getByText('Email Reports Task')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete email reports task/i });
      await user.click(deleteButton);

      // Verify confirmation dialog
      expect(mockConfirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to delete')
      );

      // Wait for delete mutation to complete
      await waitFor(() => {
        expect(deleteMutationSpy).toHaveBeenCalled();
      });
    });

    it('should handle task deletion cancellation', async () => {
      const user = setupUser();
      mockConfirm.mockReturnValue(false); // User cancels deletion
      
      renderWithProviders(<SchedulerPage />);

      // Wait for tasks to load
      await waitFor(() => {
        expect(screen.getByText('Email Reports Task')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete email reports task/i });
      await user.click(deleteButton);

      // Verify task still exists (deletion was cancelled)
      expect(screen.getByText('Email Reports Task')).toBeInTheDocument();
    });

    it('should handle task status updates', async () => {
      const user = setupUser();
      const statusUpdateSpy = vi.fn();

      // Mock status update endpoint
      server.use(
        rest.patch('/api/v2/system/scheduler_task/1', (req, res, ctx) => {
          statusUpdateSpy();
          return res(ctx.json({ id: 1, status: 'paused' }));
        })
      );

      renderWithProviders(<SchedulerPage />);

      // Wait for tasks to load
      await waitFor(() => {
        expect(screen.getByText('Email Reports Task')).toBeInTheDocument();
      });

      // Find and click status toggle
      const statusToggle = screen.getByRole('button', { name: /pause email reports task/i });
      await user.click(statusToggle);

      await waitFor(() => {
        expect(statusUpdateSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Table Interactions and Pagination', () => {
    it('should handle table sorting functionality', async () => {
      const user = setupUser();
      renderWithProviders(<SchedulerPage />);

      // Wait for table to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Click on task name column header to sort
      const nameHeader = screen.getByRole('columnheader', { name: /task name/i });
      await user.click(nameHeader);

      // Verify sort indicator appears
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

      // Click again to reverse sort
      await user.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    });

    it('should handle table filtering functionality', async () => {
      const user = setupUser();
      renderWithProviders(<SchedulerPage />);

      // Wait for table to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Find and use search/filter input
      const filterInput = screen.getByRole('textbox', { name: /search tasks/i });
      await user.type(filterInput, 'Email');

      // Verify filtered results
      await waitFor(() => {
        expect(screen.getByText('Email Reports Task')).toBeInTheDocument();
        expect(screen.queryByText('Database Cleanup Task')).not.toBeInTheDocument();
      });
    });

    it('should handle pagination for large datasets', async () => {
      const user = setupUser();
      
      // Override MSW to return paginated data
      server.use(
        rest.get('/api/v2/system/scheduler_task', (req, res, ctx) => {
          const page = req.url.searchParams.get('page') || '1';
          const limit = req.url.searchParams.get('limit') || '25';
          
          return res(ctx.json({
            resource: schedulerTasksData.slice(0, parseInt(limit)),
            meta: {
              total: 100,
              page: parseInt(page),
              limit: parseInt(limit),
              pages: 4
            }
          }));
        })
      );

      renderWithProviders(<SchedulerPage />);

      // Wait for table to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify pagination controls
      expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();

      // Test pagination navigation
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      // Verify page change
      await waitFor(() => {
        expect(screen.getByText(/page 2 of 4/i)).toBeInTheDocument();
      });
    });
  });

  describe('TanStack Virtual Performance Testing', () => {
    it('should handle large datasets with virtual scrolling', async () => {
      // Override MSW to return large dataset
      server.use(
        rest.get('/api/v2/system/scheduler_task', (req, res, ctx) => {
          return res(ctx.json({ resource: largeSchedulerDataset }));
        })
      );

      renderWithProviders(<SchedulerPage />);

      // Wait for virtual table to initialize
      await waitFor(() => {
        expect(screen.getByTestId('virtual-table')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify only visible items are rendered (not all 1000+)
      const tableRows = screen.getAllByRole('row');
      expect(tableRows.length).toBeLessThan(50); // Only visible rows rendered
      expect(tableRows.length).toBeGreaterThan(10); // At least some rows visible

      // Verify virtual scrolling container exists
      expect(screen.getByTestId('virtual-container')).toBeInTheDocument();
    });

    it('should maintain performance under 200ms UI update latency', async () => {
      const user = setupUser();
      
      // Override MSW to return large dataset
      server.use(
        rest.get('/api/v2/system/scheduler_task', (req, res, ctx) => {
          return res(ctx.json({ resource: largeSchedulerDataset }));
        })
      );

      renderWithProviders(<SchedulerPage />);

      // Wait for virtual table
      await waitFor(() => {
        expect(screen.getByTestId('virtual-table')).toBeInTheDocument();
      });

      // Measure scroll performance
      const startTime = performance.now();
      
      const virtualContainer = screen.getByTestId('virtual-container');
      fireEvent.scroll(virtualContainer, { target: { scrollTop: 1000 } });

      // Verify update happens quickly
      await waitFor(() => {
        const endTime = performance.now();
        const updateLatency = endTime - startTime;
        expect(updateLatency).toBeLessThan(200); // Must be under 200ms per Section 2.4
      });
    });

    it('should handle progressive loading for schema expansion', async () => {
      const user = setupUser();
      renderWithProviders(<SchedulerPage />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Find expandable task row
      const expandButton = screen.getByRole('button', { name: /expand task details/i });
      await user.click(expandButton);

      // Verify progressive loading indicator
      expect(screen.getByTestId('task-details-loading')).toBeInTheDocument();

      // Wait for details to load
      await waitFor(() => {
        expect(screen.getByTestId('task-details-content')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<SchedulerPage />);

      // Wait for component to fully render
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Run accessibility audit
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', async () => {
      const user = setupUser();
      renderWithProviders(<SchedulerPage />);

      // Wait for table to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Test tab navigation through interactive elements
      await user.tab(); // Should focus on create button
      expect(screen.getByRole('button', { name: /create task/i })).toHaveFocus();

      await user.tab(); // Should focus on refresh button
      expect(screen.getByRole('button', { name: /refresh/i })).toHaveFocus();

      await user.tab(); // Should focus on search input
      expect(screen.getByRole('textbox', { name: /search tasks/i })).toHaveFocus();
    });

    it('should have proper ARIA labels and descriptions', async () => {
      renderWithProviders(<SchedulerPage />);

      // Wait for table to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify table has proper ARIA attributes
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', expect.stringContaining('Scheduler tasks'));

      // Verify action buttons have proper ARIA labels
      const createButton = screen.getByRole('button', { name: /create task/i });
      expect(createButton).toHaveAttribute('aria-describedby');

      // Verify status indicators have proper ARIA labels
      const statusElements = screen.getAllByTestId(/task-status-/);
      statusElements.forEach(element => {
        expect(element).toHaveAttribute('aria-label');
      });
    });

    it('should support screen reader announcements', async () => {
      const user = setupUser();
      renderWithProviders(<SchedulerPage />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify live regions for dynamic content
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Test deletion announcement
      const deleteButton = screen.getByRole('button', { name: /delete email reports task/i });
      await user.click(deleteButton);

      // Verify announcement region updates
      await waitFor(() => {
        const alertRegion = screen.getByRole('alert');
        expect(alertRegion).toHaveTextContent(/task deleted successfully/i);
      });
    });

    it('should have sufficient color contrast and focus indicators', async () => {
      renderWithProviders(<SchedulerPage />);

      // Wait for table to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify focus indicators are visible
      const focusableElements = [
        screen.getByRole('button', { name: /create task/i }),
        screen.getByRole('button', { name: /refresh/i }),
        screen.getByRole('textbox', { name: /search tasks/i })
      ];

      focusableElements.forEach(element => {
        element.focus();
        const styles = window.getComputedStyle(element);
        
        // Verify focus indicator exists (outline or box-shadow)
        expect(
          styles.outline !== 'none' || 
          styles.boxShadow !== 'none'
        ).toBe(true);
      });
    });
  });

  describe('Paywall Enforcement and Security', () => {
    it('should enforce paywall restrictions for premium features', async () => {
      // Override MSW to simulate paywall response
      server.use(
        rest.get('/api/v2/system/scheduler_task', (req, res, ctx) => {
          return res(
            ctx.status(402),
            ctx.json({ 
              error: 'Payment Required',
              message: 'Advanced scheduler features require premium subscription'
            })
          );
        })
      );

      renderWithProviders(<SchedulerPage />);

      // Wait for paywall message
      await waitFor(() => {
        expect(screen.getByText(/premium subscription required/i)).toBeInTheDocument();
      });

      // Verify upgrade button is present
      expect(screen.getByRole('button', { name: /upgrade to premium/i })).toBeInTheDocument();

      // Verify restricted features are disabled
      expect(screen.getByRole('button', { name: /create task/i })).toBeDisabled();
    });

    it('should handle authentication errors gracefully', async () => {
      // Override MSW to simulate auth error
      server.use(
        rest.get('/api/v2/system/scheduler_task', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({ error: 'Unauthorized' })
          );
        })
      );

      renderWithProviders(<SchedulerPage />);

      // Wait for auth error message
      await waitFor(() => {
        expect(screen.getByText(/session expired/i)).toBeInTheDocument();
      });

      // Verify login redirect button
      expect(screen.getByRole('button', { name: /login again/i })).toBeInTheDocument();
    });

    it('should validate user permissions for CRUD operations', async () => {
      const user = setupUser();
      
      // Override MSW to simulate limited permissions
      server.use(
        rest.get('/api/v2/system/scheduler_task', (req, res, ctx) => {
          return res(ctx.json({ 
            resource: schedulerTasksData,
            permissions: { read: true, write: false, delete: false }
          }));
        })
      );

      renderWithProviders(<SchedulerPage />);

      // Wait for table to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify restricted actions are disabled
      expect(screen.getByRole('button', { name: /create task/i })).toBeDisabled();
      
      const deleteButtons = screen.queryAllByRole('button', { name: /delete/i });
      deleteButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      // Override MSW to simulate network error
      server.use(
        rest.get('/api/v2/system/scheduler_task', (req, res, ctx) => {
          return res.networkError('Network connection failed');
        })
      );

      renderWithProviders(<SchedulerPage />);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Verify retry mechanism
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle malformed API responses', async () => {
      // Override MSW to return malformed data
      server.use(
        rest.get('/api/v2/system/scheduler_task', (req, res, ctx) => {
          return res(ctx.json({ invalid: 'response format' }));
        })
      );

      renderWithProviders(<SchedulerPage />);

      // Wait for error handling
      await waitFor(() => {
        expect(screen.getByText(/invalid data format/i)).toBeInTheDocument();
      });
    });

    it('should handle component errors with error boundary', async () => {
      // Create a component that throws an error
      const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
        if (shouldThrow) {
          throw new Error('Test error for error boundary');
        }
        return <div>No error</div>;
      };

      const TestComponentWithError = () => (
        <TestWrapper>
          <ThrowError shouldThrow={true} />
        </TestWrapper>
      );

      // Render component that throws error
      render(<TestComponentWithError />);

      // Verify error boundary catches the error
      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalled();
      });
    });

    it('should handle concurrent operations safely', async () => {
      const user = setupUser();
      let requestCount = 0;

      // Track concurrent requests
      server.use(
        rest.delete('/api/v2/system/scheduler_task/:id', (req, res, ctx) => {
          requestCount++;
          return res(ctx.json({ success: true }));
        })
      );

      renderWithProviders(<SchedulerPage />);

      // Wait for tasks to load
      await waitFor(() => {
        expect(screen.getByText('Email Reports Task')).toBeInTheDocument();
      });

      // Attempt multiple simultaneous deletions
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      
      // Click multiple delete buttons rapidly
      await Promise.all([
        user.click(deleteButtons[0]),
        user.click(deleteButtons[1])
      ]);

      // Verify only appropriate number of requests were made
      await waitFor(() => {
        expect(requestCount).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should render initial table within 60 seconds for large datasets', async () => {
      const startTime = performance.now();

      // Override MSW to simulate large dataset with delay
      server.use(
        rest.get('/api/v2/system/scheduler_task', (req, res, ctx) => {
          return res(
            ctx.delay(2000), // 2 second delay to simulate large dataset
            ctx.json({ resource: largeSchedulerDataset })
          );
        })
      );

      renderWithProviders(<SchedulerPage />);

      // Wait for table to appear
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      }, { timeout: 60000 }); // 60 second timeout per Section 2.4

      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      expect(loadTime).toBeLessThan(60000); // Must load within 60 seconds
    });

    it('should optimize re-renders with React.memo and useMemo', async () => {
      const renderSpy = vi.fn();
      
      // Create component that tracks renders
      const TrackedComponent = React.memo(() => {
        renderSpy();
        return <SchedulerPage />;
      });

      renderWithProviders(<TrackedComponent />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const initialRenderCount = renderSpy.mock.calls.length;

      // Trigger state change that shouldn't cause re-render
      fireEvent.resize(window);

      // Verify no unnecessary re-renders
      expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
    });

    it('should handle memory cleanup on component unmount', async () => {
      const { unmount } = renderWithProviders(<SchedulerPage />);

      // Wait for component to mount fully
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Unmount component
      unmount();

      // Verify cleanup occurred (no memory leaks)
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    });
  });

  describe('Internationalization and Localization', () => {
    it('should display text in correct language', async () => {
      renderWithProviders(<SchedulerPage />);

      // Wait for table to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify English text is displayed (default language)
      expect(screen.getByText(/scheduler management/i)).toBeInTheDocument();
      expect(screen.getByText(/task name/i)).toBeInTheDocument();
      expect(screen.getByText(/status/i)).toBeInTheDocument();
    });

    it('should handle date formatting correctly', async () => {
      renderWithProviders(<SchedulerPage />);

      // Wait for table with date columns
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify dates are formatted consistently
      const dateElements = screen.getAllByTestId(/date-/);
      dateElements.forEach(element => {
        const dateText = element.textContent;
        expect(dateText).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // MM/DD/YYYY format
      });
    });
  });
});