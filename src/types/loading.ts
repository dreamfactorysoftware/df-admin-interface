/**
 * Loading state management types providing comprehensive loading state control 
 * for React application with TanStack React Query integration and context-based
 * loading coordination across components.
 * 
 * Features:
 * - Type-safe loading state management with React Context API
 * - TanStack React Query integration for automatic server state loading
 * - Loading operation tracking with metadata and categorization
 * - Navigation persistence and loading state recovery
 * - Multiple concurrent operation support with aggregation
 * 
 * @fileoverview Loading state type definitions
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import type { ReactNode } from 'react';

// ============================================================================
// Core Loading State Types
// ============================================================================

/**
 * Loading state values representing different loading phases
 */
export type LoadingStateValue = 'idle' | 'loading' | 'success' | 'error';

/**
 * Loading operation priority levels for coordination
 */
export type LoadingPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Loading operation categories for better organization and filtering
 */
export type LoadingCategory = 
  | 'navigation'     // Route changes and page loads
  | 'api'           // API requests and data fetching
  | 'mutation'      // Data modifications and CRUD operations
  | 'authentication' // Login, logout, session validation
  | 'ui'            // UI interactions and component updates
  | 'background'    // Background tasks and sync operations
  | 'file'          // File uploads and downloads
  | 'system';       // System operations and configuration

/**
 * Loading operation source identifiers for debugging and monitoring
 */
export interface LoadingSource {
  /** Component or service that initiated the loading operation */
  component: string;
  /** Specific action or method that triggered the loading */
  action: string;
  /** Optional description for debugging */
  description?: string;
}

/**
 * Loading operation metadata for tracking and debugging
 */
export interface LoadingOperationMetadata {
  /** Operation start timestamp */
  startTime: number;
  /** Expected operation duration in milliseconds */
  expectedDuration?: number;
  /** Operation timeout in milliseconds */
  timeout?: number;
  /** Whether operation can be cancelled by user */
  cancellable?: boolean;
  /** User-friendly operation description */
  userMessage?: string;
  /** Additional context data */
  context?: Record<string, any>;
}

/**
 * Individual loading operation with complete tracking information
 */
export interface LoadingOperation {
  /** Unique operation identifier */
  id: string;
  /** Loading state value */
  state: LoadingStateValue;
  /** Operation priority level */
  priority: LoadingPriority;
  /** Operation category for organization */
  category: LoadingCategory;
  /** Source information for debugging */
  source: LoadingSource;
  /** Operation metadata and context */
  metadata: LoadingOperationMetadata;
  /** Error information if operation failed */
  error?: Error | string;
  /** Operation completion timestamp */
  endTime?: number;
}

/**
 * Aggregated loading state for multiple operations
 */
export interface AggregatedLoadingState {
  /** Whether any operation is currently loading */
  isLoading: boolean;
  /** Whether any operation is in error state */
  hasError: boolean;
  /** Whether all operations completed successfully */
  isSuccess: boolean;
  /** Number of active loading operations */
  activeCount: number;
  /** Number of operations in error state */
  errorCount: number;
  /** Number of completed operations */
  completedCount: number;
  /** Total number of operations tracked */
  totalCount: number;
  /** Highest priority among active operations */
  highestPriority: LoadingPriority;
  /** Most recent operation that started */
  latestOperation?: LoadingOperation;
  /** Operations currently active */
  activeOperations: LoadingOperation[];
  /** Operations that completed with errors */
  errorOperations: LoadingOperation[];
  /** Operations categorized by type */
  operationsByCategory: Record<LoadingCategory, LoadingOperation[]>;
}

// ============================================================================
// Context Provider Types
// ============================================================================

/**
 * Loading context configuration options
 */
export interface LoadingContextConfig {
  /** Whether to persist loading state across navigation */
  persistAcrossNavigation?: boolean;
  /** Maximum number of operations to track in history */
  maxHistorySize?: number;
  /** Default operation timeout in milliseconds */
  defaultTimeout?: number;
  /** Whether to enable debug logging */
  enableDebugLogging?: boolean;
  /** Whether to integrate with React Query loading states */
  integrateWithReactQuery?: boolean;
  /** Storage key for persisting loading state */
  storageKey?: string;
}

/**
 * Loading context state interface
 */
export interface LoadingContextState {
  /** Aggregated loading state */
  state: AggregatedLoadingState;
  /** Loading context configuration */
  config: Required<LoadingContextConfig>;
  /** Whether context is initialized */
  isInitialized: boolean;
}

