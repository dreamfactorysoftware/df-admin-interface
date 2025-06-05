/**
 * System configuration fixture factory functions that generate realistic system settings 
 * and environment data for testing React components and Next.js middleware.
 * 
 * These factories provide comprehensive test data for system management interfaces,
 * environment configuration, email templates, CORS settings, and caching configurations.
 */

import { faker } from '@faker-js/faker';

// ===================
// Type Definitions
// ===================

export interface SystemConfig {
  id: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  debug: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  apiVersion: string;
  maxRequestSize: number;
  timeZone: string;
  locale: string;
  features: Record<string, boolean>;
  maintenance: {
    enabled: boolean;
    message?: string;
    allowedIps?: string[];
  };
  performance: {
    enableCaching: boolean;
    cacheTimeout: number;
    enableCompression: boolean;
    enableMinification: boolean;
  };
}

export interface EnvironmentConfig {
  NODE_ENV: string;
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_VERSION: string;
  NEXT_PUBLIC_DEBUG: string;
  API_BASE_URL: string;
  SESSION_SECRET: string;
  ANALYTICS_ID?: string;
  SENTRY_DSN?: string;
  DATABASE_URL?: string;
  REDIS_URL?: string;
  LOG_LEVEL: string;
  ENABLE_TELEMETRY: string;
  CDN_URL?: string;
  UPLOAD_MAX_SIZE: string;
}

export interface GlobalLookupKey {
  id: string;
  key: string;
  value: string;
  description: string;
  category: 'system' | 'ui' | 'api' | 'security' | 'performance';
  isActive: boolean;
  isReadonly: boolean;
  dataType: 'string' | 'number' | 'boolean' | 'json';
  validationRule?: string;
  defaultValue?: string;
  lastModified: string;
  modifiedBy: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  type: 'welcome' | 'password_reset' | 'invitation' | 'notification' | 'alert';
  isActive: boolean;
  variables: string[];
  createdDate: string;
  modifiedDate: string;
  createdBy: string;
  modifiedBy: string;
}

export interface SmtpConfig {
  id: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  maxConnections: number;
  rateDelta: number;
  rateLimit: number;
  isActive: boolean;
  testMode: boolean;
}

export interface CorsConfig {
  id: string;
  enabled: boolean;
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  allowCredentials: boolean;
  maxAge: number;
  preflightContinue: boolean;
  optionsSuccessStatus: number;
  isActive: boolean;
  description?: string;
}

export interface CacheConfig {
  id: string;
  provider: 'memory' | 'redis' | 'file' | 'database';
  enabled: boolean;
  defaultTtl: number;
  maxKeys: number;
  keyPrefix: string;
  compression: {
    enabled: boolean;
    algorithm: 'gzip' | 'deflate' | 'br';
  };
  persistence: {
    enabled: boolean;
    interval: number;
  };
  statistics: {
    hits: number;
    misses: number;
    hitRatio: number;
    keyCount: number;
    memoryUsage: number;
  };
  config: Record<string, any>;
}

export interface SystemInfo {
  id: string;
  timestamp: string;
  platform: string;
  serverName: string;
  version: {
    application: string;
    framework: string;
    node: string;
    platform: string;
  };
  resources: {
    memory: {
      total: number;
      used: number;
      free: number;
      percentage: number;
    };
    disk: {
      total: number;
      used: number;
      free: number;
      percentage: number;
    };
    cpu: {
      cores: number;
      usage: number;
      loadAverage: number[];
    };
  };
  database: {
    connected: boolean;
    version?: string;
    connectionCount: number;
    maxConnections: number;
  };
  uptime: number;
  environment: string;
  debugMode: boolean;
}

export interface HealthCheck {
  id: string;
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    name: string;
    status: 'up' | 'down' | 'degraded';
    responseTime: number;
    lastCheck: string;
    message?: string;
  }[];
  overallHealth: {
    score: number;
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
  };
  checks: {
    database: boolean;
    cache: boolean;
    storage: boolean;
    email: boolean;
    external_apis: boolean;
  };
}

