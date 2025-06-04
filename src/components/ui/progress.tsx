/**
 * Progress Component for React/Next.js refactor of DreamFactory Admin Interface
 * 
 * Accessible progress indicators implementing WCAG 2.1 AA compliance with
 * proper ARIA attributes, keyboard navigation, and screen reader support.
 * Replaces Angular Material progress bars with Tailwind CSS implementation.
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

const progressVariants = cva(
  'relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700',
  {
    variants: {
      size: {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
        xl: 'h-4',
      },
      variant: {
        default: 'bg-gray-200 dark:bg-gray-700',
        success: 'bg-success-100 dark:bg-success-900',
        warning: 'bg-warning-100 dark:bg-warning-900',
        error: 'bg-error-100 dark:bg-error-900',
        info: 'bg-primary-100 dark:bg-primary-900',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
)

const progressBarVariants = cva(
  'h-full w-full flex-1 bg-primary-500 transition-all duration-300 ease-in-out',
  {
    variants: {
      variant: {
        default: 'bg-primary-500 dark:bg-primary-400',
        success: 'bg-success-500 dark:bg-success-400',
        warning: 'bg-warning-500 dark:bg-warning-400',
        error: 'bg-error-500 dark:bg-error-400',
        info: 'bg-primary-500 dark:bg-primary-400',
      },
      animated: {
        true: 'animate-pulse',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      animated: false,
    },
  }
)

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value?: number
  max?: number
  label?: string
  showValue?: boolean
  showPercentage?: boolean
  animated?: boolean
  indeterminate?: boolean
  color?: 'default' | 'success' | 'warning' | 'error' | 'info'
  formatValue?: (value: number, max: number) => string
  children?: React.ReactNode
}

export interface CircularProgressProps
  extends Omit<ProgressProps, 'size'> {
  size?: number
  strokeWidth?: number
  showLabel?: boolean
  centerContent?: React.ReactNode
}

export interface ProgressBarProps extends ProgressProps {
  segments?: Array<{
    value: number
    color: string
    label?: string
  }>
  stacked?: boolean
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate progress percentage
 */
function calculatePercentage(value: number, max: number): number {
  if (max <= 0) return 0
  return Math.min(Math.max((value / max) * 100, 0), 100)
}

/**
 * Get color variant based on progress value
 */
function getVariantByValue(value: number, max: number): ProgressProps['variant'] {
  const percentage = calculatePercentage(value, max)
  
  if (percentage >= 90) return 'success'
  if (percentage >= 70) return 'info'
  if (percentage >= 50) return 'warning'
  return 'error'
}

/**
 * Format progress value display
 */
function defaultFormatValue(value: number, max: number): string {
  return `${Math.round(value)} / ${Math.round(max)}`
}

// =============================================================================
// MAIN PROGRESS COMPONENT
// =============================================================================

/**
 * Linear Progress Bar Component
 */
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      label,
      showValue = false,
      showPercentage = false,
      animated = false,
      indeterminate = false,
      size,
      variant,
      color,
      formatValue = defaultFormatValue,
      children,
      ...props
    },
    ref
  ) => {
    const percentage = indeterminate ? 0 : calculatePercentage(value, max)
    const displayVariant = variant || color || (indeterminate ? 'info' : getVariantByValue(value, max))
    
    // Generate unique IDs for accessibility
    const progressId = React.useId()
    const labelId = label ? `${progressId}-label` : undefined
    const valueId = (showValue || showPercentage) ? `${progressId}-value` : undefined

    return (
      <div className="w-full space-y-2">
        {/* Label and value display */}
        {(label || showValue || showPercentage || children) && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              {label && (
                <span 
                  id={labelId}
                  className="font-medium text-gray-900 dark:text-gray-100"
                >
                  {label}
                </span>
              )}
              {children}
            </div>
            
            {(showValue || showPercentage) && (
              <span 
                id={valueId}
                className="text-gray-600 dark:text-gray-400"
                aria-live="polite"
              >
                {showPercentage && `${Math.round(percentage)}%`}
                {showValue && showPercentage && ' '}
                {showValue && `(${formatValue(value, max)})`}
              </span>
            )}
          </div>
        )}
        
        {/* Progress bar */}
        <div
          ref={ref}
          className={cn(progressVariants({ size, variant: displayVariant }), className)}
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-labelledby={labelId}
          aria-describedby={valueId}
          aria-label={indeterminate ? 'Loading...' : `Progress: ${Math.round(percentage)}%`}
          {...props}
        >
          <div
            className={cn(
              progressBarVariants({ 
                variant: displayVariant, 
                animated: animated || indeterminate 
              }),
              indeterminate && 'animate-pulse'
            )}
            style={{
              transform: indeterminate 
                ? 'translateX(-100%)' 
                : `translateX(-${100 - percentage}%)`,
              animation: indeterminate 
                ? 'progress-indeterminate 2s ease-in-out infinite' 
                : undefined,
            }}
          />
        </div>
      </div>
    )
  }
)

Progress.displayName = 'Progress'

// =============================================================================
// CIRCULAR PROGRESS COMPONENT
// =============================================================================

/**
 * Circular Progress Component
 */
