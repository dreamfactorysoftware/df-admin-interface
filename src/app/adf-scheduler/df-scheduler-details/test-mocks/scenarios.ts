/**
 * Comprehensive Mock Scenarios for Scheduler Testing
 * 
 * This module provides extensive mock scenarios for testing scheduler components
 * under various conditions including error states, loading states, edge cases,
 * and performance scenarios. All scenarios are designed to integrate with
 * Mock Service Worker (MSW) for realistic API simulation during development
 * and testing.
 * 
 * Features:
 * - Network failure and API error scenarios matching DreamFactory Core API formats
 * - Loading state mocks with realistic delays for testing UI components
 * - Edge case scenarios for empty states and concurrent modifications
 * - Large dataset scenarios for performance testing (1000+ tasks)
 * - Authentication and permission error scenarios for security testing
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import type { Service } from '../../../types/service';
import type { SchedulerTaskData, CreateSchedulePayload, UpdateSchedulePayload } from '../../../types/scheduler';
import type { ApiErrorResponse, ApiListResponse, ApiSuccessResponse, HttpStatusCode } from '../../../types/api-response';
import { mockServices, mockSchedulerTaskData } from './mocks';

// =============================================================================
// ERROR STATE SCENARIOS
// =============================================================================

/**
 * Network failure scenarios for testing error handling
 */
export const networkErrorScenarios = {
  /**
   * Simulates network timeout during scheduler task list fetch
   */
  taskListNetworkTimeout: {
    delay: 30000, // 30 second timeout
    error: {
      name: 'NetworkError',
      message: 'Network request timed out',
      code: 'NETWORK_TIMEOUT',
      status_code: 0 as HttpStatusCode,
      timestamp: new Date().toISOString(),
    },
  },

  /**
   * Simulates connection refused error
   */
  connectionRefused: {
    delay: 100,
    error: {
      name: 'NetworkError',
      message: 'Connection refused by server',
      code: 'CONNECTION_REFUSED',
      status_code: 0 as HttpStatusCode,
      timestamp: new Date().toISOString(),
    },
  },

  /**
   * Simulates DNS resolution failure
   */
  dnsResolutionFailure: {
    delay: 5000,
    error: {
      name: 'NetworkError',
      message: 'Failed to resolve DNS for dreamfactory.api',
      code: 'DNS_RESOLUTION_FAILED',
      status_code: 0 as HttpStatusCode,
      timestamp: new Date().toISOString(),
    },
  },

  /**
   * Simulates SSL certificate error
   */
  sslCertificateError: {
    delay: 2000,
    error: {
      name: 'SecurityError',
      message: 'SSL certificate verification failed',
      code: 'SSL_CERT_ERROR',
      status_code: 0 as HttpStatusCode,
      timestamp: new Date().toISOString(),
    },
  },
} as const;

/**
 * API validation error scenarios matching DreamFactory Core formats
 */
