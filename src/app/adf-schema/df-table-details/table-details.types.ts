/**
 * TypeScript type definitions for table details components adapted for React patterns.
 * 
 * Defines interfaces for TableDetails, TableField, TableRelated, and form schemas 
 * compatible with React Hook Form and Zod validation while maintaining compatibility 
 * with DreamFactory API responses. Optimized for React 19, Next.js 15.1+, and 
 * enterprise-scale database schemas with 1000+ tables.
 * 
 * @fileoverview Table details component type definitions
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { z } from 'zod';
import type { 
  UseQueryOptions, 
  UseMutationOptions, 
  InfiniteQueryObserverOptions 
} from '@tanstack/react-query';
import type { SWRConfiguration } from 'swr';
import type { 
  ColumnDef, 
  RowData, 
  Table, 
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  PaginationState
} from '@tanstack/react-table';
import type { VirtualizerOptions } from '@tanstack/react-virtual';
import type { UseFormReturn, FieldErrors } from 'react-hook-form';

// Import base types from established type system
import type { 
  ApiResponse,
  ApiListResponse,
  ApiResourceResponse,
  ApiErrorResponse,
  PaginationMeta,
  ApiRequestOptions
} from '@/types/api';
import type { 
  SchemaTable,
  SchemaField,
  TableRelated,
  FieldType,
  TableIndex,
  TableConstraint,
  ForeignKey
} from '@/types/schema';
import type { DatabaseType } from '@/types/database';

// ============================================================================
// CORE TABLE DETAILS INTERFACES
// ============================================================================

/**
 * Enhanced table details interface for React component integration
 * Extends base SchemaTable with React-specific state and UI properties
 */
export interface TableDetails extends SchemaTable {
  // Enhanced metadata for React components
  /** Virtual scrolling row index for large datasets */
  virtualRowIndex?: number;
  
  /** Table loading state for React Query integration */
  isLoading: boolean;
  
  /** Table error state for error boundary integration */
  error?: ApiErrorResponse | null;
  
  /** Form validation state for React Hook Form */
  validationErrors?: FieldErrors<TableFormData>;
  
  /** UI expansion state for hierarchical tree display */
  isExpanded: boolean;
  
  /** Selection state for bulk operations */
  isSelected: boolean;
  
  /** Edit mode state for inline editing */
  isEditing: boolean;
  
  /** Optimistic update state for React Query mutations */
  isPending?: boolean;
  
  // Enhanced relationship data
  /** Related tables with enhanced metadata */
  relatedTables: EnhancedTableRelated[];
  
  /** Field definitions with React Hook Form compatibility */
  fieldDetails: EnhancedTableField[];
  
  // API generation status
  /** Generated API endpoints configuration */
  apiEndpoints?: ApiEndpointConfig[];
  
  /** API generation status */
  apiGenerationStatus: ApiGenerationStatus;
  
  // Performance optimization metadata
  /** Cache TTL for React Query (in seconds) */
  cacheTtl: number;
  
  /** Last cache update timestamp */
  lastCacheUpdate: string;
  
  /** Background refresh status */
  isRefreshing: boolean;
}

/**
 * Enhanced table field interface with form validation and UI state
 */
export interface EnhancedTableField extends SchemaField {
  // React Hook Form integration
  /** Field validation schema for Zod */
  validationSchema?: z.ZodSchema<any>;
  
  /** Field validation errors */
  validationErrors?: string[];
  
  /** Field editing state */
  isEditing: boolean;
  
  /** Field selection state for bulk operations */
  isSelected: boolean;
  
  /** Field visibility in table view */
  isVisible: boolean;
  
  /** Field sort order in table display */
  sortOrder?: number;
  
  // Enhanced metadata
  /** Sample data for preview */
  sampleData?: any[];
  
  /** Field statistics (for numeric/date fields) */
  statistics?: FieldStatistics;
  
  /** JSON schema for complex field types */
  jsonSchema?: Record<string, any>;
  
  /** Monaco editor configuration for JSON fields */
  editorConfig?: MonacoEditorConfig;
  
  // API endpoint configuration
  /** Field inclusion in API endpoints */
  includeInApi: boolean;
  
  /** Field-level security rules */
  securityRules?: FieldSecurityRules;
  
  /** Field transformation rules for API responses */
  transformationRules?: FieldTransformationRules;
}

/**
 * Enhanced table relationship interface with React Query optimization
 */
