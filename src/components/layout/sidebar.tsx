'use client';

import React, { useMemo, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Disclosure } from '@headlessui/react';
import {
  ChevronRightIcon,
  HomeIcon,
  DatabaseIcon,
  ShieldCheckIcon,
  UsersIcon,
  CogIcon,
  DocumentTextIcon,
  FolderIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ServerIcon,
  KeyIcon,
  UserGroupIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  CircleStackIcon,
  CalendarDaysIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useSidebar } from '@/stores/app-store';
import type { NavigationItem } from '@/types/navigation';

/**
 * Navigation menu configuration with hierarchical structure
 * Defines the complete DreamFactory admin interface navigation
 */
const NAVIGATION_MENU: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: HomeIcon,
    description: 'System overview and quick actions',
    permissions: [],
  },
  {
    id: 'api-connections',
    label: 'API Connections',
    icon: DatabaseIcon,
    description: 'Database and service management',
    permissions: ['api-connections.read'],
    children: [
      {
        id: 'database-services',
        label: 'Database',
        href: '/api-connections/database',
        icon: CircleStackIcon,
        description: 'Database service management',
        permissions: ['database-services.read'],
      },
      // Additional service types would be added here in future phases
    ],
  },
  {
    id: 'api-security',
    label: 'API Security',
    icon: ShieldCheckIcon,
    description: 'Access control and security',
    permissions: ['api-security.read'],
    children: [
      {
        id: 'roles',
        label: 'Roles',
        href: '/api-security/roles',
        icon: UserGroupIcon,
        description: 'Role-based access control',
        permissions: ['roles.read'],
      },
      {
        id: 'limits',
        label: 'Limits',
        href: '/api-security/limits',
        icon: ChartBarIcon,
        description: 'API rate limiting',
        permissions: ['limits.read'],
      },
    ],
  },
  {
    id: 'admin-settings',
    label: 'Admin Settings',
    icon: UsersIcon,
    description: 'User and admin management',
    permissions: ['admin.read'],
    children: [
      {
        id: 'admins',
        label: 'Admins',
        href: '/admin-settings/admins',
        icon: KeyIcon,
        description: 'Administrator accounts',
        permissions: ['admins.read'],
      },
      {
        id: 'users',
        label: 'Users',
        href: '/admin-settings/users',
        icon: UsersIcon,
        description: 'Application users',
        permissions: ['users.read'],
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
        id: 'config',
        label: 'Config',
        href: '/system-settings/system-info',
        icon: CogIcon,
        description: 'System configuration',
        permissions: ['config.read'],
      },
      {
        id: 'email-templates',
        label: 'Email Templates',
        href: '/system-settings/email-templates',
        icon: EnvelopeIcon,
        description: 'Email template management',
        permissions: ['email-templates.read'],
      },
      {
        id: 'cors',
        label: 'CORS',
        href: '/system-settings/cors',
        icon: GlobeAltIcon,
        description: 'Cross-origin resource sharing',
        permissions: ['cors.read'],
      },
      {
        id: 'cache',
        label: 'Cache',
        href: '/system-settings/cache',
        icon: ServerIcon,
        description: 'Cache management',
        permissions: ['cache.read'],
      },
      {
        id: 'scheduler',
        label: 'Scheduler',
        href: '/system-settings/scheduler',
        icon: CalendarDaysIcon,
        description: 'Task scheduling',
        permissions: ['scheduler.read'],
      },
      {
        id: 'reports',
        label: 'Reports',
        href: '/system-settings/reports',
        icon: ChartBarIcon,
        description: 'System reports',
        permissions: ['reports.read'],
      },
      {
        id: 'lookup-keys',
        label: 'Lookup Keys',
        href: '/system-settings/lookup-keys',
        icon: KeyIcon,
        description: 'Global lookup keys',
        permissions: ['lookup-keys.read'],
      },
    ],
  },
  {
    id: 'files',
    label: 'Files',
    href: '/files',
    icon: FolderIcon,
    description: 'File browser and management',
    permissions: ['files.read'],
  },
  {
    id: 'api-docs',
    label: 'API Docs',
    href: '/api-docs',
    icon: DocumentTextIcon,
    description: 'API documentation viewer',
    permissions: ['api-docs.read'],
  },
  {
    id: 'logs',
    label: 'Logs',
    href: '/logs',
    icon: ClipboardDocumentListIcon,
    description: 'System log viewer',
    permissions: ['logs.read'],
  },
];

