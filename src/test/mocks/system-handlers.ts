/**
 * MSW Handlers for DreamFactory System Configuration Endpoints
 * 
 * Comprehensive Mock Service Worker handlers for DreamFactory system configuration and 
 * administrative endpoints. Provides realistic test data and behavior for development 
 * and testing scenarios covering all core system management functionality.
 * 
 * This module handles:
 * - System environment and configuration data (/api/v2/system/environment, /api/v2/system/config)
 * - Service discovery and database connection management (/api/v2/system/service)
 * - Role-based access control and permissions (/api/v2/system/role, /api/v2/system/user)
 * - Application configuration and API documentation (/api/v2/system/app, /api/v2/system/api_docs)
 * - Event script and scheduler management (/api/v2/system/event, /api/v2/system/scheduler)
 * - Administrative functions and system information (/api/v2/system/admin, /api/v2/system)
 * 
 * All handlers implement DreamFactory API patterns including:
 * - Proper authentication header validation
 * - Case transformation (camelCase ↔ snake_case)
 * - Comprehensive error responses
 * - Pagination and filtering support
 * - Realistic response times and data structures
 */

import { http, HttpResponse } from 'msw';
import {
  validateAuthHeaders,
  applyCaseTransformation,
  processRequestBody,
  extractQueryParams,
  applyPagination,
  applyFilter,
  applySort,
  createJsonResponse,
  createListResponse,
  createErrorResponse,
  createAuthErrorResponse,
  createForbiddenError,
  createNotFoundError,
  createValidationError,
  simulateNetworkDelay,
  logRequest,
  extractIdFromPath,
  validateRequiredFields,
  generateMockSessionToken,
} from './utils';

import {
  createDreamFactoryError,
  createAuthenticationRequiredError,
  createInvalidCredentialsError,
  createInsufficientPermissionsError,
  createResourceNotFoundError,
  createServiceNotFoundError,
  createValidationError as createFormValidationError,
  createDatabaseServiceValidationErrors,
  createInternalServerError,
  createDatabaseConnectionError,
  ERROR_CODES,
} from './error-responses';

import {
  mockSystemConfig,
  mockRoles,
  mockUsers,
  mockAdmins,
  mockDatabaseServices,
  mockDatabaseServiceConfigs,
  mockSchemaData,
  mockOpenApiSpecs,
  mockConnectionTests,
  mockApiResponse,
} from './mock-data';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * Base URL pattern for DreamFactory system API endpoints
 */
const SYSTEM_API_BASE = '/api/v2/system';

/**
 * Mock API key for testing (should match environment configuration)
 */
const MOCK_API_KEY = 'mock-api-key-for-testing';

/**
 * Default pagination limits
 */
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 1000;

/**
 * Simulated network delays for realistic testing
 */
const NETWORK_DELAYS = {
  fast: 50,      // Quick responses like cached data
  normal: 150,   // Standard API responses
  slow: 500,     // Complex operations like connection testing
  very_slow: 2000, // Heavy operations like schema discovery
} as const;

// ============================================================================
// MOCK DATA EXTENSIONS
// ============================================================================

/**
 * Extended system information including environment and version details
 */
const mockSystemInfo = {
  ...mockSystemConfig,
  server_info: {
    server_name: 'DreamFactory Server',
    version: '5.2.1',
    version_date: '2024-03-15',
    license_key: 'DF-SLV-XXXX-XXXX-XXXX-XXXX',
    license_type: 'Silver',
    host_os: 'Linux Ubuntu 22.04.3 LTS',
    server_software: 'Apache/2.4.52 (Ubuntu)',
    php_version: '8.2.15',
    database_version: 'MySQL 8.0.36',
    memory_limit: '512M',
    max_execution_time: '300',
    upload_max_filesize: '64M',
    post_max_size: '64M',
  },
  features: {
    api_generation: true,
    schema_discovery: true,
    event_scripting: true,
    scheduler: true,
    file_management: true,
    user_management: true,
    role_management: true,
    cors_configuration: true,
    cache_management: true,
    email_templates: true,
    lookup_keys: true,
    api_documentation: true,
    openapi_generation: true,
    database_connections: true,
    oauth_providers: false,
    saml_authentication: false,
    ldap_authentication: false,
  },
  endpoints: {
    api_base: '/api/v2',
    system_base: '/api/v2/system',
    user_base: '/api/v2/user',
    files_base: '/api/v2/files',
    docs_base: '/api/v2/api_docs',
  },
};

/**
 * Mock event scripts for system management
 */
