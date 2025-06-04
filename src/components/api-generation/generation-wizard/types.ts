/**
 * TypeScript interface definitions and type exports for the API generation wizard.
 * 
 * Provides comprehensive type safety for the multi-step API generation workflow including:
 * - Wizard state management replacing Angular service-based patterns
 * - Zod schema validators integrated with React Hook Form
 * - Table selection, endpoint configuration, and generation preview data structures
 * - React component prop interfaces following React 19 patterns with TypeScript 5.8+ strict type safety
 * 
 * Supports F-003: REST API Endpoint Generation workflow per Section 2.1 Feature Catalog
 * with React/Next.js Integration Requirements compliance.
 */

import { z } from 'zod';
import { ReactNode } from 'react';

// ============================================================================
// Base Wizard Types and Enums
// ============================================================================

/**
 * Wizard step identifiers for the API generation workflow
 */
export enum WizardStep {
  TABLE_SELECTION = 'table-selection',
  ENDPOINT_CONFIGURATION = 'endpoint-configuration', 
  GENERATION_PREVIEW = 'generation-preview',
  GENERATION_PROGRESS = 'generation-progress'
}

/**
 * HTTP methods supported for API endpoint generation
 */
export enum HTTPMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE'
}

/**
 * API generation status states
 */
export enum GenerationStatus {
  IDLE = 'idle',
  CONFIGURING = 'configuring',
  VALIDATING = 'validating',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * Endpoint parameter types for filtering and querying
 */
export enum ParameterType {
  QUERY = 'query',
  PATH = 'path',
  HEADER = 'header',
  BODY = 'body',
  FORM = 'form'
}

/**
 * Filter operators for endpoint query parameters
 */
export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_EQUAL = 'greater_equal',
  LESS_EQUAL = 'less_equal',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null'
}

// ============================================================================
// Database Schema and Table Types
// ============================================================================

/**
 * Database table information for selection step
 */
export interface DatabaseTable {
  /** Table name in the database */
  name: string;
  /** Optional display label for the table */
  label?: string;
  /** Table description or comment */
  description?: string;
  /** Database schema name (for databases with schema support) */
  schema?: string;
  /** Estimated number of rows in the table */
  rowCount?: number;
  /** Table fields/columns */
  fields: DatabaseField[];
  /** Primary key field names */
  primaryKey: string[];
  /** Foreign key relationships */
  foreignKeys: ForeignKeyRelation[];
  /** Whether this table is selected for API generation */
  selected: boolean;
  /** UI state for table expansion in tree view */
  expanded?: boolean;
  /** Whether the table has existing API endpoints */
  hasExistingAPI?: boolean;
}

/**
 * Database field/column information
 */
export interface DatabaseField {
  /** Field name in the database */
  name: string;
  /** Database-specific data type */
  dbType: string;
  /** Normalized field type */
  type: FieldType;
  /** Maximum field length for string types */
  length?: number;
  /** Numeric precision for decimal types */
  precision?: number;
  /** Numeric scale for decimal types */
  scale?: number;
  /** Default value for the field */
  defaultValue?: unknown;
  /** Whether the field allows null values */
  isNullable: boolean;
  /** Whether the field is part of the primary key */
  isPrimaryKey: boolean;
  /** Whether the field is a foreign key */
  isForeignKey: boolean;
  /** Whether the field has a unique constraint */
  isUnique: boolean;
  /** Whether the field is auto-incrementing */
  isAutoIncrement?: boolean;
  /** Field description or comment */
  description?: string;
}

/**
 * Normalized field types for API generation
 */
export enum FieldType {
  STRING = 'string',
  INTEGER = 'integer',
  BIGINT = 'bigint',
  DECIMAL = 'decimal',
  FLOAT = 'float',
  DOUBLE = 'double',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  TIMESTAMP = 'timestamp',
  TIME = 'time',
  TEXT = 'text',
  JSON = 'json',
  BINARY = 'binary',
  UUID = 'uuid'
}

/**
 * Foreign key relationship definition
 */
export interface ForeignKeyRelation {
  /** Foreign key constraint name */
  name: string;
  /** Local field name */
  field: string;
  /** Referenced table name */
  referencedTable: string;
  /** Referenced field name */
  referencedField: string;
  /** Action on delete */
  onDelete?: ReferentialAction;
  /** Action on update */
  onUpdate?: ReferentialAction;
}

