/**
 * @fileoverview Extended mock scenarios for comprehensive scheduler testing
 * @description Covers error states, loading states, edge cases, and complex workflow situations
 * 
 * @version 1.0.0 - React 19/Next.js 15.1 Implementation
 * @license MIT
 * @author DreamFactory Team
 * 
 * Features:
 * - Comprehensive error state mock scenarios including network failures and API validation errors
 * - Loading state mock data with realistic delays for testing spinner and skeleton components
 * - Edge case scenarios including empty task lists, deleted services, and concurrent modifications
 * - Large dataset mocks for testing pagination, virtual scrolling, and performance optimization (1000+ tasks)
 * - Authentication failure and permission error scenarios for security testing coverage
 * - MSW handler integration for realistic API simulation
 * - React Query cache testing patterns and optimistic update scenarios
 * - Zod validation error scenarios for form testing
 * - Real-time synchronization conflict scenarios
 */

import type { 
  ApiResponse, 
  ApiListResponse, 
  ApiResourceResponse,
  ApiErrorResponse,
  PaginationMeta,
  HttpStatusCode 
} from '../../../types/api'
import type { 
  ServiceWithMetadata,
  SchedulerTaskDataWithMetadata 
} from './mocks'
import { 
  mockServices, 
  mockSchedulerTaskData,
  createMockSchedulerTask,
  createMockService,
  createMockApiResponse 
} from './mocks'

// =============================================================================
// ERROR STATE SCENARIOS
// =============================================================================

/**
 * Network failure scenarios simulating various connection issues
 * Compatible with MSW error response patterns
 */
export const networkErrorScenarios = {
  /**
   * Complete network connectivity loss
   * Simulates offline scenarios for PWA testing
   */
  networkOffline: {
    name: 'NETWORK_OFFLINE',
    error: new Error('Failed to fetch'),
    delay: 5000,
    retryable: true,
    description: 'Network connection completely unavailable',
    testCases: [
      'Scheduler task list loading while offline',
      'Task creation attempt without network',
      'Task update synchronization failure',
      'Service validation during network outage'
    ]
  },

  /**
   * Request timeout scenarios
   * Tests React Query timeout handling and retry logic
   */
  requestTimeout: {
    name: 'REQUEST_TIMEOUT',
    error: new Error('Request timeout'),
    delay: 30000,
    retryable: true,
    description: 'API request exceeds configured timeout threshold',
    testCases: [
      'Large dataset loading timeout (1000+ tasks)',
      'Complex task validation timeout',
      'Service connection test timeout',
      'Task execution log retrieval timeout'
    ]
  },

  /**
   * DNS resolution failure
   * Simulates infrastructure-level connectivity issues
   */
  dnsFailure: {
    name: 'DNS_RESOLUTION_FAILED',
    error: new Error('DNS resolution failed'),
    delay: 10000,
    retryable: false,
    description: 'Domain name resolution failure',
    testCases: [
      'API endpoint unreachable',
      'Service discovery failure',
      'CDN resource loading failure'
    ]
  },

  /**
   * SSL/TLS certificate errors
   * Tests security-related connectivity failures
   */
  sslError: {
    name: 'SSL_CERTIFICATE_ERROR',
    error: new Error('SSL certificate verification failed'),
    delay: 2000,
    retryable: false,
    description: 'SSL/TLS certificate validation failure',
    testCases: [
      'Expired certificate handling',
      'Self-signed certificate rejection',
      'Certificate chain validation failure'
    ]
  }
} as const

/**
 * API validation error scenarios matching DreamFactory Core error formats
 * Enhanced with field-level validation details for React Hook Form integration
 */
