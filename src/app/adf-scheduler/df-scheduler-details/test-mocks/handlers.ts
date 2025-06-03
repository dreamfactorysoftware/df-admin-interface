/**
 * Mock Service Worker (MSW) Request Handlers for Scheduler Operations
 * 
 * This module provides comprehensive MSW handlers for scheduler task CRUD operations,
 * service component discovery, and task log management. These handlers intercept and mock
 * all scheduler-related API calls, providing realistic API responses for development and testing.
 * 
 * Features:
 * - Complete scheduler task CRUD operations
 * - Service component access list endpoints
 * - Task log retrieval and management
 * - Error scenario simulation for robust testing
 * - Realistic network latency simulation
 * - DreamFactory Core API v2 response format compliance
 * 
 * Endpoints Covered:
 * - GET /api/v2/system/task (list scheduler tasks)
 * - GET /api/v2/system/task/{id} (get single task)
 * - POST /api/v2/system/task (create task)
 * - PUT /api/v2/system/task/{id} (update task)
 * - DELETE /api/v2/system/task/{id} (delete task)
 * - GET /api/v2/{serviceName}?as_access_list=true (service components)
 * - GET /api/v2/system/service (services list for dropdowns)
 */

import { http, HttpResponse, delay } from 'msw';
import type {
  SchedulerTask,
  SchedulerTaskData,
  CreateSchedulePayload,
  UpdateSchedulePayload,
  TaskLog,
  TaskListResponse,
  ServiceAccessList,
  SchedulerAPIResponse,
  SchedulerTestScenario,
  MockSchedulerTask
} from '../../../../types/scheduler';
import type { Service } from '../../../../types/service';

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

/**
 * Generate mock task log data
 */
const generateMockTaskLog = (taskId: number, statusCode: number = 200): TaskLog => ({
  taskId,
  statusCode,
  lastModifiedDate: new Date().toISOString(),
  createdDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  content: statusCode === 200 
    ? `Task executed successfully at ${new Date().toLocaleString()}.\n\nResponse data:\n${JSON.stringify({
        success: true,
        message: 'Operation completed',
        timestamp: new Date().toISOString(),
        executionTime: Math.floor(Math.random() * 1000) + 100
      }, null, 2)}`
    : `Task execution failed at ${new Date().toLocaleString()}.\n\nError details:\n${JSON.stringify({
        error: 'Task execution failed',
        statusCode,
        message: statusCode === 404 ? 'Resource not found' : 'Internal server error',
        timestamp: new Date().toISOString()
      }, null, 2)}`
});

/**
 * Generate mock service data for scheduler tasks
 */
const generateMockService = (id: number, name: string, type: string = 'mysql'): Service => ({
  id,
  name,
  label: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
  description: `${type.toUpperCase()} database service for ${name}`,
  isActive: true,
  type,
  mutable: true,
  deletable: true,
  createdDate: new Date(Date.now() - 7 * 86400000).toISOString(), // 7 days ago
  lastModifiedDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  createdById: 1,
  lastModifiedById: 1,
  config: {
    host: 'localhost',
    port: type === 'mysql' ? 3306 : type === 'pgsql' ? 5432 : 27017,
    database: `${name}_db`,
    username: 'admin',
    connectionTimeout: 30
  },
  serviceDocByServiceId: null,
  refresh: false
});

/**
 * Generate mock scheduler task data
 */
const generateMockSchedulerTask = (
  id: number, 
  overrides: Partial<SchedulerTask> = {},
  includeLog: boolean = Math.random() > 0.5
): SchedulerTask => {
  const serviceId = overrides.serviceId || (id % 3) + 1; // Cycle through services 1-3
  const serviceNames = ['users_db', 'products_db', 'analytics_db'];
  const serviceName = serviceNames[(serviceId - 1) % serviceNames.length];
  const service = generateMockService(serviceId, serviceName);
  
  const components = ['users', 'profiles', 'sessions', 'logs', 'analytics', 'reports'];
  const verbs = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
  
  const verb = overrides.verb || verbs[id % verbs.length];
  const component = overrides.component || components[id % components.length];
  
  return {
    id,
    name: overrides.name || `Scheduled ${verb} ${component} Task ${id}`,
    description: overrides.description || `Automated ${verb.toLowerCase()} operation for ${component} endpoint every ${300 + (id * 60)} seconds`,
    isActive: overrides.isActive !== undefined ? overrides.isActive : Math.random() > 0.3,
    serviceId,
    component,
    frequency: overrides.frequency || 300 + (id * 60), // 5 minutes plus incremental
    payload: overrides.payload || (verb !== 'GET' ? JSON.stringify({
      automated: true,
      taskId: id,
      timestamp: new Date().toISOString()
    }) : null),
    createdDate: new Date(Date.now() - (id * 86400000)).toISOString(), // Staggered creation dates
    lastModifiedDate: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(),
    createdById: 1,
    lastModifiedById: Math.random() > 0.5 ? 1 : null,
    verb,
    verbMask: getVerbMask(verb),
    taskLogByTaskId: includeLog ? generateMockTaskLog(id, Math.random() > 0.8 ? 500 : 200) : null,
    serviceByServiceId: service,
    ...overrides
  };
};

