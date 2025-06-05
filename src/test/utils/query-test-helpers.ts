/**
 * @fileoverview Specialized testing utilities for TanStack React Query patterns
 * 
 * Provides comprehensive helper functions for testing data fetching, caching, mutations,
 * and optimistic updates that replace Angular RxJS testing patterns. Includes utilities
 * for cache management, mutation testing, background refresh patterns, and error scenarios.
 * 
 * Key Features:
 * - Query cache inspection and validation utilities
 * - Mutation testing with optimistic update scenarios
 * - Background refresh and stale-while-revalidate testing
 * - Cache invalidation and synchronization testing
 * - Error boundary integration for query error scenarios
 * - Performance testing for sub-5-second API generation workflows
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { renderHook, waitFor, RenderHookResult } from '@testing-library/react';
import { ReactNode } from 'react';

/**
 * Interface for query cache inspection results
 */
export interface QueryCacheInspection {
  /** All cached queries in the QueryClient */
  queries: Array<{
    queryKey: any;
    state: {
      data: any;
      error: any;
      status: 'pending' | 'error' | 'success';
      isStale: boolean;
      isFetching: boolean;
      isLoading: boolean;
    };
  }>;
  /** Current cache size */
  cacheSize: number;
  /** Number of stale queries */
  staleCount: number;
  /** Number of fetching queries */
  fetchingCount: number;
}

/**
 * Interface for mutation testing scenarios
 */
export interface MutationTestScenario {
  /** The mutation function to test */
  mutationFn: (variables: any) => Promise<any>;
  /** Variables to pass to the mutation */
  variables: any;
  /** Expected optimistic update data */
  optimisticData?: any;
  /** Expected final data after successful mutation */
  expectedData?: any;
  /** Expected error for failure scenarios */
  expectedError?: any;
  /** Queries to invalidate after mutation */
  invalidateQueries?: string[][];
  /** Delay before resolving/rejecting (for testing timing) */
  delay?: number;
}

/**
 * Interface for background refresh testing configuration
 */
export interface BackgroundRefreshConfig {
  /** Query key to test background refresh for */
  queryKey: any[];
  /** Initial data to seed the cache */
  initialData: any;
  /** New data that should be fetched in background */
  refreshedData: any;
  /** Stale time in milliseconds */
  staleTime?: number;
  /** Cache time in milliseconds */
  cacheTime?: number;
  /** Whether to test window focus refetch */
  testWindowFocus?: boolean;
  /** Whether to test network reconnect refetch */
  testNetworkReconnect?: boolean;
}

/**
 * Interface for cache synchronization testing
 */
export interface CacheSyncTestConfig {
  /** Primary query that triggers invalidation */
  primaryQuery: {
    queryKey: any[];
    data: any;
  };
  /** Dependent queries that should be invalidated */
  dependentQueries: Array<{
    queryKey: any[];
    initialData: any;
    expectedInvalidation: boolean;
  }>;
  /** Mutation that triggers the invalidation */
  mutation?: {
    mutationFn: (variables: any) => Promise<any>;
    variables: any;
  };
}

/**
 * Creates a test QueryClient with optimized settings for testing
 */
export function createTestQueryClient(options?: {
  /** Default query options for all queries */
  defaultOptions?: {
    queries?: {
      retry?: boolean | number;
      staleTime?: number;
      cacheTime?: number;
      refetchOnWindowFocus?: boolean;
      refetchOnReconnect?: boolean;
    };
    mutations?: {
      retry?: boolean | number;
    };
  };
  /** Mock logger to capture errors */
  logger?: {
    log: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
  };
}): QueryClient {
  const defaultLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return new QueryClient({
    logger: options?.logger || defaultLogger,
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        ...options?.defaultOptions?.queries,
      },
      mutations: {
        retry: false,
        ...options?.defaultOptions?.mutations,
      },
    },
  });
}

/**
 * Wrapper component that provides QueryClient to test components
 */
