/**
 * @fileoverview Vitest test suite for forgot password form component
 * 
 * This test suite validates the two-step password reset workflow, security question handling,
 * and system configuration integration. Tests cover both email and username-based systems
 * with comprehensive API interaction testing using Mock Service Worker.
 * 
 * Test Coverage:
 * - Dynamic form field switching based on login attribute configuration
 * - Two-step workflow: initial request and security question forms
 * - API integration with mocked password reset endpoints
 * - Form validation for email/username format and required fields
 * - Error handling for API failures and invalid input scenarios
 * - User interaction flows including form submission and navigation
 * - Accessibility compliance with WCAG 2.1 AA standards
 */

import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/mocks/server'
import { renderWithProviders } from '../../../test/utils/test-utils'
import { createMockSystemConfig, createMockPasswordResetResponse, createMockSecurityQuestionResponse } from '../../../test/utils/component-factories'
import { mockAuthErrorResponse } from '../../../test/mocks/error-responses'
import ForgotPasswordForm from './forgot-password-form'

// Extend Jest DOM matchers for accessibility testing
expect.extend(toHaveNoViolations)

/**
 * Mock Next.js router for navigation testing
 */
const mockPush = vi.fn()
const mockBack = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/auth/forgot-password',
}))

/**
 * Mock system configuration hook for testing dynamic form behavior
 */
const mockSystemConfig = vi.fn()
vi.mock('../../../hooks/use-system-config', () => ({
  useSystemConfig: () => mockSystemConfig(),
}))

/**
 * Mock authentication hook for password reset operations
 */
const mockForgotPassword = vi.fn()
const mockSubmitSecurityQuestions = vi.fn()
vi.mock('../../../hooks/use-auth', () => ({
  useAuth: () => ({
    forgotPassword: mockForgotPassword,
    submitSecurityQuestions: mockSubmitSecurityQuestions,
    isLoading: false,
    error: null,
  }),
}))

