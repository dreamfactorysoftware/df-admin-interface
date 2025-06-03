/**
 * TypeScript type definitions for table field management components.
 * Defines interfaces compatible with React patterns, React Hook Form, Zod validation,
 * and DreamFactory API responses for table field data.
 */

import { z } from 'zod';
import type { ColumnDef } from '@tanstack/react-table';

/**
 * Database field interface from DreamFactory API responses
 * Maintains compatibility with existing backend contract for field schema
 */
export interface TableField {
  /** Field alias for API generation */
  alias?: string;
  /** Whether field accepts NULL values */
  allowNull: boolean;
  /** Auto-increment field flag */
  autoIncrement: boolean;
  /** Database function usage configurations */
  dbFunction?: Array<{
    use: string[];
    function: string;
  }>;
  /** Database-specific type (e.g., VARCHAR, INT) */
  dbType?: string;
  /** Field description for documentation */
  description?: string;
  /** Default value for the field */
  default?: string | number | boolean | null;
  /** Fixed-length field flag */
  fixedLength: boolean;
  /** Aggregate field flag for calculated values */
  isAggregate: boolean;
  /** Foreign key relationship flag */
  isForeignKey: boolean;
  /** Primary key flag */
  isPrimaryKey: boolean;
  /** Unique constraint flag */
  isUnique: boolean;
  /** Virtual field flag (computed/calculated) */
  isVirtual: boolean;
  /** Display label for UI components */
  label: string;
  /** Field length constraint */
  length?: number;
  /** Field name (database column name) */
  name: string;
  /** Native database-specific properties */
  native?: unknown[];
  /** Comma-separated picklist values */
  picklist?: string;
  /** Decimal precision for numeric fields */
  precision?: number;
  /** Referenced field name for foreign keys */
  refField?: string;
  /** Referenced table name for foreign keys */
  refTable?: string;
  /** ON DELETE action for foreign key constraints */
  refOnDelete?: string;
  /** ON UPDATE action for foreign key constraints */
  refOnUpdate?: string;
  /** Required field validation flag */
  required: boolean;
  /** Decimal scale for numeric fields */
  scale: number;
  /** Multi-byte character support flag */
  supportsMultibyte: boolean;
  /** DreamFactory field type (string, integer, boolean, etc.) */
  type: string;
  /** JSON validation rules string */
  validation?: string;
  /** Field value array for complex types */
  value?: unknown[];
}

/**
 * Simplified field row interface for table display
 * Optimized for table rendering performance
 */
export interface FieldTableRow {
  /** Unique field identifier */
  id: string;
  /** Field name (database column name) */
  name: string;
  /** Field alias for display */
  alias: string;
  /** Display label */
  label: string;
  /** DreamFactory field type */
  type: string;
  /** Database-specific type */
  dbType: string;
  /** Whether field is virtual */
  isVirtual: boolean;
  /** Whether field is required */
  required: boolean;
  /** Whether field is primary key */
  isPrimaryKey: boolean;
  /** Whether field is foreign key */
  isForeignKey: boolean;
  /** Whether field is unique */
  isUnique: boolean;
  /** Field length constraint */
  length?: number;
  /** Default value */
  default?: string | number | boolean;
  /** Field description */
  description?: string;
  /** Constraints summary for display */
  constraints: string;
}

/**
 * API response wrapper for fields data
 * Maintains compatibility with DreamFactory response structure
 */
export interface FieldsResponse {
  /** Array of field resources */
  resource: TableField[];
  /** Optional metadata */
  meta?: {
    /** Total count of fields */
    count?: number;
    /** Pagination schema */
    schema?: string;
  };
}

/**
 * Field filters for table queries
 * Type-safe filtering with Zod validation
 */
export interface FieldFilters {
  /** Filter by field type */
  type?: string;
  /** Show only virtual fields */
  virtualOnly?: boolean;
  /** Show only required fields */
  requiredOnly?: boolean;
  /** Show only primary key fields */
  primaryKeyOnly?: boolean;
  /** Show only foreign key fields */
  foreignKeyOnly?: boolean;
  /** Search by name, alias, or label */
  search?: string;
}

/**
 * Zod schema for field filtering
 * Ensures type safety and runtime validation
 */
export const fieldFiltersSchema = z.object({
  type: z.string().optional(),
  virtualOnly: z.boolean().optional(),
  requiredOnly: z.boolean().optional(),
  primaryKeyOnly: z.boolean().optional(),
  foreignKeyOnly: z.boolean().optional(),
  search: z.string().optional(),
}).strict();

