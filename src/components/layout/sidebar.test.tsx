/**
 * Test suite for sidebar navigation component covering navigation item rendering,
 * responsive behavior, permission-based filtering, and user interaction scenarios.
 * Validates accessibility compliance and proper state management integration.
 * 
 * Converts Angular component testing to React Testing Library patterns with:
 * - User event simulation replacing Angular TestBed interactions
 * - Next.js navigation mocking instead of Angular router testing
 * - Mocked authentication context providers for permission testing
 * - Responsive behavior testing for sidebar collapse/expand functionality
 * - Keyboard navigation testing for WCAG 2.1 AA accessibility compliance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { useRouter, usePathname } from 'next/navigation'

import { Sidebar } from './sidebar'
import { renderWithProviders } from '@/test/utils/test-utils'
import { MockAuthProvider } from '@/test/utils/mock-providers'
import { createMockUser, createMockPermissions } from '@/test/utils/component-factories'
import { navigationHandlers } from '@/test/mocks/navigation-handlers'
import { server } from '@/test/mocks/server'

// Extend jest-dom matchers for accessibility testing
expect.extend(toHaveNoViolations)

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}))

// Mock Zustand store for sidebar state management
vi.mock('@/stores/app-store', () => ({
  useAppStore: vi.fn(),
}))

// Mock ResizeObserver for responsive behavior testing
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

describe('Sidebar Component', () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }

  const mockAppStore = {
    sidebarCollapsed: false,
    setSidebarCollapsed: vi.fn(),
    theme: 'light' as const,
    setTheme: vi.fn(),
  }

  // User permission scenarios for testing role-based menu filtering
  const adminUser = createMockUser({
    id: '1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@dreamfactory.com',
    isActive: true,
    isSystemAdmin: true,
    permissions: createMockPermissions({
      canManageServices: true,
      canManageUsers: true,
      canManageRoles: true,
      canViewSchema: true,
      canViewReports: true,
      canManageSystem: true,
    }),
  })

  const regularUser = createMockUser({
    id: '2',
    firstName: 'Regular',
    lastName: 'User',
    email: 'user@dreamfactory.com',
    isActive: true,
    isSystemAdmin: false,
    permissions: createMockPermissions({
      canManageServices: false,
      canManageUsers: false,
      canManageRoles: false,
      canViewSchema: true,
      canViewReports: false,
      canManageSystem: false,
    }),
  })

  const limitedUser = createMockUser({
    id: '3',
    firstName: 'Limited',
    lastName: 'User',
    email: 'limited@dreamfactory.com',
    isActive: true,
    isSystemAdmin: false,
    permissions: createMockPermissions({
      canManageServices: false,
      canManageUsers: false,
      canManageRoles: false,
      canViewSchema: false,
      canViewReports: false,
      canManageSystem: false,
    }),
  })

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset Next.js router mocks
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    
    // Reset Zustand store mock
    const { useAppStore } = require('@/stores/app-store')
    vi.mocked(useAppStore).mockReturnValue(mockAppStore)

    // Setup MSW handlers for navigation data
    server.use(...navigationHandlers)
  })

  afterEach(() => {
    server.resetHandlers()
  })

  describe('Basic Rendering', () => {
    it('renders the sidebar with correct structure and ARIA attributes', async () => {
      const { container } = renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      // Verify sidebar has proper ARIA attributes for accessibility
      const sidebar = screen.getByRole('navigation', { name: /main navigation/i })
      expect(sidebar).toBeInTheDocument()
      expect(sidebar).toHaveAttribute('aria-label', 'Main navigation')

      // Verify navigation list structure
      const navList = within(sidebar).getByRole('list')
      expect(navList).toBeInTheDocument()
      expect(navList).toHaveAttribute('role', 'list')

      // Test for accessibility violations
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('displays navigation items based on user permissions', async () => {
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      // Admin should see all navigation items
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /services/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /schema/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /users/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /roles/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /system settings/i })).toBeInTheDocument()
      })
    })

    it('filters navigation items for regular users', async () => {
      renderWithProviders(
        <MockAuthProvider user={regularUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      await waitFor(() => {
        // Regular user should see limited navigation
        expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /schema/i })).toBeInTheDocument()
        
        // Should not see admin-only sections
        expect(screen.queryByRole('link', { name: /users/i })).not.toBeInTheDocument()
        expect(screen.queryByRole('link', { name: /roles/i })).not.toBeInTheDocument()
        expect(screen.queryByRole('link', { name: /system settings/i })).not.toBeInTheDocument()
      })
    })

    it('shows minimal navigation for limited users', async () => {
      renderWithProviders(
        <MockAuthProvider user={limitedUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      await waitFor(() => {
        // Limited user should only see dashboard
        expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
        
        // Should not see any restricted sections
        expect(screen.queryByRole('link', { name: /schema/i })).not.toBeInTheDocument()
        expect(screen.queryByRole('link', { name: /services/i })).not.toBeInTheDocument()
        expect(screen.queryByRole('link', { name: /users/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Active Route Highlighting', () => {
    it('highlights the active navigation item based on current pathname', async () => {
      vi.mocked(usePathname).mockReturnValue('/api-connections/database')
      
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      await waitFor(() => {
        const servicesLink = screen.getByRole('link', { name: /services/i })
        expect(servicesLink).toHaveAttribute('aria-current', 'page')
        expect(servicesLink).toHaveClass('bg-primary-100', 'text-primary-700')
      })
    })

    it('updates active state when pathname changes', async () => {
      const { rerender } = renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      // Initially on dashboard
      vi.mocked(usePathname).mockReturnValue('/dashboard')
      rerender(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      await waitFor(() => {
        const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
        expect(dashboardLink).toHaveAttribute('aria-current', 'page')
      })

      // Navigate to schema
      vi.mocked(usePathname).mockReturnValue('/schema')
      rerender(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      await waitFor(() => {
        const schemaLink = screen.getByRole('link', { name: /schema/i })
        expect(schemaLink).toHaveAttribute('aria-current', 'page')
        
        const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
        expect(dashboardLink).not.toHaveAttribute('aria-current', 'page')
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('toggles sidebar collapse state when collapse button is clicked', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i })
      expect(collapseButton).toBeInTheDocument()

      await user.click(collapseButton)
      
      expect(mockAppStore.setSidebarCollapsed).toHaveBeenCalledWith(true)
    })

    it('renders collapsed sidebar with icon-only navigation', async () => {
      // Mock collapsed state
      vi.mocked(require('@/stores/app-store').useAppStore).mockReturnValue({
        ...mockAppStore,
        sidebarCollapsed: true,
      })

      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      const sidebar = screen.getByRole('navigation')
      expect(sidebar).toHaveClass('w-16') // Collapsed width

      // Navigation items should show only icons with tooltips
      const dashboardItem = screen.getByRole('link', { name: /dashboard/i })
      expect(dashboardItem).toHaveAttribute('title', 'Dashboard')
      
      // Text should be hidden in collapsed state
      const navTexts = screen.queryAllByText(/dashboard/i)
      navTexts.forEach(text => {
        expect(text).toHaveClass('sr-only')
      })
    })

    it('handles responsive breakpoints correctly', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640, // Mobile breakpoint
      })

      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      const sidebar = screen.getByRole('navigation')
      
      // On mobile, sidebar should be hidden by default
      expect(sidebar).toHaveClass('md:translate-x-0')
      
      // Should have mobile overlay
      const overlay = screen.getByRole('button', { name: /close sidebar/i })
      expect(overlay).toBeInTheDocument()
    })

    it('expands collapsed sidebar on hover when collapsed', async () => {
      const user = userEvent.setup()
      
      vi.mocked(require('@/stores/app-store').useAppStore).mockReturnValue({
        ...mockAppStore,
        sidebarCollapsed: true,
      })

      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      const sidebar = screen.getByRole('navigation')
      
      await user.hover(sidebar)
      
      // Should temporarily expand on hover
      await waitFor(() => {
        expect(sidebar).toHaveClass('group-hover:w-64')
      })

      await user.unhover(sidebar)
      
      // Should collapse again after hover ends
      await waitFor(() => {
        expect(sidebar).toHaveClass('w-16')
      })
    })
  })

  describe('User Interactions', () => {
    it('navigates to correct route when navigation item is clicked', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      const servicesLink = screen.getByRole('link', { name: /services/i })
      await user.click(servicesLink)

      expect(mockRouter.push).toHaveBeenCalledWith('/api-connections/database')
    })

    it('expands nested navigation sections on click', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      // Find expandable section (e.g., System Settings)
      const systemSettingsButton = screen.getByRole('button', { name: /system settings/i })
      expect(systemSettingsButton).toHaveAttribute('aria-expanded', 'false')

      await user.click(systemSettingsButton)

      expect(systemSettingsButton).toHaveAttribute('aria-expanded', 'true')
      
      // Sub-items should be visible
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /cache/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /cors/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /email templates/i })).toBeInTheDocument()
      })
    })

    it('focuses navigation items properly for keyboard users', async () => {
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      const firstLink = screen.getByRole('link', { name: /dashboard/i })
      firstLink.focus()
      
      expect(firstLink).toHaveFocus()
      expect(firstLink).toHaveClass('focus:ring-2', 'focus:ring-primary-500')
    })
  })

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation through navigation items', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      const sidebar = screen.getByRole('navigation')
      sidebar.focus()

      // Tab through navigation items
      await user.tab()
      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('link', { name: /services/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('link', { name: /schema/i })).toHaveFocus()
    })

    it('handles Enter key to activate navigation items', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      const servicesLink = screen.getByRole('link', { name: /services/i })
      servicesLink.focus()
      
      await user.keyboard('{Enter}')
      
      expect(mockRouter.push).toHaveBeenCalledWith('/api-connections/database')
    })

    it('handles Space key to expand/collapse sections', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      const systemSettingsButton = screen.getByRole('button', { name: /system settings/i })
      systemSettingsButton.focus()
      
      await user.keyboard(' ') // Space key
      
      expect(systemSettingsButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('handles Escape key to close mobile sidebar', async () => {
      const user = userEvent.setup()
      
      // Mock mobile viewport with sidebar open
      vi.mocked(require('@/stores/app-store').useAppStore).mockReturnValue({
        ...mockAppStore,
        sidebarCollapsed: false,
      })

      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      const sidebar = screen.getByRole('navigation')
      sidebar.focus()
      
      await user.keyboard('{Escape}')
      
      expect(mockAppStore.setSidebarCollapsed).toHaveBeenCalledWith(true)
    })

    it('manages focus trap when sidebar is expanded on mobile', async () => {
      const user = userEvent.setup()
      
      // Mock mobile environment
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      })

      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      const sidebar = screen.getByRole('navigation')
      
      // First focusable element should be the close button
      const closeButton = screen.getByRole('button', { name: /close sidebar/i })
      closeButton.focus()
      
      // Tab should cycle through navigation items
      await user.tab()
      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveFocus()
      
      // Shift+Tab should go back to close button
      await user.keyboard('{Shift>}{Tab}{/Shift}')
      expect(closeButton).toHaveFocus()
    })
  })

  describe('Accessibility Compliance', () => {
    it('has proper ARIA landmarks and labels', async () => {
      const { container } = renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      const navigation = screen.getByRole('navigation')
      expect(navigation).toHaveAttribute('aria-label', 'Main navigation')

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('provides accessible names for all interactive elements', async () => {
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      // All links should have accessible names
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveAccessibleName()
      })

      // All buttons should have accessible names
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName()
      })
    })

    it('maintains proper heading hierarchy', async () => {
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      // If there are section headings, they should follow proper hierarchy
      const headings = screen.queryAllByRole('heading')
      if (headings.length > 0) {
        headings.forEach((heading, index) => {
          const level = parseInt(heading.tagName.substring(1))
          expect(level).toBeGreaterThanOrEqual(2) // Should start at h2 in sidebar
          if (index > 0) {
            const prevLevel = parseInt(headings[index - 1].tagName.substring(1))
            expect(level).toBeLessThanOrEqual(prevLevel + 1) // No skipping levels
          }
        })
      }
    })

    it('announces navigation changes to screen readers', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      const servicesLink = screen.getByRole('link', { name: /services/i })
      
      // Should have live region for announcements
      const liveRegion = screen.queryByRole('status')
      if (liveRegion) {
        expect(liveRegion).toHaveAttribute('aria-live', 'polite')
      }

      await user.click(servicesLink)
      
      // Verify navigation was announced (if live region exists)
      if (liveRegion) {
        await waitFor(() => {
          expect(liveRegion).toHaveTextContent(/navigated to services/i)
        })
      }
    })

    it('supports high contrast mode', async () => {
      // Mock high contrast mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      const { container } = renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      const navigation = screen.getByRole('navigation')
      
      // Should have high contrast styling
      expect(navigation).toHaveClass('contrast-more:border-2')
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('supports reduced motion preferences', async () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      const navigation = screen.getByRole('navigation')
      
      // Should disable transitions when reduced motion is preferred
      expect(navigation).toHaveClass('motion-reduce:transition-none')
    })
  })

  describe('State Management Integration', () => {
    it('synchronizes with Zustand app store state', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i })
      await user.click(collapseButton)

      expect(mockAppStore.setSidebarCollapsed).toHaveBeenCalledWith(true)
    })

    it('persists sidebar state across page navigation', async () => {
      const { rerender } = renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      // Simulate state persistence
      vi.mocked(require('@/stores/app-store').useAppStore).mockReturnValue({
        ...mockAppStore,
        sidebarCollapsed: true,
      })

      rerender(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      const sidebar = screen.getByRole('navigation')
      expect(sidebar).toHaveClass('w-16') // Should maintain collapsed state
    })

    it('updates theme classes when theme changes', async () => {
      const { rerender } = renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      // Change to dark theme
      vi.mocked(require('@/stores/app-store').useAppStore).mockReturnValue({
        ...mockAppStore,
        theme: 'dark' as const,
      })

      rerender(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      const sidebar = screen.getByRole('navigation')
      expect(sidebar).toHaveClass('dark:bg-gray-900') // Should apply dark theme classes
    })
  })

  describe('Error Handling', () => {
    it('handles navigation data loading errors gracefully', async () => {
      // Mock navigation data error
      server.use(
        navigationHandlers.map(handler => 
          handler.mockImplementationOnce(() => {
            throw new Error('Navigation data failed to load')
          })
        )[0]
      )

      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <Sidebar />
        </MockAuthProvider>
      )

      // Should show fallback navigation or error state
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
      })
    })

    it('handles permission context errors gracefully', async () => {
      // Mock auth context with error
      renderWithProviders(
        <MockAuthProvider user={null} error="Failed to load user permissions">
          <Sidebar />
        </MockAuthProvider>
      )

      // Should render minimal navigation for unauthenticated state
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument()
        expect(screen.queryByRole('link', { name: /services/i })).not.toBeInTheDocument()
      })
    })
  })
})