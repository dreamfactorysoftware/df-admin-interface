/**
 * API Generation Wizard Types
 * 
 * TypeScript interface definitions and type exports for the API generation wizard,
 * including wizard state, step data, table selection, endpoint configuration, 
 * and component prop interfaces. Defines type-safe contracts for the multi-step 
 * API generation workflow with Zod schema validators integration.
 * 
 * @fileoverview API generation wizard types for React/Next.js application
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import type { ReactNode } from 'react';
import { z } from 'zod';
import type { 
  DatabaseService, 
  SchemaTable, 
  SchemaField, 
  DatabaseDriver,
  ConnectionTestResult 
} from '../../../types/database-service';

// =============================================================================
// WIZARD STATE MANAGEMENT TYPES
// =============================================================================

/**
 * API Generation wizard step enumeration
 */
export type WizardStep = 
  | 'service-selection'
  | 'table-selection' 
  | 'endpoint-configuration'
  | 'security-configuration'
  | 'generation-preview'
  | 'generation-complete';

/**
 * Wizard step metadata interface
 */
export interface WizardStepInfo {
  /** Step identifier */
  step: WizardStep;
  
  /** Human-readable step title */
  title: string;
  
  /** Step description */
  description: string;
  
  /** Step number in sequence */
  order: number;
  
  /** Whether step is completed */
  completed: boolean;
  
  /** Whether step is currently active */
  active: boolean;
  
  /** Whether step is accessible for navigation */
  accessible: boolean;
  
  /** Validation status of step data */
  valid: boolean;
  
  /** Optional icon component for step */
  icon?: ReactNode;
  
  /** Whether step is optional */
  optional?: boolean;
  
  /** Estimated completion time in minutes */
  estimatedTime?: number;
}

/**
 * Complete wizard state interface
 */
export interface WizardState {
  /** Current active step */
  currentStep: WizardStep;
  
  /** Array of all wizard steps with metadata */
  steps: WizardStepInfo[];
  
  /** Service selection step data */
  serviceSelection: ServiceSelectionData;
  
  /** Table selection step data */
  tableSelection: TableSelectionData;
  
  /** Endpoint configuration step data */
  endpointConfiguration: EndpointConfigurationData;
  
  /** Security configuration step data */
  securityConfiguration: SecurityConfigurationData;
  
  /** Generation preview step data */
  generationPreview: GenerationPreviewData;
  
  /** Overall wizard completion status */
  completed: boolean;
  
  /** Wizard loading state */
  loading: boolean;
  
  /** Error state */
  error: string | null;
  
  /** Validation state for entire wizard */
  isValid: boolean;
  
  /** Last modified timestamp */
  lastModified: number;
  
  /** Wizard session ID for tracking */
  sessionId: string;
  
  /** Whether wizard can be saved as draft */
  isDraft: boolean;
  
  /** Auto-save enabled flag */
  autoSave: boolean;
}

/**
 * Wizard navigation actions interface
 */
export interface WizardActions {
  /** Navigate to specific step */
  goToStep: (step: WizardStep) => void;
  
  /** Navigate to next step */
  nextStep: () => void;
  
  /** Navigate to previous step */
  previousStep: () => void;
  
  /** Update service selection data */
  updateServiceSelection: (data: Partial<ServiceSelectionData>) => void;
  
  /** Update table selection data */
  updateTableSelection: (data: Partial<TableSelectionData>) => void;
  
  /** Update endpoint configuration data */
  updateEndpointConfiguration: (data: Partial<EndpointConfigurationData>) => void;
  
  /** Update security configuration data */
  updateSecurityConfiguration: (data: Partial<SecurityConfigurationData>) => void;
  
  /** Update generation preview data */
  updateGenerationPreview: (data: Partial<GenerationPreviewData>) => void;
  
  /** Reset wizard to initial state */
  resetWizard: () => void;
  
  /** Save wizard state as draft */
  saveDraft: () => Promise<void>;
  
  /** Load wizard state from draft */
  loadDraft: (draftId: string) => Promise<void>;
  
  /** Validate current step */
  validateCurrentStep: () => boolean;
  
  /** Validate entire wizard */
  validateWizard: () => boolean;
  
  /** Complete wizard and generate APIs */
  completeWizard: () => Promise<GenerationResult>;
}

/**
 * Complete wizard context type
 */
export type WizardContextType = WizardState & WizardActions;

// =============================================================================
// SERVICE SELECTION TYPES
// =============================================================================

/**
 * Service selection step data
 */
export interface ServiceSelectionData {
  /** Selected database service */
  selectedService: DatabaseService | null;
  
  /** List of available services */
  availableServices: DatabaseService[];
  
  /** Service loading state */
  loading: boolean;
  
  /** Service selection error */
  error: string | null;
  
  /** Last connection test result */
  connectionTest: ConnectionTestResult | null;
  
  /** Whether connection test is in progress */
  testingConnection: boolean;
  
  /** Service filter criteria */
  filter: ServiceFilter;
  
  /** Service creation mode flag */
  createNewService: boolean;
  
  /** New service configuration if creating */
  newServiceConfig: NewServiceConfig | null;
}

/**
 * Service filter configuration
 */
export interface ServiceFilter {
  /** Database type filter */
  databaseType?: DatabaseDriver;
  
  /** Service name search */
  searchTerm?: string;
  
  /** Active services only */
  activeOnly: boolean;
  
  /** Recently used services first */
  recentFirst: boolean;
}

/**
 * New service configuration
 */
export interface NewServiceConfig {
  /** Service name */
  name: string;
  
  /** Service description */
  description?: string;
  
  /** Database type */
  type: DatabaseDriver;
  
  /** Connection configuration */
  config: Record<string, any>;
  
  /** Whether service should be activated immediately */
  activate: boolean;
}

/**
 * Zod schema for service selection validation
 */
