/**
 * Database schema discovery types for React/Next.js application
 * Supports schema introspection, virtual scrolling, and React Query caching
 * Optimized for databases with 1000+ tables
 */

import { z } from 'zod';

// ============================================================================
// CORE SCHEMA DISCOVERY TYPES
// ============================================================================

/**
 * Main schema data structure containing all database metadata
 * Optimized for React Query caching and virtual scrolling
 */
export interface SchemaData {
  serviceName: string;
  serviceId: number;
  databaseName: string;
  schemaName?: string;
  tables: SchemaTable[];
  views: SchemaView[];
  procedures?: StoredProcedure[];
  functions?: DatabaseFunction[];
  sequences?: Sequence[];
  lastDiscovered: string;
  totalTables: number;
  totalFields: number;
  totalRelationships: number;
  
  // Virtual scrolling metadata
  virtualScrollingEnabled: boolean;
  pageSize: number;
  estimatedRowHeight: number;
  
  // Progressive loading state
  loadingState: SchemaLoadingState;
  progressiveData?: ProgressiveSchemaData;
}

/**
 * Schema loading state for progressive data fetching
 */
export interface SchemaLoadingState {
  isLoading: boolean;
  isError: boolean;
  error?: string;
  loadedTables: number;
  totalTables: number;
  currentPage: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

/**
 * Progressive loading data structure for large schemas
 */
export interface ProgressiveSchemaData {
  chunks: SchemaChunk[];
  chunkSize: number;
  totalChunks: number;
  loadedChunks: number;
  lastLoadTime: string;
}

/**
 * Schema data chunk for progressive loading
 */
export interface SchemaChunk {
  chunkId: number;
  startIndex: number;
  endIndex: number;
  tables: SchemaTable[];
  loadedAt: string;
  isStale: boolean;
}

/**
 * Enhanced table definition with React component integration
 */
export interface SchemaTable {
  // Core table metadata
  id: string;
  name: string;
  label: string;
  description?: string;
  schema?: string;
  alias?: string;
  plural?: string;
  isView: boolean;
  
  // Field and relationship data
  fields: SchemaField[];
  primaryKey: string[];
  foreignKeys: ForeignKey[];
  indexes: TableIndex[];
  constraints: TableConstraint[];
  triggers?: Trigger[];
  related: TableRelated[];
  
  // Table metadata
  nameField?: string;
  rowCount?: number;
  estimatedSize?: string;
  lastModified?: string;
  collation?: string;
  engine?: string;
  access?: number;
  
  // Virtual scrolling properties
  virtualIndex?: number;
  virtualHeight?: number;
  isVisible?: boolean;
  
  // UI state for hierarchical tree
  expanded: boolean;
  selected: boolean;
  level: number;
  hasChildren: boolean;
  isLoading: boolean;
  
  // API generation state
  apiEnabled: boolean;
  generatedEndpoints?: string[];
  
  // React Query cache keys
  cacheKey: string;
  lastCacheUpdate: string;
}

/**
 * Enhanced field definition with validation and UI metadata
 */
export interface SchemaField {
  // Core field metadata
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
  
  // Field constraints
  isNullable: boolean;
  allowNull: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  isIndex: boolean;
  isAutoIncrement: boolean;
  isComputed?: boolean;
  isVirtual: boolean;
  isAggregate: boolean;
  required: boolean;
  fixedLength: boolean;
  supportsMultibyte: boolean;
  
  // Relationship metadata
  refTable?: string;
  refField?: string;
  refOnUpdate?: ReferentialAction;
  refOnDelete?: ReferentialAction;
  
  // Validation and constraints
  validation?: FieldValidation;
  constraints?: FieldConstraint[];
  picklist?: string[];
  
  // UI metadata
  format?: FieldFormat;
  hidden: boolean;
  
  // Database functions
  dbFunction?: DbFunctionUse[];
  
