/**
 * Core HTTP client implementation providing foundational request/response functionality
 * for all API operations in the DreamFactory Admin Interface.
 * 
 * Replaces Angular HttpClient with modern JavaScript fetch patterns optimized for 
 * React 19/Next.js 15.1 applications. Implements comprehensive middleware integration,
 * request configuration management, and enterprise-grade error handling.
 * 
 * Key Features:
 * - Native fetch API wrapper with async/await patterns
 * - Request configuration builder for headers, query parameters, pagination, and filtering
 * - Middleware chain integration for authentication, case transformation, and error handling
 * - Comprehensive error handling with retry logic and exponential backoff strategies
 * - Request timeout management and abort controller integration for cancellation
 * - Loading state integration and progress tracking for file operations
 * - Circuit breaker patterns for preventing cascade failures
 * - TypeScript-first design with comprehensive type safety
 * 
 * Compatible with React 19 concurrent features, Next.js 15.1 server-side rendering,
 * and modern JavaScript patterns including server components and edge runtime.
 * 
 * @module BaseClient
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 */

import {
  ApiClientConfig,
  ApiRequestConfig,
  ApiResponse,
  HttpMethod,
  RequestParams,
  AuthConfig,
  CacheConfig,
  ProgressConfig,
  RequestMetadata,
  ResponseStatus,
  ResponseMeta,
  TimingMeta,
  CacheMeta,
  PaginationMeta,
  HealthStatus,
  SessionManager,
  AuthProvider,
  FileService,
  FileUploadConfig,
  FileDownloadConfig,
  FileOperationResult,
  FileMetadata,
  FileUploadProgress,
  FileDownloadProgress,
  ProgressEvent,
  ProgressEventEmitter,
  ProgressEventListener,
  InterceptorPipeline,
  MiddlewareState,
  ApiClient,
  DEFAULT_CONFIG,
} from './types';

import {
  InterceptorPipeline as ConcreteInterceptorPipeline,
  createDefaultMiddlewareStack,
  createErrorFromResponse,
  HTTP_HEADERS,
  MIDDLEWARE_HEADERS,
  loadingStateManager,
  notificationManager,
} from './interceptors';

import type {
  AppError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  ServerError,
  ClientError,
  ErrorType,
  ErrorSeverity,
  ErrorCategory,
  RetryConfig,
  CircuitBreakerConfig,
} from '@/types/error';

import type {
  KeyValuePair,
  RequestOptions as LegacyRequestOptions,
} from '@/types/generic-http';

// =============================================================================
// Constants and Configuration
// =============================================================================

/**
 * Default request timeout in milliseconds
 */
const DEFAULT_TIMEOUT = 30000;

/**
 * Maximum number of redirect follows
 */
const MAX_REDIRECTS = 5;

/**
 * Default retry configuration for failed requests
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableNetworkErrors: ['TIMEOUT', 'NETWORK_ERROR', 'ECONNRESET'],
};

/**
 * Default circuit breaker configuration
 */
const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  enabled: true,
  failureThreshold: 5,
  recoveryTimeout: 60000,
  monitoringPeriod: 10000,
};

/**
 * Request header constants for middleware communication
 */
const INTERNAL_HEADERS = {
  REQUEST_ID: 'x-request-id',
  CORRELATION_ID: 'x-correlation-id',
  USER_AGENT: 'User-Agent',
  CONTENT_TYPE: 'Content-Type',
  ACCEPT: 'Accept',
} as const;

/**
 * Default headers for all requests
 */
const DEFAULT_HEADERS = {
  [INTERNAL_HEADERS.ACCEPT]: 'application/json',
  [INTERNAL_HEADERS.CONTENT_TYPE]: 'application/json',
  [INTERNAL_HEADERS.USER_AGENT]: 'DreamFactory-Admin-Interface/1.0.0',
} as const;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Generate unique request ID for tracking and correlation
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate correlation ID for request tracing
 */
function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Build URL with query parameters
 */
