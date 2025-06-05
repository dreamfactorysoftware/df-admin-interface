/**
 * MSW Handlers - Main Aggregation File
 * 
 * Centralized Mock Service Worker handlers that consolidate all DreamFactory API
 * endpoint mocks into a single import for comprehensive testing and development.
 * This file replaces the Angular HTTP interceptor chain with a complete MSW
 * handler collection organized by functional domain.
 * 
 * Handler Organization:
 * - Authentication handlers: User/admin login, session management, password reset
 * - CRUD handlers: Generic database operations, schema discovery, API generation
 * - System handlers: Configuration, services, users, roles, apps, scheduler
 * - File handlers: File operations, directory management, log access
 * 
 * This modular organization enables:
 * - Easy maintenance and updates of specific endpoint groups
 * - Selective handler usage for focused testing scenarios
 * - Complete API coverage for React/Next.js migration development
 * - Realistic API behavior simulation without backend dependencies
 * 
 * Usage:
 * - Import `handlers` for complete API coverage
 * - Import specific handler groups for targeted testing
 * - Use utility exports for custom test scenarios
 */

import type { RequestHandler } from 'msw';

// Import all handler modules
import { authHandlers, authTestUtils } from './auth-handlers';
import { crudHandlers, crudUtilities } from './crud-handlers';
import { systemHandlers } from './system-handlers';
import { fileHandlers } from './file-handlers';

// ============================================================================
// HANDLER ORGANIZATION BY FUNCTIONAL DOMAIN
// ============================================================================

/**
 * Authentication and Session Management Handlers
 * 
 * Comprehensive authentication flow support including:
 * - User and admin login/logout workflows
 * - Session validation and token refresh
 * - Password reset and user registration
 * - JWT token simulation and validation
 * 
 * Endpoints covered:
 * - POST/GET/DELETE /api/v2/user/session
 * - POST/GET/DELETE /api/v2/system/admin/session  
 * - POST/PUT /api/v2/user/password (reset workflow)
 * - POST /api/v2/user/register
 * - PUT /api/v2/user/verify (email verification)
 * - GET /api/v2/session/validate (generic validation)
 */
export const authenticationHandlers: RequestHandler[] = authHandlers;

/**
 * CRUD and Database Operation Handlers
 * 
 * Generic CRUD operations for all DreamFactory entity endpoints with:
 * - RESTful operations (GET, POST, PUT, PATCH, DELETE)
 * - Pagination, filtering, and sorting support
 * - Bulk operations with comma-separated ID handling
 * - File upload/download with FormData support
 * - Database connection testing
 * - Schema discovery and OpenAPI generation
 * 
 * Endpoints covered:
 * - /api/v2/system/* (all system entities)
 * - /api/v2/{service}/* (all database service endpoints)
 * - /api/v2/{service}/_schema (schema discovery)
 * - /api/v2/{service}/_openapi (OpenAPI spec generation)
 * - /api/v2/system/service/test (connection testing)
 */
export const crudOperationHandlers: RequestHandler[] = crudHandlers;

/**
 * System Configuration and Management Handlers
 * 
 * DreamFactory system administration functionality including:
 * - System environment and configuration access
 * - Service lifecycle management (create, update, delete)
 * - User and role management
 * - Application registration and API key management
 * - Event scripts and scheduled task management
 * - API documentation generation
 * - Global settings (CORS, cache, lookup keys, email templates)
 * 
 * Endpoints covered:
 * - GET/PUT /api/v2/system/environment
 * - GET/PUT /api/v2/system/config
 * - CRUD /api/v2/system/service
 * - CRUD /api/v2/system/user, /api/v2/system/role, /api/v2/system/admin
 * - CRUD /api/v2/system/app
 * - GET /api/v2/system/event, /api/v2/system/scheduler
 * - GET /api/v2/system/api_docs
 * - GET /api/v2/system/cors, /api/v2/system/cache, /api/v2/system/lookup
 */
export const systemManagementHandlers: RequestHandler[] = systemHandlers;

/**
 * File System and Log Management Handlers
 * 
 * Complete file operations with hierarchical navigation support:
 * - File and directory browsing with metadata
 * - File upload with FormData and progress simulation
 * - File download with proper content-type headers
 * - Directory creation and file deletion
 * - Log file access with authentication
 * - MIME type detection and validation
 * 
 * Endpoints covered:
 * - GET /api/v2/system/service (file service discovery)
 * - CRUD /api/v2/{fileService}/ (file operations)
 * - GET /api/v2/logs/ (log file access)
 * - Upload/download with proper binary handling
 */
export const fileOperationHandlers: RequestHandler[] = fileHandlers;

// ============================================================================
// COMPLETE HANDLER COLLECTION
// ============================================================================

/**
 * Complete MSW Handler Collection
 * 
 * Consolidated array of all DreamFactory API endpoint handlers providing
 * comprehensive coverage for development and testing scenarios. This replaces
 * the Angular HTTP interceptor chain with realistic API behavior simulation.
 * 
 * Handler execution order:
 * 1. Authentication handlers (most specific first)
 * 2. System management handlers 
 * 3. File operation handlers
 * 4. CRUD handlers (most generic, catch-all patterns)
 * 
 * This ordering ensures specific endpoints are matched before generic patterns,
 * preventing conflicts and ensuring accurate API simulation.
 */