  // Native database metadata
  native?: any[];
  value?: any[];
}

/**
 * Database function usage information
 */
export interface DbFunctionUse {
  use: string[];
  function: string;
}

/**
 * Enhanced field type enumeration
 */
export type FieldType = 
  | 'integer'
  | 'bigint'
  | 'decimal'
  | 'float'
  | 'double'
  | 'string'
  | 'text'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'timestamp'
  | 'time'
  | 'binary'
  | 'json'
  | 'xml'
  | 'uuid'
  | 'enum'
  | 'set'
  | 'blob'
  | 'clob'
  | 'geometry'
  | 'point'
  | 'linestring'
  | 'polygon';

/**
 * Field validation configuration
 */
export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  enum?: string[];
  format?: string;
  customValidator?: string;
  
  // Validation messages
  messages?: ValidationMessages;
  
  // Real-time validation settings
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

/**
 * Validation error messages
 */
export interface ValidationMessages {
  required?: string;
  minLength?: string;
  maxLength?: string;
  pattern?: string;
  min?: string;
  max?: string;
  format?: string;
  custom?: string;
}

/**
 * Field constraint definition
 */
export interface FieldConstraint {
  type: ConstraintType;
  definition: string;
  name?: string;
  message?: string;
  fields?: string[];
}

/**
 * Database constraint types
 */
export type ConstraintType = 
  | 'check'
  | 'unique'
  | 'foreign_key'
  | 'primary_key'
  | 'default'
  | 'not_null'
  | 'exclude'
  | 'partial';

/**
 * Field formatting configuration for UI display
 */
export interface FieldFormat {
  mask?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  uppercase?: boolean;
  lowercase?: boolean;
  capitalize?: boolean;
  dateFormat?: string;
  currencyCode?: string;
  thousandsSeparator?: string;
  decimalSeparator?: string;
}

/**
 * Foreign key relationship definition
 */
export interface ForeignKey {
  name: string;
  field: string;
  referencedTable: string;
  referencedField: string;
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
  deferrable?: boolean;
  initiallyDeferred?: boolean;
}

/**
 * Referential action types
 */
export type ReferentialAction = 
  | 'NO ACTION'
  | 'RESTRICT'
  | 'CASCADE'
  | 'SET NULL'
  | 'SET DEFAULT';

/**
 * Table index definition
 */
export interface TableIndex {
  name: string;
  fields: string[];
  unique: boolean;
  type?: IndexType;
  method?: string;
  condition?: string;
  partial?: boolean;
  clustered?: boolean;
  fillFactor?: number;
}

/**
 * Database index types
 */
export type IndexType = 
  | 'btree'
  | 'hash'
  | 'gist'
  | 'gin'
  | 'brin'
  | 'spgist'
  | 'bitmap'
  | 'clustered'
  | 'nonclustered';

/**
 * Table constraint definition
 */
export interface TableConstraint {
  name: string;
  type: ConstraintType;
  definition: string;
  fields: string[];
  condition?: string;
  deferrable?: boolean;
  initiallyDeferred?: boolean;
}

/**
 * Enhanced table relationship with React composition patterns
 */
export interface TableRelated {
  // Core relationship metadata
  id: string;
  alias: string;
  name: string;
  label: string;
  description?: string;
  native?: any[];
  
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
  
  // Junction table configuration (for many-to-many)
  junctionServiceId?: number;
  junctionTable?: string;
  junctionField?: string;
  junctionRefField?: string;
  
  // Fetch behavior
  alwaysFetch: boolean;
  flatten: boolean;
  flattenDropPrefix: boolean;
  
  // UI state
  expanded?: boolean;
  loading?: boolean;
  
  // React Query cache information
  cacheKey?: string;
  lastFetched?: string;
}

/**
 * Relationship types
 */
export type RelationshipType = 
  | 'belongs_to'
  | 'has_many'
  | 'has_one'
  | 'many_many'
  | 'polymorphic'
  | 'through';

// ============================================================================
// SCHEMA VIEWS AND PROCEDURES
// ============================================================================

/**
 * Database view definition
 */
export interface SchemaView {
  name: string;
  label?: string;
  description?: string;
  definition: string;
  fields: SchemaField[];
  updatable: boolean;
  checkOption?: 'CASCADED' | 'LOCAL' | 'NONE';
  securityType?: 'DEFINER' | 'INVOKER';
  algorithm?: 'MERGE' | 'TEMPTABLE' | 'UNDEFINED';
  
