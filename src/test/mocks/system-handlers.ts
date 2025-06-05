/**
 * MSW System Configuration Handlers
 * 
 * Mock Service Worker handlers for DreamFactory system configuration endpoints
 * including environment data, system information, services, roles, apps, and
 * administrative functions. Supports comprehensive system management functionality
 * during the React/Next.js migration from Angular implementation.
 * 
 * These handlers replicate the behavior of DfSystemConfigDataService and related
 * Angular services, providing realistic API responses for development and testing.
 * 
 * Endpoint Categories:
 * - System Environment & Configuration (/api/v2/system/environment, /api/v2/system/config)
 * - Service Management (/api/v2/system/service)
 * - User & Role Management (/api/v2/system/user, /api/v2/system/role, /api/v2/system/admin)
 * - Application Management (/api/v2/system/app)
 * - Event Scripts & Scheduler (/api/v2/system/event, /api/v2/system/scheduler)
 * - API Documentation (/api/v2/system/api_docs)
 * - Global Configuration (/api/v2/system/cors, /api/v2/system/cache, /api/v2/system/lookup)
 */

import { http, HttpResponse } from 'msw';
import { mockData } from './mock-data';
import {
  validateAuthHeaders,
  createJsonResponse,
  extractQueryParams,
  createPaginationMeta,
  paginateData,
  applyFilter,
  applySort,
  logRequest,
  simulateNetworkDelay,
  type AuthContext,
  type QueryParams,
} from './utils';
import {
  createUnauthorizedError,
  createForbiddenError,
  createNotFoundError,
  createValidationError,
  createServerError,
  createServiceNotFoundError,
  createInsufficientPermissionsError,
  createFieldValidationError,
  errorScenarios,
} from './error-responses';

// Extract system configuration data from mock data
const { 
  systemConfig, 
  databaseServices, 
  users, 
  admins, 
  roles, 
  openApiSpecs,
  formSchemas,
} = mockData;

// Additional system-specific mock data
const mockEnvironmentData = {
  platform: systemConfig.platform,
  environment: systemConfig.environment,
  database: systemConfig.database,
  security: systemConfig.security,
  cache: systemConfig.cache,
  cors: systemConfig.cors,
  email: systemConfig.email,
  php_info: {
    version: systemConfig.platform.php_version,
    extensions: [
      'bcmath', 'calendar', 'ctype', 'curl', 'date', 'dom', 'exif', 'fileinfo',
      'filter', 'ftp', 'gd', 'gettext', 'hash', 'iconv', 'json', 'libxml',
      'mbstring', 'mysqli', 'mysqlnd', 'openssl', 'pcre', 'pdo', 'pdo_mysql',
      'pdo_pgsql', 'pdo_sqlite', 'pgsql', 'posix', 'readline', 'reflection',
      'session', 'simplexml', 'soap', 'sockets', 'sodium', 'spl', 'sqlite3',
      'standard', 'tokenizer', 'xml', 'xmlreader', 'xmlwriter', 'zip', 'zlib'
    ],
    max_execution_time: 300,
    memory_limit: '512M',
    upload_max_filesize: '64M',
    post_max_size: '64M',
  },
  server_info: {
    software: systemConfig.platform.server_type,
    document_root: '/var/www/html/public',
    https: true,
    port: 443,
    protocol: 'HTTP/2.0',
  },
  disk_space: {
    total: '100GB',
    used: '42GB',
    free: '58GB',
    percentage_used: 42,
  },
  packages: {
    dreamfactory_core: systemConfig.platform.version,
    laravel_framework: '10.48.4',
    php_version: systemConfig.platform.php_version,
    composer_packages: 145,
  },
};