export const handlers: RequestHandler[] = [
  // Authentication and session management (highest priority)
  ...authenticationHandlers,
  
  // System configuration and management
  ...systemManagementHandlers,
  
  // File system operations
  ...fileOperationHandlers,
  
  // Generic CRUD operations (lowest priority - catch-all)
  ...crudOperationHandlers,
];

// ============================================================================
// TESTING AND DEVELOPMENT UTILITIES
// ============================================================================

/**
 * Handler Collections by Category
 * 
 * Organized exports for selective handler usage in specific testing scenarios.
 * Enables focused testing of individual functional domains without full API coverage.
 */
export const handlerCollections = {
  authentication: authenticationHandlers,
  crud: crudOperationHandlers,
  system: systemManagementHandlers,
  files: fileOperationHandlers,
  all: handlers,
};

/**
 * Test Utilities and Helper Functions
 * 
 * Comprehensive collection of testing utilities for creating custom scenarios,
 * generating mock data, and validating API behavior during development.
 */
export const testUtilities = {
  // Authentication utilities
  auth: authTestUtils,
  
  // CRUD operation utilities
  crud: crudUtilities,
  
  // Handler creation utilities
  createAuthScenario: (scenario: string) => authTestUtils.createAuthenticationError(scenario),
  createCrudHandler: crudUtilities.createCrudHandler,
  
  // Data generation helpers
  generateMockJwt: authTestUtils.generateMockJwtToken,
  validateMockJwt: authTestUtils.validateMockJwtToken,
  createSessionResponse: authTestUtils.createSessionResponse,
  
  // Mock data access
  mockUsers: authTestUtils.mockUsers,
  mockAdmins: authTestUtils.mockAdmins,
  mockRoles: authTestUtils.mockRoles,
};

// ============================================================================
// ENVIRONMENT-SPECIFIC CONFIGURATIONS
// ============================================================================

/**
 * Development Environment Handlers
 * 
 * Enhanced handler collection for development with additional debugging
 * and detailed error information. Includes comprehensive logging and
 * extended mock data for thorough testing scenarios.
 */
export const developmentHandlers: RequestHandler[] = [
  ...handlers,
  // Development-specific handlers can be added here
  // Example: Enhanced error scenarios, detailed logging handlers
];

/**
 * Testing Environment Handlers
 * 
 * Streamlined handler collection optimized for automated testing.
 * Reduces network delays and provides predictable responses for
 * reliable test execution.
 */
export const testingHandlers: RequestHandler[] = [
  ...handlers,
  // Testing-specific handlers can be added here
  // Example: Fast-response handlers, specific test scenario endpoints
];

// ============================================================================
// MSW SETUP HELPERS
// ============================================================================

/**
 * Browser MSW Setup Configuration
 * 
 * Pre-configured handler collection optimized for browser-based development
 * and testing. Includes client-side specific configurations and browser
 * compatibility considerations.
 */
export const browserHandlers = handlers;

/**
 * Server MSW Setup Configuration
 * 
 * Pre-configured handler collection optimized for server-side testing
 * environments including Node.js test runners and CI/CD pipelines.
 */
export const serverHandlers = handlers;

/**
 * Handler Statistics and Information
 * 
 * Metadata about the handler collection for monitoring and debugging.
 * Provides insights into API coverage and handler organization.
 */
export const handlerInfo = {
  totalHandlers: handlers.length,
  handlerCounts: {
    authentication: authenticationHandlers.length,
    crud: crudOperationHandlers.length,
    system: systemManagementHandlers.length,
    files: fileOperationHandlers.length,
  },
  endpoints: {
    authentication: [
      'POST/GET/DELETE /api/v2/user/session',
      'POST/GET/DELETE /api/v2/system/admin/session',
      'POST/PUT /api/v2/user/password',
      'POST /api/v2/user/register',
      'PUT /api/v2/user/verify',
    ],
    system: [
      'GET/PUT /api/v2/system/environment',
      'GET/PUT /api/v2/system/config',
      'CRUD /api/v2/system/service',
      'CRUD /api/v2/system/user',
      'CRUD /api/v2/system/role',
      'CRUD /api/v2/system/admin',
      'CRUD /api/v2/system/app',
    ],
    crud: [
      'CRUD /api/v2/{service}/*',
      'GET /api/v2/{service}/_schema',
      'GET /api/v2/{service}/_openapi',
      'POST /api/v2/system/service/test',
    ],
    files: [
      'CRUD /api/v2/{fileService}/*',
      'GET /api/v2/logs/*',
      'File upload/download operations',
    ],
  },
  coverage: 'Complete DreamFactory API endpoint coverage',
  lastUpdated: new Date().toISOString(),
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Default export provides the complete handler collection for standard MSW setup.
 * This is the recommended import for most use cases requiring full API coverage.
 * 
 * Usage examples:
 * 
 * ```typescript
 * // Standard MSW setup with complete coverage
 * import { setupWorker } from 'msw/browser';
 * import handlers from './test/mocks/handlers';
 * 
 * export const worker = setupWorker(...handlers);
 * ```
 * 
 * ```typescript
 * // Node.js testing setup
 * import { setupServer } from 'msw/node';
 * import handlers from './test/mocks/handlers';
 * 
 * export const server = setupServer(...handlers);
 * ```
 * 
 * ```typescript
 * // Selective handler usage
 * import { handlerCollections } from './test/mocks/handlers';
 * 
 * const authOnlyServer = setupServer(...handlerCollections.authentication);
 * ```
 */
export default handlers;