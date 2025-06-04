'use client';

import { useMemo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

// Navigation types and interfaces
interface NavItem {
  path: string;
  route: string;
  icon?: string;
  subRoutes?: NavItem[];
  serviceGroups?: string[];
}

interface NavigationState {
  items: NavItem[];
  activeItem: NavItem | null;
  expandedItems: Set<string>;
}

interface NavigationHookReturn {
  navigationItems: NavItem[];
  activeItem: NavItem | null;
  isActiveRoute: (path: string) => boolean;
  toggleExpanded: (path: string) => void;
  isExpanded: (path: string) => boolean;
  handleNavigationClick: (path: string) => void;
  clearErrors: () => void;
}

// Core navigation configuration based on Angular route structure
const BASE_ROUTES: NavItem[] = [
  {
    path: '/home',
    route: 'home',
    icon: 'assets/img/nav/home.svg',
  },
  {
    path: '/admin-settings',
    route: 'admin-settings',
    icon: 'assets/img/nav/admin-settings.svg',
    subRoutes: [
      { path: '/admin-settings/users', route: 'users' },
      { path: '/admin-settings/admins', route: 'admins' },
      { path: '/admin-settings/roles', route: 'roles' },
      { path: '/admin-settings/apps', route: 'apps' },
    ],
  },
  {
    path: '/api-connections',
    route: 'api-connections',
    icon: 'assets/img/nav/api-connections.svg',
    subRoutes: [
      { path: '/api-connections/database', route: 'database' },
      { path: '/api-connections/scripting', route: 'scripting' },
      { path: '/api-connections/network', route: 'network' },
      { path: '/api-connections/file', route: 'file' },
      { path: '/api-connections/utility', route: 'utility' },
      { path: '/api-connections/authentication', route: 'authentication' },
      { path: '/api-connections/df-platform-apis', route: 'df-platform-apis' },
    ],
  },
  {
    path: '/api-security',
    route: 'api-security',
    icon: 'assets/img/nav/api-security.svg',
    subRoutes: [
      { path: '/api-security/roles', route: 'roles' },
      { path: '/api-security/limits', route: 'limits' },
    ],
  },
  {
    path: '/system-settings',
    route: 'system-settings',
    icon: 'assets/img/nav/system-settings.svg',
    subRoutes: [
      { path: '/system-settings/cors', route: 'cors' },
      { path: '/system-settings/cache', route: 'cache' },
      { path: '/system-settings/email-templates', route: 'email-templates' },
      { path: '/system-settings/lookup-keys', route: 'lookup-keys' },
      { path: '/system-settings/scheduler', route: 'scheduler' },
      { path: '/system-settings/system-info', route: 'system-info' },
    ],
  },
];

// Routes to filter from navigation based on Angular implementation
const FILTERED_ROUTES = [
  'create',
  'import', 
  'edit',
  'auth',
  'profile',
  'view',
  'error',
  'license-expired',
];

/**
 * Custom React hook for managing navigation state, route filtering, and user interactions.
 * Replaces Angular route transformation and access control logic with React patterns.
 * 
 * Features:
 * - Dynamic route filtering based on user permissions and RBAC
 * - Active route detection using Next.js usePathname with startsWith matching
 * - Hierarchical navigation structure with expansion state management
 * - Error state clearing on navigation clicks
 * - Integration with authentication state for permission-based filtering
 * - Optimized with useMemo for performance
 */
export function useNavigation(): NavigationHookReturn {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Permission-based route filtering with useMemo optimization
  const accessibleRoutes = useMemo(() => {
    if (!isAuthenticated || !user) {
      return [];
    }

    // Root admin has access to all routes
    if (user.isRootAdmin) {
      return BASE_ROUTES;
    }

    // System admin access logic
    if (user.isSysAdmin) {
      if (!user.roleId && !user.id && !user.role_id) {
        return BASE_ROUTES;
      }
      // For sys admin with role restrictions, get from restrictedAccess
      return filterRoutesByTabs(BASE_ROUTES, user.accessibleTabs || []);
    }

    // Regular user with role-based access
    if (user.roleId || user.id || user.role_id) {
      const defaultTabs = [
        'apps',
        'users', 
        'services',
        'apidocs',
        'schema/data',
        'files',
        'scripts',
        'systemInfo',
        'limits',
        'scheduler',
      ];
      return filterRoutesByTabs(BASE_ROUTES, user.accessibleTabs || defaultTabs);
    }

    return [];
  }, [isAuthenticated, user]);

  // Active route detection using Next.js usePathname
  const activeItem = useMemo(() => {
    if (!pathname) return null;

    // Find the most specific matching route
    let matchedItem: NavItem | null = null;
    let longestMatch = 0;

    const findActiveRoute = (routes: NavItem[]): void => {
      routes.forEach(route => {
        if (pathname.startsWith(route.path) && route.path.length > longestMatch) {
          matchedItem = route;
          longestMatch = route.path.length;
        }
        if (route.subRoutes) {
          findActiveRoute(route.subRoutes);
        }
      });
    };

    findActiveRoute(accessibleRoutes);
    return matchedItem;
  }, [pathname, accessibleRoutes]);

  // Manage expanded state for navigation items
  const [expandedItems, setExpandedItems] = useMemo(() => {
    const expanded = new Set<string>();
    
    // Auto-expand parent of active route
    if (activeItem) {
      const parentRoute = accessibleRoutes.find(route => 
        route.subRoutes?.some(sub => sub.path === activeItem.path)
      );
      if (parentRoute) {
        expanded.add(parentRoute.path);
      }
    }

    return [expanded, (newExpanded: Set<string>) => setExpandedItems(newExpanded)];
  }, [activeItem, accessibleRoutes]);

  // Check if a route is currently active
  const isActiveRoute = useCallback((path: string): boolean => {
    return pathname?.startsWith(path) || false;
  }, [pathname]);

  // Toggle expansion state for navigation items
  const toggleExpanded = useCallback((path: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedItems(newExpanded);
  }, [expandedItems]);

  // Check if an item is expanded
  const isExpanded = useCallback((path: string): boolean => {
    return expandedItems.has(path);
  }, [expandedItems]);

  // Handle navigation clicks with error clearing
  const handleNavigationClick = useCallback((path: string) => {
    // Clear any existing errors before navigation
    clearErrors();
    
    // Navigate to the new route
    router.push(path);
  }, [router]);

  // Clear error state (placeholder for error handling integration)
  const clearErrors = useCallback(() => {
    // This would integrate with the error handling system
    // For now, this is a placeholder for the error clearing logic
    console.log('Clearing navigation errors');
  }, []);

  return {
    navigationItems: accessibleRoutes,
    activeItem,
    isActiveRoute,
    toggleExpanded,
    isExpanded,
    handleNavigationClick,
    clearErrors,
  };
}

/**
 * Filter routes based on user accessible tabs/permissions
 * Replicates Angular accessibleRoutes logic with React patterns
 */
function filterRoutesByTabs(routes: NavItem[], allowedTabs: string[]): NavItem[] {
  const allowedRoutes = new Set(['system-info']); // Always allowed

  // Map tabs to specific routes based on Angular logic
  allowedTabs.forEach(tab => {
    switch (tab) {
      case 'apps':
        allowedRoutes.add('api-keys');
        break;
      case 'users':
        allowedRoutes.add('users');
        allowedRoutes.add('admins');
        break;
      case 'services':
        allowedRoutes.add('database');
        allowedRoutes.add('scripting');
        allowedRoutes.add('network');
        allowedRoutes.add('file');
        allowedRoutes.add('utility');
        allowedRoutes.add('authentication');
        allowedRoutes.add('df-platform-apis');
        break;
      case 'apidocs':
        allowedRoutes.add('api-docs');
        break;
      case 'schema/data':
        allowedRoutes.add('schema');
        break;
      case 'files':
        allowedRoutes.add('files');
        break;
      case 'scripts':
        allowedRoutes.add('event-scripts');
        break;
      case 'config':
        allowedRoutes.add('cors');
        allowedRoutes.add('cache');
        allowedRoutes.add('email-templates');
        allowedRoutes.add('lookup-keys');
        break;
      case 'limits':
        allowedRoutes.add('limits');
        break;
      case 'scheduler':
        allowedRoutes.add('scheduler');
        break;
    }
  });

  return routes.filter(route => {
    if (route.subRoutes) {
      // Filter sub-routes and keep parent if any sub-routes remain
      const filteredSubRoutes = route.subRoutes.filter(subRoute =>
        allowedRoutes.has(subRoute.route)
      );
      
      if (filteredSubRoutes.length > 0) {
        route.subRoutes = filteredSubRoutes;
        return true;
      }
      return false;
    }
    
    return allowedRoutes.has(route.route);
  });
}

export default useNavigation;