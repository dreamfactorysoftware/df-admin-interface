/**
 * Generic MSW CRUD Handlers for DreamFactory API Endpoints
 * 
 * Comprehensive Mock Service Worker handlers that replicate DfBaseCrudService behavior
 * for all DreamFactory entity endpoints. Provides realistic API response patterns for:
 * - Generic CRUD operations (GET, POST, PUT, PATCH, DELETE)
 * - Pagination, filtering, and sorting with full parameter support
 * - Bulk operations with comma-separated ID handling
 * - File upload/download operations with FormData and blob support
 * - Authentication and authorization validation
 * - Error handling matching DreamFactory patterns
 * 
 * These handlers enable comprehensive frontend testing without requiring a live backend,
 * supporting the React/Next.js migration with accurate API contract compatibility.
 */

import { http, HttpResponse } from 'msw';
import type { RequestHandler } from 'msw';
import { 
  mockData,
  mockDatabaseServices,
  mockUsers,
  mockRoles,
  mockAdmins,
  mockSchemaTables,
  mockOpenApiSpecs,
  mockSystemConfig,
} from './mock-data';
import {
  validateAuthHeaders,
  extractQueryParams,
  createPaginationMeta,
  paginateData,
  applyFilter,
  applySort,
  createJsonResponse,
  createErrorResponse,
  extractServiceName,
  extractResourcePath,
  isSystemApiPath,
  isServiceApiPath,
  logRequest,
  simulateNetworkDelay,
  processRequestBody,
  processResponseBody,
  type QueryParams,
  type AuthContext,
} from './utils';
import {
  createUnauthorizedError,
  createForbiddenError,
  createNotFoundError,
  createValidationError,
  createBadRequestError,
  createServerError,
  createServiceNotFoundError,
  createRecordNotFoundError,
  createInvalidParameterError,
  createMultipleFieldValidationErrors,
  errorScenarios,
} from './error-responses';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Generic resource structure for CRUD operations
 * Supports any DreamFactory entity with common fields
 */
export interface GenericResource {
  id?: number | string;
  name?: string;
  label?: string;
  description?: string;
  created_date?: string;
  last_modified_date?: string;
  created_by_id?: number;
  last_modified_by_id?: number;
  is_active?: boolean;
  [key: string]: any;
}

/**
 * DreamFactory API response structure with metadata
 */
export interface DreamFactoryResponse<T> {
  resource: T[];
  meta?: {
    count: number;
    total?: number;
    limit?: number;
    offset?: number;
    next?: string;
    hasMore?: boolean;
  };
}

/**
 * Bulk operation request structure
 */
export interface BulkOperationRequest {
  resource: GenericResource[];
  [key: string]: any;
}

/**
 * File upload operation structure
 */
export interface FileUploadRequest {
  files: File[];
  metadata?: Record<string, any>;
  options?: {
    overwrite?: boolean;
    extract?: boolean;
    clean?: boolean;
  };
}

/**
 * Configuration for mock data sources
 * Maps API endpoints to their corresponding mock data
 */
interface MockDataMapping {
  [key: string]: {
    data: GenericResource[];
    totalCount?: number;
    idField?: string;
    searchFields?: string[];
    requiredFields?: string[];
    uniqueFields?: string[];
  };
}

// ============================================================================
// MOCK DATA MAPPING CONFIGURATION
// ============================================================================

/**
 * Centralized mapping of API endpoints to mock data sources
 * Enables dynamic CRUD operations across all entity types
 */
