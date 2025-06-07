/**
 * Comprehensive TypeScript type definitions for database relationship management
 * adapted for React patterns. Provides type-safe configuration workflows,
 * React Hook Form compatibility, and Zod validation integration.
 * 
 * Maintains compatibility with DreamFactory relationship schema requirements
 * while leveraging React 19 and Next.js 15.1+ capabilities.
 * 
 * @fileoverview Database relationship type definitions for React/Next.js application
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { z } from 'zod';
import type { 
  ControllerRenderProps, 
  FieldPath, 
  FieldValues, 
  UseFormReturn,
  FieldError,
  FieldErrorsImpl,
  Merge
} from 'react-hook-form';
import type { ColumnDef } from '@tanstack/react-table';
import type { VirtualItem } from '@tanstack/react-virtual';

// Re-export relevant types from dependencies for convenience
import type { BaseApiResponse, PaginatedResponse } from '../../../types/api';
import type { SchemaTable, SchemaField } from '../../../types/schema';
import type { BaseComponent, TableColumn } from '../../../types/ui';

// ============================================================================
// CORE RELATIONSHIP TYPES
// ============================================================================

/**
 * Database relationship types supported by DreamFactory
 * Based on existing Angular component functionality
 */
export type RelationshipType = 
  | 'belongs_to'   // Child record belongs to parent record (many-to-one)
  | 'has_many'     // Parent record has many child records (one-to-many)
  | 'has_one'      // Parent record has one child record (one-to-one)
  | 'many_many';   // Many-to-many with junction table

/**
 * Relationship type configuration metadata
 * Provides UI display information and validation rules
 */
export interface RelationshipTypeConfig {
  value: RelationshipType;
  label: string;
  description: string;
  requiresJunctionTable: boolean;
  supportedCardinalities: string[];
  icon?: string;
}

/**
 * Junction table configuration for many-to-many relationships
 * Enables proper foreign key linking through intermediate table
 */
export interface JunctionTableConfig {
  /** Junction service ID (must be database service) */
  serviceId: number;
  /** Junction service name for display */
  serviceName: string;
  /** Junction table name */
  tableName: string;
  /** Field in junction table linking to source table */
  sourceField: string;
  /** Field in junction table linking to reference table */
  referenceField: string;
  /** Additional junction table metadata */
  metadata?: {
    primaryKey?: string[];
    additionalFields?: string[];
    constraints?: string[];
  };
}

// ============================================================================
// RELATIONSHIP SCHEMA DEFINITIONS
// ============================================================================

/**
 * Core relationship configuration matching DreamFactory schema requirements
 * Extends existing Angular form structure with enhanced type safety
 */
export interface RelationshipSchema {
  /** Relationship identifier (generated from table_field pattern) */
  id?: string;
  /** Relationship name (auto-generated, typically table_field format) */
  name: string;
  /** User-friendly alias for the relationship */
  alias?: string;
  /** Display label for UI components */
  label?: string;
  /** Optional description explaining the relationship purpose */
  description?: string;
  /** Whether to always fetch related data (performance consideration) */
  alwaysFetch: boolean;
  /** Relationship type determining behavior and requirements */
  type: RelationshipType;
  /** Virtual relationship flag (always true for DreamFactory) */
  isVirtual: boolean;
  
  // Source table configuration
  /** Source table field creating the relationship */
  field: string;
  /** Source table name (derived from context) */
  sourceTable?: string;
  /** Source service ID (derived from context) */
  sourceServiceId?: number;
  
  // Reference table configuration
  /** Target service ID for the relationship */
  refServiceId: number;
  /** Target service name for display purposes */
  refServiceName?: string;
  /** Target table name */
  refTable: string;
  /** Target field in the referenced table */
  refField: string;
  
  // Junction table configuration (for many_many relationships)
  /** Junction table configuration (required for many_many) */
  junctionTable?: JunctionTableConfig;
  
  // Metadata and state
  /** Creation timestamp */
  createdAt?: string;
  /** Last modification timestamp */
  updatedAt?: string;
  /** Relationship validation status */
  isValid?: boolean;
  /** Relationship active status */
  isActive?: boolean;
}