/**
 * Get verb mask for HTTP method
 */
const getVerbMask = (verb: string): number => {
  const masks = { 'GET': 1, 'POST': 2, 'PUT': 4, 'PATCH': 8, 'DELETE': 16 };
  return masks[verb as keyof typeof masks] || 1;
};

/**
 * Generate mock service components list
 */
const generateServiceComponents = (serviceName: string): string[] => {
  const baseComponents = ['_table', '_proc', '_func', '_schema'];
  const tableComponents = [
    'users', 'profiles', 'sessions', 'logs', 'analytics', 'reports',
    'orders', 'products', 'categories', 'customers', 'inventory',
    'transactions', 'payments', 'notifications', 'settings'
  ];
  
  // Generate components based on service name for consistency
  const serviceSpecificComponents = serviceName.includes('users') 
    ? ['users', 'profiles', 'sessions', 'permissions']
    : serviceName.includes('products')
    ? ['products', 'categories', 'inventory', 'orders']
    : serviceName.includes('analytics')
    ? ['analytics', 'reports', 'metrics', 'logs']
    : tableComponents.slice(0, 6 + Math.floor(Math.random() * 4));

  return [...baseComponents, ...serviceSpecificComponents].sort();
};

// ============================================================================
// MOCK DATA STORAGE
// ============================================================================

/**
 * In-memory storage for scheduler tasks during testing
 */
let mockSchedulerTasks: Map<number, SchedulerTask> = new Map();
let nextTaskId = 1;

/**
 * Initialize mock data
 */
const initializeMockData = (): void => {
  if (mockSchedulerTasks.size === 0) {
    // Generate initial set of tasks
    for (let i = 1; i <= 12; i++) {
      const task = generateMockSchedulerTask(i);
      mockSchedulerTasks.set(i, task);
      nextTaskId = Math.max(nextTaskId, i + 1);
    }
  }
};

/**
 * Get all tasks with optional filtering
 */
const getAllTasks = (params: URLSearchParams): SchedulerTask[] => {
  initializeMockData();
  
  let tasks = Array.from(mockSchedulerTasks.values());
  
  // Apply filters
  const isActive = params.get('filter');
  if (isActive) {
    // Parse filter query like "isActive=true"
    if (isActive.includes('isActive=true')) {
      tasks = tasks.filter(task => task.isActive);
    } else if (isActive.includes('isActive=false')) {
      tasks = tasks.filter(task => !task.isActive);
    }
  }
  
  // Apply search
  const search = params.get('search');
  if (search) {
    const searchLower = search.toLowerCase();
    tasks = tasks.filter(task => 
      task.name.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      task.component.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply sorting
  const sortBy = params.get('order') || 'id';
  const sortDirection = params.get('direction') || 'asc';
  
  tasks.sort((a, b) => {
    let aVal: any = a[sortBy as keyof SchedulerTask];
    let bVal: any = b[sortBy as keyof SchedulerTask];
    
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  return tasks;
};

/**
 * Apply pagination to tasks
 */
const paginateTasks = (tasks: SchedulerTask[], params: URLSearchParams): {
  paginatedTasks: SchedulerTask[];
  meta: { count: number; limit: number; offset: number };
} => {
  const limit = parseInt(params.get('limit') || '25', 10);
  const offset = parseInt(params.get('offset') || '0', 10);
  
  const paginatedTasks = tasks.slice(offset, offset + limit);
  
  return {
    paginatedTasks,
    meta: {
      count: tasks.length,
      limit,
      offset
    }
  };
};

// ============================================================================
// MSW HANDLERS
// ============================================================================

/**
 * GET /api/v2/system/task - List scheduler tasks
 */
const getSchedulerTasks = http.get('/api/v2/system/task', async ({ request }) => {
  // Simulate network latency
  await delay(150 + Math.random() * 100);
  
  const url = new URL(request.url);
  const params = url.searchParams;
  
  // Check for test scenarios
  const scenario = params.get('test_scenario') as SchedulerTestScenario;
  
  if (scenario === 'network_error') {
    return new HttpResponse(null, { status: 0 }); // Network error
  }
  
  if (scenario === 'server_error') {
    await delay(2000); // Simulate timeout
    return HttpResponse.json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error occurred',
        status_code: 500
      }
    }, { status: 500 });
  }
  
  if (scenario === 'task_list_empty') {
    return HttpResponse.json({
      resource: [],
      meta: { count: 0, limit: 25, offset: 0 }
    });
  }
  
  try {
    const allTasks = getAllTasks(params);
    const { paginatedTasks, meta } = paginateTasks(allTasks, params);
    
    // Check if related fields are requested
    const fields = params.get('fields');
    const related = params.get('related');
    const includeCount = params.get('include_count') === 'true';
    
    // Transform tasks to match DreamFactory response format
    const transformedTasks = paginatedTasks.map(task => ({
      ...task,
      // Include related data based on related parameter
      ...(related?.includes('task_log_by_task_id') && task.taskLogByTaskId && {
        taskLogByTaskId: task.taskLogByTaskId
      }),
      ...(related?.includes('service_by_service_id') && {
        serviceByServiceId: task.serviceByServiceId
      })
    }));
    
    const response: TaskListResponse = {
      resource: transformedTasks,
      meta: includeCount ? meta : { count: meta.count, limit: meta.limit, offset: meta.offset }
    };
    
    return HttpResponse.json(response);
    
  } catch (error) {
    return HttpResponse.json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid request parameters',
        status_code: 400
      }
    }, { status: 400 });
  }
});

