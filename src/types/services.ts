/**
 * @fileoverview Service management types for DreamFactory service configurations
 * @description API endpoint generation, OpenAPI specifications, and service deployment
 * Supports all service types with React Query optimization and server-side rendering capabilities
 * 
 * @version 1.0.0
 * @license MIT
 * @author DreamFactory Team
 * 
 * Features:
 * - Migrated Angular service management to React hooks with SWR/React Query
 * - Added OpenAPI specification generation types with Next.js API route integration
 * - Enhanced service configuration with Zod validation schemas
 * - Added optimistic updates for service CRUD operations
 * - Integrated service deployment types with Next.js serverless functions
 * - Support for React Hook Form implementations replacing Angular reactive forms
 * - Endpoint configuration workflows with parameter management
 * - React-based step navigation for API generation wizards
 */

import type { z } from 'zod'
import type { 
  ApiResponse, 
  ApiRequest, 
  ApiError, 
  ListResponse,
  CacheConfig,
  MutationOptions,
  QueryOptions 
} from './api'
import type { 
  DatabaseConnection, 
  DatabaseConfig, 
  DatabaseType,
  ConnectionTest 
} from './database'

// =============================================================================
// SERVICE TYPE DEFINITIONS
// =============================================================================

/**
 * Core service type enumeration
 * Supports all DreamFactory service categories
 */
export type ServiceCategory = 
  | 'database'      // Database services (MySQL, PostgreSQL, etc.)
  | 'email'         // Email services (SMTP, SES, etc.)
  | 'file'          // File storage services (S3, Azure, etc.)
  | 'oauth'         // OAuth authentication providers
  | 'ldap'          // LDAP/Active Directory services
  | 'saml'          // SAML SSO providers
  | 'script'        // Server-side scripting services
  | 'cache'         // Caching services (Redis, Memcached)
  | 'push'          // Push notification services
  | 'remote_web'    // Remote web services/APIs
  | 'soap'          // SOAP web services
  | 'rpc'           // RPC services
  | 'http'          // HTTP services
  | 'api_key'       // API key authentication
  | 'jwt'           // JWT authentication
  | 'custom'        // Custom service types

/**
 * Service status enumeration
 * Represents the current operational state of a service
 */
export type ServiceStatus = 
  | 'active'        // Service is running and available
  | 'inactive'      // Service is configured but not active
  | 'error'         // Service has configuration or runtime errors
  | 'testing'       // Service is being tested/validated
  | 'deploying'     // Service is being deployed
  | 'updating'      // Service is being updated

/**
 * HTTP methods supported for API endpoint generation
 */
export type HTTPMethod = 
  | 'GET' 
  | 'POST' 
  | 'PUT' 
  | 'PATCH' 
  | 'DELETE' 
  | 'HEAD' 
  | 'OPTIONS'

/**
 * Service configuration field types
 * Enhanced from Angular version with React-specific optimizations
 */
export type ConfigFieldType =
  | 'string'                    // Text input
  | 'text'                      // Textarea
  | 'integer'                   // Number input
  | 'password'                  // Password input
  | 'boolean'                   // Checkbox/toggle
  | 'object'                    // Object/JSON editor
  | 'array'                     // Array editor
  | 'picklist'                  // Select dropdown
  | 'multi_picklist'            // Multi-select
  | 'file_certificate'          // File upload for certificates
  | 'file_certificate_api'      // API-based certificate upload
  | 'verb_mask'                 // HTTP verb selection
  | 'event_picklist'            // Event type selection
  | 'connection_string'         // Database connection string
  | 'endpoint_url'              // API endpoint URL
  | 'json_schema'               // JSON schema editor
  | 'yaml_config'               // YAML configuration editor

// =============================================================================
// SERVICE CONFIGURATION TYPES
// =============================================================================

/**
 * Service configuration schema definition
 * Enhanced from Angular version with Zod validation support
 */
export interface ServiceConfigSchema {
  /** Field identifier */
  name: string
  
  /** Display label for the field */
  label: string
  
  /** Field input type */
  type: ConfigFieldType
  
  /** Help text or field description */
  description?: string
  
  /** Alternative name for the field */
  alias?: string
  
  /** Native options for picklist types */
  native?: Array<{ label: string; value: any }>
  
  /** Maximum field length */
  length?: number
  
  /** Numeric precision */
  precision?: number
  
  /** Numeric scale */
  scale?: number
  
  /** Default value */
  default?: any
  
  /** Whether field is required */
  required?: boolean
  
  /** Whether field allows null values */
  allowNull?: boolean
  
  /** Whether field has fixed length */
  fixedLength?: boolean
  
  /** Whether field supports multibyte characters */
  supportsMultibyte?: boolean
  
  /** Whether field is a primary key */
  isPrimaryKey?: boolean
  
  /** Whether field must be unique */
  isUnique?: boolean
  
  /** Whether field is a foreign key */
  isForeignKey?: boolean
  
  /** Referenced table for foreign keys */
  refTable?: string
  
