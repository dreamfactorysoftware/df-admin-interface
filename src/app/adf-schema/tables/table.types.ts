/**
 * Table Management Component Types for React/Next.js Architecture
 * 
 * Comprehensive type definitions for table schema management components
 * adapted for React patterns while maintaining DreamFactory API compatibility.
 * Supports React Hook Form, Zod validation, TanStack Table, and virtual scrolling
 * for handling large datasets (1000+ tables).
 * 
 * @fileoverview Table management types with React Query integration
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { z } from 'zod';
import type { 
  UseQueryOptions, 
  UseMutationOptions, 
  QueryKey 
} from '@tanstack/react-query';
import type { 
  ColumnDef, 
  SortingState, 
  ColumnFiltersState,
  VisibilityState,
  Row,
  Table as TanStackTable
} from '@tanstack/react-table';
import type { VirtualItem } from '@tanstack/react-virtual';
import type { UseFormReturn, FieldErrors } from 'react-hook-form';

// Re-export types from core modules for convenience
import type {
  ApiResponse,
  ApiListResponse,
  ApiResourceResponse,
  PaginationMeta,
  ApiRequestOptions
} from '../../../types/api';
import type {
  SchemaTable,
  SchemaField,
  TableRelationship,
  TableIndex,
  TableConstraint,
  FieldType,
  RelationshipType,
  ReferentialAction
} from '../../../types/schema';
import type {
  DatabaseConfig,
  DatabaseService,
  ConnectionTestResult
} from '../../../types/database';

// ============================================================================
// CORE TABLE MANAGEMENT TYPES
// ============================================================================

/**
 * Enhanced table metadata for React components
 * Extends SchemaTable with React-specific properties and UI state
 */
export interface TableMetadata extends Omit<SchemaTable, 'fields' | 'related'> {
  // Core table information
  id: string;
  name: string;
  label: string;
  description?: string;
  schema?: string;
  alias?: string;
  plural?: string;
  isView: boolean;
  
  // Enhanced field definitions with React compatibility
  fields: TableFieldDefinition[];
  
  // Enhanced relationship definitions
  relationships: TableRelationshipDefinition[];
  
  // Indexes and constraints
  indexes: TableIndex[];
  constraints: TableConstraint[];
  
  // Table metadata
  primaryKey: string[];
  nameField?: string;
  rowCount?: number;
  estimatedSize?: string;
  lastModified?: string;
  collation?: string;
  engine?: string;
  access: number;
  
  // Virtual scrolling properties
  virtualIndex?: number;
  virtualHeight?: number;
  isVisible?: boolean;
  
  // UI state for hierarchical display
  expanded: boolean;
  selected: boolean;
  level: number;
  hasChildren: boolean;
  isLoading: boolean;
  
  // API generation configuration
  apiEnabled: boolean;
  generatedEndpoints?: string[];
  
  // React Query cache management
  cacheKey: string;
  lastCacheUpdate: string;
  staleTime?: number;
  
  // Performance metrics
  performanceMetrics?: TablePerformanceMetrics;
}

/**
 * Enhanced field definition with React Hook Form compatibility
 */
export interface TableFieldDefinition extends Omit<SchemaField, 'validation'> {
  // Core field properties
  id: string;
  name: string;
  label: string;
  description?: string;
  alias?: string;
  
  // Data type information
  type: FieldType;
  dbType: string;
  length?: number;
  precision?: number;
  scale?: number;
  defaultValue?: any;
  
  // Field constraints and properties
  required: boolean;
  allowNull: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  isIndex: boolean;
  isAutoIncrement: boolean;
  isVirtual: boolean;
  isAggregate: boolean;
  fixedLength: boolean;
  supportsMultibyte: boolean;
  
  // Foreign key relationships
  refTable?: string;
  refField?: string;
  refOnUpdate?: ReferentialAction;
  refOnDelete?: ReferentialAction;
  
  // Enhanced validation with React Hook Form and Zod
  validation?: FieldValidationConfig;
  
  // UI configuration
  picklist?: string[];
  hidden: boolean;
  readonly: boolean;
  
  // Form field configuration
  formConfig?: FormFieldConfig;
  
  // Database functions
  dbFunction?: DbFunctionConfig[];
  
  // Native database metadata
  native?: any[];
}

/**
 * Enhanced relationship definition with React patterns
 */
export interface TableRelationshipDefinition extends Omit<TableRelationship, 'type'> {
  // Core relationship metadata
  id: string;
  alias: string;
  name: string;
  label: string;
  description?: string;
  
  // Relationship configuration
  type: RelationshipType;
  field: string;
  isVirtual: boolean;
  
  // Reference configuration
  refServiceId: number;
  refTable: string;
  refField: string;
  refOnUpdate?: ReferentialAction;
  refOnDelete?: ReferentialAction;
  