/**
 * GET /api/v2/system/task/{id} - Get single scheduler task
 */
const getSchedulerTask = http.get('/api/v2/system/task/:id', async ({ params, request }) => {
  await delay(100 + Math.random() * 50);
  
  const taskId = parseInt(params.id as string, 10);
  const url = new URL(request.url);
  const urlParams = url.searchParams;
  
  // Check for test scenarios
  const scenario = urlParams.get('test_scenario') as SchedulerTestScenario;
  
  if (scenario === 'task_update_not_found' || !mockSchedulerTasks.has(taskId)) {
    return HttpResponse.json({
      error: {
        code: 'NOT_FOUND',
        message: `Scheduler task with ID ${taskId} not found`,
        status_code: 404
      }
    }, { status: 404 });
  }
  
  const task = mockSchedulerTasks.get(taskId)!;
  const related = urlParams.get('related');
  
  // Include related data based on related parameter
  const responseTask = {
    ...task,
    ...(related?.includes('task_log_by_task_id') && task.taskLogByTaskId && {
      taskLogByTaskId: task.taskLogByTaskId
    }),
    ...(related?.includes('service_by_service_id') && {
      serviceByServiceId: task.serviceByServiceId
    })
  };
  
  return HttpResponse.json(responseTask);
});

/**
 * POST /api/v2/system/task - Create scheduler task
 */
const createSchedulerTask = http.post('/api/v2/system/task', async ({ request }) => {
  await delay(200 + Math.random() * 150);
  
  const url = new URL(request.url);
  const params = url.searchParams;
  const scenario = params.get('test_scenario') as SchedulerTestScenario;
  
  if (scenario === 'task_creation_validation_error') {
    return HttpResponse.json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        status_code: 422,
        context: {
          resource: [{
            message: 'Task name is required and must be unique'
          }]
        }
      }
    }, { status: 422 });
  }
  
  try {
    const body = await request.json() as { resource: CreateSchedulePayload[] };
    const taskData = body.resource[0];
    
    // Validate required fields
    if (!taskData.name || !taskData.serviceId || !taskData.component || !taskData.verb) {
      return HttpResponse.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          status_code: 422,
          context: {
            resource: [{
              message: 'Name, service, component, and verb are required'
            }]
          }
        }
      }, { status: 422 });
    }
    
    // Create new task
    const newTask: SchedulerTask = {
      id: nextTaskId++,
      name: taskData.name,
      description: taskData.description,
      isActive: taskData.isActive,
      serviceId: taskData.serviceId,
      component: taskData.component,
      frequency: taskData.frequency,
      payload: taskData.payload,
      verb: taskData.verb,
      verbMask: taskData.verbMask,
      createdDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString(),
      createdById: 1, // Mock admin user ID
      lastModifiedById: null,
      taskLogByTaskId: null,
      serviceByServiceId: taskData.service as Service
    };
    
    mockSchedulerTasks.set(newTask.id, newTask);
    
    // Check if related fields are requested
    const related = params.get('related');
    const responseTask = {
      ...newTask,
      ...(related?.includes('task_log_by_task_id') && newTask.taskLogByTaskId && {
        taskLogByTaskId: newTask.taskLogByTaskId
      }),
      ...(related?.includes('service_by_service_id') && {
        serviceByServiceId: newTask.serviceByServiceId
      })
    };
    
    return HttpResponse.json({
      resource: [responseTask]
    }, { status: 201 });
    
  } catch (error) {
    return HttpResponse.json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid JSON payload',
        status_code: 400
      }
    }, { status: 400 });
  }
});

