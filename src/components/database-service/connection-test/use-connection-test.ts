/**
 * Database Connection Test Hook
 * 
 * Custom React hook that handles database connection testing using SWR for intelligent caching 
 * and automatic retries. Implements real-time connection validation with configurable timeout 
 * and error handling, providing connection status state management and test result data for 
 * React components.
 * 
 * @fileoverview SWR-powered connection testing hook for database services
 * @version 1.0.0
 * @since 2024-01-01
 */

import { useCallback, useState, useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import type { 
  DatabaseConfig, 
  ConnectionTestResult, 
  ConnectionTestStatus, 
  ApiErrorResponse,
  ConnectionMetadata 
} from '../types';
import { 
  CONNECTION_TIMEOUTS, 
  CONNECTION_RETRY_CONFIG, 
  DATABASE_SERVICE_ENDPOINTS,
  DATABASE_SERVICE_SWR_CONFIG,
  DATABASE_ERROR_MESSAGES 
} from '../constants';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Connection test hook configuration options
 */
export interface UseConnectionTestOptions {
  /** Enable automatic retry on failure */
  enableRetry?: boolean;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial retry delay in milliseconds */
  retryDelay?: number;
  /** Retry backoff multiplier */
  backoffMultiplier?: number;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Enable SWR caching */
  enableCache?: boolean;
  /** SWR cache key prefix */
  cacheKeyPrefix?: string;
  /** Callback for successful connection tests */
  onSuccess?: (result: ConnectionTestResult) => void;
  /** Callback for failed connection tests */
  onError?: (error: ApiErrorResponse) => void;
}

/**
 * Connection test hook return interface
 */
export interface UseConnectionTestReturn {
  /** Execute connection test with provided config */
  testConnection: (config: DatabaseConfig) => Promise<ConnectionTestResult>;
  /** Current connection test result */
  result: ConnectionTestResult | null;
  /** Loading state indicator */
  isLoading: boolean;
  /** Error state */
  error: ApiErrorResponse | null;
  /** Current connection test status */
  status: ConnectionTestStatus;
  /** Reset hook state */
  reset: () => void;
  /** Retry last failed connection test */
  retry: () => Promise<ConnectionTestResult | null>;
  /** Cancel ongoing connection test */
  cancel: () => void;
  /** Test duration in milliseconds */
  testDuration: number | null;
  /** Number of retry attempts made */
  retryCount: number;
}

/**
 * Connection test request payload
 */
interface ConnectionTestRequest {
  config: DatabaseConfig;
  timeout?: number;
  validateSchema?: boolean;
}

/**
 * Connection test response from API
 */
interface ConnectionTestResponse {
  success: boolean;
  message: string;
  details?: string;
  metadata?: ConnectionMetadata;
  errorCode?: string;
  testDuration: number;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Creates a unique cache key for connection test results
 */
const createCacheKey = (config: DatabaseConfig, prefix = 'connection-test'): string => {
  const configHash = btoa(JSON.stringify({
    driver: config.driver,
    host: config.host,
    port: config.port,
    database: config.database,
    username: config.username,
    // Exclude password from cache key for security
    ssl: config.ssl?.enabled,
    options: config.options
  }));
  
  return `${prefix}:${configHash}`;
};

/**
 * Validates database configuration before testing
 */
const validateConnectionConfig = (config: DatabaseConfig): string | null => {
  if (!config.driver) {
    return 'Database driver is required';
  }
  
  if (!config.host && config.driver !== 'sqlite') {
    return 'Host is required for this database type';
  }
  
  if (!config.database) {
    return 'Database name is required';
  }
  
  if (!config.username && config.driver !== 'sqlite') {
    return 'Username is required for this database type';
  }
  
  return null;
};

/**
 * Implements exponential backoff delay calculation
 */
const calculateBackoffDelay = (
  attempt: number, 
  baseDelay: number, 
  multiplier: number, 
  maxDelay: number
): number => {
  const delay = baseDelay * Math.pow(multiplier, attempt);
  return Math.min(delay, maxDelay);
};

/**
 * Creates an AbortController with timeout
 */
const createTimeoutController = (timeoutMs: number): AbortController => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort('Connection test timeout');
  }, timeoutMs);
  
  // Clear timeout if request completes normally
  controller.signal.addEventListener('abort', () => {
    clearTimeout(timeoutId);
  });
  
  return controller;
};

