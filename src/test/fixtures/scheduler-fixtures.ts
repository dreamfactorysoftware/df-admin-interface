/**
 * Scheduler domain fixture factory functions that generate realistic scheduled task 
 * and service configuration data for testing React components.
 * 
 * Provides comprehensive factory functions for creating scheduler tasks, service 
 * configurations, and task execution logs to support testing of scheduler management 
 * interfaces. Transforms static mock data exports to configurable factory functions 
 * enabling complex test scenario composition.
 */

import type {
  SchedulerTaskData,
  SchedulerTaskLog,
  SchedulerTaskPayload,
  SchedulerService,
  SchedulerComponent,
  SchedulerParameter,
  SchedulerTaskExecutionResponse,
  SchedulerTaskStats,
} from '../../types/scheduler';

/**
 * Service configuration types inferred from component factory patterns
 * Represents database and other service configurations for scheduler tasks
 */
interface ServiceConfig {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  driver?: string;
  dsn?: string;
  options?: Record<string, any>;
  attributes?: any[];
  statements?: any[];
  ssl_cert?: string | null;
  ssl_key?: string | null;
  ssl_ca?: string | null;
  ssl_cipher?: string | null;
  charset?: string;
  collation?: string;
  timezone?: string;
  strict?: boolean;
  // Email service specific
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_encryption?: string;
  // Swagger/API service specific
  base_url?: string;
  api_key?: string;
  headers?: Record<string, string>;
  // File service specific
  container?: string;
  path?: string;
  public?: boolean;
}

interface DatabaseService {
  id: number | string;
  name: string;
  label: string;
  description?: string;
  is_active: boolean;
  type: string;
  mutable: boolean;
  deletable: boolean;
  created_date: string;
  last_modified_date: string;
  created_by_id: number;
  last_modified_by_id: number;
  config: ServiceConfig;
}

/**
 * HTTP verbs commonly used in scheduler tasks
 */
const HTTP_VERBS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;

/**
 * Service types available for scheduler tasks
 */
const SERVICE_TYPES = [
  'mysql', 'pgsql', 'sqlite', 'mongodb', 'oracle', 'snowflake',
  'email', 'swagger', 'script', 'file', 'http', 'soap'
] as const;

/**
 * Common scheduler task frequencies in seconds
 */
const COMMON_FREQUENCIES = [
  60,      // 1 minute
  300,     // 5 minutes
  900,     // 15 minutes
  1800,    // 30 minutes
  3600,    // 1 hour
  7200,    // 2 hours
  14400,   // 4 hours
  21600,   // 6 hours
  43200,   // 12 hours
  86400,   // 24 hours (daily)
  604800,  // 7 days (weekly)
  2592000, // 30 days (monthly)
] as const;

/**
 * Service configuration factory for generating service-specific configurations
 * Supports various service types with realistic configuration objects
 */
export const serviceConfigFactory = (
  serviceType: string,
  overrides: Partial<ServiceConfig> = {}
): ServiceConfig => {
  const configs: Record<string, ServiceConfig> = {
    mysql: {
      host: 'localhost',
      port: 3306,
      database: 'scheduler_db',
      username: 'scheduler_user',
      password: 'scheduler_pass',
      driver: 'mysql',
      options: {
        connect_timeout: 60,
        read_timeout: 60,
        write_timeout: 60,
      },
      attributes: [],
      statements: [],
      ssl_cert: null,
      ssl_key: null,
      ssl_ca: null,
      ssl_cipher: null,
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
      timezone: 'UTC',
      strict: true,
    },
    
    pgsql: {
      host: 'localhost',
      port: 5432,
      database: 'scheduler_db',
      username: 'scheduler_user',
      password: 'scheduler_pass',
      driver: 'pgsql',
      options: {
        charset: 'utf8',
        prefix: '',
        prefix_indexes: true,
        schema: 'public',
        sslmode: 'prefer',
      },
      attributes: [],
      statements: [],
    },
    
    sqlite: {
      database: 'storage/database/scheduler.sqlite',
      driver: 'sqlite',
      options: {
        foreign_key_constraints: true,
        journal_mode: 'WAL',
        synchronous: 'NORMAL',
      },
      attributes: [],
      statements: [],
    },
    
    mongodb: {
      host: 'localhost',
      port: 27017,
      database: 'scheduler_db',
      username: 'scheduler_user',
      password: 'scheduler_pass',
      driver: 'mongodb',
      options: {
        readPreference: 'primary',
        writeConcern: 'majority',
        readConcern: 'majority',
        authSource: 'admin',
      },
      dsn: '',
      attributes: [],
      statements: [],
    },
    
    email: {
      smtp_host: 'smtp.example.com',
      smtp_port: 587,
      smtp_username: 'scheduler@example.com',
      smtp_password: 'email_password',
      smtp_encryption: 'tls',
      options: {
        from_name: 'Scheduler Service',
        from_email: 'scheduler@example.com',
        reply_to_name: 'No Reply',
        reply_to_email: 'noreply@example.com',
      },
    },
    
    swagger: {
      base_url: 'https://api.example.com',
      api_key: 'swagger_api_key_123',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'DreamFactory-Scheduler/1.0',
      },
      options: {
        timeout: 30,
        verify_ssl: true,
      },
    },
    
    http: {
      base_url: 'https://httpbin.org',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      options: {
        timeout: 30,
        verify_ssl: true,
        follow_redirects: true,
      },
    },
  };

  const baseConfig = configs[serviceType] || configs.http;
  return { ...baseConfig, ...overrides };
};

