/**
 * Next.js routing utilities for navigation hierarchy construction and breadcrumb generation.
 * 
 * This module provides utilities for working with Next.js App Router patterns, including:
 * - Route definition transformation for navigation structures
 * - Permission-based route filtering for role-based access control
 * - Breadcrumb generation from URL pathnames and route parameters
 * 
 * Key Features:
 * - Next.js App Router compatibility with file-based routing
 * - Dynamic route parameter handling with TypeScript safety
 * - Server-side rendering support for navigation generation
 * - Icon path resolution optimized for Next.js public asset serving
 * - Hierarchical navigation structure with nested route support
 */

import { ROUTES } from '../../types/routes';
import { Nav } from '../../types/nav';

/**
 * Next.js route definition interface for navigation generation
 * Supports dynamic routes, nested layouts, and server component patterns
 */
export interface NextRouteDefinition {
  /** Route path segment (e.g., 'users', '[id]', 'create') */
  path: string;
  /** Full pathname for navigation (e.g., '/api-connections/database/[service]') */
  pathname?: string;
  /** Nested child routes for hierarchical navigation */
  children?: NextRouteDefinition[];
  /** Route metadata for navigation display */
  metadata?: {
    title?: string;
    description?: string;
    icon?: string;
    requiresAuth?: boolean;
    roles?: string[];
  };
}

/**
 * Breadcrumb trail item for navigation hierarchy
 */
export interface Breadcrumb {
  /** Display label for the breadcrumb */
  label: string;
  /** Navigation path (undefined for current page) */
  path?: string;
  /** Internationalization key for translated labels */
  translationKey?: string;
  /** Whether this breadcrumb represents a dynamic parameter */
  isDynamic?: boolean;
}

/**
 * Routes excluded from main navigation display
 * These represent action routes, authentication flows, and error states
 */
const FILTERED_FROM_NAV = [
  ROUTES.CREATE,
  ROUTES.IMPORT,
  ROUTES.EDIT,
  ROUTES.AUTH,
  ROUTES.PROFILE,
  ROUTES.VIEW,
  ROUTES.ERROR,
  ROUTES.LICENSE_EXPIRED,
];

/**
 * Routes that have associated navigation icons
 * Icons are served from Next.js public directory at /nav/{route}.svg
 */
const NAV_ICONS = [
  'home',
  'admin-settings', 
  'api-connections',
  'api-security',
  'system-settings',
];

/**
 * Transforms Next.js route definitions into navigation structure
 * 
 * Filters out dynamic routes (containing []) and excluded navigation routes,
 * then builds hierarchical navigation with proper icon associations.
 * 
 * @param routes - Array of Next.js route definitions
 * @param root - Root path prefix for nested routes
 * @returns Array of navigation items suitable for UI rendering
 * 
 * @example
 * ```typescript
 * const routes = [
 *   { path: 'api-connections', children: [{ path: 'database' }] },
 *   { path: 'admin-settings' }
 * ];
 * const nav = transformRoutes(routes);
 * // Returns navigation items with icons and hierarchy
 * ```
 */
export function transformRoutes(
  routes: NextRouteDefinition[], 
  root = ''
): Array<Nav> {
  return routes
    .filter(route => 
      route.path &&
      !route.path.includes('[') && // Exclude dynamic routes like [id]
      !route.path.includes(']') && 
      !FILTERED_FROM_NAV.includes(route.path as ROUTES)
    )
    .map(route => {
      const fullPath = root ? `${root}/${route.path}` : `/${route.path}`;
      
      if (route.children) {
        const subRoutes = transformRoutes(route.children, fullPath);
        return {
          path: fullPath,
          subRoutes: subRoutes.length ? subRoutes : undefined,
          route: route.path as ROUTES,
          icon: getIconForRoute(route.path),
        };
      }
      
      return {
        path: fullPath,
        route: route.path as ROUTES,
        icon: getIconForRoute(route.path),
      };
    });
}

/**
 * Gets icon path for navigation route
 * 
 * Returns the appropriate SVG icon path for Next.js public asset serving.
 * Icons are located at /nav/{routeName}.svg in the public directory.
 * 
 * @param routeName - Route name to find icon for
 * @returns Icon path for Next.js Image component or empty string if no icon
 */
function getIconForRoute(routeName: string): string {
  if (NAV_ICONS.includes(routeName)) {
    return `/nav/${routeName}.svg`;
  }
  return '';
}