export const validationErrorScenarios = {
  /**
   * Missing required fields validation
   * Tests Zod schema validation integration
   */
  missingRequiredFields: {
    statusCode: 422 as HttpStatusCode,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed for required fields',
      status_code: 422 as HttpStatusCode,
      context: {
        errors: {
          name: ['Task name is required and cannot be empty'],
          serviceId: ['Service selection is required'],
          frequency: ['Execution frequency must be specified'],
          component: ['Component path is required']
        }
      }
    },
    description: 'Multiple required field validation failures',
    testCases: [
      'Empty form submission',
      'Partial form completion',
      'Field-by-field validation',
      'Bulk validation on form blur'
    ]
  },

  /**
   * Invalid data format validation
   * Tests JSON payload validation and type checking
   */
  invalidDataFormat: {
    statusCode: 422 as HttpStatusCode,
    error: {
      code: 'INVALID_FORMAT',
      message: 'Invalid data format provided',
      status_code: 422 as HttpStatusCode,
      context: {
        errors: {
          frequency: ['Frequency must be a positive integer between 1 and 525600'],
          payload: ['JSON payload contains syntax errors at line 3, column 15'],
          verbMask: ['Verb mask must be a valid bitmask value']
        }
      }
    },
    description: 'Data type and format validation failures',
    testCases: [
      'Invalid JSON syntax in payload field',
      'Out-of-range numeric values',
      'Invalid enum selections',
      'Malformed component paths'
    ]
  },

  /**
   * Business logic validation errors
   * Tests complex validation rules and constraints
   */
  businessLogicViolation: {
    statusCode: 409 as HttpStatusCode,
    error: {
      code: 'BUSINESS_RULE_VIOLATION',
      message: 'Operation violates business logic constraints',
      status_code: 409 as HttpStatusCode,
      context: {
        errors: {
          name: ['Task name must be unique within the selected service'],
          serviceId: ['Selected service is inactive and cannot execute tasks'],
          frequency: ['Frequency too low - minimum interval is 5 minutes for this service type']
        }
      }
    },
    description: 'Business rule and constraint violations',
    testCases: [
      'Duplicate task name validation',
      'Service dependency validation',
      'Resource availability checks',
      'Permission level validation'
    ]
  },

  /**
   * Data consistency validation errors
   * Tests referential integrity and cross-field validation
   */
  dataConsistencyError: {
    statusCode: 422 as HttpStatusCode,
    error: {
      code: 'DATA_CONSISTENCY_ERROR',
      message: 'Data consistency validation failed',
      status_code: 422 as HttpStatusCode,
      context: {
        errors: {
          serviceId: ['Referenced service no longer exists or has been deleted'],
          component: ['Component path is not valid for the selected service type'],
          verbMask: ['HTTP verb combination not supported by target service']
        }
      }
    },
    description: 'Cross-field and referential integrity validation',
    testCases: [
      'Orphaned service references',
      'Invalid component-service combinations',
      'Inconsistent permission settings',
      'Circular dependency detection'
    ]
  }
} as const

/**
 * Server error scenarios simulating backend failures
 * Tests error boundary handling and recovery workflows
 */
export const serverErrorScenarios = {
  /**
   * Internal server error (500)
   * Tests generic server failure handling
   */
  internalServerError: createMockApiResponse(null, {
    error: true,
    statusCode: 500
  }),

  /**
   * Service unavailable (503)
   * Tests maintenance mode and service degradation
   */
  serviceUnavailable: {
    statusCode: 503 as HttpStatusCode,
    error: {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Scheduler service is temporarily unavailable due to maintenance',
      status_code: 503 as HttpStatusCode,
      context: {
        maintenance: true,
        estimatedRestoreTime: '2024-01-15T12:00:00.000Z',
        retryAfter: 1800 // 30 minutes
      }
    },
    description: 'Service maintenance and unavailability',
    testCases: [
      'Scheduled maintenance window handling',
      'Service degradation graceful fallback',
      'Retry-after header processing'
    ]
  },

  /**
   * Database connection failure
   * Tests infrastructure dependency failures
   */
  databaseConnectionError: {
    statusCode: 500 as HttpStatusCode,
    error: {
      code: 'DATABASE_CONNECTION_ERROR',
      message: 'Unable to establish database connection for scheduler operations',
      status_code: 500 as HttpStatusCode,
      context: {
        database: 'scheduler_db',
        connectionPool: 'exhausted',
        lastSuccessfulConnection: '2024-01-15T09:45:00.000Z'
      }
    },
    description: 'Database connectivity and pool exhaustion',
    testCases: [
      'Connection pool exhaustion',
      'Database server downtime',
      'Transaction timeout failures'
    ]
  },

  /**
   * Memory/resource exhaustion
   * Tests resource limitation handling
   */
  resourceExhaustion: {
    statusCode: 507 as HttpStatusCode,
    error: {
      code: 'INSUFFICIENT_STORAGE',
      message: 'Server has insufficient resources to complete the request',
      status_code: 507 as HttpStatusCode,
      context: {
        resource: 'memory',
        usage: '98%',
        limit: '2GB',
        recommendation: 'Reduce concurrent operations or increase server resources'
      }
    },
    description: 'Server resource limitation scenarios',
    testCases: [
      'Memory exhaustion during large dataset operations',
      'Disk space limitations',
      'CPU throttling scenarios'
    ]
  }
} as const

