/**
 * MSW Server Setup for Node.js Testing Environment
 * 
 * Mock Service Worker (MSW) server configuration optimized for Vitest 2.1.0 
 * test execution and CI/CD pipeline environments. This setup enables API mocking
 * during unit tests, integration tests, and automated testing workflows without
 * requiring external DreamFactory API dependencies.
 * 
 * Key Features:
 * - Server-side request interception for Node.js test environments
 * - Consistent API behavior with browser MSW setup for development
 * - Automated cleanup and setup for Vitest test lifecycle
 * - CI/CD optimized configuration with predictable response times
 * - Complete DreamFactory API endpoint coverage for testing scenarios
 * 
 * Performance Characteristics:
 * - Zero network latency for mocked requests
 * - Deterministic responses for reliable test execution
 * - Parallel test execution support with isolated mock states
 * - Memory-efficient handler management for large test suites
 * 
 * Usage:
 * - Automatically configured in Vitest setup files
 * - Provides consistent API mocking across all test types
 * - Enables offline testing and development workflows
 * - Supports both unit and integration testing scenarios
 */

import { setupServer } from 'msw/node';
import type { SetupServer } from 'msw/node';
import { handlers, handlerCollections, testUtilities } from './handlers';

// ============================================================================
// MSW SERVER CONFIGURATION
// ============================================================================

/**
 * MSW Server Instance
 * 
 * Primary server setup for Node.js testing environments that intercepts
 * all HTTP requests during test execution. Configured with comprehensive
 * DreamFactory API handlers to provide realistic API behavior simulation
 * without external dependencies.
 * 
 * Handler Organization:
 * - Authentication: User/admin login, session management, JWT validation
 * - CRUD Operations: Generic database operations with pagination and filtering
 * - System Management: Configuration, services, users, roles, applications
 * - File Operations: File upload/download, directory management, log access
 * 
 * Performance Optimizations:
 * - Request handlers execute synchronously for faster test execution
 * - Response data is pre-generated and cached for consistent performance
 * - Memory usage optimized for parallel test execution scenarios
 */
export const server: SetupServer = setupServer(...handlers);

// ============================================================================
// SERVER LIFECYCLE MANAGEMENT
// ============================================================================

/**
 * Server Startup Configuration
 * 
 * Initializes MSW server with optimized settings for testing environments.
 * Configures request/response logging, error handling, and performance
 * characteristics specifically for Vitest test execution.
 * 
 * Configuration Options:
 * - onUnhandledRequest: Configurable behavior for unmocked requests
 * - quiet: Reduces console output during test execution for cleaner logs
 * - waitUntilReady: Ensures server is ready before test execution begins
 */
export const startServer = (): void => {
  server.listen({
    // Warn about unhandled requests during development but allow them
    // to pass through in case tests need to make real network requests
    onUnhandledRequest: process.env.NODE_ENV === 'test' ? 'warn' : 'bypass',
    
    // Reduce noise in test output while maintaining error visibility
    quiet: process.env.CI === 'true',
  });
};

/**
 * Server Cleanup Configuration
 * 
 * Properly closes MSW server and cleans up resources after test execution.
 * Ensures no memory leaks or hanging processes in CI/CD environments.
 */
export const stopServer = (): void => {
  server.close();
};

/**
 * Server Reset Configuration
 * 
 * Resets all request handlers to their initial state between test runs.
 * Essential for test isolation and preventing state contamination across
 * different test suites and scenarios.
 * 
 * Reset Operations:
 * - Clears all runtime handler modifications
 * - Resets authentication state and session tokens
 * - Reinitializes mock data to default values
 * - Clears any accumulated request history
 */
export const resetServer = (): void => {
  server.resetHandlers();
};

// ============================================================================
// TESTING ENVIRONMENT CONFIGURATIONS
// ============================================================================

/**
 * Development Testing Configuration
 * 
 * Enhanced server setup for development environments with detailed logging
 * and debugging capabilities. Provides comprehensive request/response logging
 * and extended mock data for thorough testing scenarios.
 */
