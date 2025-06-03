/**
 * Table Details Types for React/Next.js DreamFactory Admin Interface
 * 
 * TypeScript type definitions for table details functionality, including interfaces
 * for table metadata, field definitions, relationships, and form data structures.
 * Provides strong typing for React Hook Form integration and API response handling.
 * Ensures type safety throughout the table management workflow.
 * 
 * Features:
 * - React Hook Form compatibility with Zod schema validation
 * - TypeScript 5.8+ strict type safety with enhanced inference
 * - TanStack Table integration for fields and relationships management
 * - JSON editor support for direct schema manipulation
 * - Real-time validation under 100ms performance target
 * - Optimistic updates with React Query integration
 * - Accessibility compliance with WCAG 2.1 AA standards
 * 
 * @fileoverview Table details type definitions for React migration
 * @version 1.0.0
 */

import { z } from 'zod';
import { ReactNode } from 'react';
import {
  UseFormReturn,
  Control,
  FieldValues,
  UseFormWatch,
  UseFormSetValue,
  UseFormGetValues,
  FieldErrors,
  FormState
} from 'react-hook-form';
import {
  ColumnDef,
  Row,
  Cell,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  PaginationState,
  RowSelectionState
} from '@tanstack/react-table';
import {
  UseMutationResult,
  UseQueryResult,
  QueryKey
} from '@tanstack/react-query';

// Import base types from the established type system
import type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  BoundaryError,
  MutationConfig,
  QueryConfig,
  LoadingState
} from '../../../../types/api';

import type {
  DatabaseTable,
  DatabaseField,
  DatabaseIndex,
  DatabaseForeignKey,
  DatabaseConstraint,
  TableRelationship,
  DatabaseSchema,
  SchemaDiscoveryConfig
} from '../../../../types/database';

import type {
  BaseComponent,
  ComponentVariant,
  ComponentSize,
  FormFieldComponent,
  SelectOption,
  AccessibilityProps
} from '../../../../types/ui';

import type {
  FormSchemaBase,
  ValidationError,
  FormField,
  ConditionalLogic
} from '../../../../types/forms';

// Import from table management types
import type {
  TableMetadata,
  TableFieldConfig,
  TableRouteParams,
  TableSearchParams
} from '../table.types';

// =============================================================================
// ENHANCED TABLE DETAILS TYPES
// =============================================================================

/**
 * Complete table details with all related metadata
 * Extends base TableMetadata with form-specific properties
 */
export interface TableDetailsData extends TableMetadata {
  /** Table schema context */
  schema_context: {
    /** Parent schema name */
    schema_name?: string;
    /** Service name */
    service_name: string;
    /** Database type */
    database_type: string;
    /** Total tables in schema */
    total_tables: number;
    /** Schema last discovered */
    last_discovered: string;
  };

  /** Extended field definitions with form configuration */
  fields: TableFieldDetails[];

  /** Extended relationship definitions */
  relationships: TableRelationshipDetails[];

  /** Table constraints with validation rules */
  constraints: TableConstraintDetails[];

  /** Table indexes with performance metrics */
  indexes: TableIndexDetails[];

  /** Validation configuration */
  validation: {
    /** Enable server-side validation */
    server_validation: boolean;
    /** Custom validation rules */
    custom_rules: ValidationRule[];
    /** Validation error messages */
    error_messages: Record<string, string>;
  };

  /** Form generation configuration */
  form_config: {
    /** Auto-generate forms */
    auto_generate: boolean;
    /** Form layout preferences */
    layout: 'single-column' | 'two-column' | 'tabbed' | 'accordion';
    /** Field grouping strategy */
    grouping: 'none' | 'type' | 'category' | 'custom';
    /** Required field handling */
    required_handling: 'mark' | 'validate' | 'both';
  };