/**
 * Referential integrity actions
 */
export enum ReferentialAction {
  NO_ACTION = 'NO ACTION',
  RESTRICT = 'RESTRICT',
  CASCADE = 'CASCADE',
  SET_NULL = 'SET NULL',
  SET_DEFAULT = 'SET DEFAULT'
}

// ============================================================================
// Wizard State Management
// ============================================================================

/**
 * Complete wizard state for API generation workflow
 * Replaces Angular service-based state patterns with React state management
 */
export interface WizardState {
  /** Current active step in the wizard */
  currentStep: WizardStep;
  /** Whether the wizard is in a loading state */
  loading: boolean;
  /** Current error message, if any */
  error?: string;
  /** API generation status */
  generationStatus: GenerationStatus;
  /** Service name for the database connection */
  serviceName: string;
  /** Available database tables */
  availableTables: DatabaseTable[];
  /** Selected tables for API generation */
  selectedTables: DatabaseTable[];
  /** Endpoint configuration for selected tables */
  endpointConfigurations: EndpointConfiguration[];
  /** Generated OpenAPI specification preview */
  generatedSpec?: OpenAPISpec;
  /** Generation progress percentage (0-100) */
  generationProgress: number;
  /** Final generation result */
  generationResult?: GenerationResult;
  /** Validation errors for current step */
  validationErrors: Record<string, string[]>;
}

/**
 * Wizard navigation actions
 */
export interface WizardActions {
  /** Navigate to the next step */
  nextStep: () => Promise<boolean>;
  /** Navigate to the previous step */
  previousStep: () => void;
  /** Navigate to a specific step */
  goToStep: (step: WizardStep) => void;
  /** Reset wizard to initial state */
  reset: () => void;
  /** Update wizard state */
  updateState: (updates: Partial<WizardState>) => void;
  /** Validate current step */
  validateCurrentStep: () => Promise<boolean>;
}

// ============================================================================
// Step-Specific Data Types
// ============================================================================

/**
 * Table selection step data and validation
 */
export interface TableSelectionData {
  /** Search term for filtering tables */
  searchTerm: string;
  /** Selected table names */
  selectedTableNames: string[];
  /** Filter options for table display */
  filters: TableFilter[];
  /** Virtual scrolling configuration for large schemas */
  virtualScrollConfig: VirtualScrollConfig;
}

/**
 * Table filtering options
 */
export interface TableFilter {
  /** Filter field name */
  field: keyof DatabaseTable;
  /** Filter operator */
  operator: FilterOperator;
  /** Filter value */
  value: unknown;
  /** Whether the filter is active */
  active: boolean;
}

/**
 * Virtual scrolling configuration for handling 1000+ tables
 */
export interface VirtualScrollConfig {
  /** Number of items to render at once */
  overscan: number;
  /** Item height in pixels */
  itemHeight: number;
  /** Container height in pixels */
  containerHeight: number;
  /** Enable virtual scrolling */
  enabled: boolean;
}

/**
 * Endpoint configuration for a single table
 */
export interface EndpointConfiguration {
  /** Table name this configuration applies to */
  tableName: string;
  /** Base endpoint path */
  basePath: string;
  /** Enabled HTTP methods */
  enabledMethods: HTTPMethod[];
  /** Method-specific configurations */
  methodConfigurations: Record<HTTPMethod, MethodConfiguration>;
  /** Security configuration for this endpoint */
  security: EndpointSecurity;
  /** Custom parameters for this endpoint */
  customParameters: EndpointParameter[];
  /** Whether the endpoint is enabled */
  enabled: boolean;
}

/**
 * Configuration for a specific HTTP method
 */
export interface MethodConfiguration {
  /** Whether this method is enabled */
  enabled: boolean;
  /** Custom parameters for this method */
  parameters: EndpointParameter[];
  /** Request body schema for POST/PUT/PATCH */
  requestSchema?: RequestSchema;
  /** Response schema configuration */
  responseSchema: ResponseSchema;
  /** Method-specific security overrides */
  security?: EndpointSecurity;
  /** Custom description for OpenAPI documentation */
  description?: string;
  /** Method-specific tags for OpenAPI */
  tags: string[];
}

