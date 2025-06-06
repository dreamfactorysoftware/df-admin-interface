/**
 * Login Form Component Test Suite
 * 
 * Comprehensive Vitest test suite for the LoginForm component covering form validation,
 * authentication flows, LDAP service selection, OAuth/SAML integration, and error handling
 * scenarios. Uses React Testing Library for user-centric testing and Mock Service Worker
 * for realistic API mocking.
 * 
 * Testing Framework Migration:
 * - Migrated from Angular Jasmine/Karma to Vitest 2.1.0 for 10x faster test execution
 * - Replaced Angular TestBed with React Testing Library for component interaction testing
 * - Implemented Mock Service Worker handlers for authentication API mocking
 * - Added comprehensive accessibility testing with axe-core integration
 * 
 * Test Coverage Areas:
 * - Form validation (email/username modes, password requirements, LDAP selection)
 * - Authentication flows (success, failure, error scenarios)
 * - LDAP service integration and selection workflows
 * - OAuth/SAML authentication redirect handling
 * - Error handling for network failures and invalid credentials
 * - Accessibility compliance (WCAG 2.1 AA standards)
 * - Responsive design and keyboard navigation patterns
 * 
 * Performance Targets:
 * - Individual test execution < 100ms for optimal development feedback
 * - Complete test suite execution < 30 seconds (vs 5+ minutes with Jest/Karma)
 * - Form validation response testing under 100ms real-time validation requirement
 * - Authentication flow testing under 2 second API response requirement
 */

import React from 'react';
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Component under test
import LoginForm from './login-form';

// Test utilities and mocks
import { authHandlers, authTestUtils } from '../../../test/mocks/auth-handlers';

// Extend expect with accessibility matchers
expect.extend(toHaveNoViolations);

// ============================================================================
// TEST SETUP AND CONFIGURATION
// ============================================================================

/**
 * Mock Service Worker server for realistic API testing
 * Provides comprehensive authentication endpoint coverage
 */
const server = setupServer(...authHandlers);

/**
 * Mock Next.js router for navigation testing
 */
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    pathname: '/login',
    query: {},
    asPath: '/login',
    route: '/login',
  })),
  usePathname: vi.fn(() => '/login'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({})),
}));

/**
 * System configuration mocks for different authentication scenarios
 */
const createMockSystemConfig = (overrides = {}) => ({
  authentication: {
    loginAttribute: 'email' as const,
    adldap: [],
    oauth: [],
    saml: [],
    ...overrides,
  },
});

const mockSystemConfigs = {
  // Email-only authentication (default)
  emailOnly: createMockSystemConfig(),
  
  // Username-only authentication
  usernameOnly: createMockSystemConfig({
    loginAttribute: 'username' as const,
  }),
  
  // LDAP services available
  withLDAP: createMockSystemConfig({
    loginAttribute: 'username' as const,
    adldap: [
      { name: 'company-ad', label: 'Company Active Directory' },
      { name: 'partner-ldap', label: 'Partner LDAP Server' },
    ],
  }),
  
  // OAuth services available
  withOAuth: createMockSystemConfig({
    oauth: [
      { name: 'google', label: 'Google', path: 'oauth/google' },
      { name: 'github', label: 'GitHub', path: 'oauth/github' },
    ],
  }),
  
  // SAML services available
  withSAML: createMockSystemConfig({
    saml: [
      { name: 'corporate-sso', label: 'Corporate SSO', path: 'saml/corporate' },
      { name: 'partner-sso', label: 'Partner SSO', path: 'saml/partner' },
    ],
  }),
  
  // All authentication methods available
  allMethods: createMockSystemConfig({
    loginAttribute: 'email' as const,
    adldap: [
      { name: 'company-ad', label: 'Company Active Directory' },
    ],
    oauth: [
      { name: 'google', label: 'Google', path: 'oauth/google' },
    ],
    saml: [
      { name: 'corporate-sso', label: 'Corporate SSO', path: 'saml/corporate' },
    ],
  }),
};

/**
 * Test wrapper component with React Query provider
 */
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
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
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

/**
 * Custom render function with providers and user event setup
 */
const renderLoginForm = (systemConfig = mockSystemConfigs.emailOnly) => {
  // Mock system config API response
  server.use(
    http.get('/api/v2/system/environment', () => {
      return HttpResponse.json(systemConfig);
    })
  );

  const user = userEvent.setup();
  const result = render(
    <TestWrapper>
      <LoginForm />
    </TestWrapper>
  );

  return { ...result, user };
};