/**
 * Loading context actions interface
 */
export interface LoadingContextActions {
  /**
   * Start a loading operation
   * @param source - Operation source information
   * @param config - Operation configuration
   * @returns Operation ID for tracking
   */
  startOperation: (
    source: LoadingSource,
    config?: Partial<LoadingOperationConfig>
  ) => string;

  /**
   * Update loading operation state
   * @param operationId - Operation identifier
   * @param state - New loading state
   * @param error - Optional error information
   */
  updateOperation: (
    operationId: string,
    state: LoadingStateValue,
    error?: Error | string
  ) => void;

  /**
   * Complete loading operation successfully
   * @param operationId - Operation identifier
   */
  completeOperation: (operationId: string) => void;

  /**
   * Fail loading operation with error
   * @param operationId - Operation identifier
   * @param error - Error information
   */
  failOperation: (operationId: string, error: Error | string) => void;

  /**
   * Cancel loading operation
   * @param operationId - Operation identifier
   */
  cancelOperation: (operationId: string) => void;

  /**
   * Clear all operations matching criteria
   * @param filter - Optional filter function
   */
  clearOperations: (
    filter?: (operation: LoadingOperation) => boolean
  ) => void;

  /**
   * Reset loading context to initial state
   */
  reset: () => void;

  /**
   * Get operations by category
   * @param category - Loading category
   * @returns Operations in the specified category
   */
  getOperationsByCategory: (category: LoadingCategory) => LoadingOperation[];

  /**
   * Get operations by component source
   * @param component - Component name
   * @returns Operations from the specified component
   */
  getOperationsByComponent: (component: string) => LoadingOperation[];

  /**
   * Check if specific operation is active
   * @param operationId - Operation identifier
   * @returns Whether operation is currently active
   */
  isOperationActive: (operationId: string) => boolean;
}

/**
 * Complete loading context value interface
 */
export interface LoadingContextValue extends LoadingContextState, LoadingContextActions {}

/**
 * Loading context provider props
 */
export interface LoadingProviderProps {
  /** Child components */
  children: ReactNode;
  /** Loading context configuration */
  config?: Partial<LoadingContextConfig>;
  /** Initial loading operations */
  initialOperations?: LoadingOperation[];
}

// ============================================================================
// Operation Configuration Types
// ============================================================================

/**
 * Configuration for individual loading operations
 */
