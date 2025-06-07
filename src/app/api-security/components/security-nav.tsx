'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SecurityNavItem {
  label: string;
  href: string;
  description: string;
  icon?: React.ReactNode;
}

interface SecurityNavProps {
  className?: string;
}

/**
 * Navigation component for the API security section providing tab-based navigation
 * between limits and roles management features. Implements active route highlighting,
 * responsive design with Tailwind CSS, and accessibility features.
 * 
 * Features:
 * - Next.js Link components for client-side navigation
 * - Active route highlighting using usePathname hook
 * - WCAG 2.1 AA compliance with proper ARIA attributes
 * - Responsive design for mobile and desktop viewports
 * - Tailwind CSS 4.1+ styling with consistent theme injection
 */
export function SecurityNav({ className }: SecurityNavProps) {
  const pathname = usePathname();

  const navigationItems: SecurityNavItem[] = [
    {
      label: 'Overview',
      href: '/api-security',
      description: 'Security dashboard and statistics',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      label: 'Rate Limits',
      href: '/api-security/limits',
      description: 'Manage API rate limiting configurations',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: 'Roles',
      href: '/api-security/roles',
      description: 'Configure role-based access control',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      ),
    },
  ];

  /**
   * Determines if a navigation item is currently active based on the current pathname
   */
  const isActive = (href: string): boolean => {
    if (href === '/api-security') {
      return pathname === '/api-security';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        'flex flex-col sm:flex-row bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700',
        'overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
        className
      )}
      role="navigation"
      aria-label="API Security Navigation"
    >
      <div className="flex flex-col sm:flex-row min-w-full sm:min-w-0">
        {navigationItems.map((item) => {
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                // Base styles
                'relative flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4',
                'text-sm font-medium transition-all duration-200',
                'border-b-2 sm:border-b-2 sm:border-r border-transparent',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                'hover:bg-gray-50 dark:hover:bg-gray-800',
                // Active state
                active
                  ? [
                      'text-primary-600 dark:text-primary-400',
                      'border-b-primary-500 dark:border-b-primary-400',
                      'bg-primary-50 dark:bg-primary-900/20',
                    ]
                  : [
                      'text-gray-600 dark:text-gray-300',
                      'hover:text-gray-900 dark:hover:text-gray-100',
                      'hover:border-b-gray-300 dark:hover:border-b-gray-600',
                    ],
                // Responsive adjustments
                'flex-shrink-0 min-w-0'
              )}
              aria-current={active ? 'page' : undefined}
              role="tab"
              aria-selected={active}
              tabIndex={0}
            >
              {/* Icon */}
              <span
                className={cn(
                  'flex-shrink-0 transition-colors duration-200',
                  active
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-400 dark:text-gray-500'
                )}
                aria-hidden="true"
              >
                {item.icon}
              </span>

              {/* Label and description container */}
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate">
                  {item.label}
                </span>
                <span
                  className={cn(
                    'text-xs truncate mt-0.5 transition-colors duration-200',
                    active
                      ? 'text-primary-500 dark:text-primary-300'
                      : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {item.description}
                </span>
              </div>

              {/* Active indicator */}
              {active && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 dark:bg-primary-400 sm:hidden"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Mobile scroll indicator */}
      <div className="sm:hidden flex justify-center py-2 bg-gray-50 dark:bg-gray-800">
        <div className="flex space-x-1">
          {navigationItems.map((_, index) => (
            <div
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-colors duration-200',
                isActive(navigationItems[index].href)
                  ? 'bg-primary-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              )}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

/**
 * Compact version of the security navigation for use in smaller layouts
 */
export function SecurityNavCompact({ className }: SecurityNavProps) {
  const pathname = usePathname();

  const navigationItems = [
    { label: 'Overview', href: '/api-security' },
    { label: 'Limits', href: '/api-security/limits' },
    { label: 'Roles', href: '/api-security/roles' },
  ];

  const isActive = (href: string): boolean => {
    if (href === '/api-security') {
      return pathname === '/api-security';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        'flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden',
        className
      )}
      role="navigation"
      aria-label="API Security Navigation (Compact)"
    >
      {navigationItems.map((item, index) => {
        const active = isActive(item.href);
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex-1 px-3 py-2 text-sm font-medium text-center transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
              'border-r border-gray-200 dark:border-gray-700 last:border-r-0',
              active
                ? 'bg-primary-600 text-white dark:bg-primary-500'
                : [
                    'text-gray-600 dark:text-gray-300',
                    'hover:bg-gray-50 dark:hover:bg-gray-800',
                    'hover:text-gray-900 dark:hover:text-gray-100',
                  ]
            )}
            aria-current={active ? 'page' : undefined}
            role="tab"
            aria-selected={active}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default SecurityNav;