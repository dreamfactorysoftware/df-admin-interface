/**
 * Loading Components - Centralized Export Module
 * 
 * This barrel export file provides comprehensive access to all loading components,
 * hooks, utilities, and type definitions for the DreamFactory Admin Interface.
 * Supports tree-shaking optimization with named exports and provides a consistent
 * interface for loading state management throughout the React/Next.js application.
 * 
 * Architecture:
 * - Core Components: Spinner, Skeleton, Page Loader, Progress Indicator
 * - Context Providers: Loading state management with React Context and Zustand
 * - Specialized Components: Connection testing, global overlays, suspense wrappers
 * - Type Safety: Comprehensive TypeScript interfaces and configuration types
 * - Performance: Optimized for React 19 concurrent features and Next.js 15.1+
 * 
 * @module LoadingComponents
 * @version 1.0.0
 */

// =============================================================================
// CORE LOADING COMPONENTS
// =============================================================================

/**
 * LoadingSpinner - Primary loading indicator component
 * Accessible spinner with size variants, theme support, and motion preferences
 */
export {
  LoadingSpinner,
  LoadingSpinner as default, // Default export for backward compatibility
  spinnerVariants,
  overlayVariants,
} from './loading-spinner';

export type {
  LoadingSpinnerProps,
} from './loading-spinner';

/**
 * LoadingSkeleton - Content placeholder components
 * Shimmer animations for text, images, tables, cards, and custom layouts
 */
export {
  LoadingSkeleton,
  SkeletonText,
  SkeletonImage,
  SkeletonButton,
  SkeletonTable,
  SkeletonCard,
  SkeletonBase,
  ResponsiveSkeletonGrid,
} from './loading-skeleton';

export type {
  LoadingSkeletonProps,
  SkeletonTextProps,
  SkeletonImageProps,
  SkeletonTableProps,
  SkeletonCardProps,
  BaseSkeletonProps,
} from './loading-skeleton';

/**
 * PageLoader - Full-page loading states
 * Router integration, Suspense fallbacks, timeout handling, and error recovery
 */
export {
  PageLoader,
  SuspensePageLoader,
  pageLoaderVariants,
  LoadingTimeoutError,
} from './page-loader';

export type {
  PageLoaderProps,
  PageLoaderConfig,
} from './page-loader';

/**
 * ProgressIndicator - Operation progress visualization
 * Progress bars, step indicators, and percentage displays
 */
export {
  ProgressIndicator,
  CircularProgress,
  LinearProgress,
  StepProgress,
  progressIndicatorVariants,
} from './progress-indicator';

export type {
  ProgressIndicatorProps,
  ProgressConfig,
  ProgressStep,
  ProgressVariant,
} from './progress-indicator';

// =============================================================================
// SPECIALIZED LOADING COMPONENTS
// =============================================================================

/**
 * ConnectionLoader - Database connection testing
 * Real-time connection validation with retry mechanisms and status indicators
 */
export {
  ConnectionLoader,
  ConnectionStatus,
  connectionLoaderVariants,
} from './connection-loader';

export type {
  ConnectionLoaderProps,
  ConnectionTestResult,
  DatabaseConnectionConfig,
  ConnectionRetryOptions,
} from './connection-loader';

/**
 * GlobalLoader - Application-wide loading overlay
 * Zustand integration, operation management, and cancellation support
 */
export {
  GlobalLoader,
  LoadingOverlay,
  globalLoaderVariants,
} from './global-loader';

export type {
  GlobalLoaderProps,
  LoadingOperation,
  LoadingCancellationToken,
  GlobalLoadingState,
} from './global-loader';

/**
 * SuspenseWrapper - Enhanced Suspense boundaries
 * Error boundaries, progressive loading, timeout handling, and retry mechanisms
 */
export {
  SuspenseWrapper,
  SuspenseBoundary,
  ProgressiveSuspense,
  NestedSuspense,
} from './suspense-wrapper';

