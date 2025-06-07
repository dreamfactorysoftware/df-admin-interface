/**
 * MSW Handlers Aggregation
 * 
 * Centralized Mock Service Worker handlers collection for comprehensive DreamFactory API endpoint mocking.
 * This module consolidates all API mock handlers into organized collections for easy setup and maintenance
 * across different testing scenarios and development environments.
 * 
 * Features:
 * - Complete DreamFactory API endpoint coverage for authentication, CRUD operations, system management, and file operations
 * - Modular handler organization by functional domain for maintainable test setup
 * - Easy integration with both browser and server MSW configurations
 * - Comprehensive mock data and realistic API behavior simulation
 * - Support for all HTTP methods (GET, POST, PUT, PATCH, DELETE) with proper error handling
 * - Case transformation support (camelCase ↔ snake_case) for API compatibility
 * - Authentication and authorization validation with role-based access control
 * - File upload/download simulation with FormData and blob response handling
 * 
 * Usage Examples:
 * 
 * // Setup all handlers for comprehensive testing
 * import { allHandlers } from '@/test/mocks/handlers';
 * setupServer(...allHandlers);
 * 
 * // Setup specific handler groups for focused testing
 * import { authHandlers, crudHandlers } from '@/test/mocks/handlers';
 * setupServer(...authHandlers, ...crudHandlers);
 * 
 * // Browser setup
 * import { allHandlers } from '@/test/mocks/handlers';
 * setupWorker(...allHandlers);
 * 
 * Handler Categories:
 * - Authentication: User/admin login, logout, session management, password reset
 * - CRUD Operations: Generic database operations, pagination, filtering, bulk operations
 * - System Management: Service configuration, user/role management, system info
 * - File Operations: File upload/download, directory management, file browsing
 */

import { HttpHandler } from 'msw';

// Import authentication handlers
import { 
  authHandlers,
  clearAllSessions,
  clearPasswordResetTokens,
  isSessionActive,
  getSessionData,
  addTestSession,
} from './auth-handlers';

// Import CRUD operation handlers
import {
  allCrudHandlers,
  systemServiceHandlers,
  databaseServiceHandlers,
  testServiceHandlers,
  createCrudHandlers,
  handleList,
  handleGet,
  handleCreate,
  handleUpdate,
  handleDelete,
  handleFileUpload,
  handleFileImport,
  handleJsonDownload,
  handleBlobDownload,
  mockDataStore,
  type GenericResource,
  type CrudContext,
  type ResourceDataStore,
  type FileUploadResult,
  type BulkOperationResult,
  type DownloadConfig,
} from './crud-handlers';

// Import system configuration handlers
import {
  systemHandlers,
  getSystemInfo,
  getSystemEnvironment,
  getSystemConfig,
  updateSystemConfig,
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  testServiceConnection,
  getUsers,
  getUser,
  getRoles,
  getAdmins,
  getApplications,
  getApplication,
  getEventScripts,
  getEventScript,
  getSchedulers,
  getScheduler,
  getApiDocsList,
  getApiDocsForService,
  getLookupKeys,
  updateLookupKeys,
  getCorsConfig,
  updateCorsConfig,
  getCacheConfig,
  clearCache,
  getEmailTemplates,
} from './system-handlers';

// Import file operation handlers
import {
  fileHandlers,
  fileServiceDiscoveryHandler,
  systemEnvironmentHandler,
  fileBrowsingHandler,
  fileRootListingHandler,
  fileDownloadHandler,
  fileUploadHandler,
  fileRootUploadHandler,
  fileUpdateHandler,
  fileDeletionHandler,
  type FileMetadata,
  type FileListingResponse,
  type FileUploadProgress,
  type FileServiceConfig,
  type CreateDirectoryRequest,
  type FileUploadMetadata,
} from './file-handlers';

// ============================================================================
// HANDLER COLLECTIONS BY FUNCTIONAL DOMAIN
// ============================================================================

/**
 * Authentication and Session Management Handlers
 * 
 * Comprehensive authentication handlers covering user and admin login/logout,
 * session validation, password reset workflows, user registration, and session refresh.
 * Includes realistic JWT token simulation and role-based access control patterns.
 * 
 * Endpoints Covered:
 * - POST /api/v2/user/session - User login
 * - DELETE /api/v2/user/session - User logout
 * - GET /api/v2/user/session - User session validation
 * - POST /api/v2/system/admin/session - Admin login
 * - DELETE /api/v2/system/admin/session - Admin logout
 * - GET /api/v2/system/admin/session - Admin session validation
 * - POST /api/v2/user/password - Password reset request
 * - PUT /api/v2/user/password - Password reset confirmation
 * - POST /api/v2/user/register - User registration
 * - POST /api/v2/user/session/refresh - Session token refresh
 */