/**
 * Filters navigation routes based on user permissions
 * 
 * Implements role-based access control by filtering navigation items
 * according to user's allowed tabs and permissions. Maintains hierarchical
 * structure by preserving parent routes if any children are accessible.
 * 
 * @param navs - Navigation items to filter
 * @param allowedTabs - Array of tab permissions for current user
 * @returns Filtered navigation array respecting user permissions
 * 
 * @example
 * ```typescript
 * const userTabs = ['services', 'users', 'schema/data'];
 * const filteredNav = accessibleRoutes(navigationItems, userTabs);
 * // Returns only routes the user can access
 * ```
 */
export function accessibleRoutes(
  navs: Array<Nav>,
  allowedTabs: Array<string>
): Array<Nav> {
  // Base routes always available
  const allowed: Array<ROUTES> = [ROUTES.SYSTEM_INFO];
  
  // Map tab permissions to route access
  allowedTabs?.forEach(tab => {
    switch (tab) {
      case 'apps':
        allowed.push(ROUTES.API_KEYS);
        break;
      case 'users':
        allowed.push(ROUTES.USERS);
        break;
      case 'services':
        allowed.push(
          ROUTES.DATABASE,
          ROUTES.SCRIPTING,
          ROUTES.NETWORK,
          ROUTES.FILE,
          ROUTES.UTILITY,
          ROUTES.AUTHENTICATION,
          ROUTES.DF_PLATFORM_APIS
        );
        break;
      case 'apidocs':
        allowed.push(ROUTES.API_DOCS);
        break;
      case 'schema/data':
        allowed.push(ROUTES.SCHEMA);
        break;
      case 'files':
        allowed.push(ROUTES.FILES);
        break;
      case 'scripts':
        allowed.push(ROUTES.EVENT_SCRIPTS);
        break;
      case 'config':
        allowed.push(
          ROUTES.CORS,
          ROUTES.CACHE,
          ROUTES.EMAIL_TEMPLATES,
          ROUTES.GLOBAL_LOOKUP_KEYS
        );
        break;
      case 'limits':
        allowed.push(ROUTES.RATE_LIMITING);
        break;
      case 'scheduler':
        allowed.push(ROUTES.SCHEDULER);
        break;
    }
  });
  
  return navs.filter(nav => {
    if (nav.subRoutes) {
      // Recursively filter child routes
      nav.subRoutes = accessibleRoutes(nav.subRoutes, allowedTabs);
      // Keep parent if any children are accessible
      return nav.subRoutes.length > 0;
    }
    return allowed.includes(nav.route);
  });
}

/**
 * Generates breadcrumb trail from Next.js pathname and route definitions
 * 
 * Parses the current URL pathname to create a hierarchical breadcrumb trail,
 * handling dynamic route parameters (e.g., [id], [service]) and providing
 * proper labels and navigation paths.
 * 
 * Works with Next.js usePathname() hook for client-side navigation and
 * server component pathname parsing for SSR compatibility.
 * 
 * @param routeDefinitions - Next.js route definitions for path resolution
 * @param currentURL - Current pathname from usePathname() or URL
 * @returns Array of breadcrumb items for navigation display
 * 
 * @example
 * ```typescript
 * const pathname = '/api-connections/database/myservice/schema';
 * const breadcrumbs = generateBreadcrumb(routeDefinitions, pathname);
 * // Returns: [
 * //   { label: 'API Connections', path: '/api-connections' },
 * //   { label: 'Database', path: '/api-connections/database' },
 * //   { label: 'myservice', path: '/api-connections/database/myservice' },
 * //   { label: 'Schema' } // No path for current page
 * // ]
 * ```
 */
