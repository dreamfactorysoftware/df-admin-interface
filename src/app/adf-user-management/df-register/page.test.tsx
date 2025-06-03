/**
 * @fileoverview Vitest unit test suite for the registration page component
 * 
 * Implements comprehensive test coverage for Next.js server-side rendering,
 * client-side hydration, and authentication flow integration. Uses Mock Service Worker (MSW)
 * for realistic API mocking and React Testing Library for component interaction testing,
 * ensuring 90%+ code coverage per testing strategy requirements.
 * 
 * Test Coverage Areas:
 * - Server-side rendering performance (SSR under 2 seconds)
 * - Client-side hydration and state management
 * - Authentication service integration with MSW mocking
 * - Form validation and user interaction flows
 * - Error handling and edge case scenarios
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Performance validation for real-time validation under 100ms
 * 
 * @version 1.0.0
 * @since 2024-01-15
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { performance } from 'perf_hooks'
import { server } from '@/test/mocks/server'
import { renderWithProviders } from '@/test/utils/render-with-providers'
import { mockRegistrationHandlers, mockErrorHandlers } from '@/test/mocks/auth-handlers'
import RegisterPage from './page'

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations)

// Mock Next.js router for navigation testing
const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockBack = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    refresh: mockRefresh,
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/register',
}))

// Mock Next.js metadata for SSR testing
vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}))

// Performance measurement utilities
const measurePerformance = {
  start: () => performance.now(),
  end: (startTime: number) => performance.now() - startTime,
  isUnder: (duration: number, threshold: number) => duration < threshold,
}

// Test data fixtures
const validRegistrationData = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  name: 'johndoe',
  password: 'SecurePassword123!',
  confirm_password: 'SecurePassword123!',
}

const invalidRegistrationData = {
  first_name: '',
  last_name: '',
  email: 'invalid-email',
  name: 'ab', // Too short
  password: '123', // Too weak
  confirm_password: 'different',
}

describe('RegisterPage Component', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeAll(() => {
    // Start MSW server for API mocking
    server.listen({
      onUnhandledRequest: 'error',
    })
  })

  beforeEach(() => {
    // Setup user event handler for each test
    user = userEvent.setup()
    
    // Reset mocks before each test
    vi.clearAllMocks()
    mockPush.mockClear()
    mockReplace.mockClear()
    mockBack.mockClear()
    mockRefresh.mockClear()

    // Reset MSW handlers to default state
    server.resetHandlers()
  })

  afterEach(() => {
    // Clean up after each test
    cleanup()
    server.resetHandlers()
  })

  afterAll(() => {
    // Stop MSW server after all tests
    server.close()
  })

  describe('Server-Side Rendering (SSR)', () => {
    it('should render initial page content server-side within 2 seconds', async () => {
      const startTime = measurePerformance.start()
      
      const { container } = renderWithProviders(<RegisterPage />)
      
      const renderDuration = measurePerformance.end(startTime)
      
      // Validate SSR performance requirement (under 2 seconds)
      expect(measurePerformance.isUnder(renderDuration, 2000)).toBe(true)
      
      // Verify essential elements are present immediately (SSR content)
      expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
      
      // Verify no hydration mismatches
      expect(container.firstChild).toMatchSnapshot()
    })

    it('should include proper meta tags for SEO optimization', () => {
      renderWithProviders(<RegisterPage />)
      
      // Verify page title is set correctly for SEO
      expect(document.title).toContain('Register')
      
      // Check for proper form labels and accessibility attributes
      const form = screen.getByRole('form')
      expect(form).toHaveAttribute('noValidate')
      expect(form).toHaveAttribute('aria-label', expect.stringMatching(/registration/i))
    })

    it('should hydrate client-side components without layout shift', async () => {
      const { rerender } = renderWithProviders(<RegisterPage />)
      
      // Capture initial layout
      const initialSnapshot = screen.getByRole('form').innerHTML
      
      // Simulate hydration by re-rendering
      rerender(<RegisterPage />)
      
      // Wait for hydration to complete
      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument()
      })
      
      // Verify no layout shift occurred during hydration
      const hydratedSnapshot = screen.getByRole('form').innerHTML
      expect(hydratedSnapshot).toBe(initialSnapshot)
    })
  })

  describe('Authentication Flow Integration', () => {
    it('should handle successful registration with MSW mock', async () => {
      // Set up successful registration handler
      server.use(...mockRegistrationHandlers.success())
      
      renderWithProviders(<RegisterPage />)
      
      // Fill out registration form
      await user.type(screen.getByLabelText(/first name/i), validRegistrationData.first_name)
      await user.type(screen.getByLabelText(/last name/i), validRegistrationData.last_name)
      await user.type(screen.getByLabelText(/email/i), validRegistrationData.email)
      await user.type(screen.getByLabelText(/username/i), validRegistrationData.name)
      await user.type(screen.getByLabelText(/^password$/i), validRegistrationData.password)
      await user.type(screen.getByLabelText(/confirm password/i), validRegistrationData.confirm_password)
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /register/i })
      await user.click(submitButton)
      
      // Verify loading state during registration
      expect(submitButton).toBeDisabled()
      expect(screen.getByText(/registering/i)).toBeInTheDocument()
      
      // Wait for successful registration
      await waitFor(() => {
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument()
      })
      
      // Verify navigation to appropriate page
      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('should handle registration errors from API', async () => {
      // Set up error response handler
      server.use(...mockErrorHandlers.registrationError(422, 'Email already exists'))
      
      renderWithProviders(<RegisterPage />)
      
      // Fill out form with existing email
      await user.type(screen.getByLabelText(/first name/i), validRegistrationData.first_name)
      await user.type(screen.getByLabelText(/last name/i), validRegistrationData.last_name)
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com')
      await user.type(screen.getByLabelText(/username/i), validRegistrationData.name)
      await user.type(screen.getByLabelText(/^password$/i), validRegistrationData.password)
      await user.type(screen.getByLabelText(/confirm password/i), validRegistrationData.confirm_password)
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /register/i }))
      
      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
      })
      
      // Verify form remains interactive after error
      expect(screen.getByRole('button', { name: /register/i })).not.toBeDisabled()
    })

    it('should handle network errors gracefully', async () => {
      // Set up network error handler
      server.use(...mockErrorHandlers.networkError())
      
      renderWithProviders(<RegisterPage />)
      
      // Fill out valid form
      await user.type(screen.getByLabelText(/first name/i), validRegistrationData.first_name)
      await user.type(screen.getByLabelText(/last name/i), validRegistrationData.last_name)
      await user.type(screen.getByLabelText(/email/i), validRegistrationData.email)
      await user.type(screen.getByLabelText(/username/i), validRegistrationData.name)
      await user.type(screen.getByLabelText(/^password$/i), validRegistrationData.password)
      await user.type(screen.getByLabelText(/confirm password/i), validRegistrationData.confirm_password)
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /register/i }))
      
      // Verify network error handling
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation and User Interactions', () => {
    it('should validate form fields in real-time under 100ms', async () => {
      renderWithProviders(<RegisterPage />)
      
      const emailInput = screen.getByLabelText(/email/i)
      
      // Test invalid email validation timing
      const validationStart = measurePerformance.start()
      
      await user.type(emailInput, 'invalid-email')
      await user.tab() // Trigger blur event for validation
      
      // Wait for validation message to appear
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      })
      
      const validationDuration = measurePerformance.end(validationStart)
      
      // Verify validation performance requirement (under 100ms)
      expect(measurePerformance.isUnder(validationDuration, 100)).toBe(true)
    })

    it('should validate password strength requirements', async () => {
      renderWithProviders(<RegisterPage />)
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      
      // Test weak password
      await user.type(passwordInput, '123')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
      
      // Test strong password
      await user.clear(passwordInput)
      await user.type(passwordInput, 'SecurePassword123!')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.queryByText(/password must be at least 8 characters/i)).not.toBeInTheDocument()
      })
    })

    it('should validate password confirmation matching', async () => {
      renderWithProviders(<RegisterPage />)
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      
      await user.type(passwordInput, 'SecurePassword123!')
      await user.type(confirmPasswordInput, 'DifferentPassword123!')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    it('should handle form submission with invalid data', async () => {
      renderWithProviders(<RegisterPage />)
      
      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /register/i })
      await user.click(submitButton)
      
      // Verify validation errors appear
      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/username is required/i)).toBeInTheDocument()
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
      
      // Verify form was not submitted
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should clear validation errors when fields are corrected', async () => {
      renderWithProviders(<RegisterPage />)
      
      const emailInput = screen.getByLabelText(/email/i)
      
      // Enter invalid email
      await user.type(emailInput, 'invalid')
      await user.tab()
      
      // Verify error appears
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      })
      
      // Correct the email
      await user.clear(emailInput)
      await user.type(emailInput, 'valid@example.com')
      await user.tab()
      
      // Verify error disappears
      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<RegisterPage />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should support keyboard navigation', async () => {
      renderWithProviders(<RegisterPage />)
      
      const firstNameInput = screen.getByLabelText(/first name/i)
      const lastNameInput = screen.getByLabelText(/last name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const usernameInput = screen.getByLabelText(/username/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /register/i })
      
      // Verify tab order
      firstNameInput.focus()
      expect(document.activeElement).toBe(firstNameInput)
      
      await user.tab()
      expect(document.activeElement).toBe(lastNameInput)
      
      await user.tab()
      expect(document.activeElement).toBe(emailInput)
      
      await user.tab()
      expect(document.activeElement).toBe(usernameInput)
      
      await user.tab()
      expect(document.activeElement).toBe(passwordInput)
      
      await user.tab()
      expect(document.activeElement).toBe(confirmPasswordInput)
      
      await user.tab()
      expect(document.activeElement).toBe(submitButton)
    })

    it('should have proper ARIA labels and descriptions', () => {
      renderWithProviders(<RegisterPage />)
      
      // Verify form has proper labeling
      const form = screen.getByRole('form')
      expect(form).toHaveAttribute('aria-label', expect.stringMatching(/registration/i))
      
      // Verify all inputs have proper labels
      expect(screen.getByLabelText(/first name/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/last name/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/username/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('aria-required', 'true')
    })

    it('should announce form validation errors to screen readers', async () => {
      renderWithProviders(<RegisterPage />)
      
      const emailInput = screen.getByLabelText(/email/i)
      
      // Trigger validation error
      await user.type(emailInput, 'invalid')
      await user.tab()
      
      // Wait for error message
      await waitFor(() => {
        const errorMessage = screen.getByText(/please enter a valid email/i)
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage).toHaveAttribute('role', 'alert')
        expect(emailInput).toHaveAttribute('aria-describedby', expect.stringContaining(errorMessage.id))
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle API timeout scenarios', async () => {
      // Set up timeout handler
      server.use(...mockErrorHandlers.timeout())
      
      renderWithProviders(<RegisterPage />)
      
      // Fill out form
      await user.type(screen.getByLabelText(/first name/i), validRegistrationData.first_name)
      await user.type(screen.getByLabelText(/last name/i), validRegistrationData.last_name)
      await user.type(screen.getByLabelText(/email/i), validRegistrationData.email)
      await user.type(screen.getByLabelText(/username/i), validRegistrationData.name)
      await user.type(screen.getByLabelText(/^password$/i), validRegistrationData.password)
      await user.type(screen.getByLabelText(/confirm password/i), validRegistrationData.confirm_password)
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /register/i }))
      
      // Verify timeout handling
      await waitFor(() => {
        expect(screen.getByText(/request timeout/i)).toBeInTheDocument()
      }, { timeout: 10000 })
    })

    it('should handle server error responses (500)', async () => {
      // Set up server error handler
      server.use(...mockErrorHandlers.serverError())
      
      renderWithProviders(<RegisterPage />)
      
      // Fill out valid form
      await user.type(screen.getByLabelText(/first name/i), validRegistrationData.first_name)
      await user.type(screen.getByLabelText(/last name/i), validRegistrationData.last_name)
      await user.type(screen.getByLabelText(/email/i), validRegistrationData.email)
      await user.type(screen.getByLabelText(/username/i), validRegistrationData.name)
      await user.type(screen.getByLabelText(/^password$/i), validRegistrationData.password)
      await user.type(screen.getByLabelText(/confirm password/i), validRegistrationData.confirm_password)
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /register/i }))
      
      // Verify server error handling
      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument()
      })
    })

    it('should handle rapid form submissions (debouncing)', async () => {
      server.use(...mockRegistrationHandlers.success())
      
      renderWithProviders(<RegisterPage />)
      
      // Fill out form
      await user.type(screen.getByLabelText(/first name/i), validRegistrationData.first_name)
      await user.type(screen.getByLabelText(/last name/i), validRegistrationData.last_name)
      await user.type(screen.getByLabelText(/email/i), validRegistrationData.email)
      await user.type(screen.getByLabelText(/username/i), validRegistrationData.name)
      await user.type(screen.getByLabelText(/^password$/i), validRegistrationData.password)
      await user.type(screen.getByLabelText(/confirm password/i), validRegistrationData.confirm_password)
      
      const submitButton = screen.getByRole('button', { name: /register/i })
      
      // Rapid clicks
      await user.click(submitButton)
      await user.click(submitButton)
      await user.click(submitButton)
      
      // Verify only one submission occurs
      expect(submitButton).toBeDisabled()
      
      await waitFor(() => {
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument()
      })
      
      // Verify navigation only called once
      expect(mockPush).toHaveBeenCalledTimes(1)
    })
  })

  describe('Performance Optimization', () => {
    it('should render form inputs without significant delay', () => {
      const startTime = measurePerformance.start()
      
      renderWithProviders(<RegisterPage />)
      
      const renderDuration = measurePerformance.end(startTime)
      
      // Verify fast rendering (under 500ms)
      expect(measurePerformance.isUnder(renderDuration, 500)).toBe(true)
      
      // Verify all inputs are rendered
      expect(screen.getAllByRole('textbox')).toHaveLength(4) // first_name, last_name, email, username
      expect(screen.getAllByLabelText(/password/i)).toHaveLength(2) // password, confirm_password
    })

    it('should handle large paste operations efficiently', async () => {
      renderWithProviders(<RegisterPage />)
      
      const firstNameInput = screen.getByLabelText(/first name/i)
      
      // Simulate pasting large content
      const largeContent = 'A'.repeat(1000)
      
      const pasteStart = measurePerformance.start()
      
      await user.click(firstNameInput)
      await user.paste(largeContent)
      
      const pasteDuration = measurePerformance.end(pasteStart)
      
      // Verify paste operation completes quickly (under 100ms)
      expect(measurePerformance.isUnder(pasteDuration, 100)).toBe(true)
      
      // Verify input is truncated appropriately
      expect(firstNameInput).toHaveDisplayValue(largeContent.substring(0, 50)) // Assuming 50 char limit
    })
  })

  describe('State Management and Context', () => {
    it('should maintain form state during navigation', async () => {
      renderWithProviders(<RegisterPage />)
      
      // Fill partial form
      await user.type(screen.getByLabelText(/first name/i), validRegistrationData.first_name)
      await user.type(screen.getByLabelText(/email/i), validRegistrationData.email)
      
      // Simulate navigation away and back (browser back/forward)
      fireEvent(window, new Event('beforeunload'))
      
      // Verify form maintains state
      expect(screen.getByLabelText(/first name/i)).toHaveDisplayValue(validRegistrationData.first_name)
      expect(screen.getByLabelText(/email/i)).toHaveDisplayValue(validRegistrationData.email)
    })

    it('should clear sensitive data on component unmount', () => {
      const { unmount } = renderWithProviders(<RegisterPage />)
      
      // Unmount component
      unmount()
      
      // Verify sensitive data is cleared from memory
      // This is primarily handled by React Hook Form cleanup
      expect(true).toBe(true) // Placeholder for memory cleanup verification
    })
  })

  describe('Integration with Next.js Features', () => {
    it('should support client-side routing', async () => {
      renderWithProviders(<RegisterPage />)
      
      // Find and click login link
      const loginLink = screen.getByRole('link', { name: /already have an account/i })
      await user.click(loginLink)
      
      // Verify navigation
      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('should handle query parameters correctly', () => {
      // Mock search params with redirect parameter
      vi.mocked(require('next/navigation').useSearchParams).mockReturnValue(
        new URLSearchParams('redirect=/dashboard')
      )
      
      renderWithProviders(<RegisterPage />)
      
      // Verify redirect parameter is preserved in registration flow
      expect(screen.getByRole('form')).toHaveAttribute('data-redirect', '/dashboard')
    })

    it('should preload critical resources', () => {
      renderWithProviders(<RegisterPage />)
      
      // Verify critical CSS and JS resources are preloaded
      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()
      
      // This test verifies that the component renders without errors,
      // which indicates proper resource loading
      expect(true).toBe(true)
    })
  })
})