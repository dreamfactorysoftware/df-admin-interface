'use client';

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

/**
 * Loading Operation Interface
 * Represents a single loading operation that can be queued and managed
 */
export interface LoadingOperation {
  /** Unique identifier for the operation */
  id: string;
  /** Human-readable label for the operation */
  label: string;
  /** Optional description providing more context */
  description?: string;
  /** Operation priority (higher numbers = higher priority) */
  priority: number;
  /** Timestamp when operation was created */
  timestamp: number;
  /** Cancellation token for aborting the operation */
  cancelToken?: AbortController;
  /** Operation category for grouping */
  category: 'auth' | 'navigation' | 'data' | 'bulk' | 'system';
}

/**
 * Loading Store State Interface
 * Manages global loading state with queue support and cancellation
 */
interface LoadingStoreState {
  /** Queue of active loading operations */
  operations: LoadingOperation[];
  /** Whether global loading is currently active */
  isLoading: boolean;
  /** Current primary operation being displayed */
  currentOperation: LoadingOperation | null;
  /** Loading state history for debugging */
  history: Array<{
    operation: LoadingOperation;
    action: 'start' | 'complete' | 'cancel';
    timestamp: number;
  }>;
}

/**
 * Loading Store Actions Interface
 * Defines all actions for managing loading state
 */
interface LoadingStoreActions {
  /** Start a new loading operation */
  startLoading: (operation: Omit<LoadingOperation, 'id' | 'timestamp'>) => string;
  /** Complete a loading operation by ID */
  completeLoading: (operationId: string) => void;
  /** Cancel a loading operation by ID */
  cancelLoading: (operationId: string) => void;
  /** Cancel all loading operations */
  cancelAllLoading: () => void;
  /** Clear completed operations from history */
  clearHistory: () => void;
  /** Get operation by ID */
  getOperation: (operationId: string) => LoadingOperation | undefined;
  /** Check if specific category is loading */
  isCategoryLoading: (category: LoadingOperation['category']) => boolean;
}

type LoadingStore = LoadingStoreState & LoadingStoreActions;

/**
 * Generate unique operation ID
 */
