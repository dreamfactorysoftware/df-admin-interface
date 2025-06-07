/**
 * System Configuration and Environment Types
 * 
 * Defines comprehensive TypeScript interfaces for system configuration management,
 * environment data structures, and administrative operations in the DreamFactory
 * admin interface. These types support the transition from Angular to React/Next.js
 * while maintaining compatibility with existing DreamFactory API contracts.
 * 
 * @fileoverview System configuration type definitions
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

// =============================================================================
// AUTHENTICATION CONFIGURATION TYPES
// =============================================================================

/**
 * LDAP/Active Directory authentication configuration
 */
export interface ADLDAPConfig {
  /** Service identifier */
  id: number;
  /** Service name */
  name: string;
  /** Display label */
  label: string;
  /** Service description */
  description?: string;
  /** Whether service is active */
  is_active: boolean;
  /** Service type */
  type: string;
  /** LDAP configuration settings */
  config: {
    /** LDAP server host */
    host: string;
    /** LDAP server port */
    port: number;
    /** Base DN for searches */
    base_dn: string;
    /** Account suffix */
    account_suffix?: string;
    /** Username attribute */
    username: string;
    /** Password attribute */
    password: string;
    /** Additional LDAP configuration */
    [key: string]: any;
  };
}

/**
 * OAuth authentication provider configuration
 */
export interface OAuthConfig {
  /** Service identifier */
  id: number;
  /** Service name */
  name: string;
  /** Display label */
  label: string;
  /** Service description */
  description?: string;
  /** Whether service is active */
  is_active: boolean;
  /** OAuth provider type (google, facebook, etc.) */
  type: string;
  /** OAuth configuration settings */
  config: {
    /** Client ID */
    client_id: string;
    /** Client secret */
    client_secret: string;
    /** Redirect URI */
    redirect_url: string;
    /** OAuth scopes */
    scope?: string[];
    /** Additional OAuth configuration */
    [key: string]: any;
  };
}

/**
 * SAML authentication provider configuration
 */
export interface SAMLConfig {
  /** Service identifier */
  id: number;
  /** Service name */
  name: string;
  /** Display label */
  label: string;
  /** Service description */
  description?: string;
  /** Whether service is active */
  is_active: boolean;
  /** SAML configuration settings */
  config: {
    /** Identity provider entity ID */
    idp_entity_id: string;
    /** Single sign-on service URL */
    sso_service_url: string;
    /** Single logout service URL */
    sls_service_url?: string;
    /** X.509 certificate */
    x509_cert: string;
    /** Additional SAML configuration */
    [key: string]: any;
  };
}

/**
 * Authentication configuration container
 */
export interface AuthenticationConfig {
  /** Whether open registration is allowed */
  allowOpenRegistration: boolean;
  /** Email service ID for open registration */
  openRegEmailServiceId: number;
  /** Whether forever sessions are allowed */
  allowForeverSessions: boolean;
  /** Attribute used for login (email, username, etc.) */
  loginAttribute: string;
  /** LDAP/Active Directory configurations */
  adldap: ADLDAPConfig[];
  /** OAuth provider configurations */
  oauth: OAuthConfig[];
  /** SAML provider configurations */
  saml: SAMLConfig[];
}

// =============================================================================
// SERVER INFORMATION TYPES
// =============================================================================

/**
 * Server information interface
 */
export interface ServerInfo {
  /** Server hostname */
  host: string;
  /** Machine identifier */
  machine: string;
  /** Operating system release */
  release: string;
  /** Server operating system */
  serverOs: string;
  /** DreamFactory version */
  version: string;
  /** Server uptime in seconds */
  uptime?: number;
  /** Whether this is a hosted instance */
  hosted?: boolean;
  /** Additional server metadata */
  [key: string]: any;
}

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  /** Whether database is connected */
  connected: boolean;
  /** Database driver */
  driver?: string;
  /** Database version */
  version?: string;
  /** Connection pool information */
  pool?: {
    /** Active connections */
    active: number;
    /** Maximum connections */
    max: number;
    /** Idle connections */
    idle: number;
  };
}

/**
 * Cache configuration interface
 */
export interface CacheConfig {
  /** Whether cache is enabled */
  enabled: boolean;
  /** Cache driver type */
  driver?: string;
  /** Cache statistics */
  stats?: {
    /** Cache hits */
    hits: number;
    /** Cache misses */
    misses: number;
    /** Hit ratio */
    hitRatio: number;
  };
}

/**
 * System information interface
 */
