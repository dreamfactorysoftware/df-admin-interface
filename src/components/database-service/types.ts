/**
 * Database Service Component Types
 * 
 * TypeScript interface definitions and type exports specific to database service components,
 * including service configuration, connection parameters, validation schemas, and component
 * prop interfaces. Defines type-safe contracts for database service operations.
 * 
 * @fileoverview Comprehensive types for database service management in React/Next.js
 * @version 1.0.0
 * @since 2024-01-01
 */

import { z } from 'zod';
import { ReactNode, ComponentType } from 'react';
import type { 
  UseQueryOptions, 
  UseMutationOptions, 
  QueryKey 
} from '@tanstack/react-query';
import type { SWRConfiguration, SWRResponse } from 'swr';

// =============================================================================
// CORE DATABASE SERVICE TYPES
// =============================================================================

/**
 * Database driver types supported by DreamFactory
 * Multi-database support per F-001 feature requirements
 */
export type DatabaseDriver = 
  | 'mysql'
  | 'pgsql'
  | 'sqlite'
  | 'mongodb'
  | 'oracle'
  | 'sqlsrv'
  | 'snowflake'
  | 'ibmdb2'
  | 'informix'
  | 'sqlanywhere'
  | 'memsql'
  | 'salesforce_db'
  | 'hana'
  | 'apache_hive'
  | 'databricks'
  | 'dremio';

/**
 * Service tier classification for licensing and feature availability
 */
export type ServiceTier = 'core' | 'silver' | 'gold';

/**
 * Service status enumeration for connection and operational states
 */
export type ServiceStatus = 
  | 'active'
  | 'inactive'
  | 'testing'
  | 'error'
  | 'configuring'
  | 'pending';

/**
 * Database service type configuration with driver and feature information
 */
export interface DatabaseType {
  name: string;
  label: string;
  description: string;
  group: string;
  driver: DatabaseDriver;
  defaultPort: number | null;
  supportedFeatures: string[];
  tier: ServiceTier;
}

// =============================================================================
// DATABASE CONFIGURATION INTERFACES
// =============================================================================

/**
 * SSL configuration for secure database connections
 */
export interface SSLConfig {
  enabled: boolean;
  verify: boolean;
  mode?: 'disable' | 'allow' | 'prefer' | 'require' | 'verify-ca' | 'verify-full';
  ca?: string;
  cert?: string;
  key?: string;
  rejectUnauthorized?: boolean;
}

/**
 * Connection pooling configuration for performance optimization
 */
export interface PoolingConfig {
  min: number;
  max: number;
  acquireTimeoutMillis?: number;
  createTimeoutMillis?: number;
  destroyTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  reapIntervalMillis?: number;
  createRetryIntervalMillis?: number;
}

/**
 * Database-specific options and advanced configuration
 */
export interface DatabaseOptions {
  [key: string]: any;
  // Common options
  charset?: string;
  collation?: string;
  schema?: string;
  application_name?: string;
  // MySQL/MariaDB specific
  strict?: boolean;
  engine?: string;
  // PostgreSQL specific
  search_path?: string;
  // MongoDB specific
  authSource?: string;
  readPreference?: string;
  writeConcern?: string;
  // Oracle specific
  sid?: string;
  service_name?: string;
  // Snowflake specific
  warehouse?: string;
  role?: string;
  account?: string;
}

/**
 * Complete database configuration interface
 * Supports all database types per F-001-RQ-001 requirement
 */
export interface DatabaseConfig {
  driver: DatabaseDriver;
  host: string;
  port?: number;
  database: string;
  username: string;
  password: string;
  options?: DatabaseOptions;
  connectionTimeout?: number;
  ssl?: SSLConfig;
  pooling?: PoolingConfig;
}

// =============================================================================
// SERVICE MANAGEMENT INTERFACES
// =============================================================================

/**
 * Database service entity interface
 * Migrated from Angular Service interface to React-compatible structure
 */
export interface DatabaseService {
  id: number;
  name: string;
  label: string;
  description?: string;
  type: DatabaseDriver;
  config: DatabaseConfig;
  is_active: boolean;
  mutable: boolean;
  deletable: boolean;
  created_date: string;
  last_modified_date: string;
  created_by_id: number | null;
  last_modified_by_id: number | null;
  
