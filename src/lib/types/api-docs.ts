/**
 * API Documentation Types for React Components
 * 
 * This module provides comprehensive type definitions for API documentation
 * components, maintaining compatibility with existing backend contracts while
 * supporting React component patterns and Swagger UI React integration.
 * 
 * Key features:
 * - Backward compatibility with existing ApiDocsRowData interface
 * - Enhanced support for Swagger UI React component integration
 * - OpenAPI specification handling and validation
 * - API testing and validation interfaces
 * - React component props and configuration types
 */

import { ReactNode, ComponentType } from 'react';

/**
 * Base API documentation row data interface
 * Maintains compatibility with existing backend API contracts
 */
export type ApiDocsRowData = {
  /** Unique identifier for the API endpoint */
  name: string;
  /** Human-readable display label */
  label: string;
  /** Detailed description of the endpoint functionality */
  description: string;
  /** Logical grouping category for the endpoint */
  group: string;
  /** API endpoint type or method classification */
  type: string;
};

/**
 * Enhanced API documentation interface with React component support
 */
export interface ApiDocumentation extends ApiDocsRowData {
  /** HTTP method for the endpoint */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  /** Full endpoint path with parameters */
  path?: string;
  /** OpenAPI specification fragment for this endpoint */
  spec?: OpenApiSpec;
  /** Additional metadata for React components */
  metadata?: ApiDocumentationMetadata;
  /** React component configuration for custom rendering */
  renderConfig?: ApiDocumentationRenderConfig;
}

/**
 * OpenAPI specification structure for API documentation
 */
export interface OpenApiSpec {
  /** OpenAPI version (e.g., "3.0.0") */
  openapi?: string;
  /** API information metadata */
  info?: OpenApiInfo;
  /** Available servers for API testing */
  servers?: OpenApiServer[];
  /** API endpoint paths and operations */
  paths?: Record<string, OpenApiPathItem>;
  /** Reusable components (schemas, parameters, etc.) */
  components?: OpenApiComponents;
  /** Security requirements */
  security?: OpenApiSecurityRequirement[];
  /** Additional specification metadata */
  tags?: OpenApiTag[];
  /** External documentation references */
  externalDocs?: OpenApiExternalDocumentation;
}

/**
 * OpenAPI info object
 */
export interface OpenApiInfo {
  /** API title */
  title: string;
  /** API description */
  description?: string;
  /** Terms of service URL */
  termsOfService?: string;
  /** Contact information */
  contact?: OpenApiContact;
  /** License information */
  license?: OpenApiLicense;
  /** API version */
  version: string;
}

/**
 * OpenAPI contact information
 */
export interface OpenApiContact {
  /** Contact name */
  name?: string;
  /** Contact URL */
  url?: string;
  /** Contact email */
  email?: string;
}

/**
 * OpenAPI license information
 */
export interface OpenApiLicense {
  /** License name */
  name: string;
  /** License URL */
  url?: string;
}

/**
 * OpenAPI server configuration
 */
export interface OpenApiServer {
  /** Server URL */
  url: string;
  /** Server description */
  description?: string;
  /** Variable substitutions */
  variables?: Record<string, OpenApiServerVariable>;
}

/**
 * OpenAPI server variable
 */
export interface OpenApiServerVariable {
  /** Possible values for the variable */
  enum?: string[];
  /** Default value */
  default: string;
  /** Variable description */
  description?: string;
}

/**
 * OpenAPI path item object
 */
export interface OpenApiPathItem {
  /** Summary of the path */
  summary?: string;
  /** Description of the path */
  description?: string;
  /** GET operation */
  get?: OpenApiOperation;
  /** PUT operation */
  put?: OpenApiOperation;
  /** POST operation */
  post?: OpenApiOperation;
  /** DELETE operation */
  delete?: OpenApiOperation;
  /** OPTIONS operation */
  options?: OpenApiOperation;
  /** HEAD operation */
  head?: OpenApiOperation;
  /** PATCH operation */
  patch?: OpenApiOperation;
  /** TRACE operation */
  trace?: OpenApiOperation;
  /** Servers for this path */
  servers?: OpenApiServer[];
  /** Parameters for this path */
  parameters?: OpenApiParameter[];
}

/**
 * OpenAPI operation object
 */
