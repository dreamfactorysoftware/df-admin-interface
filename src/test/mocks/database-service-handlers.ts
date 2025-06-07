/**
 * Database Service MSW Handlers
 * 
 * Mock Service Worker (MSW) handlers for database service API endpoints.
 * Provides realistic API mocking for development and testing environments.
 * Supports browser and Node.js environments with comprehensive CRUD operations.
 * 
 * Handler Coverage:
 * - Service listing with filtering, sorting, and pagination
 * - Service CRUD operations (create, read, update, delete)
 * - Connection testing with realistic response times
 * - Service type discovery and paywall scenarios
 * - Error scenarios and edge cases
 * - Bulk operations and batch processing
 * - Real-time synchronization patterns
 * 
 * @fileoverview MSW handlers for database service API mocking
 * @version 1.0.0
 * @since 2024-01-01
 */

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { setupWorker } from 'msw/browser';

// Import types and test data
import type {
  DatabaseService,
  DatabaseDriver,
  ServiceStatus,
  ConnectionTestResult,
  ServiceListFilters,
  ApiErrorResponse,
  ServiceType,
  GenericListResponse
} from '../../components/database-service/service-list/service-list-types';

// =============================================================================
// MOCK DATA GENERATION
// =============================================================================

/**
 * Generate mock database service
 */
export const createMockDatabaseService = (overrides: Partial<DatabaseService> = {}): DatabaseService => {
  const baseService: DatabaseService = {
    id: Math.floor(Math.random() * 10000),
    name: `mock-service-${Date.now()}`,
    label: 'Mock Database Service',
    description: 'A mock database service for testing',
    type: 'mysql',
    driver: 'mysql',
    is_active: true,
    status: 'active',
    config: {
      host: 'localhost',
      port: 3306,
      database: 'test_db',
      username: 'test_user',
      password: '***',
      options: {},
    },
    created_date: new Date().toISOString(),
    created_by_id: 1,
    last_modified_date: new Date().toISOString(),
    last_modified_by_id: 1,
    ...overrides
  };
  
  return baseService;
};

/**
 * Generate mock service list with variety
 */
export const generateMockServiceList = (count: number = 10): DatabaseService[] => {
  const drivers: DatabaseDriver[] = ['mysql', 'postgresql', 'mongodb', 'oracle', 'sqlserver'];
  const statuses: ServiceStatus[] = ['active', 'inactive', 'error', 'testing'];
  
  return Array.from({ length: count }, (_, index) => 
    createMockDatabaseService({
      id: index + 1,
      name: `service-${index + 1}`,
      label: `Database Service ${index + 1}`,
      type: drivers[index % drivers.length],
      driver: drivers[index % drivers.length],
      status: statuses[index % statuses.length],
      is_active: index % 3 !== 0, // Mix of active/inactive
      config: {
        host: `db${index + 1}.example.com`,
        port: 3306 + index,
        database: `database_${index + 1}`,
        username: `user_${index + 1}`,
        password: '***',
        options: {},
      },
      created_date: new Date(Date.now() - index * 86400000).toISOString(), // Spread over days
    })
  );
};

/**
 * Mock service types for paywall testing
 */
export const mockServiceTypes: ServiceType[] = [
  {
    name: 'mysql',
    label: 'MySQL',
    description: 'MySQL Database Service',
    group: 'Database',
    singleton: false,
    dependencies: [],
    subscription_required: false,
  },
  {
    name: 'postgresql',
    label: 'PostgreSQL', 
    description: 'PostgreSQL Database Service',
    group: 'Database',
    singleton: false,
    dependencies: [],
    subscription_required: false,
  },
  {
    name: 'mongodb',
    label: 'MongoDB',
    description: 'MongoDB Database Service',
    group: 'NoSQL',
    singleton: false,
    dependencies: [],
    subscription_required: true, // Premium feature
  }
];

/**
 * Default mock service list
 */
