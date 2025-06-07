/**
 * @fileoverview Comprehensive Vitest test suite for UserDetails React component
 * @description Extensive testing coverage for React user details component migrated from Angular
 * with React Hook Form, Zod validation, MSW API mocking, accessibility compliance, and performance validation
 * @module UserDetailsComponentTest
 * @version 1.0.0
 * @since 2024-12-19
 */

import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, accessibilityUtils, headlessUIUtils } from '@/test/utils/test-utils';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { axe, toHaveNoViolations } from 'jest-axe';

// Component imports
import { UserDetails } from './user-details';
import type { UserDetailsProps, UserDetailsFormData, UserDetailsRef } from './types';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// ============================================================================
// MSW SERVER SETUP
// ============================================================================

/**
 * Mock Service Worker handlers for comprehensive API testing
 * Provides realistic DreamFactory API responses for all user detail operations
 */
const mockHandlers = [
  // User creation endpoint
  rest.post('/api/v2/system/user', (req, res, ctx) => {
    return res(
      ctx.delay(50), // Simulate network latency under performance requirements
      ctx.status(201),
      ctx.json({
        resource: [
          {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            name: 'Test User',
            isActive: true,
            created_date: new Date().toISOString(),
          }
        ]
      })
    );
  }),

  // User update endpoint
  rest.put('/api/v2/system/user/1', (req, res, ctx) => {
    return res(
      ctx.delay(50),
      ctx.status(200),
      ctx.json({
        id: 1,
        username: 'updateduser',
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'User',
        name: 'Updated User',
        isActive: true,
        updated_date: new Date().toISOString(),
      })
    );
  }),

  // Admin creation endpoint
  rest.post('/api/v2/system/admin', (req, res, ctx) => {
    return res(
      ctx.delay(50),
      ctx.status(201),
      ctx.json({
        resource: [
          {
            id: 1,
            username: 'testadmin',
            email: 'admin@example.com',
            firstName: 'Test',
            lastName: 'Admin',
            name: 'Test Admin',
            isActive: true,
            created_date: new Date().toISOString(),
          }
        ]
      })
    );
  }),

  // Applications endpoint for role assignment
  rest.get('/api/v2/system/app', (req, res, ctx) => {
    return res(
      ctx.delay(30),
      ctx.status(200),
      ctx.json({
        resource: [
          { id: '1', name: 'api_docs', label: 'API Documentation' },
          { id: '2', name: 'admin_app', label: 'Admin Application' },
          { id: '3', name: 'file_manager', label: 'File Manager' },
        ]
      })
    );
  }),

  // Roles endpoint for role assignment
  rest.get('/api/v2/system/role', (req, res, ctx) => {
    return res(
      ctx.delay(30),
      ctx.status(200),
      ctx.json({
        resource: [
          { id: '1', name: 'admin', label: 'Administrator' },
          { id: '2', name: 'user', label: 'User' },
          { id: '3', name: 'viewer', label: 'Viewer' },
        ]
      })
    );
  }),

  // Paywall status endpoint
  rest.get('/api/v2/system/paywall', (req, res, ctx) => {
    return res(
      ctx.delay(20),
      ctx.status(200),
      ctx.json({
        isActive: false,
        restrictedFeatures: [],
        upgradeUrl: 'https://example.com/upgrade',
      })
    );
  }),

  // Error scenario for validation testing
  rest.post('/api/v2/system/user/error', (req, res, ctx) => {
    return res(
      ctx.delay(50),
      ctx.status(400),
      ctx.json({
        error: {
          code: 400,
          message: 'Validation failed',
          details: [
            { field: 'email', message: 'Email already exists' }
          ]
        }
      })
    );
  }),
];

const server = setupServer(...mockHandlers);

// ============================================================================
// TEST SETUP AND CONFIGURATION
// ============================================================================

/**
 * Default test props for consistent testing baseline
 */
const defaultProps: UserDetailsProps = {
  mode: 'create',
  userType: 'users',
  disabled: false,
  loading: false,
  'data-testid': 'user-details-form',
  apps: [
    { id: '1', name: 'api_docs', label: 'API Documentation' },
    { id: '2', name: 'admin_app', label: 'Admin Application' },
    { id: '3', name: 'file_manager', label: 'File Manager' },
  ],
  roles: [
    { id: '1', name: 'admin', label: 'Administrator' },
    { id: '2', name: 'user', label: 'User' },
    { id: '3', name: 'viewer', label: 'Viewer' },
  ],
  callbacks: {
    onSubmit: vi.fn(),
    onChange: vi.fn(),
    onError: vi.fn(),
    onSuccess: vi.fn(),
    onReset: vi.fn(),
  },
};

