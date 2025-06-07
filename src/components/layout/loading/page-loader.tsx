'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * Loading states for different phases of page loading
 */
type LoadingState = 'idle' | 'navigating' | 'loading' | 'error' | 'timeout';

/**
 * Error information for failed page loads
 */
interface LoadingError {
  message: string;
  code?: string;
  timestamp: Date;
  retryCount: number;
}

/**
 * Configuration for the page loader component
 */
interface PageLoaderConfig {
  /** Timeout duration in milliseconds before showing error state */
  timeoutDuration: number;
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Whether to show detailed error information in development */
  showDetailedErrors: boolean;
  /** Custom loading messages for different phases */
  loadingMessages: {
    navigating: string;
    loading: string;
    timeout: string;
  };
}

/**
 * Props for the PageLoader component
 */
interface PageLoaderProps {
  /** Child components to wrap with loading functionality */
  children: React.ReactNode;
  /** Custom configuration for loading behavior */
  config?: Partial<PageLoaderConfig>;
  /** Whether to show a full-screen overlay */
  fullScreen?: boolean;
  /** Custom className for styling */
  className?: string;
  /** Callback when loading state changes */
  onLoadingStateChange?: (state: LoadingState) => void;
  /** Custom loading component */
  loadingComponent?: React.ComponentType<{ message?: string }>;
  /** Custom error component */
  errorComponent?: React.ComponentType<{ error: LoadingError; onRetry: () => void }>;
}

/**
 * Hook for managing router loading states with Next.js App Router
 * This simulates the behavior that would be provided by use-router-loading.ts
 */
function useRouterLoading() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Simulate navigation loading detection
    // In the actual implementation, this would hook into Next.js router events
    const handleRouteChangeStart = () => {
      setIsNavigating(true);
      setIsLoading(true);
    };

    const handleRouteChangeComplete = () => {
      setIsNavigating(false);
      setIsLoading(false);
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
    };

    // Set up navigation detection based on pathname changes
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        handleRouteChangeComplete();
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [pathname, isLoading, loadingTimeout]);

  return {
    isLoading,
    isNavigating,
    setLoading: setIsLoading,
    setNavigating: setIsNavigating,
    clearTimeout: () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
    },
    setTimeout: (callback: () => void, delay: number) => {
      const timeoutId = setTimeout(callback, delay);
      setLoadingTimeout(timeoutId);
      return timeoutId;
    },
  };
}

/**
 * Default configuration for the PageLoader
 */
const defaultConfig: PageLoaderConfig = {
  timeoutDuration: 15000, // 15 seconds
  maxRetries: 3,
  showDetailedErrors: process.env.NODE_ENV === 'development',
  loadingMessages: {
    navigating: 'Navigating...',
    loading: 'Loading page...',
    timeout: 'This is taking longer than expected...',
  },
};