/**
 * Endpoint parameter definition
 */
export interface EndpointParameter {
  /** Parameter name */
  name: string;
  /** Parameter type and location */
  type: ParameterType;
  /** Data type of the parameter */
  dataType: FieldType;
  /** Whether the parameter is required */
  required: boolean;
  /** Parameter description */
  description?: string;
  /** Default value */
  defaultValue?: unknown;
  /** Allowed values for enum parameters */
  allowedValues?: unknown[];
  /** Validation schema */
  validation?: ParameterValidation;
}

/**
 * Parameter validation rules
 */
export interface ParameterValidation {
  /** Minimum value for numeric parameters */
  min?: number;
  /** Maximum value for numeric parameters */
  max?: number;
  /** Minimum length for string parameters */
  minLength?: number;
  /** Maximum length for string parameters */
  maxLength?: number;
  /** Regular expression pattern */
  pattern?: string;
  /** Custom validation function name */
  customValidator?: string;
}

/**
 * Request schema definition for POST/PUT/PATCH operations
 */
export interface RequestSchema {
  /** Request content type */
  contentType: string;
  /** Required fields in the request */
  requiredFields: string[];
  /** Optional fields in the request */
  optionalFields: string[];
  /** Field validation rules */
  fieldValidations: Record<string, ParameterValidation>;
  /** Whether to include all table fields by default */
  includeAllFields: boolean;
  /** Fields to exclude from the request */
  excludedFields: string[];
}

/**
 * Response schema configuration
 */
export interface ResponseSchema {
  /** Fields to include in the response */
  includedFields: string[];
  /** Fields to exclude from the response */
  excludedFields: string[];
  /** Whether to include metadata in responses */
  includeMetadata: boolean;
  /** Custom response format options */
  formatOptions: ResponseFormatOptions;
}

/**
 * Response formatting options
 */
export interface ResponseFormatOptions {
  /** Date format string */
  dateFormat?: string;
  /** Timezone for date formatting */
  timezone?: string;
  /** Whether to include null values */
  includeNulls: boolean;
  /** Whether to flatten nested objects */
  flattenNested: boolean;
  /** Custom field transformations */
  fieldTransforms: Record<string, string>;
}

/**
 * Endpoint security configuration
 */
export interface EndpointSecurity {
  /** Whether authentication is required */
  requireAuth: boolean;
  /** Required roles for access */
  requiredRoles: string[];
  /** API key permissions */
  apiKeyPermissions: APIKeyPermission[];
  /** Rate limiting configuration */
  rateLimiting?: RateLimitConfig;
  /** CORS configuration */
  corsConfig?: CORSConfig;
}

/**
 * API key permission definition
 */
export interface APIKeyPermission {
  /** API key identifier */
  keyId: string;
  /** Allowed operations */
  allowedMethods: HTTPMethod[];
  /** IP address restrictions */
  ipRestrictions?: string[];
  /** Expiration date */
  expiresAt?: Date;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  /** Requests per minute */
  requestsPerMinute: number;
  /** Requests per hour */
  requestsPerHour: number;
  /** Requests per day */
  requestsPerDay: number;
  /** Burst allowance */
  burstAllowance: number;
}

/**
 * CORS configuration
 */
export interface CORSConfig {
  /** Allowed origins */
  allowedOrigins: string[];
  /** Allowed methods */
  allowedMethods: HTTPMethod[];
  /** Allowed headers */
  allowedHeaders: string[];
  /** Whether to allow credentials */
  allowCredentials: boolean;
  /** Preflight cache duration */
  maxAge: number;
}

// ============================================================================
// OpenAPI Generation Types
// ============================================================================

/**
 * Generated OpenAPI specification
 */
export interface OpenAPISpec {
  /** OpenAPI version */
  openapi: string;
  /** API information */
  info: APIInfo;
  /** Server definitions */
  servers: APIServer[];
  /** API paths */
  paths: Record<string, PathItem>;
  /** Component definitions */
  components: APIComponents;
  /** Security requirements */
  security: SecurityRequirement[];
  /** API tags */
  tags: APITag[];
}

/**
 * API information metadata
 */