/**
 * Individual navigation item component with active state detection
 */
interface NavigationItemProps {
  item: NavigationItem;
  pathname: string;
  isCollapsed: boolean;
  onNavigate?: () => void;
}

const NavigationItemComponent: React.FC<NavigationItemProps> = React.memo(({
  item,
  pathname,
  isCollapsed,
  onNavigate,
}) => {
  const isActive = useMemo(() => {
    if (item.href) {
      // Exact match for home page, prefix match for others
      return item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
    }
    return false;
  }, [item.href, pathname]);

  const hasActiveChild = useMemo(() => {
    if (!item.children) return false;
    return item.children.some((child) => {
      if (child.href) {
        return child.href === '/' ? pathname === '/' : pathname.startsWith(child.href);
      }
      return false;
    });
  }, [item.children, pathname]);

  const Icon = item.icon;

  // Single navigation item (leaf node)
  if (item.href && !item.children?.length) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
          'hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          isActive
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-r-2 border-primary-500'
            : 'text-gray-700 dark:text-gray-300',
          isCollapsed ? 'justify-center px-2' : 'justify-start'
        )}
        title={isCollapsed ? item.label : undefined}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon
          className={cn(
            'flex-shrink-0 transition-colors duration-200',
            isActive
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300',
            isCollapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'
          )}
          aria-hidden="true"
        />
        {!isCollapsed && (
          <span className="truncate">{item.label}</span>
        )}
      </Link>
    );
  }

  // Parent navigation item with children (using Headless UI Disclosure)
  if (item.children?.length) {
    return (
      <Disclosure
        as="div"
        defaultOpen={hasActiveChild}
        className="space-y-1"
      >
        {({ open }) => (
          <>
            <Disclosure.Button
              className={cn(
                'group w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
                'hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                hasActiveChild
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300',
                isCollapsed ? 'justify-center px-2' : 'justify-between'
              )}
              title={isCollapsed ? item.label : undefined}
              aria-expanded={open}
            >
              <div className="flex items-center">
                <Icon
                  className={cn(
                    'flex-shrink-0 transition-colors duration-200',
                    hasActiveChild
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300',
                    isCollapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'
                  )}
                  aria-hidden="true"
                />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </div>
              {!isCollapsed && (
                <ChevronRightIcon
                  className={cn(
                    'ml-auto h-4 w-4 flex-shrink-0 transition-transform duration-200',
                    open ? 'rotate-90' : 'rotate-0',
                    hasActiveChild
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                  )}
                  aria-hidden="true"
                />
              )}
            </Disclosure.Button>

            {!isCollapsed && (
              <Disclosure.Panel className="space-y-1">
                <div className="pl-6 space-y-1">
                  {item.children.map((child) => (
                    <NavigationItemComponent
                      key={child.id}
                      item={child}
                      pathname={pathname}
                      isCollapsed={false}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </Disclosure.Panel>
            )}
          </>
        )}
      </Disclosure>
    );
  }

  // Fallback for items without href or children
  return null;
});

NavigationItemComponent.displayName = 'NavigationItem';

/**
 * Sidebar toggle button component
 */
interface SidebarToggleProps {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

const SidebarToggle: React.FC<SidebarToggleProps> = ({
  isCollapsed,
  onToggle,
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex items-center justify-center p-2 text-gray-600 dark:text-gray-400',
        'hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'rounded-md transition-colors duration-200',
        className
      )}
      aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {isCollapsed ? (
        <Bars3Icon className="h-5 w-5" aria-hidden="true" />
      ) : (
        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
};

/**
 * Main sidebar navigation component with responsive behavior and permission filtering
 * 
 * Features:
 * - Dynamic menu generation based on user permissions
 * - Responsive collapse/expand behavior using Zustand state management
 * - Active route highlighting with Next.js usePathname hook
 * - Hierarchical navigation structure with Headless UI disclosure components
 * - Accessibility-compliant navigation with WCAG 2.1 AA compliance
 * - Smooth transitions and animations using Tailwind CSS utilities
 */
export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();
  const { sidebar, setSidebar, toggleSidebarCollapse } = useSidebar();

  // Filter navigation items based on user permissions
  const filteredNavigation = useMemo(() => {
    if (!user) return [];

    const filterItems = (items: NavigationItem[]): NavigationItem[] => {
      return items
        .filter((item) => {
          // Check if user has required permissions for this item
          if (item.permissions.length === 0) return true;
          return item.permissions.some((permission) => hasPermission(permission));
        })
        .map((item) => {
          // Recursively filter children
          if (item.children) {
            const filteredChildren = filterItems(item.children);
            return {
              ...item,
              children: filteredChildren.length > 0 ? filteredChildren : undefined,
            };
          }
          return item;
        })
        .filter((item) => {
          // Remove parent items that have no accessible children and no direct href
          if (!item.href && !item.children?.length) return false;
          return true;
        });
    };

    return filterItems(NAVIGATION_MENU);
  }, [user, hasPermission]);

  // Handle mobile sidebar close on navigation
  const handleNavigate = useCallback(() => {
    if (sidebar.isOverlay) {
      setSidebar({ isOpen: false });
    }
  }, [sidebar.isOverlay, setSidebar]);

  // Responsive behavior - detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth < 1024;

      setSidebar({
        isOverlay: isMobile,
        isCollapsed: isMobile ? false : sidebar.isCollapsed,
        isOpen: isMobile ? false : true,
      });
    };

    // Set initial state
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebar, sidebar.isCollapsed]);

  // Don't render sidebar if user is not authenticated
  if (!user) {
    return null;
  }

  const sidebarWidth = sidebar.isCollapsed ? sidebar.collapsedWidth : sidebar.width;

  return (
    <>
      {/* Mobile Overlay */}
      {sidebar.isOverlay && sidebar.isOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebar({ isOpen: false })}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <div
        className={cn(
          'flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800',
          'transition-all duration-300 ease-in-out z-30',
          sidebar.isOverlay
            ? cn(
                'fixed inset-y-0 left-0 md:relative',
                sidebar.isOpen ? 'translate-x-0' : '-translate-x-full'
              )
            : 'relative',
          sidebar.isOverlay && sidebar.isOpen ? 'shadow-xl' : 'shadow-sm'
        )}
        style={{
          width: sidebar.isOverlay ? sidebar.width : sidebarWidth,
          minWidth: sidebar.isOverlay ? sidebar.width : sidebarWidth,
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Sidebar Header */}
        <div className={cn(
          'flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800',
          sidebar.isCollapsed && !sidebar.isOverlay ? 'justify-center' : 'justify-between'
        )}>
          {(!sidebar.isCollapsed || sidebar.isOverlay) && (
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-primary-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">DF</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  DreamFactory
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Admin Console
                </span>
              </div>
            </div>
          )}

          {sidebar.isCollapsed && !sidebar.isOverlay && (
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-primary-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">DF</span>
              </div>
            </div>
          )}

          {/* Toggle button - only show on desktop */}
          {!sidebar.isOverlay && (
            <SidebarToggle
              isCollapsed={sidebar.isCollapsed}
              onToggle={toggleSidebarCollapse}
            />
          )}

          {/* Close button - only show on mobile overlay */}
          {sidebar.isOverlay && (
            <button
              type="button"
              onClick={() => setSidebar({ isOpen: false })}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              aria-label="Close sidebar"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
          'p-4 space-y-2'
        )}>
          {filteredNavigation.map((item) => (
            <NavigationItemComponent
              key={item.id}
              item={item}
              pathname={pathname}
              isCollapsed={sidebar.isCollapsed && !sidebar.isOverlay}
              onNavigate={handleNavigate}
            />
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className={cn(
          'border-t border-gray-200 dark:border-gray-800 p-4',
          sidebar.isCollapsed && !sidebar.isOverlay ? 'text-center' : ''
        )}>
          {(!sidebar.isCollapsed || sidebar.isOverlay) && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center justify-between">
                <span>Version 5.0.0</span>
                <span>{user.name}</span>
              </div>
            </div>
          )}

          {sidebar.isCollapsed && !sidebar.isOverlay && (
            <div className="flex justify-center">
              <div className="h-2 w-2 bg-green-500 rounded-full" title="System Online" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;