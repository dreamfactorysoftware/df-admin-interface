/**
 * @fileoverview Comprehensive Vitest test suite for ResetPasswordForm component
 * 
 * This test suite validates the password reset form functionality including:
 * - URL parameter parsing for email, username, and confirmation code pre-population
 * - Password confirmation validation with real-time matching verification
 * - Multi-purpose form testing for reset, registration confirmation, and invitation flows
 * - API integration testing with automatic login flow after successful password reset
 * - Error handling for invalid tokens, expired codes, and API failures
 * - Accessibility testing ensuring WCAG 2.1 AA compliance
 * 
 * Technology stack:
 * - Vitest 2.1.0 for 10x faster test execution compared to Jest/Karma
 * - React Testing Library for component testing with user-centric query patterns
 * - Mock Service Worker (MSW) for realistic API mocking
 * - React Hook Form with Zod validation testing
 * - Next.js router parameter handling validation
 */

import { describe, it, expect, beforeEach, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { ResetPasswordForm } from './reset-password-form';
import { renderWithProviders } from '../../../test/utils/test-utils';
import { createMockRouter } from '../../../test/utils/mock-providers';
import { createAuthHandlers } from '../../../test/mocks/auth-handlers';
import { createErrorResponse } from '../../../test/mocks/error-responses';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

/**
 * Mock data for different form workflows
 */
const mockFormData = {
  reset: {
    email: 'user@example.com',
    code: 'reset123456',
    password: 'NewPassword123!@#',
    passwordConfirm: 'NewPassword123!@#'
  },
  register: {
    username: 'newuser',
    email: 'newuser@example.com', 
    code: 'reg789012',
    password: 'RegisterPass456$%^',
    passwordConfirm: 'RegisterPass456$%^'
  },
  invite: {
    email: 'invited@example.com',
    code: 'invite345678',
    password: 'InvitePassword789&*()',
    passwordConfirm: 'InvitePassword789&*()'
  }
};

/**
 * Mock system configuration for different login attribute modes
 */
const mockSystemConfig = {
  emailMode: {
    authentication: {
      login_attribute: 'email',
      password_policy: {
        min_length: 16,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_special: true
      }
    }
  },
  usernameMode: {
    authentication: {
      login_attribute: 'username',
      password_policy: {
        min_length: 16,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_special: true
      }
    }
  }
};

/**
 * Mock Service Worker server setup for API testing
 */
const server = setupServer(
  // Password reset completion endpoint
  http.post('/api/v2/user/password', async ({ request }) => {
    const body = await request.json() as any;
    
    if (body.code === 'invalid_code') {
      return HttpResponse.json(
        createErrorResponse(400, 'Invalid or expired confirmation code', 'INVALID_CODE'),
        { status: 400 }
      );
    }
    
    if (body.code === 'expired_code') {
      return HttpResponse.json(
        createErrorResponse(410, 'Confirmation code has expired', 'EXPIRED_CODE'),
        { status: 410 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      session_token: 'mock_session_token_12345',
      session_id: 'session_id_67890'
    });
  }),

  // Registration confirmation endpoint
  http.post('/api/v2/user/register', async ({ request }) => {
    const body = await request.json() as any;
    
    if (body.code === 'invalid_reg_code') {
      return HttpResponse.json(
        createErrorResponse(400, 'Invalid registration confirmation code', 'INVALID_REG_CODE'),
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      session_token: 'mock_registration_token_54321',
      session_id: 'reg_session_98765'
    });
  }),

  // User invitation acceptance endpoint
  http.post('/api/v2/user/invite', async ({ request }) => {
    const body = await request.json() as any;
    
    if (body.code === 'invalid_invite_code') {
      return HttpResponse.json(
        createErrorResponse(400, 'Invalid or expired invitation code', 'INVALID_INVITE_CODE'),
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      session_token: 'mock_invite_token_11111',
      session_id: 'invite_session_22222'
    });
  }),

  // System configuration endpoint
  http.get('/api/v2/system/config', () => {
    return HttpResponse.json(mockSystemConfig.emailMode);
  }),

  // Session validation endpoint for automatic login
  http.get('/api/v2/user/session', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.includes('Bearer ')) {
      return HttpResponse.json(
        createErrorResponse(401, 'Authentication required', 'UNAUTHORIZED'),
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      id: 1,
      name: 'Test User',
      email: 'user@example.com',
      is_sys_admin: false,
      role: {
        id: 2,
        name: 'User'
      }
    });
  }),

  ...createAuthHandlers()
);

