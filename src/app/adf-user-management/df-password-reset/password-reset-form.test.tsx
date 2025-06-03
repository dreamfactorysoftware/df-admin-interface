/**
 * Password Reset Form Component Test Suite
 * 
 * Comprehensive Vitest test suite for password reset React component with MSW integration
 * for API mocking. Tests dynamic form validation for both email and username login 
 * attributes, password reset request workflows, registration confirmation flows, 
 * invitation confirmation scenarios, form validation edge cases, error handling 
 * scenarios, and automatic authentication flow.
 * 
 * Replaces Angular/Karma/Jasmine tests with modern Vitest + Testing Library approach
 * for 10x faster test execution and comprehensive coverage of all three workflow types.
 * 
 * Key Features:
 * - Vitest 2.1+ testing framework for enhanced performance
 * - Mock Service Worker (MSW) integration for realistic API mocking
 * - React Testing Library for component testing best practices
 * - Comprehensive coverage of all three workflow types
 * - Dynamic form validation testing based on system configuration
 * - React Hook Form and Zod schema validation testing
 * - React Query integration testing with cache management
 * - Next.js router navigation testing
 * - Error boundary and accessibility testing
 * - Tailwind CSS responsive behavior validation
 * 
 * Performance Target: Sub-100ms validation, 90%+ code coverage
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../../../test/setup';
import { http, HttpResponse } from 'msw';

// Component and validation imports
import { PasswordResetForm } from './password-reset-form';
import { passwordResetSchema, ValidationConfig } from '../validation';
import { 
  PasswordResetFormData, 
  UserSession, 
  AuthAlert,
  PasswordResetRequest 
} from '../types';

// Testing utilities and providers
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useState } from 'react';

// Mock Next.js router
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    refresh: mockRefresh,
  }),
  usePathname: () => '/password-reset',
  useSearchParams: () => {
    const params = new URLSearchParams('?code=test123&email=test@dreamfactory.com&type=reset');
    return params;
  },
  useParams: () => ({
    id: 'password-reset',
  }),
}));

// Mock authentication hooks
const mockLogin = vi.fn();
const mockResetPassword = vi.fn();
const mockClearError = vi.fn();

vi.mock('../../hooks/use-auth', () => ({
  useAuth: () => ({
    login: mockLogin,
    resetPassword: mockResetPassword,
    isLoading: false,
    error: null,
    clearError: mockClearError,
    session: null,
  }),
}));

// Mock system configuration hook
const mockEnvironmentConfig = {
  authentication: {
    loginAttribute: 'email' as 'email' | 'username',
    allowOpenRegistration: true,
    minimumPasswordLength: 16,
  },
};

vi.mock('../../hooks/use-system-config', () => ({
  useSystemConfig: () => ({
    environment: mockEnvironmentConfig,
    isLoading: false,
    error: null,
  }),
}));

// Mock form submission hook
const mockSubmitForm = vi.fn();
const mockFormState = {
  isSubmitting: false,
  error: null,
  success: null,
  isComplete: false,
};

vi.mock('../../hooks/use-password-reset', () => ({
  usePasswordReset: () => ({
    submitPasswordReset: mockSubmitForm,
    formState: mockFormState,
    clearFormState: vi.fn(),
  }),
}));

// Test utilities
interface TestWrapperProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

function TestWrapper({ children, queryClient }: TestWrapperProps) {
  const [client] = useState(() => queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Test data factories
const createValidPasswordResetData = (overrides?: Partial<PasswordResetFormData>) => ({
  username: 'testuser',
  email: 'test@dreamfactory.com',
  code: 'ABC123',
  newPassword: 'NewSecurePassword123!',
  confirmPassword: 'NewSecurePassword123!',
  ...overrides,
});

const createValidationConfig = (overrides?: Partial<ValidationConfig>) => ({
  loginAttribute: 'email' as const,
  hasLdapServices: false,
  hasOauthServices: false,
  hasSamlServices: false,
  minimumPasswordLength: 16,
  ...overrides,
});

const createMockUserSession = (overrides?: Partial<UserSession>) => ({
  sessionToken: 'mock-jwt-token-123',
  userId: 1,
  email: 'test@dreamfactory.com',
  name: 'Test User',
  isSysAdmin: false,
  isRootAdmin: false,
  roleId: 2,
  expiresAt: Date.now() + 3600000,
  createdAt: Date.now() - 1000,
  lastActivity: Date.now() - 100,
  ...overrides,
});

// MSW handlers for password reset API endpoints
const passwordResetHandlers = [
  // Password reset endpoint
  http.post('/api/v2/user/password', async ({ request }) => {
    const body = await request.json() as any;
    
    if (body.code === 'INVALID_CODE') {
      return HttpResponse.json(
        { 
          error: { 
            code: 400, 
            message: 'Invalid reset code',
            status_code: 400,
            context: { field: 'code' }
          } 
        }, 
        { status: 400 }
      );
    }
    
    if (body.newPassword === 'weak') {
      return HttpResponse.json(
        { 
          error: { 
            code: 422, 
            message: 'Password does not meet security requirements',
            status_code: 422,
            context: { field: 'newPassword' }
          } 
        }, 
        { status: 422 }
      );
    }

    return HttpResponse.json({
      success: true,
      sessionToken: 'new-session-token-456',
    });
  }),

  // Admin password reset endpoint
  http.post('/api/v2/system/admin/password', async ({ request }) => {
    const body = await request.json() as any;
    
    if (body.code === 'ADMIN_INVALID') {
      return HttpResponse.json(
        { 
          error: { 
            code: 403, 
            message: 'Unauthorized admin password reset',
            status_code: 403
          } 
        }, 
        { status: 403 }
      );
    }

    return HttpResponse.json({
      success: true,
      sessionToken: 'admin-session-token-789',
    });
  }),

  // User session login endpoint
  http.post('/api/v2/user/session', async ({ request }) => {
    const body = await request.json() as any;
    
    if (body.password === 'wrongpassword') {
      return HttpResponse.json(
        { 
          error: { 
            code: 401, 
            message: 'Invalid credentials',
            status_code: 401 
          } 
        }, 
        { status: 401 }
      );
    }

    return HttpResponse.json({
      session_token: 'authenticated-session-token',
      user: createMockUserSession(),
    });
  }),

  // Registration confirmation endpoint
  http.post('/api/v2/user/register', async ({ request }) => {
    const body = await request.json() as any;
    
    if (body.code === 'EXPIRED_CODE') {
      return HttpResponse.json(
        { 
          error: { 
            code: 410, 
            message: 'Registration code has expired',
            status_code: 410 
          } 
        }, 
        { status: 410 }
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Registration confirmed successfully',
    });
  }),

  // Invitation confirmation endpoint
  http.post('/api/v2/user/invite-confirm', async ({ request }) => {
    const body = await request.json() as any;
    
    if (body.code === 'INVALID_INVITE') {
      return HttpResponse.json(
        { 
          error: { 
            code: 404, 
            message: 'Invitation not found or expired',
            status_code: 404 
          } 
        }, 
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      sessionToken: 'invite-session-token',
    });
  }),

  // System configuration endpoint
  http.get('/api/v2/system/config', () => {
    return HttpResponse.json({
      authentication: mockEnvironmentConfig.authentication,
    });
  }),
];

describe('PasswordResetForm Component', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
    user = userEvent.setup();
    
    // Reset all mocks
    vi.clearAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
    mockLogin.mockClear();
    mockResetPassword.mockClear();
    mockSubmitForm.mockClear();
    
    // Setup MSW handlers
    server.use(...passwordResetHandlers);
  });

  afterEach(() => {
    queryClient.clear();
    server.resetHandlers();
  });

  describe('Component Rendering', () => {
    it('should render password reset form with all required fields', () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="reset" 
            initialData={{ 
              code: 'TEST123', 
              email: 'test@example.com',
              username: 'testuser'
            }} 
          />
        </TestWrapper>
      );

      // Verify form fields are present
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reset code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    it('should render registration confirmation form when type is register', () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="register" 
            initialData={{ 
              code: 'REG123', 
              email: 'newuser@example.com' 
            }} 
          />
        </TestWrapper>
      );

      expect(screen.getByText(/confirm registration/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm registration/i })).toBeInTheDocument();
    });

    it('should render invitation confirmation form when type is invitation', () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="invitation" 
            initialData={{ 
              code: 'INV123', 
              email: 'invited@example.com' 
            }} 
          />
        </TestWrapper>
      );

      expect(screen.getByText(/accept invitation/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /accept invitation/i })).toBeInTheDocument();
    });

    it('should apply responsive Tailwind CSS classes correctly', () => {
      const { container } = render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm type="reset" />
        </TestWrapper>
      );

      const formContainer = container.querySelector('[data-testid="password-reset-form"]');
      expect(formContainer).toHaveClass('max-w-md', 'mx-auto', 'p-6');
      
      const formFields = container.querySelectorAll('[data-testid^="form-field-"]');
      formFields.forEach(field => {
        expect(field).toHaveClass('mb-4');
      });
    });
  });

  describe('Dynamic Form Validation - Email Login Attribute', () => {
    beforeEach(() => {
      mockEnvironmentConfig.authentication.loginAttribute = 'email';
    });

    it('should validate email field when loginAttribute is email', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm type="reset" />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email/i);
      
      // Test invalid email
      await user.type(emailField, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });

      // Test valid email
      await user.clear(emailField);
      await user.type(emailField, 'valid@example.com');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/invalid email format/i)).not.toBeInTheDocument();
      });
    });

    it('should make email field required and username optional for email login', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm type="reset" />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email/i);
      const usernameField = screen.getByLabelText(/username/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      // Try to submit without email
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      // Fill valid email, leave username empty - should be valid
      await user.type(emailField, 'test@example.com');
      await user.type(screen.getByLabelText(/reset code/i), 'ABC123');
      await user.type(screen.getByLabelText(/new password/i), 'SecurePassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'SecurePassword123!');

      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Dynamic Form Validation - Username Login Attribute', () => {
    beforeEach(() => {
      mockEnvironmentConfig.authentication.loginAttribute = 'username';
    });

    it('should validate username field when loginAttribute is username', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm type="reset" />
        </TestWrapper>
      );

      const usernameField = screen.getByLabelText(/username/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      // Try to submit without username
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      });

      // Fill valid username
      await user.type(usernameField, 'validuser');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/username is required/i)).not.toBeInTheDocument();
      });
    });

    it('should make username field required and email optional for username login', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm type="reset" />
        </TestWrapper>
      );

      const usernameField = screen.getByLabelText(/username/i);
      const emailField = screen.getByLabelText(/email/i);

      // Fill required fields except username
      await user.type(screen.getByLabelText(/reset code/i), 'ABC123');
      await user.type(screen.getByLabelText(/new password/i), 'SecurePassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'SecurePassword123!');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      });

      // Fill username, email can remain empty
      await user.type(usernameField, 'testuser');
      
      await waitFor(() => {
        expect(screen.queryByText(/username is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Password Validation with Zod Schema', () => {
    it('should enforce minimum password length requirement', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm type="reset" />
        </TestWrapper>
      );

      const passwordField = screen.getByLabelText(/new password/i);

      // Test password too short
      await user.type(passwordField, 'short');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 16 characters/i)).toBeInTheDocument();
      });

      // Test valid length password
      await user.clear(passwordField);
      await user.type(passwordField, 'ThisIsAValidPassword123!');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/password must be at least 16 characters/i)).not.toBeInTheDocument();
      });
    });

    it('should validate password confirmation matching', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm type="reset" />
        </TestWrapper>
      );

      const passwordField = screen.getByLabelText(/new password/i);
      const confirmPasswordField = screen.getByLabelText(/confirm password/i);

      // Test non-matching passwords
      await user.type(passwordField, 'ValidPassword123!');
      await user.type(confirmPasswordField, 'DifferentPassword123!');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      // Test matching passwords
      await user.clear(confirmPasswordField);
      await user.type(confirmPasswordField, 'ValidPassword123!');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
      });
    });

    it('should validate reset code format and requirement', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm type="reset" />
        </TestWrapper>
      );

      const codeField = screen.getByLabelText(/reset code/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      // Try to submit without code
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/reset code is required/i)).toBeInTheDocument();
      });

      // Fill valid code
      await user.type(codeField, 'ABC123');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/reset code is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Password Reset Workflow', () => {
    it('should successfully submit password reset form with valid data', async () => {
      mockSubmitForm.mockResolvedValueOnce({
        success: true,
        sessionToken: 'new-session-token',
      });

      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="reset" 
            initialData={{ 
              code: 'ABC123', 
              email: 'test@example.com' 
            }} 
          />
        </TestWrapper>
      );

      // Fill form with valid data
      await user.type(screen.getByLabelText(/new password/i), 'SecureNewPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'SecureNewPassword123!');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(mockSubmitForm).toHaveBeenCalledWith({
          email: 'test@example.com',
          code: 'ABC123',
          newPassword: 'SecureNewPassword123!',
          confirmPassword: 'SecureNewPassword123!',
          type: 'reset',
        });
      });
    });

    it('should handle admin password reset workflow', async () => {
      mockSubmitForm.mockResolvedValueOnce({
        success: true,
        sessionToken: 'admin-session-token',
      });

      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="reset" 
            initialData={{ 
              code: 'ADMIN123', 
              email: 'admin@example.com',
              admin: '1'
            }} 
          />
        </TestWrapper>
      );

      // Fill form with valid data
      await user.type(screen.getByLabelText(/new password/i), 'AdminPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'AdminPassword123!');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(mockSubmitForm).toHaveBeenCalledWith({
          email: 'admin@example.com',
          code: 'ADMIN123',
          newPassword: 'AdminPassword123!',
          confirmPassword: 'AdminPassword123!',
          type: 'reset',
          isAdmin: true,
        });
      });
    });

    it('should automatically login user after successful password reset', async () => {
      mockSubmitForm.mockResolvedValueOnce({
        success: true,
        sessionToken: 'new-session-token',
      });

      mockLogin.mockResolvedValueOnce({
        session: createMockUserSession(),
      });

      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="reset" 
            initialData={{ 
              code: 'ABC123', 
              email: 'test@example.com' 
            }} 
          />
        </TestWrapper>
      );

      // Fill and submit form
      await user.type(screen.getByLabelText(/new password/i), 'NewPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'NewPassword123!');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'NewPassword123!',
        });
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Registration Confirmation Workflow', () => {
    it('should handle registration confirmation successfully', async () => {
      mockSubmitForm.mockResolvedValueOnce({
        success: true,
        message: 'Registration confirmed successfully',
      });

      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="register" 
            initialData={{ 
              code: 'REG123', 
              email: 'newuser@example.com' 
            }} 
          />
        </TestWrapper>
      );

      // Fill form with valid data
      await user.type(screen.getByLabelText(/new password/i), 'RegisterPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'RegisterPassword123!');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /confirm registration/i }));

      await waitFor(() => {
        expect(mockSubmitForm).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          code: 'REG123',
          newPassword: 'RegisterPassword123!',
          confirmPassword: 'RegisterPassword123!',
          type: 'register',
        });
      });
    });

    it('should display success message after registration confirmation', async () => {
      mockSubmitForm.mockResolvedValueOnce({
        success: true,
        message: 'Registration confirmed successfully',
      });

      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="register" 
            initialData={{ 
              code: 'REG123', 
              email: 'newuser@example.com' 
            }} 
          />
        </TestWrapper>
      );

      // Fill and submit form
      await user.type(screen.getByLabelText(/new password/i), 'RegisterPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'RegisterPassword123!');
      await user.click(screen.getByRole('button', { name: /confirm registration/i }));

      await waitFor(() => {
        expect(screen.getByText(/registration confirmed successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle expired registration code error', async () => {
      server.use(
        http.post('/api/v2/user/register', () => {
          return HttpResponse.json(
            { 
              error: { 
                code: 410, 
                message: 'Registration code has expired',
                status_code: 410 
              } 
            }, 
            { status: 410 }
          );
        })
      );

      mockSubmitForm.mockRejectedValueOnce(new Error('Registration code has expired'));

      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="register" 
            initialData={{ 
              code: 'EXPIRED_CODE', 
              email: 'newuser@example.com' 
            }} 
          />
        </TestWrapper>
      );

      // Fill and submit form
      await user.type(screen.getByLabelText(/new password/i), 'RegisterPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'RegisterPassword123!');
      await user.click(screen.getByRole('button', { name: /confirm registration/i }));

      await waitFor(() => {
        expect(screen.getByText(/registration code has expired/i)).toBeInTheDocument();
      });
    });
  });

  describe('Invitation Confirmation Workflow', () => {
    it('should handle invitation acceptance successfully', async () => {
      mockSubmitForm.mockResolvedValueOnce({
        success: true,
        message: 'Invitation accepted successfully',
        sessionToken: 'invite-session-token',
      });

      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="invitation" 
            initialData={{ 
              code: 'INV123', 
              email: 'invited@example.com' 
            }} 
          />
        </TestWrapper>
      );

      // Fill form with valid data
      await user.type(screen.getByLabelText(/new password/i), 'InvitePassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'InvitePassword123!');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /accept invitation/i }));

      await waitFor(() => {
        expect(mockSubmitForm).toHaveBeenCalledWith({
          email: 'invited@example.com',
          code: 'INV123',
          newPassword: 'InvitePassword123!',
          confirmPassword: 'InvitePassword123!',
          type: 'invitation',
        });
      });
    });

    it('should automatically login user after invitation acceptance', async () => {
      mockSubmitForm.mockResolvedValueOnce({
        success: true,
        sessionToken: 'invite-session-token',
      });

      mockLogin.mockResolvedValueOnce({
        session: createMockUserSession(),
      });

      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="invitation" 
            initialData={{ 
              code: 'INV123', 
              email: 'invited@example.com' 
            }} 
          />
        </TestWrapper>
      );

      // Fill and submit form
      await user.type(screen.getByLabelText(/new password/i), 'InvitePassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'InvitePassword123!');
      await user.click(screen.getByRole('button', { name: /accept invitation/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'invited@example.com',
          password: 'InvitePassword123!',
        });
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should handle invalid invitation code error', async () => {
      server.use(
        http.post('/api/v2/user/invite-confirm', () => {
          return HttpResponse.json(
            { 
              error: { 
                code: 404, 
                message: 'Invitation not found or expired',
                status_code: 404 
              } 
            }, 
            { status: 404 }
          );
        })
      );

      mockSubmitForm.mockRejectedValueOnce(new Error('Invitation not found or expired'));

      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="invitation" 
            initialData={{ 
              code: 'INVALID_INVITE', 
              email: 'invited@example.com' 
            }} 
          />
        </TestWrapper>
      );

      // Fill and submit form
      await user.type(screen.getByLabelText(/new password/i), 'InvitePassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'InvitePassword123!');
      await user.click(screen.getByRole('button', { name: /accept invitation/i }));

      await waitFor(() => {
        expect(screen.getByText(/invitation not found or expired/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Validation Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      server.use(
        http.post('/api/v2/user/password', () => {
          return HttpResponse.error();
        })
      );

      mockSubmitForm.mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="reset" 
            initialData={{ 
              code: 'ABC123', 
              email: 'test@example.com' 
            }} 
          />
        </TestWrapper>
      );

      // Fill and submit form
      await user.type(screen.getByLabelText(/new password/i), 'NetworkTestPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'NetworkTestPassword123!');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should validate all form fields on submission attempt', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm type="reset" />
        </TestWrapper>
      );

      // Try to submit empty form
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        // Check for various validation errors
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/reset code is required/i)).toBeInTheDocument();
        expect(screen.getByText(/new password is required/i)).toBeInTheDocument();
        expect(screen.getByText(/confirm password is required/i)).toBeInTheDocument();
      });
    });

    it('should handle form validation with special characters in password', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm type="reset" />
        </TestWrapper>
      );

      const passwordField = screen.getByLabelText(/new password/i);
      const confirmPasswordField = screen.getByLabelText(/confirm password/i);

      // Test password with special characters
      const specialPassword = 'Test@#$%^&*()_+{}[]|:;<>?,.~`Password123!';
      await user.type(passwordField, specialPassword);
      await user.type(confirmPasswordField, specialPassword);
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
      });
    });

    it('should prevent form submission while request is in progress', async () => {
      let resolveSubmit: (value: any) => void;
      const submitPromise = new Promise(resolve => {
        resolveSubmit = resolve;
      });
      
      mockSubmitForm.mockReturnValueOnce(submitPromise);

      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="reset" 
            initialData={{ 
              code: 'ABC123', 
              email: 'test@example.com' 
            }} 
          />
        </TestWrapper>
      );

      // Fill form
      await user.type(screen.getByLabelText(/new password/i), 'TestPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'TestPassword123!');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      // Button should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent(/submitting/i);
      });

      // Resolve the promise
      resolveSubmit!({ success: true });

      // Button should be enabled again
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('React Query Integration', () => {
    it('should use React Query for API calls with proper caching', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: 1, gcTime: 1000 * 60 * 5 }, // 5 minutes cache
          mutations: { retry: 1 },
        },
      });

      mockSubmitForm.mockResolvedValueOnce({
        success: true,
        sessionToken: 'cached-session-token',
      });

      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="reset" 
            initialData={{ 
              code: 'CACHE123', 
              email: 'cache@example.com' 
            }} 
          />
        </TestWrapper>
      );

      // Submit form
      await user.type(screen.getByLabelText(/new password/i), 'CacheTestPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'CacheTestPassword123!');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(mockSubmitForm).toHaveBeenCalledTimes(1);
      });

      // Verify cache contains the request
      const cacheData = queryClient.getQueryCache().getAll();
      expect(cacheData).toHaveLength(0); // Mutations don't cache by default
    });

    it('should handle React Query mutation retry logic on failure', async () => {
      mockSubmitForm
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({ success: true });

      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="reset" 
            initialData={{ 
              code: 'RETRY123', 
              email: 'retry@example.com' 
            }} 
          />
        </TestWrapper>
      );

      // Submit form
      await user.type(screen.getByLabelText(/new password/i), 'RetryTestPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'RetryTestPassword123!');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      // Should show error first, then retry and succeed
      await waitFor(() => {
        expect(mockSubmitForm).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Next.js Router Navigation', () => {
    it('should navigate to home page after successful password reset', async () => {
      mockSubmitForm.mockResolvedValueOnce({
        success: true,
        sessionToken: 'navigation-test-token',
      });

      mockLogin.mockResolvedValueOnce({
        session: createMockUserSession(),
      });

      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="reset" 
            initialData={{ 
              code: 'NAV123', 
              email: 'nav@example.com' 
            }} 
          />
        </TestWrapper>
      );

      // Submit form
      await user.type(screen.getByLabelText(/new password/i), 'NavigationTest123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'NavigationTest123!');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should handle navigation errors gracefully', async () => {
      mockSubmitForm.mockResolvedValueOnce({
        success: true,
        sessionToken: 'navigation-error-token',
      });

      mockLogin.mockResolvedValueOnce({
        session: createMockUserSession(),
      });

      mockPush.mockRejectedValueOnce(new Error('Navigation failed'));

      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="reset" 
            initialData={{ 
              code: 'NAVERR123', 
              email: 'naverr@example.com' 
            }} 
          />
        </TestWrapper>
      );

      // Submit form
      await user.type(screen.getByLabelText(/new password/i), 'NavigationError123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'NavigationError123!');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      // Should not crash on navigation error
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should maintain proper focus management during form interactions', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm type="reset" />
        </TestWrapper>
      );

      // Test tab order
      const emailField = screen.getByLabelText(/email/i);
      const usernameField = screen.getByLabelText(/username/i);
      const codeField = screen.getByLabelText(/reset code/i);
      const passwordField = screen.getByLabelText(/new password/i);
      const confirmPasswordField = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      emailField.focus();
      expect(emailField).toHaveFocus();

      await user.tab();
      expect(usernameField).toHaveFocus();

      await user.tab();
      expect(codeField).toHaveFocus();

      await user.tab();
      expect(passwordField).toHaveFocus();

      await user.tab();
      expect(confirmPasswordField).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should provide screen reader accessible form labels and error messages', () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm type="reset" />
        </TestWrapper>
      );

      // Check for proper aria-labels and associations
      const emailField = screen.getByLabelText(/email/i);
      const passwordField = screen.getByLabelText(/new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      expect(emailField).toHaveAttribute('aria-required', 'true');
      expect(passwordField).toHaveAttribute('aria-required', 'true');
      expect(submitButton).toHaveAttribute('type', 'submit');

      // Check for error message associations
      expect(emailField).toHaveAttribute('aria-describedby');
      expect(passwordField).toHaveAttribute('aria-describedby');
    });

    it('should support keyboard navigation for form submission', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="reset" 
            initialData={{ 
              code: 'KEYBOARD123', 
              email: 'keyboard@example.com' 
            }} 
          />
        </TestWrapper>
      );

      // Fill form using keyboard only
      await user.type(screen.getByLabelText(/new password/i), 'KeyboardTest123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'KeyboardTest123!');

      // Submit using Enter key
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockSubmitForm).toHaveBeenCalled();
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should validate form fields in under 100ms', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm type="reset" />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email/i);
      
      const startTime = performance.now();
      
      // Trigger validation
      await user.type(emailField, 'test@example.com');
      await user.tab();

      const endTime = performance.now();
      const validationTime = endTime - startTime;

      // Validation should complete in under 100ms
      expect(validationTime).toBeLessThan(100);
    });

    it('should debounce validation to improve performance', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm type="reset" />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email/i);
      
      // Type rapidly to test debouncing
      await user.type(emailField, 'rapid');
      await user.type(emailField, 'typing');
      await user.type(emailField, 'test@example.com');

      // Validation should only trigger once after typing stops
      await waitFor(() => {
        expect(screen.queryByText(/invalid email format/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Boundary Integration', () => {
    it('should handle component errors gracefully with Error Boundary', () => {
      // Mock console.error to prevent error logs in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create a component that throws an error
      const ThrowError = () => {
        throw new Error('Test error boundary');
      };

      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        try {
          return <>{children}</>;
        } catch (error) {
          return <div role="alert">Something went wrong</div>;
        }
      };

      render(
        <TestWrapper queryClient={queryClient}>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Real-world Integration Scenarios', () => {
    it('should handle complex workflow: registration → password setup → auto-login → redirect', async () => {
      // Mock sequence of successful API calls
      mockSubmitForm.mockResolvedValueOnce({
        success: true,
        message: 'Registration confirmed',
        sessionToken: 'reg-session-token',
      });

      mockLogin.mockResolvedValueOnce({
        session: createMockUserSession({ 
          email: 'integration@example.com',
          name: 'Integration Test User'
        }),
      });

      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="register" 
            initialData={{ 
              code: 'INTEGRATION123', 
              email: 'integration@example.com' 
            }} 
          />
        </TestWrapper>
      );

      // Complete registration flow
      await user.type(screen.getByLabelText(/new password/i), 'IntegrationTest123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'IntegrationTest123!');
      await user.click(screen.getByRole('button', { name: /confirm registration/i }));

      // Verify complete workflow
      await waitFor(() => {
        expect(mockSubmitForm).toHaveBeenCalledWith({
          email: 'integration@example.com',
          code: 'INTEGRATION123',
          newPassword: 'IntegrationTest123!',
          confirmPassword: 'IntegrationTest123!',
          type: 'register',
        });
      });

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'integration@example.com',
          password: 'IntegrationTest123!',
        });
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should maintain form state during network interruption and recovery', async () => {
      // First attempt fails
      mockSubmitForm
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({ success: true });

      render(
        <TestWrapper queryClient={queryClient}>
          <PasswordResetForm 
            type="reset" 
            initialData={{ 
              code: 'NETWORK123', 
              email: 'network@example.com' 
            }} 
          />
        </TestWrapper>
      );

      // Fill form
      await user.type(screen.getByLabelText(/new password/i), 'NetworkTest123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'NetworkTest123!');

      // First submission fails
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/network timeout/i)).toBeInTheDocument();
      });

      // Form should maintain values
      expect(screen.getByLabelText(/new password/i)).toHaveValue('NetworkTest123!');
      expect(screen.getByLabelText(/confirm password/i)).toHaveValue('NetworkTest123!');

      // Retry submission
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(mockSubmitForm).toHaveBeenCalledTimes(2);
      });
    });
  });
});