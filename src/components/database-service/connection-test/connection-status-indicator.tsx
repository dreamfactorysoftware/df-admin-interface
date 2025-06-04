/**
 * Connection Status Indicator Component
 * 
 * React component that displays real-time connection status with visual indicators,
 * progress animations, and status messages. Shows loading spinners during tests,
 * success checkmarks for valid connections, and error states with detailed failure messages.
 * 
 * Features:
 * - Real-time status updates using SWR data synchronization
 * - Tailwind CSS animations for smooth transitions
 * - WCAG 2.1 AA accessibility compliance with proper ARIA labeling
 * - TypeScript 5.8+ with strict type safety
 * - Integration with connection testing workflow
 * 
 * @fileoverview Connection status indicator for database service testing
 * @version 1.0.0
 * @since 2024-01-01
 */

'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { 
  ConnectionTestStatus, 
  ConnectionTestResult,
  ConnectionStatusProps 
} from '../types';

// Icon components - using simple SVG implementations for self-contained component
const CheckCircleIcon = ({ className }: { className?: string }) => (
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
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
    />
  </svg>
);

const XCircleIcon = ({ className }: { className?: string }) => (
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
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" 
    />
  </svg>
);

const LoaderIcon = ({ className }: { className?: string }) => (
  <svg 
    className={cn("animate-spin", className)} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
    />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
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
);

// Badge component implementation
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className 
}) => {
  const baseClasses = "inline-flex items-center font-medium rounded-full border";
  
  const variantClasses = {
    default: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700",
    success: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    error: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
    info: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
  };
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base"
  };
  
  return (
    <span className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}>
      {children}
    </span>
  );
};

/**
 * Connection Status Indicator Component
 * 
 * Displays real-time connection status with visual feedback and accessibility support.
 * Integrates with SWR-powered connection testing for automatic status updates.
 * 
 * @param props - Component props including status, result, and display options
 * @returns React component with connection status visualization
 */
