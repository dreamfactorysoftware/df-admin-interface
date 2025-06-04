/**
 * @fileoverview Vitest test suite for email template creation page component
 * Tests form validation, submission workflows, error handling, and user interactions
 * Implements MSW mocking for API calls and comprehensive test coverage
 * 
 * Replaces Angular Jest test patterns with modern React testing approaches
 * per Section 7.1.2 Testing Configuration and React/Next.js Integration Requirements
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server } from '@/test/mocks/server'
import { rest } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextRouter } from 'next/router'
import { useRouter } from 'next/navigation'

// Import the component being tested
import CreateEmailTemplatePage from './page'

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => '/system-settings/email-templates/create'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}))

// Mock the email templates hook
vi.mock('@/hooks/use-email-templates', () => ({
  useEmailTemplates: vi.fn(),
  useCreateEmailTemplate: vi.fn(),
  useUpdateEmailTemplate: vi.fn(),
  useDeleteEmailTemplate: vi.fn(),
}))

// Mock the auth hook
vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, email: 'admin@test.com', role: 'admin' },
    isAuthenticated: true,
    permissions: ['create_email_templates'],
  })),
}))

// Mock the notification hook
vi.mock('@/hooks/use-notifications', () => ({
  useNotifications: vi.fn(() => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
  })),
}))

// Test utilities and mock data
const mockEmailTemplate = {
  id: 1,
  name: 'Welcome Email',
  description: 'Welcome new users',
  to: 'user@example.com',
  cc: '',
  bcc: '',
  subject: 'Welcome to DreamFactory',
  body_text: 'Welcome to our platform!',
  body_html: '<p>Welcome to our platform!</p>',
  from_name: 'DreamFactory Team',
  from_email: 'noreply@dreamfactory.com',
  reply_to_name: 'Support Team',
  reply_to_email: 'support@dreamfactory.com',
  defaults: [],
  created_date: '2024-01-01T00:00:00Z',
  last_modified_date: '2024-01-01T00:00:00Z',
}

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
})

// Custom render function with providers
const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createQueryClient()
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

// Mock router instance
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
} as Partial<NextRouter>

describe('CreateEmailTemplatePage', () => {
  let mockCreateEmailTemplate: ReturnType<typeof vi.fn>
  let mockShowSuccess: ReturnType<typeof vi.fn>
  let mockShowError: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Setup router mock
    ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter)
    
    // Setup hooks mocks
    mockCreateEmailTemplate = vi.fn()
    mockShowSuccess = vi.fn()
    mockShowError = vi.fn()
    
    const { useCreateEmailTemplate } = require('@/hooks/use-email-templates')
    const { useNotifications } = require('@/hooks/use-notifications')
    
    useCreateEmailTemplate.mockReturnValue({
      mutate: mockCreateEmailTemplate,
      isLoading: false,
      error: null,
      isSuccess: false,
    })
    
    useNotifications.mockReturnValue({
      showSuccess: mockShowSuccess,
      showError: mockShowError,
      showWarning: vi.fn(),
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Page Rendering', () => {
    it('should render the email template creation form', () => {
      renderWithProviders(<CreateEmailTemplatePage />)
      
      // Check for main form elements
      expect(screen.getByRole('heading', { name: /create email template/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/template name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create template/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should render all required form fields', () => {
      renderWithProviders(<CreateEmailTemplatePage />)
      
      // Essential fields
      expect(screen.getByLabelText(/template name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/to/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/body text/i)).toBeInTheDocument()
      
      // Optional fields
      expect(screen.getByLabelText(/cc/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/bcc/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/from name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/from email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/reply to name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/reply to email/i)).toBeInTheDocument()
    })

    it('should have proper accessibility attributes', () => {
      renderWithProviders(<CreateEmailTemplatePage />)
      
      // Check for proper labeling
      const nameInput = screen.getByLabelText(/template name/i)
      expect(nameInput).toHaveAttribute('required')
      expect(nameInput).toHaveAttribute('aria-required', 'true')
      
      // Check for form structure
      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()
      expect(form).toHaveAttribute('noValidate')
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields on form submission', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateEmailTemplatePage />)
      
      const submitButton = screen.getByRole('button', { name: /create template/i })
      
      await user.click(submitButton)
      
      // Check for validation errors
      expect(screen.getByText(/template name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/subject is required/i)).toBeInTheDocument()
      expect(screen.getByText(/body text is required/i)).toBeInTheDocument()
      
      // Ensure form was not submitted
      expect(mockCreateEmailTemplate).not.toHaveBeenCalled()
    })

    it('should validate email format in email fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateEmailTemplatePage />)
      
      const toField = screen.getByLabelText(/to/i)
      const fromEmailField = screen.getByLabelText(/from email/i)
      
      // Enter invalid email formats
      await user.type(toField, 'invalid-email')
      await user.type(fromEmailField, 'another-invalid-email')
      
      // Trigger validation by attempting to submit
      await user.click(screen.getByRole('button', { name: /create template/i }))
      
      // Check for email validation errors
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })

    it('should perform real-time validation with debouncing', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateEmailTemplatePage />)
      
      const nameField = screen.getByLabelText(/template name/i)
      
      // Type in the field
      await user.type(nameField, 'a')
      
      // Initially should show error for short name
      await waitFor(() => {
        expect(screen.getByText(/template name must be at least 2 characters/i)).toBeInTheDocument()
      }, { timeout: 200 }) // Under 100ms requirement + buffer
      
      // Clear and type valid name
      await user.clear(nameField)
      await user.type(nameField, 'Valid Template Name')
      
      // Error should disappear
      await waitFor(() => {
        expect(screen.queryByText(/template name must be at least 2 characters/i)).not.toBeInTheDocument()
      })
    })

    it('should validate template name uniqueness', async () => {
      const user = userEvent.setup()
      
      // Mock API to return conflict error
      server.use(
        rest.post('/api/v2/system/email_template', (req, res, ctx) => {
          return res(
            ctx.status(409),
            ctx.json({
              error: {
                code: 409,
                message: 'Template name already exists',
                details: 'A template with this name already exists'
              }
            })
          )
        })
      )
      
      renderWithProviders(<CreateEmailTemplatePage />)
      
      // Fill out form with duplicate name
      await user.type(screen.getByLabelText(/template name/i), 'Existing Template')
      await user.type(screen.getByLabelText(/description/i), 'Test description')
      await user.type(screen.getByLabelText(/subject/i), 'Test Subject')
      await user.type(screen.getByLabelText(/body text/i), 'Test body content')
      
      await user.click(screen.getByRole('button', { name: /create template/i }))
      
      // Check for duplicate name error
      await waitFor(() => {
        expect(screen.getByText(/template name already exists/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      
      // Mock successful API response
      server.use(
        rest.post('/api/v2/system/email_template', (req, res, ctx) => {
          return res(ctx.status(201), ctx.json(mockEmailTemplate))
        })
      )
      
      mockCreateEmailTemplate.mockImplementation((data, { onSuccess }) => {
        onSuccess(mockEmailTemplate)
      })
      
      renderWithProviders(<CreateEmailTemplatePage />)
      
      // Fill out required fields
      await user.type(screen.getByLabelText(/template name/i), 'New Template')
      await user.type(screen.getByLabelText(/description/i), 'Test description')
      await user.type(screen.getByLabelText(/to/i), 'user@example.com')
      await user.type(screen.getByLabelText(/subject/i), 'Test Subject')
      await user.type(screen.getByLabelText(/body text/i), 'Test body content')
      
      await user.click(screen.getByRole('button', { name: /create template/i }))
      
      // Verify submission
      await waitFor(() => {
        expect(mockCreateEmailTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Template',
            description: 'Test description',
            to: 'user@example.com',
            subject: 'Test Subject',
            body_text: 'Test body content',
          })
        )
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      
      // Mock loading state
      const { useCreateEmailTemplate } = require('@/hooks/use-email-templates')
      useCreateEmailTemplate.mockReturnValue({
        mutate: mockCreateEmailTemplate,
        isLoading: true,
        error: null,
        isSuccess: false,
      })
      
      renderWithProviders(<CreateEmailTemplatePage />)
      
      // Submit button should be disabled and show loading
      const submitButton = screen.getByRole('button', { name: /creating.../i })
      expect(submitButton).toBeDisabled()
      expect(screen.getByRole('status')).toBeInTheDocument() // Loading spinner
    })

    it('should navigate back to templates list on successful creation', async () => {
      const user = userEvent.setup()
      
      mockCreateEmailTemplate.mockImplementation((data, { onSuccess }) => {
        onSuccess(mockEmailTemplate)
      })
      
      renderWithProviders(<CreateEmailTemplatePage />)
      
      // Fill out and submit form
      await user.type(screen.getByLabelText(/template name/i), 'New Template')
      await user.type(screen.getByLabelText(/description/i), 'Test description')
      await user.type(screen.getByLabelText(/subject/i), 'Test Subject')
      await user.type(screen.getByLabelText(/body text/i), 'Test body content')
      
      await user.click(screen.getByRole('button', { name: /create template/i }))
      
      // Verify navigation
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/system-settings/email-templates')
      })
      
      // Verify success notification
      expect(mockShowSuccess).toHaveBeenCalledWith('Email template created successfully')
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock API error
      server.use(
        rest.post('/api/v2/system/email_template', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              error: {
                code: 500,
                message: 'Internal server error',
                details: 'Unable to create email template'
              }
            })
          )
        })
      )
      
      mockCreateEmailTemplate.mockImplementation((data, { onError }) => {
        onError(new Error('Internal server error'))
      })
      
      renderWithProviders(<CreateEmailTemplatePage />)
      
      // Fill out and submit form
      await user.type(screen.getByLabelText(/template name/i), 'New Template')
      await user.type(screen.getByLabelText(/subject/i), 'Test Subject')
      await user.type(screen.getByLabelText(/body text/i), 'Test body content')
      
      await user.click(screen.getByRole('button', { name: /create template/i }))
      
      // Check for error display
      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('Failed to create email template')
        expect(screen.getByText(/failed to create email template/i)).toBeInTheDocument()
      })
    })

    it('should handle network errors with retry option', async () => {
      const user = userEvent.setup()
      
      // Mock network error
      server.use(
        rest.post('/api/v2/system/email_template', (req, res, ctx) => {
          return res.networkError('Network connection failed')
        })
      )
      
      renderWithProviders(<CreateEmailTemplatePage />)
      
      // Fill out and submit form
      await user.type(screen.getByLabelText(/template name/i), 'New Template')
      await user.type(screen.getByLabelText(/subject/i), 'Test Subject')
      await user.type(screen.getByLabelText(/body text/i), 'Test body content')
      
      await user.click(screen.getByRole('button', { name: /create template/i }))
      
      // Check for network error handling
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })
  })

  describe('User Interactions', () => {
    it('should handle cancel button correctly', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateEmailTemplatePage />)
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      
      expect(mockRouter.back).toHaveBeenCalled()
    })

    it('should handle keyboard navigation properly', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateEmailTemplatePage />)
      
      const nameField = screen.getByLabelText(/template name/i)
      const descriptionField = screen.getByLabelText(/description/i)
      
      // Tab navigation
      nameField.focus()
      expect(nameField).toHaveFocus()
      
      await user.tab()
      expect(descriptionField).toHaveFocus()
      
      // Enter key should not submit form in text fields
      await user.type(nameField, 'Test{enter}')
      expect(mockCreateEmailTemplate).not.toHaveBeenCalled()
    })

    it('should handle form reset functionality', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateEmailTemplatePage />)
      
      // Fill out some fields
      await user.type(screen.getByLabelText(/template name/i), 'Test Template')
      await user.type(screen.getByLabelText(/description/i), 'Test description')
      
      // Reset form (if reset button exists)
      const resetButton = screen.queryByRole('button', { name: /reset/i })
      if (resetButton) {
        await user.click(resetButton)
        
        expect(screen.getByLabelText(/template name/i)).toHaveValue('')
        expect(screen.getByLabelText(/description/i)).toHaveValue('')
      }
    })
  })

  describe('Performance Requirements', () => {
    it('should validate form fields under 100ms', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateEmailTemplatePage />)
      
      const nameField = screen.getByLabelText(/template name/i)
      const startTime = performance.now()
      
      await user.type(nameField, 'Test')
      
      // Wait for validation to complete
      await waitFor(() => {
        const endTime = performance.now()
        const validationTime = endTime - startTime
        
        // Should complete under 100ms per requirements
        expect(validationTime).toBeLessThan(100)
      })
    })

    it('should handle large form data efficiently', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CreateEmailTemplatePage />)
      
      const largeText = 'A'.repeat(10000) // 10KB of text
      const bodyField = screen.getByLabelText(/body text/i)
      
      const startTime = performance.now()
      await user.type(bodyField, largeText)
      const endTime = performance.now()
      
      // Should handle large input efficiently
      expect(endTime - startTime).toBeLessThan(1000)
    })
  })

  describe('Integration with React Query', () => {
    it('should handle cache invalidation after successful creation', async () => {
      const user = userEvent.setup()
      const queryClient = createQueryClient()
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')
      
      mockCreateEmailTemplate.mockImplementation((data, { onSuccess }) => {
        onSuccess(mockEmailTemplate)
      })
      
      render(
        <QueryClientProvider client={queryClient}>
          <CreateEmailTemplatePage />
        </QueryClientProvider>
      )
      
      // Submit form
      await user.type(screen.getByLabelText(/template name/i), 'New Template')
      await user.type(screen.getByLabelText(/subject/i), 'Test Subject')
      await user.type(screen.getByLabelText(/body text/i), 'Test body content')
      
      await user.click(screen.getByRole('button', { name: /create template/i }))
      
      // Verify cache invalidation
      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith(['email-templates'])
      })
    })

    it('should handle optimistic updates correctly', async () => {
      const user = userEvent.setup()
      
      mockCreateEmailTemplate.mockImplementation((data, { onMutate }) => {
        // Simulate optimistic update
        onMutate?.(data)
      })
      
      renderWithProviders(<CreateEmailTemplatePage />)
      
      // Submit form
      await user.type(screen.getByLabelText(/template name/i), 'New Template')
      await user.type(screen.getByLabelText(/subject/i), 'Test Subject')
      await user.type(screen.getByLabelText(/body text/i), 'Test body content')
      
      await user.click(screen.getByRole('button', { name: /create template/i }))
      
      // Verify optimistic update behavior
      expect(mockCreateEmailTemplate).toHaveBeenCalled()
    })
  })

  describe('Accessibility Compliance', () => {
    it('should maintain WCAG 2.1 AA compliance', () => {
      renderWithProviders(<CreateEmailTemplatePage />)
      
      // Check for proper heading hierarchy
      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toBeInTheDocument()
      
      // Check for proper form labeling
      const inputs = screen.getAllByRole('textbox')
      inputs.forEach(input => {
        expect(input).toHaveAccessibleName()
      })
      
      // Check for error message association
      const nameField = screen.getByLabelText(/template name/i)
      expect(nameField).toHaveAttribute('aria-describedby')
    })

    it('should support screen reader navigation', () => {
      renderWithProviders(<CreateEmailTemplatePage />)
      
      // Check for landmarks
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('form')).toBeInTheDocument()
      
      // Check for skip links if present
      const skipLink = screen.queryByText(/skip to content/i)
      if (skipLink) {
        expect(skipLink).toHaveAttribute('href', '#main-content')
      }
    })
  })

  describe('MSW Integration', () => {
    it('should mock DreamFactory API endpoints correctly', async () => {
      const user = userEvent.setup()
      
      // Spy on MSW handlers
      const createHandler = vi.fn()
      server.use(
        rest.post('/api/v2/system/email_template', (req, res, ctx) => {
          createHandler(req.body)
          return res(ctx.status(201), ctx.json(mockEmailTemplate))
        })
      )
      
      renderWithProviders(<CreateEmailTemplatePage />)
      
      // Submit form
      await user.type(screen.getByLabelText(/template name/i), 'Test Template')
      await user.type(screen.getByLabelText(/subject/i), 'Test Subject')
      await user.type(screen.getByLabelText(/body text/i), 'Test body content')
      
      await user.click(screen.getByRole('button', { name: /create template/i }))
      
      // Verify MSW handler was called
      await waitFor(() => {
        expect(createHandler).toHaveBeenCalled()
      })
    })
  })
})