/**
 * Database service factory function generating services with proper configuration objects
 * Supports various database types with realistic connection parameters
 */
export const serviceFactory = (
  serviceType: string = 'mysql',
  overrides: Partial<DatabaseService> = {}
): DatabaseService => {
  const serviceId = overrides.id || Math.floor(Math.random() * 1000) + 1;
  const serviceName = overrides.name || `${serviceType}-service-${serviceId}`;
  
  const baseService: DatabaseService = {
    id: serviceId,
    name: serviceName,
    label: overrides.label || `${serviceType.toUpperCase()} Service`,
    description: overrides.description || `${serviceType} database service for scheduler tasks`,
    is_active: true,
    type: serviceType,
    mutable: true,
    deletable: true,
    created_date: new Date().toISOString(),
    last_modified_date: new Date().toISOString(),
    created_by_id: 1,
    last_modified_by_id: 1,
    config: serviceConfigFactory(serviceType, overrides.config),
  };

  return { ...baseService, ...overrides };
};

/**
 * Task execution log factory for generating logs with error scenarios and success states
 * Supports comprehensive error handling testing with realistic execution data
 */
export const taskLogFactory = (
  taskId: string,
  scenario: 'success' | 'error' | 'timeout' | 'auth_error' | 'server_error' = 'success',
  overrides: Partial<SchedulerTaskLog> = {}
): SchedulerTaskLog => {
  const logId = overrides.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = overrides.startTime || new Date().toISOString();
  const startDate = new Date(startTime);
  
  const scenarios = {
    success: {
      statusCode: 200,
      content: JSON.stringify({
        success: true,
        message: 'Task executed successfully',
        data: {
          processed_records: 15,
          execution_time: '0.125s',
          memory_used: '2.5MB',
        },
      }),
      errorMessage: undefined,
      duration: 125,
      endTime: new Date(startDate.getTime() + 125).toISOString(),
      metadata: {
        execution_type: 'scheduled',
        server_id: 'web-01',
        php_memory_peak: '2.5MB',
        db_queries_count: 3,
      },
    },
    
    error: {
      statusCode: 500,
      content: JSON.stringify({
        error: {
          code: 500,
          message: 'Internal server error during task execution',
          context: {
            file: '/app/services/DatabaseService.php',
            line: 245,
            trace: 'PDOException: Connection refused',
          },
        },
      }),
      errorMessage: 'Database connection failed: Connection refused',
      duration: 5000,
      endTime: new Date(startDate.getTime() + 5000).toISOString(),
      metadata: {
        execution_type: 'scheduled',
        server_id: 'web-01',
        error_type: 'PDOException',
        retry_count: 3,
        last_retry_at: new Date(startDate.getTime() + 4000).toISOString(),
      },
    },
    
    timeout: {
      statusCode: 408,
      content: JSON.stringify({
        error: {
          code: 408,
          message: 'Request timeout',
          context: {
            timeout_seconds: 30,
            executed_time: 30.5,
          },
        },
      }),
      errorMessage: 'Task execution timed out after 30 seconds',
      duration: 30500,
      endTime: new Date(startDate.getTime() + 30500).toISOString(),
      metadata: {
        execution_type: 'scheduled',
        server_id: 'web-02',
        timeout_reason: 'query_timeout',
        partial_results: true,
      },
    },
    
    auth_error: {
      statusCode: 401,
      content: JSON.stringify({
        error: {
          code: 401,
          message: 'Authentication failed',
          context: {
            auth_method: 'api_key',
            provided_key: 'xyz***',
          },
        },
      }),
      errorMessage: 'Invalid API key or expired credentials',
      duration: 50,
      endTime: new Date(startDate.getTime() + 50).toISOString(),
      metadata: {
        execution_type: 'scheduled',
        server_id: 'web-01',
        auth_method: 'header',
        credential_age_days: 45,
      },
    },
    
    server_error: {
      statusCode: 503,
      content: JSON.stringify({
        error: {
          code: 503,
          message: 'Service temporarily unavailable',
          context: {
            service: 'database',
            reason: 'maintenance_mode',
          },
        },
      }),
      errorMessage: 'Database service is in maintenance mode',
      duration: 1000,
      endTime: new Date(startDate.getTime() + 1000).toISOString(),
      metadata: {
        execution_type: 'scheduled',
        server_id: 'web-03',
        maintenance_window: '02:00-04:00 UTC',
        retry_recommended: true,
      },
    },
  };

  const scenarioData = scenarios[scenario];
  
  const baseLog: SchedulerTaskLog = {
    id: logId,
    taskId,
    startTime,
    ...scenarioData,
  };

  return { ...baseLog, ...overrides };
};

