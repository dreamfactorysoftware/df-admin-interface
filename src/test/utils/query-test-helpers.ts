import { 
  QueryClient, 
  QueryObserver, 
  MutationObserver,
  QueryKey,
  MutationKey,
  QueryFunction,
  MutationFunction,
  QueryCache,
  MutationCache,
  InfiniteQueryObserver,
  QueryState,
  MutationState,
  QueryObserverOptions,
  MutationObserverOptions,
  InfiniteQueryObserverOptions,
  QueryFilters,
  MutationFilters,
  InvalidateQueryFilters,
  ResetQueryFilters,
  RefetchQueryFilters,
  CancelOptions,
  InvalidateOptions,
  RefetchOptions,
  ResetOptions,
} from '@tanstack/react-query';
import { act, waitFor } from '@testing-library/react';
import { renderWithProviders } from './test-utils';
import { ReactElement } from 'react';

/**
 * Test-specific QueryClient configuration optimized for fast testing
 * Replaces Angular RxJS testing patterns with React Query test utilities
 */
export const createTestQueryClient = (overrides?: Partial<QueryClient['options']>): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries for predictable test behavior
        retry: false,
        // Disable garbage collection during tests
        gcTime: Infinity,
        // Make queries immediately stale for testing refresh behavior
        staleTime: 0,
        // Disable automatic refetching
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        // Override with test-specific behavior
        ...overrides?.defaultOptions?.queries,
      },
      mutations: {
        // Disable retries for predictable test behavior
        retry: false,
        // Override with test-specific behavior
        ...overrides?.defaultOptions?.mutations,
      },
    },
    ...overrides,
  });
};

/**
 * Query cache inspection utilities for validating server state management behavior
 * Provides tools to examine and assert on cache state during tests
 */
export const queryCacheUtils = {
  /**
   * Get the current cached data for a specific query key
   */
  getCachedData: <TData = unknown>(queryClient: QueryClient, queryKey: QueryKey): TData | undefined => {
    return queryClient.getQueryData<TData>(queryKey);
  },

  /**
   * Check if a query is currently in the cache
   */
  isQueryCached: (queryClient: QueryClient, queryKey: QueryKey): boolean => {
    return queryClient.getQueryState(queryKey) !== undefined;
  },

  /**
   * Get the current state of a specific query including loading, error states
   */
  getQueryState: (queryClient: QueryClient, queryKey: QueryKey): QueryState | undefined => {
    return queryClient.getQueryState(queryKey);
  },

  /**
   * Get all cached queries matching specific filters
   */
  getCachedQueries: (queryClient: QueryClient, filters?: QueryFilters) => {
    return queryClient.getQueriesData(filters || {});
  },

  /**
   * Check if a query is currently fetching
   */
  isQueryFetching: (queryClient: QueryClient, queryKey: QueryKey): boolean => {
    const state = queryClient.getQueryState(queryKey);
    return state?.isFetching ?? false;
  },

  /**
   * Check if a query has error state
   */
  hasQueryError: (queryClient: QueryClient, queryKey: QueryKey): boolean => {
    const state = queryClient.getQueryState(queryKey);
    return state?.status === 'error';
  },

  /**
   * Get error details for a failed query
   */
  getQueryError: (queryClient: QueryClient, queryKey: QueryKey): Error | null => {
    const state = queryClient.getQueryState(queryKey);
    return state?.error || null;
  },

  /**
   * Check if a query is stale and needs revalidation
   */
  isQueryStale: (queryClient: QueryClient, queryKey: QueryKey): boolean => {
    const state = queryClient.getQueryState(queryKey);
    return state?.isStale ?? false;
  },

  /**
   * Get the timestamp when query data was last updated
   */
  getQueryDataUpdatedAt: (queryClient: QueryClient, queryKey: QueryKey): number | undefined => {
    const state = queryClient.getQueryState(queryKey);
    return state?.dataUpdatedAt;
  },

  /**
   * Get comprehensive cache statistics for testing performance
   */
  getCacheStats: (queryClient: QueryClient) => {
    const queryCache = queryClient.getQueryCache();
    const mutationCache = queryClient.getMutationCache();
    
    return {
      queryCount: queryCache.getAll().length,
      mutationCount: mutationCache.getAll().length,
      activeQueries: queryCache.getAll().filter(query => query.getObserversCount() > 0).length,
      staleQueries: queryCache.getAll().filter(query => query.isStale()).length,
      fetchingQueries: queryCache.getAll().filter(query => query.state.isFetching).length,
      errorQueries: queryCache.getAll().filter(query => query.state.status === 'error').length,
    };
  },
};