  // Extended properties for UI state management
  status?: ServiceStatus;
  lastConnectionTest?: ConnectionTestResult;
  schemaLastDiscovered?: string;
  apiEndpointsCount?: number;
  refresh?: boolean;
}

/**
 * Service type definition with configuration schema
 * Enhanced from Angular ServiceType interface
 */
export interface ServiceType {
  name: string;
  label: string;
  description: string;
  group: string;
  class?: string;
  configSchema: ConfigSchema[];
  tier?: ServiceTier;
  supportedFeatures?: string[];
}

/**
 * Configuration schema for dynamic form generation
 * Migrated from Angular ConfigSchema with React Hook Form compatibility
 */
export interface ConfigSchema {
  name: string;
  label: string;
  type: ConfigFieldType;
  description?: string;
  alias: string;
  native?: any[];
  length?: number;
  precision?: number;
  scale?: any;
  default?: any;
  required?: boolean;
  allowNull?: boolean;
  fixedLength?: boolean;
  supportsMultibyte?: boolean;
  isPrimaryKey?: boolean;
  isUnique?: boolean;
  isForeignKey?: boolean;
  refTable?: string;
  refField?: string;
  refOnUpdate?: any;
  refOnDelete?: any;
  picklist?: any;
  validation?: any;
  dbFunction?: any;
  isVirtual?: boolean;
  isAggregate?: boolean;
  object?: {
    key: LabelType;
    value: LabelType;
  };
  items?: ConfigSchema[] | 'string';
  values?: any[];
  dbType?: string;
  autoIncrement?: boolean;
  isIndex?: boolean;
  columns?: number;
  legend?: string;
}

/**
 * Configuration field types for dynamic forms
 */
export type ConfigFieldType = 
  | 'string'
  | 'text'
  | 'integer'
  | 'password'
  | 'boolean'
  | 'object'
  | 'array'
  | 'picklist'
  | 'multi_picklist'
  | 'file_certificate'
  | 'file_certificate_api'
  | 'verb_mask'
  | 'event_picklist';

/**
 * Label type for configuration schema objects
 */
export interface LabelType {
  label: string;
  type: string;
}

// =============================================================================
// CONNECTION TESTING INTERFACES
// =============================================================================

/**
 * Connection test result interface
 * Enhanced with timing and diagnostic information
 */
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: string;
  testDuration?: number;
  timestamp: string;
  errorCode?: string;
  metadata?: ConnectionMetadata;
}

/**
 * Connection metadata from successful tests
 */
export interface ConnectionMetadata {
  serverVersion?: string;
  databaseVersion?: string;
  schema?: string;
  tableCount?: number;
  features?: string[];
  charset?: string;
  timezone?: string;
}

/**
 * Connection test status for UI state management
 */
export type ConnectionTestStatus = 'idle' | 'testing' | 'success' | 'error';

// =============================================================================
// GENERIC API RESPONSE TYPES
// =============================================================================

/**
 * Generic list response interface for DreamFactory API
 */
export interface GenericListResponse<T> {
  resource: T[];
  count?: number;
  next?: string;
  previous?: string;
  meta?: ResponseMetadata;
}

/**
 * Response metadata for pagination and filtering
 */
export interface ResponseMetadata {
  count: number;
  offset?: number;
  limit?: number;
  total_count?: number;
  schema?: string[];
}

/**
 * API error response interface
 */