const mockEventScripts = [
  {
    id: 1,
    name: 'user.registered',
    type: 'php',
    is_active: true,
    content: '<?php\n// Send welcome email when user registers\nLog::info("User registered: " . $event["request"]["email"]);',
    created_date: '2024-01-15T10:00:00Z',
    last_modified_date: '2024-03-10T14:30:00Z',
    created_by_id: 1,
    last_modified_by_id: 1,
  },
  {
    id: 2,
    name: 'api.generated',
    type: 'javascript',
    is_active: true,
    content: '// Log API generation events\nconsole.log("API generated for service:", event.service_name);',
    created_date: '2024-02-01T09:00:00Z',
    last_modified_date: '2024-03-08T11:15:00Z',
    created_by_id: 2,
    last_modified_by_id: 1,
  },
  {
    id: 3,
    name: 'database.connected',
    type: 'php',
    is_active: false,
    content: '<?php\n// Monitor database connection events\nLog::debug("Database connection established");',
    created_date: '2024-02-15T16:45:00Z',
    last_modified_date: '2024-02-15T16:45:00Z',
    created_by_id: 3,
    last_modified_by_id: 3,
  },
];

/**
 * Mock scheduler configurations
 */
const mockSchedulers = [
  {
    id: 1,
    name: 'daily_cleanup',
    label: 'Daily Database Cleanup',
    description: 'Removes expired sessions and temporary data',
    is_active: true,
    frequency: 'daily',
    start_date: '2024-01-01T02:00:00Z',
    end_date: null,
    script_type: 'php',
    script_content: '<?php\n// Cleanup expired sessions\nDB::table("sessions")->where("last_activity", "<", time() - 86400)->delete();',
    last_run: '2024-03-15T02:00:00Z',
    next_run: '2024-03-16T02:00:00Z',
    run_count: 74,
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-01-01T00:00:00Z',
    created_by_id: 1,
    last_modified_by_id: 1,
  },
  {
    id: 2,
    name: 'weekly_reports',
    label: 'Weekly Usage Reports',
    description: 'Generates weekly API usage reports',
    is_active: true,
    frequency: 'weekly',
    start_date: '2024-01-07T09:00:00Z',
    end_date: null,
    script_type: 'javascript',
    script_content: '// Generate weekly usage reports\nconsole.log("Generating weekly reports...");',
    last_run: '2024-03-11T09:00:00Z',
    next_run: '2024-03-18T09:00:00Z',
    run_count: 10,
    created_date: '2024-01-07T00:00:00Z',
    last_modified_date: '2024-02-15T12:30:00Z',
    created_by_id: 1,
    last_modified_by_id: 2,
  },
];

/**
 * Mock applications configuration
 */
