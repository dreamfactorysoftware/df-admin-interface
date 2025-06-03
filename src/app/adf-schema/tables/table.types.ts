/**
 * Table Management Types for React/Next.js DreamFactory Admin Interface
 * 
 * Comprehensive type definitions for table schema management components adapted for
 * React patterns. Defines interfaces for table schemas, table metadata, and form
 * schemas compatible with React Hook Form, Zod validation, and TanStack Table
 * while maintaining compatibility with DreamFactory API responses.
 * 
 * Features:
 * - TanStack Table integration with virtual scrolling for 1000+ tables
 * - React Hook Form compatibility with real-time validation under 100ms
 * - React Query mutation and query types for optimistic updates
 * - Zod validation schemas for type-safe configuration workflows
 * - Next.js routing parameter types for dynamic navigation
 * - Performance optimizations for large dataset handling
 * 
 * @fileoverview Table management type definitions for React migration
 * @version 1.0.0
 */

import { z } from 'zod';
import { 
  ColumnDef, 
  SortingState, 
  ColumnFiltersState, 
  VisibilityState,
  PaginationState,
  RowSelectionState,
  Table as TanStackTable,
  Row,
  Cell,
  Header,
  AccessorKeyColumnDef,
  DisplayColumnDef
} from '@tanstack/react-table';
import { VirtualItem } from '@tanstack/react-virtual';
import { UseMutationResult, UseQueryResult, QueryKey } from '@tanstack/react-query';
import { UseFormReturn, FieldValues, Control } from 'react-hook-form';

// Import base types
import type { 
  ApiResponse, 
  ApiError, 
  PaginatedResponse,
  ApiRequestOptions,
  CacheConfig,
  LoadingState,
  BoundaryError,
  MutationConfig,
  QueryConfig,
  SWRConfig
} from '../../../types/api';

import type {
  DatabaseTable,
  DatabaseField,
  DatabaseIndex,
  DatabaseForeignKey,
  DatabaseConstraint,
  DatabaseSchema,
  TableRelationship,
  SchemaDiscoveryConfig,
  PaginatedSchemaDiscovery,
  DatabaseServiceConfig
} from '../../../types/database';

import type {
  BaseComponent,
  ComponentVariant,
  ComponentSize,
  FormFieldComponent,
  SelectOption,
  AccessibilityProps,
  FocusManagement
} from '../../../types/ui';

// =============================================================================
// NEXT.JS ROUTING PARAMETER TYPES
// =============================================================================

/**
 * Dynamic route parameters for table navigation
 * Supports Next.js App Router file-based routing patterns
 */
export interface TableRouteParams {
  /** Database service name */
  service: string;
  /** Table name */
  tableId?: string;
  /** Field ID for field details */
  fieldId?: string;
  /** Relationship ID for relationship management */
  relationshipId?: string;
}

/**
 * Search parameters for table filtering and pagination
 */
export interface TableSearchParams {
  /** Current page number */
  page?: string;
  /** Items per page */
  limit?: string;
  /** Search query */
  search?: string;
  /** Sort field */
  sort?: string;
  /** Sort direction */
  direction?: 'asc' | 'desc';
  /** Filter parameters */
  filter?: string;
  /** Table type filter */
  type?: 'table' | 'view' | 'materialized_view';
  /** Schema filter */
  schema?: string;
}

/**
 * Zod schema for route parameter validation
 */
export const tableRouteParamsSchema = z.object({
  service: z.string().min(1, 'Service name is required').max(64),
  tableId: z.string().min(1).max(64).optional(),
  fieldId: z.string().min(1).max(64).optional(),
  relationshipId: z.string().min(1).max(64).optional()
});

/**
 * Zod schema for search parameter validation
 */
export const tableSearchParamsSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().max(255).optional(),
  sort: z.string().max(64).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  filter: z.string().max(1000).optional(),
  type: z.enum(['table', 'view', 'materialized_view']).optional(),
  schema: z.string().max(64).optional()
});

// =============================================================================
// TABLE SCHEMA AND METADATA TYPES
// =============================================================================

/**
 * Enhanced table metadata with React-specific properties
 */