export interface EnhancedTableRelated extends TableRelated {
  // React Query cache keys
  /** Cache key for related table data */
  cacheKey: string;
  
  /** Background loading state */
  isLoading: boolean;
  
  /** Error state for relationship loading */
  error?: ApiErrorResponse | null;
  
  // UI state management
  /** Expansion state in hierarchical view */
  isExpanded: boolean;
  
  /** Selection state for bulk operations */
  isSelected: boolean;
  
  // Enhanced metadata
  /** Relationship strength (based on foreign key constraints) */
  relationshipStrength: 'strong' | 'weak' | 'suggested';
  
  /** Join query performance impact */
  performanceImpact: 'low' | 'medium' | 'high';
  
  /** Related record count estimate */
  estimatedRecordCount?: number;
  
  // API configuration
  /** Include relationship in API responses */
  includeInApi: boolean;
  
  /** Relationship loading strategy */
  loadingStrategy: 'eager' | 'lazy' | 'on-demand';
}

// ============================================================================
// FORM SCHEMAS AND VALIDATION
// ============================================================================

/**
 * Zod schema for table details form validation
 * Supports React Hook Form integration with real-time validation
 */
export const TableDetailsFormSchema = z.object({
  // Basic table information
  name: z.string()
    .min(1, 'Table name is required')
    .max(64, 'Table name must be less than 64 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Table name must start with a letter and contain only letters, numbers, and underscores'),
  
  label: z.string()
    .min(1, 'Table label is required')
    .max(128, 'Table label must be less than 128 characters'),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  schema: z.string().optional(),
  
  alias: z.string()
    .max(64, 'Alias must be less than 64 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Alias must start with a letter and contain only letters, numbers, and underscores')
    .optional(),
  
  plural: z.string()
    .max(128, 'Plural form must be less than 128 characters')
    .optional(),
  
  // Table configuration
  isView: z.boolean().default(false),
  
  nameField: z.string()
    .max(64, 'Name field must be less than 64 characters')
    .optional(),
  
  access: z.number()
    .int()
    .min(0)
    .max(15)
    .default(15), // Full access by default
  
  // API generation settings
  apiEnabled: z.boolean().default(true),
  
  // Performance settings
  cacheTtl: z.number()
    .int()
    .min(0)
    .max(3600)
    .default(300), // 5 minutes default
  
  // Advanced settings
  options: z.record(z.any()).optional(),
});

/**
 * Inferred TypeScript type from Zod schema
 */
export type TableFormData = z.infer<typeof TableDetailsFormSchema>;

/**
 * Zod schema for field details form validation
 */
export const FieldDetailsFormSchema = z.object({
  // Basic field information
  name: z.string()
    .min(1, 'Field name is required')
    .max(64, 'Field name must be less than 64 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with a letter and contain only letters, numbers, and underscores'),
  
  label: z.string()
    .min(1, 'Field label is required')
    .max(128, 'Field label must be less than 128 characters'),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  alias: z.string()
    .max(64, 'Alias must be less than 64 characters')
    .optional(),
  
  // Data type configuration
  type: z.enum([
    'id', 'string', 'text', 'integer', 'float', 'double', 'decimal',
    'boolean', 'date', 'datetime', 'time', 'timestamp', 'json', 'binary'
  ]),
  
  dbType: z.string().min(1, 'Database type is required'),
  
  length: z.number().int().min(0).optional(),
  precision: z.number().int().min(0).optional(),
  scale: z.number().int().min(0).optional(),
  
  // Field constraints
  isRequired: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  isPrimaryKey: z.boolean().default(false),
  isForeignKey: z.boolean().default(false),
  
  defaultValue: z.any().optional(),
  
  // Validation rules
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(0).optional(),
  
  pattern: z.string().optional(),
  
  // API configuration
  includeInApi: z.boolean().default(true),
  isReadOnly: z.boolean().default(false),
  isHidden: z.boolean().default(false),
  
  // UI configuration
  isVisible: z.boolean().default(true),
  sortOrder: z.number().int().min(0).optional(),
});

/**
 * Inferred TypeScript type from field schema
 */
export type FieldFormData = z.infer<typeof FieldDetailsFormSchema>;

/**
 * Zod schema for relationship configuration
 */