/**
 * Relationship listing item for table display
 * Optimized for TanStack Table virtualization
 */
export interface RelationshipListItem {
  id: string;
  name: string;
  alias?: string;
  label?: string;
  type: RelationshipType;
  sourceField: string;
  targetTable: string;
  targetField: string;
  isVirtual: boolean;
  alwaysFetch: boolean;
  junctionTable?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Display helpers
  typeLabel: string;
  relationshipPath: string;
  hasJunctionTable: boolean;
}

// ============================================================================
// FORM DATA STRUCTURES
// ============================================================================

/**
 * React Hook Form compatible relationship form data
 * Provides strict typing for form state management
 */
export interface RelationshipFormData {
  // Basic information
  name: string;
  alias: string;
  label: string;
  description: string;
  alwaysFetch: boolean;
  type: RelationshipType;
  isVirtual: boolean;
  
  // Source configuration
  field: string;
  
  // Reference configuration
  refServiceId: number;
  refTable: string;
  refField: string;
  
  // Junction configuration (for many_many)
  junctionServiceId?: number;
  junctionTable?: string;
  junctionField?: string;
  junctionRefField?: string;
}

/**
 * Form field validation error types
 * Enhanced with relationship-specific validation messages
 */
export interface RelationshipFormErrors {
  name?: FieldError;
  alias?: FieldError;
  label?: FieldError;
  description?: FieldError;
  type?: FieldError;
  field?: FieldError;
  refServiceId?: FieldError;
  refTable?: FieldError;
  refField?: FieldError;
  junctionServiceId?: FieldError;
  junctionTable?: FieldError;
  junctionField?: FieldError;
  junctionRefField?: FieldError;
  // Global form errors
  root?: FieldError;
}

/**
 * Form state management interface
 * Integrates with React Hook Form for optimal performance
 */
export interface RelationshipFormState {
  data: RelationshipFormData;
  errors: RelationshipFormErrors;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
  
  // Dynamic field states
  isJunctionEnabled: boolean;
  availableFields: BasicOption[];
  availableServices: ServiceOption[];
  availableTables: BasicOption[];
  availableRefFields: BasicOption[];
  availableJunctionTables: BasicOption[];
  availableJunctionFields: BasicOption[];
}

// ============================================================================
// DROPDOWN AND SELECTION TYPES
// ============================================================================

/**
 * Basic option interface for form dropdowns
 * Compatible with existing Angular component patterns
 */
export interface BasicOption {
  label: string;
  value: string | number;
  name?: string;
  disabled?: boolean;
  description?: string;
}

/**
 * Enhanced service option with additional metadata
 * Supports service type and connection status display
 */
export interface ServiceOption extends BasicOption {
  value: number;
  name: string;
  type: string;
  group: string;
  isActive: boolean;
  connectionStatus?: 'connected' | 'disconnected' | 'testing';
  icon?: string;
}

/**
 * Table option with schema information
 * Enables informed table selection with metadata
 */
export interface TableOption extends BasicOption {
  value: string;
  serviceName: string;
  schemaName?: string;
  fieldCount: number;
  hasRelationships: boolean;
  tableType: 'table' | 'view';
}

/**
 * Field option with type and constraint information
 * Supports intelligent field selection and validation
 */
