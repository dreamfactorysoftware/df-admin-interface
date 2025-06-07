/**
 * Generic MSW CRUD Handlers for DreamFactory API Endpoints
 * 
 * Provides comprehensive Mock Service Worker handlers for CRUD operations that support
 * all DreamFactory entity endpoints. These handlers replicate the behavior of DfBaseCrudService
 * and provide realistic API responses for development and testing scenarios.
 * 
 * Features:
 * - Generic CRUD operation support for all HTTP methods (GET, POST, PUT, PATCH, DELETE)
 * - Pagination support with limit, offset, and include_count parameters
 * - Filtering and sorting capabilities matching DfBaseCrudService.getOptions() behavior
 * - Bulk operation support with comma-separated IDs for efficient data management
 * - File upload and import operations with FormData support
 * - JSON download and blob file download response mocking
 * - Authentication and authorization validation
 * - Comprehensive error handling with DreamFactory-compliant error responses
 * 
 * Usage:
 * - Import specific handlers for targeted mocking
 * - Use generic handlers as base for custom endpoint implementations
 * - Apply to any DreamFactory service endpoint (/api/v2/{service}/{resource})
 */

import { http, HttpResponse, type HttpHandler } from 'msw';
import { 
  extractQueryParams,
  applyPagination,
  applyFilter,
  applySort,
  validateAuthHeaders,
  processRequestBody,
  createListResponse,
  createJsonResponse,
  createBlobResponse,
  extractIdFromPath,
  validateRequiredFields,
  formDataToObject,
  simulateNetworkDelay,
  logRequest,
  applyCaseTransformation,
  type QueryParamsResult,
  type AuthValidationResult,
  type PaginationMeta,
} from './utils';
import {
  createAuthenticationRequiredError,
  createForbiddenError,
  createNotFoundError,
  createValidationError,
  createInternalServerError,
  createResourceNotFoundError,
  createInvalidParameterError,
  createFormValidationError,
  createDatabaseConnectionError,
  type FieldErrors,
} from './error-responses';
import { mockData } from './mock-data';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Generic resource entity with common DreamFactory fields
 */
export interface GenericResource {
  id?: string | number;
  created_date?: string;
  last_modified_date?: string;
  created_by_id?: number;
  last_modified_by_id?: number;
  [key: string]: unknown;
}

/**
 * CRUD operation context for handlers
 */
export interface CrudContext {
  serviceName: string;
  resourceName: string;
  resourceId?: string | string[];
  operation: 'create' | 'read' | 'update' | 'delete' | 'list';
  auth: AuthValidationResult;
  queryParams: QueryParamsResult;
  requestBody?: unknown;
}

/**
 * Generic data store for mock data by resource type
 */
export interface ResourceDataStore {
  [resourceType: string]: GenericResource[];
}

/**
 * File upload result interface
 */
export interface FileUploadResult {
  filename: string;
  size: number;
  type: string;
  url: string;
  success: boolean;
  message?: string;
}

/**
 * Bulk operation result interface
 */
export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    id: string | number;
    error: string;
  }>;
  results: GenericResource[];
}

/**
 * Download response configuration
 */
export interface DownloadConfig {
  filename: string;
  contentType: string;
  data: string | Uint8Array;
  headers?: Record<string, string>;
}

// ============================================================================
// MOCK DATA STORES
// ============================================================================

/**
 * In-memory data store for generic resources
 * Organized by resource type for easy lookup and manipulation
 */