  /** JSON schema representation */
  json_schema: {
    /** OpenAPI-compatible schema */
    openapi_schema: Record<string, unknown>;
    /** JSON Schema draft */
    json_schema_draft: string;
    /** Custom schema properties */
    custom_properties: Record<string, unknown>;
  };
}

/**
 * Enhanced field definition for table details form
 */
export interface TableFieldDetails extends DatabaseField {
  /** Field validation configuration */
  validation: {
    /** Built-in validation rules */
    rules: FieldValidationRule[];
    /** Custom validation functions */
    custom_validators: CustomValidator[];
    /** Validation error messages */
    error_messages: Record<string, string>;
    /** Real-time validation enabled */
    real_time: boolean;
  };

  /** Form field configuration */
  form_field: {
    /** Form input type */
    input_type: FormInputType;
    /** Field options for select types */
    options: SelectOption[];
    /** Conditional display logic */
    conditional: ConditionalLogic[];
    /** Field grouping */
    group: string;
    /** Field order in form */
    order: number;
    /** Show in create form */
    show_in_create: boolean;
    /** Show in edit form */
    show_in_edit: boolean;
    /** Show in view mode */
    show_in_view: boolean;
  };

  /** API configuration */
  api_config: {
    /** Include in API responses */
    include_in_response: boolean;
    /** Allow filtering by this field */
    filterable: boolean;
    /** Allow sorting by this field */
    sortable: boolean;
    /** Allow searching by this field */
    searchable: boolean;
    /** API field name override */
    api_name?: string;
    /** Field transformation function */
    transform?: string;
  };

  /** UI display configuration */
  ui_config: {
    /** Display format */
    format: FieldDisplayFormat;
    /** Column width in tables */
    column_width?: number;
    /** Show in compact view */
    show_in_compact: boolean;
    /** Custom display component */
    custom_component?: string;
    /** Icon for field */
    icon?: string;
    /** Color coding */
    color?: string;
  };

  /** Performance metrics */
  performance: {
    /** Field selectivity (0-1) */
    selectivity?: number;
    /** Index usage frequency */
    index_usage?: number;
    /** Query frequency */
    query_frequency?: number;
  };
}

/**
 * Enhanced relationship definition with React component support
 */
export interface TableRelationshipDetails extends TableRelationship {
  /** Relationship validation */
  validation: {
    /** Enforce referential integrity */
    enforce_integrity: boolean;
    /** Cascade delete rules */
    cascade_rules: CascadeRule[];
    /** Validation on update */
    validate_on_update: boolean;
  };

  /** Form configuration for relationship handling */
  form_config: {
    /** Display as form field */
    show_in_form: boolean;
    /** Field type for relationship */
    field_type: 'select' | 'multiselect' | 'autocomplete' | 'lookup';
    /** Load options dynamically */
    dynamic_options: boolean;
    /** Options query configuration */
    options_query?: {
      /** Query string */
      query: string;
      /** Value field */
      value_field: string;
      /** Label field */
      label_field: string;
      /** Additional display fields */
      display_fields: string[];
    };
  };

  /** UI visualization */
  visualization: {
    /** Show relationship diagram */
    show_diagram: boolean;
    /** Relationship line style */
    line_style: 'solid' | 'dashed' | 'dotted';
    /** Connection type indicator */
    connection_type: 'one-to-one' | 'one-to-many' | 'many-to-many';
    /** Visual grouping */
    group: string;
  };

  /** Performance impact */
  performance: {
    /** Join performance rating */
    join_performance: 'excellent' | 'good' | 'fair' | 'poor';
    /** Query frequency */
    query_frequency: number;
    /** Index recommendations */
    index_recommendations: string[];
  };
}

/**
 * Table constraint details with validation support
 */
export interface TableConstraintDetails extends DatabaseConstraint {
  /** Constraint validation */
  validation: {
    /** Enable constraint checking */
    enabled: boolean;
    /** Validation level */
    level: 'error' | 'warning' | 'info';
    /** Custom error message */
    error_message: string;
  };

