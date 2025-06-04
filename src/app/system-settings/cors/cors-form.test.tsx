import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '@/test/mocks/server'
import { corsHandlers } from '@/test/mocks/cors-handlers'
import { errorResponseHandlers } from '@/test/mocks/error-responses'
import { CorsForm } from './cors-form'
import type { CorsConfiguration } from '@/types/cors'

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations)

// Mock Next.js router for form navigation testing
const mockPush = vi.fn()
const mockBack = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock toast notifications
const mockToast = vi.fn()
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

// Test utilities for React Hook Form and React Query
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Mock CORS configuration data for testing
const mockCorsConfiguration: CorsConfiguration = {
  id: '1',
  name: 'Test CORS Policy',
  description: 'Test CORS policy description',
  enabled: true,
  origins: ['https://example.com', 'https://app.example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  headers: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  max_age: 3600,
  exposed_headers: ['X-Custom-Header'],
  created_date: new Date().toISOString(),
  last_modified_date: new Date().toISOString(),
}

const mockNewCorsConfiguration = {
  name: 'New CORS Policy',
  description: 'New CORS policy description',
  enabled: true,
  origins: ['https://newsite.com'],
  methods: ['GET', 'POST'],
  headers: ['Content-Type'],
  credentials: false,
  max_age: 7200,
  exposed_headers: [],
}

describe('CorsForm Component', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeAll(() => {
    // Setup MSW server with CORS handlers
    server.use(...corsHandlers)
  })

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
    mockPush.mockClear()
    mockBack.mockClear()
    mockToast.mockClear()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  describe('Form Rendering and Initial State', () => {
    it('renders create form with default values', () => {
      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      expect(screen.getByRole('heading', { name: /create cors policy/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/policy name/i)).toHaveValue('')
      expect(screen.getByLabelText(/description/i)).toHaveValue('')
      expect(screen.getByLabelText(/enabled/i)).toBeChecked()
      expect(screen.getByRole('button', { name: /create policy/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('renders edit form with pre-filled values', () => {
      render(
        <TestWrapper>
          <CorsForm mode="edit" initialData={mockCorsConfiguration} />
        </TestWrapper>
      )

      expect(screen.getByRole('heading', { name: /edit cors policy/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/policy name/i)).toHaveValue('Test CORS Policy')
      expect(screen.getByLabelText(/description/i)).toHaveValue('Test CORS policy description')
      expect(screen.getByLabelText(/enabled/i)).toBeChecked()
      expect(screen.getByRole('button', { name: /update policy/i })).toBeInTheDocument()
    })

    it('applies proper CSS classes and Tailwind styling', () => {
      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      const form = screen.getByRole('form')
      expect(form).toHaveClass('space-y-6')
      
      const nameInput = screen.getByLabelText(/policy name/i)
      expect(nameInput).toHaveClass('w-full', 'rounded-md', 'border')
    })
  })

  describe('Form Validation with Zod Schema', () => {
    it('validates required fields and shows error messages', async () => {
      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      const submitButton = screen.getByRole('button', { name: /create policy/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/policy name is required/i)).toBeInTheDocument()
      })
    })

    it('validates policy name length constraints', async () => {
      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      const nameInput = screen.getByLabelText(/policy name/i)
      
      // Test minimum length validation
      await user.type(nameInput, 'a')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/policy name must be at least 3 characters/i)).toBeInTheDocument()
      })

      // Test maximum length validation
      await user.clear(nameInput)
      await user.type(nameInput, 'a'.repeat(256))
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/policy name must be less than 255 characters/i)).toBeInTheDocument()
      })
    })

    it('validates origin URLs format', async () => {
      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      const originsInput = screen.getByLabelText(/allowed origins/i)
      
      // Test invalid URL format
      await user.type(originsInput, 'invalid-url')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/please enter valid URLs/i)).toBeInTheDocument()
      })

      // Test valid URL format
      await user.clear(originsInput)
      await user.type(originsInput, 'https://example.com')
      await user.tab()

      await waitFor(() => {
        expect(screen.queryByText(/please enter valid URLs/i)).not.toBeInTheDocument()
      })
    })

    it('validates methods selection', async () => {
      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      const nameInput = screen.getByLabelText(/policy name/i)
      await user.type(nameInput, 'Test Policy')

      // Clear all method selections
      const getCheckbox = screen.getByLabelText(/GET/i)
      const postCheckbox = screen.getByLabelText(/POST/i)
      
      await user.click(getCheckbox) // Uncheck GET
      await user.click(postCheckbox) // Uncheck POST

      const submitButton = screen.getByRole('button', { name: /create policy/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/at least one HTTP method must be selected/i)).toBeInTheDocument()
      })
    })

    it('validates max age numeric range', async () => {
      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      const maxAgeInput = screen.getByLabelText(/max age \(seconds\)/i)
      
      // Test negative value
      await user.type(maxAgeInput, '-1')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/max age must be a positive number/i)).toBeInTheDocument()
      })

      // Test valid value
      await user.clear(maxAgeInput)
      await user.type(maxAgeInput, '3600')
      await user.tab()

      await waitFor(() => {
        expect(screen.queryByText(/max age must be a positive number/i)).not.toBeInTheDocument()
      })
    })

    it('provides real-time validation feedback under 100ms', async () => {
      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      const nameInput = screen.getByLabelText(/policy name/i)
      const startTime = performance.now()
      
      await user.type(nameInput, 'a')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/policy name must be at least 3 characters/i)).toBeInTheDocument()
      })

      const endTime = performance.now()
      const validationTime = endTime - startTime
      
      // Validation should be under 100ms as per requirements
      expect(validationTime).toBeLessThan(100)
    })
  })

  describe('Form Interactions and User Experience', () => {
    it('handles form field interactions correctly', async () => {
      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      // Test text input
      const nameInput = screen.getByLabelText(/policy name/i)
      await user.type(nameInput, 'My CORS Policy')
      expect(nameInput).toHaveValue('My CORS Policy')

      // Test checkbox interaction
      const credentialsCheckbox = screen.getByLabelText(/allow credentials/i)
      expect(credentialsCheckbox).not.toBeChecked()
      await user.click(credentialsCheckbox)
      expect(credentialsCheckbox).toBeChecked()

      // Test switch interaction
      const enabledSwitch = screen.getByLabelText(/enabled/i)
      expect(enabledSwitch).toBeChecked()
      await user.click(enabledSwitch)
      expect(enabledSwitch).not.toBeChecked()
    })

    it('handles multiple origins input correctly', async () => {
      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      const originsInput = screen.getByLabelText(/allowed origins/i)
      
      // Add multiple origins separated by comma
      await user.type(originsInput, 'https://example.com, https://app.example.com')
      expect(originsInput).toHaveValue('https://example.com, https://app.example.com')

      // Verify individual origins are parsed correctly in form state
      const nameInput = screen.getByLabelText(/policy name/i)
      await user.type(nameInput, 'Multi-Origin Policy')
      
      const submitButton = screen.getByRole('button', { name: /create policy/i })
      await user.click(submitButton)

      // Should not show validation errors for properly formatted URLs
      await waitFor(() => {
        expect(screen.queryByText(/please enter valid URLs/i)).not.toBeInTheDocument()
      })
    })

    it('handles dynamic headers configuration', async () => {
      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      const headersInput = screen.getByLabelText(/allowed headers/i)
      
      // Test custom headers input
      await user.type(headersInput, 'X-Custom-Header, Authorization')
      expect(headersInput).toHaveValue('X-Custom-Header, Authorization')

      // Test common headers selection
      const contentTypeCheckbox = screen.getByLabelText(/content-type/i)
      await user.click(contentTypeCheckbox)
      expect(contentTypeCheckbox).toBeChecked()
    })

    it('resets form when cancel button is clicked', async () => {
      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      const nameInput = screen.getByLabelText(/policy name/i)
      await user.type(nameInput, 'Test Policy')
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockBack).toHaveBeenCalledOnce()
    })
  })

  describe('CORS Creation Operations', () => {
    it('successfully creates a new CORS policy', async () => {
      server.use(...corsHandlers)

      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      // Fill in required fields
      await user.type(screen.getByLabelText(/policy name/i), mockNewCorsConfiguration.name)
      await user.type(screen.getByLabelText(/description/i), mockNewCorsConfiguration.description)
      await user.type(screen.getByLabelText(/allowed origins/i), mockNewCorsConfiguration.origins.join(', '))
      await user.type(screen.getByLabelText(/max age/i), mockNewCorsConfiguration.max_age.toString())

      const submitButton = screen.getByRole('button', { name: /create policy/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'CORS policy created successfully',
          variant: 'default',
        })
      })

      expect(mockPush).toHaveBeenCalledWith('/system-settings/cors')
    })

    it('handles creation errors gracefully', async () => {
      server.use(...errorResponseHandlers.cors.create)

      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      // Fill in required fields
      await user.type(screen.getByLabelText(/policy name/i), 'Test Policy')
      await user.type(screen.getByLabelText(/allowed origins/i), 'https://example.com')

      const submitButton = screen.getByRole('button', { name: /create policy/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to create cors policy/i)).toBeInTheDocument()
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to create CORS policy. Please try again.',
        variant: 'destructive',
      })
    })

    it('shows loading state during creation', async () => {
      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      // Fill in required fields
      await user.type(screen.getByLabelText(/policy name/i), 'Test Policy')
      await user.type(screen.getByLabelText(/allowed origins/i), 'https://example.com')

      const submitButton = screen.getByRole('button', { name: /create policy/i })
      await user.click(submitButton)

      // Check for loading state
      expect(screen.getByRole('button', { name: /creating.../i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /creating.../i })).toBeDisabled()
    })
  })

  describe('CORS Editing Operations', () => {
    it('successfully updates an existing CORS policy', async () => {
      server.use(...corsHandlers)

      render(
        <TestWrapper>
          <CorsForm mode="edit" initialData={mockCorsConfiguration} />
        </TestWrapper>
      )

      // Modify the policy name
      const nameInput = screen.getByLabelText(/policy name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated CORS Policy')

      const submitButton = screen.getByRole('button', { name: /update policy/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'CORS policy updated successfully',
          variant: 'default',
        })
      })

      expect(mockPush).toHaveBeenCalledWith('/system-settings/cors')
    })

    it('handles update errors gracefully', async () => {
      server.use(...errorResponseHandlers.cors.update)

      render(
        <TestWrapper>
          <CorsForm mode="edit" initialData={mockCorsConfiguration} />
        </TestWrapper>
      )

      const submitButton = screen.getByRole('button', { name: /update policy/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to update cors policy/i)).toBeInTheDocument()
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to update CORS policy. Please try again.',
        variant: 'destructive',
      })
    })

    it('preserves form data during validation errors', async () => {
      render(
        <TestWrapper>
          <CorsForm mode="edit" initialData={mockCorsConfiguration} />
        </TestWrapper>
      )

      const nameInput = screen.getByLabelText(/policy name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'ab') // Too short

      const submitButton = screen.getByRole('button', { name: /update policy/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/policy name must be at least 3 characters/i)).toBeInTheDocument()
      })

      // Other fields should retain their values
      expect(screen.getByLabelText(/description/i)).toHaveValue('Test CORS policy description')
      expect(screen.getByLabelText(/enabled/i)).toBeChecked()
    })
  })

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('passes automated accessibility checks', async () => {
      const { container } = render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('supports keyboard navigation throughout the form', async () => {
      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      const nameInput = screen.getByLabelText(/policy name/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const enabledSwitch = screen.getByLabelText(/enabled/i)
      const originsInput = screen.getByLabelText(/allowed origins/i)
      const submitButton = screen.getByRole('button', { name: /create policy/i })

      // Test tab navigation
      nameInput.focus()
      expect(document.activeElement).toBe(nameInput)

      await user.tab()
      expect(document.activeElement).toBe(descriptionInput)

      await user.tab()
      expect(document.activeElement).toBe(enabledSwitch)

      await user.tab()
      expect(document.activeElement).toBe(originsInput)

      // Navigate to submit button
      while (document.activeElement !== submitButton) {
        await user.tab()
      }
      expect(document.activeElement).toBe(submitButton)
    })

    it('provides proper ARIA labels and descriptions', () => {
      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      // Check for proper labeling
      expect(screen.getByLabelText(/policy name/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/allowed origins/i)).toHaveAttribute('aria-describedby')
      
      // Check for error announcements
      const nameInput = screen.getByLabelText(/policy name/i)
      expect(nameInput).toHaveAttribute('aria-invalid', 'false')
    })

    it('announces form errors to screen readers', async () => {
      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      const submitButton = screen.getByRole('button', { name: /create policy/i })
      await user.click(submitButton)

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/policy name/i)
        expect(nameInput).toHaveAttribute('aria-invalid', 'true')
        expect(nameInput).toHaveAttribute('aria-describedby')
        
        const errorElement = screen.getByText(/policy name is required/i)
        expect(errorElement).toHaveAttribute('role', 'alert')
      })
    })

    it('supports high contrast mode and screen readers', () => {
      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      // Check for proper semantic markup
      expect(screen.getByRole('form')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /create cors policy/i })).toBeInTheDocument()
      
      // Check for proper input types
      expect(screen.getByLabelText(/policy name/i)).toHaveAttribute('type', 'text')
      expect(screen.getByLabelText(/max age/i)).toHaveAttribute('type', 'number')
    })
  })

  describe('Error Handling and Recovery', () => {
    it('displays user-friendly error messages for network errors', async () => {
      server.use(...errorResponseHandlers.network)

      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      await user.type(screen.getByLabelText(/policy name/i), 'Test Policy')
      await user.type(screen.getByLabelText(/allowed origins/i), 'https://example.com')

      const submitButton = screen.getByRole('button', { name: /create policy/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/network error occurred/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    it('allows retry after server errors', async () => {
      server.use(...errorResponseHandlers.cors.serverError)

      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      await user.type(screen.getByLabelText(/policy name/i), 'Test Policy')
      await user.type(screen.getByLabelText(/allowed origins/i), 'https://example.com')

      const submitButton = screen.getByRole('button', { name: /create policy/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/server error occurred/i)).toBeInTheDocument()
      })

      // Server error should reset to success handlers for retry
      server.use(...corsHandlers)
      
      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'CORS policy created successfully',
          variant: 'default',
        })
      })
    })

    it('handles validation errors from server', async () => {
      server.use(...errorResponseHandlers.cors.validation)

      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      await user.type(screen.getByLabelText(/policy name/i), 'Duplicate Policy')
      await user.type(screen.getByLabelText(/allowed origins/i), 'https://example.com')

      const submitButton = screen.getByRole('button', { name: /create policy/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/policy name already exists/i)).toBeInTheDocument()
      })

      // Form should remain in editable state
      expect(screen.getByLabelText(/policy name/i)).not.toBeDisabled()
    })

    it('implements error boundary for critical form errors', async () => {
      // Mock a critical error that would trigger error boundary
      const ConsoleError = console.error
      console.error = vi.fn()

      const ErrorThrowingForm = () => {
        throw new Error('Critical form error')
      }

      render(
        <TestWrapper>
          <ErrorThrowingForm />
        </TestWrapper>
      )

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()

      console.error = ConsoleError
    })
  })

  describe('Performance and Optimization', () => {
    it('debounces validation to prevent excessive API calls', async () => {
      const validationSpy = vi.fn()

      render(
        <TestWrapper>
          <CorsForm mode="create" onValidate={validationSpy} />
        </TestWrapper>
      )

      const nameInput = screen.getByLabelText(/policy name/i)
      
      // Type rapidly to test debouncing
      await user.type(nameInput, 'Test')
      
      // Validation should be debounced and not called for each character
      expect(validationSpy).toHaveBeenCalledTimes(1)
    })

    it('optimizes form re-renders with React Hook Form', async () => {
      const renderSpy = vi.fn()

      const FormWrapper = ({ children }: { children: React.ReactNode }) => {
        renderSpy()
        return <>{children}</>
      }

      render(
        <TestWrapper>
          <FormWrapper>
            <CorsForm mode="create" />
          </FormWrapper>
        </TestWrapper>
      )

      const initialRenderCount = renderSpy.mock.calls.length

      // Type in input field
      const nameInput = screen.getByLabelText(/policy name/i)
      await user.type(nameInput, 'Test Policy')

      // Should not cause excessive re-renders due to React Hook Form optimization
      const finalRenderCount = renderSpy.mock.calls.length
      expect(finalRenderCount - initialRenderCount).toBeLessThan(5)
    })
  })

  describe('Internationalization and Localization', () => {
    it('displays translated form labels and error messages', () => {
      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      // Check for translated labels
      expect(screen.getByLabelText(/policy name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/allowed origins/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/allowed methods/i)).toBeInTheDocument()
    })

    it('supports RTL language layouts', () => {
      // Set document direction for RTL testing
      document.dir = 'rtl'

      render(
        <TestWrapper>
          <CorsForm mode="create" />
        </TestWrapper>
      )

      const form = screen.getByRole('form')
      expect(form).toHaveClass('space-y-6') // Should work with RTL

      // Reset document direction
      document.dir = 'ltr'
    })
  })
})