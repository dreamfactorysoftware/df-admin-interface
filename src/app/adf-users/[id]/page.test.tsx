/**
 * Comprehensive Vitest test suite for User Edit Page Component
 * 
 * Tests the React/Next.js user edit page functionality including form validation,
 * data fetching, submission workflows, and error scenarios. Implements modern
 * testing patterns with Vitest, React Testing Library, and Mock Service Worker.
 * 
 * Migration from Angular TestBed to React Testing Library patterns per Section 4.7.1.3
 * testing infrastructure setup with 10x faster test execution using Vitest.
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextRouter } from 'next/router';
import { useRouter, useParams } from 'next/navigation';
import { server } from '../../../test/mocks/server';
import { rest } from 'msw';
import UserEditPage from './page';
import { 
  mockUserProfile, 
  mockUserRoles, 
  mockUserApps,
  createMockUser,
  mockAdminUser 
} from '../../../test/mocks/user-data';
import { 
  UserProfile, 
  UserRole, 
  UserApp,
  userProfileUpdateSchema,
  changePasswordSchema 
} from '../../../types/user';
import { APIResponse } from '../../../types/api';

// ============================================================================
// Mock Setup and Configuration
// ============================================================================

// Mock Next.js router hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
}));

// Mock use-users hook
vi.mock('../../../hooks/use-users', () => ({
  useUser: vi.fn(),
  useUpdateUser: vi.fn(),
  useDeleteUser: vi.fn(),
  useUserRoles: vi.fn(),
  useUserApps: vi.fn(),
  useAssignUserRole: vi.fn(),
  useRemoveUserRole: vi.fn(),
}));

// Mock Zod validation schemas
vi.mock('../../../lib/validations/user', () => ({
  userProfileUpdateSchema: {
    parse: vi.fn(),
    safeParse: vi.fn(),
  },
  changePasswordSchema: {
    parse: vi.fn(),
    safeParse: vi.fn(),
  },
}));

// ============================================================================
// Test Data Factories
// ============================================================================

/**
 * Factory for creating mock user profiles with realistic data
 */
const createTestUser = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: 1,
  name: 'John Doe',
  first_name: 'John',
  last_name: 'Doe',
  display_name: 'John Doe',
  email: 'john.doe@dreamfactory.com',
  username: 'johndoe',
  phone: '+1-555-0123',
  is_active: true,
  is_sys_admin: false,
  created_date: '2024-01-15T10:30:00.000Z',
  last_modified_date: '2024-01-15T10:30:00.000Z',
  email_verified_at: '2024-01-15T10:30:00.000Z',
  default_app_id: 1,
  timezone: 'UTC',
  locale: 'en',
  theme_preference: 'light',
  notification_preferences: {
    email_notifications: true,
    system_alerts: true,
    api_quota_warnings: true,
    security_notifications: true,
    maintenance_notifications: false,
  },
  user_to_app_to_role_by_user_id: [],
  user_lookup_by_user_id: [],
  ...overrides,
});

/**
 * Factory for creating mock user roles
 */