export type {
  SuspenseWrapperProps,
  FallbackConfig,
  TimeoutConfig,
  ErrorRecoveryConfig,
  ProgressiveLoadingConfig,
  LoadingContext,
} from './suspense-wrapper';

// =============================================================================
// LOADING CONTEXT AND PROVIDERS
// =============================================================================

/**
 * LoadingContext - Global loading state management
 * React Context provider with Zustand store integration for coordinated loading states
 */
export {
  LoadingProvider,
  LoadingContextProvider,
  useLoadingContext,
} from './loading-context';

export type {
  LoadingContextValue,
  LoadingProviderProps,
  LoadingStateConfig,
  LoadingCoordinator,
} from './loading-context';

// =============================================================================
// CUSTOM HOOKS
// =============================================================================

/**
 * Loading management hooks
 * Custom hooks for component-level and application-level loading state management
 */

// Skeleton loading hook with React Query integration
export { useSkeletonLoader } from './loading-skeleton';

// Page loader control hook
export { usePageLoader } from './page-loader';

// Loading state coordination hooks
export {
  useLoadingState,
  useGlobalLoading,
  useLoadingQueue,
  useLoadingTimeout,
  useLoadingProgress,
  useAsyncOperation,
} from './loading-context';

// Connection testing hooks
export {
  useConnectionTest,
  useConnectionRetry,
  useDatabaseConnections,
} from './connection-loader';

// Progress tracking hooks
export {
  useProgress,
  useProgressSteps,
  useProgressTimer,
} from './progress-indicator';

// =============================================================================
// UTILITY FUNCTIONS AND HELPERS
// =============================================================================

/**
 * Loading utilities and helper functions
 * Common patterns, configuration builders, and performance optimizations
 */

/**
 * Creates a loading configuration object with defaults
 * @param overrides - Partial configuration to override defaults
 * @returns Complete loading configuration
 */
export const createLoadingConfig = (overrides?: Partial<LoadingStateConfig>): LoadingStateConfig => ({
  minDelay: 300,
  timeout: 30000,
  priority: 'normal',
  persist: false,
  showProgress: true,
  enableRetry: true,
  maxRetries: 3,
  ...overrides,
});

/**
 * Generates unique loading operation identifiers
 * @param prefix - Optional prefix for the ID
 * @returns Unique loading operation ID
 */
export const generateLoadingId = (prefix = 'loading'): string => 
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Delays execution for minimum loading time to prevent flashing
 * @param minDelay - Minimum delay in milliseconds
 * @param startTime - Operation start timestamp
 * @returns Promise that resolves after minimum delay
 */
export const ensureMinimumLoadingTime = async (
  minDelay: number = 300,
  startTime: number = Date.now()
): Promise<void> => {
  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, minDelay - elapsed);
  
  if (remaining > 0) {
    await new Promise(resolve => setTimeout(resolve, remaining));
  }
};

/**
 * Creates a cancellable loading token
 * @returns Cancellation token with cancel method and status
 */
export const createCancellationToken = (): LoadingCancellationToken => {
  let isCancelled = false;
  const cancelCallbacks: (() => void)[] = [];

  return {
    get isCancelled() {
      return isCancelled;
    },
    cancel: () => {
      isCancelled = true;
      cancelCallbacks.forEach(callback => callback());
    },
    onCancel: (callback: () => void) => {
      if (isCancelled) {
        callback();
      } else {
        cancelCallbacks.push(callback);
      }
    },
  };
};

/**
 * Wraps a promise with timeout and cancellation support
 * @param promise - Promise to wrap
 * @param timeout - Timeout in milliseconds
 * @param cancellationToken - Optional cancellation token
 * @returns Promise with timeout and cancellation support
 */