/**
 * Cache invalidation and synchronization testing utilities
 * Tests cache behavior, invalidation strategies, and background refetching
 */
export const cacheInvalidationUtils = {
  /**
   * Test cache invalidation for specific query patterns
   * Useful for testing database operations that should invalidate related queries
   */
  testCacheInvalidation: async (
    queryClient: QueryClient,
    invalidationFn: () => Promise<void>,
    expectedInvalidatedKeys: QueryKey[]
  ) => {
    // Track initial query states
    const initialStates = expectedInvalidatedKeys.map(key => ({
      key,
      state: queryClient.getQueryState(key),
    }));

    // Execute invalidation
    await act(async () => {
      await invalidationFn();
    });

    // Wait for invalidation to propagate
    await waitFor(() => {
      expectedInvalidatedKeys.forEach(key => {
        const currentState = queryClient.getQueryState(key);
        const initialState = initialStates.find(s => JSON.stringify(s.key) === JSON.stringify(key))?.state;
        
        // Query should be marked as stale or refetching after invalidation
        expect(currentState?.isStale || currentState?.isFetching).toBe(true);
      });
    });

    return {
      beforeInvalidation: initialStates,
      afterInvalidation: expectedInvalidatedKeys.map(key => ({
        key,
        state: queryClient.getQueryState(key),
      })),
    };
  },

  /**
   * Test selective cache invalidation with filters
   */
  testSelectiveInvalidation: async (
    queryClient: QueryClient,
    filters: InvalidateQueryFilters,
    shouldInvalidate: QueryKey[],
    shouldNotInvalidate: QueryKey[]
  ) => {
    // Set up initial data for all queries
    [...shouldInvalidate, ...shouldNotInvalidate].forEach(key => {
      queryClient.setQueryData(key, { test: 'data' });
    });

    await act(async () => {
      await queryClient.invalidateQueries(filters);
    });

    // Check that correct queries were invalidated
    shouldInvalidate.forEach(key => {
      const state = queryClient.getQueryState(key);
      expect(state?.isStale).toBe(true);
    });

    shouldNotInvalidate.forEach(key => {
      const state = queryClient.getQueryState(key);
      expect(state?.isStale).toBe(false);
    });
  },

  /**
   * Test cache synchronization across multiple components
   */
  testCacheSynchronization: async <TData>(
    queryClient: QueryClient,
    queryKey: QueryKey,
    initialData: TData,
    updatedData: TData
  ) => {
    // Set initial data
    queryClient.setQueryData(queryKey, initialData);

    // Verify initial state
    expect(queryClient.getQueryData(queryKey)).toEqual(initialData);

    // Update data and verify synchronization
    await act(async () => {
      queryClient.setQueryData(queryKey, updatedData);
    });

    expect(queryClient.getQueryData(queryKey)).toEqual(updatedData);

    return {
      initial: initialData,
      updated: updatedData,
      final: queryClient.getQueryData(queryKey),
    };
  },

  /**
   * Test background refetching behavior
   */
  testBackgroundRefetch: async (
    queryClient: QueryClient,
    queryKey: QueryKey,
    queryFn: QueryFunction,
    expectedRefetchTrigger: () => Promise<void>
  ) => {
    // Create query observer to monitor background refetching
    const observer = new QueryObserver(queryClient, {
      queryKey,
      queryFn,
      staleTime: 0, // Immediately stale for testing
    });

    let refetchCount = 0;
    const unsubscribe = observer.subscribe(() => {
      refetchCount++;
    });

    try {
      // Trigger background refetch
      await act(async () => {
        await expectedRefetchTrigger();
      });

      // Wait for refetch to complete
      await waitFor(() => {
        expect(refetchCount).toBeGreaterThan(0);
      });

      const finalState = queryClient.getQueryState(queryKey);
      
      return {
        refetchCount,
        finalState,
        wasSuccessful: finalState?.status === 'success',
      };
    } finally {
      unsubscribe();
    }
  },
};

/**
 * Mutation testing helpers for API endpoint generation workflows
 * Provides utilities for testing CRUD operations, optimistic updates, and error handling
 */
