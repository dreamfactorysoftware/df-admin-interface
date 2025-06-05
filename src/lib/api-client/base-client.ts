/**
 * Core HTTP client implementation for DreamFactory API communication.
 * 
 * Provides foundational request/response functionality using native fetch API with modern
 * async/await patterns. Replaces Angular HttpClient with React/Next.js optimized patterns
 * including middleware integration, comprehensive error handling, retry mechanisms, and
 * request cancellation support.
 * 
 * Key Features:
 * - Native fetch API with modern JavaScript patterns
 * - Middleware chain for request/response transformation
 * - Comprehensive error handling with retry logic and exponential backoff
 * - Request timeout and cancellation via AbortController
 * - Loading state management and progress tracking
 * - Request configuration builder for headers, parameters, and options
 * - Integration with React Query and SWR for intelligent caching
 * 
 * @module BaseApiClient
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 */

import {
  RequestConfig,
  HttpMethod,
  ContentType,
  AuthHeaders,
  AuthContext,
  MiddlewareContext,
  MiddlewareStack,
  RequestMiddleware,
  ResponseMiddleware,
  ErrorMiddleware,
  RequestContext,
  KeyValuePair,
  FileUploadProgress,
  ApiClientError,
} from './types';

import {
  configureInterceptors,
  getInterceptorConfig,
  createDefaultMiddlewareStack,
  composeRequestMiddlewares,
  composeResponseMiddlewares,
  composeErrorMiddlewares,
  type InterceptorConfig,
} from './interceptors';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Default request timeout in milliseconds (30 seconds)
 */
const DEFAULT_TIMEOUT = 30000;

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true,
};

/**
 * Default request headers
 */
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
};

/**
 * HTTP status codes for different error types
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT: 408,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate unique request ID for tracking and debugging
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calculate exponential backoff delay with optional jitter
 */
function calculateBackoffDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffFactor: number,
  useJitter: boolean = true
): number {
  const exponentialDelay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
  
  if (useJitter) {
    // Add random jitter (±25% of the delay)
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
    return Math.max(0, exponentialDelay + jitter);
  }
  
  return exponentialDelay;
}

/**
 * Check if HTTP status code indicates a retryable error
 */
function isRetryableError(status: number): boolean {
  return status >= 500 || status === HTTP_STATUS.TIMEOUT || status === HTTP_STATUS.TOO_MANY_REQUESTS;
}

/**
 * Check if error is a network connectivity issue
 */
function isNetworkError(error: Error): boolean {
  return error instanceof TypeError && 
    (error.message.includes('fetch') || 
     error.message.includes('network') || 
     error.message.includes('Failed to fetch'));
}

/**
 * Build query string from parameters
 */