  /** Form integration */
  form_integration: {
    /** Apply to form validation */
    apply_to_form: boolean;
    /** Client-side validation */
    client_side: boolean;
    /** Server-side validation */
    server_side: boolean;
  };

  /** Performance impact */
  performance_impact: {
    /** Impact on insert operations */
    insert_impact: 'low' | 'medium' | 'high';
    /** Impact on update operations */
    update_impact: 'low' | 'medium' | 'high';
    /** Impact on delete operations */
    delete_impact: 'low' | 'medium' | 'high';
  };
}

/**
 * Enhanced index definition with optimization recommendations
 */
export interface TableIndexDetails extends DatabaseIndex {
  /** Index performance metrics */
  performance: {
    /** Usage frequency */
    usage_frequency: number;
    /** Selectivity score */
    selectivity: number;
    /** Size in bytes */
    size_bytes: number;
    /** Last usage timestamp */
    last_used?: string;
  };

  /** Optimization recommendations */
  recommendations: {
    /** Recommended actions */
    actions: IndexRecommendation[];
    /** Priority level */
    priority: 'high' | 'medium' | 'low';
    /** Estimated impact */
    estimated_impact: string;
  };

  /** Form impact */
  form_impact: {
    /** Affects form field ordering */
    affects_ordering: boolean;
    /** Supports autocomplete */
    supports_autocomplete: boolean;
    /** Enables fast lookup */
    enables_fast_lookup: boolean;
  };
}

// =============================================================================
// FORM SCHEMA DEFINITIONS WITH ZOD VALIDATION
// =============================================================================

/**
 * Table basic information form schema
 */
export interface TableBasicForm {
  /** Table name (database identifier) */
  name: string;
  /** Table alias for API */
  alias: string;
  /** Display label */
  label: string;
  /** Plural form */
  plural: string;
  /** Table description */
  description: string;
  /** Schema name */
  schema?: string;
  /** Table type */
  type: 'table' | 'view' | 'materialized_view';
  /** Enable in API */
  api_enabled: boolean;
  /** Access level */
  access_level: number;
}

/**
 * Zod validation schema for table basic form
 */
export const tableBasicFormSchema = z.object({
  name: z.string()
    .min(1, 'Table name is required')
    .max(64, 'Table name must be 64 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Invalid table name format'),
  alias: z.string()
    .max(64, 'Alias must be 64 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Invalid alias format')
    .optional()
    .default(''),
  label: z.string()
    .min(1, 'Label is required')
    .max(128, 'Label must be 128 characters or less'),
  plural: z.string()
    .min(1, 'Plural form is required')
    .max(128, 'Plural must be 128 characters or less'),
  description: z.string()
    .max(1000, 'Description must be 1000 characters or less')
    .default(''),
  schema: z.string()
    .max(64, 'Schema name must be 64 characters or less')
    .optional(),
  type: z.enum(['table', 'view', 'materialized_view'])
    .default('table'),
  api_enabled: z.boolean()
    .default(true),
  access_level: z.number()
    .min(0)
    .max(7)
    .default(1)
});

/**
 * Field definition form schema
 */
export interface FieldDefinitionForm {
  /** Field name */
  name: string;
  /** Field alias */
  alias: string;
  /** Display label */
  label: string;
  /** Field description */
  description: string;
  /** Data type */
  type: string;
  /** Database-specific type */
  db_type: string;
  /** Field length */
  length?: number;
  /** Precision for numeric types */
  precision?: number;
  /** Scale for decimal types */
  scale?: number;
  /** Default value */
  default_value?: unknown;
  /** Required field */
  required: boolean;
  /** Allow null values */
  allow_null: boolean;
  /** Auto increment */
  auto_increment: boolean;
  /** Primary key */
  is_primary_key: boolean;
  /** Unique constraint */
  is_unique: boolean;
  /** Foreign key reference */
  foreign_key?: {
    /** Referenced table */
    ref_table: string;
    /** Referenced field */
    ref_field: string;
    /** On update action */
    on_update: ReferentialAction;
    /** On delete action */
    on_delete: ReferentialAction;
  };
  /** Validation rules */
  validation_rules: FieldValidationRule[];
  /** Form field configuration */
  form_field_config: {
    input_type: FormInputType;
    show_in_form: boolean;
    field_order: number;
    field_group: string;
  };
}

