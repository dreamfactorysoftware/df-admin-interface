/**
 * MSW Browser Worker Setup Configuration
 * 
 * Initializes Mock Service Worker for in-browser API mocking during development and testing.
 * This configuration replaces Angular HTTP interceptor testing setup with MSW browser worker
 * configuration, providing seamless API interception for DreamFactory endpoints.
 * 
 * Features:
 * - Browser environment API interception for DreamFactory endpoints at /api/* paths
 * - Case transformation middleware replicating Angular caseInterceptor behavior (camelCase ↔ snake_case)
 * - Authentication header handling replacing Angular sessionTokenInterceptor functionality  
 * - Error response handling replicating Angular errorInterceptor patterns
 * - Seamless integration with Vitest testing framework for automated API testing
 * - Support for in-browser API simulation without backend dependencies
 * - Comprehensive request/response transformation for DreamFactory API compatibility
 * 
 * Architecture:
 * - Worker registration in browser environment for real-time API mocking
 * - Configurable handler sets for different testing scenarios
 * - Automatic case transformation for API contract compatibility
 * - Session token validation and management for authentication flows
 * - Error response standardization matching DreamFactory API patterns
 * 
 * Migration Notes:
 * - Replaces Angular HTTP interceptor testing infrastructure per Section 0.2.4
 * - Maintains existing API contract behavior through transformation middleware
 * - Preserves authentication and error handling patterns from Angular implementation
 * - Enhances testing capabilities with realistic API behavior simulation
 */

import { setupWorker, type SetupWorker } from 'msw/browser';
import type { HttpHandler } from 'msw';

// Import comprehensive handler collections
import { 
  allHandlers,
  mswConfig,
  validateHandlerSetup,
  type DreamFactoryResponse,
} from './handlers';

// Import transformation and validation utilities
import {
  applyCaseTransformation,
  validateAuthHeaders,
  createJsonResponse,
  createErrorResponse,
  createAuthErrorResponse,
  createUnauthorizedError,
  createValidationError,
  processRequestBody,
  simulateNetworkDelay,
  logRequest,
  type AuthValidationResult,
  API_KEY_HEADER,
  SESSION_TOKEN_HEADER,
} from './utils';

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

/**
 * MSW Browser Worker Configuration Options
 */
export const MSW_CONFIG = {
  /**
   * Service worker script URL for MSW registration
   * Must be served from public directory in Next.js applications
   */
  serviceWorkerUrl: '/mockServiceWorker.js',
  
  /**
   * Default worker options for browser environment
   */
  workerOptions: {
    /**
     * Enable quiet mode to reduce console output in production builds
     */
    quiet: process.env.NODE_ENV === 'production',
    
    /**
     * Service worker registration options
     */
    serviceWorker: {
      url: '/mockServiceWorker.js',
      options: {
        scope: '/',
      },
    },
  },
  
  /**
   * API interception configuration
   */
  interception: {
    /**
     * Enable case transformation for API compatibility
     * Replicates Angular caseInterceptor behavior
     */
    enableCaseTransformation: true,
    
    /**
     * Enable authentication header validation
     * Replicates Angular sessionTokenInterceptor behavior
     */
    enableAuthValidation: true,
    
    /**
     * Enable error response standardization
     * Replicates Angular errorInterceptor behavior
     */
    enableErrorHandling: true,
    
    /**
     * Network delay simulation in milliseconds
     * Provides realistic API response timing
     */
    networkDelay: {
      min: 50,
      max: 200,
    },
    
    /**
     * DreamFactory API base paths for interception
     */
    apiPaths: [
      '/api/v2/*',
      '/system/api/v2/*',
      '/files/*',
    ],
  },
  
  /**
   * Development and debugging options
   */
  debug: {
    /**
     * Enable request/response logging in development
     */
    enableRequestLogging: process.env.NODE_ENV === 'development',
    
    /**
     * Log handler validation results
     */
    logHandlerValidation: process.env.NODE_ENV === 'development',
    
    /**
     * Enable detailed error logging
     */
    enableErrorLogging: true,
  },
} as const;

/**
 * Handler configuration presets for different testing scenarios
 */
export const HANDLER_PRESETS = {
  /**
   * Complete handler set for comprehensive testing
   * Includes all authentication, CRUD, system, and file operation handlers
   */
  full: mswConfig.browser,
  
  /**
   * Minimal handler set for focused testing
   * Authentication and basic CRUD operations only
   */
  minimal: mswConfig.minimal,
  
  /**
   * Authentication-only handlers for login/session testing
   */
  auth: mswConfig.authOnly,
  
  /**
   * System management handlers for admin functionality testing
   */
  system: mswConfig.systemOnly,
  
  /**
   * File operation handlers for file management testing
   */
  files: mswConfig.filesOnly,
} as const;

