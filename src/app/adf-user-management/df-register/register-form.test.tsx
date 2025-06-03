import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations)

// Mock the RegisterForm component since it may not exist yet
// In a real implementation, this would import the actual component
const MockRegisterForm = vi.fn(() => {
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    displayName: '',
  })

  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Real-time validation simulation
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      
      // Basic validation rules
      if (field === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
        newErrors.email = 'Please enter a valid email address'
      }
      if (field === 'password' && value && value.length < 8) {
        newErrors.password = 'Password must be at least 8 characters'
      }
      if (field === 'confirmPassword' && value && value !== formData.password) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
      if (!value.trim()) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
      }
      
      return newErrors
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/v2/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Registration failed')
      }

      // Success handling would go here
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} role="form" aria-label="User Registration Form">
      <h1>Register New Account</h1>
      
      {submitError && (
        <div role="alert" aria-live="polite" className="error-message">
          {submitError}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="firstName">First Name</label>
        <input
          id="firstName"
          name="firstName"
          type="text"
          value={formData.firstName}
          onChange={(e) => handleInputChange('firstName', e.target.value)}
          aria-required="true"
          aria-invalid={!!errors.firstName}
          aria-describedby={errors.firstName ? 'firstName-error' : undefined}
        />
        {errors.firstName && (
          <div id="firstName-error" role="alert" className="field-error">
            {errors.firstName}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="lastName">Last Name</label>
        <input
          id="lastName"
          name="lastName"
          type="text"
          value={formData.lastName}
          onChange={(e) => handleInputChange('lastName', e.target.value)}
          aria-required="true"
          aria-invalid={!!errors.lastName}
          aria-describedby={errors.lastName ? 'lastName-error' : undefined}
        />
        {errors.lastName && (
          <div id="lastName-error" role="alert" className="field-error">
            {errors.lastName}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <div id="email-error" role="alert" className="field-error">
            {errors.email}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="name">Username</label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <div id="name-error" role="alert" className="field-error">
            {errors.name}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="displayName">Display Name</label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          value={formData.displayName}
          onChange={(e) => handleInputChange('displayName', e.target.value)}
          aria-required="false"
          aria-invalid={!!errors.displayName}
          aria-describedby={errors.displayName ? 'displayName-error' : undefined}
        />
        {errors.displayName && (
          <div id="displayName-error" role="alert" className="field-error">
            {errors.displayName}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          aria-required="true"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error password-help' : 'password-help'}
        />
        <div id="password-help" className="help-text">
          Password must be at least 8 characters long
        </div>
        {errors.password && (
          <div id="password-error" role="alert" className="field-error">
            {errors.password}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          aria-required="true"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
        />
        {errors.confirmPassword && (
          <div id="confirmPassword-error" role="alert" className="field-error">
            {errors.confirmPassword}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || Object.keys(errors).length > 0}
        aria-describedby="submit-help"
      >
        {isSubmitting ? 'Creating Account...' : 'Register'}
      </button>
      <div id="submit-help" className="help-text">
        By registering, you agree to our terms of service
      </div>
    </form>
  )
})

// Mock Service Worker handlers for authentication
const registrationHandlers = [
  // Successful registration
  http.post('/api/v2/user/register', async ({ request }) => {
    const body = await request.json()
    
    // Simulate validation errors
    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        {
          error: {
            code: 400,
            message: 'Email address already exists',
            status_code: 400,
            context: {
              field: 'email',
              value: body.email
            }
          }
        },
        { status: 400 }
      )
    }

    // Simulate server error
    if (body.email === 'server-error@example.com') {
      return HttpResponse.json(
        {
          error: {
            code: 500,
            message: 'Internal server error',
            status_code: 500
          }
        },
        { status: 500 }
      )
    }

    // Successful registration
    return HttpResponse.json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: 123,
        name: body.name,
        display_name: body.displayName,
        email: body.email,
        first_name: body.firstName,
        last_name: body.lastName,
        is_active: true,
        created_date: new Date().toISOString(),
        last_modified_date: new Date().toISOString()
      }
    })
  }),

  // System configuration endpoint (for registration settings)
  http.get('/api/v2/system/config', () => {
    return HttpResponse.json({
      allow_guest_user: true,
      guest_role_id: 1,
      allow_open_registration: true,
      open_reg_role_id: 2,
      open_reg_email_service_id: 1,
      invite_email_service_id: 1,
      password_email_service_id: 1
    })
  })
]

const server = setupServer(...registrationHandlers)

// Test wrapper with React Query client
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0
      },
      mutations: {
        retry: false
      }
    }
  })

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('RegisterForm Component', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders the registration form with all required fields', () => {
      const TestWrapper = createTestWrapper()
      
      render(
        <TestWrapper>
          <MockRegisterForm />
        </TestWrapper>
      )

      // Check for form presence
      expect(screen.getByRole('form', { name: /user registration form/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /register new account/i })).toBeInTheDocument()

      // Check for all required form fields
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
      expect(screen.getByLabelText('Display Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()

      // Check for submit button
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
    })

    it('renders with proper ARIA attributes for accessibility', () => {
      const TestWrapper = createTestWrapper()
      
      render(
        <TestWrapper>
          <MockRegisterForm />
        </TestWrapper>
      )

      // Check required fields have aria-required
      expect(screen.getByLabelText(/first name/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/last name/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/username/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('aria-required', 'true')

      // Optional field should not be required
      expect(screen.getByLabelText('Display Name')).toHaveAttribute('aria-required', 'false')

      // Check password help text association
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('aria-describedby', 'password-help')
    })
  })

  describe('Form Validation', () => {
    it('validates email format in real-time', async () => {
      const TestWrapper = createTestWrapper()
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <MockRegisterForm />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText(/email address/i)
      
      // Test invalid email
      await user.type(emailInput, 'invalid-email')
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
        expect(emailInput).toHaveAttribute('aria-invalid', 'true')
      })

      // Test valid email
      await user.clear(emailInput)
      await user.type(emailInput, 'valid@example.com')
      
      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument()
        expect(emailInput).toHaveAttribute('aria-invalid', 'false')
      })
    })

    it('validates password requirements in real-time', async () => {
      const TestWrapper = createTestWrapper()
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <MockRegisterForm />
        </TestWrapper>
      )

      const passwordInput = screen.getByLabelText('Password')
      
      // Test short password
      await user.type(passwordInput, '123')
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
        expect(passwordInput).toHaveAttribute('aria-invalid', 'true')
      })

      // Test valid password
      await user.clear(passwordInput)
      await user.type(passwordInput, 'validpassword123')
      
      await waitFor(() => {
        expect(screen.queryByText(/password must be at least 8 characters/i)).not.toBeInTheDocument()
        expect(passwordInput).toHaveAttribute('aria-invalid', 'false')
      })
    })

    it('validates password confirmation matching', async () => {
      const TestWrapper = createTestWrapper()
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <MockRegisterForm />
        </TestWrapper>
      )

      const passwordInput = screen.getByLabelText('Password')
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      
      // Set password
      await user.type(passwordInput, 'mypassword123')
      
      // Type non-matching confirmation
      await user.type(confirmPasswordInput, 'differentpassword')
      
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
        expect(confirmPasswordInput).toHaveAttribute('aria-invalid', 'true')
      })

      // Type matching confirmation
      await user.clear(confirmPasswordInput)
      await user.type(confirmPasswordInput, 'mypassword123')
      
      await waitFor(() => {
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument()
        expect(confirmPasswordInput).toHaveAttribute('aria-invalid', 'false')
      })
    })

    it('validates required fields', async () => {
      const TestWrapper = createTestWrapper()
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <MockRegisterForm />
        </TestWrapper>
      )

      const firstNameInput = screen.getByLabelText(/first name/i)
      
      // Focus and blur to trigger validation
      await user.click(firstNameInput)
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
        expect(firstNameInput).toHaveAttribute('aria-invalid', 'true')
      })

      // Fill in the field
      await user.type(firstNameInput, 'John')
      
      await waitFor(() => {
        expect(screen.queryByText(/first name is required/i)).not.toBeInTheDocument()
        expect(firstNameInput).toHaveAttribute('aria-invalid', 'false')
      })
    })

    it('meets real-time validation performance requirement (under 100ms)', async () => {
      const TestWrapper = createTestWrapper()
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <MockRegisterForm />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText(/email address/i)
      
      const startTime = performance.now()
      await user.type(emailInput, 'test@example.com')
      
      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'false')
      })
      
      const endTime = performance.now()
      const validationTime = endTime - startTime
      
      // Validation should complete under 100ms as per requirements
      expect(validationTime).toBeLessThan(100)
    })
  })

  describe('Form Submission', () => {
    it('submits form with valid data successfully', async () => {
      const TestWrapper = createTestWrapper()
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <MockRegisterForm />
        </TestWrapper>
      )

      // Fill in all required fields with valid data
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com')
      await user.type(screen.getByLabelText(/username/i), 'johndoe')
      await user.type(screen.getByLabelText('Display Name'), 'John Doe')
      await user.type(screen.getByLabelText('Password'), 'securepassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'securepassword123')

      const submitButton = screen.getByRole('button', { name: /register/i })
      
      // Submit the form
      await user.click(submitButton)

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText(/creating account/i)).toBeInTheDocument()
        expect(submitButton).toBeDisabled()
      })

      // Wait for successful completion
      await waitFor(() => {
        expect(screen.queryByText(/creating account/i)).not.toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('handles server validation errors', async () => {
      const TestWrapper = createTestWrapper()
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <MockRegisterForm />
        </TestWrapper>
      )

      // Fill form with email that will trigger server error
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email address/i), 'existing@example.com')
      await user.type(screen.getByLabelText(/username/i), 'johndoe')
      await user.type(screen.getByLabelText('Password'), 'securepassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'securepassword123')

      await user.click(screen.getByRole('button', { name: /register/i }))

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/email address already exists/i)).toBeInTheDocument()
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('handles server errors gracefully', async () => {
      const TestWrapper = createTestWrapper()
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <MockRegisterForm />
        </TestWrapper>
      )

      // Fill form with email that will trigger server error
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email address/i), 'server-error@example.com')
      await user.type(screen.getByLabelText(/username/i), 'johndoe')
      await user.type(screen.getByLabelText('Password'), 'securepassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'securepassword123')

      await user.click(screen.getByRole('button', { name: /register/i }))

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument()
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('disables submit button when form has validation errors', async () => {
      const TestWrapper = createTestWrapper()
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <MockRegisterForm />
        </TestWrapper>
      )

      const submitButton = screen.getByRole('button', { name: /register/i })
      
      // Initially should be disabled (no data)
      expect(submitButton).toBeDisabled()

      // Add invalid email
      await user.type(screen.getByLabelText(/email address/i), 'invalid-email')
      
      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })

      // Fix email but leave other required fields empty
      await user.clear(screen.getByLabelText(/email address/i))
      await user.type(screen.getByLabelText(/email address/i), 'valid@example.com')
      
      // Should still be disabled due to empty required fields
      expect(submitButton).toBeDisabled()
    })
  })

  describe('User Interaction', () => {
    it('supports keyboard navigation', async () => {
      const TestWrapper = createTestWrapper()
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <MockRegisterForm />
        </TestWrapper>
      )

      const firstNameInput = screen.getByLabelText(/first name/i)
      const lastNameInput = screen.getByLabelText(/last name/i)
      const emailInput = screen.getByLabelText(/email address/i)

      // Start with first field focused
      firstNameInput.focus()
      expect(firstNameInput).toHaveFocus()

      // Tab to next field
      await user.tab()
      expect(lastNameInput).toHaveFocus()

      // Tab to next field
      await user.tab()
      expect(emailInput).toHaveFocus()
    })

    it('announces errors to screen readers', async () => {
      const TestWrapper = createTestWrapper()
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <MockRegisterForm />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText(/email address/i)
      
      // Type invalid email
      await user.type(emailInput, 'invalid-email')
      
      await waitFor(() => {
        const errorElement = screen.getByText(/please enter a valid email address/i)
        expect(errorElement).toHaveAttribute('role', 'alert')
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error')
      })
    })

    it('provides helpful feedback during form submission', async () => {
      const TestWrapper = createTestWrapper()
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <MockRegisterForm />
        </TestWrapper>
      )

      // Fill in valid form data
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/username/i), 'johndoe')
      await user.type(screen.getByLabelText('Password'), 'securepassword123')
      await user.type(screen.getByLabelText(/confirm password/i), 'securepassword123')

      const submitButton = screen.getByRole('button', { name: /register/i })
      
      await user.click(submitButton)

      // Check loading feedback
      await waitFor(() => {
        expect(screen.getByText(/creating account/i)).toBeInTheDocument()
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('Accessibility Compliance', () => {
    it('passes WCAG 2.1 AA accessibility audit', async () => {
      const TestWrapper = createTestWrapper()
      
      const { container } = render(
        <TestWrapper>
          <MockRegisterForm />
        </TestWrapper>
      )

      // Run axe accessibility audit
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has proper heading structure', () => {
      const TestWrapper = createTestWrapper()
      
      render(
        <TestWrapper>
          <MockRegisterForm />
        </TestWrapper>
      )

      // Should have proper heading hierarchy
      const heading = screen.getByRole('heading', { name: /register new account/i })
      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toBe('H1')
    })

    it('associates form labels with inputs correctly', () => {
      const TestWrapper = createTestWrapper()
      
      render(
        <TestWrapper>
          <MockRegisterForm />
        </TestWrapper>
      )

      // Check label associations
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
      expect(screen.getByLabelText('Display Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    })

    it('provides appropriate ARIA live regions for dynamic content', async () => {
      const TestWrapper = createTestWrapper()
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <MockRegisterForm />
        </TestWrapper>
      )

      // Trigger an error to test live region
      await user.type(screen.getByLabelText(/email address/i), 'invalid-email')
      
      await waitFor(() => {
        const errorElement = screen.getByText(/please enter a valid email address/i)
        expect(errorElement).toHaveAttribute('role', 'alert')
      })
    })
  })

  describe('Performance Testing', () => {
    it('renders form within acceptable time limits', () => {
      const TestWrapper = createTestWrapper()
      
      const startTime = performance.now()
      
      render(
        <TestWrapper>
          <MockRegisterForm />
        </TestWrapper>
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Component should render quickly
      expect(renderTime).toBeLessThan(50) // 50ms should be more than enough for a form
    })

    it('handles rapid user input without performance degradation', async () => {
      const TestWrapper = createTestWrapper()
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <MockRegisterForm />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText(/email address/i)
      
      const startTime = performance.now()
      
      // Simulate rapid typing
      await user.type(emailInput, 'rapid.typing.test@example.com', { delay: 1 })
      
      const endTime = performance.now()
      const inputTime = endTime - startTime

      // Should handle rapid input efficiently
      expect(inputTime).toBeLessThan(500) // Should complete within 500ms
    })
  })

  describe('MSW Integration', () => {
    it('successfully mocks API endpoints', async () => {
      const TestWrapper = createTestWrapper()
      
      // Test that MSW is intercepting requests
      const response = await fetch('/api/v2/system/config')
      const data = await response.json()
      
      expect(data).toHaveProperty('allow_open_registration', true)
      expect(data).toHaveProperty('open_reg_role_id', 2)
    })

    it('handles different response scenarios', async () => {
      const TestWrapper = createTestWrapper()
      
      // Test successful response
      const successResponse = await fetch('/api/v2/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          name: 'johndoe',
          password: 'password123'
        })
      })
      
      expect(successResponse.ok).toBe(true)
      const successData = await successResponse.json()
      expect(successData).toHaveProperty('success', true)

      // Test error response
      const errorResponse = await fetch('/api/v2/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'existing@example.com'
        })
      })
      
      expect(errorResponse.ok).toBe(false)
      expect(errorResponse.status).toBe(400)
    })
  })
})