'use client';

import React, { 
  createContext, 
  useContext, 
  useCallback, 
  useRef, 
  useEffect,
  useMemo,
  type ReactNode 
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

/**
 * Loading state configuration options
 */
interface LoadingOptions {
  /** Minimum delay before showing loading indicator (prevents flicker) */
  minDelay?: number;
  /** Maximum timeout for loading state */
  timeout?: number;
  /** Loading priority level for coordination */
  priority?: 'low' | 'normal' | 'high';
  /** Whether this loading state should be persisted across navigation */
  persist?: boolean;
  /** Unique identifier for the loading operation */
  id?: string;
}

/**
 * Individual loading operation state
 */
interface LoadingState {
  id: string;
  isLoading: boolean;
  startTime: number;
  options: LoadingOptions;
  promise?: Promise<any>;
}

/**
 * Aggregated loading states
 */
interface LoadingStates {
  /** Global loading indicator for application-wide operations */
  global: boolean;
  /** Navigation loading state for route transitions */
  navigation: boolean;
  /** Component-level loading states by unique identifier */
  components: Record<string, boolean>;
  /** Server state loading from React Query */
  server: boolean;
  /** Count of active loading operations */
  activeCount: number;
  /** High priority loading operations that should block UI */
  blocking: boolean;
}

/**
 * Loading context actions
 */
interface LoadingActions {
  /** Start a loading operation with optional configuration */
  startLoading: (options?: LoadingOptions) => string;
  /** Stop a specific loading operation by ID */
  stopLoading: (id: string) => void;
  /** Set global loading state */
  setGlobalLoading: (loading: boolean, options?: LoadingOptions) => void;
  /** Set navigation loading state */
  setNavigationLoading: (loading: boolean) => void;
  /** Set component-specific loading state */
  setComponentLoading: (componentId: string, loading: boolean, options?: LoadingOptions) => void;
  /** Clear all loading states */
  clearAllLoading: () => void;
  /** Get loading state for specific component */
  getComponentLoading: (componentId: string) => boolean;
  /** Check if any loading operation is active */
  hasAnyLoading: () => boolean;
  /** Get all active loading operations */
  getActiveOperations: () => LoadingState[];
}

/**
 * Loading context value combining state and actions
 */
interface LoadingContextValue {
  states: LoadingStates;
  actions: LoadingActions;
}

/**
 * Loading context provider props
 */
interface LoadingProviderProps {
  children: ReactNode;
  /** Default configuration for loading operations */
  defaultOptions?: LoadingOptions;
  /** Whether to integrate with React Query global loading states */
  enableQueryIntegration?: boolean;
  /** Whether to track navigation loading states */
  enableNavigationTracking?: boolean;
}

// Default loading options
const DEFAULT_LOADING_OPTIONS: LoadingOptions = {
  minDelay: 100,
  timeout: 30000,
  priority: 'normal',
  persist: false,
};

// Create the loading context
const LoadingContext = createContext<LoadingContextValue | null>(null);

/**
 * Hook to access loading context
 * @throws Error if used outside LoadingProvider
 */
export function useLoadingContext(): LoadingContextValue {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  return context;
}

/**
 * Simplified loading hook for common use cases
 */
export function useLoading() {
  const { states, actions } = useLoadingContext();

  const startLoading = useCallback((options?: LoadingOptions) => {
    return actions.startLoading(options);
  }, [actions]);

  const stopLoading = useCallback((id: string) => {
    actions.stopLoading(id);
  }, [actions]);

  const setLoading = useCallback((loading: boolean, options?: LoadingOptions) => {
    if (loading) {
      return actions.startLoading(options);
    } else {
      // For simplified API, we clear all non-persistent loading states
      actions.clearAllLoading();
      return '';
    }
  }, [actions]);

  return {
    isLoading: states.global || states.navigation || states.blocking,
    isGlobalLoading: states.global,
    isNavigationLoading: states.navigation,
    isServerLoading: states.server,
    activeCount: states.activeCount,
    startLoading,
    stopLoading,
    setLoading,
    hasAnyLoading: actions.hasAnyLoading,
  };
}

/**
 * Hook for component-specific loading states
 */
export function useComponentLoading(componentId: string) {
  const { states, actions } = useLoadingContext();

  const isLoading = states.components[componentId] || false;

  const setLoading = useCallback((loading: boolean, options?: LoadingOptions) => {
    actions.setComponentLoading(componentId, loading, options);
  }, [componentId, actions]);

  const getLoading = useCallback(() => {
    return actions.getComponentLoading(componentId);
  }, [componentId, actions]);

  return {
    isLoading,
    setLoading,
    getLoading,
  };
}

/**
 * React Loading Context Provider
 * 
 * Provides application-wide loading state management with support for:
 * - Multiple concurrent loading operations
 * - React Query integration for server state loading
 * - Navigation loading states
 * - Component-specific loading states
 * - Loading state persistence across route changes
 * - Debounced loading indicators to prevent flicker
 */
export function LoadingProvider({
  children,
  defaultOptions = DEFAULT_LOADING_OPTIONS,
  enableQueryIntegration = true,
  enableNavigationTracking = true,
}: LoadingProviderProps) {
  // Internal state for tracking all loading operations
  const operationsRef = useRef<Map<string, LoadingState>>(new Map());
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const counterRef = useRef(0);

  // React Query integration
  const queryClient = useQueryClient();
  const router = useRouter();

  // Generate unique ID for loading operations
  const generateId = useCallback(() => {
    return `loading_${Date.now()}_${++counterRef.current}`;
  }, []);

  // Force re-render when operations change
  const triggerUpdate = useCallback(() => {
    forceUpdate();
  }, []);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  // React Query loading state integration
  useEffect(() => {
    if (!enableQueryIntegration) return;

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated' && event.query.state.status === 'loading') {
        // Query started loading
        const queryId = `query_${event.query.queryHash}`;
        const operation: LoadingState = {
          id: queryId,
          isLoading: true,
          startTime: Date.now(),
          options: { ...defaultOptions, priority: 'low', id: queryId },
        };
        operationsRef.current.set(queryId, operation);
        triggerUpdate();
      } else if (event?.type === 'updated' && 
                 (event.query.state.status === 'success' || event.query.state.status === 'error')) {
        // Query finished
        const queryId = `query_${event.query.queryHash}`;
        operationsRef.current.delete(queryId);
        triggerUpdate();
      }
    });

    return unsubscribe;
  }, [enableQueryIntegration, queryClient, defaultOptions, triggerUpdate]);

  // Navigation loading integration
  useEffect(() => {
    if (!enableNavigationTracking) return;

    const handleRouteStart = () => {
      const navId = 'navigation';
      const operation: LoadingState = {
        id: navId,
        isLoading: true,
        startTime: Date.now(),
        options: { ...defaultOptions, priority: 'high', persist: true, id: navId },
      };
      operationsRef.current.set(navId, operation);
      triggerUpdate();
    };

    const handleRouteComplete = () => {
      operationsRef.current.delete('navigation');
      triggerUpdate();
    };

    // Listen for Next.js navigation events
    // Note: In Next.js 13+ App Router, we use browser events as router events are limited
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(...args) {
      handleRouteStart();
      originalPushState.apply(window.history, args);
      // Route completion is handled by useEffect cleanup or page load
      setTimeout(handleRouteComplete, 100);
    };

    window.history.replaceState = function(...args) {
      handleRouteStart();
      originalReplaceState.apply(window.history, args);
      setTimeout(handleRouteComplete, 100);
    };

    window.addEventListener('popstate', handleRouteStart);
    window.addEventListener('beforeunload', handleRouteComplete);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handleRouteStart);
      window.removeEventListener('beforeunload', handleRouteComplete);
    };
  }, [enableNavigationTracking, defaultOptions, triggerUpdate]);

  // Calculate aggregated loading states
  const states = useMemo<LoadingStates>(() => {
    const operations = Array.from(operationsRef.current.values());
    const activeOperations = operations.filter(op => op.isLoading);

    // Component-specific loading states
    const components: Record<string, boolean> = {};
    activeOperations.forEach(op => {
      if (op.id.startsWith('component_')) {
        const componentId = op.id.replace('component_', '');
        components[componentId] = true;
      }
    });

    return {
      global: activeOperations.some(op => 
        op.options.priority === 'high' && !op.id.startsWith('query_') && op.id !== 'navigation'
      ),
      navigation: activeOperations.some(op => op.id === 'navigation'),
      components,
      server: activeOperations.some(op => op.id.startsWith('query_')),
      activeCount: activeOperations.length,
      blocking: activeOperations.some(op => op.options.priority === 'high'),
    };
  }, [operationsRef.current.size, forceUpdate]); // Use size as dependency to trigger recalculation

  // Loading actions
  const actions = useMemo<LoadingActions>(() => ({
    startLoading: (options = {}) => {
      const mergedOptions = { ...defaultOptions, ...options };
      const id = mergedOptions.id || generateId();
      
      const operation: LoadingState = {
        id,
        isLoading: true,
        startTime: Date.now(),
        options: mergedOptions,
      };

      // Apply minimum delay if specified
      if (mergedOptions.minDelay && mergedOptions.minDelay > 0) {
        const timeoutId = setTimeout(() => {
          operationsRef.current.set(id, operation);
          timeoutRefs.current.delete(id);
          triggerUpdate();
        }, mergedOptions.minDelay);
        
        timeoutRefs.current.set(id, timeoutId);
      } else {
        operationsRef.current.set(id, operation);
        triggerUpdate();
      }

      // Set timeout if specified
      if (mergedOptions.timeout && mergedOptions.timeout > 0) {
        const timeoutId = setTimeout(() => {
          operationsRef.current.delete(id);
          timeoutRefs.current.delete(id);
          triggerUpdate();
        }, mergedOptions.timeout);
        
        timeoutRefs.current.set(`${id}_timeout`, timeoutId);
      }

      return id;
    },

    stopLoading: (id) => {
      // Clear any pending timeouts
      const timeoutId = timeoutRefs.current.get(id);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutRefs.current.delete(id);
      }

      const timeoutTimeoutId = timeoutRefs.current.get(`${id}_timeout`);
      if (timeoutTimeoutId) {
        clearTimeout(timeoutTimeoutId);
        timeoutRefs.current.delete(`${id}_timeout`);
      }

      operationsRef.current.delete(id);
      triggerUpdate();
    },

    setGlobalLoading: (loading, options = {}) => {
      const id = 'global';
      if (loading) {
        const mergedOptions = { ...defaultOptions, ...options, priority: 'high' as const, id };
        const operation: LoadingState = {
          id,
          isLoading: true,
          startTime: Date.now(),
          options: mergedOptions,
        };
        operationsRef.current.set(id, operation);
      } else {
        operationsRef.current.delete(id);
      }
      triggerUpdate();
    },

    setNavigationLoading: (loading) => {
      const id = 'navigation';
      if (loading) {
        const operation: LoadingState = {
          id,
          isLoading: true,
          startTime: Date.now(),
          options: { ...defaultOptions, priority: 'high', persist: true, id },
        };
        operationsRef.current.set(id, operation);
      } else {
        operationsRef.current.delete(id);
      }
      triggerUpdate();
    },

    setComponentLoading: (componentId, loading, options = {}) => {
      const id = `component_${componentId}`;
      if (loading) {
        const mergedOptions = { ...defaultOptions, ...options, id };
        const operation: LoadingState = {
          id,
          isLoading: true,
          startTime: Date.now(),
          options: mergedOptions,
        };
        operationsRef.current.set(id, operation);
      } else {
        operationsRef.current.delete(id);
      }
      triggerUpdate();
    },

    clearAllLoading: () => {
      // Only clear non-persistent operations
      const persistentIds = Array.from(operationsRef.current.values())
        .filter(op => op.options.persist)
        .map(op => op.id);
      
      operationsRef.current.clear();
      
      // Restore persistent operations
      persistentIds.forEach(id => {
        const operation: LoadingState = {
          id,
          isLoading: true,
          startTime: Date.now(),
          options: { ...defaultOptions, persist: true, id },
        };
        operationsRef.current.set(id, operation);
      });

      // Clear all timeouts
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current.clear();
      
      triggerUpdate();
    },

    getComponentLoading: (componentId) => {
      return operationsRef.current.has(`component_${componentId}`);
    },

    hasAnyLoading: () => {
      return operationsRef.current.size > 0;
    },

    getActiveOperations: () => {
      return Array.from(operationsRef.current.values()).filter(op => op.isLoading);
    },
  }), [defaultOptions, generateId, triggerUpdate]);

  const contextValue = useMemo<LoadingContextValue>(() => ({
    states,
    actions,
  }), [states, actions]);

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
}

/**
 * Higher-order component that provides loading context
 */
export function withLoading<P extends object>(
  Component: React.ComponentType<P>,
  options?: LoadingOptions
) {
  const WrappedComponent = (props: P) => {
    const { startLoading, stopLoading } = useLoading();

    // Auto-start loading when component mounts if configured
    React.useEffect(() => {
      if (options?.id) {
        const id = startLoading(options);
        return () => stopLoading(id);
      }
    }, [startLoading, stopLoading]);

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withLoading(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

/**
 * Hook for handling async operations with loading states
 */
export function useAsyncLoading<T>(
  asyncFn: () => Promise<T>,
  options?: LoadingOptions
) {
  const { startLoading, stopLoading } = useLoading();
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const execute = useCallback(async () => {
    const loadingId = startLoading(options);
    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      stopLoading(loadingId);
      setIsLoading(false);
    }
  }, [asyncFn, startLoading, stopLoading, options]);

  return {
    data,
    error,
    isLoading,
    execute,
  };
}

// Export types for external usage
export type {
  LoadingOptions,
  LoadingState,
  LoadingStates,
  LoadingActions,
  LoadingContextValue,
  LoadingProviderProps,
};