export interface SystemInfo {
  /** System version */
  version: string;
  /** System build information */
  build?: string;
  /** Database configuration */
  database?: DatabaseConfig;
  /** Cache configuration */
  cache?: CacheConfig;
  /** PHP version */
  phpVersion?: string;
  /** Available memory */
  memory?: {
    /** Used memory in bytes */
    used: number;
    /** Total memory in bytes */
    total: number;
    /** Free memory in bytes */
    free: number;
  };
  /** Disk space information */
  disk?: {
    /** Used disk space in bytes */
    used: number;
    /** Total disk space in bytes */
    total: number;
    /** Free disk space in bytes */
    free: number;
  };
}

// =============================================================================
// ENVIRONMENT CONFIGURATION TYPES
// =============================================================================

/**
 * Environment configuration interface
 * Maps to the Angular Environment interface for compatibility
 */
export interface Environment {
  /** Authentication configuration */
  authentication: AuthenticationConfig;
  /** Server information */
  server: ServerInfo;
  /** License key (string for commercial, boolean for open source) */
  license?: string | boolean;
  /** Additional environment configuration */
  [key: string]: any;
}

// =============================================================================
// SYSTEM RESOURCE TYPES
// =============================================================================

/**
 * System resource interface
 */
export interface SystemResource {
  /** Resource name */
  name: string;
  /** Resource label */
  label: string;
  /** Resource description */
  description?: string;
  /** Resource type */
  type: string;
  /** Whether resource is active */
  is_active: boolean;
  /** Resource configuration */
  config?: Record<string, any>;
  /** Resource metadata */
  metadata?: Record<string, any>;
}

/**
 * System resources container
 * Maps to the Angular System interface for compatibility
 */
export interface System {
  /** Available system resources */
  resource: SystemResource[];
}

// =============================================================================
// LICENSE VALIDATION TYPES
// =============================================================================

/**
 * License validation request interface
 */
export interface LicenseValidationRequest {
  /** License key to validate */
  license_key: string;
  /** Additional validation parameters */
  [key: string]: any;
}

/**
 * License validation response interface
 * Maps to the Angular CheckResponse interface for compatibility
 */
export interface LicenseValidationResponse {
  /** Whether UI features should be disabled */
  disableUi: string;
  /** Human-readable status message */
  msg: string;
  /** License renewal date */
  renewalDate: string;
  /** Numeric status code */
  statusCode: string;
  /** Additional response data */
  [key: string]: any;
}

// =============================================================================
// CONFIGURATION MANAGEMENT TYPES
// =============================================================================

/**
 * Email configuration interface
 */
export interface EmailConfig {
  /** SMTP server host */
  host: string;
  /** SMTP server port */
  port: number;
  /** SMTP encryption type */
  encryption?: 'tls' | 'ssl' | null;
  /** SMTP username */
  username?: string;
  /** SMTP password */
  password?: string;
  /** From address */
  from_address: string;
  /** From name */
  from_name: string;
}

/**
 * CORS configuration interface
 */
export interface CORSConfig {
  /** Allowed origins */
  origins: string[];
  /** Allowed methods */
  methods: string[];
  /** Allowed headers */
  headers: string[];
  /** Whether credentials are allowed */
  credentials: boolean;
  /** Maximum age for preflight requests */
  maxAge?: number;
}

/**
 * Lookup key configuration interface
 */
export interface LookupKey {
  /** Key identifier */
  id: number;
  /** Key name */
  name: string;
  /** Key value */
  value: string;
  /** Key description */
  description?: string;
  /** Whether key is private */
  private: boolean;
  /** Created timestamp */
  created_date?: string;
  /** Modified timestamp */
  last_modified_date?: string;
}

/**
 * System configuration update request interface
 */
export interface SystemConfigUpdate {
  /** Email configuration updates */
  email?: Partial<EmailConfig>;
  /** CORS configuration updates */
  cors?: Partial<CORSConfig>;
  /** Lookup key updates */
  lookup_keys?: LookupKey[];
  /** Cache configuration updates */
  cache?: Partial<CacheConfig>;
  /** Additional configuration updates */
  [key: string]: any;
}

// =============================================================================
// MONITORING AND HEALTH CHECK TYPES
// =============================================================================

/**
 * System health status interface
 */
