'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { AlertTriangle, CheckCircle, Clock, Database, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProgressIndicator, type ProgressStep } from './progress-indicator';
import type { 
  DatabaseConfig, 
  DatabaseType, 
  ConnectionTestRequest, 
  ConnectionTestResult,
  DATABASE_TYPE_METADATA 
} from '@/types/database';

/**
 * Connection test status for different phases of the connection process
 */
export type ConnectionTestStatus = 
  | 'idle' 
  | 'connecting' 
  | 'authenticating' 
  | 'testing-schema' 
  | 'testing-permissions' 
  | 'success' 
  | 'failed' 
  | 'timeout';

/**
 * Connection test step definition for progress tracking
 */
export interface ConnectionTestStep extends ProgressStep {
  /** Connection test phase */
  phase: ConnectionTestStatus;
  /** Database-specific step details */
  dbType?: DatabaseType;
  /** Timeout for this step */
  timeout?: number;
}

/**
 * Connection loader state for tracking test progress
 */
export interface ConnectionLoaderState {
  /** Current test status */
  status: ConnectionTestStatus;
  /** Test progress percentage (0-100) */
  progress: number;
  /** Current step being executed */
  currentStep: number;
  /** Test execution start time */
  startTime?: Date;
  /** Total elapsed time in milliseconds */
  elapsedTime: number;
  /** Number of retry attempts */
  retryCount: number;
  /** Maximum retry attempts allowed */
  maxRetries: number;
  /** Exponential backoff delay in milliseconds */
  retryDelay: number;
  /** Test timeout in milliseconds */
  timeout: number;
  /** Test result data */
  result?: ConnectionTestResult;
  /** Error information */
  error?: {
    code: string;
    message: string;
    details?: any;
    phase?: ConnectionTestStatus;
  };
}

/**
 * Props for the ConnectionLoader component
 */
export interface ConnectionLoaderProps {
  /** Database configuration to test */
  config: Partial<DatabaseConfig>;
  /** Whether connection test is currently running */
  isLoading?: boolean;
  /** Connection test result */
  result?: ConnectionTestResult;
  /** Connection test error */
  error?: Error | null;
  /** Callback to initiate connection test */
  onTestConnection?: (config: Partial<DatabaseConfig>) => void;
  /** Callback to retry failed connection */
  onRetry?: () => void;
  /** Callback to cancel ongoing test */
  onCancel?: () => void;
  /** Callback when test completes */
  onComplete?: (result: ConnectionTestResult) => void;
  /** Callback when test fails */
  onError?: (error: Error) => void;
  /** Test timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Show detailed progress steps */
  showSteps?: boolean;
  /** Show estimated time remaining */
  showTimeRemaining?: boolean;
  /** Compact display mode */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom aria label */
  ariaLabel?: string;
}

/**
 * Default timeout values for different connection phases (in milliseconds)
 */
const DEFAULT_PHASE_TIMEOUTS: Record<ConnectionTestStatus, number> = {
  idle: 0,
  connecting: 10000, // 10 seconds for initial connection
  authenticating: 5000, // 5 seconds for authentication
  'testing-schema': 8000, // 8 seconds for schema access test
  'testing-permissions': 7000, // 7 seconds for permission test
  success: 0,
  failed: 0,
  timeout: 0,
};

/**
 * Database type icons mapping
 */
const DB_TYPE_ICONS: Record<DatabaseType, any> = {
  mysql: Database,
  postgresql: Database,
  oracle: Database,
  mongodb: Database,
  snowflake: Database,
};

/**
 * ConnectionLoader Component
 * 
 * Specialized loading component for database connection testing and validation operations.
 * Provides real-time feedback during connection attempts with timeout handling and retry
 * mechanisms. Integrates with React Query mutations for optimistic updates and proper
 * error handling.
 * 
 * Features:
 * - Real-time connection status feedback for MySQL, PostgreSQL, MongoDB, and SQL Server
 * - Retry mechanisms with exponential backoff for failed connection attempts
 * - Connection progress tracking for different database types and authentication methods
 * - Integration with database service creation workflows and validation flows
 * - Visual feedback for connection success, failure, and retry states
 * - < 30 seconds response time per technical specification
 * - Detailed diagnostic information for connection failures
 * - WCAG 2.1 AA accessibility compliance
 */
