/**
 * @fileoverview Mock Service Worker (MSW) compatible test mocks for scheduler components
 * @description Enhanced mock data supporting React Query testing patterns with proper cache key structures
 * 
 * @version 2.0.0 - React 19/Next.js 15.1 Migration
 * @license MIT
 * @author DreamFactory Team
 * 
 * Key Changes from Angular Version:
 * - Updated mock data format to be compatible with Mock Service Worker (MSW) rather than Angular HttpClientTestingModule
 * - Enhanced mock data to support React Query testing patterns with proper cache key structures
 * - Updated TypeScript interfaces to align with new React component prop types and Zod validation schemas
 * - Added React Query-compatible response wrapper structures matching DreamFactory Core API v2 formats
 * - Integrated with MSW response format requirements for seamless handler integration
 * - Updated mockServices and mockSchedulerTaskData to include additional metadata for React Query cache invalidation testing
 * 
 * Features:
 * - MSW-compatible response structures
 * - React Query cache key strategies
 * - Enhanced TypeScript interfaces for React components
 * - Zod validation schema compatibility
 * - Optimistic update pattern support
 * - Cache invalidation testing utilities
 */

import type { 
  ApiResponse, 
  ApiListResponse, 
  ApiResourceResponse,
  PaginationMeta,
  ApiSuccessResponse 
} from '../../../types/api'
import type { 
  ServiceCategory, 
  ServiceStatus, 
  ServiceConfig,
  ServiceRow 
} from '../../../types/services'

// =============================================================================
// ENHANCED SERVICE TYPES FOR REACT QUERY
// =============================================================================

/**
 * Enhanced service interface with React Query optimization metadata
 * Compatible with new React component patterns and Zod validation
 */
export interface ServiceWithMetadata {
  /** Service ID */
  id: number
  
  /** Service name (used as React Query cache key) */
  name: string
  
  /** Display label */
  label: string
  
  /** Service description */
  description: string
  
  /** Active status flag */
  isActive: boolean
  
  /** Service type/category */
  type: string
  
  /** Whether service can be modified */
  mutable: boolean
  
  /** Whether service can be deleted */
  deletable: boolean
  
  /** Creation timestamp in ISO 8601 format */
  createdDate: string
  
  /** Last modification timestamp in ISO 8601 format */
  lastModifiedDate: string
  
  /** ID of user who created the service */
  createdById: number | null
  
  /** ID of user who last modified the service */
  lastModifiedById: number | null
  
  /** Service configuration object */
  config: ServiceConfig | Record<string, any>
  
  /** Associated documentation ID */
  serviceDocByServiceId: number | null
  
  /** Refresh flag for UI state management */
  refresh?: boolean
  
  /** React Query cache metadata */
  _cacheMetadata?: {
    /** Cache key components for React Query */
    queryKey: string[]
    /** Last fetch timestamp */
    lastFetch: string
    /** Cache TTL in milliseconds */
    staleTime: number
    /** Background refetch enabled */
    backgroundRefetch: boolean
    /** Optimistic update status */
    optimisticUpdates: boolean
  }
  
  /** Service status for enhanced monitoring */
  status?: ServiceStatus
  
  /** Service category for grouping */
  category?: ServiceCategory
  
  /** Health check information */
  health?: {
    status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown'
    lastCheck: string
    responseTime?: number
    errorCount?: number
  }
}

/**
 * Enhanced scheduler task data interface with React Query support
 * Includes additional metadata for cache invalidation and optimistic updates
 */
export interface SchedulerTaskDataWithMetadata {
  /** Task ID */
  id: number
  
  /** Task name */
  name: string
  
  /** Task description */
  description: string
  
  /** Active status flag */
  isActive: boolean
  
  /** Associated service ID */
  serviceId: number
  
  /** Component/resource path */
  component: string
  
  /** HTTP verb mask for permissions */
  verbMask: number
  
  /** Execution frequency in minutes */
  frequency: number
  
  /** JSON payload for the task */
  payload: string | null
  
  /** Creation timestamp in ISO 8601 format */
  createdDate: string
  
  /** Last modification timestamp in ISO 8601 format */
  lastModifiedDate: string
  
