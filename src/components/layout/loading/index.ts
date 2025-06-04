/**
 * Loading Components Barrel Export
 * 
 * Centralized export file providing access to all loading components and utilities.
 * Supports the React/Next.js migration from Angular, ensuring consistent loading
 * state management throughout the application.
 * 
 * Features:
 * - Tree-shaking optimization with named exports
 * - Comprehensive TypeScript type safety
 * - Simplified import paths for improved developer experience
 * - Integration with React Query, SWR, and Zustand state management
 * - Performance-optimized loading states meeting < 5s database connection
 *   and < 2s page load requirements per technical specification
 */

// ============================================================================
// CORE LOADING COMPONENTS
// ============================================================================

/**
 * Basic animated loading spinner component
 * - Supports multiple sizes (small, medium, large)
 * - Theme-aware (light/dark mode)
 * - WCAG 2.1 AA compliant with reduced motion support
 * - Tailwind CSS 4.1+ animated with class-variance-authority
 */
export { default as LoadingSpinner } from './loading-spinner';
export type {
  LoadingSpinnerProps,
  SpinnerSize,
  SpinnerTheme,
  SpinnerVariant
} from './loading-spinner';

/**
 * Skeleton placeholder component for content loading
 * - Animated shimmer effects using CSS transforms
 * - Configurable variants (text, image, button, table rows)
 * - Responsive design adapting to different viewports
 * - React Query integration for automatic display
 */
export { default as LoadingSkeleton } from './loading-skeleton';
export type {
  LoadingSkeletonProps,
  SkeletonVariant,
  SkeletonSize,
  SkeletonShape
} from './loading-skeleton';

/**
 * Full-page loading component for route transitions
 * - Next.js App Router integration
 * - React Suspense fallback patterns
 * - Error boundary integration for failed page loads
 * - Server component and lazy loading support
 */
export { default as PageLoader } from './page-loader';
export type {
  PageLoaderProps,
  PageLoadingState,
  RouteTransitionType
} from './page-loader';

/**
 * React Suspense wrapper with standardized fallbacks
 * - Error boundary integration
 * - Configurable fallback components
 * - Nested Suspense support for progressive loading
 * - Timeout handling for slow async operations
 */
export { default as SuspenseWrapper } from './suspense-wrapper';
export type {
  SuspenseWrapperProps,
  SuspenseFallbackType,
  SuspenseTimeoutConfig
} from './suspense-wrapper';

/**
 * Global application loading overlay
 * - Zustand store integration for centralized state
 * - Headless UI Portal for proper z-index management
 * - Loading queue management for concurrent operations
 * - Cancellation token support
 */
export { default as GlobalLoader } from './global-loader';
export type {
  GlobalLoaderProps,
  GlobalLoadingState,
  LoadingOperation,
  LoadingQueue
} from './global-loader';

/**
 * Progress indicator for multi-step workflows
 * - Step-based progress for API generation, schema discovery
 * - Determinate and indeterminate progress modes
 * - React Query mutation progress integration
 * - Customizable animations and completion states
 */
export { default as ProgressIndicator } from './progress-indicator';
export type {
  ProgressIndicatorProps,
  ProgressStep,
  ProgressState,
  ProgressConfig
} from './progress-indicator';

/**
 * Specialized loader for database connection testing
 * - Real-time connection status feedback
 * - Support for MySQL, PostgreSQL, MongoDB, SQL Server
 * - Retry mechanisms with exponential backoff
 * - < 30 second timeout per technical specification
 */
export { default as ConnectionLoader } from './connection-loader';
export type {
  ConnectionLoaderProps,
  ConnectionState,
  ConnectionStatus,
  DatabaseConnectionConfig
} from './connection-loader';

// ============================================================================
// LOADING CONTEXT AND HOOKS
// ============================================================================

/**
 * React Context provider for application-wide loading state management
 * - Replaces Angular service injection patterns
 * - React Query global loading state integration
 * - Loading state persistence across navigation
 * - TypeScript-safe context access
 */
export {
  LoadingProvider,
  LoadingContext,
  useLoading,
  useLoadingState,
  useGlobalLoading
} from './loading-context';

export type {
  LoadingContextValue,
  LoadingProviderProps,
  LoadingHookReturn,
  LoadingStateConfig,
  LoadingAction,
  LoadingEvent
} from './loading-context';

// ============================================================================
// LOADING STATE TYPES AND INTERFACES
// ============================================================================

/**
 * Common loading state types used across components
 * These types ensure consistency and type safety for loading operations
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type LoadingVariant = 
  | 'spinner'
  | 'skeleton'
  | 'progress'
  | 'overlay'
  | 'inline';

export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type LoadingTheme = 'light' | 'dark' | 'auto';

/**
 * Configuration interface for loading components
 */
