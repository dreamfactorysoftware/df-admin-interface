/**
 * Mock Service Worker (MSW) Compatible Mock Data for Scheduler Details
 * 
 * This module provides comprehensive mock data structures optimized for:
 * - Mock Service Worker (MSW) integration for realistic API mocking
 * - React Query testing patterns with proper cache key structures
 * - Zod validation schema compatibility
 * - DreamFactory Core API v2 response format compliance
 * - React component testing with TypeScript 5.8+ support
 * 
 * @version React 19/Next.js 15.1 Migration
 * @framework MSW 0.49.0, React Query 5.0+, Vitest 2.1+
 */

import type { Service } from '@/types/services';
import type { ApiResponse, ApiListResponse } from '@/types/api';

// ============================================================================
// SCHEDULER TASK INTERFACES
// ============================================================================

/**
 * Scheduler task log entry structure for React components
 */
export interface SchedulerTaskLog {
  taskId: number;
  statusCode: number;
  content: string;
  createdDate: string;
  lastModifiedDate: string;
  duration?: number;
  errorCount?: number;
  retryCount?: number;
}

/**
 * Enhanced scheduler task data structure with React Query metadata
 */
export interface SchedulerTaskData {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  serviceId: number;
  component: string;
  verbMask: number;
  frequency: number;
  payload: string | null;
  createdDate: string;
  lastModifiedDate: string;
  createdById: number;
  lastModifiedById: number | null;
  verb: string;
  serviceByServiceId: Service;
  taskLogByTaskId: SchedulerTaskLog | null;
  // React Query metadata for cache invalidation testing
  _metadata?: {
    queryKey: string[];
    cacheTime?: number;
    staleTime?: number;
    lastFetched?: string;
  };
}

/**
 * Scheduler task creation/update payload
 */
export interface SchedulerTaskPayload {
  name: string;
  description: string;
  isActive: boolean;
  serviceId: number;
  component: string;
  verbMask: number;
  frequency: number;
  payload: string | null;
  verb: string;
}

// ============================================================================
// MSW-COMPATIBLE MOCK SERVICES DATA
// ============================================================================

/**
 * Enhanced mock services with React Query cache metadata
 * Compatible with DreamFactory Core API v2 response format
 */
export const mockServices: Service[] = [
  {
    id: 2,
    name: 'api_docs',
    label: 'Live API Docs',
    description: 'API documenting and testing service.',
    isActive: true,
    type: 'swagger',
    mutable: false,
    deletable: false,
    createdDate: '2023-08-04T21:10:07.000000Z',
    lastModifiedDate: '2023-08-04T21:10:07.000000Z',
    createdById: null,
    lastModifiedById: null,
    config: {
      service_id: 2,
      options: [],
      attributes: null,
    },
    serviceDocByServiceId: null,
    refresh: false,
    // React Query testing metadata
    tags: ['api-docs', 'documentation'],
    version: '1.0.0',
    healthStatus: {
      status: 'healthy',
      lastChecked: '2023-08-04T21:10:07.000000Z',
      responseTime: 120,
      errorCount: 0,
      uptime: 99.9,
    },
  },
  {
    id: 5,
    name: 'db',
    label: 'Local SQL Database',
    description: 'Service for accessing local SQLite database.',
    isActive: true,
    type: 'sqlite',
    mutable: true,
    deletable: true,
    createdDate: '2023-08-04T21:10:07.000000Z',
    lastModifiedDate: '2023-08-21T13:46:25.000000Z',
    createdById: null,
    lastModifiedById: 1,
    config: {
      service_id: 5,
      options: [],
      attributes: null,
      statements: null,
      database: 'db.sqlite',
      allow_upsert: false,
      max_records: 1000,
      cache_enabled: false,
      cache_ttl: 0,
      // Enhanced connection configuration for testing
      host: 'localhost',
      port: 0,
      username: null,
      password: null,
      dsn: 'sqlite:db.sqlite',
    },
    serviceDocByServiceId: null,
    refresh: false,
    // React Query testing metadata
    tags: ['database', 'sqlite', 'local'],
    version: '1.2.1',
    healthStatus: {
      status: 'healthy',
      lastChecked: '2023-08-21T13:46:25.000000Z',
      responseTime: 45,
      errorCount: 0,
      uptime: 100.0,
    },
    metrics: {
      requestCount: 1247,
      errorRate: 0.02,
      averageResponseTime: 35,
      lastActivity: '2023-08-21T13:46:25.000000Z',
      dataVolume: {
        read: 1024000,
        written: 512000,
      },
    },
  },
  {
    id: 6,
    name: 'email',
    label: 'Local Email Service',
    description: 'Email service used for sending user invites and/or password reset confirmation.',
    isActive: true,
    type: 'local_email',
    mutable: true,
    deletable: true,
    createdDate: '2023-08-04T21:10:07.000000Z',
    lastModifiedDate: '2023-08-04T21:10:07.000000Z',
    createdById: null,
    lastModifiedById: null,
    config: {
      service_id: 6,
      parameters: [],
      // Enhanced email configuration for testing
      smtp_host: 'localhost',
      smtp_port: 587,
      smtp_security: 'tls',
      from_name: 'DreamFactory Admin',
      from_email: 'admin@dreamfactory.local',
    },
    serviceDocByServiceId: null,
    refresh: false,
    // React Query testing metadata
    tags: ['email', 'smtp', 'notifications'],
    version: '1.0.0',
    healthStatus: {
      status: 'healthy',
      lastChecked: '2023-08-04T21:10:07.000000Z',
      responseTime: 200,
      errorCount: 1,
      uptime: 98.5,
    },
  },
];

