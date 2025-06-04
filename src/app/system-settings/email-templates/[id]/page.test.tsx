import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { NextRouter } from 'next/router'
import { useRouter, useParams } from 'next/navigation'

import EmailTemplateEditPage from './page'
import { mockEmailTemplates, createMockEmailTemplate } from '@/test/mocks/email-templates'
import { createErrorResponse } from '@/test/mocks/error-responses'

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
}))

// Mock authentication hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, email: 'admin@test.com', role: 'admin' },
    isAuthenticated: true,
    token: 'mock-jwt-token',
  })),
}))

// Setup MSW server with email template handlers
const handlers = [
  // GET single email template by ID
  http.get('/api/v2/system/email_template/:id', ({ params }) => {
    const { id } = params
    const template = mockEmailTemplates.find(t => t.id === Number(id))
    
    if (!template) {
      return HttpResponse.json(
        createErrorResponse(404, 'Email template not found'),
        { status: 404 }
      )
    }
    
    return HttpResponse.json({
      resource: [template],
      meta: { count: 1 }
    })
  }),
  
  // PUT update email template
  http.put('/api/v2/system/email_template/:id', async ({ params, request }) => {
    const { id } = params
    const body = await request.json() as any
    const template = mockEmailTemplates.find(t => t.id === Number(id))
    
    if (!template) {
      return HttpResponse.json(
        createErrorResponse(404, 'Email template not found'),
        { status: 404 }
      )
    }
    
    // Simulate validation errors for testing
    if (body.name === 'INVALID_NAME') {
      return HttpResponse.json(
        createErrorResponse(422, 'Validation failed', {
          field_errors: {
            name: ['Name cannot be INVALID_NAME']
          }
        }),
        { status: 422 }
      )
    }
    
    // Simulate server error for testing
    if (body.name === 'SERVER_ERROR') {
      return HttpResponse.json(
        createErrorResponse(500, 'Internal server error'),
        { status: 500 }
      )
    }
    
    const updatedTemplate = { ...template, ...body, id: Number(id) }
    return HttpResponse.json({
      resource: [updatedTemplate],
      meta: { count: 1 }
    })
  }),
]

const server = setupServer(...handlers)

// Test utilities
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

const renderWithProviders = (
  ui: React.ReactElement,
  {
    queryClient = createTestQueryClient(),
    routerMock = {},
  }: {
    queryClient?: QueryClient
    routerMock?: Partial<NextRouter>
  } = {}
) => {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  return render(ui, { wrapper: AllTheProviders })
}