export interface ApiErrorResponse {
  error: {
    code: number;
    message: string;
    context?: any;
    details?: any[];
  };
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod schema for database connection validation
 * Real-time validation under 100ms per React/Next.js integration requirements
 */
export const DatabaseConnectionSchema = z.object({
  name: z.string()
    .min(1, 'Service name is required')
    .max(64, 'Service name must be less than 64 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, 'Service name must start with a letter and contain only letters, numbers, underscores, and hyphens'),
  
  label: z.string()
    .min(1, 'Display label is required')
    .max(255, 'Display label must be less than 255 characters'),
  
  description: z.string()
    .max(1024, 'Description must be less than 1024 characters')
    .optional(),
  
  type: z.enum([
    'mysql', 'pgsql', 'sqlite', 'mongodb', 'oracle', 'sqlsrv', 'snowflake',
    'ibmdb2', 'informix', 'sqlanywhere', 'memsql', 'salesforce_db', 'hana',
    'apache_hive', 'databricks', 'dremio'
  ]),
  
  config: z.object({
    driver: z.enum([
      'mysql', 'pgsql', 'sqlite', 'mongodb', 'oracle', 'sqlsrv', 'snowflake',
      'ibmdb2', 'informix', 'sqlanywhere', 'memsql', 'salesforce_db', 'hana',
      'apache_hive', 'databricks', 'dremio'
    ]),
    
    host: z.string()
      .min(1, 'Host is required')
      .max(255, 'Host must be less than 255 characters'),
    
    port: z.number()
      .int('Port must be an integer')
      .min(1, 'Port must be greater than 0')
      .max(65535, 'Port must be less than 65536')
      .optional(),
    
    database: z.string()
      .min(1, 'Database name is required')
      .max(64, 'Database name must be less than 64 characters'),
    
    username: z.string()
      .min(1, 'Username is required')
      .max(64, 'Username must be less than 64 characters'),
    
    password: z.string()
      .max(255, 'Password must be less than 255 characters')
      .optional(),
    
    options: z.record(z.any()).optional(),
    connectionTimeout: z.number().int().min(1000).max(60000).optional(),
    
    ssl: z.object({
      enabled: z.boolean(),
      verify: z.boolean().optional(),
      mode: z.enum(['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full']).optional(),
      ca: z.string().optional(),
      cert: z.string().optional(),
      key: z.string().optional(),
      rejectUnauthorized: z.boolean().optional()
    }).optional(),
    
    pooling: z.object({
      min: z.number().int().min(0),
      max: z.number().int().min(1),
      acquireTimeoutMillis: z.number().int().min(1000).optional(),
      createTimeoutMillis: z.number().int().min(1000).optional(),
      destroyTimeoutMillis: z.number().int().min(1000).optional(),
      idleTimeoutMillis: z.number().int().min(1000).optional(),
      reapIntervalMillis: z.number().int().min(1000).optional(),
      createRetryIntervalMillis: z.number().int().min(100).optional()
    }).optional()
  }),
  
  is_active: z.boolean().default(true)
});

/**
 * Zod schema for connection testing
 */
export const ConnectionTestSchema = z.object({
  serviceId: z.number().int().positive(),
  config: DatabaseConnectionSchema.shape.config.optional()
});

/**
 * Inferred types from Zod schemas for TypeScript integration
 */
export type DatabaseConnectionInput = z.infer<typeof DatabaseConnectionSchema>;
export type ConnectionTestInput = z.infer<typeof ConnectionTestSchema>;

// =============================================================================
// REACT COMPONENT PROP INTERFACES
// =============================================================================

/**
 * Base component props following React 19 patterns
 */
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  'data-testid'?: string;
}

/**
 * Database service list component props
 */
export interface DatabaseServiceListProps extends BaseComponentProps {
  services: DatabaseService[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  onServiceSelect?: (service: DatabaseService) => void;
  onServiceCreate?: () => void;
  onServiceEdit?: (service: DatabaseService) => void;
  onServiceDelete?: (service: DatabaseService) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  filters?: {
    search?: string;
    type?: DatabaseDriver[];
    status?: ServiceStatus[];
    onFilterChange: (filters: any) => void;
  };
}

/**
 * Database service form component props
 */
export interface DatabaseServiceFormProps extends BaseComponentProps {
  service?: DatabaseService | null;
  serviceTypes: ServiceType[];
  loading?: boolean;
  onSubmit: (data: DatabaseConnectionInput) => void | Promise<void>;
  onCancel?: () => void;
  onTestConnection?: (config: DatabaseConfig) => void | Promise<void>;
  validationErrors?: Record<string, string>;
  mode?: 'create' | 'edit' | 'view';
}

/**
 * Connection test component props
 */
export interface ConnectionTestProps extends BaseComponentProps {
  config: DatabaseConfig;
  onTest?: (config: DatabaseConfig) => void | Promise<void>;
  result?: ConnectionTestResult | null;
  loading?: boolean;
  disabled?: boolean;
  autoTest?: boolean;
  showDetails?: boolean;
}

/**
 * Connection status indicator props
 */
export interface ConnectionStatusProps extends BaseComponentProps {
  status: ConnectionTestStatus;
  result?: ConnectionTestResult | null;
  showMessage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'detailed';
}

/**
 * Database service provider context props
 */
export interface DatabaseServiceProviderProps extends BaseComponentProps {
  initialServices?: DatabaseService[];
  refreshInterval?: number;
  enableAutoRefresh?: boolean;
  onError?: (error: Error) => void;
}

// =============================================================================
// SWR AND REACT QUERY INTEGRATION TYPES
// =============================================================================

/**
 * SWR configuration types for database service operations
 */
export interface DatabaseServiceSWRConfig extends SWRConfiguration {
  refreshInterval?: number;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  dedupingInterval?: number;
  errorRetryInterval?: number;
  errorRetryCount?: number;
  focusThrottleInterval?: number;
}

/**
 * SWR response type for database services
 */
export type DatabaseServiceSWRResponse<T> = SWRResponse<T, ApiErrorResponse>;

/**
 * React Query options for database service queries
 */
export interface DatabaseServiceQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  serviceId?: number;
  serviceName?: string;
  refreshInterval?: number;
}

/**
 * React Query mutation options for database service operations
 */
export interface DatabaseServiceMutationOptions<TData, TVariables> 
  extends Omit<UseMutationOptions<TData, ApiErrorResponse, TVariables>, 'mutationFn'> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: ApiErrorResponse, variables: TVariables) => void;
}