  // Junction table for many-to-many relationships
  junctionServiceId?: number;
  junctionTable?: string;
  junctionField?: string;
  junctionRefField?: string;
  
  // Fetch behavior
  alwaysFetch: boolean;
  flatten: boolean;
  flattenDropPrefix: boolean;
  
  // UI state for React components
  expanded?: boolean;
  loading?: boolean;
  selected?: boolean;
  
  // React Query integration
  cacheKey?: string;
  lastFetched?: string;
  
  // Validation for relationship configuration
  validation?: RelationshipValidationConfig;
}

// ============================================================================
// REACT HOOK FORM INTEGRATION TYPES
// ============================================================================

/**
 * Form data structure for table creation and editing
 * Compatible with React Hook Form and Zod validation
 */
export interface TableFormData {
  // Basic table information
  name: string;
  label: string;
  description?: string;
  alias?: string;
  plural?: string;
  
  // Table configuration
  isView: boolean;
  nameField?: string;
  access: number;
  
  // Field definitions
  fields: TableFieldFormData[];
  
  // Relationship definitions
  relationships: TableRelationshipFormData[];
  
  // Index configurations
  indexes: TableIndexFormData[];
  
  // Constraint definitions
  constraints: TableConstraintFormData[];
  
  // API generation settings
  apiEnabled: boolean;
  generateEndpoints?: string[];
  
  // Advanced settings
  advancedSettings?: TableAdvancedSettings;
}

/**
 * Form data for individual field configuration
 */
export interface TableFieldFormData {
  // Basic field information
  name: string;
  label: string;
  description?: string;
  alias?: string;
  
  // Data type configuration
  type: FieldType;
  dbType?: string;
  length?: number;
  precision?: number;
  scale?: number;
  defaultValue?: any;
  
  // Field properties
  required: boolean;
  allowNull: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  isIndex: boolean;
  isAutoIncrement: boolean;
  isVirtual: boolean;
  
  // Foreign key configuration
  refTable?: string;
  refField?: string;
  refOnUpdate?: ReferentialAction;
  refOnDelete?: ReferentialAction;
  
  // Validation rules
  validation?: FieldValidationFormData;
  
  // UI configuration
  picklist?: string[];
  hidden: boolean;
  readonly: boolean;
  
  // Form-specific metadata
  isNew?: boolean;
  isModified?: boolean;
  originalName?: string;
}

/**
 * Form data for relationship configuration
 */
export interface TableRelationshipFormData {
  // Basic relationship information
  alias: string;
  name: string;
  label: string;
  description?: string;
  
  // Relationship type and configuration
  type: RelationshipType;
  field: string;
  isVirtual: boolean;
  
  // Reference configuration
  refServiceId: number;
  refTable: string;
  refField: string;
  refOnUpdate?: ReferentialAction;
  refOnDelete?: ReferentialAction;
  
  // Junction table configuration
  junctionServiceId?: number;
  junctionTable?: string;
  junctionField?: string;
  junctionRefField?: string;
  
  // Fetch behavior
  alwaysFetch: boolean;
  flatten: boolean;
  flattenDropPrefix: boolean;
  
  // Form-specific metadata
  isNew?: boolean;
  isModified?: boolean;
  originalAlias?: string;
}

/**
 * Form data for index configuration
 */
export interface TableIndexFormData {
  name: string;
  fields: string[];
  unique: boolean;
  type?: string;
  method?: string;
  condition?: string;
  
  // Form-specific metadata
  isNew?: boolean;
  isModified?: boolean;
  originalName?: string;
}

/**
 * Form data for constraint configuration
 */
export interface TableConstraintFormData {
  name: string;
  type: string;
  definition: string;
  fields: string[];
  condition?: string;
  
  // Form-specific metadata
  isNew?: boolean;
  isModified?: boolean;
  originalName?: string;
}

/**
 * Advanced table settings for expert users
 */
export interface TableAdvancedSettings {
  collation?: string;
  engine?: string;
  rowFormat?: string;
  autoIncrement?: number;
  avgRowLength?: number;
  maxRows?: number;
  minRows?: number;
  tablespace?: string;
  comment?: string;
  
  // Performance settings
  enableCaching?: boolean;
  cacheTimeout?: number;
  optimizeForReads?: boolean;
  
  // Security settings
  enableAuditLog?: boolean;
  enableEncryption?: boolean;
  encryptionKey?: string;
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Comprehensive validation configuration for fields
 * Integrates with React Hook Form for real-time validation under 100ms
 */
export interface FieldValidationConfig {
  // Basic validation rules
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  enum?: string[];
  
  // Advanced validation
  format?: string;
  customValidator?: string;
  asyncValidator?: string;
  
  // Validation timing
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  
  // Error messages
  messages?: {
    required?: string;
    minLength?: string;
    maxLength?: string;
    pattern?: string;
    min?: string;
    max?: string;
    format?: string;
    custom?: string;
  };
  