/**
 * Scheduler task factory for generating scheduled tasks with realistic execution data
 * Supports various service types and complex configuration scenarios
 */
export const schedulerTaskFactory = (
  serviceData?: Partial<DatabaseService>,
  overrides: Partial<SchedulerTaskData> = {}
): SchedulerTaskData => {
  const service = serviceData || serviceFactory();
  const taskId = overrides.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const frequency = overrides.frequency || COMMON_FREQUENCIES[Math.floor(Math.random() * COMMON_FREQUENCIES.length)];
  const verb = overrides.verb || HTTP_VERBS[Math.floor(Math.random() * HTTP_VERBS.length)];
  
  // Generate realistic component paths based on service type
  const getComponentPath = (serviceType: string, httpVerb: string): string => {
    const paths: Record<string, string[]> = {
      mysql: ['users', 'orders', 'products', 'inventory', 'reports'],
      pgsql: ['analytics', 'sessions', 'logs', 'metrics', 'events'],
      sqlite: ['cache', 'settings', 'temp_data', 'queue_jobs'],
      mongodb: ['documents', 'collections', 'aggregations', 'indexes'],
      email: ['send', 'templates', 'bounce_handling', 'queue'],
      swagger: ['pets', 'store', 'user', 'inventory', 'orders'],
      http: ['webhooks', 'notifications', 'sync', 'backup'],
    };
    
    const servicePaths = paths[serviceType] || paths.http;
    const basePath = servicePaths[Math.floor(Math.random() * servicePaths.length)];
    
    if (httpVerb === 'GET') {
      return Math.random() > 0.5 ? basePath : `${basePath}/:id`;
    } else if (['PUT', 'PATCH', 'DELETE'].includes(httpVerb)) {
      return `${basePath}/:id`;
    }
    return basePath;
  };

  const component = overrides.component || getComponentPath(service.type, verb);
  
  const baseTask: SchedulerTaskData = {
    id: taskId,
    name: overrides.name || `${service.type}_${component.replace('/', '_')}_${verb.toLowerCase()}`,
    description: overrides.description || `Scheduled ${verb} operation on ${component} via ${service.label}`,
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    serviceId: service.id.toString(),
    serviceByServiceId: {
      id: service.id.toString(),
      name: service.name,
      type: service.type,
      label: service.label,
    },
    component,
    verb,
    frequency,
    payload: overrides.payload || (verb !== 'GET' ? {
      data: {
        updated_at: '{{current_timestamp}}',
        processed_by: 'scheduler',
      },
    } : undefined),
    headers: overrides.headers || {
      'Content-Type': 'application/json',
      'X-Scheduler-Task': taskId,
      'X-Service-Type': service.type,
    },
    parameters: overrides.parameters || (component.includes(':id') ? {
      id: '{{sequence_value}}',
    } : undefined),
    query: overrides.query || (verb === 'GET' ? {
      limit: 100,
      offset: 0,
      order: 'created_date DESC',
    } : undefined),
    createdDate: overrides.createdDate || new Date().toISOString(),
    lastModifiedDate: overrides.lastModifiedDate || new Date().toISOString(),
    createdByUserId: overrides.createdByUserId || '1',
    lastModifiedByUserId: overrides.lastModifiedByUserId || '1',
    taskLogByTaskId: overrides.taskLogByTaskId || taskLogFactory(taskId, 'success'),
  };

  return { ...baseTask, ...overrides };
};

