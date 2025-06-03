'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Configuration options for the loading hook
 */
export interface LoadingConfig {
  /**
   * Debounce delay in milliseconds for state changes to prevent flicker
   * @default 100
   */
  debounceDelay?: number;
  /**
   * Whether to log loading state changes for debugging
   * @default false
   */
  debug?: boolean;
  /**
   * Maximum number of concurrent loading operations to track
   * @default 100
   */
  maxConcurrentOperations?: number;
}

/**
 * Loading state information
 */
export interface LoadingState {
  /** Whether any loading operation is currently active */
  isLoading: boolean;
  /** Number of active loading operations */
  activeCount: number;
  /** Last loading operation that was started */
  lastOperation?: string;
  /** Timestamp of the last state change */
  lastUpdated: number;
}

/**
 * Return type for the loading hook
 */
export interface UseLoadingReturn {
  /** Current loading state */
  state: LoadingState;
  /** Start a loading operation with optional identifier */
  startLoading: (operationId?: string) => void;
  /** Stop a loading operation */
  stopLoading: (operationId?: string) => void;
  /** Reset all loading states */
  reset: () => void;
  /** Toggle loading state (for simple show/hide scenarios) */
  toggle: (force?: boolean) => void;
  /** Check if a specific operation is loading */
  isOperationLoading: (operationId: string) => boolean;
}

/**
 * Global loading state management hook that handles loading indicators, spinner states,
 * and loading coordination across components. Replaces Angular DfLoadingSpinnerService
 * and DfSpinnerService with React state management and proper loading state coordination
 * to prevent flicker and ensure consistent UI feedback.
 *
 * Key Features:
 * - Counter-based overlapping request handling
 * - Configurable debouncing to prevent UI flicker
 * - Memory management with proper cleanup
 * - Loading state validation and error handling
 * - Integration ready for HTTP client interceptors
 * - Comprehensive TypeScript support
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { state, startLoading, stopLoading } = useLoading();
 *
 * const handleApiCall = async () => {
 *   startLoading('api-call');
 *   try {
 *     await apiCall();
 *   } finally {
 *     stopLoading('api-call');
 *   }
 * };
 *
 * return (
 *   <div>
 *     {state.isLoading && <Spinner />}
 *     <button onClick={handleApiCall}>Call API</button>
 *   </div>
 * );
 * ```
 *
 * @example
 * ```tsx
 * // With configuration
 * const loading = useLoading({
 *   debounceDelay: 200,
 *   debug: true
 * });
 * ```
 *
 * @param config - Configuration options for loading behavior
 * @returns Loading state management functions and current state
 */
