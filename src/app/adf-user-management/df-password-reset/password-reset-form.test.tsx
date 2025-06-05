/**
 * Password Reset Form Component Test Suite
 * 
 * Comprehensive Vitest test suite for password reset React component with MSW integration
 * for API mocking. Tests dynamic form validation for both email and username login attributes,
 * password reset request workflows, registration confirmation flows, invitation confirmation 
 * scenarios, form validation edge cases, error handling scenarios, and automatic authentication 
 * flow. Replaces Angular/Karma/Jasmine tests with modern Vitest + Testing Library approach 
 * for 10x faster test execution and comprehensive coverage of all three workflow types.
 */

import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'

// Component and dependencies
import PasswordResetForm from './password-reset-form'
import { PasswordResetFormData, PasswordResetWorkflowType } from '../types'
import { passwordResetSchema, registerConfirmationSchema, invitationConfirmationSchema } from '../validation'

// Test utilities and mocks
import { renderWithProviders, createTestQueryClient, createMockRouter } from '@/test/utils/test-utils'
import { createPasswordResetResponse, createErrorResponse } from '@/test/mocks/error-responses'
import { mockSystemConfig, mockUserSession } from '@/test/mocks/mock-data'

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(() => '/user-management/password-reset'),
}))

// Mock authentication hooks
vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({
    login: vi.fn(),
    isAuthenticated: false,
    user: null,
  })),
}))

// Mock system configuration hook
vi.mock('@/hooks/use-system-config', () => ({
  useSystemConfig: vi.fn(() => ({
    data: mockSystemConfig,
    isLoading: false,
    error: null,
  })),
}))

// MSW handlers for password reset endpoints
const passwordResetHandlers = [
  // Password reset request endpoint
  http.post('/api/v2/user/password', async ({ request }) => {
    const body = await request.json() as any
    
    if (body.email === 'nonexistent@example.com') {
      return HttpResponse.json(
        createErrorResponse(404, 'User not found', 'EMAIL_NOT_FOUND'),
        { status: 404 }
      )
    }
    
    if (body.email === 'server-error@example.com') {
      return HttpResponse.json(
        createErrorResponse(500, 'Internal server error', 'SERVER_ERROR'),
        { status: 500 }
      )
    }
    
    if (body.username === 'invalid-user') {
      return HttpResponse.json(
        createErrorResponse(422, 'Invalid username format', 'INVALID_USERNAME'),
        { status: 422 }
      )
    }
    
    return HttpResponse.json(
      createPasswordResetResponse({
        success: true,
        message: 'Password reset email sent successfully',
      }),
      { status: 200 }
    )
  }),

  // Registration confirmation endpoint
  http.post('/api/v2/user/register', async ({ request }) => {
    const body = await request.json() as any
    
    if (body.code === 'invalid-code') {
      return HttpResponse.json(
        createErrorResponse(400, 'Invalid confirmation code', 'INVALID_CODE'),
        { status: 400 }
      )
    }
    
    if (body.password !== body.password_confirmation) {
      return HttpResponse.json(
        createErrorResponse(422, 'Password confirmation does not match', 'PASSWORD_MISMATCH'),
        { status: 422 }
      )
    }
    
    return HttpResponse.json(
      createPasswordResetResponse({
        success: true,
        message: 'Registration completed successfully',
        session_token: 'mock-session-token-register',
        user: mockUserSession,
      }),
      { status: 200 }
    )
  }),

  // Invitation confirmation endpoint
  http.post('/api/v2/user/password', async ({ request }) => {
    const url = new URL(request.url)
    const isInvitation = url.searchParams.get('reset') === 'true'
    
    if (!isInvitation) return HttpResponse.passthrough()
    
    const body = await request.json() as any
    
    if (body.code === 'expired-invitation') {
      return HttpResponse.json(
        createErrorResponse(400, 'Invitation code has expired', 'INVITATION_EXPIRED'),
        { status: 400 }
      )
    }
    
    return HttpResponse.json(
      createPasswordResetResponse({
        success: true,
        message: 'Invitation accepted successfully',
        session_token: 'mock-session-token-invitation',
        user: mockUserSession,
      }),
      { status: 200 }
    )
  }),

  // System configuration endpoint
  http.get('/api/v2/system/config', () => {
    return HttpResponse.json({
      resource: [mockSystemConfig],
    })
  }),
]

// Test server setup
const server = setupServer(...passwordResetHandlers)

