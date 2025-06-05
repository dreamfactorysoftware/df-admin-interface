/**
 * Scheduler domain fixture factory functions that generate realistic scheduled task 
 * and service configuration data for testing React components. Provides comprehensive 
 * factory functions for creating scheduler tasks, service configurations, and task 
 * execution logs to support testing of scheduler management interfaces.
 * 
 * These factories replace static Angular mock data with configurable factory functions
 * that support various service types, error scenarios, and complex scheduling workflows.
 */

import { Service } from '../../types/service';
import { 
  SchedulerTaskData, 
  CreateSchedulePayload, 
  UpdateSchedulePayload 
} from '../../types/scheduler';

// =============================================================================
// FACTORY OPTIONS AND CONFIGURATION TYPES
// =============================================================================

/**
 * Configuration options for service factory functions
 */
export interface ServiceFactoryOptions {
  id?: number;
  name?: string;
  label?: string;
  description?: string;
  type?: 'sqlite' | 'local_email' | 'swagger' | 'mysql' | 'postgresql' | 'mongodb';
  isActive?: boolean;
  mutable?: boolean;
  deletable?: boolean;
  createdById?: number | null;
  lastModifiedById?: number | null;
  config?: any;
}

/**
 * Configuration options for scheduler task factory functions
 */
export interface SchedulerTaskFactoryOptions {
  id?: number;
  name?: string;
  description?: string;
  isActive?: boolean;
  serviceId?: number;
  component?: string;
  verb?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  verbMask?: number;
  frequency?: number;
  payload?: string | null;
  createdById?: number;
  lastModifiedById?: number | null;
  includeLog?: boolean;
  logStatusCode?: number;
  logContent?: string;
}

/**
 * Configuration options for task log factory functions
 */
export interface TaskLogFactoryOptions {
  taskId?: number;
  statusCode?: number;
  content?: string;
  isErrorScenario?: boolean;
  errorType?: 'rest_exception' | 'timeout' | 'connection_error' | 'validation_error';
}

/**
 * Configuration options for service-specific configurations
 */
export interface ServiceConfigFactoryOptions {
  serviceType: 'sqlite' | 'local_email' | 'swagger' | 'mysql' | 'postgresql' | 'mongodb';
  database?: string;
  allowUpsert?: boolean;
  maxRecords?: number;
  cacheEnabled?: boolean;
  cacheTtl?: number;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  parameters?: any[];
  options?: any[];
}

// =============================================================================
// SERVICE FACTORY FUNCTIONS
// =============================================================================

/**
 * Generates a realistic database service configuration for testing
 * Supports multiple database types with appropriate default configurations
 */
export function serviceFactory(options: ServiceFactoryOptions = {}): Service {
  const baseDate = new Date('2023-08-04T21:10:07.000000Z').toISOString();
  const modifiedDate = new Date('2023-08-21T13:46:25.000000Z').toISOString();

  const defaults: Partial<Service> = {
    id: Math.floor(Math.random() * 1000) + 1,
    isActive: true,
    mutable: true,
    deletable: true,
    createdDate: baseDate,
    lastModifiedDate: modifiedDate,
    createdById: null,
    lastModifiedById: 1,
    serviceDocByServiceId: null,
    refresh: false,
  };

  // Generate service type-specific defaults
  const typeDefaults = getServiceTypeDefaults(options.type || 'sqlite');

  return {
    ...defaults,
    ...typeDefaults,
    ...options,
    config: options.config || serviceConfigFactory({ 
      serviceType: options.type || 'sqlite' 
    }),
  } as Service;
}

/**
 * Generates multiple services for testing scenarios with relationships
 */
export function servicesFactory(count: number = 3, options: ServiceFactoryOptions = {}): Service[] {
  return Array.from({ length: count }, (_, index) => 
    serviceFactory({
      ...options,
      id: (options.id || 1) + index,
      name: options.name ? `${options.name}_${index + 1}` : undefined,
    })
  );
}

