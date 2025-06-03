/**
 * Database Schema Discovery Types for React/Next.js Implementation
 * 
 * Comprehensive schema introspection types supporting:
 * - Hierarchical tree visualization with virtual scrolling (1000+ tables)
 * - React Query-powered caching and synchronization
 * - Zod validation schemas for type safety
 * - Progressive loading for large datasets
 * - Relationship mapping with React component composition
 * 
 * Migrated from Angular RxJS-based implementation to React Query patterns
 * with enhanced performance optimization for enterprise-scale databases.
 */

import { z } from 'zod';
import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { VirtualItem } from '@tanstack/react-virtual';

// =============================================================================
// CORE SCHEMA DISCOVERY TYPES
// =============================================================================

/**
 * Database schema discovery metadata with React Query integration
 * Supports progressive loading and virtual scrolling for 1000+ tables
 */
export interface SchemaDiscoveryData {
  serviceName: string;
  databaseName: string;
  schemaName?: string;
  tables: SchemaTable[];
  views: SchemaView[];
  procedures?: StoredProcedure[];
  functions?: DatabaseFunction[];
  sequences?: Sequence[];
  
  // Performance optimization metadata
  totalTables: number;
  totalFields: number;
  lastDiscovered: string;
  discoveryDuration?: number;
  
  // Virtual scrolling state
  virtualItems?: VirtualItem[];
  estimatedSize?: number;
  overscan?: number;
  
  // React Query cache metadata
  cacheKey: string[];
  staleTime: number;
  refetchInterval?: number;
}

/**
 * Enhanced table metadata with React component composition support
 * Optimized for hierarchical tree visualization and performance
 */
export interface SchemaTable {
  // Core table metadata
  name: string;
  label?: string;
  description?: string;
  schema?: string;
  alias?: string;
  
  // Table structure
  fields: SchemaField[];
  primaryKey: string[];
  foreignKeys: ForeignKey[];
  indexes: TableIndex[];
  constraints: TableConstraint[];
  triggers?: Trigger[];
  
  // Table statistics and metadata
  rowCount?: number;
  estimatedSize?: string;
  lastModified?: string;
  collation?: string;
  engine?: string;
  isView: boolean;
  
  // React component state management
  expanded?: boolean;
  selected?: boolean;
  loading?: boolean;
  error?: string;
  
  // API generation configuration
  apiEnabled?: boolean;
  endpointGenerated?: boolean;
  access?: number;
  
  // Virtual scrolling optimization
  virtualIndex?: number;
  measureElement?: HTMLElement | null;
  
  // React Query integration
  queryKey: string[];
  lastFetched?: string;
  isCached?: boolean;
}

/**
 * Enhanced field metadata with Zod validation integration
 * Supports comprehensive type safety and runtime validation
 */
export interface SchemaField {
  // Core field metadata
  name: string;
  label?: string;
  description?: string;
  alias?: string;
  
  // Type system integration
  type: FieldType;
  dbType: string;
  zodSchema?: z.ZodSchema<any>;
  reactHookFormValidation?: Record<string, any>;
  
  // Field constraints and metadata
  length?: number;
  precision?: number;
  scale?: number;
  default?: any;
  
  // Boolean flags
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  isAutoIncrement: boolean;
  isVirtual: boolean;
  isAggregate: boolean;
  isIndex: boolean;
  required: boolean;
  allowNull: boolean;
  fixedLength: boolean;
  supportsMultibyte: boolean;
  
  // Foreign key relationships
  refTable?: string;
  refField?: string;
  refOnUpdate?: ReferentialAction;
  refOnDelete?: ReferentialAction;
  refServiceId?: number;
  
  // Validation and constraints
  validation?: FieldValidation;
  constraints?: FieldConstraint[];
  picklist?: string[];
  
  // Database functions and computed fields
  dbFunction?: DatabaseFunctionUse[];
  native?: any[];
  
  // UI metadata and formatting
  format?: FieldFormat;
  hidden?: boolean;
  readonly?: boolean;
  
