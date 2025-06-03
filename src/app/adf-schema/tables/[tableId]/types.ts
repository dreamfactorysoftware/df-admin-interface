/**
 * TypeScript type definitions for table relationship management components.
 * Defines interfaces compatible with React patterns, React Hook Form, Zod validation,
 * and DreamFactory API responses for table relationship data.
 */

import { z } from 'zod';

/**
 * Table relationship interface from DreamFactory API responses
 * Maintains compatibility with existing backend contract
 */
export interface TableRelated {
  /** Alias name for the relationship */
  alias?: string;
  /** Relationship name identifier */
  name: string;
  /** Display label for the relationship */
  label: string;
  /** Optional description of the relationship */
  description?: string;
  /** Native database metadata */
  native: any[];
  /** Type of relationship (belongs_to, has_many, etc.) */
  type: string;
  /** Field name in current table */
  field: string;
  /** Whether relationship is virtual */
  isVirtual: boolean;
  /** Referenced service ID */
  refServiceID: number;
  /** Referenced table name */
  refTable: string;
  /** Referenced field name */
  refField: string;
  /** ON UPDATE constraint action */
  refOnUpdate: string;
  /** ON DELETE constraint action */
  refOnDelete: string;
  /** Junction service ID for many-to-many */
  junctionServiceID?: number;
  /** Junction table for many-to-many */
  junctionTable?: string;
  /** Junction field name */
  junctionField?: string;
  /** Junction reference field name */
  junctionRefField?: string;
  /** Whether to always fetch related data */
  alwaysFetch: boolean;
  /** Whether to flatten related data */
  flatten: boolean;
  /** Whether to drop prefix when flattening */
  flattenDropPrefix: boolean;
}

/**
 * Simplified relationship row interface for table display
 * Optimized for table rendering performance
 */
export interface RelationshipsRow {
  /** Relationship name identifier */
  name: string;
  /** Alias name for display */
  alias: string;
  /** Relationship type */
  type: string;
  /** Virtual relationship indicator */
  isVirtual: boolean;
}

/**
 * API response wrapper for relationships data
 * Maintains compatibility with DreamFactory response structure
 */
export interface RelationshipsResponse {
  /** Array of relationship resources */
  resource: TableRelated[];
  /** Optional metadata */
  meta?: {
    /** Total count of relationships */
    count?: number;
    /** Pagination schema */
    schema?: string;
  };
}

/**
 * Table relationship visualization options
 * Enhanced for interactive relationship mapping
 */
export interface RelationshipVisualizationOptions {
  /** Show relationship direction arrows */
  showDirections: boolean;
  /** Highlight constraint violations */
  highlightConstraints: boolean;
  /** Group by relationship type */
  groupByType: boolean;
  /** Show virtual relationships */
  showVirtual: boolean;
}

/**
 * Relationship constraint validation result
 * For real-time validation feedback
 */
export interface RelationshipConstraintValidation {
  /** Whether constraint is valid */
  isValid: boolean;
  /** Validation error message */
  error?: string;
  /** Warning messages */
  warnings?: string[];
  /** Field causing the constraint issue */
  field?: string;
}

/**
 * Relationship filter parameters for table queries
 * Type-safe filtering with Zod validation
 */
export interface RelationshipFilters {
  /** Filter by relationship type */
  type?: string;
  /** Show only virtual relationships */
  virtualOnly?: boolean;
  /** Search by name or alias */
  search?: string;
  /** Filter by constraint actions */
  constraintActions?: string[];
}

/**
 * Zod schema for relationship filtering
 * Ensures type safety and runtime validation
 */
export const relationshipFiltersSchema = z.object({
  type: z.string().optional(),
  virtualOnly: z.boolean().optional(),
  search: z.string().optional(),
  constraintActions: z.array(z.string()).optional(),
}).strict();

/**
 * Route parameters for relationship table pages
 * Next.js dynamic routing support
 */
export interface RelationshipTableParams {
  /** Database service name */
  service: string;
  /** Table identifier */
  tableId: string;
}

/**
 * Relationship table actions configuration
 * For table action buttons and menus
 */
export interface RelationshipTableActions {
  /** View relationship details */
  view: {
    enabled: boolean;
    handler: (row: RelationshipsRow) => void;
  };
  /** Edit relationship */
  edit: {
    enabled: boolean;
    handler: (row: RelationshipsRow) => void;
  };
  /** Delete relationship */
  delete: {
    enabled: boolean;
    handler: (row: RelationshipsRow) => Promise<void>;
  };
  /** Create new relationship */
  create: {
    enabled: boolean;
    handler: () => void;
  };
}

/**
 * Table column configuration for relationships
 * TanStack Table column definitions
 */
export interface RelationshipTableColumn {
  /** Column identifier */
  id: string;
  /** Column header label */
  header: string;
  /** Cell accessor function */
  accessorKey?: keyof RelationshipsRow;
  /** Custom cell renderer */
  cell?: (props: { getValue: () => any; row: { original: RelationshipsRow } }) => React.ReactNode;
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
 * Relationship table state management
 * For managing table interactions and state
 */
export interface RelationshipTableState {
  /** Currently selected rows */
  selectedRows: RelationshipsRow[];
  /** Current sort configuration */
  sorting: Array<{
    id: string;
    desc: boolean;
  }>;
  /** Current filter values */
  filters: RelationshipFilters;
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
 * Relationship error handling
 * Comprehensive error types for relationship operations
 */
export interface RelationshipError {
  /** Error type classification */
  type: 'validation' | 'network' | 'authorization' | 'constraint' | 'unknown';
  /** Error message */
  message: string;
  /** Technical error details */
  details?: string;
  /** Affected relationship name */
  relationshipName?: string;
  /** Recovery suggestions */
  suggestions?: string[];
  /** Error code from backend */
  code?: string;
}

/**
 * React Query cache keys for relationships
 * Consistent cache key patterns
 */
export const relationshipQueryKeys = {
  /** All relationships for a table */
  all: (service: string, tableId: string) => ['relationships', service, tableId] as const,
  /** Specific relationship detail */
  detail: (service: string, tableId: string, relationshipName: string) => 
    ['relationships', service, tableId, relationshipName] as const,
  /** Relationship constraints validation */
  validation: (service: string, tableId: string) => 
    ['relationships', 'validation', service, tableId] as const,
} as const;

/**
 * Type for relationship query keys
 * Ensures type safety for React Query operations
 */
export type RelationshipQueryKey = ReturnType<
  typeof relationshipQueryKeys[keyof typeof relationshipQueryKeys]
>;