/**
 * Zod validation schema for field definition form
 */
export const fieldDefinitionFormSchema = z.object({
  name: z.string()
    .min(1, 'Field name is required')
    .max(64, 'Field name must be 64 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Invalid field name format'),
  alias: z.string()
    .max(64, 'Alias must be 64 characters or less')
    .default(''),
  label: z.string()
    .min(1, 'Label is required')
    .max(128, 'Label must be 128 characters or less'),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .default(''),
  type: z.string()
    .min(1, 'Data type is required'),
  db_type: z.string()
    .min(1, 'Database type is required'),
  length: z.number()
    .positive()
    .optional(),
  precision: z.number()
    .positive()
    .max(65)
    .optional(),
  scale: z.number()
    .min(0)
    .max(30)
    .optional(),
  default_value: z.unknown()
    .optional(),
  required: z.boolean()
    .default(false),
  allow_null: z.boolean()
    .default(true),
  auto_increment: z.boolean()
    .default(false),
  is_primary_key: z.boolean()
    .default(false),
  is_unique: z.boolean()
    .default(false),
  foreign_key: z.object({
    ref_table: z.string().min(1),
    ref_field: z.string().min(1),
    on_update: z.enum(['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT']),
    on_delete: z.enum(['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT'])
  }).optional(),
  validation_rules: z.array(z.object({
    type: z.string(),
    value: z.unknown(),
    message: z.string()
  })).default([]),
  form_field_config: z.object({
    input_type: z.enum(['text', 'textarea', 'select', 'checkbox', 'radio', 'date', 'datetime', 'number', 'email', 'url', 'password']),
    show_in_form: z.boolean().default(true),
    field_order: z.number().default(0),
    field_group: z.string().default('general')
  })
});

/**
 * Relationship definition form schema
 */
export interface RelationshipDefinitionForm {
  /** Relationship name */
  name: string;
  /** Relationship alias */
  alias: string;
  /** Display label */
  label: string;
  /** Relationship description */
  description: string;
  /** Relationship type */
  type: 'belongs_to' | 'has_one' | 'has_many' | 'many_to_many';
  /** Local field */
  local_field: string;
  /** Referenced table */
  ref_table: string;
  /** Referenced field */
  ref_field: string;
  /** Junction table for many-to-many */
  junction_table?: string;
  /** Junction local field */
  junction_local_field?: string;
  /** Junction remote field */
  junction_remote_field?: string;
  /** Always fetch related data */
  always_fetch: boolean;
  /** Flatten nested data */
  flatten: boolean;
  /** Is virtual relationship */
  is_virtual: boolean;
}

/**
 * Zod validation schema for relationship definition form
 */
export const relationshipDefinitionFormSchema = z.object({
  name: z.string()
    .min(1, 'Relationship name is required')
    .max(64, 'Name must be 64 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Invalid relationship name format'),
  alias: z.string()
    .max(64, 'Alias must be 64 characters or less')
    .default(''),
  label: z.string()
    .min(1, 'Label is required')
    .max(128, 'Label must be 128 characters or less'),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .default(''),
  type: z.enum(['belongs_to', 'has_one', 'has_many', 'many_to_many']),
  local_field: z.string()
    .min(1, 'Local field is required'),
  ref_table: z.string()
    .min(1, 'Referenced table is required'),
  ref_field: z.string()
    .min(1, 'Referenced field is required'),
  junction_table: z.string()
    .optional(),
  junction_local_field: z.string()
    .optional(),
  junction_remote_field: z.string()
    .optional(),
  always_fetch: z.boolean()
    .default(false),
  flatten: z.boolean()
    .default(false),
  is_virtual: z.boolean()
    .default(false)
}).refine((data) => {
  // Validate many-to-many relationships require junction table
  if (data.type === 'many_to_many') {
    return data.junction_table && data.junction_local_field && data.junction_remote_field;
  }
  return true;
}, {
  message: "Many-to-many relationships require junction table configuration",
  path: ['junction_table']
});

