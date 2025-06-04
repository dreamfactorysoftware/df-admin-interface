/**
 * OpenAPI Preview Component Types
 * 
 * TypeScript interface definitions and type exports for OpenAPI preview components,
 * including API documentation data structures, component props, API key information,
 * and service response types. Provides type-safe contracts with Zod schema validators
 * for the OpenAPI documentation viewing workflow.
 * 
 * @fileoverview Type definitions for OpenAPI preview functionality with React 19 and Next.js 15.1 integration
 * @version 1.0.0
 * @since TypeScript 5.8+
 */

import { z } from 'zod';
import type { ComponentProps, ReactNode } from 'react';
import type { SwaggerUIBundle } from 'swagger-ui-dist';

// ============================================================================
// Base OpenAPI Specification Types
// ============================================================================

/**
 * OpenAPI 3.0+ specification structure with enhanced type safety
 * Supporting DreamFactory's API generation and documentation workflow
 */
export interface OpenAPISpecification {
  readonly openapi: string;
  readonly info: OpenAPIInfo;
  readonly servers?: OpenAPIServer[];
  readonly paths: Record<string, OpenAPIPathItem>;
  readonly components?: OpenAPIComponents;
  readonly security?: OpenAPISecurityRequirement[];
  readonly tags?: OpenAPITag[];
  readonly externalDocs?: OpenAPIExternalDocumentation;
}

/**
 * OpenAPI Info object with DreamFactory-specific metadata
 */
export interface OpenAPIInfo {
  readonly title: string;
  readonly description?: string;
  readonly termsOfService?: string;
  readonly contact?: OpenAPIContact;
  readonly license?: OpenAPILicense;
  readonly version: string;
  readonly 'x-dreamfactory-service'?: string;
  readonly 'x-dreamfactory-generated'?: string;
}

/**
 * OpenAPI Server configuration for DreamFactory API endpoints
 */
export interface OpenAPIServer {
  readonly url: string;
  readonly description?: string;
  readonly variables?: Record<string, OpenAPIServerVariable>;
}

export interface OpenAPIServerVariable {
  readonly enum?: string[];
  readonly default: string;
  readonly description?: string;
}

/**
 * OpenAPI Path Item with HTTP methods and operation details
 */
export interface OpenAPIPathItem {
  readonly get?: OpenAPIOperation;
  readonly post?: OpenAPIOperation;
  readonly put?: OpenAPIOperation;
  readonly patch?: OpenAPIOperation;
  readonly delete?: OpenAPIOperation;
  readonly options?: OpenAPIOperation;
  readonly head?: OpenAPIOperation;
  readonly trace?: OpenAPIOperation;
  readonly parameters?: OpenAPIParameter[];
}

/**
 * OpenAPI Operation details with DreamFactory extensions
 */
export interface OpenAPIOperation {
  readonly tags?: string[];
  readonly summary?: string;
  readonly description?: string;
  readonly operationId?: string;
  readonly parameters?: OpenAPIParameter[];
  readonly requestBody?: OpenAPIRequestBody;
  readonly responses: Record<string, OpenAPIResponse>;
  readonly security?: OpenAPISecurityRequirement[];
  readonly 'x-dreamfactory-verb'?: string;
  readonly 'x-dreamfactory-table'?: string;
  readonly 'x-dreamfactory-cache'?: boolean;
}

/**
 * OpenAPI Parameter definition with validation schema
 */
export interface OpenAPIParameter {
  readonly name: string;
  readonly in: 'query' | 'header' | 'path' | 'cookie';
  readonly description?: string;
  readonly required?: boolean;
  readonly deprecated?: boolean;
  readonly allowEmptyValue?: boolean;
  readonly schema?: OpenAPISchema;
  readonly example?: any;
  readonly examples?: Record<string, OpenAPIExample>;
}

/**
 * OpenAPI Request Body with content types and schema
 */
export interface OpenAPIRequestBody {
  readonly description?: string;
  readonly content: Record<string, OpenAPIMediaType>;
  readonly required?: boolean;
}

/**
 * OpenAPI Response definition with content and headers
 */
export interface OpenAPIResponse {
  readonly description: string;
  readonly headers?: Record<string, OpenAPIHeader>;
  readonly content?: Record<string, OpenAPIMediaType>;
  readonly links?: Record<string, OpenAPILink>;
}

