/**
 * System Configuration Fixture Factory Functions
 * 
 * Provides comprehensive factory functions for creating realistic system settings
 * and environment data for testing React components and Next.js middleware.
 * These fixtures support testing of system management interfaces, configuration
 * workflows, and deployment scenarios per Feature F-007 specifications.
 * 
 * @fileoverview System configuration test fixtures
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import {
  Environment,
  System,
  SystemInfo,
  ServerInfo,
  AuthenticationConfig,
  ADLDAPConfig,
  OAuthConfig,
  SAMLConfig,
  EmailConfig,
  CORSConfig,
  LookupKey,
  CacheConfig,
  SystemHealth,
  ComponentHealth,
  PerformanceMetrics,
  SystemOperationResult,
  SystemConfigUpdate,
  LicenseValidationResponse,
  SystemResource,
  DEFAULT_ENVIRONMENT,
  DEFAULT_SYSTEM,
} from '../../types/system';

// =============================================================================
// SYSTEM CONFIGURATION FACTORY FUNCTIONS
// =============================================================================

/**
 * Creates comprehensive system-wide configuration settings with environment-specific values
 * Supports testing of system management interfaces and configuration workflows
 */
export const systemConfigFactory = (
  environment: 'development' | 'staging' | 'production' = 'development',
  overrides: Partial<Environment> = {}
): Environment => {
  const environmentConfigs = {
    development: {
      authentication: {
        allowOpenRegistration: true,
        openRegEmailServiceId: 1,
        allowForeverSessions: true,
        loginAttribute: 'email',
        adldap: [],
        oauth: [
          createOAuthConfig({
            name: 'google-dev',
            label: 'Google OAuth (Development)',
            type: 'google',
            config: {
              client_id: 'dev-google-client-id',
              client_secret: 'dev-google-client-secret',
              redirect_url: 'http://localhost:3000/auth/google/callback',
              scope: ['openid', 'email', 'profile'],
            },
          }),
        ],
        saml: [],
      } as AuthenticationConfig,
      server: {
        host: 'localhost',
        machine: 'dev-machine-001',
        release: 'Ubuntu 22.04 LTS',
        serverOs: 'Linux',
        version: '5.0.0-dev',
        uptime: 3600,
        hosted: false,
      } as ServerInfo,
      license: false, // Open source development
    },
    staging: {
      authentication: {
        allowOpenRegistration: false,
        openRegEmailServiceId: 2,
        allowForeverSessions: false,
        loginAttribute: 'email',
        adldap: [
          createADLDAPConfig({
            name: 'company-ldap',
            label: 'Company LDAP',
            config: {
              host: 'ldap.staging.company.com',
              port: 389,
              base_dn: 'DC=staging,DC=company,DC=com',
              account_suffix: '@staging.company.com',
              username: 'uid',
              password: 'password',
            },
          }),
        ],
        oauth: [
          createOAuthConfig({
            name: 'google-staging',
            label: 'Google OAuth (Staging)',
            type: 'google',
            config: {
              client_id: 'staging-google-client-id',
              client_secret: 'staging-google-client-secret',
              redirect_url: 'https://staging.company.com/auth/google/callback',
              scope: ['openid', 'email', 'profile'],
            },
          }),
        ],
        saml: [],
      } as AuthenticationConfig,
      server: {
        host: 'staging.company.com',
        machine: 'staging-web-001',
        release: 'Ubuntu 22.04 LTS',
        serverOs: 'Linux',
        version: '5.0.0-staging',
        uptime: 86400,
        hosted: true,
      } as ServerInfo,
      license: 'STAGING-LICENSE-KEY-12345',
    },
    production: {
      authentication: {
        allowOpenRegistration: false,
        openRegEmailServiceId: 3,
        allowForeverSessions: false,
        loginAttribute: 'email',
        adldap: [
          createADLDAPConfig({
            name: 'enterprise-ad',
            label: 'Enterprise Active Directory',
            config: {
              host: 'ad.company.com',
              port: 636,
              base_dn: 'DC=company,DC=com',
              account_suffix: '@company.com',
              username: 'sAMAccountName',
              password: 'password',
            },
          }),
        ],
        oauth: [
          createOAuthConfig({
            name: 'azure-ad',
            label: 'Azure Active Directory',
            type: 'azure',
            config: {
              client_id: 'prod-azure-client-id',
              client_secret: 'prod-azure-client-secret',
              redirect_url: 'https://api.company.com/auth/azure/callback',
              scope: ['openid', 'email', 'profile'],
              authority: 'https://login.microsoftonline.com/tenant-id',
            },
          }),
        ],
        saml: [
          createSAMLConfig({
            name: 'okta-saml',
            label: 'Okta SAML',
            config: {
              idp_entity_id: 'http://www.okta.com/exk1234567890',
              sso_service_url: 'https://company.okta.com/app/company_dreamfactory_1/exk1234567890/sso/saml',
              sls_service_url: 'https://company.okta.com/app/company_dreamfactory_1/exk1234567890/sls/saml',
              x509_cert: '-----BEGIN CERTIFICATE-----\nMIIC...CERTIFICATE_DATA_HERE...==\n-----END CERTIFICATE-----',
            },
          }),
        ],
      } as AuthenticationConfig,
      server: {
        host: 'api.company.com',
        machine: 'prod-api-cluster-001',
        release: 'Ubuntu 22.04 LTS',
        serverOs: 'Linux',
        version: '5.0.0',
        uptime: 2592000, // 30 days
        hosted: true,
      } as ServerInfo,
      license: 'PROD-ENTERPRISE-LICENSE-ABCDEF123456',
    },
  };

  const baseConfig = {
    ...DEFAULT_ENVIRONMENT,
    ...environmentConfigs[environment],
  };

  return { ...baseConfig, ...overrides };
};