// ===================
// Factory Options
// ===================

export interface SystemConfigFactoryOptions {
  environment?: 'development' | 'staging' | 'production';
  debug?: boolean;
  features?: Record<string, boolean>;
  maintenanceMode?: boolean;
  version?: string;
}

export interface EnvironmentConfigFactoryOptions {
  environment?: string;
  enableDebug?: boolean;
  includeOptional?: boolean;
  apiUrl?: string;
}

export interface GlobalLookupFactoryOptions {
  category?: 'system' | 'ui' | 'api' | 'security' | 'performance';
  count?: number;
  includeInactive?: boolean;
  includeReadonly?: boolean;
}

export interface EmailTemplateFactoryOptions {
  type?: 'welcome' | 'password_reset' | 'invitation' | 'notification' | 'alert';
  includeInactive?: boolean;
  withHtml?: boolean;
}

export interface CorsConfigFactoryOptions {
  enabled?: boolean;
  restrictive?: boolean;
  includeCredentials?: boolean;
}

export interface CacheConfigFactoryOptions {
  provider?: 'memory' | 'redis' | 'file' | 'database';
  enabled?: boolean;
  withStatistics?: boolean;
}

export interface SystemInfoFactoryOptions {
  includeResources?: boolean;
  highLoad?: boolean;
  connectedDatabase?: boolean;
}

export interface HealthCheckFactoryOptions {
  status?: 'healthy' | 'degraded' | 'unhealthy';
  failingServices?: string[];
  includeAllServices?: boolean;
}

// ===================
// Factory Functions
// ===================

/**
 * Creates system-wide configuration settings with environment-specific values
 */
export function systemConfigFactory(
  options: SystemConfigFactoryOptions = {}
): SystemConfig {
  const {
    environment = faker.helpers.arrayElement(['development', 'staging', 'production']),
    debug = environment === 'development',
    features = {},
    maintenanceMode = false,
    version = faker.system.semver()
  } = options;

  return {
    id: faker.string.uuid(),
    environment,
    version,
    debug,
    logLevel: debug ? 'debug' : 'info',
    apiVersion: 'v2',
    maxRequestSize: faker.number.int({ min: 1024 * 1024, max: 10 * 1024 * 1024 }), // 1MB to 10MB
    timeZone: faker.location.timeZone(),
    locale: faker.location.countryCode(),
    features: {
      enableAnalytics: faker.datatype.boolean(),
      enableMetrics: faker.datatype.boolean(),
      enableTelemetry: environment !== 'development',
      enableDebugLogging: debug,
      enableApiDocs: true,
      enableSwagger: true,
      enableCors: true,
      enableRateLimit: environment === 'production',
      ...features
    },
    maintenance: {
      enabled: maintenanceMode,
      message: maintenanceMode ? faker.lorem.sentence() : undefined,
      allowedIps: maintenanceMode ? [faker.internet.ip(), faker.internet.ip()] : undefined
    },
    performance: {
      enableCaching: environment === 'production',
      cacheTimeout: faker.number.int({ min: 300, max: 3600 }), // 5 minutes to 1 hour
      enableCompression: environment === 'production',
      enableMinification: environment === 'production'
    }
  };
}

/**
 * Creates Next.js environment variable configurations for testing runtime settings
 */
