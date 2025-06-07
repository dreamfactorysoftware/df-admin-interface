/**
 * @fileoverview TypeScript interface definitions and type exports for OpenAPI preview components
 * @description API documentation data structures, component props, API key information, and service response types
 * Provides type-safe contracts with Zod schema validators for the OpenAPI documentation viewing workflow
 * 
 * @version 1.0.0
 * @license MIT
 * @author DreamFactory Team
 * 
 * Features:
 * - TypeScript 5.8+ interface definitions for type safety per technical specification requirements
 * - Zod schema validators integrated with React Hook Form per React/Next.js Integration Requirements
 * - F-006 API Documentation and Testing component data structure definitions per Section 2.1 Feature Catalog
 * - @swagger-ui/react integration type definitions for enhanced type safety
 * - React component prop interfaces following TypeScript 5.8+ strict type safety requirements
 * - API key management types and service response structures for type-safe data handling
 * - OpenAPI specification type definitions for SwaggerUI configuration
 */

import type { ReactNode, ComponentType, HTMLAttributes, RefObject } from 'react'
import type { z } from 'zod'
import type { 
  UseFormReturn,
  FieldValues,
  Path,
  PathValue,
  Control,
  RegisterOptions
} from 'react-hook-form'
import type { 
  Service,
  ServiceRow,
  OpenAPISpec,
  OpenAPIPath,
  OpenAPIOperation,
  OpenAPISchema,
  OpenAPIResponse,
  OpenAPIParameter,
  HTTPMethod,
  ServiceStatus,
  ServiceCategory
} from '../../../types/services'
import type { 
  ApiResponse,
  ApiRequest,
  ApiError,
  ListResponse,
  QueryOptions,
  MutationOptions,
  CacheConfig
} from '../../../types/api'
import type { 
  FormFieldConfig,
  FormFieldError,
  EnhancedValidationState
} from '../../../types/forms'
import type { 
  ThemeMode,
  AccessibilityProps,
  SizeVariant,
  ColorVariant,
  ValidationState
} from '../../../types/ui'

// =============================================================================
// SWAGGER UI INTEGRATION TYPES
// =============================================================================

/**
 * SwaggerUI configuration interface
 * Enhanced for React integration with theme support and customization
 */
export interface SwaggerUIConfig {
  /** OpenAPI specification URL or object */
  spec?: string | object
  
  /** SwaggerUI configuration options */
  url?: string
  
  /** SwaggerUI layout configuration */
  layout?: 'BaseLayout' | 'StandaloneLayout'
  
  /** Enable deep linking */
  deepLinking?: boolean
  
  /** Display operation ID */
  displayOperationId?: boolean
  
  /** Default models expand depth */
  defaultModelsExpandDepth?: number
  
  /** Default model expand depth */
  defaultModelExpandDepth?: number
  
  /** Default model rendering */
  defaultModelRendering?: 'example' | 'model'
  
  /** Display request duration */
  displayRequestDuration?: boolean
  
  /** Doc expansion mode */
  docExpansion?: 'list' | 'full' | 'none'
  
  /** Filter options */
  filter?: boolean | string
  
  /** Maximum displayed tags */
  maxDisplayedTags?: number
  
  /** Show extensions */
  showExtensions?: boolean
  
  /** Show common extensions */
  showCommonExtensions?: boolean
  
  /** Use unsafe markdown */
  useUnsafeMarkdown?: boolean
  
  /** Try it out enabled */
  tryItOutEnabled?: boolean
  
  /** Request interceptor */
  requestInterceptor?: (req: any) => any
  
  /** Response interceptor */
  responseInterceptor?: (res: any) => any
  
  /** Custom plugins */
  plugins?: any[]
  
  /** Custom presets */
  presets?: any[]
  
  /** Security definitions */
  securityDefinitions?: Record<string, any>
  
  /** Theme configuration */
  theme?: {
    /** Theme mode */
    mode: ThemeMode
    /** Custom CSS variables */
    variables?: Record<string, string>
    /** Custom CSS classes */
    customCSS?: string
  }
  
  /** DreamFactory specific configuration */
  dreamfactory?: {
    /** Base API URL */
    baseUrl: string
    /** Authentication headers */
    headers?: Record<string, string>
    /** Session token */
    sessionToken?: string
    /** API key */
    apiKey?: string
    /** Service name */
    serviceName?: string
    /** Service type */
    serviceType?: string
  }
  
  /** React-specific configuration */
  react?: {
    /** Component container ID */
    containerId?: string
    /** Custom error boundary */
    errorBoundary?: ComponentType<{ children: ReactNode; error?: Error }>
    /** Loading component */
    loadingComponent?: ComponentType
    /** Custom DOM element selector */
    domNode?: string | HTMLElement
  }
  
  /** Performance configuration */
  performance?: {
    /** Enable lazy loading */
    lazyLoad?: boolean
    /** Virtual scrolling for large specs */
    virtualScrolling?: boolean
    /** Maximum operations to render */
    maxOperations?: number
    /** Debounce delay for search */
    searchDebounce?: number
  }
  