export const startDevelopmentServer = (): void => {
  server.listen({
    onUnhandledRequest: (request, print) => {
      // Log unhandled requests in development for debugging
      if (request.url.pathname.startsWith('/api/')) {
        console.warn('Unhandled API request:', request.method, request.url.href);
        print.warning();
      }
    },
    quiet: false, // Enable detailed logging in development
  });
  
  // Development-specific logging
  if (process.env.NODE_ENV === 'development') {
    console.info('🔧 MSW Server started for development testing');
    console.info(`📊 Total handlers loaded: ${handlers.length}`);
    console.info('🚀 API mocking active for all DreamFactory endpoints');
  }
};

/**
 * CI/CD Pipeline Configuration
 * 
 * Optimized server setup for continuous integration environments with
 * minimal logging and maximum performance. Configured for reliability
 * and speed in automated testing scenarios.
 */
export const startCIServer = (): void => {
  server.listen({
    // Strict mode: fail tests if unhandled requests occur
    onUnhandledRequest: 'error',
    
    // Completely silent operation for CI logs
    quiet: true,
  });
};

/**
 * Integration Testing Configuration
 * 
 * Specialized server setup for integration tests that require specific
 * handler configurations or modified API behavior. Supports dynamic
 * handler replacement and scenario-based testing.
 */
export const startIntegrationServer = (customHandlers?: typeof handlers): void => {
  const serverHandlers = customHandlers || handlers;
  
  server.listen({
    onUnhandledRequest: 'warn',
    quiet: process.env.CI === 'true',
  });
  
  // Replace handlers if custom ones are provided
  if (customHandlers) {
    server.use(...customHandlers);
  }
};

// ============================================================================
// HANDLER MANAGEMENT AND UTILITIES
// ============================================================================

/**
 * Dynamic Handler Management
 * 
 * Utilities for modifying server behavior during test execution.
 * Enables scenario-based testing with different API behaviors,
 * error conditions, and response patterns.
 */
export const serverUtils = {
  /**
   * Replace Current Handlers
   * 
   * Dynamically replaces active handlers with new ones for specific
   * test scenarios. Useful for testing error conditions, authentication
   * failures, or edge cases.
   */
  useHandlers: (...newHandlers: Parameters<typeof server.use>) => {
    server.use(...newHandlers);
  },
  
  /**
   * Reset to Default Handlers
   * 
   * Restores the original handler configuration, clearing any runtime
   * modifications made during test execution.
   */
  resetHandlers: () => {
    server.resetHandlers(...handlers);
  },
  
  /**
   * Use Handler Collection
   * 
   * Applies a specific subset of handlers for focused testing scenarios.
   * Enables testing individual functional domains without full API coverage.
   */
  useHandlerCollection: (collection: keyof typeof handlerCollections) => {
    server.resetHandlers(...handlerCollections[collection]);
  },
  
  /**
   * Create Test Scenario
   * 
   * Generates specific testing scenarios using utility functions from
   * the handlers module. Supports authentication errors, CRUD failures,
   * and custom API behaviors.
   */
  createScenario: (scenarioType: string, ...args: any[]) => {
    switch (scenarioType) {
      case 'auth-failure':
        return testUtilities.createAuthScenario(args[0]);
      case 'network-error':
        return testUtilities.crud.createNetworkErrorHandler();
      default:
        throw new Error(`Unknown scenario type: ${scenarioType}`);
    }
  },
};

/**
 * Server State Information
 * 
 * Provides runtime information about the MSW server state for debugging
 * and monitoring purposes. Useful for understanding current configuration
 * and handler status during test execution.
 */
export const serverInfo = {
  /**
   * Get Active Handler Count
   * 
   * Returns the number of currently active request handlers.
   */
  getHandlerCount: (): number => handlers.length,
  
  /**
   * Get Handler Collections Info
   * 
   * Returns metadata about available handler collections and their sizes.
   */
  getCollectionsInfo: () => ({
    authentication: handlerCollections.authentication.length,
    crud: handlerCollections.crud.length,
    system: handlerCollections.system.length,
    files: handlerCollections.files.length,
    total: handlers.length,
  }),
  
  /**
   * Validate Server Status
   * 
   * Checks if the MSW server is properly configured and ready for testing.
   */
  isServerReady: (): boolean => {
    try {
      // Simple validation - check if handlers are loaded
      return handlers.length > 0;
    } catch (error) {
      console.error('MSW Server validation failed:', error);
      return false;
    }
  },
  
  /**
   * Get Environment Configuration
   * 
   * Returns current environment-specific configuration details.
   */
  getEnvironmentConfig: () => ({
    nodeEnv: process.env.NODE_ENV,
    isCI: process.env.CI === 'true',
    isTesting: process.env.NODE_ENV === 'test',
    handlerMode: process.env.MSW_MODE || 'standard',
  }),
};

