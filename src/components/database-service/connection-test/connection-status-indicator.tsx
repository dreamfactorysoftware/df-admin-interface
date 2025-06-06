/**
 * Connection Status Indicator Component
 * 
 * React component that displays real-time connection status with visual indicators, 
 * progress animations, and status messages. Shows loading spinners during tests, 
 * success checkmarks for valid connections, and error states with detailed failure 
 * messages. Implements WCAG 2.1 AA accessibility compliance with proper ARIA labeling.
 * 
 * @fileoverview Real-time connection status display component with SWR integration
 * @version 1.0.0
 * @since 2024-01-01
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { 
  UseConnectionTestReturn, 
  ConnectionTestResult, 
  ConnectionTestStatus,
  DatabaseConnectionFormData
} from '../types';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Props interface for the ConnectionStatusIndicator component
 */
export interface ConnectionStatusIndicatorProps {
  /** Connection test hook instance providing status and control functions */
  connectionTest: UseConnectionTestReturn;
  
  /** Database configuration for testing (optional for existing services) */
  config?: DatabaseConnectionFormData;
  
  /** Show detailed status messages */
  showDetails?: boolean;
  
  /** Show test duration when available */
  showDuration?: boolean;
  
  /** Show retry count for failed connections */
  showRetryCount?: boolean;
  
  /** Show last test timestamp */
  showTimestamp?: boolean;
  
  /** Enable auto-retry on failure */
  enableAutoRetry?: boolean;
  
  /** Auto-retry delay in milliseconds */
  autoRetryDelay?: number;
  
  /** Maximum auto-retry attempts */
  maxAutoRetries?: number;
  
  /** Custom success message override */
  successMessage?: string;
  
  /** Custom error message override */
  errorMessage?: string;
  
  /** Custom loading message override */
  loadingMessage?: string;
  
  /** Callback when status changes */
  onStatusChange?: (status: ConnectionTestStatus) => void;
  
  /** Callback when connection test succeeds */
  onSuccess?: (result: ConnectionTestResult) => void;
  
  /** Callback when connection test fails */
  onError?: (result: ConnectionTestResult) => void;
  
  /** Component size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Hide status badge */
  hideBadge?: boolean;
  
  /** Hide status message */
  hideMessage?: boolean;
  
  /** Compact display mode */
  compact?: boolean;
  
  /** CSS class name */
  className?: string;
  
  /** Test identifier for automated testing */
  'data-testid'?: string;
}

/**
 * Status configuration for different connection states
 */
interface StatusConfig {
  badge: {
    variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info';
    text: string;
    icon: string;
  };
  message: {
    text: string;
    className: string;
  };
  indicator: {
    icon: string;
    className: string;
    animation?: string;
  };
  ariaLabel: string;
  ariaDescription: string;
}

// =============================================================================
// CONFIGURATION AND CONSTANTS
// =============================================================================

/**
 * Status configuration mapping for different connection test states
 */
const STATUS_CONFIG: Record<ConnectionTestStatus, StatusConfig> = {
  idle: {
    badge: {
      variant: 'secondary',
      text: 'Not Tested',
      icon: '⚪',
    },
    message: {
      text: 'Connection not tested yet',
      className: 'text-gray-600 dark:text-gray-400',
    },
    indicator: {
      icon: '⚪',
      className: 'text-gray-400',
    },
    ariaLabel: 'Connection status: Not tested',
    ariaDescription: 'Database connection has not been tested yet. Click test connection to verify connectivity.',
  },
  
  testing: {
    badge: {
      variant: 'info',
      text: 'Testing...',
      icon: '🔄',
    },
    message: {
      text: 'Testing database connection...',
      className: 'text-blue-600 dark:text-blue-400',
    },
    indicator: {
      icon: '🔄',
      className: 'text-blue-500',
      animation: 'animate-spin',
    },
    ariaLabel: 'Connection status: Testing in progress',
    ariaDescription: 'Database connection test is currently running. Please wait for results.',
  },
  
  success: {
    badge: {
      variant: 'success',
      text: 'Connected',
      icon: '✅',
    },
    message: {
      text: 'Connection successful',
      className: 'text-green-600 dark:text-green-400',
    },
    indicator: {
      icon: '✅',
      className: 'text-green-500',
    },
    ariaLabel: 'Connection status: Successfully connected',
    ariaDescription: 'Database connection test passed. The service is ready for API generation.',
  },
  
  error: {
    badge: {
      variant: 'destructive',
      text: 'Failed',
      icon: '❌',
    },
    message: {
      text: 'Connection failed',
      className: 'text-red-600 dark:text-red-400',
    },
    indicator: {
      icon: '❌',
      className: 'text-red-500',
    },
    ariaLabel: 'Connection status: Connection failed',
    ariaDescription: 'Database connection test failed. Please check your configuration and try again.',
  },
};

