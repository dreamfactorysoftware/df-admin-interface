/**
 * Table Details Component Types for React/Next.js Implementation
 * 
 * Provides comprehensive type definitions for table details management:
 * - React Hook Form with Zod schema validation for all user inputs
 * - React Query mutations and queries for optimistic updates
 * - TanStack Table column definitions for virtual scrolling
 * - Monaco editor integration for JSON editing modes
 * - Type-safe configuration workflows per Section 5.2 Component Details
 * - Intelligent caching strategies with React Query integration
 * 
 * Migrated from Angular FormGroup patterns to React Hook Form compatibility
 * with enhanced performance and validation capabilities.
 */

import { z } from 'zod';
import type { ReactNode } from 'react';
import type { 
  UseQueryResult, 
  UseMutationResult,
  QueryKey 
} from '@tanstack/react-query';
import type { 
  ColumnDef, 
  Table,
  Row,
  Cell,
  Header,
  AccessorFn
} from '@tanstack/react-table';
import type { 
  UseFormReturn, 
  FieldValues, 
  Control,
  FormState,
  FieldError,
  FieldPath
} from 'react-hook-form';
import type { editor } from 'monaco-editor';
import type { 
  SchemaField,
  SchemaTable,
  TableRelationship,
  FieldType,
  FieldValidation,
  TableIndex,
  TableConstraint
} from '@/types/schema';
import type { 
  DatabaseService,
  ConnectionConfig 
} from '@/types/database';
import type { 
  ApiResponse,
  ApiError,
  LoadingState,
  CacheConfig
} from '@/types/api';

// =============================================================================
// CORE TABLE DETAILS INTERFACES
// =============================================================================

/**
 * Enhanced table details interface with React patterns
 * Extends SchemaTable with form management and component state
 */
export interface TableDetails extends Omit<SchemaTable, 'fields' | 'foreignKeys'> {
  // Core table metadata (from SchemaTable)
  name: string;
  label: string;
  description: string;
  schema?: string;
  alias?: string;
  plural: string;
  isView: boolean;
  
  // Enhanced field definitions
  fields: TableField[];
  related: TableRelated[];
  
  // Table structure and constraints  
  primaryKey: string[];
  nameField?: string;
  constraints: TableConstraint[];
  indexes?: TableIndex[];
  
  // API generation configuration
  access: number;
  apiEnabled?: boolean;
  endpointGenerated?: boolean;
  
  // React component state management
  loading?: boolean;
  error?: string | null;
  isDirty?: boolean;
  isValid?: boolean;
  
  // Form state integration
  formData?: TableDetailsFormData;
  originalData?: TableDetails;
  
  // Native database metadata
  native: any[];
  
  // Performance metadata
  rowCount?: number;
  estimatedSize?: string;
  lastModified?: string;
  
  // React Query integration
  queryKey: QueryKey;
  lastFetched?: string;
  isCached?: boolean;
  staleTime?: number;
}

/**
 * Enhanced table field interface with React Hook Form integration
 * Extends SchemaField with form validation and component props
 */
export interface TableField extends Omit<SchemaField, 'zodSchema' | 'reactHookFormValidation'> {
  // Core field metadata (from SchemaField)
  name: string;
  label: string;
  description?: string;
  alias?: string;
  type: FieldType;
  dbType: string;
  
  // Field constraints and metadata
  length?: number;
  precision?: number;
  scale?: number;
  default?: any;
  
  // Boolean field properties
  required: boolean;
  allowNull: boolean;
  fixedLength: boolean;
  supportsMultibyte: boolean;
  autoIncrement: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  isIndex: boolean;
  isForeignKey: boolean;
  isVirtual: boolean;
  isAggregate: boolean;
  
  // Foreign key relationships
  refTable?: string;
  refField?: string;
  refOnUpdate?: string;
  refOnDelete?: string;
  refServiceId?: number;
  
  // Enhanced validation with React Hook Form
  validation?: FieldValidation;
  zodSchema?: z.ZodSchema<any>;
  reactHookFormRules?: ReactHookFormRules;
  
  // Picklist and constraints
  picklist?: string[];
  constraints?: string;
  
  // Database functions
  dbFunction?: string | DatabaseFunctionUse[];
  
