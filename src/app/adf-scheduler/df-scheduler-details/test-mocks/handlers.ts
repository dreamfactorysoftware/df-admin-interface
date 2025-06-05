/**
 * @fileoverview Mock Service Worker (MSW) request handlers for scheduler CRUD operations
 * @description Provides realistic API mocking during development and testing for scheduler functionality
 * 
 * This file exports HTTP request handlers that intercept and mock all scheduler-related API calls
 * including task creation, reading, updating, deletion, and task log retrieval. The handlers simulate
 * the DreamFactory Core API endpoints for scheduler functionality with proper response formats,
 * error conditions, and realistic latency.
 * 
 * Features:
 * - MSW handlers intercept scheduler API calls for isolated frontend testing per Section 7.1.1
 * - Response formats match existing DreamFactory Core API v2 specifications
 * - Error scenarios cover all edge cases for robust error handling testing
 * - Handlers support both development environment and Vitest test execution contexts
 * - Includes delay simulation for realistic network latency during development testing
 * - Integrates with scheduler task log endpoints for comprehensive workflow testing coverage
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 * @author DreamFactory Team
 * @license MIT
 */

import { rest } from 'msw';
import type {
  ApiListResponse,
  ApiResourceResponse,
  ApiErrorResponse,
  ApiSuccessResponse,
} from '../../../../types/api';
import type { Service } from '../../../../types/service';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Scheduler task data structure based on DreamFactory Core API v2 specification
 * Maintains compatibility with existing Angular component data patterns
 */
export interface SchedulerTaskData {
  /** Task ID (auto-generated) */
  id: number;
  /** Task name (required, unique) */
  name: string;
  /** Task description (optional) */
  description: string | null;
  /** Whether the task is active */
  isActive: boolean;
  /** Associated service ID */
  serviceId: number;
  /** Component/resource path */
  component: string;
  /** HTTP verb for the task */
  verb: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Bitmask representation of HTTP verb */
  verbMask: number;
  /** Execution frequency in seconds */
  frequency: number;
  /** JSON payload for non-GET requests */
  payload: string | null;
  /** Task creation timestamp */
  createdDate: string;
  /** Last modification timestamp */
  lastModifiedDate: string;
  /** Creator user ID */
  createdById: number;
  /** Last modifier user ID */
  lastModifiedById: number | null;
  /** Associated service details */
  serviceByServiceId: Service;
  /** Task execution log (if available) */
  taskLogByTaskId: SchedulerTaskLog | null;
}

/**
 * Scheduler task log structure for execution history
 */
export interface SchedulerTaskLog {
  /** Associated task ID */
  taskId: number;
  /** HTTP status code from last execution */
  statusCode: number;
  /** Execution log content/output */
  content: string;
  /** Log creation timestamp */
  createdDate: string;
  /** Log modification timestamp */
  lastModifiedDate: string;
}

/**
 * Create scheduler task payload structure
 */
export interface CreateSchedulerTaskPayload {
  /** Task name */
  name: string;
  /** Task description */
  description?: string | null;
  /** Active status */
  isActive: boolean;
  /** Service ID */
  serviceId: number;
  /** Component path */
  component: string;
  /** HTTP verb */
  verb: string;
  /** Execution frequency */
  frequency: number;
  /** JSON payload */
  payload?: string | null;
  /** Service details */
  service?: {
    id: number;
    name: string;
    label: string;
    description: string;
    type: string;
    components: string[];
  };
  /** Service name */
  serviceName?: string;
  /** Verb mask */
  verbMask?: number;
}

/**
 * Update scheduler task payload structure
 */
export interface UpdateSchedulerTaskPayload extends CreateSchedulerTaskPayload {
  /** Task ID */
  id: number;
  /** Creation timestamp */
  createdDate: string;
  /** Creator ID */
  createdById: number;
  /** Modification timestamp */
  lastModifiedDate: string;
  /** Modifier ID */
  lastModifiedById: number | null;
  /** Whether task has execution log */
  hasLog: boolean;
}

// ============================================================================
// MOCK DATA REPOSITORY
// ============================================================================

/**
 * Mock services available for scheduler task assignment
 * Represents realistic service configurations
 */
