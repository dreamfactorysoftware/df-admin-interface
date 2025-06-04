import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Component under test
import SchedulerTaskPage from './page'

// Test utilities and providers
import { TestProviders } from '@/test/utils/test-utils'
import { createQueryTestHelpers } from '@/test/utils/query-test-helpers'
import { createAccessibilityHelpers } from '@/test/utils/accessibility-helpers'

// Mock data and fixtures
import { 
  createSchedulerTaskFactory,
  createServiceFactory,
  createServiceListFactory,
  createComponentAccessListFactory 
} from '@/test/fixtures/scheduler-fixtures'

// Types
import type { SchedulerTask, Service, ComponentAccessItem } from '@/types/scheduler'

// MSW server setup
const server = setupServer()

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
}))

// Mock React Query hooks
vi.mock('@/hooks/useSchedulerTask')
vi.mock('@/hooks/useCreateSchedulerTask') 
vi.mock('@/hooks/useUpdateSchedulerTask')

describe('SchedulerTaskPage', () => {
  let queryClient: QueryClient
  let mockRouter: ReturnType<typeof vi.fn>
  let user: ReturnType<typeof userEvent.setup>
  let queryHelpers: ReturnType<typeof createQueryTestHelpers>
  let a11yHelpers: ReturnType<typeof createAccessibilityHelpers>

  // Test data factories
  const mockServices = createServiceListFactory({
    count: 3,
    items: [
      createServiceFactory({
        id: 1,
        name: 'api_docs',
        label: 'Live API Docs',
        type: 'swagger',
        isActive: true
      }),
      createServiceFactory({
        id: 2,
        name: 'db',
        label: 'Local SQL Database', 
        type: 'sqlite',
        isActive: true
      }),
      createServiceFactory({
        id: 3,
        name: 'email',
        label: 'Local Email Service',
        type: 'local_email',
        isActive: true
      })
    ]
  })

  const mockComponentAccess = createComponentAccessListFactory([
    { id: 1, component: '*', verb_mask: 31 },
    { id: 2, component: 'users', verb_mask: 15 },
    { id: 3, component: 'admins', verb_mask: 7 }
  ])

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Setup fresh QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    // Setup user event
    user = userEvent.setup()

    // Setup test helpers
    queryHelpers = createQueryTestHelpers(queryClient)
    a11yHelpers = createAccessibilityHelpers()

    // Setup router mock
    mockRouter = vi.fn()
    ;(useRouter as any).mockReturnValue({
      push: mockRouter,
      back: mockRouter,
      forward: mockRouter,
      refresh: mockRouter,
      replace: mockRouter
    })

    // Reset MSW handlers
    server.resetHandlers()
  })

  afterEach(() => {
    queryClient.clear()
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  describe('Create Mode', () => {
    beforeEach(() => {
      // Mock useParams for create mode
      ;(useParams as any).mockReturnValue({ id: 'create' })

      // Setup MSW handlers for create mode
      server.use(
        // Services endpoint
        http.get('/api/v2/system/service', () => {
          return HttpResponse.json({
            resource: mockServices.items,
            meta: { count: mockServices.items.length }
          })
        }),

        // Component access endpoint
        http.get('/api/v2/db/_schema', () => {
          return HttpResponse.json({
            resource: mockComponentAccess
          })
        }),

        // Create scheduler task endpoint  
        http.post('/api/v2/system/scheduler', async ({ request }) => {
          const body = await request.json() as any
          const newTask = createSchedulerTaskFactory({
            id: Date.now(),
            ...body,
            createdDate: new Date().toISOString(),
            lastModifiedDate: new Date().toISOString()
          })
          return HttpResponse.json({ resource: [newTask] })
        })
      )
    })

    it('renders create form with all required fields', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      // Verify page title
      expect(screen.getByRole('heading', { name: /create scheduler task/i })).toBeInTheDocument()

      // Verify required form fields are present
      await waitFor(() => {
        expect(screen.getByLabelText(/task name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/active/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/service/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/http method/i)).toBeInTheDocument()
      })

      // Verify action buttons
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    })

    it('validates required fields and shows errors', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      // Try to submit empty form
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Verify validation errors appear
      await waitFor(() => {
        expect(screen.getByText(/task name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/frequency is required/i)).toBeInTheDocument()
      })
    })

    it('shows payload field only for non-GET methods', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      // Initially GET method - payload should not be visible
      expect(screen.queryByLabelText(/payload/i)).not.toBeInTheDocument()

      // Change to POST method
      const methodSelect = screen.getByLabelText(/http method/i)
      await user.click(methodSelect)
      
      const postOption = screen.getByRole('option', { name: /post/i })
      await user.click(postOption)

      // Payload field should now be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/payload/i)).toBeInTheDocument()
      })

      // Change back to GET method
      await user.click(methodSelect)
      const getOption = screen.getByRole('option', { name: /get/i })
      await user.click(getOption)

      // Payload field should be hidden again
      await waitFor(() => {
        expect(screen.queryByLabelText(/payload/i)).not.toBeInTheDocument()
      })
    })

    it('loads component dropdown when service is selected', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      // Wait for services to load
      await waitFor(() => {
        expect(screen.getByLabelText(/service/i)).toBeInTheDocument()
      })

      // Select a service
      const serviceSelect = screen.getByLabelText(/service/i)
      await user.click(serviceSelect)
      
      const dbOption = screen.getByRole('option', { name: /local sql database/i })
      await user.click(dbOption)

      // Verify component dropdown is enabled and populated
      await waitFor(() => {
        const componentSelect = screen.getByLabelText(/component/i)
        expect(componentSelect).toBeEnabled()
        
        // Open component dropdown
        user.click(componentSelect)
      })

      // Verify component options are available
      await waitFor(() => {
        expect(screen.getByRole('option', { name: /\*/i })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: /users/i })).toBeInTheDocument()
      })
    })

    it('successfully creates scheduler task with valid data', async () => {
      const createSpy = vi.fn()

      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      // Fill out the form
      await user.type(screen.getByLabelText(/task name/i), 'Test Task')
      await user.type(screen.getByLabelText(/description/i), 'Test Description')
      
      // Set frequency
      const frequencyInput = screen.getByLabelText(/frequency/i)
      await user.clear(frequencyInput)
      await user.type(frequencyInput, '600')

      // Select service
      const serviceSelect = screen.getByLabelText(/service/i)
      await user.click(serviceSelect)
      await user.click(screen.getByRole('option', { name: /local sql database/i }))

      // Wait for component dropdown to load and select component
      await waitFor(() => {
        const componentSelect = screen.getByLabelText(/component/i)
        expect(componentSelect).toBeEnabled()
      })

      const componentSelect = screen.getByLabelText(/component/i)
      await user.click(componentSelect)
      await user.click(screen.getByRole('option', { name: /\*/i }))

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Verify success and navigation
      await waitFor(() => {
        expect(mockRouter).toHaveBeenCalledWith('/system-settings/scheduler')
      })
    })

    it('handles create errors gracefully', async () => {
      // Setup error response
      server.use(
        http.post('/api/v2/system/scheduler', () => {
          return HttpResponse.json(
            {
              error: {
                code: 400,
                message: 'Validation failed',
                context: 'Invalid frequency value'
              }
            },
            { status: 400 }
          )
        })
      )

      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      // Fill minimum required fields
      await user.type(screen.getByLabelText(/task name/i), 'Test Task')
      await user.type(screen.getByLabelText(/frequency/i), 'invalid')

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/validation failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Edit Mode', () => {
    const mockSchedulerTask = createSchedulerTaskFactory({
      id: 15,
      name: 'Existing Task',
      description: 'Existing Description',
      isActive: true,
      serviceId: 2,
      component: '*',
      verbMask: 1, // GET
      frequency: 88,
      payload: null
    })

    beforeEach(() => {
      // Mock useParams for edit mode
      ;(useParams as any).mockReturnValue({ id: '15' })

      // Setup MSW handlers for edit mode
      server.use(
        // Services endpoint
        http.get('/api/v2/system/service', () => {
          return HttpResponse.json({
            resource: mockServices.items,
            meta: { count: mockServices.items.length }
          })
        }),

        // Get specific scheduler task
        http.get('/api/v2/system/scheduler/15', () => {
          return HttpResponse.json({ resource: [mockSchedulerTask] })
        }),

        // Component access endpoint
        http.get('/api/v2/db/_schema', () => {
          return HttpResponse.json({
            resource: mockComponentAccess
          })
        }),

        // Update scheduler task endpoint
        http.patch('/api/v2/system/scheduler/15', async ({ request }) => {
          const body = await request.json() as any
          const updatedTask = {
            ...mockSchedulerTask,
            ...body,
            lastModifiedDate: new Date().toISOString()
          }
          return HttpResponse.json({ resource: [updatedTask] })
        })
      )
    })

    it('renders edit form with populated data', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      // Verify page title
      expect(screen.getByRole('heading', { name: /edit scheduler task/i })).toBeInTheDocument()

      // Verify form is populated with existing data
      await waitFor(() => {
        expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Existing Description')).toBeInTheDocument()
        expect(screen.getByDisplayValue('88')).toBeInTheDocument()
        
        // Verify active toggle is checked
        const activeToggle = screen.getByLabelText(/active/i)
        expect(activeToggle).toBeChecked()
      })
    })

    it('successfully updates scheduler task with modified data', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument()
      })

      // Modify the task name
      const nameInput = screen.getByDisplayValue('Existing Task')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Task Name')

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Verify success and navigation
      await waitFor(() => {
        expect(mockRouter).toHaveBeenCalledWith('/system-settings/scheduler')
      })
    })

    it('shows task execution log in log tab', async () => {
      const taskWithLog = createSchedulerTaskFactory({
        ...mockSchedulerTask,
        taskLogByTaskId: {
          taskId: 15,
          statusCode: 404,
          content: 'REST Exception #404 > Resource not found',
          createdDate: new Date().toISOString(),
          lastModifiedDate: new Date().toISOString()
        }
      })

      server.use(
        http.get('/api/v2/system/scheduler/15', () => {
          return HttpResponse.json({ resource: [taskWithLog] })
        })
      )

      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      // Switch to log tab
      const logTab = screen.getByRole('tab', { name: /log/i })
      await user.click(logTab)

      // Verify log content is displayed
      await waitFor(() => {
        expect(screen.getByText(/status code: 404/i)).toBeInTheDocument()
        expect(screen.getByText(/rest exception/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    beforeEach(() => {
      ;(useParams as any).mockReturnValue({ id: 'create' })
      
      server.use(
        http.get('/api/v2/system/service', () => {
          return HttpResponse.json({
            resource: mockServices.items,
            meta: { count: mockServices.items.length }
          })
        })
      )
    })

    it('validates task name is required', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      const nameInput = screen.getByLabelText(/task name/i)
      
      // Focus and blur without entering text
      await user.click(nameInput)
      await user.tab()

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/task name is required/i)).toBeInTheDocument()
      })
    })

    it('validates frequency is a positive number', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      const frequencyInput = screen.getByLabelText(/frequency/i)
      
      // Enter invalid frequency
      await user.type(frequencyInput, '-100')
      await user.tab()

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/frequency must be positive/i)).toBeInTheDocument()
      })
    })

    it('validates JSON payload when present', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      // Change to POST to show payload field
      const methodSelect = screen.getByLabelText(/http method/i)
      await user.click(methodSelect)
      await user.click(screen.getByRole('option', { name: /post/i }))

      // Wait for payload field to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/payload/i)).toBeInTheDocument()
      })

      // Enter invalid JSON
      const payloadInput = screen.getByLabelText(/payload/i)
      await user.type(payloadInput, '{ invalid json }')
      await user.tab()

      // Verify JSON validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid json format/i)).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    beforeEach(() => {
      ;(useParams as any).mockReturnValue({ id: 'create' })
    })

    it('navigates back when cancel button is clicked', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockRouter).toHaveBeenCalledWith('/system-settings/scheduler')
    })

    it('shows confirmation dialog when leaving with unsaved changes', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      // Make a change to the form
      await user.type(screen.getByLabelText(/task name/i), 'Modified Task')

      // Try to navigate away
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Verify confirmation dialog appears
      await waitFor(() => {
        expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /leave without saving/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /stay on page/i })).toBeInTheDocument()
      })
    })
  })

  describe('React Query Integration', () => {
    beforeEach(() => {
      ;(useParams as any).mockReturnValue({ id: 'create' })
    })

    it('uses React Query for services data fetching', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      // Verify services query is in cache
      await waitFor(() => {
        const servicesQuery = queryClient.getQueryData(['services'])
        expect(servicesQuery).toBeDefined()
      })
    })

    it('invalidates queries after successful create', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

      server.use(
        http.get('/api/v2/system/service', () => {
          return HttpResponse.json({
            resource: mockServices.items,
            meta: { count: mockServices.items.length }
          })
        }),
        http.post('/api/v2/system/scheduler', () => {
          const newTask = createSchedulerTaskFactory({ id: Date.now() })
          return HttpResponse.json({ resource: [newTask] })
        })
      )

      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      // Fill minimum required data and submit
      await user.type(screen.getByLabelText(/task name/i), 'Test Task')
      await user.type(screen.getByLabelText(/frequency/i), '600')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Verify queries are invalidated
      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith(['scheduler'])
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      ;(useParams as any).mockReturnValue({ id: 'create' })
    })

    it('has proper ARIA labels and roles', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      // Verify form has proper accessibility attributes
      const form = screen.getByRole('form', { name: /scheduler task form/i })
      expect(form).toBeInTheDocument()

      // Verify all form controls have labels
      const formControls = screen.getAllByRole('textbox')
      formControls.forEach(control => {
        expect(control).toHaveAccessibleName()
      })

      // Verify select elements have labels
      const selectControls = screen.getAllByRole('combobox')
      selectControls.forEach(control => {
        expect(control).toHaveAccessibleName()
      })
    })

    it('announces form validation errors to screen readers', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      // Trigger validation error
      const nameInput = screen.getByLabelText(/task name/i)
      await user.click(nameInput)
      await user.tab()

      // Verify error has proper ARIA attributes
      await waitFor(() => {
        const errorMessage = screen.getByText(/task name is required/i)
        expect(errorMessage).toHaveAttribute('role', 'alert')
        expect(nameInput).toHaveAttribute('aria-invalid', 'true')
        expect(nameInput).toHaveAttribute('aria-describedby')
      })
    })

    it('supports keyboard navigation', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      // Verify tab navigation works through form controls
      const nameInput = screen.getByLabelText(/task name/i)
      nameInput.focus()
      expect(nameInput).toHaveFocus()

      await user.tab()
      const descriptionInput = screen.getByLabelText(/description/i)
      expect(descriptionInput).toHaveFocus()

      await user.tab()
      const activeToggle = screen.getByLabelText(/active/i)
      expect(activeToggle).toHaveFocus()
    })
  })

  describe('Error Boundaries', () => {
    it('catches and displays component errors gracefully', async () => {
      // Mock a component error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Force an error in the component
      server.use(
        http.get('/api/v2/system/service', () => {
          return HttpResponse.json(null, { status: 500 })
        })
      )

      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      // Verify error boundary catches the error
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Loading States', () => {
    beforeEach(() => {
      ;(useParams as any).mockReturnValue({ id: 'create' })
    })

    it('shows loading spinner while fetching services', async () => {
      // Add delay to services request
      server.use(
        http.get('/api/v2/system/service', async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json({
            resource: mockServices.items,
            meta: { count: mockServices.items.length }
          })
        })
      )

      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      // Verify loading state is shown
      expect(screen.getByText(/loading services/i)).toBeInTheDocument()

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/loading services/i)).not.toBeInTheDocument()
      })
    })

    it('shows loading state on form submission', async () => {
      server.use(
        http.get('/api/v2/system/service', () => {
          return HttpResponse.json({
            resource: mockServices.items,
            meta: { count: mockServices.items.length }
          })
        }),
        http.post('/api/v2/system/scheduler', async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          const newTask = createSchedulerTaskFactory({ id: Date.now() })
          return HttpResponse.json({ resource: [newTask] })
        })
      )

      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerTaskPage />
        </TestProviders>
      )

      // Fill form and submit
      await user.type(screen.getByLabelText(/task name/i), 'Test Task')
      await user.type(screen.getByLabelText(/frequency/i), '600')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Verify loading state
      expect(screen.getByText(/creating task/i)).toBeInTheDocument()
      expect(saveButton).toBeDisabled()

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText(/creating task/i)).not.toBeInTheDocument()
      })
    })
  })
})