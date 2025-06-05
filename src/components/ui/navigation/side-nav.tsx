'use client';

/**
 * SideNav Component - Main Navigation System for DreamFactory Admin Interface
 * 
 * Migrated from Angular df-side-nav component to React 19/Next.js 15.1.
 * Provides comprehensive navigation with responsive design, mobile drawer,
 * toolbar with theme toggle, user profile menu, search functionality,
 * language switcher, breadcrumb navigation, and license-expired banner.
 * 
 * Features:
 * - Responsive side navigation with mobile drawer (Headless UI)
 * - Global search with keyboard shortcuts (Cmd/Ctrl+K)
 * - Theme toggle with dark mode support
 * - User profile menu with logout functionality
 * - Language switcher for i18n support
 * - Breadcrumb navigation with dynamic route detection
 * - License expiration banner for enterprise features
 * - WCAG 2.1 AA accessibility compliance
 * - Zustand state management integration
 * - React Query for server state management
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { 
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition
} from '@headlessui/react';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  UserIcon,
  LanguageIcon,
  ChevronDownIcon,
  XMarkIcon,
  HomeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Component imports
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SearchDialog } from '@/components/ui/search-dialog';

// Hook imports  
import { useAuth } from '@/hooks/use-auth';
import { useNavigation } from '@/hooks/use-navigation';

// Type imports
import type { NavigationItem, User, LicenseStatus, Breadcrumb } from '@/types/navigation';

/**
 * Props interface for SideNav component
 */
export interface SideNavProps {
  /** Additional CSS classes for the component */
  className?: string;
  /** Children to render in the main content area */
  children?: React.ReactNode;
  /** Whether to show the mobile menu button */
  showMobileButton?: boolean;
  /** Custom aria label for the navigation */
  ariaLabel?: string;
  /** Whether to enable search functionality */
  enableSearch?: boolean;
  /** Whether to show the logo */
  showLogo?: boolean;
}

/**
 * Mobile navigation component using Headless UI Disclosure
 */
const MobileNavigation: React.FC<{
  navigationItems: NavigationItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  isFeatureLocked: (path: string) => boolean;
}> = ({ navigationItems, currentPath, onNavigate, isFeatureLocked }) => {
  return (
    <Disclosure>
      {({ open }) => (
        <>
          <DisclosureButton className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors duration-200">
            <span className="sr-only">Open main menu</span>
            {open ? (
              <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
            ) : (
              <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
            )}
          </DisclosureButton>

          <Transition
            enter="duration-150 ease-out"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="duration-100 ease-in"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DisclosurePanel className="md:hidden absolute top-16 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700">
              <nav className="px-4 py-6 space-y-1" aria-label="Mobile navigation">
                {navigationItems.map((item) => (
                  <MobileNavigationItem
                    key={item.path}
                    item={item}
                    currentPath={currentPath}
                    onNavigate={onNavigate}
                    isFeatureLocked={isFeatureLocked}
                    level={0}
                  />
                ))}
              </nav>
            </DisclosurePanel>
          </Transition>
        </>
      )}
    </Disclosure>
  );
};

/**
 * Individual mobile navigation item with subroute support
 */