/**
 * JSON editor form schema for direct schema manipulation
 */
export interface JsonEditorForm {
  /** JSON schema content */
  json_content: string;
  /** Validation mode */
  validation_mode: 'strict' | 'loose' | 'disabled';
  /** Auto-format on blur */
  auto_format: boolean;
  /** Show line numbers */
  show_line_numbers: boolean;
  /** Enable syntax highlighting */
  syntax_highlighting: boolean;
}

/**
 * Zod validation schema for JSON editor
 */
export const jsonEditorFormSchema = z.object({
  json_content: z.string()
    .min(1, 'JSON content is required')
    .refine((val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    }, 'Invalid JSON format'),
  validation_mode: z.enum(['strict', 'loose', 'disabled'])
    .default('strict'),
  auto_format: z.boolean()
    .default(true),
  show_line_numbers: z.boolean()
    .default(true),
  syntax_highlighting: z.boolean()
    .default(true)
});

// =============================================================================
// TANSTACK TABLE CONFIGURATIONS
// =============================================================================

/**
 * Fields table row data for display in TanStack Table
 */
export interface FieldsTableRow {
  /** Field ID */
  id: string;
  /** Field name */
  name: string;
  /** Field alias */
  alias: string;
  /** Data type */
  type: string;
  /** Required flag */
  required: boolean;
  /** Primary key flag */
  is_primary_key: boolean;
  /** Foreign key flag */
  is_foreign_key: boolean;
  /** Unique constraint flag */
  is_unique: boolean;
  /** Virtual field flag */
  is_virtual: boolean;
  /** Default value */
  default_value?: unknown;
  /** Field constraints summary */
  constraints: string;
  /** API enabled flag */
  api_enabled: boolean;
  /** Form enabled flag */
  form_enabled: boolean;
  /** Actions available */
  actions: FieldAction[];
}

/**
 * Relationships table row data for display in TanStack Table
 */
export interface RelationshipsTableRow {
  /** Relationship ID */
  id: string;
  /** Relationship name */
  name: string;
  /** Relationship alias */
  alias: string;
  /** Relationship type */
  type: 'belongs_to' | 'has_one' | 'has_many' | 'many_to_many';
  /** Local field */
  local_field: string;
  /** Referenced table */
  ref_table: string;
  /** Referenced field */
  ref_field: string;
  /** Virtual relationship flag */
  is_virtual: boolean;
  /** Always fetch flag */
  always_fetch: boolean;
  /** Performance rating */
  performance_rating: 'excellent' | 'good' | 'fair' | 'poor';
  /** Actions available */
  actions: RelationshipAction[];
}

/**
 * Table column definitions for fields table
 */
export type FieldsTableColumns = ColumnDef<FieldsTableRow>[];

/**
 * Table column definitions for relationships table
 */
export type RelationshipsTableColumns = ColumnDef<RelationshipsTableRow>[];

// =============================================================================
// REACT QUERY INTEGRATION TYPES
// =============================================================================

/**
 * Query keys for table details
 */