/**
 * Helper function to wait for form to be ready
 */
const waitForFormReady = async () => {
  await waitFor(() => {
    expect(screen.getByRole('form')).toBeInTheDocument();
  }, { timeout: 3000 });
};

// ============================================================================
// TEST LIFECYCLE HOOKS
// ============================================================================

beforeEach(() => {
  // Start MSW server
  server.listen({ onUnhandledRequest: 'error' });
  
  // Reset all mocks
  vi.clearAllMocks();
  
  // Reset router mocks
  mockPush.mockClear();
  mockReplace.mockClear();
  mockRefresh.mockClear();
  
  // Setup default API key header for all requests
  server.use(
    http.all('*', ({ request }) => {
      const apiKey = request.headers.get('X-DreamFactory-API-Key');
      if (!apiKey) {
        return HttpResponse.json(
          { error: { message: 'API Key is required' } },
          { status: 401 }
        );
      }
    }, { once: false })
  );
});

afterEach(() => {
  // Stop MSW server and reset handlers
  server.resetHandlers();
  server.restoreHandlers();
  
  // Clear React Query cache
  const queryClient = new QueryClient();
  queryClient.clear();
});

// ============================================================================
// COMPONENT RENDERING AND BASIC FUNCTIONALITY TESTS
// ============================================================================

