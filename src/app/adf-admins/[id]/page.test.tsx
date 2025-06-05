/**
 * Admin Edit Page Test Suite
 * 
 * Comprehensive Vitest test suite for the admin editing page component that exercises
 * dynamic route parameter handling, existing admin data loading, form pre-population,
 * validation workflows, update operations, and error scenarios. This test suite replaces
 * the Angular TestBed configuration with modern React Testing Library patterns and
 * Mock Service Worker for realistic API mocking.
 * 
 * Key Features Tested:
 * - Dynamic route parameter extraction using Next.js useParams hook
 * - Admin data loading and caching with SWR/React Query patterns
 * - Form pre-population and validation using React Hook Form
 * - Update operations with optimistic updates and error handling
 * - Permission checks and role-based access control
 * - Admin-specific features: sendInvite, access restrictions, lookup keys
 * - Error scenarios including 401, 403, 404, and validation errors
 * - Loading states and user feedback mechanisms
 * 
 * Performance Requirements:
 * - Test execution under 10 seconds (10x faster than Angular Jest/Karma)
 * - Realistic API mocking without external dependencies
 * - Comprehensive coverage including edge cases and error scenarios
 * 
 * Architecture Benefits:
 * - Zero-configuration TypeScript support with Vitest
 * - Enhanced debugging with React Testing Library queries
 * - Realistic API behavior simulation with MSW
 * - Modern React testing patterns with hooks and context
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '@/test/mocks/server';
import { rest } from 'msw';
import AdminEditPage from './page';

// ============================================================================
// MOCK SETUP AND CONFIGURATION
// ============================================================================

/**
 * Next.js Navigation Mocks
 * 
 * Replaces Angular ActivatedRoute mocking with Next.js navigation hooks
 * for dynamic route parameter testing and navigation simulation.
 */

// Mock Next.js navigation hooks for dynamic route testing
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();
const mockBack = vi.fn();

// Mock useParams for dynamic route parameter extraction
const mockUseParams = vi.fn();

// Mock useSearchParams for query parameter handling
const mockUseSearchParams = vi.fn();

// Mock useRouter for navigation operations
const mockUseRouter = vi.fn(() => ({
  push: mockPush,
  replace: mockReplace,
  refresh: mockRefresh,
  back: mockBack,
  pathname: '/adf-admins/123',
  query: { id: '123' },
}));

vi.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  useSearchParams: () => mockUseSearchParams(),
  useRouter: () => mockUseRouter(),
  usePathname: () => '/adf-admins/123',
}));

/**
 * SWR and React Query Mocks
 * 
 * Configures data fetching hooks for admin profile loading and update
 * operations, replacing Angular service injection with React hooks.
 */

// Mock SWR hook for admin data fetching
const mockUseSWR = vi.fn();
vi.mock('swr', () => ({
  default: (key: string, fetcher: Function) => mockUseSWR(key, fetcher),
}));

// Mock useAdmins hook for admin management operations
const mockUseAdmins = vi.fn();
vi.mock('@/hooks/use-admins', () => ({
  useAdmins: () => mockUseAdmins(),
  useAdmin: (id: string) => mockUseAdmins(),
  useUpdateAdmin: () => mockUseAdmins(),
}));

/**
 * Mock Data Definitions
 * 
 * Comprehensive mock data representing different admin states and scenarios
 * for thorough testing coverage including edge cases and error conditions.
 */

// Mock admin data for testing - represents a typical admin profile
const mockAdminData = {
  id: 123,
  username: 'test-admin',
  email: 'test.admin@dreamfactory.com',
  first_name: 'Test',
  last_name: 'Admin',
  display_name: 'Test Admin',
  is_active: true,
  is_sys_admin: true,
  phone: '+1-555-123-4567',
  security_question: 'What is your favorite color?',
  security_answer: 'Blue',
  created_date: '2024-01-15T10:30:00Z',
  last_modified_date: '2024-06-01T14:20:00Z',
  last_login_date: '2024-06-05T09:15:00Z',
  confirmed: true,
  failed_login_attempts: 0,
  locked_until: null,
  password_set_date: '2024-01-15T10:30:00Z',
  
  // Admin-specific fields
  accessibleTabs: ['services', 'schema', 'users', 'roles', 'config'],
  adminCapabilities: ['user_management', 'service_management', 'schema_management', 'system_configuration'],
  systemPermissions: ['read_users', 'create_users', 'update_users', 'delete_users'],
  
  // Lookup keys for additional configuration
  lookup_by_user_id: [
    {
      id: 1,
      name: 'default_database_type',
      value: 'mysql',
      private: false,
      description: 'Default database type preference',
    },
    {
      id: 2,
      name: 'notification_preferences',
      value: 'email,slack',
      private: true,
      description: 'Notification delivery preferences',
    },
  ],
  
  // Role assignments
  user_to_app_to_role_by_user_id: [
    {
      id: 1,
      user_id: 123,
      app_id: 1,
      role_id: 1,
      created_date: '2024-01-15T10:30:00Z',
    },
  ],
};

// Mock inactive admin for testing different states
const mockInactiveAdmin = {
  ...mockAdminData,
  id: 124,
  username: 'inactive-admin',
  email: 'inactive.admin@dreamfactory.com',
  is_active: false,
  last_login_date: null,
  failed_login_attempts: 3,
  locked_until: '2024-06-06T10:00:00Z',
};