  /** Referenced field for foreign keys */
  refField?: string
  
  /** Foreign key update action */
  refOnUpdate?: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'SET DEFAULT'
  
  /** Foreign key delete action */
  refOnDelete?: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'SET DEFAULT'
  
  /** Picklist options */
  picklist?: Array<{ label: string; value: any }>
  
  /** Field validation rules */
  validation?: {
    pattern?: string
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    custom?: string
  }
  
  /** Database function association */
  dbFunction?: string
  
  /** Whether field is virtual */
  isVirtual?: boolean
  
  /** Whether field is aggregate */
  isAggregate?: boolean
  
  /** Object field configuration */
  object?: {
    key: { label: string; type: string }
    value: { label: string; type: string }
  }
  
  /** Array items configuration */
  items?: Array<ServiceConfigSchema> | 'string'
  
  /** Available values for selection */
  values?: any[]
  
  /** Database type mapping */
  dbType?: string
  
  /** Whether field auto-increments */
  autoIncrement?: boolean
  
  /** Whether field is indexed */
  isIndex?: boolean
  
  /** Number of columns for display */
  columns?: number
  
  /** Field legend/group label */
  legend?: string
  
  /** Conditional display logic */
  conditional?: {
    field: string
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains'
    value: any
  }
  
  /** React Hook Form specific configuration */
  reactHookForm?: {
    /** Field dependencies */
    dependencies?: string[]
    /** Custom validation function */
    customValidation?: (value: any, formValues: any) => string | boolean
    /** Debounce delay for validation */
    debounceMs?: number
  }
  
  /** Zod schema for validation */
  zodSchema?: z.ZodType<any>
}

/**
 * Service type definition
 * Enhanced with React ecosystem metadata
 */
export interface ServiceType {
  /** Service type identifier */
  name: string
  
  /** Display label */
  label: string
  
  /** Service description */
  description: string
  
  /** Service category */
  group: ServiceCategory
  
  /** Service implementation class */
  class?: string
  
  /** Configuration schema */
  configSchema: Array<ServiceConfigSchema>
  
  /** Service icon identifier */
  icon?: string
  
  /** Service color theme */
  color?: string
  
  /** Whether service supports multiple instances */
  supportsMultipleInstances?: boolean
  
  /** Minimum DreamFactory version required */
  minimumVersion?: string
  
  /** License requirements */
  licenseRequired?: boolean
  
  /** Service capabilities */
  capabilities?: {
    /** Supports API generation */
    apiGeneration?: boolean
    /** Supports real-time data */
    realTime?: boolean
    /** Supports transactions */
    transactions?: boolean
    /** Supports batch operations */
    batchOperations?: boolean
    /** Supports event scripts */
    eventScripts?: boolean
  }
  
  /** React-specific metadata */
  react?: {
    /** Custom form component */
    customFormComponent?: string
    /** Form validation schema */
    validationSchema?: z.ZodType<any>
    /** Default form values */
    defaultValues?: Record<string, any>
    /** Form field grouping */
    fieldGroups?: Array<{
      name: string
      label: string
      fields: string[]
      collapsible?: boolean
    }>
  }
  
  /** Next.js API route patterns */
  nextjs?: {
    /** API routes for service operations */
    apiRoutes?: {
      test?: string
      deploy?: string
      preview?: string
      validate?: string
    }
    /** Server-side rendering support */
    ssrSupported?: boolean
    /** Edge runtime compatibility */
    edgeCompatible?: boolean
  }
}

// =============================================================================
// SERVICE INSTANCE TYPES
// =============================================================================

/**
 * Service instance definition
 * Enhanced from Angular version with React Query optimization
 */
export interface Service {
  /** Unique service identifier */
  id: number
  
  /** Service name (unique) */
  name: string
  
  /** Display label */
  label: string
  
  /** Service description */
  description: string
  
  /** Whether service is active */
  isActive: boolean
  
  /** Service type */
  type: string
  
  /** Whether service is mutable */
  mutable: boolean
  
  /** Whether service can be deleted */
  deletable: boolean
  
  /** Creation timestamp */
  createdDate: string
  
  /** Last modification timestamp */
  lastModifiedDate: string
  
  /** Created by user ID */
  createdById: number | null
  
  /** Last modified by user ID */
  lastModifiedById: number | null
  
  /** Service configuration */
  config: Record<string, any>
  
  /** Service documentation ID */
  serviceDocByServiceId: number | null
  
  /** Force refresh flag */
  refresh: boolean
  
  /** Service status */
  status?: ServiceStatus
  
  /** Health check information */
  health?: {
    status: 'healthy' | 'unhealthy' | 'degraded'
    lastCheck: string
    message?: string
    metrics?: {
      responseTime?: number
      errorRate?: number
      throughput?: number
    }
  }
  
  /** React Query cache metadata */
  cache?: {
    /** Last cache update */
    lastUpdate: string
    /** Cache TTL in seconds */
    ttl: number
    /** Cache invalidation strategy */
    invalidation: 'manual' | 'automatic' | 'time-based'
  }
  