const mockApplications = [
  {
    id: 1,
    name: 'admin_app',
    api_key: 'admin-app-api-key-12345',
    description: 'DreamFactory Admin Interface',
    is_active: true,
    type: 'spa',
    path: '/admin',
    url: 'https://admin.dreamfactory.local',
    storage_service_id: null,
    storage_container: null,
    requires_fullscreen: false,
    allow_fullscreen_toggle: true,
    toggle_location: 'top-right',
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-01-01T00:00:00Z',
    created_by_id: 1,
    last_modified_by_id: 1,
    launch_url: 'https://admin.dreamfactory.local',
    role_id: 1,
  },
  {
    id: 2,
    name: 'api_docs',
    api_key: 'api-docs-key-67890',
    description: 'Interactive API Documentation',
    is_active: true,
    type: 'spa',
    path: '/api-docs',
    url: 'https://api-docs.dreamfactory.local',
    storage_service_id: null,
    storage_container: null,
    requires_fullscreen: false,
    allow_fullscreen_toggle: false,
    toggle_location: 'top-right',
    created_date: '2024-01-15T10:00:00Z',
    last_modified_date: '2024-02-20T14:30:00Z',
    created_by_id: 1,
    last_modified_by_id: 2,
    launch_url: 'https://api-docs.dreamfactory.local',
    role_id: 3,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates system administration permissions
 */
function validateAdminPermissions(auth: ReturnType<typeof validateAuthHeaders>): boolean {
  // In a real scenario, this would check actual user permissions
  // For testing, we simulate admin permission based on user type
  return auth.userType === 'admin' && auth.isValid;
}

/**
 * Validates specific role-based permissions
 */
function validateRolePermissions(auth: ReturnType<typeof validateAuthHeaders>, requiredRole: string): boolean {
  // Mock role validation - in real scenario would check against user's actual roles
  const userPermissions = {
    'super_admin': ['*'],
    'admin': ['user.create', 'user.read', 'user.update', 'role.read', 'service.*', 'schema.read', 'api.generate'],
    'user': ['service.read', 'schema.read', 'api.test'],
  };
  
  if (!auth.isValid || !auth.userType) return false;
  
  const permissions = userPermissions[auth.userType as keyof typeof userPermissions] || [];
  return permissions.includes('*') || permissions.includes(requiredRole);
}

/**
 * Simulates database connection testing with realistic delays and responses
 */
async function simulateConnectionTest(config: Record<string, unknown>): Promise<typeof mockConnectionTests.success | typeof mockConnectionTests.timeout> {
  // Simulate realistic connection testing delay
  await simulateNetworkDelay(NETWORK_DELAYS.slow);
  
  // Mock connection validation logic
  const host = config.host as string;
  const port = config.port as number;
  const username = config.username as string;
  const password = config.password as string;
  
  // Simulate common failure scenarios
  if (!host || host === 'invalid-host') {
    return mockConnectionTests.host_unreachable;
  }
  
  if (!username || username === 'invalid-user') {
    return mockConnectionTests.auth_failure;
  }
  
  if (!password || password === 'wrong-password') {
    return mockConnectionTests.auth_failure;
  }
  
  if (port && (port < 1 || port > 65535)) {
    return mockConnectionTests.timeout;
  }
  
  // Simulate successful connection
  return {
    ...mockConnectionTests.success,
    details: `Successfully connected to ${host}:${port || 3306} in ${Math.floor(Math.random() * 300 + 100)}ms`,
    testDuration: Math.floor(Math.random() * 300 + 100),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generates OpenAPI documentation for a service
 */
function generateOpenApiDoc(serviceName: string): typeof mockOpenApiSpecs.mysql_production {
  // Return existing mock or generate basic structure
  if (mockOpenApiSpecs[serviceName as keyof typeof mockOpenApiSpecs]) {
    return mockOpenApiSpecs[serviceName as keyof typeof mockOpenApiSpecs];
  }
  
  // Generate basic OpenAPI structure for new services
  return {
    openapi: '3.0.3',
    info: {
      title: `${serviceName} Database API`,
      description: `Auto-generated REST API for ${serviceName} database`,
      version: '1.0.0',
    },
    servers: [
      {
        url: 'https://api.dreamfactory.local/api/v2',
        description: 'DreamFactory API Server',
      },
    ],
    paths: {},
    components: {
      schemas: {},
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-DreamFactory-Api-Key',
        },
      },
    },
  };
}

// ============================================================================
// SYSTEM INFORMATION & CONFIGURATION HANDLERS
// ============================================================================

/**
 * GET /api/v2/system - System information and capabilities
 */
export const getSystemInfo = http.get(`${SYSTEM_API_BASE}`, async ({ request }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.normal);
  logRequest(request, { handler: 'getSystemInfo' });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse(mockSystemInfo);

  return createJsonResponse(responseData);
});

/**
 * GET /api/v2/system/environment - Environment configuration
 */
export const getSystemEnvironment = http.get(`${SYSTEM_API_BASE}/environment`, async ({ request }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.fast);
  logRequest(request, { handler: 'getSystemEnvironment' });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  if (!validateAdminPermissions(auth)) {
    return createInsufficientPermissionsError('admin', auth.userType);
  }

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse(mockSystemConfig.environment);

  return createJsonResponse(responseData);
});

/**
 * GET /api/v2/system/config - Full system configuration
 */
export const getSystemConfig = http.get(`${SYSTEM_API_BASE}/config`, async ({ request }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.normal);
  logRequest(request, { handler: 'getSystemConfig' });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  if (!validateAdminPermissions(auth)) {
    return createInsufficientPermissionsError('admin', auth.userType);
  }

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse(mockSystemConfig);

  return createJsonResponse(responseData);
});

/**
 * PUT /api/v2/system/config - Update system configuration
 */
export const updateSystemConfig = http.put(`${SYSTEM_API_BASE}/config`, async ({ request }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.normal);
  logRequest(request, { handler: 'updateSystemConfig' });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  if (!validateAdminPermissions(auth)) {
    return createInsufficientPermissionsError('admin', auth.userType);
  }

  const requestBody = await processRequestBody(request);
  const { transformedRequestBody, transformResponse } = applyCaseTransformation(request, requestBody);

  // Validate required configuration fields
  if (typeof transformedRequestBody === 'object' && transformedRequestBody !== null) {
    const config = transformedRequestBody as Record<string, unknown>;
    
    // Mock validation - in reality would validate all config sections
    if (config.platform && typeof config.platform === 'object') {
      const platform = config.platform as Record<string, unknown>;
      if (!platform.name || !platform.version) {
        return createFormValidationError({
          'platform.name': ['Platform name is required'],
          'platform.version': ['Platform version is required'],
        });
      }
    }
  }

  // Simulate configuration update
  const updatedConfig = {
    ...mockSystemConfig,
    ...(transformedRequestBody as Record<string, unknown>),
    last_modified: new Date().toISOString(),
  };

  const responseData = transformResponse(updatedConfig);
  return createJsonResponse(responseData);
});

// ============================================================================
// SERVICE MANAGEMENT HANDLERS
// ============================================================================