export interface TableMetadata extends DatabaseTable {
  /** Table display configuration */
  display: {
    /** Show in table list */
    visible: boolean;
    /** Table icon */
    icon?: string;
    /** Color theme */
    color?: string;
    /** Custom description */
    description?: string;
    /** Table tags */
    tags?: string[];
  };
  
  /** API generation status */
  api_status: {
    /** APIs have been generated */
    generated: boolean;
    /** Generation timestamp */
    generated_at?: string;
    /** Available endpoints */
    endpoints?: string[];
    /** Generation errors */
    errors?: string[];
  };
  
  /** Performance metrics */
  performance: {
    /** Query performance rating */
    rating?: 'excellent' | 'good' | 'fair' | 'poor';
    /** Average query time (ms) */
    avg_query_time?: number;
    /** Index efficiency score */
    index_score?: number;
    /** Recommendations */
    recommendations?: string[];
  };
  
  /** Security configuration */
  security: {
    /** Access control enabled */
    access_control: boolean;
    /** Required roles */
    required_roles?: string[];
    /** Field-level permissions */
    field_permissions?: Record<string, string[]>;
    /** Data masking rules */
    masking_rules?: Record<string, string>;
  };
}

/**
 * Table list item for optimized rendering in TanStack Table
 */
export interface TableListItem {
  /** Table identifier */
  id: string;
  /** Table name */
  name: string;
  /** Display label */
  label: string;
  /** Table description */
  description?: string;
  /** Table type */
  type: 'table' | 'view' | 'materialized_view';
  /** Schema name */
  schema?: string;
  /** Field count */
  field_count: number;
  /** Primary key fields */
  primary_keys: string[];
  /** Has foreign keys */
  has_foreign_keys: boolean;
  /** Row count estimate */
  row_count?: number;
  /** Table size in bytes */
  size_bytes?: number;
  /** API generation status */
  api_generated: boolean;
  /** Last modified timestamp */
  last_modified: string;
  /** Performance rating */
  performance_rating?: 'excellent' | 'good' | 'fair' | 'poor';
  /** Access control enabled */
  access_controlled: boolean;
}

/**
 * Table field configuration for form management
 */
export interface TableFieldConfig extends DatabaseField {
  /** Field display configuration */
  display: {
    /** Show in table views */
    visible: boolean;
    /** Display order */
    order: number;
    /** Column width */
    width?: number;
    /** Custom label */
    custom_label?: string;
    /** Help text */
    help_text?: string;
  };
  
  /** Form configuration */
  form: {
    /** Show in forms */
    show_in_form: boolean;
    /** Form field type */
    field_type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'datetime' | 'number' | 'email' | 'url' | 'password';
    /** Form validation rules */
    validation_rules?: Record<string, unknown>;
    /** Form field options for select types */
    options?: SelectOption[];
    /** Default value */
    default_value?: unknown;
  };
  
  /** API configuration */
  api: {
    /** Include in API responses */
    include_in_response: boolean;
    /** Allow filtering */
    filterable: boolean;
    /** Allow sorting */
    sortable: boolean;
    /** Allow searching */
    searchable: boolean;
    /** API field name override */
    api_name?: string;
  };
}

// =============================================================================
// TANSTACK TABLE CONFIGURATION TYPES
// =============================================================================

/**
 * Table column definition extending TanStack Table ColumnDef
 */
export interface TableColumnDef<TData = TableListItem> extends ColumnDef<TData> {
  /** Column unique identifier */
  id: string;
  /** Column header label */
  header: string;
  /** Accessor key for data */
  accessorKey?: keyof TData;
  /** Custom cell renderer */
  cell?: (info: { getValue: () => unknown; row: Row<TData> }) => React.ReactNode;
  /** Column width configuration */
  size?: number;
  /** Minimum column width */
  minSize?: number;
  /** Maximum column width */
  maxSize?: number;
  /** Enable sorting */
  enableSorting?: boolean;
  /** Enable filtering */
  enableColumnFilter?: boolean;
  /** Enable hiding */
  enableHiding?: boolean;
  /** Enable resizing */
  enableResizing?: boolean;
  /** Meta information */
  meta?: {
    /** Column description */
    description?: string;
    /** Data type */
    dataType?: string;
    /** Filter type */
    filterType?: 'text' | 'select' | 'date' | 'number' | 'boolean';
    /** Filter options for select type */
    filterOptions?: SelectOption[];
  };
}