  // UI state
  expanded?: boolean;
  selected?: boolean;
}

/**
 * Stored procedure definition
 */
export interface StoredProcedure {
  name: string;
  label?: string;
  description?: string;
  parameters: ProcedureParameter[];
  returnType?: string;
  definition: string;
  language?: string;
  securityType?: 'DEFINER' | 'INVOKER';
  deterministic?: boolean;
  sqlDataAccess?: 'CONTAINS SQL' | 'NO SQL' | 'READS SQL DATA' | 'MODIFIES SQL DATA';
}

/**
 * Procedure parameter definition
 */
export interface ProcedureParameter {
  name: string;
  type: string;
  mode: 'IN' | 'OUT' | 'INOUT';
  defaultValue?: string;
  description?: string;
}

/**
 * Database function definition
 */
export interface DatabaseFunction {
  name: string;
  label?: string;
  description?: string;
  parameters: FunctionParameter[];
  returnType: string;
  definition: string;
  language?: string;
  immutable?: boolean;
  strict?: boolean;
  securityDefiner?: boolean;
  cost?: number;
  rows?: number;
}

/**
 * Function parameter definition
 */
export interface FunctionParameter {
  name: string;
  type: string;
  defaultValue?: string;
  description?: string;
}

/**
 * Database sequence definition
 */
export interface Sequence {
  name: string;
  label?: string;
  description?: string;
  increment: number;
  minValue?: number;
  maxValue?: number;
  startValue: number;
  cache?: number;
  cycle?: boolean;
  ownedBy?: string;
}

/**
 * Database trigger definition
 */
export interface Trigger {
  name: string;
  timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF';
  events: TriggerEvent[];
  definition: string;
  condition?: string;
  orientation?: 'ROW' | 'STATEMENT';
  enabled?: boolean;
}

/**
 * Trigger event types
 */
export type TriggerEvent = 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE';

// ============================================================================
// HIERARCHICAL TREE STRUCTURES
// ============================================================================

/**
 * Tree node for hierarchical schema display
 */
export interface SchemaTreeNode {
  id: string;
  type: TreeNodeType;
  name: string;
  label: string;
  description?: string;
  
  // Tree structure
  parentId?: string;
  children: SchemaTreeNode[];
  level: number;
  index: number;
  
  // UI state
  expanded: boolean;
  selected: boolean;
  isLoading: boolean;
  hasChildren: boolean;
  
  // Virtual scrolling
  virtualIndex?: number;
  virtualHeight?: number;
  isVisible?: boolean;
  
  // Data reference
  data?: SchemaTable | SchemaView | StoredProcedure | DatabaseFunction;
  
  // React Query cache
  cacheKey: string;
  lastUpdated: string;
}

/**
 * Tree node types for schema hierarchy
 */
export type TreeNodeType = 
  | 'database'
  | 'schema'
  | 'tables'
  | 'table'
  | 'views'
  | 'view'
  | 'procedures'
  | 'procedure'
  | 'functions'
  | 'function'
  | 'sequences'
  | 'sequence'
  | 'field'
  | 'relationship'
  | 'index'
  | 'constraint';

/**
 * Tree virtualization configuration
 */
export interface TreeVirtualizationConfig {
  enabled: boolean;
  estimatedRowHeight: number;
  overscan: number;
  scrollingDelay: number;
  getItemSize: (index: number) => number;
  debug?: boolean;
}

/**
 * Tree expansion state management
 */
export interface TreeExpansionState {
  expandedNodes: Set<string>;
  selectedNodes: Set<string>;
  focusedNode?: string;
  
  // Actions
  expandNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;
  toggleNode: (nodeId: string) => void;
  selectNode: (nodeId: string, multiSelect?: boolean) => void;
  focusNode: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

// ============================================================================
// REACT QUERY INTEGRATION
// ============================================================================

/**
 * React Query cache configuration for schema data
 */
export interface SchemaCacheConfig {
  staleTime: number;
  cacheTime: number;
  refetchOnWindowFocus: boolean;
  refetchOnMount: boolean;
  refetchOnReconnect: boolean;
  retry: number;
  retryDelay: number;
  