/**
 * OpenAPI Media Type with schema and examples
 */
export interface OpenAPIMediaType {
  readonly schema?: OpenAPISchema;
  readonly example?: any;
  readonly examples?: Record<string, OpenAPIExample>;
  readonly encoding?: Record<string, OpenAPIEncoding>;
}

/**
 * OpenAPI Schema definition with comprehensive validation
 */
export interface OpenAPISchema {
  readonly type?: 'null' | 'boolean' | 'object' | 'array' | 'number' | 'string' | 'integer';
  readonly allOf?: OpenAPISchema[];
  readonly oneOf?: OpenAPISchema[];
  readonly anyOf?: OpenAPISchema[];
  readonly not?: OpenAPISchema;
  readonly items?: OpenAPISchema;
  readonly properties?: Record<string, OpenAPISchema>;
  readonly additionalProperties?: boolean | OpenAPISchema;
  readonly description?: string;
  readonly format?: string;
  readonly default?: any;
  readonly title?: string;
  readonly multipleOf?: number;
  readonly maximum?: number;
  readonly exclusiveMaximum?: boolean;
  readonly minimum?: number;
  readonly exclusiveMinimum?: boolean;
  readonly maxLength?: number;
  readonly minLength?: number;
  readonly pattern?: string;
  readonly maxItems?: number;
  readonly minItems?: number;
  readonly uniqueItems?: boolean;
  readonly maxProperties?: number;
  readonly minProperties?: number;
  readonly required?: string[];
  readonly enum?: any[];
  readonly nullable?: boolean;
  readonly readOnly?: boolean;
  readonly writeOnly?: boolean;
  readonly deprecated?: boolean;
  readonly example?: any;
  readonly 'x-dreamfactory-type'?: string;
  readonly 'x-dreamfactory-relationship'?: string;
}

/**
 * OpenAPI Components for reusable schemas and security schemes
 */
export interface OpenAPIComponents {
  readonly schemas?: Record<string, OpenAPISchema>;
  readonly responses?: Record<string, OpenAPIResponse>;
  readonly parameters?: Record<string, OpenAPIParameter>;
  readonly examples?: Record<string, OpenAPIExample>;
  readonly requestBodies?: Record<string, OpenAPIRequestBody>;
  readonly headers?: Record<string, OpenAPIHeader>;
  readonly securitySchemes?: Record<string, OpenAPISecurityScheme>;
  readonly links?: Record<string, OpenAPILink>;
  readonly callbacks?: Record<string, OpenAPICallback>;
}

/**
 * OpenAPI Security Scheme for authentication configuration
 */
export interface OpenAPISecurityScheme {
  readonly type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  readonly description?: string;
  readonly name?: string;
  readonly in?: 'query' | 'header' | 'cookie';
  readonly scheme?: string;
  readonly bearerFormat?: string;
  readonly flows?: OpenAPIOAuthFlows;
  readonly openIdConnectUrl?: string;
}

/**
 * Additional OpenAPI supporting types
 */
export interface OpenAPITag {
  readonly name: string;
  readonly description?: string;
  readonly externalDocs?: OpenAPIExternalDocumentation;
}

export interface OpenAPIContact {
  readonly name?: string;
  readonly url?: string;
  readonly email?: string;
}

export interface OpenAPILicense {
  readonly name: string;
  readonly url?: string;
}

export interface OpenAPIExample {
  readonly summary?: string;
  readonly description?: string;
  readonly value?: any;
  readonly externalValue?: string;
}

export interface OpenAPIHeader {
  readonly description?: string;
  readonly required?: boolean;
  readonly deprecated?: boolean;
  readonly allowEmptyValue?: boolean;
  readonly schema?: OpenAPISchema;
}

export interface OpenAPILink {
  readonly operationRef?: string;
  readonly operationId?: string;
  readonly parameters?: Record<string, any>;
  readonly requestBody?: any;
  readonly description?: string;
  readonly server?: OpenAPIServer;
}

export interface OpenAPICallback {
  readonly [expression: string]: OpenAPIPathItem;
}

