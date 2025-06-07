/**
 * Test suite for Sidebar navigation component
 * 
 * Covers navigation item rendering, responsive behavior, permission-based filtering,
 * user interaction scenarios, and accessibility compliance validation.
 * 
 * Tests migration from Angular TestBed patterns to React Testing Library with:
 * - User event simulation replacing Angular click testing
 * - Next.js navigation mocking replacing Angular router testing
 * - Authentication context mocking for permission scenarios
 * - Responsive behavior testing for sidebar collapse/expand
 * - Accessibility testing including ARIA attributes and keyboard navigation
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar, defaultNavigationItems } from './sidebar';
import { useAppStore } from '@/stores/app-store';
import { useAuth } from '@/hooks/use-auth';
import { useNavigation } from '@/hooks/use-navigation';
import { axe, toHaveNoViolations } from 'jest-axe';

// =============================================================================
// MOCK SETUP AND CONFIGURATION
// =============================================================================

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

// Mock custom hooks
vi.mock('@/stores/app-store');
vi.mock('@/hooks/use-auth');
vi.mock('@/hooks/use-navigation');

// Mock Headless UI components for testing
vi.mock('@headlessui/react', () => ({
  Disclosure: {
    Button: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Panel: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  Transition: ({ children, show, ...props }: any) => 
    show ? <div {...props}>{children}</div> : null,
}));

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// =============================================================================
// TYPE DEFINITIONS FOR MOCKS
// =============================================================================

interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isRootAdmin: boolean;
  permissions: string[];
  roles: string[];
}

interface MockNavigationItem {
  id: string;
  path: string;
  label: string;
  icon?: any;
  subRoutes?: MockNavigationItem[];
  permissions?: string[];
  disabled?: boolean;
  isCommercialFeature?: boolean;
}

// =============================================================================
// MOCK DATA FACTORY FUNCTIONS
// =============================================================================

const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: '1',
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  isRootAdmin: false,
  permissions: ['read'],
  roles: ['user'],
  ...overrides,
});

const createMockNavigationItems = (): MockNavigationItem[] => [
  {
    id: 'dashboard',
    path: '/',
    label: 'Dashboard',
    icon: () => <div data-testid="dashboard-icon" />,
  },
  {
    id: 'api-connections',
    path: '/api-connections',
    label: 'API Connections',
    icon: () => <div data-testid="connections-icon" />,
    subRoutes: [
      {
        id: 'database-services',
        path: '/api-connections/database',
        label: 'Database Services',
        icon: () => <div data-testid="database-icon" />,
      },
    ],
  },
  {
    id: 'admin-settings',
    path: '/admin-settings',
    label: 'Admin Settings',
    icon: () => <div data-testid="admin-icon" />,
    permissions: ['admin'],
  },
  {
    id: 'system-settings',
    path: '/system-settings',
    label: 'System Settings',
    icon: () => <div data-testid="system-icon" />,
    permissions: ['system_admin'],
    subRoutes: [
      {
        id: 'system-info',
        path: '/system-settings/system-info',
        label: 'System Info',
      },
    ],
  },
  {
    id: 'commercial-feature',
    path: '/commercial',
    label: 'Commercial Feature',
    isCommercialFeature: true,
  },
  {
    id: 'disabled-feature',
    path: '/disabled',
    label: 'Disabled Feature',
    disabled: true,
  },
];

// =============================================================================
// MOCK IMPLEMENTATIONS
// =============================================================================

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

const createMockAppStore = (overrides: any = {}) => ({
  sidebarCollapsed: false,
  setSidebarCollapsed: vi.fn(),
  theme: 'light',
  setTheme: vi.fn(),
  ...overrides,
});

const createMockAuth = (user: MockUser | null = null, isAuthenticated = false) => ({
  user,
  isAuthenticated,
  isLoading: false,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
});

const createMockNavigation = (items: MockNavigationItem[] = []) => ({
  navigationItems: items,
  activeItem: null,
  setActiveItem: vi.fn(),
});

// =============================================================================
// TEST UTILITIES AND HELPERS
// =============================================================================

const renderSidebar = (options: {
  user?: MockUser | null;
  isAuthenticated?: boolean;
  sidebarCollapsed?: boolean;
  pathname?: string;
  navigationItems?: MockNavigationItem[];
} = {}) => {
  const {
    user = null,
    isAuthenticated = false,
    sidebarCollapsed = false,
    pathname = '/',
    navigationItems = createMockNavigationItems(),
  } = options;

  // Setup mocks
  (useRouter as Mock).mockReturnValue(mockRouter);
  (usePathname as Mock).mockReturnValue(pathname);
  (useAppStore as unknown as Mock).mockReturnValue(
    createMockAppStore({ sidebarCollapsed })
  );
  (useAuth as Mock).mockReturnValue(createMockAuth(user, isAuthenticated));
  (useNavigation as Mock).mockReturnValue(createMockNavigation(navigationItems));

  const user_event = userEvent.setup();

  return {
    user: user_event,
    ...render(<Sidebar />),
  };
};

// Utility to simulate responsive breakpoints
const mockViewport = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
};

// =============================================================================
// TEST SUITE: AUTHENTICATION AND UNAUTHENTICATED STATE
// =============================================================================

describe('Sidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window dimensions
    mockViewport(1024);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Unauthenticated State', () => {
    it('should render promotional content when user is not authenticated', () => {
      renderSidebar({ isAuthenticated: false });

      expect(screen.getByText('Self Hosted')).toBeInTheDocument();
      expect(screen.getByText('Database & Network')).toBeInTheDocument();
      expect(screen.getByText('API Generation')).toBeInTheDocument();
      expect(screen.getByText('API Security')).toBeInTheDocument();
      expect(screen.getByText('API Scripting')).toBeInTheDocument();
    });

    it('should display promotional images with correct alt text', () => {
      renderSidebar({ isAuthenticated: false });

      expect(screen.getByAltText('Self Hosted')).toBeInTheDocument();
      expect(screen.getByAltText('API Generation')).toBeInTheDocument();
      expect(screen.getByAltText('API Security')).toBeInTheDocument();
      expect(screen.getByAltText('API Scripting')).toBeInTheDocument();
    });

    it('should not render navigation menu when unauthenticated', () => {
      renderSidebar({ isAuthenticated: false });

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });
  });

  // =============================================================================
  // TEST SUITE: AUTHENTICATED STATE AND NAVIGATION RENDERING
  // =============================================================================

  describe('Authenticated State', () => {
    it('should render navigation menu when user is authenticated', () => {
      const user = createMockUser();
      renderSidebar({ user, isAuthenticated: true });

      expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('API Connections')).toBeInTheDocument();
    });

    it('should display DreamFactory logo and brand name', () => {
      const user = createMockUser();
      renderSidebar({ user, isAuthenticated: true });

      expect(screen.getByAltText('DreamFactory Logo')).toBeInTheDocument();
      expect(screen.getByText('DreamFactory')).toBeInTheDocument();
      expect(screen.getByLabelText('DreamFactory Admin Console')).toBeInTheDocument();
    });

    it('should render collapse toggle button for desktop', () => {
      const user = createMockUser();
      renderSidebar({ user, isAuthenticated: true });

      expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // TEST SUITE: PERMISSION-BASED MENU FILTERING
  // =============================================================================

  describe('Permission-based Menu Filtering', () => {
    it('should show all menu items for root admin', () => {
      const user = createMockUser({ isRootAdmin: true });
      renderSidebar({ user, isAuthenticated: true });

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('API Connections')).toBeInTheDocument();
      expect(screen.getByText('Admin Settings')).toBeInTheDocument();
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    it('should filter menu items based on user permissions', () => {
      const user = createMockUser({ 
        permissions: ['read', 'admin'], 
        isRootAdmin: false 
      });
      renderSidebar({ user, isAuthenticated: true });

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('API Connections')).toBeInTheDocument();
      expect(screen.getByText('Admin Settings')).toBeInTheDocument();
      expect(screen.queryByText('System Settings')).not.toBeInTheDocument();
    });

    it('should hide restricted menu items for limited permissions', () => {
      const user = createMockUser({ 
        permissions: ['read'], 
        isRootAdmin: false 
      });
      renderSidebar({ user, isAuthenticated: true });

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('API Connections')).toBeInTheDocument();
      expect(screen.queryByText('Admin Settings')).not.toBeInTheDocument();
      expect(screen.queryByText('System Settings')).not.toBeInTheDocument();
    });

    it('should show items without permission requirements to all users', () => {
      const user = createMockUser({ permissions: [], isRootAdmin: false });
      renderSidebar({ user, isAuthenticated: true });

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('API Connections')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // TEST SUITE: RESPONSIVE BEHAVIOR AND SIDEBAR COLLAPSE
  // =============================================================================

  describe('Responsive Behavior', () => {
    it('should render mobile close button on small screens', () => {
      mockViewport(768);
      const user = createMockUser();
      renderSidebar({ user, isAuthenticated: true });

      expect(screen.getByLabelText('Close sidebar')).toBeInTheDocument();
    });

    it('should hide mobile close button on large screens', () => {
      mockViewport(1200);
      const user = createMockUser();
      renderSidebar({ user, isAuthenticated: true });

      expect(screen.queryByLabelText('Close sidebar')).not.toBeInTheDocument();
    });

    it('should call setSidebarCollapsed when mobile close button is clicked', async () => {
      const mockSetSidebarCollapsed = vi.fn();
      (useAppStore as unknown as Mock).mockReturnValue(
        createMockAppStore({ setSidebarCollapsed: mockSetSidebarCollapsed })
      );

      mockViewport(768);
      const user = createMockUser();
      const { user: userEvent } = renderSidebar({ user, isAuthenticated: true });

      const closeButton = screen.getByLabelText('Close sidebar');
      await userEvent.click(closeButton);

      expect(mockSetSidebarCollapsed).toHaveBeenCalledWith(true);
    });

    it('should render overlay for mobile when sidebar is expanded', () => {
      mockViewport(768);
      const user = createMockUser();
      renderSidebar({ user, isAuthenticated: true, sidebarCollapsed: false });

      const overlay = document.querySelector('.fixed.inset-0.z-40.bg-black.bg-opacity-50');
      expect(overlay).toBeInTheDocument();
    });

    it('should not render overlay for desktop', () => {
      mockViewport(1200);
      const user = createMockUser();
      renderSidebar({ user, isAuthenticated: true, sidebarCollapsed: false });

      const overlay = document.querySelector('.fixed.inset-0.z-40.bg-black.bg-opacity-50');
      expect(overlay).not.toBeInTheDocument();
    });
  });

  describe('Sidebar Collapse Functionality', () => {
    it('should toggle sidebar collapse when desktop toggle is clicked', async () => {
      const mockSetSidebarCollapsed = vi.fn();
      (useAppStore as unknown as Mock).mockReturnValue(
        createMockAppStore({ 
          sidebarCollapsed: false, 
          setSidebarCollapsed: mockSetSidebarCollapsed 
        })
      );

      const user = createMockUser();
      const { user: userEvent } = renderSidebar({ user, isAuthenticated: true });

      const toggleButton = screen.getByLabelText('Collapse sidebar');
      await userEvent.click(toggleButton);

      expect(mockSetSidebarCollapsed).toHaveBeenCalledWith(true);
    });

    it('should display expand button when sidebar is collapsed', () => {
      const user = createMockUser();
      renderSidebar({ user, isAuthenticated: true, sidebarCollapsed: true });

      expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
    });

    it('should hide brand name when sidebar is collapsed', () => {
      const user = createMockUser();
      renderSidebar({ user, isAuthenticated: true, sidebarCollapsed: true });

      expect(screen.queryByText('DreamFactory')).not.toBeInTheDocument();
    });
  });

  // =============================================================================
  // TEST SUITE: NAVIGATION AND ROUTE HIGHLIGHTING
  // =============================================================================

  describe('Navigation and Route Highlighting', () => {
    it('should highlight active navigation item', () => {
      const user = createMockUser();
      renderSidebar({ user, isAuthenticated: true, pathname: '/api-connections' });

      const activeLink = screen.getByText('API Connections').closest('a');
      expect(activeLink).toHaveAttribute('aria-current', 'page');
    });

    it('should highlight parent item when child route is active', () => {
      const user = createMockUser();
      renderSidebar({ 
        user, 
        isAuthenticated: true, 
        pathname: '/api-connections/database' 
      });

      const parentButton = screen.getByText('API Connections').closest('button');
      expect(parentButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should auto-expand parent items with active children', () => {
      const user = createMockUser();
      renderSidebar({ 
        user, 
        isAuthenticated: true, 
        pathname: '/api-connections/database' 
      });

      expect(screen.getByText('Database Services')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // TEST SUITE: USER INTERACTION AND EVENT HANDLING
  // =============================================================================

  describe('User Interactions', () => {
    it('should expand collapsed navigation items when clicked', async () => {
      const user = createMockUser();
      const { user: userEvent } = renderSidebar({ 
        user, 
        isAuthenticated: true, 
        pathname: '/' 
      });

      const expandButton = screen.getByText('API Connections').closest('button');
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(expandButton!);
      expect(screen.getByText('Database Services')).toBeInTheDocument();
    });

    it('should collapse expanded navigation items when clicked again', async () => {
      const user = createMockUser();
      const { user: userEvent } = renderSidebar({ 
        user, 
        isAuthenticated: true, 
        pathname: '/api-connections/database' 
      });

      // Initially expanded due to active child
      expect(screen.getByText('Database Services')).toBeInTheDocument();

      const collapseButton = screen.getByText('API Connections').closest('button');
      await userEvent.click(collapseButton!);

      // Should be collapsed now
      await waitFor(() => {
        expect(screen.queryByText('Database Services')).not.toBeInTheDocument();
      });
    });

    it('should handle navigation link clicks', async () => {
      const user = createMockUser();
      const { user: userEvent } = renderSidebar({ user, isAuthenticated: true });

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveAttribute('href', '/');

      // Link should be navigable
      await userEvent.click(dashboardLink!);
      // Note: Next.js Link component handles navigation internally
    });

    it('should not allow interaction with disabled items', async () => {
      const navigationItems = createMockNavigationItems();
      const user = createMockUser();
      const { user: userEvent } = renderSidebar({ 
        user, 
        isAuthenticated: true, 
        navigationItems 
      });

      const disabledLink = screen.getByText('Disabled Feature').closest('a');
      expect(disabledLink).toHaveClass('pointer-events-none');
    });
  });

  // =============================================================================
  // TEST SUITE: KEYBOARD NAVIGATION AND ACCESSIBILITY
  // =============================================================================

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation through menu items', async () => {
      const user = createMockUser();
      const { user: userEvent } = renderSidebar({ user, isAuthenticated: true });

      const firstLink = screen.getByText('Dashboard').closest('a');
      firstLink?.focus();

      await userEvent.keyboard('{Tab}');
      expect(document.activeElement).toBe(
        screen.getByText('API Connections').closest('button')
      );
    });

    it('should support Enter key to activate navigation items', async () => {
      const user = createMockUser();
      const { user: userEvent } = renderSidebar({ user, isAuthenticated: true });

      const expandButton = screen.getByText('API Connections').closest('button');
      expandButton?.focus();

      await userEvent.keyboard('{Enter}');
      expect(screen.getByText('Database Services')).toBeInTheDocument();
    });

    it('should support Space key to activate expandable items', async () => {
      const user = createMockUser();
      const { user: userEvent } = renderSidebar({ user, isAuthenticated: true });

      const expandButton = screen.getByText('API Connections').closest('button');
      expandButton?.focus();

      await userEvent.keyboard(' ');
      expect(screen.getByText('Database Services')).toBeInTheDocument();
    });

    it('should manage focus correctly when expanding/collapsing items', async () => {
      const user = createMockUser();
      const { user: userEvent } = renderSidebar({ user, isAuthenticated: true });

      const expandButton = screen.getByText('API Connections').closest('button');
      await userEvent.click(expandButton!);

      // Focus should remain on the expand button
      expect(document.activeElement).toBe(expandButton);
    });
  });

  // =============================================================================
  // TEST SUITE: ACCESSIBILITY COMPLIANCE
  // =============================================================================

  describe('Accessibility Compliance', () => {
    it('should have proper ARIA labels and roles', () => {
      const user = createMockUser();
      renderSidebar({ user, isAuthenticated: true });

      expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
      expect(screen.getByLabelText('DreamFactory Admin Console')).toBeInTheDocument();
      expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();
    });

    it('should have proper ARIA expanded states for expandable items', () => {
      const user = createMockUser();
      renderSidebar({ user, isAuthenticated: true, pathname: '/api-connections/database' });

      const expandButton = screen.getByText('API Connections').closest('button');
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have proper ARIA current attributes for active items', () => {
      const user = createMockUser();
      renderSidebar({ user, isAuthenticated: true, pathname: '/api-connections' });

      const activeLink = screen.getByText('API Connections').closest('a');
      expect(activeLink).toHaveAttribute('aria-current', 'page');
    });

    it('should have proper menu item labels', () => {
      const user = createMockUser();
      renderSidebar({ user, isAuthenticated: true });

      const apiConnectionsButton = screen.getByLabelText('API Connections menu');
      expect(apiConnectionsButton).toBeInTheDocument();
    });

    it('should pass axe accessibility audit', async () => {
      const user = createMockUser();
      const { container } = renderSidebar({ user, isAuthenticated: true });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should provide proper tooltips for collapsed sidebar items', () => {
      const user = createMockUser();
      renderSidebar({ user, isAuthenticated: true, sidebarCollapsed: true });

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveAttribute('title', 'Dashboard');
    });
  });

  // =============================================================================
  // TEST SUITE: COMMERCIAL FEATURES AND SPECIAL STATES
  // =============================================================================

  describe('Commercial Features', () => {
    it('should display lock icon for commercial features', () => {
      const navigationItems = createMockNavigationItems();
      const user = createMockUser();
      renderSidebar({ user, isAuthenticated: true, navigationItems });

      // Commercial feature should have lock icon
      const commercialItem = screen.getByText('Commercial Feature');
      const lockIcon = commercialItem.parentElement?.querySelector('svg');
      expect(lockIcon).toBeInTheDocument();
    });

    it('should indicate commercial features in sub-navigation', () => {
      const commercialSubItem = {
        id: 'commercial-sub',
        path: '/commercial/sub',
        label: 'Commercial Sub Feature',
        isCommercialFeature: true,
      };

      const navigationWithCommercialSub = [
        {
          id: 'parent',
          path: '/parent',
          label: 'Parent Item',
          subRoutes: [commercialSubItem],
        },
      ];

      const user = createMockUser();
      renderSidebar({ 
        user, 
        isAuthenticated: true, 
        navigationItems: navigationWithCommercialSub,
        pathname: '/parent/sub' 
      });

      expect(screen.getByText('Commercial Sub Feature')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // TEST SUITE: ERROR HANDLING AND EDGE CASES
  // =============================================================================

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing navigation items gracefully', () => {
      const user = createMockUser();
      renderSidebar({ user, isAuthenticated: true, navigationItems: [] });

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });

    it('should handle null user gracefully', () => {
      renderSidebar({ user: null, isAuthenticated: false });

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
      expect(screen.getByText('Self Hosted')).toBeInTheDocument();
    });

    it('should handle undefined permissions array', () => {
      const user = createMockUser({ permissions: undefined as any });
      renderSidebar({ user, isAuthenticated: true });

      // Should still render basic navigation
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should handle mobile overlay click on mobile devices', async () => {
      const mockSetSidebarCollapsed = vi.fn();
      (useAppStore as unknown as Mock).mockReturnValue(
        createMockAppStore({ setSidebarCollapsed: mockSetSidebarCollapsed })
      );

      mockViewport(768);
      const user = createMockUser();
      const { user: userEvent } = renderSidebar({ 
        user, 
        isAuthenticated: true, 
        sidebarCollapsed: false 
      });

      const overlay = document.querySelector('.fixed.inset-0.z-40');
      await userEvent.click(overlay!);

      expect(mockSetSidebarCollapsed).toHaveBeenCalledWith(true);
    });
  });

  // =============================================================================
  // TEST SUITE: INTEGRATION WITH STORE AND CONTEXT
  // =============================================================================

  describe('Store and Context Integration', () => {
    it('should respond to app store state changes', () => {
      const user = createMockUser();
      const { rerender } = renderSidebar({ user, isAuthenticated: true });

      // Update store to collapsed state
      (useAppStore as unknown as Mock).mockReturnValue(
        createMockAppStore({ sidebarCollapsed: true })
      );

      rerender(<Sidebar />);
      expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
    });

    it('should respond to authentication state changes', () => {
      const { rerender } = renderSidebar({ isAuthenticated: false });

      expect(screen.getByText('Self Hosted')).toBeInTheDocument();

      // Change to authenticated
      const user = createMockUser();
      (useAuth as Mock).mockReturnValue(createMockAuth(user, true));

      rerender(<Sidebar />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should update navigation based on permission changes', () => {
      const user = createMockUser({ permissions: ['read'] });
      const { rerender } = renderSidebar({ user, isAuthenticated: true });

      expect(screen.queryByText('Admin Settings')).not.toBeInTheDocument();

      // Update user with admin permissions
      const adminUser = createMockUser({ permissions: ['read', 'admin'] });
      (useAuth as Mock).mockReturnValue(createMockAuth(adminUser, true));

      rerender(<Sidebar />);
      expect(screen.getByText('Admin Settings')).toBeInTheDocument();
    });
  });
});