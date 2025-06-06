/**
 * Database Connection Test Hook
 * 
 * Custom React hook that handles database connection testing using SWR for intelligent 
 * caching and automatic retries. Implements real-time connection validation with configurable 
 * timeout and error handling, providing connection status state management and test result 
 * data for React components.
 * 
 * Features:
 * - Real-time connection validation under 5 seconds per F-001-RQ-002
 * - SWR for connection testing and caching with automatic retry
 * - Support for multi-database types (MySQL, PostgreSQL, Oracle, MongoDB, Snowflake)
 * - TypeScript 5.8+ interface definitions for type safety
 * - Connection testing API integration with /{serviceName}/_table endpoint
 * - Exponential backoff retry logic for failed connections
 * - Connection state management for loading, success, error, and idle states
 * 
 * @fileoverview Connection test hook migrated from Angular HTTP to SWR-powered React hook
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import { useCallback, useRef, useState, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { 
  CONNECTION_TIMEOUTS, 
  DATABASE_SERVICE_SWR_CONFIG, 
  ERROR_CONFIG,
  API_ENDPOINTS 
} from '../constants';
import type {
  DatabaseConnectionFormData,
  ConnectionTestResult,
  ConnectionTestStatus,
  ConnectionTestInput,
  UseConnectionTestReturn,
  DatabaseService,
  ApiErrorResponse
} from '../types';

// =============================================================================
// HOOK CONFIGURATION AND TYPES
// =============================================================================

/**
 * Connection test hook options for customization
 */
export interface UseConnectionTestOptions {
  /** Service to test (for existing services) */
  service?: DatabaseService;
  
  /** Connection configuration to test (for new services) */
  config?: DatabaseConnectionFormData;
  
  /** Test timeout in milliseconds (default: 5000ms per F-001-RQ-002) */
  timeout?: number;
  
  /** Skip cache and force new test */
  skipCache?: boolean;
  
  /** Auto-test on mount */
  autoTest?: boolean;
  
  /** Auto-test on config change */
  autoTestOnChange?: boolean;
  
  /** Test debounce delay in milliseconds */
  debounceDelay?: number;
  
  /** Maximum retry attempts */
  maxRetries?: number;
  
  /** Base retry delay in milliseconds */
  retryDelay?: number;
  
  /** Enable test history tracking */
  enableHistory?: boolean;
  
  /** Maximum history entries to maintain */
  maxHistory?: number;
  
  /** Test success callback */
  onTestSuccess?: (result: ConnectionTestResult) => void;
  
  /** Test error callback */
  onTestError?: (error: string, result?: ConnectionTestResult) => void;
  
  /** Test start callback */
  onTestStart?: () => void;
  
  /** Test complete callback (success or error) */
  onTestComplete?: (result: ConnectionTestResult) => void;
}

/**
 * Internal connection test state management
 */
interface ConnectionTestState {
  /** Current test status */
  status: ConnectionTestStatus;
  
  /** Test start timestamp */
  startTime: number | null;
  
  /** Test end timestamp */
  endTime: number | null;
  
  /** Current retry attempt */
  retryAttempt: number;
  
  /** Test cancellation flag */
  cancelled: boolean;
  
  /** Abort controller for cancellation */
  abortController: AbortController | null;
}

/**
 * Connection test history entry
 */
interface ConnectionTestHistoryEntry extends ConnectionTestResult {
  /** Test execution timestamp */
  timestamp: string;
  