export const tableDetailsQueryKeys = {
  /** Table details base */
  details: (service: string, tableName: string) => 
    ['table-details', service, tableName] as const,
  
  /** Table fields */
  fields: (service: string, tableName: string) => 
    [...tableDetailsQueryKeys.details(service, tableName), 'fields'] as const,
  
  /** Table relationships */
  relationships: (service: string, tableName: string) => 
    [...tableDetailsQueryKeys.details(service, tableName), 'relationships'] as const,
  
  /** Table constraints */
  constraints: (service: string, tableName: string) => 
    [...tableDetailsQueryKeys.details(service, tableName), 'constraints'] as const,
  
  /** Table indexes */
  indexes: (service: string, tableName: string) => 
    [...tableDetailsQueryKeys.details(service, tableName), 'indexes'] as const,
  
  /** JSON schema */
  jsonSchema: (service: string, tableName: string) => 
    [...tableDetailsQueryKeys.details(service, tableName), 'json-schema'] as const
};

/**
 * Table details query result
 */
export type TableDetailsQueryResult = UseQueryResult<TableDetailsData, BoundaryError>;

/**
 * Field mutation variables
 */
export interface FieldMutationVariables {
  service: string;
  tableName: string;
  fieldData: FieldDefinitionForm;
  operation: 'create' | 'update' | 'delete';
}

/**
 * Relationship mutation variables
 */
export interface RelationshipMutationVariables {
  service: string;
  tableName: string;
  relationshipData: RelationshipDefinitionForm;
  operation: 'create' | 'update' | 'delete';
}

/**
 * JSON schema update variables
 */
export interface JsonSchemaUpdateVariables {
  service: string;
  tableName: string;
  jsonContent: string;
  validationMode: 'strict' | 'loose' | 'disabled';
}

/**
 * Table update mutation variables
 */
export interface TableUpdateVariables {
  service: string;
  tableName: string;
  updates: Partial<TableBasicForm>;
}

// =============================================================================
// COMPONENT PROPS INTERFACES
// =============================================================================

/**
 * Table form component props
 */
export interface TableFormProps extends BaseComponent {
  /** Service name */
  service: string;
  /** Table name (undefined for creation) */
  tableName?: string;
  /** Initial form data */
  initialData?: Partial<TableBasicForm>;
  /** Form submission handler */
  onSubmit: (data: TableBasicForm) => Promise<void>;
  /** Cancel handler */
  onCancel: () => void;
  /** Loading state */
  loading?: boolean;
  /** Form errors */
  errors?: FieldErrors<TableBasicForm>;
  /** Enable advanced options */
  showAdvanced?: boolean;
}

/**
 * Fields table component props
 */
export interface FieldsTableProps extends BaseComponent {
  /** Service name */
  service: string;
  /** Table name */
  tableName: string;
  /** Fields data */
  fields: FieldsTableRow[];
  /** Loading state */
  loading?: boolean;
  /** Enable editing */
  enableEditing?: boolean;
  /** Field selection handler */
  onFieldSelect?: (fieldId: string) => void;
  /** Field action handler */
  onFieldAction?: (action: FieldAction, fieldId: string) => void;
  /** Add field handler */
  onAddField?: () => void;
  /** Virtual scrolling configuration */
  virtualScrolling?: boolean;
}

/**
 * Relationships table component props
 */
export interface RelationshipsTableProps extends BaseComponent {
  /** Service name */
  service: string;
  /** Table name */
  tableName: string;
  /** Relationships data */
  relationships: RelationshipsTableRow[];
  /** Loading state */
  loading?: boolean;
  /** Enable editing */
  enableEditing?: boolean;
  /** Relationship selection handler */
  onRelationshipSelect?: (relationshipId: string) => void;
  /** Relationship action handler */
  onRelationshipAction?: (action: RelationshipAction, relationshipId: string) => void;
  /** Add relationship handler */
  onAddRelationship?: () => void;
}

/**
 * JSON editor component props
 */