export const RelationshipFormSchema = z.object({
  // Relationship identification
  name: z.string()
    .min(1, 'Relationship name is required')
    .max(64, 'Relationship name must be less than 64 characters'),
  
  type: z.enum(['belongs_to', 'has_one', 'has_many', 'many_to_many']),
  
  // Foreign key configuration
  localField: z.string().min(1, 'Local field is required'),
  foreignField: z.string().min(1, 'Foreign field is required'),
  foreignTable: z.string().min(1, 'Foreign table is required'),
  
  // Junction table for many-to-many
  junctionTable: z.string().optional(),
  junctionLocalField: z.string().optional(),
  junctionForeignField: z.string().optional(),
  
  // API configuration
  includeInApi: z.boolean().default(true),
  loadingStrategy: z.enum(['eager', 'lazy', 'on-demand']).default('lazy'),
  
  // Performance settings
  performanceImpact: z.enum(['low', 'medium', 'high']).default('medium'),
});

/**
 * Inferred TypeScript type from relationship schema
 */
export type RelationshipFormData = z.infer<typeof RelationshipFormSchema>;

// ============================================================================
// REACT QUERY INTEGRATION TYPES
// ============================================================================

/**
 * React Query configuration for table details queries
 */
export interface TableDetailsQueryOptions extends UseQueryOptions<TableDetails, ApiErrorResponse> {
  /** Service name for the database */
  serviceName: string;
  
  /** Table name to fetch details for */
  tableName: string;
  
  /** Include field details in response */
  includeFields?: boolean;
  
  /** Include relationship data */
  includeRelationships?: boolean;
  
  /** Cache configuration */
  cacheConfig?: {
    /** Stale time in milliseconds (default: 300000 - 5 minutes) */
    staleTime?: number;
    
    /** Cache time in milliseconds (default: 900000 - 15 minutes) */
    cacheTime?: number;
    
    /** Background refetch interval */
    refetchInterval?: number | false;
    
    /** Refetch on window focus */
    refetchOnWindowFocus?: boolean;
  };
}

/**
 * React Query mutation options for table updates
 */
export interface TableDetailsMutationOptions extends UseMutationOptions<
  TableDetails,
  ApiErrorResponse,
  TableFormData,
  unknown
> {
  /** Service name for the database */
  serviceName: string;
  
  /** Original table name (for updates) */
  originalTableName?: string;
  
  /** Optimistic update configuration */
  optimisticUpdate?: {
    /** Enable optimistic updates */
    enabled: boolean;
    
    /** Rollback timeout in milliseconds */
    rollbackTimeout?: number;
  };
}

/**
 * Infinite query options for field pagination
 */
export interface FieldsInfiniteQueryOptions extends InfiniteQueryObserverOptions<
  ApiListResponse<EnhancedTableField>,
  ApiErrorResponse
> {
  /** Service name */
  serviceName: string;
  
  /** Table name */
  tableName: string;
  
  /** Page size for pagination */
  pageSize?: number;
  
  /** Search filter */
  searchFilter?: string;
  
  /** Field type filter */
  typeFilter?: FieldType[];
}

// ============================================================================
// TANSTACK TABLE INTEGRATION TYPES
// ============================================================================

/**
 * Table column definitions for TanStack Table
 */
export type TableDetailsColumnDef = ColumnDef<EnhancedTableField> & {
  /** Column unique identifier */
  id: string;
  
  /** Column header label */
  header: string;
  
  /** Column width configuration */
  width?: number | 'auto';
  
  /** Column resize configuration */
  enableResizing?: boolean;
  
  /** Column sort configuration */
  enableSorting?: boolean;
  
  /** Column filter configuration */
  enableColumnFilter?: boolean;
  
  /** Column visibility toggle */
  enableHiding?: boolean;
  
  /** Column pin configuration */
  enablePinning?: boolean;
  
  /** Custom cell renderer */
  cell?: (context: any) => React.ReactNode;
  
  /** Custom header renderer */
  headerCell?: (context: any) => React.ReactNode;
  
  /** Custom filter component */
  filterComponent?: React.ComponentType<any>;
};

/**
 * Table state management for TanStack Table
 */
export interface TableDetailsState {
  /** Column filtering state */
  columnFilters: ColumnFiltersState;
  
  /** Column sorting state */
  sorting: SortingState;
  
  /** Column visibility state */
  columnVisibility: VisibilityState;
  
  /** Pagination state */
  pagination: PaginationState;
  
  /** Row selection state */
  rowSelection: Record<string, boolean>;
  
  /** Column order state */
  columnOrder: string[];
  
  /** Column sizing state */
  columnSizing: Record<string, number>;
  
  /** Expanded rows state */
  expanded: Record<string, boolean>;
  
  /** Global filter state */
  globalFilter: string;
}