const mockDataStore: ResourceDataStore = {
  // Database services
  services: mockData.databaseServices.map(service => ({
    id: service.id,
    name: service.name,
    label: service.label,
    description: service.description,
    type: service.type,
    is_active: service.is_active,
    created_date: service.created_date,
    last_modified_date: service.last_modified_date,
    created_by_id: service.created_by_id,
    last_modified_by_id: service.last_modified_by_id,
    ...service,
  })),

  // Users and authentication
  users: mockData.users.map(user => ({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    is_active: user.is_active,
    is_verified: user.is_verified,
    role_id: user.role_id,
    created_date: user.created_date,
    last_modified_date: user.last_modified_date,
    last_login_date: user.last_login_date,
    ...user,
  })),

  // System administrators
  admins: mockData.admins.map(admin => ({
    id: admin.id,
    email: admin.email,
    first_name: admin.first_name,
    last_name: admin.last_name,
    username: admin.username,
    is_active: admin.is_active,
    is_verified: admin.is_verified,
    role_id: admin.role_id,
    created_date: admin.created_date,
    last_modified_date: admin.last_modified_date,
    is_sys_admin: admin.is_sys_admin,
    ...admin,
  })),

  // User roles
  roles: mockData.roles.map(role => ({
    id: role.id,
    name: role.name,
    label: role.label,
    description: role.description,
    is_active: role.is_active,
    created_date: role.created_date,
    last_modified_date: role.last_modified_date,
    permissions: role.permissions,
    ...role,
  })),

  // Schema tables (for schema discovery)
  tables: mockData.schemaTables.map(table => ({
    id: table.name,
    name: table.name,
    label: table.label,
    description: table.description,
    schema: table.schema,
    rowCount: table.rowCount,
    estimatedSize: table.estimatedSize,
    lastModified: table.lastModified,
    apiEnabled: table.apiEnabled,
    ...table,
  })),

  // Sample data for generic testing
  test_entities: Array.from({ length: 100 }, (_, index) => ({
    id: index + 1,
    name: `Test Entity ${index + 1}`,
    description: `Description for test entity ${index + 1}`,
    status: index % 3 === 0 ? 'active' : index % 3 === 1 ? 'inactive' : 'pending',
    created_date: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    last_modified_date: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
    created_by_id: Math.floor(Math.random() * 3) + 1,
    last_modified_by_id: Math.floor(Math.random() * 3) + 1,
    category: ['category-a', 'category-b', 'category-c'][index % 3],
    priority: Math.floor(Math.random() * 5) + 1,
    tags: [`tag-${index % 5}`, `tag-${(index + 1) % 5}`],
  })),
};

/**
 * Gets the next available ID for a resource type
 */
function getNextId(resourceType: string): number {
  const resources = mockDataStore[resourceType] || [];
  const numericIds = resources
    .map(r => typeof r.id === 'number' ? r.id : parseInt(String(r.id), 10))
    .filter(id => !isNaN(id));
  
  return numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
}

/**
 * Adds timestamp fields to a resource
 */
function addTimestamps(resource: GenericResource, isUpdate: boolean = false): GenericResource {
  const now = new Date().toISOString();
  
  if (!isUpdate) {
    resource.created_date = now;
    resource.created_by_id = 1; // Default to admin user
  }
  
  resource.last_modified_date = now;
  resource.last_modified_by_id = 1; // Default to admin user
  
  return resource;
}

// ============================================================================
// CORE CRUD OPERATIONS
// ============================================================================

/**
 * Generic GET handler for listing resources with pagination, filtering, and sorting
 */
export async function handleList(context: CrudContext): Promise<HttpResponse> {
  const { serviceName, resourceName, auth, queryParams } = context;

  // Simulate network delay
  await simulateNetworkDelay();

  // Validate authentication
  if (!auth.isValid) {
    return createAuthenticationRequiredError('API key required for resource access');
  }

  // Get resources from data store
  let resources = mockDataStore[resourceName] || [];

  // Apply filtering
  if (queryParams.filter) {
    resources = applyFilter(resources, queryParams.filter);
  }

  // Apply sorting
  if (queryParams.order) {
    resources = applySort(resources, queryParams.order);
  }

  // Apply field selection
  if (queryParams.fields) {
    const fields = queryParams.fields.split(',').map(f => f.trim());
    resources = resources.map(resource => {
      const filteredResource: GenericResource = {};
      fields.forEach(field => {
        if (resource.hasOwnProperty(field)) {
          filteredResource[field] = resource[field];
        }
      });
      return filteredResource;
    });
  }

  // Apply pagination
  const limit = Math.min(queryParams.limit || 25, 1000); // Cap at 1000
  const offset = queryParams.offset || 0;
  const { data: paginatedData, meta } = applyPagination(resources, limit, offset);

  // Include total count if requested
  if (queryParams.include_count) {
    meta.total = resources.length;
  }

  return createListResponse(paginatedData, meta);
}

/**
 * Generic GET handler for retrieving a single resource by ID
 */