/**
 * Table configuration for TanStack Table initialization
 */
export interface TableConfig<TData = TableListItem> {
  /** Table columns */
  columns: TableColumnDef<TData>[];
  /** Initial data */
  data: TData[];
  /** Enable sorting */
  enableSorting?: boolean;
  /** Enable filtering */
  enableColumnFilters?: boolean;
  /** Enable global filtering */
  enableGlobalFilter?: boolean;
  /** Enable column hiding */
  enableHiding?: boolean;
  /** Enable row selection */
  enableRowSelection?: boolean;
  /** Enable column resizing */
  enableColumnResizing?: boolean;
  /** Enable pagination */
  enablePagination?: boolean;
  /** Manual pagination control */
  manualPagination?: boolean;
  /** Manual sorting control */
  manualSorting?: boolean;
  /** Manual filtering control */
  manualFiltering?: boolean;
  /** Page count for manual pagination */
  pageCount?: number;
  /** Row count for virtual scrolling */
  rowCount?: number;
  /** Default page size */
  defaultPageSize?: number;
  /** Page size options */
  pageSizeOptions?: number[];
  /** Get row ID function */
  getRowId?: (row: TData) => string;
}

/**
 * Table state management interface
 */
export interface TableState {
  /** Sorting state */
  sorting: SortingState;
  /** Column filters state */
  columnFilters: ColumnFiltersState;
  /** Global filter state */
  globalFilter: string;
  /** Column visibility state */
  columnVisibility: VisibilityState;
  /** Pagination state */
  pagination: PaginationState;
  /** Row selection state */
  rowSelection: RowSelectionState;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error?: BoundaryError;
}

/**
 * Virtual scrolling configuration for large datasets
 */
export interface VirtualScrollConfig {
  /** Enable virtual scrolling */
  enabled: boolean;
  /** Estimated row height */
  estimateSize: () => number;
  /** Overscan count */
  overscan?: number;
  /** Scroll margin */
  scrollMargin?: number;
  /** Initial scroll offset */
  initialOffset?: number;
  /** Scroll padding start */
  paddingStart?: number;
  /** Scroll padding end */
  paddingEnd?: number;
}

/**
 * Enhanced virtual item with table-specific properties
 */
export interface TableVirtualItem extends VirtualItem {
  /** Row data */
  data: TableListItem;
  /** Row state */
  state: {
    /** Selected state */
    selected: boolean;
    /** Expanded state */
    expanded: boolean;
    /** Loading state */
    loading: boolean;
  };
}

// =============================================================================
// REACT QUERY INTEGRATION TYPES
// =============================================================================

/**
 * React Query key factory for table-related queries
 */
export const tableQueryKeys = {
  /** All table queries */
  all: ['tables'] as const,
  
  /** Service-specific table lists */
  lists: () => [...tableQueryKeys.all, 'list'] as const,
  
  /** Table list for specific service */
  list: (service: string, params?: TableSearchParams) => 
    [...tableQueryKeys.lists(), service, params] as const,
  
  /** Table detail queries */
  details: () => [...tableQueryKeys.all, 'detail'] as const,
  
  /** Specific table detail */
  detail: (service: string, tableName: string) => 
    [...tableQueryKeys.details(), service, tableName] as const,
  
  /** Table schema queries */
  schemas: () => [...tableQueryKeys.all, 'schema'] as const,
  
  /** Specific table schema */
  schema: (service: string, tableName: string) => 
    [...tableQueryKeys.schemas(), service, tableName] as const,
  
  /** Table relationships */
  relationships: (service: string, tableName: string) => 
    [...tableQueryKeys.all, 'relationships', service, tableName] as const,
  
  /** Table field configurations */
  fieldConfigs: (service: string, tableName: string) => 
    [...tableQueryKeys.all, 'fieldConfigs', service, tableName] as const
};

/**
 * Query configuration for table list fetching
 */