export const apiErrorScenarios = {
  /**
   * Validation error for creating scheduler task with invalid data
   */
  createTaskValidationError: {
    status_code: 422 as HttpStatusCode,
    error: {
      code: 'VALIDATION_FAILED',
      message: 'The given data was invalid.',
      status_code: 422 as HttpStatusCode,
      context: {
        error: [
          {
            field: 'name',
            code: 'REQUIRED',
            message: 'The name field is required.',
            value: '',
          },
          {
            field: 'frequency',
            code: 'INVALID_TYPE',
            message: 'The frequency must be a positive integer.',
            value: -1,
          },
          {
            field: 'serviceId',
            code: 'INVALID_REFERENCE',
            message: 'The selected service does not exist.',
            value: 999,
          },
          {
            field: 'payload',
            code: 'INVALID_JSON',
            message: 'The payload must be valid JSON when method is not GET.',
            value: '{"invalid": json}',
          },
        ],
      },
      trace_id: 'trace-validation-001',
      timestamp: new Date().toISOString(),
    },
  } satisfies ApiErrorResponse,

  /**
   * Service not found error
   */
  serviceNotFoundError: {
    status_code: 404 as HttpStatusCode,
    error: {
      code: 'SERVICE_NOT_FOUND',
      message: 'Service with ID 999 not found.',
      status_code: 404 as HttpStatusCode,
      context: {
        details: {
          serviceId: 999,
          requested_at: new Date().toISOString(),
        },
      },
      trace_id: 'trace-service-404',
      timestamp: new Date().toISOString(),
    },
  } satisfies ApiErrorResponse,

  /**
   * Task not found error for update operations
   */
  taskNotFoundError: {
    status_code: 404 as HttpStatusCode,
    error: {
      code: 'TASK_NOT_FOUND',
      message: 'Scheduler task with ID 999 not found.',
      status_code: 404 as HttpStatusCode,
      context: {
        details: {
          taskId: 999,
          operation: 'UPDATE',
          requested_at: new Date().toISOString(),
        },
      },
      trace_id: 'trace-task-404',
      timestamp: new Date().toISOString(),
    },
  } satisfies ApiErrorResponse,

  /**
   * Concurrent modification conflict error
   */
  concurrentModificationError: {
    status_code: 409 as HttpStatusCode,
    error: {
      code: 'CONCURRENT_MODIFICATION',
      message: 'The task has been modified by another user. Please refresh and try again.',
      status_code: 409 as HttpStatusCode,
      context: {
        details: {
          taskId: 15,
          current_version: '2023-08-30T15:30:00.000000Z',
          submitted_version: '2023-08-30T14:59:06.000000Z',
          modified_by_user: 2,
        },
      },
      trace_id: 'trace-conflict-001',
      timestamp: new Date().toISOString(),
    },
  } satisfies ApiErrorResponse,

  /**
   * Rate limit exceeded error
   */
  rateLimitExceededError: {
    status_code: 429 as HttpStatusCode,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      status_code: 429 as HttpStatusCode,
      context: {
        details: {
          limit: 100,
          window: 3600,
          retry_after: 300,
        },
      },
      trace_id: 'trace-rate-limit-001',
      timestamp: new Date().toISOString(),
    },
  } satisfies ApiErrorResponse,

  /**
   * Database connection error
   */
  databaseConnectionError: {
    status_code: 503 as HttpStatusCode,
    error: {
      code: 'DATABASE_CONNECTION_FAILED',
      message: 'Unable to connect to the database. Please try again later.',
      status_code: 503 as HttpStatusCode,
      context: 'Database service temporarily unavailable',
      trace_id: 'trace-db-503',
      timestamp: new Date().toISOString(),
    },
  } satisfies ApiErrorResponse,
} as const;

/**
 * Authentication and authorization error scenarios
 */
export const authErrorScenarios = {
  /**
   * Session expired error
   */
  sessionExpiredError: {
    status_code: 401 as HttpStatusCode,
    error: {
      code: 'SESSION_EXPIRED',
      message: 'Your session has expired. Please log in again.',
      status_code: 401 as HttpStatusCode,
      context: {
        details: {
          session_id: 'sess_expired_001',
          expired_at: new Date(Date.now() - 3600000).toISOString(),
        },
      },
      trace_id: 'trace-auth-401',
      timestamp: new Date().toISOString(),
    },
  } satisfies ApiErrorResponse,

  /**
   * Insufficient permissions error
   */
  insufficientPermissionsError: {
    status_code: 403 as HttpStatusCode,
    error: {
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'You do not have permission to perform this action.',
      status_code: 403 as HttpStatusCode,
      context: {
        details: {
          required_permission: 'scheduler:write',
          user_permissions: ['scheduler:read', 'user:read'],
          resource: 'scheduler_tasks',
        },
      },
      trace_id: 'trace-auth-403',
      timestamp: new Date().toISOString(),
    },
  } satisfies ApiErrorResponse,

  /**
   * Invalid API key error
   */
  invalidApiKeyError: {
    status_code: 401 as HttpStatusCode,
    error: {
      code: 'INVALID_API_KEY',
      message: 'The provided API key is invalid or has been revoked.',
      status_code: 401 as HttpStatusCode,
      context: {
        details: {
          api_key_hint: 'df_...xyz',
          revoked_at: new Date().toISOString(),
        },
      },
      trace_id: 'trace-api-key-401',
      timestamp: new Date().toISOString(),
    },
  } satisfies ApiErrorResponse,
} as const;