const mockEventScripts = [
  {
    id: 1,
    name: 'user.create.pre_process',
    type: 'php',
    is_active: true,
    content: '<?php\n// Pre-process user creation\n$event->request->payload = array_merge($event->request->payload, [\n    "created_date" => date("c"),\n    "is_active" => true\n]);',
    created_date: '2024-01-15T10:00:00Z',
    last_modified_date: '2024-03-10T14:30:00Z',
    affects: ['user.create'],
    description: 'Automatically set created_date and is_active for new users',
  },
  {
    id: 2,
    name: 'database.connection.post_process',
    type: 'javascript',
    is_active: true,
    content: '// Post-process database connection\nconsole.log("Database connection established:", event.response.content);\nevent.response.content.connection_time = new Date().toISOString();',
    created_date: '2024-02-01T09:30:00Z',
    last_modified_date: '2024-03-08T11:15:00Z',
    affects: ['*.database.*'],
    description: 'Log database connections and add timestamp',
  },
  {
    id: 3,
    name: 'api.security.pre_process',
    type: 'python',
    is_active: false,
    content: '# Security validation script\nimport json\n\n# Validate API request security\nif not event.request.headers.get("X-DreamFactory-API-Key"):\n    raise Exception("API key required")',
    created_date: '2024-01-20T16:45:00Z',
    last_modified_date: '2024-02-28T13:20:00Z',
    affects: ['api.*'],
    description: 'Enforce API key presence for all API requests',
  },
];

const mockScheduledTasks = [
  {
    id: 1,
    name: 'daily_user_cleanup',
    description: 'Clean up inactive user sessions daily',
    cron_expression: '0 2 * * *',
    is_active: true,
    service_id: 'system',
    component: 'user',
    verb: 'DELETE',
    path: '/user/_session',
    payload: { inactive_days: 30 },
    created_date: '2024-01-10T08:00:00Z',
    last_modified_date: '2024-03-01T10:15:00Z',
    last_run: '2024-03-15T02:00:00Z',
    next_run: '2024-03-16T02:00:00Z',
    run_count: 65,
    success_count: 64,
    failure_count: 1,
  },
  {
    id: 2,
    name: 'weekly_backup_report',
    description: 'Generate weekly backup status report',
    cron_expression: '0 6 * * 1',
    is_active: true,
    service_id: 'email',
    component: 'send',
    verb: 'POST',
    path: '/email',
    payload: {
      to: 'admin@dreamfactory.com',
      subject: 'Weekly Backup Report',
      template: 'backup_report',
    },
    created_date: '2024-01-15T12:00:00Z',
    last_modified_date: '2024-02-20T14:30:00Z',
    last_run: '2024-03-11T06:00:00Z',
    next_run: '2024-03-18T06:00:00Z',
    run_count: 9,
    success_count: 9,
    failure_count: 0,
  },
  {
    id: 3,
    name: 'api_usage_metrics',
    description: 'Collect hourly API usage metrics',
    cron_expression: '0 * * * *',
    is_active: true,
    service_id: 'metrics',
    component: 'collect',
    verb: 'POST',
    path: '/metrics/api_usage',
    payload: { interval: 'hourly' },
    created_date: '2024-02-01T09:00:00Z',
    last_modified_date: '2024-03-05T16:45:00Z',
    last_run: '2024-03-15T14:00:00Z',
    next_run: '2024-03-15T15:00:00Z',
    run_count: 1008,
    success_count: 1005,
    failure_count: 3,
  },
];