export interface APIInfo {
  /** API title */
  title: string;
  /** API version */
  version: string;
  /** API description */
  description?: string;
  /** Terms of service URL */
  termsOfService?: string;
  /** Contact information */
  contact?: APIContact;
  /** License information */
  license?: APILicense;
}

/**
 * API contact information
 */
export interface APIContact {
  /** Contact name */
  name?: string;
  /** Contact URL */
  url?: string;
  /** Contact email */
  email?: string;
}

/**
 * API license information
 */
export interface APILicense {
  /** License name */
  name: string;
  /** License URL */
  url?: string;
}

/**
 * API server definition
 */
export interface APIServer {
  /** Server URL */
  url: string;
  /** Server description */
  description?: string;
  /** Server variables */
  variables?: Record<string, ServerVariable>;
}

/**
 * Server variable definition
 */
export interface ServerVariable {
  /** Variable default value */
  default: string;
  /** Variable description */
  description?: string;
  /** Enum values */
  enum?: string[];
}

/**
 * OpenAPI path item definition
 */
export interface PathItem {
  /** GET operation */
  get?: Operation;
  /** POST operation */
  post?: Operation;
  /** PUT operation */
  put?: Operation;
  /** PATCH operation */
  patch?: Operation;
  /** DELETE operation */
  delete?: Operation;
  /** Path parameters */
  parameters?: Parameter[];
}

/**
 * OpenAPI operation definition
 */
export interface Operation {
  /** Operation ID */
  operationId: string;
  /** Operation summary */
  summary?: string;
  /** Operation description */
  description?: string;
  /** Operation tags */
  tags: string[];
  /** Operation parameters */
  parameters?: Parameter[];
  /** Request body */
  requestBody?: RequestBody;
  /** Responses */
  responses: Record<string, Response>;
  /** Security requirements */
  security?: SecurityRequirement[];
}

/**
 * OpenAPI parameter definition
 */
export interface Parameter {
  /** Parameter name */
  name: string;
  /** Parameter location */
  in: 'query' | 'header' | 'path' | 'cookie';
  /** Parameter description */
  description?: string;
  /** Whether parameter is required */
  required: boolean;
  /** Parameter schema */
  schema: Schema;
}

/**
 * OpenAPI request body definition
 */
export interface RequestBody {
  /** Request body description */
  description?: string;
  /** Request body content */
  content: Record<string, MediaType>;
  /** Whether request body is required */
  required: boolean;
}

/**
 * OpenAPI media type definition
 */
export interface MediaType {
  /** Media type schema */
  schema: Schema;
  /** Example value */
  example?: unknown;
  /** Multiple examples */
  examples?: Record<string, Example>;
}

/**
 * OpenAPI example definition
 */
export interface Example {
  /** Example summary */
  summary?: string;
  /** Example description */
  description?: string;
  /** Example value */
  value: unknown;
}

/**
 * OpenAPI response definition
 */
export interface Response {
  /** Response description */
  description: string;
  /** Response headers */
  headers?: Record<string, Header>;
  /** Response content */
  content?: Record<string, MediaType>;
}

/**
 * OpenAPI header definition
 */
export interface Header {
  /** Header description */
  description?: string;
  /** Header schema */
  schema: Schema;
}

/**
 * OpenAPI schema definition
 */
export interface Schema {
  /** Schema type */
  type?: string;
  /** Schema format */
  format?: string;
  /** Schema title */
  title?: string;
  /** Schema description */
  description?: string;
  /** Default value */
  default?: unknown;
  /** Enum values */
  enum?: unknown[];
  /** Schema properties */
  properties?: Record<string, Schema>;
  /** Required properties */
  required?: string[];
  /** Items schema for arrays */
  items?: Schema;
  /** Additional properties */
  additionalProperties?: boolean | Schema;
  /** Minimum value */
  minimum?: number;
  /** Maximum value */
  maximum?: number;
  /** Minimum length */
  minLength?: number;
  /** Maximum length */
  maxLength?: number;
  /** Pattern */
  pattern?: string;
}

/**
 * OpenAPI components definition
 */