export const ServiceSelectionSchema = z.object({
  selectedService: z.object({
    id: z.number().min(1, 'Service ID is required'),
    name: z.string().min(1, 'Service name is required'),
    type: z.string().min(1, 'Service type is required'),
    is_active: z.boolean(),
  }).nullable(),
  createNewService: z.boolean(),
  newServiceConfig: z.object({
    name: z.string().min(1, 'Service name is required').max(255, 'Service name too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    type: z.enum(['mysql', 'postgresql', 'sqlserver', 'oracle', 'mongodb', 'snowflake', 'sqlite', 'mariadb']),
    config: z.record(z.any()),
    activate: z.boolean(),
  }).optional(),
});

/**
 * Service selection form data type
 */
export type ServiceSelectionFormData = z.infer<typeof ServiceSelectionSchema>;

// =============================================================================
// TABLE SELECTION TYPES
// =============================================================================

/**
 * Table selection step data
 */
export interface TableSelectionData {
  /** Available database tables */
  availableTables: SchemaTable[];
  
  /** Selected tables for API generation */
  selectedTables: SelectedTable[];
  
  /** Table loading state */
  loading: boolean;
  
  /** Table selection error */
  error: string | null;
  
  /** Schema discovery timestamp */
  lastDiscovered: string | null;
  
  /** Table filter and search criteria */
  filter: TableFilter;
  
  /** Bulk selection state */
  bulkSelection: BulkSelectionState;
  
  /** Table metadata cache */
  tableMetadata: Map<string, TableMetadata>;
  
  /** Schema refresh in progress */
  refreshing: boolean;
  
  /** Total table count */
  totalTables: number;
  
  /** Pagination state for large schemas */
  pagination: TablePaginationState;
}

/**
 * Selected table configuration
 */
export interface SelectedTable {
  /** Table name */
  name: string;
  
  /** Table schema/database */
  schema?: string;
  
  /** Human-readable label */
  label?: string;
  
  /** Table description */
  description?: string;
  
  /** Selected fields for API */
  selectedFields: SelectedField[];
  
  /** API endpoint configuration */
  apiConfig: TableApiConfig;
  
  /** Whether table is enabled for API generation */
  enabled: boolean;
  
  /** Table selection priority */
  priority: number;
  
  /** Custom table settings */
  customSettings: TableCustomSettings;
}

/**
 * Selected field configuration
 */
export interface SelectedField {
  /** Field name */
  name: string;
  
  /** Field data type */
  type: string;
  
  /** Whether field is included in API */
  included: boolean;
  
  /** Whether field is readable */
  readable: boolean;
  
  /** Whether field is writable */
  writable: boolean;
  
  /** Whether field is required */
  required: boolean;
  
  /** Field validation rules */
  validation?: FieldValidationConfig;
  
  /** Custom field label */
  label?: string;
  
  /** Field description */
  description?: string;
  
  /** Default value */
  defaultValue?: any;
  
  /** Whether field is primary key */
  isPrimaryKey: boolean;
  
  /** Whether field is foreign key */
  isForeignKey: boolean;
}

/**
 * Table API configuration
 */
export interface TableApiConfig {
  /** Enabled HTTP methods */
  methods: HttpMethodConfig;
  
  /** API endpoint path override */
  pathOverride?: string;
  
  /** Query parameters configuration */
  queryParams: QueryParamConfig;
  
  /** Response format configuration */
  responseFormat: ResponseFormatConfig;
  
  /** Pagination configuration */
  pagination: PaginationConfig;
  
  /** Filtering configuration */
  filtering: FilteringConfig;
  
  /** Sorting configuration */
  sorting: SortingConfig;
  
  /** Custom middleware */
  middleware: string[];
}

/**
 * HTTP method configuration
 */
export interface HttpMethodConfig {
  /** GET method enabled */
  get: boolean;
  
  /** POST method enabled */
  post: boolean;
  
  /** PUT method enabled */
  put: boolean;
  
  /** PATCH method enabled */
  patch: boolean;
  
  /** DELETE method enabled */
  delete: boolean;
  
  /** Custom method configurations */
  custom: CustomMethodConfig[];
}

/**
 * Custom method configuration
 */
export interface CustomMethodConfig {
  /** HTTP method name */
  method: string;
  
  /** Method description */
  description: string;
  
  /** Whether method is enabled */
  enabled: boolean;
  
  /** Custom parameters */
  parameters: Record<string, any>;
}

/**
 * Query parameter configuration
 */
export interface QueryParamConfig {
  /** Enable limit parameter */
  enableLimit: boolean;
  
  /** Enable offset parameter */
  enableOffset: boolean;
  
  /** Enable order parameter */
  enableOrder: boolean;
  
  /** Enable filter parameter */
  enableFilter: boolean;
  
  /** Enable fields parameter */
  enableFields: boolean;
  
  /** Custom query parameters */
  customParams: CustomQueryParam[];
  
  /** Default parameter values */
  defaults: Record<string, any>;
}

/**
 * Custom query parameter
 */
export interface CustomQueryParam {
  /** Parameter name */
  name: string;
  
  /** Parameter type */
  type: 'string' | 'number' | 'boolean' | 'array';
  
  /** Parameter description */
  description: string;
  
  /** Whether parameter is required */
  required: boolean;
  
  /** Default value */
  defaultValue?: any;
  
  /** Validation rules */
  validation?: Record<string, any>;
}

/**
 * Response format configuration
 */
export interface ResponseFormatConfig {
  /** Include metadata in response */
  includeMetadata: boolean;
  
  /** Include count in response */
  includeCount: boolean;
  
  /** Response wrapper format */
  wrapperFormat: 'none' | 'envelope' | 'custom';
  
  /** Custom response wrapper */
  customWrapper?: string;
  
  /** Field name transformations */
  fieldTransforms: FieldTransform[];
}

/**
 * Field transformation configuration
 */
export interface FieldTransform {
  /** Source field name */
  sourceField: string;
  
  /** Target field name */
  targetField: string;
  
  /** Transformation type */
  transform: 'rename' | 'format' | 'calculate' | 'hide';
  
  /** Transform parameters */
  parameters?: Record<string, any>;
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  /** Enable pagination */
  enabled: boolean;
  
  /** Default page size */
  defaultPageSize: number;
  
  /** Maximum page size */
  maxPageSize: number;
  
  /** Pagination style */
  style: 'offset' | 'cursor' | 'page';
  
  /** Include total count */
  includeTotal: boolean;
}

/**
 * Filtering configuration
 */
export interface FilteringConfig {
  /** Enable filtering */
  enabled: boolean;
  
  /** Allowed filter operators */
  allowedOperators: FilterOperator[];
  
  /** Filterable fields */
  filterableFields: string[];
  
  /** Custom filter functions */
  customFilters: CustomFilter[];
}

/**
 * Filter operator enumeration
 */
export type FilterOperator = 
  | 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'like' | 'ilike' | 'in' | 'nin' | 'between'
  | 'is_null' | 'is_not_null' | 'starts_with'
  | 'ends_with' | 'contains' | 'not_contains';

/**
 * Custom filter configuration
 */
export interface CustomFilter {
  /** Filter name */
  name: string;
  
  /** Filter description */
  description: string;
  
  /** Filter function/expression */
  expression: string;
  
  /** Filter parameters */
  parameters: CustomFilterParam[];
}

/**
 * Custom filter parameter
 */
export interface CustomFilterParam {
  /** Parameter name */
  name: string;
  
  /** Parameter type */
  type: string;
  
  /** Whether parameter is required */
  required: boolean;
  
  /** Default value */
  defaultValue?: any;
}

/**
 * Sorting configuration
 */
export interface SortingConfig {
  /** Enable sorting */
  enabled: boolean;
  
  /** Sortable fields */
  sortableFields: string[];
  
  /** Default sort order */
  defaultSort?: SortOrder[];
  
  /** Maximum sort fields */
  maxSortFields: number;
}

/**
 * Sort order configuration
 */
export interface SortOrder {
  /** Field name */
  field: string;
  
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Table custom settings
 */
export interface TableCustomSettings {
  /** Custom table alias */
  alias?: string;
  
  /** Table tags */
  tags: string[];
  
  /** Table category */
  category?: string;
  
  /** Custom permissions */
  permissions: Record<string, boolean>;
  
  /** Additional metadata */
  metadata: Record<string, any>;
}

/**
 * Field validation configuration
 */
export interface FieldValidationConfig {
  /** Minimum value */
  min?: number;
  
  /** Maximum value */
  max?: number;
  
  /** Minimum length */
  minLength?: number;
  
  /** Maximum length */
  maxLength?: number;
  
  /** Regular expression pattern */
  pattern?: string;
  
  /** Enumerated values */
  enum?: string[];
  
  /** Custom validation function */
  customValidator?: string;
  
  /** Validation error message */
  errorMessage?: string;
}

/**
 * Table filter configuration
 */
export interface TableFilter {
  /** Table name search */
  searchTerm?: string;
  
  /** Show only tables with primary keys */
  primaryKeyOnly: boolean;
  
  /** Show only tables with foreign keys */
  foreignKeyOnly: boolean;
  
  /** Minimum row count filter */
  minRowCount?: number;
  
  /** Maximum row count filter */
  maxRowCount?: number;
  
  /** Table categories filter */
  categories: string[];
  
  /** Table tags filter */
  tags: string[];
  
  /** Hide system tables */
  hideSystemTables: boolean;
  
  /** Hide empty tables */
  hideEmptyTables: boolean;
}

/**
 * Bulk selection state
 */
export interface BulkSelectionState {
  /** Select all tables */
  selectAll: boolean;
  
  /** Select all fields for selected tables */
  selectAllFields: boolean;
  
  /** Bulk operation in progress */
  bulkOperationInProgress: boolean;
  
  /** Last bulk operation result */
  lastBulkOperation?: BulkOperationResult;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  /** Operation type */
  operation: 'select' | 'deselect' | 'configure' | 'validate';
  
  /** Number of affected tables */
  affectedTables: number;
  
  /** Success status */
  success: boolean;
  
  /** Error message if failed */
  error?: string;
  
  /** Operation timestamp */
  timestamp: number;
}

/**
 * Table metadata
 */
export interface TableMetadata {
  /** Table name */
  name: string;
  
  /** Estimated row count */
  rowCount: number;
  
  /** Table size estimate */
  sizeEstimate: string;
  
  /** Last modified timestamp */
  lastModified?: string;
  
  /** Table indexes */
  indexes: string[];
  
  /** Foreign key relationships */
  relationships: string[];
  
  /** Table constraints */
  constraints: string[];
  
  /** Additional metadata */
  additionalInfo: Record<string, any>;
}

/**
 * Table pagination state
 */
export interface TablePaginationState {
  /** Current page */
  currentPage: number;
  
  /** Page size */
  pageSize: number;
  
  /** Total items */
  totalItems: number;
  
  /** Total pages */
  totalPages: number;
  
  /** Has next page */
  hasNextPage: boolean;
  
  /** Has previous page */
  hasPreviousPage: boolean;
}

/**
 * Zod schema for table selection validation
 */
export const TableSelectionSchema = z.object({
  selectedTables: z.array(z.object({
    name: z.string().min(1, 'Table name is required'),
    schema: z.string().optional(),
    label: z.string().optional(),
    description: z.string().optional(),
    enabled: z.boolean(),
    priority: z.number().min(0).max(100),
    selectedFields: z.array(z.object({
      name: z.string().min(1, 'Field name is required'),
      type: z.string().min(1, 'Field type is required'),
      included: z.boolean(),
      readable: z.boolean(),
      writable: z.boolean(),
      required: z.boolean(),
      label: z.string().optional(),
      description: z.string().optional(),
      isPrimaryKey: z.boolean(),
      isForeignKey: z.boolean(),
    })).min(1, 'At least one field must be selected'),
    apiConfig: z.object({
      methods: z.object({
        get: z.boolean(),
        post: z.boolean(),
        put: z.boolean(),
        patch: z.boolean(),
        delete: z.boolean(),
      }),
      pathOverride: z.string().optional(),
    }),
  })).min(1, 'At least one table must be selected'),
  filter: z.object({
    searchTerm: z.string().optional(),
    primaryKeyOnly: z.boolean(),
    foreignKeyOnly: z.boolean(),
    hideSystemTables: z.boolean(),
    hideEmptyTables: z.boolean(),
  }),
});

/**
 * Table selection form data type
 */
export type TableSelectionFormData = z.infer<typeof TableSelectionSchema>;

// =============================================================================
// ENDPOINT CONFIGURATION TYPES
// =============================================================================

/**
 * Endpoint configuration step data
 */
export interface EndpointConfigurationData {
  /** Global endpoint settings */
  globalSettings: GlobalEndpointSettings;
  
  /** Per-table endpoint configurations */
  tableConfigurations: Map<string, TableEndpointConfig>;
  
  /** Custom endpoint definitions */
  customEndpoints: CustomEndpoint[];
  
  /** Middleware configurations */
  middlewareConfig: MiddlewareConfig[];
  
  /** Rate limiting configurations */
  rateLimiting: RateLimitingConfig;
  
  /** CORS configuration */
  corsConfig: CorsConfig;
  
  /** Caching configuration */
  cachingConfig: CachingConfig;
  
  /** Logging configuration */
  loggingConfig: LoggingConfig;
  
  /** Configuration validation results */
  validationResults: ConfigValidationResult[];
  
  /** Configuration loading state */
  loading: boolean;
  
  /** Configuration error */
  error: string | null;
}

/**
 * Global endpoint settings
 */
export interface GlobalEndpointSettings {
  /** Base API path */
  basePath: string;
  
  /** API version */
  version: string;
  
  /** Default response format */
  defaultResponseFormat: 'json' | 'xml' | 'csv';
  
  /** Enable OpenAPI documentation */
  enableDocumentation: boolean;
  
  /** Enable request logging */
  enableLogging: boolean;
  
  /** Enable response compression */
  enableCompression: boolean;
  
  /** Default pagination size */
  defaultPageSize: number;
  
  /** Maximum pagination size */
  maxPageSize: number;
  
  /** Request timeout in seconds */
  requestTimeout: number;
  
  /** Enable HTTPS only */
  httpsOnly: boolean;
}

/**
 * Table endpoint configuration
 */
export interface TableEndpointConfig {
  /** Table name */
  tableName: string;
  
  /** Endpoint path override */
  pathOverride?: string;
  
  /** Enabled HTTP methods */
  enabledMethods: Set<HttpMethod>;
  
  /** Method-specific configurations */
  methodConfigs: Map<HttpMethod, MethodConfig>;
  
  /** Custom query parameters */
  customQueryParams: CustomQueryParam[];
  
  /** Response transformations */
  responseTransforms: ResponseTransform[];
  
  /** Request validators */
  requestValidators: RequestValidator[];
  
  /** Custom business logic hooks */
  businessLogicHooks: BusinessLogicHook[];
  
  /** Endpoint metadata */
  metadata: EndpointMetadata;
}

/**
 * HTTP method enumeration
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Method-specific configuration
 */
export interface MethodConfig {
  /** HTTP method */
  method: HttpMethod;
  
  /** Method description */
  description: string;
  
  /** Request body schema */
  requestSchema?: Record<string, any>;
  
  /** Response schema */
  responseSchema?: Record<string, any>;
  
  /** Method-specific parameters */
  parameters: MethodParameter[];
  
  /** Success response codes */
  successCodes: number[];
  
  /** Error response codes */
  errorCodes: number[];
  
  /** Method tags for documentation */
  tags: string[];
  
  /** Whether method requires authentication */
  requiresAuth: boolean;
  
  /** Required permissions */
  requiredPermissions: string[];
}

/**
 * Method parameter configuration
 */
export interface MethodParameter {
  /** Parameter name */
  name: string;
  
  /** Parameter location */
  location: 'query' | 'path' | 'header' | 'body';
  
  /** Parameter type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  
  /** Parameter description */
  description: string;
  
  /** Whether parameter is required */
  required: boolean;
  
  /** Default value */
  defaultValue?: any;
  
  /** Parameter validation schema */
  validation?: Record<string, any>;
  
  /** Example values */
  examples?: any[];
}

/**
 * Response transformation configuration
 */
export interface ResponseTransform {
  /** Transform name */
  name: string;
  
  /** Transform description */
  description: string;
  
  /** Transform type */
  type: 'filter' | 'map' | 'reduce' | 'sort' | 'paginate' | 'custom';
  
  /** Transform parameters */
  parameters: Record<string, any>;
  
  /** Transform execution order */
  order: number;
  
  /** Whether transform is enabled */
  enabled: boolean;
  
  /** Transform conditions */
  conditions?: TransformCondition[];
}

/**
 * Transform condition
 */
export interface TransformCondition {
  /** Condition field */
  field: string;
  
  /** Condition operator */
  operator: string;
  
  /** Condition value */
  value: any;
}

/**
 * Request validator configuration
 */
export interface RequestValidator {
  /** Validator name */
  name: string;
  
  /** Validator description */
  description: string;
  
  /** Validation type */
  type: 'schema' | 'custom' | 'builtin';
  
  /** Validation schema/rules */
  rules: Record<string, any>;
  
  /** Error message template */
  errorMessage?: string;
  
  /** Whether validator is enabled */
  enabled: boolean;
  
  /** Validator execution order */
  order: number;
}

/**
 * Business logic hook configuration
 */
export interface BusinessLogicHook {
  /** Hook name */
  name: string;
  
  /** Hook description */
  description: string;
  
  /** Hook type */
  type: 'pre-process' | 'post-process' | 'error-handler' | 'custom';
  
  /** Hook execution point */
  executionPoint: 'before-validation' | 'after-validation' | 'before-database' | 'after-database' | 'before-response' | 'after-response';
  
  /** Hook function/script */
  function: string;
  
  /** Hook parameters */
  parameters: Record<string, any>;
  
  /** Whether hook is enabled */
  enabled: boolean;
  
  /** Hook execution order */
  order: number;
}

/**
 * Endpoint metadata
 */
export interface EndpointMetadata {
  /** Endpoint title */
  title: string;
  
  /** Endpoint description */
  description: string;
  
  /** Endpoint version */
  version: string;
  
  /** Endpoint tags */
  tags: string[];
  
  /** Endpoint author */
  author?: string;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Last modified timestamp */
  lastModified: string;
  
  /** Deprecation info */
  deprecated?: DeprecationInfo;
  
  /** External documentation links */
  externalDocs?: ExternalDocumentation[];
}

/**
 * Deprecation information
 */
export interface DeprecationInfo {
  /** Whether endpoint is deprecated */
  deprecated: boolean;
  
  /** Deprecation date */
  deprecationDate?: string;
  
  /** Removal date */
  removalDate?: string;
  
  /** Deprecation reason */
  reason?: string;
  
  /** Alternative endpoint */
  alternative?: string;
}

/**
 * External documentation
 */
export interface ExternalDocumentation {
  /** Documentation title */
  title: string;
  
  /** Documentation URL */
  url: string;
  
  /** Documentation description */
  description?: string;
}

/**
 * Custom endpoint definition
 */
export interface CustomEndpoint {
  /** Endpoint ID */
  id: string;
  
  /** Endpoint name */
  name: string;
  
  /** Endpoint path */
  path: string;
  
  /** HTTP method */
  method: HttpMethod;
  
  /** Endpoint description */
  description: string;
  
  /** Request handler */
  handler: string;
  
  /** Parameters */
  parameters: MethodParameter[];
  
  /** Request schema */
  requestSchema?: Record<string, any>;
  
  /** Response schema */
  responseSchema?: Record<string, any>;
  
  /** Security requirements */
  security: string[];
  
  /** Endpoint tags */
  tags: string[];
  
  /** Whether endpoint is enabled */
  enabled: boolean;
}

/**
 * Middleware configuration
 */
export interface MiddlewareConfig {
  /** Middleware name */
  name: string;
  
  /** Middleware description */
  description: string;
  
  /** Middleware type */
  type: 'authentication' | 'authorization' | 'validation' | 'transformation' | 'logging' | 'custom';
  
  /** Middleware configuration */
  config: Record<string, any>;
  
  /** Execution order */
  order: number;
  
  /** Whether middleware is enabled */
  enabled: boolean;
  
  /** Middleware conditions */
  conditions?: MiddlewareCondition[];
}

/**
 * Middleware condition
 */
export interface MiddlewareCondition {
  /** Condition type */
  type: 'path' | 'method' | 'header' | 'parameter' | 'custom';
  
  /** Condition pattern */
  pattern: string;
  
  /** Whether condition should match */
  shouldMatch: boolean;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitingConfig {
  /** Enable rate limiting */
  enabled: boolean;
  
  /** Default rate limits */
  defaultLimits: RateLimit;
  
  /** Per-endpoint rate limits */
  endpointLimits: Map<string, RateLimit>;
  
  /** Per-user rate limits */
  userLimits: Map<string, RateLimit>;
  
  /** Rate limit storage backend */
  storage: 'memory' | 'redis' | 'database';
  
  /** Rate limit headers */
  includeHeaders: boolean;
}

/**
 * Rate limit definition
 */
export interface RateLimit {
  /** Requests per time window */
  requests: number;
  
  /** Time window in seconds */
  window: number;
  
  /** Rate limit message */
  message?: string;
  
  /** Rate limit metadata */
  metadata?: Record<string, any>;
}

/**
 * CORS configuration
 */
export interface CorsConfig {
  /** Enable CORS */
  enabled: boolean;
  
  /** Allowed origins */
  allowedOrigins: string[];
  
  /** Allowed methods */
  allowedMethods: HttpMethod[];
  
  /** Allowed headers */
  allowedHeaders: string[];
  
  /** Exposed headers */
  exposedHeaders: string[];
  
  /** Allow credentials */
  allowCredentials: boolean;
  
  /** Preflight cache duration */
  maxAge: number;
}

/**
 * Caching configuration
 */
export interface CachingConfig {
  /** Enable caching */
  enabled: boolean;
  
  /** Default cache TTL in seconds */
  defaultTtl: number;
  
  /** Per-endpoint cache settings */
  endpointSettings: Map<string, CacheSettings>;
  
  /** Cache storage backend */
  storage: 'memory' | 'redis' | 'database';
  
  /** Cache invalidation strategy */
  invalidationStrategy: 'manual' | 'automatic' | 'time-based';
}

/**
 * Cache settings
 */
export interface CacheSettings {
  /** Whether caching is enabled */
  enabled: boolean;
  
  /** Cache TTL in seconds */
  ttl: number;
  
  /** Cache key pattern */
  keyPattern?: string;
  
  /** Cache conditions */
  conditions?: CacheCondition[];
  
  /** Cache tags */
  tags: string[];
}

/**
 * Cache condition
 */
export interface CacheCondition {
  /** Condition field */
  field: string;
  
  /** Condition operator */
  operator: string;
  
  /** Condition value */
  value: any;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /** Enable request logging */
  enabled: boolean;
  
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';
  
  /** Log format */
  format: 'json' | 'text' | 'combined';
  
  /** Include request body */
  includeRequestBody: boolean;
  
  /** Include response body */
  includeResponseBody: boolean;
  
  /** Include headers */
  includeHeaders: boolean;
  
  /** Log retention days */
  retentionDays: number;
  
  /** Log storage backend */
  storage: 'file' | 'database' | 'external';
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  /** Validation target */
  target: string;
  
  /** Validation success */
  success: boolean;
  
  /** Validation errors */
  errors: ValidationError[];
  
  /** Validation warnings */
  warnings: ValidationWarning[];
  
  /** Validation timestamp */
  timestamp: string;
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Error field path */
  field?: string;
  
  /** Error severity */
  severity: 'error' | 'warning' | 'info';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;
  
  /** Warning message */
  message: string;
  
  /** Warning field path */
  field?: string;
  
  /** Warning details */
  details?: string;
}

/**
 * Zod schema for endpoint configuration validation
 */
export const EndpointConfigurationSchema = z.object({
  globalSettings: z.object({
    basePath: z.string().min(1, 'Base path is required'),
    version: z.string().min(1, 'API version is required'),
    defaultResponseFormat: z.enum(['json', 'xml', 'csv']),
    enableDocumentation: z.boolean(),
    enableLogging: z.boolean(),
    enableCompression: z.boolean(),
    defaultPageSize: z.number().min(1).max(1000),
    maxPageSize: z.number().min(1).max(10000),
    requestTimeout: z.number().min(1).max(300),
    httpsOnly: z.boolean(),
  }),
  customEndpoints: z.array(z.object({
    id: z.string().min(1, 'Endpoint ID is required'),
    name: z.string().min(1, 'Endpoint name is required'),
    path: z.string().min(1, 'Endpoint path is required'),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']),
    description: z.string().min(1, 'Endpoint description is required'),
    handler: z.string().min(1, 'Handler is required'),
    enabled: z.boolean(),
  })),
  rateLimiting: z.object({
    enabled: z.boolean(),
    defaultLimits: z.object({
      requests: z.number().min(1),
      window: z.number().min(1),
    }),
  }),
  corsConfig: z.object({
    enabled: z.boolean(),
    allowedOrigins: z.array(z.string()),
    allowedMethods: z.array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])),
    allowCredentials: z.boolean(),
    maxAge: z.number().min(0),
  }),
});