  /** OpenAPI specification metadata */
  openapi?: {
    /** Generated spec URL */
    specUrl?: string
    /** Spec generation timestamp */
    generatedAt?: string
    /** Spec version */
    version?: string
    /** Number of endpoints */
    endpointCount?: number
  }
}

/**
 * Service list row data for table display
 * Optimized for React virtual scrolling
 */
export interface ServiceRow {
  /** Service ID */
  id: number
  
  /** Service name */
  name: string
  
  /** Display label */
  label: string
  
  /** Service description */
  description: string
  
  /** Service type */
  type: string
  
  /** Scripting support indicator */
  scripting: string
  
  /** Active status */
  active: boolean
  
  /** Deletable flag */
  deletable: boolean
  
  /** Service category */
  category?: ServiceCategory
  
  /** Status indicator */
  status?: ServiceStatus
  
  /** Last activity timestamp */
  lastActivity?: string
  
  /** Endpoint count */
  endpointCount?: number
  
  /** Health status */
  healthStatus?: 'healthy' | 'unhealthy' | 'degraded' | 'unknown'
}

// =============================================================================
// API ENDPOINT GENERATION TYPES
// =============================================================================

/**
 * API endpoint configuration
 * Enhanced for React Hook Form integration
 */
export interface EndpointConfig {
  /** Endpoint path */
  path: string
  
  /** HTTP method */
  method: HTTPMethod
  
  /** Endpoint description */
  description?: string
  
  /** Operation ID for OpenAPI */
  operationId?: string
  
  /** Tags for grouping */
  tags?: string[]
  
  /** Path parameters */
  pathParameters?: Array<{
    name: string
    type: string
    required: boolean
    description?: string
    pattern?: string
  }>
  
  /** Query parameters */
  queryParameters?: Array<{
    name: string
    type: string
    required: boolean
    description?: string
    default?: any
    enum?: any[]
  }>
  
  /** Request body schema */
  requestBody?: {
    required: boolean
    contentType: string
    schema: any
    examples?: Record<string, any>
  }
  
  /** Response definitions */
  responses?: Record<string, {
    description: string
    contentType?: string
    schema?: any
    examples?: Record<string, any>
  }>
  
  /** Security requirements */
  security?: Array<{
    type: 'apiKey' | 'bearer' | 'oauth2' | 'basic'
    name?: string
    in?: 'header' | 'query' | 'cookie'
    scheme?: string
    flows?: any
  }>
  
  /** Rate limiting configuration */
  rateLimit?: {
    requests: number
    period: 'second' | 'minute' | 'hour' | 'day'
    burst?: number
  }
  
  /** Caching configuration */
  caching?: {
    enabled: boolean
    ttl: number
    varyBy?: string[]
    conditions?: Array<{
      parameter: string
      operator: string
      value: any
    }>
  }
  
  /** Validation rules */
  validation?: {
    input?: z.ZodType<any>
    output?: z.ZodType<any>
    custom?: string[]
  }
  
  /** React Hook Form configuration */
  formConfig?: {
    /** Field dependencies */
    dependencies?: string[]
    /** Conditional display logic */
    conditional?: Array<{
      field: string
      operator: string
      value: any
      action: 'show' | 'hide' | 'require' | 'disable'
    }>
    /** Form validation schema */
    schema?: z.ZodType<any>
  }
}

/**
 * Endpoint generation result
 */
export interface EndpointGenerationResult {
  /** Generated endpoint configuration */
  endpoint: EndpointConfig
  
  /** Generated OpenAPI specification */
  openapi: Partial<OpenAPISpec>
  
  /** Generated code samples */
  codeSamples?: Record<string, string>
  
  /** Generation metadata */
  metadata: {
    generatedAt: string
    version: string
    generator: string
    source: string
  }
  
  /** Validation results */
  validation?: {
    valid: boolean
    errors?: string[]
    warnings?: string[]
  }
  
  /** Performance metrics */
  performance?: {
    generationTime: number
    specSize: number
    endpointComplexity: number
  }
}

// =============================================================================
// OPENAPI SPECIFICATION TYPES
// =============================================================================

/**
 * OpenAPI 3.0 specification structure
 * Enhanced for Next.js API route integration
 */
export interface OpenAPISpec {
  /** OpenAPI version */
  openapi: '3.0.0' | '3.0.1' | '3.0.2' | '3.0.3' | '3.1.0'
  
  /** API information */
  info: {
    title: string
    version: string
    description?: string
    termsOfService?: string
    contact?: {
      name?: string
      url?: string
      email?: string
    }
    license?: {
      name: string
      url?: string
    }
  }
  
  /** Server configurations */
  servers?: Array<{
    url: string
    description?: string
    variables?: Record<string, {
      enum?: string[]
      default: string
      description?: string
    }>
  }>
  
  /** API paths */
  paths: Record<string, OpenAPIPath>
  