  // Conditional validation
  conditional?: {
    field: string;
    value: any;
    operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater' | 'less';
  }[];
}

/**
 * Form data for field validation configuration
 */
export interface FieldValidationFormData {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  format?: 'email' | 'url' | 'phone' | 'date' | 'custom';
  customPattern?: string;
  customMessage?: string;
}

/**
 * Validation configuration for relationships
 */
export interface RelationshipValidationConfig {
  requiredRefTable: boolean;
  requiredRefField: boolean;
  validateTableExists: boolean;
  validateFieldExists: boolean;
  preventCircularReference: boolean;
  maxDepth?: number;
}

/**
 * Zod schema for table name validation
 * Ensures valid SQL identifiers and naming conventions
 */
export const TableNameSchema = z.string()
  .min(1, 'Table name is required')
  .max(64, 'Table name must be 64 characters or less')
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Table name must start with letter and contain only letters, numbers, and underscores')
  .refine((name) => !SQL_RESERVED_WORDS.includes(name.toUpperCase()), 'Table name cannot be a reserved SQL word');

/**
 * Zod schema for field name validation
 */
export const FieldNameSchema = z.string()
  .min(1, 'Field name is required')
  .max(64, 'Field name must be 64 characters or less')
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with letter and contain only letters, numbers, and underscores')
  .refine((name) => !SQL_RESERVED_WORDS.includes(name.toUpperCase()), 'Field name cannot be a reserved SQL word');

/**
 * Zod schema for field validation
 */
export const FieldValidationSchema = z.object({
  required: z.boolean().default(false),
  minLength: z.number().min(0).optional(),
  maxLength: z.number().min(1).max(65535).optional(),
  pattern: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  format: z.enum(['email', 'url', 'phone', 'date', 'custom']).optional(),
  customPattern: z.string().optional(),
  customMessage: z.string().optional(),
}).refine((data) => {
  if (data.minLength !== undefined && data.maxLength !== undefined) {
    return data.minLength <= data.maxLength;
  }
  return true;
}, {
  message: 'Minimum length must be less than or equal to maximum length',
  path: ['minLength']
}).refine((data) => {
  if (data.min !== undefined && data.max !== undefined) {
    return data.min <= data.max;
  }
  return true;
}, {
  message: 'Minimum value must be less than or equal to maximum value',
  path: ['min']
});

/**
 * Zod schema for complete table form validation
 */
export const TableFormSchema = z.object({
  name: TableNameSchema,
  label: z.string().min(1, 'Label is required').max(255, 'Label must be 255 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  alias: z.string().max(64, 'Alias must be 64 characters or less').optional(),
  plural: z.string().max(64, 'Plural name must be 64 characters or less').optional(),
  isView: z.boolean().default(false),
  nameField: FieldNameSchema.optional(),
  access: z.number().min(0).max(7).default(7),
  fields: z.array(z.object({
    name: FieldNameSchema,
    label: z.string().min(1, 'Field label is required').max(255),
    description: z.string().max(1000).optional(),
    alias: z.string().max(64).optional(),
    type: z.enum(['integer', 'bigint', 'decimal', 'float', 'double', 'string', 'text', 'boolean', 'date', 'datetime', 'timestamp', 'time', 'binary', 'json', 'xml', 'uuid', 'enum', 'set', 'blob', 'clob']),
    dbType: z.string().optional(),
    length: z.number().min(1).max(65535).optional(),
    precision: z.number().min(1).max(65).optional(),
    scale: z.number().min(0).max(30).optional(),
    defaultValue: z.any().optional(),
    required: z.boolean().default(false),
    allowNull: z.boolean().default(true),
    isPrimaryKey: z.boolean().default(false),
    isForeignKey: z.boolean().default(false),
    isUnique: z.boolean().default(false),
    isIndex: z.boolean().default(false),
    isAutoIncrement: z.boolean().default(false),
    isVirtual: z.boolean().default(false),
    refTable: z.string().optional(),
    refField: z.string().optional(),
    refOnUpdate: z.enum(['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT']).optional(),
    refOnDelete: z.enum(['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT']).optional(),
    validation: FieldValidationSchema.optional(),
    picklist: z.array(z.string()).optional(),
    hidden: z.boolean().default(false),
    readonly: z.boolean().default(false),
  })).min(1, 'Table must have at least one field'),
  relationships: z.array(z.object({
    alias: z.string().min(1, 'Relationship alias is required').max(64),
    name: z.string().min(1, 'Relationship name is required').max(64),
    label: z.string().min(1, 'Relationship label is required').max(255),
    description: z.string().max(1000).optional(),
    type: z.enum(['belongs_to', 'has_many', 'has_one', 'many_many']),
    field: FieldNameSchema,
    isVirtual: z.boolean().default(false),
    refServiceId: z.number().min(1),
    refTable: z.string().min(1, 'Referenced table is required'),
    refField: FieldNameSchema,
    refOnUpdate: z.enum(['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT']).optional(),
    refOnDelete: z.enum(['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT']).optional(),
    junctionServiceId: z.number().optional(),
    junctionTable: z.string().optional(),
    junctionField: z.string().optional(),
    junctionRefField: z.string().optional(),
    alwaysFetch: z.boolean().default(false),
    flatten: z.boolean().default(false),
    flattenDropPrefix: z.boolean().default(false),
  })).optional(),
  indexes: z.array(z.object({
    name: z.string().min(1, 'Index name is required').max(64),
    fields: z.array(FieldNameSchema).min(1, 'Index must have at least one field'),
    unique: z.boolean().default(false),
    type: z.string().optional(),
    method: z.string().optional(),
    condition: z.string().optional(),
  })).optional(),
  constraints: z.array(z.object({
    name: z.string().min(1, 'Constraint name is required').max(64),
    type: z.enum(['check', 'unique', 'foreign_key', 'primary_key', 'default', 'not_null']),
    definition: z.string().min(1, 'Constraint definition is required'),
    fields: z.array(FieldNameSchema).min(1, 'Constraint must apply to at least one field'),
    condition: z.string().optional(),
  })).optional(),
  apiEnabled: z.boolean().default(true),
  generateEndpoints: z.array(z.string()).optional(),
  advancedSettings: z.object({
    collation: z.string().optional(),
    engine: z.string().optional(),
    rowFormat: z.string().optional(),
    autoIncrement: z.number().min(1).optional(),
    avgRowLength: z.number().min(1).optional(),
    maxRows: z.number().min(1).optional(),
    minRows: z.number().min(0).optional(),
    tablespace: z.string().optional(),
    comment: z.string().max(2048).optional(),
    enableCaching: z.boolean().default(false),
    cacheTimeout: z.number().min(60).max(86400).optional(),
    optimizeForReads: z.boolean().default(false),
    enableAuditLog: z.boolean().default(false),
    enableEncryption: z.boolean().default(false),
    encryptionKey: z.string().optional(),
  }).optional(),
}).refine((data) => {
  // Ensure primary key fields are marked as required
  const primaryKeyFields = data.fields.filter(field => field.isPrimaryKey);
  const allPrimaryKeysRequired = primaryKeyFields.every(field => field.required);
  return allPrimaryKeysRequired;
}, {
  message: 'Primary key fields must be required',
  path: ['fields']
}).refine((data) => {
  // Ensure foreign key fields reference valid tables and fields
  const foreignKeyFields = data.fields.filter(field => field.isForeignKey);
  const validForeignKeys = foreignKeyFields.every(field => field.refTable && field.refField);
  return validForeignKeys;
}, {
  message: 'Foreign key fields must specify referenced table and field',
  path: ['fields']
});

// ============================================================================
// TANSTACK TABLE INTEGRATION TYPES
// ============================================================================

/**
 * Column definition for TanStack Table with virtual scrolling support
 * Optimized for handling large datasets (1000+ tables)
 */
export interface TableColumnDefinition<T = TableMetadata> extends ColumnDef<T> {
  // Enhanced column metadata
  id: string;
  accessorKey?: keyof T;
  header: string | ((props: any) => React.ReactNode);
  cell?: (props: any) => React.ReactNode;
  
  // Column configuration
  enableSorting?: boolean;
  enableColumnFilter?: boolean;
  enableGlobalFilter?: boolean;
  enableHiding?: boolean;
  enablePinning?: boolean;
  enableResizing?: boolean;
  
  // Virtual scrolling properties
  size?: number;
  minSize?: number;
  maxSize?: number;
  
  // Column metadata for UI
  description?: string;
  tooltip?: string;
  dataType?: 'string' | 'number' | 'boolean' | 'date' | 'object';
  
  // Filtering configuration
  filterFn?: string | ((row: Row<T>, columnId: string, filterValue: any) => boolean);
  filterOptions?: {
    placeholder?: string;
    options?: Array<{ label: string; value: any }>;
    multiSelect?: boolean;
  };
  
  // Sorting configuration
  sortingFn?: string | ((rowA: Row<T>, rowB: Row<T>, columnId: string) => number);
  invertSorting?: boolean;
  
  // Cell formatting
  format?: {
    type: 'currency' | 'number' | 'percentage' | 'date' | 'datetime' | 'boolean' | 'custom';
    options?: any;
    customFormatter?: (value: any) => string;
  };
  
  // Aggregation for grouped data
  aggregationFn?: string | ((leafValues: any[]) => any);
  aggregatedCell?: (props: any) => React.ReactNode;
  
  // Column visibility rules
  visibilityRules?: {
    breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
    condition?: (data: T[]) => boolean;
  };
}

/**
 * Table configuration for TanStack Table with React Query integration
 */
export interface TableConfiguration<T = TableMetadata> {
  // Column definitions
  columns: TableColumnDefinition<T>[];
  
  // Data configuration
  data: T[];
  enableRowSelection?: boolean;
  enableMultiRowSelection?: boolean;
  enableSubRowSelection?: boolean;
  
  // Sorting configuration
  enableSorting?: boolean;
  enableMultiSort?: boolean;
  enableSortingRemoval?: boolean;
  maxMultiSortColCount?: number;
  sortDescFirst?: boolean;
  
  // Filtering configuration
  enableFilters?: boolean;
  enableColumnFilters?: boolean;
  enableGlobalFilter?: boolean;
  enableFacetedValues?: boolean;
  globalFilterFn?: string;
  
  // Pagination configuration
  enablePagination?: boolean;
  autoResetPageIndex?: boolean;
  
  // Virtual scrolling configuration
  enableVirtualization?: boolean;
  virtualizationOptions?: {
    estimateSize: number;
    overscan?: number;
    paddingStart?: number;
    paddingEnd?: number;
  };
  
  // Group by configuration
  enableGrouping?: boolean;
  enableExpanding?: boolean;
  enablePinning?: boolean;
  
  // Column resizing
  enableColumnResizing?: boolean;
  columnResizeMode?: 'onChange' | 'onEnd';
  
  // Table state management
  initialState?: {
    sorting?: SortingState;
    columnFilters?: ColumnFiltersState;
    columnVisibility?: VisibilityState;
    pagination?: {
      pageIndex: number;
      pageSize: number;
    };
  };
  
  // Callbacks
  onSortingChange?: (sorting: SortingState) => void;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  onRowSelectionChange?: (selection: any) => void;
  onGlobalFilterChange?: (filter: string) => void;
  
  // Performance optimizations
  getRowId?: (row: T) => string;
  getSubRows?: (row: T) => T[];
  debugTable?: boolean;
  debugHeaders?: boolean;
  debugColumns?: boolean;
}

/**
 * Virtual scrolling item configuration for large datasets
 */
export interface VirtualTableItem {
  index: number;
  size: number;
  start: number;
  end: number;
  item: VirtualItem;
  data: TableMetadata;
  isVisible: boolean;
  isLoaded: boolean;
}

/**
 * Table filtering and search configuration
 */
export interface TableFilterConfig {
  // Global search
  globalFilter: string;
  globalFilterPlaceholder?: string;
  globalFilterDebounceMs?: number;
  
  // Column filters
  columnFilters: ColumnFiltersState;
  enableColumnFilters: boolean;
  
  // Advanced filters
  advancedFilters?: {
    tableType?: 'table' | 'view' | 'all';
    hasData?: boolean;
    hasPrimaryKey?: boolean;
    hasRelationships?: boolean;
    createdAfter?: Date;
    modifiedAfter?: Date;
    sizeRange?: {
      min?: number;
      max?: number;
    };
  };
  
  // Filter persistence
  persistFilters?: boolean;
  filterStorageKey?: string;
  
  // Filter validation
  validateFilters?: boolean;
  filterSchema?: z.ZodSchema;
}

/**
 * Table sorting configuration with performance optimizations
 */
export interface TableSortConfig {
  // Current sorting state
  sorting: SortingState;
  
  // Sorting options
  enableMultiSort: boolean;
  maxSortColumns: number;
  sortDescFirst: boolean;
  enableSortingRemoval: boolean;
  
  // Performance optimizations
  sortingDebounceMs?: number;
  enableServerSideSorting?: boolean;
  
  // Custom sorting functions
  customSortFns?: Record<string, (a: any, b: any) => number>;
  
  // Sort persistence
  persistSorting?: boolean;
  sortStorageKey?: string;
}

// ============================================================================
// REACT QUERY INTEGRATION TYPES
// ============================================================================

/**
 * React Query options for table data fetching
 * Optimized for cache hit responses under 50ms
 */
export interface TableQueryOptions<T = TableMetadata[]> extends UseQueryOptions<T> {
  // Cache configuration
  staleTime?: number; // Default: 5 minutes
  cacheTime?: number; // Default: 10 minutes
  
  // Refetch configuration
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  refetchOnReconnect?: boolean;
  refetchInterval?: number;
  
  // Error handling
  retry?: boolean | number | ((failureCount: number, error: any) => boolean);
  retryDelay?: number | ((retryAttempt: number) => number);
  
  // Background updates
  keepPreviousData?: boolean;
  
  // Suspense and error boundaries
  suspense?: boolean;
  useErrorBoundary?: boolean;
  
  // Query dependencies
  enabled?: boolean;
  
  // Performance optimizations
  structuralSharing?: boolean;
  notifyOnChangeProps?: Array<keyof UseQueryOptions>;
}

/**
 * React Query mutation options for table operations
 * Supports optimistic updates and rollback on error
 */
export interface TableMutationOptions<TData = any, TVariables = any> extends UseMutationOptions<TData, Error, TVariables> {
  // Optimistic updates
  onMutate?: (variables: TVariables) => Promise<any> | any;
  
  // Success handling
  onSuccess?: (data: TData, variables: TVariables, context: any) => Promise<any> | any;
  
  // Error handling with rollback
  onError?: (error: Error, variables: TVariables, context: any) => Promise<any> | any;
  
  // Cleanup
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables, context: any) => Promise<any> | any;
  
  // Cache invalidation
  invalidateQueries?: QueryKey[];
  updateQueries?: Array<{
    queryKey: QueryKey;
    updater: (oldData: any) => any;
  }>;
  
  // Retry configuration
  retry?: boolean | number | ((failureCount: number, error: Error) => boolean);
  retryDelay?: number | ((retryAttempt: number) => number);
  
  // Loading states
  throwOnError?: boolean;
  useErrorBoundary?: boolean;
}

/**
 * Query key factory for table-related operations
 * Provides consistent cache key generation
 */
export interface TableQueryKeys {
  all: () => readonly ['tables'];
  lists: () => readonly ['tables', 'list'];
  list: (serviceId: string, filters?: TableFilterConfig) => readonly ['tables', 'list', string, TableFilterConfig?];
  details: () => readonly ['tables', 'detail'];
  detail: (serviceId: string, tableName: string) => readonly ['tables', 'detail', string, string];
  fields: (serviceId: string, tableName: string) => readonly ['tables', 'fields', string, string];
  relationships: (serviceId: string, tableName: string) => readonly ['tables', 'relationships', string, string];
  indexes: (serviceId: string, tableName: string) => readonly ['tables', 'indexes', string, string];
  constraints: (serviceId: string, tableName: string) => readonly ['tables', 'constraints', string, string];
  schema: (serviceId: string) => readonly ['tables', 'schema', string];
  performance: (serviceId: string, tableName: string) => readonly ['tables', 'performance', string, string];
}

/**
 * Table data fetching parameters for React Query
 */
export interface TableQueryParams {
  // Service identification
  serviceId: string;
  serviceName?: string;
  