/**
 * Endpoint configuration form data type
 */
export type EndpointConfigurationFormData = z.infer<typeof EndpointConfigurationSchema>;

// =============================================================================
// SECURITY CONFIGURATION TYPES
// =============================================================================

/**
 * Security configuration step data
 */
export interface SecurityConfigurationData {
  /** Authentication settings */
  authenticationConfig: AuthenticationConfig;
  
  /** Authorization settings */
  authorizationConfig: AuthorizationConfig;
  
  /** API key management */
  apiKeyConfig: ApiKeyConfig;
  
  /** Role-based access control */
  rbacConfig: RbacConfig;
  
  /** Endpoint-level security rules */
  endpointSecurity: Map<string, EndpointSecurityConfig>;
  
  /** Security middleware */
  securityMiddleware: SecurityMiddleware[];
  
  /** Encryption settings */
  encryptionConfig: EncryptionConfig;
  
  /** Audit logging configuration */
  auditConfig: AuditConfig;
  
  /** Security validation results */
  validationResults: SecurityValidationResult[];
  
  /** Security loading state */
  loading: boolean;
  
  /** Security error */
  error: string | null;
}

/**
 * Authentication configuration
 */
export interface AuthenticationConfig {
  /** Enable authentication */
  enabled: boolean;
  
  /** Authentication methods */
  methods: AuthenticationMethod[];
  
  /** Session configuration */
  sessionConfig: SessionConfig;
  
  /** Token configuration */
  tokenConfig: TokenConfig;
  
  /** Multi-factor authentication */
  mfaConfig: MfaConfig;
  
  /** Password policy */
  passwordPolicy: PasswordPolicy;
  
  /** Account lockout policy */
  lockoutPolicy: LockoutPolicy;
}

/**
 * Authentication method
 */
export interface AuthenticationMethod {
  /** Method type */
  type: 'password' | 'api-key' | 'oauth' | 'jwt' | 'saml' | 'ldap';
  
  /** Method name */
  name: string;
  
  /** Method description */
  description: string;
  
  /** Whether method is enabled */
  enabled: boolean;
  
  /** Method configuration */
  config: Record<string, any>;
  
  /** Method priority */
  priority: number;
}

/**
 * Session configuration
 */
export interface SessionConfig {
  /** Session timeout in minutes */
  timeout: number;
  
  /** Enable session renewal */
  enableRenewal: boolean;
  
  /** Session storage */
  storage: 'memory' | 'database' | 'redis';
  
  /** Session cookie settings */
  cookieSettings: CookieSettings;
  
  /** Concurrent session limit */
  concurrentSessions: number;
}

/**
 * Cookie settings
 */
export interface CookieSettings {
  /** Cookie name */
  name: string;
  
  /** Cookie domain */
  domain?: string;
  
  /** Cookie path */
  path: string;
  
  /** Secure cookie flag */
  secure: boolean;
  
  /** HTTP only flag */
  httpOnly: boolean;
  
  /** Same site policy */
  sameSite: 'strict' | 'lax' | 'none';
}

/**
 * Token configuration
 */
export interface TokenConfig {
  /** Token type */
  type: 'jwt' | 'opaque' | 'custom';
  
  /** Token expiration in minutes */
  expiration: number;
  
  /** Enable token refresh */
  enableRefresh: boolean;
  
  /** Refresh token expiration in days */
  refreshExpiration: number;
  
  /** Token signing algorithm */
  signingAlgorithm: string;
  
  /** Token secret/key */
  secret: string;
  
  /** Token issuer */
  issuer?: string;
  
  /** Token audience */
  audience?: string;
}

/**
 * Multi-factor authentication configuration
 */
export interface MfaConfig {
  /** Enable MFA */
  enabled: boolean;
  
  /** MFA methods */
  methods: MfaMethod[];
  
  /** MFA requirement */
  requirement: 'optional' | 'required' | 'conditional';
  
  /** Bypass roles */
  bypassRoles: string[];
  
  /** MFA session duration */
  sessionDuration: number;
}

/**
 * MFA method
 */
export interface MfaMethod {
  /** Method type */
  type: 'totp' | 'sms' | 'email' | 'backup-codes' | 'hardware-key';
  
  /** Method name */
  name: string;
  
  /** Whether method is enabled */
  enabled: boolean;
  
  /** Method configuration */
  config: Record<string, any>;
}

/**
 * Password policy
 */
export interface PasswordPolicy {
  /** Minimum password length */
  minLength: number;
  
  /** Maximum password length */
  maxLength: number;
  
  /** Require uppercase letters */
  requireUppercase: boolean;
  
  /** Require lowercase letters */
  requireLowercase: boolean;
  
  /** Require numbers */
  requireNumbers: boolean;
  
  /** Require special characters */
  requireSpecialChars: boolean;
  
  /** Password history count */
  historyCount: number;
  
  /** Password expiration in days */
  expirationDays: number;
  
  /** Forbidden passwords */
  forbiddenPasswords: string[];
}

/**
 * Account lockout policy
 */
export interface LockoutPolicy {
  /** Enable account lockout */
  enabled: boolean;
  