/**
 * Generates predefined service types commonly used in scheduler testing
 */
export function getCommonServices(): Service[] {
  return [
    serviceFactory({
      id: 2,
      name: 'api_docs',
      label: 'Live API Docs',
      description: 'API documenting and testing service.',
      type: 'swagger',
      mutable: false,
      deletable: false,
      createdById: null,
      lastModifiedById: null,
      config: [],
    }),
    serviceFactory({
      id: 5,
      name: 'db',
      label: 'Local SQL Database',
      description: 'Service for accessing local SQLite database.',
      type: 'sqlite',
    }),
    serviceFactory({
      id: 6,
      name: 'email',
      label: 'Local Email Service',
      description: 'Email service used for sending user invites and/or password reset confirmation.',
      type: 'local_email',
      config: { parameters: [] },
    }),
  ];
}

// =============================================================================
// SERVICE CONFIGURATION FACTORY FUNCTIONS
// =============================================================================

/**
 * Generates service-specific configuration objects based on service type
 */
export function serviceConfigFactory(options: ServiceConfigFactoryOptions): any {
  const { serviceType } = options;

  switch (serviceType) {
    case 'sqlite':
      return {
        service_id: options.serviceId || 5,
        options: options.options || [],
        attributes: null,
        statements: null,
        database: options.database || 'db.sqlite',
        allow_upsert: options.allowUpsert || false,
        max_records: options.maxRecords || 1000,
        cache_enabled: options.cacheEnabled || false,
        cache_ttl: options.cacheTtl || 0,
      };

    case 'mysql':
    case 'postgresql':
      return {
        service_id: options.serviceId || 7,
        host: options.host || 'localhost',
        port: options.port || (serviceType === 'mysql' ? 3306 : 5432),
        database: options.database || 'test_db',
        username: options.username || 'test_user',
        password: options.password || 'test_password',
        options: options.options || [],
        attributes: null,
        statements: null,
        allow_upsert: options.allowUpsert || false,
        max_records: options.maxRecords || 1000,
        cache_enabled: options.cacheEnabled || false,
        cache_ttl: options.cacheTtl || 0,
      };

    case 'mongodb':
      return {
        service_id: options.serviceId || 8,
        host: options.host || 'localhost',
        port: options.port || 27017,
        database: options.database || 'test_db',
        username: options.username || 'test_user',
        password: options.password || 'test_password',
        options: options.options || [],
        max_records: options.maxRecords || 1000,
        cache_enabled: options.cacheEnabled || false,
        cache_ttl: options.cacheTtl || 0,
      };

    case 'local_email':
      return {
        parameters: options.parameters || [],
      };

    case 'swagger':
      return options.parameters || [];

    default:
      return {};
  }
}

// =============================================================================
// SCHEDULER TASK FACTORY FUNCTIONS
// =============================================================================

/**
 * Generates a realistic scheduled task with execution data
 */
export function schedulerTaskFactory(options: SchedulerTaskFactoryOptions = {}): SchedulerTaskData {
  const baseDate = new Date('2023-08-30T14:41:44.000000Z').toISOString();
  const modifiedDate = new Date('2023-08-30T14:59:06.000000Z').toISOString();

  const services = getCommonServices();
  const defaultService = services.find(s => s.id === (options.serviceId || 5)) || services[1];

  const defaults: SchedulerTaskData = {
    id: Math.floor(Math.random() * 1000) + 1,
    name: `scheduler_task_${Math.floor(Math.random() * 1000)}`,
    description: 'Generated scheduler task for testing',
    isActive: true,
    serviceId: defaultService.id,
    component: '*',
    verb: 'GET',
    verbMask: 1,
    frequency: 300, // 5 minutes
    payload: null,
    createdDate: baseDate,
    lastModifiedDate: modifiedDate,
    createdById: 1,
    lastModifiedById: 1,
    serviceByServiceId: defaultService,
    taskLogByTaskId: null,
  };

  const task = {
    ...defaults,
    ...options,
  };

  // Update service relationship if serviceId was changed
  if (options.serviceId && options.serviceId !== defaultService.id) {
    const matchingService = services.find(s => s.id === options.serviceId);
    if (matchingService) {
      task.serviceByServiceId = matchingService;
    }
  }

  // Add task log if requested
  if (options.includeLog !== false) {
    task.taskLogByTaskId = taskLogFactory({
      taskId: task.id,
      statusCode: options.logStatusCode,
      content: options.logContent,
    });
  }

  return task;
}