export const mockDatabaseServices = generateMockServiceList(25);

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Apply filters to service list
 */
const applyFilters = (services: DatabaseService[], filters: Partial<ServiceListFilters> = {}): DatabaseService[] => {
  return services.filter(service => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableFields = [service.name, service.label, service.description].filter(Boolean);
      if (!searchableFields.some(field => field.toLowerCase().includes(searchTerm))) {
        return false;
      }
    }
    
    // Type filter
    if (filters.type && filters.type.length > 0) {
      if (!filters.type.includes(service.type)) {
        return false;
      }
    }
    
    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(service.status)) {
        return false;
      }
    }
    
    // Active filter
    if (filters.isActive !== undefined) {
      if (service.is_active !== filters.isActive) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Apply sorting to service list
 */
const applySorting = (
  services: DatabaseService[], 
  sortBy: string = 'name', 
  sortOrder: 'asc' | 'desc' = 'asc'
): DatabaseService[] => {
  return [...services].sort((a, b) => {
    const aValue = a[sortBy as keyof DatabaseService];
    const bValue = b[sortBy as keyof DatabaseService];
    
    let comparison = 0;
    if (aValue < bValue) comparison = -1;
    if (aValue > bValue) comparison = 1;
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
};

/**
 * Apply pagination to service list
 */
const applyPagination = (
  services: DatabaseService[],
  page: number = 1,
  pageSize: number = 25
): { data: DatabaseService[]; totalCount: number; hasMore: boolean } => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const data = services.slice(startIndex, endIndex);
  
  return {
    data,
    totalCount: services.length,
    hasMore: endIndex < services.length
  };
};

/**
 * Simulate network delay for realistic testing
 */
const simulateDelay = (min: number = 100, max: number = 500): Promise<void> => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Generate realistic connection test result
 */
const generateConnectionTestResult = (success: boolean = true): ConnectionTestResult => {
  return {
    success,
    message: success ? 'Connection successful' : 'Connection failed',
    details: success 
      ? {
          host: 'localhost',
          port: 3306,
          database: 'test_db',
          version: '8.0.33',
          responseTime: Math.floor(Math.random() * 1000) + 100, // 100-1100ms
        }
      : {
          error: 'ECONNREFUSED',
          code: 'CONNECTION_REFUSED',
          host: 'localhost',
          port: 3306,
        },
    timestamp: new Date().toISOString(),
  };
};

// =============================================================================
// REQUEST HANDLERS
// =============================================================================

/**
 * Service Types Handlers
 */
const serviceTypesHandlers = [
  // Get service types (for paywall evaluation)
  http.get('/api/v2/system/service_type', async ({ request }) => {
    await simulateDelay();
    
    const url = new URL(request.url);
    const system = url.searchParams.get('system') === 'true';
    
    // Simulate paywall scenario - return empty for non-premium
    const shouldTriggerPaywall = url.searchParams.get('trigger_paywall') === 'true';
    
    if (shouldTriggerPaywall) {
      return HttpResponse.json({
        resource: [],
        meta: {
          count: 0,
          system: system
        }
      });
    }
    
    return HttpResponse.json({
      resource: mockServiceTypes,
      meta: {
        count: mockServiceTypes.length,
        system: system
      }
    });
  }),
];

/**
 * Service List Handlers
 */
const serviceListHandlers = [
  // Get services list
  http.get('/api/v2/system/service', async ({ request }) => {
    await simulateDelay();
    
    const url = new URL(request.url);
    
    // Parse query parameters
    const filters: Partial<ServiceListFilters> = {
      search: url.searchParams.get('filter') || undefined,
      type: url.searchParams.get('type')?.split(',') as DatabaseDriver[] || undefined,
      status: url.searchParams.get('status')?.split(',') as ServiceStatus[] || undefined,
      isActive: url.searchParams.get('active') ? url.searchParams.get('active') === 'true' : undefined,
    };
    
    const sortBy = url.searchParams.get('order') || 'name';
    const sortOrder = (url.searchParams.get('order_dir') || 'asc') as 'asc' | 'desc';
    const page = parseInt(url.searchParams.get('offset') || '0') / parseInt(url.searchParams.get('limit') || '25') + 1;
    const pageSize = parseInt(url.searchParams.get('limit') || '25');
    
    // Check for error simulation
    if (url.searchParams.get('simulate_error') === 'true') {
      return HttpResponse.json(
        {
          error: {
            code: 500,
            message: 'Internal server error - simulated for testing'
          }
        },
        { status: 500 }
      );
    }
    
    // Check for network error simulation
    if (url.searchParams.get('simulate_network_error') === 'true') {
      return HttpResponse.error();
    }
    
    // Apply filtering, sorting, and pagination
    let services = [...mockDatabaseServices];
    services = applyFilters(services, filters);
    services = applySorting(services, sortBy, sortOrder);
    const paginatedResult = applyPagination(services, page, pageSize);
    
    const response: GenericListResponse<DatabaseService> = {
      resource: paginatedResult.data,
      meta: {
        count: paginatedResult.data.length,
        total_count: paginatedResult.totalCount,
        offset: (page - 1) * pageSize,
        limit: pageSize,
        has_more: paginatedResult.hasMore,
      }
    };
    
    return HttpResponse.json(response);
  }),
  
  // Get single service
  http.get('/api/v2/system/service/:id', async ({ params }) => {
    await simulateDelay();
    
    const serviceId = parseInt(params.id as string);
    const service = mockDatabaseServices.find(s => s.id === serviceId);
    
    if (!service) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: `Service with id ${serviceId} not found`
          }
        },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({ resource: service });
  }),
  
  // Create new service
  http.post('/api/v2/system/service', async ({ request }) => {
    await simulateDelay();
    
    const serviceData = await request.json() as Partial<DatabaseService>;
    
    // Validate required fields
    if (!serviceData.name || !serviceData.type) {
      return HttpResponse.json(
        {
          error: {
            code: 400,
            message: 'Missing required fields: name, type'
          }
        },
        { status: 400 }
      );
    }
    
    // Check for duplicate name
    const existingService = mockDatabaseServices.find(s => s.name === serviceData.name);
    if (existingService) {
      return HttpResponse.json(
        {
          error: {
            code: 409,
            message: `Service with name '${serviceData.name}' already exists`
          }
        },
        { status: 409 }
      );
    }
    
    // Create new service
    const newService = createMockDatabaseService({
      ...serviceData,
      id: Math.max(...mockDatabaseServices.map(s => s.id)) + 1,
    });
    
    // Add to mock data
    mockDatabaseServices.push(newService);
    
    return HttpResponse.json({ resource: newService }, { status: 201 });
  }),
  
  // Update service
  http.patch('/api/v2/system/service/:id', async ({ params, request }) => {
    await simulateDelay();
    
    const serviceId = parseInt(params.id as string);
    const updateData = await request.json() as Partial<DatabaseService>;
    
    const serviceIndex = mockDatabaseServices.findIndex(s => s.id === serviceId);
    if (serviceIndex === -1) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: `Service with id ${serviceId} not found`
          }
        },
        { status: 404 }
      );
    }
    
    // Update service
    const updatedService = {
      ...mockDatabaseServices[serviceIndex],
      ...updateData,
      last_modified_date: new Date().toISOString(),
    };
    
    mockDatabaseServices[serviceIndex] = updatedService;
    
    return HttpResponse.json({ resource: updatedService });
  }),
  
  // Delete service
  http.delete('/api/v2/system/service/:id', async ({ params }) => {
    await simulateDelay();
    
    const serviceId = parseInt(params.id as string);
    const serviceIndex = mockDatabaseServices.findIndex(s => s.id === serviceId);
    
    if (serviceIndex === -1) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: `Service with id ${serviceId} not found`
          }
        },
        { status: 404 }
      );
    }
    
    // Remove service
    mockDatabaseServices.splice(serviceIndex, 1);
    
    return HttpResponse.json({ success: true }, { status: 204 });
  }),
];

