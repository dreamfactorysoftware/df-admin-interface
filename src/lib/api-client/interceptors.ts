/**
 * Request and response middleware implementation for DreamFactory API client.
 * 
 * Replaces Angular HTTP interceptors with functional middleware patterns compatible with
 * native fetch API and React Query. Handles cross-cutting concerns including authentication
 * headers, case transformation, error handling, loading states, and notification management.
 * 
 * Key Features:
 * - Authentication header injection (JWT tokens and API keys)
 * - Case transformation between camelCase frontend and snake_case backend
 * - Comprehensive error handling with automatic token refresh
 * - Loading state coordination with UI components
 * - Success/error notification integration
 * 
 * @module ApiClientInterceptors
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 */

import {
  RequestMiddleware,
  ResponseMiddleware,
  ErrorMiddleware,
  MiddlewareContext,
  RequestConfig,
  AuthContext,
  AuthHeaders,
  ErrorResponse,
} from './types';
import { mapCamelToSnake, mapSnakeToCamel } from '../data-transform/case';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Authentication token refresh function signature
 */
type TokenRefreshFunction = () => Promise<{ sessionToken: string; expiresAt: number } | null>;

/**
 * Loading state management interface
 */
interface LoadingManager {
  show: (requestId: string) => void;
  hide: (requestId: string) => void;
  isLoading: (requestId?: string) => boolean;
}

/**
 * Notification manager interface
 */
interface NotificationManager {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

/**
 * Router interface for navigation
 */
interface Router {
  push: (path: string) => void;
  replace: (path: string) => void;
}

/**
 * Interceptor configuration interface
 */
export interface InterceptorConfig {
  /** Function to refresh authentication tokens */
  refreshToken?: TokenRefreshFunction;
  /** Loading state manager instance */
  loadingManager?: LoadingManager;
  /** Notification manager instance */
  notificationManager?: NotificationManager;
  /** Router instance for navigation */
  router?: Router;
  /** Development mode flag */
  isDevelopment?: boolean;
  /** Base URL for API requests */
  baseUrl?: string;
}

// =============================================================================
// GLOBAL STATE MANAGEMENT
// =============================================================================

let globalConfig: InterceptorConfig = {};

/**
 * Configure global interceptor settings
 */
export function configureInterceptors(config: InterceptorConfig): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Get current global configuration
 */
export function getInterceptorConfig(): InterceptorConfig {
  return globalConfig;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if token is expired or expires within buffer time
 */
function isTokenExpired(expiresAt: number, bufferMinutes: number = 5): boolean {
  const now = Date.now();
  const expirationTime = expiresAt - (bufferMinutes * 60 * 1000);
  return now >= expirationTime;
}

/**
 * Extract error message from various error response formats
 */
function extractErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.error?.message) {
    return error.error.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error?.context) {
    if (typeof error.error.context === 'string') {
      return error.error.context;
    }
    if (error.error.context?.error?.[0]?.message) {
      return error.error.context.error[0].message;
    }
  }
  
  return 'An unexpected error occurred';
}

/**
 * Check if response indicates authentication failure
 */
function isAuthError(status: number): boolean {
  return status === 401 || status === 403;
}

/**
 * Check if error is retryable
 */
function isRetryableError(status: number): boolean {
  return status >= 500 || status === 408 || status === 429;
}

// =============================================================================
// AUTHENTICATION MIDDLEWARE
// =============================================================================

/**
 * Authentication middleware that injects JWT tokens and API keys into requests.
 * 
 * Automatically adds DreamFactory authentication headers based on current
 * authentication context. Supports both session tokens and API key authentication.
 * 
 * Features:
 * - Automatic JWT token injection
 * - API key header management
 * - License key support
 * - Development mode bypass
 */
export const authenticationMiddleware: RequestMiddleware = async (url, config, context) => {
  const { auth } = context;
  
  // Skip authentication for login endpoints
  if (url.includes('/user/session') || url.includes('/system/user/session')) {
    return { url, config, context };
  }
  
  const headers: AuthHeaders = {};
  
  // Add session token if available
  if (auth.token?.sessionToken) {
    headers['X-DreamFactory-Session-Token'] = auth.token.sessionToken;
  }
  
  // Add API key if available
  if (auth.apiKey?.key) {
    headers['X-DreamFactory-API-Key'] = auth.apiKey.key;
  }
  
  // Add license key from environment if available
  if (typeof window !== 'undefined') {
    const licenseKey = window.localStorage?.getItem('df_license_key');
    if (licenseKey) {
      headers['X-DreamFactory-License-Key'] = licenseKey;
    }
  }
  
  // Add Authorization header for Bearer token pattern
  if (auth.token?.sessionToken && auth.token?.tokenType) {
    headers['Authorization'] = `${auth.token.tokenType} ${auth.token.sessionToken}`;
  }
  
  // Merge authentication headers with existing headers
  const updatedConfig = {
    ...config,
    additionalHeaders: [
      ...(config.additionalHeaders || []),
      ...Object.entries(headers).map(([key, value]) => ({ key, value })),
    ],
  };
  
  return { url, config: updatedConfig, context };
};

