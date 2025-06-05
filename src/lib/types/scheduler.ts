/**
 * Comprehensive scheduler and task management type definitions for DreamFactory Admin Interface
 * 
 * This module provides type definitions for scheduling operations, task management,
 * and cron job execution. Designed for React 19/Next.js 15.1+ integration
 * with support for React Hook Form validation and modern data fetching patterns.
 * 
 * @fileoverview Scheduler type definitions maintaining full backend compatibility
 * @version 1.0.0
 */

import { z } from 'zod';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import type { Service, ServiceType } from './service';

// =============================================================================
// CORE SCHEDULER TYPES
// =============================================================================

/**
 * Supported schedule frequency types
 * Maps to DreamFactory scheduler service configurations
 */
export type ScheduleFrequency = 
  | 'once'
  | 'minutely'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'cron';

/**
 * Task execution status for real-time UI updates
 * Used with SWR/React Query for task state management
 */
export type TaskStatus = 'idle' | 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';

/**
 * Task priority levels for execution ordering
 * Higher numbers indicate higher priority
 */
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Task execution context types
 * Defines where and how tasks should be executed
 */
export type ExecutionContext = 'api' | 'script' | 'service' | 'email' | 'webhook';

// =============================================================================
// SCHEDULE CONFIGURATION SCHEMAS
// =============================================================================

/**
 * Base schedule configuration interface
 * Common properties for all schedule types
 */
export interface BaseScheduleConfig {
  frequency: ScheduleFrequency;
  start_date?: string;
  end_date?: string;
  timezone?: string;
  max_executions?: number;
  retry_attempts?: number;
  retry_delay?: number; // seconds
  timeout?: number; // seconds
  enabled: boolean;
}

/**
 * Cron-specific schedule configuration
 * Supports standard cron expressions with validation
 */
export interface CronScheduleConfig extends BaseScheduleConfig {
  frequency: 'cron';
  cron_expression: string;
  description?: string;
}

/**
 * Interval-based schedule configuration
 * For minutely, hourly, daily, weekly, monthly, yearly schedules
 */
export interface IntervalScheduleConfig extends BaseScheduleConfig {
  frequency: Exclude<ScheduleFrequency, 'cron' | 'once'>;
  interval: number;
  specific_time?: string; // HH:MM format for daily+ schedules
  specific_day?: number; // Day of week (0-6) for weekly, day of month for monthly
  specific_month?: number; // Month (1-12) for yearly
}

/**
 * One-time schedule configuration
 * For tasks that execute once at a specific time
 */
export interface OnceScheduleConfig extends BaseScheduleConfig {
  frequency: 'once';
  execution_time: string; // ISO 8601 datetime
}

/**
 * Union type for all schedule configurations
 * Used in dynamic form components for type-safe configuration
 */
export type ScheduleConfig = CronScheduleConfig | IntervalScheduleConfig | OnceScheduleConfig;

// =============================================================================
// TASK DEFINITION ENTITIES
// =============================================================================

/**
 * Core task entity matching DreamFactory scheduler structure
 * Maintains complete compatibility with /api/v2/system/scheduler endpoints
 */
export interface ScheduledTask {
  id: number;
  name: string;
  label: string;
  description?: string;
  service_id?: number;
  service?: Service;
  context: ExecutionContext;
  priority: TaskPriority;
  status: TaskStatus;
  is_active: boolean;
  
  // Schedule configuration
  schedule: ScheduleConfig;
  
  // Task payload and parameters
  payload: TaskPayload;
  
  // Execution tracking
  last_execution?: string;
  next_execution?: string;
  execution_count: number;
  success_count: number;
  failure_count: number;
  
  // Metadata
  created_date: string;
  last_modified_date: string;
  created_by_id?: number;
  last_modified_by_id?: number;
  
  // Configuration options
  options?: TaskOptions;
}

/**
 * Simplified task representation for table/listing components
 * Optimized for React virtualization with TanStack Virtual
 */
export interface TaskRow {
  id: number;
  name: string;
  label: string;
  context: ExecutionContext;
  priority: TaskPriority;
  status: TaskStatus;
  is_active: boolean;
  frequency: ScheduleFrequency;
  last_execution?: string;
  next_execution?: string;
  success_rate: number;
  created_date: string;
  error_message?: string;
}