  // React component integration
  componentProps?: Record<string, any>;
  renderComponent?: ReactNode;
}

/**
 * Progressive loading configuration for large schema datasets
 * Optimizes performance for databases with 1000+ tables
 */
export interface ProgressiveLoadingConfig {
  enabled: boolean;
  pageSize: number;
  totalItems: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isLoading: boolean;
  isFetching: boolean;
  
  // Virtual scrolling integration
  startIndex: number;
  endIndex: number;
  overscanStartIndex: number;
  overscanEndIndex: number;
  
  // React Query optimization
  prefetchNext: boolean;
  staleTime: number;
  cacheTime: number;
  keepPreviousData: boolean;
}

/**
 * Hierarchical tree node for schema visualization
 * Supports nested expansion and virtual scrolling
 */
export interface SchemaTreeNode {
  id: string;
  type: 'database' | 'schema' | 'table' | 'view' | 'field' | 'relation';
  name: string;
  label?: string;
  level: number;
  hasChildren: boolean;
  children?: SchemaTreeNode[];
  
  // Tree state management
  expanded: boolean;
  selected: boolean;
  disabled: boolean;
  loading: boolean;
  
  // Virtual scrolling data
  virtualIndex: number;
  estimatedHeight: number;
  actualHeight?: number;
  
  // Associated data
  tableData?: SchemaTable;
  fieldData?: SchemaField;
  relationData?: TableRelationship;
  
  // Component props
  icon?: ReactNode;
  actions?: TreeNodeAction[];
  contextMenu?: TreeContextMenu;
}

/**
 * Tree node action for interactive operations
 */
export interface TreeNodeAction {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  hidden?: boolean;
  onClick: (node: SchemaTreeNode) => void;
  tooltip?: string;
}

/**
 * Context menu configuration for tree nodes
 */
export interface TreeContextMenu {
  items: ContextMenuItem[];
  position?: { x: number; y: number };
  visible: boolean;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  separator?: boolean;
  children?: ContextMenuItem[];
  onClick?: (node: SchemaTreeNode) => void;
}

// =============================================================================
// FIELD TYPE SYSTEM WITH ZOD INTEGRATION
// =============================================================================

/**
 * Enhanced field type enum with comprehensive database support
 */
export enum FieldType {
  // Numeric types
  INTEGER = 'integer',
  BIGINT = 'bigint',
  SMALLINT = 'smallint',
  TINYINT = 'tinyint',
  DECIMAL = 'decimal',
  NUMERIC = 'numeric',
  FLOAT = 'float',
  DOUBLE = 'double',
  REAL = 'real',
  
  // String types
  STRING = 'string',
  CHAR = 'char',
  VARCHAR = 'varchar',
  TEXT = 'text',
  LONGTEXT = 'longtext',
  MEDIUMTEXT = 'mediumtext',
  TINYTEXT = 'tinytext',
  
  // Boolean type
  BOOLEAN = 'boolean',
  BIT = 'bit',
  
  // Date and time types
  DATE = 'date',
  DATETIME = 'datetime',
  TIMESTAMP = 'timestamp',
  TIME = 'time',
  YEAR = 'year',
  
  // Binary types
  BINARY = 'binary',
  VARBINARY = 'varbinary',
  BLOB = 'blob',
  LONGBLOB = 'longblob',
  MEDIUMBLOB = 'mediumblob',
  TINYBLOB = 'tinyblob',
  
  // Structured types
  JSON = 'json',
  XML = 'xml',
  ARRAY = 'array',
  OBJECT = 'object',
  
  // Special types
  UUID = 'uuid',
  ENUM = 'enum',
  SET = 'set',
  GEOMETRY = 'geometry',
  POINT = 'point',
  POLYGON = 'polygon',
  
  // MongoDB specific
  OBJECTID = 'objectid',
  
  // Unknown/custom
  UNKNOWN = 'unknown'
}

/**
 * Zod schema factory for database field types
 * Provides runtime validation with compile-time type inference
 */
