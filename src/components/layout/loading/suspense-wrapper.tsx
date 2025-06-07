'use client';

import React, { Suspense, ErrorInfo, ComponentType } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import LoadingSpinner, { type LoadingSpinnerProps } from './loading-spinner';
import { cn } from '@/lib/utils';
import type { 
  LoadingCategory, 
  LoadingPriority, 
  LoadingSource,
  LoadingOperationConfig 
} from '@/types/loading';

// ============================================================================
// Error Boundary Interface (since error-boundary.tsx doesn't exist yet)
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: ComponentType<{ error?: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

/**
 * React Error Boundary implementation for Suspense integration
 * Provides comprehensive error handling for async loading failures
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('SuspenseWrapper Error Boundary caught an error:', error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state when specified props change
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys && resetKeys.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetErrorBoundary();
      }
    }

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} reset={this.resetErrorBoundary} />;
      }

      // Default error fallback
      return (
        <div 
          className="flex flex-col items-center justify-center p-6 text-center"
          role="alert"
          aria-live="assertive"
        >
          <div className="text-error-600 dark:text-error-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            An error occurred while loading this content.
          </p>
          <button
            onClick={this.resetErrorBoundary}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Suspense Wrapper Component Variants
// ============================================================================

const suspenseWrapperVariants = cva(
  [
    // Base container styles
    'relative',
    // Ensure proper stacking context
    'isolate',
  ],
  {
    variants: {
      // Layout variants for different contexts
      layout: {
        page: 'min-h-screen w-full',
        section: 'min-h-[400px] w-full',
        component: 'min-h-[200px] w-full',
        inline: 'inline-block min-w-0',
        card: 'min-h-[150px] w-full rounded-lg border border-gray-200 dark:border-gray-700',
        modal: 'min-h-[300px] w-full',
      },
      // Padding variants
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6', 
        lg: 'p-8',
        xl: 'p-12',
      },
      // Loading state visual treatment
      loadingTreatment: {
        transparent: '',
        overlay: 'bg-white/50 dark:bg-gray-900/50',
        solid: 'bg-white dark:bg-gray-900',
        blur: 'backdrop-blur-sm bg-white/80 dark:bg-gray-900/80',
      }
    },
    defaultVariants: {
      layout: 'component',
      padding: 'md',
      loadingTreatment: 'transparent',
    },
  }
);

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Custom fallback component props interface
 */
export interface SuspenseFallbackProps {
  /** Loading operation category */
  category?: LoadingCategory;
  /** Loading priority level */
  priority?: LoadingPriority;
  /** Loading source information */
  source?: LoadingSource;
  /** User-friendly loading message */
  message?: string;
  /** Additional description */
  description?: string;
  /** Loading timeout in milliseconds */
  timeout?: number;
  /** Whether loading can be cancelled */
  cancellable?: boolean;
  /** Cancel callback function */
  onCancel?: () => void;
}

/**
 * Timeout configuration interface
 */
export interface TimeoutConfig {
  /** Timeout duration in milliseconds */
  duration: number;
  /** Timeout fallback component */
  fallback?: ComponentType<{ onRetry?: () => void }>;
  /** Callback when timeout occurs */
  onTimeout?: () => void;
  /** Whether to show retry option */
  showRetry?: boolean;
}

/**
 * Progressive loading configuration
 */
export interface ProgressiveLoadingConfig {
  /** Enable progressive loading for nested components */
  enabled: boolean;
  /** Delay between progressive loading stages in milliseconds */
  stageDelay?: number;
  /** Maximum nesting depth */
  maxDepth?: number;
  /** Loading priority inheritance */
  inheritPriority?: boolean;
}

/**
 * Main SuspenseWrapper component props
 */
export interface SuspenseWrapperProps 
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
         VariantProps<typeof suspenseWrapperVariants> {
  
  // Core props
  /** Child components to wrap with Suspense */
  children: React.ReactNode;
  
  // Loading configuration
  /** Loading operation category for context */
  category?: LoadingCategory;
  /** Loading priority level */
  priority?: LoadingPriority;
  /** Loading source information */
  source?: LoadingSource;
  /** User-friendly loading message */
  loadingMessage?: string;
  /** Additional loading description */
  loadingDescription?: string;
  
  // Fallback configuration
  /** Custom loading fallback component */
  fallback?: ComponentType<SuspenseFallbackProps>;
  /** Loading spinner configuration */
  spinnerProps?: Partial<LoadingSpinnerProps>;
  
  // Error handling
  /** Custom error fallback component */
  errorFallback?: ComponentType<{ error?: Error; reset: () => void }>;
  /** Error handler callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to reset error on prop changes */
  resetOnPropsChange?: boolean;
  /** Keys that trigger error reset when changed */
  resetKeys?: Array<string | number>;
  
  // Timeout configuration
  /** Timeout configuration object */
  timeout?: TimeoutConfig;
  
  // Progressive loading
  /** Progressive loading configuration */
  progressive?: ProgressiveLoadingConfig;
  
  // Advanced options
  /** Whether to capture loading operations in context */
  captureLoading?: boolean;
  /** Loading operation configuration */
  operationConfig?: Partial<LoadingOperationConfig>;
  /** Custom CSS classes */
  className?: string;
  /** Whether to show loading overlay */
  overlay?: boolean;
  /** Nested Suspense support */
  nested?: boolean;
  /** Suspense key for forced re-suspension */
  suspenseKey?: string;
}

/**
 * Timeout hook for handling slow-loading operations
 */
function useTimeout(config?: TimeoutConfig) {
  const [timedOut, setTimedOut] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    if (!config?.duration) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setTimedOut(true);
      config.onTimeout?.();
    }, config.duration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [config?.duration, config?.onTimeout]);

  const resetTimeout = React.useCallback(() => {
    setTimedOut(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { timedOut, resetTimeout };
}

/**
 * Progressive loading hook for nested component loading
 */
function useProgressiveLoading(config?: ProgressiveLoadingConfig) {
  const [loadingStage, setLoadingStage] = React.useState(0);
  const maxStages = config?.maxDepth || 3;

  React.useEffect(() => {
    if (!config?.enabled) return;

    const delay = config.stageDelay || 300;
    let timeoutId: NodeJS.Timeout;

    if (loadingStage < maxStages) {
      timeoutId = setTimeout(() => {
        setLoadingStage(prev => prev + 1);
      }, delay);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loadingStage, config?.enabled, config?.stageDelay, maxStages]);

  const resetStages = React.useCallback(() => {
    setLoadingStage(0);
  }, []);

  return { loadingStage, resetStages };
}

// ============================================================================
// Default Fallback Components
// ============================================================================

/**
 * Default loading fallback component
 */
const DefaultLoadingFallback: React.FC<SuspenseFallbackProps> = ({
  category = 'ui',
  priority = 'normal',
  message = 'Loading...',
  description,
  timeout,
  cancellable = false,
  onCancel,
}) => {
  const [elapsedTime, setElapsedTime] = React.useState(0);

  // Track elapsed time for timeout scenarios
  React.useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Determine spinner variant based on priority
  const getSpinnerVariant = (priority: LoadingPriority) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'primary';
      case 'low': return 'secondary';
      default: return 'primary';
    }
  };

  // Determine spinner size based on category
  const getSpinnerSize = (category: LoadingCategory) => {
    switch (category) {
      case 'navigation': return 'xl';
      case 'api': return 'lg';
      case 'mutation': return 'md';
      case 'file': return 'lg';
      default: return 'md';
    }
  };

  const isSlowLoading = timeout && elapsedTime > (timeout * 0.5);

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <LoadingSpinner
        size={getSpinnerSize(category)}
        variant={getSpinnerVariant(priority)}
        speed={priority === 'critical' ? 'fast' : 'normal'}
        label={message}
        description={description}
        centered
      />
      
      <div className="mt-4 text-center">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {message}
        </p>
        
        {description && (
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
        
        {isSlowLoading && (
          <p className="mt-2 text-xs text-warning-600 dark:text-warning-400">
            This is taking longer than expected...
          </p>
        )}
        
        {cancellable && onCancel && (
          <button
            onClick={onCancel}
            className="mt-3 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Default timeout fallback component
 */
const DefaultTimeoutFallback: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <div 
    className="flex flex-col items-center justify-center p-6 text-center"
    role="alert"
    aria-live="assertive"
  >
    <div className="text-warning-600 dark:text-warning-400 mb-4">
      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
      Loading timeout
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
      This content is taking longer than expected to load.
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        Try again
      </button>
    )}
  </div>
);

// ============================================================================
// Main SuspenseWrapper Component
// ============================================================================

/**
 * SuspenseWrapper - Comprehensive Suspense wrapper with error boundaries and timeout handling
 * 
 * A production-ready React Suspense wrapper that provides:
 * - React 19.0 Suspense integration with concurrent features
 * - Error boundary patterns for graceful async loading failure handling
 * - Progressive loading support for nested components and complex hierarchies
 * - Timeout mechanisms preventing infinite loading states
 * - TypeScript generic support for type-safe usage
 * - WCAG 2.1 AA compliant accessibility features
 * 
 * Replaces Angular async pipe patterns with modern React concurrent patterns,
 * integrating seamlessly with React Query/SWR, Zustand state management,
 * and the DreamFactory loading context system.
 * 
 * @example
 * // Basic usage with default loading spinner
 * <SuspenseWrapper>
 *   <AsyncDataComponent />
 * </SuspenseWrapper>
 * 
 * @example
 * // Advanced usage with timeout and progressive loading
 * <SuspenseWrapper
 *   category="api"
 *   priority="high"
 *   loadingMessage="Fetching database schema..."
 *   timeout={{ duration: 10000, showRetry: true }}
 *   progressive={{ enabled: true, stageDelay: 500 }}
 *   layout="page"
 *   overlay
 * >
 *   <DatabaseSchemaComponent />
 * </SuspenseWrapper>
 * 
 * @example
 * // Nested Suspense with custom fallbacks
 * <SuspenseWrapper
 *   layout="section"
 *   nested
 *   fallback={CustomLoadingComponent}
 *   errorFallback={CustomErrorComponent}
 * >
 *   <ComplexNestedComponent />
 * </SuspenseWrapper>
 */
export function SuspenseWrapper({
  children,
  category = 'ui',
  priority = 'normal',
  source,
  loadingMessage,
  loadingDescription,
  fallback: CustomFallback,
  spinnerProps,
  errorFallback,
  onError,
  resetOnPropsChange = true,
  resetKeys,
  timeout,
  progressive,
  captureLoading = false,
  operationConfig,
  className,
  overlay = false,
  nested = false,
  suspenseKey,
  layout,
  padding,
  loadingTreatment,
  ...props
}: SuspenseWrapperProps) {
  
  // Hooks for timeout and progressive loading
  const { timedOut, resetTimeout } = useTimeout(timeout);
  const { loadingStage, resetStages } = useProgressiveLoading(progressive);
  
  // Generate unique IDs for accessibility
  const loadingId = React.useId();
  const errorId = React.useId();
  
  // Reset handlers
  const handleRetry = React.useCallback(() => {
    resetTimeout();
    resetStages();
  }, [resetTimeout, resetStages]);

  // Fallback component selection
  const LoadingFallback = React.useMemo(() => {
    if (timedOut && timeout?.fallback) {
      const TimeoutFallback = timeout.fallback;
      return () => <TimeoutFallback onRetry={timeout.showRetry ? handleRetry : undefined} />;
    }

    if (CustomFallback) {
      return () => (
        <CustomFallback
          category={category}
          priority={priority}
          source={source}
          message={loadingMessage}
          description={loadingDescription}
          timeout={timeout?.duration}
          onCancel={undefined} // Could be implemented if needed
        />
      );
    }

    return () => (
      <DefaultLoadingFallback
        category={category}
        priority={priority}
        source={source}
        message={loadingMessage}
        description={loadingDescription}
        timeout={timeout?.duration}
      />
    );
  }, [
    timedOut, 
    timeout, 
    CustomFallback, 
    category, 
    priority, 
    source, 
    loadingMessage, 
    loadingDescription,
    handleRetry
  ]);

  // Timeout fallback component
  if (timedOut && !timeout?.fallback) {
    return (
      <div className={cn(suspenseWrapperVariants({ layout, padding, loadingTreatment }), className)}>
        <DefaultTimeoutFallback onRetry={timeout?.showRetry ? handleRetry : undefined} />
      </div>
    );
  }

  // Main component structure
  const suspenseContent = (
    <Suspense 
      key={suspenseKey} 
      fallback={
        <div 
          id={loadingId}
          className={cn(
            'flex items-center justify-center',
            overlay && 'absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10'
          )}
          role="status"
          aria-live="polite"
          aria-label={loadingMessage || 'Loading content'}
        >
          <LoadingFallback />
        </div>
      }
    >
      {progressive?.enabled && loadingStage > 0 ? (
        <div className="space-y-4">
          {children}
          {loadingStage < (progressive.maxDepth || 3) && (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          )}
        </div>
      ) : (
        children
      )}
    </Suspense>
  );

  return (
    <div 
      className={cn(suspenseWrapperVariants({ layout, padding, loadingTreatment }), className)}
      {...props}
    >
      <ErrorBoundary
        fallback={errorFallback}
        onError={onError}
        resetOnPropsChange={resetOnPropsChange}
        resetKeys={resetKeys}
      >
        {nested ? (
          <SuspenseWrapper
            category={category}
            priority={progressive?.inheritPriority ? priority : 'low'}
            loadingMessage={loadingMessage}
            layout="component"
            padding="sm"
            nested={false}
          >
            {suspenseContent}
          </SuspenseWrapper>
        ) : (
          suspenseContent
        )}
      </ErrorBoundary>
    </div>
  );
}

// ============================================================================
// Convenience Hooks and Utilities
// ============================================================================

/**
 * Hook for creating suspense-wrapped components with consistent configuration
 */
export function useSuspenseWrapper(
  defaultConfig?: Partial<SuspenseWrapperProps>
) {
  return React.useCallback(
    (config?: Partial<SuspenseWrapperProps>) => 
      ({ children }: { children: React.ReactNode }) => (
        <SuspenseWrapper {...defaultConfig} {...config}>
          {children}
        </SuspenseWrapper>
      ),
    [defaultConfig]
  );
}

/**
 * Higher-order component for wrapping components with Suspense
 */
export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  suspenseConfig?: Partial<SuspenseWrapperProps>
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <SuspenseWrapper {...suspenseConfig}>
      <Component {...props} ref={ref} />
    </SuspenseWrapper>
  ));

  WrappedComponent.displayName = `withSuspense(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// ============================================================================
// Exports
// ============================================================================

export default SuspenseWrapper;
export type { 
  SuspenseWrapperProps, 
  SuspenseFallbackProps, 
  TimeoutConfig, 
  ProgressiveLoadingConfig 
};
export { 
  suspenseWrapperVariants, 
  DefaultLoadingFallback, 
  DefaultTimeoutFallback,
  ErrorBoundary
};

// Export convenience utilities
export { useSuspenseWrapper, withSuspense };