const createTestRole = (overrides: Partial<UserRole> = {}): UserRole => ({
  id: 1,
  name: 'Editor',
  description: 'Content Editor Role',
  is_active: true,
  created_date: '2024-01-01T00:00:00.000Z',
  last_modified_date: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

/**
 * Factory for creating mock user apps
 */
const createTestApp = (overrides: Partial<UserApp> = {}): UserApp => ({
  id: 1,
  name: 'Admin Console',
  description: 'DreamFactory Admin Console',
  is_active: true,
  type: 'Web App',
  path: '/admin',
  url: '/admin',
  requires_fullscreen: false,
  allow_fullscreen_toggle: true,
  created_date: '2024-01-01T00:00:00.000Z',
  last_modified_date: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

/**
 * Factory for API error responses
 */
const createApiError = (status: number, message: string, field?: string) => ({
  success: false,
  error: {
    code: status,
    message,
    field,
    details: field ? { [field]: [message] } : undefined,
  },
});

// ============================================================================
// Test Utilities and Wrappers
// ============================================================================

/**
 * Custom test wrapper with QueryClient and providers
 */
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
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
 * Helper to render component with test wrapper
 */
const renderUserEditPage = (userId: string = '1') => {
  (useParams as any).mockReturnValue({ id: userId });
  
  return render(
    <TestWrapper>
      <UserEditPage />
    </TestWrapper>
  );
};

// ============================================================================
// MSW Handlers for API Mocking
// ============================================================================

const mockHandlers = {
  // Get user by ID
  getUserSuccess: (user: UserProfile) =>
    rest.get('/api/v2/system/user/:id', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: user,
        })
      );
    }),

  // Get user roles
  getUserRolesSuccess: (roles: UserRole[]) =>
    rest.get('/api/v2/system/role', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: roles,
          meta: { total: roles.length, count: roles.length },
        })
      );
    }),

  // Get user apps
  getUserAppsSuccess: (apps: UserApp[]) =>
    rest.get('/api/v2/system/app', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: apps,
          meta: { total: apps.length, count: apps.length },
        })
      );
    }),

  // Update user success
  updateUserSuccess: (user: UserProfile) =>
    rest.put('/api/v2/system/user/:id', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: user,
        })
      );
    }),

  // Update user validation error
  updateUserValidationError: (field: string, message: string) =>
    rest.put('/api/v2/system/user/:id', (req, res, ctx) => {
      return res(
        ctx.status(422),
        ctx.json(createApiError(422, message, field))
      );
    }),

  // Update user server error
  updateUserServerError: () =>
    rest.put('/api/v2/system/user/:id', (req, res, ctx) => {
      return res(
        ctx.status(500),
        ctx.json(createApiError(500, 'Internal server error'))
      );
    }),

  // Delete user success
  deleteUserSuccess: () =>
    rest.delete('/api/v2/system/user/:id', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          message: 'User deleted successfully',
        })
      );
    }),

  // User not found
  userNotFound: () =>
    rest.get('/api/v2/system/user/:id', (req, res, ctx) => {
      return res(
        ctx.status(404),
        ctx.json(createApiError(404, 'User not found'))
      );
    }),
};

// ============================================================================
// Test Suite Setup
// ============================================================================