export interface FieldOption extends BasicOption {
  value: string;
  dataType: string;
  isRequired: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  maxLength?: number;
  defaultValue?: any;
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Base relationship validation schema
 * Provides runtime type checking with compile-time inference
 */
export const RelationshipBaseSchema = z.object({
  name: z.string()
    .min(1, 'Relationship name is required')
    .max(64, 'Relationship name must be 64 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Name must start with letter and contain only letters, numbers, and underscores'),
  
  alias: z.string()
    .max(64, 'Alias must be 64 characters or less')
    .optional()
    .or(z.literal('')),
  
  label: z.string()
    .max(128, 'Label must be 128 characters or less')
    .optional()
    .or(z.literal('')),
  
  description: z.string()
    .max(512, 'Description must be 512 characters or less')
    .optional()
    .or(z.literal('')),
  
  alwaysFetch: z.boolean().default(false),
  
  type: z.enum(['belongs_to', 'has_many', 'has_one', 'many_many'], {
    required_error: 'Relationship type is required',
    invalid_type_error: 'Invalid relationship type'
  }),
  
  isVirtual: z.boolean().default(true),
  
  field: z.string()
    .min(1, 'Source field is required')
    .max(64, 'Field name must be 64 characters or less'),
  
  refServiceId: z.number()
    .int('Service ID must be an integer')
    .positive('Service ID must be positive'),
  
  refTable: z.string()
    .min(1, 'Reference table is required')
    .max(64, 'Table name must be 64 characters or less'),
  
  refField: z.string()
    .min(1, 'Reference field is required')
    .max(64, 'Field name must be 64 characters or less'),
});

/**
 * Junction table validation schema for many-to-many relationships
 * Conditionally required based on relationship type
 */
export const JunctionTableSchema = z.object({
  junctionServiceId: z.number()
    .int('Junction service ID must be an integer')
    .positive('Junction service ID must be positive'),
  
  junctionTable: z.string()
    .min(1, 'Junction table is required')
    .max(64, 'Junction table name must be 64 characters or less'),
  
  junctionField: z.string()
    .min(1, 'Junction field is required')
    .max(64, 'Junction field name must be 64 characters or less'),
  
  junctionRefField: z.string()
    .min(1, 'Junction reference field is required')
    .max(64, 'Junction reference field name must be 64 characters or less'),
});

/**
 * Complete relationship form validation schema
 * Implements conditional validation based on relationship type
 */
export const RelationshipFormSchema = RelationshipBaseSchema.extend({
  junctionServiceId: z.number().optional(),
  junctionTable: z.string().optional(),
  junctionField: z.string().optional(),
  junctionRefField: z.string().optional(),
}).superRefine((data, ctx) => {
  // Validate junction table requirements for many_many relationships
  if (data.type === 'many_many') {
    const junctionResult = JunctionTableSchema.safeParse({
      junctionServiceId: data.junctionServiceId,
      junctionTable: data.junctionTable,
      junctionField: data.junctionField,
      junctionRefField: data.junctionRefField,
    });
    
    if (!junctionResult.success) {
      junctionResult.error.issues.forEach(issue => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: issue.path,
          message: issue.message,
        });
      });
    }
  }
  
  // Validate that source and reference fields are different
  if (data.field === data.refField && data.refTable) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['refField'],
      message: 'Reference field must be different from source field',
    });
  }
});

/**
 * Relationship query parameters schema for API requests
 * Supports filtering, sorting, and pagination
 */
