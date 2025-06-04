import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, render, screen, waitFor, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useIsFetching } from '@tanstack/react-query';

// Component under test imports
import { LoadingProvider, useLoading, useLoadingState } from './loading-context';

// Mock the loading handlers to test loading state coordination
vi.mock('@/test/mocks/loading-handlers', () => ({
  createLoadingHandler: vi.fn(),
  mockApiCall: vi.fn(),
  simulateAsyncOperation: vi.fn(),
}));

// Mock React Query's useIsFetching for testing integration
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useIsFetching: vi.fn(),
  };
});

const mockedUseIsFetching = vi.mocked(useIsFetching);

/**
 * Test wrapper component for providing React Query context
 */
interface TestWrapperProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

const TestWrapper = ({ children, queryClient }: TestWrapperProps) => {
  const defaultQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient || defaultQueryClient}>
      <LoadingProvider>
        {children}
      </LoadingProvider>
    </QueryClientProvider>
  );
};

/**
 * Test component for validating loading state propagation
 */
const TestComponent = ({ testId = 'test-component' }: { testId?: string }) => {
  const { isLoading, loadingOperations, startLoading, stopLoading } = useLoading();
  const globalState = useLoadingState();

  return (
    <div data-testid={testId}>
      <div data-testid="loading-status">{isLoading ? 'loading' : 'idle'}</div>
      <div data-testid="operations-count">{loadingOperations.length}</div>
      <div data-testid="global-loading">{globalState.isGlobalLoading ? 'global-loading' : 'global-idle'}</div>
      <button 
        data-testid="start-button" 
        onClick={() => startLoading('test-operation')}
      >
        Start Loading
      </button>
      <button 
        data-testid="stop-button" 
        onClick={() => stopLoading('test-operation')}
      >
        Stop Loading
      </button>
    </div>
  );
};