// =============================================================================
// AUTHENTICATION AND AUTHORIZATION ERROR SCENARIOS
// =============================================================================

/**
 * Authentication failure scenarios for security testing
 * Tests Next.js middleware integration and token validation
 */
export const authErrorScenarios = {
  /**
   * Expired session token
   * Tests token refresh and re-authentication workflows
   */
  expiredToken: {
    statusCode: 401 as HttpStatusCode,
    error: {
      code: 'TOKEN_EXPIRED',
      message: 'Session token has expired and must be refreshed',
      status_code: 401 as HttpStatusCode,
      context: {
        tokenType: 'session',
        expiredAt: '2024-01-15T09:30:00.000Z',
        refreshable: true,
        redirectUrl: '/login'
      }
    },
    description: 'Session token expiration handling',
    testCases: [
      'Automatic token refresh attempts',
      'Redirect to login workflow',
      'Preserved navigation state',
      'Form data recovery after re-auth'
    ]
  },

  /**
   * Invalid API key
   * Tests API key validation and rotation scenarios
   */
  invalidApiKey: {
    statusCode: 401 as HttpStatusCode,
    error: {
      code: 'INVALID_API_KEY',
      message: 'Provided API key is invalid or has been revoked',
      status_code: 401 as HttpStatusCode,
      context: {
        keyId: 'df_api_key_****1234',
        revokedAt: '2024-01-14T15:20:00.000Z',
        reason: 'security_violation'
      }
    },
    description: 'API key validation and revocation',
    testCases: [
      'Revoked API key handling',
      'Malformed API key rejection',
      'Rate-limited API key scenarios'
    ]
  },

  /**
   * Insufficient permissions
   * Tests role-based access control enforcement
   */
  insufficientPermissions: {
    statusCode: 403 as HttpStatusCode,
    error: {
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'User does not have sufficient permissions to perform this action',
      status_code: 403 as HttpStatusCode,
      context: {
        requiredPermission: 'scheduler.task.create',
        userPermissions: ['scheduler.task.read', 'scheduler.task.update'],
        role: 'scheduler_user',
        suggestedAction: 'Contact administrator to request scheduler creation permissions'
      }
    },
    description: 'Permission-based access control',
    testCases: [
      'Task creation permission denial',
      'Service modification restrictions',
      'Administrative function blocking',
      'Read-only user limitations'
    ]
  },

  /**
   * Account locked/suspended
   * Tests account status validation
   */
  accountLocked: {
    statusCode: 403 as HttpStatusCode,
    error: {
      code: 'ACCOUNT_LOCKED',
      message: 'User account has been locked due to security policy violation',
      status_code: 403 as HttpStatusCode,
      context: {
        lockReason: 'multiple_failed_attempts',
        lockedAt: '2024-01-15T08:45:00.000Z',
        unlockAt: '2024-01-15T12:45:00.000Z',
        supportContact: 'security@dreamfactory.com'
      }
    },
    description: 'Account security and lockout handling',
    testCases: [
      'Failed login attempt handling',
      'Security policy violation responses',
      'Account recovery workflows'
    ]
  }
} as const

// =============================================================================
// LOADING STATE SCENARIOS
// =============================================================================

/**
 * Loading state scenarios with realistic delays
 * Tests skeleton components, loading spinners, and progressive enhancement
 */