  /** Reusable components */
  components?: {
    schemas?: Record<string, OpenAPISchema>
    responses?: Record<string, OpenAPIResponse>
    parameters?: Record<string, OpenAPIParameter>
    examples?: Record<string, any>
    requestBodies?: Record<string, any>
    headers?: Record<string, any>
    securitySchemes?: Record<string, any>
    links?: Record<string, any>
    callbacks?: Record<string, any>
  }
  
  /** Security requirements */
  security?: Array<Record<string, string[]>>
  
  /** Tags for organization */
  tags?: Array<{
    name: string
    description?: string
    externalDocs?: {
      description?: string
      url: string
    }
  }>
  
  /** External documentation */
  externalDocs?: {
    description?: string
    url: string
  }
  
  /** DreamFactory specific extensions */
  'x-dreamfactory'?: {
    serviceId: number
    serviceName: string
    serviceType: string
    generated: string
    generator: {
      name: string
      version: string
    }
    cache?: {
      ttl: number
      strategy: string
    }
    performance?: {
      optimizations: string[]
      benchmarks?: Record<string, number>
    }
  }
  
  /** Next.js specific extensions */
  'x-nextjs'?: {
    apiRoutes: Record<string, {
      path: string
      method: string
      handler: string
    }>
    serverless: boolean
    edge: boolean
    middleware?: string[]
  }
}

/**
 * OpenAPI path item definition
 */
export interface OpenAPIPath {
  /** HTTP methods */
  get?: OpenAPIOperation
  post?: OpenAPIOperation
  put?: OpenAPIOperation
  patch?: OpenAPIOperation
  delete?: OpenAPIOperation
  head?: OpenAPIOperation
  options?: OpenAPIOperation
  
  /** Path parameters */
  parameters?: OpenAPIParameter[]
  
  /** Summary */
  summary?: string
  
  /** Description */
  description?: string
  
  /** External documentation */
  externalDocs?: {
    description?: string
    url: string
  }
  
  /** Path extensions */
  [key: `x-${string}`]: any
}

/**
 * OpenAPI operation definition
 */
export interface OpenAPIOperation {
  /** Operation ID */
  operationId?: string
  
  /** Summary */
  summary?: string
  
  /** Description */
  description?: string
  
  /** Tags */
  tags?: string[]
  
  /** Parameters */
  parameters?: OpenAPIParameter[]
  
  /** Request body */
  requestBody?: {
    required?: boolean
    content: Record<string, {
      schema: OpenAPISchema
      examples?: Record<string, any>
    }>
  }
  
  /** Responses */
  responses: Record<string, OpenAPIResponse>
  
  /** Security */
  security?: Array<Record<string, string[]>>
  
  /** Deprecated flag */
  deprecated?: boolean
  
  /** External documentation */
  externalDocs?: {
    description?: string
    url: string
  }
  
  /** Operation extensions */
  [key: `x-${string}`]: any
}

/**
 * OpenAPI schema definition
 */
export interface OpenAPISchema {
  /** Schema type */
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object'
  
  /** Format specification */
  format?: string
  
  /** Title */
  title?: string
  
  /** Description */
  description?: string
  
  /** Default value */
  default?: any
  
  /** Enumeration values */
  enum?: any[]
  
  /** Example value */
  example?: any
  
  /** Multiple examples */
  examples?: any[]
  
  /** Nullable flag */
  nullable?: boolean
  
  /** Read-only flag */
  readOnly?: boolean
  
  /** Write-only flag */
  writeOnly?: boolean
  
  /** Deprecated flag */
  deprecated?: boolean
  
  /** String constraints */
  minLength?: number
  maxLength?: number
  pattern?: string
  
  /** Numeric constraints */
  minimum?: number
  maximum?: number
  exclusiveMinimum?: boolean
  exclusiveMaximum?: boolean
  multipleOf?: number
  
  /** Array constraints */
  items?: OpenAPISchema
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  
  /** Object constraints */
  properties?: Record<string, OpenAPISchema>
  required?: string[]
  additionalProperties?: boolean | OpenAPISchema
  minProperties?: number
  maxProperties?: number
  
  /** Composition */
  allOf?: OpenAPISchema[]
  anyOf?: OpenAPISchema[]
  oneOf?: OpenAPISchema[]
  not?: OpenAPISchema
  
  /** Reference */
  $ref?: string
  
  /** Schema extensions */
  [key: `x-${string}`]: any
}

/**
 * OpenAPI response definition
 */
export interface OpenAPIResponse {
  /** Response description */
  description: string
  
  /** Response headers */
  headers?: Record<string, {
    description?: string
    schema?: OpenAPISchema
    required?: boolean
    deprecated?: boolean
    allowEmptyValue?: boolean
    explode?: boolean
    example?: any
    examples?: Record<string, any>
  }>
  
  /** Response content */
  content?: Record<string, {
    schema?: OpenAPISchema
    examples?: Record<string, any>
    encoding?: Record<string, any>
  }>
  
  /** Response links */
  links?: Record<string, any>
  