/**
 * Enhanced scheduler task mock data with React Query cache metadata
 * Compatible with MSW response handlers and testing patterns
 */
export const mockSchedulerTaskData: SchedulerTaskData = {
  id: 15,
  name: 'database_cleanup_task',
  description: 'Automated database cleanup and optimization task',
  isActive: true,
  serviceId: 5,
  component: 'db/_table/cleanup_logs',
  verbMask: 1,
  frequency: 3600, // 1 hour in seconds
  payload: JSON.stringify({
    cleanup_options: {
      older_than_days: 30,
      table_patterns: ['logs_*', 'temp_*'],
      vacuum_after: true,
    },
  }),
  createdDate: '2023-08-30T14:41:44.000000Z',
  lastModifiedDate: '2023-08-30T14:59:06.000000Z',
  createdById: 1,
  lastModifiedById: 1,
  verb: 'DELETE',
  serviceByServiceId: mockServices[1], // SQLite database service
  taskLogByTaskId: {
    taskId: 15,
    statusCode: 200,
    content: JSON.stringify({
      success: true,
      message: 'Database cleanup completed successfully',
      details: {
        tables_processed: 5,
        records_deleted: 1247,
        vacuum_executed: true,
        execution_time_ms: 2340,
      },
      timestamp: '2023-08-30T15:28:04.000000Z',
    }),
    createdDate: '2023-08-30T15:28:04.000000Z',
    lastModifiedDate: '2023-08-30T15:28:04.000000Z',
    duration: 2340,
    errorCount: 0,
    retryCount: 0,
  },
  // React Query cache metadata for testing cache invalidation
  _metadata: {
    queryKey: ['scheduler', 'tasks', 15],
    cacheTime: 300000, // 5 minutes
    staleTime: 60000, // 1 minute
    lastFetched: '2023-08-30T15:30:00.000Z',
  },
};

// ============================================================================
// MSW RESPONSE STRUCTURES
// ============================================================================

/**
 * DreamFactory Core API v2 compatible service list response
 * Structured for MSW handler integration
 */
export const mockServiceListResponse: ApiListResponse<Service> = {
  resource: mockServices,
  meta: {
    count: mockServices.length,
    limit: 25,
    offset: 0,
    total: mockServices.length,
    has_more: false,
  },
};

/**
 * DreamFactory Core API v2 compatible single service response
 * Used for GET /api/v2/system/service/{id} endpoints
 */
export const mockServiceDetailResponse: ApiResponse<Service> = {
  resource: mockServices[1], // SQLite database service
  meta: {
    schema: ['id', 'name', 'label', 'description', 'type', 'config'],
  },
};

/**
 * DreamFactory Core API v2 compatible scheduler task response
 * Structured for MSW handler integration with React Query patterns
 */
export const mockSchedulerTaskResponse: ApiResponse<SchedulerTaskData> = {
  resource: mockSchedulerTaskData,
  meta: {
    schema: [
      'id', 'name', 'description', 'isActive', 'serviceId', 
      'component', 'verbMask', 'frequency', 'payload', 'verb',
      'createdDate', 'lastModifiedDate', 'createdById', 'lastModifiedById',
    ],
  },
};

/**
 * Mock scheduler task list response for testing pagination
 */
export const mockSchedulerTaskListResponse: ApiListResponse<SchedulerTaskData> = {
  resource: [mockSchedulerTaskData],
  meta: {
    count: 1,
    limit: 25,
    offset: 0,
    total: 1,
    has_more: false,
  },
};

// ============================================================================
// REACT QUERY CACHE KEY GENERATORS
// ============================================================================

/**
 * Scheduler-specific React Query cache keys for testing
 * Follows React Query best practices for cache management
 */
