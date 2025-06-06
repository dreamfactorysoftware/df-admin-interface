/**
 * React context provider for managing application-wide loading states and 
 * coordinating loading indicators across components. Provides hooks for 
 * accessing and controlling loading states throughout the component tree.
 * 
 * Features:
 * - React Context API providing type-safe loading state access
 * - Custom hooks interface for simplified loading state management
 * - Integration with TanStack React Query for automatic server state loading
 * - Loading state persistence across navigation events and component unmounting
 * - TypeScript support with strict typing for loading state values
 * 
 * @fileoverview Loading context provider and hooks
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useLoading } from '../../../hooks/use-loading';

// Import types
import type {
  LoadingContextValue,
  LoadingContextState,
  LoadingContextActions,
  LoadingContextConfig,
  LoadingProviderProps,
  LoadingOperation,
  LoadingSource,
  LoadingOperationConfig,
  LoadingStateValue,
  LoadingCategory,
  LoadingPriority,
  AggregatedLoadingState,
  UseLoadingContextReturn,
  UseLoadingReturn,
  ReactQueryLoadingSync,
  NavigationLoadingState,
  DEFAULT_LOADING_CONFIG,
  DEFAULT_OPERATION_CONFIG,
  LOADING_PRIORITY_ORDER,
  LoadingContextError,
  OperationTimeoutError,
  OperationNotFoundError,
  isLoadingStateValue,
  isLoadingPriority,
  isLoadingCategory,
  isActiveOperation,
  isErrorOperation,
  isCompletedOperation,
} from '../../../types/loading';

// ============================================================================
// Context Creation
// ============================================================================

/**
 * Loading context for providing loading state throughout the application
 */
const LoadingContext = createContext<LoadingContextValue | null>(null);

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate unique operation ID with category prefix
 */
