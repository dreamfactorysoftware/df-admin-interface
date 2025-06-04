'use client';

import React, { Suspense, ReactNode, ComponentType, ErrorInfo, useEffect, useState, useRef } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

// Import loading spinner from the same loading module
import { LoadingSpinner } from './loading-spinner';

/**
 * Loading context types for different scenarios
 */
export type LoadingContext = 
  | 'page'      // Full page loading
  | 'component' // Component-level loading  
  | 'data'      // Data fetching loading
  | 'lazy'      // Code splitting/lazy loading
  | 'nested';   // Nested component loading

/**
 * Fallback component configuration
 */
export interface FallbackConfig {
  /** Loading context determines the appropriate fallback */
  context: LoadingContext;
  /** Custom message to display during loading */
  message?: string;
  /** Show progress indicator for longer operations */
  showProgress?: boolean;
  /** Minimum loading time to prevent flashing (in ms) */
  minDisplayTime?: number;
  /** Custom CSS classes for styling */
  className?: string;
}

/**
 * Timeout configuration for preventing infinite loading states
 */
export interface TimeoutConfig {
  /** Timeout duration in milliseconds */
  duration: number;
  /** Fallback component to render on timeout */
  fallbackComponent?: ComponentType<{ onRetry: () => void }>;
  /** Custom error message for timeout scenarios */
  timeoutMessage?: string;
  /** Enable automatic retry on timeout */
  enableRetry?: boolean;
  /** Maximum number of retry attempts */
  maxRetries?: number;
}

/**
 * Error recovery configuration
 */
export interface ErrorRecoveryConfig {
  /** Enable error recovery with retry functionality */
  enableRecovery?: boolean;
  /** Custom error boundary fallback */
  errorFallback?: ComponentType<FallbackProps>;
  /** Error reporting callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Reset error boundary when these props change */
  resetKeys?: Array<string | number>;
  /** Custom error messages by error type */
  errorMessages?: Record<string, string>;
}

/**
 * Progressive loading configuration for nested components
 */
export interface ProgressiveLoadingConfig {
  /** Enable progressive loading for nested suspense boundaries */
  enableProgressive?: boolean;
  /** Loading priority (higher numbers load first) */
  priority?: number;
  /** Skeleton component for content placeholder */
  skeletonComponent?: ComponentType;
  /** Delay before showing loading state (prevents flashing) */
  loadingDelay?: number;
}

/**
 * Generic suspense wrapper props with comprehensive configuration
 */
export interface SuspenseWrapperProps<T = any> {
  /** Child components to wrap with Suspense */
  children: ReactNode;
  /** Fallback configuration for loading states */
  fallback?: FallbackConfig;
  /** Timeout configuration to prevent infinite loading */
  timeout?: TimeoutConfig;
  /** Error recovery and boundary configuration */
  errorRecovery?: ErrorRecoveryConfig;
  /** Progressive loading configuration */
  progressiveLoading?: ProgressiveLoadingConfig;
  /** Unique identifier for debugging and error tracking */
  suspenseId?: string;
  /** Additional context data passed to fallback components */
  context?: T;
  /** Enable development mode logging */
  enableDevLogging?: boolean;
}

/**
 * Default fallback component for different loading contexts
 */