export interface LoadingOperationConfig {
  /** Operation priority level */
  priority?: LoadingPriority;
  /** Operation category */
  category?: LoadingCategory;
  /** Expected operation duration in milliseconds */
  expectedDuration?: number;
  /** Operation timeout in milliseconds */
  timeout?: number;
  /** Whether operation can be cancelled by user */
  cancellable?: boolean;
  /** User-friendly operation description */
  userMessage?: string;
  /** Additional context data */
  context?: Record<string, any>;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Loading context hook return type for consuming components
 */
export interface UseLoadingContextReturn extends LoadingContextValue {
  /** Whether loading context is available */
  isAvailable: boolean;
}

/**
 * Simplified loading hook return type for common operations
 */
export interface UseLoadingReturn {
  /** Current loading state */
  isLoading: boolean;
  /** Whether any operations have errors */
  hasError: boolean;
  /** Start a simple loading operation */
  startLoading: (source?: string, action?: string) => string;
  /** Stop loading operation */
  stopLoading: (operationId: string) => void;
  /** Set loading error */
  setError: (operationId: string, error: Error | string) => void;
  /** Clear all loading operations */
  clearAll: () => void;
}

// ============================================================================
// React Query Integration Types
// ============================================================================

/**
 * React Query integration configuration
 */
export interface ReactQueryIntegrationConfig {
  /** Whether to automatically track query loading states */
  autoTrackQueries?: boolean;
  /** Whether to automatically track mutation loading states */
  autoTrackMutations?: boolean;
  /** Categories to assign to different query types */
  queryCategoryMapping?: Record<string, LoadingCategory>;
  /** Priority mapping for different query types */
  queryPriorityMapping?: Record<string, LoadingPriority>;
}

/**
 * React Query loading state synchronization interface
 */
export interface ReactQueryLoadingSync {
  /** Register query with loading context */
  registerQuery: (queryKey: string[], operationId: string) => void;
  /** Unregister query from loading context */
  unregisterQuery: (queryKey: string[]) => void;
  /** Update query loading state */
  updateQueryState: (
    queryKey: string[],
    state: LoadingStateValue,
    error?: Error
  ) => void;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Loading state filter function type
 */
export type LoadingStateFilter = (operation: LoadingOperation) => boolean;

/**
 * Loading state change listener type
 */
export type LoadingStateListener = (state: AggregatedLoadingState) => void;

/**
 * Operation completion callback type
 */
export type OperationCompletionCallback = (
  operation: LoadingOperation,
  state: LoadingStateValue
) => void;

// ============================================================================
// Navigation Integration Types
// ============================================================================

/**
 * Navigation loading state for route transitions
 */
export interface NavigationLoadingState {
  /** Whether navigation is in progress */
  isNavigating: boolean;
  /** Current route being loaded */
  currentRoute?: string;
  /** Target route for navigation */
  targetRoute?: string;
  /** Navigation start timestamp */
  navigationStartTime?: number;
  /** Navigation operation ID */
  navigationOperationId?: string;
}

/**
 * Loading state persistence configuration
 */
export interface LoadingStatePersistence {
  /** Storage mechanism to use */
  storage: 'localStorage' | 'sessionStorage' | 'memory';
  /** Storage key prefix */
  keyPrefix: string;
  /** Whether to persist operation history */
  persistHistory?: boolean;
  /** Maximum age for persisted operations in milliseconds */
  maxAge?: number;
}

// ============================================================================
// Default Values and Constants
// ============================================================================

/**
 * Default loading context configuration
 */
export const DEFAULT_LOADING_CONFIG: Required<LoadingContextConfig> = {
  persistAcrossNavigation: true,
  maxHistorySize: 100,
  defaultTimeout: 30000, // 30 seconds
  enableDebugLogging: process.env.NODE_ENV === 'development',
  integrateWithReactQuery: true,
  storageKey: 'df-admin-loading-state',
};

/**
 * Default operation configuration
 */
export const DEFAULT_OPERATION_CONFIG: Required<LoadingOperationConfig> = {
  priority: 'normal',
  category: 'ui',
  expectedDuration: 2000, // 2 seconds
  timeout: 30000, // 30 seconds
  cancellable: true,
  userMessage: 'Loading...',
  context: {},
};

/**
 * Loading priority order for comparison
 */
export const LOADING_PRIORITY_ORDER: Record<LoadingPriority, number> = {
  low: 1,
  normal: 2,
  high: 3,
  critical: 4,
};

// ============================================================================
// Error Types
// ============================================================================

/**
 * Loading context error types
 */
export class LoadingContextError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'LoadingContextError';
  }
}

/**
 * Operation timeout error
 */
export class OperationTimeoutError extends LoadingContextError {
  constructor(operationId: string, timeout: number) {
    super(
      `Operation ${operationId} timed out after ${timeout}ms`,
      'OPERATION_TIMEOUT',
      { operationId, timeout }
    );
  }
}

/**
 * Operation not found error
 */
export class OperationNotFoundError extends LoadingContextError {
  constructor(operationId: string) {
    super(
      `Operation ${operationId} not found`,
      'OPERATION_NOT_FOUND',
      { operationId }
    );
  }
}

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/**
 * Type guard to check if value is a valid loading state
 */
export function isLoadingStateValue(value: any): value is LoadingStateValue {
  return ['idle', 'loading', 'success', 'error'].includes(value);
}

/**
 * Type guard to check if value is a valid loading priority
 */
export function isLoadingPriority(value: any): value is LoadingPriority {
  return ['low', 'normal', 'high', 'critical'].includes(value);
}

/**
 * Type guard to check if value is a valid loading category
 */
export function isLoadingCategory(value: any): value is LoadingCategory {
  return [
    'navigation',
    'api',
    'mutation',
    'authentication',
    'ui',
    'background',
    'file',
    'system',
  ].includes(value);
}

/**
 * Type predicate for filtering active operations
 */
export const isActiveOperation = (operation: LoadingOperation): boolean => 
  operation.state === 'loading';

/**
 * Type predicate for filtering error operations
 */
export const isErrorOperation = (operation: LoadingOperation): boolean => 
  operation.state === 'error';

/**
 * Type predicate for filtering completed operations
 */
export const isCompletedOperation = (operation: LoadingOperation): boolean => 
  operation.state === 'success';

// Export all types for external usage
export type * from './loading';