/**
 * PUT /api/v2/system/task/{id} - Update scheduler task
 */
const updateSchedulerTask = http.put('/api/v2/system/task/:id', async ({ params, request }) => {
  await delay(200 + Math.random() * 150);
  
  const taskId = parseInt(params.id as string, 10);
  const url = new URL(request.url);
  const urlParams = url.searchParams;
  const scenario = urlParams.get('test_scenario') as SchedulerTestScenario;
  
  if (scenario === 'task_update_not_found' || !mockSchedulerTasks.has(taskId)) {
    return HttpResponse.json({
      error: {
        code: 'NOT_FOUND',
        message: `Scheduler task with ID ${taskId} not found`,
        status_code: 404
      }
    }, { status: 404 });
  }
  
  try {
    const updateData = await request.json() as UpdateSchedulePayload;
    const existingTask = mockSchedulerTasks.get(taskId)!;
    
    // Update task
    const updatedTask: SchedulerTask = {
      ...existingTask,
      name: updateData.name || existingTask.name,
      description: updateData.description !== undefined ? updateData.description : existingTask.description,
      isActive: updateData.isActive !== undefined ? updateData.isActive : existingTask.isActive,
      serviceId: updateData.serviceId || existingTask.serviceId,
      component: updateData.component || existingTask.component,
      frequency: updateData.frequency || existingTask.frequency,
      payload: updateData.payload !== undefined ? updateData.payload : existingTask.payload,
      verb: updateData.verb || existingTask.verb,
      verbMask: updateData.verbMask || existingTask.verbMask,
      lastModifiedDate: new Date().toISOString(),
      lastModifiedById: 1,
      serviceByServiceId: updateData.service ? updateData.service as Service : existingTask.serviceByServiceId
    };
    
    mockSchedulerTasks.set(taskId, updatedTask);
    
    // Check if related fields are requested
    const related = urlParams.get('related');
    const responseTask = {
      ...updatedTask,
      ...(related?.includes('task_log_by_task_id') && updatedTask.taskLogByTaskId && {
        taskLogByTaskId: updatedTask.taskLogByTaskId
      }),
      ...(related?.includes('service_by_service_id') && {
        serviceByServiceId: updatedTask.serviceByServiceId
      })
    };
    
    return HttpResponse.json(responseTask);
    
  } catch (error) {
    return HttpResponse.json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid JSON payload',
        status_code: 400
      }
    }, { status: 400 });
  }
});

/**
 * DELETE /api/v2/system/task/{id} - Delete scheduler task
 */
const deleteSchedulerTask = http.delete('/api/v2/system/task/:id', async ({ params, request }) => {
  await delay(150 + Math.random() * 100);
  
  const taskId = parseInt(params.id as string, 10);
  const url = new URL(request.url);
  const urlParams = url.searchParams;
  const scenario = urlParams.get('test_scenario') as SchedulerTestScenario;
  
  if (scenario === 'task_deletion_not_found' || !mockSchedulerTasks.has(taskId)) {
    return HttpResponse.json({
      error: {
        code: 'NOT_FOUND',
        message: `Scheduler task with ID ${taskId} not found`,
        status_code: 404
      }
    }, { status: 404 });
  }
  
  const deletedTask = mockSchedulerTasks.get(taskId)!;
  mockSchedulerTasks.delete(taskId);
  
  return HttpResponse.json({
    id: taskId,
    name: deletedTask.name
  }, { status: 200 });
});

/**
 * GET /api/v2/{serviceName}?as_access_list=true - Get service components
 */
const getServiceComponents = http.get('/api/v2/:serviceName', async ({ params, request }) => {
  await delay(100 + Math.random() * 75);
  
  const serviceName = params.serviceName as string;
  const url = new URL(request.url);
  const urlParams = url.searchParams;
  
  // Only handle access list requests
  if (urlParams.get('as_access_list') !== 'true') {
    return new HttpResponse(null, { status: 404 });
  }
  
  const scenario = urlParams.get('test_scenario') as SchedulerTestScenario;
  
  if (scenario === 'service_components_error') {
    return HttpResponse.json({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable',
        status_code: 503
      }
    }, { status: 503 });
  }
  
  // Skip certain system endpoints
  if (serviceName === 'system' || serviceName === 'user') {
    return new HttpResponse(null, { status: 404 });
  }
  
  const components = generateServiceComponents(serviceName);
  
  return HttpResponse.json({
    resource: components
  });
});