/**
 * Creates Next.js environment variable configurations for testing runtime settings
 * and deployment scenarios
 */
export const environmentConfigFactory = (
  environment: 'development' | 'staging' | 'production' = 'development',
  overrides: Record<string, string> = {}
): Record<string, string> => {
  const environmentConfigs = {
    development: {
      NODE_ENV: 'development',
      NEXT_PUBLIC_API_URL: 'http://localhost:8000/api/v2',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_WS_URL: 'ws://localhost:8000',
      DATABASE_URL: 'mysql://root:password@localhost:3306/dreamfactory_dev',
      REDIS_URL: 'redis://localhost:6379',
      SESSION_SECRET: 'dev-session-secret-12345',
      JWT_SECRET: 'dev-jwt-secret-67890',
      SMTP_HOST: 'localhost',
      SMTP_PORT: '1025',
      SMTP_USER: '',
      SMTP_PASS: '',
      LOG_LEVEL: 'debug',
      CACHE_DRIVER: 'memory',
      CACHE_TTL: '300',
      CORS_ORIGINS: 'http://localhost:3000,http://localhost:8000',
      RATE_LIMIT_ENABLED: 'false',
      ANALYTICS_ENABLED: 'false',
      DEBUG_MODE: 'true',
    },
    staging: {
      NODE_ENV: 'staging',
      NEXT_PUBLIC_API_URL: 'https://staging-api.company.com/api/v2',
      NEXT_PUBLIC_APP_URL: 'https://staging.company.com',
      NEXT_PUBLIC_WS_URL: 'wss://staging-api.company.com',
      DATABASE_URL: 'mysql://df_user:staging_password@staging-db.company.com:3306/dreamfactory_staging',
      REDIS_URL: 'redis://staging-redis.company.com:6379',
      SESSION_SECRET: 'staging-session-secret-randomized',
      JWT_SECRET: 'staging-jwt-secret-randomized',
      SMTP_HOST: 'smtp.company.com',
      SMTP_PORT: '587',
      SMTP_USER: 'noreply@company.com',
      SMTP_PASS: 'staging-smtp-password',
      LOG_LEVEL: 'info',
      CACHE_DRIVER: 'redis',
      CACHE_TTL: '1800',
      CORS_ORIGINS: 'https://staging.company.com',
      RATE_LIMIT_ENABLED: 'true',
      ANALYTICS_ENABLED: 'true',
      DEBUG_MODE: 'false',
    },
    production: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_API_URL: 'https://api.company.com/api/v2',
      NEXT_PUBLIC_APP_URL: 'https://app.company.com',
      NEXT_PUBLIC_WS_URL: 'wss://api.company.com',
      DATABASE_URL: 'mysql://df_prod_user:${DB_PASSWORD}@prod-db-cluster.company.com:3306/dreamfactory_prod',
      REDIS_URL: 'redis://prod-redis-cluster.company.com:6379',
      SESSION_SECRET: '${SESSION_SECRET}',
      JWT_SECRET: '${JWT_SECRET}',
      SMTP_HOST: 'smtp.company.com',
      SMTP_PORT: '587',
      SMTP_USER: 'noreply@company.com',
      SMTP_PASS: '${SMTP_PASSWORD}',
      LOG_LEVEL: 'warn',
      CACHE_DRIVER: 'redis',
      CACHE_TTL: '3600',
      CORS_ORIGINS: 'https://app.company.com',
      RATE_LIMIT_ENABLED: 'true',
      ANALYTICS_ENABLED: 'true',
      DEBUG_MODE: 'false',
    },
  };

  return { ...environmentConfigs[environment], ...overrides };
};