  // Filtering and search
  search?: string;
  filters?: TableFilterConfig['advancedFilters'];
  
  // Pagination for progressive loading
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  
  // Data inclusion
  includeFields?: boolean;
  includeRelationships?: boolean;
  includeIndexes?: boolean;
  includeConstraints?: boolean;
  includeStats?: boolean;
  
  // Performance options
  enableVirtualization?: boolean;
  prefetchRelated?: boolean;
  
  // Cache control
  forceRefresh?: boolean;
  backgroundRefresh?: boolean;
}

/**
 * Table mutation parameters for CRUD operations
 */
export interface TableMutationParams {
  // Operation type
  action: 'create' | 'update' | 'delete' | 'duplicate' | 'refresh';
  
  // Target identification
  serviceId: string;
  tableName?: string;
  
  // Operation data
  data?: TableFormData;
  
  // Operation options
  options?: {
    validateSchema?: boolean;
    createBackup?: boolean;
    skipConstraintChecks?: boolean;
    cascadeDeletes?: boolean;
    optimistic?: boolean;
    rollbackOnError?: boolean;
  };
  
  // Batch operations
  batch?: boolean;
  batchSize?: number;
  
  // Conflict resolution
  conflictResolution?: 'fail' | 'skip' | 'overwrite' | 'merge';
}

// ============================================================================
// FORM FIELD CONFIGURATION TYPES
// ============================================================================

/**
 * Form field configuration for React Hook Form integration
 */
export interface FormFieldConfig {
  // Field component type
  component: 'input' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'number' | 'password' | 'custom';
  