export function environmentConfigFactory(
  options: EnvironmentConfigFactoryOptions = {}
): EnvironmentConfig {
  const {
    environment = 'development',
    enableDebug = environment === 'development',
    includeOptional = true,
    apiUrl = 'http://localhost:80'
  } = options;

  const config: EnvironmentConfig = {
    NODE_ENV: environment,
    NEXT_PUBLIC_API_URL: `${apiUrl}/api/v2`,
    NEXT_PUBLIC_VERSION: faker.system.semver(),
    NEXT_PUBLIC_DEBUG: enableDebug.toString(),
    API_BASE_URL: `${apiUrl}/api/v2`,
    SESSION_SECRET: faker.string.alphanumeric(32),
    LOG_LEVEL: enableDebug ? 'debug' : 'info',
    ENABLE_TELEMETRY: (environment === 'production').toString(),
    UPLOAD_MAX_SIZE: faker.helpers.arrayElement(['5MB', '10MB', '50MB', '100MB'])
  };

  if (includeOptional) {
    config.ANALYTICS_ID = faker.string.alphanumeric(20);
    config.SENTRY_DSN = `https://${faker.string.alphanumeric(32)}@sentry.io/${faker.number.int(1000000)}`;
    config.DATABASE_URL = `postgresql://${faker.internet.userName()}:${faker.internet.password()}@${faker.internet.domainName()}:5432/${faker.database.collation()}`;
    config.REDIS_URL = `redis://:${faker.internet.password()}@${faker.internet.domainName()}:6379`;
    config.CDN_URL = `https://${faker.internet.domainName()}`;
  }

  return config;
}

/**
 * Creates system lookup keys and global configuration values
 */
export function globalLookupFactory(
  options: GlobalLookupFactoryOptions = {}
): GlobalLookupKey {
  const {
    category = faker.helpers.arrayElement(['system', 'ui', 'api', 'security', 'performance']),
    includeInactive = false,
    includeReadonly = true
  } = options;

  const dataType = faker.helpers.arrayElement(['string', 'number', 'boolean', 'json']);
  
  let value: string;
  let defaultValue: string;
  
  switch (dataType) {
    case 'number':
      value = faker.number.int({ min: 1, max: 1000 }).toString();
      defaultValue = '0';
      break;
    case 'boolean':
      value = faker.datatype.boolean().toString();
      defaultValue = 'false';
      break;
    case 'json':
      value = JSON.stringify({ [faker.hacker.noun()]: faker.hacker.phrase() });
      defaultValue = '{}';
      break;
    default:
      value = faker.hacker.phrase();
      defaultValue = faker.lorem.word();
  }

  return {
    id: faker.string.uuid(),
    key: `${category.toUpperCase()}_${faker.hacker.noun().toUpperCase()}`,
    value,
    description: faker.lorem.sentence(),
    category,
    isActive: includeInactive ? faker.datatype.boolean() : true,
    isReadonly: includeReadonly ? faker.datatype.boolean() : false,
    dataType,
    validationRule: dataType === 'number' ? 'min:0,max:1000' : undefined,
    defaultValue,
    lastModified: faker.date.recent().toISOString(),
    modifiedBy: faker.person.fullName()
  };
}

/**
 * Creates multiple global lookup keys for testing list scenarios
 */
export function globalLookupListFactory(
  options: GlobalLookupFactoryOptions & { count?: number } = {}
): GlobalLookupKey[] {
  const { count = faker.number.int({ min: 5, max: 20 }) } = options;
  
  return Array.from({ length: count }, () => globalLookupFactory(options));
}

/**
 * Creates email template configurations for testing notification workflows
 */
export function emailTemplateFactory(
  options: EmailTemplateFactoryOptions = {}
): EmailTemplate {
  const {
    type = faker.helpers.arrayElement(['welcome', 'password_reset', 'invitation', 'notification', 'alert']),
    includeInactive = false,
    withHtml = true
  } = options;

  const subject = `${type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${faker.lorem.words(3)}`;
  const variables = ['{{user.name}}', '{{user.email}}', '{{app.name}}', '{{system.url}}'];

  return {
    id: faker.string.uuid(),
    name: `${type}_template_${faker.lorem.word()}`,
    subject,
    bodyText: faker.lorem.paragraphs(3),
    bodyHtml: withHtml ? `<h1>${subject}</h1>\n<p>${faker.lorem.paragraphs(2, '</p>\n<p>')}</p>` : '',
    type,
    isActive: includeInactive ? faker.datatype.boolean() : true,
    variables,
    createdDate: faker.date.past().toISOString(),
    modifiedDate: faker.date.recent().toISOString(),
    createdBy: faker.person.fullName(),
    modifiedBy: faker.person.fullName()
  };
}