const mockDataMapping: MockDataMapping = {
  // System endpoints
  'system/service': {
    data: mockDatabaseServices,
    totalCount: mockDatabaseServices.length,
    idField: 'id',
    searchFields: ['name', 'label', 'description', 'type'],
    requiredFields: ['name', 'type'],
    uniqueFields: ['name'],
  },
  'system/user': {
    data: mockUsers,
    totalCount: mockUsers.length,
    idField: 'id',
    searchFields: ['email', 'first_name', 'last_name', 'username'],
    requiredFields: ['email', 'first_name', 'last_name'],
    uniqueFields: ['email', 'username'],
  },
  'system/admin': {
    data: mockAdmins,
    totalCount: mockAdmins.length,
    idField: 'id',
    searchFields: ['email', 'first_name', 'last_name', 'username'],
    requiredFields: ['email', 'first_name', 'last_name'],
    uniqueFields: ['email', 'username'],
  },
  'system/role': {
    data: mockRoles,
    totalCount: mockRoles.length,
    idField: 'id',
    searchFields: ['name', 'label', 'description'],
    requiredFields: ['name'],
    uniqueFields: ['name'],
  },
  'system/config': {
    data: [mockSystemConfig],
    totalCount: 1,
    idField: 'id',
    searchFields: ['platform.name', 'environment.app_name'],
    requiredFields: [],
    uniqueFields: [],
  },
  
  // Service-specific endpoints (dynamic based on service name)
  '_schema': {
    data: [],  // Will be populated dynamically based on service
    totalCount: 0,
    idField: 'name',
    searchFields: ['name', 'label', 'description'],
    requiredFields: ['name'],
    uniqueFields: ['name'],
  },
  '_table': {
    data: mockSchemaTables,
    totalCount: mockSchemaTables.length,
    idField: 'name',
    searchFields: ['name', 'label', 'description', 'schema'],
    requiredFields: ['name'],
    uniqueFields: ['name'],
  },

  // File service endpoints
  'files': {
    data: [],
    totalCount: 0,
    idField: 'path',
    searchFields: ['path', 'name', 'type'],
    requiredFields: ['path'],
    uniqueFields: ['path'],
  },
};

// ============================================================================
// UTILITY FUNCTIONS FOR CRUD OPERATIONS
// ============================================================================

/**
 * Resolves the appropriate mock data source for a given API path
 * Handles both system endpoints and service-specific endpoints
 * 
 * @param path - API path (e.g., "/api/v2/system/service" or "/api/v2/mysql/_schema")
 * @returns Mock data configuration or null if not found
 */
function resolveMockDataSource(path: string): MockDataMapping[string] | null {
  // Handle system API endpoints
  if (isSystemApiPath(path)) {
    const systemMatch = path.match(/\/(?:system\/)?api\/v2\/system\/(.+?)(?:\/|$)/);
    if (systemMatch) {
      const entityType = systemMatch[1].split('/')[0]; // Get first part for nested endpoints
      return mockDataMapping[`system/${entityType}`] || null;
    }
    return null;
  }

  // Handle service API endpoints
  if (isServiceApiPath(path)) {
    const serviceName = extractServiceName(path);
    const resourcePath = extractResourcePath(path);
    
    if (!serviceName || !resourcePath) return null;

    // Special handling for schema endpoints
    if (resourcePath.startsWith('/_schema')) {
      const schemaData = mockDataMapping['_schema'];
      // Dynamically populate schema data based on service
      return {
        ...schemaData,
        data: mockSchemaTables,
        totalCount: mockSchemaTables.length,
      };
    }

    // Handle table-specific endpoints
    if (resourcePath.includes('/_table')) {
      return mockDataMapping['_table'];
    }

    // For other service endpoints, try to match known patterns
    const resourceType = resourcePath.split('/')[1] || resourcePath.substring(1);
    return mockDataMapping[resourceType] || null;
  }

  return null;
}

/**
 * Validates and processes query parameters for CRUD operations
 * Supports DreamFactory's query parameter patterns including pagination,
 * filtering, sorting, and field selection
 * 
 * @param url - Request URL with query parameters
 * @returns Processed query parameters object
 */
function processQueryParameters(url: string): QueryParams {
  const params = extractQueryParams(url);
  
  // Normalize pagination parameters
  const limit = params.limit && !isNaN(params.limit) ? Math.min(Math.max(1, params.limit), 1000) : 25;
  const offset = params.offset && !isNaN(params.offset) ? Math.max(0, params.offset) : 0;
  
  // Process field selection
  let fields: string[] | undefined;
  if (params.fields && typeof params.fields === 'string') {
    fields = params.fields.split(',').map(f => f.trim()).filter(Boolean);
  }
  
  // Process ordering
  let order: string | undefined;
  if (params.order && typeof params.order === 'string') {
    // Support both "field ASC" and "field,DESC" formats
    order = params.order.replace(/,/g, ' ');
  }

  return {
    limit,
    offset,
    include_count: params.include_count === true || params.include_count === 'true',
    filter: params.filter || undefined,
    fields,
    order,
    // Pass through any additional parameters
    ...params,
  };
}