// =============================================================================
// CASE TRANSFORMATION MIDDLEWARE
// =============================================================================

/**
 * Request case transformation middleware that converts camelCase to snake_case.
 * 
 * Transforms request body and query parameters from frontend camelCase naming
 * to backend snake_case naming convention expected by DreamFactory APIs.
 * 
 * Features:
 * - Deep object transformation
 * - Array handling
 * - Special SAML field mapping
 * - Query parameter transformation
 */
export const requestCaseTransformMiddleware: RequestMiddleware = async (url, config, context) => {
  let transformedConfig = { ...config };
  
  // Transform request body if present
  if (config.method && ['POST', 'PUT', 'PATCH'].includes(config.method.toUpperCase())) {
    if (context.metadata.requestBody) {
      const transformedBody = mapCamelToSnake(context.metadata.requestBody);
      context.metadata.requestBody = transformedBody;
    }
  }
  
  // Transform additional parameters (query parameters)
  if (config.additionalParams) {
    const transformedParams = config.additionalParams.map(param => ({
      key: param.key.includes('_') ? param.key : mapCamelToSnake(param.key),
      value: param.value,
    }));
    
    transformedConfig = {
      ...transformedConfig,
      additionalParams: transformedParams,
    };
  }
  
  // Transform filter parameter if present
  if (config.filter) {
    // Note: Filter expressions contain SQL-like syntax and should not be transformed
    // Only transform field names within complex filter expressions if needed
    transformedConfig = {
      ...transformedConfig,
      filter: config.filter, // Keep as-is for now
    };
  }
  
  // Transform fields parameter
  if (config.fields) {
    const fieldList = config.fields.split(',').map(field => 
      field.trim().includes('_') ? field.trim() : mapCamelToSnake(field.trim())
    );
    transformedConfig = {
      ...transformedConfig,
      fields: fieldList.join(','),
    };
  }
  
  // Transform related parameter
  if (config.related) {
    const relatedList = config.related.split(',').map(relation => 
      relation.trim().includes('_') ? relation.trim() : mapCamelToSnake(relation.trim())
    );
    transformedConfig = {
      ...transformedConfig,
      related: relatedList.join(','),
    };
  }
  
  return { url, config: transformedConfig, context };
};

/**
 * Response case transformation middleware that converts snake_case to camelCase.
 * 
 * Transforms response data from backend snake_case naming to frontend camelCase
 * naming convention for seamless React component integration.
 * 
 * Features:
 * - Deep response transformation
 * - Metadata preservation
 * - Error response handling
 * - Array data processing
 */
