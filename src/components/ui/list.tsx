/**
 * List Component for React/Next.js refactor of DreamFactory Admin Interface
 * 
 * Accessible and flexible list components with WCAG 2.1 AA compliance,
 * replacing Angular Material lists with Headless UI and Tailwind CSS
 * implementation. Optimized for system information display.
 * 
 * Features:
 * - Multiple variants for different use cases
 * - Interactive states with hover effects
 * - WCAG 2.1 AA compliant
 * - TypeScript type safety
 * - Responsive design support
 * - Keyboard navigation support
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// LIST VARIANTS
// ============================================================================

const listVariants = cva(
  'space-y-0',
  {
    variants: {
      variant: {
        default: 'divide-y divide-gray-200 dark:divide-gray-700',
        plain: '',
        bordered: 'border border-gray-200 rounded-lg dark:border-gray-700',
        separated: 'space-y-2',
      },
      size: {
        sm: 'text-sm',
        default: '',
        lg: 'text-lg',
      },
      spacing: {
        tight: 'space-y-1',
        default: 'space-y-0',
        loose: 'space-y-3',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      spacing: 'default',
    },
  }
);

const listItemVariants = cva(
  'flex items-center justify-between py-3 px-0 text-gray-900 dark:text-gray-100',
  {
    variants: {
      variant: {
        default: 'first:pt-0 last:pb-0',
        plain: 'py-1',
        bordered: 'px-4 first:rounded-t-lg last:rounded-b-lg',
        separated: 'bg-white dark:bg-gray-800 rounded-lg px-4 py-3 shadow-sm',
        interactive: 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors',
      },
      size: {
        sm: 'py-2 text-sm',
        default: 'py-3',
        lg: 'py-4 text-lg',
      },
      alignment: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      alignment: 'between',
    },
  }
);

// ============================================================================
// LIST COMPONENT
// ============================================================================

export interface ListProps
  extends React.HTMLAttributes<HTMLUListElement>,
    VariantProps<typeof listVariants> {
  /** Whether to render as ordered list */
  ordered?: boolean;
  /** Custom divider element */
  divider?: React.ReactNode;
}