export function createQueryWrapper(queryClient: QueryClient) {
  return function QueryWrapper({ children }: { children: ReactNode }) {
    const { QueryClientProvider } = require('@tanstack/react-query');
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

/**
 * Inspects the current state of the query cache
 */
export function inspectQueryCache(queryClient: QueryClient): QueryCacheInspection {
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();

  const inspection = {
    queries: queries.map(query => ({
      queryKey: query.queryKey,
      state: {
        data: query.state.data,
        error: query.state.error,
        status: query.state.status,
        isStale: query.isStale(),
        isFetching: query.state.isFetching,
        isLoading: query.state.isLoading,
      },
    })),
    cacheSize: queries.length,
    staleCount: queries.filter(query => query.isStale()).length,
    fetchingCount: queries.filter(query => query.state.isFetching).length,
  };

  return inspection;
}

/**
 * Waits for a specific query to reach a target state
 */
export async function waitForQueryState(
  queryClient: QueryClient,
  queryKey: any[],
  targetState: {
    status?: 'pending' | 'error' | 'success';
    isFetching?: boolean;
    isLoading?: boolean;
    hasData?: boolean;
    hasError?: boolean;
  },
  timeout = 5000
): Promise<void> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const checkState = () => {
      const query = queryClient.getQueryCache().find({ queryKey });
      
      if (!query) {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Query with key ${JSON.stringify(queryKey)} not found after ${timeout}ms`));
          return;
        }
        setTimeout(checkState, 50);
        return;
      }

      const state = query.state;
      const matches = Object.entries(targetState).every(([key, expectedValue]) => {
        switch (key) {
          case 'status':
            return state.status === expectedValue;
          case 'isFetching':
            return state.isFetching === expectedValue;
          case 'isLoading':
            return state.isLoading === expectedValue;
          case 'hasData':
            return expectedValue ? state.data !== undefined : state.data === undefined;
          case 'hasError':
            return expectedValue ? state.error !== null : state.error === null;
          default:
            return true;
        }
      });

      if (matches) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Query state did not match expected state after ${timeout}ms. Current: ${JSON.stringify({
          status: state.status,
          isFetching: state.isFetching,
          isLoading: state.isLoading,
          hasData: state.data !== undefined,
          hasError: state.error !== null,
        })}, Expected: ${JSON.stringify(targetState)}`));
      } else {
        setTimeout(checkState, 50);
      }
    };

    checkState();
  });
}

/**
 * Tests cache invalidation patterns for related queries
 */
export async function testCacheInvalidation(
  queryClient: QueryClient,
  config: CacheSyncTestConfig
): Promise<{
  success: boolean;
  results: Array<{
    queryKey: any[];
    wasInvalidated: boolean;
    expectedInvalidation: boolean;
    passed: boolean;
  }>;
}> {
  // Set up initial cache state
  queryClient.setQueryData(config.primaryQuery.queryKey, config.primaryQuery.data);
  
  for (const depQuery of config.dependentQueries) {
    queryClient.setQueryData(depQuery.queryKey, depQuery.initialData);
  }

  // Record initial cache states
  const initialStates = config.dependentQueries.map(depQuery => {
    const query = queryClient.getQueryCache().find({ queryKey: depQuery.queryKey });
    return {
      queryKey: depQuery.queryKey,
      initialDataUpdatedAt: query?.state.dataUpdatedAt || 0,
    };
  });

  // Trigger invalidation (either through mutation or direct invalidation)
  if (config.mutation) {
    try {
      await config.mutation.mutationFn(config.mutation.variables);
    } catch (error) {
      // Mutation might fail, but we still want to test invalidation
    }
  } else {
    // Direct invalidation of primary query
    await queryClient.invalidateQueries({ queryKey: config.primaryQuery.queryKey });
  }

  // Wait a bit for invalidation to propagate
  await new Promise(resolve => setTimeout(resolve, 100));

  // Check which queries were actually invalidated
  const results = config.dependentQueries.map((depQuery, index) => {
    const query = queryClient.getQueryCache().find({ queryKey: depQuery.queryKey });
    const currentDataUpdatedAt = query?.state.dataUpdatedAt || 0;
    const wasInvalidated = currentDataUpdatedAt !== initialStates[index].initialDataUpdatedAt || query?.isStale();
    
    return {
      queryKey: depQuery.queryKey,
      wasInvalidated,
      expectedInvalidation: depQuery.expectedInvalidation,
      passed: wasInvalidated === depQuery.expectedInvalidation,
    };
  });

  const success = results.every(result => result.passed);

  return { success, results };
}

/**
 * Tests mutation with optimistic updates and rollback scenarios
 */
