'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  CircleStackIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/use-auth';
import { useNavigation } from '@/hooks/use-navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SearchDialog } from '@/components/ui/search-dialog';
import type { NavigationItem, BreadcrumbItem } from '@/types/navigation';
import type { UserProfile } from '@/types/user';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface SideNavProps {
  /** Optional additional CSS classes */
  className?: string;
  /** Whether to show mobile navigation by default */
  defaultMobileOpen?: boolean;
  /** Callback when mobile navigation state changes */
  onMobileToggle?: (isOpen: boolean) => void;
}

interface LicenseStatus {
  isExpired: boolean;
  expiryDate?: string;
  daysRemaining?: number;
  licenseType?: string;
  features?: string[];
}

interface UserMenuData {
  profile: UserProfile;
  preferences: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'system';
  };
}

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

const SIDEBAR_QUERY_KEYS = {
  license: ['license', 'status'] as const,
  userMenu: ['user', 'menu'] as const,
  i18n: ['i18n', 'navigation'] as const,
} as const;

// Static navigation structure matching Angular df-side-nav
const STATIC_NAVIGATION: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: HomeIcon,
    permissions: [],
    description: 'Main dashboard overview',
  },
  {
    id: 'api-connections',
    label: 'API Connections',
    href: '/api-connections',
    icon: CircleStackIcon,
    permissions: ['api-connections.read'],
    description: 'Manage database and service connections',
    children: [
      {
        id: 'database-services',
        label: 'Database Services',
        href: '/api-connections/database',
        icon: CircleStackIcon,
        permissions: ['database-services.read'],
        description: 'Manage database service configurations',
      },
    ],
  },
  {
    id: 'api-security',
    label: 'API Security',
    href: '/api-security',
    icon: ShieldCheckIcon,
    permissions: ['api-security.read'],
    description: 'Manage API security and access control',
    children: [
      {
        id: 'roles',
        label: 'Roles',
        href: '/api-security/roles',
        icon: UserGroupIcon,
        permissions: ['roles.read'],
        description: 'Manage user roles and permissions',
      },
      {
        id: 'limits',
        label: 'API Limits',
        href: '/api-security/limits',
        icon: ShieldCheckIcon,
        permissions: ['limits.read'],
        description: 'Configure API usage limits',
      },
    ],
  },
  {
    id: 'admin-settings',
    label: 'Admin Settings',
    href: '/admin-settings',
    icon: UserGroupIcon,
    permissions: ['admin.read'],
    description: 'Manage administrators and users',
    children: [
      {
        id: 'admins',
        label: 'Administrators',
        href: '/admin-settings/admins',
        icon: UserGroupIcon,
        permissions: ['admins.read'],
        description: 'Manage system administrators',
      },
      {
        id: 'users',
        label: 'Users',
        href: '/admin-settings/users',
        icon: UserCircleIcon,
        permissions: ['users.read'],
        description: 'Manage application users',
      },
    ],
  },
  {
    id: 'system-settings',
    label: 'System Settings',
    href: '/system-settings',
    icon: Cog6ToothIcon,
    permissions: ['system.read'],
    description: 'Configure system-wide settings',
    children: [
      {
        id: 'system-info',
        label: 'System Info',
        href: '/system-settings/system-info',
        icon: DocumentTextIcon,
        permissions: ['config.read'],
        description: 'View system information and status',
      },
      {
        id: 'email-templates',
        label: 'Email Templates',
        href: '/system-settings/email-templates',
        icon: DocumentTextIcon,
        permissions: ['email-templates.read'],
        description: 'Manage email templates',
      },
      {
        id: 'cors',
        label: 'CORS',
        href: '/system-settings/cors',
        icon: GlobeAltIcon,
        permissions: ['cors.read'],
        description: 'Configure CORS settings',
      },
      {
        id: 'cache',
        label: 'Cache',
        href: '/system-settings/cache',
        icon: Cog6ToothIcon,
        permissions: ['cache.read'],
        description: 'Manage system cache',
      },
      {
        id: 'scheduler',
        label: 'Scheduler',
        href: '/system-settings/scheduler',
        icon: Cog6ToothIcon,
        permissions: ['scheduler.read'],
        description: 'Manage scheduled tasks',
      },
      {
        id: 'reports',
        label: 'Reports',
        href: '/system-settings/reports',
        icon: DocumentTextIcon,
        permissions: ['reports.read'],
        description: 'View system reports',
      },
      {
        id: 'lookup-keys',
        label: 'Lookup Keys',
        href: '/system-settings/lookup-keys',
        icon: Cog6ToothIcon,
        permissions: ['lookup-keys.read'],
        description: 'Manage lookup keys',
      },
    ],
  },
  {
    id: 'api-docs',
    label: 'API Documentation',
    href: '/api-docs',
    icon: DocumentTextIcon,
    permissions: ['api-docs.read'],
    description: 'View API documentation',
  },
];