export const loadingStateScenarios = {
  /**
   * Initial page load with staggered data loading
   * Tests progressive enhancement and skeleton UI
   */
  initialPageLoad: {
    services: {
      delay: 800,
      description: 'Service list loading with cache warm-up',
      phases: [
        { phase: 'cache_check', duration: 100 },
        { phase: 'network_request', duration: 500 },
        { phase: 'data_transform', duration: 150 },
        { phase: 'ui_hydration', duration: 50 }
      ]
    },
    tasks: {
      delay: 1200,
      description: 'Scheduler tasks with pagination and filtering',
      phases: [
        { phase: 'permission_check', duration: 200 },
        { phase: 'query_execution', duration: 700 },
        { phase: 'relationship_loading', duration: 250 },
        { phase: 'cache_population', duration: 50 }
      ]
    },
    metadata: {
      delay: 400,
      description: 'User preferences and configuration loading',
      phases: [
        { phase: 'user_profile', duration: 200 },
        { phase: 'preferences_sync', duration: 150 },
        { phase: 'theme_application', duration: 50 }
      ]
    }
  },

  /**
   * Background refresh scenarios
   * Tests stale-while-revalidate patterns and cache updates
   */
  backgroundRefresh: {
    staleDataPresent: true,
    refreshDelay: 2000,
    description: 'Background data refresh with stale data display',
    cacheStrategy: 'stale-while-revalidate',
    phases: [
      { phase: 'serve_stale', duration: 0 },
      { phase: 'background_fetch', duration: 1500 },
      { phase: 'cache_update', duration: 300 },
      { phase: 'ui_update', duration: 200 }
    ]
  },

  /**
   * Form submission with optimistic updates
   * Tests loading states during mutations with rollback capability
   */
  formSubmission: {
    optimisticUpdate: true,
    delay: 1500,
    description: 'Task creation with optimistic UI updates',
    phases: [
      { phase: 'optimistic_update', duration: 50 },
      { phase: 'validation', duration: 200 },
      { phase: 'server_processing', duration: 1000 },
      { phase: 'cache_invalidation', duration: 150 },
      { phase: 'confirmation', duration: 100 }
    ],
    rollbackScenario: {
      enabled: true,
      triggerAt: 'server_processing',
      rollbackDuration: 300
    }
  },

  /**
   * Large dataset loading with progressive rendering
   * Tests virtual scrolling and chunked data loading
   */
  largeDatasetLoad: {
    totalItems: 1500,
    chunkSize: 50,
    initialLoadDelay: 600,
    subsequentChunkDelay: 200,
    description: 'Large scheduler task dataset with virtual scrolling',
    phases: [
      { phase: 'initial_chunk', duration: 600, items: 50 },
      { phase: 'virtual_scroll_setup', duration: 100 },
      { phase: 'progressive_loading', duration: 200, itemsPerChunk: 50 }
    ],
    virtualScrolling: {
      enabled: true,
      itemHeight: 64,
      overscan: 10,
      threshold: 0.8
    }
  }
} as const

// =============================================================================
// EDGE CASE SCENARIOS
// =============================================================================

/**
 * Edge case scenarios covering unusual but valid conditions
 * Tests application robustness and error recovery
 */
