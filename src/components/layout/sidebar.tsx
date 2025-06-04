'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Disclosure, Transition } from '@headlessui/react';
import { 
  ChevronRightIcon, 
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  CogIcon,
  DatabaseIcon,
  ShieldCheckIcon,
  UsersIcon,
  DocumentTextIcon,
  FolderIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useAuth } from '@/hooks/use-auth';
import { useNavigation } from '@/hooks/use-navigation';

/**
 * Navigation item interface supporting hierarchical menu structure
 */
interface NavigationItem {
  id: string;
  path: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  subRoutes?: NavigationItem[];
  permissions?: string[];
  disabled?: boolean;
  isCommercialFeature?: boolean;
}

/**
 * Main navigation sidebar component with responsive behavior, collapsible design, 
 * and dynamic menu generation. Provides hierarchical navigation structure, 
 * active route highlighting, and user-based menu filtering.
 * 
 * Features:
 * - Responsive collapse/expand behavior
 * - Permission-based route filtering
 * - Hierarchical menu with expansion panels
 * - Active route highlighting
 * - Smooth animations and transitions
 * - WCAG 2.1 AA compliance
 */
export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const { user, isAuthenticated } = useAuth();
  const { navigationItems } = useNavigation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Filter navigation items based on user permissions
  const filteredNavigation = useMemo(() => {
    if (!isAuthenticated || !user) return [];
    
    return navigationItems.filter((item) => {
      if (!item.permissions || item.permissions.length === 0) return true;
      return item.permissions.some(permission => 
        user.permissions?.includes(permission) || user.isRootAdmin
      );
    });
  }, [navigationItems, user, isAuthenticated]);

  // Auto-expand parent items when child routes are active
  useEffect(() => {
    const activeParents = new Set<string>();
    
    filteredNavigation.forEach((item) => {
      if (item.subRoutes) {
        const hasActiveChild = item.subRoutes.some(subRoute => 
          pathname.startsWith(subRoute.path)
        );
        if (hasActiveChild) {
          activeParents.add(item.id);
        }
      }
    });
    
    setExpandedItems(activeParents);
  }, [pathname, filteredNavigation]);

  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const isItemActive = useCallback((item: NavigationItem): boolean => {
    if (pathname === item.path) return true;
    
    if (item.subRoutes) {
      return item.subRoutes.some(subRoute => pathname.startsWith(subRoute.path));
    }
    
    return pathname.startsWith(item.path) && item.path !== '/';
  }, [pathname]);

  const isSubItemActive = useCallback((subItem: NavigationItem): boolean => {
    return pathname === subItem.path || pathname.startsWith(subItem.path);
  }, [pathname]);

  // Mobile overlay handler
  const handleMobileOverlayClick = useCallback(() => {
    if (window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }
  }, [setSidebarCollapsed]);

  if (!isAuthenticated) {
    return (
      <aside className="hidden lg:flex lg:w-80 lg:flex-col bg-primary-900 text-white">
        <div className="flex-1 flex flex-col justify-center items-center p-8">
          <div className="grid grid-cols-2 gap-8 text-center">
            <div className="space-y-4">
              <img 
                src="/assets/img/Server-Stack.gif" 
                alt="Self Hosted" 
                className="w-20 h-20 mx-auto"
              />
              <h3 className="text-lg font-semibold">Self Hosted</h3>
            </div>
            <div className="space-y-4">
              <img 
                src="/assets/img/API.gif" 
                alt="API Generation" 
                className="w-20 h-20 mx-auto"
              />
              <h3 className="text-lg font-semibold">
                Database & Network<br />
                API Generation
              </h3>
            </div>
            <div className="space-y-4">
              <img 
                src="/assets/img/Browser.gif" 
                alt="API Security" 
                className="w-20 h-20 mx-auto"
              />
              <h3 className="text-lg font-semibold">API Security</h3>
            </div>
            <div className="space-y-4">
              <img 
                src="/assets/img/Tools.gif" 
                alt="API Scripting" 
                className="w-20 h-20 mx-auto"
              />
              <h3 className="text-lg font-semibold">API Scripting</h3>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={handleMobileOverlayClick}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          "bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700",
          sidebarCollapsed ? "-translate-x-full lg:w-20" : "translate-x-0"
        )}
        aria-label="Main navigation"
      >
        {/* Mobile Close Button */}
        <div className="lg:hidden absolute top-4 right-4">
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex flex-col h-full">
          {/* Logo/Brand Area */}
          <div className={cn(
            "p-6 border-b border-gray-200 dark:border-gray-700",
            sidebarCollapsed && "lg:p-3"
          )}>
            <Link 
              href="/" 
              className="flex items-center space-x-3"
              aria-label="DreamFactory Admin Console"
            >
              <img 
                src="/assets/img/logo.png" 
                alt="DreamFactory Logo" 
                className={cn(
                  "transition-all duration-300",
                  sidebarCollapsed ? "lg:h-8 lg:w-8" : "h-10 w-10"
                )}
              />
              {!sidebarCollapsed && (
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  DreamFactory
                </span>
              )}
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav 
            className="flex-1 px-4 py-6 space-y-2 overflow-y-auto"
            aria-label="Primary navigation"
          >
            {filteredNavigation.map((item) => (
              <NavigationItemComponent
                key={item.id}
                item={item}
                isActive={isItemActive(item)}
                isExpanded={expandedItems.has(item.id)}
                onToggleExpanded={() => toggleExpanded(item.id)}
                isCollapsed={sidebarCollapsed}
                pathname={pathname}
                isSubItemActive={isSubItemActive}
              />
            ))}
          </nav>

          {/* Collapse Toggle (Desktop Only) */}
          <div className="hidden lg:block p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={cn(
                "w-full flex items-center justify-center p-2 rounded-md",
                "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                "dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800",
                "transition-colors duration-200"
              )}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRightIcon className="h-5 w-5" />
              ) : (
                <>
                  <Bars3Icon className="h-5 w-5 mr-2" />
                  <span className="text-sm">Collapse</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

/**
 * Individual navigation item component with support for nested items
 */
interface NavigationItemComponentProps {
  item: NavigationItem;
  isActive: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  isCollapsed: boolean;
  pathname: string;
  isSubItemActive: (subItem: NavigationItem) => boolean;
}

function NavigationItemComponent({
  item,
  isActive,
  isExpanded,
  onToggleExpanded,
  isCollapsed,
  pathname,
  isSubItemActive
}: NavigationItemComponentProps) {
  const hasSubRoutes = item.subRoutes && item.subRoutes.length > 0;
  const IconComponent = item.icon || HomeIcon;

  if (hasSubRoutes) {
    return (
      <Disclosure as="div">
        {({ open }) => (
          <>
            <Disclosure.Button
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg text-left",
                "transition-all duration-200",
                isActive
                  ? "bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                item.disabled && "opacity-50 cursor-not-allowed",
                item.isCommercialFeature && "relative"
              )}
              onClick={onToggleExpanded}
              disabled={item.disabled}
              aria-expanded={isExpanded}
              aria-label={`${item.label} menu`}
            >
              <div className="flex items-center space-x-3">
                <IconComponent 
                  className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive ? "text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-gray-400"
                  )} 
                />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </div>
              
              {!isCollapsed && (
                <ChevronRightIcon
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isExpanded && "rotate-90"
                  )}
                />
              )}

              {/* Commercial Feature Lock Icon */}
              {item.isCommercialFeature && !isCollapsed && (
                <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                  <ShieldCheckIcon className="h-4 w-4 text-yellow-500" />
                </div>
              )}
            </Disclosure.Button>

            <Transition
              show={isExpanded && !isCollapsed}
              enter="transition duration-200 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-150 ease-in"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Disclosure.Panel className="mt-2 ml-8 space-y-1">
                {item.subRoutes?.map((subItem) => (
                  <Link
                    key={subItem.id}
                    href={subItem.path}
                    className={cn(
                      "flex items-center space-x-3 p-2 rounded-md transition-colors duration-200",
                      isSubItemActive(subItem)
                        ? "bg-primary-50 text-primary-700 border-r-2 border-primary-600 dark:bg-primary-900/50 dark:text-primary-300"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300",
                      subItem.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                    )}
                    aria-current={isSubItemActive(subItem) ? "page" : undefined}
                  >
                    {subItem.icon && (
                      <subItem.icon className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="text-sm">{subItem.label}</span>
                    
                    {subItem.isCommercialFeature && (
                      <ShieldCheckIcon className="h-3 w-3 text-yellow-500 ml-auto" />
                    )}
                  </Link>
                ))}
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>
    );
  }

  return (
    <Link
      href={item.path}
      className={cn(
        "flex items-center space-x-3 p-3 rounded-lg transition-all duration-200",
        isActive
          ? "bg-primary-100 text-primary-900 border-r-4 border-primary-600 dark:bg-primary-900 dark:text-primary-100"
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100",
        item.disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        item.isCommercialFeature && "relative"
      )}
      aria-current={isActive ? "page" : undefined}
      title={isCollapsed ? item.label : undefined}
    >
      <IconComponent 
        className={cn(
          "h-5 w-5 flex-shrink-0",
          isActive ? "text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-gray-400"
        )} 
      />
      
      {!isCollapsed && (
        <>
          <span className="font-medium">{item.label}</span>
          
          {/* Commercial Feature Lock Icon */}
          {item.isCommercialFeature && (
            <ShieldCheckIcon className="h-4 w-4 text-yellow-500 ml-auto" />
          )}
        </>
      )}
    </Link>
  );
}

