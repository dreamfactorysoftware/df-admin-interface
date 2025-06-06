'use client';

import React, { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/components/layout/theme/theme-toggle';
import type { UserProfile } from '@/types/user';

/**
 * Avatar Component
 * 
 * User avatar display with fallback to initials for users without profile images.
 * Supports multiple sizes and accessibility features.
 */
interface AvatarProps {
  user: UserProfile;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showOnlineStatus?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ 
  user, 
  size = 'md', 
  className,
  showOnlineStatus = false 
}) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg'
  };

  // Generate initials from user name/username
  const getInitials = (user: UserProfile): string => {
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    if (user.display_name) {
      const names = user.display_name.split(' ');
      return names.length > 1 
        ? `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase()
        : names[0].substring(0, 2).toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(user);
  const displayName = user.display_name || user.first_name || user.username;

  // For now, we'll use initials (no profile image system in place)
  return (
    <div className={cn('relative inline-block', className)}>
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-primary-600 font-semibold text-white',
          sizeClasses[size]
        )}
        aria-label={`${displayName} avatar`}
      >
        <span aria-hidden="true">{initials}</span>
      </div>
      
      {showOnlineStatus && (
        <span 
          className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white dark:ring-gray-800"
          aria-label="Online status indicator"
        />
      )}
    </div>
  );
};

/**
 * Theme submenu options
 */
const THEME_OPTIONS = [
  {
    value: 'light' as const,
    label: 'Light Mode',
    icon: SunIcon,
    ariaLabel: 'Switch to light theme',
  },
  {
    value: 'dark' as const,
    label: 'Dark Mode',
    icon: MoonIcon,
    ariaLabel: 'Switch to dark theme',
  },
  {
    value: 'system' as const,
    label: 'System',
    icon: ComputerDesktopIcon,
    ariaLabel: 'Use system theme preference',
  },
] as const;

/**
 * UserMenu Component Props
 */
interface UserMenuProps {
  className?: string;
  showUserName?: boolean;
  placement?: 'bottom-start' | 'bottom-end';
}

/**
 * UserMenu Component
 * 
 * User profile dropdown menu component displaying current user information, 
 * profile settings access, theme preferences, and logout functionality.
 * 
 * Converts Angular Material mat-menu user dropdown to Headless UI menu component
 * with enhanced accessibility features and React/Next.js integration.
 * 
 * Features:
 * - User authentication context with current user data and session state
 * - Logout functionality with proper session cleanup and navigation to login page
 * - User avatar display with fallback to initials for users without profile images
 * - Accessible dropdown menu with keyboard navigation and proper ARIA attributes
 * - Profile settings navigation integration with Next.js router
 * - Theme preference toggle integrated within user menu
 * - Responsive design with proper touch targets
 * - WCAG 2.1 AA compliance with proper focus management
 * 
 * @example
 * ```tsx
 * <UserMenu 
 *   showUserName 
 *   placement="bottom-end" 
 *   className="ml-auto"
 * />
 * ```
 */
export const UserMenu: React.FC<UserMenuProps> = ({
  className,
  showUserName = true,
  placement = 'bottom-end',
}) => {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Handle logout with loading state and error handling
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      // Navigation to login is handled by the logout function
    } catch (error) {
      console.error('Logout failed:', error);
      // The auth hook handles the error and still navigates to login
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Handle profile navigation
  const handleProfileClick = () => {
    router.push('/profile');
  };

  // Handle theme change
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  // Don't render if no user data or still loading
  if (!user || isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
      </div>
    );
  }

  const displayName = user.display_name || user.first_name || user.username;
  const userEmail = user.email;

  return (
    <Menu as="div" className={cn('relative inline-block text-left', className)}>
      {({ open }) => (
        <>
          {/* Menu Trigger Button */}
          <Menu.Button
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border border-transparent',
              'bg-white dark:bg-gray-800',
              'px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200',
              'hover:bg-gray-50 dark:hover:bg-gray-700',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              'transition-colors duration-200',
              'min-h-[44px]' // WCAG 2.1 AA minimum touch target
            )}
            aria-label={`User menu for ${displayName}`}
            aria-expanded={open}
            aria-haspopup="true"
          >
            {/* User Avatar */}
            <Avatar user={user} size="sm" showOnlineStatus />
            
            {/* User Name (optional) */}
            {showUserName && (
              <span className="hidden sm:block truncate max-w-32">
                {displayName}
              </span>
            )}
            
            {/* Dropdown Chevron */}
            <ChevronDownIcon
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                open && 'rotate-180'
              )}
              aria-hidden="true"
            />
          </Menu.Button>

          {/* Menu Dropdown */}
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items
              className={cn(
                'absolute z-50 mt-2 w-80 origin-top-right',
                'rounded-lg border border-gray-200 dark:border-gray-700',
                'bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5',
                'focus:outline-none',
                placement === 'bottom-start' ? 'left-0' : 'right-0'
              )}
            >
              <div className="p-4">
                {/* User Info Section */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <Avatar user={user} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {userEmail}
                    </p>
                    {user.is_sys_admin && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300 mt-1">
                        Administrator
                      </span>
                    )}
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2 space-y-1">
                  {/* Profile Settings */}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleProfileClick}
                        className={cn(
                          'group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm',
                          'transition-colors duration-150',
                          active
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            : 'text-gray-700 dark:text-gray-300'
                        )}
                        aria-label="View and edit profile settings"
                      >
                        <UserCircleIcon className="h-4 w-4" aria-hidden="true" />
                        <span>Profile Settings</span>
                      </button>
                    )}
                  </Menu.Item>

                  {/* Theme Preference Submenu */}
                  <div className="px-3 py-2">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Theme Preference
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {THEME_OPTIONS.map((option) => {
                        const isSelected = theme === option.value;
                        const IconComponent = option.icon;
                        
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleThemeChange(option.value)}
                            className={cn(
                              'relative flex flex-col items-center gap-1 p-2 rounded-md text-xs',
                              'transition-all duration-150 min-h-[60px]',
                              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                              isSelected
                                ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                            )}
                            aria-label={option.ariaLabel}
                            aria-pressed={isSelected}
                          >
                            <IconComponent className="h-4 w-4" aria-hidden="true" />
                            <span className="font-medium">{option.label}</span>
                            {isSelected && (
                              <CheckIcon 
                                className="absolute top-1 right-1 h-3 w-3 text-primary-600 dark:text-primary-400"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

                  {/* Logout */}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className={cn(
                          'group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm',
                          'transition-colors duration-150',
                          'disabled:opacity-50 disabled:cursor-not-allowed',
                          active && !isLoggingOut
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                            : 'text-red-600 dark:text-red-400'
                        )}
                        aria-label={isLoggingOut ? 'Logging out...' : 'Sign out of your account'}
                      >
                        <ArrowRightOnRectangleIcon 
                          className={cn(
                            'h-4 w-4',
                            isLoggingOut && 'animate-pulse'
                          )} 
                          aria-hidden="true" 
                        />
                        <span>
                          {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                        </span>
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
};

/**
 * Compact User Menu Preset
 * Pre-configured variant without user name for constrained spaces
 */
export const CompactUserMenu: React.FC<Omit<UserMenuProps, 'showUserName'>> = (props) => (
  <UserMenu {...props} showUserName={false} />
);

// Default export
export default UserMenu;

// Export Avatar component for use in other parts of the application
export { Avatar };
export type { UserMenuProps, AvatarProps };