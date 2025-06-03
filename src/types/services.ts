/**
 * Service Management Types for DreamFactory Admin Interface
 * 
 * This module provides comprehensive TypeScript definitions for service management,
 * API endpoint generation, OpenAPI specifications, and service deployment.
 * Supports React Query optimization and server-side rendering capabilities.
 * 
 * Features:
 * - Service configuration and management
 * - API endpoint generation workflows
 * - OpenAPI specification generation with Next.js API routes
 * - Zod validation schemas for type safety
 * - Optimistic updates for CRUD operations
 * - Server-side rendering support
 */

import { z } from 'zod';
import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';

// ============================================================================
// CORE SERVICE TYPES
// ============================================================================

/**
 * Database service types supported by DreamFactory
 */
export const DatabaseServiceTypes = [
  'mysql',
  'pgsql', 
  'oracle',
  'sqlsrv',
  'sqlite',
  'mongodb',
  'snowflake',
  'cassandra',
  'couchbase',
  'redis'
] as const;

export type DatabaseServiceType = typeof DatabaseServiceTypes[number];

/**
 * All service types available in DreamFactory
 */
export const ServiceTypes = [
  ...DatabaseServiceTypes,
  'rest',
  'soap',
  'file',
  'aws_s3',
  'azure_blob',
  'email',
  'smtp',
  'sendgrid',
  'local_file',
  'script',
  'nodejs',
  'python',
  'php',
  'auth',
  'ldap',
  'oauth',
  'saml',
  'remote_web_service'
] as const;

export type ServiceType = typeof ServiceTypes[number];

/**
 * Service groups for categorization
 */
export type ServiceGroup = 
  | 'Database'
  | 'Remote Service'
  | 'File Storage'
  | 'Email'
  | 'Script'
  | 'Authentication'
  | 'Cache'
  | 'Custom';

/**
 * Configuration field types for service setup
 */
export type ConfigFieldType =
  | 'string'
  | 'text'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'password'
  | 'object'
  | 'array'
  | 'picklist'
  | 'multi_picklist'
  | 'file_certificate'
  | 'file_certificate_api'
  | 'verb_mask'
  | 'event_picklist'
  | 'json'
  | 'yaml'
  | 'connection_test';

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for configuration field validation
 */
export const ConfigSchemaValidator = z.object({
  name: z.string().min(1, 'Field name is required'),
  label: z.string().min(1, 'Field label is required'),
  type: z.enum([
    'string', 'text', 'integer', 'float', 'boolean', 'password',
    'object', 'array', 'picklist', 'multi_picklist', 'file_certificate',
    'file_certificate_api', 'verb_mask', 'event_picklist', 'json', 'yaml',
    'connection_test'
  ]),
  description: z.string().optional(),
  alias: z.string(),
  length: z.number().optional(),
  precision: z.number().default(0),
  scale: z.any(),
  default: z.any(),
  required: z.boolean().default(false),
  allowNull: z.boolean().default(true),
  fixedLength: z.boolean().default(false),
  supportsMultibyte: z.boolean().default(false),
  isPrimaryKey: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  isForeignKey: z.boolean().default(false),
  refTable: z.string().optional(),
  refField: z.string().optional(),
  refOnUpdate: z.any(),
  refOnDelete: z.any(),
  picklist: z.array(z.string()).optional(),
  validation: z.any(),
  dbFunction: z.any(),
  isVirtual: z.boolean().default(false),
  isAggregate: z.boolean().default(false),
  object: z.object({
    key: z.object({
      label: z.string(),
      type: z.string()
    }),
    value: z.object({
      label: z.string(),
      type: z.string()
    })
  }).optional(),
  items: z.union([z.array(z.lazy(() => ConfigSchemaValidator)), z.literal('string')]),
  values: z.array(z.any()).optional(),
  dbType: z.string().optional(),
  autoIncrement: z.boolean().default(false),
  isIndex: z.boolean().default(false),
  columns: z.number().optional(),
  legend: z.string().optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  category: z.enum(['basic', 'advanced', 'security']).default('basic')
});

/**
 * Service configuration validation schema
 */
