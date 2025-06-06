import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Progress Component
 * 
 * A customizable progress bar component built with Tailwind CSS.
 * Supports different variants and sizes with smooth animations.
 * 
 * @param {ProgressProps} props - Progress component props
 * @returns {JSX.Element} Progress component
 */

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
  label?: string;
}

const progressVariants = {
  variant: {
    default: 'bg-primary-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  },
  size: {
    sm: 'h-1',
    default: 'h-2',
    lg: 'h-3',
  },
};

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    value = 0, 
    max = 100, 
    variant = 'default', 
    size = 'default',
    showLabel = false,
    label,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    return (
      <div 
        className={cn('w-full', className)} 
        ref={ref} 
        {...props}
      >
        {(showLabel || label) && (
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label || 'Progress'}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        
        <div className={cn(
          'w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden',
          progressVariants.size[size]
        )}>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300 ease-out',
              progressVariants.variant[variant]
            )}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={label || `Progress: ${Math.round(percentage)}%`}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress, progressVariants };