/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient } from '@tanstack/react-query';
import { server } from '@/test/mocks/server';
import { authHandlers, authTestUtils } from '@/test/mocks/auth-handlers';
import { errorScenarios } from '@/test/mocks/error-responses';
import { renderWithProviders, accessibilityUtils, testUtils } from '@/test/utils/test-utils';
import { ForgotPasswordForm } from './forgot-password-form';
import { http, HttpResponse } from 'msw';

/**
 * Comprehensive Vitest test suite for ForgotPasswordForm component
 * 
 * Tests the two-step password reset workflow including:
 * - Dynamic form field switching based on system configuration
 * - Initial password reset request form
 * - Security question form when required by backend
 * - API integration with password reset endpoints
 * - Form validation for email/username formats
 * - Error handling for API failures and invalid inputs
 * - User interaction flows and navigation
 * - WCAG 2.1 AA accessibility compliance
 * 
 * Migrated from Angular Karma/Jasmine to Vitest with React Testing Library
 * Uses MSW for realistic API mocking and comprehensive error scenario testing
 */

// ============================================================================
// TEST SETUP AND CONFIGURATION
// ============================================================================

/**
 * Mock Next.js router for navigation testing
 */
const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

/**
 * Mock system configuration hook for dynamic form testing
 */
const mockSystemConfig = {
  authentication: {
    loginAttribute: 'email', // Default to email-based login
  },
};

const mockUseSystemConfig = vi.fn(() => ({
  data: mockSystemConfig,
  isLoading: false,
  error: null,
}));

vi.mock('@/hooks/use-system-config', () => ({
  useSystemConfig: mockUseSystemConfig,
}));

/**
 * Mock authentication hook for login testing
 */
const mockLogin = vi.fn();
const mockUseAuth = vi.fn(() => ({
  login: mockLogin,
  logout: vi.fn(),
  user: null,
  isAuthenticated: false,
  loading: false,
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: mockUseAuth,
}));

/**
 * Mock environment variables for API key
 */
const originalEnv = process.env;
beforeAll(() => {
  process.env.NEXT_PUBLIC_API_KEY = 'test-api-key';
});

afterAll(() => {
  process.env = originalEnv;
});

// ============================================================================
// TEST UTILITIES AND HELPERS
// ============================================================================

/**
 * Creates a fresh query client for each test to ensure test isolation
 */
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Custom render function with all necessary providers
 */
const renderForgotPasswordForm = (
  systemConfig = mockSystemConfig,
  queryClient = createTestQueryClient()
) => {
  // Update mock to return the provided config
  mockUseSystemConfig.mockReturnValue({
    data: systemConfig,
    isLoading: false,
    error: null,
  });

  return renderWithProviders(<ForgotPasswordForm />, {
    providerOptions: {
      queryClient,
      router: mockRouter,
      pathname: '/forgot-password',
    },
  });
};

/**
 * Test data factory for form inputs
 */
const testData = {
  validEmails: [
    'test@example.com',
    'user.name@domain.co.uk',
    'admin+test@company.org',
  ],
  invalidEmails: [
    'invalid-email',
    '@domain.com',
    'user@',
    'user@.com',
    '',
  ],
  validUsernames: [
    'testuser',
    'admin123',
    'user.name',
    'test_user',
  ],
  invalidUsernames: [
    '',
    '   ',
  ],
  validPasswords: [
    'SecurePassword123!@#',
    'AnotherValidPassword2024',
    'ComplexP@ssw0rd!',
  ],
  securityQuestions: [
    'What is your mother\'s maiden name?',
    'What was the name of your first pet?',
    'In which city were you born?',
  ],
  securityAnswers: [
    'Smith',
    'Fluffy',
    'New York',
  ],
};

// ============================================================================
// MSW SERVER SETUP FOR API TESTING
// ============================================================================

beforeAll(() => {
  // Start MSW server with auth handlers
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  // Reset handlers and clear mocks after each test
  server.resetHandlers();
  vi.clearAllMocks();
  mockPush.mockClear();
  mockLogin.mockClear();
});

afterAll(() => {
  // Clean up MSW server
  server.close();
});

// ============================================================================
// COMPONENT RENDERING TESTS
// ============================================================================