export function ConnectionLoader({
  config,
  isLoading = false,
  result,
  error,
  onTestConnection,
  onRetry,
  onCancel,
  onComplete,
  onError,
  timeout = 30000, // 30 seconds maximum per technical specification
  maxRetries = 3,
  showSteps = true,
  showTimeRemaining = true,
  compact = false,
  className,
  ariaLabel,
  ...props
}: ConnectionLoaderProps) {
  // Internal state for connection test progress tracking
  const [loaderState, setLoaderState] = useState<ConnectionLoaderState>({
    status: 'idle',
    progress: 0,
    currentStep: 0,
    elapsedTime: 0,
    retryCount: 0,
    maxRetries,
    retryDelay: 1000, // Start with 1 second delay
    timeout,
  });

  // Timer references for progress tracking and timeout handling
  const [progressTimer, setProgressTimer] = useState<NodeJS.Timeout | null>(null);
  const [timeoutTimer, setTimeoutTimer] = useState<NodeJS.Timeout | null>(null);

  // Database type for specialized handling
  const dbType = config?.type;
  const dbMetadata = dbType ? DATABASE_TYPE_METADATA[dbType] : null;
  const DbIcon = dbType ? DB_TYPE_ICONS[dbType] : Database;

  // Generate connection test steps based on database type and configuration
  const connectionSteps = useMemo((): ConnectionTestStep[] => {
    const baseSteps: ConnectionTestStep[] = [
      {
        id: 'connecting',
        label: 'Establishing Connection',
        description: `Connecting to ${dbMetadata?.label || 'database'} server at ${config.host}:${config.port}`,
        status: 'pending',
        phase: 'connecting',
        dbType,
        timeout: DEFAULT_PHASE_TIMEOUTS.connecting,
        estimatedDuration: DEFAULT_PHASE_TIMEOUTS.connecting,
      },
      {
        id: 'authenticating',
        label: 'Authenticating',
        description: `Verifying credentials for user "${config.username}"`,
        status: 'pending',
        phase: 'authenticating',
        dbType,
        timeout: DEFAULT_PHASE_TIMEOUTS.authenticating,
        estimatedDuration: DEFAULT_PHASE_TIMEOUTS.authenticating,
      },
    ];

    // Add schema testing step if database name is provided
    if (config.database || config.defaultDatabase) {
      baseSteps.push({
        id: 'testing-schema',
        label: 'Testing Schema Access',
        description: `Accessing database "${config.database || config.defaultDatabase}"`,
        status: 'pending',
        phase: 'testing-schema',
        dbType,
        timeout: DEFAULT_PHASE_TIMEOUTS['testing-schema'],
        estimatedDuration: DEFAULT_PHASE_TIMEOUTS['testing-schema'],
      });
    }

    // Add permissions test step
    baseSteps.push({
      id: 'testing-permissions',
      label: 'Verifying Permissions',
      description: 'Testing read/write permissions and capabilities',
      status: 'pending',
      phase: 'testing-permissions',
      dbType,
      timeout: DEFAULT_PHASE_TIMEOUTS['testing-permissions'],
      estimatedDuration: DEFAULT_PHASE_TIMEOUTS['testing-permissions'],
    });

    return baseSteps;
  }, [config, dbType, dbMetadata]);

  // Update progress based on current step and elapsed time
  const updateProgress = useCallback(() => {
    if (!isLoading || loaderState.status === 'idle') return;

    const now = Date.now();
    const elapsed = loaderState.startTime ? now - loaderState.startTime.getTime() : 0;
    const currentStep = connectionSteps[loaderState.currentStep];
    
    if (!currentStep) return;

    // Calculate progress within current step
    const stepProgress = Math.min(
      (elapsed % (currentStep.estimatedDuration || 5000)) / (currentStep.estimatedDuration || 5000) * 100,
      95 // Cap at 95% until step completes
    );

    // Calculate overall progress
    const completedStepsProgress = (loaderState.currentStep / connectionSteps.length) * 100;
    const currentStepProgress = (stepProgress / connectionSteps.length);
    const totalProgress = Math.min(completedStepsProgress + currentStepProgress, 95);

    setLoaderState(prev => ({
      ...prev,
      elapsedTime: elapsed,
      progress: totalProgress,
    }));
  }, [isLoading, loaderState.status, loaderState.startTime, loaderState.currentStep, connectionSteps]);

  // Start progress tracking timer
  useEffect(() => {
    if (isLoading && loaderState.status !== 'idle') {
      const timer = setInterval(updateProgress, 100); // Update every 100ms
      setProgressTimer(timer);
      return () => {
        clearInterval(timer);
        setProgressTimer(null);
      };
    } else if (progressTimer) {
      clearInterval(progressTimer);
      setProgressTimer(null);
    }
  }, [isLoading, loaderState.status, updateProgress, progressTimer]);

  // Handle timeout detection
  useEffect(() => {
    if (isLoading && loaderState.startTime) {
      const timer = setTimeout(() => {
        if (isLoading) {
          setLoaderState(prev => ({
            ...prev,
            status: 'timeout',
            progress: 100,
            error: {
              code: 'CONNECTION_TIMEOUT',
              message: `Connection test timed out after ${timeout / 1000} seconds`,
              phase: prev.status,
            },
          }));
          
          onError?.(new Error('Connection test timed out'));
        }
      }, timeout);
      
      setTimeoutTimer(timer);
      return () => {
        clearTimeout(timer);
        setTimeoutTimer(null);
      };
    }
  }, [isLoading, loaderState.startTime, timeout, onError]);

  // Handle loading state changes
  useEffect(() => {
    if (isLoading && loaderState.status === 'idle') {
      // Start connection test
      setLoaderState(prev => ({
        ...prev,
        status: 'connecting',
        progress: 0,
        currentStep: 0,
        startTime: new Date(),
        elapsedTime: 0,
        error: undefined,
        result: undefined,
      }));
    } else if (!isLoading && loaderState.status !== 'idle') {
      // Test completed or stopped
      if (result?.success) {
        setLoaderState(prev => ({
          ...prev,
          status: 'success',
          progress: 100,
          result,
        }));
        onComplete?.(result);
      } else if (error) {
        setLoaderState(prev => ({
          ...prev,
          status: 'failed',
          progress: 100,
          error: {
            code: 'CONNECTION_FAILED',
            message: error.message || 'Connection test failed',
            details: error,
          },
        }));
      }
    }
  }, [isLoading, result, error, loaderState.status, onComplete]);

  // Handle retry with exponential backoff
  const handleRetry = useCallback(() => {
    if (loaderState.retryCount >= maxRetries) {
      return;
    }

    const newRetryDelay = Math.min(loaderState.retryDelay * 2, 10000); // Cap at 10 seconds
    
    setLoaderState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      retryDelay: newRetryDelay,
      status: 'idle',
      progress: 0,
      currentStep: 0,
      error: undefined,
    }));

    // Delay retry based on exponential backoff
    setTimeout(() => {
      onRetry?.();
    }, loaderState.retryDelay);
  }, [loaderState.retryCount, loaderState.retryDelay, maxRetries, onRetry]);

  // Update step status based on current progress
  const stepsWithStatus = useMemo(() => {
    return connectionSteps.map((step, index) => {
      let status = step.status;
      
      if (index < loaderState.currentStep) {
        status = 'completed';
      } else if (index === loaderState.currentStep) {
        if (loaderState.status === 'failed' || loaderState.status === 'timeout') {
          status = 'error';
        } else if (isLoading) {
          status = 'running';
        }
      }

      return {
        ...step,
        status,
        progress: index === loaderState.currentStep ? 
          Math.min((loaderState.progress % (100 / connectionSteps.length)) * connectionSteps.length, 100) : 
          undefined,
        startTime: index <= loaderState.currentStep ? loaderState.startTime : undefined,
        errorMessage: status === 'error' ? loaderState.error?.message : undefined,
      };
    });
  }, [connectionSteps, loaderState, isLoading]);

  // Calculate estimated time remaining
  const estimatedTimeRemaining = useMemo(() => {
    if (!isLoading || !loaderState.startTime) return null;
    
    const totalEstimatedDuration = connectionSteps.reduce(
      (total, step) => total + (step.estimatedDuration || 5000), 0
    );
    const progressRatio = loaderState.progress / 100;
    const elapsedTime = loaderState.elapsedTime;
    const estimatedTotal = progressRatio > 0 ? elapsedTime / progressRatio : totalEstimatedDuration;
    const remaining = Math.max(0, estimatedTotal - elapsedTime);
    
    return Math.ceil(remaining / 1000); // Convert to seconds
  }, [isLoading, loaderState, connectionSteps]);

  // Get status message
  const getStatusMessage = useCallback(() => {
    switch (loaderState.status) {
      case 'idle':
        return 'Ready to test connection';
      case 'connecting':
        return `Connecting to ${dbMetadata?.label || 'database'}...`;
      case 'authenticating':
        return 'Authenticating user credentials...';
      case 'testing-schema':
        return 'Testing database access...';
      case 'testing-permissions':
        return 'Verifying permissions...';
      case 'success':
        return `Connection successful! Server version: ${result?.serverVersion || 'Unknown'}`;
      case 'failed':
        return loaderState.error?.message || 'Connection test failed';
      case 'timeout':
        return `Connection test timed out after ${timeout / 1000} seconds`;
      default:
        return 'Testing connection...';
    }
  }, [loaderState.status, loaderState.error, dbMetadata, result, timeout]);

  // Get status icon
  const getStatusIcon = useCallback(() => {
    const iconProps = { 
      className: 'w-5 h-5',
      'aria-hidden': true 
    };

    switch (loaderState.status) {
      case 'idle':
        return <Clock {...iconProps} className={cn(iconProps.className, 'text-gray-400')} />;
      case 'connecting':
      case 'authenticating':
      case 'testing-schema':
      case 'testing-permissions':
        return <Loader2 {...iconProps} className={cn(iconProps.className, 'text-primary-500 animate-spin')} />;
      case 'success':
        return <CheckCircle {...iconProps} className={cn(iconProps.className, 'text-success-500')} />;
      case 'failed':
      case 'timeout':
        return <XCircle {...iconProps} className={cn(iconProps.className, 'text-error-500')} />;
      default:
        return <DbIcon {...iconProps} className={cn(iconProps.className, 'text-gray-400')} />;
    }
  }, [loaderState.status, DbIcon]);

  // Determine if we can retry
  const canRetry = loaderState.status === 'failed' && loaderState.retryCount < maxRetries;

  // Container styles
  const containerStyles = cn(
    'w-full space-y-4 p-4',
    'border border-gray-200 dark:border-gray-700 rounded-lg',
    'bg-white dark:bg-gray-800',
    loaderState.status === 'success' && 'border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/20',
    (loaderState.status === 'failed' || loaderState.status === 'timeout') && 'border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20',
    compact && 'p-3',
    className
  );

  // Main status display styles
  const statusStyles = cn(
    'flex items-center space-x-3',
    compact && 'space-x-2'
  );

  return (
    <div 
      className={containerStyles}
      role="status"
      aria-label={ariaLabel || `Connection test for ${dbMetadata?.label || 'database'}`}
      aria-live="polite"
      aria-atomic="true"
      {...props}
    >
      {/* Main status display */}
      <div className={statusStyles}>
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className={cn(
              'font-medium text-gray-900 dark:text-gray-100',
              compact ? 'text-sm' : 'text-base'
            )}>
              {dbMetadata?.label || 'Database'} Connection Test
            </h3>
            
            {loaderState.retryCount > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Attempt {loaderState.retryCount + 1} of {maxRetries + 1}
              </span>
            )}
          </div>
          
          <p className={cn(
            'text-gray-600 dark:text-gray-400',
            compact ? 'text-xs' : 'text-sm'
          )}>
            {getStatusMessage()}
          </p>
          
          {config.host && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {config.host}:{config.port} • {config.database || config.defaultDatabase || 'default'}
            </p>
          )}
        </div>
        
        {loaderState.elapsedTime > 0 && (
          <div className="text-right">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {(loaderState.elapsedTime / 1000).toFixed(1)}s
            </span>
            {estimatedTimeRemaining && showTimeRemaining && (
              <div className="text-xs text-gray-400 dark:text-gray-500">
                ~{estimatedTimeRemaining}s remaining
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress indicator */}
      {showSteps && !compact && (
        <ProgressIndicator
          steps={stepsWithStatus}
          progress={loaderState.progress}
          mode="determinate"
          variant="detailed"
          showLabels={true}
          showPercentage={true}
          showTimeRemaining={showTimeRemaining}
          isLoading={isLoading}
          hasError={loaderState.status === 'failed' || loaderState.status === 'timeout'}
          errorMessage={loaderState.error?.message}
          isComplete={loaderState.status === 'success'}
          completionMessage={result?.message}
          onRetry={canRetry ? handleRetry : undefined}
          onCancel={isLoading ? onCancel : undefined}
          ariaLabel="Connection test progress"
          announceUpdates={true}
        />
      )}

      {/* Compact progress bar */}
      {(!showSteps || compact) && isLoading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Progress
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {Math.round(loaderState.progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                isLoading && 'bg-primary-500',
                loaderState.status === 'success' && 'bg-success-500',
                (loaderState.status === 'failed' || loaderState.status === 'timeout') && 'bg-error-500'
              )}
              style={{ width: `${loaderState.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Connection result details */}
      {result?.success && result.capabilities && (
        <div className="mt-4 p-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-md">
          <h4 className="text-sm font-medium text-success-800 dark:text-success-200 mb-2">
            Connection Details
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-success-600 dark:text-success-400">Server Version:</span>
              <span className="ml-1 text-success-800 dark:text-success-200">
                {result.serverVersion || 'Unknown'}
              </span>
            </div>
            <div>
              <span className="text-success-600 dark:text-success-400">Response Time:</span>
              <span className="ml-1 text-success-800 dark:text-success-200">
                {result.duration}ms
              </span>
            </div>
            {result.availableSchemas && result.availableSchemas.length > 0 && (
              <div className="col-span-2">
                <span className="text-success-600 dark:text-success-400">Available Schemas:</span>
                <span className="ml-1 text-success-800 dark:text-success-200">
                  {result.availableSchemas.slice(0, 3).join(', ')}
                  {result.availableSchemas.length > 3 && ` (+${result.availableSchemas.length - 3} more)`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error details */}
      {loaderState.error && (
        <div className="mt-4 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-md">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-error-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-error-800 dark:text-error-200">
                Connection Failed
              </h4>
              <p className="text-sm text-error-700 dark:text-error-300 mt-1">
                {loaderState.error.message}
              </p>
              {loaderState.error.code && (
                <p className="text-xs text-error-600 dark:text-error-400 mt-1">
                  Error Code: {loaderState.error.code}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {(canRetry || onCancel || onTestConnection) && (
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          {onCancel && isLoading && (
            <button
              type="button"
              onClick={onCancel}
              className={cn(
                'px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300',
                'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
                'rounded-md hover:bg-gray-50 dark:hover:bg-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'transition-colors duration-200'
              )}
              aria-label="Cancel connection test"
            >
              Cancel
            </button>
          )}
          
          {canRetry && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={isLoading}
              className={cn(
                'flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-white',
                'bg-primary-600 hover:bg-primary-700 active:bg-primary-800',
                'border border-primary-600 hover:border-primary-700',
                'rounded-md transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              aria-label={`Retry connection test (${loaderState.retryCount}/${maxRetries} attempts used)`}
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Retry ({loaderState.retryCount}/{maxRetries})</span>
            </button>
          )}
          
          {onTestConnection && !isLoading && loaderState.status === 'idle' && (
            <button
              type="button"
              onClick={() => onTestConnection(config)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium text-white',
                'bg-primary-600 hover:bg-primary-700 active:bg-primary-800',
                'border border-primary-600 hover:border-primary-700',
                'rounded-md transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
              )}
              aria-label="Start connection test"
            >
              Test Connection
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ConnectionLoader;