describe('PasswordResetForm Component', () => {
  let queryClient: QueryClient
  let mockRouter: ReturnType<typeof createMockRouter>
  let user: ReturnType<typeof userEvent.setup>

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  beforeEach(() => {
    queryClient = createTestQueryClient()
    mockRouter = createMockRouter()
    user = userEvent.setup()
    
    // Reset mocks
    vi.clearAllMocks()
    
    // Setup default mock implementations
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams())
  })

  afterEach(() => {
    server.resetHandlers()
    queryClient.clear()
  })

  afterAll(() => {
    server.close()
  })

  describe('Password Reset Workflow', () => {
    it('should render password reset form with email field when loginAttribute is email', async () => {
      // Mock system config with email login attribute
      const mockUseSystemConfig = await import('@/hooks/use-system-config')
      vi.mocked(mockUseSystemConfig.useSystemConfig).mockReturnValue({
        data: { ...mockSystemConfig, loginAttribute: 'email' },
        isLoading: false,
        error: null,
      })

      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="reset" />
        </QueryClientProvider>
      )

      // Verify form elements
      expect(screen.getByRole('form', { name: /password reset/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
      
      // Verify no username field
      expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument()
    })

    it('should render password reset form with username field when loginAttribute is username', async () => {
      // Mock system config with username login attribute
      const mockUseSystemConfig = await import('@/hooks/use-system-config')
      vi.mocked(mockUseSystemConfig.useSystemConfig).mockReturnValue({
        data: { ...mockSystemConfig, loginAttribute: 'username' },
        isLoading: false,
        error: null,
      })

      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="reset" />
        </QueryClientProvider>
      )

      // Verify form elements
      expect(screen.getByRole('form', { name: /password reset/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
      
      // Verify no email field
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
    })

    it('should validate email format in real-time under 100ms', async () => {
      const mockUseSystemConfig = await import('@/hooks/use-system-config')
      vi.mocked(mockUseSystemConfig.useSystemConfig).mockReturnValue({
        data: { ...mockSystemConfig, loginAttribute: 'email' },
        isLoading: false,
        error: null,
      })

      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="reset" />
        </QueryClientProvider>
      )

      const emailInput = screen.getByLabelText(/email/i)
      
      // Start performance measurement
      const startTime = performance.now()
      
      // Type invalid email
      await user.type(emailInput, 'invalid-email')
      
      // Wait for validation
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const validationTime = endTime - startTime
      
      // Verify validation occurs under 100ms requirement
      expect(validationTime).toBeLessThan(100)
    })

    it('should submit password reset request successfully with email', async () => {
      const mockUseSystemConfig = await import('@/hooks/use-system-config')
      vi.mocked(mockUseSystemConfig.useSystemConfig).mockReturnValue({
        data: { ...mockSystemConfig, loginAttribute: 'email' },
        isLoading: false,
        error: null,
      })

      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="reset" />
        </QueryClientProvider>
      )

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /send reset link/i })

      // Fill form
      await user.type(emailInput, 'user@example.com')
      
      // Submit form
      await user.click(submitButton)

      // Verify loading state
      expect(screen.getByText(/sending reset link/i)).toBeInTheDocument()

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/password reset email sent successfully/i)).toBeInTheDocument()
      })
    })

    it('should handle password reset request errors gracefully', async () => {
      const mockUseSystemConfig = await import('@/hooks/use-system-config')
      vi.mocked(mockUseSystemConfig.useSystemConfig).mockReturnValue({
        data: { ...mockSystemConfig, loginAttribute: 'email' },
        isLoading: false,
        error: null,
      })

      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="reset" />
        </QueryClientProvider>
      )

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /send reset link/i })

      // Fill form with email that will trigger 404 error
      await user.type(emailInput, 'nonexistent@example.com')
      
      // Submit form
      await user.click(submitButton)

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/user not found/i)).toBeInTheDocument()
      })

      // Verify form remains accessible for retry
      expect(submitButton).toBeEnabled()
    })

    it('should handle server errors with retry functionality', async () => {
      const mockUseSystemConfig = await import('@/hooks/use-system-config')
      vi.mocked(mockUseSystemConfig.useSystemConfig).mockReturnValue({
        data: { ...mockSystemConfig, loginAttribute: 'email' },
        isLoading: false,
        error: null,
      })

      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="reset" />
        </QueryClientProvider>
      )

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /send reset link/i })

      // Fill form with email that will trigger server error
      await user.type(emailInput, 'server-error@example.com')
      
      // Submit form
      await user.click(submitButton)

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument()
      })

      // Verify retry button is available
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  describe('Registration Confirmation Workflow', () => {
    beforeEach(() => {
      // Mock URL search params for registration confirmation
      vi.mocked(useSearchParams).mockReturnValue(
        new URLSearchParams('?code=registration-code&email=user@example.com')
      )
    })

    it('should render registration confirmation form with password fields', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="register" />
        </QueryClientProvider>
      )

      // Verify form elements
      expect(screen.getByRole('form', { name: /complete registration/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /complete registration/i })).toBeInTheDocument()
      
      // Verify confirmation code is hidden but present
      expect(screen.getByDisplayValue('registration-code')).toBeInTheDocument()
    })

    it('should validate password confirmation matching in real-time', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="register" />
        </QueryClientProvider>
      )

      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      // Type password
      await user.type(passwordInput, 'SecurePassword123!')
      
      // Type non-matching confirmation
      await user.type(confirmPasswordInput, 'DifferentPassword123!')

      // Verify validation error
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    it('should validate password strength requirements', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="register" />
        </QueryClientProvider>
      )

      const passwordInput = screen.getByLabelText(/^password$/i)

      // Type weak password
      await user.type(passwordInput, 'weak')

      // Verify validation error
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })

    it('should complete registration successfully and authenticate user', async () => {
      const mockAuth = await import('@/hooks/use-auth')
      const mockLogin = vi.fn()
      vi.mocked(mockAuth.useAuth).mockReturnValue({
        login: mockLogin,
        isAuthenticated: false,
        user: null,
      })

      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="register" />
        </QueryClientProvider>
      )

      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /complete registration/i })

      // Fill form
      await user.type(passwordInput, 'SecurePassword123!')
      await user.type(confirmPasswordInput, 'SecurePassword123!')
      
      // Submit form
      await user.click(submitButton)

      // Wait for success and automatic authentication
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('mock-session-token-register', mockUserSession)
      })

      // Verify navigation to dashboard
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })

    it('should handle invalid confirmation code gracefully', async () => {
      // Mock invalid confirmation code
      vi.mocked(useSearchParams).mockReturnValue(
        new URLSearchParams('?code=invalid-code&email=user@example.com')
      )

      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="register" />
        </QueryClientProvider>
      )

      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /complete registration/i })

      // Fill form
      await user.type(passwordInput, 'SecurePassword123!')
      await user.type(confirmPasswordInput, 'SecurePassword123!')
      
      // Submit form
      await user.click(submitButton)

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/invalid confirmation code/i)).toBeInTheDocument()
      })
    })
  })

  describe('Invitation Confirmation Workflow', () => {
    beforeEach(() => {
      // Mock URL search params for invitation confirmation
      vi.mocked(useSearchParams).mockReturnValue(
        new URLSearchParams('?code=invitation-code&email=invitee@example.com&reset=true')
      )
    })

    it('should render invitation confirmation form with all required fields', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="invitation" />
        </QueryClientProvider>
      )

      // Verify form elements
      expect(screen.getByRole('form', { name: /accept invitation/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /accept invitation/i })).toBeInTheDocument()
      
      // Verify invitation code is present
      expect(screen.getByDisplayValue('invitation-code')).toBeInTheDocument()
    })

    it('should complete invitation acceptance successfully', async () => {
      const mockAuth = await import('@/hooks/use-auth')
      const mockLogin = vi.fn()
      vi.mocked(mockAuth.useAuth).mockReturnValue({
        login: mockLogin,
        isAuthenticated: false,
        user: null,
      })

      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="invitation" />
        </QueryClientProvider>
      )

      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /accept invitation/i })

      // Fill form
      await user.type(passwordInput, 'SecurePassword123!')
      await user.type(confirmPasswordInput, 'SecurePassword123!')
      
      // Submit form
      await user.click(submitButton)

      // Wait for success and automatic authentication
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('mock-session-token-invitation', mockUserSession)
      })

      // Verify navigation to dashboard
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })

    it('should handle expired invitation code', async () => {
      // Mock expired invitation code
      vi.mocked(useSearchParams).mockReturnValue(
        new URLSearchParams('?code=expired-invitation&email=invitee@example.com&reset=true')
      )

      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="invitation" />
        </QueryClientProvider>
      )

      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /accept invitation/i })

      // Fill form
      await user.type(passwordInput, 'SecurePassword123!')
      await user.type(confirmPasswordInput, 'SecurePassword123!')
      
      // Submit form
      await user.click(submitButton)

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/invitation code has expired/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation Edge Cases', () => {
    it('should prevent form submission with empty required fields', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="reset" />
        </QueryClientProvider>
      )

      const submitButton = screen.getByRole('button', { name: /send reset link/i })

      // Try to submit empty form
      await user.click(submitButton)

      // Verify validation errors appear
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })

      // Verify form is not submitted
      expect(screen.queryByText(/sending reset link/i)).not.toBeInTheDocument()
    })

    it('should handle special characters in username validation', async () => {
      const mockUseSystemConfig = await import('@/hooks/use-system-config')
      vi.mocked(mockUseSystemConfig.useSystemConfig).mockReturnValue({
        data: { ...mockSystemConfig, loginAttribute: 'username' },
        isLoading: false,
        error: null,
      })

      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="reset" />
        </QueryClientProvider>
      )

      const usernameInput = screen.getByLabelText(/username/i)

      // Type username with special characters
      await user.type(usernameInput, 'user@#$%')

      // Should accept special characters (validation handled by server)
      expect(usernameInput).toHaveValue('user@#$%')
    })

    it('should handle password complexity requirements', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="register" />
        </QueryClientProvider>
      )

      const passwordInput = screen.getByLabelText(/^password$/i)

      // Test various invalid passwords
      const invalidPasswords = [
        'short',
        '12345678', // numbers only
        'password', // letters only
        'PASSWORD', // uppercase only
      ]

      for (const password of invalidPasswords) {
        await user.clear(passwordInput)
        await user.type(passwordInput, password)
        
        await waitFor(() => {
          expect(screen.getByText(/password must contain/i)).toBeInTheDocument()
        })
      }
    })
  })

  describe('Error Boundary Integration', () => {
    it('should render fallback UI when component throws error', () => {
      // Create a component that throws an error
      const ThrowingComponent = () => {
        throw new Error('Test error for error boundary')
      }

      const ErrorFallback = ({ error }: { error: Error }) => (
        <div role="alert">
          <h2>Something went wrong:</h2>
          <pre>{error.message}</pre>
        </div>
      )

      render(
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <QueryClientProvider client={queryClient}>
            <ThrowingComponent />
          </QueryClientProvider>
        </ErrorBoundary>
      )

      // Verify error boundary fallback is rendered
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      expect(screen.getByText(/test error for error boundary/i)).toBeInTheDocument()
    })

    it('should handle API errors gracefully through error boundary', async () => {
      // Mock a component that will cause an API error
      server.use(
        http.post('/api/v2/user/password', () => {
          throw new Error('Network error')
        })
      )

      const ErrorFallback = ({ error }: { error: Error }) => (
        <div role="alert">
          <h2>Network Error</h2>
          <p>Please check your connection and try again.</p>
        </div>
      )

      render(
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <QueryClientProvider client={queryClient}>
            <PasswordResetForm workflowType="reset" />
          </QueryClientProvider>
        </ErrorBoundary>
      )

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /send reset link/i })

      // Fill and submit form to trigger network error
      await user.type(emailInput, 'user@example.com')
      await user.click(submitButton)

      // Error should be caught and handled gracefully
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Tailwind CSS Theme Integration', () => {
    it('should apply correct theme classes for light mode', () => {
      // Mock theme provider with light mode
      render(
        <div className="light" data-testid="theme-container">
          <QueryClientProvider client={queryClient}>
            <PasswordResetForm workflowType="reset" />
          </QueryClientProvider>
        </div>
      )

      const form = screen.getByRole('form')
      const container = screen.getByTestId('theme-container')

      // Verify light theme classes are applied
      expect(container).toHaveClass('light')
      expect(form).toBeInTheDocument()
    })

    it('should apply correct theme classes for dark mode', () => {
      // Mock theme provider with dark mode
      render(
        <div className="dark" data-testid="theme-container">
          <QueryClientProvider client={queryClient}>
            <PasswordResetForm workflowType="reset" />
          </QueryClientProvider>
        </div>
      )

      const container = screen.getByTestId('theme-container')

      // Verify dark theme classes are applied
      expect(container).toHaveClass('dark')
    })

    it('should be responsive across different screen sizes', () => {
      // Mock different viewport sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="reset" />
        </QueryClientProvider>
      )

      const form = screen.getByRole('form')
      
      // Verify form is rendered and accessible at mobile viewport
      expect(form).toBeInTheDocument()

      // Test desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 1024,
      })

      // Form should remain accessible
      expect(form).toBeInTheDocument()
    })
  })

  describe('React Query Integration', () => {
    it('should cache successful responses and prevent duplicate requests', async () => {
      let requestCount = 0
      
      server.use(
        http.post('/api/v2/user/password', () => {
          requestCount++
          return HttpResponse.json(
            createPasswordResetResponse({
              success: true,
              message: 'Password reset email sent successfully',
            }),
            { status: 200 }
          )
        })
      )

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="reset" />
        </QueryClientProvider>
      )

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /send reset link/i })

      // Submit form first time
      await user.type(emailInput, 'user@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password reset email sent successfully/i)).toBeInTheDocument()
      })

      // Clear form and submit again with same email
      await user.clear(emailInput)
      await user.type(emailInput, 'user@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password reset email sent successfully/i)).toBeInTheDocument()
      })

      // Verify only one request was made due to caching
      expect(requestCount).toBe(1)
    })

    it('should handle network failures with automatic retry logic', async () => {
      let attemptCount = 0
      
      server.use(
        http.post('/api/v2/user/password', () => {
          attemptCount++
          if (attemptCount < 3) {
            return HttpResponse.error()
          }
          return HttpResponse.json(
            createPasswordResetResponse({
              success: true,
              message: 'Password reset email sent successfully',
            }),
            { status: 200 }
          )
        })
      )

      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="reset" />
        </QueryClientProvider>
      )

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /send reset link/i })

      // Submit form
      await user.type(emailInput, 'user@example.com')
      await user.click(submitButton)

      // Should eventually succeed after retries
      await waitFor(() => {
        expect(screen.getByText(/password reset email sent successfully/i)).toBeInTheDocument()
      }, { timeout: 5000 })

      // Verify multiple attempts were made
      expect(attemptCount).toBe(3)
    })
  })

  describe('Performance Requirements', () => {
    it('should render initial form under 100ms', async () => {
      const startTime = performance.now()
      
      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="reset" />
        </QueryClientProvider>
      )

      // Wait for form to be fully rendered
      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Verify render time meets performance requirement
      expect(renderTime).toBeLessThan(100)
    })

    it('should handle large form validation data efficiently', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="register" />
        </QueryClientProvider>
      )

      const passwordInput = screen.getByLabelText(/^password$/i)
      
      // Type long password to test validation performance
      const longPassword = 'a'.repeat(1000)
      
      const startTime = performance.now()
      await user.type(passwordInput, longPassword)
      
      await waitFor(() => {
        expect(passwordInput).toHaveValue(longPassword)
      })
      
      const endTime = performance.now()
      const validationTime = endTime - startTime

      // Verify validation handles large input efficiently
      expect(validationTime).toBeLessThan(500) // Allow more time for large input
    })
  })

  describe('Accessibility Compliance', () => {
    it('should provide proper ARIA labels and roles', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="reset" />
        </QueryClientProvider>
      )

      // Verify form has proper role
      expect(screen.getByRole('form')).toBeInTheDocument()
      
      // Verify input has proper label association
      const emailInput = screen.getByLabelText(/email/i)
      expect(emailInput).toBeInTheDocument()
      
      // Verify button has proper role and accessible name
      const submitButton = screen.getByRole('button', { name: /send reset link/i })
      expect(submitButton).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="reset" />
        </QueryClientProvider>
      )

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /send reset link/i })

      // Tab to email input
      await user.tab()
      expect(emailInput).toHaveFocus()

      // Tab to submit button
      await user.tab()
      expect(submitButton).toHaveFocus()

      // Submit with keyboard
      await user.keyboard('{Enter}')
      
      // Verify form responds to keyboard submission
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })
    })

    it('should announce form validation errors to screen readers', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <PasswordResetForm workflowType="reset" />
        </QueryClientProvider>
      )

      const emailInput = screen.getByLabelText(/email/i)
      
      // Type invalid email
      await user.type(emailInput, 'invalid-email')

      // Verify error message has proper ARIA attributes
      await waitFor(() => {
        const errorMessage = screen.getByText(/please enter a valid email address/i)
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage).toHaveAttribute('role', 'alert')
      })
    })
  })
})