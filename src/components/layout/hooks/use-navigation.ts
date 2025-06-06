'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useAppStore } from '@/stores/app-store';
import type { 
  NavigationItem, 
  UseNavigationReturn, 
  BreadcrumbItem,
  NavigationState 
} from '@/types/navigation';
import {
  HomeIcon,
  DatabaseIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CogIcon,
  DocumentTextIcon,
  FolderIcon,
  UserIcon,
  ChartBarIcon,
  KeyIcon,
  BeakerIcon,
  ServerIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  ClockIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

const NAVIGATION_QUERY_KEYS = {
  navigationItems: ['navigation', 'items'] as const,
  filteredItems: ['navigation', 'filtered'] as const,
} as const;

/**
 * Base navigation structure with permission requirements
 * Defines the complete navigation hierarchy for the application
 */
const BASE_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: HomeIcon,
    description: 'System overview and quick actions',
    permissions: ['dashboard.read'],
    children: [],
  },
  {
    id: 'api-connections',
    label: 'API Connections',
    icon: DatabaseIcon,
    description: 'Manage database connections and services',
    permissions: ['api-connections.read'],
    children: [
      {
        id: 'database-services',
        label: 'Database Services',
        href: '/api-connections/database',
        icon: ServerIcon,
        description: 'Configure database API services',
        permissions: ['database-services.read'],
        children: [],
      },
    ],
  },
  {
    id: 'api-security',
    label: 'API Security',
    icon: ShieldCheckIcon,
    description: 'Configure API security and access control',
    permissions: ['api-security.read'],
    children: [
      {
        id: 'roles',
        label: 'Roles',
        href: '/api-security/roles',
        icon: UserGroupIcon,
        description: 'Manage user roles and permissions',
        permissions: ['roles.read'],
        children: [],
      },
      {
        id: 'limits',
        label: 'API Limits',
        href: '/api-security/limits',
        icon: BeakerIcon,
        description: 'Configure API rate limits',
        permissions: ['limits.read'],
        children: [],
      },
    ],
  },
  {
    id: 'admin-settings',
    label: 'Admin Settings',
    icon: CogIcon,
    description: 'Application administration settings',
    permissions: ['admin.read'],
    children: [
      {
        id: 'admins',
        label: 'Administrators',
        href: '/admin-settings/admins',
        icon: UserIcon,
        description: 'Manage system administrators',
        permissions: ['admins.read'],
        children: [],
      },
      {
        id: 'users',
        label: 'Users',
        href: '/admin-settings/users',
        icon: UserGroupIcon,
        description: 'Manage application users',
        permissions: ['users.read'],
        children: [],
      },
    ],
  },
  {
    id: 'system-settings',
    label: 'System Settings',
    icon: CogIcon,
    description: 'Global system configuration',
    permissions: ['system.read'],
    children: [
      {
        id: 'system-config',
        label: 'Configuration',
        href: '/system-settings/config',
        icon: CogIcon,
        description: 'System configuration settings',
        permissions: ['config.read'],
        children: [],
      },
      {
        id: 'email-templates',
        label: 'Email Templates',
        href: '/system-settings/email-templates',
        icon: EnvelopeIcon,
        description: 'Manage email templates',
        permissions: ['email-templates.read'],
        children: [],
      },
      {
        id: 'cors',
        label: 'CORS Settings',
        href: '/system-settings/cors',
        icon: GlobeAltIcon,
        description: 'Configure CORS policies',
        permissions: ['cors.read'],
        children: [],
      },
      {
        id: 'cache',
        label: 'Cache Settings',
        href: '/system-settings/cache',
        icon: DatabaseIcon,
        description: 'Manage cache configuration',
        permissions: ['cache.read'],
        children: [],
      },
      {
        id: 'scheduler',
        label: 'Scheduler',
        href: '/system-settings/scheduler',
        icon: ClockIcon,
        description: 'Manage scheduled tasks',
        permissions: ['scheduler.read'],
        children: [],
      },
      {
        id: 'reports',
        label: 'Reports',
        href: '/system-settings/reports',
        icon: ChartBarIcon,
        description: 'System reports and analytics',
        permissions: ['reports.read'],
        children: [],
      },
      {
        id: 'lookup-keys',
        label: 'Lookup Keys',
        href: '/system-settings/lookup-keys',
        icon: KeyIcon,
        description: 'Manage global lookup keys',
        permissions: ['lookup-keys.read'],
        children: [],
      },
    ],
  },
  {
    id: 'files',
    label: 'File Management',
    href: '/files',
    icon: FolderIcon,
    description: 'Manage files and logs',
    permissions: ['files.read'],
    children: [],
  },
  {
    id: 'api-docs',
    label: 'API Documentation',
    href: '/api-docs',
    icon: DocumentTextIcon,
    description: 'Interactive API documentation',
    permissions: ['api-docs.read'],
    children: [],
  },
  {
    id: 'logs',
    label: 'System Logs',
    href: '/logs',
    icon: BookOpenIcon,
    description: 'View system logs and debugging information',
    permissions: ['logs.read'],
    children: [],
  },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Checks if a path matches the current pathname using startsWith logic
 * Supports both exact matches and prefix matching for nested routes
 */