  // Field properties
  placeholder?: string;
  helpText?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  
  // Input constraints
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  
  // Select/radio options
  options?: Array<{
    label: string;
    value: any;
    disabled?: boolean;
    description?: string;
  }>;
  
  // Multi-select configuration
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  
  // Conditional rendering
  showWhen?: {
    field: string;
    value: any;
    operator?: 'equals' | 'not_equals' | 'in' | 'not_in';
  };
  
  // Custom validation
  customValidation?: (value: any, formData: any) => string | boolean;
  
  // Field dependencies
  dependsOn?: string[];
  updates?: string[];
  
  // UI customization
  className?: string;
  style?: React.CSSProperties;
  icon?: string;
  prefix?: string;
  suffix?: string;
  
  // Accessibility
  ariaLabel?: string;
  ariaDescription?: string;
  tabIndex?: number;
}

/**
 * Database function configuration for field calculations
 */
export interface DbFunctionConfig {
  use: string[];
  function: string;
  parameters?: Record<string, any>;
  description?: string;
  returnType?: FieldType;
}

// ============================================================================
// NEXT.JS ROUTING TYPES
// ============================================================================

/**
 * Next.js route parameters for table navigation
 * Supports dynamic routing with type safety
 */
export interface TableRouteParams {
  // Service identification
  service: string;
  serviceId?: string;
  
