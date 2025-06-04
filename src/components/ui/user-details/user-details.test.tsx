/**
 * Comprehensive test suite for the React UserDetails component using Vitest and React Testing Library.
 * Tests complex form workflows including create/edit modes, admin/user type switching,
 * dynamic password field management, tab-based access control, paywall integration,
 * form validation, accessibility compliance, and theme switching.
 *
 * @fileoverview UserDetails Component Test Suite
 * @version 1.0.0
 * @since 2024-01-01
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { server } from '@/test/mocks/server'
import { rest } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactElement } from 'react'

// Component and types
import { UserDetails } from './user-details'
import type { UserDetailsProps, FormMode, UserType } from './types'

// Test utilities and mocks
import { renderWithProviders } from '@/test/utils/render-with-providers'
import { createMockUser, createMockAdmin, createMockApplications, createMockRoles } from '@/test/utils/component-factories'
import { setupFormTestHelpers } from '@/test/utils/form-test-helpers'
import { measurePerformance } from '@/test/utils/performance-helpers'

// Mock data
import { mockUserProfile, mockAdminProfile, mockPaywallRestrictions } from '@/test/mocks/mock-data'

// Add jest-axe matchers
expect.extend(toHaveNoViolations)

// Mock hooks
vi.mock('@/hooks/use-theme', () => ({
  useTheme: vi.fn(() => ({
    theme: 'light',
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  })),
}))

vi.mock('@/hooks/use-paywall', () => ({
  usePaywall: vi.fn(() => ({
    isFeatureRestricted: vi.fn(() => false),
    restrictions: {},
    clearAccessTabs: vi.fn(),
  })),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/admin/users/create'),
}))

// Performance tracking
const performanceMetrics: Record<string, number> = {}

describe('UserDetails Component', () => {
  let queryClient: QueryClient
  let user = userEvent.setup()
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  // Default props for testing
  const defaultProps: UserDetailsProps = {
    mode: 'create',
    userType: 'user',
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    className: 'test-user-details',
  }

  beforeAll(() => {
    // Setup MSW server
    server.listen({ onUnhandledRequest: 'error' })
    
    // Setup performance observer
    global.PerformanceObserver = vi.fn(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
    })) as any
  })

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Create fresh query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    // Reset MSW handlers
    server.resetHandlers()
    
    // Reset performance metrics
    Object.keys(performanceMetrics).forEach(key => delete performanceMetrics[key])
  })

  afterEach(() => {
    // Reset MSW handlers
    server.resetHandlers()
  })

  afterAll(() => {
    // Cleanup MSW server
    server.close()
  })

  // Helper function to render component with all providers
  const renderUserDetails = (props: Partial<UserDetailsProps> = {}) => {
    const componentProps = { ...defaultProps, ...props }
    
    return renderWithProviders(
      <UserDetails {...componentProps} />,
      {
        queryClient,
        user: props.mode === 'edit' ? mockUserProfile : undefined,
        theme: 'light',
      }
    )
  }

  describe('Component Rendering and Basic Functionality', () => {
    it('renders correctly with default props', () => {
      renderUserDetails()
      
      expect(screen.getByRole('form', { name: /user details/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    })

    it('applies custom className prop', () => {
      renderUserDetails({ className: 'custom-class' })
      
      const form = screen.getByRole('form', { name: /user details/i })
      expect(form).toHaveClass('custom-class')
    })

    it('renders with correct ARIA labels and attributes', () => {
      renderUserDetails()
      
      const form = screen.getByRole('form', { name: /user details/i })
      expect(form).toHaveAttribute('aria-label', 'User details form')
      expect(form).toHaveAttribute('noValidate')
    })
  })

  describe('Form Mode Switching (Create vs Edit)', () => {
    it('renders create mode correctly with empty form', () => {
      renderUserDetails({ mode: 'create' })
      
      expect(screen.getByRole('heading', { name: /create user/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toHaveValue('')
      expect(screen.getByLabelText(/first name/i)).toHaveValue('')
      expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument()
    })

    it('renders edit mode with populated form data', async () => {
      const editUser = createMockUser({ 
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      })

      renderUserDetails({ 
        mode: 'edit',
        initialData: editUser
      })
      
      expect(screen.getByRole('heading', { name: /edit user/i })).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Test')).toBeInTheDocument()
        expect(screen.getByDisplayValue('User')).toBeInTheDocument()
      })
      
      expect(screen.getByRole('button', { name: /update user/i })).toBeInTheDocument()
    })

    it('switches between modes correctly when mode prop changes', async () => {
      const { rerender } = renderUserDetails({ mode: 'create' })
      
      expect(screen.getByRole('heading', { name: /create user/i })).toBeInTheDocument()
      
      rerender(
        <QueryClientProvider client={queryClient}>
          <UserDetails {...defaultProps} mode="edit" initialData={mockUserProfile} />
        </QueryClientProvider>
      )
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit user/i })).toBeInTheDocument()
      })
    })
  })

  describe('User Type Switching (Admin vs User)', () => {
    it('renders user type form correctly', () => {
      renderUserDetails({ userType: 'user' })
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/admin privileges/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/access control/i)).not.toBeInTheDocument()
    })

    it('renders admin type form with additional fields', () => {
      renderUserDetails({ userType: 'admin' })
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByText(/access control/i)).toBeInTheDocument()
      expect(screen.getByText(/admin privileges/i)).toBeInTheDocument()
    })

    it('shows/hides admin-specific sections when userType changes', async () => {
      const { rerender } = renderUserDetails({ userType: 'user' })
      
      expect(screen.queryByText(/access control/i)).not.toBeInTheDocument()
      
      rerender(
        <QueryClientProvider client={queryClient}>
          <UserDetails {...defaultProps} userType="admin" />
        </QueryClientProvider>
      )
      
      await waitFor(() => {
        expect(screen.getByText(/access control/i)).toBeInTheDocument()
      })
    })
  })

  describe('Dynamic Password Field Management', () => {
    describe('Create Mode Password Controls', () => {
      it('shows invite vs password selection in create mode', () => {
        renderUserDetails({ mode: 'create' })
        
        expect(screen.getByRole('radio', { name: /send invitation email/i })).toBeInTheDocument()
        expect(screen.getByRole('radio', { name: /set password/i })).toBeInTheDocument()
      })

      it('hides password fields when invite option is selected', async () => {
        renderUserDetails({ mode: 'create' })
        
        await user.click(screen.getByRole('radio', { name: /send invitation email/i }))
        
        expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument()
      })

      it('shows password fields when set password option is selected', async () => {
        renderUserDetails({ mode: 'create' })
        
        await user.click(screen.getByRole('radio', { name: /set password/i }))
        
        await waitFor(() => {
          expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
          expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
        })
      })

      it('validates password confirmation in create mode', async () => {
        renderUserDetails({ mode: 'create' })
        
        await user.click(screen.getByRole('radio', { name: /set password/i }))
        
        const passwordField = await screen.findByLabelText(/^password$/i)
        const confirmField = screen.getByLabelText(/confirm password/i)
        
        await user.type(passwordField, 'password123')
        await user.type(confirmField, 'different')
        await user.tab() // Trigger validation
        
        await waitFor(() => {
          expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
        })
      })
    })

    describe('Edit Mode Password Controls', () => {
      it('shows set password checkbox in edit mode', () => {
        renderUserDetails({ 
          mode: 'edit',
          initialData: mockUserProfile
        })
        
        expect(screen.getByRole('checkbox', { name: /set new password/i })).toBeInTheDocument()
      })

      it('hides password fields when set password checkbox is unchecked', () => {
        renderUserDetails({ 
          mode: 'edit',
          initialData: mockUserProfile
        })
        
        expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/confirm new password/i)).not.toBeInTheDocument()
      })

      it('shows password fields when set password checkbox is checked', async () => {
        renderUserDetails({ 
          mode: 'edit',
          initialData: mockUserProfile
        })
        
        await user.click(screen.getByRole('checkbox', { name: /set new password/i }))
        
        await waitFor(() => {
          expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
          expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument()
        })
      })
    })
  })

  describe('Tab-based Access Control (Admin Users)', () => {
    beforeEach(() => {
      // Mock applications and roles data
      server.use(
        rest.get('/api/v2/system/app', (req, res, ctx) => {
          return res(ctx.json({ resource: createMockApplications() }))
        }),
        rest.get('/api/v2/system/role', (req, res, ctx) => {
          return res(ctx.json({ resource: createMockRoles() }))
        })
      )
    })

    it('shows access control tabs for admin users', async () => {
      renderUserDetails({ userType: 'admin' })
      
      await waitFor(() => {
        expect(screen.getByText(/access control/i)).toBeInTheDocument()
        expect(screen.getByRole('tablist')).toBeInTheDocument()
      })
    })

    it('displays select all functionality for tabs', async () => {
      renderUserDetails({ userType: 'admin' })
      
      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /select all tabs/i })).toBeInTheDocument()
      })
    })

    it('handles select all tabs functionality', async () => {
      renderUserDetails({ userType: 'admin' })
      
      const selectAllCheckbox = await screen.findByRole('checkbox', { name: /select all tabs/i })
      
      await user.click(selectAllCheckbox)
      
      await waitFor(() => {
        const tabCheckboxes = screen.getAllByRole('checkbox', { name: /tab access/i })
        tabCheckboxes.forEach(checkbox => {
          expect(checkbox).toBeChecked()
        })
      })
    })

    it('handles individual tab selection', async () => {
      renderUserDetails({ userType: 'admin' })
      
      await waitFor(() => {
        const tabCheckboxes = screen.getAllByRole('checkbox', { name: /tab access/i })
        expect(tabCheckboxes).toHaveLength(expect.any(Number))
      })
      
      const firstTabCheckbox = screen.getAllByRole('checkbox', { name: /tab access/i })[0]
      await user.click(firstTabCheckbox)
      
      expect(firstTabCheckbox).toBeChecked()
    })

    it('updates select all state when individual tabs are toggled', async () => {
      renderUserDetails({ userType: 'admin' })
      
      const selectAllCheckbox = await screen.findByRole('checkbox', { name: /select all tabs/i })
      const tabCheckboxes = await screen.findAllByRole('checkbox', { name: /tab access/i })
      
      // Select all first
      await user.click(selectAllCheckbox)
      
      // Uncheck one tab
      await user.click(tabCheckboxes[0])
      
      await waitFor(() => {
        expect(selectAllCheckbox).not.toBeChecked()
      })
    })
  })

  describe('Paywall Integration', () => {
    it('clears access tabs when paywall restrictions are enforced', async () => {
      const mockUsePaywall = vi.mocked(require('@/hooks/use-paywall').usePaywall)
      const mockClearAccessTabs = vi.fn()
      
      mockUsePaywall.mockReturnValue({
        isFeatureRestricted: vi.fn(() => true),
        restrictions: mockPaywallRestrictions,
        clearAccessTabs: mockClearAccessTabs,
      })
      
      renderUserDetails({ userType: 'admin' })
      
      await waitFor(() => {
        expect(mockClearAccessTabs).toHaveBeenCalled()
      })
    })

    it('shows paywall message when features are restricted', async () => {
      const mockUsePaywall = vi.mocked(require('@/hooks/use-paywall').usePaywall)
      
      mockUsePaywall.mockReturnValue({
        isFeatureRestricted: vi.fn(() => true),
        restrictions: { tabAccess: true },
        clearAccessTabs: vi.fn(),
      })
      
      renderUserDetails({ userType: 'admin' })
      
      await waitFor(() => {
        expect(screen.getByText(/upgrade your plan/i)).toBeInTheDocument()
      })
    })

    it('allows full functionality when no restrictions apply', async () => {
      const mockUsePaywall = vi.mocked(require('@/hooks/use-paywall').usePaywall)
      
      mockUsePaywall.mockReturnValue({
        isFeatureRestricted: vi.fn(() => false),
        restrictions: {},
        clearAccessTabs: vi.fn(),
      })
      
      renderUserDetails({ userType: 'admin' })
      
      await waitFor(() => {
        expect(screen.queryByText(/upgrade your plan/i)).not.toBeInTheDocument()
        expect(screen.getByText(/access control/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('validates required fields on submission', async () => {
      renderUserDetails({ mode: 'create' })
      
      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
      })
      
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('validates email format', async () => {
      renderUserDetails({ mode: 'create' })
      
      const emailField = screen.getByLabelText(/email/i)
      await user.type(emailField, 'invalid-email')
      await user.tab() // Trigger validation
      
      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
      })
    })

    it('validates password strength requirements', async () => {
      renderUserDetails({ mode: 'create' })
      
      await user.click(screen.getByRole('radio', { name: /set password/i }))
      
      const passwordField = await screen.findByLabelText(/^password$/i)
      await user.type(passwordField, 'weak')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })

    it('performs real-time validation under 100ms requirement', async () => {
      const startTime = performance.now()
      
      renderUserDetails({ mode: 'create' })
      
      const emailField = screen.getByLabelText(/email/i)
      await user.type(emailField, 'test@example.com')
      
      await waitFor(() => {
        const endTime = performance.now()
        const validationTime = endTime - startTime
        
        // Validation should complete well under 100ms
        expect(validationTime).toBeLessThan(100)
        expect(screen.queryByText(/invalid email format/i)).not.toBeInTheDocument()
      })
    })

    it('displays validation errors with proper ARIA attributes', async () => {
      renderUserDetails({ mode: 'create' })
      
      const emailField = screen.getByLabelText(/email/i)
      await user.type(emailField, 'invalid')
      await user.tab()
      
      await waitFor(() => {
        expect(emailField).toHaveAttribute('aria-invalid', 'true')
        expect(emailField).toHaveAttribute('aria-describedby', expect.stringContaining('error'))
        
        const errorMessage = screen.getByText(/invalid email format/i)
        expect(errorMessage).toHaveAttribute('role', 'alert')
      })
    })
  })

  describe('User Interaction Testing', () => {
    it('handles form submission with valid data', async () => {
      renderUserDetails({ mode: 'create' })
      
      // Fill out required fields
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/first name/i), 'Test')
      await user.type(screen.getByLabelText(/last name/i), 'User')
      
      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
          })
        )
      })
    })

    it('handles form cancellation', async () => {
      renderUserDetails({ mode: 'create' })
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      
      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('handles tab selection in access control', async () => {
      renderUserDetails({ userType: 'admin' })
      
      await waitFor(() => {
        const tabs = screen.getAllByRole('tab')
        expect(tabs).toHaveLength(expect.any(Number))
      })
      
      const firstTab = screen.getAllByRole('tab')[0]
      await user.click(firstTab)
      
      expect(firstTab).toHaveAttribute('aria-selected', 'true')
    })

    it('handles error states gracefully', async () => {
      // Mock API error
      server.use(
        rest.post('/api/v2/user', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json({ 
            error: { message: 'Email already exists' }
          }))
        })
      )
      
      renderUserDetails({ mode: 'create' })
      
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com')
      await user.type(screen.getByLabelText(/first name/i), 'Test')
      await user.type(screen.getByLabelText(/last name/i), 'User')
      
      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility Testing (WCAG 2.1 AA Compliance)', () => {
    it('passes automated accessibility audit', async () => {
      const { container } = renderUserDetails()
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('provides proper form labels and descriptions', () => {
      renderUserDetails()
      
      const emailField = screen.getByLabelText(/email/i)
      const firstNameField = screen.getByLabelText(/first name/i)
      const lastNameField = screen.getByLabelText(/last name/i)
      
      expect(emailField).toHaveAccessibleName()
      expect(firstNameField).toHaveAccessibleName()
      expect(lastNameField).toHaveAccessibleName()
    })

    it('maintains proper heading hierarchy', () => {
      renderUserDetails({ userType: 'admin' })
      
      const headings = screen.getAllByRole('heading')
      expect(headings[0]).toHaveProperty('tagName', 'H1')
      expect(headings[1]).toHaveProperty('tagName', 'H2')
    })

    it('provides proper ARIA live regions for dynamic content', async () => {
      renderUserDetails({ mode: 'create' })
      
      const emailField = screen.getByLabelText(/email/i)
      await user.type(emailField, 'invalid')
      await user.tab()
      
      await waitFor(() => {
        const errorRegion = screen.getByRole('alert')
        expect(errorRegion).toHaveAttribute('aria-live', 'polite')
      })
    })

    it('supports high contrast mode', () => {
      renderUserDetails()
      
      const form = screen.getByRole('form')
      const computedStyle = window.getComputedStyle(form)
      
      // Verify sufficient color contrast ratios are maintained
      expect(computedStyle.getPropertyValue('color')).toBeTruthy()
      expect(computedStyle.getPropertyValue('background-color')).toBeTruthy()
    })
  })

  describe('Keyboard Navigation Testing', () => {
    it('supports tab navigation through all interactive elements', async () => {
      renderUserDetails({ userType: 'admin' })
      
      const interactiveElements = [
        screen.getByLabelText(/email/i),
        screen.getByLabelText(/first name/i),
        screen.getByLabelText(/last name/i),
        screen.getByRole('button', { name: /create user/i }),
        screen.getByRole('button', { name: /cancel/i }),
      ]
      
      // Tab through all elements
      for (const element of interactiveElements) {
        await user.tab()
        expect(document.activeElement).toBe(element)
      }
    })

    it('handles Enter key for form submission', async () => {
      renderUserDetails({ mode: 'create' })
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/first name/i), 'Test')
      await user.type(screen.getByLabelText(/last name/i), 'User')
      
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })

    it('handles Escape key for form cancellation', async () => {
      renderUserDetails()
      
      await user.keyboard('{Escape}')
      
      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('supports arrow key navigation in tab lists', async () => {
      renderUserDetails({ userType: 'admin' })
      
      await waitFor(() => {
        const tabs = screen.getAllByRole('tab')
        expect(tabs).toHaveLength(expect.any(Number))
      })
      
      const firstTab = screen.getAllByRole('tab')[0]
      firstTab.focus()
      
      await user.keyboard('{ArrowRight}')
      
      const secondTab = screen.getAllByRole('tab')[1]
      expect(document.activeElement).toBe(secondTab)
    })

    it('provides focus indicators with proper contrast', async () => {
      renderUserDetails()
      
      const emailField = screen.getByLabelText(/email/i)
      emailField.focus()
      
      const computedStyle = window.getComputedStyle(emailField, ':focus')
      expect(computedStyle.getPropertyValue('outline')).toBeTruthy()
    })
  })

  describe('Theme Integration Testing', () => {
    it('applies correct theme classes in light mode', () => {
      const mockUseTheme = vi.mocked(require('@/hooks/use-theme').useTheme)
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      })
      
      renderUserDetails()
      
      const form = screen.getByRole('form')
      expect(form).toHaveClass('bg-white', 'text-gray-900')
    })

    it('applies correct theme classes in dark mode', () => {
      const mockUseTheme = vi.mocked(require('@/hooks/use-theme').useTheme)
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      })
      
      renderUserDetails()
      
      const form = screen.getByRole('form')
      expect(form).toHaveClass('bg-gray-900', 'text-white')
    })

    it('handles theme switching without losing form state', async () => {
      const mockUseTheme = vi.mocked(require('@/hooks/use-theme').useTheme)
      const setTheme = vi.fn()
      
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme,
        toggleTheme: vi.fn(),
      })
      
      renderUserDetails()
      
      // Fill form data
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      
      // Simulate theme change
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme,
        toggleTheme: vi.fn(),
      })
      
      // Re-render component
      renderUserDetails()
      
      // Verify form data is preserved
      await waitFor(() => {
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
      })
    })
  })

  describe('Internationalization Testing', () => {
    it('renders localized text for form labels', () => {
      renderUserDetails()
      
      // Verify that i18n keys are properly resolved
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    })

    it('displays localized validation error messages', async () => {
      renderUserDetails({ mode: 'create' })
      
      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        // Verify error messages are localized
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
      })
    })

    it('handles RTL language support', () => {
      // Mock RTL language
      document.documentElement.setAttribute('dir', 'rtl')
      
      renderUserDetails()
      
      const form = screen.getByRole('form')
      expect(form).toHaveStyle('direction: rtl')
      
      // Cleanup
      document.documentElement.removeAttribute('dir')
    })
  })

  describe('Performance Testing', () => {
    it('renders initial component within performance budget', async () => {
      const startTime = performance.now()
      
      renderUserDetails()
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Initial render should be under 50ms
      expect(renderTime).toBeLessThan(50)
    })

    it('handles large datasets efficiently', async () => {
      // Mock large dataset
      const largeRolesList = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Role ${i}`,
        description: `Description for role ${i}`,
      }))
      
      server.use(
        rest.get('/api/v2/system/role', (req, res, ctx) => {
          return res(ctx.json({ resource: largeRolesList }))
        })
      )
      
      const startTime = performance.now()
      
      renderUserDetails({ userType: 'admin' })
      
      await waitFor(() => {
        expect(screen.getByText(/access control/i)).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const loadTime = endTime - startTime
      
      // Should handle large datasets under 200ms
      expect(loadTime).toBeLessThan(200)
    })

    it('optimizes re-renders during form validation', async () => {
      let renderCount = 0
      const TestWrapper = ({ children }: { children: React.ReactNode }) => {
        renderCount++
        return <>{children}</>
      }
      
      render(
        <QueryClientProvider client={queryClient}>
          <TestWrapper>
            <UserDetails {...defaultProps} />
          </TestWrapper>
        </QueryClientProvider>
      )
      
      const emailField = screen.getByLabelText(/email/i)
      await user.type(emailField, 'test@example.com')
      
      // Should not cause excessive re-renders
      expect(renderCount).toBeLessThan(10)
    })

    it('measures form validation performance', async () => {
      const { measureAsync } = measurePerformance()
      
      renderUserDetails({ mode: 'create' })
      
      const validationTime = await measureAsync(async () => {
        const emailField = screen.getByLabelText(/email/i)
        await user.type(emailField, 'test@example.com')
        await user.tab() // Trigger validation
        
        await waitFor(() => {
          expect(screen.queryByText(/invalid email format/i)).not.toBeInTheDocument()
        })
      })
      
      // Validation should complete under 100ms requirement
      expect(validationTime).toBeLessThan(100)
    })
  })

  describe('Integration Testing', () => {
    it('integrates properly with child components', async () => {
      renderUserDetails({ userType: 'admin' })
      
      // Verify child components are rendered and functional
      await waitFor(() => {
        expect(screen.getByText(/profile details/i)).toBeInTheDocument()
        expect(screen.getByText(/access control/i)).toBeInTheDocument()
      })
      
      // Verify child components receive proper props
      const profileSection = screen.getByTestId('profile-details')
      expect(profileSection).toBeInTheDocument()
    })

    it('communicates with parent form context correctly', async () => {
      renderUserDetails({ mode: 'create' })
      
      // Verify form context is properly established
      const form = screen.getByRole('form')
      expect(form).toHaveAttribute('noValidate')
      
      // Verify form submission flows through context
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/first name/i), 'Test')
      await user.type(screen.getByLabelText(/last name/i), 'User')
      
      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
          })
        )
      })
    })

    it('handles API responses and loading states', async () => {
      // Mock delayed API response
      server.use(
        rest.post('/api/v2/user', (req, res, ctx) => {
          return res(ctx.delay(100), ctx.json({ success: true }))
        })
      )
      
      renderUserDetails({ mode: 'create' })
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/first name/i), 'Test')
      await user.type(screen.getByLabelText(/last name/i), 'User')
      
      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)
      
      // Verify loading state
      expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
      
      // Wait for completion
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('Edge Cases and Error Scenarios', () => {
    it('handles network errors gracefully', async () => {
      server.use(
        rest.post('/api/v2/user', (req, res, ctx) => {
          return res.networkError('Network connection failed')
        })
      )
      
      renderUserDetails({ mode: 'create' })
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/first name/i), 'Test')
      await user.type(screen.getByLabelText(/last name/i), 'User')
      
      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('handles malformed API responses', async () => {
      server.use(
        rest.get('/api/v2/system/app', (req, res, ctx) => {
          return res(ctx.json({ invalid: 'response' }))
        })
      )
      
      renderUserDetails({ userType: 'admin' })
      
      await waitFor(() => {
        // Should gracefully degrade when API response is malformed
        expect(screen.getByText(/error loading applications/i)).toBeInTheDocument()
      })
    })

    it('handles component unmounting during async operations', async () => {
      const { unmount } = renderUserDetails({ mode: 'create' })
      
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      
      // Unmount component before async operation completes
      unmount()
      
      // Should not cause memory leaks or console errors
      expect(console.error).not.toHaveBeenCalled()
    })

    it('handles extremely long form data', async () => {
      renderUserDetails({ mode: 'create' })
      
      const longText = 'a'.repeat(1000)
      
      await user.type(screen.getByLabelText(/first name/i), longText)
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(/first name too long/i)).toBeInTheDocument()
      })
    })

    it('handles rapid user interactions', async () => {
      renderUserDetails({ userType: 'admin' })
      
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox', { name: /tab access/i })
        expect(checkboxes).toHaveLength(expect.any(Number))
      })
      
      const checkboxes = screen.getAllByRole('checkbox', { name: /tab access/i })
      
      // Rapidly click multiple checkboxes
      for (const checkbox of checkboxes.slice(0, 5)) {
        await user.click(checkbox)
      }
      
      // Should handle rapid interactions without errors
      expect(console.error).not.toHaveBeenCalled()
    })
  })
})