export interface OpenApiOperation {
  /** Operation tags */
  tags?: string[];
  /** Operation summary */
  summary?: string;
  /** Operation description */
  description?: string;
  /** External documentation */
  externalDocs?: OpenApiExternalDocumentation;
  /** Unique operation identifier */
  operationId?: string;
  /** Operation parameters */
  parameters?: OpenApiParameter[];
  /** Request body */
  requestBody?: OpenApiRequestBody;
  /** Operation responses */
  responses: Record<string, OpenApiResponse>;
  /** Operation callbacks */
  callbacks?: Record<string, Record<string, OpenApiPathItem>>;
  /** Operation is deprecated */
  deprecated?: boolean;
  /** Security requirements for this operation */
  security?: OpenApiSecurityRequirement[];
  /** Servers for this operation */
  servers?: OpenApiServer[];
}

/**
 * OpenAPI parameter object
 */
export interface OpenApiParameter {
  /** Parameter name */
  name: string;
  /** Parameter location */
  in: 'query' | 'header' | 'path' | 'cookie';
  /** Parameter description */
  description?: string;
  /** Parameter is required */
  required?: boolean;
  /** Parameter is deprecated */
  deprecated?: boolean;
  /** Allow empty values */
  allowEmptyValue?: boolean;
  /** Parameter style */
  style?: string;
  /** Parameter explode */
  explode?: boolean;
  /** Allow reserved characters */
  allowReserved?: boolean;
  /** Parameter schema */
  schema?: OpenApiSchema;
  /** Parameter example */
  example?: any;
  /** Parameter examples */
  examples?: Record<string, OpenApiExample>;
}

/**
 * OpenAPI request body object
 */
export interface OpenApiRequestBody {
  /** Request body description */
  description?: string;
  /** Request body content */
  content: Record<string, OpenApiMediaType>;
  /** Request body is required */
  required?: boolean;
}

/**
 * OpenAPI response object
 */
export interface OpenApiResponse {
  /** Response description */
  description: string;
  /** Response headers */
  headers?: Record<string, OpenApiHeader>;
  /** Response content */
  content?: Record<string, OpenApiMediaType>;
  /** Response links */
  links?: Record<string, OpenApiLink>;
}

/**
 * OpenAPI media type object
 */
export interface OpenApiMediaType {
  /** Media type schema */
  schema?: OpenApiSchema;
  /** Media type example */
  example?: any;
  /** Media type examples */
  examples?: Record<string, OpenApiExample>;
  /** Encoding information */
  encoding?: Record<string, OpenApiEncoding>;
}

/**
 * OpenAPI schema object
 */
export interface OpenApiSchema {
  /** Schema title */
  title?: string;
  /** Schema description */
  description?: string;
  /** Default value */
  default?: any;
  /** Schema type */
  type?: 'null' | 'boolean' | 'object' | 'array' | 'number' | 'string' | 'integer';
  /** Schema format */
  format?: string;
  /** Enum values */
  enum?: any[];
  /** Const value */
  const?: any;
  /** Multiple of */
  multipleOf?: number;
  /** Maximum value */
  maximum?: number;
  /** Exclusive maximum */
  exclusiveMaximum?: boolean;
  /** Minimum value */
  minimum?: number;
  /** Exclusive minimum */
  exclusiveMinimum?: boolean;
  /** Maximum length */
  maxLength?: number;
  /** Minimum length */
  minLength?: number;
  /** Pattern */
  pattern?: string;
  /** Maximum items */
  maxItems?: number;
  /** Minimum items */
  minItems?: number;
  /** Unique items */
  uniqueItems?: boolean;
  /** Maximum properties */
  maxProperties?: number;
  /** Minimum properties */
  minProperties?: number;
  /** Required properties */
  required?: string[];
  /** Object properties */
  properties?: Record<string, OpenApiSchema>;
  /** Additional properties */
  additionalProperties?: boolean | OpenApiSchema;
  /** Items schema */
  items?: OpenApiSchema;
  /** All of schemas */
  allOf?: OpenApiSchema[];
  /** One of schemas */
  oneOf?: OpenApiSchema[];
  /** Any of schemas */
  anyOf?: OpenApiSchema[];
  /** Not schema */
  not?: OpenApiSchema;
  /** Nullable */
  nullable?: boolean;
  /** Discriminator */
  discriminator?: OpenApiDiscriminator;
  /** Read only */
  readOnly?: boolean;
  /** Write only */
  writeOnly?: boolean;
  /** Example */
  example?: any;
  /** External documentation */
  externalDocs?: OpenApiExternalDocumentation;
  /** Deprecated */
  deprecated?: boolean;
  /** XML metadata */
  xml?: OpenApiXml;
}