export const SchedulerQueryKeys = {
  all: ['scheduler'] as const,
  tasks: () => [...SchedulerQueryKeys.all, 'tasks'] as const,
  task: (id: number) => [...SchedulerQueryKeys.tasks(), id] as const,
  taskLogs: (taskId: number) => [...SchedulerQueryKeys.all, 'logs', taskId] as const,
  services: () => [...SchedulerQueryKeys.all, 'services'] as const,
} as const;

/**
 * Service-specific React Query cache keys for testing
 */
export const ServiceQueryKeys = {
  all: ['services'] as const,
  lists: () => [...ServiceQueryKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...ServiceQueryKeys.lists(), filters] as const,
  details: () => [...ServiceQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...ServiceQueryKeys.details(), id] as const,
  health: (id: number) => [...ServiceQueryKeys.all, 'health', id] as const,
} as const;

// ============================================================================
// ERROR RESPONSE MOCKS
// ============================================================================

/**
 * Mock error responses for testing error handling scenarios
 */
export const mockErrorResponses = {
  notFound: {
    error: {
      code: 'NotFoundException',
      message: 'Resource not found.',
      status_code: 404,
      context: 'Scheduler task with ID 999 does not exist',
      trace_id: 'req_123456789',
      timestamp: '2023-08-30T15:30:00.000Z',
    },
  },
  validation: {
    error: {
      code: 'ValidationException',
      message: 'Validation failed.',
      status_code: 422,
      context: {
        error: [
          {
            field: 'frequency',
            code: 'min',
            message: 'Frequency must be at least 60 seconds',
            value: 30,
          },
          {
            field: 'serviceId',
            code: 'required',
            message: 'Service ID is required',
            value: null,
          },
        ],
      },
      trace_id: 'req_123456790',
      timestamp: '2023-08-30T15:30:00.000Z',
    },
  },
  serverError: {
    error: {
      code: 'InternalServerError',
      message: 'An internal server error occurred.',
      status_code: 500,
      context: 'Database connection failed',
      trace_id: 'req_123456791',
      timestamp: '2023-08-30T15:30:00.000Z',
    },
  },
} as const;

// ============================================================================
// TEST UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a mock scheduler task with customizable properties
 * Useful for parameterized testing scenarios
 */
export function createMockSchedulerTask(
  overrides: Partial<SchedulerTaskData> = {}
): SchedulerTaskData {
  return {
    ...mockSchedulerTaskData,
    ...overrides,
    _metadata: {
      ...mockSchedulerTaskData._metadata,
      ...overrides._metadata,
      queryKey: ['scheduler', 'tasks', overrides.id || mockSchedulerTaskData.id],
    },
  };
}

/**
 * Creates a mock service with customizable properties
 * Includes proper React Query cache metadata for testing
 */
export function createMockService(overrides: Partial<Service> = {}): Service {
  const baseService = mockServices[0];
  return {
    ...baseService,
    ...overrides,
    config: {
      ...baseService.config,
      ...overrides.config,
    },
  };
}

/**
 * Generates mock API response with proper DreamFactory v2 structure
 */
export function createMockApiResponse<T>(
  resource: T,
  meta?: Partial<ApiResponse<T>['meta']>
): ApiResponse<T> {
  return {
    resource,
    meta: {
      schema: [],
      ...meta,
    },
  };
}

/**
 * Creates mock paginated list response for testing pagination
 */
export function createMockListResponse<T>(
  items: T[],
  options: {
    page?: number;
    limit?: number;
    total?: number;
  } = {}
): ApiListResponse<T> {
  const { page = 1, limit = 25, total = items.length } = options;
  const offset = (page - 1) * limit;
  
  return {
    resource: items.slice(offset, offset + limit),
    meta: {
      count: Math.min(limit, items.length - offset),
      limit,
      offset,
      total,
      has_more: offset + limit < total,
    },
  };
}

// ============================================================================
// EXPORT COLLECTIONS
// ============================================================================

/**
 * Combined export for easy import in test files
 */
export const schedulerMocks = {
  services: mockServices,
  task: mockSchedulerTaskData,
  responses: {
    serviceList: mockServiceListResponse,
    serviceDetail: mockServiceDetailResponse,
    task: mockSchedulerTaskResponse,
    taskList: mockSchedulerTaskListResponse,
  },
  errors: mockErrorResponses,
  queryKeys: {
    scheduler: SchedulerQueryKeys,
    services: ServiceQueryKeys,
  },
  factories: {
    createTask: createMockSchedulerTask,
    createService: createMockService,
    createApiResponse: createMockApiResponse,
    createListResponse: createMockListResponse,
  },
} as const;

// Default export for backwards compatibility
export default schedulerMocks;