  // Progressive loading configuration
  enableProgressiveLoading: boolean;
  chunkSize: number;
  maxConcurrentChunks: number;
  prefetchThreshold: number;
}

/**
 * Schema query parameters for React Query
 */
export interface SchemaQueryParams {
  serviceName: string;
  serviceId: number;
  includeViews?: boolean;
  includeProcedures?: boolean;
  includeFunctions?: boolean;
  includeSequences?: boolean;
  includeConstraints?: boolean;
  includeIndexes?: boolean;
  includeTriggers?: boolean;
  
  // Filtering
  tableFilter?: string;
  schemaFilter?: string;
  typeFilter?: TreeNodeType[];
  
  // Pagination for progressive loading
  page?: number;
  pageSize?: number;
  cursor?: string;
}

/**
 * Schema mutation parameters for updates
 */
export interface SchemaMutationParams {
  serviceName: string;
  action: SchemaMutationAction;
  target: SchemaMutationTarget;
  data: any;
  
  // Optimistic update configuration
  optimistic?: boolean;
  rollbackOnError?: boolean;
}

/**
 * Schema mutation actions
 */
export type SchemaMutationAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'refresh'
  | 'discover'
  | 'cache_clear';

/**
 * Schema mutation targets
 */
export type SchemaMutationTarget = 
  | 'table'
  | 'field'
  | 'relationship'
  | 'index'
  | 'constraint'
  | 'view'
  | 'procedure'
  | 'function'
  | 'sequence'
  | 'schema';

// ============================================================================
// PERFORMANCE OPTIMIZATION TYPES
// ============================================================================

/**
 * Virtual scrolling item data
 */
export interface VirtualScrollItem {
  index: number;
  key: string;
  data: SchemaTable | SchemaView | StoredProcedure | DatabaseFunction;
  height: number;
  isVisible: boolean;
  isLoaded: boolean;
}

/**
 * Performance metrics for schema operations
 */
export interface SchemaPerformanceMetrics {
  discoveryTime: number;
  renderTime: number;
  cacheHitRate: number;
  totalTables: number;
  loadedTables: number;
  averageTableSize: number;
  
  // Virtual scrolling metrics
  virtualItemsRendered: number;
  virtualScrollPosition: number;
  virtualScrollHeight: number;
  
  // Memory usage
  estimatedMemoryUsage: number;
  cacheSize: number;
  