export interface TableListQueryConfig extends QueryConfig<PaginatedResponse<TableListItem>> {
  /** Service name */
  service: string;
  /** Search parameters */
  params?: TableSearchParams;
  /** Virtual scrolling configuration */
  virtual?: VirtualScrollConfig;
  /** Enable infinite query */
  infinite?: boolean;
}

/**
 * Query result for table list
 */
export type TableListQueryResult = UseQueryResult<PaginatedResponse<TableListItem>, BoundaryError>;

/**
 * Query configuration for table detail fetching
 */
export interface TableDetailQueryConfig extends QueryConfig<TableMetadata> {
  /** Service name */
  service: string;
  /** Table name */
  tableName: string;
  /** Include performance metrics */
  includeMetrics?: boolean;
  /** Include security configuration */
  includeSecurity?: boolean;
}

/**
 * Query result for table detail
 */
export type TableDetailQueryResult = UseQueryResult<TableMetadata, BoundaryError>;

/**
 * Mutation configuration for table operations
 */
export interface TableMutationConfig<TData = unknown, TVariables = unknown> 
  extends MutationConfig<TData, BoundaryError, TVariables> {
  /** Service name */
  service: string;
  /** Table name */
  tableName?: string;
  /** Optimistic update function */
  optimisticUpdate?: (variables: TVariables) => Partial<TData>;
  /** Cache invalidation patterns */
  invalidateQueries?: QueryKey[];
}

/**
 * Table creation mutation variables
 */
export interface CreateTableVariables {
  /** Service name */
  service: string;
  /** Table configuration */
  table: Omit<TableMetadata, 'name'> & { name: string };
}

/**
 * Table update mutation variables
 */
export interface UpdateTableVariables {
  /** Service name */
  service: string;
  /** Table name */
  tableName: string;
  /** Table updates */
  updates: Partial<TableMetadata>;
}

/**
 * Table deletion mutation variables
 */
export interface DeleteTableVariables {
  /** Service name */
  service: string;
  /** Table name */
  tableName: string;
  /** Force deletion */
  force?: boolean;
}

/**
 * API generation mutation variables
 */
export interface GenerateTableAPIVariables {
  /** Service name */
  service: string;
  /** Table names */
  tableNames: string[];
  /** API configuration */
  config: {
    /** HTTP methods to generate */
    methods: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[];
    /** Enable pagination */
    pagination: boolean;
    /** Enable filtering */
    filtering: boolean;
    /** Enable sorting */
    sorting: boolean;
    /** Security rules */
    security?: Record<string, unknown>;
  };
}

/**
 * Mutation results for table operations
 */
export type CreateTableMutation = UseMutationResult<TableMetadata, BoundaryError, CreateTableVariables>;
export type UpdateTableMutation = UseMutationResult<TableMetadata, BoundaryError, UpdateTableVariables>;
export type DeleteTableMutation = UseMutationResult<void, BoundaryError, DeleteTableVariables>;
export type GenerateAPITableMutation = UseMutationResult<{ endpoints: string[] }, BoundaryError, GenerateTableAPIVariables>;

// =============================================================================
// FORM SCHEMAS AND VALIDATION TYPES
// =============================================================================

/**
 * Table filtering form schema
 */
export interface TableFilterForm {
  /** Search query */
  search: string;
  /** Table type filter */
  type: 'all' | 'table' | 'view' | 'materialized_view';
  /** Schema filter */
  schema: string;
  /** Has primary key filter */
  hasPrimaryKey: boolean;
  /** Has foreign keys filter */
  hasForeignKeys: boolean;
  /** API generation status filter */
  apiGenerated: 'all' | 'generated' | 'not_generated';
  /** Performance rating filter */
  performanceRating: 'all' | 'excellent' | 'good' | 'fair' | 'poor';
  /** Date range filter */
  dateRange: {
    start?: Date;
    end?: Date;
  };
}

/**
 * Zod schema for table filtering validation
 */