export async function handleGet(context: CrudContext): Promise<HttpResponse> {
  const { serviceName, resourceName, resourceId, auth, queryParams } = context;

  // Simulate network delay
  await simulateNetworkDelay();

  // Validate authentication
  if (!auth.isValid) {
    return createAuthenticationRequiredError('API key required for resource access');
  }

  // Validate resource ID
  if (!resourceId || Array.isArray(resourceId)) {
    return createInvalidParameterError('id', 'Single resource ID is required');
  }

  // Find resource in data store
  const resources = mockDataStore[resourceName] || [];
  const resource = resources.find(r => String(r.id) === String(resourceId));

  if (!resource) {
    return createResourceNotFoundError(resourceName, resourceId);
  }

  // Apply field selection
  let result = resource;
  if (queryParams.fields) {
    const fields = queryParams.fields.split(',').map(f => f.trim());
    result = {};
    fields.forEach(field => {
      if (resource.hasOwnProperty(field)) {
        result[field] = resource[field];
      }
    });
  }

  return createJsonResponse(result);
}

/**
 * Generic POST handler for creating new resources
 */
export async function handleCreate(context: CrudContext): Promise<HttpResponse> {
  const { serviceName, resourceName, auth, requestBody } = context;

  // Simulate network delay
  await simulateNetworkDelay();

  // Validate authentication
  if (!auth.isValid) {
    return createAuthenticationRequiredError('API key required for resource creation');
  }

  // Validate request body
  if (!requestBody || (typeof requestBody !== 'object')) {
    return createValidationError('Request body is required for resource creation');
  }

  const body = requestBody as Record<string, unknown>;

  // Handle bulk creation (array of resources)
  if (body.resource && Array.isArray(body.resource)) {
    return handleBulkCreate(context, body.resource);
  }

  // Handle single resource creation
  const resourceData = body.resource || body;
  
  // Validate required fields (basic validation)
  const requiredFields = ['name']; // Most DreamFactory resources require a name
  const validation = validateRequiredFields(resourceData as Record<string, unknown>, requiredFields);
  
  if (!validation.isValid && resourceName !== 'test_entities') {
    const fieldErrors: FieldErrors = {};
    validation.missingFields.forEach(field => {
      fieldErrors[field] = [`${field} is required`];
    });
    return createFormValidationError(fieldErrors);
  }

  // Create new resource
  const newResource: GenericResource = {
    ...resourceData,
    id: getNextId(resourceName),
  };

  // Add timestamps
  addTimestamps(newResource);

  // Add to data store
  if (!mockDataStore[resourceName]) {
    mockDataStore[resourceName] = [];
  }
  mockDataStore[resourceName].push(newResource);

  return createJsonResponse(newResource, 201);
}

/**
 * Generic PUT/PATCH handler for updating resources
 */
export async function handleUpdate(context: CrudContext): Promise<HttpResponse> {
  const { serviceName, resourceName, resourceId, auth, requestBody } = context;

  // Simulate network delay
  await simulateNetworkDelay();

  // Validate authentication
  if (!auth.isValid) {
    return createAuthenticationRequiredError('API key required for resource updates');
  }

  // Validate resource ID
  if (!resourceId || Array.isArray(resourceId)) {
    return createInvalidParameterError('id', 'Single resource ID is required for updates');
  }

  // Validate request body
  if (!requestBody || (typeof requestBody !== 'object')) {
    return createValidationError('Request body is required for resource updates');
  }

  // Find resource in data store
  const resources = mockDataStore[resourceName] || [];
  const resourceIndex = resources.findIndex(r => String(r.id) === String(resourceId));

  if (resourceIndex === -1) {
    return createResourceNotFoundError(resourceName, resourceId);
  }

  // Update resource
  const updateData = requestBody as Record<string, unknown>;
  const updatedResource = {
    ...resources[resourceIndex],
    ...updateData,
    id: resources[resourceIndex].id, // Preserve original ID
  };

  // Add timestamps
  addTimestamps(updatedResource, true);

  // Update in data store
  mockDataStore[resourceName][resourceIndex] = updatedResource;

  return createJsonResponse(updatedResource);
}

/**
 * Generic DELETE handler for removing resources
 */