/**
 * Generates multiple scheduler tasks for testing table scenarios
 */
export function schedulerTasksFactory(count: number = 5, options: SchedulerTaskFactoryOptions = {}): SchedulerTaskData[] {
  return Array.from({ length: count }, (_, index) => 
    schedulerTaskFactory({
      ...options,
      id: (options.id || 1) + index,
      name: options.name ? `${options.name}_${index + 1}` : undefined,
    })
  );
}

/**
 * Generates scheduler tasks with various service types for comprehensive testing
 */
export function schedulerTasksWithVariousServicesFactory(): SchedulerTaskData[] {
  const services = getCommonServices();
  
  return services.map((service, index) => 
    schedulerTaskFactory({
      id: 10 + index,
      serviceId: service.id,
      name: `task_for_${service.name}`,
      description: `Task for ${service.label}`,
      component: service.type === 'swagger' ? 'api/*' : '*',
      verb: service.type === 'local_email' ? 'POST' : 'GET',
      frequency: (index + 1) * 60, // Different frequencies
    })
  );
}

// =============================================================================
// TASK LOG FACTORY FUNCTIONS
// =============================================================================

/**
 * Generates task execution logs with configurable status codes and error scenarios
 */
export function taskLogFactory(options: TaskLogFactoryOptions = {}): NonNullable<SchedulerTaskData['taskLogByTaskId']> {
  const baseDate = new Date('2023-08-30T15:28:04.000000Z').toISOString();

  const defaults = {
    taskId: options.taskId || 15,
    statusCode: 200,
    content: 'Task executed successfully',
    createdDate: baseDate,
    lastModifiedDate: baseDate,
  };

  // Generate error content based on error type
  if (options.isErrorScenario || options.statusCode && options.statusCode >= 400) {
    const errorContent = generateErrorContent(
      options.statusCode || 404,
      options.errorType || 'rest_exception'
    );
    
    return {
      ...defaults,
      statusCode: options.statusCode || 404,
      content: options.content || errorContent,
    };
  }

  return {
    ...defaults,
    statusCode: options.statusCode || 200,
    content: options.content || defaults.content,
  };
}

/**
 * Generates task logs for successful execution scenarios
 */
export function successfulTaskLogFactory(taskId: number = 15): NonNullable<SchedulerTaskData['taskLogByTaskId']> {
  return taskLogFactory({
    taskId,
    statusCode: 200,
    content: 'Task executed successfully. Response: {"message": "Task completed", "timestamp": "2023-08-30T15:28:04.000000Z"}',
  });
}

/**
 * Generates task logs for various error scenarios
 */
export function errorTaskLogFactory(
  taskId: number = 15,
  errorType: TaskLogFactoryOptions['errorType'] = 'rest_exception'
): NonNullable<SchedulerTaskData['taskLogByTaskId']> {
  const statusCodes = {
    rest_exception: 404,
    timeout: 408,
    connection_error: 503,
    validation_error: 400,
  };

  return taskLogFactory({
    taskId,
    statusCode: statusCodes[errorType],
    isErrorScenario: true,
    errorType,
  });
}

// =============================================================================
// CREATE AND UPDATE PAYLOAD FACTORIES
// =============================================================================

