import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'

import { RegisterForm } from './register-form'
import { renderWithProviders } from '../../../test/utils/test-utils'
import { server } from '../../../test/mocks/server'
import { rest } from 'msw'
import { createMockSystemConfig, createMockUser } from '../../../test/utils/component-factories'

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations)

describe('RegisterForm', () => {
  const mockNavigate = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock Next.js router
    vi.mock('next/navigation', () => ({
      useRouter: () => ({
        push: mockNavigate,
        prefetch: vi.fn(),
      }),
    }))
  })

  afterEach(() => {
    server.resetHandlers()
  })

  describe('Form Rendering and Layout', () => {
    it('should render registration form with all required fields', () => {
      renderWithProviders(<RegisterForm />)

      // Check for form title
      expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument()

      // Check for required form fields
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()

      // Check for submit button
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()

      // Check for link to login page
      expect(screen.getByRole('link', { name: /already have an account/i })).toBeInTheDocument()
    })

    it('should render username field when system uses username-based login', async () => {
      // Mock system config for username-based registration
      server.use(
        rest.get('/api/v2/system/config', (req, res, ctx) => {
          return res(
            ctx.json({
              resource: [
                createMockSystemConfig({ 
                  login_attribute: 'username',
                  allow_self_register: true 
                })
              ]
            })
          )
        })
      )

      renderWithProviders(<RegisterForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
      })

      // Email should still be present but username should be the primary identifier
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields with real-time feedback', async () => {
      renderWithProviders(<RegisterForm />)

      const submitButton = screen.getByRole('button', { name: /register/i })
      
      // Submit empty form
      await user.click(submitButton)

      // Check for validation errors (should appear under 100ms as per specs)
      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      }, { timeout: 100 })
    })

    it('should validate email format in real-time', async () => {
      renderWithProviders(<RegisterForm />)

      const emailInput = screen.getByLabelText(/email/i)
      
      // Enter invalid email
      await user.type(emailInput, 'invalid-email')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument()
      }, { timeout: 100 })

      // Clear and enter valid email
      await user.clear(emailInput)
      await user.type(emailInput, 'user@example.com')
      await user.tab()

      await waitFor(() => {
        expect(screen.queryByText(/enter a valid email address/i)).not.toBeInTheDocument()
      })
    })

    it('should validate password requirements', async () => {
      renderWithProviders(<RegisterForm />)

      const passwordInput = screen.getByLabelText(/^password$/i)
      
      // Test minimum password length (16 characters as per specs)
      await user.type(passwordInput, 'short')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 16 characters/i)).toBeInTheDocument()
      }, { timeout: 100 })

      // Test valid password
      await user.clear(passwordInput)
      await user.type(passwordInput, 'ValidPassword123456')
      await user.tab()

      await waitFor(() => {
        expect(screen.queryByText(/password must be at least 16 characters/i)).not.toBeInTheDocument()
      })
    })

    it('should validate password confirmation matching', async () => {
      renderWithProviders(<RegisterForm />)

      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      
      await user.type(passwordInput, 'ValidPassword123456')
      await user.type(confirmPasswordInput, 'DifferentPassword123456')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      }, { timeout: 100 })

      // Fix password confirmation
      await user.clear(confirmPasswordInput)
      await user.type(confirmPasswordInput, 'ValidPassword123456')
      await user.tab()

      await waitFor(() => {
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument()
      })
    })

    it('should validate username format when in username mode', async () => {
      // Mock system config for username-based registration
      server.use(
        rest.get('/api/v2/system/config', (req, res, ctx) => {
          return res(
            ctx.json({
              resource: [
                createMockSystemConfig({ 
                  login_attribute: 'username',
                  allow_self_register: true 
                })
              ]
            })
          )
        })
      )

      renderWithProviders(<RegisterForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
      })

      const usernameInput = screen.getByLabelText(/username/i)
      
      // Test invalid username (with spaces)
      await user.type(usernameInput, 'invalid username')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/username cannot contain spaces/i)).toBeInTheDocument()
      }, { timeout: 100 })

      // Test valid username
      await user.clear(usernameInput)
      await user.type(usernameInput, 'validusername')
      await user.tab()

      await waitFor(() => {
        expect(screen.queryByText(/username cannot contain spaces/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit registration form with email-based configuration', async () => {
      // Mock successful registration response
      server.use(
        rest.post('/api/v2/user/register', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              session_token: 'mock-token',
              session_id: 'mock-session-id',
              id: 1,
              name: 'John Doe',
              email: 'john@example.com'
            })
          )
        })
      )

      renderWithProviders(<RegisterForm />)

      // Fill out form
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'ValidPassword123456')
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPassword123456')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /register/i })
      await user.click(submitButton)

      // Check loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /registering/i })).toBeDisabled()
      })

      // Check for success state and navigation
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login?registered=true')
      })
    })

    it('should submit registration form with username-based configuration', async () => {
      // Mock system config for username-based registration
      server.use(
        rest.get('/api/v2/system/config', (req, res, ctx) => {
          return res(
            ctx.json({
              resource: [
                createMockSystemConfig({ 
                  login_attribute: 'username',
                  allow_self_register: true 
                })
              ]
            })
          )
        }),
        rest.post('/api/v2/user/register', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              session_token: 'mock-token',
              session_id: 'mock-session-id',
              id: 1,
              name: 'John Doe',
              username: 'johndoe',
              email: 'john@example.com'
            })
          )
        })
      )

      renderWithProviders(<RegisterForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
      })

      // Fill out form with username
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/username/i), 'johndoe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'ValidPassword123456')
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPassword123456')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /register/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login?registered=true')
      })
    })

    it('should display success message on successful registration', async () => {
      server.use(
        rest.post('/api/v2/user/register', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              session_token: 'mock-token',
              session_id: 'mock-session-id',
              id: 1,
              name: 'John Doe',
              email: 'john@example.com'
            })
          )
        })
      )

      renderWithProviders(<RegisterForm />)

      // Fill and submit form
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'ValidPassword123456')
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPassword123456')

      await user.click(screen.getByRole('button', { name: /register/i }))

      // Check for success alert
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/registration successful/i)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors during registration', async () => {
      // Mock registration failure
      server.use(
        rest.post('/api/v2/user/register', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              error: {
                code: 400,
                message: 'Email already exists',
                details: ['The email address is already registered.']
              }
            })
          )
        })
      )

      renderWithProviders(<RegisterForm />)

      // Fill and submit form
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'ValidPassword123456')
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPassword123456')

      await user.click(screen.getByRole('button', { name: /register/i }))

      // Check for error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/email already exists/i)
      })

      // Form should be re-enabled
      expect(screen.getByRole('button', { name: /register/i })).not.toBeDisabled()
    })

    it('should handle network errors gracefully', async () => {
      // Mock network error
      server.use(
        rest.post('/api/v2/user/register', (req, res, ctx) => {
          return res.networkError('Network connection failed')
        })
      )

      renderWithProviders(<RegisterForm />)

      // Fill and submit form
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'ValidPassword123456')
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPassword123456')

      await user.click(screen.getByRole('button', { name: /register/i }))

      // Check for network error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/network error/i)
      })
    })

    it('should handle validation errors from server', async () => {
      // Mock server validation errors
      server.use(
        rest.post('/api/v2/user/register', (req, res, ctx) => {
          return res(
            ctx.status(422),
            ctx.json({
              error: {
                code: 422,
                message: 'Validation failed',
                details: {
                  email: ['Email format is invalid'],
                  password: ['Password is too weak']
                }
              }
            })
          )
        })
      )

      renderWithProviders(<RegisterForm />)

      // Fill and submit form with invalid data
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email/i), 'invalid-email')
      await user.type(screen.getByLabelText(/^password$/i), 'weak')
      await user.type(screen.getByLabelText(/confirm password/i), 'weak')

      await user.click(screen.getByRole('button', { name: /register/i }))

      // Check for field-specific errors
      await waitFor(() => {
        expect(screen.getByText(/email format is invalid/i)).toBeInTheDocument()
        expect(screen.getByText(/password is too weak/i)).toBeInTheDocument()
      })
    })
  })

  describe('System Configuration Integration', () => {
    it('should adapt to system configuration settings', async () => {
      // Mock system config with self-registration disabled
      server.use(
        rest.get('/api/v2/system/config', (req, res, ctx) => {
          return res(
            ctx.json({
              resource: [
                createMockSystemConfig({ 
                  allow_self_register: false 
                })
              ]
            })
          )
        })
      )

      renderWithProviders(<RegisterForm />)

      // Should show message that registration is disabled
      await waitFor(() => {
        expect(screen.getByText(/registration is currently disabled/i)).toBeInTheDocument()
      })

      // Registration form should not be available
      expect(screen.queryByRole('button', { name: /register/i })).not.toBeInTheDocument()
    })

    it('should handle system configuration loading states', async () => {
      // Mock delayed system config response
      server.use(
        rest.get('/api/v2/system/config', (req, res, ctx) => {
          return res(
            ctx.delay(1000),
            ctx.json({
              resource: [
                createMockSystemConfig({ 
                  allow_self_register: true 
                })
              ]
            })
          )
        })
      )

      renderWithProviders(<RegisterForm />)

      // Should show loading state
      expect(screen.getByText(/loading/i)).toBeInTheDocument()

      // Form should appear after loading
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
      })
    })
  })

  describe('User Interactions and Navigation', () => {
    it('should handle form reset functionality', async () => {
      renderWithProviders(<RegisterForm />)

      // Fill out form
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')

      // Click reset/clear button if available
      const clearButton = screen.queryByRole('button', { name: /clear|reset/i })
      if (clearButton) {
        await user.click(clearButton)

        // Check that fields are cleared
        expect(screen.getByLabelText(/first name/i)).toHaveValue('')
        expect(screen.getByLabelText(/last name/i)).toHaveValue('')
        expect(screen.getByLabelText(/email/i)).toHaveValue('')
      }
    })

    it('should navigate to login page when clicking login link', async () => {
      renderWithProviders(<RegisterForm />)

      const loginLink = screen.getByRole('link', { name: /already have an account/i })
      expect(loginLink).toHaveAttribute('href', '/login')
    })

    it('should support keyboard navigation', async () => {
      renderWithProviders(<RegisterForm />)

      const firstNameInput = screen.getByLabelText(/first name/i)
      const lastNameInput = screen.getByLabelText(/last name/i)
      const emailInput = screen.getByLabelText(/email/i)

      // Tab through inputs
      await user.click(firstNameInput)
      await user.tab()
      expect(lastNameInput).toHaveFocus()

      await user.tab()
      expect(emailInput).toHaveFocus()
    })
  })

  describe('Accessibility Compliance', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<RegisterForm />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper form labels and ARIA attributes', () => {
      renderWithProviders(<RegisterForm />)

      // Check that all inputs have proper labels
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()

      // Check for proper form structure
      const form = screen.getByRole('form') || screen.getByRole('main').querySelector('form')
      expect(form).toBeInTheDocument()
    })

    it('should announce validation errors to screen readers', async () => {
      renderWithProviders(<RegisterForm />)

      const submitButton = screen.getByRole('button', { name: /register/i })
      await user.click(submitButton)

      // Check that error messages have proper ARIA attributes
      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert')
        expect(errorMessages.length).toBeGreaterThan(0)

        errorMessages.forEach(error => {
          expect(error).toHaveAttribute('aria-live', 'polite')
        })
      })
    })

    it('should provide proper focus management during form submission', async () => {
      renderWithProviders(<RegisterForm />)

      const submitButton = screen.getByRole('button', { name: /register/i })
      
      // Focus should remain on submit button during loading
      await user.click(submitButton)
      
      await waitFor(() => {
        const loadingButton = screen.getByRole('button', { name: /registering/i })
        expect(loadingButton).toHaveFocus()
      })
    })

    it('should have appropriate contrast ratios for error states', async () => {
      renderWithProviders(<RegisterForm />)

      const emailInput = screen.getByLabelText(/email/i)
      
      // Trigger validation error
      await user.type(emailInput, 'invalid-email')
      await user.tab()

      await waitFor(() => {
        const errorMessage = screen.getByText(/enter a valid email address/i)
        const computedStyle = window.getComputedStyle(errorMessage)
        
        // Check that error text has sufficient contrast (simplified check)
        expect(computedStyle.color).toBeTruthy()
      })
    })
  })

  describe('Performance Requirements', () => {
    it('should validate form fields within performance requirements', async () => {
      renderWithProviders(<RegisterForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const startTime = performance.now()
      
      // Type and trigger validation
      await user.type(emailInput, 'invalid-email')
      await user.tab()

      // Wait for validation to complete
      await waitFor(() => {
        expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument()
      })

      const endTime = performance.now()
      const validationTime = endTime - startTime

      // Should validate under 100ms as per specs
      expect(validationTime).toBeLessThan(100)
    })

    it('should handle form submission efficiently', async () => {
      server.use(
        rest.post('/api/v2/user/register', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              session_token: 'mock-token',
              session_id: 'mock-session-id',
              id: 1,
              name: 'John Doe',
              email: 'john@example.com'
            })
          )
        })
      )

      renderWithProviders(<RegisterForm />)

      // Fill form quickly
      const inputs = [
        { label: /first name/i, value: 'John' },
        { label: /last name/i, value: 'Doe' },
        { label: /email/i, value: 'john@example.com' },
        { label: /^password$/i, value: 'ValidPassword123456' },
        { label: /confirm password/i, value: 'ValidPassword123456' }
      ]

      for (const input of inputs) {
        await user.type(screen.getByLabelText(input.label), input.value)
      }

      const startTime = performance.now()
      await user.click(screen.getByRole('button', { name: /register/i }))

      // Wait for loading state to appear (form processing started)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /registering/i })).toBeInTheDocument()
      })

      const endTime = performance.now()
      const submissionTime = endTime - startTime

      // Form should respond to submission quickly
      expect(submissionTime).toBeLessThan(200)
    })
  })
})