describe('ForgotPasswordForm - Component Rendering', () => {
  it('renders the forgot password form with correct initial state', () => {
    renderForgotPasswordForm();

    // Check main heading
    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
    
    // Check description text
    expect(screen.getByText(/enter your email to receive reset instructions/i)).toBeInTheDocument();
    
    // Check form elements are present
    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request password reset/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to login/i })).toBeInTheDocument();
  });

  it('renders email input field when system uses email authentication', () => {
    const emailConfig = {
      authentication: { loginAttribute: 'email' },
    };
    renderForgotPasswordForm(emailConfig);

    // Should have email input
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('placeholder', 'Enter your email address');
    expect(emailInput).toHaveAttribute('autoComplete', 'email');

    // Should not have username input
    expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument();
  });

  it('renders username input field when system uses username authentication', () => {
    const usernameConfig = {
      authentication: { loginAttribute: 'username' },
    };
    renderForgotPasswordForm(usernameConfig);

    // Should have username input
    const usernameInput = screen.getByLabelText(/username/i);
    expect(usernameInput).toBeInTheDocument();
    expect(usernameInput).toHaveAttribute('type', 'text');
    expect(usernameInput).toHaveAttribute('placeholder', 'Enter your username');
    expect(usernameInput).toHaveAttribute('autoComplete', 'username');

    // Should not have email input
    expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();

    // Description should mention username
    expect(screen.getByText(/enter your username to receive reset instructions/i)).toBeInTheDocument();
  });

  it('does not render security question form initially', () => {
    renderForgotPasswordForm();

    // Security question form should not be visible initially
    expect(screen.queryByLabelText(/security question/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/security answer/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
  });
});

// ============================================================================
// DYNAMIC FORM FIELD TESTING
// ============================================================================

describe('ForgotPasswordForm - Dynamic Form Fields', () => {
  it('switches form field based on system configuration changes', () => {
    const { rerender } = renderForgotPasswordForm({
      authentication: { loginAttribute: 'email' },
    });

    // Initially should show email field
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument();

    // Update system config to use username
    mockUseSystemConfig.mockReturnValue({
      data: { authentication: { loginAttribute: 'username' } },
      isLoading: false,
      error: null,
    });

    rerender(<ForgotPasswordForm />);

    // Should now show username field
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
  });

  it('defaults to email field when system config is not available', () => {
    mockUseSystemConfig.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    renderForgotPasswordForm();

    // Should default to email field
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument();
  });

  it('handles system config loading state gracefully', () => {
    mockUseSystemConfig.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    renderForgotPasswordForm();

    // Should still render the form with default email field
    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });
});

// ============================================================================
// FORM VALIDATION TESTING
// ============================================================================

