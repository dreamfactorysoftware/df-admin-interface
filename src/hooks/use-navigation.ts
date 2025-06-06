'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import type { 
  NavigationItem, 
  BreadcrumbItem, 
  NavigationState, 
  UseNavigationReturn,
  RouteMetadata 
} from '@/types/navigation';

/**
 * Navigation query keys for React Query caching
 */
const NAVIGATION_QUERY_KEYS = {
  items: ['navigation', 'items'] as const,
  permissions: ['navigation', 'permissions'] as const,
  metadata: ['navigation', 'metadata'] as const,
} as const;

/**
 * Route metadata for dynamic breadcrumb generation
 */
const ROUTE_METADATA: Record<string, RouteMetadata> = {
  '/': {
    path: '/',
    title: 'Dashboard',
    permissions: [],
    showInNavigation: true,
  },
  '/api-connections': {
    path: '/api-connections',
    title: 'API Connections',
    permissions: ['api-connections.read'],
    showInNavigation: true,
  },
  '/api-connections/database': {
    path: '/api-connections/database',
    title: 'Database Services',
    parent: '/api-connections',
    permissions: ['database-services.read'],
    showInNavigation: true,
  },
  '/api-connections/database/create': {
    path: '/api-connections/database/create',
    title: 'Create Database Service',
    parent: '/api-connections/database',
    permissions: ['database-services.create'],
    showInNavigation: false,
  },
  '/api-security': {
    path: '/api-security',
    title: 'API Security',
    permissions: ['api-security.read'],
    showInNavigation: true,
  },
  '/api-security/roles': {
    path: '/api-security/roles',
    title: 'Roles',
    parent: '/api-security',
    permissions: ['roles.read'],
    showInNavigation: true,
  },
  '/api-security/limits': {
    path: '/api-security/limits',
    title: 'Limits',
    parent: '/api-security',
    permissions: ['limits.read'],
    showInNavigation: true,
  },
  '/admin-settings': {
    path: '/admin-settings',
    title: 'Admin Settings',
    permissions: ['admin.read'],
    showInNavigation: true,
  },
  '/admin-settings/admins': {
    path: '/admin-settings/admins',
    title: 'Administrators',
    parent: '/admin-settings',
    permissions: ['admins.read'],
    showInNavigation: true,
  },
  '/admin-settings/users': {
    path: '/admin-settings/users',
    title: 'Users',
    parent: '/admin-settings',
    permissions: ['users.read'],
    showInNavigation: true,
  },
  '/system-settings': {
    path: '/system-settings',
    title: 'System Settings',
    permissions: ['system.read'],
    showInNavigation: true,
  },
  '/system-settings/system-info': {
    path: '/system-settings/system-info',
    title: 'System Info',
    parent: '/system-settings',
    permissions: ['config.read'],
    showInNavigation: true,
  },
  '/system-settings/email-templates': {
    path: '/system-settings/email-templates',
    title: 'Email Templates',
    parent: '/system-settings',
    permissions: ['email-templates.read'],
    showInNavigation: true,
  },
  '/system-settings/cors': {
    path: '/system-settings/cors',
    title: 'CORS Settings',
    parent: '/system-settings',
    permissions: ['cors.read'],
    showInNavigation: true,
  },
  '/system-settings/cache': {
    path: '/system-settings/cache',
    title: 'Cache Management',
    parent: '/system-settings',
    permissions: ['cache.read'],
    showInNavigation: true,
  },
  '/system-settings/scheduler': {
    path: '/system-settings/scheduler',
    title: 'Task Scheduler',
    parent: '/system-settings',
    permissions: ['scheduler.read'],
    showInNavigation: true,
  },
  '/system-settings/reports': {
    path: '/system-settings/reports',
    title: 'System Reports',
    parent: '/system-settings',
    permissions: ['reports.read'],
    showInNavigation: true,
  },
  '/system-settings/lookup-keys': {
    path: '/system-settings/lookup-keys',
    title: 'Lookup Keys',
    parent: '/system-settings',
    permissions: ['lookup-keys.read'],
    showInNavigation: true,
  },
  '/files': {
    path: '/files',
    title: 'File Manager',
    permissions: ['files.read'],
    showInNavigation: true,
  },
  '/api-docs': {
    path: '/api-docs',
    title: 'API Documentation',
    permissions: ['api-docs.read'],
    showInNavigation: true,
  },
  '/logs': {
    path: '/logs',
    title: 'System Logs',
    permissions: ['logs.read'],
    showInNavigation: true,
  },
  '/profile': {
    path: '/profile',
    title: 'Profile Settings',
    permissions: [],
    showInNavigation: false,
  },
  '/login': {
    path: '/login',
    title: 'Sign In',
    permissions: [],
    showInNavigation: false,
  },
  '/unauthorized': {
    path: '/unauthorized',
    title: 'Access Denied',
    permissions: [],
    showInNavigation: false,
  },
};