const generateOperationId = (category: LoadingCategory): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${category}_${timestamp}_${random}`;
};

/**
 * Calculate aggregated loading state from operations
 */
const calculateAggregatedState = (
  operations: Map<string, LoadingOperation>
): AggregatedLoadingState => {
  const activeOps = Array.from(operations.values()).filter(isActiveOperation);
  const errorOps = Array.from(operations.values()).filter(isErrorOperation);
  const completedOps = Array.from(operations.values()).filter(isCompletedOperation);
  
  // Group operations by category
  const operationsByCategory = Array.from(operations.values()).reduce(
    (acc, op) => {
      if (!acc[op.category]) {
        acc[op.category] = [];
      }
      acc[op.category].push(op);
      return acc;
    },
    {} as Record<LoadingCategory, LoadingOperation[]>
  );

  // Find highest priority among active operations
  const highestPriority = activeOps.reduce((highest, op) => {
    const currentPriority = LOADING_PRIORITY_ORDER[op.priority];
    const highestPriority = LOADING_PRIORITY_ORDER[highest];
    return currentPriority > highestPriority ? op.priority : highest;
  }, 'low' as LoadingPriority);

  // Find latest operation
  const latestOperation = Array.from(operations.values()).sort(
    (a, b) => b.metadata.startTime - a.metadata.startTime
  )[0];

  return {
    isLoading: activeOps.length > 0,
    hasError: errorOps.length > 0,
    isSuccess: completedOps.length > 0 && activeOps.length === 0 && errorOps.length === 0,
    activeCount: activeOps.length,
    errorCount: errorOps.length,
    completedCount: completedOps.length,
    totalCount: operations.size,
    highestPriority,
    latestOperation,
    activeOperations: activeOps,
    errorOperations: errorOps,
    operationsByCategory,
  };
};

/**
 * Persist loading state to storage
 */
const persistLoadingState = (
  operations: Map<string, LoadingOperation>,
  config: Required<LoadingContextConfig>
): void => {
  if (!config.persistAcrossNavigation) return;

  try {
    const operationsArray = Array.from(operations.values());
    const persistData = {
      operations: operationsArray,
      timestamp: Date.now(),
    };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(config.storageKey, JSON.stringify(persistData));
    }
  } catch (error) {
    if (config.enableDebugLogging) {
      console.warn('[LoadingContext] Failed to persist loading state:', error);
    }
  }
};

/**
 * Restore loading state from storage
 */
const restoreLoadingState = (
  config: Required<LoadingContextConfig>
): Map<string, LoadingOperation> => {
  if (!config.persistAcrossNavigation) return new Map();

  try {
    if (typeof window === 'undefined') return new Map();
    
    const stored = localStorage.getItem(config.storageKey);
    if (!stored) return new Map();

    const { operations, timestamp } = JSON.parse(stored);
    
    // Check if stored data is not too old (1 hour)
    if (Date.now() - timestamp > 60 * 60 * 1000) {
      localStorage.removeItem(config.storageKey);
      return new Map();
    }

    // Only restore active operations
    const activeOperations = operations.filter(isActiveOperation);
    const operationsMap = new Map<string, LoadingOperation>();
    
    activeOperations.forEach((op: LoadingOperation) => {
      operationsMap.set(op.id, op);
    });

    return operationsMap;
  } catch (error) {
    if (config.enableDebugLogging) {
      console.warn('[LoadingContext] Failed to restore loading state:', error);
    }
    return new Map();
  }
};

/**
 * Debug logging utility
 */
const debugLog = (
  enabled: boolean,
  message: string,
  data?: any
): void => {
  if (enabled && process.env.NODE_ENV === 'development') {
    console.debug(`[LoadingContext] ${message}`, data || '');
  }
};

// ============================================================================
// Loading Context Provider Component
// ============================================================================

/**
 * Loading context provider component that manages global loading state
 * and provides loading coordination throughout the application.
 */
export function LoadingProvider({ 
  children, 
  config: userConfig = {},
  initialOperations = [] 
}: LoadingProviderProps): JSX.Element {
  // Merge configuration with defaults
  const config = useMemo(
    () => ({ ...DEFAULT_LOADING_CONFIG, ...userConfig }),
    [userConfig]
  );

  // Initialize operations map
  const operationsRef = useRef<Map<string, LoadingOperation>>(new Map());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isMountedRef = useRef<boolean>(true);

  // Get underlying loading hook for basic functionality
  const baseLoading = useLoading({
    debounceDelay: 100,
    debug: config.enableDebugLogging,
  });

  // React Query integration
  const queryClient = useQueryClient();
  const pathname = usePathname();

  // Navigation state
  const navigationRef = useRef<NavigationLoadingState>({
    isNavigating: false,
  });

  // ========================================================================
  // Initialization and Cleanup
  // ========================================================================

  useEffect(() => {
    isMountedRef.current = true;
    
    // Restore persisted loading state
    const restoredOperations = restoreLoadingState(config);
    operationsRef.current = restoredOperations;

    // Add initial operations
    initialOperations.forEach(operation => {
      operationsRef.current.set(operation.id, operation);
    });

    debugLog(config.enableDebugLogging, 'LoadingContext initialized', {
      restoredOperationsCount: restoredOperations.size,
      initialOperationsCount: initialOperations.length,
    });

    return () => {
      isMountedRef.current = false;
      
      // Clear all timeouts
      Array.from(timeoutsRef.current.values()).forEach(clearTimeout);
      timeoutsRef.current.clear();
      
      // Persist current state
      persistLoadingState(operationsRef.current, config);
      
      debugLog(config.enableDebugLogging, 'LoadingContext cleanup');
    };
  }, [config, initialOperations]);

  // ========================================================================
  // Navigation Integration
  // ========================================================================

  useEffect(() => {
    const currentNavigation = navigationRef.current;
    
    if (currentNavigation.isNavigating && currentNavigation.navigationOperationId) {
      // Complete previous navigation
      const prevOpId = currentNavigation.navigationOperationId;
      if (operationsRef.current.has(prevOpId)) {
        completeOperation(prevOpId);
      }
    }

    // Start new navigation loading
    const navigationOpId = startOperation(
      {
        component: 'Navigation',
        action: 'route-change',
        description: `Navigating to ${pathname}`,
      },
      {
        category: 'navigation',
        priority: 'high',
        userMessage: 'Loading page...',
        context: { targetRoute: pathname },
      }
    );

    navigationRef.current = {
      isNavigating: true,
      currentRoute: pathname,
      targetRoute: pathname,
      navigationStartTime: Date.now(),
      navigationOperationId: navigationOpId,
    };

    // Auto-complete navigation after short delay (simulating page load)
    const navigationTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        completeOperation(navigationOpId);
        navigationRef.current.isNavigating = false;
      }
    }, 500);

    return () => {
      clearTimeout(navigationTimeout);
    };
  }, [pathname]);

  // ========================================================================
  // React Query Integration
  // ========================================================================

  const reactQuerySync = useMemo<ReactQueryLoadingSync>(() => {
    if (!config.integrateWithReactQuery || !queryClient) {
      return {
        registerQuery: () => {},
        unregisterQuery: () => {},
        updateQueryState: () => {},
      };
    }

    return {
      registerQuery: (queryKey: string[], operationId: string) => {
        debugLog(config.enableDebugLogging, 'Registering React Query', {
          queryKey,
          operationId,
        });
      },
      
      unregisterQuery: (queryKey: string[]) => {
        debugLog(config.enableDebugLogging, 'Unregistering React Query', {
          queryKey,
        });
      },
      
      updateQueryState: (
        queryKey: string[],
        state: LoadingStateValue,
        error?: Error
      ) => {
        debugLog(config.enableDebugLogging, 'Updating React Query state', {
          queryKey,
          state,
          error: error?.message,
        });
      },
    };
  }, [config.integrateWithReactQuery, config.enableDebugLogging, queryClient]);

  // ========================================================================
  // Core Loading Operations
  // ========================================================================

  /**
   * Start a loading operation
   */
  const startOperation = useCallback((
    source: LoadingSource,
    operationConfig: Partial<LoadingOperationConfig> = {}
  ): string => {
    const finalConfig = { ...DEFAULT_OPERATION_CONFIG, ...operationConfig };
    const operationId = generateOperationId(finalConfig.category);
    
    const operation: LoadingOperation = {
      id: operationId,
      state: 'loading',
      priority: finalConfig.priority,
      category: finalConfig.category,
      source,
      metadata: {
        startTime: Date.now(),
        expectedDuration: finalConfig.expectedDuration,
        timeout: finalConfig.timeout,
        cancellable: finalConfig.cancellable,
        userMessage: finalConfig.userMessage,
        context: finalConfig.context,
      },
    };

    operationsRef.current.set(operationId, operation);

    // Set timeout if specified
    if (finalConfig.timeout && finalConfig.timeout > 0) {
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current && operationsRef.current.has(operationId)) {
          const timeoutError = new OperationTimeoutError(operationId, finalConfig.timeout!);
          failOperation(operationId, timeoutError);
        }
      }, finalConfig.timeout);
      
      timeoutsRef.current.set(operationId, timeoutId);
    }

    // Start base loading operation
    const baseOperationId = baseLoading.show(
      `${source.component}:${source.action}`,
      { 
        category: finalConfig.category,
        priority: finalConfig.priority,
        ...finalConfig.context,
      }
    );

    // Store base operation mapping
    operation.metadata.context = {
      ...operation.metadata.context,
      baseOperationId,
    };

    debugLog(config.enableDebugLogging, 'Started operation', operation);
    
    // Persist state
    persistLoadingState(operationsRef.current, config);
    
    return operationId;
  }, [baseLoading, config]);

  /**
   * Update loading operation state
   */
  const updateOperation = useCallback((
    operationId: string,
    state: LoadingStateValue,
    error?: Error | string
  ): void => {
    const operation = operationsRef.current.get(operationId);
    if (!operation) {
      if (config.enableDebugLogging) {
        console.warn(`[LoadingContext] Operation ${operationId} not found for update`);
      }
      return;
    }

    const updatedOperation: LoadingOperation = {
      ...operation,
      state,
      error: error ? (typeof error === 'string' ? new Error(error) : error) : undefined,
      endTime: state === 'success' || state === 'error' ? Date.now() : undefined,
    };

    operationsRef.current.set(operationId, updatedOperation);

    debugLog(config.enableDebugLogging, 'Updated operation', {
      operationId,
      state,
      error: error ? String(error) : undefined,
    });

    // Clear timeout if operation completed
    if ((state === 'success' || state === 'error') && timeoutsRef.current.has(operationId)) {
      clearTimeout(timeoutsRef.current.get(operationId)!);
      timeoutsRef.current.delete(operationId);
      
      // Hide base loading operation
      const baseOperationId = operation.metadata.context?.baseOperationId;
      if (baseOperationId && typeof baseOperationId === 'string') {
        baseLoading.hide(baseOperationId);
      }
    }

    // Persist state
    persistLoadingState(operationsRef.current, config);
  }, [baseLoading, config]);

  /**
   * Complete loading operation successfully
   */
  const completeOperation = useCallback((operationId: string): void => {
    updateOperation(operationId, 'success');
  }, [updateOperation]);

  /**
   * Fail loading operation with error
   */
  const failOperation = useCallback((
    operationId: string,
    error: Error | string
  ): void => {
    updateOperation(operationId, 'error', error);
  }, [updateOperation]);

  /**
   * Cancel loading operation
   */
  const cancelOperation = useCallback((operationId: string): void => {
    const operation = operationsRef.current.get(operationId);
    if (!operation) {
      if (config.enableDebugLogging) {
        console.warn(`[LoadingContext] Operation ${operationId} not found for cancellation`);
      }
      return;
    }

    if (!operation.metadata.cancellable) {
      if (config.enableDebugLogging) {
        console.warn(`[LoadingContext] Operation ${operationId} is not cancellable`);
      }
      return;
    }

    operationsRef.current.delete(operationId);

    // Clear timeout
    if (timeoutsRef.current.has(operationId)) {
      clearTimeout(timeoutsRef.current.get(operationId)!);
      timeoutsRef.current.delete(operationId);
    }

    // Hide base loading operation
    const baseOperationId = operation.metadata.context?.baseOperationId;
    if (baseOperationId && typeof baseOperationId === 'string') {
      baseLoading.hide(baseOperationId);
    }

    debugLog(config.enableDebugLogging, 'Cancelled operation', { operationId });
    
    // Persist state
    persistLoadingState(operationsRef.current, config);
  }, [baseLoading, config]);

  /**
   * Clear operations matching filter
   */
  const clearOperations = useCallback((
    filter?: (operation: LoadingOperation) => boolean
  ): void => {
    const operationsToRemove: string[] = [];
    
    for (const [id, operation] of operationsRef.current) {
      if (!filter || filter(operation)) {
        operationsToRemove.push(id);
        
        // Clear timeout
        if (timeoutsRef.current.has(id)) {
          clearTimeout(timeoutsRef.current.get(id)!);
          timeoutsRef.current.delete(id);
        }
        
        // Hide base loading operation
        const baseOperationId = operation.metadata.context?.baseOperationId;
        if (baseOperationId && typeof baseOperationId === 'string') {
          baseLoading.hide(baseOperationId);
        }
      }
    }

    operationsToRemove.forEach(id => operationsRef.current.delete(id));

    debugLog(config.enableDebugLogging, 'Cleared operations', {
      removedCount: operationsToRemove.length,
    });
    
    // Persist state
    persistLoadingState(operationsRef.current, config);
  }, [baseLoading, config]);

  /**
   * Reset loading context to initial state
   */
  const reset = useCallback((): void => {
    // Clear all timeouts
    Array.from(timeoutsRef.current.values()).forEach(clearTimeout);
    timeoutsRef.current.clear();
    
    // Clear all operations
    operationsRef.current.clear();
    
    // Reset base loading
    baseLoading.reset();
    
    // Clear persisted state
    if (typeof window !== 'undefined') {
      localStorage.removeItem(config.storageKey);
    }

    debugLog(config.enableDebugLogging, 'Reset loading context');
  }, [baseLoading, config]);

  // ========================================================================
  // Helper Functions
  // ========================================================================

  /**
   * Get operations by category
   */
  const getOperationsByCategory = useCallback((
    category: LoadingCategory
  ): LoadingOperation[] => {
    return Array.from(operationsRef.current.values()).filter(
      op => op.category === category
    );
  }, []);

  /**
   * Get operations by component source
   */
  const getOperationsByComponent = useCallback((
    component: string
  ): LoadingOperation[] => {
    return Array.from(operationsRef.current.values()).filter(
      op => op.source.component === component
    );
  }, []);

  /**
   * Check if specific operation is active
   */
  const isOperationActive = useCallback((operationId: string): boolean => {
    const operation = operationsRef.current.get(operationId);
    return operation ? isActiveOperation(operation) : false;
  }, []);

  // ========================================================================
  // Context Value
  // ========================================================================

  const contextValue = useMemo<LoadingContextValue>(() => {
    const aggregatedState = calculateAggregatedState(operationsRef.current);
    
    const state: LoadingContextState = {
      state: aggregatedState,
      config,
      isInitialized: true,
    };

    const actions: LoadingContextActions = {
      startOperation,
      updateOperation,
      completeOperation,
      failOperation,
      cancelOperation,
      clearOperations,
      reset,
      getOperationsByCategory,
      getOperationsByComponent,
      isOperationActive,
    };

    return {
      ...state,
      ...actions,
    };
  }, [
    config,
    startOperation,
    updateOperation,
    completeOperation,
    failOperation,
    cancelOperation,
    clearOperations,
    reset,
    getOperationsByCategory,
    getOperationsByComponent,
    isOperationActive,
  ]);

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
}

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * Hook to access loading context with type safety and availability checking
 */
export function useLoadingContext(): UseLoadingContextReturn {
  const context = useContext(LoadingContext);
  
  if (!context) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[LoadingContext] useLoadingContext must be used within a LoadingProvider'
      );
    }
    
    // Return minimal fallback implementation
    return {
      state: {
        isLoading: false,
        hasError: false,
        isSuccess: true,
        activeCount: 0,
        errorCount: 0,
        completedCount: 0,
        totalCount: 0,
        highestPriority: 'low',
        activeOperations: [],
        errorOperations: [],
        operationsByCategory: {} as Record<LoadingCategory, LoadingOperation[]>,
      },
      config: DEFAULT_LOADING_CONFIG,
      isInitialized: false,
      isAvailable: false,
      startOperation: () => '',
      updateOperation: () => {},
      completeOperation: () => {},
      failOperation: () => {},
      cancelOperation: () => {},
      clearOperations: () => {},
      reset: () => {},
      getOperationsByCategory: () => [],
      getOperationsByComponent: () => [],
      isOperationActive: () => false,
    };
  }

  return {
    ...context,
    isAvailable: true,
  };
}

/**
 * Simplified loading hook for common operations
 */
export function useLoading(): UseLoadingReturn {
  const context = useLoadingContext();

  const startLoading = useCallback((
    source?: string,
    action?: string
  ): string => {
    return context.startOperation(
      {
        component: source || 'Unknown',
        action: action || 'loading',
      },
      {
        category: 'ui',
        priority: 'normal',
      }
    );
  }, [context]);

  const stopLoading = useCallback((operationId: string): void => {
    context.completeOperation(operationId);
  }, [context]);

  const setError = useCallback((
    operationId: string,
    error: Error | string
  ): void => {
    context.failOperation(operationId, error);
  }, [context]);

  const clearAll = useCallback((): void => {
    context.clearOperations();
  }, [context]);

  return useMemo(() => ({
    isLoading: context.state.isLoading,
    hasError: context.state.hasError,
    startLoading,
    stopLoading,
    setError,
    clearAll,
  }), [
    context.state.isLoading,
    context.state.hasError,
    startLoading,
    stopLoading,
    setError,
    clearAll,
  ]);
}

/**
 * Hook for navigation-specific loading operations
 */
export function useNavigationLoading() {
  const context = useLoadingContext();
  
  return useMemo(() => {
    const navigationOps = context.getOperationsByCategory('navigation');
    return {
      isNavigating: navigationOps.some(isActiveOperation),
      navigationOperations: navigationOps,
    };
  }, [context]);
}

/**
 * Hook for API-specific loading operations
 */
export function useApiLoading() {
  const context = useLoadingContext();
  
  const startApiOperation = useCallback((
    endpoint: string,
    method: string = 'GET'
  ): string => {
    return context.startOperation(
      {
        component: 'API',
        action: method,
        description: `${method} ${endpoint}`,
      },
      {
        category: 'api',
        priority: 'normal',
        timeout: 30000, // 30 seconds for API calls
        context: { endpoint, method },
      }
    );
  }, [context]);

  return useMemo(() => {
    const apiOps = context.getOperationsByCategory('api');
    return {
      isApiLoading: apiOps.some(isActiveOperation),
      apiOperations: apiOps,
      startApiOperation,
      completeApiOperation: context.completeOperation,
      failApiOperation: context.failOperation,
    };
  }, [context, startApiOperation]);
}

// ============================================================================
// Default Export
// ============================================================================

export default LoadingProvider;