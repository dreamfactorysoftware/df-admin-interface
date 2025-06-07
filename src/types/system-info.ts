/**
 * System Information Type Definitions
 * 
 * TypeScript interfaces for DreamFactory system, server, and client information
 * monitoring. Migrated from Angular types with enhanced type safety for React
 * Query integration and Next.js server components.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

// ============================================================================
// LICENSE AND SUBSCRIPTION TYPES
// ============================================================================

export interface CheckResponse {
  disableUi: string;
  msg: string;
  renewalDate: string;
  statusCode: string;
}

export interface LicenseInfo {
  level: string;
  key?: string | boolean;
  subscriptionStatus?: CheckResponse;
}

// ============================================================================
// AUTHENTICATION SERVICE TYPES
// ============================================================================

export interface AuthService {
  id: number;
  name: string;
  type: string;
  isActive: boolean;
  config?: Record<string, any>;
}

export interface LdapService extends AuthService {
  type: 'ldap';
  config: {
    host: string;
    port: number;
    basedn: string;
    accountSuffix?: string;
  };
}

// ============================================================================
// PLATFORM INFORMATION
// ============================================================================

export interface PackageInfo {
  name: string;
  version: string;
}

export interface PlatformInfo {
  version: string;
  bitnamiDemo: boolean;
  isHosted: boolean;
  isTrial: boolean;
  license: string;
  securedPackageExport: boolean;
  licenseKey: string | boolean;
  dbDriver: string;
  installPath: string;
  logPath: string;
  appDebug: boolean;
  logMode: string;
  logLevel: string;
  cacheDriver: string;
  packages: PackageInfo[];
  dfInstanceId: string;
  rootAdminExists: boolean;
}

// ============================================================================
// SERVER INFORMATION
// ============================================================================

export interface ServerInfo {
  host: string;
  machine: string;
  release: string;
  serverOs: string;
  version: string;
}

export interface PhpInfo {
  core: {
    phpVersion: string;
  };
  general: {
    serverApi: string;
  };
}

// ============================================================================
// CLIENT INFORMATION
// ============================================================================

export interface ClientInfo {
  userAgent: string;
  ipAddress: string;
  locale: string;
}

// ============================================================================
// AUTHENTICATION CONFIGURATION
// ============================================================================

export interface AuthenticationConfig {
  allowOpenRegistration: boolean;
  openRegEmailServiceId: number;
  allowForeverSessions: boolean;
  loginAttribute: string;
  adldap: LdapService[];
  oauth: AuthService[];
  saml: AuthService[];
}

// ============================================================================
// MAIN ENVIRONMENT INTERFACE
// ============================================================================

export interface Environment {
  authentication: AuthenticationConfig;
  platform?: PlatformInfo;
  server: ServerInfo;
  php?: PhpInfo;
  client?: ClientInfo;
}

// ============================================================================
// SYSTEM RESOURCES
// ============================================================================

export interface SystemResource {
  name: string;
}

export interface System {
  resource: SystemResource[];
}

// ============================================================================
// SYSTEM STATUS TYPES
// ============================================================================

export interface SystemStatus {
  isOnline: boolean;
  lastUpdated: Date;
  responseTime: number;
  environment: Environment;
  licenseStatus?: CheckResponse;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface SystemInfoResponse {
  environment: Environment;
  system?: System;
  timestamp: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  responseTime: number;
  services: {
    database: 'up' | 'down';
    cache: 'up' | 'down';
    storage: 'up' | 'down';
  };
}

// ============================================================================
// DISPLAY TYPES FOR UI COMPONENTS
// ============================================================================

export interface SystemInfoDisplayData {
  platform: {
    license: LicenseInfo;
    version: string;
    database: string;
    paths: {
      install: string;
      log: string;
    };
    logging: {
      mode: string;
      level: string;
    };
    cache: string;
    instance: {
      id: string;
      isTrial: boolean;
      isDemo: boolean;
    };
    packages: PackageInfo[];
  };
  server: {
    os: string;
    release: string;
    version: string;
    host: string;
    machine: string;
  };
  php?: {
    version: string;
    serverApi: string;
  };
  client: {
    userAgent: string;
    ipAddress: string;
    locale: string;
  };
}

// ============================================================================
// HOOK OPTIONS
// ============================================================================

export interface UseSystemInfoOptions {
  /** Refresh interval in milliseconds (default: 30000 - 30 seconds) */
  refreshInterval?: number;
  /** Enable automatic background refresh (default: true) */
  enableBackgroundRefresh?: boolean;
  /** Include license check in data fetching (default: true) */
  includeLicenseCheck?: boolean;
  /** Cache time to live in milliseconds (default: 60000 - 1 minute) */
  cacheTTL?: number;
  /** Enable real-time status monitoring (default: false) */
  enableRealTimeStatus?: boolean;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface SystemInfoError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  Environment as EnvironmentInfo,
  System as SystemInfo,
  PackageInfo,
  PlatformInfo,
  ServerInfo,
  PhpInfo,
  ClientInfo,
  AuthenticationConfig,
  SystemStatus,
  SystemInfoResponse,
  HealthCheckResponse,
  SystemInfoDisplayData,
  UseSystemInfoOptions,
  SystemInfoError,
  CheckResponse,
  LicenseInfo,
  AuthService,
  LdapService,
  SystemResource,
};