export const CircularProgress = React.forwardRef<HTMLDivElement, CircularProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      label,
      showValue = false,
      showPercentage = true,
      showLabel = true,
      animated = false,
      indeterminate = false,
      variant = 'default',
      color,
      size = 80,
      strokeWidth = 8,
      formatValue = defaultFormatValue,
      centerContent,
      ...props
    },
    ref
  ) => {
    const percentage = indeterminate ? 25 : calculatePercentage(value, max)
    const displayVariant = variant || color || (indeterminate ? 'info' : getVariantByValue(value, max))
    
    // SVG circle calculations
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDasharray = circumference
    const strokeDashoffset = indeterminate 
      ? circumference * 0.75 
      : circumference - (percentage / 100) * circumference

    // Generate unique IDs for accessibility
    const progressId = React.useId()
    const labelId = label ? `${progressId}-label` : undefined

    // Color mappings for circular progress
    const strokeColors = {
      default: 'stroke-primary-500 dark:stroke-primary-400',
      success: 'stroke-success-500 dark:stroke-success-400',
      warning: 'stroke-warning-500 dark:stroke-warning-400',
      error: 'stroke-error-500 dark:stroke-error-400',
      info: 'stroke-primary-500 dark:stroke-primary-400',
    }

    return (
      <div 
        ref={ref}
        className={cn('relative inline-flex flex-col items-center', className)}
        {...props}
      >
        {/* Label */}
        {label && showLabel && (
          <div 
            id={labelId}
            className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            {label}
          </div>
        )}
        
        {/* Circular progress SVG */}
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            className="transform -rotate-90"
            width={size}
            height={size}
            role="progressbar"
            aria-valuenow={indeterminate ? undefined : value}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-labelledby={labelId}
            aria-label={indeterminate ? 'Loading...' : `Progress: ${Math.round(percentage)}%`}
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-gray-200 dark:text-gray-700"
            />
            
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={cn(
                strokeColors[displayVariant],
                'transition-all duration-300 ease-in-out',
                indeterminate && 'animate-spin',
                animated && 'animate-pulse'
              )}
              style={{
                animation: indeterminate 
                  ? 'spin 2s linear infinite' 
                  : undefined,
              }}
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            {centerContent || (
              <div className="text-center">
                {showPercentage && (
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {indeterminate ? '...' : `${Math.round(percentage)}%`}
                  </div>
                )}
                {showValue && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {indeterminate ? 'Loading' : formatValue(value, max)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
)

CircularProgress.displayName = 'CircularProgress'

// =============================================================================
// SEGMENTED PROGRESS COMPONENT
// =============================================================================

/**
 * Segmented Progress Bar for multiple values
 */
export const SegmentedProgress = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      segments = [],
      max = 100,
      label,
      showValue = false,
      showPercentage = false,
      size,
      stacked = false,
      ...props
    },
    ref
  ) => {
    const totalValue = segments.reduce((sum, segment) => sum + segment.value, 0)
    const progressId = React.useId()
    const labelId = label ? `${progressId}-label` : undefined

    return (
      <div className="w-full space-y-2">
        {/* Label */}
        {label && (
          <div className="flex items-center justify-between text-sm">
            <span 
              id={labelId}
              className="font-medium text-gray-900 dark:text-gray-100"
            >
              {label}
            </span>
            {(showValue || showPercentage) && (
              <span className="text-gray-600 dark:text-gray-400">
                {showPercentage && `${Math.round((totalValue / max) * 100)}%`}
                {showValue && showPercentage && ' '}
                {showValue && `(${Math.round(totalValue)} / ${Math.round(max)})`}
              </span>
            )}
          </div>
        )}
        
        {/* Segmented progress bar */}
        <div
          ref={ref}
          className={cn(progressVariants({ size }), className)}
          role="progressbar"
          aria-valuenow={totalValue}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-labelledby={labelId}
          aria-label={`Progress: ${Math.round((totalValue / max) * 100)}%`}
          {...props}
        >
          {stacked ? (
            // Stacked segments
            <div className="flex h-full">
              {segments.map((segment, index) => {
                const segmentPercentage = (segment.value / max) * 100
                return (
                  <div
                    key={index}
                    className="h-full transition-all duration-300 ease-in-out"
                    style={{
                      width: `${segmentPercentage}%`,
                      backgroundColor: segment.color,
                    }}
                    title={segment.label || `Segment ${index + 1}: ${segment.value}`}
                  />
                )
              })}
            </div>
          ) : (
            // Overlaid segments (default)
            segments.map((segment, index) => {
              const segmentPercentage = calculatePercentage(segment.value, max)
              return (
                <div
                  key={index}
                  className="absolute inset-0 h-full transition-all duration-300 ease-in-out"
                  style={{
                    width: `${segmentPercentage}%`,
                    backgroundColor: segment.color,
                    zIndex: segments.length - index,
                  }}
                  title={segment.label || `Segment ${index + 1}: ${segment.value}`}
                />
              )
            })
          )}
        </div>
        
        {/* Legend for segments */}
        {segments.length > 1 && (
          <div className="flex flex-wrap gap-2 text-xs">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center space-x-1">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: segment.color }}
                  aria-hidden="true"
                />
                <span className="text-gray-600 dark:text-gray-400">
                  {segment.label || `Segment ${index + 1}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)

SegmentedProgress.displayName = 'SegmentedProgress'

// =============================================================================
// PROGRESS INDICATOR COMPONENT
// =============================================================================

/**
 * Simple progress indicator for loading states
 */
export const ProgressIndicator: React.FC<{
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  className?: string
  label?: string
}> = ({ size = 'md', variant = 'default', className, label }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8',
  }

  const colorClasses = {
    default: 'border-primary-500',
    success: 'border-success-500',
    warning: 'border-warning-500',
    error: 'border-error-500',
    info: 'border-primary-500',
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-t-transparent',
          sizeClasses[size],
          colorClasses[variant]
        )}
        role="status"
        aria-label={label || 'Loading...'}
      />
      {label && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {label}
        </span>
      )}
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  progressVariants,
  progressBarVariants,
  calculatePercentage,
  getVariantByValue,
}

export type {
  ProgressProps,
  CircularProgressProps,
  ProgressBarProps,
}