  /** Accessibility configuration */
  accessibility?: AccessibilityProps & {
    /** Enable keyboard navigation */
    keyboardNavigation?: boolean
    /** Screen reader support */
    screenReader?: boolean
    /** High contrast mode */
    highContrast?: boolean
    /** Focus management */
    focusManagement?: boolean
  }
}

/**
 * Zod schema for SwaggerUI configuration validation
 * Ensures type safety and runtime validation
 */
export const swaggerUIConfigSchema = z.object({
  spec: z.union([z.string().url(), z.object({}).passthrough()]).optional(),
  url: z.string().url().optional(),
  layout: z.enum(['BaseLayout', 'StandaloneLayout']).default('BaseLayout'),
  deepLinking: z.boolean().default(true),
  displayOperationId: z.boolean().default(false),
  defaultModelsExpandDepth: z.number().min(0).max(10).default(1),
  defaultModelExpandDepth: z.number().min(0).max(10).default(1),
  defaultModelRendering: z.enum(['example', 'model']).default('example'),
  displayRequestDuration: z.boolean().default(true),
  docExpansion: z.enum(['list', 'full', 'none']).default('list'),
  filter: z.union([z.boolean(), z.string()]).default(false),
  maxDisplayedTags: z.number().min(1).default(100),
  showExtensions: z.boolean().default(false),
  showCommonExtensions: z.boolean().default(false),
  useUnsafeMarkdown: z.boolean().default(false),
  tryItOutEnabled: z.boolean().default(true),
  theme: z.object({
    mode: z.enum(['light', 'dark', 'system']).default('light'),
    variables: z.record(z.string()).optional(),
    customCSS: z.string().optional()
  }).optional(),
  dreamfactory: z.object({
    baseUrl: z.string().url(),
    headers: z.record(z.string()).optional(),
    sessionToken: z.string().optional(),
    apiKey: z.string().optional(),
    serviceName: z.string().min(1),
    serviceType: z.string().min(1)
  }).optional(),
  react: z.object({
    containerId: z.string().optional(),
    domNode: z.union([z.string(), z.any()]).optional()
  }).optional(),
  performance: z.object({
    lazyLoad: z.boolean().default(true),
    virtualScrolling: z.boolean().default(false),
    maxOperations: z.number().min(1).default(1000),
    searchDebounce: z.number().min(0).default(300)
  }).optional(),
  accessibility: z.object({
    keyboardNavigation: z.boolean().default(true),
    screenReader: z.boolean().default(true),
    highContrast: z.boolean().default(false),
    focusManagement: z.boolean().default(true)
  }).optional()
}).strict()

/**
 * Inferred SwaggerUI configuration type from Zod schema
 */
export type SwaggerUIConfigData = z.infer<typeof swaggerUIConfigSchema>

// =============================================================================
// API DOCUMENTATION TYPES
// =============================================================================

/**
 * API documentation row data interface
 * Enhanced from Angular version with React Query optimization
 */
export interface ApiDocsRowData {
  /** Service identifier */
  id: number
  
  /** Service name (unique) */
  name: string
  
  /** Display label */
  label: string
  
  /** Service description */
  description: string
  
  /** Service group/category */
  group: ServiceCategory
  
  /** Service type */
  type: string
  
  /** Service status */
  status?: ServiceStatus
  
  /** Whether service is active */
  isActive?: boolean
  
  /** OpenAPI specification metadata */
  openapi?: {
    /** Spec URL */
    specUrl?: string
    /** Spec version */
    version?: string
    /** Last updated */
    lastUpdated?: string
    /** Number of operations */
    operationCount?: number
    /** Spec file size */
    specSize?: number
  }
  
  /** Documentation metadata */
  documentation?: {
    /** Has generated documentation */
    hasDocumentation: boolean
    /** Documentation URL */
    url?: string
    /** Last generated */
    lastGenerated?: string
    /** Generation status */
    generationStatus?: 'pending' | 'generating' | 'completed' | 'failed'
  }
  
  /** Usage statistics */
  usage?: {
    /** Total API calls */
    totalCalls?: number
    /** Calls in last 24 hours */
    dailyCalls?: number
    /** Last accessed */
    lastAccessed?: string
    /** Popular endpoints */
    popularEndpoints?: string[]
  }
  
  /** Health information */
  health?: {
    /** Health status */
    status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown'
    /** Last health check */
    lastCheck?: string
    /** Response time */
    responseTime?: number
    /** Error rate */
    errorRate?: number
  }
}

/**
 * Zod schema for API documentation row data validation
 */