/**
 * Size configuration for different component variants
 */
const SIZE_CONFIG = {
  sm: {
    container: 'p-2',
    badge: 'text-xs',
    message: 'text-xs',
    indicator: 'text-sm',
    spacing: 'space-y-1',
  },
  md: {
    container: 'p-3',
    badge: 'text-sm',
    message: 'text-sm',
    indicator: 'text-base',
    spacing: 'space-y-2',
  },
  lg: {
    container: 'p-4',
    badge: 'text-base',
    message: 'text-base',
    indicator: 'text-lg',
    spacing: 'space-y-3',
  },
};

/**
 * Default messages for different scenarios
 */
const DEFAULT_MESSAGES = {
  success: 'Database connection established successfully',
  error: 'Unable to connect to database',
  testing: 'Testing database connectivity',
  idle: 'Ready to test connection',
  timeout: 'Connection test timed out',
  networkError: 'Network error during connection test',
  authenticationError: 'Authentication failed',
  databaseNotFound: 'Database not found',
  hostNotFound: 'Database host not reachable',
  portClosed: 'Database port is not accessible',
  unknownError: 'An unknown error occurred',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Formats test duration for display
 */
const formatDuration = (durationMs: number | null): string => {
  if (!durationMs) return '';
  
  if (durationMs < 1000) {
    return `${Math.round(durationMs)}ms`;
  } else if (durationMs < 60000) {
    return `${Math.round(durationMs / 1000 * 10) / 10}s`;
  } else {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.round((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
};

/**
 * Formats timestamp for display
 */
const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '';
  }
};

/**
 * Extracts detailed error message from connection test result
 */
const getDetailedErrorMessage = (result: ConnectionTestResult | null, error: any): string => {
  if (result?.details) {
    return result.details;
  }
  
  if (result?.message) {
    return result.message;
  }
  
  if (error?.error?.message) {
    return error.error.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return DEFAULT_MESSAGES.unknownError;
};

/**
 * Gets appropriate error message based on error type
 */
const getErrorMessageByType = (result: ConnectionTestResult | null): string => {
  if (!result) return DEFAULT_MESSAGES.error;
  
  const message = result.message?.toLowerCase() || '';
  const errorCode = result.errorCode?.toLowerCase() || '';
  
  if (message.includes('timeout') || errorCode.includes('timeout')) {
    return DEFAULT_MESSAGES.timeout;
  }
  
  if (message.includes('network') || message.includes('econnrefused')) {
    return DEFAULT_MESSAGES.networkError;
  }
  
  if (message.includes('authentication') || message.includes('auth')) {
    return DEFAULT_MESSAGES.authenticationError;
  }
  
  if (message.includes('database') && message.includes('not found')) {
    return DEFAULT_MESSAGES.databaseNotFound;
  }
  
  if (message.includes('host') && message.includes('not found')) {
    return DEFAULT_MESSAGES.hostNotFound;
  }
  
  if (message.includes('port') || message.includes('connection refused')) {
    return DEFAULT_MESSAGES.portClosed;
  }
  
  return result.message || DEFAULT_MESSAGES.error;
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * ConnectionStatusIndicator Component
 * 
 * Displays real-time connection status with visual indicators, progress animations,
 * and status messages. Provides comprehensive accessibility support and integrates
 * with the connection testing workflow for automatic status updates.
 */
export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  connectionTest,
  config,
  showDetails = true,
  showDuration = true,
  showRetryCount = true,
  showTimestamp = false,
  enableAutoRetry = false,
  autoRetryDelay = 3000,
  maxAutoRetries = 3,
  successMessage,
  errorMessage,
  loadingMessage,
  onStatusChange,
  onSuccess,
  onError,
  size = 'md',
  hideBadge = false,
  hideMessage = false,
  compact = false,
  className,
  'data-testid': dataTestId = 'connection-status-indicator',
  ...props
}) => {
  // Refs for managing auto-retry logic
  const autoRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoRetryCountRef = useRef(0);
  
  // Extract status and data from connection test hook
  const { 
    status, 
    result, 
    isLoading, 
    error, 
    testDuration, 
    retryCount,
    retry 
  } = connectionTest;
  
  // Get configuration for current status
  const statusConfig = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];
  
  // Determine display messages
  const displayMessage = React.useMemo(() => {
    switch (status) {
      case 'testing':
        return loadingMessage || statusConfig.message.text;
      case 'success':
        return successMessage || result?.message || statusConfig.message.text;
      case 'error':
        return errorMessage || getErrorMessageByType(result) || statusConfig.message.text;
      default:
        return statusConfig.message.text;
    }
  }, [status, result, successMessage, errorMessage, loadingMessage, statusConfig.message.text]);
  
  // Handle status change notifications
  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);
  
  // Handle success/error callbacks
  useEffect(() => {
    if (status === 'success' && result) {
      onSuccess?.(result);
      autoRetryCountRef.current = 0; // Reset auto-retry count on success
    } else if (status === 'error' && result) {
      onError?.(result);
    }
  }, [status, result, onSuccess, onError]);
  
  // Auto-retry logic
  useEffect(() => {
    if (
      enableAutoRetry &&
      status === 'error' &&
      autoRetryCountRef.current < maxAutoRetries
    ) {
      autoRetryTimeoutRef.current = setTimeout(() => {
        autoRetryCountRef.current++;
        retry();
      }, autoRetryDelay);
    }
    
    return () => {
      if (autoRetryTimeoutRef.current) {
        clearTimeout(autoRetryTimeoutRef.current);
        autoRetryTimeoutRef.current = null;
      }
    };
  }, [status, enableAutoRetry, maxAutoRetries, autoRetryDelay, retry]);
  
  // Clean up auto-retry timeout on unmount
  useEffect(() => {
    return () => {
      if (autoRetryTimeoutRef.current) {
        clearTimeout(autoRetryTimeoutRef.current);
      }
    };
  }, []);
  
  // Format additional details
  const durationText = showDuration && testDuration ? formatDuration(testDuration) : '';
  const timestampText = showTimestamp && result?.timestamp ? formatTimestamp(result.timestamp) : '';
  const retryText = showRetryCount && retryCount > 0 ? `Retry ${retryCount}` : '';
  
  // Combine additional info
  const additionalInfo = [durationText, timestampText, retryText].filter(Boolean).join(' • ');
  
  // Get detailed error message for display
  const detailedErrorMessage = status === 'error' && showDetails 
    ? getDetailedErrorMessage(result, error) 
    : '';
  
  // Construct ARIA live region content
  const ariaLiveContent = React.useMemo(() => {
    let content = statusConfig.ariaLabel;
    
    if (status === 'success' && result?.message) {
      content += `. ${result.message}`;
    } else if (status === 'error') {
      content += `. ${displayMessage}`;
      if (detailedErrorMessage && detailedErrorMessage !== displayMessage) {
        content += `. Details: ${detailedErrorMessage}`;
      }
    }
    
    if (additionalInfo) {
      content += `. ${additionalInfo}`;
    }
    
    return content;
  }, [status, result, displayMessage, detailedErrorMessage, additionalInfo, statusConfig.ariaLabel]);
  
  // Component layout classes
  const containerClasses = cn(
    'transition-all duration-300 ease-in-out',
    sizeConfig.container,
    !compact && sizeConfig.spacing,
    className
  );
  
  const indicatorClasses = cn(
    'inline-flex items-center justify-center',
    sizeConfig.indicator,
    statusConfig.indicator.className,
    statusConfig.indicator.animation
  );
  
  const messageClasses = cn(
    'font-medium transition-colors duration-200',
    sizeConfig.message,
    statusConfig.message.className
  );
  
  return (
    <div
      className={containerClasses}
      role="status"
      aria-label={statusConfig.ariaLabel}
      aria-describedby={`${dataTestId}-description`}
      data-testid={dataTestId}
      {...props}
    >
      {/* Main status display */}
      <div className={cn(
        'flex items-center',
        compact ? 'space-x-2' : 'space-x-3'
      )}>
        {/* Status indicator icon */}
        <div
          className={indicatorClasses}
          role="img"
          aria-label={`Connection status icon: ${statusConfig.badge.text}`}
        >
          <span className="select-none">
            {statusConfig.indicator.icon}
          </span>
        </div>
        
        {/* Status badge */}
        {!hideBadge && (
          <Badge
            variant={statusConfig.badge.variant}
            size={size === 'sm' ? 'sm' : 'default'}
            className={cn(
              'transition-all duration-200',
              sizeConfig.badge
            )}
            data-testid={`${dataTestId}-badge`}
          >
            <span className="mr-1" aria-hidden="true">
              {statusConfig.badge.icon}
            </span>
            {statusConfig.badge.text}
          </Badge>
        )}
        
        {/* Status message */}
        {!hideMessage && !compact && (
          <div className="flex-1 min-w-0">
            <div
              className={messageClasses}
              data-testid={`${dataTestId}-message`}
            >
              {displayMessage}
            </div>
            
            {/* Additional info */}
            {additionalInfo && (
              <div
                className={cn(
                  'text-xs text-gray-500 dark:text-gray-400 mt-1',
                  sizeConfig === SIZE_CONFIG.sm && 'text-[10px]'
                )}
                data-testid={`${dataTestId}-additional-info`}
              >
                {additionalInfo}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Detailed error message */}
      {status === 'error' && showDetails && detailedErrorMessage && 
       detailedErrorMessage !== displayMessage && !compact && (
        <div
          className={cn(
            'mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400',
            sizeConfig === SIZE_CONFIG.sm && 'text-[10px] p-1.5 mt-1'
          )}
          data-testid={`${dataTestId}-error-details`}
        >
          <div className="font-medium mb-1">Error Details:</div>
          <div className="break-words">
            {detailedErrorMessage}
          </div>
        </div>
      )}
      
      {/* Auto-retry indicator */}
      {enableAutoRetry && status === 'error' && autoRetryCountRef.current < maxAutoRetries && (
        <div
          className={cn(
            'mt-2 flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400',
            sizeConfig === SIZE_CONFIG.sm && 'text-[10px] mt-1'
          )}
          data-testid={`${dataTestId}-auto-retry`}
        >
          <div className="flex items-center space-x-1">
            <span className="animate-pulse">⏳</span>
            <span>
              Auto-retry in {Math.ceil((autoRetryDelay - (Date.now() % autoRetryDelay)) / 1000)}s
            </span>
          </div>
          <div className="text-gray-500">
            ({autoRetryCountRef.current + 1}/{maxAutoRetries})
          </div>
        </div>
      )}
      
      {/* Screen reader live region */}
      <div
        id={`${dataTestId}-description`}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {ariaLiveContent}
      </div>
      
      {/* Hidden description for screen readers */}
      <div
        className="sr-only"
        id={`${dataTestId}-help`}
      >
        {statusConfig.ariaDescription}
      </div>
    </div>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export default ConnectionStatusIndicator;

// Export utility functions for external use
export {
  formatDuration,
  formatTimestamp,
  getDetailedErrorMessage,
  getErrorMessageByType,
};

// Export types for external use
export type {
  ConnectionStatusIndicatorProps,
  StatusConfig,
};

// Export constants for external use
export {
  STATUS_CONFIG,
  SIZE_CONFIG,
  DEFAULT_MESSAGES,
};