export interface OpenAPIEncoding {
  readonly contentType?: string;
  readonly headers?: Record<string, OpenAPIHeader>;
  readonly style?: string;
  readonly explode?: boolean;
  readonly allowReserved?: boolean;
}

export interface OpenAPIOAuthFlows {
  readonly implicit?: OpenAPIOAuthFlow;
  readonly password?: OpenAPIOAuthFlow;
  readonly clientCredentials?: OpenAPIOAuthFlow;
  readonly authorizationCode?: OpenAPIOAuthFlow;
}

export interface OpenAPIOAuthFlow {
  readonly authorizationUrl?: string;
  readonly tokenUrl?: string;
  readonly refreshUrl?: string;
  readonly scopes: Record<string, string>;
}

export interface OpenAPISecurityRequirement {
  readonly [name: string]: string[];
}

export interface OpenAPIExternalDocumentation {
  readonly description?: string;
  readonly url: string;
}

// ============================================================================
// API Documentation Data Structures
// ============================================================================

/**
 * Enhanced API documentation row data extending the original Angular interface
 * with React-compatible patterns and additional metadata
 */
export interface ApiDocsRowData {
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly group: string;
  readonly type: string;
  readonly endpoint?: string;
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly parameters?: ApiDocParameter[];
  readonly responses?: ApiDocResponse[];
  readonly examples?: ApiDocExample[];
  readonly lastModified?: string;
  readonly version?: string;
  readonly deprecated?: boolean;
}

/**
 * API documentation parameter details
 */
export interface ApiDocParameter {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly description?: string;
  readonly defaultValue?: any;
  readonly example?: any;
  readonly constraints?: ApiDocConstraints;
}

/**
 * API documentation response structure
 */
export interface ApiDocResponse {
  readonly statusCode: number;
  readonly description: string;
  readonly contentType: string;
  readonly schema?: OpenAPISchema;
  readonly example?: any;
  readonly headers?: Record<string, string>;
}

/**
 * API documentation example data
 */
export interface ApiDocExample {
  readonly title: string;
  readonly description?: string;
  readonly request?: ApiDocExampleRequest;
  readonly response?: ApiDocExampleResponse;
}

export interface ApiDocExampleRequest {
  readonly method: string;
  readonly url: string;
  readonly headers?: Record<string, string>;
  readonly body?: any;
}

export interface ApiDocExampleResponse {
  readonly statusCode: number;
  readonly headers?: Record<string, string>;
  readonly body?: any;
}

/**
 * Parameter constraints for validation
 */
export interface ApiDocConstraints {
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly enum?: any[];
  readonly format?: string;
}

// ============================================================================
// API Key Management Types
// ============================================================================

/**
 * API key information for authentication and testing
 */
export interface ApiKeyInfo {
  readonly id: string;
  readonly name: string;
  readonly key: string;
  readonly sessionToken?: string;
  readonly createdAt: string;
  readonly expiresAt?: string;
  readonly permissions: ApiKeyPermission[];
  readonly isActive: boolean;
  readonly lastUsed?: string;
  readonly usageCount?: number;
  readonly rateLimit?: ApiKeyRateLimit;
}

/**
 * API key permissions structure
 */
export interface ApiKeyPermission {
  readonly resource: string;
  readonly actions: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[];
  readonly filters?: Record<string, any>;
}

/**
 * API key rate limiting configuration
 */
export interface ApiKeyRateLimit {
  readonly requestsPerMinute: number;
  readonly requestsPerHour: number;
  readonly requestsPerDay: number;
  readonly burstLimit?: number;
}

/**
 * API key creation request
 */
export interface CreateApiKeyRequest {
  readonly name: string;
  readonly description?: string;
  readonly permissions: ApiKeyPermission[];
  readonly expiresIn?: number; // seconds
  readonly rateLimit?: Partial<ApiKeyRateLimit>;
}

/**
 * API key validation response
 */
export interface ApiKeyValidationResponse {
  readonly isValid: boolean;
  readonly keyInfo?: Pick<ApiKeyInfo, 'id' | 'name' | 'permissions' | 'expiresAt'>;
  readonly error?: string;
}

// ============================================================================
// Service Response Types
// ============================================================================

/**
 * Enhanced service information extending the original interface
 * with OpenAPI and documentation metadata
 */