/**
 * OpenAPI components object
 */
export interface OpenApiComponents {
  /** Reusable schemas */
  schemas?: Record<string, OpenApiSchema>;
  /** Reusable responses */
  responses?: Record<string, OpenApiResponse>;
  /** Reusable parameters */
  parameters?: Record<string, OpenApiParameter>;
  /** Reusable examples */
  examples?: Record<string, OpenApiExample>;
  /** Reusable request bodies */
  requestBodies?: Record<string, OpenApiRequestBody>;
  /** Reusable headers */
  headers?: Record<string, OpenApiHeader>;
  /** Reusable security schemes */
  securitySchemes?: Record<string, OpenApiSecurityScheme>;
  /** Reusable links */
  links?: Record<string, OpenApiLink>;
  /** Reusable callbacks */
  callbacks?: Record<string, Record<string, OpenApiPathItem>>;
}

/**
 * Additional interfaces for OpenAPI support
 */
export interface OpenApiExample {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}

export interface OpenApiHeader {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: OpenApiSchema;
  example?: any;
  examples?: Record<string, OpenApiExample>;
}

export interface OpenApiEncoding {
  contentType?: string;
  headers?: Record<string, OpenApiHeader>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

export interface OpenApiLink {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, any>;
  requestBody?: any;
  description?: string;
  server?: OpenApiServer;
}

export interface OpenApiSecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: OpenApiOAuthFlows;
  openIdConnectUrl?: string;
}

export interface OpenApiOAuthFlows {
  implicit?: OpenApiOAuthFlow;
  password?: OpenApiOAuthFlow;
  clientCredentials?: OpenApiOAuthFlow;
  authorizationCode?: OpenApiOAuthFlow;
}

export interface OpenApiOAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export interface OpenApiSecurityRequirement {
  [name: string]: string[];
}

export interface OpenApiTag {
  name: string;
  description?: string;
  externalDocs?: OpenApiExternalDocumentation;
}

export interface OpenApiExternalDocumentation {
  description?: string;
  url: string;
}

export interface OpenApiDiscriminator {
  propertyName: string;
  mapping?: Record<string, string>;
}

export interface OpenApiXml {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
}

/**
 * Additional metadata for React component integration
 */
export interface ApiDocumentationMetadata {
  /** Version information */
  version?: string;
  /** Last updated timestamp */
  lastUpdated?: string;
  /** Associated service information */
  serviceId?: string;
  /** Associated service name */
  serviceName?: string;
  /** API endpoint category tags */
  tags?: string[];
  /** Authentication requirements */
  authRequired?: boolean;
  /** Rate limiting information */
  rateLimit?: RateLimitInfo;
  /** API endpoint examples */
  examples?: ApiExample[];
  /** Validation status */
  validationStatus?: ValidationStatus;
}

/**
 * Rate limiting information for API endpoints
 */
export interface RateLimitInfo {
  /** Requests per minute limit */
  requestsPerMinute?: number;
  /** Requests per hour limit */
  requestsPerHour?: number;
  /** Requests per day limit */
  requestsPerDay?: number;
  /** Burst capacity */
  burstLimit?: number;
}

/**
 * API example for testing and documentation
 */
export interface ApiExample {
  /** Example name */
  name: string;
  /** Example description */
  description?: string;
  /** Request example */
  request?: ApiExampleRequest;
  /** Response example */
  response?: ApiExampleResponse;
  /** Example language/format */
  language?: 'json' | 'xml' | 'yaml' | 'text';
}

/**
 * API request example
 */
export interface ApiExampleRequest {
  /** HTTP method */
  method: string;
  /** Request URL */
  url: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request parameters */
  parameters?: Record<string, any>;
  /** Request body */
  body?: any;
}

/**
 * API response example
 */
export interface ApiExampleResponse {
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers?: Record<string, string>;
  /** Response body */
  body?: any;
}

/**
 * Validation status for API documentation
 */