/**
 * Connection Testing Handlers
 */
const connectionTestHandlers = [
  // Test database connection
  http.post('/api/v2/system/service/:id/test', async ({ params, request }) => {
    // Simulate connection test delay (up to 5 seconds per spec)
    await simulateDelay(1000, 5000);
    
    const serviceId = parseInt(params.id as string);
    const service = mockDatabaseServices.find(s => s.id === serviceId);
    
    if (!service) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: `Service with id ${serviceId} not found`
          }
        },
        { status: 404 }
      );
    }
    
    const requestBody = await request.json() as any;
    const forceFailure = requestBody?.force_failure === true;
    
    // Simulate realistic success/failure rates
    const shouldSucceed = !forceFailure && Math.random() > 0.2; // 80% success rate
    const result = generateConnectionTestResult(shouldSucceed);
    
    if (!shouldSucceed) {
      return HttpResponse.json(
        {
          error: {
            code: 500,
            message: 'Connection test failed',
            details: result.details
          }
        },
        { status: 500 }
      );
    }
    
    return HttpResponse.json({ resource: result });
  }),
  
  // Test connection with config (for new services)
  http.post('/api/v2/system/service/test', async ({ request }) => {
    await simulateDelay(1000, 5000);
    
    const config = await request.json() as any;
    
    // Validate config
    if (!config.host || !config.database) {
      return HttpResponse.json(
        {
          error: {
            code: 400,
            message: 'Missing required connection parameters'
          }
        },
        { status: 400 }
      );
    }
    
    const forceFailure = config.force_failure === true;
    const shouldSucceed = !forceFailure && Math.random() > 0.2;
    const result = generateConnectionTestResult(shouldSucceed);
    
    if (!shouldSucceed) {
      return HttpResponse.json(
        {
          error: {
            code: 500,
            message: 'Connection test failed',
            details: result.details
          }
        },
        { status: 500 }
      );
    }
    
    return HttpResponse.json({ resource: result });
  }),
];