export const withLoadingTimeout = <T>(
  promise: Promise<T>,
  timeout: number = 30000,
  cancellationToken?: LoadingCancellationToken
): Promise<T> => {
  return new Promise((resolve, reject) => {
    let isResolved = false;

    // Set up timeout
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        reject(new LoadingTimeoutError(timeout));
      }
    }, timeout);

    // Set up cancellation
    if (cancellationToken) {
      cancellationToken.onCancel(() => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          reject(new Error('Operation cancelled'));
        }
      });
    }

    // Handle promise resolution
    promise
      .then(result => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          resolve(result);
        }
      })
      .catch(error => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          reject(error);
        }
      });
  });
};

// =============================================================================
// LOADING PATTERNS AND PRESETS
// =============================================================================

/**
 * Common loading configurations for different scenarios
 * Pre-configured objects for typical loading patterns in the application
 */
export const LoadingPresets = {
  /**
   * Quick operations (under 2 seconds)
   * API calls, form submissions, simple data fetching
   */
  quick: createLoadingConfig({
    minDelay: 200,
    timeout: 5000,
    showProgress: false,
    priority: 'high',
  }),

  /**
   * Standard operations (2-10 seconds)
   * Database connections, schema discovery, file uploads
   */
  standard: createLoadingConfig({
    minDelay: 300,
    timeout: 15000,
    showProgress: true,
    priority: 'normal',
  }),

  /**
   * Long operations (10+ seconds)
   * API generation, bulk operations, large data imports
   */
  long: createLoadingConfig({
    minDelay: 500,
    timeout: 60000,
    showProgress: true,
    enableRetry: true,
    maxRetries: 2,
    priority: 'low',
  }),

  /**
   * Navigation operations
   * Page transitions, route changes, component loading
   */
  navigation: createLoadingConfig({
    minDelay: 150,
    timeout: 10000,
    persist: false,
    priority: 'high',
  }),

  /**
   * Background operations
   * Auto-refresh, polling, background sync
   */
  background: createLoadingConfig({
    minDelay: 0,
    timeout: 30000,
    persist: true,
    priority: 'low',
    showProgress: false,
  }),
} as const;

// =============================================================================
// TYPE AGGREGATION
// =============================================================================

/**
 * Aggregated type exports for simplified imports
 * Re-export all types under a common namespace for easier consumption
 */
export type {
  // Core component props
  LoadingSpinnerProps,
  LoadingSkeletonProps,
  PageLoaderProps,
  ProgressIndicatorProps,
  ConnectionLoaderProps,
  GlobalLoaderProps,
  SuspenseWrapperProps,

  // Configuration types
  PageLoaderConfig,
  LoadingStateConfig,
  FallbackConfig,
  TimeoutConfig,
  ErrorRecoveryConfig,
  ProgressiveLoadingConfig,
  ProgressConfig,
  DatabaseConnectionConfig,
  ConnectionRetryOptions,

  // State management types
  LoadingContextValue,
  LoadingProviderProps,
  LoadingOperation,
  LoadingCancellationToken,
  GlobalLoadingState,
  LoadingCoordinator,
  ConnectionTestResult,

  // Skeleton component types
  SkeletonTextProps,
  SkeletonImageProps,
  SkeletonTableProps,
  SkeletonCardProps,
  BaseSkeletonProps,

  // Progress types
  ProgressStep,
  ProgressVariant,

  // Enum and literal types
  LoadingContext,
};

// =============================================================================
// VERSION AND METADATA
// =============================================================================

/**
 * Module metadata for debugging and version tracking
 */
export const LOADING_MODULE_VERSION = '1.0.0';
export const LOADING_MODULE_NAME = '@df-admin/loading-components';

/**
 * Feature flags for loading components
 * Can be used to enable/disable experimental features
 */
export const LoadingFeatures = {
  CONCURRENT_LOADING: true,
  PROGRESSIVE_ENHANCEMENT: true,
  PERFORMANCE_MONITORING: process.env.NODE_ENV === 'development',
  ACCESSIBILITY_ENHANCEMENTS: true,
  EXPERIMENTAL_FEATURES: false,
} as const;