export interface ServiceInfo {
  readonly id: number;
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly type: string;
  readonly isActive: boolean;
  readonly mutable: boolean;
  readonly deletable: boolean;
  readonly createdDate: string;
  readonly lastModifiedDate: string;
  readonly config: ServiceConfig;
  readonly apiDocumentation?: ApiDocumentationMetadata;
  readonly openApiSpec?: OpenAPISpecification;
  readonly endpoints?: ServiceEndpoint[];
  readonly health?: ServiceHealthStatus;
}

/**
 * Service configuration with OpenAPI generation settings
 */
export interface ServiceConfig {
  readonly [key: string]: any;
  readonly generateDocs?: boolean;
  readonly includeExamples?: boolean;
  readonly authenticationRequired?: boolean;
  readonly corsEnabled?: boolean;
  readonly cacheEnabled?: boolean;
  readonly rateLimitEnabled?: boolean;
}

/**
 * API documentation metadata for services
 */
export interface ApiDocumentationMetadata {
  readonly hasDocumentation: boolean;
  readonly documentationUrl?: string;
  readonly swaggerUrl?: string;
  readonly postmanCollectionUrl?: string;
  readonly lastGenerated?: string;
  readonly version?: string;
  readonly endpointCount?: number;
}

/**
 * Service endpoint information
 */
export interface ServiceEndpoint {
  readonly path: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly operationId?: string;
  readonly summary?: string;
  readonly description?: string;
  readonly tags?: string[];
  readonly parameters?: OpenAPIParameter[];
  readonly authenticated?: boolean;
  readonly deprecated?: boolean;
}

/**
 * Service health status for monitoring
 */
export interface ServiceHealthStatus {
  readonly status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  readonly lastChecked: string;
  readonly responseTime?: number;
  readonly uptime?: number;
  readonly errorRate?: number;
  readonly details?: Record<string, any>;
}

// ============================================================================
// Swagger UI Integration Types
// ============================================================================

/**
 * Swagger UI configuration with DreamFactory customizations
 * Extends the base SwaggerUIBundle configuration for enhanced integration
 */
export interface SwaggerUIConfig {
  readonly url?: string;
  readonly spec?: OpenAPISpecification;
  readonly domId?: string;
  readonly dom_id?: string; // Legacy support
  readonly layout?: 'BaseLayout' | 'StandaloneLayout';
  readonly deepLinking?: boolean;
  readonly displayOperationId?: boolean;
  readonly defaultModelsExpandDepth?: number;
  readonly defaultModelExpandDepth?: number;
  readonly defaultModelRendering?: 'example' | 'model';
  readonly displayRequestDuration?: boolean;
  readonly docExpansion?: 'list' | 'full' | 'none';
  readonly filter?: boolean | string;
  readonly maxDisplayedTags?: number;
  readonly operationsSorter?: 'alpha' | 'method' | ((a: any, b: any) => number);
  readonly showExtensions?: boolean;
  readonly showCommonExtensions?: boolean;
  readonly tagsSorter?: 'alpha' | ((a: any, b: any) => number);
  readonly tryItOutEnabled?: boolean;
  readonly requestInterceptor?: (request: any) => any;
  readonly responseInterceptor?: (response: any) => any;
  readonly onComplete?: () => void;
  readonly onFailure?: (error: any) => void;
  readonly authorizations?: Record<string, any>;
  readonly modelPropertyMacro?: (property: any) => any;
  readonly parameterMacro?: (parameter: any) => any;
  readonly plugins?: any[];
  readonly presets?: any[];
  readonly customStyles?: string;
  readonly validatorUrl?: string | null;
  readonly oauth2RedirectUrl?: string;
  readonly persistAuthorization?: boolean;
  
  // DreamFactory-specific extensions
  readonly 'x-dreamfactory-service'?: string;
  readonly 'x-dreamfactory-baseUrl'?: string;
  readonly 'x-dreamfactory-apiKey'?: string;
  readonly 'x-dreamfactory-sessionToken'?: string;
}

/**
 * Swagger UI component properties for React integration
 */