export interface APIComponents {
  /** Schema components */
  schemas?: Record<string, Schema>;
  /** Security scheme components */
  securitySchemes?: Record<string, SecurityScheme>;
  /** Parameter components */
  parameters?: Record<string, Parameter>;
  /** Request body components */
  requestBodies?: Record<string, RequestBody>;
  /** Response components */
  responses?: Record<string, Response>;
  /** Header components */
  headers?: Record<string, Header>;
  /** Example components */
  examples?: Record<string, Example>;
}

/**
 * Security scheme definition
 */
export interface SecurityScheme {
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
  /** Bearer format (for http bearer) */
  bearerFormat?: string;
}

/**
 * Security requirement definition
 */
export interface SecurityRequirement {
  [key: string]: string[];
}

/**
 * API tag definition
 */
export interface APITag {
  /** Tag name */
  name: string;
  /** Tag description */
  description?: string;
  /** External documentation */
  externalDocs?: ExternalDocumentation;
}

/**
 * External documentation definition
 */
export interface ExternalDocumentation {
  /** Documentation description */
  description?: string;
  /** Documentation URL */
  url: string;
}

// ============================================================================
// Generation Result Types
// ============================================================================

/**
 * Final API generation result
 */
export interface GenerationResult {
  /** Whether generation was successful */
  success: boolean;
  /** Generation error message if failed */
  error?: string;
  /** Generated service ID */
  serviceId?: number;
  /** Generated endpoint URLs */
  endpointUrls: string[];
  /** Generated OpenAPI specification */
  openApiSpec: OpenAPISpec;
  /** Generation statistics */
  statistics: GenerationStatistics;
  /** Warnings during generation */
  warnings: string[];
  /** Generation timestamp */
  timestamp: Date;
}

/**
 * Generation statistics
 */
export interface GenerationStatistics {
  /** Number of tables processed */
  tablesProcessed: number;
  /** Number of endpoints generated */
  endpointsGenerated: number;
  /** Number of schemas created */
  schemasCreated: number;
  /** Generation duration in milliseconds */
  generationDuration: number;
  /** Size of generated specification */
  specificationSize: number;
}

// ============================================================================
// React Component Props Interfaces
// ============================================================================

/**
 * Base wizard component props
 */
export interface BaseWizardProps {
  /** CSS class name */
  className?: string;
  /** Additional children elements */
  children?: ReactNode;
  /** Test identifier for testing */
  'data-testid'?: string;
}

/**
 * Wizard layout component props
 */
export interface WizardLayoutProps extends BaseWizardProps {
  /** Service name for the database connection */
  serviceName: string;
  /** Callback when wizard is completed */
  onComplete?: (result: GenerationResult) => void;
  /** Callback when wizard is cancelled */
  onCancel?: () => void;
  /** Initial wizard state */
  initialState?: Partial<WizardState>;
}

/**
 * Table selection component props
 */
export interface TableSelectionProps extends BaseWizardProps {
  /** Available database tables */
  tables: DatabaseTable[];
  /** Currently selected tables */
  selectedTables: DatabaseTable[];
  /** Loading state */
  loading?: boolean;
  /** Search term */
  searchTerm?: string;
  /** Callback when tables are selected */
  onTablesSelected: (tables: DatabaseTable[]) => void;
  /** Callback when search term changes */
  onSearchChange: (term: string) => void;
  /** Virtual scrolling configuration */
  virtualScrollConfig?: VirtualScrollConfig;
}

/**
 * Endpoint configuration component props
 */
export interface EndpointConfigurationProps extends BaseWizardProps {
  /** Tables to configure endpoints for */
  tables: DatabaseTable[];
  /** Current endpoint configurations */
  configurations: EndpointConfiguration[];
  /** Loading state */
  loading?: boolean;
  /** Callback when configurations change */
  onConfigurationsChange: (configurations: EndpointConfiguration[]) => void;
  /** Callback when configuration is validated */
  onValidate: (isValid: boolean) => void;
}

/**
 * Generation preview component props
 */
export interface GenerationPreviewProps extends BaseWizardProps {
  /** Endpoint configurations to preview */
  configurations: EndpointConfiguration[];
  /** Generated OpenAPI specification */
  openApiSpec?: OpenAPISpec;
  /** Loading state for preview generation */
  loading?: boolean;
  /** Callback when preview is generated */
  onPreviewGenerated: (spec: OpenAPISpec) => void;
  /** Callback when configuration needs to be modified */
  onModifyConfiguration: () => void;
}

