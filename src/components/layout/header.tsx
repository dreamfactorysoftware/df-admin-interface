'use client';

import React, { useState, useCallback, useEffect, useMemo, Fragment } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import {
  Search,
  Menu as MenuIcon,
  X,
  Bell,
  Globe,
  ChevronDownIcon,
  Settings,
  HelpCircle,
  Zap,
  Database,
  Users,
  Shield,
  FileText,
  Cog,
  Check,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useSearch } from '@/hooks/use-search';
import { useAppStore } from '@/stores/app-store';
import { SearchDialog } from '@/components/layout/search/search-dialog';
import { ThemeToggle } from '@/components/layout/theme/theme-toggle';
import { UserMenu } from '@/components/layout/user-menu';

/**
 * Language option interface for the language switcher
 */
interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

/**
 * Available languages for the admin interface
 * Expandable list supporting internationalization
 */
const AVAILABLE_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
  },
];

/**
 * Quick actions available in the header for efficient navigation
 */
interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
  keyboardShortcut?: string;
  requiresPermission?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'new-service',
    label: 'New Database Service',
    description: 'Create a new database connection',
    icon: Database,
    url: '/api-connections/database/create',
    keyboardShortcut: 'Ctrl+Shift+D',
    requiresPermission: 'services.create',
  },
  {
    id: 'new-user',
    label: 'New User',
    description: 'Add a new system user',
    icon: Users,
    url: '/adf-users/create',
    keyboardShortcut: 'Ctrl+Shift+U',
    requiresPermission: 'users.create',
  },
  {
    id: 'new-role',
    label: 'New Role',
    description: 'Create a new user role',
    icon: Shield,
    url: '/api-security/roles/create',
    requiresPermission: 'roles.create',
  },
  {
    id: 'api-docs',
    label: 'API Documentation',
    description: 'View generated API documentation',
    icon: FileText,
    url: '/adf-api-docs',
    keyboardShortcut: 'Ctrl+Shift+A',
  },
  {
    id: 'system-settings',
    label: 'System Settings',
    description: 'Configure system-wide settings',
    icon: Cog,
    url: '/system-settings',
    keyboardShortcut: 'Ctrl+,',
    requiresPermission: 'system.config',
  },
];

/**
 * Form interface for quick search input
 */
interface SearchFormData {
  searchQuery: string;
}

/**
 * Language switcher hook for managing locale preferences
 */
const useLanguage = () => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');

  // Load language preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('df-admin-language');
    if (stored && AVAILABLE_LANGUAGES.find(lang => lang.code === stored)) {
      setCurrentLanguage(stored);
    }
  }, []);

  // Update language preference
  const changeLanguage = useCallback((languageCode: string) => {
    setCurrentLanguage(languageCode);
    localStorage.setItem('df-admin-language', languageCode);
    
    // In a real implementation, this would trigger i18n reload
    // For now, we'll just update the state
    // i18n.changeLanguage(languageCode);
  }, []);

  const currentLanguageData = useMemo(() => 
    AVAILABLE_LANGUAGES.find(lang => lang.code === currentLanguage) || AVAILABLE_LANGUAGES[0]
  , [currentLanguage]);

  return {
    currentLanguage,
    currentLanguageData,
    availableLanguages: AVAILABLE_LANGUAGES,
    changeLanguage,
  };
};

/**
 * Notification system hook (mock implementation)
 * In a real application, this would connect to a notification service
 */