export const tableFilterFormSchema = z.object({
  search: z.string().max(255).default(''),
  type: z.enum(['all', 'table', 'view', 'materialized_view']).default('all'),
  schema: z.string().max(64).default(''),
  hasPrimaryKey: z.boolean().default(false),
  hasForeignKeys: z.boolean().default(false),
  apiGenerated: z.enum(['all', 'generated', 'not_generated']).default('all'),
  performanceRating: z.enum(['all', 'excellent', 'good', 'fair', 'poor']).default('all'),
  dateRange: z.object({
    start: z.date().optional(),
    end: z.date().optional()
  }).default({})
}).refine((data) => {
  // Validate date range
  if (data.dateRange.start && data.dateRange.end) {
    return data.dateRange.start <= data.dateRange.end;
  }
  return true;
}, {
  message: "Start date must be before end date",
  path: ['dateRange', 'start']
});

/**
 * Table configuration form schema
 */
export interface TableConfigForm {
  /** Table basic information */
  basic: {
    name: string;
    label: string;
    description: string;
    type: 'table' | 'view' | 'materialized_view';
    schema?: string;
  };
  
  /** Display configuration */
  display: {
    visible: boolean;
    icon: string;
    color: string;
    tags: string[];
  };
  
  /** API configuration */
  api: {
    generateApis: boolean;
    methods: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[];
    enablePagination: boolean;
    enableFiltering: boolean;
    enableSorting: boolean;
  };
  
  /** Security configuration */
  security: {
    enableAccessControl: boolean;
    requiredRoles: string[];
    fieldPermissions: Record<string, string[]>;
  };
  
  /** Performance configuration */
  performance: {
    enableIndexing: boolean;
    indexFields: string[];
    cacheConfiguration: {
      enabled: boolean;
      ttl: number;
    };
  };
}

/**
 * Zod schema for table configuration validation
 */
export const tableConfigFormSchema = z.object({
  basic: z.object({
    name: z.string()
      .min(1, 'Table name is required')
      .max(64, 'Table name must be 64 characters or less')
      .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Table name must start with a letter and contain only letters, numbers, and underscores'),
    label: z.string()
      .min(1, 'Table label is required')
      .max(128, 'Table label must be 128 characters or less'),
    description: z.string()
      .max(1000, 'Description must be 1000 characters or less')
      .default(''),
    type: z.enum(['table', 'view', 'materialized_view']).default('table'),
    schema: z.string().max(64).optional()
  }),
  
  display: z.object({
    visible: z.boolean().default(true),
    icon: z.string().max(50).default('table'),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').default('#3B82F6'),
    tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed').default([])
  }),
  
  api: z.object({
    generateApis: z.boolean().default(true),
    methods: z.array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])).min(1, 'At least one HTTP method must be selected').default(['GET']),
    enablePagination: z.boolean().default(true),
    enableFiltering: z.boolean().default(true),
    enableSorting: z.boolean().default(true)
  }),
  
  security: z.object({
    enableAccessControl: z.boolean().default(false),
    requiredRoles: z.array(z.string().max(64)).max(20, 'Maximum 20 roles allowed').default([]),
    fieldPermissions: z.record(z.array(z.string())).default({})
  }),
  
  performance: z.object({
    enableIndexing: z.boolean().default(true),
    indexFields: z.array(z.string().max(64)).max(50, 'Maximum 50 index fields allowed').default([]),
    cacheConfiguration: z.object({
      enabled: z.boolean().default(false),
      ttl: z.number().min(60).max(86400).default(300) // 1 minute to 24 hours
    })
  })
});

// =============================================================================
// COMPONENT PROPS AND INTERFACES
// =============================================================================

/**
 * Table list component props
 */
export interface TableListProps extends BaseComponent {
  /** Service name */
  service: string;
  /** Initial filter values */
  initialFilters?: Partial<TableFilterForm>;
  /** Enable virtual scrolling */
  virtualScrolling?: boolean;
  /** Enable row selection */
  enableSelection?: boolean;
  /** Selection change handler */
  onSelectionChange?: (selectedTables: string[]) => void;
  /** Table row click handler */
  onTableClick?: (tableName: string) => void;
  /** Refresh handler */
  onRefresh?: () => void;
  /** Error handler */
  onError?: (error: BoundaryError) => void;
}

/**
 * Table detail component props
 */
