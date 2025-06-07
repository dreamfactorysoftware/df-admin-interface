/**
 * Database schema and relationship types maintaining full compatibility 
 * while supporting React component patterns for schema management.
 * 
 * This module provides comprehensive type definitions for database schema
 * discovery, table relationships, and field metadata. All types maintain
 * backward compatibility with existing DreamFactory API endpoints while
 * enabling enhanced React component integration.
 */

// =============================================================================
// PRESERVED LEGACY TYPES - Maintaining API Compatibility
// =============================================================================

/**
 * Database row data representation from DreamFactory API.
 * Preserved for backward compatibility with existing service endpoints.
 * 
 * @usage React components for database service listing and management
 */
export type DatabaseRowData = {
  id: number;
  description: string;
  label: string;
  name: string;
  type: string;
};

/**
 * Database table row data for table listing interfaces.
 * Maintained for compatibility with existing table management APIs.
 * 
 * @usage React components for table browsing and selection
 */
export type DatabaseTableRowData = {
  name: string;
  label: string;
  id: string;
};

/**
 * Table relationship configuration for database relationships.
 * Preserved complete interface for relationship management compatibility.
 * 
 * @usage React components for relationship configuration and visualization
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
// ENHANCED SCHEMA TYPES - React Component Integration
// =============================================================================

/**
 * Comprehensive schema data structure for React schema discovery components.
 * Supports hierarchical tree visualization and metadata introspection.
 */
export interface SchemaData {
  serviceName: string;
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
}

/**
 * Enhanced table metadata supporting React component state management.
 * Includes UI state properties for React tree components and selection.
 */
export interface SchemaTable {
  name: string;
  label?: string;
  description?: string;
  schema?: string;
  fields: SchemaField[];
  primaryKey?: string[];
  foreignKeys: ForeignKey[];
  indexes: TableIndex[];
  constraints: TableConstraint[];
  triggers?: Trigger[];
  
  // Metadata for React component optimization
  rowCount?: number;
  estimatedSize?: string;
  lastModified?: string;
  collation?: string;
  engine?: string;
  
  // React component UI state
  expanded?: boolean;
  selected?: boolean;
  apiEnabled?: boolean;
}

/**
 * Field metadata with React form integration patterns.
 * Supports React Hook Form validation and component rendering.
 */
export interface SchemaField {
  name: string;
  type: FieldType;
  dbType: string;
  length?: number;
  precision?: number;
  scale?: number;
  defaultValue?: any;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  isAutoIncrement?: boolean;
  isComputed?: boolean;
  
  // React Hook Form validation support
  validation?: FieldValidation;
  constraints?: FieldConstraint[];
  
  // React component rendering metadata
  label?: string;
  description?: string;
  format?: FieldFormat;
  hidden?: boolean;
}

/**
 * Field type enumeration supporting React component field rendering.
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
  | 'set';

/**
 * Field validation configuration for React Hook Form integration.
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
}

/**
 * Database constraint representation supporting React constraint management.
 */
export interface FieldConstraint {
  type: ConstraintType;
  definition: string;
  name?: string;
  message?: string;
}

/**
 * Constraint type enumeration for database integrity management.
 */
export type ConstraintType = 
  | 'check'
  | 'unique'
  | 'foreign_key'
  | 'primary_key'
  | 'default'
  | 'not_null';

/**
 * Field formatting configuration for React component display.
 */
export interface FieldFormat {
  mask?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  uppercase?: boolean;
  lowercase?: boolean;
  capitalize?: boolean;
}

/**
 * Foreign key relationship configuration supporting React relationship components.
 */
export interface ForeignKey {
  name: string;
  field: string;
  referencedTable: string;
  referencedField: string;
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
  deferrable?: boolean;
}

/**
 * Referential action enumeration for foreign key behavior.
 */
export type ReferentialAction = 
  | 'NO ACTION'
  | 'RESTRICT'
  | 'CASCADE'
  | 'SET NULL'
  | 'SET DEFAULT';

/**
 * Table index configuration supporting React index management components.
 */
export interface TableIndex {
  name: string;
  fields: string[];
  unique: boolean;
  type?: IndexType;
  method?: string;
  condition?: string;
}

/**
 * Index type enumeration for database performance optimization.
 */
export type IndexType = 
  | 'btree'
  | 'hash'
  | 'gist'
  | 'gin'
  | 'brin'
  | 'spgist';

/**
 * Table constraint configuration for React constraint management.
 */
export interface TableConstraint {
  name: string;
  type: ConstraintType;
  definition: string;
  fields: string[];
}

/**
 * Database view metadata supporting React view browsing components.
 */
export interface SchemaView {
  name: string;
  definition: string;
  fields: SchemaField[];
  updatable: boolean;
  checkOption?: string;
}