/**
 * Creates SMTP configuration for email services
 */
export function smtpConfigFactory(): SmtpConfig {
  return {
    id: faker.string.uuid(),
    host: faker.helpers.arrayElement(['smtp.gmail.com', 'smtp.sendgrid.net', 'smtp.mailgun.org', 'localhost']),
    port: faker.helpers.arrayElement([25, 465, 587, 2525]),
    secure: faker.datatype.boolean(),
    username: faker.internet.email(),
    password: faker.internet.password(),
    fromEmail: faker.internet.email(),
    fromName: faker.company.name(),
    replyToEmail: faker.internet.email(),
    maxConnections: faker.number.int({ min: 1, max: 10 }),
    rateDelta: faker.number.int({ min: 1000, max: 60000 }), // 1 second to 1 minute
    rateLimit: faker.number.int({ min: 10, max: 100 }),
    isActive: faker.datatype.boolean(),
    testMode: faker.datatype.boolean()
  };
}

/**
 * Creates CORS policy configurations and security headers
 */
export function corsConfigFactory(
  options: CorsConfigFactoryOptions = {}
): CorsConfig {
  const {
    enabled = true,
    restrictive = false,
    includeCredentials = true
  } = options;

  const allowedOrigins = restrictive 
    ? ['https://localhost:3000', 'https://admin.dreamfactory.com']
    : ['*'];

  return {
    id: faker.string.uuid(),
    enabled,
    allowedOrigins,
    allowedMethods: restrictive 
      ? ['GET', 'POST'] 
      : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-DreamFactory-API-Key',
      'X-DreamFactory-Session-Token'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Response-Time'],
    allowCredentials: includeCredentials,
    maxAge: faker.number.int({ min: 3600, max: 86400 }), // 1 hour to 1 day
    preflightContinue: false,
    optionsSuccessStatus: 204,
    isActive: enabled,
    description: faker.lorem.sentence()
  };
}

/**
 * Creates system caching configurations and performance settings
 */
export function cacheConfigFactory(
  options: CacheConfigFactoryOptions = {}
): CacheConfig {
  const {
    provider = faker.helpers.arrayElement(['memory', 'redis', 'file', 'database']),
    enabled = true,
    withStatistics = true
  } = options;

  const hits = faker.number.int({ min: 1000, max: 100000 });
  const misses = faker.number.int({ min: 100, max: 10000 });

  return {
    id: faker.string.uuid(),
    provider,
    enabled,
    defaultTtl: faker.number.int({ min: 300, max: 3600 }), // 5 minutes to 1 hour
    maxKeys: faker.number.int({ min: 1000, max: 100000 }),
    keyPrefix: `df_cache_${faker.lorem.word()}_`,
    compression: {
      enabled: faker.datatype.boolean(),
      algorithm: faker.helpers.arrayElement(['gzip', 'deflate', 'br'])
    },
    persistence: {
      enabled: provider !== 'memory',
      interval: faker.number.int({ min: 60, max: 300 }) // 1 to 5 minutes
    },
    statistics: withStatistics ? {
      hits,
      misses,
      hitRatio: Number((hits / (hits + misses) * 100).toFixed(2)),
      keyCount: faker.number.int({ min: 100, max: 10000 }),
      memoryUsage: faker.number.int({ min: 1024 * 1024, max: 100 * 1024 * 1024 }) // 1MB to 100MB
    } : {
      hits: 0,
      misses: 0,
      hitRatio: 0,
      keyCount: 0,
      memoryUsage: 0
    },
    config: provider === 'redis' ? {
      host: faker.internet.domainName(),
      port: 6379,
      password: faker.internet.password(),
      database: faker.number.int({ min: 0, max: 15 })
    } : {}
  };
}