  // Table identification
  table?: string;
  tableId?: string;
  
  // Schema identification
  schema?: string;
  database?: string;
  
  // Operation modes
  mode?: 'view' | 'edit' | 'create' | 'delete';
  
  // Sub-routes
  section?: 'fields' | 'relationships' | 'indexes' | 'constraints' | 'data' | 'api';
}

/**
 * Next.js search parameters for table filtering and state
 */
export interface TableSearchParams {
  // Filtering
  search?: string;
  type?: 'table' | 'view';
  hasData?: 'true' | 'false';
  
  // Pagination
  page?: string;
  pageSize?: string;
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  
  // View options
  view?: 'list' | 'grid' | 'tree';
  columns?: string;
  
  // Advanced filters
  filters?: string; // JSON-encoded filter object
  
  // UI state
  sidebar?: 'open' | 'closed';
  details?: 'open' | 'closed';
}

/**
 * Navigation helpers for table routes
 */
export interface TableNavigationHelpers {
  // Route builders
  buildTableListRoute: (params: Pick<TableRouteParams, 'service'>) => string;
  buildTableDetailRoute: (params: Pick<TableRouteParams, 'service' | 'table'>) => string;
  buildTableEditRoute: (params: Pick<TableRouteParams, 'service' | 'table'>) => string;
  buildTableCreateRoute: (params: Pick<TableRouteParams, 'service'>) => string;
  buildFieldDetailRoute: (params: Pick<TableRouteParams, 'service' | 'table'> & { field: string }) => string;
  
