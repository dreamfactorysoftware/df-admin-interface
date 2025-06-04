'use client';

import React, { useEffect } from 'react';
import { useLoadingStore } from '@/stores/loading-store';
import { Portal } from '@/components/ui/portal';
import { LoadingSpinner } from './loading-spinner';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Loading operation interface for managing concurrent operations
 */
export interface LoadingOperation {
  id: string;
  message: string;
  progress?: number;
  cancellable?: boolean;
  type: 'authentication' | 'navigation' | 'data' | 'bulk' | 'connection' | 'schema' | 'generation';
  startTime: number;
  timeout?: number;
}

/**
 * Loading cancellation token for operation cleanup
 */
export interface LoadingCancellationToken {
  isCancelled: boolean;
  cancel: () => void;
  onCancel: (callback: () => void) => void;
}

/**
 * Global loader variants using class-variance-authority
 */
const globalLoaderVariants = cva(
  'fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300',
  {
    variants: {
      variant: {
        overlay: 'bg-black/50 backdrop-blur-sm',
        transparent: 'bg-transparent',
        solid: 'bg-white dark:bg-gray-900',
      },
      size: {
        sm: 'p-4',
        md: 'p-8',
        lg: 'p-12',
      },
    },
    defaultVariants: {
      variant: 'overlay',
      size: 'md',
    },
  }
);

/**
 * Loading content variants for different states
 */
const loadingContentVariants = cva(
  'flex flex-col items-center justify-center space-y-4 rounded-lg p-6 shadow-lg transition-all duration-200',
  {
    variants: {
      theme: {
        light: 'bg-white text-gray-900 border border-gray-200',
        dark: 'bg-gray-800 text-white border border-gray-700',
      },
      state: {
        loading: 'opacity-100 scale-100',
        hidden: 'opacity-0 scale-95 pointer-events-none',
      },
    },
    defaultVariants: {
      theme: 'light',
      state: 'loading',
    },
  }
);

/**
 * Props for the GlobalLoader component
 */
export interface GlobalLoaderProps extends VariantProps<typeof globalLoaderVariants> {
  /**
   * Custom className for additional styling
   */
  className?: string;
  /**
   * Whether to show progress information
   */
  showProgress?: boolean;
  /**
   * Whether to show cancellation options
   */
  showCancel?: boolean;
  /**
   * Custom timeout for operations (in milliseconds)
   */
  defaultTimeout?: number;
  /**
   * Whether to block user interaction during loading
   */
  blocking?: boolean;
}

/**
 * Loading operation queue item with metadata
 */
interface QueuedOperation extends LoadingOperation {
  cancellationToken: LoadingCancellationToken;
  promise?: Promise<any>;
  resolve?: (value: any) => void;
  reject?: (error: any) => void;
}

/**
 * Custom hook for managing loading cancellation tokens
 */
function useLoadingCancellation(): {
  createToken: () => LoadingCancellationToken;
  cancelAll: () => void;
  activeTokens: LoadingCancellationToken[];
} {
  const [activeTokens, setActiveTokens] = React.useState<LoadingCancellationToken[]>([]);

  const createToken = React.useCallback((): LoadingCancellationToken => {
    const token: LoadingCancellationToken = {
      isCancelled: false,
      cancel: () => {
        token.isCancelled = true;
        token.onCancel?.();
        setActiveTokens(prev => prev.filter(t => t !== token));
      },
      onCancel: (callback: () => void) => {
        if (token.isCancelled) {
          callback();
        } else {
          token.onCancel = callback;
        }
      },
    };

    setActiveTokens(prev => [...prev, token]);
    return token;
  }, []);

  const cancelAll = React.useCallback(() => {
    activeTokens.forEach(token => token.cancel());
    setActiveTokens([]);
  }, [activeTokens]);

  return { createToken, cancelAll, activeTokens };
}