  // Native database metadata
  native: any[];
  
  // Form component integration
  componentType?: FieldComponentType;
  componentProps?: Record<string, any>;
  renderComponent?: ReactNode;
  
  // Monaco editor configuration
  monacoConfig?: MonacoEditorConfig;
  
  // TanStack Table column configuration
  columnConfig?: FieldColumnConfig;
}

/**
 * Enhanced table relationship interface with React patterns
 * Extends TableRelationship with form management and caching
 */
export interface TableRelated extends Omit<TableRelationship, 'refServiceId' | 'junctionServiceId'> {
  // Core relationship metadata
  alias?: string;
  name: string;
  label: string;
  description?: string;
  type: RelationshipType;
  field: string;
  isVirtual: boolean;
  
  // Reference configuration
  refServiceID: number; // Legacy naming for compatibility
  refTable: string;
  refField: string;
  refOnUpdate: string;
  refOnDelete: string;
  
  // Junction table (many-to-many)
  junctionServiceID?: number; // Legacy naming for compatibility
  junctionTable?: string;
  junctionField?: string;
  junctionRefField?: string;
  
  // Fetch behavior
  alwaysFetch: boolean;
  flatten: boolean;
  flattenDropPrefix: boolean;
  
  // Native database metadata
  native: any[];
  
  // React component integration
  loading?: boolean;
  error?: string | null;
  componentProps?: Record<string, any>;
  
  // Form management
  isEditing?: boolean;
  isDirty?: boolean;
  isValid?: boolean;
  
  // Performance optimization
  lazyLoad?: boolean;
  prefetch?: boolean;
  batchSize?: number;
}

/**
 * Relationship type enumeration
 */
export enum RelationshipType {
  BELONGS_TO = 'belongs_to',
  HAS_ONE = 'has_one', 
  HAS_MANY = 'has_many',
  MANY_TO_MANY = 'many_many'
}

/**
 * Database function usage for fields
 */
export interface DatabaseFunctionUse {
  use: string[];
  function: string;
  parameters?: Record<string, any>;
  returnType?: string;
  description?: string;
}

// =============================================================================
// REACT HOOK FORM INTEGRATION TYPES
// =============================================================================

/**
 * Table details form data structure for React Hook Form
 * Provides complete type safety for form validation and submission
 */
export interface TableDetailsFormData {
  // Basic table information
  name: string;
  label: string;
  description: string;
  alias?: string;
  plural: string;
  
  // Table configuration
  access: number;
  nameField?: string;
  apiEnabled: boolean;
  
  // Field management
  fields: TableFieldFormData[];
  fieldsToAdd: TableFieldFormData[];
  fieldsToUpdate: TableFieldFormData[];
  fieldsToDelete: string[];
  
  // Relationship management
  related: TableRelatedFormData[];
  relatedToAdd: TableRelatedFormData[];
  relatedToUpdate: TableRelatedFormData[];
  relatedToDelete: string[];
  
  // Index and constraint management
  indexes?: TableIndexFormData[];
  constraints?: TableConstraintFormData[];
  
  // Metadata
  lastModified?: string;
  version?: number;
}

/**
 * Field form data with validation rules
 */
export interface TableFieldFormData {
  // Field identification
  name: string;
  label: string;
  description?: string;
  alias?: string;
  
  // Field type and configuration
  type: FieldType;
  dbType: string;
  length?: number;
  precision?: number;
  scale?: number;
  default?: any;
  
  // Field properties
  required: boolean;
  allowNull: boolean;
  fixedLength: boolean;
  supportsMultibyte: boolean;
  autoIncrement: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  isIndex: boolean;
  isForeignKey: boolean;
  isVirtual: boolean;
  isAggregate: boolean;
  
  // Foreign key configuration
  refTable?: string;
  refField?: string;
  refOnUpdate?: string;
  refOnDelete?: string;
  refServiceId?: number;
  
  // Validation and constraints
  validation?: FieldValidationFormData;
  picklist?: string[];
  constraints?: string;
  
  // Database functions
  dbFunction?: string;
  
  // Form state
  isNew?: boolean;
  isModified?: boolean;
  hasErrors?: boolean;
  errors?: Record<string, string>;
}

