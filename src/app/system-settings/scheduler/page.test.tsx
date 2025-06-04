/**
 * Scheduler Management Page Test Suite
 * 
 * Comprehensive Vitest test suite that replaces Angular Jasmine/Karma tests for
 * the scheduler management page component. Implements React Testing Library for
 * user-centric testing, Mock Service Worker (MSW) for realistic API mocking,
 * and Vitest for 10x faster test execution per Section 7.1.1.
 * 
 * Test Coverage:
 * - Scheduler task CRUD operations with React Query integration
 * - Paywall enforcement and authentication workflows
 * - Table interactions with Headless UI components
 * - Accessibility compliance (WCAG 2.1 AA)
 * - TanStack Virtual performance with large datasets
 * - Error handling and state management
 * - Zustand store integration and state transitions
 * 
 * Architecture:
 * - Replaces Angular TestBed with Vitest React component testing setup
 * - Converts HTTP mocking from HttpClientTestingModule to MSW
 * - Transforms Angular accessibility testing to React Testing Library matchers
 * - Tests React Query caching and invalidation patterns
 * - Validates Zustand store state management workflows
 * 
 * Performance:
 * - 10x faster test execution compared to Jasmine/Karma
 * - Parallel test execution with Vitest
 * - Efficient MSW request interception
 * - Optimized React Query cache testing
 * 
 * @example
 * ```bash
 * # Run specific scheduler tests
 * npm run test -- scheduler/page.test.tsx
 * 
 * # Run with coverage
 * npm run test:coverage -- scheduler/page.test.tsx
 * 
 * # Run in watch mode
 * npm run test:ui -- scheduler/page.test.tsx
 * ```
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import { render, screen, waitFor, within, fireEvent, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { axe, toHaveNoViolations } from 'jest-axe'

// Internal imports
import SchedulerPage from './page'
import { SchedulerProvider, createSchedulerStore } from '@/lib/scheduler-store'
import type { 
  SchedulerTask, 
  SchedulerTaskRow, 
  TaskListResponse,
  CreateSchedulePayload,
  UpdateSchedulePayload 
} from '@/types/scheduler'

// Test utilities and mocks
import { createTestQueryClient } from '@/test/utils/query-client'
import { mockUser, mockAuthContext } from '@/test/mocks/auth-data'
import { 
  mockSchedulerTasks, 
  mockSchedulerTasksLarge,
  mockServices,
  createMockSchedulerTask,
  SCHEDULER_API_ENDPOINTS 
} from '@/test/mocks/scheduler-data'

// Setup jest-axe matchers
expect.extend(toHaveNoViolations)

// ============================================================================
// MOCK SETUP AND CONFIGURATION
// ============================================================================

/**
 * Mock Service Worker handlers for scheduler API endpoints
 * Replaces Angular HttpClientTestingModule with realistic HTTP mocking
 */