/**
 * Generation progress component props
 */
export interface GenerationProgressProps extends BaseWizardProps {
  /** Current generation progress (0-100) */
  progress: number;
  /** Generation status */
  status: GenerationStatus;
  /** Generation result when completed */
  result?: GenerationResult;
  /** Current operation description */
  currentOperation?: string;
  /** Callback when generation is completed */
  onComplete?: (result: GenerationResult) => void;
  /** Callback when user wants to view generated APIs */
  onViewAPIs?: (serviceId: number) => void;
}

/**
 * Wizard provider component props
 */
export interface WizardProviderProps {
  /** Child components */
  children: ReactNode;
  /** Service name for the database connection */
  serviceName: string;
  /** Initial wizard state */
  initialState?: Partial<WizardState>;
}

// ============================================================================
// Zod Schema Validators
// ============================================================================

/**
 * Zod schema for table selection validation
 */
export const TableSelectionSchema = z.object({
  selectedTableNames: z.array(z.string()).min(1, 'At least one table must be selected'),
  searchTerm: z.string().optional(),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.nativeEnum(FilterOperator),
    value: z.unknown(),
    active: z.boolean()
  })).optional()
});

/**
 * Zod schema for endpoint parameter validation
 */
export const EndpointParameterSchema = z.object({
  name: z.string().min(1, 'Parameter name is required'),
  type: z.nativeEnum(ParameterType),
  dataType: z.nativeEnum(FieldType),
  required: z.boolean(),
  description: z.string().optional(),
  defaultValue: z.unknown().optional(),
  allowedValues: z.array(z.unknown()).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    customValidator: z.string().optional()
  }).optional()
});

/**
 * Zod schema for method configuration validation
 */
export const MethodConfigurationSchema = z.object({
  enabled: z.boolean(),
  parameters: z.array(EndpointParameterSchema),
  requestSchema: z.object({
    contentType: z.string(),
    requiredFields: z.array(z.string()),
    optionalFields: z.array(z.string()),
    fieldValidations: z.record(z.string(), z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
      customValidator: z.string().optional()
    })),
    includeAllFields: z.boolean(),
    excludedFields: z.array(z.string())
  }).optional(),
  responseSchema: z.object({
    includedFields: z.array(z.string()),
    excludedFields: z.array(z.string()),
    includeMetadata: z.boolean(),
    formatOptions: z.object({
      dateFormat: z.string().optional(),
      timezone: z.string().optional(),
      includeNulls: z.boolean(),
      flattenNested: z.boolean(),
      fieldTransforms: z.record(z.string(), z.string())
    })
  }),
  security: z.object({
    requireAuth: z.boolean(),
    requiredRoles: z.array(z.string()),
    apiKeyPermissions: z.array(z.object({
      keyId: z.string(),
      allowedMethods: z.array(z.nativeEnum(HTTPMethod)),
      ipRestrictions: z.array(z.string()).optional(),
      expiresAt: z.date().optional()
    })),
    rateLimiting: z.object({
      requestsPerMinute: z.number().min(1),
      requestsPerHour: z.number().min(1),
      requestsPerDay: z.number().min(1),
      burstAllowance: z.number().min(0)
    }).optional(),
    corsConfig: z.object({
      allowedOrigins: z.array(z.string()),
      allowedMethods: z.array(z.nativeEnum(HTTPMethod)),
      allowedHeaders: z.array(z.string()),
      allowCredentials: z.boolean(),
      maxAge: z.number().min(0)
    }).optional()
  }).optional(),
  description: z.string().optional(),
  tags: z.array(z.string())
});

/**
 * Zod schema for endpoint configuration validation
 */