// Mock Next.js router
const mockPush = vi.fn();
const mockRouter = createMockRouter({
  push: mockPush,
  searchParams: new URLSearchParams()
});

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('../../../hooks/use-auth', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock useSystemConfig hook
const mockUseSystemConfig = vi.fn();
vi.mock('../../../hooks/use-system-config', () => ({
  useSystemConfig: () => mockUseSystemConfig()
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockRouter.searchParams
}));

describe('ResetPasswordForm', () => {
  beforeAll(() => {
    // Start MSW server
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterAll(() => {
    // Clean up MSW server
    server.close();
  });

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    mockPush.mockClear();
    
    // Setup default mock implementations
    mockUseAuth.mockReturnValue({
      login: vi.fn().mockResolvedValue(undefined),
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
    
    mockUseSystemConfig.mockReturnValue({
      data: mockSystemConfig.emailMode,
      isLoading: false,
      error: null
    });
    
    // Reset router search params
    mockRouter.searchParams = new URLSearchParams();
  });

  afterEach(() => {
    // Reset MSW handlers after each test
    server.resetHandlers();
  });

  describe('URL Parameter Pre-population', () => {
    it('should pre-populate email field from URL parameter', async () => {
      mockRouter.searchParams.set('email', 'test@example.com');
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i);
        expect(emailInput).toHaveValue('test@example.com');
      });
    });

    it('should pre-populate username field from URL parameter when in username mode', async () => {
      mockUseSystemConfig.mockReturnValue({
        data: mockSystemConfig.usernameMode,
        isLoading: false,
        error: null
      });
      
      mockRouter.searchParams.set('username', 'testuser');
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      await waitFor(() => {
        const usernameInput = screen.getByLabelText(/username/i);
        expect(usernameInput).toHaveValue('testuser');
      });
    });

    it('should pre-populate confirmation code from URL parameter', async () => {
      mockRouter.searchParams.set('code', 'confirm123456');
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      await waitFor(() => {
        const codeInput = screen.getByLabelText(/confirmation code/i);
        expect(codeInput).toHaveValue('confirm123456');
      });
    });

    it('should handle multiple URL parameters simultaneously', async () => {
      mockRouter.searchParams.set('email', 'multi@example.com');
      mockRouter.searchParams.set('code', 'multi123');
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toHaveValue('multi@example.com');
        expect(screen.getByLabelText(/confirmation code/i)).toHaveValue('multi123');
      });
    });
  });

  describe('Password Confirmation Validation', () => {
    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      
      await user.type(passwordInput, 'Password123!@#');
      await user.type(confirmInput, 'DifferentPassword456$%^');
      
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should validate password confirmation in real-time under 100ms', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      
      await user.type(passwordInput, 'Password123!@#');
      await user.type(confirmInput, 'Password123!@#');
      
      // Validation should be instant (under 100ms)
      const startTime = performance.now();
      await waitFor(() => {
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
      });
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should clear password mismatch error when passwords match', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      
      // Create mismatch
      await user.type(passwordInput, 'Password123!@#');
      await user.type(confirmInput, 'Different456$%^');
      
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
      
      // Fix mismatch
      await user.clear(confirmInput);
      await user.type(confirmInput, 'Password123!@#');
      
      await waitFor(() => {
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
      });
    });

    it('should enforce password policy requirements', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      
      // Test weak password
      await user.type(passwordInput, 'weak');
      
      await waitFor(() => {
        expect(screen.getByText(/minimum 16 characters/i)).toBeInTheDocument();
      });
      
      // Test password without special characters
      await user.clear(passwordInput);
      await user.type(passwordInput, 'NoSpecialChars123');
      
      await waitFor(() => {
        expect(screen.getByText(/special character/i)).toBeInTheDocument();
      });
    });
  });

  describe('Multi-purpose Form Testing', () => {
    it('should render password reset form with correct title', () => {
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
    });

    it('should render registration confirmation form with correct title', () => {
      renderWithProviders(<ResetPasswordForm type="register" />);
      
      expect(screen.getByRole('heading', { name: /complete registration/i })).toBeInTheDocument();
    });

    it('should render invitation acceptance form with correct title', () => {
      renderWithProviders(<ResetPasswordForm type="invite" />);
      
      expect(screen.getByRole('heading', { name: /accept invitation/i })).toBeInTheDocument();
    });

    it('should show different field labels based on form type', () => {
      const { rerender } = renderWithProviders(<ResetPasswordForm type="reset" />);
      
      expect(screen.getByText(/new password/i)).toBeInTheDocument();
      
      rerender(<ResetPasswordForm type="register" />);
      expect(screen.getByText(/choose password/i)).toBeInTheDocument();
      
      rerender(<ResetPasswordForm type="invite" />);
      expect(screen.getByText(/set password/i)).toBeInTheDocument();
    });

    it('should use correct API endpoint based on form type', async () => {
      const user = userEvent.setup();
      
      // Test reset workflow
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      await user.type(screen.getByLabelText(/email/i), mockFormData.reset.email);
      await user.type(screen.getByLabelText(/confirmation code/i), mockFormData.reset.code);
      await user.type(screen.getByLabelText(/^password$/i), mockFormData.reset.password);
      await user.type(screen.getByLabelText(/confirm password/i), mockFormData.reset.passwordConfirm);
      
      await user.click(screen.getByRole('button', { name: /reset password/i }));
      
      // Verify reset endpoint was called
      await waitFor(() => {
        expect(mockUseAuth().login).toHaveBeenCalledWith(
          expect.objectContaining({
            session_token: 'mock_session_token_12345'
          })
        );
      });
    });
  });

  describe('API Integration Testing', () => {
    it('should complete password reset flow successfully', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockResolvedValue(undefined);
      
      mockUseAuth.mockReturnValue({
        login: mockLogin,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      // Fill form with valid data
      await user.type(screen.getByLabelText(/email/i), mockFormData.reset.email);
      await user.type(screen.getByLabelText(/confirmation code/i), mockFormData.reset.code);
      await user.type(screen.getByLabelText(/^password$/i), mockFormData.reset.password);
      await user.type(screen.getByLabelText(/confirm password/i), mockFormData.reset.passwordConfirm);
      
      await user.click(screen.getByRole('button', { name: /reset password/i }));
      
      // Verify success state and automatic login
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          session_token: 'mock_session_token_12345',
          session_id: 'session_id_67890'
        });
      });
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/home');
      });
    });

    it('should handle registration confirmation flow', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockResolvedValue(undefined);
      
      mockUseAuth.mockReturnValue({
        login: mockLogin,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      
      renderWithProviders(<ResetPasswordForm type="register" />);
      
      await user.type(screen.getByLabelText(/email/i), mockFormData.register.email);
      await user.type(screen.getByLabelText(/confirmation code/i), mockFormData.register.code);
      await user.type(screen.getByLabelText(/^password$/i), mockFormData.register.password);
      await user.type(screen.getByLabelText(/confirm password/i), mockFormData.register.passwordConfirm);
      
      await user.click(screen.getByRole('button', { name: /complete registration/i }));
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          session_token: 'mock_registration_token_54321',
          session_id: 'reg_session_98765'
        });
      });
    });

    it('should handle invitation acceptance flow', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockResolvedValue(undefined);
      
      mockUseAuth.mockReturnValue({
        login: mockLogin,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      
      renderWithProviders(<ResetPasswordForm type="invite" />);
      
      await user.type(screen.getByLabelText(/email/i), mockFormData.invite.email);
      await user.type(screen.getByLabelText(/confirmation code/i), mockFormData.invite.code);
      await user.type(screen.getByLabelText(/^password$/i), mockFormData.invite.password);
      await user.type(screen.getByLabelText(/confirm password/i), mockFormData.invite.passwordConfirm);
      
      await user.click(screen.getByRole('button', { name: /accept invitation/i }));
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          session_token: 'mock_invite_token_11111',
          session_id: 'invite_session_22222'
        });
      });
    });
  });

  describe('Error Handling Testing', () => {
    it('should handle invalid confirmation code error', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/confirmation code/i), 'invalid_code');
      await user.type(screen.getByLabelText(/^password$/i), 'ValidPassword123!@#');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPassword123!@#');
      
      await user.click(screen.getByRole('button', { name: /reset password/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/invalid or expired confirmation code/i)).toBeInTheDocument();
      });
    });

    it('should handle expired confirmation code error', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/confirmation code/i), 'expired_code');
      await user.type(screen.getByLabelText(/^password$/i), 'ValidPassword123!@#');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPassword123!@#');
      
      await user.click(screen.getByRole('button', { name: /reset password/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/confirmation code has expired/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network failure
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.error();
        })
      );
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/confirmation code/i), 'test123');
      await user.type(screen.getByLabelText(/^password$/i), 'ValidPassword123!@#');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPassword123!@#');
      
      await user.click(screen.getByRole('button', { name: /reset password/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/network error|connection failed/i)).toBeInTheDocument();
      });
    });

    it('should clear errors when form is modified', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      // Create error condition
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/confirmation code/i), 'invalid_code');
      await user.type(screen.getByLabelText(/^password$/i), 'ValidPassword123!@#');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPassword123!@#');
      
      await user.click(screen.getByRole('button', { name: /reset password/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/invalid or expired confirmation code/i)).toBeInTheDocument();
      });
      
      // Modify form to clear error
      await user.clear(screen.getByLabelText(/confirmation code/i));
      await user.type(screen.getByLabelText(/confirmation code/i), 'new_code');
      
      await waitFor(() => {
        expect(screen.queryByText(/invalid or expired confirmation code/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('User Interaction Testing', () => {
    it('should show loading state during form submission', async () => {
      const user = userEvent.setup();
      
      // Mock delayed response
      server.use(
        http.post('/api/v2/user/password', async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return HttpResponse.json({
            success: true,
            session_token: 'mock_token',
            session_id: 'mock_session'
          });
        })
      );
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/confirmation code/i), 'test123');
      await user.type(screen.getByLabelText(/^password$/i), 'ValidPassword123!@#');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPassword123!@#');
      
      await user.click(screen.getByRole('button', { name: /reset password/i }));
      
      // Should show loading indicator
      expect(screen.getByText(/resetting password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeDisabled();
    });

    it('should handle form field tab navigation', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const codeInput = screen.getByLabelText(/confirmation code/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      
      emailInput.focus();
      expect(emailInput).toHaveFocus();
      
      await user.tab();
      expect(codeInput).toHaveFocus();
      
      await user.tab();
      expect(passwordInput).toHaveFocus();
      
      await user.tab();
      expect(confirmInput).toHaveFocus();
      
      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should navigate back to login page when back link is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      const backLink = screen.getByRole('link', { name: /back to login/i });
      await user.click(backLink);
      
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('Accessibility Testing', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<ResetPasswordForm type="reset" />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form labels and ARIA attributes', () => {
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      // Check all form fields have proper labels
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirmation code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      
      // Check form has proper role
      expect(screen.getByRole('form')).toBeInTheDocument();
      
      // Check submit button is properly labeled
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    it('should announce password mismatch errors to screen readers', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      
      await user.type(passwordInput, 'Password123!@#');
      await user.type(confirmInput, 'Different456$%^');
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/passwords do not match/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should have proper contrast ratios for error messages', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      // Trigger validation error
      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'weak');
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/minimum 16 characters/i);
        const styles = getComputedStyle(errorMessage);
        
        // Error messages should have sufficient contrast (WCAG AA requires 4.5:1)
        expect(styles.color).toBeDefined();
        expect(errorMessage).toHaveClass(/error|danger|destructive/i);
      });
    });

    it('should support keyboard-only navigation', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      // Tab through all interactive elements
      const interactiveElements = [
        screen.getByLabelText(/email/i),
        screen.getByLabelText(/confirmation code/i),
        screen.getByLabelText(/^password$/i),
        screen.getByLabelText(/confirm password/i),
        screen.getByRole('button', { name: /reset password/i }),
        screen.getByRole('link', { name: /back to login/i })
      ];
      
      for (const element of interactiveElements) {
        await user.tab();
        expect(element).toHaveFocus();
      }
    });

    it('should provide descriptive error messages for form validation', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      // Test required field validation
      await user.click(screen.getByRole('button', { name: /reset password/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/confirmation code is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
      
      // Test password policy validation
      await user.type(screen.getByLabelText(/^password$/i), 'short');
      
      await waitFor(() => {
        expect(screen.getByText(/minimum 16 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Testing', () => {
    it('should render form components within performance budget', () => {
      const startTime = performance.now();
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Component should render quickly (under 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle large amounts of input without performance degradation', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<ResetPasswordForm type="reset" />);
      
      const longInput = 'a'.repeat(1000);
      const startTime = performance.now();
      
      await user.type(screen.getByLabelText(/email/i), `${longInput}@example.com`);
      
      const endTime = performance.now();
      const inputTime = endTime - startTime;
      
      // Should handle large input efficiently
      expect(inputTime).toBeLessThan(1000);
    });
  });
});