const List = React.forwardRef<HTMLUListElement, ListProps>(
  ({ className, variant, size, spacing, ordered = false, children, ...props }, ref) => {
    const Component = ordered ? 'ol' : 'ul';

    return (
      <Component
        ref={ref}
        className={cn(
          listVariants({ variant, size, spacing }),
          className
        )}
        role={ordered ? 'list' : 'list'}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
List.displayName = 'List';

// ============================================================================
// LIST ITEM COMPONENT
// ============================================================================

export interface ListItemProps
  extends React.HTMLAttributes<HTMLLIElement>,
    VariantProps<typeof listItemVariants> {
  /** Leading icon or element */
  leading?: React.ReactNode;
  /** Trailing icon or element */
  trailing?: React.ReactNode;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Whether the item is selected */
  selected?: boolean;
  /** Click handler for interactive items */
  onSelect?: () => void;
}

const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  ({ 
    className, 
    variant, 
    size, 
    alignment,
    leading,
    trailing,
    disabled = false,
    selected = false,
    onSelect,
    children,
    onClick,
    ...props 
  }, ref) => {
    const isInteractive = !!(onSelect || onClick);
    
    const handleClick = (e: React.MouseEvent<HTMLLIElement>) => {
      if (disabled) return;
      onClick?.(e);
      onSelect?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLLIElement>) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect?.();
      }
    };

    return (
      <li
        ref={ref}
        className={cn(
          listItemVariants({ 
            variant: isInteractive ? 'interactive' : variant, 
            size, 
            alignment 
          }),
          disabled && 'opacity-50 cursor-not-allowed',
          selected && 'bg-primary-50 text-primary-900 dark:bg-primary-950 dark:text-primary-100',
          className
        )}
        onClick={handleClick}
        onKeyDown={isInteractive ? handleKeyDown : undefined}
        tabIndex={isInteractive && !disabled ? 0 : undefined}
        role={isInteractive ? 'button' : undefined}
        aria-disabled={disabled}
        aria-selected={selected}
        {...props}
      >
        {leading && (
          <div className="flex-shrink-0 mr-3">
            {leading}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {children}
        </div>
        
        {trailing && (
          <div className="flex-shrink-0 ml-3">
            {trailing}
          </div>
        )}
      </li>
    );
  }
);
ListItem.displayName = 'ListItem';

// ============================================================================
// DESCRIPTION LIST COMPONENTS
// ============================================================================

export interface DescriptionListProps extends React.HTMLAttributes<HTMLDListElement> {
  variant?: 'default' | 'horizontal' | 'vertical';
  spacing?: 'tight' | 'default' | 'loose';
}

const DescriptionList = React.forwardRef<HTMLDListElement, DescriptionListProps>(
  ({ className, variant = 'default', spacing = 'default', children, ...props }, ref) => {
    const spacingClasses = {
      tight: 'space-y-1',
      default: 'space-y-3',
      loose: 'space-y-6',
    };

    const variantClasses = {
      default: 'space-y-3',
      horizontal: 'space-y-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0',
      vertical: 'space-y-6',
    };

    return (
      <dl
        ref={ref}
        className={cn(
          variantClasses[variant],
          spacingClasses[spacing],
          className
        )}
        {...props}
      >
        {children}
      </dl>
    );
  }
);
DescriptionList.displayName = 'DescriptionList';

export interface DescriptionTermProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'dt' | 'div';
}

const DescriptionTerm = React.forwardRef<HTMLElement, DescriptionTermProps>(
  ({ className, as = 'dt', children, ...props }, ref) => {
    const Component = as;
    
    return (
      <Component
        ref={ref}
        className={cn(
          'text-sm font-medium text-gray-900 dark:text-gray-100',
          'sm:col-span-1',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
DescriptionTerm.displayName = 'DescriptionTerm';

export interface DescriptionDetailsProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'dd' | 'div';
}

const DescriptionDetails = React.forwardRef<HTMLElement, DescriptionDetailsProps>(
  ({ className, as = 'dd', children, ...props }, ref) => {
    const Component = as;
    
    return (
      <Component
        ref={ref}
        className={cn(
          'text-sm text-gray-700 dark:text-gray-300',
          'sm:col-span-2',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
DescriptionDetails.displayName = 'DescriptionDetails';

// ============================================================================
// KEY-VALUE LIST COMPONENT
// ============================================================================

export interface KeyValueListProps extends React.HTMLAttributes<HTMLDListElement> {
  items: Array<{
    key: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    badge?: React.ReactNode;
  }>;
  variant?: 'default' | 'horizontal' | 'cards';
  spacing?: 'tight' | 'default' | 'loose';
}

const KeyValueList = React.forwardRef<HTMLDListElement, KeyValueListProps>(
  ({ className, items, variant = 'default', spacing = 'default', ...props }, ref) => {
    const isCards = variant === 'cards';
    
    return (
      <DescriptionList
        ref={ref}
        variant={variant === 'cards' ? 'vertical' : variant}
        spacing={spacing}
        className={cn(
          isCards && 'grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          className
        )}
        {...props}
      >
        {items.map((item, index) => (
          <div
            key={`${item.key}-${index}`}
            className={cn(
              isCards && 'bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700'
            )}
          >
            <DescriptionTerm className={cn(
              'flex items-center',
              isCards && 'text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide'
            )}>
              {item.icon && (
                <span className="mr-2 text-gray-400 dark:text-gray-500">
                  {item.icon}
                </span>
              )}
              {item.key}
            </DescriptionTerm>
            <DescriptionDetails className={cn(
              'flex items-center justify-between',
              isCards && 'mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100'
            )}>
              <span className="break-words">{item.value}</span>
              {item.badge && (
                <span className="ml-2 flex-shrink-0">
                  {item.badge}
                </span>
              )}
            </DescriptionDetails>
          </div>
        ))}
      </DescriptionList>
    );
  }
);
KeyValueList.displayName = 'KeyValueList';

// ============================================================================
// EXPORTS
// ============================================================================

export {
  List,
  ListItem,
  DescriptionList,
  DescriptionTerm,
  DescriptionDetails,
  KeyValueList,
  listVariants,
  listItemVariants,
};

export type {
  ListProps,
  ListItemProps,
  DescriptionListProps,
  DescriptionTermProps,
  DescriptionDetailsProps,
  KeyValueListProps,
};