/**
 * Scheduler service information factory
 * Creates service metadata for scheduler component selection
 */
export const schedulerServiceFactory = (
  serviceType: string = 'mysql',
  overrides: Partial<SchedulerService> = {}
): SchedulerService => {
  const service = serviceFactory(serviceType);
  
  const getServiceComponents = (type: string): SchedulerComponent[] => {
    const componentsByType: Record<string, SchedulerComponent[]> = {
      mysql: [
        {
          path: 'users',
          description: 'User management operations',
          verbs: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
          requiresAuth: true,
          parameters: [
            { name: 'id', type: 'number', required: false, description: 'User ID for specific operations' },
            { name: 'limit', type: 'number', required: false, description: 'Maximum records to return', defaultValue: 100 },
            { name: 'offset', type: 'number', required: false, description: 'Records to skip', defaultValue: 0 },
          ],
        },
        {
          path: 'orders',
          description: 'Order management operations', 
          verbs: ['GET', 'POST', 'PUT', 'DELETE'],
          requiresAuth: true,
          parameters: [
            { name: 'id', type: 'number', required: false, description: 'Order ID' },
            { name: 'status', type: 'string', required: false, description: 'Filter by order status' },
          ],
        },
        {
          path: 'reports',
          description: 'Report generation',
          verbs: ['GET', 'POST'],
          requiresAuth: true,
          parameters: [
            { name: 'type', type: 'string', required: true, description: 'Report type' },
            { name: 'date_from', type: 'string', required: false, description: 'Start date' },
            { name: 'date_to', type: 'string', required: false, description: 'End date' },
          ],
        },
      ],
      
      email: [
        {
          path: 'send',
          description: 'Send email messages',
          verbs: ['POST'],
          requiresAuth: true,
          parameters: [
            { name: 'to', type: 'string', required: true, description: 'Recipient email address' },
            { name: 'subject', type: 'string', required: true, description: 'Email subject' },
            { name: 'template', type: 'string', required: false, description: 'Email template name' },
          ],
        },
        {
          path: 'queue',
          description: 'Email queue management',
          verbs: ['GET', 'DELETE'],
          requiresAuth: true,
          parameters: [
            { name: 'status', type: 'string', required: false, description: 'Queue status filter' },
          ],
        },
      ],
      
      swagger: [
        {
          path: 'pets',
          description: 'Pet store operations',
          verbs: ['GET', 'POST', 'PUT', 'DELETE'],
          requiresAuth: false,
          parameters: [
            { name: 'id', type: 'number', required: false, description: 'Pet ID' },
            { name: 'status', type: 'string', required: false, description: 'Pet status' },
          ],
        },
      ],
    };
    
    return componentsByType[type] || [];
  };

  const baseService: SchedulerService = {
    id: service.id.toString(),
    name: service.name,
    type: service.type,
    label: service.label,
    isActive: service.is_active,
    components: getServiceComponents(service.type),
  };

  return { ...baseService, ...overrides };
};

/**
 * Task execution response factory for testing manual execution scenarios
 */