const useNotifications = () => {
  const [notifications] = useState([
    {
      id: '1',
      title: 'Database Connection Established',
      message: 'Successfully connected to production MySQL database',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      type: 'success' as const,
      read: false,
    },
    {
      id: '2',
      title: 'Schema Discovery Complete',
      message: '127 tables discovered in the e-commerce database',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      type: 'info' as const,
      read: false,
    },
    {
      id: '3',
      title: 'API Generation Warning',
      message: 'Large table detected (1M+ rows). Consider adding pagination.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      type: 'warning' as const,
      read: true,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead: () => {}, // Mock function
    markAllAsRead: () => {}, // Mock function
  };
};

/**
 * Header component props interface
 */
interface HeaderProps {
  /** Additional CSS class name */
  className?: string;
  /** Whether to show the mobile menu toggle */
  showMobileToggle?: boolean;
  /** Whether to show the logo */
  showLogo?: boolean;
  /** Whether to show quick actions */
  showQuickActions?: boolean;
  /** Whether to enable keyboard shortcuts */
  enableKeyboardShortcuts?: boolean;
}

/**
 * Top application header component for DreamFactory Admin Interface.
 * 
 * Provides comprehensive navigation and utility functions including:
 * - Brand logo and navigation toggle for mobile layouts
 * - Global search functionality with keyboard shortcuts (Cmd/Ctrl+K)
 * - Language switching with localStorage persistence
 * - Theme toggle integration with global theme context
 * - User profile menu with authentication status
 * - Notification center with real-time updates
 * - Quick action shortcuts for common tasks
 * - Responsive design with mobile-optimized layout
 * - WCAG 2.1 AA compliance with proper ARIA attributes
 * 
 * Converts Angular Material mat-toolbar to modern React/Tailwind implementation
 * with enhanced accessibility and performance optimizations.
 * 
 * @component
 * @example
 * ```tsx
 * // Basic header usage in layout
 * <Header 
 *   showMobileToggle 
 *   showQuickActions 
 *   enableKeyboardShortcuts 
 * />
 * ```
 * 
 * @example
 * ```tsx
 * // Minimal header for authentication pages
 * <Header 
 *   showLogo={false}
 *   showQuickActions={false}
 *   className="border-b-0"
 * />
 * ```
 */
export function Header({
  className,
  showMobileToggle = true,
  showLogo = true,
  showQuickActions = true,
  enableKeyboardShortcuts = true,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hasPermission } = useAuth();
  const { searchOpen, toggleSearch, searchQuery } = useAppStore();
  const { currentLanguageData, availableLanguages, changeLanguage } = useLanguage();
  const { notifications, unreadCount } = useNotifications();
  const { sidebar, toggleSidebar } = useAppStore();

  // Form handling for quick search input
  const searchForm = useForm<SearchFormData>({
    defaultValues: {
      searchQuery: searchQuery || '',
    },
  });

  const { watch, setValue, handleSubmit } = searchForm;
  const currentSearchQuery = watch('searchQuery');

  // Filter quick actions based on user permissions
  const availableActions = useMemo(() => {
    if (!isAuthenticated || !user) return [];
    
    return QUICK_ACTIONS.filter(action => {
      if (!action.requiresPermission) return true;
      return hasPermission(action.requiresPermission);
    });
  }, [isAuthenticated, user, hasPermission]);

  // Handle quick search submission
  const handleQuickSearch = useCallback((data: SearchFormData) => {
    if (data.searchQuery.trim()) {
      // Open global search with the query
      useAppStore.getState().setSearchQuery(data.searchQuery.trim());
      toggleSearch();
    }
  }, [toggleSearch]);

  // Handle global keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Global search shortcut (Cmd/Ctrl+K)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        toggleSearch();
        return;
      }

      // Quick action shortcuts
      if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
        const action = availableActions.find(a => 
          a.keyboardShortcut === `${event.ctrlKey ? 'Ctrl' : 'Cmd'}+Shift+${event.key.toUpperCase()}`
        );
        if (action) {
          event.preventDefault();
          router.push(action.url);
          return;
        }
      }

      // Settings shortcut (Cmd/Ctrl+,)
      if ((event.metaKey || event.ctrlKey) && event.key === ',') {
        if (hasPermission('system.config')) {
          event.preventDefault();
          router.push('/system-settings');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, toggleSearch, availableActions, router, hasPermission]);

  // Handle quick action selection
  const handleQuickAction = useCallback((action: QuickAction) => {
    router.push(action.url);
  }, [router]);

  // Handle notification click
  const handleNotificationClick = useCallback(() => {
    // In a real implementation, this would open a notification panel
    console.log('Notifications clicked');
  }, []);

  return (
    <>
      {/* Main Header */}
      <header 
        className={cn(
          'sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800',
          'bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/95',
          'dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/95',
          'transition-colors duration-200',
          className
        )}
        role="banner"
        aria-label="Main navigation header"
      >
        <div className="mx-auto flex h-16 max-w-8xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left Section: Logo and Mobile Toggle */}
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Toggle */}
            {showMobileToggle && (
              <button
                type="button"
                onClick={toggleSidebar}
                className={cn(
                  'inline-flex items-center justify-center rounded-md p-2',
                  'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  'lg:hidden', // Only show on mobile/tablet
                  'transition-colors duration-200'
                )}
                aria-label={sidebar.isOpen ? 'Close sidebar' : 'Open sidebar'}
                aria-expanded={sidebar.isOpen}
              >
                {sidebar.isOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <MenuIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            )}

            {/* Brand Logo */}
            {showLogo && (
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-2 py-1',
                    'text-gray-900 dark:text-gray-100',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    'transition-colors duration-200'
                  )}
                  aria-label="Go to DreamFactory dashboard"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600">
                    <Zap className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-lg font-semibold tracking-tight">
                      DreamFactory
                    </span>
                    <span className="ml-2 rounded-md bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900/20 dark:text-primary-300">
                      Admin
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Center Section: Search and Quick Actions */}
          <div className="flex flex-1 items-center justify-center px-4 sm:px-6 lg:max-w-2xl lg:px-8">
            {/* Quick Search Bar */}
            <div className="w-full max-w-lg">
              <form onSubmit={handleSubmit(handleQuickSearch)} className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="search"
                  placeholder="Search services, databases, users... (⌘K)"
                  className={cn(
                    'block w-full rounded-lg border border-gray-300 dark:border-gray-700',
                    'bg-white dark:bg-gray-900',
                    'py-2 pl-10 pr-12 text-sm',
                    'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                    'text-gray-900 dark:text-gray-100',
                    'focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    'transition-colors duration-200'
                  )}
                  value={currentSearchQuery}
                  onChange={(e) => setValue('searchQuery', e.target.value)}
                  onFocus={toggleSearch}
                  aria-label="Global search input"
                  autoComplete="off"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <kbd className="hidden sm:inline-flex h-5 min-w-5 items-center justify-center rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 px-1 font-mono text-xs text-gray-500 dark:text-gray-400">
                    ⌘K
                  </kbd>
                </div>
              </form>
            </div>

            {/* Quick Actions (Desktop Only) */}
            {showQuickActions && availableActions.length > 0 && (
              <Menu as="div" className="relative ml-4 hidden lg:block">
                <Menu.Button
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700',
                    'bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium',
                    'text-gray-700 dark:text-gray-300',
                    'hover:bg-gray-50 dark:hover:bg-gray-800',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    'transition-colors duration-200'
                  )}
                  aria-label="Quick actions menu"
                >
                  <Zap className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only sm:not-sr-only">Quick</span>
                  <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
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
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Quick Actions
                      </h3>
                      <div className="space-y-1">
                        {availableActions.map((action) => (
                          <Menu.Item key={action.id}>
                            {({ active }) => (
                              <button
                                onClick={() => handleQuickAction(action)}
                                className={cn(
                                  'group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm',
                                  'transition-colors duration-150',
                                  active
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                    : 'text-gray-700 dark:text-gray-300'
                                )}
                              >
                                <action.icon className="h-4 w-4" aria-hidden="true" />
                                <div className="flex-1 text-left">
                                  <div className="font-medium">{action.label}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {action.description}
                                  </div>
                                </div>
                                {action.keyboardShortcut && (
                                  <kbd className="hidden group-hover:inline-flex h-5 min-w-5 items-center justify-center rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 px-1 font-mono text-xs text-gray-500 dark:text-gray-400">
                                    {action.keyboardShortcut.replace('Ctrl', '⌘')}
                                  </kbd>
                                )}
                              </button>
                            )}
                          </Menu.Item>
                        ))}
                      </div>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            )}
          </div>

          {/* Right Section: Controls and User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <Menu as="div" className="relative">
              <Menu.Button
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg p-2',
                  'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  'transition-colors duration-200'
                )}
                aria-label={`Current language: ${currentLanguageData.name}. Click to change language`}
              >
                <Globe className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline text-sm font-medium">
                  {currentLanguageData.flag} {currentLanguageData.code.toUpperCase()}
                </span>
                <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
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
                <Menu.Items className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Language
                    </h3>
                    <div className="space-y-1">
                      {availableLanguages.map((language) => (
                        <Menu.Item key={language.code}>
                          {({ active }) => (
                            <button
                              onClick={() => changeLanguage(language.code)}
                              className={cn(
                                'group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm',
                                'transition-colors duration-150',
                                active
                                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                  : 'text-gray-700 dark:text-gray-300',
                                language.code === currentLanguageData.code && 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                              )}
                            >
                              <span className="text-lg" aria-hidden="true">
                                {language.flag}
                              </span>
                              <div className="flex-1 text-left">
                                <div className="font-medium">{language.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {language.nativeName}
                                </div>
                              </div>
                              {language.code === currentLanguageData.code && (
                                <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                              )}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </div>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            {/* Theme Toggle */}
            <ThemeToggle 
              className="hidden sm:block"
              compact
              ariaLabel="Theme preference toggle"
            />

            {/* Notifications */}
            <button
              type="button"
              onClick={handleNotificationClick}
              className={cn(
                'relative inline-flex items-center rounded-lg p-2',
                'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'transition-colors duration-200'
              )}
              aria-label={`Notifications. ${unreadCount} unread notifications`}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                  <span className="sr-only">unread notifications</span>
                </span>
              )}
            </button>

            {/* Help */}
            <button
              type="button"
              onClick={() => router.push('/help')}
              className={cn(
                'inline-flex items-center rounded-lg p-2',
                'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'transition-colors duration-200'
              )}
              aria-label="Help and documentation"
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Settings (Admin Only) */}
            {hasPermission('system.config') && (
              <button
                type="button"
                onClick={() => router.push('/system-settings')}
                className={cn(
                  'hidden sm:inline-flex items-center rounded-lg p-2',
                  'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  'transition-colors duration-200'
                )}
                aria-label="System settings"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
              </button>
            )}

            {/* User Menu */}
            {isAuthenticated && user ? (
              <UserMenu showUserName={false} placement="bottom-end" />
            ) : (
              <button
                type="button"
                onClick={() => router.push('/login')}
                className={cn(
                  'rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white',
                  'hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  'transition-colors duration-200'
                )}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog */}
      <SearchDialog
        open={searchOpen}
        onClose={toggleSearch}
        initialQuery={searchQuery}
        placeholder="Search databases, services, schemas, users..."
        enableShortcuts={enableKeyboardShortcuts}
      />
    </>
  );
}

/**
 * Compact header variant for constrained layouts
 */
export const CompactHeader: React.FC<Omit<HeaderProps, 'showQuickActions'>> = (props) => (
  <Header {...props} showQuickActions={false} />
);

/**
 * Mobile-optimized header variant
 */
export const MobileHeader: React.FC<HeaderProps> = (props) => (
  <Header {...props} showQuickActions={false} enableKeyboardShortcuts={false} />
);

// Default export
export default Header;

// Export types for external use
export type { HeaderProps, LanguageOption, QuickAction };