const mockServices: Service[] = [
  {
    id: 2,
    name: 'api_docs',
    label: 'Live API Docs',
    description: 'API documenting and testing service.',
    active: true,
    type: 'swagger',
    config: {},
    created_date: '2023-08-04T21:10:07.000000Z',
    last_modified_date: '2023-08-04T21:10:07.000000Z',
    created_by_id: null,
    last_modified_by_id: null,
  },
  {
    id: 5,
    name: 'db',
    label: 'Local SQL Database',
    description: 'Service for accessing local SQLite database.',
    active: true,
    type: 'sqlite',
    config: {
      service_id: 5,
      database: 'db.sqlite',
      allow_upsert: false,
      max_records: 1000,
      cache_enabled: false,
      cache_ttl: 0,
    },
    created_date: '2023-08-04T21:10:07.000000Z',
    last_modified_date: '2023-08-21T13:46:25.000000Z',
    created_by_id: null,
    last_modified_by_id: 1,
  },
  {
    id: 6,
    name: 'email',
    label: 'Local Email Service',
    description: 'Email service used for sending user invites and/or password reset confirmation.',
    active: true,
    type: 'local_email',
    config: {
      parameters: [],
    },
    created_date: '2023-08-04T21:10:07.000000Z',
    last_modified_date: '2023-08-04T21:10:07.000000Z',
    created_by_id: null,
    last_modified_by_id: null,
  },
  {
    id: 7,
    name: 'file',
    label: 'Local File Storage',
    description: 'Service for managing local file storage operations.',
    active: true,
    type: 'file',
    config: {
      container: 'app',
      public_path: '/storage/app',
    },
    created_date: '2023-08-04T21:10:07.000000Z',
    last_modified_date: '2023-08-04T21:10:07.000000Z',
    created_by_id: null,
    last_modified_by_id: null,
  },
];

/**
 * Mock scheduler tasks repository
 * Provides realistic task configurations for testing
 */
let mockSchedulerTasks: SchedulerTaskData[] = [
  {
    id: 1,
    name: 'daily_cleanup',
    description: 'Daily database cleanup task',
    isActive: true,
    serviceId: 5,
    component: '_proc/cleanup',
    verb: 'POST',
    verbMask: 2,
    frequency: 86400, // 24 hours
    payload: JSON.stringify({ action: 'cleanup', tables: ['logs', 'temp'] }),
    createdDate: '2023-08-30T10:00:00.000000Z',
    lastModifiedDate: '2023-08-30T10:00:00.000000Z',
    createdById: 1,
    lastModifiedById: 1,
    serviceByServiceId: mockServices[1],
    taskLogByTaskId: {
      taskId: 1,
      statusCode: 200,
      content: 'Task executed successfully. Cleanup completed for 150 records.',
      createdDate: '2023-08-30T10:01:00.000000Z',
      lastModifiedDate: '2023-08-30T10:01:00.000000Z',
    },
  },
  {
    id: 2,
    name: 'api_health_check',
    description: 'Periodic API health monitoring',
    isActive: true,
    serviceId: 2,
    component: 'health',
    verb: 'GET',
    verbMask: 1,
    frequency: 300, // 5 minutes
    payload: null,
    createdDate: '2023-08-30T11:00:00.000000Z',
    lastModifiedDate: '2023-08-30T14:30:00.000000Z',
    createdById: 1,
    lastModifiedById: 1,
    serviceByServiceId: mockServices[0],
    taskLogByTaskId: {
      taskId: 2,
      statusCode: 200,
      content: 'Health check passed. All endpoints responding normally.',
      createdDate: '2023-08-30T14:35:00.000000Z',
      lastModifiedDate: '2023-08-30T14:35:00.000000Z',
    },
  },
  {
    id: 3,
    name: 'failed_email_retry',
    description: 'Retry failed email deliveries',
    isActive: false,
    serviceId: 6,
    component: 'retry_failed',
    verb: 'POST',
    verbMask: 2,
    frequency: 1800, // 30 minutes
    payload: JSON.stringify({ retry_attempts: 3, max_age_hours: 24 }),
    createdDate: '2023-08-30T12:00:00.000000Z',
    lastModifiedDate: '2023-08-30T15:45:00.000000Z',
    createdById: 1,
    lastModifiedById: 1,
    serviceByServiceId: mockServices[2],
    taskLogByTaskId: {
      taskId: 3,
      statusCode: 500,
      content: 'Error: SMTP connection failed. Unable to retry emails at this time.',
      createdDate: '2023-08-30T15:50:00.000000Z',
      lastModifiedDate: '2023-08-30T15:50:00.000000Z',
    },
  },
];