/**
 * Task creation/update payload
 * Used with React Hook Form for task configuration workflows
 */
export interface TaskPayload {
  // API call configuration
  api?: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    headers?: Record<string, string>;
    body?: unknown;
    timeout?: number;
  };
  
  // Script execution configuration
  script?: {
    type: 'php' | 'javascript' | 'python';
    content?: string;
    file_path?: string;
    parameters?: Record<string, unknown>;
  };
  
  // Service operation configuration
  service?: {
    service_name: string;
    operation: string;
    parameters?: Record<string, unknown>;
  };
  
  // Email notification configuration
  email?: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    template_id?: number;
    attachments?: EmailAttachment[];
  };
  
  // Webhook configuration
  webhook?: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH';
    headers?: Record<string, string>;
    body?: unknown;
    secret?: string;
  };
}

/**
 * Email attachment configuration
 */
export interface EmailAttachment {
  name: string;
  content_type: string;
  content: string; // Base64 encoded
  size: number;
}

/**
 * Task execution options and preferences
 */
export interface TaskOptions {
  // Logging configuration
  log_level?: 'debug' | 'info' | 'warning' | 'error';
  log_retention_days?: number;
  
  // Notification settings
  notify_on_success?: boolean;
  notify_on_failure?: boolean;
  notification_email?: string[];
  
  // Execution constraints
  max_concurrent_executions?: number;
  execution_timeout?: number;
  memory_limit?: number;
  
  // Error handling
  stop_on_error?: boolean;
  rollback_on_failure?: boolean;
  
  // Performance settings
  cache_results?: boolean;
  cache_ttl?: number;
}

// =============================================================================
// EXECUTION TRACKING AND RESULTS
// =============================================================================

/**
 * Task execution record for tracking and auditing
 * Maintains execution history with detailed results
 */
export interface TaskExecution {
  id: number;
  task_id: number;
  task_name: string;
  execution_time: string;
  completion_time?: string;
  duration?: number; // milliseconds
  status: TaskStatus;
  exit_code?: number;
  
  // Execution details
  triggered_by: 'schedule' | 'manual' | 'api' | 'webhook';
  triggered_by_user_id?: number;
  
  // Results and output
  result?: unknown;
  output?: string;
  error_message?: string;
  stack_trace?: string;
  
  // Performance metrics
  memory_usage?: number;
  cpu_usage?: number;
  network_requests?: number;
  
  // Metadata
  execution_node?: string;
  execution_environment?: Record<string, unknown>;
}

/**
 * Execution statistics for dashboard display
 * Aggregated metrics for task performance monitoring
 */
export interface ExecutionStatistics {
  task_id: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  average_duration: number;
  success_rate: number;
  last_24h_executions: number;
  last_failure?: string;
  last_success?: string;
  
  // Performance trends
  performance_trend: 'improving' | 'stable' | 'degrading';
  avg_memory_usage: number;
  peak_memory_usage: number;
  avg_cpu_usage: number;
}

// =============================================================================
// SCHEDULER SERVICE CONFIGURATION
// =============================================================================

/**
 * Scheduler service configuration
 * Global settings for the scheduling engine
 */
export interface SchedulerConfig {
  // Engine settings
  enabled: boolean;
  max_concurrent_tasks: number;
  default_timeout: number;
  cleanup_retention_days: number;
  
  // Performance tuning
  poll_interval: number; // seconds
  batch_size: number;
  thread_pool_size: number;
  
  // Error handling
  max_retry_attempts: number;
  retry_backoff_multiplier: number;
  dead_letter_queue_enabled: boolean;
  
  // Monitoring
  metrics_enabled: boolean;
  health_check_interval: number;
  alert_thresholds: {
    failure_rate: number;
    queue_depth: number;
    avg_execution_time: number;
  };
  
  // Security
  api_security_enabled: boolean;
  webhook_signature_validation: boolean;
  execution_sandboxing: boolean;
}

// =============================================================================
// REACT COMPONENT INTEGRATION TYPES
// =============================================================================

/**
 * Task form hook return type
 * Provides React Hook Form integration with type safety
 */
export interface TaskFormHook<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  isSubmitting: boolean;
  submitForm: (data: T) => Promise<void>;
  validateSchedule: () => Promise<boolean>;
  schedulePreview: string[];
  executeTestRun: () => Promise<TaskExecution>;
  errors: Record<string, string>;
}