describe('EmailTemplateEditPage', () => {
  const mockPush = vi.fn()
  const mockBack = vi.fn()
  const mockReplace = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    server.listen({ onUnhandledRequest: 'error' })
    
    // Setup router mocks
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: mockBack,
      replace: mockReplace,
      refresh: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    } as any)
    
    vi.mocked(useParams).mockReturnValue({ id: '1' })
  })

  afterEach(() => {
    server.resetHandlers()
    server.close()
  })

  describe('Dynamic Route Parameter Handling', () => {
    it('should extract ID from route parameters correctly', async () => {
      vi.mocked(useParams).mockReturnValue({ id: '123' })
      
      renderWithProviders(<EmailTemplateEditPage />)
      
      await waitFor(() => {
        expect(useParams).toHaveBeenCalled()
      })
      
      // Verify the correct ID is being used in API call
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })
    })

    it('should handle invalid ID parameter', async () => {
      vi.mocked(useParams).mockReturnValue({ id: 'invalid' })
      
      server.use(
        http.get('/api/v2/system/email_template/invalid', () => {
          return HttpResponse.json(
            createErrorResponse(400, 'Invalid ID format'),
            { status: 400 }
          )
        })
      )
      
      renderWithProviders(<EmailTemplateEditPage />)
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid ID format/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Pre-population', () => {
    it('should pre-populate form fields with existing email template data', async () => {
      const mockTemplate = createMockEmailTemplate({
        id: 1,
        name: 'Welcome Email',
        description: 'Welcome new users',
        to: 'user@example.com',
        cc: 'admin@example.com',
        bcc: 'audit@example.com',
        subject: 'Welcome to DreamFactory',
        body_text: 'Welcome message text',
        body_html: '<h1>Welcome</h1>',
        from_name: 'DreamFactory Admin',
        from_email: 'noreply@dreamfactory.com',
        reply_to_name: 'Support Team',
        reply_to_email: 'support@dreamfactory.com',
      })
      
      server.use(
        http.get('/api/v2/system/email_template/1', () => {
          return HttpResponse.json({
            resource: [mockTemplate],
            meta: { count: 1 }
          })
        })
      )
      
      renderWithProviders(<EmailTemplateEditPage />)
      
      // Wait for form to load and populate
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument()
      })
      
      // Verify all fields are pre-populated
      expect(screen.getByDisplayValue('Welcome new users')).toBeInTheDocument()
      expect(screen.getByDisplayValue('user@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('admin@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('audit@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Welcome to DreamFactory')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Welcome message text')).toBeInTheDocument()
      expect(screen.getByDisplayValue('<h1>Welcome</h1>')).toBeInTheDocument()
      expect(screen.getByDisplayValue('DreamFactory Admin')).toBeInTheDocument()
      expect(screen.getByDisplayValue('noreply@dreamfactory.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Support Team')).toBeInTheDocument()
      expect(screen.getByDisplayValue('support@dreamfactory.com')).toBeInTheDocument()
    })

    it('should handle missing optional fields gracefully', async () => {
      const mockTemplate = createMockEmailTemplate({
        id: 1,
        name: 'Minimal Template',
        subject: 'Test Subject',
        body_text: 'Test body',
        // Optional fields are missing
        description: null,
        cc: null,
        bcc: null,
        reply_to_name: null,
        reply_to_email: null,
      })
      
      server.use(
        http.get('/api/v2/system/email_template/1', () => {
          return HttpResponse.json({
            resource: [mockTemplate],
            meta: { count: 1 }
          })
        })
      )
      
      renderWithProviders(<EmailTemplateEditPage />)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Minimal Template')).toBeInTheDocument()
      })
      
      // Verify optional fields are empty but form still works
      const ccField = screen.getByLabelText(/cc/i)
      const bccField = screen.getByLabelText(/bcc/i)
      
      expect(ccField).toHaveValue('')
      expect(bccField).toHaveValue('')
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields with real-time feedback under 100ms', async () => {
      const user = userEvent.setup()
      renderWithProviders(<EmailTemplateEditPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })
      
      const nameField = screen.getByLabelText(/name/i)
      
      // Test real-time validation performance
      const startTime = performance.now()
      
      await user.clear(nameField)
      await user.tab() // Trigger blur validation
      
      const endTime = performance.now()
      const validationTime = endTime - startTime
      
      // Verify validation response time under 100ms
      expect(validationTime).toBeLessThan(100)
      
      // Verify validation error is displayed
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      })
    })

    it('should validate email addresses in recipient fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(<EmailTemplateEditPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/to/i)).toBeInTheDocument()
      })
      
      const toField = screen.getByLabelText(/to/i)
      
      // Test invalid email format
      await user.type(toField, 'invalid-email')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument()
      })
      
      // Test valid email format
      await user.clear(toField)
      await user.type(toField, 'valid@example.com')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.queryByText(/invalid email address/i)).not.toBeInTheDocument()
      })
    })

    it('should validate subject field length constraints', async () => {
      const user = userEvent.setup()
      renderWithProviders(<EmailTemplateEditPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
      })
      
      const subjectField = screen.getByLabelText(/subject/i)
      const longSubject = 'a'.repeat(256) // Exceeds typical email subject limits
      
      await user.type(subjectField, longSubject)
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(/subject too long/i)).toBeInTheDocument()
      })
    })

    it('should validate HTML body content for basic syntax', async () => {
      const user = userEvent.setup()
      renderWithProviders(<EmailTemplateEditPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/html body/i)).toBeInTheDocument()
      })
      
      const htmlBodyField = screen.getByLabelText(/html body/i)
      
      // Test invalid HTML
      await user.type(htmlBodyField, '<div><p>Unclosed tags')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(/invalid html/i)).toBeInTheDocument()
      })
    })
  })

  describe('Update Submission Workflow', () => {
    it('should submit form with valid data successfully', async () => {
      const user = userEvent.setup()
      renderWithProviders(<EmailTemplateEditPage />)
      
      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })
      
      // Fill out the form
      const nameField = screen.getByLabelText(/name/i)
      await user.clear(nameField)
      await user.type(nameField, 'Updated Template Name')
      
      const subjectField = screen.getByLabelText(/subject/i)
      await user.clear(subjectField)
      await user.type(subjectField, 'Updated Subject')
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update template/i })
      await user.click(submitButton)
      
      // Verify success message and navigation
      await waitFor(() => {
        expect(screen.getByText(/template updated successfully/i)).toBeInTheDocument()
      })
      
      expect(mockPush).toHaveBeenCalledWith('/system-settings/email-templates')
    })

    it('should handle server validation errors gracefully', async () => {
      const user = userEvent.setup()
      renderWithProviders(<EmailTemplateEditPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })
      
      // Enter invalid data that triggers server validation error
      const nameField = screen.getByLabelText(/name/i)
      await user.clear(nameField)
      await user.type(nameField, 'INVALID_NAME')
      
      const submitButton = screen.getByRole('button', { name: /update template/i })
      await user.click(submitButton)
      
      // Verify server validation error is displayed
      await waitFor(() => {
        expect(screen.getByText(/Name cannot be INVALID_NAME/i)).toBeInTheDocument()
      })
      
      // Verify form is still editable
      expect(nameField).not.toBeDisabled()
    })

    it('should handle network and server errors with retry options', async () => {
      const user = userEvent.setup()
      renderWithProviders(<EmailTemplateEditPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })
      
      // Enter data that triggers server error
      const nameField = screen.getByLabelText(/name/i)
      await user.clear(nameField)
      await user.type(nameField, 'SERVER_ERROR')
      
      const submitButton = screen.getByRole('button', { name: /update template/i })
      await user.click(submitButton)
      
      // Verify error message and retry option
      await waitFor(() => {
        expect(screen.getByText(/Internal server error/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    it('should disable submit button during form submission', async () => {
      const user = userEvent.setup()
      renderWithProviders(<EmailTemplateEditPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })
      
      const submitButton = screen.getByRole('button', { name: /update template/i })
      
      // Submit the form
      await user.click(submitButton)
      
      // Verify button is disabled during submission
      expect(submitButton).toBeDisabled()
      expect(screen.getByText(/updating.../i)).toBeInTheDocument()
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should display error boundary fallback UI for component errors', async () => {
      // Mock console.error to prevent test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Create a component that throws an error
      const ErrorComponent = () => {
        throw new Error('Test component error')
      }
      
      // Wrap with error boundary (assuming the page has one)
      renderWithProviders(<ErrorComponent />)
      
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
      
      consoleSpy.mockRestore()
    })

    it('should handle API timeout with appropriate error messaging', async () => {
      // Mock a delayed response that times out
      server.use(
        http.get('/api/v2/system/email_template/1', async () => {
          await new Promise(resolve => setTimeout(resolve, 5000)) // 5 second delay
          return HttpResponse.json({ resource: [], meta: { count: 0 } })
        })
      )
      
      renderWithProviders(<EmailTemplateEditPage />)
      
      await waitFor(() => {
        expect(screen.getByText(/request timeout/i)).toBeInTheDocument()
      }, { timeout: 6000 })
    })

    it('should provide error recovery options for different error types', async () => {
      const user = userEvent.setup()
      
      // Test 404 error recovery
      server.use(
        http.get('/api/v2/system/email_template/999', () => {
          return HttpResponse.json(
            createErrorResponse(404, 'Email template not found'),
            { status: 404 }
          )
        })
      )
      
      vi.mocked(useParams).mockReturnValue({ id: '999' })
      
      renderWithProviders(<EmailTemplateEditPage />)
      
      await waitFor(() => {
        expect(screen.getByText(/Email template not found/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
      })
      
      // Test go back functionality
      const goBackButton = screen.getByRole('button', { name: /go back/i })
      await user.click(goBackButton)
      
      expect(mockBack).toHaveBeenCalled()
    })
  })

  describe('User Interactions and Accessibility', () => {
    it('should support keyboard navigation throughout the form', async () => {
      const user = userEvent.setup()
      renderWithProviders(<EmailTemplateEditPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })
      
      // Test tab navigation through form fields
      const nameField = screen.getByLabelText(/name/i)
      const subjectField = screen.getByLabelText(/subject/i)
      const submitButton = screen.getByRole('button', { name: /update template/i })
      
      nameField.focus()
      expect(nameField).toHaveFocus()
      
      await user.tab()
      expect(subjectField).toHaveFocus()
      
      // Continue tabbing to reach submit button
      await user.tab({ shift: false })
      // Continue until submit button is focused
      let attempts = 0
      while (!submitButton.matches(':focus') && attempts < 10) {
        await user.tab()
        attempts++
      }
      
      expect(submitButton).toHaveFocus()
    })

    it('should announce form validation errors to screen readers', async () => {
      const user = userEvent.setup()
      renderWithProviders(<EmailTemplateEditPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })
      
      const nameField = screen.getByLabelText(/name/i)
      
      await user.clear(nameField)
      await user.tab()
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/name is required/i)
        expect(errorMessage).toBeInTheDocument()
        
        // Verify aria-describedby relationship
        expect(nameField).toHaveAttribute('aria-describedby')
        expect(errorMessage).toHaveAttribute('role', 'alert')
      })
    })

    it('should maintain focus management during error states', async () => {
      const user = userEvent.setup()
      renderWithProviders(<EmailTemplateEditPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })
      
      const nameField = screen.getByLabelText(/name/i)
      
      // Create validation error
      await user.clear(nameField)
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      })
      
      // Focus should remain manageable
      nameField.focus()
      expect(nameField).toHaveFocus()
    })

    it('should provide clear visual feedback for form state changes', async () => {
      const user = userEvent.setup()
      renderWithProviders(<EmailTemplateEditPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })
      
      const nameField = screen.getByLabelText(/name/i)
      
      // Test input focus styles
      await user.click(nameField)
      expect(nameField).toHaveClass('focus:ring-2') // Tailwind focus ring class
      
      // Test error state styling
      await user.clear(nameField)
      await user.tab()
      
      await waitFor(() => {
        expect(nameField).toHaveClass('border-red-500') // Error border class
      })
    })
  })

  describe('React Query Integration and State Management', () => {
    it('should cache email template data efficiently', async () => {
      const queryClient = createTestQueryClient()
      const querySpy = vi.spyOn(queryClient, 'getQueryData')
      
      renderWithProviders(<EmailTemplateEditPage />, { queryClient })
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Template')).toBeInTheDocument()
      })
      
      // Verify data is cached
      expect(querySpy).toHaveBeenCalled()
    })

    it('should handle optimistic updates during form submission', async () => {
      const user = userEvent.setup()
      const queryClient = createTestQueryClient()
      
      renderWithProviders(<EmailTemplateEditPage />, { queryClient })
      
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })
      
      const nameField = screen.getByLabelText(/name/i)
      await user.clear(nameField)
      await user.type(nameField, 'Optimistically Updated Name')
      
      const submitButton = screen.getByRole('button', { name: /update template/i })
      await user.click(submitButton)
      
      // Verify optimistic update is reflected immediately
      expect(screen.getByDisplayValue('Optimistically Updated Name')).toBeInTheDocument()
    })

    it('should invalidate and refetch data after successful update', async () => {
      const user = userEvent.setup()
      const queryClient = createTestQueryClient()
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')
      
      renderWithProviders(<EmailTemplateEditPage />, { queryClient })
      
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })
      
      const submitButton = screen.getByRole('button', { name: /update template/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/template updated successfully/i)).toBeInTheDocument()
      })
      
      // Verify cache invalidation
      expect(invalidateQueriesSpy).toHaveBeenCalledWith(['email-template', '1'])
    })
  })

  describe('Performance and Responsiveness', () => {
    it('should render initial form within acceptable time limits', async () => {
      const startTime = performance.now()
      
      renderWithProviders(<EmailTemplateEditPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Verify initial render is under 2 seconds (SSR requirement)
      expect(renderTime).toBeLessThan(2000)
    })

    it('should handle large form data efficiently', async () => {
      const largeTemplate = createMockEmailTemplate({
        id: 1,
        body_html: '<div>' + 'Large content '.repeat(1000) + '</div>',
        body_text: 'Large text content '.repeat(1000),
      })
      
      server.use(
        http.get('/api/v2/system/email_template/1', () => {
          return HttpResponse.json({
            resource: [largeTemplate],
            meta: { count: 1 }
          })
        })
      )
      
      const startTime = performance.now()
      
      renderWithProviders(<EmailTemplateEditPage />)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue(largeTemplate.name)).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Verify large data handling doesn't significantly impact performance
      expect(renderTime).toBeLessThan(3000)
    })
  })
})