// =============================================================================
// LOADING STATE SCENARIOS
// =============================================================================

/**
 * Loading scenarios with realistic delays for testing UI components
 */
export const loadingStateScenarios = {
  /**
   * Fast loading scenario for optimal performance testing
   */
  fastLoading: {
    delay: 150, // 150ms - under our performance target
    showSpinner: false,
    showSkeleton: true,
  },

  /**
   * Normal loading scenario for typical network conditions
   */
  normalLoading: {
    delay: 800, // 800ms - typical API response time
    showSpinner: true,
    showSkeleton: true,
  },

  /**
   * Slow loading scenario for poor network conditions
   */
  slowLoading: {
    delay: 3000, // 3 seconds - slow network
    showSpinner: true,
    showSkeleton: true,
    showProgressIndicator: true,
  },

  /**
   * Very slow loading scenario for timeout testing
   */
  verySlowLoading: {
    delay: 8000, // 8 seconds - near timeout threshold
    showSpinner: true,
    showSkeleton: false,
    showTimeoutWarning: true,
  },

  /**
   * Intermittent loading with network hiccups
   */
  intermittentLoading: {
    phases: [
      { delay: 500, progress: 25 },
      { delay: 1500, progress: 50 },
      { delay: 800, progress: 75 },
      { delay: 400, progress: 100 },
    ],
    showProgressBar: true,
  },
} as const;

// =============================================================================
// EDGE CASE SCENARIOS
// =============================================================================

/**
 * Edge case scenarios for comprehensive testing
 */
export const edgeCaseScenarios = {
  /**
   * Empty scheduler task list
   */
  emptyTaskList: {
    resource: [] as SchedulerTaskData[],
    meta: {
      count: 0,
      limit: 25,
      offset: 0,
      total: 0,
      has_more: false,
    },
  } satisfies ApiListResponse<SchedulerTaskData>,

  /**
   * Empty services list
   */
  emptyServicesList: {
    resource: [] as Service[],
    meta: {
      count: 0,
      limit: 25,
      offset: 0,
      total: 0,
      has_more: false,
    },
  } satisfies ApiListResponse<Service>,

  /**
   * Single task in list
   */
  singleTaskList: {
    resource: [mockSchedulerTaskData],
    meta: {
      count: 1,
      limit: 25,
      offset: 0,
      total: 1,
      has_more: false,
    },
  } satisfies ApiListResponse<SchedulerTaskData>,

  /**
   * Task with deleted service reference
   */
  taskWithDeletedService: {
    ...mockSchedulerTaskData,
    serviceId: 999,
    serviceName: 'Deleted Service',
    serviceByServiceId: {
      id: 999,
      name: 'deleted_service',
      label: '[Deleted Service]',
      description: 'This service has been deleted',
      isActive: false,
      type: 'unknown',
      mutable: false,
      deletable: false,
      createdDate: '2023-08-01T00:00:00.000000Z',
      lastModifiedDate: '2023-08-01T00:00:00.000000Z',
      createdById: null,
      lastModifiedById: null,
      config: {},
      serviceDocByServiceId: null,
    },
  } satisfies SchedulerTaskData,

  /**
   * Task with corrupted payload
   */
  taskWithCorruptedPayload: {
    ...mockSchedulerTaskData,
    payload: '{"corrupted": json, "missing": quote}',
    taskLogByTaskId: {
      taskId: 15,
      statusCode: 500,
      content: 'JSON parsing error: Invalid JSON payload provided',
      createdDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString(),
    },
  } satisfies SchedulerTaskData,

  /**
   * Task with extremely long content
   */
  taskWithLongContent: {
    ...mockSchedulerTaskData,
    description: 'A'.repeat(10000), // 10KB description
    payload: JSON.stringify({ data: 'B'.repeat(50000) }), // 50KB payload
    taskLogByTaskId: {
      taskId: 15,
      statusCode: 200,
      content: 'C'.repeat(100000), // 100KB log content
      createdDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString(),
    },
  } satisfies SchedulerTaskData,

  /**
   * Task with special characters in name and description
   */
  taskWithSpecialCharacters: {
    ...mockSchedulerTaskData,
    name: '特殊文字 & Émojis 🚀 <script>alert("xss")</script>',
    description: 'Test with 中文, العربية, русский, and special chars: !@#$%^&*()[]{}|;:,.<>?',
    component: 'table/special-chars & symbols',
  } satisfies SchedulerTaskData,

  /**
   * Task with null/undefined fields
   */
  taskWithNullFields: {
    ...mockSchedulerTaskData,
    description: null,
    payload: null,
    lastModifiedById: null,
    taskLogByTaskId: null,
  } satisfies SchedulerTaskData,

  /**
   * Task scheduled far in the future
   */
  futureScheduledTask: {
    ...mockSchedulerTaskData,
    frequency: 999999999, // Very high frequency value
    createdDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year in future
  } satisfies SchedulerTaskData,

  /**
   * Task with minimum frequency
   */
  minimumFrequencyTask: {
    ...mockSchedulerTaskData,
    frequency: 1, // Minimum allowed frequency
  } satisfies SchedulerTaskData,

  /**
   * Task with maximum frequency
   */
  maximumFrequencyTask: {
    ...mockSchedulerTaskData,
    frequency: 2147483647, // Maximum 32-bit integer
  } satisfies SchedulerTaskData,
} as const;

