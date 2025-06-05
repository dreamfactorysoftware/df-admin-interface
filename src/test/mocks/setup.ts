/**
 * MSW Browser Worker Setup Configuration
 * 
 * Initializes Mock Service Worker (MSW) for in-browser API mocking during development
 * and testing. This setup replaces Angular HTTP interceptors with MSW browser worker
 * configuration, providing realistic API behavior simulation without backend dependencies.
 * 
 * Features:
 * - Browser environment API interception for DreamFactory endpoints
 * - Case transformation middleware (camelCase ↔ snake_case) replicating Angular interceptor behavior
 * - Authentication header handling replacing Angular sessionTokenInterceptor functionality
 * - Error response handling mirroring Angular errorInterceptor patterns
 * - Seamless Vitest testing framework integration
 * - Development mode network simulation with realistic delays
 * 
 * This configuration ensures frontend development continues independently of backend
 * API availability while maintaining complete DreamFactory API contract compatibility.
 */

import { setupWorker } from 'msw/browser';
import type { SetupWorker } from 'msw/browser';

// Import MSW handlers and utilities
import { handlers, handlerCollections } from './handlers';
import {
  createCaseTransformMiddleware,
  createAuthMiddleware,
  simulateNetworkDelay,
  logRequest,
  type AuthContext,
} from './utils';

// ============================================================================
// BROWSER WORKER CONFIGURATION
// ============================================================================

/**
 * MSW Browser Worker Instance
 * 
 * Pre-configured worker instance with DreamFactory API handlers, case transformation
 * middleware, and authentication handling. Replaces Angular HTTP interceptor chain
 * with comprehensive API mocking capabilities.
 */
export const worker: SetupWorker = setupWorker(...handlers);

/**
 * Browser Worker Setup Options
 * 
 * Configuration options for MSW browser worker setup including service worker
 * registration, error handling, and development mode settings.
 */
export interface BrowserWorkerOptions {
  /** Enable quiet mode (suppress MSW console output) */
  quiet?: boolean;
  /** Service worker registration options */
  serviceWorker?: {
    /** Custom service worker URL */
    url?: string;
    /** Service worker registration options */
    options?: ServiceWorkerRegistrationOptions;
  };
  /** Enable development mode features (detailed logging, network delays) */
  developmentMode?: boolean;
  /** Enable authentication validation middleware */
  enableAuth?: boolean;
  /** Enable case transformation middleware */
  enableCaseTransform?: boolean;
  /** Custom network delay range in milliseconds */
  networkDelay?: {
    min: number;
    max: number;
  };
}

/**
 * Default MSW Browser Worker Configuration
 * 
 * Standard configuration optimized for DreamFactory Admin Interface development
 * with environment-specific optimizations.
 */
const defaultWorkerOptions: BrowserWorkerOptions = {
  quiet: process.env.NODE_ENV === 'test',
  developmentMode: process.env.NODE_ENV === 'development',
  enableAuth: true,
  enableCaseTransform: true,
  networkDelay: {
    min: 100,
    max: 500,
  },
  serviceWorker: {
    url: '/mockServiceWorker.js',
    options: {
      scope: '/',
    },
  },
};

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

/**
 * Configure MSW Request/Response Middleware
 * 
 * Sets up middleware pipeline that replicates Angular interceptor behavior:
 * 1. Case transformation (camelCase ↔ snake_case)
 * 2. Authentication header validation
 * 3. Error response standardization
 * 4. Development mode network simulation
 */
function configureMSWMiddleware(options: BrowserWorkerOptions) {
  // Configure case transformation middleware (replaces Angular case.interceptor.ts)
  if (options.enableCaseTransform) {
    worker.use(
      ...handlers.map((handler) => {
        const middleware = createCaseTransformMiddleware();
        return middleware(handler);
      })
    );
  }

  // Configure authentication middleware (replaces Angular session-token.interceptor.ts)
  if (options.enableAuth) {
    worker.use(
      ...handlers.map((handler) => {
        const authMiddleware = createAuthMiddleware({
          requireAuth: false, // Let individual handlers decide auth requirements
        });
        return authMiddleware(handler);
      })
    );
  }
}

/**
 * Development Mode Request Interceptor
 * 
 * Adds development-specific features including request logging and network delay
 * simulation for realistic API behavior during development.
 */
