/**
 * Database Relationship Management Types for React/Next.js Migration
 * 
 * Comprehensive TypeScript type definitions for database relationship management
 * adapted for React patterns. Provides type safety for relationship schemas,
 * form data structures, junction table configurations, and validation rules
 * compatible with React Hook Form, Zod validation, and API responses while
 * maintaining compatibility with DreamFactory relationship schema requirements.
 * 
 * @fileoverview Relationship management types for React/Next.js refactor
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { z } from 'zod';
import { ColumnDef } from '@tanstack/react-table';
import { UseFormReturn, FieldValues, Path } from 'react-hook-form';
import type { 
  ApiResponse, 
  ApiListResponse, 
  ApiCreateResponse, 
  ApiUpdateResponse,
  ApiDeleteResponse,
  PaginationMeta,
  ValidationError,
  KeyValuePair
} from '../../../types/api';
import type { 
  DatabaseService,
  DatabaseTable,
  DatabaseField,
  RelationshipType as BaseRelationshipType,
  TableRelationship as BaseTableRelationship
} from '../../../types/database';
import type { 
  BaseComponent,
  ComponentVariant,
  ComponentSize,
  FormFieldProps,
  SelectOption,
  TableConfiguration
} from '../../../types/ui';

// =============================================================================
// CORE RELATIONSHIP TYPES
// =============================================================================

/**
 * Database relationship types supported by DreamFactory
 * Extended for React component compatibility
 */
export type RelationshipType = 'belongs_to' | 'has_many' | 'has_one' | 'many_many';

/**
 * Relationship configuration status for form state management
 */
export type RelationshipStatus = 'active' | 'inactive' | 'configuring' | 'validating' | 'error';

/**
 * Junction table configuration requirement levels
 */
export type JunctionRequirement = 'required' | 'optional' | 'disabled' | 'auto';

/**
 * Relationship validation states for real-time feedback
 */
export type ValidationState = 'valid' | 'invalid' | 'pending' | 'unchecked';

// =============================================================================
// RELATIONSHIP SCHEMA INTERFACES
// =============================================================================

/**
 * Core relationship configuration compatible with DreamFactory API
 * Enhanced for React Hook Form and Zod validation integration
 */
export interface RelationshipSchema {
  /** Unique relationship identifier (auto-generated) */
  id?: string | number;
  
  /** Relationship name (required, used in API endpoints) */
  name: string;
  
  /** Optional alias for relationship display */
  alias?: string;
  
  /** Human-readable label for UI display */
  label?: string;
  
  /** Description explaining the relationship purpose */
  description?: string;
  
  /** Relationship type determining configuration requirements */
  type: RelationshipType;
  
  /** Whether relationship data is always fetched with parent */
  always_fetch: boolean;
  
  /** Virtual relationship flag (DreamFactory specific) */
  is_virtual: boolean;
  
  /** Flatten relationship data in response */
  flatten: boolean;
  
  /** Drop prefix when flattening */
  flatten_drop_prefix: boolean;
  
  // Local table configuration
  /** Local field name that establishes the relationship */
  local_field: string;
  
  // Foreign table configuration
  /** Foreign service ID containing the related table */
  foreign_service_id: number | string;
  
  /** Foreign service name (derived from service ID) */
  foreign_service_name?: string;
  
  /** Foreign table name */
  foreign_table: string;
  
  /** Foreign field name that completes the relationship */
  foreign_field: string;
  
  // Junction table configuration (many-to-many only)
  /** Junction service ID (required for many_many) */
  junction_service_id?: number | string;
  
  /** Junction service name (derived from service ID) */
  junction_service_name?: string;
  
  /** Junction table name */
  junction_table?: string;
  
  /** Local field in junction table */
  junction_local_field?: string;
  
  /** Foreign field in junction table */
  junction_foreign_field?: string;
  
  // Referential integrity actions
  /** Action on foreign key update */
  on_update?: 'cascade' | 'restrict' | 'set_null' | 'set_default' | 'no_action';
  
  /** Action on foreign key delete */
  on_delete?: 'cascade' | 'restrict' | 'set_null' | 'set_default' | 'no_action';
  