/**
 * API function to fetch navigation items from server
 * In a real implementation, this would fetch from the DreamFactory API
 */
async function fetchNavigationItems(): Promise<NavigationItem[]> {
  // This would typically make an API call to fetch navigation structure
  // For now, return empty array as navigation is statically defined in the sidebar
  return [];
}

/**
 * Custom hook for navigation management with React Query caching
 * 
 * Provides:
 * - Permission-based navigation filtering
 * - Active route detection with Next.js usePathname
 * - Dynamic breadcrumb generation from route hierarchy
 * - Search functionality for navigation items
 * - React Query caching for performance optimization
 * 
 * @param options Configuration options for navigation behavior
 * @returns Navigation state and utility functions
 */
export function useNavigation(): UseNavigationReturn {
  const pathname = usePathname();
  const { user, hasPermission, isAuthenticated } = useAuth();
  
  // Local state for navigation management
  const [navigationState, setNavigationState] = useState<NavigationState>({
    expandedItems: [],
    filteredItems: [],
  });

  // Query for server-sourced navigation items (future enhancement)
  const navigationQuery = useQuery({
    queryKey: NAVIGATION_QUERY_KEYS.items,
    queryFn: fetchNavigationItems,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  /**
   * Check if user has permission to view a navigation item
   */
  const hasPermissionForItem = useCallback((item: NavigationItem): boolean => {
    if (!isAuthenticated) return false;
    if (item.permissions.length === 0) return true;
    return item.permissions.some(permission => hasPermission(permission));
  }, [isAuthenticated, hasPermission]);

  /**
   * Get navigation item by path
   */
  const getItemByPath = useCallback((path: string): NavigationItem | undefined => {
    // This would traverse the full navigation tree to find an item by path
    // For now, return undefined as this is mainly used for server-sourced navigation
    return undefined;
  }, []);

  /**
   * Get parent navigation item by child item ID
   */
  const getParentItem = useCallback((itemId: string): NavigationItem | undefined => {
    // This would traverse the navigation tree to find parent items
    // Implementation depends on the full navigation structure
    return undefined;
  }, []);

  /**
   * Toggle expansion state for navigation group
   */
  const toggleItemExpansion = useCallback((itemId: string): void => {
    setNavigationState(prev => ({
      ...prev,
      expandedItems: prev.expandedItems.includes(itemId)
        ? prev.expandedItems.filter(id => id !== itemId)
        : [...prev.expandedItems, itemId],
    }));
  }, []);

  /**
   * Search navigation items by query
   */
  const searchItems = useCallback((query: string): NavigationItem[] => {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return navigationState.filteredItems;

    return navigationState.filteredItems.filter(item => {
      // Search in item label and description
      const matchesLabel = item.label.toLowerCase().includes(searchTerm);
      const matchesDescription = item.description?.toLowerCase().includes(searchTerm);
      
      // Also search in children
      const hasMatchingChild = item.children?.some(child => 
        child.label.toLowerCase().includes(searchTerm) ||
        child.description?.toLowerCase().includes(searchTerm)
      );

      return matchesLabel || matchesDescription || hasMatchingChild;
    });
  }, [navigationState.filteredItems]);

  /**
   * Generate breadcrumbs from current pathname
   */
  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbItems: BreadcrumbItem[] = [];

    // Always include home
    breadcrumbItems.push({
      label: 'Dashboard',
      href: '/',
      current: pathname === '/',
    });

    // Build breadcrumbs from path segments
    let currentPath = '';
    for (const segment of pathSegments) {
      currentPath += `/${segment}`;
      const metadata = ROUTE_METADATA[currentPath];
      
      if (metadata && hasPermission) {
        // Check if user has permission for this route
        const hasRoutePermission = metadata.permissions.length === 0 || 
          metadata.permissions.some(permission => hasPermission(permission));
        
        if (hasRoutePermission) {
          breadcrumbItems.push({
            label: metadata.title,
            href: currentPath,
            current: currentPath === pathname,
          });
        }
      }
    }

    return breadcrumbItems;
  }, [pathname, hasPermission]);

  /**
   * Get currently active navigation item based on pathname
   */
  const activeItem = useMemo((): NavigationItem | undefined => {
    const metadata = ROUTE_METADATA[pathname];
    if (!metadata) return undefined;

    // Convert route metadata to navigation item format
    return {
      id: pathname,
      label: metadata.title,
      href: pathname,
      icon: () => null, // Would need to map from metadata
      permissions: metadata.permissions,
      description: `Navigate to ${metadata.title}`,
      isActive: true,
    };
  }, [pathname]);

  /**
   * All navigation items (currently empty as using static sidebar navigation)
   */
  const navigationItems = useMemo((): NavigationItem[] => {
    return navigationQuery.data || [];
  }, [navigationQuery.data]);

  /**
   * Filtered navigation items based on user permissions
   */
  const filteredNavigationItems = useMemo((): NavigationItem[] => {
    if (!isAuthenticated) return [];

    const filterItems = (items: NavigationItem[]): NavigationItem[] => {
      return items
        .filter(hasPermissionForItem)
        .map(item => ({
          ...item,
          children: item.children ? filterItems(item.children) : undefined,
        }))
        .filter(item => item.href || (item.children && item.children.length > 0));
    };

    return filterItems(navigationItems);
  }, [navigationItems, isAuthenticated, hasPermissionForItem]);

  // Update local state when filtered items change
  useEffect(() => {
    setNavigationState(prev => ({
      ...prev,
      filteredItems: filteredNavigationItems,
    }));
  }, [filteredNavigationItems]);

  // Update active item ID when pathname changes
  useEffect(() => {
    setNavigationState(prev => ({
      ...prev,
      activeItemId: pathname,
    }));
  }, [pathname]);

  return {
    navigationItems,
    filteredNavigationItems,
    activeItem,
    breadcrumbs,
    isLoading: navigationQuery.isLoading,
    error: navigationQuery.error as Error | undefined,
    hasPermissionForItem,
    getItemByPath,
    getParentItem,
    toggleItemExpansion,
    searchItems,
  };
}

