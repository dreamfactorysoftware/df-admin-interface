/**
 * Badge Component for React/Next.js refactor of DreamFactory Admin Interface
 * 
 * Accessible badge components with WCAG 2.1 AA compliance, replacing Angular
 * Material chips with Tailwind CSS implementation. Provides semantic colors,
 * proper contrast ratios, and screen reader support.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client'

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// =============================================================================
// VARIANT DEFINITIONS
// =============================================================================

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700',
        secondary:
          'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
        destructive:
          'border-transparent bg-error-500 text-white hover:bg-error-600 dark:bg-error-600 dark:hover:bg-error-700',
        success:
          'border-transparent bg-success-500 text-white hover:bg-success-600 dark:bg-success-600 dark:hover:bg-success-700',
        warning:
          'border-transparent bg-warning-500 text-white hover:bg-warning-600 dark:bg-warning-600 dark:hover:bg-warning-700',
        info:
          'border-transparent bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700',
        outline:
          'border-gray-200 text-gray-900 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800',
        'outline-destructive':
          'border-error-200 text-error-600 hover:bg-error-50 dark:border-error-800 dark:text-error-400 dark:hover:bg-error-950',
        'outline-success':
          'border-success-200 text-success-600 hover:bg-success-50 dark:border-success-800 dark:text-success-400 dark:hover:bg-success-950',
        'outline-warning':
          'border-warning-200 text-warning-600 hover:bg-warning-50 dark:border-warning-800 dark:text-warning-400 dark:hover:bg-warning-950',
        'outline-info':
          'border-primary-200 text-primary-600 hover:bg-primary-50 dark:border-primary-800 dark:text-primary-400 dark:hover:bg-primary-950',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
      shape: {
        rounded: 'rounded-full',
        square: 'rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      shape: 'rounded',
    },
  }
)

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Icon component to display before the text
   */
  icon?: React.ComponentType<{ className?: string }>
  
  /**
   * Icon component to display after the text (e.g., close button)
   */
  endIcon?: React.ComponentType<{ className?: string }>
  
  /**
   * Whether the badge can be dismissed
   */
  dismissible?: boolean
  
  /**
   * Callback when badge is dismissed
   */
  onDismiss?: () => void
  
  /**
   * Show a dot indicator
   */
  dot?: boolean
  
  /**
   * Dot color for status indication
   */
  dotColor?: 'default' | 'success' | 'warning' | 'error' | 'info'
  
  /**
   * Badge count or number display
   */
  count?: number | string
  
  /**
   * Maximum count to display (shows 99+ if exceeded)
   */
  maxCount?: number
  
  /**
   * Show zero count
   */
  showZero?: boolean
  
  /**
   * Pulse animation for notifications
   */
  pulse?: boolean
  
  /**
   * Accessible label for screen readers
   */
  accessibleLabel?: string
}

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'online' | 'offline' | 'away' | 'busy' | 'idle'
}

export interface CountBadgeProps extends Omit<BadgeProps, 'children'> {
  count: number | string
  maxCount?: number
  showZero?: boolean
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get variant based on status
 */
function getStatusVariant(status: StatusBadgeProps['status']): BadgeProps['variant'] {
  switch (status) {
    case 'online':
      return 'success'
    case 'offline':
      return 'secondary'
    case 'away':
      return 'warning'
    case 'busy':
      return 'destructive'
    case 'idle':
      return 'info'
    default:
      return 'default'
  }
}

/**
 * Get dot color classes
 */
function getDotColorClasses(color: BadgeProps['dotColor']): string {
  switch (color) {
    case 'success':
      return 'bg-success-500'
    case 'warning':
      return 'bg-warning-500'
    case 'error':
      return 'bg-error-500'
    case 'info':
      return 'bg-primary-500'
    default:
      return 'bg-gray-500'
  }
}

/**
 * Format count display
 */
function formatCount(count: number | string, maxCount?: number): string {
  if (typeof count === 'string') return count
  if (typeof maxCount === 'number' && count > maxCount) {
    return `${maxCount}+`
  }
  return count.toString()
}

// =============================================================================
// MAIN BADGE COMPONENT
// =============================================================================

/**
 * Badge Component
 */
export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      icon: Icon,
      endIcon: EndIcon,
      dismissible = false,
      onDismiss,
      dot = false,
      dotColor = 'default',
      count,
      maxCount = 99,
      showZero = false,
      pulse = false,
      accessibleLabel,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    // Handle count display
    const shouldShowCount = count !== undefined && (count > 0 || showZero)
    const displayCount = shouldShowCount ? formatCount(count, maxCount) : null

    // Handle dismiss functionality
    const handleDismiss = (e: React.MouseEvent) => {
      e.stopPropagation()
      onDismiss?.()
    }

    // Determine if badge is interactive
    const isInteractive = onClick || dismissible

