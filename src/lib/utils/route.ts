/**
 * @fileoverview Next.js routing utilities for DreamFactory Admin Interface
 * 
 * Provides comprehensive route transformation utilities for converting Angular routing
 * configurations to Next.js App Router navigation structures. Includes breadcrumb
 * generation, permission-based filtering, and dynamic route handling for seamless
 * migration from Angular Router to Next.js file-based routing system.
 * 
 * Key features:
 * - transformRoutes: Converts route definitions to navigation structures
 * - accessibleRoutes: Filters routes based on user permissions
 * - generateBreadcrumb: Creates route-based breadcrumb trails
 * - Dynamic route parameter extraction and replacement
 * - Icon path optimization for Next.js public asset serving
 * 
 * @version 2.0.0
 * @since 2024-12-19
 */

import type { NavigationItem } from '@/types/ui';
import type { 
  AppRoutes, 
  RouteParams, 
  SearchParams, 
  Breadcrumb, 
  RouteMetadata 
} from '@/types/routes';

// ================================================================================================
// ROUTE DEFINITION INTERFACES
// ================================================================================================

/**
 * Extended route configuration for navigation hierarchy construction
 * Replaces Angular Routes interface with Next.js App Router patterns
 */
export interface RouteDefinition {
  /** Next.js app directory path (e.g., '/api-connections/database') */
  path: AppRoutes;
  
  /** Display label for navigation */
  label: string;
  
  /** Icon path relative to public directory or icon component name */
  icon?: string;
  
  /** Nested child routes following Next.js directory structure */
  children?: RouteDefinition[];
  
  /** Route metadata for enhanced navigation features */
  metadata?: RouteMetadata;
  
  /** Dynamic route parameter definitions */
  params?: Record<string, string>;
  
  /** Service groups for permission-based filtering */
  serviceGroups?: string[];
  
  /** Whether route is available in current context */
  enabled?: boolean;
  
  /** External link indicator */
  external?: boolean;
  
  /** Badge content for navigation items */
  badge?: string | number;
}

/**
 * Route transformation context for navigation generation
 */
export interface RouteTransformContext {
  /** Current user roles for permission filtering */
  userRoles?: string[];
  
  /** Current user permissions for access control */
  userPermissions?: string[];
  
  /** Current pathname for active state detection */
  currentPath?: string;
  
  /** Base URL for absolute path generation */
  baseUrl?: string;
  
  /** Service groups available to current user */
  availableServiceGroups?: string[];
  
  /** Feature flags for conditional routing */
  featureFlags?: Record<string, boolean>;
}

/**
 * Breadcrumb generation options
 */
export interface BreadcrumbOptions {
  /** Include home/root breadcrumb */
  includeHome?: boolean;
  
  /** Maximum breadcrumb depth */
  maxDepth?: number;
  
  /** Custom label resolver for dynamic segments */
  labelResolver?: (segment: string, params: RouteParams) => string | Promise<string>;
  
  /** Exclude certain path segments */
  excludeSegments?: string[];
  
  /** Custom icon resolver for breadcrumb items */
  iconResolver?: (segment: string, params: RouteParams) => string | undefined;
}

// ================================================================================================
// CORE ROUTE TRANSFORMATION UTILITIES
// ================================================================================================

/**
 * Transforms route definitions into navigation hierarchy structure
 * Converts Angular route.children pattern to Next.js app directory navigation
 * 
 * @param routes - Array of route definitions to transform
 * @param context - Transformation context for filtering and state
 * @returns Hierarchical navigation structure
 */
export function transformRoutes(
  routes: RouteDefinition[],
  context: RouteTransformContext = {}
): NavigationItem[] {
  const { 
    userRoles = [], 
    userPermissions = [], 
    currentPath = '',
    availableServiceGroups = [],
    featureFlags = {}
  } = context;

  return routes
    .filter(route => isRouteAccessible(route, { userRoles, userPermissions, availableServiceGroups }))
    .map(route => transformSingleRoute(route, context))
    .filter(Boolean) as NavigationItem[];
}

/**
 * Transforms a single route definition to navigation item
 * Handles nested routes, dynamic parameters, and icon path resolution
 */