// =============================================================================
// API FUNCTIONS
// =============================================================================

async function fetchLicenseStatus(): Promise<LicenseStatus> {
  // In production, this would make an API call to check license status
  // For now, return mock data
  return {
    isExpired: false,
    expiryDate: '2024-12-31',
    daysRemaining: 90,
    licenseType: 'Professional',
    features: ['unlimited_apis', 'advanced_security', 'priority_support'],
  };
}

async function fetchUserMenuData(userId: number): Promise<UserMenuData> {
  // In production, this would fetch user preferences and profile data
  // For now, return mock data based on user
  return {
    profile: {
      id: userId,
      username: 'admin',
      email: 'admin@dreamfactory.com',
      first_name: 'System',
      last_name: 'Administrator',
      display_name: 'System Administrator',
      is_active: true,
    },
    preferences: {
      language: 'en',
      timezone: 'UTC',
      theme: 'system',
    },
  };
}

async function fetchNavigationTranslations(language: string = 'en'): Promise<Record<string, string>> {
  // In production, this would fetch i18n translations
  // For now, return default English labels
  return {
    'nav.dashboard': 'Dashboard',
    'nav.api-connections': 'API Connections',
    'nav.database-services': 'Database Services',
    'nav.api-security': 'API Security',
    'nav.roles': 'Roles',
    'nav.limits': 'API Limits',
    'nav.admin-settings': 'Admin Settings',
    'nav.admins': 'Administrators',
    'nav.users': 'Users',
    'nav.system-settings': 'System Settings',
    'nav.system-info': 'System Info',
    'nav.email-templates': 'Email Templates',
    'nav.cors': 'CORS',
    'nav.cache': 'Cache',
    'nav.scheduler': 'Scheduler',
    'nav.reports': 'Reports',
    'nav.lookup-keys': 'Lookup Keys',
    'nav.api-docs': 'API Documentation',
    'nav.profile': 'Profile Settings',
    'nav.logout': 'Sign Out',
    'nav.search': 'Search',
    'nav.collapse': 'Collapse sidebar',
    'nav.expand': 'Expand sidebar',
    'banner.license-expired': 'Your license has expired. Some features may be limited.',
    'banner.license-expiring': 'Your license expires in {days} days.',
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

function isActiveRoute(pathname: string, itemHref?: string): boolean {
  if (!itemHref) return false;
  if (itemHref === '/') return pathname === '/';
  return pathname.startsWith(itemHref);
}

function hasActiveChild(item: NavigationItem, pathname: string): boolean {
  if (!item.children) return false;
  return item.children.some(child => 
    isActiveRoute(pathname, child.href) || hasActiveChild(child, pathname)
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * SideNav - Main React navigation component migrated from Angular df-side-nav
 * 
 * Implements responsive side navigation with:
 * - Mobile drawer functionality using Headless UI
 * - Toolbar with theme toggle, search, and user profile menu
 * - Breadcrumb navigation with route hierarchy
 * - License-expired banner with notification system
 * - React Query for data fetching and caching
 * - Zustand for navigation state management
 * - WCAG 2.1 AA accessibility compliance
 * - Next.js routing integration
 * 
 * @param props SideNavProps configuration object
 * @returns JSX.Element representing the complete navigation interface
 */
export function SideNav({ 
  className,
  defaultMobileOpen = false,
  onMobileToggle 
}: SideNavProps): JSX.Element {
  // =============================================================================
  // HOOKS AND STATE
  // =============================================================================

  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hasPermission, logout } = useAuth();
  const { breadcrumbs, filteredNavigationItems } = useNavigation();
  
  // Local component state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(defaultMobileOpen);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  // Refs for focus management
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  // =============================================================================
  // REACT QUERY DATA FETCHING
  // =============================================================================

  // License status query with caching
  const licenseQuery = useQuery({
    queryKey: SIDEBAR_QUERY_KEYS.license,
    queryFn: fetchLicenseStatus,
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // User menu data query
  const userMenuQuery = useQuery({
    queryKey: SIDEBAR_QUERY_KEYS.userMenu,
    queryFn: () => fetchUserMenuData(user?.id || 0),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  });

  // Navigation translations query
  const translationsQuery = useQuery({
    queryKey: SIDEBAR_QUERY_KEYS.i18n,
    queryFn: () => fetchNavigationTranslations('en'),
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 120 * 60 * 1000, // 2 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen(prev => {
      const newState = !prev;
      onMobileToggle?.(newState);
      return newState;
    });
  }, [onMobileToggle]);

  const handleSearchToggle = useCallback(() => {
    setSearchOpen(prev => !prev);
  }, []);

  const handleNavigationItemClick = useCallback((item: NavigationItem) => {
    if (item.href) {
      router.push(item.href);
      // Close mobile menu on navigation
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
        onMobileToggle?.(false);
      }
    } else if (item.children) {
      // Toggle expansion for parent items
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    }
  }, [router, mobileMenuOpen, onMobileToggle]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout, router]);

  const handleSearchSubmit = useCallback((query: string) => {
    setSearchQuery(query);
    // Open search dialog with query
    setSearchOpen(true);
  }, []);

  // =============================================================================
  // KEYBOARD EVENT HANDLERS
  // =============================================================================

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Global search shortcut (Cmd/Ctrl + K)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      
      // Escape to close mobile menu
      if (event.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
        onMobileToggle?.(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen, onMobileToggle]);

  // =============================================================================
  // AUTO-EXPAND ACTIVE ITEMS
  // =============================================================================

  useEffect(() => {
    // Auto-expand navigation items that contain the active route
    const expandActiveItems = () => {
      const newExpandedItems = new Set<string>();
      
      const checkAndExpand = (items: NavigationItem[]) => {
        items.forEach(item => {
          if (item.children) {
            const hasActive = hasActiveChild(item, pathname);
            if (hasActive) {
              newExpandedItems.add(item.id);
              checkAndExpand(item.children);
            }
          }
        });
      };
      
      checkAndExpand(STATIC_NAVIGATION);
      setExpandedItems(newExpandedItems);
    };

    expandActiveItems();
  }, [pathname]);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const translations = translationsQuery.data || {};
  const licenseStatus = licenseQuery.data;
  const shouldShowLicenseBanner = licenseStatus?.isExpired || 
    (licenseStatus?.daysRemaining !== undefined && licenseStatus.daysRemaining <= 30);

  // Filter navigation items based on user permissions
  const visibleNavigation = STATIC_NAVIGATION.filter(item => {
    if (item.permissions.length === 0) return true;
    return item.permissions.some(permission => hasPermission(permission));
  }).map(item => ({
    ...item,
    children: item.children?.filter(child => {
      if (child.permissions.length === 0) return true;
      return child.permissions.some(permission => hasPermission(permission));
    }),
  }));

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isActive = isActiveRoute(pathname, item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const hasActiveDescendant = hasActiveChild(item, pathname);
    
    const itemClasses = classNames(
      'flex items-center w-full px-3 py-2 text-sm font-medium transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
      level === 0 ? 'mx-2 rounded-lg' : 'ml-6 mr-2 rounded-md',
      isActive
        ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
        : hasActiveDescendant
        ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
    );

    const iconClasses = classNames(
      'h-5 w-5 flex-shrink-0',
      level === 0 ? 'mr-3' : 'mr-2',
      isActive
        ? 'text-primary-600 dark:text-primary-400'
        : 'text-gray-500 dark:text-gray-400'
    );

    return (
      <div key={item.id}>
        <button
          type="button"
          className={itemClasses}
          onClick={() => handleNavigationItemClick(item)}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-label={item.description}
          title={sidebarCollapsed ? item.label : undefined}
        >
          <item.icon 
            className={iconClasses} 
            aria-hidden="true" 
          />
          {!sidebarCollapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {hasChildren && (
                <ChevronRightIcon
                  className={classNames(
                    'h-4 w-4 ml-auto transition-transform duration-200',
                    isExpanded ? 'rotate-90' : '',
                    'text-gray-400 dark:text-gray-500'
                  )}
                  aria-hidden="true"
                />
              )}
              {item.badge && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                  {item.badge}
                </span>
              )}
            </>
          )}
        </button>
        
        {hasChildren && isExpanded && !sidebarCollapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderBreadcrumbs = () => {
    if (breadcrumbs.length <= 1) return null;

    return (
      <nav className="flex mb-4" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          {breadcrumbs.map((item, index) => (
            <li key={item.href || index} className="flex items-center">
              {index > 0 && (
                <ChevronRightIcon
                  className="h-3 w-3 text-gray-400 mx-2"
                  aria-hidden="true"
                />
              )}
              {item.current ? (
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => item.href && router.push(item.href)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                >
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  const renderLicenseBanner = () => {
    if (!shouldShowLicenseBanner || !licenseStatus) return null;

    const bannerMessage = licenseStatus.isExpired
      ? translations['banner.license-expired'] || 'Your license has expired. Some features may be limited.'
      : translations['banner.license-expiring']?.replace('{days}', String(licenseStatus.daysRemaining)) ||
        `Your license expires in ${licenseStatus.daysRemaining} days.`;

    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 dark:bg-yellow-900/20 dark:border-yellow-500">
        <div className="flex">
          <ExclamationTriangleIcon
            className="h-5 w-5 text-yellow-400"
            aria-hidden="true"
          />
          <div className="ml-3">
            <p className="text-sm text-yellow-700 dark:text-yellow-200">
              {bannerMessage}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderUserMenu = () => {
    if (!user) return null;

    const userDisplayName = user.display_name || 
      (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username);

    return (
      <Menu as="div" className="relative">
        <Menu.Button className="flex items-center w-full px-3 py-2 text-sm font-medium text-left text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200">
          <UserCircleIcon className="h-6 w-6 mr-3 text-gray-500 dark:text-gray-400" />
          {!sidebarCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {userDisplayName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
              <ChevronDownIcon className="h-4 w-4 ml-2 text-gray-400" />
            </>
          )}
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={() => router.push('/profile')}
                    className={classNames(
                      'flex items-center w-full px-4 py-2 text-sm',
                      active
                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                        : 'text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <UserCircleIcon className="h-4 w-4 mr-3" />
                    {translations['nav.profile'] || 'Profile Settings'}
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={classNames(
                      'flex items-center w-full px-4 py-2 text-sm',
                      active
                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                        : 'text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                    {translations['nav.logout'] || 'Sign Out'}
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    );
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  if (!isAuthenticated) {
    return <div className="hidden" aria-hidden="true" />;
  }

  return (
    <>
      {/* Mobile menu overlay */}
      <Disclosure as="div" className="lg:hidden">
        {({ open }) => (
          <>
            {/* Mobile menu button */}
            <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 dark:border-gray-700 dark:bg-gray-900">
              <button
                ref={mobileMenuButtonRef}
                type="button"
                className="-m-2.5 p-2.5 text-gray-700 lg:hidden dark:text-gray-300"
                onClick={handleMobileMenuToggle}
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              >
                <span className="sr-only">
                  {mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                </span>
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                )}
              </button>

              {/* Mobile header content */}
              <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <div className="flex flex-1 items-center justify-between">
                  <div className="flex items-center">
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      DreamFactory
                    </h1>
                  </div>
                  
                  <div className="flex items-center gap-x-4">
                    {/* Mobile search button */}
                    <button
                      type="button"
                      onClick={handleSearchToggle}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      aria-label={translations['nav.search'] || 'Search'}
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    
                    {/* Mobile theme toggle */}
                    <ThemeToggle size="sm" variant="ghost" />
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile navigation panel */}
            <Transition
              show={mobileMenuOpen}
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 z-50 lg:hidden">
                <div 
                  className="fixed inset-0 bg-gray-900/80" 
                  aria-hidden="true"
                  onClick={handleMobileMenuToggle}
                />
                <div className="fixed inset-y-0 left-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:bg-gray-900 dark:ring-white/10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Navigation
                    </h2>
                    <button
                      type="button"
                      className="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-300"
                      onClick={handleMobileMenuToggle}
                      aria-label="Close navigation menu"
                    >
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  
                  {/* Mobile navigation items */}
                  <nav className="mt-6">
                    <div className="space-y-2">
                      {visibleNavigation.map(item => renderNavigationItem(item))}
                    </div>
                  </nav>
                  
                  {/* Mobile user menu */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    {renderUserMenu()}
                  </div>
                </div>
              </div>
            </Transition>
          </>
        )}
      </Disclosure>

      {/* Desktop sidebar */}
      <div className={classNames(
        'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col',
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-72',
        'transition-all duration-300 ease-in-out',
        className
      )}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4 dark:border-gray-700 dark:bg-gray-900">
          {/* Logo and sidebar toggle */}
          <div className="flex h-16 shrink-0 items-center justify-between">
            <div className="flex items-center">
              {!sidebarCollapsed && (
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  DreamFactory
                </h1>
              )}
            </div>
            <button
              type="button"
              onClick={handleSidebarToggle}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
              aria-label={sidebarCollapsed ? translations['nav.expand'] || 'Expand sidebar' : translations['nav.collapse'] || 'Collapse sidebar'}
            >
              <ChevronRightIcon 
                className={classNames(
                  'h-5 w-5 transition-transform duration-200',
                  sidebarCollapsed ? 'rotate-0' : 'rotate-180'
                )}
                aria-hidden="true"
              />
            </button>
          </div>

          {/* License banner */}
          {!sidebarCollapsed && renderLicenseBanner()}

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {visibleNavigation.map(item => (
                    <li key={item.id}>
                      {renderNavigationItem(item)}
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>

          {/* Desktop toolbar */}
          {!sidebarCollapsed && (
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={handleSearchToggle}
                  className="flex items-center px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                  aria-label={translations['nav.search'] || 'Search'}
                >
                  <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                  {translations['nav.search'] || 'Search'}
                  <kbd className="ml-auto inline-flex items-center rounded border border-gray-200 px-1.5 py-0.5 text-xs font-mono text-gray-500 dark:border-gray-600 dark:text-gray-400">
                    ⌘K
                  </kbd>
                </button>
                
                <div className="flex items-center space-x-2">
                  <ThemeToggle size="sm" variant="ghost" />
                </div>
              </div>
            </div>
          )}

          {/* User profile section */}
          <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            {renderUserMenu()}
          </div>
        </div>
      </div>

      {/* Main content area with breadcrumbs */}
      <div className={classNames(
        'lg:pl-72 transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      )}>
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 dark:border-gray-700 dark:bg-gray-900">
          {renderBreadcrumbs()}
        </div>
      </div>

      {/* Search dialog */}
      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSearch={handleSearchSubmit}
        placeholder={translations['nav.search'] || 'Search...'}
      />
    </>
  );
}

export default SideNav;