export const RelationshipQuerySchema = z.object({
  serviceName: z.string().min(1, 'Service name is required'),
  tableName: z.string().min(1, 'Table name is required'),
  
  // Filtering
  filter: z.string().optional(),
  type: z.enum(['belongs_to', 'has_many', 'has_one', 'many_many']).optional(),
  
  // Sorting
  sortBy: z.enum(['name', 'type', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  
  // Pagination
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(25),
  
  // Virtual scrolling
  offset: z.number().int().min(0).optional(),
  virtual: z.boolean().default(false),
});

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Relationship API response from DreamFactory
 * Maintains compatibility with existing backend response format
 */
export interface RelationshipApiResponse extends BaseApiResponse {
  resource: RelationshipSchema[];
  meta?: {
    count: number;
    totalCount?: number;
    hasMore?: boolean;
  };
}

/**
 * Individual relationship response for create/update operations
 * Includes validation status and metadata
 */
export interface RelationshipResponse extends BaseApiResponse {
  resource: RelationshipSchema;
  validation?: {
    isValid: boolean;
    errors?: string[];
    warnings?: string[];
  };
}

/**
 * Relationship deletion response
 * Confirms successful removal and cleanup
 */
export interface RelationshipDeleteResponse extends BaseApiResponse {
  deleted: boolean;
  relationshipName: string;
  cascadeDeleted?: string[];
}

/**
 * Paginated relationship listing response
 * Optimized for TanStack Virtual table rendering
 */
export interface RelationshipListResponse extends PaginatedResponse {
  resource: RelationshipListItem[];
  virtualScrolling?: {
    totalEstimatedSize: number;
    itemSize: number;
    overscan: number;
  };
}

// ============================================================================
// NAVIGATION AND ROUTING TYPES
// ============================================================================

/**
 * Next.js route parameters for relationship management
 * Supports type-safe navigation and parameter extraction
 */
export interface RelationshipRouteParams {
  serviceName: string;
  tableName: string;
  relationshipId?: string;
}

/**
 * Search parameters for relationship filtering and sorting
 * Compatible with Next.js searchParams API
 */
export interface RelationshipSearchParams {
  filter?: string;
  type?: RelationshipType;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: string;
  limit?: string;
}

/**
 * Navigation context for relationship management
 * Provides breadcrumb and navigation state
 */
export interface RelationshipNavigationContext {
  serviceName: string;
  tableName: string;
  relationshipId?: string;
  mode: 'list' | 'create' | 'edit' | 'view';
  
  // Breadcrumb information
  breadcrumbs: Array<{
    label: string;
    href: string;
    isActive: boolean;
  }>;
  
  // Navigation actions
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
}

// ============================================================================
// TABLE AND UI COMPONENT TYPES
// ============================================================================

/**
 * TanStack Table column configuration for relationship listing
 * Supports virtualization and custom cell rendering
 */
export interface RelationshipTableColumn extends ColumnDef<RelationshipListItem> {
  id: keyof RelationshipListItem | 'actions';
  header: string;
  size?: number;
  minSize?: number;
  maxSize?: number;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableResizing?: boolean;
}

/**
 * Virtual scrolling configuration for large relationship datasets
 * Optimized for 1000+ relationships per table
 */
export interface RelationshipVirtualConfig {
  enabled: boolean;
  itemHeight: number;
  overscan: number;
  scrollMargin: number;
  estimatedItemHeight: number;
  measureElement?: (element: Element) => number;
}

/**
 * Relationship table state management
 * Integrates with TanStack Table and Virtual for optimal performance
 */
export interface RelationshipTableState {
  data: RelationshipListItem[];
  loading: boolean;
  error?: string;
  
  // Filtering and sorting
  filters: Record<string, any>;
  sorting: Array<{ id: string; desc: boolean }>;
  
  // Pagination and virtualization
  pagination: {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    totalItems: number;
  };
  
  virtualItems?: VirtualItem[];
  
  // Selection state
  selectedRows: Set<string>;
  
  // UI state
  columnVisibility: Record<string, boolean>;
  columnSizing: Record<string, number>;
}

/**
 * Relationship form component props
 * Provides type-safe prop interface for React components
 */
export interface RelationshipFormProps extends BaseComponent {
  mode: 'create' | 'edit';
  initialData?: Partial<RelationshipFormData>;
  serviceName: string;
  tableName: string;
  onSubmit: (data: RelationshipFormData) => Promise<void>;
  onCancel: () => void;
  
  // Form configuration
  enableJunctionTable?: boolean;
  availableServices?: ServiceOption[];
  availableFields?: FieldOption[];
  
  // Validation configuration
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit';
  revalidateMode?: 'onChange' | 'onBlur';
}

/**
 * Relationship list component props
 * Supports filtering, sorting, and navigation
 */
export interface RelationshipListProps extends BaseComponent {
  serviceName: string;
  tableName: string;
  relationships: RelationshipListItem[];
  loading?: boolean;
  error?: string;
  
  // Table configuration
  enableVirtualization?: boolean;
  enableFiltering?: boolean;
  enableSorting?: boolean;
  enableSelection?: boolean;
  
  // Event handlers
  onCreateNew?: () => void;
  onEdit?: (relationshipId: string) => void;
  onDelete?: (relationshipId: string) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  
  // Pagination
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
}

// ============================================================================
// HOOK AND STATE MANAGEMENT TYPES
// ============================================================================

/**
 * Relationship management hook return type
 * Provides comprehensive relationship CRUD operations
 */
export interface UseRelationshipManagementReturn {
  // Data state
  relationships: RelationshipListItem[];
  currentRelationship?: RelationshipSchema;
  loading: boolean;
  error?: string;
  
  // CRUD operations
  createRelationship: (data: RelationshipFormData) => Promise<RelationshipSchema>;
  updateRelationship: (id: string, data: Partial<RelationshipFormData>) => Promise<RelationshipSchema>;
  deleteRelationship: (id: string) => Promise<void>;
  getRelationship: (id: string) => Promise<RelationshipSchema>;
  
  // List operations
  refreshRelationships: () => Promise<void>;
  filterRelationships: (filter: string) => void;
  sortRelationships: (field: keyof RelationshipListItem, order: 'asc' | 'desc') => void;
  
  // Validation operations
  validateRelationship: (data: RelationshipFormData) => Promise<boolean>;
  testJunctionTable: (config: JunctionTableConfig) => Promise<boolean>;
}

/**
 * Relationship form validation hook return type
 * Provides real-time validation under 100ms requirement
 */
export interface UseRelationshipValidationReturn {
  // Validation state
  isValid: boolean;
  errors: RelationshipFormErrors;
  warnings: string[];
  
  // Validation functions
  validateField: (field: keyof RelationshipFormData, value: any) => Promise<FieldError | undefined>;
  validateForm: (data: RelationshipFormData) => Promise<RelationshipFormErrors>;
  clearErrors: () => void;
  
  // Async validation
  validateRelationshipName: (name: string) => Promise<boolean>;
  validateFieldExists: (serviceName: string, tableName: string, fieldName: string) => Promise<boolean>;
  validateJunctionConfig: (config: Partial<JunctionTableConfig>) => Promise<boolean>;
}

// ============================================================================
// EXPORT UTILITIES AND TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a relationship requires junction table
 */
export const requiresJunctionTable = (type: RelationshipType): boolean => {
  return type === 'many_many';
};

/**
 * Type guard to validate relationship schema
 */
export const isValidRelationshipSchema = (data: any): data is RelationshipSchema => {
  return RelationshipBaseSchema.safeParse(data).success;
};

/**
 * Type guard to validate form data
 */
export const isValidRelationshipFormData = (data: any): data is RelationshipFormData => {
  return RelationshipFormSchema.safeParse(data).success;
};

/**
 * Default relationship type configurations
 * Provides metadata for UI components and validation
 */
export const RELATIONSHIP_TYPE_CONFIGS: Record<RelationshipType, RelationshipTypeConfig> = {
  belongs_to: {
    value: 'belongs_to',
    label: 'Belongs To',
    description: 'Child record belongs to parent record (many-to-one)',
    requiresJunctionTable: false,
    supportedCardinalities: ['many-to-one'],
    icon: 'arrow-up-right',
  },
  has_many: {
    value: 'has_many',
    label: 'Has Many',
    description: 'Parent record has many child records (one-to-many)',
    requiresJunctionTable: false,
    supportedCardinalities: ['one-to-many'],
    icon: 'arrow-down-right',
  },
  has_one: {
    value: 'has_one',
    label: 'Has One',
    description: 'Parent record has one child record (one-to-one)',
    requiresJunctionTable: false,
    supportedCardinalities: ['one-to-one'],
    icon: 'arrow-right',
  },
  many_many: {
    value: 'many_many',
    label: 'Many To Many',
    description: 'Many-to-many relationship through junction table',
    requiresJunctionTable: true,
    supportedCardinalities: ['many-to-many'],
    icon: 'arrows-right-left',
  },
};

/**
 * Default form values for relationship creation
 */
export const DEFAULT_RELATIONSHIP_FORM_DATA: Partial<RelationshipFormData> = {
  alwaysFetch: false,
  isVirtual: true,
  alias: '',
  label: '',
  description: '',
};

// Type exports for external consumption
export type {
  // Core types
  RelationshipType,
  RelationshipSchema,
  RelationshipListItem,
  
  // Form types
  RelationshipFormData,
  RelationshipFormErrors,
  RelationshipFormState,
  
  // API types
  RelationshipApiResponse,
  RelationshipResponse,
  RelationshipListResponse,
  
  // UI types
  RelationshipFormProps,
  RelationshipListProps,
  RelationshipTableState,
  
  // Navigation types
  RelationshipRouteParams,
  RelationshipSearchParams,
  RelationshipNavigationContext,
  
  // Hook types
  UseRelationshipManagementReturn,
  UseRelationshipValidationReturn,
};