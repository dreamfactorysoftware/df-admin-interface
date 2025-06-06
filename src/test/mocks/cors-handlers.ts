/**
 * MSW Handlers for CORS Configuration Endpoints
 * 
 * Provides comprehensive Mock Service Worker handlers for CORS configuration
 * management endpoints in the DreamFactory Admin Interface. These handlers
 * simulate realistic API responses for development and testing scenarios,
 * enabling parallel frontend development without backend dependencies.
 * 
 * Endpoints Covered:
 * - GET /api/v2/system/cors - List CORS configurations with pagination and filtering
 * - GET /api/v2/system/cors/:id - Get specific CORS configuration
 * - POST /api/v2/system/cors - Create new CORS configuration
 * - PUT /api/v2/system/cors/:id - Update existing CORS configuration
 * - DELETE /api/v2/system/cors/:id - Delete CORS configuration
 * - DELETE /api/v2/system/cors - Bulk delete CORS configurations
 * - POST /api/v2/system/cors/test - Test CORS configuration validity
 * 
 * Features:
 * - Realistic response latencies for performance testing
 * - Comprehensive validation error scenarios
 * - Pagination and filtering support
 * - Bulk operations with partial success handling
 * - CORS configuration testing simulation
 * - Error handling for all edge cases
 * - DreamFactory API response format compliance
 * 
 * Performance Characteristics:
 * - Response times simulate production latencies (50-500ms)
 * - Supports concurrent request handling
 * - Memory-efficient data management
 * - Realistic error rate simulation (configurable)
 */

import { http, HttpResponse } from 'msw';
import { mockCorsEntries, createMockCorsEntry, type CorsConfiguration } from './cors-data';
import { createErrorResponse, createValidationErrorResponse } from './error-responses';
import { applyCaseTransformation, extractPaginationParams, createPaginatedResponse } from './utils';

// ============================================================================
// CONFIGURATION AND CONSTANTS
// ============================================================================

/**
 * Configuration for MSW CORS handlers behavior
 */