/**
 * Query keys for React Query cache management
 */
export const DatabaseServiceQueryKeys = {
  all: ['database-services'] as const,
  lists: () => [...DatabaseServiceQueryKeys.all, 'list'] as const,
  list: (filters?: any) => [...DatabaseServiceQueryKeys.lists(), filters] as const,
  details: () => [...DatabaseServiceQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...DatabaseServiceQueryKeys.details(), id] as const,
  types: () => [...DatabaseServiceQueryKeys.all, 'types'] as const,
  typeList: (groups?: string[]) => [...DatabaseServiceQueryKeys.types(), groups] as const,
  connectionTest: (serviceId: number) => [...DatabaseServiceQueryKeys.all, 'connection-test', serviceId] as const,
  schema: (serviceName: string) => [...DatabaseServiceQueryKeys.all, 'schema', serviceName] as const,
} as const;

/**
 * Hook return types for database service operations
 */
export interface UseConnectionTestReturn {
  test: (config: DatabaseConfig) => Promise<ConnectionTestResult>;
  result: ConnectionTestResult | null;
  isLoading: boolean;
  error: ApiErrorResponse | null;
  reset: () => void;
}

export interface UseServiceTypesReturn {
  serviceTypes: ServiceType[];
  isLoading: boolean;
  error: ApiErrorResponse | null;
  refetch: () => void;
}

export interface UseServicesReturn {
  services: DatabaseService[];
  isLoading: boolean;
  error: ApiErrorResponse | null;
  refetch: () => void;
  mutate: {
    create: (service: DatabaseConnectionInput) => Promise<DatabaseService>;
    update: (id: number, service: Partial<DatabaseConnectionInput>) => Promise<DatabaseService>;
    delete: (id: number) => Promise<void>;
  };
}

// =============================================================================
// TIMEOUT AND CONFIGURATION TYPES
// =============================================================================

/**
 * Connection timeout configuration
 */
export interface ConnectionTimeouts {
  CONNECTION_TEST: number;
  SCHEMA_DISCOVERY: number;
  QUERY_TIMEOUT: number;
  BULK_OPERATION: number;
  POOL_TIMEOUT: number;
}

/**
 * SWR configuration for different operation types
 */
export interface SWRConfig {
  connectionTest: DatabaseServiceSWRConfig;
  serviceList: DatabaseServiceSWRConfig;
  schemaDiscovery: DatabaseServiceSWRConfig;
  serviceConfig: DatabaseServiceSWRConfig;
}

/**
 * React Query configuration for database service operations
 */