function transformSingleRoute(
  route: RouteDefinition,
  context: RouteTransformContext
): NavigationItem | null {
  const { currentPath = '', baseUrl = '' } = context;

  // Skip disabled routes
  if (route.enabled === false) {
    return null;
  }

  // Handle feature flag gating
  if (route.metadata?.permissions?.some(permission => 
    context.featureFlags?.[`feature_${permission}`] === false
  )) {
    return null;
  }

  // Generate full href with base URL
  const href = route.external ? route.path : `${baseUrl}${route.path}`;

  // Transform children recursively
  const children = route.children ? transformRoutes(route.children, context) : undefined;

  // Resolve icon path for Next.js public asset serving
  const icon = resolveIconPath(route.icon);

  return {
    id: generateRouteId(route.path),
    label: route.label,
    href: route.external ? route.path : href,
    icon,
    badge: route.badge,
    disabled: route.enabled === false,
    external: route.external || false,
    children,
    expanded: children ? isPathActive(route.path, currentPath) : undefined,
    'aria-label': route.metadata?.description || route.label,
    'aria-description': route.metadata?.description
  };
}

/**
 * Filters routes based on user accessibility and permissions
 * Maintains filtering logic for navigation accessibility based on user permissions
 * 
 * @param routes - Routes to filter
 * @param context - User context for permission checking
 * @returns Filtered routes accessible to current user
 */
export function accessibleRoutes(
  routes: RouteDefinition[],
  context: Pick<RouteTransformContext, 'userRoles' | 'userPermissions' | 'availableServiceGroups'>
): RouteDefinition[] {
  return routes.filter(route => isRouteAccessible(route, context));
}

/**
 * Checks if a route is accessible to the current user
 */
function isRouteAccessible(
  route: RouteDefinition,
  context: Pick<RouteTransformContext, 'userRoles' | 'userPermissions' | 'availableServiceGroups'>
): boolean {
  const { userRoles = [], userPermissions = [], availableServiceGroups = [] } = context;

  // Check role-based access
  if (route.metadata?.roles && route.metadata.roles.length > 0) {
    if (!route.metadata.roles.some(role => userRoles.includes(role))) {
      return false;
    }
  }

  // Check permission-based access
  if (route.metadata?.permissions && route.metadata.permissions.length > 0) {
    if (!route.metadata.permissions.some(permission => userPermissions.includes(permission))) {
      return false;
    }
  }

  // Check service group access
  if (route.serviceGroups && route.serviceGroups.length > 0) {
    if (!route.serviceGroups.some(group => availableServiceGroups.includes(group))) {
      return false;
    }
  }

  return true;
}

// ================================================================================================
// BREADCRUMB GENERATION UTILITIES
// ================================================================================================

/**
 * Generates breadcrumb trail from Next.js pathname and route parameters
 * Works with Next.js usePathname and dynamic route patterns
 * 
 * @param pathname - Current pathname from Next.js usePathname hook
 * @param params - Route parameters from Next.js routing
 * @param routes - Route definitions for label resolution
 * @param options - Breadcrumb generation options
 * @returns Array of breadcrumb items
 */
export async function generateBreadcrumb(
  pathname: string,
  params: RouteParams = {},
  routes: RouteDefinition[] = [],
  options: BreadcrumbOptions = {}
): Promise<Breadcrumb[]> {
  const {
    includeHome = true,
    maxDepth = 10,
    labelResolver,
    excludeSegments = [],
    iconResolver
  } = options;

  const breadcrumbs: Breadcrumb[] = [];

  // Add home breadcrumb if requested
  if (includeHome && pathname !== '/') {
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/',
      icon: resolveIconPath('home'),
      current: false
    });
  }

  // Parse pathname into segments
  const segments = pathname
    .split('/')
    .filter(segment => segment && !excludeSegments.includes(segment));

  // Build breadcrumbs from segments
  let currentPath = '';
  for (let i = 0; i < Math.min(segments.length, maxDepth); i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Skip excluded segments
    if (excludeSegments.includes(segment)) {
      continue;
    }

    // Find matching route definition
    const routeMatch = findRouteByPath(routes, currentPath);

    // Resolve label (prefer custom resolver, then route label, then segment)
    let label = segment;
    if (labelResolver) {
      try {
        const resolvedLabel = await labelResolver(segment, params);
        if (resolvedLabel) {
          label = resolvedLabel;
        }
      } catch (error) {
        console.warn('Failed to resolve breadcrumb label:', error);
      }
    } else if (routeMatch) {
      label = routeMatch.label;
    } else {
      // Transform segment to readable label
      label = formatSegmentLabel(segment, params);
    }

    // Resolve icon
    const icon = iconResolver 
      ? iconResolver(segment, params)
      : routeMatch?.icon 
        ? resolveIconPath(routeMatch.icon)
        : undefined;

    // Add breadcrumb item
    breadcrumbs.push({
      label,
      href: currentPath,
      icon,
      current: i === segments.length - 1
    });
  }

  return breadcrumbs;
}