  // Navigation functions
  navigateToTable: (params: TableRouteParams) => void;
  navigateToField: (params: TableRouteParams & { field: string }) => void;
  navigateBack: () => void;
  
  // URL parameter helpers
  parseRouteParams: (params: any) => TableRouteParams;
  parseSearchParams: (searchParams: URLSearchParams) => TableSearchParams;
  buildSearchParams: (params: TableSearchParams) => URLSearchParams;
}

// ============================================================================
// PERFORMANCE AND METRICS TYPES
// ============================================================================

/**
 * Performance metrics for table operations
 */
export interface TablePerformanceMetrics {
  // Query performance
  queryTime: number;
  cacheHitRate: number;
  
  // Rendering performance
  renderTime: number;
  virtualItemsRendered: number;
  totalItems: number;
  
  // Memory usage
  estimatedMemoryUsage: number;
  cacheSize: number;
  
  // User interaction metrics
  scrollPosition: number;
  selectedRows: number;
  appliedFilters: number;
  
  // Data metrics
  tableCount: number;
  fieldCount: number;
  relationshipCount: number;
  
  // Error tracking
  errors: Array<{
    type: string;
    message: string;
    timestamp: Date;
    recoverable: boolean;
  }>;
  
  // Timing metrics
  timestamps: {
    fetchStart: Date;
    fetchEnd: Date;
    renderStart: Date;
    renderEnd: Date;
    lastInteraction: Date;
  };
}

// ============================================================================
// UTILITY TYPES AND CONSTANTS
// ============================================================================

/**
 * SQL reserved words to prevent naming conflicts
 */
export const SQL_RESERVED_WORDS = [
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER',
  'TABLE', 'INDEX', 'VIEW', 'PROCEDURE', 'FUNCTION', 'TRIGGER', 'DATABASE', 'SCHEMA',
  'PRIMARY', 'FOREIGN', 'KEY', 'UNIQUE', 'NOT', 'NULL', 'DEFAULT', 'CHECK', 'CONSTRAINT',
  'REFERENCES', 'CASCADE', 'RESTRICT', 'SET', 'ACTION', 'ON', 'MATCH', 'FULL', 'PARTIAL',
  'SIMPLE', 'DEFERRABLE', 'INITIALLY', 'DEFERRED', 'IMMEDIATE', 'COMMIT', 'ROLLBACK',
  'SAVEPOINT', 'RELEASE', 'START', 'TRANSACTION', 'BEGIN', 'END', 'DECLARE', 'CURSOR',
  'FETCH', 'CLOSE', 'OPEN', 'PREPARE', 'EXECUTE', 'DEALLOCATE', 'DESCRIBE', 'EXPLAIN',
  'ANALYZE', 'UNION', 'INTERSECT', 'EXCEPT', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL',
  'OUTER', 'CROSS', 'NATURAL', 'USING', 'GROUP', 'ORDER', 'BY', 'HAVING', 'DISTINCT',
  'ALL', 'ANY', 'SOME', 'EXISTS', 'IN', 'BETWEEN', 'LIKE', 'ILIKE', 'SIMILAR', 'REGEXP',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'CAST', 'EXTRACT', 'INTERVAL', 'CURRENT_DATE',
  'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'LOCALTIME', 'LOCALTIMESTAMP', 'TRUE', 'FALSE',
  'UNKNOWN', 'AND', 'OR', 'AS', 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'GRANT', 'REVOKE'
] as const;

/**
 * Default table configuration values
 */
export const DEFAULT_TABLE_CONFIG = {
  pageSize: 50,
  virtualScrolling: {
    estimateSize: 50,
    overscan: 10,
  },
  caching: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  },
  validation: {
    debounceMs: 300,
    validateOnChange: true,
    validateOnBlur: true,
  },
  performance: {
    maxVisibleItems: 1000,
    prefetchThreshold: 100,
    maxCacheSize: 100 * 1024 * 1024, // 100MB
  },
} as const;