/**
 * Applies field selection to data, returning only requested fields
 * 
 * @param data - Source data array
 * @param fields - Array of field names to include
 * @returns Data with only selected fields
 */
function applyFieldSelection<T extends Record<string, any>>(data: T[], fields?: string[]): T[] {
  if (!fields || fields.length === 0) return data;
  
  return data.map(item => {
    const filtered: Record<string, any> = {};
    fields.forEach(field => {
      if (field in item) {
        filtered[field] = item[field];
      }
    });
    return filtered as T;
  });
}

/**
 * Validates required fields for create/update operations
 * 
 * @param data - Data to validate
 * @param requiredFields - Array of required field names
 * @returns Validation result with errors if any
 */
function validateRequiredFields(
  data: Record<string, any>, 
  requiredFields: string[]
): { valid: boolean; errors: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = [];
  
  requiredFields.forEach(field => {
    if (!(field in data) || data[field] === null || data[field] === undefined || data[field] === '') {
      errors.push({
        field,
        message: `${field} is required`,
      });
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates unique field constraints for create/update operations
 * 
 * @param data - Data to validate
 * @param uniqueFields - Array of unique field names
 * @param existingData - Existing data to check against
 * @param excludeId - ID to exclude from uniqueness check (for updates)
 * @returns Validation result with errors if any
 */
function validateUniqueFields(
  data: Record<string, any>,
  uniqueFields: string[],
  existingData: GenericResource[],
  excludeId?: string | number
): { valid: boolean; errors: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = [];
  
  uniqueFields.forEach(field => {
    if (field in data) {
      const existingItem = existingData.find(item => 
        item[field] === data[field] && 
        (excludeId === undefined || item.id !== excludeId)
      );
      
      if (existingItem) {
        errors.push({
          field,
          message: `${field} '${data[field]}' already exists`,
        });
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generates a new ID for created resources
 * 
 * @param existingData - Existing data to determine next ID
 * @param idField - Name of the ID field
 * @returns New unique ID
 */
function generateNewId(existingData: GenericResource[], idField: string = 'id'): number {
  const maxId = existingData.reduce((max, item) => {
    const id = Number(item[idField]);
    return isNaN(id) ? max : Math.max(max, id);
  }, 0);
  
  return maxId + 1;
}

/**
 * Creates a timestamp in ISO format
 * 
 * @returns Current timestamp string
 */
function createTimestamp(): string {
  return new Date().toISOString();
}

// ============================================================================
// AUTHENTICATION AND AUTHORIZATION HELPERS
// ============================================================================

/**
 * Validates request authentication and authorization
 * 
 * @param request - MSW request object
 * @param requireAuth - Whether authentication is required
 * @returns Authorization context and validation result
 */
function validateRequestAuth(
  request: Request, 
  requireAuth: boolean = true
): { authContext: AuthContext; errorResponse?: HttpResponse } {
  const authValidation = validateAuthHeaders(request);
  
  if (requireAuth && !authValidation.isValid) {
    if (!authValidation.hasApiKey) {
      return {
        authContext: authValidation,
        errorResponse: createUnauthorizedError('Missing API key - X-DreamFactory-API-Key header required'),
      };
    }
    if (!authValidation.isSessionTokenValid) {
      return {
        authContext: authValidation,
        errorResponse: createUnauthorizedError('Invalid session token'),
      };
    }
  }

  return {
    authContext: authValidation,
  };
}

/**
 * Checks if the authenticated user has permission for the requested operation
 * 
 * @param authContext - Authentication context
 * @param operation - Operation being performed ('read', 'create', 'update', 'delete')
 * @param resource - Resource being accessed
 * @returns True if authorized, false otherwise
 */
function checkResourcePermission(
  authContext: AuthContext,
  operation: 'read' | 'create' | 'update' | 'delete',
  resource: string
): boolean {
  // In a real implementation, this would check user roles and permissions
  // For testing purposes, we'll allow most operations for authenticated users
  if (!authContext.isAuthenticated) {
    return operation === 'read'; // Allow anonymous read for some resources
  }
  
  // System administrators have full access
  if (authContext.sessionToken && authContext.sessionToken.includes('admin')) {
    return true;
  }
  
  // Basic permission checks based on resource type
  if (resource.includes('system/admin') && operation !== 'read') {
    return false; // Only admins can modify admin records
  }
  
  return true; // Allow other operations for authenticated users
}

// ============================================================================
// CORE CRUD OPERATION HANDLERS
// ============================================================================

/**
 * Generic GET handler for retrieving resources
 * Supports pagination, filtering, sorting, and field selection
 * 
 * @param path - API path
 * @param request - MSW request object
 * @returns HTTP response with resource data
 */
async function handleGetRequest(path: string, request: Request): Promise<HttpResponse> {
  await simulateNetworkDelay();
  logRequest(request, 'GET');

  // Validate authentication
  const { authContext, errorResponse } = validateRequestAuth(request, false);
  if (errorResponse) return errorResponse;

  // Check authorization
  if (!checkResourcePermission(authContext, 'read', path)) {
    return createForbiddenError('Insufficient permissions to read this resource');
  }

  // Resolve mock data source
  const dataSource = resolveMockDataSource(path);
  if (!dataSource) {
    return createServiceNotFoundError(extractServiceName(path) || 'unknown');
  }

  // Process query parameters
  const queryParams = processQueryParameters(request.url);
  
  // Extract ID from path for single resource requests
  const idMatch = path.match(/\/(\d+|[a-f0-9-]+)$/);
  const resourceId = idMatch ? idMatch[1] : null;

  // Handle single resource request
  if (resourceId) {
    const resource = dataSource.data.find(item => 
      String(item[dataSource.idField || 'id']) === resourceId
    );
    
    if (!resource) {
      return createRecordNotFoundError(resourceId, extractServiceName(path));
    }

    // Apply field selection if requested
    const selectedData = applyFieldSelection([resource], queryParams.fields);
    
    return createJsonResponse(selectedData[0]);
  }

  // Handle list request with filtering, sorting, and pagination
  let filteredData = [...dataSource.data];

  // Apply text-based filtering
  if (queryParams.filter) {
    filteredData = applyFilter(filteredData, queryParams.filter);
  }

  // Apply sorting
  if (queryParams.order) {
    filteredData = applySort(filteredData, queryParams.order);
  }

  // Calculate pagination metadata
  const totalCount = filteredData.length;
  const meta = createPaginationMeta(totalCount, queryParams.limit, queryParams.offset);

  // Apply pagination
  const paginatedData = paginateData(filteredData, queryParams.limit, queryParams.offset);

  // Apply field selection
  const selectedData = applyFieldSelection(paginatedData, queryParams.fields);

  // Build response
  const response: DreamFactoryResponse<GenericResource> = {
    resource: selectedData,
  };

  // Include metadata if requested or if using pagination
  if (queryParams.include_count || queryParams.limit || queryParams.offset) {
    response.meta = meta;
  }

  return createJsonResponse(response);
}

/**
 * Generic POST handler for creating resources
 * Supports both single resource and bulk creation
 * 
 * @param path - API path
 * @param request - MSW request object
 * @returns HTTP response with created resource data
 */
async function handlePostRequest(path: string, request: Request): Promise<HttpResponse> {
  await simulateNetworkDelay();
  logRequest(request, 'POST');

  // Validate authentication
  const { authContext, errorResponse } = validateRequestAuth(request, true);
  if (errorResponse) return errorResponse;

  // Check authorization
  if (!checkResourcePermission(authContext, 'create', path)) {
    return createForbiddenError('Insufficient permissions to create resources');
  }

  // Resolve mock data source
  const dataSource = resolveMockDataSource(path);
  if (!dataSource) {
    return createServiceNotFoundError(extractServiceName(path) || 'unknown');
  }

  // Handle file upload requests
  const contentType = request.headers.get('Content-Type') || '';
  if (contentType.includes('multipart/form-data')) {
    return handleFileUpload(path, request, dataSource);
  }

  // Process request body
  const requestBody = await processRequestBody(request);
  if (!requestBody) {
    return createBadRequestError('Invalid request body');
  }

  // Determine if this is a bulk operation
  const isBulkOperation = 'resource' in requestBody && Array.isArray(requestBody.resource);
  const resources = isBulkOperation ? requestBody.resource : [requestBody];

  // Validate each resource
  const validationErrors: Array<{ field: string; message: string }> = [];
  const createdResources: GenericResource[] = [];

  for (let i = 0; i < resources.length; i++) {
    const resource = resources[i];
    
    // Validate required fields
    const requiredValidation = validateRequiredFields(resource, dataSource.requiredFields || []);
    if (!requiredValidation.valid) {
      validationErrors.push(...requiredValidation.errors.map(error => ({
        field: isBulkOperation ? `resource[${i}].${error.field}` : error.field,
        message: error.message,
      })));
      continue;
    }

    // Validate unique fields
    const uniqueValidation = validateUniqueFields(
      resource, 
      dataSource.uniqueFields || [], 
      [...dataSource.data, ...createdResources]
    );
    if (!uniqueValidation.valid) {
      validationErrors.push(...uniqueValidation.errors.map(error => ({
        field: isBulkOperation ? `resource[${i}].${error.field}` : error.field,
        message: error.message,
      })));
      continue;
    }

    // Create new resource with generated ID and timestamps
    const newResource: GenericResource = {
      ...resource,
      [dataSource.idField || 'id']: generateNewId(dataSource.data, dataSource.idField),
      created_date: createTimestamp(),
      last_modified_date: createTimestamp(),
      created_by_id: 1, // Mock user ID
      last_modified_by_id: 1,
    };

    createdResources.push(newResource);
    dataSource.data.push(newResource);
  }

  // Return validation errors if any
  if (validationErrors.length > 0) {
    return createMultipleFieldValidationErrors(validationErrors);
  }

  // Return created resources
  const response = isBulkOperation ? 
    { resource: createdResources } : 
    createdResources[0];

  return createJsonResponse(response, { status: 201 });
}

/**
 * Generic PUT/PATCH handler for updating resources
 * Supports both single resource and bulk updates
 * 
 * @param path - API path
 * @param request - MSW request object
 * @returns HTTP response with updated resource data
 */
async function handlePutPatchRequest(path: string, request: Request): Promise<HttpResponse> {
  await simulateNetworkDelay();
  logRequest(request, request.method);

  // Validate authentication
  const { authContext, errorResponse } = validateRequestAuth(request, true);
  if (errorResponse) return errorResponse;

  // Check authorization
  if (!checkResourcePermission(authContext, 'update', path)) {
    return createForbiddenError('Insufficient permissions to update resources');
  }

  // Resolve mock data source
  const dataSource = resolveMockDataSource(path);
  if (!dataSource) {
    return createServiceNotFoundError(extractServiceName(path) || 'unknown');
  }

  // Extract ID from path for single resource updates
  const idMatch = path.match(/\/(\d+|[a-f0-9-]+)$/);
  const resourceId = idMatch ? idMatch[1] : null;

  // Process request body
  const requestBody = await processRequestBody(request);
  if (!requestBody) {
    return createBadRequestError('Invalid request body');
  }

  // Handle single resource update
  if (resourceId) {
    const existingResourceIndex = dataSource.data.findIndex(item => 
      String(item[dataSource.idField || 'id']) === resourceId
    );
    
    if (existingResourceIndex === -1) {
      return createRecordNotFoundError(resourceId, extractServiceName(path));
    }

    const existingResource = dataSource.data[existingResourceIndex];
    
    // Validate unique fields (excluding current resource)
    const uniqueValidation = validateUniqueFields(
      requestBody, 
      dataSource.uniqueFields || [], 
      dataSource.data,
      existingResource[dataSource.idField || 'id']
    );
    
    if (!uniqueValidation.valid) {
      return createMultipleFieldValidationErrors(uniqueValidation.errors);
    }

    // Update resource
    const updatedResource: GenericResource = {
      ...existingResource,
      ...requestBody,
      [dataSource.idField || 'id']: existingResource[dataSource.idField || 'id'], // Preserve ID
      created_date: existingResource.created_date, // Preserve creation date
      last_modified_date: createTimestamp(),
      last_modified_by_id: 1, // Mock user ID
    };

    dataSource.data[existingResourceIndex] = updatedResource;
    
    return createJsonResponse(updatedResource);
  }

  // Handle bulk updates (if resource array is provided)
  const isBulkOperation = 'resource' in requestBody && Array.isArray(requestBody.resource);
  if (isBulkOperation) {
    const validationErrors: Array<{ field: string; message: string }> = [];
    const updatedResources: GenericResource[] = [];

    for (let i = 0; i < requestBody.resource.length; i++) {
      const resource = requestBody.resource[i];
      const resourceIdValue = resource[dataSource.idField || 'id'];
      
      if (!resourceIdValue) {
        validationErrors.push({
          field: `resource[${i}].${dataSource.idField || 'id'}`,
          message: 'ID is required for updates',
        });
        continue;
      }

      const existingResourceIndex = dataSource.data.findIndex(item => 
        String(item[dataSource.idField || 'id']) === String(resourceIdValue)
      );
      
      if (existingResourceIndex === -1) {
        validationErrors.push({
          field: `resource[${i}].${dataSource.idField || 'id'}`,
          message: `Resource with ID '${resourceIdValue}' not found`,
        });
        continue;
      }

      const existingResource = dataSource.data[existingResourceIndex];
      
      // Update resource
      const updatedResource: GenericResource = {
        ...existingResource,
        ...resource,
        [dataSource.idField || 'id']: existingResource[dataSource.idField || 'id'],
        created_date: existingResource.created_date,
        last_modified_date: createTimestamp(),
        last_modified_by_id: 1,
      };

      dataSource.data[existingResourceIndex] = updatedResource;
      updatedResources.push(updatedResource);
    }

    if (validationErrors.length > 0) {
      return createMultipleFieldValidationErrors(validationErrors);
    }

    return createJsonResponse({ resource: updatedResources });
  }

  return createBadRequestError('Invalid update request - resource ID required');
}

/**
 * Generic DELETE handler for removing resources
 * Supports both single resource and bulk deletion
 * 
 * @param path - API path
 * @param request - MSW request object
 * @returns HTTP response confirming deletion
 */
async function handleDeleteRequest(path: string, request: Request): Promise<HttpResponse> {
  await simulateNetworkDelay();
  logRequest(request, 'DELETE');

  // Validate authentication
  const { authContext, errorResponse } = validateRequestAuth(request, true);
  if (errorResponse) return errorResponse;

  // Check authorization
  if (!checkResourcePermission(authContext, 'delete', path)) {
    return createForbiddenError('Insufficient permissions to delete resources');
  }

  // Resolve mock data source
  const dataSource = resolveMockDataSource(path);
  if (!dataSource) {
    return createServiceNotFoundError(extractServiceName(path) || 'unknown');
  }

  // Process query parameters for bulk deletion
  const queryParams = processQueryParameters(request.url);
  
  // Extract ID from path for single resource deletion
  const idMatch = path.match(/\/(\d+|[a-f0-9-]+)$/);
  const resourceId = idMatch ? idMatch[1] : null;

  // Handle bulk deletion via query parameter (e.g., ?ids=1,2,3)
  if (queryParams.ids && typeof queryParams.ids === 'string') {
    const idsToDelete = queryParams.ids.split(',').map(id => id.trim());
    const deletedResources: GenericResource[] = [];
    const notFoundIds: string[] = [];

    idsToDelete.forEach(id => {
      const resourceIndex = dataSource.data.findIndex(item => 
        String(item[dataSource.idField || 'id']) === id
      );
      
      if (resourceIndex !== -1) {
        const deletedResource = dataSource.data.splice(resourceIndex, 1)[0];
        deletedResources.push(deletedResource);
      } else {
        notFoundIds.push(id);
      }
    });

    if (notFoundIds.length > 0) {
      return createNotFoundError(`Resources not found: ${notFoundIds.join(', ')}`);
    }

    return createJsonResponse({ 
      resource: deletedResources.map(r => ({ 
        [dataSource.idField || 'id']: r[dataSource.idField || 'id'] 
      }))
    });
  }

  // Handle single resource deletion
  if (resourceId) {
    const resourceIndex = dataSource.data.findIndex(item => 
      String(item[dataSource.idField || 'id']) === resourceId
    );
    
    if (resourceIndex === -1) {
      return createRecordNotFoundError(resourceId, extractServiceName(path));
    }

    const deletedResource = dataSource.data.splice(resourceIndex, 1)[0];
    
    return createJsonResponse({ 
      [dataSource.idField || 'id']: deletedResource[dataSource.idField || 'id'] 
    });
  }

  return createBadRequestError('Invalid delete request - resource ID or ids parameter required');
}

// ============================================================================
// FILE OPERATION HANDLERS
// ============================================================================

/**
 * Handles file upload operations with FormData support
 * 
 * @param path - API path
 * @param request - MSW request object
 * @param dataSource - Mock data source configuration
 * @returns HTTP response with upload results
 */
async function handleFileUpload(
  path: string, 
  request: Request, 
  dataSource: MockDataMapping[string]
): Promise<HttpResponse> {
  try {
    // In a real implementation, this would process the FormData
    // For mocking purposes, we'll simulate successful file uploads
    const mockFiles = [
      {
        name: 'uploaded_file.csv',
        path: '/uploads/uploaded_file.csv',
        size: 1024,
        type: 'text/csv',
        uploaded_at: createTimestamp(),
      },
      {
        name: 'data_import.json',
        path: '/uploads/data_import.json',
        size: 2048,
        type: 'application/json',
        uploaded_at: createTimestamp(),
      },
    ];

    // Simulate processing uploaded files
    await simulateNetworkDelay(1000); // Longer delay for file operations

    return createJsonResponse({
      resource: mockFiles,
      meta: {
        count: mockFiles.length,
        total: mockFiles.length,
      },
    }, { status: 201 });

  } catch (error) {
    return createServerError('File upload failed');
  }
}

/**
 * Handles file download operations
 * 
 * @param path - API path
 * @param request - MSW request object
 * @returns HTTP response with file data
 */
async function handleFileDownload(path: string, request: Request): Promise<HttpResponse> {
  await simulateNetworkDelay(500);
  
  // Extract file type from query parameters
  const queryParams = processQueryParameters(request.url);
  const format = queryParams.format || 'json';

  // Generate mock file content based on format
  if (format === 'csv') {
    const csvContent = 'id,name,email,created_date\n1,John Doe,john@example.com,2024-01-01\n2,Jane Smith,jane@example.com,2024-01-02';
    
    return new HttpResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="export.csv"',
      },
    });
  }

  if (format === 'xlsx') {
    // Mock Excel file content (binary)
    const mockExcelData = new Uint8Array([0x50, 0x4B, 0x03, 0x04]); // ZIP header for XLSX
    
    return new HttpResponse(mockExcelData, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="export.xlsx"',
      },
    });
  }

  // Default to JSON export
  const jsonData = {
    resource: mockDatabaseServices.slice(0, 5), // Sample data
    exported_at: createTimestamp(),
    format: 'json',
  };

  return HttpResponse.json(jsonData, {
    status: 200,
    headers: {
      'Content-Disposition': 'attachment; filename="export.json"',
    },
  });
}

// ============================================================================
// SPECIALIZED ENDPOINT HANDLERS
// ============================================================================

/**
 * Handles database connection testing
 * 
 * @param request - MSW request object
 * @returns HTTP response with connection test results
 */
async function handleConnectionTest(request: Request): Promise<HttpResponse> {
  await simulateNetworkDelay(2000); // Simulate connection time
  
  const requestBody = await processRequestBody(request);
  if (!requestBody) {
    return createBadRequestError('Connection configuration required');
  }

  // Simulate different connection outcomes based on host
  const host = requestBody.host || '';
  
  if (host.includes('invalid') || host.includes('error')) {
    return createJsonResponse({
      success: false,
      message: 'Connection failed',
      details: 'Unable to connect to database server',
      test_duration: 5000,
      timestamp: createTimestamp(),
      error_code: 'CONNECTION_FAILED',
    }, { status: 400 });
  }

  if (host.includes('timeout')) {
    return createJsonResponse({
      success: false,
      message: 'Connection timeout',
      details: 'Database server did not respond within the timeout period',
      test_duration: 30000,
      timestamp: createTimestamp(),
      error_code: 'CONNECTION_TIMEOUT',
    }, { status: 408 });
  }

  // Default successful connection
  return createJsonResponse({
    success: true,
    message: 'Connection successful',
    details: `Successfully connected to ${host} in 1.2 seconds`,
    test_duration: 1200,
    timestamp: createTimestamp(),
  });
}

/**
 * Handles schema discovery operations
 * 
 * @param serviceName - Database service name
 * @param request - MSW request object
 * @returns HTTP response with schema data
 */
async function handleSchemaDiscovery(serviceName: string, request: Request): Promise<HttpResponse> {
  await simulateNetworkDelay(3000); // Simulate schema discovery time
  
  // Return mock schema data for the service
  const schemaData = {
    resource: mockSchemaTables,
    meta: {
      service_name: serviceName,
      discovered_at: createTimestamp(),
      total_tables: mockSchemaTables.length,
      total_fields: mockSchemaTables.reduce((sum, table) => sum + table.fields.length, 0),
    },
  };

  return createJsonResponse(schemaData);
}

/**
 * Handles OpenAPI specification generation
 * 
 * @param serviceName - Database service name
 * @param request - MSW request object
 * @returns HTTP response with OpenAPI spec
 */
async function handleOpenApiGeneration(serviceName: string, request: Request): Promise<HttpResponse> {
  await simulateNetworkDelay(1500);
  
  // Return mock OpenAPI specification
  const openApiSpec = mockOpenApiSpecs[serviceName] || mockOpenApiSpecs.mysql_production;
  
  return createJsonResponse(openApiSpec);
}

// ============================================================================
// MAIN CRUD HANDLER FACTORY
// ============================================================================

/**
 * Creates a comprehensive CRUD handler for any DreamFactory API endpoint
 * Automatically routes to appropriate operation handler based on HTTP method
 * 
 * @param pathPattern - URL pattern to match (supports wildcards)
 * @returns MSW RequestHandler for the specified pattern
 */
export function createCrudHandler(pathPattern: string): RequestHandler {
  return http.all(pathPattern, async ({ request }) => {
    const method = request.method.toUpperCase();
    const path = new URL(request.url).pathname;

    try {
      // Special handling for specific endpoints
      if (path.includes('/test')) {
        return handleConnectionTest(request);
      }

      if (path.includes('/_schema')) {
        const serviceName = extractServiceName(path);
        if (serviceName) {
          return handleSchemaDiscovery(serviceName, request);
        }
      }

      if (path.includes('/_openapi') || path.includes('/swagger')) {
        const serviceName = extractServiceName(path);
        if (serviceName) {
          return handleOpenApiGeneration(serviceName, request);
        }
      }

      if (path.includes('/download') || path.includes('/export')) {
        return handleFileDownload(path, request);
      }

      // Route to appropriate CRUD handler
      switch (method) {
        case 'GET':
          return handleGetRequest(path, request);
        
        case 'POST':
          return handlePostRequest(path, request);
        
        case 'PUT':
        case 'PATCH':
          return handlePutPatchRequest(path, request);
        
        case 'DELETE':
          return handleDeleteRequest(path, request);
        
        default:
          return createErrorResponse(405, `Method ${method} not allowed`);
      }

    } catch (error) {
      console.error('CRUD handler error:', error);
      return createServerError('Internal server error during request processing');
    }
  });
}

// ============================================================================
// EXPORTED HANDLERS
// ============================================================================

/**
 * Pre-configured CRUD handlers for common DreamFactory API patterns
 * These handlers provide comprehensive CRUD support for all entity types
 */
export const crudHandlers: RequestHandler[] = [
  // System API endpoints
  createCrudHandler('/api/v2/system/*'),
  createCrudHandler('/system/api/v2/*'),
  
  // Service API endpoints (supports all database services)
  createCrudHandler('/api/v2/:service/*'),
  createCrudHandler('/api/v2/:service'),
  
  // File service endpoints
  createCrudHandler('/api/v2/files/*'),
  
  // Specialized endpoints
  http.post('/api/v2/system/service/test', ({ request }) => handleConnectionTest(request)),
  http.get('/api/v2/:service/_schema', ({ request, params }) => {
    const serviceName = params.service as string;
    return handleSchemaDiscovery(serviceName, request);
  }),
  http.get('/api/v2/:service/_openapi', ({ request, params }) => {
    const serviceName = params.service as string;
    return handleOpenApiGeneration(serviceName, request);
  }),
];

/**
 * Utility functions for creating custom CRUD scenarios in tests
 */
export const crudUtilities = {
  createCrudHandler,
  resolveMockDataSource,
  processQueryParameters,
  validateRequestAuth,
  validateRequiredFields,
  validateUniqueFields,
  generateNewId,
  createTimestamp,
  handleConnectionTest,
  handleSchemaDiscovery,
  handleOpenApiGeneration,
  handleFileUpload,
  handleFileDownload,
};

/**
 * Export all handlers as default for easy importing
 */
export default crudHandlers;