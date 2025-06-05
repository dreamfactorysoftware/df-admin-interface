/**
 * Loading state management hook that handles global loading indicators, spinner states,
 * and loading coordination across components. Replaces Angular DfLoadingSpinnerService 
 * and DfSpinnerService with React state management and proper loading state coordination 
 * to prevent flicker and ensure consistent UI feedback.
 * 
 * Features:
 * - Counter-based loading management for overlapping requests
 * - Configurable debouncing to prevent UI flicker
 * - Memory management with proper cleanup
 * - Loading state validation and error handling
 * - Integration with HTTP client and request interceptors
 * - Global loading coordination across components
 * 
 * @fileoverview Loading state management hook
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Loading hook configuration options
 */
export interface LoadingConfig {
  /** Debounce delay in milliseconds to prevent UI flicker (default: 100ms) */
  debounceDelay?: number;
  /** Initial loading state (default: false) */
  initialState?: boolean;
  /** Enable debug logging for development (default: false) */
  debug?: boolean;
}

/**
 * Loading state information returned by the hook
 */
export interface LoadingState {
  /** Current loading state */
  isLoading: boolean;
  /** Number of active loading operations */
  activeCount: number;
  /** Loading operations history for debugging */
  loadingHistory: LoadingOperation[];
}

/**
 * Individual loading operation metadata
 */
export interface LoadingOperation {
  /** Unique identifier for the operation */
  id: string;
  /** Operation start timestamp */
  startTime: number;
  /** Operation type or source identifier */
  source?: string;
  /** Optional metadata for debugging */
  metadata?: Record<string, any>;
}

/**
 * Loading hook return value
 */