/**
 * Global loading overlay component for application-wide loading states.
 * 
 * Features:
 * - Centralized loading state management using Zustand
 * - Modal overlay rendering using Headless UI Portal
 * - Loading queue management for multiple concurrent operations
 * - Cancellation token support for aborting operations
 * - Integration with authentication flows and navigation loading states
 * 
 * Technical Implementation:
 * - Uses Zustand 4.5.0 for state management
 * - Headless UI Portal for proper z-index modal rendering
 * - TypeScript 5.8+ with strict type checking
 * - Tailwind CSS 4.1+ for styling
 * - WCAG 2.1 AA accessibility compliance
 */
export function GlobalLoader({
  className,
  variant = 'overlay',
  size = 'md',
  showProgress = true,
  showCancel = true,
  defaultTimeout = 30000, // 30 seconds default timeout
  blocking = true,
  ...props
}: GlobalLoaderProps) {
  // Zustand store integration for global loading state
  const {
    isLoading,
    operations,
    currentOperation,
    startLoading,
    stopLoading,
    clearAllOperations,
    updateOperationProgress,
  } = useLoadingStore();

  // Cancellation token management
  const { createToken, cancelAll, activeTokens } = useLoadingCancellation();

  // Operation queue management
  const [operationQueue, setOperationQueue] = React.useState<QueuedOperation[]>([]);

  // Theme detection from global context
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  // Initialize theme detection
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };

    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkTheme);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkTheme);
    };
  }, []);

  // Operation timeout management
  useEffect(() => {
    const timeouts = new Map<string, NodeJS.Timeout>();

    operationQueue.forEach((operation) => {
      if (operation.timeout && !timeouts.has(operation.id)) {
        const timeout = setTimeout(() => {
          handleCancelOperation(operation.id);
        }, operation.timeout);
        
        timeouts.set(operation.id, timeout);
      }
    });

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [operationQueue]);

  /**
   * Start a new loading operation with cancellation support
   */
  const startLoadingOperation = React.useCallback((
    operation: Omit<LoadingOperation, 'id' | 'startTime'>
  ): LoadingCancellationToken => {
    const id = `loading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const cancellationToken = createToken();
    
    const fullOperation: LoadingOperation = {
      ...operation,
      id,
      startTime: Date.now(),
      timeout: operation.timeout || defaultTimeout,
    };

    const queuedOperation: QueuedOperation = {
      ...fullOperation,
      cancellationToken,
    };

    setOperationQueue(prev => [...prev, queuedOperation]);
    startLoading(fullOperation);

    return cancellationToken;
  }, [createToken, defaultTimeout, startLoading]);

  /**
   * Cancel a specific loading operation
   */
  const handleCancelOperation = React.useCallback((operationId: string) => {
    const operation = operationQueue.find(op => op.id === operationId);
    if (operation && operation.cancellable !== false) {
      operation.cancellationToken.cancel();
      setOperationQueue(prev => prev.filter(op => op.id !== operationId));
      stopLoading(operationId);
    }
  }, [operationQueue, stopLoading]);

  /**
   * Cancel all active operations
   */
  const handleCancelAll = React.useCallback(() => {
    cancelAll();
    setOperationQueue([]);
    clearAllOperations();
  }, [cancelAll, clearAllOperations]);

  /**
   * Update operation progress
   */
  const updateProgress = React.useCallback((operationId: string, progress: number) => {
    setOperationQueue(prev => 
      prev.map(op => 
        op.id === operationId 
          ? { ...op, progress: Math.max(0, Math.min(100, progress)) }
          : op
      )
    );
    updateOperationProgress(operationId, progress);
  }, [updateOperationProgress]);

  /**
   * Get operation type display information
   */
  const getOperationTypeInfo = (type: LoadingOperation['type']) => {
    const typeMap = {
      authentication: { label: 'Authenticating', icon: '🔐' },
      navigation: { label: 'Loading page', icon: '🧭' },
      data: { label: 'Loading data', icon: '📊' },
      bulk: { label: 'Processing', icon: '⚡' },
      connection: { label: 'Testing connection', icon: '🔌' },
      schema: { label: 'Discovering schema', icon: '🗂️' },
      generation: { label: 'Generating API', icon: '🚀' },
    };
    return typeMap[type] || { label: 'Loading', icon: '⏳' };
  };

  // Expose global loading functions to window for external use
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.DreamFactoryLoader = {
        start: startLoadingOperation,
        cancel: handleCancelOperation,
        cancelAll: handleCancelAll,
        updateProgress,
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.DreamFactoryLoader;
      }
    };
  }, [startLoadingOperation, handleCancelOperation, handleCancelAll, updateProgress]);

  // Don't render if no loading operations
  if (!isLoading || operations.length === 0) {
    return null;
  }

  const primaryOperation = currentOperation || operations[0];
  const operationInfo = getOperationTypeInfo(primaryOperation.type);
  const showMultipleOperations = operations.length > 1;

  return (
    <Portal>
      <div
        className={cn(globalLoaderVariants({ variant, size }), className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="loading-title"
        aria-describedby="loading-description"
        {...props}
      >
        {/* Prevent interaction when blocking */}
        {blocking && (
          <div
            className="absolute inset-0 cursor-wait"
            onClick={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && showCancel && primaryOperation.cancellable !== false) {
                handleCancelOperation(primaryOperation.id);
              }
            }}
            tabIndex={-1}
          />
        )}

        {/* Loading content */}
        <div
          className={cn(
            loadingContentVariants({
              theme: isDarkMode ? 'dark' : 'light',
              state: 'loading',
            })
          )}
        >
          {/* Loading spinner */}
          <div className="flex items-center justify-center">
            <LoadingSpinner
              size="lg"
              className="text-primary-500"
              aria-label={`${operationInfo.label} in progress`}
            />
          </div>

          {/* Operation info */}
          <div className="text-center space-y-2">
            <h2
              id="loading-title"
              className="text-lg font-semibold tracking-tight"
            >
              <span className="mr-2" aria-hidden="true">
                {operationInfo.icon}
              </span>
              {operationInfo.label}
            </h2>

            <p
              id="loading-description"
              className="text-sm text-gray-600 dark:text-gray-300"
            >
              {primaryOperation.message}
            </p>

            {/* Progress indicator */}
            {showProgress && primaryOperation.progress !== undefined && (
              <div className="w-full space-y-1">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Progress</span>
                  <span>{Math.round(primaryOperation.progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${primaryOperation.progress}%` }}
                    role="progressbar"
                    aria-valuenow={primaryOperation.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            )}

            {/* Multiple operations indicator */}
            {showMultipleOperations && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {operations.length} operations in progress
              </p>
            )}
          </div>

          {/* Action buttons */}
          {showCancel && (
            <div className="flex items-center justify-center space-x-3 mt-4">
              {primaryOperation.cancellable !== false && (
                <button
                  type="button"
                  onClick={() => handleCancelOperation(primaryOperation.id)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
                  aria-label={`Cancel ${operationInfo.label.toLowerCase()}`}
                >
                  Cancel
                </button>
              )}

              {showMultipleOperations && (
                <button
                  type="button"
                  onClick={handleCancelAll}
                  className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                  aria-label="Cancel all loading operations"
                >
                  Cancel All
                </button>
              )}
            </div>
          )}

          {/* Screen reader announcements */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {isLoading ? `${operationInfo.label}: ${primaryOperation.message}` : ''}
          </div>
        </div>
      </div>
    </Portal>
  );
}

// Export types for external use
export type { LoadingOperation, LoadingCancellationToken };

// Extend window interface for global loader access
declare global {
  interface Window {
    DreamFactoryLoader?: {
      start: (operation: Omit<LoadingOperation, 'id' | 'startTime'>) => LoadingCancellationToken;
      cancel: (operationId: string) => void;
      cancelAll: () => void;
      updateProgress: (operationId: string, progress: number) => void;
    };
  }
}

export default GlobalLoader;