  /** Failed attempts threshold */
  failedAttempts: number;
  
  /** Lockout duration in minutes */
  lockoutDuration: number;
  
  /** Reset lockout counter after success */
  resetOnSuccess: boolean;
  
  /** Notify on lockout */
  notifyOnLockout: boolean;
}

/**
 * Authorization configuration
 */
export interface AuthorizationConfig {
  /** Enable authorization */
  enabled: boolean;
  
  /** Authorization model */
  model: 'rbac' | 'abac' | 'custom';
  
  /** Default permissions */
  defaultPermissions: string[];
  
  /** Permission inheritance */
  inheritanceEnabled: boolean;
  
  /** Permission caching */
  cachingEnabled: boolean;
  
  /** Cache TTL in minutes */
  cacheTtl: number;
}

/**
 * API key configuration
 */
export interface ApiKeyConfig {
  /** Enable API keys */
  enabled: boolean;
  
  /** Key generation settings */
  generationSettings: KeyGenerationSettings;
  
  /** Key validation settings */
  validationSettings: KeyValidationSettings;
  
  /** Key management policies */
  managementPolicies: KeyManagementPolicies;
  
  /** Key usage tracking */
  usageTracking: KeyUsageTracking;
}

/**
 * Key generation settings
 */
export interface KeyGenerationSettings {
  /** Key length */
  keyLength: number;
  
  /** Key format */
  keyFormat: 'hex' | 'base64' | 'uuid' | 'custom';
  
  /** Key prefix */
  keyPrefix?: string;
  
  /** Key suffix */
  keySuffix?: string;
  
  /** Character set */
  characterSet: 'alphanumeric' | 'hex' | 'base64' | 'custom';
  
  /** Custom character set */
  customCharacterSet?: string;
}

/**
 * Key validation settings
 */
export interface KeyValidationSettings {
  /** Key expiration check */
  checkExpiration: boolean;
  
  /** Key status check */
  checkStatus: boolean;
  
  /** Key permissions check */
  checkPermissions: boolean;
  
  /** Rate limit check */
  checkRateLimit: boolean;
  
  /** IP restriction check */
  checkIpRestrictions: boolean;
}

/**
 * Key management policies
 */
export interface KeyManagementPolicies {
  /** Default expiration in days */
  defaultExpiration: number;
  
  /** Maximum keys per user */
  maxKeysPerUser: number;
  
  /** Auto-renewal enabled */
  autoRenewalEnabled: boolean;
  
  /** Renewal notification days */
  renewalNotificationDays: number;
  
  /** Inactive key cleanup days */
  inactiveCleanupDays: number;
}

/**
 * Key usage tracking
 */
export interface KeyUsageTracking {
  /** Enable usage tracking */
  enabled: boolean;
  
  /** Track request count */
  trackRequestCount: boolean;
  
  /** Track data transfer */
  trackDataTransfer: boolean;
  
  /** Track endpoints accessed */
  trackEndpoints: boolean;
  
  /** Track client IPs */
  trackClientIps: boolean;
  
  /** Retention period in days */
  retentionDays: number;
}

/**
 * RBAC configuration
 */
export interface RbacConfig {
  /** Enable RBAC */
  enabled: boolean;
  
  /** Roles configuration */
  roles: Role[];
  
  /** Permissions configuration */
  permissions: Permission[];
  
  /** Role hierarchy */
  hierarchy: RoleHierarchy[];
  
  /** Default role */
  defaultRole?: string;
  
  /** Role assignment policies */
  assignmentPolicies: RoleAssignmentPolicy[];
}

/**
 * Role definition
 */
export interface Role {
  /** Role ID */
  id: string;
  
  /** Role name */
  name: string;
  
  /** Role description */
  description: string;
  
  /** Role permissions */
  permissions: string[];
  
  /** Whether role is active */
  active: boolean;
  
  /** Role metadata */
  metadata: Record<string, any>;
  
  /** Role creation date */
  createdAt: string;
  
  /** Role last modified date */
  lastModified: string;
}

/**
 * Permission definition
 */
export interface Permission {
  /** Permission ID */
  id: string;
  
  /** Permission name */
  name: string;
  
  /** Permission description */
  description: string;
  
  /** Permission resource */
  resource: string;
  
  /** Permission action */
  action: string;
  
  /** Permission conditions */
  conditions?: PermissionCondition[];
  
  /** Whether permission is active */
  active: boolean;
}

/**
 * Permission condition
 */
export interface PermissionCondition {
  /** Condition field */
  field: string;
  
  /** Condition operator */
  operator: string;
  
  /** Condition value */
  value: any;
}

/**
 * Role hierarchy
 */
export interface RoleHierarchy {
  /** Parent role */
  parentRole: string;
  
  /** Child role */
  childRole: string;
  
  /** Inheritance type */
  inheritanceType: 'full' | 'partial' | 'conditional';
  
  /** Inheritance conditions */
  conditions?: Record<string, any>;
}

/**
 * Role assignment policy
 */
export interface RoleAssignmentPolicy {
  /** Policy name */
  name: string;
  
  /** Policy description */
  description: string;
  
  /** Policy conditions */
  conditions: PolicyCondition[];
  
  /** Target roles */
  targetRoles: string[];
  
  /** Policy action */
  action: 'assign' | 'deny' | 'require-approval';
  
  /** Whether policy is active */
  active: boolean;
}

/**
 * Policy condition
 */
export interface PolicyCondition {
  /** Condition type */
  type: 'user-attribute' | 'group-membership' | 'time-based' | 'ip-based' | 'custom';
  
  /** Condition field */
  field: string;
  
  /** Condition operator */
  operator: string;
  
  /** Condition value */
  value: any;
}

/**
 * Endpoint security configuration
 */
export interface EndpointSecurityConfig {
  /** Endpoint path */
  endpoint: string;
  
  /** HTTP method */
  method: HttpMethod;
  
  /** Authentication required */
  authenticationRequired: boolean;
  
  /** Required permissions */
  requiredPermissions: string[];
  
  /** Required roles */
  requiredRoles: string[];
  
  /** IP restrictions */
  ipRestrictions: IpRestriction[];
  
  /** Rate limits */
  rateLimits: RateLimit[];
  
  /** Custom security rules */
  customRules: CustomSecurityRule[];
  
  /** Security metadata */
  metadata: Record<string, any>;
}

/**
 * IP restriction
 */
export interface IpRestriction {
  /** Restriction type */
  type: 'allow' | 'deny';
  
  /** IP address or CIDR */
  ip: string;
  
  /** Restriction description */
  description?: string;
  
  /** Whether restriction is active */
  active: boolean;
}

/**
 * Custom security rule
 */
export interface CustomSecurityRule {
  /** Rule name */
  name: string;
  
  /** Rule description */
  description: string;
  
  /** Rule type */
  type: 'pre-auth' | 'post-auth' | 'pre-process' | 'post-process';
  
  /** Rule function */
  function: string;
  
  /** Rule parameters */
  parameters: Record<string, any>;
  
  /** Whether rule is enabled */
  enabled: boolean;
  
  /** Rule execution order */
  order: number;
}

/**
 * Security middleware
 */
export interface SecurityMiddleware {
  /** Middleware name */
  name: string;
  
  /** Middleware type */
  type: 'authentication' | 'authorization' | 'validation' | 'encryption' | 'audit';
  
  /** Middleware configuration */
  config: Record<string, any>;
  
  /** Execution order */
  order: number;
  
  /** Whether middleware is enabled */
  enabled: boolean;
  
  /** Middleware conditions */
  conditions?: MiddlewareCondition[];
}

/**
 * Encryption configuration
 */
export interface EncryptionConfig {
  /** Enable encryption */
  enabled: boolean;
  
  /** Encryption algorithm */
  algorithm: string;
  
  /** Key management */
  keyManagement: KeyManagementConfig;
  
  /** Data encryption settings */
  dataEncryption: DataEncryptionConfig;
  
  /** Transport encryption settings */
  transportEncryption: TransportEncryptionConfig;
}

/**
 * Key management configuration
 */
export interface KeyManagementConfig {
  /** Key storage */
  storage: 'local' | 'hsm' | 'kms' | 'vault';
  
  /** Key rotation enabled */
  rotationEnabled: boolean;
  
  /** Key rotation interval in days */
  rotationInterval: number;
  
  /** Key backup enabled */
  backupEnabled: boolean;
  
  /** Key recovery enabled */
  recoveryEnabled: boolean;
}

/**
 * Data encryption configuration
 */
export interface DataEncryptionConfig {
  /** Encrypt at rest */
  encryptAtRest: boolean;
  
  /** Encrypt in transit */
  encryptInTransit: boolean;
  
  /** Encrypted fields */
  encryptedFields: string[];
  
  /** Encryption key per field */
  fieldKeyMapping: Record<string, string>;
}

/**
 * Transport encryption configuration
 */
export interface TransportEncryptionConfig {
  /** Force HTTPS */
  forceHttps: boolean;
  
  /** TLS version */
  tlsVersion: string;
  
  /** Cipher suites */
  cipherSuites: string[];
  
  /** Certificate validation */
  certificateValidation: boolean;
}

/**
 * Audit configuration
 */
export interface AuditConfig {
  /** Enable auditing */
  enabled: boolean;
  
  /** Audit events */
  events: AuditEvent[];
  
  /** Audit log format */
  logFormat: 'json' | 'xml' | 'text';
  
  /** Audit log storage */
  storage: 'database' | 'file' | 'external';
  
  /** Audit log retention */
  retention: AuditRetention;
  
  /** Real-time alerting */
  alerting: AuditAlerting;
}

/**
 * Audit event configuration
 */
export interface AuditEvent {
  /** Event type */
  type: 'authentication' | 'authorization' | 'data-access' | 'configuration' | 'custom';
  
  /** Event name */
  name: string;
  
  /** Event description */
  description: string;
  
  /** Whether event is enabled */
  enabled: boolean;
  
  /** Event severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  /** Event metadata */
  metadata: Record<string, any>;
}

/**
 * Audit retention configuration
 */
export interface AuditRetention {
  /** Retention period in days */
  retentionDays: number;
  
  /** Archive after days */
  archiveAfterDays: number;
  
  /** Archive location */
  archiveLocation?: string;
  
  /** Compression enabled */
  compressionEnabled: boolean;
}

/**
 * Audit alerting configuration
 */
export interface AuditAlerting {
  /** Enable alerting */
  enabled: boolean;
  
  /** Alert conditions */
  conditions: AlertCondition[];
  
  /** Alert channels */
  channels: AlertChannel[];
  
  /** Alert rate limiting */
  rateLimiting: AlertRateLimiting;
}

/**
 * Alert condition
 */
export interface AlertCondition {
  /** Condition name */
  name: string;
  
  /** Event type to monitor */
  eventType: string;
  
  /** Threshold value */
  threshold: number;
  
  /** Time window in minutes */
  timeWindow: number;
  
  /** Condition operator */
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  
  /** Whether condition is enabled */
  enabled: boolean;
}

/**
 * Alert channel
 */
export interface AlertChannel {
  /** Channel type */
  type: 'email' | 'sms' | 'webhook' | 'slack' | 'teams';
  
  /** Channel name */
  name: string;
  
  /** Channel configuration */
  config: Record<string, any>;
  
  /** Whether channel is enabled */
  enabled: boolean;
}

/**
 * Alert rate limiting
 */
export interface AlertRateLimiting {
  /** Enable rate limiting */
  enabled: boolean;
  
  /** Maximum alerts per hour */
  maxAlertsPerHour: number;
  
  /** Alert cooldown in minutes */
  cooldownMinutes: number;
  
  /** Group similar alerts */
  groupSimilar: boolean;
}

/**
 * Security validation result
 */
export interface SecurityValidationResult {
  /** Validation target */
  target: string;
  
  /** Validation type */
  type: 'authentication' | 'authorization' | 'encryption' | 'audit' | 'general';
  
  /** Validation success */
  success: boolean;
  
  /** Security score */
  score: number;
  
  /** Validation findings */
  findings: SecurityFinding[];
  
