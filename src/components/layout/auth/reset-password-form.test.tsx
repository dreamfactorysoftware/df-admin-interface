/**
 * @fileoverview Comprehensive Vitest test suite for ResetPasswordForm component
 * 
 * Tests password reset completion workflow including URL parameter handling,
 * password confirmation validation, multi-purpose form behavior (reset/register/invite),
 * automatic login flow, error handling, user interactions, and accessibility compliance.
 * 
 * Validates React Hook Form integration with Zod schema validation, TanStack React Query
 * mutations, Next.js router navigation, and authentication flow patterns.
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { screen, fireEvent, within, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QueryClient } from '@tanstack/react-query';
import {
  renderWithProviders,
  renderWithForm,
  renderWithQuery,
  accessibilityUtils,
  headlessUIUtils,
  testUtils,
  userEvent,
} from '@/test/utils/test-utils';
import { ResetPasswordForm } from './reset-password-form';
import { useAuth } from '@/hooks/use-auth';
import { useSystemConfig } from '@/hooks/use-system-config';
import { server } from '@/test/mocks/server';
import { authHandlers, authTestUtils } from '@/test/mocks/auth-handlers';
import { 
  createAuthErrorResponse,
  createFieldValidationError,
  createMultipleFieldValidationErrors,
  formValidationErrors,
  errorScenarios,
} from '@/test/mocks/error-responses';
import { http, HttpResponse } from 'msw';

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock Next.js router hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock custom hooks
vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/use-system-config', () => ({
  useSystemConfig: vi.fn(),
}));

// Type assertions for mocked hooks
const mockUseRouter = useRouter as Mock;
const mockUseSearchParams = useSearchParams as Mock;
const mockUseAuth = useAuth as Mock;
const mockUseSystemConfig = useSystemConfig as Mock;

// ============================================================================
// MOCK DATA AND UTILITIES
// ============================================================================

/**
 * Creates mock URLSearchParams for testing URL parameter scenarios
 */
const createMockSearchParams = (params: Record<string, string> = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, value);
  });
  
  return {
    get: vi.fn((key: string) => searchParams.get(key)),
    has: vi.fn((key: string) => searchParams.has(key)),
    getAll: vi.fn((key: string) => searchParams.getAll(key)),
    toString: vi.fn(() => searchParams.toString()),
  };
};

/**
 * Creates mock router with configurable navigation methods
 */
const createMockRouterInstance = (overrides = {}) => ({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  ...overrides,
});

/**
 * Creates mock auth context with configurable login behavior
 */
const createMockAuthContext = (overrides = {}) => ({
  user: null,
  isAuthenticated: false,
  login: vi.fn().mockResolvedValue({ 
    success: true, 
    user: { id: 1, email: 'test@example.com' },
    sessionToken: 'mock-token'
  }),
  logout: vi.fn(),
  loading: false,
  ...overrides,
});

/**
 * Creates mock system config with configurable login attribute
 */
const createMockSystemConfig = (loginAttribute: 'email' | 'username' = 'email') => ({
  systemConfig: {
    authentication: {
      loginAttribute,
      passwordMinLength: 16,
      passwordRequiresNumbers: true,
      passwordRequiresSymbols: true,
      passwordRequiresMixedCase: true,
    },
    platform: {
      version: '5.0.0',
      name: 'DreamFactory',
    },
  },
  loading: false,
  error: null,
});

/**
 * Test data for various form scenarios
 */