  // Metadata
  /** Relationship creation timestamp */
  created_at?: string;
  
  /** Last modification timestamp */
  updated_at?: string;
  
  /** Current validation state */
  validation_state?: ValidationState;
  
  /** Validation error messages */
  validation_errors?: ValidationError[];
}

/**
 * Relationship discovery configuration for automatic detection
 */
export interface RelationshipDiscoveryConfig {
  /** Service name to analyze */
  service_name: string;
  
  /** Table name to analyze */
  table_name: string;
  
  /** Discovery methods to use */
  discovery_methods: Array<'foreign_keys' | 'naming_convention' | 'manual'>;
  
  /** Include virtual relationships */
  include_virtual: boolean;
  
  /** Maximum relationships to discover */
  max_relationships: number;
  
  /** Discovery timeout in milliseconds */
  timeout_ms: number;
  
  /** Use cached discovery results */
  use_cache: boolean;
  
  /** Cache TTL in seconds */
  cache_ttl: number;
}

/**
 * Relationship discovery result
 */
export interface RelationshipDiscoveryResult {
  /** Service name analyzed */
  service_name: string;
  
  /** Table name analyzed */
  table_name: string;
  
  /** Discovered relationships */
  relationships: RelationshipSchema[];
  
  /** Discovery timestamp */
  discovered_at: string;
  
  /** Discovery method used */
  discovery_method: 'foreign_keys' | 'naming_convention' | 'manual';
  
  /** Discovery duration in milliseconds */
  discovery_duration_ms: number;
  
  /** Discovery warnings */
  warnings?: string[];
  
  /** Discovery errors */
  errors?: string[];
}

// =============================================================================
// REACT HOOK FORM INTEGRATION
// =============================================================================

/**
 * React Hook Form compatible relationship form data
 * Optimized for real-time validation under 100ms
 */
export interface RelationshipFormData {
  // Basic information
  name: string;
  alias: string;
  label: string;
  description: string;
  
  // Configuration
  type: RelationshipType;
  always_fetch: boolean;
  is_virtual: boolean;
  flatten: boolean;
  flatten_drop_prefix: boolean;
  
  // Local relationship
  local_field: string;
  
  // Foreign relationship
  foreign_service_id: string | number;
  foreign_table: string;
  foreign_field: string;
  
  // Junction table (conditional)
  junction_service_id: string | number | null;
  junction_table: string | null;
  junction_local_field: string | null;
  junction_foreign_field: string | null;
  
  // Integrity actions
  on_update: 'cascade' | 'restrict' | 'set_null' | 'set_default' | 'no_action';
  on_delete: 'cascade' | 'restrict' | 'set_null' | 'set_default' | 'no_action';
}

/**
 * React Hook Form configuration for relationship forms
 */
export type RelationshipFormReturn = UseFormReturn<RelationshipFormData>;

/**
 * Form field paths for type-safe field access
 */
export type RelationshipFormField = Path<RelationshipFormData>;

/**
 * Form validation modes for different use cases
 */
export type FormValidationMode = 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';

/**
 * Form submission states for UI feedback
 */
export type FormSubmissionState = 'idle' | 'submitting' | 'success' | 'error';

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Base validation schema for relationship types
 */
export const relationshipTypeSchema = z.enum(['belongs_to', 'has_many', 'has_one', 'many_many'], {
  required_error: 'Relationship type is required',
  invalid_type_error: 'Invalid relationship type'
});

/**
 * Integrity action validation schema
 */
export const integrityActionSchema = z.enum([
  'cascade', 'restrict', 'set_null', 'set_default', 'no_action'
], {
  required_error: 'Integrity action is required',
  invalid_type_error: 'Invalid integrity action'
});

/**
 * Comprehensive relationship form validation schema
 * Implements conditional validation based on relationship type
 */