export const createFieldZodSchema = (field: SchemaField): z.ZodSchema<any> => {
  let schema: z.ZodSchema<any>;
  
  switch (field.type) {
    case FieldType.INTEGER:
    case FieldType.BIGINT:
    case FieldType.SMALLINT:
    case FieldType.TINYINT:
      schema = z.number().int();
      break;
    case FieldType.DECIMAL:
    case FieldType.NUMERIC:
    case FieldType.FLOAT:
    case FieldType.DOUBLE:
      schema = z.number();
      break;
    case FieldType.STRING:
    case FieldType.VARCHAR:
    case FieldType.CHAR:
      schema = z.string();
      if (field.length) {
        schema = schema.max(field.length);
      }
      break;
    case FieldType.TEXT:
    case FieldType.LONGTEXT:
      schema = z.string();
      break;
    case FieldType.BOOLEAN:
      schema = z.boolean();
      break;
    case FieldType.DATE:
      schema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
      break;
    case FieldType.DATETIME:
    case FieldType.TIMESTAMP:
      schema = z.string().datetime();
      break;
    case FieldType.JSON:
      schema = z.record(z.any());
      break;
    case FieldType.ARRAY:
      schema = z.array(z.any());
      break;
    case FieldType.UUID:
      schema = z.string().uuid();
      break;
    case FieldType.ENUM:
      if (field.picklist && field.picklist.length > 0) {
        schema = z.enum(field.picklist as [string, ...string[]]);
      } else {
        schema = z.string();
      }
      break;
    default:
      schema = z.any();
  }
  
  // Apply nullable/required constraints
  if (!field.required || field.allowNull) {
    schema = schema.nullable().optional();
  }
  
  // Apply custom validation rules
  if (field.validation) {
    if (field.validation.minLength !== undefined) {
      schema = schema.refine(
        (val) => !val || val.toString().length >= field.validation!.minLength!,
        { message: `Minimum length is ${field.validation.minLength}` }
      );
    }
    if (field.validation.maxLength !== undefined) {
      schema = schema.refine(
        (val) => !val || val.toString().length <= field.validation!.maxLength!,
        { message: `Maximum length is ${field.validation.maxLength}` }
      );
    }
    if (field.validation.pattern) {
      schema = schema.refine(
        (val) => !val || new RegExp(field.validation!.pattern!).test(val.toString()),
        { message: field.validation.customMessage || 'Invalid format' }
      );
    }
  }
  
  return schema;
};

// =============================================================================
// RELATIONSHIP MAPPING AND FOREIGN KEYS
// =============================================================================

/**
 * Enhanced table relationships with React component integration
 */
export interface TableRelationship {
  // Core relationship metadata
  alias: string;
  name: string;
  label?: string;
  description?: string;
  type: RelationshipType;
  
  // Field mapping
  field: string;
  isVirtual: boolean;
  
  // Reference information
  refServiceId: number;
  refTable: string;
  refField: string;
  refOnUpdate?: ReferentialAction;
  refOnDelete?: ReferentialAction;
  
  // Junction table (for many-to-many)
  junctionServiceId?: number;
  junctionTable?: string;
  junctionField?: string;
  junctionRefField?: string;
  
  // Fetch behavior
  alwaysFetch: boolean;
  flatten: boolean;
  flattenDropPrefix: boolean;
  
  // Performance optimization
  lazyLoad?: boolean;
  prefetch?: boolean;
  batchSize?: number;
  
  // React component integration
  renderComponent?: ReactNode;
  componentProps?: Record<string, any>;
  
  // Native database metadata
  native?: any[];
}

/**
 * Relationship type enumeration
 */
export enum RelationshipType {
  BELONGS_TO = 'belongs_to',
  HAS_ONE = 'has_one',
  HAS_MANY = 'has_many',
  MANY_TO_MANY = 'many_many',
  POLYMORPHIC = 'polymorphic'
}

/**
 * Foreign key constraint with enhanced metadata
 */
export interface ForeignKey {
  name: string;
  field: string;
  referencedTable: string;
  referencedField: string;
  referencedServiceId?: number;
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
  deferrable?: boolean;
  initiallyDeferred?: boolean;
  