/**
 * Relationship form data structure
 */
export interface TableRelatedFormData {
  // Relationship identification
  alias?: string;
  name: string;
  label: string;
  description?: string;
  
  // Relationship configuration
  type: RelationshipType;
  field: string;
  isVirtual: boolean;
  
  // Reference configuration
  refServiceID: number;
  refTable: string;
  refField: string;
  refOnUpdate: string;
  refOnDelete: string;
  
  // Junction table configuration
  junctionServiceID?: number;
  junctionTable?: string;
  junctionField?: string;
  junctionRefField?: string;
  
  // Fetch behavior
  alwaysFetch: boolean;
  flatten: boolean;
  flattenDropPrefix: boolean;
  
  // Form state
  isNew?: boolean;
  isModified?: boolean;
  hasErrors?: boolean;
  errors?: Record<string, string>;
}

/**
 * Field validation form data
 */
export interface FieldValidationFormData {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  customMessage?: string;
  customValidator?: string;
  enum?: string[];
}

/**
 * Index form data structure
 */
export interface TableIndexFormData {
  name: string;
  fields: string[];
  unique: boolean;
  type: string;
  method?: string;
  condition?: string;
  isNew?: boolean;
  isModified?: boolean;
}

/**
 * Constraint form data structure
 */
export interface TableConstraintFormData {
  name: string;
  type: string;
  definition: string;
  fields: string[];
  checkExpression?: string;
  isNew?: boolean;
  isModified?: boolean;
}

/**
 * React Hook Form validation rules
 */