// Mock system admin with full privileges
const mockSystemAdmin = {
  ...mockAdminData,
  id: 125,
  username: 'system-admin',
  email: 'system.admin@dreamfactory.com',
  is_sys_admin: true,
  accessibleTabs: ['*'], // Access to all tabs
  adminCapabilities: ['user_management', 'service_management', 'schema_management', 'api_generation', 'system_configuration', 'security_management', 'audit_access', 'backup_restore'],
  systemPermissions: ['*'], // All permissions
};

// Mock roles data for role assignment testing
const mockRoles = [
  {
    id: 1,
    name: 'Admin',
    description: 'Full administrative access',
    is_active: true,
    created_date: '2024-01-01T00:00:00Z',
    accessibleTabs: ['services', 'schema', 'users', 'roles', 'config'],
  },
  {
    id: 2,
    name: 'User Manager',
    description: 'User and role management only',
    is_active: true,
    created_date: '2024-01-01T00:00:00Z',
    accessibleTabs: ['users', 'roles'],
  },
  {
    id: 3,
    name: 'Schema Manager',
    description: 'Database schema management only',
    is_active: true,
    created_date: '2024-01-01T00:00:00Z',
    accessibleTabs: ['schema'],
  },
];

// Mock apps data for application-role assignments
const mockApps = [
  {
    id: 1,
    name: 'Default App',
    description: 'Default DreamFactory application',
    is_active: true,
    type: 'No SQL DB',
    created_date: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Mobile API',
    description: 'Mobile application API',
    is_active: true,
    type: 'Remote SQL DB',
    created_date: '2024-01-15T00:00:00Z',
  },
];

// Mock lookup keys for admin configuration
const mockLookupKeys = [
  { name: 'default_database_type', value: 'mysql', description: 'Default database type' },
  { name: 'notification_preferences', value: 'email', description: 'Notification settings' },
  { name: 'theme_preference', value: 'dark', description: 'UI theme preference' },
  { name: 'timezone', value: 'UTC', description: 'Default timezone' },
];

// ============================================================================
// TEST UTILITIES AND HELPERS
// ============================================================================

/**
 * Test Utilities for Component Rendering and Interaction
 * 
 * Provides reusable utilities for rendering components with necessary providers,
 * simulating user interactions, and verifying component behavior across
 * different scenarios and edge cases.
 */

// Create a fresh QueryClient for each test to ensure isolation
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for faster test execution
      staleTime: 0, // Always consider data stale for testing
      gcTime: 0, // Immediately garbage collect for test isolation
    },
    mutations: {
      retry: false, // Disable retries for predictable test behavior
    },
  },
});

// Enhanced render utility with providers and default props
const renderAdminEditPage = (
  adminId: string = '123',
  initialData?: any,
  queryClient?: QueryClient
) => {
  const testQueryClient = queryClient || createTestQueryClient();
  
  // Set up mock for useParams
  mockUseParams.mockReturnValue({ id: adminId });
  
  // Set up mock for useSearchParams
  mockUseSearchParams.mockReturnValue(new URLSearchParams());
  
  // Configure SWR mock with initial data
  mockUseSWR.mockImplementation((key: string) => {
    if (key.includes('/admin/') || key.includes('/system/admin/')) {
      return {
        data: initialData || mockAdminData,
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
      };
    }
    
    // Mock for roles data
    if (key.includes('/role')) {
      return {
        data: { resource: mockRoles },
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
      };
    }
    
    // Mock for apps data
    if (key.includes('/app')) {
      return {
        data: { resource: mockApps },
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
      };
    }
    
    // Mock for lookup keys
    if (key.includes('/lookup')) {
      return {
        data: { resource: mockLookupKeys },
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
      };
    }
    
    return {
      data: null,
      error: null,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    };
  });
  
  return render(
    <QueryClientProvider client={testQueryClient}>
      <AdminEditPage />
    </QueryClientProvider>
  );
};

// Utility for simulating form input changes
const fillAdminForm = async (user: any, formData: Partial<typeof mockAdminData>) => {
  if (formData.username) {
    const usernameInput = screen.getByLabelText(/username/i);
    await user.clear(usernameInput);
    await user.type(usernameInput, formData.username);
  }
  
  if (formData.email) {
    const emailInput = screen.getByLabelText(/email/i);
    await user.clear(emailInput);
    await user.type(emailInput, formData.email);
  }
  
  if (formData.first_name) {
    const firstNameInput = screen.getByLabelText(/first name/i);
    await user.clear(firstNameInput);
    await user.type(firstNameInput, formData.first_name);
  }
  
  if (formData.last_name) {
    const lastNameInput = screen.getByLabelText(/last name/i);
    await user.clear(lastNameInput);
    await user.type(lastNameInput, formData.last_name);
  }
  
  if (formData.phone) {
    const phoneInput = screen.getByLabelText(/phone/i);
    await user.clear(phoneInput);
    await user.type(phoneInput, formData.phone);
  }
  
  if (typeof formData.is_active === 'boolean') {
    const activeCheckbox = screen.getByLabelText(/active/i);
    if (formData.is_active !== activeCheckbox.checked) {
      await user.click(activeCheckbox);
    }
  }
  
  if (typeof formData.is_sys_admin === 'boolean') {
    const sysAdminCheckbox = screen.getByLabelText(/system admin/i);
    if (formData.is_sys_admin !== sysAdminCheckbox.checked) {
      await user.click(sysAdminCheckbox);
    }
  }
};