const mockApps = [
  {
    id: 1,
    name: 'admin_interface',
    label: 'DreamFactory Admin Interface',
    description: 'Administrative interface for DreamFactory management',
    type: 'Web App',
    is_active: true,
    url: 'https://admin.dreamfactory.local',
    api_key: 'df-admin-app-key-2024',
    role_id: 1,
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-03-10T11:30:00Z',
    storage_service_id: null,
    storage_container: null,
    path: '/admin',
    requires_fullscreen: false,
    allow_fullscreen_toggle: true,
    toggle_location: 'top',
    is_default: true,
  },
  {
    id: 2,
    name: 'mobile_app',
    label: 'Customer Mobile App',
    description: 'Mobile application for customer access',
    type: 'Native Mobile',
    is_active: true,
    url: 'mobile://customer.app',
    api_key: 'df-mobile-app-key-2024',
    role_id: 3,
    created_date: '2024-01-20T10:00:00Z',
    last_modified_date: '2024-03-12T09:45:00Z',
    storage_service_id: 1,
    storage_container: 'mobile_assets',
    path: null,
    requires_fullscreen: true,
    allow_fullscreen_toggle: false,
    toggle_location: null,
    is_default: false,
  },
  {
    id: 3,
    name: 'analytics_dashboard',
    label: 'Analytics Dashboard',
    description: 'Business intelligence and reporting dashboard',
    type: 'Web App',
    is_active: true,
    url: 'https://analytics.dreamfactory.local',
    api_key: 'df-analytics-app-key-2024',
    role_id: 4,
    created_date: '2024-02-01T14:00:00Z',
    last_modified_date: '2024-03-08T16:20:00Z',
    storage_service_id: null,
    storage_container: null,
    path: '/analytics',
    requires_fullscreen: false,
    allow_fullscreen_toggle: true,
    toggle_location: 'bottom',
    is_default: false,
  },
];

const mockEmailTemplates = [
  {
    id: 1,
    name: 'user_invite',
    subject: 'Welcome to DreamFactory',
    body_text: 'Welcome to DreamFactory! Click here to activate your account: {activation_link}',
    body_html: '<h1>Welcome to DreamFactory!</h1><p>Click <a href="{activation_link}">here</a> to activate your account.</p>',
    from_name: 'DreamFactory Admin',
    from_email: 'noreply@dreamfactory.local',
    reply_to_name: null,
    reply_to_email: null,
    defaults: ['user_invite_email_template'],
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-02-15T10:30:00Z',
  },
  {
    id: 2,
    name: 'password_reset',
    subject: 'Password Reset Request',
    body_text: 'Click here to reset your password: {reset_link}',
    body_html: '<h1>Password Reset</h1><p>Click <a href="{reset_link}">here</a> to reset your password.</p>',
    from_name: 'DreamFactory Security',
    from_email: 'security@dreamfactory.local',
    reply_to_name: 'Support Team',
    reply_to_email: 'support@dreamfactory.local',
    defaults: ['password_reset_email_template'],
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-03-01T14:20:00Z',
  },
  {
    id: 3,
    name: 'backup_report',
    subject: 'Weekly Backup Report - {date}',
    body_text: 'Weekly backup report for {date}. Status: {status}. Details: {details}',
    body_html: '<h2>Weekly Backup Report</h2><p><strong>Date:</strong> {date}</p><p><strong>Status:</strong> {status}</p><p><strong>Details:</strong> {details}</p>',
    from_name: 'DreamFactory Backup System',
    from_email: 'backup@dreamfactory.local',
    reply_to_name: null,
    reply_to_email: null,
    defaults: [],
    created_date: '2024-01-15T12:00:00Z',
    last_modified_date: '2024-02-28T09:45:00Z',
  },
];

/**
 * Validates user permissions for system operations
 */
function validateSystemPermissions(
  authContext: AuthContext,
  operation: string,
  resource?: string
): boolean {
  if (!authContext.isAuthenticated) {
    return false;
  }

  // Mock permission validation logic
  // In real implementation, this would check against user roles and permissions
  const hasSystemAdmin = authContext.sessionToken?.includes('admin');
  const hasReadAccess = operation === 'read';
  const hasWriteAccess = hasSystemAdmin;

  if (operation === 'read' && !resource) {
    return hasReadAccess;
  }

  if (['create', 'update', 'delete'].includes(operation)) {
    return hasWriteAccess;
  }

  return hasReadAccess;
}

/**
 * System Environment and Configuration Handlers
 */

// GET /api/v2/system/environment - System environment information
export const getSystemEnvironment = http.get('/api/v2/system/environment', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'System Environment');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for system environment access');
  }

  if (!validateSystemPermissions(authValidation, 'read')) {
    return createInsufficientPermissionsError('system environment', 'read');
  }

  return createJsonResponse({
    resource: [mockEnvironmentData],
  });
});