/**
 * Virtual scrolling configuration for large field lists
 */
export interface FieldVirtualizationConfig extends Omit<VirtualizerOptions<any, any>, 'count' | 'getScrollElement'> {
  /** Estimated item height for virtual scrolling */
  estimateSize: (index: number) => number;
  
  /** Overscan count for smooth scrolling */
  overscan?: number;
  
  /** Enable smooth scrolling */
  smoothScrolling?: boolean;
  
  /** Scroll to index configuration */
  scrollToIndex?: number;
  
  /** Scroll to alignment */
  scrollToAlignment?: 'start' | 'center' | 'end' | 'auto';
}

// ============================================================================
// MONACO EDITOR INTEGRATION TYPES
// ============================================================================

/**
 * Monaco editor configuration for JSON field editing
 */
export interface MonacoEditorConfig {
  /** Editor language mode */
  language: 'json' | 'sql' | 'javascript' | 'typescript';
  
  /** Editor theme */
  theme: 'vs' | 'vs-dark' | 'hc-black';
  
  /** Editor options */
  options: {
    /** Enable auto-completion */
    autoComplete?: boolean;
    
    /** Enable syntax highlighting */
    syntaxHighlighting?: boolean;
    
    /** Enable error checking */
    errorChecking?: boolean;
    
    /** Enable line numbers */
    lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
    
    /** Enable word wrap */
    wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
    
    /** Tab size */
    tabSize?: number;
    
    /** Enable minimap */
    minimap?: { enabled: boolean };
    
    /** Editor height */
    height?: number;
    
    /** Read-only mode */
    readOnly?: boolean;
  };
  
  /** JSON schema for validation */
  jsonSchema?: Record<string, any>;
  
  /** Custom validation function */
  customValidator?: (value: string) => string[] | null;
}

/**
 * JSON editor state for complex field types
 */
export interface JsonEditorState {
  /** Current JSON value */
  value: string;
  
  /** Parsed JSON object */
  parsedValue: any;
  
  /** Validation errors */
  errors: string[];
  
  /** Editor has focus */
  isFocused: boolean;
  
  /** Value has been modified */
  isDirty: boolean;
  
  /** Undo/redo history */
  history: {
    /** Undo stack */
    undo: string[];
    
    /** Redo stack */
    redo: string[];
    
    /** Current position in history */
    position: number;
  };
  
  /** Auto-save configuration */
  autoSave: {
    /** Enable auto-save */
    enabled: boolean;
    
    /** Auto-save interval in milliseconds */
    interval: number;
    
    /** Last save timestamp */
    lastSaved: string;
  };
}

// ============================================================================
// SUPPORTING TYPES AND INTERFACES
// ============================================================================

/**
 * Field statistics for numeric and date fields
 */
export interface FieldStatistics {
  /** Minimum value */
  min?: number | string;
  
  /** Maximum value */
  max?: number | string;
  
  /** Average value (numeric fields only) */
  average?: number;
  
  /** Median value (numeric fields only) */
  median?: number;
  
  /** Standard deviation (numeric fields only) */
  standardDeviation?: number;
  
  /** Distinct value count */
  distinctCount: number;
  
  /** Null value count */
  nullCount: number;
  
  /** Most common values */
  topValues: Array<{
    value: any;
    count: number;
    percentage: number;
  }>;
  
  /** Data quality score (0-100) */
  qualityScore: number;
}

/**
 * Field-level security rules
 */
export interface FieldSecurityRules {
  /** Read access control */
  readAccess: {
    /** Allow read access */
    enabled: boolean;
    
    /** Required roles for read access */
    requiredRoles?: string[];
    
    /** Required permissions */
    requiredPermissions?: string[];
  };
  
  /** Write access control */
  writeAccess: {
    /** Allow write access */
    enabled: boolean;
    
    /** Required roles for write access */
    requiredRoles?: string[];
    
    /** Required permissions */
    requiredPermissions?: string[];
  };
  
  /** Data masking rules */
  dataMasking: {
    /** Enable data masking */
    enabled: boolean;
    
    /** Masking strategy */
    strategy: 'partial' | 'full' | 'hash' | 'custom';
    
    /** Custom masking function */
    customMask?: string;
  };
  
  /** Encryption settings */
  encryption: {
    /** Enable field encryption */
    enabled: boolean;
    
    /** Encryption algorithm */
    algorithm?: 'AES-256' | 'RSA' | 'custom';
  };
}