// Default navigation structure
export const defaultNavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    path: '/',
    label: 'Dashboard',
    icon: HomeIcon,
  },
  {
    id: 'api-connections',
    path: '/api-connections',
    label: 'API Connections',
    icon: DatabaseIcon,
    subRoutes: [
      {
        id: 'database-services',
        path: '/api-connections/database',
        label: 'Database Services',
        icon: DatabaseIcon,
      },
    ],
  },
  {
    id: 'api-security',
    path: '/api-security',
    label: 'API Security',
    icon: ShieldCheckIcon,
    subRoutes: [
      {
        id: 'roles',
        path: '/api-security/roles',
        label: 'Roles',
        icon: UsersIcon,
      },
      {
        id: 'limits',
        path: '/api-security/limits',
        label: 'Rate Limits',
        icon: ClockIcon,
      },
    ],
  },
  {
    id: 'admin-settings',
    path: '/admin-settings',
    label: 'Admin Settings',
    icon: UsersIcon,
    permissions: ['admin'],
  },
  {
    id: 'system-settings',
    path: '/system-settings',
    label: 'System Settings',
    icon: CogIcon,
    subRoutes: [
      {
        id: 'system-info',
        path: '/system-settings/system-info',
        label: 'System Info',
        icon: DocumentTextIcon,
      },
      {
        id: 'cache',
        path: '/system-settings/cache',
        label: 'Cache',
        icon: FolderIcon,
      },
    ],
    permissions: ['system_admin'],
  },
];