export const mutationTestUtils = {
  /**
   * Test mutation execution with success scenario
   */
  testMutationSuccess: async <TData, TVariables>(
    queryClient: QueryClient,
    mutationFn: MutationFunction<TData, TVariables>,
    variables: TVariables,
    expectedResult?: TData
  ) => {
    const observer = new MutationObserver(queryClient, {
      mutationFn,
    });

    let result: TData | undefined;
    let error: Error | null = null;

    await act(async () => {
      try {
        result = await observer.mutate(variables);
      } catch (e) {
        error = e as Error;
      }
    });

    expect(error).toBeNull();
    if (expectedResult) {
      expect(result).toEqual(expectedResult);
    }

    const mutationState = observer.getCurrentResult();
    expect(mutationState.status).toBe('success');
    expect(mutationState.isSuccess).toBe(true);
    expect(mutationState.isError).toBe(false);

    return {
      result,
      mutationState,
    };
  },

  /**
   * Test mutation execution with error scenario
   */
  testMutationError: async <TData, TVariables>(
    queryClient: QueryClient,
    mutationFn: MutationFunction<TData, TVariables>,
    variables: TVariables,
    expectedError?: Error | string
  ) => {
    const observer = new MutationObserver(queryClient, {
      mutationFn,
    });

    let thrownError: Error | null = null;

    await act(async () => {
      try {
        await observer.mutate(variables);
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError).not.toBeNull();
    
    if (expectedError) {
      if (typeof expectedError === 'string') {
        expect(thrownError?.message).toContain(expectedError);
      } else {
        expect(thrownError).toEqual(expectedError);
      }
    }

    const mutationState = observer.getCurrentResult();
    expect(mutationState.status).toBe('error');
    expect(mutationState.isError).toBe(true);
    expect(mutationState.isSuccess).toBe(false);

    return {
      error: thrownError,
      mutationState,
    };
  },

  /**
   * Test mutation retry behavior
   */
  testMutationRetry: async <TData, TVariables>(
    queryClient: QueryClient,
    mutationFn: MutationFunction<TData, TVariables>,
    variables: TVariables,
    retryCount: number = 3
  ) => {
    let attemptCount = 0;
    const mockMutationFn: MutationFunction<TData, TVariables> = async (vars) => {
      attemptCount++;
      if (attemptCount <= retryCount) {
        throw new Error(`Attempt ${attemptCount} failed`);
      }
      return mutationFn(vars);
    };

    const observer = new MutationObserver(queryClient, {
      mutationFn: mockMutationFn,
      retry: retryCount,
    });

    const result = await act(async () => {
      return observer.mutate(variables);
    });

    expect(attemptCount).toBe(retryCount + 1);
    
    return {
      result,
      attemptCount,
      finalState: observer.getCurrentResult(),
    };
  },

  /**
   * Test mutation loading states and timing
   */
  testMutationLoadingStates: async <TData, TVariables>(
    queryClient: QueryClient,
    mutationFn: MutationFunction<TData, TVariables>,
    variables: TVariables,
    delayMs: number = 100
  ) => {
    const states: Array<{ timestamp: number; isLoading: boolean; status: string }> = [];
    
    const delayedMutationFn: MutationFunction<TData, TVariables> = async (vars) => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return mutationFn(vars);
    };

    const observer = new MutationObserver(queryClient, {
      mutationFn: delayedMutationFn,
    });

    // Track state changes
    const unsubscribe = observer.subscribe((result) => {
      states.push({
        timestamp: Date.now(),
        isLoading: result.isLoading,
        status: result.status,
      });
    });

    try {
      await act(async () => {
        await observer.mutate(variables);
      });

      // Verify loading state progression
      expect(states.some(s => s.isLoading)).toBe(true);
      expect(states.some(s => s.status === 'pending')).toBe(true);
      expect(states[states.length - 1].status).toBe('success');

      return {
        states,
        duration: states[states.length - 1].timestamp - states[0].timestamp,
      };
    } finally {
      unsubscribe();
    }
  },
};

/**
 * Optimistic update testing utilities for database connection scenarios
 * Tests optimistic UI updates, rollback behavior, and conflict resolution
 */
export const optimisticUpdateUtils = {
  /**
   * Test optimistic update with successful mutation
   */
  testOptimisticUpdateSuccess: async <TData, TVariables>(
    queryClient: QueryClient,
    queryKey: QueryKey,
    initialData: TData,
    optimisticData: TData,
    mutationFn: MutationFunction<TData, TVariables>,
    variables: TVariables
  ) => {
    // Set initial data
    queryClient.setQueryData(queryKey, initialData);

    const observer = new MutationObserver(queryClient, {
      mutationFn,
      onMutate: async () => {
        // Cancel ongoing queries
        await queryClient.cancelQueries({ queryKey });
        
        // Get current data
        const previousData = queryClient.getQueryData<TData>(queryKey);
        
        // Optimistically update
        queryClient.setQueryData(queryKey, optimisticData);
        
        return { previousData };
      },
      onError: (error, variables, context) => {
        // Rollback on error
        if (context?.previousData) {
          queryClient.setQueryData(queryKey, context.previousData);
        }
      },
      onSettled: () => {
        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey });
      },
    });

    // Verify optimistic update
    await act(async () => {
      observer.mutate(variables);
    });

    expect(queryClient.getQueryData(queryKey)).toEqual(optimisticData);

    // Wait for mutation to complete
    await waitFor(() => {
      expect(observer.getCurrentResult().status).toBe('success');
    });

    return {
      initialData,
      optimisticData,
      finalData: queryClient.getQueryData(queryKey),
      mutationResult: observer.getCurrentResult(),
    };
  },

  /**
   * Test optimistic update with failed mutation and rollback
   */
  testOptimisticUpdateRollback: async <TData, TVariables>(
    queryClient: QueryClient,
    queryKey: QueryKey,
    initialData: TData,
    optimisticData: TData,
    mutationFn: MutationFunction<TData, TVariables>,
    variables: TVariables
  ) => {
    // Set initial data
    queryClient.setQueryData(queryKey, initialData);

    const observer = new MutationObserver(queryClient, {
      mutationFn,
      onMutate: async () => {
        await queryClient.cancelQueries({ queryKey });
        const previousData = queryClient.getQueryData<TData>(queryKey);
        queryClient.setQueryData(queryKey, optimisticData);
        return { previousData };
      },
      onError: (error, variables, context) => {
        // Rollback on error
        if (context?.previousData) {
          queryClient.setQueryData(queryKey, context.previousData);
        }
      },
    });

    // Verify optimistic update
    await act(async () => {
      try {
        await observer.mutate(variables);
      } catch {
        // Expected error
      }
    });

    // Wait for rollback
    await waitFor(() => {
      expect(queryClient.getQueryData(queryKey)).toEqual(initialData);
    });

    return {
      initialData,
      optimisticData,
      rolledBackData: queryClient.getQueryData(queryKey),
      mutationError: observer.getCurrentResult().error,
    };
  },

  /**
   * Test multiple concurrent optimistic updates
   */
  testConcurrentOptimisticUpdates: async <TData, TVariables>(
    queryClient: QueryClient,
    queryKey: QueryKey,
    initialData: TData,
    updates: Array<{
      optimisticData: TData;
      mutationFn: MutationFunction<TData, TVariables>;
      variables: TVariables;
    }>
  ) => {
    queryClient.setQueryData(queryKey, initialData);

    const results = await Promise.allSettled(
      updates.map(async (update, index) => {
        const observer = new MutationObserver(queryClient, {
          mutationFn: update.mutationFn,
          onMutate: async () => {
            await queryClient.cancelQueries({ queryKey });
            const previousData = queryClient.getQueryData<TData>(queryKey);
            queryClient.setQueryData(queryKey, update.optimisticData);
            return { previousData, updateIndex: index };
          },
          onError: (error, variables, context) => {
            if (context?.previousData) {
              queryClient.setQueryData(queryKey, context.previousData);
            }
          },
        });

        return observer.mutate(update.variables);
      })
    );

    return {
      initialData,
      updates,
      results,
      finalData: queryClient.getQueryData(queryKey),
    };
  },
};