    return (
      <div
        ref={ref}
        className={cn(
          badgeVariants({ variant, size, shape }),
          pulse && 'animate-pulse',
          isInteractive && 'cursor-pointer',
          className
        )}
        onClick={onClick}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-label={accessibleLabel || (typeof children === 'string' ? children : undefined)}
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onClick?.(e as any)
                }
              }
            : undefined
        }
        {...props}
      >
        {/* Leading icon */}
        {Icon && (
          <Icon className={cn('mr-1 h-3 w-3', size === 'lg' && 'h-4 w-4')} />
        )}
        
        {/* Dot indicator */}
        {dot && (
          <span
            className={cn(
              'mr-1.5 h-2 w-2 rounded-full',
              getDotColorClasses(dotColor),
              pulse && 'animate-pulse'
            )}
            aria-hidden="true"
          />
        )}
        
        {/* Badge content */}
        <span className="flex-1">
          {shouldShowCount ? displayCount : children}
        </span>
        
        {/* Trailing icon */}
        {EndIcon && (
          <EndIcon className={cn('ml-1 h-3 w-3', size === 'lg' && 'h-4 w-4')} />
        )}
        
        {/* Dismiss button */}
        {dismissible && (
          <button
            type="button"
            className={cn(
              'ml-1 inline-flex items-center justify-center rounded-full hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-offset-1',
              size === 'sm' && 'h-3 w-3',
              size === 'md' && 'h-4 w-4',
              size === 'lg' && 'h-5 w-5'
            )}
            onClick={handleDismiss}
            aria-label="Remove badge"
          >
            <svg
              className="h-2.5 w-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
    )
  }
)

Badge.displayName = 'Badge'

// =============================================================================
// STATUS BADGE COMPONENT
// =============================================================================

/**
 * Status Badge Component
 */
export const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, dot = true, pulse, children, ...props }, ref) => {
    const variant = getStatusVariant(status)
    const shouldPulse = pulse || (status === 'online' && !children)
    
    // Status labels for accessibility
    const statusLabels = {
      online: 'Online',
      offline: 'Offline', 
      away: 'Away',
      busy: 'Busy',
      idle: 'Idle',
    }

    return (
      <Badge
        ref={ref}
        variant={variant}
        dot={dot}
        dotColor={variant}
        pulse={shouldPulse}
        accessibleLabel={`Status: ${statusLabels[status]}`}
        {...props}
      >
        {children || statusLabels[status]}
      </Badge>
    )
  }
)

StatusBadge.displayName = 'StatusBadge'

// =============================================================================
// COUNT BADGE COMPONENT
// =============================================================================

/**
 * Count Badge Component
 */
export const CountBadge = React.forwardRef<HTMLDivElement, CountBadgeProps>(
  ({ count, maxCount = 99, showZero = false, variant = 'destructive', ...props }, ref) => {
    const shouldShow = count > 0 || (showZero && count === 0)
    
    if (!shouldShow) {
      return null
    }

    const displayCount = formatCount(count, maxCount)
    
    return (
      <Badge
        ref={ref}
        variant={variant}
        size="sm"
        accessibleLabel={`${count} notifications`}
        {...props}
      >
        {displayCount}
      </Badge>
    )
  }
)

CountBadge.displayName = 'CountBadge'

// =============================================================================
// NOTIFICATION BADGE COMPONENT
// =============================================================================

/**
 * Notification Badge Component (positioned absolutely)
 */
export const NotificationBadge: React.FC<{
  count: number | string
  maxCount?: number
  showZero?: boolean
  variant?: BadgeProps['variant']
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  offset?: { x?: number; y?: number }
  children: React.ReactNode
  className?: string
}> = ({
  count,
  maxCount = 99,
  showZero = false,
  variant = 'destructive',
  position = 'top-right',
  offset = {},
  children,
  className,
}) => {
  const shouldShow = count > 0 || (showZero && count === 0)
  
  const positionClasses = {
    'top-right': 'top-0 right-0 -translate-y-1/2 translate-x-1/2',
    'top-left': 'top-0 left-0 -translate-y-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-0 right-0 translate-y-1/2 translate-x-1/2',
    'bottom-left': 'bottom-0 left-0 translate-y-1/2 -translate-x-1/2',
  }

  return (
    <div className={cn('relative inline-block', className)}>
      {children}
      {shouldShow && (
        <CountBadge
          count={count}
          maxCount={maxCount}
          showZero={showZero}
          variant={variant}
          className={cn(
            'absolute transform',
            positionClasses[position]
          )}
          style={{
            transform: `${positionClasses[position].split(' ').pop()} translate(${offset.x || 0}px, ${offset.y || 0}px)`,
          }}
        />
      )}
    </div>
  )
}

// =============================================================================
// BADGE GROUP COMPONENT
// =============================================================================

/**
 * Badge Group Component for multiple badges
 */
export const BadgeGroup: React.FC<{
  badges: Array<BadgeProps & { id: string }>
  className?: string
  spacing?: 'tight' | 'normal' | 'loose'
  wrap?: boolean
}> = ({ badges, className, spacing = 'normal', wrap = true }) => {
  const spacingClasses = {
    tight: 'gap-1',
    normal: 'gap-2',
    loose: 'gap-3',
  }

  return (
    <div
      className={cn(
        'flex items-center',
        spacingClasses[spacing],
        wrap && 'flex-wrap',
        className
      )}
      role="group"
      aria-label="Badge group"
    >
      {badges.map(({ id, ...badgeProps }) => (
        <Badge key={id} {...badgeProps} />
      ))}
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export { badgeVariants }

export type {
  BadgeProps,
  StatusBadgeProps, 
  CountBadgeProps,
}