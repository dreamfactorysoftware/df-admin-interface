'use client';

import React from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Badge component variants using class-variance-authority for dynamic styling
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition-all duration-200 ease-in-out',
  {
    variants: {
      variant: {
        active: 'bg-success-50 text-success-700 border border-success-200 hover:bg-success-100',
        inactive: 'bg-error-50 text-error-700 border border-error-200 hover:bg-error-100',
        loading: 'bg-gray-100 text-gray-500 border border-gray-200 animate-pulse'
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm'
      }
    },
    defaultVariants: {
      variant: 'inactive',
      size: 'md'
    }
  }
);

// Tooltip component using Headless UI patterns
interface TooltipProps {
  children: React.ReactNode;
  content: string;
  disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, disabled = false }) => {
  if (disabled) return <>{children}</>;

  return (
    <div className="relative group">
      {children}
      <div className="invisible group-hover:visible absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap transition-all duration-150 ease-in-out opacity-0 group-hover:opacity-100">
        {content}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};

// Scheduler status enum for type safety
export enum SchedulerTaskStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

// Component props interface
export interface SchedulerStatusIndicatorProps extends VariantProps<typeof badgeVariants> {
  /** The status of the scheduler task */
  status: boolean | SchedulerTaskStatus;
  /** Custom status message for tooltip */
  statusMessage?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether the component is in loading state */
  isLoading?: boolean;
  /** Whether to show tooltip */
  showTooltip?: boolean;
  /** Custom active label */
  activeLabel?: string;
  /** Custom inactive label */
  inactiveLabel?: string;
  /** Accessibility label override */
  ariaLabel?: string;
}

/**
 * SchedulerStatusIndicator displays visual status indicators for scheduler tasks
 * using Tailwind CSS badges and icons. Shows active/inactive status with color-coded
 * badges, provides tooltip information for status details, and includes accessibility
 * features for screen readers.
 */
export const SchedulerStatusIndicator: React.FC<SchedulerStatusIndicatorProps> = ({
  status,
  statusMessage,
  className,
  isLoading = false,
  showTooltip = true,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
  ariaLabel,
  size = 'md',
  ...props
}) => {
  // Normalize status to boolean for consistent handling
  const isActive = React.useMemo(() => {
    if (typeof status === 'boolean') return status;
    if (typeof status === 'string') return status === SchedulerTaskStatus.ACTIVE;
    return false;
  }, [status]);

  // Determine variant based on loading state and status
  const variant = React.useMemo(() => {
    if (isLoading) return 'loading';
    return isActive ? 'active' : 'inactive';
  }, [isLoading, isActive]);

  // Generate status text
  const statusText = React.useMemo(() => {
    if (isLoading) return 'Loading...';
    return isActive ? activeLabel : inactiveLabel;
  }, [isLoading, isActive, activeLabel, inactiveLabel]);

  // Generate tooltip content
  const tooltipContent = React.useMemo(() => {
    if (statusMessage) return statusMessage;
    if (isLoading) return 'Loading scheduler task status...';
    
    const baseMessage = isActive 
      ? 'Scheduler task is currently active and will execute on schedule'
      : 'Scheduler task is inactive and will not execute';
    
    return baseMessage;
  }, [statusMessage, isLoading, isActive]);

  // Generate icon component
  const StatusIcon = React.useMemo(() => {
    if (isLoading) {
      return (
        <div className="w-3 h-3 rounded-full bg-gray-400 animate-pulse" aria-hidden="true" />
      );
    }
    
    if (isActive) {
      return (
        <CheckIcon 
          className="w-3 h-3 text-success-600" 
          aria-hidden="true"
        />
      );
    }
    
    return (
      <XMarkIcon 
        className="w-3 h-3 text-error-600" 
        aria-hidden="true"
      />
    );
  }, [isLoading, isActive]);

  // Generate accessibility label
  const accessibilityLabel = React.useMemo(() => {
    if (ariaLabel) return ariaLabel;
    if (isLoading) return 'Scheduler task status loading';
    return `Scheduler task status: ${statusText}`;
  }, [ariaLabel, isLoading, statusText]);

  // Badge component
  const badge = (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      role="status"
      aria-label={accessibilityLabel}
      {...props}
    >
      {StatusIcon}
      <span className="select-none">{statusText}</span>
    </span>
  );

  // Wrap with tooltip if enabled and not loading
  if (showTooltip && !isLoading) {
    return (
      <Tooltip content={tooltipContent} disabled={isLoading}>
        {badge}
      </Tooltip>
    );
  }

  return badge;
};

// Default export for convenient importing
export default SchedulerStatusIndicator;

// Export types for external usage
export type { SchedulerStatusIndicatorProps };