export const ServiceConfigValidator = z.object({
  name: z.string()
    .min(1, 'Service name is required')
    .max(50, 'Service name must be 50 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Service name must start with a letter and contain only letters, numbers, and underscores'),
  label: z.string().min(1, 'Service label is required'),
  description: z.string().optional(),
  type: z.enum(ServiceTypes),
  isActive: z.boolean().default(true),
  config: z.record(z.any()).default({}),
  tags: z.array(z.string()).default([]),
  version: z.string().default('1.0.0')
});

/**
 * Service creation validation schema
 */
export const ServiceCreateValidator = ServiceConfigValidator.extend({
  id: z.number().optional()
});

/**
 * Service update validation schema
 */
export const ServiceUpdateValidator = ServiceConfigValidator.partial().extend({
  id: z.number(),
  name: z.string().optional(),
  lastModifiedDate: z.string().optional()
});

// ============================================================================
// SERVICE CONFIGURATION INTERFACES
// ============================================================================

/**
 * Configuration schema definition for service fields
 */
export interface ConfigSchema {
  name: string;
  label: string;
  type: ConfigFieldType;
  description?: string;
  alias: string;
  native?: any[];
  length?: number;
  precision: number;
  scale: any;
  default: any;
  required?: boolean;
  allowNull?: boolean;
  fixedLength?: boolean;
  supportsMultibyte?: boolean;
  isPrimaryKey?: boolean;
  isUnique?: boolean;
  isForeignKey?: boolean;
  refTable?: string;
  refField?: string;
  refOnUpdate: any;
  refOnDelete: any;
  picklist?: string[];
  validation?: ValidationRule[];
  dbFunction: any;
  isVirtual?: boolean;
  isAggregate?: boolean;
  object?: {
    key: LabelType;
    value: LabelType;
  };
  items: Array<ConfigSchema> | 'string';
  values?: any[];
  dbType?: string;
  autoIncrement?: boolean;
  isIndex?: boolean;
  columns?: number;
  legend?: string;
  placeholder?: string;
  helpText?: string;
  category?: 'basic' | 'advanced' | 'security';
  conditional?: ConditionalField;
}

/**
 * Label type for configuration objects
 */
export interface LabelType {
  label: string;
  type: string;
}

/**
 * Validation rule for configuration fields
 */
export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

/**
 * Conditional field configuration
 */
export interface ConditionalField {
  dependsOn: string;
  values: any[];
  action: 'show' | 'hide' | 'enable' | 'disable';
}

/**
 * Service type definition with configuration schema
 */
export interface ServiceTypeDefinition {
  name: string;
  label: string;
  description: string;
  group: ServiceGroup;
  class?: string;
  configSchema: Array<ConfigSchema>;
  capabilities: ServiceCapabilities;
  documentation?: {
    url: string;
    version: string;
  };
  icon?: string;
  category: 'basic' | 'advanced' | 'enterprise';
  deprecated?: boolean;
  replacedBy?: string;
}

/**
 * Service capabilities configuration
 */
export interface ServiceCapabilities {
  supportsGeneratedAPIs: boolean;
  supportsCustomAPIs: boolean;
  supportsSchemaDiscovery: boolean;
  supportsTransactions: boolean;
  supportsStoredProcedures: boolean;
  supportsCaching: boolean;
  supportsFiltering: boolean;
  supportsPagination: boolean;
  supportsRelationships: boolean;
  supportsEventScripts: boolean;
  requiresAuthentication: boolean;
  connectionTesting: boolean;
}

// ============================================================================
// SERVICE MANAGEMENT INTERFACES
// ============================================================================

/**
 * Core service interface
 */
export interface Service {
  id: number;
  name: string;
  label: string;
  description: string;
  isActive: boolean;
  type: ServiceType;
  mutable: boolean;
  deletable: boolean;
  createdDate: string;
  lastModifiedDate: string;
  createdById: number | null;
  lastModifiedById: number | null;
  config: ServiceConfiguration;
  serviceDocByServiceId: number | null;
  refresh: boolean;
  tags?: string[];
  version?: string;
  healthStatus?: ServiceHealthStatus;
  metrics?: ServiceMetrics;
}