export interface ReactHookFormRules {
  required?: boolean | string;
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  validate?: Record<string, (value: any) => boolean | string>;
  deps?: string[];
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Comprehensive Zod schema for table details form validation
 * Ensures real-time validation under 100ms per React/Next.js Integration Requirements
 */
export const TableDetailsFormSchema = z.object({
  // Basic table information
  name: z.string()
    .min(1, 'Table name is required')
    .max(64, 'Table name must not exceed 64 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Table name must start with a letter and contain only letters, numbers, and underscores'),
  
  label: z.string()
    .min(1, 'Table label is required')
    .max(128, 'Table label must not exceed 128 characters'),
  
  description: z.string()
    .max(512, 'Description must not exceed 512 characters')
    .optional(),
  
  alias: z.string()
    .max(64, 'Alias must not exceed 64 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Alias must start with a letter and contain only letters, numbers, and underscores')
    .optional(),
  
  plural: z.string()
    .min(1, 'Plural form is required')
    .max(128, 'Plural form must not exceed 128 characters'),
  
  // Table configuration
  access: z.number()
    .int()
    .min(0, 'Access level must be non-negative')
    .max(7, 'Access level must not exceed 7'),
  
  nameField: z.string()
    .max(64, 'Name field must not exceed 64 characters')
    .optional(),
  
  apiEnabled: z.boolean(),
  
  // Field arrays with validation
  fields: z.array(TableFieldFormSchema),
  fieldsToAdd: z.array(TableFieldFormSchema).default([]),
  fieldsToUpdate: z.array(TableFieldFormSchema).default([]),
  fieldsToDelete: z.array(z.string()).default([]),
  
  // Relationship arrays with validation
  related: z.array(TableRelatedFormSchema),
  relatedToAdd: z.array(TableRelatedFormSchema).default([]),
  relatedToUpdate: z.array(TableRelatedFormSchema).default([]),
  relatedToDelete: z.array(z.string()).default([]),
  
  // Optional metadata
  lastModified: z.string().optional(),
  version: z.number().int().positive().optional()
});

/**
 * Zod schema for table field validation
 */
export const TableFieldFormSchema = z.object({
  name: z.string()
    .min(1, 'Field name is required')
    .max(64, 'Field name must not exceed 64 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with a letter and contain only letters, numbers, and underscores'),
  
  label: z.string()
    .min(1, 'Field label is required')
    .max(128, 'Field label must not exceed 128 characters'),
  
  description: z.string()
    .max(512, 'Description must not exceed 512 characters')
    .optional(),
  
  alias: z.string()
    .max(64, 'Alias must not exceed 64 characters')
    .optional(),
  
  type: z.nativeEnum(FieldType),
  dbType: z.string().min(1, 'Database type is required'),
  
  length: z.number().int().positive().optional(),
  precision: z.number().int().positive().optional(),
  scale: z.number().int().non-negative().optional(),
  default: z.any().optional(),
  
  // Boolean properties
  required: z.boolean(),
  allowNull: z.boolean(),
  fixedLength: z.boolean(),
  supportsMultibyte: z.boolean(),
  autoIncrement: z.boolean(),
  isPrimaryKey: z.boolean(),
  isUnique: z.boolean(),
  isIndex: z.boolean(),
  isForeignKey: z.boolean(),
  isVirtual: z.boolean(),
  isAggregate: z.boolean(),
  
  // Foreign key properties
  refTable: z.string().optional(),
  refField: z.string().optional(),
  refOnUpdate: z.string().optional(),
  refOnDelete: z.string().optional(),
  refServiceId: z.number().int().positive().optional(),
  
  // Validation and constraints
  validation: z.object({
    required: z.boolean().optional(),
    minLength: z.number().int().non-negative().optional(),
    maxLength: z.number().int().positive().optional(),
    pattern: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    customMessage: z.string().optional(),
    customValidator: z.string().optional(),
    enum: z.array(z.string()).optional()
  }).optional(),
  
  picklist: z.array(z.string()).optional(),
  constraints: z.string().optional(),
  dbFunction: z.string().optional(),
  
  // Form state
  isNew: z.boolean().optional(),
  isModified: z.boolean().optional(),
  hasErrors: z.boolean().optional(),
  errors: z.record(z.string()).optional()
});

/**
 * Zod schema for table relationship validation
 */
export const TableRelatedFormSchema = z.object({
  alias: z.string()
    .max(64, 'Alias must not exceed 64 characters')
    .optional(),
  
  name: z.string()
    .min(1, 'Relationship name is required')
    .max(64, 'Relationship name must not exceed 64 characters'),
  
  label: z.string()
    .min(1, 'Relationship label is required')
    .max(128, 'Relationship label must not exceed 128 characters'),
  
  description: z.string()
    .max(512, 'Description must not exceed 512 characters')
    .optional(),
  
  type: z.nativeEnum(RelationshipType),
  field: z.string().min(1, 'Field name is required'),
  isVirtual: z.boolean(),
  
  refServiceID: z.number().int().positive(),
  refTable: z.string().min(1, 'Referenced table is required'),
  refField: z.string().min(1, 'Referenced field is required'),
  refOnUpdate: z.string(),
  refOnDelete: z.string(),
  
  junctionServiceID: z.number().int().positive().optional(),
  junctionTable: z.string().optional(),
  junctionField: z.string().optional(),
  junctionRefField: z.string().optional(),
  
  alwaysFetch: z.boolean(),
  flatten: z.boolean(),
  flattenDropPrefix: z.boolean(),
  
  // Form state
  isNew: z.boolean().optional(),
  isModified: z.boolean().optional(),
  hasErrors: z.boolean().optional(),
  errors: z.record(z.string()).optional()
});

/**
 * Inferred TypeScript types from Zod schemas
 */
export type TableDetailsFormValues = z.infer<typeof TableDetailsFormSchema>;
export type TableFieldFormValues = z.infer<typeof TableFieldFormSchema>;
export type TableRelatedFormValues = z.infer<typeof TableRelatedFormSchema>;

// =============================================================================
// REACT QUERY INTEGRATION TYPES
// =============================================================================

/**
 * Table details query configuration for React Query optimization
 * Supports intelligent caching strategies per React/Next.js Integration Requirements
 */
export interface TableDetailsQueryConfig {
  // Query identification
  serviceName: string;
  tableName: string;
  schemaName?: string;
  
  // Caching configuration (staleTime: 300 seconds, cacheTime: 900 seconds)
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
  
  // Advanced features
  optimisticUpdates: boolean;
  backgroundRefetch: boolean;
  prefetchRelated: boolean;
  
  // Retry configuration
  retry?: number | boolean;
  retryDelay?: number;
}

/**
 * Table details query result with React Query integration
 */
export interface TableDetailsQueryResult extends UseQueryResult<TableDetails> {
  // Additional table-specific properties
  totalFields?: number;
  totalRelationships?: number;
  hasChanges?: boolean;
  