/**
 * Finds a route definition by path
 */
function findRouteByPath(routes: RouteDefinition[], path: string): RouteDefinition | null {
  for (const route of routes) {
    if (route.path === path) {
      return route;
    }
    
    if (route.children) {
      const childMatch = findRouteByPath(route.children, path);
      if (childMatch) {
        return childMatch;
      }
    }
  }
  
  return null;
}

/**
 * Formats a path segment into a readable label
 * Handles Next.js dynamic route patterns and parameter substitution
 */
function formatSegmentLabel(segment: string, params: RouteParams): string {
  // Handle dynamic route segments [param] or [...param]
  if (segment.startsWith('[') && segment.endsWith(']')) {
    const paramName = segment.slice(1, -1).replace('...', '');
    const paramValue = params[paramName];
    
    if (paramValue) {
      return Array.isArray(paramValue) ? paramValue.join('/') : String(paramValue);
    }
    
    return segment; // Return original if no param value
  }

  // Handle special route names with better formatting
  const labelMap: Record<string, string> = {
    'api-connections': 'API Connections',
    'api-security': 'API Security',
    'admin-settings': 'Admin Settings',
    'system-settings': 'System Settings',
    'email-templates': 'Email Templates',
    'global-lookup-keys': 'Global Lookup Keys',
    'rate-limiting': 'Rate Limiting',
    'role-based-access': 'Role-Based Access',
    'api-keys': 'API Keys',
    'event-scripts': 'Event Scripts',
    'api-docs': 'API Documentation',
    'system-info': 'System Information',
    'df-platform-apis': 'DreamFactory Platform APIs'
  };

  // Use mapped label or transform kebab-case to title case
  return labelMap[segment] || segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ================================================================================================
// UTILITY FUNCTIONS
// ================================================================================================

/**
 * Resolves icon paths for Next.js public asset serving
 * Updates icon path references to work with Next.js public asset serving
 */
function resolveIconPath(icon?: string): string | undefined {
  if (!icon) return undefined;

  // Handle component-based icons (e.g., 'HomeIcon', 'DatabaseIcon')
  if (icon.endsWith('Icon') || icon.includes('/')) {
    return icon;
  }

  // Handle public asset paths - ensure they start with /
  if (icon.startsWith('icons/') || icon.startsWith('images/')) {
    return `/${icon}`;
  }

  // Default to SVG in public/icons directory
  return `/icons/${icon}.svg`;
}

/**
 * Generates a unique route ID from path
 */
function generateRouteId(path: string): string {
  return path.replace(/[^a-zA-Z0-9]/g, '-').replace(/^-|-$/g, '');
}

/**
 * Checks if a path is currently active
 */
function isPathActive(routePath: string, currentPath: string): boolean {
  if (routePath === currentPath) return true;
  
  // Check if current path starts with route path (for parent routes)
  return currentPath.startsWith(routePath + '/');
}

/**
 * Extracts dynamic parameters from Next.js route path
 * Handles both single dynamic segments [param] and catch-all routes [...param]
 */
export function extractRouteParams(path: string): string[] {
  const paramPattern = /\[(\.\.\.)?(.*?)\]/g;
  const matches: string[] = [];
  let match;

  while ((match = paramPattern.exec(path)) !== null) {
    matches.push(match[2]); // Extract parameter name
  }

  return matches;
}

/**
 * Builds a route path with parameters replaced
 * Replaces Angular path parameter handling with Next.js dynamic route patterns
 */
export function buildRoutePath(
  path: string, 
  params: RouteParams = {}, 
  searchParams: SearchParams = {}
): string {
  let builtPath = path;

  // Replace dynamic parameters in path
  Object.entries(params).forEach(([key, value]) => {
    const singleParam = `[${key}]`;
    const catchAllParam = `[...${key}]`;
    
    if (builtPath.includes(singleParam)) {
      builtPath = builtPath.replace(singleParam, String(value));
    } else if (builtPath.includes(catchAllParam)) {
      const valueArray = Array.isArray(value) ? value : [value];
      builtPath = builtPath.replace(catchAllParam, valueArray.join('/'));
    }
  });

  // Add search parameters
  const searchParamsString = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParamsString.append(key, String(v)));
      } else {
        searchParamsString.set(key, String(value));
      }
    }
  });

  const queryString = searchParamsString.toString();
  return queryString ? `${builtPath}?${queryString}` : builtPath;
}

