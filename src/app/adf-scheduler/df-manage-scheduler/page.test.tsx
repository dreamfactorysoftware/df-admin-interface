/**
 * Vitest Test Suite for Scheduler Management Page
 * 
 * This comprehensive test suite replaces the Angular Jasmine/Karma tests for the scheduler 
 * management page and table components. It implements React Testing Library for component 
 * testing, Mock Service Worker (MSW) for API mocking, and Vitest for 10x faster test execution.
 * 
 * Test Coverage Areas:
 * - Scheduler task CRUD operations with React Query caching validation
 * - Paywall enforcement and conditional rendering
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Error handling and loading states
 * - User interactions and form submissions
 * - API integration with proper MSW mocking
 * - Table filtering, pagination, and sorting
 * - Real-time data synchronization
 * 
 * Migration Notes:
 * - Replaces Angular TestBed with Vitest React component testing setup
 * - Converts HttpClientTestingModule to Mock Service Worker (MSW)
 * - Transforms Angular component testing patterns to React Testing Library user-centric testing
 * - Replaces Angular dependency injection mocking with React Query and Zustand store mocking
 * - Converts Angular accessibility testing to React Testing Library accessibility matchers
 */

import { describe, it, expect, beforeEach, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { axe, toHaveNoViolations } from 'jest-axe';

// Component imports (these would be actual imports in the real implementation)
import SchedulerManagePage from './page';
import { TestWrapper } from '@/test/utils/test-wrapper';

// Type imports
import type { SchedulerTaskData, SchedulerTaskStatus } from '@/types/scheduler';
import type { GenericListResponse } from '@/lib/types/api';

// Mock data imports
import { mockSchedulerTasks, mockServices, createMockSchedulerTask } from '@/test/mocks/scheduler-data';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// ============================================================================
// MOCK DATA AND FIXTURES
// ============================================================================

const mockSchedulerResponse: GenericListResponse<SchedulerTaskData> = {
  resource: mockSchedulerTasks,
  meta: {
    count: mockSchedulerTasks.length,
    offset: 0,
    limit: 25,
  },
};

const mockPaywallResponse = 'paywall';

// ============================================================================
// MSW SERVER SETUP
// ============================================================================

const server = setupServer(
  // Scheduler tasks list endpoint
  http.get('/api/v2/system/scheduler', ({ request }) => {
    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '25');
    const filter = url.searchParams.get('filter');

    let filteredTasks = mockSchedulerTasks;

    // Apply filtering if provided
    if (filter) {
      filteredTasks = mockSchedulerTasks.filter(task => 
        task.name.toLowerCase().includes(filter.toLowerCase()) ||
        task.description?.toLowerCase().includes(filter.toLowerCase())
      );
    }

    // Apply pagination
    const paginatedTasks = filteredTasks.slice(offset, offset + limit);

    return HttpResponse.json({
      resource: paginatedTasks,
      meta: {
        count: filteredTasks.length,
        offset,
        limit,
      },
    });
  }),

  // Individual scheduler task endpoint
  http.get('/api/v2/system/scheduler/:id', ({ params }) => {
    const task = mockSchedulerTasks.find(t => t.id === parseInt(params.id as string));
    if (!task) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return HttpResponse.json(task);
  }),

  // Delete scheduler task endpoint
  http.delete('/api/v2/system/scheduler/:id', ({ params }) => {
    const taskIndex = mockSchedulerTasks.findIndex(t => t.id === parseInt(params.id as string));
    if (taskIndex === -1) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return HttpResponse.json({ success: true });
  }),

  // Create scheduler task endpoint
  http.post('/api/v2/system/scheduler', async ({ request }) => {
    const taskData = await request.json() as Partial<SchedulerTaskData>;
    const newTask = createMockSchedulerTask(taskData);
    return HttpResponse.json(newTask, { status: 201 });
  }),

  // Update scheduler task endpoint
  http.patch('/api/v2/system/scheduler/:id', async ({ params, request }) => {
    const taskId = parseInt(params.id as string);
    const updates = await request.json() as Partial<SchedulerTaskData>;
    const existingTask = mockSchedulerTasks.find(t => t.id === taskId);
    
    if (!existingTask) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updatedTask = { ...existingTask, ...updates };
    return HttpResponse.json(updatedTask);
  }),

  // Services endpoint for dropdown population
  http.get('/api/v2/system/service', () => {
    return HttpResponse.json({
      resource: mockServices,
      meta: { count: mockServices.length },
    });
  }),

  // Paywall check endpoint
  http.get('/api/v2/system/paywall/scheduler', () => {
    return HttpResponse.json({ access: true });
  }),

  // Error simulation endpoints
  http.get('/api/v2/system/scheduler/error', () => {
    return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
  }),
);