  // Error tracking
  errors: SchemaError[];
  warnings: SchemaWarning[];
}

/**
 * Schema error information
 */
export interface SchemaError {
  type: SchemaErrorType;
  message: string;
  details?: string;
  timestamp: string;
  tableName?: string;
  fieldName?: string;
  recoverable: boolean;
}

/**
 * Schema error types
 */
export type SchemaErrorType = 
  | 'connection_failed'
  | 'discovery_timeout'
  | 'permission_denied'
  | 'table_not_found'
  | 'field_not_found'
  | 'relationship_invalid'
  | 'cache_error'
  | 'validation_error'
  | 'unknown_error';

/**
 * Schema warning information
 */
export interface SchemaWarning {
  type: SchemaWarningType;
  message: string;
  timestamp: string;
  tableName?: string;
  fieldName?: string;
  suggestion?: string;
}

/**
 * Schema warning types
 */
export type SchemaWarningType = 
  | 'large_table'
  | 'missing_primary_key'
  | 'unused_index'
  | 'circular_reference'
  | 'performance_concern'
  | 'compatibility_issue';

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for field validation configuration
 */
export const FieldValidationSchema = z.object({
  required: z.boolean().optional(),
  minLength: z.number().min(0).optional(),
  maxLength: z.number().min(1).optional(),
  pattern: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  enum: z.array(z.string()).optional(),
  format: z.string().optional(),
  customValidator: z.string().optional(),
  messages: z.object({
    required: z.string().optional(),
    minLength: z.string().optional(),
    maxLength: z.string().optional(),
    pattern: z.string().optional(),
    min: z.string().optional(),
    max: z.string().optional(),
    format: z.string().optional(),
    custom: z.string().optional(),
  }).optional(),
  validateOnChange: z.boolean().optional(),
  validateOnBlur: z.boolean().optional(),
  debounceMs: z.number().min(0).optional(),
});

/**
 * Zod schema for schema field definition
 */
export const SchemaFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  alias: z.string().optional(),
  type: z.enum(['integer', 'bigint', 'decimal', 'float', 'double', 'string', 'text', 'boolean', 'date', 'datetime', 'timestamp', 'time', 'binary', 'json', 'xml', 'uuid', 'enum', 'set', 'blob', 'clob', 'geometry', 'point', 'linestring', 'polygon']),
  dbType: z.string(),
  length: z.number().optional(),
  precision: z.number().optional(),
  scale: z.number().optional(),
  defaultValue: z.any().optional(),
  isNullable: z.boolean(),
  allowNull: z.boolean(),
  isPrimaryKey: z.boolean(),
  isForeignKey: z.boolean(),
  isUnique: z.boolean(),
  isIndex: z.boolean(),
  isAutoIncrement: z.boolean(),
  isComputed: z.boolean().optional(),
  isVirtual: z.boolean(),
  isAggregate: z.boolean(),
  required: z.boolean(),
  fixedLength: z.boolean(),
  supportsMultibyte: z.boolean(),
  refTable: z.string().optional(),
  refField: z.string().optional(),
  refOnUpdate: z.enum(['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT']).optional(),
  refOnDelete: z.enum(['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT']).optional(),
  validation: FieldValidationSchema.optional(),
  constraints: z.array(z.object({
    type: z.enum(['check', 'unique', 'foreign_key', 'primary_key', 'default', 'not_null', 'exclude', 'partial']),
    definition: z.string(),
    name: z.string().optional(),
    message: z.string().optional(),
    fields: z.array(z.string()).optional(),
  })).optional(),
  picklist: z.array(z.string()).optional(),
  format: z.object({
    mask: z.string().optional(),
    placeholder: z.string().optional(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    uppercase: z.boolean().optional(),
    lowercase: z.boolean().optional(),
    capitalize: z.boolean().optional(),
    dateFormat: z.string().optional(),
    currencyCode: z.string().optional(),
    thousandsSeparator: z.string().optional(),
    decimalSeparator: z.string().optional(),
  }).optional(),
  hidden: z.boolean(),
  dbFunction: z.array(z.object({
    use: z.array(z.string()),
    function: z.string(),
  })).optional(),
  native: z.array(z.any()).optional(),
  value: z.array(z.any()).optional(),
});

/**
 * Zod schema for schema table definition
 */
export const SchemaTableSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  schema: z.string().optional(),
  alias: z.string().optional(),
  plural: z.string().optional(),
  isView: z.boolean(),
  fields: z.array(SchemaFieldSchema),
  primaryKey: z.array(z.string()),
  foreignKeys: z.array(z.object({
    name: z.string(),
    field: z.string(),
    referencedTable: z.string(),
    referencedField: z.string(),
    onDelete: z.enum(['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT']).optional(),
    onUpdate: z.enum(['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT']).optional(),
    deferrable: z.boolean().optional(),
    initiallyDeferred: z.boolean().optional(),
  })),
  indexes: z.array(z.object({
    name: z.string(),
    fields: z.array(z.string()),
    unique: z.boolean(),
    type: z.enum(['btree', 'hash', 'gist', 'gin', 'brin', 'spgist', 'bitmap', 'clustered', 'nonclustered']).optional(),
    method: z.string().optional(),
    condition: z.string().optional(),
    partial: z.boolean().optional(),
    clustered: z.boolean().optional(),
    fillFactor: z.number().optional(),
  })),
  constraints: z.array(z.object({
    name: z.string(),
    type: z.enum(['check', 'unique', 'foreign_key', 'primary_key', 'default', 'not_null', 'exclude', 'partial']),
    definition: z.string(),
    fields: z.array(z.string()),
    condition: z.string().optional(),
    deferrable: z.boolean().optional(),
    initiallyDeferred: z.boolean().optional(),
  })),
  triggers: z.array(z.object({
    name: z.string(),
    timing: z.enum(['BEFORE', 'AFTER', 'INSTEAD OF']),
    events: z.array(z.enum(['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'])),
    definition: z.string(),
    condition: z.string().optional(),
    orientation: z.enum(['ROW', 'STATEMENT']).optional(),
    enabled: z.boolean().optional(),
  })).optional(),
  related: z.array(z.object({
    id: z.string(),
    alias: z.string(),
    name: z.string(),
    label: z.string(),
    description: z.string().optional(),
    native: z.array(z.any()).optional(),
    type: z.enum(['belongs_to', 'has_many', 'has_one', 'many_many', 'polymorphic', 'through']),
    field: z.string(),
    isVirtual: z.boolean(),
    refServiceId: z.number(),
    refTable: z.string(),
    refField: z.string(),
    refOnUpdate: z.enum(['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT']).optional(),
    refOnDelete: z.enum(['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT']).optional(),
    junctionServiceId: z.number().optional(),
    junctionTable: z.string().optional(),
    junctionField: z.string().optional(),
    junctionRefField: z.string().optional(),
    alwaysFetch: z.boolean(),
    flatten: z.boolean(),
    flattenDropPrefix: z.boolean(),
    expanded: z.boolean().optional(),
    loading: z.boolean().optional(),
    cacheKey: z.string().optional(),
    lastFetched: z.string().optional(),
  })),
  nameField: z.string().optional(),
  rowCount: z.number().optional(),
  estimatedSize: z.string().optional(),
  lastModified: z.string().optional(),
  collation: z.string().optional(),
  engine: z.string().optional(),
  access: z.number().optional(),
  virtualIndex: z.number().optional(),
  virtualHeight: z.number().optional(),
  isVisible: z.boolean().optional(),
  expanded: z.boolean(),
  selected: z.boolean(),
  level: z.number(),
  hasChildren: z.boolean(),
  isLoading: z.boolean(),
  apiEnabled: z.boolean(),
  generatedEndpoints: z.array(z.string()).optional(),
  cacheKey: z.string(),
  lastCacheUpdate: z.string(),
});