export const edgeCaseScenarios = {
  /**
   * Empty state scenarios
   * Tests no-data conditions and first-time user experiences
   */
  emptyStates: {
    noTasks: {
      response: createMockApiResponse([], { list: true }),
      description: 'No scheduler tasks exist for the user',
      testCases: [
        'First-time user onboarding',
        'Empty search results',
        'Filtered view with no matches',
        'After bulk deletion operations'
      ],
      uiElements: [
        'Empty state illustration',
        'Create task call-to-action',
        'Documentation links',
        'Import/example options'
      ]
    },

    noServices: {
      response: createMockApiResponse([], { list: true }),
      description: 'No services available for task creation',
      testCases: [
        'Fresh installation state',
        'All services deleted',
        'Permission-filtered empty list',
        'Service connection failures'
      ],
      uiElements: [
        'Service creation guidance',
        'Setup wizard launch',
        'Documentation links',
        'Support contact information'
      ]
    },

    noSearchResults: {
      query: 'nonexistent-task-name',
      response: createMockApiResponse([], { list: true }),
      description: 'Search query returns no matching results',
      testCases: [
        'Typo in search terms',
        'Overly specific filters',
        'Case sensitivity issues',
        'Special character handling'
      ]
    }
  },

  /**
   * Deleted service scenarios
   * Tests orphaned task handling and data integrity
   */
  deletedServiceScenarios: {
    orphanedTask: {
      task: createMockSchedulerTask({
        id: 999,
        name: 'Orphaned Task',
        serviceId: 9999, // Non-existent service ID
        serviceByServiceId: null as any,
        metadata: {
          successCount: 0,
          errorCount: 15,
          avgExecutionTime: 0,
          lastFailure: '2024-01-15T10:00:00.000Z'
        }
      }),
      description: 'Task references deleted service',
      testCases: [
        'Service deletion cleanup verification',
        'Orphaned task identification',
        'Bulk cleanup operations',
        'Data integrity validation'
      ]
    },

    serviceDeletedDuringEdit: {
      scenario: 'concurrent_deletion',
      task: mockSchedulerTaskData,
      error: {
        code: 'SERVICE_NOT_FOUND',
        message: 'Referenced service was deleted while editing task',
        status_code: 404 as HttpStatusCode,
        context: {
          serviceId: 5,
          deletedAt: '2024-01-15T10:30:00.000Z',
          deletedBy: 'admin@example.com'
        }
      },
      description: 'Service deleted during active task editing',
      testCases: [
        'Concurrent user deletion conflicts',
        'Real-time data synchronization',
        'Conflict resolution workflows'
      ]
    }
  },

  /**
   * Concurrent modification scenarios
   * Tests optimistic update conflicts and resolution
   */
  concurrentModificationScenarios: {
    optimisticUpdateConflict: {
      localChanges: {
        name: 'Updated Task Name (Local)',
        description: 'Local changes made by current user',
        frequency: 60,
        lastModifiedDate: '2024-01-15T10:35:00.000Z'
      },
      serverChanges: {
        name: 'Updated Task Name (Server)',
        description: 'Concurrent changes made by another user',
        frequency: 120,
        lastModifiedDate: '2024-01-15T10:36:00.000Z'
      },
      conflict: {
        code: 'CONCURRENT_MODIFICATION',
        message: 'Task was modified by another user while you were editing',
        status_code: 409 as HttpStatusCode,
        context: {
          lastKnownVersion: '2024-01-15T10:30:00.000Z',
          currentVersion: '2024-01-15T10:36:00.000Z',
          conflictingFields: ['name', 'description', 'frequency'],
          otherUser: 'colleague@example.com'
        }
      },
      description: 'Multiple users editing same task simultaneously',
      resolutionOptions: [
        'Keep local changes',
        'Accept server changes',
        'Merge changes manually',
        'Create new task with local changes'
      ]
    },

    rapidSuccessiveUpdates: {
      updates: [
        { field: 'name', value: 'Rapid Update 1', timestamp: '2024-01-15T10:40:00.000Z' },
        { field: 'frequency', value: 30, timestamp: '2024-01-15T10:40:01.000Z' },
        { field: 'description', value: 'Rapid Update 2', timestamp: '2024-01-15T10:40:02.000Z' },
        { field: 'isActive', value: false, timestamp: '2024-01-15T10:40:03.000Z' }
      ],
      description: 'Rapid successive updates testing debouncing and queuing',
      testCases: [
        'Debounced save operations',
        'Update queuing and batching',
        'Race condition prevention',
        'State consistency maintenance'
      ]
    }
  },

  /**
   * Data corruption and recovery scenarios
   * Tests data integrity and error recovery mechanisms
   */
  dataCorruptionScenarios: {
    invalidTaskData: {
      corruptedTask: {
        ...mockSchedulerTaskData,
        payload: '{"invalid": json syntax}', // Intentionally malformed JSON
        verbMask: -1, // Invalid verb mask
        frequency: 0, // Invalid frequency
        serviceByServiceId: undefined as any // Missing required relationship
      },
      description: 'Task data corrupted or incomplete',
      recoveryOptions: [
        'Reset to last known good state',
        'Attempt automatic data repair',
        'Manual data correction workflow',
        'Archive corrupted data and create new'
      ]
    },

    databaseConstraintViolation: {
      error: {
        code: 'CONSTRAINT_VIOLATION',
        message: 'Database constraint violation during task operation',
        status_code: 500 as HttpStatusCode,
        context: {
          constraint: 'unique_task_name_per_service',
          table: 'scheduler_tasks',
          conflictingValue: 'existing-task-name',
          suggestion: 'Choose a different task name'
        }
      },
      description: 'Database-level constraint and integrity violations'
    }
  }
} as const

// =============================================================================
// LARGE DATASET SCENARIOS
// =============================================================================

/**
 * Large dataset scenarios for performance and scalability testing
 * Tests virtual scrolling, pagination, and memory management
 */
