/**
 * Badge Component
 * 
 * A flexible badge component for displaying status, counts, and labels with multiple variants.
 * Built with Tailwind CSS and designed for consistency across the application.
 */

'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success:
          'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        warning:
          'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        info:
          'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * The content to display in the badge
   */
  children: React.ReactNode;
  /**
   * Whether the badge can be removed/dismissed
   */
  dismissible?: boolean;
  /**
   * Callback when the badge is dismissed
   */
  onDismiss?: () => void;
  /**
   * Custom icon to display before the text
   */
  icon?: React.ReactNode;
  /**
   * Whether to show a dot indicator
   */
  dot?: boolean;
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    variant, 
    size, 
    children, 
    dismissible = false,
    onDismiss,
    icon,
    dot = false,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {dot && (
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
        )}
        {icon && (
          <span className="mr-1 h-3 w-3">{icon}</span>
        )}
        {children}
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-1.5 inline-flex h-3 w-3 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="Remove badge"
          >
            <svg
              className="h-2 w-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;