/**
 * Route parameters for field table pages
 * Next.js dynamic routing support
 */
export interface FieldTableParams {
  /** Database service name */
  service: string;
  /** Table identifier */
  tableId: string;
}

/**
 * Field table actions configuration
 * For table action buttons and menus
 */
export interface FieldTableActions {
  /** View field details */
  view: {
    enabled: boolean;
    handler: (row: FieldTableRow) => void;
  };
  /** Edit field */
  edit: {
    enabled: boolean;
    handler: (row: FieldTableRow) => void;
  };
  /** Delete field */
  delete: {
    enabled: boolean;
    handler: (row: FieldTableRow) => Promise<void>;
  };
  /** Create new field */
  create: {
    enabled: boolean;
    handler: () => void;
  };
  /** Clone field */
  clone: {
    enabled: boolean;
    handler: (row: FieldTableRow) => void;
  };
}

/**
 * Table column configuration for fields
 * TanStack Table column definitions
 */
export interface FieldTableColumn extends ColumnDef<FieldTableRow> {
  /** Column identifier */
  id: string;
  /** Column header label */
  header: string;
  /** Cell accessor function */
  accessorKey?: keyof FieldTableRow;
  /** Custom cell renderer */
  cell?: (props: { getValue: () => any; row: { original: FieldTableRow } }) => React.ReactNode;
  /** Column sorting capability */
  enableSorting: boolean;
  /** Column filtering capability */
  enableColumnFilter: boolean;
  /** Column width configuration */
  size?: number;
  /** Minimum column width */
  minSize?: number;
  /** Maximum column width */
  maxSize?: number;
}

/**
 * Field table state management
 * For managing table interactions and state
 */
export interface FieldTableState {
  /** Currently selected rows */
  selectedRows: FieldTableRow[];
  /** Current sort configuration */
  sorting: Array<{
    id: string;
    desc: boolean;
  }>;
  /** Current filter values */
  filters: FieldFilters;
  /** Pagination state */
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  /** Loading states */
  loading: {
    data: boolean;
    delete: boolean;
    refresh: boolean;
  };
}

/**
 * Field error handling
 * Comprehensive error types for field operations
 */
export interface FieldError {
  /** Error type classification */
  type: 'validation' | 'network' | 'authorization' | 'constraint' | 'unknown';
  /** Error message */
  message: string;
  /** Technical error details */
  details?: string;
  /** Affected field name */
  fieldName?: string;
  /** Recovery suggestions */
  suggestions?: string[];
  /** Error code from backend */
  code?: string;
}

/**
 * React Query cache keys for fields
 * Consistent cache key patterns
 */
export const fieldQueryKeys = {
  /** All fields for a table */
  all: (service: string, tableId: string) => ['fields', service, tableId] as const,
  /** Specific field detail */
  detail: (service: string, tableId: string, fieldName: string) => 
    ['fields', service, tableId, fieldName] as const,
  /** Field constraints validation */
  validation: (service: string, tableId: string) => 
    ['fields', 'validation', service, tableId] as const,
} as const;

/**
 * Type for field query keys
 * Ensures type safety for React Query operations
 */
export type FieldQueryKey = ReturnType<
  typeof fieldQueryKeys[keyof typeof fieldQueryKeys]
>;

/**
 * Field table configuration for customizable displays
 * TanStack Table and virtualization configuration
 */
export interface FieldTableConfig {
  /** Enable virtualization for large datasets */
  enableVirtualization: boolean;
  /** Page size for pagination */
  pageSize: number;
  /** Enable sorting */
  enableSorting: boolean;
  /** Enable filtering */
  enableFiltering: boolean;
  /** Enable column resizing */
  enableColumnResizing: boolean;
  /** Enable row selection */
  enableRowSelection: boolean;
  /** Estimated row height for virtualization */
  estimateSize: number;
  /** Overscan count for virtualization */
  overscan: number;
}

/**
 * Field management context type
 * For sharing state across field components
 */
export interface FieldManagementContext {
  /** Service name */
  serviceName: string;
  /** Table name */
  tableName: string;
  /** Available field types */
  availableTypes: string[];
  /** Table configuration */
  tableConfig: FieldTableConfig;
  /** Permission flags */
  permissions: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canView: boolean;
  };
}