export const relationshipFormSchema = z.object({
  // Basic information with enhanced validation
  name: z.string()
    .min(1, 'Relationship name is required')
    .max(64, 'Relationship name must be 64 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Name must start with a letter and contain only letters, numbers, and underscores'),
  
  alias: z.string()
    .max(64, 'Alias must be 64 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Alias must start with a letter and contain only letters, numbers, and underscores')
    .optional()
    .or(z.literal('')),
  
  label: z.string()
    .max(255, 'Label must be 255 characters or less')
    .optional()
    .or(z.literal('')),
  
  description: z.string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional()
    .or(z.literal('')),
  
  // Configuration flags
  type: relationshipTypeSchema,
  always_fetch: z.boolean().default(false),
  is_virtual: z.boolean().default(true),
  flatten: z.boolean().default(false),
  flatten_drop_prefix: z.boolean().default(false),
  
  // Local field (required for all types)
  local_field: z.string()
    .min(1, 'Local field is required')
    .max(64, 'Local field name must be 64 characters or less'),
  
  // Foreign relationship (required for all types)
  foreign_service_id: z.union([z.string(), z.number()])
    .refine(val => val !== null && val !== '', 'Foreign service is required'),
  
  foreign_table: z.string()
    .min(1, 'Foreign table is required')
    .max(64, 'Foreign table name must be 64 characters or less'),
  
  foreign_field: z.string()
    .min(1, 'Foreign field is required')
    .max(64, 'Foreign field name must be 64 characters or less'),
  
  // Junction table fields (conditional)
  junction_service_id: z.union([z.string(), z.number(), z.null()]).optional(),
  junction_table: z.string().max(64).nullable().optional(),
  junction_local_field: z.string().max(64).nullable().optional(),
  junction_foreign_field: z.string().max(64).nullable().optional(),
  
  // Integrity actions
  on_update: integrityActionSchema.default('restrict'),
  on_delete: integrityActionSchema.default('restrict')
})
.refine((data) => {
  // Many-to-many relationships require junction table configuration
  if (data.type === 'many_many') {
    return !!(
      data.junction_service_id &&
      data.junction_table &&
      data.junction_local_field &&
      data.junction_foreign_field
    );
  }
  return true;
}, {
  message: 'Junction table configuration is required for many-to-many relationships',
  path: ['junction_service_id']
})
.refine((data) => {
  // Non many-to-many relationships should not have junction configuration
  if (data.type !== 'many_many') {
    return !(
      data.junction_service_id ||
      data.junction_table ||
      data.junction_local_field ||
      data.junction_foreign_field
    );
  }
  return true;
}, {
  message: 'Junction table configuration is only applicable to many-to-many relationships',
  path: ['type']
});

/**
 * Schema for relationship discovery configuration
 */
export const relationshipDiscoveryConfigSchema = z.object({
  service_name: z.string().min(1, 'Service name is required'),
  table_name: z.string().min(1, 'Table name is required'),
  discovery_methods: z.array(z.enum(['foreign_keys', 'naming_convention', 'manual']))
    .min(1, 'At least one discovery method is required'),
  include_virtual: z.boolean().default(true),
  max_relationships: z.number().min(1).max(1000).default(100),
  timeout_ms: z.number().min(1000).max(60000).default(30000),
  use_cache: z.boolean().default(true),
  cache_ttl: z.number().min(60).max(3600).default(300)
});

// =============================================================================
// API INTEGRATION TYPES
// =============================================================================

/**
 * Relationship API endpoints configuration
 */
export interface RelationshipApiEndpoints {
  /** List relationships for a table */
  list: string;
  /** Create new relationship */
  create: string;
  /** Get relationship by ID */
  get: string;
  /** Update relationship */
  update: string;
  /** Delete relationship */
  delete: string;
  /** Discover relationships */
  discover: string;
  /** Validate relationship configuration */
  validate: string;
}

/**
 * Relationship list API response
 */
export type RelationshipListResponse = ApiListResponse<RelationshipSchema>;

/**
 * Relationship create API response
 */
export type RelationshipCreateResponse = ApiCreateResponse;

/**
 * Relationship update API response
 */
export type RelationshipUpdateResponse = ApiUpdateResponse;

/**
 * Relationship delete API response
 */
export type RelationshipDeleteResponse = ApiDeleteResponse;

/**
 * Relationship discovery API response
 */
export type RelationshipDiscoveryResponse = ApiResponse<RelationshipDiscoveryResult>;

/**
 * Relationship validation API response
 */
export interface RelationshipValidationResponse {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: string[];
  suggestions?: string[];
}