  /** ID of user who created the task */
  createdById: number
  
  /** ID of user who last modified the task */
  lastModifiedById: number | null
  
  /** HTTP verb for the task */
  verb: string
  
  /** Associated service object */
  serviceByServiceId: ServiceWithMetadata
  
  /** Task execution log */
  taskLogByTaskId: {
    /** Task ID reference */
    taskId: number
    /** HTTP response status code */
    statusCode: number
    /** Log content/error messages */
    content: string
    /** Log creation timestamp */
    createdDate: string
    /** Log last modification timestamp */
    lastModifiedDate: string
  } | null
  
  /** React Query cache metadata */
  _cacheMetadata?: {
    /** Cache key for this task */
    queryKey: string[]
    /** Related cache keys that should be invalidated */
    relatedKeys: string[][]
    /** Last execution timestamp */
    lastExecution?: string
    /** Next scheduled execution */
    nextExecution?: string
    /** Mutation state tracking */
    mutations: {
      updating: boolean
      deleting: boolean
      executing: boolean
    }
  }
  
  /** Enhanced task metadata */
  metadata?: {
    /** Number of successful executions */
    successCount: number
    /** Number of failed executions */
    errorCount: number
    /** Average execution time in milliseconds */
    avgExecutionTime: number
    /** Last successful execution */
    lastSuccess?: string
    /** Last failed execution */
    lastFailure?: string
  }
}

// =============================================================================
// MSW-COMPATIBLE MOCK DATA WITH REACT QUERY SUPPORT
// =============================================================================

/**
 * Enhanced mock services with React Query cache metadata
 * Compatible with MSW response handlers and React Query caching strategies
 */
export const mockServices: ServiceWithMetadata[] = [
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
    config: [],
    serviceDocByServiceId: null,
    status: 'active',
    category: 'http',
    _cacheMetadata: {
      queryKey: ['services', 'api_docs'],
      lastFetch: '2024-01-15T10:30:00.000Z',
      staleTime: 300000, // 5 minutes
      backgroundRefetch: true,
      optimisticUpdates: false
    },
    health: {
      status: 'healthy',
      lastCheck: '2024-01-15T10:29:45.000Z',
      responseTime: 120,
      errorCount: 0
    }
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
    },
    serviceDocByServiceId: null,
    status: 'active',
    category: 'database',
    _cacheMetadata: {
      queryKey: ['services', 'db'],
      lastFetch: '2024-01-15T10:28:30.000Z',
      staleTime: 300000, // 5 minutes
      backgroundRefetch: true,
      optimisticUpdates: true
    },
    health: {
      status: 'healthy',
      lastCheck: '2024-01-15T10:28:15.000Z',
      responseTime: 85,
      errorCount: 0
    }
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
      parameters: [],
    },
    serviceDocByServiceId: null,
    status: 'active',
    category: 'email',
    _cacheMetadata: {
      queryKey: ['services', 'email'],
      lastFetch: '2024-01-15T10:27:00.000Z',
      staleTime: 600000, // 10 minutes
      backgroundRefetch: false,
      optimisticUpdates: false
    },
    health: {
      status: 'healthy',
      lastCheck: '2024-01-15T10:26:45.000Z',
      responseTime: 200,
      errorCount: 1
    }
  },
]

/**
 * Enhanced mock scheduler task with React Query optimization metadata
 * Includes cache invalidation patterns and optimistic update support
 */