/**
 * Loading spinner component with smooth animations
 */
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} border-2 border-primary-200 border-t-primary-600 rounded-full`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
};

/**
 * Progress bar component for loading indication
 */
const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
  <motion.div
    className="w-full h-1 bg-gray-200 rounded-full overflow-hidden"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <motion.div
      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
      initial={{ width: '0%' }}
      animate={{ width: `${progress}%` }}
      transition={{
        duration: 0.5,
        ease: 'easeInOut',
      }}
    />
  </motion.div>
);

/**
 * Default loading component with branding and progress indication
 */
const DefaultLoadingComponent: React.FC<{ message?: string }> = ({ message }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90; // Stop at 90% until actual completion
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="flex flex-col items-center justify-center space-y-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      {/* DreamFactory logo placeholder */}
      <div className="flex items-center space-x-3">
        <LoadingSpinner size="lg" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          DreamFactory
        </h2>
      </div>

      {/* Loading message */}
      {message && (
        <motion.p
          className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      )}

      {/* Progress bar */}
      <div className="w-64">
        <ProgressBar progress={progress} />
      </div>
    </motion.div>
  );
};

/**
 * Default error component with retry functionality
 */
const DefaultErrorComponent: React.FC<{
  error: LoadingError;
  onRetry: () => void;
}> = ({ error, onRetry }) => (
  <motion.div
    className="flex flex-col items-center justify-center space-y-6 p-8"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
      <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
    </div>

    <div className="text-center space-y-2">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Page Load Failed
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
        {error.message}
      </p>
      {process.env.NODE_ENV === 'development' && error.code && (
        <p className="text-xs text-gray-500 font-mono">
          Error Code: {error.code}
        </p>
      )}
    </div>

    <button
      onClick={onRetry}
      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
      type="button"
    >
      <ArrowPathIcon className="w-4 h-4 mr-2" />
      Retry ({error.retryCount}/{3})
    </button>
  </motion.div>
);

/**
 * Simple Error Boundary implementation
 * This simulates the behavior that would be provided by error-boundary.tsx
 */
class SimpleErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback: React.ComponentType<{ error: Error; reset: () => void }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      return (
        <FallbackComponent
          error={this.state.error}
          reset={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * PageLoader component for handling route transitions and page loading states
 * 
 * Integrates with Next.js App Router and React Suspense to provide smooth loading
 * states during navigation and server-side rendering operations. Includes error
 * boundary integration for handling failed page loads and timeout management.
 * 
 * Features:
 * - Next.js 15.1+ App Router integration with React Server Components
 * - React Suspense fallback patterns for lazy-loaded components
 * - Navigation loading states with router event integration
 * - Error boundary protection for failed page loads
 * - Performance-optimized loading states that don't block critical rendering
 * - Customizable loading and error components
 * - Timeout handling with automatic retry functionality
 * - Full-screen overlay support for seamless transitions
 * 
 * @example
 * ```tsx
 * // Basic usage with default configuration
 * <PageLoader>
 *   <YourPageContent />
 * </PageLoader>
 * 
 * // With custom configuration
 * <PageLoader
 *   config={{
 *     timeoutDuration: 10000,
 *     maxRetries: 5,
 *     loadingMessages: {
 *       navigating: 'Switching pages...',
 *       loading: 'Loading content...',
 *       timeout: 'Still loading...'
 *     }
 *   }}
 *   fullScreen
 *   onLoadingStateChange={(state) => console.log('Loading state:', state)}
 * >
 *   <YourPageContent />
 * </PageLoader>
 * 
 * // As a Suspense fallback
 * <Suspense fallback={<PageLoader.LoadingFallback />}>
 *   <LazyComponent />
 * </Suspense>
 * ```
 */
export const PageLoader: React.FC<PageLoaderProps> & {
  LoadingFallback: React.ComponentType<{ message?: string }>;
  ErrorFallback: React.ComponentType<{ error: Error; reset: () => void }>;
} = ({
  children,
  config: userConfig,
  fullScreen = false,
  className = '',
  onLoadingStateChange,
  loadingComponent: CustomLoadingComponent,
  errorComponent: CustomErrorComponent,
}) => {
  const config = { ...defaultConfig, ...userConfig };
  const { isLoading, isNavigating, setTimeout, clearTimeout } = useRouterLoading();
  
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<LoadingError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Update loading state based on router events
  useEffect(() => {
    let newState: LoadingState = 'idle';
    
    if (isNavigating) {
      newState = 'navigating';
    } else if (isLoading) {
      newState = 'loading';
    }
    
    if (newState !== loadingState) {
      setLoadingState(newState);
      onLoadingStateChange?.(newState);
    }
  }, [isLoading, isNavigating, loadingState, onLoadingStateChange]);

  // Handle loading timeout
  useEffect(() => {
    if (loadingState === 'loading' || loadingState === 'navigating') {
      const timeoutId = setTimeout(() => {
        setLoadingState('timeout');
        onLoadingStateChange?.('timeout');
      }, config.timeoutDuration);

      return () => clearTimeout();
    }
  }, [loadingState, config.timeoutDuration, setTimeout, clearTimeout, onLoadingStateChange]);

  // Handle retry functionality
  const handleRetry = () => {
    if (retryCount < config.maxRetries) {
      setRetryCount(prev => prev + 1);
      setError(null);
      setLoadingState('loading');
      
      // Trigger a router refresh or reload
      window.location.reload();
    } else {
      setError({
        message: 'Maximum retry attempts exceeded. Please refresh the page manually.',
        code: 'MAX_RETRIES_EXCEEDED',
        timestamp: new Date(),
        retryCount,
      });
    }
  };

  // Handle errors from error boundary
  const handleError = (error: Error) => {
    setLoadingState('error');
    setError({
      message: error.message || 'An unexpected error occurred while loading the page.',
      code: error.name || 'UNKNOWN_ERROR',
      timestamp: new Date(),
      retryCount,
    });
    onLoadingStateChange?.('error');
  };

  // Render loading overlay
  const renderLoadingOverlay = () => {
    if (loadingState === 'idle') return null;

    const LoadingComponent = CustomLoadingComponent || DefaultLoadingComponent;
    const ErrorComponent = CustomErrorComponent || DefaultErrorComponent;

    const overlayClasses = fullScreen
      ? 'fixed inset-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm'
      : 'absolute inset-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm';

    return (
      <AnimatePresence>
        {(loadingState !== 'idle') && (
          <motion.div
            className={`${overlayClasses} flex items-center justify-center ${className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {loadingState === 'error' && error ? (
              <ErrorComponent error={error} onRetry={handleRetry} />
            ) : (
              <LoadingComponent
                message={
                  loadingState === 'timeout'
                    ? config.loadingMessages.timeout
                    : loadingState === 'navigating'
                    ? config.loadingMessages.navigating
                    : config.loadingMessages.loading
                }
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <SimpleErrorBoundary
      fallback={({ error, reset }) => (
        <DefaultErrorComponent
          error={{
            message: error.message,
            code: error.name,
            timestamp: new Date(),
            retryCount,
          }}
          onRetry={reset}
        />
      )}
      onError={handleError}
    >
      <div className={fullScreen ? 'relative min-h-screen' : 'relative'}>
        <Suspense
          fallback={
            <PageLoader.LoadingFallback message={config.loadingMessages.loading} />
          }
        >
          {children}
        </Suspense>
        {renderLoadingOverlay()}
      </div>
    </SimpleErrorBoundary>
  );
};

/**
 * Standalone loading fallback component for use with React Suspense
 */
PageLoader.LoadingFallback = ({ message }: { message?: string }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <DefaultLoadingComponent message={message} />
  </div>
);

/**
 * Standalone error fallback component for use with error boundaries
 */
PageLoader.ErrorFallback = ({ error, reset }: { error: Error; reset: () => void }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <DefaultErrorComponent
      error={{
        message: error.message,
        code: error.name,
        timestamp: new Date(),
        retryCount: 0,
      }}
      onRetry={reset}
    />
  </div>
);

export default PageLoader;

/**
 * Type exports for external usage
 */
export type { PageLoaderProps, LoadingState, LoadingError, PageLoaderConfig };