const testFormData = {
  validEmailReset: {
    email: 'user@example.com',
    code: 'mock-reset-token-123',
    newPassword: 'SecureNewPassword123!',
    confirmPassword: 'SecureNewPassword123!',
  },
  validUsernameReset: {
    username: 'testuser',
    code: 'mock-reset-token-456',
    newPassword: 'AnotherSecurePassword456!',
    confirmPassword: 'AnotherSecurePassword456!',
  },
  validRegistration: {
    email: 'newuser@example.com',
    code: 'mock-verify-token-789',
    newPassword: 'RegistrationPassword789!',
    confirmPassword: 'RegistrationPassword789!',
  },
  passwordMismatch: {
    email: 'user@example.com',
    code: 'mock-reset-token-123',
    newPassword: 'SecureNewPassword123!',
    confirmPassword: 'DifferentPassword456!',
  },
  weakPassword: {
    email: 'user@example.com',
    code: 'mock-reset-token-123',
    newPassword: '123',
    confirmPassword: '123',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Sets up default mock implementations for all hooks
 */
const setupDefaultMocks = () => {
  const mockRouter = createMockRouterInstance();
  const mockSearchParams = createMockSearchParams();
  const mockAuth = createMockAuthContext();
  const mockSystemConfig = createMockSystemConfig();

  mockUseRouter.mockReturnValue(mockRouter);
  mockUseSearchParams.mockReturnValue(mockSearchParams);
  mockUseAuth.mockReturnValue(mockAuth);
  mockUseSystemConfig.mockReturnValue(mockSystemConfig);

  return { mockRouter, mockSearchParams, mockAuth, mockSystemConfig };
};

/**
 * Renders ResetPasswordForm with all necessary providers and default mocks
 */
const renderResetPasswordForm = (
  props: React.ComponentProps<typeof ResetPasswordForm> = {},
  options = {}
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return renderWithQuery(
    <ResetPasswordForm {...props} />,
    {
      queryClient,
      ...options,
    }
  );
};

/**
 * Fills out the password reset form with provided data
 */
const fillPasswordResetForm = async (
  user: ReturnType<typeof userEvent.setup>,
  data: Partial<typeof testFormData.validEmailReset>
) => {
  if (data.email) {
    const emailField = screen.queryByLabelText(/email address/i);
    if (emailField) {
      await user.clear(emailField);
      await user.type(emailField, data.email);
    }
  }

  if (data.username) {
    const usernameField = screen.queryByLabelText(/username/i);
    if (usernameField) {
      await user.clear(usernameField);
      await user.type(usernameField, data.username);
    }
  }

  if (data.code) {
    const codeField = screen.getByLabelText(/confirmation code/i);
    await user.clear(codeField);
    await user.type(codeField, data.code);
  }

  if (data.newPassword) {
    const passwordField = screen.getByLabelText(/new password|^password$/i);
    await user.clear(passwordField);
    await user.type(passwordField, data.newPassword);
  }

  if (data.confirmPassword) {
    const confirmField = screen.getByLabelText(/confirm.*password/i);
    await user.clear(confirmField);
    await user.type(confirmField, data.confirmPassword);
  }
};

/**
 * Waits for form validation to complete and checks submit button state
 */
const waitForFormValidation = async () => {
  await waitFor(() => {
    // Wait for any pending validation to complete
    expect(screen.queryByText(/processing/i)).not.toBeInTheDocument();
  }, { timeout: 2000 });
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe('ResetPasswordForm', () => {
  let mockRouter: ReturnType<typeof createMockRouterInstance>;
  let mockSearchParams: ReturnType<typeof createMockSearchParams>;
  let mockAuth: ReturnType<typeof createMockAuthContext>;
  let mockSystemConfig: ReturnType<typeof createMockSystemConfig>;

  beforeEach(() => {
    // Set up MSW server with auth handlers
    server.use(...authHandlers);
    
    // Set up default mocks
    const mocks = setupDefaultMocks();
    mockRouter = mocks.mockRouter;
    mockSearchParams = mocks.mockSearchParams;
    mockAuth = mocks.mockAuth;
    mockSystemConfig = mocks.mockSystemConfig;

    // Clear any existing localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
  });

  // ============================================================================
  // COMPONENT RENDERING TESTS
  // ============================================================================

  describe('Component Rendering', () => {
    it('renders password reset form with all required fields', () => {
      renderResetPasswordForm();

      expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirmation code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    it('renders registration confirmation form when type is register', () => {
      renderResetPasswordForm({ type: 'register' });

      expect(screen.getByRole('heading', { name: /registration confirmation/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm user/i })).toBeInTheDocument();
    });

    it('renders invitation confirmation form when type is invite', () => {
      renderResetPasswordForm({ type: 'invite' });

      expect(screen.getByRole('heading', { name: /invitation confirmation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm user/i })).toBeInTheDocument();
    });

    it('renders username field when login attribute is username', () => {
      const mockConfig = createMockSystemConfig('username');
      mockUseSystemConfig.mockReturnValue(mockConfig);

      renderResetPasswordForm();

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
    });

    it('shows sign in instead link', () => {
      renderResetPasswordForm();

      const signInLink = screen.getByRole('button', { name: /sign in instead/i });
      expect(signInLink).toBeInTheDocument();
    });
  });

  // ============================================================================
  // URL PARAMETER TESTING
  // ============================================================================

  describe('URL Parameter Handling', () => {
    it('pre-populates email field from URL parameters', () => {
      const testEmail = 'prefilled@example.com';
      mockSearchParams.get.mockImplementation((key: string) => 
        key === 'email' ? testEmail : null
      );

      renderResetPasswordForm();

      const emailField = screen.getByLabelText(/email address/i) as HTMLInputElement;
      expect(emailField.value).toBe(testEmail);
    });

    it('pre-populates username field from URL parameters', () => {
      const testUsername = 'prefilleduser';
      const mockConfig = createMockSystemConfig('username');
      mockUseSystemConfig.mockReturnValue(mockConfig);
      mockSearchParams.get.mockImplementation((key: string) => 
        key === 'username' ? testUsername : null
      );

      renderResetPasswordForm();

      const usernameField = screen.getByLabelText(/username/i) as HTMLInputElement;
      expect(usernameField.value).toBe(testUsername);
    });

    it('pre-populates confirmation code from URL parameters', () => {
      const testCode = 'mock-reset-token-123456';
      mockSearchParams.get.mockImplementation((key: string) => 
        key === 'code' ? testCode : null
      );

      renderResetPasswordForm();

      const codeField = screen.getByLabelText(/confirmation code/i) as HTMLInputElement;
      expect(codeField.value).toBe(testCode);
    });

    it('handles multiple URL parameters simultaneously', () => {
      const testParams = {
        email: 'multi@example.com',
        code: 'multi-token-789',
        admin: '1',
      };
      
      mockSearchParams.get.mockImplementation((key: string) => testParams[key as keyof typeof testParams] || null);

      renderResetPasswordForm();

      const emailField = screen.getByLabelText(/email address/i) as HTMLInputElement;
      const codeField = screen.getByLabelText(/confirmation code/i) as HTMLInputElement;
      
      expect(emailField.value).toBe(testParams.email);
      expect(codeField.value).toBe(testParams.code);
    });

    it('updates form fields when URL parameters change', async () => {
      const { rerender } = renderResetPasswordForm();

      // Initial state with no parameters
      const emailField = screen.getByLabelText(/email address/i) as HTMLInputElement;
      expect(emailField.value).toBe('');

      // Update search params mock to return new values
      mockSearchParams.get.mockImplementation((key: string) => 
        key === 'email' ? 'updated@example.com' : null
      );

      // Re-render the component to trigger useEffect
      rerender(<ResetPasswordForm />);

      await waitFor(() => {
        expect(emailField.value).toBe('updated@example.com');
      });
    });

    it('handles admin parameter for admin password reset workflow', () => {
      mockSearchParams.get.mockImplementation((key: string) => 
        key === 'admin' ? '1' : null
      );

      renderResetPasswordForm();

      // The component should handle admin parameter internally
      // This will be validated through API call testing
      expect(mockSearchParams.get).toHaveBeenCalledWith('admin');
    });
  });

  // ============================================================================
  // PASSWORD CONFIRMATION VALIDATION TESTING
  // ============================================================================

  describe('Password Confirmation Validation', () => {
    it('validates password confirmation matches new password', async () => {
      const { user } = renderResetPasswordForm();

      await fillPasswordResetForm(user, {
        email: 'test@example.com',
        code: 'valid-code',
        newPassword: 'SecurePassword123!',
        confirmPassword: 'DifferentPassword456!',
      });

      await waitForFormValidation();

      // Submit the form to trigger validation
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('shows real-time password confirmation validation', async () => {
      const { user } = renderResetPasswordForm();

      const passwordField = screen.getByLabelText(/new password/i);
      const confirmField = screen.getByLabelText(/confirm new password/i);

      // Type password
      await user.type(passwordField, 'SecurePassword123!');
      
      // Type different confirmation password
      await user.type(confirmField, 'Different');

      // Blur the confirm field to trigger validation
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      // Clear and type matching password
      await user.clear(confirmField);
      await user.type(confirmField, 'SecurePassword123!');

      await waitFor(() => {
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
      });
    });

    it('validates password strength requirements', async () => {
      const { user } = renderResetPasswordForm();

      await fillPasswordResetForm(user, {
        email: 'test@example.com',
        code: 'valid-code',
        newPassword: '123',
        confirmPassword: '123',
      });

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 16 characters/i)).toBeInTheDocument();
      });
    });

    it('shows password requirements hint', () => {
      renderResetPasswordForm();

      expect(screen.getByText(/password must be at least 16 characters long/i)).toBeInTheDocument();
    });

    it('disables submit button when passwords do not match', async () => {
      const { user } = renderResetPasswordForm();

      await fillPasswordResetForm(user, {
        email: 'test@example.com',
        code: 'valid-code',
        newPassword: 'SecurePassword123!',
        confirmPassword: 'Different',
      });

      await waitForFormValidation();

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when all validation passes', async () => {
      const { user } = renderResetPasswordForm();

      await fillPasswordResetForm(user, testFormData.validEmailReset);
      await waitForFormValidation();

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      expect(submitButton).toBeEnabled();
    });
  });

  // ============================================================================
  // MULTI-PURPOSE FORM TESTING
  // ============================================================================

  describe('Multi-purpose Form Types', () => {
    describe('Password Reset (type: reset)', () => {
      it('displays reset-specific UI elements', () => {
        renderResetPasswordForm({ type: 'reset' });

        expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
      });

      it('submits to user password reset endpoint', async () => {
        let requestData: any;
        server.use(
          http.post('/api/v2/user/password', async ({ request }) => {
            requestData = await request.json();
            return HttpResponse.json({ success: true });
          })
        );

        const { user } = renderResetPasswordForm({ type: 'reset' });

        await fillPasswordResetForm(user, testFormData.validEmailReset);
        
        const submitButton = screen.getByRole('button', { name: /reset password/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(requestData).toMatchObject({
            email: testFormData.validEmailReset.email,
            code: testFormData.validEmailReset.code,
            newPassword: testFormData.validEmailReset.newPassword,
          });
        });
      });
    });

    describe('Registration Confirmation (type: register)', () => {
      it('displays registration-specific UI elements', () => {
        renderResetPasswordForm({ type: 'register' });

        expect(screen.getByRole('heading', { name: /registration confirmation/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /confirm user/i })).toBeInTheDocument();
      });

      it('behaves as registration confirmation workflow', async () => {
        const { user } = renderResetPasswordForm({ type: 'register' });

        await fillPasswordResetForm(user, testFormData.validRegistration);
        
        const submitButton = screen.getByRole('button', { name: /confirm user/i });
        await user.click(submitButton);

        // Should still use password reset endpoint but for registration confirmation
        await waitFor(() => {
          expect(mockAuth.login).toHaveBeenCalled();
        });
      });
    });

    describe('User Invitation (type: invite)', () => {
      it('displays invitation-specific UI elements', () => {
        renderResetPasswordForm({ type: 'invite' });

        expect(screen.getByRole('heading', { name: /invitation confirmation/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /confirm user/i })).toBeInTheDocument();
      });

      it('behaves as invitation acceptance workflow', async () => {
        const { user } = renderResetPasswordForm({ type: 'invite' });

        await fillPasswordResetForm(user, testFormData.validEmailReset);
        
        const submitButton = screen.getByRole('button', { name: /confirm user/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(mockAuth.login).toHaveBeenCalled();
        });
      });
    });
  });

  // ============================================================================
  // API INTEGRATION TESTING
  // ============================================================================

  describe('API Integration', () => {
    it('successfully completes password reset flow', async () => {
      // Mock successful password reset
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.json({ success: true });
        })
      );

      const { user } = renderResetPasswordForm();

      await fillPasswordResetForm(user, testFormData.validEmailReset);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuth.login).toHaveBeenCalledWith({
          email: testFormData.validEmailReset.email,
          password: testFormData.validEmailReset.newPassword,
        });
      });
    });

    it('submits to admin endpoint when admin parameter is present', async () => {
      let requestUrl: string;
      server.use(
        http.post('/api/v2/system/admin/password', ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json({ success: true });
        })
      );

      mockSearchParams.get.mockImplementation((key: string) => 
        key === 'admin' ? '1' : null
      );

      const { user } = renderResetPasswordForm();

      await fillPasswordResetForm(user, testFormData.validEmailReset);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(requestUrl).toContain('/api/v2/system/admin/password');
      });
    });

    it('performs automatic login after successful password reset', async () => {
      // Mock successful password reset
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.json({ success: true });
        })
      );

      const { user } = renderResetPasswordForm();

      await fillPasswordResetForm(user, testFormData.validEmailReset);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuth.login).toHaveBeenCalledWith({
          email: testFormData.validEmailReset.email,
          password: testFormData.validEmailReset.newPassword,
        });
      });
    });

    it('navigates to dashboard after successful auto-login', async () => {
      // Mock successful password reset and login
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.json({ success: true });
        })
      );

      mockAuth.login.mockResolvedValue({
        success: true,
        user: { id: 1, email: 'test@example.com' },
        sessionToken: 'mock-token',
      });

      const { user } = renderResetPasswordForm();

      await fillPasswordResetForm(user, testFormData.validEmailReset);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/');
      });
    });

    it('uses username for login when login attribute is username', async () => {
      const mockConfig = createMockSystemConfig('username');
      mockUseSystemConfig.mockReturnValue(mockConfig);

      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.json({ success: true });
        })
      );

      const { user } = renderResetPasswordForm();

      await fillPasswordResetForm(user, testFormData.validUsernameReset);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuth.login).toHaveBeenCalledWith({
          username: testFormData.validUsernameReset.username,
          password: testFormData.validUsernameReset.newPassword,
        });
      });
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTING
  // ============================================================================

  describe('Error Handling', () => {
    it('displays error message for invalid reset token', async () => {
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.json(
            { error: { message: 'Invalid reset code' } },
            { status: 400 }
          );
        })
      );

      const { user } = renderResetPasswordForm();

      await fillPasswordResetForm(user, {
        ...testFormData.validEmailReset,
        code: 'invalid-token',
      });
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid reset code/i)).toBeInTheDocument();
      });
    });

    it('displays error message for expired reset code', async () => {
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.json(
            { error: { message: 'Reset code has expired' } },
            { status: 400 }
          );
        })
      );

      const { user } = renderResetPasswordForm();

      await fillPasswordResetForm(user, testFormData.validEmailReset);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/reset code has expired/i)).toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.json(
            { error: { message: 'Network error' } },
            { status: 500 }
          );
        })
      );

      const { user } = renderResetPasswordForm();

      await fillPasswordResetForm(user, testFormData.validEmailReset);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('handles auto-login failure after successful password reset', async () => {
      // Mock successful password reset but failed login
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.json({ success: true });
        })
      );

      mockAuth.login.mockRejectedValue(new Error('Login failed'));

      const { user } = renderResetPasswordForm();

      await fillPasswordResetForm(user, testFormData.validEmailReset);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password reset successful, but auto-login failed/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });

    it('allows dismissing error alerts', async () => {
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.json(
            { error: { message: 'Test error message' } },
            { status: 400 }
          );
        })
      );

      const { user } = renderResetPasswordForm();

      await fillPasswordResetForm(user, testFormData.validEmailReset);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/test error message/i)).toBeInTheDocument();
      });

      // Find and click dismiss button (assuming Alert component has one)
      const dismissButton = screen.getByRole('button', { name: /dismiss|close/i });
      await user.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText(/test error message/i)).not.toBeInTheDocument();
      });
    });

    it('calls onError callback when provided', async () => {
      const onError = vi.fn();
      
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.json(
            { error: { message: 'Callback test error' } },
            { status: 400 }
          );
        })
      );

      const { user } = renderResetPasswordForm({ onError });

      await fillPasswordResetForm(user, testFormData.validEmailReset);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Callback test error');
      });
    });
  });

  // ============================================================================
  // USER INTERACTION TESTING
  // ============================================================================

  describe('User Interactions', () => {
    it('handles form submission with Enter key', async () => {
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.json({ success: true });
        })
      );

      const { user } = renderResetPasswordForm();

      await fillPasswordResetForm(user, testFormData.validEmailReset);
      
      // Press Enter while focused on any form field
      const confirmField = screen.getByLabelText(/confirm new password/i);
      confirmField.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockAuth.login).toHaveBeenCalled();
      });
    });

    it('navigates to login page when clicking "Sign in instead"', async () => {
      const { user } = renderResetPasswordForm();

      const signInLink = screen.getByRole('button', { name: /sign in instead/i });
      await user.click(signInLink);

      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });

    it('disables form interactions during submission', async () => {
      // Mock delayed response to test loading state
      server.use(
        http.post('/api/v2/user/password', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({ success: true });
        })
      );

      const { user } = renderResetPasswordForm();

      await fillPasswordResetForm(user, testFormData.validEmailReset);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      // Check that button shows loading state
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
      
      // Check that form fields are disabled
      const emailField = screen.getByLabelText(/email address/i);
      const codeField = screen.getByLabelText(/confirmation code/i);
      const passwordField = screen.getByLabelText(/new password/i);
      const confirmField = screen.getByLabelText(/confirm new password/i);
      const signInLink = screen.getByRole('button', { name: /sign in instead/i });

      expect(emailField).toBeDisabled();
      expect(codeField).toBeDisabled();
      expect(passwordField).toBeDisabled();
      expect(confirmField).toBeDisabled();
      expect(signInLink).toBeDisabled();
    });

    it('calls onSuccess callback after successful completion', async () => {
      const onSuccess = vi.fn();
      
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.json({ success: true });
        })
      );

      const { user } = renderResetPasswordForm({ onSuccess });

      await fillPasswordResetForm(user, testFormData.validEmailReset);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('prevents multiple form submissions', async () => {
      let requestCount = 0;
      server.use(
        http.post('/api/v2/user/password', async () => {
          requestCount++;
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({ success: true });
        })
      );

      const { user } = renderResetPasswordForm();

      await fillPasswordResetForm(user, testFormData.validEmailReset);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      
      // Click multiple times rapidly
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      await waitFor(() => {
        expect(requestCount).toBe(1);
      });
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTING
  // ============================================================================

  describe('Accessibility', () => {
    it('has proper form labels and field associations', () => {
      renderResetPasswordForm();

      // Check that all form fields have proper labels
      const emailField = screen.getByLabelText(/email address/i);
      const codeField = screen.getByLabelText(/confirmation code/i);
      const passwordField = screen.getByLabelText(/new password/i);
      const confirmField = screen.getByLabelText(/confirm new password/i);

      expect(emailField).toHaveAttribute('type', 'email');
      expect(codeField).toHaveAttribute('type', 'text');
      expect(passwordField).toHaveAttribute('type', 'password');
      expect(confirmField).toHaveAttribute('type', 'password');

      // Check autocomplete attributes
      expect(emailField).toHaveAttribute('autocomplete', 'email');
      expect(passwordField).toHaveAttribute('autocomplete', 'new-password');
      expect(confirmField).toHaveAttribute('autocomplete', 'new-password');
    });

    it('provides proper ARIA attributes for form validation', async () => {
      const { user } = renderResetPasswordForm();

      // Trigger validation error
      await fillPasswordResetForm(user, testFormData.passwordMismatch);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        const confirmField = screen.getByLabelText(/confirm new password/i);
        const errorMessage = screen.getByText(/passwords do not match/i);
        
        // Check that error message is associated with field
        expect(confirmField).toHaveAttribute('aria-invalid', 'true');
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('supports keyboard navigation through form fields', async () => {
      const { user } = renderResetPasswordForm();

      const formContainer = screen.getByRole('form') || document.body;
      
      const navigationResult = await accessibilityUtils.testKeyboardNavigation(
        formContainer, 
        user
      );

      expect(navigationResult.success).toBe(true);
      expect(navigationResult.focusedElements.length).toBeGreaterThan(0);
    });

    it('has adequate color contrast for form elements', () => {
      renderResetPasswordForm();

      const formElements = [
        screen.getByLabelText(/email address/i),
        screen.getByLabelText(/confirmation code/i),
        screen.getByLabelText(/new password/i),
        screen.getByLabelText(/confirm new password/i),
        screen.getByRole('button', { name: /reset password/i }),
      ];

      formElements.forEach(element => {
        expect(accessibilityUtils.hasAdequateContrast(element)).toBe(true);
      });
    });

    it('announces form validation errors to screen readers', async () => {
      const { user } = renderResetPasswordForm();

      await fillPasswordResetForm(user, testFormData.weakPassword);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/password must be at least 16 characters/i);
        
        // Error messages should have role="alert" for screen reader announcement
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('provides proper heading structure', () => {
      renderResetPasswordForm();

      const mainHeading = screen.getByRole('heading', { name: /reset password/i });
      expect(mainHeading).toHaveAttribute('aria-level', '2');
    });

    it('has accessible form submit button', () => {
      renderResetPasswordForm();

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
      expect(accessibilityUtils.isKeyboardAccessible(submitButton)).toBe(true);
    });

    it('provides accessible error alerts with dismissal', async () => {
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.json(
            { error: { message: 'Accessibility test error' } },
            { status: 400 }
          );
        })
      );

      const { user } = renderResetPasswordForm();

      await fillPasswordResetForm(user, testFormData.validEmailReset);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorAlert = screen.getByText(/accessibility test error/i);
        expect(errorAlert).toHaveAttribute('role', 'alert');
        
        // Check that dismiss button is accessible
        const dismissButton = screen.getByRole('button', { name: /dismiss|close/i });
        expect(accessibilityUtils.isKeyboardAccessible(dismissButton)).toBe(true);
      });
    });

    it('maintains focus management during form interactions', async () => {
      const { user } = renderResetPasswordForm();

      const emailField = screen.getByLabelText(/email address/i);
      emailField.focus();
      
      expect(document.activeElement).toBe(emailField);

      // Tab through form fields
      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(screen.getByLabelText(/confirmation code/i));

      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(screen.getByLabelText(/new password/i));

      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(screen.getByLabelText(/confirm new password/i));

      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /reset password/i }));
    });
  });

  // ============================================================================
  // PERFORMANCE AND VALIDATION TESTING
  // ============================================================================

  describe('Form Performance', () => {
    it('validates passwords in under 100ms as required', async () => {
      const { user } = renderResetPasswordForm();

      const startTime = performance.now();

      await fillPasswordResetForm(user, testFormData.validEmailReset);
      
      const endTime = performance.now();
      const validationTime = endTime - startTime;

      // Validation should complete under the 100ms requirement
      expect(validationTime).toBeLessThan(100);
    });

    it('handles rapid form field changes efficiently', async () => {
      const { user } = renderResetPasswordForm();

      const passwordField = screen.getByLabelText(/new password/i);
      
      // Rapidly change password value multiple times
      for (let i = 0; i < 10; i++) {
        await user.clear(passwordField);
        await user.type(passwordField, `Password${i}!`);
      }

      // Form should remain responsive
      expect(passwordField).toBeEnabled();
      expect(passwordField).toHaveValue('Password9!');
    });
  });

  // ============================================================================
  // EDGE CASES AND INTEGRATION TESTS
  // ============================================================================

  describe('Edge Cases', () => {
    it('handles empty URL parameters gracefully', () => {
      mockSearchParams.get.mockReturnValue('');

      renderResetPasswordForm();

      const emailField = screen.getByLabelText(/email address/i) as HTMLInputElement;
      const codeField = screen.getByLabelText(/confirmation code/i) as HTMLInputElement;

      expect(emailField.value).toBe('');
      expect(codeField.value).toBe('');
    });

    it('handles malformed URL parameters', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        switch (key) {
          case 'email': return 'not-an-email';
          case 'code': return null;
          default: return null;
        }
      });

      renderResetPasswordForm();

      const emailField = screen.getByLabelText(/email address/i) as HTMLInputElement;
      expect(emailField.value).toBe('not-an-email');
    });

    it('handles missing system configuration gracefully', () => {
      mockUseSystemConfig.mockReturnValue({
        systemConfig: null,
        loading: false,
        error: null,
      });

      renderResetPasswordForm();

      // Should default to email field
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('handles loading system configuration', () => {
      mockUseSystemConfig.mockReturnValue({
        systemConfig: null,
        loading: true,
        error: null,
      });

      renderResetPasswordForm();

      // Should still render form with default values
      expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
    });

    it('handles concurrent form submissions gracefully', async () => {
      let resolveRequest: (value: any) => void;
      const requestPromise = new Promise(resolve => {
        resolveRequest = resolve;
      });

      server.use(
        http.post('/api/v2/user/password', async () => {
          await requestPromise;
          return HttpResponse.json({ success: true });
        })
      );

      const { user } = renderResetPasswordForm();

      await fillPasswordResetForm(user, testFormData.validEmailReset);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      
      // Start first submission
      await user.click(submitButton);
      
      // Try to submit again while first is pending
      await user.click(submitButton);

      // Resolve the request
      resolveRequest!(null);

      await waitFor(() => {
        expect(mockAuth.login).toHaveBeenCalledTimes(1);
      });
    });
  });
});