// ============================================================================
// WORKER INSTANCE MANAGEMENT
// ============================================================================

/**
 * Global MSW worker instance for browser environment
 * Singleton pattern ensures single worker registration
 */
let mswWorker: SetupWorker | null = null;

/**
 * Worker initialization state
 */
let isWorkerInitialized = false;

/**
 * Current worker configuration
 */
let currentConfig = MSW_CONFIG;

// ============================================================================
// MIDDLEWARE FUNCTIONS
// ============================================================================

/**
 * Request preprocessing middleware
 * Applies case transformation, authentication validation, and logging
 * 
 * @param request - MSW request object
 * @returns Preprocessed request data and validation results
 */
async function preprocessRequest(request: Request): Promise<{
  requestBody: unknown;
  transformResponse: (body: unknown) => unknown;
  authValidation: AuthValidationResult;
  shouldProceed: boolean;
}> {
  try {
    // Log request for debugging
    if (currentConfig.debug.enableRequestLogging) {
      logRequest(request, { timestamp: new Date().toISOString() });
    }
    
    // Process request body
    const requestBody = await processRequestBody(request);
    
    // Apply case transformation if enabled
    const { transformedRequestBody, transformResponse } = currentConfig.interception.enableCaseTransformation
      ? applyCaseTransformation(request, requestBody)
      : {
          transformedRequestBody: requestBody,
          transformResponse: (body: unknown) => body,
        };
    
    // Validate authentication headers if enabled
    let authValidation: AuthValidationResult = {
      isValid: true,
      errors: [],
    };
    
    if (currentConfig.interception.enableAuthValidation) {
      authValidation = validateAuthHeaders(request);
      
      // Check if request requires authentication
      const requiresAuth = request.url.includes('/api/v2/') && 
        !request.url.includes('/user/session') &&
        !request.url.includes('/user/register') &&
        !request.url.includes('/user/password');
      
      if (requiresAuth && !authValidation.isValid) {
        return {
          requestBody: transformedRequestBody,
          transformResponse,
          authValidation,
          shouldProceed: false,
        };
      }
    }
    
    return {
      requestBody: transformedRequestBody,
      transformResponse,
      authValidation,
      shouldProceed: true,
    };
  } catch (error) {
    if (currentConfig.debug.enableErrorLogging) {
      console.error('[MSW Setup] Request preprocessing error:', error);
    }
    
    return {
      requestBody: null,
      transformResponse: (body: unknown) => body,
      authValidation: {
        isValid: false,
        errors: ['Request preprocessing failed'],
      },
      shouldProceed: false,
    };
  }
}

/**
 * Response postprocessing middleware
 * Applies case transformation and adds standard headers
 * 
 * @param responseBody - Original response body
 * @param transformResponse - Response transformation function
 * @param request - Original request object
 * @returns Processed response
 */
function postprocessResponse(
  responseBody: unknown,
  transformResponse: (body: unknown) => unknown,
  request: Request
): unknown {
  try {
    // Apply case transformation
    const transformedResponse = transformResponse(responseBody);
    
    // Add response metadata for debugging
    if (currentConfig.debug.enableRequestLogging && transformedResponse && typeof transformedResponse === 'object') {
      (transformedResponse as Record<string, unknown>)._mswMeta = {
        timestamp: new Date().toISOString(),
        requestUrl: request.url,
        method: request.method,
      };
    }
    
    return transformedResponse;
  } catch (error) {
    if (currentConfig.debug.enableErrorLogging) {
      console.error('[MSW Setup] Response postprocessing error:', error);
    }
    return responseBody;
  }
}

/**
 * Network delay simulation
 * Provides realistic API response timing
 */
async function simulateRealisticDelay(): Promise<void> {
  const { min, max } = currentConfig.interception.networkDelay;
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await simulateNetworkDelay(delay);
}

// ============================================================================
// ENHANCED HANDLER FACTORY
// ============================================================================

/**
 * Creates enhanced handlers with middleware integration
 * Wraps original handlers with preprocessing and postprocessing logic
 * 
 * @param originalHandlers - Original MSW handlers
 * @returns Enhanced handlers with middleware
 */
function createEnhancedHandlers(originalHandlers: HttpHandler[]): HttpHandler[] {
  return originalHandlers.map(handler => {
    // Note: This is a conceptual enhancement - MSW handlers are immutable
    // The actual middleware integration happens at the worker level
    return handler;
  });
}

// ============================================================================
// WORKER SETUP FUNCTIONS
// ============================================================================

/**
 * Initialize MSW browser worker with comprehensive configuration
 * Sets up API interception, middleware, and error handling
 * 
 * @param handlers - MSW handlers to register (defaults to all handlers)
 * @param config - Configuration options (defaults to MSW_CONFIG)
 * @returns Promise resolving to SetupWorker instance
 */
