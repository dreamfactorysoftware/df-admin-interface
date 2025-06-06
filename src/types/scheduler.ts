/**
 * TypeScript type definitions for Scheduler functionality
 * 
 * Provides comprehensive type safety for scheduler task management,
 * replacing Angular interface definitions with React/TypeScript patterns.
 * Ensures type consistency across components, hooks, and API interactions.
 */

/**
 * Base scheduler task data structure
 * Represents the core scheduler task entity from DreamFactory API
 */
export interface SchedulerTaskData {
  /** Unique identifier for the scheduler task */
  id: string;
  
  /** Human-readable name for the task */
  name: string;
  
  /** Optional description of the task's purpose */
  description?: string;
  
  /** Whether the task is currently active */
  isActive: boolean;
  
  /** Service ID that this task belongs to */
  serviceId: string;
  
  /** Service details populated via relationship */
  serviceByServiceId: {
    id: string;
    name: string;
    type: string;
    label?: string;
  };
  
  /** Component or endpoint path for the task */
  component: string;
  
  /** HTTP verb for the task (GET, POST, PUT, DELETE, etc.) */
  verb: string;
  
  /** Task execution frequency in seconds */
  frequency: number;
  
  /** Optional payload data for the task */
  payload?: Record<string, any>;
  
  /** Optional headers for the API call */
  headers?: Record<string, string>;
  
  /** Parameters for the API call */
  parameters?: Record<string, any>;
  
  /** Query parameters for the API call */
  query?: Record<string, any>;
  
  /** Task creation timestamp */
  createdDate?: string;
  
  /** Last modification timestamp */
  lastModifiedDate?: string;
  
  /** User who created the task */
  createdByUserId?: string;
  
  /** User who last modified the task */
  lastModifiedByUserId?: string;
  
  /** Latest task execution log (populated via relationship) */
  taskLogByTaskId?: SchedulerTaskLog;
}

/**
 * Scheduler task execution log
 * Records the results of task executions
 */
export interface SchedulerTaskLog {
  /** Unique identifier for the log entry */
  id: string;
  
  /** ID of the associated scheduler task */
  taskId: string;
  
  /** HTTP status code from the task execution */
  statusCode: number;
  
  /** Response content from the task execution */
  content?: string;
  
  /** Any error message if the task failed */
  errorMessage?: string;
  
  /** Timestamp when the task started */
  startTime: string;
  
  /** Timestamp when the task completed */
  endTime?: string;
  
  /** Duration of task execution in milliseconds */
  duration?: number;
  
  /** Additional metadata about the execution */
  metadata?: Record<string, any>;
}

/**
 * Scheduler task creation/update payload
 * Used for creating or updating scheduler tasks
 */
export interface SchedulerTaskPayload {
  /** Task name (required) */
  name: string;
  
  /** Task description (optional) */
  description?: string;
  
  /** Whether the task should be active */
  isActive?: boolean;
  
  /** Service ID for the task */
  serviceId: string;
  
  /** Component or endpoint path */
  component: string;
  
  /** HTTP verb */
  verb: string;
  
  /** Execution frequency in seconds */
  frequency: number;
  
  /** Optional payload data */
  payload?: Record<string, any>;
  
  /** Optional headers */
  headers?: Record<string, string>;
  
  /** Optional parameters */
  parameters?: Record<string, any>;
  
  /** Optional query parameters */
  query?: Record<string, any>;
}

/**
 * Scheduler task query filters
 * Used for filtering and searching scheduler tasks
 */
export interface SchedulerTaskFilters {
  /** Filter by task name */
  name?: string;
  
  /** Filter by active status */
  isActive?: boolean;
  
  /** Filter by service ID */
  serviceId?: string;
  
  /** Filter by HTTP verb */
  verb?: string;
  
  /** Filter by component */
  component?: string;
  
  /** Search term for general text search */
  search?: string;
}

/**
 * Scheduler task sorting options
 */
export interface SchedulerTaskSort {
  /** Field to sort by */
  field: keyof SchedulerTaskData;
  
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Scheduler task list response from API
 */
export interface SchedulerTaskListResponse {
  /** Array of scheduler tasks */
  data: SchedulerTaskData[];
  
  /** Total count of tasks (for pagination) */
  total?: number;
  
  /** Current page (for pagination) */
  page?: number;
  
  /** Page size (for pagination) */
  pageSize?: number;
  
  /** Whether there are more results */
  hasMore?: boolean;
}

/**
 * Scheduler task statistics
 * Summary information about scheduler tasks
 */
export interface SchedulerTaskStats {
  /** Total number of tasks */
  totalTasks: number;
  
  /** Number of active tasks */
  activeTasks: number;
  
  /** Number of inactive tasks */
  inactiveTasks: number;
  
  /** Number of tasks with recent errors */
  errorTasks: number;
  
  /** Number of tasks that ran successfully recently */
  successTasks: number;
  
  /** Average execution frequency across all tasks */
  averageFrequency?: number;
  
  /** Last execution timestamp across all tasks */
  lastExecution?: string;
}

/**
 * Scheduler service information
 * Information about available services for scheduling
 */
export interface SchedulerService {
  /** Service ID */
  id: string;
  
  /** Service name */
  name: string;
  
  /** Service type (database, email, etc.) */
  type: string;
  
  /** Service label */
  label?: string;
  
  /** Whether the service is active */
  isActive: boolean;
  
  /** Available components for scheduling */
  components?: SchedulerComponent[];
}

/**
 * Scheduler component information
 * Available endpoints/components within a service
 */
export interface SchedulerComponent {
  /** Component path */
  path: string;
  
  /** Component description */
  description?: string;
  
  /** Supported HTTP verbs */
  verbs: string[];
  
  /** Whether authentication is required */
  requiresAuth?: boolean;
  
  /** Expected parameters */
  parameters?: SchedulerParameter[];
}

/**
 * Scheduler parameter definition
 * Parameter specification for scheduler components
 */
export interface SchedulerParameter {
  /** Parameter name */
  name: string;
  
  /** Parameter type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  
  /** Whether the parameter is required */
  required: boolean;
  
  /** Parameter description */
  description?: string;
  
  /** Default value */
  defaultValue?: any;
  
  /** Validation rules */
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

/**
 * Scheduler task execution request
 * Used for manually triggering task execution
 */
export interface SchedulerTaskExecutionRequest {
  /** Task ID to execute */
  taskId: string;
  
  /** Override parameters for this execution */
  parameters?: Record<string, any>;
  
  /** Override payload for this execution */
  payload?: Record<string, any>;
  
  /** Whether to run asynchronously */
  async?: boolean;
}

/**
 * Scheduler task execution response
 */
export interface SchedulerTaskExecutionResponse {
  /** Execution was successful */
  success: boolean;
  
  /** HTTP status code */
  statusCode: number;
  
  /** Response content */
  content?: any;
  
  /** Error message if failed */
  errorMessage?: string;
  
  /** Execution duration in milliseconds */
  duration: number;
  
  /** Log entry ID for this execution */
  logId: string;
}