export interface ValidationStatus {
  /** Validation is valid */
  isValid: boolean;
  /** Validation errors */
  errors?: ValidationError[];
  /** Validation warnings */
  warnings?: ValidationWarning[];
  /** Last validation timestamp */
  lastValidated?: string;
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Error path in specification */
  path?: string;
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
  /** Warning path in specification */
  path?: string;
}

/**
 * React component render configuration for API documentation
 */
export interface ApiDocumentationRenderConfig {
  /** Show/hide specific sections */
  sections?: ApiDocumentationSections;
  /** Theme configuration */
  theme?: ApiDocumentationTheme;
  /** Custom component overrides */
  components?: ApiDocumentationComponents;
  /** Interactive features configuration */
  interactive?: ApiDocumentationInteractive;
  /** Layout configuration */
  layout?: ApiDocumentationLayout;
}

/**
 * API documentation sections visibility
 */
export interface ApiDocumentationSections {
  /** Show general information */
  info?: boolean;
  /** Show servers section */
  servers?: boolean;
  /** Show authentication section */
  auth?: boolean;
  /** Show endpoints section */
  endpoints?: boolean;
  /** Show schemas section */
  schemas?: boolean;
  /** Show examples section */
  examples?: boolean;
  /** Show response codes section */
  responses?: boolean;
  /** Show try-it-out functionality */
  tryItOut?: boolean;
}

/**
 * API documentation theme configuration
 */
export interface ApiDocumentationTheme {
  /** Primary color scheme */
  colorScheme?: 'light' | 'dark' | 'auto';
  /** Custom CSS classes */
  customClasses?: Record<string, string>;
  /** Typography configuration */
  typography?: ApiDocumentationTypography;
  /** Color palette overrides */
  colors?: ApiDocumentationColors;
  /** Spacing configuration */
  spacing?: ApiDocumentationSpacing;
}

/**
 * Typography configuration for API documentation
 */
export interface ApiDocumentationTypography {
  /** Font family */
  fontFamily?: string;
  /** Font sizes */
  fontSize?: {
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
  };
  /** Line heights */
  lineHeight?: {
    tight?: string;
    normal?: string;
    relaxed?: string;
  };
}

/**
 * Color palette for API documentation
 */
export interface ApiDocumentationColors {
  /** Primary brand colors */
  primary?: string;
  /** Secondary colors */
  secondary?: string;
  /** Success state colors */
  success?: string;
  /** Warning state colors */
  warning?: string;
  /** Error state colors */
  error?: string;
  /** Background colors */
  background?: string;
  /** Surface colors */
  surface?: string;
  /** Text colors */
  text?: string;
  /** Border colors */
  border?: string;
}

/**
 * Spacing configuration for API documentation
 */
export interface ApiDocumentationSpacing {
  /** Extra small spacing */
  xs?: string;
  /** Small spacing */
  sm?: string;
  /** Medium spacing */
  md?: string;
  /** Large spacing */
  lg?: string;
  /** Extra large spacing */
  xl?: string;
}

/**
 * Custom React components for API documentation
 */
export interface ApiDocumentationComponents {
  /** Custom operation component */
  Operation?: ComponentType<any>;
  /** Custom parameter component */
  Parameter?: ComponentType<any>;
  /** Custom response component */
  Response?: ComponentType<any>;
  /** Custom schema component */
  Schema?: ComponentType<any>;
  /** Custom example component */
  Example?: ComponentType<any>;
  /** Custom header component */
  Header?: ComponentType<any>;
  /** Custom footer component */
  Footer?: ComponentType<any>;
}

/**
 * Interactive features configuration
 */
export interface ApiDocumentationInteractive {
  /** Enable API testing */
  enableTesting?: boolean;
  /** Enable request/response examples */
  enableExamples?: boolean;
  /** Enable schema exploration */
  enableSchemaExploration?: boolean;
  /** Enable authentication configuration */
  enableAuthConfig?: boolean;
  /** Enable server selection */
  enableServerSelection?: boolean;
  /** Enable download functionality */
  enableDownload?: boolean;
}

/**
 * Layout configuration for API documentation
 */
export interface ApiDocumentationLayout {
  /** Layout type */
  type?: 'sidebar' | 'topnav' | 'standalone';
  /** Enable search functionality */
  enableSearch?: boolean;
  /** Enable navigation */
  enableNavigation?: boolean;
  /** Enable table of contents */
  enableToc?: boolean;
  /** Responsive behavior */
  responsive?: boolean;
  /** Maximum content width */
  maxWidth?: string;
}