const DefaultFallback: React.FC<{ config: FallbackConfig; onRetry?: () => void }> = ({ 
  config, 
  onRetry 
}) => {
  const { context, message, showProgress, className } = config;
  
  // Context-specific styling and messages
  const contextConfig = {
    page: {
      containerClass: 'fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50',
      size: 'large' as const,
      defaultMessage: 'Loading page...'
    },
    component: {
      containerClass: 'flex items-center justify-center p-8',
      size: 'medium' as const,
      defaultMessage: 'Loading component...'
    },
    data: {
      containerClass: 'flex items-center justify-center p-4',
      size: 'small' as const,
      defaultMessage: 'Loading data...'
    },
    lazy: {
      containerClass: 'flex items-center justify-center p-6',
      size: 'medium' as const,
      defaultMessage: 'Loading module...'
    },
    nested: {
      containerClass: 'flex items-center justify-center p-2',
      size: 'small' as const,
      defaultMessage: 'Loading...'
    }
  };

  const { containerClass, size, defaultMessage } = contextConfig[context];
  const displayMessage = message || defaultMessage;

  return (
    <div className={`${containerClass} ${className || ''}`} role="status" aria-live="polite">
      <div className="text-center">
        <LoadingSpinner 
          size={size}
          className="mx-auto mb-4"
          aria-label={displayMessage}
        />
        <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
          {displayMessage}
        </p>
        {showProgress && (
          <div className="mt-4 w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mx-auto">
            <div className="bg-primary-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Default timeout fallback component
 */
const TimeoutFallback: React.FC<{ onRetry: () => void; message?: string }> = ({ 
  onRetry, 
  message = 'Loading is taking longer than expected...' 
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="mb-4 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-full">
      <svg className="w-6 h-6 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
      Slow Loading Detected
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md">
      {message}
    </p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      Try Again
    </button>
  </div>
);

/**
 * Default error fallback component
 */
const DefaultErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="mb-4 p-3 bg-error-50 dark:bg-error-900/20 rounded-full">
      <svg className="w-6 h-6 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
      Something went wrong
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md">
      {error.message || 'An unexpected error occurred while loading this content.'}
    </p>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-error-500 text-white rounded-md hover:bg-error-600 transition-colors focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
    >
      Try Again
    </button>
  </div>
);

/**
 * Hook for managing timeout logic with retry functionality
 */
const useTimeoutHandler = (config?: TimeoutConfig, onTimeout?: () => void) => {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setHasTimedOut(false);
  };

  const startTimeout = () => {
    if (!config?.duration) return;

    resetTimeout();
    timeoutRef.current = setTimeout(() => {
      setHasTimedOut(true);
      onTimeout?.();
    }, config.duration);
  };

  const handleRetry = () => {
    if (config?.maxRetries && retryCount >= config.maxRetries) {
      return;
    }
    
    setRetryCount(prev => prev + 1);
    setHasTimedOut(false);
    startTimeout();
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    hasTimedOut,
    retryCount,
    startTimeout,
    resetTimeout,
    handleRetry,
    canRetry: !config?.maxRetries || retryCount < config.maxRetries
  };
};

/**
 * Enhanced Suspense wrapper component with comprehensive loading management
 * 
 * This component provides React 19 Suspense integration with:
 * - Configurable fallback components for different contexts
 * - Error boundary patterns for graceful async error handling  
 * - Progressive loading support for nested components
 * - Timeout mechanisms preventing infinite loading states
 * - TypeScript generic support for type-safe usage
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <SuspenseWrapper fallback={{ context: 'component' }}>
 *   <AsyncComponent />
 * </SuspenseWrapper>
 * 
 * // Advanced configuration
 * <SuspenseWrapper
 *   fallback={{ 
 *     context: 'page', 
 *     message: 'Loading dashboard...',
 *     showProgress: true 
 *   }}
 *   timeout={{ 
 *     duration: 10000, 
 *     enableRetry: true,
 *     maxRetries: 3 
 *   }}
 *   errorRecovery={{ 
 *     enableRecovery: true,
 *     resetKeys: [userId] 
 *   }}
 * >
 *   <DashboardPage />
 * </SuspenseWrapper>
 * ```
 */
export const SuspenseWrapper = <T = any>({
  children,
  fallback = { context: 'component' },
  timeout,
  errorRecovery,
  progressiveLoading,
  suspenseId,
  context,
  enableDevLogging = process.env.NODE_ENV === 'development'
}: SuspenseWrapperProps<T>) => {
  const [isLoading, setIsLoading] = useState(false);
  const [startTime] = useState(() => Date.now());
  const [minDisplayTimeElapsed, setMinDisplayTimeElapsed] = useState(false);

  const {
    hasTimedOut,
    retryCount,
    startTimeout,
    resetTimeout,
    handleRetry,
    canRetry
  } = useTimeoutHandler(timeout);

  // Handle minimum display time to prevent flashing
  useEffect(() => {
    if (fallback.minDisplayTime) {
      const timer = setTimeout(() => {
        setMinDisplayTimeElapsed(true);
      }, fallback.minDisplayTime);

      return () => clearTimeout(timer);
    } else {
      setMinDisplayTimeElapsed(true);
    }
  }, [fallback.minDisplayTime]);

  // Development logging
  useEffect(() => {
    if (enableDevLogging && suspenseId) {
      console.log(`[SuspenseWrapper:${suspenseId}] Initialized`, {
        fallback,
        timeout,
        errorRecovery,
        progressiveLoading
      });
    }
  }, [enableDevLogging, suspenseId, fallback, timeout, errorRecovery, progressiveLoading]);

  // Handle loading state changes
  useEffect(() => {
    setIsLoading(true);
    if (timeout?.duration) {
      startTimeout();
    }

    return () => {
      setIsLoading(false);
      resetTimeout();
    };
  }, [timeout?.duration, startTimeout, resetTimeout]);

  // Progressive loading delay
  const [showLoading, setShowLoading] = useState(!progressiveLoading?.loadingDelay);
  
  useEffect(() => {
    if (progressiveLoading?.loadingDelay && isLoading) {
      const delayTimer = setTimeout(() => {
        setShowLoading(true);
      }, progressiveLoading.loadingDelay);

      return () => clearTimeout(delayTimer);
    }
  }, [progressiveLoading?.loadingDelay, isLoading]);

  // Error boundary configuration
  const errorBoundaryConfig = {
    FallbackComponent: errorRecovery?.errorFallback || DefaultErrorFallback,
    onError: (error: Error, errorInfo: ErrorInfo) => {
      if (enableDevLogging) {
        console.error(`[SuspenseWrapper:${suspenseId}] Error caught:`, error, errorInfo);
      }
      errorRecovery?.onError?.(error, errorInfo);
    },
    resetKeys: errorRecovery?.resetKeys,
    onReset: () => {
      if (enableDevLogging && suspenseId) {
        console.log(`[SuspenseWrapper:${suspenseId}] Error boundary reset`);
      }
      resetTimeout();
      setIsLoading(false);
    }
  };

  // Render timeout fallback if timeout occurred
  if (hasTimedOut) {
    const TimeoutComponent = timeout?.fallbackComponent || TimeoutFallback;
    return (
      <TimeoutComponent 
        onRetry={canRetry ? handleRetry : () => window.location.reload()}
        message={timeout?.timeoutMessage}
      />
    );
  }

  // Render skeleton during progressive loading delay
  if (progressiveLoading?.skeletonComponent && isLoading && !showLoading) {
    const SkeletonComponent = progressiveLoading.skeletonComponent;
    return <SkeletonComponent />;
  }

  // Main Suspense wrapper with error boundary
  const suspenseContent = (
    <Suspense
      fallback={
        showLoading && minDisplayTimeElapsed ? (
          <DefaultFallback 
            config={fallback} 
            onRetry={canRetry ? handleRetry : undefined}
          />
        ) : null
      }
    >
      {children}
    </Suspense>
  );

  // Wrap with error boundary if error recovery is enabled
  if (errorRecovery?.enableRecovery !== false) {
    return (
      <ErrorBoundary {...errorBoundaryConfig}>
        {suspenseContent}
      </ErrorBoundary>
    );
  }

  return suspenseContent;
};

/**
 * Higher-order component for wrapping components with Suspense
 */
export const withSuspense = <P extends object>(
  Component: ComponentType<P>,
  suspenseConfig?: Omit<SuspenseWrapperProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <SuspenseWrapper {...suspenseConfig}>
      <Component {...props} />
    </SuspenseWrapper>
  );

  WrappedComponent.displayName = `withSuspense(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Nested Suspense wrapper for progressive loading of component hierarchies
 */
export const NestedSuspenseWrapper: React.FC<{
  children: ReactNode;
  levels: Array<Omit<SuspenseWrapperProps, 'children'>>;
}> = ({ children, levels }) => {
  return levels.reduceRight(
    (acc, levelConfig) => (
      <SuspenseWrapper {...levelConfig}>
        {acc}
      </SuspenseWrapper>
    ),
    children as ReactNode
  );
};

// Export types for external usage
export type {
  SuspenseWrapperProps,
  LoadingContext,
  FallbackConfig,
  TimeoutConfig,
  ErrorRecoveryConfig,
  ProgressiveLoadingConfig
};

// Default export
export default SuspenseWrapper;