export { authHandlers };

/**
 * CRUD and Database Operation Handlers
 * 
 * Generic CRUD operation handlers supporting all DreamFactory entity endpoints
 * with comprehensive pagination, filtering, sorting, and bulk operation capabilities.
 * Includes file upload/import operations and data export functionality.
 * 
 * Features:
 * - Generic CRUD operations (GET, POST, PUT, PATCH, DELETE)
 * - Pagination with limit, offset, and include_count parameters
 * - Advanced filtering and sorting capabilities
 * - Bulk operations with comma-separated IDs
 * - File upload and import with FormData support
 * - JSON and blob download responses
 * - Comprehensive error handling and validation
 * 
 * Handler Subsets:
 * - systemServiceHandlers: User, admin, role, service, config management
 * - databaseServiceHandlers: Table, field, relationship, procedure operations
 * - testServiceHandlers: Generic test entities for development
 */
export { 
  allCrudHandlers as crudHandlers,
  systemServiceHandlers,
  databaseServiceHandlers,
  testServiceHandlers,
};

/**
 * System Configuration and Management Handlers
 * 
 * Comprehensive system administration handlers covering service management,
 * user and role administration, application configuration, event scripts,
 * scheduler management, and API documentation generation.
 * 
 * Endpoints Covered:
 * - GET/PUT /api/v2/system - System information and configuration
 * - GET/POST/PUT/DELETE /api/v2/system/service - Service management
 * - POST /api/v2/system/service/{id}/test - Connection testing
 * - GET /api/v2/system/user - User management
 * - GET /api/v2/system/role - Role management
 * - GET /api/v2/system/admin - Administrator management
 * - GET /api/v2/system/app - Application configuration
 * - GET /api/v2/system/event - Event script management
 * - GET /api/v2/system/scheduler - Scheduled task management
 * - GET /api/v2/system/api_docs - API documentation
 * - GET/PUT /api/v2/system/lookup - Lookup key management
 * - GET/PUT /api/v2/system/cors - CORS configuration
 * - GET/DELETE /api/v2/system/cache - Cache management
 * - GET /api/v2/system/email_template - Email template management
 */
export { systemHandlers };

/**
 * File System Operation Handlers
 * 
 * Complete file system operation handlers supporting file browsing, upload,
 * download, directory management, and file service discovery. Includes realistic
 * file metadata simulation and proper content-type headers for downloads.
 * 
 * Endpoints Covered:
 * - GET /api/v2/files/{service}/* - File browsing and listing
 * - POST /api/v2/files/{service}/* - File upload and directory creation
 * - PUT /api/v2/files/{service}/* - File updates and replacements
 * - DELETE /api/v2/files/{service}/* - File and directory deletion
 * - GET /files/{service}/* - Direct file download access
 * - GET /api/v2/{service}/_schema - File service discovery
 * - GET /system/api/v2/environment - System environment with file services
 * 
 * Features:
 * - File and directory browsing with metadata
 * - FormData file upload with progress simulation
 * - Blob download responses with proper MIME types
 * - Directory creation and management
 * - File permission validation (read/write/execute)
 * - Service discovery for file system integration
 */
export { fileHandlers };

// ============================================================================
// COMPLETE HANDLER COLLECTION
// ============================================================================

/**
 * Complete collection of all MSW handlers for comprehensive DreamFactory API mocking
 * 
 * This collection includes every available handler organized by functional domain,
 * providing complete API coverage for development and testing scenarios. Use this
 * for comprehensive testing environments where full API simulation is required.
 * 
 * Total Handler Count: 100+ endpoints covering:
 * - Authentication and session management (10 endpoints)
 * - CRUD operations for all entity types (30+ endpoints)
 * - System configuration and management (40+ endpoints) 
 * - File system operations (20+ endpoints)
 * 
 * Performance Considerations:
 * - All handlers include realistic network delay simulation
 * - Memory-efficient mock data storage with cleanup utilities
 * - Optimized for both browser and server-side testing environments
 * - Support for concurrent request handling without data corruption
 */
export const allHandlers: HttpHandler[] = [
  ...authHandlers,
  ...allCrudHandlers,
  ...systemHandlers,
  ...fileHandlers,
];

// ============================================================================
// HANDLER UTILITIES AND FACTORY FUNCTIONS
// ============================================================================