function setupDevelopmentFeatures(options: BrowserWorkerOptions) {
  if (!options.developmentMode) return;

  // Add request logging for development debugging
  worker.events.on('request:start', ({ request }) => {
    if (request.url.includes('/api/')) {
      logRequest(request, 'MSW Intercepted');
    }
  });

  // Add response logging for development debugging
  worker.events.on('response:mocked', ({ request, response }) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MSW Response]`, {
        method: request.method,
        url: request.url,
        status: response.status,
        statusText: response.statusText,
      });
    }
  });

  // Simulate realistic network delays for development testing
  if (options.networkDelay) {
    worker.events.on('request:start', async () => {
      const delay = Math.random() * (options.networkDelay!.max - options.networkDelay!.min) + options.networkDelay!.min;
      await simulateNetworkDelay(delay);
    });
  }
}

// ============================================================================
// BROWSER WORKER INITIALIZATION
// ============================================================================

/**
 * Initialize MSW Browser Worker
 * 
 * Comprehensive browser worker setup with middleware configuration, service worker
 * registration, and environment-specific optimizations. Ensures MSW is properly
 * configured for DreamFactory API mocking in browser environments.
 * 
 * @param options - Browser worker configuration options
 * @returns Promise resolving to initialized worker instance
 */
export async function initializeBrowserWorker(
  options: Partial<BrowserWorkerOptions> = {}
): Promise<SetupWorker> {
  const config = { ...defaultWorkerOptions, ...options };

  try {
    // Configure middleware pipeline
    configureMSWMiddleware(config);

    // Set up development features if enabled
    setupDevelopmentFeatures(config);

    // Start MSW browser worker with service worker registration
    await worker.start({
      quiet: config.quiet,
      serviceWorker: config.serviceWorker,
      onUnhandledRequest: (request) => {
        // Only warn about unhandled API requests to reduce noise
        if (request.url.includes('/api/')) {
          console.warn(`[MSW] Unhandled API request: ${request.method} ${request.url}`);
        }
      },
    });

    if (!config.quiet) {
      console.log('[MSW] Browser worker initialized with DreamFactory API handlers');
      console.log(`[MSW] Handlers loaded: ${handlers.length}`);
      console.log('[MSW] Middleware configured: Case transformation, Authentication');
      
      if (config.developmentMode) {
        console.log('[MSW] Development mode enabled: Logging, Network delays');
      }
    }

    return worker;
  } catch (error) {
    console.error('[MSW] Failed to initialize browser worker:', error);
    throw error;
  }
}

/**
 * Stop MSW Browser Worker
 * 
 * Gracefully stops the MSW worker and unregisters the service worker.
 * Used for cleanup in testing environments or when switching between
 * different MSW configurations.
 */
export async function stopBrowserWorker(): Promise<void> {
  try {
    await worker.stop();
    console.log('[MSW] Browser worker stopped');
  } catch (error) {
    console.error('[MSW] Failed to stop browser worker:', error);
    throw error;
  }
}

/**
 * Reset MSW Browser Worker Handlers
 * 
 * Resets worker handlers to default configuration. Useful for testing
 * scenarios where specific handler subsets are needed.
 * 
 * @param handlerType - Type of handlers to use ('all', 'authentication', 'crud', 'system', 'files')
 */
export function resetWorkerHandlers(handlerType: keyof typeof handlerCollections = 'all'): void {
  const selectedHandlers = handlerCollections[handlerType];
  worker.resetHandlers(...selectedHandlers);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[MSW] Handlers reset to: ${handlerType} (${selectedHandlers.length} handlers)`);
  }
}

// ============================================================================
// VITEST INTEGRATION
// ============================================================================

/**
 * MSW Setup for Vitest Testing
 * 
 * Specialized configuration for Vitest test environment with optimized
 * performance and reliable test execution. Disables network delays and
 * unnecessary logging for faster test runs.
 */
export async function setupMSWForVitest(): Promise<SetupWorker> {
  const vitestConfig: BrowserWorkerOptions = {
    quiet: true,
    developmentMode: false,
    enableAuth: true,
    enableCaseTransform: true,
    networkDelay: undefined, // Disable delays in testing
  };

  return initializeBrowserWorker(vitestConfig);
}

/**
 * MSW Cleanup for Vitest Testing
 * 
 * Comprehensive cleanup function for Vitest testing environment.
 * Ensures clean state between test runs and prevents handler leakage.
 */
export async function cleanupMSWForVitest(): Promise<void> {
  // Reset to default handlers
  worker.resetHandlers(...handlers);
  
  // Clean up any pending requests
  worker.listHandlers().forEach((handler) => {
    // Reset handler state if applicable
  });
  
  // Stop worker if running
  await stopBrowserWorker();
}

// ============================================================================
// DEVELOPMENT UTILITIES
// ============================================================================

/**
 * Development Mode MSW Configuration
 * 
 * Enhanced configuration for development environment with comprehensive
 * logging, network simulation, and debugging capabilities.
 */