export const apiDocsRowDataSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(1, 'Service name is required'),
  label: z.string().min(1, 'Service label is required'),
  description: z.string(),
  group: z.enum([
    'database', 'email', 'file', 'oauth', 'ldap', 'saml',
    'script', 'cache', 'push', 'remote_web', 'soap', 'rpc',
    'http', 'api_key', 'jwt', 'custom'
  ]),
  type: z.string().min(1),
  status: z.enum(['active', 'inactive', 'error', 'testing', 'deploying', 'updating']).optional(),
  isActive: z.boolean().optional(),
  openapi: z.object({
    specUrl: z.string().url().optional(),
    version: z.string().optional(),
    lastUpdated: z.string().datetime().optional(),
    operationCount: z.number().min(0).optional(),
    specSize: z.number().min(0).optional()
  }).optional(),
  documentation: z.object({
    hasDocumentation: z.boolean(),
    url: z.string().url().optional(),
    lastGenerated: z.string().datetime().optional(),
    generationStatus: z.enum(['pending', 'generating', 'completed', 'failed']).optional()
  }).optional(),
  usage: z.object({
    totalCalls: z.number().min(0).optional(),
    dailyCalls: z.number().min(0).optional(),
    lastAccessed: z.string().datetime().optional(),
    popularEndpoints: z.array(z.string()).optional()
  }).optional(),
  health: z.object({
    status: z.enum(['healthy', 'unhealthy', 'degraded', 'unknown']),
    lastCheck: z.string().datetime().optional(),
    responseTime: z.number().min(0).optional(),
    errorRate: z.number().min(0).max(100).optional()
  }).optional()
}).strict()

/**
 * API documentation list configuration
 * Enhanced for React Table and virtual scrolling
 */
export interface ApiDocsListConfig {
  /** Table configuration */
  table?: {
    /** Enable virtual scrolling */
    virtualScrolling: boolean
    /** Page size for pagination */
    pageSize: number
    /** Enable sorting */
    sorting: boolean
    /** Enable filtering */
    filtering: boolean
    /** Enable column resizing */
    columnResizing: boolean
    /** Enable column reordering */
    columnReordering: boolean
    /** Sticky header */
    stickyHeader: boolean
  }
  
  /** Search configuration */
  search?: {
    /** Enable global search */
    enabled: boolean
    /** Search placeholder text */
    placeholder: string
    /** Search debounce delay */
    debounceMs: number
    /** Search fields */
    searchFields: Array<keyof ApiDocsRowData>
    /** Minimum search length */
    minLength: number
  }
  
  /** Filter configuration */
  filters?: {
    /** Available filter options */
    options: Array<{
      key: keyof ApiDocsRowData
      label: string
      type: 'select' | 'multiselect' | 'text' | 'date' | 'boolean'
      values?: Array<{ label: string; value: any }>
    }>
    /** Default filters */
    defaults?: Record<string, any>
  }
  
  /** Display configuration */
  display?: {
    /** Columns to show */
    columns: Array<{
      key: keyof ApiDocsRowData
      label: string
      sortable?: boolean
      filterable?: boolean
      width?: number | string
      render?: (value: any, row: ApiDocsRowData) => ReactNode
    }>
    /** Row actions */
    actions?: Array<{
      label: string
      icon?: string
      action: (row: ApiDocsRowData) => void
      visible?: (row: ApiDocsRowData) => boolean
      disabled?: (row: ApiDocsRowData) => boolean
    }>
    /** Bulk actions */
    bulkActions?: Array<{
      label: string
      icon?: string
      action: (rows: ApiDocsRowData[]) => void
      confirm?: boolean
    }>
  }
  
  /** Performance configuration */
  performance?: {
    /** Enable lazy loading */
    lazyLoad: boolean
    /** Cache configuration */
    cache?: CacheConfig
    /** Refresh interval */
    refreshInterval?: number
    /** Optimistic updates */
    optimisticUpdates: boolean
  }
}

/**
 * Zod schema for API documentation list configuration
 */
export const apiDocsListConfigSchema = z.object({
  table: z.object({
    virtualScrolling: z.boolean().default(true),
    pageSize: z.number().min(10).max(1000).default(50),
    sorting: z.boolean().default(true),
    filtering: z.boolean().default(true),
    columnResizing: z.boolean().default(true),
    columnReordering: z.boolean().default(false),
    stickyHeader: z.boolean().default(true)
  }).optional(),
  search: z.object({
    enabled: z.boolean().default(true),
    placeholder: z.string().default('Search API documentation...'),
    debounceMs: z.number().min(0).max(1000).default(300),
    searchFields: z.array(z.string()).default(['name', 'label', 'description']),
    minLength: z.number().min(1).max(10).default(2)
  }).optional(),
  performance: z.object({
    lazyLoad: z.boolean().default(true),
    refreshInterval: z.number().min(1000).optional(),
    optimisticUpdates: z.boolean().default(true)
  }).optional()
}).strict()

// =============================================================================
// API KEY MANAGEMENT TYPES
// =============================================================================

/**
 * API key information interface
 * Enhanced from Angular version with security features
 */
export interface ApiKeyInfo {
  /** API key identifier */
  id?: string
  
  /** Key name/label */
  name: string
  
  /** API key value */
  apiKey: string
  
  /** Key description */
  description?: string
  
