'use client';

import React, { Fragment, useCallback } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, UserIcon, LogOutIcon, UserCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

// Types - Based on expected interfaces from dependencies
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

// Hook placeholders - These would be implemented in the actual dependency files
const useAuth = (): AuthContext => {
  // This is a placeholder implementation
  // In the actual implementation, this would come from src/hooks/use-auth.ts
  const queryClient = useQueryClient();
  
  // Mock user data - in real implementation would come from authentication context
  const user: User = {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: '',
    initials: 'JD',
    isRootAdmin: true
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Call logout API endpoint
      const response = await fetch('/api/v2/user/session', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // Clear local storage
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user-data');
      // Navigate to login
      window.location.href = '/login';
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      queryClient.clear();
      localStorage.clear();
      window.location.href = '/login';
    }
  });

  return {
    user,
    isLoading: false,
    isAuthenticated: !!user,
    logout: logoutMutation.mutateAsync
  };
};

// Avatar Component - Placeholder for src/components/ui/avatar.tsx
interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt, fallback, className = '' }) => {
  const [imageError, setImageError] = React.useState(false);

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(
          'inline-block h-8 w-8 rounded-full object-cover',
          className
        )}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white text-sm font-medium',
        className
      )}
    >
      {fallback || <UserIcon className="h-4 w-4" />}
    </div>
  );
};

// Menu Component - Placeholder for src/components/ui/menu.tsx  
interface MenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
  className?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
  children,
  onClick,
  icon,
  className = ''
}) => (
  <button
    onClick={onClick}
    className={cn(
      'group flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white transition-colors duration-150',
      className
    )}
  >
    {icon && (
      <span className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400">
        {icon}
      </span>
    )}
    {children}
  </button>
);

/**
 * UserMenu Component
 * 
 * User profile dropdown menu displaying current user information, profile settings access,
 * theme preferences, and logout functionality. Provides authenticated user context and
 * session management controls with responsive design and accessibility features.
 * 
 * Features:
 * - User avatar display with fallback to initials for users without profile images
 * - Accessible dropdown menu with keyboard navigation and proper ARIA attributes  
 * - Profile settings navigation integration with application routing structure
 * - Logout functionality with proper session cleanup and navigation to login page
 * - User authentication context providing current user data and session state
 * 
 * Replaces Angular Material mat-menu with Headless UI for enhanced accessibility
 * and modern React patterns.
 */
export const UserMenu: React.FC = () => {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  /**
   * Handle navigation to profile page
   * Uses Next.js router for client-side navigation with prefetching
   */
  const handleProfileClick = useCallback(() => {
    router.push('/profile');
  }, [router]);

  /**
   * Handle user logout
   * Performs session cleanup and redirects to login page
   */
  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout and redirect even if API call fails
      window.location.href = '/login';
    }
  }, [logout]);

  /**
   * Generate user initials from name
   * Fallback for users without profile images
   */
  const getUserInitials = useCallback((name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  // Don't render if not authenticated or loading
  if (!user || isLoading) {
    return (
      <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      {({ open }) => (
        <>
          <Menu.Button
            className={cn(
              'inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600 transition-colors duration-150',
              open && 'bg-gray-50 dark:bg-gray-700'
            )}
            aria-label="User menu"
            aria-expanded={open}
          >
            <Avatar
              src={user.avatar}
              alt={`${user.name} avatar`}
              fallback={getUserInitials(user.name)}
              className="mr-2"
            />
            <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
              {user.name}
            </span>
            <ChevronDownIcon
              className={cn(
                'ml-2 h-4 w-4 text-gray-400 transition-transform duration-150',
                open && 'rotate-180'
              )}
              aria-hidden="true"
            />
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
            <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:divide-gray-700 dark:ring-gray-700">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
                {(user.isRootAdmin || user.isSysAdmin) && (
                  <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                    {user.isRootAdmin ? 'Root Administrator' : 'System Administrator'}
                  </p>
                )}
              </div>

              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <MenuItem
                      onClick={handleProfileClick}
                      icon={<UserCircleIcon />}
                      className={cn(
                        active && 'bg-gray-50 dark:bg-gray-700'
                      )}
                    >
                      Profile Settings
                    </MenuItem>
                  )}
                </Menu.Item>
              </div>

              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <MenuItem
                      onClick={handleLogout}
                      icon={<LogOutIcon />}
                      className={cn(
                        'text-red-700 hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300',
                        active && 'bg-red-50 dark:bg-red-900/20'
                      )}
                    >
                      Sign Out
                    </MenuItem>
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

export default UserMenu;