  /** Response extensions */
  [key: `x-${string}`]: any
}

/**
 * OpenAPI parameter definition
 */
export interface OpenAPIParameter {
  /** Parameter name */
  name: string
  
  /** Parameter location */
  in: 'query' | 'header' | 'path' | 'cookie'
  
  /** Parameter description */
  description?: string
  
  /** Required flag */
  required?: boolean
  
  /** Deprecated flag */
  deprecated?: boolean
  
  /** Allow empty value */
  allowEmptyValue?: boolean
  
  /** Parameter schema */
  schema?: OpenAPISchema
  
  /** Parameter example */
  example?: any
  
  /** Multiple examples */
  examples?: Record<string, any>
  
  /** Parameter extensions */
  [key: `x-${string}`]: any
}

// =============================================================================
// SERVICE DEPLOYMENT TYPES
// =============================================================================

/**
 * Service deployment configuration
 * Enhanced for Next.js serverless integration
 */
export interface ServiceDeploymentConfig {
  /** Deployment target */
  target: 'serverless' | 'edge' | 'nodejs' | 'container'
  
  /** Environment configuration */
  environment: 'development' | 'staging' | 'production'
  
  /** Resource allocation */
  resources?: {
    memory?: string
    timeout?: string
    concurrency?: number
    runtime?: string
  }
  
  /** Environment variables */
  envVars?: Record<string, string>
  
  /** Scaling configuration */
  scaling?: {
    minInstances?: number
    maxInstances?: number
    targetCPU?: number
    targetMemory?: number
  }
  
  /** Health check configuration */
  healthCheck?: {
    path: string
    method: HTTPMethod
    timeout: number
    interval: number
    threshold: number
  }
  
  /** Monitoring configuration */
  monitoring?: {
    metrics: boolean
    logs: boolean
    traces: boolean
    alerts?: Array<{
      type: string
      threshold: number
      action: string
    }>
  }
  
  /** Next.js specific configuration */
  nextjs?: {
    /** API route configuration */
    apiRoute?: {
      path: string
      dynamic: boolean
      middleware?: string[]
    }
    /** Edge runtime settings */
    edge?: {
      regions?: string[]
      runtime?: 'edge' | 'nodejs'
    }
    /** Build configuration */
    build?: {
      outputStandalone?: boolean
      experimental?: Record<string, any>
    }
  }
  
  /** Security configuration */
  security?: {
    cors?: {
      origins: string[]
      methods: HTTPMethod[]
      headers: string[]
      credentials: boolean
    }
    rateLimit?: {
      requests: number
      period: string
      burst?: number
    }
    authentication?: {
      required: boolean
      methods: string[]
    }
  }
}

/**
 * Deployment status tracking
 */
export interface DeploymentStatus {
  /** Deployment ID */
  id: string
  
  /** Service ID */
  serviceId: number
  
  /** Deployment status */
  status: 'pending' | 'deploying' | 'deployed' | 'failed' | 'rolling_back'
  
  /** Status message */
  message?: string
  
  /** Deployment timestamp */
  deployedAt?: string
  
  /** Deployment URL */
  url?: string
  
  /** Health status */
  health?: 'healthy' | 'unhealthy' | 'degraded'
  
  /** Deployment metrics */
  metrics?: {
    buildTime?: number
    deployTime?: number
    memoryUsage?: number
    cpuUsage?: number
    requestCount?: number
    errorRate?: number
  }
  
  /** Rollback information */
  rollback?: {
    available: boolean
    previousVersion?: string
    reason?: string
  }
  
  /** Logs and debugging */
  logs?: {
    build?: string[]
    runtime?: string[]
    errors?: string[]
  }
}

// =============================================================================
// GENERATION WIZARD TYPES
// =============================================================================

/**
 * API generation wizard step definition
 * Enhanced for React-based step navigation
 */
export interface GenerationStep {
  /** Step identifier */
  id: string
  
  /** Step name */
  name: string
  
  /** Step title */
  title: string
  
  /** Step description */
  description?: string
  
  /** Step order */
  order: number
  
  /** Whether step is required */
  required: boolean
  
  /** Whether step is completed */
  completed: boolean
  
  /** Whether step is valid */
  valid: boolean
  
  /** Step validation errors */
  errors?: string[]
  
  /** Step data */
  data?: Record<string, any>
  
  /** Step component */
  component?: string
  
  /** Step navigation */
  navigation?: {
    previous?: string
    next?: string
    canSkip?: boolean
    canGoBack?: boolean
  }
  
  /** Step configuration */
  config?: {
    /** Form schema for the step */
    schema?: z.ZodType<any>
    /** Default values */
    defaultValues?: Record<string, any>
    /** Field dependencies */
    dependencies?: string[]
    /** Validation rules */
    validation?: {
      realTime?: boolean
      debounceMs?: number
      validateOnBlur?: boolean
    }
  }
  