/**
 * Bulk Operations Handlers
 */
const bulkOperationHandlers = [
  // Bulk delete services
  http.delete('/api/v2/system/service', async ({ request }) => {
    await simulateDelay();
    
    const requestBody = await request.json() as { ids: number[] };
    const { ids } = requestBody;
    
    if (!ids || !Array.isArray(ids)) {
      return HttpResponse.json(
        {
          error: {
            code: 400,
            message: 'Invalid request: ids array is required'
          }
        },
        { status: 400 }
      );
    }
    
    // Remove services
    const removedCount = ids.filter(id => {
      const index = mockDatabaseServices.findIndex(s => s.id === id);
      if (index !== -1) {
        mockDatabaseServices.splice(index, 1);
        return true;
      }
      return false;
    }).length;
    
    return HttpResponse.json({
      success: true,
      deleted_count: removedCount,
      requested_count: ids.length
    });
  }),
  
  // Bulk activate/deactivate services
  http.patch('/api/v2/system/service/bulk', async ({ request }) => {
    await simulateDelay();
    
    const requestBody = await request.json() as { 
      ids: number[]; 
      action: 'activate' | 'deactivate';
    };
    const { ids, action } = requestBody;
    
    if (!ids || !Array.isArray(ids) || !action) {
      return HttpResponse.json(
        {
          error: {
            code: 400,
            message: 'Invalid request: ids array and action are required'
          }
        },
        { status: 400 }
      );
    }
    
    // Update services
    const updatedCount = ids.filter(id => {
      const service = mockDatabaseServices.find(s => s.id === id);
      if (service) {
        service.is_active = action === 'activate';
        service.last_modified_date = new Date().toISOString();
        return true;
      }
      return false;
    }).length;
    
    return HttpResponse.json({
      success: true,
      updated_count: updatedCount,
      requested_count: ids.length
    });
  }),
];