/**
 * GET /api/v2/system/service - List all services
 */
export const getServices = http.get(`${SYSTEM_API_BASE}/service`, async ({ request }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.normal);
  logRequest(request, { handler: 'getServices' });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  const queryParams = extractQueryParams(request);
  let services = [...mockDatabaseServices];

  // Apply filtering
  if (queryParams.filter) {
    services = applyFilter(services, queryParams.filter as string);
  }

  // Apply sorting
  if (queryParams.order) {
    services = applySort(services, queryParams.order as string);
  }

  // Apply pagination
  const limit = Math.min(queryParams.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = queryParams.offset || 0;
  const { data: paginatedServices, meta } = applyPagination(services, limit, offset);

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse({ resource: paginatedServices });

  return createListResponse(responseData.resource, meta);
});

/**
 * GET /api/v2/system/service/{id} - Get specific service
 */
export const getService = http.get(`${SYSTEM_API_BASE}/service/:id`, async ({ request, params }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.fast);
  logRequest(request, { handler: 'getService', params });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  const serviceId = parseInt(params.id as string, 10);
  const service = mockDatabaseServices.find(s => s.id === serviceId);

  if (!service) {
    return createResourceNotFoundError('Service', serviceId);
  }

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse(service);

  return createJsonResponse(responseData);
});

/**
 * POST /api/v2/system/service - Create new service
 */
export const createService = http.post(`${SYSTEM_API_BASE}/service`, async ({ request }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.slow);
  logRequest(request, { handler: 'createService' });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  if (!validateRolePermissions(auth, 'service.create')) {
    return createInsufficientPermissionsError('service.create');
  }

  const requestBody = await processRequestBody(request);
  const { transformedRequestBody, transformResponse } = applyCaseTransformation(request, requestBody);

  if (typeof transformedRequestBody !== 'object' || transformedRequestBody === null) {
    return createFormValidationError({ service: ['Invalid service data'] });
  }

  const serviceData = transformedRequestBody as Record<string, unknown>;

  // Validate required fields
  const validation = validateRequiredFields(serviceData, ['name', 'type', 'config']);
  if (!validation.isValid) {
    const fieldErrors: Record<string, string[]> = {};
    validation.missingFields.forEach(field => {
      fieldErrors[field] = [`${field} is required`];
    });
    return createFormValidationError(fieldErrors);
  }

  // Validate service name uniqueness
  const existingService = mockDatabaseServices.find(s => s.name === serviceData.name);
  if (existingService) {
    return createFormValidationError({ name: ['Service name must be unique'] });
  }

  // Test database connection if config provided
  let connectionTestResult = null;
  if (serviceData.config && typeof serviceData.config === 'object') {
    connectionTestResult = await simulateConnectionTest(serviceData.config as Record<string, unknown>);
    
    if (!connectionTestResult.success) {
      return createDatabaseConnectionError(
        serviceData.type as string,
        connectionTestResult.details
      );
    }
  }

  // Create new service
  const newService = {
    id: Math.max(...mockDatabaseServices.map(s => s.id)) + 1,
    name: serviceData.name as string,
    label: serviceData.label as string || serviceData.name as string,
    description: serviceData.description as string || '',
    type: serviceData.type as string,
    config: serviceData.config as Record<string, unknown>,
    is_active: true,
    created_date: new Date().toISOString(),
    last_modified_date: new Date().toISOString(),
    created_by_id: parseInt(auth.userId || '1', 10),
    last_modified_by_id: parseInt(auth.userId || '1', 10),
    status: 'active',
    lastConnectionTest: connectionTestResult,
    schemaLastDiscovered: null,
    apiEndpointsCount: 0,
  };

  mockDatabaseServices.push(newService);

  const responseData = transformResponse(newService);
  return createJsonResponse(responseData, 201);
});

/**
 * PUT /api/v2/system/service/{id} - Update service
 */
