'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Breadcrumb item interface defining structure for navigation hierarchy
 */
interface BreadcrumbItem {
  /** Display label for the breadcrumb */
  label: string;
  /** Navigation path (undefined for current page) */
  path?: string;
  /** Translation key for internationalization */
  translationKey?: string;
  /** Whether this is the current/active page */
  isCurrentPage?: boolean;
}

/**
 * Route configuration for breadcrumb generation
 * Maps URL segments to display labels and translation keys
 */
interface RouteConfig {
  /** Route segment path */
  path: string;
  /** Display label fallback */
  label: string;
  /** Translation key for i18n */
  translationKey?: string;
  /** Child routes */
  children?: RouteConfig[];
}

/**
 * Comprehensive route configuration mapping Next.js app router structure
 * to breadcrumb hierarchy for DreamFactory Admin Interface
 */
const ROUTE_CONFIGS: RouteConfig[] = [
  {
    path: '',
    label: 'Dashboard',
    translationKey: 'nav.home.header',
  },
  {
    path: 'api-connections',
    label: 'API Connections',
    translationKey: 'nav.api-connections.header',
    children: [
      {
        path: 'database',
        label: 'Database Services',
        translationKey: 'nav.database.header',
        children: [
          {
            path: 'create',
            label: 'Create Service',
            translationKey: 'nav.create.header',
          },
          {
            path: ':service',
            label: 'Service Details',
            translationKey: 'nav.service.header',
            children: [
              {
                path: 'schema',
                label: 'Schema Discovery',
                translationKey: 'nav.schema.header',
              },
              {
                path: 'generate',
                label: 'API Generation',
                translationKey: 'nav.generate.header',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: 'api-security',
    label: 'API Security',
    translationKey: 'nav.api-security.header',
    children: [
      {
        path: 'roles',
        label: 'Roles & Permissions',
        translationKey: 'nav.roles.header',
        children: [
          {
            path: 'create',
            label: 'Create Role',
            translationKey: 'nav.create.header',
          },
          {
            path: ':id',
            label: 'Role Details',
            translationKey: 'nav.role.header',
          },
        ],
      },
      {
        path: 'limits',
        label: 'Rate Limiting',
        translationKey: 'nav.limits.header',
        children: [
          {
            path: 'create',
            label: 'Create Limit',
            translationKey: 'nav.create.header',
          },
          {
            path: ':id',
            label: 'Limit Details',
            translationKey: 'nav.limit.header',
          },
        ],
      },
    ],
  },
  {
    path: 'system-settings',
    label: 'System Settings',
    translationKey: 'nav.system-settings.header',
    children: [
      {
        path: 'system-info',
        label: 'System Information',
        translationKey: 'nav.system-info.header',
      },
      {
        path: 'cache',
        label: 'Cache Configuration',
        translationKey: 'nav.cache.header',
      },
      {
        path: 'cors',
        label: 'CORS Settings',
        translationKey: 'nav.cors.header',
      },
      {
        path: 'email-templates',
        label: 'Email Templates',
        translationKey: 'nav.email-templates.header',
        children: [
          {
            path: 'create',
            label: 'Create Template',
            translationKey: 'nav.create.header',
          },
          {
            path: ':id',
            label: 'Template Details',
            translationKey: 'nav.template.header',
          },
        ],
      },
      {
        path: 'lookup-keys',
        label: 'Global Lookup Keys',
        translationKey: 'nav.lookup-keys.header',
      },
      {
        path: 'scheduler',
        label: 'Task Scheduler',
        translationKey: 'nav.scheduler.header',
        children: [
          {
            path: 'create',
            label: 'Create Task',
            translationKey: 'nav.create.header',
          },
          {
            path: ':id',
            label: 'Task Details',
            translationKey: 'nav.task.header',
          },
        ],
      },
      {
        path: 'reports',
        label: 'System Reports',
        translationKey: 'nav.reports.header',
      },
    ],
  },
  {
    path: 'admin-settings',
    label: 'Admin Settings',
    translationKey: 'nav.admin-settings.header',
  },
  {
    path: 'profile',
    label: 'User Profile',
    translationKey: 'nav.profile.header',
  },
];

/**
 * Generates breadcrumb navigation from current pathname using route configuration
 * Recursively traverses route structure to build hierarchical navigation
 * 
 * @param routeConfigs - Route configuration tree
 * @param pathname - Current URL pathname
 * @returns Array of breadcrumb items
 */
function generateBreadcrumbs(
  routeConfigs: RouteConfig[],
  pathname: string
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];
  
  // Normalize pathname by removing trailing slash and leading slash
  const normalizedPath = pathname.replace(/^\/|\/$/g, '');
  const segments = normalizedPath ? normalizedPath.split('/') : [];

  /**
   * Recursively traverse route configuration to match URL segments
   */
  function traverseRoutes(
    routes: RouteConfig[],
    segmentIndex: number = 0,
    pathSoFar: string[] = []
  ): boolean {
    // Base case: all segments matched
    if (segmentIndex >= segments.length) {
      return true;
    }

    const currentSegment = segments[segmentIndex];
    
    for (const route of routes) {
      const isDynamicRoute = route.path.startsWith(':');
      const routeMatches = isDynamicRoute || route.path === currentSegment;
      
      if (routeMatches) {
        const newPathSoFar = [...pathSoFar, currentSegment];
        const routePath = '/' + newPathSoFar.join('/');
        
        // Create breadcrumb item
        let label = route.label;
        
        // For dynamic routes, use the actual segment value as label
        if (isDynamicRoute) {
          // Convert kebab-case to title case for better display
          label = currentSegment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
        
        const breadcrumbItem: BreadcrumbItem = {
          label,
          translationKey: route.translationKey,
          // Don't include path for the last breadcrumb (current page)
          path: segmentIndex === segments.length - 1 ? undefined : routePath,
          isCurrentPage: segmentIndex === segments.length - 1,
        };
        
        breadcrumbs.push(breadcrumbItem);
        
        // Recursively check children routes
        if (route.children && segmentIndex < segments.length - 1) {
          if (traverseRoutes(route.children, segmentIndex + 1, newPathSoFar)) {
            return true;
          }
        } else if (segmentIndex === segments.length - 1) {
          // We've matched all segments
          return true;
        }
      }
    }
    
    return false;
  }

  // Always add home breadcrumb for non-root paths
  if (segments.length > 0) {
    breadcrumbs.push({
      label: 'Dashboard',
      path: '/',
      translationKey: 'nav.home.header',
    });
  }

  // Generate breadcrumbs from route configuration
  traverseRoutes(ROUTE_CONFIGS);
  
  return breadcrumbs;
}

/**
 * Props interface for Breadcrumbs component
 */
interface BreadcrumbsProps {
  /** Optional custom CSS class name */
  className?: string;
  /** Whether to show home icon for first breadcrumb */
  showHomeIcon?: boolean;
  /** Maximum number of breadcrumbs to display (with collapse) */
  maxItems?: number;
}

/**
 * Breadcrumb navigation component for Next.js app router
 * 
 * Displays current page hierarchy and provides quick navigation to parent routes.
 * Generates breadcrumbs dynamically from Next.js router segments and integrates 
 * with the application routing structure for contextual navigation.
 * 
 * Features:
 * - Dynamic breadcrumb generation from pathname
 * - Next.js Link components for optimized navigation
 * - Accessible navigation with ARIA labels
 * - Responsive design with Tailwind CSS
 * - Translation key support for internationalization
 * - Support for dynamic routes with parameter display
 * 
 * @param props - Component properties
 * @returns JSX breadcrumb navigation component
 */
export function Breadcrumbs({
  className,
  showHomeIcon = true,
  maxItems = 5,
}: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // Memoize breadcrumb generation for performance
  const breadcrumbs = useMemo(() => {
    return generateBreadcrumbs(ROUTE_CONFIGS, pathname);
  }, [pathname]);

  // Handle breadcrumb collapse if too many items
  const displayBreadcrumbs = useMemo(() => {
    if (breadcrumbs.length <= maxItems) {
      return breadcrumbs;
    }
    
    // Show first, last, and collapse middle items
    const first = breadcrumbs[0];
    const last = breadcrumbs[breadcrumbs.length - 1];
    const middle = breadcrumbs.slice(1, -1);
    
    if (middle.length <= 2) {
      return breadcrumbs;
    }
    
    return [
      first,
      { label: '...', path: undefined, isCurrentPage: false },
      ...breadcrumbs.slice(-2),
    ];
  }, [breadcrumbs, maxItems]);

  // Don't render if no breadcrumbs or only home
  if (displayBreadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className={cn(
        'flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-300',
        className
      )}
      role="navigation"
    >
      <ol className="flex items-center space-x-1">
        {displayBreadcrumbs.map((breadcrumb, index) => (
          <li key={`${breadcrumb.path || breadcrumb.label}-${index}`} className="flex items-center">
            {/* Separator for non-first items */}
            {index > 0 && (
              <ChevronRight 
                className="mx-2 h-4 w-4 text-gray-400 dark:text-gray-500" 
                aria-hidden="true"
              />
            )}
            
            {/* Breadcrumb content */}
            <div className="flex items-center">
              {/* Home icon for first breadcrumb */}
              {index === 0 && showHomeIcon && breadcrumb.path && (
                <Link
                  href={breadcrumb.path}
                  className="flex items-center text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-150"
                  aria-label="Go to dashboard"
                >
                  <Home className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Dashboard</span>
                </Link>
              )}
              
              {/* Regular breadcrumb link or text */}
              {index > 0 || !showHomeIcon ? (
                breadcrumb.path && !breadcrumb.isCurrentPage ? (
                  <Link
                    href={breadcrumb.path}
                    className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded-sm px-1 py-0.5"
                    aria-label={`Go to ${breadcrumb.label}`}
                  >
                    {breadcrumb.label}
                  </Link>
                ) : (
                  <span 
                    className={cn(
                      'px-1 py-0.5',
                      breadcrumb.isCurrentPage 
                        ? 'font-medium text-gray-900 dark:text-gray-100' 
                        : 'text-gray-500'
                    )}
                    aria-current={breadcrumb.isCurrentPage ? 'page' : undefined}
                  >
                    {breadcrumb.label}
                  </span>
                )
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;