// =============================================================================
// API CLIENT FUNCTIONS
// =============================================================================

/**
 * Executes connection test via DreamFactory API
 */
const executeConnectionTest = async (
  config: DatabaseConfig, 
  options: { timeout?: number; signal?: AbortSignal } = {}
): Promise<ConnectionTestResponse> => {
  const startTime = Date.now();
  const timeout = options.timeout || CONNECTION_TIMEOUTS.CONNECTION_TEST;
  
  // Create request payload
  const requestPayload: ConnectionTestRequest = {
    config,
    timeout,
    validateSchema: false // Just test connection, not full schema
  };
  
  try {
    // Test connection by attempting to list tables (minimal operation)
    // Using the /{serviceName}/_table endpoint pattern per requirements
    const testServiceName = `test-${Date.now()}`;
    const testEndpoint = `${DATABASE_SERVICE_ENDPOINTS.BASE_URL}/${testServiceName}/_table`;
    
    // For connection testing, we use the service test endpoint instead
    const response = await fetch(DATABASE_SERVICE_ENDPOINTS.SERVICE_TEST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestPayload),
      signal: options.signal
    });
    
    const testDuration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    
    // Transform response to match expected format
    const result: ConnectionTestResponse = {
      success: true,
      message: responseData.message || 'Connection successful',
      details: responseData.details,
      metadata: responseData.metadata,
      testDuration
    };
    
    return result;
    
  } catch (error: any) {
    const testDuration = Date.now() - startTime;
    
    // Handle different error types
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      throw {
        success: false,
        message: DATABASE_ERROR_MESSAGES.connection.timeout,
        errorCode: 'CONNECTION_TIMEOUT',
        testDuration
      } as ConnectionTestResponse;
    }
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connect ECONNREFUSED')) {
      throw {
        success: false,
        message: DATABASE_ERROR_MESSAGES.connection.refused,
        errorCode: 'CONNECTION_REFUSED',
        testDuration
      } as ConnectionTestResponse;
    }
    
    if (error.message.includes('authentication') || error.message.includes('auth')) {
      throw {
        success: false,
        message: DATABASE_ERROR_MESSAGES.connection.authentication,
        errorCode: 'AUTHENTICATION_FAILED',
        testDuration
      } as ConnectionTestResponse;
    }
    
    if (error.message.includes('database') && error.message.includes('not found')) {
      throw {
        success: false,
        message: DATABASE_ERROR_MESSAGES.connection.database,
        errorCode: 'DATABASE_NOT_FOUND',
        testDuration
      } as ConnectionTestResponse;
    }
    
    // Generic error
    throw {
      success: false,
      message: error.message || DATABASE_ERROR_MESSAGES.connection.unknown,
      details: error.stack,
      errorCode: 'UNKNOWN_ERROR',
      testDuration
    } as ConnectionTestResponse;
  }
};

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Database Connection Test Hook
 * 
 * Provides real-time database connection testing with SWR caching, automatic retries,
 * and comprehensive error handling. Optimized for sub-5-second connection validation
 * per F-001-RQ-002 functional requirements.
 * 
 * @param options - Configuration options for the hook behavior
 * @returns Hook interface with connection testing capabilities
 */