/**
 * API request options for relationship operations
 */
export interface RelationshipApiOptions {
  /** Service name */
  service_name: string;
  /** Table name */
  table_name: string;
  /** Include related metadata */
  include_metadata?: boolean;
  /** Validate configuration */
  validate?: boolean;
  /** Cache TTL for results */
  cache_ttl?: number;
}

// =============================================================================
// NEXT.JS ROUTING TYPES
// =============================================================================

/**
 * Next.js page parameters for relationship routes
 */
export interface RelationshipPageParams {
  /** Service name parameter */
  service: string;
  /** Table name parameter */
  table: string;
  /** Relationship ID (for edit/view) */
  relationshipId?: string;
}

/**
 * Next.js search parameters for relationship listing
 */
export interface RelationshipSearchParams {
  /** Filter by relationship type */
  type?: RelationshipType;
  /** Search query */
  search?: string;
  /** Sort field */
  sort?: string;
  /** Sort direction */
  order?: 'asc' | 'desc';
  /** Page number */
  page?: string;
  /** Items per page */
  limit?: string;
  /** Filter by foreign service */
  foreign_service?: string;
  /** Filter by virtual relationships */
  virtual_only?: string;
}

/**
 * Dynamic route generation helpers
 */
export interface RelationshipRoutes {
  /** List relationships for a table */
  list: (service: string, table: string) => string;
  /** Create new relationship */
  create: (service: string, table: string) => string;
  /** Edit relationship */
  edit: (service: string, table: string, relationshipId: string) => string;
  /** View relationship details */
  view: (service: string, table: string, relationshipId: string) => string;
}

// =============================================================================
// TANSTACK TABLE INTEGRATION
// =============================================================================

/**
 * Table column definitions for relationship listing
 */
export interface RelationshipTableColumn {
  /** Column identifier */
  id: string;
  /** Column header */
  header: string;
  /** Column accessor function */
  accessorKey?: keyof RelationshipSchema;
  /** Custom cell renderer */
  cell?: (info: any) => React.ReactNode;
  /** Column sorting */
  enableSorting?: boolean;
  /** Column filtering */
  enableColumnFilter?: boolean;
  /** Column width */
  size?: number;
  /** Column minimum width */
  minSize?: number;
  /** Column maximum width */
  maxSize?: number;
}

/**
 * TanStack Table configuration for relationship listing
 */
export interface RelationshipTableConfig extends TableConfiguration {
  /** Table columns */
  columns: ColumnDef<RelationshipSchema>[];
  /** Virtual scrolling configuration */
  virtualization?: {
    enabled: boolean;
    itemSize: number;
    overscan: number;
  };
  /** Pagination configuration */
  pagination?: {
    pageSize: number;
    pageSizeOptions: number[];
    showSizeSelector: boolean;
  };
  /** Filtering configuration */
  filtering?: {
    enabled: boolean;
    globalFilter: boolean;
    columnFilters: boolean;
  };
  /** Sorting configuration */
  sorting?: {
    enabled: boolean;
    multiSort: boolean;
    defaultSort?: Array<{
      id: string;
      desc: boolean;
    }>;
  };
}

/**
 * Table row selection state
 */
export interface RelationshipTableSelection {
  /** Selected row IDs */
  selectedRows: Record<string, boolean>;
  /** Select all state */
  isAllSelected: boolean;
  /** Partially selected state */
  isPartiallySelected: boolean;
  /** Selection handlers */
  toggleRow: (rowId: string) => void;
  toggleAll: () => void;
  clearSelection: () => void;
  getSelectedData: () => RelationshipSchema[];
}

// =============================================================================
// COMPONENT PROP INTERFACES
// =============================================================================

/**
 * Relationship form component props
 */
export interface RelationshipFormProps extends BaseComponent {
  /** Current relationship data (for editing) */
  relationship?: RelationshipSchema;
  /** Service options for dropdowns */
  serviceOptions: SelectOption[];
  /** Available local fields */
  localFields: SelectOption[];
  /** Form submission handler */
  onSubmit: (data: RelationshipFormData) => Promise<void>;
  /** Form cancellation handler */
  onCancel: () => void;
  /** Validation mode */
  validationMode?: FormValidationMode;
  /** Show advanced options */
  showAdvanced?: boolean;
  /** Read-only mode */
  readOnly?: boolean;
}