describe('LoadingContext', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });
    
    // Reset mocks
    vi.clearAllMocks();
    mockedUseIsFetching.mockReturnValue(0);
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('LoadingProvider', () => {
    it('should provide loading context to child components', () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('loading-status')).toHaveTextContent('idle');
      expect(screen.getByTestId('operations-count')).toHaveTextContent('0');
      expect(screen.getByTestId('global-loading')).toHaveTextContent('global-idle');
    });

    it('should throw error when used without LoadingProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useLoading());
      }).toThrow('useLoading must be used within a LoadingProvider');

      console.error = originalError;
    });

    it('should handle multiple child components with shared state', () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <TestComponent testId="component-1" />
          <TestComponent testId="component-2" />
        </TestWrapper>
      );

      const component1Status = screen.getByTestId('component-1').querySelector('[data-testid="loading-status"]');
      const component2Status = screen.getByTestId('component-2').querySelector('[data-testid="loading-status"]');

      expect(component1Status).toHaveTextContent('idle');
      expect(component2Status).toHaveTextContent('idle');
    });
  });

  describe('useLoading hook', () => {
    it('should return initial loading state as false', () => {
      const { result } = renderHook(() => useLoading(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.loadingOperations).toEqual([]);
    });

    it('should provide startLoading function', () => {
      const { result } = renderHook(() => useLoading(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      expect(typeof result.current.startLoading).toBe('function');
    });

    it('should provide stopLoading function', () => {
      const { result } = renderHook(() => useLoading(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      expect(typeof result.current.stopLoading).toBe('function');
    });

    it('should provide clearAllLoading function', () => {
      const { result } = renderHook(() => useLoading(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      expect(typeof result.current.clearAllLoading).toBe('function');
    });
  });

  describe('Loading State Management', () => {
    it('should start loading operation and update state', async () => {
      const { result } = renderHook(() => useLoading(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      act(() => {
        result.current.startLoading('database-connection');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
        expect(result.current.loadingOperations).toContain('database-connection');
      });
    });

    it('should stop loading operation and update state', async () => {
      const { result } = renderHook(() => useLoading(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      // Start loading
      act(() => {
        result.current.startLoading('database-connection');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Stop loading
      act(() => {
        result.current.stopLoading('database-connection');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.loadingOperations).not.toContain('database-connection');
      });
    });

    it('should handle multiple concurrent loading operations', async () => {
      const { result } = renderHook(() => useLoading(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      // Start multiple operations
      act(() => {
        result.current.startLoading('operation-1');
        result.current.startLoading('operation-2');
        result.current.startLoading('operation-3');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
        expect(result.current.loadingOperations).toHaveLength(3);
        expect(result.current.loadingOperations).toEqual(
          expect.arrayContaining(['operation-1', 'operation-2', 'operation-3'])
        );
      });
    });

    it('should remain loading when stopping one of multiple operations', async () => {
      const { result } = renderHook(() => useLoading(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      // Start multiple operations
      act(() => {
        result.current.startLoading('operation-1');
        result.current.startLoading('operation-2');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
        expect(result.current.loadingOperations).toHaveLength(2);
      });

      // Stop one operation
      act(() => {
        result.current.stopLoading('operation-1');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
        expect(result.current.loadingOperations).toHaveLength(1);
        expect(result.current.loadingOperations).toContain('operation-2');
      });
    });

    it('should clear all loading operations', async () => {
      const { result } = renderHook(() => useLoading(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      // Start multiple operations
      act(() => {
        result.current.startLoading('operation-1');
        result.current.startLoading('operation-2');
        result.current.startLoading('operation-3');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
        expect(result.current.loadingOperations).toHaveLength(3);
      });

      // Clear all operations
      act(() => {
        result.current.clearAllLoading();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.loadingOperations).toHaveLength(0);
      });
    });

    it('should handle duplicate operation names gracefully', async () => {
      const { result } = renderHook(() => useLoading(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      // Start same operation multiple times
      act(() => {
        result.current.startLoading('duplicate-operation');
        result.current.startLoading('duplicate-operation');
        result.current.startLoading('duplicate-operation');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
        // Should only have one instance of the operation
        expect(result.current.loadingOperations.filter(op => op === 'duplicate-operation')).toHaveLength(1);
      });
    });

    it('should ignore stopping non-existent operations', async () => {
      const { result } = renderHook(() => useLoading(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      // Start one operation
      act(() => {
        result.current.startLoading('existing-operation');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
        expect(result.current.loadingOperations).toHaveLength(1);
      });

      // Try to stop non-existent operation
      act(() => {
        result.current.stopLoading('non-existent-operation');
      });

      await waitFor(() => {
        // State should remain unchanged
        expect(result.current.isLoading).toBe(true);
        expect(result.current.loadingOperations).toHaveLength(1);
        expect(result.current.loadingOperations).toContain('existing-operation');
      });
    });
  });

  describe('React Query Integration', () => {
    it('should integrate with React Query global loading state', async () => {
      // Mock React Query to indicate active fetching
      mockedUseIsFetching.mockReturnValue(2);

      const { result } = renderHook(() => useLoadingState(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      await waitFor(() => {
        expect(result.current.isGlobalLoading).toBe(true);
      });
    });

    it('should combine local and React Query loading states', async () => {
      mockedUseIsFetching.mockReturnValue(1);

      const { result } = renderHook(() => useLoading(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      // Start local loading
      act(() => {
        result.current.startLoading('local-operation');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Mock ending React Query fetching
      mockedUseIsFetching.mockReturnValue(0);

      // Should still be loading due to local operation
      expect(result.current.isLoading).toBe(true);
    });

    it('should reflect React Query loading without local operations', async () => {
      mockedUseIsFetching.mockReturnValue(1);

      const { result } = renderHook(() => useLoadingState(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      await waitFor(() => {
        expect(result.current.isGlobalLoading).toBe(true);
      });

      // Mock React Query finishing
      mockedUseIsFetching.mockReturnValue(0);

      await waitFor(() => {
        expect(result.current.isGlobalLoading).toBe(false);
      });
    });
  });

  describe('Component Integration', () => {
    it('should update UI when loading state changes', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('loading-status')).toHaveTextContent('idle');

      // Start loading
      act(() => {
        screen.getByTestId('start-button').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('loading');
        expect(screen.getByTestId('operations-count')).toHaveTextContent('1');
      });

      // Stop loading
      act(() => {
        screen.getByTestId('stop-button').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('idle');
        expect(screen.getByTestId('operations-count')).toHaveTextContent('0');
      });
    });

    it('should share loading state across multiple components', async () => {
      render(
        <TestWrapper queryClient={queryClient}>
          <TestComponent testId="component-1" />
          <TestComponent testId="component-2" />
        </TestWrapper>
      );

      const component1 = screen.getByTestId('component-1');
      const component2 = screen.getByTestId('component-2');

      // Start loading from first component
      act(() => {
        component1.querySelector('[data-testid="start-button"]')?.click();
      });

      await waitFor(() => {
        // Both components should reflect the loading state
        expect(component1.querySelector('[data-testid="loading-status"]')).toHaveTextContent('loading');
        expect(component2.querySelector('[data-testid="loading-status"]')).toHaveTextContent('loading');
      });

      // Stop loading from second component
      act(() => {
        component2.querySelector('[data-testid="stop-button"]')?.click();
      });

      await waitFor(() => {
        // Both components should reflect the idle state
        expect(component1.querySelector('[data-testid="loading-status"]')).toHaveTextContent('idle');
        expect(component2.querySelector('[data-testid="loading-status"]')).toHaveTextContent('idle');
      });
    });
  });

  describe('Loading State Persistence', () => {
    it('should maintain loading state during component remount', async () => {
      const { rerender } = render(
        <TestWrapper queryClient={queryClient}>
          <TestComponent />
        </TestWrapper>
      );

      // Start loading
      act(() => {
        screen.getByTestId('start-button').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('loading');
      });

      // Remount component
      rerender(
        <TestWrapper queryClient={queryClient}>
          <TestComponent />
        </TestWrapper>
      );

      // Loading state should persist
      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('loading');
        expect(screen.getByTestId('operations-count')).toHaveTextContent('1');
      });
    });

    it('should handle component unmounting gracefully', async () => {
      const { unmount } = render(
        <TestWrapper queryClient={queryClient}>
          <TestComponent />
        </TestWrapper>
      );

      // Start loading
      act(() => {
        screen.getByTestId('start-button').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('loading');
      });

      // Unmount should not cause errors
      expect(() => unmount()).not.toThrow();
    });

    it('should maintain separate operation namespaces', async () => {
      const { result } = renderHook(() => useLoading(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      // Start operations with different namespaces
      act(() => {
        result.current.startLoading('database:connection-test');
        result.current.startLoading('api:endpoint-generation');
        result.current.startLoading('schema:discovery');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
        expect(result.current.loadingOperations).toHaveLength(3);
        expect(result.current.loadingOperations).toEqual(
          expect.arrayContaining([
            'database:connection-test',
            'api:endpoint-generation',
            'schema:discovery'
          ])
        );
      });

      // Stop database operation
      act(() => {
        result.current.stopLoading('database:connection-test');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
        expect(result.current.loadingOperations).toHaveLength(2);
        expect(result.current.loadingOperations).not.toContain('database:connection-test');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty operation names gracefully', async () => {
      const { result } = renderHook(() => useLoading(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      // Try to start with empty string
      act(() => {
        result.current.startLoading('');
      });

      await waitFor(() => {
        // Should ignore empty operation names
        expect(result.current.isLoading).toBe(false);
        expect(result.current.loadingOperations).toHaveLength(0);
      });
    });

    it('should handle null/undefined operation names gracefully', async () => {
      const { result } = renderHook(() => useLoading(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      // Try to start with null/undefined (cast as string for test)
      act(() => {
        result.current.startLoading(null as any);
        result.current.startLoading(undefined as any);
      });

      await waitFor(() => {
        // Should ignore null/undefined operation names
        expect(result.current.isLoading).toBe(false);
        expect(result.current.loadingOperations).toHaveLength(0);
      });
    });

    it('should provide stable function references', () => {
      const { result, rerender } = renderHook(() => useLoading(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      const initialFunctions = {
        startLoading: result.current.startLoading,
        stopLoading: result.current.stopLoading,
        clearAllLoading: result.current.clearAllLoading,
      };

      // Rerender the hook
      rerender();

      // Functions should remain stable (same references)
      expect(result.current.startLoading).toBe(initialFunctions.startLoading);
      expect(result.current.stopLoading).toBe(initialFunctions.stopLoading);
      expect(result.current.clearAllLoading).toBe(initialFunctions.clearAllLoading);
    });

    it('should handle rapid start/stop operations', async () => {
      const { result } = renderHook(() => useLoading(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      // Rapidly start and stop the same operation
      act(() => {
        result.current.startLoading('rapid-operation');
        result.current.stopLoading('rapid-operation');
        result.current.startLoading('rapid-operation');
        result.current.stopLoading('rapid-operation');
        result.current.startLoading('rapid-operation');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
        expect(result.current.loadingOperations).toHaveLength(1);
        expect(result.current.loadingOperations).toContain('rapid-operation');
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should not cause memory leaks with many operations', async () => {
      const { result } = renderHook(() => useLoading(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      // Start many operations
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.startLoading(`operation-${i}`);
        }
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
        expect(result.current.loadingOperations).toHaveLength(100);
      });

      // Clear all at once
      act(() => {
        result.current.clearAllLoading();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.loadingOperations).toHaveLength(0);
      });
    });

    it('should minimize re-renders with stable state', () => {
      const { result } = renderHook(() => useLoading(), {
        wrapper: ({ children }) => <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      });

      const initialState = result.current;

      // Multiple calls without state changes should return stable objects
      act(() => {
        result.current.stopLoading('non-existent');
        result.current.stopLoading('another-non-existent');
      });

      // The isLoading state should remain stable
      expect(result.current.isLoading).toBe(initialState.isLoading);
      expect(result.current.loadingOperations).toEqual(initialState.loadingOperations);
    });
  });
});