/**
 * Task list hook return type
 * Integrates with SWR/React Query for data fetching
 */
export interface TaskListHook {
  tasks: TaskRow[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  toggleTask: (id: number, isActive: boolean) => Promise<void>;
  executeTask: (id: number) => Promise<TaskExecution>;
  bulkUpdate: (taskIds: number[], updates: Partial<ScheduledTask>) => Promise<void>;
}

/**
 * Execution history hook return type
 * Supports TanStack Virtual for large dataset rendering
 */
export interface ExecutionHistoryHook {
  executions: TaskExecution[];
  statistics: ExecutionStatistics | null;
  isLoading: boolean;
  error: Error | null;
  selectedExecution: TaskExecution | null;
  setSelectedExecution: (execution: TaskExecution | null) => void;
  filterExecutions: (filters: ExecutionFilters) => TaskExecution[];
  exportExecutions: (format: 'csv' | 'json' | 'xlsx') => Promise<Blob>;
}

/**
 * Scheduler dashboard hook return type
 * Provides comprehensive monitoring and management capabilities
 */
export interface SchedulerDashboardHook {
  overview: SchedulerOverview;
  recentExecutions: TaskExecution[];
  activeTasksCount: number;
  queueDepth: number;
  systemHealth: SchedulerHealth;
  isLoading: boolean;
  error: Error | null;
  pauseScheduler: () => Promise<void>;
  resumeScheduler: () => Promise<void>;
  clearQueue: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
}

// =============================================================================
// DASHBOARD AND MONITORING TYPES
// =============================================================================

/**
 * Scheduler overview metrics for dashboard display
 */
export interface SchedulerOverview {
  total_tasks: number;
  active_tasks: number;
  paused_tasks: number;
  failed_tasks: number;
  executions_today: number;
  executions_this_week: number;
  overall_success_rate: number;
  avg_execution_time: number;
  next_execution: string | null;
  system_load: number;
}

/**
 * Scheduler health status indicators
 */
export interface SchedulerHealth {
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  uptime: number;
  memory_usage: number;
  cpu_usage: number;
  disk_usage: number;
  queue_depth: number;
  active_workers: number;
  last_heartbeat: string;
  issues: HealthIssue[];
}

/**
 * Health issue definition for monitoring alerts
 */
export interface HealthIssue {
  type: 'warning' | 'error' | 'critical';
  message: string;
  component: string;
  timestamp: string;
  resolved: boolean;
}

/**
 * Execution filters for history browsing
 */
export interface ExecutionFilters {
  task_ids?: number[];
  status?: TaskStatus[];
  date_range?: {
    start: string;
    end: string;
  };
  triggered_by?: ('schedule' | 'manual' | 'api' | 'webhook')[];
  duration_range?: {
    min: number;
    max: number;
  };
  search_query?: string;
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod schema for cron expression validation
 * Validates standard cron syntax with helpful error messages
 */
export const CronExpressionSchema = z.string()
  .regex(/^(\*|[0-5]?\d)(\s+(\*|[01]?\d|2[0-3])){1}(\s+(\*|[12]?\d|3[01])){1}(\s+(\*|[1-9]|1[0-2])){1}(\s+(\*|[0-6])){1}$/, 
    'Invalid cron expression format')
  .refine((val) => {
    // Additional cron validation logic
    const parts = val.split(/\s+/);
    return parts.length === 5;
  }, 'Cron expression must have exactly 5 parts');

/**
 * Zod schema for schedule configuration validation
 * Supports all schedule types with appropriate validation
 */
export const ScheduleConfigSchema = z.discriminatedUnion('frequency', [
  z.object({
    frequency: z.literal('cron'),
    cron_expression: CronExpressionSchema,
    description: z.string().optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    timezone: z.string().optional(),
    max_executions: z.number().int().positive().optional(),
    retry_attempts: z.number().int().min(0).max(10).optional(),
    retry_delay: z.number().int().positive().optional(),
    timeout: z.number().int().positive().optional(),
    enabled: z.boolean(),
  }),
  z.object({
    frequency: z.enum(['minutely', 'hourly', 'daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number().int().positive(),
    specific_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    specific_day: z.number().int().min(0).max(31).optional(),
    specific_month: z.number().int().min(1).max(12).optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    timezone: z.string().optional(),
    max_executions: z.number().int().positive().optional(),
    retry_attempts: z.number().int().min(0).max(10).optional(),
    retry_delay: z.number().int().positive().optional(),
    timeout: z.number().int().positive().optional(),
    enabled: z.boolean(),
  }),
  z.object({
    frequency: z.literal('once'),
    execution_time: z.string().datetime(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    timezone: z.string().optional(),
    max_executions: z.number().int().positive().optional(),
    retry_attempts: z.number().int().min(0).max(10).optional(),
    retry_delay: z.number().int().positive().optional(),
    timeout: z.number().int().positive().optional(),
    enabled: z.boolean(),
  }),
]);

/**
 * Zod schema for task payload validation
 * Ensures type safety for task configuration data
 */
export const TaskPayloadSchema = z.object({
  api: z.object({
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    url: z.string().url(),
    headers: z.record(z.string()).optional(),
    body: z.unknown().optional(),
    timeout: z.number().int().positive().optional(),
  }).optional(),
  script: z.object({
    type: z.enum(['php', 'javascript', 'python']),
    content: z.string().optional(),
    file_path: z.string().optional(),
    parameters: z.record(z.unknown()).optional(),
  }).optional(),
  service: z.object({
    service_name: z.string().min(1),
    operation: z.string().min(1),
    parameters: z.record(z.unknown()).optional(),
  }).optional(),
  email: z.object({
    to: z.array(z.string().email()).min(1),
    cc: z.array(z.string().email()).optional(),
    bcc: z.array(z.string().email()).optional(),
    subject: z.string().min(1),
    body: z.string().min(1),
    template_id: z.number().int().positive().optional(),
  }).optional(),
  webhook: z.object({
    url: z.string().url(),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH']),
    headers: z.record(z.string()).optional(),
    body: z.unknown().optional(),
    secret: z.string().optional(),
  }).optional(),
}).refine((data) => {
  // Ensure at least one payload type is defined
  const payloadTypes = Object.keys(data).filter(key => data[key as keyof typeof data] !== undefined);
  return payloadTypes.length > 0;
}, 'At least one payload type must be configured');

/**
 * Zod schema for complete task validation
 * Integrates with React Hook Form for comprehensive validation
 */
export const ScheduledTaskSchema = z.object({
  name: z.string()
    .min(1, 'Task name is required')
    .max(64, 'Task name too long')
    .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, 'Invalid task name format'),
  label: z.string().min(1, 'Task label is required').max(255, 'Label too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  service_id: z.number().int().positive().optional(),
  context: z.enum(['api', 'script', 'service', 'email', 'webhook']),
  priority: z.enum(['low', 'normal', 'high', 'critical']),
  is_active: z.boolean(),
  schedule: ScheduleConfigSchema,
  payload: TaskPayloadSchema,
});

// =============================================================================
// UTILITY TYPES AND HELPERS
// =============================================================================

/**
 * Type guard for cron schedule configuration
 * Enables type-safe schedule handling in React components
 */
export function isCronSchedule(schedule: ScheduleConfig): schedule is CronScheduleConfig {
  return schedule.frequency === 'cron';
}

/**
 * Type guard for interval schedule configuration
 */
export function isIntervalSchedule(schedule: ScheduleConfig): schedule is IntervalScheduleConfig {
  return ['minutely', 'hourly', 'daily', 'weekly', 'monthly', 'yearly'].includes(schedule.frequency);
}

/**
 * Type guard for once schedule configuration
 */
export function isOnceSchedule(schedule: ScheduleConfig): schedule is OnceScheduleConfig {
  return schedule.frequency === 'once';
}

/**
 * Calculate next execution time based on schedule configuration
 * Provides scheduling preview for React components
 */
export function calculateNextExecution(schedule: ScheduleConfig, currentTime: Date = new Date()): Date | null {
  if (!schedule.enabled) return null;
  
  // Implementation would calculate next execution based on schedule type
  // This is a placeholder for the actual scheduling logic
  const nextExecution = new Date(currentTime);
  
  if (isCronSchedule(schedule)) {
    // Parse cron expression and calculate next execution
    // Implementation would use a cron parser library
    nextExecution.setMinutes(nextExecution.getMinutes() + 1);
  } else if (isIntervalSchedule(schedule)) {
    // Calculate based on interval and frequency
    switch (schedule.frequency) {
      case 'minutely':
        nextExecution.setMinutes(nextExecution.getMinutes() + schedule.interval);
        break;
      case 'hourly':
        nextExecution.setHours(nextExecution.getHours() + schedule.interval);
        break;
      case 'daily':
        nextExecution.setDate(nextExecution.getDate() + schedule.interval);
        break;
      // Additional frequency calculations...
    }
  } else if (isOnceSchedule(schedule)) {
    return new Date(schedule.execution_time);
  }
  
  return nextExecution;
}

/**
 * Generate human-readable schedule description
 * Used in task listing and detail components
 */
export function getScheduleDescription(schedule: ScheduleConfig): string {
  if (isCronSchedule(schedule)) {
    return schedule.description || `Cron: ${schedule.cron_expression}`;
  } else if (isIntervalSchedule(schedule)) {
    const intervalText = schedule.interval === 1 ? '' : `${schedule.interval} `;
    return `Every ${intervalText}${schedule.frequency.replace('ly', '')}`;
  } else if (isOnceSchedule(schedule)) {
    return `Once at ${new Date(schedule.execution_time).toLocaleString()}`;
  }
  return 'Unknown schedule';
}

/**
 * Task status color mapping for UI components
 * Provides consistent visual feedback using Tailwind CSS classes
 */
export const TaskStatusColors = {
  idle: 'text-gray-500 bg-gray-100',
  pending: 'text-blue-600 bg-blue-100',
  running: 'text-yellow-600 bg-yellow-100 animate-pulse',
  completed: 'text-green-600 bg-green-100',
  failed: 'text-red-600 bg-red-100',
  cancelled: 'text-orange-600 bg-orange-100',
  timeout: 'text-red-700 bg-red-200',
} as const;

/**
 * Task priority color mapping for UI components
 */
export const TaskPriorityColors = {
  low: 'text-gray-600 bg-gray-100',
  normal: 'text-blue-600 bg-blue-100',
  high: 'text-orange-600 bg-orange-100',
  critical: 'text-red-600 bg-red-100',
} as const;

/**
 * Default task configuration factory
 * Provides sensible defaults for React Hook Form initialization
 */
export function getDefaultTaskConfig(context: ExecutionContext): Partial<ScheduledTask> {
  const baseConfig: Partial<ScheduledTask> = {
    context,
    priority: 'normal',
    is_active: true,
    execution_count: 0,
    success_count: 0,
    failure_count: 0,
    schedule: {
      frequency: 'daily',
      interval: 1,
      enabled: true,
      retry_attempts: 3,
      retry_delay: 60,
      timeout: 300,
    } as IntervalScheduleConfig,
  };

  switch (context) {
    case 'api':
      baseConfig.payload = {
        api: {
          method: 'GET',
          url: '',
          timeout: 30,
        },
      };
      break;
    case 'script':
      baseConfig.payload = {
        script: {
          type: 'javascript',
          content: '',
        },
      };
      break;
    case 'service':
      baseConfig.payload = {
        service: {
          service_name: '',
          operation: '',
        },
      };
      break;
    case 'email':
      baseConfig.payload = {
        email: {
          to: [],
          subject: '',
          body: '',
        },
      };
      break;
    case 'webhook':
      baseConfig.payload = {
        webhook: {
          url: '',
          method: 'POST',
        },
      };
      break;
  }

  return baseConfig;
}

/**
 * Export all types for convenient importing
 */
export type {
  // Core types
  ScheduleFrequency,
  TaskStatus,
  TaskPriority,
  ExecutionContext,
  
  // Configuration types
  ScheduleConfig,
  CronScheduleConfig,
  IntervalScheduleConfig,
  OnceScheduleConfig,
  
  // Entity types
  ScheduledTask,
  TaskRow,
  TaskPayload,
  TaskOptions,
  EmailAttachment,
  
  // Execution types
  TaskExecution,
  ExecutionStatistics,
  ExecutionFilters,
  
  // System types
  SchedulerConfig,
  SchedulerOverview,
  SchedulerHealth,
  HealthIssue,
  
  // React integration types
  TaskFormHook,
  TaskListHook,
  ExecutionHistoryHook,
  SchedulerDashboardHook,
};