/**
 * Mock service access components for different service types
 * Simulates the access_list endpoint responses
 */
const mockServiceComponents: Record<string, string[]> = {
  db: ['_table', '_schema', '_proc', 'users', 'contacts', 'orders', 'products'],
  api_docs: ['health', 'swagger', 'openapi', 'docs'],
  email: ['send', 'template', 'queue', 'retry_failed'],
  file: ['container', 'folder', 'upload', 'download', 'delete'],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate realistic delay for API responses
 * Simulates network latency for development testing
 */
const generateDelay = (): number => {
  return Math.random() * 500 + 100; // 100-600ms delay
};

/**
 * Generate DreamFactory Core API v2 compatible timestamp
 */
const generateTimestamp = (): string => {
  return new Date().toISOString().replace('T', 'T').replace(/\.\d{3}Z$/, '.000000Z');
};

/**
 * Convert HTTP verb to bitmask value
 */
const getVerbMask = (verb: string): number => {
  const verbMasks: Record<string, number> = {
    GET: 1,
    POST: 2,
    PUT: 4,
    PATCH: 8,
    DELETE: 16,
  };
  return verbMasks[verb.toUpperCase()] || 1;
};

/**
 * Generate unique task ID
 */
let nextTaskId = 100;
const generateTaskId = (): number => {
  return ++nextTaskId;
};

/**
 * Validate scheduler task payload
 */
const validateTaskPayload = (payload: CreateSchedulerTaskPayload): string[] => {
  const errors: string[] = [];

  if (!payload.name || payload.name.trim().length === 0) {
    errors.push('Task name is required');
  }

  if (payload.name && payload.name.length > 255) {
    errors.push('Task name cannot exceed 255 characters');
  }

  if (!payload.serviceId) {
    errors.push('Service ID is required');
  }

  if (!payload.component || payload.component.trim().length === 0) {
    errors.push('Component is required');
  }

  if (!payload.verb) {
    errors.push('HTTP verb is required');
  }

  if (payload.frequency && (payload.frequency < 60 || payload.frequency > 2592000)) {
    errors.push('Frequency must be between 60 seconds and 30 days');
  }

  if (payload.payload && payload.verb === 'GET') {
    errors.push('Payload is not allowed for GET requests');
  }

  if (payload.payload && !payload.payload.trim().startsWith('{')) {
    try {
      JSON.parse(payload.payload);
    } catch {
      errors.push('Payload must be valid JSON');
    }
  }

  // Check for duplicate names
  const existingTask = mockSchedulerTasks.find(
    task => task.name.toLowerCase() === payload.name.toLowerCase()
  );
  if (existingTask) {
    errors.push('Task name must be unique');
  }

  return errors;
};

/**
 * Validate update task payload
 */
const validateUpdateTaskPayload = (
  taskId: number,
  payload: UpdateSchedulerTaskPayload
): string[] => {
  const errors: string[] = [];

  if (!payload.name || payload.name.trim().length === 0) {
    errors.push('Task name is required');
  }

  if (payload.name && payload.name.length > 255) {
    errors.push('Task name cannot exceed 255 characters');
  }

  if (!payload.serviceId) {
    errors.push('Service ID is required');
  }

  if (!payload.component || payload.component.trim().length === 0) {
    errors.push('Component is required');
  }

  if (!payload.verb) {
    errors.push('HTTP verb is required');
  }

  if (payload.frequency && (payload.frequency < 60 || payload.frequency > 2592000)) {
    errors.push('Frequency must be between 60 seconds and 30 days');
  }

  if (payload.payload && payload.verb === 'GET') {
    errors.push('Payload is not allowed for GET requests');
  }

  if (payload.payload && !payload.payload.trim().startsWith('{')) {
    try {
      JSON.parse(payload.payload);
    } catch {
      errors.push('Payload must be valid JSON');
    }
  }

  // Check for duplicate names (excluding current task)
  const existingTask = mockSchedulerTasks.find(
    task => task.name.toLowerCase() === payload.name.toLowerCase() && task.id !== taskId
  );
  if (existingTask) {
    errors.push('Task name must be unique');
  }

  return errors;
};

/**
 * Find service by ID
 */
const findServiceById = (serviceId: number): Service | undefined => {
  return mockServices.find(service => service.id === serviceId);
};

/**
 * Create task from payload
 */
const createTaskFromPayload = (payload: CreateSchedulerTaskPayload): SchedulerTaskData => {
  const service = findServiceById(payload.serviceId);
  if (!service) {
    throw new Error(`Service with ID ${payload.serviceId} not found`);
  }

  const now = generateTimestamp();
  const taskId = generateTaskId();

  return {
    id: taskId,
    name: payload.name,
    description: payload.description || null,
    isActive: payload.isActive,
    serviceId: payload.serviceId,
    component: payload.component,
    verb: payload.verb.toUpperCase() as any,
    verbMask: getVerbMask(payload.verb),
    frequency: payload.frequency,
    payload: payload.payload || null,
    createdDate: now,
    lastModifiedDate: now,
    createdById: 1, // Mock user ID
    lastModifiedById: 1,
    serviceByServiceId: service,
    taskLogByTaskId: null,
  };
};

// ============================================================================
// MSW REQUEST HANDLERS
// ============================================================================

/**
 * MSW request handlers for scheduler CRUD operations
 * Supports all DreamFactory Core API v2 endpoints with realistic responses
 */
export const schedulerHandlers = [
  // -------------------------------------------------------------------------
  // GET /api/v2/system/scheduler - List all scheduler tasks
  // -------------------------------------------------------------------------
  rest.get('/api/v2/system/scheduler', async (req, res, ctx) => {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '25');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const filter = url.searchParams.get('filter');
    const fields = url.searchParams.get('fields');
    const related = url.searchParams.get('related');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, generateDelay()));

    try {
      let filteredTasks = [...mockSchedulerTasks];

      // Apply filtering if specified
      if (filter) {
        const filterLower = filter.toLowerCase();
        filteredTasks = filteredTasks.filter(task =>
          task.name.toLowerCase().includes(filterLower) ||
          (task.description && task.description.toLowerCase().includes(filterLower))
        );
      }

      // Apply pagination
      const paginatedTasks = filteredTasks.slice(offset, offset + limit);

      // Handle field selection
      let responseTasks = paginatedTasks;
      if (fields && fields !== '*') {
        const selectedFields = fields.split(',');
        responseTasks = paginatedTasks.map(task => {
          const filteredTask: any = {};
          selectedFields.forEach(field => {
            if (field.trim() in task) {
              filteredTask[field.trim()] = (task as any)[field.trim()];
            }
          });
          return filteredTask;
        });
      }

      // Handle related data inclusion
      if (related && related.includes('task_log_by_task_id')) {
        responseTasks = responseTasks.map(task => ({
          ...task,
          taskLogByTaskId: task.taskLogByTaskId,
        }));
      }

      const response: ApiListResponse<SchedulerTaskData> = {
        resource: responseTasks,
        meta: {
          count: filteredTasks.length,
          offset,
          limit,
          has_next: offset + limit < filteredTasks.length,
          has_previous: offset > 0,
          page_count: Math.ceil(filteredTasks.length / limit),
        },
        timestamp: generateTimestamp(),
        request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
      };

      return res(ctx.status(200), ctx.json(response));
    } catch (error) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error occurred while fetching scheduler tasks',
          status_code: 500,
          context: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: generateTimestamp(),
        request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
      };

      return res(ctx.status(500), ctx.json(errorResponse));
    }
  }),

  // -------------------------------------------------------------------------
  // GET /api/v2/system/scheduler/{id} - Get specific scheduler task
  // -------------------------------------------------------------------------
  rest.get('/api/v2/system/scheduler/:id', async (req, res, ctx) => {
    const { id } = req.params;
    const taskId = parseInt(id as string);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, generateDelay()));

    const task = mockSchedulerTasks.find(t => t.id === taskId);

    if (!task) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Scheduler task with ID ${taskId} not found`,
          status_code: 404,
        },
        timestamp: generateTimestamp(),
        request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
      };

      return res(ctx.status(404), ctx.json(errorResponse));
    }

    const response: ApiResourceResponse<SchedulerTaskData> = {
      resource: task,
      timestamp: generateTimestamp(),
      request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
    };

    return res(ctx.status(200), ctx.json(response));
  }),

  // -------------------------------------------------------------------------
  // POST /api/v2/system/scheduler - Create new scheduler task
  // -------------------------------------------------------------------------
  rest.post('/api/v2/system/scheduler', async (req, res, ctx) => {
    try {
      const body = await req.json();
      
      // Handle both single resource and bulk resource creation
      const resource = body.resource || [body];
      
      if (!Array.isArray(resource) || resource.length === 0) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Request must contain resource array or single resource',
            status_code: 400,
          },
          timestamp: generateTimestamp(),
          request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
        };

        return res(ctx.status(400), ctx.json(errorResponse));
      }

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, generateDelay()));

      // Validate and create tasks
      const createdTasks: SchedulerTaskData[] = [];
      const errors: any[] = [];

      for (let i = 0; i < resource.length; i++) {
        const payload = resource[i] as CreateSchedulerTaskPayload;
        const validationErrors = validateTaskPayload(payload);

        if (validationErrors.length > 0) {
          errors.push({
            index: i,
            errors: validationErrors,
          });
          continue;
        }

        try {
          const newTask = createTaskFromPayload(payload);
          mockSchedulerTasks.push(newTask);
          createdTasks.push(newTask);
        } catch (error) {
          errors.push({
            index: i,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
          });
        }
      }

      if (errors.length > 0 && createdTasks.length === 0) {
        // All tasks failed validation
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Validation failed for scheduler task creation',
            status_code: 422,
            context: {
              resource: errors,
            },
          },
          timestamp: generateTimestamp(),
          request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
        };

        return res(ctx.status(422), ctx.json(errorResponse));
      }

      // Return created tasks
      const response: ApiListResponse<SchedulerTaskData> = {
        resource: createdTasks,
        meta: {
          count: createdTasks.length,
          offset: 0,
          limit: createdTasks.length,
          success_count: createdTasks.length,
          error_count: errors.length,
        },
        timestamp: generateTimestamp(),
        request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
      };

      return res(ctx.status(201), ctx.json(response));

    } catch (error) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error occurred during task creation',
          status_code: 500,
          context: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: generateTimestamp(),
        request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
      };

      return res(ctx.status(500), ctx.json(errorResponse));
    }
  }),

  // -------------------------------------------------------------------------
  // PUT /api/v2/system/scheduler/{id} - Update scheduler task
  // -------------------------------------------------------------------------
  rest.put('/api/v2/system/scheduler/:id', async (req, res, ctx) => {
    const { id } = req.params;
    const taskId = parseInt(id as string);

    try {
      const payload = await req.json() as UpdateSchedulerTaskPayload;

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, generateDelay()));

      const taskIndex = mockSchedulerTasks.findIndex(t => t.id === taskId);

      if (taskIndex === -1) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Scheduler task with ID ${taskId} not found`,
            status_code: 404,
          },
          timestamp: generateTimestamp(),
          request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
        };

        return res(ctx.status(404), ctx.json(errorResponse));
      }

      const validationErrors = validateUpdateTaskPayload(taskId, payload);

      if (validationErrors.length > 0) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Validation failed for scheduler task update',
            status_code: 422,
            context: {
              errors: validationErrors,
            },
          },
          timestamp: generateTimestamp(),
          request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
        };

        return res(ctx.status(422), ctx.json(errorResponse));
      }

      const service = findServiceById(payload.serviceId);
      if (!service) {
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Service with ID ${payload.serviceId} not found`,
            status_code: 404,
          },
          timestamp: generateTimestamp(),
          request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
        };

        return res(ctx.status(404), ctx.json(errorResponse));
      }

      // Update the task
      const updatedTask: SchedulerTaskData = {
        ...mockSchedulerTasks[taskIndex],
        name: payload.name,
        description: payload.description || null,
        isActive: payload.isActive,
        serviceId: payload.serviceId,
        component: payload.component,
        verb: payload.verb.toUpperCase() as any,
        verbMask: getVerbMask(payload.verb),
        frequency: payload.frequency,
        payload: payload.payload || null,
        lastModifiedDate: generateTimestamp(),
        lastModifiedById: 1,
        serviceByServiceId: service,
      };

      mockSchedulerTasks[taskIndex] = updatedTask;

      const response: ApiResourceResponse<SchedulerTaskData> = {
        resource: updatedTask,
        timestamp: generateTimestamp(),
        request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
      };

      return res(ctx.status(200), ctx.json(response));

    } catch (error) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error occurred during task update',
          status_code: 500,
          context: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: generateTimestamp(),
        request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
      };

      return res(ctx.status(500), ctx.json(errorResponse));
    }
  }),

  // -------------------------------------------------------------------------
  // DELETE /api/v2/system/scheduler/{id} - Delete scheduler task
  // -------------------------------------------------------------------------
  rest.delete('/api/v2/system/scheduler/:id', async (req, res, ctx) => {
    const { id } = req.params;
    const taskId = parseInt(id as string);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, generateDelay()));

    const taskIndex = mockSchedulerTasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Scheduler task with ID ${taskId} not found`,
          status_code: 404,
        },
        timestamp: generateTimestamp(),
        request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
      };

      return res(ctx.status(404), ctx.json(errorResponse));
    }

    // Remove the task
    mockSchedulerTasks.splice(taskIndex, 1);

    const response: ApiSuccessResponse = {
      success: true,
      message: `Scheduler task with ID ${taskId} has been deleted successfully`,
      timestamp: generateTimestamp(),
      request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
    };

    return res(ctx.status(200), ctx.json(response));
  }),

  // -------------------------------------------------------------------------
  // GET /api/{serviceName} - Get service access list (for component dropdown)
  // -------------------------------------------------------------------------
  rest.get('/api/:serviceName', async (req, res, ctx) => {
    const { serviceName } = req.params;
    const url = new URL(req.url);
    const asAccessList = url.searchParams.get('as_access_list');

    // Only handle access list requests
    if (asAccessList !== 'true') {
      return req.passthrough();
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, generateDelay()));

    const components = mockServiceComponents[serviceName as string];

    if (!components) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Service '${serviceName}' not found or has no accessible components`,
          status_code: 404,
        },
        timestamp: generateTimestamp(),
        request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
      };

      return res(ctx.status(404), ctx.json(errorResponse));
    }

    const response: ApiListResponse<string> = {
      resource: components,
      meta: {
        count: components.length,
        offset: 0,
        limit: components.length,
      },
      timestamp: generateTimestamp(),
      request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
    };

    return res(ctx.status(200), ctx.json(response));
  }),

  // -------------------------------------------------------------------------
  // GET /api/v2/system/service - Get available services (for dropdown)
  // -------------------------------------------------------------------------
  rest.get('/api/v2/system/service', async (req, res, ctx) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, generateDelay()));

    const response: ApiListResponse<Service> = {
      resource: mockServices,
      meta: {
        count: mockServices.length,
        offset: 0,
        limit: mockServices.length,
      },
      timestamp: generateTimestamp(),
      request_id: `req_${Math.random().toString(36).substr(2, 9)}`,
    };

    return res(ctx.status(200), ctx.json(response));
  }),

  // -------------------------------------------------------------------------
  // Error simulation handlers for testing edge cases
  // -------------------------------------------------------------------------

  // Simulate connection timeout
  rest.get('/api/v2/system/scheduler/timeout', async (req, res, ctx) => {
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
    return res(ctx.status(408), ctx.json({
      success: false,
      error: {
        code: 'REQUEST_TIMEOUT',
        message: 'Request timeout occurred',
        status_code: 408,
      },
    }));
  }),

  // Simulate server error
  rest.get('/api/v2/system/scheduler/server-error', async (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error for testing',
        status_code: 500,
      },
    }));
  }),

  // Simulate authentication error
  rest.get('/api/v2/system/scheduler/auth-error', async (req, res, ctx) => {
    return res(ctx.status(401), ctx.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        status_code: 401,
      },
    }));
  }),

  // Simulate permission denied
  rest.get('/api/v2/system/scheduler/forbidden', async (req, res, ctx) => {
    return res(ctx.status(403), ctx.json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions to access scheduler',
        status_code: 403,
      },
    }));
  }),
];

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Default export of all scheduler-related MSW handlers
 * Can be imported and used in test setup or development server
 */
export const handlers = schedulerHandlers;

/**
 * Export individual handler groups for granular usage
 */
export {
  schedulerHandlers,
  mockSchedulerTasks,
  mockServices,
  mockServiceComponents,
};

/**
 * Export mock data for use in component tests
 */
export const mockData = {
  schedulerTasks: mockSchedulerTasks,
  services: mockServices,
  serviceComponents: mockServiceComponents,
};

/**
 * Export utility functions for testing
 */
export const testUtils = {
  generateDelay,
  generateTimestamp,
  getVerbMask,
  validateTaskPayload,
  validateUpdateTaskPayload,
  findServiceById,
  createTaskFromPayload,
};