function buildQueryString(params: KeyValuePair[]): string {
  if (!params || params.length === 0) {
    return '';
  }
  
  const searchParams = new URLSearchParams();
  
  params.forEach(({ key, value }) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Build headers object from configuration
 */
function buildHeaders(config: RequestConfig, additionalHeaders: Record<string, string> = {}): Headers {
  const headers = new Headers();
  
  // Add default headers
  Object.entries(DEFAULT_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  // Override content type if specified
  if (config.contentType) {
    headers.set('Content-Type', config.contentType);
  }
  
  // Add additional headers from configuration
  if (config.additionalHeaders) {
    config.additionalHeaders.forEach(({ key, value }) => {
      headers.set(key, String(value));
    });
  }
  
  // Add any additional headers passed directly
  Object.entries(additionalHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  return headers;
}

/**
 * Create abort controller with timeout
 */
function createAbortController(timeout: number = DEFAULT_TIMEOUT, signal?: AbortSignal): AbortController {
  const controller = new AbortController();
  
  // Set up timeout
  const timeoutId = setTimeout(() => {
    controller.abort('Request timeout');
  }, timeout);
  
  // Clean up timeout when request completes
  controller.signal.addEventListener('abort', () => {
    clearTimeout(timeoutId);
  });
  
  // Forward external abort signal
  if (signal) {
    signal.addEventListener('abort', () => {
      controller.abort(signal.reason);
    });
  }
  
  return controller;
}

// =============================================================================
// REQUEST CONFIGURATION BUILDER
// =============================================================================

/**
 * Request configuration builder with fluent interface
 */
export class RequestConfigBuilder {
  private config: RequestConfig = {};
  
  /**
   * Set HTTP method
   */
  method(method: HttpMethod): RequestConfigBuilder {
    this.config.method = method;
    return this;
  }
  
  /**
   * Set content type
   */
  contentType(type: ContentType): RequestConfigBuilder {
    this.config.contentType = type;
    return this;
  }
  
  /**
   * Add query parameter
   */
  param(key: string, value: string | number | boolean): RequestConfigBuilder {
    if (!this.config.additionalParams) {
      this.config.additionalParams = [];
    }
    this.config.additionalParams.push({ key, value });
    return this;
  }
  
  /**
   * Add multiple query parameters
   */
  params(params: KeyValuePair[]): RequestConfigBuilder {
    if (!this.config.additionalParams) {
      this.config.additionalParams = [];
    }
    this.config.additionalParams.push(...params);
    return this;
  }
  
  /**
   * Add header
   */
  header(key: string, value: string | number | boolean): RequestConfigBuilder {
    if (!this.config.additionalHeaders) {
      this.config.additionalHeaders = [];
    }
    this.config.additionalHeaders.push({ key, value });
    return this;
  }
  
  /**
   * Add multiple headers
   */
  headers(headers: KeyValuePair[]): RequestConfigBuilder {
    if (!this.config.additionalHeaders) {
      this.config.additionalHeaders = [];
    }
    this.config.additionalHeaders.push(...headers);
    return this;
  }
  
  /**
   * Set pagination configuration
   */
  paginate(limit: number, offset: number = 0, includeCount: boolean = false): RequestConfigBuilder {
    this.config.limit = limit;
    this.config.offset = offset;
    this.config.includeCount = includeCount;
    return this;
  }
  
  /**
   * Set filter expression
   */
  filter(filter: string): RequestConfigBuilder {
    this.config.filter = filter;
    return this;
  }
  
  /**
   * Set fields to include
   */
  fields(fields: string): RequestConfigBuilder {
    this.config.fields = fields;
    return this;
  }
  
  /**
   * Set related resources to include
   */
  related(related: string): RequestConfigBuilder {
    this.config.related = related;
    return this;
  }
  
  /**
   * Set sort order
   */
  sort(sort: string): RequestConfigBuilder {
    this.config.sort = sort;
    return this;
  }
  
  /**
   * Set request timeout
   */
  timeout(timeout: number): RequestConfigBuilder {
    this.config.timeout = timeout;
    return this;
  }
  
  /**
   * Set retry configuration
   */
  retry(retryAttempts: number, retryDelay: number = 1000): RequestConfigBuilder {
    this.config.retryAttempts = retryAttempts;
    this.config.retryDelay = retryDelay;
    return this;
  }
  
  /**
   * Set abort signal
   */
  signal(signal: AbortSignal): RequestConfigBuilder {
    this.config.signal = signal;
    return this;
  }
  
  /**
   * Configure loading spinner
   */
  loading(showSpinner: boolean = true): RequestConfigBuilder {
    this.config.showSpinner = showSpinner;
    return this;
  }
  
  /**
   * Configure success notification
   */
  successMessage(message: string): RequestConfigBuilder {
    this.config.snackbarSuccess = message;
    return this;
  }
  
  /**
   * Configure error notification
   */
  errorMessage(message: string): RequestConfigBuilder {
    this.config.snackbarError = message;
    return this;
  }
  
  /**
   * Suppress all notifications
   */
  silent(): RequestConfigBuilder {
    this.config.suppressNotifications = true;
    return this;
  }
  
  /**
   * Build final configuration
   */
  build(): RequestConfig {
    return { ...this.config };
  }
}

// =============================================================================
// CORE BASE CLIENT CLASS
// =============================================================================

/**
 * Core HTTP client implementation with modern fetch API
 */
export class BaseApiClient {
  private baseUrl: string;
  private authContext: AuthContext;
  private middlewareStack: MiddlewareStack;
  private requestTimeout: number;
  
  /**
   * Initialize base API client
   */
  constructor(
    baseUrl: string = '',
    authContext: AuthContext = {
      isAuthenticated: false,
      isAuthenticating: false,
    },
    middleware?: Partial<MiddlewareStack>,
    timeout: number = DEFAULT_TIMEOUT
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.authContext = authContext;
    this.requestTimeout = timeout;
    
    // Initialize middleware stack
    const defaultStack = createDefaultMiddlewareStack();
    this.middlewareStack = {
      request: [...(middleware?.request || defaultStack.request)],
      response: [...(middleware?.response || defaultStack.response)],
      error: [...(middleware?.error || defaultStack.error)],
    };
  }
  
  /**
   * Update authentication context
   */
  updateAuthContext(authContext: Partial<AuthContext>): void {
    this.authContext = { ...this.authContext, ...authContext };
  }
  
  /**
   * Add request middleware
   */
  addRequestMiddleware(middleware: RequestMiddleware): void {
    this.middlewareStack.request.push(middleware);
  }
  
  /**
   * Add response middleware
   */
  addResponseMiddleware(middleware: ResponseMiddleware): void {
    this.middlewareStack.response.push(middleware);
  }
  
  /**
   * Add error middleware
   */
  addErrorMiddleware(middleware: ErrorMiddleware): void {
    this.middlewareStack.error.push(middleware);
  }
  
  /**
   * Create request configuration builder
   */
  createRequest(): RequestConfigBuilder {
    return new RequestConfigBuilder();
  }
  
  /**
   * Execute HTTP request with full middleware chain
   */
  async request<T = any>(
    url: string,
    config: RequestConfig = {},
    body?: any
  ): Promise<T> {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    // Create middleware context
    const context: MiddlewareContext = {
      config,
      auth: this.authContext,
      metadata: {
        requestId,
        requestBody: body,
      },
      startTime,
    };
    
    // Build full URL
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    
    // Execute request with retry logic
    return this.executeWithRetry(fullUrl, config, context, body);
  }
  
  /**
   * Execute request with retry logic and exponential backoff
   */
  private async executeWithRetry<T>(
    url: string,
    config: RequestConfig,
    context: MiddlewareContext,
    body?: any
  ): Promise<T> {
    const maxRetries = config.retryAttempts ?? DEFAULT_RETRY_CONFIG.maxRetries;
    const baseDelay = config.retryDelay ?? DEFAULT_RETRY_CONFIG.baseDelay;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Add retry information to context
        context.metadata.retryCount = attempt;
        
        const result = await this.executeSingleRequest<T>(url, config, context, body);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Check if error is retryable
        const isRetryable = this.shouldRetryError(error as Error);
        if (!isRetryable) {
          break;
        }
        
        // Calculate delay for next attempt
        const delay = calculateBackoffDelay(
          attempt,
          baseDelay,
          DEFAULT_RETRY_CONFIG.maxDelay,
          DEFAULT_RETRY_CONFIG.backoffFactor,
          DEFAULT_RETRY_CONFIG.jitter
        );
        
        // Wait before retry (unless immediately cancelled)
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Check if request was cancelled during delay
        if (config.signal?.aborted) {
          throw new Error('Request cancelled');
        }
      }
    }
    
    // If we get here, all retries failed
    throw lastError || new Error('Request failed after retries');
  }
  
  /**
   * Execute single HTTP request
   */
  private async executeSingleRequest<T>(
    url: string,
    config: RequestConfig,
    context: MiddlewareContext,
    body?: any
  ): Promise<T> {
    try {
      // Compose and execute request middleware
      const requestComposer = composeRequestMiddlewares(this.middlewareStack.request);
      const { url: processedUrl, config: processedConfig, context: processedContext } = 
        await requestComposer(url, config, context);
      
      // Build query parameters
      const queryParams: KeyValuePair[] = [];
      
      // Add standard DreamFactory parameters
      if (processedConfig.limit !== undefined) {
        queryParams.push({ key: 'limit', value: processedConfig.limit });
      }
      if (processedConfig.offset !== undefined) {
        queryParams.push({ key: 'offset', value: processedConfig.offset });
      }
      if (processedConfig.includeCount) {
        queryParams.push({ key: 'include_count', value: 'true' });
      }
      if (processedConfig.filter) {
        queryParams.push({ key: 'filter', value: processedConfig.filter });
      }
      if (processedConfig.fields) {
        queryParams.push({ key: 'fields', value: processedConfig.fields });
      }
      if (processedConfig.related) {
        queryParams.push({ key: 'related', value: processedConfig.related });
      }
      if (processedConfig.sort) {
        queryParams.push({ key: 'order', value: processedConfig.sort });
      }
      
      // Add additional parameters
      if (processedConfig.additionalParams) {
        queryParams.push(...processedConfig.additionalParams);
      }
      
      // Build final URL with query string
      const finalUrl = processedUrl + buildQueryString(queryParams);
      
      // Build headers
      const headers = buildHeaders(processedConfig);
      
      // Create abort controller
      const controller = createAbortController(
        processedConfig.timeout || this.requestTimeout,
        processedConfig.signal
      );
      
      // Prepare fetch options
      const fetchOptions: RequestInit = {
        method: processedConfig.method || 'GET',
        headers,
        signal: controller.signal,
      };
      
      // Add body for non-GET requests
      if (body !== undefined && ['POST', 'PUT', 'PATCH'].includes(fetchOptions.method!)) {
        if (processedConfig.contentType === 'multipart/form-data') {
          // For FormData, let fetch set the content-type header automatically
          headers.delete('Content-Type');
          fetchOptions.body = body instanceof FormData ? body : this.createFormData(body);
        } else if (processedConfig.contentType === 'application/x-www-form-urlencoded') {
          const urlSearchParams = new URLSearchParams();
          Object.entries(body).forEach(([key, value]) => {
            urlSearchParams.append(key, String(value));
          });
          fetchOptions.body = urlSearchParams.toString();
        } else {
          // Default to JSON
          fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(processedContext.metadata.requestBody || body);
        }
      }
      
      // Execute fetch request
      const response = await fetch(finalUrl, fetchOptions);
      
      // Process response through middleware
      const responseComposer = composeResponseMiddlewares(this.middlewareStack.response);
      const processedResponse = await responseComposer(response, processedContext);
      
      // Handle HTTP errors
      if (!processedResponse.ok) {
        throw processedResponse; // Will be handled by error middleware
      }
      
      // Parse response based on content type
      const contentType = processedResponse.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        return await processedResponse.json();
      } else if (contentType.includes('text/')) {
        return await processedResponse.text() as T;
      } else {
        // For binary data, return the response itself
        return processedResponse as T;
      }
      
    } catch (error) {
      // Process error through middleware
      const errorComposer = composeErrorMiddlewares(this.middlewareStack.error);
      const processedError = await errorComposer(error as Error, context);
      
      if (processedError) {
        throw processedError;
      }
      
      throw error;
    }
  }
  
  /**
   * Check if error should trigger a retry
   */
  private shouldRetryError(error: Error): boolean {
    // Don't retry client errors (4xx) except timeout and rate limiting
    if (error instanceof Response) {
      return isRetryableError(error.status);
    }
    
    // Retry network errors
    if (isNetworkError(error)) {
      return true;
    }
    
    // Don't retry abort errors
    if (error.name === 'AbortError') {
      return false;
    }
    
    return false;
  }
  
  /**
   * Create FormData from object
   */
  private createFormData(data: any): FormData {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (value instanceof FileList) {
        Array.from(value).forEach(file => {
          formData.append(`${key}[]`, file);
        });
      } else if (Array.isArray(value)) {
        value.forEach(item => {
          formData.append(`${key}[]`, String(item));
        });
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    
    return formData;
  }
  
  // =============================================================================
  // CONVENIENCE METHODS
  // =============================================================================
  
  /**
   * GET request
   */
  async get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }
  
  /**
   * POST request
   */
  async post<T = any>(url: string, body?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'POST' }, body);
  }
  
  /**
   * PUT request
   */
  async put<T = any>(url: string, body?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'PUT' }, body);
  }
  
  /**
   * PATCH request
   */
  async patch<T = any>(url: string, body?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'PATCH' }, body);
  }
  
  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }
  
  /**
   * HEAD request
   */
  async head(url: string, config?: RequestConfig): Promise<Response> {
    return this.request<Response>(url, { ...config, method: 'HEAD' });
  }
  
  /**
   * OPTIONS request
   */
  async options<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'OPTIONS' });
  }
  
  // =============================================================================
  // FILE UPLOAD SUPPORT
  // =============================================================================
  
  /**
   * Upload file with progress tracking
   */
  async uploadFile(
    url: string,
    file: File,
    config?: RequestConfig & {
      onProgress?: (progress: FileUploadProgress) => void;
      fieldName?: string;
    }
  ): Promise<any> {
    const formData = new FormData();
    formData.append(config?.fieldName || 'file', file);
    
    // For file uploads, we need to handle progress differently
    if (config?.onProgress) {
      return this.uploadWithProgress(url, formData, config);
    }
    
    return this.post(url, formData, {
      ...config,
      contentType: 'multipart/form-data',
    });
  }
  
  /**
   * Upload with progress tracking using XMLHttpRequest
   */
  private async uploadWithProgress(
    url: string,
    formData: FormData,
    config: RequestConfig & { onProgress: (progress: FileUploadProgress) => void }
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Set up progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress: FileUploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
            rate: event.loaded / ((Date.now() - startTime) / 1000),
          };
          
          // Estimate time remaining
          if (progress.rate > 0) {
            progress.timeRemaining = (event.total - event.loaded) / progress.rate;
          }
          
          config.onProgress(progress);
        }
      });
      
      const startTime = Date.now();
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = xhr.responseText ? JSON.parse(xhr.responseText) : {};
            resolve(response);
          } catch (error) {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });
      
      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });
      
      // Build URL with base URL
      const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
      
      xhr.open('POST', fullUrl);
      
      // Add authentication headers
      if (this.authContext.token?.sessionToken) {
        xhr.setRequestHeader('X-DreamFactory-Session-Token', this.authContext.token.sessionToken);
      }
      
      if (this.authContext.apiKey?.key) {
        xhr.setRequestHeader('X-DreamFactory-API-Key', this.authContext.apiKey.key);
      }
      
      // Add additional headers
      config.additionalHeaders?.forEach(({ key, value }) => {
        xhr.setRequestHeader(key, String(value));
      });
      
      // Cancel on abort signal
      if (config.signal) {
        config.signal.addEventListener('abort', () => {
          xhr.abort();
        });
      }
      
      xhr.send(formData);
    });
  }
  
  // =============================================================================
  // STREAMING SUPPORT
  // =============================================================================
  
  /**
   * Download file as blob
   */
  async downloadBlob(url: string, config?: RequestConfig): Promise<Blob> {
    const response = await this.request<Response>(url, config);
    return response.blob();
  }
  
  /**
   * Stream response data
   */
  async streamResponse(
    url: string,
    config?: RequestConfig,
    onChunk?: (chunk: Uint8Array) => void
  ): Promise<void> {
    const response = await this.request<Response>(url, config);
    
    if (!response.body) {
      throw new Error('Response body is not readable');
    }
    
    const reader = response.body.getReader();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        if (onChunk && value) {
          onChunk(value);
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// =============================================================================
// FACTORY FUNCTIONS AND EXPORTS
// =============================================================================

/**
 * Create a new BaseApiClient instance with default configuration
 */
export function createApiClient(
  baseUrl: string = '',
  authContext?: AuthContext,
  config?: {
    middleware?: Partial<MiddlewareStack>;
    timeout?: number;
    interceptorConfig?: InterceptorConfig;
  }
): BaseApiClient {
  // Configure global interceptors if provided
  if (config?.interceptorConfig) {
    configureInterceptors(config.interceptorConfig);
  }
  
  return new BaseApiClient(
    baseUrl,
    authContext,
    config?.middleware,
    config?.timeout
  );
}

/**
 * Create request configuration builder
 */
export function requestConfig(): RequestConfigBuilder {
  return new RequestConfigBuilder();
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Main class
  BaseApiClient,
  
  // Builder
  RequestConfigBuilder,
  
  // Factory functions
  createApiClient,
  requestConfig,
  
  // Utility functions
  generateRequestId,
  calculateBackoffDelay,
  isRetryableError,
  isNetworkError,
  buildQueryString,
  buildHeaders,
  
  // Constants
  DEFAULT_TIMEOUT,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_HEADERS,
  HTTP_STATUS,
  
  // Types re-export for convenience
  type RequestConfig,
  type HttpMethod,
  type ContentType,
  type AuthHeaders,
  type AuthContext,
  type MiddlewareContext,
  type MiddlewareStack,
  type RequestContext,
  type FileUploadProgress,
  type ApiClientError,
};

export default BaseApiClient;