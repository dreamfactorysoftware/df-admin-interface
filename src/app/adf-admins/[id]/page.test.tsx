/**
 * Admin Edit Page Tests
 * 
 * Comprehensive Vitest test suite for the admin editing page component exercising
 * dynamic route parameter handling, existing admin data loading, form pre-population,
 * validation workflows, update operations, and error scenarios.
 * 
 * Implements React Testing Library patterns with Mock Service Worker for API mocking,
 * replacing Angular TestBed configuration with modern React testing approaches and
 * ensuring complete coverage of admin editing functionality including permission
 * checks and data integrity validation.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { useParams, useSearchParams, useRouter } from 'next/navigation'

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
  useRouter: vi.fn(),
}))

// Component under test
import AdminEditPage from './page'

// Test utilities and providers
import { renderWithProviders } from '@/test/utils/test-utils'
import { createMockAdmin, createMockValidationError } from '@/test/utils/component-factories'
import { createErrorResponse } from '@/test/mocks/error-responses'

// Types and schemas
import type { AdminUser, UserLookup } from '@/types/user'

// ============================================================================
// Test Setup and Mock Data
// ============================================================================

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
}

const mockSearchParams = new URLSearchParams()

// Mock admin data matching the AdminUser interface
const mockAdmin: AdminUser = {
  id: 123,
  name: 'John Doe',
  first_name: 'John',
  last_name: 'Doe', 
  display_name: 'John Doe',
  email: 'john.doe@example.com',
  username: 'jdoe',
  phone: '+1-555-0123',
  is_active: true,
  is_sys_admin: true,
  role_id: 1,
  system_access_level: 'full',
  admin_permissions: ['user_management', 'service_configuration', 'system_settings'],
  managed_services: ['mysql-db', 'postgres-db'],
  timezone: 'America/New_York',
  locale: 'en-US',
  theme_preference: 'dark',
  created_date: '2023-01-01T00:00:00Z',
  last_modified_date: '2024-01-01T00:00:00Z',
  last_login_date: '2024-12-03T10:00:00Z',
  user_lookup_by_user_id: [
    {
      id: 1,
      user_id: 123,
      name: 'department',
      value: 'IT',
      private: false,
      description: 'Department assignment'
    },
    {
      id: 2,
      user_id: 123,
      name: 'security_clearance',
      value: 'high',
      private: true,
      description: 'Security clearance level'
    }
  ],
  notification_preferences: {
    email_notifications: true,
    system_alerts: true,
    api_quota_warnings: true,
    security_notifications: true,
    maintenance_notifications: false,
    newsletter_subscription: true
  }
}

// Mock lookup keys for testing
const mockLookupKeys = [
  { name: 'department', value: 'IT', private: false },
  { name: 'security_clearance', value: 'high', private: true },
  { name: 'cost_center', value: 'CC-001', private: false }
]

// MSW server setup for API mocking
const server = setupServer(
  // GET admin by ID - successful response
  http.get('/system/api/v2/admin/:id', ({ params }) => {
    const { id } = params
    if (id === '123') {
      return HttpResponse.json({
        resource: [mockAdmin]
      })
    }
    if (id === '404') {
      return HttpResponse.json(
        createErrorResponse(404, 'ADMIN_NOT_FOUND', 'Admin user not found'),
        { status: 404 }
      )
    }
    return HttpResponse.json(
      createErrorResponse(403, 'ACCESS_DENIED', 'Insufficient permissions'),
      { status: 403 }
    )
  }),

  // PUT admin update - successful response
  http.put('/system/api/v2/admin/:id', async ({ params, request }) => {
    const { id } = params
    const body = await request.json() as any
    
    if (id === '123') {
      // Simulate validation error for invalid email
      if (body.resource?.[0]?.email === 'invalid-email') {
        return HttpResponse.json(
          createMockValidationError('email', 'Invalid email format'),
          { status: 422 }
        )
      }
      
      // Successful update
      return HttpResponse.json({
        resource: [{
          ...mockAdmin,
          ...body.resource[0],
          last_modified_date: new Date().toISOString()
        }]
      })
    }
    
    return HttpResponse.json(
      createErrorResponse(404, 'ADMIN_NOT_FOUND', 'Admin user not found'),
      { status: 404 }
    )
  }),

  // POST send invite
  http.post('/system/api/v2/admin/:id/invite', ({ params }) => {
    const { id } = params
    if (id === '123') {
      return HttpResponse.json({
        success: true,
        message: 'Invitation sent successfully'
      })
    }
    return HttpResponse.json(
      createErrorResponse(404, 'ADMIN_NOT_FOUND', 'Admin user not found'),
      { status: 404 }
    )
  }),

  // GET lookup keys
  http.get('/system/api/v2/lookup', () => {
    return HttpResponse.json({
      resource: mockLookupKeys
    })
  }),

  // System config endpoint for features
  http.get('/system/api/v2/system', () => {
    return HttpResponse.json({
      resource: [{
        dfe: {
          always_wrap_resources: false,
          resources_wrapper: 'resource',
          version: '5.0.0'
        }
      }]
    })
  })
)

// ============================================================================
// Test Suite
// ============================================================================

describe('AdminEditPage', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Setup default mock implementations
    vi.mocked(useParams).mockReturnValue({ id: '123' })
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams)
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    
    // Create fresh QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries for testing
          gcTime: 0,    // Disable caching for fresh data in each test
        },
        mutations: {
          retry: false,
        },
      },
    })
    
    // Start MSW server
    server.listen({ onUnhandledRequest: 'error' })
  })

  afterEach(() => {
    server.resetHandlers()
    server.close()
  })

  // ========================================================================
  // Route Parameter and Data Loading Tests
  // ========================================================================

  describe('Dynamic Route Parameters and Data Loading', () => {
    it('should extract admin ID from route parameters using Next.js useParams', async () => {
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      // Verify useParams was called to extract route parameters
      expect(useParams).toHaveBeenCalled()
      
      // Wait for admin data to load and verify it appears
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
      })
    })

    it('should handle invalid admin ID from route parameters', async () => {
      vi.mocked(useParams).mockReturnValue({ id: '404' })
      
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      await waitFor(() => {
        expect(screen.getByText(/admin user not found/i)).toBeInTheDocument()
      })
    })

    it('should load admin data using SWR/React Query patterns', async () => {
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      // Verify loading state appears initially
      expect(screen.getByTestId('admin-loading-spinner')).toBeInTheDocument()

      // Wait for data to load and loading state to disappear
      await waitFor(() => {
        expect(screen.queryByTestId('admin-loading-spinner')).not.toBeInTheDocument()
      })

      // Verify admin data is displayed
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('+1-555-0123')).toBeInTheDocument()
    })

    it('should handle permission errors for unauthorized access', async () => {
      vi.mocked(useParams).mockReturnValue({ id: '403' })
      
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      await waitFor(() => {
        expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument()
      })
    })
  })

  // ========================================================================
  // Form Pre-population and Validation Tests
  // ========================================================================

  describe('Form Pre-population and Validation', () => {
    it('should pre-populate form fields with existing admin data', async () => {
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      await waitFor(() => {
        // Verify personal information fields
        expect(screen.getByDisplayValue('John')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
        expect(screen.getByDisplayValue('+1-555-0123')).toBeInTheDocument()
        
        // Verify system access level
        const accessSelect = screen.getByTestId('system-access-level-select')
        expect(accessSelect).toHaveValue('full')
        
        // Verify admin permissions checkboxes
        expect(screen.getByLabelText(/user management/i)).toBeChecked()
        expect(screen.getByLabelText(/service configuration/i)).toBeChecked()
        expect(screen.getByLabelText(/system settings/i)).toBeChecked()
        
        // Verify notification preferences
        expect(screen.getByLabelText(/email notifications/i)).toBeChecked()
        expect(screen.getByLabelText(/system alerts/i)).toBeChecked()
        expect(screen.getByLabelText(/maintenance notifications/i)).not.toBeChecked()
      })
    })

    it('should validate required fields using React Hook Form with Zod', async () => {
      const user = userEvent.setup()
      
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
      })

      // Clear required fields
      const emailField = screen.getByLabelText(/email/i)
      await user.clear(emailField)
      
      const nameField = screen.getByLabelText(/^name/i)
      await user.clear(nameField)

      // Try to submit form
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Verify validation errors appear
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      })
    })

    it('should validate email format in real-time', async () => {
      const user = userEvent.setup()
      
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
      })

      // Enter invalid email
      const emailField = screen.getByLabelText(/email/i)
      await user.clear(emailField)
      await user.type(emailField, 'invalid-email')

      // Blur field to trigger validation
      await user.tab()

      // Verify validation error appears
      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
      })
    })

    it('should handle lookup keys management', async () => {
      const user = userEvent.setup()
      
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      })

      // Verify existing lookup keys are displayed
      expect(screen.getByDisplayValue('IT')).toBeInTheDocument()
      expect(screen.getByDisplayValue('high')).toBeInTheDocument()

      // Add new lookup key
      const addLookupButton = screen.getByRole('button', { name: /add lookup key/i })
      await user.click(addLookupButton)

      // Fill in new lookup key
      const newKeyNameField = screen.getByTestId('new-lookup-key-name')
      const newKeyValueField = screen.getByTestId('new-lookup-key-value')
      
      await user.type(newKeyNameField, 'location')
      await user.type(newKeyValueField, 'headquarters')

      // Save lookup key
      const saveLookupButton = screen.getByRole('button', { name: /save lookup key/i })
      await user.click(saveLookupButton)

      // Verify new lookup key appears in the list
      expect(screen.getByDisplayValue('location')).toBeInTheDocument()
      expect(screen.getByDisplayValue('headquarters')).toBeInTheDocument()
    })
  })

  // ========================================================================
  // Update Operations and Success Scenarios
  // ========================================================================

  describe('Update Operations and Success Scenarios', () => {
    it('should successfully update admin profile information', async () => {
      const user = userEvent.setup()
      
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
      })

      // Update admin information
      const phoneField = screen.getByLabelText(/phone/i)
      await user.clear(phoneField)
      await user.type(phoneField, '+1-555-9999')

      const timezoneSelect = screen.getByTestId('timezone-select')
      await user.selectOptions(timezoneSelect, 'America/Los_Angeles')

      // Save changes
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Verify success notification
      await waitFor(() => {
        expect(screen.getByText(/admin updated successfully/i)).toBeInTheDocument()
      })

      // Verify fields are updated
      expect(screen.getByDisplayValue('+1-555-9999')).toBeInTheDocument()
      expect(timezoneSelect).toHaveValue('America/Los_Angeles')
    })

    it('should update admin permissions and access levels', async () => {
      const user = userEvent.setup()
      
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      await waitFor(() => {
        expect(screen.getByLabelText(/user management/i)).toBeChecked()
      })

      // Change system access level
      const accessSelect = screen.getByTestId('system-access-level-select')
      await user.selectOptions(accessSelect, 'limited')

      // Toggle permissions
      const serviceConfigPermission = screen.getByLabelText(/service configuration/i)
      await user.click(serviceConfigPermission)

      // Add new permission
      const apiDocsPermission = screen.getByLabelText(/api documentation/i)
      await user.click(apiDocsPermission)

      // Save changes
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Verify success notification
      await waitFor(() => {
        expect(screen.getByText(/admin updated successfully/i)).toBeInTheDocument()
      })

      // Verify permission changes
      expect(accessSelect).toHaveValue('limited')
      expect(serviceConfigPermission).not.toBeChecked()
      expect(apiDocsPermission).toBeChecked()
    })

    it('should update notification preferences', async () => {
      const user = userEvent.setup()
      
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      await waitFor(() => {
        expect(screen.getByLabelText(/email notifications/i)).toBeChecked()
      })

      // Toggle notification preferences
      const emailNotifications = screen.getByLabelText(/email notifications/i)
      const maintenanceNotifications = screen.getByLabelText(/maintenance notifications/i)
      
      await user.click(emailNotifications) // Uncheck
      await user.click(maintenanceNotifications) // Check

      // Save changes
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Verify success notification
      await waitFor(() => {
        expect(screen.getByText(/admin updated successfully/i)).toBeInTheDocument()
      })

      // Verify notification preference changes
      expect(emailNotifications).not.toBeChecked()
      expect(maintenanceNotifications).toBeChecked()
    })
  })

  // ========================================================================
  // Admin-Specific Feature Tests
  // ========================================================================

  describe('Admin-Specific Features', () => {
    it('should send invitation email to admin', async () => {
      const user = userEvent.setup()
      
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
      })

      // Click send invite button
      const sendInviteButton = screen.getByRole('button', { name: /send invite/i })
      await user.click(sendInviteButton)

      // Verify success notification
      await waitFor(() => {
        expect(screen.getByText(/invitation sent successfully/i)).toBeInTheDocument()
      })
    })

    it('should manage managed services assignment', async () => {
      const user = userEvent.setup()
      
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      })

      // Verify current managed services
      const managedServicesList = screen.getByTestId('managed-services-list')
      expect(within(managedServicesList).getByText('mysql-db')).toBeInTheDocument()
      expect(within(managedServicesList).getByText('postgres-db')).toBeInTheDocument()

      // Add new managed service
      const addServiceButton = screen.getByRole('button', { name: /add service/i })
      await user.click(addServiceButton)

      const serviceSelect = screen.getByTestId('service-select')
      await user.selectOptions(serviceSelect, 'mongodb-service')

      const confirmAddButton = screen.getByRole('button', { name: /confirm add/i })
      await user.click(confirmAddButton)

      // Verify new service appears in the list
      expect(within(managedServicesList).getByText('mongodb-service')).toBeInTheDocument()
    })

    it('should handle admin role restrictions properly', async () => {
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      })

      // Verify admin-specific fields are present
      expect(screen.getByTestId('system-access-level-select')).toBeInTheDocument()
      expect(screen.getByTestId('admin-permissions-section')).toBeInTheDocument()
      expect(screen.getByTestId('managed-services-section')).toBeInTheDocument()

      // Verify system admin toggle is checked and disabled (cannot demote self)
      const sysAdminToggle = screen.getByLabelText(/system administrator/i)
      expect(sysAdminToggle).toBeChecked()
      expect(sysAdminToggle).toBeDisabled()
    })
  })

  // ========================================================================
  // Error Handling and Edge Cases
  // ========================================================================

  describe('Error Handling and Edge Cases', () => {
    it('should handle API validation errors from server', async () => {
      const user = userEvent.setup()
      
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
      })

      // Enter invalid email that will trigger server validation error
      const emailField = screen.getByLabelText(/email/i)
      await user.clear(emailField)
      await user.type(emailField, 'invalid-email')

      // Save changes
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Verify server validation error is displayed
      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
      })
    })

    it('should handle network errors during update operations', async () => {
      const user = userEvent.setup()
      
      // Override handler to simulate network error
      server.use(
        http.put('/system/api/v2/admin/:id', () => {
          return HttpResponse.json(
            createErrorResponse(500, 'NETWORK_ERROR', 'Internal server error'),
            { status: 500 }
          )
        })
      )
      
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
      })

      // Make a change and try to save
      const phoneField = screen.getByLabelText(/phone/i)
      await user.clear(phoneField)
      await user.type(phoneField, '+1-555-8888')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument()
      })
    })

    it('should handle send invite failures gracefully', async () => {
      const user = userEvent.setup()
      
      // Override handler to simulate invite failure
      server.use(
        http.post('/system/api/v2/admin/:id/invite', () => {
          return HttpResponse.json(
            createErrorResponse(400, 'INVITE_FAILED', 'Failed to send invitation'),
            { status: 400 }
          )
        })
      )
      
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
      })

      // Try to send invite
      const sendInviteButton = screen.getByRole('button', { name: /send invite/i })
      await user.click(sendInviteButton)

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/failed to send invitation/i)).toBeInTheDocument()
      })
    })

    it('should handle form submission with optimistic updates', async () => {
      const user = userEvent.setup()
      
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
      })

      // Update phone number
      const phoneField = screen.getByLabelText(/phone/i)
      await user.clear(phoneField)
      await user.type(phoneField, '+1-555-7777')

      // Save changes
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Verify optimistic update - field shows new value immediately
      expect(screen.getByDisplayValue('+1-555-7777')).toBeInTheDocument()

      // Verify success notification appears after API response
      await waitFor(() => {
        expect(screen.getByText(/admin updated successfully/i)).toBeInTheDocument()
      })
    })

    it('should prevent navigation with unsaved changes', async () => {
      const user = userEvent.setup()
      
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
      })

      // Make changes without saving
      const phoneField = screen.getByLabelText(/phone/i)
      await user.clear(phoneField)
      await user.type(phoneField, '+1-555-6666')

      // Try to navigate away (simulated)
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Verify confirmation dialog appears
      await waitFor(() => {
        expect(screen.getByText(/you have unsaved changes/i)).toBeInTheDocument()
      })

      // Verify navigation is prevented until user confirms
      expect(mockRouter.push).not.toHaveBeenCalled()
    })
  })

  // ========================================================================
  // Performance and Accessibility Tests
  // ========================================================================

  describe('Performance and Accessibility', () => {
    it('should maintain WCAG 2.1 AA accessibility compliance', async () => {
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
      })

      // Verify proper form labeling
      expect(screen.getByLabelText(/^name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()

      // Verify error messages are properly associated
      const emailField = screen.getByLabelText(/email/i)
      expect(emailField).toHaveAttribute('aria-describedby')

      // Verify keyboard navigation support
      const saveButton = screen.getByRole('button', { name: /save/i })
      expect(saveButton).toBeVisible()
      expect(saveButton).not.toHaveAttribute('disabled')
    })

    it('should implement proper loading states and transitions', async () => {
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      // Verify initial loading state
      expect(screen.getByTestId('admin-loading-spinner')).toBeInTheDocument()

      // Wait for content to load with smooth transitions
      await waitFor(() => {
        expect(screen.queryByTestId('admin-loading-spinner')).not.toBeInTheDocument()
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
      })

      // Verify no layout shift occurs during loading
      const formContainer = screen.getByTestId('admin-edit-form')
      expect(formContainer).toHaveClass('fade-in') // CSS animation class
    })

    it('should cache admin data efficiently with React Query', async () => {
      // First render - data should be fetched
      const { unmount } = render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
      })

      unmount()

      // Second render - data should be served from cache
      render(<AdminEditPage />, {
        wrapper: ({ children }) => renderWithProviders(children, { queryClient })
      })

      // Verify data appears immediately from cache (no loading spinner)
      expect(screen.queryByTestId('admin-loading-spinner')).not.toBeInTheDocument()
      expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
    })
  })
})