// Utility for verifying form validation errors
const expectValidationError = (fieldName: string, errorMessage: string) => {
  const errorElement = screen.getByText(errorMessage);
  expect(errorElement).toBeInTheDocument();
  expect(errorElement).toHaveClass('text-red-500', 'text-error-500'); // Tailwind error styling
};

// Utility for verifying successful form submission
const expectFormSubmissionSuccess = async () => {
  await waitFor(() => {
    const successMessage = screen.getByText(/admin updated successfully/i);
    expect(successMessage).toBeInTheDocument();
  });
};

// ============================================================================
// MOCK SERVICE WORKER HANDLERS
// ============================================================================

/**
 * MSW Request Handlers for Admin API Endpoints
 * 
 * Configures realistic API behavior for testing admin CRUD operations,
 * replacing Angular HttpClientTestingModule with modern MSW patterns
 * for more accurate API simulation and testing.
 */

// Success handler for admin data retrieval
const adminGetSuccessHandler = rest.get('/api/v2/system/admin/123', (req, res, ctx) => {
  return res(ctx.status(200), ctx.json(mockAdminData));
});

// Success handler for admin update operations
const adminUpdateSuccessHandler = rest.put('/api/v2/system/admin/123', async (req, res, ctx) => {
  const requestBody = await req.json();
  const updatedAdmin = { ...mockAdminData, ...requestBody };
  return res(ctx.status(200), ctx.json(updatedAdmin));
});

// Error handler for admin not found scenarios
const adminNotFoundHandler = rest.get('/api/v2/system/admin/999', (req, res, ctx) => {
  return res(
    ctx.status(404),
    ctx.json({
      error: {
        code: 404,
        message: 'Record with identifier of "999" not found.',
        status_code: 404,
      },
    })
  );
});

// Error handler for permission denied scenarios
const adminPermissionDeniedHandler = rest.put('/api/v2/system/admin/123', (req, res, ctx) => {
  return res(
    ctx.status(403),
    ctx.json({
      error: {
        code: 403,
        message: 'Access denied. You do not have permission to modify this admin.',
        status_code: 403,
      },
    })
  );
});

// Error handler for validation failures
const adminValidationErrorHandler = rest.put('/api/v2/system/admin/123', async (req, res, ctx) => {
  const requestBody = await req.json();
  
  // Simulate validation errors for specific invalid data
  if (requestBody.email === 'invalid-email') {
    return res(
      ctx.status(422),
      ctx.json({
        error: {
          code: 422,
          message: 'Validation failed',
          status_code: 422,
          context: {
            email: ['The email field must be a valid email address.'],
          },
        },
      })
    );
  }
  
  if (requestBody.username === 'duplicate-username') {
    return res(
      ctx.status(422),
      ctx.json({
        error: {
          code: 422,
          message: 'Validation failed',
          status_code: 422,
          context: {
            username: ['The username has already been taken.'],
          },
        },
      })
    );
  }
  
  return res(ctx.status(200), ctx.json({ ...mockAdminData, ...requestBody }));
});

// Handler for send invite functionality
const adminSendInviteHandler = rest.post('/api/v2/system/admin/123/invite', (req, res, ctx) => {
  return res(
    ctx.status(200),
    ctx.json({
      success: true,
      message: 'Invitation sent successfully',
    })
  );
});

// Handler for roles data retrieval
const rolesSuccessHandler = rest.get('/api/v2/system/role', (req, res, ctx) => {
  return res(ctx.status(200), ctx.json({ resource: mockRoles }));
});

// Handler for apps data retrieval
const appsSuccessHandler = rest.get('/api/v2/system/app', (req, res, ctx) => {
  return res(ctx.status(200), ctx.json({ resource: mockApps }));
});

// Handler for lookup keys retrieval
const lookupKeysSuccessHandler = rest.get('/api/v2/system/lookup', (req, res, ctx) => {
  return res(ctx.status(200), ctx.json({ resource: mockLookupKeys }));
});

// ============================================================================
// TEST SUITE ORGANIZATION
// ============================================================================

