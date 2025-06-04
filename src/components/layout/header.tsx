'use client';

import React, { Fragment, useCallback, useState } from 'react';
import { Menu, Transition, Dialog } from '@headlessui/react';
import { 
  MenuIcon, 
  SearchIcon, 
  LanguagesIcon, 
  UserIcon, 
  ChevronDownIcon,
  BellIcon,
  X
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';

// Types - Based on technical specifications and patterns
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials?: string;
  isRootAdmin?: boolean;
  isSysAdmin?: boolean;
  roleId?: string;
}

interface AuthContext {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

interface SearchFormData {
  query: string;
}

interface AppState {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    timestamp: Date;
    read: boolean;
  }>;
  unreadNotificationCount: number;
}

interface License {
  msg: string;
  type: string;
  expired?: boolean;
}

// Hook placeholders - These would be implemented in the actual dependency files
const useAuth = (): AuthContext => {
  // Placeholder implementation - would come from src/hooks/use-auth.ts
  const user: User = {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: '',
    initials: 'JD',
    isRootAdmin: true
  };

  return {
    user,
    isLoading: false,
    isAuthenticated: !!user,
    logout: async () => {
      // Logout implementation
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    }
  };
};

const useSearch = () => {
  // Placeholder implementation - would come from src/hooks/use-search.ts
  return {
    searchQuery: '',
    results: [],
    isSearching: false,
    performSearch: (query: string) => {
      console.log('Performing search for:', query);
    },
    openSearchDialog: () => {
      console.log('Opening search dialog');
    }
  };
};

const useAppStore = (): AppState => {
  // Placeholder implementation - would come from src/stores/app-store.ts
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  return {
    theme: 'system',
    sidebarCollapsed,
    setSidebarCollapsed,
    notifications: [
      {
        id: '1',
        title: 'System Update',
        message: 'DreamFactory has been updated to version 5.0',
        type: 'info',
        timestamp: new Date(),
        read: false
      }
    ],
    unreadNotificationCount: 1
  };
};