/**
 * Creates system information and health check scenarios
 */
export function systemInfoFactory(
  options: SystemInfoFactoryOptions = {}
): SystemInfo {
  const {
    includeResources = true,
    highLoad = false,
    connectedDatabase = true
  } = options;

  const memoryTotal = faker.number.int({ min: 1024 * 1024 * 1024, max: 16 * 1024 * 1024 * 1024 }); // 1GB to 16GB
  const memoryUsed = highLoad 
    ? faker.number.int({ min: memoryTotal * 0.8, max: memoryTotal * 0.95 })
    : faker.number.int({ min: memoryTotal * 0.3, max: memoryTotal * 0.7 });

  const diskTotal = faker.number.int({ min: 100 * 1024 * 1024 * 1024, max: 1024 * 1024 * 1024 * 1024 }); // 100GB to 1TB
  const diskUsed = faker.number.int({ min: diskTotal * 0.2, max: diskTotal * 0.8 });

  return {
    id: faker.string.uuid(),
    timestamp: faker.date.recent().toISOString(),
    platform: faker.helpers.arrayElement(['linux', 'darwin', 'win32']),
    serverName: faker.internet.domainName(),
    version: {
      application: faker.system.semver(),
      framework: 'Next.js 15.1.0',
      node: 'v20.10.0',
      platform: faker.system.semver()
    },
    resources: includeResources ? {
      memory: {
        total: memoryTotal,
        used: memoryUsed,
        free: memoryTotal - memoryUsed,
        percentage: Number((memoryUsed / memoryTotal * 100).toFixed(2))
      },
      disk: {
        total: diskTotal,
        used: diskUsed,
        free: diskTotal - diskUsed,
        percentage: Number((diskUsed / diskTotal * 100).toFixed(2))
      },
      cpu: {
        cores: faker.number.int({ min: 2, max: 16 }),
        usage: highLoad ? faker.number.float({ min: 80, max: 95 }) : faker.number.float({ min: 10, max: 60 }),
        loadAverage: Array.from({ length: 3 }, () => 
          highLoad ? faker.number.float({ min: 2, max: 8 }) : faker.number.float({ min: 0.1, max: 1.5 })
        )
      }
    } : {
      memory: { total: 0, used: 0, free: 0, percentage: 0 },
      disk: { total: 0, used: 0, free: 0, percentage: 0 },
      cpu: { cores: 0, usage: 0, loadAverage: [] }
    },
    database: {
      connected: connectedDatabase,
      version: connectedDatabase ? faker.system.semver() : undefined,
      connectionCount: connectedDatabase ? faker.number.int({ min: 1, max: 50 }) : 0,
      maxConnections: 100
    },
    uptime: faker.number.int({ min: 3600, max: 2592000 }), // 1 hour to 30 days
    environment: faker.helpers.arrayElement(['development', 'staging', 'production']),
    debugMode: faker.datatype.boolean()
  };
}

/**
 * Creates health check scenarios for system monitoring
 */
