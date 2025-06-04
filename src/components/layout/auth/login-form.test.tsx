/**
 * @fileoverview Comprehensive Vitest test suite for the LoginForm component
 * 
 * This test suite validates the React-based login form implementation that replaces
 * the Angular df-login component. Tests cover form validation, authentication flows,
 * LDAP service selection, OAuth/SAML integration, and comprehensive error handling.
 * 
 * Testing Framework: Vitest 2.1.0 (10x faster than Jest/Karma)
 * Component Testing: React Testing Library with user-centric patterns
 * API Mocking: Mock Service Worker for realistic authentication testing
 * Accessibility: jest-axe for WCAG 2.1 AA compliance validation
 * 
 * @author DreamFactory Admin Interface Team
 * @version 1.0.0
 * @since React/Next.js Migration v2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

import { LoginForm } from './login-form'
import { renderWithProviders } from '@/test/utils/test-utils'
import { server } from '@/test/mocks/server'
import { rest } from 'msw'

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations)

// Mock Next.js router for navigation testing
const mockPush = vi.fn()
const mockReplace = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/login',
}))

// Mock authentication hooks
const mockLogin = vi.fn()
const mockIsLoading = vi.fn()
const mockError = vi.fn()

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: mockIsLoading(),
    error: mockError(),
    user: null,
    isAuthenticated: false,
  }),
}))

// Mock system configuration hook
const mockSystemConfig = {
  authentication: {
    login_attribute: 'email',
    allow_registration: true,
    always_on: false,
  },
  ldap: {
    services: [],
  },
  oauth: {
    providers: [],
  },
  saml: {
    providers: [],
  },
}

vi.mock('@/hooks/use-system-config', () => ({
  useSystemConfig: () => ({
    data: mockSystemConfig,
    isLoading: false,
    error: null,
  }),
}))

describe('LoginForm Component', () => {
  let queryClient: QueryClient
  let user: ReturnType<typeof userEvent.setup>

  beforeAll(() => {
    // Start MSW server
    server.listen({ onUnhandledRequest: 'error' })
  })

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    mockIsLoading.mockReturnValue(false)
    mockError.mockReturnValue(null)
    
    // Setup user event with realistic timing
    user = userEvent.setup({ delay: null })
    
    // Create fresh query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
        },
      },
    })
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  describe('Component Rendering', () => {
    it('renders the login form with all required elements', () => {
      renderWithProviders(<LoginForm />)

      // Verify form structure
      expect(screen.getByRole('form', { name: /login/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      
      // Verify navigation links
      expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument()
    })

    it('renders username field when system config uses username authentication', () => {
      mockSystemConfig.authentication.login_attribute = 'username'
      
      renderWithProviders(<LoginForm />)

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
    })

    it('hides registration link when registration is disabled', () => {
      mockSystemConfig.authentication.allow_registration = false
      
      renderWithProviders(<LoginForm />)

      expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument()
    })

    it('displays LDAP service selection when multiple LDAP services are configured', () => {
      mockSystemConfig.ldap.services = [
        { name: 'corporate-ldap', label: 'Corporate LDAP' },
        { name: 'partner-ldap', label: 'Partner LDAP' },
      ]
      
      renderWithProviders(<LoginForm />)

      expect(screen.getByLabelText(/ldap service/i)).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /corporate ldap/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /partner ldap/i })).toBeInTheDocument()
    })

    it('renders OAuth providers when configured', () => {
      mockSystemConfig.oauth.providers = [
        { name: 'google', label: 'Google', icon: 'google' },
        { name: 'microsoft', label: 'Microsoft', icon: 'microsoft' },
      ]
      
      renderWithProviders(<LoginForm />)

      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in with microsoft/i })).toBeInTheDocument()
    })

    it('renders SAML providers when configured', () => {
      mockSystemConfig.saml.providers = [
        { name: 'okta', label: 'Okta SSO' },
        { name: 'azure', label: 'Azure AD' },
      ]
      
      renderWithProviders(<LoginForm />)

      expect(screen.getByRole('button', { name: /okta sso/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /azure ad/i })).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('validates email format in email mode', async () => {
      mockSystemConfig.authentication.login_attribute = 'email'
      
      renderWithProviders(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Test invalid email format
      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })

      // Test valid email format
      await user.clear(emailInput)
      await user.type(emailInput, 'user@example.com')
      
      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument()
      })
    })

    it('validates username format in username mode', async () => {
      mockSystemConfig.authentication.login_attribute = 'username'
      
      renderWithProviders(<LoginForm />)

      const usernameInput = screen.getByLabelText(/username/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Test empty username
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument()
      })

      // Test valid username
      await user.type(usernameInput, 'validuser123')
      
      await waitFor(() => {
        expect(screen.queryByText(/username is required/i)).not.toBeInTheDocument()
      })
    })

    it('validates password minimum length (16 characters)', async () => {
      renderWithProviders(<LoginForm />)

      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Test password too short
      await user.type(passwordInput, 'short')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 16 characters/i)).toBeInTheDocument()
      })

      // Test valid password length
      await user.clear(passwordInput)
      await user.type(passwordInput, 'verylongpassword1234')
      
      await waitFor(() => {
        expect(screen.queryByText(/password must be at least 16 characters/i)).not.toBeInTheDocument()
      })
    })

    it('validates required fields before submission', async () => {
      renderWithProviders(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Attempt to submit empty form
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })

      // Verify form was not submitted
      expect(mockLogin).not.toHaveBeenCalled()
    })

    it('validates LDAP service selection when required', async () => {
      mockSystemConfig.ldap.services = [
        { name: 'corporate-ldap', label: 'Corporate LDAP' },
        { name: 'partner-ldap', label: 'Partner LDAP' },
      ]
      
      renderWithProviders(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Fill form but don't select LDAP service
      await user.type(emailInput, 'user@example.com')
      await user.type(passwordInput, 'verylongpassword1234')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/please select an ldap service/i)).toBeInTheDocument()
      })

      // Select LDAP service
      const ldapSelect = screen.getByLabelText(/ldap service/i)
      await user.selectOptions(ldapSelect, 'corporate-ldap')
      
      await waitFor(() => {
        expect(screen.queryByText(/please select an ldap service/i)).not.toBeInTheDocument()
      })
    })

    it('provides real-time validation feedback under 100ms', async () => {
      renderWithProviders(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      
      const startTime = performance.now()
      
      // Type invalid email
      await user.type(emailInput, 'invalid')
      
      // Trigger validation by blurring the field
      await user.tab()
      
      await waitFor(() => {
        const endTime = performance.now()
        const validationTime = endTime - startTime
        
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
        expect(validationTime).toBeLessThan(100) // Validation under 100ms requirement
      })
    })
  })

  describe('Authentication Flow', () => {
    it('submits form with valid credentials', async () => {
      mockLogin.mockResolvedValue({ success: true })
      
      renderWithProviders(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Fill and submit form
      await user.type(emailInput, 'user@example.com')
      await user.type(passwordInput, 'verylongpassword1234')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'user@example.com',
          password: 'verylongpassword1234',
          ldap_service: null,
        })
      })
    })

    it('includes LDAP service in authentication request', async () => {
      mockSystemConfig.ldap.services = [
        { name: 'corporate-ldap', label: 'Corporate LDAP' },
      ]
      mockLogin.mockResolvedValue({ success: true })
      
      renderWithProviders(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const ldapSelect = screen.getByLabelText(/ldap service/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Fill form with LDAP selection
      await user.type(emailInput, 'user@example.com')
      await user.type(passwordInput, 'verylongpassword1234')
      await user.selectOptions(ldapSelect, 'corporate-ldap')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'user@example.com',
          password: 'verylongpassword1234',
          ldap_service: 'corporate-ldap',
        })
      })
    })

    it('shows loading state during authentication', async () => {
      mockIsLoading.mockReturnValue(true)
      
      renderWithProviders(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: /signing in/i })
      
      expect(submitButton).toBeDisabled()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('redirects to dashboard on successful authentication', async () => {
      mockLogin.mockResolvedValue({ success: true })
      
      renderWithProviders(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'user@example.com')
      await user.type(passwordInput, 'verylongpassword1234')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('handles authentication errors gracefully', async () => {
      const authError = { message: 'Invalid credentials', code: 401 }
      mockError.mockReturnValue(authError)
      
      renderWithProviders(<LoginForm />)

      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
      expect(screen.getByText(/please check your credentials/i)).toBeInTheDocument()
    })

    it('handles network errors during authentication', async () => {
      mockLogin.mockRejectedValue(new Error('Network error'))
      
      renderWithProviders(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'user@example.com')
      await user.type(passwordInput, 'verylongpassword1234')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/connection error/i)
      })
    })

    it('clears form errors when user starts typing', async () => {
      const authError = { message: 'Invalid credentials', code: 401 }
      mockError.mockReturnValue(authError)
      
      renderWithProviders(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      
      // Verify error is shown
      expect(screen.getByRole('alert')).toBeInTheDocument()
      
      // Start typing to clear error
      await user.type(emailInput, 'a')
      
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  describe('OAuth/SAML Authentication', () => {
    it('initiates OAuth authentication flow', async () => {
      mockSystemConfig.oauth.providers = [
        { name: 'google', label: 'Google', icon: 'google' },
      ]
      
      // Mock window.location.href assignment
      delete (window as any).location
      window.location = { href: '' } as any
      
      renderWithProviders(<LoginForm />)

      const googleButton = screen.getByRole('button', { name: /sign in with google/i })
      await user.click(googleButton)

      expect(window.location.href).toBe('/api/auth/oauth/google')
    })

    it('initiates SAML authentication flow', async () => {
      mockSystemConfig.saml.providers = [
        { name: 'okta', label: 'Okta SSO' },
      ]
      
      // Mock window.location.href assignment
      delete (window as any).location
      window.location = { href: '' } as any
      
      renderWithProviders(<LoginForm />)

      const oktaButton = screen.getByRole('button', { name: /okta sso/i })
      await user.click(oktaButton)

      expect(window.location.href).toBe('/api/auth/saml/okta')
    })

    it('renders OAuth provider icons correctly', () => {
      mockSystemConfig.oauth.providers = [
        { name: 'google', label: 'Google', icon: 'google' },
        { name: 'github', label: 'GitHub', icon: 'github' },
      ]
      
      renderWithProviders(<LoginForm />)

      const googleIcon = screen.getByTestId('google-icon')
      const githubIcon = screen.getByTestId('github-icon')
      
      expect(googleIcon).toBeInTheDocument()
      expect(githubIcon).toBeInTheDocument()
    })

    it('groups external authentication providers properly', () => {
      mockSystemConfig.oauth.providers = [
        { name: 'google', label: 'Google', icon: 'google' },
      ]
      mockSystemConfig.saml.providers = [
        { name: 'okta', label: 'Okta SSO' },
      ]
      
      renderWithProviders(<LoginForm />)

      const externalAuthSection = screen.getByLabelText(/external authentication/i)
      const googleButton = within(externalAuthSection).getByRole('button', { name: /google/i })
      const oktaButton = within(externalAuthSection).getByRole('button', { name: /okta/i })
      
      expect(googleButton).toBeInTheDocument()
      expect(oktaButton).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('meets WCAG 2.1 AA accessibility standards', async () => {
      const { container } = renderWithProviders(<LoginForm />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('provides proper form labels and associations', () => {
      renderWithProviders(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      
      expect(emailInput).toHaveAttribute('aria-describedby')
      expect(passwordInput).toHaveAttribute('aria-describedby')
      expect(emailInput).toHaveAttribute('aria-invalid', 'false')
      expect(passwordInput).toHaveAttribute('aria-invalid', 'false')
    })

    it('announces validation errors to screen readers', async () => {
      renderWithProviders(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)

      await waitFor(() => {
        const errorMessage = screen.getByText(/please enter a valid email address/i)
        expect(errorMessage).toHaveAttribute('role', 'alert')
        expect(errorMessage).toHaveAttribute('aria-live', 'polite')
      })
    })

    it('supports keyboard navigation', async () => {
      renderWithProviders(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Navigate through form with Tab key
      emailInput.focus()
      expect(document.activeElement).toBe(emailInput)
      
      await user.tab()
      expect(document.activeElement).toBe(passwordInput)
      
      await user.tab()
      expect(document.activeElement).toBe(submitButton)
    })

    it('provides focus indicators with proper contrast', () => {
      renderWithProviders(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      emailInput.focus()
      
      // Verify focus ring is applied
      expect(emailInput).toHaveClass('focus:ring-2', 'focus:ring-blue-500')
    })

    it('maintains focus management for error states', async () => {
      renderWithProviders(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.click(submitButton)

      await waitFor(() => {
        // Focus should remain on or move to first invalid field
        expect(document.activeElement).toBe(emailInput)
      })
    })

    it('provides appropriate ARIA roles and properties', () => {
      renderWithProviders(<LoginForm />)

      const form = screen.getByRole('form')
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      
      expect(form).toHaveAttribute('aria-label', 'Login')
      expect(emailInput).toHaveAttribute('aria-required', 'true')
      expect(passwordInput).toHaveAttribute('aria-required', 'true')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('Integration Testing', () => {
    it('integrates properly with authentication context', async () => {
      mockLogin.mockResolvedValue({ success: true })
      
      renderWithProviders(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'user@example.com')
      await user.type(passwordInput, 'verylongpassword1234')
      await user.click(submitButton)

      // Verify authentication hook was called with correct parameters
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'verylongpassword1234',
        ldap_service: null,
      })
    })

    it('integrates with system configuration for dynamic behavior', () => {
      mockSystemConfig.authentication.login_attribute = 'username'
      mockSystemConfig.authentication.allow_registration = false
      
      renderWithProviders(<LoginForm />)

      // Verify form adapts to configuration
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument()
    })

    it('handles MSW mocked authentication responses correctly', async () => {
      // Setup MSW handler for successful login
      server.use(
        rest.post('/api/v2/user/session', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              session_token: 'mock-jwt-token',
              user: {
                id: 1,
                email: 'user@example.com',
                name: 'Test User',
              },
            })
          )
        })
      )

      renderWithProviders(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'user@example.com')
      await user.type(passwordInput, 'verylongpassword1234')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('handles MSW mocked authentication errors correctly', async () => {
      // Setup MSW handler for authentication failure
      server.use(
        rest.post('/api/v2/user/session', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              error: {
                message: 'Invalid credentials',
                code: 401,
              },
            })
          )
        })
      )

      renderWithProviders(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'user@example.com')
      await user.type(passwordInput, 'wrongpassword123456')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/invalid credentials/i)
      })
    })
  })

  describe('Performance Requirements', () => {
    it('renders within performance targets', async () => {
      const startTime = performance.now()
      
      renderWithProviders(<LoginForm />)
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Component should render quickly
      expect(renderTime).toBeLessThan(100)
    })

    it('maintains responsive form validation performance', async () => {
      renderWithProviders(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      
      const validationPromises = []
      
      // Test multiple rapid validation cycles
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now()
        
        await user.clear(emailInput)
        await user.type(emailInput, `test${i}`)
        await user.tab()
        
        const validationPromise = waitFor(() => {
          const endTime = performance.now()
          const validationTime = endTime - startTime
          expect(validationTime).toBeLessThan(100)
        })
        
        validationPromises.push(validationPromise)
      }
      
      await Promise.all(validationPromises)
    })
  })

  describe('Theme Integration', () => {
    it('adapts styling for dark theme', () => {
      // Mock dark theme context
      const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
        <div data-theme="dark">
          {children}
        </div>
      )
      
      renderWithProviders(<LoginForm />, { 
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      })

      const form = screen.getByRole('form')
      expect(form).toHaveClass('dark:bg-gray-900', 'dark:text-white')
    })

    it('maintains proper contrast ratios in both light and dark themes', async () => {
      const { container } = renderWithProviders(<LoginForm />)
      
      // Test light theme accessibility
      const lightResults = await axe(container)
      expect(lightResults).toHaveNoViolations()
      
      // Switch to dark theme and test again
      container.setAttribute('data-theme', 'dark')
      const darkResults = await axe(container)
      expect(darkResults).toHaveNoViolations()
    })
  })
})