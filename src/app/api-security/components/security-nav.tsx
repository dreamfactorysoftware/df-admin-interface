/**
 * Security Navigation Component
 * 
 * Navigation component for the API security section providing tab-based navigation
 * between limits and roles management features. Implements active route highlighting,
 * responsive design with Tailwind CSS, and accessibility features.
 * 
 * Features:
 * - Next.js Link components for client-side navigation
 * - Active route highlighting using usePathname hook
 * - Headless UI tab primitives for WCAG 2.1 AA compliance
 * - Responsive design patterns for mobile and desktop viewports
 * - Consistent theme injection with Tailwind CSS 4.1+
 * - Keyboard navigation support
 * 
 * @fileoverview Security section navigation with React/Next.js patterns
 * @version 1.0.0
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tab } from '@headlessui/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Navigation tab item interface
 */
interface SecurityNavItem {
  /** Tab label */
  label: string;
  /** Route path */
  href: string;
  /** Tab icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Tab description for accessibility */
  description?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Security navigation component props
 */
interface SecurityNavProps {
  /** Additional CSS classes */
  className?: string;
  /** Navigation variant */
  variant?: 'default' | 'pills' | 'underline';
  /** Component size */
  size?: 'sm' | 'md' | 'lg';
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Test identifier */
  'data-testid'?: string;
}

// ============================================================================
// NAVIGATION CONFIGURATION
// ============================================================================

/**
 * Security navigation items configuration
 */
const SECURITY_NAV_ITEMS: SecurityNavItem[] = [
  {
    label: 'Rate Limits',
    href: '/api-security/limits',
    description: 'Manage API rate limits and request throttling policies',
    icon: ({ className }) => (
      <svg 
        className={className} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
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
    description: 'Configure role-based access control and permissions',
    icon: ({ className }) => (
      <svg 
        className={className} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
        />
      </svg>
    ),
  },
];

// ============================================================================
// STYLING VARIANTS
// ============================================================================

/**
 * Navigation container variants using class-variance-authority
 */
const navigationVariants = cva(
  'flex w-full focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 rounded-lg',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 p-1 dark:bg-gray-800',
        pills: 'space-x-2',
        underline: 'border-b border-gray-200 dark:border-gray-700',
      },
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
      orientation: {
        horizontal: 'flex-row',
        vertical: 'flex-col',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      orientation: 'horizontal',
    },
  }
);

/**
 * Navigation tab variants
 */
const tabVariants = cva(
  'group relative flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'flex-1 rounded-md px-4 py-2 font-medium text-sm',
        pills: 'rounded-full px-4 py-2 font-medium text-sm',
        underline: 'border-b-2 border-transparent px-4 py-3 font-medium text-sm',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
      },
      active: {
        true: '',
        false: '',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-50',
        false: 'cursor-pointer',
      },
    },
    compoundVariants: [
      // Default variant active state
      {
        variant: 'default',
        active: true,
        class: 'bg-white text-primary-700 shadow-sm dark:bg-gray-700 dark:text-primary-300',
      },
      {
        variant: 'default',
        active: false,
        class: 'text-gray-700 hover:bg-white/50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-gray-100',
      },
      // Pills variant active state
      {
        variant: 'pills',
        active: true,
        class: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
      },
      {
        variant: 'pills',
        active: false,
        class: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100',
      },
      // Underline variant active state
      {
        variant: 'underline',
        active: true,
        class: 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400',
      },
      {
        variant: 'underline',
        active: false,
        class: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
      active: false,
      disabled: false,
    },
  }
);

// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================

/**
 * Security Navigation Component
 * 
 * Provides tab-based navigation for the API security section with active
 * route highlighting and accessibility features.
 */
const SecurityNav = React.forwardRef<HTMLDivElement, SecurityNavProps>(
  ({ 
    className, 
    variant = 'default',
    size = 'md',
    orientation = 'horizontal',
    'data-testid': testId,
    ...props 
  }, ref) => {
    const pathname = usePathname();

    /**
     * Determine if a tab is currently active based on the pathname
     */
    const isActiveTab = (href: string): boolean => {
      if (href === '/api-security/limits') {
        return pathname === '/api-security/limits' || pathname.startsWith('/api-security/limits/');
      }
      if (href === '/api-security/roles') {
        return pathname === '/api-security/roles' || pathname.startsWith('/api-security/roles/');
      }
      return pathname === href;
    };

    /**
     * Get the currently selected tab index for Headless UI
     */
    const selectedIndex = SECURITY_NAV_ITEMS.findIndex(item => isActiveTab(item.href));

    return (
      <div
        ref={ref}
        className={cn(navigationVariants({ variant, size, orientation }), className)}
        data-testid={testId}
        role="navigation"
        aria-label="API security navigation"
        {...props}
      >
        <Tab.Group selectedIndex={selectedIndex >= 0 ? selectedIndex : 0}>
          <Tab.List 
            className={cn(
              'flex w-full',
              orientation === 'vertical' ? 'flex-col space-y-1' : 'flex-row',
              variant === 'pills' && orientation === 'horizontal' && 'space-x-2',
              variant === 'default' && 'rounded-lg p-1',
            )}
          >
            {SECURITY_NAV_ITEMS.map((item, index) => {
              const isActive = isActiveTab(item.href);
              
              return (
                <Tab
                  key={item.href}
                  className="outline-none"
                  disabled={item.disabled}
                >
                  {({ selected, hover, focus }) => (
                    <Link
                      href={item.href}
                      className={cn(
                        tabVariants({
                          variant,
                          size,
                          active: isActive,
                          disabled: item.disabled,
                        }),
                        orientation === 'vertical' && 'w-full justify-start',
                      )}
                      aria-current={isActive ? 'page' : undefined}
                      aria-describedby={item.description ? `${item.href.replace(/\//g, '-')}-desc` : undefined}
                      tabIndex={-1} // Let Headless UI handle focus management
                    >
                      {/* Tab icon */}
                      {item.icon && (
                        <item.icon 
                          className={cn(
                            'flex-shrink-0',
                            size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4',
                            orientation === 'vertical' ? 'mr-3' : 'mr-2',
                          )}
                        />
                      )}
                      
                      {/* Tab label */}
                      <span className="font-medium">
                        {item.label}
                      </span>
                      
                      {/* Active indicator for underline variant */}
                      {variant === 'underline' && isActive && (
                        <span
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 dark:bg-primary-400"
                          aria-hidden="true"
                        />
                      )}
                      
                      {/* Screen reader description */}
                      {item.description && (
                        <span
                          id={`${item.href.replace(/\//g, '-')}-desc`}
                          className="sr-only"
                        >
                          {item.description}
                        </span>
                      )}
                    </Link>
                  )}
                </Tab>
              );
            })}
          </Tab.List>
        </Tab.Group>
      </div>
    );
  }
);

SecurityNav.displayName = 'SecurityNav';

// ============================================================================
// EXPORTS
// ============================================================================

export default SecurityNav;
export { SecurityNav, navigationVariants, tabVariants };
export type { SecurityNavProps, SecurityNavItem };