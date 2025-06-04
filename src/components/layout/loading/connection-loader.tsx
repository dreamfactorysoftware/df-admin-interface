'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

/**
 * Connection loader component for database connection testing and validation operations.
 * Provides real-time feedback during connection attempts with timeout handling and retry mechanisms.
 * 
 * Integrates with React Query mutations for connection testing with optimistic updates.
 * Supports MySQL, PostgreSQL, MongoDB, SQL Server, Oracle, and Snowflake connections.
 */

const connectionLoaderVariants = cva(
  "flex items-center justify-center p-4 rounded-lg border transition-all duration-200",
  {
    variants: {
      status: {
        idle: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
        connecting: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
        success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
        error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
        retrying: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
      },
      size: {
        sm: "p-2 text-sm",
        md: "p-4 text-base",
        lg: "p-6 text-lg"
      }
    },
    defaultVariants: {
      status: "idle",
      size: "md"
    }
  }
);

const spinnerVariants = cva(
  "animate-spin",
  {
    variants: {
      size: {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-8 h-8"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);

export interface ConnectionTestResult {
  success: boolean;
  message?: string;
  details?: Record<string, unknown>;
  duration?: number;
  timestamp?: number;
}

export interface ConnectionLoaderProps extends VariantProps<typeof connectionLoaderVariants> {
  /** Current connection test state */
  isConnecting?: boolean;
  /** Connection test result */
  result?: ConnectionTestResult | null;
  /** Database type being tested */
  databaseType?: 'mysql' | 'postgresql' | 'mongodb' | 'sqlserver' | 'oracle' | 'snowflake';
  /** Current retry attempt (0-based) */
  retryAttempt?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Show detailed error information */
  showDetails?: boolean;
  /** Custom retry handler */
  onRetry?: () => void;
  /** Custom cancel handler */
  onCancel?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing purposes */
  'data-testid'?: string;
}

/**
 * Get database type display name
 */
const getDatabaseTypeLabel = (type?: string): string => {
  const labels: Record<string, string> = {
    mysql: 'MySQL',
    postgresql: 'PostgreSQL',
    mongodb: 'MongoDB',
    sqlserver: 'SQL Server',
    oracle: 'Oracle',
    snowflake: 'Snowflake'
  };
  return labels[type || ''] || 'Database';
};

/**
 * Get status icon component
 */
const getStatusIcon = (status: string, size: 'sm' | 'md' | 'lg' = 'md') => {
  const iconClass = cn(spinnerVariants({ size }));
  
  switch (status) {
    case 'connecting':
    case 'retrying':
      return <ArrowPathIcon className={iconClass} aria-hidden="true" />;
    case 'success':
      return <CheckCircleIcon className={cn(iconClass, "text-green-600 dark:text-green-400")} aria-hidden="true" />;
    case 'error':
      return <XCircleIcon className={cn(iconClass, "text-red-600 dark:text-red-400")} aria-hidden="true" />;
    default:
      return null;
  }
};

/**
 * Calculate exponential backoff delay
 */
const calculateBackoffDelay = (attempt: number): number => {
  return Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
};

/**
 * Format connection duration
 */
const formatDuration = (ms?: number): string => {
  if (!ms) return '';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

export const ConnectionLoader: React.FC<ConnectionLoaderProps> = ({
  isConnecting = false,
  result = null,
  databaseType,
  retryAttempt = 0,
  maxRetries = 3,
  timeout = 30000,
  showDetails = false,
  onRetry,
  onCancel,
  className,
  size = "md",
  'data-testid': testId,
  ...props
}) => {
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Determine current status
  const getStatus = useCallback((): 'idle' | 'connecting' | 'success' | 'error' | 'retrying' => {
    if (result?.success === true) return 'success';
    if (result?.success === false) return 'error';
    if (isConnecting && retryAttempt > 0) return 'retrying';
    if (isConnecting) return 'connecting';
    return 'idle';
  }, [isConnecting, result, retryAttempt]);

  const status = getStatus();

  // Timer for elapsed time during connection
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isConnecting) {
      const start = Date.now();
      setStartTime(start);
      setElapsedTime(0);

      intervalId = setInterval(() => {
        setElapsedTime(Date.now() - start);
      }, 100);
    } else {
      setStartTime(null);
      setElapsedTime(0);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isConnecting]);

  // Progress calculation based on elapsed time and timeout
  const progressPercentage = startTime 
    ? Math.min((elapsedTime / timeout) * 100, 100)
    : 0;

  // Status message generation
  const getStatusMessage = useCallback((): string => {
    const dbLabel = getDatabaseTypeLabel(databaseType);
    
    switch (status) {
      case 'connecting':
        return `Testing ${dbLabel} connection...`;
      case 'retrying':
        const nextDelay = calculateBackoffDelay(retryAttempt);
        return `Retrying ${dbLabel} connection (${retryAttempt}/${maxRetries}) in ${Math.ceil(nextDelay / 1000)}s...`;
      case 'success':
        const duration = result?.duration ? ` in ${formatDuration(result.duration)}` : '';
        return `${dbLabel} connection successful${duration}`;
      case 'error':
        return result?.message || `${dbLabel} connection failed`;
      default:
        return `Ready to test ${dbLabel} connection`;
    }
  }, [status, databaseType, retryAttempt, maxRetries, result]);

  const statusMessage = getStatusMessage();

  return (
    <div 
      className={cn(connectionLoaderVariants({ status, size }), className)}
      data-testid={testId}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      {...props}
    >
      <div className="flex flex-col items-center space-y-3 w-full">
        {/* Status Icon and Message */}
        <div className="flex items-center space-x-3">
          {getStatusIcon(status, size)}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {statusMessage}
          </span>
        </div>

        {/* Progress Bar for Active Connections */}
        {(status === 'connecting' || status === 'retrying') && (
          <div className="w-full space-y-2">
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-200 ease-out",
                  status === 'connecting' 
                    ? "bg-blue-500 dark:bg-blue-400" 
                    : "bg-amber-500 dark:bg-amber-400"
                )}
                style={{ width: `${progressPercentage}%` }}
                role="progressbar"
                aria-valuenow={progressPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Connection progress"
              />
            </div>
            
            {/* Timer and Timeout Info */}
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>{formatDuration(elapsedTime)}</span>
              <span>Timeout: {formatDuration(timeout)}</span>
            </div>
          </div>
        )}

        {/* Error Details */}
        {status === 'error' && showDetails && result?.details && (
          <div className="w-full mt-2 p-3 bg-red-100 dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-800">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              Connection Details
            </h4>
            <pre className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap overflow-auto max-h-32">
              {JSON.stringify(result.details, null, 2)}
            </pre>
          </div>
        )}

        {/* Action Buttons */}
        {(status === 'error' || (status === 'retrying' && retryAttempt >= maxRetries)) && (
          <div className="flex space-x-2 mt-3">
            {onRetry && retryAttempt < maxRetries && (
              <button
                onClick={onRetry}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  "bg-blue-600 hover:bg-blue-700 text-white",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  "dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-slate-800"
                )}
                data-testid="retry-button"
              >
                Retry Connection
              </button>
            )}
            
            {onCancel && isConnecting && (
              <button
                onClick={onCancel}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  "bg-slate-200 hover:bg-slate-300 text-slate-700",
                  "focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2",
                  "dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-200 dark:focus:ring-offset-slate-800"
                )}
                data-testid="cancel-button"
              >
                Cancel
              </button>
            )}
          </div>
        )}

        {/* Success Details */}
        {status === 'success' && result?.details && showDetails && (
          <div className="w-full mt-2 p-3 bg-green-100 dark:bg-green-900/30 rounded-md border border-green-200 dark:border-green-800">
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              Connection Information
            </h4>
            <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
              {Object.entries(result.details).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium">{key}:</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accessibility Information */}
        <div className="sr-only">
          {status === 'connecting' && `Connection test in progress. ${Math.round(progressPercentage)}% complete.`}
          {status === 'retrying' && `Retrying connection. Attempt ${retryAttempt} of ${maxRetries}.`}
          {status === 'success' && 'Connection test completed successfully.'}
          {status === 'error' && `Connection test failed: ${result?.message || 'Unknown error'}`}
        </div>
      </div>
    </div>
  );
};

export default ConnectionLoader;