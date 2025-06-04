'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { useRouterLoading } from '@/hooks/use-router-loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner } from '@/components/layout/loading/loading-spinner';

/**
 * Page loader component variants using class-variance-authority
 * Provides different loading states for various navigation contexts
 */
const pageLoaderVariants = cva(
  'fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm transition-all duration-300 ease-in-out',
  {
    variants: {
      theme: {
        light: 'bg-white/80 text-gray-900',
        dark: 'bg-gray-900/80 text-white',
        auto: 'bg-white/80 text-gray-900 dark:bg-gray-900/80 dark:text-white',
      },
      overlay: {
        none: 'bg-transparent',
        light: 'bg-white/60 backdrop-blur-sm',
        heavy: 'bg-white/90 backdrop-blur-md',
      },
      animation: {
        fade: 'animate-fade-in',
        slide: 'animate-slide-in',
        scale: 'animate-scale-in',
      },
    },
    defaultVariants: {
      theme: 'auto',
      overlay: 'light',
      animation: 'fade',
    },
  }
);

/**
 * Page loader configuration interface
 */
interface PageLoaderConfig {
  /** Minimum loading time to prevent flicker (ms) */
  minLoadingTime?: number;
  /** Maximum loading time before timeout (ms) */
  maxLoadingTime?: number;
  /** Show progress indicator for long operations */
  showProgress?: boolean;
  /** Custom loading message */
  message?: string;
  /** Enable debugging logs */
  debug?: boolean;
}

/**
 * Page loader component props interface
 */
interface PageLoaderProps extends VariantProps<typeof pageLoaderVariants> {
  /** Whether the loader is currently showing */
  isLoading?: boolean;
  /** Configuration options */
  config?: PageLoaderConfig;
  /** Custom loading content */
  children?: React.ReactNode;
  /** Callback when loading times out */
  onTimeout?: () => void;
  /** Callback when loading completes */
  onComplete?: () => void;
  /** ARIA label for accessibility */
  ariaLabel?: string;
}

/**
 * Default configuration for page loader
 */