/**
 * Type-safe route builder utility
 * Provides compile-time validation for route construction
 */
export function createTypedRoute<T extends AppRoutes>(route: T) {
  return (params?: RouteParams, searchParams?: SearchParams): string => {
    return buildRoutePath(route, params, searchParams);
  };
}

// ================================================================================================
// PREDEFINED ROUTE CONFIGURATIONS
// ================================================================================================

/**
 * Common route definitions for DreamFactory Admin Interface
 * Maintains the navigation hierarchy from Angular routing while adapting to Next.js patterns
 */
export const DEFAULT_ROUTES: RouteDefinition[] = [
  {
    path: '/',
    label: 'Dashboard',
    icon: 'home',
    metadata: {
      title: 'Dashboard',
      description: 'DreamFactory Admin Console dashboard',
      requiresAuth: true,
      category: 'main',
      order: 1
    }
  },
  {
    path: '/api-connections',
    label: 'API Connections',
    icon: 'api',
    metadata: {
      title: 'API Connections',
      description: 'Manage API connections and services',
      requiresAuth: true,
      category: 'connections'
    },
    children: [
      {
        path: '/api-connections/database',
        label: 'Database Services',
        icon: 'database',
        serviceGroups: ['Database'],
        metadata: {
          title: 'Database Services',
          description: 'Manage database connections and API services',
          requiresAuth: true,
          category: 'services'
        },
        children: [
          {
            path: '/api-connections/database/create',
            label: 'Create Database Service',
            metadata: {
              title: 'Create Database Service',
              description: 'Connect to your database and generate APIs',
              requiresAuth: true
            }
          },
          {
            path: '/api-connections/database/[service]',
            label: 'Service Details',
            params: { service: 'string' },
            children: [
              {
                path: '/api-connections/database/[service]/schema',
                label: 'Schema Browser',
                metadata: {
                  title: 'Schema Browser',
                  description: 'Browse and manage database schema'
                }
              },
              {
                path: '/api-connections/database/[service]/generate',
                label: 'API Generation',
                metadata: {
                  title: 'API Generation',
                  description: 'Generate REST APIs from database schema'
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/api-security',
    label: 'API Security',
    icon: 'shield',
    metadata: {
      title: 'API Security',
      description: 'Manage API security and access controls',
      requiresAuth: true,
      roles: ['admin'],
      category: 'security'
    },
    children: [
      {
        path: '/api-security/roles',
        label: 'Roles',
        icon: 'users',
        children: [
          {
            path: '/api-security/roles/create',
            label: 'Create Role'
          },
          {
            path: '/api-security/roles/[id]',
            label: 'Edit Role',
            params: { id: 'string' }
          }
        ]
      },
      {
        path: '/api-security/limits',
        label: 'Rate Limiting',
        icon: 'clock',
        children: [
          {
            path: '/api-security/limits/create',
            label: 'Create Limit'
          },
          {
            path: '/api-security/limits/[id]',
            label: 'Edit Limit',
            params: { id: 'string' }
          }
        ]
      }
    ]
  },
  {
    path: '/admin-settings',
    label: 'Admin Settings',
    icon: 'cog',
    metadata: {
      title: 'Admin Settings',
      description: 'System administration and configuration',
      requiresAuth: true,
      roles: ['admin'],
      category: 'admin'
    },
    children: [
      {
        path: '/admin-settings/users',
        label: 'Users',
        icon: 'user',
        children: [
          {
            path: '/admin-settings/users/create',
            label: 'Create User'
          },
          {
            path: '/admin-settings/users/[id]',
            label: 'Edit User',
            params: { id: 'string' }
          }
        ]
      }
    ]
  },
  {
    path: '/system-settings',
    label: 'System Settings',
    icon: 'server',
    metadata: {
      title: 'System Settings',
      description: 'System configuration and management',
      requiresAuth: true,
      roles: ['admin'],
      category: 'system'
    }
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: 'user-circle',
    metadata: {
      title: 'User Profile',
      description: 'Manage user profile and preferences',
      requiresAuth: true,
      category: 'user'
    }
  }
];

/**
 * Route definitions optimized for mobile navigation
 */
export const MOBILE_ROUTES: RouteDefinition[] = DEFAULT_ROUTES.filter(route => 
  !route.metadata?.category || ['main', 'connections', 'user'].includes(route.metadata.category)
);

/**
 * Admin-only routes for privileged users
 */
export const ADMIN_ROUTES: RouteDefinition[] = DEFAULT_ROUTES.filter(route =>
  route.metadata?.roles?.includes('admin')
);