  // Query actions
  invalidate: () => void;
  refresh: () => void;
  reset: () => void;
  
  // Optimistic update state
  optimisticData?: TableDetails;
  isOptimistic?: boolean;
}

/**
 * Table details mutation configuration
 */
export interface TableDetailsMutationConfig {
  // Optimistic updates
  enableOptimisticUpdates: boolean;
  rollbackOnError: boolean;
  
  // Cache management
  invalidateRelated: boolean;
  updateCacheOnSuccess: boolean;
  
  // Error handling
  retryOnFailure: boolean;
  maxRetries: number;
  
  // Performance
  debounceMs?: number;
  batchUpdates?: boolean;
}

/**
 * Table details mutation result
 */
export interface TableDetailsMutationResult extends UseMutationResult<
  TableDetails,
  ApiError,
  TableDetailsFormValues
> {
  // Additional mutation-specific properties
  isPending?: boolean;
  isOptimistic?: boolean;
  
  // Mutation actions
  submitWithValidation: (data: TableDetailsFormValues) => Promise<void>;
  cancel: () => void;
  rollback: () => void;
}

/**
 * Table details cache key factory
 */
export const createTableDetailsQueryKey = (
  serviceName: string,
  tableName: string,
  options?: { schema?: string; fields?: boolean; related?: boolean }
): QueryKey => {
  const baseKey = ['tableDetails', serviceName, tableName];
  
  if (options?.schema) {
    baseKey.push('schema', options.schema);
  }
  
  if (options?.fields) {
    baseKey.push('fields');
  }
  
  if (options?.related) {
    baseKey.push('related');
  }
  
  return baseKey;
};

// =============================================================================
// TANSTACK TABLE COLUMN DEFINITIONS
// =============================================================================

/**
 * Field component type enumeration for form rendering
 */
export enum FieldComponentType {
  TEXT_INPUT = 'text',
  NUMBER_INPUT = 'number',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  DATE_PICKER = 'date',
  DATETIME_PICKER = 'datetime',
  TIME_PICKER = 'time',
  JSON_EDITOR = 'json',
  CODE_EDITOR = 'code',
  FILE_UPLOAD = 'file',
  COLOR_PICKER = 'color',
  SLIDER = 'slider',
  SWITCH = 'switch',
  TAGS_INPUT = 'tags',
  AUTOCOMPLETE = 'autocomplete'
}

/**
 * TanStack Table column configuration for field management
 */
export interface FieldColumnConfig {
  // Column identification
  id: string;
  accessorKey?: string;
  accessorFn?: AccessorFn<TableField>;
  
  // Column display
  header: string | ReactNode;
  footer?: string | ReactNode;
  
  // Column sizing
  size?: number;
  minSize?: number;
  maxSize?: number;
  
  // Column behavior
  enableSorting?: boolean;
  enableColumnFilter?: boolean;
  enableGlobalFilter?: boolean;
  enableGrouping?: boolean;
  enableResizing?: boolean;
  enableHiding?: boolean;
  
  // Cell rendering
  cell?: (info: any) => ReactNode;
  aggregatedCell?: (info: any) => ReactNode;
  placeholder?: ReactNode;
  