// GET /api/v2/system/config - System configuration
export const getSystemConfig = http.get('/api/v2/system/config', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'System Config');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for system configuration access');
  }

  if (!validateSystemPermissions(authValidation, 'read')) {
    return createInsufficientPermissionsError('system configuration', 'read');
  }

  const params = extractQueryParams(request.url);
  const configSection = params.section;

  if (configSection) {
    const sectionData = (systemConfig as any)[configSection];
    if (!sectionData) {
      return createNotFoundError(`Configuration section '${configSection}' not found`);
    }

    return createJsonResponse({
      resource: [sectionData],
    });
  }

  return createJsonResponse({
    resource: [systemConfig],
  });
});

// PUT /api/v2/system/config - Update system configuration
export const updateSystemConfig = http.put('/api/v2/system/config', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'Update System Config');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for system configuration updates');
  }

  if (!validateSystemPermissions(authValidation, 'update')) {
    return createInsufficientPermissionsError('system configuration', 'update');
  }

  try {
    const configUpdate = await request.json();
    
    // Mock validation
    if (!configUpdate || typeof configUpdate !== 'object') {
      return createValidationError('Invalid configuration data', [
        { field: 'config', message: 'Configuration data must be a valid object' }
      ]);
    }

    // Simulate successful update
    const updatedConfig = { ...systemConfig, ...configUpdate };

    return createJsonResponse({
      resource: [updatedConfig],
    });
  } catch (error) {
    return createValidationError('Invalid JSON payload');
  }
});

/**
 * Service Management Handlers
 */

// GET /api/v2/system/service - List all services
export const getSystemServices = http.get('/api/v2/system/service', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'System Services');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for service access');
  }

  const params = extractQueryParams(request.url);
  let services = [...databaseServices];

  // Apply filtering
  if (params.filter) {
    services = applyFilter(services, params.filter);
  }

  // Apply sorting
  if (params.order) {
    services = applySort(services, params.order);
  }

  // Apply pagination
  const paginatedServices = paginateData(services, params.limit, params.offset);
  const meta = createPaginationMeta(services.length, params.limit, params.offset);

  return createJsonResponse({
    resource: paginatedServices,
    meta,
  });
});

// GET /api/v2/system/service/{id} - Get specific service
export const getSystemService = http.get('/api/v2/system/service/:id', async ({ request, params }) => {
  await simulateNetworkDelay();
  logRequest(request, 'Get System Service');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for service access');
  }

  const serviceId = parseInt(params.id as string, 10);
  const service = databaseServices.find(s => s.id === serviceId);

  if (!service) {
    return createNotFoundError(`Service with ID ${serviceId} not found`);
  }

  return createJsonResponse(service);
});

// POST /api/v2/system/service - Create new service
export const createSystemService = http.post('/api/v2/system/service', async ({ request }) => {
  await simulateNetworkDelay(300); // Slightly longer for creation
  logRequest(request, 'Create System Service');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for service creation');
  }

  if (!validateSystemPermissions(authValidation, 'create', 'service')) {
    return createInsufficientPermissionsError('service', 'create');
  }

  try {
    const serviceData = await request.json();

    // Mock validation
    const validationErrors = [];
    if (!serviceData.name) {
      validationErrors.push({ field: 'name', message: 'Service name is required' });
    }
    if (!serviceData.type) {
      validationErrors.push({ field: 'type', message: 'Service type is required' });
    }
    if (!serviceData.config?.host) {
      validationErrors.push({ field: 'config.host', message: 'Database host is required' });
    }
    if (!serviceData.config?.database) {
      validationErrors.push({ field: 'config.database', message: 'Database name is required' });
    }

    if (validationErrors.length > 0) {
      return createValidationError('Service validation failed', validationErrors);
    }

    // Simulate service creation
    const newService = {
      id: Math.max(...databaseServices.map(s => s.id)) + 1,
      ...serviceData,
      is_active: true,
      created_date: new Date().toISOString(),
      last_modified_date: new Date().toISOString(),
      created_by_id: 1,
      last_modified_by_id: 1,
      status: 'active',
    };

    return createJsonResponse(newService, { status: 201 });
  } catch (error) {
    return createValidationError('Invalid JSON payload');
  }
});