const generateOperationId = (): string => {
  return `loading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Sort operations by priority (descending) and timestamp (ascending)
 */
const sortOperations = (operations: LoadingOperation[]): LoadingOperation[] => {
  return operations.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority; // Higher priority first
    }
    return a.timestamp - b.timestamp; // Earlier timestamp first for same priority
  });
};

/**
 * Zustand Loading Store
 * 
 * Provides centralized loading state management for the React application,
 * replacing Angular's loading interceptor patterns with a modern, queue-based
 * approach that supports multiple concurrent operations, cancellation tokens,
 * and priority-based operation management.
 * 
 * Features:
 * - Queue management for multiple concurrent loading operations
 * - Cancellation token support with AbortController integration
 * - Priority-based operation ordering
 * - Operation categorization for better UX
 * - History tracking for debugging and analytics
 * - Integration with authentication flows and navigation states
 * 
 * @example
 * // Start a loading operation
 * const operationId = startLoading({
 *   label: 'Connecting to database',
 *   description: 'Validating connection parameters...',
 *   priority: 10,
 *   category: 'data',
 *   cancelToken: new AbortController()
 * });
 * 
 * // Complete the operation
 * completeLoading(operationId);
 * 
 * // Or cancel it
 * cancelLoading(operationId);
 */
export const useLoadingStore = create<LoadingStore>()(
  devtools(
    subscribeWithSelector(
      (set, get) => ({
        // Initial state
        operations: [],
        isLoading: false,
        currentOperation: null,
        history: [],

        // Actions
        startLoading: (operation) => {
          const operationId = generateOperationId();
          const timestamp = Date.now();
          
          const newOperation: LoadingOperation = {
            id: operationId,
            timestamp,
            ...operation,
          };

          set((state) => {
            const newOperations = [...state.operations, newOperation];
            const sortedOperations = sortOperations(newOperations);
            
            return {
              operations: sortedOperations,
              isLoading: true,
              currentOperation: sortedOperations[0], // Highest priority operation
              history: [
                ...state.history,
                {
                  operation: newOperation,
                  action: 'start',
                  timestamp,
                },
              ].slice(-50), // Keep last 50 history entries
            };
          });

          return operationId;
        },

        completeLoading: (operationId) => {
          const state = get();
          const operation = state.operations.find(op => op.id === operationId);
          
          if (!operation) {
            console.warn(`Loading operation ${operationId} not found`);
            return;
          }

          set((state) => {
            const remainingOperations = state.operations.filter(op => op.id !== operationId);
            const sortedOperations = sortOperations(remainingOperations);
            
            return {
              operations: sortedOperations,
              isLoading: sortedOperations.length > 0,
              currentOperation: sortedOperations[0] || null,
              history: [
                ...state.history,
                {
                  operation,
                  action: 'complete',
                  timestamp: Date.now(),
                },
              ].slice(-50),
            };
          });
        },

        cancelLoading: (operationId) => {
          const state = get();
          const operation = state.operations.find(op => op.id === operationId);
          
          if (!operation) {
            console.warn(`Loading operation ${operationId} not found`);
            return;
          }

          // Trigger cancellation token if available
          if (operation.cancelToken && !operation.cancelToken.signal.aborted) {
            operation.cancelToken.abort();
          }

          set((state) => {
            const remainingOperations = state.operations.filter(op => op.id !== operationId);
            const sortedOperations = sortOperations(remainingOperations);
            
            return {
              operations: sortedOperations,
              isLoading: sortedOperations.length > 0,
              currentOperation: sortedOperations[0] || null,
              history: [
                ...state.history,
                {
                  operation,
                  action: 'cancel',
                  timestamp: Date.now(),
                },
              ].slice(-50),
            };
          });
        },

        cancelAllLoading: () => {
          const state = get();
          
          // Cancel all operations with cancel tokens
          state.operations.forEach(operation => {
            if (operation.cancelToken && !operation.cancelToken.signal.aborted) {
              operation.cancelToken.abort();
            }
          });

          set((state) => ({
            operations: [],
            isLoading: false,
            currentOperation: null,
            history: [
              ...state.history,
              ...state.operations.map(operation => ({
                operation,
                action: 'cancel' as const,
                timestamp: Date.now(),
              })),
            ].slice(-50),
          }));
        },

        clearHistory: () => {
          set((state) => ({
            ...state,
            history: [],
          }));
        },

        getOperation: (operationId) => {
          return get().operations.find(op => op.id === operationId);
        },

        isCategoryLoading: (category) => {
          return get().operations.some(op => op.category === category);
        },
      }),
      {
        name: 'loading-store',
        enabled: process.env.NODE_ENV === 'development',
      }
    ),
    {
      name: 'Loading Store',
    }
  )
);

/**
 * Selector hooks for common loading state queries
 */

/** Check if any loading operation is active */
export const useIsLoading = () => useLoadingStore(state => state.isLoading);

/** Get current primary loading operation */
export const useCurrentOperation = () => useLoadingStore(state => state.currentOperation);

/** Get all active operations */
export const useActiveOperations = () => useLoadingStore(state => state.operations);

/** Check if authentication operations are loading */
export const useIsAuthLoading = () => useLoadingStore(state => state.isCategoryLoading('auth'));

/** Check if navigation operations are loading */
export const useIsNavigationLoading = () => useLoadingStore(state => state.isCategoryLoading('navigation'));

/** Check if data operations are loading */
export const useIsDataLoading = () => useLoadingStore(state => state.isCategoryLoading('data'));

/** Check if bulk operations are loading */
export const useIsBulkLoading = () => useLoadingStore(state => state.isCategoryLoading('bulk'));

/** Check if system operations are loading */
export const useIsSystemLoading = () => useLoadingStore(state => state.isCategoryLoading('system'));

/**
 * Loading store actions hook
 */
export const useLoadingActions = () => useLoadingStore(state => ({
  startLoading: state.startLoading,
  completeLoading: state.completeLoading,
  cancelLoading: state.cancelLoading,
  cancelAllLoading: state.cancelAllLoading,
  clearHistory: state.clearHistory,
  getOperation: state.getOperation,
  isCategoryLoading: state.isCategoryLoading,
}));

// Export types for external usage
export type { LoadingStore, LoadingStoreState, LoadingStoreActions };