  /** Validation timestamp */
  timestamp: string;
}

/**
 * Security finding
 */
export interface SecurityFinding {
  /** Finding ID */
  id: string;
  
  /** Finding type */
  type: 'vulnerability' | 'misconfiguration' | 'weakness' | 'best-practice';
  
  /** Finding severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  /** Finding title */
  title: string;
  
  /** Finding description */
  description: string;
  
  /** Remediation steps */
  remediation?: string;
  
  /** Finding references */
  references?: string[];
}

/**
 * Zod schema for security configuration validation
 */
export const SecurityConfigurationSchema = z.object({
  authenticationConfig: z.object({
    enabled: z.boolean(),
    methods: z.array(z.object({
      type: z.enum(['password', 'api-key', 'oauth', 'jwt', 'saml', 'ldap']),
      name: z.string().min(1, 'Method name is required'),
      enabled: z.boolean(),
      priority: z.number().min(0),
    })),
    sessionConfig: z.object({
      timeout: z.number().min(1).max(1440),
      enableRenewal: z.boolean(),
      storage: z.enum(['memory', 'database', 'redis']),
      concurrentSessions: z.number().min(1),
    }),
  }),
  authorizationConfig: z.object({
    enabled: z.boolean(),
    model: z.enum(['rbac', 'abac', 'custom']),
    defaultPermissions: z.array(z.string()),
    inheritanceEnabled: z.boolean(),
    cachingEnabled: z.boolean(),
    cacheTtl: z.number().min(1),
  }),
  apiKeyConfig: z.object({
    enabled: z.boolean(),
    generationSettings: z.object({
      keyLength: z.number().min(16).max(128),
      keyFormat: z.enum(['hex', 'base64', 'uuid', 'custom']),
      keyPrefix: z.string().optional(),
    }),
    managementPolicies: z.object({
      defaultExpiration: z.number().min(1),
      maxKeysPerUser: z.number().min(1),
      autoRenewalEnabled: z.boolean(),
    }),
  }),
  encryptionConfig: z.object({
    enabled: z.boolean(),
    algorithm: z.string().min(1, 'Encryption algorithm is required'),
    keyManagement: z.object({
      storage: z.enum(['local', 'hsm', 'kms', 'vault']),
      rotationEnabled: z.boolean(),
      rotationInterval: z.number().min(1),
    }),
  }),
  auditConfig: z.object({
    enabled: z.boolean(),
    logFormat: z.enum(['json', 'xml', 'text']),
    storage: z.enum(['database', 'file', 'external']),
    retention: z.object({
      retentionDays: z.number().min(1),
      archiveAfterDays: z.number().min(1),
      compressionEnabled: z.boolean(),
    }),
  }),
});

/**
 * Security configuration form data type
 */
export type SecurityConfigurationFormData = z.infer<typeof SecurityConfigurationSchema>;

// =============================================================================
// GENERATION PREVIEW TYPES
// =============================================================================

/**
 * Generation preview step data
 */
export interface GenerationPreviewData {
  /** Generated endpoint summaries */
  endpointSummaries: EndpointSummary[];
  
  /** OpenAPI specification preview */
  openApiSpec: OpenApiSpecification;
  
  /** Generated code samples */
  codeSamples: CodeSample[];
  
  /** API documentation preview */
  documentationPreview: DocumentationPreview;
  
  /** Security summary */
  securitySummary: SecuritySummary;
  
  /** Performance estimations */
  performanceEstimations: PerformanceEstimation[];
  
  /** Validation results */
  validationResults: PreviewValidationResult[];
  
  /** Generation statistics */
  statistics: GenerationStatistics;
  
  /** Preview loading state */
  loading: boolean;
  
  /** Preview error */
  error: string | null;
  
  /** Last preview generation timestamp */
  lastGenerated: string;
  
  /** Preview configuration */
  previewConfig: PreviewConfig;
}

/**
 * Endpoint summary
 */
export interface EndpointSummary {
  /** Endpoint path */
  path: string;
  
  /** HTTP method */
  method: HttpMethod;
  
  /** Endpoint description */
  description: string;
  
  /** Associated table */
  table: string;
  
  /** Operation type */
  operationType: 'create' | 'read' | 'update' | 'delete' | 'list' | 'custom';
  
  /** Request parameters */
  parameters: ParameterSummary[];
  
  /** Response schema summary */
  responseSchema: SchemaSummary;
  
  /** Security requirements */
  security: string[];
  
  /** Tags */
  tags: string[];
  
  /** Whether endpoint is enabled */
  enabled: boolean;
  
  /** Estimated response time */
  estimatedResponseTime: number;
  
  /** Complexity score */
  complexityScore: number;
}

/**
 * Parameter summary
 */
export interface ParameterSummary {
  /** Parameter name */
  name: string;
  
  /** Parameter location */
  location: 'query' | 'path' | 'header' | 'body';
  
  /** Parameter type */
  type: string;
  
  /** Whether parameter is required */
  required: boolean;
  
  /** Parameter description */
  description: string;
  
  /** Example value */
  example?: any;
}

/**
 * Schema summary
 */
export interface SchemaSummary {
  /** Schema type */
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  
  /** Schema properties */
  properties: PropertySummary[];
  
  /** Schema description */
  description: string;
  
  /** Example data */
  example?: any;
}

/**
 * Property summary
 */
export interface PropertySummary {
  /** Property name */
  name: string;
  
  /** Property type */
  type: string;
  
  /** Property format */
  format?: string;
  
  /** Whether property is required */
  required: boolean;
  
  /** Property description */
  description: string;
  
  /** Example value */
  example?: any;
}

/**
 * OpenAPI specification structure
 */
export interface OpenApiSpecification {
  /** OpenAPI version */
  openapi: string;
  
  /** API information */
  info: ApiInformation;
  
  /** Server configurations */
  servers: ServerConfig[];
  
  /** API paths */
  paths: Record<string, PathItem>;
  
  /** Reusable components */
  components: ComponentsObject;
  
  /** Security schemes */
  security: SecurityRequirement[];
  
  /** API tags */
  tags: TagObject[];
  
  /** External documentation */
  externalDocs?: ExternalDocumentation;
}

/**
 * API information
 */
export interface ApiInformation {
  /** API title */
  title: string;
  
  /** API description */
  description: string;
  
  /** API version */
  version: string;
  
  /** Terms of service */
  termsOfService?: string;
  
  /** Contact information */
  contact?: ContactObject;
  
  /** License information */
  license?: LicenseObject;
}

/**
 * Contact object
 */
export interface ContactObject {
  /** Contact name */
  name?: string;
  
  /** Contact URL */
  url?: string;
  
  /** Contact email */
  email?: string;
}

/**
 * License object
 */
export interface LicenseObject {
  /** License name */
  name: string;
  
  /** License URL */
  url?: string;
}

/**
 * Server configuration
 */
export interface ServerConfig {
  /** Server URL */
  url: string;
  
  /** Server description */
  description?: string;
  
  /** Server variables */
  variables?: Record<string, ServerVariable>;
}

/**
 * Server variable
 */
export interface ServerVariable {
  /** Variable enum values */
  enum?: string[];
  
  /** Default value */
  default: string;
  
  /** Variable description */
  description?: string;
}

/**
 * Path item object
 */
export interface PathItem {
  /** GET operation */
  get?: OperationObject;
  
  /** POST operation */
  post?: OperationObject;
  
  /** PUT operation */
  put?: OperationObject;
  
  /** PATCH operation */
  patch?: OperationObject;
  
  /** DELETE operation */
  delete?: OperationObject;
  
  /** OPTIONS operation */
  options?: OperationObject;
  
  /** HEAD operation */
  head?: OperationObject;
  
  /** TRACE operation */
  trace?: OperationObject;
  
  /** Path parameters */
  parameters?: ParameterObject[];
  
  /** Path description */
  description?: string;
  
  /** Path summary */
  summary?: string;
}

/**
 * Operation object
 */
export interface OperationObject {
  /** Operation ID */
  operationId: string;
  
  /** Operation summary */
  summary?: string;
  
  /** Operation description */
  description?: string;
  
  /** Operation tags */
  tags?: string[];
  
  /** Operation parameters */
  parameters?: ParameterObject[];
  
  /** Request body */
  requestBody?: RequestBodyObject;
  
  /** Responses */
  responses: Record<string, ResponseObject>;
  
  /** Security requirements */
  security?: SecurityRequirement[];
  
  /** Whether operation is deprecated */
  deprecated?: boolean;
}

/**
 * Parameter object
 */
export interface ParameterObject {
  /** Parameter name */
  name: string;
  
  /** Parameter location */
  in: 'query' | 'header' | 'path' | 'cookie';
  
  /** Parameter description */
  description?: string;
  
  /** Whether parameter is required */
  required?: boolean;
  
  /** Whether parameter is deprecated */
  deprecated?: boolean;
  
  /** Parameter schema */
  schema?: SchemaObject;
  
  /** Parameter example */
  example?: any;
  
  /** Parameter examples */
  examples?: Record<string, ExampleObject>;
}

/**
 * Request body object
 */
export interface RequestBodyObject {
  /** Request body description */
  description?: string;
  
  /** Request body content */
  content: Record<string, MediaTypeObject>;
  
  /** Whether request body is required */
  required?: boolean;
}

/**
 * Response object
 */
export interface ResponseObject {
  /** Response description */
  description: string;
  
  /** Response headers */
  headers?: Record<string, HeaderObject>;
  
  /** Response content */
  content?: Record<string, MediaTypeObject>;
}

/**
 * Media type object
 */
export interface MediaTypeObject {
  /** Media type schema */
  schema?: SchemaObject;
  
  /** Media type example */
  example?: any;
  
  /** Media type examples */
  examples?: Record<string, ExampleObject>;
}

/**
 * Schema object
 */
export interface SchemaObject {
  /** Schema type */
  type?: string;
  
  /** Schema format */
  format?: string;
  
  /** Schema title */
  title?: string;
  
  /** Schema description */
  description?: string;
  
  /** Schema properties */
  properties?: Record<string, SchemaObject>;
  
  /** Required properties */
  required?: string[];
  
  /** Array items schema */
  items?: SchemaObject;
  
  /** Schema example */
  example?: any;
  
  /** Schema enum values */
  enum?: any[];
  
  /** Schema default value */
  default?: any;
}

/**
 * Header object
 */
export interface HeaderObject {
  /** Header description */
  description?: string;
  
  /** Whether header is required */
  required?: boolean;
  
  /** Header schema */
  schema?: SchemaObject;
  
  /** Header example */
  example?: any;
}

/**
 * Example object
 */
export interface ExampleObject {
  /** Example summary */
  summary?: string;
  
  /** Example description */
  description?: string;
  
  /** Example value */
  value?: any;
  
  /** External example URL */
  externalValue?: string;
}

/**
 * Components object
 */
export interface ComponentsObject {
  /** Reusable schemas */
  schemas?: Record<string, SchemaObject>;
  
  /** Reusable parameters */
  parameters?: Record<string, ParameterObject>;
  
  /** Reusable request bodies */
  requestBodies?: Record<string, RequestBodyObject>;
  
  /** Reusable responses */
  responses?: Record<string, ResponseObject>;
  
  /** Reusable headers */
  headers?: Record<string, HeaderObject>;
  
  /** Reusable examples */
  examples?: Record<string, ExampleObject>;
  
  /** Security schemes */
  securitySchemes?: Record<string, SecuritySchemeObject>;
}

/**
 * Security scheme object
 */
export interface SecuritySchemeObject {
  /** Security scheme type */
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  
  /** Security scheme description */
  description?: string;
  
  /** API key name (for apiKey type) */
  name?: string;
  
  /** API key location (for apiKey type) */
  in?: 'query' | 'header' | 'cookie';
  
  /** HTTP scheme (for http type) */
  scheme?: string;
  
  /** Bearer format (for http type) */
  bearerFormat?: string;
  
  /** OAuth2 flows (for oauth2 type) */
  flows?: OAuthFlowsObject;
  
  /** OpenID Connect URL (for openIdConnect type) */
  openIdConnectUrl?: string;
}