export const updateService = http.put(`${SYSTEM_API_BASE}/service/:id`, async ({ request, params }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.normal);
  logRequest(request, { handler: 'updateService', params });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  if (!validateRolePermissions(auth, 'service.update')) {
    return createInsufficientPermissionsError('service.update');
  }

  const serviceId = parseInt(params.id as string, 10);
  const serviceIndex = mockDatabaseServices.findIndex(s => s.id === serviceId);

  if (serviceIndex === -1) {
    return createResourceNotFoundError('Service', serviceId);
  }

  const requestBody = await processRequestBody(request);
  const { transformedRequestBody, transformResponse } = applyCaseTransformation(request, requestBody);

  if (typeof transformedRequestBody !== 'object' || transformedRequestBody === null) {
    return createFormValidationError({ service: ['Invalid service data'] });
  }

  const updateData = transformedRequestBody as Record<string, unknown>;

  // Test connection if config updated
  let connectionTestResult = null;
  if (updateData.config && typeof updateData.config === 'object') {
    connectionTestResult = await simulateConnectionTest(updateData.config as Record<string, unknown>);
    
    if (!connectionTestResult.success) {
      return createDatabaseConnectionError(
        updateData.type as string || mockDatabaseServices[serviceIndex].type,
        connectionTestResult.details
      );
    }
  }

  // Update service
  const updatedService = {
    ...mockDatabaseServices[serviceIndex],
    ...updateData,
    id: serviceId, // Ensure ID doesn't change
    last_modified_date: new Date().toISOString(),
    last_modified_by_id: parseInt(auth.userId || '1', 10),
    ...(connectionTestResult && { lastConnectionTest: connectionTestResult }),
  };

  mockDatabaseServices[serviceIndex] = updatedService;

  const responseData = transformResponse(updatedService);
  return createJsonResponse(responseData);
});

/**
 * DELETE /api/v2/system/service/{id} - Delete service
 */
export const deleteService = http.delete(`${SYSTEM_API_BASE}/service/:id`, async ({ request, params }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.normal);
  logRequest(request, { handler: 'deleteService', params });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  if (!validateRolePermissions(auth, 'service.delete')) {
    return createInsufficientPermissionsError('service.delete');
  }

  const serviceId = parseInt(params.id as string, 10);
  const serviceIndex = mockDatabaseServices.findIndex(s => s.id === serviceId);

  if (serviceIndex === -1) {
    return createResourceNotFoundError('Service', serviceId);
  }

  // Remove service from mock data
  mockDatabaseServices.splice(serviceIndex, 1);

  return createJsonResponse({ id: serviceId });
});

/**
 * POST /api/v2/system/service/{id}/test - Test service connection
 */
export const testServiceConnection = http.post(`${SYSTEM_API_BASE}/service/:id/test`, async ({ request, params }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.slow);
  logRequest(request, { handler: 'testServiceConnection', params });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  const serviceId = parseInt(params.id as string, 10);
  const service = mockDatabaseServices.find(s => s.id === serviceId);

  if (!service) {
    return createResourceNotFoundError('Service', serviceId);
  }

  // Test connection using service config
  const connectionResult = await simulateConnectionTest(service.config);

  // Update service with test result
  const serviceIndex = mockDatabaseServices.findIndex(s => s.id === serviceId);
  if (serviceIndex !== -1) {
    mockDatabaseServices[serviceIndex].lastConnectionTest = connectionResult;
  }

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse(connectionResult);

  return createJsonResponse(responseData);
});

// ============================================================================
// USER & ROLE MANAGEMENT HANDLERS
// ============================================================================

/**
 * GET /api/v2/system/user - List users
 */
export const getUsers = http.get(`${SYSTEM_API_BASE}/user`, async ({ request }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.normal);
  logRequest(request, { handler: 'getUsers' });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  if (!validateRolePermissions(auth, 'user.read')) {
    return createInsufficientPermissionsError('user.read');
  }

  const queryParams = extractQueryParams(request);
  let users = [...mockUsers];

  // Apply filtering
  if (queryParams.filter) {
    users = applyFilter(users, queryParams.filter as string);
  }

  // Apply sorting
  if (queryParams.order) {
    users = applySort(users, queryParams.order as string);
  }

  // Apply pagination
  const limit = Math.min(queryParams.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = queryParams.offset || 0;
  const { data: paginatedUsers, meta } = applyPagination(users, limit, offset);

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse({ resource: paginatedUsers });

  return createListResponse(responseData.resource, meta);
});

/**
 * GET /api/v2/system/user/{id} - Get specific user
 */
export const getUser = http.get(`${SYSTEM_API_BASE}/user/:id`, async ({ request, params }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.fast);
  logRequest(request, { handler: 'getUser', params });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  if (!validateRolePermissions(auth, 'user.read')) {
    return createInsufficientPermissionsError('user.read');
  }

  const userId = parseInt(params.id as string, 10);
  const user = mockUsers.find(u => u.id === userId);

  if (!user) {
    return createResourceNotFoundError('User', userId);
  }

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse(user);

  return createJsonResponse(responseData);
});

/**
 * GET /api/v2/system/role - List roles
 */
export const getRoles = http.get(`${SYSTEM_API_BASE}/role`, async ({ request }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.fast);
  logRequest(request, { handler: 'getRoles' });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  const queryParams = extractQueryParams(request);
  let roles = [...mockRoles];

  // Apply filtering
  if (queryParams.filter) {
    roles = applyFilter(roles, queryParams.filter as string);
  }

  // Apply sorting
  if (queryParams.order) {
    roles = applySort(roles, queryParams.order as string);
  }

  // Apply pagination
  const limit = Math.min(queryParams.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = queryParams.offset || 0;
  const { data: paginatedRoles, meta } = applyPagination(roles, limit, offset);

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse({ resource: paginatedRoles });

  return createListResponse(responseData.resource, meta);
});

