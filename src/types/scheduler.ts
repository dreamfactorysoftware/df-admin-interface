/**
 * Scheduler Management Types for DreamFactory Admin Interface
 * 
 * This module provides comprehensive TypeScript definitions for scheduler task management,
 * task execution, logging, and workflow orchestration within the DreamFactory platform.
 * Supports React Query optimization and server-side rendering capabilities.
 * 
 * Features:
 * - Scheduler task configuration and management
 * - Task execution history and logging
 * - Frequency and timing configuration
 * - Service integration for scheduled operations
 * - React Hook Form validation schemas
 * - MSW mock response types for testing
 */

import { z } from 'zod';
import type { Service } from './services';
import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';

// ============================================================================
// CORE SCHEDULER TYPES
// ============================================================================

/**
 * HTTP methods supported for scheduled tasks
 */
export const SchedulerHttpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export type SchedulerHttpMethod = typeof SchedulerHttpMethods[number];

/**
 * Task frequency types for scheduler configuration
 */
export type SchedulerFrequency = number; // Frequency in seconds

/**
 * Task status types
 */
export const TaskStatuses = [
  'active',
  'inactive',
  'paused',
  'completed',
  'failed',
  'running'
] as const;
export type TaskStatus = typeof TaskStatuses[number];

/**
 * Task log status codes
 */
export const TaskLogStatusCodes = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for task frequency validation
 */
export const SchedulerFrequencyValidator = z.number()
  .min(1, 'Frequency must be at least 1 second')
  .max(2147483647, 'Frequency must be less than 2,147,483,647 seconds');

/**
 * Zod schema for HTTP verb mask validation
 */
export const VerbMaskValidator = z.number()
  .min(1, 'Verb mask must be at least 1')
  .max(31, 'Verb mask must be at most 31');

/**
 * Zod schema for JSON payload validation
 */