export function useLoading(config: LoadingConfig = {}): UseLoadingReturn {
  const {
    debounceDelay = 100,
    debug = false,
    maxConcurrentOperations = 100,
  } = config;

  // Internal state management
  const [activeCounter, setActiveCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastOperation, setLastOperation] = useState<string | undefined>();
  const [activeOperations] = useState<Set<string>>(new Set());

  // Refs for cleanup and debouncing
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdatedRef = useRef<number>(Date.now());
  const isMountedRef = useRef(true);

  // Debug logging utility
  const logDebug = useCallback(
    (message: string, data?: any) => {
      if (debug && typeof window !== 'undefined' && window.console) {
        console.log(`[useLoading] ${message}`, data);
      }
    },
    [debug]
  );

  // Update loading state with debouncing logic
  const updateLoadingState = useCallback(
    (newCounter: number, operationId?: string) => {
      if (!isMountedRef.current) return;

      // Validate counter bounds
      const validatedCounter = Math.max(0, Math.min(newCounter, maxConcurrentOperations));
      
      if (validatedCounter !== newCounter && debug) {
        console.warn(
          `[useLoading] Counter clamped from ${newCounter} to ${validatedCounter}`
        );
      }

      setActiveCounter(validatedCounter);
      lastUpdatedRef.current = Date.now();

      if (operationId) {
        setLastOperation(operationId);
      }

      const shouldBeLoading = validatedCounter > 0;

      if (shouldBeLoading) {
        // Show loading immediately
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
        setIsLoading(true);
        logDebug('Loading started', { counter: validatedCounter, operationId });
      } else {
        // Hide loading with debounce to prevent flicker
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }
        
        hideTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setIsLoading(false);
            logDebug('Loading stopped', { counter: validatedCounter, operationId });
          }
        }, debounceDelay);
      }
    },
    [debounceDelay, debug, maxConcurrentOperations, logDebug]
  );

  // Start a loading operation
  const startLoading = useCallback(
    (operationId?: string) => {
      if (!isMountedRef.current) return;

      const id = operationId || `operation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Track operation if ID provided
      if (operationId && !activeOperations.has(id)) {
        activeOperations.add(id);
      }

      setActiveCounter(current => {
        const newCounter = current + 1;
        updateLoadingState(newCounter, id);
        return newCounter;
      });

      logDebug('Started loading operation', { operationId: id, activeOperations: activeOperations.size });
    },
    [updateLoadingState, activeOperations, logDebug]
  );

  // Stop a loading operation
  const stopLoading = useCallback(
    (operationId?: string) => {
      if (!isMountedRef.current) return;

      // Remove operation from tracking if ID provided
      if (operationId && activeOperations.has(operationId)) {
        activeOperations.delete(operationId);
      }

      setActiveCounter(current => {
        const newCounter = Math.max(current - 1, 0);
        updateLoadingState(newCounter, operationId);
        return newCounter;
      });

      logDebug('Stopped loading operation', { operationId, activeOperations: activeOperations.size });
    },
    [updateLoadingState, activeOperations, logDebug]
  );

  // Reset all loading states
  const reset = useCallback(() => {
    if (!isMountedRef.current) return;

    activeOperations.clear();
    
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    setActiveCounter(0);
    setIsLoading(false);
    setLastOperation(undefined);
    lastUpdatedRef.current = Date.now();

    logDebug('Reset all loading states');
  }, [activeOperations, logDebug]);

  // Toggle loading state (simple show/hide for compatibility)
  const toggle = useCallback(
    (force?: boolean) => {
      if (!isMountedRef.current) return;

      if (typeof force === 'boolean') {
        if (force) {
          startLoading('toggle-operation');
        } else {
          stopLoading('toggle-operation');
        }
      } else {
        if (isLoading) {
          stopLoading('toggle-operation');
        } else {
          startLoading('toggle-operation');
        }
      }
    },
    [isLoading, startLoading, stopLoading]
  );

  // Check if specific operation is loading
  const isOperationLoading = useCallback(
    (operationId: string) => {
      return activeOperations.has(operationId);
    },
    [activeOperations]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      activeOperations.clear();
    };
  }, [activeOperations]);

  // Construct current state
  const state: LoadingState = {
    isLoading,
    activeCount: activeCounter,
    lastOperation,
    lastUpdated: lastUpdatedRef.current,
  };

  return {
    state,
    startLoading,
    stopLoading,
    reset,
    toggle,
    isOperationLoading,
  };
}

/**
 * Global loading context for application-wide loading state management.
 * This can be used with React Context for sharing loading state across components.
 */
let globalLoadingHook: UseLoadingReturn | null = null;

/**
 * Get or create a global loading instance for application-wide loading state.
 * This provides a singleton pattern similar to Angular services.
 *
 * @example
 * ```tsx
 * // In a component that needs to coordinate with global loading
 * const globalLoading = useGlobalLoading();
 * 
 * const handleGlobalOperation = async () => {
 *   globalLoading.startLoading('global-api-call');
 *   try {
 *     await globalApiCall();
 *   } finally {
 *     globalLoading.stopLoading('global-api-call');
 *   }
 * };
 * ```
 *
 * @param config - Configuration for the global loading instance
 * @returns Global loading state management functions
 */
export function useGlobalLoading(config: LoadingConfig = {}): UseLoadingReturn {
  const localLoading = useLoading(config);
  
  // Initialize global instance if not already created
  if (!globalLoadingHook) {
    globalLoadingHook = localLoading;
  }
  
  return globalLoadingHook;
}

/**
 * Higher-order hook for automatic loading state management with async operations.
 * Provides automatic loading state management for async functions.
 *
 * @example
 * ```tsx
 * const [performAction, { isLoading, error }] = useAsyncLoading(
 *   async (data) => {
 *     return await apiCall(data);
 *   },
 *   { operationId: 'api-call' }
 * );
 *
 * return (
 *   <button onClick={() => performAction(data)} disabled={isLoading}>
 *     {isLoading ? 'Loading...' : 'Submit'}
 *   </button>
 * );
 * ```
 */
export function useAsyncLoading<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  options: {
    operationId?: string;
    loadingConfig?: LoadingConfig;
    onSuccess?: (result: Awaited<ReturnType<T>>) => void;
    onError?: (error: Error) => void;
  } = {}
): [T, { isLoading: boolean; error: Error | null; reset: () => void }] {
  const { operationId, loadingConfig, onSuccess, onError } = options;
  const loading = useLoading(loadingConfig);
  const [error, setError] = useState<Error | null>(null);
  const isLoading = operationId ? loading.isOperationLoading(operationId) : loading.state.isLoading;

  const wrappedFn = useCallback(
    async (...args: Parameters<T>) => {
      const id = operationId || `async-${Date.now()}`;
      loading.startLoading(id);
      setError(null);

      try {
        const result = await asyncFn(...args);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        loading.stopLoading(id);
      }
    },
    [asyncFn, operationId, loading, onSuccess, onError]
  ) as T;

  const reset = useCallback(() => {
    setError(null);
    if (operationId) {
      loading.stopLoading(operationId);
    }
  }, [loading, operationId]);

  return [wrappedFn, { isLoading, error, reset }];
}

export default useLoading;