/**
 * Creates system lookup keys and global configuration values for testing
 * system-wide settings and configuration management
 */
export const globalLookupFactory = (overrides: Partial<LookupKey>[] = []): LookupKey[] => {
  const baseLookupKeys: LookupKey[] = [
    {
      id: 1,
      name: 'app.name',
      value: 'DreamFactory Admin Interface',
      description: 'Application display name',
      private: false,
      created_date: '2024-01-01T00:00:00.000Z',
      last_modified_date: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      name: 'app.version',
      value: '5.0.0',
      description: 'Application version number',
      private: false,
      created_date: '2024-01-01T00:00:00.000Z',
      last_modified_date: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 3,
      name: 'app.debug',
      value: 'false',
      description: 'Enable debug mode',
      private: false,
      created_date: '2024-01-01T00:00:00.000Z',
      last_modified_date: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 4,
      name: 'api.default_limit',
      value: '100',
      description: 'Default API response limit',
      private: false,
      created_date: '2024-01-01T00:00:00.000Z',
      last_modified_date: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 5,
      name: 'api.max_limit',
      value: '1000',
      description: 'Maximum API response limit',
      private: false,
      created_date: '2024-01-01T00:00:00.000Z',
      last_modified_date: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 6,
      name: 'security.session_timeout',
      value: '3600',
      description: 'Session timeout in seconds',
      private: false,
      created_date: '2024-01-01T00:00:00.000Z',
      last_modified_date: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 7,
      name: 'security.password_min_length',
      value: '8',
      description: 'Minimum password length',
      private: false,
      created_date: '2024-01-01T00:00:00.000Z',
      last_modified_date: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 8,
      name: 'security.api_key',
      value: 'abcdef123456789',
      description: 'Master API key for system operations',
      private: true,
      created_date: '2024-01-01T00:00:00.000Z',
      last_modified_date: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 9,
      name: 'smtp.from_name',
      value: 'DreamFactory Notifications',
      description: 'Default sender name for emails',
      private: false,
      created_date: '2024-01-01T00:00:00.000Z',
      last_modified_date: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 10,
      name: 'ui.theme',
      value: 'light',
      description: 'Default UI theme',
      private: false,
      created_date: '2024-01-01T00:00:00.000Z',
      last_modified_date: '2024-01-01T00:00:00.000Z',
    },
  ];

  // Apply overrides to existing keys or add new ones
  const mergedKeys = [...baseLookupKeys];
  overrides.forEach((override, index) => {
    if (index < baseLookupKeys.length) {
      mergedKeys[index] = { ...baseLookupKeys[index], ...override };
    } else {
      mergedKeys.push({
        id: baseLookupKeys.length + index + 1,
        name: `custom.key.${index}`,
        value: 'custom_value',
        description: 'Custom lookup key',
        private: false,
        created_date: new Date().toISOString(),
        last_modified_date: new Date().toISOString(),
        ...override,
      });
    }
  });

  return mergedKeys;
};

/**
 * Creates email template configurations and SMTP settings for testing
 * notification and communication workflows
 */