// =============================================================================
// PREDEFINED RESPONSE SCENARIOS
// =============================================================================

/**
 * Predefined MSW response scenarios for consistent testing
 */
export const MOCK_SERVICE_LIST_RESPONSES = {
  // Successful service list response
  successfulServiceList: http.get('/api/v2/system/service', async () => {
    await simulateDelay(100, 300);
    return HttpResponse.json({
      resource: mockDatabaseServices.slice(0, 10),
      meta: {
        count: 10,
        total_count: mockDatabaseServices.length,
        offset: 0,
        limit: 25,
        has_more: mockDatabaseServices.length > 10,
      }
    });
  }),
  
  // Empty service list
  emptyServiceList: http.get('/api/v2/system/service', async () => {
    await simulateDelay();
    return HttpResponse.json({
      resource: [],
      meta: {
        count: 0,
        total_count: 0,
        offset: 0,
        limit: 25,
        has_more: false,
      }
    });
  }),
  
  // Large service list for virtualization testing
  largeServiceList: (services: DatabaseService[]) => 
    http.get('/api/v2/system/service', async () => {
      await simulateDelay();
      return HttpResponse.json({
        resource: services.slice(0, 50), // Return first 50 items
        meta: {
          count: 50,
          total_count: services.length,
          offset: 0,
          limit: 50,
          has_more: services.length > 50,
        }
      });
    }),
  
  // Server error response
  serverError: http.get('/api/v2/system/service', async () => {
    await simulateDelay();
    return HttpResponse.json(
      {
        error: {
          code: 500,
          message: 'Internal server error - database connection failed'
        }
      },
      { status: 500 }
    );
  }),
  
  // Network error response
  networkError: http.get('/api/v2/system/service', async () => {
    await simulateDelay();
    return HttpResponse.error();
  }),
  
  // Empty service types (triggers paywall)
  emptyServiceTypes: http.get('/api/v2/system/service_type', async () => {
    await simulateDelay();
    return HttpResponse.json({
      resource: [],
      meta: {
        count: 0,
        system: false
      }
    });
  }),
  
  // Successful connection test
  successfulConnectionTest: http.post('/api/v2/system/service/:id/test', async () => {
    await simulateDelay(1000, 3000);
    return HttpResponse.json({
      resource: generateConnectionTestResult(true)
    });
  }),
  
  // Failed connection test
  failedConnectionTest: http.post('/api/v2/system/service/:id/test', async () => {
    await simulateDelay(1000, 5000);
    return HttpResponse.json(
      {
        error: {
          code: 500,
          message: 'Connection test failed',
          details: generateConnectionTestResult(false).details
        }
      },
      { status: 500 }
    );
  }),
};

// =============================================================================
// COMBINED HANDLERS AND SERVER SETUP
// =============================================================================

/**
 * All MSW handlers combined
 */
export const handlers = [
  ...serviceTypesHandlers,
  ...serviceListHandlers,
  ...connectionTestHandlers,
  ...bulkOperationHandlers,
];

/**
 * MSW server for Node.js environment (testing)
 */
export const server = setupServer(...handlers);

/**
 * MSW worker for browser environment (development)
 */
export const worker = setupWorker(...handlers);

// =============================================================================
// EXPORTS
// =============================================================================

export {
  mockDatabaseServices,
  mockServiceTypes,
  createMockDatabaseService,
  generateMockServiceList,
  generateConnectionTestResult,
};

// Export handlers by category for selective usage
export {
  serviceTypesHandlers,
  serviceListHandlers,
  connectionTestHandlers,
  bulkOperationHandlers,
};