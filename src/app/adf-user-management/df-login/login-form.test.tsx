/**
 * Login Form Component Test Suite
 * 
 * Comprehensive Vitest unit tests for React login form component providing full test coverage
 * for email and username login flows, form validation, error handling, and authentication scenarios.
 * 
 * Replaces Angular Jasmine/Jest testing infrastructure with Vitest + MSW integration, testing
 * React Hook Form validation, Zod schema enforcement, and Next.js authentication workflows.
 * 
 * Key Features:
 * - Vitest 2.1+ testing framework for 10x faster test execution
 * - Mock Service Worker 0.49+ for browser & Node API mocking with realistic mocks
 * - React Testing Library integration for component testing best practices
 * - Comprehensive validation testing for Zod schema validators integrated with React Hook Form
 * - React Query integration testing for authentication state management and caching
 * - Next.js router navigation testing and authentication flow validation
 * - Tailwind CSS theme integration and responsive behavior pattern testing
 * - React Error Boundary testing for error handling scenarios per Section 4.2.1.1
 * 
 * Test Coverage Requirements:
 * - Form validation and submission workflows
 * - Email and username authentication flows
 * - Error handling for authentication failures (401, 403)
 * - Session management and token validation
 * - LDAP and OAuth service provider selection
 * - Real-time validation under 100ms requirement compliance
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Responsive design and theme integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextRouter } from 'next/router';
import { z } from 'zod';

// Component and type imports
import { LoginForm } from './login-form';
import { 
  LoginCredentials, 
  LoginCredentialsSchema,
  ValidationConfig,
  AuthFormState,
  AuthAlert,
  OAuthProvider,
  LDAPService
} from '../types';
import { createLoginSchema, defaultValidationConfig } from '../validation';

// Test utilities and mock data
import { createMockSession, createMockUser, createMockAuthResponse } from '@/test/mocks/mock-data';
import { createErrorResponse } from '@/test/mocks/error-responses';

// ============================================================================
// Test Setup and Configuration
// ============================================================================

// Mock Next.js router for navigation testing
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRouter: Partial<NextRouter> = {
  push: mockPush,
  replace: mockReplace,
  pathname: '/login',
  query: {},
  asPath: '/login',
  route: '/login',
};

vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

// Mock React Query hooks for authentication
const mockLoginMutation = vi.fn();
const mockAuthQuery = vi.fn();

vi.mock('@/hooks/use-auth', () => ({
  useLogin: () => ({
    mutate: mockLoginMutation,
    isPending: false,
    error: null,
  }),
  useAuth: () => mockAuthQuery(),
}));

// Mock Next.js theme provider for theme integration testing
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    resolvedTheme: 'light',
  }),
}));

// MSW server setup for API mocking
const server = setupServer(
  // Successful login endpoint
  http.post('/api/v2/user/session', async ({ request }) => {
    const body = await request.json() as LoginCredentials;
    
    // Validate required fields
    if (!body.password) {
      return HttpResponse.json(
        createErrorResponse(400, 'Password is required'),
        { status: 400 }
      );
    }
    
    if (!body.email && !body.username) {
      return HttpResponse.json(
        createErrorResponse(400, 'Email or username is required'),
        { status: 400 }
      );
    }
    
    // Mock authentication failure scenarios
    if (body.password === 'wrong-password') {
      return HttpResponse.json(
        createErrorResponse(401, 'Invalid credentials'),
        { status: 401 }
      );
    }
    
    if (body.email === 'locked@example.com') {
      return HttpResponse.json(
        createErrorResponse(403, 'Account is locked'),
        { status: 403 }
      );
    }
    
    // Return successful authentication response
    return HttpResponse.json(createMockAuthResponse({
      email: body.email || '',
      username: body.username || '',
    }));
  }),

  // Admin login endpoint
  http.post('/api/v2/system/admin/session', async ({ request }) => {
    const body = await request.json() as LoginCredentials;
    
    if (body.email === 'admin@example.com' && body.password === 'admin-password') {
      return HttpResponse.json(createMockAuthResponse({
        email: body.email,
        isAdmin: true,
      }));
    }
    
    return HttpResponse.json(
      createErrorResponse(401, 'Invalid admin credentials'),
      { status: 401 }
    );
  }),

  // System configuration endpoint for validation config
  http.get('/api/v2/system/environment', () => {
    return HttpResponse.json({
      authentication: {
        login_attribute: 'email',
        allow_forever_sessions: true,
      },
      external_authentication: {
        oauth: [
          {
            name: 'google',
            label: 'Google',
            type: 'oauth',
            iconClass: 'fab fa-google',
            path: '/auth/oauth/google',
          },
        ],
        ldap: [
          {
            name: 'company-ldap',
            label: 'Company LDAP',
            type: 'ldap',
            host: 'ldap.company.com',
            port: 389,
          },
        ],
      },
    });
  }),

  // Session validation endpoint
  http.get('/api/v2/user/session', () => {
    return HttpResponse.json(createMockSession());
  }),
);

// Test environment setup
beforeEach(() => {
  server.listen({ onUnhandledRequest: 'error' });
  vi.clearAllMocks();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Enhanced render function with all necessary providers
 * Provides React Query, theme, and authentication context for comprehensive testing
 */