/**
 * GET /api/v2/system/admin - List administrators
 */
export const getAdmins = http.get(`${SYSTEM_API_BASE}/admin`, async ({ request }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.normal);
  logRequest(request, { handler: 'getAdmins' });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  if (!validateAdminPermissions(auth)) {
    return createInsufficientPermissionsError('admin', auth.userType);
  }

  const queryParams = extractQueryParams(request);
  let admins = [...mockAdmins];

  // Apply filtering
  if (queryParams.filter) {
    admins = applyFilter(admins, queryParams.filter as string);
  }

  // Apply sorting
  if (queryParams.order) {
    admins = applySort(admins, queryParams.order as string);
  }

  // Apply pagination
  const limit = Math.min(queryParams.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = queryParams.offset || 0;
  const { data: paginatedAdmins, meta } = applyPagination(admins, limit, offset);

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse({ resource: paginatedAdmins });

  return createListResponse(responseData.resource, meta);
});

// ============================================================================
// APPLICATION MANAGEMENT HANDLERS
// ============================================================================

/**
 * GET /api/v2/system/app - List applications
 */
export const getApplications = http.get(`${SYSTEM_API_BASE}/app`, async ({ request }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.normal);
  logRequest(request, { handler: 'getApplications' });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  const queryParams = extractQueryParams(request);
  let apps = [...mockApplications];

  // Apply filtering
  if (queryParams.filter) {
    apps = applyFilter(apps, queryParams.filter as string);
  }

  // Apply sorting
  if (queryParams.order) {
    apps = applySort(apps, queryParams.order as string);
  }

  // Apply pagination
  const limit = Math.min(queryParams.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = queryParams.offset || 0;
  const { data: paginatedApps, meta } = applyPagination(apps, limit, offset);

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse({ resource: paginatedApps });

  return createListResponse(responseData.resource, meta);
});

/**
 * GET /api/v2/system/app/{id} - Get specific application
 */
export const getApplication = http.get(`${SYSTEM_API_BASE}/app/:id`, async ({ request, params }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.fast);
  logRequest(request, { handler: 'getApplication', params });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  const appId = parseInt(params.id as string, 10);
  const app = mockApplications.find(a => a.id === appId);

  if (!app) {
    return createResourceNotFoundError('Application', appId);
  }

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse(app);

  return createJsonResponse(responseData);
});

// ============================================================================
// EVENT SCRIPT HANDLERS
// ============================================================================

/**
 * GET /api/v2/system/event - List event scripts
 */
export const getEventScripts = http.get(`${SYSTEM_API_BASE}/event`, async ({ request }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.normal);
  logRequest(request, { handler: 'getEventScripts' });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  if (!validateRolePermissions(auth, 'script.read')) {
    return createInsufficientPermissionsError('script.read');
  }

  const queryParams = extractQueryParams(request);
  let scripts = [...mockEventScripts];

  // Apply filtering
  if (queryParams.filter) {
    scripts = applyFilter(scripts, queryParams.filter as string);
  }

  // Apply sorting
  if (queryParams.order) {
    scripts = applySort(scripts, queryParams.order as string);
  }

  // Apply pagination
  const limit = Math.min(queryParams.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = queryParams.offset || 0;
  const { data: paginatedScripts, meta } = applyPagination(scripts, limit, offset);

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse({ resource: paginatedScripts });

  return createListResponse(responseData.resource, meta);
});

/**
 * GET /api/v2/system/event/{name} - Get specific event script
 */
export const getEventScript = http.get(`${SYSTEM_API_BASE}/event/:name`, async ({ request, params }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.fast);
  logRequest(request, { handler: 'getEventScript', params });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  if (!validateRolePermissions(auth, 'script.read')) {
    return createInsufficientPermissionsError('script.read');
  }

  const scriptName = params.name as string;
  const script = mockEventScripts.find(s => s.name === scriptName);

  if (!script) {
    return createResourceNotFoundError('Event Script', scriptName);
  }

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse(script);

  return createJsonResponse(responseData);
});

// ============================================================================
// SCHEDULER HANDLERS
// ============================================================================

/**
 * GET /api/v2/system/scheduler - List scheduled tasks
 */