const defaultConfig: Required<PageLoaderConfig> = {
  minLoadingTime: 300,
  maxLoadingTime: 30000,
  showProgress: true,
  message: 'Loading page...',
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Loading timeout error class
 */
class LoadingTimeoutError extends Error {
  constructor(timeout: number) {
    super(`Page loading timed out after ${timeout}ms`);
    this.name = 'LoadingTimeoutError';
  }
}

/**
 * Progress indicator component for long-running operations
 */
const ProgressIndicator: React.FC<{ progress?: number; message?: string }> = ({
  progress,
  message,
}) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4">
      <LoadingSpinner size="large" />
      {message && (
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {message}
          <span className="inline-block w-6 text-left">{dots}</span>
        </p>
      )}
      {typeof progress === 'number' && (
        <div className="w-64 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Page loader component for Next.js App Router navigation and React Suspense fallbacks
 * 
 * Features:
 * - Integration with Next.js App Router and React Server Components
 * - React Suspense-compatible loading fallbacks
 * - Navigation loading states with router events
 * - Error boundary integration for failed page loads
 * - Performance optimization with minimum loading times
 * - Accessibility compliance with ARIA labels
 * - Timeout handling with error recovery
 * - Theme-aware styling with Tailwind CSS
 * 
 * @example
 * ```tsx
 * // As a Suspense fallback
 * <Suspense fallback={<PageLoader />}>
 *   <AsyncComponent />
 * </Suspense>
 * 
 * // With router loading states
 * const { isNavigating } = useRouterLoading();
 * {isNavigating && <PageLoader message="Navigating..." />}
 * 
 * // With custom configuration
 * <PageLoader 
 *   config={{ minLoadingTime: 500, showProgress: true }}
 *   onTimeout={() => console.error('Loading timeout')}
 * />
 * ```
 */
export const PageLoader: React.FC<PageLoaderProps> = ({
  isLoading: externalLoading,
  config: userConfig,
  children,
  onTimeout,
  onComplete,
  ariaLabel = 'Loading page content',
  theme,
  overlay,
  animation,
}) => {
  // Merge user config with defaults
  const config = { ...defaultConfig, ...userConfig };
  
  // Router loading state integration
  const { isNavigating, isLoading: routerLoading, progress } = useRouterLoading();
  const pathname = usePathname();
  
  // Internal loading state management
  const [isVisible, setIsVisible] = useState(false);
  const [hasMinTimeElapsed, setHasMinTimeElapsed] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(config.message);
  const [isTimedOut, setIsTimedOut] = useState(false);
  
  // Refs for cleanup
  const minTimeoutRef = useRef<NodeJS.Timeout>();
  const maxTimeoutRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>();
  
  // Determine if we should show the loader
  const shouldShowLoader = externalLoading ?? (isNavigating || routerLoading);

  // Debug logging
  useEffect(() => {
    if (config.debug) {
      console.log('PageLoader state:', {
        isVisible,
        shouldShowLoader,
        isNavigating,
        routerLoading,
        pathname,
        progress,
      });
    }
  }, [config.debug, isVisible, shouldShowLoader, isNavigating, routerLoading, pathname, progress]);

  // Handle loading state changes
  useEffect(() => {
    if (shouldShowLoader && !isVisible) {
      // Start loading
      startTimeRef.current = Date.now();
      setIsVisible(true);
      setHasMinTimeElapsed(false);
      setIsTimedOut(false);
      setLoadingMessage(config.message);

      // Set minimum loading time
      minTimeoutRef.current = setTimeout(() => {
        setHasMinTimeElapsed(true);
      }, config.minLoadingTime);

      // Set maximum loading time (timeout)
      maxTimeoutRef.current = setTimeout(() => {
        setIsTimedOut(true);
        setLoadingMessage('Loading is taking longer than expected...');
        onTimeout?.();
        
        // Auto-hide after timeout + grace period
        setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      }, config.maxLoadingTime);

    } else if (!shouldShowLoader && isVisible && hasMinTimeElapsed) {
      // Stop loading (only if minimum time has elapsed)
      const loadingDuration = Date.now() - (startTimeRef.current ?? 0);
      
      if (config.debug) {
        console.log(`PageLoader: Loading completed in ${loadingDuration}ms`);
      }
      
      setIsVisible(false);
      onComplete?.();
    }

    // Cleanup timeouts when component unmounts or loading stops
    return () => {
      if (minTimeoutRef.current) {
        clearTimeout(minTimeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, [shouldShowLoader, isVisible, hasMinTimeElapsed, config, onTimeout, onComplete]);

  // Route change effect - update loading message based on route
  useEffect(() => {
    if (isNavigating) {
      const routeSegments = pathname.split('/').filter(Boolean);
      const lastSegment = routeSegments[routeSegments.length - 1];
      
      if (lastSegment) {
        const routeMessage = `Loading ${lastSegment.replace(/-/g, ' ')}...`;
        setLoadingMessage(routeMessage);
      }
    }
  }, [pathname, isNavigating]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  // Error boundary fallback for timeout scenarios
  const handleError = (error: Error) => {
    if (config.debug) {
      console.error('PageLoader error:', error);
    }
    
    if (error instanceof LoadingTimeoutError) {
      setIsTimedOut(true);
      setLoadingMessage('Failed to load page. Please try refreshing.');
    }
  };

  // Loading content
  const loadingContent = children ?? (
    <div className="flex flex-col items-center justify-center space-y-6 p-8">
      {config.showProgress ? (
        <ProgressIndicator 
          progress={progress} 
          message={isTimedOut ? 'Connection timeout' : loadingMessage} 
        />
      ) : (
        <>
          <LoadingSpinner size="large" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {loadingMessage}
          </p>
        </>
      )}
      
      {isTimedOut && (
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Reload Page
        </button>
      )}
    </div>
  );

  // Render with portal for proper z-index management
  const loaderElement = (
    <div
      className={pageLoaderVariants({ theme, overlay, animation })}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      data-testid="page-loader"
    >
      <ErrorBoundary
        fallback={
          <div className="text-center p-8">
            <p className="text-red-600 dark:text-red-400 font-medium">
              Failed to load page content
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
            >
              Reload Page
            </button>
          </div>
        }
        onError={handleError}
      >
        {loadingContent}
      </ErrorBoundary>
    </div>
  );

  // Use portal to render at document body level for proper z-index
  return typeof document !== 'undefined' 
    ? createPortal(loaderElement, document.body)
    : loaderElement;
};

/**
 * Suspense wrapper component with page loader fallback
 * Provides consistent loading states for async components and route segments
 */
export const SuspensePageLoader: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  config?: PageLoaderConfig;
}> = ({ children, fallback, config }) => {
  const defaultFallback = <PageLoader config={config} />;
  
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Failed to Load Component
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              There was an error loading this page. Please try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors duration-200"
            >
              Reload Page
            </button>
          </div>
        </div>
      }
    >
      <Suspense fallback={fallback ?? defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * Hook for programmatically controlling page loader
 * Useful for complex loading scenarios and manual control
 */
export const usePageLoader = (config?: PageLoaderConfig) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<number>();
  const [message, setMessage] = useState<string>();

  const showLoader = (loadingMessage?: string) => {
    setMessage(loadingMessage ?? config?.message);
    setIsLoading(true);
  };

  const hideLoader = () => {
    setIsLoading(false);
    setProgress(undefined);
    setMessage(undefined);
  };

  const updateProgress = (newProgress: number, progressMessage?: string) => {
    setProgress(newProgress);
    if (progressMessage) {
      setMessage(progressMessage);
    }
  };

  return {
    isLoading,
    progress,
    message,
    showLoader,
    hideLoader,
    updateProgress,
  };
};

// Export types for external usage
export type { PageLoaderProps, PageLoaderConfig };
export { pageLoaderVariants, LoadingTimeoutError };