export const useConnectionTest = (
  options: UseConnectionTestOptions = {}
): UseConnectionTestReturn => {
  // Destructure options with defaults
  const {
    enableRetry = true,
    maxRetries = CONNECTION_RETRY_CONFIG.maxRetries,
    retryDelay = CONNECTION_RETRY_CONFIG.retryDelay,
    backoffMultiplier = CONNECTION_RETRY_CONFIG.backoffMultiplier,
    timeout = CONNECTION_TIMEOUTS.CONNECTION_TEST,
    enableCache = true,
    cacheKeyPrefix = 'connection-test',
    onSuccess,
    onError
  } = options;
  
  // Local state management
  const [status, setStatus] = useState<ConnectionTestStatus>('idle');
  const [result, setResult] = useState<ConnectionTestResult | null>(null);
  const [error, setError] = useState<ApiErrorResponse | null>(null);
  const [testDuration, setTestDuration] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Refs for managing async operations
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastConfigRef = useRef<DatabaseConfig | null>(null);
  
  // SWR configuration
  const { mutate } = useSWRConfig();
  
  /**
   * Resets all hook state to initial values
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
    setTestDuration(null);
    setRetryCount(0);
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('Reset called');
      abortControllerRef.current = null;
    }
    
    lastConfigRef.current = null;
  }, []);
  
  /**
   * Cancels ongoing connection test
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('User cancelled');
      abortControllerRef.current = null;
    }
    
    setStatus('idle');
  }, []);
  
  /**
   * Executes connection test with retry logic
   */
  const executeTestWithRetry = useCallback(async (
    config: DatabaseConfig,
    attempt = 0
  ): Promise<ConnectionTestResponse> => {
    try {
      // Create abort controller with timeout
      const controller = createTimeoutController(timeout);
      abortControllerRef.current = controller;
      
      const response = await executeConnectionTest(config, {
        timeout,
        signal: controller.signal
      });
      
      return response;
      
    } catch (error: any) {
      // If retry is enabled and we haven't exceeded max attempts
      if (enableRetry && attempt < maxRetries && error.errorCode !== 'USER_CANCELLED') {
        const delay = calculateBackoffDelay(attempt, retryDelay, backoffMultiplier, CONNECTION_RETRY_CONFIG.maxRetryDelay);
        
        // Wait for backoff delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Increment retry count
        setRetryCount(prev => prev + 1);
        
        // Retry the connection test
        return executeTestWithRetry(config, attempt + 1);
      }
      
      // Max retries exceeded or retry disabled
      throw error;
    }
  }, [enableRetry, maxRetries, retryDelay, backoffMultiplier, timeout]);
  
  /**
   * Main connection test function
   */
  const testConnection = useCallback(async (config: DatabaseConfig): Promise<ConnectionTestResult> => {
    // Validate configuration
    const validationError = validateConnectionConfig(config);
    if (validationError) {
      const error: ApiErrorResponse = {
        error: {
          code: 400,
          message: validationError,
          context: 'configuration_validation'
        }
      };
      setError(error);
      setStatus('error');
      onError?.(error);
      throw error;
    }
    
    // Reset state for new test
    setError(null);
    setResult(null);
    setRetryCount(0);
    setStatus('testing');
    
    // Store config for retry functionality
    lastConfigRef.current = config;
    
    const startTime = Date.now();
    
    try {
      const response = await executeTestWithRetry(config);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Create successful result
      const testResult: ConnectionTestResult = {
        success: true,
        message: response.message,
        details: response.details,
        testDuration: duration,
        timestamp: new Date().toISOString(),
        metadata: response.metadata
      };
      
      // Update state
      setResult(testResult);
      setStatus('success');
      setTestDuration(duration);
      
      // Update cache if enabled
      if (enableCache) {
        const cacheKey = createCacheKey(config, cacheKeyPrefix);
        mutate(cacheKey, testResult, false);
      }
      
      // Trigger success callback
      onSuccess?.(testResult);
      
      return testResult;
      
    } catch (error: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Create error result
      const apiError: ApiErrorResponse = {
        error: {
          code: error.errorCode === 'CONNECTION_TIMEOUT' ? 408 : 500,
          message: error.message || DATABASE_ERROR_MESSAGES.connection.unknown,
          context: error.errorCode || 'unknown_error',
          details: error.details ? [error.details] : undefined
        }
      };
      
      const testResult: ConnectionTestResult = {
        success: false,
        message: error.message || DATABASE_ERROR_MESSAGES.connection.unknown,
        details: error.details,
        testDuration: duration,
        timestamp: new Date().toISOString(),
        errorCode: error.errorCode
      };
      
      // Update state
      setError(apiError);
      setResult(testResult);
      setStatus('error');
      setTestDuration(duration);
      
      // Trigger error callback
      onError?.(apiError);
      
      throw testResult;
    } finally {
      // Clean up abort controller
      abortControllerRef.current = null;
    }
  }, [executeTestWithRetry, enableCache, cacheKeyPrefix, mutate, onSuccess, onError]);
  
  /**
   * Retries the last failed connection test
   */
  const retry = useCallback(async (): Promise<ConnectionTestResult | null> => {
    if (!lastConfigRef.current) {
      return null;
    }
    
    return testConnection(lastConfigRef.current);
  }, [testConnection]);
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('Component unmounted');
      }
    };
  }, []);
  
  return {
    testConnection,
    result,
    isLoading: status === 'testing',
    error,
    status,
    reset,
    retry,
    cancel,
    testDuration,
    retryCount
  };
};

