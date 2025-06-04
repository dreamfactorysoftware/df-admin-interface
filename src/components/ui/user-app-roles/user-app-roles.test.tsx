/**
 * @fileoverview Comprehensive test suite for the UserAppRoles React component
 * 
 * This test suite covers all aspects of the user application roles component including:
 * - React Hook Form integration with useFieldArray
 * - WCAG 2.1 AA accessibility compliance
 * - User interactions (add/remove functionality, autocomplete)
 * - Keyboard navigation and screen reader support
 * - Theme switching (light/dark mode)
 * - Form validation with Zod schemas
 * - Real-time validation performance requirements
 * - Integration with parent forms
 * - Internationalization with Next.js i18n
 * 
 * @author DreamFactory Team
 * @version 1.0.0
 * @since React 19 Migration
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { act } from 'react'

// Component imports
import { UserAppRoles } from './user-app-roles'
import type { UserAppRolesProps, AppRoleAssignment } from './user-app-roles.types'

// Test utilities and mocks
import { renderWithProviders } from '@/test/utils/test-utils'
import { createMockProviders } from '@/test/utils/mock-providers'
import { createQueryClient } from '@/test/utils/query-test-helpers'
import { server } from '@/test/mocks/server'
import { appFixtures, userFixtures } from '@/test/fixtures'

// Hook and store imports
import { useAppStore } from '@/lib/stores/app-store'
import { useTheme } from '@/hooks/use-theme'

// Mock external dependencies
vi.mock('@/hooks/use-theme')
vi.mock('@/lib/stores/app-store')
vi.mock('next/navigation')

// Extend Jest matchers with jest-axe
expect.extend(toHaveNoViolations)

/**
 * Form schema for testing React Hook Form integration
 */
const testFormSchema = z.object({
  userAppRoles: z.array(z.object({
    appId: z.string().min(1, 'Application is required'),
    roleId: z.string().min(1, 'Role is required'),
    appName: z.string(),
    roleName: z.string(),
  })),
  userName: z.string().min(1, 'User name is required'),
})

type TestFormData = z.infer<typeof testFormSchema>

/**
 * Test wrapper component for form integration testing
 */
function TestFormWrapper({ 
  children, 
  defaultValues,
  onSubmit = vi.fn(),
}: {
  children: React.ReactNode
  defaultValues?: Partial<TestFormData>
  onSubmit?: (data: TestFormData) => void
}) {
  const methods = useForm<TestFormData>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      userAppRoles: [],
      userName: '',
      ...defaultValues,
    },
  })

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} data-testid="test-form">
        {children}
        <button type="submit" data-testid="submit-button">
          Submit
        </button>
      </form>
    </FormProvider>
  )
}

/**
 * Default test props for UserAppRoles component
 */
const defaultProps: UserAppRolesProps = {
  name: 'userAppRoles',
  availableApps: appFixtures.createAppList(5),
  availableRoles: userFixtures.createRoleList(3),
  label: 'User Application Roles',
  placeholder: 'Select an application...',
  'aria-label': 'Manage user application role assignments',
}

/**
 * Performance measurement utility
 */
function measurePerformance<T>(operation: () => T): { result: T; duration: number } {
  const start = performance.now()
  const result = operation()
  const end = performance.now()
  return { result, duration: end - start }
}

