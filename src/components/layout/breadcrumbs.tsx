'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Breadcrumb navigation component that displays current page hierarchy
 * and provides quick navigation to parent routes. Generates breadcrumbs
 * dynamically from Next.js router segments and integrates with the
 * application routing structure for contextual navigation.
 */

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrentPage: boolean;
}

interface BreadcrumbsProps {
  /**
   * Custom class name for the breadcrumb container
   */
  className?: string;
  /**
   * Whether to show the home icon as the first breadcrumb
   * @default true
   */
  showHome?: boolean;
  /**
   * Maximum number of breadcrumb items to display before truncation
   * @default 5
   */
  maxItems?: number;
  /**
   * Custom separator between breadcrumb items
   */
  separator?: React.ReactNode;
  /**
   * Optional override for specific path segments
   */
  pathOverrides?: Record<string, string>;
}

/**
 * Route label mappings for better breadcrumb display names
 */
const ROUTE_LABELS: Record<string, string> = {
  // Dashboard
  '': 'Dashboard',
  'dashboard': 'Dashboard',
  
  // API Connections
  'api-connections': 'API Connections',
  'database': 'Database Services',
  'create': 'Create Service',
  'schema': 'Schema',
  'generate': 'Generate APIs',
  
  // User Management
  'admin-settings': 'Admin Settings',
  'users': 'Users',
  'admins': 'Administrators',
  'roles': 'Roles',
  
  // System Settings
  'system-settings': 'System Settings',
  'config': 'Configuration',
  'cache': 'Cache Settings',
  'cors': 'CORS Configuration',
  'email-templates': 'Email Templates',
  'lookup-keys': 'Lookup Keys',
  'system-info': 'System Information',
  'scheduler': 'Scheduler',
  'reports': 'Reports',
  
  // API Security
  'api-security': 'API Security',
  'limits': 'Rate Limits',
  
  // Profile & Auth
  'profile': 'Profile',
  'login': 'Sign In',
  'saml-callback': 'SAML Authentication',
  
  // Debug & Development
  'debug': 'Debug Console',
  
  // Legacy ADF routes (for migration compatibility)
  'adf-home': 'Home',
  'adf-services': 'Services',
  'adf-schema': 'Schema',
  'adf-users': 'Users',
  'adf-admins': 'Administrators',
  'adf-roles': 'Roles',
  'adf-apps': 'Applications',
  'adf-config': 'Configuration',
  'adf-files': 'Files',
  'adf-reports': 'Reports',
  'adf-limits': 'Rate Limits',
  'adf-scheduler': 'Scheduler',
  'adf-event-scripts': 'Event Scripts',
  'adf-api-docs': 'API Documentation',
  'adf-profile': 'Profile',
  'adf-user-management': 'User Management',
};

/**
 * Generate user-friendly label for a path segment
 */
function getSegmentLabel(segment: string, pathOverrides?: Record<string, string>): string {
  // Check for custom overrides first
  if (pathOverrides?.[segment]) {
    return pathOverrides[segment];
  }
  
  // Check predefined route labels
  if (ROUTE_LABELS[segment]) {
    return ROUTE_LABELS[segment];
  }
  
  // Handle dynamic route segments (e.g., [id], [serviceId])
  if (segment.startsWith('[') && segment.endsWith(']')) {
    const param = segment.slice(1, -1);
    // Convert parameter names to readable labels
    switch (param) {
      case 'id':
        return 'Details';
      case 'serviceId':
        return 'Service';
      case 'tableId':
        return 'Table';
      case 'fieldId':
        return 'Field';
      case 'userId':
        return 'User';
      case 'adminId':
        return 'Admin';
      case 'roleId':
        return 'Role';
      case 'appId':
        return 'Application';
      case 'scriptId':
        return 'Script';
      case 'limitId':
        return 'Limit';
      case 'schedulerId':
        return 'Schedule';
      default:
        return param.charAt(0).toUpperCase() + param.slice(1);
    }
  }
  
  // Handle UUIDs or IDs (show as "Details")
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
      /^[0-9]+$/.test(segment)) {
    return 'Details';
  }
  
  // Default: Convert kebab-case to title case
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate breadcrumb items from current pathname
 */