export interface ReactQueryConfig {
  defaultOptions: {
    queries: {
      staleTime: number;
      cacheTime: number;
      retry: number;
      retryDelay: (attemptIndex: number) => number;
      refetchOnWindowFocus: boolean;
      refetchOnReconnect: boolean;
    };
    mutations: {
      retry: number;
      retryDelay: number;
    };
  };
  queryConfigs: {
    serviceList: {
      staleTime: number;
      cacheTime: number;
      refetchOnWindowFocus: boolean;
    };
    connectionTest: {
      staleTime: number;
      cacheTime: number;
      retry: number;
      refetchOnWindowFocus: boolean;
    };
    schemaDiscovery: {
      staleTime: number;
      cacheTime: number;
      retry: number;
      refetchOnWindowFocus: boolean;
    };
    serviceConfig: {
      staleTime: number;
      cacheTime: number;
      refetchOnWindowFocus: boolean;
    };
  };
}

// =============================================================================
// UTILITY TYPES AND HELPERS
// =============================================================================

/**
 * Utility type for making specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Utility type for making specific properties required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Database service creation input (excludes generated fields)
 */
export type DatabaseServiceCreateInput = Omit<
  DatabaseService, 
  'id' | 'created_date' | 'last_modified_date' | 'created_by_id' | 'last_modified_by_id' | 'status' | 'lastConnectionTest' | 'schemaLastDiscovered' | 'apiEndpointsCount'
>;

/**
 * Database service update input (partial with required id)
 */
export type DatabaseServiceUpdateInput = RequiredBy<
  Partial<DatabaseServiceCreateInput>, 
  'name'
>;

/**
 * Table row data for service listings
 */
export interface ServiceRow {
  id: number;
  name: string;
  label: string;
  description: string;
  type: string;
  scripting: string;
  active: boolean;
  deletable: boolean;
}

// =============================================================================
// COMPONENT STATE TYPES
// =============================================================================

/**
 * Database service provider state
 */
export interface DatabaseServiceState {
  services: DatabaseService[];
  selectedService: DatabaseService | null;
  serviceTypes: ServiceType[];
  loading: boolean;
  error: ApiErrorResponse | null;
  connectionTest: {
    isLoading: boolean;
    result: ConnectionTestResult | null;
    error: ApiErrorResponse | null;
  };
}

/**
 * Database service actions for state management
 */
export interface DatabaseServiceActions {
  setServices: (services: DatabaseService[]) => void;
  setSelectedService: (service: DatabaseService | null) => void;
  setServiceTypes: (types: ServiceType[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: ApiErrorResponse | null) => void;
  testConnection: (config: DatabaseConfig) => Promise<ConnectionTestResult>;
  createService: (service: DatabaseConnectionInput) => Promise<DatabaseService>;
  updateService: (id: number, service: Partial<DatabaseConnectionInput>) => Promise<DatabaseService>;
  deleteService: (id: number) => Promise<void>;
  refreshServices: () => Promise<void>;
}

/**
 * Complete database service context type
 */
export type DatabaseServiceContextType = DatabaseServiceState & DatabaseServiceActions;

// =============================================================================
// EXPORTS
// =============================================================================

// Re-export commonly used types for convenience
export type {
  // Core types
  DatabaseDriver,
  ServiceTier,
  ServiceStatus,
  DatabaseType,
  DatabaseConfig,
  DatabaseService,
  ServiceType,
  ConfigSchema,
  
  // Connection testing
  ConnectionTestResult,
  ConnectionTestStatus,
  ConnectionMetadata,
  
  // API types
  GenericListResponse,
  ApiErrorResponse,
  
  // Component props
  DatabaseServiceListProps,
  DatabaseServiceFormProps,
  ConnectionTestProps,
  ConnectionStatusProps,
  DatabaseServiceProviderProps,
  
  // Hook returns
  UseConnectionTestReturn,
  UseServiceTypesReturn,
  UseServicesReturn,
  
  // Utility types
  DatabaseServiceCreateInput,
  DatabaseServiceUpdateInput,
  ServiceRow,
  
  // State management
  DatabaseServiceState,
  DatabaseServiceActions,
  DatabaseServiceContextType,
};

// Export validation schemas
export {
  DatabaseConnectionSchema,
  ConnectionTestSchema,
  DatabaseServiceQueryKeys,
};

// Export inferred types
export type {
  DatabaseConnectionInput,
  ConnectionTestInput,
};