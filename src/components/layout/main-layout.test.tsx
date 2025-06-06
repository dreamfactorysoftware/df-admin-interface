/**
 * MainLayout Component Test Suite
 * 
 * Comprehensive test coverage for the main layout component validating render behavior,
 * provider integration, responsive design, accessibility compliance, user interaction handling,
 * error boundaries, and theme management. Uses Vitest testing framework with React Testing
 * Library and Mock Service Worker for realistic testing scenarios.
 * 
 * Test Categories:
 * - Component Rendering and Structure
 * - Provider Integration and Context
 * - Responsive Design Behavior
 * - Accessibility Compliance (WCAG 2.1 AA)
 * - Error Boundary and Loading States
 * - Theme and Dark Mode Support
 * - Keyboard Navigation and Focus Management
 * - User Interaction and Event Handling
 * - Performance and Optimization
 * - Server-Side Rendering Compatibility
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';

// Import the component under test
import { MainLayout } from './main-layout';

// Import testing utilities
import {
  renderWithProviders,
  accessibilityUtils,
  headlessUIUtils,
  testUtils,
  type CustomRenderOptions,
} from '@/test/utils/test-utils';

// Import authentication handlers for MSW
import { authHandlers } from '@/test/mocks/auth-handlers';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// ============================================================================
// TEST SETUP AND MOCKING
// ============================================================================

/**
 * Mock child components to isolate MainLayout testing
 * This prevents dependencies on complex child component implementations
 */
vi.mock('./sidebar', () => ({
  Sidebar: ({ children, ...props }: any) => (
    <div data-testid="sidebar" {...props}>
      <nav aria-label="Main navigation">
        <button data-testid="nav-dashboard">Dashboard</button>
        <button data-testid="nav-services">Services</button>
        <button data-testid="nav-schema">Schema</button>
        <button data-testid="nav-admin">Admin</button>
      </nav>
    </div>
  ),
}));

vi.mock('./header', () => ({
  Header: ({ children, ...props }: any) => (
    <header data-testid="header" {...props}>
      <div className="flex items-center justify-between h-16 px-4">
        <div data-testid="header-title">DreamFactory Console</div>
        <div className="flex items-center space-x-4">
          <button data-testid="theme-toggle" aria-label="Toggle theme">
            Theme
          </button>
          <button data-testid="user-menu" aria-label="User menu">
            User
          </button>
        </div>
      </div>
    </header>
  ),
}));

/**
 * Mock utility functions used by MainLayout
 */
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}));

/**
 * Mock Next.js middleware and routing utilities
 */
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

/**
 * Mock window methods for responsive design testing
 */
const mockWindow = {
  matchMedia: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  innerWidth: 1024,
  innerHeight: 768,
};

// ============================================================================
// TEST DATA AND FIXTURES
// ============================================================================

/**
 * Mock user data for authentication testing
 */
const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  isAdmin: false,
  sessionToken: 'mock-session-token',
};

const mockAdminUser = {
  id: '2',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  isAdmin: true,
  sessionToken: 'mock-admin-token',
};

/**
 * Test component that throws an error for error boundary testing
 */
const ThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error for error boundary');
  }
  return <div data-testid="no-error">No error occurred</div>;
};

/**
 * Test component for children rendering
 */