/**
 * OAuth flows object
 */
export interface OAuthFlowsObject {
  /** Implicit flow */
  implicit?: OAuthFlowObject;
  
  /** Password flow */
  password?: OAuthFlowObject;
  
  /** Client credentials flow */
  clientCredentials?: OAuthFlowObject;
  
  /** Authorization code flow */
  authorizationCode?: OAuthFlowObject;
}

/**
 * OAuth flow object
 */
export interface OAuthFlowObject {
  /** Authorization URL */
  authorizationUrl?: string;
  
  /** Token URL */
  tokenUrl?: string;
  
  /** Refresh URL */
  refreshUrl?: string;
  
  /** Scopes */
  scopes: Record<string, string>;
}

/**
 * Security requirement
 */
export interface SecurityRequirement {
  /** Security scheme requirements */
  [name: string]: string[];
}

/**
 * Tag object
 */
export interface TagObject {
  /** Tag name */
  name: string;
  
  /** Tag description */
  description?: string;
  
  /** External documentation */
  externalDocs?: ExternalDocumentation;
}

/**
 * Code sample
 */
export interface CodeSample {
  /** Programming language */
  language: string;
  
  /** Code sample title */
  title: string;
  
  /** Code content */
  code: string;
  
  /** Code description */
  description: string;
  
  /** Sample endpoint */
  endpoint: string;
  
  /** Sample method */
  method: HttpMethod;
  
  /** Sample category */
  category: 'request' | 'response' | 'authentication' | 'error-handling' | 'complete-example';
  
  /** Code complexity */
  complexity: 'basic' | 'intermediate' | 'advanced';
}

/**
 * Documentation preview
 */
export interface DocumentationPreview {
  /** Documentation content */
  content: string;
  
  /** Documentation format */
  format: 'html' | 'markdown' | 'json';
  
  /** Documentation sections */
  sections: DocumentationSection[];
  
  /** Table of contents */
  tableOfContents: TocEntry[];
  
  /** Documentation metadata */
  metadata: DocumentationMetadata;
}

/**
 * Documentation section
 */
export interface DocumentationSection {
  /** Section ID */
  id: string;
  
  /** Section title */
  title: string;
  
  /** Section content */
  content: string;
  
  /** Section order */
  order: number;
  
  /** Section level */
  level: number;
  
  /** Section type */
  type: 'overview' | 'authentication' | 'endpoints' | 'schemas' | 'examples' | 'errors';
}

/**
 * Table of contents entry
 */
export interface TocEntry {
  /** Entry ID */
  id: string;
  
  /** Entry title */
  title: string;
  
  /** Entry level */
  level: number;
  
  /** Entry anchor */
  anchor: string;
  
  /** Child entries */
  children?: TocEntry[];
}

/**
 * Documentation metadata
 */
export interface DocumentationMetadata {
  /** Generation timestamp */
  generatedAt: string;
  
  /** Documentation version */
  version: string;
  
  /** Total pages */
  totalPages: number;
  
  /** Total endpoints */
  totalEndpoints: number;
  
  /** Total schemas */
  totalSchemas: number;
  
  /** Documentation size */
  size: string;
}

/**
 * Security summary
 */
export interface SecuritySummary {
  /** Authentication methods */
  authenticationMethods: string[];
  
  /** Authorization model */
  authorizationModel: string;
  
  /** Secured endpoints count */
  securedEndpoints: number;
  
  /** Public endpoints count */
  publicEndpoints: number;
  
  /** Security score */
  securityScore: number;
  
  /** Security recommendations */
  recommendations: SecurityRecommendation[];
  
  /** Compliance status */
  compliance: ComplianceStatus[];
}

/**
 * Security recommendation
 */
export interface SecurityRecommendation {
  /** Recommendation ID */
  id: string;
  
  /** Recommendation title */
  title: string;
  
  /** Recommendation description */
  description: string;
  
  /** Recommendation priority */
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  /** Recommendation category */
  category: 'authentication' | 'authorization' | 'encryption' | 'audit' | 'general';
  
  /** Implementation effort */
  effort: 'low' | 'medium' | 'high';
}

/**
 * Compliance status
 */
export interface ComplianceStatus {
  /** Compliance standard */
  standard: string;
  
  /** Compliance status */
  status: 'compliant' | 'partial' | 'non-compliant' | 'unknown';
  
  /** Compliance score */
  score: number;
  
  /** Required actions */
  requiredActions: string[];
}

/**
 * Performance estimation
 */
export interface PerformanceEstimation {
  /** Endpoint or operation */
  target: string;
  
  /** Estimated response time (ms) */
  responseTime: number;
  
  /** Estimated throughput (req/sec) */
  throughput: number;
  
  /** Memory usage estimate (MB) */
  memoryUsage: number;
  
  /** CPU usage estimate (%) */
  cpuUsage: number;
  
  /** Database queries count */
  databaseQueries: number;
  
  /** Cache hit ratio */
  cacheHitRatio: number;
  
  /** Performance recommendations */
  recommendations: PerformanceRecommendation[];
}

/**
 * Performance recommendation
 */
export interface PerformanceRecommendation {
  /** Recommendation type */
  type: 'caching' | 'indexing' | 'pagination' | 'optimization' | 'scaling';
  
  /** Recommendation description */
  description: string;
  
  /** Expected improvement */
  expectedImprovement: string;
  
  /** Implementation complexity */
  complexity: 'low' | 'medium' | 'high';
}

/**
 * Preview validation result
 */
export interface PreviewValidationResult {
  /** Validation target */
  target: string;
  
  /** Validation type */
  type: 'syntax' | 'semantic' | 'security' | 'performance' | 'compatibility';
  
  /** Validation success */
  success: boolean;
  
  /** Validation issues */
  issues: ValidationIssue[];
  
  /** Validation timestamp */
  timestamp: string;
}

/**
 * Validation issue
 */
export interface ValidationIssue {
  /** Issue code */
  code: string;
  
  /** Issue message */
  message: string;
  
  /** Issue severity */
  severity: 'error' | 'warning' | 'info';
  
  /** Issue location */
  location?: string;
  
  /** Suggested fix */
  suggestedFix?: string;
}

/**
 * Generation statistics
 */
export interface GenerationStatistics {
  /** Total endpoints generated */
  totalEndpoints: number;
  
  /** Endpoints by method */
  endpointsByMethod: Record<HttpMethod, number>;
  
  /** Endpoints by table */
  endpointsByTable: Record<string, number>;
  
  /** Total schemas generated */
  totalSchemas: number;
  
  /** Total security rules */
  totalSecurityRules: number;
  
  /** Generation time (ms) */
  generationTime: number;
  
  /** Estimated API size */
  estimatedApiSize: string;
  
  /** Complexity metrics */
  complexityMetrics: ComplexityMetrics;
}

/**
 * Complexity metrics
 */
export interface ComplexityMetrics {
  /** Overall complexity score */
  overallScore: number;
  
  /** Schema complexity */
  schemaComplexity: number;
  
  /** Endpoint complexity */
  endpointComplexity: number;
  
  /** Security complexity */
  securityComplexity: number;
  
  /** Maintainability score */
  maintainabilityScore: number;
}

/**
 * Preview configuration
 */
export interface PreviewConfig {
  /** Include code samples */
  includeCodeSamples: boolean;
  
  /** Include documentation */
  includeDocumentation: boolean;
  
  /** Include security analysis */
  includeSecurityAnalysis: boolean;
  
  /** Include performance analysis */
  includePerformanceAnalysis: boolean;
  
  /** Code sample languages */
  codeSampleLanguages: string[];
  
  /** Documentation format */
  documentationFormat: 'html' | 'markdown' | 'json';
  
  /** Preview detail level */
  detailLevel: 'basic' | 'detailed' | 'comprehensive';
}

/**
 * Zod schema for generation preview validation
 */
export const GenerationPreviewSchema = z.object({
  previewConfig: z.object({
    includeCodeSamples: z.boolean(),
    includeDocumentation: z.boolean(),
    includeSecurityAnalysis: z.boolean(),
    includePerformanceAnalysis: z.boolean(),
    codeSampleLanguages: z.array(z.string()),
    documentationFormat: z.enum(['html', 'markdown', 'json']),
    detailLevel: z.enum(['basic', 'detailed', 'comprehensive']),
  }),
  endpointSummaries: z.array(z.object({
    path: z.string().min(1, 'Endpoint path is required'),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']),
    description: z.string().min(1, 'Endpoint description is required'),
    table: z.string().min(1, 'Associated table is required'),
    enabled: z.boolean(),
  })),
  openApiSpec: z.object({
    openapi: z.string().min(1, 'OpenAPI version is required'),
    info: z.object({
      title: z.string().min(1, 'API title is required'),
      description: z.string().min(1, 'API description is required'),
      version: z.string().min(1, 'API version is required'),
    }),
  }),
});

/**
 * Generation preview form data type
 */
export type GenerationPreviewFormData = z.infer<typeof GenerationPreviewSchema>;

// =============================================================================
// GENERATION RESULT TYPES
// =============================================================================

/**
 * API generation result
 */
export interface GenerationResult {
  /** Generation success status */
  success: boolean;
  
  /** Generation message */
  message: string;
  
  /** Generated service information */
  serviceInfo: GeneratedServiceInfo;
  
  /** Generated endpoints */
  endpoints: GeneratedEndpoint[];
  
  /** Generated schemas */
  schemas: GeneratedSchema[];
  
  /** Security configurations applied */
  securityConfigurations: AppliedSecurityConfig[];
  
  /** Generation errors */
  errors: GenerationError[];
  
  /** Generation warnings */
  warnings: GenerationWarning[];
  
  /** Generation statistics */
  statistics: GenerationStatistics;
  
  /** Generation metadata */
  metadata: GenerationMetadata;
  
  /** Next steps recommendations */
  nextSteps: NextStepRecommendation[];
}

/**
 * Generated service information
 */
export interface GeneratedServiceInfo {
  /** Service ID */
  serviceId: number;
  
  /** Service name */
  serviceName: string;
  
  /** Service URL */
  serviceUrl: string;
  
  /** Service version */
  version: string;
  
  /** Service status */
  status: 'active' | 'inactive' | 'pending' | 'error';
  
  /** Service creation timestamp */
  createdAt: string;
  
  /** Service configuration */
  configuration: Record<string, any>;
}

/**
 * Generated endpoint
 */
export interface GeneratedEndpoint {
  /** Endpoint ID */
  id: string;
  
  /** Endpoint URL */
  url: string;
  
  /** HTTP method */
  method: HttpMethod;
  
  /** Endpoint description */
  description: string;
  
  /** Associated table */
  table: string;
  
  /** Endpoint status */
  status: 'active' | 'inactive' | 'error';
  
  /** Security applied */
  security: string[];
  
  /** Parameters */
  parameters: GeneratedParameter[];
  
  /** Response schema */
  responseSchema: GeneratedSchema;
  
  /** Request schema */
  requestSchema?: GeneratedSchema;
}

/**
 * Generated parameter
 */
export interface GeneratedParameter {
  /** Parameter name */
  name: string;
  
  /** Parameter type */
  type: string;
  
  /** Parameter location */
  location: 'query' | 'path' | 'header' | 'body';
  
  /** Whether parameter is required */
  required: boolean;
  
  /** Parameter description */
  description: string;
  
  /** Default value */
  defaultValue?: any;
}

/**
 * Generated schema
 */
export interface GeneratedSchema {
  /** Schema ID */
  id: string;
  
  /** Schema name */
  name: string;
  
  /** Schema type */
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  
  /** Schema properties */
  properties: GeneratedProperty[];
  
  /** Required properties */
  required: string[];
  
  /** Schema description */
  description: string;
}

/**
 * Generated property
 */
export interface GeneratedProperty {
  /** Property name */
  name: string;
  
  /** Property type */
  type: string;
  
  /** Property format */
  format?: string;
  
  /** Property description */
  description: string;
  
  /** Whether property is required */
  required: boolean;
  
  /** Property example */
  example?: any;
}

/**
 * Applied security configuration
 */