export interface TableDetailProps extends BaseComponent {
  /** Service name */
  service: string;
  /** Table name */
  tableName: string;
  /** Show performance metrics */
  showMetrics?: boolean;
  /** Show security configuration */
  showSecurity?: boolean;
  /** Enable editing */
  enableEditing?: boolean;
  /** Save handler */
  onSave?: (updates: Partial<TableMetadata>) => Promise<void>;
  /** Delete handler */
  onDelete?: () => Promise<void>;
  /** Error handler */
  onError?: (error: BoundaryError) => void;
}

/**
 * Table filter component props
 */
export interface TableFilterProps extends BaseComponent {
  /** Current filter values */
  filters: TableFilterForm;
  /** Filter change handler */
  onFiltersChange: (filters: TableFilterForm) => void;
  /** Available schemas for filtering */
  availableSchemas?: string[];
  /** Show advanced filters */
  showAdvanced?: boolean;
  /** Reset handler */
  onReset?: () => void;
}

/**
 * Table configuration component props
 */
export interface TableConfigProps extends BaseComponent {
  /** Service name */
  service: string;
  /** Table name for editing (undefined for creation) */
  tableName?: string;
  /** Initial configuration values */
  initialConfig?: Partial<TableConfigForm>;
  /** Save handler */
  onSave: (config: TableConfigForm) => Promise<void>;
  /** Cancel handler */
  onCancel: () => void;
  /** Available field options */
  availableFields?: DatabaseField[];
  /** Available roles for security configuration */
  availableRoles?: string[];
}

/**
 * API generation wizard component props
 */
export interface ApiGenerationWizardProps extends BaseComponent {
  /** Service name */
  service: string;
  /** Selected table names */
  selectedTables: string[];
  /** Generation handler */
  onGenerate: (config: GenerateTableAPIVariables['config']) => Promise<void>;
  /** Cancel handler */
  onCancel: () => void;
  /** Step change handler */
  onStepChange?: (step: number) => void;
  /** Initial step */
  initialStep?: number;
}

// =============================================================================
// HOOK INTERFACES AND TYPES
// =============================================================================

/**
 * Table list hook configuration
 */
export interface UseTableListConfig {
  /** Service name */
  service: string;
  /** Initial filters */
  initialFilters?: Partial<TableFilterForm>;
  /** Enable infinite loading */
  infinite?: boolean;
  /** Virtual scrolling configuration */
  virtualConfig?: VirtualScrollConfig;
  /** Refetch interval */
  refetchInterval?: number;
}

/**
 * Table list hook return type
 */
export interface UseTableListReturn {
  /** Table list query result */
  query: TableListQueryResult;
  /** Current filters */
  filters: TableFilterForm;
  /** Filter update function */
  updateFilters: (filters: Partial<TableFilterForm>) => void;
  /** Reset filters function */
  resetFilters: () => void;
  /** Refresh function */
  refresh: () => void;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error?: BoundaryError;
  /** Has more data for infinite loading */
  hasNextPage?: boolean;
  /** Fetch next page function */
  fetchNextPage?: () => void;
}

/**
 * Table detail hook configuration
 */
export interface UseTableDetailConfig {
  /** Service name */
  service: string;
  /** Table name */
  tableName: string;
  /** Include performance metrics */
  includeMetrics?: boolean;
  /** Include security configuration */
  includeSecurity?: boolean;
}

/**
 * Table detail hook return type
 */
export interface UseTableDetailReturn {
  /** Table detail query result */
  query: TableDetailQueryResult;
  /** Update mutation */
  updateMutation: UpdateTableMutation;
  /** Delete mutation */
  deleteMutation: DeleteTableMutation;
  /** Update function */
  update: (updates: Partial<TableMetadata>) => Promise<void>;
  /** Delete function */
  delete: (force?: boolean) => Promise<void>;
  /** Refresh function */
  refresh: () => void;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error?: BoundaryError;
}

/**
 * Table mutations hook return type
 */