function isPathActive(currentPath: string, itemPath: string): boolean {
  if (itemPath === '/') {
    return currentPath === '/';
  }
  return currentPath.startsWith(itemPath);
}

/**
 * Recursively filters navigation items based on user permissions
 * Removes items that the user doesn't have permission to access
 */
function filterNavigationByPermissions(
  items: NavigationItem[],
  permissions: string[]
): NavigationItem[] {
  return items
    .filter((item) => {
      // Check if user has at least one required permission for this item
      return item.permissions.length === 0 || 
             item.permissions.some(permission => permissions.includes(permission));
    })
    .map((item) => ({
      ...item,
      children: item.children ? filterNavigationByPermissions(item.children, permissions) : [],
    }))
    .filter((item) => {
      // Remove parent items that have no accessible children and no direct href
      if (!item.href && item.children && item.children.length === 0) {
        return false;
      }
      return true;
    });
}

/**
 * Recursively updates navigation items with active states
 * Sets isActive and hasActiveChild properties based on current path
 */
function updateNavigationActiveStates(
  items: NavigationItem[],
  currentPath: string
): NavigationItem[] {
  return items.map((item) => {
    const isActive = item.href ? isPathActive(currentPath, item.href) : false;
    const updatedChildren = item.children 
      ? updateNavigationActiveStates(item.children, currentPath)
      : [];
    
    const hasActiveChild = updatedChildren.some(
      child => child.isActive || child.hasActiveChild
    );

    return {
      ...item,
      isActive,
      hasActiveChild,
      children: updatedChildren,
    };
  });
}

/**
 * Finds a navigation item by its path
 * Recursively searches through the navigation hierarchy
 */