  // Validation and display
  displayFormat?: string;
  lookupQuery?: string;
  cascadeDelete?: boolean;
  
  // React component props
  renderAsLink?: boolean;
  linkComponent?: ReactNode;
}

/**
 * Referential action enumeration
 */
export enum ReferentialAction {
  NO_ACTION = 'NO ACTION',
  RESTRICT = 'RESTRICT',
  CASCADE = 'CASCADE',
  SET_NULL = 'SET NULL',
  SET_DEFAULT = 'SET DEFAULT'
}

// =============================================================================
// INDEXES AND CONSTRAINTS
// =============================================================================

/**
 * Table index definition with performance metadata
 */
export interface TableIndex {
  name: string;
  fields: string[];
  unique: boolean;
  type: IndexType;
  method?: IndexMethod;
  condition?: string;
  
  // Performance metrics
  selectivity?: number;
  cardinality?: number;
  size?: string;
  
  // Database-specific options
  fillFactor?: number;
  compression?: boolean;
  partial?: boolean;
  
  // Usage statistics
  scans?: number;
  seeks?: number;
  lookups?: number;
  lastUsed?: string;
}

/**
 * Index type enumeration
 */
export enum IndexType {
  BTREE = 'btree',
  HASH = 'hash',
  GIST = 'gist',
  GIN = 'gin',
  BRIN = 'brin',
  SPGIST = 'spgist',
  CLUSTERED = 'clustered',
  NONCLUSTERED = 'nonclustered',
  COLUMNSTORE = 'columnstore',
  SPATIAL = 'spatial',
  FULLTEXT = 'fulltext'
}

/**
 * Index method enumeration
 */
export enum IndexMethod {
  BTREE = 'btree',
  HASH = 'hash',
  GIST = 'gist',
  GIN = 'gin',
  BRIN = 'brin',
  SPGIST = 'spgist'
}

/**
 * Table constraint definition
 */
export interface TableConstraint {
  name: string;
  type: ConstraintType;
  definition: string;
  fields: string[];
  
  // Constraint-specific options
  checkExpression?: string;
  deferrable?: boolean;
  initiallyDeferred?: boolean;
  
  // Validation metadata
  validated?: boolean;
  enabled?: boolean;
  trusted?: boolean;
}

/**
 * Constraint type enumeration
 */
export enum ConstraintType {
  PRIMARY_KEY = 'PRIMARY KEY',
  FOREIGN_KEY = 'FOREIGN KEY',
  UNIQUE = 'UNIQUE',
  CHECK = 'CHECK',
  NOT_NULL = 'NOT NULL',
  DEFAULT = 'DEFAULT',
  EXCLUSION = 'EXCLUSION'
}

// =============================================================================
// FIELD VALIDATION AND FORMATTING
// =============================================================================

/**
 * Enhanced field validation with Zod integration
 */
export interface FieldValidation {
  // Basic validation rules
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  
  // Advanced validation
  enum?: string[];
  format?: ValidationFormat;
  customValidator?: string;
  customMessage?: string;
  
  // Async validation
  asyncValidator?: string;
  asyncValidatorEndpoint?: string;
  debounceMs?: number;
  
  // Conditional validation
  dependsOn?: string[];
  conditionalRules?: ConditionalValidationRule[];
  
  // Zod schema reference
  zodSchema?: z.ZodSchema<any>;
  zodTransform?: (value: any) => any;
}

/**
 * Validation format enumeration
 */
export enum ValidationFormat {
  EMAIL = 'email',
  URL = 'url',
  URI = 'uri',
  UUID = 'uuid',
  DATE = 'date',
  DATETIME = 'date-time',
  TIME = 'time',
  IPV4 = 'ipv4',
  IPV6 = 'ipv6',
  HOSTNAME = 'hostname',
  REGEX = 'regex',
  BASE64 = 'base64',
  JSON = 'json',
  XML = 'xml'
}

/**
 * Conditional validation rule
 */
export interface ConditionalValidationRule {
  field: string;
  operator: ComparisonOperator;
  value: any;
  validation: Partial<FieldValidation>;
}

