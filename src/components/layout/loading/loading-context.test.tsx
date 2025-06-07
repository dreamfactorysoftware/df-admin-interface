import React, { act } from 'react';
import { render, screen, waitFor, renderHook } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';

import {
  LoadingProvider,
  useLoadingContext,
  useLoading,
  useComponentLoading,
  useAsyncLoading,
  withLoading,
  LoadingOptions,
  LoadingContextValue,
} from './loading-context';

// Mock Next.js router for navigation testing
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    refresh: mockRefresh,
    prefetch: vi.fn(),
  }),
}));

// Helper function to create a test wrapper with providers
function createTestWrapper({
  defaultOptions,
  enableQueryIntegration = true,
  enableNavigationTracking = true,
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
}: {
  defaultOptions?: LoadingOptions;
  enableQueryIntegration?: boolean;
  enableNavigationTracking?: boolean;
  queryClient?: QueryClient;
} = {}) {
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <LoadingProvider
          defaultOptions={defaultOptions}
          enableQueryIntegration={enableQueryIntegration}
          enableNavigationTracking={enableNavigationTracking}
        >
          {children}
        </LoadingProvider>
      </QueryClientProvider>
    );
  };
}

// Mock component for testing loading context integration
function TestComponent({
  componentId = 'test-component',
  shouldStartLoading = false,
  loadingOptions,
}: {
  componentId?: string;
  shouldStartLoading?: boolean;
  loadingOptions?: LoadingOptions;
}) {
  const { states, actions } = useLoadingContext();
  const { isLoading, setLoading } = useComponentLoading(componentId);

  React.useEffect(() => {
    if (shouldStartLoading) {
      setLoading(true, loadingOptions);
    }
  }, [shouldStartLoading, setLoading, loadingOptions]);

  return (
    <div data-testid="test-component">
      <div data-testid="global-loading">Global: {states.global.toString()}</div>
      <div data-testid="navigation-loading">Navigation: {states.navigation.toString()}</div>
      <div data-testid="server-loading">Server: {states.server.toString()}</div>
      <div data-testid="component-loading">Component: {isLoading.toString()}</div>
      <div data-testid="active-count">Active: {states.activeCount}</div>
      <div data-testid="blocking">Blocking: {states.blocking.toString()}</div>
      <button
        data-testid="start-loading"
        onClick={() => actions.startLoading(loadingOptions)}
      >
        Start Loading
      </button>
      <button
        data-testid="stop-all-loading"
        onClick={() => actions.clearAllLoading()}
      >
        Stop All Loading
      </button>
      <button
        data-testid="set-global-loading"
        onClick={() => actions.setGlobalLoading(true)}
      >
        Set Global Loading
      </button>
      <button
        data-testid="set-navigation-loading"
        onClick={() => actions.setNavigationLoading(true)}
      >
        Set Navigation Loading
      </button>
    </div>
  );
}

// Component to test React Query integration
function QueryTestComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['test-query'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { id: 1, name: 'Test Data' };
    },
  });

  return (
    <div data-testid="query-component">
      <div data-testid="query-loading">Query Loading: {isLoading.toString()}</div>
      <div data-testid="query-data">{data ? JSON.stringify(data) : 'No Data'}</div>
    </div>
  );
}

// Component to test async loading hook
function AsyncTestComponent() {
  const asyncFn = React.useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return 'async result';
  }, []);

  const { data, error, isLoading, execute } = useAsyncLoading(asyncFn);

  return (
    <div data-testid="async-component">
      <div data-testid="async-loading">Async Loading: {isLoading.toString()}</div>
      <div data-testid="async-data">Data: {data || 'none'}</div>
      <div data-testid="async-error">Error: {error?.message || 'none'}</div>
      <button data-testid="execute-async" onClick={execute}>
        Execute Async
      </button>
    </div>
  );
}