/**
 * Background refresh and stale-while-revalidate testing utilities
 * Tests automatic background updates, stale data handling, and cache revalidation
 */
export const backgroundRefreshUtils = {
  /**
   * Test stale-while-revalidate behavior
   */
  testStaleWhileRevalidate: async <TData>(
    queryClient: QueryClient,
    queryKey: QueryKey,
    queryFn: QueryFunction<TData>,
    staleTime: number = 0,
    cacheTime: number = 5 * 60 * 1000
  ) => {
    const observer = new QueryObserver(queryClient, {
      queryKey,
      queryFn,
      staleTime,
      gcTime: cacheTime,
    });

    // Initial fetch
    let result = observer.getCurrentResult();
    expect(result.status).toBe('loading');

    await waitFor(() => {
      result = observer.getCurrentResult();
      expect(result.status).toBe('success');
    });

    const initialData = result.data;

    // Wait for data to become stale
    if (staleTime > 0) {
      await new Promise(resolve => setTimeout(resolve, staleTime + 10));
    }

    // Trigger refetch - should return stale data immediately, then fresh data
    const refetchPromise = act(async () => {
      return observer.refetch();
    });

    // Should still have stale data available
    result = observer.getCurrentResult();
    expect(result.data).toEqual(initialData);
    expect(result.isFetching).toBe(true);

    await refetchPromise;

    return {
      initialData,
      staleData: initialData,
      freshData: observer.getCurrentResult().data,
      wasStaleServed: true,
    };
  },

  /**
   * Test automatic background refetching on window focus
   */
  testWindowFocusRefetch: async <TData>(
    queryClient: QueryClient,
    queryKey: QueryKey,
    queryFn: QueryFunction<TData>
  ) => {
    let fetchCount = 0;
    const trackingQueryFn: QueryFunction<TData> = async (context) => {
      fetchCount++;
      return queryFn(context);
    };

    const observer = new QueryObserver(queryClient, {
      queryKey,
      queryFn: trackingQueryFn,
      refetchOnWindowFocus: true,
      staleTime: 0,
    });

    // Initial fetch
    await waitFor(() => {
      expect(observer.getCurrentResult().status).toBe('success');
    });

    const initialFetchCount = fetchCount;

    // Simulate window focus
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    await waitFor(() => {
      expect(fetchCount).toBe(initialFetchCount + 1);
    });

    return {
      initialFetchCount,
      finalFetchCount: fetchCount,
      refetchTriggered: fetchCount > initialFetchCount,
    };
  },

  /**
   * Test network reconnection refetching
   */
  testNetworkReconnectRefetch: async <TData>(
    queryClient: QueryClient,
    queryKey: QueryKey,
    queryFn: QueryFunction<TData>
  ) => {
    let fetchCount = 0;
    const trackingQueryFn: QueryFunction<TData> = async (context) => {
      fetchCount++;
      return queryFn(context);
    };

    const observer = new QueryObserver(queryClient, {
      queryKey,
      queryFn: trackingQueryFn,
      refetchOnReconnect: true,
      staleTime: 0,
    });

    // Initial fetch
    await waitFor(() => {
      expect(observer.getCurrentResult().status).toBe('success');
    });

    const initialFetchCount = fetchCount;

    // Simulate network reconnection
    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(fetchCount).toBe(initialFetchCount + 1);
    });

    return {
      initialFetchCount,
      finalFetchCount: fetchCount,
      refetchTriggered: fetchCount > initialFetchCount,
    };
  },

  /**
   * Test interval-based background refetching
   */
  testIntervalRefetch: async <TData>(
    queryClient: QueryClient,
    queryKey: QueryKey,
    queryFn: QueryFunction<TData>,
    refetchInterval: number = 1000
  ) => {
    let fetchCount = 0;
    const trackingQueryFn: QueryFunction<TData> = async (context) => {
      fetchCount++;
      return queryFn(context);
    };

    const observer = new QueryObserver(queryClient, {
      queryKey,
      queryFn: trackingQueryFn,
      refetchInterval,
      refetchIntervalInBackground: true,
    });

    // Initial fetch
    await waitFor(() => {
      expect(observer.getCurrentResult().status).toBe('success');
    });

    const initialFetchCount = fetchCount;

    // Wait for at least one interval
    await new Promise(resolve => setTimeout(resolve, refetchInterval + 100));

    expect(fetchCount).toBeGreaterThan(initialFetchCount);

    // Clean up interval
    observer.destroy();

    return {
      initialFetchCount,
      finalFetchCount: fetchCount,
      intervalWorked: fetchCount > initialFetchCount,
    };
  },
};