/**
 * Comparison operator enumeration
 */
export enum ComparisonOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  GREATER_THAN_OR_EQUAL = 'greaterThanOrEqual',
  LESS_THAN_OR_EQUAL = 'lessThanOrEqual',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  IN = 'in',
  NOT_IN = 'notIn',
  IS_NULL = 'isNull',
  IS_NOT_NULL = 'isNotNull',
  IS_EMPTY = 'isEmpty',
  IS_NOT_EMPTY = 'isNotEmpty'
}

/**
 * Field constraint definition
 */
export interface FieldConstraint {
  type: ConstraintType;
  definition: string;
  name?: string;
  message?: string;
  enabled?: boolean;
}

/**
 * Field formatting configuration
 */
export interface FieldFormat {
  // Display formatting
  mask?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  
  // Text transformation
  transform?: TextTransform;
  
  // Number formatting
  currency?: CurrencyConfig;
  number?: NumberConfig;
  
  // Date formatting
  date?: DateConfig;
  
  // Boolean formatting
  boolean?: BooleanConfig;
  
  // Custom formatting
  customFormatter?: string;
  customParser?: string;
}

/**
 * Text transformation enumeration
 */
export enum TextTransform {
  UPPERCASE = 'uppercase',
  LOWERCASE = 'lowercase',
  CAPITALIZE = 'capitalize',
  CAMEL_CASE = 'camelCase',
  PASCAL_CASE = 'pascalCase',
  KEBAB_CASE = 'kebabCase',
  SNAKE_CASE = 'snakeCase',
  TITLE_CASE = 'titleCase'
}

/**
 * Currency formatting configuration
 */
export interface CurrencyConfig {
  currency: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  currencyDisplay?: 'symbol' | 'code' | 'name';
  currencySign?: 'standard' | 'accounting';
}

/**
 * Number formatting configuration
 */
export interface NumberConfig {
  locale?: string;
  minimumIntegerDigits?: number;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  minimumSignificantDigits?: number;
  maximumSignificantDigits?: number;
  useGrouping?: boolean;
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
  compactDisplay?: 'short' | 'long';
  signDisplay?: 'auto' | 'never' | 'always' | 'exceptZero';
}

/**
 * Date formatting configuration
 */
export interface DateConfig {
  format: string;
  locale?: string;
  timezone?: string;
  
  // Constraints
  minDate?: string;
  maxDate?: string;
  excludeDates?: string[];
  includeDates?: string[];
  
  // Display options
  showTime?: boolean;
  showTimezone?: boolean;
  relative?: boolean;
  
  // Input constraints
  allowPast?: boolean;
  allowFuture?: boolean;
  businessDaysOnly?: boolean;
}

/**
 * Boolean formatting configuration
 */
export interface BooleanConfig {
  trueLabel?: string;
  falseLabel?: string;
  nullLabel?: string;
  style?: 'checkbox' | 'switch' | 'radio' | 'button' | 'text';
  variant?: 'default' | 'success' | 'warning' | 'error';
}

// =============================================================================
// DATABASE OBJECTS (VIEWS, PROCEDURES, FUNCTIONS)
// =============================================================================

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
  checkOption?: CheckOption;
  
  // View metadata
  schemaName?: string;
  catalogName?: string;
  definer?: string;
  sqlSecurity?: SqlSecurity;
  
  // React component state
  expanded?: boolean;
  selected?: boolean;
  loading?: boolean;
  
  // Performance metadata
  rowCount?: number;
  queryComplexity?: number;
}

/**
 * Check option enumeration for views
 */
export enum CheckOption {
  NONE = 'NONE',
  LOCAL = 'LOCAL',
  CASCADED = 'CASCADED'
}

/**
 * SQL security enumeration
 */
export enum SqlSecurity {
  DEFINER = 'DEFINER',
  INVOKER = 'INVOKER'
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
  language?: ProgrammingLanguage;
  
  // Procedure metadata
  schemaName?: string;
  definer?: string;
  sqlSecurity?: SqlSecurity;
  isDeterministic?: boolean;
  sqlDataAccess?: SqlDataAccess;
  