// PUT /api/v2/system/service/{id} - Update service
export const updateSystemService = http.put('/api/v2/system/service/:id', async ({ request, params }) => {
  await simulateNetworkDelay();
  logRequest(request, 'Update System Service');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for service updates');
  }

  if (!validateSystemPermissions(authValidation, 'update', 'service')) {
    return createInsufficientPermissionsError('service', 'update');
  }

  const serviceId = parseInt(params.id as string, 10);
  const service = databaseServices.find(s => s.id === serviceId);

  if (!service) {
    return createNotFoundError(`Service with ID ${serviceId} not found`);
  }

  try {
    const updateData = await request.json();
    
    const updatedService = {
      ...service,
      ...updateData,
      last_modified_date: new Date().toISOString(),
      last_modified_by_id: 1,
    };

    return createJsonResponse(updatedService);
  } catch (error) {
    return createValidationError('Invalid JSON payload');
  }
});

// DELETE /api/v2/system/service/{id} - Delete service
export const deleteSystemService = http.delete('/api/v2/system/service/:id', async ({ request, params }) => {
  await simulateNetworkDelay();
  logRequest(request, 'Delete System Service');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for service deletion');
  }

  if (!validateSystemPermissions(authValidation, 'delete', 'service')) {
    return createInsufficientPermissionsError('service', 'delete');
  }

  const serviceId = parseInt(params.id as string, 10);
  const service = databaseServices.find(s => s.id === serviceId);

  if (!service) {
    return createNotFoundError(`Service with ID ${serviceId} not found`);
  }

  return createJsonResponse({ id: serviceId });
});

/**
 * User and Role Management Handlers
 */

// GET /api/v2/system/user - List users
export const getSystemUsers = http.get('/api/v2/system/user', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'System Users');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for user access');
  }

  const params = extractQueryParams(request.url);
  let userList = [...users];

  // Apply filtering
  if (params.filter) {
    userList = applyFilter(userList, params.filter);
  }

  // Apply sorting
  if (params.order) {
    userList = applySort(userList, params.order);
  }

  // Apply pagination
  const paginatedUsers = paginateData(userList, params.limit, params.offset);
  const meta = createPaginationMeta(userList.length, params.limit, params.offset);

  return createJsonResponse({
    resource: paginatedUsers,
    meta,
  });
});

// GET /api/v2/system/role - List roles
export const getSystemRoles = http.get('/api/v2/system/role', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'System Roles');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for role access');
  }

  const params = extractQueryParams(request.url);
  let roleList = [...roles];

  // Apply filtering
  if (params.filter) {
    roleList = applyFilter(roleList, params.filter);
  }

  // Apply sorting
  if (params.order) {
    roleList = applySort(roleList, params.order);
  }

  // Apply pagination
  const paginatedRoles = paginateData(roleList, params.limit, params.offset);
  const meta = createPaginationMeta(roleList.length, params.limit, params.offset);

  return createJsonResponse({
    resource: paginatedRoles,
    meta,
  });
});

// GET /api/v2/system/admin - List administrators
export const getSystemAdmins = http.get('/api/v2/system/admin', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'System Admins');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for admin access');
  }

  if (!validateSystemPermissions(authValidation, 'read', 'admin')) {
    return createInsufficientPermissionsError('admin', 'read');
  }

  const params = extractQueryParams(request.url);
  let adminList = [...admins];

  // Apply filtering
  if (params.filter) {
    adminList = applyFilter(adminList, params.filter);
  }

  // Apply sorting
  if (params.order) {
    adminList = applySort(adminList, params.order);
  }

  // Apply pagination
  const paginatedAdmins = paginateData(adminList, params.limit, params.offset);
  const meta = createPaginationMeta(adminList.length, params.limit, params.offset);

  return createJsonResponse({
    resource: paginatedAdmins,
    meta,
  });
});

/**
 * Application Management Handlers
 */