/**
 * Mock user data for edit mode testing
 */
const mockUserData: Partial<UserDetailsFormData> = {
  profileDetailsGroup: {
    username: 'existinguser',
    email: 'existing@example.com',
    firstName: 'Existing',
    lastName: 'User',
    name: 'Existing User',
    phone: '+1234567890',
  },
  isActive: true,
  tabs: [
    { id: 'api-docs', name: 'api-docs', label: 'API Documentation', selected: true, enabled: true },
    { id: 'schema', name: 'schema', label: 'Schema Management', selected: false, enabled: true },
  ],
  lookupKeys: [
    { name: 'api_key', value: 'test_key_123', private: true },
  ],
  appRoles: [
    { app: '1', role: '2', appName: 'API Documentation', roleName: 'User', active: true },
  ],
};

/**
 * Performance measurement utility for validation requirements
 */
const measurePerformance = async (operation: () => Promise<void> | void): Promise<number> => {
  const startTime = performance.now();
  await operation();
  const endTime = performance.now();
  return endTime - startTime;
};

// ============================================================================
// GLOBAL TEST LIFECYCLE
// ============================================================================

beforeEach(() => {
  server.listen({ onUnhandledRequest: 'error' });
  
  // Mock timers for performance testing
  vi.useFakeTimers();
  
  // Mock console methods to reduce test noise
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  server.resetHandlers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ============================================================================
// COMPONENT RENDERING AND BASIC FUNCTIONALITY TESTS
// ============================================================================

describe('UserDetails Component', () => {
  describe('Basic Rendering and Configuration', () => {
    test('renders user creation form with correct initial state', () => {
      renderWithProviders(<UserDetails {...defaultProps} />);

      // Verify core form elements
      expect(screen.getByTestId('user-details-form')).toBeInTheDocument();
      expect(screen.getByText('Create New User')).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();

      // Verify send invite is enabled by default in create mode
      expect(screen.getByLabelText(/send email invitation/i)).toBeChecked();
      
      // Verify user status toggle
      expect(screen.getByLabelText(/active/i)).toBeChecked();
      
      // Verify action buttons
      expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    test('renders admin creation form with access control section', () => {
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          userType="admins"
        />
      );

      // Verify admin-specific elements
      expect(screen.getByText('Create New User')).toBeInTheDocument();
      expect(screen.getByText(/administrator/i)).toBeInTheDocument();
      
      // Verify admin access control section
      expect(screen.getByText('Admin Access Control')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select all/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /deselect all/i })).toBeInTheDocument();
      
      // Verify default admin tabs are rendered
      expect(screen.getByLabelText(/api documentation/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/schema management/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/service configuration/i)).toBeInTheDocument();
    });

    test('renders edit mode with populated form data', () => {
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          mode="edit"
          currentProfile={mockUserData}
        />
      );

      // Verify edit mode header
      expect(screen.getByText('Edit User')).toBeInTheDocument();
      
      // Verify populated form fields
      expect(screen.getByDisplayValue('existinguser')).toBeInTheDocument();
      expect(screen.getByDisplayValue('existing@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing')).toBeInTheDocument();
      expect(screen.getByDisplayValue('User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
      
      // Verify edit mode button
      expect(screen.getByRole('button', { name: /update user/i })).toBeInTheDocument();
      
      // Verify set password toggle is available in edit mode
      expect(screen.getByLabelText(/set password/i)).toBeInTheDocument();
    });

    test('handles loading state correctly', () => {
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          loading={true}
        />
      );

      // Verify loading indicator
      expect(screen.getByLabelText(/loading user details form/i)).toBeInTheDocument();
      expect(screen.getByText(/loading user details/i)).toBeInTheDocument();
      
      // Verify form is not rendered during loading
      expect(screen.queryByTestId('user-details-form')).not.toBeInTheDocument();
    });

    test('handles disabled state correctly', () => {
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          disabled={true}
        />
      );

      // Verify all form fields are disabled
      expect(screen.getByLabelText(/username/i)).toBeDisabled();
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/first name/i)).toBeDisabled();
      expect(screen.getByLabelText(/last name/i)).toBeDisabled();
      
      // Verify action buttons are disabled
      expect(screen.getByRole('button', { name: /create user/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /reset/i })).toBeDisabled();
    });
  });

  // ========================================================================
  // FORM WORKFLOW AND VALIDATION TESTS
  // ========================================================================

  describe('Form Workflow and Validation', () => {
    test('validates required fields with real-time feedback under 100ms', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserDetails {...defaultProps} />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);

      // Test real-time validation performance
      const validationTime = await measurePerformance(async () => {
        await user.type(usernameInput, 'a');
        await user.clear(usernameInput);
        await user.tab(); // Trigger validation
      });

      // Verify validation occurs under 100ms requirement
      expect(validationTime).toBeLessThan(100);

      // Verify validation error messages appear
      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
      });

      // Test email validation
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      // Test password validation requirements
      const sendInviteToggle = screen.getByLabelText(/send email invitation/i);
      await user.click(sendInviteToggle); // Disable invite to show password fields

      await waitFor(() => {
        const passwordInput = screen.getByLabelText(/^password$/i);
        expect(passwordInput).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, '123');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    test('validates complex password requirements', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserDetails {...defaultProps} />);

      // Disable send invite to show password fields
      const sendInviteToggle = screen.getByLabelText(/send email invitation/i);
      await user.click(sendInviteToggle);

      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      // Test weak password
      await user.type(passwordInput, 'weakpass');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument();
      });

      // Test strong password
      await user.clear(passwordInput);
      await user.type(passwordInput, 'StrongPass123!');

      // Test password confirmation mismatch
      await user.type(confirmPasswordInput, 'DifferentPass123!');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      // Test password confirmation match
      await user.clear(confirmPasswordInput);
      await user.type(confirmPasswordInput, 'StrongPass123!');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
      });
    });

    test('handles form submission successfully', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      const mockOnSuccess = vi.fn();

      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          callbacks={{ 
            ...defaultProps.callbacks,
            onSubmit: mockOnSubmit,
            onSuccess: mockOnSuccess,
          }}
        />
      );

      // Fill out required fields
      await user.type(screen.getByLabelText(/username/i), 'testuser123');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(screen.getByLabelText(/name/i), 'Test User');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      // Verify submission callback was called
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });

      // Verify success callback was called
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });

      // Verify form data structure
      const submittedData = mockOnSubmit.mock.calls[0][0];
      expect(submittedData.profileDetailsGroup.username).toBe('testuser123');
      expect(submittedData.profileDetailsGroup.email).toBe('test@example.com');
      expect(submittedData.isActive).toBe(true);
      expect(submittedData.sendInvite).toBe(true);
    });

    test('handles form submission errors gracefully', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));
      const mockOnError = vi.fn();

      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          callbacks={{ 
            ...defaultProps.callbacks,
            onSubmit: mockOnSubmit,
            onError: mockOnError,
          }}
        />
      );

      // Fill out required fields
      await user.type(screen.getByLabelText(/username/i), 'testuser123');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(screen.getByLabelText(/name/i), 'Test User');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      // Verify error callback was called
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledTimes(1);
      });

      // Verify error was passed to callback
      const errorArg = mockOnError.mock.calls[0][0];
      expect(errorArg.message).toBe('Submission failed');
    });
  });

  // ========================================================================
  // DYNAMIC FIELD MANAGEMENT TESTS
  // ========================================================================

  describe('Dynamic Field Management', () => {
    test('manages password fields based on invite selection in create mode', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserDetails {...defaultProps} />);

      // Initially, send invite should be enabled and password fields hidden
      expect(screen.getByLabelText(/send email invitation/i)).toBeChecked();
      expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument();

      // Toggle send invite off - password fields should appear
      const sendInviteToggle = screen.getByLabelText(/send email invitation/i);
      await user.click(sendInviteToggle);

      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      });

      // Toggle send invite back on - password fields should disappear
      await user.click(sendInviteToggle);

      await waitFor(() => {
        expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
      });
    });

    test('manages password fields based on set password toggle in edit mode', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          mode="edit"
          currentProfile={mockUserData}
        />
      );

      // Initially, set password should be off and password fields hidden
      expect(screen.getByLabelText(/set password/i)).not.toBeChecked();
      expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument();

      // Toggle set password on - password fields should appear
      const setPasswordToggle = screen.getByLabelText(/set password/i);
      await user.click(setPasswordToggle);

      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      });

      // Toggle set password off - password fields should disappear
      await user.click(setPasswordToggle);

      await waitFor(() => {
        expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
      });
    });

    test('provides password visibility toggle functionality', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserDetails {...defaultProps} />);

      // Disable send invite to show password fields
      const sendInviteToggle = screen.getByLabelText(/send email invitation/i);
      await user.click(sendInviteToggle);

      await waitFor(() => {
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Find and click password visibility toggle
      const showPasswordButton = screen.getByLabelText(/show password/i);
      await user.click(showPasswordButton);

      // Password field should now be text type
      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/hide password/i)).toBeInTheDocument();

      // Click again to hide password
      const hidePasswordButton = screen.getByLabelText(/hide password/i);
      await user.click(hidePasswordButton);

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText(/show password/i)).toBeInTheDocument();
    });

    test('manages lookup keys dynamic field array', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserDetails {...defaultProps} />);

      // Initially no lookup keys should be present
      expect(screen.getByText(/no lookup keys configured/i)).toBeInTheDocument();

      // Add a lookup key
      const addKeyButton = screen.getByRole('button', { name: /add key/i });
      await user.click(addKeyButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/key name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/key value/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/private/i)).toBeInTheDocument();
      });

      // Fill out the lookup key
      await user.type(screen.getByLabelText(/key name/i), 'api_key');
      await user.type(screen.getByLabelText(/key value/i), 'test_value_123');

      // Toggle private setting
      const privateToggle = screen.getByLabelText(/private/i);
      await user.click(privateToggle);

      // Add another lookup key
      await user.click(addKeyButton);

      await waitFor(() => {
        const keyNameInputs = screen.getAllByLabelText(/key name/i);
        expect(keyNameInputs).toHaveLength(2);
      });

      // Remove the first lookup key
      const removeButtons = screen.getAllByLabelText(/remove lookup key/i);
      await user.click(removeButtons[0]);

      await waitFor(() => {
        const keyNameInputs = screen.getAllByLabelText(/key name/i);
        expect(keyNameInputs).toHaveLength(1);
      });
    });
  });

  // ========================================================================
  // TAB ACCESS CONTROL TESTS (ADMIN ONLY)
  // ========================================================================

  describe('Tab Access Control (Admin Users)', () => {
    test('displays admin access control for admin user type', () => {
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          userType="admins"
        />
      );

      expect(screen.getByText('Admin Access Control')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select all/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /deselect all/i })).toBeInTheDocument();

      // Verify default admin tabs are rendered
      expect(screen.getByLabelText(/api documentation/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/schema management/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/service configuration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/file management/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/application management/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/user management/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role management/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/system configuration/i)).toBeInTheDocument();
    });

    test('does not display admin access control for regular users', () => {
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          userType="users"
        />
      );

      expect(screen.queryByText('Admin Access Control')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /select all/i })).not.toBeInTheDocument();
    });

    test('handles select all functionality', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          userType="admins"
        />
      );

      // Initially, no tabs should be selected
      const tabCheckboxes = screen.getAllByRole('checkbox', { name: /access/i });
      tabCheckboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });

      // Click select all
      const selectAllButton = screen.getByRole('button', { name: /select all/i });
      await user.click(selectAllButton);

      // All tabs should now be selected
      await waitFor(() => {
        tabCheckboxes.forEach(checkbox => {
          expect(checkbox).toBeChecked();
        });
      });

      // Select all button should be disabled
      expect(selectAllButton).toBeDisabled();

      // Deselect all button should be enabled
      const deselectAllButton = screen.getByRole('button', { name: /deselect all/i });
      expect(deselectAllButton).not.toBeDisabled();
    });

    test('handles deselect all functionality', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          userType="admins"
        />
      );

      // First select all tabs
      const selectAllButton = screen.getByRole('button', { name: /select all/i });
      await user.click(selectAllButton);

      // Then deselect all
      const deselectAllButton = screen.getByRole('button', { name: /deselect all/i });
      await user.click(deselectAllButton);

      // All tabs should now be unselected
      await waitFor(() => {
        const tabCheckboxes = screen.getAllByRole('checkbox', { name: /access/i });
        tabCheckboxes.forEach(checkbox => {
          expect(checkbox).not.toBeChecked();
        });
      });

      // Deselect all button should be disabled
      expect(deselectAllButton).toBeDisabled();
    });

    test('handles individual tab selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          userType="admins"
        />
      );

      // Select API documentation tab
      const apiDocsCheckbox = screen.getByLabelText(/api documentation/i);
      await user.click(apiDocsCheckbox);

      expect(apiDocsCheckbox).toBeChecked();

      // Select schema management tab
      const schemaCheckbox = screen.getByLabelText(/schema management/i);
      await user.click(schemaCheckbox);

      expect(schemaCheckbox).toBeChecked();

      // Unselect API documentation tab
      await user.click(apiDocsCheckbox);

      expect(apiDocsCheckbox).not.toBeChecked();
      expect(schemaCheckbox).toBeChecked(); // Should remain checked
    });

    test('displays tab selection count', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          userType="admins"
        />
      );

      // Select a couple of tabs
      await user.click(screen.getByLabelText(/api documentation/i));
      await user.click(screen.getByLabelText(/schema management/i));

      // Should show count
      await waitFor(() => {
        expect(screen.getByText(/2 of 8 tabs selected/i)).toBeInTheDocument();
      });
    });
  });

  // ========================================================================
  // PAYWALL INTEGRATION TESTS
  // ========================================================================

  describe('Paywall Integration', () => {
    test('displays paywall warning for restricted tab access', () => {
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          userType="admins"
          paywall={{
            isActive: true,
            restrictedFeatures: ['tab-access'],
            upgradeUrl: 'https://example.com/upgrade',
          }}
        />
      );

      expect(screen.getByText('Premium Feature Required')).toBeInTheDocument();
      expect(screen.getByText(/tab access control is available with a premium license/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upgrade now/i })).toBeInTheDocument();
    });

    test('displays paywall warning for restricted lookup keys', () => {
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          paywall={{
            isActive: true,
            restrictedFeatures: ['lookup-keys'],
            upgradeUrl: 'https://example.com/upgrade',
          }}
        />
      );

      expect(screen.getByText(/lookup keys are available with a premium license/i)).toBeInTheDocument();
    });

    test('displays paywall warning for restricted app roles', () => {
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          paywall={{
            isActive: true,
            restrictedFeatures: ['app-roles'],
            upgradeUrl: 'https://example.com/upgrade',
          }}
        />
      );

      expect(screen.getByText(/app role assignments are available with a premium license/i)).toBeInTheDocument();
    });

    test('clears tab selection when paywall is enforced', async () => {
      const user = userEvent.setup();
      
      // Start with no paywall restrictions
      const { rerender } = renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          userType="admins"
          paywall={{ isActive: false, restrictedFeatures: [] }}
        />
      );

      // Select some tabs
      await user.click(screen.getByLabelText(/api documentation/i));
      await user.click(screen.getByLabelText(/schema management/i));

      // Enable paywall restrictions
      rerender(
        <UserDetails 
          {...defaultProps} 
          userType="admins"
          paywall={{
            isActive: true,
            restrictedFeatures: ['tab-access'],
            upgradeUrl: 'https://example.com/upgrade',
          }}
        />
      );

      // Tabs should be cleared and paywall message shown
      expect(screen.getByText('Premium Feature Required')).toBeInTheDocument();
      expect(screen.queryByLabelText(/api documentation/i)).not.toBeInTheDocument();
    });

    test('handles upgrade URL click', async () => {
      const user = userEvent.setup();
      const mockWindowOpen = vi.fn();
      
      // Mock window.open
      const originalOpen = window.open;
      window.open = mockWindowOpen;

      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          userType="admins"
          paywall={{
            isActive: true,
            restrictedFeatures: ['tab-access'],
            upgradeUrl: 'https://example.com/upgrade',
          }}
        />
      );

      const upgradeButton = screen.getByRole('button', { name: /upgrade now/i });
      await user.click(upgradeButton);

      expect(mockWindowOpen).toHaveBeenCalledWith('https://example.com/upgrade', '_blank');

      // Restore original window.open
      window.open = originalOpen;
    });
  });

  // ========================================================================
  // ACCESSIBILITY COMPLIANCE TESTS (WCAG 2.1 AA)
  // ========================================================================

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    test('passes automated accessibility audit', async () => {
      const { container } = renderWithProviders(<UserDetails {...defaultProps} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('provides proper ARIA labels for all interactive elements', () => {
      renderWithProviders(<UserDetails {...defaultProps} />);

      // Check form fields have proper labels
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();

      // Check toggles have proper labels
      expect(screen.getByLabelText(/send email invitation/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/active/i)).toBeInTheDocument();

      // Check buttons have proper accessible names
      expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    test('maintains proper focus management', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<UserDetails {...defaultProps} />);

      // Test focus trap within form
      const focusableElements = accessibilityUtils.getFocusableElements(container);
      expect(focusableElements.length).toBeGreaterThan(0);

      // Verify all focusable elements are keyboard accessible
      focusableElements.forEach(element => {
        expect(accessibilityUtils.isKeyboardAccessible(element)).toBe(true);
      });

      // Test tab navigation
      const navigationResult = await accessibilityUtils.testKeyboardNavigation(container, user);
      expect(navigationResult.success).toBe(true);
    });

    test('provides proper error announcements for screen readers', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserDetails {...defaultProps} />);

      // Trigger validation error
      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'a');
      await user.clear(usernameInput);
      await user.tab();

      // Verify error has proper ARIA attributes
      await waitFor(() => {
        const errorMessage = screen.getByText(/username must be at least 3 characters/i);
        expect(errorMessage).toBeInTheDocument();
        
        // Error should be associated with the input field
        expect(usernameInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    test('supports high contrast mode', () => {
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          theme="dark"
        />
      );

      const formContainer = screen.getByTestId('user-details-form');
      
      // Verify dark theme classes are applied
      expect(formContainer).toHaveClass('dark:bg-gray-900');
      
      // Check that text elements have proper contrast classes
      const headings = screen.getAllByRole('heading');
      headings.forEach(heading => {
        expect(heading).toHaveClass('dark:text-gray-100');
      });
    });

    test('provides sufficient color contrast', () => {
      const { container } = renderWithProviders(<UserDetails {...defaultProps} />);

      // Check all text elements for adequate contrast
      const textElements = container.querySelectorAll('p, span, label, button');
      textElements.forEach(element => {
        expect(accessibilityUtils.hasAdequateContrast(element as HTMLElement)).toBe(true);
      });
    });

    test('supports screen reader navigation with proper headings', () => {
      renderWithProviders(<UserDetails {...defaultProps} userType="admins" />);

      // Verify heading hierarchy
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Create New User');

      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(sectionHeadings.length).toBeGreaterThan(0);

      // Verify section headings have meaningful content
      const expectedSections = [
        'Profile Information',
        'Password Settings',
        'Access Control',
        'Configuration',
        'Role Assignments'
      ];

      expectedSections.forEach(sectionName => {
        expect(screen.getByText(sectionName)).toBeInTheDocument();
      });
    });
  });

  // ========================================================================
  // KEYBOARD NAVIGATION TESTS
  // ========================================================================

  describe('Keyboard Navigation', () => {
    test('supports tab navigation through all form fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserDetails {...defaultProps} />);

      // Start with username field
      const usernameInput = screen.getByLabelText(/username/i);
      usernameInput.focus();
      expect(document.activeElement).toBe(usernameInput);

      // Tab to email field
      await user.keyboard('{Tab}');
      const emailInput = screen.getByLabelText(/email/i);
      expect(document.activeElement).toBe(emailInput);

      // Tab to first name field
      await user.keyboard('{Tab}');
      const firstNameInput = screen.getByLabelText(/first name/i);
      expect(document.activeElement).toBe(firstNameInput);

      // Continue tabbing through all fields
      await user.keyboard('{Tab}');
      const lastNameInput = screen.getByLabelText(/last name/i);
      expect(document.activeElement).toBe(lastNameInput);

      await user.keyboard('{Tab}');
      const displayNameInput = screen.getByLabelText(/display name/i);
      expect(document.activeElement).toBe(displayNameInput);
    });

    test('supports keyboard interaction with toggles', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserDetails {...defaultProps} />);

      const sendInviteToggle = screen.getByLabelText(/send email invitation/i);
      
      // Focus the toggle
      sendInviteToggle.focus();
      expect(document.activeElement).toBe(sendInviteToggle);

      // Press space to toggle
      await user.keyboard(' ');
      expect(sendInviteToggle).not.toBeChecked();

      // Press space again to toggle back
      await user.keyboard(' ');
      expect(sendInviteToggle).toBeChecked();

      // Press Enter to toggle
      await user.keyboard('{Enter}');
      expect(sendInviteToggle).not.toBeChecked();
    });

    test('supports keyboard interaction with buttons', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          callbacks={{ ...defaultProps.callbacks, onSubmit: mockOnSubmit }}
        />
      );

      // Fill required fields first
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(screen.getByLabelText(/display name/i), 'Test User');

      // Focus submit button and press Enter
      const submitButton = screen.getByRole('button', { name: /create user/i });
      submitButton.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });
    });

    test('supports keyboard navigation in admin tab selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          userType="admins"
        />
      );

      // Navigate to first tab checkbox
      const apiDocsCheckbox = screen.getByLabelText(/api documentation/i);
      apiDocsCheckbox.focus();
      expect(document.activeElement).toBe(apiDocsCheckbox);

      // Press space to select
      await user.keyboard(' ');
      expect(apiDocsCheckbox).toBeChecked();

      // Tab to next checkbox
      await user.keyboard('{Tab}');
      const schemaCheckbox = screen.getByLabelText(/schema management/i);
      expect(document.activeElement).toBe(schemaCheckbox);

      // Press space to select
      await user.keyboard(' ');
      expect(schemaCheckbox).toBeChecked();
    });

    test('handles escape key for form cancellation', async () => {
      const user = userEvent.setup();
      const mockOnCancel = vi.fn();
      
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          callbacks={{ ...defaultProps.callbacks, onCancel: mockOnCancel }}
        />
      );

      // Focus form and press Escape
      const formContainer = screen.getByTestId('user-details-form');
      formContainer.focus();
      await user.keyboard('{Escape}');

      // Should not trigger cancel by default (Escape doesn't cancel forms)
      expect(mockOnCancel).not.toHaveBeenCalled();

      // But clicking cancel button should work
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  // ========================================================================
  // THEME SWITCHING TESTS
  // ========================================================================

  describe('Theme Switching', () => {
    test('applies light theme correctly', () => {
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          theme="light"
        />
      );

      const formContainer = screen.getByTestId('user-details-form');
      
      // Verify light theme classes
      expect(formContainer).toHaveClass('bg-white');
      expect(formContainer).not.toHaveClass('dark:bg-gray-900');
    });

    test('applies dark theme correctly', () => {
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          theme="dark"
        />
      );

      const formContainer = screen.getByTestId('user-details-form');
      
      // Verify dark theme classes are present
      expect(formContainer).toHaveClass('dark:bg-gray-900');
      
      // Check text elements have dark theme classes
      const headings = screen.getAllByRole('heading');
      headings.forEach(heading => {
        expect(heading).toHaveClass('dark:text-gray-100');
      });
    });

    test('responds to system theme changes', () => {
      const { rerender } = renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          theme="system"
          darkMode={false}
        />
      );

      const formContainer = screen.getByTestId('user-details-form');
      
      // Should use light theme when system is light
      expect(formContainer).toHaveClass('bg-white');

      // Change to dark mode
      rerender(
        <UserDetails 
          {...defaultProps} 
          theme="system"
          darkMode={true}
        />
      );

      // Should now use dark theme
      expect(formContainer).toHaveClass('dark:bg-gray-900');
    });

    test('applies theme-specific button styles', () => {
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          theme="dark"
        />
      );

      // Check that buttons have appropriate theme-aware classes
      const submitButton = screen.getByRole('button', { name: /create user/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      // Buttons should have theme-aware styling
      expect(submitButton).toHaveClass('bg-blue-600');
      expect(cancelButton).toHaveClass('border-gray-300');
    });
  });

  // ========================================================================
  // PERFORMANCE TESTS
  // ========================================================================

  describe('Performance Validation', () => {
    test('form validation completes under 100ms requirement', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserDetails {...defaultProps} />);

      const usernameInput = screen.getByLabelText(/username/i);

      // Measure validation performance
      const validationTime = await measurePerformance(async () => {
        await user.type(usernameInput, 'test');
        await user.clear(usernameInput);
        await user.tab(); // Trigger validation
        await waitFor(() => {
          expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
        });
      });

      // Verify under 100ms requirement
      expect(validationTime).toBeLessThan(100);
    });

    test('form rendering completes within performance budget', async () => {
      const renderTime = await measurePerformance(() => {
        renderWithProviders(<UserDetails {...defaultProps} />);
      });

      // Component should render quickly (under 50ms)
      expect(renderTime).toBeLessThan(50);
    });

    test('large dataset handling maintains performance', async () => {
      // Create large dataset for admin tabs
      const largeTabs = Array.from({ length: 100 }, (_, index) => ({
        id: `tab-${index}`,
        name: `tab-${index}`,
        label: `Tab ${index}`,
        selected: false,
        enabled: true,
      }));

      const renderTime = await measurePerformance(() => {
        renderWithProviders(
          <UserDetails 
            {...defaultProps} 
            userType="admins"
            availableTabs={largeTabs}
          />
        );
      });

      // Should still render quickly even with large dataset
      expect(renderTime).toBeLessThan(200);
    });

    test('form submission response time meets requirements', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn().mockImplementation(async () => {
        // Simulate network delay within API requirements (under 2 seconds)
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          callbacks={{ ...defaultProps.callbacks, onSubmit: mockOnSubmit }}
        />
      );

      // Fill required fields
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(screen.getByLabelText(/display name/i), 'Test User');

      // Measure submission time
      const submissionTime = await measurePerformance(async () => {
        const submitButton = screen.getByRole('button', { name: /create user/i });
        await user.click(submitButton);
        await waitFor(() => {
          expect(mockOnSubmit).toHaveBeenCalled();
        });
      });

      // Should be responsive (under 200ms for UI interaction)
      expect(submissionTime).toBeLessThan(200);
    });
  });

  // ========================================================================
  // INTEGRATION TESTS
  // ========================================================================

  describe('Component Integration', () => {
    test('integrates properly with React Hook Form provider', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserDetails {...defaultProps} />);

      // Test form context is properly established
      expect(screen.getByRole('form')).toBeInTheDocument();

      // Fill out form and verify values are tracked
      await user.type(screen.getByLabelText(/username/i), 'integration-test');
      await user.type(screen.getByLabelText(/email/i), 'integration@test.com');

      // Values should be reflected in the form
      expect(screen.getByDisplayValue('integration-test')).toBeInTheDocument();
      expect(screen.getByDisplayValue('integration@test.com')).toBeInTheDocument();
    });

    test('integrates with child ProfileDetails component', () => {
      renderWithProviders(<UserDetails {...defaultProps} />);

      // Verify profile details section is rendered
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
      
      // Verify all profile fields are present
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    });

    test('integrates with UserAppRoles component for admin users', () => {
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          userType="admins"
        />
      );

      // Verify role assignment section is rendered
      expect(screen.getByText('Role Assignments')).toBeInTheDocument();
      
      // Should integrate with app roles component
      // (The actual UserAppRoles component would be tested separately)
    });

    test('handles external prop changes gracefully', () => {
      const { rerender } = renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          disabled={false}
        />
      );

      // Initially enabled
      expect(screen.getByLabelText(/username/i)).not.toBeDisabled();

      // Change to disabled
      rerender(
        <UserDetails 
          {...defaultProps} 
          disabled={true}
        />
      );

      // Should now be disabled
      expect(screen.getByLabelText(/username/i)).toBeDisabled();
    });

    test('exposes ref methods for programmatic control', () => {
      const ref = React.createRef<UserDetailsRef>();
      
      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          ref={ref}
        />
      );

      // Verify ref methods are available
      expect(ref.current).toBeDefined();
      expect(ref.current?.submit).toBeInstanceOf(Function);
      expect(ref.current?.reset).toBeInstanceOf(Function);
      expect(ref.current?.validate).toBeInstanceOf(Function);
      expect(ref.current?.getValues).toBeInstanceOf(Function);
      expect(ref.current?.setValues).toBeInstanceOf(Function);
    });
  });

  // ========================================================================
  // EDGE CASES AND ERROR SCENARIOS
  // ========================================================================

  describe('Edge Cases and Error Scenarios', () => {
    test('handles empty required fields gracefully', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserDetails {...defaultProps} />);

      // Try to submit with empty required fields
      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      });

      // Submit button should remain disabled
      expect(submitButton).toBeDisabled();
    });

    test('handles extremely long input values', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserDetails {...defaultProps} />);

      const longString = 'a'.repeat(300); // Exceeds max length

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, longString);
      await user.tab();

      // Should show length validation error
      await waitFor(() => {
        expect(screen.getByText(/username must not exceed 50 characters/i)).toBeInTheDocument();
      });
    });

    test('handles special characters in input fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UserDetails {...defaultProps} />);

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'user@#$%^&*()');
      await user.tab();

      // Should show character validation error
      await waitFor(() => {
        expect(screen.getByText(/username can only contain letters, numbers, underscores, and hyphens/i)).toBeInTheDocument();
      });
    });

    test('handles network errors during form submission', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
      const mockOnError = vi.fn();

      renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          callbacks={{ 
            ...defaultProps.callbacks,
            onSubmit: mockOnSubmit,
            onError: mockOnError,
          }}
        />
      );

      // Fill required fields
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(screen.getByLabelText(/display name/i), 'Test User');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      // Should handle error gracefully
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    test('handles component unmounting during async operations', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      });

      const { unmount } = renderWithProviders(
        <UserDetails 
          {...defaultProps} 
          callbacks={{ ...defaultProps.callbacks, onSubmit: mockOnSubmit }}
        />
      );

      // Fill required fields
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(screen.getByLabelText(/display name/i), 'Test User');

      // Start submission
      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      // Unmount component while submission is pending
      unmount();

      // Should not throw any errors
      expect(() => {
        vi.runAllTimers();
      }).not.toThrow();
    });
  });
});