  // React component state
  expanded?: boolean;
  selected?: boolean;
}

/**
 * Procedure parameter definition
 */
export interface ProcedureParameter {
  name: string;
  type: string;
  mode: ParameterMode;
  defaultValue?: any;
  isNullable?: boolean;
  maxLength?: number;
  precision?: number;
  scale?: number;
}

/**
 * Parameter mode enumeration
 */
export enum ParameterMode {
  IN = 'IN',
  OUT = 'OUT',
  INOUT = 'INOUT'
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
  language?: ProgrammingLanguage;
  
  // Function metadata
  schemaName?: string;
  definer?: string;
  isDeterministic?: boolean;
  isAggregate?: boolean;
  sqlDataAccess?: SqlDataAccess;
  
  // React component state
  expanded?: boolean;
  selected?: boolean;
}

/**
 * Function parameter definition
 */
export interface FunctionParameter {
  name: string;
  type: string;
  defaultValue?: any;
  isNullable?: boolean;
  maxLength?: number;
  precision?: number;
  scale?: number;
}

/**
 * Programming language enumeration
 */
export enum ProgrammingLanguage {
  SQL = 'SQL',
  PLSQL = 'PLSQL',
  PLPGSQL = 'PLPGSQL',
  JAVASCRIPT = 'JAVASCRIPT',
  PYTHON = 'PYTHON',
  JAVA = 'JAVA',
  C = 'C'
}

/**
 * SQL data access enumeration
 */
export enum SqlDataAccess {
  NO_SQL = 'NO SQL',
  CONTAINS_SQL = 'CONTAINS SQL',
  READS_SQL_DATA = 'READS SQL DATA',
  MODIFIES_SQL_DATA = 'MODIFIES SQL DATA'
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
  currentValue?: number;
  cache?: number;
  cycle?: boolean;
  
  // Sequence metadata
  schemaName?: string;
  ownedBy?: string;
  dataType?: string;
}

/**
 * Database trigger definition
 */
export interface Trigger {
  name: string;
  label?: string;
  description?: string;
  timing: TriggerTiming;
  events: TriggerEvent[];
  definition: string;
  
  // Trigger metadata
  tableName: string;
  schemaName?: string;
  orientation?: TriggerOrientation;
  condition?: string;
  enabled?: boolean;
}

/**
 * Trigger timing enumeration
 */
export enum TriggerTiming {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
  INSTEAD_OF = 'INSTEAD OF'
}

/**
 * Trigger event enumeration
 */
export enum TriggerEvent {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  TRUNCATE = 'TRUNCATE'
}

/**
 * Trigger orientation enumeration
 */
export enum TriggerOrientation {
  ROW = 'ROW',
  STATEMENT = 'STATEMENT'
}

// =============================================================================
// DATABASE FUNCTION USAGE
// =============================================================================

/**
 * Database function usage definition
 */
export interface DatabaseFunctionUse {
  use: string[];
  function: string;
  parameters?: Record<string, any>;
  returnType?: string;
  description?: string;
}

// =============================================================================
// REACT QUERY INTEGRATION TYPES
// =============================================================================

/**
 * Schema discovery query configuration
 * Optimized for React Query caching and synchronization
 */
export interface SchemaQueryConfig {
  // Query identification
  serviceName: string;
  database?: string;
  schema?: string;
  table?: string;
  
  // Caching configuration
  staleTime: number;
  cacheTime: number;
  refetchInterval?: number;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  
  // Performance optimization
  enabled: boolean;
  keepPreviousData: boolean;
  suspense?: boolean;
  useErrorBoundary?: boolean;
  
  // Progressive loading
  pageSize?: number;
  infiniteQuery?: boolean;
  virtualScrolling?: boolean;
  
  // Retry configuration
  retry?: number | boolean;
  retryDelay?: number;
  retryOnMount?: boolean;
}

/**
 * Schema discovery query result with React Query integration
 */