/**
 * Service configuration object
 */
export interface ServiceConfiguration {
  [key: string]: any;
  // Database-specific configuration
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  dsn?: string;
  options?: Record<string, any>;
  // Connection settings
  maxConnections?: number;
  connectionTimeout?: number;
  commandTimeout?: number;
  // SSL settings
  sslMode?: 'disable' | 'allow' | 'prefer' | 'require' | 'verify-ca' | 'verify-full';
  sslCert?: string;
  sslKey?: string;
  sslRootCert?: string;
  // Cache settings
  cacheEnabled?: boolean;
  cacheTTL?: number;
  // API settings
  baseUrl?: string;
  apiKey?: string;
  authHeader?: string;
  // File service settings
  container?: string;
  region?: string;
  path?: string;
}

/**
 * Service row for table display
 */
export interface ServiceRow {
  id: number;
  name: string;
  label: string;
  description: string;
  type: ServiceType;
  group: ServiceGroup;
  scripting: string;
  active: boolean;
  deletable: boolean;
  healthStatus?: ServiceHealthStatus;
  lastTested?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'testing' | 'error';
}

/**
 * Service health status
 */
export interface ServiceHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastChecked: string;
  responseTime?: number;
  errorCount?: number;
  uptime?: number;
}

/**
 * Service metrics
 */
export interface ServiceMetrics {
  requestCount: number;
  errorRate: number;
  averageResponseTime: number;
  lastActivity: string;
  dataVolume?: {
    read: number;
    written: number;
  };
}

// ============================================================================
// API GENERATION INTERFACES
// ============================================================================

/**
 * API endpoint configuration
 */
export interface APIEndpointConfig {
  serviceName: string;
  resource: string;
  methods: HTTPMethod[];
  parameters: EndpointParameter[];
  authentication: AuthenticationConfig;
  caching: CachingConfig;
  rateLimit: RateLimitConfig;
  validation: ValidationConfig;
  transformation: TransformationConfig;
  documentation: EndpointDocumentation;
}

/**
 * HTTP methods supported for endpoints
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Endpoint parameter configuration
 */
export interface EndpointParameter {
  name: string;
  type: 'query' | 'path' | 'header' | 'body';
  dataType: 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  example?: any;
  enum?: string[];
  format?: string;
  validation?: ValidationRule[];
}

/**
 * Authentication configuration for endpoints
 */
export interface AuthenticationConfig {
  required: boolean;
  methods: ('api_key' | 'basic' | 'bearer' | 'oauth2' | 'session')[];
  roles?: string[];
  permissions?: string[];
  customHeaders?: Record<string, string>;
}

/**
 * Caching configuration
 */
export interface CachingConfig {
  enabled: boolean;
  ttl?: number;
  key?: string;
  tags?: string[];
  vary?: string[];
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  enabled: boolean;
  requests?: number;
  window?: number;
  message?: string;
  headers?: boolean;
}

/**
 * Request/response validation configuration
 */
export interface ValidationConfig {
  validateRequest: boolean;
  validateResponse: boolean;
  schemas: {
    request?: object;
    response?: object;
  };
  strict: boolean;
}

/**
 * Data transformation configuration
 */
export interface TransformationConfig {
  request?: TransformationRule[];
  response?: TransformationRule[];
}

/**
 * Transformation rule
 */
export interface TransformationRule {
  type: 'map' | 'filter' | 'aggregate' | 'custom';
  field?: string;
  operation?: string;
  value?: any;
  script?: string;
}

/**
 * Endpoint documentation
 */
export interface EndpointDocumentation {
  summary: string;
  description?: string;
  tags?: string[];
  examples?: {
    request?: any;
    response?: any;
  };
  deprecated?: boolean;
}

// ============================================================================
// OPENAPI SPECIFICATION INTERFACES
// ============================================================================

/**
 * OpenAPI specification generation configuration
 */