  /** Test configuration used */
  testConfig: ConnectionTestInput;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate SWR cache key for connection test
 */
function generateCacheKey(
  serviceId?: number, 
  config?: DatabaseConnectionFormData,
  skipCache?: boolean
): string | null {
  // Return null for no caching when skipCache is true
  if (skipCache) return null;
  
  if (serviceId) {
    return `connection-test-service-${serviceId}`;
  }
  
  if (config) {
    // Create a stable cache key based on connection parameters
    const cacheKey = {
      type: config.type,
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      // Don't include password in cache key for security
    };
    return `connection-test-config-${btoa(JSON.stringify(cacheKey))}`;
  }
  
  return null;
}

/**
 * Validate connection test input
 */
function validateTestInput(
  serviceId?: number,
  config?: DatabaseConnectionFormData
): { isValid: boolean; error?: string } {
  if (!serviceId && !config) {
    return { 
      isValid: false, 
      error: 'Either serviceId or config must be provided for connection testing' 
    };
  }
  
  if (config) {
    // Basic validation for required fields
    if (!config.type) {
      return { isValid: false, error: 'Database type is required' };
    }
    
    if (!config.host) {
      return { isValid: false, error: 'Host is required' };
    }
    
    if (!config.database) {
      return { isValid: false, error: 'Database name is required' };
    }
    
    if (!config.username) {
      return { isValid: false, error: 'Username is required' };
    }
    
    if (!config.password) {
      return { isValid: false, error: 'Password is required' };
    }
  }
  
  return { isValid: true };
}

/**
 * Create connection test input from options
 */
function createTestInput(
  serviceId?: number,
  config?: DatabaseConnectionFormData,
  timeout: number = CONNECTION_TIMEOUTS.CONNECTION_TEST
): ConnectionTestInput {
  return {
    serviceId,
    config,
    timeout,
    skipCache: false
  };
}

/**
 * Calculate exponential backoff delay
 */
function calculateRetryDelay(attempt: number, baseDelay: number): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
}

// =============================================================================
// CONNECTION TEST FETCHER FUNCTION
// =============================================================================

/**
 * SWR fetcher function for connection testing
 * Implements the /{serviceName}/_table endpoint pattern per F-001 specification
 */