const MobileNavigationItem: React.FC<{
  item: NavigationItem;
  currentPath: string;
  onNavigate: (path: string) => void;
  isFeatureLocked: (path: string) => boolean;
  level: number;
}> = ({ item, currentPath, onNavigate, isFeatureLocked, level }) => {
  const isActive = currentPath.startsWith(item.path);
  const hasSubRoutes = item.subRoutes && item.subRoutes.length > 0;
  const locked = isFeatureLocked(item.path);

  if (hasSubRoutes) {
    return (
      <Disclosure>
        {({ open }) => (
          <>
            <DisclosureButton
              className={cn(
                'group w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium rounded-md transition-colors duration-200',
                isActive
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
                locked && 'opacity-60 cursor-not-allowed',
                level > 0 && 'ml-4'
              )}
              disabled={locked}
              style={{ paddingLeft: `${12 + level * 16}px` }}
            >
              <div className="flex items-center">
                {item.icon && (
                  <Image
                    src={item.icon}
                    alt=""
                    width={20}
                    height={20}
                    className="mr-3 flex-shrink-0"
                  />
                )}
                <span className="truncate">{item.label}</span>
                {locked && (
                  <ExclamationTriangleIcon className="ml-2 h-4 w-4 text-amber-500" />
                )}
              </div>
              <ChevronDownIcon
                className={cn(
                  'ml-2 h-4 w-4 transform transition-transform duration-200',
                  open ? 'rotate-180' : 'rotate-0'
                )}
              />
            </DisclosureButton>
            <DisclosurePanel className="space-y-1">
              {item.subRoutes?.map((subItem) => (
                <MobileNavigationItem
                  key={subItem.path}
                  item={subItem}
                  currentPath={currentPath}
                  onNavigate={onNavigate}
                  isFeatureLocked={isFeatureLocked}
                  level={level + 1}
                />
              ))}
            </DisclosurePanel>
          </>
        )}
      </Disclosure>
    );
  }

  return (
    <button
      onClick={() => !locked && onNavigate(item.path)}
      disabled={locked}
      className={cn(
        'group w-full flex items-center px-3 py-2 text-left text-sm font-medium rounded-md transition-colors duration-200',
        isActive
          ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
        locked && 'opacity-60 cursor-not-allowed'
      )}
      style={{ paddingLeft: `${12 + level * 16}px` }}
    >
      {item.icon && (
        <Image
          src={item.icon}
          alt=""
          width={20}
          height={20}
          className="mr-3 flex-shrink-0"
        />
      )}
      <span className="truncate">{item.label}</span>
      {locked && (
        <ExclamationTriangleIcon className="ml-2 h-4 w-4 text-amber-500" />
      )}
    </button>
  );
};

/**
 * Desktop sidebar navigation component
 */
const DesktopNavigation: React.FC<{
  navigationItems: NavigationItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  isFeatureLocked: (path: string) => boolean;
  collapsed: boolean;
}> = ({ navigationItems, currentPath, onNavigate, isFeatureLocked, collapsed }) => {
  return (
    <nav className="flex-1 px-4 py-6 space-y-1" aria-label="Sidebar navigation">
      {navigationItems.map((item) => (
        <DesktopNavigationItem
          key={item.path}
          item={item}
          currentPath={currentPath}
          onNavigate={onNavigate}
          isFeatureLocked={isFeatureLocked}
          collapsed={collapsed}
          level={0}
        />
      ))}
    </nav>
  );
};

/**
 * Individual desktop navigation item with expansion support
 */
const DesktopNavigationItem: React.FC<{
  item: NavigationItem;
  currentPath: string;
  onNavigate: (path: string) => void;
  isFeatureLocked: (path: string) => boolean;
  collapsed: boolean;
  level: number;
}> = ({ item, currentPath, onNavigate, isFeatureLocked, collapsed, level }) => {
  const isActive = currentPath.startsWith(item.path);
  const hasSubRoutes = item.subRoutes && item.subRoutes.length > 0;
  const locked = isFeatureLocked(item.path);
  const [expanded, setExpanded] = useState(isActive);

  useEffect(() => {
    if (isActive) {
      setExpanded(true);
    }
  }, [isActive]);

  if (hasSubRoutes) {
    return (
      <div className="space-y-1">
        <Disclosure defaultOpen={isActive}>
          {({ open }) => (
            <>
              <DisclosureButton
                className={cn(
                  'group w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
                  locked && 'opacity-60 cursor-not-allowed'
                )}
                disabled={locked}
                onClick={() => setExpanded(!expanded)}
              >
                <div className="flex items-center min-w-0">
                  {item.icon && (
                    <Image
                      src={item.icon}
                      alt=""
                      width={20}
                      height={20}
                      className={cn(
                        'flex-shrink-0',
                        collapsed ? 'mr-0' : 'mr-3'
                      )}
                    />
                  )}
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>
                {!collapsed && (
                  <div className="flex items-center ml-2">
                    {locked && (
                      <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 mr-1" />
                    )}
                    <ChevronDownIcon
                      className={cn(
                        'h-4 w-4 transform transition-transform duration-200',
                        open ? 'rotate-180' : 'rotate-0'
                      )}
                    />
                  </div>
                )}
              </DisclosureButton>
              {!collapsed && (
                <DisclosurePanel className="space-y-1 ml-6">
                  {item.subRoutes?.map((subItem) => (
                    <DesktopNavigationItem
                      key={subItem.path}
                      item={subItem}
                      currentPath={currentPath}
                      onNavigate={onNavigate}
                      isFeatureLocked={isFeatureLocked}
                      collapsed={false}
                      level={level + 1}
                    />
                  ))}
                </DisclosurePanel>
              )}
            </>
          )}
        </Disclosure>
      </div>
    );
  }

  return (
    <button
      onClick={() => !locked && onNavigate(item.path)}
      disabled={locked}
      className={cn(
        'group w-full flex items-center px-3 py-2 text-left text-sm font-medium rounded-lg transition-all duration-200',
        isActive
          ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 border-r-4 border-primary-600'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
        locked && 'opacity-60 cursor-not-allowed'
      )}
      title={collapsed ? item.label : undefined}
    >
      {item.icon && (
        <Image
          src={item.icon}
          alt=""
          width={20}
          height={20}
          className={cn(
            'flex-shrink-0',
            collapsed ? 'mr-0' : 'mr-3'
          )}
        />
      )}
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
      {!collapsed && locked && (
        <ExclamationTriangleIcon className="ml-2 h-4 w-4 text-amber-500" />
      )}
    </button>
  );
};