  // Column metadata
  meta?: {
    fieldType?: FieldType;
    isRequired?: boolean;
    isEditable?: boolean;
    validation?: ReactHookFormRules;
  };
}

/**
 * Table fields column definitions for virtual scrolling
 * Optimized for 1000+ table schemas per Section 5.2 Component Details
 */
export interface FieldsTableColumns {
  name: ColumnDef<TableField>;
  alias: ColumnDef<TableField>;
  type: ColumnDef<TableField>;
  isVirtual: ColumnDef<TableField>;
  isAggregate: ColumnDef<TableField>;
  required: ColumnDef<TableField>;
  constraints: ColumnDef<TableField>;
  actions: ColumnDef<TableField>;
}

/**
 * Table relationships column definitions
 */
export interface RelationshipsTableColumns {
  name: ColumnDef<TableRelated>;
  alias: ColumnDef<TableRelated>;
  type: ColumnDef<TableRelated>;
  isVirtual: ColumnDef<TableRelated>;
  refTable: ColumnDef<TableRelated>;
  refField: ColumnDef<TableRelated>;
  actions: ColumnDef<TableRelated>;
}

/**
 * Row data interfaces for table display
 */
export interface FieldsRow {
  name: string;
  alias: string;
  type: string;
  isVirtual: boolean;
  isAggregate: boolean;
  required: boolean;
  constraints: string;
  actions?: ReactNode;
}

export interface RelationshipsRow {
  name: string;
  alias: string;
  type: string;
  isVirtual: boolean;
  refTable: string;
  refField: string;
  actions?: ReactNode;
}

export interface TableRow {
  id: string;
  label: string;
  name: string;
  actions?: ReactNode;
}

// =============================================================================
// MONACO EDITOR INTEGRATION TYPES
// =============================================================================

/**
 * Monaco editor configuration for JSON editing mode
 * Integrated with field validation and schema management
 */
export interface MonacoEditorConfig {
  // Editor configuration
  language: 'json' | 'sql' | 'javascript' | 'typescript' | 'yaml';
  theme: 'vs-dark' | 'vs-light' | 'hc-black';
  
  // Editor options
  options: editor.IStandaloneEditorConstructionOptions;
  
  // Schema validation
  jsonSchema?: object;
  schemaUri?: string;
  
  // Event handlers
  onChange?: (value: string) => void;
  onValidate?: (markers: editor.IMarker[]) => void;
  onMount?: (editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => void;
  
  // Validation integration
  enableValidation: boolean;
  showErrorsInline: boolean;
  validateOnType: boolean;
  
  // Performance options
  minimap?: boolean;
  wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  lineNumbers?: 'off' | 'on' | 'relative' | 'interval';
  folding?: boolean;
  
  // Accessibility
  accessibilitySupport?: 'auto' | 'off' | 'on';
  screenReaderAnnounceInlineSuggestion?: boolean;
}

/**
 * JSON schema definition for Monaco editor validation
 */
export interface JSONFieldSchema {
  $schema: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  title?: string;
  description?: string;
  properties?: Record<string, JSONFieldSchema>;
  items?: JSONFieldSchema;
  required?: string[];
  additionalProperties?: boolean | JSONFieldSchema;
  enum?: any[];
  default?: any;
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
}

// =============================================================================
// FORM MANAGEMENT TYPES
// =============================================================================

/**
 * Table details form return type with enhanced functionality
 */
export interface TableDetailsFormReturn extends UseFormReturn<TableDetailsFormValues> {
  // Form state
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  
  // Enhanced form actions
  submitWithValidation: () => Promise<void>;
  resetToOriginal: () => void;
  validateField: (fieldName: FieldPath<TableDetailsFormValues>) => Promise<boolean>;
  
  // Field array helpers
  addField: (field: TableFieldFormValues) => void;
  updateField: (index: number, field: Partial<TableFieldFormValues>) => void;
  removeField: (index: number) => void;
  moveField: (fromIndex: number, toIndex: number) => void;
  
  // Relationship array helpers
  addRelationship: (relationship: TableRelatedFormValues) => void;
  updateRelationship: (index: number, relationship: Partial<TableRelatedFormValues>) => void;
  removeRelationship: (index: number) => void;
  moveRelationship: (fromIndex: number, toIndex: number) => void;
  
  // Validation helpers
  validateAllFields: () => Promise<boolean>;
  validateAllRelationships: () => Promise<boolean>;
  getFieldErrors: (fieldName: string) => FieldError | undefined;
  
  // Change tracking
  getChangedFields: () => string[];
  getChangedRelationships: () => string[];
  hasUnsavedChanges: () => boolean;
}

/**
 * Field form context for nested components
 */
export interface FieldFormContext {
  control: Control<TableDetailsFormValues>;
  formState: FormState<TableDetailsFormValues>;
  fieldIndex: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => Promise<void>;
  onDelete: () => void;
}

/**
 * Relationship form context for nested components
 */
export interface RelationshipFormContext {
  control: Control<TableDetailsFormValues>;
  formState: FormState<TableDetailsFormValues>;
  relationshipIndex: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => Promise<void>;
  onDelete: () => void;
}

// =============================================================================
// COMPONENT PROP INTERFACES
// =============================================================================

/**
 * Table details component props
 */
export interface TableDetailsProps {
  // Data props
  serviceName: string;
  tableName: string;
  initialData?: TableDetails;
  