/**
 * Generates create schedule payload for testing form submissions
 */
export function createSchedulePayloadFactory(options: Partial<CreateSchedulePayload> = {}): CreateSchedulePayload {
  const services = getCommonServices();
  const defaultService = services[1]; // SQLite service

  return {
    id: null,
    name: 'new_scheduler_task',
    description: 'New scheduled task for testing',
    component: '*',
    frequency: 300,
    isActive: true,
    payload: '',
    service: {
      id: defaultService.id,
      name: defaultService.name,
      label: defaultService.label,
      description: defaultService.description,
      type: defaultService.type,
      components: ['*'],
    },
    serviceId: defaultService.id,
    serviceName: defaultService.name,
    verb: 'GET',
    verbMask: 1,
    ...options,
  };
}

/**
 * Generates update schedule payload for testing edit forms
 */
export function updateSchedulePayloadFactory(options: Partial<UpdateSchedulePayload> = {}): UpdateSchedulePayload {
  const baseTask = schedulerTaskFactory();
  const createPayload = createSchedulePayloadFactory();

  return {
    ...createPayload,
    id: baseTask.id,
    createdById: baseTask.createdById,
    createdDate: baseTask.createdDate,
    hasLog: !!baseTask.taskLogByTaskId,
    lastModifiedById: baseTask.lastModifiedById,
    lastModifiedDate: baseTask.lastModifiedDate,
    taskLogByTaskId: baseTask.taskLogByTaskId,
    ...options,
  };
}

// =============================================================================
// COMPLEX SCENARIO FACTORIES
// =============================================================================

/**
 * Generates a complete scheduler scenario with related services and tasks
 */
export function schedulerScenarioFactory(options: {
  taskCount?: number;
  includeErrorTasks?: boolean;
  includeInactiveTasks?: boolean;
} = {}): {
  services: Service[];
  tasks: SchedulerTaskData[];
  errorTasks: SchedulerTaskData[];
  inactiveTasks: SchedulerTaskData[];
} {
  const services = getCommonServices();
  const taskCount = options.taskCount || 5;

  // Generate regular active tasks
  const tasks = schedulerTasksFactory(taskCount, { isActive: true });

  // Generate error scenario tasks
  const errorTasks = options.includeErrorTasks ? [
    schedulerTaskFactory({
      id: 1000,
      name: 'error_task_404',
      description: 'Task that generates 404 errors',
      includeLog: true,
      logStatusCode: 404,
    }),
    schedulerTaskFactory({
      id: 1001,
      name: 'error_task_timeout',
      description: 'Task that generates timeout errors',
      includeLog: true,
      logStatusCode: 408,
    }),
  ] : [];

  // Generate inactive tasks
  const inactiveTasks = options.includeInactiveTasks ? [
    schedulerTaskFactory({
      id: 2000,
      name: 'inactive_task',
      description: 'Disabled scheduler task',
      isActive: false,
      includeLog: false,
    }),
  ] : [];

  return {
    services,
    tasks,
    errorTasks,
    inactiveTasks,
  };
}

/**
 * Generates large dataset scenarios for testing TanStack Virtual performance
 */
export function largeSchedulerDatasetFactory(taskCount: number = 1000): {
  services: Service[];
  tasks: SchedulerTaskData[];
} {
  const services = getCommonServices();
  
  // Generate a large number of tasks for performance testing
  const tasks = Array.from({ length: taskCount }, (_, index) => {
    const serviceIndex = index % services.length;
    const service = services[serviceIndex];
    
    return schedulerTaskFactory({
      id: index + 1,
      name: `bulk_task_${index + 1}`,
      description: `Bulk generated task ${index + 1}`,
      serviceId: service.id,
      frequency: (index % 10 + 1) * 60, // Varied frequencies
      isActive: index % 10 !== 9, // 90% active tasks
      includeLog: index % 5 === 0, // 20% with logs
    });
  });

  return { services, tasks };
}