export interface AppliedSecurityConfig {
  /** Configuration type */
  type: 'authentication' | 'authorization' | 'encryption' | 'audit';
  
  /** Configuration name */
  name: string;
  
  /** Configuration description */
  description: string;
  
  /** Applied to endpoints */
  endpoints: string[];
  
  /** Configuration status */
  status: 'applied' | 'pending' | 'error';
  
  /** Configuration details */
  details: Record<string, any>;
}

/**
 * Generation error
 */
export interface GenerationError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Error context */
  context?: string;
  
  /** Error severity */
  severity: 'error' | 'critical';
  
  /** Error timestamp */
  timestamp: string;
  
  /** Suggested resolution */
  resolution?: string;
}

/**
 * Generation warning
 */
export interface GenerationWarning {
  /** Warning code */
  code: string;
  
  /** Warning message */
  message: string;
  
  /** Warning context */
  context?: string;
  
  /** Warning timestamp */
  timestamp: string;
  
  /** Suggested action */
  action?: string;
}

/**
 * Generation metadata
 */
export interface GenerationMetadata {
  /** Wizard session ID */
  sessionId: string;
  
  /** Generation timestamp */
  timestamp: string;
  
  /** Generation duration (ms) */
  duration: number;
  
  /** User information */
  user: {
    id: string;
    name: string;
    email: string;
  };
  
  /** Generation environment */
  environment: string;
  
  /** Version information */
  version: {
    wizard: string;
    api: string;
    system: string;
  };
}

/**
 * Next step recommendation
 */
export interface NextStepRecommendation {
  /** Recommendation ID */
  id: string;
  
  /** Recommendation title */
  title: string;
  
  /** Recommendation description */
  description: string;
  
  /** Recommendation category */
  category: 'testing' | 'documentation' | 'security' | 'optimization' | 'deployment';
  
  /** Recommendation priority */
  priority: 'low' | 'medium' | 'high';
  
  /** Estimated effort */
  effort: 'low' | 'medium' | 'high';
  
  /** Action URL */
  actionUrl?: string;
  
  /** Action text */
  actionText?: string;
}

// =============================================================================
// REACT COMPONENT PROP INTERFACES
// =============================================================================

/**
 * Main wizard component props
 */
export interface ApiGenerationWizardProps {
  /** Initial wizard state */
  initialState?: Partial<WizardState>;
  
  /** Wizard completion callback */
  onComplete?: (result: GenerationResult) => void;
  
  /** Wizard cancellation callback */
  onCancel?: () => void;
  
  /** Step change callback */
  onStepChange?: (step: WizardStep) => void;
  
  /** Draft save callback */
  onSaveDraft?: (state: WizardState) => Promise<void>;
  
  /** Draft load callback */
  onLoadDraft?: (draftId: string) => Promise<WizardState>;
  
  /** Custom wizard configuration */
  config?: WizardConfig;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Wizard configuration
 */
export interface WizardConfig {
  /** Enable auto-save */
  autoSave: boolean;
  
  /** Auto-save interval in seconds */
  autoSaveInterval: number;
  
  /** Enable step validation */
  stepValidation: boolean;
  
  /** Enable progress indicators */
  showProgress: boolean;
  
  /** Enable step navigation */
  allowStepNavigation: boolean;
  
  /** Custom step configurations */
  stepConfigs: Map<WizardStep, StepConfig>;
  
  /** Theme configuration */
  theme: WizardTheme;
}

/**
 * Step configuration
 */
export interface StepConfig {
  /** Whether step is optional */
  optional: boolean;
  
  /** Step timeout in minutes */
  timeout?: number;
  
  /** Custom validation function */
  customValidation?: (data: any) => boolean;
  
  /** Step help content */
  helpContent?: string;
  
  /** Step warning message */
  warningMessage?: string;
}

/**
 * Wizard theme
 */
export interface WizardTheme {
  /** Primary color */
  primaryColor: string;
  
  /** Secondary color */
  secondaryColor: string;
  
  /** Success color */
  successColor: string;
  
  /** Error color */
  errorColor: string;
  
  /** Warning color */
  warningColor: string;
  
  /** Border radius */
  borderRadius: string;
  
  /** Font family */
  fontFamily: string;
  
  /** Font size */
  fontSize: string;
}

/**
 * Service selection step component props
 */
export interface ServiceSelectionStepProps {
  /** Current service selection data */
  data: ServiceSelectionData;
  
  /** Data update callback */
  onDataChange: (data: Partial<ServiceSelectionData>) => void;
  
  /** Step validation callback */
  onValidationChange: (isValid: boolean) => void;
  
  /** Loading state */
  loading?: boolean;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Custom CSS classes */
  className?: string;
}

/**
 * Table selection step component props
 */
export interface TableSelectionStepProps {
  /** Current table selection data */
  data: TableSelectionData;
  
  /** Data update callback */
  onDataChange: (data: Partial<TableSelectionData>) => void;
  
  /** Step validation callback */
  onValidationChange: (isValid: boolean) => void;
  
  /** Selected service */
  selectedService: DatabaseService;
  
  /** Loading state */
  loading?: boolean;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Custom CSS classes */
  className?: string;
}

/**
 * Endpoint configuration step component props
 */
export interface EndpointConfigurationStepProps {
  /** Current endpoint configuration data */
  data: EndpointConfigurationData;
  
  /** Data update callback */
  onDataChange: (data: Partial<EndpointConfigurationData>) => void;
  
  /** Step validation callback */
  onValidationChange: (isValid: boolean) => void;
  
  /** Selected tables */
  selectedTables: SelectedTable[];
  
  /** Loading state */
  loading?: boolean;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Custom CSS classes */
  className?: string;
}

/**
 * Security configuration step component props
 */
export interface SecurityConfigurationStepProps {
  /** Current security configuration data */
  data: SecurityConfigurationData;
  
  /** Data update callback */
  onDataChange: (data: Partial<SecurityConfigurationData>) => void;
  
  /** Step validation callback */
  onValidationChange: (isValid: boolean) => void;
  
  /** Endpoint configurations */
  endpointConfigurations: EndpointConfigurationData;
  
  /** Loading state */
  loading?: boolean;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Custom CSS classes */
  className?: string;
}

/**
 * Generation preview step component props
 */
export interface GenerationPreviewStepProps {
  /** Current generation preview data */
  data: GenerationPreviewData;
  
  /** Data update callback */
  onDataChange: (data: Partial<GenerationPreviewData>) => void;
  
  /** Step validation callback */
  onValidationChange: (isValid: boolean) => void;
  
  /** Complete wizard state */
  wizardState: WizardState;
  
  /** Preview generation callback */
  onGeneratePreview: () => Promise<void>;
  
  /** Loading state */
  loading?: boolean;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Custom CSS classes */
  className?: string;
}

/**
 * Wizard navigation component props
 */
export interface WizardNavigationProps {
  /** Current wizard state */
  wizardState: WizardState;
  
  /** Navigation actions */
  actions: WizardActions;
  
  /** Show step labels */
  showLabels?: boolean;
  
  /** Show progress bar */
  showProgress?: boolean;
  
  /** Navigation orientation */
  orientation?: 'horizontal' | 'vertical';
  
  /** Custom CSS classes */
  className?: string;
}

/**
 * Step indicator component props
 */
export interface StepIndicatorProps {
  /** Step information */
  step: WizardStepInfo;
  
  /** Click handler */
  onClick?: (step: WizardStep) => void;
  
  /** Show label */
  showLabel?: boolean;
  
  /** Show description */
  showDescription?: boolean;
  
  /** Indicator size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Custom CSS classes */
  className?: string;
}

/**
 * Wizard progress component props
 */
export interface WizardProgressProps {
  /** Current step */
  currentStep: WizardStep;
  
  /** All steps */
  steps: WizardStepInfo[];
  
  /** Show percentage */
  showPercentage?: boolean;
  
  /** Show step count */
  showStepCount?: boolean;
  
  /** Progress bar style */
  style?: 'bar' | 'circle' | 'dots';
  