export async function testMutationWithOptimisticUpdates(
  queryClient: QueryClient,
  scenario: MutationTestScenario
): Promise<{
  success: boolean;
  phases: {
    initial: any;
    optimistic?: any;
    final: any;
    error?: any;
  };
  timings: {
    optimisticUpdateTime?: number;
    mutationCompleteTime: number;
    totalTime: number;
  };
}> {
  const startTime = performance.now();
  let optimisticUpdateTime: number | undefined;
  let mutationCompleteTime: number;

  // Set up initial state if we're testing against existing queries
  if (scenario.invalidateQueries) {
    for (const queryKey of scenario.invalidateQueries) {
      queryClient.setQueryData(queryKey, { existing: 'data' });
    }
  }

  const phases = {
    initial: scenario.optimisticData ? undefined : null,
    optimistic: undefined,
    final: undefined,
    error: undefined,
  };

  // Capture initial state
  if (scenario.invalidateQueries && scenario.invalidateQueries.length > 0) {
    phases.initial = queryClient.getQueryData(scenario.invalidateQueries[0]);
  }

  try {
    // Create mutation with optimistic update
    const mutation = queryClient.getMutationCache().build(queryClient, {
      mutationFn: scenario.mutationFn,
      onMutate: async (variables) => {
        if (scenario.optimisticData && scenario.invalidateQueries) {
          // Cancel outgoing refetches
          for (const queryKey of scenario.invalidateQueries) {
            await queryClient.cancelQueries({ queryKey });
          }
          
          // Snapshot previous values
          const previousData = scenario.invalidateQueries.map(queryKey => 
            queryClient.getQueryData(queryKey)
          );
          
          // Optimistically update
          for (const queryKey of scenario.invalidateQueries) {
            queryClient.setQueryData(queryKey, scenario.optimisticData);
          }
          
          optimisticUpdateTime = performance.now() - startTime;
          
          if (scenario.invalidateQueries.length > 0) {
            phases.optimistic = queryClient.getQueryData(scenario.invalidateQueries[0]);
          }
          
          return { previousData };
        }
      },
      onError: (error, variables, context) => {
        // Rollback optimistic updates
        if (context?.previousData && scenario.invalidateQueries) {
          scenario.invalidateQueries.forEach((queryKey, index) => {
            queryClient.setQueryData(queryKey, context.previousData[index]);
          });
        }
        phases.error = error;
      },
      onSuccess: (data) => {
        // Invalidate related queries
        if (scenario.invalidateQueries) {
          for (const queryKey of scenario.invalidateQueries) {
            queryClient.invalidateQueries({ queryKey });
          }
        }
      },
    });

    // Add delay if specified (for testing timing scenarios)
    const mutationPromise = scenario.delay 
      ? new Promise(resolve => setTimeout(resolve, scenario.delay)).then(() => mutation.execute(scenario.variables))
      : mutation.execute(scenario.variables);

    const result = await mutationPromise;
    mutationCompleteTime = performance.now() - startTime;

    // Capture final state
    if (scenario.invalidateQueries && scenario.invalidateQueries.length > 0) {
      phases.final = queryClient.getQueryData(scenario.invalidateQueries[0]);
    } else {
      phases.final = result;
    }

    const success = scenario.expectedError 
      ? false 
      : scenario.expectedData 
        ? JSON.stringify(phases.final) === JSON.stringify(scenario.expectedData)
        : true;

    return {
      success,
      phases,
      timings: {
        optimisticUpdateTime,
        mutationCompleteTime,
        totalTime: performance.now() - startTime,
      },
    };

  } catch (error) {
    mutationCompleteTime = performance.now() - startTime;
    phases.error = error;

    // Capture final state after error
    if (scenario.invalidateQueries && scenario.invalidateQueries.length > 0) {
      phases.final = queryClient.getQueryData(scenario.invalidateQueries[0]);
    }

    const success = scenario.expectedError 
      ? JSON.stringify(error) === JSON.stringify(scenario.expectedError)
      : false;

    return {
      success,
      phases,
      timings: {
        optimisticUpdateTime,
        mutationCompleteTime,
        totalTime: performance.now() - startTime,
      },
    };
  }
}

/**
 * Tests background refresh and stale-while-revalidate patterns
 */