export const ConnectionStatusIndicator: React.FC<ConnectionStatusProps> = ({
  status,
  result,
  showMessage = true,
  size = 'md',
  variant = 'default',
  className,
  'data-testid': testId,
  ...rest
}) => {
  const announcementRef = useRef<HTMLDivElement>(null);
  
  // Memoized status configuration for performance
  const statusConfig = useMemo(() => {
    switch (status) {
      case 'testing':
        return {
          icon: LoaderIcon,
          iconClassName: "text-blue-600 dark:text-blue-400",
          badgeVariant: 'info' as const,
          label: 'Testing connection',
          message: 'Validating database connection...',
          containerClassName: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
          ariaLabel: 'Connection test in progress'
        };
      case 'success':
        return {
          icon: CheckCircleIcon,
          iconClassName: "text-green-600 dark:text-green-400",
          badgeVariant: 'success' as const,
          label: 'Connection successful',
          message: result?.message || 'Database connection established successfully',
          containerClassName: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
          ariaLabel: 'Connection test successful'
        };
      case 'error':
        return {
          icon: XCircleIcon,
          iconClassName: "text-red-600 dark:text-red-400",
          badgeVariant: 'error' as const,
          label: 'Connection failed',
          message: result?.message || 'Failed to connect to database',
          containerClassName: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
          ariaLabel: 'Connection test failed'
        };
      case 'idle':
      default:
        return {
          icon: ClockIcon,
          iconClassName: "text-gray-500 dark:text-gray-400",
          badgeVariant: 'default' as const,
          label: 'Ready to test',
          message: 'Click the test button to validate the connection',
          containerClassName: "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
          ariaLabel: 'Connection not tested'
        };
    }
  }, [status, result]);

  // Size configuration for different component variants
  const sizeConfig = useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          iconSize: "h-4 w-4",
          spacing: "space-x-2",
          padding: "p-2",
          textSize: "text-sm"
        };
      case 'lg':
        return {
          iconSize: "h-6 w-6",
          spacing: "space-x-4",
          padding: "p-4",
          textSize: "text-base"
        };
      case 'md':
      default:
        return {
          iconSize: "h-5 w-5",
          spacing: "space-x-3",
          padding: "p-3",
          textSize: "text-sm"
        };
    }
  }, [size]);

  // Announce status changes to screen readers
  useEffect(() => {
    if (announcementRef.current && status !== 'idle') {
      const announcement = `Connection status: ${statusConfig.label}. ${statusConfig.message}`;
      announcementRef.current.textContent = announcement;
    }
  }, [status, statusConfig]);

  // Render compact variant for smaller display areas
  if (variant === 'compact') {
    const IconComponent = statusConfig.icon;
    
    return (
      <div 
        className={cn("flex items-center", sizeConfig.spacing, className)}
        role="status"
        aria-label={statusConfig.ariaLabel}
        data-testid={testId || 'connection-status-compact'}
        {...rest}
      >
        <IconComponent className={cn(sizeConfig.iconSize, statusConfig.iconClassName)} />
        <Badge 
          variant={statusConfig.badgeVariant} 
          size={size}
          className="transition-all duration-300 ease-in-out"
        >
          {statusConfig.label}
        </Badge>
        
        {/* Screen reader announcement area */}
        <div 
          ref={announcementRef}
          className="sr-only" 
          aria-live="polite" 
          aria-atomic="true"
        />
      </div>
    );
  }

  // Render detailed variant with full information display
  const IconComponent = statusConfig.icon;
  
  return (
    <div 
      className={cn(
        "flex items-start rounded-lg border transition-all duration-300 ease-in-out",
        statusConfig.containerClassName,
        sizeConfig.padding,
        className
      )}
      role="status"
      aria-label={statusConfig.ariaLabel}
      data-testid={testId || 'connection-status-detailed'}
      {...rest}
    >
      <div className="flex-shrink-0">
        <IconComponent 
          className={cn(
            sizeConfig.iconSize, 
            statusConfig.iconClassName,
            // Add pulse animation for loading state
            status === 'testing' && "animate-pulse"
          )} 
        />
      </div>
      
      <div className={cn("flex-1 min-w-0", sizeConfig.spacing.replace('space-x-', 'ml-'))}>
        <div className="flex items-center justify-between">
          <Badge 
            variant={statusConfig.badgeVariant} 
            size={size}
            className="transition-all duration-300 ease-in-out"
          >
            {statusConfig.label}
          </Badge>
          
          {/* Display connection timing for successful tests */}
          {status === 'success' && result?.testDuration && (
            <div className={cn(
              "flex items-center text-gray-600 dark:text-gray-400",
              sizeConfig.textSize
            )}>
              <ClockIcon className="h-3 w-3 mr-1" />
              <span>{Math.round(result.testDuration / 1000)}s</span>
            </div>
          )}
        </div>
        
        {/* Status message */}
        {showMessage && (
          <div className={cn(
            "mt-1 text-gray-700 dark:text-gray-300",
            sizeConfig.textSize
          )}>
            {statusConfig.message}
          </div>
        )}
        
        {/* Additional error details for failed connections */}
        {status === 'error' && result?.details && (
          <details className="mt-2">
            <summary className={cn(
              "cursor-pointer text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300",
              "text-xs font-medium"
            )}>
              View error details
            </summary>
            <div className={cn(
              "mt-1 p-2 bg-red-100 dark:bg-red-900/40 rounded border border-red-200 dark:border-red-800",
              "text-xs text-red-800 dark:text-red-300 font-mono whitespace-pre-wrap"
            )}>
              {result.details}
            </div>
          </details>
        )}
        
        {/* Connection metadata for successful connections */}
        {status === 'success' && result?.metadata && (
          <div className="mt-2 space-y-1">
            {result.metadata.serverVersion && (
              <div className={cn("text-gray-600 dark:text-gray-400", "text-xs")}>
                Server: {result.metadata.serverVersion}
              </div>
            )}
            {result.metadata.tableCount !== undefined && (
              <div className={cn("text-gray-600 dark:text-gray-400", "text-xs")}>
                Tables: {result.metadata.tableCount}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Screen reader announcement area */}
      <div 
        ref={announcementRef}
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      />
    </div>
  );
};

// Export as default for convenient imports
export default ConnectionStatusIndicator;

/**
 * Hook for managing connection status state
 * Provides simplified interface for common status operations
 */
export const useConnectionStatus = (initialStatus: ConnectionTestStatus = 'idle') => {
  const [status, setStatus] = React.useState<ConnectionTestStatus>(initialStatus);
  const [result, setResult] = React.useState<ConnectionTestResult | null>(null);
  
  const updateStatus = React.useCallback((
    newStatus: ConnectionTestStatus, 
    newResult?: ConnectionTestResult | null
  ) => {
    setStatus(newStatus);
    if (newResult !== undefined) {
      setResult(newResult);
    }
  }, []);
  
  const reset = React.useCallback(() => {
    setStatus('idle');
    setResult(null);
  }, []);
  
  return {
    status,
    result,
    updateStatus,
    reset
  };
};

/**
 * Type exports for external usage
 */
export type { 
  ConnectionStatusProps,
  ConnectionTestStatus,
  ConnectionTestResult 
};