async function connectionTestFetcher([key, testInput]: [string, ConnectionTestInput]): Promise<ConnectionTestResult> {
  const { serviceId, config, timeout = CONNECTION_TIMEOUTS.CONNECTION_TEST } = testInput;
  
  try {
    const startTime = Date.now();
    
    let response: any;
    
    if (serviceId) {
      // Test existing service by attempting to fetch table list
      // Uses /{serviceName}/_table endpoint per API specification
      response = await apiClient.get(
        `/${serviceId}/_table?limit=1`,
        { 
          timeout,
          retries: 0 // No automatic retries in fetcher, handled by hook
        }
      );
    } else if (config) {
      // Test new service configuration via connection test endpoint
      response = await apiClient.post(
        API_ENDPOINTS.connectionTest,
        testInput,
        { 
          timeout,
          retries: 0
        }
      );
    } else {
      throw new Error('Invalid test configuration');
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Validate that connection test met the 5-second requirement
    if (duration > CONNECTION_TIMEOUTS.CONNECTION_TEST) {
      console.warn(
        `Connection test exceeded ${CONNECTION_TIMEOUTS.CONNECTION_TEST}ms requirement: ${duration}ms`
      );
    }
    
    // Construct successful test result
    const result: ConnectionTestResult = {
      success: true,
      status: 'success',
      message: 'Connection test successful',
      duration,
      timestamp: new Date().toISOString(),
      metadata: {
        responseTime: duration,
        endpoint: serviceId ? `/${serviceId}/_table` : API_ENDPOINTS.connectionTest,
        method: serviceId ? 'GET' : 'POST',
        statusCode: 200
      }
    };
    
    return result;
    
  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - Date.now();
    
    // Handle different types of connection errors
    let errorMessage = 'Connection test failed';
    let errorCode = 'CONNECTION_ERROR';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Connection test was cancelled';
      errorCode = 'TEST_CANCELLED';
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Connection test timed out';
      errorCode = ERROR_CONFIG.connectionErrors.timeoutErrorCode;
    } else if (error.message?.includes('authentication') || error.message?.includes('auth')) {
      errorMessage = 'Authentication failed';
      errorCode = ERROR_CONFIG.connectionErrors.authErrorCode;
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorMessage = 'Network error occurred';
      errorCode = ERROR_CONFIG.connectionErrors.networkErrorCode;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Construct failed test result
    const result: ConnectionTestResult = {
      success: false,
      status: 'error',
      message: errorMessage,
      error: {
        code: errorCode,
        message: errorMessage,
        details: error
      },
      duration,
      timestamp: new Date().toISOString(),
      metadata: {
        responseTime: duration,
        endpoint: serviceId ? `/${serviceId}/_table` : API_ENDPOINTS.connectionTest,
        method: serviceId ? 'GET' : 'POST',
        statusCode: error.status || 0
      }
    };
    
    // Don't throw error, return failed result for proper SWR handling
    return result;
  }
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Custom React hook for database connection testing
 * 
 * Provides comprehensive connection testing capabilities with SWR caching,
 * automatic retries, and state management. Supports both existing services
 * and new configuration testing.
 * 
 * @param options - Configuration options for the hook
 * @returns Hook interface with test functions and state
 */
export function useConnectionTest(options: UseConnectionTestOptions = {}): UseConnectionTestReturn {
  const {
    service,
    config,
    timeout = CONNECTION_TIMEOUTS.CONNECTION_TEST,
    skipCache = false,
    autoTest = false,
    autoTestOnChange = false,
    debounceDelay = 1000,
    maxRetries = ERROR_CONFIG.connectionErrors.retryAttempts,
    retryDelay = ERROR_CONFIG.connectionErrors.retryDelay,
    enableHistory = false,
    maxHistory = 10,
    onTestSuccess,
    onTestError,
    onTestStart,
    onTestComplete
  } = options;
  
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [state, setState] = useState<ConnectionTestState>({
    status: 'idle',
    startTime: null,
    endTime: null,
    retryAttempt: 0,
    cancelled: false,
    abortController: null
  });
  
  const [history, setHistory] = useState<ConnectionTestHistoryEntry[]>([]);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const { mutate } = useSWRConfig();
  
  // =============================================================================
  // SWR CONFIGURATION
  // =============================================================================
  
  const serviceId = service?.id;
  const testInput = useMemo(() => createTestInput(serviceId, config, timeout), [serviceId, config, timeout]);
  const cacheKey = useMemo(() => generateCacheKey(serviceId, config, skipCache), [serviceId, config, skipCache]);
  const swrKey = cacheKey ? [cacheKey, testInput] : null;
  
  // Configure SWR with connection test specific settings
  const swrConfig = {
    ...DATABASE_SERVICE_SWR_CONFIG.connectionTest,
    revalidateOnMount: autoTest,
    revalidateOnFocus: false, // Manual testing only
    revalidateOnReconnect: false,
    shouldRetryOnError: false, // Handle retries manually
    dedupingInterval: 1000, // 1 second deduplication
  };
  
  // SWR hook for connection testing
  const { 
    data: result, 
    error: swrError, 
    isLoading, 
    isValidating,
    mutate: mutateTest 
  } = useSWR(
    swrKey,
    connectionTestFetcher,
    swrConfig
  );
  
  // =============================================================================
  // RETRY LOGIC WITH REACT QUERY MUTATION
  // =============================================================================
  
  const connectionTestMutation = useMutation({
    mutationFn: async (input: ConnectionTestInput): Promise<ConnectionTestResult> => {
      const validation = validateTestInput(input.serviceId, input.config);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      
      return connectionTestFetcher([generateCacheKey(input.serviceId, input.config) || 'manual-test', input]);
    },
    retry: false, // Handle retries manually for better control
    onMutate: () => {
      onTestStart?.();
      setState(prev => ({
        ...prev,
        status: 'testing',
        startTime: Date.now(),
        endTime: null,
        cancelled: false,
        abortController: new AbortController()
      }));
    },
    onSuccess: (result: ConnectionTestResult) => {
      setState(prev => ({
        ...prev,
        status: result.success ? 'success' : 'error',
        endTime: Date.now(),
        retryAttempt: 0,
        abortController: null
      }));
      
      // Add to history if enabled
      if (enableHistory) {
        const historyEntry: ConnectionTestHistoryEntry = {
          ...result,
          timestamp: new Date().toISOString(),
          testConfig: testInput
        };
        
        setHistory(prev => {
          const newHistory = [historyEntry, ...prev];
          return newHistory.slice(0, maxHistory);
        });
      }
      
      // Update SWR cache if using cached key
      if (cacheKey) {
        mutate([cacheKey, testInput], result, false);
      }
      
      // Trigger callbacks
      if (result.success) {
        onTestSuccess?.(result);
      } else {
        onTestError?.(result.message, result);
      }
      onTestComplete?.(result);
    },
    onError: (error: Error) => {
      setState(prev => ({
        ...prev,
        status: 'error',
        endTime: Date.now(),
        abortController: null
      }));
      
      onTestError?.(error.message);
      onTestComplete?.({
        success: false,
        status: 'error',
        message: error.message,
        duration: Date.now() - (state.startTime || Date.now()),
        timestamp: new Date().toISOString(),
        error: {
          code: 'MUTATION_ERROR',
          message: error.message,
          details: error
        }
      });
    }
  });
  
  // =============================================================================
  // CONNECTION TEST FUNCTION WITH RETRY LOGIC
  // =============================================================================
  
  const testConnection = useCallback(async (
    overrideConfig?: DatabaseConnectionFormData
  ): Promise<ConnectionTestResult> => {
    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    const configToTest = overrideConfig || config;
    const input = createTestInput(serviceId, configToTest, timeout);
    
    // Validate input
    const validation = validateTestInput(input.serviceId, input.config);
    if (!validation.isValid) {
      const errorResult: ConnectionTestResult = {
        success: false,
        status: 'error',
        message: validation.error!,
        duration: 0,
        timestamp: new Date().toISOString(),
        error: {
          code: ERROR_CONFIG.connectionErrors.configErrorCode,
          message: validation.error!,
          details: null
        }
      };
      
      onTestError?.(validation.error!);
      return errorResult;
    }
    
    // Reset retry attempt counter
    setState(prev => ({ ...prev, retryAttempt: 0 }));
    
    // Retry logic with exponential backoff
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setState(prev => ({ ...prev, retryAttempt: attempt }));
        
        const result = await connectionTestMutation.mutateAsync(input);
        return result;
        
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on the last attempt
        if (attempt < maxRetries) {
          const delay = calculateRetryDelay(attempt, retryDelay);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    const errorResult: ConnectionTestResult = {
      success: false,
      status: 'error',
      message: lastError?.message || 'Connection test failed after retries',
      duration: Date.now() - (state.startTime || Date.now()),
      timestamp: new Date().toISOString(),
      error: {
        code: 'MAX_RETRIES_EXCEEDED',
        message: `Connection test failed after ${maxRetries} retries`,
        details: lastError
      }
    };
    
    return errorResult;
    
  }, [serviceId, config, timeout, maxRetries, retryDelay, connectionTestMutation, state.startTime, onTestError]);
  
  // =============================================================================
  // DEBOUNCED TEST FUNCTION
  // =============================================================================
  
  const testConnectionDebounced = useCallback((
    overrideConfig?: DatabaseConnectionFormData
  ): Promise<ConnectionTestResult> => {
    return new Promise((resolve, reject) => {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Set new timeout
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await testConnection(overrideConfig);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, debounceDelay);
    });
  }, [testConnection, debounceDelay]);
  
  // =============================================================================
  // CANCELLATION FUNCTION
  // =============================================================================
  
  const cancel = useCallback(() => {
    if (state.abortController) {
      state.abortController.abort();
    }
    
    setState(prev => ({
      ...prev,
      status: 'idle',
      cancelled: true,
      abortController: null
    }));
    
    connectionTestMutation.reset();
  }, [state.abortController, connectionTestMutation]);
  
  // =============================================================================
  // HISTORY MANAGEMENT
  // =============================================================================
  
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);
  
  const retry = useCallback(async (): Promise<ConnectionTestResult> => {
    if (!result || result.success) {
      throw new Error('Cannot retry successful test');
    }
    
    return testConnection();
  }, [result, testConnection]);
  
  // =============================================================================
  // DERIVED STATE
  // =============================================================================
  
  const isTesting = isLoading || isValidating || connectionTestMutation.isPending || state.status === 'testing';
  const canCancel = isTesting && !state.cancelled;
  const canRetry = result && !result.success && !isTesting;
  const duration = state.startTime && state.endTime ? state.endTime - state.startTime : null;
  const error = swrError || (result && !result.success ? new Error(result.message) : null);
  
  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================
  
  return {
    // Core test function
    testConnection,
    
    // Test state
    isTesting,
    result: result || null,
    error,
    
    // History management
    history: enableHistory ? history : [],
    clearHistory,
    
    // Cancellation
    cancel,
    canCancel,
    
    // Test duration
    duration,
    
    // Retry functionality
    retry,
    canRetry,
    retryCount: state.retryAttempt,
    
    // Debounced test function
    testConnectionDebounced
  };
}

// =============================================================================
// EXPORT TYPES AND UTILITIES
// =============================================================================

export type { UseConnectionTestOptions, ConnectionTestHistoryEntry };
export { generateCacheKey, validateTestInput, calculateRetryDelay };

// Default export
export default useConnectionTest;