// GET /api/v2/system/app - List applications
export const getSystemApps = http.get('/api/v2/system/app', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'System Apps');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for app access');
  }

  const params = extractQueryParams(request.url);
  let appList = [...mockApps];

  // Apply filtering
  if (params.filter) {
    appList = applyFilter(appList, params.filter);
  }

  // Apply sorting
  if (params.order) {
    appList = applySort(appList, params.order);
  }

  // Apply pagination
  const paginatedApps = paginateData(appList, params.limit, params.offset);
  const meta = createPaginationMeta(appList.length, params.limit, params.offset);

  return createJsonResponse({
    resource: paginatedApps,
    meta,
  });
});

// POST /api/v2/system/app - Create new application
export const createSystemApp = http.post('/api/v2/system/app', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'Create System App');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for app creation');
  }

  if (!validateSystemPermissions(authValidation, 'create', 'app')) {
    return createInsufficientPermissionsError('app', 'create');
  }

  try {
    const appData = await request.json();

    // Mock validation
    const validationErrors = [];
    if (!appData.name) {
      validationErrors.push({ field: 'name', message: 'App name is required' });
    }
    if (!appData.label) {
      validationErrors.push({ field: 'label', message: 'App label is required' });
    }

    if (validationErrors.length > 0) {
      return createValidationError('App validation failed', validationErrors);
    }

    // Simulate app creation
    const newApp = {
      id: Math.max(...mockApps.map(a => a.id)) + 1,
      ...appData,
      is_active: true,
      created_date: new Date().toISOString(),
      last_modified_date: new Date().toISOString(),
      api_key: `df-app-key-${Date.now()}`,
    };

    return createJsonResponse(newApp, { status: 201 });
  } catch (error) {
    return createValidationError('Invalid JSON payload');
  }
});

/**
 * Event Scripts and Scheduler Handlers
 */

// GET /api/v2/system/event - List event scripts
export const getSystemEventScripts = http.get('/api/v2/system/event', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'System Event Scripts');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for event script access');
  }

  const params = extractQueryParams(request.url);
  let scriptList = [...mockEventScripts];

  // Apply filtering
  if (params.filter) {
    scriptList = applyFilter(scriptList, params.filter);
  }

  // Apply sorting
  if (params.order) {
    scriptList = applySort(scriptList, params.order);
  }

  // Apply pagination
  const paginatedScripts = paginateData(scriptList, params.limit, params.offset);
  const meta = createPaginationMeta(scriptList.length, params.limit, params.offset);

  return createJsonResponse({
    resource: paginatedScripts,
    meta,
  });
});

// GET /api/v2/system/scheduler - List scheduled tasks
export const getSystemScheduler = http.get('/api/v2/system/scheduler', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'System Scheduler');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for scheduler access');
  }

  const params = extractQueryParams(request.url);
  let taskList = [...mockScheduledTasks];

  // Apply filtering
  if (params.filter) {
    taskList = applyFilter(taskList, params.filter);
  }

  // Apply sorting
  if (params.order) {
    taskList = applySort(taskList, params.order);
  }

  // Apply pagination
  const paginatedTasks = paginateData(taskList, params.limit, params.offset);
  const meta = createPaginationMeta(taskList.length, params.limit, params.offset);

  return createJsonResponse({
    resource: paginatedTasks,
    meta,
  });
});

// POST /api/v2/system/scheduler - Create scheduled task
export const createSystemScheduledTask = http.post('/api/v2/system/scheduler', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'Create Scheduled Task');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for scheduler management');
  }

  if (!validateSystemPermissions(authValidation, 'create', 'scheduler')) {
    return createInsufficientPermissionsError('scheduler', 'create');
  }

  try {
    const taskData = await request.json();

    // Mock validation
    const validationErrors = [];
    if (!taskData.name) {
      validationErrors.push({ field: 'name', message: 'Task name is required' });
    }
    if (!taskData.cron_expression) {
      validationErrors.push({ field: 'cron_expression', message: 'Cron expression is required' });
    }

    if (validationErrors.length > 0) {
      return createValidationError('Scheduled task validation failed', validationErrors);
    }

    // Simulate task creation
    const newTask = {
      id: Math.max(...mockScheduledTasks.map(t => t.id)) + 1,
      ...taskData,
      is_active: true,
      created_date: new Date().toISOString(),
      last_modified_date: new Date().toISOString(),
      run_count: 0,
      success_count: 0,
      failure_count: 0,
    };

    return createJsonResponse(newTask, { status: 201 });
  } catch (error) {
    return createValidationError('Invalid JSON payload');
  }
});