export const JsonPayloadValidator = z.string()
  .optional()
  .refine((val) => {
    if (!val || val.trim() === '') return true;
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, 'Payload must be valid JSON');

/**
 * Scheduler task creation validation schema
 */
export const SchedulerTaskCreateValidator = z.object({
  name: z.string()
    .min(1, 'Task name is required')
    .max(255, 'Task name must be 255 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_\-\s]*$/, 'Task name must start with a letter and contain only letters, numbers, spaces, underscores, and hyphens'),
  description: z.string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
  serviceId: z.number()
    .min(1, 'Service ID is required and must be a positive number'),
  serviceName: z.string()
    .min(1, 'Service name is required'),
  component: z.string()
    .min(1, 'Component is required'),
  verb: z.enum(SchedulerHttpMethods),
  verbMask: VerbMaskValidator,
  frequency: SchedulerFrequencyValidator,
  payload: JsonPayloadValidator,
  service: z.object({
    id: z.number(),
    name: z.string(),
    label: z.string(),
    description: z.string(),
    type: z.string(),
    components: z.array(z.string())
  })
});

/**
 * Scheduler task update validation schema
 */
export const SchedulerTaskUpdateValidator = SchedulerTaskCreateValidator.extend({
  id: z.number().min(1),
  createdDate: z.string(),
  createdById: z.number(),
  lastModifiedDate: z.string().optional(),
  lastModifiedById: z.number().optional().nullable(),
  hasLog: z.boolean().optional(),
  taskLogByTaskId: z.object({
    taskId: z.number(),
    statusCode: z.number(),
    lastModifiedDate: z.string(),
    createdDate: z.string(),
    content: z.string()
  }).optional().nullable()
});

/**
 * Task log validation schema
 */
export const TaskLogValidator = z.object({
  taskId: z.number().min(1),
  statusCode: z.number(),
  lastModifiedDate: z.string(),
  createdDate: z.string(),
  content: z.string()
});

// ============================================================================
// SCHEDULER TASK INTERFACES
// ============================================================================

/**
 * Core scheduler task interface
 */
export interface SchedulerTask {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  serviceId: number;
  component: string;
  frequency: number;
  payload: string | null;
  createdDate: string;
  lastModifiedDate: string;
  createdById: number;
  lastModifiedById: number | null;
  verb: SchedulerHttpMethod;
  verbMask: number;
  taskLogByTaskId: TaskLog | null;
  serviceByServiceId: Service;
}

/**
 * Alias for backward compatibility
 */
export type SchedulerTaskData = SchedulerTask;

/**
 * Task log interface
 */
export interface TaskLog {
  taskId: number;
  statusCode: number;
  lastModifiedDate: string;
  createdDate: string;
  content: string;
}

/**
 * Create scheduler task payload
 */
export interface CreateSchedulePayload {
  id: number | null;
  name: string;
  description: string | null;
  isActive: boolean;
  serviceId: number;
  serviceName: string;
  component: string;
  verb: SchedulerHttpMethod;
  verbMask: number;
  frequency: number;
  payload: string | null;
  service: {
    id: number;
    name: string;
    label: string;
    description: string;
    type: string;
    components: string[];
  };
}

/**
 * Update scheduler task payload
 */
export interface UpdateSchedulePayload extends CreateSchedulePayload {
  id: number;
  createdById: number;
  createdDate: string;
  lastModifiedById: number | null;
  lastModifiedDate: string;
  hasLog: boolean;
  taskLogByTaskId: TaskLog | null;
}

/**
 * Scheduler task for table display
 */
export interface SchedulerTaskRow {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  serviceId: number;
  serviceName: string;
  component: string;
  verb: SchedulerHttpMethod;
  frequency: number;
  hasLog: boolean;
  lastRun?: string;
  nextRun?: string;
  status?: TaskStatus;
}

// ============================================================================
// TASK EXECUTION INTERFACES
// ============================================================================

/**
 * Task execution configuration
 */
export interface TaskExecutionConfig {
  taskId: number;
  executeNow: boolean;
  overrideFrequency?: number;
  overridePayload?: string;
  timeout?: number;
  retryCount?: number;
}

/**
 * Task execution result
 */
export interface TaskExecutionResult {
  taskId: number;
  success: boolean;
  statusCode: number;
  executionTime: number;
  responseData?: any;
  errorMessage?: string;
  timestamp: string;
}

/**
 * Task execution history
 */
export interface TaskExecutionHistory {
  taskId: number;
  executions: TaskExecutionResult[];
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  averageExecutionTime: number;
  lastExecution?: TaskExecutionResult;
}

// ============================================================================
// SCHEDULER SERVICE INTERFACES
// ============================================================================

/**
 * Scheduler service configuration
 */
export interface SchedulerServiceConfig {
  enabled: boolean;
  maxConcurrentTasks: number;
  defaultTimeout: number;
  retryAttempts: number;
  cleanupInterval: number;
  logRetentionDays: number;
}

/**
 * Scheduler service status
 */
export interface SchedulerServiceStatus {
  isRunning: boolean;
  activeTasks: number;
  queuedTasks: number;
  lastHeartbeat: string;
  uptime: number;
  version: string;
}

/**
 * Scheduler metrics
 */
export interface SchedulerMetrics {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
  tasksPerHour: number;
  errorRate: number;
  lastUpdated: string;
}

// ============================================================================
// COMPONENT DISCOVERY INTERFACES
// ============================================================================

/**
 * Service component information
 */
export interface ServiceComponent {
  name: string;
  path: string;
  methods: SchedulerHttpMethod[];
  parameters?: ComponentParameter[];
  description?: string;
  deprecated?: boolean;
}

/**
 * Component parameter definition
 */
export interface ComponentParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
  example?: any;
  enum?: string[];
}

/**
 * Service access list response
 */
export interface ServiceAccessList {
  serviceName: string;
  components: string[];
  metadata?: {
    totalComponents: number;
    lastDiscovered: string;
    serviceVersion: string;
  };
}

// ============================================================================
// REACT QUERY INTEGRATION TYPES
// ============================================================================

/**
 * Scheduler query keys for React Query
 */
export const SchedulerQueryKeys = {
  all: ['scheduler'] as const,
  tasks: () => [...SchedulerQueryKeys.all, 'tasks'] as const,
  task: (id: number) => [...SchedulerQueryKeys.tasks(), id] as const,
  taskList: (filters: TaskListFilters) => [...SchedulerQueryKeys.tasks(), 'list', filters] as const,
  taskLogs: (taskId: number) => [...SchedulerQueryKeys.all, 'logs', taskId] as const,
  serviceComponents: (serviceName: string) => [...SchedulerQueryKeys.all, 'components', serviceName] as const,
  servicesList: () => [...SchedulerQueryKeys.all, 'services'] as const,
  status: () => [...SchedulerQueryKeys.all, 'status'] as const,
  metrics: () => [...SchedulerQueryKeys.all, 'metrics'] as const,
} as const;

/**
 * Task list filters
 */
export interface TaskListFilters {
  isActive?: boolean;
  serviceId?: number;
  search?: string;
  status?: TaskStatus;
  sortBy?: 'name' | 'frequency' | 'lastModifiedDate' | 'createdDate';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Task list response
 */
export interface TaskListResponse {
  resource: SchedulerTaskRow[];
  meta: {
    count: number;
    limit: number;
    offset: number;
  };
}

/**
 * Scheduler mutation types
 */
export type SchedulerMutationType = 'create' | 'update' | 'delete' | 'execute' | 'toggle';

/**
 * Scheduler mutation options
 */
export interface SchedulerMutationOptions<T = any> extends Omit<UseMutationOptions<T>, 'mutationFn'> {
  optimistic?: boolean;
  invalidateQueries?: boolean;
  showSuccessMessage?: boolean;
  showErrorMessage?: boolean;
}

/**
 * Scheduler query options
 */
export interface SchedulerQueryOptions<T = any> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  refetchOnReconnect?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

// ============================================================================
// NEXT.JS API ROUTE TYPES
// ============================================================================

/**
 * Next.js API route handler types for scheduler
 */
export interface SchedulerAPIRouteContext {
  params: {
    taskId?: string;
    action?: string;
  };
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
}

/**
 * Scheduler API response
 */
export interface SchedulerAPIResponse<T = any> {
  success: boolean;
  resource?: T;
  meta?: {
    count?: number;
    limit?: number;
    offset?: number;
  };
  error?: {
    code: string;
    message: string;
    context?: any;
  };
}

// ============================================================================
// FORM INTERFACES
// ============================================================================

/**
 * Scheduler task form data
 */
export interface SchedulerTaskFormData {
  name: string;
  description: string;
  active: boolean;
  serviceId: number;
  component: string;
  method: SchedulerHttpMethod;
  frequency: number;
  payload?: string;
}

/**
 * Scheduler task form props
 */
export interface SchedulerTaskFormProps {
  task?: SchedulerTask;
  services: Service[];
  onSubmit: (data: SchedulerTaskFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

/**
 * Service component selector props
 */
export interface ServiceComponentSelectorProps {
  serviceId: number;
  serviceName: string;
  selectedComponent?: string;
  onComponentSelect: (component: string) => void;
  disabled?: boolean;
}

// ============================================================================
// TESTING AND MOCK TYPES
// ============================================================================

/**
 * Mock scheduler task for testing
 */
export interface MockSchedulerTask extends SchedulerTask {
  _mockId?: string;
  _testScenario?: 'success' | 'error' | 'timeout';
}

/**
 * MSW response helpers for scheduler
 */
export interface SchedulerMockResponse {
  success: boolean;
  delay?: number;
  statusCode?: number;
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Test scenarios for scheduler operations
 */
export type SchedulerTestScenario = 
  | 'task_creation_success'
  | 'task_creation_validation_error'
  | 'task_update_success'
  | 'task_update_not_found'
  | 'task_deletion_success'
  | 'task_deletion_not_found'
  | 'task_list_success'
  | 'task_list_empty'
  | 'service_components_success'
  | 'service_components_error'
  | 'task_execution_success'
  | 'task_execution_failure'
  | 'network_error'
  | 'server_error';

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Verb mask utility functions
 */
export const VerbMaskUtils = {
  fromVerb: (verb: SchedulerHttpMethod): number => {
    const masks = {
      'GET': 1,
      'POST': 2,
      'PUT': 4,
      'PATCH': 8,
      'DELETE': 16
    };
    return masks[verb] || 1;
  },
  
  toVerb: (mask: number): SchedulerHttpMethod => {
    const verbs: Record<number, SchedulerHttpMethod> = {
      1: 'GET',
      2: 'POST',
      4: 'PUT',
      8: 'PATCH',
      16: 'DELETE'
    };
    return verbs[mask] || 'GET';
  },
  
  hasVerb: (mask: number, verb: SchedulerHttpMethod): boolean => {
    return (mask & VerbMaskUtils.fromVerb(verb)) !== 0;
  }
};

/**
 * Frequency utility functions
 */
export const FrequencyUtils = {
  toHumanReadable: (seconds: number): string => {
    if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    const days = Math.floor(seconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''}`;
  },
  
  fromHumanReadable: (value: number, unit: 'seconds' | 'minutes' | 'hours' | 'days'): number => {
    const multipliers = {
      seconds: 1,
      minutes: 60,
      hours: 3600,
      days: 86400
    };
    return value * multipliers[unit];
  }
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Re-export Zod validators for external use
export {
  SchedulerTaskCreateValidator,
  SchedulerTaskUpdateValidator,
  TaskLogValidator,
  SchedulerFrequencyValidator,
  VerbMaskValidator,
  JsonPayloadValidator
};

// Type utilities
export type SchedulerTaskCreateData = z.infer<typeof SchedulerTaskCreateValidator>;
export type SchedulerTaskUpdateData = z.infer<typeof SchedulerTaskUpdateValidator>;
export type TaskLogData = z.infer<typeof TaskLogValidator>;

// Default exports for common types
export type {
  SchedulerTask as DefaultSchedulerTask,
  TaskLog as DefaultTaskLog,
  SchedulerTaskRow as DefaultSchedulerTaskRow,
  CreateSchedulePayload as DefaultCreatePayload,
  UpdateSchedulePayload as DefaultUpdatePayload
};