  /** Key creation date */
  createdAt?: string
  
  /** Key expiration date */
  expiresAt?: string
  
  /** Key last used date */
  lastUsed?: string
  
  /** Key status */
  status?: 'active' | 'inactive' | 'expired' | 'revoked'
  
  /** Key permissions/scopes */
  scopes?: string[]
  
  /** Rate limiting configuration */
  rateLimit?: {
    /** Requests per minute */
    requestsPerMinute?: number
    /** Requests per hour */
    requestsPerHour?: number
    /** Requests per day */
    requestsPerDay?: number
    /** Burst allowance */
    burst?: number
  }
  
  /** Usage statistics */
  usage?: {
    /** Total requests */
    totalRequests?: number
    /** Requests in last 24 hours */
    dailyRequests?: number
    /** Error count */
    errorCount?: number
    /** Last error */
    lastError?: string
  }
  
  /** Security configuration */
  security?: {
    /** Allowed origins */
    allowedOrigins?: string[]
    /** Allowed IP addresses */
    allowedIPs?: string[]
    /** Require HTTPS */
    requireHTTPS?: boolean
    /** Enable logging */
    enableLogging?: boolean
  }
  
  /** Key metadata */
  metadata?: {
    /** Created by user */
    createdBy?: string
    /** Updated by user */
    updatedBy?: string
    /** Key version */
    version?: number
    /** Environment */
    environment?: 'development' | 'staging' | 'production'
    /** Tags */
    tags?: string[]
  }
}

/**
 * Zod schema for API key information validation
 */
export const apiKeyInfoSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'API key name is required').max(100),
  apiKey: z.string().min(1, 'API key value is required'),
  description: z.string().max(500).optional(),
  createdAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  lastUsed: z.string().datetime().optional(),
  status: z.enum(['active', 'inactive', 'expired', 'revoked']).default('active'),
  scopes: z.array(z.string()).optional(),
  rateLimit: z.object({
    requestsPerMinute: z.number().min(1).optional(),
    requestsPerHour: z.number().min(1).optional(),
    requestsPerDay: z.number().min(1).optional(),
    burst: z.number().min(1).optional()
  }).optional(),
  usage: z.object({
    totalRequests: z.number().min(0).optional(),
    dailyRequests: z.number().min(0).optional(),
    errorCount: z.number().min(0).optional(),
    lastError: z.string().optional()
  }).optional(),
  security: z.object({
    allowedOrigins: z.array(z.string().url()).optional(),
    allowedIPs: z.array(z.string().ip()).optional(),
    requireHTTPS: z.boolean().default(true),
    enableLogging: z.boolean().default(true)
  }).optional(),
  metadata: z.object({
    createdBy: z.string().optional(),
    updatedBy: z.string().optional(),
    version: z.number().min(1).default(1),
    environment: z.enum(['development', 'staging', 'production']).optional(),
    tags: z.array(z.string()).optional()
  }).optional()
}).strict()

/**
 * Service API keys collection interface
 * Enhanced with React Query optimization
 */
export interface ServiceApiKeys {
  /** Service identifier */
  serviceId: number
  
  /** Service name */
  serviceName?: string
  
  /** Collection of API keys */
  keys: ApiKeyInfo[]
  
  /** Last updated timestamp */
  lastUpdated?: string
  
  /** Cache metadata */
  cache?: {
    /** Cache timestamp */
    timestamp: string
    /** Cache TTL */
    ttl: number
    /** Cache source */
    source: 'server' | 'cache' | 'optimistic'
  }
  
  /** Pagination information */
  pagination?: {
    /** Current page */
    page: number
    /** Page size */
    pageSize: number
    /** Total count */
    total: number
    /** Has next page */
    hasNext: boolean
    /** Has previous page */
    hasPrevious: boolean
  }
  
  /** Sorting configuration */
  sorting?: {
    /** Sort field */
    field: keyof ApiKeyInfo
    /** Sort direction */
    direction: 'asc' | 'desc'
  }
  
  /** Filter configuration */
  filters?: {
    /** Status filter */
    status?: Array<ApiKeyInfo['status']>
    /** Search query */
    search?: string
    /** Date range */
    dateRange?: {
      start: string
      end: string
    }
  }
}

/**
 * Zod schema for service API keys validation
 */
export const serviceApiKeysSchema = z.object({
  serviceId: z.number().positive(),
  serviceName: z.string().optional(),
  keys: z.array(apiKeyInfoSchema),
  lastUpdated: z.string().datetime().optional(),
  cache: z.object({
    timestamp: z.string().datetime(),
    ttl: z.number().min(0),
    source: z.enum(['server', 'cache', 'optimistic'])
  }).optional(),
  pagination: z.object({
    page: z.number().min(1),
    pageSize: z.number().min(1).max(1000),
    total: z.number().min(0),
    hasNext: z.boolean(),
    hasPrevious: z.boolean()
  }).optional(),
  sorting: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc'])
  }).optional(),
  filters: z.object({
    status: z.array(z.enum(['active', 'inactive', 'expired', 'revoked'])).optional(),
    search: z.string().optional(),
    dateRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime()
    }).optional()
  }).optional()
}).strict()