/**
 * Breadcrumb navigation component
 */
const BreadcrumbNavigation: React.FC<{
  breadcrumbs: Breadcrumb[];
}> = ({ breadcrumbs }) => {
  if (!breadcrumbs.length) return null;

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.path || index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400 dark:text-gray-600">/</span>
            )}
            {breadcrumb.path && index < breadcrumbs.length - 1 ? (
              <Link
                href={breadcrumb.path}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                {breadcrumb.label}
              </Link>
            ) : (
              <span className="text-gray-900 dark:text-white font-medium">
                {breadcrumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

/**
 * License expiration banner component
 */
const LicenseExpiredBanner: React.FC<{
  licenseStatus: LicenseStatus | null;
}> = ({ licenseStatus }) => {
  if (!licenseStatus || (licenseStatus.status !== 'expired' && licenseStatus.status !== 'unknown')) {
    return null;
  }

  return (
    <div className="bg-red-600 text-white px-6 py-3 text-center">
      <div className="flex items-center justify-center space-x-2">
        <ExclamationTriangleIcon className="h-5 w-5" />
        <span className="font-medium">
          License {licenseStatus.status === 'expired' ? 'Expired' : 'Unknown'}
        </span>
        <span>Please contact support to renew your license.</span>
      </div>
    </div>
  );
};

/**
 * Main SideNav component
 */
export const SideNav: React.FC<SideNavProps> = ({
  className,
  children,
  showMobileButton = true,
  ariaLabel = 'Main navigation',
  enableSearch = true,
  showLogo = true,
  ...props
}) => {
  const router = useRouter();
  const pathname = usePathname();
  
  // Hooks
  const { user, isAuthenticated, logout } = useAuth();
  const { 
    navigationItems, 
    breadcrumbs, 
    sidebarCollapsed, 
    setSidebarCollapsed,
    isFeatureLocked 
  } = useNavigation();

  // Local state
  const [searchOpen, setSearchOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');

  // Queries
  const { data: licenseStatus } = useQuery({
    queryKey: ['license-status'],
    queryFn: async (): Promise<LicenseStatus> => {
      // Mock implementation - replace with actual API call
      return { status: 'active', expiresAt: new Date() };
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Navigation handlers
  const handleNavigate = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  const handleLogout = useCallback(() => {
    logout();
    router.push('/login');
  }, [logout, router]);

  const handleSearchOpen = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const handleLanguageChange = useCallback((language: string) => {
    setCurrentLanguage(language);
    // Update i18n language - implement based on your i18n solution
    localStorage.setItem('language', language);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        handleSearchOpen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSearchOpen]);

  // Available languages - mock data
  const availableLanguages = useMemo(() => [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
  ], []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="p-4 text-center">
              <Image src="/assets/img/Server-Stack.gif" alt="Self Hosted" width={80} height={80} className="mx-auto mb-2" />
              <h3 className="text-white font-medium">Self Hosted</h3>
            </div>
            <div className="p-4 text-center">
              <Image src="/assets/img/API.gif" alt="API Generation" width={80} height={80} className="mx-auto mb-2" />
              <h3 className="text-white font-medium">Database & Network API Generation</h3>
            </div>
            <div className="p-4 text-center">
              <Image src="/assets/img/Browser.gif" alt="API Security" width={80} height={80} className="mx-auto mb-2" />
              <h3 className="text-white font-medium">API Security</h3>
            </div>
            <div className="p-4 text-center">
              <Image src="/assets/img/Tools.gif" alt="API Scripting" width={80} height={80} className="mx-auto mb-2" />
              <h3 className="text-white font-medium">API Scripting</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex h-screen bg-gray-50 dark:bg-gray-900', className)} {...props}>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          'hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-300 ease-in-out z-40',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            {!sidebarCollapsed && showLogo && (
              <Link href="/" className="flex items-center">
                <Image
                  src="/assets/img/logo.png"
                  alt="DreamFactory"
                  width={120}
                  height={32}
                  className="h-8 w-auto"
                />
              </Link>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors duration-200"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <DesktopNavigation
            navigationItems={navigationItems}
            currentPath={pathname}
            onNavigate={handleNavigate}
            isFeatureLocked={isFeatureLocked}
            collapsed={sidebarCollapsed}
          />
        </div>
      </div>

      {/* Main content */}
      <div className={cn('flex flex-col flex-1', 'md:pl-64', sidebarCollapsed && 'md:pl-16')}>
        {/* Top toolbar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Mobile menu button and logo */}
            <div className="flex items-center space-x-4">
              {showMobileButton && (
                <MobileNavigation
                  navigationItems={navigationItems}
                  currentPath={pathname}
                  onNavigate={handleNavigate}
                  isFeatureLocked={isFeatureLocked}
                />
              )}
              {showLogo && (
                <Link href="/" className="md:hidden">
                  <Image
                    src="/assets/img/logo.png"
                    alt="DreamFactory"
                    width={120}
                    height={32}
                    className="h-8 w-auto"
                  />
                </Link>
              )}
            </div>

            {/* Search bar */}
            {enableSearch && (
              <div className="flex-1 max-w-lg mx-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm transition-colors duration-200"
                    placeholder="Search (⌘K)"
                    onFocus={handleSearchOpen}
                    readOnly
                  />
                </div>
              </div>
            )}

            {/* Right side actions */}
            <div className="flex items-center space-x-3">
              {/* Language selector */}
              {availableLanguages.length > 1 && (
                <Menu as="div" className="relative">
                  <MenuButton className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors duration-200">
                    <span className="sr-only">Select language</span>
                    <LanguageIcon className="h-5 w-5" />
                  </MenuButton>
                  <Transition
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <MenuItems className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="py-1">
                        {availableLanguages.map((language) => (
                          <MenuItem key={language.code}>
                            {({ focus }) => (
                              <button
                                onClick={() => handleLanguageChange(language.code)}
                                className={cn(
                                  'block w-full text-left px-4 py-2 text-sm transition-colors duration-200',
                                  focus
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                    : 'text-gray-700 dark:text-gray-300',
                                  currentLanguage === language.code && 'bg-primary-50 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                                )}
                              >
                                {language.name}
                              </button>
                            )}
                          </MenuItem>
                        ))}
                      </div>
                    </MenuItems>
                  </Transition>
                </Menu>
              )}

              {/* Theme toggle */}
              <ThemeToggle />

              {/* User menu */}
              <Menu as="div" className="relative">
                <MenuButton className="flex items-center space-x-2 p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors duration-200">
                  <UserIcon className="h-5 w-5" />
                  {user?.name && (
                    <span className="hidden sm:block text-sm font-medium truncate max-w-32">
                      {user.name}
                    </span>
                  )}
                  <ChevronDownIcon className="h-4 w-4" />
                </MenuButton>
                <Transition
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <MenuItems className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <MenuItem>
                        {({ focus }) => (
                          <Link
                            href="/profile"
                            className={cn(
                              'block px-4 py-2 text-sm transition-colors duration-200',
                              focus
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                : 'text-gray-700 dark:text-gray-300'
                            )}
                          >
                            Profile Settings
                          </Link>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ focus }) => (
                          <button
                            onClick={handleLogout}
                            className={cn(
                              'block w-full text-left px-4 py-2 text-sm transition-colors duration-200',
                              focus
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                : 'text-gray-700 dark:text-gray-300'
                            )}
                          >
                            Sign Out
                          </button>
                        )}
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Transition>
              </Menu>
            </div>
          </div>
        </header>

        {/* License expired banner */}
        <LicenseExpiredBanner licenseStatus={licenseStatus} />

        {/* Breadcrumb navigation */}
        <BreadcrumbNavigation breadcrumbs={breadcrumbs} />

        {/* Main content area */}
        <main 
          className="flex-1 overflow-auto bg-white dark:bg-gray-800"
          role="main"
          aria-label="Main content"
        >
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Search dialog */}
      {enableSearch && (
        <SearchDialog
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};

// Default export for dynamic imports
export default SideNav;