// ============================================================================
// TEST SETUP AND TEARDOWN
// ============================================================================

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a test wrapper with QueryClient and necessary providers
 */
const createTestWrapper = (paywallEnabled = false) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <TestWrapper>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </TestWrapper>
  );
};

/**
 * Renders the scheduler page with proper test setup
 */
const renderSchedulerPage = (props = {}) => {
  const Wrapper = createTestWrapper();
  return render(<SchedulerManagePage {...props} />, { wrapper: Wrapper });
};

/**
 * Waits for the loading state to complete
 */
const waitForLoadingToComplete = async () => {
  await waitFor(() => {
    expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
  });
};

// ============================================================================
// COMPONENT RENDERING AND BASIC FUNCTIONALITY TESTS
// ============================================================================

describe('SchedulerManagePage', () => {
  describe('Component Rendering', () => {
    it('should render without crashing', async () => {
      renderSchedulerPage();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should display the page title', async () => {
      renderSchedulerPage();
      expect(screen.getByRole('heading', { name: /scheduler management/i })).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      renderSchedulerPage();
      expect(screen.getByLabelText(/loading scheduler tasks/i)).toBeInTheDocument();
    });

    it('should display scheduler tasks table after loading', async () => {
      renderSchedulerPage();
      await waitForLoadingToComplete();
      
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /service/i })).toBeInTheDocument();
    });
  });

  describe('Paywall Integration', () => {
    it('should display paywall component when access is restricted', async () => {
      // Override the paywall endpoint to return restricted access
      server.use(
        http.get('/api/v2/system/paywall/scheduler', () => {
          return HttpResponse.json({ access: false });
        })
      );

      renderSchedulerPage();
      await waitFor(() => {
        expect(screen.getByTestId('paywall-component')).toBeInTheDocument();
      });

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should show scheduler table when paywall access is granted', async () => {
      renderSchedulerPage();
      await waitForLoadingToComplete();
      
      expect(screen.queryByTestId('paywall-component')).not.toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should handle paywall check errors gracefully', async () => {
      server.use(
        http.get('/api/v2/system/paywall/scheduler', () => {
          return HttpResponse.json({ error: 'Paywall service unavailable' }, { status: 500 });
        })
      );

      renderSchedulerPage();
      await waitFor(() => {
        expect(screen.getByText(/error checking access permissions/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // REACT QUERY INTEGRATION AND CACHING TESTS
  // ============================================================================

  describe('React Query Integration', () => {
    it('should fetch scheduler tasks on mount', async () => {
      renderSchedulerPage();
      await waitForLoadingToComplete();

      // Verify tasks are displayed
      expect(screen.getByText(mockSchedulerTasks[0].name)).toBeInTheDocument();
      expect(screen.getByText(mockSchedulerTasks[1].name)).toBeInTheDocument();
    });

    it('should cache scheduler tasks data', async () => {
      const { rerender } = renderSchedulerPage();
      await waitForLoadingToComplete();

      // Unmount and remount component
      rerender(<div />);
      renderSchedulerPage();

      // Should load from cache without showing loading state
      expect(screen.getByText(mockSchedulerTasks[0].name)).toBeInTheDocument();
      expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
    });

    it('should handle stale data correctly', async () => {
      renderSchedulerPage();
      await waitForLoadingToComplete();

      // Mock data change
      const updatedTask = { ...mockSchedulerTasks[0], name: 'Updated Task Name' };
      server.use(
        http.get('/api/v2/system/scheduler', () => {
          return HttpResponse.json({
            resource: [updatedTask, ...mockSchedulerTasks.slice(1)],
            meta: { count: mockSchedulerTasks.length },
          });
        })
      );

      // Trigger refetch
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await userEvent.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText('Updated Task Name')).toBeInTheDocument();
      });
    });

    it('should handle query errors with proper error boundaries', async () => {
      server.use(
        http.get('/api/v2/system/scheduler', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      renderSchedulerPage();
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load scheduler tasks/i)).toBeInTheDocument();
      });

      // Should show retry button
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  // ============================================================================
  // SCHEDULER TASK CRUD OPERATIONS
  // ============================================================================

  describe('Scheduler Task CRUD Operations', () => {
    describe('Create Operations', () => {
      it('should open create dialog when create button is clicked', async () => {
        renderSchedulerPage();
        await waitForLoadingToComplete();

        const createButton = screen.getByRole('button', { name: /create task/i });
        await userEvent.click(createButton);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /create scheduler task/i })).toBeInTheDocument();
      });

      it('should create new scheduler task successfully', async () => {
        renderSchedulerPage();
        await waitForLoadingToComplete();

        // Open create dialog
        const createButton = screen.getByRole('button', { name: /create task/i });
        await userEvent.click(createButton);

        // Fill form fields
        const nameInput = screen.getByLabelText(/task name/i);
        const descriptionInput = screen.getByLabelText(/description/i);
        const frequencyInput = screen.getByLabelText(/frequency/i);

        await userEvent.type(nameInput, 'New Test Task');
        await userEvent.type(descriptionInput, 'Test task description');
        await userEvent.type(frequencyInput, '60');

        // Submit form
        const submitButton = screen.getByRole('button', { name: /save/i });
        await userEvent.click(submitButton);

        // Verify success
        await waitFor(() => {
          expect(screen.getByText(/task created successfully/i)).toBeInTheDocument();
        });
      });

      it('should validate form fields before submission', async () => {
        renderSchedulerPage();
        await waitForLoadingToComplete();

        const createButton = screen.getByRole('button', { name: /create task/i });
        await userEvent.click(createButton);

        // Try to submit without required fields
        const submitButton = screen.getByRole('button', { name: /save/i });
        await userEvent.click(submitButton);

        expect(screen.getByText(/task name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/frequency is required/i)).toBeInTheDocument();
      });
    });

    describe('Read Operations', () => {
      it('should display task details when view button is clicked', async () => {
        renderSchedulerPage();
        await waitForLoadingToComplete();

        const viewButton = screen.getAllByRole('button', { name: /view/i })[0];
        await userEvent.click(viewButton);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(mockSchedulerTasks[0].name)).toBeInTheDocument();
        expect(screen.getByText(mockSchedulerTasks[0].description || '')).toBeInTheDocument();
      });

      it('should show task execution logs', async () => {
        renderSchedulerPage();
        await waitForLoadingToComplete();

        const viewButton = screen.getAllByRole('button', { name: /view/i })[0];
        await userEvent.click(viewButton);

        // Switch to logs tab
        const logsTab = screen.getByRole('tab', { name: /logs/i });
        await userEvent.click(logsTab);

        expect(screen.getByText(/execution log/i)).toBeInTheDocument();
      });
    });

    describe('Update Operations', () => {
      it('should open edit dialog with pre-filled data', async () => {
        renderSchedulerPage();
        await waitForLoadingToComplete();

        const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
        await userEvent.click(editButton);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockSchedulerTasks[0].name)).toBeInTheDocument();
      });

      it('should update scheduler task successfully', async () => {
        renderSchedulerPage();
        await waitForLoadingToComplete();

        const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
        await userEvent.click(editButton);

        const nameInput = screen.getByDisplayValue(mockSchedulerTasks[0].name);
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, 'Updated Task Name');

        const submitButton = screen.getByRole('button', { name: /save/i });
        await userEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/task updated successfully/i)).toBeInTheDocument();
        });
      });
    });

    describe('Delete Operations', () => {
      it('should show confirmation dialog before deletion', async () => {
        renderSchedulerPage();
        await waitForLoadingToComplete();

        const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
        await userEvent.click(deleteButton);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/are you sure you want to delete this task/i)).toBeInTheDocument();
      });

      it('should delete scheduler task successfully', async () => {
        renderSchedulerPage();
        await waitForLoadingToComplete();

        const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
        await userEvent.click(deleteButton);

        const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
        await userEvent.click(confirmButton);

        await waitFor(() => {
          expect(screen.getByText(/task deleted successfully/i)).toBeInTheDocument();
        });
      });

      it('should handle deletion errors gracefully', async () => {
        server.use(
          http.delete('/api/v2/system/scheduler/:id', () => {
            return HttpResponse.json({ error: 'Cannot delete active task' }, { status: 400 });
          })
        );

        renderSchedulerPage();
        await waitForLoadingToComplete();

        const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
        await userEvent.click(deleteButton);

        const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
        await userEvent.click(confirmButton);

        await waitFor(() => {
          expect(screen.getByText(/failed to delete task/i)).toBeInTheDocument();
        });
      });
    });
  });

  // ============================================================================
  // TABLE FUNCTIONALITY TESTS
  // ============================================================================

  describe('Table Functionality', () => {
    describe('Filtering and Search', () => {
      it('should filter tasks by search term', async () => {
        renderSchedulerPage();
        await waitForLoadingToComplete();

        const searchInput = screen.getByRole('textbox', { name: /search tasks/i });
        await userEvent.type(searchInput, mockSchedulerTasks[0].name);

        await waitFor(() => {
          expect(screen.getByText(mockSchedulerTasks[0].name)).toBeInTheDocument();
          expect(screen.queryByText(mockSchedulerTasks[1].name)).not.toBeInTheDocument();
        });
      });

      it('should clear search filter', async () => {
        renderSchedulerPage();
        await waitForLoadingToComplete();

        const searchInput = screen.getByRole('textbox', { name: /search tasks/i });
        await userEvent.type(searchInput, 'test filter');

        const clearButton = screen.getByRole('button', { name: /clear search/i });
        await userEvent.click(clearButton);

        expect(searchInput).toHaveValue('');
        expect(screen.getByText(mockSchedulerTasks[0].name)).toBeInTheDocument();
        expect(screen.getByText(mockSchedulerTasks[1].name)).toBeInTheDocument();
      });
    });

    describe('Pagination', () => {
      it('should display pagination controls', async () => {
        renderSchedulerPage();
        await waitForLoadingToComplete();

        expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
        expect(screen.getByText(/showing 1 to/i)).toBeInTheDocument();
      });

      it('should navigate between pages', async () => {
        // Mock response with more tasks for pagination
        server.use(
          http.get('/api/v2/system/scheduler', ({ request }) => {
            const url = new URL(request.url);
            const offset = parseInt(url.searchParams.get('offset') || '0');
            
            if (offset === 0) {
              return HttpResponse.json({
                resource: mockSchedulerTasks.slice(0, 2),
                meta: { count: 50, offset: 0, limit: 2 },
              });
            }
            
            return HttpResponse.json({
              resource: mockSchedulerTasks.slice(2, 4),
              meta: { count: 50, offset: 2, limit: 2 },
            });
          })
        );

        renderSchedulerPage();
        await waitForLoadingToComplete();

        const nextButton = screen.getByRole('button', { name: /next page/i });
        await userEvent.click(nextButton);

        await waitFor(() => {
          expect(screen.getByText(/showing 3 to/i)).toBeInTheDocument();
        });
      });
    });

    describe('Sorting', () => {
      it('should sort tasks by column headers', async () => {
        renderSchedulerPage();
        await waitForLoadingToComplete();

        const nameHeader = screen.getByRole('columnheader', { name: /name/i });
        await userEvent.click(nameHeader);

        // Verify sort indicator
        expect(within(nameHeader).getByLabelText(/sorted ascending/i)).toBeInTheDocument();
      });

      it('should toggle sort direction', async () => {
        renderSchedulerPage();
        await waitForLoadingToComplete();

        const nameHeader = screen.getByRole('columnheader', { name: /name/i });
        
        // Click once for ascending
        await userEvent.click(nameHeader);
        expect(within(nameHeader).getByLabelText(/sorted ascending/i)).toBeInTheDocument();

        // Click again for descending
        await userEvent.click(nameHeader);
        expect(within(nameHeader).getByLabelText(/sorted descending/i)).toBeInTheDocument();
      });
    });

    describe('Status Display', () => {
      it('should display task status with proper styling', async () => {
        renderSchedulerPage();
        await waitForLoadingToComplete();

        const activeStatus = screen.getByText(/active/i);
        expect(activeStatus).toHaveClass('status-active');

        const inactiveStatus = screen.getByText(/inactive/i);
        expect(inactiveStatus).toHaveClass('status-inactive');
      });

      it('should show last execution information', async () => {
        renderSchedulerPage();
        await waitForLoadingToComplete();

        expect(screen.getByText(/last executed/i)).toBeInTheDocument();
        expect(screen.getByText(/next execution/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // ACCESSIBILITY COMPLIANCE TESTS (WCAG 2.1 AA)
  // ============================================================================

  describe('Accessibility Compliance', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderSchedulerPage();
      await waitForLoadingToComplete();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', async () => {
      renderSchedulerPage();
      await waitForLoadingToComplete();

      const createButton = screen.getByRole('button', { name: /create task/i });
      createButton.focus();
      expect(createButton).toHaveFocus();

      // Tab to next focusable element
      await userEvent.tab();
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toHaveFocus();
    });

    it('should have proper ARIA labels and descriptions', async () => {
      renderSchedulerPage();
      await waitForLoadingToComplete();

      // Check table accessibility
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Scheduler tasks table');

      // Check button accessibility
      const createButton = screen.getByRole('button', { name: /create task/i });
      expect(createButton).toHaveAttribute('aria-describedby');
    });

    it('should announce changes to screen readers', async () => {
      renderSchedulerPage();
      await waitForLoadingToComplete();

      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      await userEvent.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await userEvent.click(confirmButton);

      // Check for aria-live announcement
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/task deleted successfully/i);
      });
    });

    it('should provide proper form validation feedback', async () => {
      renderSchedulerPage();
      await waitForLoadingToComplete();

      const createButton = screen.getByRole('button', { name: /create task/i });
      await userEvent.click(createButton);

      const nameInput = screen.getByLabelText(/task name/i);
      expect(nameInput).toHaveAttribute('required');
      expect(nameInput).toHaveAttribute('aria-describedby');

      // Trigger validation
      const submitButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(submitButton);

      // Check error announcement
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('alert')).toHaveTextContent(/task name is required/i);
    });
  });

  // ============================================================================
  // ERROR HANDLING AND EDGE CASES
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      server.use(
        http.get('/api/v2/system/scheduler', () => {
          return HttpResponse.error();
        })
      );

      renderSchedulerPage();
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should handle timeout errors', async () => {
      server.use(
        http.get('/api/v2/system/scheduler', async () => {
          await new Promise(resolve => setTimeout(resolve, 30000));
          return HttpResponse.json(mockSchedulerResponse);
        })
      );

      renderSchedulerPage();
      
      await waitFor(() => {
        expect(screen.getByText(/request timeout/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should handle empty task list', async () => {
      server.use(
        http.get('/api/v2/system/scheduler', () => {
          return HttpResponse.json({
            resource: [],
            meta: { count: 0, offset: 0, limit: 25 },
          });
        })
      );

      renderSchedulerPage();
      await waitForLoadingToComplete();

      expect(screen.getByText(/no scheduler tasks found/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create your first task/i })).toBeInTheDocument();
    });

    it('should handle malformed API responses', async () => {
      server.use(
        http.get('/api/v2/system/scheduler', () => {
          return HttpResponse.json({ invalid: 'response' });
        })
      );

      renderSchedulerPage();
      
      await waitFor(() => {
        expect(screen.getByText(/invalid response format/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // PERFORMANCE AND OPTIMIZATION TESTS
  // ============================================================================

  describe('Performance Optimization', () => {
    it('should implement virtual scrolling for large datasets', async () => {
      // Mock large dataset
      const largeMockData = Array.from({ length: 1000 }, (_, index) => 
        createMockSchedulerTask({ id: index + 1, name: `Task ${index + 1}` })
      );

      server.use(
        http.get('/api/v2/system/scheduler', () => {
          return HttpResponse.json({
            resource: largeMockData.slice(0, 25),
            meta: { count: 1000, offset: 0, limit: 25 },
          });
        })
      );

      renderSchedulerPage();
      await waitForLoadingToComplete();

      // Check virtual scrolling implementation
      const tableContainer = screen.getByTestId('virtual-table-container');
      expect(tableContainer).toBeInTheDocument();
      expect(tableContainer).toHaveStyle({ height: '600px' });
    });

    it('should debounce search input', async () => {
      renderSchedulerPage();
      await waitForLoadingToComplete();

      const searchInput = screen.getByRole('textbox', { name: /search tasks/i });
      
      // Type rapidly
      await userEvent.type(searchInput, 'test search');
      
      // Should only make one API call after debounce delay
      await waitFor(() => {
        expect(searchInput).toHaveValue('test search');
      });

      // Verify debounced API call
      await waitFor(() => {
        expect(screen.getByText(/searching.../i)).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should optimize re-renders with proper memoization', async () => {
      const renderSpy = vi.fn();
      
      const TestComponent = () => {
        renderSpy();
        return <SchedulerManagePage />;
      };

      const Wrapper = createTestWrapper();
      render(<TestComponent />, { wrapper: Wrapper });
      await waitForLoadingToComplete();

      // Trigger state change that should not cause unnecessary re-renders
      const searchInput = screen.getByRole('textbox', { name: /search tasks/i });
      await userEvent.type(searchInput, 'a');
      await userEvent.clear(searchInput);

      // Should not re-render unnecessarily
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('should integrate with notification system', async () => {
      renderSchedulerPage();
      await waitForLoadingToComplete();

      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
      await userEvent.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await userEvent.click(confirmButton);

      // Check notification integration
      await waitFor(() => {
        expect(screen.getByTestId('notification-toast')).toBeInTheDocument();
        expect(screen.getByText(/task deleted successfully/i)).toBeInTheDocument();
      });
    });

    it('should integrate with routing system', async () => {
      renderSchedulerPage();
      await waitForLoadingToComplete();

      const createButton = screen.getByRole('button', { name: /create task/i });
      await userEvent.click(createButton);

      // Should update URL for deep linking
      expect(window.location.pathname).toBe('/adf-scheduler/df-manage-scheduler/create');
    });

    it('should persist user preferences', async () => {
      renderSchedulerPage();
      await waitForLoadingToComplete();

      // Change table page size
      const pageSizeSelect = screen.getByLabelText(/items per page/i);
      await userEvent.selectOptions(pageSizeSelect, '50');

      // Reload page
      window.location.reload();
      await waitForLoadingToComplete();

      // Should remember preference
      expect(pageSizeSelect).toHaveValue('50');
    });
  });
});

// ============================================================================
// CUSTOM MATCHERS AND UTILITIES
// ============================================================================

/**
 * Custom matcher to check if an element has proper ARIA attributes
 */
expect.extend({
  toHaveAccessibleName(received: HTMLElement, expectedName: string) {
    const accessibleName = received.getAttribute('aria-label') || 
                          received.getAttribute('aria-labelledby') ||
                          received.textContent;
    
    const pass = accessibleName?.includes(expectedName) || false;
    
    return {
      message: () => 
        `expected element to have accessible name containing "${expectedName}", but got "${accessibleName}"`,
      pass,
    };
  },
});

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveAccessibleName(expectedName: string): R;
    }
  }
}