const CORS_HANDLER_CONFIG = {
  // Simulate realistic API latencies
  latencies: {
    list: { min: 50, max: 200 },      // List operations
    get: { min: 30, max: 100 },       // Single item retrieval
    create: { min: 100, max: 500 },   // Create operations
    update: { min: 100, max: 400 },   // Update operations
    delete: { min: 50, max: 200 },    // Delete operations
    test: { min: 200, max: 1000 },    // CORS testing
  },
  
  // Error simulation rates (for testing error handling)
  errorRates: {
    list: 0.02,     // 2% error rate for list operations
    create: 0.05,   // 5% error rate for create operations
    update: 0.03,   // 3% error rate for update operations
    delete: 0.02,   // 2% error rate for delete operations
  },
  
  // Pagination defaults
  pagination: {
    defaultLimit: 25,
    maxLimit: 100,
  },
  
  // Validation rules
  validation: {
    pathPattern: /^\/[a-zA-Z0-9\*\-\/_]*$/,
    originPattern: /^(https?:\/\/[^\s/$.?#].[^\s]*|\*)$/,
    hostPattern: /^[a-zA-Z0-9.-]+$/,
    maxAgeRange: { min: 0, max: 86400 },
  },
};

/**
 * Simulate realistic API latency
 */
const simulateLatency = async (operation: keyof typeof CORS_HANDLER_CONFIG.latencies) => {
  const { min, max } = CORS_HANDLER_CONFIG.latencies[operation];
  const delay = Math.random() * (max - min) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Simulate random errors for testing error handling
 */
const shouldSimulateError = (operation: keyof typeof CORS_HANDLER_CONFIG.errorRates): boolean => {
  if (process.env.NODE_ENV === 'test') return false; // Disable in tests unless explicitly enabled
  if (process.env.MSW_SIMULATE_ERRORS !== 'true') return false;
  
  const errorRate = CORS_HANDLER_CONFIG.errorRates[operation];
  return Math.random() < errorRate;
};

/**
 * Validate CORS configuration data
 */
const validateCorsConfiguration = (corsData: Partial<CorsConfiguration>) => {
  const errors: Record<string, string[]> = {};
  
  // Validate path
  if (!corsData.path) {
    errors.path = ['Path is required'];
  } else if (!CORS_HANDLER_CONFIG.validation.pathPattern.test(corsData.path)) {
    errors.path = ['Path must start with / and contain only valid characters'];
  }
  
  // Validate origin
  if (!corsData.origin) {
    errors.origin = ['Origin is required'];
  } else if (!CORS_HANDLER_CONFIG.validation.originPattern.test(corsData.origin)) {
    errors.origin = ['Origin must be a valid URL or *'];
  }
  
  // Validate host (optional)
  if (corsData.host && !CORS_HANDLER_CONFIG.validation.hostPattern.test(corsData.host)) {
    errors.host = ['Host must be a valid hostname'];
  }
  
  // Validate methods
  if (!corsData.methods || corsData.methods.length === 0) {
    errors.methods = ['At least one HTTP method must be specified'];
  } else {
    const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    const invalidMethods = corsData.methods.filter(method => !validMethods.includes(method));
    if (invalidMethods.length > 0) {
      errors.methods = [`Invalid HTTP methods: ${invalidMethods.join(', ')}`];
    }
  }
  
  // Validate max_age
  if (corsData.max_age !== undefined) {
    const { min, max } = CORS_HANDLER_CONFIG.validation.maxAgeRange;
    if (corsData.max_age < min || corsData.max_age > max) {
      errors.max_age = [`Max age must be between ${min} and ${max} seconds`];
    }
  }
  
  // Validate headers (optional but must be valid if provided)
  if (corsData.headers) {
    const invalidHeaders = corsData.headers.filter(header => 
      !header || typeof header !== 'string' || header.trim().length === 0
    );
    if (invalidHeaders.length > 0) {
      errors.headers = ['All headers must be non-empty strings'];
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// ============================================================================
// CORS CONFIGURATION HANDLERS
// ============================================================================

/**
 * GET /api/v2/system/cors - List CORS configurations
 * 
 * Supports pagination, filtering, and sorting for CORS configurations.
 * Provides comprehensive search capabilities and performance optimization.
 */
export const corsListHandler = http.get('/api/v2/system/cors', async ({ request }) => {
  await simulateLatency('list');
  
  // Simulate random errors for testing
  if (shouldSimulateError('list')) {
    return HttpResponse.json(
      createErrorResponse(500, 'Internal Server Error', 'Failed to fetch CORS configurations'),
      { status: 500 }
    );
  }
  
  const url = new URL(request.url);
  const { limit, offset, includeCount } = extractPaginationParams(url, CORS_HANDLER_CONFIG.pagination);
  
  // Extract filtering and sorting parameters
  const filter = url.searchParams.get('filter');
  const sort = url.searchParams.get('sort') || 'id';
  const sortDirection = url.searchParams.get('order') || 'asc';
  
  let filteredEntries = [...mockCorsEntries];
  
  // Apply text-based filtering
  if (filter) {
    const filterLower = filter.toLowerCase();
    filteredEntries = mockCorsEntries.filter(entry =>
      entry.path.toLowerCase().includes(filterLower) ||
      entry.origin.toLowerCase().includes(filterLower) ||
      (entry.host && entry.host.toLowerCase().includes(filterLower)) ||
      entry.methods.some(method => method.toLowerCase().includes(filterLower)) ||
      (entry.headers && entry.headers.some(header => header.toLowerCase().includes(filterLower)))
    );
  }
  
  // Apply sorting
  filteredEntries.sort((a, b) => {
    let aValue = a[sort as keyof CorsConfiguration] as any;
    let bValue = b[sort as keyof CorsConfiguration] as any;
    
    // Handle different data types
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  // Apply pagination
  const paginatedEntries = filteredEntries.slice(offset, offset + limit);
  
  // Apply case transformation for DreamFactory API compatibility
  const transformedEntries = paginatedEntries.map(entry => 
    applyCaseTransformation(entry, 'toSnakeCase')
  );
  
  const response = createPaginatedResponse(
    transformedEntries,
    filteredEntries.length,
    limit,
    offset,
    includeCount
  );
  
  return HttpResponse.json(response);
});

/**
 * GET /api/v2/system/cors/:id - Get specific CORS configuration
 * 
 * Retrieves detailed information for a single CORS configuration entry.
 */
export const corsGetHandler = http.get('/api/v2/system/cors/:id', async ({ params }) => {
  await simulateLatency('get');
  
  const { id } = params;
  const corsEntry = mockCorsEntries.find(entry => entry.id === Number(id));
  
  if (!corsEntry) {
    return HttpResponse.json(
      createErrorResponse(404, 'Not Found', `CORS configuration not found with ID: ${id}`),
      { status: 404 }
    );
  }
  
  // Apply case transformation for DreamFactory API compatibility
  const transformedEntry = applyCaseTransformation(corsEntry, 'toSnakeCase');
  
  return HttpResponse.json(transformedEntry);
});

/**
 * POST /api/v2/system/cors - Create new CORS configuration
 * 
 * Creates a new CORS configuration with comprehensive validation and error handling.
 */
export const corsCreateHandler = http.post('/api/v2/system/cors', async ({ request }) => {
  await simulateLatency('create');
  
  // Simulate random errors for testing
  if (shouldSimulateError('create')) {
    return HttpResponse.json(
      createErrorResponse(500, 'Internal Server Error', 'Failed to create CORS configuration'),
      { status: 500 }
    );
  }
  
  try {
    const corsData = await request.json() as Partial<CorsConfiguration>;
    
    // Apply case transformation from client format
    const transformedData = applyCaseTransformation(corsData, 'toCamelCase') as Partial<CorsConfiguration>;
    
    // Validate the CORS configuration
    const validation = validateCorsConfiguration(transformedData);
    if (!validation.isValid) {
      return HttpResponse.json(
        createValidationErrorResponse('Validation failed', validation.errors),
        { status: 400 }
      );
    }
    
    // Check for duplicate path/origin combination
    const existingEntry = mockCorsEntries.find(entry =>
      entry.path === transformedData.path && entry.origin === transformedData.origin
    );
    
    if (existingEntry) {
      return HttpResponse.json(
        createValidationErrorResponse('Duplicate CORS configuration', {
          path: ['A CORS configuration with this path and origin already exists'],
        }),
        { status: 409 }
      );
    }
    
    // Create new CORS entry
    const newEntry = createMockCorsEntry({
      ...transformedData,
      id: Math.max(...mockCorsEntries.map(e => e.id), 0) + 1,
    } as CorsConfiguration);
    
    mockCorsEntries.push(newEntry);
    
    // Apply case transformation for response
    const transformedEntry = applyCaseTransformation(newEntry, 'toSnakeCase');
    
    return HttpResponse.json(transformedEntry, { status: 201 });
  } catch (error) {
    return HttpResponse.json(
      createErrorResponse(400, 'Bad Request', 'Invalid JSON payload'),
      { status: 400 }
    );
  }
});

/**
 * PUT /api/v2/system/cors/:id - Update existing CORS configuration
 * 
 * Updates an existing CORS configuration with comprehensive validation.
 */
export const corsUpdateHandler = http.put('/api/v2/system/cors/:id', async ({ params, request }) => {
  await simulateLatency('update');
  
  // Simulate random errors for testing
  if (shouldSimulateError('update')) {
    return HttpResponse.json(
      createErrorResponse(500, 'Internal Server Error', 'Failed to update CORS configuration'),
      { status: 500 }
    );
  }
  
  const { id } = params;
  const entryIndex = mockCorsEntries.findIndex(entry => entry.id === Number(id));
  
  if (entryIndex === -1) {
    return HttpResponse.json(
      createErrorResponse(404, 'Not Found', `CORS configuration not found with ID: ${id}`),
      { status: 404 }
    );
  }
  
  try {
    const corsData = await request.json() as Partial<CorsConfiguration>;
    
    // Apply case transformation from client format
    const transformedData = applyCaseTransformation(corsData, 'toCamelCase') as Partial<CorsConfiguration>;
    
    // Merge with existing data for validation
    const mergedData = { ...mockCorsEntries[entryIndex], ...transformedData };
    
    // Validate the updated CORS configuration
    const validation = validateCorsConfiguration(mergedData);
    if (!validation.isValid) {
      return HttpResponse.json(
        createValidationErrorResponse('Validation failed', validation.errors),
        { status: 400 }
      );
    }
    
    // Check for duplicate path/origin combination (excluding current entry)
    const existingEntry = mockCorsEntries.find(entry =>
      entry.id !== Number(id) &&
      entry.path === mergedData.path &&
      entry.origin === mergedData.origin
    );
    
    if (existingEntry) {
      return HttpResponse.json(
        createValidationErrorResponse('Duplicate CORS configuration', {
          path: ['A CORS configuration with this path and origin already exists'],
        }),
        { status: 409 }
      );
    }
    
    // Update existing entry
    const updatedEntry = {
      ...mockCorsEntries[entryIndex],
      ...transformedData,
      updated_at: new Date().toISOString(),
    };
    
    mockCorsEntries[entryIndex] = updatedEntry;
    
    // Apply case transformation for response
    const transformedEntry = applyCaseTransformation(updatedEntry, 'toSnakeCase');
    
    return HttpResponse.json(transformedEntry);
  } catch (error) {
    return HttpResponse.json(
      createErrorResponse(400, 'Bad Request', 'Invalid JSON payload'),
      { status: 400 }
    );
  }
});

/**
 * DELETE /api/v2/system/cors/:id - Delete specific CORS configuration
 * 
 * Deletes a single CORS configuration by ID.
 */
export const corsDeleteHandler = http.delete('/api/v2/system/cors/:id', async ({ params }) => {
  await simulateLatency('delete');
  
  // Simulate random errors for testing
  if (shouldSimulateError('delete')) {
    return HttpResponse.json(
      createErrorResponse(500, 'Internal Server Error', 'Failed to delete CORS configuration'),
      { status: 500 }
    );
  }
  
  const { id } = params;
  const entryIndex = mockCorsEntries.findIndex(entry => entry.id === Number(id));
  
  if (entryIndex === -1) {
    return HttpResponse.json(
      createErrorResponse(404, 'Not Found', `CORS configuration not found with ID: ${id}`),
      { status: 404 }
    );
  }
  
  // Remove entry
  const deletedEntry = mockCorsEntries.splice(entryIndex, 1)[0];
  
  // Apply case transformation for response
  const transformedEntry = applyCaseTransformation(deletedEntry, 'toSnakeCase');
  
  return HttpResponse.json({ 
    success: true, 
    resource: transformedEntry 
  });
});

/**
 * DELETE /api/v2/system/cors - Bulk delete CORS configurations
 * 
 * Deletes multiple CORS configurations specified by comma-separated IDs.
 * Supports partial success scenarios with detailed reporting.
 */
export const corsBulkDeleteHandler = http.delete('/api/v2/system/cors', async ({ request }) => {
  await simulateLatency('delete');
  
  const url = new URL(request.url);
  const idsParam = url.searchParams.get('ids');
  
  if (!idsParam) {
    return HttpResponse.json(
      createErrorResponse(400, 'Bad Request', 'No IDs provided for bulk delete operation'),
      { status: 400 }
    );
  }
  
  const ids = idsParam.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));
  
  if (ids.length === 0) {
    return HttpResponse.json(
      createErrorResponse(400, 'Bad Request', 'No valid IDs provided for bulk delete operation'),
      { status: 400 }
    );
  }
  
  const deletedEntries: CorsConfiguration[] = [];
  const notFoundIds: number[] = [];
  
  // Process each ID
  ids.forEach(id => {
    const entryIndex = mockCorsEntries.findIndex(entry => entry.id === id);
    if (entryIndex !== -1) {
      deletedEntries.push(mockCorsEntries.splice(entryIndex, 1)[0]);
    } else {
      notFoundIds.push(id);
    }
  });
  
  // Apply case transformation for response
  const transformedEntries = deletedEntries.map(entry => 
    applyCaseTransformation(entry, 'toSnakeCase')
  );
  
  const response: any = {
    success: true,
    resource: transformedEntries,
    deleted_count: deletedEntries.length,
    requested_count: ids.length,
  };
  
  // Include warnings for not found IDs
  if (notFoundIds.length > 0) {
    response.warnings = [`CORS configurations not found for IDs: ${notFoundIds.join(', ')}`];
  }
  
  return HttpResponse.json(response);
});

/**
 * POST /api/v2/system/cors/test - Test CORS configuration validity
 * 
 * Validates a CORS configuration and tests its effectiveness without saving.
 * Provides detailed feedback on configuration validity and potential issues.
 */
export const corsTestHandler = http.post('/api/v2/system/cors/test', async ({ request }) => {
  await simulateLatency('test');
  
  try {
    const corsData = await request.json() as Partial<CorsConfiguration>;
    
    // Apply case transformation from client format
    const transformedData = applyCaseTransformation(corsData, 'toCamelCase') as Partial<CorsConfiguration>;
    
    // Validate the CORS configuration
    const validation = validateCorsConfiguration(transformedData);
    
    // Perform additional CORS-specific tests
    const tests = {
      path_valid: !!transformedData.path && CORS_HANDLER_CONFIG.validation.pathPattern.test(transformedData.path),
      origin_valid: !!transformedData.origin && CORS_HANDLER_CONFIG.validation.originPattern.test(transformedData.origin),
      methods_configured: transformedData.methods && transformedData.methods.length > 0,
      headers_configured: transformedData.headers && transformedData.headers.length > 0,
      credentials_settings: typeof transformedData.supports_credentials === 'boolean',
      max_age_valid: !transformedData.max_age || (
        transformedData.max_age >= CORS_HANDLER_CONFIG.validation.maxAgeRange.min &&
        transformedData.max_age <= CORS_HANDLER_CONFIG.validation.maxAgeRange.max
      ),
    };
    
    const allTestsPassed = Object.values(tests).every(Boolean);
    const isValid = validation.isValid && allTestsPassed;
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (transformedData.origin === '*' && transformedData.supports_credentials) {
      recommendations.push('Using wildcard origin (*) with credentials is not allowed by CORS specification');
    }
    
    if (!transformedData.headers?.includes('Content-Type')) {
      recommendations.push('Consider including Content-Type in allowed headers for better compatibility');
    }
    
    if (transformedData.max_age && transformedData.max_age > 3600) {
      recommendations.push('Max age values over 1 hour may not be respected by all browsers');
    }
    
    if (transformedData.methods?.includes('*')) {
      recommendations.push('Wildcard methods (*) are not standard - specify explicit methods instead');
    }
    
    const response = {
      success: isValid,
      message: isValid 
        ? 'CORS configuration is valid and properly configured' 
        : 'CORS configuration has validation errors or warnings',
      details: {
        validation_passed: validation.isValid,
        tests_passed: allTestsPassed,
        test_results: tests,
        ...(validation.errors && Object.keys(validation.errors).length > 0 && {
          validation_errors: validation.errors,
        }),
        ...(recommendations.length > 0 && {
          recommendations,
        }),
      },
      // Simulate browser compatibility check
      browser_compatibility: {
        chrome: true,
        firefox: true,
        safari: transformedData.max_age ? transformedData.max_age <= 600 : true,
        edge: true,
        ie11: transformedData.methods ? !transformedData.methods.includes('PATCH') : true,
      },
      // Simulate security assessment
      security_assessment: {
        risk_level: transformedData.origin === '*' ? 'high' : 'low',
        allows_credentials: !!transformedData.supports_credentials,
        wildcard_origin: transformedData.origin === '*',
        sensitive_headers: transformedData.headers?.some(header => 
          ['authorization', 'cookie', 'x-api-key'].includes(header.toLowerCase())
        ) || false,
      },
    };
    
    return HttpResponse.json(response);
  } catch (error) {
    return HttpResponse.json(
      createErrorResponse(400, 'Bad Request', 'Invalid JSON payload for CORS testing'),
      { status: 400 }
    );
  }
});

// ============================================================================
// HANDLER EXPORTS
// ============================================================================

/**
 * Collection of all CORS-related MSW handlers
 * Export these handlers to be used in MSW server setup
 */
export const corsHandlers = [
  corsListHandler,
  corsGetHandler,
  corsCreateHandler,
  corsUpdateHandler,
  corsDeleteHandler,
  corsBulkDeleteHandler,
  corsTestHandler,
];

/**
 * Default export for convenient importing
 */
export default corsHandlers;

/**
 * Reset function for testing - clears all CORS data
 */
export const resetCorsData = () => {
  mockCorsEntries.length = 0;
  mockCorsEntries.push(
    createMockCorsEntry({
      id: 1,
      path: '/api/v2/*',
      origin: 'https://app.example.com',
      host: 'api.dreamfactory.local',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      headers: ['Content-Type', 'Authorization', 'X-Requested-With'],
      supports_credentials: true,
      max_age: 86400,
      enabled: true,
    }),
    createMockCorsEntry({
      id: 2,
      path: '/api/v2/db/*',
      origin: 'https://admin.example.com',
      host: 'api.dreamfactory.local',
      methods: ['GET', 'POST'],
      headers: ['Content-Type', 'Authorization'],
      supports_credentials: false,
      max_age: 3600,
      enabled: true,
    }),
    createMockCorsEntry({
      id: 3,
      path: '/api/v2/system/*',
      origin: '*',
      host: 'api.dreamfactory.local',
      methods: ['GET'],
      headers: ['Content-Type'],
      supports_credentials: false,
      max_age: 300,
      enabled: false,
    })
  );
};

/**
 * Configure handler behavior for testing
 */
export const configureCorsHandlers = (config: Partial<typeof CORS_HANDLER_CONFIG>) => {
  Object.assign(CORS_HANDLER_CONFIG, config);
};