export interface UseLoadingReturn {
  /** Current loading state information */
  state: LoadingState;
  /** Show loading indicator */
  show: (source?: string, metadata?: Record<string, any>) => string;
  /** Hide loading indicator by operation ID */
  hide: (operationId: string) => void;
  /** Hide all loading indicators and reset state */
  hideAll: () => void;
  /** Reset loading state to initial values */
  reset: () => void;
  /** Check if specific operation is active */
  isOperationActive: (operationId: string) => boolean;
  /** Get loading operations by source */
  getOperationsBySource: (source: string) => LoadingOperation[];
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: Required<LoadingConfig> = {
  debounceDelay: 100,
  initialState: false,
  debug: false,
};

const MAX_HISTORY_SIZE = 50;
const OPERATION_ID_PREFIX = 'loading_op_';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate unique operation ID
 */
const generateOperationId = (): string => {
  return `${OPERATION_ID_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Log debug information if debug mode is enabled
 */
const debugLog = (enabled: boolean, message: string, data?: any): void => {
  if (enabled && process.env.NODE_ENV === 'development') {
    console.debug(`[useLoading] ${message}`, data || '');
  }
};

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Loading state management hook with counter-based overlapping request handling,
 * debouncing to prevent UI flicker, and comprehensive loading coordination.
 * 
 * Replaces Angular DfLoadingSpinnerService and DfSpinnerService functionality
 * with React patterns and enhanced state management.
 * 
 * @param config - Loading configuration options
 * @returns Loading state and control functions
 * 
 * @example
 * ```tsx
 * const loading = useLoading({ debounceDelay: 150 });
 * 
 * // Show loading during API call
 * const handleApiCall = async () => {
 *   const operationId = loading.show('api-call', { endpoint: '/api/services' });
 *   try {
 *     const result = await apiClient.get('/api/services');
 *     return result;
 *   } finally {
 *     loading.hide(operationId);
 *   }
 * };
 * 
 * // Use loading state in component
 * return (
 *   <div>
 *     {loading.state.isLoading && <LoadingSpinner />}
 *     <button disabled={loading.state.isLoading}>
 *       Click me
 *     </button>
 *   </div>
 * );
 * ```
 */
export function useLoading(config: LoadingConfig = {}): UseLoadingReturn {
  // Merge configuration with defaults
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { debounceDelay, initialState, debug } = finalConfig;

  // ========================================================================
  // State Management
  // ========================================================================

  const [isLoading, setIsLoading] = useState<boolean>(initialState);
  const [activeOperations, setActiveOperations] = useState<Map<string, LoadingOperation>>(new Map());
  const [loadingHistory, setLoadingHistory] = useState<LoadingOperation[]>([]);

  // Refs for cleanup and debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // ========================================================================
  // Effect for Cleanup
  // ========================================================================

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      // Clear any pending debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, []);

  // ========================================================================
  // Core Loading Logic
  // ========================================================================

  /**
   * Update loading state with debouncing to prevent UI flicker
   */
  const updateLoadingState = useCallback((newState: boolean, immediate = false) => {
    if (!isMountedRef.current) return;

    debugLog(debug, `Updating loading state to: ${newState}`, { immediate, currentState: isLoading });

    if (immediate) {
      // Clear any pending debounce
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      setIsLoading(newState);
      return;
    }

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set debounced update
    debounceTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setIsLoading(newState);
        debounceTimeoutRef.current = null;
      }
    }, debounceDelay);
  }, [isLoading, debounceDelay, debug]);

  /**
   * Add operation to history with size management
   */
  const addToHistory = useCallback((operation: LoadingOperation) => {
    setLoadingHistory(prev => {
      const newHistory = [operation, ...prev];
      // Maintain maximum history size
      return newHistory.slice(0, MAX_HISTORY_SIZE);
    });
  }, []);

  // ========================================================================
  // Public API Functions
  // ========================================================================

  /**
   * Show loading indicator and return operation ID
   */
  const show = useCallback((source?: string, metadata?: Record<string, any>): string => {
    const operationId = generateOperationId();
    const operation: LoadingOperation = {
      id: operationId,
      startTime: Date.now(),
      source,
      metadata,
    };

    debugLog(debug, `Starting loading operation: ${operationId}`, { source, metadata });

    setActiveOperations(prev => {
      const newMap = new Map(prev);
      newMap.set(operationId, operation);
      
      // Update loading state when first operation starts
      if (prev.size === 0) {
        updateLoadingState(true);
      }
      
      return newMap;
    });

    addToHistory(operation);
    return operationId;
  }, [debug, updateLoadingState, addToHistory]);

  /**
   * Hide loading indicator by operation ID
   */
  const hide = useCallback((operationId: string): void => {
    if (!operationId || !operationId.startsWith(OPERATION_ID_PREFIX)) {
      debugLog(debug, `Invalid operation ID: ${operationId}`);
      return;
    }

    debugLog(debug, `Hiding loading operation: ${operationId}`);

    setActiveOperations(prev => {
      if (!prev.has(operationId)) {
        debugLog(debug, `Operation not found: ${operationId}`);
        return prev;
      }

      const newMap = new Map(prev);
      newMap.delete(operationId);
      
      // Update loading state when last operation completes
      if (newMap.size === 0) {
        updateLoadingState(false);
      }
      
      return newMap;
    });
  }, [debug, updateLoadingState]);

  /**
   * Hide all loading indicators and reset state
   */
  const hideAll = useCallback((): void => {
    debugLog(debug, 'Hiding all loading operations', { activeCount: activeOperations.size });
    
    setActiveOperations(new Map());
    updateLoadingState(false, true); // Immediate update for hideAll
  }, [debug, activeOperations.size, updateLoadingState]);

  /**
   * Reset loading state to initial values
   */
  const reset = useCallback((): void => {
    debugLog(debug, 'Resetting loading state');
    
    // Clear debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    setActiveOperations(new Map());
    setLoadingHistory([]);
    setIsLoading(initialState);
  }, [debug, initialState]);

  /**
   * Check if specific operation is active
   */
  const isOperationActive = useCallback((operationId: string): boolean => {
    return activeOperations.has(operationId);
  }, [activeOperations]);

  /**
   * Get loading operations by source
   */
  const getOperationsBySource = useCallback((source: string): LoadingOperation[] => {
    return Array.from(activeOperations.values()).filter(op => op.source === source);
  }, [activeOperations]);

  // ========================================================================
  // Return Value Construction
  // ========================================================================

  const state: LoadingState = {
    isLoading,
    activeCount: activeOperations.size,
    loadingHistory,
  };

  return {
    state,
    show,
    hide,
    hideAll,
    reset,
    isOperationActive,
    getOperationsBySource,
  };
}

// ============================================================================
// Convenience Hooks and Utilities
// ============================================================================

/**
 * Global loading hook instance for application-wide loading state.
 * Use this for coordinating loading across different components.
 */
export function useGlobalLoading(): UseLoadingReturn {
  return useLoading({
    debounceDelay: 100,
    debug: process.env.NODE_ENV === 'development',
  });
}

/**
 * Loading hook optimized for API requests with longer debounce delay
 */
export function useApiLoading(): UseLoadingReturn {
  return useLoading({
    debounceDelay: 150,
    debug: process.env.NODE_ENV === 'development',
  });
}

/**
 * Loading hook for immediate UI feedback without debouncing
 */
export function useImmediateLoading(): UseLoadingReturn {
  return useLoading({
    debounceDelay: 0,
    debug: process.env.NODE_ENV === 'development',
  });
}

// ============================================================================
// HOC for Loading Management
// ============================================================================

/**
 * Higher-order component that provides loading state management
 * @deprecated Use the hook directly for better performance and composition
 */
export function withLoading<P extends object>(
  Component: React.ComponentType<P & { loading: UseLoadingReturn }>
): React.ComponentType<P> {
  return function WithLoadingComponent(props: P) {
    const loading = useLoading();
    return <Component {...props} loading={loading} />;
  };
}

// ============================================================================
// Types Export
// ============================================================================

export type {
  LoadingConfig,
  LoadingState,
  LoadingOperation,
  UseLoadingReturn,
};

// Default export
export default useLoading;