export const largeDatasetScenarios = {
  /**
   * Generate 1000+ scheduler tasks for performance testing
   * Tests virtual scrolling and memory optimization
   */
  thousandTasks: (() => {
    const tasks: SchedulerTaskDataWithMetadata[] = []
    const services = mockServices.slice() // Copy to avoid mutation
    
    // Generate additional services for variety
    for (let serviceIndex = 0; serviceIndex < 10; serviceIndex++) {
      services.push(createMockService({
        id: 100 + serviceIndex,
        name: `bulk_service_${serviceIndex}`,
        label: `Bulk Test Service ${serviceIndex}`,
        type: serviceIndex % 2 === 0 ? 'database' : 'http',
        isActive: serviceIndex % 3 !== 0 // Some inactive services
      }))
    }
    
    // Generate 1500 tasks across various services
    for (let i = 0; i < 1500; i++) {
      const service = services[i % services.length]
      const baseDate = new Date('2024-01-01T00:00:00.000Z')
      const createdDate = new Date(baseDate.getTime() + (i * 60000)) // 1 minute intervals
      
      tasks.push(createMockSchedulerTask({
        id: 1000 + i,
        name: `bulk_task_${i.toString().padStart(4, '0')}`,
        description: `Bulk generated task ${i} for performance testing`,
        serviceId: service.id,
        component: i % 5 === 0 ? '*' : `table_${i % 10}`,
        frequency: Math.floor(Math.random() * 1440) + 5, // 5 minutes to 24 hours
        isActive: i % 7 !== 0, // Some inactive tasks
        verbMask: Math.floor(Math.random() * 31) + 1, // Random verb combinations
        createdDate: createdDate.toISOString(),
        lastModifiedDate: new Date(createdDate.getTime() + Math.floor(Math.random() * 86400000)).toISOString(),
        serviceByServiceId: service,
        metadata: {
          successCount: Math.floor(Math.random() * 1000),
          errorCount: Math.floor(Math.random() * 50),
          avgExecutionTime: Math.floor(Math.random() * 5000) + 100,
          lastSuccess: i % 3 === 0 ? new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString() : undefined,
          lastFailure: i % 5 === 0 ? new Date(Date.now() - Math.floor(Math.random() * 43200000)).toISOString() : undefined
        },
        _cacheMetadata: {
          queryKey: ['scheduler', 'tasks', 1000 + i],
          relatedKeys: [
            ['scheduler', 'tasks'],
            ['services', service.id],
            ['scheduler', 'tasks', 'by-service', service.id]
          ],
          mutations: {
            updating: false,
            deleting: false,
            executing: Math.random() < 0.05 // 5% chance of being in execution state
          }
        }
      }))
    }
    
    return {
      tasks,
      response: createMockApiResponse(tasks, { 
        list: true, 
        meta: {
          count: tasks.length,
          offset: 0,
          limit: 50, // Standard page size
          has_next: true,
          has_previous: false,
          page_count: Math.ceil(tasks.length / 50)
        }
      }),
      description: 'Large dataset with 1500+ scheduler tasks',
      performanceMetrics: {
        expectedRenderTime: 16, // Target 16ms per frame (60 FPS)
        memoryUsage: '< 100MB',
        initialLoadTime: '< 2 seconds',
        scrollingPerformance: '60 FPS'
      },
      testCases: [
        'Virtual scrolling performance',
        'Memory usage optimization',
        'Search and filter performance',
        'Bulk operations handling',
        'Cache invalidation impact',
        'State management scaling'
      ]
    }
  })(),

  /**
   * Paginated loading scenarios
   * Tests infinite scroll and page-based pagination
   */
  paginatedLoading: {
    pageSize: 50,
    totalPages: 30,
    totalItems: 1500,
    
    generatePage: (pageNumber: number, pageSize: number = 50) => {
      const offset = pageNumber * pageSize
      const tasks = largeDatasetScenarios.thousandTasks.tasks.slice(offset, offset + pageSize)
      
      return createMockApiResponse(tasks, {
        list: true,
        meta: {
          count: largeDatasetScenarios.thousandTasks.tasks.length,
          offset,
          limit: pageSize,
          has_next: offset + pageSize < largeDatasetScenarios.thousandTasks.tasks.length,
          has_previous: pageNumber > 0,
          page_count: Math.ceil(largeDatasetScenarios.thousandTasks.tasks.length / pageSize),
          links: {
            first: `/api/v2/scheduler?offset=0&limit=${pageSize}`,
            last: `/api/v2/scheduler?offset=${Math.floor(largeDatasetScenarios.thousandTasks.tasks.length / pageSize) * pageSize}&limit=${pageSize}`,
            next: offset + pageSize < largeDatasetScenarios.thousandTasks.tasks.length 
              ? `/api/v2/scheduler?offset=${offset + pageSize}&limit=${pageSize}` 
              : null,
            previous: pageNumber > 0 
              ? `/api/v2/scheduler?offset=${Math.max(0, offset - pageSize)}&limit=${pageSize}` 
              : null
          }
        }
      })
    },

    infiniteScrollScenario: {
      initialLoad: 3, // Load first 3 pages initially
      triggerThreshold: 0.8, // Load next page when 80% scrolled
      description: 'Infinite scroll with progressive loading',
      testCases: [
        'Smooth infinite scrolling',
        'Page boundary handling',
        'Loading state management',
        'Error recovery during scroll',
        'Cache management for large datasets'
      ]
    }
  },

  /**
   * Heavy filtering and search scenarios
   * Tests performance with complex queries on large datasets
   */
  heavyFilteringScenarios: {
    complexFilters: {
      active: true,
      serviceTypes: ['database', 'http'],
      frequencyRange: { min: 60, max: 1440 },
      dateRange: {
        start: '2024-01-01T00:00:00.000Z',
        end: '2024-01-15T23:59:59.000Z'
      },
      textSearch: 'bulk_task',
      hasErrors: false
    },

    searchPerformance: {
      queries: [
        'bulk_task_0001', // Exact match
        'bulk_task_00', // Prefix match
        'task', // Broad match
        'nonexistent', // No results
        'bulk_task_0001 OR bulk_task_0002', // Complex query
        'frequency:>60 AND service:database' // Field-specific search
      ],
      expectedResponseTimes: {
        exact: '< 50ms',
        prefix: '< 100ms',
        broad: '< 200ms',
        noResults: '< 30ms',
        complex: '< 150ms',
        fieldSpecific: '< 100ms'
      }
    }
  }
} as const