export interface OpenAPIConfig {
  version: '3.0.0' | '3.0.1' | '3.0.2' | '3.0.3' | '3.1.0';
  info: OpenAPIInfo;
  servers: OpenAPIServer[];
  security?: OpenAPISecurityRequirement[];
  tags?: OpenAPITag[];
  externalDocs?: OpenAPIExternalDocs;
  components?: OpenAPIComponents;
}

/**
 * OpenAPI info object
 */
export interface OpenAPIInfo {
  title: string;
  description?: string;
  version: string;
  termsOfService?: string;
  contact?: {
    name?: string;
    email?: string;
    url?: string;
  };
  license?: {
    name: string;
    url?: string;
  };
}

/**
 * OpenAPI server object
 */
export interface OpenAPIServer {
  url: string;
  description?: string;
  variables?: Record<string, OpenAPIServerVariable>;
}

/**
 * OpenAPI server variable
 */
export interface OpenAPIServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

/**
 * OpenAPI security requirement
 */
export type OpenAPISecurityRequirement = Record<string, string[]>;

/**
 * OpenAPI tag
 */
export interface OpenAPITag {
  name: string;
  description?: string;
  externalDocs?: OpenAPIExternalDocs;
}

/**
 * OpenAPI external documentation
 */
export interface OpenAPIExternalDocs {
  description?: string;
  url: string;
}

/**
 * OpenAPI components object
 */
export interface OpenAPIComponents {
  schemas?: Record<string, any>;
  responses?: Record<string, any>;
  parameters?: Record<string, any>;
  examples?: Record<string, any>;
  requestBodies?: Record<string, any>;
  headers?: Record<string, any>;
  securitySchemes?: Record<string, any>;
  links?: Record<string, any>;
  callbacks?: Record<string, any>;
}

/**
 * OpenAPI specification preview
 */
export interface OpenAPIPreview {
  spec: object;
  url: string;
  downloadUrl: string;
  lastGenerated: string;
  errors?: string[];
  warnings?: string[];
}

// ============================================================================
// API GENERATION WORKFLOW INTERFACES
// ============================================================================

/**
 * API generation wizard step
 */