/**
 * Swagger UI React component props interface
 */
export interface SwaggerUIReactProps {
  /** OpenAPI specification URL or object */
  spec?: string | OpenApiSpec;
  /** Swagger UI configuration */
  config?: SwaggerUIConfig;
  /** Custom plugins */
  plugins?: any[];
  /** Custom presets */
  presets?: any[];
  /** Layout type */
  layout?: string;
  /** Theme configuration */
  theme?: any;
  /** Custom CSS */
  customCss?: string;
  /** Custom CSS URL */
  customCssUrl?: string;
  /** Callback when specification is loaded */
  onComplete?: (system: any) => void;
  /** Callback when specification fails to load */
  onFailure?: (error: any) => void;
  /** Additional props */
  [key: string]: any;
}

/**
 * Swagger UI configuration interface
 */
export interface SwaggerUIConfig {
  /** API base URL */
  url?: string;
  /** URLs for multiple specifications */
  urls?: Array<{ name: string; url: string }>;
  /** Domain ID for CORS */
  domId?: string;
  /** Enable deep linking */
  deepLinking?: boolean;
  /** Display operation ID */
  displayOperationId?: boolean;
  /** Default models expand depth */
  defaultModelsExpandDepth?: number;
  /** Default model expand depth */
  defaultModelExpandDepth?: number;
  /** Default model rendering */
  defaultModelRendering?: 'example' | 'model';
  /** Display request duration */
  displayRequestDuration?: boolean;
  /** Enable CORS */
  enableCors?: boolean;
  /** Filter operations */
  filter?: boolean | string;
  /** Maximum displayed tags */
  maxDisplayedTags?: number;
  /** Show extensions */
  showExtensions?: boolean;
  /** Show common extensions */
  showCommonExtensions?: boolean;
  /** Use unsafeMarkdown */
  useUnsafeMarkdown?: boolean;
  /** Try it out enabled */
  tryItOutEnabled?: boolean;
  /** Request interceptor */
  requestInterceptor?: (request: any) => any;
  /** Response interceptor */
  responseInterceptor?: (response: any) => any;
  /** Show mutated request */
  showMutatedRequest?: boolean;
  /** Supported submit methods */
  supportedSubmitMethods?: string[];
  /** Validate specs */
  validatorUrl?: string | null;
  /** OAuth configuration */
  oauth?: SwaggerUIOAuthConfig;
  /** Preauthorize API key */
  preauthorizeApiKey?: (name: string, key: string) => void;
  /** Preauthorize basic auth */
  preauthorizeBasic?: (username: string, password: string) => void;
}

/**
 * Swagger UI OAuth configuration
 */
export interface SwaggerUIOAuthConfig {
  /** Client ID */
  clientId?: string;
  /** Client secret */
  clientSecret?: string;
  /** Realm */
  realm?: string;
  /** Application name */
  appName?: string;
  /** Scope separator */
  scopeSeparator?: string;
  /** Additional query string parameters */
  additionalQueryStringParams?: Record<string, string>;
  /** Use PKCE with authorization code flow */
  usePkceWithAuthorizationCodeGrant?: boolean;
}

/**
 * API testing result interface
 */
export interface ApiTestResult {
  /** Test ID */
  id: string;
  /** Test name */
  name: string;
  /** Test status */
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  /** Test start time */
  startTime: Date;
  /** Test end time */
  endTime?: Date;
  /** Test duration in milliseconds */
  duration?: number;
  /** Request information */
  request: ApiTestRequest;
  /** Response information */
  response?: ApiTestResponse;
  /** Test error */
  error?: ApiTestError;
  /** Test assertions */
  assertions?: ApiTestAssertion[];
}

/**
 * API test request interface
 */
export interface ApiTestRequest {
  /** HTTP method */
  method: string;
  /** Request URL */
  url: string;
  /** Request headers */
  headers: Record<string, string>;
  /** Request body */
  body?: any;
  /** Request parameters */
  parameters?: Record<string, any>;
}

/**
 * API test response interface
 */
export interface ApiTestResponse {
  /** HTTP status code */
  status: number;
  /** Status text */
  statusText: string;
  /** Response headers */
  headers: Record<string, string>;
  /** Response body */
  body: any;
  /** Response time in milliseconds */
  responseTime: number;
  /** Response size in bytes */
  size?: number;
}