export const responseCaseTransformMiddleware: ResponseMiddleware = async (response, context) => {
  try {
    const contentType = response.headers.get('content-type');
    
    // Only transform JSON responses
    if (!contentType?.includes('application/json')) {
      return response;
    }
    
    const clonedResponse = response.clone();
    const data = await clonedResponse.json();
    
    // Transform the response data
    const transformedData = mapSnakeToCamel(data);
    
    // Create new response with transformed data
    const transformedResponse = new Response(JSON.stringify(transformedData), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
    
    return transformedResponse;
  } catch (error) {
    // If transformation fails, return original response
    console.warn('Failed to transform response case:', error);
    return response;
  }
};

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

/**
 * Comprehensive error handling middleware with automatic token refresh.
 * 
 * Provides centralized error handling for all API requests including automatic
 * token refresh for expired sessions, navigation for authentication failures,
 * and user-friendly error messaging.
 * 
 * Features:
 * - Automatic token refresh on 401 errors
 * - Navigation handling for auth failures
 * - Retry logic for server errors
 * - Error message extraction and formatting
 */
export const errorHandlingMiddleware: ErrorMiddleware = async (error, context) => {
  const { notificationManager, router, refreshToken } = globalConfig;
  
  // Handle fetch errors (network issues, etc.)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    const networkError = new Error('Network connection failed. Please check your internet connection.');
    networkError.name = 'NetworkError';
    
    notificationManager?.showError('Network connection failed');
    return networkError;
  }
  
  // Handle HTTP errors
  if (error instanceof Response) {
    const status = error.status;
    
    try {
      const errorData: ErrorResponse = await error.clone().json();
      const errorMessage = extractErrorMessage(errorData);
      
      // Handle authentication errors
      if (isAuthError(status)) {
        if (status === 401 && refreshToken) {
          try {
            const newToken = await refreshToken();
            if (newToken) {
              // Token refresh succeeded, update context and retry
              context.auth.token = newToken;
              context.auth.isAuthenticated = true;
              context.auth.error = undefined;
              
              // Don't show error notification for successful refresh
              return; // Allow request to be retried
            }
          } catch (refreshError) {
            console.warn('Token refresh failed:', refreshError);
          }
        }
        
        // Clear authentication and redirect to login
        context.auth.isAuthenticated = false;
        context.auth.token = undefined;
        context.auth.session = undefined;
        
        // Clear stored session data
        if (typeof window !== 'undefined') {
          window.localStorage?.removeItem('df_session_token');
          window.localStorage?.removeItem('df_user_data');
        }
        
        if (status === 401) {
          notificationManager?.showError('Your session has expired. Please log in again.');
          router?.replace('/login');
        } else {
          notificationManager?.showError('You do not have permission to access this resource.');
        }
        
        const authError = new Error(errorMessage);
        authError.name = status === 401 ? 'AuthenticationError' : 'AuthorizationError';
        return authError;
      }
      
      // Handle server errors
      if (isRetryableError(status)) {
        const serverError = new Error(errorMessage);
        serverError.name = 'ServerError';
        
        // Show error notification for server errors
        notificationManager?.showError(`Server error: ${errorMessage}`);
        return serverError;
      }
      
      // Handle validation errors
      if (status === 400) {
        const validationError = new Error(errorMessage);
        validationError.name = 'ValidationError';
        
        // For validation errors, let the form handle the error display
        return validationError;
      }
      
      // Handle not found errors
      if (status === 404) {
        const notFoundError = new Error('The requested resource was not found.');
        notFoundError.name = 'NotFoundError';
        
        notificationManager?.showError('Resource not found');
        return notFoundError;
      }
      
      // Generic error handling
      const genericError = new Error(errorMessage);
      genericError.name = 'UnknownError';
      notificationManager?.showError(errorMessage);
      return genericError;
      
    } catch (parseError) {
      // Failed to parse error response
      const parseErrorObj = new Error(`HTTP ${status}: ${error.statusText}`);
      parseErrorObj.name = 'UnknownError';
      notificationManager?.showError(`Request failed with status ${status}`);
      return parseErrorObj;
    }
  }
  
  // Handle other types of errors
  const genericError = error instanceof Error ? error : new Error(String(error));
  notificationManager?.showError(genericError.message);
  return genericError;
};

// =============================================================================
// LOADING STATE MIDDLEWARE
// =============================================================================

/**
 * Loading state management middleware for spinner coordination.
 * 
 * Automatically manages loading indicators during API requests, providing
 * visual feedback to users and coordinating with UI loading components.
 * 
 * Features:
 * - Automatic spinner show/hide
 * - Request ID tracking
 * - Configurable loading behavior
 * - Error state handling
 */
export const loadingStateMiddleware: RequestMiddleware = async (url, config, context) => {
  const { loadingManager } = globalConfig;
  
  // Skip loading management if disabled or not configured
  if (config.showSpinner === false || !loadingManager) {
    return { url, config, context };
  }
  
  const requestId = generateRequestId();
  context.metadata.requestId = requestId;
  
  // Show loading spinner
  if (config.showSpinner !== false) {
    loadingManager.show(requestId);
  }
  
  return { url, config, context };
};

/**
 * Loading state cleanup middleware for response handling.
 * 
 * Ensures loading indicators are properly cleaned up after requests complete,
 * whether successful or failed.
 */
export const loadingCleanupMiddleware: ResponseMiddleware = async (response, context) => {
  const { loadingManager } = globalConfig;
  const requestId = context.metadata.requestId;
  
  if (requestId && loadingManager) {
    loadingManager.hide(requestId);
  }
  
  return response;
};

/**
 * Loading state error cleanup middleware.
 * 
 * Ensures loading indicators are hidden when requests fail.
 */
export const loadingErrorCleanupMiddleware: ErrorMiddleware = async (error, context) => {
  const { loadingManager } = globalConfig;
  const requestId = context.metadata.requestId;
  
  if (requestId && loadingManager) {
    loadingManager.hide(requestId);
  }
  
  return error;
};

// =============================================================================
// NOTIFICATION MIDDLEWARE
// =============================================================================

/**
 * Success notification middleware for positive feedback.
 * 
 * Displays success notifications for completed operations when configured
 * in the request headers or configuration.
 */
export const successNotificationMiddleware: ResponseMiddleware = async (response, context) => {
  const { notificationManager } = globalConfig;
  const { config } = context;
  
  // Skip notifications if suppressed
  if (config.suppressNotifications || !notificationManager) {
    return response;
  }
  
  // Show success notification if configured
  if (config.snackbarSuccess && response.ok) {
    notificationManager.showSuccess(config.snackbarSuccess);
  }
  
  return response;
};