export const getSchedulers = http.get(`${SYSTEM_API_BASE}/scheduler`, async ({ request }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.normal);
  logRequest(request, { handler: 'getSchedulers' });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  if (!validateAdminPermissions(auth)) {
    return createInsufficientPermissionsError('admin', auth.userType);
  }

  const queryParams = extractQueryParams(request);
  let schedulers = [...mockSchedulers];

  // Apply filtering
  if (queryParams.filter) {
    schedulers = applyFilter(schedulers, queryParams.filter as string);
  }

  // Apply sorting
  if (queryParams.order) {
    schedulers = applySort(schedulers, queryParams.order as string);
  }

  // Apply pagination
  const limit = Math.min(queryParams.limit || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = queryParams.offset || 0;
  const { data: paginatedSchedulers, meta } = applyPagination(schedulers, limit, offset);

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse({ resource: paginatedSchedulers });

  return createListResponse(responseData.resource, meta);
});

/**
 * GET /api/v2/system/scheduler/{id} - Get specific scheduler
 */
export const getScheduler = http.get(`${SYSTEM_API_BASE}/scheduler/:id`, async ({ request, params }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.fast);
  logRequest(request, { handler: 'getScheduler', params });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  if (!validateAdminPermissions(auth)) {
    return createInsufficientPermissionsError('admin', auth.userType);
  }

  const schedulerId = parseInt(params.id as string, 10);
  const scheduler = mockSchedulers.find(s => s.id === schedulerId);

  if (!scheduler) {
    return createResourceNotFoundError('Scheduler', schedulerId);
  }

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse(scheduler);

  return createJsonResponse(responseData);
});

// ============================================================================
// API DOCUMENTATION HANDLERS
// ============================================================================

/**
 * GET /api/v2/system/api_docs - List available API documentation
 */
export const getApiDocsList = http.get(`${SYSTEM_API_BASE}/api_docs`, async ({ request }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.fast);
  logRequest(request, { handler: 'getApiDocsList' });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  // Generate list of available API docs based on active services
  const apiDocs = mockDatabaseServices
    .filter(service => service.is_active && service.apiEndpointsCount > 0)
    .map(service => ({
      service_name: service.name,
      service_label: service.label,
      service_type: service.type,
      endpoint_count: service.apiEndpointsCount,
      openapi_url: `/api/v2/system/api_docs/${service.name}`,
      swagger_ui_url: `/api-docs/${service.name}`,
      last_generated: service.schemaLastDiscovered,
    }));

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse({ resource: apiDocs });

  return createJsonResponse(responseData);
});

/**
 * GET /api/v2/system/api_docs/{service} - Get OpenAPI specification for service
 */
export const getApiDocsForService = http.get(`${SYSTEM_API_BASE}/api_docs/:service`, async ({ request, params }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.normal);
  logRequest(request, { handler: 'getApiDocsForService', params });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  const serviceName = params.service as string;
  const service = mockDatabaseServices.find(s => s.name === serviceName);

  if (!service) {
    return createServiceNotFoundError(serviceName);
  }

  if (!service.is_active || service.apiEndpointsCount === 0) {
    return createDreamFactoryError(
      ERROR_CODES.API_GENERATION_FAILED,
      `No API endpoints available for service '${serviceName}'`,
      404,
      { service_name: serviceName, api_endpoints_count: service.apiEndpointsCount }
    );
  }

  const openApiSpec = generateOpenApiDoc(serviceName);

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse(openApiSpec);

  return createJsonResponse(responseData);
});

// ============================================================================
// LOOKUP KEYS HANDLERS
// ============================================================================

/**
 * GET /api/v2/system/lookup - Get lookup keys
 */
export const getLookupKeys = http.get(`${SYSTEM_API_BASE}/lookup`, async ({ request }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.fast);
  logRequest(request, { handler: 'getLookupKeys' });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse(mockSystemConfig.lookup_keys);

  return createJsonResponse(responseData);
});

/**
 * PUT /api/v2/system/lookup - Update lookup keys
 */
export const updateLookupKeys = http.put(`${SYSTEM_API_BASE}/lookup`, async ({ request }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.normal);
  logRequest(request, { handler: 'updateLookupKeys' });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  if (!validateAdminPermissions(auth)) {
    return createInsufficientPermissionsError('admin', auth.userType);
  }

  const requestBody = await processRequestBody(request);
  const { transformedRequestBody, transformResponse } = applyCaseTransformation(request, requestBody);

  // Update lookup keys
  const updatedLookupKeys = {
    ...mockSystemConfig.lookup_keys,
    ...(transformedRequestBody as Record<string, unknown>),
  };

  // Update the mock config
  mockSystemConfig.lookup_keys = updatedLookupKeys;

  const responseData = transformResponse(updatedLookupKeys);
  return createJsonResponse(responseData);
});

// ============================================================================
// CORS CONFIGURATION HANDLERS
// ============================================================================

/**
 * GET /api/v2/system/cors - Get CORS configuration
 */
