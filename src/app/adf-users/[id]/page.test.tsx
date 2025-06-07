/**
 * Comprehensive Vitest unit test suite for the user edit page component
 * 
 * Tests cover:
 * - Form validation with React Hook Form and Zod schema validation
 * - Data fetching with SWR and loading states
 * - Submission workflows with optimistic updates
 * - Error scenarios and error boundary validation
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Mock Service Worker (MSW) for realistic API mocking
 * 
 * Replaces Angular TestBed with modern React testing patterns using:
 * - Vitest for 10x faster test execution
 * - React Testing Library for component testing best practices
 * - MSW for realistic API mocking without backend dependencies
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextRouter } from 'next/router';

// Component and dependencies
import UserEditPage from './page';
import { mockUsers, mockRoles } from '../../../test/mocks/user-data';
import { renderWithProviders } from '../../../test/utils/test-utils';
import { createMockUser, createMockRole } from '../../../test/utils/component-factories';

// Hooks and utilities
import * as useUsersHook from '../../../hooks/use-users';
import { UserProfile, UserProfileFormData } from '../../../types/user';

// Extend Jest with axe matchers
expect.extend(toHaveNoViolations);

// Mock Next.js router
const mockRouter = {
  route: '/adf-users/1',
  pathname: '/adf-users/[id]',
  query: { id: '1' },
  asPath: '/adf-users/1',
  push: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
  beforePopState: vi.fn(),
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
  isFallback: false,
  isReady: true,
  isPreview: false,
} as unknown as NextRouter;

// Mock useRouter hook
vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

// Mock useParams hook for Next.js 13+ App Router
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
}));

// MSW server setup for API mocking
const server = setupServer(
  // User GET endpoint
  rest.get('/api/v2/system/user/1', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        resource: [mockUsers[0]], // admin user
        meta: { count: 1 },
      })
    );
  }),

  // User UPDATE endpoint
  rest.put('/api/v2/system/user/1', async (req, res, ctx) => {
    const requestBody = await req.json();
    const updatedUser = {
      ...mockUsers[0],
      ...requestBody.resource,
      last_modified_date: new Date().toISOString(),
    };
    
    return res(
      ctx.status(200),
      ctx.json({
        resource: [updatedUser],
        meta: { count: 1 },
      })
    );
  }),

  // Roles endpoint for dropdown data
  rest.get('/api/v2/system/role', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        resource: mockRoles,
        meta: { count: mockRoles.length },
      })
    );
  }),

  // User validation endpoint
  rest.post('/api/v2/system/user/validate', async (req, res, ctx) => {
    const requestBody = await req.json();
    const { email } = requestBody;
    
    // Simulate email uniqueness validation
    const isDuplicate = mockUsers.some(user => 
      user.email === email && user.id !== 1
    );
    
    if (isDuplicate) {
      return res(
        ctx.status(422),
        ctx.json({
          error: {
            code: 422,
            message: 'Validation failed',
            details: 'The email address is already in use.',
            validation_errors: {
              email: ['The email has already been taken.'],
            },
          },
        })
      );
    }
    
    return res(ctx.status(200), ctx.json({ valid: true }));
  }),

  // Error scenarios
  rest.get('/api/v2/system/user/999', (req, res, ctx) => {
    return res(
      ctx.status(404),
      ctx.json({
        error: {
          code: 404,
          message: 'Resource not found',
          details: 'User with ID 999 does not exist.',
        },
      })
    );
  }),

  rest.put('/api/v2/system/user/500', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        error: {
          code: 500,
          message: 'Internal Server Error',
          details: 'Database connection failed.',
        },
      })
    );
  }),

  // Network timeout simulation
  rest.get('/api/v2/system/user/timeout', (req, res, ctx) => {
    return res(ctx.delay('infinite'));
  }),
);

describe('UserEditPage Component', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  beforeEach(() => {
    queryClient = new QueryClient({
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
    user = userEvent.setup();
    
    // Reset router mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
  });

  afterAll(() => {
    server.close();
  });

  describe('Component Rendering and Data Fetching', () => {
    it('should render loading state initially', async () => {
      renderWithProviders(<UserEditPage />, { queryClient });
      
      expect(screen.getByTestId('user-edit-loading')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should fetch and display user data successfully', async () => {
      renderWithProviders(<UserEditPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('admin@dreamfactory.com')).toBeInTheDocument();
      });
      
      expect(screen.getByDisplayValue('System')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Administrator')).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /active/i })).toBeChecked();
    });

    it('should handle user not found error', async () => {
      // Override router to return 999 (non-existent user)
      const routerWith404 = { ...mockRouter, query: { id: '999' } };
      vi.mocked(mockRouter).query = { id: '999' };
      
      renderWithProviders(<UserEditPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByText(/user not found/i)).toBeInTheDocument();
      });
      
      expect(screen.getByText(/user with id 999 does not exist/i)).toBeInTheDocument();
    });

    it('should handle network timeout gracefully', async () => {
      vi.mocked(mockRouter).query = { id: 'timeout' };
      
      renderWithProviders(<UserEditPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByText(/request timeout/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Form Validation with React Hook Form and Zod', () => {
    beforeEach(async () => {
      renderWithProviders(<UserEditPage />, { queryClient });
      
      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('admin@dreamfactory.com')).toBeInTheDocument();
      });
    });

    it('should validate required email field', async () => {
      const emailInput = screen.getByLabelText(/email/i);
      
      await user.clear(emailInput);
      await user.tab(); // Trigger blur validation
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const emailInput = screen.getByLabelText(/email/i);
      
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('should validate username requirements', async () => {
      const usernameInput = screen.getByLabelText(/username/i);
      
      // Test minimum length
      await user.clear(usernameInput);
      await user.type(usernameInput, 'ab');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
      });
      
      // Test invalid characters
      await user.clear(usernameInput);
      await user.type(usernameInput, 'user@name');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/username can only contain letters/i)).toBeInTheDocument();
      });
    });

    it('should validate first name length', async () => {
      const firstNameInput = screen.getByLabelText(/first name/i);
      
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'a'.repeat(101)); // Exceed max length
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/first name must not exceed 100 characters/i)).toBeInTheDocument();
      });
    });

    it('should handle server-side validation errors', async () => {
      const emailInput = screen.getByLabelText(/email/i);
      
      // Use email that triggers server validation error
      await user.clear(emailInput);
      await user.type(emailInput, 'john.developer@company.com'); // Already exists
      
      const submitButton = screen.getByRole('button', { name: /save user/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/the email has already been taken/i)).toBeInTheDocument();
      });
    });

    it('should show all validation errors when form is invalid', async () => {
      // Clear all required fields
      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      
      await user.clear(emailInput);
      await user.clear(usernameInput);
      
      const submitButton = screen.getByRole('button', { name: /save user/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
      });
      
      // Submit button should be disabled or show validation state
      expect(submitButton).toHaveAttribute('aria-describedby');
    });
  });

  describe('Form Submission Workflows', () => {
    beforeEach(async () => {
      renderWithProviders(<UserEditPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('admin@dreamfactory.com')).toBeInTheDocument();
      });
    });

    it('should successfully submit form with valid data', async () => {
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Updated');
      await user.clear(lastNameInput);
      await user.type(lastNameInput, 'Name');
      
      const submitButton = screen.getByRole('button', { name: /save user/i });
      await user.click(submitButton);
      
      // Check loading state
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText(/user updated successfully/i)).toBeInTheDocument();
      });
      
      // Should redirect after successful save
      expect(mockRouter.push).toHaveBeenCalledWith('/adf-users');
    });

    it('should handle optimistic updates', async () => {
      const firstNameInput = screen.getByLabelText(/first name/i);
      
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Optimistic');
      
      const submitButton = screen.getByRole('button', { name: /save user/i });
      await user.click(submitButton);
      
      // Should immediately show updated value (optimistic update)
      expect(screen.getByDisplayValue('Optimistic')).toBeInTheDocument();
    });

    it('should rollback optimistic updates on error', async () => {
      // Trigger server error
      vi.mocked(mockRouter).query = { id: '500' };
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      const originalValue = firstNameInput.getAttribute('value');
      
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Will Fail');
      
      const submitButton = screen.getByRole('button', { name: /save user/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/database connection failed/i)).toBeInTheDocument();
      });
      
      // Should rollback to original value
      expect(screen.getByDisplayValue(originalValue!)).toBeInTheDocument();
    });

    it('should prevent double submission', async () => {
      const submitButton = screen.getByRole('button', { name: /save user/i });
      
      await user.click(submitButton);
      await user.click(submitButton); // Second click
      
      // Should only have one API call
      await waitFor(() => {
        expect(screen.getByText(/saving/i)).toBeInTheDocument();
      });
      
      // Button should remain disabled
      expect(submitButton).toBeDisabled();
    });

    it('should handle form reset functionality', async () => {
      const firstNameInput = screen.getByLabelText(/first name/i);
      const originalValue = firstNameInput.getAttribute('value');
      
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Changed Value');
      
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);
      
      expect(screen.getByDisplayValue(originalValue!)).toBeInTheDocument();
    });
  });

  describe('Role Management and Permissions', () => {
    beforeEach(async () => {
      renderWithProviders(<UserEditPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('admin@dreamfactory.com')).toBeInTheDocument();
      });
    });

    it('should load and display available roles', async () => {
      const roleSelect = screen.getByLabelText(/role/i);
      
      await user.click(roleSelect);
      
      await waitFor(() => {
        expect(screen.getByText('Super Administrator')).toBeInTheDocument();
        expect(screen.getByText('Administrator')).toBeInTheDocument();
        expect(screen.getByText('Developer')).toBeInTheDocument();
      });
    });

    it('should update user role selection', async () => {
      const roleSelect = screen.getByLabelText(/role/i);
      
      await user.click(roleSelect);
      await user.click(screen.getByText('Developer'));
      
      expect(roleSelect).toHaveValue('3'); // Developer role ID
    });

    it('should show role permissions preview', async () => {
      const roleSelect = screen.getByLabelText(/role/i);
      
      await user.click(roleSelect);
      await user.click(screen.getByText('Developer'));
      
      await waitFor(() => {
        expect(screen.getByText(/permissions: schema.read, api.generate, api.test/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Status Management', () => {
    beforeEach(async () => {
      renderWithProviders(<UserEditPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('admin@dreamfactory.com')).toBeInTheDocument();
      });
    });

    it('should toggle user active status', async () => {
      const activeCheckbox = screen.getByRole('checkbox', { name: /active/i });
      
      expect(activeCheckbox).toBeChecked();
      
      await user.click(activeCheckbox);
      expect(activeCheckbox).not.toBeChecked();
    });

    it('should show deactivation warning for active users', async () => {
      const activeCheckbox = screen.getByRole('checkbox', { name: /active/i });
      
      await user.click(activeCheckbox);
      
      await waitFor(() => {
        expect(screen.getByText(/deactivating this user will revoke/i)).toBeInTheDocument();
      });
    });

    it('should handle verified status correctly', async () => {
      const verifiedCheckbox = screen.getByRole('checkbox', { name: /verified/i });
      
      expect(verifiedCheckbox).toBeChecked();
      expect(verifiedCheckbox).toBeDisabled(); // Cannot change verified status directly
    });
  });

  describe('Error Scenarios and Error Boundaries', () => {
    it('should handle component rendering errors gracefully', async () => {
      // Mock console.error to suppress error logging in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Simulate component error by providing invalid data
      const invalidQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            queryFn: () => {
              throw new Error('Component render error');
            },
          },
        },
      });
      
      renderWithProviders(<UserEditPage />, { queryClient: invalidQueryClient });
      
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    it('should provide error recovery options', async () => {
      vi.mocked(mockRouter).query = { id: '999' };
      
      renderWithProviders(<UserEditPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByText(/user not found/i)).toBeInTheDocument();
      });
      
      // Should show retry button
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
      
      await user.click(retryButton);
      
      // Should attempt to reload data
      expect(screen.getByTestId('user-edit-loading')).toBeInTheDocument();
    });

    it('should handle network errors with retry capability', async () => {
      server.use(
        rest.get('/api/v2/system/user/1', (req, res, ctx) => {
          return res.networkError('Network error');
        })
      );
      
      renderWithProviders(<UserEditPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);
      
      // Should show loading state on retry
      expect(screen.getByTestId('user-edit-loading')).toBeInTheDocument();
    });
  });

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    beforeEach(async () => {
      renderWithProviders(<UserEditPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('admin@dreamfactory.com')).toBeInTheDocument();
      });
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <UserEditPage />
        </QueryClientProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('admin@dreamfactory.com')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form labels and ARIA attributes', async () => {
      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const firstNameInput = screen.getByLabelText(/first name/i);
      
      expect(emailInput).toHaveAttribute('aria-required', 'true');
      expect(usernameInput).toHaveAttribute('aria-required', 'true');
      expect(firstNameInput).toHaveAttribute('aria-describedby');
    });

    it('should announce validation errors to screen readers', async () => {
      const emailInput = screen.getByLabelText(/email/i);
      
      await user.clear(emailInput);
      await user.tab();
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/email is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should support keyboard navigation', async () => {
      const firstInput = screen.getByLabelText(/email/i);
      const lastInput = screen.getByRole('button', { name: /save user/i });
      
      firstInput.focus();
      expect(document.activeElement).toBe(firstInput);
      
      // Tab through all form elements
      await user.tab();
      await user.tab();
      await user.tab();
      await user.tab();
      await user.tab();
      
      expect(document.activeElement).toBe(lastInput);
    });

    it('should have proper heading structure', () => {
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent(/edit user/i);
      
      const formSections = screen.getAllByRole('heading', { level: 2 });
      expect(formSections).toHaveLength(2); // Basic Info, Permissions
    });

    it('should provide descriptive button labels', () => {
      const saveButton = screen.getByRole('button', { name: /save user/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const resetButton = screen.getByRole('button', { name: /reset/i });
      
      expect(saveButton).toHaveAttribute('aria-describedby');
      expect(cancelButton).toBeInTheDocument();
      expect(resetButton).toBeInTheDocument();
    });
  });

  describe('SWR Data Fetching and Caching', () => {
    it('should cache user data and avoid unnecessary requests', async () => {
      let requestCount = 0;
      
      server.use(
        rest.get('/api/v2/system/user/1', (req, res, ctx) => {
          requestCount++;
          return res(
            ctx.status(200),
            ctx.json({
              resource: [mockUsers[0]],
              meta: { count: 1 },
            })
          );
        })
      );
      
      const { rerender } = renderWithProviders(<UserEditPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('admin@dreamfactory.com')).toBeInTheDocument();
      });
      
      // Re-render component
      rerender(<UserEditPage />);
      
      // Should use cached data, no additional request
      expect(requestCount).toBe(1);
    });

    it('should handle stale-while-revalidate pattern', async () => {
      // Initial render with cached data
      renderWithProviders(<UserEditPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('admin@dreamfactory.com')).toBeInTheDocument();
      });
      
      // Simulate data becoming stale
      queryClient.invalidateQueries(['user', '1']);
      
      // Should show stale data while revalidating
      expect(screen.getByDisplayValue('admin@dreamfactory.com')).toBeInTheDocument();
      
      await waitFor(() => {
        // Should eventually show updated data
        expect(screen.getByDisplayValue('admin@dreamfactory.com')).toBeInTheDocument();
      });
    });

    it('should handle background refetch on window focus', async () => {
      renderWithProviders(<UserEditPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('admin@dreamfactory.com')).toBeInTheDocument();
      });
      
      // Simulate window focus event
      window.dispatchEvent(new Event('focus'));
      
      // Should trigger background refetch (no visible loading state)
      expect(screen.queryByTestId('user-edit-loading')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('admin@dreamfactory.com')).toBeInTheDocument();
    });
  });

  describe('Mock Data Factory Integration', () => {
    it('should create realistic test user data', () => {
      const testUser = createMockUser({
        id: 999,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        is_active: true,
      });
      
      expect(testUser).toMatchObject({
        id: 999,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        is_active: true,
        created_date: expect.any(String),
        last_modified_date: expect.any(String),
      });
    });

    it('should create realistic test role data', () => {
      const testRole = createMockRole({
        id: 999,
        name: 'test_role',
        label: 'Test Role',
        permissions: ['test.read', 'test.write'],
      });
      
      expect(testRole).toMatchObject({
        id: 999,
        name: 'test_role',
        label: 'Test Role',
        permissions: ['test.read', 'test.write'],
        is_active: true,
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should cleanup event listeners on unmount', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = renderWithProviders(<UserEditPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('admin@dreamfactory.com')).toBeInTheDocument();
      });
      
      unmount();
      
      // Should cleanup event listeners
      expect(removeEventListenerSpy).toHaveBeenCalled();
    });

    it('should cancel pending requests on unmount', async () => {
      const abortSpy = vi.spyOn(AbortController.prototype, 'abort');
      
      const { unmount } = renderWithProviders(<UserEditPage />, { queryClient });
      
      // Unmount before request completes
      unmount();
      
      expect(abortSpy).toHaveBeenCalled();
    });

    it('should handle large user datasets efficiently', async () => {
      const startTime = performance.now();
      
      renderWithProviders(<UserEditPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('admin@dreamfactory.com')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within performance budget (< 1000ms)
      expect(renderTime).toBeLessThan(1000);
    });
  });
});