  // Configuration props
  readOnly?: boolean;
  showAdvanced?: boolean;
  enableOptimisticUpdates?: boolean;
  
  // Event handlers
  onSave?: (data: TableDetails) => void;
  onChange?: (data: Partial<TableDetails>) => void;
  onError?: (error: ApiError) => void;
  onCancel?: () => void;
  
  // UI customization
  className?: string;
  style?: React.CSSProperties;
  headerActions?: ReactNode;
  footerActions?: ReactNode;
  
  // Performance options
  enableVirtualScrolling?: boolean;
  pageSize?: number;
  debounceMs?: number;
  
  // Feature flags
  enableAdvancedValidation?: boolean;
  enableJsonEditor?: boolean;
  enableColumnManagement?: boolean;
  enableRelationshipManagement?: boolean;
}

/**
 * Field management component props
 */
export interface FieldManagementProps {
  // Data props
  fields: TableField[];
  serviceName: string;
  tableName: string;
  
  // Form integration
  form: TableDetailsFormReturn;
  
  // Configuration
  readOnly?: boolean;
  enableVirtualScrolling?: boolean;
  enableInlineEditing?: boolean;
  enableBulkOperations?: boolean;
  
  // Event handlers
  onFieldAdd?: (field: TableFieldFormValues) => void;
  onFieldUpdate?: (index: number, field: Partial<TableFieldFormValues>) => void;
  onFieldDelete?: (index: number) => void;
  onFieldsReorder?: (fromIndex: number, toIndex: number) => void;
  
  // UI customization
  className?: string;
  columns?: Partial<FieldsTableColumns>;
  actions?: ReactNode;
}

/**
 * Relationship management component props
 */
export interface RelationshipManagementProps {
  // Data props
  relationships: TableRelated[];
  serviceName: string;
  tableName: string;
  availableServices: DatabaseService[];
  
  // Form integration
  form: TableDetailsFormReturn;
  
  // Configuration
  readOnly?: boolean;
  enableInlineEditing?: boolean;
  enableBulkOperations?: boolean;
  
  // Event handlers
  onRelationshipAdd?: (relationship: TableRelatedFormValues) => void;
  onRelationshipUpdate?: (index: number, relationship: Partial<TableRelatedFormValues>) => void;
  onRelationshipDelete?: (index: number) => void;
  onRelationshipsReorder?: (fromIndex: number, toIndex: number) => void;
  
  // UI customization
  className?: string;
  columns?: Partial<RelationshipsTableColumns>;
  actions?: ReactNode;
}

// =============================================================================
// UTILITY TYPES AND HELPERS
// =============================================================================

/**
 * Table details loading state
 */
export interface TableDetailsLoadingState extends LoadingState {
  // Specific loading states
  loadingTable: boolean;
  loadingFields: boolean;
  loadingRelationships: boolean;
  loadingIndexes: boolean;
  loadingConstraints: boolean;
  
  // Operation states
  saving: boolean;
  validating: boolean;
  generating: boolean;
}

/**
 * Table details error state
 */
export interface TableDetailsErrorState {
  // General errors
  generalError?: string | null;
  
  // Specific errors
  tableError?: string | null;
  fieldsError?: string | null;
  relationshipsError?: string | null;
  validationError?: string | null;
  
  // Field-specific errors
  fieldErrors?: Record<string, string>;
  relationshipErrors?: Record<string, string>;
  
  // Form errors
  formErrors?: Record<string, FieldError>;
}

/**
 * Table details action types for state management
 */
export enum TableDetailsActionType {
  LOAD_START = 'LOAD_START',
  LOAD_SUCCESS = 'LOAD_SUCCESS',
  LOAD_ERROR = 'LOAD_ERROR',
  
  SAVE_START = 'SAVE_START',
  SAVE_SUCCESS = 'SAVE_SUCCESS',
  SAVE_ERROR = 'SAVE_ERROR',
  