// =============================================================================
// LARGE DATASET SCENARIOS
// =============================================================================

/**
 * Generates large dataset scenarios for performance testing
 */
export const largeDatasetScenarios = {
  /**
   * Generates a list of 1000+ scheduler tasks for pagination testing
   */
  generateLargeTaskList: (count: number = 1000): ApiListResponse<SchedulerTaskData> => {
    const tasks: SchedulerTaskData[] = [];
    
    for (let i = 1; i <= count; i++) {
      const serviceIndex = (i - 1) % mockServices.length;
      const service = mockServices[serviceIndex];
      const frequency = Math.floor(Math.random() * 3600) + 60; // 1 minute to 1 hour
      const isActive = Math.random() > 0.2; // 80% active
      const hasError = Math.random() < 0.1; // 10% have errors
      
      tasks.push({
        id: i,
        name: `scheduled_task_${i.toString().padStart(4, '0')}`,
        description: `Automated task ${i} - ${hasError ? 'Failed' : 'Running'} every ${frequency} seconds`,
        isActive,
        serviceId: service.id,
        component: i % 5 === 0 ? '*' : `table_${(i % 10) + 1}`,
        frequency,
        payload: i % 3 === 0 ? null : JSON.stringify({
          batch_size: Math.floor(Math.random() * 100) + 1,
          retry_count: Math.floor(Math.random() * 5),
          timeout: Math.floor(Math.random() * 30) + 10,
        }),
        createdDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        lastModifiedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdById: Math.floor(Math.random() * 5) + 1,
        lastModifiedById: Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : null,
        verb: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'][Math.floor(Math.random() * 5)],
        verbMask: Math.pow(2, Math.floor(Math.random() * 5)),
        taskLogByTaskId: hasError ? {
          taskId: i,
          statusCode: [400, 404, 500, 502, 503][Math.floor(Math.random() * 5)],
          content: `Error executing task ${i}: ${['Connection timeout', 'Resource not found', 'Internal server error', 'Bad gateway', 'Service unavailable'][Math.floor(Math.random() * 5)]}`,
          createdDate: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          lastModifiedDate: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        } : null,
        serviceByServiceId: service,
      });
    }

    return {
      resource: tasks,
      meta: {
        count: Math.min(count, 25), // Assuming 25 per page
        limit: 25,
        offset: 0,
        total: count,
        has_more: count > 25,
        next_cursor: count > 25 ? 'cursor_25' : undefined,
      },
    };
  },

  /**
   * Paginated response for large dataset
   */
  generatePaginatedResponse: (
    page: number = 1,
    limit: number = 25,
    totalCount: number = 1000
  ): ApiListResponse<SchedulerTaskData> => {
    const offset = (page - 1) * limit;
    const fullDataset = largeDatasetScenarios.generateLargeTaskList(totalCount);
    const paginatedData = fullDataset.resource.slice(offset, offset + limit);

    return {
      resource: paginatedData,
      meta: {
        count: paginatedData.length,
        limit,
        offset,
        total: totalCount,
        has_more: offset + limit < totalCount,
        next_cursor: offset + limit < totalCount ? `cursor_${offset + limit}` : undefined,
        prev_cursor: offset > 0 ? `cursor_${Math.max(0, offset - limit)}` : undefined,
      },
    };
  },

  /**
   * Generates large service list for dropdown performance testing
   */
  generateLargeServiceList: (count: number = 500): ApiListResponse<Service> => {
    const services: Service[] = [];
    const serviceTypes = ['mysql', 'pgsql', 'mongodb', 'sqlite', 'rest', 'soap', 'file', 'email'];

    for (let i = 1; i <= count; i++) {
      const typeIndex = (i - 1) % serviceTypes.length;
      const serviceType = serviceTypes[typeIndex];
      
      services.push({
        id: i,
        name: `service_${i.toString().padStart(3, '0')}`,
        label: `Service ${i} (${serviceType.toUpperCase()})`,
        description: `Auto-generated ${serviceType} service for performance testing`,
        isActive: Math.random() > 0.1, // 90% active
        type: serviceType,
        mutable: true,
        deletable: i > 10, // First 10 are not deletable
        createdDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        lastModifiedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdById: Math.floor(Math.random() * 5) + 1,
        lastModifiedById: Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : null,
        config: {
          database: serviceType.includes('sql') ? `database_${i}` : undefined,
          host: serviceType.includes('sql') ? `host-${i}.example.com` : undefined,
          port: serviceType.includes('sql') ? 3306 + (i % 100) : undefined,
        },
        serviceDocByServiceId: null,
      });
    }

    return {
      resource: services,
      meta: {
        count: Math.min(count, 100), // Assuming 100 per page for services
        limit: 100,
        offset: 0,
        total: count,
        has_more: count > 100,
      },
    };
  },
} as const;