export interface JsonEditorProps extends BaseComponent {
  /** JSON content */
  content: string;
  /** Content change handler */
  onChange: (content: string) => void;
  /** Validation errors */
  errors?: string[];
  /** Editor configuration */
  config?: Partial<JsonEditorForm>;
  /** Enable validation */
  enableValidation?: boolean;
  /** Validation mode */
  validationMode?: 'strict' | 'loose' | 'disabled';
  /** Read-only mode */
  readOnly?: boolean;
  /** Show diff view */
  showDiff?: boolean;
  /** Original content for diff */
  originalContent?: string;
}

// =============================================================================
// HOOK INTERFACES
// =============================================================================

/**
 * Table details hook configuration
 */
export interface UseTableDetailsConfig {
  service: string;
  tableName: string;
  includeFields?: boolean;
  includeRelationships?: boolean;
  includeConstraints?: boolean;
  includeIndexes?: boolean;
  includeJsonSchema?: boolean;
}

/**
 * Table details hook return type
 */
export interface UseTableDetailsReturn {
  /** Table details query */
  tableQuery: TableDetailsQueryResult;
  /** Update table mutation */
  updateTableMutation: UseMutationResult<TableDetailsData, BoundaryError, TableUpdateVariables>;
  /** Field mutations */
  fieldMutations: {
    create: UseMutationResult<TableFieldDetails, BoundaryError, FieldMutationVariables>;
    update: UseMutationResult<TableFieldDetails, BoundaryError, FieldMutationVariables>;
    delete: UseMutationResult<void, BoundaryError, FieldMutationVariables>;
  };
  /** Relationship mutations */
  relationshipMutations: {
    create: UseMutationResult<TableRelationshipDetails, BoundaryError, RelationshipMutationVariables>;
    update: UseMutationResult<TableRelationshipDetails, BoundaryError, RelationshipMutationVariables>;
    delete: UseMutationResult<void, BoundaryError, RelationshipMutationVariables>;
  };
  /** JSON schema mutation */
  jsonSchemaMutation: UseMutationResult<TableDetailsData, BoundaryError, JsonSchemaUpdateVariables>;
  /** Helper functions */
  actions: {
    updateTable: (updates: Partial<TableBasicForm>) => Promise<void>;
    createField: (fieldData: FieldDefinitionForm) => Promise<void>;
    updateField: (fieldData: FieldDefinitionForm) => Promise<void>;
    deleteField: (fieldName: string) => Promise<void>;
    createRelationship: (relationshipData: RelationshipDefinitionForm) => Promise<void>;
    updateRelationship: (relationshipData: RelationshipDefinitionForm) => Promise<void>;
    deleteRelationship: (relationshipName: string) => Promise<void>;
    updateJsonSchema: (content: string, validationMode?: 'strict' | 'loose' | 'disabled') => Promise<void>;
    refresh: () => void;
  };
  /** Loading states */
  loading: {
    table: boolean;
    fields: boolean;
    relationships: boolean;
    anyMutation: boolean;
  };
  /** Error states */
  errors: {
    table?: BoundaryError;
    fields?: BoundaryError;
    relationships?: BoundaryError;
    mutations?: BoundaryError;
  };
}

// =============================================================================
// UTILITY AND HELPER TYPES
// =============================================================================

/**
 * Form input types for field configuration
 */
export type FormInputType = 
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'date'
  | 'datetime'
  | 'time'
  | 'number'
  | 'email'
  | 'url'
  | 'password'
  | 'file'
  | 'image'
  | 'json'
  | 'code'
  | 'markdown'
  | 'wysiwyg';

/**
 * Field display formats
 */
export type FieldDisplayFormat = 
  | 'auto'
  | 'text'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'datetime'
  | 'time'
  | 'duration'
  | 'boolean'
  | 'json'
  | 'html'
  | 'markdown'
  | 'code'
  | 'image'
  | 'link'
  | 'email'
  | 'phone'
  | 'tag'
  | 'badge'
  | 'progress';

/**
 * Referential actions for foreign keys
 */