export function healthCheckFactory(
  options: HealthCheckFactoryOptions = {}
): HealthCheck {
  const {
    status = faker.helpers.arrayElement(['healthy', 'degraded', 'unhealthy']),
    failingServices = [],
    includeAllServices = true
  } = options;

  const serviceNames = includeAllServices 
    ? ['database', 'cache', 'storage', 'email', 'api', 'auth', 'queue']
    : ['database', 'cache', 'storage'];

  const services = serviceNames.map(name => {
    const isFailingService = failingServices.includes(name);
    const serviceStatus = isFailingService 
      ? faker.helpers.arrayElement(['down', 'degraded'])
      : status === 'unhealthy' 
        ? faker.helpers.arrayElement(['up', 'degraded'])
        : 'up';

    return {
      name,
      status: serviceStatus as 'up' | 'down' | 'degraded',
      responseTime: serviceStatus === 'down' 
        ? 0 
        : faker.number.int({ min: 10, max: serviceStatus === 'degraded' ? 5000 : 500 }),
      lastCheck: faker.date.recent().toISOString(),
      message: serviceStatus !== 'up' ? faker.lorem.sentence() : undefined
    };
  });

  const healthyServices = services.filter(s => s.status === 'up').length;
  const totalServices = services.length;
  const healthScore = Math.round((healthyServices / totalServices) * 100);

  return {
    id: faker.string.uuid(),
    timestamp: faker.date.recent().toISOString(),
    status,
    services,
    overallHealth: {
      score: healthScore,
      status,
      message: status === 'healthy' 
        ? 'All systems operational'
        : status === 'degraded'
          ? 'Some services experiencing issues'
          : 'Critical system failures detected'
    },
    checks: {
      database: !failingServices.includes('database'),
      cache: !failingServices.includes('cache'),
      storage: !failingServices.includes('storage'),
      email: !failingServices.includes('email'),
      external_apis: !failingServices.includes('api')
    }
  };
}

// ===================
// Preset Configurations
// ===================

/**
 * Creates a complete system configuration for development environment
 */
export function developmentSystemPreset(): {
  systemConfig: SystemConfig;
  environmentConfig: EnvironmentConfig;
  corsConfig: CorsConfig;
  cacheConfig: CacheConfig;
} {
  return {
    systemConfig: systemConfigFactory({ 
      environment: 'development', 
      debug: true,
      maintenanceMode: false
    }),
    environmentConfig: environmentConfigFactory({ 
      environment: 'development', 
      enableDebug: true 
    }),
    corsConfig: corsConfigFactory({ 
      enabled: true, 
      restrictive: false 
    }),
    cacheConfig: cacheConfigFactory({ 
      provider: 'memory', 
      enabled: true 
    })
  };
}

/**
 * Creates a complete system configuration for production environment
 */
export function productionSystemPreset(): {
  systemConfig: SystemConfig;
  environmentConfig: EnvironmentConfig;
  corsConfig: CorsConfig;
  cacheConfig: CacheConfig;
} {
  return {
    systemConfig: systemConfigFactory({ 
      environment: 'production', 
      debug: false,
      maintenanceMode: false
    }),
    environmentConfig: environmentConfigFactory({ 
      environment: 'production', 
      enableDebug: false 
    }),
    corsConfig: corsConfigFactory({ 
      enabled: true, 
      restrictive: true,
      includeCredentials: true
    }),
    cacheConfig: cacheConfigFactory({ 
      provider: 'redis', 
      enabled: true,
      withStatistics: true
    })
  };
}

/**
 * Creates system configuration in maintenance mode
 */
export function maintenanceModePreset(): {
  systemConfig: SystemConfig;
  healthCheck: HealthCheck;
} {
  return {
    systemConfig: systemConfigFactory({ 
      maintenanceMode: true,
      environment: 'production'
    }),
    healthCheck: healthCheckFactory({ 
      status: 'degraded',
      failingServices: ['api'] 
    })
  };
}

/**
 * Creates system configuration with high load scenario
 */
export function highLoadSystemPreset(): {
  systemInfo: SystemInfo;
  healthCheck: HealthCheck;
  cacheConfig: CacheConfig;
} {
  return {
    systemInfo: systemInfoFactory({ 
      highLoad: true,
      includeResources: true,
      connectedDatabase: true
    }),
    healthCheck: healthCheckFactory({ 
      status: 'degraded',
      failingServices: ['cache']
    }),
    cacheConfig: cacheConfigFactory({ 
      provider: 'redis',
      enabled: true,
      withStatistics: true
    })
  };
}