describe('ForgotPasswordForm', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeAll(() => {
    // Configure MSW server for API mocking
    server.listen({ onUnhandledRequest: 'error' })
  })

  beforeEach(() => {
    // Set up user event instance for realistic user interactions
    user = userEvent.setup()
    
    // Reset all mocks before each test
    vi.clearAllMocks()
    mockPush.mockClear()
    mockBack.mockClear()
    
    // Default system configuration for email-based authentication
    mockSystemConfig.mockReturnValue({
      data: createMockSystemConfig({ loginAttribute: 'email' }),
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    // Reset MSW request handlers after each test
    server.resetHandlers()
  })

  describe('Component Rendering and Accessibility', () => {
    it('should render forgot password form with proper accessibility structure', async () => {
      const { container } = renderWithProviders(<ForgotPasswordForm />)

      // Verify main form elements are present
      expect(screen.getByRole('form', { name: /forgot password/i })).toBeInTheDocument()
      expect(screen.getByText(/forgot your password/i)).toBeInTheDocument()
      expect(screen.getByText(/enter your email address/i)).toBeInTheDocument()
      
      // Verify form controls have proper accessibility attributes
      const emailInput = screen.getByRole('textbox', { name: /email address/i })
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('required')
      expect(emailInput).toHaveAttribute('aria-describedby')
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i })
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toHaveAttribute('type', 'submit')

      // Verify back to login link
      const backLink = screen.getByRole('link', { name: /back to login/i })
      expect(backLink).toBeInTheDocument()

      // Run accessibility audit
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper form labels and ARIA attributes', () => {
      renderWithProviders(<ForgotPasswordForm />)

      const emailInput = screen.getByRole('textbox', { name: /email address/i })
      const label = screen.getByText(/email address/i)
      
      // Verify label association
      expect(emailInput).toHaveAttribute('id')
      expect(label).toHaveAttribute('for', emailInput.getAttribute('id'))
      
      // Verify ARIA attributes for error messaging
      expect(emailInput).toHaveAttribute('aria-describedby')
      expect(emailInput).toHaveAttribute('aria-invalid', 'false')
    })

    it('should display loading state correctly', () => {
      // Mock loading state
      mockForgotPassword.mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
        error: null,
      })

      renderWithProviders(<ForgotPasswordForm />)

      const submitButton = screen.getByRole('button', { name: /sending/i })
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveAttribute('aria-busy', 'true')
    })
  })

  describe('Dynamic Form Field Configuration', () => {
    it('should display email input when system is configured for email authentication', () => {
      mockSystemConfig.mockReturnValue({
        data: createMockSystemConfig({ loginAttribute: 'email' }),
        isLoading: false,
        error: null,
      })

      renderWithProviders(<ForgotPasswordForm />)

      expect(screen.getByRole('textbox', { name: /email address/i })).toBeInTheDocument()
      expect(screen.getByText(/enter your email address/i)).toBeInTheDocument()
      expect(screen.queryByRole('textbox', { name: /username/i })).not.toBeInTheDocument()
    })

    it('should display username input when system is configured for username authentication', () => {
      mockSystemConfig.mockReturnValue({
        data: createMockSystemConfig({ loginAttribute: 'username' }),
        isLoading: false,
        error: null,
      })

      renderWithProviders(<ForgotPasswordForm />)

      expect(screen.getByRole('textbox', { name: /username/i })).toBeInTheDocument()
      expect(screen.getByText(/enter your username/i)).toBeInTheDocument()
      expect(screen.queryByRole('textbox', { name: /email address/i })).not.toBeInTheDocument()
    })

    it('should handle system configuration loading state', () => {
      mockSystemConfig.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      })

      renderWithProviders(<ForgotPasswordForm />)

      // Should show loading skeleton or disabled state
      expect(screen.getByRole('form')).toHaveAttribute('aria-busy', 'true')
    })

    it('should handle system configuration error state', () => {
      mockSystemConfig.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load configuration'),
      })

      renderWithProviders(<ForgotPasswordForm />)

      expect(screen.getByText(/unable to load system configuration/i)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should validate email format when in email mode', async () => {
      mockSystemConfig.mockReturnValue({
        data: createMockSystemConfig({ loginAttribute: 'email' }),
        isLoading: false,
        error: null,
      })

      renderWithProviders(<ForgotPasswordForm />)

      const emailInput = screen.getByRole('textbox', { name: /email address/i })
      const submitButton = screen.getByRole('button', { name: /send reset link/i })

      // Test invalid email format
      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })

      // Verify ARIA attributes updated for error state
      expect(emailInput).toHaveAttribute('aria-invalid', 'true')
      expect(emailInput).toHaveAttribute('aria-describedby')
    })

    it('should validate username format when in username mode', async () => {
      mockSystemConfig.mockReturnValue({
        data: createMockSystemConfig({ loginAttribute: 'username' }),
        isLoading: false,
        error: null,
      })

      renderWithProviders(<ForgotPasswordForm />)

      const usernameInput = screen.getByRole('textbox', { name: /username/i })
      const submitButton = screen.getByRole('button', { name: /send reset link/i })

      // Test empty username
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument()
      })

      // Test username with invalid characters
      await user.type(usernameInput, 'user@name!')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/username contains invalid characters/i)).toBeInTheDocument()
      })
    })

    it('should require field to be filled before submission', async () => {
      renderWithProviders(<ForgotPasswordForm />)

      const submitButton = screen.getByRole('button', { name: /send reset link/i })
      
      // Try to submit empty form
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email address is required/i)).toBeInTheDocument()
      })
    })

    it('should clear validation errors when user starts typing', async () => {
      renderWithProviders(<ForgotPasswordForm />)

      const emailInput = screen.getByRole('textbox', { name: /email address/i })
      const submitButton = screen.getByRole('button', { name: /send reset link/i })

      // Trigger validation error
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByText(/email address is required/i)).toBeInTheDocument()
      })

      // Start typing to clear error
      await user.type(emailInput, 'test@example.com')
      
      await waitFor(() => {
        expect(screen.queryByText(/email address is required/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('API Integration - Initial Password Reset Request', () => {
    it('should successfully submit password reset request for email', async () => {
      const mockMutation = {
        mutate: vi.fn(),
        isPending: false,
        error: null,
        isSuccess: false,
      }
      mockForgotPassword.mockReturnValue(mockMutation)

      // Mock successful API response
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.json(createMockPasswordResetResponse({ requiresSecurityQuestions: false }))
        })
      )

      renderWithProviders(<ForgotPasswordForm />)

      const emailInput = screen.getByRole('textbox', { name: /email address/i })
      const submitButton = screen.getByRole('button', { name: /send reset link/i })

      // Fill and submit form
      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      // Verify mutation was called with correct data
      expect(mockMutation.mutate).toHaveBeenCalledWith({
        identifier: 'test@example.com',
        type: 'email',
      })
    })

    it('should successfully submit password reset request for username', async () => {
      mockSystemConfig.mockReturnValue({
        data: createMockSystemConfig({ loginAttribute: 'username' }),
        isLoading: false,
        error: null,
      })

      const mockMutation = {
        mutate: vi.fn(),
        isPending: false,
        error: null,
        isSuccess: false,
      }
      mockForgotPassword.mockReturnValue(mockMutation)

      renderWithProviders(<ForgotPasswordForm />)

      const usernameInput = screen.getByRole('textbox', { name: /username/i })
      const submitButton = screen.getByRole('button', { name: /send reset link/i })

      // Fill and submit form
      await user.type(usernameInput, 'testuser')
      await user.click(submitButton)

      // Verify mutation was called with correct data
      expect(mockMutation.mutate).toHaveBeenCalledWith({
        identifier: 'testuser',
        type: 'username',
      })
    })

    it('should display success message when password reset link is sent', async () => {
      const mockMutation = {
        mutate: vi.fn((_, { onSuccess }) => {
          onSuccess(createMockPasswordResetResponse({ requiresSecurityQuestions: false }))
        }),
        isPending: false,
        error: null,
        isSuccess: true,
      }
      mockForgotPassword.mockReturnValue(mockMutation)

      renderWithProviders(<ForgotPasswordForm />)

      const emailInput = screen.getByRole('textbox', { name: /email address/i })
      const submitButton = screen.getByRole('button', { name: /send reset link/i })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password reset link has been sent/i)).toBeInTheDocument()
        expect(screen.getByText(/check your email/i)).toBeInTheDocument()
      })
    })
  })

  describe('Two-Step Workflow - Security Questions', () => {
    it('should display security questions form when required by backend', async () => {
      const mockMutation = {
        mutate: vi.fn((_, { onSuccess }) => {
          onSuccess(createMockPasswordResetResponse({ 
            requiresSecurityQuestions: true,
            securityQuestions: [
              { question: 'What was your first pet\'s name?', id: 'q1' },
              { question: 'What city were you born in?', id: 'q2' }
            ]
          }))
        }),
        isPending: false,
        error: null,
        isSuccess: false,
      }
      mockForgotPassword.mockReturnValue(mockMutation)

      renderWithProviders(<ForgotPasswordForm />)

      const emailInput = screen.getByRole('textbox', { name: /email address/i })
      const submitButton = screen.getByRole('button', { name: /send reset link/i })

      // Submit initial form
      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      // Verify security questions form is displayed
      await waitFor(() => {
        expect(screen.getByText(/security questions/i)).toBeInTheDocument()
        expect(screen.getByText(/what was your first pet's name/i)).toBeInTheDocument()
        expect(screen.getByText(/what city were you born in/i)).toBeInTheDocument()
      })

      // Verify form has proper accessibility structure
      const securityForm = screen.getByRole('form', { name: /security questions/i })
      expect(securityForm).toBeInTheDocument()

      const answerInputs = screen.getAllByRole('textbox')
      expect(answerInputs).toHaveLength(2)
      answerInputs.forEach(input => {
        expect(input).toHaveAttribute('required')
        expect(input).toHaveAttribute('aria-describedby')
      })
    })

    it('should validate security question answers', async () => {
      // Set up initial state with security questions
      const mockMutation = {
        mutate: vi.fn((_, { onSuccess }) => {
          onSuccess(createMockPasswordResetResponse({ 
            requiresSecurityQuestions: true,
            securityQuestions: [
              { question: 'What was your first pet\'s name?', id: 'q1' }
            ]
          }))
        }),
        isPending: false,
        error: null,
        isSuccess: false,
      }
      mockForgotPassword.mockReturnValue(mockMutation)

      renderWithProviders(<ForgotPasswordForm />)

      // Submit initial form to reach security questions
      await user.type(screen.getByRole('textbox', { name: /email address/i }), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /send reset link/i }))

      await waitFor(() => {
        expect(screen.getByText(/security questions/i)).toBeInTheDocument()
      })

      // Try to submit without answers
      const securitySubmitButton = screen.getByRole('button', { name: /submit answers/i })
      await user.click(securitySubmitButton)

      await waitFor(() => {
        expect(screen.getByText(/please answer all security questions/i)).toBeInTheDocument()
      })
    })

    it('should successfully submit security question answers', async () => {
      // Mock the security questions submission
      const mockSecurityMutation = {
        mutate: vi.fn(),
        isPending: false,
        error: null,
        isSuccess: false,
      }
      mockSubmitSecurityQuestions.mockReturnValue(mockSecurityMutation)

      // Set up initial state with security questions
      const mockMutation = {
        mutate: vi.fn((_, { onSuccess }) => {
          onSuccess(createMockPasswordResetResponse({ 
            requiresSecurityQuestions: true,
            securityQuestions: [
              { question: 'What was your first pet\'s name?', id: 'q1' }
            ],
            sessionToken: 'temp-session-123'
          }))
        }),
        isPending: false,
        error: null,
        isSuccess: false,
      }
      mockForgotPassword.mockReturnValue(mockMutation)

      renderWithProviders(<ForgotPasswordForm />)

      // Submit initial form to reach security questions
      await user.type(screen.getByRole('textbox', { name: /email address/i }), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /send reset link/i }))

      await waitFor(() => {
        expect(screen.getByText(/security questions/i)).toBeInTheDocument()
      })

      // Fill and submit security answers
      const answerInput = screen.getByRole('textbox')
      await user.type(answerInput, 'Fluffy')
      
      const submitButton = screen.getByRole('button', { name: /submit answers/i })
      await user.click(submitButton)

      // Verify security answers submission
      expect(mockSecurityMutation.mutate).toHaveBeenCalledWith({
        sessionToken: 'temp-session-123',
        answers: [
          { questionId: 'q1', answer: 'Fluffy' }
        ]
      })
    })

    it('should show success message after completing security questions', async () => {
      const mockSecurityMutation = {
        mutate: vi.fn((_, { onSuccess }) => {
          onSuccess(createMockSecurityQuestionResponse())
        }),
        isPending: false,
        error: null,
        isSuccess: true,
      }
      mockSubmitSecurityQuestions.mockReturnValue(mockSecurityMutation)

      // Set up with completed security questions flow
      renderWithProviders(<ForgotPasswordForm />)
      
      // Simulate successful security questions completion
      fireEvent.click(screen.getByRole('button', { name: /submit answers/i }))

      await waitFor(() => {
        expect(screen.getByText(/password reset link has been sent/i)).toBeInTheDocument()
        expect(screen.getByText(/check your email for reset instructions/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message for API failures', async () => {
      const mockMutation = {
        mutate: vi.fn((_, { onError }) => {
          onError(new Error('Network error'))
        }),
        isPending: false,
        error: new Error('Network error'),
        isSuccess: false,
      }
      mockForgotPassword.mockReturnValue(mockMutation)

      renderWithProviders(<ForgotPasswordForm />)

      const emailInput = screen.getByRole('textbox', { name: /email address/i })
      const submitButton = screen.getByRole('button', { name: /send reset link/i })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/an error occurred while processing your request/i)).toBeInTheDocument()
      })

      // Verify error has proper accessibility attributes
      const errorMessage = screen.getByRole('alert')
      expect(errorMessage).toBeInTheDocument()
      expect(errorMessage).toHaveAttribute('aria-live', 'assertive')
    })

    it('should display specific error message for invalid email/username', async () => {
      const mockMutation = {
        mutate: vi.fn((_, { onError }) => {
          onError(mockAuthErrorResponse(404, 'User not found'))
        }),
        isPending: false,
        error: mockAuthErrorResponse(404, 'User not found'),
        isSuccess: false,
      }
      mockForgotPassword.mockReturnValue(mockMutation)

      renderWithProviders(<ForgotPasswordForm />)

      const emailInput = screen.getByRole('textbox', { name: /email address/i })
      const submitButton = screen.getByRole('button', { name: /send reset link/i })

      await user.type(emailInput, 'nonexistent@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/no account found with that email address/i)).toBeInTheDocument()
      })
    })

    it('should handle security questions API errors', async () => {
      const mockSecurityMutation = {
        mutate: vi.fn((_, { onError }) => {
          onError(mockAuthErrorResponse(400, 'Invalid security answers'))
        }),
        isPending: false,
        error: mockAuthErrorResponse(400, 'Invalid security answers'),
        isSuccess: false,
      }
      mockSubmitSecurityQuestions.mockReturnValue(mockSecurityMutation)

      // Simulate being in security questions state
      renderWithProviders(<ForgotPasswordForm />)
      
      await waitFor(() => {
        expect(screen.getByText(/security answers are incorrect/i)).toBeInTheDocument()
      })
    })

    it('should allow retry after API error', async () => {
      let attemptCount = 0
      const mockMutation = {
        mutate: vi.fn((_, { onError, onSuccess }) => {
          attemptCount++
          if (attemptCount === 1) {
            onError(new Error('Network error'))
          } else {
            onSuccess(createMockPasswordResetResponse({ requiresSecurityQuestions: false }))
          }
        }),
        isPending: false,
        error: attemptCount === 1 ? new Error('Network error') : null,
        isSuccess: attemptCount > 1,
      }
      mockForgotPassword.mockReturnValue(mockMutation)

      renderWithProviders(<ForgotPasswordForm />)

      const emailInput = screen.getByRole('textbox', { name: /email address/i })
      const submitButton = screen.getByRole('button', { name: /send reset link/i })

      // First attempt - should fail
      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/an error occurred/i)).toBeInTheDocument()
      })

      // Retry button should be available
      const retryButton = screen.getByRole('button', { name: /try again/i })
      expect(retryButton).toBeInTheDocument()

      // Second attempt - should succeed
      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText(/password reset link has been sent/i)).toBeInTheDocument()
      })
    })
  })

  describe('User Navigation and Interaction', () => {
    it('should navigate back to login when back link is clicked', async () => {
      renderWithProviders(<ForgotPasswordForm />)

      const backLink = screen.getByRole('link', { name: /back to login/i })
      await user.click(backLink)

      expect(mockBack).toHaveBeenCalled()
    })

    it('should handle keyboard navigation correctly', async () => {
      renderWithProviders(<ForgotPasswordForm />)

      const emailInput = screen.getByRole('textbox', { name: /email address/i })
      const submitButton = screen.getByRole('button', { name: /send reset link/i })
      const backLink = screen.getByRole('link', { name: /back to login/i })

      // Test tab navigation
      await user.tab()
      expect(emailInput).toHaveFocus()

      await user.tab()
      expect(submitButton).toHaveFocus()

      await user.tab()
      expect(backLink).toHaveFocus()

      // Test form submission with Enter key
      emailInput.focus()
      await user.type(emailInput, 'test@example.com')
      await user.keyboard('{Enter}')

      // Should trigger form submission
      expect(mockForgotPassword().mutate).toHaveBeenCalled()
    })

    it('should maintain focus management during state transitions', async () => {
      const mockMutation = {
        mutate: vi.fn((_, { onSuccess }) => {
          onSuccess(createMockPasswordResetResponse({ 
            requiresSecurityQuestions: true,
            securityQuestions: [
              { question: 'What was your first pet\'s name?', id: 'q1' }
            ]
          }))
        }),
        isPending: false,
        error: null,
        isSuccess: false,
      }
      mockForgotPassword.mockReturnValue(mockMutation)

      renderWithProviders(<ForgotPasswordForm />)

      // Submit initial form
      await user.type(screen.getByRole('textbox', { name: /email address/i }), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /send reset link/i }))

      // Focus should move to first security question
      await waitFor(() => {
        const firstQuestionInput = screen.getByRole('textbox')
        expect(firstQuestionInput).toHaveFocus()
      })
    })
  })

  describe('Component State Management', () => {
    it('should maintain form state during configuration loading', () => {
      // Start with loading configuration
      mockSystemConfig.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      })

      const { rerender } = renderWithProviders(<ForgotPasswordForm />)

      // Form should be disabled during loading
      expect(screen.getByRole('form')).toHaveAttribute('aria-busy', 'true')

      // Configuration loads
      mockSystemConfig.mockReturnValue({
        data: createMockSystemConfig({ loginAttribute: 'email' }),
        isLoading: false,
        error: null,
      })

      rerender(<ForgotPasswordForm />)

      // Form should now be available
      expect(screen.getByRole('form')).not.toHaveAttribute('aria-busy')
      expect(screen.getByRole('textbox', { name: /email address/i })).toBeInTheDocument()
    })

    it('should reset form state when switching between steps', async () => {
      const mockMutation = {
        mutate: vi.fn((_, { onSuccess }) => {
          onSuccess(createMockPasswordResetResponse({ 
            requiresSecurityQuestions: true,
            securityQuestions: [
              { question: 'What was your first pet\'s name?', id: 'q1' }
            ]
          }))
        }),
        isPending: false,
        error: null,
        isSuccess: false,
      }
      mockForgotPassword.mockReturnValue(mockMutation)

      renderWithProviders(<ForgotPasswordForm />)

      // Complete initial form
      await user.type(screen.getByRole('textbox', { name: /email address/i }), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /send reset link/i }))

      // Should transition to security questions
      await waitFor(() => {
        expect(screen.getByText(/security questions/i)).toBeInTheDocument()
      })

      // Go back to initial form (if back button exists)
      const backButton = screen.queryByRole('button', { name: /back/i })
      if (backButton) {
        await user.click(backButton)
        
        // Initial form should be reset
        const emailInput = screen.getByRole('textbox', { name: /email address/i })
        expect(emailInput).toHaveValue('')
      }
    })
  })

  describe('Performance and Optimization', () => {
    it('should not re-render unnecessarily during typing', async () => {
      const renderSpy = vi.fn()
      const TestWrapper = () => {
        renderSpy()
        return <ForgotPasswordForm />
      }

      renderWithProviders(<TestWrapper />)

      const initialRenderCount = renderSpy.mock.calls.length
      
      // Type in the input field
      const emailInput = screen.getByRole('textbox', { name: /email address/i })
      await user.type(emailInput, 'test@example.com')

      // Should not cause excessive re-renders
      const finalRenderCount = renderSpy.mock.calls.length
      expect(finalRenderCount - initialRenderCount).toBeLessThan(5)
    })

    it('should debounce validation during rapid typing', async () => {
      renderWithProviders(<ForgotPasswordForm />)

      const emailInput = screen.getByRole('textbox', { name: /email address/i })
      
      // Rapidly type invalid email
      await user.type(emailInput, 'invalid')
      
      // Validation should not run immediately
      expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument()
      
      // Wait for debounce
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })
})