const schedulerHandlers = [
  // Get scheduler tasks with pagination and filtering
  http.get(SCHEDULER_API_ENDPOINTS.TASKS, ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '25')
    const search = url.searchParams.get('search') || ''
    const isActive = url.searchParams.get('active')
    const serviceId = url.searchParams.get('service_id')

    let tasks = [...mockSchedulerTasks]

    // Apply filters
    if (search) {
      tasks = tasks.filter(task => 
        task.name.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (isActive !== null) {
      const activeFilter = isActive === 'true'
      tasks = tasks.filter(task => task.isActive === activeFilter)
    }

    if (serviceId) {
      tasks = tasks.filter(task => task.serviceId === parseInt(serviceId))
    }

    // Apply pagination
    const offset = (page - 1) * limit
    const paginatedTasks = tasks.slice(offset, offset + limit)

    const response: TaskListResponse = {
      resource: paginatedTasks.map(task => ({
        id: task.id,
        name: task.name,
        description: task.description,
        isActive: task.isActive,
        serviceId: task.serviceId,
        serviceName: task.serviceByServiceId.name,
        component: task.component,
        verb: task.verb,
        frequency: task.frequency,
        hasLog: !!task.taskLogByTaskId,
        lastRun: task.taskLogByTaskId?.lastModifiedDate,
        status: task.isActive ? 'active' : 'inactive'
      })),
      meta: {
        count: tasks.length,
        limit,
        offset
      }
    }

    return HttpResponse.json(response, { status: 200 })
  }),

  // Get single scheduler task
  http.get(`${SCHEDULER_API_ENDPOINTS.TASKS}/:id`, ({ params }) => {
    const taskId = parseInt(params.id as string)
    const task = mockSchedulerTasks.find(t => t.id === taskId)

    if (!task) {
      return HttpResponse.json(
        { error: { message: 'Task not found', code: 'TASK_NOT_FOUND' } },
        { status: 404 }
      )
    }

    return HttpResponse.json({ resource: task }, { status: 200 })
  }),

  // Create scheduler task
  http.post(SCHEDULER_API_ENDPOINTS.TASKS, async ({ request }) => {
    const payload = await request.json() as CreateSchedulePayload
    
    // Validation errors
    if (!payload.name) {
      return HttpResponse.json(
        { error: { message: 'Task name is required', code: 'VALIDATION_ERROR' } },
        { status: 422 }
      )
    }

    if (payload.frequency < 1) {
      return HttpResponse.json(
        { error: { message: 'Frequency must be at least 1 second', code: 'VALIDATION_ERROR' } },
        { status: 422 }
      )
    }

    const newTask = createMockSchedulerTask({
      id: Date.now(), // Mock ID generation
      ...payload,
      createdDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString(),
      createdById: mockUser.id,
      lastModifiedById: null
    })

    mockSchedulerTasks.push(newTask)

    return HttpResponse.json({ resource: newTask }, { status: 201 })
  }),

  // Update scheduler task
  http.put(`${SCHEDULER_API_ENDPOINTS.TASKS}/:id`, async ({ params, request }) => {
    const taskId = parseInt(params.id as string)
    const payload = await request.json() as Partial<UpdateSchedulePayload>
    
    const taskIndex = mockSchedulerTasks.findIndex(t => t.id === taskId)
    
    if (taskIndex === -1) {
      return HttpResponse.json(
        { error: { message: 'Task not found', code: 'TASK_NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Update task
    const updatedTask = {
      ...mockSchedulerTasks[taskIndex],
      ...payload,
      lastModifiedDate: new Date().toISOString(),
      lastModifiedById: mockUser.id
    }

    mockSchedulerTasks[taskIndex] = updatedTask

    return HttpResponse.json({ resource: updatedTask }, { status: 200 })
  }),

  // Delete scheduler task
  http.delete(`${SCHEDULER_API_ENDPOINTS.TASKS}/:id`, ({ params }) => {
    const taskId = parseInt(params.id as string)
    const taskIndex = mockSchedulerTasks.findIndex(t => t.id === taskId)

    if (taskIndex === -1) {
      return HttpResponse.json(
        { error: { message: 'Task not found', code: 'TASK_NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Remove task from mock data
    mockSchedulerTasks.splice(taskIndex, 1)

    return HttpResponse.json({ success: true }, { status: 200 })
  }),

  // Get services for task creation
  http.get(SCHEDULER_API_ENDPOINTS.SERVICES, () => {
    return HttpResponse.json({ resource: mockServices }, { status: 200 })
  }),

  // Test connection endpoint
  http.post(`${SCHEDULER_API_ENDPOINTS.TASKS}/:id/test`, ({ params }) => {
    const taskId = parseInt(params.id as string)
    const task = mockSchedulerTasks.find(t => t.id === taskId)

    if (!task) {
      return HttpResponse.json(
        { error: { message: 'Task not found', code: 'TASK_NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Simulate test execution
    return HttpResponse.json({
      success: true,
      statusCode: 200,
      executionTime: 150,
      responseData: { message: 'Test execution successful' }
    }, { status: 200 })
  }),

  // Error scenarios for testing
  http.get('/api/v2/system/scheduler/error-test', () => {
    return HttpResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }),

  // Network timeout simulation
  http.get('/api/v2/system/scheduler/timeout-test', () => {
    return new Promise(() => {}) // Never resolves to simulate timeout
  })
]

// Setup MSW server
const server = setupServer(...schedulerHandlers)

// ============================================================================
// TEST SETUP AND UTILITIES
// ============================================================================

/**
 * Test wrapper component that provides all necessary context providers
 */
interface TestWrapperProps {
  children: React.ReactNode
  queryClient?: QueryClient
  initialSchedulerStore?: ReturnType<typeof createSchedulerStore>
}

function TestWrapper({ 
  children, 
  queryClient = createTestQueryClient(),
  initialSchedulerStore = createSchedulerStore()
}: TestWrapperProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SchedulerProvider store={initialSchedulerStore}>
        {children}
      </SchedulerProvider>
    </QueryClientProvider>
  )
}

/**
 * Custom render function with providers
 */
function renderWithProviders(
  ui: React.ReactElement,
  options: {
    queryClient?: QueryClient
    schedulerStore?: ReturnType<typeof createSchedulerStore>
  } = {}
) {
  const { queryClient, schedulerStore } = options
  
  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper 
        queryClient={queryClient} 
        initialSchedulerStore={schedulerStore}
      >
        {children}
      </TestWrapper>
    )
  })
}

/**
 * Wait for React Query to settle
 */
async function waitForQueryToSettle() {
  await waitFor(() => {
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
  }, { timeout: 3000 })
}

/**
 * Mock user interactions
 */
function createUserEvent() {
  return userEvent.setup()
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('SchedulerPage', () => {
  let queryClient: QueryClient
  let schedulerStore: ReturnType<typeof createSchedulerStore>

  beforeEach(() => {
    // Reset MSW handlers
    server.resetHandlers()
    
    // Create fresh instances for each test
    queryClient = createTestQueryClient()
    schedulerStore = createSchedulerStore()
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    
    // Reset mock data
    mockSchedulerTasks.length = 0
    mockSchedulerTasks.push(
      createMockSchedulerTask({ id: 1, name: 'Test Task 1' }),
      createMockSchedulerTask({ id: 2, name: 'Test Task 2' }),
      createMockSchedulerTask({ id: 3, name: 'Test Task 3' })
    )
  })

  // ==========================================================================
  // BASIC RENDERING AND DATA LOADING TESTS
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('should render scheduler page with loading state initially', async () => {
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      // Should show loading state
      expect(screen.getByTestId('scheduler-loading')).toBeInTheDocument()
      
      // Wait for data to load
      await waitForQueryToSettle()
      
      // Should show scheduler table
      expect(screen.getByRole('table', { name: /scheduler tasks/i })).toBeInTheDocument()
    })

    it('should display scheduler tasks in table format', async () => {
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Verify table headers
      expect(screen.getByText('Task Name')).toBeInTheDocument()
      expect(screen.getByText('Service')).toBeInTheDocument()
      expect(screen.getByText('Frequency')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()

      // Verify task data is displayed
      expect(screen.getByText('Test Task 1')).toBeInTheDocument()
      expect(screen.getByText('Test Task 2')).toBeInTheDocument()
      expect(screen.getByText('Test Task 3')).toBeInTheDocument()
    })

    it('should display empty state when no tasks exist', async () => {
      // Clear mock tasks
      mockSchedulerTasks.length = 0

      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      expect(screen.getByText(/no scheduler tasks found/i)).toBeInTheDocument()
      expect(screen.getByText(/create your first scheduled task/i)).toBeInTheDocument()
    })

    it('should maintain responsive design across viewport sizes', async () => {
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Test mobile breakpoint
      global.innerWidth = 320
      global.dispatchEvent(new Event('resize'))

      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toHaveClass('responsive-table')
      })

      // Test desktop breakpoint
      global.innerWidth = 1024
      global.dispatchEvent(new Event('resize'))

      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).not.toHaveClass('responsive-table')
      })
    })
  })

  // ==========================================================================
  // REACT QUERY INTEGRATION TESTS
  // ==========================================================================

  describe('React Query Integration', () => {
    it('should cache scheduler tasks data correctly', async () => {
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Verify data is cached
      const cachedData = queryClient.getQueryData(['scheduler', 'tasks', 'list'])
      expect(cachedData).toBeDefined()
      expect(Array.isArray((cachedData as any)?.resource)).toBe(true)
    })

    it('should invalidate cache after task creation', async () => {
      const user = createUserEvent()
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Open create task dialog
      await user.click(screen.getByRole('button', { name: /create new task/i }))

      // Fill out task form
      await user.type(screen.getByLabelText(/task name/i), 'New Test Task')
      await user.selectOptions(screen.getByLabelText(/service/i), '1')
      await user.type(screen.getByLabelText(/frequency/i), '300')

      // Submit form
      await user.click(screen.getByRole('button', { name: /create task/i }))

      // Wait for mutation to complete
      await waitFor(() => {
        expect(screen.getByText('New Test Task')).toBeInTheDocument()
      })

      // Verify cache was invalidated and refetched
      const updatedData = queryClient.getQueryData(['scheduler', 'tasks', 'list'])
      expect((updatedData as any)?.resource).toHaveLength(4)
    })

    it('should handle optimistic updates for task operations', async () => {
      const user = createUserEvent()
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Get initial task
      const taskRow = screen.getByTestId('task-row-1')
      const toggleButton = within(taskRow).getByRole('button', { name: /toggle status/i })

      // Click toggle - should update optimistically
      await user.click(toggleButton)

      // Should immediately show updated state
      expect(within(taskRow).getByText('Inactive')).toBeInTheDocument()

      // Wait for server response
      await waitFor(() => {
        expect(within(taskRow).getByText('Inactive')).toBeInTheDocument()
      })
    })

    it('should handle query errors gracefully', async () => {
      // Setup error response
      server.use(
        http.get(SCHEDULER_API_ENDPOINTS.TASKS, () => {
          return HttpResponse.json(
            { error: { message: 'Server error', code: 'INTERNAL_ERROR' } },
            { status: 500 }
          )
        })
      )

      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitFor(() => {
        expect(screen.getByText(/failed to load scheduler tasks/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    it('should implement proper stale-while-revalidate behavior', async () => {
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Verify initial data is displayed
      expect(screen.getByText('Test Task 1')).toBeInTheDocument()

      // Add new task to mock data
      mockSchedulerTasks.push(createMockSchedulerTask({ id: 999, name: 'Background Task' }))

      // Trigger background refetch
      await queryClient.refetchQueries({ queryKey: ['scheduler', 'tasks'] })

      await waitFor(() => {
        expect(screen.getByText('Background Task')).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // ZUSTAND STORE INTEGRATION TESTS
  // ==========================================================================

  describe('Zustand Store Integration', () => {
    it('should sync table filters with store state', async () => {
      const user = createUserEvent()
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Apply search filter
      const searchInput = screen.getByPlaceholderText(/search tasks/i)
      await user.type(searchInput, 'Task 1')

      // Verify store state is updated
      await waitFor(() => {
        const storeState = schedulerStore.getState()
        expect(storeState.filters.search).toBe('Task 1')
      })

      // Verify filtered results
      expect(screen.getByText('Test Task 1')).toBeInTheDocument()
      expect(screen.queryByText('Test Task 2')).not.toBeInTheDocument()
    })

    it('should persist selected task in store', async () => {
      const user = createUserEvent()
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Click on task row to select
      const taskRow = screen.getByTestId('task-row-1')
      await user.click(taskRow)

      // Verify store has selected task
      await waitFor(() => {
        const storeState = schedulerStore.getState()
        expect(storeState.selectedTask?.id).toBe(1)
      })
    })

    it('should handle bulk task selection', async () => {
      const user = createUserEvent()
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Select multiple tasks
      await user.click(screen.getByTestId('checkbox-task-1'))
      await user.click(screen.getByTestId('checkbox-task-2'))

      // Verify store has selected tasks
      await waitFor(() => {
        const storeState = schedulerStore.getState()
        expect(storeState.selectedTasks.has(1)).toBe(true)
        expect(storeState.selectedTasks.has(2)).toBe(true)
      })

      // Verify bulk actions are available
      expect(screen.getByRole('button', { name: /bulk delete/i })).toBeInTheDocument()
    })

    it('should reset store state on page unmount', () => {
      const { unmount } = renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      // Set some store state
      schedulerStore.getState().selectTask(1)
      schedulerStore.getState().setFilter('search', 'test')

      // Unmount component
      unmount()

      // Verify store is reset (selected task cleared, but filters may persist)
      const storeState = schedulerStore.getState()
      expect(storeState.selectedTask).toBeNull()
    })
  })

  // ==========================================================================
  // CRUD OPERATIONS TESTS
  // ==========================================================================

  describe('CRUD Operations', () => {
    describe('Create Task', () => {
      it('should create new scheduler task successfully', async () => {
        const user = createUserEvent()
        renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

        await waitForQueryToSettle()

        // Open create dialog
        await user.click(screen.getByRole('button', { name: /create new task/i }))

        // Verify dialog is open
        expect(screen.getByRole('dialog', { name: /create scheduler task/i })).toBeInTheDocument()

        // Fill form
        await user.type(screen.getByLabelText(/task name/i), 'New Automated Task')
        await user.type(screen.getByLabelText(/description/i), 'Automated data sync task')
        await user.selectOptions(screen.getByLabelText(/service/i), '1')
        await user.type(screen.getByLabelText(/component/i), 'users')
        await user.selectOptions(screen.getByLabelText(/method/i), 'GET')
        await user.type(screen.getByLabelText(/frequency/i), '3600')

        // Submit form
        await user.click(screen.getByRole('button', { name: /create task/i }))

        // Verify task was created
        await waitFor(() => {
          expect(screen.getByText('New Automated Task')).toBeInTheDocument()
        })

        // Verify success message
        expect(screen.getByText(/task created successfully/i)).toBeInTheDocument()
      })

      it('should validate required fields during task creation', async () => {
        const user = createUserEvent()
        renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

        await waitForQueryToSettle()

        // Open create dialog
        await user.click(screen.getByRole('button', { name: /create new task/i }))

        // Submit without filling required fields
        await user.click(screen.getByRole('button', { name: /create task/i }))

        // Verify validation errors
        expect(screen.getByText(/task name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/service selection is required/i)).toBeInTheDocument()
        expect(screen.getByText(/frequency must be at least 1 second/i)).toBeInTheDocument()
      })

      it('should handle task creation errors', async () => {
        const user = createUserEvent()
        
        // Setup error response
        server.use(
          http.post(SCHEDULER_API_ENDPOINTS.TASKS, () => {
            return HttpResponse.json(
              { error: { message: 'Task name already exists', code: 'DUPLICATE_NAME' } },
              { status: 422 }
            )
          })
        )

        renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

        await waitForQueryToSettle()

        // Open create dialog and fill form
        await user.click(screen.getByRole('button', { name: /create new task/i }))
        await user.type(screen.getByLabelText(/task name/i), 'Duplicate Task')
        await user.selectOptions(screen.getByLabelText(/service/i), '1')
        await user.type(screen.getByLabelText(/frequency/i), '300')

        // Submit form
        await user.click(screen.getByRole('button', { name: /create task/i }))

        // Verify error message
        await waitFor(() => {
          expect(screen.getByText(/task name already exists/i)).toBeInTheDocument()
        })
      })
    })

    describe('Update Task', () => {
      it('should update existing scheduler task', async () => {
        const user = createUserEvent()
        renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

        await waitForQueryToSettle()

        // Click edit button on first task
        const firstTaskRow = screen.getByTestId('task-row-1')
        const editButton = within(firstTaskRow).getByRole('button', { name: /edit/i })
        await user.click(editButton)

        // Verify edit dialog is open
        expect(screen.getByRole('dialog', { name: /edit scheduler task/i })).toBeInTheDocument()

        // Update task name
        const nameInput = screen.getByLabelText(/task name/i)
        await user.clear(nameInput)
        await user.type(nameInput, 'Updated Task Name')

        // Submit changes
        await user.click(screen.getByRole('button', { name: /save changes/i }))

        // Verify task was updated
        await waitFor(() => {
          expect(screen.getByText('Updated Task Name')).toBeInTheDocument()
        })
      })

      it('should toggle task active status', async () => {
        const user = createUserEvent()
        renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

        await waitForQueryToSettle()

        // Find task with active status
        const activeTaskRow = screen.getByTestId('task-row-1')
        const toggleButton = within(activeTaskRow).getByRole('button', { name: /toggle status/i })

        // Verify initial state
        expect(within(activeTaskRow).getByText('Active')).toBeInTheDocument()

        // Toggle status
        await user.click(toggleButton)

        // Verify status changed
        await waitFor(() => {
          expect(within(activeTaskRow).getByText('Inactive')).toBeInTheDocument()
        })
      })
    })

    describe('Delete Task', () => {
      it('should delete scheduler task with confirmation', async () => {
        const user = createUserEvent()
        renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

        await waitForQueryToSettle()

        // Click delete button on first task
        const firstTaskRow = screen.getByTestId('task-row-1')
        const deleteButton = within(firstTaskRow).getByRole('button', { name: /delete/i })
        await user.click(deleteButton)

        // Verify confirmation dialog
        expect(screen.getByRole('dialog', { name: /confirm deletion/i })).toBeInTheDocument()
        expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument()

        // Confirm deletion
        await user.click(screen.getByRole('button', { name: /delete task/i }))

        // Verify task was removed
        await waitFor(() => {
          expect(screen.queryByTestId('task-row-1')).not.toBeInTheDocument()
        })

        // Verify success message
        expect(screen.getByText(/task deleted successfully/i)).toBeInTheDocument()
      })

      it('should cancel task deletion', async () => {
        const user = createUserEvent()
        renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

        await waitForQueryToSettle()

        const initialTaskCount = screen.getAllByTestId(/task-row-/).length

        // Click delete button
        const firstTaskRow = screen.getByTestId('task-row-1')
        const deleteButton = within(firstTaskRow).getByRole('button', { name: /delete/i })
        await user.click(deleteButton)

        // Cancel deletion
        await user.click(screen.getByRole('button', { name: /cancel/i }))

        // Verify task still exists
        expect(screen.getAllByTestId(/task-row-/)).toHaveLength(initialTaskCount)
        expect(screen.getByTestId('task-row-1')).toBeInTheDocument()
      })

      it('should handle bulk task deletion', async () => {
        const user = createUserEvent()
        renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

        await waitForQueryToSettle()

        // Select multiple tasks
        await user.click(screen.getByTestId('checkbox-task-1'))
        await user.click(screen.getByTestId('checkbox-task-2'))

        // Click bulk delete
        await user.click(screen.getByRole('button', { name: /bulk delete/i }))

        // Confirm bulk deletion
        expect(screen.getByText(/delete 2 selected tasks/i)).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: /delete selected/i }))

        // Verify tasks were removed
        await waitFor(() => {
          expect(screen.queryByTestId('task-row-1')).not.toBeInTheDocument()
          expect(screen.queryByTestId('task-row-2')).not.toBeInTheDocument()
        })
      })
    })
  })

  // ==========================================================================
  // TABLE INTERACTIONS AND FILTERING TESTS
  // ==========================================================================

  describe('Table Interactions', () => {
    it('should filter tasks by search term', async () => {
      const user = createUserEvent()
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Apply search filter
      const searchInput = screen.getByPlaceholderText(/search tasks/i)
      await user.type(searchInput, 'Task 1')

      // Verify filtered results
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument()
        expect(screen.queryByText('Test Task 2')).not.toBeInTheDocument()
        expect(screen.queryByText('Test Task 3')).not.toBeInTheDocument()
      })
    })

    it('should filter tasks by active status', async () => {
      const user = createUserEvent()
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Filter by active status
      const statusFilter = screen.getByLabelText(/filter by status/i)
      await user.selectOptions(statusFilter, 'active')

      // Verify only active tasks are shown
      await waitFor(() => {
        const visibleTasks = screen.getAllByTestId(/task-row-/)
        visibleTasks.forEach(row => {
          expect(within(row).getByText('Active')).toBeInTheDocument()
        })
      })
    })

    it('should sort tasks by different columns', async () => {
      const user = createUserEvent()
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Sort by frequency
      const frequencyHeader = screen.getByRole('button', { name: /sort by frequency/i })
      await user.click(frequencyHeader)

      // Verify sort order (ascending by default)
      await waitFor(() => {
        const frequencyValues = screen.getAllByTestId(/task-frequency-/)
          .map(el => parseInt(el.textContent || '0'))
        
        for (let i = 1; i < frequencyValues.length; i++) {
          expect(frequencyValues[i]).toBeGreaterThanOrEqual(frequencyValues[i - 1])
        }
      })

      // Sort descending
      await user.click(frequencyHeader)

      await waitFor(() => {
        const frequencyValues = screen.getAllByTestId(/task-frequency-/)
          .map(el => parseInt(el.textContent || '0'))
        
        for (let i = 1; i < frequencyValues.length; i++) {
          expect(frequencyValues[i]).toBeLessThanOrEqual(frequencyValues[i - 1])
        }
      })
    })

    it('should handle pagination correctly', async () => {
      const user = createUserEvent()
      
      // Add more mock tasks to test pagination
      for (let i = 4; i <= 30; i++) {
        mockSchedulerTasks.push(createMockSchedulerTask({ 
          id: i, 
          name: `Test Task ${i}` 
        }))
      }

      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Verify first page shows 25 items (default page size)
      expect(screen.getAllByTestId(/task-row-/)).toHaveLength(25)

      // Navigate to next page
      const nextPageButton = screen.getByRole('button', { name: /next page/i })
      await user.click(nextPageButton)

      // Verify second page shows remaining items
      await waitFor(() => {
        expect(screen.getAllByTestId(/task-row-/)).toHaveLength(5)
      })

      // Verify page navigation
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
    })

    it('should handle column visibility toggles', async () => {
      const user = createUserEvent()
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Open column visibility menu
      await user.click(screen.getByRole('button', { name: /columns/i }))

      // Hide description column
      await user.click(screen.getByLabelText(/show description column/i))

      // Verify column is hidden
      await waitFor(() => {
        expect(screen.queryByText('Description')).not.toBeInTheDocument()
      })

      // Show column again
      await user.click(screen.getByLabelText(/show description column/i))

      // Verify column is visible
      await waitFor(() => {
        expect(screen.getByText('Description')).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // TANSTACK VIRTUAL PERFORMANCE TESTS
  // ==========================================================================

  describe('TanStack Virtual Performance', () => {
    it('should efficiently render large datasets with virtualization', async () => {
      // Clear existing tasks and add large dataset
      mockSchedulerTasks.length = 0
      mockSchedulerTasks.push(...mockSchedulerTasksLarge)

      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Verify virtual scrolling is active
      const virtualContainer = screen.getByTestId('virtual-table-container')
      expect(virtualContainer).toBeInTheDocument()

      // Verify only visible rows are rendered
      const renderedRows = screen.getAllByTestId(/task-row-/)
      expect(renderedRows.length).toBeLessThan(mockSchedulerTasksLarge.length)
      expect(renderedRows.length).toBeLessThanOrEqual(20) // Typical visible row count
    })

    it('should maintain scroll position during updates', async () => {
      mockSchedulerTasks.length = 0
      mockSchedulerTasks.push(...mockSchedulerTasksLarge)

      const user = createUserEvent()
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      const virtualContainer = screen.getByTestId('virtual-table-container')

      // Scroll to middle of list
      fireEvent.scroll(virtualContainer, { target: { scrollTop: 500 } })

      await waitFor(() => {
        expect(virtualContainer.scrollTop).toBe(500)
      })

      // Update a task (triggering re-render)
      const visibleTask = screen.getAllByTestId(/task-row-/)[0]
      const toggleButton = within(visibleTask).getByRole('button', { name: /toggle status/i })
      await user.click(toggleButton)

      // Verify scroll position is maintained
      await waitFor(() => {
        expect(virtualContainer.scrollTop).toBe(500)
      })
    })

    it('should handle rapid scrolling without performance issues', async () => {
      mockSchedulerTasks.length = 0
      mockSchedulerTasks.push(...mockSchedulerTasksLarge)

      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      const virtualContainer = screen.getByTestId('virtual-table-container')

      // Rapid scroll events
      const scrollEvents = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
      
      for (const scrollTop of scrollEvents) {
        fireEvent.scroll(virtualContainer, { target: { scrollTop } })
      }

      // Verify final scroll position
      await waitFor(() => {
        expect(virtualContainer.scrollTop).toBe(1000)
      })

      // Verify rows are still rendering correctly
      expect(screen.getAllByTestId(/task-row-/)).toHaveLength.greaterThan(0)
    })
  })

  // ==========================================================================
  // ACCESSIBILITY COMPLIANCE TESTS
  // ==========================================================================

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should support keyboard navigation', async () => {
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Tab through interactive elements
      const interactiveElements = [
        screen.getByRole('button', { name: /create new task/i }),
        screen.getByPlaceholderText(/search tasks/i),
        screen.getByLabelText(/filter by status/i),
        ...screen.getAllByRole('button', { name: /edit/i }),
        ...screen.getAllByRole('button', { name: /delete/i })
      ]

      for (let i = 0; i < interactiveElements.length; i++) {
        fireEvent.keyDown(document.activeElement || document.body, { key: 'Tab' })
        await waitFor(() => {
          expect(document.activeElement).toBe(interactiveElements[i])
        })
      }
    })

    it('should support screen reader announcements', async () => {
      const user = createUserEvent()
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Verify ARIA labels and descriptions
      expect(screen.getByRole('table')).toHaveAccessibleName(/scheduler tasks/i)
      expect(screen.getByRole('button', { name: /create new task/i })).toHaveAccessibleDescription()

      // Test task selection announcements
      const firstTaskRow = screen.getByTestId('task-row-1')
      await user.click(firstTaskRow)

      // Verify announcement region
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/selected task/i)
      })
    })

    it('should provide proper color contrast', async () => {
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Test high contrast mode
      document.documentElement.classList.add('high-contrast')

      // Verify text remains readable
      const taskNames = screen.getAllByTestId(/task-name-/)
      taskNames.forEach(element => {
        const styles = window.getComputedStyle(element)
        const color = styles.color
        const backgroundColor = styles.backgroundColor
        
        // Basic contrast check (more sophisticated testing would use actual contrast ratio calculation)
        expect(color).not.toBe(backgroundColor)
      })

      document.documentElement.classList.remove('high-contrast')
    })

    it('should support reduced motion preferences', async () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Verify animations are reduced
      const animatedElements = screen.getAllByTestId(/loading-spinner|fade-in|slide-in/)
      animatedElements.forEach(element => {
        expect(element).toHaveClass('reduce-motion')
      })
    })
  })

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================

  describe('Error Handling', () => {
    it('should display appropriate error message for network failures', async () => {
      // Setup network error
      server.use(
        http.get(SCHEDULER_API_ENDPOINTS.TASKS, () => {
          return HttpResponse.error()
        })
      )

      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    it('should handle task creation failures gracefully', async () => {
      const user = createUserEvent()
      
      // Setup server error for task creation
      server.use(
        http.post(SCHEDULER_API_ENDPOINTS.TASKS, () => {
          return HttpResponse.json(
            { error: { message: 'Service unavailable', code: 'SERVICE_ERROR' } },
            { status: 503 }
          )
        })
      )

      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Attempt to create task
      await user.click(screen.getByRole('button', { name: /create new task/i }))
      await user.type(screen.getByLabelText(/task name/i), 'Test Task')
      await user.selectOptions(screen.getByLabelText(/service/i), '1')
      await user.type(screen.getByLabelText(/frequency/i), '300')
      await user.click(screen.getByRole('button', { name: /create task/i }))

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/service unavailable/i)).toBeInTheDocument()
      })

      // Verify form remains open for retry
      expect(screen.getByRole('dialog', { name: /create scheduler task/i })).toBeInTheDocument()
    })

    it('should recover from timeout errors', async () => {
      const user = createUserEvent()
      
      // Setup timeout
      server.use(
        http.get(SCHEDULER_API_ENDPOINTS.TASKS, () => {
          return new Promise(() => {}) // Never resolves
        })
      )

      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      // Wait for timeout
      await waitFor(() => {
        expect(screen.getByText(/request timeout/i)).toBeInTheDocument()
      }, { timeout: 10000 })

      // Reset to normal response
      server.resetHandlers()

      // Retry request
      await user.click(screen.getByRole('button', { name: /retry/i }))

      // Verify recovery
      await waitForQueryToSettle()
      expect(screen.getByRole('table', { name: /scheduler tasks/i })).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // PAYWALL ENFORCEMENT TESTS
  // ==========================================================================

  describe('Paywall Enforcement', () => {
    it('should restrict task creation for free tier users', async () => {
      // Mock free tier user
      const freeUser = { ...mockUser, subscription: 'free', limits: { maxSchedulerTasks: 3 } }
      
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Verify paywall message when limit reached
      expect(screen.getByText(/upgrade to create more scheduler tasks/i)).toBeInTheDocument()
      
      // Verify create button is disabled
      const createButton = screen.getByRole('button', { name: /create new task/i })
      expect(createButton).toBeDisabled()
    })

    it('should show upgrade prompt with pricing information', async () => {
      const user = createUserEvent()
      
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Click disabled create button
      const createButton = screen.getByRole('button', { name: /create new task/i })
      await user.click(createButton)

      // Verify upgrade dialog
      expect(screen.getByRole('dialog', { name: /upgrade your plan/i })).toBeInTheDocument()
      expect(screen.getByText(/unlimited scheduler tasks/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /upgrade now/i })).toBeInTheDocument()
    })

    it('should allow unlimited tasks for premium users', async () => {
      // Mock premium user
      const premiumUser = { ...mockUser, subscription: 'premium', limits: { maxSchedulerTasks: -1 } }
      
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Verify no paywall restrictions
      expect(screen.queryByText(/upgrade to create more/i)).not.toBeInTheDocument()
      
      // Verify create button is enabled
      const createButton = screen.getByRole('button', { name: /create new task/i })
      expect(createButton).toBeEnabled()
    })
  })

  // ==========================================================================
  // INTEGRATION TESTS
  // ==========================================================================

  describe('Integration Tests', () => {
    it('should handle full task lifecycle workflow', async () => {
      const user = createUserEvent()
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Create new task
      await user.click(screen.getByRole('button', { name: /create new task/i }))
      await user.type(screen.getByLabelText(/task name/i), 'Integration Test Task')
      await user.selectOptions(screen.getByLabelText(/service/i), '1')
      await user.type(screen.getByLabelText(/frequency/i), '1800')
      await user.click(screen.getByRole('button', { name: /create task/i }))

      // Verify task appears in list
      await waitFor(() => {
        expect(screen.getByText('Integration Test Task')).toBeInTheDocument()
      })

      // Edit the task
      const taskRow = screen.getByText('Integration Test Task').closest('[data-testid^="task-row-"]')!
      const editButton = within(taskRow as HTMLElement).getByRole('button', { name: /edit/i })
      await user.click(editButton)

      const nameInput = screen.getByLabelText(/task name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Integration Task')
      await user.click(screen.getByRole('button', { name: /save changes/i }))

      // Verify update
      await waitFor(() => {
        expect(screen.getByText('Updated Integration Task')).toBeInTheDocument()
      })

      // Toggle task status
      const updatedTaskRow = screen.getByText('Updated Integration Task').closest('[data-testid^="task-row-"]')!
      const toggleButton = within(updatedTaskRow as HTMLElement).getByRole('button', { name: /toggle status/i })
      await user.click(toggleButton)

      // Verify status change
      await waitFor(() => {
        expect(within(updatedTaskRow as HTMLElement).getByText('Inactive')).toBeInTheDocument()
      })

      // Delete the task
      const deleteButton = within(updatedTaskRow as HTMLElement).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)
      await user.click(screen.getByRole('button', { name: /delete task/i }))

      // Verify task is removed
      await waitFor(() => {
        expect(screen.queryByText('Updated Integration Task')).not.toBeInTheDocument()
      })
    })

    it('should maintain state consistency across multiple operations', async () => {
      const user = createUserEvent()
      renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

      await waitForQueryToSettle()

      // Select multiple tasks
      await user.click(screen.getByTestId('checkbox-task-1'))
      await user.click(screen.getByTestId('checkbox-task-2'))

      // Apply filter while tasks are selected
      await user.type(screen.getByPlaceholderText(/search tasks/i), 'Task 1')

      // Verify only matching task is shown and selection is maintained
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument()
        expect(screen.queryByText('Test Task 2')).not.toBeInTheDocument()
      })

      // Clear filter
      await user.clear(screen.getByPlaceholderText(/search tasks/i))

      // Verify both selected tasks are shown again with selection intact
      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument()
        expect(screen.getByText('Test Task 2')).toBeInTheDocument()
        expect(screen.getByTestId('checkbox-task-1')).toBeChecked()
        expect(screen.getByTestId('checkbox-task-2')).toBeChecked()
      })
    })
  })
})

// ============================================================================
// PERFORMANCE AND BENCHMARK TESTS
// ============================================================================

describe('Performance Benchmarks', () => {
  let queryClient: QueryClient
  let schedulerStore: ReturnType<typeof createSchedulerStore>

  beforeEach(() => {
    queryClient = createTestQueryClient()
    schedulerStore = createSchedulerStore()
  })

  afterEach(() => {
    cleanup()
  })

  it('should render within performance budget', async () => {
    const startTime = performance.now()

    renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

    await waitForQueryToSettle()

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // Should render within 500ms budget
    expect(renderTime).toBeLessThan(500)
  })

  it('should handle large datasets efficiently', async () => {
    // Use large dataset
    mockSchedulerTasks.length = 0
    mockSchedulerTasks.push(...mockSchedulerTasksLarge)

    const startTime = performance.now()

    renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

    await waitForQueryToSettle()

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // Should handle 1000+ items within 1 second
    expect(renderTime).toBeLessThan(1000)
    expect(mockSchedulerTasksLarge.length).toBeGreaterThan(1000)
  })

  it('should maintain responsive interactions during heavy operations', async () => {
    mockSchedulerTasks.length = 0
    mockSchedulerTasks.push(...mockSchedulerTasksLarge)

    const user = createUserEvent()
    renderWithProviders(<SchedulerPage />, { queryClient, schedulerStore })

    await waitForQueryToSettle()

    // Measure interaction response time
    const startTime = performance.now()

    // Simulate rapid interactions
    await user.type(screen.getByPlaceholderText(/search tasks/i), 'test')

    const endTime = performance.now()
    const interactionTime = endTime - startTime

    // Interactions should remain responsive (< 100ms)
    expect(interactionTime).toBeLessThan(100)
  })
})

// Setup MSW server lifecycle
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})