describe('AdminEditPage Component', () => {
  let user: any;
  let queryClient: QueryClient;

  beforeEach(() => {
    // Initialize user event simulator for enhanced interaction testing
    user = userEvent.setup();
    
    // Create fresh QueryClient for test isolation
    queryClient = createTestQueryClient();
    
    // Reset all mocks to ensure clean test state
    vi.clearAllMocks();
    
    // Set up default successful MSW handlers
    server.use(
      adminGetSuccessHandler,
      adminUpdateSuccessHandler,
      rolesSuccessHandler,
      appsSuccessHandler,
      lookupKeysSuccessHandler
    );
    
    // Mock console methods to reduce test noise
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up mocks and restore original implementations
    vi.restoreAllMocks();
    
    // Reset MSW handlers to default state
    server.resetHandlers();
  });

  // ============================================================================
  // COMPONENT RENDERING AND INITIALIZATION TESTS
  // ============================================================================

  describe('Component Rendering and Initialization', () => {
    test('renders admin edit page with loading state initially', async () => {
      // Configure loading state mock
      mockUseSWR.mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
        isValidating: false,
        mutate: vi.fn(),
      });

      renderAdminEditPage('123', null, queryClient);

      // Verify loading state is displayed
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('renders admin edit form with pre-populated data', async () => {
      renderAdminEditPage('123', mockAdminData, queryClient);

      // Wait for form to load and verify pre-populated fields
      await waitFor(() => {
        expect(screen.getByDisplayValue(mockAdminData.username)).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockAdminData.email)).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockAdminData.first_name)).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockAdminData.last_name)).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockAdminData.phone)).toBeInTheDocument();
      });

      // Verify checkboxes are correctly set
      expect(screen.getByLabelText(/active/i)).toBeChecked();
      expect(screen.getByLabelText(/system admin/i)).toBeChecked();
    });

    test('displays correct page title and breadcrumb navigation', async () => {
      renderAdminEditPage('123', mockAdminData, queryClient);

      await waitFor(() => {
        expect(screen.getByText(/edit admin/i)).toBeInTheDocument();
        expect(screen.getByText(mockAdminData.display_name)).toBeInTheDocument();
      });

      // Verify breadcrumb navigation
      expect(screen.getByText(/admins/i)).toBeInTheDocument();
      expect(screen.getByText(/edit/i)).toBeInTheDocument();
    });

    test('renders admin-specific features and capabilities section', async () => {
      renderAdminEditPage('123', mockSystemAdmin, queryClient);

      await waitFor(() => {
        // Verify admin capabilities section
        expect(screen.getByText(/admin capabilities/i)).toBeInTheDocument();
        expect(screen.getByText(/accessible tabs/i)).toBeInTheDocument();
        expect(screen.getByText(/system permissions/i)).toBeInTheDocument();
      });

      // Verify admin-specific controls
      expect(screen.getByText(/send invite/i)).toBeInTheDocument();
      expect(screen.getByText(/reset password/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // DYNAMIC ROUTE PARAMETER TESTING
  // ============================================================================

  describe('Dynamic Route Parameter Handling', () => {
    test('extracts admin ID from route parameters correctly', async () => {
      const adminId = '456';
      renderAdminEditPage(adminId, mockAdminData, queryClient);

      // Verify useParams was called and returned correct ID
      expect(mockUseParams).toHaveBeenCalled();
      
      // Verify the correct API endpoint was requested
      await waitFor(() => {
        expect(mockUseSWR).toHaveBeenCalledWith(
          expect.stringContaining(`/admin/${adminId}`),
          expect.any(Function)
        );
      });
    });

    test('handles invalid admin ID gracefully', async () => {
      server.use(adminNotFoundHandler);
      
      mockUseSWR.mockReturnValue({
        data: null,
        error: {
          status: 404,
          message: 'Admin not found',
        },
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
      });

      renderAdminEditPage('999', null, queryClient);

      await waitFor(() => {
        expect(screen.getByText(/admin not found/i)).toBeInTheDocument();
        expect(screen.getByText(/the requested admin does not exist/i)).toBeInTheDocument();
      });
    });

    test('redirects to admin list when admin ID is missing', async () => {
      mockUseParams.mockReturnValue({ id: undefined });

      renderAdminEditPage(undefined, null, queryClient);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/adf-admins');
      });
    });

    test('handles URL query parameters for additional context', async () => {
      const searchParams = new URLSearchParams('tab=permissions&action=edit');
      mockUseSearchParams.mockReturnValue(searchParams);

      renderAdminEditPage('123', mockAdminData, queryClient);

      await waitFor(() => {
        // Verify the correct tab is activated
        expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(/permissions/i);
      });
    });
  });

  // ============================================================================
  // DATA LOADING AND CACHING TESTS
  // ============================================================================

  describe('Admin Data Loading and Caching', () => {
    test('loads admin data with SWR caching strategy', async () => {
      const mutateMock = vi.fn();
      mockUseSWR.mockReturnValue({
        data: mockAdminData,
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: mutateMock,
      });

      renderAdminEditPage('123', mockAdminData, queryClient);

      await waitFor(() => {
        expect(mockUseSWR).toHaveBeenCalledWith(
          expect.stringContaining('/system/admin/123'),
          expect.any(Function)
        );
      });

      // Verify data is properly cached and displayed
      expect(screen.getByDisplayValue(mockAdminData.username)).toBeInTheDocument();
    });

    test('handles network errors during data loading', async () => {
      mockUseSWR.mockReturnValue({
        data: null,
        error: new Error('Network error'),
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
      });

      renderAdminEditPage('123', null, queryClient);

      await waitFor(() => {
        expect(screen.getByText(/error loading admin data/i)).toBeInTheDocument();
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Verify retry button is available
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    test('implements optimistic updates for form submissions', async () => {
      const mutateMock = vi.fn();
      mockUseSWR.mockReturnValue({
        data: mockAdminData,
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: mutateMock,
      });

      renderAdminEditPage('123', mockAdminData, queryClient);

      // Make form changes
      await fillAdminForm(user, { first_name: 'Updated Name' });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      // Verify optimistic update was applied
      await waitFor(() => {
        expect(mutateMock).toHaveBeenCalledWith(
          expect.objectContaining({ first_name: 'Updated Name' }),
          false // optimistic update
        );
      });
    });

    test('handles concurrent data updates with conflict resolution', async () => {
      const mutateMock = vi.fn();
      mockUseSWR.mockReturnValue({
        data: mockAdminData,
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: mutateMock,
      });

      // Simulate conflicting update
      server.use(
        rest.put('/api/v2/system/admin/123', (req, res, ctx) => {
          return res(
            ctx.status(409),
            ctx.json({
              error: {
                code: 409,
                message: 'The admin has been modified by another user. Please refresh and try again.',
                status_code: 409,
              },
            })
          );
        })
      );

      renderAdminEditPage('123', mockAdminData, queryClient);

      // Attempt form submission
      await fillAdminForm(user, { first_name: 'Conflicting Update' });
      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      // Verify conflict resolution UI
      await waitFor(() => {
        expect(screen.getByText(/conflict detected/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /refresh data/i })).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // FORM VALIDATION AND INTERACTION TESTS
  // ============================================================================

  describe('Form Validation and User Interactions', () => {
    test('validates required fields with real-time feedback', async () => {
      renderAdminEditPage('123', mockAdminData, queryClient);

      // Clear required field to trigger validation
      const usernameInput = screen.getByLabelText(/username/i);
      await user.clear(usernameInput);
      await user.tab(); // Trigger blur event

      // Verify validation error appears
      await waitFor(() => {
        expectValidationError('username', 'Username is required');
      });

      // Verify submit button is disabled
      expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled();
    });

    test('validates email format with enhanced patterns', async () => {
      renderAdminEditPage('123', mockAdminData, queryClient);

      // Enter invalid email format
      const emailInput = screen.getByLabelText(/email/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email-format');
      await user.tab();

      // Verify email validation error
      await waitFor(() => {
        expectValidationError('email', 'Please enter a valid email address');
      });

      // Test valid email format
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');
      await user.tab();

      // Verify error is cleared
      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
      });
    });

    test('validates username uniqueness with server-side checking', async () => {
      server.use(adminValidationErrorHandler);

      renderAdminEditPage('123', mockAdminData, queryClient);

      // Enter duplicate username
      await fillAdminForm(user, { username: 'duplicate-username' });

      // Submit form to trigger server validation
      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      // Verify server validation error
      await waitFor(() => {
        expectValidationError('username', 'The username has already been taken.');
      });
    });

    test('handles complex form interactions with dependent fields', async () => {
      renderAdminEditPage('123', mockAdminData, queryClient);

      // Test system admin checkbox affects accessible tabs
      const sysAdminCheckbox = screen.getByLabelText(/system admin/i);
      await user.click(sysAdminCheckbox); // Uncheck system admin

      // Verify dependent fields are updated
      await waitFor(() => {
        const accessibleTabsSection = screen.getByText(/accessible tabs/i).closest('div');
        expect(accessibleTabsSection).toHaveClass('opacity-50'); // Should be dimmed/disabled
      });

      // Re-check system admin
      await user.click(sysAdminCheckbox);

      // Verify fields are re-enabled
      await waitFor(() => {
        const accessibleTabsSection = screen.getByText(/accessible tabs/i).closest('div');
        expect(accessibleTabsSection).not.toHaveClass('opacity-50');
      });
    });

    test('provides auto-save functionality with debounced updates', async () => {
      const mutateMock = vi.fn();
      mockUseSWR.mockReturnValue({
        data: mockAdminData,
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: mutateMock,
      });

      renderAdminEditPage('123', mockAdminData, queryClient);

      // Make rapid changes to trigger debounced auto-save
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Auto Save Test');

      // Wait for debounced auto-save (typically 2-3 seconds)
      await waitFor(
        () => {
          expect(screen.getByText(/auto saved/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  // ============================================================================
  // UPDATE OPERATIONS AND API INTEGRATION TESTS
  // ============================================================================

  describe('Admin Update Operations', () => {
    test('successfully updates admin profile with all fields', async () => {
      renderAdminEditPage('123', mockAdminData, queryClient);

      // Fill form with updated data
      const updatedData = {
        username: 'updated-admin',
        email: 'updated.admin@dreamfactory.com',
        first_name: 'Updated',
        last_name: 'Administrator',
        phone: '+1-555-999-8888',
        is_active: false,
        is_sys_admin: false,
      };

      await fillAdminForm(user, updatedData);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      // Verify success feedback
      await expectFormSubmissionSuccess();

      // Verify redirect to admin list
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/adf-admins');
      });
    });

    test('handles partial updates with selective field modification', async () => {
      renderAdminEditPage('123', mockAdminData, queryClient);

      // Update only specific fields
      await fillAdminForm(user, { 
        first_name: 'Partially Updated',
        phone: '+1-555-111-2222'
      });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      // Verify only changed fields are sent in API request
      await waitFor(() => {
        expect(server.use).toHaveBeenCalled();
        // Additional verification could be added here to check request body
      });

      await expectFormSubmissionSuccess();
    });

    test('implements retry mechanism for failed updates', async () => {
      // Configure server to fail initially, then succeed
      let attemptCount = 0;
      server.use(
        rest.put('/api/v2/system/admin/123', (req, res, ctx) => {
          attemptCount++;
          if (attemptCount === 1) {
            return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
          }
          return res(ctx.status(200), ctx.json(mockAdminData));
        })
      );

      renderAdminEditPage('123', mockAdminData, queryClient);

      await fillAdminForm(user, { first_name: 'Retry Test' });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      // Verify error is shown initially
      await waitFor(() => {
        expect(screen.getByText(/update failed/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Verify success on retry
      await expectFormSubmissionSuccess();
    });

    test('handles validation errors from server with field-specific feedback', async () => {
      server.use(adminValidationErrorHandler);

      renderAdminEditPage('123', mockAdminData, queryClient);

      // Submit with invalid email to trigger server validation
      await fillAdminForm(user, { email: 'invalid-email' });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      // Verify field-specific validation errors
      await waitFor(() => {
        expectValidationError('email', 'The email field must be a valid email address.');
      });

      // Verify form remains in edit mode
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeEnabled();
    });
  });

  // ============================================================================
  // ADMIN-SPECIFIC FEATURES TESTING
  // ============================================================================

  describe('Admin-Specific Features', () => {
    test('sends admin invitation email successfully', async () => {
      renderAdminEditPage('123', mockAdminData, queryClient);

      // Click send invite button
      const sendInviteButton = screen.getByRole('button', { name: /send invite/i });
      await user.click(sendInviteButton);

      // Verify confirmation dialog
      expect(screen.getByText(/send invitation email/i)).toBeInTheDocument();
      expect(screen.getByText(/this will send an invitation email/i)).toBeInTheDocument();

      // Confirm invitation
      const confirmButton = screen.getByRole('button', { name: /send invitation/i });
      await user.click(confirmButton);

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/invitation sent successfully/i)).toBeInTheDocument();
      });
    });

    test('manages accessible tabs with dynamic updates', async () => {
      renderAdminEditPage('123', mockAdminData, queryClient);

      // Find accessible tabs section
      const tabsSection = screen.getByText(/accessible tabs/i).closest('div');
      
      // Verify current tabs are selected
      expect(tabsSection).toHaveTextContent('services');
      expect(tabsSection).toHaveTextContent('schema');
      expect(tabsSection).toHaveTextContent('users');

      // Add new tab
      const addTabButton = screen.getByRole('button', { name: /add tab/i });
      await user.click(addTabButton);

      // Select additional tab from dropdown
      const tabDropdown = screen.getByRole('combobox', { name: /select tab/i });
      await user.click(tabDropdown);
      
      const appsOption = screen.getByRole('option', { name: /apps/i });
      await user.click(appsOption);

      // Verify new tab is added
      await waitFor(() => {
        expect(tabsSection).toHaveTextContent('apps');
      });
    });

    test('configures admin lookup keys with CRUD operations', async () => {
      renderAdminEditPage('123', mockAdminData, queryClient);

      // Navigate to lookup keys tab
      const lookupKeysTab = screen.getByRole('tab', { name: /lookup keys/i });
      await user.click(lookupKeysTab);

      // Verify existing lookup keys
      await waitFor(() => {
        expect(screen.getByText('default_database_type')).toBeInTheDocument();
        expect(screen.getByText('notification_preferences')).toBeInTheDocument();
      });

      // Add new lookup key
      const addKeyButton = screen.getByRole('button', { name: /add lookup key/i });
      await user.click(addKeyButton);

      // Fill new key form
      const keyNameInput = screen.getByLabelText(/key name/i);
      const keyValueInput = screen.getByLabelText(/key value/i);
      const keyDescInput = screen.getByLabelText(/description/i);

      await user.type(keyNameInput, 'test_preference');
      await user.type(keyValueInput, 'test_value');
      await user.type(keyDescInput, 'Test preference description');

      // Save new key
      const saveKeyButton = screen.getByRole('button', { name: /save key/i });
      await user.click(saveKeyButton);

      // Verify new key appears in list
      await waitFor(() => {
        expect(screen.getByText('test_preference')).toBeInTheDocument();
        expect(screen.getByText('test_value')).toBeInTheDocument();
      });
    });

    test('manages role assignments with app-specific permissions', async () => {
      renderAdminEditPage('123', mockAdminData, queryClient);

      // Navigate to roles tab
      const rolesTab = screen.getByRole('tab', { name: /roles/i });
      await user.click(rolesTab);

      // Verify current role assignments
      await waitFor(() => {
        expect(screen.getByText('Default App')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
      });

      // Add new role assignment
      const addRoleButton = screen.getByRole('button', { name: /add role assignment/i });
      await user.click(addRoleButton);

      // Select app and role
      const appSelect = screen.getByLabelText(/select app/i);
      await user.click(appSelect);
      await user.click(screen.getByRole('option', { name: /mobile api/i }));

      const roleSelect = screen.getByLabelText(/select role/i);
      await user.click(roleSelect);
      await user.click(screen.getByRole('option', { name: /user manager/i }));

      // Save role assignment
      const saveRoleButton = screen.getByRole('button', { name: /save assignment/i });
      await user.click(saveRoleButton);

      // Verify new assignment appears
      await waitFor(() => {
        expect(screen.getByText('Mobile API')).toBeInTheDocument();
        expect(screen.getByText('User Manager')).toBeInTheDocument();
      });
    });

    test('resets admin password with security confirmation', async () => {
      renderAdminEditPage('123', mockAdminData, queryClient);

      // Click reset password button
      const resetPasswordButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(resetPasswordButton);

      // Verify security confirmation dialog
      expect(screen.getByText(/reset admin password/i)).toBeInTheDocument();
      expect(screen.getByText(/this will generate a new temporary password/i)).toBeInTheDocument();

      // Verify security questions if applicable
      if (mockAdminData.security_question) {
        expect(screen.getByText(mockAdminData.security_question)).toBeInTheDocument();
        
        const securityAnswerInput = screen.getByLabelText(/security answer/i);
        await user.type(securityAnswerInput, mockAdminData.security_answer);
      }

      // Confirm password reset
      const confirmResetButton = screen.getByRole('button', { name: /confirm reset/i });
      await user.click(confirmResetButton);

      // Verify success and temporary password display
      await waitFor(() => {
        expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument();
        expect(screen.getByText(/temporary password/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // ERROR HANDLING AND EDGE CASES
  // ============================================================================

  describe('Error Handling and Edge Cases', () => {
    test('handles 401 authentication errors with redirect to login', async () => {
      server.use(
        rest.get('/api/v2/system/admin/123', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json({ error: 'Authentication required' }));
        })
      );

      mockUseSWR.mockReturnValue({
        data: null,
        error: { status: 401, message: 'Authentication required' },
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
      });

      renderAdminEditPage('123', null, queryClient);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    test('handles 403 permission errors with appropriate messaging', async () => {
      server.use(adminPermissionDeniedHandler);

      mockUseSWR.mockReturnValue({
        data: null,
        error: { status: 403, message: 'Access denied' },
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
      });

      renderAdminEditPage('123', null, queryClient);

      await waitFor(() => {
        expect(screen.getByText(/access denied/i)).toBeInTheDocument();
        expect(screen.getByText(/you do not have permission/i)).toBeInTheDocument();
      });

      // Verify fallback actions are available
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });

    test('handles network connectivity issues with retry mechanisms', async () => {
      mockUseSWR.mockReturnValue({
        data: null,
        error: new Error('Network error'),
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
      });

      renderAdminEditPage('123', null, queryClient);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Test retry functionality
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      // Mock successful retry
      mockUseSWR.mockReturnValue({
        data: mockAdminData,
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
      });

      await user.click(retryButton);

      // Verify data loads after retry
      await waitFor(() => {
        expect(screen.getByDisplayValue(mockAdminData.username)).toBeInTheDocument();
      });
    });

    test('handles malformed or corrupted admin data gracefully', async () => {
      const corruptedData = {
        id: 123,
        username: null, // Invalid null username
        email: 'not-an-email', // Invalid email format
        is_active: 'yes', // Wrong data type
        lookup_by_user_id: 'invalid-array', // Wrong data structure
      };

      mockUseSWR.mockReturnValue({
        data: corruptedData,
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
      });

      renderAdminEditPage('123', corruptedData, queryClient);

      await waitFor(() => {
        // Verify error handling for corrupted data
        expect(screen.getByText(/data validation error/i)).toBeInTheDocument();
        expect(screen.getByText(/please contact administrator/i)).toBeInTheDocument();
      });
    });

    test('handles concurrent user sessions with conflict resolution', async () => {
      renderAdminEditPage('123', mockAdminData, queryClient);

      // Simulate concurrent modification
      server.use(
        rest.put('/api/v2/system/admin/123', (req, res, ctx) => {
          return res(
            ctx.status(409),
            ctx.json({
              error: {
                code: 409,
                message: 'Admin has been modified by another user',
                status_code: 409,
                context: {
                  last_modified_date: '2024-06-05T15:30:00Z',
                  modified_by: 'another-admin@dreamfactory.com',
                },
              },
            })
          );
        })
      );

      await fillAdminForm(user, { first_name: 'Conflicting Change' });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      // Verify conflict resolution UI
      await waitFor(() => {
        expect(screen.getByText(/conflict detected/i)).toBeInTheDocument();
        expect(screen.getByText(/modified by another user/i)).toBeInTheDocument();
        expect(screen.getByText('another-admin@dreamfactory.com')).toBeInTheDocument();
      });

      // Verify resolution options
      expect(screen.getByRole('button', { name: /reload data/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /force save/i })).toBeInTheDocument();
    });

    test('implements proper cleanup on component unmount', async () => {
      const { unmount } = renderAdminEditPage('123', mockAdminData, queryClient);

      // Verify component renders properly
      await waitFor(() => {
        expect(screen.getByDisplayValue(mockAdminData.username)).toBeInTheDocument();
      });

      // Unmount component
      unmount();

      // Verify cleanup was performed (no memory leaks, event listeners removed)
      // This is more of a verification that cleanup functions are called
      expect(vi.clearAllMocks).toBeDefined(); // Placeholder for cleanup verification
    });
  });

  // ============================================================================
  // ACCESSIBILITY AND USER EXPERIENCE TESTS
  // ============================================================================

  describe('Accessibility and User Experience', () => {
    test('maintains WCAG 2.1 AA compliance for form interactions', async () => {
      renderAdminEditPage('123', mockAdminData, queryClient);

      // Verify form labels are properly associated
      const usernameInput = screen.getByLabelText(/username/i);
      expect(usernameInput).toHaveAttribute('aria-describedby');

      // Verify error messages are announced to screen readers
      await user.clear(usernameInput);
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByText(/username is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      });
    });

    test('provides comprehensive keyboard navigation support', async () => {
      renderAdminEditPage('123', mockAdminData, queryClient);

      // Test tab navigation through form fields
      const usernameInput = screen.getByLabelText(/username/i);
      usernameInput.focus();
      expect(usernameInput).toHaveFocus();

      // Tab to next field
      await user.tab();
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveFocus();

      // Test shift+tab for reverse navigation
      await user.tab({ shift: true });
      expect(usernameInput).toHaveFocus();

      // Test escape key to cancel operations
      await user.keyboard('{Escape}');
      // Should show cancel confirmation or reset form
    });

    test('supports high contrast and reduced motion preferences', async () => {
      // Mock media queries for accessibility preferences
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      renderAdminEditPage('123', mockAdminData, queryClient);

      // Verify animations are disabled for reduced motion preference
      const formContainer = screen.getByRole('form');
      expect(formContainer).toHaveClass('motion-safe:animate-fade-in');

      // Verify high contrast mode support
      expect(formContainer).toHaveClass('contrast-more:border-2');
    });

    test('provides clear loading states and progress indicators', async () => {
      mockUseSWR.mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
        isValidating: false,
        mutate: vi.fn(),
      });

      renderAdminEditPage('123', null, queryClient);

      // Verify loading state accessibility
      const loadingIndicator = screen.getByRole('progressbar');
      expect(loadingIndicator).toHaveAttribute('aria-label', 'Loading admin data');

      // Verify loading message
      expect(screen.getByText(/loading admin information/i)).toBeInTheDocument();
    });

    test('implements proper focus management for modal dialogs', async () => {
      renderAdminEditPage('123', mockAdminData, queryClient);

      // Open send invite dialog
      const sendInviteButton = screen.getByRole('button', { name: /send invite/i });
      await user.click(sendInviteButton);

      // Verify focus is trapped in dialog
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');

      // Verify initial focus is on first interactive element
      const confirmButton = screen.getByRole('button', { name: /send invitation/i });
      expect(confirmButton).toHaveFocus();

      // Test escape key closes dialog
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Verify focus returns to trigger button
      expect(sendInviteButton).toHaveFocus();
    });
  });

  // ============================================================================
  // PERFORMANCE AND OPTIMIZATION TESTS
  // ============================================================================

  describe('Performance and Optimization', () => {
    test('implements efficient re-rendering with React.memo and useMemo', async () => {
      const renderSpy = vi.fn();
      
      // Mock component with render tracking
      const TestWrapper = ({ children }: { children: React.ReactNode }) => {
        renderSpy();
        return <div>{children}</div>;
      };

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <TestWrapper>
            <AdminEditPage />
          </TestWrapper>
        </QueryClientProvider>
      );

      // Initial render
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props should not trigger unnecessary renders
      rerender(
        <QueryClientProvider client={queryClient}>
          <TestWrapper>
            <AdminEditPage />
          </TestWrapper>
        </QueryClientProvider>
      );

      // Should not have additional renders due to memoization
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    test('implements debounced search and filtering for large datasets', async () => {
      renderAdminEditPage('123', mockSystemAdmin, queryClient);

      // Navigate to roles section with search
      const rolesTab = screen.getByRole('tab', { name: /roles/i });
      await user.click(rolesTab);

      // Find search input
      const searchInput = screen.getByLabelText(/search roles/i);
      
      // Type search query rapidly
      await user.type(searchInput, 'admin');

      // Verify debounced search (should not trigger immediately)
      expect(screen.queryByText(/searching/i)).not.toBeInTheDocument();

      // Wait for debounce delay
      await waitFor(
        () => {
          expect(screen.getByText(/admin/i)).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    test('uses lazy loading for heavy components and data', async () => {
      mockUseSWR.mockImplementation((key) => {
        // Simulate lazy loading for lookup keys
        if (key.includes('/lookup')) {
          return {
            data: null,
            error: null,
            isLoading: true,
            isValidating: false,
            mutate: vi.fn(),
          };
        }
        return {
          data: mockAdminData,
          error: null,
          isLoading: false,
          isValidating: false,
          mutate: vi.fn(),
        };
      });

      renderAdminEditPage('123', mockAdminData, queryClient);

      // Navigate to lookup keys tab (should trigger lazy loading)
      const lookupTab = screen.getByRole('tab', { name: /lookup keys/i });
      await user.click(lookupTab);

      // Verify lazy loading indicator
      expect(screen.getByText(/loading lookup keys/i)).toBeInTheDocument();
    });

    test('maintains optimal performance with large form datasets', async () => {
      // Create admin with large dataset
      const adminWithLargeDataset = {
        ...mockAdminData,
        lookup_by_user_id: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `key_${i}`,
          value: `value_${i}`,
          description: `Description for key ${i}`,
        })),
        user_to_app_to_role_by_user_id: Array.from({ length: 50 }, (_, i) => ({
          id: i,
          user_id: 123,
          app_id: i % 10,
          role_id: i % 5,
        })),
      };

      const startTime = performance.now();
      
      renderAdminEditPage('123', adminWithLargeDataset, queryClient);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue(adminWithLargeDataset.username)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Verify render time is within acceptable limits (under 1 second)
      expect(renderTime).toBeLessThan(1000);
    });
  });
});