describe('LoadingContext', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    user = userEvent.setup();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock timers for testing delays and timeouts
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    queryClient.clear();
  });

  describe('LoadingProvider', () => {
    it('should provide loading context to child components', () => {
      const TestChild = () => {
        const context = useLoadingContext();
        expect(context).toBeDefined();
        expect(context.states).toBeDefined();
        expect(context.actions).toBeDefined();
        return <div>Test</div>;
      };

      render(
        <TestChild />,
        { wrapper: createTestWrapper() }
      );
    });

    it('should throw error when used outside provider', () => {
      const TestChild = () => {
        useLoadingContext();
        return <div>Test</div>;
      };

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => render(<TestChild />)).toThrow(
        'useLoadingContext must be used within a LoadingProvider'
      );
      
      consoleSpy.mockRestore();
    });

    it('should initialize with default state values', () => {
      render(<TestComponent />, { wrapper: createTestWrapper() });

      expect(screen.getByTestId('global-loading')).toHaveTextContent('Global: false');
      expect(screen.getByTestId('navigation-loading')).toHaveTextContent('Navigation: false');
      expect(screen.getByTestId('server-loading')).toHaveTextContent('Server: false');
      expect(screen.getByTestId('component-loading')).toHaveTextContent('Component: false');
      expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 0');
      expect(screen.getByTestId('blocking')).toHaveTextContent('Blocking: false');
    });

    it('should apply custom default options', () => {
      const defaultOptions: LoadingOptions = {
        minDelay: 200,
        timeout: 5000,
        priority: 'high',
      };

      render(<TestComponent />, { 
        wrapper: createTestWrapper({ defaultOptions }) 
      });

      // Start a loading operation and verify it uses default options
      act(() => {
        user.click(screen.getByTestId('start-loading'));
      });

      // Since priority is high, it should set blocking to true
      expect(screen.getByTestId('blocking')).toHaveTextContent('Blocking: true');
    });
  });

  describe('Loading State Management', () => {
    it('should manage global loading state', async () => {
      render(<TestComponent />, { wrapper: createTestWrapper() });

      // Start global loading
      await user.click(screen.getByTestId('set-global-loading'));

      expect(screen.getByTestId('global-loading')).toHaveTextContent('Global: true');
      expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 1');
      expect(screen.getByTestId('blocking')).toHaveTextContent('Blocking: true');
    });

    it('should manage navigation loading state', async () => {
      render(<TestComponent />, { wrapper: createTestWrapper() });

      // Start navigation loading
      await user.click(screen.getByTestId('set-navigation-loading'));

      expect(screen.getByTestId('navigation-loading')).toHaveTextContent('Navigation: true');
      expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 1');
      expect(screen.getByTestId('blocking')).toHaveTextContent('Blocking: true');
    });

    it('should manage component-specific loading state', () => {
      render(
        <TestComponent shouldStartLoading componentId="test-comp" />, 
        { wrapper: createTestWrapper() }
      );

      expect(screen.getByTestId('component-loading')).toHaveTextContent('Component: true');
      expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 1');
    });

    it('should handle multiple concurrent loading operations', async () => {
      render(<TestComponent />, { wrapper: createTestWrapper() });

      // Start multiple loading operations
      await user.click(screen.getByTestId('set-global-loading'));
      await user.click(screen.getByTestId('set-navigation-loading'));
      await user.click(screen.getByTestId('start-loading'));

      expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 3');
      expect(screen.getByTestId('blocking')).toHaveTextContent('Blocking: true');
    });

    it('should clear all non-persistent loading states', async () => {
      render(<TestComponent />, { wrapper: createTestWrapper() });

      // Start multiple loading operations
      await user.click(screen.getByTestId('set-global-loading'));
      await user.click(screen.getByTestId('start-loading'));

      expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 2');

      // Clear all loading
      await user.click(screen.getByTestId('stop-all-loading'));

      expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 0');
      expect(screen.getByTestId('global-loading')).toHaveTextContent('Global: false');
    });
  });

  describe('Loading Options and Features', () => {
    it('should handle minimum delay for loading operations', async () => {
      const TestDelayComponent = () => {
        const { startLoading } = useLoading();
        const [operationId, setOperationId] = React.useState<string>('');

        const startDelayedLoading = () => {
          const id = startLoading({ minDelay: 100 });
          setOperationId(id);
        };

        return (
          <div>
            <button data-testid="start-delayed" onClick={startDelayedLoading}>
              Start Delayed
            </button>
            <div data-testid="operation-id">{operationId}</div>
          </div>
        );
      };

      render(<TestDelayComponent />, { wrapper: createTestWrapper() });
      render(<TestComponent />, { wrapper: createTestWrapper() });

      // Start delayed loading
      await user.click(screen.getByTestId('start-delayed'));

      // Initially should not be loading due to minimum delay
      expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 0');

      // Advance timers past the minimum delay
      act(() => {
        vi.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 1');
      });
    });

    it('should handle timeout for loading operations', async () => {
      render(<TestComponent />, { wrapper: createTestWrapper() });

      // Start loading operation with timeout
      const loadingOptions: LoadingOptions = { timeout: 200 };
      render(
        <TestComponent shouldStartLoading loadingOptions={loadingOptions} />, 
        { wrapper: createTestWrapper() }
      );

      // Should initially be loading
      expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 1');

      // Advance past timeout
      act(() => {
        vi.advanceTimersByTime(250);
      });

      await waitFor(() => {
        expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 0');
      });
    });

    it('should handle persistent loading operations', async () => {
      const persistentOptions: LoadingOptions = { persist: true };
      
      render(
        <TestComponent shouldStartLoading loadingOptions={persistentOptions} />, 
        { wrapper: createTestWrapper() }
      );

      // Should be loading
      expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 1');

      // Clear all loading - persistent should remain
      await user.click(screen.getByTestId('stop-all-loading'));

      // Persistent loading should still be active
      expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 1');
    });

    it('should handle loading priority levels', () => {
      const highPriorityOptions: LoadingOptions = { priority: 'high' };
      const lowPriorityOptions: LoadingOptions = { priority: 'low' };

      // Test high priority loading (should be blocking)
      render(
        <TestComponent shouldStartLoading loadingOptions={highPriorityOptions} />, 
        { wrapper: createTestWrapper() }
      );
      expect(screen.getByTestId('blocking')).toHaveTextContent('Blocking: true');

      // Re-render with low priority (should not be blocking)
      render(
        <TestComponent shouldStartLoading loadingOptions={lowPriorityOptions} />, 
        { wrapper: createTestWrapper() }
      );
      expect(screen.getByTestId('blocking')).toHaveTextContent('Blocking: false');
    });
  });

  describe('React Query Integration', () => {
    it('should integrate with React Query loading states', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: 0 },
        },
      });

      const { rerender } = render(
        <>
          <TestComponent />
          <QueryTestComponent />
        </>,
        { wrapper: createTestWrapper({ queryClient }) }
      );

      // Initially should not be loading
      expect(screen.getByTestId('server-loading')).toHaveTextContent('Server: false');

      // Trigger query by re-rendering (this will start the query)
      await waitFor(() => {
        expect(screen.getByTestId('query-loading')).toHaveTextContent('Query Loading: true');
      });

      // Server loading should now be true due to React Query integration
      await waitFor(() => {
        expect(screen.getByTestId('server-loading')).toHaveTextContent('Server: true');
      });

      // Wait for query to complete
      await waitFor(() => {
        expect(screen.getByTestId('query-loading')).toHaveTextContent('Query Loading: false');
      });

      // Server loading should now be false
      await waitFor(() => {
        expect(screen.getByTestId('server-loading')).toHaveTextContent('Server: false');
      });
    });

    it('should disable React Query integration when configured', () => {
      render(
        <>
          <TestComponent />
          <QueryTestComponent />
        </>,
        { wrapper: createTestWrapper({ enableQueryIntegration: false }) }
      );

      // Server loading should remain false even with active queries
      expect(screen.getByTestId('server-loading')).toHaveTextContent('Server: false');
    });
  });

  describe('Navigation Loading Integration', () => {
    it('should track navigation loading states', () => {
      // Mock window.history methods
      const originalPushState = window.history.pushState;
      const originalReplaceState = window.history.replaceState;

      const { rerender } = render(<TestComponent />, { 
        wrapper: createTestWrapper({ enableNavigationTracking: true }) 
      });

      // Simulate navigation
      act(() => {
        window.history.pushState({}, '', '/new-page');
      });

      // Should trigger navigation loading
      expect(screen.getByTestId('navigation-loading')).toHaveTextContent('Navigation: true');

      // Simulate navigation completion
      act(() => {
        vi.advanceTimersByTime(150); // Advance past the 100ms timeout
      });

      waitFor(() => {
        expect(screen.getByTestId('navigation-loading')).toHaveTextContent('Navigation: false');
      });

      // Restore original methods
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    });

    it('should disable navigation tracking when configured', () => {
      const originalPushState = window.history.pushState;

      render(<TestComponent />, { 
        wrapper: createTestWrapper({ enableNavigationTracking: false }) 
      });

      // Simulate navigation
      act(() => {
        window.history.pushState({}, '', '/new-page');
      });

      // Should not trigger navigation loading
      expect(screen.getByTestId('navigation-loading')).toHaveTextContent('Navigation: false');

      window.history.pushState = originalPushState;
    });

    it('should handle popstate events for navigation tracking', () => {
      render(<TestComponent />, { 
        wrapper: createTestWrapper({ enableNavigationTracking: true }) 
      });

      // Simulate popstate event (back/forward navigation)
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      // Should trigger navigation loading
      expect(screen.getByTestId('navigation-loading')).toHaveTextContent('Navigation: true');
    });
  });

  describe('Custom Hooks', () => {
    describe('useLoading', () => {
      it('should provide simplified loading interface', () => {
        const TestLoadingHook = () => {
          const { 
            isLoading, 
            isGlobalLoading, 
            isNavigationLoading, 
            isServerLoading,
            activeCount,
            startLoading, 
            stopLoading, 
            setLoading,
            hasAnyLoading
          } = useLoading();

          return (
            <div>
              <div data-testid="hook-loading">Loading: {isLoading.toString()}</div>
              <div data-testid="hook-global">Global: {isGlobalLoading.toString()}</div>
              <div data-testid="hook-navigation">Navigation: {isNavigationLoading.toString()}</div>
              <div data-testid="hook-server">Server: {isServerLoading.toString()}</div>
              <div data-testid="hook-count">Count: {activeCount}</div>
              <div data-testid="hook-any">Any: {hasAnyLoading().toString()}</div>
              <button data-testid="hook-start" onClick={() => startLoading()}>Start</button>
              <button data-testid="hook-set-true" onClick={() => setLoading(true)}>Set True</button>
              <button data-testid="hook-set-false" onClick={() => setLoading(false)}>Set False</button>
            </div>
          );
        };

        render(<TestLoadingHook />, { wrapper: createTestWrapper() });

        expect(screen.getByTestId('hook-loading')).toHaveTextContent('Loading: false');
        expect(screen.getByTestId('hook-any')).toHaveTextContent('Any: false');
      });

      it('should handle loading operations through simplified interface', async () => {
        const TestLoadingHook = () => {
          const { isLoading, startLoading, setLoading } = useLoading();

          return (
            <div>
              <div data-testid="hook-loading">Loading: {isLoading.toString()}</div>
              <button data-testid="hook-start" onClick={() => startLoading()}>Start</button>
              <button data-testid="hook-set-true" onClick={() => setLoading(true)}>Set True</button>
              <button data-testid="hook-set-false" onClick={() => setLoading(false)}>Set False</button>
            </div>
          );
        };

        render(<TestLoadingHook />, { wrapper: createTestWrapper() });

        // Start loading
        await user.click(screen.getByTestId('hook-start'));
        expect(screen.getByTestId('hook-loading')).toHaveTextContent('Loading: true');

        // Set loading false should clear all
        await user.click(screen.getByTestId('hook-set-false'));
        expect(screen.getByTestId('hook-loading')).toHaveTextContent('Loading: false');

        // Set loading true should start loading
        await user.click(screen.getByTestId('hook-set-true'));
        expect(screen.getByTestId('hook-loading')).toHaveTextContent('Loading: true');
      });
    });

    describe('useComponentLoading', () => {
      it('should manage component-specific loading states', () => {
        const TestComponentLoading = ({ componentId }: { componentId: string }) => {
          const { isLoading, setLoading, getLoading } = useComponentLoading(componentId);

          return (
            <div data-testid={`component-${componentId}`}>
              <div data-testid={`loading-${componentId}`}>Loading: {isLoading.toString()}</div>
              <div data-testid={`get-loading-${componentId}`}>Get: {getLoading().toString()}</div>
              <button 
                data-testid={`start-${componentId}`} 
                onClick={() => setLoading(true)}
              >
                Start
              </button>
              <button 
                data-testid={`stop-${componentId}`} 
                onClick={() => setLoading(false)}
              >
                Stop
              </button>
            </div>
          );
        };

        render(
          <>
            <TestComponentLoading componentId="comp1" />
            <TestComponentLoading componentId="comp2" />
          </>,
          { wrapper: createTestWrapper() }
        );

        // Initially not loading
        expect(screen.getByTestId('loading-comp1')).toHaveTextContent('Loading: false');
        expect(screen.getByTestId('loading-comp2')).toHaveTextContent('Loading: false');
      });

      it('should handle independent component loading states', async () => {
        const TestComponentLoading = ({ componentId }: { componentId: string }) => {
          const { isLoading, setLoading } = useComponentLoading(componentId);

          return (
            <div>
              <div data-testid={`loading-${componentId}`}>Loading: {isLoading.toString()}</div>
              <button 
                data-testid={`start-${componentId}`} 
                onClick={() => setLoading(true)}
              >
                Start
              </button>
            </div>
          );
        };

        render(
          <>
            <TestComponentLoading componentId="comp1" />
            <TestComponentLoading componentId="comp2" />
          </>,
          { wrapper: createTestWrapper() }
        );

        // Start loading for comp1 only
        await user.click(screen.getByTestId('start-comp1'));

        expect(screen.getByTestId('loading-comp1')).toHaveTextContent('Loading: true');
        expect(screen.getByTestId('loading-comp2')).toHaveTextContent('Loading: false');
      });
    });

    describe('useAsyncLoading', () => {
      it('should handle async operations with loading states', async () => {
        render(<AsyncTestComponent />, { wrapper: createTestWrapper() });

        // Initially not loading
        expect(screen.getByTestId('async-loading')).toHaveTextContent('Async Loading: false');
        expect(screen.getByTestId('async-data')).toHaveTextContent('Data: none');

        // Execute async operation
        await user.click(screen.getByTestId('execute-async'));

        // Should be loading immediately
        expect(screen.getByTestId('async-loading')).toHaveTextContent('Async Loading: true');

        // Wait for completion
        await waitFor(() => {
          expect(screen.getByTestId('async-loading')).toHaveTextContent('Async Loading: false');
        });

        expect(screen.getByTestId('async-data')).toHaveTextContent('Data: async result');
      });

      it('should handle async operation errors', async () => {
        const ErrorAsyncComponent = () => {
          const asyncFn = React.useCallback(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
            throw new Error('Test error');
          }, []);

          const { error, isLoading, execute } = useAsyncLoading(asyncFn);

          return (
            <div>
              <div data-testid="error-loading">Loading: {isLoading.toString()}</div>
              <div data-testid="error-message">Error: {error?.message || 'none'}</div>
              <button data-testid="execute-error" onClick={execute}>
                Execute Error
              </button>
            </div>
          );
        };

        render(<ErrorAsyncComponent />, { wrapper: createTestWrapper() });

        // Execute async operation that will error
        await user.click(screen.getByTestId('execute-error'));

        // Wait for completion
        await waitFor(() => {
          expect(screen.getByTestId('error-loading')).toHaveTextContent('Loading: false');
        });

        expect(screen.getByTestId('error-message')).toHaveTextContent('Error: Test error');
      });
    });
  });

  describe('Higher-Order Component', () => {
    it('should wrap component with loading functionality', () => {
      const BaseComponent = (props: { title: string }) => (
        <div data-testid="base-component">{props.title}</div>
      );

      const WrappedComponent = withLoading(BaseComponent, { id: 'hoc-test' });

      render(<WrappedComponent title="Test Title" />, { wrapper: createTestWrapper() });

      expect(screen.getByTestId('base-component')).toHaveTextContent('Test Title');
    });

    it('should auto-start loading when configured with options', () => {
      const BaseComponent = () => <div data-testid="base-component">Content</div>;
      const WrappedComponent = withLoading(BaseComponent, { 
        id: 'hoc-auto-loading',
        priority: 'high' 
      });

      render(
        <>
          <WrappedComponent />
          <TestComponent />
        </>,
        { wrapper: createTestWrapper() }
      );

      // Should auto-start loading due to HOC configuration
      expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 1');
      expect(screen.getByTestId('blocking')).toHaveTextContent('Blocking: true');
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    it('should handle rapid start/stop operations', async () => {
      const RapidOperationsComponent = () => {
        const { startLoading, stopLoading } = useLoading();
        const [operationIds, setOperationIds] = React.useState<string[]>([]);

        const rapidOperations = () => {
          const ids: string[] = [];
          for (let i = 0; i < 5; i++) {
            const id = startLoading({ id: `rapid-${i}` });
            ids.push(id);
          }
          setOperationIds(ids);
          
          // Stop all operations immediately
          setTimeout(() => {
            ids.forEach(id => stopLoading(id));
          }, 10);
        };

        return (
          <div>
            <button data-testid="rapid-operations" onClick={rapidOperations}>
              Rapid Operations
            </button>
            <div data-testid="operation-count">{operationIds.length}</div>
          </div>
        );
      };

      render(
        <>
          <RapidOperationsComponent />
          <TestComponent />
        </>,
        { wrapper: createTestWrapper() }
      );

      await user.click(screen.getByTestId('rapid-operations'));

      // Wait for all operations to complete
      act(() => {
        vi.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 0');
      });
    });

    it('should handle component unmounting during loading operations', () => {
      const UnmountingComponent = () => {
        const [show, setShow] = React.useState(true);

        return (
          <div>
            <button data-testid="toggle-component" onClick={() => setShow(!show)}>
              Toggle Component
            </button>
            {show && <TestComponent shouldStartLoading componentId="unmounting-test" />}
          </div>
        );
      };

      const { rerender } = render(<UnmountingComponent />, { wrapper: createTestWrapper() });

      // Should be loading initially
      expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 1');

      // Unmount component
      act(() => {
        user.click(screen.getByTestId('toggle-component'));
      });

      // Loading state should persist even after component unmount
      // (this tests the ref-based state management)
      expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 1');
    });

    it('should handle duplicate operation IDs gracefully', async () => {
      const DuplicateIdComponent = () => {
        const { startLoading } = useLoading();

        const startDuplicateOperations = () => {
          startLoading({ id: 'duplicate-id' });
          startLoading({ id: 'duplicate-id' }); // Same ID
        };

        return (
          <button data-testid="start-duplicates" onClick={startDuplicateOperations}>
            Start Duplicates
          </button>
        );
      };

      render(
        <>
          <DuplicateIdComponent />
          <TestComponent />
        </>,
        { wrapper: createTestWrapper() }
      );

      await user.click(screen.getByTestId('start-duplicates'));

      // Should only have one active operation (duplicate ID should be overwritten)
      expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 1');
    });
  });

  describe('State Persistence and Lifecycle', () => {
    it('should persist loading states across re-renders', () => {
      const PersistenceTestComponent = () => {
        const [count, setCount] = React.useState(0);
        const { startLoading } = useLoading();

        React.useEffect(() => {
          if (count === 0) {
            startLoading({ persist: true, id: 'persistent-operation' });
          }
        }, [count, startLoading]);

        return (
          <div>
            <div data-testid="render-count">{count}</div>
            <button data-testid="increment" onClick={() => setCount(c => c + 1)}>
              Increment
            </button>
          </div>
        );
      };

      render(
        <>
          <PersistenceTestComponent />
          <TestComponent />
        </>,
        { wrapper: createTestWrapper() }
      );

      // Should be loading initially
      expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 1');

      // Trigger re-render
      act(() => {
        user.click(screen.getByTestId('increment'));
      });

      // Loading should persist
      expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 1');
    });

    it('should properly clean up on provider unmount', () => {
      let cleanupCallbacks: Array<() => void> = [];
      
      const spy = vi.spyOn(React, 'useEffect').mockImplementation((effect, deps) => {
        const cleanup = effect();
        if (cleanup && typeof cleanup === 'function') {
          cleanupCallbacks.push(cleanup);
        }
        return cleanup;
      });

      const { unmount } = render(<TestComponent />, { wrapper: createTestWrapper() });

      // Unmount the provider
      unmount();

      // Verify cleanup functions were called
      expect(cleanupCallbacks.length).toBeGreaterThan(0);

      spy.mockRestore();
    });
  });

  describe('Performance and Optimization', () => {
    it('should debounce rapid state changes', async () => {
      const renderSpy = vi.fn();
      
      const OptimizationTestComponent = () => {
        const { activeCount } = useLoading();
        
        renderSpy();
        
        return <div data-testid="optimized-count">{activeCount}</div>;
      };

      render(<OptimizationTestComponent />, { wrapper: createTestWrapper() });

      const initialRenderCount = renderSpy.mock.calls.length;

      // Perform multiple rapid state changes
      const { actions } = renderHook(() => useLoadingContext(), {
        wrapper: createTestWrapper(),
      }).result.current;

      act(() => {
        for (let i = 0; i < 10; i++) {
          actions.startLoading({ id: `batch-${i}` });
        }
      });

      // Should not cause excessive re-renders due to batching
      const finalRenderCount = renderSpy.mock.calls.length;
      expect(finalRenderCount - initialRenderCount).toBeLessThan(5);
    });

    it('should handle large numbers of concurrent operations efficiently', () => {
      const LargeOperationsComponent = () => {
        const { startLoading, hasAnyLoading } = useLoading();

        const startManyOperations = () => {
          for (let i = 0; i < 100; i++) {
            startLoading({ id: `large-op-${i}` });
          }
        };

        return (
          <div>
            <button data-testid="start-many" onClick={startManyOperations}>
              Start Many
            </button>
            <div data-testid="has-any">{hasAnyLoading().toString()}</div>
          </div>
        );
      };

      render(
        <>
          <LargeOperationsComponent />
          <TestComponent />
        </>,
        { wrapper: createTestWrapper() }
      );

      const startTime = performance.now();
      
      act(() => {
        user.click(screen.getByTestId('start-many'));
      });

      const endTime = performance.now();

      // Should handle 100 operations efficiently (under 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      expect(screen.getByTestId('active-count')).toHaveTextContent('Active: 100');
    });
  });
});