export interface GenerationWizardStep {
  id: string;
  title: string;
  description: string;
  component: string;
  completed: boolean;
  required: boolean;
  data?: any;
  validation?: (data: any) => ValidationResult;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * API generation workflow
 */
export interface APIGenerationWorkflow {
  serviceId: number;
  serviceName: string;
  currentStep: number;
  steps: GenerationWizardStep[];
  configuration: APIGenerationConfiguration;
  status: 'draft' | 'validating' | 'generating' | 'completed' | 'error';
  progress: number;
  errors?: string[];
  result?: APIGenerationResult;
}

/**
 * API generation configuration
 */
export interface APIGenerationConfiguration {
  selectedTables: string[];
  endpoints: APIEndpointConfig[];
  security: SecurityConfiguration;
  documentation: DocumentationConfiguration;
  deployment: DeploymentConfiguration;
}

/**
 * Security configuration for generated APIs
 */
export interface SecurityConfiguration {
  authenticationRequired: boolean;
  defaultRoles: string[];
  endpointPermissions: EndpointPermission[];
  rateLimiting: GlobalRateLimitConfig;
  cors: CORSConfiguration;
  encryption: EncryptionConfiguration;
}

/**
 * Endpoint permission configuration
 */
export interface EndpointPermission {
  endpoint: string;
  method: HTTPMethod;
  roles: string[];
  permissions: string[];
  customRules?: SecurityRule[];
}

/**
 * Security rule
 */
export interface SecurityRule {
  type: 'ip_whitelist' | 'time_restriction' | 'custom';
  configuration: any;
  message?: string;
}

/**
 * Global rate limiting configuration
 */
export interface GlobalRateLimitConfig {
  enabled: boolean;
  default: RateLimitConfig;
  perEndpoint: Record<string, RateLimitConfig>;
}

/**
 * CORS configuration
 */
export interface CORSConfiguration {
  enabled: boolean;
  origins: string[];
  methods: HTTPMethod[];
  headers: string[];
  credentials: boolean;
  maxAge?: number;
}

/**
 * Encryption configuration
 */
export interface EncryptionConfiguration {
  enabled: boolean;
  algorithm: string;
  keyRotation: boolean;
  fields?: string[];
}

/**
 * Documentation configuration
 */
export interface DocumentationConfiguration {
  generateOpenAPI: boolean;
  includeExamples: boolean;
  theme: 'default' | 'redoc' | 'custom';
  customization: {
    logo?: string;
    colors?: Record<string, string>;
    fonts?: Record<string, string>;
  };
}

/**
 * Deployment configuration
 */
export interface DeploymentConfiguration {
  environment: 'development' | 'staging' | 'production';
  serverless: boolean;
  scaling: ScalingConfiguration;
  monitoring: MonitoringConfiguration;
}

/**
 * Scaling configuration
 */
export interface ScalingConfiguration {
  autoScale: boolean;
  minInstances: number;
  maxInstances: number;
  targetCPU: number;
  targetMemory: number;
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfiguration {
  enabled: boolean;
  metrics: string[];
  alerts: AlertConfiguration[];
  logging: LoggingConfiguration;
}

/**
 * Alert configuration
 */
export interface AlertConfiguration {
  name: string;
  condition: string;
  threshold: number;
  action: 'email' | 'webhook' | 'slack';
  configuration: any;
}

/**
 * Logging configuration
 */
export interface LoggingConfiguration {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  destinations: LogDestination[];
}

/**
 * Log destination
 */
export interface LogDestination {
  type: 'file' | 'database' | 'external';
  configuration: any;
}

/**
 * API generation result
 */
export interface APIGenerationResult {
  success: boolean;
  endpointsGenerated: number;
  openApiSpec?: OpenAPIPreview;
  deploymentUrl?: string;
  documentation?: {
    url: string;
    downloadUrl: string;
  };
  errors?: string[];
  warnings?: string[];
  metrics?: {
    generationTime: number;
    endpoints: EndpointMetrics[];
  };
}

/**
 * Endpoint metrics
 */
export interface EndpointMetrics {
  endpoint: string;
  method: HTTPMethod;
  responseTime: number;
  complexity: 'low' | 'medium' | 'high';
  dependencies: string[];
}

// ============================================================================
// REACT QUERY INTEGRATION TYPES
// ============================================================================

/**
 * Service query keys for React Query
 */
export const ServiceQueryKeys = {
  all: ['services'] as const,
  lists: () => [...ServiceQueryKeys.all, 'list'] as const,
  list: (filters: ServiceListFilters) => [...ServiceQueryKeys.lists(), filters] as const,
  details: () => [...ServiceQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...ServiceQueryKeys.details(), id] as const,
  types: () => [...ServiceQueryKeys.all, 'types'] as const,
  health: (id: number) => [...ServiceQueryKeys.all, 'health', id] as const,
  metrics: (id: number) => [...ServiceQueryKeys.all, 'metrics', id] as const,
  preview: (id: number) => [...ServiceQueryKeys.all, 'preview', id] as const,
} as const;

/**
 * Service list filters
 */
export interface ServiceListFilters {
  type?: ServiceType;
  group?: ServiceGroup;
  active?: boolean;
  search?: string;
  tags?: string[];
  sortBy?: 'name' | 'type' | 'created' | 'modified';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Service list response
 */
export interface ServiceListResponse {
  services: ServiceRow[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Service mutation types
 */
export type ServiceMutationType = 'create' | 'update' | 'delete' | 'test' | 'deploy';

/**
 * Service mutation options
 */
export interface ServiceMutationOptions<T = any> extends Omit<UseMutationOptions<T>, 'mutationFn'> {
  optimistic?: boolean;
  invalidateQueries?: boolean;
  showSuccessMessage?: boolean;
  showErrorMessage?: boolean;
}

/**
 * Service query options
 */
export interface ServiceQueryOptions<T = any> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
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
 * Next.js API route handler types for services
 */
export interface ServiceAPIRouteContext {
  params: {
    serviceId?: string;
    action?: string;
  };
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
}

/**
 * Service API response
 */
export interface ServiceAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

/**
 * Service test result
 */
export interface ServiceTestResult {
  success: boolean;
  connectionTime: number;
  message: string;
  details?: {
    host: string;
    port: number;
    database?: string;
    version?: string;
    features?: string[];
  };
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
}

// ============================================================================
// LDAP AND AUTH SERVICE TYPES
// ============================================================================

/**
 * LDAP service configuration
 */
export interface LdapService {
  name: string;
  label: string;
  host: string;
  port: number;
  baseDn: string;
  bindDn?: string;
  bindPassword?: string;
  userFilter: string;
  groupFilter?: string;
  encryption?: 'none' | 'ssl' | 'tls';
  attributes: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
  };
}

/**
 * Authentication service configuration
 */
export interface AuthService {
  iconClass: string;
  label: string;
  name: string;
  type: string;
  path: string;
  config: {
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    scopes?: string[];
    authUrl?: string;
    tokenUrl?: string;
    userInfoUrl?: string;
  };
}

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

/**
 * Service list component props
 */
export interface ServiceListProps {
  filters?: ServiceListFilters;
  onServiceSelect?: (service: ServiceRow) => void;
  onServiceCreate?: () => void;
  onServiceEdit?: (service: ServiceRow) => void;
  onServiceDelete?: (service: ServiceRow) => void;
  onServiceTest?: (service: ServiceRow) => void;
  showActions?: boolean;
  selectable?: boolean;
  multiSelect?: boolean;
}

/**
 * Service form component props
 */
export interface ServiceFormProps {
  service?: Service;
  serviceTypes: ServiceTypeDefinition[];
  onSubmit: (data: ServiceConfigValidator) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit' | 'clone';
}

/**
 * Service test component props
 */
export interface ServiceTestProps {
  serviceId?: number;
  config: ServiceConfiguration;
  serviceType: ServiceType;
  onTestComplete?: (result: ServiceTestResult) => void;
  autoTest?: boolean;
}

/**
 * API generation wizard props
 */
export interface APIGenerationWizardProps {
  service: Service;
  onComplete: (result: APIGenerationResult) => void;
  onCancel?: () => void;
  initialConfiguration?: Partial<APIGenerationConfiguration>;
}

/**
 * OpenAPI preview component props
 */
export interface OpenAPIPreviewProps {
  serviceId: number;
  configuration: APIGenerationConfiguration;
  onDownload?: (url: string) => void;
  onEdit?: () => void;
  theme?: 'swagger' | 'redoc';
}

// ============================================================================
// HELPER TYPES AND UTILITIES
// ============================================================================

/**
 * Service status union type
 */
export type ServiceStatus = 'active' | 'inactive' | 'error' | 'testing' | 'deploying';

/**
 * Service operation result
 */
export interface ServiceOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Service export/import types
 */
export interface ServiceExportData {
  services: Service[];
  types: ServiceTypeDefinition[];
  metadata: {
    exportedAt: string;
    version: string;
    source: string;
  };
}

/**
 * Categorized configuration fields
 */
export interface CategorizedFields {
  basic: ConfigSchema[];
  advanced: ConfigSchema[];
  security: ConfigSchema[];
}

/**
 * Service deployment status
 */
export interface ServiceDeploymentStatus {
  status: 'pending' | 'deploying' | 'deployed' | 'failed';
  environment: string;
  url?: string;
  lastDeployed?: string;
  logs?: string[];
  error?: string;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Re-export Zod validators for external use
export {
  ConfigSchemaValidator,
  ServiceConfigValidator,
  ServiceCreateValidator,
  ServiceUpdateValidator
};

// Type utilities
export type ServiceFormData = z.infer<typeof ServiceConfigValidator>;
export type ServiceCreateData = z.infer<typeof ServiceCreateValidator>;
export type ServiceUpdateData = z.infer<typeof ServiceUpdateValidator>;
export type ConfigSchemaData = z.infer<typeof ConfigSchemaValidator>;

// Default exports for common types
export type {
  Service as DefaultService,
  ServiceRow as DefaultServiceRow,
  ServiceTypeDefinition as DefaultServiceType,
  APIEndpointConfig as DefaultEndpointConfig,
  OpenAPIConfig as DefaultOpenAPIConfig
};