  /** React Hook Form integration */
  form?: {
    /** Form methods */
    methods?: any
    /** Watch fields */
    watchFields?: string[]
    /** Trigger validation */
    triggerValidation?: string[]
  }
  
  /** Progress tracking */
  progress?: {
    current: number
    total: number
    percentage: number
  }
}

/**
 * Wizard state management
 * Enhanced with React state patterns
 */
export interface WizardState {
  /** Current step ID */
  currentStep: string
  
  /** All wizard steps */
  steps: Record<string, GenerationStep>
  
  /** Step order */
  stepOrder: string[]
  
  /** Overall wizard status */
  status: 'idle' | 'in_progress' | 'completed' | 'error'
  
  /** Wizard progress */
  progress: {
    current: number
    total: number
    percentage: number
    completedSteps: string[]
  }
  
  /** Wizard data */
  data: Record<string, any>
  
  /** Wizard validation */
  validation: {
    valid: boolean
    errors: Record<string, string[]>
    touched: Record<string, boolean>
  }
  
  /** Navigation state */
  navigation: {
    canGoNext: boolean
    canGoPrevious: boolean
    canFinish: boolean
    canCancel: boolean
  }
  
  /** React state management */
  react?: {
    /** Zustand store actions */
    actions?: {
      setCurrentStep: (stepId: string) => void
      updateStepData: (stepId: string, data: Record<string, any>) => void
      validateStep: (stepId: string) => Promise<boolean>
      nextStep: () => void
      previousStep: () => void
      reset: () => void
    }
    /** React Query cache keys */
    cacheKeys?: string[]
    /** Optimistic updates */
    optimistic?: boolean
  }
}

/**
 * Generation progress tracking
 */
export interface GenerationProgress {
  /** Progress ID */
  id: string
  
  /** Service being generated */
  serviceId: number
  
  /** Current phase */
  phase: 'initializing' | 'analyzing' | 'generating' | 'validating' | 'deploying' | 'completed' | 'error'
  
  /** Progress percentage */
  progress: number
  
  /** Current operation */
  operation?: string
  
  /** Status message */
  message?: string
  
  /** Start timestamp */
  startedAt: string
  
  /** Completion timestamp */
  completedAt?: string
  
  /** Error information */
  error?: {
    code: string
    message: string
    details?: any
    stack?: string
  }
  
  /** Generated artifacts */
  artifacts?: {
    openapi?: OpenAPISpec
    endpoints?: EndpointConfig[]
    documentation?: string
    examples?: Record<string, any>
  }
  
  /** Performance metrics */
  metrics?: {
    duration?: number
    endpointsGenerated?: number
    specSize?: number
    validationTime?: number
  }
}

/**
 * Generation result
 */
export interface GenerationResult {
  /** Result ID */
  id: string
  
  /** Service ID */
  serviceId: number
  
  /** Generation status */
  status: 'success' | 'error' | 'warning'
  
  /** Result message */
  message?: string
  
  /** Generated service configuration */
  service?: Service
  
  /** Generated OpenAPI specification */
  openapi?: OpenAPISpec
  
  /** Generated endpoints */
  endpoints?: EndpointConfig[]
  
  /** Generation metadata */
  metadata: {
    generatedAt: string
    generatedBy: string
    version: string
    source: string
    settings: Record<string, any>
  }
  
  /** Validation results */
  validation?: {
    valid: boolean
    errors?: string[]
    warnings?: string[]
    suggestions?: string[]
  }
  
  /** Performance metrics */
  performance?: {
    totalTime: number
    phases: Record<string, number>
    resourceUsage: {
      memory?: number
      cpu?: number
    }
  }
  
  /** Deployment information */
  deployment?: {
    url?: string
    status?: DeploymentStatus
    config?: ServiceDeploymentConfig
  }
}

// =============================================================================
// REACT QUERY OPTIMIZATION TYPES
// =============================================================================

/**
 * Service query configuration
 * Enhanced for React Query optimization
 */
export interface ServiceQueryConfig extends QueryOptions {
  /** Service ID for targeted queries */
  serviceId?: number
  
  /** Service type filtering */
  serviceType?: string
  
  /** Query key factory */
  keyFactory?: {
    all: () => string[]
    lists: () => string[]
    list: (filters?: any) => string[]
    details: () => string[]
    detail: (id: number) => string[]
    infinite: (params?: any) => string[]
  }
  
  /** Cache configuration */
  cache?: CacheConfig & {
    /** Service-specific cache tags */
    tags?: string[]
    /** Invalidation dependencies */
    dependencies?: string[]
    /** Background refresh strategy */
    backgroundRefresh?: 'always' | 'stale' | 'never'
  }
  
  /** Optimistic updates */
  optimistic?: {
    enabled: boolean
    strategy: 'immediate' | 'delayed' | 'conditional'
    rollbackDelay?: number
    conflictResolution?: 'server_wins' | 'client_wins' | 'merge'
  }
  
  /** Real-time synchronization */
  realtime?: {
    enabled: boolean
    channel?: string
    events?: string[]
    debounceMs?: number
  }
}