export type ReferentialAction = 
  | 'NO ACTION'
  | 'RESTRICT'
  | 'CASCADE'
  | 'SET NULL'
  | 'SET DEFAULT';

/**
 * Cascade rules for relationships
 */
export interface CascadeRule {
  action: 'delete' | 'update';
  behavior: ReferentialAction;
  enabled: boolean;
}

/**
 * Field validation rules
 */
export interface FieldValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'url' | 'custom';
  value?: unknown;
  message: string;
  enabled: boolean;
}

/**
 * Custom validator definition
 */
export interface CustomValidator {
  name: string;
  function: string;
  message: string;
  parameters?: Record<string, unknown>;
}

/**
 * Validation rule definition
 */
export interface ValidationRule {
  field: string;
  rules: FieldValidationRule[];
  conditional?: ConditionalLogic;
}

/**
 * Index recommendation types
 */
export interface IndexRecommendation {
  type: 'create' | 'drop' | 'modify';
  description: string;
  sql_statement?: string;
  estimated_benefit: string;
  complexity: 'low' | 'medium' | 'high';
}

/**
 * Available actions for fields
 */
export type FieldAction = 
  | 'edit'
  | 'delete'
  | 'clone'
  | 'move_up'
  | 'move_down'
  | 'toggle_api'
  | 'toggle_form'
  | 'view_constraints'
  | 'optimize';

/**
 * Available actions for relationships
 */
export type RelationshipAction = 
  | 'edit'
  | 'delete'
  | 'clone'
  | 'test_connection'
  | 'view_diagram'
  | 'optimize'
  | 'toggle_fetch';

/**
 * Tab configuration for table details interface
 */
export interface TableDetailsTab {
  id: string;
  label: string;
  icon?: string;
  component: ReactNode;
  disabled?: boolean;
  badge?: string | number;
  description?: string;
}

/**
 * Table details page configuration
 */
export interface TableDetailsConfig {
  /** Available tabs */
  tabs: TableDetailsTab[];
  /** Default active tab */
  defaultTab: string;
  /** Enable tab persistence */
  persistActiveTab?: boolean;
  /** Show tab badges */
  showBadges?: boolean;
  /** Enable drag and drop for tab reordering */
  enableTabReordering?: boolean;
  /** Sidebar configuration */
  sidebar?: {
    enabled: boolean;
    position: 'left' | 'right';
    collapsible: boolean;
    defaultCollapsed?: boolean;
  };
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Core data types
  TableDetailsData,
  TableFieldDetails,
  TableRelationshipDetails,
  TableConstraintDetails,
  TableIndexDetails,
  
  // Form schemas
  TableBasicForm,
  FieldDefinitionForm,
  RelationshipDefinitionForm,
  JsonEditorForm,
  
  // Table row data
  FieldsTableRow,
  RelationshipsTableRow,
  FieldsTableColumns,
  RelationshipsTableColumns,
  
  // Query and mutation types
  TableDetailsQueryResult,
  FieldMutationVariables,
  RelationshipMutationVariables,
  JsonSchemaUpdateVariables,
  TableUpdateVariables,
  
  // Component props
  TableFormProps,
  FieldsTableProps,
  RelationshipsTableProps,
  JsonEditorProps,
  
  // Hook interfaces
  UseTableDetailsConfig,
  UseTableDetailsReturn,
  
  // Utility types
  FormInputType,
  FieldDisplayFormat,
  ReferentialAction,
  CascadeRule,
  FieldValidationRule,
  CustomValidator,
  ValidationRule,
  IndexRecommendation,
  FieldAction,
  RelationshipAction,
  TableDetailsTab,
  TableDetailsConfig
};

export {
  // Query keys
  tableDetailsQueryKeys,
  
  // Validation schemas
  tableBasicFormSchema,
  fieldDefinitionFormSchema,
  relationshipDefinitionFormSchema,
  jsonEditorFormSchema
};