// =============================================================================
// REAL-TIME SCENARIOS
// =============================================================================

/**
 * Real-time data synchronization scenarios
 * Tests WebSocket updates, conflict resolution, and live data sync
 */
export const realTimeScenarios = {
  /**
   * Live task execution monitoring
   * Tests real-time status updates and log streaming
   */
  liveTaskExecution: {
    taskId: 15,
    executionSteps: [
      {
        step: 'initialized',
        timestamp: '2024-01-15T10:45:00.000Z',
        status: 'running',
        message: 'Task execution initialized'
      },
      {
        step: 'service_connection',
        timestamp: '2024-01-15T10:45:01.500Z',
        status: 'running',
        message: 'Connecting to service endpoint'
      },
      {
        step: 'request_execution',
        timestamp: '2024-01-15T10:45:03.200Z',
        status: 'running',
        message: 'Executing API request'
      },
      {
        step: 'response_processing',
        timestamp: '2024-01-15T10:45:05.800Z',
        status: 'running',
        message: 'Processing API response'
      },
      {
        step: 'completed',
        timestamp: '2024-01-15T10:45:06.100Z',
        status: 'success',
        message: 'Task execution completed successfully',
        result: {
          statusCode: 200,
          responseTime: 6100,
          recordsProcessed: 42
        }
      }
    ],
    description: 'Real-time task execution monitoring with live updates'
  },

  /**
   * Multi-user collaboration scenarios
   * Tests concurrent editing and conflict resolution
   */
  multiUserCollaboration: {
    users: [
      { id: 1, name: 'Alice Admin', color: '#3B82F6' },
      { id: 2, name: 'Bob Developer', color: '#10B981' },
      { id: 3, name: 'Carol Manager', color: '#F59E0B' }
    ],
    
    editingSessions: [
      {
        userId: 1,
        taskId: 15,
        startTime: '2024-01-15T10:40:00.000Z',
        currentField: 'description',
        changes: ['frequency', 'description'],
        cursorPosition: { line: 2, column: 15 }
      },
      {
        userId: 2,
        taskId: 15,
        startTime: '2024-01-15T10:41:30.000Z',
        currentField: 'payload',
        changes: ['payload'],
        cursorPosition: { line: 8, column: 22 }
      }
    ],
    
    description: 'Multiple users editing same task with real-time collaboration'
  }
} as const