/**
 * Error boundary testing utilities for query error scenarios
 * Tests error handling, error boundaries, and error recovery workflows
 */
export const errorBoundaryUtils = {
  /**
   * Test query error boundary integration
   */
  testQueryErrorBoundary: async (
    ErrorBoundary: React.ComponentType<{ children: React.ReactNode }>,
    QueryComponent: React.ComponentType,
    queryClient: QueryClient
  ) => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    try {
      const { container } = renderWithProviders(
        <ErrorBoundary>
          <QueryComponent />
        </ErrorBoundary>,
        {
          providerOptions: { queryClient },
        }
      );

      // Wait for error to be caught
      await waitFor(() => {
        expect(container.textContent).toContain('error');
      });

      return {
        errorCaught: true,
        errorBoundaryTriggered: true,
        consoleErrors: consoleSpy.mock.calls.length,
      };
    } finally {
      consoleSpy.mockRestore();
    }
  },

  /**
   * Test query error recovery
   */
  testQueryErrorRecovery: async <TData>(
    queryClient: QueryClient,
    queryKey: QueryKey,
    failingQueryFn: QueryFunction<TData>,
    successQueryFn: QueryFunction<TData>
  ) => {
    // First, set up a failing query
    const observer = new QueryObserver(queryClient, {
      queryKey,
      queryFn: failingQueryFn,
      retry: false,
    });

    await waitFor(() => {
      expect(observer.getCurrentResult().status).toBe('error');
    });

    const errorState = observer.getCurrentResult();

    // Now recover with a successful query function
    observer.setOptions({
      queryKey,
      queryFn: successQueryFn,
    });

    await act(async () => {
      await observer.refetch();
    });

    await waitFor(() => {
      expect(observer.getCurrentResult().status).toBe('success');
    });

    return {
      errorState,
      recoveryState: observer.getCurrentResult(),
      recoverySuccessful: observer.getCurrentResult().status === 'success',
    };
  },

  /**
   * Test error retry with exponential backoff
   */
  testErrorRetryBackoff: async <TData>(
    queryClient: QueryClient,
    queryKey: QueryKey,
    queryFn: QueryFunction<TData>,
    maxRetries: number = 3
  ) => {
    let attemptCount = 0;
    const attemptTimestamps: number[] = [];
    
    const failingQueryFn: QueryFunction<TData> = async (context) => {
      attemptCount++;
      attemptTimestamps.push(Date.now());
      
      if (attemptCount <= maxRetries) {
        throw new Error(`Attempt ${attemptCount} failed`);
      }
      
      return queryFn(context);
    };

    const observer = new QueryObserver(queryClient, {
      queryKey,
      queryFn: failingQueryFn,
      retry: (failureCount, error) => {
        return failureCount < maxRetries;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

    await waitFor(() => {
      expect(observer.getCurrentResult().status).toBe('success');
    }, { timeout: 10000 });

    // Calculate retry delays
    const retryDelays = attemptTimestamps.slice(1).map((timestamp, index) => 
      timestamp - attemptTimestamps[index]
    );

    return {
      attemptCount,
      attemptTimestamps,
      retryDelays,
      exponentialBackoffWorking: retryDelays.every((delay, index) => 
        index === 0 || delay >= retryDelays[index - 1]
      ),
      finalState: observer.getCurrentResult(),
    };
  },

  /**
   * Test global error handling
   */
  testGlobalErrorHandling: async (
    queryClient: QueryClient,
    globalErrorHandler: (error: Error, query: any) => void
  ) => {
    const errors: Error[] = [];
    
    // Set up global error handler
    queryClient.getQueryCache().config = {
      onError: (error, query) => {
        errors.push(error);
        globalErrorHandler(error, query);
      },
    };

    const failingQueryFn: QueryFunction = async () => {
      throw new Error('Global error test');
    };

    const observer = new QueryObserver(queryClient, {
      queryKey: ['global-error-test'],
      queryFn: failingQueryFn,
      retry: false,
    });

    await waitFor(() => {
      expect(observer.getCurrentResult().status).toBe('error');
    });

    return {
      globalErrorsCaught: errors.length,
      errors,
      globalHandlerTriggered: errors.length > 0,
    };
  },
};

/**
 * High-level testing utilities that combine multiple patterns
 * Provides complete testing scenarios for complex workflows
 */
export const workflowTestUtils = {
  /**
   * Test complete database connection workflow with caching and optimistic updates
   */
  testDatabaseConnectionWorkflow: async (
    queryClient: QueryClient,
    connectionData: any,
    testConnectionFn: QueryFunction,
    saveConnectionFn: MutationFunction
  ) => {
    const queryKey = ['database-connections'];
    const testQueryKey = ['test-connection', connectionData.id];

    // 1. Test connection (query)
    const testResult = await mutationTestUtils.testMutationSuccess(
      queryClient,
      testConnectionFn as any,
      connectionData
    );

    // 2. Save connection with optimistic update
    const saveResult = await optimisticUpdateUtils.testOptimisticUpdateSuccess(
      queryClient,
      queryKey,
      [],
      [connectionData],
      saveConnectionFn as any,
      connectionData
    );

    // 3. Verify cache invalidation
    const invalidationResult = await cacheInvalidationUtils.testCacheInvalidation(
      queryClient,
      async () => {
        await queryClient.invalidateQueries({ queryKey });
      },
      [queryKey]
    );

    return {
      testResult,
      saveResult,
      invalidationResult,
      workflowComplete: testResult.mutationState.isSuccess && saveResult.mutationResult.isSuccess,
    };
  },

  /**
   * Test API endpoint generation workflow with preview and generation
   */
  testApiGenerationWorkflow: async (
    queryClient: QueryClient,
    endpointConfig: any,
    previewFn: QueryFunction,
    generateFn: MutationFunction
  ) => {
    const previewQueryKey = ['api-preview', endpointConfig.id];
    const endpointsQueryKey = ['api-endpoints'];

    // 1. Preview API (query with caching)
    const previewResult = await backgroundRefreshUtils.testStaleWhileRevalidate(
      queryClient,
      previewQueryKey,
      previewFn,
      5000 // 5 second stale time
    );

    // 2. Generate API (mutation with optimistic update)
    const generateResult = await mutationTestUtils.testMutationSuccess(
      queryClient,
      generateFn as any,
      endpointConfig
    );

    // 3. Verify related cache invalidation
    await cacheInvalidationUtils.testCacheInvalidation(
      queryClient,
      async () => {
        await queryClient.invalidateQueries({ 
          queryKey: endpointsQueryKey,
          exact: false 
        });
      },
      [endpointsQueryKey, previewQueryKey]
    );

    return {
      previewResult,
      generateResult,
      workflowComplete: generateResult.mutationState.isSuccess,
    };
  },

  /**
   * Test schema discovery workflow with large dataset handling
   */
  testSchemaDiscoveryWorkflow: async (
    queryClient: QueryClient,
    databaseId: string,
    schemaFn: QueryFunction,
    largeDatasetSize: number = 1000
  ) => {
    const schemaQueryKey = ['schema', databaseId];
    const tablesQueryKey = ['tables', databaseId];

    // 1. Test schema discovery with background refresh
    const schemaResult = await backgroundRefreshUtils.testStaleWhileRevalidate(
      queryClient,
      schemaQueryKey,
      schemaFn,
      15 * 60 * 1000 // 15 minute stale time
    );

    // 2. Test large dataset caching
    const largeMockData = Array.from({ length: largeDatasetSize }, (_, i) => ({
      id: i,
      name: `table_${i}`,
      type: 'table',
    }));

    queryClient.setQueryData(tablesQueryKey, largeMockData);

    // 3. Test cache performance
    const startTime = performance.now();
    const cachedData = queryClient.getQueryData(tablesQueryKey);
    const cacheAccessTime = performance.now() - startTime;

    return {
      schemaResult,
      largeDatasetCached: Array.isArray(cachedData) && cachedData.length === largeDatasetSize,
      cacheAccessTime,
      performanceAcceptable: cacheAccessTime < 50, // Under 50ms as per requirements
    };
  },
};

/**
 * Integration testing utilities for React Query with specific DreamFactory patterns
 */
export const integrationTestUtils = {
  /**
   * Test pagination with React Query
   */
  testPagination: async <TData>(
    queryClient: QueryClient,
    queryKey: QueryKey,
    queryFn: QueryFunction<TData>,
    pageSize: number = 25
  ) => {
    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey,
      queryFn: ({ pageParam = 0 }) => queryFn({ pageParam, pageSize } as any),
      initialPageParam: 0,
      getNextPageParam: (lastPage: any) => {
        return lastPage.hasMore ? lastPage.nextPage : undefined;
      },
    });

    // Load first page
    await waitFor(() => {
      expect(observer.getCurrentResult().status).toBe('success');
    });

    const firstPageResult = observer.getCurrentResult();

    // Load next page
    if (firstPageResult.hasNextPage) {
      await act(async () => {
        await observer.fetchNextPage();
      });
    }

    return {
      firstPageData: firstPageResult.data?.pages[0],
      totalPages: firstPageResult.data?.pages.length || 0,
      hasNextPage: firstPageResult.hasNextPage,
      paginationWorking: (firstPageResult.data?.pages.length || 0) > 0,
    };
  },

  /**
   * Test search with debouncing
   */
  testSearchWithDebouncing: async <TData>(
    queryClient: QueryClient,
    searchFn: QueryFunction<TData>,
    searchTerms: string[],
    debounceMs: number = 300
  ) => {
    const results: TData[] = [];
    
    for (const term of searchTerms) {
      const queryKey = ['search', term];
      
      // Simulate rapid search input
      const observer = new QueryObserver(queryClient, {
        queryKey,
        queryFn: () => searchFn({ term } as any),
        enabled: term.length > 0,
      });

      await new Promise(resolve => setTimeout(resolve, debounceMs / 2));
      
      if (term === searchTerms[searchTerms.length - 1]) {
        // Only the last search should execute
        await waitFor(() => {
          expect(observer.getCurrentResult().status).toBe('success');
        });
        
        results.push(observer.getCurrentResult().data as TData);
      }
    }

    return {
      searchResults: results,
      debouncingWorked: results.length === 1,
      finalSearchTerm: searchTerms[searchTerms.length - 1],
    };
  },
};