export const taskExecutionResponseFactory = (
  scenario: 'success' | 'error' | 'timeout' = 'success',
  overrides: Partial<SchedulerTaskExecutionResponse> = {}
): SchedulerTaskExecutionResponse => {
  const scenarios = {
    success: {
      success: true,
      statusCode: 200,
      content: {
        message: 'Task executed successfully',
        records_affected: 25,
        execution_details: {
          start_time: new Date().toISOString(),
          memory_peak: '3.2MB',
          queries_executed: 5,
        },
      },
      duration: 150,
      logId: `log_${Date.now()}`,
    },
    
    error: {
      success: false,
      statusCode: 500,
      errorMessage: 'Task execution failed: Database connection error',
      content: {
        error: {
          type: 'DatabaseConnectionException',
          message: 'Unable to connect to database server',
          code: 'DB_CONN_001',
        },
      },
      duration: 5000,
      logId: `log_${Date.now()}`,
    },
    
    timeout: {
      success: false,
      statusCode: 408,
      errorMessage: 'Task execution timed out',
      content: {
        error: {
          type: 'TimeoutException',
          message: 'Operation exceeded maximum execution time',
          timeout_seconds: 30,
        },
      },
      duration: 30000,
      logId: `log_${Date.now()}`,
    },
  };

  const scenarioData = scenarios[scenario];
  return { ...scenarioData, ...overrides };
};

/**
 * Scheduler statistics factory for dashboard and overview components
 */
export const schedulerStatsFactory = (overrides: Partial<SchedulerTaskStats> = {}): SchedulerTaskStats => {
  const totalTasks = overrides.totalTasks || Math.floor(Math.random() * 100) + 20;
  const activeTasks = overrides.activeTasks || Math.floor(totalTasks * 0.7);
  const inactiveTasks = totalTasks - activeTasks;
  const errorTasks = overrides.errorTasks || Math.floor(activeTasks * 0.1);
  const successTasks = activeTasks - errorTasks;

  const baseStats: SchedulerTaskStats = {
    totalTasks,
    activeTasks,
    inactiveTasks,
    errorTasks,
    successTasks,
    averageFrequency: Math.floor(Math.random() * 3600) + 300, // 5 minutes to 1 hour
    lastExecution: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(), // Within last hour
  };

  return { ...baseStats, ...overrides };
};

/**
 * Factory composition allowing complex scheduling scenarios with related services
 * Creates comprehensive test scenarios with multiple interconnected components
 */