// =============================================================================
// ADDITIONAL HOOKS FOR SPECIFIC USE CASES
// =============================================================================

/**
 * Hook for testing connection with SWR caching
 * Provides cached connection test results with automatic revalidation
 */
export const useConnectionTestWithCache = (
  config: DatabaseConfig | null,
  options: UseConnectionTestOptions & { 
    enabled?: boolean;
    refreshInterval?: number;
  } = {}
) => {
  const { enabled = true, refreshInterval = 0, ...hookOptions } = options;
  
  const cacheKey = config ? createCacheKey(config, options.cacheKeyPrefix) : null;
  
  const { testConnection, ...hookReturn } = useConnectionTest(hookOptions);
  
  // SWR for cached results
  const { data, error, isLoading, mutate } = useSWR(
    enabled && cacheKey ? cacheKey : null,
    () => config ? testConnection(config) : null,
    {
      ...DATABASE_SERVICE_SWR_CONFIG.connectionTest,
      refreshInterval,
      revalidateOnFocus: false,
      dedupingInterval: 5000, // 5 second deduplication
      shouldRetryOnError: false // Handle retries in the hook
    }
  );
  
  return {
    ...hookReturn,
    data,
    error: error || hookReturn.error,
    isLoading: isLoading || hookReturn.isLoading,
    mutate,
    testConnection
  };
};

/**
 * Hook for batch connection testing
 * Tests multiple database configurations concurrently
 */
export const useBatchConnectionTest = (options: UseConnectionTestOptions = {}) => {
  const [results, setResults] = useState<Map<string, ConnectionTestResult>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Map<string, ApiErrorResponse>>(new Map());
  
  const { testConnection } = useConnectionTest(options);
  
  const testMultipleConnections = useCallback(async (
    configs: Array<{ id: string; config: DatabaseConfig }>
  ): Promise<Map<string, ConnectionTestResult>> => {
    setIsLoading(true);
    setResults(new Map());
    setErrors(new Map());
    
    const testPromises = configs.map(async ({ id, config }) => {
      try {
        const result = await testConnection(config);
        return { id, result, error: null };
      } catch (error) {
        return { id, result: null, error: error as ConnectionTestResult };
      }
    });
    
    try {
      const responses = await Promise.allSettled(testPromises);
      const newResults = new Map<string, ConnectionTestResult>();
      const newErrors = new Map<string, ApiErrorResponse>();
      
      responses.forEach((response, index) => {
        const { id } = configs[index];
        
        if (response.status === 'fulfilled') {
          const { result, error } = response.value;
          if (result) {
            newResults.set(id, result);
          }
          if (error) {
            newErrors.set(id, {
              error: {
                code: 500,
                message: error.message,
                context: 'batch_test_error'
              }
            });
          }
        } else {
          newErrors.set(id, {
            error: {
              code: 500,
              message: response.reason?.message || 'Unknown error',
              context: 'batch_test_failure'
            }
          });
        }
      });
      
      setResults(newResults);
      setErrors(newErrors);
      
      return newResults;
      
    } finally {
      setIsLoading(false);
    }
  }, [testConnection]);
  
  return {
    testMultipleConnections,
    results,
    errors,
    isLoading
  };
};

// =============================================================================
// EXPORTS
// =============================================================================

export default useConnectionTest;

// Export types for external use
export type {
  UseConnectionTestOptions,
  UseConnectionTestReturn,
  ConnectionTestRequest,
  ConnectionTestResponse
};

// Export utility functions
export {
  createCacheKey,
  validateConnectionConfig,
  calculateBackoffDelay
};