export async function testBackgroundRefresh(
  queryClient: QueryClient,
  config: BackgroundRefreshConfig
): Promise<{
  success: boolean;
  timeline: Array<{
    timestamp: number;
    event: string;
    data: any;
    isStale: boolean;
    isFetching: boolean;
  }>;
}> {
  const timeline: Array<{
    timestamp: number;
    event: string;
    data: any;
    isStale: boolean;
    isFetching: boolean;
  }> = [];

  const startTime = performance.now();

  // Mock fetch function that returns different data on subsequent calls
  let fetchCallCount = 0;
  const mockFetch = jest.fn().mockImplementation(() => {
    fetchCallCount++;
    const data = fetchCallCount === 1 ? config.initialData : config.refreshedData;
    return Promise.resolve(data);
  });

  // Set up query with stale-while-revalidate behavior
  const queryKey = config.queryKey;
  const staleTime = config.staleTime || 1000;
  const cacheTime = config.cacheTime || 5000;

  // Initial query - this should fetch fresh data
  const { result } = renderHook(
    () => {
      const { useQuery } = require('@tanstack/react-query');
      return useQuery({
        queryKey,
        queryFn: mockFetch,
        staleTime,
        cacheTime,
        refetchOnWindowFocus: config.testWindowFocus || false,
        refetchOnReconnect: config.testNetworkReconnect || false,
      });
    },
    { wrapper: createQueryWrapper(queryClient) }
  );

  // Wait for initial fetch to complete
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });

  timeline.push({
    timestamp: performance.now() - startTime,
    event: 'initial_fetch_complete',
    data: result.current.data,
    isStale: result.current.isStale,
    isFetching: result.current.isFetching,
  });

  // Wait for data to become stale
  await new Promise(resolve => setTimeout(resolve, staleTime + 100));

  timeline.push({
    timestamp: performance.now() - startTime,
    event: 'data_became_stale',
    data: result.current.data,
    isStale: result.current.isStale,
    isFetching: result.current.isFetching,
  });

  // Trigger a background refetch by accessing the query again
  const { result: secondResult } = renderHook(
    () => {
      const { useQuery } = require('@tanstack/react-query');
      return useQuery({
        queryKey,
        queryFn: mockFetch,
        staleTime,
        cacheTime,
      });
    },
    { wrapper: createQueryWrapper(queryClient) }
  );

  // Should immediately return stale data
  timeline.push({
    timestamp: performance.now() - startTime,
    event: 'stale_data_served',
    data: secondResult.current.data,
    isStale: secondResult.current.isStale,
    isFetching: secondResult.current.isFetching,
  });

  // Wait for background refetch to complete
  await waitFor(() => {
    expect(secondResult.current.isFetching).toBe(false);
  });

  timeline.push({
    timestamp: performance.now() - startTime,
    event: 'background_refetch_complete',
    data: secondResult.current.data,
    isStale: secondResult.current.isStale,
    isFetching: secondResult.current.isFetching,
  });

  // Test window focus refetch if enabled
  if (config.testWindowFocus) {
    // Simulate window focus
    const focusEvent = new Event('focus');
    window.dispatchEvent(focusEvent);

    await waitFor(() => {
      expect(secondResult.current.isFetching).toBe(false);
    });

    timeline.push({
      timestamp: performance.now() - startTime,
      event: 'window_focus_refetch_complete',
      data: secondResult.current.data,
      isStale: secondResult.current.isStale,
      isFetching: secondResult.current.isFetching,
    });
  }

  // Validate the stale-while-revalidate behavior
  const staleDataServedEvent = timeline.find(event => event.event === 'stale_data_served');
  const backgroundRefetchEvent = timeline.find(event => event.event === 'background_refetch_complete');

  const success = Boolean(
    staleDataServedEvent &&
    backgroundRefetchEvent &&
    JSON.stringify(staleDataServedEvent.data) === JSON.stringify(config.initialData) &&
    JSON.stringify(backgroundRefetchEvent.data) === JSON.stringify(config.refreshedData) &&
    staleDataServedEvent.isStale === true &&
    backgroundRefetchEvent.isStale === false
  );

  return { success, timeline };
}

/**
 * Tests query error boundaries and error recovery patterns
 */