export const mockSchedulerTaskData: SchedulerTaskDataWithMetadata = {
  id: 15,
  name: 'gaaa',
  description: 'pac',
  isActive: true,
  serviceId: 5,
  component: '*',
  verbMask: 1,
  frequency: 88,
  payload: null,
  createdDate: '2023-08-30T14:41:44.000000Z',
  lastModifiedDate: '2023-08-30T14:59:06.000000Z',
  createdById: 1,
  lastModifiedById: 1,
  verb: 'GET',
  serviceByServiceId: mockServices[1], // 'db' service
  taskLogByTaskId: {
    taskId: 15,
    statusCode: 404,
    content: "REST Exception #404 > Resource '*' not found for service 'name'. DreamFactory Core Utility ServiceResponse Object (    [statusCode:protected] => 404    [content:protected] => Array        ( [error] => Array                (                [code] => 404                    [context] => [message] => Resource '*' not found for service 'name'.   [status_code] => 404              )        )    [contentType:protected] =>    [dataFormat:protected] => 201   [headers:protected] => Array       (        ))REST Exception #404 > Resource '*' not found for service 'name'. Resource '*' not found for service 'name'. REST Exception #500 > Resource '*' not found for service 'name'. In Request.php line 71: Resource '*' not found for service 'name'.",
    createdDate: '2023-08-30T15:28:04.000000Z',
    lastModifiedDate: '2023-08-30T15:28:04.000000Z',
  },
  _cacheMetadata: {
    queryKey: ['scheduler', 'tasks', 15],
    relatedKeys: [
      ['scheduler', 'tasks'],
      ['services', 5],
      ['scheduler', 'tasks', 'by-service', 5]
    ],
    lastExecution: '2023-08-30T15:28:04.000000Z',
    nextExecution: '2023-08-30T16:56:04.000000Z', // frequency + last execution
    mutations: {
      updating: false,
      deleting: false,
      executing: false
    }
  },
  metadata: {
    successCount: 12,
    errorCount: 8,
    avgExecutionTime: 1250,
    lastSuccess: '2023-08-29T10:15:30.000000Z',
    lastFailure: '2023-08-30T15:28:04.000000Z'
  }
}

// =============================================================================
// MSW RESPONSE WRAPPERS FOR DREAMFACTORY API V2 COMPATIBILITY
// =============================================================================

/**
 * MSW-compatible services list response wrapper
 * Matches DreamFactory Core API v2 response format for React Query integration
 */
export const mockServicesListResponse: ApiListResponse<ServiceWithMetadata> = {
  resource: mockServices,
  meta: {
    count: mockServices.length,
    offset: 0,
    limit: 25,
    has_next: false,
    has_previous: false,
    page_count: 1,
    links: {
      first: '/api/v2/services?offset=0&limit=25',
      last: '/api/v2/services?offset=0&limit=25',
      next: null,
      previous: null
    }
  },
  timestamp: new Date().toISOString(),
  request_id: 'mock-services-list-001'
}

/**
 * MSW-compatible single service response wrapper
 * Optimized for React Query single resource caching
 */
export const mockServiceDetailResponse: ApiResourceResponse<ServiceWithMetadata> = {
  resource: mockServices[1], // 'db' service
  timestamp: new Date().toISOString(),
  request_id: 'mock-service-detail-001'
}

/**
 * MSW-compatible scheduler task response wrapper
 * Includes React Query cache invalidation metadata
 */
export const mockSchedulerTaskResponse: ApiResourceResponse<SchedulerTaskDataWithMetadata> = {
  resource: mockSchedulerTaskData,
  timestamp: new Date().toISOString(),
  request_id: 'mock-scheduler-task-001'
}

/**
 * MSW-compatible scheduler tasks list response
 * Enhanced with pagination metadata for infinite queries
 */
export const mockSchedulerTasksListResponse: ApiListResponse<SchedulerTaskDataWithMetadata> = {
  resource: [mockSchedulerTaskData],
  meta: {
    count: 1,
    offset: 0,
    limit: 25,
    has_next: false,
    has_previous: false,
    page_count: 1,
    links: {
      first: '/api/v2/scheduler?offset=0&limit=25',
      last: '/api/v2/scheduler?offset=0&limit=25',
      next: null,
      previous: null
    }
  },
  timestamp: new Date().toISOString(),
  request_id: 'mock-scheduler-tasks-list-001'
}

// =============================================================================
// REACT QUERY TEST UTILITIES
// =============================================================================

/**
 * Mock data factory for creating test scenarios
 * Supports optimistic updates and cache invalidation testing
 */