// =============================================================================
// COMPONENT PROP INTERFACES
// =============================================================================

/**
 * OpenAPI viewer component props
 * Enhanced for React 19 patterns with comprehensive configuration
 */
export interface OpenAPIViewerProps extends HTMLAttributes<HTMLDivElement> {
  /** Service information */
  service: Service | ServiceRow
  
  /** SwaggerUI configuration */
  config?: Partial<SwaggerUIConfig>
  
  /** Theme mode */
  theme?: ThemeMode
  
  /** Loading state */
  loading?: boolean
  
  /** Error state */
  error?: ApiError | Error | null
  
  /** API key for authentication */
  apiKey?: string
  
  /** Session token for authentication */
  sessionToken?: string
  
  /** Custom height */
  height?: string | number
  
  /** Enable download functionality */
  enableDownload?: boolean
  
  /** Enable API key selection */
  enableApiKeySelection?: boolean
  
  /** Enable theme switching */
  enableThemeSwitch?: boolean
  
  /** Custom actions */
  actions?: Array<{
    label: string
    icon?: ReactNode
    onClick: () => void
    disabled?: boolean
    loading?: boolean
  }>
  
  /** Event handlers */
  onSpecLoad?: (spec: OpenAPISpec) => void
  onSpecError?: (error: Error) => void
  onApiKeyChange?: (apiKey: string) => void
  onThemeChange?: (theme: ThemeMode) => void
  onDownload?: (format: 'json' | 'yaml', spec: OpenAPISpec) => void
  
  /** Performance configuration */
  performance?: {
    /** Enable lazy loading */
    lazyLoad?: boolean
    /** Debounce search */
    searchDebounce?: number
    /** Virtual scrolling */
    virtualScrolling?: boolean
  }
  
  /** Accessibility configuration */
  accessibility?: AccessibilityProps
  
  /** Test utilities */
  testId?: string
  
  /** Reference to SwaggerUI instance */
  ref?: RefObject<any>
}

/**
 * Zod schema for OpenAPI viewer props validation
 */
export const openAPIViewerPropsSchema = z.object({
  service: z.object({
    id: z.number().positive(),
    name: z.string().min(1),
    type: z.string().min(1)
  }).passthrough(),
  config: swaggerUIConfigSchema.partial().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  loading: z.boolean().optional(),
  error: z.any().optional(),
  apiKey: z.string().optional(),
  sessionToken: z.string().optional(),
  height: z.union([z.string(), z.number()]).optional(),
  enableDownload: z.boolean().default(true),
  enableApiKeySelection: z.boolean().default(true),
  enableThemeSwitch: z.boolean().default(true),
  performance: z.object({
    lazyLoad: z.boolean().default(true),
    searchDebounce: z.number().min(0).max(1000).default(300),
    virtualScrolling: z.boolean().default(false)
  }).optional(),
  testId: z.string().optional()
}).passthrough()

/**
 * API documentation list component props
 * Enhanced for TanStack Table integration
 */
export interface ApiDocsListProps extends HTMLAttributes<HTMLDivElement> {
  /** API documentation data */
  data?: ApiDocsRowData[]
  
  /** Loading state */
  loading?: boolean
  
  /** Error state */
  error?: ApiError | Error | null
  
  /** List configuration */
  config?: Partial<ApiDocsListConfig>
  
  /** Search query */
  searchQuery?: string
  
  /** Active filters */
  filters?: Record<string, any>
  
  /** Sorting configuration */
  sorting?: Array<{
    id: string
    desc: boolean
  }>
  
  /** Pagination state */
  pagination?: {
    pageIndex: number
    pageSize: number
  }
  
  /** Selection state */
  selection?: {
    /** Selected row IDs */
    selectedIds: Set<string | number>
    /** Enable multi-selection */
    enableMulti?: boolean
    /** Enable selection */
    enabled?: boolean
  }
  
  /** Event handlers */
  onRowClick?: (row: ApiDocsRowData) => void
  onRowDoubleClick?: (row: ApiDocsRowData) => void
  onSelectionChange?: (selectedIds: Set<string | number>) => void
  onSearchChange?: (query: string) => void
  onFiltersChange?: (filters: Record<string, any>) => void
  onSortingChange?: (sorting: Array<{ id: string; desc: boolean }>) => void
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void
  onRefresh?: () => void
  
  /** Custom renderers */
  renderToolbar?: () => ReactNode
  renderEmptyState?: () => ReactNode
  renderLoadingState?: () => ReactNode
  renderErrorState?: (error: Error) => ReactNode
  
  /** Size variant */
  size?: SizeVariant
  
  /** Test utilities */
  testId?: string
}

/**
 * API key selector component props
 * Enhanced for Headless UI integration
 */