export interface LoadingConfig {
  /** Default loading variant to use */
  variant?: LoadingVariant;
  /** Default size for loading indicators */
  size?: LoadingSize;
  /** Theme preference */
  theme?: LoadingTheme;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Whether to show loading for operations under threshold */
  minimumLoadingTime?: number;
  /** Accessibility settings */
  accessibility?: {
    /** Reduce motion for users with vestibular disorders */
    respectReducedMotion?: boolean;
    /** Custom ARIA labels */
    ariaLabel?: string;
    /** Announce loading state changes to screen readers */
    announceStateChanges?: boolean;
  };
}

/**
 * Loading operation metadata interface
 */
export interface LoadingOperation {
  /** Unique identifier for the loading operation */
  id: string;
  /** Human-readable label for the operation */
  label: string;
  /** Operation type (database, api, navigation, etc.) */
  type: 'database' | 'api' | 'navigation' | 'schema' | 'auth' | 'generic';
  /** Current state of the operation */
  state: LoadingState;
  /** Start timestamp */
  startTime: number;
  /** Optional end timestamp */
  endTime?: number;
  /** Optional error message */
  error?: string;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Whether operation can be cancelled */
  cancellable?: boolean;
}

/**
 * Loading hook configuration
 */
export interface UseLoadingOptions {
  /** Operation identifier */
  id?: string;
  /** Loading threshold in milliseconds */
  threshold?: number;
  /** Automatic cleanup on unmount */
  autoCleanup?: boolean;
  /** Error retry configuration */
  retry?: {
    attempts: number;
    delay: number;
    backoff?: boolean;
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Utility function to create consistent loading operation IDs
 */
export function createLoadingId(prefix: string = 'loading'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Utility to determine if reduced motion is preferred
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Utility to format loading operation duration
 */
export function formatLoadingDuration(startTime: number, endTime?: number): string {
  const duration = (endTime || Date.now()) - startTime;
  if (duration < 1000) return `${duration}ms`;
  return `${(duration / 1000).toFixed(1)}s`;
}

/**
 * Utility to check if operation exceeds timeout threshold
 */
export function isOperationTimedOut(operation: LoadingOperation, timeout: number = 30000): boolean {
  if (operation.state !== 'loading') return false;
  return Date.now() - operation.startTime > timeout;
}

// ============================================================================
// RE-EXPORTS FROM RELATED MODULES
// ============================================================================

/**
 * Re-export loading-related types from other modules for convenience
 * This provides a single import location for all loading-related functionality
 */

// Re-export common UI types that loading components depend on
export type { BaseComponentProps } from '../../../types/ui';

// Re-export theme types for loading component styling
export type { ThemeConfig, ThemeMode } from '../../theme/types';

// Re-export animation types for loading indicators
export type { AnimationConfig, TransitionConfig } from '../../../styles/animations';

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default loading configuration matching technical specification requirements
 * - Database connection test: < 5 seconds target, < 30 seconds critical
 * - API generation: < 10 seconds target, < 60 seconds critical  
 * - Schema discovery: < 15 seconds target, < 90 seconds critical
 * - Page load time: < 2 seconds target, < 5 seconds critical
 */
export const DEFAULT_LOADING_CONFIG: LoadingConfig = {
  variant: 'spinner',
  size: 'md',
  theme: 'auto',
  timeout: 30000, // 30 seconds default timeout
  minimumLoadingTime: 200, // Minimum 200ms to avoid flashing
  accessibility: {
    respectReducedMotion: true,
    announceStateChanges: true,
    ariaLabel: 'Loading content, please wait...'
  }
};

/**
 * Performance-optimized timeouts for different operation types
 * Based on technical specification SLA requirements
 */
export const OPERATION_TIMEOUTS = {
  database: 30000,    // 30 seconds for database operations
  api: 60000,         // 60 seconds for API generation
  schema: 90000,      // 90 seconds for schema discovery
  navigation: 5000,   // 5 seconds for page navigation
  auth: 10000,        // 10 seconds for authentication
  generic: 15000      // 15 seconds for other operations
} as const;

/**
 * Loading component display names for debugging and testing
 */
export const LOADING_COMPONENT_NAMES = {
  LoadingSpinner: 'LoadingSpinner',
  LoadingSkeleton: 'LoadingSkeleton', 
  PageLoader: 'PageLoader',
  SuspenseWrapper: 'SuspenseWrapper',
  GlobalLoader: 'GlobalLoader',
  ProgressIndicator: 'ProgressIndicator',
  ConnectionLoader: 'ConnectionLoader',
  LoadingProvider: 'LoadingProvider'
} as const;