function renderWithProviders(
  component: React.ReactElement,
  options: {
    queryClient?: QueryClient;
    validationConfig?: ValidationConfig;
    initialAuthState?: Partial<AuthFormState>;
  } = {}
) {
  const queryClient = options.queryClient || new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const validationConfig = options.validationConfig || defaultValidationConfig;

  return render(
    <QueryClientProvider client={queryClient}>
      {React.cloneElement(component, { 
        validationConfig,
        ...options.initialAuthState,
      })}
    </QueryClientProvider>
  );
}

/**
 * Utility to wait for form validation with performance timing
 * Ensures validation occurs under 100ms requirement
 */
async function waitForValidation(fieldElement: HTMLElement, timeout = 150) {
  const startTime = performance.now();
  
  await waitFor(() => {
    const errorMessage = fieldElement.getAttribute('aria-describedby');
    expect(errorMessage).toBeTruthy();
  }, { timeout });
  
  const endTime = performance.now();
  const validationTime = endTime - startTime;
  
  // Ensure validation occurs under 100ms performance requirement
  expect(validationTime).toBeLessThan(100);
}

/**
 * Mock user interaction utilities for consistent test patterns
 */
const userInteraction = {
  async fillEmail(email: string) {
    const emailField = screen.getByLabelText(/email/i);
    await userEvent.clear(emailField);
    await userEvent.type(emailField, email);
    return emailField;
  },

  async fillUsername(username: string) {
    const usernameField = screen.getByLabelText(/username/i);
    await userEvent.clear(usernameField);
    await userEvent.type(usernameField, username);
    return usernameField;
  },

  async fillPassword(password: string) {
    const passwordField = screen.getByLabelText(/password/i);
    await userEvent.clear(passwordField);
    await userEvent.type(passwordField, password);
    return passwordField;
  },

  async toggleRememberMe() {
    const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
    await userEvent.click(rememberMeCheckbox);
    return rememberMeCheckbox;
  },

  async selectService(serviceName: string) {
    const serviceSelect = screen.getByLabelText(/service/i);
    await userEvent.selectOptions(serviceSelect, serviceName);
    return serviceSelect;
  },

  async submitForm() {
    const submitButton = screen.getByRole('button', { name: /sign in|login/i });
    await userEvent.click(submitButton);
    return submitButton;
  },
};

// ============================================================================
// Form Validation Tests
// ============================================================================