function buildUrl(baseUrl: string, path: string, params?: RequestParams): string {
  const url = new URL(path, baseUrl);
  
  if (params) {
    // Handle standard DreamFactory query parameters
    if (params.limit !== undefined) {
      url.searchParams.set('limit', String(params.limit));
    }
    if (params.offset !== undefined) {
      url.searchParams.set('offset', String(params.offset));
    }
    if (params.filter) {
      url.searchParams.set('filter', params.filter);
    }
    if (params.sort) {
      url.searchParams.set('sort', params.sort);
    }
    if (params.fields) {
      url.searchParams.set('fields', params.fields);
    }
    if (params.related) {
      url.searchParams.set('related', params.related);
    }
    if (params.includeCount) {
      url.searchParams.set('include_count', 'true');
    }
    if (params.includeSchema) {
      url.searchParams.set('include_schema', 'true');
    }
    
    // Handle custom parameters
    Object.entries(params).forEach(([key, value]) => {
      if (!['limit', 'offset', 'filter', 'sort', 'fields', 'related', 'includeCount', 'includeSchema'].includes(key)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    });
  }
  
  return url.toString();
}

/**
 * Normalize headers to lowercase keys for consistent handling
 */
function normalizeHeaders(headers?: Record<string, string>): Record<string, string> {
  if (!headers) return {};
  
  const normalized: Record<string, string> = {};
  Object.entries(headers).forEach(([key, value]) => {
    normalized[key.toLowerCase()] = value;
  });
  
  return normalized;
}

/**
 * Merge headers with precedence (later headers override earlier ones)
 */
function mergeHeaders(...headerSets: (Record<string, string> | undefined)[]): Record<string, string> {
  const result: Record<string, string> = {};
  
  headerSets.forEach(headers => {
    if (headers) {
      Object.entries(normalizeHeaders(headers)).forEach(([key, value]) => {
        result[key] = value;
      });
    }
  });
  
  return result;
}

/**
 * Convert legacy request options to modern API request config
 */
function convertLegacyOptions(options: LegacyRequestOptions): Partial<ApiRequestConfig> {
  return {
    params: {
      filter: options.filter,
      sort: options.sort,
      fields: options.fields,
      related: options.related,
      limit: options.limit,
      offset: options.offset,
      includeCount: options.includeCount,
    },
    headers: {
      ...(options.showSpinner ? { [MIDDLEWARE_HEADERS.SHOW_LOADING]: 'true' } : {}),
      ...(options.snackbarSuccess ? { [MIDDLEWARE_HEADERS.SNACKBAR_SUCCESS]: options.snackbarSuccess } : {}),
      ...(options.snackbarError ? { [MIDDLEWARE_HEADERS.SNACKBAR_ERROR]: options.snackbarError } : {}),
      ...(options.contentType ? { [INTERNAL_HEADERS.CONTENT_TYPE]: options.contentType } : {}),
      ...options.additionalHeaders?.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {}),
    },
  };
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate retry delay with exponential backoff and jitter
 */
function calculateRetryDelay(
  attempt: number,
  config: RetryConfig
): number {
  const delay = Math.min(
    config.initialDelay * Math.pow(config.backoffFactor, attempt - 1),
    config.maxDelay
  );
  
  if (config.jitter) {
    return delay * (0.5 + Math.random() * 0.5);
  }
  
  return delay;
}

/**
 * Check if error is retryable based on configuration
 */
function isRetryableError(error: any, config: RetryConfig): boolean {
  // Check for network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }
  
  // Check for timeout errors
  if (error.name === 'AbortError' && error.message.includes('timeout')) {
    return true;
  }
  
  // Check for retryable status codes
  if (error.status && config.retryableStatusCodes.includes(error.status)) {
    return true;
  }
  
  // Check for retryable network error types
  if (error.code && config.retryableNetworkErrors.includes(error.code)) {
    return true;
  }
  
  return false;
}

// =============================================================================
// Circuit Breaker Implementation
// =============================================================================

/**
 * Circuit breaker state management for preventing cascade failures
 */
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private nextAttemptTime = 0;

  constructor(private config: CircuitBreakerConfig) {}

  canMakeRequest(): boolean {
    if (!this.config.enabled) return true;
    
    const now = Date.now();
    
    switch (this.state) {
      case 'CLOSED':
        return true;
        
      case 'OPEN':
        if (now >= this.nextAttemptTime) {
          this.state = 'HALF_OPEN';
          return true;
        }
        return false;
        
      case 'HALF_OPEN':
        return true;
        
      default:
        return true;
    }
  }

  recordSuccess(): void {
    if (!this.config.enabled) return;
    
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  recordFailure(): void {
    if (!this.config.enabled) return;
    
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = this.lastFailureTime + this.config.recoveryTimeout;
    }
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}

// =============================================================================
// Request Timeout Controller
// =============================================================================

/**
 * Request timeout controller for managing request cancellation
 */
class TimeoutController {
  private abortController: AbortController;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(timeoutMs: number) {
    this.abortController = new AbortController();
    
    if (timeoutMs > 0) {
      this.timeoutId = setTimeout(() => {
        this.abortController.abort('Request timeout');
      }, timeoutMs);
    }
  }

  get signal(): AbortSignal {
    return this.abortController.signal;
  }

  abort(reason?: string): void {
    this.abortController.abort(reason);
    this.cleanup();
  }

  cleanup(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

// =============================================================================
// Progress Tracking Implementation
// =============================================================================

/**
 * Progress event emitter for file operations
 */
class ProgressTracker implements ProgressEventEmitter {
  private listeners = new Map<string, Set<ProgressEventListener>>();

  on(event: string, listener: ProgressEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: ProgressEventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit(event: string, data: ProgressEvent): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in progress event listener:', error);
        }
      });
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}

// =============================================================================
// Core Base Client Implementation
// =============================================================================

/**
 * Core HTTP client implementation using native fetch API
 */
export class BaseClient implements ApiClient {
  public readonly config: ApiClientConfig;
  public readonly session: SessionManager;
  public readonly auth: AuthProvider;
  public readonly files: FileService;
  public readonly middleware: InterceptorPipeline;

  private circuitBreaker: CircuitBreaker;
  private progressTracker: ProgressTracker;
  private activeRequests = new Map<string, TimeoutController>();
  private healthMetrics = {
    activeRequestCount: 0,
    errorCount: 0,
    successCount: 0,
    totalRequests: 0,
    responseTimes: [] as number[],
    lastErrorTime: 0,
  };

  constructor(config: ApiClientConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.circuitBreaker = new CircuitBreaker(this.config.circuitBreakerConfig);
    this.progressTracker = new ProgressTracker();
    this.middleware = createDefaultMiddlewareStack();
    
    // Initialize services (would be dependency injected in real implementation)
    this.session = this.createSessionManager();
    this.auth = this.createAuthProvider();
    this.files = this.createFileService();
  }

  /**
   * Make HTTP request with full configuration support
   */
  async request<T = any>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    // Generate request metadata
    const requestId = generateRequestId();
    const correlationId = config.metadata?.correlationId || generateCorrelationId();
    const startTime = Date.now();

    // Update health metrics
    this.healthMetrics.activeRequestCount++;
    this.healthMetrics.totalRequests++;

    // Check circuit breaker
    if (!this.circuitBreaker.canMakeRequest()) {
      const error: NetworkError = {
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.INFRASTRUCTURE,
        code: 'CIRCUIT_BREAKER_OPEN',
        message: 'Circuit breaker is open, request blocked',
        isRetryable: false,
        timestamp: new Date().toISOString(),
        userFacing: true,
        correlationId,
        context: {
          circuitBreakerState: this.circuitBreaker.getState(),
          failureCount: this.circuitBreaker.getFailureCount(),
        },
      };
      
      this.healthMetrics.activeRequestCount--;
      this.healthMetrics.errorCount++;
      this.healthMetrics.lastErrorTime = Date.now();
      
      throw error;
    }

    try {
      // Prepare request configuration with metadata
      const enrichedConfig: ApiRequestConfig = {
        ...config,
        metadata: {
          ...config.metadata,
          requestId,
          correlationId,
          startTime,
        },
        headers: mergeHeaders(
          DEFAULT_HEADERS,
          this.config.interceptors.find(i => i.id === 'authentication-request') ? {} : {
            [HTTP_HEADERS.API_KEY]: this.config.apiKey,
          },
          config.headers,
          {
            [INTERNAL_HEADERS.REQUEST_ID]: requestId,
            [INTERNAL_HEADERS.CORRELATION_ID]: correlationId,
          }
        ),
      };

      // Execute request middleware pipeline
      const processedConfig = await this.middleware.executeRequest(enrichedConfig);

      // Make the actual HTTP request with retry logic
      const response = await this.makeRequestWithRetry<T>(processedConfig);

      // Execute response middleware pipeline
      const processedResponse = await this.middleware.executeResponse(response, processedConfig);

      // Record success metrics
      this.circuitBreaker.recordSuccess();
      this.healthMetrics.successCount++;
      this.recordResponseTime(Date.now() - startTime);

      return processedResponse;

    } catch (error) {
      // Record failure metrics
      this.circuitBreaker.recordFailure();
      this.healthMetrics.errorCount++;
      this.healthMetrics.lastErrorTime = Date.now();

      // Create standardized error
      const appError = this.createStandardizedError(error, config, correlationId);

      // Execute error middleware pipeline
      const processedError = await this.middleware.executeError(appError, config);

      throw processedError || appError;

    } finally {
      // Cleanup
      this.healthMetrics.activeRequestCount--;
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Make HTTP request with retry logic and timeout handling
   */
  private async makeRequestWithRetry<T>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config.retry };
    let lastError: any;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        // Create timeout controller
        const timeout = config.timeout || this.config.timeout;
        const timeoutController = new TimeoutController(timeout);
        
        // Store controller for potential cancellation
        if (config.metadata?.requestId) {
          this.activeRequests.set(config.metadata.requestId, timeoutController);
        }

        // Combine abort signals
        const combinedSignal = this.combineAbortSignals([
          timeoutController.signal,
          config.signal,
        ]);

        // Build final URL
        const url = buildUrl(this.config.baseUrl, config.url || '', config.params);

        // Prepare fetch options
        const fetchOptions: RequestInit = {
          method: config.method || 'GET',
          headers: config.headers,
          signal: combinedSignal,
          credentials: this.config.withCredentials ? 'include' : 'omit',
          redirect: 'follow',
        };

        // Add body for appropriate methods
        if (config.data && ['POST', 'PUT', 'PATCH'].includes(config.method || 'GET')) {
          if (config.data instanceof FormData) {
            fetchOptions.body = config.data;
            // Remove content-type header for FormData (browser sets it with boundary)
            delete (fetchOptions.headers as Record<string, string>)['content-type'];
          } else {
            fetchOptions.body = JSON.stringify(config.data);
          }
        }

        // Make the fetch request
        const response = await fetch(url, fetchOptions);

        // Cleanup timeout controller
        timeoutController.cleanup();

        // Handle non-200 responses
        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response);
          const error = createErrorFromResponse(response, config, errorData);
          
          // Check if error is retryable
          if (attempt < retryConfig.maxAttempts && isRetryableError(error, retryConfig)) {
            lastError = error;
            const delay = calculateRetryDelay(attempt, retryConfig);
            await sleep(delay);
            continue;
          }
          
          throw error;
        }

        // Parse successful response
        return await this.parseSuccessResponse<T>(response, config);

      } catch (error) {
        // Cleanup timeout controller on error
        if (config.metadata?.requestId) {
          const controller = this.activeRequests.get(config.metadata.requestId);
          controller?.cleanup();
        }

        // Check if error is retryable
        if (attempt < retryConfig.maxAttempts && isRetryableError(error, retryConfig)) {
          lastError = error;
          const delay = calculateRetryDelay(attempt, retryConfig);
          await sleep(delay);
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Parse successful response data
   */
  private async parseSuccessResponse<T>(
    response: Response,
    config: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    const endTime = Date.now();
    const startTime = config.metadata?.startTime || endTime;
    
    // Parse response headers
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Parse response body
    let data: T;
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      data = await response.json() as T;
    } else if (contentType.includes('text/')) {
      data = await response.text() as T;
    } else {
      data = await response.blob() as T;
    }

    // Build response metadata
    const meta: ResponseMeta = {
      timing: {
        requestStart: startTime,
        responseEnd: endTime,
        duration: endTime - startTime,
      } as TimingMeta,
    };

    // Extract pagination metadata if present
    if (typeof data === 'object' && data && 'meta' in data) {
      const responseData = data as any;
      if (responseData.meta?.count !== undefined) {
        meta.pagination = {
          offset: config.params?.offset || 0,
          limit: config.params?.limit || 25,
          total: responseData.meta.count,
          hasMore: false, // Will be calculated based on offset + limit vs total
          nextOffset: undefined,
          prevOffset: undefined,
        } as PaginationMeta;
        
        // Calculate pagination flags
        const { offset, limit, total } = meta.pagination;
        meta.pagination.hasMore = (offset + limit) < total;
        meta.pagination.nextOffset = meta.pagination.hasMore ? offset + limit : undefined;
        meta.pagination.prevOffset = offset > 0 ? Math.max(0, offset - limit) : undefined;
      }
    }

    // Build response status
    const status: ResponseStatus = {
      code: response.status,
      text: response.statusText,
      success: response.ok,
    };

    return {
      data,
      meta,
      status,
      headers,
      config,
    };
  }

  /**
   * Parse error response data
   */
  private async parseErrorResponse(response: Response): Promise<any> {
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await response.json();
      } else {
        return { error: { message: await response.text() } };
      }
    } catch {
      return { error: { message: response.statusText } };
    }
  }

  /**
   * Create standardized error from various error types
   */
  private createStandardizedError(
    error: any,
    config: ApiRequestConfig,
    correlationId: string
  ): AppError {
    const baseError = {
      timestamp: new Date().toISOString(),
      correlationId,
      userFacing: true,
      context: {
        url: config.url,
        method: config.method,
      },
    };

    // Handle fetch errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        ...baseError,
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.INFRASTRUCTURE,
        code: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection.',
        isRetryable: true,
      } as NetworkError;
    }

    // Handle timeout errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return {
        ...baseError,
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.INFRASTRUCTURE,
        code: 'TIMEOUT',
        message: 'Request timed out. Please try again.',
        isRetryable: true,
      } as NetworkError;
    }

    // Handle already processed API errors
    if (error.type && error.code) {
      return error as AppError;
    }

    // Handle generic errors
    return {
      ...baseError,
      type: ErrorType.CLIENT,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.APPLICATION,
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred.',
      isRetryable: false,
    } as ClientError;
  }

  /**
   * Combine multiple abort signals into one
   */
  private combineAbortSignals(signals: (AbortSignal | undefined)[]): AbortSignal {
    const validSignals = signals.filter(Boolean) as AbortSignal[];
    
    if (validSignals.length === 0) {
      return new AbortController().signal;
    }
    
    if (validSignals.length === 1) {
      return validSignals[0];
    }

    const controller = new AbortController();
    
    validSignals.forEach(signal => {
      if (signal.aborted) {
        controller.abort();
      } else {
        signal.addEventListener('abort', () => controller.abort());
      }
    });

    return controller.signal;
  }

  /**
   * Record response time for health metrics
   */
  private recordResponseTime(duration: number): void {
    this.healthMetrics.responseTimes.push(duration);
    
    // Keep only last 100 response times
    if (this.healthMetrics.responseTimes.length > 100) {
      this.healthMetrics.responseTimes = this.healthMetrics.responseTimes.slice(-100);
    }
  }

  // =============================================================================
  // Convenience Methods
  // =============================================================================

  async get<T = any>(url: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  async post<T = any>(url: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'POST', data });
  }

  async put<T = any>(url: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PUT', data });
  }

  async patch<T = any>(url: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PATCH', data });
  }

  async delete<T = any>(url: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'DELETE' });
  }

  async head(url: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<void>> {
    return this.request<void>({ ...config, url, method: 'HEAD' });
  }

  async options(url: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<void>> {
    return this.request<void>({ ...config, url, method: 'OPTIONS' });
  }

  // =============================================================================
  // Factory and Management Methods
  // =============================================================================

  create(config: Partial<ApiClientConfig>): ApiClient {
    const mergedConfig = { ...this.config, ...config };
    return new BaseClient(mergedConfig);
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.get('/api/v2/system/environment', {
        timeout: 5000,
        retry: { maxAttempts: 1 },
      });
      return response.status.success;
    } catch {
      return false;
    }
  }

  async getHealth(): Promise<HealthStatus> {
    const responseTimes = this.healthMetrics.responseTimes;
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    const totalRequests = this.healthMetrics.totalRequests;
    const errorRate = totalRequests > 0
      ? (this.healthMetrics.errorCount / totalRequests) * 100
      : 0;

    const connected = await this.testConnection();

    return {
      healthy: connected && this.circuitBreaker.getState() !== 'OPEN',
      connected,
      authenticated: !!await this.session.getToken(),
      circuitBreakerOpen: this.circuitBreaker.getState() === 'OPEN',
      activeRequests: this.healthMetrics.activeRequestCount,
      errorRate,
      averageResponseTime,
      lastCheck: new Date().toISOString(),
    };
  }

  async dispose(): Promise<void> {
    // Cancel all active requests
    this.activeRequests.forEach(controller => {
      controller.abort('Client disposed');
    });
    this.activeRequests.clear();

    // Clean up progress tracker
    this.progressTracker.removeAllListeners();

    // Clear health metrics
    this.healthMetrics.responseTimes = [];
  }

  // =============================================================================
  // Service Factory Methods (Placeholder Implementations)
  // =============================================================================

  private createSessionManager(): SessionManager {
    // Placeholder implementation - would be properly implemented with storage integration
    return {
      getToken: async () => null,
      setToken: async (token: string) => { /* TODO: Implement */ },
      clearToken: async () => { /* TODO: Implement */ },
      validateSession: async () => false,
      refreshToken: async () => '',
      getSessionMeta: async () => null,
    };
  }

  private createAuthProvider(): AuthProvider {
    // Placeholder implementation - would be properly implemented with auth integration
    return {
      login: async (credentials) => ({ success: false } as any),
      logout: async () => { /* TODO: Implement */ },
      refresh: async () => ({ success: false } as any),
      validate: async () => false,
      getState: async () => ({
        isAuthenticated: false,
        session: null,
        token: null,
        isLoading: false,
        error: null,
      }),
    };
  }

  private createFileService(): FileService {
    // Placeholder implementation - would be properly implemented with file handling
    return {
      upload: async (file, config) => ({ success: false }),
      uploadMultiple: async (files, config) => [],
      download: async (config) => ({ success: false }),
      delete: async (fileId) => ({ success: false }),
      getMetadata: async (fileId) => ({} as FileMetadata),
      list: async (params) => ({ data: [], meta: {}, status: { code: 200, text: 'OK', success: true }, headers: {}, config: {} } as any),
    };
  }
}

// =============================================================================
// Factory Functions and Exports
// =============================================================================

/**
 * Create a new API client instance with the provided configuration
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new BaseClient(config);
}

/**
 * Create a default API client instance with standard configuration
 */
export function createDefaultApiClient(baseUrl: string, apiKey: string): ApiClient {
  return new BaseClient({
    baseUrl,
    apiKey,
    timeout: DEFAULT_TIMEOUT,
    withCredentials: true,
    retryConfig: DEFAULT_RETRY_CONFIG,
    circuitBreakerConfig: DEFAULT_CIRCUIT_BREAKER_CONFIG,
    interceptors: [],
    debug: process.env.NODE_ENV === 'development',
  });
}

/**
 * Convert legacy request options to modern format for backward compatibility
 */
export function convertLegacyRequest(
  url: string,
  options: LegacyRequestOptions
): ApiRequestConfig {
  return {
    url,
    ...convertLegacyOptions(options),
  };
}

/**
 * Export utility functions for external use
 */
export {
  generateRequestId,
  generateCorrelationId,
  buildUrl,
  normalizeHeaders,
  mergeHeaders,
  calculateRetryDelay,
  isRetryableError,
};

/**
 * Export default client class
 */
export default BaseClient;