/**
 * Zod schema for complete schema data structure
 */
export const SchemaDataSchema = z.object({
  serviceName: z.string().min(1),
  serviceId: z.number(),
  databaseName: z.string().min(1),
  schemaName: z.string().optional(),
  tables: z.array(SchemaTableSchema),
  views: z.array(z.object({
    name: z.string(),
    label: z.string().optional(),
    description: z.string().optional(),
    definition: z.string(),
    fields: z.array(SchemaFieldSchema),
    updatable: z.boolean(),
    checkOption: z.enum(['CASCADED', 'LOCAL', 'NONE']).optional(),
    securityType: z.enum(['DEFINER', 'INVOKER']).optional(),
    algorithm: z.enum(['MERGE', 'TEMPTABLE', 'UNDEFINED']).optional(),
    expanded: z.boolean().optional(),
    selected: z.boolean().optional(),
  })),
  procedures: z.array(z.object({
    name: z.string(),
    label: z.string().optional(),
    description: z.string().optional(),
    parameters: z.array(z.object({
      name: z.string(),
      type: z.string(),
      mode: z.enum(['IN', 'OUT', 'INOUT']),
      defaultValue: z.string().optional(),
      description: z.string().optional(),
    })),
    returnType: z.string().optional(),
    definition: z.string(),
    language: z.string().optional(),
    securityType: z.enum(['DEFINER', 'INVOKER']).optional(),
    deterministic: z.boolean().optional(),
    sqlDataAccess: z.enum(['CONTAINS SQL', 'NO SQL', 'READS SQL DATA', 'MODIFIES SQL DATA']).optional(),
  })).optional(),
  functions: z.array(z.object({
    name: z.string(),
    label: z.string().optional(),
    description: z.string().optional(),
    parameters: z.array(z.object({
      name: z.string(),
      type: z.string(),
      defaultValue: z.string().optional(),
      description: z.string().optional(),
    })),
    returnType: z.string(),
    definition: z.string(),
    language: z.string().optional(),
    immutable: z.boolean().optional(),
    strict: z.boolean().optional(),
    securityDefiner: z.boolean().optional(),
    cost: z.number().optional(),
    rows: z.number().optional(),
  })).optional(),
  sequences: z.array(z.object({
    name: z.string(),
    label: z.string().optional(),
    description: z.string().optional(),
    increment: z.number(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    startValue: z.number(),
    cache: z.number().optional(),
    cycle: z.boolean().optional(),
    ownedBy: z.string().optional(),
  })).optional(),
  lastDiscovered: z.string(),
  totalTables: z.number(),
  totalFields: z.number(),
  totalRelationships: z.number(),
  virtualScrollingEnabled: z.boolean(),
  pageSize: z.number(),
  estimatedRowHeight: z.number(),
  loadingState: z.object({
    isLoading: z.boolean(),
    isError: z.boolean(),
    error: z.string().optional(),
    loadedTables: z.number(),
    totalTables: z.number(),
    currentPage: z.number(),
    hasNextPage: z.boolean(),
    isFetchingNextPage: z.boolean(),
  }),
  progressiveData: z.object({
    chunks: z.array(z.object({
      chunkId: z.number(),
      startIndex: z.number(),
      endIndex: z.number(),
      tables: z.array(SchemaTableSchema),
      loadedAt: z.string(),
      isStale: z.boolean(),
    })),
    chunkSize: z.number(),
    totalChunks: z.number(),
    loadedChunks: z.number(),
    lastLoadTime: z.string(),
  }).optional(),
});

// ============================================================================
// LEGACY COMPATIBILITY TYPES
// ============================================================================

/**
 * Legacy database row data for compatibility with existing Angular code
 * @deprecated Use SchemaTable instead
 */
export type DatabaseRowData = {
  id: number;
  description: string;
  label: string;
  name: string;
  type: string;
};

/**
 * Legacy database table row data for compatibility
 * @deprecated Use SchemaTable instead
 */
export type DatabaseTableRowData = {
  name: string;
  label: string;
  id: string;
};

/**
 * Legacy table related type for compatibility
 * @deprecated Use TableRelated instead
 */
export type TableRelatedType = {
  alias: string;
  name?: string;
  label?: string;
  description?: string;
  native?: any[];
  type: 'belongs_to' | 'has_many' | 'has_one' | 'many_many';
  field: string;
  isVirtual: boolean;
  refServiceId: number;
  refTable: string;
  refField: string;
  refOnUpdate?: any;
  refOnDelete?: any;
  junctionServiceId?: number;
  junctionTable?: string;
  junctionField?: string;
  junctionRefField?: string;
  alwaysFetch: boolean;
  flatten: boolean;
  flattenDropPrefix: boolean;
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract field types that are numeric
 */
export type NumericFieldType = Extract<FieldType, 'integer' | 'bigint' | 'decimal' | 'float' | 'double'>;

/**
 * Extract field types that are textual
 */
export type TextFieldType = Extract<FieldType, 'string' | 'text' | 'json' | 'xml'>;

/**
 * Extract field types that are date/time related
 */
export type DateTimeFieldType = Extract<FieldType, 'date' | 'datetime' | 'timestamp' | 'time'>;

/**
 * Extract field types that are binary
 */
export type BinaryFieldType = Extract<FieldType, 'binary' | 'blob'>;

/**
 * Extract field types that are geometric
 */
export type GeometricFieldType = Extract<FieldType, 'geometry' | 'point' | 'linestring' | 'polygon'>;

/**
 * Utility type for partial schema table updates
 */
export type PartialSchemaTable = Partial<Omit<SchemaTable, 'id' | 'name'>> & Pick<SchemaTable, 'id' | 'name'>;

/**
 * Utility type for partial schema field updates
 */
export type PartialSchemaField = Partial<Omit<SchemaField, 'id' | 'name'>> & Pick<SchemaField, 'id' | 'name'>;

/**
 * Type guard to check if field type is numeric
 */
export const isNumericField = (type: FieldType): type is NumericFieldType => {
  return ['integer', 'bigint', 'decimal', 'float', 'double'].includes(type);
};

/**
 * Type guard to check if field type is textual
 */
export const isTextField = (type: FieldType): type is TextFieldType => {
  return ['string', 'text', 'json', 'xml'].includes(type);
};

/**
 * Type guard to check if field type is date/time
 */
export const isDateTimeField = (type: FieldType): type is DateTimeFieldType => {
  return ['date', 'datetime', 'timestamp', 'time'].includes(type);
};

/**
 * Type guard to check if field type is binary
 */
export const isBinaryField = (type: FieldType): type is BinaryFieldType => {
  return ['binary', 'blob'].includes(type);
};

/**
 * Type guard to check if field type is geometric
 */
export const isGeometricField = (type: FieldType): type is GeometricFieldType => {
  return ['geometry', 'point', 'linestring', 'polygon'].includes(type);
};