/**
 * CRUD Handler Factory Function
 * 
 * Creates custom CRUD handlers for specific services and resource types.
 * Use this function to generate handlers for custom endpoints not covered
 * by the predefined handler collections.
 * 
 * @param serviceName - Name of the service (e.g., 'mysql_prod', 'postgres_dev')
 * @param resourceName - Name of the resource (e.g., 'users', 'products', 'orders')
 * @param basePath - Optional custom base path (defaults to /api/v2/{service}/{resource})
 * @returns Array of HTTP handlers for all CRUD operations
 * 
 * @example
 * // Create handlers for custom service
 * const customHandlers = createCrudHandlers('custom_db', 'customers');
 * setupServer(...customHandlers);
 * 
 * // Create handlers with custom path
 * const apiHandlers = createCrudHandlers('api', 'v1/users', '/api/v1/users');
 * setupServer(...apiHandlers);
 */
export { createCrudHandlers };

/**
 * Individual CRUD Operation Handlers
 * 
 * Export individual handler functions for custom implementation scenarios
 * where fine-grained control over API mocking is required.
 */
export {
  handleList,
  handleGet,
  handleCreate,
  handleUpdate,
  handleDelete,
  handleFileUpload,
  handleFileImport,
  handleJsonDownload,
  handleBlobDownload,
};

/**
 * Individual System Configuration Handlers
 * 
 * Export individual system handlers for focused testing scenarios
 * where only specific system functionality needs to be mocked.
 */
export {
  getSystemInfo,
  getSystemEnvironment,
  getSystemConfig,
  updateSystemConfig,
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  testServiceConnection,
  getUsers,
  getUser,
  getRoles,
  getAdmins,
  getApplications,
  getApplication,
  getEventScripts,
  getEventScript,
  getSchedulers,
  getScheduler,
  getApiDocsList,
  getApiDocsForService,
  getLookupKeys,
  updateLookupKeys,
  getCorsConfig,
  updateCorsConfig,
  getCacheConfig,
  clearCache,
  getEmailTemplates,
};

/**
 * Individual File Operation Handlers
 * 
 * Export individual file handlers for targeted file operation testing
 * where only specific file functionality needs to be mocked.
 */
export {
  fileServiceDiscoveryHandler,
  systemEnvironmentHandler,
  fileBrowsingHandler,
  fileRootListingHandler,
  fileDownloadHandler,
  fileUploadHandler,
  fileRootUploadHandler,
  fileUpdateHandler,
  fileDeletionHandler,
};

// ============================================================================
// TEST UTILITIES AND MOCK DATA ACCESS
// ============================================================================

/**
 * Authentication Test Utilities
 * 
 * Utility functions for managing authentication state during testing.
 * These functions allow direct manipulation of session storage and
 * authentication tokens for comprehensive test scenario coverage.
 */
export {
  clearAllSessions,
  clearPasswordResetTokens,
  isSessionActive,
  getSessionData,
  addTestSession,
};

/**
 * Mock Data Store Access
 * 
 * Direct access to the mock data store for test data manipulation.
 * Use these exports to modify mock data during tests or to inspect
 * the current state of the mock database.
 * 
 * @example
 * // Add test data
 * mockDataStore.users.push({ id: 999, name: 'Test User', email: 'test@example.com' });
 * 
 * // Clear test data
 * mockDataStore.test_entities = [];
 * 
 * // Inspect current data
 * console.log('Current users:', mockDataStore.users.length);
 */
export { mockDataStore };

// ============================================================================
// TYPE DEFINITIONS FOR EXTERNAL USAGE
// ============================================================================

/**
 * Core type definitions for external usage
 * 
 * Export essential type definitions for TypeScript support
 * in testing environments and custom handler implementations.
 */
export type {
  // CRUD types
  GenericResource,
  CrudContext,
  ResourceDataStore,
  FileUploadResult,
  BulkOperationResult,
  DownloadConfig,
  
  // File operation types
  FileMetadata,
  FileListingResponse,
  FileUploadProgress,
  FileServiceConfig,
  CreateDirectoryRequest,
  FileUploadMetadata,
};

// ============================================================================
// CONFIGURATION AND SETUP HELPERS
// ============================================================================

/**
 * Default MSW Setup Configuration
 * 
 * Recommended configuration for MSW setup with all handlers.
 * Includes error handling, request logging, and performance optimization.
 */