export const emailTemplateFactory = (
  template: 'welcome' | 'password_reset' | 'invitation' | 'notification' = 'welcome',
  overrides: Partial<EmailConfig> = {}
): EmailConfig => {
  const templateConfigs = {
    welcome: {
      host: 'smtp.gmail.com',
      port: 587,
      encryption: 'tls' as const,
      username: 'noreply@company.com',
      password: 'app-specific-password',
      from_address: 'noreply@company.com',
      from_name: 'Welcome Team',
    },
    password_reset: {
      host: 'smtp.sendgrid.net',
      port: 587,
      encryption: 'tls' as const,
      username: 'apikey',
      password: 'sendgrid-api-key',
      from_address: 'security@company.com',
      from_name: 'Security Team',
    },
    invitation: {
      host: 'smtp.mailgun.org',
      port: 587,
      encryption: 'tls' as const,
      username: 'postmaster@mg.company.com',
      password: 'mailgun-password',
      from_address: 'invitations@company.com',
      from_name: 'Invitation Team',
    },
    notification: {
      host: 'localhost',
      port: 1025,
      encryption: null,
      username: '',
      password: '',
      from_address: 'notifications@localhost',
      from_name: 'Local Notifications',
    },
  };

  return { ...templateConfigs[template], ...overrides };
};

/**
 * Creates CORS policy configurations and security headers for testing
 * API security and cross-origin policy management
 */