/**
 * Service mutation configuration
 * Enhanced for optimistic updates
 */
export interface ServiceMutationConfig extends MutationOptions {
  /** Mutation type */
  type: 'create' | 'update' | 'delete' | 'deploy' | 'test'
  
  /** Optimistic update configuration */
  optimistic?: {
    /** Update function */
    updateFn?: (old: any, variables: any) => any
    /** Rollback function */
    rollbackFn?: (old: any, error: any) => any
    /** Conflict resolution */
    onConflict?: (server: any, client: any) => any
  }
  
  /** Cache invalidation */
  invalidation?: {
    /** Query keys to invalidate */
    keys?: string[][]
    /** Invalidation strategy */
    strategy?: 'immediate' | 'delayed' | 'manual'
    /** Selective invalidation */
    predicate?: (query: any) => boolean
  }
  
  /** Side effects */
  sideEffects?: {
    /** Redirect after successful mutation */
    redirectTo?: string
    /** Notifications */
    notifications?: {
      success?: string
      error?: string
      loading?: string
    }
    /** Analytics tracking */
    analytics?: {
      event: string
      properties?: Record<string, any>
    }
  }
}

// =============================================================================
// FORM INTEGRATION TYPES
// =============================================================================

/**
 * Service form configuration
 * Enhanced for React Hook Form integration
 */
export interface ServiceFormConfig {
  /** Service type */
  serviceType: string
  
  /** Form mode */
  mode: 'create' | 'edit' | 'clone' | 'test'
  
  /** Form schema */
  schema: z.ZodType<any>
  
  /** Default values */
  defaultValues?: Record<string, any>
  
  /** Field configuration */
  fields: Record<string, {
    /** Field type */
    type: ConfigFieldType
    /** Field component */
    component?: string
    /** Field props */
    props?: Record<string, any>
    /** Validation rules */
    validation?: {
      required?: boolean
      pattern?: string
      custom?: (value: any, formValues: any) => string | boolean
    }
    /** Conditional logic */
    conditional?: {
      field: string
      operator: string
      value: any
      action: 'show' | 'hide' | 'require' | 'disable'
    }
    /** Field dependencies */
    dependencies?: string[]
  }>
  
  /** Form sections */
  sections?: Array<{
    name: string
    title: string
    description?: string
    fields: string[]
    collapsible?: boolean
    defaultExpanded?: boolean
  }>
  
  /** Form validation */
  validation?: {
    /** Validation mode */
    mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'all'
    /** Real-time validation */
    realTime?: boolean
    /** Debounce delay */
    debounceMs?: number
    /** Custom validation */
    custom?: (values: any) => Record<string, string> | Promise<Record<string, string>>
  }
  
  /** Form submission */
  submission?: {
    /** Transform data before submission */
    transform?: (values: any) => any
    /** Validation before submission */
    validate?: (values: any) => boolean | Promise<boolean>
    /** Submit handler */
    onSubmit?: (values: any) => Promise<any>
    /** Error handler */
    onError?: (error: any) => void
  }
  
  /** React Hook Form configuration */
  reactHookForm?: {
    /** Form options */
    options?: {
      mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'all'
      reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit'
      shouldFocusError?: boolean
      shouldUnregister?: boolean
      shouldUseNativeValidation?: boolean
      criteriaMode?: 'firstError' | 'all'
      delayError?: number
    }
    /** Watch configuration */
    watch?: {
      fields?: string[]
      onChange?: (values: any, info: any) => void
    }
    /** Reset configuration */
    reset?: {
      keepValues?: boolean
      keepErrors?: boolean
      keepDirty?: boolean
      keepTouched?: boolean
    }
  }
}

/**
 * Service form state
 */
export interface ServiceFormState {
  /** Current form values */
  values: Record<string, any>
  
  /** Form errors */
  errors: Record<string, string>
  
  /** Touched fields */
  touched: Record<string, boolean>
  
  /** Dirty fields */
  dirty: Record<string, boolean>
  
  /** Form validation state */
  isValid: boolean
  
  /** Form submission state */
  isSubmitting: boolean
  
  /** Form submission success */
  isSubmitSuccessful: boolean
  
  /** Submit count */
  submitCount: number
  
  /** Field states */
  fieldStates: Record<string, {
    invalid: boolean
    isTouched: boolean
    isDirty: boolean
    error?: string
  }>
  
  /** Form metadata */
  metadata: {
    /** Initial values */
    initialValues: Record<string, any>
    /** Changed fields */
    changedFields: string[]
    /** Last validation */
    lastValidation?: string
    /** Form mode */
    mode: 'create' | 'edit' | 'clone' | 'test'
  }
}

// =============================================================================
// SPECIALIZED SERVICE TYPES
// =============================================================================

/**
 * LDAP service configuration
 */
export interface LdapService {
  /** Service name */
  name: string
  
  /** Display label */
  label: string
  
  /** LDAP server host */
  host?: string
  
  /** LDAP server port */
  port?: number
  