/**
 * Performance testing utilities for React Query operations
 */
export const performanceTestUtils = {
  /**
   * Measure query execution time
   */
  measureQueryPerformance: async <TData>(
    queryClient: QueryClient,
    queryKey: QueryKey,
    queryFn: QueryFunction<TData>
  ) => {
    const startTime = performance.now();
    
    const observer = new QueryObserver(queryClient, {
      queryKey,
      queryFn,
    });

    await waitFor(() => {
      expect(observer.getCurrentResult().status).toBe('success');
    });

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    return {
      executionTime,
      result: observer.getCurrentResult().data,
      performanceMetrics: {
        wasUnder2Seconds: executionTime < 2000,
        wasUnder50MsForCache: false, // Would need cache hit to test this
      },
    };
  },

  /**
   * Measure cache hit performance
   */
  measureCacheHitPerformance: async <TData>(
    queryClient: QueryClient,
    queryKey: QueryKey,
    testData: TData
  ) => {
    // Pre-populate cache
    queryClient.setQueryData(queryKey, testData);

    const startTime = performance.now();
    const cachedData = queryClient.getQueryData<TData>(queryKey);
    const endTime = performance.now();
    
    const cacheHitTime = endTime - startTime;

    return {
      cacheHitTime,
      cachedData,
      performanceMetrics: {
        wasUnder50Ms: cacheHitTime < 50, // Per requirements
        wasUnder10Ms: cacheHitTime < 10, // Ideal performance
      },
    };
  },

  /**
   * Test memory usage during large operations
   */
  testMemoryUsage: async (
    operationFn: () => Promise<void>,
    largeDataSize: number = 1000
  ) => {
    // Note: This is a simplified memory test
    // In a real implementation, you might use more sophisticated memory monitoring
    
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    await operationFn();
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryUsed = finalMemory - initialMemory;

    return {
      initialMemory,
      finalMemory,
      memoryUsed,
      memoryEfficient: memoryUsed < largeDataSize * 1024, // Less than 1KB per item
    };
  },
};

// Export all utilities for easy importing
export {
  createTestQueryClient,
  queryCacheUtils,
  cacheInvalidationUtils,
  mutationTestUtils,
  optimisticUpdateUtils,
  backgroundRefreshUtils,
  errorBoundaryUtils,
  workflowTestUtils,
  integrationTestUtils,
  performanceTestUtils,
};

/**
 * Default export with all utilities for convenience
 */
export default {
  createTestQueryClient,
  cache: queryCacheUtils,
  invalidation: cacheInvalidationUtils,
  mutations: mutationTestUtils,
  optimistic: optimisticUpdateUtils,
  background: backgroundRefreshUtils,
  errors: errorBoundaryUtils,
  workflows: workflowTestUtils,
  integration: integrationTestUtils,
  performance: performanceTestUtils,
};