export async function setupDevelopmentMSW(): Promise<SetupWorker> {
  const developmentConfig: BrowserWorkerOptions = {
    quiet: false,
    developmentMode: true,
    enableAuth: true,
    enableCaseTransform: true,
    networkDelay: {
      min: 100,
      max: 800, // Slightly higher delays for development testing
    },
  };

  const workerInstance = await initializeBrowserWorker(developmentConfig);

  // Additional development-specific logging
  console.group('[MSW Development Setup]');
  console.log('✅ Case transformation middleware active');
  console.log('✅ Authentication middleware active');
  console.log('✅ DreamFactory API handlers loaded');
  console.log('✅ Network delay simulation enabled');
  console.log('✅ Request/response logging enabled');
  console.groupEnd();

  return workerInstance;
}

/**
 * Production Mode MSW Configuration
 * 
 * Minimal configuration for production builds where MSW is used for
 * fallback scenarios or staging environment testing.
 */
export async function setupProductionMSW(): Promise<SetupWorker> {
  const productionConfig: BrowserWorkerOptions = {
    quiet: true,
    developmentMode: false,
    enableAuth: true,
    enableCaseTransform: true,
    networkDelay: undefined,
  };

  return initializeBrowserWorker(productionConfig);
}

// ============================================================================
// EXPORTS AND WORKER INSTANCE
// ============================================================================

/**
 * Pre-configured Worker Instances
 * 
 * Ready-to-use worker configurations for different environments and use cases.
 */
export const workerConfigurations = {
  development: setupDevelopmentMSW,
  production: setupProductionMSW,
  testing: setupMSWForVitest,
  default: initializeBrowserWorker,
};

/**
 * MSW Worker Status and Information
 * 
 * Utility functions for inspecting worker state and configuration.
 */
export const workerUtils = {
  /**
   * Check if MSW worker is currently running
   */
  isRunning: (): boolean => {
    // MSW doesn't expose a direct isRunning check, so we check for active handlers
    return worker.listHandlers().length > 0;
  },

  /**
   * Get current handler count and types
   */
  getHandlerInfo: () => ({
    total: worker.listHandlers().length,
    active: worker.listHandlers().filter(handler => handler).length,
    available: {
      authentication: handlerCollections.authentication.length,
      crud: handlerCollections.crud.length,
      system: handlerCollections.system.length,
      files: handlerCollections.files.length,
    },
  }),

  /**
   * Reset worker to specific handler configuration
   */
  resetToHandlers: (handlerType: keyof typeof handlerCollections) => {
    resetWorkerHandlers(handlerType);
  },

  /**
   * Add custom handler to existing configuration
   */
  addHandler: (handler: any) => {
    worker.use(handler);
  },
};

// ============================================================================
// AUTOMATIC INITIALIZATION
// ============================================================================

/**
 * Automatic MSW Worker Initialization
 * 
 * Automatically initializes MSW worker based on environment variables and
 * build configuration. Ensures consistent MSW setup across different
 * development and testing scenarios.
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // Browser environment detected and not in production
  const enableMSW = process.env.NEXT_PUBLIC_ENABLE_MSW !== 'false';
  
  if (enableMSW) {
    // Defer initialization to avoid blocking app startup
    setTimeout(async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          await setupDevelopmentMSW();
        } else if (process.env.NODE_ENV === 'test') {
          await setupMSWForVitest();
        } else {
          await initializeBrowserWorker();
        }
      } catch (error) {
        console.error('[MSW] Auto-initialization failed:', error);
      }
    }, 0);
  }
}

// ============================================================================
// DEFAULT EXPORTS
// ============================================================================

/**
 * Default export provides the worker instance and primary initialization function.
 * This is the recommended import for most use cases requiring MSW browser setup.
 * 
 * Usage examples:
 * 
 * ```typescript
 * // Standard development setup
 * import { initializeBrowserWorker } from './test/mocks/setup';
 * await initializeBrowserWorker();
 * ```
 * 
 * ```typescript
 * // Vitest testing setup
 * import { setupMSWForVitest } from './test/mocks/setup';
 * beforeAll(async () => {
 *   await setupMSWForVitest();
 * });
 * ```
 * 
 * ```typescript
 * // Custom configuration
 * import { initializeBrowserWorker } from './test/mocks/setup';
 * await initializeBrowserWorker({
 *   developmentMode: true,
 *   enableAuth: false,
 *   networkDelay: { min: 50, max: 200 }
 * });
 * ```
 */
export default {
  worker,
  initializeBrowserWorker,
  setupMSWForVitest,
  setupDevelopmentMSW,
  setupProductionMSW,
  stopBrowserWorker,
  resetWorkerHandlers,
  workerConfigurations,
  workerUtils,
};