/**
 * Stored procedure metadata for React procedure management components.
 */
export interface StoredProcedure {
  name: string;
  parameters: ProcedureParameter[];
  returnType?: string;
  definition: string;
  language?: string;
}

/**
 * Procedure parameter configuration supporting React parameter editors.
 */
export interface ProcedureParameter {
  name: string;
  type: string;
  mode: 'IN' | 'OUT' | 'INOUT';
  defaultValue?: string;
}

/**
 * Database function metadata for React function management components.
 */
export interface DatabaseFunction {
  name: string;
  parameters: FunctionParameter[];
  returnType: string;
  definition: string;
  language?: string;
  immutable?: boolean;
}

/**
 * Function parameter configuration supporting React parameter management.
 */
export interface FunctionParameter {
  name: string;
  type: string;
  defaultValue?: string;
}

/**
 * Database sequence configuration for React sequence management.
 */
export interface Sequence {
  name: string;
  increment: number;
  minValue?: number;
  maxValue?: number;
  startValue: number;
  cache?: number;
  cycle?: boolean;
}

/**
 * Database trigger configuration supporting React trigger management.
 */
export interface Trigger {
  name: string;
  timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF';
  events: TriggerEvent[];
  definition: string;
}

/**
 * Trigger event enumeration for trigger configuration.
 */
export type TriggerEvent = 'INSERT' | 'UPDATE' | 'DELETE';

// =============================================================================
// REACT COMPONENT INTEGRATION TYPES
// =============================================================================

/**
 * React component props for schema tree visualization.
 * Supports hierarchical display with performance optimization for large schemas.
 */
export interface SchemaTreeProps {
  schema: SchemaData;
  expanded?: boolean;
  selectedTables?: string[];
  onTableSelect?: (tables: string[]) => void;
  onTableExpand?: (tableName: string, expanded: boolean) => void;
  virtualScrolling?: boolean;
  searchTerm?: string;
  filterType?: 'all' | 'tables' | 'views' | 'procedures';
}

/**
 * React component props for table field management.
 * Integrates with React Hook Form for field editing workflows.
 */
export interface TableFieldsProps {
  table: SchemaTable;
  editable?: boolean;
  onFieldUpdate?: (fieldName: string, updates: Partial<SchemaField>) => void;
  onFieldAdd?: (field: Omit<SchemaField, 'name'>) => void;
  onFieldRemove?: (fieldName: string) => void;
  validationSchema?: any; // Zod schema for validation
}

/**
 * React component props for relationship visualization.
 * Supports interactive relationship diagrams and configuration.
 */
export interface RelationshipDiagramProps {
  tables: SchemaTable[];
  relationships: TableRelatedType[];
  interactive?: boolean;
  onRelationshipEdit?: (relationship: TableRelatedType) => void;
  onRelationshipAdd?: (relationship: Omit<TableRelatedType, 'alias'>) => void;
  layout?: 'hierarchical' | 'circular' | 'force';
}

/**
 * Schema discovery result for React Query/SWR caching patterns.
 * Optimized for intelligent caching and background synchronization.
 */
export interface SchemaDiscoveryResult {
  schema: SchemaData;
  discoveryDuration: number;
  lastSync: string;
  cacheKey: string;
  staleTime?: number;
  revalidateOnFocus?: boolean;
}

/**
 * Schema discovery options for React Query integration.
 * Supports progressive loading and performance optimization.
 */
export interface SchemaDiscoveryOptions {
  includeViews?: boolean;
  includeProcedures?: boolean;
  includeFunctions?: boolean;
  includeIndexes?: boolean;
  includeConstraints?: boolean;
  maxTables?: number;
  progressiveLoading?: boolean;
  cacheStrategy?: 'aggressive' | 'conservative' | 'minimal';
}

/**
 * Schema validation result for React form integration.
 * Supports real-time validation feedback in React components.
 */
export interface SchemaValidationResult {
  isValid: boolean;
  errors: SchemaValidationError[];
  warnings: SchemaValidationWarning[];
  suggestions: SchemaValidationSuggestion[];
}

/**
 * Schema validation error for React error boundary integration.
 */
export interface SchemaValidationError {
  type: 'field' | 'table' | 'relationship' | 'constraint';
  target: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code?: string;
}

/**
 * Schema validation warning for React component notifications.
 */
export interface SchemaValidationWarning {
  type: 'performance' | 'compatibility' | 'best-practice';
  target: string;
  message: string;
  suggestion?: string;
}

/**
 * Schema validation suggestion for React optimization recommendations.
 */
export interface SchemaValidationSuggestion {
  type: 'index' | 'relationship' | 'constraint' | 'optimization';
  target: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'moderate' | 'complex';
}