  FIELD_ADD = 'FIELD_ADD',
  FIELD_UPDATE = 'FIELD_UPDATE',
  FIELD_DELETE = 'FIELD_DELETE',
  
  RELATIONSHIP_ADD = 'RELATIONSHIP_ADD',
  RELATIONSHIP_UPDATE = 'RELATIONSHIP_UPDATE',
  RELATIONSHIP_DELETE = 'RELATIONSHIP_DELETE',
  
  VALIDATION_START = 'VALIDATION_START',
  VALIDATION_SUCCESS = 'VALIDATION_SUCCESS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  RESET = 'RESET',
  CLEAR_ERRORS = 'CLEAR_ERRORS'
}

/**
 * Table details state for component management
 */
export interface TableDetailsState {
  // Data state
  data: TableDetails | null;
  originalData: TableDetails | null;
  
  // Loading state
  loading: TableDetailsLoadingState;
  
  // Error state
  error: TableDetailsErrorState;
  
  // Form state
  isDirty: boolean;
  isValid: boolean;
  hasUnsavedChanges: boolean;
  
  // UI state
  activeTab: 'fields' | 'relationships' | 'indexes' | 'constraints';
  expandedSections: string[];
  selectedFields: string[];
  selectedRelationships: string[];
  
  // Cache state
  lastFetched: string | null;
  cacheExpiry: string | null;
  isStale: boolean;
}

/**
 * Performance metrics for table details operations
 */
export interface TableDetailsPerformanceMetrics {
  // Load times
  loadTime: number;
  renderTime: number;
  validationTime: number;
  
  // Data sizes
  totalFields: number;
  totalRelationships: number;
  dataSize: number;
  
  // User interactions
  fieldsAdded: number;
  fieldsModified: number;
  fieldsDeleted: number;
  relationshipsAdded: number;
  relationshipsModified: number;
  relationshipsDeleted: number;
  
  // Performance flags
  isVirtualScrolling: boolean;
  isCached: boolean;
  isOptimistic: boolean;
}

// =============================================================================
// EXPORT ALL TYPES
// =============================================================================

// Export main interfaces
export type {
  // Core interfaces
  TableDetails,
  TableField,
  TableRelated,
  
  // Form data interfaces
  TableDetailsFormData,
  TableFieldFormData,
  TableRelatedFormData,
  
  // Validation interfaces
  ReactHookFormRules,
  FieldValidationFormData,
  
  // React Query interfaces
  TableDetailsQueryConfig,
  TableDetailsQueryResult,
  TableDetailsMutationConfig,
  TableDetailsMutationResult,
  
  // Table column interfaces
  FieldColumnConfig,
  FieldsTableColumns,
  RelationshipsTableColumns,
  
  // Monaco editor interfaces
  MonacoEditorConfig,
  JSONFieldSchema,
  
  // Form management interfaces
  TableDetailsFormReturn,
  FieldFormContext,
  RelationshipFormContext,
  
  // Component prop interfaces
  TableDetailsProps,
  FieldManagementProps,
  RelationshipManagementProps,
  
  // State management interfaces
  TableDetailsLoadingState,
  TableDetailsErrorState,
  TableDetailsState,
  TableDetailsPerformanceMetrics,
  
  // Row interfaces for legacy compatibility
  FieldsRow,
  RelationshipsRow,
  TableRow
};

// Export enums
export {
  RelationshipType,
  FieldComponentType,
  TableDetailsActionType
};

// Export Zod schemas
export {
  TableDetailsFormSchema,
  TableFieldFormSchema,
  TableRelatedFormSchema
};

// Export type inference helpers
export type {
  TableDetailsFormValues,
  TableFieldFormValues,
  TableRelatedFormValues
};

// Export utility functions
export {
  createTableDetailsQueryKey
};

// Re-export commonly used external types
export type {
  UseFormReturn,
  FieldValues,
  Control,
  FormState,
  FieldError,
  FieldPath
} from 'react-hook-form';

export type {
  UseQueryResult,
  UseMutationResult,
  QueryKey
} from '@tanstack/react-query';

export type {
  ColumnDef,
  Table,
  Row,
  Cell,
  Header,
  AccessorFn
} from '@tanstack/react-table';

export type { editor } from 'monaco-editor';