  /** Custom CSS classes */
  className?: string;
}

// =============================================================================
// UTILITY TYPES AND HELPERS
// =============================================================================

/**
 * Wizard step union type
 */
export type AnyWizardStep = 
  | ServiceSelectionData
  | TableSelectionData 
  | EndpointConfigurationData
  | SecurityConfigurationData
  | GenerationPreviewData;

/**
 * Form data union type
 */
export type AnyFormData = 
  | ServiceSelectionFormData
  | TableSelectionFormData
  | EndpointConfigurationFormData
  | SecurityConfigurationFormData
  | GenerationPreviewFormData;

/**
 * Component props union type
 */
export type AnyStepProps = 
  | ServiceSelectionStepProps
  | TableSelectionStepProps
  | EndpointConfigurationStepProps
  | SecurityConfigurationStepProps
  | GenerationPreviewStepProps;

/**
 * Validation schema union type
 */
export type AnyValidationSchema = typeof ServiceSelectionSchema
  | typeof TableSelectionSchema
  | typeof EndpointConfigurationSchema
  | typeof SecurityConfigurationSchema
  | typeof GenerationPreviewSchema;

/**
 * Type guard for wizard steps
 */
export function isValidWizardStep(step: string): step is WizardStep {
  return [
    'service-selection',
    'table-selection',
    'endpoint-configuration',
    'security-configuration',
    'generation-preview',
    'generation-complete'
  ].includes(step);
}

/**
 * Type guard for HTTP methods
 */
export function isValidHttpMethod(method: string): method is HttpMethod {
  return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(method);
}

/**
 * Utility to get validation schema for step
 */
export function getValidationSchemaForStep(step: WizardStep): AnyValidationSchema | null {
  switch (step) {
    case 'service-selection':
      return ServiceSelectionSchema;
    case 'table-selection':
      return TableSelectionSchema;
    case 'endpoint-configuration':
      return EndpointConfigurationSchema;
    case 'security-configuration':
      return SecurityConfigurationSchema;
    case 'generation-preview':
      return GenerationPreviewSchema;
    default:
      return null;
  }
}

/**
 * Utility to create initial wizard state
 */
export function createInitialWizardState(): WizardState {
  return {
    currentStep: 'service-selection',
    steps: [
      {
        step: 'service-selection',
        title: 'Select Database Service',
        description: 'Choose the database service to generate APIs for',
        order: 1,
        completed: false,
        active: true,
        accessible: true,
        valid: false,
      },
      {
        step: 'table-selection',
        title: 'Select Tables',
        description: 'Choose database tables and configure fields',
        order: 2,
        completed: false,
        active: false,
        accessible: false,
        valid: false,
      },
      {
        step: 'endpoint-configuration',
        title: 'Configure Endpoints',
        description: 'Set up API endpoint parameters and behavior',
        order: 3,
        completed: false,
        active: false,
        accessible: false,
        valid: false,
      },
      {
        step: 'security-configuration',
        title: 'Configure Security',
        description: 'Set up authentication and authorization',
        order: 4,
        completed: false,
        active: false,
        accessible: false,
        valid: false,
      },
      {
        step: 'generation-preview',
        title: 'Preview & Generate',
        description: 'Review configuration and generate APIs',
        order: 5,
        completed: false,
        active: false,
        accessible: false,
        valid: false,
      },
      {
        step: 'generation-complete',
        title: 'Complete',
        description: 'API generation completed successfully',
        order: 6,
        completed: false,
        active: false,
        accessible: false,
        valid: false,
      },
    ],
    serviceSelection: {
      selectedService: null,
      availableServices: [],
      loading: false,
      error: null,
      connectionTest: null,
      testingConnection: false,
      filter: {
        activeOnly: true,
        recentFirst: true,
      },
      createNewService: false,
      newServiceConfig: null,
    },
    tableSelection: {
      availableTables: [],
      selectedTables: [],
      loading: false,
      error: null,
      lastDiscovered: null,
      filter: {
        primaryKeyOnly: false,
        foreignKeyOnly: false,
        hideSystemTables: true,
        hideEmptyTables: false,
      },
      bulkSelection: {
        selectAll: false,
        selectAllFields: false,
        bulkOperationInProgress: false,
      },
      tableMetadata: new Map(),
      refreshing: false,
      totalTables: 0,
      pagination: {
        currentPage: 1,
        pageSize: 50,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    },
    endpointConfiguration: {
      globalSettings: {
        basePath: '/api/v2',
        version: '1.0.0',
        defaultResponseFormat: 'json',
        enableDocumentation: true,
        enableLogging: true,
        enableCompression: true,
        defaultPageSize: 25,
        maxPageSize: 1000,
        requestTimeout: 30,
        httpsOnly: false,
      },
      tableConfigurations: new Map(),
      customEndpoints: [],
      middlewareConfig: [],
      rateLimiting: {
        enabled: false,
        defaultLimits: {
          requests: 100,
          window: 3600,
        },
        endpointLimits: new Map(),
        userLimits: new Map(),
        storage: 'memory',
        includeHeaders: true,
      },
      corsConfig: {
        enabled: true,
        allowedOrigins: ['*'],
        allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: [],
        allowCredentials: false,
        maxAge: 86400,
      },
      cachingConfig: {
        enabled: false,
        defaultTtl: 300,
        endpointSettings: new Map(),
        storage: 'memory',
        invalidationStrategy: 'time-based',
      },
      loggingConfig: {
        enabled: true,
        level: 'info',
        format: 'json',
        includeRequestBody: false,
        includeResponseBody: false,
        includeHeaders: false,
        retentionDays: 30,
        storage: 'database',
      },
      validationResults: [],
      loading: false,
      error: null,
    },
    securityConfiguration: {
      authenticationConfig: {
        enabled: true,
        methods: [],
        sessionConfig: {
          timeout: 30,
          enableRenewal: true,
          storage: 'database',
          cookieSettings: {
            name: 'session',
            path: '/',
            secure: false,
            httpOnly: true,
            sameSite: 'lax',
          },
          concurrentSessions: 1,
        },
        tokenConfig: {
          type: 'jwt',
          expiration: 60,
          enableRefresh: true,
          refreshExpiration: 7,
          signingAlgorithm: 'HS256',
          secret: '',
        },
        mfaConfig: {
          enabled: false,
          methods: [],
          requirement: 'optional',
          bypassRoles: [],
          sessionDuration: 480,
        },
        passwordPolicy: {
          minLength: 8,
          maxLength: 128,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          historyCount: 5,
          expirationDays: 90,
          forbiddenPasswords: [],
        },
        lockoutPolicy: {
          enabled: true,
          failedAttempts: 5,
          lockoutDuration: 15,
          resetOnSuccess: true,
          notifyOnLockout: true,
        },
      },
      authorizationConfig: {
        enabled: true,
        model: 'rbac',
        defaultPermissions: [],
        inheritanceEnabled: true,
        cachingEnabled: true,
        cacheTtl: 15,
      },
      apiKeyConfig: {
        enabled: true,
        generationSettings: {
          keyLength: 32,
          keyFormat: 'hex',
          keyPrefix: 'df_',
          characterSet: 'alphanumeric',
        },
        validationSettings: {
          checkExpiration: true,
          checkStatus: true,
          checkPermissions: true,
          checkRateLimit: true,
          checkIpRestrictions: false,
        },
        managementPolicies: {
          defaultExpiration: 365,
          maxKeysPerUser: 10,
          autoRenewalEnabled: false,
          renewalNotificationDays: 30,
          inactiveCleanupDays: 90,
        },
        usageTracking: {
          enabled: true,
          trackRequestCount: true,
          trackDataTransfer: false,
          trackEndpoints: true,
          trackClientIps: false,
          retentionDays: 90,
        },
      },
      rbacConfig: {
        enabled: true,
        roles: [],
        permissions: [],
        hierarchy: [],
        assignmentPolicies: [],
      },
      endpointSecurity: new Map(),
      securityMiddleware: [],
      encryptionConfig: {
        enabled: false,
        algorithm: 'AES-256-GCM',
        keyManagement: {
          storage: 'local',
          rotationEnabled: false,
          rotationInterval: 90,
          backupEnabled: false,
          recoveryEnabled: false,
        },
        dataEncryption: {
          encryptAtRest: false,
          encryptInTransit: true,
          encryptedFields: [],
          fieldKeyMapping: {},
        },
        transportEncryption: {
          forceHttps: false,
          tlsVersion: '1.2',
          cipherSuites: [],
          certificateValidation: true,
        },
      },
      auditConfig: {
        enabled: true,
        events: [],
        logFormat: 'json',
        storage: 'database',
        retention: {
          retentionDays: 365,
          archiveAfterDays: 90,
          compressionEnabled: true,
        },
        alerting: {
          enabled: false,
          conditions: [],
          channels: [],
          rateLimiting: {
            enabled: false,
            maxAlertsPerHour: 10,
            cooldownMinutes: 15,
            groupSimilar: true,
          },
        },
      },
      validationResults: [],
      loading: false,
      error: null,
    },
    generationPreview: {
      endpointSummaries: [],
      openApiSpec: {
        openapi: '3.0.3',
        info: {
          title: 'Generated API',
          description: 'Auto-generated REST API',
          version: '1.0.0',
        },
        servers: [],
        paths: {},
        components: {},
        security: [],
        tags: [],
      },
      codeSamples: [],
      documentationPreview: {
        content: '',
        format: 'html',
        sections: [],
        tableOfContents: [],
        metadata: {
          generatedAt: '',
          version: '1.0.0',
          totalPages: 0,
          totalEndpoints: 0,
          totalSchemas: 0,
          size: '0 KB',
        },
      },
      securitySummary: {
        authenticationMethods: [],
        authorizationModel: 'rbac',
        securedEndpoints: 0,
        publicEndpoints: 0,
        securityScore: 0,
        recommendations: [],
        compliance: [],
      },
      performanceEstimations: [],
      validationResults: [],
      statistics: {
        totalEndpoints: 0,
        endpointsByMethod: {
          GET: 0,
          POST: 0,
          PUT: 0,
          PATCH: 0,
          DELETE: 0,
          HEAD: 0,
          OPTIONS: 0,
        },
        endpointsByTable: {},
        totalSchemas: 0,
        totalSecurityRules: 0,
        generationTime: 0,
        estimatedApiSize: '0 KB',
        complexityMetrics: {
          overallScore: 0,
          schemaComplexity: 0,
          endpointComplexity: 0,
          securityComplexity: 0,
          maintainabilityScore: 0,
        },
      },
      loading: false,
      error: null,
      lastGenerated: '',
      previewConfig: {
        includeCodeSamples: true,
        includeDocumentation: true,
        includeSecurityAnalysis: true,
        includePerformanceAnalysis: true,
        codeSampleLanguages: ['javascript', 'python', 'curl'],
        documentationFormat: 'html',
        detailLevel: 'detailed',
      },
    },
    completed: false,
    loading: false,
    error: null,
    isValid: false,
    lastModified: Date.now(),
    sessionId: crypto.randomUUID(),
    isDraft: false,
    autoSave: true,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

// Export all types and interfaces
export type {
  // Core wizard types
  WizardStep,
  WizardStepInfo,
  WizardState,
  WizardActions,
  WizardContextType,
  
  // Service selection types
  ServiceSelectionData,
  ServiceFilter,
  NewServiceConfig,
  ServiceSelectionFormData,
  
  // Table selection types
  TableSelectionData,
  SelectedTable,
  SelectedField,
  TableApiConfig,
  HttpMethodConfig,
  CustomMethodConfig,
  QueryParamConfig,
  CustomQueryParam,
  ResponseFormatConfig,
  FieldTransform,
  PaginationConfig,
  FilteringConfig,
  FilterOperator,
  CustomFilter,
  CustomFilterParam,
  SortingConfig,
  SortOrder,
  TableCustomSettings,
  FieldValidationConfig,
  TableFilter,
  BulkSelectionState,
  BulkOperationResult,
  TableMetadata,
  TablePaginationState,
  TableSelectionFormData,
  
  // Endpoint configuration types
  EndpointConfigurationData,
  GlobalEndpointSettings,
  TableEndpointConfig,
  HttpMethod,
  MethodConfig,
  MethodParameter,
  ResponseTransform,
  TransformCondition,
  RequestValidator,
  BusinessLogicHook,
  EndpointMetadata,
  DeprecationInfo,
  ExternalDocumentation,
  CustomEndpoint,
  MiddlewareConfig,
  MiddlewareCondition,
  RateLimitingConfig,
  RateLimit,
  CorsConfig,
  CachingConfig,
  CacheSettings,
  CacheCondition,
  LoggingConfig,
  ConfigValidationResult,
  ValidationError,
  ValidationWarning,
  EndpointConfigurationFormData,
  
  // Security configuration types
  SecurityConfigurationData,
  AuthenticationConfig,
  AuthenticationMethod,
  SessionConfig,
  CookieSettings,
  TokenConfig,
  MfaConfig,
  MfaMethod,
  PasswordPolicy,
  LockoutPolicy,
  AuthorizationConfig,
  ApiKeyConfig,
  KeyGenerationSettings,
  KeyValidationSettings,
  KeyManagementPolicies,
  KeyUsageTracking,
  RbacConfig,
  Role,
  Permission,
  PermissionCondition,
  RoleHierarchy,
  RoleAssignmentPolicy,
  PolicyCondition,
  EndpointSecurityConfig,
  IpRestriction,
  CustomSecurityRule,
  SecurityMiddleware,
  EncryptionConfig,
  KeyManagementConfig,
  DataEncryptionConfig,
  TransportEncryptionConfig,
  AuditConfig,
  AuditEvent,
  AuditRetention,
  AuditAlerting,
  AlertCondition,
  AlertChannel,
  AlertRateLimiting,
  SecurityValidationResult,
  SecurityFinding,
  SecurityConfigurationFormData,
  
  // Generation preview types
  GenerationPreviewData,
  EndpointSummary,
  ParameterSummary,
  SchemaSummary,
  PropertySummary,
  OpenApiSpecification,
  ApiInformation,
  ContactObject,
  LicenseObject,
  ServerConfig,
  ServerVariable,
  PathItem,
  OperationObject,
  ParameterObject,
  RequestBodyObject,
  ResponseObject,
  MediaTypeObject,
  SchemaObject,
  HeaderObject,
  ExampleObject,
  ComponentsObject,
  SecuritySchemeObject,
  OAuthFlowsObject,
  OAuthFlowObject,
  SecurityRequirement,
  TagObject,
  CodeSample,
  DocumentationPreview,
  DocumentationSection,
  TocEntry,
  DocumentationMetadata,
  SecuritySummary,
  SecurityRecommendation,
  ComplianceStatus,
  PerformanceEstimation,
  PerformanceRecommendation,
  PreviewValidationResult,
  ValidationIssue,
  GenerationStatistics,
  ComplexityMetrics,
  PreviewConfig,
  GenerationPreviewFormData,
  
  // Generation result types
  GenerationResult,
  GeneratedServiceInfo,
  GeneratedEndpoint,
  GeneratedParameter,
  GeneratedSchema,
  GeneratedProperty,
  AppliedSecurityConfig,
  GenerationError,
  GenerationWarning,
  GenerationMetadata,
  NextStepRecommendation,
  
  // Component prop types
  ApiGenerationWizardProps,
  WizardConfig,
  StepConfig,
  WizardTheme,
  ServiceSelectionStepProps,
  TableSelectionStepProps,
  EndpointConfigurationStepProps,
  SecurityConfigurationStepProps,
  GenerationPreviewStepProps,
  WizardNavigationProps,
  StepIndicatorProps,
  WizardProgressProps,
  
  // Utility types
  AnyWizardStep,
  AnyFormData,
  AnyStepProps,
  AnyValidationSchema,
};

// Export schemas
export {
  ServiceSelectionSchema,
  TableSelectionSchema,
  EndpointConfigurationSchema,
  SecurityConfigurationSchema,
  GenerationPreviewSchema,
};

// Export utility functions
export {
  isValidWizardStep,
  isValidHttpMethod,
  getValidationSchemaForStep,
  createInitialWizardState,
};