describe('ForgotPasswordForm - Form Validation', () => {
  describe('Email Validation', () => {
    beforeEach(() => {
      renderForgotPasswordForm({
        authentication: { loginAttribute: 'email' },
      });
    });

    it('requires email field to be filled', async () => {
      const user = userEvent.setup();
      const submitButton = screen.getByRole('button', { name: /request password reset/i });

      // Try to submit without entering email
      await user.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it.each(testData.invalidEmails)('validates email format for invalid email: %s', async (invalidEmail) => {
      const user = userEvent.setup();
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /request password reset/i });

      // Enter invalid email and submit
      await user.clear(emailInput);
      await user.type(emailInput, invalidEmail);
      await user.click(submitButton);

      // Should show email format validation error
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it.each(testData.validEmails)('accepts valid email format: %s', async (validEmail) => {
      const user = userEvent.setup();
      const emailInput = screen.getByLabelText(/email address/i);

      // Enter valid email
      await user.clear(emailInput);
      await user.type(emailInput, validEmail);

      // Should not show validation error
      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Username Validation', () => {
    beforeEach(() => {
      renderForgotPasswordForm({
        authentication: { loginAttribute: 'username' },
      });
    });

    it('requires username field to be filled', async () => {
      const user = userEvent.setup();
      const submitButton = screen.getByRole('button', { name: /request password reset/i });

      // Try to submit without entering username
      await user.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      });
    });

    it.each(testData.invalidUsernames)('validates username is not empty: "%s"', async (invalidUsername) => {
      const user = userEvent.setup();
      const usernameInput = screen.getByLabelText(/username/i);
      const submitButton = screen.getByRole('button', { name: /request password reset/i });

      // Enter invalid username and submit
      await user.clear(usernameInput);
      await user.type(usernameInput, invalidUsername);
      await user.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      });
    });

    it.each(testData.validUsernames)('accepts valid username: %s', async (validUsername) => {
      const user = userEvent.setup();
      const usernameInput = screen.getByLabelText(/username/i);

      // Enter valid username
      await user.clear(usernameInput);
      await user.type(usernameInput, validUsername);

      // Should not show validation error
      await waitFor(() => {
        expect(screen.queryByText(/username is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Security Question Form Validation', () => {
    beforeEach(() => {
      // Setup form in security question mode
      renderForgotPasswordForm();
    });

    const setupSecurityQuestionForm = async () => {
      const user = userEvent.setup();
      
      // Mock API to return security question
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.json({
            securityQuestion: testData.securityQuestions[0],
          });
        })
      );

      // Submit initial form to trigger security question
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /request password reset/i });

      await user.type(emailInput, testData.validEmails[0]);
      await user.click(submitButton);

      // Wait for security question form to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/security question/i)).toBeInTheDocument();
      });

      return user;
    };

    it('validates security answer is required', async () => {
      const user = await setupSecurityQuestionForm();
      const resetButton = screen.getByRole('button', { name: /reset password/i });

      // Try to submit without security answer
      await user.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText(/security answer is required/i)).toBeInTheDocument();
      });
    });

    it('validates new password is required', async () => {
      const user = await setupSecurityQuestionForm();
      const resetButton = screen.getByRole('button', { name: /reset password/i });

      // Enter security answer but not password
      const securityAnswerInput = screen.getByLabelText(/security answer/i);
      await user.type(securityAnswerInput, testData.securityAnswers[0]);
      await user.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 16 characters long/i)).toBeInTheDocument();
      });
    });

    it('validates password confirmation matches', async () => {
      const user = await setupSecurityQuestionForm();
      
      const securityAnswerInput = screen.getByLabelText(/security answer/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const resetButton = screen.getByRole('button', { name: /reset password/i });

      // Enter mismatched passwords
      await user.type(securityAnswerInput, testData.securityAnswers[0]);
      await user.type(newPasswordInput, testData.validPasswords[0]);
      await user.type(confirmPasswordInput, testData.validPasswords[1]);
      await user.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });
    });

    it('validates password meets minimum length requirement', async () => {
      const user = await setupSecurityQuestionForm();
      
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const resetButton = screen.getByRole('button', { name: /reset password/i });

      // Enter short password
      await user.type(newPasswordInput, 'short');
      await user.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 16 characters long/i)).toBeInTheDocument();
      });
    });
  });
});

// ============================================================================
// API INTEGRATION TESTING
// ============================================================================