export interface ApiKeySelectorProps extends HTMLAttributes<HTMLDivElement> {
  /** Available API keys */
  apiKeys?: ApiKeyInfo[]
  
  /** Selected API key */
  selectedKey?: string
  
  /** Loading state */
  loading?: boolean
  
  /** Error state */
  error?: ApiError | Error | null
  
  /** Placeholder text */
  placeholder?: string
  
  /** Enable copy functionality */
  enableCopy?: boolean
  
  /** Show key preview */
  showPreview?: boolean
  
  /** Key preview length */
  previewLength?: number
  
  /** Mask character */
  maskCharacter?: string
  
  /** Size variant */
  size?: SizeVariant
  
  /** Color variant */
  variant?: ColorVariant
  
  /** Disabled state */
  disabled?: boolean
  
  /** Event handlers */
  onChange?: (apiKey: string) => void
  onCopy?: (apiKey: string) => void
  onError?: (error: Error) => void
  
  /** Form integration */
  form?: {
    /** Form control */
    control?: Control<any>
    /** Field name */
    name?: string
    /** Validation rules */
    rules?: RegisterOptions
  }
  
  /** Accessibility configuration */
  accessibility?: AccessibilityProps
  
  /** Test utilities */
  testId?: string
}

/**
 * Zod schema for API key selector props validation
 */