/**
 * Relationship table component props
 */
export interface RelationshipTableProps extends BaseComponent {
  /** Relationships to display */
  relationships: RelationshipSchema[];
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Table configuration */
  config?: Partial<RelationshipTableConfig>;
  /** Row click handler */
  onRowClick?: (relationship: RelationshipSchema) => void;
  /** Bulk action handlers */
  onBulkDelete?: (relationships: RelationshipSchema[]) => Promise<void>;
  /** Pagination state */
  pagination?: PaginationMeta;
  /** Page change handler */
  onPageChange?: (page: number) => void;
}

/**
 * Relationship type selector props
 */
export interface RelationshipTypeSelectorProps extends FormFieldProps {
  /** Current relationship type */
  value: RelationshipType;
  /** Type change handler */
  onChange: (type: RelationshipType) => void;
  /** Show descriptions */
  showDescriptions?: boolean;
  /** Disabled types */
  disabledTypes?: RelationshipType[];
}

/**
 * Junction table configurator props
 */
export interface JunctionTableConfigProps extends BaseComponent {
  /** Form control */
  form: RelationshipFormReturn;
  /** Available services */
  services: SelectOption[];
  /** Enabled state */
  enabled: boolean;
  /** Required state */
  required: boolean;
}

// =============================================================================
// HOOK INTERFACES
// =============================================================================

/**
 * Relationship management hook return type
 */
export interface UseRelationshipManagement {
  /** Current relationships */
  relationships: RelationshipSchema[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
  /** Create relationship */
  createRelationship: (data: RelationshipFormData) => Promise<RelationshipCreateResponse>;
  /** Update relationship */
  updateRelationship: (id: string, data: Partial<RelationshipFormData>) => Promise<RelationshipUpdateResponse>;
  /** Delete relationship */
  deleteRelationship: (id: string) => Promise<RelationshipDeleteResponse>;
  /** Discover relationships */
  discoverRelationships: (config: RelationshipDiscoveryConfig) => Promise<RelationshipDiscoveryResult>;
  /** Validate relationship */
  validateRelationship: (data: RelationshipFormData) => Promise<RelationshipValidationResponse>;
  /** Refresh relationships */
  refresh: () => Promise<void>;
}

/**
 * Relationship validation hook return type
 */
export interface UseRelationshipValidation {
  /** Validation state */
  validationState: ValidationState;
  /** Validation errors */
  errors: ValidationError[];
  /** Validation warnings */
  warnings: string[];
  /** Validate field */
  validateField: (field: RelationshipFormField, value: any) => Promise<ValidationError[]>;
  /** Validate form */
  validateForm: (data: RelationshipFormData) => Promise<RelationshipValidationResponse>;
  /** Clear validation */
  clearValidation: () => void;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Extract relationship type from union
 */
export type ExtractRelationshipType<T extends RelationshipType> = T;

/**
 * Junction table requirement based on relationship type
 */
export type JunctionRequirementForType<T extends RelationshipType> = 
  T extends 'many_many' ? 'required' : 'disabled';

/**
 * Form fields required for relationship type
 */
export type RequiredFieldsForType<T extends RelationshipType> = 
  T extends 'many_many' 
    ? RelationshipFormField[]
    : Exclude<RelationshipFormField, 'junction_service_id' | 'junction_table' | 'junction_local_field' | 'junction_foreign_field'>[];

/**
 * Relationship configuration validation rules
 */
export interface RelationshipValidationRules {
  /** Required fields validation */
  requiredFields: RelationshipFormField[];
  /** Custom validation functions */
  customValidations: Array<{
    field: RelationshipFormField;
    validator: (value: any, formData: RelationshipFormData) => Promise<boolean>;
    message: string;
  }>;
  /** Cross-field validation rules */
  crossFieldValidations: Array<{
    fields: RelationshipFormField[];
    validator: (formData: RelationshipFormData) => Promise<boolean>;
    message: string;
  }>;
}

// =============================================================================
// CONSTANTS AND DEFAULTS
// =============================================================================

/**
 * Default relationship form data
 */
export const DEFAULT_RELATIONSHIP_FORM_DATA: RelationshipFormData = {
  name: '',
  alias: '',
  label: '',
  description: '',
  type: 'belongs_to',
  always_fetch: false,
  is_virtual: true,
  flatten: false,
  flatten_drop_prefix: false,
  local_field: '',
  foreign_service_id: '',
  foreign_table: '',
  foreign_field: '',
  junction_service_id: null,
  junction_table: null,
  junction_local_field: null,
  junction_foreign_field: null,
  on_update: 'restrict',
  on_delete: 'restrict'
};

/**
 * Relationship type options for UI components
 */
export const RELATIONSHIP_TYPE_OPTIONS: Array<SelectOption & { description: string }> = [
  {
    value: 'belongs_to',
    label: 'Belongs To',
    description: 'This table belongs to another table (many-to-one relationship)'
  },
  {
    value: 'has_many',
    label: 'Has Many',
    description: 'This table has many records in another table (one-to-many relationship)'
  },
  {
    value: 'has_one',
    label: 'Has One',
    description: 'This table has one record in another table (one-to-one relationship)'
  },
  {
    value: 'many_many',
    label: 'Many to Many',
    description: 'This table has a many-to-many relationship through a junction table'
  }
];

/**
 * Integrity action options for UI components
 */
export const INTEGRITY_ACTION_OPTIONS: SelectOption[] = [
  { value: 'cascade', label: 'Cascade' },
  { value: 'restrict', label: 'Restrict' },
  { value: 'set_null', label: 'Set NULL' },
  { value: 'set_default', label: 'Set Default' },
  { value: 'no_action', label: 'No Action' }
];

/**
 * Default table configuration for relationship listing
 */
export const DEFAULT_RELATIONSHIP_TABLE_CONFIG: RelationshipTableConfig = {
  columns: [], // Will be populated by the component
  virtualization: {
    enabled: true,
    itemSize: 50,
    overscan: 10
  },
  pagination: {
    pageSize: 25,
    pageSizeOptions: [10, 25, 50, 100],
    showSizeSelector: true
  },
  filtering: {
    enabled: true,
    globalFilter: true,
    columnFilters: true
  },
  sorting: {
    enabled: true,
    multiSort: false,
    defaultSort: [{ id: 'name', desc: false }]
  }
};

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Core types
  RelationshipType,
  RelationshipStatus,
  JunctionRequirement,
  ValidationState,
  