export const complexSchedulingScenarioFactory = (
  scenarioType: 'data_sync' | 'report_generation' | 'cleanup_tasks' | 'notification_workflow' = 'data_sync'
) => {
  const scenarios = {
    data_sync: () => {
      const sourceService = serviceFactory('mysql', { name: 'source-db' });
      const targetService = serviceFactory('pgsql', { name: 'target-db' });
      
      return {
        services: [sourceService, targetService],
        tasks: [
          schedulerTaskFactory(sourceService, {
            name: 'extract_user_data',
            component: 'users',
            verb: 'GET',
            frequency: 3600, // Hourly
            description: 'Extract user data for synchronization',
          }),
          schedulerTaskFactory(targetService, {
            name: 'load_user_data',
            component: 'users',
            verb: 'POST',
            frequency: 3660, // 1 minute after extraction
            description: 'Load extracted user data into target database',
          }),
        ],
        logs: [
          taskLogFactory('extract_user_data', 'success'),
          taskLogFactory('load_user_data', 'success'),
        ],
      };
    },
    
    report_generation: () => {
      const dbService = serviceFactory('mysql', { name: 'analytics-db' });
      const emailService = serviceFactory('email', { name: 'notification-email' });
      
      return {
        services: [dbService, emailService],
        tasks: [
          schedulerTaskFactory(dbService, {
            name: 'generate_daily_report',
            component: 'reports',
            verb: 'POST',
            frequency: 86400, // Daily
            description: 'Generate daily analytics report',
            payload: {
              report_type: 'daily_summary',
              format: 'pdf',
              include_charts: true,
            },
          }),
          schedulerTaskFactory(emailService, {
            name: 'send_report_email',
            component: 'send',
            verb: 'POST',
            frequency: 86460, // 1 minute after report generation
            description: 'Email daily report to stakeholders',
            payload: {
              to: 'stakeholders@company.com',
              subject: 'Daily Analytics Report - {{date}}',
              template: 'daily_report',
            },
          }),
        ],
        logs: [
          taskLogFactory('generate_daily_report', 'success'),
          taskLogFactory('send_report_email', 'success'),
        ],
      };
    },
    
    cleanup_tasks: () => {
      const dbService = serviceFactory('mysql', { name: 'main-db' });
      
      return {
        services: [dbService],
        tasks: [
          schedulerTaskFactory(dbService, {
            name: 'cleanup_old_logs',
            component: 'logs',
            verb: 'DELETE',
            frequency: 86400, // Daily
            description: 'Remove log entries older than 30 days',
            query: {
              filter: 'created_date < DATE_SUB(NOW(), INTERVAL 30 DAY)',
            },
          }),
          schedulerTaskFactory(dbService, {
            name: 'cleanup_temp_files',
            component: 'temp_files',
            verb: 'DELETE',
            frequency: 7200, // Every 2 hours
            description: 'Remove temporary files older than 24 hours',
            query: {
              filter: 'created_date < DATE_SUB(NOW(), INTERVAL 24 HOUR)',
            },
          }),
          schedulerTaskFactory(dbService, {
            name: 'vacuum_database',
            component: 'maintenance',
            verb: 'POST',
            frequency: 604800, // Weekly
            description: 'Optimize database performance',
            payload: {
              operation: 'vacuum',
              analyze: true,
            },
          }),
        ],
        logs: [
          taskLogFactory('cleanup_old_logs', 'success'),
          taskLogFactory('cleanup_temp_files', 'success'),
          taskLogFactory('vacuum_database', 'success'),
        ],
      };
    },
    
    notification_workflow: () => {
      const dbService = serviceFactory('mysql', { name: 'user-db' });
      const emailService = serviceFactory('email', { name: 'user-notifications' });
      const httpService = serviceFactory('http', { name: 'webhook-service' });
      
      return {
        services: [dbService, emailService, httpService],
        tasks: [
          schedulerTaskFactory(dbService, {
            name: 'check_user_activity',
            component: 'users',
            verb: 'GET',
            frequency: 900, // Every 15 minutes
            description: 'Check for inactive users requiring notification',
            query: {
              filter: 'last_login_date < DATE_SUB(NOW(), INTERVAL 7 DAY)',
              limit: 50,
            },
          }),
          schedulerTaskFactory(emailService, {
            name: 'send_activity_reminder',
            component: 'send',
            verb: 'POST',
            frequency: 960, // 1 minute after check
            description: 'Send activity reminder emails',
            payload: {
              template: 'activity_reminder',
              personalized: true,
            },
          }),
          schedulerTaskFactory(httpService, {
            name: 'webhook_notification',
            component: 'webhooks',
            verb: 'POST',
            frequency: 1020, // 2 minutes after check
            description: 'Send webhook notifications for inactive users',
            payload: {
              event: 'user_inactive',
              include_user_data: false,
            },
          }),
        ],
        logs: [
          taskLogFactory('check_user_activity', 'success'),
          taskLogFactory('send_activity_reminder', 'success'),
          taskLogFactory('webhook_notification', 'error', {
            errorMessage: 'Webhook endpoint returned 404',
            statusCode: 404,
          }),
        ],
      };
    },
  };

  const scenario = scenarios[scenarioType];
  return scenario();
};

/**
 * Error scenario generation including REST exceptions and timeout scenarios
 * Provides comprehensive error testing data for robust error handling validation
 */