// =============================================================================
// CONCURRENT OPERATION SCENARIOS
// =============================================================================

/**
 * Scenarios for testing concurrent user operations
 */
export const concurrentOperationScenarios = {
  /**
   * Simulates multiple users editing the same task
   */
  simultaneousEdits: {
    originalTask: mockSchedulerTaskData,
    user1Edit: {
      ...mockSchedulerTaskData,
      name: 'Updated by User 1',
      lastModifiedDate: new Date(Date.now() - 1000).toISOString(),
      lastModifiedById: 1,
    } as SchedulerTaskData,
    user2Edit: {
      ...mockSchedulerTaskData,
      description: 'Updated by User 2',
      lastModifiedDate: new Date().toISOString(),
      lastModifiedById: 2,
    } as SchedulerTaskData,
  },

  /**
   * Simulates task deletion while another user is editing
   */
  deleteWhileEditing: {
    originalTask: mockSchedulerTaskData,
    deletionTimestamp: new Date().toISOString(),
    editAttempt: {
      ...mockSchedulerTaskData,
      name: 'Attempted edit after deletion',
    } as UpdateSchedulePayload,
  },

  /**
   * Simulates service modification affecting scheduled tasks
   */
  serviceModificationImpact: {
    originalService: mockServices[1],
    modifiedService: {
      ...mockServices[1],
      isActive: false,
      lastModifiedDate: new Date().toISOString(),
    } as Service,
    affectedTasks: [
      {
        ...mockSchedulerTaskData,
        serviceByServiceId: {
          ...mockServices[1],
          isActive: false,
        },
      },
    ] as SchedulerTaskData[],
  },
} as const;

// =============================================================================
// PERFORMANCE STRESS TEST SCENARIOS
// =============================================================================

/**
 * Scenarios for performance and stress testing
 */
export const performanceScenarios = {
  /**
   * Rapid succession of API calls
   */
  rapidFireRequests: {
    requestCount: 100,
    intervalMs: 10, // 10ms between requests
    expectedFailureRate: 0.05, // 5% expected to fail due to rate limiting
  },

  /**
   * Memory stress test with large payloads
   */
  largePayloadStress: {
    payloadSizeKB: 1024, // 1MB payload
    taskCount: 50,
    generateLargePayload: (sizeKB: number) => ({
      data: 'x'.repeat(sizeKB * 1024),
      metadata: {
        size: sizeKB,
        generated: new Date().toISOString(),
      },
    }),
  },

  /**
   * Virtual scrolling performance test
   */
  virtualScrollingTest: {
    totalItems: 10000,
    visibleItems: 20,
    itemHeight: 50,
    scrollSpeed: 100, // pixels per scroll event
  },
} as const;