const useBreakpoint = () => {
  // Placeholder implementation - would come from src/hooks/use-breakpoint.ts
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    setIsSmallScreen(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsSmallScreen(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return { isSmallScreen };
};

const useLicense = (): { license: License | null; isLoading: boolean } => {
  // Placeholder implementation - would come from src/hooks/use-license.ts
  return {
    license: null,
    isLoading: false
  };
};

// Component placeholders - These would be imported from actual dependency files
const ThemeToggle: React.FC = () => {
  // Placeholder - would come from src/components/layout/theme/theme-toggle.tsx
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
      aria-label="Toggle theme"
    >
      <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-yellow-400 via-orange-500 to-purple-600" />
    </button>
  );
};

const SearchDialog: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  // Placeholder - would come from src/components/layout/search/search-dialog.tsx
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  Global Search
                </Dialog.Title>
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Search for services, tables, or documentation..."
                    className="w-full rounded-md border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-primary-100 px-4 py-2 text-sm font-medium text-primary-900 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-900 dark:text-primary-100 dark:hover:bg-primary-800"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

const UserMenu: React.FC = () => {
  // Placeholder - would come from src/components/layout/user-menu.tsx
  const { user, logout } = useAuth();
  
  if (!user) return null;

  return (
    <Menu as="div" className="relative inline-block text-left">
      {({ open }) => (
        <>
          <Menu.Button className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600 transition-colors duration-150">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white text-sm font-medium mr-2">
              {user.initials || <UserIcon className="h-4 w-4" />}
            </div>
            <span className="hidden sm:block">{user.name}</span>
            <ChevronDownIcon className="ml-2 h-4 w-4" />
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
            <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/profile"
                      className={cn(
                        'block px-4 py-2 text-sm text-gray-700 dark:text-gray-300',
                        active && 'bg-gray-100 dark:bg-gray-700'
                      )}
                    >
                      Profile Settings
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={logout}
                      className={cn(
                        'block w-full px-4 py-2 text-left text-sm text-red-700 dark:text-red-400',
                        active && 'bg-red-50 dark:bg-red-900/20'
                      )}
                    >
                      Sign Out
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
};

/**
 * Header Component
 * 
 * Top application header with toolbar containing logo, global search, language switcher,
 * theme toggle, user profile menu, and notification center. Provides responsive design
 * and integrates with global application state for user session management and preferences.
 * 
 * Features:
 * - Logo with navigation to dashboard
 * - Global search functionality with debounced input and modal dialog integration
 * - Language switcher dropdown for internationalization support
 * - Theme toggle for light/dark/system mode switching
 * - User profile menu with logout functionality and session management
 * - Notification center with unread count indicator
 * - Responsive toolbar behavior with mobile-optimized layout
 * - License expiration notification banner
 * - Sidebar toggle for mobile navigation
 * 
 * Converts Angular Material mat-toolbar to modern React implementation using:
 * - Tailwind CSS for styling and responsive design
 * - Headless UI for accessible dropdown components
 * - React Hook Form for search input management
 * - Lucide React for consistent iconography
 * - Next.js Link components for optimized navigation
 */
export const Header: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { openSearchDialog } = useSearch();
  const { setSidebarCollapsed, notifications, unreadNotificationCount } = useAppStore();
  const { isSmallScreen } = useBreakpoint();
  const { license } = useLicense();
  
  // Local state for UI interactions
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [availableLanguages] = useState(['en', 'es', 'fr', 'de', 'ja', 'zh']);
  const [currentLanguage, setCurrentLanguage] = useState('en');

  // React Hook Form for search input
  const { register, handleSubmit, watch } = useForm<SearchFormData>({
    defaultValues: { query: '' }
  });

  const searchQuery = watch('query');

  /**
   * Handle sidebar toggle for mobile navigation
   */
  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, [setSidebarCollapsed]);

  /**
   * Handle search form submission
   * Opens search dialog with current query
   */
  const onSearchSubmit = useCallback((data: SearchFormData) => {
    if (data.query.trim()) {
      openSearchDialog();
      setIsSearchDialogOpen(true);
    }
  }, [openSearchDialog]);

  /**
   * Handle search icon click
   * Opens search dialog directly
   */
  const handleSearchClick = useCallback(() => {
    setIsSearchDialogOpen(true);
  }, []);

  /**
   * Handle language change
   * Updates current language and persists to localStorage
   */
  const handleLanguageChange = useCallback((language: string) => {
    setCurrentLanguage(language);
    localStorage.setItem('language', language);
    // In real implementation, this would trigger i18n language change
    console.log('Language changed to:', language);
  }, []);

  /**
   * Generate language display name
   */
  const getLanguageDisplayName = useCallback((langCode: string): string => {
    const languageNames: Record<string, string> = {
      en: 'English',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      ja: '日本語',
      zh: '中文'
    };
    return languageNames[langCode] || langCode.toUpperCase();
  }, []);

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* License expiration banner */}
      {license && (license.msg === 'Expired' || license.msg === 'Unknown') && (
        <div className="bg-red-600 text-white px-4 py-2 text-sm font-medium text-center">
          License Expired - Please contact your administrator to renew your license
        </div>
      )}

      {/* Main header toolbar */}
      <header className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 sticky top-0 z-40">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Left section: Menu toggle and Logo */}
          <div className="flex items-center space-x-4">
            {/* Sidebar toggle button */}
            <button
              type="button"
              onClick={handleSidebarToggle}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors duration-150"
              aria-label="Toggle navigation menu"
            >
              <MenuIcon className="h-6 w-6" />
            </button>

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-150"
            >
              <Image
                src="/assets/img/logo.png"
                alt="DreamFactory Logo"
                width={32}
                height={32}
                className="h-8 w-auto"
                priority
              />
              <span className="hidden sm:block text-xl font-semibold">
                DreamFactory
              </span>
            </Link>
          </div>

          {/* Center section: Search bar */}
          <div className="flex-1 max-w-lg mx-4">
            <form onSubmit={handleSubmit(onSearchSubmit)} className="relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('query')}
                  type="text"
                  placeholder="Search for services, tables, or documentation..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 transition-colors duration-150"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit(onSearchSubmit)();
                    }
                  }}
                />
                {/* Search button for mobile */}
                <button
                  type="button"
                  onClick={handleSearchClick}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center sm:hidden"
                >
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </form>
          </div>

          {/* Right section: Controls and user menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Language switcher - only show if multiple languages available */}
            {availableLanguages.length > 1 && (
              <Menu as="div" className="relative inline-block text-left">
                {({ open }) => (
                  <>
                    <Menu.Button
                      className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors duration-150"
                      aria-label="Change language"
                    >
                      <LanguagesIcon className="h-5 w-5" />
                      <span className="sr-only">Change language</span>
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
                      <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700">
                        <div className="py-1">
                          {availableLanguages.map((lang) => (
                            <Menu.Item key={lang}>
                              {({ active }) => (
                                <button
                                  onClick={() => handleLanguageChange(lang)}
                                  className={cn(
                                    'block w-full px-4 py-2 text-left text-sm transition-colors duration-150',
                                    currentLanguage === lang
                                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                                      : 'text-gray-700 dark:text-gray-300',
                                    active && currentLanguage !== lang && 'bg-gray-100 dark:bg-gray-700'
                                  )}
                                >
                                  {getLanguageDisplayName(lang)}
                                  {currentLanguage === lang && (
                                    <span className="ml-2 text-primary-600 dark:text-primary-400">✓</span>
                                  )}
                                </button>
                              )}
                            </Menu.Item>
                          ))}
                        </div>
                      </Menu.Items>
                    </Transition>
                  </>
                )}
              </Menu>
            )}

            {/* Notifications */}
            <Menu as="div" className="relative inline-block text-left">
              {({ open }) => (
                <>
                  <Menu.Button
                    className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors duration-150"
                    aria-label="View notifications"
                  >
                    <BellIcon className="h-5 w-5" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                        {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                      </span>
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
                    <Menu.Items className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            Notifications
                          </h3>
                        </div>
                        {notifications.length > 0 ? (
                          notifications.slice(0, 5).map((notification) => (
                            <Menu.Item key={notification.id}>
                              {({ active }) => (
                                <div
                                  className={cn(
                                    'px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 last:border-b-0',
                                    active && 'bg-gray-50 dark:bg-gray-700'
                                  )}
                                >
                                  <div className="flex items-start space-x-3">
                                    <div className={cn(
                                      'flex-shrink-0 w-2 h-2 rounded-full mt-2',
                                      notification.type === 'error' && 'bg-red-500',
                                      notification.type === 'warning' && 'bg-yellow-500',
                                      notification.type === 'success' && 'bg-green-500',
                                      notification.type === 'info' && 'bg-blue-500'
                                    )} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {notification.title}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {notification.message}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Menu.Item>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            No new notifications
                          </div>
                        )}
                      </div>
                    </Menu.Items>
                  </Transition>
                </>
              )}
            </Menu>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* User menu */}
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Search dialog */}
      <SearchDialog 
        isOpen={isSearchDialogOpen} 
        onClose={() => setIsSearchDialogOpen(false)} 
      />
    </>
  );
};

export default Header;