export interface SwaggerUIComponentProps {
  readonly config: SwaggerUIConfig;
  readonly className?: string;
  readonly style?: React.CSSProperties;
  readonly onSpecLoaded?: (spec: OpenAPISpecification) => void;
  readonly onError?: (error: Error) => void;
  readonly loading?: boolean;
  readonly fallback?: ReactNode;
}

/**
 * Swagger UI theme configuration
 */
export interface SwaggerUITheme {
  readonly primary: string;
  readonly secondary: string;
  readonly background: string;
  readonly surface: string;
  readonly text: string;
  readonly textSecondary: string;
  readonly border: string;
  readonly shadow: string;
  readonly success: string;
  readonly warning: string;
  readonly error: string;
  readonly info: string;
}

// ============================================================================
// React Component Props Types
// ============================================================================

/**
 * OpenAPI Preview component props following React 19 patterns
 */
export interface OpenAPIPreviewProps {
  readonly serviceId?: string;
  readonly serviceName?: string;
  readonly openApiSpec?: OpenAPISpecification;
  readonly apiKey?: string;
  readonly sessionToken?: string;
  readonly baseUrl?: string;
  readonly theme?: 'light' | 'dark' | 'auto';
  readonly className?: string;
  readonly style?: React.CSSProperties;
  readonly showTryItOut?: boolean;
  readonly showCodeSamples?: boolean;
  readonly enableAuth?: boolean;
  readonly autoLoadSpec?: boolean;
  readonly refreshInterval?: number;
  readonly onSpecLoaded?: (spec: OpenAPISpecification) => void;
  readonly onApiCall?: (request: ApiCallInfo) => void;
  readonly onError?: (error: Error) => void;
  readonly onAuthSuccess?: (authInfo: AuthInfo) => void;
  readonly onAuthFailure?: (error: Error) => void;
  readonly fallback?: ReactNode;
  readonly loadingComponent?: ReactNode;
  readonly errorBoundary?: ComponentProps<any>;
}

/**
 * API Documentation preview props
 */
export interface ApiDocumentationPreviewProps {
  readonly docs: ApiDocsRowData[];
  readonly serviceInfo?: ServiceInfo;
  readonly searchTerm?: string;
  readonly filterBy?: string;
  readonly sortBy?: 'name' | 'type' | 'method' | 'lastModified';
  readonly sortOrder?: 'asc' | 'desc';
  readonly className?: string;
  readonly onDocumentSelect?: (doc: ApiDocsRowData) => void;
  readonly onExport?: (format: 'openapi' | 'postman' | 'curl') => void;
  readonly onRefresh?: () => void;
  readonly loading?: boolean;
  readonly error?: Error | null;
}

/**
 * API testing interface props
 */
export interface ApiTestingInterfaceProps {
  readonly endpoint: ServiceEndpoint;
  readonly baseUrl: string;
  readonly apiKey?: string;
  readonly sessionToken?: string;
  readonly onTestComplete?: (result: ApiTestResult) => void;
  readonly onTestError?: (error: Error) => void;
  readonly enableHistory?: boolean;
  readonly maxHistoryItems?: number;
  readonly prefilledParams?: Record<string, any>;
  readonly customHeaders?: Record<string, string>;
}

/**
 * OpenAPI specification viewer props
 */
export interface OpenAPISpecViewerProps {
  readonly spec: OpenAPISpecification;
  readonly mode?: 'tree' | 'json' | 'yaml';
  readonly editable?: boolean;
  readonly onChange?: (spec: OpenAPISpecification) => void;
  readonly onValidate?: (errors: ValidationError[]) => void;
  readonly highlightSyntax?: boolean;
  readonly showLineNumbers?: boolean;
  readonly foldLevel?: number;
  readonly className?: string;
}

// ============================================================================
// API Call and Testing Types
// ============================================================================

/**
 * API call information for monitoring and testing
 */
export interface ApiCallInfo {
  readonly id: string;
  readonly timestamp: string;
  readonly method: string;
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly body?: any;
  readonly response?: ApiCallResponse;
  readonly duration?: number;
  readonly status: 'pending' | 'success' | 'error' | 'timeout';
}

/**
 * API call response information
 */
export interface ApiCallResponse {
  readonly statusCode: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  readonly body?: any;
  readonly size?: number;
  readonly contentType?: string;
}

/**
 * API test result structure
 */