export const apiKeySelectorPropsSchema = z.object({
  apiKeys: z.array(apiKeyInfoSchema).optional(),
  selectedKey: z.string().optional(),
  loading: z.boolean().optional(),
  error: z.any().optional(),
  placeholder: z.string().default('Select an API key...'),
  enableCopy: z.boolean().default(true),
  showPreview: z.boolean().default(true),
  previewLength: z.number().min(4).max(20).default(8),
  maskCharacter: z.string().length(1).default('•'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  variant: z.enum(['primary', 'secondary', 'success', 'warning', 'error']).default('primary'),
  disabled: z.boolean().optional(),
  testId: z.string().optional()
}).passthrough()

// =============================================================================
// SERVICE RESPONSE TYPES
// =============================================================================

/**
 * API documentation list response
 * Enhanced with React Query metadata
 */
export type ApiDocsListResponse = ListResponse<ApiDocsRowData>

/**
 * Service API keys response
 */
export type ServiceApiKeysResponse = ApiResponse<ServiceApiKeys>

/**
 * OpenAPI specification response
 */
export type OpenAPISpecResponse = ApiResponse<OpenAPISpec>

/**
 * API key creation response
 */
export type ApiKeyCreateResponse = ApiResponse<ApiKeyInfo>

/**
 * API key update response
 */
export type ApiKeyUpdateResponse = ApiResponse<ApiKeyInfo>

/**
 * API key deletion response
 */
export type ApiKeyDeleteResponse = ApiResponse<{ success: boolean; id: string }>

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * OpenAPI preview specific error types
 */
export interface OpenAPIPreviewError extends ApiError {
  /** Error category */
  category: 'swagger' | 'spec' | 'authentication' | 'network' | 'validation'
  
  /** OpenAPI context */
  context?: {
    /** Service information */
    service?: {
      id: number
      name: string
      type: string
    }
    /** SwaggerUI configuration */
    config?: Partial<SwaggerUIConfig>
    /** Spec information */
    spec?: {
      url?: string
      version?: string
      size?: number
    }
  }
  
  /** Suggested recovery actions */
  recoveryActions?: Array<{
    label: string
    action: () => void
    description?: string
  }>
  
  /** Related documentation */
  documentation?: {
    title: string
    url: string
  }
}

/**
 * API key management error
 */
export interface ApiKeyError extends ApiError {
  /** Error category */
  category: 'authentication' | 'authorization' | 'validation' | 'quota' | 'security'
  
  /** API key context */
  context?: {
    /** Key information */
    keyId?: string
    keyName?: string
    /** Service information */
    serviceId?: number
    serviceName?: string
    /** Operation that failed */
    operation?: 'create' | 'read' | 'update' | 'delete' | 'validate'
  }
  
  /** Security implications */
  security?: {
    /** Is security related */
    isSecurityIssue: boolean
    /** Requires immediate attention */
    requiresAttention: boolean
    /** Suggested security actions */
    securityActions?: string[]
  }
}

/**
 * SwaggerUI integration error
 */
export interface SwaggerUIError extends Error {
  /** SwaggerUI error type */
  type: 'initialization' | 'spec_load' | 'render' | 'interaction' | 'theme' | 'plugin'
  
  /** SwaggerUI context */
  context?: {
    /** SwaggerUI version */
    version?: string
    /** Configuration used */
    config?: Partial<SwaggerUIConfig>
    /** DOM element information */
    element?: {
      id?: string
      tagName?: string
      hasContent?: boolean
    }
  }
  
  /** Browser compatibility information */
  compatibility?: {
    /** Browser information */
    browser?: string
    /** Browser version */
    version?: string
    /** Supported features */
    features?: Record<string, boolean>
  }
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * OpenAPI preview state type
 * Enhanced for React state management
 */
export interface OpenAPIPreviewState {
  /** Current service */
  service?: Service | ServiceRow | null
  
  /** Loaded OpenAPI specification */
  spec?: OpenAPISpec | null
  
  /** SwaggerUI configuration */
  config: SwaggerUIConfig
  
  /** Selected API key */
  selectedApiKey?: string
  
  /** Available API keys */
  apiKeys: ApiKeyInfo[]
  
  /** Theme mode */
  theme: ThemeMode
  
  /** Loading states */
  loading: {
    spec: boolean
    apiKeys: boolean
    service: boolean
  }
  
  /** Error states */
  errors: {
    spec?: OpenAPIPreviewError | null
    apiKeys?: ApiKeyError | null
    swagger?: SwaggerUIError | null
  }
  
  /** UI state */
  ui: {
    /** SwaggerUI container height */
    height: string
    /** Sidebar collapsed */
    sidebarCollapsed: boolean
    /** Show settings panel */
    showSettings: boolean
    /** Enable auto-refresh */
    autoRefresh: boolean
    /** Refresh interval */
    refreshInterval: number
  }
  
  /** Performance metrics */
  performance?: {
    /** Spec load time */
    specLoadTime?: number
    /** Render time */
    renderTime?: number
    /** Last update */
    lastUpdate?: string
    /** Cache hit rate */
    cacheHitRate?: number
  }
}

/**
 * OpenAPI preview actions type
 * Enhanced for Zustand integration
 */
export interface OpenAPIPreviewActions {
  /** Load service and spec */
  loadService: (serviceId: number | string) => Promise<void>
  
  /** Update SwaggerUI configuration */
  updateConfig: (config: Partial<SwaggerUIConfig>) => void
  
  /** Select API key */
  selectApiKey: (apiKey: string) => void
  
  /** Toggle theme */
  toggleTheme: () => void
  
  /** Set theme */
  setTheme: (theme: ThemeMode) => void
  
  /** Refresh data */
  refresh: () => Promise<void>
  
  /** Download spec */
  downloadSpec: (format: 'json' | 'yaml') => void
  
  /** Copy API key */
  copyApiKey: (apiKey: string) => Promise<void>
  
  /** Clear errors */
  clearErrors: () => void
  
  /** Reset state */
  reset: () => void
  
  /** Update UI state */
  updateUI: (updates: Partial<OpenAPIPreviewState['ui']>) => void
}

/**
 * Combined OpenAPI preview store type
 */
export type OpenAPIPreviewStore = OpenAPIPreviewState & OpenAPIPreviewActions

// =============================================================================
// FORM SCHEMA TYPES
// =============================================================================

/**
 * OpenAPI viewer form schema
 * Enhanced for React Hook Form integration
 */
export interface OpenAPIViewerFormSchema {
  /** Service selection */
  serviceId: number
  
  /** API key selection */
  apiKey?: string
  
  /** Theme preference */
  theme: ThemeMode
  
  /** Display configuration */
  display: {
    /** Layout mode */
    layout: 'BaseLayout' | 'StandaloneLayout'
    /** Documentation expansion */
    docExpansion: 'list' | 'full' | 'none'
    /** Show operation IDs */
    showOperationIds: boolean
    /** Enable deep linking */
    deepLinking: boolean
    /** Enable try it out */
    tryItOut: boolean
  }
  
  /** Performance settings */
  performance: {
    /** Enable lazy loading */
    lazyLoad: boolean
    /** Maximum operations */
    maxOperations: number
    /** Search debounce */
    searchDebounce: number
  }
  
  /** Accessibility settings */
  accessibility: {
    /** Keyboard navigation */
    keyboardNavigation: boolean
    /** Screen reader support */
    screenReader: boolean
    /** High contrast mode */
    highContrast: boolean
  }
}

/**
 * Zod schema for OpenAPI viewer form validation
 */
export const openAPIViewerFormSchema = z.object({
  serviceId: z.number().positive('Please select a service'),
  apiKey: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).default('light'),
  display: z.object({
    layout: z.enum(['BaseLayout', 'StandaloneLayout']).default('BaseLayout'),
    docExpansion: z.enum(['list', 'full', 'none']).default('list'),
    showOperationIds: z.boolean().default(false),
    deepLinking: z.boolean().default(true),
    tryItOut: z.boolean().default(true)
  }),
  performance: z.object({
    lazyLoad: z.boolean().default(true),
    maxOperations: z.number().min(1).max(10000).default(1000),
    searchDebounce: z.number().min(0).max(1000).default(300)
  }),
  accessibility: z.object({
    keyboardNavigation: z.boolean().default(true),
    screenReader: z.boolean().default(true),
    highContrast: z.boolean().default(false)
  })
}).strict()

/**
 * Inferred form data type
 */
export type OpenAPIViewerFormData = z.infer<typeof openAPIViewerFormSchema>

// =============================================================================
// QUERY AND MUTATION TYPES
// =============================================================================

/**
 * OpenAPI preview query configuration
 * Enhanced for React Query optimization
 */
export interface OpenAPIPreviewQueryConfig extends QueryOptions {
  /** Service ID for queries */
  serviceId?: number
  
  /** Query type */
  type: 'spec' | 'apiKeys' | 'service' | 'documentation'
  
  /** Cache configuration */
  cache?: CacheConfig & {
    /** Spec-specific cache settings */
    specCache?: {
      /** Cache OpenAPI specs for longer */
      specTTL: number
      /** Invalidate on service changes */
      invalidateOnServiceChange: boolean
    }
    /** API key cache settings */
    apiKeyCache?: {
      /** Cache API keys for shorter time */
      keyTTL: number
      /** Secure cache storage */
      secureStorage: boolean
    }
  }
  
  /** Real-time updates */
  realtime?: {
    /** Enable WebSocket updates */
    enabled: boolean
    /** Update channel */
    channel?: string
    /** Update events */
    events?: string[]
  }
}

/**
 * OpenAPI preview mutation configuration
 * Enhanced for optimistic updates
 */
export interface OpenAPIPreviewMutationConfig extends MutationOptions {
  /** Mutation type */
  type: 'generateSpec' | 'updateConfig' | 'createApiKey' | 'deleteApiKey' | 'refreshService'
  
  /** Optimistic update configuration */
  optimistic?: {
    /** Enable optimistic updates */
    enabled: boolean
    /** Update function */
    updateFn?: (old: any, variables: any) => any
    /** Rollback on error */
    rollback: boolean
  }
  
  /** Cache invalidation */
  invalidation?: {
    /** Query keys to invalidate */
    keys: string[][]
    /** Invalidation strategy */
    strategy: 'immediate' | 'delayed' | 'selective'
  }
  
  /** Side effects */
  sideEffects?: {
    /** Show notifications */
    notifications: boolean
    /** Analytics tracking */
    analytics?: {
      event: string
      properties?: Record<string, any>
    }
    /** Navigation */
    navigation?: {
      /** Redirect on success */
      redirectTo?: string
      /** Refresh current route */
      refresh?: boolean
    }
  }
}

// =============================================================================
// EXPORT CONVENIENCE TYPES
// =============================================================================

/**
 * All OpenAPI preview component types
 */
export type OpenAPIPreviewTypes = 
  | OpenAPIViewerProps
  | ApiDocsListProps
  | ApiKeySelectorProps
  | SwaggerUIConfig
  | ApiDocsRowData
  | ApiKeyInfo
  | ServiceApiKeys

/**
 * All form-related types
 */
export type OpenAPIPreviewFormTypes = 
  | OpenAPIViewerFormSchema
  | OpenAPIViewerFormData

/**
 * All error types
 */
export type OpenAPIPreviewErrorTypes = 
  | OpenAPIPreviewError
  | ApiKeyError
  | SwaggerUIError

/**
 * All response types
 */
export type OpenAPIPreviewResponseTypes = 
  | ApiDocsListResponse
  | ServiceApiKeysResponse
  | OpenAPISpecResponse
  | ApiKeyCreateResponse
  | ApiKeyUpdateResponse
  | ApiKeyDeleteResponse

/**
 * All query and mutation types
 */
export type OpenAPIPreviewQueryTypes = 
  | OpenAPIPreviewQueryConfig
  | OpenAPIPreviewMutationConfig

/**
 * All state management types
 */
export type OpenAPIPreviewStateTypes = 
  | OpenAPIPreviewState
  | OpenAPIPreviewActions
  | OpenAPIPreviewStore

/**
 * @example
 * // Import specific component types
 * import type { OpenAPIViewerProps, ApiKeySelectorProps } from './types'
 * 
 * // Import form types
 * import type { OpenAPIViewerFormData } from './types'
 * 
 * // Import error types
 * import type { OpenAPIPreviewError } from './types'
 * 
 * // Import type groups
 * import type { OpenAPIPreviewTypes, OpenAPIPreviewFormTypes } from './types'
 * 
 * // Use in React components
 * const OpenAPIViewer: React.FC<OpenAPIViewerProps> = ({ service, config, ...props }) => {
 *   // Component implementation with full type safety
 * }
 * 
 * // Use with React Hook Form
 * const { register, handleSubmit, formState: { errors } } = useForm<OpenAPIViewerFormData>({
 *   resolver: zodResolver(openAPIViewerFormSchema),
 *   defaultValues: {
 *     theme: 'light',
 *     display: {
 *       layout: 'BaseLayout',
 *       docExpansion: 'list'
 *     }
 *   }
 * })
 * 
 * // Use with Zustand store
 * const useOpenAPIStore = create<OpenAPIPreviewStore>((set, get) => ({
 *   // State implementation
 *   service: null,
 *   spec: null,
 *   // Actions implementation
 *   loadService: async (serviceId) => {
 *     // Implementation with full type safety
 *   }
 * }))
 */