/**
 * Hook for getting route metadata by path
 */
export function useRouteMetadata(path?: string): RouteMetadata | undefined {
  const pathname = usePathname();
  const targetPath = path || pathname;
  
  return useMemo(() => {
    return ROUTE_METADATA[targetPath];
  }, [targetPath]);
}

/**
 * Hook for checking if current route requires specific permissions
 */
export function useRoutePermissions(): {
  requiredPermissions: string[];
  hasAccess: boolean;
  isLoading: boolean;
} {
  const pathname = usePathname();
  const { hasPermission, isLoading: authLoading } = useAuth();
  
  const metadata = ROUTE_METADATA[pathname];
  
  const requiredPermissions = metadata?.permissions || [];
  const hasAccess = useMemo(() => {
    if (requiredPermissions.length === 0) return true;
    return requiredPermissions.some(permission => hasPermission(permission));
  }, [requiredPermissions, hasPermission]);

  return {
    requiredPermissions,
    hasAccess,
    isLoading: authLoading,
  };
}

/**
 * Hook for managing mobile navigation state
 */
export function useMobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  const openMenu = useCallback(() => setIsOpen(true), []);
  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setCurrentLevel(0);
    setNavigationHistory([]);
  }, []);

  const navigateToLevel = useCallback((level: number, itemId?: string) => {
    setCurrentLevel(level);
    if (itemId) {
      setNavigationHistory(prev => [...prev, itemId]);
    }
  }, []);

  const navigateBack = useCallback(() => {
    setCurrentLevel(prev => Math.max(0, prev - 1));
    setNavigationHistory(prev => prev.slice(0, -1));
  }, []);

  return {
    isOpen,
    currentLevel,
    navigationHistory,
    openMenu,
    closeMenu,
    navigateToLevel,
    navigateBack,
  };
}

export default useNavigation;