export interface SchemaQueryResult<T = SchemaDiscoveryData> extends UseQueryResult<T> {
  // Additional schema-specific properties
  totalTables?: number;
  loadedTables?: number;
  progress?: number;
  
  // Virtual scrolling state
  virtualItems?: VirtualItem[];
  scrollElement?: HTMLElement | null;
  
  // Progressive loading actions
  loadMore?: () => void;
  loadPrevious?: () => void;
  hasMore?: boolean;
  hasPrevious?: boolean;
}

/**
 * Schema cache management configuration
 */
export interface SchemaCacheConfig {
  // Cache keys
  baseKey: string;
  serviceKey: string;
  tableKey?: string;
  
  // Cache invalidation
  invalidateOnUpdate: boolean;
  invalidateOnDelete: boolean;
  invalidateRelated: boolean;
  
  // Background updates
  backgroundRefetch: boolean;
  backgroundRefetchInterval?: number;
  
  // Optimistic updates
  optimisticUpdates: boolean;
  rollbackOnError: boolean;
  
  // Cache size management
  maxCacheSize?: number;
  evictionPolicy?: 'lru' | 'lfu' | 'ttl';
}

// =============================================================================
// LEGACY COMPATIBILITY TYPES
// =============================================================================

/**
 * Legacy Angular types for backward compatibility
 * @deprecated Use new React Query types instead
 */
export type DatabaseRowData = {
  id: number;
  description: string;
  label: string;
  name: string;
  type: string;
};

/**
 * @deprecated Use SchemaTable instead
 */
export type DatabaseTableRowData = {
  name: string;
  label: string;
  id: string;
};

/**
 * @deprecated Use TableRelationship instead
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

// =============================================================================
// UTILITY TYPES AND HELPERS
// =============================================================================

/**
 * Utility type for creating schema query keys
 */
export type SchemaQueryKey = readonly [
  'schema',
  {
    service: string;
    database?: string;
    schema?: string;
    table?: string;
    type?: 'tables' | 'views' | 'procedures' | 'functions';
  }
];

/**
 * Schema discovery status enumeration
 */
export enum SchemaDiscoveryStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
  REFRESHING = 'refreshing'
}

/**
 * Schema tree filter configuration
 */
export interface SchemaTreeFilter {
  searchTerm?: string;
  objectTypes?: ('table' | 'view' | 'procedure' | 'function')[];
  hasData?: boolean;
  hasRelationships?: boolean;
  isAPIEnabled?: boolean;
  customFilter?: (node: SchemaTreeNode) => boolean;
}

/**
 * Schema export configuration
 */
export interface SchemaExportConfig {
  format: 'json' | 'sql' | 'csv' | 'xlsx';
  includeData?: boolean;
  includeSchema?: boolean;
  includeRelationships?: boolean;
  includeIndexes?: boolean;
  includeConstraints?: boolean;
  includeTriggers?: boolean;
  tables?: string[];
  compression?: boolean;
}

/**
 * Schema comparison result
 */
export interface SchemaComparison {
  source: SchemaDiscoveryData;
  target: SchemaDiscoveryData;
  differences: SchemaDifference[];
  summary: SchemaComparisonSummary;
}

/**
 * Schema difference definition
 */
export interface SchemaDifference {
  type: 'table' | 'field' | 'index' | 'constraint' | 'relationship';
  action: 'added' | 'removed' | 'modified';
  path: string[];
  source?: any;
  target?: any;
  description: string;
}

/**
 * Schema comparison summary
 */
export interface SchemaComparisonSummary {
  tablesAdded: number;
  tablesRemoved: number;
  tablesModified: number;
  fieldsAdded: number;
  fieldsRemoved: number;
  fieldsModified: number;
  constraintsAdded: number;
  constraintsRemoved: number;
  indexesAdded: number;
  indexesRemoved: number;
}

// =============================================================================
// EXPORT ALL TYPES
// =============================================================================

export * from './api';
export * from './database';

// Re-export commonly used types for convenience
export type {
  UseQueryResult,
  VirtualItem
} from '@tanstack/react-query';

export type { ReactNode } from 'react';
export { z } from 'zod';