function findNavigationItemByPath(
  items: NavigationItem[],
  path: string
): NavigationItem | undefined {
  for (const item of items) {
    if (item.href === path) {
      return item;
    }
    if (item.children) {
      const found = findNavigationItemByPath(item.children, path);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

/**
 * Finds the parent navigation item for a given item ID
 * Recursively searches through the navigation hierarchy
 */
function findParentNavigationItem(
  items: NavigationItem[],
  targetId: string,
  parent?: NavigationItem
): NavigationItem | undefined {
  for (const item of items) {
    if (item.id === targetId) {
      return parent;
    }
    if (item.children) {
      const found = findParentNavigationItem(item.children, targetId, item);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

/**
 * Generates breadcrumb trail for the current path
 * Creates hierarchical breadcrumb based on navigation structure
 */
function generateBreadcrumbs(
  items: NavigationItem[],
  currentPath: string
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];
  
  function buildBreadcrumbPath(
    navItems: NavigationItem[],
    path: string,
    currentBreadcrumbs: BreadcrumbItem[]
  ): boolean {
    for (const item of navItems) {
      const newBreadcrumbs = [
        ...currentBreadcrumbs,
        {
          label: item.label,
          href: item.href,
          icon: item.icon,
          current: false,
        },
      ];

      if (item.href === path) {
        // Found the target path, mark as current
        newBreadcrumbs[newBreadcrumbs.length - 1].current = true;
        breadcrumbs.push(...newBreadcrumbs);
        return true;
      }

      if (item.children && path.startsWith(item.href || '')) {
        // Continue searching in children
        if (buildBreadcrumbPath(item.children, path, newBreadcrumbs)) {
          return true;
        }
      }
    }
    return false;
  }

  buildBreadcrumbPath(items, currentPath, []);
  return breadcrumbs;
}

/**
 * Searches navigation items by query string
 * Performs case-insensitive search on labels and descriptions
 */
function searchNavigationItems(
  items: NavigationItem[],
  query: string
): NavigationItem[] {
  if (!query.trim()) {
    return items;
  }

  const searchTerm = query.toLowerCase();
  const results: NavigationItem[] = [];

  function searchRecursive(navItems: NavigationItem[]): void {
    for (const item of navItems) {
      const matchesLabel = item.label.toLowerCase().includes(searchTerm);
      const matchesDescription = item.description?.toLowerCase().includes(searchTerm);
      
      if (matchesLabel || matchesDescription) {
        results.push(item);
      }

      if (item.children) {
        searchRecursive(item.children);
      }
    }
  }

  searchRecursive(items);
  return results;
}

// =============================================================================
// MAIN NAVIGATION HOOK
// =============================================================================

/**
 * Custom React hook for managing navigation state, route filtering, and menu generation
 * 
 * Provides comprehensive navigation management including:
 * - Dynamic route filtering based on user permissions and RBAC
 * - Active route detection using Next.js usePathname with startsWith matching
 * - Hierarchical navigation menu generation with expansion states
 * - Integration with authentication state for permission-based filtering
 * - Error state clearing on navigation with proper route handling
 * - Breadcrumb generation and navigation search capabilities
 * 
 * Replaces Angular route transformation and access control logic with
 * React patterns and Next.js router integration.
 */
export function useNavigation(): UseNavigationReturn {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, permissions, isLoading: authLoading } = useAuth();
  const { clearError } = useAppStore();

  // Local navigation state management
  const [navigationState, setNavigationState] = useState<NavigationState>({
    expandedItems: [],
    searchQuery: '',
    filteredItems: [],
  });

  // =============================================================================
  // NAVIGATION ITEMS QUERY WITH PERMISSION FILTERING
  // =============================================================================

  // Base navigation items query with React Query caching
  const navigationItemsQuery = useQuery({
    queryKey: NAVIGATION_QUERY_KEYS.navigationItems,
    queryFn: async (): Promise<NavigationItem[]> => {
      // Simulate API call for dynamic navigation items if needed
      // For now, return static navigation structure
      return BASE_NAVIGATION_ITEMS;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Filtered navigation items based on user permissions
  const filteredNavigationQuery = useQuery({
    queryKey: [...NAVIGATION_QUERY_KEYS.filteredItems, permissions],
    queryFn: async (): Promise<NavigationItem[]> => {
      const baseItems = navigationItemsQuery.data || [];
      
      if (!isAuthenticated) {
        // Return only public navigation items for unauthenticated users
        return baseItems.filter(item => 
          item.permissions.length === 0 || 
          item.permissions.includes('public')
        );
      }

      // Filter navigation based on user permissions
      return filterNavigationByPermissions(baseItems, permissions);
    },
    enabled: !!navigationItemsQuery.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  });

  // =============================================================================
  // COMPUTED NAVIGATION STATE
  // =============================================================================

  // Navigation items with active states
  const navigationItems = useMemo(() => {
    const items = filteredNavigationQuery.data || [];
    return updateNavigationActiveStates(items, pathname);
  }, [filteredNavigationQuery.data, pathname]);

  // Currently active navigation item
  const activeItem = useMemo(() => {
    return findNavigationItemByPath(navigationItems, pathname);
  }, [navigationItems, pathname]);

  // Breadcrumb trail for current path
  const breadcrumbs = useMemo(() => {
    return generateBreadcrumbs(navigationItems, pathname);
  }, [navigationItems, pathname]);

  // Search filtered navigation items
  const searchFilteredItems = useMemo(() => {
    if (!navigationState.searchQuery) {
      return navigationItems;
    }
    return searchNavigationItems(navigationItems, navigationState.searchQuery);
  }, [navigationItems, navigationState.searchQuery]);

  // Update local state when search results change
  useEffect(() => {
    setNavigationState(prev => ({
      ...prev,
      filteredItems: searchFilteredItems,
    }));
  }, [searchFilteredItems]);

  // =============================================================================
  // NAVIGATION ACTIONS
  // =============================================================================

  /**
   * Checks if user has permission for a specific navigation item
   */
  const hasPermissionForItem = useCallback((item: NavigationItem): boolean => {
    if (!isAuthenticated && item.permissions.length > 0) {
      return false;
    }
    
    return item.permissions.length === 0 || 
           item.permissions.some(permission => permissions.includes(permission));
  }, [isAuthenticated, permissions]);

  /**
   * Gets navigation item by path
   */
  const getItemByPath = useCallback((path: string): NavigationItem | undefined => {
    return findNavigationItemByPath(navigationItems, path);
  }, [navigationItems]);

  /**
   * Gets parent navigation item for a given item ID
   */
  const getParentItem = useCallback((itemId: string): NavigationItem | undefined => {
    return findParentNavigationItem(navigationItems, itemId);
  }, [navigationItems]);

  /**
   * Toggles expansion state for navigation group
   */
  const toggleItemExpansion = useCallback((itemId: string): void => {
    setNavigationState(prev => {
      const isExpanded = prev.expandedItems.includes(itemId);
      const expandedItems = isExpanded
        ? prev.expandedItems.filter(id => id !== itemId)
        : [...prev.expandedItems, itemId];

      return {
        ...prev,
        expandedItems,
      };
    });
  }, []);

  /**
   * Searches navigation items by query
   */
  const searchItems = useCallback((query: string): NavigationItem[] => {
    setNavigationState(prev => ({
      ...prev,
      searchQuery: query,
    }));
    
    return searchNavigationItems(navigationItems, query);
  }, [navigationItems]);

  /**
   * Handles navigation with error state clearing
   */
  const handleNavigation = useCallback((href: string): void => {
    // Clear any global error state before navigation
    clearError();
    
    // Navigate using Next.js router
    router.push(href);
  }, [router, clearError]);

  /**
   * Updates navigation state
   */
  const updateState = useCallback((updates: Partial<NavigationState>): void => {
    setNavigationState(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  /**
   * Resets navigation state to defaults
   */
  const resetState = useCallback((): void => {
    setNavigationState({
      expandedItems: [],
      searchQuery: '',
      filteredItems: navigationItems,
    });
  }, [navigationItems]);

  // =============================================================================
  // LOADING AND ERROR STATES
  // =============================================================================

  const isLoading = useMemo(() => {
    return authLoading || 
           navigationItemsQuery.isLoading || 
           filteredNavigationQuery.isLoading;
  }, [authLoading, navigationItemsQuery.isLoading, filteredNavigationQuery.isLoading]);

  const error = useMemo(() => {
    return navigationItemsQuery.error || filteredNavigationQuery.error;
  }, [navigationItemsQuery.error, filteredNavigationQuery.error]);

  // =============================================================================
  // RETURN INTERFACE
  // =============================================================================

  return {
    // Navigation data
    navigationItems,
    filteredNavigationItems: searchFilteredItems,
    activeItem,
    breadcrumbs,

    // Loading and error states
    isLoading,
    error: error as Error | undefined,

    // Navigation utilities
    hasPermissionForItem,
    getItemByPath,
    getParentItem,
    toggleItemExpansion,
    searchItems,

    // Enhanced navigation actions
    handleNavigation,
    state: navigationState,
    updateState,
    resetState,
  };
}

// =============================================================================
// EXPORT TYPES AND UTILITIES
// =============================================================================

export type UseNavigationHookReturn = ReturnType<typeof useNavigation>;

export {
  BASE_NAVIGATION_ITEMS,
  isPathActive,
  filterNavigationByPermissions,
  updateNavigationActiveStates,
  findNavigationItemByPath,
  findParentNavigationItem,
  generateBreadcrumbs,
  searchNavigationItems,
};

export default useNavigation;