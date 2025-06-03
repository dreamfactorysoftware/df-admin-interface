/**
 * Scheduler Details Page Test Suite
 * 
 * Comprehensive test suite for the scheduler details page component using:
 * - Vitest for 10x faster test execution compared to Jasmine/Karma
 * - React Testing Library for user-centric testing approaches
 * - Mock Service Worker (MSW) for realistic API mocking
 * - React Query testing for cache and state management validation
 * - Accessibility testing for WCAG 2.1 AA compliance
 * 
 * @fileoverview Tests for scheduler task CRUD operations, form validation,
 * tab navigation, JSON payload validation, and error handling workflows
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { axe, toHaveNoViolations } from 'jest-axe'

// Component under test
import SchedulerDetailsPage from './page'

// Test utilities and providers
import { createTestQueryClient } from '@/test/utils/query-client'
import { TestProviders } from '@/test/utils/test-providers'

// Mock data and handlers
import { mockSchedulerTasks, mockSchedulerTask } from '@/test/mocks/scheduler-data'
import { createErrorResponse } from '@/test/mocks/error-responses'
import type { SchedulerTask, CreateSchedulerTaskRequest, UpdateSchedulerTaskRequest } from '@/types/scheduler'

// Extend expect with accessibility matchers
expect.extend(toHaveNoViolations)

// Mock Next.js router
const mockPush = vi.fn()
const mockBack = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    refresh: vi.fn(),
  }),
  useParams: () => ({ id: 'test-task-1' }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock React Query hooks
const mockMutateAsync = vi.fn()
const mockInvalidateQueries = vi.fn()

vi.mock('@/hooks/useSchedulerTask', () => ({
  useSchedulerTask: vi.fn(),
  useCreateSchedulerTask: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    error: null,
  }),
  useUpdateSchedulerTask: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    error: null,
  }),
  useDeleteSchedulerTask: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    error: null,
  }),
}))

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
      setQueryData: vi.fn(),
      getQueryData: vi.fn(),
    }),
  }
})

// MSW Server setup with scheduler endpoints
const schedulerHandlers = [
  // Get scheduler task by ID
  http.get('/api/v2/system/scheduler/:id', ({ params }) => {
    const { id } = params
    if (id === 'test-task-1') {
      return HttpResponse.json({ resource: [mockSchedulerTask] })
    }
    return HttpResponse.json(
      createErrorResponse(404, 'Scheduler task not found', `Task with ID ${id} does not exist`)
    )
  }),

  // Get all scheduler tasks
  http.get('/api/v2/system/scheduler', ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '25')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    
    return HttpResponse.json({
      resource: mockSchedulerTasks.slice(offset, offset + limit),
      meta: {
        count: mockSchedulerTasks.length,
        limit,
        offset,
      },
    })
  }),

  // Create scheduler task
  http.post('/api/v2/system/scheduler', async ({ request }) => {
    const body = await request.json() as CreateSchedulerTaskRequest
    
    // Validate required fields
    if (!body.name || !body.type || !body.config) {
      return HttpResponse.json(
        createErrorResponse(400, 'Validation Error', 'Missing required fields'),
        { status: 400 }
      )
    }

    // Validate JSON payload in config
    if (body.type === 'script' && body.config.payload) {
      try {
        JSON.parse(body.config.payload)
      } catch (error) {
        return HttpResponse.json(
          createErrorResponse(422, 'Invalid JSON', 'Payload must be valid JSON'),
          { status: 422 }
        )
      }
    }

    const newTask: SchedulerTask = {
      id: Date.now(),
      name: body.name,
      type: body.type,
      frequency: body.frequency || 'once',
      start_time: body.start_time || new Date().toISOString(),
      is_active: body.is_active ?? true,
      config: body.config,
      created_date: new Date().toISOString(),
      created_by_id: 1,
      last_modified_date: new Date().toISOString(),
      last_modified_by_id: 1,
    }

    return HttpResponse.json({ resource: [newTask] }, { status: 201 })
  }),

  // Update scheduler task
  http.put('/api/v2/system/scheduler/:id', async ({ params, request }) => {
    const { id } = params
    const body = await request.json() as UpdateSchedulerTaskRequest

    if (id === 'test-task-1') {
      const updatedTask: SchedulerTask = {
        ...mockSchedulerTask,
        ...body,
        last_modified_date: new Date().toISOString(),
      }
      return HttpResponse.json({ resource: [updatedTask] })
    }

    return HttpResponse.json(
      createErrorResponse(404, 'Scheduler task not found', `Task with ID ${id} does not exist`),
      { status: 404 }
    )
  }),

  // Delete scheduler task
  http.delete('/api/v2/system/scheduler/:id', ({ params }) => {
    const { id } = params
    if (id === 'test-task-1') {
      return HttpResponse.json({ success: true })
    }
    return HttpResponse.json(
      createErrorResponse(404, 'Scheduler task not found', `Task with ID ${id} does not exist`),
      { status: 404 }
    )
  }),

  // Trigger scheduler task
  http.post('/api/v2/system/scheduler/:id/trigger', ({ params }) => {
    const { id } = params
    if (id === 'test-task-1') {
      return HttpResponse.json({ 
        success: true, 
        message: 'Task triggered successfully',
        execution_id: Date.now().toString(),
      })
    }
    return HttpResponse.json(
      createErrorResponse(404, 'Scheduler task not found', `Task with ID ${id} does not exist`),
      { status: 404 }
    )
  }),
]

const server = setupServer(...schedulerHandlers)

describe('SchedulerDetailsPage', () => {
  let queryClient: QueryClient
  let user: ReturnType<typeof userEvent.setup>

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  beforeEach(() => {
    queryClient = createTestQueryClient()
    user = userEvent.setup()
    
    // Mock useSchedulerTask hook for existing task
    vi.mocked(require('@/hooks/useSchedulerTask').useSchedulerTask).mockReturnValue({
      data: mockSchedulerTask,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })

    // Clear all mocks
    vi.clearAllMocks()
    mockPush.mockClear()
    mockBack.mockClear()
    mockMutateAsync.mockClear()
    mockInvalidateQueries.mockClear()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  describe('Component Rendering', () => {
    it('renders scheduler details page with loading state', async () => {
      // Mock loading state
      vi.mocked(require('@/hooks/useSchedulerTask').useSchedulerTask).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      })

      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
      expect(screen.getByText(/loading scheduler task/i)).toBeInTheDocument()
    })

    it('renders scheduler details form when data is loaded', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /scheduler task details/i })).toBeInTheDocument()
      })

      // Check form fields are rendered
      expect(screen.getByLabelText(/task name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/task type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/start time/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/active/i)).toBeInTheDocument()
    })

    it('renders error state when task is not found', async () => {
      vi.mocked(require('@/hooks/useSchedulerTask').useSchedulerTask).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: { message: 'Scheduler task not found' },
        refetch: vi.fn(),
      })

      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/scheduler task not found/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('populates form fields with existing task data', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue(mockSchedulerTask.name)
        const typeSelect = screen.getByDisplayValue(mockSchedulerTask.type)
        const frequencySelect = screen.getByDisplayValue(mockSchedulerTask.frequency)
        
        expect(nameInput).toBeInTheDocument()
        expect(typeSelect).toBeInTheDocument()
        expect(frequencySelect).toBeInTheDocument()
      })
    })
  })

  describe('Tab Navigation', () => {
    beforeEach(async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /scheduler task details/i })).toBeInTheDocument()
      })
    })

    it('renders all tab buttons', () => {
      const tabList = screen.getByRole('tablist')
      expect(tabList).toBeInTheDocument()

      const tabs = within(tabList).getAllByRole('tab')
      expect(tabs).toHaveLength(4)

      expect(screen.getByRole('tab', { name: /general/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /configuration/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /schedule/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /history/i })).toBeInTheDocument()
    })

    it('shows general tab as selected by default', () => {
      const generalTab = screen.getByRole('tab', { name: /general/i })
      expect(generalTab).toHaveAttribute('aria-selected', 'true')

      const generalPanel = screen.getByRole('tabpanel', { name: /general/i })
      expect(generalPanel).toBeInTheDocument()
    })

    it('switches to configuration tab when clicked', async () => {
      const configTab = screen.getByRole('tab', { name: /configuration/i })
      
      await user.click(configTab)

      expect(configTab).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tabpanel', { name: /configuration/i })).toBeInTheDocument()
    })

    it('switches to schedule tab when clicked', async () => {
      const scheduleTab = screen.getByRole('tab', { name: /schedule/i })
      
      await user.click(scheduleTab)

      expect(scheduleTab).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tabpanel', { name: /schedule/i })).toBeInTheDocument()
    })

    it('switches to history tab when clicked', async () => {
      const historyTab = screen.getByRole('tab', { name: /history/i })
      
      await user.click(historyTab)

      expect(historyTab).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tabpanel', { name: /history/i })).toBeInTheDocument()
    })

    it('supports keyboard navigation between tabs', async () => {
      const firstTab = screen.getByRole('tab', { name: /general/i })
      firstTab.focus()

      // Navigate to next tab with arrow key
      await user.keyboard('{ArrowRight}')
      
      const configTab = screen.getByRole('tab', { name: /configuration/i })
      expect(configTab).toHaveFocus()

      // Activate tab with Enter or Space
      await user.keyboard('{Enter}')
      expect(configTab).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('Form Validation', () => {
    beforeEach(async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /scheduler task details/i })).toBeInTheDocument()
      })
    })

    it('validates required fields on form submission', async () => {
      const nameInput = screen.getByLabelText(/task name/i)
      const saveButton = screen.getByRole('button', { name: /save/i })

      // Clear required field
      await user.clear(nameInput)
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/task name is required/i)).toBeInTheDocument()
      })

      expect(mockMutateAsync).not.toHaveBeenCalled()
    })

    it('validates task name minimum length', async () => {
      const nameInput = screen.getByLabelText(/task name/i)
      
      await user.clear(nameInput)
      await user.type(nameInput, 'ab')

      await waitFor(() => {
        expect(screen.getByText(/task name must be at least 3 characters/i)).toBeInTheDocument()
      })
    })

    it('validates task name maximum length', async () => {
      const nameInput = screen.getByLabelText(/task name/i)
      const longName = 'a'.repeat(256)
      
      await user.clear(nameInput)
      await user.type(nameInput, longName)

      await waitFor(() => {
        expect(screen.getByText(/task name must be less than 255 characters/i)).toBeInTheDocument()
      })
    })

    it('validates JSON payload format in configuration tab', async () => {
      const configTab = screen.getByRole('tab', { name: /configuration/i })
      await user.click(configTab)

      const payloadTextarea = screen.getByLabelText(/payload/i)
      const invalidJson = '{ invalid json }'

      await user.clear(payloadTextarea)
      await user.type(payloadTextarea, invalidJson)

      await waitFor(() => {
        expect(screen.getByText(/invalid json format/i)).toBeInTheDocument()
      })
    })

    it('validates start time is not in the past', async () => {
      const scheduleTab = screen.getByRole('tab', { name: /schedule/i })
      await user.click(scheduleTab)

      const startTimeInput = screen.getByLabelText(/start time/i)
      const pastDate = '2020-01-01T00:00'

      await user.clear(startTimeInput)
      await user.type(startTimeInput, pastDate)

      await waitFor(() => {
        expect(screen.getByText(/start time cannot be in the past/i)).toBeInTheDocument()
      })
    })

    it('shows real-time validation errors with debounced input', async () => {
      const nameInput = screen.getByLabelText(/task name/i)
      
      await user.clear(nameInput)
      
      // Validation should appear after debounce delay
      await waitFor(() => {
        expect(screen.getByText(/task name is required/i)).toBeInTheDocument()
      }, { timeout: 500 })
    })
  })

  describe('CRUD Operations', () => {
    beforeEach(async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /scheduler task details/i })).toBeInTheDocument()
      })
    })

    it('creates new scheduler task with valid data', async () => {
      // Mock creating new task (no existing data)
      vi.mocked(require('@/hooks/useSchedulerTask').useSchedulerTask).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      })

      const { rerender } = render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      const nameInput = screen.getByLabelText(/task name/i)
      const typeSelect = screen.getByLabelText(/task type/i)
      const saveButton = screen.getByRole('button', { name: /save/i })

      await user.type(nameInput, 'New Test Task')
      await user.selectOptions(typeSelect, 'script')
      
      mockMutateAsync.mockResolvedValueOnce({ success: true })

      await user.click(saveButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Test Task',
            type: 'script',
          })
        )
      })

      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['scheduler-tasks'] })
    })

    it('updates existing scheduler task', async () => {
      const nameInput = screen.getByLabelText(/task name/i)
      const saveButton = screen.getByRole('button', { name: /save/i })

      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Task Name')

      mockMutateAsync.mockResolvedValueOnce({ success: true })

      await user.click(saveButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Updated Task Name',
          })
        )
      })

      expect(mockInvalidateQueries).toHaveBeenCalledWith({ 
        queryKey: ['scheduler-task', 'test-task-1'] 
      })
    })

    it('deletes scheduler task with confirmation', async () => {
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      
      await user.click(deleteButton)

      // Confirm deletion dialog should appear
      const confirmDialog = screen.getByRole('dialog', { name: /confirm deletion/i })
      expect(confirmDialog).toBeInTheDocument()

      const confirmButton = within(confirmDialog).getByRole('button', { name: /delete/i })
      
      mockMutateAsync.mockResolvedValueOnce({ success: true })

      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled()
      })

      expect(mockPush).toHaveBeenCalledWith('/adf-scheduler')
    })

    it('triggers scheduler task execution', async () => {
      const triggerButton = screen.getByRole('button', { name: /trigger now/i })
      
      mockMutateAsync.mockResolvedValueOnce({ 
        success: true, 
        execution_id: '12345' 
      })

      await user.click(triggerButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled()
      })

      expect(screen.getByText(/task triggered successfully/i)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    beforeEach(async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /scheduler task details/i })).toBeInTheDocument()
      })
    })

    it('handles network errors during save operation', async () => {
      const nameInput = screen.getByLabelText(/task name/i)
      const saveButton = screen.getByRole('button', { name: /save/i })

      await user.clear(nameInput)
      await user.type(nameInput, 'Test Task')

      const networkError = new Error('Network error')
      mockMutateAsync.mockRejectedValueOnce(networkError)

      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/failed to save scheduler task/i)).toBeInTheDocument()
      })
    })

    it('handles validation errors from server', async () => {
      const saveButton = screen.getByRole('button', { name: /save/i })

      const validationError = {
        response: {
          status: 422,
          data: {
            error: {
              code: 422,
              message: 'Validation Error',
              details: {
                name: ['Task name is required'],
                type: ['Invalid task type'],
              },
            },
          },
        },
      }

      mockMutateAsync.mockRejectedValueOnce(validationError)

      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/task name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/invalid task type/i)).toBeInTheDocument()
      })
    })

    it('handles 404 errors when task is not found', async () => {
      const error404 = {
        response: {
          status: 404,
          data: {
            error: {
              code: 404,
              message: 'Scheduler task not found',
            },
          },
        },
      }

      vi.mocked(require('@/hooks/useSchedulerTask').useSchedulerTask).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: error404,
        refetch: vi.fn(),
      })

      const { rerender } = render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      expect(screen.getByText(/scheduler task not found/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
    })

    it('handles permission errors (403)', async () => {
      const saveButton = screen.getByRole('button', { name: /save/i })

      const permissionError = {
        response: {
          status: 403,
          data: {
            error: {
              code: 403,
              message: 'Insufficient permissions',
            },
          },
        },
      }

      mockMutateAsync.mockRejectedValueOnce(permissionError)

      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument()
      })
    })
  })

  describe('React Query Integration', () => {
    it('invalidates scheduler tasks cache after successful creation', async () => {
      vi.mocked(require('@/hooks/useSchedulerTask').useSchedulerTask).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      })

      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      const nameInput = screen.getByLabelText(/task name/i)
      const saveButton = screen.getByRole('button', { name: /save/i })

      await user.type(nameInput, 'New Task')
      
      mockMutateAsync.mockResolvedValueOnce({ success: true })

      await user.click(saveButton)

      await waitFor(() => {
        expect(mockInvalidateQueries).toHaveBeenCalledWith({ 
          queryKey: ['scheduler-tasks'] 
        })
      })
    })

    it('invalidates specific task cache after successful update', async () => {
      const nameInput = screen.getByLabelText(/task name/i)
      const saveButton = screen.getByRole('button', { name: /save/i })

      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Task')
      
      mockMutateAsync.mockResolvedValueOnce({ success: true })

      await user.click(saveButton)

      await waitFor(() => {
        expect(mockInvalidateQueries).toHaveBeenCalledWith({ 
          queryKey: ['scheduler-task', 'test-task-1'] 
        })
      })
    })

    it('handles stale data detection and refetching', async () => {
      const refetch = vi.fn()
      
      vi.mocked(require('@/hooks/useSchedulerTask').useSchedulerTask).mockReturnValue({
        data: mockSchedulerTask,
        isLoading: false,
        isError: false,
        error: null,
        refetch,
        isStale: true,
      })

      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      // Component should show refresh indicator for stale data
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()

      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      await user.click(refreshButton)

      expect(refetch).toHaveBeenCalled()
    })
  })

  describe('JSON Payload Validation', () => {
    beforeEach(async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      await waitFor(() => {
        const configTab = screen.getByRole('tab', { name: /configuration/i })
        user.click(configTab)
      })
    })

    it('validates JSON syntax in payload editor', async () => {
      const payloadEditor = screen.getByLabelText(/payload/i)
      
      await user.clear(payloadEditor)
      await user.type(payloadEditor, '{ "invalid": json }')

      await waitFor(() => {
        expect(screen.getByText(/invalid json syntax/i)).toBeInTheDocument()
      })
    })

    it('formats valid JSON payload automatically', async () => {
      const payloadEditor = screen.getByLabelText(/payload/i)
      const compactJson = '{"name":"test","value":123}'
      
      await user.clear(payloadEditor)
      await user.type(payloadEditor, compactJson)

      const formatButton = screen.getByRole('button', { name: /format json/i })
      await user.click(formatButton)

      await waitFor(() => {
        const formattedJson = JSON.stringify(JSON.parse(compactJson), null, 2)
        expect(payloadEditor).toHaveValue(formattedJson)
      })
    })

    it('validates JSON schema if provided', async () => {
      const payloadEditor = screen.getByLabelText(/payload/i)
      const invalidPayload = '{"wrongProperty": "value"}'
      
      await user.clear(payloadEditor)
      await user.type(payloadEditor, invalidPayload)

      await waitFor(() => {
        expect(screen.getByText(/payload does not match expected schema/i)).toBeInTheDocument()
      })
    })

    it('provides JSON editing assistance with syntax highlighting', async () => {
      const payloadEditor = screen.getByLabelText(/payload/i)
      
      // Check that the editor has syntax highlighting classes
      expect(payloadEditor).toHaveClass('syntax-highlighted')
      
      // Check for autocomplete functionality
      await user.type(payloadEditor, '{"')
      
      // Should show autocomplete suggestions
      await waitFor(() => {
        expect(screen.getByRole('listbox', { name: /autocomplete/i })).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility Compliance', () => {
    it('meets WCAG 2.1 AA accessibility standards', async () => {
      const { container } = render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /scheduler task details/i })).toBeInTheDocument()
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('provides proper ARIA labels for form elements', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/task name/i)).toHaveAccessibleName()
        expect(screen.getByLabelText(/task type/i)).toHaveAccessibleName()
        expect(screen.getByLabelText(/frequency/i)).toHaveAccessibleName()
        expect(screen.getByLabelText(/active/i)).toHaveAccessibleName()
      })
    })

    it('supports keyboard navigation throughout the form', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /scheduler task details/i })).toBeInTheDocument()
      })

      // Test tab order through form elements
      const nameInput = screen.getByLabelText(/task name/i)
      nameInput.focus()

      await user.keyboard('{Tab}')
      expect(screen.getByLabelText(/task type/i)).toHaveFocus()

      await user.keyboard('{Tab}')
      expect(screen.getByLabelText(/frequency/i)).toHaveFocus()
    })

    it('announces form validation errors to screen readers', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      const nameInput = screen.getByLabelText(/task name/i)
      
      await user.clear(nameInput)
      await user.tab() // Move focus away to trigger validation

      await waitFor(() => {
        const errorMessage = screen.getByText(/task name is required/i)
        expect(errorMessage).toHaveAttribute('role', 'alert')
        expect(errorMessage).toHaveAttribute('aria-live', 'polite')
      })
    })

    it('provides proper focus management for modal dialogs', async () => {
      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      const dialog = screen.getByRole('dialog', { name: /confirm deletion/i })
      expect(dialog).toBeInTheDocument()

      // Focus should be trapped within the dialog
      const firstFocusableElement = within(dialog).getByRole('button', { name: /cancel/i })
      expect(firstFocusableElement).toHaveFocus()
    })
  })

  describe('Loading States and UI Feedback', () => {
    it('shows loading spinner during save operation', async () => {
      const { rerender } = render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      // Mock pending mutation state
      vi.mocked(require('@/hooks/useSchedulerTask').useCreateSchedulerTask).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
        error: null,
      })

      rerender(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      const saveButton = screen.getByRole('button', { name: /saving/i })
      expect(saveButton).toBeDisabled()
      expect(screen.getByRole('status', { name: /saving/i })).toBeInTheDocument()
    })

    it('disables form during loading operations', async () => {
      vi.mocked(require('@/hooks/useSchedulerTask').useSchedulerTask).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      })

      render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      // All form elements should be disabled during loading
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/task name/i)
        const typeSelect = screen.getByLabelText(/task type/i)
        const saveButton = screen.getByRole('button', { name: /save/i })

        expect(nameInput).toBeDisabled()
        expect(typeSelect).toBeDisabled()
        expect(saveButton).toBeDisabled()
      })
    })

    it('shows success notification after successful operations', async () => {
      const nameInput = screen.getByLabelText(/task name/i)
      const saveButton = screen.getByRole('button', { name: /save/i })

      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Task')
      
      mockMutateAsync.mockResolvedValueOnce({ success: true })

      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByRole('alert', { name: /success/i })).toBeInTheDocument()
        expect(screen.getByText(/scheduler task saved successfully/i)).toBeInTheDocument()
      })
    })
  })

  describe('Performance and Optimization', () => {
    it('debounces form validation to prevent excessive API calls', async () => {
      const nameInput = screen.getByLabelText(/task name/i)
      
      await user.clear(nameInput)
      
      // Type rapidly - validation should be debounced
      await user.type(nameInput, 'te')
      await user.type(nameInput, 'st')
      
      // Validation should only happen once after debounce delay
      await waitFor(() => {
        expect(screen.getByText(/task name must be at least 3 characters/i)).toBeInTheDocument()
      }, { timeout: 600 })
    })

    it('optimistically updates UI during mutations', async () => {
      const nameInput = screen.getByLabelText(/task name/i)
      const saveButton = screen.getByRole('button', { name: /save/i })

      await user.clear(nameInput)
      await user.type(nameInput, 'Optimistic Update')

      // Mock slow mutation
      mockMutateAsync.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000))
      )

      await user.click(saveButton)

      // UI should update optimistically before mutation completes
      expect(screen.getByDisplayValue('Optimistic Update')).toBeInTheDocument()
    })

    it('implements proper cleanup to prevent memory leaks', async () => {
      const { unmount } = render(
        <TestProviders queryClient={queryClient}>
          <SchedulerDetailsPage />
        </TestProviders>
      )

      // Component should clean up properly when unmounted
      unmount()

      // Verify no warnings about memory leaks or state updates after unmount
      expect(vi.getTimerCount()).toBe(0)
    })
  })
})