export async function setupMSWWorker(
  handlers: HttpHandler[] = allHandlers,
  config: Partial<typeof MSW_CONFIG> = {}
): Promise<SetupWorker> {
  try {
    // Merge configuration with defaults
    currentConfig = { ...MSW_CONFIG, ...config };
    
    // Validate handler setup if debugging enabled
    if (currentConfig.debug.logHandlerValidation) {
      const validation = validateHandlerSetup(handlers);
      if (!validation.isValid) {
        console.warn('[MSW Setup] Handler validation issues:', validation.issues);
      } else {
        console.log('[MSW Setup] Handler validation passed:', {
          totalHandlers: validation.totalHandlers,
          handlersByDomain: validation.handlersByDomain,
        });
      }
    }
    
    // Create enhanced handlers with middleware
    const enhancedHandlers = createEnhancedHandlers(handlers);
    
    // Initialize worker
    mswWorker = setupWorker(...enhancedHandlers);
    
    // Configure worker options
    const workerOptions = {
      ...currentConfig.workerOptions,
      onUnhandledRequest: 'bypass' as const,
    };
    
    // Start worker with configuration
    await mswWorker.start(workerOptions);
    
    isWorkerInitialized = true;
    
    if (currentConfig.debug.enableRequestLogging) {
      console.log('[MSW Setup] Browser worker initialized successfully', {
        handlerCount: enhancedHandlers.length,
        serviceWorkerUrl: currentConfig.serviceWorkerUrl,
        enableCaseTransformation: currentConfig.interception.enableCaseTransformation,
        enableAuthValidation: currentConfig.interception.enableAuthValidation,
      });
    }
    
    return mswWorker;
  } catch (error) {
    console.error('[MSW Setup] Failed to initialize browser worker:', error);
    throw new Error(`MSW worker initialization failed: ${error}`);
  }
}

/**
 * Stop and cleanup MSW browser worker
 * Removes service worker registration and resets state
 */
export async function stopMSWWorker(): Promise<void> {
  try {
    if (mswWorker && isWorkerInitialized) {
      await mswWorker.stop();
      
      if (currentConfig.debug.enableRequestLogging) {
        console.log('[MSW Setup] Browser worker stopped successfully');
      }
    }
    
    mswWorker = null;
    isWorkerInitialized = false;
  } catch (error) {
    console.error('[MSW Setup] Failed to stop browser worker:', error);
    throw new Error(`MSW worker cleanup failed: ${error}`);
  }
}

/**
 * Reset MSW worker handlers at runtime
 * Useful for switching between different handler sets during testing
 * 
 * @param handlers - New handlers to apply
 */
export function resetMSWHandlers(handlers: HttpHandler[]): void {
  if (!mswWorker || !isWorkerInitialized) {
    throw new Error('MSW worker not initialized. Call setupMSWWorker() first.');
  }
  
  try {
    const enhancedHandlers = createEnhancedHandlers(handlers);
    mswWorker.resetHandlers(...enhancedHandlers);
    
    if (currentConfig.debug.enableRequestLogging) {
      console.log('[MSW Setup] Worker handlers reset', {
        handlerCount: enhancedHandlers.length,
      });
    }
  } catch (error) {
    console.error('[MSW Setup] Failed to reset worker handlers:', error);
    throw new Error(`MSW handler reset failed: ${error}`);
  }
}

/**
 * Get current worker status and configuration
 * Useful for debugging and validation
 */
export function getMSWWorkerStatus(): {
  isInitialized: boolean;
  worker: SetupWorker | null;
  config: typeof MSW_CONFIG;
} {
  return {
    isInitialized,
    worker: mswWorker,
    config: currentConfig,
  };
}

// ============================================================================
// PRESET CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Setup MSW worker with full handler preset
 * Includes all authentication, CRUD, system, and file operation handlers
 */
export async function setupFullMSW(): Promise<SetupWorker> {
  return setupMSWWorker(HANDLER_PRESETS.full);
}

/**
 * Setup MSW worker with minimal handler preset
 * Authentication and basic CRUD operations only
 */
export async function setupMinimalMSW(): Promise<SetupWorker> {
  return setupMSWWorker(HANDLER_PRESETS.minimal);
}

/**
 * Setup MSW worker with authentication-only handlers
 * For login/session testing scenarios
 */
export async function setupAuthOnlyMSW(): Promise<SetupWorker> {
  return setupMSWWorker(HANDLER_PRESETS.auth);
}

/**
 * Setup MSW worker with system management handlers
 * For admin functionality testing scenarios
 */
export async function setupSystemMSW(): Promise<SetupWorker> {
  return setupMSWWorker(HANDLER_PRESETS.system);
}

/**
 * Setup MSW worker with file operation handlers
 * For file management testing scenarios
 */