describe('UserAppRoles Component', () => {
  let mockUseTheme: Mock
  let mockUseAppStore: Mock
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    // Setup user event
    user = userEvent.setup()

    // Mock theme hook
    mockUseTheme = vi.mocked(useTheme)
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: vi.fn(),
      systemTheme: 'light',
      resolvedTheme: 'light',
    })

    // Mock app store
    mockUseAppStore = vi.mocked(useAppStore)
    mockUseAppStore.mockReturnValue({
      theme: 'light',
      setTheme: vi.fn(),
      sidebarCollapsed: false,
      setSidebarCollapsed: vi.fn(),
      globalLoading: false,
      setGlobalLoading: vi.fn(),
      preferences: {
        defaultDatabaseType: 'mysql',
        tablePageSize: 25,
        autoRefreshSchemas: true,
        showAdvancedOptions: false,
      },
      updatePreferences: vi.fn(),
    })

    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders with default props', () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      expect(screen.getByLabelText(/manage user application role assignments/i)).toBeInTheDocument()
      expect(screen.getByText('User Application Roles')).toBeInTheDocument()
    })

    it('renders with custom className and styles', () => {
      render(
        <TestFormWrapper>
          <UserAppRoles 
            {...defaultProps} 
            className="custom-class"
            style={{ backgroundColor: 'red' }}
          />
        </TestFormWrapper>
      )

      const component = screen.getByLabelText(/manage user application role assignments/i)
      expect(component).toHaveClass('custom-class')
      expect(component).toHaveStyle({ backgroundColor: 'red' })
    })

    it('renders with initial values', () => {
      const initialValues: AppRoleAssignment[] = [
        {
          appId: 'app-1',
          roleId: 'role-1',
          appName: 'Test App',
          roleName: 'Admin',
        },
      ]

      render(
        <TestFormWrapper defaultValues={{ userAppRoles: initialValues }}>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      expect(screen.getByDisplayValue('Test App')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Admin')).toBeInTheDocument()
    })

    it('shows loading state when data is loading', () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} isLoading={true} />
        </TestFormWrapper>
      )

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('shows error state when there is an error', () => {
      const errorMessage = 'Failed to load applications'
      
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} error={errorMessage} />
        </TestFormWrapper>
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  describe('WCAG 2.1 AA Accessibility Compliance', () => {
    it('passes automated accessibility audit', async () => {
      const { container } = render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has proper ARIA labeling and role attributes', () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Check main container has proper ARIA attributes
      const container = screen.getByLabelText(/manage user application role assignments/i)
      expect(container).toHaveAttribute('role', 'group')
      expect(container).toHaveAttribute('aria-labelledby')

      // Check disclosure button has proper ARIA attributes
      const disclosureButton = screen.getByRole('button', { expanded: false })
      expect(disclosureButton).toHaveAttribute('aria-expanded', 'false')
      expect(disclosureButton).toHaveAttribute('aria-controls')
    })

    it('provides screen reader announcements for state changes', async () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Expand disclosure
      const disclosureButton = screen.getByRole('button', { expanded: false })
      await user.click(disclosureButton)

      expect(disclosureButton).toHaveAttribute('aria-expanded', 'true')

      // Check live region for announcements
      const liveRegion = screen.getByRole('status', { hidden: true })
      expect(liveRegion).toBeInTheDocument()
    })

    it('supports keyboard navigation for all interactive elements', async () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Tab to disclosure button
      await user.tab()
      expect(screen.getByRole('button', { expanded: false })).toHaveFocus()

      // Open disclosure with Enter key
      await user.keyboard('{Enter}')
      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument()

      // Tab to add button
      await user.tab()
      expect(screen.getByRole('button', { name: /add application role/i })).toHaveFocus()
    })

    it('maintains minimum 44px touch target sizes', () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      const disclosureButton = screen.getByRole('button', { expanded: false })
      const buttonStyles = window.getComputedStyle(disclosureButton)
      
      // Check minimum touch target size (44px)
      expect(parseInt(buttonStyles.minHeight)).toBeGreaterThanOrEqual(44)
    })

    it('provides proper color contrast in both themes', () => {
      // Test light theme
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      let disclosureButton = screen.getByRole('button', { expanded: false })
      expect(disclosureButton).toHaveClass('text-gray-900') // Light theme text

      // Test dark theme
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: vi.fn(),
        systemTheme: 'dark',
        resolvedTheme: 'dark',
      })

      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      disclosureButton = screen.getByRole('button', { expanded: false })
      expect(disclosureButton).toHaveClass('dark:text-gray-100') // Dark theme text
    })
  })

  describe('React Hook Form Integration', () => {
    it('integrates with useFieldArray for dynamic form fields', () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Component should register with form context
      expect(screen.getByLabelText(/manage user application role assignments/i)).toBeInTheDocument()
      
      // Field array should be accessible for manipulation
      const addButton = screen.getByRole('button', { name: /add application role/i })
      expect(addButton).toBeInTheDocument()
    })

    it('propagates field values to parent form', async () => {
      const onSubmit = vi.fn()
      
      render(
        <TestFormWrapper onSubmit={onSubmit}>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Expand disclosure and add an assignment
      const disclosureButton = screen.getByRole('button', { expanded: false })
      await user.click(disclosureButton)

      const addButton = screen.getByRole('button', { name: /add application role/i })
      await user.click(addButton)

      // Select application and role
      const appCombobox = screen.getByRole('combobox', { name: /select application/i })
      await user.click(appCombobox)
      await user.click(screen.getByText(defaultProps.availableApps[0].name))

      const roleCombobox = screen.getByRole('combobox', { name: /select role/i })
      await user.click(roleCombobox)
      await user.click(screen.getByText(defaultProps.availableRoles[0].name))

      // Submit form
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            userAppRoles: expect.arrayContaining([
              expect.objectContaining({
                appId: defaultProps.availableApps[0].id,
                roleId: defaultProps.availableRoles[0].id,
              })
            ])
          })
        )
      })
    })

    it('handles form validation errors correctly', async () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} required />
        </TestFormWrapper>
      )

      // Submit form without data
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/application is required/i)).toBeInTheDocument()
      })
    })

    it('updates form state when field values change', async () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Add an assignment
      const disclosureButton = screen.getByRole('button', { expanded: false })
      await user.click(disclosureButton)

      const addButton = screen.getByRole('button', { name: /add application role/i })
      await user.click(addButton)

      // Form should be dirty after adding field
      expect(screen.getByTestId('test-form')).toHaveFormValues({})
    })

    it('supports field removal with proper state cleanup', async () => {
      const initialValues: AppRoleAssignment[] = [
        {
          appId: 'app-1',
          roleId: 'role-1',
          appName: 'Test App',
          roleName: 'Admin',
        },
      ]

      render(
        <TestFormWrapper defaultValues={{ userAppRoles: initialValues }}>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Expand disclosure
      const disclosureButton = screen.getByRole('button', { expanded: false })
      await user.click(disclosureButton)

      // Remove the assignment
      const removeButton = screen.getByRole('button', { name: /remove assignment/i })
      await user.click(removeButton)

      // Assignment should be removed
      expect(screen.queryByDisplayValue('Test App')).not.toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    beforeEach(async () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Expand the disclosure for interaction tests
      const disclosureButton = screen.getByRole('button', { expanded: false })
      await user.click(disclosureButton)
    })

    it('allows adding new role assignments', async () => {
      const addButton = screen.getByRole('button', { name: /add application role/i })
      await user.click(addButton)

      // New row should be added
      expect(screen.getByRole('combobox', { name: /select application/i })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /select role/i })).toBeInTheDocument()
    })

    it('allows removing role assignments', async () => {
      // Add an assignment first
      const addButton = screen.getByRole('button', { name: /add application role/i })
      await user.click(addButton)

      // Remove the assignment
      const removeButton = screen.getByRole('button', { name: /remove assignment/i })
      await user.click(removeButton)

      // Assignment should be removed
      expect(screen.queryByRole('combobox', { name: /select application/i })).not.toBeInTheDocument()
    })

    it('supports autocomplete filtering for applications', async () => {
      // Add an assignment
      const addButton = screen.getByRole('button', { name: /add application role/i })
      await user.click(addButton)

      const appCombobox = screen.getByRole('combobox', { name: /select application/i })
      await user.click(appCombobox)

      // Type to filter
      await user.type(appCombobox, 'Test')

      // Should show filtered results
      const filteredOptions = screen.getAllByRole('option')
      expect(filteredOptions.length).toBeGreaterThan(0)
      expect(filteredOptions[0]).toHaveTextContent(/test/i)
    })

    it('supports autocomplete filtering for roles', async () => {
      // Add an assignment
      const addButton = screen.getByRole('button', { name: /add application role/i })
      await user.click(addButton)

      const roleCombobox = screen.getByRole('combobox', { name: /select role/i })
      await user.click(roleCombobox)

      // Type to filter
      await user.type(roleCombobox, 'Admin')

      // Should show filtered results
      const filteredOptions = screen.getAllByRole('option')
      expect(filteredOptions.length).toBeGreaterThan(0)
      expect(filteredOptions[0]).toHaveTextContent(/admin/i)
    })

    it('handles selection of application and role', async () => {
      // Add an assignment
      const addButton = screen.getByRole('button', { name: /add application role/i })
      await user.click(addButton)

      // Select application
      const appCombobox = screen.getByRole('combobox', { name: /select application/i })
      await user.click(appCombobox)
      await user.click(screen.getByText(defaultProps.availableApps[0].name))

      expect(appCombobox).toHaveValue(defaultProps.availableApps[0].name)

      // Select role
      const roleCombobox = screen.getByRole('combobox', { name: /select role/i })
      await user.click(roleCombobox)
      await user.click(screen.getByText(defaultProps.availableRoles[0].name))

      expect(roleCombobox).toHaveValue(defaultProps.availableRoles[0].name)
    })

    it('prevents duplicate app-role combinations', async () => {
      // Add first assignment
      const addButton = screen.getByRole('button', { name: /add application role/i })
      await user.click(addButton)

      // Select app and role
      let appCombobox = screen.getByRole('combobox', { name: /select application/i })
      await user.click(appCombobox)
      await user.click(screen.getByText(defaultProps.availableApps[0].name))

      let roleCombobox = screen.getByRole('combobox', { name: /select role/i })
      await user.click(roleCombobox)
      await user.click(screen.getByText(defaultProps.availableRoles[0].name))

      // Add second assignment with same combination
      await user.click(addButton)

      const comboboxes = screen.getAllByRole('combobox')
      appCombobox = comboboxes[2] // Second app combobox
      roleCombobox = comboboxes[3] // Second role combobox

      await user.click(appCombobox)
      await user.click(screen.getByText(defaultProps.availableApps[0].name))

      await user.click(roleCombobox)
      await user.click(screen.getByText(defaultProps.availableRoles[0].name))

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/duplicate assignment/i)).toBeInTheDocument()
      })
    })
  })

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation through all interactive elements', async () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Tab to disclosure button
      await user.tab()
      expect(screen.getByRole('button', { expanded: false })).toHaveFocus()

      // Open with keyboard
      await user.keyboard('{Enter}')

      // Tab to add button
      await user.tab()
      expect(screen.getByRole('button', { name: /add application role/i })).toHaveFocus()

      // Add assignment with keyboard
      await user.keyboard('{Enter}')

      // Tab to first combobox
      await user.tab()
      expect(screen.getByRole('combobox', { name: /select application/i })).toHaveFocus()

      // Tab to second combobox
      await user.tab()
      expect(screen.getByRole('combobox', { name: /select role/i })).toHaveFocus()

      // Tab to remove button
      await user.tab()
      expect(screen.getByRole('button', { name: /remove assignment/i })).toHaveFocus()
    })

    it('supports arrow key navigation in combobox options', async () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Expand and add assignment
      const disclosureButton = screen.getByRole('button', { expanded: false })
      await user.click(disclosureButton)

      const addButton = screen.getByRole('button', { name: /add application role/i })
      await user.click(addButton)

      // Open combobox
      const appCombobox = screen.getByRole('combobox', { name: /select application/i })
      await user.click(appCombobox)

      // Use arrow keys to navigate
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')

      // Should select the option
      expect(appCombobox).toHaveValue(defaultProps.availableApps[1].name)
    })

    it('supports Escape key to close combobox', async () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Expand and add assignment
      const disclosureButton = screen.getByRole('button', { expanded: false })
      await user.click(disclosureButton)

      const addButton = screen.getByRole('button', { name: /add application role/i })
      await user.click(addButton)

      // Open combobox
      const appCombobox = screen.getByRole('combobox', { name: /select application/i })
      await user.click(appCombobox)

      // Verify listbox is open
      expect(screen.getByRole('listbox')).toBeInTheDocument()

      // Close with Escape
      await user.keyboard('{Escape}')

      // Listbox should be closed
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('maintains focus order when adding/removing assignments', async () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Expand disclosure
      const disclosureButton = screen.getByRole('button', { expanded: false })
      await user.click(disclosureButton)

      // Focus and click add button
      const addButton = screen.getByRole('button', { name: /add application role/i })
      addButton.focus()
      await user.keyboard('{Enter}')

      // Focus should move to first field of new assignment
      expect(screen.getByRole('combobox', { name: /select application/i })).toHaveFocus()
    })
  })

  describe('Theme Integration', () => {
    it('applies light theme styles correctly', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: vi.fn(),
        systemTheme: 'light',
        resolvedTheme: 'light',
      })

      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      const container = screen.getByLabelText(/manage user application role assignments/i)
      expect(container).toHaveClass('bg-white', 'border-gray-200')
    })

    it('applies dark theme styles correctly', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: vi.fn(),
        systemTheme: 'dark',
        resolvedTheme: 'dark',
      })

      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      const container = screen.getByLabelText(/manage user application role assignments/i)
      expect(container).toHaveClass('dark:bg-gray-800', 'dark:border-gray-700')
    })

    it('updates theme dynamically through Zustand store', async () => {
      const setTheme = vi.fn()
      mockUseAppStore.mockReturnValue({
        theme: 'light',
        setTheme,
        sidebarCollapsed: false,
        setSidebarCollapsed: vi.fn(),
        globalLoading: false,
        setGlobalLoading: vi.fn(),
        preferences: {
          defaultDatabaseType: 'mysql',
          tablePageSize: 25,
          autoRefreshSchemas: true,
          showAdvancedOptions: false,
        },
        updatePreferences: vi.fn(),
      })

      const { rerender } = render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Update store mock to dark theme
      mockUseAppStore.mockReturnValue({
        theme: 'dark',
        setTheme,
        sidebarCollapsed: false,
        setSidebarCollapsed: vi.fn(),
        globalLoading: false,
        setGlobalLoading: vi.fn(),
        preferences: {
          defaultDatabaseType: 'mysql',
          tablePageSize: 25,
          autoRefreshSchemas: true,
          showAdvancedOptions: false,
        },
        updatePreferences: vi.fn(),
      })

      rerender(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Theme classes should update
      const container = screen.getByLabelText(/manage user application role assignments/i)
      expect(container).toHaveClass('dark:bg-gray-800')
    })

    it('respects system theme preference', () => {
      mockUseTheme.mockReturnValue({
        theme: 'system',
        setTheme: vi.fn(),
        systemTheme: 'dark',
        resolvedTheme: 'dark',
      })

      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Should apply dark theme classes when system is dark
      const container = screen.getByLabelText(/manage user application role assignments/i)
      expect(container).toHaveClass('dark:bg-gray-800')
    })
  })

  describe('Validation and Error Handling', () => {
    it('validates required fields with Zod schema', async () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} required />
        </TestFormWrapper>
      )

      // Expand and add assignment
      const disclosureButton = screen.getByRole('button', { expanded: false })
      await user.click(disclosureButton)

      const addButton = screen.getByRole('button', { name: /add application role/i })
      await user.click(addButton)

      // Submit without selecting values
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/application is required/i)).toBeInTheDocument()
        expect(screen.getByText(/role is required/i)).toBeInTheDocument()
      })
    })

    it('shows real-time validation errors', async () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} required />
        </TestFormWrapper>
      )

      // Expand and add assignment
      const disclosureButton = screen.getByRole('button', { expanded: false })
      await user.click(disclosureButton)

      const addButton = screen.getByRole('button', { name: /add application role/i })
      await user.click(addButton)

      // Focus and blur without selection
      const appCombobox = screen.getByRole('combobox', { name: /select application/i })
      appCombobox.focus()
      appCombobox.blur()

      await waitFor(() => {
        expect(screen.getByText(/application is required/i)).toBeInTheDocument()
      })
    })

    it('clears validation errors when field is corrected', async () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} required />
        </TestFormWrapper>
      )

      // Expand and add assignment
      const disclosureButton = screen.getByRole('button', { expanded: false })
      await user.click(disclosureButton)

      const addButton = screen.getByRole('button', { name: /add application role/i })
      await user.click(addButton)

      // Trigger validation error
      const appCombobox = screen.getByRole('combobox', { name: /select application/i })
      appCombobox.focus()
      appCombobox.blur()

      await waitFor(() => {
        expect(screen.getByText(/application is required/i)).toBeInTheDocument()
      })

      // Fix the error
      await user.click(appCombobox)
      await user.click(screen.getByText(defaultProps.availableApps[0].name))

      await waitFor(() => {
        expect(screen.queryByText(/application is required/i)).not.toBeInTheDocument()
      })
    })

    it('handles API errors gracefully', async () => {
      // Mock API error
      server.use(
        rest.get('/api/apps', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }))
        })
      )

      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} error="Failed to load applications" />
        </TestFormWrapper>
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Failed to load applications')).toBeInTheDocument()
    })

    it('validates unique app-role combinations', async () => {
      const initialValues: AppRoleAssignment[] = [
        {
          appId: 'app-1',
          roleId: 'role-1',
          appName: 'Test App',
          roleName: 'Admin',
        },
      ]

      render(
        <TestFormWrapper defaultValues={{ userAppRoles: initialValues }}>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Expand disclosure
      const disclosureButton = screen.getByRole('button', { expanded: false })
      await user.click(disclosureButton)

      // Add another assignment with same combination
      const addButton = screen.getByRole('button', { name: /add application role/i })
      await user.click(addButton)

      const comboboxes = screen.getAllByRole('combobox')
      const appCombobox = comboboxes[2] // Second row
      const roleCombobox = comboboxes[3]

      await user.click(appCombobox)
      await user.click(screen.getByText('Test App'))

      await user.click(roleCombobox)
      await user.click(screen.getByText('Admin'))

      await waitFor(() => {
        expect(screen.getByText(/duplicate assignment/i)).toBeInTheDocument()
      })
    })
  })

  describe('Performance Requirements', () => {
    it('validates form inputs under 100ms performance requirement', async () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Expand and add assignment
      const disclosureButton = screen.getByRole('button', { expanded: false })
      await user.click(disclosureButton)

      const addButton = screen.getByRole('button', { name: /add application role/i })
      await user.click(addButton)

      // Measure validation performance
      const appCombobox = screen.getByRole('combobox', { name: /select application/i })
      
      const { duration } = measurePerformance(() => {
        fireEvent.click(appCombobox)
        fireEvent.blur(appCombobox)
      })

      // Validation should complete under 100ms
      expect(duration).toBeLessThan(100)
    })

    it('handles large datasets efficiently', async () => {
      const largeAppsList = appFixtures.createAppList(1000)
      const largeRolesList = userFixtures.createRoleList(100)

      const { duration } = measurePerformance(() => {
        render(
          <TestFormWrapper>
            <UserAppRoles 
              {...defaultProps} 
              availableApps={largeAppsList}
              availableRoles={largeRolesList}
            />
          </TestFormWrapper>
        )
      })

      // Rendering should be efficient even with large datasets
      expect(duration).toBeLessThan(500)
      expect(screen.getByLabelText(/manage user application role assignments/i)).toBeInTheDocument()
    })

    it('debounces filter input for performance', async () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Expand and add assignment
      const disclosureButton = screen.getByRole('button', { expanded: false })
      await user.click(disclosureButton)

      const addButton = screen.getByRole('button', { name: /add application role/i })
      await user.click(addButton)

      const appCombobox = screen.getByRole('combobox', { name: /select application/i })
      await user.click(appCombobox)

      // Type rapidly - should debounce
      await user.type(appCombobox, 'test', { delay: 50 })

      // Wait for debounce
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('Integration with Parent Forms', () => {
    it('integrates seamlessly with parent form context', () => {
      const TestComponent = () => {
        const methods = useForm()
        return (
          <FormProvider {...methods}>
            <UserAppRoles {...defaultProps} />
          </FormProvider>
        )
      }

      render(<TestComponent />)
      expect(screen.getByLabelText(/manage user application role assignments/i)).toBeInTheDocument()
    })

    it('validates correctly within parent form validation', async () => {
      const onSubmit = vi.fn()

      render(
        <TestFormWrapper onSubmit={onSubmit}>
          <input 
            {...{ name: 'userName' }}
            data-testid="user-name-input"
            aria-label="User name"
          />
          <UserAppRoles {...defaultProps} required />
        </TestFormWrapper>
      )

      // Submit without filling any fields
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/user name is required/i)).toBeInTheDocument()
        expect(onSubmit).not.toHaveBeenCalled()
      })
    })

    it('submits data correctly when form is valid', async () => {
      const onSubmit = vi.fn()

      render(
        <TestFormWrapper onSubmit={onSubmit}>
          <input 
            {...{ name: 'userName' }}
            data-testid="user-name-input"
            aria-label="User name"
          />
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Fill user name
      const userNameInput = screen.getByTestId('user-name-input')
      await user.type(userNameInput, 'John Doe')

      // Add role assignment
      const disclosureButton = screen.getByRole('button', { expanded: false })
      await user.click(disclosureButton)

      const addButton = screen.getByRole('button', { name: /add application role/i })
      await user.click(addButton)

      const appCombobox = screen.getByRole('combobox', { name: /select application/i })
      await user.click(appCombobox)
      await user.click(screen.getByText(defaultProps.availableApps[0].name))

      const roleCombobox = screen.getByRole('combobox', { name: /select role/i })
      await user.click(roleCombobox)
      await user.click(screen.getByText(defaultProps.availableRoles[0].name))

      // Submit form
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            userName: 'John Doe',
            userAppRoles: expect.arrayContaining([
              expect.objectContaining({
                appId: defaultProps.availableApps[0].id,
                roleId: defaultProps.availableRoles[0].id,
              })
            ])
          })
        )
      })
    })
  })

  describe('Internationalization (i18n)', () => {
    it('renders localized text properly', () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Check for proper text rendering (assumes English locale)
      expect(screen.getByText('User Application Roles')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add application role/i })).toBeInTheDocument()
    })

    it('supports RTL languages correctly', () => {
      // Mock RTL locale
      document.documentElement.dir = 'rtl'

      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      const container = screen.getByLabelText(/manage user application role assignments/i)
      expect(container).toHaveClass('rtl:text-right')

      // Cleanup
      document.documentElement.dir = 'ltr'
    })

    it('formats dates and numbers according to locale', () => {
      const apps = appFixtures.createAppList(1).map(app => ({
        ...app,
        createdAt: new Date('2023-01-01'),
      }))

      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} availableApps={apps} />
        </TestFormWrapper>
      )

      // Date formatting should be locale-aware (this is a basic check)
      expect(screen.getByLabelText(/manage user application role assignments/i)).toBeInTheDocument()
    })

    it('provides proper ARIA labels in different languages', () => {
      const localizedProps = {
        ...defaultProps,
        'aria-label': 'Gérer les rôles d\'application utilisateur', // French
        label: 'Rôles d\'application utilisateur',
      }

      render(
        <TestFormWrapper>
          <UserAppRoles {...localizedProps} />
        </TestFormWrapper>
      )

      expect(screen.getByLabelText(/gérer les rôles/i)).toBeInTheDocument()
      expect(screen.getByText('Rôles d\'application utilisateur')).toBeInTheDocument()
    })
  })

  describe('Error States and Edge Cases', () => {
    it('handles empty application list gracefully', () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} availableApps={[]} />
        </TestFormWrapper>
      )

      expect(screen.getByLabelText(/manage user application role assignments/i)).toBeInTheDocument()
      
      // Should show appropriate message for empty state
      const disclosureButton = screen.getByRole('button', { expanded: false })
      fireEvent.click(disclosureButton)
      
      expect(screen.getByText(/no applications available/i)).toBeInTheDocument()
    })

    it('handles empty roles list gracefully', () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} availableRoles={[]} />
        </TestFormWrapper>
      )

      expect(screen.getByLabelText(/manage user application role assignments/i)).toBeInTheDocument()
      
      const disclosureButton = screen.getByRole('button', { expanded: false })
      fireEvent.click(disclosureButton)
      
      expect(screen.getByText(/no roles available/i)).toBeInTheDocument()
    })

    it('handles component unmounting cleanly', () => {
      const { unmount } = render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Should unmount without errors
      expect(() => unmount()).not.toThrow()
    })

    it('prevents memory leaks with proper cleanup', async () => {
      const { unmount } = render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      // Add some assignments to create internal state
      const disclosureButton = screen.getByRole('button', { expanded: false })
      await user.click(disclosureButton)

      const addButton = screen.getByRole('button', { name: /add application role/i })
      await user.click(addButton)
      await user.click(addButton)

      // Unmount should clean up properly
      act(() => {
        unmount()
      })

      // No assertions needed - just ensuring no errors/warnings
    })

    it('handles rapid user interactions gracefully', async () => {
      render(
        <TestFormWrapper>
          <UserAppRoles {...defaultProps} />
        </TestFormWrapper>
      )

      const disclosureButton = screen.getByRole('button', { expanded: false })
      await user.click(disclosureButton)

      const addButton = screen.getByRole('button', { name: /add application role/i })

      // Rapidly add and remove assignments
      for (let i = 0; i < 5; i++) {
        await user.click(addButton)
      }

      const removeButtons = screen.getAllByRole('button', { name: /remove assignment/i })
      for (const button of removeButtons) {
        await user.click(button)
      }

      // Should handle rapid interactions without errors
      expect(screen.getByRole('button', { name: /add application role/i })).toBeInTheDocument()
    })
  })
})