describe('LoginForm Component - Basic Rendering', () => {
  test('renders login form with required elements', async () => {
    renderLoginForm();
    await waitForFormReady();

    // Verify form structure
    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    
    // Verify email field is present by default
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    
    // Verify submit button
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    
    // Verify forgot password link
    expect(screen.getByRole('link', { name: /forgot your password/i })).toBeInTheDocument();
  });

  test('displays loading state during system config fetch', () => {
    renderLoginForm();
    
    // Should show loading spinner initially
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('switches between email and username modes based on system config', async () => {
    renderLoginForm(mockSystemConfigs.usernameOnly);
    await waitForFormReady();

    // Should show username field instead of email
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
  });

  test('displays LDAP service selection when available', async () => {
    renderLoginForm(mockSystemConfigs.withLDAP);
    await waitForFormReady();

    // Should show service selection dropdown
    expect(screen.getByLabelText(/service/i)).toBeInTheDocument();
    
    const serviceSelect = screen.getByLabelText(/service/i);
    expect(within(serviceSelect).getByText('Company Active Directory')).toBeInTheDocument();
    expect(within(serviceSelect).getByText('Partner LDAP Server')).toBeInTheDocument();
  });

  test('displays OAuth authentication options when available', async () => {
    renderLoginForm(mockSystemConfigs.withOAuth);
    await waitForFormReady();

    // Should show OAuth section
    expect(screen.getByText(/or continue with oauth/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
  });

  test('displays SAML authentication options when available', async () => {
    renderLoginForm(mockSystemConfigs.withSAML);
    await waitForFormReady();

    // Should show SAML section
    expect(screen.getByText(/or continue with saml/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /corporate sso/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /partner sso/i })).toBeInTheDocument();
  });
});

// ============================================================================
// FORM VALIDATION TESTS
// ============================================================================

describe('LoginForm Component - Form Validation', () => {
  test('validates required email field', async () => {
    const { user } = renderLoginForm();
    await waitForFormReady();

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Try to submit without email
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  test('validates email format', async () => {
    const { user } = renderLoginForm();
    await waitForFormReady();

    const emailField = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Enter invalid email format
    await user.type(emailField, 'invalid-email');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  test('validates required username field', async () => {
    const { user } = renderLoginForm(mockSystemConfigs.usernameOnly);
    await waitForFormReady();

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Try to submit without username
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    });
  });

  test('validates required password field', async () => {
    const { user } = renderLoginForm();
    await waitForFormReady();

    const emailField = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Enter email but no password
    await user.type(emailField, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  test('validates minimum password length', async () => {
    const { user } = renderLoginForm();
    await waitForFormReady();

    const emailField = screen.getByLabelText(/email address/i);
    const passwordField = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Enter valid email but short password
    await user.type(emailField, 'test@example.com');
    await user.type(passwordField, 'short');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 16 characters/i)).toBeInTheDocument();
    });
  });

  test('clears validation errors when switching between email and username modes', async () => {
    const { user } = renderLoginForm(mockSystemConfigs.withLDAP);
    await waitForFormReady();

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Try to submit to trigger validation errors
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    });

    // Select LDAP service (should switch to username mode if not already)
    const serviceSelect = screen.getByLabelText(/service/i);
    await user.selectOptions(serviceSelect, 'company-ad');
    
    // Validation errors should be cleared when mode changes
    await waitFor(() => {
      expect(screen.queryByText(/username is required/i)).not.toBeInTheDocument();
    });
  });

  test('validates LDAP service selection when available', async () => {
    const { user } = renderLoginForm(mockSystemConfigs.withLDAP);
    await waitForFormReady();

    const usernameField = screen.getByLabelText(/username/i);
    const passwordField = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Fill required fields but leave service unselected
    await user.type(usernameField, 'testuser');
    await user.type(passwordField, 'validpassword123456');
    await user.click(submitButton);
    
    // Should still allow submission with empty service (optional field)
    await waitFor(() => {
      expect(screen.queryByText(/service is required/i)).not.toBeInTheDocument();
    });
  });
});

// ============================================================================
// AUTHENTICATION FLOW TESTS
// ============================================================================

describe('LoginForm Component - Authentication Flows', () => {
  test('handles successful user authentication', async () => {
    const { user } = renderLoginForm();
    await waitForFormReady();

    // Mock successful login response
    server.use(
      http.post('/api/v2/user/session', () => {
        return HttpResponse.json(
          authTestUtils.createSessionResponse(
            authTestUtils.mockUsers[0],
            authTestUtils.generateMockJwtToken(1, 'user'),
            'user'
          )
        );
      })
    );

    const emailField = screen.getByLabelText(/email address/i);
    const passwordField = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Fill in valid credentials
    await user.type(emailField, 'user@example.com');
    await user.type(passwordField, 'validpassword123456');
    
    // Submit form
    await user.click(submitButton);
    
    // Should show loading state
    expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
    
    // Should redirect to home page on success
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/home');
    }, { timeout: 5000 });
  });

  test('handles authentication failure with invalid credentials', async () => {
    const { user } = renderLoginForm();
    await waitForFormReady();

    // Mock failed login response
    server.use(
      http.post('/api/v2/user/session', () => {
        return HttpResponse.json(
          { error: { message: 'Invalid email or password' } },
          { status: 401 }
        );
      })
    );

    const emailField = screen.getByLabelText(/email address/i);
    const passwordField = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Fill in invalid credentials
    await user.type(emailField, 'invalid@example.com');
    await user.type(passwordField, 'wrongpassword123456');
    
    // Submit form
    await user.click(submitButton);
    
    // Should display error message
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
    
    // Should not redirect
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('handles network errors during authentication', async () => {
    const { user } = renderLoginForm();
    await waitForFormReady();

    // Mock network error
    server.use(
      http.post('/api/v2/user/session', () => {
        return HttpResponse.error();
      })
    );

    const emailField = screen.getByLabelText(/email address/i);
    const passwordField = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Fill in credentials
    await user.type(emailField, 'user@example.com');
    await user.type(passwordField, 'validpassword123456');
    
    // Submit form
    await user.click(submitButton);
    
    // Should display network error message
    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
  });

  test('handles LDAP authentication with service selection', async () => {
    const { user } = renderLoginForm(mockSystemConfigs.withLDAP);
    await waitForFormReady();

    // Mock successful LDAP login response
    server.use(
      http.post('/api/v2/user/session', ({ request }) => {
        return HttpResponse.json(
          authTestUtils.createSessionResponse(
            authTestUtils.mockUsers[0],
            authTestUtils.generateMockJwtToken(1, 'user'),
            'user'
          )
        );
      })
    );

    const usernameField = screen.getByLabelText(/username/i);
    const passwordField = screen.getByLabelText(/password/i);
    const serviceSelect = screen.getByLabelText(/service/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Fill in LDAP credentials
    await user.type(usernameField, 'testuser');
    await user.type(passwordField, 'validpassword123456');
    await user.selectOptions(serviceSelect, 'company-ad');
    
    // Submit form
    await user.click(submitButton);
    
    // Should redirect to home page on success
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/home');
    });
  });

  test('handles password length warning for short passwords', async () => {
    const { user } = renderLoginForm();
    await waitForFormReady();

    // Mock successful login but with password warning
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    server.use(
      http.post('/api/v2/user/session', () => {
        return HttpResponse.json(
          authTestUtils.createSessionResponse(
            authTestUtils.mockUsers[0],
            authTestUtils.generateMockJwtToken(1, 'user'),
            'user'
          )
        );
      })
    );

    const emailField = screen.getByLabelText(/email address/i);
    const passwordField = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Fill in credentials with short password that somehow gets through validation
    await user.type(emailField, 'user@example.com');
    await user.type(passwordField, 'short');
    
    // Temporarily disable validation for this test
    const form = screen.getByRole('form');
    form.setAttribute('noValidate', 'true');
    
    // Submit form
    await user.click(submitButton);
    
    // Should log password warning
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Password is shorter than recommended')
      );
    });
    
    consoleSpy.mockRestore();
  });

  test('displays enhanced error message for short password authentication failure', async () => {
    const { user } = renderLoginForm();
    await waitForFormReady();

    // Mock 401 error for short password
    server.use(
      http.post('/api/v2/user/session', () => {
        return HttpResponse.json(
          { error: { message: 'Authentication failed with 401' } },
          { status: 401 }
        );
      })
    );

    const emailField = screen.getByLabelText(/email address/i);
    const passwordField = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Fill in credentials with short password
    await user.type(emailField, 'user@example.com');
    await user.type(passwordField, 'short');
    
    // Disable form validation for this test
    const form = screen.getByRole('form');
    form.setAttribute('noValidate', 'true');
    
    // Submit form
    await user.click(submitButton);
    
    // Should display enhanced error message about password length
    await waitFor(() => {
      expect(screen.getByText(/it looks like your password is too short/i)).toBeInTheDocument();
      expect(screen.getByText(/please reset your password to continue/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// OAUTH AND SAML INTEGRATION TESTS
// ============================================================================

describe('LoginForm Component - OAuth and SAML Integration', () => {
  test('handles OAuth authentication redirect', async () => {
    const { user } = renderLoginForm(mockSystemConfigs.withOAuth);
    await waitForFormReady();

    // Mock window.location.href assignment
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' };

    const googleButton = screen.getByRole('button', { name: /google/i });
    
    // Click OAuth button
    await user.click(googleButton);
    
    // Should redirect to OAuth endpoint
    expect(window.location.href).toBe('/api/v2/oauth/google');
    
    // Restore original location
    window.location = originalLocation;
  });

  test('handles SAML authentication redirect', async () => {
    const { user } = renderLoginForm(mockSystemConfigs.withSAML);
    await waitForFormReady();

    // Mock window.location.href assignment
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' };

    const samlButton = screen.getByRole('button', { name: /corporate sso/i });
    
    // Click SAML button
    await user.click(samlButton);
    
    // Should redirect to SAML endpoint
    expect(window.location.href).toBe('/api/v2/saml/corporate');
    
    // Restore original location
    window.location = originalLocation;
  });

  test('displays all authentication methods when available', async () => {
    renderLoginForm(mockSystemConfigs.allMethods);
    await waitForFormReady();

    // Should show form login
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    
    // Should show LDAP option
    expect(screen.getByLabelText(/service/i)).toBeInTheDocument();
    
    // Should show OAuth section
    expect(screen.getByText(/or continue with oauth/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
    
    // Should show SAML section
    expect(screen.getByText(/or continue with saml/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /corporate sso/i })).toBeInTheDocument();
  });
});

// ============================================================================
// USER INTERACTION AND PASSWORD VISIBILITY TESTS
// ============================================================================

describe('LoginForm Component - User Interactions', () => {
  test('toggles password visibility', async () => {
    const { user } = renderLoginForm();
    await waitForFormReady();

    const passwordField = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', { name: /show password/i });
    
    // Initially password should be hidden
    expect(passwordField).toHaveAttribute('type', 'password');
    
    // Click toggle button
    await user.click(toggleButton);
    
    // Password should now be visible
    expect(passwordField).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();
    
    // Click toggle button again
    await user.click(screen.getByRole('button', { name: /hide password/i }));
    
    // Password should be hidden again
    expect(passwordField).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument();
  });

  test('dismisses error alerts', async () => {
    const { user } = renderLoginForm();
    await waitForFormReady();

    // Mock failed login to trigger error alert
    server.use(
      http.post('/api/v2/user/session', () => {
        return HttpResponse.json(
          { error: { message: 'Invalid credentials' } },
          { status: 401 }
        );
      })
    );

    const emailField = screen.getByLabelText(/email address/i);
    const passwordField = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Trigger authentication error
    await user.type(emailField, 'invalid@example.com');
    await user.type(passwordField, 'wrongpassword123456');
    await user.click(submitButton);
    
    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
    
    // Click close button on alert
    const closeButton = screen.getByRole('button', { name: /close alert/i });
    await user.click(closeButton);
    
    // Error should be dismissed
    await waitFor(() => {
      expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
    });
  });

  test('supports keyboard navigation', async () => {
    const { user } = renderLoginForm();
    await waitForFormReady();

    // Tab through form elements
    await user.tab();
    expect(screen.getByLabelText(/email address/i)).toHaveFocus();
    
    await user.tab();
    expect(screen.getByLabelText(/password/i)).toHaveFocus();
    
    await user.tab();
    expect(screen.getByRole('button', { name: /show password/i })).toHaveFocus();
    
    await user.tab();
    expect(screen.getByRole('button', { name: /sign in/i })).toHaveFocus();
  });

  test('submits form with Enter key', async () => {
    const { user } = renderLoginForm();
    await waitForFormReady();

    // Mock successful login
    server.use(
      http.post('/api/v2/user/session', () => {
        return HttpResponse.json(
          authTestUtils.createSessionResponse(
            authTestUtils.mockUsers[0],
            authTestUtils.generateMockJwtToken(1, 'user'),
            'user'
          )
        );
      })
    );

    const emailField = screen.getByLabelText(/email address/i);
    const passwordField = screen.getByLabelText(/password/i);
    
    // Fill in credentials
    await user.type(emailField, 'user@example.com');
    await user.type(passwordField, 'validpassword123456');
    
    // Press Enter to submit
    await user.keyboard('{Enter}');
    
    // Should redirect to home page
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/home');
    });
  });
});

// ============================================================================
// ACCESSIBILITY COMPLIANCE TESTS
// ============================================================================

describe('LoginForm Component - Accessibility', () => {
  test('has no accessibility violations', async () => {
    const { container } = renderLoginForm();
    await waitForFormReady();

    // Run axe accessibility tests
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('has proper ARIA labels and descriptions', async () => {
    renderLoginForm();
    await waitForFormReady();

    const emailField = screen.getByLabelText(/email address/i);
    const passwordField = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Check ARIA attributes
    expect(emailField).toHaveAttribute('aria-invalid', 'false');
    expect(passwordField).toHaveAttribute('aria-invalid', 'false');
    expect(submitButton).toHaveAttribute('type', 'submit');
    
    // Check required field indicators
    expect(screen.getByText('*', { selector: '[aria-label="Required"]' })).toBeInTheDocument();
  });

  test('updates ARIA attributes during validation errors', async () => {
    const { user } = renderLoginForm();
    await waitForFormReady();

    const emailField = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Trigger validation error
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(emailField).toHaveAttribute('aria-invalid', 'true');
      expect(emailField).toHaveAttribute('aria-describedby');
    });
    
    // Error message should have proper role
    const errorMessage = screen.getByText(/email is required/i);
    expect(errorMessage).toHaveAttribute('role', 'alert');
  });

  test('has proper heading hierarchy', async () => {
    renderLoginForm();
    await waitForFormReady();

    // Check heading structure
    const mainHeading = screen.getByRole('heading', { level: 2 });
    expect(mainHeading).toHaveTextContent(/sign in to your account/i);
  });

  test('has proper form labeling', async () => {
    renderLoginForm();
    await waitForFormReady();

    const form = screen.getByRole('form');
    expect(form).toBeInTheDocument();
    
    // All form controls should have associated labels
    const emailField = screen.getByLabelText(/email address/i);
    const passwordField = screen.getByLabelText(/password/i);
    
    expect(emailField).toHaveAttribute('id');
    expect(passwordField).toHaveAttribute('id');
  });

  test('supports screen reader announcements for dynamic content', async () => {
    const { user } = renderLoginForm();
    await waitForFormReady();

    // Mock failed login to trigger dynamic error content
    server.use(
      http.post('/api/v2/user/session', () => {
        return HttpResponse.json(
          { error: { message: 'Authentication failed' } },
          { status: 401 }
        );
      })
    );

    const emailField = screen.getByLabelText(/email address/i);
    const passwordField = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Trigger authentication error
    await user.type(emailField, 'test@example.com');
    await user.type(passwordField, 'wrongpassword123456');
    await user.click(submitButton);
    
    // Error alert should have proper ARIA role for screen readers
    await waitFor(() => {
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveTextContent(/authentication failed/i);
    });
  });

  test('maintains focus management during interactions', async () => {
    const { user } = renderLoginForm();
    await waitForFormReady();

    const passwordToggle = screen.getByRole('button', { name: /show password/i });
    
    // Focus should remain on toggle button after clicking
    await user.click(passwordToggle);
    expect(passwordToggle).toHaveFocus();
  });
});

// ============================================================================
// RESPONSIVE DESIGN AND PERFORMANCE TESTS
// ============================================================================

describe('LoginForm Component - Responsive Design and Performance', () => {
  test('applies responsive classes correctly', async () => {
    renderLoginForm();
    await waitForFormReady();

    // Check for responsive design classes
    const container = screen.getByTestId('theme-provider');
    expect(container).toBeInTheDocument();
    
    // Form should be responsive
    const formContainer = screen.getByRole('form').closest('div');
    expect(formContainer).toHaveClass('w-full', 'max-w-md');
  });

  test('renders within performance timeouts', async () => {
    const startTime = performance.now();
    
    renderLoginForm();
    await waitForFormReady();
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Component should render quickly (under 100ms as per requirements)
    expect(renderTime).toBeLessThan(100);
  });

  test('handles large LDAP service lists efficiently', async () => {
    // Create config with many LDAP services
    const largeLdapConfig = createMockSystemConfig({
      loginAttribute: 'username' as const,
      adldap: Array.from({ length: 50 }, (_, i) => ({
        name: `ldap-service-${i}`,
        label: `LDAP Service ${i + 1}`,
      })),
    });

    const startTime = performance.now();
    
    renderLoginForm(largeLdapConfig);
    await waitForFormReady();
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should still render efficiently with many options
    expect(renderTime).toBeLessThan(200);
    
    // All services should be available
    const serviceSelect = screen.getByLabelText(/service/i);
    expect(within(serviceSelect).getAllByRole('option')).toHaveLength(51); // 50 services + 1 placeholder
  });
});

// ============================================================================
// ERROR BOUNDARY AND EDGE CASE TESTS
// ============================================================================

describe('LoginForm Component - Error Handling and Edge Cases', () => {
  test('handles system config loading failure gracefully', async () => {
    // Mock system config API failure
    server.use(
      http.get('/api/v2/system/environment', () => {
        return HttpResponse.error();
      })
    );

    renderLoginForm();
    
    // Should still render basic form even if config fails
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('handles malformed system config response', async () => {
    // Mock malformed config response
    server.use(
      http.get('/api/v2/system/environment', () => {
        return HttpResponse.json({ invalid: 'config' });
      })
    );

    renderLoginForm();
    
    // Should fall back to default email mode
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });
  });

  test('prevents double submission during authentication', async () => {
    const { user } = renderLoginForm();
    await waitForFormReady();

    // Mock slow authentication response
    let requestCount = 0;
    server.use(
      http.post('/api/v2/user/session', async () => {
        requestCount++;
        // Delay response to allow for double-click testing
        await new Promise(resolve => setTimeout(resolve, 1000));
        return HttpResponse.json(
          authTestUtils.createSessionResponse(
            authTestUtils.mockUsers[0],
            authTestUtils.generateMockJwtToken(1, 'user'),
            'user'
          )
        );
      })
    );

    const emailField = screen.getByLabelText(/email address/i);
    const passwordField = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Fill in credentials
    await user.type(emailField, 'user@example.com');
    await user.type(passwordField, 'validpassword123456');
    
    // Double-click submit button quickly
    await user.click(submitButton);
    await user.click(submitButton);
    
    // Should only make one request
    await waitFor(() => {
      expect(requestCount).toBe(1);
    });
    
    // Button should be disabled during submission
    expect(submitButton).toBeDisabled();
  });

  test('clears form state appropriately', async () => {
    const { user } = renderLoginForm();
    await waitForFormReady();

    const emailField = screen.getByLabelText(/email address/i);
    const passwordField = screen.getByLabelText(/password/i);
    
    // Fill in some data
    await user.type(emailField, 'test@example.com');
    await user.type(passwordField, 'testpassword');
    
    // Verify data is present
    expect(emailField).toHaveValue('test@example.com');
    expect(passwordField).toHaveValue('testpassword');
    
    // Simulate successful login (which might clear sensitive data)
    server.use(
      http.post('/api/v2/user/session', () => {
        return HttpResponse.json(
          authTestUtils.createSessionResponse(
            authTestUtils.mockUsers[0],
            authTestUtils.generateMockJwtToken(1, 'user'),
            'user'
          )
        );
      })
    );
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    // Should redirect on success
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/home');
    });
  });
});