/**
 * Field transformation rules for API responses
 */
export interface FieldTransformationRules {
  /** Input transformation (API request to database) */
  input: {
    /** Enable input transformation */
    enabled: boolean;
    
    /** Transformation function */
    transform?: string;
    
    /** Validation rules */
    validation?: z.ZodSchema<any>;
  };
  
  /** Output transformation (database to API response) */
  output: {
    /** Enable output transformation */
    enabled: boolean;
    
    /** Transformation function */
    transform?: string;
    
    /** Format options */
    format?: {
      /** Date format for date fields */
      dateFormat?: string;
      
      /** Number format for numeric fields */
      numberFormat?: {
        /** Decimal places */
        decimals?: number;
        
        /** Thousands separator */
        thousandsSeparator?: string;
        
        /** Decimal separator */
        decimalSeparator?: string;
      };
    };
  };
}

/**
 * API endpoint configuration for table
 */
export interface ApiEndpointConfig {
  /** Endpoint path */
  path: string;
  
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  
  /** Endpoint description */
  description: string;
  
  /** Enable endpoint */
  enabled: boolean;
  
  /** Request schema */
  requestSchema?: z.ZodSchema<any>;
  
  /** Response schema */
  responseSchema?: z.ZodSchema<any>;
  
  /** Security configuration */
  security: {
    /** Authentication required */
    authRequired: boolean;
    
    /** Required permissions */
    permissions?: string[];
    
    /** Rate limiting */
    rateLimit?: {
      /** Requests per minute */
      rpm: number;
      
      /** Burst limit */
      burst?: number;
    };
  };
  
  /** Caching configuration */
  caching: {
    /** Enable response caching */
    enabled: boolean;
    
    /** Cache TTL in seconds */
    ttl?: number;
    
    /** Cache key strategy */
    keyStrategy?: 'default' | 'user-specific' | 'custom';
  };
}

/**
 * API generation status tracking
 */
export interface ApiGenerationStatus {
  /** Generation status */
  status: 'idle' | 'generating' | 'completed' | 'error';
  
  /** Generation progress (0-100) */
  progress: number;
  
  /** Generated endpoints count */
  generatedEndpoints: number;
  
  /** Total endpoints to generate */
  totalEndpoints: number;
  
  /** Generation start time */
  startTime?: string;
  
  /** Generation completion time */
  completionTime?: string;
  
  /** Generation errors */
  errors: string[];
  
  /** Generation warnings */
  warnings: string[];
  
  /** OpenAPI specification URL */
  openApiUrl?: string;
}

// ============================================================================
// REACT HOOK FORM INTEGRATION TYPES
// ============================================================================

/**
 * React Hook Form configuration for table details
 */
export interface TableDetailsFormConfig {
  /** Form instance */
  form: UseFormReturn<TableFormData>;
  
  /** Form submission handler */
  onSubmit: (data: TableFormData) => Promise<void>;
  
  /** Form validation mode */
  mode: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  
  /** Form reset configuration */
  reset: {
    /** Auto-reset on successful submission */
    onSuccess: boolean;
    
    /** Keep dirty values on reset */
    keepDirtyValues: boolean;
  };
  
  /** Form loading state */
  isLoading: boolean;
  
  /** Form submission state */
  isSubmitting: boolean;
  
  /** Form dirty state */
  isDirty: boolean;
  
  /** Form validation errors */
  errors: FieldErrors<TableFormData>;
}

/**
 * Field form configuration
 */
export interface FieldFormConfig {
  /** Form instance */
  form: UseFormReturn<FieldFormData>;
  
  /** Parent table context */
  tableContext: {
    /** Service name */
    serviceName: string;
    
    /** Table name */
    tableName: string;
    
    /** Existing fields */
    existingFields: EnhancedTableField[];
  };
  
  /** Field validation configuration */
  validation: {
    /** Enable real-time validation */
    realTime: boolean;
    
    /** Validation debounce time */
    debounceMs: number;
    
    /** Custom validators */
    customValidators?: Record<string, (value: any) => string | null>;
  };
}

// ============================================================================
// SWR INTEGRATION TYPES
// ============================================================================

/**
 * SWR configuration for table details
 */
export interface TableDetailsSWRConfig extends SWRConfiguration<TableDetails, ApiErrorResponse> {
  /** Service name */
  serviceName: string;
  
  /** Table name */
  tableName: string;
  