export interface SystemHealth {
  /** Overall health status */
  status: 'healthy' | 'warning' | 'critical';
  /** Health check timestamp */
  timestamp: number;
  /** Individual component health */
  components: {
    /** Database health */
    database: ComponentHealth;
    /** Cache health */
    cache: ComponentHealth;
    /** File system health */
    filesystem: ComponentHealth;
    /** Memory health */
    memory: ComponentHealth;
  };
}

/**
 * Individual component health interface
 */
export interface ComponentHealth {
  /** Component status */
  status: 'healthy' | 'warning' | 'critical';
  /** Status message */
  message?: string;
  /** Component metrics */
  metrics?: Record<string, number | string>;
  /** Last check timestamp */
  lastCheck: number;
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  /** Request metrics */
  requests: {
    /** Total requests */
    total: number;
    /** Requests per second */
    rps: number;
    /** Average response time */
    avgResponseTime: number;
  };
  /** Memory usage metrics */
  memory: {
    /** Used memory in bytes */
    used: number;
    /** Peak memory in bytes */
    peak: number;
    /** Memory limit in bytes */
    limit: number;
  };
  /** Cache metrics */
  cache: {
    /** Cache hit ratio */
    hitRatio: number;
    /** Total cache entries */
    entries: number;
    /** Cache size in bytes */
    size: number;
  };
}

// =============================================================================
// ERROR AND VALIDATION TYPES
// =============================================================================

/**
 * System validation error interface
 */
export interface SystemValidationError {
  /** Error field */
  field: string;
  /** Error message */
  message: string;
  /** Error code */
  code?: string;
  /** Additional error context */
  context?: Record<string, any>;
}

/**
 * System operation result interface
 */
export interface SystemOperationResult<T = any> {
  /** Whether operation was successful */
  success: boolean;
  /** Operation result data */
  data?: T;
  /** Operation errors */
  errors?: SystemValidationError[];
  /** Operation message */
  message?: string;
  /** Operation timestamp */
  timestamp: number;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * System configuration keys enumeration
 */
export type SystemConfigKey = 
  | 'authentication'
  | 'email'
  | 'cors'
  | 'cache'
  | 'lookup_keys'
  | 'security'
  | 'logging';

/**
 * System resource types enumeration
 */
export type SystemResourceType = 
  | 'database'
  | 'email'
  | 'file'
  | 'script'
  | 'oauth'
  | 'saml'
  | 'ldap'
  | 'custom';

/**
 * Authentication method types enumeration
 */
export type AuthMethodType = 
  | 'local'
  | 'oauth'
  | 'saml'
  | 'ldap'
  | 'api_key';

// =============================================================================
// BACKWARDS COMPATIBILITY EXPORTS
// =============================================================================

/**
 * Legacy type aliases for backwards compatibility with Angular implementation
 */
export type {
  /** @deprecated Use Environment instead */
  Environment as DfEnvironment,
  /** @deprecated Use System instead */
  System as DfSystem,
  /** @deprecated Use SystemInfo instead */
  SystemInfo as DfSystemInfo,
  /** @deprecated Use ServerInfo instead */
  ServerInfo as DfServerInfo,
  /** @deprecated Use LicenseValidationResponse instead */
  LicenseValidationResponse as CheckResponse,
};

// =============================================================================
// DEFAULT VALUES AND CONSTANTS
// =============================================================================

/**
 * Default environment configuration
 */
export const DEFAULT_ENVIRONMENT: Environment = {
  authentication: {
    allowOpenRegistration: false,
    openRegEmailServiceId: 0,
    allowForeverSessions: false,
    loginAttribute: 'email',
    adldap: [],
    oauth: [],
    saml: [],
  },
  server: {
    host: '',
    machine: '',
    release: '',
    serverOs: '',
    version: '',
  },
};

/**
 * Default system configuration
 */
export const DEFAULT_SYSTEM: System = {
  resource: [],
};

/**
 * System configuration validation schemas (for use with Zod or similar)
 */
export const SYSTEM_CONFIG_SCHEMAS = {
  /** Environment configuration schema keys */
  ENVIRONMENT: [
    'authentication',
    'server',
    'license',
  ] as const,
  
  /** System resource schema keys */
  SYSTEM: [
    'resource',
  ] as const,
  
  /** Required authentication config fields */
  AUTHENTICATION_REQUIRED: [
    'allowOpenRegistration',
    'openRegEmailServiceId',
    'allowForeverSessions',
    'loginAttribute',
  ] as const,
  
  /** Required server info fields */
  SERVER_REQUIRED: [
    'host',
    'machine',
    'release',
    'serverOs',
    'version',
  ] as const,
} as const;

export default Environment;