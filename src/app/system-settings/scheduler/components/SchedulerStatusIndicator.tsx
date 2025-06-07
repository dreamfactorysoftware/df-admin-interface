/**
 * SchedulerStatusIndicator Component
 * 
 * Displays visual status indicators for scheduler tasks using Tailwind CSS badges and icons.
 * Shows active/inactive status with color-coded badges, provides tooltip information for status details,
 * and includes accessibility features for screen readers. Replaces Angular status display logic 
 * with modern React patterns.
 */

'use client';

import React, { useState } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { SchedulerTaskData } from '@/types/scheduler';
import { cn } from '@/lib/utils';

/**
 * Status type enumeration for different scheduler task states
 */
export type SchedulerStatus = 'active' | 'inactive' | 'loading' | 'error';

/**
 * Props interface for SchedulerStatusIndicator component
 */
export interface SchedulerStatusIndicatorProps {
  /**
   * Scheduler task data containing status information
   */
  task?: SchedulerTaskData;
  
  /**
   * Override status value (takes precedence over task.isActive)
   */
  status?: SchedulerStatus;
  
  /**
   * Custom status message for tooltip display
   */
  statusMessage?: string;
  
  /**
   * Whether to show loading skeleton placeholder
   */
  loading?: boolean;
  
  /**
   * Badge size variant
   */
  size?: 'default' | 'sm' | 'lg';
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Whether to show icon in the badge
   */
  showIcon?: boolean;
  
  /**
   * Custom aria-label for accessibility
   */
  ariaLabel?: string;
}

/**
 * Simple tooltip wrapper component for status information
 */
interface TooltipProps {
  children: React.ReactNode;
  content: string;
  disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, disabled = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div 
          className="absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap dark:bg-gray-700"
          role="tooltip"
          aria-hidden="false"
        >
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
        </div>
      )}
    </div>
  );
};

/**
 * Loading skeleton component for status indicator
 */
const StatusSkeleton: React.FC<{ size?: 'default' | 'sm' | 'lg' }> = ({ size = 'default' }) => {
  const sizeClasses = {
    sm: 'h-5 w-16',
    default: 'h-6 w-20', 
    lg: 'h-7 w-24'
  };

  return (
    <div 
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full',
        sizeClasses[size]
      )}
      role="status"
      aria-label="Loading status indicator"
    />
  );
};

/**
 * Determines the status from task data or explicit status prop
 */
const getTaskStatus = (task?: SchedulerTaskData, explicitStatus?: SchedulerStatus): SchedulerStatus => {
  if (explicitStatus) {
    return explicitStatus;
  }
  
  if (!task) {
    return 'inactive';
  }
  
  // Check if task has recent execution errors
  const hasRecentError = task.taskLogByTaskId?.statusCode && 
    (task.taskLogByTaskId.statusCode >= 400 || task.taskLogByTaskId.errorMessage);
  
  if (hasRecentError) {
    return 'error';
  }
  
  return task.isActive ? 'active' : 'inactive';
};

/**
 * Gets the appropriate status message for tooltip display
 */
const getStatusMessage = (
  status: SchedulerStatus, 
  task?: SchedulerTaskData, 
  customMessage?: string
): string => {
  if (customMessage) {
    return customMessage;
  }
  
  switch (status) {
    case 'active':
      if (task?.taskLogByTaskId?.endTime) {
        const lastRun = new Date(task.taskLogByTaskId.endTime).toLocaleString();
        return `Active - Last executed: ${lastRun}`;
      }
      return 'Active - Task is enabled and will run according to schedule';
      
    case 'inactive':
      return 'Inactive - Task is disabled and will not run';
      
    case 'error':
      if (task?.taskLogByTaskId?.errorMessage) {
        return `Error - ${task.taskLogByTaskId.errorMessage}`;
      }
      return 'Error - Task encountered an error during last execution';
      
    case 'loading':
      return 'Loading status information...';
      
    default:
      return 'Unknown status';
  }
};

/**
 * SchedulerStatusIndicator Component
 * 
 * React component that displays visual status indicators for scheduler tasks using Tailwind CSS 
 * badges and icons. Shows active/inactive status with color-coded badges, provides tooltip 
 * information for status details, and includes accessibility features for screen readers.
 */
export const SchedulerStatusIndicator: React.FC<SchedulerStatusIndicatorProps> = ({
  task,
  status: explicitStatus,
  statusMessage,
  loading = false,
  size = 'default',
  className,
  showIcon = true,
  ariaLabel,
}) => {
  // Show skeleton loader if loading
  if (loading) {
    return <StatusSkeleton size={size} />;
  }
  
  const status = getTaskStatus(task, explicitStatus);
  const tooltipMessage = getStatusMessage(status, task, statusMessage);
  
  // Configure badge variant and icon based on status
  const statusConfig = {
    active: {
      variant: 'success' as const,
      icon: CheckIcon,
      label: 'Active'
    },
    inactive: {
      variant: 'outline' as const,
      icon: XMarkIcon,
      label: 'Inactive'
    },
    error: {
      variant: 'destructive' as const,
      icon: XMarkIcon,
      label: 'Error'
    },
    loading: {
      variant: 'secondary' as const,
      icon: null,
      label: 'Loading'
    }
  };
  
  const config = statusConfig[status];
  const IconComponent = config.icon;
  
  // Generate accessible aria-label
  const accessibleLabel = ariaLabel || 
    `Scheduler task status: ${config.label}${task ? ` for ${task.name}` : ''}`;
  
  return (
    <Tooltip content={tooltipMessage}>
      <Badge
        variant={config.variant}
        size={size}
        className={cn(
          'transition-all duration-300 ease-in-out',
          'hover:scale-105 hover:shadow-sm',
          className
        )}
        icon={showIcon && IconComponent ? (
          <IconComponent 
            className="h-3 w-3" 
            aria-hidden="true" 
          />
        ) : undefined}
        aria-label={accessibleLabel}
        role="status"
        aria-live="polite"
      >
        {config.label}
      </Badge>
    </Tooltip>
  );
};

/**
 * Convenience function to create status indicators for common scenarios
 */
export const createSchedulerStatusIndicator = (
  task: SchedulerTaskData,
  options?: Partial<SchedulerStatusIndicatorProps>
) => {
  return (
    <SchedulerStatusIndicator
      task={task}
      {...options}
    />
  );
};

export default SchedulerStatusIndicator;