  /** Auto-refresh configuration */
  autoRefresh: {
    /** Enable auto-refresh */
    enabled: boolean;
    
    /** Refresh interval in milliseconds */
    interval: number;
    
    /** Refresh on focus */
    onFocus: boolean;
    
    /** Refresh on reconnect */
    onReconnect: boolean;
  };
  
  /** Error retry configuration */
  errorRetry: {
    /** Retry count */
    count: number;
    
    /** Retry delay in milliseconds */
    delay: number;
    
    /** Exponential backoff */
    exponentialBackoff: boolean;
  };
}

// ============================================================================
// PERFORMANCE OPTIMIZATION TYPES
// ============================================================================

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
  /** Enable performance monitoring */
  enabled: boolean;
  
  /** Metrics to track */
  metrics: {
    /** Track query execution time */
    queryTime: boolean;
    
    /** Track render time */
    renderTime: boolean;
    
    /** Track memory usage */
    memoryUsage: boolean;
    
    /** Track cache hit rate */
    cacheHitRate: boolean;
  };
  
  /** Performance thresholds */
  thresholds: {
    /** Query time threshold in milliseconds */
    queryTime: number;
    
    /** Render time threshold in milliseconds */
    renderTime: number;
    
    /** Memory usage threshold in MB */
    memoryUsage: number;
  };
  
  /** Alert configuration */
  alerts: {
    /** Enable performance alerts */
    enabled: boolean;
    
    /** Alert callback */
    onThresholdExceeded?: (metric: string, value: number, threshold: number) => void;
  };
}

// ============================================================================
// UTILITY TYPES AND TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a field is a JSON field
 */
export function isJsonField(field: EnhancedTableField): boolean {
  return field.type === 'json' || field.dbType.toLowerCase().includes('json');
}

/**
 * Type guard to check if a field requires Monaco editor
 */
export function requiresMonacoEditor(field: EnhancedTableField): boolean {
  return isJsonField(field) || field.type === 'text' && field.length && field.length > 1000;
}

/**
 * Type guard to check if a table has relationships
 */
export function hasRelationships(table: TableDetails): boolean {
  return table.relatedTables && table.relatedTables.length > 0;
}

/**
 * Type guard to check if API generation is available
 */
export function canGenerateApi(table: TableDetails): boolean {
  return table.apiEnabled && table.fieldDetails.some(field => field.includeInApi);
}

// ============================================================================
// LEGACY COMPATIBILITY TYPES
// ============================================================================

/**
 * Legacy compatibility interface for existing Angular code
 * @deprecated Use TableDetails instead
 */
export interface TableDetailsComponent {
  table: any;
  fields: any[];
  related: any[];
  isLoading: boolean;
  error: any;
}

/**
 * Legacy compatibility interface for field components
 * @deprecated Use EnhancedTableField instead
 */
export interface FieldDetailsComponent {
  field: any;
  validation: any;
  isEditing: boolean;
}

// ============================================================================
// EXPORTED UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates default table details configuration
 */
export function createDefaultTableConfig(): Partial<TableFormData> {
  return {
    isView: false,
    access: 15,
    apiEnabled: true,
    cacheTtl: 300,
  };
}

/**
 * Creates default field configuration
 */
export function createDefaultFieldConfig(): Partial<FieldFormData> {
  return {
    isRequired: false,
    isUnique: false,
    isPrimaryKey: false,
    isForeignKey: false,
    includeInApi: true,
    isReadOnly: false,
    isHidden: false,
    isVisible: true,
  };
}

/**
 * Creates cache key for table details query
 */
export function createTableCacheKey(serviceName: string, tableName: string): string {
  return `table-details:${serviceName}:${tableName}`;
}

/**
 * Creates cache key for field details query
 */
export function createFieldCacheKey(serviceName: string, tableName: string, fieldName?: string): string {
  return fieldName 
    ? `field-details:${serviceName}:${tableName}:${fieldName}`
    : `field-list:${serviceName}:${tableName}`;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Export main interfaces
export type {
  TableDetails,
  EnhancedTableField,
  EnhancedTableRelated,
  TableFormData,
  FieldFormData,
  RelationshipFormData,
  TableDetailsColumnDef,
  TableDetailsState,
  MonacoEditorConfig,
  JsonEditorState,
  ApiEndpointConfig,
  ApiGenerationStatus,
  TableDetailsFormConfig,
  FieldFormConfig,
  PerformanceConfig,
};

// Export Zod schemas
export {
  TableDetailsFormSchema,
  FieldDetailsFormSchema,
  RelationshipFormSchema,
};