function generateBreadcrumbs(
  pathname: string,
  pathOverrides?: Record<string, string>
): BreadcrumbItem[] {
  // Clean and split the pathname
  const segments = pathname
    .split('/')
    .filter(segment => segment.length > 0);
  
  const breadcrumbs: BreadcrumbItem[] = [];
  
  // Always start with home/dashboard
  breadcrumbs.push({
    label: 'Dashboard',
    href: '/',
    isCurrentPage: segments.length === 0,
  });
  
  // Generate breadcrumbs for each segment
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    breadcrumbs.push({
      label: getSegmentLabel(segment, pathOverrides),
      href: currentPath,
      isCurrentPage: isLast,
    });
  });
  
  return breadcrumbs;
}

export function Breadcrumbs({
  className,
  showHome = true,
  maxItems = 5,
  separator,
  pathOverrides,
}: BreadcrumbsProps) {
  const pathname = usePathname();
  
  const breadcrumbs = useMemo(() => {
    const items = generateBreadcrumbs(pathname, pathOverrides);
    
    // Apply maxItems limit with truncation
    if (items.length > maxItems) {
      const firstItem = items[0];
      const lastItems = items.slice(-(maxItems - 2));
      const truncatedItems = [
        firstItem,
        {
          label: '...',
          href: '#',
          isCurrentPage: false,
        },
        ...lastItems,
      ];
      return truncatedItems;
    }
    
    return items;
  }, [pathname, pathOverrides, maxItems]);
  
  // Don't show breadcrumbs if we're on the root page and it's the only item
  if (breadcrumbs.length <= 1 && !showHome) {
    return null;
  }
  
  const defaultSeparator = <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />;
  const separatorElement = separator ?? defaultSeparator;
  
  return (
    <nav
      aria-label="Breadcrumb navigation"
      className={cn(
        "flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-300",
        className
      )}
      data-testid="breadcrumbs-container"
    >
      <ol
        className="flex items-center space-x-1"
        role="list"
      >
        {breadcrumbs.map((breadcrumb, index) => {
          const isFirst = index === 0;
          const isLast = breadcrumb.isCurrentPage;
          const isTruncated = breadcrumb.label === '...';
          
          return (
            <li
              key={breadcrumb.href}
              className="flex items-center"
              role="listitem"
            >
              {/* Separator (except for first item) */}
              {!isFirst && (
                <span
                  className="mr-1"
                  aria-hidden="true"
                >
                  {separatorElement}
                </span>
              )}
              
              {/* Breadcrumb item */}
              {isTruncated ? (
                <span
                  className="px-1 text-gray-400"
                  aria-label="More breadcrumb items"
                  data-testid="breadcrumb-truncation"
                >
                  {breadcrumb.label}
                </span>
              ) : isLast ? (
                <span
                  className={cn(
                    "font-medium text-gray-900 dark:text-gray-100",
                    "px-1 py-0.5 rounded-sm",
                    "max-w-[200px] truncate"
                  )}
                  aria-current="page"
                  data-testid={`breadcrumb-current-${breadcrumb.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {isFirst && showHome ? (
                    <span className="flex items-center">
                      <Home className="h-4 w-4 mr-1" aria-hidden="true" />
                      <span className="sr-only">Home: </span>
                      {breadcrumb.label}
                    </span>
                  ) : (
                    breadcrumb.label
                  )}
                </span>
              ) : (
                <Link
                  href={breadcrumb.href}
                  className={cn(
                    "hover:text-primary-600 dark:hover:text-primary-400",
                    "transition-colors duration-150 ease-in-out",
                    "px-1 py-0.5 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1",
                    "max-w-[200px] truncate"
                  )}
                  data-testid={`breadcrumb-link-${breadcrumb.label.toLowerCase().replace(/\s+/g, '-')}`}
                  aria-label={`Navigate to ${breadcrumb.label}`}
                >
                  {isFirst && showHome ? (
                    <span className="flex items-center">
                      <Home className="h-4 w-4 mr-1" aria-hidden="true" />
                      <span className="sr-only">Home: </span>
                      {breadcrumb.label}
                    </span>
                  ) : (
                    breadcrumb.label
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Responsive breadcrumb variant that adapts to mobile screen sizes
 */
export function ResponsiveBreadcrumbs(props: BreadcrumbsProps) {
  return (
    <div className="w-full">
      {/* Desktop breadcrumbs */}
      <div className="hidden sm:block">
        <Breadcrumbs {...props} />
      </div>
      
      {/* Mobile breadcrumbs - show only current page and one parent */}
      <div className="sm:hidden">
        <Breadcrumbs
          {...props}
          maxItems={2}
          showHome={false}
          className="text-xs"
        />
      </div>
    </div>
  );
}

export default Breadcrumbs;