// =============================================================================
// WEBHOOK AND INTEGRATION SCENARIOS
// =============================================================================

/**
 * Scenarios for testing external integrations and webhooks
 */
export const integrationScenarios = {
  /**
   * Webhook delivery failure scenarios
   */
  webhookFailures: {
    timeoutFailure: {
      statusCode: 0,
      error: 'Webhook delivery timeout after 30 seconds',
      retryCount: 3,
      nextRetry: new Date(Date.now() + 300000).toISOString(), // 5 minutes
    },
    endpointNotFound: {
      statusCode: 404,
      error: 'Webhook endpoint not found',
      url: 'https://example.com/webhook/not-found',
      retryCount: 1,
    },
    authenticationFailure: {
      statusCode: 401,
      error: 'Webhook authentication failed',
      url: 'https://example.com/webhook/protected',
      headers: { 'X-Webhook-Signature': 'invalid' },
      retryCount: 0, // No retry for auth failures
    },
  },

  /**
   * Third-party service integration errors
   */
  thirdPartyServiceErrors: {
    externalApiUnavailable: {
      service: 'external-api',
      error: 'External API service is currently unavailable',
      statusCode: 503,
      retryAfter: 1800, // 30 minutes
    },
    rateLimitExceeded: {
      service: 'third-party-api',
      error: 'Rate limit exceeded for third-party service',
      statusCode: 429,
      resetTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    },
  },
} as const;

// =============================================================================
// EXPORT ALL SCENARIOS
// =============================================================================

/**
 * Comprehensive collection of all test scenarios
 */
export const testScenarios = {
  network: networkErrorScenarios,
  api: apiErrorScenarios,
  auth: authErrorScenarios,
  loading: loadingStateScenarios,
  edgeCases: edgeCaseScenarios,
  largeDatasets: largeDatasetScenarios,
  concurrent: concurrentOperationScenarios,
  performance: performanceScenarios,
  integration: integrationScenarios,
} as const;

/**
 * Utility function to get scenario by category and name
 */
export function getScenario<T extends keyof typeof testScenarios>(
  category: T,
  scenarioName: keyof typeof testScenarios[T]
): typeof testScenarios[T][keyof typeof testScenarios[T]] {
  return testScenarios[category][scenarioName];
}

/**
 * Utility function to get all scenarios for a specific category
 */
export function getScenariosForCategory<T extends keyof typeof testScenarios>(
  category: T
): typeof testScenarios[T] {
  return testScenarios[category];
}

/**
 * Utility function to create a custom scenario with delay
 */
export function createDelayedScenario<T>(
  data: T,
  delay: number = 1000
): { data: T; delay: number } {
  return { data, delay };
}

/**
 * Type definitions for MSW handlers
 */
export interface MockScenarioHandler {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  scenario: keyof typeof testScenarios[keyof typeof testScenarios];
  delay?: number;
  errorRate?: number; // 0-1, probability of returning error
}

/**
 * Default export with commonly used scenarios
 */
export default {
  // Quick access to most common scenarios
  emptyTaskList: edgeCaseScenarios.emptyTaskList,
  singleTask: edgeCaseScenarios.singleTaskList,
  largeTaskList: largeDatasetScenarios.generateLargeTaskList(),
  networkTimeout: networkErrorScenarios.taskListNetworkTimeout,
  validationError: apiErrorScenarios.createTaskValidationError,
  sessionExpired: authErrorScenarios.sessionExpiredError,
  normalLoading: loadingStateScenarios.normalLoading,
  
  // Utility functions
  generateLargeTaskList: largeDatasetScenarios.generateLargeTaskList,
  generatePaginatedResponse: largeDatasetScenarios.generatePaginatedResponse,
  getScenario,
  getScenariosForCategory,
  createDelayedScenario,
};