describe('UserEditPage', () => {
  const mockPush = vi.fn();
  const mockRouter = {
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/adf-users/1',
    query: { id: '1' },
  } as unknown as NextRouter;

  beforeAll(() => {
    // Start MSW server
    server.listen({ onUnhandledRequest: 'error' });
  });

  beforeEach(() => {
    // Reset router mock
    (useRouter as any).mockReturnValue(mockRouter);
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default successful responses
    server.use(
      mockHandlers.getUserSuccess(createTestUser()),
      mockHandlers.getUserRolesSuccess([createTestRole()]),
      mockHandlers.getUserAppsSuccess([createTestApp()])
    );
  });

  afterEach(() => {
    // Reset MSW handlers
    server.resetHandlers();
  });

  afterAll(() => {
    // Stop MSW server
    server.close();
  });

  // ============================================================================
  // Component Rendering Tests
  // ============================================================================

  describe('Component Rendering', () => {
    it('should render user edit page successfully', async () => {
      renderUserEditPage();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Verify page title and form elements are present
      expect(screen.getByRole('heading', { name: /edit user/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('should display loading state while fetching user data', async () => {
      renderUserEditPage();

      // Verify loading spinner is displayed initially
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
    });

    it('should display error message when user is not found', async () => {
      server.use(mockHandlers.userNotFound());

      renderUserEditPage();

      await waitFor(() => {
        expect(screen.getByText(/user not found/i)).toBeInTheDocument();
      });
    });

    it('should populate form fields with user data', async () => {
      const testUser = createTestUser({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-9876',
      });

      server.use(mockHandlers.getUserSuccess(testUser));

      renderUserEditPage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
        expect(screen.getByDisplayValue('jane.smith@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('+1-555-9876')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Form Validation Tests
  // ============================================================================

  describe('Form Validation', () => {
    it('should display validation errors for required fields', async () => {
      const user = userEvent.setup();
      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Clear required fields
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const emailInput = screen.getByLabelText(/email/i);

      await user.clear(firstNameInput);
      await user.clear(lastNameInput);
      await user.clear(emailInput);

      // Trigger validation by attempting to save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Verify validation errors are displayed
      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');

      // Trigger validation
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });

    it('should validate password confirmation match', async () => {
      const user = userEvent.setup();
      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Toggle to password mode
      const setPasswordRadio = screen.getByLabelText(/set password/i);
      await user.click(setPasswordRadio);

      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'Different123!');

      // Trigger validation
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });
    });

    it('should validate password strength requirements', async () => {
      const user = userEvent.setup();
      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Toggle to password mode
      const setPasswordRadio = screen.getByLabelText(/set password/i);
      await user.click(setPasswordRadio);

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'weak');

      // Trigger validation
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Data Fetching Tests (SWR Integration)
  // ============================================================================

  describe('Data Fetching with SWR', () => {
    it('should fetch user data on component mount', async () => {
      const testUser = createTestUser({ id: 42 });
      server.use(mockHandlers.getUserSuccess(testUser));

      renderUserEditPage('42');

      await waitFor(() => {
        expect(screen.getByDisplayValue(testUser.first_name!)).toBeInTheDocument();
        expect(screen.getByDisplayValue(testUser.email)).toBeInTheDocument();
      });
    });

    it('should fetch user roles and apps for assignment', async () => {
      const testRoles = [
        createTestRole({ id: 1, name: 'Admin' }),
        createTestRole({ id: 2, name: 'Editor' }),
      ];
      const testApps = [
        createTestApp({ id: 1, name: 'Admin Console' }),
        createTestApp({ id: 2, name: 'User Portal' }),
      ];

      server.use(
        mockHandlers.getUserSuccess(createTestUser()),
        mockHandlers.getUserRolesSuccess(testRoles),
        mockHandlers.getUserAppsSuccess(testApps)
      );

      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Navigate to roles tab
      const rolesTab = screen.getByRole('tab', { name: /roles/i });
      await userEvent.click(rolesTab);

      await waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('Editor')).toBeInTheDocument();
        expect(screen.getByText('Admin Console')).toBeInTheDocument();
        expect(screen.getByText('User Portal')).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      server.use(
        rest.get('/api/v2/system/user/:id', (req, res, ctx) => {
          return res.networkError('Network connection failed');
        })
      );

      renderUserEditPage();

      await waitFor(() => {
        expect(screen.getByText(/failed to load user data/i)).toBeInTheDocument();
      });
    });

    it('should retry failed requests on user action', async () => {
      let requestCount = 0;
      server.use(
        rest.get('/api/v2/system/user/:id', (req, res, ctx) => {
          requestCount++;
          if (requestCount === 1) {
            return res.networkError('Network connection failed');
          }
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: createTestUser(),
            })
          );
        })
      );

      renderUserEditPage();

      await waitFor(() => {
        expect(screen.getByText(/failed to load user data/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await userEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      expect(requestCount).toBe(2);
    });
  });

  // ============================================================================
  // Form Submission Tests
  // ============================================================================

  describe('Form Submission', () => {
    it('should successfully update user profile', async () => {
      const user = userEvent.setup();
      const updatedUser = createTestUser({
        first_name: 'Updated',
        last_name: 'Name',
        email: 'updated@example.com',
      });

      server.use(
        mockHandlers.getUserSuccess(createTestUser()),
        mockHandlers.updateUserSuccess(updatedUser)
      );

      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Update form fields
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const emailInput = screen.getByLabelText(/email/i);

      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Updated');
      await user.clear(lastNameInput);
      await user.type(lastNameInput, 'Name');
      await user.clear(emailInput);
      await user.type(emailInput, 'updated@example.com');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Verify success message and navigation
      await waitFor(() => {
        expect(screen.getByText(/user updated successfully/i)).toBeInTheDocument();
      });

      expect(mockPush).toHaveBeenCalledWith('/adf-users');
    });

    it('should handle validation errors from server', async () => {
      const user = userEvent.setup();
      
      server.use(
        mockHandlers.getUserSuccess(createTestUser()),
        mockHandlers.updateUserValidationError('email', 'Email already exists')
      );

      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Verify server error is displayed
      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });

    it('should handle server errors gracefully', async () => {
      const user = userEvent.setup();
      
      server.use(
        mockHandlers.getUserSuccess(createTestUser()),
        mockHandlers.updateUserServerError()
      );

      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Verify generic error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });

    it('should prevent submission while request is in progress', async () => {
      const user = userEvent.setup();
      
      // Create a delayed response
      server.use(
        rest.put('/api/v2/system/user/:id', (req, res, ctx) => {
          return res(
            ctx.delay(1000),
            ctx.status(200),
            ctx.json({
              success: true,
              data: createTestUser(),
            })
          );
        })
      );

      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Verify button is disabled and shows loading state
      expect(saveButton).toBeDisabled();
      expect(screen.getByText(/saving/i)).toBeInTheDocument();

      // Verify multiple clicks don't trigger multiple requests
      await user.click(saveButton);
      await user.click(saveButton);

      // Should still only show one loading state
      expect(screen.getAllByText(/saving/i)).toHaveLength(1);
    });
  });

  // ============================================================================
  // User Role Management Tests
  // ============================================================================

  describe('User Role Management', () => {
    it('should display assigned roles and apps', async () => {
      const userWithRoles = createTestUser({
        user_to_app_to_role_by_user_id: [
          {
            id: 1,
            user_id: 1,
            app_id: 1,
            role_id: 1,
            app: createTestApp({ id: 1, name: 'Admin Console' }),
            role: createTestRole({ id: 1, name: 'Admin' }),
          },
        ],
      });

      server.use(mockHandlers.getUserSuccess(userWithRoles));

      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Navigate to roles tab
      const rolesTab = screen.getByRole('tab', { name: /roles/i });
      await userEvent.click(rolesTab);

      await waitFor(() => {
        expect(screen.getByText('Admin Console')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
      });
    });

    it('should allow assigning new roles', async () => {
      const user = userEvent.setup();
      const testRoles = [createTestRole({ id: 2, name: 'Editor' })];
      const testApps = [createTestApp({ id: 2, name: 'Content Management' })];

      server.use(
        mockHandlers.getUserSuccess(createTestUser()),
        mockHandlers.getUserRolesSuccess(testRoles),
        mockHandlers.getUserAppsSuccess(testApps),
        rest.post('/api/v2/system/user_app_role', (req, res, ctx) => {
          return res(
            ctx.status(201),
            ctx.json({
              success: true,
              data: {
                id: 2,
                user_id: 1,
                app_id: 2,
                role_id: 2,
              },
            })
          );
        })
      );

      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Navigate to roles tab
      const rolesTab = screen.getByRole('tab', { name: /roles/i });
      await user.click(rolesTab);

      // Add new role assignment
      const addRoleButton = screen.getByRole('button', { name: /add role/i });
      await user.click(addRoleButton);

      // Select app and role
      const appSelect = screen.getByLabelText(/application/i);
      const roleSelect = screen.getByLabelText(/role/i);

      await user.selectOptions(appSelect, '2');
      await user.selectOptions(roleSelect, '2');

      const assignButton = screen.getByRole('button', { name: /assign role/i });
      await user.click(assignButton);

      await waitFor(() => {
        expect(screen.getByText(/role assigned successfully/i)).toBeInTheDocument();
      });
    });

    it('should allow removing assigned roles', async () => {
      const user = userEvent.setup();
      const userWithRoles = createTestUser({
        user_to_app_to_role_by_user_id: [
          {
            id: 1,
            user_id: 1,
            app_id: 1,
            role_id: 1,
            app: createTestApp({ id: 1, name: 'Admin Console' }),
            role: createTestRole({ id: 1, name: 'Admin' }),
          },
        ],
      });

      server.use(
        mockHandlers.getUserSuccess(userWithRoles),
        rest.delete('/api/v2/system/user_app_role/:id', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              message: 'Role removed successfully',
            })
          );
        })
      );

      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Navigate to roles tab
      const rolesTab = screen.getByRole('tab', { name: /roles/i });
      await user.click(rolesTab);

      // Remove role assignment
      const removeButton = screen.getByRole('button', { name: /remove role/i });
      await user.click(removeButton);

      // Confirm removal
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/role removed successfully/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Password Management Tests
  // ============================================================================

  describe('Password Management', () => {
    it('should toggle between email invitation and password setting modes', async () => {
      const user = userEvent.setup();
      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Initially should show email invitation option
      const emailInviteRadio = screen.getByLabelText(/send email invitation/i);
      expect(emailInviteRadio).toBeChecked();

      // Switch to set password mode
      const setPasswordRadio = screen.getByLabelText(/set password/i);
      await user.click(setPasswordRadio);

      await waitFor(() => {
        expect(setPasswordRadio).toBeChecked();
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      });

      // Switch back to email invitation
      await user.click(emailInviteRadio);

      await waitFor(() => {
        expect(emailInviteRadio).toBeChecked();
        expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument();
      });
    });

    it('should send invitation email when email mode is selected', async () => {
      const user = userEvent.setup();
      
      server.use(
        mockHandlers.getUserSuccess(createTestUser()),
        rest.patch('/api/v2/system/user/:id', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              message: 'Invitation email sent successfully',
            })
          );
        })
      );

      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Ensure email invitation is selected
      const emailInviteRadio = screen.getByLabelText(/send email invitation/i);
      await user.click(emailInviteRadio);

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/invitation email sent successfully/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // Accessibility Tests (WCAG 2.1 AA Compliance)
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Check for proper heading structure
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent(/edit user/i);

      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(sectionHeadings.length).toBeGreaterThan(0);
    });

    it('should have proper form labels and descriptions', async () => {
      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Check that all form inputs have proper labels
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const emailInput = screen.getByLabelText(/email/i);

      expect(firstNameInput).toHaveAttribute('aria-required', 'true');
      expect(lastNameInput).toHaveAttribute('aria-required', 'true');
      expect(emailInput).toHaveAttribute('aria-required', 'true');
    });

    it('should announce form validation errors to screen readers', async () => {
      const user = userEvent.setup();
      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Clear required field to trigger validation error
      const emailInput = screen.getByLabelText(/email/i);
      await user.clear(emailInput);

      // Trigger validation
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/email is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should support keyboard navigation', async () => {
      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const emailInput = screen.getByLabelText(/email/i);

      // Test tab navigation
      firstNameInput.focus();
      expect(document.activeElement).toBe(firstNameInput);

      fireEvent.keyDown(firstNameInput, { key: 'Tab' });
      expect(document.activeElement).toBe(lastNameInput);

      fireEvent.keyDown(lastNameInput, { key: 'Tab' });
      expect(document.activeElement).toBe(emailInput);
    });

    it('should have proper ARIA attributes for dynamic content', async () => {
      renderUserEditPage();

      // Loading state should have proper ARIA attributes
      const loadingSpinner = screen.getByTestId('loading-spinner');
      expect(loadingSpinner).toHaveAttribute('aria-busy', 'true');
      expect(loadingSpinner).toHaveAttribute('aria-label', 'Loading user data');

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Form should have proper ARIA attributes
      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-labelledby');
    });

    it('should provide clear focus indicators', async () => {
      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/first name/i);
      firstNameInput.focus();

      // Check that focus styles are applied
      expect(firstNameInput).toHaveFocus();
      expect(firstNameInput).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
    });
  });

  // ============================================================================
  // Error Boundary Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle unexpected component errors gracefully', async () => {
      // Mock console.error to prevent noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Force a React error by providing invalid props
      const InvalidComponent = () => {
        throw new Error('Test error');
      };

      render(
        <TestWrapper>
          <InvalidComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should provide error recovery options', async () => {
      server.use(mockHandlers.userNotFound());

      renderUserEditPage();

      await waitFor(() => {
        expect(screen.getByText(/user not found/i)).toBeInTheDocument();
      });

      // Should provide navigation back to users list
      const backButton = screen.getByRole('button', { name: /back to users/i });
      expect(backButton).toBeInTheDocument();

      await userEvent.click(backButton);
      expect(mockPush).toHaveBeenCalledWith('/adf-users');
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('Performance', () => {
    it('should load and render within acceptable time limits', async () => {
      const startTime = performance.now();
      
      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 2 seconds as per SSR requirements
      expect(renderTime).toBeLessThan(2000);
    });

    it('should handle large datasets efficiently', async () => {
      // Create a large number of roles and apps
      const largeRolesList = Array.from({ length: 100 }, (_, i) =>
        createTestRole({ id: i + 1, name: `Role ${i + 1}` })
      );
      const largeAppsList = Array.from({ length: 100 }, (_, i) =>
        createTestApp({ id: i + 1, name: `App ${i + 1}` })
      );

      server.use(
        mockHandlers.getUserSuccess(createTestUser()),
        mockHandlers.getUserRolesSuccess(largeRolesList),
        mockHandlers.getUserAppsSuccess(largeAppsList)
      );

      const startTime = performance.now();
      renderUserEditPage();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Navigate to roles tab
      const rolesTab = screen.getByRole('tab', { name: /roles/i });
      await userEvent.click(rolesTab);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should handle large datasets efficiently
      expect(renderTime).toBeLessThan(3000);
    });
  });
});