export const errorScenarioFactory = (
  errorType: 'network' | 'auth' | 'permission' | 'data' | 'timeout' | 'server' = 'network'
) => {
  const baseService = serviceFactory('mysql');
  const baseTask = schedulerTaskFactory(baseService);

  const errorScenarios = {
    network: {
      task: { ...baseTask, name: 'network_error_task' },
      log: taskLogFactory(baseTask.id, 'error', {
        statusCode: 0,
        errorMessage: 'Network unreachable: Connection refused',
        content: JSON.stringify({
          error: {
            type: 'NetworkException',
            message: 'Unable to establish network connection',
            details: 'Connection timeout after 30 seconds',
          },
        }),
        duration: 30000,
        metadata: {
          network_error: true,
          retry_attempts: 3,
          last_successful_connection: '2024-01-01T10:00:00.000Z',
        },
      }),
      executionResponse: taskExecutionResponseFactory('timeout', {
        errorMessage: 'Network connection failed',
      }),
    },
    
    auth: {
      task: { ...baseTask, name: 'auth_error_task' },
      log: taskLogFactory(baseTask.id, 'auth_error'),
      executionResponse: taskExecutionResponseFactory('error', {
        statusCode: 401,
        errorMessage: 'Authentication failed: Invalid credentials',
      }),
    },
    
    permission: {
      task: { ...baseTask, name: 'permission_error_task' },
      log: taskLogFactory(baseTask.id, 'error', {
        statusCode: 403,
        errorMessage: 'Insufficient permissions to access resource',
        content: JSON.stringify({
          error: {
            type: 'PermissionException',
            message: 'Access denied to component: users',
            required_role: 'admin',
            current_role: 'user',
          },
        }),
        metadata: {
          permission_denied: true,
          required_permissions: ['read_users', 'write_users'],
          user_permissions: ['read_basic'],
        },
      }),
      executionResponse: taskExecutionResponseFactory('error', {
        statusCode: 403,
        errorMessage: 'Access denied: Insufficient permissions',
      }),
    },
    
    data: {
      task: { ...baseTask, name: 'data_error_task' },
      log: taskLogFactory(baseTask.id, 'error', {
        statusCode: 422,
        errorMessage: 'Data validation failed: Invalid format',
        content: JSON.stringify({
          error: {
            type: 'ValidationException',
            message: 'Request data validation failed',
            validation_errors: [
              { field: 'email', message: 'Invalid email format' },
              { field: 'age', message: 'Must be between 18 and 100' },
            ],
          },
        }),
        metadata: {
          validation_failed: true,
          invalid_fields: ['email', 'age'],
          input_data_size: 1024,
        },
      }),
      executionResponse: taskExecutionResponseFactory('error', {
        statusCode: 422,
        errorMessage: 'Data validation errors occurred',
      }),
    },
    
    timeout: {
      task: { ...baseTask, name: 'timeout_error_task', frequency: 30 },
      log: taskLogFactory(baseTask.id, 'timeout'),
      executionResponse: taskExecutionResponseFactory('timeout'),
    },
    
    server: {
      task: { ...baseTask, name: 'server_error_task' },
      log: taskLogFactory(baseTask.id, 'server_error'),
      executionResponse: taskExecutionResponseFactory('error', {
        statusCode: 503,
        errorMessage: 'Service temporarily unavailable',
      }),
    },
  };

  return errorScenarios[errorType];
};

/**
 * Comprehensive scheduler test data factory
 * Creates complete datasets for testing scheduler management interfaces
 */
export const createSchedulerTestDataSet = () => {
  const services = [
    serviceFactory('mysql', { name: 'primary-db' }),
    serviceFactory('pgsql', { name: 'analytics-db' }),
    serviceFactory('sqlite', { name: 'cache-db' }),
    serviceFactory('email', { name: 'notifications' }),
    serviceFactory('swagger', { name: 'external-api' }),
  ];

  const tasks = services.flatMap(service => [
    schedulerTaskFactory(service, { frequency: 3600 }), // Hourly
    schedulerTaskFactory(service, { frequency: 86400 }), // Daily
  ]);

  const logs = tasks.map(task => 
    taskLogFactory(task.id, Math.random() > 0.8 ? 'error' : 'success')
  );

  return {
    services,
    schedulerServices: services.map(s => schedulerServiceFactory(s.type)),
    tasks,
    logs,
    stats: schedulerStatsFactory({ totalTasks: tasks.length }),
    scenarios: {
      dataSync: complexSchedulingScenarioFactory('data_sync'),
      reportGeneration: complexSchedulingScenarioFactory('report_generation'),
      cleanupTasks: complexSchedulingScenarioFactory('cleanup_tasks'),
      notificationWorkflow: complexSchedulingScenarioFactory('notification_workflow'),
    },
    errorScenarios: {
      network: errorScenarioFactory('network'),
      auth: errorScenarioFactory('auth'),
      permission: errorScenarioFactory('permission'),
      data: errorScenarioFactory('data'),
      timeout: errorScenarioFactory('timeout'),
      server: errorScenarioFactory('server'),
    },
  };
};

// Export factory functions for backward compatibility and convenience
export {
  serviceFactory as createDatabaseService,
  schedulerTaskFactory as createSchedulerTask,
  taskLogFactory as createTaskLog,
  schedulerServiceFactory as createSchedulerService,
  taskExecutionResponseFactory as createTaskExecutionResponse,
  schedulerStatsFactory as createSchedulerStats,
};