/**
 * API Documentation Handlers
 */

// GET /api/v2/system/api_docs - List API documentation
export const getSystemApiDocs = http.get('/api/v2/system/api_docs', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'System API Docs');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for API documentation access');
  }

  const serviceName = new URL(request.url).searchParams.get('service');

  if (serviceName) {
    const serviceDoc = openApiSpecs[serviceName as keyof typeof openApiSpecs];
    if (!serviceDoc) {
      return createServiceNotFoundError(serviceName);
    }

    return createJsonResponse({
      resource: [serviceDoc],
    });
  }

  // Return list of available API documentation
  const availableDocs = Object.keys(openApiSpecs).map(serviceName => ({
    service_name: serviceName,
    title: openApiSpecs[serviceName as keyof typeof openApiSpecs].info.title,
    version: openApiSpecs[serviceName as keyof typeof openApiSpecs].info.version,
    description: openApiSpecs[serviceName as keyof typeof openApiSpecs].info.description,
  }));

  return createJsonResponse({
    resource: availableDocs,
  });
});

/**
 * Global Configuration Handlers
 */

// GET /api/v2/system/cors - CORS configuration
export const getSystemCors = http.get('/api/v2/system/cors', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'System CORS');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for CORS configuration access');
  }

  return createJsonResponse({
    resource: [systemConfig.cors],
  });
});

// GET /api/v2/system/cache - Cache configuration
export const getSystemCache = http.get('/api/v2/system/cache', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'System Cache');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for cache configuration access');
  }

  return createJsonResponse({
    resource: [systemConfig.cache],
  });
});

// GET /api/v2/system/lookup - Lookup keys
export const getSystemLookupKeys = http.get('/api/v2/system/lookup', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'System Lookup Keys');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for lookup keys access');
  }

  return createJsonResponse({
    resource: [systemConfig.lookup_keys],
  });
});

// GET /api/v2/system/email_template - Email templates
export const getSystemEmailTemplates = http.get('/api/v2/system/email_template', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'System Email Templates');

  const authValidation = validateAuthHeaders(request);
  if (!authValidation.isAuthenticated) {
    return createUnauthorizedError('Authentication required for email template access');
  }

  const params = extractQueryParams(request.url);
  let templateList = [...mockEmailTemplates];

  // Apply filtering
  if (params.filter) {
    templateList = applyFilter(templateList, params.filter);
  }

  // Apply sorting
  if (params.order) {
    templateList = applySort(templateList, params.order);
  }

  // Apply pagination
  const paginatedTemplates = paginateData(templateList, params.limit, params.offset);
  const meta = createPaginationMeta(templateList.length, params.limit, params.offset);

  return createJsonResponse({
    resource: paginatedTemplates,
    meta,
  });
});

/**
 * Export all system handlers
 */
export const systemHandlers = [
  // System environment and configuration
  getSystemEnvironment,
  getSystemConfig,
  updateSystemConfig,

  // Service management
  getSystemServices,
  getSystemService,
  createSystemService,
  updateSystemService,
  deleteSystemService,

  // User and role management
  getSystemUsers,
  getSystemRoles,
  getSystemAdmins,

  // Application management
  getSystemApps,
  createSystemApp,

  // Event scripts and scheduler
  getSystemEventScripts,
  getSystemScheduler,
  createSystemScheduledTask,

  // API documentation
  getSystemApiDocs,

  // Global configuration
  getSystemCors,
  getSystemCache,
  getSystemLookupKeys,
  getSystemEmailTemplates,
];

export default systemHandlers;