// =============================================================================
// PERFORMANCE BENCHMARK SCENARIOS
// =============================================================================

/**
 * Performance benchmark scenarios for testing optimization
 * Establishes performance baselines and regression testing
 */
export const performanceBenchmarkScenarios = {
  /**
   * Component rendering performance
   */
  renderingBenchmarks: {
    smallDataset: {
      itemCount: 10,
      expectedRenderTime: '< 50ms',
      description: 'Small task list rendering performance'
    },
    mediumDataset: {
      itemCount: 100,
      expectedRenderTime: '< 200ms',
      description: 'Medium task list rendering performance'
    },
    largeDataset: {
      itemCount: 1000,
      expectedRenderTime: '< 500ms',
      description: 'Large task list with virtualization'
    },
    massiveDataset: {
      itemCount: 10000,
      expectedRenderTime: '< 1000ms',
      description: 'Massive dataset with aggressive virtualization'
    }
  },

  /**
   * API response time benchmarks
   */
  apiResponseBenchmarks: {
    taskList: {
      cold: '< 2000ms', // First load without cache
      warm: '< 500ms',  // Subsequent loads with cache
      stale: '< 100ms'  // Stale data served immediately
    },
    taskDetail: {
      cold: '< 1000ms',
      warm: '< 200ms',
      stale: '< 50ms'
    },
    taskCreation: {
      optimistic: '< 50ms',  // Optimistic update
      confirmed: '< 2000ms', // Server confirmation
      rollback: '< 200ms'    // Rollback on error
    }
  }
} as const

// =============================================================================
// EXPORTED SCENARIO COLLECTIONS
// =============================================================================

/**
 * Complete error scenarios collection for MSW handlers
 */
export const errorScenarios = {
  network: networkErrorScenarios,
  validation: validationErrorScenarios,
  server: serverErrorScenarios,
  auth: authErrorScenarios
} as const

/**
 * Complete edge case scenarios collection
 */
export const edgeScenarios = {
  empty: edgeCaseScenarios.emptyStates,
  deleted: edgeCaseScenarios.deletedServiceScenarios,
  concurrent: edgeCaseScenarios.concurrentModificationScenarios,
  corruption: edgeCaseScenarios.dataCorruptionScenarios
} as const

/**
 * All loading state scenarios
 */
export const loadingScenarios = loadingStateScenarios

/**
 * All large dataset testing scenarios
 */
export const datasetScenarios = largeDatasetScenarios

/**
 * All real-time collaboration scenarios
 */
export const collaborationScenarios = realTimeScenarios

/**
 * All performance testing scenarios
 */
export const performanceScenarios = performanceBenchmarkScenarios

/**
 * Default export with all scenario categories
 */
export default {
  errors: errorScenarios,
  loading: loadingScenarios,
  edge: edgeScenarios,
  datasets: datasetScenarios,
  realtime: collaborationScenarios,
  performance: performanceScenarios
}

/**
 * Utility function to get specific scenario by name
 * Enables dynamic scenario selection in tests
 */
export const getScenario = (category: string, scenario: string): any => {
  const scenarios = {
    error: errorScenarios,
    loading: loadingScenarios,
    edge: edgeScenarios,
    dataset: datasetScenarios,
    realtime: collaborationScenarios,
    performance: performanceScenarios
  } as const

  return (scenarios as any)[category]?.[scenario]
}

/**
 * Scenario validation helper for testing framework integration
 */
export const validateScenario = (scenario: any): boolean => {
  return !!(scenario && (scenario.description || scenario.testCases || scenario.error))
}

/**
 * @example
 * // Import specific scenarios
 * import { errorScenarios, loadingScenarios } from './scenarios'
 * 
 * // Use in MSW handlers
 * rest.get('/api/v2/scheduler', (req, res, ctx) => {
 *   const errorType = req.url.searchParams.get('error')
 *   if (errorType === 'network') {
 *     return res.networkError(errorScenarios.network.requestTimeout.error)
 *   }
 *   return res(ctx.json(datasetScenarios.thousandTasks.response))
 * })
 * 
 * // Use in React Query tests
 * const { result } = renderHook(() => useSchedulerTasks(), {
 *   wrapper: createQueryWrapper(loadingScenarios.initialPageLoad)
 * })
 */