export interface UseTableMutationsReturn {
  /** Create table mutation */
  createMutation: CreateTableMutation;
  /** Update table mutation */
  updateMutation: UpdateTableMutation;
  /** Delete table mutation */
  deleteMutation: DeleteTableMutation;
  /** Generate API mutation */
  generateApiMutation: GenerateAPITableMutation;
  /** Create table function */
  createTable: (variables: CreateTableVariables) => Promise<TableMetadata>;
  /** Update table function */
  updateTable: (variables: UpdateTableVariables) => Promise<TableMetadata>;
  /** Delete table function */
  deleteTable: (variables: DeleteTableVariables) => Promise<void>;
  /** Generate APIs function */
  generateApis: (variables: GenerateTableAPIVariables) => Promise<{ endpoints: string[] }>;
  /** Loading states */
  isLoading: {
    create: boolean;
    update: boolean;
    delete: boolean;
    generateApi: boolean;
  };
  /** Error states */
  errors: {
    create?: BoundaryError;
    update?: BoundaryError;
    delete?: BoundaryError;
    generateApi?: BoundaryError;
  };
}

// =============================================================================
// PERFORMANCE AND OPTIMIZATION TYPES
// =============================================================================

/**
 * Table performance metrics
 */
export interface TablePerformanceMetrics {
  /** Query performance */
  queryPerformance: {
    /** Average response time (ms) */
    avgResponseTime: number;
    /** 95th percentile response time (ms) */
    p95ResponseTime: number;
    /** Query success rate */
    successRate: number;
    /** Total queries executed */
    totalQueries: number;
  };
  
  /** Index utilization */
  indexUtilization: {
    /** Index efficiency score (0-100) */
    efficiencyScore: number;
    /** Missing index recommendations */
    recommendations: string[];
    /** Index usage statistics */
    usageStats: Record<string, number>;
  };
  
  /** Cache performance */
  cachePerformance: {
    /** Cache hit rate */
    hitRate: number;
    /** Cache miss rate */
    missRate: number;
    /** Average cache lookup time (ms) */
    avgLookupTime: number;
  };
}

/**
 * Table optimization recommendations
 */
export interface TableOptimizationRecommendations {
  /** Performance recommendations */
  performance: {
    /** Priority level */
    priority: 'high' | 'medium' | 'low';
    /** Recommendation text */
    recommendation: string;
    /** Expected impact */
    impact: string;
    /** Implementation effort */
    effort: 'low' | 'medium' | 'high';
  }[];
  
  /** Security recommendations */
  security: {
    /** Priority level */
    priority: 'high' | 'medium' | 'low';
    /** Recommendation text */
    recommendation: string;
    /** Risk level */
    risk: 'high' | 'medium' | 'low';
  }[];
  
  /** API design recommendations */
  api: {
    /** Priority level */
    priority: 'high' | 'medium' | 'low';
    /** Recommendation text */
    recommendation: string;
    /** Best practice category */
    category: 'REST' | 'GraphQL' | 'Performance' | 'Security';
  }[];
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  // Routing types
  TableRouteParams,
  TableSearchParams,
  
  // Table metadata types
  TableMetadata,
  TableListItem,
  TableFieldConfig,
  
  // TanStack Table types
  TableColumnDef,
  TableConfig,
  TableState,
  VirtualScrollConfig,
  TableVirtualItem,
  
  // React Query types
  TableListQueryConfig,
  TableListQueryResult,
  TableDetailQueryConfig,
  TableDetailQueryResult,
  TableMutationConfig,
  CreateTableVariables,
  UpdateTableVariables,
  DeleteTableVariables,
  GenerateTableAPIVariables,
  CreateTableMutation,
  UpdateTableMutation,
  DeleteTableMutation,
  GenerateAPITableMutation,
  
  // Form types
  TableFilterForm,
  TableConfigForm,
  
  // Component props
  TableListProps,
  TableDetailProps,
  TableFilterProps,
  TableConfigProps,
  ApiGenerationWizardProps,
  
  // Hook types
  UseTableListConfig,
  UseTableListReturn,
  UseTableDetailConfig,
  UseTableDetailReturn,
  UseTableMutationsReturn,
  
  // Performance types
  TablePerformanceMetrics,
  TableOptimizationRecommendations
};

export {
  // Query key factory
  tableQueryKeys,
  
  // Validation schemas
  tableRouteParamsSchema,
  tableSearchParamsSchema,
  tableFilterFormSchema,
  tableConfigFormSchema
};