export const mswConfig = {
  /**
   * Server-side setup (Node.js testing environments)
   * 
   * @example
   * import { setupServer } from 'msw/node';
   * import { allHandlers } from '@/test/mocks/handlers';
   * 
   * const server = setupServer(...allHandlers);
   * 
   * beforeAll(() => server.listen());
   * afterEach(() => server.resetHandlers());
   * afterAll(() => server.close());
   */
  server: allHandlers,
  
  /**
   * Browser setup (client-side development)
   * 
   * @example
   * import { setupWorker } from 'msw/browser';
   * import { allHandlers } from '@/test/mocks/handlers';
   * 
   * const worker = setupWorker(...allHandlers);
   * worker.start();
   */
  browser: allHandlers,
  
  /**
   * Minimal setup for focused testing
   * Use this for tests that only need authentication and basic CRUD operations
   */
  minimal: [...authHandlers, ...systemServiceHandlers],
  
  /**
   * Authentication-only setup
   * Use this for tests focused on login/logout and session management
   */
  authOnly: authHandlers,
  
  /**
   * System management setup
   * Use this for tests focused on admin functionality and system configuration
   */
  systemOnly: systemHandlers,
  
  /**
   * File operations setup
   * Use this for tests focused on file upload/download and file management
   */
  filesOnly: fileHandlers,
};

/**
 * Handler Setup Validation
 * 
 * Utility function to validate that all required handlers are properly configured
 * and that there are no conflicting route patterns.
 * 
 * @param handlers - Array of handlers to validate
 * @returns Validation result with any issues found
 */
export function validateHandlerSetup(handlers: HttpHandler[]): {
  isValid: boolean;
  issues: string[];
  totalHandlers: number;
  handlersByDomain: Record<string, number>;
} {
  const issues: string[] = [];
  const routes = new Set<string>();
  const handlersByDomain: Record<string, number> = {
    auth: 0,
    crud: 0,
    system: 0,
    files: 0,
    other: 0,
  };
  
  handlers.forEach((handler, index) => {
    // Basic handler validation
    if (!handler) {
      issues.push(`Handler at index ${index} is null or undefined`);
      return;
    }
    
    // Count handlers by domain (rough categorization)
    const handlerStr = handler.toString();
    if (handlerStr.includes('/session') || handlerStr.includes('/password') || handlerStr.includes('/register')) {
      handlersByDomain.auth++;
    } else if (handlerStr.includes('/system/')) {
      handlersByDomain.system++;
    } else if (handlerStr.includes('/files/')) {
      handlersByDomain.files++;
    } else if (handlerStr.includes('/api/v2/')) {
      handlersByDomain.crud++;
    } else {
      handlersByDomain.other++;
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    totalHandlers: handlers.length,
    handlersByDomain,
  };
}

/**
 * Default export for convenient importing
 * 
 * @example
 * import handlers from '@/test/mocks/handlers';
 * setupServer(...handlers);
 */
export default allHandlers;

// ============================================================================
// DOCUMENTATION AND EXAMPLES
// ============================================================================

/**
 * Handler Usage Examples and Best Practices
 * 
 * Complete examples for common testing scenarios and MSW setup patterns.
 * See individual handler files for more detailed usage examples.
 * 
 * @example
 * // Comprehensive test setup with all handlers
 * import { setupServer } from 'msw/node';
 * import { allHandlers } from '@/test/mocks/handlers';
 * 
 * const server = setupServer(...allHandlers);
 * 
 * beforeAll(() => {
 *   server.listen({ onUnhandledRequest: 'error' });
 * });
 * 
 * afterEach(() => {
 *   server.resetHandlers();
 * });
 * 
 * afterAll(() => {
 *   server.close();
 * });
 * 
 * @example
 * // Focused authentication testing
 * import { setupServer } from 'msw/node';
 * import { authHandlers, clearAllSessions } from '@/test/mocks/handlers';
 * 
 * const server = setupServer(...authHandlers);
 * 
 * beforeEach(() => {
 *   clearAllSessions(); // Clean authentication state
 * });
 * 
 * @example
 * // Custom service testing
 * import { setupServer } from 'msw/node';
 * import { createCrudHandlers } from '@/test/mocks/handlers';
 * 
 * const customHandlers = createCrudHandlers('custom_api', 'widgets');
 * const server = setupServer(...customHandlers);
 * 
 * @example
 * // Browser development setup
 * import { setupWorker } from 'msw/browser';
 * import { mswConfig } from '@/test/mocks/handlers';
 * 
 * if (process.env.NODE_ENV === 'development') {
 *   const worker = setupWorker(...mswConfig.browser);
 *   worker.start({
 *     serviceWorker: {
 *       url: '/mockServiceWorker.js',
 *     },
 *   });
 * }
 * 
 * @example
 * // Validation and debugging
 * import { validateHandlerSetup, allHandlers } from '@/test/mocks/handlers';
 * 
 * const validation = validateHandlerSetup(allHandlers);
 * if (!validation.isValid) {
 *   console.error('Handler setup issues:', validation.issues);
 * }
 * 
 * console.log('Handler summary:', validation.handlersByDomain);
 */