/**
 * Type utility for extracting form data from table metadata
 */
export type ExtractFormData<T> = T extends TableMetadata
  ? TableFormData
  : T extends TableFieldDefinition
  ? TableFieldFormData
  : T extends TableRelationshipDefinition
  ? TableRelationshipFormData
  : never;

/**
 * Type utility for React Hook Form integration
 */
export type TableFormReturn = UseFormReturn<TableFormData>;

/**
 * Type utility for form errors
 */
export type TableFormErrors = FieldErrors<TableFormData>;

/**
 * Type utility for TanStack Table instance
 */
export type TableInstance = TanStackTable<TableMetadata>;

/**
 * Type guard to check if a field is a primary key
 */
export const isPrimaryKeyField = (field: TableFieldDefinition): boolean => {
  return field.isPrimaryKey;
};

/**
 * Type guard to check if a field is a foreign key
 */
export const isForeignKeyField = (field: TableFieldDefinition): boolean => {
  return field.isForeignKey && !!field.refTable && !!field.refField;
};

/**
 * Type guard to check if a relationship is many-to-many
 */
export const isManyToManyRelationship = (relationship: TableRelationshipDefinition): boolean => {
  return relationship.type === 'many_many' && !!relationship.junctionTable;
};

/**
 * Utility function to create table query keys
 */
export const createTableQueryKeys = (): TableQueryKeys => ({
  all: () => ['tables'] as const,
  lists: () => ['tables', 'list'] as const,
  list: (serviceId: string, filters?: TableFilterConfig) => ['tables', 'list', serviceId, filters] as const,
  details: () => ['tables', 'detail'] as const,
  detail: (serviceId: string, tableName: string) => ['tables', 'detail', serviceId, tableName] as const,
  fields: (serviceId: string, tableName: string) => ['tables', 'fields', serviceId, tableName] as const,
  relationships: (serviceId: string, tableName: string) => ['tables', 'relationships', serviceId, tableName] as const,
  indexes: (serviceId: string, tableName: string) => ['tables', 'indexes', serviceId, tableName] as const,
  constraints: (serviceId: string, tableName: string) => ['tables', 'constraints', serviceId, tableName] as const,
  schema: (serviceId: string) => ['tables', 'schema', serviceId] as const,
  performance: (serviceId: string, tableName: string) => ['tables', 'performance', serviceId, tableName] as const,
});

// ============================================================================
// EXPORT CONVENIENCE TYPES
// ============================================================================

// Export all types for convenient importing
export type {
  // Core types
  TableMetadata,
  TableFieldDefinition,
  TableRelationshipDefinition,
  
  // Form types
  TableFormData,
  TableFieldFormData,
  TableRelationshipFormData,
  TableFormReturn,
  TableFormErrors,
  
  // Validation types
  FieldValidationConfig,
  FieldValidationFormData,
  RelationshipValidationConfig,
  
  // TanStack Table types
  TableColumnDefinition,
  TableConfiguration,
  VirtualTableItem,
  TableFilterConfig,
  TableSortConfig,
  TableInstance,
  
  // React Query types
  TableQueryOptions,
  TableMutationOptions,
  TableQueryKeys,
  TableQueryParams,
  TableMutationParams,
  
  // Form field types
  FormFieldConfig,
  DbFunctionConfig,
  
  // Navigation types
  TableRouteParams,
  TableSearchParams,
  TableNavigationHelpers,
  
  // Performance types
  TablePerformanceMetrics,
  
  // Utility types
  ExtractFormData,
};

// Export schemas for validation
export {
  TableNameSchema,
  FieldNameSchema,
  FieldValidationSchema,
  TableFormSchema,
};

// Export constants
export {
  SQL_RESERVED_WORDS,
  DEFAULT_TABLE_CONFIG,
  createTableQueryKeys,
};

// Export utility functions
export {
  isPrimaryKeyField,
  isForeignKeyField,
  isManyToManyRelationship,
};