  // Schema types
  RelationshipSchema,
  RelationshipDiscoveryConfig,
  RelationshipDiscoveryResult,
  
  // Form types
  RelationshipFormData,
  RelationshipFormReturn,
  RelationshipFormField,
  FormValidationMode,
  FormSubmissionState,
  
  // API types
  RelationshipApiEndpoints,
  RelationshipListResponse,
  RelationshipCreateResponse,
  RelationshipUpdateResponse,
  RelationshipDeleteResponse,
  RelationshipDiscoveryResponse,
  RelationshipValidationResponse,
  RelationshipApiOptions,
  
  // Routing types
  RelationshipPageParams,
  RelationshipSearchParams,
  RelationshipRoutes,
  
  // Table types
  RelationshipTableColumn,
  RelationshipTableConfig,
  RelationshipTableSelection,
  
  // Component types
  RelationshipFormProps,
  RelationshipTableProps,
  RelationshipTypeSelectorProps,
  JunctionTableConfigProps,
  
  // Hook types
  UseRelationshipManagement,
  UseRelationshipValidation,
  
  // Utility types
  ExtractRelationshipType,
  JunctionRequirementForType,
  RequiredFieldsForType,
  RelationshipValidationRules
};

export {
  // Validation schemas
  relationshipTypeSchema,
  integrityActionSchema,
  relationshipFormSchema,
  relationshipDiscoveryConfigSchema,
  
  // Constants
  DEFAULT_RELATIONSHIP_FORM_DATA,
  RELATIONSHIP_TYPE_OPTIONS,
  INTEGRITY_ACTION_OPTIONS,
  DEFAULT_RELATIONSHIP_TABLE_CONFIG
};