export interface ApiTestResult {
  readonly success: boolean;
  readonly duration: number;
  readonly request: ApiCallInfo;
  readonly response: ApiCallResponse;
  readonly validationErrors?: ValidationError[];
  readonly performanceMetrics?: PerformanceMetrics;
}

/**
 * Performance metrics for API calls
 */
export interface PerformanceMetrics {
  readonly dnsLookup?: number;
  readonly tcpConnect?: number;
  readonly tlsHandshake?: number;
  readonly timeToFirstByte?: number;
  readonly contentDownload?: number;
  readonly totalTime: number;
}

/**
 * Authentication information
 */
export interface AuthInfo {
  readonly type: 'apiKey' | 'sessionToken' | 'oauth' | 'basic';
  readonly value: string;
  readonly expiresAt?: string;
  readonly permissions?: string[];
}

/**
 * Validation error structure
 */
export interface ValidationError {
  readonly path: string;
  readonly message: string;
  readonly code: string;
  readonly severity: 'error' | 'warning' | 'info';
  readonly line?: number;
  readonly column?: number;
}

// ============================================================================
// Zod Schema Validators
// ============================================================================

/**
 * Zod schema for OpenAPI specification validation
 * Provides runtime type checking with compile-time inference
 */
export const OpenAPISpecificationSchema = z.object({
  openapi: z.string().regex(/^3\.\d+\.\d+$/),
  info: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    termsOfService: z.string().url().optional(),
    contact: z.object({
      name: z.string().optional(),
      url: z.string().url().optional(),
      email: z.string().email().optional(),
    }).optional(),
    license: z.object({
      name: z.string().min(1),
      url: z.string().url().optional(),
    }).optional(),
    version: z.string().min(1),
    'x-dreamfactory-service': z.string().optional(),
    'x-dreamfactory-generated': z.string().optional(),
  }),
  servers: z.array(z.object({
    url: z.string().url(),
    description: z.string().optional(),
    variables: z.record(z.object({
      enum: z.array(z.string()).optional(),
      default: z.string(),
      description: z.string().optional(),
    })).optional(),
  })).optional(),
  paths: z.record(z.any()), // Complex nested validation for paths
  components: z.any().optional(), // Complex nested validation for components
  security: z.array(z.record(z.array(z.string()))).optional(),
  tags: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    externalDocs: z.object({
      description: z.string().optional(),
      url: z.string().url(),
    }).optional(),
  })).optional(),
  externalDocs: z.object({
    description: z.string().optional(),
    url: z.string().url(),
  }).optional(),
}) satisfies z.ZodType<OpenAPISpecification>;

/**
 * Zod schema for API documentation row data validation
 */
export const ApiDocsRowDataSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  description: z.string(),
  group: z.string(),
  type: z.string(),
  endpoint: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
  parameters: z.array(z.object({
    name: z.string().min(1),
    type: z.string(),
    required: z.boolean(),
    description: z.string().optional(),
    defaultValue: z.any().optional(),
    example: z.any().optional(),
    constraints: z.object({
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
      minimum: z.number().optional(),
      maximum: z.number().optional(),
      enum: z.array(z.any()).optional(),
      format: z.string().optional(),
    }).optional(),
  })).optional(),
  responses: z.array(z.object({
    statusCode: z.number().min(100).max(599),
    description: z.string(),
    contentType: z.string(),
    schema: z.any().optional(),
    example: z.any().optional(),
    headers: z.record(z.string()).optional(),
  })).optional(),
  examples: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    request: z.object({
      method: z.string(),
      url: z.string().url(),
      headers: z.record(z.string()).optional(),
      body: z.any().optional(),
    }).optional(),
    response: z.object({
      statusCode: z.number().min(100).max(599),
      headers: z.record(z.string()).optional(),
      body: z.any().optional(),
    }).optional(),
  })).optional(),
  lastModified: z.string().optional(),
  version: z.string().optional(),
  deprecated: z.boolean().optional(),
}) satisfies z.ZodType<ApiDocsRowData>;

/**
 * Zod schema for API key information validation
 */