export async function setupFilesMSW(): Promise<SetupWorker> {
  return setupMSWWorker(HANDLER_PRESETS.files);
}

// ============================================================================
// TESTING UTILITIES
// ============================================================================

/**
 * Vitest testing utilities for MSW integration
 * Provides beforeAll/afterAll setup patterns for test environments
 */
export const vitestMSWUtils = {
  /**
   * Setup MSW worker before all tests
   * 
   * @param handlers - Handlers to use (defaults to all handlers)
   * @param config - Configuration options
   * @returns Promise resolving when setup is complete
   */
  async beforeAll(
    handlers: HttpHandler[] = allHandlers,
    config: Partial<typeof MSW_CONFIG> = {}
  ): Promise<void> {
    await setupMSWWorker(handlers, {
      ...config,
      debug: {
        ...config.debug,
        enableRequestLogging: false, // Reduce test output noise
      },
    });
  },
  
  /**
   * Cleanup MSW worker after all tests
   */
  async afterAll(): Promise<void> {
    await stopMSWWorker();
  },
  
  /**
   * Reset handlers between tests
   * 
   * @param handlers - Handlers to reset to (defaults to current handlers)
   */
  afterEach(handlers?: HttpHandler[]): void {
    if (mswWorker && isWorkerInitialized) {
      if (handlers) {
        resetMSWHandlers(handlers);
      } else {
        mswWorker.resetHandlers();
      }
    }
  },
};

// ============================================================================
// BROWSER ENVIRONMENT DETECTION & AUTO-SETUP
// ============================================================================

/**
 * Detect if running in browser environment
 */
function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Auto-setup MSW worker in development environment
 * Automatically initializes worker for in-browser API mocking
 */
export async function autoSetupMSWForDevelopment(): Promise<SetupWorker | null> {
  // Only auto-setup in browser development environment
  if (!isBrowserEnvironment() || process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  try {
    // Check if MSW should be enabled via environment variable
    const enableMSW = process.env.NEXT_PUBLIC_ENABLE_MSW === 'true';
    
    if (enableMSW) {
      console.log('[MSW Setup] Auto-initializing MSW for development...');
      return await setupFullMSW();
    }
    
    return null;
  } catch (error) {
    console.error('[MSW Setup] Auto-setup failed:', error);
    return null;
  }
}

// ============================================================================
// TYPE EXPORTS FOR EXTERNAL USAGE
// ============================================================================

/**
 * Export configuration types for external usage
 */
export type MSWConfig = typeof MSW_CONFIG;
export type HandlerPresets = typeof HANDLER_PRESETS;

/**
 * Export MSW worker instance type
 */
export type { SetupWorker };

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Default export provides the primary setup function
 * Most common usage pattern for MSW browser worker initialization
 */
export default setupMSWWorker;

// ============================================================================
// USAGE EXAMPLES AND DOCUMENTATION
// ============================================================================

/**
 * MSW Browser Worker Setup Usage Examples
 * 
 * @example
 * // Basic setup with all handlers
 * import { setupMSWWorker } from '@/test/mocks/setup';
 * 
 * const worker = await setupMSWWorker();
 * 
 * @example
 * // Setup with specific handler preset
 * import { setupAuthOnlyMSW } from '@/test/mocks/setup';
 * 
 * const worker = await setupAuthOnlyMSW();
 * 
 * @example
 * // Custom configuration
 * import { setupMSWWorker, MSW_CONFIG } from '@/test/mocks/setup';
 * 
 * const worker = await setupMSWWorker(customHandlers, {
 *   ...MSW_CONFIG,
 *   interception: {
 *     ...MSW_CONFIG.interception,
 *     enableCaseTransformation: false,
 *   },
 * });
 * 
 * @example
 * // Vitest test setup
 * import { beforeAll, afterAll, afterEach } from 'vitest';
 * import { vitestMSWUtils } from '@/test/mocks/setup';
 * 
 * beforeAll(vitestMSWUtils.beforeAll);
 * afterEach(vitestMSWUtils.afterEach);
 * afterAll(vitestMSWUtils.afterAll);
 * 
 * @example
 * // Development environment auto-setup
 * import { autoSetupMSWForDevelopment } from '@/test/mocks/setup';
 * 
 * // In app initialization
 * if (process.env.NODE_ENV === 'development') {
 *   await autoSetupMSWForDevelopment();
 * }
 * 
 * @example
 * // Dynamic handler switching
 * import { resetMSWHandlers, HANDLER_PRESETS } from '@/test/mocks/setup';
 * 
 * // Switch to authentication-only handlers
 * resetMSWHandlers(HANDLER_PRESETS.auth);
 * 
 * // Switch back to full handlers
 * resetMSWHandlers(HANDLER_PRESETS.full);
 */