describe('ForgotPasswordForm - API Integration', () => {
  describe('Initial Password Reset Request', () => {
    it('successfully submits password reset request with email', async () => {
      const user = userEvent.setup();
      renderForgotPasswordForm({
        authentication: { loginAttribute: 'email' },
      });

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /request password reset/i });

      // Enter email and submit
      await user.type(emailInput, testData.validEmails[0]);
      await user.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument();
      });

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/password reset instructions have been sent to your email address/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('successfully submits password reset request with username', async () => {
      const user = userEvent.setup();
      renderForgotPasswordForm({
        authentication: { loginAttribute: 'username' },
      });

      const usernameInput = screen.getByLabelText(/username/i);
      const submitButton = screen.getByRole('button', { name: /request password reset/i });

      // Enter username and submit
      await user.type(usernameInput, testData.validUsernames[0]);
      await user.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument();
      });

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/password reset instructions have been sent to your email address/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('handles API error responses gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API to return error
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.json(
            { error: { message: 'Service temporarily unavailable' } },
            { status: 500 }
          );
        })
      );

      renderForgotPasswordForm();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /request password reset/i });

      await user.type(emailInput, testData.validEmails[0]);
      await user.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/service temporarily unavailable/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('handles network errors appropriately', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.error();
        })
      );

      renderForgotPasswordForm();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /request password reset/i });

      await user.type(emailInput, testData.validEmails[0]);
      await user.click(submitButton);

      // Should show network error message
      await waitFor(() => {
        expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Two-Step Workflow with Security Question', () => {
    it('transitions to security question form when required by backend', async () => {
      const user = userEvent.setup();
      
      // Mock API to return security question
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.json({
            securityQuestion: testData.securityQuestions[0],
          });
        })
      );

      renderForgotPasswordForm();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /request password reset/i });

      // Submit initial form
      await user.type(emailInput, testData.validEmails[0]);
      await user.click(submitButton);

      // Should transition to security question form
      await waitFor(() => {
        expect(screen.getByLabelText(/security question/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue(testData.securityQuestions[0])).toBeInTheDocument();
        expect(screen.getByLabelText(/security answer/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      });

      // Should update description text
      expect(screen.getByText(/answer your security question to reset your password/i)).toBeInTheDocument();
      
      // Should hide initial form
      expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
    });

    it('successfully completes password reset with security question', async () => {
      const user = userEvent.setup();
      
      // Mock initial request to return security question
      server.use(
        http.post('/api/v2/user/password', ({ request }) => {
          const url = new URL(request.url);
          const reset = url.searchParams.get('reset');
          
          if (reset === 'false') {
            // First request - return security question
            return HttpResponse.json({
              securityQuestion: testData.securityQuestions[0],
            });
          } else {
            // Second request - successful reset
            return HttpResponse.json({
              success: true,
              message: 'Password has been reset successfully.',
            });
          }
        })
      );

      renderForgotPasswordForm();

      // Complete initial form
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /request password reset/i });

      await user.type(emailInput, testData.validEmails[0]);
      await user.click(submitButton);

      // Wait for security question form
      await waitFor(() => {
        expect(screen.getByLabelText(/security question/i)).toBeInTheDocument();
      });

      // Complete security question form
      const securityAnswerInput = screen.getByLabelText(/security answer/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const resetButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(securityAnswerInput, testData.securityAnswers[0]);
      await user.type(newPasswordInput, testData.validPasswords[0]);
      await user.type(confirmPasswordInput, testData.validPasswords[0]);
      await user.click(resetButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resetting/i })).toBeInTheDocument();
      });

      // Should attempt automatic login and navigate
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: testData.validEmails[0],
          password: testData.validPasswords[0],
        });
      }, { timeout: 5000 });
    });

    it('handles automatic login failure gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock login to fail
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));
      
      // Mock password reset to succeed
      server.use(
        http.post('/api/v2/user/password', ({ request }) => {
          const url = new URL(request.url);
          const reset = url.searchParams.get('reset');
          
          if (reset === 'false') {
            return HttpResponse.json({
              securityQuestion: testData.securityQuestions[0],
            });
          } else {
            return HttpResponse.json({
              success: true,
              message: 'Password has been reset successfully.',
            });
          }
        })
      );

      renderForgotPasswordForm();

      // Complete both forms
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /request password reset/i });

      await user.type(emailInput, testData.validEmails[0]);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/security question/i)).toBeInTheDocument();
      });

      const securityAnswerInput = screen.getByLabelText(/security answer/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const resetButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(securityAnswerInput, testData.securityAnswers[0]);
      await user.type(newPasswordInput, testData.validPasswords[0]);
      await user.type(confirmPasswordInput, testData.validPasswords[0]);
      await user.click(resetButton);

      // Should redirect to login page when auto-login fails
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      }, { timeout: 5000 });
    });
  });

  describe('API Fallback Behavior', () => {
    it('falls back to admin endpoint when user endpoint fails', async () => {
      const user = userEvent.setup();
      
      // Mock user endpoint to fail, admin endpoint to succeed
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.json(
            { error: { message: 'User not found' } },
            { status: 404 }
          );
        }),
        http.post('/api/v2/system/admin/password', () => {
          return HttpResponse.json({
            success: true,
            message: 'Password reset instructions have been sent to your email address.',
          });
        })
      );

      renderForgotPasswordForm();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /request password reset/i });

      await user.type(emailInput, testData.validEmails[0]);
      await user.click(submitButton);

      // Should eventually show success message from admin endpoint
      await waitFor(() => {
        expect(screen.getByText(/password reset instructions have been sent to your email address/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});

// ============================================================================
// USER INTERACTION TESTING
// ============================================================================

describe('ForgotPasswordForm - User Interactions', () => {
  it('handles form submission with Enter key', async () => {
    const user = userEvent.setup();
    renderForgotPasswordForm();

    const emailInput = screen.getByLabelText(/email address/i);
    
    // Enter email and press Enter
    await user.type(emailInput, testData.validEmails[0]);
    await user.keyboard('{Enter}');

    // Should submit the form
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument();
    });
  });

  it('navigates back to login when back button is clicked', async () => {
    const user = userEvent.setup();
    renderForgotPasswordForm();

    const backButton = screen.getByRole('button', { name: /back to login/i });
    await user.click(backButton);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('clears error message when form is resubmitted', async () => {
    const user = userEvent.setup();
    
    // Mock API to return error first, then success
    let callCount = 0;
    server.use(
      http.post('/api/v2/user/password', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json(
            { error: { message: 'Service temporarily unavailable' } },
            { status: 500 }
          );
        } else {
          return HttpResponse.json({
            success: true,
            message: 'Password reset instructions have been sent to your email address.',
          });
        }
      })
    );

    renderForgotPasswordForm();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /request password reset/i });

    // First submission - should show error
    await user.type(emailInput, testData.validEmails[0]);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/service temporarily unavailable/i)).toBeInTheDocument();
    });

    // Second submission - should clear error and show success
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText(/service temporarily unavailable/i)).not.toBeInTheDocument();
      expect(screen.getByText(/password reset instructions have been sent to your email address/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('maintains form data when switching between error states', async () => {
    const user = userEvent.setup();
    renderForgotPasswordForm();

    const emailInput = screen.getByLabelText(/email address/i);
    const testEmail = testData.validEmails[0];

    // Enter email
    await user.type(emailInput, testEmail);

    // Submit with invalid data to trigger client-side validation
    await user.clear(emailInput);
    const submitButton = screen.getByRole('button', { name: /request password reset/i });
    await user.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    // Re-enter email
    await user.type(emailInput, testEmail);

    // Should clear validation error and maintain email value
    await waitFor(() => {
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
      expect(emailInput).toHaveValue(testEmail);
    });
  });
});