export const createMockSchedulerTask = (overrides: Partial<SchedulerTaskDataWithMetadata> = {}): SchedulerTaskDataWithMetadata => ({
  ...mockSchedulerTaskData,
  ...overrides,
  _cacheMetadata: {
    ...mockSchedulerTaskData._cacheMetadata!,
    ...overrides._cacheMetadata
  },
  serviceByServiceId: overrides.serviceByServiceId || mockServices[1]
})

/**
 * Mock data factory for creating service test data
 * Enhanced with React Query cache key generation
 */
export const createMockService = (overrides: Partial<ServiceWithMetadata> = {}): ServiceWithMetadata => {
  const baseService = mockServices[0]
  const service = {
    ...baseService,
    ...overrides
  }
  
  // Generate React Query cache metadata
  service._cacheMetadata = {
    queryKey: ['services', service.name],
    lastFetch: new Date().toISOString(),
    staleTime: 300000,
    backgroundRefetch: true,
    optimisticUpdates: service.mutable,
    ...overrides._cacheMetadata
  }
  
  return service
}

/**
 * Mock response factory for MSW handlers
 * Generates DreamFactory API v2 compatible responses
 */
export const createMockApiResponse = <T>(
  data: T, 
  options: {
    list?: boolean
    error?: boolean
    statusCode?: number
    meta?: Partial<PaginationMeta>
  } = {}
): ApiResponse<T> => {
  const { list = false, error = false, statusCode = 200, meta } = options
  
  if (error) {
    return {
      success: false,
      error: {
        code: `HTTP_${statusCode}`,
        message: 'Mock error response',
        status_code: statusCode as any,
        context: 'Test error scenario'
      },
      timestamp: new Date().toISOString(),
      request_id: `mock-error-${Date.now()}`
    } as any
  }
  
  const baseResponse = {
    timestamp: new Date().toISOString(),
    request_id: `mock-success-${Date.now()}`
  }
  
  if (list) {
    return {
      resource: Array.isArray(data) ? data : [data],
      meta: {
        count: Array.isArray(data) ? data.length : 1,
        offset: 0,
        limit: 25,
        has_next: false,
        has_previous: false,
        page_count: 1,
        ...meta
      },
      ...baseResponse
    } as ApiListResponse<T> as any
  }
  
  return {
    resource: data,
    ...baseResponse
  } as ApiResourceResponse<T> as any
}

/**
 * Cache invalidation patterns for React Query testing
 * Maps operations to affected cache keys
 */
export const cacheInvalidationPatterns = {
  // Scheduler task operations
  createTask: [
    ['scheduler', 'tasks'],
    ['scheduler', 'tasks', 'by-service']
  ],
  updateTask: (taskId: number) => [
    ['scheduler', 'tasks'],
    ['scheduler', 'tasks', taskId],
    ['scheduler', 'tasks', 'by-service']
  ],
  deleteTask: (taskId: number) => [
    ['scheduler', 'tasks'],
    ['scheduler', 'tasks', taskId],
    ['scheduler', 'tasks', 'by-service']
  ],
  executeTask: (taskId: number) => [
    ['scheduler', 'tasks', taskId],
    ['scheduler', 'logs', taskId]
  ],
  
  // Service operations
  createService: [
    ['services'],
    ['services', 'types']
  ],
  updateService: (serviceId: number, serviceName: string) => [
    ['services'],
    ['services', serviceId],
    ['services', serviceName]
  ],
  deleteService: (serviceId: number, serviceName: string) => [
    ['services'],
    ['services', serviceId],
    ['services', serviceName],
    ['scheduler', 'tasks', 'by-service', serviceId]
  ]
} as const

/**
 * Export all mock data for use in MSW handlers and React Query tests
 */
export {
  mockServices as mockServicesData,
  mockSchedulerTaskData as mockTaskData
}

/**
 * Default export with all mock utilities
 */
export default {
  services: mockServices,
  task: mockSchedulerTaskData,
  responses: {
    servicesList: mockServicesListResponse,
    serviceDetail: mockServiceDetailResponse,
    taskDetail: mockSchedulerTaskResponse,
    tasksList: mockSchedulerTasksListResponse
  },
  factories: {
    createMockSchedulerTask,
    createMockService,
    createMockApiResponse
  },
  cache: {
    invalidationPatterns
  }
}