export const EndpointConfigurationSchema = z.object({
  tableName: z.string().min(1, 'Table name is required'),
  basePath: z.string().min(1, 'Base path is required').regex(/^\/[a-zA-Z0-9_-]+$/, 'Invalid base path format'),
  enabledMethods: z.array(z.nativeEnum(HTTPMethod)).min(1, 'At least one HTTP method must be enabled'),
  methodConfigurations: z.record(z.nativeEnum(HTTPMethod), MethodConfigurationSchema),
  security: z.object({
    requireAuth: z.boolean(),
    requiredRoles: z.array(z.string()),
    apiKeyPermissions: z.array(z.object({
      keyId: z.string(),
      allowedMethods: z.array(z.nativeEnum(HTTPMethod)),
      ipRestrictions: z.array(z.string()).optional(),
      expiresAt: z.date().optional()
    })),
    rateLimiting: z.object({
      requestsPerMinute: z.number().min(1),
      requestsPerHour: z.number().min(1),
      requestsPerDay: z.number().min(1),
      burstAllowance: z.number().min(0)
    }).optional(),
    corsConfig: z.object({
      allowedOrigins: z.array(z.string()),
      allowedMethods: z.array(z.nativeEnum(HTTPMethod)),
      allowedHeaders: z.array(z.string()),
      allowCredentials: z.boolean(),
      maxAge: z.number().min(0)
    }).optional()
  }),
  customParameters: z.array(EndpointParameterSchema),
  enabled: z.boolean()
});

/**
 * Zod schema for complete wizard state validation
 */
export const WizardStateSchema = z.object({
  currentStep: z.nativeEnum(WizardStep),
  loading: z.boolean(),
  error: z.string().optional(),
  generationStatus: z.nativeEnum(GenerationStatus),
  serviceName: z.string().min(1, 'Service name is required'),
  availableTables: z.array(z.object({
    name: z.string(),
    label: z.string().optional(),
    description: z.string().optional(),
    schema: z.string().optional(),
    rowCount: z.number().optional(),
    fields: z.array(z.object({
      name: z.string(),
      dbType: z.string(),
      type: z.nativeEnum(FieldType),
      length: z.number().optional(),
      precision: z.number().optional(),
      scale: z.number().optional(),
      defaultValue: z.unknown().optional(),
      isNullable: z.boolean(),
      isPrimaryKey: z.boolean(),
      isForeignKey: z.boolean(),
      isUnique: z.boolean(),
      isAutoIncrement: z.boolean().optional(),
      description: z.string().optional()
    })),
    primaryKey: z.array(z.string()),
    foreignKeys: z.array(z.object({
      name: z.string(),
      field: z.string(),
      referencedTable: z.string(),
      referencedField: z.string(),
      onDelete: z.nativeEnum(ReferentialAction).optional(),
      onUpdate: z.nativeEnum(ReferentialAction).optional()
    })),
    selected: z.boolean(),
    expanded: z.boolean().optional(),
    hasExistingAPI: z.boolean().optional()
  })),
  selectedTables: z.array(z.object({
    name: z.string(),
    selected: z.literal(true)
  })),
  endpointConfigurations: z.array(EndpointConfigurationSchema),
  generatedSpec: z.object({
    openapi: z.string(),
    info: z.object({
      title: z.string(),
      version: z.string(),
      description: z.string().optional()
    }),
    servers: z.array(z.object({
      url: z.string(),
      description: z.string().optional()
    })),
    paths: z.record(z.string(), z.unknown()),
    components: z.object({
      schemas: z.record(z.string(), z.unknown()).optional(),
      securitySchemes: z.record(z.string(), z.unknown()).optional()
    }).optional(),
    security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
    tags: z.array(z.object({
      name: z.string(),
      description: z.string().optional()
    })).optional()
  }).optional(),
  generationProgress: z.number().min(0).max(100),
  generationResult: z.object({
    success: z.boolean(),
    error: z.string().optional(),
    serviceId: z.number().optional(),
    endpointUrls: z.array(z.string()),
    openApiSpec: z.unknown(),
    statistics: z.object({
      tablesProcessed: z.number(),
      endpointsGenerated: z.number(),
      schemasCreated: z.number(),
      generationDuration: z.number(),
      specificationSize: z.number()
    }),
    warnings: z.array(z.string()),
    timestamp: z.date()
  }).optional(),
  validationErrors: z.record(z.string(), z.array(z.string()))
});

// Type exports for React Hook Form integration
export type TableSelectionFormData = z.infer<typeof TableSelectionSchema>;
export type EndpointConfigurationFormData = z.infer<typeof EndpointConfigurationSchema>;
export type WizardStateFormData = z.infer<typeof WizardStateSchema>;