describe('LoginForm - Form Validation', () => {
  describe('Email Authentication Mode', () => {
    const emailConfig: ValidationConfig = {
      loginAttribute: 'email',
      hasLdapServices: false,
      hasOauthServices: false,
      hasSamlServices: false,
    };

    it('should validate required email field with real-time feedback', async () => {
      renderWithProviders(<LoginForm />, { validationConfig: emailConfig });
      
      const emailField = await userInteraction.fillEmail('invalid-email');
      
      // Trigger validation by blurring field
      fireEvent.blur(emailField);
      
      await waitForValidation(emailField);
      
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    it('should validate email format with Zod schema enforcement', async () => {
      renderWithProviders(<LoginForm />, { validationConfig: emailConfig });
      
      const emailField = await userInteraction.fillEmail('test@invalid');
      fireEvent.blur(emailField);
      
      await waitForValidation(emailField);
      
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    it('should accept valid email address and clear errors', async () => {
      renderWithProviders(<LoginForm />, { validationConfig: emailConfig });
      
      // First enter invalid email
      const emailField = await userInteraction.fillEmail('invalid');
      fireEvent.blur(emailField);
      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
      
      // Then enter valid email
      await userEvent.clear(emailField);
      await userEvent.type(emailField, 'valid@example.com');
      fireEvent.blur(emailField);
      
      await waitFor(() => {
        expect(screen.queryByText(/invalid email format/i)).not.toBeInTheDocument();
      });
    });

    it('should validate password requirements with detailed feedback', async () => {
      renderWithProviders(<LoginForm />, { validationConfig: emailConfig });
      
      const passwordField = await userInteraction.fillPassword('short');
      fireEvent.blur(passwordField);
      
      await waitForValidation(passwordField);
      
      expect(screen.getByText(/password must be at least 16 characters/i)).toBeInTheDocument();
    });

    it('should enforce password complexity requirements', async () => {
      renderWithProviders(<LoginForm />, { validationConfig: emailConfig });
      
      const passwordField = await userInteraction.fillPassword('simplepwd123456');
      fireEvent.blur(passwordField);
      
      await waitForValidation(passwordField);
      
      // Should require uppercase, lowercase, and number
      expect(screen.getByText(/password must contain uppercase, lowercase, and number/i)).toBeInTheDocument();
    });
  });

  describe('Username Authentication Mode', () => {
    const usernameConfig: ValidationConfig = {
      loginAttribute: 'username',
      hasLdapServices: false,
      hasOauthServices: false,
      hasSamlServices: false,
    };

    it('should validate required username field', async () => {
      renderWithProviders(<LoginForm />, { validationConfig: usernameConfig });
      
      const usernameField = screen.getByLabelText(/username/i);
      fireEvent.blur(usernameField);
      
      await waitForValidation(usernameField);
      
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    });

    it('should accept valid username and hide email field', async () => {
      renderWithProviders(<LoginForm />, { validationConfig: usernameConfig });
      
      const usernameField = await userInteraction.fillUsername('validuser');
      
      expect(usernameField).toBeInTheDocument();
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    });
  });

  describe('Dynamic Validation Configuration', () => {
    it('should adapt validation based on service selection', async () => {
      const configWithServices: ValidationConfig = {
        loginAttribute: 'email',
        hasLdapServices: true,
        hasOauthServices: true,
        hasSamlServices: false,
      };

      renderWithProviders(<LoginForm />, { validationConfig: configWithServices });
      
      // When LDAP service is selected, should require username instead of email
      await userInteraction.selectService('company-ldap');
      
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    });

    it('should validate service-specific fields when external auth is selected', async () => {
      const configWithServices: ValidationConfig = {
        loginAttribute: 'email',
        hasLdapServices: true,
        hasOauthServices: false,
        hasSamlServices: false,
      };

      renderWithProviders(<LoginForm />, { validationConfig: configWithServices });
      
      await userInteraction.selectService('company-ldap');
      
      // Should require username when LDAP is selected
      const usernameField = screen.getByLabelText(/username/i);
      fireEvent.blur(usernameField);
      
      await waitForValidation(usernameField);
      
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Authentication Flow Tests
// ============================================================================

describe('LoginForm - Authentication Flows', () => {
  describe('Email Login Flow', () => {
    it('should submit valid email credentials successfully', async () => {
      renderWithProviders(<LoginForm />);
      
      await userInteraction.fillEmail('test@example.com');
      await userInteraction.fillPassword('ValidPassword123');
      await userInteraction.submitForm();
      
      await waitFor(() => {
        expect(mockLoginMutation).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'ValidPassword123',
          rememberMe: false,
          loginAttribute: 'email',
        });
      });
    });

    it('should handle remember me option correctly', async () => {
      renderWithProviders(<LoginForm />);
      
      await userInteraction.fillEmail('test@example.com');
      await userInteraction.fillPassword('ValidPassword123');
      await userInteraction.toggleRememberMe();
      await userInteraction.submitForm();
      
      await waitFor(() => {
        expect(mockLoginMutation).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'ValidPassword123',
          rememberMe: true,
          loginAttribute: 'email',
        });
      });
    });

    it('should navigate to dashboard on successful authentication', async () => {
      mockLoginMutation.mockResolvedValueOnce({
        sessionToken: 'valid-token',
        user: createMockUser(),
      });

      renderWithProviders(<LoginForm />);
      
      await userInteraction.fillEmail('test@example.com');
      await userInteraction.fillPassword('ValidPassword123');
      await userInteraction.submitForm();
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Username Login Flow', () => {
    const usernameConfig: ValidationConfig = {
      loginAttribute: 'username',
      hasLdapServices: false,
      hasOauthServices: false,
      hasSamlServices: false,
    };

    it('should submit valid username credentials successfully', async () => {
      renderWithProviders(<LoginForm />, { validationConfig: usernameConfig });
      
      await userInteraction.fillUsername('testuser');
      await userInteraction.fillPassword('ValidPassword123');
      await userInteraction.submitForm();
      
      await waitFor(() => {
        expect(mockLoginMutation).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'ValidPassword123',
          rememberMe: false,
          loginAttribute: 'username',
        });
      });
    });
  });

  describe('External Service Authentication', () => {
    const serviceConfig: ValidationConfig = {
      loginAttribute: 'email',
      hasLdapServices: true,
      hasOauthServices: true,
      hasSamlServices: false,
    };

    it('should handle LDAP authentication flow', async () => {
      renderWithProviders(<LoginForm />, { validationConfig: serviceConfig });
      
      await userInteraction.selectService('company-ldap');
      await userInteraction.fillUsername('ldapuser');
      await userInteraction.fillPassword('LdapPassword123');
      await userInteraction.submitForm();
      
      await waitFor(() => {
        expect(mockLoginMutation).toHaveBeenCalledWith({
          username: 'ldapuser',
          password: 'LdapPassword123',
          service: 'company-ldap',
          rememberMe: false,
          loginAttribute: 'username',
        });
      });
    });

    it('should handle OAuth redirect flow', async () => {
      renderWithProviders(<LoginForm />, { validationConfig: serviceConfig });
      
      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      await userEvent.click(googleButton);
      
      // Should redirect to OAuth provider
      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.stringContaining('/auth/oauth/google')
      );
    });
  });

  describe('Admin Authentication Flow', () => {
    it('should handle admin login with different endpoint', async () => {
      renderWithProviders(<LoginForm isAdminLogin={true} />);
      
      await userInteraction.fillEmail('admin@example.com');
      await userInteraction.fillPassword('admin-password');
      await userInteraction.submitForm();
      
      await waitFor(() => {
        expect(mockLoginMutation).toHaveBeenCalledWith({
          email: 'admin@example.com',
          password: 'admin-password',
          rememberMe: false,
          loginAttribute: 'email',
          isAdmin: true,
        });
      });
    });
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('LoginForm - Error Handling', () => {
  describe('Authentication Errors', () => {
    it('should display error for invalid credentials (401)', async () => {
      renderWithProviders(<LoginForm />);
      
      await userInteraction.fillEmail('test@example.com');
      await userInteraction.fillPassword('wrong-password');
      await userInteraction.submitForm();
      
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('should display error for account locked (403)', async () => {
      renderWithProviders(<LoginForm />);
      
      await userInteraction.fillEmail('locked@example.com');
      await userInteraction.fillPassword('ValidPassword123');
      await userInteraction.submitForm();
      
      await waitFor(() => {
        expect(screen.getByText(/account is locked/i)).toBeInTheDocument();
      });
    });

    it('should clear error messages when user starts typing', async () => {
      renderWithProviders(<LoginForm />);
      
      // First trigger an error
      await userInteraction.fillEmail('test@example.com');
      await userInteraction.fillPassword('wrong-password');
      await userInteraction.submitForm();
      
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
      
      // Then start typing in email field
      const emailField = screen.getByLabelText(/email/i);
      await userEvent.type(emailField, 'x');
      
      await waitFor(() => {
        expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Network Errors', () => {
    it('should handle network failure gracefully', async () => {
      // Mock network error
      server.use(
        http.post('/api/v2/user/session', () => {
          return HttpResponse.error();
        })
      );

      renderWithProviders(<LoginForm />);
      
      await userInteraction.fillEmail('test@example.com');
      await userInteraction.fillPassword('ValidPassword123');
      await userInteraction.submitForm();
      
      await waitFor(() => {
        expect(screen.getByText(/network error.*please try again/i)).toBeInTheDocument();
      });
    });

    it('should display retry option for network failures', async () => {
      server.use(
        http.post('/api/v2/user/session', () => {
          return HttpResponse.error();
        })
      );

      renderWithProviders(<LoginForm />);
      
      await userInteraction.fillEmail('test@example.com');
      await userInteraction.fillPassword('ValidPassword123');
      await userInteraction.submitForm();
      
      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });
  });

  describe('React Error Boundary Integration', () => {
    it('should catch and display component errors', async () => {
      // Mock a component that throws an error
      const ErrorThrowingComponent = () => {
        throw new Error('Test component error');
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(
          <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <ErrorThrowingComponent />
          </ErrorBoundary>
        );
      }).not.toThrow();

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });
});

// ============================================================================
// React Query Integration Tests
// ============================================================================

describe('LoginForm - React Query Integration', () => {
  describe('Authentication State Management', () => {
    it('should cache successful authentication responses', async () => {
      const queryClient = new QueryClient();
      
      renderWithProviders(<LoginForm />, { queryClient });
      
      await userInteraction.fillEmail('test@example.com');
      await userInteraction.fillPassword('ValidPassword123');
      await userInteraction.submitForm();
      
      await waitFor(() => {
        const authData = queryClient.getQueryData(['auth', 'session']);
        expect(authData).toBeTruthy();
      });
    });

    it('should invalidate auth cache on logout', async () => {
      const queryClient = new QueryClient();
      
      renderWithProviders(<LoginForm />, { queryClient });
      
      // Set initial auth data
      queryClient.setQueryData(['auth', 'session'], createMockSession());
      
      // Trigger logout
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await userEvent.click(logoutButton);
      
      await waitFor(() => {
        const authData = queryClient.getQueryData(['auth', 'session']);
        expect(authData).toBeNull();
      });
    });

    it('should handle optimistic updates for form submission', async () => {
      const queryClient = new QueryClient();
      
      renderWithProviders(<LoginForm />, { queryClient });
      
      await userInteraction.fillEmail('test@example.com');
      await userInteraction.fillPassword('ValidPassword123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      // Should show loading state immediately
      await userEvent.click(submitButton);
      
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });
  });

  describe('Background Refresh and Sync', () => {
    it('should refresh session data in background', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { 
            staleTime: 0,
            refetchInterval: 1000,
          },
        },
      });
      
      renderWithProviders(<LoginForm />, { queryClient });
      
      // Wait for background refresh
      await waitFor(() => {
        expect(mockAuthQuery).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });
});

// ============================================================================
// Next.js Integration Tests
// ============================================================================

describe('LoginForm - Next.js Integration', () => {
  describe('Router Navigation', () => {
    it('should redirect to intended route after login', async () => {
      const routerWithRedirect = {
        ...mockRouter,
        query: { redirect: '/admin/users' },
      };
      
      vi.mocked(useRouter).mockReturnValue(routerWithRedirect as NextRouter);
      
      renderWithProviders(<LoginForm />);
      
      await userInteraction.fillEmail('test@example.com');
      await userInteraction.fillPassword('ValidPassword123');
      await userInteraction.submitForm();
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/admin/users');
      });
    });

    it('should handle middleware authentication flow', async () => {
      renderWithProviders(<LoginForm />);
      
      // Simulate middleware redirect after successful auth
      await userInteraction.fillEmail('test@example.com');
      await userInteraction.fillPassword('ValidPassword123');
      await userInteraction.submitForm();
      
      await waitFor(() => {
        // Should trigger middleware by navigating
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });
  });

  describe('Server-Side Rendering Support', () => {
    it('should handle hydration without errors', () => {
      // Simulate SSR by rendering without browser APIs
      const originalWindow = global.window;
      delete (global as any).window;
      
      expect(() => {
        renderWithProviders(<LoginForm />);
      }).not.toThrow();
      
      global.window = originalWindow;
    });
  });
});

// ============================================================================
// UI and Accessibility Tests
// ============================================================================

describe('LoginForm - UI and Accessibility', () => {
  describe('Tailwind CSS Integration', () => {
    it('should apply correct theme classes', () => {
      renderWithProviders(<LoginForm />);
      
      const form = screen.getByRole('form');
      expect(form).toHaveClass('bg-white', 'dark:bg-gray-900');
    });

    it('should respond to theme changes', async () => {
      const mockSetTheme = vi.fn();
      vi.mocked(useTheme).mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        resolvedTheme: 'dark',
      });
      
      renderWithProviders(<LoginForm />);
      
      const form = screen.getByRole('form');
      expect(form).toHaveClass('dark:bg-gray-900');
    });

    it('should maintain responsive design on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      renderWithProviders(<LoginForm />);
      
      const container = screen.getByTestId('login-container');
      expect(container).toHaveClass('sm:max-w-md', 'w-full');
    });
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('should have proper form labels and ARIA attributes', () => {
      renderWithProviders(<LoginForm />);
      
      const emailField = screen.getByLabelText(/email/i);
      const passwordField = screen.getByLabelText(/password/i);
      
      expect(emailField).toHaveAttribute('aria-required', 'true');
      expect(passwordField).toHaveAttribute('aria-required', 'true');
    });

    it('should announce form errors to screen readers', async () => {
      renderWithProviders(<LoginForm />);
      
      await userInteraction.fillEmail('invalid-email');
      fireEvent.blur(screen.getByLabelText(/email/i));
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/invalid email format/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<LoginForm />);
      
      const emailField = screen.getByLabelText(/email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      // Tab through form elements
      emailField.focus();
      await userEvent.tab();
      expect(passwordField).toHaveFocus();
      
      await userEvent.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should maintain focus management for modals and dropdowns', async () => {
      renderWithProviders(<LoginForm />);
      
      // Open service selection dropdown
      const serviceButton = screen.getByRole('button', { name: /select service/i });
      await userEvent.click(serviceButton);
      
      // Focus should be trapped within dropdown
      const dropdown = screen.getByRole('listbox');
      expect(dropdown).toBeInTheDocument();
      
      // Close with Escape
      await userEvent.keyboard('{Escape}');
      expect(serviceButton).toHaveFocus();
    });
  });

  describe('Visual Design and Layout', () => {
    it('should display company branding and logo', () => {
      renderWithProviders(<LoginForm />);
      
      const logo = screen.getByAltText(/dreamfactory logo/i);
      expect(logo).toBeInTheDocument();
    });

    it('should show loading states with appropriate feedback', async () => {
      renderWithProviders(<LoginForm />);
      
      await userInteraction.fillEmail('test@example.com');
      await userInteraction.fillPassword('ValidPassword123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);
      
      // Should show loading spinner and text
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should display form validation feedback visually', async () => {
      renderWithProviders(<LoginForm />);
      
      const emailField = await userInteraction.fillEmail('invalid-email');
      fireEvent.blur(emailField);
      
      await waitFor(() => {
        // Field should have error styling
        expect(emailField).toHaveClass('border-red-500', 'focus:ring-red-500');
        
        // Error message should be styled appropriately
        const errorMessage = screen.getByText(/invalid email format/i);
        expect(errorMessage).toHaveClass('text-red-600', 'text-sm');
      });
    });
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('LoginForm - Performance', () => {
  describe('Real-time Validation Performance', () => {
    it('should validate fields under 100ms requirement', async () => {
      renderWithProviders(<LoginForm />);
      
      const emailField = screen.getByLabelText(/email/i);
      
      const startTime = performance.now();
      
      await userEvent.type(emailField, 'test@example.com');
      fireEvent.blur(emailField);
      
      await waitFor(() => {
        const isValid = !screen.queryByText(/invalid email format/i);
        expect(isValid).toBe(true);
      });
      
      const endTime = performance.now();
      const validationTime = endTime - startTime;
      
      expect(validationTime).toBeLessThan(100);
    });

    it('should handle rapid typing without performance degradation', async () => {
      renderWithProviders(<LoginForm />);
      
      const emailField = screen.getByLabelText(/email/i);
      
      const startTime = performance.now();
      
      // Simulate rapid typing
      const rapidText = 'test@example.com';
      for (const char of rapidText) {
        await userEvent.type(emailField, char, { delay: 1 });
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(500);
    });
  });

  describe('Component Rendering Performance', () => {
    it('should render form under performance budget', () => {
      const startTime = performance.now();
      
      renderWithProviders(<LoginForm />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render quickly for good UX
      expect(renderTime).toBeLessThan(50);
    });

    it('should handle dynamic configuration changes efficiently', async () => {
      const { rerender } = renderWithProviders(<LoginForm />);
      
      const startTime = performance.now();
      
      // Change configuration multiple times
      const configs = [
        { loginAttribute: 'email' as const, hasLdapServices: false, hasOauthServices: false, hasSamlServices: false },
        { loginAttribute: 'username' as const, hasLdapServices: true, hasOauthServices: false, hasSamlServices: false },
        { loginAttribute: 'email' as const, hasLdapServices: true, hasOauthServices: true, hasSamlServices: false },
      ];
      
      for (const config of configs) {
        rerender(
          <QueryClientProvider client={new QueryClient()}>
            <LoginForm validationConfig={config} />
          </QueryClientProvider>
        );
      }
      
      const endTime = performance.now();
      const configChangeTime = endTime - startTime;
      
      expect(configChangeTime).toBeLessThan(100);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('LoginForm - Integration', () => {
  describe('Form State Persistence', () => {
    it('should persist form data in session storage', async () => {
      renderWithProviders(<LoginForm />);
      
      await userInteraction.fillEmail('test@example.com');
      await userInteraction.toggleRememberMe();
      
      // Simulate page refresh
      const { rerender } = renderWithProviders(<LoginForm />);
      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <LoginForm />
        </QueryClientProvider>
      );
      
      // Form should restore previous values
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeChecked();
    });
  });

  describe('Multi-step Authentication Flow', () => {
    it('should handle two-factor authentication continuation', async () => {
      // Mock 2FA required response
      server.use(
        http.post('/api/v2/user/session', () => {
          return HttpResponse.json({
            requires_2fa: true,
            session_id: 'temp-session-123',
          }, { status: 202 });
        })
      );

      renderWithProviders(<LoginForm />);
      
      await userInteraction.fillEmail('test@example.com');
      await userInteraction.fillPassword('ValidPassword123');
      await userInteraction.submitForm();
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/2fa?session=temp-session-123');
      });
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should provide password reset option for authentication failures', async () => {
      renderWithProviders(<LoginForm />);
      
      await userInteraction.fillEmail('test@example.com');
      await userInteraction.fillPassword('wrong-password');
      await userInteraction.submitForm();
      
      await waitFor(() => {
        const forgotPasswordLink = screen.getByRole('link', { name: /forgot password/i });
        expect(forgotPasswordLink).toBeInTheDocument();
        expect(forgotPasswordLink).toHaveAttribute('href', '/auth/forgot-password');
      });
    });

    it('should handle account lockout with recovery information', async () => {
      renderWithProviders(<LoginForm />);
      
      await userInteraction.fillEmail('locked@example.com');
      await userInteraction.fillPassword('ValidPassword123');
      await userInteraction.submitForm();
      
      await waitFor(() => {
        expect(screen.getByText(/account is locked/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /contact administrator/i })).toBeInTheDocument();
      });
    });
  });
});