export const ApiKeyInfoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  key: z.string().min(1),
  sessionToken: z.string().optional(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  permissions: z.array(z.object({
    resource: z.string().min(1),
    actions: z.array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])),
    filters: z.record(z.any()).optional(),
  })),
  isActive: z.boolean(),
  lastUsed: z.string().datetime().optional(),
  usageCount: z.number().nonnegative().optional(),
  rateLimit: z.object({
    requestsPerMinute: z.number().positive(),
    requestsPerHour: z.number().positive(),
    requestsPerDay: z.number().positive(),
    burstLimit: z.number().positive().optional(),
  }).optional(),
}) satisfies z.ZodType<ApiKeyInfo>;

/**
 * Zod schema for service information validation
 */
export const ServiceInfoSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(1),
  label: z.string().min(1),
  description: z.string(),
  type: z.string(),
  isActive: z.boolean(),
  mutable: z.boolean(),
  deletable: z.boolean(),
  createdDate: z.string().datetime(),
  lastModifiedDate: z.string().datetime(),
  config: z.record(z.any()),
  apiDocumentation: z.object({
    hasDocumentation: z.boolean(),
    documentationUrl: z.string().url().optional(),
    swaggerUrl: z.string().url().optional(),
    postmanCollectionUrl: z.string().url().optional(),
    lastGenerated: z.string().datetime().optional(),
    version: z.string().optional(),
    endpointCount: z.number().nonnegative().optional(),
  }).optional(),
  openApiSpec: OpenAPISpecificationSchema.optional(),
  endpoints: z.array(z.object({
    path: z.string().min(1),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    operationId: z.string().optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    parameters: z.array(z.any()).optional(),
    authenticated: z.boolean().optional(),
    deprecated: z.boolean().optional(),
  })).optional(),
  health: z.object({
    status: z.enum(['healthy', 'degraded', 'unhealthy', 'unknown']),
    lastChecked: z.string().datetime(),
    responseTime: z.number().nonnegative().optional(),
    uptime: z.number().nonnegative().optional(),
    errorRate: z.number().min(0).max(1).optional(),
    details: z.record(z.any()).optional(),
  }).optional(),
}) satisfies z.ZodType<ServiceInfo>;

/**
 * Zod schema for OpenAPI preview component props validation
 */
export const OpenAPIPreviewPropsSchema = z.object({
  serviceId: z.string().optional(),
  serviceName: z.string().optional(),
  openApiSpec: OpenAPISpecificationSchema.optional(),
  apiKey: z.string().optional(),
  sessionToken: z.string().optional(),
  baseUrl: z.string().url().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  className: z.string().optional(),
  style: z.any().optional(), // React.CSSProperties
  showTryItOut: z.boolean().optional(),
  showCodeSamples: z.boolean().optional(),
  enableAuth: z.boolean().optional(),
  autoLoadSpec: z.boolean().optional(),
  refreshInterval: z.number().positive().optional(),
  onSpecLoaded: z.function().optional(),
  onApiCall: z.function().optional(),
  onError: z.function().optional(),
  onAuthSuccess: z.function().optional(),
  onAuthFailure: z.function().optional(),
  fallback: z.any().optional(), // ReactNode
  loadingComponent: z.any().optional(), // ReactNode
  errorBoundary: z.any().optional(), // ComponentProps<any>
}).strict() satisfies z.ZodType<OpenAPIPreviewProps>;

/**
 * Zod schema for Swagger UI configuration validation
 */