/**
 * GET /api/v2/system/service - Get services list for dropdown
 */
const getServicesList = http.get('/api/v2/system/service', async ({ request }) => {
  await delay(120 + Math.random() * 80);
  
  const url = new URL(request.url);
  const params = url.searchParams;
  
  // Generate mock services
  const services: Service[] = [
    generateMockService(1, 'users_db', 'mysql'),
    generateMockService(2, 'products_db', 'pgsql'),
    generateMockService(3, 'analytics_db', 'mongodb'),
    generateMockService(4, 'files_service', 'rest'),
    generateMockService(5, 'email_service', 'smtp')
  ].filter(service => service.isActive); // Only return active services
  
  return HttpResponse.json({
    resource: services
  });
});

/**
 * POST /api/v2/system/task/execute/{id} - Execute scheduler task immediately (optional)
 */
const executeSchedulerTask = http.post('/api/v2/system/task/execute/:id', async ({ params, request }) => {
  await delay(500 + Math.random() * 1000); // Simulate execution time
  
  const taskId = parseInt(params.id as string, 10);
  const url = new URL(request.url);
  const urlParams = url.searchParams;
  const scenario = urlParams.get('test_scenario') as SchedulerTestScenario;
  
  if (!mockSchedulerTasks.has(taskId)) {
    return HttpResponse.json({
      error: {
        code: 'NOT_FOUND',
        message: `Scheduler task with ID ${taskId} not found`,
        status_code: 404
      }
    }, { status: 404 });
  }
  
  const task = mockSchedulerTasks.get(taskId)!;
  
  if (scenario === 'task_execution_failure') {
    // Create error log entry
    const errorLog = generateMockTaskLog(taskId, 500);
    task.taskLogByTaskId = errorLog;
    mockSchedulerTasks.set(taskId, task);
    
    return HttpResponse.json({
      success: false,
      message: 'Task execution failed',
      log: errorLog
    });
  }
  
  // Create success log entry
  const successLog = generateMockTaskLog(taskId, 200);
  task.taskLogByTaskId = successLog;
  mockSchedulerTasks.set(taskId, task);
  
  return HttpResponse.json({
    success: true,
    message: 'Task executed successfully',
    log: successLog
  });
});

// ============================================================================
// EXPORTED HANDLERS
// ============================================================================

/**
 * All scheduler-related MSW handlers
 */
export const schedulerHandlers = [
  getSchedulerTasks,
  getSchedulerTask,
  createSchedulerTask,
  updateSchedulerTask,
  deleteSchedulerTask,
  getServiceComponents,
  getServicesList,
  executeSchedulerTask
];

/**
 * Default export for convenience
 */
export default schedulerHandlers;

/**
 * Named exports for specific handler groups
 */
export const schedulerCrudHandlers = [
  getSchedulerTasks,
  getSchedulerTask,
  createSchedulerTask,
  updateSchedulerTask,
  deleteSchedulerTask
];

export const schedulerServiceHandlers = [
  getServiceComponents,
  getServicesList
];

export const schedulerExecutionHandlers = [
  executeSchedulerTask
];

/**
 * Test scenario helpers for automated testing
 */
export const schedulerTestScenarios = {
  /**
   * Reset mock data to initial state
   */
  resetMockData: (): void => {
    mockSchedulerTasks.clear();
    nextTaskId = 1;
    initializeMockData();
  },
  
  /**
   * Add custom mock task for testing
   */
  addMockTask: (task: Partial<SchedulerTask>): SchedulerTask => {
    const mockTask = generateMockSchedulerTask(nextTaskId++, task);
    mockSchedulerTasks.set(mockTask.id, mockTask);
    return mockTask;
  },
  
  /**
   * Get current mock task count
   */
  getTaskCount: (): number => mockSchedulerTasks.size,
  
  /**
   * Clear all mock tasks
   */
  clearAllTasks: (): void => {
    mockSchedulerTasks.clear();
  }
};

/**
 * Utility functions for MSW testing
 */
export const schedulerMockUtils = {
  generateMockSchedulerTask,
  generateMockTaskLog,
  generateMockService,
  generateServiceComponents,
  getVerbMask
};