export async function handleDelete(context: CrudContext): Promise<HttpResponse> {
  const { serviceName, resourceName, resourceId, auth } = context;

  // Simulate network delay
  await simulateNetworkDelay();

  // Validate authentication
  if (!auth.isValid) {
    return createAuthenticationRequiredError('API key required for resource deletion');
  }

  // Validate resource ID
  if (!resourceId) {
    return createInvalidParameterError('id', 'Resource ID is required for deletion');
  }

  // Handle bulk deletion (comma-separated IDs)
  if (Array.isArray(resourceId)) {
    return handleBulkDelete(context, resourceId);
  }

  // Handle single resource deletion
  const resources = mockDataStore[resourceName] || [];
  const resourceIndex = resources.findIndex(r => String(r.id) === String(resourceId));

  if (resourceIndex === -1) {
    return createResourceNotFoundError(resourceName, resourceId);
  }

  // Remove from data store
  const deletedResource = mockDataStore[resourceName].splice(resourceIndex, 1)[0];

  return createJsonResponse({ id: deletedResource.id });
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Handles bulk creation of multiple resources
 */
async function handleBulkCreate(context: CrudContext, resources: unknown[]): Promise<HttpResponse> {
  const { resourceName } = context;
  const results: GenericResource[] = [];
  const errors: Array<{ id: string | number; error: string }> = [];

  for (let i = 0; i < resources.length; i++) {
    try {
      const resourceData = resources[i] as Record<string, unknown>;
      
      // Create new resource
      const newResource: GenericResource = {
        ...resourceData,
        id: getNextId(resourceName),
      };

      // Add timestamps
      addTimestamps(newResource);

      // Add to data store
      if (!mockDataStore[resourceName]) {
        mockDataStore[resourceName] = [];
      }
      mockDataStore[resourceName].push(newResource);
      results.push(newResource);

    } catch (error) {
      errors.push({
        id: i,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const bulkResult: BulkOperationResult = {
    success: results.length,
    failed: errors.length,
    errors,
    results,
  };

  return createJsonResponse({ resource: results, meta: bulkResult });
}

/**
 * Handles bulk deletion of multiple resources
 */
async function handleBulkDelete(context: CrudContext, resourceIds: string[]): Promise<HttpResponse> {
  const { resourceName } = context;
  const results: { id: string | number }[] = [];
  const errors: Array<{ id: string | number; error: string }> = [];

  for (const resourceId of resourceIds) {
    try {
      const resources = mockDataStore[resourceName] || [];
      const resourceIndex = resources.findIndex(r => String(r.id) === String(resourceId));

      if (resourceIndex === -1) {
        errors.push({
          id: resourceId,
          error: `Resource with ID '${resourceId}' not found`,
        });
        continue;
      }

      // Remove from data store
      const deletedResource = mockDataStore[resourceName].splice(resourceIndex, 1)[0];
      results.push({ id: deletedResource.id });

    } catch (error) {
      errors.push({
        id: resourceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const bulkResult: BulkOperationResult = {
    success: results.length,
    failed: errors.length,
    errors,
    results: results as GenericResource[],
  };

  return createJsonResponse({ resource: results, meta: bulkResult });
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

/**
 * Handles file upload operations
 */
export async function handleFileUpload(context: CrudContext): Promise<HttpResponse> {
  const { serviceName, resourceName, auth, requestBody } = context;

  // Simulate network delay for file processing
  await simulateNetworkDelay(500);

  // Validate authentication
  if (!auth.isValid) {
    return createAuthenticationRequiredError('API key required for file uploads');
  }

  // Process FormData
  if (!(requestBody instanceof FormData)) {
    return createValidationError('File upload requires multipart/form-data');
  }

  const formData = formDataToObject(requestBody);
  const files: FileUploadResult[] = [];

  // Process uploaded files
  for (const [key, value] of Object.entries(formData)) {
    if (value instanceof File) {
      const result: FileUploadResult = {
        filename: value.name,
        size: value.size,
        type: value.type,
        url: `/uploads/${resourceName}/${Date.now()}_${value.name}`,
        success: true,
        message: 'File uploaded successfully',
      };
      files.push(result);
    }
  }

  if (files.length === 0) {
    return createValidationError('No files were uploaded');
  }

  return createJsonResponse({
    resource: files.length === 1 ? files[0] : files,
    meta: {
      total_files: files.length,
      total_size: files.reduce((sum, file) => sum + file.size, 0),
    },
  });
}

/**
 * Handles file import operations (CSV, JSON, etc.)
 */
export async function handleFileImport(context: CrudContext): Promise<HttpResponse> {
  const { serviceName, resourceName, auth, requestBody } = context;

  // Simulate network delay for file processing
  await simulateNetworkDelay(1000);

  // Validate authentication
  if (!auth.isValid) {
    return createAuthenticationRequiredError('API key required for file imports');
  }

  // Process FormData
  if (!(requestBody instanceof FormData)) {
    return createValidationError('File import requires multipart/form-data');
  }

  const formData = formDataToObject(requestBody);
  
  // Mock import processing
  const importResults = {
    total_records: Math.floor(Math.random() * 1000) + 100,
    imported_records: Math.floor(Math.random() * 900) + 90,
    failed_records: Math.floor(Math.random() * 10),
    processing_time: Math.floor(Math.random() * 5000) + 1000,
    import_id: `import_${Date.now()}`,
    status: 'completed',
  };

  return createJsonResponse({
    resource: importResults,
    meta: {
      success_rate: ((importResults.imported_records / importResults.total_records) * 100).toFixed(2),
    },
  });
}

/**
 * Handles JSON data export downloads
 */
export async function handleJsonDownload(context: CrudContext): Promise<HttpResponse> {
  const { serviceName, resourceName, auth, queryParams } = context;

  // Simulate processing delay
  await simulateNetworkDelay(300);

  // Validate authentication
  if (!auth.isValid) {
    return createAuthenticationRequiredError('API key required for data export');
  }

  // Get resources for export
  let resources = mockDataStore[resourceName] || [];

  // Apply filtering and sorting for export
  if (queryParams.filter) {
    resources = applyFilter(resources, queryParams.filter);
  }

  if (queryParams.order) {
    resources = applySort(resources, queryParams.order);
  }

  // Apply field selection
  if (queryParams.fields) {
    const fields = queryParams.fields.split(',').map(f => f.trim());
    resources = resources.map(resource => {
      const filteredResource: GenericResource = {};
      fields.forEach(field => {
        if (resource.hasOwnProperty(field)) {
          filteredResource[field] = resource[field];
        }
      });
      return filteredResource;
    });
  }

  // Create JSON export
  const exportData = {
    export_info: {
      timestamp: new Date().toISOString(),
      service: serviceName,
      resource: resourceName,
      total_records: resources.length,
      exported_by: auth.userId || 'anonymous',
    },
    data: resources,
  };

  const filename = `${resourceName}_export_${new Date().toISOString().split('T')[0]}.json`;
  const jsonData = JSON.stringify(exportData, null, 2);

  return createBlobResponse(jsonData, 'application/json', filename);
}

/**
 * Handles blob file downloads (Excel, CSV, etc.)
 */
export async function handleBlobDownload(context: CrudContext): Promise<HttpResponse> {
  const { serviceName, resourceName, auth, queryParams } = context;

  // Simulate processing delay
  await simulateNetworkDelay(500);

  // Validate authentication
  if (!auth.isValid) {
    return createAuthenticationRequiredError('API key required for file downloads');
  }

  const format = queryParams.format || 'csv';
  const filename = `${resourceName}_export_${new Date().toISOString().split('T')[0]}.${format}`;

  // Mock file data based on format
  let fileData: string;
  let contentType: string;

  switch (format) {
    case 'csv':
      fileData = 'id,name,created_date\n1,"Test Item 1","2024-01-01T00:00:00Z"\n2,"Test Item 2","2024-01-02T00:00:00Z"';
      contentType = 'text/csv';
      break;
    case 'xlsx':
      // Mock Excel binary data (would be actual binary in real implementation)
      fileData = 'PK\x03\x04...'; // Mock Excel file header
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      break;
    default:
      fileData = 'Unsupported format';
      contentType = 'text/plain';
  }

  return createBlobResponse(fileData, contentType, filename);
}

// ============================================================================
// MAIN CRUD HANDLER FACTORY
// ============================================================================

/**
 * Creates MSW handlers for a specific service and resource type
 */
export function createCrudHandlers(
  serviceName: string,
  resourceName: string,
  basePath?: string
): HttpHandler[] {
  const baseUrl = basePath || `/api/v2/${serviceName}/${resourceName}`;

  return [
    // List resources (GET /api/v2/{service}/{resource})
    http.get(baseUrl, async ({ request }) => {
      logRequest(request, { operation: 'list', service: serviceName, resource: resourceName });

      const auth = validateAuthHeaders(request);
      const queryParams = extractQueryParams(request);

      const context: CrudContext = {
        serviceName,
        resourceName,
        operation: 'list',
        auth,
        queryParams,
      };

      return handleList(context);
    }),

    // Get single resource (GET /api/v2/{service}/{resource}/{id})
    http.get(`${baseUrl}/:id`, async ({ request, params }) => {
      logRequest(request, { operation: 'get', service: serviceName, resource: resourceName });

      const auth = validateAuthHeaders(request);
      const queryParams = extractQueryParams(request);
      const resourceId = extractIdFromPath(request.url, `${baseUrl}/:id`);

      const context: CrudContext = {
        serviceName,
        resourceName,
        resourceId: resourceId || params.id as string,
        operation: 'read',
        auth,
        queryParams,
      };

      return handleGet(context);
    }),

    // Create resource (POST /api/v2/{service}/{resource})
    http.post(baseUrl, async ({ request }) => {
      logRequest(request, { operation: 'create', service: serviceName, resource: resourceName });

      const auth = validateAuthHeaders(request);
      const queryParams = extractQueryParams(request);
      const requestBody = await processRequestBody(request);

      // Apply case transformation
      const { transformedRequestBody, transformResponse } = applyCaseTransformation(request, requestBody);

      const context: CrudContext = {
        serviceName,
        resourceName,
        operation: 'create',
        auth,
        queryParams,
        requestBody: transformedRequestBody,
      };

      const response = await handleCreate(context);
      
      // Transform response if needed
      if (response.headers.get('content-type')?.includes('application/json')) {
        const responseBody = await response.json();
        const transformedBody = transformResponse(responseBody);
        return createJsonResponse(transformedBody, response.status);
      }

      return response;
    }),

    // Update resource (PUT /api/v2/{service}/{resource}/{id})
    http.put(`${baseUrl}/:id`, async ({ request, params }) => {
      logRequest(request, { operation: 'update', service: serviceName, resource: resourceName });

      const auth = validateAuthHeaders(request);
      const queryParams = extractQueryParams(request);
      const requestBody = await processRequestBody(request);
      const resourceId = extractIdFromPath(request.url, `${baseUrl}/:id`);

      // Apply case transformation
      const { transformedRequestBody, transformResponse } = applyCaseTransformation(request, requestBody);

      const context: CrudContext = {
        serviceName,
        resourceName,
        resourceId: resourceId || params.id as string,
        operation: 'update',
        auth,
        queryParams,
        requestBody: transformedRequestBody,
      };

      const response = await handleUpdate(context);
      
      // Transform response if needed
      if (response.headers.get('content-type')?.includes('application/json')) {
        const responseBody = await response.json();
        const transformedBody = transformResponse(responseBody);
        return createJsonResponse(transformedBody, response.status);
      }

      return response;
    }),

    // Patch resource (PATCH /api/v2/{service}/{resource}/{id})
    http.patch(`${baseUrl}/:id`, async ({ request, params }) => {
      logRequest(request, { operation: 'patch', service: serviceName, resource: resourceName });

      const auth = validateAuthHeaders(request);
      const queryParams = extractQueryParams(request);
      const requestBody = await processRequestBody(request);
      const resourceId = extractIdFromPath(request.url, `${baseUrl}/:id`);

      // Apply case transformation
      const { transformedRequestBody, transformResponse } = applyCaseTransformation(request, requestBody);

      const context: CrudContext = {
        serviceName,
        resourceName,
        resourceId: resourceId || params.id as string,
        operation: 'update',
        auth,
        queryParams,
        requestBody: transformedRequestBody,
      };

      const response = await handleUpdate(context);
      
      // Transform response if needed
      if (response.headers.get('content-type')?.includes('application/json')) {
        const responseBody = await response.json();
        const transformedBody = transformResponse(responseBody);
        return createJsonResponse(transformedBody, response.status);
      }

      return response;
    }),

    // Delete resource (DELETE /api/v2/{service}/{resource}/{id})
    http.delete(`${baseUrl}/:id`, async ({ request, params }) => {
      logRequest(request, { operation: 'delete', service: serviceName, resource: resourceName });

      const auth = validateAuthHeaders(request);
      const queryParams = extractQueryParams(request);
      const resourceId = extractIdFromPath(request.url, `${baseUrl}/:id`);

      // Handle comma-separated IDs for bulk deletion
      let ids: string | string[] = resourceId || params.id as string;
      if (typeof ids === 'string' && ids.includes(',')) {
        ids = ids.split(',').map(id => id.trim());
      }

      const context: CrudContext = {
        serviceName,
        resourceName,
        resourceId: ids,
        operation: 'delete',
        auth,
        queryParams,
      };

      return handleDelete(context);
    }),

    // File upload (POST /api/v2/{service}/{resource}/upload)
    http.post(`${baseUrl}/upload`, async ({ request }) => {
      logRequest(request, { operation: 'upload', service: serviceName, resource: resourceName });

      const auth = validateAuthHeaders(request);
      const queryParams = extractQueryParams(request);
      const requestBody = await processRequestBody(request);

      const context: CrudContext = {
        serviceName,
        resourceName,
        operation: 'create',
        auth,
        queryParams,
        requestBody,
      };

      return handleFileUpload(context);
    }),

    // File import (POST /api/v2/{service}/{resource}/import)
    http.post(`${baseUrl}/import`, async ({ request }) => {
      logRequest(request, { operation: 'import', service: serviceName, resource: resourceName });

      const auth = validateAuthHeaders(request);
      const queryParams = extractQueryParams(request);
      const requestBody = await processRequestBody(request);

      const context: CrudContext = {
        serviceName,
        resourceName,
        operation: 'create',
        auth,
        queryParams,
        requestBody,
      };

      return handleFileImport(context);
    }),

    // JSON export (GET /api/v2/{service}/{resource}/export)
    http.get(`${baseUrl}/export`, async ({ request }) => {
      logRequest(request, { operation: 'export', service: serviceName, resource: resourceName });

      const auth = validateAuthHeaders(request);
      const queryParams = extractQueryParams(request);

      const context: CrudContext = {
        serviceName,
        resourceName,
        operation: 'read',
        auth,
        queryParams,
      };

      return handleJsonDownload(context);
    }),

    // File download (GET /api/v2/{service}/{resource}/download)
    http.get(`${baseUrl}/download`, async ({ request }) => {
      logRequest(request, { operation: 'download', service: serviceName, resource: resourceName });

      const auth = validateAuthHeaders(request);
      const queryParams = extractQueryParams(request);

      const context: CrudContext = {
        serviceName,
        resourceName,
        operation: 'read',
        auth,
        queryParams,
      };

      return handleBlobDownload(context);
    }),
  ];
}

// ============================================================================
// PREDEFINED HANDLERS FOR COMMON DREAMFACTORY SERVICES
// ============================================================================

/**
 * System service handlers for user management, roles, etc.
 */
export const systemServiceHandlers = [
  ...createCrudHandlers('system', 'user'),
  ...createCrudHandlers('system', 'admin'),
  ...createCrudHandlers('system', 'role'),
  ...createCrudHandlers('system', 'service'),
  ...createCrudHandlers('system', 'config'),
  ...createCrudHandlers('system', 'event'),
  ...createCrudHandlers('system', 'lookup'),
  ...createCrudHandlers('system', 'app'),
];

/**
 * Database service handlers for tables, fields, relationships
 */
export const databaseServiceHandlers = [
  ...createCrudHandlers('db', 'table'),
  ...createCrudHandlers('db', 'field'),
  ...createCrudHandlers('db', 'relationship'),
  ...createCrudHandlers('db', 'procedure'),
  ...createCrudHandlers('db', 'function'),
  ...createCrudHandlers('db', 'view'),
];

/**
 * Generic test handlers for development and testing
 */
export const testServiceHandlers = [
  ...createCrudHandlers('test', 'entities'),
  ...createCrudHandlers('test', 'users'),
  ...createCrudHandlers('test', 'products'),
  ...createCrudHandlers('test', 'orders'),
];

/**
 * All predefined CRUD handlers
 */
export const allCrudHandlers: HttpHandler[] = [
  ...systemServiceHandlers,
  ...databaseServiceHandlers,
  ...testServiceHandlers,
];

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Export main handler functions for custom implementations
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
 * Export mock data store for direct manipulation in tests
 */
export { mockDataStore };

/**
 * Export types for external usage
 */
export type {
  GenericResource,
  CrudContext,
  ResourceDataStore,
  FileUploadResult,
  BulkOperationResult,
  DownloadConfig,
};