// =============================================================================
// UTILITY HELPER FUNCTIONS
// =============================================================================

/**
 * Gets service type-specific default properties
 */
function getServiceTypeDefaults(type: string): Partial<Service> {
  const typeMap: Record<string, Partial<Service>> = {
    sqlite: {
      name: 'db',
      label: 'Local SQL Database',
      description: 'Service for accessing local SQLite database.',
      type: 'sqlite',
    },
    local_email: {
      name: 'email',
      label: 'Local Email Service',
      description: 'Email service used for sending user invites and/or password reset confirmation.',
      type: 'local_email',
    },
    swagger: {
      name: 'api_docs',
      label: 'Live API Docs',
      description: 'API documenting and testing service.',
      type: 'swagger',
      mutable: false,
      deletable: false,
    },
    mysql: {
      name: 'mysql_db',
      label: 'MySQL Database',
      description: 'Service for accessing MySQL database.',
      type: 'mysql',
    },
    postgresql: {
      name: 'postgres_db',
      label: 'PostgreSQL Database',
      description: 'Service for accessing PostgreSQL database.',
      type: 'postgresql',
    },
    mongodb: {
      name: 'mongo_db',
      label: 'MongoDB Database',
      description: 'Service for accessing MongoDB database.',
      type: 'mongodb',
    },
  };

  return typeMap[type] || typeMap.sqlite;
}

/**
 * Generates realistic error content based on error type and status code
 */
function generateErrorContent(statusCode: number, errorType: string): string {
  const errorTemplates = {
    rest_exception: `REST Exception #${statusCode} > Resource '*' not found for service 'name'. DreamFactory Core Utility ServiceResponse Object (    [statusCode:protected] => ${statusCode}    [content:protected] => Array        ( [error] => Array                (                [code] => ${statusCode}                    [context] => [message] => Resource '*' not found for service 'name'.   [status_code] => ${statusCode}              )        )    [contentType:protected] =>    [dataFormat:protected] => 201   [headers:protected] => Array       (        ))REST Exception #${statusCode} > Resource '*' not found for service 'name'. Resource '*' not found for service 'name'. REST Exception #500 > Resource '*' not found for service 'name'. In Request.php line 71: Resource '*' not found for service 'name'.`,
    
    timeout: `Connection timeout after 30 seconds. Task execution failed due to network timeout. Service 'name' did not respond within the expected timeframe. Consider increasing the timeout value or checking service availability.`,
    
    connection_error: `Service connection failed. Unable to establish connection to service 'name'. Error: Connection refused on host:port. Verify service configuration and network connectivity.`,
    
    validation_error: `Validation failed for request payload. Missing required fields or invalid data format. Please check the task configuration and ensure all required parameters are provided with correct data types.`,
  };

  return errorTemplates[errorType as keyof typeof errorTemplates] || errorTemplates.rest_exception;
}

// =============================================================================
// EXPORTS FOR CONVENIENCE
// =============================================================================

/**
 * Pre-configured factory presets for common testing scenarios
 */
export const schedulerFixtures = {
  // Single entities
  service: serviceFactory,
  task: schedulerTaskFactory,
  taskLog: taskLogFactory,
  
  // Multiple entities
  services: servicesFactory,
  tasks: schedulerTasksFactory,
  
  // Specific scenarios
  commonServices: getCommonServices,
  tasksWithVariousServices: schedulerTasksWithVariousServicesFactory,
  successfulLog: successfulTaskLogFactory,
  errorLog: errorTaskLogFactory,
  
  // Payloads
  createPayload: createSchedulePayloadFactory,
  updatePayload: updateSchedulePayloadFactory,
  
  // Complex scenarios
  scenario: schedulerScenarioFactory,
  largeDataset: largeSchedulerDatasetFactory,
  
  // Configurations
  serviceConfig: serviceConfigFactory,
};

export default schedulerFixtures;