/**
 * API test error interface
 */
export interface ApiTestError {
  /** Error message */
  message: string;
  /** Error code */
  code?: string;
  /** Error stack trace */
  stack?: string;
  /** Error details */
  details?: any;
}

/**
 * API test assertion interface
 */
export interface ApiTestAssertion {
  /** Assertion name */
  name: string;
  /** Assertion type */
  type: 'status' | 'header' | 'body' | 'response-time' | 'custom';
  /** Expected value */
  expected: any;
  /** Actual value */
  actual: any;
  /** Assertion result */
  passed: boolean;
  /** Assertion message */
  message?: string;
}

/**
 * Props for React API documentation components
 */
export interface ApiDocumentationProps {
  /** API documentation data */
  documentation: ApiDocumentation;
  /** Render configuration */
  config?: ApiDocumentationRenderConfig;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string | null;
  /** Event handlers */
  onTest?: (endpoint: string, method: string) => void;
  onExport?: (format: 'json' | 'yaml') => void;
  onValidate?: () => void;
  /** Custom actions */
  actions?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automation */
  'data-testid'?: string;
}

/**
 * Props for API documentation list components
 */
export interface ApiDocumentationListProps {
  /** List of API documentation */
  documentations: ApiDocumentation[];
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string | null;
  /** Search term */
  searchTerm?: string;
  /** Filter configuration */
  filters?: ApiDocumentationFilters;
  /** Sort configuration */
  sort?: ApiDocumentationSort;
  /** Event handlers */
  onItemClick?: (documentation: ApiDocumentation) => void;
  onSearch?: (term: string) => void;
  onFilter?: (filters: ApiDocumentationFilters) => void;
  onSort?: (sort: ApiDocumentationSort) => void;
  /** Pagination */
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automation */
  'data-testid'?: string;
}

/**
 * API documentation filters
 */
export interface ApiDocumentationFilters {
  /** Filter by service */
  service?: string[];
  /** Filter by method */
  method?: string[];
  /** Filter by group */
  group?: string[];
  /** Filter by type */
  type?: string[];
  /** Filter by tags */
  tags?: string[];
  /** Filter by authentication requirement */
  authRequired?: boolean;
}

/**
 * API documentation sort configuration
 */
export interface ApiDocumentationSort {
  /** Sort field */
  field: 'name' | 'label' | 'group' | 'type' | 'lastUpdated';
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Export utility types for backward compatibility
 */
export { ApiDocsRowData as LegacyApiDocsRowData };

/**
 * Type guards for API documentation validation
 */
export const isApiDocumentation = (obj: any): obj is ApiDocumentation => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.name === 'string' &&
    typeof obj.label === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.group === 'string' &&
    typeof obj.type === 'string'
  );
};

export const isOpenApiSpec = (obj: any): obj is OpenApiSpec => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    (typeof obj.openapi === 'string' || obj.openapi === undefined) &&
    (typeof obj.info === 'object' || obj.info === undefined)
  );
};

/**
 * Default configurations for React components
 */
export const defaultApiDocumentationConfig: ApiDocumentationRenderConfig = {
  sections: {
    info: true,
    servers: true,
    auth: true,
    endpoints: true,
    schemas: true,
    examples: true,
    responses: true,
    tryItOut: true,
  },
  theme: {
    colorScheme: 'light',
  },
  interactive: {
    enableTesting: true,
    enableExamples: true,
    enableSchemaExploration: true,
    enableAuthConfig: true,
    enableServerSelection: true,
    enableDownload: true,
  },
  layout: {
    type: 'sidebar',
    enableSearch: true,
    enableNavigation: true,
    enableToc: true,
    responsive: true,
  },
};

export const defaultSwaggerUIConfig: SwaggerUIConfig = {
  deepLinking: true,
  displayOperationId: false,
  defaultModelsExpandDepth: 1,
  defaultModelExpandDepth: 1,
  defaultModelRendering: 'example',
  displayRequestDuration: true,
  enableCors: true,
  filter: true,
  showExtensions: true,
  showCommonExtensions: true,
  tryItOutEnabled: true,
  useUnsafeMarkdown: false,
  validatorUrl: null,
  supportedSubmitMethods: ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'],
};