export function generateBreadcrumb(
  routeDefinitions: NextRouteDefinition[],
  currentURL: string
): Breadcrumb[] {
  const breadcrumbs: Breadcrumb[] = [];
  
  // Clean and split the URL path
  const urlSegments = decodeURIComponent(currentURL)
    .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
    .split('/')
    .filter(segment => segment);
  
  // Handle empty path (root)
  if (urlSegments.length === 0) {
    return [{ label: 'Home', translationKey: 'nav.home.header' }];
  }
  
  /**
   * Recursively traverse route definitions to match URL segments
   */
  function traverseRoutes(
    routes: NextRouteDefinition[],
    pathSoFar: string[] = [],
    translationKeySoFar: string[] = [],
    index = 0
  ): boolean {
    if (index >= urlSegments.length) {
      return true;
    }
    
    const currentSegment = urlSegments[index];
    let matched = false;
    
    for (const route of routes) {
      const path = route.path;
      const isDynamic = path.startsWith('[') && path.endsWith(']');
      const matchSegment = isDynamic ? currentSegment : path;
      
      // Check if route matches current URL segment
      if (route.path === currentSegment || isDynamic) {
        matched = true;
        const newPath = [...pathSoFar, matchSegment];
        
        // Handle nested routes with redirect children
        if (route.children?.some(child => child.path === '' || child.path === 'page')) {
          if (traverseRoutes(
            route.children,
            newPath,
            [...translationKeySoFar, path],
            index + 1
          )) {
            return true;
          }
        } else {
          // Build translation key path
          const translationKeySegment = isDynamic ? path.slice(1, -1) : path;
          const translationKey = [...translationKeySoFar, translationKeySegment]
            .join('.')
            .replace(/\//g, '.');
          
          // Create breadcrumb item
          const breadcrumb: Breadcrumb = {
            label: isDynamic ? currentSegment : getCurrentSegmentLabel(currentSegment),
            isDynamic
          };
          
          // Add navigation path for all but the last segment
          if (index !== urlSegments.length - 1) {
            breadcrumb.path = '/' + newPath.join('/');
          }
          
          // Add translation key for static routes
          if (!isDynamic) {
            breadcrumb.translationKey = `nav.${translationKey}.header`;
          }
          
          breadcrumbs.push(breadcrumb);
          
          // Continue traversing nested routes
          if (traverseRoutes(
            route.children || [],
            newPath,
            [...translationKeySoFar, translationKeySegment],
            index + 1
          )) {
            return true;
          }
        }
      }
    }
    
    // Handle unmatched segments (fallback for dynamic content)
    if (!matched) {
      breadcrumbs.push({
        label: getCurrentSegmentLabel(currentSegment),
        path: index !== urlSegments.length - 1 
          ? '/' + [...pathSoFar, currentSegment].join('/')
          : undefined,
      });
      
      return traverseRoutes(
        routeDefinitions,
        [...pathSoFar, currentSegment],
        translationKeySoFar,
        index + 1
      );
    }
    
    return false;
  }
  
  // Start traversal from root routes
  traverseRoutes(routeDefinitions);
  
  // Remove path from last breadcrumb (current page)
  if (breadcrumbs.length > 0 && breadcrumbs[breadcrumbs.length - 1].path) {
    delete breadcrumbs[breadcrumbs.length - 1].path;
  }
  
  return breadcrumbs;
}

/**
 * Extracts display label from URL segment
 * 
 * Handles hyphenated route names and dynamic parameters
 * to create human-readable breadcrumb labels.
 * 
 * @param segment - URL segment to process
 * @returns Formatted display label
 */
function getCurrentSegmentLabel(segment: string): string {
  // Split on hyphens and take the last part for compound names
  const parts = segment.split('-');
  const lastPart = parts[parts.length - 1];
  
  // Capitalize first letter
  return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
}

/**
 * Creates route definition from Next.js app directory structure
 * 
 * Helper function to build route definitions compatible with Next.js
 * App Router file-based routing conventions.
 * 
 * @param path - Route path segment
 * @param options - Route configuration options
 * @returns Route definition for navigation system
 */
export function createRouteDefinition(
  path: string,
  options: {
    children?: NextRouteDefinition[];
    metadata?: NextRouteDefinition['metadata'];
  } = {}
): NextRouteDefinition {
  return {
    path,
    children: options.children,
    metadata: options.metadata,
  };
}

/**
 * Validates if a route path represents a dynamic Next.js route
 * 
 * @param path - Route path to validate
 * @returns True if path contains dynamic segments
 */
export function isDynamicRoute(path: string): boolean {
  return path.includes('[') && path.includes(']');
}

/**
 * Extracts parameter name from dynamic route segment
 * 
 * @param segment - Route segment (e.g., '[id]', '[service]')
 * @returns Parameter name or null if not dynamic
 */
export function getRouteParameter(segment: string): string | null {
  const match = segment.match(/^\[(.+)\]$/);
  return match ? match[1] : null;
}