  /** Base DN */
  baseDn?: string
  
  /** Bind DN */
  bindDn?: string
  
  /** Bind password */
  bindPassword?: string
  
  /** Use SSL/TLS */
  useSSL?: boolean
  
  /** Connection timeout */
  timeout?: number
}

/**
 * Authentication service configuration
 */
export interface AuthService {
  /** Service icon CSS class */
  iconClass: string
  
  /** Display label */
  label: string
  
  /** Service name */
  name: string
  
  /** Service type */
  type: string
  
  /** Service path */
  path: string
  
  /** OAuth configuration */
  oauth?: {
    clientId: string
    clientSecret: string
    redirectUri: string
    scope?: string[]
    authorizeUrl?: string
    tokenUrl?: string
  }
  
  /** SAML configuration */
  saml?: {
    entityId: string
    ssoUrl: string
    sloUrl?: string
    x509Cert: string
    nameIdFormat?: string
  }
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Service list response
 */
export type ServiceListResponse = ListResponse<ServiceRow>

/**
 * Service detail response
 */
export type ServiceDetailResponse = ApiResponse<Service>

/**
 * Service type list response
 */
export type ServiceTypeListResponse = ListResponse<ServiceType>

/**
 * Generation result response
 */
export type GenerationResultResponse = ApiResponse<GenerationResult>

/**
 * Deployment status response
 */
export type DeploymentStatusResponse = ApiResponse<DeploymentStatus>

/**
 * OpenAPI specification response
 */
export type OpenAPISpecResponse = ApiResponse<OpenAPISpec>

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Service-specific error types
 */
export interface ServiceError extends ApiError {
  /** Error category */
  category: 'configuration' | 'connection' | 'validation' | 'deployment' | 'generation'
  
  /** Service context */
  context?: {
    serviceId?: number
    serviceName?: string
    serviceType?: string
    operation?: string
  }
  
  /** Suggested actions */
  suggestions?: string[]
  
  /** Related documentation */
  documentation?: {
    title: string
    url: string
  }
}

/**
 * Validation error for service configuration
 */
export interface ServiceValidationError {
  /** Field path */
  field: string
  
  /** Error message */
  message: string
  
  /** Error code */
  code: string
  
  /** Invalid value */
  value?: any
  
  /** Validation rule that failed */
  rule?: string
  
  /** Suggested correction */
  suggestion?: string
}

/**
 * Generation error details
 */
export interface GenerationError extends ServiceError {
  /** Generation phase where error occurred */
  phase: 'initialization' | 'analysis' | 'generation' | 'validation' | 'deployment'
  
  /** Specific error details */
  details: {
    /** Error source */
    source?: string
    /** Line number (for schema errors) */
    line?: number
    /** Column number (for schema errors) */
    column?: number
    /** Expected value */
    expected?: any
    /** Actual value */
    actual?: any
  }
  
  /** Recovery options */
  recovery?: {
    /** Can retry generation */
    canRetry: boolean
    /** Can modify configuration */
    canModify: boolean
    /** Automatic recovery available */
    autoRecover: boolean
  }
}

// =============================================================================
// EXPORT TYPES FOR CONVENIENCE
// =============================================================================

/**
 * All service management types
 */
export type ServiceTypes = 
  | Service
  | ServiceType
  | ServiceRow
  | ServiceConfigSchema
  | EndpointConfig
  | OpenAPISpec
  | GenerationStep
  | WizardState
  | GenerationResult
  | ServiceDeploymentConfig
  | DeploymentStatus

/**
 * All form-related service types
 */
export type ServiceFormTypes = 
  | ServiceFormConfig
  | ServiceFormState
  | ConfigFieldType
  | ServiceValidationError

/**
 * All query and mutation types
 */
export type ServiceQueryTypes = 
  | ServiceQueryConfig
  | ServiceMutationConfig
  | ServiceListResponse
  | ServiceDetailResponse

/**
 * All error types
 */
export type ServiceErrorTypes = 
  | ServiceError
  | ServiceValidationError
  | GenerationError

/**
 * @example
 * // Import specific types
 * import type { Service, ServiceType, EndpointConfig } from '@/types/services'
 * 
 * // Import type groups
 * import type { ServiceTypes, ServiceFormTypes } from '@/types/services'
 * 
 * // Use in React components
 * const ServiceDetail: React.FC<{ service: Service }> = ({ service }) => {
 *   // Component implementation
 * }
 * 
 * // Use with React Hook Form
 * const serviceFormConfig: ServiceFormConfig = {
 *   serviceType: 'database',
 *   mode: 'create',
 *   schema: serviceValidationSchema,
 *   // ... other config
 * }
 * 
 * // Use with React Query
 * const serviceQuery: ServiceQueryConfig = {
 *   staleTime: 5 * 60 * 1000, // 5 minutes
 *   cacheTime: 10 * 60 * 1000, // 10 minutes
 *   optimistic: {
 *     enabled: true,
 *     strategy: 'immediate'
 *   }
 * }
 */