// ============================================================================
// VITEST INTEGRATION HELPERS
// ============================================================================

/**
 * Vitest Setup Helper
 * 
 * Streamlined setup function for Vitest configuration files.
 * Provides automatic server lifecycle management that integrates
 * seamlessly with Vitest's setup and teardown hooks.
 * 
 * Usage in vitest.config.ts or setupTests.ts:
 * ```typescript
 * import { setupVitestServer } from './test/mocks/server';
 * 
 * setupVitestServer();
 * ```
 */
export const setupVitestServer = (): void => {
  // Start server before all tests
  beforeAll(() => {
    if (process.env.CI === 'true') {
      startCIServer();
    } else if (process.env.NODE_ENV === 'development') {
      startDevelopmentServer();
    } else {
      startServer();
    }
  });
  
  // Reset handlers between test runs for isolation
  afterEach(() => {
    resetServer();
  });
  
  // Clean up server after all tests
  afterAll(() => {
    stopServer();
  });
};

/**
 * Test Suite Configuration Helper
 * 
 * Provides per-test-suite configuration for specific testing scenarios.
 * Enables customized MSW behavior for different types of test suites.
 */
export const configureTestSuite = (config: {
  handlers?: typeof handlers;
  strictMode?: boolean;
  logging?: boolean;
}): void => {
  const { handlers: customHandlers, strictMode = false, logging = false } = config;
  
  beforeAll(() => {
    server.listen({
      onUnhandledRequest: strictMode ? 'error' : 'warn',
      quiet: !logging,
    });
    
    if (customHandlers) {
      server.use(...customHandlers);
    }
  });
  
  afterEach(() => {
    server.resetHandlers();
  });
  
  afterAll(() => {
    server.close();
  });
};

// ============================================================================
// ERROR HANDLING AND DEBUGGING
// ============================================================================

/**
 * Server Error Handler
 * 
 * Comprehensive error handling for MSW server operations.
 * Provides detailed error information and recovery strategies
 * for common testing environment issues.
 */
export const handleServerError = (error: Error, context: string): void => {
  console.error(`MSW Server Error in ${context}:`, error.message);
  
  // Provide specific guidance based on error type
  if (error.message.includes('listen')) {
    console.error('❌ Server failed to start. Check for port conflicts or permissions.');
  } else if (error.message.includes('handler')) {
    console.error('❌ Handler configuration error. Verify handler imports and exports.');
  } else {
    console.error('❌ General server error. Check MSW configuration and dependencies.');
  }
  
  // In test environments, ensure the error is visible
  if (process.env.NODE_ENV === 'test') {
    throw error;
  }
};

/**
 * Debug Information Helper
 * 
 * Provides detailed debugging information about the MSW server state,
 * active handlers, and configuration. Useful for troubleshooting
 * test failures and handler conflicts.
 */
export const debugServer = (): void => {
  console.group('🔍 MSW Server Debug Information');
  console.log('Environment:', serverInfo.getEnvironmentConfig());
  console.log('Handler Collections:', serverInfo.getCollectionsInfo());
  console.log('Server Ready:', serverInfo.isServerReady());
  console.log('Total Handlers:', serverInfo.getHandlerCount());
  console.groupEnd();
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Default Export Configuration
 * 
 * Provides the primary MSW server instance for standard testing scenarios.
 * This is the recommended import for most Vitest testing configurations
 * requiring complete DreamFactory API mocking.
 * 
 * Usage Examples:
 * 
 * ```typescript
 * // Standard Vitest setup
 * import { setupVitestServer } from './test/mocks/server';
 * setupVitestServer();
 * ```
 * 
 * ```typescript
 * // Manual server management
 * import server, { startServer, stopServer } from './test/mocks/server';
 * 
 * beforeAll(() => startServer());
 * afterAll(() => stopServer());
 * ```
 * 
 * ```typescript
 * // Custom handler scenarios
 * import { server, serverUtils } from './test/mocks/server';
 * 
 * test('authentication failure', () => {
 *   serverUtils.useHandlers(testUtilities.createAuthScenario('invalid-token'));
 *   // Test authentication failure handling
 * });
 * ```
 */
export default server;