export const SwaggerUIConfigSchema = z.object({
  url: z.string().url().optional(),
  spec: OpenAPISpecificationSchema.optional(),
  domId: z.string().optional(),
  dom_id: z.string().optional(),
  layout: z.enum(['BaseLayout', 'StandaloneLayout']).optional(),
  deepLinking: z.boolean().optional(),
  displayOperationId: z.boolean().optional(),
  defaultModelsExpandDepth: z.number().optional(),
  defaultModelExpandDepth: z.number().optional(),
  defaultModelRendering: z.enum(['example', 'model']).optional(),
  displayRequestDuration: z.boolean().optional(),
  docExpansion: z.enum(['list', 'full', 'none']).optional(),
  filter: z.union([z.boolean(), z.string()]).optional(),
  maxDisplayedTags: z.number().positive().optional(),
  operationsSorter: z.union([
    z.enum(['alpha', 'method']),
    z.function()
  ]).optional(),
  showExtensions: z.boolean().optional(),
  showCommonExtensions: z.boolean().optional(),
  tagsSorter: z.union([z.literal('alpha'), z.function()]).optional(),
  tryItOutEnabled: z.boolean().optional(),
  requestInterceptor: z.function().optional(),
  responseInterceptor: z.function().optional(),
  onComplete: z.function().optional(),
  onFailure: z.function().optional(),
  authorizations: z.record(z.any()).optional(),
  modelPropertyMacro: z.function().optional(),
  parameterMacro: z.function().optional(),
  plugins: z.array(z.any()).optional(),
  presets: z.array(z.any()).optional(),
  customStyles: z.string().optional(),
  validatorUrl: z.union([z.string().url(), z.null()]).optional(),
  oauth2RedirectUrl: z.string().url().optional(),
  persistAuthorization: z.boolean().optional(),
  'x-dreamfactory-service': z.string().optional(),
  'x-dreamfactory-baseUrl': z.string().url().optional(),
  'x-dreamfactory-apiKey': z.string().optional(),
  'x-dreamfactory-sessionToken': z.string().optional(),
}).strict() satisfies z.ZodType<SwaggerUIConfig>;

// ============================================================================
// Type Exports and Utilities
// ============================================================================

/**
 * Utility type for extracting Zod schema types
 */
export type InferZodType<T extends z.ZodType> = z.infer<T>;

/**
 * Union type for all API documentation related data
 */
export type ApiDocumentationData = 
  | ApiDocsRowData
  | OpenAPISpecification
  | ServiceInfo
  | ApiKeyInfo;

/**
 * Union type for all component prop types
 */
export type ComponentPropsUnion = 
  | OpenAPIPreviewProps
  | ApiDocumentationPreviewProps
  | ApiTestingInterfaceProps
  | OpenAPISpecViewerProps;

/**
 * Utility type for partial updates
 */
export type PartialUpdate<T> = Partial<T> & Pick<T, 'id' | 'name'>;

/**
 * Type guard for OpenAPI specification
 */
export function isOpenAPISpecification(value: unknown): value is OpenAPISpecification {
  return OpenAPISpecificationSchema.safeParse(value).success;
}

/**
 * Type guard for API docs row data
 */
export function isApiDocsRowData(value: unknown): value is ApiDocsRowData {
  return ApiDocsRowDataSchema.safeParse(value).success;
}

/**
 * Type guard for service info
 */
export function isServiceInfo(value: unknown): value is ServiceInfo {
  return ServiceInfoSchema.safeParse(value).success;
}

/**
 * Type guard for API key info
 */
export function isApiKeyInfo(value: unknown): value is ApiKeyInfo {
  return ApiKeyInfoSchema.safeParse(value).success;
}

/**
 * Re-export commonly used types for convenience
 */
export type {
  SwaggerUIBundle,
  ComponentProps,
  ReactNode,
};

// Export all schemas for external use
export const schemas = {
  OpenAPISpecification: OpenAPISpecificationSchema,
  ApiDocsRowData: ApiDocsRowDataSchema,
  ApiKeyInfo: ApiKeyInfoSchema,
  ServiceInfo: ServiceInfoSchema,
  OpenAPIPreviewProps: OpenAPIPreviewPropsSchema,
  SwaggerUIConfig: SwaggerUIConfigSchema,
} as const;

/**
 * Default values for common configurations
 */
export const DEFAULT_SWAGGER_CONFIG: Partial<SwaggerUIConfig> = {
  layout: 'BaseLayout',
  deepLinking: true,
  displayOperationId: false,
  defaultModelsExpandDepth: 1,
  defaultModelExpandDepth: 1,
  defaultModelRendering: 'example',
  displayRequestDuration: true,
  docExpansion: 'list',
  filter: true,
  showExtensions: false,
  showCommonExtensions: false,
  tryItOutEnabled: true,
  persistAuthorization: true,
} as const;

export const DEFAULT_OPENAPI_PREVIEW_PROPS: Partial<OpenAPIPreviewProps> = {
  theme: 'auto',
  showTryItOut: true,
  showCodeSamples: true,
  enableAuth: true,
  autoLoadSpec: true,
  refreshInterval: 30000, // 30 seconds
} as const;