export const corsConfigFactory = (
  environment: 'development' | 'staging' | 'production' = 'development',
  overrides: Partial<CORSConfig> = {}
): CORSConfig => {
  const environmentConfigs = {
    development: {
      origins: [
        'http://localhost:3000',
        'http://localhost:8000',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8000',
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      headers: [
        'Origin',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Requested-With',
        'X-DreamFactory-API-Key',
        'X-DreamFactory-Session-Token',
        'Content-Length',
        'Accept-Encoding',
        'X-CSRF-Token',
      ],
      credentials: true,
      maxAge: 86400, // 24 hours
    },
    staging: {
      origins: [
        'https://staging.company.com',
        'https://staging-admin.company.com',
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      headers: [
        'Origin',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Requested-With',
        'X-DreamFactory-API-Key',
        'X-DreamFactory-Session-Token',
      ],
      credentials: true,
      maxAge: 3600, // 1 hour
    },
    production: {
      origins: [
        'https://app.company.com',
        'https://admin.company.com',
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      headers: [
        'Content-Type',
        'Authorization',
        'X-DreamFactory-API-Key',
        'X-DreamFactory-Session-Token',
      ],
      credentials: false,
      maxAge: 600, // 10 minutes
    },
  };

  return { ...environmentConfigs[environment], ...overrides };
};

/**
 * Creates system caching configurations and performance settings for testing
 * cache management and optimization workflows
 */
export const cacheConfigFactory = (
  driver: 'memory' | 'redis' | 'memcached' | 'file' = 'memory',
  overrides: Partial<CacheConfig> = {}
): CacheConfig => {
  const driverConfigs = {
    memory: {
      enabled: true,
      driver: 'memory',
      stats: {
        hits: 1250,
        misses: 150,
        hitRatio: 0.893,
      },
    },
    redis: {
      enabled: true,
      driver: 'redis',
      stats: {
        hits: 5400,
        misses: 600,
        hitRatio: 0.9,
      },
    },
    memcached: {
      enabled: true,
      driver: 'memcached',
      stats: {
        hits: 3200,
        misses: 400,
        hitRatio: 0.889,
      },
    },
    file: {
      enabled: true,
      driver: 'file',
      stats: {
        hits: 800,
        misses: 200,
        hitRatio: 0.8,
      },
    },
  };

  return { ...driverConfigs[driver], ...overrides };
};

// =============================================================================
// AUTHENTICATION CONFIGURATION FACTORIES
// =============================================================================

/**
 * Creates LDAP/Active Directory authentication configuration for testing
 */
export const createADLDAPConfig = (overrides: Partial<ADLDAPConfig> = {}): ADLDAPConfig => {
  return {
    id: 1,
    name: 'test-ldap',
    label: 'Test LDAP Service',
    description: 'Test LDAP authentication service',
    is_active: true,
    type: 'ldap',
    config: {
      host: 'ldap.test.com',
      port: 389,
      base_dn: 'DC=test,DC=com',
      account_suffix: '@test.com',
      username: 'uid',
      password: 'password',
    },
    ...overrides,
  };
};

/**
 * Creates OAuth provider configuration for testing
 */
export const createOAuthConfig = (overrides: Partial<OAuthConfig> = {}): OAuthConfig => {
  return {
    id: 1,
    name: 'test-oauth',
    label: 'Test OAuth Provider',
    description: 'Test OAuth authentication provider',
    is_active: true,
    type: 'google',
    config: {
      client_id: 'test-client-id',
      client_secret: 'test-client-secret',
      redirect_url: 'http://localhost:3000/auth/callback',
      scope: ['openid', 'email', 'profile'],
    },
    ...overrides,
  };
};

/**
 * Creates SAML provider configuration for testing
 */
export const createSAMLConfig = (overrides: Partial<SAMLConfig> = {}): SAMLConfig => {
  return {
    id: 1,
    name: 'test-saml',
    label: 'Test SAML Provider',
    description: 'Test SAML authentication provider',
    is_active: true,
    config: {
      idp_entity_id: 'http://test.com/saml/metadata',
      sso_service_url: 'http://test.com/saml/sso',
      sls_service_url: 'http://test.com/saml/sls',
      x509_cert: '-----BEGIN CERTIFICATE-----\nTEST_CERT_DATA\n-----END CERTIFICATE-----',
    },
    ...overrides,
  };
};

// =============================================================================
// SYSTEM INFORMATION AND HEALTH CHECK FACTORIES
// =============================================================================

/**
 * Creates system information for testing system status and health check scenarios
 */
export const systemInfoFactory = (
  status: 'healthy' | 'warning' | 'critical' = 'healthy',
  overrides: Partial<SystemInfo> = {}
): SystemInfo => {
  const statusConfigs = {
    healthy: {
      version: '5.0.0',
      build: '2024.01.15.001',
      database: {
        connected: true,
        driver: 'mysql',
        version: '8.0.35',
        pool: {
          active: 5,
          max: 20,
          idle: 10,
        },
      },
      cache: {
        enabled: true,
        driver: 'redis',
        stats: {
          hits: 1500,
          misses: 100,
          hitRatio: 0.938,
        },
      },
      phpVersion: '8.3.2',
      memory: {
        used: 536870912, // 512 MB
        total: 2147483648, // 2 GB
        free: 1610612736, // 1.5 GB
      },
      disk: {
        used: 21474836480, // 20 GB
        total: 107374182400, // 100 GB
        free: 85899345920, // 80 GB
      },
    },
    warning: {
      version: '5.0.0',
      build: '2024.01.15.001',
      database: {
        connected: true,
        driver: 'mysql',
        version: '8.0.35',
        pool: {
          active: 18,
          max: 20,
          idle: 1,
        },
      },
      cache: {
        enabled: true,
        driver: 'redis',
        stats: {
          hits: 800,
          misses: 200,
          hitRatio: 0.8,
        },
      },
      phpVersion: '8.3.2',
      memory: {
        used: 1717986918, // 1.6 GB
        total: 2147483648, // 2 GB
        free: 429496730, // 400 MB
      },
      disk: {
        used: 85899345920, // 80 GB
        total: 107374182400, // 100 GB
        free: 21474836480, // 20 GB
      },
    },
    critical: {
      version: '5.0.0',
      build: '2024.01.15.001',
      database: {
        connected: false,
        driver: 'mysql',
        version: undefined,
        pool: undefined,
      },
      cache: {
        enabled: false,
        driver: 'redis',
        stats: {
          hits: 0,
          misses: 100,
          hitRatio: 0,
        },
      },
      phpVersion: '8.3.2',
      memory: {
        used: 2097152000, // 1.95 GB
        total: 2147483648, // 2 GB
        free: 50331648, // 48 MB
      },
      disk: {
        used: 103079215104, // 96 GB
        total: 107374182400, // 100 GB
        free: 4294967296, // 4 GB
      },
    },
  };

  return { ...statusConfigs[status], ...overrides };
};

/**
 * Creates system health status for testing health monitoring scenarios
 */
export const systemHealthFactory = (
  status: 'healthy' | 'warning' | 'critical' = 'healthy',
  overrides: Partial<SystemHealth> = {}
): SystemHealth => {
  const timestamp = Date.now();
  
  const statusConfigs = {
    healthy: {
      status: 'healthy' as const,
      timestamp,
      components: {
        database: {
          status: 'healthy' as const,
          message: 'Database connection stable',
          metrics: {
            connection_time: '45ms',
            active_connections: '5',
            max_connections: '20',
          },
          lastCheck: timestamp - 30000,
        },
        cache: {
          status: 'healthy' as const,
          message: 'Cache performance optimal',
          metrics: {
            hit_ratio: '0.938',
            memory_usage: '45%',
            eviction_rate: '0.001',
          },
          lastCheck: timestamp - 15000,
        },
        filesystem: {
          status: 'healthy' as const,
          message: 'Disk space sufficient',
          metrics: {
            disk_usage: '75%',
            free_space: '80GB',
            inode_usage: '12%',
          },
          lastCheck: timestamp - 60000,
        },
        memory: {
          status: 'healthy' as const,
          message: 'Memory usage normal',
          metrics: {
            memory_usage: '25%',
            free_memory: '1.5GB',
            swap_usage: '0%',
          },
          lastCheck: timestamp - 45000,
        },
      },
    },
    warning: {
      status: 'warning' as const,
      timestamp,
      components: {
        database: {
          status: 'warning' as const,
          message: 'High connection usage',
          metrics: {
            connection_time: '120ms',
            active_connections: '18',
            max_connections: '20',
          },
          lastCheck: timestamp - 30000,
        },
        cache: {
          status: 'warning' as const,
          message: 'Cache hit ratio below optimal',
          metrics: {
            hit_ratio: '0.75',
            memory_usage: '85%',
            eviction_rate: '0.05',
          },
          lastCheck: timestamp - 15000,
        },
        filesystem: {
          status: 'warning' as const,
          message: 'Disk space running low',
          metrics: {
            disk_usage: '90%',
            free_space: '10GB',
            inode_usage: '75%',
          },
          lastCheck: timestamp - 60000,
        },
        memory: {
          status: 'healthy' as const,
          message: 'Memory usage normal',
          metrics: {
            memory_usage: '75%',
            free_memory: '512MB',
            swap_usage: '15%',
          },
          lastCheck: timestamp - 45000,
        },
      },
    },
    critical: {
      status: 'critical' as const,
      timestamp,
      components: {
        database: {
          status: 'critical' as const,
          message: 'Database connection failed',
          metrics: {
            connection_time: 'timeout',
            active_connections: '0',
            max_connections: '20',
          },
          lastCheck: timestamp - 300000,
        },
        cache: {
          status: 'critical' as const,
          message: 'Cache service unavailable',
          metrics: {
            hit_ratio: '0',
            memory_usage: '0%',
            eviction_rate: '0',
          },
          lastCheck: timestamp - 300000,
        },
        filesystem: {
          status: 'critical' as const,
          message: 'Disk space critically low',
          metrics: {
            disk_usage: '98%',
            free_space: '2GB',
            inode_usage: '95%',
          },
          lastCheck: timestamp - 60000,
        },
        memory: {
          status: 'critical' as const,
          message: 'Out of memory',
          metrics: {
            memory_usage: '98%',
            free_memory: '48MB',
            swap_usage: '90%',
          },
          lastCheck: timestamp - 45000,
        },
      },
    },
  };

  return { ...statusConfigs[status], ...overrides };
};

/**
 * Creates performance metrics for testing system performance monitoring
 */
export const performanceMetricsFactory = (
  load: 'low' | 'medium' | 'high' = 'medium',
  overrides: Partial<PerformanceMetrics> = {}
): PerformanceMetrics => {
  const loadConfigs = {
    low: {
      requests: {
        total: 1500,
        rps: 5.2,
        avgResponseTime: 120,
      },
      memory: {
        used: 536870912, // 512 MB
        peak: 805306368, // 768 MB
        limit: 2147483648, // 2 GB
      },
      cache: {
        hitRatio: 0.95,
        entries: 1200,
        size: 104857600, // 100 MB
      },
    },
    medium: {
      requests: {
        total: 15000,
        rps: 25.8,
        avgResponseTime: 280,
      },
      memory: {
        used: 1073741824, // 1 GB
        peak: 1342177280, // 1.25 GB
        limit: 2147483648, // 2 GB
      },
      cache: {
        hitRatio: 0.85,
        entries: 5000,
        size: 524288000, // 500 MB
      },
    },
    high: {
      requests: {
        total: 50000,
        rps: 95.4,
        avgResponseTime: 650,
      },
      memory: {
        used: 1932735283, // 1.8 GB
        peak: 2042109440, // 1.9 GB
        limit: 2147483648, // 2 GB
      },
      cache: {
        hitRatio: 0.72,
        entries: 15000,
        size: 1073741824, // 1 GB
      },
    },
  };

  return { ...loadConfigs[load], ...overrides };
};

/**
 * Creates system operation results for testing operation success/failure scenarios
 */
export const systemOperationResultFactory = <T = any>(
  success: boolean = true,
  data?: T,
  overrides: Partial<SystemOperationResult<T>> = {}
): SystemOperationResult<T> => {
  const baseResult = {
    success,
    timestamp: Date.now(),
    data: success ? data : undefined,
    errors: success ? undefined : [
      {
        field: 'system',
        message: 'Operation failed due to system error',
        code: 'SYSTEM_ERROR',
        context: { operation: 'test_operation' },
      },
    ],
    message: success ? 'Operation completed successfully' : 'Operation failed',
  };

  return { ...baseResult, ...overrides };
};

/**
 * Creates license validation responses for testing license management scenarios
 */
export const licenseValidationFactory = (
  valid: boolean = true,
  overrides: Partial<LicenseValidationResponse> = {}
): LicenseValidationResponse => {
  const validResponse = {
    disableUi: 'false',
    msg: 'License is valid and active',
    renewalDate: new Date(Date.now() + 31536000000).toISOString(), // 1 year from now
    statusCode: '200',
  };

  const invalidResponse = {
    disableUi: 'true',
    msg: 'License has expired or is invalid',
    renewalDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    statusCode: '403',
  };

  return { ...(valid ? validResponse : invalidResponse), ...overrides };
};

/**
 * Creates system resources for testing resource management scenarios
 */
export const systemResourceFactory = (
  type: 'database' | 'email' | 'file' | 'script' | 'oauth' | 'saml' | 'ldap' | 'custom' = 'database',
  overrides: Partial<SystemResource> = {}
): SystemResource => {
  const typeConfigs = {
    database: {
      name: 'mysql-db',
      label: 'MySQL Database Service',
      description: 'MySQL database connection service',
      type: 'database',
      is_active: true,
      config: {
        driver: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'test_db',
      },
      metadata: {
        created_by: 'admin',
        version: '8.0.35',
      },
    },
    email: {
      name: 'smtp-email',
      label: 'SMTP Email Service',
      description: 'SMTP email service configuration',
      type: 'email',
      is_active: true,
      config: {
        host: 'smtp.gmail.com',
        port: 587,
        encryption: 'tls',
      },
      metadata: {
        provider: 'gmail',
        daily_limit: 500,
      },
    },
    file: {
      name: 'local-files',
      label: 'Local File Service',
      description: 'Local filesystem access service',
      type: 'file',
      is_active: true,
      config: {
        root: '/var/www/storage',
        public_path: '/storage',
      },
      metadata: {
        storage_type: 'local',
        quota: '10GB',
      },
    },
    script: {
      name: 'nodejs-script',
      label: 'Node.js Script Service',
      description: 'Server-side script execution service',
      type: 'script',
      is_active: true,
      config: {
        type: 'nodejs',
        timeout: 30,
      },
      metadata: {
        runtime: 'node:18',
        max_memory: '256MB',
      },
    },
    oauth: {
      name: 'google-oauth',
      label: 'Google OAuth Service',
      description: 'Google OAuth authentication service',
      type: 'oauth',
      is_active: true,
      config: {
        provider: 'google',
        client_id: 'google-client-id',
      },
      metadata: {
        scope: ['email', 'profile'],
        redirect_url: '/auth/google/callback',
      },
    },
    saml: {
      name: 'enterprise-saml',
      label: 'Enterprise SAML Service',
      description: 'Enterprise SAML SSO service',
      type: 'saml',
      is_active: true,
      config: {
        idp_entity_id: 'enterprise-idp',
        sso_url: 'https://sso.enterprise.com',
      },
      metadata: {
        provider: 'okta',
        certificate_expires: '2025-12-31',
      },
    },
    ldap: {
      name: 'company-ldap',
      label: 'Company LDAP Service',
      description: 'Company LDAP directory service',
      type: 'ldap',
      is_active: true,
      config: {
        host: 'ldap.company.com',
        port: 389,
        base_dn: 'DC=company,DC=com',
      },
      metadata: {
        users_count: 1500,
        last_sync: '2024-01-15T10:30:00Z',
      },
    },
    custom: {
      name: 'custom-service',
      label: 'Custom Service',
      description: 'Custom service implementation',
      type: 'custom',
      is_active: true,
      config: {
        endpoint: 'https://api.custom.com',
        api_key: 'custom-api-key',
      },
      metadata: {
        version: '1.0.0',
        vendor: 'Custom Corp',
      },
    },
  };

  return { ...typeConfigs[type], ...overrides };
};

/**
 * Creates complete system configuration for comprehensive testing scenarios
 */
export const createCompleteSystemConfig = (
  environment: 'development' | 'staging' | 'production' = 'development'
) => {
  return {
    environment: systemConfigFactory(environment),
    envVars: environmentConfigFactory(environment),
    lookupKeys: globalLookupFactory(),
    emailConfig: emailTemplateFactory('welcome'),
    corsConfig: corsConfigFactory(environment),
    cacheConfig: cacheConfigFactory('redis'),
    systemInfo: systemInfoFactory('healthy'),
    systemHealth: systemHealthFactory('healthy'),
    performanceMetrics: performanceMetricsFactory('medium'),
    licenseValidation: licenseValidationFactory(true),
    resources: [
      systemResourceFactory('database'),
      systemResourceFactory('email'),
      systemResourceFactory('oauth'),
    ],
  };
};

/**
 * Creates test scenarios for specific system configuration testing needs
 */
export const createSystemConfigScenario = (scenario: string) => {
  const scenarios = {
    'system-healthy': () => ({
      systemInfo: systemInfoFactory('healthy'),
      systemHealth: systemHealthFactory('healthy'),
      performanceMetrics: performanceMetricsFactory('low'),
    }),
    
    'system-under-load': () => ({
      systemInfo: systemInfoFactory('warning'),
      systemHealth: systemHealthFactory('warning'),
      performanceMetrics: performanceMetricsFactory('high'),
    }),
    
    'system-critical': () => ({
      systemInfo: systemInfoFactory('critical'),
      systemHealth: systemHealthFactory('critical'),
      performanceMetrics: performanceMetricsFactory('high'),
    }),
    
    'license-expired': () => ({
      licenseValidation: licenseValidationFactory(false, {
        msg: 'License has expired',
        statusCode: '403',
        disableUi: 'true',
      }),
      systemInfo: systemInfoFactory('warning'),
    }),
    
    'email-configuration': () => ({
      emailConfig: emailTemplateFactory('welcome'),
      lookupKeys: globalLookupFactory([
        { name: 'smtp.enabled', value: 'true' },
        { name: 'email.queue.enabled', value: 'true' },
      ]),
    }),
    
    'cors-strict': () => ({
      corsConfig: corsConfigFactory('production', {
        origins: ['https://app.company.com'],
        methods: ['GET', 'POST'],
        credentials: false,
      }),
    }),
    
    'development-setup': () => createCompleteSystemConfig('development'),
    'production-setup': () => createCompleteSystemConfig('production'),
  };

  const scenarioFn = scenarios[scenario as keyof typeof scenarios];
  if (!scenarioFn) {
    throw new Error(`Unknown system configuration scenario: ${scenario}`);
  }

  return scenarioFn();
};

// Export all factory functions for comprehensive system testing
export default {
  systemConfigFactory,
  environmentConfigFactory,
  globalLookupFactory,
  emailTemplateFactory,
  corsConfigFactory,
  cacheConfigFactory,
  systemInfoFactory,
  systemHealthFactory,
  performanceMetricsFactory,
  systemOperationResultFactory,
  licenseValidationFactory,
  systemResourceFactory,
  createCompleteSystemConfig,
  createSystemConfigScenario,
  createADLDAPConfig,
  createOAuthConfig,
  createSAMLConfig,
};