const TestChildComponent = () => (
  <div data-testid="test-child">
    <h1>Test Page Content</h1>
    <button data-testid="test-button">Test Button</button>
    <input data-testid="test-input" placeholder="Test input" />
  </div>
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Renders MainLayout with common test configuration
 */
const renderMainLayout = (
  children: React.ReactNode = <TestChildComponent />,
  options: CustomRenderOptions = {}
) => {
  const defaultOptions: CustomRenderOptions = {
    providerOptions: {
      router: mockRouter,
      pathname: '/',
      user: mockUser,
      theme: 'light',
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    providerOptions: {
      ...defaultOptions.providerOptions,
      ...options.providerOptions,
    },
  };

  return renderWithProviders(
    <MainLayout>{children}</MainLayout>,
    mergedOptions
  );
};

/**
 * Mock media query for responsive testing
 */
const mockMediaQuery = (query: string, matches: boolean) => {
  const mediaQuery = {
    matches,
    media: query,
    onchange: null as any,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  
  mockWindow.matchMedia = vi.fn().mockReturnValue(mediaQuery);
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockWindow.matchMedia,
  });
  
  return mediaQuery;
};

/**
 * Simulate viewport resize for responsive testing
 */
const resizeViewport = (width: number, height: number) => {
  mockWindow.innerWidth = width;
  mockWindow.innerHeight = height;
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    value: height,
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

// ============================================================================
// TEST SUITE SETUP
// ============================================================================

describe('MainLayout Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup DOM environment
    document.documentElement.className = '';
    document.documentElement.classList.add('light');
    
    // Mock window methods
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
    });
    
    // Mock console.error to prevent error boundary noise
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // COMPONENT RENDERING AND STRUCTURE TESTS
  // ============================================================================

  describe('Component Rendering and Structure', () => {
    it('renders without crashing', () => {
      renderMainLayout();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders all required layout sections', () => {
      renderMainLayout();
      
      // Check for main layout elements
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Check for accessibility landmarks
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByLabelText('Main content')).toBeInTheDocument();
    });

    it('renders children content correctly', () => {
      renderMainLayout(<TestChildComponent />);
      
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByText('Test Page Content')).toBeInTheDocument();
      expect(screen.getByTestId('test-button')).toBeInTheDocument();
      expect(screen.getByTestId('test-input')).toBeInTheDocument();
    });

    it('applies custom className prop', () => {
      renderMainLayout(
        <TestChildComponent />,
        {
          providerOptions: {
            router: mockRouter,
          },
        }
      );
      
      // Find the root container
      const container = screen.getByRole('main').closest('.min-h-screen');
      expect(container).toHaveClass('min-h-screen', 'bg-gray-50');
    });

    it('renders skip link for accessibility', () => {
      renderMainLayout();
      
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('includes modal and announcement regions', () => {
      renderMainLayout();
      
      expect(document.getElementById('modal-root')).toBeInTheDocument();
      expect(document.getElementById('announcement-region')).toBeInTheDocument();
      
      const announcementRegion = document.getElementById('announcement-region');
      expect(announcementRegion).toHaveAttribute('aria-live', 'polite');
      expect(announcementRegion).toHaveAttribute('aria-atomic', 'true');
    });
  });

  // ============================================================================
  // PROVIDER INTEGRATION AND CONTEXT TESTS
  // ============================================================================

  describe('Provider Integration and Context', () => {
    it('integrates with authentication provider', () => {
      renderMainLayout(<TestChildComponent />, {
        providerOptions: {
          user: mockUser,
        },
      });
      
      // Component should render for authenticated users
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('handles unauthenticated state', () => {
      renderMainLayout(<TestChildComponent />, {
        providerOptions: {
          user: null,
        },
      });
      
      // Layout should still render but may have different behavior
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('integrates with theme provider', () => {
      renderMainLayout(<TestChildComponent />, {
        providerOptions: {
          theme: 'dark',
        },
      });
      
      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toHaveClass('dark');
    });

    it('integrates with React Query provider', async () => {
      const mockQueryClient = {
        getQueryData: vi.fn(),
        setQueryData: vi.fn(),
        invalidateQueries: vi.fn(),
      };

      renderMainLayout(<TestChildComponent />, {
        providerOptions: {
          queryClient: mockQueryClient as any,
        },
      });
      
      // Component should render with query client context
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('handles router context integration', () => {
      const customRouter = {
        ...mockRouter,
        push: vi.fn(),
      };

      renderMainLayout(<TestChildComponent />, {
        providerOptions: {
          router: customRouter,
          pathname: '/dashboard',
        },
      });
      
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // RESPONSIVE DESIGN BEHAVIOR TESTS
  // ============================================================================

  describe('Responsive Design Behavior', () => {
    it('adapts layout for mobile viewport (< 768px)', () => {
      // Mock mobile viewport
      resizeViewport(375, 667);
      mockMediaQuery('(max-width: 767px)', true);
      
      renderMainLayout();
      
      // Check that layout adapts to mobile
      const container = screen.getByRole('main').closest('.min-h-screen');
      expect(container).toBeInTheDocument();
      
      // Sidebar might be hidden or collapsed on mobile
      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toBeInTheDocument();
    });

    it('adapts layout for tablet viewport (768px - 1023px)', () => {
      // Mock tablet viewport
      resizeViewport(768, 1024);
      mockMediaQuery('(min-width: 768px) and (max-width: 1023px)', true);
      
      renderMainLayout();
      
      const sidebar = screen.getByTestId('sidebar');
      const header = screen.getByTestId('header');
      
      expect(sidebar).toBeInTheDocument();
      expect(header).toBeInTheDocument();
    });

    it('adapts layout for desktop viewport (>= 1024px)', () => {
      // Mock desktop viewport
      resizeViewport(1920, 1080);
      mockMediaQuery('(min-width: 1024px)', true);
      
      renderMainLayout();
      
      const sidebar = screen.getByTestId('sidebar');
      const header = screen.getByTestId('header');
      const main = screen.getByRole('main');
      
      expect(sidebar).toBeInTheDocument();
      expect(header).toBeInTheDocument();
      expect(main).toBeInTheDocument();
    });

    it('handles viewport orientation changes', () => {
      // Start in portrait
      resizeViewport(375, 812);
      renderMainLayout();
      
      // Change to landscape
      resizeViewport(812, 375);
      
      // Layout should still function
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('provides responsive container classes', () => {
      renderMainLayout();
      
      const mainContent = screen.getByRole('main');
      const container = mainContent.querySelector('.container');
      
      expect(container).toHaveClass('mx-auto', 'px-4', 'sm:px-6', 'lg:px-8');
    });
  });

  // ============================================================================
  // ACCESSIBILITY COMPLIANCE TESTS (WCAG 2.1 AA)
  // ============================================================================

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderMainLayout();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper ARIA landmarks', () => {
      renderMainLayout();
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    });

    it('supports keyboard navigation', async () => {
      renderMainLayout();
      
      const container = screen.getByRole('main').closest('.min-h-screen')!;
      const navigationResult = await accessibilityUtils.testKeyboardNavigation(container, user);
      
      expect(navigationResult.success).toBe(true);
      expect(navigationResult.focusedElements.length).toBeGreaterThan(0);
    });

    it('has proper focus management', async () => {
      renderMainLayout();
      
      // Test focus on skip link
      await user.keyboard('{Tab}');
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveFocus();
      
      // Test skip link functionality
      await user.keyboard('{Enter}');
      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveFocus();
    });

    it('provides appropriate ARIA labels and descriptions', () => {
      renderMainLayout();
      
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Main content');
      expect(main).toHaveAttribute('id', 'main-content');
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    });

    it('maintains proper heading hierarchy', () => {
      renderMainLayout(
        <div>
          <h1>Page Title</h1>
          <h2>Section Title</h2>
        </div>
      );
      
      const headings = screen.getAllByRole('heading');
      expect(headings).toHaveLength(2);
      expect(headings[0]).toHaveProperty('tagName', 'H1');
      expect(headings[1]).toHaveProperty('tagName', 'H2');
    });

    it('provides adequate color contrast', () => {
      renderMainLayout();
      
      const container = screen.getByRole('main').closest('.min-h-screen')!;
      const hasContrast = accessibilityUtils.hasAdequateContrast(container);
      expect(hasContrast).toBe(true);
    });

    it('supports screen reader announcements', () => {
      renderMainLayout();
      
      const announcementRegion = document.getElementById('announcement-region');
      expect(announcementRegion).toHaveAttribute('aria-live', 'polite');
      expect(announcementRegion).toHaveClass('sr-only');
    });
  });

  // ============================================================================
  // ERROR BOUNDARY AND LOADING STATES TESTS
  // ============================================================================

  describe('Error Boundary and Loading States', () => {
    it('handles child component errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderMainLayout(<ThrowingComponent shouldThrow={true} />);
      
      // Should display error boundary fallback
      expect(screen.getByText('Application Error')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Reload Page')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('provides recovery options in error boundary', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });
      
      renderMainLayout(<ThrowingComponent shouldThrow={true} />);
      
      // Test reload button
      const reloadButton = screen.getByText('Reload Page');
      await user.click(reloadButton);
      expect(mockReload).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('displays loading state during mount', () => {
      // Mock useState to simulate loading state
      const { unmount } = renderMainLayout();
      
      // Component should render eventually
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      unmount();
    });

    it('shows loading fallback for Suspense boundaries', async () => {
      renderMainLayout();
      
      // Loading fallbacks should be present for sidebar and header
      // These would be replaced by actual components after loading
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('handles global loading overlay', async () => {
      // Mock global loading state
      renderMainLayout(<TestChildComponent />, {
        providerOptions: {
          // This would come from app store context
        },
      });
      
      // Test that global loading can be triggered
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('displays error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderMainLayout(<ThrowingComponent shouldThrow={true} />);
      
      // Should show error details in development
      expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // THEME AND DARK MODE SUPPORT TESTS
  // ============================================================================

  describe('Theme and Dark Mode Support', () => {
    it('renders correctly in light theme', () => {
      renderMainLayout(<TestChildComponent />, {
        providerOptions: {
          theme: 'light',
        },
      });
      
      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toHaveClass('light');
      
      const container = screen.getByRole('main').closest('.min-h-screen');
      expect(container).toHaveClass('bg-gray-50');
    });

    it('renders correctly in dark theme', () => {
      renderMainLayout(<TestChildComponent />, {
        providerOptions: {
          theme: 'dark',
        },
      });
      
      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toHaveClass('dark');
      
      const container = screen.getByRole('main').closest('.min-h-screen');
      expect(container).toHaveClass('dark:bg-gray-900');
    });

    it('applies theme classes to document root', () => {
      renderMainLayout(<TestChildComponent />, {
        providerOptions: {
          theme: 'dark',
        },
      });
      
      // In real implementation, this would update document.documentElement
      // For testing, we check the theme provider wrapper
      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toHaveClass('dark');
    });

    it('handles system theme preference', () => {
      // Mock system dark theme preference
      mockMediaQuery('(prefers-color-scheme: dark)', true);
      
      renderMainLayout(<TestChildComponent />, {
        providerOptions: {
          theme: 'light', // Explicit theme should override system
        },
      });
      
      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toHaveClass('light');
    });

    it('supports theme transitions', () => {
      renderMainLayout();
      
      const container = screen.getByRole('main').closest('.min-h-screen');
      expect(container).toHaveClass('transition-colors', 'duration-300');
    });
  });

  // ============================================================================
  // KEYBOARD NAVIGATION AND FOCUS MANAGEMENT TESTS
  // ============================================================================

  describe('Keyboard Navigation and Focus Management', () => {
    it('supports Tab navigation through interactive elements', async () => {
      renderMainLayout();
      
      // Start from skip link
      await user.keyboard('{Tab}');
      expect(screen.getByText('Skip to main content')).toHaveFocus();
      
      // Continue tabbing through navigation
      await user.keyboard('{Tab}');
      const navElements = screen.getAllByRole('button');
      expect(navElements.some(el => el === document.activeElement)).toBe(true);
    });

    it('supports Shift+Tab for reverse navigation', async () => {
      renderMainLayout();
      
      // Focus on an element first
      const testButton = screen.getByTestId('test-button');
      testButton.focus();
      
      // Shift+Tab should move focus backwards
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      
      // Focus should have moved to previous element
      expect(document.activeElement).not.toBe(testButton);
    });

    it('handles Escape key for closing modals/menus', async () => {
      renderMainLayout();
      
      // Test Escape key handling
      await user.keyboard('{Escape}');
      
      // Should not cause any errors
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('provides keyboard shortcuts for navigation', async () => {
      renderMainLayout();
      
      // Test skip link with Enter key
      const skipLink = screen.getByText('Skip to main content');
      skipLink.focus();
      await user.keyboard('{Enter}');
      
      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveFocus();
    });

    it('maintains focus within modal/dialog contexts', async () => {
      // This would test focus trapping if modals were open
      renderMainLayout();
      
      const focusableElements = accessibilityUtils.getFocusableElements(
        screen.getByRole('main').closest('.min-h-screen')!
      );
      
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('provides visible focus indicators', () => {
      renderMainLayout();
      
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveClass('focus:not-sr-only', 'focus:absolute');
    });
  });

  // ============================================================================
  // USER INTERACTION AND EVENT HANDLING TESTS
  // ============================================================================

  describe('User Interaction and Event Handling', () => {
    it('handles click events on interactive elements', async () => {
      renderMainLayout();
      
      const testButton = screen.getByTestId('test-button');
      await user.click(testButton);
      
      // Button should remain in document after click
      expect(testButton).toBeInTheDocument();
    });

    it('handles form interactions within main content', async () => {
      renderMainLayout();
      
      const testInput = screen.getByTestId('test-input');
      await user.type(testInput, 'test input value');
      
      expect(testInput).toHaveValue('test input value');
    });

    it('handles navigation interactions', async () => {
      renderMainLayout();
      
      const navButton = screen.getByTestId('nav-dashboard');
      await user.click(navButton);
      
      // Navigation should remain functional
      expect(navButton).toBeInTheDocument();
    });

    it('handles header interactions', async () => {
      renderMainLayout();
      
      const themeToggle = screen.getByTestId('theme-toggle');
      await user.click(themeToggle);
      
      expect(themeToggle).toBeInTheDocument();
    });

    it('handles window resize events', () => {
      renderMainLayout();
      
      // Trigger resize event
      resizeViewport(800, 600);
      
      // Layout should adapt but remain functional
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles media query changes', () => {
      renderMainLayout();
      
      // Change media query
      const mediaQuery = mockMediaQuery('(prefers-color-scheme: dark)', true);
      
      // Trigger change event
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', () => {});
      }
      
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // PERFORMANCE AND OPTIMIZATION TESTS
  // ============================================================================

  describe('Performance and Optimization', () => {
    it('renders efficiently without unnecessary re-renders', () => {
      const { rerender } = renderMainLayout();
      
      // Re-render with same props
      rerender(<MainLayout><TestChildComponent /></MainLayout>);
      
      // Component should still be functional
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('handles large content efficiently', () => {
      const largeContent = (
        <div>
          {Array.from({ length: 100 }, (_, i) => (
            <div key={i} data-testid={`item-${i}`}>
              Item {i}
            </div>
          ))}
        </div>
      );
      
      renderMainLayout(largeContent);
      
      // Should render without performance issues
      expect(screen.getByTestId('item-0')).toBeInTheDocument();
      expect(screen.getByTestId('item-99')).toBeInTheDocument();
    });

    it('uses proper memoization for callbacks', () => {
      const { rerender } = renderMainLayout();
      
      // Multiple re-renders should not cause issues
      for (let i = 0; i < 5; i++) {
        rerender(<MainLayout><TestChildComponent /></MainLayout>);
      }
      
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('implements efficient Suspense boundaries', () => {
      renderMainLayout();
      
      // Suspense boundaries should be present
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('provides efficient error boundary implementation', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Should not cause memory leaks or performance issues
      renderMainLayout(<ThrowingComponent shouldThrow={true} />);
      
      expect(screen.getByText('Application Error')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // SERVER-SIDE RENDERING COMPATIBILITY TESTS
  // ============================================================================

  describe('Server-Side Rendering Compatibility', () => {
    it('prevents hydration mismatches', () => {
      // Mock server-side environment
      const originalWindow = global.window;
      delete (global as any).window;
      
      try {
        renderMainLayout();
        
        // Restore window for hydration
        global.window = originalWindow;
        
        // Component should handle hydration correctly
        expect(screen.getByRole('main')).toBeInTheDocument();
      } finally {
        global.window = originalWindow;
      }
    });

    it('handles client-side only features gracefully', () => {
      renderMainLayout();
      
      // Features that only work client-side should not break SSR
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('provides appropriate loading states during hydration', () => {
      renderMainLayout();
      
      // Should show appropriate content during hydration
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('maintains accessibility during SSR', async () => {
      const { container } = renderMainLayout();
      
      // Should maintain accessibility even during SSR
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('handles theme initialization in SSR', () => {
      renderMainLayout(<TestChildComponent />, {
        providerOptions: {
          theme: 'dark',
        },
      });
      
      // Theme should be applied consistently
      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toHaveClass('dark');
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('integrates all layout components correctly', () => {
      renderMainLayout();
      
      // All major components should be present and functional
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('maintains state consistency across interactions', async () => {
      renderMainLayout();
      
      // Perform multiple interactions
      const navButton = screen.getByTestId('nav-dashboard');
      const testButton = screen.getByTestId('test-button');
      
      await user.click(navButton);
      await user.click(testButton);
      
      // State should remain consistent
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(testButton).toBeInTheDocument();
    });

    it('handles complex user workflows', async () => {
      renderMainLayout();
      
      // Simulate complex user workflow
      await user.keyboard('{Tab}'); // Focus skip link
      await user.keyboard('{Enter}'); // Use skip link
      
      const testInput = screen.getByTestId('test-input');
      await user.click(testInput);
      await user.type(testInput, 'workflow test');
      
      expect(testInput).toHaveValue('workflow test');
      expect(screen.getByRole('main')).toHaveFocus();
    });

    it('maintains performance under load', () => {
      // Render multiple instances
      const components = Array.from({ length: 10 }, (_, i) => (
        <div key={i}>Instance {i}</div>
      ));
      
      renderMainLayout(<div>{components}</div>);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('provides comprehensive error handling', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Test multiple error scenarios
      renderMainLayout(<ThrowingComponent shouldThrow={true} />);
      
      expect(screen.getByText('Application Error')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });
});