export const getCorsConfig = http.get(`${SYSTEM_API_BASE}/cors`, async ({ request }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.fast);
  logRequest(request, { handler: 'getCorsConfig' });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  if (!validateAdminPermissions(auth)) {
    return createInsufficientPermissionsError('admin', auth.userType);
  }

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse(mockSystemConfig.cors);

  return createJsonResponse(responseData);
});

/**
 * PUT /api/v2/system/cors - Update CORS configuration
 */
export const updateCorsConfig = http.put(`${SYSTEM_API_BASE}/cors`, async ({ request }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.normal);
  logRequest(request, { handler: 'updateCorsConfig' });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  if (!validateAdminPermissions(auth)) {
    return createInsufficientPermissionsError('admin', auth.userType);
  }

  const requestBody = await processRequestBody(request);
  const { transformedRequestBody, transformResponse } = applyCaseTransformation(request, requestBody);

  // Validate CORS configuration
  if (typeof transformedRequestBody === 'object' && transformedRequestBody !== null) {
    const corsConfig = transformedRequestBody as Record<string, unknown>;
    
    if (corsConfig.allowed_origins && Array.isArray(corsConfig.allowed_origins)) {
      const invalidOrigins = (corsConfig.allowed_origins as string[]).filter(
        origin => origin !== '*' && !origin.match(/^https?:\/\//)
      );
      
      if (invalidOrigins.length > 0) {
        return createFormValidationError({
          allowed_origins: ['Invalid origin format. Must be * or valid HTTP(S) URL'],
        });
      }
    }
  }

  // Update CORS configuration
  const updatedCorsConfig = {
    ...mockSystemConfig.cors,
    ...(transformedRequestBody as Record<string, unknown>),
  };

  mockSystemConfig.cors = updatedCorsConfig;

  const responseData = transformResponse(updatedCorsConfig);
  return createJsonResponse(responseData);
});

// ============================================================================
// CACHE CONFIGURATION HANDLERS
// ============================================================================

/**
 * GET /api/v2/system/cache - Get cache configuration
 */
export const getCacheConfig = http.get(`${SYSTEM_API_BASE}/cache`, async ({ request }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.fast);
  logRequest(request, { handler: 'getCacheConfig' });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  if (!validateAdminPermissions(auth)) {
    return createInsufficientPermissionsError('admin', auth.userType);
  }

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse(mockSystemConfig.cache);

  return createJsonResponse(responseData);
});

/**
 * DELETE /api/v2/system/cache - Clear cache
 */
export const clearCache = http.delete(`${SYSTEM_API_BASE}/cache`, async ({ request }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.slow);
  logRequest(request, { handler: 'clearCache' });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  if (!validateAdminPermissions(auth)) {
    return createInsufficientPermissionsError('admin', auth.userType);
  }

  // Simulate cache clearing
  const clearResult = {
    success: true,
    message: 'Cache cleared successfully',
    cleared_at: new Date().toISOString(),
    cache_types: ['database', 'api', 'schema', 'config'],
  };

  return createJsonResponse(clearResult);
});

// ============================================================================
// EMAIL TEMPLATE HANDLERS
// ============================================================================

/**
 * GET /api/v2/system/email_template - List email templates
 */
export const getEmailTemplates = http.get(`${SYSTEM_API_BASE}/email_template`, async ({ request }) => {
  await simulateNetworkDelay(NETWORK_DELAYS.normal);
  logRequest(request, { handler: 'getEmailTemplates' });

  const auth = validateAuthHeaders(request);
  if (!auth.isValid) {
    return createAuthenticationRequiredError();
  }

  if (!validateAdminPermissions(auth)) {
    return createInsufficientPermissionsError('admin', auth.userType);
  }

  const templates = Object.entries(mockSystemConfig.email.templates).map(([key, template]) => ({
    name: key,
    ...template,
  }));

  const { transformResponse } = applyCaseTransformation(request, null);
  const responseData = transformResponse({ resource: templates });

  return createJsonResponse(responseData);
});

// ============================================================================
// EXPORT ALL HANDLERS
// ============================================================================

/**
 * Complete collection of MSW handlers for DreamFactory system configuration endpoints
 */
export const systemHandlers = [
  // System information and configuration
  getSystemInfo,
  getSystemEnvironment,
  getSystemConfig,
  updateSystemConfig,

  // Service management
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  testServiceConnection,

  // User and role management
  getUsers,
  getUser,
  getRoles,
  getAdmins,

  // Application management
  getApplications,
  getApplication,

  // Event scripts
  getEventScripts,
  getEventScript,

  // Scheduler
  getSchedulers,
  getScheduler,

  // API documentation
  getApiDocsList,
  getApiDocsForService,

  // Configuration management
  getLookupKeys,
  updateLookupKeys,
  getCorsConfig,
  updateCorsConfig,
  getCacheConfig,
  clearCache,
  getEmailTemplates,
];

export default systemHandlers;