/**
 * Error notification middleware for failure feedback.
 * 
 * Displays error notifications for failed operations when configured,
 * with automatic error message extraction from responses.
 */
export const errorNotificationMiddleware: ErrorMiddleware = async (error, context) => {
  const { notificationManager } = globalConfig;
  const { config } = context;
  
  // Skip notifications if suppressed
  if (config.suppressNotifications || !notificationManager) {
    return error;
  }
  
  // Show custom error notification if configured
  if (config.snackbarError) {
    notificationManager.showError(config.snackbarError);
  }
  
  return error;
};

// =============================================================================
// PERFORMANCE MONITORING MIDDLEWARE
// =============================================================================

/**
 * Performance monitoring middleware for request timing.
 * 
 * Tracks request performance metrics for monitoring and optimization purposes.
 */
export const performanceMonitoringMiddleware: RequestMiddleware = async (url, config, context) => {
  context.startTime = Date.now();
  context.metadata.performanceEntry = {
    url,
    method: config.method || 'GET',
    startTime: context.startTime,
  };
  
  return { url, config, context };
};

/**
 * Performance completion middleware for response timing.
 * 
 * Calculates and logs performance metrics for completed requests.
 */
export const performanceCompletionMiddleware: ResponseMiddleware = async (response, context) => {
  const endTime = Date.now();
  const duration = endTime - context.startTime;
  
  if (globalConfig.isDevelopment) {
    console.log(`[API Performance] ${context.metadata.performanceEntry?.method} ${context.metadata.performanceEntry?.url} - ${duration}ms`);
  }
  
  // Store performance data for monitoring
  context.metadata.performanceEntry = {
    ...context.metadata.performanceEntry,
    endTime,
    duration,
    status: response.status,
  };
  
  return response;
};

// =============================================================================
// MIDDLEWARE COMPOSITION
// =============================================================================

/**
 * Default request middleware stack
 */
export const defaultRequestMiddleware: RequestMiddleware[] = [
  performanceMonitoringMiddleware,
  authenticationMiddleware,
  requestCaseTransformMiddleware,
  loadingStateMiddleware,
];

/**
 * Default response middleware stack
 */
export const defaultResponseMiddleware: ResponseMiddleware[] = [
  loadingCleanupMiddleware,
  responseCaseTransformMiddleware,
  successNotificationMiddleware,
  performanceCompletionMiddleware,
];

/**
 * Default error middleware stack
 */
export const defaultErrorMiddleware: ErrorMiddleware[] = [
  loadingErrorCleanupMiddleware,
  errorNotificationMiddleware,
  errorHandlingMiddleware,
];

/**
 * Create a complete middleware stack with default middlewares
 */
export function createDefaultMiddlewareStack() {
  return {
    request: [...defaultRequestMiddleware],
    response: [...defaultResponseMiddleware],
    error: [...defaultErrorMiddleware],
  };
}

/**
 * Compose request middlewares into a single function
 */
export function composeRequestMiddlewares(middlewares: RequestMiddleware[]) {
  return async (url: string, config: RequestConfig, context: MiddlewareContext) => {
    let result = { url, config, context };
    
    for (const middleware of middlewares) {
      result = await middleware(result.url, result.config, result.context);
    }
    
    return result;
  };
}

/**
 * Compose response middlewares into a single function
 */
export function composeResponseMiddlewares(middlewares: ResponseMiddleware[]) {
  return async (response: Response, context: MiddlewareContext) => {
    let result = response;
    
    for (const middleware of middlewares) {
      result = await middleware(result, context);
    }
    
    return result;
  };
}

/**
 * Compose error middlewares into a single function
 */
export function composeErrorMiddlewares(middlewares: ErrorMiddleware[]) {
  return async (error: Error, context: MiddlewareContext) => {
    let result = error;
    
    for (const middleware of middlewares) {
      const middlewareResult = await middleware(result, context);
      if (middlewareResult !== undefined) {
        result = middlewareResult;
      }
    }
    
    return result;
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Configuration
  type InterceptorConfig,
  
  // Middleware functions
  authenticationMiddleware,
  requestCaseTransformMiddleware,
  responseCaseTransformMiddleware,
  errorHandlingMiddleware,
  loadingStateMiddleware,
  loadingCleanupMiddleware,
  loadingErrorCleanupMiddleware,
  successNotificationMiddleware,
  errorNotificationMiddleware,
  performanceMonitoringMiddleware,
  performanceCompletionMiddleware,
  
  // Composition helpers
  composeRequestMiddlewares,
  composeResponseMiddlewares,
  composeErrorMiddlewares,
  createDefaultMiddlewareStack,
};

export default {
  configureInterceptors,
  getInterceptorConfig,
  createDefaultMiddlewareStack,
  request: defaultRequestMiddleware,
  response: defaultResponseMiddleware,
  error: defaultErrorMiddleware,
};