// ============================================================================
// ERROR HANDLING TESTING
// ============================================================================

describe('ForgotPasswordForm - Error Scenarios', () => {
  it('displays appropriate error for invalid email/username', async () => {
    const user = userEvent.setup();
    
    // Mock API to return invalid credentials error
    server.use(
      http.post('/api/v2/user/password', () => {
        return HttpResponse.json(
          { error: { message: 'Invalid email or password' } },
          { status: 401 }
        );
      })
    );

    renderForgotPasswordForm();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /request password reset/i });

    await user.type(emailInput, testData.validEmails[0]);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('displays appropriate error for API key issues', async () => {
    const user = userEvent.setup();
    
    // Mock API to return API key error
    server.use(
      http.post('/api/v2/user/password', () => {
        return HttpResponse.json(
          { error: { message: 'API key required' } },
          { status: 401 }
        );
      })
    );

    renderForgotPasswordForm();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /request password reset/i });

    await user.type(emailInput, testData.validEmails[0]);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/api key required/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('handles malformed API responses gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock API to return malformed response
    server.use(
      http.post('/api/v2/user/password', () => {
        return new HttpResponse('invalid json', { status: 200 });
      })
    );

    renderForgotPasswordForm();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /request password reset/i });

    await user.type(emailInput, testData.validEmails[0]);
    await user.click(submitButton);

    // Should handle parsing error gracefully
    await waitFor(() => {
      expect(screen.getByText(/unexpected token/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('displays specific error for security question validation failures', async () => {
    const user = userEvent.setup();
    
    // Setup security question form
    server.use(
      http.post('/api/v2/user/password', ({ request }) => {
        const url = new URL(request.url);
        const reset = url.searchParams.get('reset');
        
        if (reset === 'false') {
          return HttpResponse.json({
            securityQuestion: testData.securityQuestions[0],
          });
        } else {
          return HttpResponse.json(
            { error: { message: 'Invalid security answer' } },
            { status: 401 }
          );
        }
      })
    );

    renderForgotPasswordForm();

    // Complete initial form
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /request password reset/i });

    await user.type(emailInput, testData.validEmails[0]);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/security question/i)).toBeInTheDocument();
    });

    // Submit security question form with invalid answer
    const securityAnswerInput = screen.getByLabelText(/security answer/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const resetButton = screen.getByRole('button', { name: /reset password/i });

    await user.type(securityAnswerInput, 'wrong answer');
    await user.type(newPasswordInput, testData.validPasswords[0]);
    await user.type(confirmPasswordInput, testData.validPasswords[0]);
    await user.click(resetButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid security answer/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});

// ============================================================================
// ACCESSIBILITY TESTING
// ============================================================================

describe('ForgotPasswordForm - Accessibility Compliance', () => {
  it('provides proper ARIA labels for all form elements', () => {
    renderForgotPasswordForm();

    // Check all form inputs have proper labels
    const emailInput = screen.getByLabelText(/email address/i);
    expect(accessibilityUtils.hasAriaLabel(emailInput)).toBe(true);

    const submitButton = screen.getByRole('button', { name: /request password reset/i });
    expect(accessibilityUtils.hasAriaLabel(submitButton)).toBe(true);

    const backButton = screen.getByRole('button', { name: /back to login/i });
    expect(accessibilityUtils.hasAriaLabel(backButton)).toBe(true);
  });

  it('ensures all interactive elements are keyboard accessible', () => {
    renderForgotPasswordForm();

    const form = screen.getByRole('form');
    const focusableElements = accessibilityUtils.getFocusableElements(form);

    // Should have at least email input and submit button
    expect(focusableElements.length).toBeGreaterThanOrEqual(2);

    // Each element should be keyboard accessible
    focusableElements.forEach((element) => {
      expect(accessibilityUtils.isKeyboardAccessible(element)).toBe(true);
    });
  });

  it('provides proper error announcements for screen readers', async () => {
    const user = userEvent.setup();
    renderForgotPasswordForm();

    const submitButton = screen.getByRole('button', { name: /request password reset/i });

    // Submit form without email to trigger validation error
    await user.click(submitButton);

    await waitFor(() => {
      const errorMessage = screen.getByText(/email is required/i);
      expect(errorMessage).toBeInTheDocument();
      
      // Error should be associated with form field
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('maintains focus management during form transitions', async () => {
    const user = userEvent.setup();
    
    // Mock API to return security question
    server.use(
      http.post('/api/v2/user/password', () => {
        return HttpResponse.json({
          securityQuestion: testData.securityQuestions[0],
        });
      })
    );

    renderForgotPasswordForm();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /request password reset/i });

    // Submit initial form
    await user.type(emailInput, testData.validEmails[0]);
    await user.click(submitButton);

    // Wait for security question form
    await waitFor(() => {
      expect(screen.getByLabelText(/security question/i)).toBeInTheDocument();
    });

    // Focus should be managed appropriately
    const securityQuestionInput = screen.getByLabelText(/security question/i);
    expect(document.activeElement).toBe(securityQuestionInput);
  });

  it('supports keyboard navigation through all form elements', async () => {
    const user = userEvent.setup();
    renderForgotPasswordForm();

    const form = screen.getByRole('form');
    const navigationResult = await accessibilityUtils.testKeyboardNavigation(form, user);

    expect(navigationResult.success).toBe(true);
    expect(navigationResult.focusedElements.length).toBeGreaterThan(0);
  });

  it('provides appropriate contrast and visual indicators', () => {
    renderForgotPasswordForm();

    const form = screen.getByRole('form');
    const interactiveElements = accessibilityUtils.getFocusableElements(form);

    // All interactive elements should have adequate contrast
    interactiveElements.forEach((element) => {
      expect(accessibilityUtils.hasAdequateContrast(element)).toBe(true);
    });
  });

  describe('Security Question Form Accessibility', () => {
    const setupSecurityQuestionForm = async () => {
      const user = userEvent.setup();
      
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.json({
            securityQuestion: testData.securityQuestions[0],
          });
        })
      );

      renderForgotPasswordForm();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /request password reset/i });

      await user.type(emailInput, testData.validEmails[0]);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/security question/i)).toBeInTheDocument();
      });

      return user;
    };

    it('provides proper labels for security question form fields', async () => {
      await setupSecurityQuestionForm();

      // Check all security form fields have proper labels
      const securityQuestionInput = screen.getByLabelText(/security question/i);
      const securityAnswerInput = screen.getByLabelText(/security answer/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      expect(accessibilityUtils.hasAriaLabel(securityQuestionInput)).toBe(true);
      expect(accessibilityUtils.hasAriaLabel(securityAnswerInput)).toBe(true);
      expect(accessibilityUtils.hasAriaLabel(newPasswordInput)).toBe(true);
      expect(accessibilityUtils.hasAriaLabel(confirmPasswordInput)).toBe(true);
    });

    it('marks security question field as readonly appropriately', async () => {
      await setupSecurityQuestionForm();

      const securityQuestionInput = screen.getByLabelText(/security question/i);
      expect(securityQuestionInput).toHaveAttribute('readOnly');
      expect(securityQuestionInput).toHaveClass('bg-gray-50');
    });

    it('provides appropriate autocomplete attributes for password fields', async () => {
      await setupSecurityQuestionForm();

      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      expect(newPasswordInput).toHaveAttribute('autoComplete', 'new-password');
      expect(confirmPasswordInput).toHaveAttribute('autoComplete', 'new-password');
    });
  });
});