export async function testQueryErrorBoundary(
  queryClient: QueryClient,
  errorScenario: {
    queryKey: any[];
    errorToThrow: Error;
    retryCount?: number;
    retryDelay?: number;
    shouldRecover?: boolean;
    recoveryData?: any;
  }
): Promise<{
  success: boolean;
  errorsCaught: Error[];
  retryAttempts: number;
  finalState: 'error' | 'success';
  errorBoundaryTriggered: boolean;
}> {
  const errorsCaught: Error[] = [];
  let retryAttempts = 0;
  let errorBoundaryTriggered = false;

  // Mock fetch function that throws error initially
  const mockFetch = jest.fn().mockImplementation(() => {
    retryAttempts++;
    if (errorScenario.shouldRecover && retryAttempts > (errorScenario.retryCount || 1)) {
      return Promise.resolve(errorScenario.recoveryData);
    }
    throw errorScenario.errorToThrow;
  });

  // Error boundary component
  class TestErrorBoundary extends React.Component<
    { children: ReactNode; onError: (error: Error) => void },
    { hasError: boolean }
  > {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    componentDidCatch(error: Error) {
      errorBoundaryTriggered = true;
      this.props.onError(error);
    }

    render() {
      if (this.state.hasError) {
        return <div>Error boundary activated</div>;
      }
      return this.props.children;
    }
  }

  const { result } = renderHook(
    () => {
      const { useQuery } = require('@tanstack/react-query');
      return useQuery({
        queryKey: errorScenario.queryKey,
        queryFn: mockFetch,
        retry: errorScenario.retryCount || 0,
        retryDelay: errorScenario.retryDelay || 1000,
        useErrorBoundary: true,
      });
    },
    {
      wrapper: ({ children }) => (
        <TestErrorBoundary onError={(error) => errorsCaught.push(error)}>
          {createQueryWrapper(queryClient)({ children })}
        </TestErrorBoundary>
      ),
    }
  );

  // Wait for query to complete (either success or final error)
  await waitFor(
    () => {
      expect(result.current.isSuccess || (result.current.isError && !result.current.isFetching)).toBe(true);
    },
    { timeout: 10000 }
  );

  const finalState = result.current.isSuccess ? 'success' : 'error';
  const success = errorScenario.shouldRecover 
    ? finalState === 'success' && retryAttempts > 1
    : finalState === 'error' && errorsCaught.length > 0;

  return {
    success,
    errorsCaught,
    retryAttempts,
    finalState,
    errorBoundaryTriggered,
  };
}

/**
 * Performance testing utilities for API generation workflows
 */
export async function testQueryPerformance(
  queryClient: QueryClient,
  performanceConfig: {
    queryKey: any[];
    queryFn: () => Promise<any>;
    expectedMaxTime: number; // in milliseconds
    cacheHitExpectedMaxTime?: number; // for subsequent cache hits
    testCacheHit?: boolean;
  }
): Promise<{
  success: boolean;
  firstCallTime: number;
  cacheHitTime?: number;
  passed: boolean;
  cacheHitPassed?: boolean;
}> {
  // First call - should fetch from network
  const startTime = performance.now();
  
  const { result } = renderHook(
    () => {
      const { useQuery } = require('@tanstack/react-query');
      return useQuery({
        queryKey: performanceConfig.queryKey,
        queryFn: performanceConfig.queryFn,
        staleTime: 60000, // 1 minute
      });
    },
    { wrapper: createQueryWrapper(queryClient) }
  );

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });

  const firstCallTime = performance.now() - startTime;
  const passed = firstCallTime <= performanceConfig.expectedMaxTime;

  let cacheHitTime: number | undefined;
  let cacheHitPassed: boolean | undefined;

  if (performanceConfig.testCacheHit) {
    // Second call - should hit cache
    const cacheStartTime = performance.now();
    
    const { result: cacheResult } = renderHook(
      () => {
        const { useQuery } = require('@tanstack/react-query');
        return useQuery({
          queryKey: performanceConfig.queryKey,
          queryFn: performanceConfig.queryFn,
          staleTime: 60000,
        });
      },
      { wrapper: createQueryWrapper(queryClient) }
    );

    // Cache hit should be immediate
    cacheHitTime = performance.now() - cacheStartTime;
    const expectedCacheTime = performanceConfig.cacheHitExpectedMaxTime || 50; // 50ms default for cache hits
    cacheHitPassed = cacheHitTime <= expectedCacheTime;
  }

  return {
    success: passed && (cacheHitPassed !== false),
    firstCallTime,
    cacheHitTime,
    passed,
    cacheHitPassed,
  };
}

/**
 * Utility to clear all query and mutation caches
 */
export function clearAllCaches(queryClient: QueryClient): void {
  queryClient.clear();
  queryClient.getQueryCache().clear();
  queryClient.getMutationCache().clear();
}

/**
 * Utility to mock network conditions for testing
 */
export function mockNetworkConditions(condition: 'online' | 'offline' | 'slow'): void {
  const originalOnLine = navigator.onLine;
  
  switch (condition) {
    case 'offline':
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
      break;
    case 'online':
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
      break;
    case 'slow':
      // Implement slow network simulation by adding delays to fetch
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockImplementation(async (...args) => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        return originalFetch(...args);
      });
      break;
  }
}

/**
 * Restores original network conditions after testing
 */
export function restoreNetworkConditions(): void {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
  });
  
  if (global.fetch && jest.isMockFunction(global.fetch)) {
    (global.fetch as jest.Mock).mockRestore();
  }
}

// React import for error boundary component
const React = require('react');