/**
 * Card Component for React/Next.js refactor of DreamFactory Admin Interface
 * 
 * Reusable card component built with Headless UI and Tailwind CSS for optimal
 * performance and accessibility. Provides flexible layouts for content
 * organization with proper WCAG 2.1 AA compliance.
 * 
 * Features:
 * - Multiple variants and sizes
 * - Interactive states with hover effects
 * - WCAG 2.1 AA compliant
 * - TypeScript type safety
 * - Responsive design support
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// CARD VARIANTS
// ============================================================================

const cardVariants = cva(
  'rounded-lg border bg-white text-gray-900 shadow-sm transition-colors dark:bg-gray-800 dark:text-gray-100',
  {
    variants: {
      variant: {
        default: 'border-gray-200 dark:border-gray-700',
        elevated: 'border-gray-200 shadow-md hover:shadow-lg dark:border-gray-700',
        outlined: 'border-2 border-gray-300 dark:border-gray-600',
        filled: 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-950',
        success: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950',
        warning: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950',
        error: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950',
        interactive: 'border-gray-200 hover:border-primary-300 hover:bg-gray-50 cursor-pointer dark:border-gray-700 dark:hover:border-primary-600 dark:hover:bg-gray-750',
      },
      size: {
        sm: 'p-3',
        default: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: true,
    },
  }
);

const cardHeaderVariants = cva(
  'flex items-center justify-between space-y-1.5',
  {
    variants: {
      alignment: {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
        between: 'justify-between',
      }
    },
    defaultVariants: {
      alignment: 'between',
    }
  }
);

const cardContentVariants = cva(
  '',
  {
    variants: {
      spacing: {
        none: '',
        sm: 'mt-2',
        default: 'mt-3',
        lg: 'mt-4',
        xl: 'mt-6',
      }
    },
    defaultVariants: {
      spacing: 'default',
    }
  }
);

const cardFooterVariants = cva(
  'flex items-center',
  {
    variants: {
      alignment: {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
        between: 'justify-between',
      },
      spacing: {
        none: '',
        sm: 'mt-2',
        default: 'mt-3',
        lg: 'mt-4',
        xl: 'mt-6',
      }
    },
    defaultVariants: {
      alignment: 'right',
      spacing: 'default',
    }
  }
);

// ============================================================================
// CARD COMPONENT
// ============================================================================

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, fullWidth, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'div' : 'div';

    return (
      <Comp
        ref={ref}
        className={cn(cardVariants({ variant, size, fullWidth }), className)}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

// ============================================================================
// CARD HEADER COMPONENT
// ============================================================================

export interface CardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardHeaderVariants> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, alignment, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardHeaderVariants({ alignment }), className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

// ============================================================================
// CARD TITLE COMPONENT
// ============================================================================

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as = 'h3', ...props }, ref) => {
    const Comp = as;
    return (
      <Comp
        ref={ref}
        className={cn(
          'text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100',
          className
        )}
        {...props}
      />
    );
  }
);
CardTitle.displayName = 'CardTitle';

// ============================================================================
// CARD DESCRIPTION COMPONENT
// ============================================================================

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-600 dark:text-gray-400', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

// ============================================================================
// CARD CONTENT COMPONENT
// ============================================================================

export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardContentVariants> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, spacing, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardContentVariants({ spacing }), className)}
      {...props}
    />
  )
);
CardContent.displayName = 'CardContent';

// ============================================================================
// CARD FOOTER COMPONENT
// ============================================================================

export interface CardFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardFooterVariants> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, alignment, spacing, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardFooterVariants({ alignment, spacing }), className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

// ============================================================================
// SPECIALIZED CARD COMPONENTS
// ============================================================================

/**
 * Statistics Card Component for displaying metrics
 */
export interface StatsCardProps extends CardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ title, value, description, trend, icon, className, ...props }, ref) => {
    const getTrendColor = (direction: 'up' | 'down' | 'neutral') => {
      switch (direction) {
        case 'up':
          return 'text-green-600 dark:text-green-400';
        case 'down':
          return 'text-red-600 dark:text-red-400';
        case 'neutral':
        default:
          return 'text-gray-600 dark:text-gray-400';
      }
    };

    const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
      switch (direction) {
        case 'up':
          return (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          );
        case 'down':
          return (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          );
        case 'neutral':
        default:
          return (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
          );
      }
    };

    return (
      <Card ref={ref} className={cn('relative overflow-hidden', className)} {...props}>
        <CardContent spacing="none">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{description}</p>
              )}
              {trend && (
                <div className={cn('flex items-center mt-2 text-sm', getTrendColor(trend.direction))}>
                  {getTrendIcon(trend.direction)}
                  <span className="ml-1">{trend.value}%</span>
                  <span className="ml-1 text-gray-600 dark:text-gray-400">{trend.label}</span>
                </div>
              )}
            </div>
            {icon && (
              <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
                {icon}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);
StatsCard.displayName = 'StatsCard';

/**
 * Action Card Component for quick actions
 */
export interface ActionCardProps extends CardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onAction?: () => void;
}

const ActionCard = React.forwardRef<HTMLDivElement, ActionCardProps>(
  ({ title, description, icon, action, onAction, className, ...props }, ref) => (
    <Card 
      ref={ref} 
      className={cn('cursor-pointer', className)} 
      variant="interactive"
      onClick={onAction}
      {...props}
    >
      <CardContent spacing="none">
        <div className="flex items-start space-x-3">
          {icon && (
            <div className="flex-shrink-0 text-primary-600 dark:text-primary-400">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
            )}
          </div>
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
);
ActionCard.displayName = 'ActionCard';

// ============================================================================
// EXPORTS
// ============================================================================

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatsCard,
  ActionCard,
  cardVariants,
  cardHeaderVariants,
  cardContentVariants,
  cardFooterVariants,
};

export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
  StatsCardProps,
  ActionCardProps,
};