// ============================================================================
// LOADING STATES AND PERFORMANCE
// ============================================================================

describe('ForgotPasswordForm - Loading States', () => {
  it('displays loading state during form submission', async () => {
    const user = userEvent.setup();
    
    // Mock API with delay
    server.use(
      http.post('/api/v2/user/password', async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return HttpResponse.json({
          success: true,
          message: 'Password reset instructions have been sent to your email address.',
        });
      })
    );

    renderForgotPasswordForm();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /request password reset/i });

    await user.type(emailInput, testData.validEmails[0]);
    await user.click(submitButton);

    // Should show loading state
    expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
  });

  it('disables form elements during submission', async () => {
    const user = userEvent.setup();
    
    // Mock API with delay
    server.use(
      http.post('/api/v2/user/password', async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return HttpResponse.json({
          success: true,
          message: 'Password reset instructions have been sent to your email address.',
        });
      })
    );

    renderForgotPasswordForm();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /request password reset/i });

    await user.type(emailInput, testData.validEmails[0]);
    await user.click(submitButton);

    // Submit button should be disabled during submission
    expect(submitButton).toBeDisabled();
  });

  it('shows appropriate loading state for security question form', async () => {
    const user = userEvent.setup();
    
    // Setup security question form first
    server.use(
      http.post('/api/v2/user/password', ({ request }) => {
        const url = new URL(request.url);
        const reset = url.searchParams.get('reset');
        
        if (reset === 'false') {
          return HttpResponse.json({
            securityQuestion: testData.securityQuestions[0],
          });
        } else {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(HttpResponse.json({
                success: true,
                message: 'Password has been reset successfully.',
              }));
            }, 1000);
          });
        }
      })
    );

    renderForgotPasswordForm();

    // Get to security question form
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /request password reset/i });

    await user.type(emailInput, testData.validEmails[0]);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/security question/i)).toBeInTheDocument();
    });

    // Complete security question form
    const securityAnswerInput = screen.getByLabelText(/security answer/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const resetButton = screen.getByRole('button', { name: /reset password/i });

    await user.type(securityAnswerInput, testData.securityAnswers[0]);
    await user.type(newPasswordInput, testData.validPasswords[0]);
    await user.type(confirmPasswordInput, testData.validPasswords[0]);
    await user.click(resetButton);

    // Should show loading state for password reset
    expect(screen.getByRole('button', { name: /resetting/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resetting/i })).toBeDisabled();
  });
});