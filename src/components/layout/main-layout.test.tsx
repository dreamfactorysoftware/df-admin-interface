/**
 * Comprehensive test suite for the main layout component validating render behavior,
 * provider integration, responsive design, and user interaction handling.
 * 
 * Uses Vitest testing framework with React Testing Library and Mock Service Worker
 * for realistic testing scenarios following WCAG 2.1 AA accessibility compliance.
 * 
 * Key Testing Areas:
 * - React 19 server component rendering with Next.js app router patterns
 * - Theme provider integration with system preference detection
 * - Authentication state management and session validation
 * - Responsive layout behavior across viewport sizes
 * - Keyboard navigation and accessibility compliance
 * - Error boundary integration and graceful error handling
 * - Zustand state management synchronization
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { useRouter, usePathname } from 'next/navigation'

import { MainLayout } from './main-layout'
import { renderWithProviders } from '@/test/utils/test-utils'
import { MockAuthProvider, MockRouterProvider, MockThemeProvider } from '@/test/utils/mock-providers'
import { createMockUser, createMockPermissions, createMockSystemInfo } from '@/test/utils/component-factories'
import { authHandlers } from '@/test/mocks/auth-handlers'
import { systemHandlers } from '@/test/mocks/system-handlers'
import { server } from '@/test/mocks/server'

// Extend jest-dom matchers for accessibility testing
expect.extend(toHaveNoViolations)

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}))

// Mock Zustand store for layout state management
vi.mock('@/stores/app-store', () => ({
  useAppStore: vi.fn(),
}))

// Mock theme detection hooks
vi.mock('@/hooks/use-theme', () => ({
  useTheme: vi.fn(),
}))

// Mock ResizeObserver for responsive behavior testing
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver for lazy loading tests
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia for responsive and accessibility testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('MainLayout Component', () => {
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
    user: null,
    setUser: vi.fn(),
    isLoading: false,
    setIsLoading: vi.fn(),
  }

  const mockTheme = {
    theme: 'light' as const,
    resolvedTheme: 'light' as const,
    setTheme: vi.fn(),
    systemTheme: 'light' as const,
  }

  // Test user scenarios for comprehensive permission testing
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

  const unauthorizedUser = createMockUser({
    id: '3',
    firstName: 'Unauthorized',
    lastName: 'User',
    email: 'unauthorized@dreamfactory.com',
    isActive: false,
    isSystemAdmin: false,
    permissions: createMockPermissions({}),
  })

  beforeAll(() => {
    // Setup MSW server
    server.listen({ onUnhandledRequest: 'error' })
  })

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset Next.js router mocks
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    
    // Reset Zustand store mock
    const { useAppStore } = require('@/stores/app-store')
    vi.mocked(useAppStore).mockReturnValue(mockAppStore)

    // Reset theme hook mock
    const { useTheme } = require('@/hooks/use-theme')
    vi.mocked(useTheme).mockReturnValue(mockTheme)

    // Setup MSW handlers for layout dependencies
    server.use(...authHandlers, ...systemHandlers)
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  describe('Basic Rendering and Structure', () => {
    it('renders the main layout with correct semantic structure and ARIA landmarks', async () => {
      const { container } = renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div data-testid="main-content">Test Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Verify main layout structure with semantic HTML
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      expect(main).toHaveAttribute('id', 'main-content')

      // Verify navigation landmark
      const navigation = screen.getByRole('navigation', { name: /main navigation/i })
      expect(navigation).toBeInTheDocument()

      // Verify banner/header landmark
      const banner = screen.queryByRole('banner')
      if (banner) {
        expect(banner).toBeInTheDocument()
      }

      // Verify complementary/sidebar landmark
      const complementary = screen.queryByRole('complementary')
      if (complementary) {
        expect(complementary).toBeInTheDocument()
      }

      // Verify content area renders children
      expect(screen.getByTestId('main-content')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()

      // Test for accessibility violations
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('includes skip link for keyboard navigation accessibility', async () => {
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Skip link should be present but hidden by default
      const skipLink = screen.getByRole('link', { name: /skip to main content/i })
      expect(skipLink).toBeInTheDocument()
      expect(skipLink).toHaveAttribute('href', '#main-content')
      
      // Skip link should become visible when focused
      skipLink.focus()
      expect(skipLink).toHaveFocus()
      expect(skipLink).not.toHaveClass('sr-only')
    })

    it('renders with proper error boundary integration', async () => {
      const ThrowError = () => {
        throw new Error('Test error for error boundary')
      }

      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <ThrowError />
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Error boundary should catch the error and display fallback UI
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })

    it('displays loading states appropriately during data fetching', async () => {
      // Mock loading state
      vi.mocked(require('@/stores/app-store').useAppStore).mockReturnValue({
        ...mockAppStore,
        isLoading: true,
      })

      renderWithProviders(
        <MockAuthProvider user={null} loading={true}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Should show loading indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.getByLabelText(/loading/i)).toBeInTheDocument()

      // Content should be hidden during loading
      expect(screen.queryByText('Content')).not.toBeInTheDocument()
    })
  })

  describe('Authentication Integration', () => {
    it('renders authenticated layout for valid users', async () => {
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div data-testid="authenticated-content">Dashboard Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      await waitFor(() => {
        // Should render main navigation for authenticated users
        expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument()
        
        // Should render user menu
        expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument()
        
        // Should render main content
        expect(screen.getByTestId('authenticated-content')).toBeInTheDocument()
      })
    })

    it('redirects unauthenticated users to login', async () => {
      renderWithProviders(
        <MockAuthProvider user={null}>
          <MockThemeProvider>
            <MainLayout>
              <div>Protected Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/login')
      })
    })

    it('handles session expiration gracefully', async () => {
      const { rerender } = renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Simulate session expiration
      rerender(
        <MockAuthProvider user={null} error="Session expired">
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      await waitFor(() => {
        // Should show session expired message
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/session expired/i)).toBeInTheDocument()
        
        // Should redirect to login
        expect(mockRouter.replace).toHaveBeenCalledWith('/login')
      })
    })

    it('restricts layout elements based on user permissions', async () => {
      renderWithProviders(
        <MockAuthProvider user={regularUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      await waitFor(() => {
        // Regular users should see limited navigation
        expect(screen.getByRole('navigation')).toBeInTheDocument()
        
        // Should not see admin-only elements
        expect(screen.queryByRole('button', { name: /system settings/i })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /user management/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Theme Integration and Visual Consistency', () => {
    it('applies light theme classes correctly', async () => {
      vi.mocked(require('@/hooks/use-theme').useTheme).mockReturnValue({
        ...mockTheme,
        theme: 'light',
        resolvedTheme: 'light',
      })

      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      const layout = screen.getByTestId('main-layout')
      expect(layout).toHaveClass('bg-white', 'text-gray-900')
      expect(layout).not.toHaveClass('dark')
    })

    it('applies dark theme classes correctly', async () => {
      vi.mocked(require('@/hooks/use-theme').useTheme).mockReturnValue({
        ...mockTheme,
        theme: 'dark',
        resolvedTheme: 'dark',
      })

      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      const layout = screen.getByTestId('main-layout')
      expect(layout).toHaveClass('dark:bg-gray-900', 'dark:text-white')
    })

    it('responds to system theme preference changes', async () => {
      const { rerender } = renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Simulate system theme change to dark
      vi.mocked(require('@/hooks/use-theme').useTheme).mockReturnValue({
        ...mockTheme,
        theme: 'system',
        resolvedTheme: 'dark',
        systemTheme: 'dark',
      })

      rerender(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      await waitFor(() => {
        const layout = screen.getByTestId('main-layout')
        expect(layout).toHaveAttribute('data-theme', 'dark')
      })
    })

    it('persists theme preferences across page reloads', async () => {
      const { rerender } = renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Change theme
      const themeToggle = screen.getByRole('button', { name: /toggle theme/i })
      await userEvent.click(themeToggle)

      expect(mockTheme.setTheme).toHaveBeenCalledWith('dark')

      // Simulate page reload with persisted theme
      vi.mocked(require('@/hooks/use-theme').useTheme).mockReturnValue({
        ...mockTheme,
        theme: 'dark',
        resolvedTheme: 'dark',
      })

      rerender(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      await waitFor(() => {
        const layout = screen.getByTestId('main-layout')
        expect(layout).toHaveAttribute('data-theme', 'dark')
      })
    })
  })

  describe('Responsive Layout Behavior', () => {
    it('adapts to mobile viewport correctly', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      })

      // Trigger resize event
      fireEvent(window, new Event('resize'))

      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Mobile Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      await waitFor(() => {
        const layout = screen.getByTestId('main-layout')
        expect(layout).toHaveClass('mobile-layout')
        
        // Sidebar should be hidden on mobile by default
        const sidebar = screen.getByRole('navigation')
        expect(sidebar).toHaveClass('md:translate-x-0', '-translate-x-full')
        
        // Mobile header should be visible
        const mobileHeader = screen.getByRole('banner')
        expect(mobileHeader).toHaveClass('md:hidden')
      })
    })

    it('adapts to tablet viewport correctly', async () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })

      fireEvent(window, new Event('resize'))

      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Tablet Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      await waitFor(() => {
        const layout = screen.getByTestId('main-layout')
        expect(layout).toHaveClass('tablet-layout')
        
        // Should show sidebar but possibly collapsed
        const sidebar = screen.getByRole('navigation')
        expect(sidebar).toBeVisible()
      })
    })

    it('adapts to desktop viewport correctly', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280,
      })

      fireEvent(window, new Event('resize'))

      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Desktop Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      await waitFor(() => {
        const layout = screen.getByTestId('main-layout')
        expect(layout).toHaveClass('desktop-layout')
        
        // Full sidebar should be visible on desktop
        const sidebar = screen.getByRole('navigation')
        expect(sidebar).toBeVisible()
        expect(sidebar).toHaveClass('w-64') // Full width
      })
    })

    it('handles orientation changes appropriately', async () => {
      // Mock portrait orientation
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024,
      })

      fireEvent(window, new Event('resize'))

      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Portrait Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Change to landscape
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 768,
      })

      fireEvent(window, new Event('resize'))

      await waitFor(() => {
        const layout = screen.getByTestId('main-layout')
        expect(layout).toHaveAttribute('data-orientation', 'landscape')
      })
    })
  })

  describe('Sidebar Integration and State Management', () => {
    it('manages sidebar collapse state correctly', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i })
      await user.click(collapseButton)

      expect(mockAppStore.setSidebarCollapsed).toHaveBeenCalledWith(true)
    })

    it('persists sidebar state across page navigation', async () => {
      // Start with collapsed sidebar
      vi.mocked(require('@/stores/app-store').useAppStore).mockReturnValue({
        ...mockAppStore,
        sidebarCollapsed: true,
      })

      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      const sidebar = screen.getByRole('navigation')
      expect(sidebar).toHaveClass('w-16') // Collapsed width
    })

    it('handles sidebar state synchronization with Zustand store', async () => {
      const { rerender } = renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Change store state
      vi.mocked(require('@/stores/app-store').useAppStore).mockReturnValue({
        ...mockAppStore,
        sidebarCollapsed: true,
      })

      rerender(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      await waitFor(() => {
        const sidebar = screen.getByRole('navigation')
        expect(sidebar).toHaveClass('w-16') // Should reflect updated state
      })
    })
  })

  describe('Keyboard Navigation and Accessibility', () => {
    it('supports keyboard navigation through layout elements', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Tab through layout elements
      await user.tab()
      expect(screen.getByRole('link', { name: /skip to main content/i })).toHaveFocus()

      await user.tab()
      // Should focus on first navigation item
      const firstNavItem = screen.getAllByRole('link')[1] // Skip link is first
      expect(firstNavItem).toHaveFocus()
    })

    it('manages focus correctly when navigating between sections', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <button data-testid="content-button">Content Button</button>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Use skip link to jump to main content
      const skipLink = screen.getByRole('link', { name: /skip to main content/i })
      await user.click(skipLink)

      // Focus should move to main content area
      const mainContent = screen.getByRole('main')
      expect(mainContent).toHaveFocus()
    })

    it('supports ARIA landmarks and proper heading hierarchy', async () => {
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>
                <h1>Page Title</h1>
                <h2>Section Title</h2>
                <h3>Subsection Title</h3>
              </div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Verify landmark structure
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByRole('banner')).toBeInTheDocument()

      // Verify heading hierarchy
      const headings = screen.getAllByRole('heading')
      expect(headings[0]).toHaveProperty('tagName', 'H1')
      expect(headings[1]).toHaveProperty('tagName', 'H2')
      expect(headings[2]).toHaveProperty('tagName', 'H3')
    })

    it('announces layout changes to screen readers', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Toggle sidebar
      const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i })
      await user.click(collapseButton)

      // Should have live region for announcements
      const liveRegion = screen.getByRole('status')
      expect(liveRegion).toHaveAttribute('aria-live', 'polite')
      
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent(/sidebar collapsed/i)
      })
    })

    it('handles high contrast mode preferences', async () => {
      // Mock high contrast preference
      vi.mocked(window.matchMedia).mockImplementation(query => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      const { container } = renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      const layout = screen.getByTestId('main-layout')
      expect(layout).toHaveClass('contrast-more:border-2')

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('supports reduced motion preferences', async () => {
      // Mock reduced motion preference
      vi.mocked(window.matchMedia).mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      const layout = screen.getByTestId('main-layout')
      expect(layout).toHaveClass('motion-reduce:transition-none')
    })
  })

  describe('Error Handling and Recovery', () => {
    it('displays error boundary UI when child components throw errors', async () => {
      const ErrorComponent = () => {
        throw new Error('Child component error')
      }

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <ErrorComponent />
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })

    it('provides error recovery mechanisms', async () => {
      const user = userEvent.setup()
      
      const ErrorComponent = ({ shouldError = false }: { shouldError?: boolean }) => {
        if (shouldError) {
          throw new Error('Recoverable error')
        }
        return <div>Content loaded successfully</div>
      }

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { rerender } = renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <ErrorComponent shouldError={true} />
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Error should be displayed
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /try again/i })
      await user.click(retryButton)

      // Re-render with fixed component
      rerender(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <ErrorComponent shouldError={false} />
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Content loaded successfully')).toBeInTheDocument()
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })

    it('handles network errors gracefully', async () => {
      // Mock network error
      server.use(
        authHandlers.map(handler => 
          handler.mockImplementationOnce(() => {
            throw new Error('Network error')
          })
        )[0]
      )

      renderWithProviders(
        <MockAuthProvider user={null}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Performance and Loading States', () => {
    it('shows loading indicators during initial authentication check', async () => {
      renderWithProviders(
        <MockAuthProvider user={null} loading={true}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.getByLabelText(/loading application/i)).toBeInTheDocument()
    })

    it('implements lazy loading for sidebar components', async () => {
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Sidebar should be loaded
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument()
      })

      // Verify lazy loading attributes
      const sidebar = screen.getByRole('navigation')
      expect(sidebar).toHaveAttribute('data-loaded', 'true')
    })

    it('optimizes re-renders using React.memo patterns', async () => {
      const renderSpy = vi.fn()
      
      const TestChild = vi.fn(({ children }: { children: React.ReactNode }) => {
        renderSpy()
        return <div>{children}</div>
      })

      const { rerender } = renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <TestChild>Test Content</TestChild>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Initial render
      expect(renderSpy).toHaveBeenCalledTimes(1)

      // Re-render with same props
      rerender(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <TestChild>Test Content</TestChild>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Should not trigger additional renders due to memoization
      expect(renderSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Integration with Next.js App Router', () => {
    it('integrates properly with Next.js routing system', async () => {
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Page Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Should use Next.js routing context
      expect(vi.mocked(useRouter)).toHaveBeenCalled()
      expect(vi.mocked(usePathname)).toHaveBeenCalled()
    })

    it('handles route changes and updates active states', async () => {
      const { rerender } = renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Dashboard Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Change route
      vi.mocked(usePathname).mockReturnValue('/api-connections/database')

      rerender(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Services Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      await waitFor(() => {
        // Navigation should reflect active route
        const servicesLink = screen.getByRole('link', { name: /services/i })
        expect(servicesLink).toHaveAttribute('aria-current', 'page')
      })
    })

    it('supports server-side rendering without hydration mismatches', async () => {
      // Mock SSR environment
      Object.defineProperty(window, 'document', {
        value: undefined,
        writable: true,
      })

      // Should render without errors in SSR mode
      expect(() => {
        renderWithProviders(
          <MockAuthProvider user={adminUser}>
            <MockThemeProvider>
              <MainLayout>
                <div>SSR Content</div>
              </MainLayout>
            </MockThemeProvider>
          </MockAuthProvider>
        )
      }).not.toThrow()

      // Restore document
      Object.defineProperty(window, 'document', {
        value: document,
        writable: true,
      })
    })
  })

  describe('WCAG 2.1 AA Compliance Validation', () => {
    it('meets color contrast requirements', async () => {
      const { container } = renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content with text</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Test for color contrast violations
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      })
      expect(results).toHaveNoViolations()
    })

    it('provides adequate touch target sizes', async () => {
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // All interactive elements should meet 44x44px minimum
      const buttons = screen.getAllByRole('button')
      const links = screen.getAllByRole('link')
      
      [...buttons, ...links].forEach(element => {
        const styles = getComputedStyle(element)
        const minHeight = parseInt(styles.minHeight)
        const minWidth = parseInt(styles.minWidth)
        
        expect(minHeight).toBeGreaterThanOrEqual(44)
        expect(minWidth).toBeGreaterThanOrEqual(44)
      })
    })

    it('maintains proper focus indicators', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Tab to focusable elements
      await user.tab()
      const focusedElement = document.activeElement

      if (focusedElement) {
        const styles = getComputedStyle(focusedElement)
        
        // Focus indicator should be visible
        expect(styles.outline).not.toBe('none')
        expect(styles.outlineWidth).toBeTruthy()
      }
    })

    it('supports screen reader announcements', async () => {
      renderWithProviders(
        <MockAuthProvider user={adminUser}>
          <MockThemeProvider>
            <MainLayout>
              <div>Content</div>
            </MainLayout>
          </MockThemeProvider>
        </MockAuthProvider>
      )

      // Should have live regions for dynamic content
      const liveRegions = screen.getAllByRole('status')
      expect(liveRegions.length).toBeGreaterThan(0)

      liveRegions.forEach(region => {
        expect(region).toHaveAttribute('aria-live')
      })
    })
  })
})